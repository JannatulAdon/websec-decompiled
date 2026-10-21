---
title: Prototype Pollution
description: __proto__, merge recursion, client-side gadgets, server-side escalation, and RCE through polluted options.
---

# Prototype Pollution · The Poisoned Well

<p class="wd-section-lede">In JavaScript, almost every object inherits properties from a shared master ancestor: <code>Object.prototype</code>. Prototype pollution happens when an application blindly merges user input into an object, allowing an attacker to inject properties into that shared ancestor. The moment <code>Object.prototype</code> is poisoned, every single object in the entire JavaScript environment inherits the attacker's properties—turning innocent configuration checks into instant security vulnerabilities.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Bakery's Master Recipe Card.</strong> Imagine a large bakery where every apprentice baker follows a central master recipe card hanging on the wall. When baking a vanilla cake, an apprentice looks at their individual order slip. If the order slip doesn't mention frosting flavor, the apprentice glances at the master card on the wall for the default (<em>"vanilla buttercream"</em>). One evening, an intruder sneaks into the kitchen and scribbles on the master recipe card: <code>frosting: hot chili sauce</code>. The next morning, every single cake baked by every apprentice across the bakery is ruined with hot chili sauce—even cakes for customers who ordered plain vanilla.</p>
</div>

## Case File #5: The Anatomy of a Prototype Injection

JavaScript's prototype chain is designed for speed and memory efficiency. Instead of copying default methods and properties to every new object, objects delegate missing lookups up the prototype chain until they reach `Object.prototype`.

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>A website accepts URL parameters formatted with bracket notation: <code>/?__proto__[transport_url]=data:,alert(1)</code>. The page seems to reload normally, but suddenly a third-party analytics script or widget loads arbitrary attacker code, executing an alert box or stealing credentials.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server (or Client App) Does Behind the Scenes</span>
    <p>The application takes user-supplied JSON or parsed query parameters and deeply merges them into a settings object using a custom recursive merge function or an outdated cloning library.</p>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>When the merge function encounters the property key <code>__proto__</code>, JavaScript doesn't create a normal property named "__proto__". Instead, it invokes the built-in prototype setter, mutating <code>Object.prototype</code>. From that second forward, every empty object <code>{}</code> created anywhere in the runtime inherits the property!</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Validate and block dangerous keys (<code>__proto__</code>, <code>constructor</code>, <code>prototype</code>) during recursive merges, store key-value dictionaries inside prototype-less objects created with <code>Object.create(null)</code> or <code>new Map()</code>, and freeze the root prototype with <code>Object.freeze(Object.prototype)</code>.</p>
  </div>
</div>

### Visual Comparison: Local Property vs. Global Contamination

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The recursive merge function will only modify fields on the specific target object passed to the function. Untrusted user keys remain isolated within that single variable.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>Assigning to <code>target["__proto__"]</code> traversed up the inheritance chain to <code>Object.prototype</code>. Every unrelated object in the application now inherits the injected properties.</p>
  </div>
</div>

### Watching the Merge Function Slip

Look at how a naive recursive merge function walks straight into the prototype trap:

<div class="wd-codesplit">
  <div class="wd-codesplit__legend">
    <span><span class="wd-code-dev">Blue</span> = Standard Application Merge Code</span>
    <span><span class="wd-code-input">Gold</span> = Injected Payload Key</span>
    <span><span class="wd-code-dead">Strikethrough</span> = Polluted Global Reality</span>
  </div>
  <span class="wd-code-dev">function merge(target, src) {<br>&nbsp;&nbsp;for (let key in src) {<br>&nbsp;&nbsp;&nbsp;&nbsp;if (typeof src[key] === 'object') merge(target[key], src[key]);<br>&nbsp;&nbsp;&nbsp;&nbsp;else target[key] = src[key];<br>&nbsp;&nbsp;}<br>}<br>merge({}, JSON.parse('{"</span><span class="wd-code-input">__proto__</span><span class="wd-code-dev">":{"</span><span class="wd-code-input">isAdmin</span><span class="wd-code-dev">":true}}'));<br></span><span class="wd-code-dead">({}).isAdmin === true; // Every new object now has isAdmin!</span>
</div>

::: details 🔬 Under the Hood: Why JSON.parse() Requires a Merge Function to Pollute
A common misconception is that `JSON.parse('{"__proto__":{"isAdmin":true}}')` pollutes the prototype by itself. It does not! 

In ECMAScript, `JSON.parse` creates a plain object with a literal own property named `__proto__`. The pollution only occurs when an application takes that parsed object and performs a **recursive property copy** (like `target[key] = src[key]`). When JavaScript evaluates `target["__proto__"]`, it resolves the prototype accessor property, redirecting the assignment to `Object.prototype`.
:::

---

## The 5-Stage Life of a Prototype Pollution Exploit

A prototype pollution vulnerability requires two parts: a **source** (where the input enters) and a **gadget** (where the inherited property creates an exploit):

<div class="wd-flow">
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>1. Polluting Source</strong>
    Attacker delivers an object payload containing <code>__proto__</code> or <code>constructor.prototype</code>.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>2. Unchecked Merge</strong>
    A recursive merge, object clone, or query string parser traverses into the prototype chain.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>3. Global Mutation</strong>
    <code>Object.prototype</code> receives the injected property in the live JavaScript process.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>4. Unsuspecting Gadget</strong>
    Unrelated application code creates an options object: <code>const opts = options || {};</code>.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>5. Malicious Execution</strong>
    The gadget reads <code>opts.transport_url</code> or <code>opts.shell</code>, triggering DOM XSS or Remote Code Execution!
  </div>
</div>

---

## Client-Side Pollution via URL Parameters

Many front-end Single Page Applications (SPAs) use query-string libraries that support nested objects via bracket notation (e.g. `?__proto__[key]=value`). 

When client-side routing scripts parse these parameters and merge them into an application state object, an attacker can deliver an exploit link. Once polluted, standard browser gadgets—such as script-loading helpers, Google Tag Manager integrations, or DOM template engines—pick up the inherited configuration and execute arbitrary JavaScript.

<LabGroup ids="prototype-pollution-lab-prototype-pollution-client-side-prototype-pollution-via-browser-apis, prototype-pollution-lab-prototype-pollution-dom-xss-via-client-side-prototype-pollution, prototype-pollution-lab-prototype-pollution-dom-xss-via-an-alternative-prototype-pollution-vector" />

---

## Flawed Sanitization & Third-Party Library Gadgets

Developers often attempt to patch prototype pollution with naive string filters. Attackers routinely bypass these filters using alternative prototype access paths:

- **Flawed Stripping:** Removing the word `__proto__` once allows nested sequences like `__pro__proto__to__` to slip through after the initial replacement.
- **Constructor Vector:** If `__proto__` is blocked entirely, attackers access the prototype via the constructor: `constructor[prototype][isAdmin]=true`.
- **Third-Party Gadget Hunting:** Popular libraries like jQuery, lodash, and Lodash template utilities frequently read properties from options objects without using `hasOwnProperty()`. Polluting properties like `srcdoc`, `url`, or `html` turns harmless utility code into a DOM XSS delivery vector.

<LabGroup ids="prototype-pollution-lab-prototype-pollution-client-side-prototype-pollution-via-flawed-sanitization, prototype-pollution-lab-prototype-pollution-client-side-prototype-pollution-in-third-party-libraries" />

---

## Server-Side Prototype Pollution: Escalation & RCE

On the server side (Node.js), prototype pollution is particularly catastrophic because `Object.prototype` is shared across the **entire Node process**. A single HTTP request can poison the server for every other user until the Node service restarts!

Server-side impacts include:
1. **Privilege Escalation:** Polluting `isAdmin: true` grants immediate admin rights if authorization checks evaluate `if (user.isAdmin)`.
2. **Denial of Service (DoS):** Polluting built-in properties like `toString` or `valueOf` with a non-callable value crashes the Node event loop on the next request.
3. **Remote Code Execution (RCE):** Node.js functions like `child_process.spawn()` and `child_process.exec()` accept an options object. If an attacker pollutes `shell`, `env`, or `NODE_OPTIONS`, the server executes attacker-controlled binaries whenever any child process is spawned!

<LabGroup ids="prototype-pollution-lab-privilege-escalation-via-server-side-prototype-pollution, prototype-pollution-lab-detecting-server-side-prototype-pollution-without-polluted-property-reflection, prototype-pollution-lab-bypassing-flawed-input-filters-for-server-side-prototype-pollution, prototype-pollution-lab-remote-code-execution-via-server-side-prototype-pollution, prototype-pollution-lab-exfiltrating-sensitive-data-via-server-side-prototype-pollution" />

::: details 🔬 Under the Hood: Detecting Server-Side Pollution Without Property Reflection
In many real-world Node.js targets, the server never prints user properties back in HTTP responses. How can an investigator detect that prototype pollution succeeded?

Watch for **indirect side-effects**:
- **Status Code Distortion:** Polluting `status: 510` in Express or body-parser may cause subsequent error responses to return custom status codes.
- **JSON Formatting Changes:** Polluting `json spaces: 10` in Express causes all future JSON responses across the server to be indented with 10 spaces instead of compact formatting!
- **Charset Distortion:** Polluting `content-type` or `charset` changes response encodings across the server.
:::

::: details ⚙️ Engine Variations: Where Does the Pollution Live?
- **Node.js:** Prototype pollution lives in process memory. It persists across all incoming HTTP requests and affects all concurrent users until the process restarts.
- **Client-Side Browsers:** Pollution lives in the window realm. It persists until the tab navigates or reloads.
- **Serverless (AWS Lambda):** In a "warm" container execution, pollution persists across invocations. In a "cold" start, a fresh environment is created.
- **Node Worker Threads:** Each worker thread runs inside its own isolated realm; pollution in one worker does not spread to others unless shared objects are explicitly passed.
:::

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ Defensive Blueprint: How to Neutralize Prototype Pollution</strong></p>
<ol>
  <li><strong>Reject Dangerous Keys:</strong> In any object-merging or cloning routine, strictly discard keys matching <code>__proto__</code>, <code>constructor</code>, and <code>prototype</code>.</li>
  <li><strong>Use Prototype-Less Objects:</strong> When creating key-value lookup dictionaries, instantiate them using <code>Object.create(null)</code> or JavaScript's modern <code>Map</code> data structure. They do not inherit from <code>Object.prototype</code>.</li>
  <li><strong>Freeze the Global Prototype:</strong> Run <code>Object.freeze(Object.prototype)</code> at application startup. Any attempt to modify the prototype will throw an error or fail silently.</li>
  <li><strong>Safe Object Access:</strong> Always use <code>Object.hasOwn(obj, prop)</code> or <code>Object.prototype.hasOwnProperty.call(obj, prop)</code> before trusting configuration properties.</li>
</ol>
</div>

<TopicComplete topic-id="prototype-pollution" label="Mark prototype pollution complete" />
