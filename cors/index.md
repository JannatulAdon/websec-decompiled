---
title: CORS
description: Origin reflection, trusted null origins, insecure protocols, and what the same-origin policy actually protects.
---

# Cross-Origin Resource Sharing (CORS) · The Case of the Open Door

<p class="wd-section-lede">CORS (Cross-Origin Resource Sharing) is not a vulnerability in itself—it is a controlled door in the browser's Same-Origin Policy. By default, web browsers strictly forbid scripts on one website from reading private data fetched from another website. CORS allows a server to relax this restriction. The vulnerability arises when a server gives that read permission away to everyone, trusts invalid origins, or echoes back whatever domain happens to ask.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Overly Polite Receptionist.</strong> Imagine a company office where confidential customer files are kept behind a front desk. Company rules state that only badged staff may read the files. A visitor arrives wearing a badge from a rival firm and asks: <em>"May I have copies of your customer records?"</em> Instead of verifying the visitor against an approved contractor list, the polite receptionist simply repeats the guest's badge name: <em>"Welcome, rival-firm.com! Here is full access to the filing cabinet."</em></p>
</div>

## Case File #1: Tracing the Reflected Origin Trap

Let's follow what happens when an attacker tries to read your account details using a cross-origin script.

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>You are logged into your shopping account on <code>store.example</code>. In another tab, you browse a totally unrelated entertainment blog on <code>evil.example</code>. The blog looks normal and no alerts appear.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>JavaScript running on <code>evil.example</code> issues a cross-origin <code>fetch()</code> request to <code>https://store.example/accountDetails</code>. The browser adds an <code>Origin: https://evil.example</code> header. The store's backend blindly copies that origin into its response headers:</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = Server CORS Configuration</span>
        <span><span class="wd-code-input">Gold</span> = Reflected Origin Header</span>
      </div>
      <span class="wd-code-dev">HTTP/1.1 200 OK</span><br>
      <span class="wd-code-dev">Access-Control-Allow-Origin: </span><span class="wd-code-input">https://evil.example</span><br>
      <span class="wd-code-dev">Access-Control-Allow-Credentials: true</span>
    </div>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>The browser inspects the response headers. Because the server explicitly granted permission to <code>evil.example</code> and allowed credentials (<code>Access-Control-Allow-Credentials: true</code>), the browser releases the response body to the attacker's script—exposing the victim's email, private address, and API keys!</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Developers configure strict server-side allow-lists containing only explicitly trusted domain names. If the request's <code>Origin</code> header does not match the allow-list, the server does not send the <code>Access-Control-Allow-Origin</code> header, keeping the data safely protected by the Same-Origin Policy.</p>
  </div>
</div>

### Visual Comparison: Intended API Sharing vs. Universal Origin Reflection

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The developer wanted their frontend mobile site or trusted partner domain to read API data seamlessly without getting blocked by browser cross-origin security rules.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>By echoing whatever <code>Origin</code> header arrived in the request, the server inadvertently allowed every malicious site on the internet to read authenticated, confidential responses.</p>
  </div>
</div>

---

## The Cross-Origin Request Lifecycle

How the browser handles a cross-origin request depends on whether it is classified as a **simple request** or requires a **preflight check**:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>1. Script Issues Fetch</strong>
    External page initiates cross-origin request with <code>credentials: 'include'</code>.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>2. Browser Stamped Origin</strong>
    Browser automatically adds authentic <code>Origin: https://evil.example</code> header.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>3. Preflight OPTIONS (if complex)</strong>
    Checks allowed methods, headers, and credentials before sending real request.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>4. Server Response Headers</strong>
    Server answers with <code>ACAO</code> and <code>ACAC</code> access directives.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>5. Browser Enforcement</strong>
    Browser permits script to read response body or blocks access.
  </div>
</div>

::: details 🔬 Under the Hood: Why Credentials Change the Rules
- **Wildcard Origins:** A server can send `Access-Control-Allow-Origin: *` for public data. However, the browser **strictly rejects** the wildcard if `Access-Control-Allow-Credentials: true` is set.
- **Credentialed Requests:** To read authenticated responses (which include cookies or HTTP authentication), the server must return an explicit, concrete origin in `Access-Control-Allow-Origin`.
- **Cache Poisoning Prevention:** If a server dynamically reflects the origin, it must include the `Vary: Origin` header. Otherwise, a shared caching proxy might store a response authorized for an attacker and serve it to legitimate users!
:::

---

## Origin Reflection: The Universal Pass

The most common CORS vulnerability occurs when developers want to support multiple internal subdomains, and solve it by simply copying the incoming `Origin` header directly into `Access-Control-Allow-Origin`.

An attacker's page on any domain can send a credentialed request, receive full read authorization from the browser, and exfiltrate the victim's sensitive data.

<LabGroup ids="cors-lab-basic-origin-reflection-attack" />

---

## The Trusted `null` Origin Trap

When developers want to test cross-origin requests locally or allow sandboxed content, they sometimes add `null` to their CORS allow-list (`Access-Control-Allow-Origin: null`).

The `Origin: null` header is generated in several browser situations:
- HTML documents loaded inside an `<iframe sandbox>`
- Local `file://` resources
- Cross-origin redirects under certain privacy configurations

An attacker can host an exploit inside a sandboxed iframe. The browser automatically assigns `Origin: null` to the outgoing request, satisfying the server's allow-list and stealing the response!

<LabGroup ids="cors-lab-null-origin-whitelisted-attack" />

---

## Insecure Protocols &amp; Subdomain Matching Flaws

Many organizations attempt to validate origins using regular expressions or prefix/suffix checks, but introduce subtle parsing flaws:

| Flaw Pattern | Implementation Mistake | How an Attacker Bypasses It |
| --- | --- | --- |
| **Trusting HTTP** | Allowing `http://*.example.com` | A man-in-the-middle or XSS on an unencrypted subdomain can steal HTTPS data |
| **Unanchored Regex** | Matching `example.com` without `^` or `$` | `attacker-example.com` or `example.com.evil.com` matches successfully |
| **Weak Suffix Check** | Using `.endsWith("example.com")` | `notexample.com` matches the suffix check |

<LabGroup ids="cors-lab-breaking-https-attack" />

::: details 💡 Detective Distinction: CORS vs. CSRF
It is common for beginners to confuse CORS and CSRF:
- **CSRF is about WRITING (Actions):** An attacker tricks your browser into performing an action (like changing an email or posting a message). The attacker does not need to read the server's answer.
- **CORS is about READING (Data Theft):** An attacker wants to read private data (like account balances, personal messages, or API keys). The Same-Origin Policy stops the read; flawed CORS headers unlock it.
:::

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ The Detective's Defense Blueprint.</strong> Never dynamically reflect incoming <code>Origin</code> headers into <code>Access-Control-Allow-Origin</code>. Maintain a strict, hardcoded allow-list of exact HTTPS origins. Never allow the <code>null</code> origin. Always send the <code>Vary: Origin</code> header whenever responses vary by origin. Remember that CORS is an access control mechanism for browsers, not authentication.</p>
</div>

<TopicComplete topic-id="cross-origin-resource-sharing-cors" label="Mark CORS complete" />
