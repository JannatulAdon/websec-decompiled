# Websec Decompiled rebuild · 2026-10-22

The guided investigation platform is published at https://jannatuladon.github.io/websec-decompiled/. Source and GitHub Pages updates retain repository history. The local release record in `artifacts/live-verification.json` records the deployed commit and live desktop/mobile checks; `artifacts/browser/status.json` records the verified production-build hash.

## Guided investigation update

User feedback called for a more engaging experience with less empty space and less typing. Every lesson now opens a fictional app with ready input choices. Clicking an example runs the existing local model immediately; a custom editor remains available. The three-step coach supports an ordinary request, a changed condition, and a protected comparison when the model has a relevant boundary. Models without a protected branch use a two-condition comparison instead.

Product, catalogue, invoice, and checkout previews derive their contents from actual model results. Other lessons use a labelled tool/workbench response. No input-controlled HTML is mounted or executed. The server inspector highlights matching input text, baseline comparisons show both results, and the last five successful requests can be revisited. Experiments remain mounted when the learner switches between lesson modes.

The lesson sidebar is replaced by a compact selector with previous/next navigation. Analogies and background material remain available on demand. A compact phone task bar keeps guidance close to the app, with fuller explanations below it. The homepage includes an editable product-ID demonstration, and all six fictional investigation workspaces offer optional ready requests. Existing learning records and lab completion records retain their storage schema.

Browser verification covers ready examples, custom edits, boundary comparison, reset, guided continuation, experiment preservation across tabs, the homepage interaction, all 176 lesson presets on both device profiles, normal/hover button contrast, selected-example contrast in all eight theme combinations, and the existing practice/backup flows. An insufficient light-espresso example contrast was found and corrected during verification.

## Learning coverage

- 35 modules in 7 stages, beginning with requests, sessions, encoding, and controlled investigation.
- 176 concept lessons with an editable local experiment for every lesson, including later variants rather than one reused introduction per topic.
- 35 module transfer cases and 35 practical guides covering recognition, investigation, tools, and limits.
- 6 independent fictional investigation workspaces, including a two-feature capability chain. Learners edit requests and keep an evidence notebook; the teaching trace is optional.
- Explicit prerequisite records for all 272 retained Academy lab links, including cross-topic prerequisites. The mapping no longer infers skills from lab-title keywords.
- Practice search, difficulty/topic filters, saved/solved filters, notes, progressive reasoning prompts, and pagination in sets of 12.
- 84 plain-English definitions, inline explanations, and everyday analogies.

## Progress and presentation

Concept checks require interaction with the relevant experiment and correct evidence/mechanism answers. Module transfer checks, investigation records, and self-reported solved labs remain separate. Progress includes three-day review scheduling, notes, and JSON import/export. Old lab records, bookmarks, and topic/lab notes migrate without converting old XP into mastery.

The layout provides one active lesson mode at a time, four atmosphere palettes in dark/light, mobile lesson navigation, keyboard-operated tabs, a functioning skip link, and reduced-motion support. Visual review caught and corrected analogy typography, headline wrapping, mobile active-lesson positioning, stale notifications, offscreen focus artifacts, and normal/hover button contrast.

## Verification evidence

- `npm run check:curriculum`: 35 modules, 176 lesson records/models, 35 transfer cases, 35 practical guides, 6 workspaces, and 272 explicit preparation records pass structural and model checks.
- `npm run check:ui`: actual compiled Vue components pass route, model-input, protected-boundary, gated-completion, filtering, migration, and persistence tests.
- `npm run check:labs`: retained archived source and catalogue remain internally consistent.
- `BASE_PATH=/websec-decompiled/ npm run build`: production build passes.
- `npm run check:links`: 90 generated page/application references pass across 38 HTML files, including legacy redirects.
- Playwright/Chromium against a temporary static server: every lesson’s control/probe and available protected branch exercised at 1440×900 and 390×844. No runtime errors or horizontal viewport overflow observed.
- Browser checks cover all 272 practice entries across pagination, keyboard tab changes, transfer records, a fictional investigation, legacy redirects, and progress export/import.
- Normal and hovered primary-button text contrast checked in every palette and dark/light mode.
- 72 screenshots captured for the guided-investigation update. Theme/mode contact sheets and representative full-size experiment, advanced-topic, investigation, practice, and guide screenshots personally inspected.

Local evidence is in `artifacts/browser/status.json`, `artifacts/browser/`, and `artifacts/curriculum-audit.json`. These generated artifacts are excluded from source synchronization. The temporary server has been stopped. Live desktop/mobile smoke checks additionally verified asset loading, an advanced local experiment, practice search, and preparation-link navigation; two live screenshots are saved alongside the 72 pre-publication screenshots.

## Release implementation

The active application is `.vitepress/theme/rebuilt/`. The former Markdown lessons and components remain archived in source for history; their walkthroughs are excluded from the production build. Thirty-six old learning URLs redirect into the new curriculum. Build output is cleaned once before VitePress runs its parallel bundles, preventing stale assets and internal handoff files from being published.

Hosting remains GitHub Pages. Deployment and source synchronization use ordinary commits preserving branch history. The deployment commit is `7f2de58b1a8d48a9c68b529dc59bb7af2314e591` on `gh-pages`.

## Scope

The retained catalogue is the user’s 272-lab target set, not a promise to match every future Academy release. The experiments deliberately model bounded mechanisms; cryptography, framework behavior, database grammars, shells, networks, and proxy connections are not full production implementations. Each exercise states its scope, and primary references/practical guides support further investigation. Completing a concept check is preparation rather than a guarantee of solving an unfamiliar challenge.

No Academy lab instance was launched, attempted, or solved. Browser tests used fictional local fixtures and disposable browser storage; the user’s Academy account and lab completion state were not changed. Changes remain within development and deployment of this platform.
