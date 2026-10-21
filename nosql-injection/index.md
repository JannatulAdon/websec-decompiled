---
title: NoSQL Injection · Case File 14 (Document Stores & MongoDB)
description: Follow user input as it travels into JSON document queries, see how operators like $ne and $regex bypass authentication, and learn how to secure modern databases.
---

# NoSQL Injection · The Document Query Investigation

<p class="wd-section-lede">Many developers assume that switching from SQL to NoSQL automatically cures injection bugs. In reality, NoSQL databases don't eliminate injection—they just change the grammar. Instead of injecting SQL keywords through broken single quotes, an attacker passes structured JSON objects carrying special database operators that rewrite the query rules from the inside out.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The ID Card vs. The Rulebook.</strong> Imagine walking into an exclusive club where a security guard checks names at the door. Normally, you hand the guard an ID card with your name printed as text: <code>"Alice"</code>. If the name is on the guest list, the guard unlocks the door. But suppose instead of an ID card with text, you hand the guard an official laminated rule card from the club manager that says: <em>"Admit any visitor whose name is NOT empty."</em> If the guard blindly treats the rule card as your ID, the guest list check is bypassed instantly. In NoSQL injection, query operators like <code>$ne</code> act like that laminated rule card.</p>
</div>

---

## Case File #14: Following a Document Query Behind the Scenes

Let's trace what happens when you attempt to log in to an application powered by Node.js, Express, and MongoDB.

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>You fill out a login form with a username and password. When you click <strong>Log In</strong>, your browser packages your credentials into a JSON payload and sends a <code>POST /login</code> request:</p>
    <div class="language-json"><pre><code>{"username": "admin", "password": "password123"}</code></pre></div>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>The Express backend uses a JSON body parser to convert that payload directly into a JavaScript object. It then passes those fields straight into a MongoDB collection search query without validating what type of data arrived:</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = Backend Query Filter</span>
        <span><span class="wd-code-input">Gold</span> = Values From Your Request</span>
      </div>
      <span class="wd-code-dev">db.users.findOne({ "username": </span><span class="wd-code-input">"admin"</span><span class="wd-code-dev">, "password": </span><span class="wd-code-input">"password123"</span><span class="wd-code-dev"> })</span>
    </div>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>Because the application trusts the JSON structure sent by the client, an attacker doesn't send a plain text string for the password. Instead, they send a nested JSON object containing a <Term id="nosql-operator">NoSQL query operator</Term>: <code>{"$ne": ""}</code>. MongoDB interprets keys starting with <code>$</code> as query commands rather than literal passwords. The query now matches any user whose password is <em>not equal to an empty string</em>, immediately returning the administrator account!</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Developers enforce strict data types. Before passing input into any database call, they verify that <code>typeof req.body.password === 'string'</code> or use schema validation libraries like Zod or Mongoose schemas. If an attacker submits an object instead of a string, the validator rejects the request before it ever reaches the database.</p>
  </div>
</div>

### Visual Comparison: Plain Text vs. Query Operator

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The developer assumed <code>req.body.password</code> would always be a string like <code>"MyP@ssw0rd!"</code>. MongoDB would perform an exact literal string comparison against the stored user credential.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>The client submitted an object <code>{"$ne": null}</code>. MongoDB's query engine parsed <code>$ne</code> as the built-in "Not-Equal" operator. Since every existing account has a password that isn't null, the condition evaluated to true for the first user found.</p>
  </div>
</div>

### Watch the Query Transform Color by Color

Observe how changing the data type of the input transforms a simple search parameter into an active logical condition:

<div class="wd-codesplit">
  <div class="wd-codesplit__legend">
    <span><span class="wd-code-dev">Blue</span> = Application Query Skeleton</span>
    <span><span class="wd-code-input">Gold</span> = Injected Operator Object</span>
  </div>
  <span class="wd-code-dev">db.users.findOne({ "username": "admin", "password": </span><span class="wd-code-input">{ "$ne": "" }</span><span class="wd-code-dev"> })</span>
</div>

::: details 🔬 Under the Hood: String vs. Object Types in MongoDB
Unlike SQL, where queries are represented as plain text strings that get parsed and tokenized, MongoDB queries are structured documents (BSON/JSON objects). 

When a Node.js server does:
```javascript
db.collection('users').findOne({
  username: req.body.username,
  password: req.body.password
});
```
If `req.body.password` is a string `"secret"`, MongoDB tests for equality: `{ password: "secret" }`.
If `req.body.password` is `{ "$ne": "" }`, MongoDB sees an operator expression and evaluates the condition.

Furthermore, Express's `body-parser` with `extended: true` parses URL-encoded form data into nested objects! Sending `password[$ne]=` in a standard HTML form produces `{ password: { "$ne": "" } }` on the server even when the API doesn't accept JSON.
:::

---

## The 4-Stage Journey of a Document Query

Understanding how user input travels through a modern JavaScript stack helps you spot where the type confusion occurs:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>1. HTTP Request Body</strong>
    Browser transmits JSON or URL-encoded bracket syntax (e.g., <code>user[$ne]=x</code>).
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>2. Untyped Deserialization</strong>
    Middleware parses input into a rich JS Object without validating scalar types.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>3. Driver Operator Recognition</strong>
    MongoDB driver maps keys starting with <code>$</code> to internal query operators.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>4. Document Match &amp; Session</strong>
    Database matches the record and the application issues an authenticated session.
  </div>
</div>

---

## Essential NoSQL Operators: The Detective's Cheat Sheet

When probing a NoSQL endpoint, you aren't looking for syntax errors caused by broken quotes. Instead, you're observing whether the server treats operator objects as live instructions:

| Operator | Plain-English Meaning | Investigation Role |
| --- | --- | --- |
| `$ne` | "Not equal to" | Bypasses exact-value checks by asserting the field is not null or not empty. |
| `$gt` / `$gte` | "Greater than" / "Greater than or equal" | Can be tested against empty strings (<code>{"$gt": ""}</code>) to match any string. |
| `$in` / `$nin` | "Value matches any in list" | Tests multiple possibilities at once without running multiple queries. |
| `$regex` | "Matches regular expression pattern" | Allows blind character-by-character brute forcing like a combination lock. |
| `$where` | "Execute arbitrary JavaScript code" | Evaluates server-side JavaScript expressions per document. |

---

## Phase 1: Probing for Operator Injection & Auth Bypass

When auditing a login endpoint or API search filter, the first goal is to determine if the backend accepts structured objects in place of strings.

1. **Convert the content type:** If the app submits `application/x-www-form-urlencoded`, try converting the request to `application/json` or using bracket syntax like `username[$ne]=dummy&password[$ne]=dummy`.
2. **Observe the reaction:** If supplying an object causes a server error, returns different records, or logs you in as the first user in the collection, the parameter is passed directly into a query filter without type checking.

<LabGroup ids="nosql-injection-lab-nosql-injection-detection, nosql-injection-lab-nosql-injection-bypass-authentication" />

---

## Phase 2: Extracting Hidden Data (The Combination Lock)

What if the application only gives you a binary answer—such as "Login Successful" versus "Invalid Credentials"—and you need to find an unknown password or secret token?

You can treat the `$regex` operator like a digital combination lock. By anchoring your regular expression to the beginning of the string with `^`, you can guess the secret character by character:

```json
{"username": "admin", "password": {"$regex": "^a"}}
{"username": "admin", "password": {"$regex": "^b"}}
{"username": "admin", "password": {"$regex": "^c"}}
...
{"username": "admin", "password": {"$regex": "^s"}}  <-- Success! First letter is 's'
{"username": "admin", "password": {"$regex": "^sa"}}
```

Every time the server accepts the guess and logs you in, you have confirmed another character of the secret password.

<LabGroup ids="nosql-injection-lab-nosql-injection-extract-data" />

---

## Phase 3: Uncovering Unknown Fields with `$where`

In some databases, you might not even know what the secret field is named. Is it `password`? `resetToken`? `api_key`? `secretToken`?

In MongoDB, the `$where` operator allows developers to write arbitrary JavaScript code that executes directly on the database engine for each document evaluated:

```javascript
// Server-side query using $where
db.users.find({ $where: "this.username == '" + req.body.username + "'" });
```

When input is concatenated into a `$where` string, you can introduce your own JavaScript conditions. By using conditional statements, timing delays, or deliberate errors, you can enumerate field names across the database:

```javascript
// Probing if a property exists using JavaScript reflection:
admin' && Object.keys(this)[0].match('^a.*') && '1'=='1
```

<LabGroup ids="nosql-injection-lab-nosql-injection-extract-unknown-fields" />

::: details ⚙️ Engine Variations: NoSQL Across the Industry
Not all NoSQL databases use MongoDB's syntax. Here is how injection manifests across other document and key-value stores:

- **MongoDB:** BSON document operator injection (`$ne`, `$regex`), server-side JavaScript via `$where`, and aggregation pipeline injection (`$lookup`).
- **CouchDB:** REST-based JSON queries. Unsanitized input can manipulate `_all_docs`, `startkey`, and `endkey` range filters.
- **Redis:** Redis commands sent over raw sockets or through APIs. Passing unsanitized input can inject multi-line Redis commands or trigger `EVAL` Lua script execution.
- **Elasticsearch:** Query DSL injection. Submitting unexpected JSON structures into `_search` can expose internal indices or trigger costly script queries.
:::

---

## Defensive Blueprint: How to Lock Down Document Databases

Preventing NoSQL injection requires building defenses that cannot be tricked by unexpected data types:

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ The 4 Golden Rules of NoSQL Defense:</strong></p>
<ol>
  <li><strong>Enforce strict type checking:</strong> Verify that incoming parameters are strictly primitive strings before using them in database queries (e.g., <code>if (typeof req.body.password !== 'string') throw new Error('Invalid input');</code>).</li>
  <li><strong>Use schema validation:</strong> Employ schema libraries like <strong>Mongoose</strong> with strict type casting, or validation engines like <strong>Zod</strong>, <strong>Joi</strong>, or <strong>JSON Schema</strong>.</li>
  <li><strong>Disable JavaScript execution:</strong> Turn off <code>javascriptEnabled: false</code> in MongoDB configuration to neutralize <code>$where</code> and <code>mapReduce</code> script execution.</li>
  <li><strong>Never pass <code>req.body</code> directly:</strong> Explicitly pick only the exact fields you need rather than passing raw request objects into database find operations.</li>
</ol>
</div>

<TopicComplete topic-id="nosql-injection" label="Mark NoSQL injection complete" />
