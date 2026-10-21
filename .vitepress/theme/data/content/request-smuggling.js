export default {
  'request-smuggling-lab-basic-cl-te': {
    note: 'The front end uses Content-Length and the back end uses chunked; hide a request after the terminating chunk.',
    work: {
      hints: [
        'Send a POST with both `Content-Length` and `Transfer-Encoding: chunked`, and a body that ends with `0\\r\\n\\r\\n` plus a second request.',
        'The front end counts bytes and forwards everything; the back end stops at the zero chunk and treats the remainder as the next request.',
        'Smuggle `GET /404 HTTP/1.1` with a Host header; the next request on the connection returns 404, proving the desync.'
      ],
      approach:
        'A CL.TE desync. The two parsers disagree about the body length. The smuggled bytes become a prefix for the next request on the back-end connection, so the victim\'s request is appended to the attacker\'s fake request line.',
      request: `POST / HTTP/1.1
Host: LAB-ID.web-security-academy.net
Content-Length: 13
Transfer-Encoding: chunked

0

SMUGGLED`,
      tokens: [
        ['Content-Length: 13', 'The front end forwards exactly 13 bytes after the blank line: `0`, CRLF, CRLF, and `SMUGGLED`.'],
        ['Transfer-Encoding: chunked', 'The back end ignores CL and parses chunks. It stops at the `0` chunk.'],
        ['0', 'The terminating chunk: zero-length body, followed by an empty trailer.'],
        ['(blank line)', 'Ends the chunked body for the back end.'],
        ['SMUGGLED', 'Leftover bytes the back end treats as the start of the next request on the connection.']
      ],
      script: `import sys, socket

host = sys.argv[1]
body = "0\\r\\n\\r\\nGET /404 HTTP/1.1\\r\\nHost: %s\\r\\n\\r\\n" % host
req = (
    f"POST / HTTP/1.1\\r\\nHost: {host}\\r\\n"
    f"Content-Length: {len(body)}\\r\\n"
    "Transfer-Encoding: chunked\\r\\n\\r\\n" + body
)
with socket.create_connection((host, 443)) as s:
    s.sendall(req.encode())
    print(s.recv(4096).decode(errors="replace"))`
    }
  },
  'request-smuggling-lab-confirming-cl-te-via-differential-responses': {
    note: 'Send a CL.TE probe that makes the back end wait for more body; a timing difference confirms the desync.'
  },
  'request-smuggling-lab-bypass-front-end-controls-cl-te': {
    note: 'The front end blocks `/admin`; smuggle a request to `/admin` so the back end sees it without the front-end check.'
  },
  'request-smuggling-lab-bypass-front-end-controls-te-cl': {
    note: 'Same access-control bypass with the TE.CL direction; the back end stops at Content-Length and parses the rest.'
  },
  'request-smuggling-lab-reveal-front-end-request-rewriting': {
    note: 'The front end adds headers; smuggle a request to a reflection endpoint that echoes them back.'
  },
  'request-smuggling-lab-capture-other-users-requests': {
    note: 'Smuggle a request that stores the next request (including cookies) in a comment or search log.'
  },
  'request-smuggling-lab-deliver-reflected-xss': {
    note: 'Smuggle a request whose response is the XSS payload; the next victim receives the poisoned response.'
  },
  'request-smuggling-lab-request-smuggling-h2-response-queue-poisoning-via-te-request-smuggling': {
    note: 'An H2.TE desync causes responses to be queued against the wrong requests, exposing other users\' pages.'
  },
  'request-smuggling-lab-request-smuggling-h2-cl-request-smuggling': {
    note: 'The HTTP/2 gateway honours an injected Content-Length; the back end uses it and leaves a smuggled suffix.'
  },
  'request-smuggling-lab-request-smuggling-h2-request-smuggling-via-crlf-injection': {
    note: 'A header value with CRLF becomes a new header or request line when the gateway downgrades to HTTP/1.1.'
  },
  'request-smuggling-lab-request-smuggling-h2-request-splitting-via-crlf-injection': {
    note: 'CRLF in a pseudo-header splits the request into two, letting the attacker control the second.'
  },
  'request-smuggling-lab-request-smuggling-0cl-request-smuggling': {
    note: 'The front end treats the request as bodyless; the back end honours Content-Length and consumes the next request.'
  },
  'request-smuggling-lab-cl-0-request-smuggling': {
    note: 'The back end ignores Content-Length on a GET, so the declared body is parsed as a new request.'
  },
  'request-smuggling-lab-confirming-te-cl-via-differential-responses': {
    note: 'A TE.CL probe leaves the back end waiting for a body that never arrives; the delay confirms the desync.'
  },
  'request-smuggling-lab-basic-te-cl': {
    note: 'The front end uses chunked and the back end uses Content-Length; the remainder after the declared length is smuggled.'
  },
  'request-smuggling-lab-obfuscating-te-header': {
    note: 'Duplicate or malform the TE header (`xchunked`, extra whitespace) to make one server ignore chunked encoding.'
  },
  'request-smuggling-lab-perform-web-cache-poisoning': {
    note: 'Smuggle a request that poisons the cache with an attacker-controlled response for a shared URL.'
  },
  'request-smuggling-lab-perform-web-cache-deception': {
    note: 'Smuggle a request so a private response is cached under a public URL and later retrieved.'
  },
  'request-smuggling-lab-request-smuggling-h2-bypass-access-controls-via-request-tunnelling': {
    note: 'Tunnel a request through the front end\'s own connection so the back end sees an admin path without front-end checks.'
  },
  'request-smuggling-lab-request-smuggling-h2-web-cache-poisoning-via-request-tunnelling': {
    note: 'Use request tunnelling to inject a poisoned response into the cache for a shared URL.'
  },
  'request-smuggling-lab-client-side-desync': {
    note: 'The browser is the front end; a request with a mismatched body leaves the connection desynced for the next request.'
  },
  'request-smuggling-lab-server-side-pause-based-request-smuggling': {
    note: 'The back end processes headers before the body; pause mid-body so the next request is parsed as part of this one.'
  }
}
