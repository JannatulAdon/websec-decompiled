---
title: Access Control · Case File 05
description: Explore vertical privilege escalation, horizontal data leakage (IDOR), missing function-level checks, and header-based authorization bypasses.
---

# Access Control · The Missing Authorization Guard

<p class="wd-section-lede">If authentication verifies <em>who you are</em>, access control dictates <em>what you are allowed to do</em>. The most severe security breaches happen when authorization decisions are delegated to the user's browser, hidden behind obscure URLs, or checked on step one of a workflow but forgotten on step two.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Hotel Keycard.</strong> When you check into a hotel, you show your ID and receive a plastic room keycard. That's authentication: the front desk verified your identity. But what if your keycard can unlock room 302, room 405, the executive penthouse, and the manager's safe behind the counter simply because the door locks never verify <em>which</em> room was assigned to you? That is an access control failure: you are authenticated, but the doors fail to check your permissions.</p>
</div>

## Case File #5: Tracing an IDOR Behind the Scenes

Let's examine what happens when an authenticated user attempts to view their private account profile:

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>You log in as user <code>wiener</code> and click "My Account". The browser navigates to <code>/my-account?id=wiener</code> and displays your profile, private API key, and billing details. You change the URL to <code>/my-account?id=carlos</code>.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>The backend verifies that your browser has a valid session cookie. Once satisfied that you are logged in, it pulls the <code>id</code> parameter straight out of the URL query string and runs a database lookup:</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = Server-Side Session User</span>
        <span><span class="wd-code-input">Gold</span> = Untrusted URL Parameter</span>
      </div>
      <span class="wd-code-dev">session.user = "wiener"; &nbsp;// Authenticated principal<br>target_id = </span><span class="wd-code-input">request.query.id</span><span class="wd-code-dev">; // "carlos" from URL<br>return db.find_user(target_id); // Returns Carlos's private records!</span>
    </div>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>The application confused <strong>authentication</strong> with <strong>authorization</strong>. It checked that a user was logged in, but never checked if the authenticated user (<code>wiener</code>) owns the object being requested (<code>carlos</code>). This is an Insecure Direct Object Reference (<Term id="idor">IDOR</Term>).</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Never rely on client-supplied parameters to determine identity or ownership. Fetch records using the user ID stored securely inside the server-side session object: <code>db.find_user(session.user_id)</code>. If looking up shared resources, enforce an explicit ownership check before returning data.</p>
  </div>
</div>

### Visual Comparison: UI Hiding vs. Server Enforcement

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>Since the navigation bar only displays links to Carlos's own account and hides the "Admin Panel" button from normal users, regular visitors will never access unauthorized areas.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>Hiding a button in HTML is not security. Anyone can type <code>/admin</code> directly into the browser or change the URL parameter to inspect and manipulate other people's data.</p>
  </div>
</div>

### The Authorisation Decision Tree

Every time a user asks to view or change data, the request must successfully traverse all four authorization checkpoints:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>1. Authenticated User</strong>
    Validate session token to identify who is asking.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>2. Role / Policy Guard</strong>
    Check if user role permits this action (Vertical check).
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>3. Object Ownership</strong>
    Check if target record belongs to this user (Horizontal check).
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>4. Action Executed</strong>
    Database reads or modifies data safely.
  </div>
</div>

---

## Vertical vs. Horizontal Privilege Escalation

Access control failures fall into three primary categories:

| Dimension | Core Question | Real-World Scenario |
| --- | --- | --- |
| **Vertical Escalation** | Can a standard user perform administrator actions? | Visiting `/admin/deleteUser` as a regular customer |
| **Horizontal Escalation (IDOR)** | Can User A view or tamper with User B's resources? | Changing `/invoice?id=1024` to `/invoice?id=1025` |
| **Context-Dependent** | Can a user skip a prerequisite step in a workflow? | Jumping directly to Step 3 (Order Confirmation) before Step 2 (Payment) |

---

## Unprotected Functionality

The simplest form of access control failure occurs when privileged administrative endpoints exist at predictable paths (like `/admin`, `/administrator`, or `/admin-panel`) without any server-side role verification. Developers sometimes rely on "security through obscurity" by creating unpredictable URLs (like `/admin-q8z9`), but these URLs are routinely exposed in `robots.txt`, sitemaps, or client-side JavaScript bundles.

<LabGroup ids="access-control-lab-unprotected-admin-functionality, access-control-lab-unprotected-admin-functionality-with-unpredictable-url" />

---

## Role and Identity Taken from the Request (IDOR)

When an application decides what permissions you have based on values the browser submits, you own the decision:
- **Role Parameter Tampering:** Storing the user's role in a cookie (`role=user`), a hidden form field, or a JSON body (`{"roleid": 1}`) lets an investigator change their role to `admin`.
- **Insecure Direct Object References (<Term id="idor">IDOR</Term>):** The application accepts user IDs directly from parameters (`?id=123`) without comparing them against the authenticated session principal.
- **Data Leaks in Redirects:** Even when the server issues a `302 Found` redirecting unauthorized users away from a page, it may accidentally include sensitive user data inside the response body before the redirect executes!

<LabGroup ids="access-control-lab-user-role-controlled-by-request-parameter, access-control-lab-user-role-can-be-modified-in-user-profile, access-control-lab-user-id-controlled-by-request-parameter, access-control-lab-user-id-controlled-by-request-parameter-with-unpredictable-user-ids, access-control-lab-user-id-controlled-by-request-parameter-with-data-leakage-in-redirect, access-control-lab-user-id-controlled-by-request-parameter-with-password-disclosure, access-control-lab-insecure-direct-object-references" />

::: details 🔬 Under the Hood: Where the Authorization Check Actually Lives
In modern web architectures, authorization can be enforced at multiple layers:
1. **Routing Middleware:** Rules like `@require_role('admin')` protect entire URL path prefixes. If a route alias or legacy path misses the rule, the endpoint is wide open.
2. **Controller Logic:** Checks placed manually inside individual controller functions. When multiple controllers or endpoints access the same database model, developers frequently forget the check in one place.
3. **Data Access Layer:** Enforcing ownership directly in database queries:
   ```sql
   -- Vulnerable: trusts parameter without session binding
   SELECT * FROM documents WHERE doc_id = :param_id;

   -- Secure: strictly scopes lookup to authenticated user
   SELECT * FROM documents WHERE doc_id = :param_id AND owner_id = :session_user_id;
   ```
Enforcing authorization at the data query level guarantees that even if a controller has a bug, users can never access records they do not own.
:::

---

## Path, Method, and Header Authorization Bypasses

In complex web architectures with front-end reverse proxies (like Nginx, Apache, or AWS ALB) standing in front of backend application servers, access control can break down due to parser discrepancies:
- **URL-Based Bypasses via Custom Headers:** Front-end proxies may restrict `/admin`, but back-end frameworks may honor headers like `X-Original-URL: /admin` or `X-Rewrite-URL: /admin`, allowing requests to `/` to route to `/admin` internally.
- **Method-Based Circumvention:** An authorization filter might block `POST /admin/upgrade-user`, but the backend framework handles `GET` or `PUT` on the same route without triggering the filter.
- **Referer-Based Access Control:** An endpoint trusts the `Referer` header to confirm a user arrived from the admin dashboard. Because the client controls HTTP headers, setting `Referer: https://target.com/admin` tricks the check.
- **Multi-Step Workflows:** In multi-step wizards (e.g., Step 1: Confirm Action → Step 2: Apply Changes), the application checks permissions on Step 1, but completely forgets to re-verify permissions on Step 2.

<LabGroup ids="access-control-lab-url-based-access-control-can-be-circumvented, access-control-lab-method-based-access-control-can-be-circumvented, access-control-lab-multi-step-process-with-no-access-control-on-one-step, access-control-lab-referer-based-access-control" />

::: details ⚙️ Engine Variations: Proxy and Framework Discrepancies
- **Spring Security:** Depending on whether `antMatcher` or `mvcMatcher` is used, requests with matrix parameters (like `/admin;foo/`) or trailing slashes may bypass the proxy rule while reaching the Spring controller.
- **Tomcat:** Path parameters like `;jsessionid=...` are stripped by Tomcat's internal servlet engine, leading to mismatches when upstream reverse proxies route based on raw URI strings.
- **Nginx vs. Apache:** Differences in how duplicate slashes (`//admin`), dot-segments (`/public/../admin`), and case normalization (`/ADMIN`) are handled can lead to proxy-bypass vulnerabilities.
:::

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ Core Defensive Checklist:</strong> Deny access by default. Derive user identity exclusively from cryptographically verified server-side sessions, never from request parameters. Enforce object-level authorization on every database read and write. Guard all HTTP methods equally, and ensure reverse proxies and backend application servers normalize URLs identically.</p>
</div>

<TopicComplete topic-id="access-control-vulnerabilities" label="Mark access control complete" />
