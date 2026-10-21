# Websec Decompiled

An offline-first, zero-assumption web exploitation training portal built with **VitePress**. It covers the **complete PortSwigger Web Security Academy catalog**: 31 topics, 272 labs, grouped under the concept each lab tests, with 32 flagship labs deconstructed token by token (plus the 18 SQL injection labs in the deep track).

## Hosted copy

**https://jannatuladon.github.io/websec-decompiled/** — the current build is published from the `gh-pages` branch of the `JannatulAdon/websec-decompiled` repository. Rebuild with `BASE_PATH=/websec-decompiled/ npm run build` before updating that branch.

## Quick start

Double-click **Websec Decompiled** on the desktop, or run the launcher:

```bash
./start.sh
```

It installs dependencies on first run, starts the dev server, waits until it answers, and opens your browser. If port 5173 is busy it picks the next free port. `Ctrl+C` stops it.

Manual equivalent:

```bash
npm install
npm run dev        # http://localhost:5173/
```

Production build and preview:

```bash
npm run build      # static output in .vitepress/dist
npm run preview    # http://localhost:4173/
```

## Verification

```bash
npm run check:labs   # 272 labs rendered once, 35 unit pages, trackers, content ids
npm run build        # SSR build; fails on bad Markdown/Vue
npm run check:links  # internal links + anchors in .vitepress/dist
npm run verify       # all of the above, in order
npm run check:urls   # optional: live HTTP check of all 272 lab URLs
```

The content check enforces that every lab appears exactly once on its unit page, every page has exactly one matching topic tracker, every authored note points at a real lab, worked examples have three hints plus a request, token table, and script, and every lab URL is an `https://portswigger.net/web-security/` URL.

## What is inside

| Track | Topics | Labs |
| --- | --- | --- |
| SQL injection deep dive | 5 modules | 18 |
| Server-side | 13 | 98 |
| Client-side | 6 | 58 |
| Advanced | 11 | 98 |

The SQL injection track (`sql-injection/`) is fully hand-authored: every lab has three hint levels, raw HTTP, a character-by-character breakdown, and a Python solver. The remaining 30 topics (`xss/`, `authentication/`, `request-smuggling/`, and so on) contain:

- a mechanics-first article with parser diagrams and dialect tables;
- every lab linked, difficulty-tagged, described in one line, and checkable;
- two to four worked examples per major topic with the full deconstruction format;
- `🔬 Under the Hood` and `⚙️ Engine Variations` disclosures for the deep mechanics.

## Architecture

```text
.
├── .vitepress/
│   ├── config.mjs              # nav, generated sidebar, local search, Shiki, ::: lab container
│   └── theme/
│       ├── index.js            # extends the default theme, registers components
│       ├── Layout.vue          # injects the nav progress pill
│       ├── labs.js             # registry: 35 units, 272 labs, phases
│       ├── progress.js         # SSR-safe reactive localStorage store
│       ├── data/
│       │   ├── catalog.js      # generated from the official Academy "All labs" page
│       │   ├── sql-labs.js     # hand-authored SQLi manifest (5 modules, 18 labs)
│       │   └── content/        # per-topic notes + worked examples (30 files)
│       ├── components/
│       │   ├── LabGroup.vue    # lab cards: link, checkbox, hints, solution
│       │   ├── LabCheckbox.vue
│       │   ├── TopicComplete.vue
│       │   ├── ProgressPill.vue
│       │   └── ProgressDashboard.vue
│       └── styles/custom.css   # dark-first theme, cards, meters, responsive rules
├── index.md                    # landing dashboard, syllabus, study route
├── sql-injection/              # 5 deep modules
├── <topic>/index.md            # 30 Academy topic pages
├── public/                     # favicon + hero diagram (no external assets)
└── scripts/                    # content, link, and URL verification
```

## Progress system

- Storage key: `websec-decompiled:progress:v1` in `localStorage`.
- Shape: `{ version, updatedAt, labs: { [id]: ISO }, topics: { [id]: ISO } }`.
- `progress.js` exposes a shared reactive store; the nav pill, unit trackers, lab checkboxes, and dashboard all read it, so a toggle updates every mounted instance immediately.
- A `storage` event listener syncs other tabs.
- SSR renders zero progress; the snapshot is loaded in `onMounted`, avoiding hydration mismatches.
- 35 units are tracked: the 5 SQLi modules and 30 topic pages.
- Progress is origin-scoped: `localhost:5173` and a deployed origin keep separate records.

## Content conventions

- Every lab is rendered by `<LabGroup ids="a, b, c" />` (or `<LabCheckbox lab-id="..." />` inside the hand-authored SQLi pages).
- Lab ids are stable, URL-derived, and unique; SQLi ids match the original manifest.
- `data/content/<topic>.js` maps lab id → `{ note, work? }`. `work` is optional; when present, the card renders hints and a solution.
- Deep mechanics use `::: details 🔬 Under the Hood: ...`; dialect differences use `::: details ⚙️ Engine Variations ...`.
- The generated catalog keeps titles, difficulty, and URLs aligned with PortSwigger. Rebuild it from the official "All labs" page if the Academy changes.

## Scope and ethics

All payloads target deliberately vulnerable PortSwigger labs or systems you are explicitly authorized to test. Labs are hosted by PortSwigger and require an account; this portal does not run or exploit them for you. Web exploitation can read, modify, and delete production data.
