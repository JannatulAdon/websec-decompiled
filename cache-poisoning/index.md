---
title: Web Cache Poisoning
description: Unkeyed inputs, cache-key confusion, parameter cloaking, fat GET, cache key injection, and internal caches.
---

# Web Cache Poisoning · The Tainted Blueprint

<p class="wd-section-lede">Web caching speeds up the internet by storing a single master copy of a webpage and serving it to thousands of visitors. Web cache poisoning occurs when an attacker tricks the cache into saving an altered, malicious version of that page. The root cause is a fatal mismatch: an input changes what the webpage says, but the cache forgets to include that input in its filing system.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Community Notice Board.</strong> Imagine a library clerk who keeps master photocopies of bus timetables. The clerk indexes each paper strictly by destination city: <code>NYC</code>. One morning, a prankster hands the clerk a revised schedule with a handwritten sticky note on the back: <em>"Reroute all buses to my private parking lot."</em> The photocopying machine accidentally prints the sticky note onto the schedule! The clerk files this tainted document under <code>NYC</code>. From that moment on, every commuter who asks for the NYC schedule receives the prankster's bogus instructions—without ever asking for them.</p>
</div>

## Case File #2: The Anatomy of an Unkeyed Injection

To deliver web pages in milliseconds, reverse proxies and Content Delivery Networks (CDNs) calculate a **cache key**—a fingerprint of the request—typically made from the HTTP method, the host header, and the URL path.

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>An ordinary user browses to the website homepage (<code>https://example.com/</code>). Without warning, their browser downloads and runs a third-party tracking script hosted on an attacker-owned domain, silently intercepting keystrokes or cookies.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>The CDN edge receives a request for <code>/en</code>. It checks its local cache table for the key <code>GET /en</code>. Finding no stored copy (a cache miss), it passes the request to the origin backend application.</p>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>The origin reads an optional header, <code>X-Forwarded-Host: attacker.com</code>, and uses it to construct a dynamic script link: <code>&lt;script src="https://attacker.com/analytics.js"&gt;</code>. Crucially, the CDN never included <code>X-Forwarded-Host</code> in its cache key formula! It stores this corrupted HTML under the generic key <code>GET /en</code>.</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Add all headers that alter HTML output into the cache key using the <code>Vary</code> header (e.g., <code>Vary: X-Forwarded-Host</code>), or configure the CDN to strip unrecognized headers before the origin ever sees them.</p>
  </div>
</div>

### Visual Comparison: Keyed Identity vs. Unkeyed Content

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The cache key uniquely identifies safe, identical content. Any header not listed in the cache key is purely internal metadata that will never change the visual output of the page for other people.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>An unkeyed header altered the dynamic HTML response. The cache faithfully saved the altered response under the public cache key, distributing the malicious script to thousands of subsequent clean visitors.</p>
  </div>
</div>

### Watching the Cache Key Miss the Trap

Look at how the CDN generates its filing index while ignoring the attacker's payload:

<div class="wd-codesplit">
  <div class="wd-codesplit__legend">
    <span><span class="wd-code-dev">Blue</span> = Included in Cache Key (Method + Host + Path)</span>
    <span><span class="wd-code-input">Gold</span> = Ignored by Cache Key (Unkeyed Poison Header)</span>
  </div>
  <span class="wd-code-dev">GET /en?cb=1 HTTP/1.1<br>Host: example.com<br></span><span class="wd-code-input">X-Forwarded-Host: attacker.com<br></span><span class="wd-code-dev">User-Agent: Mozilla/5.0...</span>
</div>

::: details 🔬 Under the Hood: The Four-Phase Detective Routine for Cache Poisoning
How do security engineers safely uncover unkeyed inputs without impacting live users?
1. **Find a Cacheable Static/Public Endpoint:** Look for pages returning `X-Cache: hit` or `CF-Cache-Status: HIT` with reasonable `max-age` durations.
2. **Inject a Cache Buster:** Append a randomized query string (`?cb=12345`) so your probe creates its own isolated cache slot and doesn't pollute real visitors.
3. **Probe Candidate Headers:** Transmit canary headers (`X-Forwarded-Host`, `X-Forwarded-Scheme`, `X-Original-URL`, `X-Host`, `Forwarded`).
4. **Inspect Response Reflection:** Check whether the canary string appears in HTML tags, redirects, or JavaScript objects. If it does, and the page is stored as a cache hit, the endpoint is vulnerable to poisoning.
:::

---

## The 5-Stage Life of a Cache Poisoning Attack

Follow the lifecycle of an unkeyed request from initial probe to victim infection:

<div class="wd-flow">
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>1. Attacker Primer</strong>
    Attacker sends a request containing the unkeyed header (e.g. <code>X-Forwarded-Host</code>).
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>2. Edge Cache Miss</strong>
    The cache has no saved entry for this path; it forwards the request upstream to origin.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>3. Origin Taint</strong>
    Origin dynamically renders the attacker's host into a script tag or stylesheet link.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>4. Cache Storage</strong>
    Edge cache saves the tainted HTML under the clean public cache key.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>5. Victim Compromise</strong>
    Every subsequent visitor requests the clean URL and receives the poisoned cached file!
  </div>
</div>

---

## Cache Keys and Unkeyed Inputs

The core vulnerability always boils down to an input that changes the response without being part of the cache key. This can occur via unexpected headers, unkeyed tracking cookies, or multiple conflicting headers working in tandem.

<LabGroup ids="cache-poisoning-lab-web-cache-poisoning-with-an-unkeyed-header, cache-poisoning-lab-web-cache-poisoning-with-an-unkeyed-cookie, cache-poisoning-lab-web-cache-poisoning-with-multiple-headers" />

---

## Targeted Poisoning and Unknown Headers

Some unkeyed inputs only trigger when paired with specific conditions or user-agent categories. A targeted attack may poison responses served specifically to mobile browsers, desktop clients, or administrative paths by combining unkeyed behavior with targeted cache variations.

<LabGroup ids="cache-poisoning-lab-web-cache-poisoning-targeted-using-an-unknown-header" />

---

## Query Parameters and Parameter Cloaking

Not all unkeyed inputs live in headers. Caches are frequently configured to strip marketing tags (such as `utm_content` or `utm_campaign`) from their cache keys to maximize hit ratios.

- **Unkeyed Query Strings:** The cache strips the entire query string from the key, allowing any reflected parameter to poison the page for everyone.
- **Unkeyed Single Parameters:** A specific parameter is stripped from the key but evaluated by the backend application logic.
- **Parameter Cloaking:** Using parsing quirks like semicolons (`;`) or ampersands (`&`) to make the cache think there is only one parameter while the backend framework parses two distinct parameters.
- **Fat GET Requests:** Sending an HTTP body inside a `GET` request. The cache generates its key solely from the URL, but the origin framework extracts data from the body!

<LabGroup ids="cache-poisoning-lab-web-cache-poisoning-unkeyed-query, cache-poisoning-lab-web-cache-poisoning-unkeyed-param, cache-poisoning-lab-web-cache-poisoning-param-cloaking, cache-poisoning-lab-web-cache-poisoning-fat-get" />

---

## Normalization and Cache Key Injection

When the cache and the origin server parse URI paths differently, an attacker can trick the cache into serving the wrong resource.

- **Normalization Discrepancies:** The cache normalizes percent-encoded characters or dot segments (`/test/../home`), while the backend reads raw strings—or vice versa.
- **Cache Key Injection:** Caches that construct keys by concatenating headers with delimiter characters can be tricked when an attacker injects the delimiter into an input, overwriting another user's cache entry.

<LabGroup ids="cache-poisoning-lab-web-cache-poisoning-normalization, cache-poisoning-lab-web-cache-poisoning-cache-key-injection" />

---

## Chaining and DOM Sinks

Cache poisoning becomes devastating when combined with client-side DOM vulnerabilities. Even when an application enforces strict cacheability criteria (such as only caching responses with specific file extensions or MIME types), crafted paths can satisfy the cache rules while reflecting untrusted values into DOM sinks like `innerHTML` or `eval()`.

<LabGroup ids="cache-poisoning-lab-web-cache-poisoning-to-exploit-a-dom-vulnerability-via-a-cache-with-strict-cacheability-criteria, cache-poisoning-lab-web-cache-poisoning-combining-vulnerabilities" />

---

## Internal Caches and Fragment Caches

Caches do not only exist at large commercial CDNs like Cloudflare or Akamai. Many application architectures use internal caching layers:
- Local Varnish reverse proxies
- Nginx `proxy_cache` zones
- Framework-level fragment caches (such as Symfony or Ruby on Rails action caching)

Because internal caches operate behind edge firewalls, they often accept internal forward headers that would normally be blocked at the outer perimeter.

<LabGroup ids="cache-poisoning-lab-web-cache-poisoning-internal" />

::: details ⚙️ Engine Variations: How Major Cache Servers Handle Keys
- **Varnish Cache:** The `vcl_hash` subroutine builds the cache key. If developers strip or modify headers inside `vcl_recv` before hashing, unkeyed behaviors quickly arise.
- **Nginx `proxy_cache_key`:** By default set to `$scheme$proxy_host$request_uri`. Query parameters are included by default, but headers are omitted unless explicitly defined.
- **Cloudflare:** Includes scheme, host, and path by default. Query strings are included, but "Cache Everything" page rules can accidentally expose personalized endpoints.
- **Akamai:** Relies on Property Manager rules where cache key inclusions/exclusions are defined per behavioral path match.
- **Fastly:** Built on custom VCL; provides full programmable control over hash keys and header normalization.

Cache poisoning is rarely a bug in the cache software itself; it is almost always a mismatch in how the edge proxy and backend origin interpret the request.
:::

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ Defensive Blueprint: How to Lock Down Caches</strong></p>
<ol>
  <li><strong>Never Reflect Unkeyed Inputs:</strong> If a header or parameter changes the HTML response, it MUST be included in the cache key or declared via the <code>Vary</code> header.</li>
  <li><strong>Strip Unnecessary Headers at the Edge:</strong> Configure the edge reverse proxy to strip <code>X-Forwarded-*</code> and internal routing headers before requests reach backend code.</li>
  <li><strong>Explicit Private Directives:</strong> Mark dynamic or personalized pages with <code>Cache-Control: private, no-store, max-age=0</code>.</li>
  <li><strong>Harmonize Normalization:</strong> Ensure the cache and origin use identical path-parsing and parameter-parsing rules.</li>
</ol>
</div>

<TopicComplete topic-id="web-cache-poisoning" label="Mark cache poisoning complete" />
