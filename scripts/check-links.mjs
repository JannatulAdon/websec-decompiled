#!/usr/bin/env node
/**
 * Post-build checker: every internal href in dist/ must resolve to a generated
 * HTML file, and every same-page #anchor must exist in that file.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const dist = resolve(process.cwd(), '.vitepress/dist')
if (!existsSync(dist)) {
  console.error('.vitepress/dist does not exist — run npm run build first.')
  process.exit(1)
}

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (full.endsWith('.html')) out.push(full)
  }
  return out
}

const pages = walk(dist)
const idsByPage = new Map()
for (const page of pages) {
  const html = readFileSync(page, 'utf8')
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))
  idsByPage.set(page, ids)
}

let checked = 0
const errors = []
for (const page of pages) {
  const html = readFileSync(page, 'utf8')
  for (const match of html.matchAll(/\shref="([^"]+)"/g)) {
    const href = match[1]
    if (!href || /^(https?:|mailto:|javascript:|data:)/.test(href)) continue
    if (href.startsWith('#')) {
      const id = decodeURIComponent(href.slice(1))
      if (id && !idsByPage.get(page).has(id)) {
        errors.push(`${relative(dist, page)}: missing anchor ${href}`)
      }
      continue
    }
    const [pathPart, hash = ''] = href.split('#')
    let pathname = pathPart.split('?')[0]
    if (pathname.startsWith('/websec-decompiled/')) {
      pathname = '/' + pathname.slice('/websec-decompiled/'.length)
    } else if (pathname === '/websec-decompiled') {
      pathname = '/'
    }
    // Static assets (CSS, JS, fonts, images) are not pages; skip them.
    if (/\.[a-z0-9]{1,8}$/i.test(pathname) && !pathname.endsWith('.html')) continue
    let target = pathname
    if (target.endsWith('/')) target += 'index.html'
    if (!target.endsWith('.html')) target += '.html'
    const targetFile = resolve(dist, `.${target.startsWith('/') ? target : `/${target}`}`)
    checked++
    if (!existsSync(targetFile)) {
      errors.push(`${relative(dist, page)}: broken link ${href} -> ${relative(dist, targetFile)}`)
      continue
    }
    if (hash) {
      const id = decodeURIComponent(hash)
      if (!idsByPage.get(targetFile)?.has(id)) {
        errors.push(`${relative(dist, page)}: link ${href} points at a missing anchor`)
      }
    }
  }
}

if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`)
  console.error(`\n${errors.length} broken internal reference(s).`)
  process.exit(1)
}
console.log(`✓ ${checked} internal links checked across ${pages.length} pages; all resolve.`)
