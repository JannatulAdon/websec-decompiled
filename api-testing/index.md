---
title: API Testing · Case File (Mental Model)
description: Endpoint discovery, mass assignment, unused methods, and server-side parameter pollution explained like a detective investigation.
---

# API Testing · The Core Investigation

<p class="wd-section-lede">Modern web applications are divided into two distinct halves: a sleek frontend user interface and a busy backstage API. Vulnerabilities emerge because backend APIs often trust incoming requests far more than the frontend does—accepting administrative fields, unadvertised HTTP methods, and parameter tricks that no browser button ever triggers.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Restaurant Kitchen Hatch.</strong> The dining room menu only lists soup and salad, and the waiter won't let you order a prime ribeye. But if you walk straight up to the kitchen service hatch and hand the cook an order ticket marked <em>"1x Prime Ribeye, Price: $0.00"</em>, a busy kitchen following automated recipes might prepare and serve it without question. An API is that kitchen hatch: if it doesn't verify authorization independently of the dining room menu, visitors can order whatever the backend knows how to cook.</p>
</div>

## Case File #1: The Unchecked Profile Update

Let's trace what happens when you update your email address in an account settings portal.

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>You type a new email into the profile form and click "Save". Your browser sends an HTTP <code>PATCH /api/users/1337</code> request carrying a simple JSON body: <code>{"email": "detective@example.com"}</code>.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>The backend API framework parses the incoming JSON string and automatically binds its keys directly into the server's internal <code>User</code> database entity using framework auto-binding (such as Spring's model mapper or Node's <code>Object.assign</code>).</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = Server Model Fields</span>
        <span><span class="wd-code-input">Gold</span> = Client JSON Payload</span>
      </div>
      <span class="wd-code-dev">User.update({</span><span class="wd-code-input">"email": "detective@example.com"</span><span class="wd-code-dev">})</span>
    </div>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>The frontend HTML form only offered an email input, but the backend <code>User</code> model also possesses attributes like <code>role</code>, <code>isAdmin</code>, and <code>tier</code>. Because the API binds whatever JSON keys are supplied without an allow-list, adding <code>"role": "administrator"</code> to the raw request quietly elevates the user's account privileges—a classic <Term id="mass-assignment">mass assignment</Term> flaw.</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Developers define explicit Data Transfer Objects (DTOs) with strict allow-lists for each endpoint. Instead of binding raw input to the database model, the server only reads explicitly permitted fields and discards or rejects all extraneous properties.</p>
  </div>
</div>

### Visual Comparison: Frontend Form vs. Raw API Binding

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The developer assumed that because the web page form only presents inputs for <code>email</code> and <code>username</code>, the API endpoint would only ever receive those two properties from clients.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>An investigator used an intercepting proxy to add <code>"roleid": 2</code> to the JSON object. The server's ORM mapped every matching property directly to the database row, upgrading the account without verification.</p>
  </div>
</div>

### Color-Coded Breakdown: Injecting Extra Properties

Here is how an auto-binding API parses an expanded JSON request payload:

<div class="wd-codesplit">
  <div class="wd-codesplit__legend">
    <span><span class="wd-code-dev">Blue</span> = Standard User Input</span>
    <span><span class="wd-code-input">Gold</span> = Injected Administrative Property</span>
    <span><span class="wd-code-dead">Gray</span> = Unaltered Server Defaults</span>
  </div>
  <span class="wd-code-dev">{"username": "carlos", "email": "carlos@example.com", </span><span class="wd-code-input">"role": "admin"</span><span class="wd-code-dev">}</span>
</div>

---

## The 4-Stage Lifecycle of an API Request

Understanding how an API processes requests helps pinpoint where authorization and parameter assumptions fail:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>1. Route Discovery</strong>
    Investigator locates endpoints via Swagger docs, JS bundles, or route fuzzing.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>2. Method Dispatch</strong>
    Router checks the HTTP verb (GET, POST, PUT, DELETE, PATCH, OPTIONS).
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>3. Parameter Binding</strong>
    Framework deserializes JSON body or URL parameters into model objects. (Mass assignment &amp; pollution happen here!)
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>4. Service Execution</strong>
    App applies business logic and queries database or internal microservices.
  </div>
</div>

---

## The Detective's Investigation Playbook

### 1. Endpoint Discovery & Hidden Blueprints

APIs rarely hide their documentation completely. Developers often leave interactive documentation frameworks active in production or embed API endpoints inside compiled JavaScript bundles:

- **Standard Documentation Paths:** Check for `/api`, `/api/docs`, `/swagger`, `/swagger.json`, `/swagger-ui.html`, `/openapi.json`, and `/api/v1/`.
- **HTTP Method Probing:** If `GET /api/products/1` returns a product, test sending `OPTIONS /api/products/1` to see allowed verbs (`GET, POST, PUT, DELETE`), or try `DELETE /api/products/1`.
- **Client-Side Source Bundles:** Search downloaded JavaScript files for API path patterns like `"/api/"`, `"baseURL"`, and parameter names.

<LabGroup ids="api-testing-lab-exploiting-api-endpoint-using-documentation, api-testing-lab-exploiting-unused-api-endpoint" />

---

### 2. Mass Assignment (Auto-Binding)

In modern web frameworks, model-binding utilities make life easy for developers by automatically mapping request parameters directly onto internal database models. When an application accepts a user submission without an explicit allow-list, any internal property of the object can be overwritten.

<LabGroup ids="api-testing-lab-exploiting-mass-assignment-vulnerability" />

::: details 🔬 Under the Hood: Why Frameworks Auto-Bind by Default
Different application frameworks implement auto-binding through reflection:

- **Spring (Java):** `@ModelAttribute` and Jackson object mapper inspect setter methods and invoke any setter that matches an incoming JSON field.
- **Ruby on Rails:** Calling `User.new(params[:user])` without using `params.require(:user).permit(...)` ("strong parameters") binds every submitted key.
- **Django REST Framework (Python):** Serializers configured with `fields = "__all__"` expose all model fields for update unless explicitly set to `read_only_fields`.
- **Node.js / Express:** Code using `Object.assign(user, req.body)` or `user.set(req.body)` copies every property into the user model.

The secure architectural pattern is **Input Allow-Listing**: use dedicated request DTOs that only contain fields meant to be modified by the current caller.
:::

---

### 3. Server-Side Parameter Pollution (SSPP)

When a front-facing web server receives a request and constructs a second, internal request to a backend microservice, delimiters in user input can change how the backend interprets the message:

```text
Front-end request:   GET /user/lookup?username=carlos
Internal backend call: GET http://internal-service/user?username=carlos&role=standard
                                                                 ▲
User input injected here ────────────────────────────────────────┘
```

If the user submits `username=carlos%26role%3Dadmin`, the internal URL becomes:
`http://internal-service/user?username=carlos&role=admin&role=standard`

Depending on which parameter the internal server prioritizes, the injected administrative role can override the server's default!

<LabGroup ids="api-testing-lab-exploiting-server-side-parameter-pollution-in-query-string, api-testing-lab-exploiting-server-side-parameter-pollution-in-rest-url" />

::: details ⚙️ Engine Variations: How Parsers Handle Duplicate Parameters
When a query string contains duplicate parameters (e.g., `?role=user&role=admin`), different backend technologies choose different values:

| Framework / Engine | Duplicate Parameter Behavior | Example: `?user=alice&user=bob` |
| --- | --- | --- |
| **PHP / Apache** | Uses the **last** occurrence | Value is `"bob"` |
| **Node.js / Express (`qs`)** | Creates an **array** | Value is `["alice", "bob"]` |
| **ASP.NET** | Joins with **comma** | Value is `"alice,bob"` |
| **Go (`net/url`)** | `URL.Query().Get()` takes the **first** | Value is `"alice"` |
| **Python (`Flask`/`urllib`)** | `request.args.get()` takes the **first** | Value is `"alice"` |

Parameter pollution exploits the disagreement between what a frontend security check validates (e.g., the first parameter) and what the backend execution engine consumes (e.g., the last parameter).
:::

---

## The Detective's API Testing Routine

When auditing an unfamiliar API surface:

1. **Map the Surface:** Review API documentation files (`/swagger`, `/openapi.json`) and extract API route strings from client-side `.js` bundles.
2. **Probe HTTP Verbs:** Try alternate HTTP verbs (`PUT`, `DELETE`, `PATCH`, `OPTIONS`) on read-only endpoints.
3. **Inspect Payloads for Auto-Binding:** On `POST` and `PATCH` requests, inspect the response body. If the response displays fields not present in the request (e.g., `role`, `status`, `balance`), add those properties to your submission.
4. **Test Parameter Pollution:** Insert URL-encoded delimiters (`%26`, `%23`, `%3F`, `../`) into query parameters and REST path segments to determine if internal requests can be reshaped.
5. **Vary Content-Type:** Change `application/x-www-form-urlencoded` to `application/json` or `application/xml` to test whether alternate backend parsers are exposed.

---

## How Developers Lock It Down Permanently

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ The Golden Rules of Secure API Design:</strong></p>
<ul>
  <li><strong>Use Strict Request DTOs:</strong> Never bind incoming request bodies directly into database models. Use explicit Data Transfer Objects that only declare fields the caller is authorized to modify.</li>
  <li><strong>Disable Unused HTTP Verbs:</strong> Explicitly configure routers to reject unneeded methods with <code>405 Method Not Allowed</code> rather than leaving default CRUD handlers open.</li>
  <li><strong>Build Safe Internal URLs:</strong> Never concatenate user input into internal API URLs using strings. Use URL builder libraries that automatically encode parameters properly.</li>
  <li><strong>Protect API Documentation:</strong> Restrict interactive API consoles (Swagger UI, GraphiQL) in production to authenticated internal networks.</li>
  <li><strong>Validate Schema Rigorously:</strong> Reject any request carrying unknown properties with <code>400 Bad Request</code> rather than silently dropping or passing them.</li>
</ul>
</div>

<TopicComplete topic-id="api-testing" label="Mark API testing complete" />
