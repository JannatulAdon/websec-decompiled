---
title: Race Conditions · Case File (Mental Model)
description: Time-of-check to time-of-use windows, limit overruns, multi-endpoint races, and single-packet attacks explained like a detective investigation.
---

# Race Conditions · The Core Investigation

<p class="wd-section-lede">It is easy to picture web requests as an orderly single-file line where Request A finishes completely before Request B begins. In reality, modern web servers process dozens of requests simultaneously across parallel worker threads. When an application checks a security rule in one step and saves the result in a second step, multiple requests arriving in the exact same millisecond can both pass the check before either one has updated the database.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Shared Fridge &amp; The Last Slice of Cake.</strong> Imagine you and your roommate both look into the fridge at 3:00:00 PM and see one remaining slice of chocolate cake. You both decide to eat it. You walk to the counter to grab a plate; your roommate walks over with a fork. Because both of you <em>checked</em> before either of you <em>took</em> the cake, you both proceed under the belief that the cake belongs to you. In computing, this split-second gap is called <Term id="toctou-race">Time-of-Check to Time-of-Use (TOCTOU)</Term>.</p>
</div>

## Case File #1: The One-Time Coupon Overrun

Let's trace what happens when an online shopper applies a promotional discount code to their cart.

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>You have a single-use promo code <code>SAVE20</code>. When you enter it and press "Apply", the store deducts 20% from your order. If you try submitting the code a second time, the store cleanly displays: <em>"Error: Promo code already redeemed."</em></p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>The backend application performs a multi-step sequence: first, it checks the database to confirm the coupon has not been used yet; then it calculates the new cart price; finally, it marks the coupon as used.</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = Step 1: Database Check</span>
        <span><span class="wd-code-input">Gold</span> = Step 2: Database Update</span>
      </div>
      <span class="wd-code-dev">SELECT is_used FROM coupons WHERE code = 'SAVE20'</span><br>
      <span class="wd-code-input">UPDATE coupons SET is_used = true WHERE code = 'SAVE20'</span>
    </div>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>The check and the update are two independent database statements separated in time. If an investigator sends 20 identical redemption requests at the exact same millisecond, all 20 threads execute the check step <em>before</em> any thread completes the update step. Because all 20 read <code>is_used == false</code>, all 20 threads apply the 20% discount, reducing a multi-thousand-dollar shopping cart to pennies!</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Developers move the check and the update into a single atomic database operation (e.g., <code>UPDATE coupons SET is_used = true WHERE code = 'SAVE20' AND is_used = false</code>) and verify that exactly one row was affected, or use strict database row locks (<code>SELECT ... FOR UPDATE</code>).</p>
  </div>
</div>

### Visual Comparison: Orderly Queue vs. Concurrent Collision

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The developer assumed requests arrive one after another: Request 1 checks the coupon, marks it used, and finishes. Request 2 arrives later, sees <code>is_used == true</code>, and is rejected.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>Requests 1 through 10 arrive in parallel within a 5-millisecond window. All 10 threads read <code>is_used == false</code> before any thread commits the update, multiplying the discount 10 times.</p>
  </div>
</div>

### Color-Coded Breakdown: Interleaved Worker Threads

Look at how two concurrent requests interleave their execution steps inside the server:

<div class="wd-codesplit">
  <div class="wd-codesplit__legend">
    <span><span class="wd-code-dev">Blue</span> = Thread A Execution</span>
    <span><span class="wd-code-input">Gold</span> = Thread B Execution</span>
    <span><span class="wd-code-dead">Gray</span> = Resulting Database State</span>
  </div>
  <span class="wd-code-dev">[Thread A] Checks balance ($100 &gt;= $100? Yes)</span><br>
  <span class="wd-code-input">[Thread B] Checks balance ($100 &gt;= $100? Yes)</span><br>
  <span class="wd-code-dev">[Thread A] Deducts $100 and ships item</span><br>
  <span class="wd-code-input">[Thread B] Deducts $100 and ships item</span><br>
  <span class="wd-code-dead">Database balance is now -$100; two items shipped for the price of one!</span>
</div>

---

## The 4-Stage Lifecycle of Concurrency Collisions

Every race condition exploitation flow relies on shrinking network jitter and landing requests in the execution gap:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>1. Request Synchronization</strong>
    Send requests using HTTP/2 multiplexing or single-packet TCP to eliminate network jitter.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>2. Parallel Ingestion</strong>
    Server web workers spawn simultaneous threads to process the incoming requests.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>3. Simultaneous Inspection</strong>
    Multiple threads read the current database record before any thread can modify it.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>4. Conflicted Commitment</strong>
    All threads commit their actions, resulting in limit overruns, duplicate credits, or bypassed state gates.
  </div>
</div>

---

## The Detective's Investigation Playbook

### 1. Limit Overruns & Rate-Limit Bypasses

The most common race condition is the **limit overrun**: multiplying an action that should only be permitted a fixed number of times.

- **Discount & Gift Card Duplication:** Redeeming a one-time promo code or gift card balance multiple times.
- **Vote & Rating Inflation:** Submitting multiple rating points when each user is limited to one vote.
- **Login Rate-Limit Evasion:** Sending 50 password guesses concurrently. If the counter that tracks failed attempts reads and increments asynchronously, all 50 attempts can land before the lock threshold triggers.

<LabGroup ids="race-conditions-lab-race-conditions-limit-overrun, race-conditions-lab-race-conditions-bypassing-rate-limits" />

::: details 🔬 Under the Hood: The Single-Packet Attack
When testing for race conditions over standard HTTP/1.1 connections, network jitter (slight delays across routers and cables) can spread request arrival times by 10–50 milliseconds—wide enough for the server to finish the first request before the second arrives.

The **single-packet attack** eliminates network jitter:
1. Open multiple TCP connections or HTTP/2 streams to the server.
2. Send all HTTP request headers and almost all of the request body, but hold back the final byte.
3. Release the final byte of all requests simultaneously inside a single TCP packet.

Because all requests complete their transmission in the exact same microsecond, the server's network card and web worker threads receive them at identical times, maximizing the chance of hitting the <Term id="toctou-race">TOCTOU window</Term>.
:::

---

### 2. Multi-Endpoint & Single-Endpoint Sub-State Races

Not all race conditions send the identical request to the identical endpoint:

- **Multi-Endpoint Races:** Target shared application state accessed by two different endpoints. For example, triggering a checkout request (`POST /cart/checkout`) while simultaneously modifying cart contents (`POST /cart/add-item`) can result in paying the low price while receiving the high-value item.
- **Single-Endpoint Races:** Send the same endpoint different values. For example, racing an email-change request against a password-reset request can cause the password reset token to be generated and delivered to an intermediate email address during state transition.

<LabGroup ids="race-conditions-lab-race-conditions-multi-endpoint, race-conditions-lab-race-conditions-single-endpoint" />

---

### 3. Time-Sensitive Tokens & Partial Construction Windows

- **Time-Sensitive Token Collisions:** Some password-reset or session token generators seed their pseudorandom generator using the server's current millisecond timestamp (`System.currentTimeMillis()`). Sending two reset requests at the same instant can generate identical reset tokens for two different accounts.
- **Partial Construction Windows:** When an application creates a new account or resource, it often performs setup in stages (e.g., insert base user record, then initialize security flags, then set permissions). Requesting the account or logging in during the microsecond window between record insertion and permission initialization can catch the object in an unvalidated, half-built state.

<LabGroup ids="race-conditions-lab-race-conditions-exploiting-time-sensitive-vulnerabilities, race-conditions-lab-race-conditions-partial-construction" />

::: details ⚙️ Engine Variations: Where Real Atomicity Comes From
Application-level locks (like in-memory mutexes) fail completely when web applications run on multiple server instances or containers. True atomicity must come from the data layer:

| Datastore | Non-Atomic Pattern (Vulnerable) | Atomic Primitive (Safe) |
| --- | --- | --- |
| **PostgreSQL / MySQL** | `SELECT balance;` then `UPDATE balance;` | `UPDATE accounts SET balance = balance - 100 WHERE id = 1 AND balance >= 100;` or `SELECT ... FOR UPDATE` |
| **Redis** | `GET key;` then `SET key;` | `INCR`, `SETNX`, or atomic Lua scripts (`EVAL`) |
| **MongoDB** | Read document then call `save()` | `findOneAndUpdate({ _id: id, count: { $gt: 0 } }, { $inc: { count: -1 } })` |
| **File Counters** | Read file, increment, write file | `flock()` advisory locking (though unreliable across networked NFS) |
:::

---

## The Detective's Concurrency Testing Routine

When hunting for race conditions:

1. **Identify Check-Then-Act Logic:** Look for any high-value operation guarded by a condition: coupons, account balances, transfer limits, one-time invitation tokens, and login lockouts.
2. **Benchmark Normal Flow:** Measure the normal response time and database state changes of a single request.
3. **Synchronize Requests:** Group 10 to 30 requests in Burp Repeater or Turbo Intruder and configure HTTP/2 single-packet synchronization.
4. **Inspect State Anomalies:** Check whether balances went negative, duplicate orders were placed, or discount codes were applied multiple times.
5. **Vary Endpoint Pairs:** Test racing one state-changing request (e.g., checkout) against another state-altering action (e.g., modifying delivery address or adding cart items).

---

## How Developers Lock It Down Permanently

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ The Golden Rules of Concurrency Defense:</strong></p>
<ul>
  <li><strong>Use Atomic Conditional Updates:</strong> Execute state updates with embedded conditions (<code>UPDATE coupons SET used = true WHERE id = ? AND used = false</code>) and check that the affected row count is 1.</li>
  <li><strong>Enforce Database Constraints:</strong> Use database-level unique constraints (e.g., unique index on <code>(user_id, promo_id)</code>) so the database itself rejects duplicate inserts, regardless of thread timing.</li>
  <li><strong>Apply Transaction Isolation &amp; Row Locks:</strong> When multi-step operations are required, wrap them in a transaction with <code>SERIALIZABLE</code> isolation or use pessimistic locking (<code>SELECT ... FOR UPDATE</code>).</li>
  <li><strong>Use Centralized Atomic Counters:</strong> For rate limits, use distributed atomic stores like Redis <code>INCR</code> with immediate expiration rather than asynchronous database counters.</li>
  <li><strong>Audit Object Lifecycle States:</strong> Ensure new records are created in a disabled or pending state and only activated after all security initializations complete.</li>
</ul>
</div>

<TopicComplete topic-id="race-conditions" label="Mark race conditions complete" />
