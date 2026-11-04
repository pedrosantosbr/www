# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AstroPaper — a static blog theme built with Astro 7, TypeScript, and Tailwind CSS v4. Deployed on Vercel (https://www-alpha-bice.vercel.app); every PR runs `.github/workflows/ci.yml` (lint, format:check, build) and must be green before merging.

## Commands

```bash
pnpm run dev        # Start dev server (localhost:4321)
pnpm run build      # Type-check + build + generate Pagefind search index
pnpm run preview    # Preview production build
pnpm run sync       # Regenerate Astro TypeScript types
pnpm run lint       # ESLint
pnpm run format     # Prettier (write)
pnpm run format:check  # Prettier (check only)
```

The build pipeline runs `astro check && astro build && pagefind --site dist && cp -r dist/pagefind public/` — Pagefind search index must be regenerated after each build.

## Architecture

**Content flow:** Markdown files in `src/data/blog/` → Astro Content Collections (schema in `src/content.config.ts`) → utility functions filter/sort posts → Astro pages render them.

Key layers:
- **`src/config.ts`** — Central site configuration (author, pagination, OG settings, timezone)
- **`src/constants.ts`** — Social media links
- **`src/content.config.ts`** — Blog collection schema using Astro's glob loader; collects `**/[^_]*.md` except anything under `src/data/blog/_archived/` (retired posts kept in the repo, never published — move a file out of `_archived/` to republish it). Underscore-prefixed file names are also excluded. `CATEGORIES` (active) is just `"Healthcare"`; the retired ones live in `ARCHIVED_CATEGORIES` — re-add a category to `CATEGORIES` before un-archiving a post that uses it. Every active category gets a page even with zero posts.
- **`src/utils/`** — Post filtering (`postFilter.ts` excludes drafts and future-dated posts), sorting (`getSortedPosts.ts`), slugification, OG image generation via Satori+Resvg, category helpers (`getPostsByCategory.ts`, `getUniqueCategories.ts`)
- **`src/pages/`** — File-based routing; includes dynamic routes for posts (`[...slug]`), tags (`[tag]/[...page]`), categories (`categories/[category]/[...page]`), and programmatic endpoints (RSS, robots.txt, OG images as `.png.ts` files)
- **`src/layouts/`** — `Layout.astro` is the root layout; `PostDetails.astro` handles individual posts

**Theming:** "Paper" design system — tokens, type roles and component spec are documented in `docs/design-system.md`. Tokens (`ground`, `sheet`, `ink`, `soft`, `subtle`, `rule`, `accent`; `text-read`/`text-title`/`text-h2`/`text-label`; `max-w-wrap`/`max-w-measure`; `rail:` breakpoint at 1100px; `label` utility) are CSS custom properties in `src/styles/global.css` exposed via `@theme inline`. Fonts: Literata (reading), Fira Sans (UI/headings), Fira Code (labels) via Astro `fonts`. Dark mode uses `[data-theme="dark"]`, toggled by `src/scripts/theme.ts`. Post page pieces live in `src/components/post/` (`PostStrip`, `PostHead`, `TocRail`, `PostEnd`); listings use `PostLog` + `Card`.

**OG Images:** Dynamic generation using Satori templates in `src/utils/og-templates/`. Each post gets an auto-generated OG image via `src/pages/posts/[...slug]/index.png.ts`.

**Search:** Pagefind provides client-side full-text search. The index lives in `public/pagefind/` and is rebuilt during `pnpm run build`.

**Markdown plugins:** configured through `markdown.processor: unified({...})` (`@astrojs/markdown-remark`). `remark-toc` auto-generates table of contents; `remark-collapse` wraps it in a collapsible `<details>`. Shiki provides syntax highlighting with `min-light`/`night-owl` themes.

## Blog Post Frontmatter

Required fields: `title`, `pubDatetime`, `description`, `category` (must be one of the `CATEGORIES` enum values, defaults to "Healthcare"). Posts with `draft: true` or future `pubDatetime` are filtered out in production. The `@/*` path alias maps to `./src/*`.

## Code Conventions

- `no-console` ESLint rule is enforced as error
- Prettier uses 2-space tabs, 80 char width, no arrow parens, es5 trailing commas
- Conventional commits (Commitizen configured via `cz.yaml`)
- Node ≥22.23 (Astro 7 requirement; CI uses Node 22), pnpm 12.14.0
