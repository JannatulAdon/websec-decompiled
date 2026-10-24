> **Latest direction (2026-10-25): research-led SSRF teaching revision.** The user still felt lost and overwhelmed by choices, authorized any platform change, requested internet research, and asked to prove SSRF first before the rest. Read `RESEARCH_DESIGN.md` and current README. `SsrfSample.vue` is now a four-section lesson (normal import → changed destination → causal explanation → Reader transfer). `ssrf-lesson.css` owns the new design. Native request execution and fixed local fixtures remain truthful; `ssrf-transfer.js` supplies a distinct executable preview handler. The complete former inspector moved to `SsrfWorkbench.vue` and is offered only after the core lesson. Early stages have one task, feedback is specific, and successful transfer replaces its controls with a submitted-value summary. `check:ssrf-lesson` covers wrong/correct paths, focus, desktop/mobile light/dark, and seeded progress preservation. `check:ssrf-sample` still tests the optional debugger. No real labs were attempted; do not claim this foundation covers all SSRF or that the user approved it. Older descriptions below are history and must not override this direction.

> **Latest preference (2026-10-23):** The user rejects made-up visualizations, metaphors, and a childish teaching tone. They want an actual technical interface that shows exactly what changes where. The SSRF sample is now a functional form plus HTTP inspector and executed-source view at the existing `#/sample/ssrf` route. It creates real Request/Response objects and executes `ssrf-handler.js` locally against fixed fixtures; clearly distinguish this from a remotely hosted backend. Its source is imported raw for the code viewer. Do not reintroduce the cartoon network or animated-story proposal. Keep new teaching changes focused on this concrete workbench for feedback before another broad rollout. Previous authorization to develop/deploy the platform and the ban on attempting real labs still apply.

> **Active direction (2026-10-23, latest):** The user now explicitly authorizes completing the whole platform autonomously: “you have enough input … make me that website now.” This supersedes the earlier pause on broader rollout. They are going to sleep and need no further preference questions. Develop/deploy only this platform; never attempt a real lab. The default lesson is now `GuidedLesson.vue`, with 35 topic definitions/purposes and 176 individually authored questions in `teaching.js`. `workshop.css` refreshes the entire platform. Lesson tools and free exploration are optional. The SSRF story was also rewritten to teach definition → concrete code-retrieval goal → normal import → blocked browser → server fetch → causal check. Preserve progress and hosting. Read README and the latest audit section for the current architecture; older sample-only directions below are historical.

> **Current sample (2026-10-23):** The shorter encoding sample was acceptable but already familiar to the user, and still felt insufficiently engaging/visual. They explicitly selected SSRF as the next unfamiliar topic. Keep the broader rollout paused. `SsrfSample.vue`, `SsrfNetwork.vue`, `ssrf-sample.js`, and `ssrf-sample.css` implement a separate sample at `#/sample/ssrf`: a named image importer, interactive network map with request/response routes, public/private destination choices, direct-browser comparison, a simple destination rule, and one transfer check. All routes are fictional local fixtures; no destination is contacted. Continue refining one sample from user feedback before applying the teaching style broadly.

> **Latest feedback (2026-10-23):** The seven-step encoding sample was too drawn out and introduced “the app” without explaining the setting or purpose. Keep the core concise: identify the website, the user’s goal, what the browser sends, what the server reads, and one check. Explicitly distinguish encoding before sending from decoding when reading. Double decoding and validation order belong in optional follow-up. Continue iterating only this topic.

> **Active direction (2026-10-23):** Pause all-topic redesign. The user wants to learn an unfamiliar topic, review a concrete sample, and iterate together. The selected second topic is Encoding & parser boundaries. `EncodingSample.vue`, `encoding-sample.js`, and `encoding-sample.css` implement a two-part beginner sample at `#/sample/encoding`, with a fresh workshop look, isolated from the current global design. The user dislikes the existing style and does not require detective framing. Do not roll the sample out to other topics until the user approves its teaching and visual direction.

> **Current platform (2026-10-22):** Use `.vitepress/theme/rebuilt/`. Read `README.md`, `AUDIT_REPORT.md`, and `REBUILD_REPORT.md` first. Guided fictional apps now include live model scenes, step-through checkpoints, input/interpretation/response comparisons, optional debounced live editing, and clear unsent-draft labels. All 176 lessons have an inspector; explicit scenes cover thirteen visualization kinds. Experiments and fictional investigation drafts survive mode changes; investigation requests/logs/notebooks also restore after browser reloads. The platform retains 272 lab links, 35 transfer cases, and 6 fictional investigations. Hosting remains the existing GitHub Pages URL. Preserve repository history; never use the archived force-push recipe. The architecture below describes the archived implementation.

# Websec Decompiled — Complete Project & Session Handoff Context

Use this context to seamlessly continue developing, updating, and refining **Websec Decompiled** (`/mnt/win_data/Storage/Sync/ctf_learn`) as if we never left the previous conversation.

---

## 1. My Preferences & Working Rules (Read First!)

1. **How I Learn & Why We Built This Site:**
   - I am learning web application security and solving all **272 PortSwigger Web Security Academy labs**.
   - **I hate boring reading and heavy technical jargon.** Walls of text, academic tone, and unexplained security buzzwords turn me off.
   - **I learn by doing, seeing, observing, and connecting cause-and-effect.** Reading is still the source of knowledge, *how and where* I read makes all the difference: I want to poke a simulated server first, see a "Live Server X-Ray" of how my input lands inside the backend code, watch a 4-slide visual story, make a 10-second prediction, and only read bite-sized explanations when I want to go deeper.
   - **Everyday Analogies & Plain English:** Every topic starts with a relatable 2-sentence everyday analogy (`💡 Everyday Analogy`) and translates jargon inline via interactive `<Term id="...">` tooltips.
2. **My Aesthetic & UI/UX Taste:**
   - **Eye-Soothing, Uncluttered, Never Congested:** When everything (interactive simulators, long prose guides, and 15 lab cards) is dumped onto one vertical page, it looks clumsy and overwhelming. Keep the layout spacious, centered (`max-width: 1000px`), and segmented into clean **1-thing-at-a-time modes** (`1. Interactive Studio`, `2. Practice Labs`, `3. Deep-Dive Guide`).
   - **Atmosphere Themes:** We have a 4-palette live switcher (`🎨 Theme` in the top navbar) with **🌊 Ocean Slate** (default), **🌲 Matcha Forest**, **🔮 Velvet Indigo**, and **☕ Warm Espresso**, supporting both Dark and Light modes. Any new UI components must use our CSS custom properties (`--wd-accent`, `--wd-surface`, `--wd-border`, `--wd-on-brand`, etc.) so they adapt across all 4 palettes and both Dark/Light modes.
3. **How You (the AI Agent) Must Work With Me:**
   - **Go Beyond Only What I Mention:** Don't limit yourself strictly to the words in my prompt—proactively think about how to make every aspect of the website better, smoother, and more engaging for me.
   - **Ask Me With Examples (Only When Needed):** If you genuinely need my preference on a design or content choice, show me concrete visual/text options to pick from. Otherwise, don't interrupt me unnecessarily.
   - **Strict Subagent Oversight:** If you spawn subagents (especially faster/lighter `flash` models), **you must personally audit, review, and fix everything they produce** so everything meets your highest standard and follows your exact plan.
   - **MANDATORY Visual Verification Before Submitting:** Never submit UI changes blindly. Always build the site, launch a temporary local static server, take real browser screenshots using Playwright (`chromium`) across Desktop (`1440×900`), Mobile (`390×844`), Dark/Light modes, and interactive tabs, and **visually inspect the screenshots yourself (`read_file`)** to hunt down layout bugs before presenting the result.
   - **Deployment Workflow (No Background Server!):** Do **NOT** leave a persistent local background process running. I use the live GitHub Pages site: **`https://jannatuladon.github.io/websec-decompiled/`** (repo: `https://github.com/JannatulAdon/websec-decompiled.git`). Always deploy verified changes straight to GitHub Pages (`gh-pages` branch) and sync source code to `main`.

---

## 2. What We Have Built & Accomplished So Far

### A. 6-Stage Detective Curriculum (35 Case Files · 272 PortSwigger Labs · 78 Glossary Terms)
Replaced PortSwigger's intimidating textbook taxonomy with a **6-Stage Detective Investigation Path**:
- **🔍 Stage 1 · Recon & First Contact** (Cases 01–03): Information Disclosure, Path Traversal, Essential Skills
- **🔐 Stage 2 · Logins & Business Rules** (Cases 04–08): Authentication, Access Control, Business Logic, OAuth, JWT Attacks
- **🗄️ Stage 3 · Databases & Backend** (Cases 09–17): SQLi 00 Mental Model, SQLi 01 UNION, SQLi 02 Fingerprinting, SQLi 03 Blind, SQLi 04 WAF/XML, NoSQL Injection, OS Command Injection, SSRF, XXE
- **🌐 Stage 4 · Browser Bugs** (Cases 18–25): XSS 00 Mental Model, XSS 01 Contexts, XSS 02 Stealing Data, CSRF, CORS, Clickjacking, DOM-Based Bugs, WebSockets
- **⚙️ Stage 5 · Modern APIs & Frameworks** (Cases 26–32): API Testing, GraphQL, Prototype Pollution, SSTI, File Upload, Insecure Deserialization, Web LLM Attacks
- **⚡ Stage 6 · HTTP Wire & Timing** (Cases 33–35): HTTP Host Header Attacks, HTTP Request Smuggling, Web Cache Poisoning, Web Cache Deception, Race Conditions

### B. Segmented 3-Mode Workspace (`PageDossierHeader.vue`)
Every Case File opens into a clean, centered 1000px workspace with 3 top-level mode switcher cards (and no right-hand TOC sidebar clutter):
1. **`🎮 1. Interactive Studio` (Default Mode — Learn by Doing & Seeing)**
   Powered by `InteractiveWorkbench.vue` and `.vitepress/theme/data/interactive/{index,part1,part2,part3}.js`. Contains 4 balanced sub-tabs:
   - **`🧪 1. Poke the Server` (+25 XP):** Live Request & Server X-Ray Simulator with 4 clickable test presets (`1. Normal Request`, `2. Anomaly Probe`, `3. Logic Break`, `4. Edge Case Variation`), a live custom payload input box, a `🔒 Server: VULNERABLE` vs `🛡️ Server: PATCHED (SAFE)` toggle, macOS-style terminal windows for `1 · WHAT YOU SEND` and `2 · LIVE SERVER X-RAY` (with sky-blue developer code and an amber highlight pill on the user's injected input), and `3 · WHAT YOU OBSERVE` + `💡 Detective Takeaway`.
   - **`🎬 2. Visual Story (1/4)` (+20 XP):** 4-slide interactive visual storyboard highlighting the active architectural node (`1. Browser / Input`, `2. HTTP Request`, `3. Server Code`, `4. Impact / Result`) with live code/packet inspection and `Prev`/`Next` controls.
   - **`🧩 3. Predict & Spot` (+30 XP):** 10-second multiple-choice detective challenge asking the learner to spot the bug in a tiny target server snippet before reading the guide.
   - **`🕸️ 4. Clue → Bug Map`:** Interactive cards where clicking a browser/HTTP clue reveals **What It Means on the Server** and **Your Next Verification Move**.
2. **`🧪 2. Practice Labs` (Hands-on PortSwigger Challenges)**
   - Shows a difficulty filter bar (`All`, `Apprentice`, `Practitioner`, `Expert`, `Hide Solved`, `★ Saved Only`) and sub-category headings (`.wd-h2-has-labs`).
   - **100% of all 272 labs** (both the 254 non-SQLi labs in `LabGroup.vue` and the 18 SQLi labs in `sql-labs.js`) feature a progressive 3-step **`💡 Step-by-Step Clues (1 / 3 unlocked)`** drawer (`Unlock Next Clue (+1 remaining)`) plus collapsible full walkthroughs (`🛠️ Step-by-Step Solution` / `🔬 Full Walkthrough, Payload & Why It Works`), checkboxes (`Mark as Solved`), stars (`★ Star`), and personal notes (`📝 Note`).
3. **`📖 3. Deep-Dive Guide` (Reference Diagrams & Case Files)**
   - Hides all embedded lab cards so reading is completely distraction-free.
   - Displays a **Quick Section Jump Bar** (`JUMP TO SECTION: ...`) at the top (`PageDossierHeader.vue`), an `💡 Everyday Analogy` callout, a 3-step visual Case File trace (`.wd-case-pipeline`), collapsible `<details>` deep-dives, and a bottom CTA button (`TopicComplete.vue`) to switch directly into `2. Practice Labs`.

### C. Gamified Progress, XP Ranks & 4-Palette Theme Studio
- Tracked in `localStorage` (`websec-decompiled:v2` in `.vitepress/theme/progress.js`) with JSON export/import backup on the Home dashboard.
- **XP Formula:** `solvedLabs * 50 + interactiveDone * 25 + storyDone * 20 + puzzleDone * 30`.
- **Detective Ranks:** `🔎 Rookie Observer` (0 XP) → `🕵️ Field Investigator` (250 XP) → `🔓 Logic Breaker` (1,000 XP) → `⚡ Protocol Phantom` (3,000 XP) → `👑 Master Decompiler` (7,500 XP).

---

## 3. Codebase Map (`/mnt/win_data/Storage/Sync/ctf_learn`)

- **Configuration & Theme Entry:**
  - `.vitepress/config.mjs` — VitePress config, nav (`🗺️ Path`, `Stages 1–3`, `Stages 4–6`, `📖 Glossary`), 6-stage sidebar, Mermaid setup, `base: process.env.BASE_PATH || '/'`.
  - `.vitepress/theme/index.js` — Registers global components (`LabGroup`, `LabCheckbox`, `ProgressDashboard`, `GlossaryExplorer`, `TopicComplete`, `Term`, `InteractiveWorkbench`).
  - `.vitepress/theme/Layout.vue` — Injects `ProgressPill` in navbar, `PageDossierHeader` at `doc-before`, and `TopicComplete` at `doc-after`.
  - `.vitepress/theme/progress.js` — Reactive `localStorage` state for solved labs, starred labs/topics, personal notes, interactive studio XP, last visited topic, and active `palette` (`ocean`, `sage`, `indigo`, `espresso`).
  - `.vitepress/theme/styles/custom.css` — Complete styling system, 4-palette CSS variable overrides (`html[data-wd-palette="..."]`), segmented workspace visibility rules (`wd-view-studio`, `wd-view-labs`, `wd-view-guide`), macOS terminal windows (`.wd-termwin`), and mobile responsiveness.
- **Vue Components (`.vitepress/theme/components/`):**
  - `PageDossierHeader.vue` — Hero card, Key Terms drawer, Notes drawer, Save button, 3-mode switcher (`Interactive Studio`, `Practice Labs`, `Deep-Dive Guide`), Quick Section Jump Bar (in Guide mode), and difficulty filter bar (in Labs mode).
  - `InteractiveWorkbench.vue` — The 4-tab Interactive Studio component (`Poke the Server`, `Visual Story`, `Predict & Spot`, `Clue → Bug Map`).
  - `LabGroup.vue` — Renders non-SQLi PortSwigger lab cards with `tokenizeInlineCode()`, `buildFallbackHints()` (ensuring 100% of labs have 3-stage clues), and collapsible solutions.
  - `LabCheckbox.vue` — Portals into raw HTML `<section class="wd-lab">` blocks on SQLi pages (`09`–`13`) to inject interactive checkboxes, stars, notes, and progressive clues from `sql-labs.js`.
  - `ProgressDashboard.vue` — Home page (`index.md`) dashboard with Continue Card, XP Rank progress bar, 1-click Random Unsolved Lab Picker, and the 6-Stage Interactive Roadmap.
  - `ProgressPill.vue` — Top navbar `🎨 Theme` 4-palette dropdown switcher and `⚡ XP | X/272 labs` pill.
  - `GlossaryExplorer.vue` & `Term.vue` — Interactive 78-term plain-English glossary (`/glossary/`) and inline hover/tap tooltips.
  - `TopicComplete.vue` — Bottom mode-aware CTA banner and Previous/Next Case File navigation cards.
- **Data Layer (`.vitepress/theme/data/`):**
  - `catalog.js` — Master metadata for the 6 Stages and 35 Case Files.
  - `interactive/index.js`, `part1.js`, `part2.js`, `part3.js` — Interactive Studio simulations, 4-slide stories, 10-second prediction puzzles, and clue maps for all 35 Case Files.
  - `content/*.js` — Authored lab metadata, notes, hints, and steps for all 30 non-SQLi topics (254 labs).
  - `sql-labs.js` — Progressive clues and walkthroughs for the 18 SQLi labs across units `09`–`13`.
  - `glossary.js` — 78 plain-English glossary definitions with analogies.

---

## 4. Verification & GitHub Pages Deployment Commands

### 1. Build & Integrity Checks (Always Run Before Deploying)
```bash
npm run check:labs
BASE_PATH=/websec-decompiled/ npm run build
npm run check:links
```
- `check:labs` verifies all 272 labs across 35 units render exactly once.
- `check:links` verifies all 2,959+ internal links across all 38 built HTML pages resolve.

### 2. Deploying to GitHub Pages

Use the existing `.release/source` (main) and `.release/pages` (gh-pages) checkouts. Preserve branch history with ordinary commits and pushes. Never replace either branch with a force push. `.release` and generated artifacts are excluded from source synchronization.

1. Run production checks and review real Chromium screenshots before publishing.
2. Fetch both remote branches and ensure the checkouts have no unexpected divergence.
3. Sync source into `.release/source` with rsync, excluding `.git`, `.release`, `node_modules`, `.vitepress/dist`, `.vitepress/cache`, `artifacts`, environment files, and credentials. Review the staged diff, commit, and push to main.
4. Sync `.vitepress/dist/` into `.release/pages`, preserving `.git`. Add `.nojekyll`, review the diff, commit, and push to gh-pages.
5. Check the GitHub Pages build, compare the live index SHA-256 with the reviewed build, and exercise the published application on desktop and mobile.
6. Stop the temporary static server. Record the exact deployed commit, tests, screenshots, and any limits in the local verification artifacts.

Hosting stays at https://jannatuladon.github.io/websec-decompiled/ . The authenticated GitHub CLI can provide credentials through `gh auth git-credential`; do not print credentials or embed them in commands.
