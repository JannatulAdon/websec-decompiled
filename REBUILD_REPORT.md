# SSRF technical workbench correction · 2026-10-23

The SSRF sample now uses a functional import form with a technical HTTP inspector and the executed handler source. It replaces the illustrated network story at the same sample URL. The form’s URL becomes a POST body; the handler creates an outgoing GET and forwards its Response. The code view reads the actual source module, and the optional pause holds the actual awaited upstream operation.

This executes locally with fixed upstream fixtures. It does not claim a hosted backend or real access to an internal network. An internal text response is visible in the response inspector while the image preview reports that it is not an image. The browser-access boundary, origin restriction, malformed input, unsent changes, and stale-execution cancellation are checked explicitly.

Production verification passes curriculum, model invariants, handler/source integrity, compiled Vue state, the 272-lab catalogue audit, the build, and internal links. Playwright exercises desktop 1440×900 and mobile 390×844 in light/dark, including handler source agreement, real pause/resume, request/response records, normal-button and label contrast, keyboard tabs, unchanged learner records, and 32 screenshots personally reviewed before publication. Exact publication and live checks are recorded in `artifacts/live-verification.json`.

Other lessons retain the previous interface until this focused technical approach is reviewed. Earlier release notes follow as history.

---

# Guided workshop update · 2026-10-23

The user reported confusion about the previous learning sample, then authorized completing the broader platform autonomously. The default lesson now introduces the idea and purpose, names the setting, asks an individually authored question, and guides a starting-input / changed-input comparison. All 35 modules and 176 existing bounded experiments use this flow. The main explanations teach the mechanism; simulator implementation notes are optional.

The homepage, stage path, lesson workspace, and practice presentation share the refreshed workshop design. Navigation and advanced tools are grouped into a drawer. New users start in light mode; existing theme preferences and stored records remain respected. The inspector follows the active guided/free-exploration view and does not mix their snapshots.

The SSRF introduction now teaches a concrete fictional task: retrieve a staff preview code through a picture importer. It establishes normal server fetching, demonstrates the direct-browser boundary, exposes the code through an unintended server request, and checks the causal explanation. The optional rule comparison appears afterward. No destination is contacted.

Verification includes production checks, all 176 guided lessons on both device profiles, 378 guided device/theme flows in total, the existing full free-exploration/practice/backup browser suite, all thirteen visualization kinds on desktop/mobile in dark/light, and focused SSRF/encoding checks. Screenshots are personally reviewed before publication. Current evidence and exact publication details are in the local `artifacts/` reports. The original release report follows as historical context.

---

# Websec Decompiled rebuild · 2026-10-22

The guided investigation platform is published at https://jannatuladon.github.io/websec-decompiled/. Source and GitHub Pages updates retain repository history. The local release record in `artifacts/live-verification.json` records the deployed commit and live desktop/mobile checks; `artifacts/browser/status.json` records the verified production-build hash.

## Live visualization update

Every lesson now includes an evidence inspector driven by immutable request snapshots and actual model output. Thirteen scene kinds include routes, sessions, transformations, query matches, paths, ownership, balances, race ordering, inert parsed elements, virtual destinations, cache reuse, byte boundaries, and connected checkpoint flows. Click records or race operations for details, step through reported checkpoints, compare recent requests, or inspect the raw trace. Diagram changes use theme tokens and respect reduced motion.

The inspector distinguishes input changes, interpretation changes, and response changes; equal responses cannot hide changed interpretation. Custom editors offer optional debounced live preview. Unsent edits stay labelled and never silently replace the displayed observation. Phone layouts place the same inspector between controls and response, with a compact current-effect prompt.

An independent read-only browser audit identified navigation, state-loss, accessibility, and comparison issues. Fixes and verification details are in `AUDIT_REPORT.md`. Fictional investigation drafts now restore requests, bounded logs, hypotheses, and notes per workspace across reloads. Drafts remain separate from exported checked progress; saved investigation records retain backup support.

## Guided investigation update

User feedback called for a more engaging experience with less empty space and less typing. Every lesson now opens a fictional app with ready input choices. Clicking an example runs the existing local model immediately; a custom editor remains available. The three-step coach supports an ordinary request, a changed condition, and a protected comparison when the model has a relevant boundary. Models without a protected branch use a two-condition comparison instead.

Product, catalogue, invoice, and checkout previews derive their contents from actual model results. Other lessons use a labelled tool/workbench response. No input-controlled HTML is mounted or executed. The server inspector highlights matching input text, baseline comparisons show both results, and the last five successful requests can be revisited. Experiments remain mounted when the learner switches between lesson modes.

The lesson sidebar is replaced by a compact selector with previous/next navigation. Analogies and background material remain available on demand. A compact phone task bar keeps guidance close to the app, with fuller explanations below it. The homepage includes an editable product-ID demonstration, and all six fictional investigation workspaces offer optional ready requests. Existing learning records and lab completion records retain their storage schema.

Browser verification covers ready examples, custom edits, boundary comparison, reset, guided continuation, experiment preservation across tabs, the homepage interaction, all 176 lesson presets on both device profiles, normal/hover button contrast, selected-example contrast in all eight theme combinations, and the existing practice/backup flows. An insufficient light-espresso example contrast was found and corrected during verification. Final review also corrected the presentation of empty query results so they are not labelled as rejected requests.

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

The layout provides one active lesson mode at a time, four atmosphere palettes in dark/light, mobile lesson navigation, keyboard-operated tabs, a functioning skip button, and reduced-motion support. Visual review caught and corrected analogy typography, headline wrapping, mobile active-lesson positioning, stale notifications, offscreen focus artifacts, and normal/hover button contrast.

## Verification evidence

- `npm run check:curriculum`: 35 modules, 176 lesson records/models, 35 transfer cases, 35 practical guides, 6 workspaces, and 272 explicit preparation records pass structural and model checks.
- `npm run check:visuals`: diagram/result agreement, all 24 race orderings, comparison facts, framing validation, and bounded draft restoration pass.
- `npm run check:ui`: actual compiled Vue components pass route, model-input, protected-boundary, gated-completion, filtering, migration, and persistence tests.
- `npm run check:labs`: retained archived source and catalogue remain internally consistent.
- `BASE_PATH=/websec-decompiled/ npm run build`: production build passes.
- `npm run check:links`: 90 generated page/application references pass across 38 HTML files, including legacy redirects.
- Playwright/Chromium against a temporary static server: every lesson’s control/probe and available protected branch exercised at 1440×900 and 390×844. No runtime errors or horizontal viewport overflow observed.
- Browser checks cover all 272 practice entries across pagination, keyboard tab changes, transfer records, a fictional investigation, legacy redirects, and progress export/import.
- Normal and hovered primary-button text contrast checked in every palette and dark/light mode.
- Browser screenshots cover all eight palette/mode combinations, both device profiles, lesson modes, all thirteen visualization kinds in dark/light, and practice/reference/investigation flows. Contact sheets and representative full-size screenshots are personally inspected before publication; exact files and status are recorded in the local artifacts.

Local evidence is in `artifacts/browser/status.json`, `artifacts/browser/`, and `artifacts/curriculum-audit.json`. These generated artifacts are excluded from source synchronization. The temporary server has been stopped. Live desktop/mobile smoke checks additionally verified asset loading, an advanced local experiment, practice search, and preparation-link navigation; two live screenshots are saved alongside pre-publication screenshots.

## Release implementation

The active application is `.vitepress/theme/rebuilt/`. The former Markdown lessons and components remain archived in source for history; their walkthroughs are excluded from the production build. Thirty-six old learning URLs redirect into the new curriculum. Build output is cleaned once before VitePress runs its parallel bundles, preventing stale assets and internal handoff files from being published.

Hosting remains GitHub Pages. Deployment and source synchronization use ordinary commits preserving branch history. The deployed `gh-pages` commit and live verification results are recorded in `artifacts/live-verification.json`.

## Scope

The retained catalogue is the user’s 272-lab target set, not a promise to match every future Academy release. The experiments deliberately model bounded mechanisms; cryptography, framework behavior, database grammars, shells, networks, and proxy connections are not full production implementations. Each exercise states its scope, and primary references/practical guides support further investigation. Completing a concept check is preparation rather than a guarantee of solving an unfamiliar challenge.

No Academy lab instance was launched, attempted, or solved. Browser tests used fictional local fixtures and disposable browser storage; the user’s Academy account and lab completion state were not changed. Changes remain within development and deployment of this platform.
