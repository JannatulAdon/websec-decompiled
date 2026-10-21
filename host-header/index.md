---
title: HTTP Host Header Attacks
description: Host routing, password-reset poisoning, cache poisoning, routing SSRF, absolute-URI parsing, and dangling markup.
---

# HTTP Host Header Attacks · The Identity Swap

<p class="wd-section-lede">The <code>Host</code> header was introduced in HTTP/1.1 to allow multiple websites to share a single IP address (virtual hosting). Because browsers set this header automatically, developers often assume it is authoritative and trustworthy. In reality, the Host header is completely client-controlled. When servers trust it to construct absolute links, make access-control decisions, or route internal requests, attackers can poison caches, steal reset tokens, and breach internal networks.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Sticky Note on Your Forehead.</strong> Imagine walking into a massive office building that houses dozens of different corporate tenants. In the lobby, you tell the front desk security guard: <em>"I have an appointment at Global Bank."</em> Global Bank welcomes you into their office. While there, you request an official bank verification letter to be mailed to your colleague. But instead of looking up its own corporate headquarters in the telephone directory, Global Bank's automated mailing machine reads the handwritten sticky note stuck on your forehead: <code>Official Headquarters: evil-attacker.com</code>! The bank prints that address on the letter and mails it out. When your colleague clicks the verification link in the letter, their confidential credentials land straight in the attacker's hands.</p>
</div>

## Case File #7: The Anatomy of a Host Header Attack

When web frameworks need to generate an absolute URL (for example, inside an email confirmation or password reset notification), they frequently pull the domain directly from `request.headers["Host"]` rather than a hardcoded configuration setting.

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>You visit a website's "Forgot Password" page and request a reset link for an account. Intercepting the request in an HTTP proxy, you replace <code>Host: example.com</code> with <code>Host: attacker.com</code>. The server replies with a friendly <code>200 OK: Check your email</code>.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>The backend application generates a unique, cryptographically random password-reset token. To build the reset link, it evaluates: <code>"https://" + req.headers["host"] + "/reset?token=" + token</code>. It embeds this link into an email and delivers it to the registered user's inbox.</p>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>The server relied on an untrusted client header to identify its own public domain name. When the legitimate victim opens their email and clicks the reset button, their browser sends the private reset token directly to the attacker's server, resulting in an instant account takeover.</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Define the canonical base URL in server-side configuration settings (e.g. <code>SITE_DOMAIN = "example.com"</code>) and use it exclusively for email links and redirects. Configure reverse proxies to reject any request carrying an unrecognized Host header.</p>
  </div>
</div>

### Visual Comparison: Hardcoded Truth vs. Client Assumption

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The Host header is set by standard web browsers to point to the current site. It accurately reflects the server's public identity and can be trusted to generate emails and redirects.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>The client replaced the Host header with an external domain. The server trusted the header and mailed a password-reset link pointing to the attacker's server, leaking the secret token.</p>
  </div>
</div>

### Spotting the Spoofed Authority

Look at how the modified header rewrites the server's generated link:

<div class="wd-codesplit">
  <div class="wd-codesplit__legend">
    <span><span class="wd-code-dev">Blue</span> = Legitimate API Endpoint</span>
    <span><span class="wd-code-input">Gold</span> = Tampered Host Header</span>
    <span><span class="wd-code-dead">Strikethrough</span> = Resulting Email Reset Link</span>
  </div>
  <span class="wd-code-dev">POST /forgot-password HTTP/1.1<br></span><span class="wd-code-input">Host: attacker.com<br></span><span class="wd-code-dev">Content-Type: application/x-www-form-urlencoded<br><br>username=victim_user<br><br></span><span class="wd-code-dead">Email Generated: https://attacker.com/reset-password?token=secret987xyz</span>
</div>

::: details 🔬 Under the Hood: Absolute-Form URLs vs. Origin-Form Requests
An HTTP/1.1 request line can take multiple forms according to RFC 9112:
- **Origin-Form:** `GET /admin HTTP/1.1` (Relies on the `Host` header to know the destination)
- **Absolute-Form:** `GET http://example.com/admin HTTP/1.1` (Contains the full URL directly in the request line)

When an attacker sends an absolute-form request containing both a URL host and a conflicting `Host` header:
```http
GET http://internal-admin.local/ HTTP/1.1
Host: public-store.com
```
If a reverse proxy routes based on the absolute URI while the backend server checks the `Host` header (or vice versa), the attacker can bypass front-end IP restrictions or access forbidden intranet admin consoles!
:::

---

## The 5-Stage Life of a Password-Reset Poisoning Attack

Follow the flow of a poisoned Host header from initial trigger to account takeover:

<div class="wd-flow">
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>1. Attacker Trigger</strong>
    Attacker submits a password reset for the victim, injecting <code>Host: attacker.com</code>.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>2. Insecure Link Assembly</strong>
    Server creates a secret reset token and glues the untrusted Host header into the link.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>3. Email Delivery</strong>
    Server sends an official email to the victim's genuine inbox containing the poisoned link.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>4. Victim Clicks</strong>
    Victim believes the email is legitimate and clicks the button, sending the token to <code>attacker.com</code>.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>5. Account Takeover</strong>
    Attacker reads the token from their server logs and resets the victim's password!
  </div>
</div>

---

## Where the Host Header is Used

Applications regularly reuse the Host header in multiple critical areas:

| Operational Use | Typical Attack Surface | Impact |
| --- | --- | --- |
| Building Absolute URLs in Emails | Password Reset Poisoning | Complete Account Takeover |
| Routing to Virtual Hosts | Admin Interface Access Bypass | Unauthorized Admin Panel Access |
| Cache Key Construction | Web Cache Poisoning | Mass Stored XSS / Redirection |
| Internal Service Discovery | Routing-Based SSRF | Access to Cloud Metadata & Intranet |
| Access-Control Checks | `Host: localhost` Header Spoofing | Bypass Perimeter IP Allow-Lists |

<LabGroup ids="host-header-lab-host-header-basic-password-reset-poisoning, host-header-lab-host-header-authentication-bypass" />

---

## Password Reset Poisoning via Dangling Markup

In some hardened systems, the application validates the Host header against a whitelist, preventing arbitrary domains. However, if the server permits port numbers or specific characters, an attacker can inject **dangling markup** into the Host header (e.g., `Host: example.com:'<a href="http://attacker.com/?`).

When the server embeds this malformed string into the email HTML without proper attribute quoting, the browser consumes all following characters—including the genuine password reset token—and appends them to the attacker's URL parameter!

<LabGroup ids="host-header-lab-host-header-password-reset-poisoning-via-dangling-markup" />

---

## Web Cache Poisoning via Ambiguous Requests

When a front-end cache and a backend web server handle ambiguous or malformed Host headers differently, an attacker can poison the cache for legitimate users.

Techniques for injecting ambiguous host headers include:
- **Duplicate Host Headers:** Sending two `Host` headers in a single request. If the cache keys on the first header (`example.com`) but the backend application renders based on the second (`attacker.com`), the cached page will serve attacker content to everyone.
- **Line Wrapping (RFC 7230 Obsolete):** Prepending a space or tab before a second Host header line.
- **X-Forwarded-Host Spoofing:** Supplying `Host: legitimate.com` with `X-Forwarded-Host: attacker.com`. If the backend prioritizes the forward header, the cache stores the poisoned response.

<LabGroup ids="host-header-lab-host-header-web-cache-poisoning-via-ambiguous-requests" />

---

## Routing-Based SSRF

Many modern cloud architectures use reverse proxies that route incoming requests directly based on the destination found in the `Host` header.

If an attacker transmits an HTTP request targeting an internal IP address or internal service name in the `Host` header:
```http
GET /admin HTTP/1.1
Host: 192.168.0.1
```
The reverse proxy forwards the request into the private corporate network, converting an ordinary HTTP request into Server-Side Request Forgery (SSRF) without needing any URL input parameter.

<LabGroup ids="host-header-lab-host-header-routing-based-ssrf, host-header-lab-host-header-ssrf-via-flawed-request-parsing" />

---

## Connection-State Attacks

Some enterprise load balancers validate the `Host` header only during the very first request on a newly opened TCP keep-alive connection.

In a **connection-state attack**, an attacker opens a persistent TCP connection and sends a completely valid, authorized request first. Then, down the exact same open socket, they immediately transmit a second request with a forbidden `Host` header (such as `Host: internal-admin.corp`). The front-end reuses the verified connection state without re-evaluating the host, granting access to restricted endpoints.

<LabGroup ids="host-header-lab-host-header-host-validation-bypass-via-connection-state-attack" />

::: details ⚙️ Engine Variations: How Web Servers Handle the Host Header
- **Nginx:** The `$host` variable checks the request line host, then the `Host` header, and finally falls back to the default `server_name`. Using `$http_host` returns the exact raw client-provided header (including custom ports).
- **Apache HTTP Server:** Resolves virtual hosts using `ServerName` and `ServerAlias`. The `UseCanonicalName` directive determines whether Apache uses the configured name or client header when generating self-referencing URLs.
- **Node.js:** `req.headers.host` exposes the unvalidated client string. Modern frameworks advise using `URL` parsing with an explicit base origin.
- **Java Spring / Servlets:** `HttpServletRequest.getServerName()` can return the client's `Host` header unless explicit connector configuration forces canonical names.
- **Cloud Load Balancers:** Frequently overwrite or append `X-Forwarded-Host` and `X-Forwarded-Proto`. Relying on these headers without verifying edge trust invites spoofing.
:::

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ Defensive Blueprint: How to Lock Down Host Header Handling</strong></p>
<ol>
  <li><strong>Use Hardcoded Canonical Domain Configurations:</strong> Never generate email links, password reset URLs, or payment callbacks using <code>req.headers["host"]</code>. Read the base domain strictly from a server environment variable.</li>
  <li><strong>Strict Virtual Host Allow-Lists:</strong> Configure Nginx, Apache, or cloud load balancers to reject any incoming request whose Host header does not match a strict list of allowed domain names (return <code>404 Not Found</code> or <code>400 Bad Request</code>).</li>
  <li><strong>Configure a Dummy Default Host:</strong> Ensure the default virtual host for unmatched requests serves an empty error page rather than routing to sensitive internal services.</li>
  <li><strong>Protect Forwarded Headers:</strong> Ensure backend applications only trust <code>X-Forwarded-Host</code> when it originates from a verified, authenticated internal reverse proxy.</li>
</ol>
</div>

<TopicComplete topic-id="http-host-header-attacks" label="Mark Host header attacks complete" />
