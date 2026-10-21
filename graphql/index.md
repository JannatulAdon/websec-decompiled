---
title: GraphQL · Case File (Mental Model)
description: Introspection, hidden endpoints, field-level authorization, alias-based brute force, and CSRF over GraphQL explained like a detective investigation.
---

# GraphQL API Vulnerabilities · The Core Investigation

<p class="wd-section-lede">In a standard REST architecture, every resource lives at its own dedicated web address. GraphQL turns this inside out: a single endpoint accepts complex queries describing exactly what data the client wants back. While this flexibility makes frontends fast, it concentrates enormous power in the caller's hands—allowing visitors to map the entire database blueprint, batch thousands of operations in a single HTTP request, and query hidden fields where developers forgot to enforce authorization.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Custom Bento Box.</strong> In a traditional cafeteria (REST), you walk up to counter #1 for a sandwich, counter #2 for drinks, and counter #3 for dessert—each counter has its own cashier checking your receipt. In a luxury custom buffet (GraphQL), you hand a single customized order slip to one chef listing ten items you want assembled into a bento box. If the chef prepares whatever dish is written on the slip without re-checking your VIP badge for the caviar item, you get high-tier dishes for free.</p>
</div>

## Case File #1: Uncovering the Hidden Field

Let's trace what happens when you read a blog post on a GraphQL-powered website.

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>You click on a blog article. Rather than requesting a REST URL like <code>/api/posts/42</code>, your browser sends an HTTP <code>POST /graphql</code> request containing a structured JSON body: <code>{"query": "{ getPost(id: 42) { title content author { name } } }"}</code>.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>The GraphQL engine parses the query into a syntax tree, checks each requested property against its internal type schema, and executes individual resolver functions to fetch the <code>title</code>, <code>content</code>, and <code>author</code> fields from the database.</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = Standard Public Fields</span>
        <span><span class="wd-code-input">Gold</span> = Client-Selected Fields</span>
      </div>
      <span class="wd-code-dev">query { getPost(id: 42) { </span><span class="wd-code-input">title content author { name }</span><span class="wd-code-dev"> } }</span>
    </div>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>The developer only displayed the title and content in the UI, but the underlying database model also contains sensitive properties like <code>postPassword</code>, <code>draftStatus</code>, or <code>internalNotes</code>. Using a <Term id="graphql-introspection">schema introspection</Term> query, an investigator discovers that the <code>Post</code> type possesses a <code>postPassword</code> field. Requesting that field directly succeeds because the resolver had no field-level authorization check!</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Developers disable schema introspection in production environments and enforce field-level authorization at the data loader or ORM layer, ensuring that every requested property validates whether the current user is permitted to see it.</p>
  </div>
</div>

### Visual Comparison: Frontend Query vs. Direct API Query

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The developer assumed users would only ever run the queries embedded in the official React frontend, which only ask for <code>title</code>, <code>content</code>, and public author information.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>Because the GraphQL endpoint accepts any valid query tree, an investigator sent a direct HTTP request adding <code>postPassword</code> to the selection set, extracting private access credentials directly from the database.</p>
  </div>
</div>

### Color-Coded Breakdown: Expanding the Selection Tree

Notice how a client can request unexposed backend attributes in the same query:

<div class="wd-codesplit">
  <div class="wd-codesplit__legend">
    <span><span class="wd-code-dev">Blue</span> = Public Query Structure</span>
    <span><span class="wd-code-input">Gold</span> = Injected Private Field</span>
  </div>
  <span class="wd-code-dev">query { getPost(id: 42) { title, content, </span><span class="wd-code-input">postPassword, isDraft</span><span class="wd-code-dev"> } }</span>
</div>

---

## The 4-Stage Lifecycle of a GraphQL Query

When a GraphQL request reaches the application, it moves through four distinct phases:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>1. Endpoint Routing</strong>
    HTTP server delivers request to the GraphQL handler (typically at <code>/graphql</code>).
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>2. Schema Validation</strong>
    Engine parses the query AST and checks types. (Introspection reveals all types and queries!)
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>3. Field Resolution</strong>
    Engine invokes resolvers for each field in parallel. (Field-level authorization bugs trigger here!)
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>4. Response Packaging</strong>
    All field outputs are combined into a single matching JSON response structure.
  </div>
</div>

---

## The Detective's Investigation Playbook

### 1. Finding the Endpoint & Accidental Field Exposure

Because GraphQL is served over a single endpoint, the first step is discovering where it lives:

- **Common Paths:** Check `/graphql`, `/api/graphql`, `/v1/graphql`, and `/graphql/v1`.
- **Method Probing:** Sending a `GET /graphql` often presents an interactive explorer (like GraphiQL or Apollo Studio) or a helpful error message. Sending a minimal `POST /graphql` with `{"query": "{__typename}"}` returns `{"data":{"__typename":"Query"}}`.
- **Field Suggestions:** Even when introspection is disabled, many GraphQL engines provide field suggestions in error responses. If you submit `{ post { pass } }`, the engine may reply: *"Cannot query field 'pass' on type 'Post'. Did you mean 'postPassword'?"*

<LabGroup ids="graphql-lab-graphql-find-the-endpoint, graphql-lab-graphql-accidental-field-exposure" />

---

### 2. Schema Introspection & Private Field Discovery

GraphQL features a built-in querying mechanism called <Term id="graphql-introspection">introspection</Term> that allows clients to query the server for its complete schema documentation. By querying the `__schema` meta-field, you receive a full inventory of every type, query, mutation, and argument supported by the API.

<LabGroup ids="graphql-lab-graphql-reading-private-posts" />

::: details 🔬 Under the Hood: Why Field-Level Checks Are Often Forgotten
In REST, an endpoint like `GET /api/posts/42/password` would have a dedicated route handler where a developer naturally writes:
```javascript
if (req.user.id !== post.authorId) return res.status(403).send("Forbidden");
```
In GraphQL, the parent `post` resolver fetches the whole database row, and child resolvers simply return their property from that row (`post.postPassword`). If the developer only checked permissions on the parent query, any client that knows the field name can read the private value.

The correct architectural fix is **data-layer authorization**: using DataLoader or ORM interceptors so that the check runs whenever the sensitive field is accessed, no matter which query path requested it.
:::

---

### 3. Alias-Based Brute Force (Bypassing Rate Limits)

Traditional web applications enforce rate limiting by counting incoming HTTP requests (e.g., maximum 5 login attempts per minute per IP). In GraphQL, **aliases** allow a client to request multiple operations inside a single HTTP request:

```graphql
query {
  attempt1: login(username: "carlos", password: "password1") { token }
  attempt2: login(username: "carlos", password: "password2") { token }
  attempt3: login(username: "carlos", password: "password3") { token }
}
```

The reverse proxy and web application firewall only see **one** HTTP POST request, but the GraphQL server's resolver processes dozens of login operations in parallel!

<LabGroup ids="graphql-lab-graphql-brute-force-protection-bypass" />

---

### 4. CSRF over GraphQL

Many GraphQL endpoints are configured to accept not only `application/json`, but also `application/x-www-form-urlencoded` or even HTTP `GET` requests for convenience.

If the application relies on cookie-based session authentication and does not require an anti-CSRF token or a strict custom request header, an attacker can host a standard HTML form that posts a GraphQL mutation from the victim's browser:

```html
<form action="https://victim-site.com/graphql" method="POST">
  <input type="hidden" name="query" value="mutation { changeEmail(email: &quot;attacker@evil.com&quot;) { status } }" />
</form>
```

When the victim visits the attacker's page, the browser automatically submits the mutation with the victim's session cookies.

<LabGroup ids="graphql-lab-graphql-csrf-via-graphql-api" />

::: details ⚙️ Engine Variations: Default Security Behaviors
- **Apollo Server:** Introspection is enabled by default in development mode. In production, Apollo requires explicitly disabling introspection and configuring `csrfPrevention: true`.
- **GraphQL Yoga:** Supports GET requests for queries by default; mutations should be restricted to POST.
- **Hasura:** Offers fine-grained role-based permissions at the table and column level, but default public roles can accidentally expose internal tables.
- **Ruby `graphql-ruby`:** Authorisation is opt-in per field using `visible?` and `authorized?` methods.
:::

---

## The Detective's GraphQL Investigation Routine

When assessing a GraphQL API:

1. **Locate the Gateway:** Probe common endpoints (`/graphql`, `/api/graphql`) with `{__typename}` to confirm the service.
2. **Run Full Introspection:** Execute an `__schema` query to retrieve the entire catalog of types, fields, and mutations.
3. **Analyze Error Messages:** If introspection is turned off, deliberately query misspelled fields to observe whether the engine suggests real hidden field names.
4. **Audit Field Authorisation:** Look for sensitive fields (e.g., `role`, `isAdmin`, `resetToken`, `password`) on public types and attempt to query them directly.
5. **Test Query Multiplexing:** Use aliases to test whether backend rate limits apply per HTTP request or per GraphQL operation.
6. **Check Content-Type Rigidity:** Verify whether mutations can be executed via `GET` requests or URL-encoded `POST` forms without custom headers.

---

## How Developers Lock It Down Permanently

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ The Golden Rules of Secure GraphQL Design:</strong></p>
<ul>
  <li><strong>Disable Introspection in Production:</strong> Ensure <code>introspection: false</code> is set in production configs to avoid leaking unpublished APIs.</li>
  <li><strong>Enforce Field-Level Authorisation:</strong> Verify user permissions at the field resolver or data-loader level rather than relying solely on query-level access controls.</li>
  <li><strong>Implement Query Complexity &amp; Depth Limits:</strong> Reject queries that exceed a defined depth or cost threshold to protect against denial of service and alias-based brute force attacks.</li>
  <li><strong>Enforce Operation-Level Rate Limiting:</strong> Track and rate-limit individual mutation and query executions, not merely raw HTTP requests.</li>
  <li><strong>Require Strict Content-Type and Anti-CSRF Tokens:</strong> Only accept <code>application/json</code> with a custom header (e.g., <code>X-Requested-With</code> or an anti-CSRF token) for all mutations.</li>
</ul>
</div>

<TopicComplete topic-id="graphql-api-vulnerabilities" label="Mark GraphQL complete" />
