/**
 * Single source of truth for the SQL Injection module.
 * Every lab rendered in Markdown must use one of these ids. `npm run check:labs`
 * cross-checks the Markdown against this manifest so the dashboard can never
 * drift from the content.
 */

export const modules = [
  {
    id: 'sql-injection/fundamentals',
    title: 'Mental Model & First Contact',
    short: 'Mental Model',
    path: '/sql-injection/',
    file: 'sql-injection/index.md',
    blurb:
      'How a string becomes a query, where the parser loses the data/control boundary, and the taxonomy every later module builds on.'
  },
  {
    id: 'sql-injection/union-attacks',
    title: 'UNION Attacks',
    short: 'UNION',
    path: '/sql-injection/01-union-attacks',
    file: 'sql-injection/01-union-attacks.md',
    blurb:
      'Column counting, type probing, cross-table extraction, and collapsing several values into one column.'
  },
  {
    id: 'sql-injection/database-fingerprinting',
    title: 'Database Fingerprinting',
    short: 'Fingerprinting',
    path: '/sql-injection/02-db-fingerprinting',
    file: 'sql-injection/02-db-fingerprinting.md',
    blurb:
      'Version banners, catalog tables, and the dialect differences that decide which payload is even legal.'
  },
  {
    id: 'sql-injection/blind',
    title: 'Blind SQL Injection',
    short: 'Blind',
    path: '/sql-injection/03-blind-sqli',
    file: 'sql-injection/03-blind-sqli.md',
    blurb:
      'Boolean, error, time, and out-of-band inference channels — including the scripts that automate them.'
  },
  {
    id: 'sql-injection/waf-bypass-xml',
    title: 'WAF Bypass & XML Encoding',
    short: 'WAF / XML',
    path: '/sql-injection/04-waf-bypass-xml',
    file: 'sql-injection/04-waf-bypass-xml.md',
    blurb:
      'Decode-order bugs: why a WAF sees entity text while the database sees keywords, plus whitespace and token tricks.'
  }
]

export const labs = [
  {
    id: 'lab-retrieve-hidden-data',
    title: 'Retrieving hidden data with a WHERE clause',
    short: 'Hidden data',
    module: 'sql-injection/fundamentals',
    path: '/sql-injection/',
    difficulty: 'Apprentice',
    url: 'https://portswigger.net/web-security/sql-injection/lab-retrieve-hidden-data'
  },
  {
    id: 'lab-login-bypass',
    title: 'Login bypass by removing the password predicate',
    short: 'Login bypass',
    module: 'sql-injection/fundamentals',
    path: '/sql-injection/',
    difficulty: 'Apprentice',
    url: 'https://portswigger.net/web-security/sql-injection/lab-login-bypass'
  },
  {
    id: 'lab-determine-number-of-columns',
    title: 'Determining the number of columns',
    short: 'Column count',
    module: 'sql-injection/union-attacks',
    path: '/sql-injection/01-union-attacks',
    difficulty: 'Practitioner',
    url: 'https://portswigger.net/web-security/sql-injection/union-attacks/lab-determine-number-of-columns'
  },
  {
    id: 'lab-find-column-containing-text',
    title: 'Finding a column containing text',
    short: 'Text column',
    module: 'sql-injection/union-attacks',
    path: '/sql-injection/01-union-attacks',
    difficulty: 'Practitioner',
    url: 'https://portswigger.net/web-security/sql-injection/union-attacks/lab-find-column-containing-text'
  },
  {
    id: 'lab-retrieve-data-from-other-tables',
    title: 'Retrieving data from other tables',
    short: 'Cross-table data',
    module: 'sql-injection/union-attacks',
    path: '/sql-injection/01-union-attacks',
    difficulty: 'Practitioner',
    url: 'https://portswigger.net/web-security/sql-injection/union-attacks/lab-retrieve-data-from-other-tables'
  },
  {
    id: 'lab-retrieve-multiple-values-in-single-column',
    title: 'Multiple values in a single column',
    short: 'One-column concat',
    module: 'sql-injection/union-attacks',
    path: '/sql-injection/01-union-attacks',
    difficulty: 'Practitioner',
    url: 'https://portswigger.net/web-security/sql-injection/union-attacks/lab-retrieve-multiple-values-in-single-column'
  },
  {
    id: 'lab-querying-database-version-oracle',
    title: 'Querying the database type and version on Oracle',
    short: 'Oracle version',
    module: 'sql-injection/database-fingerprinting',
    path: '/sql-injection/02-db-fingerprinting',
    difficulty: 'Practitioner',
    url: 'https://portswigger.net/web-security/sql-injection/examining-the-database/lab-querying-database-version-oracle'
  },
  {
    id: 'lab-querying-database-version-mysql-microsoft',
    title: 'Querying the database type and version on MySQL / MSSQL',
    short: 'MySQL / MSSQL version',
    module: 'sql-injection/database-fingerprinting',
    path: '/sql-injection/02-db-fingerprinting',
    difficulty: 'Practitioner',
    url: 'https://portswigger.net/web-security/sql-injection/examining-the-database/lab-querying-database-version-mysql-microsoft'
  },
  {
    id: 'lab-listing-database-contents-non-oracle',
    title: 'Listing database contents on non-Oracle databases',
    short: 'Catalog: non-Oracle',
    module: 'sql-injection/database-fingerprinting',
    path: '/sql-injection/02-db-fingerprinting',
    difficulty: 'Practitioner',
    url: 'https://portswigger.net/web-security/sql-injection/examining-the-database/lab-listing-database-contents-non-oracle'
  },
  {
    id: 'lab-listing-database-contents-oracle',
    title: 'Listing database contents on Oracle',
    short: 'Catalog: Oracle',
    module: 'sql-injection/database-fingerprinting',
    path: '/sql-injection/02-db-fingerprinting',
    difficulty: 'Practitioner',
    url: 'https://portswigger.net/web-security/sql-injection/examining-the-database/lab-listing-database-contents-oracle'
  },
  {
    id: 'lab-conditional-responses',
    title: 'Blind SQLi with conditional responses',
    short: 'Boolean oracle',
    module: 'sql-injection/blind',
    path: '/sql-injection/03-blind-sqli',
    difficulty: 'Practitioner',
    url: 'https://portswigger.net/web-security/sql-injection/blind/lab-conditional-responses'
  },
  {
    id: 'lab-conditional-errors',
    title: 'Blind SQLi with conditional errors',
    short: 'Error oracle',
    module: 'sql-injection/blind',
    path: '/sql-injection/03-blind-sqli',
    difficulty: 'Practitioner',
    url: 'https://portswigger.net/web-security/sql-injection/blind/lab-conditional-errors'
  },
  {
    id: 'lab-visible-error-based',
    title: 'Visible error-based SQL injection',
    short: 'Leaky errors',
    module: 'sql-injection/blind',
    path: '/sql-injection/03-blind-sqli',
    difficulty: 'Practitioner',
    url: 'https://portswigger.net/web-security/sql-injection/blind/lab-sql-injection-visible-error-based'
  },
  {
    id: 'lab-time-delays',
    title: 'Blind SQLi with time delays',
    short: 'Time delay',
    module: 'sql-injection/blind',
    path: '/sql-injection/03-blind-sqli',
    difficulty: 'Practitioner',
    url: 'https://portswigger.net/web-security/sql-injection/blind/lab-time-delays'
  },
  {
    id: 'lab-time-delays-info-retrieval',
    title: 'Time delays and information retrieval',
    short: 'Time oracle',
    module: 'sql-injection/blind',
    path: '/sql-injection/03-blind-sqli',
    difficulty: 'Practitioner',
    url: 'https://portswigger.net/web-security/sql-injection/blind/lab-time-delays-info-retrieval'
  },
  {
    id: 'lab-out-of-band',
    title: 'Blind SQLi with out-of-band interaction',
    short: 'OAST interaction',
    module: 'sql-injection/blind',
    path: '/sql-injection/03-blind-sqli',
    difficulty: 'Practitioner',
    url: 'https://portswigger.net/web-security/sql-injection/blind/lab-out-of-band'
  },
  {
    id: 'lab-out-of-band-data-exfiltration',
    title: 'Out-of-band data exfiltration',
    short: 'OAST exfiltration',
    module: 'sql-injection/blind',
    path: '/sql-injection/03-blind-sqli',
    difficulty: 'Practitioner',
    url: 'https://portswigger.net/web-security/sql-injection/blind/lab-out-of-band-data-exfiltration'
  },
  {
    id: 'lab-filter-bypass-xml-encoding',
    title: 'Filter bypass via XML encoding',
    short: 'XML entity bypass',
    module: 'sql-injection/waf-bypass-xml',
    path: '/sql-injection/04-waf-bypass-xml',
    difficulty: 'Practitioner',
    url: 'https://portswigger.net/web-security/sql-injection/lab-sql-injection-with-filter-bypass-via-xml-encoding'
  }
]

export const totalLabs = labs.length

export function labsFor(moduleId) {
  return labs.filter((lab) => lab.module === moduleId)
}
