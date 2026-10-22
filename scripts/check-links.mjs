#!/usr/bin/env node
/**
 * Post-build checker: every internal href in dist/ must resolve to a generated
 * HTML file, and every same-page #anchor must exist in that file.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { modules } from '../.vitepress/theme/rebuilt/curriculum.js'

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
    if (href.startsWith('#/')) {
      const route = href.slice(2).split('/')
      const simple = ['', 'path', 'labs', 'mystery', 'reference', 'progress'].includes(route[0]) && route.length === 1
      const mod = modules.find(m => m.id === route[1])
      const lesson = route[2] === undefined ? 0 : Number(route[2])
      const learn = route[0] === 'learn' && mod && route.length <= 3 && Number.isInteger(lesson) && lesson >= 0 && lesson < mod.lessons.length
      const sample = route[0] === 'sample' && ['encoding', 'ssrf'].includes(route[1]) && route.length === 2
      if (!simple && !learn && !sample) errors.push(`${relative(dist, page)}: unknown application route ${href}`)
      checked++
      continue
    }
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
    if (hash.startsWith('/')) {
      const route=hash.slice(1).split('/')
      const mod=modules.find(m=>m.id===route[1])
      const index=route[2]===undefined?0:Number(route[2])
      const valid=route[0]==='learn'&&mod&&Number.isInteger(index)&&index>=0&&index<mod.lessons.length||['','path','labs','mystery','reference','progress'].includes(route[0])
      if(!valid)errors.push(`${relative(dist,page)}: invalid application route ${href}`)
    }
    if (hash && !hash.startsWith('/')) {
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
