// Evidence utilities operate on model snapshots, never on draft editor values.
export function traceFacts(trace='') {
 const facts=[]
 for(const line of String(trace).split('\n')) {
  const split=line.match(/^([^:\n]{1,85}):\s?(.*)$/)
  if(split&&!/^\s/.test(line))facts.push({label:split[1],value:split[2]})
  else if(facts.length&&(/^\s/.test(line)||/^[}\]]/.test(line)))facts.at(-1).value+='\n'+line
  else if(line.trim())facts.push({label:'Checkpoint '+(facts.length+1),value:line})
 }
 return facts
}
export function inputChanges(before,after,fields=[]) {
 if(!before||!after)return []
 const keys=[...new Set([...Object.keys(before.values||{}),...Object.keys(after.values||{})])]
 const changes=keys.filter(key=>String(before.values?.[key]??'')!==String(after.values?.[key]??'')).map(key=>({key,label:fields.find(f=>f.key===key)?.label||key,before:String(before.values?.[key]??''),after:String(after.values?.[key]??'')}))
 if(Boolean(before.safe)!==Boolean(after.safe))changes.push({key:'$policy',label:'Boundary rule',before:before.safe?'Enforced':'Original behavior',after:after.safe?'Enforced':'Original behavior'})
 return changes
}
export function evidenceChanges(before,after,fields=[]) {
 if(!before||!after)return {inputs:[],interpretation:false,observation:false}
 return {inputs:inputChanges(before,after,fields),interpretation:before.result.trace!==after.result.trace,observation:before.result.output!==after.result.output}
}
// Bounded LCS preserves added and removed lines without pretending reordered text is unchanged.
export function lineDiff(before='',after='') {
 const a=String(before).split('\n').slice(0,120),b=String(after).split('\n').slice(0,120)
 const dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1))
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1])
 const rows=[];let i=0,j=0
 while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){rows.push({kind:'same',text:a[i]});i++;j++}else if(j<b.length&&(i===a.length||dp[i][j+1]>=dp[i+1][j]))rows.push({kind:'added',text:b[j++]});else rows.push({kind:'removed',text:a[i++]})}
 return rows
}
export function inlineChange(before='',after='') {
 before=String(before);after=String(after)
 let start=0,end=0
 while(start<Math.min(before.length,after.length)&&before[start]===after[start])start++
 while(end<Math.min(before.length,after.length)-start&&before[before.length-1-end]===after[after.length-1-end])end++
 return {prefix:after.slice(0,start),removed:before.slice(start,end?before.length-end:undefined),added:after.slice(start,end?after.length-end:undefined),suffix:end?after.slice(-end):''}
}
export function sceneFor(snapshot) {
 return snapshot?.result?.visual||{kind:'facts',title:'The model’s decision points',question:'Which interpretation changed?',facts:traceFacts(snapshot?.result?.trace)}
}
export function snapshotMatches(values,safe,snapshot){return Boolean(snapshot)&&Boolean(safe)===Boolean(snapshot.safe)&&Object.keys(values).every(key=>String(values[key])===String(snapshot.values[key]))&&Object.keys(values).length===Object.keys(snapshot.values).length}
export function observationSummary(snapshot,previous){
 if(!snapshot)return ''
 const scene=snapshot.result.visual
 if(scene?.kind==='query'&&!scene.error){const count=scene.rows.filter(r=>r.matched).length,old=previous?.result.visual?.kind==='query'?previous.result.visual.rows.filter(r=>r.matched).length:null;return `${count} records matched${old!==null&&old!==count?' · '+(count>old?'+':'')+(count-old)+' from previous':''}`}
 if(scene?.kind==='race')return `${scene.count} committed coupon use${scene.count===1?'':'s'}`
 if(scene?.kind==='path')return `${scene.blocked?'Blocked':scene.allowed?'Inside image root':'Outside image root'} · ${scene.resolved}`
 if(scene?.kind==='ownership')return `${scene.granted?'Returned':'Stopped'} · ${scene.resource} · owner ${scene.owner}`
 if(previous){const diff=evidenceChanges(previous,snapshot);if(!diff.observation)return diff.interpretation?'Interpretation changed · same response':'Same recorded response';const added=lineDiff(previous.result.output,snapshot.result.output).find(r=>r.kind==='added');if(added)return 'Changed: '+added.text}
 return snapshot.result.output.split('\n')[0]
}
