import { reactive, watch } from 'vue'
import { missionIds } from './missions.js'
import { modules, academyLabs, legacyTopicIds } from './curriculum.js'
export const KEY='websec-decompiled:rebuild:v1'
const lessonIds=new Set(modules.flatMap(m=>m.lessons.map(l=>l.id)))
const labIds=new Set(academyLabs.map(l=>l.id))
const moduleIds=new Set(modules.map(m=>m.id))
export const state=reactive({version:1,done:{},explored:{},missions:{},passed:{},labs:{},saved:{},notes:{},reviews:{},last:'',palette:'ocean',dark:false})
export const storageStatus=reactive({error:''})
const safeMap=(input,allow,text=false)=>Object.fromEntries(Object.entries(input&&typeof input==='object'&&!Array.isArray(input)?input:{}).filter(([key,val])=>allow.has(key)&&(text?typeof val==='string'&&val.length<=20000:val===true)))
export function normalize(raw){
 if(!raw||raw.version!==1||!raw.done||!raw.labs)throw Error('Choose a Websec Decompiled rebuild backup (version 1).')
 return {version:1,done:safeMap(raw.done,lessonIds),explored:safeMap(raw.explored,lessonIds),missions:safeMap(raw.missions,missionIds),passed:safeMap(raw.passed,moduleIds),labs:safeMap(raw.labs,labIds),saved:safeMap(raw.saved,labIds),notes:safeMap(raw.notes,new Set([...moduleIds,...labIds,...[...missionIds].map(id=>'mission:'+id)]),true),reviews:Object.fromEntries(Object.entries(raw.reviews||{}).filter(([k,v])=>moduleIds.has(k)&&Number.isFinite(v)&&v>0&&v<1e14)),last:lessonIds.has(raw.last)?raw.last:'',palette:['ocean','sage','indigo','espresso'].includes(raw.palette)?raw.palette:'ocean',dark:raw.dark!==false}
}
export function normalizeLegacy(old){
 if(!old||(!old.labs&&!old.solvedLabs)||!old.notes||Array.isArray(old.notes))throw Error('This is not a recognized progress backup.')
 const completed=old.labs||old.solvedLabs||{}
 const rawMap=Array.isArray(completed)?Object.fromEntries(completed.map(id=>[id,true])):Object.fromEntries(Object.entries(completed).map(([id,v])=>[id,Boolean(v)]))
 const notes=safeMap(old.notes?.labs,labIds,true)
 for(const [id,text] of Object.entries(old.notes?.topics||{})){
  const moduleId=id.startsWith('sql-injection/')?'sql-injection':legacyTopicIds[id]||id
  if(moduleIds.has(moduleId)&&typeof text==='string'&&text.trim())notes[moduleId]=[notes[moduleId],text].filter(Boolean).join('\n\n').slice(0,20000)
 }
 const palette=old.ui?.themePalette||old.palette
 return normalize({version:1,done:{},passed:{},labs:safeMap(rawMap,labIds),saved:safeMap(Object.fromEntries(Object.entries(old.bookmarks?.labs||{}).map(([id,v])=>[id,Boolean(v)])),labIds),notes,palette,dark:old.dark})
}
export function hydrate(){
 try{
  const saved=localStorage.getItem(KEY)
  if(saved)Object.assign(state,normalize(JSON.parse(saved)))
  else for(const key of ['websec-decompiled:progress:v1','websec-decompiled:v2']){
   const raw=localStorage.getItem(key)
   if(!raw)continue
   const migrated=normalizeLegacy(JSON.parse(raw))
   for(const field of ['labs','saved','notes'])Object.assign(state[field],migrated[field])
   state.palette=migrated.palette
  }
 }catch{storageStatus.error='Saved data could not be read. Your original browser data has been kept.'}
 watch(state,()=>{
  try{localStorage.setItem(KEY,JSON.stringify(state));storageStatus.error=''}catch{storageStatus.error='Browser storage is unavailable or full. Export a backup to keep this session.'}
 },{deep:true})
}
export function exportData(){
 const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}))
 const a=document.createElement('a');a.href=url;a.download='websec-decompiled-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
export async function importData(file){
 if(!file)return
 if(file.size>2e6)throw Error('Backup is too large; choose a file smaller than 2 MB.')
 const raw=JSON.parse(await file.text())
 const clean=raw.done?normalize(raw):normalizeLegacy(raw)
 // Merge learning records; imports never erase work completed in this browser.
 for(const key of ['done','explored','missions','passed','labs','saved'])Object.assign(state[key],clean[key])
 for(const [id,text] of Object.entries(clean.notes)){const current=state.notes[id];state.notes[id]=current&&current!==text?[current,'Imported note:',text].join('\n\n').slice(0,20000):text}
 for(const [id,time] of Object.entries(clean.reviews))state.reviews[id]=Math.max(state.reviews[id]||0,time)
 state.palette=clean.palette;state.dark=clean.dark
}
