# Websec Decompiled

A browser-local web security learning platform for learning how to investigate unfamiliar CTF applications.

The new application replaces the old theme and lesson interface. It uses a newly authored curriculum and retains the factual catalogue of 272 Academy lab links. Original Markdown and lesson components remain in source as an archive; the production build excludes them. Existing public URLs redirect into the new curriculum.

## Learning experience

- 35 modules in 7 stages, beginning with HTTP, sessions, parsers, and controlled investigation.
- 176 short concept scenarios covering mechanisms, observable evidence, failed-probe explanations, and transfer questions.
- 176 guided lesson investigations with clickable input examples, immediate app responses, optional custom editors, highlighted decision traces, and baseline comparisons. These compute selected behavior locally; they are deliberately limited models rather than live exploitation labs.
- 35 unfamiliar-scenario transfer checks, 35 practical investigation guides, and 6 independent fictional investigation workspaces.
- 272 searchable Academy lab links with relevant concept lessons, investigation prompts, bookmarks, solved records, and notes. Every retained lab has an explicit prerequisite map; links teach mechanisms without revealing challenge solutions.
- A small fictional app is the main lesson workspace. A three-step coach suggests the next action; recent requests can be replayed, and experiments survive lesson-tab changes. Mobile layouts place a compact task prompt before the app.
- An interactive product-ID example on the homepage and optional ready requests in all six fictional investigations.
- Four atmosphere palettes in dark and light modes; responsive layouts; keyboard-operated lesson tabs and inline term definitions.
- Separate concept checks, transfer checks, solved labs, notes, JSON backups, legacy progress migration, and three-day review scheduling.

All application navigation uses hash routes so deep links work on GitHub Pages without a backend. Existing topic URLs lead into the rebuilt curriculum.

## Develop and build

```sh
npm ci
npm run dev
BASE_PATH=/websec-decompiled/ npm run verify
```

The prebuild script cleans generated output once. VitePress's parallel client/server bundles must not race to clean the same NTFS directory.

Progress stays in the browser under `websec-decompiled:rebuild:v1`. The older storage keys are read for migration and left untouched. Old XP does not become a new concept or transfer check. Importing backups merges progress; there is no reset operation in the UI.

## Verification

```sh
npm run check:curriculum
npm run check:ui
npm run check:labs
BASE_PATH=/websec-decompiled/ npm run build
npm run check:links
npm run check:browser
```

`check:curriculum` validates records, preparation mappings, local model invariants, parser behavior, and backup normalization. `check:ui` compiles the actual Vue components into a custom renderer to test state and event flows; it is not a browser or layout test. `check:labs` retains the legacy source-catalogue integrity audit. `check:links` understands both generated files and application routes.

`check:browser` needs Playwright and Chromium in an environment that permits browser processes. It serves built files through Playwright request interception, so it needs no background HTTP server by default. Set `QA_BASE_URL` to exercise a temporary static server instead. If Playwright is supplied outside this project's module resolution, set `PLAYWRIGHT_MODULE` to its absolute `index.mjs` path. Optionally set `CHROMIUM_PATH` to a Chromium executable. Screenshots and an explicit status report go into `artifacts/browser/`.

Before publication, personally inspect the generated screenshots at 1440×900 and 390×844, across all four palettes in dark/light modes and the lesson/practice interactions. A successful automated run alone does not establish visual quality. A blocked run records zero screenshots and must not be reported as visual verification.

## Source map

- `.vitepress/theme/rebuilt/LearningApp.vue`: application shell, routing, learning modes, practice, reference, progress.
- `.vitepress/theme/rebuilt/curriculum.js`: new lessons, stages, lab-preparation relevance rules.
- `.vitepress/theme/rebuilt/MiniSystem.vue`: guided tasks, input choices, local model execution, comparisons, request history.
- `.vitepress/theme/rebuilt/AppResponse.vue`: product, invoice, checkout, and tool response views driven by model results.
- `.vitepress/theme/rebuilt/interaction.js`: input examples and fictional app presentation metadata.
- `.vitepress/theme/rebuilt/experiments/`: lesson-specific executable models, including advanced variants.
- `.vitepress/theme/rebuilt/preparation-map.js`: explicit prerequisite records for all 272 retained labs.
- `.vitepress/theme/rebuilt/missions.js`: independent fictional investigations.
- `.vitepress/theme/rebuilt/playbooks.js`: general tool and investigation workflows.
- `.vitepress/theme/rebuilt/models.js`: restricted SQL, virtual path, detached HTML-parser models.
- `.vitepress/theme/rebuilt/cases.js`: scenario-based transfer assessments.
- `.vitepress/theme/rebuilt/store.js`: progress schema, migration, notes, backup normalization.
- `.vitepress/theme/rebuilt/style.css` and `guided.css`: theme tokens and responsive layouts.

## Hosting

Intended hosting remains GitHub Pages at `https://jannatuladon.github.io/websec-decompiled/`. Do not publish before the screenshot review passes. Retain repository history when syncing source and deploying the built files; do not use the old handoff's force-replacement deployment recipe.

See `REBUILD_REPORT.md` for the release record, verification evidence, and the models’ scope.
