export default {
  "topics": [
    {
      "id": "sql-injection",
      "slug": "sql-injection",
      "title": "SQL Injection",
      "phase": "Server-side",
      "blurb": "Break the data/control boundary, then read the catalog and infer through any channel that leaks a bit.",
      "labs": [
        {
          "id": "lab-retrieve-hidden-data",
          "title": "SQL injection vulnerability in WHERE clause allowing retrieval of hidden data",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/sql-injection/lab-retrieve-hidden-data"
        },
        {
          "id": "lab-login-bypass",
          "title": "SQL injection vulnerability allowing login bypass",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/sql-injection/lab-login-bypass"
        },
        {
          "id": "lab-querying-database-version-oracle",
          "title": "SQL injection attack, querying the database type and version on Oracle",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/sql-injection/examining-the-database/lab-querying-database-version-oracle"
        },
        {
          "id": "lab-querying-database-version-mysql-microsoft",
          "title": "SQL injection attack, querying the database type and version on MySQL and Microsoft",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/sql-injection/examining-the-database/lab-querying-database-version-mysql-microsoft"
        },
        {
          "id": "lab-listing-database-contents-non-oracle",
          "title": "SQL injection attack, listing the database contents on non-Oracle databases",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/sql-injection/examining-the-database/lab-listing-database-contents-non-oracle"
        },
        {
          "id": "lab-listing-database-contents-oracle",
          "title": "SQL injection attack, listing the database contents on Oracle",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/sql-injection/examining-the-database/lab-listing-database-contents-oracle"
        },
        {
          "id": "lab-determine-number-of-columns",
          "title": "SQL injection UNION attack, determining the number of columns returned by the query",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/sql-injection/union-attacks/lab-determine-number-of-columns"
        },
        {
          "id": "lab-find-column-containing-text",
          "title": "SQL injection UNION attack, finding a column containing text",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/sql-injection/union-attacks/lab-find-column-containing-text"
        },
        {
          "id": "lab-retrieve-data-from-other-tables",
          "title": "SQL injection UNION attack, retrieving data from other tables",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/sql-injection/union-attacks/lab-retrieve-data-from-other-tables"
        },
        {
          "id": "lab-retrieve-multiple-values-in-single-column",
          "title": "SQL injection UNION attack, retrieving multiple values in a single column",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/sql-injection/union-attacks/lab-retrieve-multiple-values-in-single-column"
        },
        {
          "id": "lab-conditional-responses",
          "title": "Blind SQL injection with conditional responses",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/sql-injection/blind/lab-conditional-responses"
        },
        {
          "id": "lab-conditional-errors",
          "title": "Blind SQL injection with conditional errors",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/sql-injection/blind/lab-conditional-errors"
        },
        {
          "id": "lab-visible-error-based",
          "title": "Visible error-based SQL injection",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/sql-injection/blind/lab-sql-injection-visible-error-based"
        },
        {
          "id": "lab-time-delays",
          "title": "Blind SQL injection with time delays",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/sql-injection/blind/lab-time-delays"
        },
        {
          "id": "lab-time-delays-info-retrieval",
          "title": "Blind SQL injection with time delays and information retrieval",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/sql-injection/blind/lab-time-delays-info-retrieval"
        },
        {
          "id": "lab-out-of-band",
          "title": "Blind SQL injection with out-of-band interaction",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/sql-injection/blind/lab-out-of-band"
        },
        {
          "id": "lab-out-of-band-data-exfiltration",
          "title": "Blind SQL injection with out-of-band data exfiltration",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/sql-injection/blind/lab-out-of-band-data-exfiltration"
        },
        {
          "id": "lab-filter-bypass-xml-encoding",
          "title": "SQL injection with filter bypass via XML encoding",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/sql-injection/lab-sql-injection-with-filter-bypass-via-xml-encoding"
        }
      ]
    },
    {
      "id": "cross-site-scripting",
      "slug": "xss",
      "title": "Cross-Site Scripting (XSS)",
      "phase": "Client-side",
      "blurb": "HTML parsing contexts, sink/source pairs, CSP, and the encoding decisions that decide whether a tag is markup.",
      "labs": [
        {
          "id": "xss-reflected-lab-html-context-nothing-encoded",
          "title": "Reflected XSS into HTML context with nothing encoded",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/cross-site-scripting/reflected/lab-html-context-nothing-encoded"
        },
        {
          "id": "xss-stored-lab-html-context-nothing-encoded",
          "title": "Stored XSS into HTML context with nothing encoded",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/cross-site-scripting/stored/lab-html-context-nothing-encoded"
        },
        {
          "id": "xss-lab-document-write-sink",
          "title": "DOM XSS in document.write sink using source location.search",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/cross-site-scripting/dom-based/lab-document-write-sink"
        },
        {
          "id": "xss-lab-innerhtml-sink",
          "title": "DOM XSS in innerHTML sink using source location.search",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/cross-site-scripting/dom-based/lab-innerhtml-sink"
        },
        {
          "id": "xss-lab-jquery-href-attribute-sink",
          "title": "DOM XSS in jQuery anchor href attribute sink using location.search source",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/cross-site-scripting/dom-based/lab-jquery-href-attribute-sink"
        },
        {
          "id": "xss-lab-jquery-selector-hash-change-event",
          "title": "DOM XSS in jQuery selector sink using a hashchange event",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/cross-site-scripting/dom-based/lab-jquery-selector-hash-change-event"
        },
        {
          "id": "xss-lab-attribute-angle-brackets-html-encoded",
          "title": "Reflected XSS into attribute with angle brackets HTML-encoded",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/cross-site-scripting/contexts/lab-attribute-angle-brackets-html-encoded"
        },
        {
          "id": "xss-lab-href-attribute-double-quotes-html-encoded",
          "title": "Stored XSS into anchor href attribute with double quotes HTML-encoded",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/cross-site-scripting/contexts/lab-href-attribute-double-quotes-html-encoded"
        },
        {
          "id": "xss-lab-javascript-string-angle-brackets-html-encoded",
          "title": "Reflected XSS into a JavaScript string with angle brackets HTML encoded",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/cross-site-scripting/contexts/lab-javascript-string-angle-brackets-html-encoded"
        },
        {
          "id": "xss-lab-document-write-sink-inside-select-element",
          "title": "DOM XSS in document.write sink using source location.search inside a select element",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/cross-site-scripting/dom-based/lab-document-write-sink-inside-select-element"
        },
        {
          "id": "xss-lab-angularjs-expression",
          "title": "DOM XSS in AngularJS expression with angle brackets and double quotes HTML-encoded",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/cross-site-scripting/dom-based/lab-angularjs-expression"
        },
        {
          "id": "xss-lab-dom-xss-reflected",
          "title": "Reflected DOM XSS",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/cross-site-scripting/dom-based/lab-dom-xss-reflected"
        },
        {
          "id": "xss-lab-dom-xss-stored",
          "title": "Stored DOM XSS",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/cross-site-scripting/dom-based/lab-dom-xss-stored"
        },
        {
          "id": "xss-lab-html-context-with-most-tags-and-attributes-blocked",
          "title": "Reflected XSS into HTML context with most tags and attributes blocked",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/cross-site-scripting/contexts/lab-html-context-with-most-tags-and-attributes-blocked"
        },
        {
          "id": "xss-lab-html-context-with-all-standard-tags-blocked",
          "title": "Reflected XSS into HTML context with all tags blocked except custom ones",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/cross-site-scripting/contexts/lab-html-context-with-all-standard-tags-blocked"
        },
        {
          "id": "xss-lab-some-svg-markup-allowed",
          "title": "Reflected XSS with some SVG markup allowed",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/cross-site-scripting/contexts/lab-some-svg-markup-allowed"
        },
        {
          "id": "xss-lab-canonical-link-tag",
          "title": "Reflected XSS in canonical link tag",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/cross-site-scripting/contexts/lab-canonical-link-tag"
        },
        {
          "id": "xss-lab-javascript-string-single-quote-backslash-escaped",
          "title": "Reflected XSS into a JavaScript string with single quote and backslash escaped",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/cross-site-scripting/contexts/lab-javascript-string-single-quote-backslash-escaped"
        },
        {
          "id": "xss-lab-javascript-string-angle-brackets-double-quotes-encoded-single-quotes-escaped",
          "title": "Reflected XSS into a JavaScript string with angle brackets and double quotes HTML-encoded and single quotes escaped",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/cross-site-scripting/contexts/lab-javascript-string-angle-brackets-double-quotes-encoded-single-quotes-escaped"
        },
        {
          "id": "xss-lab-onclick-event-angle-brackets-double-quotes-html-encoded-single-quotes-backslash-escaped",
          "title": "Stored XSS into onclick event with angle brackets and double quotes HTML-encoded and single quotes and backslash escaped",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/cross-site-scripting/contexts/lab-onclick-event-angle-brackets-double-quotes-html-encoded-single-quotes-backslash-escaped"
        },
        {
          "id": "xss-lab-javascript-template-literal-angle-brackets-single-double-quotes-backslash-backticks-escaped",
          "title": "Reflected XSS into a template literal with angle brackets, single, double quotes, backslash and backticks Unicode-escaped",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/cross-site-scripting/contexts/lab-javascript-template-literal-angle-brackets-single-double-quotes-backslash-backticks-escaped"
        },
        {
          "id": "xss-lab-stealing-cookies",
          "title": "Exploiting cross-site scripting to steal cookies",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/cross-site-scripting/exploiting/lab-stealing-cookies"
        },
        {
          "id": "xss-lab-capturing-passwords",
          "title": "Exploiting cross-site scripting to capture passwords",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/cross-site-scripting/exploiting/lab-capturing-passwords"
        },
        {
          "id": "xss-lab-perform-csrf",
          "title": "Exploiting XSS to bypass CSRF defenses",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/cross-site-scripting/exploiting/lab-perform-csrf"
        },
        {
          "id": "xss-lab-angular-sandbox-escape-without-strings",
          "title": "Reflected XSS with AngularJS sandbox escape without strings",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/cross-site-scripting/contexts/client-side-template-injection/lab-angular-sandbox-escape-without-strings"
        },
        {
          "id": "xss-lab-angular-sandbox-escape-and-csp",
          "title": "Reflected XSS with AngularJS sandbox escape and CSP",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/cross-site-scripting/contexts/client-side-template-injection/lab-angular-sandbox-escape-and-csp"
        },
        {
          "id": "xss-lab-event-handlers-and-href-attributes-blocked",
          "title": "Reflected XSS with event handlers and href attributes blocked",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/cross-site-scripting/contexts/lab-event-handlers-and-href-attributes-blocked"
        },
        {
          "id": "xss-lab-javascript-url-some-characters-blocked",
          "title": "Reflected XSS in a JavaScript URL with some characters blocked",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/cross-site-scripting/contexts/lab-javascript-url-some-characters-blocked"
        },
        {
          "id": "xss-lab-very-strict-csp-with-dangling-markup-attack",
          "title": "Reflected XSS protected by very strict CSP, with dangling markup attack",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/cross-site-scripting/content-security-policy/lab-very-strict-csp-with-dangling-markup-attack"
        },
        {
          "id": "xss-lab-csp-bypass",
          "title": "Reflected XSS protected by CSP, with CSP bypass",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/cross-site-scripting/content-security-policy/lab-csp-bypass"
        }
      ]
    },
    {
      "id": "cross-site-request-forgery-csrf",
      "slug": "csrf",
      "title": "CSRF",
      "phase": "Client-side",
      "blurb": "Ambient credentials, SameSite, token validation gaps, and requests a browser will send without asking.",
      "labs": [
        {
          "id": "csrf-lab-no-defenses",
          "title": "CSRF vulnerability with no defenses",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/csrf/lab-no-defenses"
        },
        {
          "id": "csrf-lab-token-validation-depends-on-request-method",
          "title": "CSRF where token validation depends on request method",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/csrf/bypassing-token-validation/lab-token-validation-depends-on-request-method"
        },
        {
          "id": "csrf-lab-token-validation-depends-on-token-being-present",
          "title": "CSRF where token validation depends on token being present",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/csrf/bypassing-token-validation/lab-token-validation-depends-on-token-being-present"
        },
        {
          "id": "csrf-lab-token-not-tied-to-user-session",
          "title": "CSRF where token is not tied to user session",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/csrf/bypassing-token-validation/lab-token-not-tied-to-user-session"
        },
        {
          "id": "csrf-lab-token-tied-to-non-session-cookie",
          "title": "CSRF where token is tied to non-session cookie",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/csrf/bypassing-token-validation/lab-token-tied-to-non-session-cookie"
        },
        {
          "id": "csrf-lab-token-duplicated-in-cookie",
          "title": "CSRF where token is duplicated in cookie",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/csrf/bypassing-token-validation/lab-token-duplicated-in-cookie"
        },
        {
          "id": "csrf-lab-samesite-lax-bypass-via-method-override",
          "title": "SameSite Lax bypass via method override",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/csrf/bypassing-samesite-restrictions/lab-samesite-lax-bypass-via-method-override"
        },
        {
          "id": "csrf-lab-samesite-strict-bypass-via-client-side-redirect",
          "title": "SameSite Strict bypass via client-side redirect",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/csrf/bypassing-samesite-restrictions/lab-samesite-strict-bypass-via-client-side-redirect"
        },
        {
          "id": "csrf-lab-samesite-strict-bypass-via-sibling-domain",
          "title": "SameSite Strict bypass via sibling domain",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/csrf/bypassing-samesite-restrictions/lab-samesite-strict-bypass-via-sibling-domain"
        },
        {
          "id": "csrf-lab-referer-validation-depends-on-header-being-present",
          "title": "CSRF where Referer validation depends on header being present",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/csrf/bypassing-referer-based-defenses/lab-referer-validation-depends-on-header-being-present"
        },
        {
          "id": "csrf-lab-referer-validation-broken",
          "title": "CSRF with broken Referer validation",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/csrf/bypassing-referer-based-defenses/lab-referer-validation-broken"
        }
      ]
    },
    {
      "id": "clickjacking",
      "slug": "clickjacking",
      "title": "Clickjacking",
      "phase": "Client-side",
      "blurb": "Framing, overlay geometry, and the header and DOM defences that can be bypassed or simply absent.",
      "labs": [
        {
          "id": "clickjacking-lab-basic-csrf-protected",
          "title": "Basic clickjacking with CSRF token protection",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/clickjacking/lab-basic-csrf-protected"
        },
        {
          "id": "clickjacking-lab-prefilled-form-input",
          "title": "Clickjacking with form input data prefilled from a URL parameter",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/clickjacking/lab-prefilled-form-input"
        },
        {
          "id": "clickjacking-lab-frame-buster-script",
          "title": "Clickjacking with a frame buster script",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/clickjacking/lab-frame-buster-script"
        },
        {
          "id": "clickjacking-lab-exploiting-to-trigger-dom-based-xss",
          "title": "Exploiting clickjacking vulnerability to trigger DOM-based XSS",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/clickjacking/lab-exploiting-to-trigger-dom-based-xss"
        },
        {
          "id": "clickjacking-lab-multistep",
          "title": "Multistep clickjacking",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/clickjacking/lab-multistep"
        }
      ]
    },
    {
      "id": "dom-based-vulnerabilities",
      "slug": "dom",
      "title": "DOM-Based Vulnerabilities",
      "phase": "Client-side",
      "blurb": "Sources, sinks, and the taint path inside JavaScript: from location.hash to innerHTML and beyond.",
      "labs": [
        {
          "id": "dom-lab-dom-xss-using-web-messages",
          "title": "DOM XSS using web messages",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/dom-based/controlling-the-web-message-source/lab-dom-xss-using-web-messages"
        },
        {
          "id": "dom-lab-dom-xss-using-web-messages-and-a-javascript-url",
          "title": "DOM XSS using web messages and a JavaScript URL",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/dom-based/controlling-the-web-message-source/lab-dom-xss-using-web-messages-and-a-javascript-url"
        },
        {
          "id": "dom-lab-dom-xss-using-web-messages-and-json-parse",
          "title": "DOM XSS using web messages and JSON.parse",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/dom-based/controlling-the-web-message-source/lab-dom-xss-using-web-messages-and-json-parse"
        },
        {
          "id": "dom-lab-dom-open-redirection",
          "title": "DOM-based open redirection",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/dom-based/open-redirection/lab-dom-open-redirection"
        },
        {
          "id": "dom-lab-dom-cookie-manipulation",
          "title": "DOM-based cookie manipulation",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/dom-based/cookie-manipulation/lab-dom-cookie-manipulation"
        },
        {
          "id": "dom-lab-dom-xss-exploiting-dom-clobbering",
          "title": "Exploiting DOM clobbering to enable XSS",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/dom-based/dom-clobbering/lab-dom-xss-exploiting-dom-clobbering"
        },
        {
          "id": "dom-lab-dom-clobbering-attributes-to-bypass-html-filters",
          "title": "Clobbering DOM attributes to bypass HTML filters",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/dom-based/dom-clobbering/lab-dom-clobbering-attributes-to-bypass-html-filters"
        }
      ]
    },
    {
      "id": "cross-origin-resource-sharing-cors",
      "slug": "cors",
      "title": "CORS",
      "phase": "Client-side",
      "blurb": "Origin reflection, null origins, and the exact preflight rules that separate reading a response from sending one.",
      "labs": [
        {
          "id": "cors-lab-basic-origin-reflection-attack",
          "title": "CORS vulnerability with basic origin reflection",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/cors/lab-basic-origin-reflection-attack"
        },
        {
          "id": "cors-lab-null-origin-whitelisted-attack",
          "title": "CORS vulnerability with trusted null origin",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/cors/lab-null-origin-whitelisted-attack"
        },
        {
          "id": "cors-lab-breaking-https-attack",
          "title": "CORS vulnerability with trusted insecure protocols",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/cors/lab-breaking-https-attack"
        }
      ]
    },
    {
      "id": "xml-external-entity-xxe-injection",
      "slug": "xxe",
      "title": "XXE Injection",
      "phase": "Server-side",
      "blurb": "DTD semantics: external entities, parameter entities, file disclosure, and out-of-band exfiltration.",
      "labs": [
        {
          "id": "xxe-lab-exploiting-xxe-to-retrieve-files",
          "title": "Exploiting XXE using external entities to retrieve files",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/xxe/lab-exploiting-xxe-to-retrieve-files"
        },
        {
          "id": "xxe-lab-exploiting-xxe-to-perform-ssrf",
          "title": "Exploiting XXE to perform SSRF attacks",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/xxe/lab-exploiting-xxe-to-perform-ssrf"
        },
        {
          "id": "xxe-lab-xxe-with-out-of-band-interaction",
          "title": "Blind XXE with out-of-band interaction",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/xxe/blind/lab-xxe-with-out-of-band-interaction"
        },
        {
          "id": "xxe-lab-xxe-with-out-of-band-interaction-using-parameter-entities",
          "title": "Blind XXE with out-of-band interaction via XML parameter entities",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/xxe/blind/lab-xxe-with-out-of-band-interaction-using-parameter-entities"
        },
        {
          "id": "xxe-lab-xxe-with-out-of-band-exfiltration",
          "title": "Exploiting blind XXE to exfiltrate data using a malicious external DTD",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/xxe/blind/lab-xxe-with-out-of-band-exfiltration"
        },
        {
          "id": "xxe-lab-xxe-with-data-retrieval-via-error-messages",
          "title": "Exploiting blind XXE to retrieve data via error messages",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/xxe/blind/lab-xxe-with-data-retrieval-via-error-messages"
        },
        {
          "id": "xxe-lab-xinclude-attack",
          "title": "Exploiting XInclude to retrieve files",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/xxe/lab-xinclude-attack"
        },
        {
          "id": "xxe-lab-xxe-via-file-upload",
          "title": "Exploiting XXE via image file upload",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/xxe/lab-xxe-via-file-upload"
        },
        {
          "id": "xxe-lab-xxe-trigger-error-message-by-repurposing-local-dtd",
          "title": "Exploiting XXE to retrieve data by repurposing a local DTD",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/xxe/blind/lab-xxe-trigger-error-message-by-repurposing-local-dtd"
        }
      ]
    },
    {
      "id": "server-side-request-forgery-ssrf",
      "slug": "ssrf",
      "title": "Server-Side Request Forgery (SSRF)",
      "phase": "Server-side",
      "blurb": "Make the server issue the request: loopback, internal networks, cloud metadata, and allow-list bypasses.",
      "labs": [
        {
          "id": "ssrf-lab-basic-ssrf-against-localhost",
          "title": "Basic SSRF against the local server",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/ssrf/lab-basic-ssrf-against-localhost"
        },
        {
          "id": "ssrf-lab-basic-ssrf-against-backend-system",
          "title": "Basic SSRF against another back-end system",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/ssrf/lab-basic-ssrf-against-backend-system"
        },
        {
          "id": "ssrf-lab-out-of-band-detection",
          "title": "Blind SSRF with out-of-band detection",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/ssrf/blind/lab-out-of-band-detection"
        },
        {
          "id": "ssrf-lab-ssrf-with-blacklist-filter",
          "title": "SSRF with blacklist-based input filter",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/ssrf/lab-ssrf-with-blacklist-filter"
        },
        {
          "id": "ssrf-lab-ssrf-filter-bypass-via-open-redirection",
          "title": "SSRF with filter bypass via open redirection vulnerability",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/ssrf/lab-ssrf-filter-bypass-via-open-redirection"
        },
        {
          "id": "ssrf-lab-shellshock-exploitation",
          "title": "Blind SSRF with Shellshock exploitation",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/ssrf/blind/lab-shellshock-exploitation"
        },
        {
          "id": "ssrf-lab-ssrf-with-whitelist-filter",
          "title": "SSRF with whitelist-based input filter",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/ssrf/lab-ssrf-with-whitelist-filter"
        }
      ]
    },
    {
      "id": "http-request-smuggling",
      "slug": "request-smuggling",
      "title": "HTTP Request Smuggling",
      "phase": "Advanced",
      "blurb": "CL.TE, TE.CL, TE.TE, and HTTP/2 downgrade desync: two parsers disagreeing about where a request ends.",
      "labs": [
        {
          "id": "request-smuggling-lab-confirming-cl-te-via-differential-responses",
          "title": "HTTP request smuggling, confirming a CL.TE vulnerability via differential responses",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/request-smuggling/finding/lab-confirming-cl-te-via-differential-responses"
        },
        {
          "id": "request-smuggling-lab-confirming-te-cl-via-differential-responses",
          "title": "HTTP request smuggling, confirming a TE.CL vulnerability via differential responses",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/request-smuggling/finding/lab-confirming-te-cl-via-differential-responses"
        },
        {
          "id": "request-smuggling-lab-bypass-front-end-controls-cl-te",
          "title": "Exploiting HTTP request smuggling to bypass front-end security controls, CL.TE vulnerability",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/request-smuggling/exploiting/lab-bypass-front-end-controls-cl-te"
        },
        {
          "id": "request-smuggling-lab-bypass-front-end-controls-te-cl",
          "title": "Exploiting HTTP request smuggling to bypass front-end security controls, TE.CL vulnerability",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/request-smuggling/exploiting/lab-bypass-front-end-controls-te-cl"
        },
        {
          "id": "request-smuggling-lab-reveal-front-end-request-rewriting",
          "title": "Exploiting HTTP request smuggling to reveal front-end request rewriting",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/request-smuggling/exploiting/lab-reveal-front-end-request-rewriting"
        },
        {
          "id": "request-smuggling-lab-capture-other-users-requests",
          "title": "Exploiting HTTP request smuggling to capture other users' requests",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/request-smuggling/exploiting/lab-capture-other-users-requests"
        },
        {
          "id": "request-smuggling-lab-deliver-reflected-xss",
          "title": "Exploiting HTTP request smuggling to deliver reflected XSS",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/request-smuggling/exploiting/lab-deliver-reflected-xss"
        },
        {
          "id": "request-smuggling-lab-request-smuggling-h2-response-queue-poisoning-via-te-request-smuggling",
          "title": "Response queue poisoning via H2.TE request smuggling",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/request-smuggling/advanced/response-queue-poisoning/lab-request-smuggling-h2-response-queue-poisoning-via-te-request-smuggling"
        },
        {
          "id": "request-smuggling-lab-request-smuggling-h2-cl-request-smuggling",
          "title": "H2.CL request smuggling",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/request-smuggling/advanced/lab-request-smuggling-h2-cl-request-smuggling"
        },
        {
          "id": "request-smuggling-lab-request-smuggling-h2-request-smuggling-via-crlf-injection",
          "title": "HTTP/2 request smuggling via CRLF injection",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/request-smuggling/advanced/lab-request-smuggling-h2-request-smuggling-via-crlf-injection"
        },
        {
          "id": "request-smuggling-lab-request-smuggling-h2-request-splitting-via-crlf-injection",
          "title": "HTTP/2 request splitting via CRLF injection",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/request-smuggling/advanced/lab-request-smuggling-h2-request-splitting-via-crlf-injection"
        },
        {
          "id": "request-smuggling-lab-request-smuggling-0cl-request-smuggling",
          "title": "0.CL request smuggling",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/request-smuggling/advanced/lab-request-smuggling-0cl-request-smuggling"
        },
        {
          "id": "request-smuggling-lab-cl-0-request-smuggling",
          "title": "CL.0 request smuggling",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/request-smuggling/browser/cl-0/lab-cl-0-request-smuggling"
        },
        {
          "id": "request-smuggling-lab-basic-cl-te",
          "title": "HTTP request smuggling, basic CL.TE vulnerability",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/request-smuggling/lab-basic-cl-te"
        },
        {
          "id": "request-smuggling-lab-basic-te-cl",
          "title": "HTTP request smuggling, basic TE.CL vulnerability",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/request-smuggling/lab-basic-te-cl"
        },
        {
          "id": "request-smuggling-lab-obfuscating-te-header",
          "title": "HTTP request smuggling, obfuscating the TE header",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/request-smuggling/lab-obfuscating-te-header"
        },
        {
          "id": "request-smuggling-lab-perform-web-cache-poisoning",
          "title": "Exploiting HTTP request smuggling to perform web cache poisoning",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/request-smuggling/exploiting/lab-perform-web-cache-poisoning"
        },
        {
          "id": "request-smuggling-lab-perform-web-cache-deception",
          "title": "Exploiting HTTP request smuggling to perform web cache deception",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/request-smuggling/exploiting/lab-perform-web-cache-deception"
        },
        {
          "id": "request-smuggling-lab-request-smuggling-h2-bypass-access-controls-via-request-tunnelling",
          "title": "Bypassing access controls via HTTP/2 request tunnelling",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/request-smuggling/advanced/request-tunnelling/lab-request-smuggling-h2-bypass-access-controls-via-request-tunnelling"
        },
        {
          "id": "request-smuggling-lab-request-smuggling-h2-web-cache-poisoning-via-request-tunnelling",
          "title": "Web cache poisoning via HTTP/2 request tunnelling",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/request-smuggling/advanced/request-tunnelling/lab-request-smuggling-h2-web-cache-poisoning-via-request-tunnelling"
        },
        {
          "id": "request-smuggling-lab-client-side-desync",
          "title": "Client-side desync",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/request-smuggling/browser/client-side-desync/lab-client-side-desync"
        },
        {
          "id": "request-smuggling-lab-server-side-pause-based-request-smuggling",
          "title": "Server-side pause-based request smuggling",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/request-smuggling/browser/pause-based-desync/lab-server-side-pause-based-request-smuggling"
        }
      ]
    },
    {
      "id": "os-command-injection",
      "slug": "command-injection",
      "title": "OS Command Injection",
      "phase": "Server-side",
      "blurb": "Shell metacharacters, argument boundaries, and blind command execution through timing and output channels.",
      "labs": [
        {
          "id": "command-injection-lab-simple",
          "title": "OS command injection, simple case",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/os-command-injection/lab-simple"
        },
        {
          "id": "command-injection-lab-blind-time-delays",
          "title": "Blind OS command injection with time delays",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/os-command-injection/lab-blind-time-delays"
        },
        {
          "id": "command-injection-lab-blind-output-redirection",
          "title": "Blind OS command injection with output redirection",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/os-command-injection/lab-blind-output-redirection"
        },
        {
          "id": "command-injection-lab-blind-out-of-band",
          "title": "Blind OS command injection with out-of-band interaction",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/os-command-injection/lab-blind-out-of-band"
        },
        {
          "id": "command-injection-lab-blind-out-of-band-data-exfiltration",
          "title": "Blind OS command injection with out-of-band data exfiltration",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/os-command-injection/lab-blind-out-of-band-data-exfiltration"
        }
      ]
    },
    {
      "id": "server-side-template-injection",
      "slug": "ssti",
      "title": "Server-Side Template Injection",
      "phase": "Advanced",
      "blurb": "Template expression evaluation, engine fingerprinting, and the path from arithmetic to remote code execution.",
      "labs": [
        {
          "id": "ssti-lab-server-side-template-injection-basic",
          "title": "Basic server-side template injection",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/server-side-template-injection/exploiting/lab-server-side-template-injection-basic"
        },
        {
          "id": "ssti-lab-server-side-template-injection-basic-code-context",
          "title": "Basic server-side template injection (code context)",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/server-side-template-injection/exploiting/lab-server-side-template-injection-basic-code-context"
        },
        {
          "id": "ssti-lab-server-side-template-injection-using-documentation",
          "title": "Server-side template injection using documentation",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/server-side-template-injection/exploiting/lab-server-side-template-injection-using-documentation"
        },
        {
          "id": "ssti-lab-server-side-template-injection-in-an-unknown-language-with-a-documented-exploit",
          "title": "Server-side template injection in an unknown language with a documented exploit",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/server-side-template-injection/exploiting/lab-server-side-template-injection-in-an-unknown-language-with-a-documented-exploit"
        },
        {
          "id": "ssti-lab-server-side-template-injection-with-information-disclosure-via-user-supplied-objects",
          "title": "Server-side template injection with information disclosure via user-supplied objects",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/server-side-template-injection/exploiting/lab-server-side-template-injection-with-information-disclosure-via-user-supplied-objects"
        },
        {
          "id": "ssti-lab-server-side-template-injection-in-a-sandboxed-environment",
          "title": "Server-side template injection in a sandboxed environment",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/server-side-template-injection/exploiting/lab-server-side-template-injection-in-a-sandboxed-environment"
        },
        {
          "id": "ssti-lab-server-side-template-injection-with-a-custom-exploit",
          "title": "Server-side template injection with a custom exploit",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/server-side-template-injection/exploiting/lab-server-side-template-injection-with-a-custom-exploit"
        }
      ]
    },
    {
      "id": "path-traversal",
      "slug": "path-traversal",
      "title": "Path Traversal",
      "phase": "Server-side",
      "blurb": "Canonicalisation order, encoding layers, and how a filename escapes the directory the developer intended.",
      "labs": [
        {
          "id": "path-traversal-lab-simple",
          "title": "File path traversal, simple case",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/file-path-traversal/lab-simple"
        },
        {
          "id": "path-traversal-lab-absolute-path-bypass",
          "title": "File path traversal, traversal sequences blocked with absolute path bypass",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/file-path-traversal/lab-absolute-path-bypass"
        },
        {
          "id": "path-traversal-lab-sequences-stripped-non-recursively",
          "title": "File path traversal, traversal sequences stripped non-recursively",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/file-path-traversal/lab-sequences-stripped-non-recursively"
        },
        {
          "id": "path-traversal-lab-superfluous-url-decode",
          "title": "File path traversal, traversal sequences stripped with superfluous URL-decode",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/file-path-traversal/lab-superfluous-url-decode"
        },
        {
          "id": "path-traversal-lab-validate-start-of-path",
          "title": "File path traversal, validation of start of path",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/file-path-traversal/lab-validate-start-of-path"
        },
        {
          "id": "path-traversal-lab-validate-file-extension-null-byte-bypass",
          "title": "File path traversal, validation of file extension with null byte bypass",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/file-path-traversal/lab-validate-file-extension-null-byte-bypass"
        }
      ]
    },
    {
      "id": "access-control-vulnerabilities",
      "slug": "access-control",
      "title": "Access Control",
      "phase": "Server-side",
      "blurb": "Vertical and horizontal privilege boundaries, IDOR, and the difference between authentication and authorisation.",
      "labs": [
        {
          "id": "access-control-lab-unprotected-admin-functionality",
          "title": "Unprotected admin functionality",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/access-control/lab-unprotected-admin-functionality"
        },
        {
          "id": "access-control-lab-unprotected-admin-functionality-with-unpredictable-url",
          "title": "Unprotected admin functionality with unpredictable URL",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/access-control/lab-unprotected-admin-functionality-with-unpredictable-url"
        },
        {
          "id": "access-control-lab-user-role-controlled-by-request-parameter",
          "title": "User role controlled by request parameter",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/access-control/lab-user-role-controlled-by-request-parameter"
        },
        {
          "id": "access-control-lab-user-role-can-be-modified-in-user-profile",
          "title": "User role can be modified in user profile",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/access-control/lab-user-role-can-be-modified-in-user-profile"
        },
        {
          "id": "access-control-lab-user-id-controlled-by-request-parameter",
          "title": "User ID controlled by request parameter",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/access-control/lab-user-id-controlled-by-request-parameter"
        },
        {
          "id": "access-control-lab-user-id-controlled-by-request-parameter-with-unpredictable-user-ids",
          "title": "User ID controlled by request parameter, with unpredictable user IDs",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/access-control/lab-user-id-controlled-by-request-parameter-with-unpredictable-user-ids"
        },
        {
          "id": "access-control-lab-user-id-controlled-by-request-parameter-with-data-leakage-in-redirect",
          "title": "User ID controlled by request parameter with data leakage in redirect",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/access-control/lab-user-id-controlled-by-request-parameter-with-data-leakage-in-redirect"
        },
        {
          "id": "access-control-lab-user-id-controlled-by-request-parameter-with-password-disclosure",
          "title": "User ID controlled by request parameter with password disclosure",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/access-control/lab-user-id-controlled-by-request-parameter-with-password-disclosure"
        },
        {
          "id": "access-control-lab-insecure-direct-object-references",
          "title": "Insecure direct object references",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/access-control/lab-insecure-direct-object-references"
        },
        {
          "id": "access-control-lab-url-based-access-control-can-be-circumvented",
          "title": "URL-based access control can be circumvented",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/access-control/lab-url-based-access-control-can-be-circumvented"
        },
        {
          "id": "access-control-lab-method-based-access-control-can-be-circumvented",
          "title": "Method-based access control can be circumvented",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/access-control/lab-method-based-access-control-can-be-circumvented"
        },
        {
          "id": "access-control-lab-multi-step-process-with-no-access-control-on-one-step",
          "title": "Multi-step process with no access control on one step",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/access-control/lab-multi-step-process-with-no-access-control-on-one-step"
        },
        {
          "id": "access-control-lab-referer-based-access-control",
          "title": "Referer-based access control",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/access-control/lab-referer-based-access-control"
        }
      ]
    },
    {
      "id": "authentication",
      "slug": "authentication",
      "title": "Authentication",
      "phase": "Server-side",
      "blurb": "Credential enumeration, brute-force logic, MFA gaps, and the token flows that authenticate the wrong person.",
      "labs": [
        {
          "id": "authentication-lab-username-enumeration-via-different-responses",
          "title": "Username enumeration via different responses",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/authentication/password-based/lab-username-enumeration-via-different-responses"
        },
        {
          "id": "authentication-lab-2fa-simple-bypass",
          "title": "2FA simple bypass",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/authentication/multi-factor/lab-2fa-simple-bypass"
        },
        {
          "id": "authentication-lab-password-reset-broken-logic",
          "title": "Password reset broken logic",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/authentication/other-mechanisms/lab-password-reset-broken-logic"
        },
        {
          "id": "authentication-lab-username-enumeration-via-subtly-different-responses",
          "title": "Username enumeration via subtly different responses",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/authentication/password-based/lab-username-enumeration-via-subtly-different-responses"
        },
        {
          "id": "authentication-lab-username-enumeration-via-response-timing",
          "title": "Username enumeration via response timing",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/authentication/password-based/lab-username-enumeration-via-response-timing"
        },
        {
          "id": "authentication-lab-broken-bruteforce-protection-ip-block",
          "title": "Broken brute-force protection, IP block",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/authentication/password-based/lab-broken-bruteforce-protection-ip-block"
        },
        {
          "id": "authentication-lab-username-enumeration-via-account-lock",
          "title": "Username enumeration via account lock",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/authentication/password-based/lab-username-enumeration-via-account-lock"
        },
        {
          "id": "authentication-lab-2fa-broken-logic",
          "title": "2FA broken logic",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/authentication/multi-factor/lab-2fa-broken-logic"
        },
        {
          "id": "authentication-lab-brute-forcing-a-stay-logged-in-cookie",
          "title": "Brute-forcing a stay-logged-in cookie",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/authentication/other-mechanisms/lab-brute-forcing-a-stay-logged-in-cookie"
        },
        {
          "id": "authentication-lab-offline-password-cracking",
          "title": "Offline password cracking",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/authentication/other-mechanisms/lab-offline-password-cracking"
        },
        {
          "id": "authentication-lab-password-reset-poisoning-via-middleware",
          "title": "Password reset poisoning via middleware",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/authentication/other-mechanisms/lab-password-reset-poisoning-via-middleware"
        },
        {
          "id": "authentication-lab-password-brute-force-via-password-change",
          "title": "Password brute-force via password change",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/authentication/other-mechanisms/lab-password-brute-force-via-password-change"
        },
        {
          "id": "authentication-lab-broken-brute-force-protection-multiple-credentials-per-request",
          "title": "Broken brute-force protection, multiple credentials per request",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/authentication/password-based/lab-broken-brute-force-protection-multiple-credentials-per-request"
        },
        {
          "id": "authentication-lab-2fa-bypass-using-a-brute-force-attack",
          "title": "2FA bypass using a brute-force attack",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/authentication/multi-factor/lab-2fa-bypass-using-a-brute-force-attack"
        }
      ]
    },
    {
      "id": "websockets",
      "slug": "websockets",
      "title": "WebSockets",
      "phase": "Client-side",
      "blurb": "The handshake that skips CORS, message-level trust, and cross-site WebSocket hijacking.",
      "labs": [
        {
          "id": "websockets-lab-manipulating-messages-to-exploit-vulnerabilities",
          "title": "Manipulating WebSocket messages to exploit vulnerabilities",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/websockets/lab-manipulating-messages-to-exploit-vulnerabilities"
        },
        {
          "id": "websockets-lab-manipulating-handshake-to-exploit-vulnerabilities",
          "title": "Manipulating the WebSocket handshake to exploit vulnerabilities",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/websockets/lab-manipulating-handshake-to-exploit-vulnerabilities"
        }
      ]
    },
    {
      "id": "web-cache-poisoning",
      "slug": "cache-poisoning",
      "title": "Web Cache Poisoning",
      "phase": "Advanced",
      "blurb": "Unkeyed inputs, cache-key confusion, response splitting, and poisoning the shared copy other users receive.",
      "labs": [
        {
          "id": "cache-poisoning-lab-web-cache-poisoning-with-an-unkeyed-header",
          "title": "Web cache poisoning with an unkeyed header",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/web-cache-poisoning/exploiting-design-flaws/lab-web-cache-poisoning-with-an-unkeyed-header"
        },
        {
          "id": "cache-poisoning-lab-web-cache-poisoning-with-an-unkeyed-cookie",
          "title": "Web cache poisoning with an unkeyed cookie",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/web-cache-poisoning/exploiting-design-flaws/lab-web-cache-poisoning-with-an-unkeyed-cookie"
        },
        {
          "id": "cache-poisoning-lab-web-cache-poisoning-with-multiple-headers",
          "title": "Web cache poisoning with multiple headers",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/web-cache-poisoning/exploiting-design-flaws/lab-web-cache-poisoning-with-multiple-headers"
        },
        {
          "id": "cache-poisoning-lab-web-cache-poisoning-targeted-using-an-unknown-header",
          "title": "Targeted web cache poisoning using an unknown header",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/web-cache-poisoning/exploiting-design-flaws/lab-web-cache-poisoning-targeted-using-an-unknown-header"
        },
        {
          "id": "cache-poisoning-lab-web-cache-poisoning-unkeyed-query",
          "title": "Web cache poisoning via an unkeyed query string",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/web-cache-poisoning/exploiting-implementation-flaws/lab-web-cache-poisoning-unkeyed-query"
        },
        {
          "id": "cache-poisoning-lab-web-cache-poisoning-unkeyed-param",
          "title": "Web cache poisoning via an unkeyed query parameter",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/web-cache-poisoning/exploiting-implementation-flaws/lab-web-cache-poisoning-unkeyed-param"
        },
        {
          "id": "cache-poisoning-lab-web-cache-poisoning-param-cloaking",
          "title": "Parameter cloaking",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/web-cache-poisoning/exploiting-implementation-flaws/lab-web-cache-poisoning-param-cloaking"
        },
        {
          "id": "cache-poisoning-lab-web-cache-poisoning-fat-get",
          "title": "Web cache poisoning via a fat GET request",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/web-cache-poisoning/exploiting-implementation-flaws/lab-web-cache-poisoning-fat-get"
        },
        {
          "id": "cache-poisoning-lab-web-cache-poisoning-normalization",
          "title": "URL normalization",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/web-cache-poisoning/exploiting-implementation-flaws/lab-web-cache-poisoning-normalization"
        },
        {
          "id": "cache-poisoning-lab-web-cache-poisoning-to-exploit-a-dom-vulnerability-via-a-cache-with-strict-cacheability-criteria",
          "title": "Web cache poisoning to exploit a DOM vulnerability via a cache with strict cacheability criteria",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/web-cache-poisoning/exploiting-design-flaws/lab-web-cache-poisoning-to-exploit-a-dom-vulnerability-via-a-cache-with-strict-cacheability-criteria"
        },
        {
          "id": "cache-poisoning-lab-web-cache-poisoning-combining-vulnerabilities",
          "title": "Combining web cache poisoning vulnerabilities",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/web-cache-poisoning/exploiting-design-flaws/lab-web-cache-poisoning-combining-vulnerabilities"
        },
        {
          "id": "cache-poisoning-lab-web-cache-poisoning-cache-key-injection",
          "title": "Cache key injection",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/web-cache-poisoning/exploiting-implementation-flaws/lab-web-cache-poisoning-cache-key-injection"
        },
        {
          "id": "cache-poisoning-lab-web-cache-poisoning-internal",
          "title": "Internal cache poisoning",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/web-cache-poisoning/exploiting-implementation-flaws/lab-web-cache-poisoning-internal"
        }
      ]
    },
    {
      "id": "insecure-deserialization",
      "slug": "deserialization",
      "title": "Insecure Deserialization",
      "phase": "Advanced",
      "blurb": "Object graphs as input: magic methods, gadget chains, and PHP serialization format arithmetic.",
      "labs": [
        {
          "id": "deserialization-lab-deserialization-modifying-serialized-objects",
          "title": "Modifying serialized objects",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/deserialization/exploiting/lab-deserialization-modifying-serialized-objects"
        },
        {
          "id": "deserialization-lab-deserialization-modifying-serialized-data-types",
          "title": "Modifying serialized data types",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/deserialization/exploiting/lab-deserialization-modifying-serialized-data-types"
        },
        {
          "id": "deserialization-lab-deserialization-using-application-functionality-to-exploit-insecure-deserialization",
          "title": "Using application functionality to exploit insecure deserialization",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/deserialization/exploiting/lab-deserialization-using-application-functionality-to-exploit-insecure-deserialization"
        },
        {
          "id": "deserialization-lab-deserialization-arbitrary-object-injection-in-php",
          "title": "Arbitrary object injection in PHP",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/deserialization/exploiting/lab-deserialization-arbitrary-object-injection-in-php"
        },
        {
          "id": "deserialization-lab-deserialization-exploiting-java-deserialization-with-apache-commons",
          "title": "Exploiting Java deserialization with Apache Commons",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/deserialization/exploiting/lab-deserialization-exploiting-java-deserialization-with-apache-commons"
        },
        {
          "id": "deserialization-lab-deserialization-exploiting-php-deserialization-with-a-pre-built-gadget-chain",
          "title": "Exploiting PHP deserialization with a pre-built gadget chain",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/deserialization/exploiting/lab-deserialization-exploiting-php-deserialization-with-a-pre-built-gadget-chain"
        },
        {
          "id": "deserialization-lab-deserialization-exploiting-ruby-deserialization-using-a-documented-gadget-chain",
          "title": "Exploiting Ruby deserialization using a documented gadget chain",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/deserialization/exploiting/lab-deserialization-exploiting-ruby-deserialization-using-a-documented-gadget-chain"
        },
        {
          "id": "deserialization-lab-deserialization-developing-a-custom-gadget-chain-for-java-deserialization",
          "title": "Developing a custom gadget chain for Java deserialization",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/deserialization/exploiting/lab-deserialization-developing-a-custom-gadget-chain-for-java-deserialization"
        },
        {
          "id": "deserialization-lab-deserialization-developing-a-custom-gadget-chain-for-php-deserialization",
          "title": "Developing a custom gadget chain for PHP deserialization",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/deserialization/exploiting/lab-deserialization-developing-a-custom-gadget-chain-for-php-deserialization"
        },
        {
          "id": "deserialization-lab-deserialization-using-phar-deserialization-to-deploy-a-custom-gadget-chain",
          "title": "Using PHAR deserialization to deploy a custom gadget chain",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/deserialization/exploiting/lab-deserialization-using-phar-deserialization-to-deploy-a-custom-gadget-chain"
        }
      ]
    },
    {
      "id": "information-disclosure",
      "slug": "information-disclosure",
      "title": "Information Disclosure",
      "phase": "Server-side",
      "blurb": "Error surfaces, debug endpoints, and metadata that reveals the shape of the system before exploitation starts.",
      "labs": [
        {
          "id": "information-disclosure-lab-infoleak-in-error-messages",
          "title": "Information disclosure in error messages",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/information-disclosure/exploiting/lab-infoleak-in-error-messages"
        },
        {
          "id": "information-disclosure-lab-infoleak-on-debug-page",
          "title": "Information disclosure on debug page",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/information-disclosure/exploiting/lab-infoleak-on-debug-page"
        },
        {
          "id": "information-disclosure-lab-infoleak-via-backup-files",
          "title": "Source code disclosure via backup files",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/information-disclosure/exploiting/lab-infoleak-via-backup-files"
        },
        {
          "id": "information-disclosure-lab-infoleak-authentication-bypass",
          "title": "Authentication bypass via information disclosure",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/information-disclosure/exploiting/lab-infoleak-authentication-bypass"
        },
        {
          "id": "information-disclosure-lab-infoleak-in-version-control-history",
          "title": "Information disclosure in version control history",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/information-disclosure/exploiting/lab-infoleak-in-version-control-history"
        }
      ]
    },
    {
      "id": "business-logic-vulnerabilities",
      "slug": "business-logic",
      "title": "Business Logic",
      "phase": "Server-side",
      "blurb": "When every component works as coded and the workflow is still wrong: trust boundaries in state, price, and identity.",
      "labs": [
        {
          "id": "business-logic-lab-logic-flaws-excessive-trust-in-client-side-controls",
          "title": "Excessive trust in client-side controls",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-excessive-trust-in-client-side-controls"
        },
        {
          "id": "business-logic-lab-logic-flaws-high-level",
          "title": "High-level logic vulnerability",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-high-level"
        },
        {
          "id": "business-logic-lab-logic-flaws-inconsistent-security-controls",
          "title": "Inconsistent security controls",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-inconsistent-security-controls"
        },
        {
          "id": "business-logic-lab-logic-flaws-flawed-enforcement-of-business-rules",
          "title": "Flawed enforcement of business rules",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-flawed-enforcement-of-business-rules"
        },
        {
          "id": "business-logic-lab-logic-flaws-low-level",
          "title": "Low-level logic flaw",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-low-level"
        },
        {
          "id": "business-logic-lab-logic-flaws-inconsistent-handling-of-exceptional-input",
          "title": "Inconsistent handling of exceptional input",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-inconsistent-handling-of-exceptional-input"
        },
        {
          "id": "business-logic-lab-logic-flaws-weak-isolation-on-dual-use-endpoint",
          "title": "Weak isolation on dual-use endpoint",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-weak-isolation-on-dual-use-endpoint"
        },
        {
          "id": "business-logic-lab-logic-flaws-insufficient-workflow-validation",
          "title": "Insufficient workflow validation",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-insufficient-workflow-validation"
        },
        {
          "id": "business-logic-lab-logic-flaws-authentication-bypass-via-flawed-state-machine",
          "title": "Authentication bypass via flawed state machine",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-authentication-bypass-via-flawed-state-machine"
        },
        {
          "id": "business-logic-lab-logic-flaws-infinite-money",
          "title": "Infinite money logic flaw",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-infinite-money"
        },
        {
          "id": "business-logic-lab-logic-flaws-authentication-bypass-via-encryption-oracle",
          "title": "Authentication bypass via encryption oracle",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-authentication-bypass-via-encryption-oracle"
        },
        {
          "id": "business-logic-lab-logic-flaws-bypassing-access-controls-using-email-address-parsing-discrepancies",
          "title": "Bypassing access controls using email address parsing discrepancies",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-bypassing-access-controls-using-email-address-parsing-discrepancies"
        }
      ]
    },
    {
      "id": "http-host-header-attacks",
      "slug": "host-header",
      "title": "HTTP Host Header Attacks",
      "phase": "Advanced",
      "blurb": "Host routing, absolute-URI parsing, password-reset poisoning, and the headers intermediaries trust.",
      "labs": [
        {
          "id": "host-header-lab-host-header-basic-password-reset-poisoning",
          "title": "Basic password reset poisoning",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/host-header/exploiting/password-reset-poisoning/lab-host-header-basic-password-reset-poisoning"
        },
        {
          "id": "host-header-lab-host-header-authentication-bypass",
          "title": "Host header authentication bypass",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/host-header/exploiting/lab-host-header-authentication-bypass"
        },
        {
          "id": "host-header-lab-host-header-web-cache-poisoning-via-ambiguous-requests",
          "title": "Web cache poisoning via ambiguous requests",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/host-header/exploiting/lab-host-header-web-cache-poisoning-via-ambiguous-requests"
        },
        {
          "id": "host-header-lab-host-header-routing-based-ssrf",
          "title": "Routing-based SSRF",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/host-header/exploiting/lab-host-header-routing-based-ssrf"
        },
        {
          "id": "host-header-lab-host-header-ssrf-via-flawed-request-parsing",
          "title": "SSRF via flawed request parsing",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/host-header/exploiting/lab-host-header-ssrf-via-flawed-request-parsing"
        },
        {
          "id": "host-header-lab-host-header-host-validation-bypass-via-connection-state-attack",
          "title": "Host validation bypass via connection state attack",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/host-header/exploiting/lab-host-header-host-validation-bypass-via-connection-state-attack"
        },
        {
          "id": "host-header-lab-host-header-password-reset-poisoning-via-dangling-markup",
          "title": "Password reset poisoning via dangling markup",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/host-header/exploiting/password-reset-poisoning/lab-host-header-password-reset-poisoning-via-dangling-markup"
        }
      ]
    },
    {
      "id": "oauth-authentication",
      "slug": "oauth",
      "title": "OAuth Authentication",
      "phase": "Advanced",
      "blurb": "Redirect URI validation, state and scope, implicit-flow leakage, and account-linking trust mistakes.",
      "labs": [
        {
          "id": "oauth-lab-oauth-authentication-bypass-via-oauth-implicit-flow",
          "title": "Authentication bypass via OAuth implicit flow",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/oauth/lab-oauth-authentication-bypass-via-oauth-implicit-flow"
        },
        {
          "id": "oauth-lab-oauth-ssrf-via-openid-dynamic-client-registration",
          "title": "SSRF via OpenID dynamic client registration",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/oauth/openid/lab-oauth-ssrf-via-openid-dynamic-client-registration"
        },
        {
          "id": "oauth-lab-oauth-forced-oauth-profile-linking",
          "title": "Forced OAuth profile linking",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/oauth/lab-oauth-forced-oauth-profile-linking"
        },
        {
          "id": "oauth-lab-oauth-account-hijacking-via-redirect-uri",
          "title": "OAuth account hijacking via redirect_uri",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/oauth/lab-oauth-account-hijacking-via-redirect-uri"
        },
        {
          "id": "oauth-lab-oauth-stealing-oauth-access-tokens-via-an-open-redirect",
          "title": "Stealing OAuth access tokens via an open redirect",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/oauth/lab-oauth-stealing-oauth-access-tokens-via-an-open-redirect"
        },
        {
          "id": "oauth-lab-oauth-stealing-oauth-access-tokens-via-a-proxy-page",
          "title": "Stealing OAuth access tokens via a proxy page",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/oauth/lab-oauth-stealing-oauth-access-tokens-via-a-proxy-page"
        }
      ]
    },
    {
      "id": "file-upload-vulnerabilities",
      "slug": "file-upload",
      "title": "File Upload",
      "phase": "Server-side",
      "blurb": "Extension parsing, content-type trust, polyglots, and the path from an uploaded byte stream to code execution.",
      "labs": [
        {
          "id": "file-upload-lab-file-upload-remote-code-execution-via-web-shell-upload",
          "title": "Remote code execution via web shell upload",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/file-upload/lab-file-upload-remote-code-execution-via-web-shell-upload"
        },
        {
          "id": "file-upload-lab-file-upload-web-shell-upload-via-content-type-restriction-bypass",
          "title": "Web shell upload via Content-Type restriction bypass",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/file-upload/lab-file-upload-web-shell-upload-via-content-type-restriction-bypass"
        },
        {
          "id": "file-upload-lab-file-upload-web-shell-upload-via-path-traversal",
          "title": "Web shell upload via path traversal",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/file-upload/lab-file-upload-web-shell-upload-via-path-traversal"
        },
        {
          "id": "file-upload-lab-file-upload-web-shell-upload-via-extension-blacklist-bypass",
          "title": "Web shell upload via extension blacklist bypass",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/file-upload/lab-file-upload-web-shell-upload-via-extension-blacklist-bypass"
        },
        {
          "id": "file-upload-lab-file-upload-web-shell-upload-via-obfuscated-file-extension",
          "title": "Web shell upload via obfuscated file extension",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/file-upload/lab-file-upload-web-shell-upload-via-obfuscated-file-extension"
        },
        {
          "id": "file-upload-lab-file-upload-remote-code-execution-via-polyglot-web-shell-upload",
          "title": "Remote code execution via polyglot web shell upload",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/file-upload/lab-file-upload-remote-code-execution-via-polyglot-web-shell-upload"
        },
        {
          "id": "file-upload-lab-file-upload-web-shell-upload-via-race-condition",
          "title": "Web shell upload via race condition",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/file-upload/lab-file-upload-web-shell-upload-via-race-condition"
        }
      ]
    },
    {
      "id": "jwt",
      "slug": "jwt",
      "title": "JWT Attacks",
      "phase": "Advanced",
      "blurb": "Base64url segments, signature verification failures, algorithm confusion, and key-injection tricks.",
      "labs": [
        {
          "id": "jwt-lab-jwt-authentication-bypass-via-unverified-signature",
          "title": "JWT authentication bypass via unverified signature",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/jwt/lab-jwt-authentication-bypass-via-unverified-signature"
        },
        {
          "id": "jwt-lab-jwt-authentication-bypass-via-flawed-signature-verification",
          "title": "JWT authentication bypass via flawed signature verification",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/jwt/lab-jwt-authentication-bypass-via-flawed-signature-verification"
        },
        {
          "id": "jwt-lab-jwt-authentication-bypass-via-weak-signing-key",
          "title": "JWT authentication bypass via weak signing key",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/jwt/lab-jwt-authentication-bypass-via-weak-signing-key"
        },
        {
          "id": "jwt-lab-jwt-authentication-bypass-via-jwk-header-injection",
          "title": "JWT authentication bypass via jwk header injection",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/jwt/lab-jwt-authentication-bypass-via-jwk-header-injection"
        },
        {
          "id": "jwt-lab-jwt-authentication-bypass-via-jku-header-injection",
          "title": "JWT authentication bypass via jku header injection",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/jwt/lab-jwt-authentication-bypass-via-jku-header-injection"
        },
        {
          "id": "jwt-lab-jwt-authentication-bypass-via-kid-header-path-traversal",
          "title": "JWT authentication bypass via kid header path traversal",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/jwt/lab-jwt-authentication-bypass-via-kid-header-path-traversal"
        },
        {
          "id": "jwt-lab-jwt-authentication-bypass-via-algorithm-confusion",
          "title": "JWT authentication bypass via algorithm confusion",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/jwt/algorithm-confusion/lab-jwt-authentication-bypass-via-algorithm-confusion"
        },
        {
          "id": "jwt-lab-jwt-authentication-bypass-via-algorithm-confusion-with-no-exposed-key",
          "title": "JWT authentication bypass via algorithm confusion with no exposed key",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/jwt/algorithm-confusion/lab-jwt-authentication-bypass-via-algorithm-confusion-with-no-exposed-key"
        }
      ]
    },
    {
      "id": "essential-skills",
      "slug": "essential-skills",
      "title": "Essential Skills",
      "phase": "Advanced",
      "blurb": "The exam-style habits: methodical recon, request replay, and turning an observation into an exploit.",
      "labs": [
        {
          "id": "essential-skills-lab-discovering-vulnerabilities-quickly-with-targeted-scanning",
          "title": "Discovering vulnerabilities quickly with targeted scanning",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/essential-skills/using-burp-scanner-during-manual-testing/lab-discovering-vulnerabilities-quickly-with-targeted-scanning"
        },
        {
          "id": "essential-skills-lab-scanning-non-standard-data-structures",
          "title": "Scanning non-standard data structures",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/essential-skills/using-burp-scanner-during-manual-testing/lab-scanning-non-standard-data-structures"
        }
      ]
    },
    {
      "id": "prototype-pollution",
      "slug": "prototype-pollution",
      "title": "Prototype Pollution",
      "phase": "Advanced",
      "blurb": "JavaScript object graphs: __proto__, merge recursion, client-side gadgets, and server-side pollution.",
      "labs": [
        {
          "id": "prototype-pollution-lab-prototype-pollution-client-side-prototype-pollution-via-browser-apis",
          "title": "Client-side prototype pollution via browser APIs",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/prototype-pollution/client-side/browser-apis/lab-prototype-pollution-client-side-prototype-pollution-via-browser-apis"
        },
        {
          "id": "prototype-pollution-lab-prototype-pollution-dom-xss-via-client-side-prototype-pollution",
          "title": "DOM XSS via client-side prototype pollution",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/prototype-pollution/client-side/lab-prototype-pollution-dom-xss-via-client-side-prototype-pollution"
        },
        {
          "id": "prototype-pollution-lab-prototype-pollution-dom-xss-via-an-alternative-prototype-pollution-vector",
          "title": "DOM XSS via an alternative prototype pollution vector",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/prototype-pollution/client-side/lab-prototype-pollution-dom-xss-via-an-alternative-prototype-pollution-vector"
        },
        {
          "id": "prototype-pollution-lab-prototype-pollution-client-side-prototype-pollution-via-flawed-sanitization",
          "title": "Client-side prototype pollution via flawed sanitization",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/prototype-pollution/client-side/lab-prototype-pollution-client-side-prototype-pollution-via-flawed-sanitization"
        },
        {
          "id": "prototype-pollution-lab-prototype-pollution-client-side-prototype-pollution-in-third-party-libraries",
          "title": "Client-side prototype pollution in third-party libraries",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/prototype-pollution/client-side/lab-prototype-pollution-client-side-prototype-pollution-in-third-party-libraries"
        },
        {
          "id": "prototype-pollution-lab-privilege-escalation-via-server-side-prototype-pollution",
          "title": "Privilege escalation via server-side prototype pollution",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/prototype-pollution/server-side/lab-privilege-escalation-via-server-side-prototype-pollution"
        },
        {
          "id": "prototype-pollution-lab-detecting-server-side-prototype-pollution-without-polluted-property-reflection",
          "title": "Detecting server-side prototype pollution without polluted property reflection",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/prototype-pollution/server-side/lab-detecting-server-side-prototype-pollution-without-polluted-property-reflection"
        },
        {
          "id": "prototype-pollution-lab-bypassing-flawed-input-filters-for-server-side-prototype-pollution",
          "title": "Bypassing flawed input filters for server-side prototype pollution",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/prototype-pollution/server-side/lab-bypassing-flawed-input-filters-for-server-side-prototype-pollution"
        },
        {
          "id": "prototype-pollution-lab-remote-code-execution-via-server-side-prototype-pollution",
          "title": "Remote code execution via server-side prototype pollution",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/prototype-pollution/server-side/lab-remote-code-execution-via-server-side-prototype-pollution"
        },
        {
          "id": "prototype-pollution-lab-exfiltrating-sensitive-data-via-server-side-prototype-pollution",
          "title": "Exfiltrating sensitive data via server-side prototype pollution",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/prototype-pollution/server-side/lab-exfiltrating-sensitive-data-via-server-side-prototype-pollution"
        }
      ]
    },
    {
      "id": "graphql-api-vulnerabilities",
      "slug": "graphql",
      "title": "GraphQL",
      "phase": "Advanced",
      "blurb": "Introspection, field-level authorisation, alias-based brute force, and injection through query arguments.",
      "labs": [
        {
          "id": "graphql-lab-graphql-reading-private-posts",
          "title": "Accessing private GraphQL posts",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/graphql/lab-graphql-reading-private-posts"
        },
        {
          "id": "graphql-lab-graphql-accidental-field-exposure",
          "title": "Accidental exposure of private GraphQL fields",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/graphql/lab-graphql-accidental-field-exposure"
        },
        {
          "id": "graphql-lab-graphql-find-the-endpoint",
          "title": "Finding a hidden GraphQL endpoint",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/graphql/lab-graphql-find-the-endpoint"
        },
        {
          "id": "graphql-lab-graphql-brute-force-protection-bypass",
          "title": "Bypassing GraphQL brute force protections",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/graphql/lab-graphql-brute-force-protection-bypass"
        },
        {
          "id": "graphql-lab-graphql-csrf-via-graphql-api",
          "title": "Performing CSRF exploits over GraphQL",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/graphql/lab-graphql-csrf-via-graphql-api"
        }
      ]
    },
    {
      "id": "race-conditions",
      "slug": "race-conditions",
      "title": "Race Conditions",
      "phase": "Server-side",
      "blurb": "Time-of-check to time-of-use windows, limit overruns, and single-packet attacks against stateful workflows.",
      "labs": [
        {
          "id": "race-conditions-lab-race-conditions-limit-overrun",
          "title": "Limit overrun race conditions",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/race-conditions/lab-race-conditions-limit-overrun"
        },
        {
          "id": "race-conditions-lab-race-conditions-bypassing-rate-limits",
          "title": "Bypassing rate limits via race conditions",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/race-conditions/lab-race-conditions-bypassing-rate-limits"
        },
        {
          "id": "race-conditions-lab-race-conditions-multi-endpoint",
          "title": "Multi-endpoint race conditions",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/race-conditions/lab-race-conditions-multi-endpoint"
        },
        {
          "id": "race-conditions-lab-race-conditions-single-endpoint",
          "title": "Single-endpoint race conditions",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/race-conditions/lab-race-conditions-single-endpoint"
        },
        {
          "id": "race-conditions-lab-race-conditions-exploiting-time-sensitive-vulnerabilities",
          "title": "Exploiting time-sensitive vulnerabilities",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/race-conditions/lab-race-conditions-exploiting-time-sensitive-vulnerabilities"
        },
        {
          "id": "race-conditions-lab-race-conditions-partial-construction",
          "title": "Partial construction race conditions",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/race-conditions/lab-race-conditions-partial-construction"
        }
      ]
    },
    {
      "id": "nosql-injection",
      "slug": "nosql-injection",
      "title": "NoSQL Injection",
      "phase": "Server-side",
      "blurb": "Object injection into query documents, operator abuse, and injection inside MongoDB aggregation pipelines.",
      "labs": [
        {
          "id": "nosql-injection-lab-nosql-injection-detection",
          "title": "Detecting NoSQL injection",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/nosql-injection/lab-nosql-injection-detection"
        },
        {
          "id": "nosql-injection-lab-nosql-injection-bypass-authentication",
          "title": "Exploiting NoSQL operator injection to bypass authentication",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/nosql-injection/lab-nosql-injection-bypass-authentication"
        },
        {
          "id": "nosql-injection-lab-nosql-injection-extract-data",
          "title": "Exploiting NoSQL injection to extract data",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/nosql-injection/lab-nosql-injection-extract-data"
        },
        {
          "id": "nosql-injection-lab-nosql-injection-extract-unknown-fields",
          "title": "Exploiting NoSQL operator injection to extract unknown fields",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/nosql-injection/lab-nosql-injection-extract-unknown-fields"
        }
      ]
    },
    {
      "id": "api-testing",
      "slug": "api-testing",
      "title": "API Testing",
      "phase": "Server-side",
      "blurb": "Hidden endpoints, mass assignment, and server-side parameter pollution in REST and JSON APIs.",
      "labs": [
        {
          "id": "api-testing-lab-exploiting-api-endpoint-using-documentation",
          "title": "Exploiting an API endpoint using documentation",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/api-testing/lab-exploiting-api-endpoint-using-documentation"
        },
        {
          "id": "api-testing-lab-exploiting-server-side-parameter-pollution-in-query-string",
          "title": "Exploiting server-side parameter pollution in a query string",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/api-testing/server-side-parameter-pollution/lab-exploiting-server-side-parameter-pollution-in-query-string"
        },
        {
          "id": "api-testing-lab-exploiting-unused-api-endpoint",
          "title": "Finding and exploiting an unused API endpoint",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/api-testing/lab-exploiting-unused-api-endpoint"
        },
        {
          "id": "api-testing-lab-exploiting-mass-assignment-vulnerability",
          "title": "Exploiting a mass assignment vulnerability",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/api-testing/lab-exploiting-mass-assignment-vulnerability"
        },
        {
          "id": "api-testing-lab-exploiting-server-side-parameter-pollution-in-rest-url",
          "title": "Exploiting server-side parameter pollution in a REST URL",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/api-testing/server-side-parameter-pollution/lab-exploiting-server-side-parameter-pollution-in-rest-url"
        }
      ]
    },
    {
      "id": "web-llm-attacks",
      "slug": "llm",
      "title": "Web LLM Attacks",
      "phase": "Advanced",
      "blurb": "Prompt injection, indirect instructions in tool output, and the confused-deputy problem behind AI features.",
      "labs": [
        {
          "id": "llm-lab-exploiting-llm-apis-with-excessive-agency",
          "title": "Exploiting LLM APIs with excessive agency",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/llm-attacks/lab-exploiting-llm-apis-with-excessive-agency"
        },
        {
          "id": "llm-lab-exploiting-vulnerabilities-in-llm-apis",
          "title": "Exploiting vulnerabilities in LLM APIs",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/llm-attacks/lab-exploiting-vulnerabilities-in-llm-apis"
        },
        {
          "id": "llm-lab-indirect-prompt-injection",
          "title": "Indirect prompt injection",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/llm-attacks/lab-indirect-prompt-injection"
        },
        {
          "id": "llm-lab-exploiting-insecure-output-handling-in-llms",
          "title": "Exploiting insecure output handling in LLMs",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/llm-attacks/lab-exploiting-insecure-output-handling-in-llms"
        },
        {
          "id": "llm-lab-indirect-prompt-injection-via-ai-powered-scan",
          "title": "Exploiting AI agents to perform destructive actions",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/llm-attacks/ai-powered-scanner-vulnerabilities/lab-indirect-prompt-injection-via-ai-powered-scan"
        },
        {
          "id": "llm-lab-sensitive-information-exfiltration",
          "title": "Exploiting AI agents to exfiltrate sensitive information",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/llm-attacks/ai-powered-scanner-vulnerabilities/lab-sensitive-information-exfiltration"
        },
        {
          "id": "llm-lab-exploiting-target-website-vulnerabilities-to-bypass-restrictions",
          "title": "Exploiting AI agents to trigger secondary vulnerabilities",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/llm-attacks/ai-powered-scanner-vulnerabilities/lab-exploiting-target-website-vulnerabilities-to-bypass-restrictions"
        },
        {
          "id": "llm-lab-bypassing-ai-scanner-defenses-to-exfiltrate-sensitive-information",
          "title": "Bypassing AI scanner defenses to exfiltrate sensitive information",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/llm-attacks/ai-powered-scanner-vulnerabilities/lab-bypassing-ai-scanner-defenses-to-exfiltrate-sensitive-information"
        }
      ]
    },
    {
      "id": "web-cache-deception",
      "slug": "cache-deception",
      "title": "Web Cache Deception",
      "phase": "Server-side",
      "blurb": "Path confusion between the cache and the origin, and how a private response becomes publicly cacheable.",
      "labs": [
        {
          "id": "cache-deception-lab-wcd-exploiting-path-mapping",
          "title": "Exploiting path mapping for web cache deception",
          "difficulty": "Apprentice",
          "url": "https://portswigger.net/web-security/web-cache-deception/lab-wcd-exploiting-path-mapping"
        },
        {
          "id": "cache-deception-lab-wcd-exploiting-path-delimiters",
          "title": "Exploiting path delimiters for web cache deception",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/web-cache-deception/lab-wcd-exploiting-path-delimiters"
        },
        {
          "id": "cache-deception-lab-wcd-exploiting-origin-server-normalization",
          "title": "Exploiting origin server normalization for web cache deception",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/web-cache-deception/lab-wcd-exploiting-origin-server-normalization"
        },
        {
          "id": "cache-deception-lab-wcd-exploiting-cache-server-normalization",
          "title": "Exploiting cache server normalization for web cache deception",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/web-cache-deception/lab-wcd-exploiting-cache-server-normalization"
        },
        {
          "id": "cache-deception-lab-wcd-exploiting-exact-match-cache-rules",
          "title": "Exploiting exact-match cache rules for web cache deception",
          "difficulty": "Practitioner",
          "url": "https://portswigger.net/web-security/web-cache-deception/lab-wcd-exploiting-exact-match-cache-rules"
        }
      ]
    }
  ]
}
