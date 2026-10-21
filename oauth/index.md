---
title: OAuth Authentication · Case File 07
description: "Inspect third-party sign-in handshakes, redirect URI validation gaps, CSRF state omissions, and token theft vectors."
---

# OAuth Authentication · The Untrusted Handshake

<p class="wd-section-lede">OAuth 2.0 was designed for <em>delegated authorization</em>—granting a service permission to read your calendar or photos without sharing your password. When modern websites bolt login authentication on top of OAuth, they create an intricate relay race between the browser, the application, and the identity provider where a single lax redirect rule can hand over the entire account.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Valet Parking Claim Ticket.</strong> Imagine pulling up to a luxury hotel and handing your car keys to the valet. The valet gives you a numbered claim ticket that lets anyone holding it retrieve your car. Now imagine you drop the claim ticket on the sidewalk, or the valet hands your car keys to anyone wearing a jacket similar to yours without checking their room number or identity. That is what happens when OAuth leaks authorization codes: anyone who intercepts that claim ticket can redeem it for full access to the victim's account.</p>
</div>

## Case File #7: Following the OAuth Handshake Behind the Scenes

Let's trace what happens when you click "Log in with Social Account" on an e-commerce website:

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>You click "Sign in with Social ID". Your browser redirects to the third-party provider's consent page: <code>oauth.provider.com/auth?client_id=store_123&amp;redirect_uri=https://store.com/oauth-callback&amp;response_type=code&amp;scope=email</code>. You click "Authorize", and the provider redirects you back to the store with a code: <code>https://store.com/oauth-callback?code=SECRET_AUTH_CODE</code>.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>The store's backend server grabs the <code>code</code> from the redirect URL, connects directly to the identity provider's backstage API endpoint, exchanges the code for an access token, and fetches your email address to log you in:</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = Legitimate Registered Callback</span>
        <span><span class="wd-code-input">Gold</span> = Tampered Parameter / Leakage Target</span>
      </div>
      <span class="wd-code-dev">redirect_uri=https://store.com/oauth-callback</span><span class="wd-code-input">/../../attacker.com/capture</span>
    </div>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>The authorization server used loose pattern matching or path traversal on the <Term id="oauth-redirect-uri">redirect_uri</Term> parameter instead of enforcing an exact string match. As a result, the victim's secret authorization code is redirected straight into an external server log controlled by the attacker, allowing them to redeem the victim's login session!</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Enforce strict, exact string matching for all registered <code>redirect_uri</code> endpoints on the authorization server. Always include an unpredictable, cryptographically random <code>state</code> parameter bound to the user's browser session to prevent login CSRF, and adopt Authorization Code with PKCE (Proof Key for Code Exchange).</p>
  </div>
</div>

### Visual Comparison: Exact Match vs. Regex Slip

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The OAuth authorization server will only ever send the user's secret authorization code back to our official callback URL: <code>https://client.com/oauth-callback</code>.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>The authorization server used a loose substring or prefix check, allowing <code>https://client.com/oauth-callback.attacker.com</code> or paths containing directory traversal to leak the code off-site.</p>
  </div>
</div>

### The 5 Stages of the OAuth Authorization Code Flow

Every standard OAuth login involves a coordinated multi-party handshake across the browser, client app, and authorization server:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>1. Auth Request</strong>
    Browser sends client ID, scope, state, and <code>redirect_uri</code>.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>2. Consent &amp; Grant</strong>
    User logs in at provider and consents to share profile.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>3. Code Redirect</strong>
    Provider redirects browser back with <code>?code=XYZ</code>.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>4. Backchannel Token</strong>
    App server exchanges code for token via secure API.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>5. Profile Minting</strong>
    App fetches user profile info and signs session cookie.
  </div>
</div>

---

## Implicit Flow and Redirect URI Leakage

In legacy OAuth implementations, applications often relied on the **Implicit Grant Flow**, where the authorization server delivers access tokens directly in the URL fragment (`#access_token=...`) to the browser instead of returning an authorization code to the backend.

Because tokens exist directly in the browser's address bar:
- Any open redirect or third-party script on the callback page can steal the token.
- Web proxies, browser extensions, or `Referer` headers can leak the fragment to untrusted destinations.
- If the application trusts profile emails sent directly from the client without verifying the server-side signature, an attacker can substitute any victim's email address and take over their account.

<LabGroup ids="oauth-lab-oauth-authentication-bypass-via-oauth-implicit-flow, oauth-lab-oauth-account-hijacking-via-redirect-uri" />

::: details 🔬 Under the Hood: Why URL Matching in OAuth Is Deceptively Difficult
When validating incoming `redirect_uri` parameters, authorization servers frequently make subtle parsing errors:
- **Prefix Matching Flaws:** Checking `uri.startsWith("https://example.com/callback")` erroneously approves `https://example.com/callback.attacker.com`.
- **Domain Wildcards:** Allowing `https://*.example.com/callback` enables any compromised subdomain, XSS flaw, or open redirect on any subdomain to capture codes.
- **Path Traversal in Redirects:** Sending `https://example.com/oauth/callback/../../open-redirect` resolves after validation, redirecting codes through an internal open redirect.
:::

---

## Profile Linking and Missing `state` Parameters

Many websites let users link their existing account to an external Google or GitHub identity for fast logins. The `state` parameter is designed as a CSRF token to prove that the person completing the OAuth flow is the same person who started it.

If an application omits or fails to validate the `state` parameter:
1. An attacker starts the OAuth link flow with their own social media account and captures the authorization code before it is redeemed.
2. The attacker tricks a logged-in victim into clicking that callback URL.
3. The victim's application account becomes permanently bound to the *attacker's* social login identity, allowing the attacker to sign into the victim's account anytime!

<LabGroup ids="oauth-lab-oauth-forced-oauth-profile-linking" />

---

## Token Theft via Open Redirects and Proxy Pages

Even if the authorization server enforces strict `redirect_uri` validation, attackers look for secondary hops on the client website:
- **Chaining with Open Redirects:** If the registered callback page contains an open redirect parameter (e.g. `https://client.com/callback?next=https://attacker.com`), the OAuth code or fragment lands on the client site and is instantly forwarded to the attacker.
- **Proxy Pages & PostMessage Leaks:** If a website loads an external widget inside an iframe or uses `window.postMessage` without origin restrictions, the access token stored in the parent window can be harvested across origins.

<LabGroup ids="oauth-lab-oauth-stealing-oauth-access-tokens-via-an-open-redirect, oauth-lab-oauth-stealing-oauth-access-tokens-via-a-proxy-page" />

---

## Dynamic Client Registration and SSRF

The OpenID Connect standard includes an optional **Dynamic Client Registration** specification that allows third-party client apps to register themselves automatically by submitting JSON metadata to `/register`.

If this endpoint is left publicly accessible without proper authentication and URL sanitization:
- An attacker can register a malicious client application with custom redirect endpoints.
- If the server accepts URLs for client logos (`logo_uri`) or cryptographic keys (`jwks_uri`), the server may fetch these URLs internally—introducing a high-impact **Server-Side Request Forgery (<Term id="ssrf-loopback">SSRF</Term>)** vulnerability into internal infrastructure.

<LabGroup ids="oauth-lab-oauth-ssrf-via-openid-dynamic-client-registration" />

::: details ⚙️ Engine Variations: How Major Identity Providers Handle Callbacks
- **Google OAuth:** Enforces byte-for-byte exact matching on `redirect_uri`. Wildcards are strictly disallowed (with an exception for `http://localhost` on loopback development).
- **GitHub OAuth:** Matches based on subpath hierarchies; query parameters are ignored during comparison, which can interact unexpectedly with client routers.
- **Microsoft Azure AD / Entra:** Supports wildcard redirects for Single Page Applications (SPAs), making misconfiguration and tenant-wide token leakage a recurring risk.
- **Keycloak:** Supports regex patterns in `Valid Redirect URIs`; entering `https://app.com/*` allows path traversal attacks.
:::

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ Core Defensive Checklist:</strong> Always enforce exact, literal string matching for all redirect URIs on authorization servers. Always generate and validate a cryptographically secure, session-bound <code>state</code> parameter on every OAuth transaction to prevent login CSRF. Prefer the Authorization Code flow with PKCE over legacy Implicit flow, and never link third-party accounts without re-authenticating the current session.</p>
</div>

<TopicComplete topic-id="oauth-authentication" label="Mark OAuth complete" />
