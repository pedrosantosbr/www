---
author: Pedro Santos
pubDatetime: 2026-05-27T12:00:00.000Z
title: Predileto '#15 - Chapter I - System Design - Requirements Engineering
slug: chapter-i-system-design-requirements-engineering
featured: false
draft: false
tags:
  - architecture
  - real-estate
  - system-design
description: The first step of Predileto's system design — turning a fuzzy product idea ("turn property photos into cinematic videos") into a concrete, testable set of functional and non-functional requirements.
category: Software Development
---

> In an early-stage startup or an unproven product it's usually more important to be able to iterate quickly on product features than it is to scale some hypothetical future load.

This is **Chapter I** of the "How I built Predileto" series. Before writing a single line of code, the most leverage you'll ever get is in **requirements engineering** — deciding what the system must do, and (just as important) what it must _not_ do yet.

## Table of contents

## Why bother with requirements for a solo build?

It's tempting to skip this when you're moving fast. But requirements aren't bureaucracy — they're the contract you write with your future self. Every "should the reel be free?" or "what happens when a video fails halfway?" you answer here is a question you _don't_ have to re-litigate while you're elbow-deep in the worker code.

The trick for an unproven product is **scoping ruthlessly**. Predileto can technically run a handful of generation pipelines today (room staging, enhancement, single-call prompts), but for the requirements that follow I'm deliberately pinning the product to **two** flagship flows. Everything else is noise until these two earn their keep.

I split requirements into two buckets, which is the standard system-design framing:

- **Functional Requirements (FR)** — _what_ the system does, observable from the outside.
- **Non-Functional Requirements (NFR)** — _how well_ it does it: latency, isolation, failure behaviour, cost.

## Functional Requirements

### FR#01 — Authentication & Authorization

Users sign in and sign up with **Google OAuth**, brokered by Supabase. The backend never sees a password — it validates the Supabase-issued JWT (ES256, verified against the project's published JWKS) on every request.

The product is **multi-tenant**: a user can only ever see and act on their own generations, credits, and billing. There is no "team" or "agency" sharing model yet — one human, one tenant. Every data access is scoped by the authenticated user's id.

Users can also **permanently delete their account** and all associated data (generations, credit ledger, billing) — a hard requirement for operating under GDPR.

### FR#02 — Timelapse Building Video

The hero feature. A user uploads **a single photo** of a property — an empty plot of `land`, an existing `house`, or a derelict `ruin` — and the system generates a **cinematic construction timelapse**: the camera holds steady while the structure rises (or is renovated/rebuilt) from the input frame to a finished, magazine-cover building.

- Input: one image + a chosen typology (`land` / `house` / `ruin`).
- Output: an MP4 video, stored in blob storage, viewable and downloadable by the user.
- The user picks the **aspect ratio** (e.g. `9:16` for Reels/Stories, `16:9` for YouTube).
- Generating a timelapse **costs credits**, which come from the user's subscription (see FR#04). The price is read from a server-side pricing table, not hardcoded — so it can be tuned without a deploy. At launch it's **5 credits per video**.

### FR#03 — Reels from Pictures

The second flow. A user uploads **multiple photos** of a property (up to 15), arranges them in the order they want, and the system turns each photo into a short cinematic clip and **concatenates them into a single vertical reel**.

- Input: an ordered set of images (a "draft" the user builds up before submitting).
- The user can **add, reorder, and remove** images before committing.
- Output: one MP4 reel, stored in blob storage, viewable and downloadable.
- During the current beta this flow is **free (0 credits)** — it's a proof-of-concept and we want usage data more than revenue from it right now.

> Note the asymmetry: FR#02 charges, FR#03 doesn't. That's a deliberate product decision encoded as data, not a code branch — both flows resolve their cost from the same pricing table.

### FR#04 — Users Subscribe to Generate

Generation is funded **entirely through a monthly subscription** — there's no à la carte credit purchase. A subscription is the only paid path into the product, billed through Stripe, with two tiers:

| Tier | Price | Credits |
|---|---|---|
| **Pro** | €24 / month | 100 credits refreshed each period |
| **Unlimited** | €99 / month | No metering — generate without spending credits |

So credits still exist as the internal **metering unit** for Pro users (100 credits ≈ 20 timelapse videos a month), while Unlimited users bypass metering entirely. Subscription state is driven entirely by **Stripe webhooks** (checkout completed, invoice paid, subscription updated/deleted), and users manage, upgrade, or cancel through the Stripe Customer Portal.

> An earlier design let users buy one-off credit packs (pay-as-you-go). I dropped it: a single subscription model is simpler to reason about, gives predictable monthly revenue, and removes a whole class of "I bought credits but…" edge cases. Fewer ways to pay is a feature when you're one person.

### FR#05 — Users Can See Their Balance & Plan

At any time a user can see how many **credits** they have left this period, whether they're on an **unlimited** plan, and when their current billing period ends. This is what the UI reads to decide whether to let them hit "Generate" or nudge them to upgrade.

### FR#06 — Users Can See Their Generation History

Every generation — draft, in-progress, succeeded, or failed — is listed for the user, newest first, with its status, thumbnail, and (when ready) a link to the output video. A user can open any past generation to download it again or delete it.

## Non-Functional Requirements

### NFR#01 — Generation is asynchronous

Rendering a timelapse or a reel takes **minutes**, not milliseconds — far longer than any sane HTTP request. So generation is **fire-and-poll**: the API accepts the request (responding `202 Accepted`), enqueues the work to a background worker, and the client polls the generation's status until it succeeds or fails. The request thread is never blocked on a model call.

### NFR#02 — Tenant isolation

A user must **never** be able to read or mutate another user's generations, images, credits, or billing — not via a guessed id, not via a stale token. Authorization is enforced on every query, not just at the UI layer.

### NFR#03 — Never charge for work we didn't deliver

Credits are spent up-front when a generation is accepted, but if the job **fails to dispatch or fails to render**, the credits are **automatically refunded**. A user paying 5 credits for a video that never arrives is a bug, not an edge case — the happy path and the refund path are designed together.

### NFR#04 — Billing must be idempotent and exact

Stripe delivers webhooks **at least once**, sometimes out of order, sometimes replayed. Credit grants and subscription changes must therefore be **idempotent**: processing the same event twice grants credits once. Every webhook is recorded and de-duplicated before it can touch a balance, and a failed handler rolls back cleanly so Stripe's retry can re-apply it.

### NFR#05 — Adapt to the upstream model's rate limits

The actual video generation runs on a third-party model API (Runway) with its own concurrency and rate limits. The system must **stay within those limits** — e.g. capping how many clips of a single reel render in parallel — rather than firing everything at once and getting throttled or banned.

### NFR#06 — Right-sized capacity

This is an unproven product, so the target is deliberately modest: comfortably handle **~100 daily active users averaging ~5 generations/day**. Designing for that — instead of an imaginary million-user load — keeps the infrastructure cheap and the iteration loop fast. Scaling is a problem I'd be _lucky_ to have.

## What's next

With the requirements pinned down, the rest of Chapter I builds on them: **capacity estimation** (turning "100 DAU × 5 videos" into storage and throughput numbers), the **data model**, the **API design**, and the **high-level system design** — followed by the trade-offs I made along the way.

See you in the next one.
