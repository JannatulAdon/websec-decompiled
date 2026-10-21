---
title: File Upload · Case File (Mental Model)
description: Extension parsing, content-type trust, polyglots, path traversal in filenames, and race-condition uploads explained like a detective investigation.
---

# File Upload Vulnerabilities · The Core Investigation

<p class="wd-section-lede">An upload form is an open invitation for visitors to write raw bytes directly onto the server's hard drive. The vulnerability happens when the server decides what a file <em>is</em> based on labels the user controls, stores it inside an executable folder, and then asks an execution engine to run it.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Trophy with a Secret Engine.</strong> Imagine a community center that allows visitors to donate trophies for display in the glass foyer. If a visitor brings in a wooden trophy labeled <em>"Harmless Statue"</em>, but secretly hollows out the base and installs an active remote-control engine, placing it in the foyer gives the visitor control over the room. Real security means checking the physical material (not just the shipping label), stripping active mechanisms, and placing it in a separate, non-conductive storage room.</p>
</div>

## Case File #1: Following an Uploaded File Behind the Curtain

Let's trace what happens when you update your profile avatar on a web application.

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>You click "Change Avatar", select an image on your computer, and press "Upload". Your browser packages the image into a <code>multipart/form-data</code> HTTP request with a <code>filename="avatar.png"</code> attribute and a <code>Content-Type: image/png</code> header, then posts it to <code>/my-account/avatar</code>.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>The server receives the byte stream, extracts the filename and header, checks if the extension is acceptable, and writes the bytes into a publicly accessible folder like <code>/var/www/html/avatars/avatar.png</code> so that the browser can display it later.</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = Server Storage Path</span>
        <span><span class="wd-code-input">Gold</span> = Client-Provided Filename</span>
      </div>
      <span class="wd-code-dev">/var/www/html/avatars/</span><span class="wd-code-input">avatar.png</span>
    </div>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>The client completely controls the filename and the <code>Content-Type</code> header. If a user uploads a server-side script (such as a PHP or ASP file), and the server stores it inside the web root where script execution is enabled, visiting the file's URL causes the web server's runtime interpreter to execute the file instead of merely serving it as static image bytes.</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Developers isolate uploads outside the public web root, generate random alphanumeric filenames (e.g., UUIDs) rather than trusting client filenames, re-encode uploaded images through an image processing library, and disable script execution permissions on storage folders.</p>
  </div>
</div>

### Visual Comparison: Trusted Label vs. Actual Bytes

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The developer believed checking <code>Content-Type: image/png</code> in the incoming HTTP header guaranteed that only legitimate graphic image files would be saved into the avatar directory.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>HTTP headers are authored entirely by the client. An intercepting proxy allowed sending a script file named <code>shell.php</code> while keeping <code>Content-Type: image/png</code>, tricking the server into saving executable code into a web-served folder.</p>
  </div>
</div>

### How an HTTP Multipart Request Labels Uploaded Data

Here is how an upload request splits metadata from file contents in an HTTP POST:

<div class="wd-codesplit">
  <div class="wd-codesplit__legend">
    <span><span class="wd-code-dev">Blue</span> = Multipart Envelope</span>
    <span><span class="wd-code-input">Gold</span> = Client-Controlled Filename &amp; Header</span>
  </div>
  <span class="wd-code-dev">Content-Disposition: form-data; name="avatar"; </span><span class="wd-code-input">filename="exploit.php"</span><br>
  <span class="wd-code-dev">Content-Type: </span><span class="wd-code-input">image/jpeg</span><br><br>
  <span class="wd-code-input">&lt;?php echo file_get_contents('/etc/passwd'); ?&gt;</span>
</div>

---

## The 4-Stage Lifecycle of Every Uploaded File

To understand where an upload vulnerability lurks, trace the file across its four critical checkpoints:

<div class="wd-flow">
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>1. Client Submission</strong>
    Browser sends file bytes, original filename, and declared MIME header. (Untrusted input originates here!)
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>2. Server Validation</strong>
    App checks extension, MIME header, or magic bytes against its validation policy.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>3. Filesystem Placement</strong>
    App writes file to disk (either inside web root or in a private, isolated storage bucket).
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>4. Retrieval &amp; Execution</strong>
    User requests the URL. Does the server treat it as static text or feed it to a script engine?
  </div>
</div>

---

## What the Server Checks vs. What the Client Controls

Defenses fail when they inspect only what the user claims rather than how the file is stored and parsed:

| Validation Check | What the Client Controls | How the Check Breaks |
| --- | --- | --- |
| `Content-Type` header | Fully controlled by client | The client simply forges `image/jpeg` while uploading a script. |
| Filename extension | Fully controlled by client | Blocklist misses alternatives like `.phtml`, `.php5`, or `.phar`. |
| Magic bytes (file signature) | First few bytes controlled | A <Term id="mime-polyglot">polyglot</Term> combines valid image headers with script code. |
| Image re-encoding | Re-encoded output | Skipped entirely, or only resized without stripping metadata tags. |
| Destination path | Filename path components | <Term id="canonicalization">Path traversal</Term> (`../../`) writes outside the upload folder into executable roots. |
| Web directory execution | Server configuration | The upload folder has execution handlers enabled (e.g., PHP-FPM / CGI). |

::: details 🔬 Under the Hood: Why Web Servers Handle Filenames Differently
Filename parsing differences between web servers and operating systems often create unexpected execution paths:

- **Apache `mod_mime` and MultiViews:** Apache can evaluate extensions from right to left or across multiple dots. If configured with handler mapping, a file named `exploit.php.jpg` may be executed as PHP if the server maps `.php` to the PHP handler regardless of trailing extensions.
- **IIS Semicolon Parsing:** Historically, older IIS servers truncated filenames at semicolons (`exploit.asp;.jpg`), passing `exploit.asp` to the ASP handler while the validator only verified the trailing `.jpg`.
- **Nginx `cgi.fix_pathinfo=1`:** If Nginx is paired with PHP-FPM with `cgi.fix_pathinfo` enabled, requesting `/uploads/photo.jpg/test.php` causes PHP to look for `test.php`, fail, and walk back up the path to execute `photo.jpg` as PHP.
:::

::: details ⚙️ Engine Variations: Executable Extensions by Stack
Different application runtimes look for different file extensions:

- **PHP:** `.php`, `.php3`, `.php4`, `.php5`, `.phtml`, `.phar` (which can trigger object deserialization on file operations).
- **ASP.NET:** `.aspx`, `.ashx`, `.asmx`, `.config` (uploading a custom `web.config` can enable script execution in that folder).
- **Java:** `.jsp`, `.jspx`, `.war` (if the application server auto-deploys WAR archives).
- **Node.js:** Node does not execute files based on extensions by default; risks arise when uploaded templates or JavaScript modules are dynamically imported or rendered by a template engine.
- **Python:** `.py` files do not execute automatically unless dynamically imported or evaluated by the app.
:::

---

## Practice Labs: The 5 Investigation Angles

Put these concepts into practice across the 5 common upload scenarios:

### 1. Direct Script Uploads & Content-Type Bypass

When an upload directory is located directly inside the public web root and has execution permissions enabled, uploading a minimal script file gives immediate code execution. When the server validates only the `Content-Type` header, changing that header in your intercepting proxy allows the file through.

<LabGroup ids="file-upload-lab-file-upload-remote-code-execution-via-web-shell-upload, file-upload-lab-file-upload-web-shell-upload-via-content-type-restriction-bypass" />

### 2. Path Traversal & Filename Manipulation

When the upload folder forbids execution, attackers look for ways to store the file somewhere else. If the server takes the client-supplied filename and concatenates it directly into the save path without sanitization, path traversal sequences (`../` or `..%2f`) can write the file into a parent folder that *does* execute scripts.

<LabGroup ids="file-upload-lab-file-upload-web-shell-upload-via-path-traversal, file-upload-lab-file-upload-web-shell-upload-via-extension-blacklist-bypass, file-upload-lab-file-upload-web-shell-upload-via-obfuscated-file-extension" />

::: details 💡 Detective Tip: Bypassing Blocklists with Configuration Files
If an application blocks `.php` extensions, developers may still have forgotten to block server configuration files. On Apache servers, uploading a custom `.htaccess` file can map an otherwise harmless extension (like `.l33t` or `.png`) to the PHP handler:
```apache
AddType application/x-httpd-php .l33t
```
Once that `.htaccess` is uploaded into the folder, uploading `exploit.l33t` will execute as live PHP!
:::

### 3. Content Validation & Polyglot Files

When a server verifies that a file is truly an image by checking its initial magic bytes (such as `GIF89a;` or the JPEG SOI marker `FF D8 FF`), simple text scripts will be rejected. A <Term id="mime-polyglot">polyglot</Term> file satisfies both formats: it contains valid image metadata headers so image parsers accept it, while containing executable script code inside an image comment or metadata field.

<LabGroup ids="file-upload-lab-file-upload-remote-code-execution-via-polyglot-web-shell-upload" />

### 4. Non-Atomic Uploads & Race Conditions

Many applications save an uploaded file into a temporary directory first, run validation or an antivirus scan, and delete the file if it fails. If that temporary location is web-accessible during the milliseconds before the server unlinks the file, concurrent requests can execute the file inside that tiny <Term id="toctou-race">TOCTOU race window</Term>.

<LabGroup ids="file-upload-lab-file-upload-web-shell-upload-via-race-condition" />

::: details 🔬 Under the Hood: The Race Condition Window
A typical non-atomic upload workflow looks like this:

```text
1. Receive multipart body      → Write /var/www/uploads/temp-9823.php
2. Inspect file / scan content  → Determine file is malicious (takes 20ms)
3. Unlink / delete file        → rm /var/www/uploads/temp-9823.php
```

If an investigator fires hundreds of GET requests for `temp-9823.php` while the upload is being processed, requests that hit during that 20ms window between Step 1 and Step 3 will successfully execute before the cleanup finishes.
:::

---

## The Detective's Upload Testing Checklist

When investigating an upload form, proceed systematically:

1. **Test Baseline Upload:** Upload a legitimate image (`avatar.png`) and observe the response: Where is it saved? What URL does the page use to display it?
2. **Inspect Content-Type Trust:** Upload a script file while modifying `Content-Type` to `image/png`. Does the server accept it?
3. **Test Extension Variations:** If `.php` is blocked, test `.phtml`, `.php5`, `.phar`, or configuration files like `.htaccess`.
4. **Test Path Traversal:** Supply `filename="../avatar.png"` or `filename="..%2favatar.png"` to see if the file lands in a parent directory.
5. **Test Magic Bytes & Polyglots:** Prepend valid file signatures (like `GIF89a;`) or embed payloads into image EXIF/comment sections.
6. **Test Concurrency:** If validation deletes files after saving, test for race conditions using parallel requests.

---

## How Developers Lock It Down Permanently

Secure file handling requires defense in depth across all four lifecycle stages:

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ The Golden Rules of Secure Uploads:</strong></p>
<ul>
  <li><strong>Store Outside Web Root:</strong> Store uploaded files in an isolated private directory or cloud storage bucket (e.g., AWS S3, Google Cloud Storage) completely separated from executable code.</li>
  <li><strong>Generate Random Names:</strong> Never use client-supplied filenames on disk. Assign a generated UUID and append an extension determined by the server's own strict allow-list.</li>
  <li><strong>Re-Encode Media:</strong> Process images through an image processing library (e.g., ImageMagick or Sharp) to strip comments and regenerate pixel data from scratch, neutralizing polyglots.</li>
  <li><strong>Disable Execution:</strong> Configure the web server to disable execution engines (e.g., <code>php_flag engine off</code> or Nginx <code>location ^~ /uploads/ { }</code> with no script handler).</li>
  <li><strong>Safe Download Headers:</strong> Serve user-uploaded downloads with <code>Content-Disposition: attachment</code> and <code>X-Content-Type-Options: nosniff</code> to prevent browser mime-sniffing execution.</li>
</ul>
</div>

<TopicComplete topic-id="file-upload-vulnerabilities" label="Mark file upload complete" />
