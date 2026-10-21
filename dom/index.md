---
title: DOM-Based Vulnerabilities
description: Sources, sinks, web messages, JSON.parse, open redirects, cookie manipulation, and DOM clobbering.
---

# DOM-Based Vulnerabilities · The Case of the Client-Side Breakdown

<p class="wd-section-lede">DOM-based vulnerabilities take place entirely inside your web browser. The backend server could send a completely pristine, flawless response, but client-side JavaScript takes over, reads untrusted data from an accessible source, and pipes it straight into a dangerous execution sink.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Automated PA System.</strong> Imagine an airport information desk with an automated public address system. The central flight database only sends official gate announcements. But an intern adds a script to the desk computer: <em>"Check if any visitor dropped a feedback card on the counter, and if so, read it aloud over the terminal speakers."</em> Even though the airline's central servers are airtight, anyone who places a card on the counter can commandeer the airport's loudspeakers.</p>
</div>

## Case File #1: Tracing Taint Flow from Source to Sink

Let's trace what happens when client-side JavaScript reads a search term from your browser's address bar.

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>You visit a store page with a query in the URL: <code>/feedback?status=thankyou</code>. The page immediately displays a friendly banner: <em>"Status: thankyou"</em> without reloading the page from the server.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Client Script Does Behind the Scenes</span>
    <p>A client-side script reads the <code>status</code> parameter directly from the browser's <code>location.search</code> object and inserts it into a container element using <code>innerHTML</code>:</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = Static Application Script</span>
        <span><span class="wd-code-input">Gold</span> = Untrusted Data from URL Source</span>
      </div>
      <span class="wd-code-dev">const status = new URLSearchParams(location.search).get('status');</span><br>
      <span class="wd-code-dev">document.getElementById('msg').innerHTML = '&lt;span&gt;Status: &lt;/span&gt;' + </span><span class="wd-code-input">status</span>;
    </div>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>The developer treated <code>status</code> as harmless text, but passed it into <code>innerHTML</code> (an execution sink). When an investigator sends <code>&lt;img src=x onerror=alert(1)&gt;</code>, the browser's HTML fragment parser creates the element, fails to load the image, and immediately fires the JavaScript event handler!</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Developers avoid dangerous HTML parsing sinks when handling plain text. By using safe DOM properties like <code>element.textContent = status</code>, the browser treats all characters strictly as visual text without ever compiling HTML tags or event listeners.</p>
  </div>
</div>

### Visual Comparison: Text Assignment vs. HTML Fragment Parsing

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The developer expected the URL parameter would only contain simple status words to quickly update the screen on the client without waiting for a server round-trip.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>Because the script concatenated untrusted URL data into <code>innerHTML</code>, the browser interpreted the input as active HTML markup, executing client-side scripts inside the user's session.</p>
  </div>
</div>

---

## The Taint-Flow Pipeline: Sources &amp; Sinks

DOM security comes down to mapping the path between where untrusted data enters the browser (**Sources**) and where it gets interpreted or executed (**Sinks**):

<div class="wd-flow">
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>1. Taint Source</strong>
    Data enters via <code>location.search</code>, <code>location.hash</code>, or <code>postMessage</code>.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>2. Client Logic</strong>
    JavaScript reads, extracts, decodes, or concatenates the tainted string.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>3. Execution Sink</strong>
    Data lands in <code>innerHTML</code>, <code>location.href</code>, or <code>eval</code>.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>4. Impact</strong>
    Browser renders markup, navigates to a new origin, or executes script.
  </div>
</div>

### Common Sources and Sinks

| Source (Where Untrusted Data Enters) | Sink (Where Data Becomes Code) | Resulting Vulnerability |
| --- | --- | --- |
| `location.search`, `location.hash` | `innerHTML`, `document.write` | DOM Cross-Site Scripting (XSS) |
| `location.href`, `document.referrer` | `location = ...`, `location.assign()` | DOM Open Redirection / `javascript:` execution |
| `window.name`, `postMessage` | `eval()`, `Function()`, `setTimeout(str)` | Arbitrary Client-Side Code Execution |
| `location.search` | `document.cookie` | DOM Cookie Manipulation / Session Poisoning |
| HTML elements with `id`/`name` | Global JS object lookups (`window.foo`) | DOM Clobbering |

::: details 🔬 Under the Hood: Why innerHTML Differs from document.write
When you assign a string to `element.innerHTML`, the browser's fragment parser treats any `<script>` elements inside as "already evaluated", so they will not execute. However, event handlers on other elements (such as `<img src=x onerror=...>`) are evaluated as soon as the element is added to the DOM tree and encounters an error.

In contrast, `document.write()` injects raw characters into the live document parser while the page is rendering, allowing synchronous `<script>` tags to run directly.
:::

---

## Web Messaging: The Cross-Origin Channel

The `window.postMessage()` API allows browser windows from different origins to send text messages to each other. Because any website can post a message to an embedded iframe or opened popup, the receiver must verify two crucial details:
1. **Origin Verification:** Does `event.origin` exactly match a trusted domain?
2. **Data Structure Validation:** Are the message properties safe before passing them to sinks?

If an event listener blindly accepts messages without origin checks and writes `event.data` into an execution sink, any rogue webpage that frames the target can compromise it.

<LabGroup ids="dom-lab-dom-xss-using-web-messages, dom-lab-dom-xss-using-web-messages-and-a-javascript-url, dom-lab-dom-xss-using-web-messages-and-json-parse" />

::: details 🔬 Under the Hood: JSON.parse is a Syntax Checker, Not a Sanitizer
Developers sometimes believe that running `JSON.parse(event.data)` sanitizes input. It does not! `JSON.parse` only checks whether the incoming string is well-formed JSON syntax. If the parsed object contains `{"type":"redirect","url":"javascript:alert(1)"}`, the JSON parser succeeds completely, but assigning that `url` property to an iframe `src` or `window.location` executes code immediately.
:::

---

## DOM Open Redirection

When client-side scripts read a redirect destination from the URL (such as `?next=...`) and assign it directly to `location.href`, `location.replace()`, or an anchor tag's `href`, attackers can redirect the user to a malicious external origin or supply a `javascript:` pseudoprotocol URI.

Beyond phishing, open redirects in the DOM are powerful primitives for bypassing OAuth redirect allow-lists and SSRF filters.

<LabGroup ids="dom-lab-dom-open-redirection" />

---

## Client-Side Cookie Manipulation

If a script takes data from `location.search` and writes it into `document.cookie` (e.g. storing a preferred theme or currency), an attacker can supply values containing semicolons to set arbitrary cookies on the victim's domain.

If those cookies are later reflected into the page markup by server-side code or client-side sinks, cookie manipulation escalates into stored DOM XSS.

<LabGroup ids="dom-lab-dom-cookie-manipulation" />

---

## DOM Clobbering: The Namespace Hijack

Browsers have a legacy feature: HTML elements with an `id` or `name` attribute automatically become properties on the global `window` object and on parent `<form>` elements.

If client-side JavaScript references a global variable like `window.config` before it is declared, an attacker who can inject sanitized HTML (like a comment or avatar bio) can inject `<a id="config" href="javascript:alert(1)">`. The injected HTML "clobbers" the expected JavaScript object, causing the script to read attacker-controlled properties!

<div class="wd-codesplit">
  <div class="wd-codesplit__legend">
    <span><span class="wd-code-dev">Blue</span> = Vulnerable Client Script</span>
    <span><span class="wd-code-input">Gold</span> = Clobbered Global Property</span>
  </div>
  <span class="wd-code-dev">const avatar = </span><span class="wd-code-input">window.userAvatar</span><span class="wd-code-dev"> || { url: '/default.png' };</span>
</div>

<LabGroup ids="dom-lab-dom-xss-exploiting-dom-clobbering, dom-lab-dom-clobbering-attributes-to-bypass-html-filters" />

::: details ⚙️ Engine Variations: How Browsers Name HTML Elements
- `window.elementId` resolves to the DOM node with that `id`.
- Form elements expose child inputs by name: `form.action` resolves to an `<input name="action">` instead of the form's real submission URL!
- If multiple elements share the same `name`, the browser groups them into an `HTMLCollection`. Calling `.toString()` on an `HTMLCollection` returns `[object HTMLCollection]`, which can bypass naive type checks.
:::

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ The Detective's Defense Blueprint.</strong> Never pass untrusted strings to fragment parsers (<code>innerHTML</code>, <code>outerHTML</code>, <code>document.write</code>); prefer safe setters like <code>textContent</code>. When handling URLs, parse them with the native <code>URL</code> constructor and verify that the protocol is strictly <code>https:</code>. On <code>postMessage</code> listeners, always validate <code>event.origin</code> against an exact allow-list. Prevent DOM clobbering by avoiding bare global lookups and using explicit <code>let</code>/<code>const</code> scoping.</p>
</div>

<TopicComplete topic-id="dom-based-vulnerabilities" label="Mark DOM vulnerabilities complete" />
