---
author: Pedro Santos
pubDatetime: 2026-03-31T11:00:00.000Z
title: Predileto '#13 - Scoped Concurrency in Async Python Workers
slug: scoped-concurrency-in-async-python-workers
featured: false
draft: false
tags:
  - python
  - async
  - asyncio
  - architecture
  - concurrency
  - real-estate
description: How we built a gather_with_concurrency utility to parallelize Google Places API calls inside an SQS worker — and why scoped semaphores are safe in single-loop async architectures.
category: Software Development
---

We had a property amenity discovery use case that made 14 sequential HTTP calls to the Google Places API. Each call took 1–5 seconds. A single property took 45–90 seconds to process. We fixed it with a 20-line utility function — but the interesting part is understanding *why* it's safe inside our async worker architecture.

## Table of contents

## The problem: sequential awaits in a loop

Our `DiscoverPropertyAmenities` use case searches for 9 categories of nearby places (hospitals, banks, schools, pharmacies, etc.) for each property. The grocery category alone makes 6 sub-searches (one per Portuguese supermarket chain plus a generic search).

The original code was a straightforward `for` loop:

```python
for category in AmenityCategory:  # 9 categories
    places = await self.places_service.find_nearby(
        latitude=lat, longitude=lng, place_type=place_type,
    )
```

Each `await` blocks until the HTTP response comes back. The calls are independent — the result of searching for hospitals doesn't affect the search for banks. We're paying the full serial latency for no reason.

```
Timeline (sequential):

  Hospital ──────►
                   Bank ──────►
                                School ──────►
                                               Pharmacy ──────►
                                                                ... (5 more)
  |──────────────── ~45 seconds total ────────────────────────|
```

## The fix: gather with a concurrency limit

We wrote a small utility that runs coroutines concurrently with a cap:

```python
# shared/utils/concurrency.py

async def gather_with_concurrency(
    limit: int,
    *coros: Coroutine[Any, Any, T],
) -> list[T]:
    semaphore = asyncio.Semaphore(limit)

    async def _sem_task(coro: Coroutine[Any, Any, T]) -> T:
        async with semaphore:
            return await coro

    return list(await asyncio.gather(*(_sem_task(c) for c in coros)))
```

Three things to note:

1. **`asyncio.Semaphore(limit)`** — created inside the function, scoped to this invocation. Not global, not shared.
2. **`asyncio.gather()`** — schedules all wrapped coroutines on the *current* event loop. No new loops, no threads.
3. **`async with semaphore`** — at most `limit` coroutines execute simultaneously. The rest wait.

The use case now looks like:

```python
results = await gather_with_concurrency(
    5,  # max 5 concurrent Google API calls
    *(self._discover_category(cat, lat, lng) for cat in AmenityCategory),
)
```

```
Timeline (concurrent, limit=5):

  Hospital ──────►
  Bank ──────►
  School ──────►
  Pharmacy ──────►
  Gym ──────►
  ─── semaphore wait ───
  Laundry ──────►          (starts when one of the 5 finishes)
  Coffee ──────►
  Restaurant ──────►
  Grocery ──────►          (internally also concurrent)

  |──── ~10 seconds total ────|
```

## How the asyncio event loop works here

This is the part people get wrong. Let me draw the full picture of how our worker runs.

### Single loop, single thread

```
┌─────────────────────────────────────────────────────────┐
│                    OS Process                            │
│                                                         │
│   asyncio.run(_main())                                  │
│        │                                                │
│        ▼                                                │
│   ┌─────────────────────────────────────────────┐       │
│   │           asyncio Event Loop                │       │
│   │                                             │       │
│   │   DomainEventsWorker.run()                  │       │
│   │     while self._running:                    │       │
│   │       msg = await sqs.receive_message()     │       │
│   │       await router.dispatch(event)          │       │
│   │         ├─ handle_property_created()        │       │
│   │         │    ├─ discover_amenities()         │       │
│   │         │    │    ├─ gather_with_concurrency │       │
│   │         │    │    │    ├─ find_nearby(hosp)  │       │
│   │         │    │    │    ├─ find_nearby(bank)  │       │
│   │         │    │    │    ├─ find_nearby(school)│       │
│   │         │    │    │    ├─ find_nearby(pharm) │       │
│   │         │    │    │    └─ find_nearby(gym)   │       │
│   │         │    │    │    ··· (semaphore wait)  │       │
│   │         │    │    │    ├─ find_nearby(laund) │       │
│   │         │    │    │    └─ ...                │       │
│   │         │    │    └─ return results          │       │
│   │         │    └─ save amenities               │       │
│   │         └─ delete SQS message               │       │
│   │       (loop: poll next message)             │       │
│   │                                             │       │
│   └─────────────────────────────────────────────┘       │
│                                                         │
│   Thread: MainThread (the only one)                     │
└─────────────────────────────────────────────────────────┘
```

`asyncio.run()` creates the event loop and runs it until `_main()` completes. The worker's `while` loop polls SQS, processes one message, polls again. All the `await` calls — SQS polling, HTTP requests, DB queries — yield control back to the event loop, which can run other ready coroutines.

When `gather_with_concurrency` schedules 5 HTTP calls, the event loop interleaves their I/O:

```
Event Loop Timeline:

  ┌─ find_nearby(hospital) sends HTTP request ──────────────┐
  ├─ find_nearby(bank) sends HTTP request ──────────────────┤
  ├─ find_nearby(school) sends HTTP request ────────────────┤
  ├─ find_nearby(pharmacy) sends HTTP request ──────────────┤
  ├─ find_nearby(gym) sends HTTP request ───────────────────┤
  │                                                         │
  │   (all 5 requests are in-flight simultaneously)         │
  │   (event loop is waiting on all 5 sockets)              │
  │                                                         │
  ├─ hospital response arrives → resume hospital coro       │
  ├─ bank response arrives → resume bank coro               │
  ├─ gym response arrives → resume gym coro                 │
  │   (semaphore releases → laundry starts)                 │
  ├─ find_nearby(laundry) sends HTTP request ───────────────┤
  └─ ... continues until all done                           │
```

The key insight: **the event loop never closes during this process**. It's the same loop from start to finish. `gather_with_concurrency` just adds more coroutines for the loop to manage.

## What about multiple messages?

Today our worker processes one message at a time (`MaxNumberOfMessages=1`). But what if we later process 10 messages concurrently?

```python
# Hypothetical future
messages = await self._poll()  # up to 10 messages
await asyncio.gather(*(self._process(msg) for msg in messages))
```

Each message calls `gather_with_concurrency(5, ...)` and gets its own semaphore:

```
┌──────────────────────────────────────────────┐
│              asyncio Event Loop               │
│                                               │
│  Message A:                                   │
│    gather_with_concurrency(5, ...)            │
│      semaphore_A = Semaphore(5)  ← own scope  │
│      hospital_A, bank_A, school_A, ...        │
│                                               │
│  Message B (concurrent):                      │
│    gather_with_concurrency(5, ...)            │
│      semaphore_B = Semaphore(5)  ← own scope  │
│      hospital_B, bank_B, school_B, ...        │
│                                               │
│  Message C (concurrent):                      │
│    gather_with_concurrency(5, ...)            │
│      semaphore_C = Semaphore(5)  ← own scope  │
│      hospital_C, bank_C, school_C, ...        │
│                                               │
│  Total concurrent HTTP calls: up to 3 × 5 = 15│
└──────────────────────────────────────────────┘
```

Each semaphore is independent. Message A finishing doesn't affect Message B's semaphore. No coroutine can close the event loop — only `asyncio.run()` does that, and it only runs once at the top level.

**The risk isn't the loop — it's the API rate limit.** 10 messages × 5 concurrent calls = 50 simultaneous requests to Google. If that exceeds your API quota, the fix is a **shared semaphore** at the worker level:

```python
# Worker-level (shared across all messages)
class DomainEventsWorker:
    def __init__(self, ...):
        self._google_api_semaphore = asyncio.Semaphore(10)  # global cap

# Pass to use case, replace per-invocation semaphore
```

This is a rate-limiting problem, not a concurrency-safety problem. The scoped semaphore is always safe — the question is whether you need a *global* one too.

## When scoped semaphores break

This pattern is safe when:
- You have a **single event loop** (our case — `asyncio.run()` once)
- Coroutines are **I/O-bound** (HTTP calls, not CPU work)
- The semaphore is **created per invocation** (not a module-level global)

It breaks when:
- **Multiple threads** share an event loop and one thread calls `loop.close()` — kills everything
- **`asyncio.run()` is called from inside a running loop** — raises `RuntimeError` (nested loop)
- **A subprocess owns its own loop** and the parent kills the subprocess — the child's pending coroutines are cancelled mid-flight
- **CPU-bound work** inside the semaphore — blocks the entire event loop, defeating the purpose

None of these apply to our architecture. The worker is one process, one thread, one loop, I/O-bound calls only.

## The utility

20 lines, zero dependencies beyond `asyncio`:

```python
# shared/utils/concurrency.py

import asyncio
from collections.abc import Coroutine
from typing import Any, TypeVar

T = TypeVar("T")

async def gather_with_concurrency(
    limit: int,
    *coros: Coroutine[Any, Any, T],
) -> list[T]:
    semaphore = asyncio.Semaphore(limit)

    async def _sem_task(coro: Coroutine[Any, Any, T]) -> T:
        async with semaphore:
            return await coro

    return list(await asyncio.gather(*(_sem_task(c) for c in coros)))
```

It returns results in the same order as the input coroutines — `asyncio.gather` guarantees this. Failed coroutines propagate their exception (we handle errors inside each coroutine before passing them to gather).

## Results

Before: ~14 sequential API calls, 45–90 seconds per property.
After: ~3 batches of 5 concurrent calls, 10–15 seconds per property.

Same event loop. Same thread. Same worker. Just better use of async I/O.
