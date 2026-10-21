export default {
  'business-logic-lab-logic-flaws-excessive-trust-in-client-side-controls': {
    note: 'The cart posts a `price` field that the server charges directly; edit it to buy the jacket for a trivial amount.',
    work: {
      hints: [
        'Add the expensive jacket to the cart and intercept the `POST /cart` request. Look for fields the UI did not ask you for.',
        'The request includes `price=133700`. The server stores and later charges that value instead of looking up the product.',
        'Change `price` to `1` (or `0.01`), complete checkout, and confirm the order total.'
      ],
      approach:
        'The server accepts the unit price from the client and never re-reads it from the product table. This is not a validation bug in the usual sense: the value is syntactically valid, it is simply not authoritative. The trust boundary is the browser.',
      request: `POST /cart HTTP/1.1
Host: LAB-ID.web-security-academy.net
Content-Type: application/x-www-form-urlencoded
Cookie: session=YOUR-SESSION

productId=1&quantity=1&price=1`,
      tokens: [
        ['productId=1', 'Identifies which product to add; the server should use this to look up the price.'],
        ['quantity=1', 'A legitimate quantity. Some variants of this bug also accept a negative value for a refund.'],
        ['price=1', 'The injected authority claim: one currency unit instead of the catalog price.'],
        ['(checkout)', 'The order total is computed from the stored cart line, so the corrupted price carries through.']
      ],
      script: `import sys, requests

host = sys.argv[1]
base = f"https://{host}"
s = requests.Session()
s.post(f"{base}/login", data={"username": "wiener", "password": "peter"}, timeout=20)
s.post(f"{base}/cart", data={"productId": "1", "quantity": "1", "price": "1"}, timeout=20)
checkout = s.get(f"{base}/cart", timeout=20).text
print("total line:", [l for l in checkout.splitlines() if "Total" in l][:2])
s.post(f"{base}/cart/checkout", data={"csrf": ""}, timeout=20)`
    }
  },
  'business-logic-lab-logic-flaws-high-level': {
    note: 'The cart accepts a negative quantity for another item, reducing the total below the store credit threshold.'
  },
  'business-logic-lab-logic-flaws-inconsistent-security-controls': {
    note: 'The admin email domain check applies at registration but not when the email is changed later.'
  },
  'business-logic-lab-logic-flaws-flawed-enforcement-of-business-rules': {
    note: 'The coupon is checked on the client and can be applied repeatedly; stack it until the total is zero.'
  },
  'business-logic-lab-logic-flaws-low-level': {
    note: 'Repeatedly add a large quantity until the integer total overflows into a small or negative value.'
  },
  'business-logic-lab-logic-flaws-inconsistent-handling-of-exceptional-input': {
    note: 'A very long email is truncated by one component and validated by another, letting you register an `@dontwannapeople.org` admin.'
  },
  'business-logic-lab-logic-flaws-weak-isolation-on-dual-use-endpoint': {
    note: 'The profile endpoint doubles as an admin user-management endpoint when a `username` parameter is supplied.'
  },
  'business-logic-lab-logic-flaws-insufficient-workflow-validation': {
    note: 'The order confirmation step can be requested directly, skipping payment and marking the order as paid.'
  },
  'business-logic-lab-logic-flaws-authentication-bypass-via-flawed-state-machine': {
    note: 'The role-selection step can be skipped, leaving the session with the default administrator role.'
  },
  'business-logic-lab-logic-flaws-infinite-money': {
    note: 'A gift-card coupon can be redeemed repeatedly; automate the loop until the store credit covers the jacket.'
  },
  'business-logic-lab-logic-flaws-authentication-bypass-via-encryption-oracle': {
    note: 'The stay-logged-in cookie is encrypted; use the email-change endpoint\'s decrypt error as an oracle to forge an admin cookie.'
  },
  'business-logic-lab-logic-flaws-bypassing-access-controls-using-email-address-parsing-discrepancies': {
    note: 'Registration and access control parse the email differently; a quoted local part or trailing domain trick grants admin.'
  }
}
