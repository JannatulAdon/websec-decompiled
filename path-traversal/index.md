---
title: Path Traversal · Case File 02
description: Trace how file-loading parameters can be steered outside intended web directories using dot-dot-slash sequences to read private server files.
---

# Path Traversal · Breaking Out of the Folder Sandbox

<p class="wd-section-lede">A path traversal bug is not simply "the website lets you type <code>../</code> into a parameter." It is a disagreement between the string the application attempts to validate and the file path the operating system actually opens. The vulnerability lives in the gap between those two operations.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Filing Cabinet Clerk.</strong> Imagine an office where a clerk sits in front of a cabinet labeled <em>"Public Catalogs"</em>. When you ask for <em>"Spring_Collection.pdf"</em>, the clerk opens the drawer and hands it to you. But what if you say: <em>"Open the Public Catalogs cabinet, take three steps backward into the hallway, open the HR Director's office, and hand me the payroll records"</em>? If the clerk follows directions literally without verifying what room they are standing in, you've performed path traversal.</p>
</div>

## Case File #2: Tracing the File Loader Behind the Scenes

Let's examine what happens when an e-commerce website displays product images on a storefront:

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>You view a product page and inspect the image element in your browser's Developer Tools. The image source points to a backend endpoint: <code>/image?filename=28.jpg</code>. The server responds with the raw image data.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>The server extracts the <code>filename</code> parameter from the URL, glues it to a hardcoded base folder path, and hands the combined path directly to the filesystem file-reading function:</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = Hardcoded Server Directory</span>
        <span><span class="wd-code-input">Gold</span> = Input From URL Parameter</span>
      </div>
      <span class="wd-code-dev">/var/www/images/</span><span class="wd-code-input">28.jpg</span>
    </div>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>The developer assumed the user would only supply clean image filenames. But in operating systems, <code>..</code> is a special navigation symbol meaning "go up one directory level." If the input is <code>../../../etc/passwd</code>, each <code>../</code> steps back out of the folder tree:</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = Base Folder</span>
        <span><span class="wd-code-input">Gold</span> = Directory Climbers</span>
        <span><span class="wd-code-dead">Strikethrough</span> = Cancelled Folders</span>
      </div>
      <span class="wd-code-dev">/var/www/</span><span class="wd-code-dead">images/</span><span class="wd-code-input">../</span><span class="wd-code-dead">www/</span><span class="wd-code-input">../</span><span class="wd-code-dead">var/</span><span class="wd-code-input">../</span><span class="wd-code-input">etc/passwd</span>
    </div>
    <p>The operating system normalizes the path to <code>/etc/passwd</code>, reads the operating system's user account database, and returns it to the browser as if it were an image!</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Do not pass raw user strings directly to file APIs. Resolve the user's path to its absolute <Term id="canonicalization">canonical form</Term> using the operating system's path utility (such as <code>path.resolve()</code> or <code>realpath()</code>), and verify that the resulting path strictly begins with the intended base directory. Even better: store files under random UUIDs or database IDs so filenames never touch the filesystem directly.</p>
  </div>
</div>

### Visual Comparison: Subfolder Confinement vs. Directory Escape

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The developer assumed that prefixing the parameter with <code>/var/www/images/</code> would securely constrain every file read within the <code>images</code> subfolder forever.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>Because operating systems evaluate <code>..</code> after string concatenation, each traversal sequence climbs one folder higher, completely bypassing the intended directory sandbox.</p>
  </div>
</div>

### The 5 Stages of File Path Resolution

Every time a web application serves a file from disk based on a user parameter, the request travels through five distinct checkpoints. Understanding these stages reveals why superficial validation filters fail:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>1. Parameter Received</strong>
    Application receives URL query: <code>filename=../../etc/passwd</code>
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>2. URL Decoding</strong>
    Web server decodes percent sequences (<code>%2e%2e%2f</code> → <code>../</code>)
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>3. Path Concatenation</strong>
    Application prepends base directory (<code>/var/www/images/</code>)
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>4. OS Normalization</strong>
    OS kernel resolves dots and symlinks to <code>/etc/passwd</code>
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>5. File API Execution</strong>
    Kernel opens file descriptor and returns contents
  </div>
</div>

---

## Basic Traversal

In the simplest scenario, the application performs no validation whatsoever on the incoming filename. It takes whatever string you supply, attaches it to the image storage folder, and calls the file reading system.

Climbing up several directory levels (e.g., using `../../../../etc/passwd`) guarantees that even if the web folder is buried deeply inside `/var/www/app/public/static/images/`, the path climbs all the way up to the filesystem root `/` and navigates into `/etc/passwd`.

<LabGroup ids="path-traversal-lab-simple" />

---

## Defensive Filters and Why They Fail

When developers try to stop path traversal by writing quick string filters rather than proper canonical validation, they often introduce subtle structural loopholes:

### 1. Absolute Path Bypass
Some applications check whether the user's input contains `../`. If it doesn't, they assume it must be safe and pass it to a path-joining function. However, on many operating systems and programming frameworks (like Python's `os.path.join`), providing an **absolute path** (such as `/etc/passwd`) causes the function to completely discard the base directory prefix!

### 2. Non-Recursive Stripping (`....//`)
A naive defensive filter might call a search-and-replace function once to remove `../` from user input. But what happens if you send `....//`?

<div class="wd-codesplit">
  <div class="wd-codesplit__legend">
    <span><span class="wd-code-input">Gold</span> = User Input</span>
    <span><span class="wd-code-dead">Strikethrough</span> = Removed by Filter</span>
    <span><span class="wd-code-dev">Blue</span> = Reconstituted Traversal</span>
  </div>
  <span class="wd-code-input">..</span><span class="wd-code-dead">../</span><span class="wd-code-input">/</span> &nbsp;→&nbsp; <span class="wd-code-dev">../</span>
</div>

Because the filter only executed a single pass without re-checking the output, removing the inner `../` leaves the surrounding dots and slash intact, creating a brand new `../` sequence right before the file is opened!

### 3. Superfluous URL Decoding (Double Decoding)
Web frameworks automatically decode incoming URL parameters before handing them to application code. If a developer runs an extra decoding function (like `unquote()` or `decodeURIComponent()`) *after* their security filter has checked for `../`, sending a double-encoded sequence (like `%252e%252e%252f`) effortlessly slips past the filter and decodes into `../` right at the file system call.

### 4. Start-of-Path Validation
Some validation routines require that the input string starts with the expected base directory (for example, demanding that the parameter begins with `/var/static/images/`). An investigator satisfies this check by including the required folder prefix first, followed immediately by `../` sequences to climb right back out: `/var/static/images/../../../etc/passwd`.

### 5. Extension Validation & Historical Null Bytes
When an application enforces that filenames must end with an approved extension like `.png` or `.jpg`, early C-based runtimes suffered from null byte injection (`%00`). Because C strings are terminated by a byte value of `0x00`, the high-level application validated the entire string ending in `.png`, but the low-level operating system call stopped reading at the null byte, opening the file before the extension.

<LabGroup ids="path-traversal-lab-absolute-path-bypass, path-traversal-lab-sequences-stripped-non-recursively, path-traversal-lab-superfluous-url-decode, path-traversal-lab-validate-start-of-path, path-traversal-lab-validate-file-extension-null-byte-bypass" />

::: details 🔬 Under the Hood: Why Canonicalization Is the Only Reliable Defense
String sanitization (blacklisting dots or slashes) always fails because file systems support countless equivalent representations for the same file:
- Traversal sequences: `../`, `..\\`, `..;/`
- Symbolic links and directory shortcuts
- URL-encoded and double-encoded representations

The only robust defense is **canonicalization**:
```javascript
// Safe file resolution in Node.js
const safeBaseDir = path.resolve('/var/www/images');
const resolvedPath = path.resolve(safeBaseDir, userInputFilename);

// Verify that the canonical path strictly resides inside the safe directory
if (!resolvedPath.startsWith(safeBaseDir + path.sep)) {
    throw new Error('Access denied: Traversal detected');
}
```
:::

::: details ⚙️ Engine Variations: Operating System Quirks
- **Linux & macOS:** Only forward slashes (`/`) act as directory separators. Backslashes (`\`) are treated as normal characters inside filenames.
- **Windows:** Both forward slashes (`/`) and backslashes (`\`) are valid path separators. Windows APIs also strip trailing spaces and dots, and support drive letters (`C:\`).
- **PHP:** Functions like `file_get_contents()` also support stream wrappers (such as `php://filter`), which can read files without traversing directories if wrappers are not disabled.
- **Java:** `File.getCanonicalPath()` resolves symbolic links by consulting the filesystem, whereas `Path.normalize()` only operates purely on path strings in memory.
:::

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ Core Defensive Checklist:</strong> Never construct filesystem paths directly from user input. Use system canonicalization APIs to compute the absolute path, and enforce a strict boundary check confirming the target path remains inside your base directory. If possible, avoid filenames entirely by using random UUIDs or database identifiers mapped to files.</p>
</div>

<TopicComplete topic-id="path-traversal" label="Mark path traversal complete" />
