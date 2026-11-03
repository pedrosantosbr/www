# Design System — "Paper"

A reading-first, editorial layout for this blog. It is reverse-engineered from the
plain "edit" reading style of [felixrieseberg.com](https://felixrieseberg.com/hunger-beats-tenure-advice-for-junior-engineers/)
(`assets/posts/posts.css`, `body[data-read^="edit"]` block) and adapted to
AstroPaper + Tailwind v4. We borrow the _system_ — warm paper colours, a serif
reading column, monospace labels, a left contents rail — not the site's own
identity (no VCR/teletext chrome, stamps, 3D room or reply card).

## 1. What the reference does

| Area | Observation |
| --- | --- |
| Canvas | Warm off-white "paper" (`#f7f5ef`), a slightly darker "sheet" for chips/hover (`#efece3`), near-black warm ink. Dark mode is a warm near-black (`#12110e`), never blue. |
| Accent | One accent only, a brick red (`#b32b19`) / coral in dark (`#ff7a5c`). Used sparingly: back link, progress bar, quote rule, active TOC item, link hover underline. |
| Type | Three families with strict roles: **Literata** (serif) for reading + post title, **Fira Sans** for UI text and section headings, **Fira Code** for small uppercase labels, metadata, TOC, captions. |
| Header | Site name in a heavy, wide, uppercase sans (14px, tracking .03em). Nav links small and muted, current page inverted (ink background, paper text). A boxed icon-only theme toggle. |
| Strip | Under the header, a thin sticky line: `◂ POSTS` back link in accent, mono 12px uppercase; a 2px accent progress bar on its bottom edge. |
| Post head | Title at `clamp(32px, 4.2vw, 46px)`, 700, line-height 1.12, tracking -.012em. Below it a 3-column metadata grid (`PUBLISHED / READING TIME / TOPICS`): mono 11.5px uppercase `dt`, sans 15px `dd` prefixed with `└`. A 1px rule closes the head. |
| Column | 660px measure. Prose capped at ~34× the font size (~68 chars/line); code, images and the head use the full column. |
| Prose | Serif `clamp(17px, 16.55px + .111vw, 18px)`, line-height 1.65. `h2` in Fira Sans 700 `clamp(21px,1.7vw,24px)`, margin `2.1em 0 .6em`. Blockquote = same size, 2px accent left rule, softer ink. Inline code = 7% ink tint, radius 3px, .82em. Links underline at 45% ink, accent + 2px on hover. List markers mono + muted. |
| Rail | ≥1100px: a sticky `CONTENTS` list left of the column, mono 12.5px, muted; current section in ink. |
| End | `— END —` mono marker, author line, then a `LATEST POSTS` list of rows (date in mono + title), hover = sheet background. |
| Footer | Top rule, mono muted links, nothing else. |
| Lists | The post index is a "log": a table-like list of rows (title · date · reading time) separated by 1px rules, grouped by year. |

## 2. Design tokens

All tokens live in `src/styles/global.css` as CSS custom properties and are
exposed to Tailwind through `@theme inline`.

### 2.1 Colour

| Token | Tailwind | Light | Dark | Use |
| --- | --- | --- | --- | --- |
| `--ground` | `bg-ground` (alias `background`) | `#f7f5ef` | `#12110e` | page background |
| `--sheet` | `bg-sheet` | `#efece3` | `#1b1a16` | chips, hover rows, code blocks |
| `--ink` | `text-ink` (alias `foreground`) | `#17160f` | `#ece8dd` | primary text |
| `--soft` | `text-soft` | `#403e35` | `#cbc6b8` | secondary text, blockquotes |
| `--subtle` | `text-subtle` | `#6a675c` | `#949085` | labels, metadata, nav |
| `--rule` | `border-rule` (alias `border`) | `rgb(23 22 15 / .13)` | `rgb(236 232 221 / .13)` | hairlines |
| `--accent` | `text-accent` | `#b32b19` | `#ff7a5c` | the one accent |
| `--on-accent` | `text-on-accent` | `#ffffff` | `#12110e` | text on accent fills |
| `--icode` | — | `7%` | `10%` | inline-code tint strength (`color-mix` with ink) |

> The reference calls the label colour `--muted`; here it's `--subtle` because
> `muted` used to be a surface token in this codebase. The old AstroPaper names
> (`background`, `foreground`, `muted`, `border`) were removed in step 7.

### 2.2 Typography

| Token | Value |
| --- | --- |
| `--font-serif` | `"Literata", Georgia, "Times New Roman", serif` |
| `--font-sans` | `"Fira Sans", "Helvetica Neue", Arial, sans-serif` |
| `--font-mono` | `"Fira Code", ui-monospace, Menlo, Consolas, monospace` |
| `--text-read` | `clamp(17px, 16.55px + .111vw, 18px)` |
| `--leading-read` | `1.65` |
| `--text-title` | `clamp(32px, 4.2vw, 46px)` / lh 1.12 / tracking -.012em / 700 |
| `--text-h2` | `clamp(21px, 1.7vw, 24px)` / lh 1.25 / 700 sans |
| `--text-label` | `12px` mono, uppercase, tracking `.08em` (`.1em` for 11.5px `dt`s) |
| `--text-ui` | `15px` sans |

Roles:

- **Serif** — post body, post titles, page titles.
- **Sans** — site name, section headings (`h2`/`h3`), metadata values, list titles.
- **Mono** — every _label_: nav, back link, `dt`, TOC, dates in lists, captions, list markers, tags.

Fonts are loaded with Astro's `fonts` config (Google provider), replacing
Google Sans Code.

### 2.3 Layout and spacing

| Token | Value | Use |
| --- | --- | --- |
| `--wrap` | `1180px` | header, strip, footer, rail grid |
| `--measure` | `660px` | reading column |
| `--prose-max` | `calc(var(--text-read) * 34)` | max width of `p`, lists, headings |
| `--rail-bp` | `1100px` | TOC rail appears (Tailwind `rail:` variant) |
| head padding | `clamp(34px,6vw,76px) 0 clamp(26px,4vw,40px)` | post head |
| content top | `clamp(28px,4vw,44px)` | after the head rule |
| gutters | `16px` | page side padding on phones |

### 2.4 Shape and motion

- Radius: `2px` chips, `3px` buttons/inline code, `4px` code blocks. Nothing rounder.
- Borders: always `1px solid var(--rule)`. No drop shadows (`--shadow: none`).
- Accent bars: `2px` (progress, blockquote).
- Hover: colour changes only (`subtle → ink`, row background `→ sheet`). No transforms.
- Focus: `2px solid var(--accent)`, offset 2px.

## 3. Component spec

| Component | Spec |
| --- | --- |
| `Header` | `max-w-wrap`, flex, name left (sans 800, uppercase, 14px, tracking .03em), nav right (mono 13px, subtle, `px-2 py-0.5`, current = `bg-ink text-ground`), search + theme as 30×28 boxed icon buttons (`border-rule`, radius 3). Mobile: nav wraps under the name; controls stay on the name row. |
| `Strip` (posts) | sticky top-0, `bg-ground`, `border-b border-rule`, mono 12px uppercase subtle; `◂ POSTS` in accent left, post title (sans 13.5px, ink, truncated) — 2px accent progress bar at the bottom. Replaces the floating progress bar and `BackButton`. |
| `PostHead` | title (serif), `dl.meta` grid `repeat(auto-fit,minmax(150px,1fr))`, gap 16/24, `dt` mono label, `dd` sans 15px with `└` prefix: Published, Reading time, Category, (Updated). Bottom rule. |
| `Prose` (`.app-prose`) | see §1 Prose row. Code blocks: `border-rule`, radius 4, shiki themes kept. Images: no border, full column. |
| `TocRail` | from `render(post).headings` (depth 2–3), sticky, mono 12.5px subtle, current = ink (IntersectionObserver). Hidden below `rail`. The in-body `remark-toc` block is hidden at `rail` and up. |
| `PostEnd` | `— END —` mono centered, tags as mono chips, share links, then `MORE POSTS` rows (prev/next): mono date + sans title, hover sheet. |
| `PostLog` (lists) | rows `grid-cols-[1fr_auto_auto]`: title (sans 16px ink), date (mono 12.5 subtle), reading time (mono 12.5 subtle). 1px rule between rows, `-mx-2.5` hover bleed, year sub-headings in mono label. Collapses to 2 rows on phones. |
| `Footer` | `max-w-wrap`, top rule, mono 13px subtle links (Home, Posts, Tags, Categories, About, RSS) left, socials right. |
| Chips (`Tag`, `Category`) | mono 12px, `border-rule bg-sheet`, radius 2, `px-2 py-0.5`, hover ink. |

## 4. Implementation plan

> **Status:** all seven steps shipped (PRs #3–#9).

Each step is one small PR, squash-merged into `main`, and must pass
`pnpm run build` and `pnpm run lint` on its own.

1. **Tokens + fonts** — new colour/type/layout tokens in `global.css`, aliases for
   the old names so nothing breaks, Literata / Fira Sans / Fira Code via Astro
   fonts, body defaults (`bg-ground text-ink font-sans`).
2. **Header + footer** — rebuild `Header.astro` and `Footer.astro` to the spec,
   widen to `--wrap`.
3. **Prose typography** — rewrite `typography.css` for the serif reading column,
   headings, quotes, code, lists, captions.
4. **Post page** — reading-time util, sticky strip with progress bar,
   `PostHead` metadata grid, `PostEnd` + `MORE POSTS`; remove floating progress
   bar / `BackButton` from the post page.
5. **TOC rail** — `TocRail.astro` with scroll-spy on wide screens; hide the inline
   TOC there.
6. **Post log** — `Card.astro` becomes a log row; restyle the home page,
   `/posts`, tag and category listings; chips and pagination.
7. **Remaining pages + cleanup** — `Main.astro` page heads, search, 404, about,
   archives; remove deprecated `--muted` / `--background` aliases; OG image
   colours to match the paper palette.
