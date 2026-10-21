---
title: WebSockets
description: The handshake that bypasses CORS, message-level trust, and cross-site WebSocket hijacking.
---

# WebSockets · The Case of the Open Intercom

<p class="wd-section-lede">A WebSocket is a persistent, two-way communication channel between a browser and a server. While traditional HTTP requests are like sending individual letters back and forth, a WebSocket is an open telephone line. But here is the critical discovery: once a WebSocket is established, it completely bypasses the browser's Same-Origin Policy—making handshake authorization and message validation essential.</p>

<div class="wd-callout">
<p><strong>💡 Everyday Analogy: The Open Intercom Line.</strong> Imagine an office intercom connecting your private desk directly to a storage room. Traditional HTTP is like sending written memos through mail inspection. A WebSocket, however, is a live intercom wire: once someone presses the buzzer and opens the line, both ends can speak instantly without further inspection. If you don't check who pressed the buzzer during the initial connection, an eavesdropper can dial in, listen to private conversations, and shout orders into the room.</p>
</div>

## Case File #1: Cross-Site WebSocket Hijacking (CSWSH)

Let's trace how an external site can tap into your live chat session.

<div class="wd-case">
  <div class="wd-step wd-step--see">
    <span class="wd-step__tag">🔎 Step 1 · What You Notice in the Browser</span>
    <p>You are logged into a customer service portal on <code>support.example</code> and chatting with a representative. Messages appear instantly in the chat window without page refreshes.</p>
  </div>

  <div class="wd-step wd-step--server">
    <span class="wd-step__tag">⚙️ Step 2 · What the Server Does Behind the Scenes</span>
    <p>While that chat is open, you visit an attacker's website on <code>evil.example</code>. JavaScript on their page runs <code>new WebSocket('wss://support.example/chat')</code>. The browser initiates an HTTP Upgrade request, automatically attaching your valid session cookie:</p>
    <div class="wd-codesplit">
      <div class="wd-codesplit__legend">
        <span><span class="wd-code-dev">Blue</span> = Browser Handshake Headers &amp; Valid Session</span>
        <span><span class="wd-code-input">Gold</span> = Attacker's Origin Header</span>
      </div>
      <span class="wd-code-dev">GET /chat HTTP/1.1</span><br>
      <span class="wd-code-dev">Host: support.example</span><br>
      <span class="wd-code-dev">Upgrade: websocket</span><br>
      <span class="wd-code-dev">Connection: Upgrade</span><br>
      <span class="wd-code-dev">Cookie: session=9c4a8f10e7b23d</span><br>
      <span class="wd-code-input">Origin: https://evil.example</span>
    </div>
  </div>

  <div class="wd-step wd-step--break">
    <span class="wd-step__tag">💥 Step 3 · Where the Logic Breaks</span>
    <p>The server sees a valid session cookie and answers <code>101 Switching Protocols</code>. Because the Same-Origin Policy does not restrict WebSocket connections, the server ignores the <code>Origin</code> header! The attacker's script now receives all real-time chat messages and can send messages in the victim's name.</p>
  </div>

  <div class="wd-step wd-step--fix">
    <span class="wd-step__tag">🛡️ Step 4 · How Developers Lock It Down</span>
    <p>Developers strictly validate the <code>Origin</code> header against an approved domain allow-list during the handshake. Additionally, servers require a one-time, unpredictable connection token (like an anti-CSRF token) in the upgrade request to confirm intentional user authorization.</p>
  </div>
</div>

### Visual Comparison: HTTP Same-Origin Policy vs. Unrestricted WebSockets

<div class="wd-compare">
  <div class="wd-compare__card wd-compare__card--expect">
    <span class="wd-compare__title">💭 What the Developer Expected</span>
    <p>The developer assumed that because standard HTTP requests require CORS headers to read data across origins, WebSockets would naturally provide the same cross-origin protections.</p>
  </div>
  <div class="wd-compare__card wd-compare__card--actual">
    <span class="wd-compare__title">💥 What Actually Happened</span>
    <p>WebSockets are not constrained by CORS. Any website on the internet can establish a WebSocket connection to the server, and the browser will attach the user's session cookies automatically.</p>
  </div>
</div>

---

## The WebSocket Connection Lifecycle

From initial HTTP upgrade to continuous data frames, a WebSocket connection moves through five distinct checkpoints:

<div class="wd-flow">
  <div class="wd-flow__node">
    <strong>1. Upgrade Handshake</strong>
    Client sends HTTP request with <code>Upgrade: websocket</code> and session cookie.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>2. Origin &amp; Auth Check</strong>
    Server validates <code>Origin</code> header and verifies session credentials.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--safe">
    <strong>3. 101 Switching Protocols</strong>
    Connection transitions from HTTP to a persistent TCP socket.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node">
    <strong>4. Bi-Directional Frames</strong>
    Client and server exchange text or binary messages continuously.
  </div>
  <span class="wd-flow__arrow">→</span>
  <div class="wd-flow__node wd-flow__node--danger">
    <strong>5. Message Validation</strong>
    Every incoming frame must be parsed, validated, and encoded.
  </div>
</div>

::: details 🔬 Under the Hood: Why WebSockets are Not Covered by CORS
CORS exists to restrict `fetch()` and `XMLHttpRequest` responses inside the browser. When a browser initiates a WebSocket connection, it sends a standard HTTP handshake. However:
1. The browser does not require the server to return `Access-Control-Allow-Origin` before establishing the socket.
2. Any `Access-Control-Allow-Origin` headers returned by the server are completely ignored by the WebSocket API.

The **only** line of defense against cross-site connection hijacking is the server manually inspecting the `Origin` header during the handshake and dropping unauthorized connections.
:::

---

## Message-Level Trust: Validating Every Frame

Opening a secure socket is only half the battle. Once connected, every message sent across the socket must be treated as untrusted user input:

- **Cross-Site Scripting (XSS):** If a chat application broadcasts incoming WebSocket messages to other users without HTML entity encoding, an investigator can send an XSS payload through a socket frame to trigger stored XSS on all connected clients.
- **Server-Side Injection:** Just like HTTP parameters, messages sent over WebSockets can flow into database queries (SQLi) or system commands if not properly parameterized.

<LabGroup ids="websockets-lab-manipulating-messages-to-exploit-vulnerabilities" />

---

## Handshake Header Manipulation

The initial HTTP Upgrade handshake is subject to the same tampering as any regular web request:

- **IP-Based Restrictions:** If a server uses IP allow-lists or rate limits to protect its socket endpoint, spoofing headers like `X-Forwarded-For` may bypass those controls if reverse proxies are misconfigured.
- **Session Replay:** If the WebSocket handshake does not bind the socket to the authenticated session state, replaying handshake parameters may grant unauthorized access.

<LabGroup ids="websockets-lab-manipulating-handshake-to-exploit-vulnerabilities" />

::: details ⚙️ Architecture &amp; Server Quirks: How WebSockets Differ by Stack
- **Nginx Reverse Proxying:** Requires explicit configuration directives (`proxy_set_header Upgrade $http_upgrade` and `proxy_set_header Connection "upgrade"`). A misconfigured proxy may strip upgrade headers or mishandle connections.
- **Node.js `ws` library:** By default, `ws` does **not** verify the `Origin` header. Developers must explicitly implement the `verifyClient` callback.
- **Socket.IO:** Uses its own proprietary protocol on top of WebSockets and long-polling. It includes its own `cors: { origin: ... }` options which behave differently from raw WebSocket implementations.
- **HTTP/2 & HTTP/3:** Traditional `Upgrade:` headers are forbidden in HTTP/2. Instead, RFC 8441 defines an extended `CONNECT` method for tunneling WebSockets over existing HTTP/2 streams.
:::

<div class="wd-callout wd-callout--warn">
<p><strong>🛡️ The Detective's Defense Blueprint.</strong> Always validate the <code>Origin</code> header against an explicit HTTPS allow-list during the handshake. Protect against CSWSH by generating a short-lived, single-use anti-CSRF ticket before opening the socket. Apply the same rigorous input validation and output encoding to WebSocket message frames as you would to standard REST API payloads.</p>
</div>

<TopicComplete topic-id="websockets" label="Mark WebSockets complete" />
