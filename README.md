# Websec Decompiled

A browser-local web security learning platform for learning how to investigate unfamiliar CTF applications.

The new application replaces the old theme and lesson interface. It uses a newly authored curriculum and retains the factual catalogue of 272 Academy lab links. Original Markdown and lesson components remain in source as an archive; the production build excludes them. Existing public URLs redirect into the new curriculum.

## Current learning experience

The user authorized a platform-wide rollout after identifying that open-ended simulators did not explain the goal or what a result meant. The default is now a guided workshop, with a plain-English definition and purpose for all 35 topics, and an individually authored question for each of the 176 lessons. `GuidedLesson.vue` runs each lesson’s existing bounded model: see the starting example, change the displayed values, compare the actual result, then explain the evidence. Before/After buttons restore the exact snapshots. Rules, traces, and arbitrary editing are optional rather than prerequisites for understanding the first action.

The homepage gives a clear next lesson, the ordered path opens one stage at a time, and lesson navigation lives in an expandable tools drawer. The refreshed workshop styling uses readable sans-serif text, quieter surfaces, and the existing four palettes in light/dark modes. New browsers start in light mode; saved appearance preferences are preserved. Concept checks still require interaction and two correct answers. No guided click marks a real lab solved.

The SSRF sample at `#/sample/ssrf` now opens a focused four-section lesson: a normal photo import, an internal destination, a causal explanation, and a different link-preview application. Each early state has one primary task. Results move into view with the explanation beside the relevant evidence. Incorrect choices receive specific feedback. After a successful transfer attempt the completed controls collapse to a submitted-value summary, leaving the evidence question as the task.

`SsrfSample.vue` and `ssrf-lesson.css` implement the lesson. `ssrf-transfer.js` runs the separate Reader preview handler with native Request/Response objects; changing a title or colour does not alter the outgoing URL. The former complete inspector remains in `SsrfWorkbench.vue`, available after the lesson, with its actual-source view, editable drafts, destination restriction, and awaited fetch pause.

Both applications execute locally with fixed fixture transport. No real backend is hosted on GitHub Pages and no supplied hostname is contacted. The browser-access failure models configured reachability. Neither guided completion nor workbench actions mark concepts or actual labs solved. Existing learner records are preserved. The short sample does not claim coverage of all SSRF variants.

Read [RESEARCH_DESIGN.md](RESEARCH_DESIGN.md) for the educational evidence, contrary findings, evidence-to-design reasoning, and limits. Technical checks do not establish that this learner understands the lesson. The current sample still needs the learner’s experience before wider rollout.

`npm run check:guided` exercises all 176 guided lessons on desktop/mobile, plus selected lessons in both themes, opening-action visibility for all topics, exact input changes, Before/After restoration, tab preservation, and gated progress. `npm run check:browser` covers the optional free-exploration workspaces, all palettes, labs, investigations, and backups. `npm run check:ssrf-lesson` exercises the four-section lesson in desktop/mobile light/dark, including wrong-answer feedback and preservation of seeded learner records. `npm run check:ssrf-transfer` tests the separate Reader handler. `npm run check:ssrf-runtime` checks the importer handler, and `npm run check:ssrf-sample` exercises the technical workbench. `npm run check:sample` covers the encoding sample. Browser environment variables are described below. Evidence is kept in `artifacts/workshop/`, `artifacts/browser/`, `artifacts/ssrf-workbench/`, and `artifacts/encoding-sample-v2/`.

## Learning experience

- 35 modules in 7 stages, beginning with HTTP, sessions, parsers, and controlled investigation.
- 176 short concept scenarios covering mechanisms, observable evidence, failed-probe explanations, and transfer questions.
- 176 guided lesson investigations with clickable input examples, immediate app responses, optional custom editors, highlighted decision traces, and baseline comparisons. These compute selected behavior locally; they are deliberately limited models rather than live exploitation labs.
- 35 unfamiliar-scenario transfer checks, 35 practical investigation guides, and 6 independent fictional investigation workspaces.
- 272 searchable Academy lab links with relevant concept lessons, investigation prompts, bookmarks, solved records, and notes. Every retained lab has an explicit prerequisite map; links teach mechanisms without revealing challenge solutions.
- The guided lesson shows one task, the exact values being changed, the computed response, and a mechanism visualization. Optional free exploration adds ready input chips, custom editors, comparisons, and recent request replay.
- An optional product-ID playground on the homepage and ready requests in all six fictional investigations.
- Live mechanism diagrams show actual routes, query matches, resolved paths, ownership gates, parsed elements, network destinations, cache reuse, request boundaries, shared-state races, and balance changes. Other lessons render their actual checkpoints as a connected decision flow.
- Step through reported checkpoints, compare any recent request, and distinguish changed inputs, interpretation, and response. Optional live preview runs custom edits after a short pause; unsent drafts remain clearly separate from the last observation.
- Investigation requests, evidence logs, and notebook drafts survive mode changes, workspace switches, and reloads in the same browser.
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

Investigation drafts use `websec-decompiled:investigation-drafts:v1`; they stay in this browser and are separate from exported checked progress. Saved investigation records remain in progress backups.

Progress stays in the browser under `websec-decompiled:rebuild:v1`. The older storage keys are read for migration and left untouched. Old XP does not become a new concept or transfer check. Importing backups merges progress; there is no reset operation in the UI.

## Verification

```sh
npm run check:curriculum
npm run check:visuals
npm run check:ui
npm run check:labs
BASE_PATH=/websec-decompiled/ npm run build
npm run check:links
npm run check:guided
npm run check:browser
npm run check:ssrf-lesson
npm run check:ssrf-sample
npm run check:sample
```

`check:visuals` checks diagram facts against model results, including query binding, ownership, paths, request framing, all 24 race orderings, comparisons, and draft validation. `check:curriculum` validates records, preparation mappings, local model invariants, parser behavior, and backup normalization. `check:ui` compiles the actual Vue components into a custom renderer to test state and event flows; it is not a browser or layout test. `check:labs` retains the legacy source-catalogue integrity audit. `check:links` understands both generated files and application routes.

`check:browser` needs Playwright and Chromium in an environment that permits browser processes. It serves built files through Playwright request interception, so it needs no background HTTP server by default. Set `QA_BASE_URL` to exercise a temporary static server instead. If Playwright is supplied outside this project's module resolution, set `PLAYWRIGHT_MODULE` to its absolute `index.mjs` path. Optionally set `CHROMIUM_PATH` to a Chromium executable. Screenshots and an explicit status report go into `artifacts/browser/`.

Before publication, personally inspect the generated screenshots at 1440×900 and 390×844, across all four palettes in dark/light modes and the lesson/practice interactions. A successful automated run alone does not establish visual quality. A blocked run records zero screenshots and must not be reported as visual verification.

`npm run check:scenes` uses a temporary static server at `QA_BASE_URL` (default port 4173), with the same browser environment variables. It captures thirteen scene kinds on desktop/mobile in dark/light modes and verifies equal-response interpretation differences. See `AUDIT_REPORT.md` for the independent review and resulting fixes.

## Source map

- `.vitepress/theme/rebuilt/LearningApp.vue`: application shell, routing, learning modes, practice, reference, progress.
- `.vitepress/theme/rebuilt/curriculum.js`: new lessons, stages, lab-preparation relevance rules.
- `.vitepress/theme/rebuilt/teaching.js`, `GuidedLesson.vue`, and `workshop.css`: topic definitions, purposes, 176 lesson questions, guided model comparisons, and the refreshed interface.
- `.vitepress/theme/rebuilt/MiniSystem.vue`: guided tasks, input choices, local model execution, comparisons, request history.
- `.vitepress/theme/rebuilt/EvidenceLens.vue`, `ModelScene.vue`, and `visual-data.js`: live diagrams, actual checkpoints, immutable request comparisons, and observation summaries.
- `.vitepress/theme/rebuilt/investigation-drafts.js`: validated browser-local request/log/notebook restoration, separate from checked progress.
- `.vitepress/theme/rebuilt/AppResponse.vue`: product, invoice, checkout, and tool response views driven by model results.
- `.vitepress/theme/rebuilt/interaction.js`: input examples and fictional app presentation metadata.
- `.vitepress/theme/rebuilt/experiments/`: lesson-specific executable models, including advanced variants.
- `.vitepress/theme/rebuilt/preparation-map.js`: explicit prerequisite records for all 272 retained labs.
- `.vitepress/theme/rebuilt/missions.js`: independent fictional investigations.
- `.vitepress/theme/rebuilt/playbooks.js`: general tool and investigation workflows.
- `.vitepress/theme/rebuilt/models.js`: restricted SQL, virtual path, detached HTML-parser models.
- `.vitepress/theme/rebuilt/cases.js`: scenario-based transfer assessments.
- `.vitepress/theme/rebuilt/store.js`: progress schema, migration, notes, backup normalization.
- `.vitepress/theme/rebuilt/style.css` `guided.css`, and `visual.css`: theme tokens and responsive layouts.

## Hosting

Intended hosting remains GitHub Pages at `https://jannatuladon.github.io/websec-decompiled/`. Do not publish before the screenshot review passes. Retain repository history when syncing source and deploying the built files; do not use the old handoff's force-replacement deployment recipe.

See `REBUILD_REPORT.md` for the release record, verification evidence, and the models’ scope.
