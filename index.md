---
layout: home
title: Websec Decompiled
description: Interactive learn-by-doing web security studio across all 31 PortSwigger Academy topics and 272 labs—explained in plain English.
hero:
  name: Websec Decompiled
  text: Poke the server. Watch the logic break.
  tagline: An interactive, plain-English web security studio covering all 31 PortSwigger Academy topics and 272 labs. Every bug is a hands-on case file—poke the live X-Ray simulator, watch the 4-slide visual story, and solve the labs one clue at a time.
  image:
    src: /hero.svg
    alt: Diagram of an HTTP request traveling from browser to server, highlighting where user input changes the server's behavior
  actions:
    - theme: brand
      text: Start Stage 1 · First Steps
      link: /information-disclosure/
    - theme: alt
      text: SQLi Deep Track
      link: /sql-injection/
    - theme: alt
      text: 📖 Jargon Buster
      link: /glossary/
features:
  - icon: 🎮
    title: Live Request & Server X-Ray Studio
    details: Don't just read—poke the simulated server with test payloads, watch your input land inside backend code, and flip the Patched Defense switch.
  - icon: 🗺️
    title: 6-Stage Guided Investigation Path
    details: All 35 case files and 272 Academy labs are ordered sequentially from Step 01 (Recon) to Step 35 (Deep Protocol Internals).
  - icon: 💡
    title: 1-Clue-at-a-Time Hints on Every Lab
    details: Stuck on a lab? Reveal Clue 1 for a gentle nudge without spoiling Clue 2 or the piece-by-piece solution breakdown underneath.
  - icon: 📖
    title: Plain-English Jargon Buster
    details: Zero dry textbook prose. Every technical term has an instant plain-English hover card and everyday analogy.
  - icon: 📝
    title: Bookmarks, Scratchpad & Filters
    details: Filter labs by difficulty, hide solved labs, star tricky topics for review, and jot down personal notes—all saved locally with JSON backup.
  - icon: 🎨
    title: Calm 3-Mode Workspace & Themes
    details: Switch seamlessly between Interactive Studio, Practice Labs, and Deep-Dive Guide—plus 4 eye-soothing studio color palettes in the top bar.
---

<div id="progress"></div>

<ProgressDashboard />

## How Every Case File Works

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🎮 Mode 1 · Interactive Studio (Poke, Observe & Predict)</span>
    <p>Every case file opens in a calm, distraction-free interactive studio. Test payloads in the Live Server X-Ray, step through the 4-Slide Visual Storyboard, and solve a 10-second prediction puzzle before reading a single wall of text.</p>
  </div>
  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">🧪 Mode 2 · Practice Labs (1-Clue-at-a-Time)</span>
    <p>Switch to the Practice Labs tab to filter all PortSwigger Academy challenges by difficulty, unlock progressive clues one at a time, and step through deconstructed HTTP payloads piece by piece.</p>
  </div>
  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">📖 Mode 3 · Deep-Dive Visual Guide</span>
    <p>Whenever you want the full reference guide, open the Deep-Dive tab for everyday analogies, side-by-side <em>Expected vs. Actual</em> cards, color-coded code splits, and defensive checklists.</p>
  </div>
</div>

<div class="wd-callout wd-callout--warn">
<p><strong>Safe & Authorized Practice Only.</strong> Every walkthrough and simulator in this portal is designed for the deliberately vulnerable PortSwigger Web Security Academy labs and for building more secure software. Always test only on systems where you have explicit permission.</p>
</div>
