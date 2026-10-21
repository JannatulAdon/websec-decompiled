---
title: Authentication · Case File 04
description: Unravel username enumeration oracles, brute-force bypasses, broken 2FA state machines, and password reset flaws.
---

# Authentication · Broken Gatekeepers & State Machines

<p class="wd-section-lede">Authentication is the checkpoint that establishes identity: it confirms who you are before handing you a session key. The vast majority of authentication bugs are not broken encryption algorithms; they are logic flaws in the state machine—places where the server leaks secret clues about which guess was right, or allows a client to skip straight to the finish line.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Nightclub Bouncer.</strong> Imagine standing in line outside an exclusive private club. You tell the bouncer your name is "Alice". The bouncer frowns and says: <em>"Alice? We don't have an Alice on our guest list."</em> Next, you tell him your name is "Bob". The bouncer's face lights up: <em>"Ah, Bob! Welcome back—now what's your secret password?"</em> By giving two different responses, the bouncer just handed you the entire private guest list. You now know with 100% certainty that Bob has an account, so you can focus all your password guesses on Bob.</p>
</div>

## Case File #4: Tracing the Login Oracle Behind the Scenes

Let's examine what happens inside the server during a failed login attempt:

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>You test a login form by submitting <code>username=nonexistent_user</code> and a random password. The page responds with <code>Invalid username</code>. When you try <code>username=administrator</code> with a wrong password, the page responds with <code>Incorrect password</code>.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>The server receives the POST request and queries the database for the username. When the user doesn't exist, it aborts immediately. When the user does exist, it spends heavy CPU cycles running an expensive password hash check (like bcrypt or Argon2):</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = Server Authentication Logic</span>
        <span><span class="wd-code-input">Gold</span> = Leaked Signal Oracle</span>
      </div>
      <span class="wd-code-dev">user = db.find(username);<br>if (!user) return </span><span class="wd-code-input">"Invalid username"</span><span class="wd-code-dev">; // Returns in 5ms<br>if (!bcrypt.compare(password, user.hash)) return </span><span class="wd-code-input">"Incorrect password"</span><span class="wd-code-dev">; // Returns in 150ms</span>
    </div>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>The application acts as an <Term id="username-enumeration">enumeration oracle</Term>. Even if the error text is identical, the massive timing difference between a missing user (5ms) and a valid user undergoing key-derivation hashing (150ms) confirms valid usernames to any patient observer.</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Return a uniform, identical error message: <em>"Invalid username or password"</em>. To eliminate timing leaks, compute a dummy password hash even when the username does not exist so the server takes the exact same amount of time to respond in all cases.</p>
  </div>
</div>

### Visual Comparison: Helpful Clues vs. Constant-Time Defense

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>Telling the user whether their username or password was wrong is helpful customer service that helps users recover from simple typing mistakes.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>Attackers automate username checks across huge wordlists, harvesting a confirmed list of valid employee accounts before testing a single password.</p>
  </div>
</div>

### The Checkpoints of an Authentication Decision

Every login submission passes through four logical checkpoints before issuing a <Term id="session-cookie">session cookie</Term>:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>1. Identity Lookup</strong>
    Server checks database for matching account record.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>2. Oracle Branch</strong>
    Timing or message difference leaks if user exists.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>3. Rate Limiter</strong>
    Checks IP counter, account locks, or MFA requirement.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>4. Session Minting</strong>
    Signs cryptographic session cookie and redirects.
  </div>
</div>

---

## Username Enumeration: The Response as an Oracle

Before launching brute-force password guessing, an investigator determines which accounts exist. Applications frequently reveal valid usernames through subtle behavioral oracles:
- **Direct Error Differences:** "Invalid username" versus "Incorrect password".
- **Subtle Formatting Variations:** A missing period, extra trailing whitespace, or slightly different capitalization in the error template.
- **Response Timing:** Password hashing algorithms (bcrypt, Argon2, PBKDF2) are deliberately slow and computationally intensive (~100-200ms). When a user exists, the server hashes the guess; when the user does not exist, it aborts instantly (~5ms).
- **Account Lockout Behavior:** Valid accounts trigger lockouts or warning banners after consecutive failures; nonexistent accounts never lock.

<LabGroup ids="authentication-lab-username-enumeration-via-different-responses, authentication-lab-username-enumeration-via-subtly-different-responses, authentication-lab-username-enumeration-via-response-timing, authentication-lab-username-enumeration-via-account-lock" />

::: details 🔬 Under the Hood: Why Timing Reveals Valid Users
A vulnerable authentication function typically looks like this:
```python
def login(username, password):
    user = db.query(User).filter_by(username=username).first()
    if not user:
        return "Invalid credentials"  # Skips hashing: finishes in 4ms
    
    # Bcrypt with work factor 12: requires ~150ms of CPU hashing
    if not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
        return "Invalid credentials"
    
    return create_session(user)
```
Even with network jitter, sending 100 requests per candidate and calculating statistical medians cleanly isolates valid usernames from invalid ones.
:::

---

## Brute Force and Flawed Rate Limiting

Rate limiting is intended to slow down or block attackers trying thousands of credential combinations. However, rate limit implementations often rely on flawed assumptions:
- **IP Spoofing via Headers:** The rate limiter keys on headers like `X-Forwarded-For` or `X-Real-IP`. If the proxy blindly trusts client-supplied headers, rotating the header value resets the failure counter on every attempt.
- **Multiple Credentials Per Request:** The endpoint accepts JSON arrays of credentials (`[{"user": "admin", "pass": "123"}, ...]`) and validates all of them while counting only a single HTTP request toward the rate limit!
- **Asymmetric Account Locks:** Locking an account after three failed attempts without limiting the IP allows an attacker to lock out all employees simultaneously, causing a widespread Denial of Service.

<LabGroup ids="authentication-lab-broken-bruteforce-protection-ip-block, authentication-lab-broken-brute-force-protection-multiple-credentials-per-request" />

---

## Two-Factor Authentication (2FA) State Machine Flaws

Two-factor authentication is frequently bolted onto existing login systems as a secondary step rather than an integrated state machine. Common architectural breakdowns include:
- **Direct Step Skipping:** The server validates the password on Step 1 and immediately issues an active session cookie, merely redirecting the browser to `/login2`. Visiting `/my-account` directly bypasses the 2FA prompt completely.
- **Broken Logic & Parameter Trust:** The `/verify-2fa` endpoint accepts a parameter like `username=victim&code=1234` without verifying that the currently logged-in browser session belongs to that user.
- **Missing Attempt Limits:** A 4-digit code has only 10,000 possible combinations. Without strict rate limiting or expiration, it can be enumerated within minutes.

<LabGroup ids="authentication-lab-2fa-simple-bypass, authentication-lab-2fa-broken-logic, authentication-lab-2fa-bypass-using-a-brute-force-attack" />

::: details 🔬 Under the Hood: The Pending-Authentication State Machine
A secure 2FA flow requires a dedicated, restricted intermediate state:
1. When Step 1 succeeds, issue a temporary, non-privileged token with a `PENDING_2FA` scope.
2. Ensure this token has zero authorization to access user profiles, perform actions, or read data.
3. Only upon successful verification of the second factor should the server elevate the session to full authentication.
:::

---

## Remember-Me Cookies and Offline Cracking

"Stay logged in" cookies are often designed using predictable formulas like `base64(username + ":" + md5(password))`. 

If an application uses unsalted legacy hashes (like MD5 or SHA-1), an investigator who recovers a remember-me cookie can crack the hash offline against massive precomputed rainbow tables or dictionary wordlists—without triggering any rate limits or server alert logs.

<LabGroup ids="authentication-lab-brute-forcing-a-stay-logged-in-cookie, authentication-lab-offline-password-cracking" />

---

## Password Reset Flows and Token Poisoning

Password reset flows bypass standard credential checks entirely. Common flaws include:
- **Host Header Poisoning:** When building the password reset link emailed to the user, the server constructs the URL from the incoming `Host:` header (e.g., `https://` + `request.headers['Host']` + `/reset?token=...`). Modifying the `Host` header redirects the reset token straight to an attacker's server when the victim clicks their email!
- **Broken Token Logic:** The password submission endpoint accepts a blank token parameter or fails to invalidate tokens after use.
- **Missing Old-Password Verification:** The profile password-change form permits changing a password without requiring the existing current password, enabling full takeover from an open or hijacked session.

<LabGroup ids="authentication-lab-password-reset-broken-logic, authentication-lab-password-reset-poisoning-via-middleware, authentication-lab-password-brute-force-via-password-change" />

::: details ⚙️ Engine Variations: How Modern Frameworks Handle Reset Tokens
- **Django:** Cryptographically hashes the user's primary key, password hash, and last login timestamp into the token. Changing the password automatically invalidates all existing reset tokens instantly.
- **Rails:** Uses `has_secure_token` with cryptographically secure random bytes; tokens are stored hashed at rest in the database.
- **Node.js / Express:** Often relies on custom implementation logic; bugs frequently arise from missing token expiry checks or re-using tokens across multiple attempts.
:::

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ Core Defensive Checklist:</strong> Use established identity libraries rather than custom authentication code. Hash passwords using Argon2id or bcrypt with appropriate cost factors. Return identical, generic errors and enforce constant-time response behavior. Never trust client-supplied Host headers to construct email links, and maintain an isolated, unprivileged session state until all authentication factors succeed.</p>
</div>

<TopicComplete topic-id="authentication" label="Mark authentication complete" />
