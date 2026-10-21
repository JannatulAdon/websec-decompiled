export default {
  'information-disclosure-lab-infoleak-in-error-messages': {
    note: 'A malformed product ID triggers an unhandled exception that prints the framework and version.'
  },
  'information-disclosure-lab-infoleak-on-debug-page': {
    note: 'A leftover debug endpoint exposes the application environment, including a secret key.'
  },
  'information-disclosure-lab-infoleak-via-backup-files': {
    note: '`robots.txt` points at `/backup`; a `.java.bak` file there contains hardcoded database credentials.',
    work: {
      hints: [
        'Check `/robots.txt` for paths the site does not want crawled. One of them is a directory.',
        'The directory holds a backup of a source file. Editors and deploy scripts append `.bak` to the original name.',
        'Fetch `/backup/ProductTemplate.java.bak`, then use the credentials in it to log in as `administrator`.'
      ],
      approach:
        'A build artifact left inside the web root. The backup preserves the source of a server-side template, including the database password. Nothing is "injected"; the application simply serves a file it should never have deployed.',
      request: `GET /backup/ProductTemplate.java.bak HTTP/1.1
Host: LAB-ID.web-security-academy.net
Connection: close`,
      tokens: [
        ['/backup/', 'A directory disclosed by robots.txt. Crawler rules are advisory, not access control.'],
        ['ProductTemplate', 'The live class name, guessable from the product page behaviour.'],
        ['.java', 'Original source extension, recovered rather than compiled.'],
        ['.bak', 'Editor/deploy backup suffix. Web servers often map unknown extensions to a static file handler.'],
        ['(body)', 'Contains the JDBC URL, username, and password used by the application.']
      ],
      script: `import sys, re, requests

host = sys.argv[1]
base = f"https://{host}"
robots = requests.get(f"{base}/robots.txt", timeout=20).text
print(robots)
r = requests.get(f"{base}/backup/ProductTemplate.java.bak", timeout=20)
print(r.status_code)
for line in r.text.splitlines():
    if re.search(r"password|jdbc|user", line, re.I):
        print(line.strip())`
    }
  },
  'information-disclosure-lab-infoleak-authentication-bypass': {
    note: 'A custom `X-Custom-IP-Authorization` header is trusted for admin access; the error page reveals the expected value.'
  },
  'information-disclosure-lab-infoleak-in-version-control-history': {
    note: 'Exposed `/.git/` allows reconstructing history; the administrator password was committed then removed.'
  }
}
