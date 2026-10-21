export default {
  'information-disclosure': {
    sandbox: {
      title: "Live Request & Server X-Ray Simulator",
      prompt: "Click a test action below (or toggle Safe Defense Mode) and observe how the server processes your input:",
      inputLabel: "Parameter / Input",
      presets: [
        {
          label: "1. Normal Request",
          input: "id=14",
          http: "GET /product?id=14 HTTP/1.1\nHost: target.com",
          serverDevBefore: "const product = await db.query(\"SELECT * FROM products WHERE id = \" + ",
          serverInput: "req.params.id",
          serverDevAfter: ");",
          commentedOut: false,
          status: "200 OK · Normal Response",
          statusType: "normal",
          responsePreview: "Leather Jacket - $133.00 - In Stock (Normal catalog rendering)",
          aha: "When given an expected integer, the query executes cleanly and returns public catalog data. The server processes the request along its happy path without triggering error handlers.",
          safeServerView: "const id = Number.parseInt(req.params.id, 10);\nif (Number.isNaN(id)) return res.status(400).send('Invalid ID');",
          safeStatus: "200 OK · Safe & Validated",
          safeAha: "Input validation confirms the parameter is a valid integer before any database interaction."
        },
        {
          label: "2. Anomaly Probe",
          input: "id=alpha",
          http: "GET /product?id=alpha HTTP/1.1\nHost: target.com",
          serverDevBefore: "const product = await db.query(\"SELECT * FROM products WHERE id = \" + ",
          serverInput: "\"alpha\"",
          serverDevAfter: ");",
          commentedOut: false,
          status: "500 Internal Server Error · Stack Trace",
          statusType: "error",
          responsePreview: "Fatal error: Uncaught ValueError: invalid literal for int() in /var/www/app/controllers/catalog.py:48",
          aha: "Passing a string into an integer parameter causes the backend query or typecast to crash. Because verbose debug mode is enabled, the server displays the full call stack with internal paths and library versions.",
          safeServerView: "try { ... } catch (err) {\n  logger.error(err);\n  return res.status(404).send('Product not found');\n}",
          safeStatus: "404 Not Found · Generic Error",
          safeAha: "Catching unhandled exceptions globally and serving generic errors keeps internal file paths hidden."
        },
        {
          label: "3. Logic Break",
          input: "path=/backup/db.sql",
          http: "GET /backup/db.sql HTTP/1.1\nHost: target.com",
          serverDevBefore: "// Static asset router:\nserveStaticFile(",
          serverInput: "\"/backup/db.sql\"",
          serverDevAfter: ");",
          commentedOut: false,
          status: "200 OK · Source & Credentials Leaked",
          statusType: "bypass",
          responsePreview: "-- MySQL dump 10.13\nINSERT INTO users VALUES ('admin', '$2b$12$e8x...','master_secret');",
          aha: "Forgotten deployment artifacts, temporary backups, or exposed source code trees can be downloaded directly over HTTP. The server treats sensitive database dumps as ordinary downloadable files.",
          safeServerView: "// Web server configuration:\nlocation ~* \\.(sql|bak|env|git) { deny all; return 404; }",
          safeStatus: "404 Not Found · Blocked Route",
          safeAha: "Restricting web server access rules ensures backup extensions and hidden directories cannot be retrieved."
        },
        {
          label: "4. Edge Case Variation",
          input: "Header: X-Debug-Mode: 1",
          http: "GET /product?id=14 HTTP/1.1\nHost: target.com\nX-Debug-Mode: 1",
          serverDevBefore: "if (req.headers['x-debug-mode'] === ",
          serverInput: "\"1\"",
          serverDevAfter: ") res.setHeader('X-Backend-Server', 'ip-10-0-4-12.internal');",
          commentedOut: false,
          status: "200 OK · Diagnostic Headers Exposed",
          statusType: "bypass",
          responsePreview: "Response Headers: X-Backend-Server: ip-10-0-4-12.internal, X-Powered-By: Express/4.17.1",
          aha: "Custom debug headers or legacy diagnostic switches left enabled in production expose internal network topology and framework versions without causing a single visible error.",
          safeServerView: "app.disable('x-powered-by'); // Strip diagnostic headers entirely in production",
          safeStatus: "200 OK · Sanitized Headers",
          safeAha: "Hardening production environments strips diagnostic banners and framework identifiers from all responses."
        }
      ]
    },
    story: [
      {
        tag: "Slide 1 of 4 · 🔎 The Browser Clue",
        headline: "An innocent typo unleashes an internal blueprint",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 0,
        packetText: "GET /product?id=alpha",
        body: "You send text where the application expected a number. The browser suddenly fills with a 50-line diagnostic trace showing internal paths, database queries, and third-party package versions.",
        takeaway: "Unexpected input often exposes whether production debug modes are carelessly left on."
      },
      {
        tag: "Slide 2 of 4 · ⚙️ The Server Action",
        headline: "An unhandled exception bubbles up the stack",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "ValueError: invalid literal",
        body: "The backend controller tries to parse the parameter as an integer and immediately throws an unhandled exception. Instead of catching it gracefully, the application framework's crash handler takes over.",
        takeaway: "When code has no try/catch fallback, the framework decides what the user sees."
      },
      {
        tag: "Slide 3 of 4 · 💥 The Logic Break",
        headline: "Internal diagnostics leak straight to the client",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 1,
        packetText: "HTTP 500 + Stack Trace",
        body: "The framework assumes only internal software engineers will ever trigger runtime crashes. It prints local filesystem paths, environment variables, and SQL queries directly into the HTTP response.",
        takeaway: "Developer conveniences in development become critical intelligence leaks in production."
      },
      {
        tag: "Slide 4 of 4 · 🛡️ The Defense",
        headline: "Generic errors for the public, detailed logs for developers",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "HTTP 404 + Incident ID",
        body: "Production servers must disable debug mode and catch unhandled exceptions globally. The application renders a friendly generic error while writing the full diagnostic stack to a secure, private logging service.",
        takeaway: "Never allow technical diagnostic details to cross the boundary into user-facing responses."
      }
    ],
    puzzle: {
      question: "10-Second Prediction: What will the server return when this request runs?",
      code: "app.get('/user', (req, res) => {\n  const id = parseInt(req.query.id);\n  res.send(users[id].name);\n}); // What if id is '99999'?",
      options: [
        { text: "A 200 OK response with 'null' as the user name.", correct: false, feedback: "Not quite—users[99999] is undefined, so accessing .name throws a runtime exception." },
        { text: "A TypeError crash trying to read '.name' of undefined, leaking a stack trace if debug is on.", correct: true, feedback: "Spot on! Because undefined.name throws an unhandled TypeError, leaking internal server code paths." },
        { text: "The server redirects to the login screen automatically.", correct: false, feedback: "Actually, web frameworks do not auto-redirect on uncaught reference errors." }
      ]
    },
    connections: [
      {
        clue: "👁️ What You Notice: An unhandled 500 error prints file paths like /var/www/ecommerce/models/db.py.",
        mechanism: "⚙️ What It Means on the Server: Framework debug flags (such as Django DEBUG=True or Flask debug mode) are active in production.",
        nextMove: "🎯 How to Verify: Check for known debug consoles like /console or explore error triggering on other endpoints."
      },
      {
        clue: "👁️ What You Notice: A web page comments out internal API keys or developer notes in HTML comments (<!-- TODO: key=xyz -->).",
        mechanism: "⚙️ What It Means on the Server: Developers used public comments for internal notes rather than server-side templates.",
        nextMove: "🎯 How to Verify: Review page source, client-side JS bundles, and sourcemaps (.js.map) for forgotten staging credentials."
      },
      {
        clue: "👁️ What You Notice: Requesting /.git/HEAD returns 'ref: refs/heads/main'.",
        mechanism: "⚙️ What It Means on the Server: The .git repository folder was copied directly to the public web root during deployment.",
        nextMove: "🎯 How to Verify: Use git dumpers to reconstruct project history, commits, and past secrets."
      }
    ],
    quiz: [
      {
        q: "Why is a verbose stack trace considered a high-risk security issue even if it does not directly execute code?",
        options:
          [
            { text: "It reveals exact directory paths, library versions, and database schemas that make subsequent targeted exploits trivial.", correct: true, why: "Correct! Information disclosure turns black-box testing into white-box analysis for an attacker." },
            { text: "It slows down the server's network connection by sending too many characters.", correct: false, why: "Remember that the danger lies in leaked architectural details, not response size." }
          ]
      },
      {
        q: "What is the recommended best practice for handling runtime application exceptions in production?",
        options:
          [
            { text: "Log detailed traces to private internal monitors and show the user a uniform, generic error page with a tracking ID.", correct: true, why: "Spot on! The user receives zero sensitive information while engineering retains complete forensic data." },
            { text: "Display the exact SQL query so legitimate users can troubleshoot database connectivity issues.", correct: false, why: "Remember that exposing SQL queries gives attackers exact database table and column structures." }
          ]
      }
    ]
  },

  'path-traversal': {
    sandbox: {
      title: "Live Request & Server X-Ray Simulator",
      prompt: "Click a test action below (or toggle Safe Defense Mode) and observe how the server processes your input:",
      inputLabel: "Parameter / Input",
      presets: [
        {
          label: "1. Normal Request",
          input: "filename=jacket.png",
          http: "GET /image?filename=jacket.png HTTP/1.1\nHost: target.com",
          serverDevBefore: "fs.readFileSync(\"/var/www/images/\" + ",
          serverInput: "\"jacket.png\"",
          serverDevAfter: ");",
          commentedOut: false,
          status: "200 OK · Normal Response",
          statusType: "normal",
          responsePreview: "[Image binary data: PNG 640x480]",
          aha: "The server appends the requested filename to the base image directory. Because the file exists in that folder, it reads the image and returns binary image data.",
          safeServerView: "const base = '/var/www/images/';\nconst safePath = path.resolve(base, req.query.filename);\nif (!safePath.startsWith(base)) return res.status(403).send('Forbidden');",
          safeStatus: "200 OK · Safe & Validated",
          safeAha: "Path canonicalization checks that the resolved absolute path still begins within the allowed images directory."
        },
        {
          label: "2. Anomaly Probe",
          input: "filename=not_real.png",
          http: "GET /image?filename=not_real.png HTTP/1.1\nHost: target.com",
          serverDevBefore: "fs.readFileSync(\"/var/www/images/\" + ",
          serverInput: "\"not_real.png\"",
          serverDevAfter: ");",
          commentedOut: false,
          status: "404 Not Found · Missing File",
          statusType: "error",
          responsePreview: "Error: ENOENT: no such file or directory, open '/var/www/images/not_real.png'",
          aha: "Requesting a non-existent file produces a standard filesystem missing file error. This confirms the application directly queries the server's local disk.",
          safeServerView: "if (!fs.existsSync(safePath)) return res.status(404).send('File not found');",
          safeStatus: "404 Not Found · Graceful Error",
          safeAha: "Handling missing files gracefully prevents leaking internal folder structures in error messages."
        },
        {
          label: "3. Logic Break",
          input: "filename=../../../etc/passwd",
          http: "GET /image?filename=../../../etc/passwd HTTP/1.1\nHost: target.com",
          serverDevBefore: "fs.readFileSync(\"/var/www/images/\" + ",
          serverInput: "\"../../../etc/passwd\"",
          serverDevAfter: ");",
          commentedOut: false,
          status: "200 OK · Arbitrary File Read",
          statusType: "bypass",
          responsePreview: "root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin...",
          aha: "Each '../' sequence steps upward out of '/var/www/images/' until reaching the filesystem root. The OS resolves the path directly to '/etc/passwd' and returns sensitive system accounts.",
          safeServerView: "const safePath = path.resolve(base, req.query.filename);\nif (!safePath.startsWith(base)) throw new SecurityException('Traversal attempt');",
          safeStatus: "403 Forbidden · Traversal Blocked",
          safeAha: "Canonical path verification detects the path climbed outside the base directory and halts execution."
        },
        {
          label: "4. Edge Case Variation",
          input: "filename=....//....//....//etc/passwd",
          http: "GET /image?filename=....//....//....//etc/passwd HTTP/1.1\nHost: target.com",
          serverDevBefore: "const clean = req.query.filename.replace(/\\.\\.\\//g, '');\nfs.readFileSync(\"/var/www/images/\" + ",
          serverInput: "clean",
          serverDevAfter: ");",
          commentedOut: false,
          status: "200 OK · Nested Filter Bypass",
          statusType: "bypass",
          responsePreview: "root:x:0:0:root:/root:/bin/bash\nbin:x:2:2:bin:/bin:/usr/sbin/nologin...",
          aha: "When a naive defense strips '../' only once non-recursively, '....//' collapses into '../' after the inner sequence is removed. The stripped output rebuilds the exact traversal string the developer tried to block.",
          safeServerView: "const safeId = ALLOWED_IMAGES_MAP[req.query.id]; // Use indirect lookups instead of filenames",
          safeStatus: "400 Bad Request · Invalid ID",
          safeAha: "Using indirect reference maps or strict alphanumeric filename allowlists completely eliminates traversal vectors."
        }
      ]
    },
    story: [
      {
        tag: "Slide 1 of 4 · 🔎 The Browser Clue",
        headline: "An image parameter specifies filenames directly",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 0,
        packetText: "filename=jacket.png",
        body: "You notice an image tag pointing to a backend endpoint like /image?filename=jacket.png. Parameters holding raw filenames often indicate direct filesystem access behind the scenes.",
        takeaway: "Any parameter that takes a filename might be reading raw files from the underlying operating system."
      },
      {
        tag: "Slide 2 of 4 · ⚙️ The Server Action",
        headline: "The server glues the filename to a base folder",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "/var/www/images/ + input",
        body: "The backend takes the incoming string and concatenates it to a hardcoded directory path. It passes the resulting combined path straight to the filesystem reader without checking where it leads.",
        takeaway: "Filesystems blindly follow path commands unless the application explicitly restricts them."
      },
      {
        tag: "Slide 3 of 4 · 💥 The Logic Break",
        headline: "Dot-dot-slash climbs out of the application root",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 3,
        packetText: "../../../etc/passwd",
        body: "Supplying ../ tells the operating system to move up one folder level. By chaining multiple traversal steps, the path walks past /var/www/ all the way to /etc/passwd.",
        takeaway: "Path resolution happens at the OS level, bypassing developers who only think about web folders."
      },
      {
        tag: "Slide 4 of 4 · 🛡️ The Defense",
        headline: "Canonicalize paths and verify the folder boundary",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "path.resolve() validation",
        body: "Developers resolve the canonical absolute path and assert that it begins with the allowed base folder. Alternatively, referencing files by database IDs prevents client control over filesystem paths entirely.",
        takeaway: "Never trust client-supplied strings to navigate filesystem trees directly."
      }
    ],
    puzzle: {
      question: "10-Second Prediction: What happens when filename.replace('../', '') runs on '....//etc/passwd'?",
      code: "let file = '....//etc/passwd';\nfile = file.replace('../', ''); // Removes one instance\nfs.readFileSync('/var/www/' + file);",
      options: [
        { text: "The file path becomes '/var/www//etc/passwd' and triggers a 404 error.", correct: false, feedback: "Not quite—removing '../' from '....//' leaves the remaining '../' characters intact." },
        { text: "The inner '../' is deleted, leaving '../etc/passwd' which traverses up to '/var/www/../etc/passwd'.", correct: true, feedback: "Spot on! The nested pattern collapses into an active traversal string after the single-pass strip." },
        { text: "The JavaScript runtime throws an UnhandledRegexException.", correct: false, feedback: "Actually, string.replace with a literal string runs normally without throwing exceptions." }
      ]
    },
    connections: [
      {
        clue: "👁️ What You Notice: An image or download URL takes a filename parameter like ?file=report.pdf.",
        mechanism: "⚙️ What It Means on the Server: The server uses local disk I/O instead of a cloud object store or database blob.",
        nextMove: "🎯 How to Verify: Test if ?file=../../../etc/passwd or ?file=..\\..\\..\\windows\\win.ini returns system files."
      },
      {
        clue: "👁️ What You Notice: The application blocks '../' but accepts '..%2f' or '%252e%252e%252f'.",
        mechanism: "⚙️ What It Means on the Server: The web framework decodes URL entities after the application's validation filter ran.",
        nextMove: "🎯 How to Verify: Use single and double URL-encoded slashes to bypass naive regex filters."
      },
      {
        clue: "👁️ What You Notice: The server requires filenames to end with .png (e.g. filename=avatar.png).",
        mechanism: "⚙️ What It Means on the Server: The code checks file extensions with endsWith('.png') before loading.",
        nextMove: "🎯 How to Verify: In older runtimes, test null byte injection (filename=../../../etc/passwd%00.png) or path truncation."
      }
    ],
    quiz: [
      {
        q: "Why does a single non-recursive replace('../', '') filter fail against path traversal attacks?",
        options:
          [
            { text: "Attackers can nest the sequence as '....//', which collapses back into '../' when the middle characters are stripped.", correct: true, why: "Correct! Stripping a non-recursive substring from nested sequences regenerates the forbidden sequence." },
            { text: "Operating systems automatically interpret single dots as double dots.", correct: false, why: "Remember that the bypass happens in application string manipulation, not OS dot handling." }
          ]
      },
      {
        q: "What is the most robust programmatic defense against directory traversal when reading files?",
        options:
          [
            { text: "Resolve the canonical absolute path and verify it starts with the designated root directory, or use indirect IDs.", correct: true, why: "Spot on! Canonical path validation mathematically ensures the file resides inside the allowed directory." },
            { text: "Filter out the word 'passwd' from incoming request parameters.", correct: false, why: "Remember that blocklisting specific filenames leaves thousands of other sensitive files vulnerable." }
          ]
      }
    ]
  },

  'essential-skills': {
    sandbox: {
      title: "Live Request & Server X-Ray Simulator",
      prompt: "Click a test action below (or toggle Safe Defense Mode) and observe how the server processes your input:",
      inputLabel: "Parameter / Input",
      presets: [
        {
          label: "1. Normal Request",
          input: "{\"filter\": \"shoes\", \"limit\": 10}",
          http: "POST /api/products HTTP/1.1\nContent-Type: application/json\n\n{\"filter\": \"shoes\", \"limit\": 10}",
          serverDevBefore: "const { filter, limit } = req.body;\nconst items = await db.search(",
          serverInput: "filter, limit",
          serverDevAfter: ");",
          commentedOut: false,
          status: "200 OK · Baseline (42ms, 12 items)",
          statusType: "normal",
          responsePreview: "{\"status\": \"success\", \"count\": 12, \"items\": [{\"id\": 1, \"name\": \"Running Shoes\"}...]}",
          aha: "Observing a clean baseline response establishes the normal round-trip latency, HTTP status code, and payload structure. Without a known baseline, you cannot identify subtle server anomalies.",
          safeServerView: "const schema = Joi.object({ filter: Joi.string().alphanum(), limit: Joi.number().max(50) });\nschema.validate(req.body);",
          safeStatus: "200 OK · Schema Validated",
          safeAha: "Rigid schema validation guarantees that incoming requests adhere to strict type and format contracts."
        },
        {
          label: "2. Anomaly Probe",
          input: "{\"filter\": \"shoes'\", \"limit\": 10}",
          http: "POST /api/products HTTP/1.1\nContent-Type: application/json\n\n{\"filter\": \"shoes'\", \"limit\": 10}",
          serverDevBefore: "const { filter, limit } = req.body;\nconst items = await db.search(",
          serverInput: "\"shoes'\"",
          serverDevAfter: ");",
          commentedOut: false,
          status: "500 Internal Server Error · Anomaly (45ms)",
          statusType: "error",
          responsePreview: "{\"error\": \"Internal query error occurred during item retrieval\"}",
          aha: "Injecting a single unexpected character breaks the parser and flips the response from 200 to 500. This subtle difference confirms the input reaches an unescaped query processor.",
          safeServerView: "await db.searchWithParams(filter, limit); // Parameterized query prevents syntax crash",
          safeStatus: "200 OK · Clean Handled (0 items)",
          safeAha: "Parameterized queries handle quotes as literal characters without crashing the database engine."
        },
        {
          label: "3. Logic Break",
          input: "{\"filter\": \"shoes'--\", \"limit\": 10}",
          http: "POST /api/products HTTP/1.1\nContent-Type: application/json\n\n{\"filter\": \"shoes'--\", \"limit\": 10}",
          serverDevBefore: "const items = await db.rawQuery(\"SELECT * FROM products WHERE tag = '\" + ",
          serverInput: "\"shoes'--\"",
          serverDevAfter: "' AND active = 1\");",
          commentedOut: true,
          status: "200 OK · Differential Match (40ms, 12 items)",
          statusType: "bypass",
          responsePreview: "{\"status\": \"success\", \"count\": 12, \"items\": [{\"id\": 1, \"name\": \"Running Shoes\"}...]}",
          aha: "Repairing the SQL syntax with a comment marker restores the 200 OK response and original item count. The diagnostic comparison between broken (500) and fixed (200) proves code injection exists.",
          safeServerView: "await db.execute('SELECT * FROM products WHERE tag = ? AND active = 1', [filter]);",
          safeStatus: "200 OK · Parameter Safe",
          safeAha: "Bound parameters evaluate the comment characters as literal search text rather than SQL syntax."
        },
        {
          label: "4. Edge Case Variation",
          input: "{\"filter\": {\"$ne\": null}, \"limit\": 10}",
          http: "POST /api/products HTTP/1.1\nContent-Type: application/json\n\n{\"filter\": {\"$ne\": null}, \"limit\": 10}",
          serverDevBefore: "const filter = req.body.filter;\nconst items = await db.collection('products').find({ tag: ",
          serverInput: "{\"$ne\": null}",
          serverDevAfter: "});",
          commentedOut: false,
          status: "200 OK · Type Confusion (150 items returned)",
          statusType: "bypass",
          responsePreview: "{\"status\": \"success\", \"count\": 150, \"items\": [{\"id\": 1, \"secret_notes\": \"internal\"}...]}",
          aha: "Replacing a primitive string with a nested query object triggers type confusion in NoSQL document parsers. The server queries all records where tag is not null, dumping the full database.",
          safeServerView: "if (typeof req.body.filter !== 'string') return res.status(400).send('Invalid type');",
          safeStatus: "400 Bad Request · Rejected Type",
          safeAha: "Enforcing explicit primitive type checks stops object injection and parameter tampering cold."
        }
      ]
    },
    story: [
      {
        tag: "Slide 1 of 4 · 🔎 The Browser Clue",
        headline: "Map every parameter and establish normal behavior",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 0,
        packetText: "Normal baseline request",
        body: "Before testing for flaws, an investigator documents the expected HTTP status, response size, and latency. Knowing how the application behaves normally is essential for spotting anomalies.",
        takeaway: "You cannot identify abnormal behavior until you know what normal looks like."
      },
      {
        tag: "Slide 2 of 4 · ⚙️ The Server Action",
        headline: "Send a minimal, surgical probe to trigger a reaction",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 1,
        packetText: "Probe with 1 character",
        body: "Rather than running a noisy, indiscriminate scanner, you send a single discriminating character like a single quote, bracket, or type change. You monitor how the server's backend parser reacts.",
        takeaway: "Small, precise probes reveal the exact parser without triggering rate limits or defensive bans."
      },
      {
        tag: "Slide 3 of 4 · 💥 The Logic Break",
        headline: "Compare the delta between baseline and probe",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "Status 200 vs 500 delta",
        body: "When a probe changes the server's response—such as jumping from 200 to 500, or pausing for 200ms—the server reveals its internal technology stack. The difference is your signal.",
        takeaway: "Server discrepancies between two nearly identical requests diagnose backend architecture."
      },
      {
        tag: "Slide 4 of 4 · 🛡️ The Defense",
        headline: "Enforce strict schemas and uniform error responses",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "Schema validation guard",
        body: "Defenders protect systems by validating all input against strict types, formats, and lengths at the application boundary. Global error handlers ensure failures return uniform responses that leak no clues.",
        takeaway: "A well-architected system treats unexpected inputs uniformly without leaking parser state."
      }
    ],
    puzzle: {
      question: "10-Second Prediction: What conclusion should a tester draw from these three responses?",
      code: "Request A: search=hats   -> HTTP 200 OK (Content-Length: 4520, Time: 35ms)\nRequest B: search=hats'  -> HTTP 500 Internal Error (Content-Length: 120, Time: 38ms)\nRequest C: search=hats'' -> HTTP 200 OK (Content-Length: 4520, Time: 36ms)",
      options: [
        { text: "The search endpoint is completely safe and properly sanitized.", correct: false, feedback: "Not quite—safe applications don't crash on a single quote and recover on double quotes." },
        { text: "The single quote caused a SQL syntax break, and the paired quote repaired it, confirming SQL injection.", correct: true, feedback: "Spot on! The pairing behavior proves the input is interpolated inside SQL string delimiters." },
        { text: "The server is throttling requests due to high network traffic.", correct: false, feedback: "Actually, 35ms response times rule out network throttling." }
      ]
    },
    connections: [
      {
        clue: "👁️ What You Notice: Modifying an optional JSON parameter from a string to an integer returns a verbose parser error.",
        mechanism: "⚙️ What It Means on the Server: The backend relies on dynamic language reflection without type-safe contract validation.",
        nextMove: "🎯 How to Verify: Test array and object inputs to detect type confusion, mass assignment, or prototype pollution."
      },
      {
        clue: "👁️ What You Notice: A request takes 20ms for common inputs but 2,000ms when sending special characters.",
        mechanism: "⚙️ What It Means on the Server: The input triggers heavy regex backtracking (ReDoS) or an internal backend timeout.",
        nextMove: "🎯 How to Verify: Vary the pattern length linearly to confirm exponential backtracking behavior."
      },
      {
        clue: "👁️ What You Notice: An endpoint responds with HTTP 200 for GET /admin but HTTP 403 when requesting via the web browser.",
        mechanism: "⚙️ What It Means on the Server: The proxy or CDN evaluates access rules based on specific headers or HTTP methods.",
        nextMove: "🎯 How to Verify: Compare header differences between the browser and proxy tool to isolate the bypass."
      }
    ],
    quiz: [
      {
        q: "Why is establishing an accurate baseline the first step in effective web security testing?",
        options:
          [
            { text: "Because spotting vulnerabilities requires measuring subtle deviations in status codes, timing, and response size.", correct: true, why: "Correct! The delta between baseline behavior and probe response is the core diagnostic signal." },
            { text: "Because modern web servers will block connections that don't send a baseline request first.", correct: false, why: "Remember that servers don't require or track 'baseline requests'; this is a tester's methodology." }
          ]
      },
      {
        q: "What does a tester confirm when param' errors out, but param'' returns normal output?",
        options:
          [
            { text: "The parameter is concatenated into a SQL string where paired quotes escape the syntax error.", correct: true, why: "Spot on! Paired quotes escaping the string syntax is classic confirmation of SQL injection." },
            { text: "The web application firewall requires double quotes for all search terms.", correct: false, why: "Remember that WAFs do not require paired quotes to permit SQL queries." }
          ]
      }
    ]
  },

  'authentication': {
    sandbox: {
      title: "Live Request & Server X-Ray Simulator",
      prompt: "Click a test action below (or toggle Safe Defense Mode) and observe how the server processes your input:",
      inputLabel: "Parameter / Input",
      presets: [
        {
          label: "1. Normal Request",
          input: "username=wiener&password=peter",
          http: "POST /login HTTP/1.1\nHost: target.com\n\nusername=wiener&password=peter",
          serverDevBefore: "const user = await db.findUser(username);\nif (user && await bcrypt.compare(password, user.hash)) {\n  ",
          serverInput: "\"wiener\", \"peter\"",
          serverDevAfter: "\n  issueSession(res, user);\n}",
          commentedOut: false,
          status: "302 Found · Login Success",
          statusType: "normal",
          responsePreview: "Redirecting to /my-account with Set-Cookie: session=xyz...",
          aha: "When valid credentials are provided, password verification succeeds and the server issues a session cookie. This is the intended happy path for authenticated users.",
          safeServerView: "const valid = await authService.authenticate(username, password);\nif (valid) issueSession(res, user);",
          safeStatus: "302 Found · Authenticated",
          safeAha: "Centralized authentication services maintain consistent state machines across all login flows."
        },
        {
          label: "2. Anomaly Probe",
          input: "username=unknown_user_99&password=wrong",
          http: "POST /login HTTP/1.1\nHost: target.com\n\nusername=unknown_user_99&password=wrong",
          serverDevBefore: "const user = await db.findUser(username);\nif (!user) return res.send(",
          serverInput: "\"Invalid username\"",
          serverDevAfter: ");",
          commentedOut: false,
          status: "200 OK · Distinct Error (8ms)",
          statusType: "error",
          responsePreview: "<div class='error'>Invalid username</div>",
          aha: "The server explicitly tells the visitor that the username does not exist. An attacker can submit a list of names and instantly harvest a list of real employee accounts.",
          safeServerView: "if (!user) {\n  await dummyHashCompare();\n  return res.send('Invalid username or password');\n}",
          safeStatus: "200 OK · Constant Time Error",
          safeAha: "Returning uniform error messages and computing dummy hashes eliminates both verbal and timing leaks."
        },
        {
          label: "3. Logic Break",
          input: "username=carlos&password=wrong",
          http: "POST /login HTTP/1.1\nHost: target.com\n\nusername=carlos&password=wrong",
          serverDevBefore: "const user = await db.findUser(username);\nif (!await bcrypt.compare(password, user.hash)) return res.send(",
          serverInput: "\"Incorrect password\"",
          serverDevAfter: ");",
          commentedOut: false,
          status: "200 OK · Timing & Message Oracle (185ms)",
          statusType: "bypass",
          responsePreview: "<div class='error'>Incorrect password</div>",
          aha: "Because carlos exists, the server executes bcrypt hashing (taking 185ms) and outputs 'Incorrect password'. This double confirmation guarantees the account is valid, narrowing attacks to just password cracking.",
          safeServerView: "return res.send('Invalid username or password'); // Constant-time evaluation",
          safeStatus: "200 OK · Masked Identity",
          safeAha: "Using identical failure messages prevents attackers from confirming whether accounts exist."
        },
        {
          label: "4. Edge Case Variation",
          input: "X-Forwarded-For: 198.51.100.24",
          http: "POST /login HTTP/1.1\nHost: target.com\nX-Forwarded-For: 198.51.100.24\n\nusername=carlos&password=guess",
          serverDevBefore: "const clientIp = req.headers['x-forwarded-for'] || req.ip;\nif (loginAttempts[clientIp] > 5) return res.status(",
          serverInput: "429",
          serverDevAfter: ");",
          commentedOut: false,
          status: "200 OK · Rate Limit IP Bypass",
          statusType: "bypass",
          responsePreview: "<div class='error'>Invalid username or password</div> (Attempt allowed!)",
          aha: "When IP rate limits rely on spoofable client headers like X-Forwarded-For, rotating the header IP on each request bypasses the lockout threshold entirely.",
          safeServerView: "const clientIp = req.socket.remoteAddress;\nlockoutByAccount(username);",
          safeStatus: "429 Too Many Requests · Account Locked",
          safeAha: "Binding rate limits to verified socket IPs and account usernames prevents header spoofing bypasses."
        }
      ]
    },
    story: [
      {
        tag: "Slide 1 of 4 · 🔎 The Browser Clue",
        headline: "Notice subtle variations in failed login messages",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 0,
        packetText: "username=alice vs bob",
        body: "You test login attempts with different usernames. The application returns 'Invalid username' for non-existent users, but switches to 'Incorrect password' for real accounts.",
        takeaway: "Different error messages for missing users vs. wrong passwords leak valid usernames."
      },
      {
        tag: "Slide 2 of 4 · ⚙️ The Server Action",
        headline: "The server branches execution based on user existence",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "if (!user) vs bcrypt()",
        body: "When a username isn't in the database, the server returns immediately. When the user exists, it executes an expensive password hashing algorithm like bcrypt that takes hundreds of milliseconds.",
        takeaway: "Password hashing is intentionally slow, making missing-user lookups dramatically faster."
      },
      {
        tag: "Slide 3 of 4 · 💥 The Logic Break",
        headline: "Attackers isolate valid accounts through timing and clues",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 1,
        packetText: "10ms vs 200ms timing delta",
        body: "Even if error text is identical, measuring response latency reveals which accounts undergo bcrypt hashing. Attackers enumerate every valid user on the platform before launching targeted password attacks.",
        takeaway: "Timing differences turn the login handler into an unwitting account verification oracle."
      },
      {
        tag: "Slide 4 of 4 · 🛡️ The Defense",
        headline: "Enforce generic messages and constant-time hashing",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "Uniform error + dummy hash",
        body: "Servers must return a single generic message: 'Invalid username or password'. When a username is not found, the server should run a dummy hash comparison so every request takes the exact same time.",
        takeaway: "Consistent error messaging and constant-time execution eliminate enumeration channels."
      }
    ],
    puzzle: {
      question: "10-Second Prediction: Why does a login endpoint take 12ms for 'root' but 210ms for 'admin'?",
      code: "async function login(user, pass) {\n  const row = await db.find(user);\n  if (!row) return 'Fail';\n  return (await argon2.verify(row.hash, pass)) ? 'OK' : 'Fail';\n}",
      options: [
        { text: "The database table is corrupted and took longer to search for 'admin'.", correct: false, feedback: "Not quite—simple index lookups on primary keys take less than 1ms." },
        { text: "'root' was not found in the DB (exiting in 12ms), while 'admin' was found and underwent argon2 hashing (210ms).", correct: true, feedback: "Spot on! The presence of the user triggered the heavy argon2 verification step." },
        { text: "The server throttled 'admin' because it is a reserved administrative name.", correct: false, feedback: "Actually, argon2 is designed to consume CPU cycles, explaining the exact delay." }
      ]
    },
    connections: [
      {
        clue: "👁️ What You Notice: Submitting a password reset request displays 'Email sent' only when the email exists in the database.",
        mechanism: "⚙️ What It Means on the Server: The password reset controller branches output based on query results.",
        nextMove: "🎯 How to Verify: Test valid and invalid email addresses to confirm account enumeration."
      },
      {
        clue: "👁️ What You Notice: After 3 failed logins, the server returns 429 Too Many Requests, but adding X-Forwarded-For: 1.2.3.4 resets the counter.",
        mechanism: "⚙️ What It Means on the Server: The rate limiting middleware trusts client-controlled proxy headers.",
        nextMove: "🎯 How to Verify: Automate credential stuffing while injecting random pseudo-IPs in proxy headers."
      },
      {
        clue: "👁️ What You Notice: Browsing directly to /admin/dashboard redirects to /login, but the response body still includes admin HTML before the redirect.",
        mechanism: "⚙️ What It Means on the Server: The code sends a redirect header but forgot to call return or exit(), continuing execution.",
        nextMove: "🎯 How to Verify: Inspect the raw HTTP response in Burp Suite to see if protected content was sent before the redirect."
      }
    ],
    quiz: [
      {
        q: "How can an attacker identify valid usernames even if the login form displays the exact same error message for every failure?",
        options:
          [
            { text: "By measuring response timing, since existing users trigger computationally heavy password hashing algorithms.", correct: true, why: "Correct! The execution time of password hashing algorithms like bcrypt creates a measurable oracle." },
            { text: "By checking the browser's local cache for session tokens.", correct: false, why: "Remember that failed login attempts do not create or cache session tokens." }
          ]
      },
      {
        q: "What is the proper defense against username enumeration through response timing?",
        options:
          [
            { text: "Compute a dummy password hash even when the user does not exist so every response takes equal time.", correct: true, why: "Spot on! Performing dummy work ensures constant-time execution across both paths." },
            { text: "Disable password hashing algorithms in favor of plain text lookups.", correct: false, why: "Remember that storing and verifying passwords in plain text is a disastrous security violation." }
          ]
      }
    ]
  },

  'access-control-vulnerabilities': {
    sandbox: {
      title: "Live Request & Server X-Ray Simulator",
      prompt: "Click a test action below (or toggle Safe Defense Mode) and observe how the server processes your input:",
      inputLabel: "Parameter / Input",
      presets: [
        {
          label: "1. Normal Request",
          input: "GET /my-account?id=wiener",
          http: "GET /my-account?id=wiener HTTP/1.1\nHost: target.com\nCookie: session=wiener_session",
          serverDevBefore: "const sessionUser = getSession(req.cookies.session);\nconst account = await db.getUser(",
          serverInput: "req.query.id",
          serverDevAfter: ");",
          commentedOut: false,
          status: "200 OK · Own Account Loaded",
          statusType: "normal",
          responsePreview: "Welcome wiener! Your API Key: w13n3r_k3y_9812",
          aha: "The authenticated user requests their own profile ID. The server reads the ID from the URL, queries the database, and renders their private account details.",
          safeServerView: "const account = await db.getUser(sessionUser.id); // Read identity strictly from session",
          safeStatus: "200 OK · Session Bound",
          safeAha: "Querying records based on verified session context eliminates reliance on client parameters."
        },
        {
          label: "2. Anomaly Probe",
          input: "GET /my-account?id=carlos",
          http: "GET /my-account?id=carlos HTTP/1.1\nHost: target.com\nCookie: session=wiener_session",
          serverDevBefore: "const sessionUser = getSession(req.cookies.session);\nconst account = await db.getUser(",
          serverInput: "\"carlos\"",
          serverDevAfter: ");",
          commentedOut: false,
          status: "200 OK · Horizontal Escalation (IDOR)",
          statusType: "bypass",
          responsePreview: "Welcome carlos! Your API Key: c4rl0s_s3cr3t_7721",
          aha: "The server verified that user wiener had a valid login cookie, but blindly fetched whichever user ID was passed in the URL. Carlos's private API key is leaked to Wiener.",
          safeServerView: "if (sessionUser.id !== req.query.id && !sessionUser.isAdmin) {\n  return res.status(403).send('Forbidden');\n}",
          safeStatus: "403 Forbidden · Access Denied",
          safeAha: "Enforcing explicit ownership checks prevents users from accessing records belonging to others."
        },
        {
          label: "3. Logic Break",
          input: "GET /admin/delete-user?user=carlos",
          http: "GET /admin/delete-user?user=carlos HTTP/1.1\nHost: target.com\nCookie: session=wiener_session",
          serverDevBefore: "// Missing role authorization check:\n",
          serverInput: "await db.deleteUser(req.query.user)",
          serverDevAfter: ";\nres.send('User deleted');",
          commentedOut: false,
          status: "200 OK · Vertical Privilege Escalation",
          statusType: "bypass",
          responsePreview: "User carlos successfully deleted from system.",
          aha: "The application relied on 'security through obscurity' by simply not showing the admin link in Wiener's UI. When Wiener requests the URL directly, the backend deletes the user without checking admin privileges.",
          safeServerView: "if (!sessionUser.roles.includes('ADMIN')) {\n  return res.status(403).send('Unauthorized');\n}",
          safeStatus: "403 Forbidden · Role Required",
          safeAha: "Mandatory role-based authorization guards on every endpoint prevent unauthorized actions."
        },
        {
          label: "4. Edge Case Variation",
          input: "Header: X-Original-URL: /admin",
          http: "GET /admin-panel HTTP/1.1\nHost: target.com\nX-Original-URL: /admin",
          serverDevBefore: "const target = req.headers['x-original-url'] || req.url;\n",
          serverInput: "route(target)",
          serverDevAfter: ";",
          commentedOut: false,
          status: "200 OK · Reverse Proxy Header Override",
          statusType: "bypass",
          responsePreview: "<h1>Administrative Control Center</h1><button>Wipe Database</button>",
          aha: "The frontend reverse proxy checks permissions against '/admin-panel' (which is public), while the backend server honors 'X-Original-URL' and routes the request directly to the internal admin console.",
          safeServerView: "// Reverse proxy configuration:\nproxy_set_header X-Original-URL \"\"; // Strip client-supplied routing headers",
          safeStatus: "403 Forbidden · Blocked by Perimeter",
          safeAha: "Stripping override headers at reverse proxy boundaries prevents internal routing manipulation."
        }
      ]
    },
    story: [
      {
        tag: "Slide 1 of 4 · 🔎 The Browser Clue",
        headline: "Notice predictable IDs and parameters in resource URLs",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 0,
        packetText: "id=102 -> id=103",
        body: "You log into an account and see URLs like /account?id=102 or /invoice/4501.pdf. The presence of exposed database keys strongly hints at direct object references.",
        takeaway: "Exposed numeric or predictable IDs in URLs are prime targets for authorization testing."
      },
      {
        tag: "Slide 2 of 4 · ⚙️ The Server Action",
        headline: "The server authenticates the caller but neglects authorization",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "session valid? YES -> fetch(param)",
        body: "The server checks that you have a valid session cookie. Once confirmed, it blindly retrieves whatever record ID you requested from the database without asking: 'Does this session own this data?'",
        takeaway: "Authentication only proves who you are; authorization decides what you can touch."
      },
      {
        tag: "Slide 3 of 4 · 💥 The Logic Break",
        headline: "Any user can access or modify another user's private data",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 3,
        packetText: "Fetch Carlos's private records",
        body: "By incrementing the ID parameter, one customer can view invoices, medical files, or API credentials belonging to anyone on the platform. The browser was trusted to restrict what it asked for.",
        takeaway: "Client-side UI restrictions provide zero protection against direct parameter requests."
      },
      {
        tag: "Slide 4 of 4 · 🛡️ The Defense",
        headline: "Enforce server-side ownership and role checks",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "session.userId === record.ownerId",
        body: "The server must look up sensitive records using the user ID stored directly inside the server-side session object. For shared documents, explicit permission checks must run on every request.",
        takeaway: "Always tie data access directly to the authenticated session context on the server."
      }
    ],
    puzzle: {
      question: "10-Second Prediction: What is the vulnerability in this Express route?",
      code: "app.post('/api/profile/update', authenticateToken, (req, res) => {\n  const { userId, bio } = req.body;\n  db.updateBio(userId, bio);\n  res.send('Updated');\n});",
      options: [
        { text: "It lacks a CSRF token but is completely secure from unauthorized modifications.", correct: false, feedback: "Not quite—it accepts userId straight from the body without verifying session ownership." },
        { text: "Any authenticated user can change anyone else's bio by modifying the userId in the POST body (IDOR).", correct: true, feedback: "Spot on! The route checks authentication, but neglects authorization on who owns userId." },
        { text: "The database query will crash because JSON cannot store strings.", correct: false, feedback: "Actually, JSON strings are standard; the issue is authorization." }
      ]
    },
    connections: [
      {
        clue: "👁️ What You Notice: Inspecting the DOM reveals a hidden button <button style='display:none' href='/admin'>Admin</button>.",
        mechanism: "⚙️ What It Means on the Server: The application hides admin features in CSS rather than enforcing authorization on the backend.",
        nextMove: "🎯 How to Verify: Send a direct HTTP request to /admin to see if the server serves administrative functionality."
      },
      {
        clue: "👁️ What You Notice: An endpoint /api/documents/8912 uses sequential integer IDs.",
        mechanism: "⚙️ What It Means on the Server: The system uses auto-incrementing primary keys directly in public endpoints.",
        nextMove: "🎯 How to Verify: Decrement the ID to 8911 to check if you can view another user's uploaded document."
      },
      {
        clue: "👁️ What You Notice: Accessing /admin returns 403 Forbidden, but sending POST /admin or GET /ADMIN succeeds.",
        mechanism: "⚙️ What It Means on the Server: The access control filter uses case-sensitive regex or checks only GET requests.",
        nextMove: "🎯 How to Verify: Test alternate HTTP verbs (PUT, PATCH, OPTIONS) and URL path encodings."
      }
    ],
    quiz: [
      {
        q: "What is the core conceptual difference between authentication and authorization?",
        options:
          [
            { text: "Authentication verifies who you are; authorization dictates what resources you are allowed to access.", correct: true, why: "Correct! Logging in proves identity (authentication); access control verifies permissions (authorization)." },
            { text: "Authentication applies only to passwords, while authorization applies only to API tokens.", correct: false, why: "Remember that both concepts apply across all credentials, tokens, and sessions." }
          ]
      },
      {
        q: "How can developers effectively eliminate Insecure Direct Object Reference (IDOR) vulnerabilities?",
        options:
          [
            { text: "By retrieving user records using the session's verified identity rather than client-supplied URL parameters.", correct: true, why: "Spot on! Binding resource lookups to server-side session identity guarantees tenant isolation." },
            { text: "By encrypting URL parameters with Base64 encoding.", correct: false, why: "Remember that Base64 is easily decoded and offers zero security." }
          ]
      }
    ]
  },

  'business-logic-vulnerabilities': {
    sandbox: {
      title: "Live Request & Server X-Ray Simulator",
      prompt: "Click a test action below (or toggle Safe Defense Mode) and observe how the server processes your input:",
      inputLabel: "Parameter / Input",
      presets: [
        {
          label: "1. Normal Request",
          input: "productId=1&qty=1&price=133700",
          http: "POST /cart/add HTTP/1.1\nHost: shop.com\n\nproductId=1&qty=1&price=133700",
          serverDevBefore: "const { productId, qty, price } = req.body;\nconst itemTotal = ",
          serverInput: "price * qty",
          serverDevAfter: ";\ncart.total += itemTotal;",
          commentedOut: false,
          status: "200 OK · Cart Total: $1,337.00",
          statusType: "normal",
          responsePreview: "{\"items\": 1, \"cartTotal\": \"$1,337.00\"}",
          aha: "When the client sends the expected product details, the cart calculates the line item total correctly and updates the user's cart.",
          safeServerView: "const product = await db.getProduct(req.body.productId);\ncart.total += product.price * Math.max(1, parseInt(req.body.qty, 10));",
          safeStatus: "200 OK · Server Price Enforced",
          safeAha: "Retrieving the authoritative price from the database prevents client-side price tampering."
        },
        {
          label: "2. Anomaly Probe",
          input: "productId=1&qty=1&price=1",
          http: "POST /cart/add HTTP/1.1\nHost: shop.com\n\nproductId=1&qty=1&price=1",
          serverDevBefore: "const { productId, qty, price } = req.body;\nconst itemTotal = ",
          serverInput: "1 * 1",
          serverDevAfter: ";\ncart.total += itemTotal;",
          commentedOut: false,
          status: "200 OK · Price Tampered: $0.01",
          statusType: "bypass",
          responsePreview: "{\"items\": 1, \"cartTotal\": \"$0.01\"}",
          aha: "The backend trusted the price sent by the client. Changing price from 133700 ($1337) to 1 ($0.01) allows an attacker to purchase luxury items for pennies.",
          safeServerView: "// Ignore req.body.price completely: fetch price from database",
          safeStatus: "200 OK · Database Price Applied ($1,337.00)",
          safeAha: "Never allow client requests to declare prices, discounts, or tax amounts."
        },
        {
          label: "3. Logic Break",
          input: "productId=2&qty=-1",
          http: "POST /cart/add HTTP/1.1\nHost: shop.com\n\nproductId=2&qty=-1",
          serverDevBefore: "const product = await db.getProduct(2); // $10 item\nconst lineCost = product.price * ",
          serverInput: "-1",
          serverDevAfter: ";\ncart.total += lineCost;",
          commentedOut: false,
          status: "200 OK · Cart Reduced by -$10.00",
          statusType: "bypass",
          responsePreview: "{\"items\": 0, \"cartTotal\": \"$0.00 (Free Checkout Available)\"}",
          aha: "Negative numbers are mathematically valid in code, but meaningless in inventory. Multiplying a price by -1 generates a store credit, reducing the total order cost to zero.",
          safeServerView: "if (!Number.isInteger(qty) || qty <= 0 || qty > 99) {\n  throw new Error('Invalid quantity');\n}",
          safeStatus: "400 Bad Request · Positive Quantities Only",
          safeAha: "Enforcing domain rules that quantities must be positive integers prevents mathematical exploits."
        },
        {
          label: "4. Edge Case Variation",
          input: "code=PROMO20 (Sent 6 times)",
          http: "POST /coupon/apply HTTP/1.1\nHost: shop.com\n\ncode=PROMO20",
          serverDevBefore: "if (isValidCoupon(code)) {\n  cart.discountPercentage += ",
          serverInput: "20",
          serverDevAfter: ";\n}",
          commentedOut: false,
          status: "200 OK · 120% Discount Applied",
          statusType: "bypass",
          responsePreview: "{\"discount\": \"120%\", \"finalPrice\": \"$0.00 + $20 Store Credit\"}",
          aha: "The coupon handler verified that 'PROMO20' was a valid promo code, but never checked if the user had already applied it to the active cart. Replaying the request stacks discounts infinitely.",
          safeServerView: "if (cart.appliedCoupons.has(code)) {\n  return res.status(400).send('Coupon already used');\n}",
          safeStatus: "400 Bad Request · Coupon Already Used",
          safeAha: "Tracking applied promotions in session state stops discount stacking loops."
        }
      ]
    },
    story: [
      {
        tag: "Slide 1 of 4 · 🔎 The Browser Clue",
        headline: "Intercepting requests reveals business assumptions",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 0,
        packetText: "Intercept cart/checkout parameters",
        body: "Websites frequently pass crucial business parameters like item quantities, pricing tiers, and applied discounts through client-side form fields or JSON bodies.",
        takeaway: "Every parameter sent from the browser is editable, regardless of UI limits."
      },
      {
        tag: "Slide 2 of 4 · ⚙️ The Server Action",
        headline: "The server performs math on untrusted inputs",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "total = price * quantity",
        body: "The backend processes the calculation using the values submitted by the browser. If the code assumes quantities are always positive and prices are non-negotiable, it skips validation checks.",
        takeaway: "Computers execute mathematical operations blindly without understanding business context."
      },
      {
        tag: "Slide 3 of 4 · 💥 The Logic Break",
        headline: "Negative numbers and replayed codes break the business model",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 3,
        packetText: "Negative quantity = negative cost",
        body: "Submitting a negative quantity subtracts money from the shopping cart total, or reapplying a single coupon code stacks discounts to 100%. The business loses revenue while the code reports success.",
        takeaway: "Logic flaws occur when software operates correctly according to code, but violates business intent."
      },
      {
        tag: "Slide 4 of 4 · 🛡️ The Defense",
        headline: "Validate business invariants and enforce server-side truth",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "Enforce positive integers & DB prices",
        body: "Always retrieve prices and item rules from authoritative database records. Enforce strict validation rules (positive non-zero integers, maximum limits, single-use coupons) on every transaction.",
        takeaway: "Software must explicitly enforce business rules that human clerks take for granted."
      }
    ],
    puzzle: {
      question: "10-Second Prediction: What happens if a user transfers money using amount = -500?",
      code: "function transfer(fromUser, toUser, amount) {\n  if (fromUser.balance >= amount) {\n    fromUser.balance -= amount;\n    toUser.balance += amount;\n  }\n}",
      options: [
        { text: "The transfer fails because the server throws a NegativeNumberException.", correct: false, feedback: "Not quite—standard numbers in JavaScript don't throw exceptions for negatives." },
        { text: "The condition passes (balance >= -500), taking $500 from toUser and adding $500 to fromUser.", correct: true, feedback: "Spot on! Subtracting a negative number adds funds, reversing the direction of the transfer." },
        { text: "The database automatically converts negative numbers to absolute values.", correct: false, feedback: "Actually, SQL engines perform signed arithmetic as specified by the application." }
      ]
    },
    connections: [
      {
        clue: "👁️ What You Notice: A multi-step checkout workflow has distinct endpoints: /step1-cart, /step2-pay, /step3-confirm.",
        mechanism: "⚙️ What It Means on the Server: The application state machine might not verify completion of step 2 before allowing step 3.",
        nextMove: "🎯 How to Verify: Skip /step2-pay and send a direct POST to /step3-confirm to see if orders finalize without payment."
      },
      {
        clue: "👁️ What You Notice: A gift card code reduces the cart by $10, and submitting it again reduces it by another $10.",
        mechanism: "⚙️ What It Means on the Server: The redemption logic lacks an atomic transaction flag marking the gift card as claimed.",
        nextMove: "🎯 How to Verify: Send concurrent requests (race condition) to redeem a single coupon multiple times."
      },
      {
        clue: "👁️ What You Notice: An item price field is included in the HTTP POST body when adding items to your cart.",
        mechanism: "⚙️ What It Means on the Server: The backend calculates financial totals using untrusted client data.",
        nextMove: "🎯 How to Verify: Change the price to 0 or 1 and attempt checkout."
      }
    ],
    quiz: [
      {
        q: "Why do automated vulnerability scanners frequently fail to detect business logic vulnerabilities?",
        options:
          [
            { text: "Because the code produces valid syntax and status 200 responses, but violates specific application business rules that scanners cannot know.", correct: true, why: "Correct! Scanners check technical syntax deviations, whereas logic flaws violate domain-specific semantics." },
            { text: "Because scanners only work on desktop applications, not web apps.", correct: false, why: "Remember that modern scanners are built specifically for web apps, but lack business context." }
          ]
      },
      {
        q: "What is the golden rule for handling financial parameters (prices, discounts, taxes) in web applications?",
        options:
          [
            { text: "Never trust client-supplied figures; always query authoritative prices from the database on the server.", correct: true, why: "Spot on! The server must be the single source of financial truth." },
            { text: "Obfuscate price fields in JavaScript before sending them to the backend.", correct: false, why: "Remember that client-side obfuscation can be easily decoded and bypassed in a proxy." }
          ]
      }
    ]
  },

  'oauth-authentication': {
    sandbox: {
      title: "Live Request & Server X-Ray Simulator",
      prompt: "Click a test action below (or toggle Safe Defense Mode) and observe how the server processes your input:",
      inputLabel: "Parameter / Input",
      presets: [
        {
          label: "1. Normal Request",
          input: "redirect_uri=https://store.com/callback",
          http: "GET /auth?client_id=store_app&redirect_uri=https://store.com/callback&response_type=code HTTP/1.1\nHost: oauth-provider.com",
          serverDevBefore: "if (client.redirectUris.includes(",
          serverInput: "req.query.redirect_uri",
          serverDevAfter: ")) res.redirect(redirectUri + \"?code=\" + authCode);",
          commentedOut: false,
          status: "302 Found · Legitimate OAuth Code Issued",
          statusType: "normal",
          responsePreview: "Redirecting to https://store.com/callback?code=AUTH_CODE_SECRET...",
          aha: "When the redirect_uri exactly matches the registered callback list, the authorization server appends the secret authorization code and redirects the browser back to the application.",
          safeServerView: "const exactMatch = client.registeredUris.find(uri => uri === req.query.redirect_uri);\nif (!exactMatch) return res.status(400).send('Invalid Redirect URI');",
          safeStatus: "302 Found · Valid Callback",
          safeAha: "Enforcing strict exact string matching prevents redirect manipulation."
        },
        {
          label: "2. Anomaly Probe",
          input: "redirect_uri=https://store.com/callback/../evil.com",
          http: "GET /auth?...&redirect_uri=https://store.com/callback/../evil.com HTTP/1.1\nHost: oauth-provider.com",
          serverDevBefore: "// Flawed regex: check if string starts with https://store.com\nif (req.query.redirect_uri.startsWith(",
          serverInput: "\"https://store.com\"",
          serverDevAfter: ")) redirect(req.query.redirect_uri);",
          commentedOut: false,
          status: "302 Found · Loose URI Match Allowed",
          statusType: "bypass",
          responsePreview: "Redirecting to https://store.com/callback/../evil.com?code=AUTH_CODE_SECRET...",
          aha: "The OAuth provider used loose prefix matching rather than exact matching. It permitted path traversal or domain prefixes, setting up an authorization code leak.",
          safeServerView: "if (!ALLOWED_REDIRECT_URIS.has(req.query.redirect_uri)) {\n  return res.status(400).send('Invalid URI');\n}",
          safeStatus: "400 Bad Request · Rejected Callback",
          safeAha: "Whitelist matching blocks any path-traversed or subdomain variations."
        },
        {
          label: "3. Logic Break",
          input: "redirect_uri=https://store.com@attacker.com/steal",
          http: "GET /auth?...&redirect_uri=https://store.com@attacker.com/steal HTTP/1.1\nHost: oauth-provider.com",
          serverDevBefore: "// Browser treats store.com as HTTP basic auth user, connects to attacker.com:\nres.redirect(",
          serverInput: "\"https://store.com@attacker.com/steal?code=\" + secretCode",
          serverDevAfter: ");",
          commentedOut: false,
          status: "302 Found · Authorization Code Leaked to Attacker",
          statusType: "bypass",
          responsePreview: "Victim browser redirected to attacker.com; authorization code logged in attacker access logs!",
          aha: "By abusing URL parsing quirks (the '@' symbol designates credentials, directing traffic to attacker.com), the secret code is delivered straight to the attacker. The attacker redeems the code for the victim's session!",
          safeServerView: "const parsed = new URL(req.query.redirect_uri);\nif (parsed.origin !== 'https://store.com') throw new Error('Host mismatch');",
          safeStatus: "400 Bad Request · URL Origin Mismatch",
          safeAha: "Parsing URLs and validating the host origin prevents authority parsing confusion."
        },
        {
          label: "4. Edge Case Variation",
          input: "Missing state parameter",
          http: "GET /auth?client_id=store&redirect_uri=https://store.com/callback&response_type=code HTTP/1.1\nHost: oauth-provider.com",
          serverDevBefore: "// Missing CSRF state validation:\n",
          serverInput: "session.user = await exchangeCode(req.query.code)",
          serverDevAfter: ";",
          commentedOut: false,
          status: "200 OK · OAuth CSRF Account Linking",
          statusType: "bypass",
          responsePreview: "Victim account bound to attacker's social profile!",
          aha: "Without an unpredictable cryptographic state parameter tied to the browser session, an attacker can trick a victim into submitting the attacker's authorization code, binding the victim's account to the attacker's login.",
          safeServerView: "if (!req.query.state || req.query.state !== session.oauthState) {\n  return res.status(403).send('CSRF detected');\n}",
          safeStatus: "403 Forbidden · Invalid State Parameter",
          safeAha: "Cryptographic state parameters bind the authorization request to the initiating browser session."
        }
      ]
    },
    story: [
      {
        tag: "Slide 1 of 4 · 🔎 The Browser Clue",
        headline: "Follow the OAuth redirect sequence",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 0,
        packetText: "Redirect to OAuth IdP",
        body: "Clicking 'Log in with Google/GitHub' redirects you to an authorization URL containing client_id, redirect_uri, and scope. The flow hands a temporary credential to the callback URL.",
        takeaway: "OAuth security relies entirely on ensuring the temporary code goes only to the real application."
      },
      {
        tag: "Slide 2 of 4 · ⚙️ The Server Action",
        headline: "The authorization server checks the redirect URI",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "Validate redirect_uri pattern",
        body: "Before displaying the consent prompt or returning the code, the identity provider checks if the requested redirect_uri matches what the application registered during setup.",
        takeaway: "A lax redirect validation check exposes the entire identity exchange."
      },
      {
        tag: "Slide 3 of 4 · 💥 The Logic Break",
        headline: "A manipulated redirect URI steers the secret code to an attacker",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 1,
        packetText: "Code redirected to attacker.com",
        body: "If the provider uses loose regexes or allows path traversal, an attacker crafts a link that sends the victim's authorization code to an external server. The attacker intercepts the code and logs into the victim's account.",
        takeaway: "Leaking the authorization code is equivalent to leaking a one-time administrative password."
      },
      {
        tag: "Slide 4 of 4 · 🛡️ The Defense",
        headline: "Strict exact matching and mandatory state parameters",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "Exact URI whitelist + PKCE",
        body: "Authorization servers must enforce exact string matching on callback URIs. Applications must generate a unique, cryptographically random state parameter bound to the user's session and use PKCE.",
        takeaway: "Exact URI allowlists and PKCE eliminate token leakage and CSRF injection."
      }
    ],
    puzzle: {
      question: "10-Second Prediction: What vulnerability is present in this OAuth redirect check?",
      code: "function isAllowedRedirect(uri) {\n  // Checks if redirect begins with registered domain\n  return uri.indexOf('https://my-store.com') === 0;\n}",
      options: [
        { text: "It throws a TypeError if uri contains a query string.", correct: false, feedback: "Not quite—indexOf works on any string and does not throw on query parameters." },
        { text: "An attacker can use 'https://my-store.com.evil.com/callback' because it starts with the approved string.", correct: true, feedback: "Spot on! Loose prefix matching allows attacker-controlled domains starting with the same prefix." },
        { text: "It forces the browser to use HTTP instead of HTTPS.", correct: false, feedback: "Actually, the scheme check is part of the string; the flaw is the unconstrained domain boundary." }
      ]
    },
    connections: [
      {
        clue: "👁️ What You Notice: The OAuth initiation link does not contain a state parameter (/auth?client_id=xyz&redirect_uri=...).",
        mechanism: "⚙️ What It Means on the Server: The application does not defend against OAuth login CSRF.",
        nextMove: "🎯 How to Verify: Complete the flow, trap the callback request, and test if opening it in another browser logs them into your account."
      },
      {
        clue: "👁️ What You Notice: Changing redirect_uri from /callback to /callback/../test returns 302 instead of an error.",
        mechanism: "⚙️ What It Means on the Server: The authorization server normalizes paths loosely or uses weak regex.",
        nextMove: "🎯 How to Verify: Test open redirect chains or external domains (https://store.com@attacker.com) to leak the authorization code."
      },
      {
        clue: "👁️ What You Notice: An authorization code can be redeemed multiple times at /oauth/token.",
        mechanism: "⚙️ What It Means on the Server: The OAuth server does not invalidate codes upon first use.",
        nextMove: "🎯 How to Verify: Replay the code exchange request to confirm replay vulnerability."
      }
    ],
    quiz: [
      {
        q: "What is the primary purpose of the state parameter in the OAuth 2.0 authorization code flow?",
        options:
          [
            { text: "To protect the user from Cross-Site Request Forgery (CSRF) attacks during the authentication callback.", correct: true, why: "Correct! The state parameter ties the authorization request directly to the client session that initiated it." },
            { text: "To specify which database table stores the user profile.", correct: false, why: "Remember that state is an anti-CSRF token, not a database configuration value." }
          ]
      },
      {
        q: "Why is exact string matching necessary for OAuth redirect URIs?",
        options:
          [
            { text: "Loose matching or regex prefixes allow attackers to redirect authorization codes to external subdomains or traversed paths.", correct: true, why: "Spot on! Exact matching guarantees codes are only ever delivered to authorized endpoints." },
            { text: "Browsers reject URLs that are longer than 50 characters.", correct: false, why: "Remember that browsers support URLs with thousands of characters." }
          ]
      }
    ]
  },

  'jwt': {
    sandbox: {
      title: "Live Request & Server X-Ray Simulator",
      prompt: "Click a test action below (or toggle Safe Defense Mode) and observe how the server processes your input:",
      inputLabel: "Parameter / Input",
      presets: [
        {
          label: "1. Normal Request",
          input: "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoid2llbmVyIiwiYWRtaW4iOmZhbHNlfQ.sig",
          http: "GET /admin HTTP/1.1\nHost: target.com\nCookie: token=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoid2llbmVyIiwiYWRtaW4iOmZhbHNlfQ.sig123",
          serverDevBefore: "const payload = jwt.verify(token, ",
          serverInput: "SECRET_KEY",
          serverDevAfter: ");\nif (!payload.admin) return res.status(403).send('Forbidden');",
          commentedOut: false,
          status: "403 Forbidden · Wiener is Not Admin",
          statusType: "normal",
          responsePreview: "Access Denied: User 'wiener' lacks administrative role.",
          aha: "The server cryptographically validates the signature using its private secret key. The signature is authentic, but the payload claims confirm the user is a standard non-admin account.",
          safeServerView: "const payload = jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] });",
          safeStatus: "403 Forbidden · Valid Signature Verified",
          safeAha: "Verifying signatures with explicit allowed algorithms blocks tampered tokens."
        },
        {
          label: "2. Anomaly Probe",
          input: "eyJhbGciOiJub25lIn0.eyJ1c2VyIjoid2llbmVyIiwiYWRtaW4iOmZhbHNlfQ.",
          http: "GET /admin HTTP/1.1\nHost: target.com\nCookie: token=eyJhbGciOiJub25lIn0.eyJ1c2VyIjoid2llbmVyIiwiYWRtaW4iOmZhbHNlfQ.",
          serverDevBefore: "const header = JSON.parse(atob(token.split('.')[0]));\nif (header.alg === ",
          serverInput: "\"none\"",
          serverDevAfter: ") return JSON.parse(atob(token.split('.')[1]));",
          commentedOut: false,
          status: "403 Forbidden · Unsigned Token Accepted",
          statusType: "error",
          responsePreview: "Access Denied: User 'wiener' is not admin (Token parsed without signature!)",
          aha: "Setting 'alg': 'none' and omitting the signature causes the flawed verification library to skip signature checks altogether. The server parsed the payload without verifying a secret.",
          safeServerView: "if (header.alg === 'none') throw new SecurityException('Unsecured JWT rejected');",
          safeStatus: "401 Unauthorized · Algorithm Blocked",
          safeAha: "Explicitly forbidding the 'none' algorithm ensures all tokens must be cryptographically signed."
        },
        {
          label: "3. Logic Break",
          input: "eyJhbGciOiJub25lIn0.eyJ1c2VyIjoiYWRtaW4iLCJhZG1pbiI6dHJ1ZX0.",
          http: "GET /admin HTTP/1.1\nHost: target.com\nCookie: token=eyJhbGciOiJub25lIn0.eyJ1c2VyIjoiYWRtaW4iLCJhZG1pbiI6dHJ1ZX0.",
          serverDevBefore: "// Trusting token claims without signature:\nif (claims.admin === ",
          serverInput: "true",
          serverDevAfter: ") return res.send('Welcome Superadmin!');",
          commentedOut: false,
          status: "200 OK · Superadmin Privileges Forged",
          statusType: "bypass",
          responsePreview: "<h1>Superadmin Console</h1><p>Full administrative privileges granted to 'admin'!</p>",
          aha: "With the signature check bypassed via 'alg: none', any claim in the JSON payload can be edited at will. Changing admin to true grants full administrative access.",
          safeServerView: "const verified = jwt.verify(token, SERVER_KEY, { algorithms: ['RS256'] });",
          safeStatus: "401 Unauthorized · Invalid Signature",
          safeAha: "Requiring cryptographic verification ensures tampered claims are immediately rejected."
        },
        {
          label: "4. Edge Case Variation",
          input: "Header with embedded JWK",
          http: "GET /admin HTTP/1.1\nHost: target.com\nCookie: token=header_with_embedded_jwk.payload.signature",
          serverDevBefore: "const key = req.jwt.header.jwk ? jwkToPem(",
          serverInput: "req.jwt.header.jwk",
          serverDevAfter: ") : SERVER_PUBLIC_KEY;",
          commentedOut: false,
          status: "200 OK · Embedded Key Self-Verification",
          statusType: "bypass",
          responsePreview: "Token verified using attacker's embedded public key! Admin access granted.",
          aha: "When the server accepts an embedded 'jwk' (JSON Web Key) from the token header and verifies the signature using that key, the attacker signs the forged token with their own private key and embeds the matching public key.",
          safeServerView: "const key = TRUSTED_KEYS_CACHE[req.jwt.header.kid]; // Trust only server-stored keys",
          safeStatus: "401 Unauthorized · Untrusted Key Rejected",
          safeAha: "Only verifying tokens against internally managed trusted keys prevents key injection attacks."
        }
      ]
    },
    story: [
      {
        tag: "Slide 1 of 4 · 🔎 The Browser Clue",
        headline: "Inspect the three-part Base64URL cookie",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 0,
        packetText: "Cookie: eyJhbGci...",
        body: "You inspect your browser cookies and spot a token with three sections separated by dots: Header, Payload, and Signature. Decoding the middle block reveals your username and permissions in plain JSON.",
        takeaway: "A JWT is Base64URL-encoded text, not encrypted data; anyone can read its claims."
      },
      {
        tag: "Slide 2 of 4 · ⚙️ The Server Action",
        headline: "The server splits the token and inspects the header",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "Read alg from Header",
        body: "The server unpacks the token. Vulnerable libraries inspect the alg header parameter to decide how to verify the signature—trusting the incoming document to declare its own validation rules.",
        takeaway: "Letting an untrusted document specify its own verification instructions invites disaster."
      },
      {
        tag: "Slide 3 of 4 · 💥 The Logic Break",
        headline: "Alg: none and header injection bypass cryptographic checks",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 1,
        packetText: "alg: none + admin: true",
        body: "By changing the algorithm header to none (or embedding a self-generated public key in jwk), an attacker strips the signature requirement. The server accepts forged administrative claims as genuine.",
        takeaway: "When signature verification is subverted, any identity or permission can be fabricated."
      },
      {
        tag: "Slide 4 of 4 · 🛡️ The Defense",
        headline: "Hardcode server-side verification algorithms and keys",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "jwt.verify(token, key, { algorithms })",
        body: "The server must enforce a strict whitelist of permitted algorithms (such as RS256 only), reject alg: none unconditionally, and verify signatures against trusted local key stores before parsing payload claims.",
        takeaway: "Never let the token's header dictate how the server verifies its signature."
      }
    ],
    puzzle: {
      question: "10-Second Prediction: What is the fatal flaw in this JWT authentication snippet?",
      code: "const token = req.cookies.token;\nconst payload = jwt.decode(token);\nif (payload.role === 'admin') {\n  renderAdminPanel(res);\n}",
      options: [
        { text: "The code uses cookies instead of Authorization headers.", correct: false, feedback: "Not quite—storing tokens in HttpOnly cookies is standard practice." },
        { text: "It calls jwt.decode() which only unpacks JSON without verifying the cryptographic signature.", correct: true, feedback: "Spot on! decode() skips verification entirely; anyone can tamper with payload.role." },
        { text: "The role property must be called 'roles' according to RFC 7519.", correct: false, feedback: "Actually, custom claims can have any name in JWT; the flaw is the missing signature verification." }
      ]
    },
    connections: [
      {
        clue: "👁️ What You Notice: Decoding a JWT shows '\"alg\": \"HS256\"', and changing it to '\"none\"' with no signature is accepted by the server.",
        mechanism: "⚙️ What It Means on the Server: The verification library supports the unsecured token specification without server-side algorithm whitelisting.",
        nextMove: "🎯 How to Verify: Modify your user ID or role claim to administrator, remove the signature, and submit."
      },
      {
        clue: "👁️ What You Notice: The token header includes a 'kid' (Key ID) pointing to a relative file path ('\"kid\": \"../../dev/null\"').",
        mechanism: "⚙️ What It Means on the Server: The server uses the kid header in a filesystem lookup to find the verification key.",
        nextMove: "🎯 How to Verify: Sign the token with an empty string or known static file content to forge valid signatures."
      },
      {
        clue: "👁️ What You Notice: The application signs tokens using RS256 (asymmetric RSA) but might be susceptible to algorithm confusion.",
        mechanism: "⚙️ What It Means on the Server: If the server accepts HS256, it will use the public RSA certificate as the HMAC secret key.",
        nextMove: "🎯 How to Verify: Obtain the public key, sign a forged token using HMAC-SHA256 with the public key as the secret, and test acceptance."
      }
    ],
    quiz: [
      {
        q: "What is the difference between jwt.decode() and jwt.verify() in JSON Web Token implementations?",
        options:
          [
            { text: "jwt.decode() merely deserializes the Base64URL payload without validating the signature, whereas jwt.verify() cryptographically validates authenticity.", correct: true, why: "Correct! decode() only unpacks raw JSON claims and must never be used for authorization decisions." },
            { text: "jwt.decode() is for asymmetric tokens, while jwt.verify() is only for symmetric tokens.", correct: false, why: "Remember that verify() handles both symmetric and asymmetric algorithms." }
          ]
      },
      {
        q: "Why is the '\"alg\": \"none\"' feature dangerous when enabled in production JWT libraries?",
        options:
          [
            { text: "It allows clients to declare that no signature is required, enabling attackers to forge arbitrary claims without knowing the secret key.", correct: true, why: "Spot on! The client declares its own lack of signature, bypassing security checks completely." },
            { text: "It encrypts the payload with a random key that the server cannot read.", correct: false, why: "Remember that none means unsecured plaintext, not encryption." }
          ]
      }
    ]
  },

  'sql-injection/fundamentals': {
    sandbox: {
      title: "Live Request & Server X-Ray Simulator",
      prompt: "Click a test action below (or toggle Safe Defense Mode) and observe how the server processes your input:",
      inputLabel: "Parameter / Input",
      presets: [
        {
          label: "1. Normal Request",
          input: "category=Gifts",
          http: "GET /products?category=Gifts HTTP/1.1\nHost: store.com",
          serverDevBefore: "SELECT * FROM products WHERE category = '",
          serverInput: "Gifts",
          serverDevAfter: "' AND released = 1",
          commentedOut: false,
          status: "200 OK · Normal Response",
          statusType: "normal",
          responsePreview: "[List of 3 public released items in 'Gifts']",
          aha: "The server glues the category string into the SQL query between single quotes. The database executes the query cleanly and returns only released items belonging to Gifts.",
          safeServerView: "db.query('SELECT * FROM products WHERE category = ? AND released = 1', [req.query.category]);",
          safeStatus: "200 OK · Parameterized Query",
          safeAha: "Prepared statements treat input as literal data characters, preventing syntax manipulation."
        },
        {
          label: "2. Anomaly Probe",
          input: "category=Gifts'",
          http: "GET /products?category=Gifts' HTTP/1.1\nHost: store.com",
          serverDevBefore: "SELECT * FROM products WHERE category = '",
          serverInput: "Gifts'",
          serverDevAfter: "' AND released = 1",
          commentedOut: false,
          status: "500 Internal Server Error · Syntax Error",
          statusType: "error",
          responsePreview: "Database Error: Unterminated string literal / syntax error near '' AND released = 1'",
          aha: "Injecting an unpaired single quote breaks the developer's SQL string boundary. The database parser encounters a syntax error because the quote is treated as a command delimiter rather than text.",
          safeServerView: "db.query('SELECT * FROM products WHERE category = ?', [\"Gifts'\"]);",
          safeStatus: "200 OK · No Syntax Error (0 items)",
          safeAha: "The database driver automatically escapes the quote or binds it as a value, keeping syntax valid."
        },
        {
          label: "3. Logic Break",
          input: "category=Gifts' OR 1=1--",
          http: "GET /products?category=Gifts' OR 1=1-- HTTP/1.1\nHost: store.com",
          serverDevBefore: "SELECT * FROM products WHERE category = '",
          serverInput: "Gifts' OR 1=1--",
          serverDevAfter: "' AND released = 1",
          commentedOut: true,
          status: "200 OK · Tautology Bypass (All Records)",
          statusType: "bypass",
          responsePreview: "[All 50 products rendered, including unreleased and private items!]",
          aha: "The single quote closes the category string, 'OR 1=1' turns the WHERE condition into a universal truth, and '--' comments out the rest of the query. The database returns every product in the table.",
          safeServerView: "db.query('SELECT * FROM products WHERE category = ? AND released = 1', [input]);",
          safeStatus: "200 OK · 0 Products Found",
          safeAha: "In a parameterized query, 'Gifts\\' OR 1=1--' is searched as a literal category name, returning zero results safely."
        },
        {
          label: "4. Edge Case Variation",
          input: "username=admin'--",
          http: "POST /login HTTP/1.1\nHost: store.com\n\nusername=admin'--&password=irrelevant",
          serverDevBefore: "SELECT * FROM users WHERE username = '",
          serverInput: "admin'--",
          serverDevAfter: "' AND password = 'hashed_pass'",
          commentedOut: true,
          status: "302 Found · Password Verification Bypassed",
          statusType: "bypass",
          responsePreview: "Redirecting to /admin/dashboard with administrator session!",
          aha: "Injecting '--' right after the username comments out the password verification clause completely. The database matches the administrator row and logs the attacker in without checking any password.",
          safeServerView: "db.query('SELECT * FROM users WHERE username = ?', [username]); // Verify hash in application logic",
          safeStatus: "401 Unauthorized · Invalid Password",
          safeAha: "Using parameterized queries and separate cryptographic password verification prevents comment truncation."
        }
      ]
    },
    story: [
      {
        tag: "Slide 1 of 4 · 🔎 The Browser Clue",
        headline: "An innocent filter parameter in the URL",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 0,
        packetText: "category=Gifts",
        body: "You select a category filter on an e-commerce shop: /filter?category=Gifts. The browser sends the category name directly to the server to populate the catalog table.",
        takeaway: "User inputs that filter, search, or look up data frequently interact directly with backend SQL queries."
      },
      {
        tag: "Slide 2 of 4 · ⚙️ The Server Action",
        headline: "The server concatenates input into the SQL command",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "SELECT * FROM ... WHERE cat = 'Gifts'",
        body: "The server builds a SQL command by gluing your parameter between single quotes: WHERE category = ' + input + '. It sends the concatenated string to the database engine.",
        takeaway: "String concatenation blurs the boundary between the developer's instructions and untrusted data."
      },
      {
        tag: "Slide 3 of 4 · 💥 The Logic Break",
        headline: "A single quote escapes data into command syntax",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 3,
        packetText: "' OR 1=1--",
        body: "Submitting a single quote tells the database parser that the text string has ended. Everything typed next is executed as live SQL commands, while -- comments out remaining safety checks.",
        takeaway: "The database cannot distinguish where the developer's query ends and the attacker's command begins."
      },
      {
        tag: "Slide 4 of 4 · 🛡️ The Defense",
        headline: "Parameterized queries separate code from data",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "Pre-compiled query structure",
        body: "Developers use parameterized queries (prepared statements). The database compiles the query structure beforehand and treats user input strictly as inert data values, rendering injection impossible.",
        takeaway: "Parameters turn untrusted input into harmless text literals that can never execute as commands."
      }
    ],
    puzzle: {
      question: "10-Second Prediction: What query does the database execute when name is test' OR 'a'='a?",
      code: "const sql = \"SELECT * FROM items WHERE name = '\" + req.query.name + \"';\";\ndb.query(sql);",
      options: [
        { text: "SELECT * FROM items WHERE name = 'test' OR 'a'='a'; (Returns all items)", correct: true, feedback: "Spot on! The single quotes balance out and 'a'='a' evaluates to true for every single row." },
        { text: "The database rejects the query because 'a'='a' is not a valid SQL expression.", correct: false, feedback: "Not quite—'a'='a' is completely valid SQL and evaluates to TRUE." },
        { text: "It only searches for an item whose name is literally test' OR 'a'='a.", correct: false, feedback: "Actually, concatenation treats the quote as SQL syntax rather than literal characters." }
      ]
    },
    connections: [
      {
        clue: "👁️ What You Notice: Submitting a single quote ' produces an HTTP 500 error, but submitting two single quotes '' loads the page normally.",
        mechanism: "⚙️ What It Means on the Server: The input is enclosed in SQL single quotes; doubling the quote escapes it and restores valid syntax.",
        nextMove: "🎯 How to Verify: Test boolean expressions like ' AND 1=1-- vs ' AND 1=2-- to confirm execution control."
      },
      {
        clue: "👁️ What You Notice: Searching for hat returns hats, but searching for hat'# or hat'-- returns all products.",
        mechanism: "⚙️ What It Means on the Server: The comment characters successfully truncate downstream query conditions.",
        nextMove: "🎯 How to Verify: Check which comment character works (-- , #, or /* */) to fingerprint the database."
      },
      {
        clue: "👁️ What You Notice: Entering 1 vs 2-1 in a numeric parameter returns the exact same result.",
        mechanism: "⚙️ What It Means on the Server: The parameter is unquoted and evaluated arithmetically by the SQL parser.",
        nextMove: "🎯 How to Verify: Test SQL arithmetic like 1+0 or conditional expressions like (CASE WHEN 1=1 THEN 1 ELSE 2 END)."
      }
    ],
    quiz: [
      {
        q: "Why do single quotes (') play such a pivotal role in SQL injection attacks?",
        options:
          [
            { text: "Because single quotes are the string literal delimiters in SQL; injecting one breaks out of the data context into the command context.", correct: true, why: "Correct! The single quote ends the string literal, switching the parser from parsing data to parsing commands." },
            { text: "Because modern web servers treat single quotes as HTTP line breaks.", correct: false, why: "Remember that quotes have no special line break meaning in HTTP protocols." }
          ]
      },
      {
        q: "Why are parameterized queries (prepared statements) completely immune to classic SQL injection?",
        options:
          [
            { text: "The database compiles the query structure before values are bound, treating user input exclusively as literal data.", correct: true, why: "Spot on! The command structure is immutable before parameters are ever inserted." },
            { text: "Parameterized queries strip all single quotes and special characters from user input.", correct: false, why: "Remember that parameterized queries do not strip characters; they safely preserve them as literal values." }
          ]
      }
    ]
  },

  'sql-injection/union-attacks': {
    sandbox: {
      title: "Live Request & Server X-Ray Simulator",
      prompt: "Click a test action below (or toggle Safe Defense Mode) and observe how the server processes your input:",
      inputLabel: "Parameter / Input",
      presets: [
        {
          label: "1. Normal Request",
          input: "category=Lifestyle",
          http: "GET /filter?category=Lifestyle HTTP/1.1\nHost: shop.com",
          serverDevBefore: "SELECT id, name, description FROM products WHERE category = '",
          serverInput: "Lifestyle",
          serverDevAfter: "' AND released = 1",
          commentedOut: false,
          status: "200 OK · 3 Columns Rendered",
          statusType: "normal",
          responsePreview: "[Table with 3 columns: ID | Product Name | Product Description]",
          aha: "The application queries products and maps the 3 returned columns into the HTML table. Everything executes within the boundaries of the original catalog query.",
          safeServerView: "db.query('SELECT id, name, description FROM products WHERE category = ?', [category]);",
          safeStatus: "200 OK · Safe Query",
          safeAha: "Prepared statements prevent appending secondary queries via UNION."
        },
        {
          label: "2. Anomaly Probe",
          input: "category=Lifestyle' ORDER BY 4--",
          http: "GET /filter?category=Lifestyle' ORDER BY 4-- HTTP/1.1\nHost: shop.com",
          serverDevBefore: "SELECT id, name, description FROM products WHERE category = '",
          serverInput: "Lifestyle' ORDER BY 4--",
          serverDevAfter: "' AND released = 1",
          commentedOut: true,
          status: "500 Internal Server Error · Column Probe Failure",
          statusType: "error",
          responsePreview: "Database Error: ORDER BY position 4 is out of range of table (3 columns exist)",
          aha: "Probing with ORDER BY forces the database to sort by column index. When index 4 triggers an error while 3 succeeds, you know the original query selects exactly 3 columns.",
          safeServerView: "db.query('SELECT id, name, description FROM products WHERE category = ? ORDER BY id', [category]);",
          safeStatus: "200 OK · Clean Sort",
          safeAha: "User input cannot manipulate the ORDER BY clause when queries are parameterized."
        },
        {
          label: "3. Logic Break",
          input: "category=Lifestyle' UNION SELECT null, username, password FROM users--",
          http: "GET /filter?category=Lifestyle' UNION SELECT null, username, password FROM users-- HTTP/1.1\nHost: shop.com",
          serverDevBefore: "SELECT id, name, description FROM products WHERE category = '",
          serverInput: "Lifestyle' UNION SELECT null, username, password FROM users--",
          serverDevAfter: "' AND released = 1",
          commentedOut: true,
          status: "200 OK · Credentials Extracted in Table",
          statusType: "bypass",
          responsePreview: "[Table displays: administrator | $2b$12$e8x... in the product description slots!]",
          aha: "Because column count (3) and text data types match, the database appends secret user records onto the public product table and renders them directly on screen.",
          safeServerView: "// Parameterized query: input cannot inject UNION keywords",
          safeStatus: "200 OK · 0 Results",
          safeAha: "Treating input as parameter data prevents the database from executing a secondary query."
        },
        {
          label: "4. Edge Case Variation",
          input: "category=Lifestyle' UNION SELECT null, username || '~' || password, null FROM users--",
          http: "GET /filter?... HTTP/1.1\nHost: shop.com",
          serverDevBefore: "SELECT id, name, description FROM products WHERE category = '",
          serverInput: "Lifestyle' UNION SELECT null, username || '~' || password, null FROM users--",
          serverDevAfter: "' AND released = 1",
          commentedOut: true,
          status: "200 OK · Multiple Values in Single Column",
          statusType: "bypass",
          responsePreview: "[Table displays: administrator~s3cr3tP@ss in single column slot]",
          aha: "When only one column in the target table renders text on screen, string concatenation operators ('||' or CONCAT) pack multiple sensitive fields into a single printable column.",
          safeServerView: "db.query('SELECT id, name, description FROM products WHERE category = ?', [cat]);",
          safeStatus: "200 OK · Safe",
          safeAha: "Parameter binding neutralizes string concatenation injection."
        }
      ]
    },
    story: [
      {
        tag: "Slide 1 of 4 · 🔎 The Browser Clue",
        headline: "The web page displays a multi-column table of results",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 0,
        packetText: "3-column catalog table",
        body: "You view a product page that displays items across multiple visible columns (e.g. title, description, price). When an injection point reflects data on screen, UNION attacks can hijack the table.",
        takeaway: "Reflected search results indicate that database output rows are being printed directly into HTML."
      },
      {
        tag: "Slide 2 of 4 · ⚙️ The Server Action",
        headline: "UNION stitches a second query's rows onto the first",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "Original Query + UNION Query",
        body: "The SQL UNION operator executes two distinct queries and merges their result rows into a single table. The database returns the combined rows to the application as if they all came from the catalog.",
        takeaway: "The application cannot tell which rows came from products and which came from users."
      },
      {
        tag: "Slide 3 of 4 · 💥 The Logic Break",
        headline: "Matching column counts and data types reveals secrets",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 3,
        packetText: "Users table rows returned",
        body: "Databases enforce two strict rules for UNION: both queries must return the exact same number of columns, and their data types must match. Once satisfied, secret rows print right in the browser.",
        takeaway: "Satisfying the database's column and type constraints unlocks arbitrary data exfiltration."
      },
      {
        tag: "Slide 4 of 4 · 🛡️ The Defense",
        headline: "Stop dynamic query construction with prepared statements",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "Enforce parameterized input",
        body: "Parameterizing the search parameter ensures the database treats UNION SELECT as literal text. The database searches for items containing the word 'UNION' instead of running a secondary query.",
        takeaway: "Parameterized queries prevent attackers from appending additional SQL commands."
      }
    ],
    puzzle: {
      question: "10-Second Prediction: What error will the database throw for this query?",
      code: "SELECT id, title, price FROM items \nWHERE category = 'books' \nUNION SELECT username, password FROM users;",
      options: [
        { text: "'Syntax error near UNION': UNION is not supported in subqueries.", correct: false, feedback: "Not quite—UNION is completely valid SQL syntax in this position." },
        { text: "'The used SELECT statements have a different number of columns' (3 columns vs 2 columns).", correct: true, feedback: "Spot on! The first query requests 3 columns while the second requests only 2." },
        { text: "'Table users does not exist': You cannot query users from items.", correct: false, feedback: "Actually, UNION queries can query any table accessible to the current DB user." }
      ]
    },
    connections: [
      {
        clue: "👁️ What You Notice: Injecting ' ORDER BY 1--, ' ORDER BY 2--, etc., works until index 5 causes a 500 error.",
        mechanism: "⚙️ What It Means on the Server: The original application query selects exactly 4 columns.",
        nextMove: "🎯 How to Verify: Confirm by testing ' UNION SELECT NULL, NULL, NULL, NULL--."
      },
      {
        clue: "👁️ What You Notice: ' UNION SELECT NULL, 'test', NULL-- displays 'test' on screen, but ' UNION SELECT 'test', NULL, NULL-- crashes.",
        mechanism: "⚙️ What It Means on the Server: Column 2 accepts string data types, while Column 1 is strictly numeric (like an integer ID).",
        nextMove: "🎯 How to Verify: Place sensitive extracted text into column 2 where string types are permitted."
      },
      {
        clue: "👁️ What You Notice: The database is Oracle and rejects ' UNION SELECT NULL, NULL--.",
        mechanism: "⚙️ What It Means on the Server: Oracle requires every SELECT query to specify a table name (e.g. FROM dual).",
        nextMove: "🎯 How to Verify: Append FROM dual-- to your UNION payload: ' UNION SELECT NULL, NULL FROM dual--."
      }
    ],
    quiz: [
      {
        q: "What two requirements must be satisfied for a SQL UNION attack to successfully execute?",
        options:
          [
            { text: "Both queries must return the exact same number of columns, and the data types in corresponding columns must be compatible.", correct: true, why: "Correct! The database engine enforces identical column counts and compatible data types across result sets." },
            { text: "Both tables must share the same primary key name and index count.", correct: false, why: "Remember that tables do not need to share schemas or primary keys for UNION queries." }
          ]
      },
      {
        q: "Why is NULL used when initially probing the number of columns with UNION SELECT?",
        options:
          [
            { text: "NULL converts safely into any data type (strings, integers, dates) without causing type mismatch errors.", correct: true, why: "Spot on! NULL is type-agnostic and satisfies column counting regardless of underlying types." },
            { text: "NULL tells the database to skip executing the first query.", correct: false, why: "Remember that NULL is simply a data value; it does not skip queries." }
          ]
      }
    ]
  },

  'sql-injection/database-fingerprinting': {
    sandbox: {
      title: "Live Request & Server X-Ray Simulator",
      prompt: "Click a test action below (or toggle Safe Defense Mode) and observe how the server processes your input:",
      inputLabel: "Parameter / Input",
      presets: [
        {
          label: "1. Normal Request",
          input: "category=Tech",
          http: "GET /filter?category=Tech HTTP/1.1\nHost: target.com",
          serverDevBefore: "SELECT name, desc FROM products WHERE category = '",
          serverInput: "Tech",
          serverDevAfter: "' AND active = 1",
          commentedOut: false,
          status: "200 OK · Normal Response",
          statusType: "normal",
          responsePreview: "[List of Tech products]",
          aha: "The server executes standard SQL against an unknown database engine. Without probing engine-specific dialects, the database vendor and version remain hidden.",
          safeServerView: "db.query('SELECT name, desc FROM products WHERE category = ?', [cat]);",
          safeStatus: "200 OK · Safe & Validated",
          safeAha: "Parameterized queries block dialect-specific SQL injection."
        },
        {
          label: "2. Anomaly Probe",
          input: "category=Tech' UNION SELECT 'banner', NULL FROM dual--",
          http: "GET /filter?... HTTP/1.1\nHost: target.com",
          serverDevBefore: "SELECT name, desc FROM products WHERE category = '",
          serverInput: "Tech' UNION SELECT 'banner', NULL FROM dual--",
          serverDevAfter: "' AND active = 1",
          commentedOut: true,
          status: "200 OK · Oracle Dialect Confirmed",
          statusType: "normal",
          responsePreview: "[Table displays 'banner' | NULL - Oracle syntax confirmed by FROM dual]",
          aha: "Oracle strictly requires the 'FROM dual' clause for table-less queries, whereas MySQL and PostgreSQL do not. Success with 'FROM dual' confirms the backend runs Oracle.",
          safeServerView: "// Parameterized query: dual keyword treated as search text",
          safeStatus: "200 OK · No Injection",
          safeAha: "Prepared statements prevent executing engine-specific dialect clauses."
        },
        {
          label: "3. Logic Break",
          input: "category=Tech' UNION SELECT version, NULL FROM v$version--",
          http: "GET /filter?... HTTP/1.1\nHost: target.com",
          serverDevBefore: "SELECT name, desc FROM products WHERE category = '",
          serverInput: "Tech' UNION SELECT version, NULL FROM v$version--",
          serverDevAfter: "' AND active = 1",
          commentedOut: true,
          status: "200 OK · Version Banner Leaked",
          statusType: "bypass",
          responsePreview: "[Table displays: 'Oracle Database 19c Enterprise Edition Release 19.0.0.0.0']",
          aha: "Querying the dialect's version table (v$version on Oracle, @@version on MySQL/MSSQL, version() on PostgreSQL) reveals the precise release and operating system build.",
          safeServerView: "// Least privilege: disable public access to system views",
          safeStatus: "200 OK · Safe & Parameterized",
          safeAha: "Restricting database user permissions denies access to system version tables."
        },
        {
          label: "4. Edge Case Variation",
          input: "category=Tech' UNION SELECT table_name, column_name FROM all_tab_columns--",
          http: "GET /filter?... HTTP/1.1\nHost: target.com",
          serverDevBefore: "SELECT name, desc FROM products WHERE category = '",
          serverInput: "Tech' UNION SELECT table_name, column_name FROM all_tab_columns--",
          serverDevAfter: "' AND active = 1",
          commentedOut: true,
          status: "200 OK · Full Data Catalog Dumped",
          statusType: "bypass",
          responsePreview: "[Table displays: USERS_ABC123 | PASSWORD_XYZ99 - Schema mapped!]",
          aha: "Every SQL database maintains an internal data catalog (information_schema or all_tables). Reading this metadata reveals every hidden table, column name, and data type across the entire database.",
          safeServerView: "REVOKE SELECT ON all_tab_columns FROM web_app_user;",
          safeStatus: "403 Forbidden · Metadata Denied",
          safeAha: "Applying least privilege ensures web applications cannot query system metadata catalogs."
        }
      ]
    },
    story: [
      {
        tag: "Slide 1 of 4 · 🔎 The Browser Clue",
        headline: "Different database engines speak distinct SQL dialects",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 0,
        packetText: "Dialect testing payloads",
        body: "Every database engine adheres to a unique dialect: comment syntax (-- vs #), string concatenation (|| vs +), and version functions (version() vs @@version) differ across vendors.",
        takeaway: "Subtle syntax errors tell you which database engine is listening behind the web server."
      },
      {
        tag: "Slide 2 of 4 · ⚙️ The Server Action",
        headline: "The database parser processes dialect-specific tokens",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "FROM dual vs information_schema",
        body: "The database parser evaluates your injected tokens according to its specific grammar. For example, Oracle rejects queries that lack a FROM clause, while PostgreSQL happily accepts SELECT version().",
        takeaway: "Dialect requirements act as fingerprint signatures that identify the database brand."
      },
      {
        tag: "Slide 3 of 4 · 💥 The Logic Break",
        headline: "System catalogs expose the entire database architecture",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 3,
        packetText: "Dump information_schema.tables",
        body: "Once the engine is identified, you don't guess table names. You query standard system catalogs (information_schema.tables or all_tables) to dump the exact names of every table and column in the system.",
        takeaway: "Access to the data catalog turns an invisible database into an open book."
      },
      {
        tag: "Slide 4 of 4 · 🛡️ The Defense",
        headline: "Parameterized queries and least-privilege database accounts",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "Least privilege permissions",
        body: "Enforce parameterized queries to stop SQL injection. Furthermore, configure database accounts with least privilege: the web user should have zero permissions to query system catalogs or version tables.",
        takeaway: "Hardening the database permissions limits the damage even if injection occurs."
      }
    ],
    puzzle: {
      question: "10-Second Prediction: Which database engine is running behind this application?",
      code: "Test 1: ' UNION SELECT @@version--           -> 500 Syntax Error\nTest 2: ' UNION SELECT version()--             -> 500 Syntax Error\nTest 3: ' UNION SELECT banner FROM v$version-- -> 200 OK (Displays banner)",
      options: [
        { text: "PostgreSQL", correct: false, feedback: "Not quite—PostgreSQL supports version() and does not have v$version." },
        { text: "Oracle", correct: true, feedback: "Spot on! Oracle uses v$version for version querying and rejects the others." },
        { text: "MySQL", correct: false, feedback: "Actually, MySQL supports @@version and does not use v$version." }
      ]
    },
    connections: [
      {
        clue: "👁️ What You Notice: Concatenating strings with ' || 'a' succeeds, but ' + 'a' throws a syntax error.",
        mechanism: "⚙️ What It Means on the Server: The database uses ANSI SQL concatenation (Oracle or PostgreSQL) rather than Microsoft SQL Server (+).",
        nextMove: "🎯 How to Verify: Test version() (PostgreSQL) vs v$version (Oracle) to distinguish between them."
      },
      {
        clue: "👁️ What You Notice: The comment character # is accepted, but -- causes an error.",
        mechanism: "⚙️ What It Means on the Server: The backend is running MySQL, which supports hash comments.",
        nextMove: "🎯 How to Verify: Query SELECT @@version or information_schema.tables."
      },
      {
        clue: "👁️ What You Notice: An error message mentions psycopg2.errors or pg_catalog.",
        mechanism: "⚙️ What It Means on the Server: The application connects to a PostgreSQL backend using Python.",
        nextMove: "🎯 How to Verify: Query version() and explore information_schema.tables."
      }
    ],
    quiz: [
      {
        q: "Why must Oracle SELECT queries always specify a table, and what dummy table is standardly used?",
        options:
          [
            { text: "Oracle syntax requires a FROM clause for all queries; the built-in single-row table 'dual' is used.", correct: true, why: "Correct! Oracle grammar enforces FROM; 'dual' is the standard single-row table for evaluation." },
            { text: "Oracle requires FROM master to load the database license key.", correct: false, why: "Remember that 'dual' is the table used; 'master' is a SQL Server system database." }
          ]
      },
      {
        q: "What is information_schema in modern SQL databases like PostgreSQL, MySQL, and SQL Server?",
        options:
          [
            { text: "A standard set of read-only views describing all databases, tables, columns, and data types in the engine.", correct: true, why: "Spot on! information_schema is the ANSI standard metadata catalog for database introspection." },
            { text: "A cache directory on disk where temporary SQL queries are saved.", correct: false, why: "Remember that information_schema consists of relational metadata tables, not disk cache files." }
          ]
      }
    ]
  },

  'sql-injection/blind': {
    sandbox: {
      title: "Live Request & Server X-Ray Simulator",
      prompt: "Click a test action below (or toggle Safe Defense Mode) and observe how the server processes your input:",
      inputLabel: "Parameter / Input",
      presets: [
        {
          label: "1. Normal Request",
          input: "TrackingId=u5IEnFQ",
          http: "GET / HTTP/1.1\nHost: target.com\nCookie: TrackingId=u5IEnFQ",
          serverDevBefore: "SELECT * FROM tracking WHERE id = '",
          serverInput: "u5IEnFQ",
          serverDevAfter: "'",
          commentedOut: false,
          status: "200 OK · Welcome Back Banner Rendered",
          statusType: "normal",
          responsePreview: "<div class='banner'>Welcome back!</div> (Page loaded in 25ms)",
          aha: "The server reads the tracking cookie and queries the database. Because the tracking ID matches an existing record, the application displays a personalized 'Welcome back' banner.",
          safeServerView: "db.query('SELECT * FROM tracking WHERE id = ?', [req.cookies.TrackingId]);",
          safeStatus: "200 OK · Cookie Parameterized",
          safeAha: "Treating cookies as untrusted parameterized inputs prevents SQL condition injection."
        },
        {
          label: "2. Anomaly Probe",
          input: "TrackingId=u5IEnFQ' AND '1'='2",
          http: "GET / HTTP/1.1\nHost: target.com\nCookie: TrackingId=u5IEnFQ' AND '1'='2",
          serverDevBefore: "SELECT * FROM tracking WHERE id = '",
          serverInput: "u5IEnFQ' AND '1'='2",
          serverDevAfter: "'",
          commentedOut: false,
          status: "200 OK · Welcome Back Banner Disappears",
          statusType: "error",
          responsePreview: "[Page rendered without 'Welcome back' banner! Tracking row evaluated false]",
          aha: "When '1'='1' is true, the banner appears. When '1'='2' is false, the banner vanishes. The application doesn't print database data, but its conditional behavior creates a 1-bit binary radio channel.",
          safeServerView: "db.query('SELECT * FROM tracking WHERE id = ?', [cookie]);",
          safeStatus: "200 OK · Banner Preserved",
          safeAha: "Prepared statements ignore embedded boolean operators and search literal cookie strings."
        },
        {
          label: "3. Logic Break",
          input: "TrackingId=u5IEnFQ' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='admin')='a",
          http: "GET / HTTP/1.1\nHost: target.com\nCookie: TrackingId=u5IEnFQ' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='admin')='a",
          serverDevBefore: "SELECT * FROM tracking WHERE id = '",
          serverInput: "u5IEnFQ' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='admin')='a",
          serverDevAfter: "'",
          commentedOut: false,
          status: "200 OK · First Password Character Confirmed",
          statusType: "bypass",
          responsePreview: "<div class='banner'>Welcome back!</div> (Condition TRUE: First char is 'a'!)",
          aha: "By testing each character position against letters of the alphabet, the appearance of the 'Welcome back' banner signals when a guess is correct. Repeating this extracts the full administrator password.",
          safeServerView: "// Parameterized query: input cannot evaluate subqueries",
          safeStatus: "200 OK · Safe & Parameterized",
          safeAha: "Subqueries cannot execute inside bound parameter values."
        },
        {
          label: "4. Edge Case Variation",
          input: "TrackingId=u5IEnFQ' || pg_sleep(5)--",
          http: "GET / HTTP/1.1\nHost: target.com\nCookie: TrackingId=u5IEnFQ' || pg_sleep(5)--",
          serverDevBefore: "SELECT * FROM tracking WHERE id = '",
          serverInput: "u5IEnFQ' || pg_sleep(5)--",
          serverDevAfter: "'",
          commentedOut: true,
          status: "200 OK · Delayed Response (5024ms)",
          statusType: "bypass",
          responsePreview: "[No visual difference on page, but HTTP response paused for exactly 5.02 seconds]",
          aha: "When the page displays no visible difference whatsoever, time-delay functions (pg_sleep, WAITFOR DELAY) force the database to pause. The delay proves code execution without any reflected text.",
          safeServerView: "db.query('SELECT * FROM tracking WHERE id = ?', [cookie]);",
          safeStatus: "200 OK · Immediate (25ms)",
          safeAha: "Parameter binding neutralizes sleep commands, returning responses instantly."
        }
      ]
    },
    story: [
      {
        tag: "Slide 1 of 4 · 🔎 The Browser Clue",
        headline: "No data is reflected, but subtle tells exist",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 0,
        packetText: "Cookie: TrackingId=xyz",
        body: "The application never displays database rows or helpful SQL errors. However, tampering with a cookie causes a 'Welcome back' message to appear or disappear, or introduces a delay.",
        takeaway: "Even when a website never prints database text, it cannot hide its operational behavior."
      },
      {
        tag: "Slide 2 of 4 · ⚙️ The Server Action",
        headline: "The server evaluates your injected condition",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "AND (1=1) vs AND (1=2)",
        body: "The backend executes the SQL query. If your injected condition evaluates to TRUE, the query returns a row and the server shows a welcome badge. If FALSE, no row returns and the badge disappears.",
        takeaway: "A conditional check in code transforms database boolean results into visible UI states."
      },
      {
        tag: "Slide 3 of 4 · 💥 The Logic Break",
        headline: "Extracting secrets bit by bit through a binary oracle",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 3,
        packetText: "SUBSTRING(pass,1,1) == 's'",
        body: "By asking yes/no questions (Is character 1 = 'a'?), the server blinks its UI tell whenever you guess correctly. Using binary search, an attacker reconstructs an entire password in just a few dozen requests.",
        takeaway: "A 1-bit boolean tell is all that is needed to leak complete database tables."
      },
      {
        tag: "Slide 4 of 4 · 🛡️ The Defense",
        headline: "Treat cookies and headers as untrusted parameterized input",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "Parameterized cookie queries",
        body: "Developers must use parameterized queries for all inputs, including cookies, session tokens, and custom HTTP headers. Never concatenate incoming cookie strings directly into database commands.",
        takeaway: "Cookies are untrusted client inputs that require the exact same defenses as form fields."
      }
    ],
    puzzle: {
      question: "10-Second Prediction: What does an HTTP 500 status code indicate in this conditional probe?",
      code: "TrackingId=xyz' AND (SELECT CASE WHEN (1=1) THEN 1/0 ELSE 1 END FROM users)='1",
      options: [
        { text: "The database crashed permanently due to an out-of-memory error.", correct: false, feedback: "Not quite—division by zero only aborts the current transaction, not the database process." },
        { text: "The condition (1=1) was TRUE, triggering a division-by-zero runtime error (1/0) that raised the 500 status.", correct: true, feedback: "Spot on! The arithmetic error proves the condition evaluated to true, creating an error-based oracle." },
        { text: "The database detected an attack and blocked the client's IP.", correct: false, feedback: "Actually, standard database engines don't block client IPs on syntax or division errors." }
      ]
    },
    connections: [
      {
        clue: "👁️ What You Notice: Adding ' AND '1'='1 renders a UI banner, while ' AND '1'='2 removes it.",
        mechanism: "⚙️ What It Means on the Server: You have discovered a boolean blind SQL injection oracle.",
        nextMove: "🎯 How to Verify: Use conditional substring queries like ' AND (SELECT SUBSTRING(username,1,1) FROM users)='a'--."
      },
      {
        clue: "👁️ What You Notice: The page content never changes, but injecting ' || pg_sleep(10)-- causes a 10-second delay.",
        mechanism: "⚙️ What It Means on the Server: The database executes the sleep function on PostgreSQL before returning data.",
        nextMove: "🎯 How to Verify: Test conditional delays: ' AND (CASE WHEN (1=1) THEN pg_sleep(5) ELSE pg_sleep(0) END)--."
      },
      {
        clue: "👁️ What You Notice: Injecting SELECT 1/0 triggers a 500 error only when a specific condition is met.",
        mechanism: "⚙️ What It Means on the Server: Error-based blind oracle: mathematical exceptions leak boolean states without reflecting error text.",
        nextMove: "🎯 How to Verify: Formulate conditional checks where true conditions divide by zero."
      }
    ],
    quiz: [
      {
        q: "How does an attacker extract an unknown password using a blind boolean SQL injection oracle?",
        options:
          [
            { text: "By asking sequential true/false questions about each character using SUBSTRING() and observing the server's boolean tell.", correct: true, why: "Correct! Each boolean reaction validates or refutes one bit of the target secret." },
            { text: "By waiting for the server to email the password to the administrator.", correct: false, why: "Remember that blind extraction is performed interactively over HTTP requests." }
          ]
      },
      {
        q: "Why are HTTP cookies often more susceptible to blind SQL injection than search fields?",
        options:
          [
            { text: "Developers often mistakenly assume cookies are safe and tamper-proof because end-users do not edit them in standard browsers.", correct: true, why: "Spot on! Developers frequently neglect parameterization for cookies and non-form headers." },
            { text: "Cookies are encrypted with keys that bypass SQL syntax validation.", correct: false, why: "Remember that cookies are typically unencrypted Base64 or plain strings sent over HTTP." }
          ]
      }
    ]
  },

  'sql-injection/waf-bypass-xml': {
    sandbox: {
      title: "Live Request & Server X-Ray Simulator",
      prompt: "Click a test action below (or toggle Safe Defense Mode) and observe how the server processes your input:",
      inputLabel: "Parameter / Input",
      presets: [
        {
          label: "1. Normal Request",
          input: "<stockCheck><productId>1</productId><storeId>1</storeId></stockCheck>",
          http: "POST /product/stock HTTP/1.1\nHost: shop.com\nContent-Type: application/xml\n\n<stockCheck><productId>1</productId><storeId>1</storeId></stockCheck>",
          serverDevBefore: "// XML parsed into storeId:\nSELECT units FROM stock WHERE storeId = ",
          serverInput: "1",
          serverDevAfter: " AND productId = 1",
          commentedOut: false,
          status: "200 OK · 48 Units In Stock",
          statusType: "normal",
          responsePreview: "48 units in stock at store 1",
          aha: "The client submits standard XML. The WAF inspects the body, finds no malicious patterns, and forwards it to the application. The XML parser extracts storeId and executes the query.",
          safeServerView: "db.query('SELECT units FROM stock WHERE storeId = ? AND productId = ?', [storeId, prodId]);",
          safeStatus: "200 OK · Safe XML Endpoint",
          safeAha: "Using parameterized queries inside XML endpoints prevents SQL injection regardless of encoding."
        },
        {
          label: "2. Anomaly Probe",
          input: "<storeId>1 UNION SELECT NULL</storeId>",
          http: "POST /product/stock HTTP/1.1\nHost: shop.com\nContent-Type: application/xml\n\n<stockCheck><storeId>1 UNION SELECT NULL</storeId></stockCheck>",
          serverDevBefore: "// WAF inspection rule triggered:\n",
          serverInput: "UNION SELECT",
          serverDevAfter: "; // Blocked at front door",
          commentedOut: false,
          status: "403 Forbidden · WAF Blocked Keyword",
          statusType: "error",
          responsePreview: "403 Forbidden: Attack Detected - Web Application Firewall Blocked Request (Rule: SQLi_Keywords)",
          aha: "The front-gate WAF inspects raw HTTP text. It flags the plain text words 'UNION' and 'SELECT' as forbidden SQL keywords and terminates the request immediately.",
          safeServerView: "// Both WAF and backend parameterization protect the endpoint",
          safeStatus: "403 Forbidden · Blocked",
          safeAha: "Defense-in-depth blocks known attack patterns at the perimeter."
        },
        {
          label: "3. Logic Break",
          input: "<storeId>1 &#x55;NION &#x53;ELECT password FROM users</storeId>",
          http: "POST /product/stock HTTP/1.1\nHost: shop.com\nContent-Type: application/xml\n\n<storeId>1 &#x55;NION &#x53;ELECT password FROM users</storeId>",
          serverDevBefore: "// WAF sees \"&#x53;ELECT\" (allowed). Backend XML decodes entities, then executes:\nSELECT units FROM stock WHERE storeId = 1 ",
          serverInput: "UNION SELECT password FROM users",
          serverDevAfter: "",
          commentedOut: false,
          status: "200 OK · WAF Bypassed via XML Entities",
          statusType: "bypass",
          responsePreview: "Store units: $2b$12$e8xAdminPassHashLeaked!",
          aha: "The WAF inspected the raw text before XML parsing and saw harmless numeric entities (&#x53;). The backend XML parser decoded &#x53; into 'S' before passing it to SQL, completely bypassing the firewall!",
          safeServerView: "db.query('SELECT units FROM stock WHERE storeId = ?', [xmlDoc.storeId]); // Parameterized",
          safeStatus: "200 OK · Parameter Safe",
          safeAha: "Parameterized queries render decoded entity keywords completely harmless."
        },
        {
          label: "4. Edge Case Variation",
          input: "<storeId>1 &#85;NION &#83;ELECT null</storeId>",
          http: "POST /product/stock HTTP/1.1\nHost: shop.com\nContent-Type: application/xml\n\n<storeId>1 &#85;NION &#83;ELECT null</storeId>",
          serverDevBefore: "// XML decimal entity decoding: &#85; -> U, &#83; -> S\nSELECT units FROM stock WHERE storeId = 1 ",
          serverInput: "UNION SELECT null",
          serverDevAfter: "",
          commentedOut: false,
          status: "200 OK · Decimal Entity Bypass",
          statusType: "bypass",
          responsePreview: "Query executed successfully using decimal XML entity escapes.",
          aha: "XML parsers accept both hexadecimal (&#x53;) and decimal (&#83;) numeric character entities. If a WAF decodes hex but forgets decimal entities, the discrepancy bypasses the filter.",
          safeServerView: "WAF.canonicalizeXML(req); // Normalize before inspecting\ndb.query('SELECT units FROM stock WHERE storeId = ?', [storeId]);",
          safeStatus: "403 Forbidden · Canonicalized & Blocked",
          safeAha: "Normalizing and canonicalizing XML entities before running WAF inspection rules closes the parser gap."
        }
      ]
    },
    story: [
      {
        tag: "Slide 1 of 4 · 🔎 The Browser Clue",
        headline: "The application submits data inside an XML document",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 0,
        packetText: "POST /product/stock (XML)",
        body: "You notice an API endpoint that exchanges structured XML payloads (such as <storeId>1</storeId>). Direct SQL injection strings are immediately blocked by an aggressive Web Application Firewall (WAF).",
        takeaway: "WAFs look for known plaintext attack signatures in incoming HTTP request streams."
      },
      {
        tag: "Slide 2 of 4 · ⚙️ The Server Action",
        headline: "The WAF inspects raw text before the application decodes it",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 1,
        packetText: "WAF scans raw entities",
        body: "The HTTP request passes through two distinct checkpoints: first, the WAF scans raw text at the network perimeter. Second, the backend application's XML parser resolves entities and hands text to the database.",
        takeaway: "A timing gap exists between when security rules run and when data is decoded."
      },
      {
        tag: "Slide 3 of 4 · 💥 The Logic Break",
        headline: "Entity encoding exploits the parser disagreement",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "&#x53;ELECT becomes SELECT",
        body: "To the WAF, &#x53;ELECT looks like harmless XML entity codes. But after clearing the WAF, the XML parser translates &#x53; into S, reassembling the live SQL command right before database execution.",
        takeaway: "The WAF and the database engine disagree on what the string actually says."
      },
      {
        tag: "Slide 4 of 4 · 🛡️ The Defense",
        headline: "Decode and canonicalize before inspection, and parameterize",
        nodes: ["🌐 Browser", "📡 HTTP Request", "⚙️ Server Handler", "🗄️ Backend / Store"],
        activeNode: 2,
        packetText: "Canonicalize + Parameterize",
        body: "Perimeter firewalls must decode XML entities and canonicalize payloads prior to evaluating security rule sets. Most importantly, backend applications must use parameterized queries for all XML values.",
        takeaway: "True defense relies on backend parameterization, not perimeter string filtering."
      }
    ],
    puzzle: {
      question: "10-Second Prediction: Why does <tag>&#x53;ELECT</tag> bypass a WAF searching for SELECT?",
      code: "// WAF Rule: if (rawBody.includes('SELECT')) dropRequest();\n// Backend: const val = xmlParser.parse(rawBody);\n//          db.query('SELECT * FROM data WHERE id = ' + val);",
      options: [
        { text: "XML entities automatically crash the WAF's regular expression engine.", correct: false, feedback: "Not quite—the WAF doesn't crash; it simply searches for literal 'SELECT'." },
        { text: "The WAF scans raw unparsed text (where 'SELECT' is absent), while the backend decodes entities into 'SELECT' before querying.", correct: true, feedback: "Spot on! The impedance mismatch between raw scanning and post-decode execution creates the bypass." },
        { text: "The database ignores XML entities completely and returns empty rows.", correct: false, feedback: "Actually, the database executes whatever string the XML parser feeds it." }
      ]
    },
    connections: [
      {
        clue: "👁️ What You Notice: Submitting SELECT returns 403 Forbidden (Attack Detected), but SEL&#x45;CT or &#x53;ELECT is accepted.",
        mechanism: "⚙️ What It Means on the Server: The WAF inspects raw request bodies without pre-decoding XML entities.",
        nextMove: "🎯 How to Verify: Use Hackvertor or Burp extensions to entity-encode all SQL keywords in XML payloads."
      },
      {
        clue: "👁️ What You Notice: The request Content-Type is application/json, but changing it to application/xml is accepted.",
        mechanism: "⚙️ What It Means on the Server: The backend uses a multi-format parser (like Jackson or body-parser) that automatically handles XML.",
        nextMove: "🎯 How to Verify: Convert JSON parameters into XML tags with entity encoding to bypass JSON-only WAF rules."
      },
      {
        clue: "👁️ What You Notice: The WAF blocks hex entities &#x53; but permits decimal entities &#83;.",
        mechanism: "⚙️ What It Means on the Server: The WAF's normalization pipeline only implements hexadecimal decoding.",
        nextMove: "🎯 How to Verify: Convert all payload characters to decimal entity notation &#83;."
      }
    ],
    quiz: [
      {
        q: "What causes the 'impedance mismatch' that enables XML entity encoding WAF bypasses?",
        options:
          [
            { text: "The WAF inspects the raw payload before decoding, while the database receives the payload after the XML parser decodes the entities.", correct: true, why: "Correct! The timing gap between perimeter inspection and backend decoding is the root cause." },
            { text: "XML and SQL use different network port numbers.", correct: false, why: "Remember that ports have nothing to do with payload encoding." }
          ]
      },
      {
        q: "How should modern application security architectures properly prevent this parser bypass?",
        options:
          [
            { text: "Ensure the WAF decodes/canonicalizes XML before inspecting, and enforce parameterized SQL queries on the backend.", correct: true, why: "Spot on! Pre-inspection canonicalization plus backend parameterization guarantees complete defense." },
            { text: "Ban all XML requests across the entire corporate network.", correct: false, why: "Remember that blanket-banning standard data interchange formats breaks legitimate business integrations." }
          ]
      }
    ]
  }
};
