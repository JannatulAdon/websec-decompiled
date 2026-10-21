export default {
  'access-control-lab-unprotected-admin-functionality': {
    note: 'The admin panel is reachable without a role check; `robots.txt` discloses the path.'
  },
  'access-control-lab-unprotected-admin-functionality-with-unpredictable-url': {
    note: 'The admin URL is random but leaked in client-side JavaScript; the endpoint itself has no authorisation.'
  },
  'access-control-lab-user-role-controlled-by-request-parameter': {
    note: 'The role is stored in a cookie and trusted on each request; set `Admin=true` and reach `/admin`.'
  },
  'access-control-lab-user-role-can-be-modified-in-user-profile': {
    note: 'The profile update endpoint accepts a `roleid` field the UI never sends; mass assignment promotes the user.'
  },
  'access-control-lab-user-id-controlled-by-request-parameter': {
    note: '`/my-account?id=` selects the account by request parameter; change it to `carlos` to read his API key.',
    work: {
      hints: [
        'Log in as `wiener` and open your account page. The URL contains an identifier.',
        'The server uses that identifier to choose the row it returns; it never compares the row owner to your session.',
        'Request `/my-account?id=carlos` and read the API key from the response.'
      ],
      approach:
        'Horizontal privilege escalation through a direct object reference. The session authenticates `wiener`, but the object selector is client-controlled and there is no ownership check. The response is a normal 200 page, not an error, because the server believes it is serving your account.',
      request: `GET /my-account?id=carlos HTTP/1.1
Host: LAB-ID.web-security-academy.net
Cookie: session=WIENER-SESSION
Connection: close`,
      tokens: [
        ['/my-account', 'An authenticated route: the session is valid, so authentication succeeds.'],
        ['?id=carlos', 'The object selector. It should be ignored in favour of the session principal.'],
        ['carlos', 'A predictable username. Unpredictable ids raise cost but do not fix the missing check.'],
        ['Cookie: session', 'Identifies the caller as wiener; the mismatch with `id` is the vulnerability.'],
        ['200 OK', 'No authorisation error because no authorisation decision was made.']
      ],
      script: `import sys, re, requests

host = sys.argv[1]
base = f"https://{host}"
s = requests.Session()
s.post(f"{base}/login", data={"username": "wiener", "password": "peter"}, timeout=20)
r = s.get(f"{base}/my-account", params={"id": "carlos"}, timeout=20)
print(r.status_code)
m = re.search(r"API Key[^A-Za-z0-9]+([A-Za-z0-9]+)", r.text)
print("api key:", m.group(1) if m else "not found")`
    }
  },
  'access-control-lab-user-id-controlled-by-request-parameter-with-unpredictable-user-ids': {
    note: 'User ids are GUIDs, but the application leaks them in blog author links and comments.'
  },
  'access-control-lab-user-id-controlled-by-request-parameter-with-data-leakage-in-redirect': {
    note: 'The unauthorised response redirects, but the redirect body still contains the victim\'s data before the browser follows it.'
  },
  'access-control-lab-user-id-controlled-by-request-parameter-with-password-disclosure': {
    note: 'Changing the id returns the victim\'s account page with the password prefilled in a masked input.'
  },
  'access-control-lab-insecure-direct-object-references': {
    note: 'A chat transcript is fetched by a numeric id stored in a hidden field; enumerate ids to read another user\'s log.'
  },
  'access-control-lab-url-based-access-control-can-be-circumvented': {
    note: 'The front end blocks `/admin`, but the backend honours `X-Original-URL`; send the blocked path in that header.'
  },
  'access-control-lab-method-based-access-control-can-be-circumvented': {
    note: 'Only `POST /admin-roles` is protected; replay the role change with `GET` and the same parameters.'
  },
  'access-control-lab-multi-step-process-with-no-access-control-on-one-step': {
    note: 'The upgrade workflow checks authorisation on step 1, but step 3 accepts a direct request from a normal user.'
  },
  'access-control-lab-referer-based-access-control': {
    note: 'The admin action trusts the `Referer` header; replay it with `Referer: /admin` from a normal account.'
  }
}
