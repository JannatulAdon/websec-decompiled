---
title: HTTP Request Smuggling
description: CL.TE, TE.CL, TE.TE, HTTP/2 downgrades, 0.CL, CL.0, client-side desync, and pause-based desync.
---

# HTTP Request Smuggling · The Pipeline Desync

<p class="wd-section-lede">Request smuggling happens when two servers along the same delivery chain cannot agree on where one HTTP request ends and the next one begins. When a front-end proxy and a back-end web server read the exact same stream of bytes with different boundary rules, leftover data sits inside the TCP connection like an unexploded tripwire—ready to hijack the very next person's request.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Conveyor Belt &amp; The Two Inspectors.</strong> Imagine a shared conveyor belt moving packages between two postal inspectors. Inspector A (the front-end reverse proxy) checks deliveries using a yardstick (<code>Content-Length</code>): <em>"This package is exactly 50 inches long."</em> Inspector B (the back-end application server) ignores yardsticks and looks strictly for bright orange "END OF CARGO" tape (<code>Transfer-Encoding: chunked</code>). If an attacker places "END OF CARGO" tape at inch 20, Inspector A ships the entire 50-inch box through. But Inspector B stops reading at inch 20! The remaining 30 inches sit abandoned on the conveyor belt. When the next innocent customer slides their box onto the belt, Inspector B glues your leftover 30 inches right onto the front of their envelope.</p>
</div>

## Case File #1: The Anatomy of a Desync

To optimize speed, modern websites don't open a brand new TCP connection for every single browser click. Instead, a front-end proxy bundles multiple requests from many different users down a single, persistent back-end pipeline.

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>A website behaves erratically. Sometimes an ordinary page load returns an instant 404, redirects to an unexpected third-party domain, or displays another visitor's private session cookie inside your own comment preview.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>The front-end proxy accepts an incoming HTTP/1.1 POST request. It spots <code>Content-Length: 13</code>, counts 13 bytes of body data, and forwards the entire blob down a persistent keep-alive pipe to the internal back-end server.</p>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>The back-end server inspects the same packet, but its parser prefers <code>Transfer-Encoding: chunked</code>. It reads up to chunk <code>0</code>, treats the request as fully satisfied, and starts waiting for the next request. The leftover bytes (<code>SMUGGLED</code>) remain unread in the back-end's TCP stream buffer.</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Front-end proxies must normalize inbound traffic: reject any request carrying both <code>Content-Length</code> and <code>Transfer-Encoding</code>, disable TCP connection reuse to back-end pools, or transition the entire infrastructure to end-to-end HTTP/2.</p>
  </div>
</div>

### Visual Comparison: One Message in, Two Messages Out

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The front-end proxy and back-end server will parse boundaries identically. Exactly one incoming HTTP request from the browser translates to exactly one processed transaction on the backend application server.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>The front-end forwards one monolithic request. The back-end stops reading early, treating the tail as the beginning of a second request. The next user's innocent request is prepended with the attacker's smuggled prefix!</p>
  </div>
</div>

### Inspecting the Boundary Collision

Here is the classic packet that triggers the desync. Look at how each server interprets the boundary:

<div class="wd-codesplit">
  <div class="wd-codesplit__legend">
    <span><span class="wd-code-dev">Blue</span> = Front-End Envelope (Content-Length: 13)</span>
    <span><span class="wd-code-input">Gold</span> = Back-End Terminator (Chunked 0)</span>
    <span><span class="wd-code-dead">Strikethrough</span> = Orphaned Bytes (Prefixed to Next User)</span>
  </div>
  <span class="wd-code-dev">POST / HTTP/1.1<br>Host: lab.example<br>Content-Length: 13<br>Transfer-Encoding: chunked<br><br></span><span class="wd-code-input">0\r\n\r\n</span><span class="wd-code-dead">SMUGGLED</span>
</div>

::: details 🔬 Under the Hood: Chunked Encoding is a Stream Protocol, Not Just a Header
In HTTP/1.1, `Content-Length` specifies the exact byte size of the payload upfront. In contrast, `Transfer-Encoding: chunked` splits data into blocks:

```text
<hex length of chunk>\r\n
<chunk data bytes>\r\n
0\r\n
\r\n
```

A parser honoring chunked encoding ignores byte counts and processes chunk after chunk until it encounters the terminating `0` chunk followed by an empty line (`0\r\n\r\n`). 

RFC 9112 stipulates that if both headers are present, `Transfer-Encoding` must take precedence, and any request containing both should ideally be rejected with a 400 Bad Request. However, legacy software or custom load balancers frequently fail to enforce this rule, enabling desynchronization attacks.
:::

---

## The 5-Stage Life of a Smuggled Request

Trace the path of the dual-header packet through a shared connection:

<div class="wd-flow">
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>1. Dual-Header Probe</strong>
    Attacker transmits conflicting <code>Content-Length</code> and <code>Transfer-Encoding</code> headers.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>2. Front-End Routing</strong>
    Edge proxy counts total bytes, marks the message complete, and sends it down the shared TCP pipe.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>3. Back-End Early Stop</strong>
    Back-end reads the <code>0</code> chunk and finishes Request #1 early, leaving trailing bytes behind.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>4. Pipeline Buffer</strong>
    The orphaned bytes sit at the front of the server's TCP socket queue.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>5. Victim Collision</strong>
    The next visitor sends <code>GET /</code>; the server glues it onto the orphan, executing the attacker's command!
  </div>
</div>

---

## CL.TE Attacks: Front-End Uses Content-Length

In a **CL.TE** environment, the front-end proxy uses the `Content-Length` header while the back-end application server uses the `Transfer-Encoding` header.

Because the front-end reads the length header, an attacker sets `Content-Length` to cover the entire transmission (including the smuggled content). The back-end, however, stops reading as soon as it sees `0\r\n\r\n`. Everything following that zero is treated as the raw starting text of the next HTTP request.

<LabGroup ids="request-smuggling-lab-basic-cl-te, request-smuggling-lab-confirming-cl-te-via-differential-responses, request-smuggling-lab-bypass-front-end-controls-cl-te, request-smuggling-lab-reveal-front-end-request-rewriting" />

---

## TE.CL Attacks: Front-End Uses Transfer-Encoding

In a **TE.CL** environment, the roles are reversed: the front-end proxy honors `Transfer-Encoding: chunked`, while the back-end server honors `Content-Length`.

Here, the attacker wraps the smuggled request inside a chunk, ensuring the front-end forwards the whole payload. But the back-end only reads the small number of bytes declared in its `Content-Length` header. The unread chunk remainder stays on the wire, ready to merge with whoever speaks next.

<LabGroup ids="request-smuggling-lab-basic-te-cl, request-smuggling-lab-confirming-te-cl-via-differential-responses, request-smuggling-lab-bypass-front-end-controls-te-cl" />

---

## TE.TE: Obfuscating Conflicting Headers

What happens when both the front-end and the back-end support `Transfer-Encoding: chunked`? The attacker attempts to confuse one of the two parsers into ignoring the header by mangling it slightly.

Common obfuscation tricks include:
- `Transfer-Encoding: xchunked`
- `Transfer-Encoding : chunked` (trailing space before colon)
- Multiple headers: `Transfer-Encoding: chunked` alongside `Transfer-encoding: cow`
- Header values separated by tab characters (`\t`) or vertical spaces

If the front-end normalizes the mangled header and processes chunked data, but the back-end rejects the malformed header and falls back to `Content-Length`, a desync is born.

<LabGroup ids="request-smuggling-lab-obfuscating-te-header" />

---

## Weaponizing the Desync: Captures & Cache Poisoning

Once a desynchronized pipeline is established, the smuggled prefix can achieve several high-severity outcomes:

1. **Capturing Credentials & Cookies:** Smuggle an incomplete request (like `POST /comment?body=`). When an innocent user makes a request, their headers—including `Cookie: session=...` and `Authorization` tokens—are appended to the attacker's comment body and saved in public view!
2. **Reflected XSS for Everyone:** Prefix an innocent user's request with a path triggering reflected XSS, hitting users who never clicked an attacker's link.
3. **Web Cache Poisoning:** Prepend a request for a static resource (`/main.js`) with malicious redirects, permanently poisoning the edge cache for all users.

<LabGroup ids="request-smuggling-lab-capture-other-users-requests, request-smuggling-lab-deliver-reflected-xss, request-smuggling-lab-perform-web-cache-poisoning, request-smuggling-lab-perform-web-cache-deception" />

---

## HTTP/2 Downgrading (H2.CL and H2.TE)

HTTP/2 uses binary framing where frame lengths are mathematically determined rather than parsed from text characters. However, modern CDNs and reverse proxies frequently terminate HTTP/2 at the perimeter and **downgrade** the request to HTTP/1.1 before sending it to legacy backend servers.

If the edge gateway blindly copies HTTP/2 pseudo-headers into HTTP/1.1 text without strict sanitization, classic desync vulnerabilities resurface:
- **H2.CL:** The gateway forwards the binary frame length, but also passes an injected `content-length` header to the HTTP/1.1 backend.
- **H2.TE:** The edge forwards an injected `transfer-encoding: chunked` header forbidden in HTTP/2 specs.
- **CRLF Injection in Headers:** Injecting `\r\n` characters inside an HTTP/2 header value causes the downstream HTTP/1.1 gateway to split the line into a completely new header or request line.
- **Request Tunnelling:** Smuggling a request directly through an authorized front-end tunnel to bypass edge firewalls.

<LabGroup ids="request-smuggling-lab-request-smuggling-h2-cl-request-smuggling, request-smuggling-lab-request-smuggling-h2-request-smuggling-via-crlf-injection, request-smuggling-lab-request-smuggling-h2-response-queue-poisoning-via-te-request-smuggling, request-smuggling-lab-request-smuggling-h2-request-splitting-via-crlf-injection, request-smuggling-lab-request-smuggling-h2-bypass-access-controls-via-request-tunnelling, request-smuggling-lab-request-smuggling-h2-web-cache-poisoning-via-request-tunnelling" />

---

## Modern Desyncs: 0.CL and CL.0

Recent research shows that desyncs can happen even without chunked encoding when one server ignores request bodies on specific HTTP verbs:

- **CL.0:** The backend assumes `GET` requests never have bodies and ignores `Content-Length`, leaving the body on the socket as the next request.
- **0.CL:** The front-end ignores the body on a request, but the backend honors `Content-Length`, pulling subsequent data into the body.

<LabGroup ids="request-smuggling-lab-request-smuggling-0cl-request-smuggling, request-smuggling-lab-cl-0-request-smuggling" />

---

## Client-Side and Pause-Based Desynchronization

- **Client-Side Desync:** Uses the victim's own web browser as the front-end! A cross-origin request tricks the browser into sending an HTTP request whose body is partially ignored by the server, poisoning future requests made on that browser's keep-alive socket.
- **Pause-Based Desync:** Exploits servers that begin processing requests before receiving the entire body. By inserting deliberate pauses mid-stream, an attacker forces the server to misidentify message boundaries.

<LabGroup ids="request-smuggling-lab-client-side-desync, request-smuggling-lab-server-side-pause-based-request-smuggling" />

::: details ⚙️ Engine Variations: Parser Differences Across Common Stacks
- **Nginx:** Modern versions reject requests containing both `Content-Length` and `Transfer-Encoding`. Older versions prioritized `Transfer-Encoding`.
- **HAProxy:** Strict by default. Configurations using `http-use-htx` normalize and re-encode messages safely.
- **Apache HTTP Server (`mod_proxy`):** Historically preferred `Content-Length` in certain reverse-proxy configurations.
- **Node.js (`llhttp`):** Strictly validates conflicting headers in recent releases following notable parser security patches.
- **Cloud Load Balancers (AWS ALB, CloudFront):** Normalize headers aggressively; however, translation from HTTP/2 to backend HTTP/1.1 remains a primary attack surface.

Remember: Request smuggling is almost never a vulnerability in a single server. It is an **architectural disagreement** across a boundary between two systems.
:::

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ Defensive Blueprint: How to Neutralize Smuggling</strong></p>
<ol>
  <li><strong>End-to-End HTTP/2:</strong> Avoid HTTP/2 downgrades by running HTTP/2 or HTTP/3 all the way to backend services.</li>
  <li><strong>Strict Edge Normalization:</strong> Configure edge proxies to drop ambiguous requests with both <code>Content-Length</code> and <code>Transfer-Encoding</code>.</li>
  <li><strong>Disable Backend Keep-Alive Reuse:</strong> Terminate TCP connections between proxy and backend per request when dealing with untrusted upstream routes.</li>
  <li><strong>Unified Parser Stacks:</strong> Use matching HTTP parsing software on both edge and origin to ensure identical boundary interpretation.</li>
</ol>
</div>

<TopicComplete topic-id="http-request-smuggling" label="Mark request smuggling complete" />
