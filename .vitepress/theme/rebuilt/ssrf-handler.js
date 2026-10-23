import {PICTURE_URL} from './ssrf-sample.js'

const PICTURE_ORIGIN = new URL(PICTURE_URL).origin

export async function importImage(request, fetchUpstream, picturesOnly=false) {
 const {url} = await request.json()
 const destination = new URL(url)
 if (!['http:', 'https:'].includes(destination.protocol))
  return new Response('Only HTTP and HTTPS URLs are supported.', {status:400})
 if (picturesOnly && destination.origin !== PICTURE_ORIGIN)
  return new Response('Destination is not allowed.', {status:403})
 const upstream = await fetchUpstream(destination.href)
 const body = await upstream.arrayBuffer()
 return new Response(body, {
  status:upstream.status,
  headers:{'Content-Type':upstream.headers.get('Content-Type') || 'application/octet-stream'}
 })
}
