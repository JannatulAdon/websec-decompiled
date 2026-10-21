/**
 * Plain-English Jargon Buster Dictionary.
 *
 * Maps technical security terms to:
 *   - term: Display name
 *   - plain: 1-sentence plain-English translation (zero academic buzzwords)
 *   - analogy: Real-world everyday comparison
 *   - units: Array of study unit IDs where this term automatically appears in the "Key Terms" box
 */

export const GLOSSARY = [
  {
    id: 'string-concatenation',
    term: 'String Concatenation',
    plain: 'Gluing pieces of text together end-to-end—like pasting a user’s search word directly into the middle of a database command.',
    analogy: 'Like writing a blank line on an official contract where someone can write extra legal clauses instead of just their name.',
    stage: 'Stage 3 · Databases & Backend',
    units: ['sql-injection/fundamentals']
  },
  {
    id: 'parameterized-query',
    term: 'Parameterized Query (Prepared Statement)',
    plain: 'A safe way to run database commands where the command structure is locked in first, and user input is sent separately in a sealed box.',
    analogy: 'Like a shipping label with a pre-printed barcode slot: no matter what you write inside the box, it cannot change the delivery instructions.',
    stage: 'Stage 3 · Databases & Backend',
    units: ['sql-injection/fundamentals', 'sql-injection/union-attacks']
  },
  {
    id: 'lexer-tokenizer',
    term: 'Tokenizer (Lexer)',
    plain: 'The very first step inside a database or browser that chops a raw line of text into individual words, punctuation marks, and strings.',
    analogy: 'Like your eyes spotting spaces and quotation marks on a page before your brain even thinks about what the sentence means.',
    stage: 'Stage 3 · Databases & Backend',
    units: ['sql-injection/fundamentals', 'sql-injection/waf-bypass-xml']
  },
  {
    id: 'tautology',
    term: 'Always-True Condition (Tautology)',
    plain: 'A simple math or text comparison like `1=1` that is always true, used to trick a database filter into saying "yes" to every row.',
    analogy: 'Like telling a bouncer: "Let me in if my name is on the list OR if 2+2 equals 4."',
    stage: 'Stage 3 · Databases & Backend',
    units: ['sql-injection/fundamentals']
  },
  {
    id: 'union-operator',
    term: 'UNION Operator',
    plain: 'A SQL keyword that staples the results of a second query directly onto the bottom of the original query’s results.',
    analogy: 'Like sneaking an extra page of names onto the bottom of an official guest list printout—as long as your page has the exact same columns.',
    stage: 'Stage 3 · Databases & Backend',
    units: ['sql-injection/union-attacks', 'sql-injection/database-fingerprinting']
  },
  {
    id: 'information-schema',
    term: 'System Catalog (information_schema)',
    plain: 'A built-in master directory inside the database that lists the names of every table and column stored on the server.',
    analogy: 'Like the "Directory" sign in a shopping mall lobby that tells you the exact floor and room number of every store.',
    stage: 'Stage 3 · Databases & Backend',
    units: ['sql-injection/database-fingerprinting']
  },
  {
    id: 'oracle-side-channel',
    term: 'Yes/No Signal (Oracle)',
    plain: 'Any tiny clue in a server’s response—like a missing "Welcome" banner, an error status, or a 5-second pause—that tells you whether a guess was true or false.',
    analogy: 'Playing the game "20 Questions" with someone who only nods or blinks to answer.',
    stage: 'Stage 3 · Databases & Backend',
    units: ['sql-injection/blind', 'authentication', 'nosql-injection']
  },
  {
    id: 'out-of-band-oast',
    term: 'Out-of-Band (OAST)',
    plain: 'Tricking a quiet server into making a phone call (DNS or HTTP lookup) out to a server you control when the normal webpage shows nothing.',
    analogy: 'Slipping a note under a locked door that says "If you can read this, call my cell phone number."',
    stage: 'Stage 3 · Databases & Backend',
    units: ['sql-injection/blind', 'os-command-injection', 'xml-external-entity-xxe-injection', 'server-side-request-forgery-ssrf']
  },
  {
    id: 'xml-entity',
    term: 'XML / HTML Character Entity',
    plain: 'A coded nickname for a character (like `&#x27;` for a single quote) that an XML reader translates back into the real character before passing it on.',
    analogy: 'Spelling a forbidden word in Morse code so the security guard at the front gate doesn’t recognize it, knowing the clerk inside will translate it back.',
    stage: 'Stage 3 · Databases & Backend',
    units: ['sql-injection/waf-bypass-xml', 'xml-external-entity-xxe-injection']
  },
  {
    id: 'waf',
    term: 'WAF (Web Application Firewall)',
    plain: 'A security filter sitting in front of a website that inspects incoming traffic and blocks requests that look suspicious.',
    analogy: 'An airport luggage scanner that checks bags before they reach the plane—if it looks at the bag differently than the destination crew, things slip through.',
    stage: 'Stage 3 · Databases & Backend',
    units: ['sql-injection/waf-bypass-xml', 'cross-site-scripting']
  },
  {
    id: 'canonicalization',
    term: 'Path Normalization (Canonicalization)',
    plain: 'The process where an operating system simplifies a messy file path like `/images/../../etc/passwd` down to its real final destination `/etc/passwd`.',
    analogy: 'Following directions that say "Walk two floors up, then four floors down"—what matters is the floor you actually end up on.',
    stage: 'Stage 1 · Recon',
    units: ['path-traversal', 'web-cache-deception']
  },
  {
    id: 'url-encoding',
    term: 'URL Encoding (Percent-Encoding)',
    plain: 'Replacing special characters in a web address with `%` followed by their hex code (like `%2f` for `/`) so they travel safely inside a URL.',
    analogy: 'Packing fragile items in bubble wrap for shipping; the problem starts when a security check inspects the bubble wrap instead of unwrapping it first.',
    stage: 'Stage 1 · Recon',
    units: ['path-traversal', 'essential-skills', 'sql-injection/waf-bypass-xml']
  },
  {
    id: 'source-map-backup',
    term: 'Debug Artifacts & Source Maps',
    plain: 'Leftover developer files (like `.bak`, `.git`, or `.js.map`) accidentally left on a live website that reveal how the code works behind the scenes.',
    analogy: 'Leaving the architectural blueprints and spare key notes taped to the front window after construction finishes.',
    stage: 'Stage 1 · Recon',
    units: ['information-disclosure', 'essential-skills']
  },
  {
    id: 'username-enumeration',
    term: 'Account Enumeration',
    plain: 'Figuring out which usernames or emails actually exist on a website by watching how the login or password-reset page responds.',
    analogy: 'Dialing extensions in an office building to see which ones ring vs. which ones play "That extension does not exist."',
    stage: 'Stage 2 · Logins & Logic',
    units: ['authentication']
  },
  {
    id: 'session-cookie',
    term: 'Session Cookie / Token',
    plain: 'A digital wristband the server gives your browser after you log in, so you don’t have to type your password on every single click.',
    analogy: 'A VIP concert wristband: once you have it on your wrist, the guards inside don’t check your ID anymore—they just look at the wristband.',
    stage: 'Stage 2 · Logins & Logic',
    units: ['authentication', 'cross-site-request-forgery-csrf', 'cross-site-scripting']
  },
  {
    id: 'idor',
    term: 'IDOR (Insecure Direct Object Reference)',
    plain: 'When a website lets you view or edit someone else’s private data simply by changing an ID number in the URL or request (like `id=102` to `id=103`).',
    analogy: 'A hotel where your room key opens any door as long as you tell the elevator which room number you want to visit.',
    stage: 'Stage 2 · Logins & Logic',
    units: ['access-control-vulnerabilities', 'api-testing']
  },
  {
    id: 'privilege-escalation',
    term: 'Horizontal vs. Vertical Access',
    plain: 'Horizontal means accessing another regular user’s account; Vertical means jumping from a regular user up to an Administrator.',
    analogy: 'Horizontal is peeking into a coworker’s desk drawer; Vertical is walking into the CEO’s office and signing company checks.',
    stage: 'Stage 2 · Logins & Logic',
    units: ['access-control-vulnerabilities']
  },
  {
    id: 'state-machine-flaw',
    term: 'Workflow / Step-Skipping Flaw',
    plain: 'When a website assumes you will always click Step 1 → Step 2 → Step 3 in order, and forgets to check if you jumped straight from Step 1 to Step 3.',
    analogy: 'Walking past the cash register straight to the "Pickup Counter" because the pickup clerk assumes anyone standing there already paid.',
    stage: 'Stage 2 · Logins & Logic',
    units: ['business-logic-vulnerabilities', 'authentication']
  },
  {
    id: 'oauth-redirect-uri',
    term: 'OAuth & redirect_uri',
    plain: 'When you click "Sign in with Google/GitHub," `redirect_uri` is the return address where the login service sends your secret access ticket.',
    analogy: 'Telling the post office where to forward your passport—if an attacker can change that forwarding address, your passport goes to their mailbox.',
    stage: 'Stage 2 · Logins & Logic',
    units: ['oauth-authentication']
  },
  {
    id: 'jwt-signature',
    term: 'JWT (JSON Web Token) & Signature',
    plain: 'A self-contained ID card stored in your browser. The signature at the end is a cryptographic wax seal proving nobody edited the text inside.',
    analogy: 'A printed backstage pass with a hologram seal—if the guard forgets to check the hologram, anyone with a printer can write "ADMIN" on a card.',
    stage: 'Stage 2 · Logins & Logic',
    units: ['jwt']
  },
  {
    id: 'nosql-operator',
    term: 'NoSQL Query Operator ($ne, $regex)',
    plain: 'Special JSON keys starting with `$` in databases like MongoDB that mean "not equal to" or "matches pattern" instead of plain text.',
    analogy: 'Instead of handing a guard a password, handing them an official rulebook card that says "Accept anything that is NOT blank."',
    stage: 'Stage 3 · Databases & Backend',
    units: ['nosql-injection']
  },
  {
    id: 'shell-metacharacter',
    term: 'Shell Separator (;, |, &&, $())',
    plain: 'Punctuation marks in a system terminal that mean "finish this command and immediately run a second command right after it."',
    analogy: 'Adding "...and also open the safe" onto the end of a voice command to a smart speaker.',
    stage: 'Stage 3 · Databases & Backend',
    units: ['os-command-injection']
  },
  {
    id: 'ssrf-loopback',
    term: 'SSRF & Internal Loopback (127.0.0.1)',
    plain: 'Tricking a public web server into fetching a URL that points to its own private internal network (`localhost` or `169.254.169.254`) that outsiders cannot reach directly.',
    analogy: 'Calling a receptionist inside a high-security building and asking them to read aloud a document pinned to the breakroom wall behind them.',
    stage: 'Stage 3 · Databases & Backend',
    units: ['server-side-request-forgery-ssrf']
  },
  {
    id: 'xxe-external-entity',
    term: 'XML External Entity (SYSTEM / file://)',
    plain: 'A feature in XML files that tells the parser "fetch the contents of this file on the server’s hard drive and paste it right here."',
    analogy: 'A mail-merge placeholder in a Word document that automatically pulls in a secret file from the computer printing the letter.',
    stage: 'Stage 3 · Databases & Backend',
    units: ['xml-external-entity-xxe-injection']
  },
  {
    id: 'xss-context',
    term: 'XSS (Cross-Site Scripting) & Context',
    plain: 'When an app takes untrusted text and puts it into a webpage in a way that makes the victim’s browser run it as JavaScript code.',
    analogy: 'Writing stage directions on a teleprompter that the news anchor accidentally reads and acts out live on air.',
    stage: 'Stage 4 · Browser Bugs',
    units: ['cross-site-scripting', 'dom-based-vulnerabilities']
  },
  {
    id: 'csp',
    term: 'CSP (Content Security Policy)',
    plain: 'A browser rule sent by the server that restricts where JavaScript can be loaded from and whether inline scripts are allowed to run.',
    analogy: 'A strict guest list for code: even if someone sneaks a script tag onto the page, the browser checks the list before running it.',
    stage: 'Stage 4 · Browser Bugs',
    units: ['cross-site-scripting']
  },
  {
    id: 'csrf-samesite',
    term: 'CSRF & SameSite Cookies',
    plain: 'CSRF is when another website tricks your browser into sending a request to a site you’re logged into; `SameSite` tells the browser whether to attach your login cookie on cross-site requests.',
    analogy: 'Someone forging a letter in your name while you’re asleep because your mail carrier automatically stamps your official seal on every envelope leaving your house.',
    stage: 'Stage 4 · Browser Bugs',
    units: ['cross-site-request-forgery-csrf']
  },
  {
    id: 'dom-source-sink',
    term: 'DOM Source & Sink',
    plain: 'A "Source" is where untrusted text enters browser JavaScript (like the URL bar); a "Sink" is a dangerous function (like `innerHTML`) that executes or renders it.',
    analogy: 'A Source is an unlocked window where a package comes in; a Sink is the conveyor belt that feeds it straight into the factory engine.',
    stage: 'Stage 4 · Browser Bugs',
    units: ['dom-based-vulnerabilities', 'cross-site-scripting', 'prototype-pollution']
  },
  {
    id: 'iframe-clickjacking',
    term: 'Transparent Iframe Overlay (Clickjacking)',
    plain: 'Stacking an invisible, real website inside an `<iframe>` right on top of a fake button so when you click the fake button, you actually click the real site.',
    analogy: 'Laying a sheet of invisible carbon paper over a prize-entry form so your signature lands on a bank check underneath.',
    stage: 'Stage 4 · Browser Bugs',
    units: ['clickjacking']
  },
  {
    id: 'cors-origin',
    term: 'Same-Origin Policy & CORS',
    plain: 'Browsers normally forbid Website A from reading responses from Website B. CORS headers are permission slips where Website B says "I trust Website A to read my data."',
    analogy: 'A bank refusing to read your balance over the phone unless the caller ID matches a pre-approved list of trusted partners.',
    stage: 'Stage 4 · Browser Bugs',
    units: ['cross-origin-resource-sharing-cors']
  },
  {
    id: 'websocket-handshake',
    term: 'WebSocket Handshake',
    plain: 'The single initial HTTP request that upgrades a normal webpage connection into a permanent, two-way live chat pipe between browser and server.',
    analogy: 'Checking someone’s badge once when they open a direct walkie-talkie channel, and then trusting every message sent over that channel afterward.',
    stage: 'Stage 4 · Browser Bugs',
    units: ['websockets']
  },
  {
    id: 'mime-polyglot',
    term: 'MIME Type & File Polyglot',
    plain: 'A MIME type is a label like `image/jpeg` claiming what a file is; a polyglot is a file crafted to look like a valid image on the outside while containing executable code inside.',
    analogy: 'Hiding a working hollow compartment inside a real hardcover book that passes an X-ray check as a book.',
    stage: 'Stage 5 · APIs, Files & AI',
    units: ['file-upload-vulnerabilities']
  },
  {
    id: 'mass-assignment',
    term: 'Mass Assignment (Auto-Binding)',
    plain: 'When an API automatically copies every field from a user’s JSON request directly into a database user record—including hidden fields like `"isAdmin": true`.',
    analogy: 'A self-checkout kiosk that lets customers scan their own "Employee 100% Discount" barcode if they bring one from home.',
    stage: 'Stage 5 · APIs, Files & AI',
    units: ['api-testing', 'graphql-api-vulnerabilities']
  },
  {
    id: 'graphql-introspection',
    term: 'GraphQL Introspection',
    plain: 'A built-in GraphQL query (`__schema`) that asks the API to print out its entire blueprint of queries, mutations, and hidden fields.',
    analogy: 'Asking a restaurant waiter not just for the public menu, but for the kitchen’s complete recipe book and secret staff menu.',
    stage: 'Stage 5 · APIs, Files & AI',
    units: ['graphql-api-vulnerabilities']
  },
  {
    id: 'toctou-race',
    term: 'Race Window (TOCTOU)',
    plain: 'The tiny split-second gap between when a server checks a rule ("Do you have a coupon left?") and when it updates the database ("Mark coupon used").',
    analogy: 'Swiping the same gift card at five cash registers at the exact same millisecond before the balance update finishes saving.',
    stage: 'Stage 5 · APIs, Files & AI',
    units: ['race-conditions', 'file-upload-vulnerabilities']
  },
  {
    id: 'prompt-injection-agency',
    term: 'Prompt Injection & Excessive Agency',
    plain: 'Tricking an AI assistant into ignoring its developer instructions, especially dangerous when the AI has "agency" (tools to read emails, query databases, or delete accounts).',
    analogy: 'Hiring a helpful intern, giving them the master keys to the office, and letting strangers send them emails with new instructions.',
    stage: 'Stage 5 · APIs, Files & AI',
    units: ['web-llm-attacks']
  },
  {
    id: 'request-desync',
    term: 'HTTP Desync (CL.TE / TE.CL)',
    plain: 'When a front-end proxy and a back-end server disagree on where one HTTP request ends and the next one begins, letting an attacker sneak a hidden request inside.',
    analogy: 'Two mail sorters counting envelopes differently—one counts by weight, the other by sticker—so a hidden letter gets stapled onto the next stranger’s mail.',
    stage: 'Stage 6 · Deep Internals',
    units: ['http-request-smuggling']
  },
  {
    id: 'cache-key-unkeyed',
    term: 'Cache Key vs. Unkeyed Input',
    plain: 'A web cache uses the "Cache Key" (usually the URL) to decide if two users want the same page. An "Unkeyed Input" is an extra header that changes the page content without changing the label on the saved copy.',
    analogy: 'Writing "Drinking Water" on a shared office pitcher (the Cache Key) after slipping hot sauce into it via an uninspected side spout (Unkeyed Input).',
    stage: 'Stage 6 · Deep Internals',
    units: ['web-cache-poisoning', 'web-cache-deception', 'http-host-header-attacks']
  },
  {
    id: 'deserialization-gadget',
    term: 'Deserialization & Gadget Chain',
    plain: 'Deserialization turns saved bytes back into live code objects. A "gadget chain" links existing helper methods in the app together so unpacking the object automatically triggers a command.',
    analogy: 'Building a Rube Goldberg machine out of ordinary office supplies already sitting on the server’s desk, triggered the moment a package is opened.',
    stage: 'Stage 6 · Deep Internals',
    units: ['insecure-deserialization']
  },
  {
    id: 'prototype-pollution',
    term: 'JavaScript Prototype (__proto__)',
    plain: 'The shared fallback template that every JavaScript object inherits from. Polluting it adds a property to every single object in the app at once.',
    analogy: 'Slipping a new rule into the master city building code so every house in town suddenly treats the back door as unlocked by default.',
    stage: 'Stage 6 · Deep Internals',
    units: ['prototype-pollution']
  },
  {
    id: 'ssti-template',
    term: 'Template Engine & SSTI',
    plain: 'A tool (like Jinja2 or Twig) that fills placeholders like `{{user.name}}` into HTML. SSTI happens when user input is placed into the template blueprint itself instead of passed as data.',
    analogy: 'Allowing a customer to edit the formulas inside the store’s Excel spreadsheet instead of just typing a number into a cell.',
    stage: 'Stage 6 · Deep Internals',
    units: ['server-side-template-injection']
  },
  {
    id: 'host-header',
    term: 'HTTP Host Header',
    plain: 'A line in every browser request telling the web server which domain name you typed—often blindly trusted by apps when generating password-reset links.',
    analogy: 'Writing your own return address on an envelope and having the bank mail the victim’s replacement credit card to that address.',
    stage: 'Stage 6 · Deep Internals',
    units: ['http-host-header-attacks']
  }
]

const glossaryById = new Map(GLOSSARY.map((item) => [item.id, item]))

export function termById(id) {
  if (!id) return null
  return (
    glossaryById.get(id) ||
    GLOSSARY.find((g) => g.term.toLowerCase().includes(id.toLowerCase())) ||
    null
  )
}

export function termsForUnit(unitId) {
  if (!unitId) return []
  return GLOSSARY.filter((item) => item.units.includes(unitId))
}
