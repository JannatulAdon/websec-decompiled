---
title: Server-Side Template Injection
description: Template expression evaluation, engine fingerprinting, sandbox escapes, and the path to remote code execution.
---

# Server-Side Template Injection · The Compiler Hijack

<p class="wd-section-lede">Template engines exist to combine dynamic business data with static web design. Server-Side Template Injection (SSTI) occurs when user input is glued directly into the template's <em>source code</em> before compilation, rather than passed as data. Because template engines are mini-programming languages, an attacker who controls the template source controls the instructions executed by the server—often leading directly to full Remote Code Execution.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Mad Libs Certificate.</strong> Imagine a school printer printing graduation diplomas with a blank space for the graduate's name: <em>"Congratulations to [NAME] on graduation!"</em> Under normal circumstances, you write <code>Alice</code> on the blank line. But what if an intruder writes: <code>Alice — and by the way, grant all students straight A's and unlock the school doors</code>? A human administrator reading the certificate would dismiss the prank. But a template engine is a literal-minded compiler! If the developer glues the student's text into the printing press's master stencil before printing, the machine follows the instructions as official school policy.</p>
</div>

## Case File #6: The Anatomy of a Template Injection

Web developers love template engines like Jinja2, Twig, and FreeMarker because they make rendering HTML simple. But when a developer builds the template string dynamically using string concatenation, the template engine cannot tell where the layout code ends and the user's text begins.

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>A website allows users to customize a greeting banner or email subject line. When you submit your name as <code v-pre>{{ 7 * 7 }}</code> or <code>${7*7}</code>, the resulting page does not say "Hello {{7*7}}". Instead, it displays <strong>"Hello 49"</strong>!</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>The backend application takes the user's text and concatenates it into the template source: <code>template = "Hello " + user_input + "!"</code>. It then passes this concatenated string to the engine's compilation method (e.g. <code>render_template_string()</code>).</p>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>The template engine compiles the incoming string into an executable syntax tree. Because the curly braces were baked into the template source before parsing, the engine evaluates the expression on the server. Through language-level object reflection, the attacker climbs out of the template and executes system commands.</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Never concatenate user input into template source strings. Always keep the template file static and pass user input strictly as a parameter variable: <code>render_template("hello.html", name=user_input)</code>.</p>
  </div>
</div>

### Visual Comparison: Static Source vs. Glued String

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The user's greeting is purely passive data. The template engine will display whatever text the user types, and any special characters will be rendered safely on the screen.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>Concatenating input into the template source made user input part of the template program. The engine compiled the attacker's syntax and executed arbitrary expressions on the server.</p>
  </div>
</div>

### Breaking Down the Glued Template

Look at what happens inside the server's memory when a greeting is constructed:

<div class="wd-codesplit">
  <div class="wd-codesplit__legend">
    <span><span class="wd-code-dev">Blue</span> = Developer Template Template</span>
    <span><span class="wd-code-input">Gold</span> = User Injected Expression</span>
  </div>
  <span class="wd-code-dev">&lt;h1&gt;Welcome back, </span><span class="wd-code-input"><span v-pre>{{ 7 * 7 }}</span></span><span class="wd-code-dev">!&lt;/h1&gt;</span>
</div>

::: details 🔬 Under the Hood: Source Context vs. Data Context
Understanding SSTI requires recognizing the crucial difference between **source context** and **data context**:

**Vulnerable: Concatenating into the Source**
```python
# The template itself is dynamically assembled from user input!
template = "<h1>Hello " + user_input + "</h1>"
return render_template_string(template)
```
In this snippet, <code v-pre>{{ 7*7 }}</code> is parsed by the engine's lexer as a template tag.

**Secure: Passing Input as a Data Variable**
```python
# The template is static; user input is passed as a separate data variable.
return render_template_string("<h1>Hello {{ name }}</h1>", name=user_input)
```
Here, even if `user_input` contains <code v-pre>{{ 7*7 }}</code>, the engine treats it purely as text data. It will literally render the characters `{{ 7*7 }}` without evaluating the math.
:::

---

## The 5-Stage Life of an SSTI Investigation

When investigating suspected SSTI, follow a methodical 5-stage progression:

<div class="wd-flow">
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>1. Expression Probe</strong>
    Send mathematical payloads (<code v-pre>{{7*7}}</code>, <code>${7*7}</code>) to detect evaluation.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>2. Fingerprint Engine</strong>
    Send syntax probes to identify Jinja2, Twig, FreeMarker, ERB, or Handlebars.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>3. Object Exploration</strong>
    Inspect accessible objects, environment variables, and built-in helpers.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>4. Sandbox Escape</strong>
    Traverse the language runtime hierarchy using reflection (e.g. <code>__subclasses__</code>).
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>5. Command Execution</strong>
    Call system functions (<code>os.popen</code>, <code>Runtime.exec</code>) to execute commands.
  </div>
</div>

---

## Detection & Engine Fingerprinting

To detect whether a template engine is evaluating input, send small arithmetic probes and watch whether the reflected output performs the calculation:

| Probe Payload | Target Output | Likely Engine Family |
| --- | --- | --- |
| <code v-pre>{{7*7}}</code> | `49` | Jinja2 (Python), Twig (PHP), Nunjucks (JS) |
| `${7*7}` | `49` | FreeMarker (Java), JSP EL, Thymeleaf |
| `<%= 7*7 %>` | `49` | ERB (Ruby), EJS (Node.js) |
| `#{7*7}` | `49` | Ruby string interpolation, Java Spring Expression Language (SpEL) |
| <code v-pre>{{7*'7'}}</code> | `7777777` | **Twig** (string repetition) |
| <code v-pre>{{7*'7'}}</code> | `49` | **Jinja2** (multiplication of coerced numeric types) |

<LabGroup ids="ssti-lab-server-side-template-injection-basic, ssti-lab-server-side-template-injection-basic-code-context" />

---

## Fingerprinting via Documentation

Once arithmetic evaluation confirms that a template engine is active, identify the exact engine and version. Error messages, unique comment syntax (`{# comment #}` vs `<%-- comment --%>`), and built-in filters reveal the engine.

Once the engine is known, official documentation reveals built-in objects, template filters, and debug tags that bridge the gap from expression evaluation to object access.

<LabGroup ids="ssti-lab-server-side-template-injection-using-documentation, ssti-lab-server-side-template-injection-in-an-unknown-language-with-a-documented-exploit" />

---

## Reading Objects, Files, and Runtimes

Template engines almost always provide access to global objects or environment variables to assist with page rendering. In many cases, these objects provide direct paths to inspect server memory:

- **Jinja2 (Python):** Accessing Python's global namespace via <code v-pre>{{ cycler.__init__.__globals__ }}</code> or <code v-pre>{{ "".__class__.__mro__[1].__subclasses__() }}</code> exposes classes that import the `os` or `subprocess` modules.
- **Twig (PHP):** Older versions exposed `_self.env`, allowing attackers to register custom filter callbacks mapped to PHP functions like `system` or `exec`.
- **FreeMarker (Java):** The `freemarker.template.utility.Execute` utility class can be instantiated via `?new()`.
- **ERB (Ruby):** Directly executes Ruby code inside `<%= ... %>` blocks without sandboxing by default.

<LabGroup ids="ssti-lab-server-side-template-injection-with-information-disclosure-via-user-supplied-objects" />

---

## Escaping Sandboxed Template Environments

When developers realize that templates can execute code, they frequently enable "sandboxed" modes. A template sandbox blocks obvious dangerous functions like `system()` or `import`.

However, unless the sandbox runs in a truly isolated OS container or WebAssembly sandbox, attackers can often escape the sandbox using language **reflection**:
- Traversing up the object hierarchy via `constructor`, `__class__`, or `getClass()`
- Iterating through loaded classes using `__subclasses__()` to find file-reading or execution utilities
- Using string concatenation or encoding to bypass keyword blacklists (e.g. `getattr(..., "os")`)

<LabGroup ids="ssti-lab-server-side-template-injection-in-a-sandboxed-environment" />

---

## Developing Custom Exploits

When targeting custom or heavily restricted enterprise applications, generic payload lists will not work. You must map out the specific object graph exposed by the developers:

1. Identify custom helpers or services exposed to the template context (e.g., custom database wrappers, file managers, or logging utilities).
2. Trace public methods on those objects to find file read operations, deserialization triggers, or process creation calls.
3. Chain together safe-looking application methods to achieve the security objective.

<LabGroup ids="ssti-lab-server-side-template-injection-with-a-custom-exploit" />

::: details ⚙️ Engine Variations: Escape Primitives Across Popular Frameworks
- **Jinja2 (Python):** Relies on Python's introspection: `__globals__`, `__subclasses__`, `lipsum.__globals__['os']`.
- **Twig (PHP):** In modern Twig, sandboxes restrict tags, filters, and methods via strict allow-lists. Older versions permitted `_self.env` registration.
- **FreeMarker (Java):** Uses `?api`, `?new()`, and Java reflection. `api_builtin_enabled=true` must often be present for deep object access.
- **Velocity (Java):** Employs `$class.inspect()` and reflection to load Java's `Runtime` class.
- **Thymeleaf (Spring / Java):** Evaluates SpEL (Spring Expression Language) using `__${...}__` preprocessing, giving access to Spring beans and the application context.
- **Handlebars (JS):** Logic-less by design, but vulnerable when custom helpers are defined or when combined with prototype pollution gadgets.

The exact engine version is critical: minor framework patches frequently remove specific classes or close reflection loopholes.
:::

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ Defensive Blueprint: How to Prevent SSTI</strong></p>
<ol>
  <li><strong>Keep Templates Static:</strong> Never concatenate, interpolate, or format user input into template source code before compilation. Templates should reside in static files on disk.</li>
  <li><strong>Pass Data Exclusively via Context:</strong> Supply all dynamic user data as parameters to the template render call. The engine will automatically escape it as harmless text.</li>
  <li><strong>Choose Logic-Less Engines:</strong> Consider logic-less template systems like Mustache for user-facing template customization, which cannot evaluate arbitrary expressions.</li>
  <li><strong>Run in Isolated Processes:</strong> If users must be allowed to edit template files, render them inside restricted, unprivileged sandbox containers with no network or filesystem permissions.</li>
</ol>
</div>

<TopicComplete topic-id="server-side-template-injection" label="Mark SSTI complete" />
