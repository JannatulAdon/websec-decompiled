# Visualization and usability audit · 2026-10-22

The requested fresh agent performed a read-only audit of the application and targeted Chromium checks. The primary agent reviewed the findings, implemented the changes, inspected the resulting screenshots, and ran the full production/browser verification. No Academy lab instance was opened or attempted.

## Findings and changes

| Finding | Result |
| --- | --- |
| Most observations were generic text, separated from the controls. | Every lesson now has a live inspector built from actual model facts. Thirteen scene kinds cover routes, sessions, representations, queries, paths, ownership, balances, shared state, parsed elements, virtual networks, cache entries, byte boundaries, and connected checkpoints. |
| Editing inputs could leave an old response under a live-looking label. | Responses and diagrams use immutable sent-request snapshots. Unsent edits are labelled. Optional debounced live preview is available in custom editors. |
| Comparisons overlooked interpretation changes when the output stayed the same. | Inputs, interpretation, and response are compared separately. Trace differences open automatically for equal-response interpretation changes. Recent requests can become pinned references. |
| The skip link could navigate away from the lesson through the hash router. | A keyboard-accessible skip button directly focuses and scrolls the main workspace while retaining the route. |
| Switching investigation modes discarded requests and notebook work. | Modes remain mounted. Validated per-workspace drafts restore request envelopes, the latest 20 evidence entries, hypotheses, and notes across reloads. Saved records and checked progress remain separate from drafts. |
| Lesson/reference/investigation tabs lacked complete panel relationships. | Tabs identify their associated panels with IDs, roles, and accessible labels. Keyboard switching remains supported. |
| Status labels could imply rejection or success from output wording. | Models supply explicit statuses where known. Other responses stay neutral; an empty query result is not described as a denied request. |
| Unknown framing boundaries could look like a confirmed mismatch. | Unknown, incomplete, equal, and different known boundaries are distinct. Content-Length accepts whole numbers only. |
| A comparison option disappeared when replaying the reference request. | Current and pinned references remain valid and labelled. |
| After 20 investigation requests, the newest evidence entry did not automatically open. | Selection uses the actual request identity after bounded history trimming. |

Additional checks corrected query visualizations to show the full actual query and bound value, and balance bars to use a shared before/after scale. Diagrams display model facts rather than invented timing, network traffic, or execution.

## Verification

- Production verification passes curriculum/model checks, visual invariants, compiled Vue state tests, the retained 272-lab catalogue audit, the build, and 90 generated/application links across 38 HTML files.
- Visual invariants cover query matches/binding, ownership, resolved/blocked paths, all 24 race schedules, framing validation, comparison differences, and bounded draft restoration.
- The full Chromium suite exercises all 176 lesson presets and available protected branches on desktop 1440×900 and mobile 390×844, plus keyboard tabs, practice pagination, transfer checks, legacy redirects, investigations, and progress backups.
- A separate scene suite captures all thirteen scene kinds on desktop/mobile in dark/light modes and checks equal-response interpretation comparisons. The full suite additionally checks all four palettes in both modes, including normal/hover/selected-example contrast.
- Independent targeted browser rechecks pass navigation, comparison replay, history trimming beyond 20 entries, and ownership/path/race/DOM/network scenes on both devices.
- The primary agent personally reviewed the theme, scene, and flow contact sheets plus full-size representative screenshots. No viewport overflow, layout collisions, clipping, or browser runtime errors were found in the exercised flows.

Generated evidence is kept locally under `artifacts/browser/`, `artifacts/scenes/`, `artifacts/audit/`, and `artifacts/review/`. Automated test results and personal visual inspection are recorded separately in their status files. Live publication checks are recorded in `artifacts/live-verification.json`.

## Limits

The audit covers the built platform and bounded fictional models. It does not certify full browser, database, proxy, or cryptographic implementations, or guarantee success on an unfamiliar CTF. No remote challenge was solved, and the user's Academy records were not changed. Investigation drafts stay in this browser; checked investigation records are included in progress backups.


## Learning-direction review · 2026-10-23

The user reported not understanding what SSRF meant, why it mattered, or what to do on arrival, despite completing the earlier sample. This review was performed by the primary agent; the independent agent audit above belongs to the earlier visualization release.

Observed design problems were competing controls before a task, unexplained application context, implied rather than explicit learning goals, and a network result with little meaning to a beginner. These are plausible causes of the reported confusion, not a claim to have measured the learner’s understanding.

Changes:

- SSRF now states its meaning and purpose first. Postcard Studio is introduced as a picture importer; the goal is a fictional staff preview code. Controls appear in order. A direct browser failure establishes the network boundary before the server request reveals the code. Incorrect choices receive specific explanations. The fix appears only after the causal understanding check.
- Every topic now has an authored definition, purpose, and named setting. All 176 lessons have individual questions. The guided default computes actual control/probe results, highlights changed fields, supports exact Before/After replay, and places the explanation alongside the result. More technical detail and free exploration remain accessible.
- The home, path, lesson, and practice presentation uses the workshop design. Secondary lesson controls are grouped in a drawer. Mobile checks caught an offscreen first action; redundant instructions were removed from the phone layout while retaining context and purpose.
- Guided interactions only record exploration. Existing concept checks require both evidence and mechanism answers. Real lab records remain separate and manually controlled.

Validation includes the curriculum/model invariants, compiled Vue state checks, the 272-link catalogue audit, production build/link checks, full guided/free-exploration Chromium flows, and focused SSRF/encoding tests. Browser screenshots and review status are local artifacts. A passing test proves the exercised behavior; whether the revised teaching feels clear to this learner still needs their experience after publication.


## Technical interface correction · 2026-10-23

The user explained that extra interactions and invented visualizations made unfamiliar topics vague. They specifically requested an actual interface showing what changes where, without metaphors or a childish presentation. The earlier network-animation direction was discarded before implementation.

The SSRF sample now uses an image-import form alongside concrete request and response records. Changing the form updates an explicitly unsent JSON draft. Submitting it executes the displayed handler function; the inspector records its POST, outgoing GET, upstream Response, and returned Response. The image preview only renders image content; an internal text response is inspected as a body, rather than depicted as a successful imported picture. An optional debug pause holds the actual asynchronous fetch; reset/unmount releases it and rejects stale UI updates.

The code viewer imports the same source file as the runtime, rather than showing a separately maintained pseudo-code snippet. Browser tests compare the complete displayed source with that file. Local fixtures and browser/server reachability remain explicitly described as the execution environment; no remote backend or real internal network is claimed. Other topics retain their current flow pending feedback on this focused correction.
