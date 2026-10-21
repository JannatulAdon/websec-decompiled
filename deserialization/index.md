---
title: Insecure Deserialization
description: Serialized object graphs, magic methods, PHP type juggling, Java gadget chains, Ruby Marshal, and PHAR metadata.
---

# Insecure Deserialization · The Trojan Object

<p class="wd-section-lede">Serialization is the process of flattening complex in-memory programming objects into a stream of bytes so they can be saved to disk or sent across the network. Deserialization is the reverse: taking those raw bytes and reconstructing the living object. When an application reconstructs objects directly from untrusted user input, it gives the user full control over object fields, data types, and the hidden initialization code that automatically runs during reconstruction.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Flat-Pack Booby Trap.</strong> Imagine ordering a flat-pack wooden bookshelf. To make shipping easy, the factory disassembles the shelf into boards, screws, and an assembly instruction booklet (Serialization). When the box arrives on your doorstep, you open it and follow the booklet step-by-step to build the shelf (Deserialization). But what if an intruder intercepted the shipment, swapped the shelf pieces for a timed firework, and altered step 1 of the manual to say: <em>"Light this fuse before placing on the carpet"</em>? The moment you open the box and faithfully follow the assembly instructions, the trap detonates—long before you ever put a single book on the shelf.</p>
</div>

## Case File #4: The Anatomy of an Object Injection

Modern programming languages don't just restore properties when deserializing—they trigger automated lifecycle hooks ("magic methods" or callbacks) to help objects reconnect to databases, close file handles, or refresh caches.

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>A web application stores login state inside a cookie named <code>session</code>. Looking at the cookie value in your browser developer tools, you see a base64-encoded string. Once decoded, it reveals cleartext object markup: <code>O:4:"User":2:{s:8:"username";s:6:"wiener";s:5:"admin";b:0;}</code>.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>On every request, the backend server base64-decodes the incoming cookie and passes the raw string to <code>unserialize()</code> (in PHP) or <code>readObject()</code> (in Java) to instantly recreate the <code>User</code> instance.</p>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>The application trusts that only its own server created the cookie. If an attacker changes the boolean flag <code>b:0</code> to <code>b:1</code>, they become an administrator. Worse, if they supply the name of an entirely different class that implements a destructor (<code>__destruct</code>), the language runtime will blindly run that class's teardown code with attacker-supplied parameters.</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Never pass untrusted user data to native deserialization functions. Replace object serialization with safe, data-only formats like JSON or Protocol Buffers, or digitally sign serialized cookies using an HMAC secret key before sending them to the client.</p>
  </div>
</div>

### Visual Comparison: Static Data vs. Active Execution

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The client sees the session cookie as an opaque, unreadable token. The deserializer will only ever receive valid instances created by the login controller, restoring safe username and role values.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>The client edited the serialized string. The server's runtime deserialized an unauthorized object graph and executed its magic destructor methods before the application's authentication check ever fired.</p>
  </div>
</div>

### Deconstructing the Serialized Anatomy

Inspect the exact internal anatomy of a PHP serialized object. Notice how every piece is strictly length-prefixed:

<div class="wd-codesplit">
  <div class="wd-codesplit__legend">
    <span><span class="wd-code-dev">Blue</span> = Class Definition &amp; Properties</span>
    <span><span class="wd-code-input">Gold</span> = User Values</span>
    <span><span class="wd-code-dead">Strikethrough</span> = Injected Privilege Flag</span>
  </div>
  <span class="wd-code-dev">O:4:"User":2:{s:8:"username";</span><span class="wd-code-input">s:6:"wiener";</span><span class="wd-code-dev">s:5:"admin";</span><span class="wd-code-dead">b:1;</span><span class="wd-code-dev">}</span>
</div>

::: details 🔬 Under the Hood: PHP Serialization Arithmetic & Type Juggling
Every string inside a PHP serialized payload begins with a length counter:
- `s:6:"wiener"` means a string (`s`) of exactly 6 characters. If you change `"wiener"` to `"administrator"` (13 characters) without updating `s:6` to `s:13`, the parser hits a syntax error and throws an exception!
- **PHP Type Juggling in Deserialization:** PHP uses loose comparison (`==`) in many authentication checks. If code checks `if ($user->password == 0)`, and the stored password is a string, PHP attempts to convert the string to an integer. By changing the serialized field type from `s:10:"secret123"` to integer `i:0;`, the comparison `0 == "secret123"` evaluates to **true** in older PHP engines!
:::

---

## The 5-Stage Life of a Gadget Chain

When simple property editing isn't enough, attackers assemble "gadget chains"—chaining existing library classes together like dominoes:

<div class="wd-flow">
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>1. Serialized Delivery</strong>
    Attacker crafts an object graph referencing existing classes present in the application's classpath.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>2. Stream Reconstruction</strong>
    Server deserializes the stream; memory allocates the objects and binds properties.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>3. Magic Hook Trigger</strong>
    The language engine automatically invokes <code>readObject()</code>, <code>__wakeup()</code>, or <code>__destruct()</code>.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>4. Gadget Cascading</strong>
    The initial hook calls a method on an internal property, which invokes another method in a third-party library.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>5. Fatal Sink</strong>
    The final method in the chain passes attacker-controlled data into an OS command, SQL query, or file write!
  </div>
</div>

---

## Serialized Data Across Languages

Every major object-oriented programming language has its own native serialization protocol and signature markers:

| Language | Format Signature Marker | Automatic Hooks on Deserialization |
| --- | --- | --- |
| **PHP** | `O:4:"User":2:{...}` (Text) | `__wakeup()`, `__destruct()`, `__toString()` |
| **Java** | `AC ED 00 05` (Hex / Base64: `rO0AB`) | `readObject()`, `readResolve()`, `validateObject()` |
| **Ruby** | `\x04\x08` (Binary Marshal) | `_load()`, `marshal_load()` |
| **Python** | `\x80\x03` or `\x80\x04` (Pickle) | `__reduce__()`, `__setstate__()` |
| **.NET** | `AAEAAAD///` (BinaryFormatter) | `ISerializable`, `OnDeserialized()` |

<LabGroup ids="deserialization-lab-deserialization-modifying-serialized-objects, deserialization-lab-deserialization-modifying-serialized-data-types" />

---

## Magic Methods and Application Functionality

Before hunting for multi-step gadget chains, always inspect how the target application itself handles object lifecycles. 

If an application defines a class that removes a temporary file upon destruction:
```php
class TempFileManager {
    public $filepath;
    function __destruct() {
        if (file_exists($this->filepath)) {
            unlink($this->filepath);
        }
    }
}
```
An attacker doesn't need external libraries. Injecting a serialized `TempFileManager` with `$filepath = "/var/www/html/index.php"` forces the server to delete its own homepage when the script finishes executing!

<LabGroup ids="deserialization-lab-deserialization-using-application-functionality-to-exploit-insecure-deserialization, deserialization-lab-deserialization-arbitrary-object-injection-in-php" />

---

## Gadget Chains in the Real World

A "gadget" is simply a piece of existing code already installed on the target server (inside libraries like Apache Commons Collections, Spring, or Symfony) that performs an interesting operation when its methods are invoked.

The attacker does not inject new executable machine code. Instead, they carefully nest legitimate objects inside each other:
1. Object A is a Map whose cleanup invokes `.toString()` on all keys.
2. Object B is an object whose `.toString()` invokes `.get()` on an internal provider.
3. Object C is a Template provider whose `.get()` compiles and runs bytecode.

When Object A is deserialized, the entire chain reacts automatically.

<LabGroup ids="deserialization-lab-deserialization-exploiting-java-deserialization-with-apache-commons, deserialization-lab-deserialization-exploiting-php-deserialization-with-a-pre-built-gadget-chain, deserialization-lab-deserialization-exploiting-ruby-deserialization-using-a-documented-gadget-chain, deserialization-lab-deserialization-developing-a-custom-gadget-chain-for-java-deserialization, deserialization-lab-deserialization-developing-a-custom-gadget-chain-for-php-deserialization" />

::: details 🔬 Under the Hood: Why Gadget Chains Require Exact Library Versions
Tools like `ysoserial` generate payloads for known Java gadget chains (e.g., `CommonsCollections1` through `CommonsCollections7`). Why do payloads fail if the version is slightly off?

Java classes declare a unique `serialVersionUID`. If the class on the target server has a different `serialVersionUID` (even due to a minor patch), `ObjectInputStream` throws an `InvalidClassException` and aborts immediately. In real-world assessments, finding dependency disclosures or error traces is crucial for selecting the exact compatible gadget chain.
:::

---

## PHAR Deserialization: Silent Code Execution via File Ops

In PHP, deserialization vulnerabilities can hide in plain sight even without an explicit call to `unserialize()`. 

The `phar://` (PHP Archive) stream wrapper stores serialized metadata inside the archive manifest. If an application performs any filesystem operation—such as `file_exists()`, `is_readable()`, or `getimagesize()`—on a path controlled by the user, and the path starts with `phar://`, PHP automatically deserializes the archive's metadata!

By uploading a valid image file that secretly embeds a PHAR manifest, and then triggering an avatar preview check on `phar://avatars/avatar.jpg`, an attacker triggers full deserialization.

<LabGroup ids="deserialization-lab-deserialization-using-phar-deserialization-to-deploy-a-custom-gadget-chain" />

::: details ⚙️ Engine Variations: Dangerous Defaults Across Ecosystems
- **Java (`ObjectInputStream`):** Accepts arbitrary classes by default. Deserialization happens before any application validation logic can run.
- **PHP (`unserialize`):** Accepts any class unless restricted with the `allowed_classes` option (introduced in PHP 7).
- **Python (`pickle`):** Explicitly designed to serialize code execution instructions via the `__reduce__` protocol; never safe for untrusted data.
- **Ruby (`Marshal.load`):** Instantiates arbitrary Ruby objects with internal state; historically prone to universal RCE chains.
- **.NET (`BinaryFormatter`):** Highly dangerous and officially marked deprecated by Microsoft due to systemic deserialization risks.

Format safety rule: Data-only serializers (JSON, YAML with safe loader, XML with disabled entities) are safe against object injection. Formats that support **polymorphism** (recreating class instances) are inherently dangerous.
:::

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ Defensive Blueprint: How to Secure Object Deserialization</strong></p>
<ol>
  <li><strong>Migrate to Data-Only Formats:</strong> Replace native serialization with standard JSON, Protocol Buffers, or MessagePack. Pure data formats do not instantiate class behaviors.</li>
  <li><strong>Digital Signatures &amp; Integrity Seals:</strong> If native serialization cannot be avoided, compute a cryptographically secure HMAC hash of the serialized blob and verify the signature before calling the deserializer.</li>
  <li><strong>Enforce Strict Class Allow-Lists:</strong> If using Java 9+ or modern PHP, configure <code>ObjectInputFilter</code> or <code>allowed_classes</code> to reject any class not explicitly required by the business logic.</li>
  <li><strong>Restrict Stream Wrappers:</strong> Disable dangerous stream wrappers like <code>phar://</code> in PHP configurations or sanitize all file path inputs with strict regexes.</li>
</ol>
</div>

<TopicComplete topic-id="insecure-deserialization" label="Mark deserialization complete" />
