// Drafts are separate from checked investigations and lab records.
import {missions} from './missions.js'
export const DRAFT_KEY='websec-decompiled:investigation-drafts:v1'
const string=(value,max)=>typeof value==='string'?value.slice(0,max):''
export function cleanRequest(request,fallback){return {session:typeof request?.session==='string'?string(request.session,80):fallback.session,path:typeof request?.path==='string'?string(request.path,400):fallback.path,input:typeof request?.input==='string'?string(request.input,3000):fallback.input}}
export function normalizeDrafts(data){
 const clean={}
 for(const mission of missions){const entry=data?.[mission.id];if(!entry||typeof entry!=='object')continue
  clean[mission.id]={request:cleanRequest(entry.request,mission.request),requests:Array.isArray(entry.requests)?entry.requests.slice(-20).map(r=>cleanRequest(r,mission.request)):[],hypothesis:string(entry.hypothesis,3000),notes:string(entry.notes,10000),hint:entry.hint===1?1:0,revealed:entry.revealed===true}
 }
 return clean
}
