export default {
  'cors-lab-basic-origin-reflection-attack': {
    note: 'The API echoes any `Origin` and allows credentials; fetch `/accountDetails` from an attacker page and read the API key.',
    work: {
      hints: [
        'Send a request to an authenticated API endpoint with `Origin: https://example.com` and inspect the CORS headers.',
        'The server reflects the origin and sets `Access-Control-Allow-Credentials: true`. The browser will now allow a cross-origin read.',
        'Host a page that runs `fetch(url, {credentials:"include"})` and exfiltrates the JSON response.'
      ],
      approach:
        'The server trusts every origin. With credentials allowed, the victim\'s browser attaches the session cookie and hands the response body to the attacker\'s JavaScript. The same-origin policy is disabled for this endpoint by the response headers.',
      request: `GET /accountDetails HTTP/1.1
Host: LAB-ID.web-security-academy.net
Origin: https://attacker.example
Cookie: session=VICTIM-SESSION

HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://attacker.example
Access-Control-Allow-Credentials: true
Vary: Origin`,
      tokens: [
        ['Origin:', 'A forbidden header the browser sets automatically to the calling page\'s origin.'],
        ['Access-Control-Allow-Origin: <reflected>', 'The server agrees to expose the response to the caller. Reflection defeats the allow-list.'],
        ['Access-Control-Allow-Credentials: true', 'Permits cookies on the cross-origin request and exposes the response to the caller.'],
        ['credentials: "include"', 'The client-side opt-in that sends cookies; without it, the session is not attached.'],
        ['Vary: Origin', 'Correct caching behaviour for reflected origins; its absence is a separate cache-poisoning risk.']
      ],
      script: `import sys, requests

host, collab = sys.argv[1], sys.argv[2]
r = requests.get(f"https://{host}/accountDetails",
                 headers={"Origin": f"https://{collab}"}, timeout=20)
for h in ("access-control-allow-origin", "access-control-allow-credentials"):
    print(h, ":", r.headers.get(h))
print(r.text[:300])`
    }
  },
  'cors-lab-null-origin-whitelisted-attack': {
    note: 'The allow-list trusts `null`; a sandboxed iframe sends `Origin: null` and can read the response.'
  },
  'cors-lab-breaking-https-attack': {
    note: 'The allow-list trusts any `http://` subdomain; an HTTP page on a sibling can read HTTPS responses.'
  }
}
