---
title: Clickjacking
description: Framing, UI redressing, frame busters, prefilled forms, and clickjacking chained with DOM XSS.
---

# Clickjacking · The Case of the Invisible Trapdoor

<p class="wd-section-lede">Clickjacking (also known as a UI Redressing attack) does not break network encryption or exploit memory bugs. Instead, it tricks the human in front of the screen. An attacker loads a target website inside an invisible frame, places an enticing decoy button directly in front of it, and hijacks the user's authentic mouse click to trigger sensitive account actions.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Stencil Over the Contract.</strong> Imagine a salesperson hands you a fun crossword puzzle with a small cutout window where you are asked to write a checkmark to win a free coffee. Unknown to you, placed directly underneath the cardboard stencil is an official contract to transfer the title of your car—and your checkmark lands right on the signature line. You intended to claim a coffee, but your physical pen stroke signed away your property.</p>
</div>

## Case File #1: Tracing the Transparent Iframe Heist

Let's see how an attacker turns a routine account settings page into an invisible trap.

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>You visit a promotional page offering a free prize. In the center of the page is a large, colorful button that says: <em>"Click Here to Claim Free Gift!"</em> Everything looks harmless and playful.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Attacker Page Does Behind the Scenes</span>
    <p>Layered directly on top of the decoy button is an <code>&lt;iframe&gt;</code> loading the user's real account page on <code>https://target-bank.example/account/delete</code>. The iframe has <code>opacity: 0.0001</code> (virtually invisible) and a higher <code>z-index</code>:</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = Decoy UI Visible to Victim</span>
        <span><span class="wd-code-input">Gold</span> = Invisible Iframe Layered on Top</span>
      </div>
      <span class="wd-code-dev">&lt;button style="position: absolute; top: 300px; left: 100px; z-index: 1;"&gt;Claim Free Gift&lt;/button&gt;</span><br>
      <span class="wd-code-input">&lt;iframe src="https://target-bank.example/account/delete" style="opacity: 0.0001; position: absolute; top: 280px; left: 90px; z-index: 2;"&gt;&lt;/iframe&gt;</span>
    </div>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>Because the victim is logged into <code>target-bank.example</code>, the browser renders their authenticated account page inside the frame. When the user clicks the decoy button, the mouse click is intercepted by the invisible top layer—landing directly on the bank's "Confirm Account Deletion" button!</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Developers send HTTP response headers that forbid third-party websites from framing sensitive pages. By setting <code>Content-Security-Policy: frame-ancestors 'none'</code> (or legacy <code>X-Frame-Options: DENY</code>), the browser refuses to render the page inside any iframe.</p>
  </div>
</div>

### Visual Comparison: Decoy Surface vs. Invisible Trapdoor

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The developer assumed that because the account deletion page is protected by CSRF tokens and requires an explicit button click, an attacker could never automate the action from another website.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>The attacker never had to forge a request or steal a token. They simply framed the real page, made it invisible, and tricked the victim into performing the genuine physical click themselves.</p>
  </div>
</div>

---

## The UI Redress Layering Mechanism

A clickjacking attack works by aligning layers in the browser's visual viewport:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>1. Decoy Webpage</strong>
    Attacker displays tempting decoy UI (game, quiz, or prize button).
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>2. Authenticated Iframe</strong>
    Target website loaded invisibly via <code>opacity: 0.0001</code>.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>3. Coordinate Alignment</strong>
    Target action button positioned precisely beneath the decoy cursor.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>4. Unwitting Click</strong>
    Victim clicks decoy; hit-test event lands on the transparent iframe.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>5. Action Executed</strong>
    Target application processes legitimate authenticated click.
  </div>
</div>

::: details 🔬 Under the Hood: Why Opacity is Used Instead of display:none
If an attacker styles an iframe with `display: none` or `visibility: hidden`, the browser does not render the element in the layout tree and it cannot receive mouse events.

By setting `opacity: 0.0001`, the iframe remains fully rendered and active in the browser's hit-testing pipeline. The minuscule opacity value avoids browser rendering optimizations that might skip painting completely transparent elements.
:::

---

## Prefilled Form Inputs &amp; CSRF Protections

Some web applications accept parameters from the URL to prefill forms (e.g. `?email=attacker@malicious.com`). When clickjacking is combined with URL prefilling, the attacker only needs to entice the user into a single click to submit the pre-populated form!

Even if the target form contains robust anti-CSRF tokens, the attack succeeds because the submission is generated natively inside the genuine, framed document.

<LabGroup ids="clickjacking-lab-prefilled-form-input, clickjacking-lab-basic-csrf-protected" />

---

## The Failure of JavaScript Frame Busters

Before standard HTTP security headers existed, developers attempted to block framing using client-side JavaScript "frame buster" scripts:

```js
// Naive frame-buster script
if (top !== self) {
  top.location = self.location;
}
```

These scripts are easily defeated:
- **HTML5 Sandboxing:** An attacker can frame the page with `<iframe sandbox="allow-forms allow-scripts">` while omitting `allow-top-navigation`, preventing the frame buster from redirecting the top-level window.
- **Navigation Interception:** The attacking parent window can listen to `onbeforeunload` and prompt the user to cancel any attempted redirection.

<LabGroup ids="clickjacking-lab-frame-buster-script" />

---

## Chaining Clickjacking with DOM XSS

If a target page has a DOM-based XSS flaw that requires user interaction (such as an anchor tag with a `javascript:` URL or a button with an `onclick` handler), an attacker can supply the payload in the iframe's URL and use clickjacking to supply the necessary user activation.

The victim clicks what they think is a harmless game button, triggering the client-side sink and executing the script.

<LabGroup ids="clickjacking-lab-exploiting-to-trigger-dom-based-xss" />

---

## Multi-Step Confirmation Flows

Many sensitive actions involve two steps: a first click to initiate the action and a second click in a confirmation modal. Clickjackers overcome this by creating multi-stage decoy games (like "Whack-a-Mole" or "Click twice to verify your age"), moving the decoy button between clicks to match the shifting coordinates of the modal dialog.

<LabGroup ids="clickjacking-lab-multistep" />

::: details ⚙️ Defensive Headers: X-Frame-Options vs. CSP frame-ancestors
- **`X-Frame-Options: DENY`:** Blocks all framing attempts on any origin.
- **`X-Frame-Options: SAMEORIGIN`:** Permits framing only by pages on the exact same origin.
- **`Content-Security-Policy: frame-ancestors 'none'`:** The modern standard. Replaces `X-Frame-Options` and allows specifying exact allowed ancestor domains (`frame-ancestors 'self' https://trusted-partner.com`).

When both headers are present, modern browsers give precedence to CSP `frame-ancestors`.
:::

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ The Detective's Defense Blueprint.</strong> Always send <code>Content-Security-Policy: frame-ancestors 'none'</code> (or an explicit allow-list) on all authenticated pages. For legacy browser support, include <code>X-Frame-Options: DENY</code>. Never rely on client-side JavaScript frame-busting scripts. For highly sensitive operations like password changes or fund transfers, require re-authentication or multi-factor confirmation.</p>
</div>

<TopicComplete topic-id="clickjacking" label="Mark clickjacking complete" />
