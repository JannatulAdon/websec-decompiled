<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { experimentFor } from './experiments/index.js'
import { appFor, examplesFor, shortValue } from './interaction.js'
import AppResponse from './AppResponse.vue'
const props=defineProps({moduleId:String,lessonIndex:{type:Number,default:0},mechanism:String,limit:String})
const emit=defineEmits(['explored','continue'])
const config=computed(()=>experimentFor(props.moduleId,props.lessonIndex))
const app=computed(()=>appFor(props.moduleId,props.lessonIndex))
const responseValues=ref({}),values=ref({}),safe=ref(false),output=ref(null),baseline=ref(null),history=ref([]),editing=ref({}),inspector=ref('server'),nudge=ref(false),completed=ref([])
const hasBoundary=computed(()=>{try{return JSON.stringify(config.value.run(config.value.probe,false))!==JSON.stringify(config.value.run(config.value.probe,true))}catch{return true}})
const stage=computed(()=>!completed.value.includes('control')?0:!completed.value.includes('probe')?1:!completed.value.includes('boundary')?2:3)
const changedFields=computed(()=>config.value.fields.filter(f=>String(config.value.control[f.key])!==String(config.value.probe[f.key])))
const changeSummary=computed(()=>changedFields.value.map(f=>`${f.label.replace(/\s*\(.*/, '')}: ${shortValue(config.value.control[f.key])} → ${shortValue(config.value.probe[f.key])}`).join(' · '))
const responseChanged=computed(()=>baseline.value&&output.value&&baseline.value.output!==output.value.output)
const highlightedTrace=computed(()=>{
 let parts=[{text:output.value?.trace||'',mark:false}]
 const candidates=[...new Set([...changedFields.value.map(f=>responseValues.value[f.key]),...Object.values(responseValues.value)])].filter(v=>typeof v==='string'&&v.length>=3&&v.length<=500).sort((a,b)=>b.length-a.length).slice(0,4)
 for(const value of candidates)parts=parts.flatMap(part=>part.mark?[part]:part.text.split(value).flatMap((text,i)=>i?[{text:value,mark:true},{text,mark:false}]:[{text,mark:false}]))
 return parts
})
function reset(){values.value={...config.value.control};responseValues.value={};safe.value=false;output.value=null;baseline.value=null;history.value=[];editing.value={};completed.value=[];inspector.value='server';nudge.value=false}
function run(){
 try{
  const result=config.value.run(values.value,safe.value)
  output.value=result;responseValues.value={...values.value}
  const matches=which=>JSON.stringify(values.value)===JSON.stringify(config.value[which])
  if(!safe.value&&matches('control')){baseline.value=result;if(!completed.value.includes('control'))completed.value.push('control')}
  if(!safe.value&&!matches('control')&&(matches('probe')||result.output===config.value.run(config.value.probe,false).output)&&!completed.value.includes('probe'))completed.value.push('probe')
  if(safe.value&&!matches('control')&&completed.value.includes('probe')&&JSON.stringify(result)!==JSON.stringify(config.value.run(values.value,false))&&!completed.value.includes('boundary'))completed.value.push('boundary')
  if(!hasBoundary.value&&completed.value.includes('control')&&completed.value.includes('probe')&&!completed.value.includes('boundary'))completed.value.push('boundary')
  if(stage.value===3)emit('explored')
  history.value=[{values:{...values.value},safe:safe.value,result,label:safe.value?'Boundary enforced':matches('control')?'Ordinary request':matches('probe')?'Changed request':'Your experiment'},...history.value].slice(0,5)
 }catch(e){responseValues.value={...values.value};output.value={trace:'Input rejected by this local model.',output:'Input rejected: '+e.message,explanation:'This input is outside the fixture’s grammar. Pick a ready example to return to a known comparison.'}}
}
function preset(which){values.value={...config.value[which]};safe.value=false;run()}
function choose(key,value){values.value[key]=value;run()}
function advance(){if(stage.value===0)preset('control');else if(stage.value===1)preset('probe');else if(stage.value===2){if(JSON.stringify(values.value)===JSON.stringify(config.value.control))values.value={...config.value.probe};safe.value=true;run()}else emit('continue')}
function replay(item){values.value={...item.values};responseValues.value={...item.values};safe.value=item.safe;output.value=item.result}
async function toggleEditor(key){editing.value[key]=!editing.value[key];await nextTick();if(editing.value[key])document.getElementById('model-'+key)?.focus()}
watch(()=>[props.moduleId,props.lessonIndex],reset,{immediate:true})
</script>
<template>
<section v-if="config" class="mini-system guided-system">
 <div class="investigation-progress" aria-label="Investigation progress"><span v-for="(name,i) in ['Observe','Change','Protect']" :key="name" :class="{complete:completed.includes(['control','probe','boundary'][i]),current:stage===i}"><b>{{completed.includes(['control','probe','boundary'][i])?'✓':i+1}}</b>{{i===2&&!hasBoundary?'Compare':name}}<i v-if="i<2">—</i></span><button class="quiet-button" @click="reset">Start over ↺</button></div>
 <div class="guided-grid">
  <div class="mobile-task"><div><span class="eyebrow">YOUR NEXT MOVE</span><strong id="mobile-task-goal">{{['See the ordinary result','Try a changed input',hasBoundary?'Test the boundary':'Compare the evidence','Explain what you found'][stage]}}</strong></div><button class="button primary" aria-describedby="mobile-task-goal" @click="advance">{{stage===3?'Check it':'Try it'}} →</button></div>
  <div class="fictional-app">
   <div class="browser-chrome"><span class="browser-lights" aria-hidden="true">● ● ●</span><span>{{app.address}}</span><span title="Runs only inside this page">◇</span></div>
   <div class="fictional-app-nav"><strong>{{app.name}}<span>.</span></strong><span>{{app.section}}</span></div>
   <div class="app-content">
    <div class="app-task-label"><span class="status-dot"></span> {{output?'LIVE RESPONSE':'READY TO EXPLORE'}}<label v-if="hasBoundary" class="safe-toggle"><input v-model="safe" type="checkbox" @change="run"> Enforce the boundary</label></div>
    <form @submit.prevent="run" class="app-controls">
     <div v-for="field in config.fields" :key="field.key" class="model-field">
      <div class="field-heading"><label :id="'label-'+field.key" :for="'model-'+field.key">{{field.label}}</label><button type="button" class="custom-input-button" :aria-expanded="!!editing[field.key]" @click="toggleEditor(field.key)">{{editing[field.key]?'Close editor':'Type my own'}}</button></div>
      <div class="input-examples" role="group" :aria-labelledby="'label-'+field.key"><button v-for="example in examplesFor(config,moduleId,lessonIndex,field)" :key="example" type="button" :aria-pressed="values[field.key]===example" :title="example||'Remove this value'" @click="choose(field.key,example)">{{shortValue(example)}}</button></div>
      <textarea v-if="editing[field.key]" :id="'model-'+field.key" v-model="values[field.key]" rows="2" maxlength="3000" spellcheck="false" :placeholder="'Custom '+field.label"></textarea>
     </div>
     <div class="app-request-actions"><button class="button primary" type="submit">{{output?'Send again':'Send request'}} <span>↵</span></button><span>Click an example to send it instantly.</span></div>
    </form>
    <div v-if="!output" class="app-empty"><span>↳</span><div><strong>Your first response starts here.</strong><p>Try the ordinary request below, or click any example above.</p></div></div>
    <AppResponse v-else :app="app" :values="responseValues" :result="output" aria-live="polite" />
    <div class="app-presets"><button aria-label="Ordinary request (load control)" @click="preset('control')"><span>01</span> Ordinary request <span>↗</span></button><button aria-label="Try a variation (load boundary probe)" @click="preset('probe')"><span>02</span> Try a variation <span>↗</span></button></div>
   </div>
  </div>
  <aside class="investigation-coach" aria-label="Your next investigation step">
   <div class="coach-label"><span>✦</span> YOUR INVESTIGATION <span>{{Math.min(stage+1,3)}} / 3</span></div>
   <h3>{{['See the ordinary result.','Change something. Watch closely.',hasBoundary?'Would a boundary stop it?':'Compare what you found.','You have a comparison.'][stage]}}</h3>
   <p v-if="stage===0">Start with a working request. It gives you something to compare your next result against.</p><template v-else-if="stage===1"><p>Try the ready variation, or choose examples inside the app. Watch the response change.</p><div class="suggested-change">{{changeSummary}}</div></template><p v-else-if="stage===2">Keep the changed input. Now enforce the server or browser rule and see whether the same request still works.</p><p v-else>Connect the response to the decision that produced it. Then check your understanding in a different setting.</p>
   <button class="button primary coach-next" @click="advance">{{['Try the ordinary request','Try the ready variation','Apply the boundary','Check my understanding'][stage]}} →</button>
   <button class="quiet-button coach-nudge" :aria-expanded="nudge" @click="nudge=!nudge">{{nudge?'Hide the clue':'What should I notice?'}} <span>+</span></button><p v-if="nudge" class="coach-hint">{{stage===0?'Notice the current input and the response it selects. You will keep this as your baseline.':stage===1?'Compare the response with your ordinary request. Did a different object, interpretation, or decision appear?':config.scope}}</p>
   <div v-if="output" class="coach-observation"><div class="eyebrow">{{stage===3?'CONNECT THE DOTS':'FOLLOW THE EFFECT'}}</div><p>{{stage>=2&&mechanism?mechanism:output.explanation}}</p></div>
   <details class="model-scope"><summary>What this small app models</summary><h4>{{config.title}}</h4><p>{{config.scope}}</p><p v-if="limit">{{limit}}</p></details>
  </aside>
 </div>
 <div v-if="output" class="live-inspector">
  <div class="inspector-tabs" role="group" aria-label="Inspect this result"><button :aria-pressed="inspector==='response'" @click="inspector='response'">① Response</button><span>←</span><button :aria-pressed="inspector==='server'" @click="inspector='server'">② Behind the scenes</button><button :aria-pressed="inspector==='compare'" @click="inspector='compare'">③ Compare results <span v-if="baseline&&responseChanged" class="changed-dot">●</span></button></div>
  <div v-if="inspector==='response'" class="inspector-result"><span class="eyebrow">RESPONSE CONTENT</span><pre>{{output.output}}</pre></div>
  <div v-else-if="inspector==='server'" class="inspector-result"><span class="eyebrow">HOW THIS INPUT WAS INTERPRETED</span><pre><template v-for="(part,i) in highlightedTrace" :key="i"><mark v-if="part.mark">{{part.text}}</mark><template v-else>{{part.text}}</template></template></pre></div>
  <div v-else class="response-comparison"><div><span class="eyebrow">ORDINARY REQUEST</span><p>{{baseline?.output||'Run the ordinary request to capture a baseline.'}}</p></div><div :class="{'has-difference':responseChanged}"><span class="eyebrow">CURRENT RESULT · {{responseChanged?'CHANGED':'SAME RESPONSE'}}</span><p>{{output.output}}</p></div></div>
  <details v-if="history.length>1" class="request-history"><summary>Revisit a request · {{history.length}} recent results</summary><button v-for="(item,i) in history" :key="i" @click="replay(item)"><span>{{item.label}}</span><code>{{Object.values(item.values).map(shortValue).join(' · ')}}</code><span>↗</span></button></details>
 </div>
</section>
</template>
