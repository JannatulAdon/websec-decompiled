import {PICTURE_URL,PRIVATE_URL,HTTPS_PRIVATE_URL,PRIVATE_CODE} from './ssrf-sample.js'
import {importImage} from './ssrf-handler.js'

export {PICTURE_URL,PRIVATE_URL,PRIVATE_CODE}
export const IMPORT_ENDPOINT='https://studio.example.test/api/import'
export const PICTURE_ORIGIN=new URL(PICTURE_URL).origin
const image='<svg xmlns="http://www.w3.org/2000/svg" width="720" height="360" viewBox="0 0 720 360"><rect width="720" height="360" fill="#c3dfee"/><circle cx="566" cy="88" r="43" fill="#fff4c1"/><path d="M0 360 Q160 90 380 360 M220 360 Q500 40 720 360" fill="#739c92"/></svg>'

export function browserRequest(url){return new Request(IMPORT_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})})}
export async function requestRecord(request){return {method:request.method,url:request.url,headers:Object.fromEntries(request.headers),body:['GET','HEAD'].includes(request.method)?'':await request.clone().text()}}
export async function responseRecord(response){return {status:response.status,headers:Object.fromEntries(response.headers),body:await response.clone().text(),image:response.headers.get('Content-Type')?.startsWith('image/')||false}}

export function fixtureResponse(url){
 if(url===PICTURE_URL)return new Response(image,{status:200,headers:{'Content-Type':'image/svg+xml'}})
 if([PRIVATE_URL,HTTPS_PRIVATE_URL].includes(url))return new Response(PRIVATE_CODE,{status:200,headers:{'Content-Type':'text/plain'}})
 return new Response('This URL is not available in the local fixture set.',{status:404,headers:{'Content-Type':'text/plain'}})
}

export async function executeImport({url,picturesOnly=false,onEvent=()=>{},checkpoint=async()=>{}}){
 const request=browserRequest(url),client=await requestRecord(request),events=[]
 const emit=async event=>{events.push(event);onEvent(event);await checkpoint(event)}
 await emit({type:'browser-request',request:client})
 const fetchUpstream=async target=>{
  const outgoing=await requestRecord(new Request(target))
  await emit({type:'server-request',request:outgoing})
  const response=fixtureResponse(target)
  await emit({type:'server-response',response:await responseRecord(response)})
  return response
 }
 let response
 try{response=await importImage(request,fetchUpstream,picturesOnly)}
 catch(error){response=new Response(error instanceof TypeError?'Invalid URL. Enter an absolute HTTP or HTTPS URL.':'Import failed.',{status:400,headers:{'Content-Type':'text/plain'}})}
 const returned=await responseRecord(response)
 await emit({type:'browser-response',response:returned})
 return {url,picturesOnly,client,returned,events}
}

export async function directBrowserCheck(url){
 const request=await requestRecord(new Request(url))
 if([PRIVATE_URL,HTTPS_PRIVATE_URL].includes(url))return {request,error:'Network unreachable: the browser has no route to this internal host.',response:null}
 return {request,error:null,response:await responseRecord(fixtureResponse(url))}
}
