import {mkdir,writeFile} from 'node:fs/promises'
import {resolve,dirname} from 'node:path'
import {studyUnits} from '../.vitepress/theme/labs.js'
import {legacyTopicIds} from '../.vitepress/theme/rebuilt/curriculum.js'
const base=process.env.BASE_PATH||'/'
const redirects=[]
for(const unit of studyUnits){
 const id=unit.id.startsWith('sql-injection/')?'sql-injection':legacyTopicIds[unit.id]||unit.id
 const index=unit.id==='sql-injection/union-attacks'?1:unit.id==='sql-injection/database-fingerprinting'?2:unit.id==='sql-injection/blind'?3:unit.id==='sql-injection/waf-bypass-xml'?6:0
 redirects.push([unit.file.replace(/\.md$/,'.html'),`${base}#/learn/${id}/${index}`])
}
redirects.push(['glossary/index.html',`${base}#/reference`])
for(const [file,target] of redirects){const path=resolve('.vitepress/dist',file);await mkdir(dirname(path),{recursive:true});await writeFile(path,`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=${target}"><title>Continue learning · Websec Decompiled</title><link rel="canonical" href="${target}"><body><p>This learning page has moved. <a href="${target}">Continue in the rebuilt learning platform</a>.</p></body></html>\n`)}
console.log(`✓ ${redirects.length} legacy URLs redirect into the rebuilt platform; archived walkthroughs are excluded from the build.`)
