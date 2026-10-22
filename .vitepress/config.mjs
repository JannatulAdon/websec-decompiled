import {defineConfig} from 'vitepress'
import {studyUnits} from './theme/labs.js'
const base=process.env.BASE_PATH||'/'
export default defineConfig({
 lang:'en-US',title:'Websec Decompiled',
 description:'A web security field guide with 176 editable concept experiments, independent investigations, and 272 mapped Academy lab links.',
 base,appearance:'dark',cleanUrls:false,
 // Retain the former curriculum in source, but do not ship its walkthroughs or
 // components inside generated page chunks. Old public URLs get redirects.
 srcExclude:['README.md','HANDOFF_CONTEXT.md','REBUILD_REPORT.md','.release/**','artifacts/**','glossary/**',...studyUnits.map(unit=>unit.file)],
 head:[
  ['link',{rel:'icon',href:`${base}favicon.svg`,type:'image/svg+xml'}],
  ['meta',{name:'theme-color',content:'#111a21'}],
  ['meta',{property:'og:title',content:'Websec Decompiled'}],
  ['meta',{property:'og:description',content:'Learn the mechanisms, inspect the evidence, and practise investigating unfamiliar web security challenges.'}]
 ],
 vite:{build:{emptyOutDir:false},server:{port:Number(process.env.PORT)||5173}}
})
