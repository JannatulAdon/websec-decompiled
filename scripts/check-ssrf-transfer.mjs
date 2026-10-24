import assert from 'node:assert/strict'
import {executePreview, previewLink, PREVIEW_URL, REPORT_URL, PREVIEW_ENDPOINT} from '../.vitepress/theme/rebuilt/ssrf-transfer.js'

const outgoing = result => result.events.filter(event => event.type === 'server-request')
const normal = await executePreview({url: PREVIEW_URL, title: 'Welcome', accent: 'blue'})
assert.equal(normal.client.url, PREVIEW_ENDPOINT)
assert.equal(normal.client.method, 'POST')
assert.deepEqual(JSON.parse(normal.client.body), {url: PREVIEW_URL, title: 'Welcome', accent: 'blue'})
assert.deepEqual(normal.events.map(event => event.type), ['browser-request', 'server-request', 'server-response', 'browser-response'])
assert.equal(outgoing(normal)[0].request.method, 'GET')
assert.equal(outgoing(normal)[0].request.url, PREVIEW_URL)
assert.equal(normal.returned.status, 200)
assert.equal(normal.returned.body, 'Welcome to the public documentation.')

// Display settings are submitted, but do not become the server's destination.
for (const fields of [{title: REPORT_URL, accent: 'blue'}, {title: 'Welcome', accent: 'green'}]) {
  const changed = await executePreview({url: PREVIEW_URL, ...fields})
  assert.deepEqual(JSON.parse(changed.client.body), {url: PREVIEW_URL, ...fields})
  assert.deepEqual(outgoing(changed), outgoing(normal))
  assert.deepEqual(changed.returned, normal.returned)
}

const internal = await executePreview({url: REPORT_URL, title: 'Welcome', accent: 'blue'})
assert.equal(internal.client.url, normal.client.url)
assert.equal(outgoing(internal)[0].request.url, REPORT_URL)
assert.equal(internal.returned.status, 200)
assert.equal(internal.returned.body, 'Internal expense summary: DEMO-ONLY')
assert.deepEqual(internal.events[2].response, internal.returned)
assert.equal((await executePreview({url: 'HTTP://REPORTS.INTRA.TEST/summary'})).returned.body, internal.returned.body)

for (const url of ['not a URL', 'file:///etc/passwd', 'javascript:alert(1)', 'ftp://docs.example.test/welcome']) {
  const invalid = await executePreview({url})
  assert.equal(invalid.returned.status, 400)
  assert.equal(outgoing(invalid).length, 0)
  assert.deepEqual(invalid.events.map(event => event.type), ['browser-request', 'browser-response'])
}
const unknown = await executePreview({url: 'https://unknown.example.test/'})
assert.equal(unknown.returned.status, 404)
assert.equal(outgoing(unknown).length, 1)

// Verify the exported handler itself delegates the parsed destination and
// forwards the upstream response, rather than reconstructing a displayed trace.
let target
const actualResponse = await previewLink(new Request(PREVIEW_ENDPOINT, {
  method: 'POST', body: JSON.stringify({url: REPORT_URL, title: 'Different', accent: 'green'})
}), async url => {target = url; return new Response('Distinct upstream evidence', {status: 202})})
assert.equal(target, REPORT_URL)
assert.equal(actualResponse.status, 202)
assert.equal(await actualResponse.text(), 'Distinct upstream evidence')

console.log('✓ Reader transfer: actual handler, submitted fields, URL-only destination control, unchanged POST endpoint, internal response, canonical URLs, invalid/protocol rejection before GET, and bounded unknown fixtures.')
