---
title: Cross-Site Request Forgery (CSRF)
description: Ambient credentials, SameSite, token validation flaws, Referer checks, and method overrides.
---

# Cross-Site Request Forgery (CSRF) · The Case of the Borrowed Identity

<p class="wd-section-lede">Cross-Site Request Forgery (CSRF) does not steal your password or read your private messages. Instead, it borrows your logged-in browser session to perform actions behind your back. Because web browsers automatically attach your login cookies to any request destined for a site, a server that doesn't verify user intent can be tricked into obeying an attacker's orders.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Stamped Signature Stamp.</strong> Imagine keeping an official corporate signature stamp in your desk drawer. Whenever a courier walks in carrying a fund transfer document, the front-desk clerk stamps it with your official seal without asking whether you drafted it or if a stranger handed it to the messenger. The bank processes the transfer because the stamp is authentic—even though you never knew the paper existed.</p>
</div>

## Case File #1: Tracing the Silent Cross-Site Post

Let's follow what happens when an attacker tries to change the email address on your shopping account.

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>You are logged into your favorite shop in Tab 1. In Tab 2, you click a link to read a funny blog post or forum thread. The blog page looks completely normal, but behind the scenes, an invisible form submits itself instantly.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>The blog page contains a hidden HTML form pointing to <code>https://shop.example/my-account/change-email</code>. JavaScript triggers <code>form.submit()</code>. Because the target domain is <code>shop.example</code>, the user's browser automatically attaches their existing session cookie:</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = Legitimate Session Cookie (Attached by Browser)</span>
        <span><span class="wd-code-input">Gold</span> = Attacker's Injected Form Data</span>
      </div>
      <span class="wd-code-dev">POST /my-account/change-email HTTP/1.1</span><br>
      <span class="wd-code-dev">Host: shop.example</span><br>
      <span class="wd-code-dev">Cookie: session=7f9d8a3bc410e52</span><br>
      <span class="wd-code-input">email=attacker@malicious-domain.com</span>
    </div>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>The shop's server looks at the request and asks only one question: <em>"Does this request have a valid session cookie?"</em> Finding the cookie, it assumes the user clicked the button on the real account page. It changes the email address to the attacker's email, enabling a password reset takeover!</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Developers protect endpoints by requiring an unguessable <strong>anti-CSRF token</strong> in the request body. When the real account page loads, the server generates a secret, cryptographically random token tied to the user's session. Because external sites cannot read the shop's DOM due to the Same-Origin Policy, the attacker cannot supply the matching token.</p>
  </div>
</div>

### Visual Comparison: User Intent vs. Ambient Cookie Delivery

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The developer assumed that receiving a POST request accompanied by a valid session cookie meant the account holder deliberately filled out the settings form and clicked "Save Changes".</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>The request originated from a totally different website. Because browsers attach cookies to cross-site requests by default ("ambient credentials"), the server processed the state change without verifying the user's actual intent.</p>
  </div>
</div>

---

## The 5 Stages of a Cross-Site Request

For a CSRF attack to succeed, the request travels through five key moments:

<div class="wd-flow">
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>1. Victim Authenticates</strong>
    User logs into target site; browser receives and stores the session cookie.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>2. Visits External Site</strong>
    Victim opens attacker's lure page or blog in another browser tab.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>3. Auto-Submit Form</strong>
    Lure page's JavaScript secretly triggers a cross-origin POST request.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>4. Ambient Cookie Sent</strong>
    Browser automatically attaches target's session cookies with the request.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>5. Action Executed</strong>
    Target server executes change, believing the victim authorized it.
  </div>
</div>

::: details 🔬 Under the Hood: The Three Pillars of a CSRF Vulnerability
A CSRF vulnerability requires three conditions to be true at the same time:
1. **A Relevant Action:** The target endpoint performs a meaningful state change (e.g. changing an email, transferring money, or altering account permissions).
2. **Cookie-Based Session Handling:** The application relies entirely on browser cookies to identify the user, rather than authorization headers or custom request tokens.
3. **No Unpredictable Parameters:** The request structure is completely predictable—the attacker knows all necessary parameters, and no unpredictable secret is required.
:::

---

## Unprotected Endpoints: The Baseline Case

When an endpoint accepts standard form POST requests and relies purely on session cookies, an attacker can craft a simple self-submitting HTML page to trigger the action.

<LabGroup ids="csrf-lab-no-defenses" />

---

## Flawed Token Validation: The 5 Detective Checkpoints

Many applications implement anti-CSRF tokens, but validate them incorrectly. An investigator checks each link in the validation chain to find where the logic breaks down:

| Flaw Category | What the Server Does Wrong | How the Check Fails |
| --- | --- | --- |
| **Method Dependence** | Only validates token on `POST` requests | Changing the request method to `GET` skips the check entirely |
| **Token Presence** | Only validates token if the parameter exists | Deleting the `csrf` parameter from the request bypasses validation |
| **Session Binding** | Checks if token is valid, but not *whose* token it is | Supplying the attacker's own valid token satisfies the check |
| **Non-Session Cookie** | Binds token to a separate tracking cookie | Injecting a cookie via header injection allows forging a valid pair |
| **Double-Submit Flaw** | Verifies body token matches a cookie token | If an attacker can set cookies (subdomain or CRLF), they set both values |

<LabGroup ids="csrf-lab-token-validation-depends-on-request-method, csrf-lab-token-validation-depends-on-token-being-present, csrf-lab-token-not-tied-to-user-session, csrf-lab-token-tied-to-non-session-cookie, csrf-lab-token-duplicated-in-cookie" />

::: details 🔬 Under the Hood: The Double-Submit Cookie Pattern
The "Double-Submit Cookie" pattern avoids storing tokens in a server-side database. Instead, the server sets a random cookie `csrf=xyz` and requires the client to send `csrf=xyz` in the form body. When the request arrives, the server simply compares the two strings.

**The weakness:** If the attacker has any way to plant a cookie onto the victim's domain (such as via an open redirect, header injection, or an insecure sibling subdomain like `forum.target.com`), the attacker sets the cookie to `hacked` and submits `csrf=hacked` in the body. Because both match, the server accepts the forged request!
:::

---

## SameSite Cookie Restrictions and Bypasses

The `SameSite` cookie attribute tells the browser when to include cookies on cross-site requests:
- **`SameSite=Strict`:** Never sends the cookie on any cross-site request, even when following a regular link.
- **`SameSite=Lax`:** Default in modern browsers. Blocks cookies on cross-site POST requests, but permits cookies on top-level GET navigations (like clicking a link).

Even with `SameSite` enabled, subtle flaws can leave endpoints exposed:

1. **Method Override:** Some web frameworks let incoming GET requests override their HTTP verb using `_method=POST` or query parameters. A `SameSite=Lax` cookie is carried on the top-level GET request, which the backend then executes as a POST!
2. **Client-Side Open Redirects:** An open redirect on the target site can turn a cross-site top-level navigation into a same-site request, carrying Strict cookies along for the ride.
3. **Sibling Domains:** `app.example.com` and `marketing.example.com` are considered same-site. A vulnerability on a sibling domain allows forging requests to the main application.

<LabGroup ids="csrf-lab-samesite-lax-bypass-via-method-override, csrf-lab-samesite-strict-bypass-via-client-side-redirect, csrf-lab-samesite-strict-bypass-via-sibling-domain" />

---

## Referer-Based Defenses

Some applications attempt to prevent CSRF by checking the HTTP `Referer` header to ensure requests originate from their own domain. This defense is notoriously brittle:

- **Missing Referer:** If the server only checks the `Referer` header when it is present, setting `<meta name="referrer" content="no-referrer">` on the attacking page strips the header completely, bypassing the check.
- **Broken Substring Matching:** A naive regular expression checking for `bank.example` can be satisfied by hosting the exploit on `bank.example.attacker.com` or `attacker.com?target=bank.example`.

<LabGroup ids="csrf-lab-referer-validation-depends-on-header-being-present, csrf-lab-referer-validation-broken" />

::: details ⚙️ Framework Quirks: Where Default CSRF Protection Drops
- **Django:** `CsrfViewMiddleware` protects all unsafe methods by default, but views decorated with `@csrf_exempt` disable protection entirely.
- **Ruby on Rails:** `protect_from_forgery` is standard, but developers sometimes use `skip_before_action :verify_authenticity_token`.
- **Spring Security:** CSRF is enabled by default for browser sessions, but frequently disabled globally when developers configure stateless API endpoints.
- **Express.js:** Does not provide CSRF protection out of the box; developers must manually install and configure modern middleware.
:::

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ The Detective's Defense Blueprint.</strong> Bind unpredictable, cryptographically random CSRF tokens to the user's server-side session. Validate tokens strictly on all state-changing methods. Configure session cookies with <code>SameSite=Lax</code> or <code>Strict</code>, <code>Secure</code>, and <code>HttpOnly</code>. Never permit sensitive state modifications over GET requests.</p>
</div>

<TopicComplete topic-id="cross-site-request-forgery-csrf" label="Mark CSRF complete" />
