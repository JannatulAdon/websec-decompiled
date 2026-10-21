export default {
  'prototype-pollution-lab-prototype-pollution-client-side-prototype-pollution-via-browser-apis': {
    note: 'A query-string parser merges `__proto__` keys into objects; confirm with a property that changes page behaviour.'
  },
  'prototype-pollution-lab-prototype-pollution-dom-xss-via-client-side-prototype-pollution': {
    note: 'Pollute a property the page passes to a script/HTML sink; the inherited value becomes the payload.',
    work: {
      hints: [
        'Find the client-side merge: the page parses query parameters and merges them into a config object.',
        'The gadget reads a property from an options object and writes it into the DOM or a script URL.',
        'Pollute `__proto__[src]` (or the property the gadget uses) with a `javascript:` URL, then load the page with that query.'
      ],
      approach:
        'Prototype pollution plus a gadget. The merge writes to `Object.prototype`; a later component reads a missing own property and gets the inherited payload. The sink is ordinary DOM XSS, but the source is the prototype chain rather than a direct parameter.',
      request: `GET /?__proto__[src]=javascript:alert(1) HTTP/1.1
Host: LAB-ID.web-security-academy.net
Cookie: session=YOUR-SESSION`,
      tokens: [
        ['__proto__', 'The key that walks the prototype chain instead of creating an own property.'],
        ['[src]', 'Bracket syntax the query parser expands into a nested object.'],
        ['javascript:', 'The value inherited by the gadget and assigned to an iframe/script URL.'],
        ['alert(1)', 'Executes when the polluted URL is navigated to or loaded.'],
        ['(gadget)', 'A component that reads `options.src` without an own-property check.']
      ],
      script: `import sys, requests

host = sys.argv[1]
payload = "?__proto__[src]=javascript:alert(1)"
r = requests.get(f"https://{host}/{payload}", timeout=20)
print(r.status_code)
print("open the URL in a browser; the gadget executes on load")`
    }
  },
  'prototype-pollution-lab-prototype-pollution-dom-xss-via-an-alternative-prototype-pollution-vector': {
    note: '`__proto__` is filtered; use `constructor[prototype]` to reach the same object.'
  },
  'prototype-pollution-lab-prototype-pollution-client-side-prototype-pollution-via-flawed-sanitization': {
    note: 'The sanitiser removes `__proto__` once; a nested or encoded variant survives and pollutes the prototype.'
  },
  'prototype-pollution-lab-prototype-pollution-client-side-prototype-pollution-in-third-party-libraries': {
    note: 'A bundled library (jQuery/lodash) provides the gadget; pollute the option it reads and trigger the sink.'
  },
  'prototype-pollution-lab-privilege-escalation-via-server-side-prototype-pollution': {
    note: 'The server merges JSON into an object; pollute `isAdmin` and access the admin panel.'
  },
  'prototype-pollution-lab-detecting-server-side-prototype-pollution-without-polluted-property-reflection': {
    note: 'No reflected property shows the pollution; use a side effect or error-message gadget to confirm it.'
  },
  'prototype-pollution-lab-bypassing-flawed-input-filters-for-server-side-prototype-pollution': {
    note: 'The filter blocks `__proto__` but not `constructor.prototype`; use the alternate path through the constructor.'
  },
  'prototype-pollution-lab-remote-code-execution-via-server-side-prototype-pollution': {
    note: 'Pollute `shell`/`env`/`argv0` options consumed by `child_process`; the next spawn executes your command.'
  },
  'prototype-pollution-lab-exfiltrating-sensitive-data-via-server-side-prototype-pollution': {
    note: 'A polluted option controls an outbound request; point it at your Collaborator and capture the data.'
  }
}
