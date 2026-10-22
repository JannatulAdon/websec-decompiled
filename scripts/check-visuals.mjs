import assert from 'node:assert/strict'
import {sqlModel,pathModel} from '../.vitepress/theme/rebuilt/models.js'
import {systems} from '../.vitepress/theme/rebuilt/systems.js'
import {experimentFor} from '../.vitepress/theme/rebuilt/experiments/index.js'
import {evidenceChanges,lineDiff,inlineChange,traceFacts,snapshotMatches,observationSummary} from '../.vitepress/theme/rebuilt/visual-data.js'
import {normalizeDrafts} from '../.vitepress/theme/rebuilt/investigation-drafts.js'
const injected="Books' OR '1'='1'-- "
for(const safe of [false,true]){
 const r=sqlModel(injected,safe),visible=r.visual.rows.filter(row=>row.matched)
 assert.equal(r.visual.binding,safe);assert.equal(visible.some(row=>!row.released),!safe)
 for(const row of r.visual.rows)assert.equal(r.output.includes(row.name),row.matched)
 if(safe){assert.equal(r.visual.query.includes(injected),false);assert.equal(r.visual.boundValue,injected)}
 const path=pathModel('../notes.txt',safe);assert.equal(path.visual.resolved,'/srv/notes.txt');assert.equal(path.visual.allowed,false);assert.equal(path.visual.blocked,safe)
 const owner=systems['access-control'].run({actor:'alice',invoice:'42'},safe);assert.equal(owner.visual.actor,'alice');assert.equal(owner.visual.owner,'bob');assert.equal(owner.visual.granted,!safe)
}
assert.equal(sqlModel("Books'").status,'error')
assert.equal(pathModel('%not-encoding').status,'error')
function permutations(items){return items.length?items.flatMap((v,i)=>permutations(items.filter((_,j)=>i!==j)).map(rest=>[v,...rest])):[[]]}
for(const order of permutations(['A-check','A-use','B-check','B-use']))for(const safe of [false,true]){
 const r=systems['race-conditions'].run({schedule:order.join(',')},safe)
 assert.equal(r.visual.events.filter(e=>e.committed).length,r.visual.count)
 assert.equal(r.visual.events.length,4)
 assert(r.output.endsWith(String(r.visual.count)))
 if(safe)assert(r.visual.count<=1,'Atomic use must preserve the one-coupon invariant')
}
const frame=experimentFor('request-smuggling',0)
const incomplete=frame.run({...frame.control,body:'broken',length:'5'},false)
assert.equal(incomplete.visual.back,null);assert.match(incomplete.output,/Incomplete/)
assert.throws(()=>frame.run({...frame.control,length:'2.5'},false),/whole number/)
const one={id:1,values:{id:'7'},safe:false,result:{trace:'Selected: 7',output:'Same page'}}
const two={id:2,values:{id:'8'},safe:false,result:{trace:'Selected: 8',output:'Same page'}}
assert.deepEqual(evidenceChanges(one,two).inputs.map(c=>c.key),['id'])
assert.equal(observationSummary(two,one),'Interpretation changed · same response');assert.equal(evidenceChanges(one,two).interpretation,true);assert.equal(evidenceChanges(one,two).observation,false)
assert.equal(snapshotMatches({id:'8'},false,one),false)
assert.equal(evidenceChanges(one,{...one,safe:true}).inputs[0].key,'$policy')
const diff=lineDiff('A\nB\nC','A\nD\nC')
assert(diff.some(r=>r.kind==='removed'&&r.text==='B'));assert(diff.some(r=>r.kind==='added'&&r.text==='D'))
assert.equal(diff.filter(r=>r.kind==='same').length,2)
assert.deepEqual(inlineChange('/items/7','/items/8'),{prefix:'/items/',removed:'7',added:'8',suffix:''})
assert.equal(traceFacts('Stored: {\n  "role": "user"\n}\nDecision: deny').length,2)
const drafts=normalizeDrafts({receipts:{request:{session:'',path:'/api/receipt',input:'42'},requests:Array.from({length:30},()=>({session:'',path:'/api/receipt',input:'42'})),notes:'x'.repeat(11000)},unknown:{notes:'remove'}})
assert.equal(drafts.receipts.request.session,'','Do not turn an absent session into Alice during restoration')
assert.equal(drafts.receipts.requests.length,20);assert.equal(drafts.receipts.notes.length,10000);assert(!drafts.unknown)
console.log('✓ Visual facts match query results, ownership decisions, path policies and all 24 race schedules; snapshot diffs, unknown framing and draft preservation pass.')
