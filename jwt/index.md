---
title: JWT Attacks · Case File 08
description: "Dissect JSON Web Token verification flaws, signature forgery, alg none bypasses, jwk/jku header injection, and algorithm confusion."
---

# JWT Attacks · Forging the Cryptographic Passport

<p class="wd-section-lede">A JSON Web Token (JWT) looks like a futuristic cryptographic seal, but under the hood, it is simply three Base64URL-encoded text blocks glued together with periods. The token is only as trustworthy as the server's verification routine. When an application lets the token's header tell it <em>how</em> to verify itself, the client gains control of the identity check.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Self-Inspected Diplomatic Passport.</strong> Imagine arriving at international passport control with a homemade passport booklet. On the first page, under <em>"Verification Instructions"</em>, you write: <code>Verification Protocol: None Required. Admit bearer immediately as Royal Ambassador</code>. If the border control agent blindly reads your note and waves you through without checking their own databases or consular seals, they committed the classic <code>alg: none</code> blunder: trusting the document to dictate its own verification rules.</p>
</div>

## Case File #8: Following the Token Verification Behind the Scenes

Let's examine what happens when a browser sends an authenticated request using a JSON Web Token:

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>You log into a website as user <code>wiener</code>. In your browser's Storage inspector, you find a session cookie containing a three-part string separated by dots: <code>eyJhbGciOi...eyJzdWIi...ABC123xyz</code>.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>The server splits the token by periods into three components: Header, Payload, and Signature. It decodes the JSON payload to identify who is making the request:</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = Header (Algorithm declaration)</span>
        <span><span class="wd-code-input">Gold</span> = Payload (User Claims)</span>
        <span><span class="wd-code-dead">Strikethrough</span> = Cryptographic Signature</span>
      </div>
      <span class="wd-code-dev">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9</span>.<span class="wd-code-input">eyJzdWIiOiJ3aWVuZXIiLCJhZG1pbiI6ZmFsc2V9</span>.<span class="wd-code-dead">SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c</span>
    </div>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>Many JWT verification implementations inspect the token's <code>alg</code> header claim to decide how to verify the signature. If the server supports the unsecured <code>"alg": "none"</code> algorithm, or if the developers decoded the payload without calling the cryptographic verification function, an investigator can change <code>"admin": false</code> to <code>"admin": true</code>, strip the signature, and the server accepts the forged identity!</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Never let the token's header choose the verification algorithm. Hardcode the expected algorithm on the server (e.g. strictly enforce RS256), explicitly reject tokens using <code>none</code>, look up signing keys from an internal key store rather than client headers, and always verify signatures before reading payload claims.</p>
  </div>
</div>

### Visual Comparison: Trusted Signature vs. Self-Declared Verification

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>Because the token is cryptographically signed with a secret key, any unauthorized modification to the username or admin claim will invalidate the signature and be rejected by the server.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>The backend verification function blindly trusts the algorithm in the token header, accepts weak secrets crackable in seconds, or accepts public keys supplied by the user in the header itself.</p>
  </div>
</div>

### The 5 Checkpoints of JWT Verification

When validating an incoming bearer token, a robust security routine follows strict server-side rules:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>1. Structure Check</strong>
    Verify token has three Base64URL parts separated by periods.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>2. Algorithm Pinning</strong>
    Enforce server-configured algorithm; reject <code>alg: none</code>.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>3. Key Retrieval</strong>
    Fetch trusted key from internal store; ignore untrusted headers.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>4. Signature Check</strong>
    Verify cryptographic hash matches <code>header.payload</code> bytes.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>5. Claims Validation</strong>
    Verify expiration (<code>exp</code>), audience (<code>aud</code>), and issuer (<code>iss</code>).
  </div>
</div>

---

## Anatomy of a Token & Unverified Signatures

A JWT consists of three distinct segments:
1. **Header:** Contains metadata, typically defining the token type (`typ: "JWT"`) and the cryptographic algorithm (`alg: "HS256"` or `"RS256"`).
2. **Payload:** Contains user claims (`sub: "123"`, `role: "admin"`, `exp: 1710000000`). It is merely Base64URL-encoded, not encrypted—anyone can read its contents!
3. **Signature:** Generated by computing a cryptographic signature over the combined string `Base64URL(Header) + "." + Base64URL(Payload)` using a secret or private key.

### The Missing Verification Trap
In some vulnerable applications, backend developers use convenience helper functions like `jwt.decode()` instead of `jwt.verify()`. When this happens, the server reads the payload claims without checking the cryptographic signature at all, accepting any arbitrary token modifications!

In other cases, vulnerable libraries accept tokens specifying `"alg": "none"`. If an attacker modifies the payload and strips the signature (leaving the trailing dot: `header.payload.`), the server treats the token as valid.

<LabGroup ids="jwt-lab-jwt-authentication-bypass-via-unverified-signature, jwt-lab-jwt-authentication-bypass-via-flawed-signature-verification" />

::: details 🔬 Under the Hood: Why the Spec Allowed `alg: none`
The original RFC 7519 specification included `"alg": "none"` for situations where token integrity is already guaranteed by an external transport layer (such as an established mutual-TLS tunnel). However, when verification libraries allowed this parameter dynamically, it enabled attackers to turn off cryptographic enforcement with a single string change. Modern libraries reject `none` by default, but legacy systems and misconfigured options remain common.
:::

---

## Weak Signing Keys and Offline Cracking

When tokens use symmetric HMAC signing algorithms (like **HS256**), both signing and verification rely on the exact same shared secret string. 

If the developers chose a weak, guessable secret (such as `secret`, `password123`, or the company name), an investigator can take a valid token observed in browser cookies and perform **offline dictionary cracking** using tools like Hashcat. Because the attack runs entirely offline on the tester's machine, it triggers zero rate limits and leaves zero traces in server logs. Once the secret is found, the investigator can sign arbitrary payloads with full validity.

<LabGroup ids="jwt-lab-jwt-authentication-bypass-via-weak-signing-key" />

---

## Header Injection: `jwk` and `jku`

The JSON Web Signature (JWS) specification defines several optional header parameters that describe the public key used for verification:
- **Embedded Keys (`jwk`):** The `jwk` header parameter allows the token to embed a JSON Web Key object directly inside its own header. If the server trusts this header, an attacker generates their own RSA key pair, embeds their public key in the `jwk` header, and signs the token with their matching private key!
- **Key Set URLs (`jku`):** The `jku` header parameter points to a remote URL hosting a JSON Web Key Set. If the server fetches this URL without validating it against an approved whitelist, an attacker points `jku` to their own server and serves their own public keys.

<LabGroup ids="jwt-lab-jwt-authentication-bypass-via-jwk-header-injection, jwt-lab-jwt-authentication-bypass-via-jku-header-injection" />

---

## Key ID (`kid`) Path Traversal and SQL Injection

The `kid` (Key ID) header parameter is an optional identifier that tells the server which key in its keystore to use for verification. 

When backend implementations use the `kid` value directly inside filesystem path lookups (e.g. `open("/keys/" + header.kid)`) or database queries, it introduces classic injection bugs:
- **Path Traversal in `kid`:** Setting `kid: "../../../../../dev/null"` directs the server to read from `/dev/null` on Linux systems. Because `/dev/null` is an empty file, the secret key becomes a zero-length string. Signing the token with an empty secret (`""`) results in a valid signature!
- **SQL Injection in `kid`:** If `kid` is passed to a database query, injecting a SQL UNION payload can force the query to return a known string that the attacker can use to sign the token.

<LabGroup ids="jwt-lab-jwt-authentication-bypass-via-kid-header-path-traversal" />

---

## Algorithm Confusion Attacks

Algorithm confusion occurs when an application expects an asymmetric algorithm like **RS256** (which uses a private key to sign and a public key to verify), but the verification library also permits the symmetric algorithm **HS256**.

```text
Normal Asymmetric Flow (RS256):
  Sign:   Private Key (Secret on Auth Server)
  Verify: Public Key  (Publicly Known Certificate)

Algorithm Confusion Exploit (HS256):
  Attacker sets: "alg": "HS256"
  Attacker signs with: Server's Public Key (which is public!)
  Server verifies using: Public Key as the HMAC secret string!
```

Because HMAC-SHA256 treats whatever key it is given as a symmetric byte string, the server verifies the token using its own public key bytes—and since the attacker signed the token with those exact same public key bytes, the signature passes perfectly!

<LabGroup ids="jwt-lab-jwt-authentication-bypass-via-algorithm-confusion, jwt-lab-jwt-authentication-bypass-via-algorithm-confusion-with-no-exposed-key" />

::: details ⚙️ Engine Variations: How Modern Libraries Prevent JWT Attacks
- **jsonwebtoken (Node.js):** Developers must pass an explicit `algorithms: ['RS256']` array option. Omitting this option allows algorithm confusion andPermits the token to dictate the verification routine.
- **PyJWT (Python):** Modern versions strictly require the `algorithms` parameter in `jwt.decode()` and automatically reject `none` unless explicitly requested.
- **Spring Security (Java):** `NimbusJwtDecoder` binds the decoder to a specific expected `JWSAlgorithm`, preventing algorithm confusion at the framework level.
:::

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ Core Defensive Checklist:</strong> Always pin the expected verification algorithm server-side. Completely disable support for <code>alg: none</code>. Ensure symmetric HMAC secrets are high-entropy cryptographic strings (minimum 256 bits). When using asymmetric keys (RS256/ES256), strictly enforce asymmetric key types to prevent algorithm confusion, and never trust client-supplied <code>jwk</code>, <code>jku</code>, or raw <code>kid</code> header parameters.</p>
</div>

<TopicComplete topic-id="jwt" label="Mark JWT attacks complete" />
