import assert from 'node:assert/strict'
import { modules, stages, lessonCount, academyLabs, preparation } from '../.vitepress/theme/rebuilt/curriculum.js'
import { cases } from '../.vitepress/theme/rebuilt/cases.js'
import {playbooks} from '../.vitepress/theme/rebuilt/playbooks.js'
import {lessonSystems} from '../.vitepress/theme/rebuilt/experiments/index.js'
import {preparationMap} from '../.vitepress/theme/rebuilt/preparation-map.js'
import {missions} from '../.vitepress/theme/rebuilt/missions.js'
import {missionExamples} from '../.vitepress/theme/rebuilt/mission-examples.js'
import {examplesFor} from '../.vitepress/theme/rebuilt/interaction.js'
import { systems } from '../.vitepress/theme/rebuilt/systems.js'
import { sqlModel,pathModel } from '../.vitepress/theme/rebuilt/models.js'
import { normalize, normalizeLegacy } from '../.vitepress/theme/rebuilt/store.js'
const ids=new Set()
for(const module of modules){
 assert(stages.some(s=>s.ids.includes(module.id)),`No stage for ${module.id}`)
 assert(cases[module.id],`No transfer case for ${module.id}`)
 assert(systems[module.id],`No miniature system for ${module.id}`)
 assert(module.analogy.length>40)
 assert.equal(playbooks[module.id]?.length,4,`Missing practical guide: ${module.id}`)
 for(const lesson of module.lessons){
  assert(!ids.has(lesson.id));ids.add(lesson.id)
  for(const key of ['title','change','evidence','mechanism','limit','transfer'])assert(lesson[key]?.trim(),`${lesson.id} missing ${key}`)
 }
 assert.equal(lessonSystems[module.id].length,module.lessons.length,`Experiment count: ${module.id}`)
 const system=systems[module.id]
 // DOM parser behavior is reserved for the real browser suite.
 if(['xss','dom'].includes(module.id))continue
 for(const values of [system.control,system.probe])for(const safe of [false,true]){
  const result=system.run(values,safe)
  assert.equal(typeof result.trace,'string');assert(result.output);assert(result.explanation)
 }
}
for(const module of modules){if(['xss','dom'].includes(module.id))continue;for(const [index,system] of lessonSystems[module.id].entries())for(const values of [system.control,system.probe])for(const safe of [false,true]){const result=system.run(values,safe);assert(result.trace,`${module.id}:${index} trace`);assert(result.output);assert(result.explanation)}}
assert.equal(Object.keys(preparationMap).length,academyLabs.length)
for(const [labId,record] of Object.entries(preparationMap)){assert(academyLabs.some(l=>l.id===labId));for(const skill of record.skills)assert(ids.has(skill),`Unknown skill ${skill}`)}
for(const mission of missions){const result=mission.run(mission.request);assert(result.output);assert(!result.evidence,`Baseline should not reveal ${mission.id}`)}
for(const [moduleId,models] of Object.entries(lessonSystems))for(const [index,model] of models.entries())for(const field of model.fields){
 const examples=examplesFor(model,moduleId,index,field)
 assert(examples.includes(String(model.control[field.key])),`${moduleId}:${index}: missing ordinary example`)
 assert(examples.includes(String(model.probe[field.key])),`${moduleId}:${index}: missing changed example`)
 assert.equal(new Set(examples).size,examples.length)
}
for(const mission of missions){assert(missionExamples[mission.id]?.length>=2);for(const example of missionExamples[mission.id])assert(mission.run({...mission.request,...example}).output,`${mission.id}: broken ready request`)}
assert.equal(ids.size,lessonCount)
assert.equal(new Set(academyLabs.map(l=>l.id)).size,272)
for(const lab of academyLabs){assert(preparation(lab).length,`No prep for ${lab.id}`);assert(preparation(lab).every(l=>ids.has(l.id)));assert.match(lab.url,/^https:\/\/portswigger.net\/web-security\//)}
// Injection changes parsed logic; parameter binding must keep the same input literal.
assert.match(sqlModel("Books' OR '1'='1'-- ").output,/not released/)
assert.doesNotMatch(sqlModel("Books' OR '1'='1'-- ",true).output,/not released/)
assert.match(sqlModel("Books' AND '1'='2'-- ").output,/No matching/)
assert.match(sqlModel("Books' OR '1'='1' AND '1'='2'-- ").output,/Field notebook/)
assert.doesNotMatch(sqlModel("Books' OR '1'='1' AND '1'='2'-- ").output,/not released/)
assert.match(sqlModel("Books'").output,/parse error/)
assert.match(pathModel('../notes.txt').output,/Private note/)
assert.match(pathModel('../notes.txt',true).output,/Blocked/)
assert.match(pathModel('/srv/images-neighbor/notes.txt',true).output,/Blocked/)
assert.match(pathModel('%ZZ').output,/Invalid percent/)
const run=(id,safe=false,values=systems[id].probe)=>systems[id].run(values,safe).output
assert.match(run('access-control'),/bob/);assert.match(run('access-control',true),/403/)
assert.match(run('authentication',true),/403/)
assert.match(run('business-logic'),/130/);assert.match(run('business-logic',true),/Rejected/)
assert.match(run('nosql-injection'),/Authenticated/);assert.match(run('nosql-injection',true),/Rejected/)
assert.match(run('ssrf',true),/Blocked/)
assert.match(run('xxe',true),/Rejected/)
assert.equal(run('ssti'),'Hello 49');assert.equal(run('ssti',true),'Hello {{7*7}}')
assert.match(run('csrf',true),/Rejected/)
assert.match(run('cors',true),/blocked/)
assert.match(run('clickjacking',true),/refused/)
assert.match(run('websockets',true),/403/)
assert.match(run('api-testing',true),/denied/)
assert.match(run('graphql',true),/3 authentication/)
assert.match(run('oauth',true),/rejected/)
assert.match(run('jwt',true),/rejected/)
assert.match(run('file-upload',true),/rejected/)
assert.match(run('deserialization',true),/Rejected/)
assert.match(run('prototype-pollution',true),/denied/)
assert.match(run('llm',true),/denied/)
assert.doesNotMatch(run('host-header',true),/https:\/\/other/)
assert.match(run('cache-poisoning',true),/separate safe/)
assert.match(run('cache-deception',true),/not exposed/)
assert.match(run('request-smuggling'),/Parsers disagree/)
assert.match(run('request-smuggling',true),/Rejected/)
assert.match(run('request-smuggling',false,{body:'0\r\n\r\nGET /private',length:'999'}),/would wait/)
assert.match(run('race-conditions'),/discounts: 2/)
assert.match(run('race-conditions',true),/discounts: 1/)
assert.equal({}.isAdmin,undefined,'Prototype demo polluted real objects')
// Backup validation rejects unrelated files and strips unknown keys/oversized notes.
assert.throws(()=>normalize({version:2,done:{},labs:{}}))
const clean=normalize(JSON.parse('{"version":1,"done":{"foundations:0":true,"unknown":true},"labs":{},"notes":{"foundations":"kept","unknown":"removed"},"palette":"invalid","dark":false}'))
assert.deepEqual(clean.done,{'foundations:0':true});assert.deepEqual(clean.notes,{foundations:'kept'});assert.equal(clean.palette,'ocean');assert.equal(clean.dark,false)
console.log(`✓ ${modules.length} modules, ${lessonCount} concept records, ${Object.keys(cases).length} transfer cases, ${lessonCount} lesson experiments; ${missions.length} independent fictional workspaces, ${academyLabs.length} lab preparation links`)
console.log('✓ Parser, state, authorization, cache, race, key-trust, and backup invariants passed; HTML parser behavior is checked separately by the real-browser suite.')

const legacy=normalizeLegacy({version:3,labs:{'lab-retrieve-hidden-data':123},notes:{labs:{},topics:{'cross-site-scripting':'browser note','sql-injection/blind':'blind note'}},bookmarks:{labs:{'lab-retrieve-hidden-data':true}}});assert(legacy.labs['lab-retrieve-hidden-data']);assert.equal(legacy.notes.xss,'browser note');assert.equal(legacy.notes['sql-injection'],'blind note');assert.deepEqual(legacy.done,{});assert.deepEqual(legacy.passed,{})
