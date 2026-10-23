import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {importImage} from '../.vitepress/theme/rebuilt/ssrf-handler.js'
import {executeImport,directBrowserCheck,browserRequest,PICTURE_URL,PRIVATE_URL,PRIVATE_CODE} from '../.vitepress/theme/rebuilt/ssrf-runtime.js'
const source=await readFile(new URL('../.vitepress/theme/rebuilt/ssrf-handler.js',import.meta.url),'utf8')
assert(source.includes(importImage.toString()),'Displayed source is the executed handler source')
const examples=[[PICTURE_URL,false,200],[PRIVATE_URL,false,200],[PRIVATE_URL,true,403],[PICTURE_URL,true,200],['invalid',false,400],['file:///notes.txt',false,400],['https://unknown.example.test/image',false,404]]
for(const [url,picturesOnly,status]of examples){
 const result=await executeImport({url,picturesOnly})
 assert.equal(result.returned.status,status)
 assert.deepEqual(JSON.parse(result.client.body),{url})
 assert.equal(result.events.filter(e=>e.type==='server-request').length,[200,404].includes(status)?1:0)
 if(status===200){assert.equal(result.events[1].request.method,'GET');assert.equal(result.events[1].request.url,new URL(url).href);assert.deepEqual(result.events.map(e=>e.type),['browser-request','server-request','server-response','browser-response']);assert.deepEqual(result.events[2].response,result.events[3].response)}
 if(url===PRIVATE_URL&&!picturesOnly)assert.equal(result.returned.body,PRIVATE_CODE)
}
const publicRequest=browserRequest(PICTURE_URL),privateRequest=browserRequest(PRIVATE_URL)
assert.equal(publicRequest.method,privateRequest.method);assert.equal(publicRequest.url,privateRequest.url)
assert((await directBrowserCheck(PICTURE_URL)).response.image)
assert.equal((await directBrowserCheck(PRIVATE_URL)).response,null)
assert.equal((await directBrowserCheck('HTTP://STAFF.INTRA.TEST/preview')).response,null)
assert.equal((await directBrowserCheck('http://staff.intra.test/another-path')).response,null)
assert((await directBrowserCheck('HTTPS://PICTURES.EXAMPLE.TEST/sky.png')).response.image)
// Pause the real asynchronous handler, rather than replaying invented execution frames.
let release,waiting;const held=new Promise(resolve=>waiting=resolve),events=[]
const run=executeImport({url:PRIVATE_URL,onEvent:e=>events.push(e.type),checkpoint:async e=>{if(e.type==='server-request'){waiting();await new Promise(resolve=>release=resolve)}}})
await held;assert.deepEqual(events,['browser-request','server-request']);release();assert.equal((await run).returned.body,PRIVATE_CODE)
console.log('✓ Actual handler/source agreement, Request/Response records, unchanged POST endpoint, changed outgoing GET, image/text bodies, direct-browser reachability, enforced rule, invalid input, unknown fixtures, and a genuinely awaited pause.')
