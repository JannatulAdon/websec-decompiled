import {requestRecord, responseRecord} from './ssrf-runtime.js'

export const PREVIEW_URL = 'https://docs.example.test/welcome'
export const REPORT_URL = 'http://reports.intra.test/summary'
export const PREVIEW_ENDPOINT = 'https://reader.example.test/api/preview'

// This is the handler executed by the local Reader exercise. Transport is
// injected so the exercise never contacts a supplied destination.
export async function previewLink(request, fetchUpstream) {
  const {url} = await request.json()
  const destination = new URL(url)
  if (!['http:', 'https:'].includes(destination.protocol))
    return new Response('Only HTTP and HTTPS URLs are supported.', {status: 400})
  const upstream = await fetchUpstream(destination.href)
  const body = await upstream.arrayBuffer()
  return new Response(body, {
    status: upstream.status,
    headers: {'Content-Type': upstream.headers.get('Content-Type') || 'text/plain'}
  })
}

function fixtureResponse(url) {
  if (url === PREVIEW_URL)
    return new Response('Welcome to the public documentation.', {
      headers: {'Content-Type': 'text/plain'}
    })
  if (url === REPORT_URL)
    return new Response('Internal expense summary: DEMO-ONLY', {
      headers: {'Content-Type': 'text/plain'}
    })
  return new Response('This URL is not available in the local fixture set.', {
    status: 404,
    headers: {'Content-Type': 'text/plain'}
  })
}

export async function executePreview({url, title = '', accent = 'blue'}) {
  const request = new Request(PREVIEW_ENDPOINT, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({url, title, accent})
  })
  const client = await requestRecord(request)
  const events = [{type: 'browser-request', request: client}]
  const fetchUpstream = async target => {
    const outgoing = new Request(target)
    events.push({type: 'server-request', request: await requestRecord(outgoing)})
    const response = fixtureResponse(outgoing.url)
    events.push({type: 'server-response', response: await responseRecord(response)})
    return response
  }
  let response
  try {
    response = await previewLink(request, fetchUpstream)
  } catch (error) {
    response = new Response(
      error instanceof TypeError ? 'Invalid URL. Enter an absolute HTTP or HTTPS URL.' : 'Preview failed.',
      {status: 400, headers: {'Content-Type': 'text/plain'}}
    )
  }
  const returned = await responseRecord(response)
  events.push({type: 'browser-response', response: returned})
  return {url, client, returned, events}
}
