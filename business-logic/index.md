---
title: Business Logic Vulnerabilities · Case File 06
description: "Discover how applications break when real-world assumptions clash with software reality: negative quantities, coupon loops, and skipped workflow steps."
---

# Business Logic Vulnerabilities · When Valid Code Does Invalid Things

<p class="wd-section-lede">Business logic vulnerabilities are uniquely deceptive: every single component can be running bug-free, perfectly syntax-validated, and cryptographically sound, yet the entire system remains completely broken. Logic flaws happen when developers build software around unspoken assumptions about how humans behave in the real world.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Vending Machine Return Slot.</strong> Imagine a vending machine where inserting $5 lets you purchase a $2 bottle of water, returning $3 in change. What happens if you press a button that requests <em>negative one bottles of water</em>? If the machine's computer calculates <code>Total = -1 × $2 = -$2</code> and computes your change as <code>Inserted ($5) - Total (-$2) = $7</code>, the machine just handed you free money! The math is technically consistent, but the real-world business rule—<em>"a customer cannot buy negative goods"</em>—was never written into the software.</p>
</div>

## Case File #6: Tracing Price Manipulation Behind the Scenes

Let's examine what happens when an online shopper adds an expensive luxury item to their cart:

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>You add a $1,337 leather jacket to your shopping cart. In your proxy history, you inspect the HTTP POST request sent when clicking "Add to Cart": <code>productId=1&amp;price=133700&amp;quantity=1</code>.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>The backend shopping cart handler receives the request parameters and computes the line-item total by multiplying the incoming price by the incoming quantity before storing it in the user's active session cart:</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = Server Computation Logic</span>
        <span><span class="wd-code-input">Gold</span> = Parameter Trusted from Client</span>
      </div>
      <span class="wd-code-dev">item_price = </span><span class="wd-code-input">request.body.price</span><span class="wd-code-dev">; // Trusted straight from browser!<br>total_charge = item_price * request.body.quantity;<br>cart.append({ id: 1, total: total_charge });</span>
    </div>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>The developers assumed the browser UI would always send the legitimate $1,337 price. By intercepting the request and changing <code>price=133700</code> to <code>price=1</code> (or sending a negative quantity to cancel out expensive items), the user pays a single penny for a luxury jacket. The checkout code validates that the user's payment covers the cart total, and the order ships!</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Never accept prices, discount flags, or financial figures from client HTTP requests. Look up the authoritative price directly from the database server-side using the product ID. Validate that all quantities are strictly positive integers within reasonable application boundaries.</p>
  </div>
</div>

### Visual Comparison: UI Expectations vs. Proxy Reality

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The web page dropdown only provides quantity choices from 1 to 10, and prices are rendered cleanly from our database, so no user could ever submit an invalid price or negative quantity.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>The client controls the raw HTTP request completely. An attacker uses an intercepting proxy to modify prices, duplicate coupons, or skip prerequisite workflow steps entirely.</p>
  </div>
</div>

### The Integrity Checkpoints of a Multi-Step Workflow

When handling transactions and workflows, a secure backend re-derives every authoritative truth at each step:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>1. Add to Cart</strong>
    Client supplies product ID; server fetches authoritative price from DB.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>2. Apply Discounts</strong>
    Enforce single-use coupon flags and prevent alternating discount loops.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>3. State Transition</strong>
    Verify order state is 'Awaiting Payment' before moving to 'Completed'.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>4. Fulfillment</strong>
    Ship order only when payment gateway confirms full settlement.
  </div>
</div>

---

## Client-Side Controls and Untrusted Inputs

Client-side controls (like disabled HTML buttons, JavaScript validation, or hidden form fields) are visual conveniences for legitimate users, not security barriers. When an application trusts numbers supplied by the client:
- **Price Tampering:** Setting the price to a negligible amount ($0.01) or zero.
- **Negative Quantities:** Ordering 1 expensive item ($1,000) and -99 cheap items ($10 each) to produce a net cart total of $10!
- **Integer Limits & Overflows:** Submitting quantities so huge (e.g., above 2,147,483,647 in 32-bit signed integers) that the total wraps around to a negative number or zero.

<LabGroup ids="business-logic-lab-logic-flaws-excessive-trust-in-client-side-controls, business-logic-lab-logic-flaws-high-level, business-logic-lab-logic-flaws-low-level" />

::: details 🔬 Under the Hood: Why Integer Overflow Still Matters in Modern Apps
In languages and databases using fixed-width integers (such as 32-bit signed integers in C, Java, or SQL `INT`), numbers wrap around when they exceed the maximum value:
`2,147,483,647 + 1 = -2,147,483,648`

If an e-commerce checkout multiplies `quantity × price` without bounds checking, an attacker can choose a quantity where the product wraps into a negative total. Many shopping cart engines interpret negative totals as store credits or treat any payment of $0 as paid in full.
:::

---

## Coupons, Refunds, and Rule Interactions

Logic flaws frequently hide in the seams between different business rules that make sense in isolation but break when combined:
- **Coupon Stacking Loops:** A store offers two discount codes: `NEWCUSTOMER` (20% off) and `SPRING10` ($10 off). The UI prevents entering both. However, submitting alternating requests applies both codes repeatedly until the cart total drops to zero.
- **Gift Card Balance Transfer:** A gift card redemption endpoint deposits money into the user account without locking the card or checking if the card was already redeemed in the same session.
- **Asymmetric Refunds:** The system calculates a 30% discount on purchase, but the refund module refunds the original full catalog price upon return!

<LabGroup ids="business-logic-lab-logic-flaws-flawed-enforcement-of-business-rules, business-logic-lab-logic-flaws-inconsistent-security-controls, business-logic-lab-logic-flaws-infinite-money" />

---

## Workflow Validation and Flawed State Machines

Applications frequently model complex workflows (checkout wizards, MFA logins, account registrations) as multi-step state machines. A <Term id="state-machine-flaw">state machine flaw</Term> occurs when the server assumes users will always proceed strictly through Step 1 → Step 2 → Step 3:
- **Skipping Mandatory Steps:** Navigating directly to Step 3 (`/checkout/complete`) without executing Step 2 (`/checkout/payment`).
- **Dual-Use Endpoints:** An endpoint designed for account registration is re-used for password updates without re-verifying the caller's existing password.
- **Canceling Out of Mid-Flight States:** Aborting a 2FA prompt midway through login while retaining the initial authenticated session.

<LabGroup ids="business-logic-lab-logic-flaws-weak-isolation-on-dual-use-endpoint, business-logic-lab-logic-flaws-insufficient-workflow-validation, business-logic-lab-logic-flaws-authentication-bypass-via-flawed-state-machine" />

---

## Input Parsing Discrepancies and Boundary Cases

When two different components in an architecture parse the exact same input using different rules, logic breaks down:
- **Email Normalization & Truncation:** A registration form accepts a 255-character email, but the database column only stores 100 characters. Submitting `admin@target.com.attacker.com` truncated at character 16 creates an account officially registered as `admin@target.com`!
- **Domain Parsing Differences:** An access-control filter checks if an email ends with `@target.com`, while the internal notification worker parses comments or subdomains differently.

<LabGroup ids="business-logic-lab-logic-flaws-inconsistent-handling-of-exceptional-input, business-logic-lab-logic-flaws-bypassing-access-controls-using-email-address-parsing-discrepancies" />

---

## Cryptographic Oracles in Business Flows

When an application exposes endpoints that encrypt user data and later decrypt it (for example, generating encrypted cookies for "track my order" features), an investigator can use the application as an **encryption oracle**. By feeding crafted plaintext into the encryption helper and capturing the resulting ciphertext, they can forge administrative session tokens without ever knowing the server's private secret key.

<LabGroup ids="business-logic-lab-logic-flaws-authentication-bypass-via-encryption-oracle" />

::: details ⚙️ Engine Variations: How Frameworks Parse Duplicate Parameters
When an HTTP request contains duplicate parameter names (`price=100&price=0.01`):
- **PHP:** Keeps the last value (`price=0.01`).
- **ASP.NET:** Concatenates all values with commas (`price=100,0.01`).
- **Express / Node (qs):** Converts duplicate parameters into an array (`price = ['100', '0.01']`).
- **Java Servlets:** Returns an array via `getParameterValues()` or the first value via `getParameter()`.

If a security firewall checks the first parameter while the application processes the last, parameter pollution completely dismantles business validation.
:::

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ Core Defensive Checklist:</strong> Re-derive all authoritative values server-side. Never trust prices, quantities, or privilege levels from the client. Enforce explicit state machine transition checks (ensure Step N cannot occur unless Step N-1 succeeded). Enforce database constraints (such as non-negative balance checks and unique coupon records), and audit business logic flows against concurrent and out-of-order execution.</p>
</div>

<TopicComplete topic-id="business-logic-vulnerabilities" label="Mark business logic complete" />
