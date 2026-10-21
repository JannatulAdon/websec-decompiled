---
title: Web Cache Deception
description: Path mapping, delimiters, origin and cache normalisation, and exact-match cache rules.
---

# Web Cache Deception · The Leaked Dossier

<p class="wd-section-lede">Web cache deception is the mirror image of cache poisoning. While poisoning forces the cache to store malicious attacker content for everyone else to consume, deception tricks the cache into saving an innocent victim's <em>private personal data</em> as if it were a public file—letting the attacker casually download it moments later.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Envelope with the Wrong Label.</strong> Imagine walking into a bank to collect your confidential financial statement. A prankster convinces you to place the envelope inside a clear plastic sleeve labeled <code>PUBLIC_PROMOTIONAL_FLYER.png</code>. The bank teller verifies your ID, places your confidential financial statement inside the sleeve, and hands it to you. But as you pass through the lobby, the front-desk security guard spots the label <code>PUBLIC_PROMOTIONAL_FLYER.png</code>, makes a photocopy of everything inside, and pins it directly to the public bulletin board. Five minutes later, the prankster walks into the lobby and reads your financial records right off the wall.</p>
</div>

## Case File #3: The Anatomy of a Deceptive Cache

Web cache deception thrives on a fundamental disagreement between two systems: the edge cache inspects the **file extension** to decide if an asset is public, while the backend origin inspects the **route prefix** to decide which private data to serve.

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>A logged-in victim receives a link from an attacker: <code>https://example.com/my-account/avatar.css</code>. When clicked, the victim's browser sends their session cookies. The page renders their private profile information or a seemingly blank stylesheet.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>The backend application framework uses permissive routing (or path rewriting). It spots <code>/my-account</code>, ignores the trailing <code>/avatar.css</code>, and renders the victim's confidential account dashboard containing their private API keys and email address.</p>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>As the response streams back through the edge CDN, the caching engine evaluates the URL. Because the path ends with <code>.css</code>, and the response lacks strict <code>no-store</code> headers, the CDN assumes it is a static stylesheet and saves the entire private HTML page in public edge storage!</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Always send <code>Cache-Control: private, no-store</code> on all authenticated endpoints, configure cache rules to obey response headers rather than file extensions, and ensure origin routing strictly returns 404 for extraneous path suffixes.</p>
  </div>
</div>

### Visual Comparison: Static Expectation vs. Dynamic Reality

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The CDN only caches static files like stylesheets, scripts, and logos. Sensitive account pages are dynamic and will never be saved to shared public storage.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>The origin ignored the trailing filename and served private profile data. The CDN keyed the response under <code>/avatar.css</code> and cached the private data, allowing an unauthenticated attacker to view it.</p>
  </div>
</div>

### Splitting the Route: The Deceptive URL

Look at how the two layers read the exact same path differently:

<div class="wd-codesplit">
  <div class="wd-codesplit__legend">
    <span><span class="wd-code-dev">Blue</span> = Dynamic Private Route (Read by Backend Origin)</span>
    <span><span class="wd-code-input">Gold</span> = Deceptive Static Suffix (Read by Edge Cache)</span>
  </div>
  <span class="wd-code-dev">https://example.com/my-account</span><span class="wd-code-input">/avatar.css</span>
</div>

::: details 🔬 Under the Hood: The Three Iron Rules for Web Cache Deception
For an attacker to successfully steal private user information through cache deception, three separate conditions must all be met simultaneously:
1. **The Cache Must Rely on File Extensions:** The edge CDN must judge whether a file is cacheable by looking at its URL suffix (e.g., `.css`, `.js`, `.jpg`) rather than the origin's `Content-Type` header.
2. **The Origin Must Forgive Extraneous Path Segments:** The web framework must strip or ignore arbitrary suffixes (via wildcard routing, `PATH_INFO`, or trailing-slash rewrites) and still render the private account data.
3. **The Victim Must Be Authenticated:** The victim must click the crafted link while holding an active session cookie on the target website.
:::

---

## The 5-Stage Life of a Cache Deception Attack

Follow the path of a victim's private profile as it lands on a public CDN edge:

<div class="wd-flow">
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>1. Lure Delivery</strong>
    Attacker crafts a link appending a static extension to a private route (<code>/profile/w.js</code>).
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>2. Victim Click</strong>
    Logged-in victim clicks the lure; browser automatically attaches session cookies.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>3. Permissive Origin</strong>
    Origin ignores <code>/w.js</code>, renders the victim's private profile, omitting <code>no-store</code>.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>4. Public Caching</strong>
    Edge CDN sees <code>.js</code>, stores the private profile body in its shared cache.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>5. Unauthenticated Harvest</strong>
    Attacker browses to <code>/profile/w.js</code> with no cookies and reads the cached profile!
  </div>
</div>

---

## Path Mapping Vulnerabilities

The most direct form of cache deception relies on URL path mapping. Many web server frameworks (such as Django, Spring, or PHP) route requests by matching path prefixes. 

When a request for `/my-account/nonexistent.jpg` arrives, the routing dispatcher matches the prefix `/my-account`, invokes the account controller, and returns the victim's profile page with HTTP status 200 OK. The caching layer sees `.jpg` and caches the response.

<LabGroup ids="cache-deception-lab-wcd-exploiting-path-mapping" />

---

## Delimiters: Semicolons, Hashes, and Dots

When simple path appending fails, attackers turn to delimiter characters to confuse the boundary between the route and the filename.

Different web technologies recognize different characters as path separators:
- **Semicolons (`;`):** Java Spring and matrix parameter implementations treat everything after a semicolon as parameter data, routing `/my-account;param.css` directly to `/my-account`. Meanwhile, the CDN sees a file ending in `.css`.
- **Question Marks (`?`) and Hashes (`#`):** If the cache or origin fails to decode encoded delimiters (`%23`, `%3F`), one server sees a query parameter while the other sees part of the file path.
- **Null Bytes (`%00`):** In legacy systems, null bytes terminate strings prematurely on the origin while the cache processes the full URL.

<LabGroup ids="cache-deception-lab-wcd-exploiting-path-delimiters" />

::: details 🔬 Under the Hood: How Path Normalization Creates Deception
Web servers and CDNs regularly "normalize" incoming paths to resolve relative jumps:
- Collapsing double slashes (`//my-account` → `/my-account`)
- Resolving dot segments (`/my-account/../my-account`)
- Decoding percent-encoded characters (`%2e%2e%2f` → `../`)

A critical vulnerability occurs when the cache and origin perform this normalization in **different orders**. If the cache keys the raw URL while the origin decodes dot segments, an attacker can craft `/my-account%2f..%2fstatic.css`. The origin normalizes and serves `/my-account`, but the cache indexes the request as a static stylesheet!
:::

---

## Origin vs. Cache Normalization

The two labs below test the direction of path normalization discrepancies:

- **Origin Server Normalization:** The origin resolves directory traversal dot-segments (`/..`), collapsing the path back to the private route, while the cache stores the response based on the raw un-normalized static string.
- **Cache Server Normalization:** The cache resolves dot-segments and determines that the URL targets a static file path, while the backend application routes on the raw un-normalized path.

<LabGroup ids="cache-deception-lab-wcd-exploiting-origin-server-normalization, cache-deception-lab-wcd-exploiting-cache-server-normalization" />

---

## Exact-Match Cache Rules

Many modern enterprise CDNs avoid broad wildcard extension rules and instead use precise matching rules (e.g., only caching paths matching `/static/*` or `/resources/*.js`).

To deceive an exact-match cache rule, an attacker must craft a path that satisfies the CDN's exact prefix or regex rule while tricking the origin into resolving back to a sensitive endpoint—frequently accomplished using path traversal sequences or server-specific path parameters.

<LabGroup ids="cache-deception-lab-wcd-exploiting-exact-match-cache-rules" />

::: details ⚙️ Engine Variations: Caching Behaviors Across CDNs
- **Cloudflare:** Caches standard static extensions by default (e.g., `.css`, `.js`, `.jpg`, `.pdf`). Custom Page Rules configured to "Cache Everything" will aggressively store HTML pages unless explicit cache headers prohibit it.
- **Akamai:** Relies heavily on Property Manager rules. Path-based caching behaviors must be explicitly synchronized with origin web server routing.
- **Varnish Cache:** Uses `vcl_recv` and `vcl_backend_response`. Unless configured to check `beresp.http.Cache-Control`, custom VCL scripts may blindly cache based on regex file extensions.
- **Nginx `proxy_cache`:** Caching behavior is configured via `proxy_cache_valid`. If set for 200 OK responses without checking origin headers, dynamic pages will be saved.

The deception succeeds whenever the deployment's rule for *"what is cacheable"* is broader than the application's rule for *"what is public"*.
:::

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ Defensive Blueprint: How to Prevent Cache Deception</strong></p>
<ol>
  <li><strong>Send Explicit Cache Directives:</strong> Every authenticated endpoint MUST return <code>Cache-Control: private, no-store, max-age=0</code>. Caches will never store responses carrying this header.</li>
  <li><strong>Cache by Content-Type, Not Extension:</strong> Configure CDNs to cache responses based on the <code>Content-Type</code> header returned by the origin, rather than guessing from the URL file extension.</li>
  <li><strong>Strict Origin Routing:</strong> Configure web frameworks to reject extraneous path segments (disable permissive wildcard routing on authenticated routes). A request for <code>/my-account/test.css</code> should return an instant 404.</li>
  <li><strong>Synchronize URL Parsing:</strong> Ensure that reverse proxies and backend application servers treat delimiters (<code>;</code>, <code>?</code>, <code>#</code>) and URL encodings identically.</li>
</ol>
</div>

<TopicComplete topic-id="web-cache-deception" label="Mark web cache deception complete" />
