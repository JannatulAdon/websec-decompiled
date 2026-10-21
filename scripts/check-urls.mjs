#!/usr/bin/env node
/** Optional live check: every lab URL must return HTTP 200. */
import { labs } from '../.vitepress/theme/labs.js'

const queue = [...labs]
const bad = []
let done = 0

async function worker() {
  while (queue.length) {
    const lab = queue.shift()
    try {
      const res = await fetch(lab.url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(20000) })
      if (res.status !== 200) bad.push(`${res.status} ${lab.url}`)
    } catch (e) {
      bad.push(`ERR ${lab.url} ${e.message}`)
    }
    done++
    if (done % 40 === 0) console.log(done)
  }
}
await Promise.all(Array.from({ length: 8 }, worker))
console.log('checked', labs.length, 'bad', bad.length)
for (const b of bad) console.log(b)
