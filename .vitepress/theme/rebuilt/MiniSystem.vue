<script setup>
import { computed, ref, watch, nextTick, onUnmounted, onMounted } from 'vue'
import { experimentFor } from './experiments/index.js'
import { appFor, examplesFor, shortValue } from './interaction.js'
import {snapshotMatches,evidenceChanges,observationSummary} from './visual-data.js'
import AppResponse from './AppResponse.vue'
import EvidenceLens from './EvidenceLens.vue'
import PlainText from './PlainText.vue'
const props=defineProps({moduleId:String,lessonIndex:{type:Number,default:0},mechanism:String,limit:String,active:{type:Boolean,default:true}})
const emit=defineEmits(['explored','continue','observed'])
const config=computed(()=>experimentFor(props.moduleId,props.lessonIndex))
const app=computed(()=>appFor(props.moduleId,props.lessonIndex))
const values=ref({}),safe=ref(false),snapshot=ref(null),baseline=ref(null),history=ref([]),editing=ref({}),nudge=ref(false),completed=ref([]),live=ref(false),previous=ref(null)
const narrow=ref(false)
let sequence=0,timer,lastProbe=null,media
const resizeScene=()=>narrow.value=Boolean(media?.matches)
onMounted(()=>{media=window.matchMedia?.('(max-width: 680px)');resizeScene();media?.addEventListener('change',resizeScene)})
const hasBoundary=computed(()=>{try{return JSON.stringify(config.value.run(config.value.probe,false))!==JSON.stringify(config.value.run(config.value.probe,true))}catch{return true}})
const output=computed(()=>snapshot.value?.result)
const dirty=computed(()=>Boolean(snapshot.value)&&!snapshotMatches(values.value,safe.value,snapshot.value))
const delta=computed(()=>evidenceChanges(previous.value,snapshot.value,config.value.fields))
const stage=computed(()=>!completed.value.includes('control')?0:!completed.value.includes('probe')?1:!completed.value.includes('boundary')?2:3)
const changedFields=computed(()=>config.value.fields.filter(f=>String(config.value.control[f.key])!==String(config.value.probe[f.key])))
const changeSummary=computed(()=>changedFields.value.map(f=>`${f.label.replace(/\s*\(.*/, '')}: ${shortValue(config.value.control[f.key])} → ${shortValue(config.value.probe[f.key])}`).join(' · '))
function publish(){emit('observed',{snapshot:snapshot.value,baseline:baseline.value,history:history.value,fields:config.value.fields})}
function reset(){clearTimeout(timer);values.value={...config.value.control};safe.value=false;snapshot.value=null;baseline.value=null;history.value=[];editing.value={};completed.value=[];previous.value=null;live.value=false;nudge.value=false;lastProbe=null;sequence=0;publish()}
function run(){
 clearTimeout(timer)
 let result,valid=true
 try{result=config.value.run({...values.value},safe.value)}catch(e){valid=false;result={status:'error',trace:'Input rejected by this local model.',output:'Input rejected: '+e.message,explanation:'This input is outside the fixture’s grammar. Choose a ready example to return to a known comparison.'}}
 const matches=which=>JSON.stringify(values.value)===JSON.stringify(config.value[which])
 const current={id:++sequence,values:{...values.value},safe:safe.value,result,label:!valid?'Input error':safe.value?'Boundary enforced':matches('control')?'Ordinary request':matches('probe')?'Changed request':'Your experiment'}
 previous.value=snapshot.value;snapshot.value=current
 if(valid){
  if(!safe.value&&matches('control')){baseline.value=current;if(!completed.value.includes('control'))completed.value.push('control')}
  const isProbe=!safe.value&&!matches('control')&&(matches('probe')||result.output===config.value.run(config.value.probe,false).output)
  if(isProbe){lastProbe={...values.value};if(!completed.value.includes('probe'))completed.value.push('probe')}
  if(safe.value&&!matches('control')&&completed.value.includes('probe')&&JSON.stringify(result)!==JSON.stringify(config.value.run({...values.value},false))&&!completed.value.includes('boundary'))completed.value.push('boundary')
  if(!hasBoundary.value&&completed.value.includes('control')&&completed.value.includes('probe')&&!completed.value.includes('boundary'))completed.value.push('boundary')
  if(stage.value===3)emit('explored')
 }
 history.value=[current,...history.value].slice(0,5);publish()
}
function preset(which){values.value={...config.value[which]};safe.value=false;run()}
function choose(key,value){values.value[key]=value;run()}
function advance(){if(stage.value===0)preset('control');else if(stage.value===1)preset('probe');else if(stage.value===2){if(dirty.value||output.value?.status==='error'||JSON.stringify(values.value)===JSON.stringify(config.value.control))values.value={...(lastProbe||config.value.probe)};safe.value=true;run()}else emit('continue')}
function replay(item){clearTimeout(timer);values.value={...item.values};safe.value=item.safe;previous.value=snapshot.value;snapshot.value=item;publish()}
async function toggleEditor(key){editing.value[key]=!editing.value[key];await nextTick();if(editing.value[key])document.getElementById('model-'+key)?.focus()}
function queuePreview(){clearTimeout(timer);if(live.value&&props.active)timer=setTimeout(()=>{if(!snapshotMatches(values.value,safe.value,snapshot.value))run()},300)}
function showEffect(){document.querySelector('.mini-system .evidence-lens')?.scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'auto':'smooth',block:'start'})}
watch(values,queuePreview,{deep:true});watch(live,queuePreview);watch(()=>props.active,active=>{if(!active)clearTimeout(timer);else queuePreview()})
watch(()=>[props.moduleId,props.lessonIndex],reset,{immediate:true})
onUnmounted(()=>{clearTimeout(timer);media?.removeEventListener('change',resizeScene)})
</script>
<template>
<section v-if="config" class="mini-system guided-system">
 <div class="investigation-progress" aria-label="Investigation progress"><span v-for="(name,i) in ['Observe','Change','Protect']" :key="name" :class="{complete:completed.includes(['control','probe','boundary'][i]),current:stage===i}"><b>{{completed.includes(['control','probe','boundary'][i])?'✓':i+1}}</b>{{i===2&&!hasBoundary?'Compare':name}}<i v-if="i<2">—</i></span><button class="quiet-button" @click="reset">Start over ↺</button></div>
 <div class="guided-grid">
  <div class="mobile-task"><div><span class="eyebrow">YOUR NEXT MOVE</span><strong id="mobile-task-goal">{{['See the ordinary result','Try a changed input',hasBoundary?'Test the boundary':'Compare the evidence','Explain what you found'][stage]}}</strong><span v-if="output" class="mobile-live-result">{{dirty?'Unsent changes · last result below':observationSummary(snapshot,previous)}}</span></div><button v-if="output" class="mobile-effect-link" @click="showEffect">See effect ↓</button><button class="button primary" aria-describedby="mobile-task-goal" @click="advance">{{stage===3?'Check it':'Try it'}} →</button></div>
  <div class="fictional-app">
   <div class="browser-chrome"><span class="browser-lights" aria-hidden="true">● ● ●</span><span>{{app.address}}</span><span title="Runs only inside this page">◇</span></div>
   <div class="fictional-app-nav"><strong>{{app.name}}<span>.</span></strong><span>{{app.section}}</span></div>
   <div class="app-content">
    <div class="app-task-label"><span class="status-dot"></span> {{dirty?'UNSENT CHANGES':output?'LAST SENT · #'+snapshot.id:'READY TO EXPLORE'}}<label v-if="hasBoundary" class="safe-toggle"><input v-model="safe" type="checkbox" @change="run"> Enforce the boundary</label></div>
    <form @submit.prevent="run" class="app-controls"><label v-if="Object.values(editing).some(Boolean)" class="live-preview-toggle"><input v-model="live" type="checkbox"> Live preview while typing</label>
     <div v-for="field in config.fields" :key="field.key" class="model-field">
      <div class="field-heading"><label :id="'label-'+field.key" :for="'model-'+field.key">{{field.label}}</label><button type="button" class="custom-input-button" :aria-expanded="!!editing[field.key]" @click="toggleEditor(field.key)">{{editing[field.key]?'Close editor':'Type my own'}}</button></div>
      <div class="input-examples" role="group" :aria-labelledby="'label-'+field.key"><button v-for="example in examplesFor(config,moduleId,lessonIndex,field)" :key="example" type="button" :aria-pressed="values[field.key]===example" :title="example||'Remove this value'" @click="choose(field.key,example)">{{shortValue(example)}}</button></div>
      <textarea v-if="editing[field.key]" :id="'model-'+field.key" v-model="values[field.key]" rows="2" maxlength="3000" spellcheck="false" :placeholder="'Custom '+field.label"></textarea>
     </div>
     <div class="app-request-actions"><button class="button primary" type="submit">{{output?'Send again':'Send request'}} <span>↵</span></button><span>Click an example to send it instantly.</span></div>
    </form>
    <EvidenceLens v-if="narrow" :context="moduleId+':'+lessonIndex" :snapshot="snapshot" :baseline="baseline" :history="history" :fields="config.fields" />
    <div v-if="!output" class="app-empty"><span>↳</span><div><strong>Your first response starts here.</strong><p>Try the ordinary request below, or click any example above.</p></div></div>
    <p v-if="dirty" class="draft-notice" role="status">Your edits have not been sent. The response and visualization still show request #{{snapshot.id}}.</p><AppResponse v-if="output" :app="app" :values="snapshot.values" :result="output" /><div v-if="snapshot" class="last-change" role="status">{{observationSummary(snapshot,previous)}}</div>
    <div class="app-presets"><button aria-label="Ordinary request (load control)" @click="preset('control')"><span>01</span> Ordinary request <span>↗</span></button><button aria-label="Try a variation (load boundary probe)" @click="preset('probe')"><span>02</span> Try a variation <span>↗</span></button></div>
   </div>
  </div>
  <div class="investigation-observer"><aside class="investigation-coach" aria-label="Your next investigation step">
   <div class="coach-label"><span>✦</span> YOUR INVESTIGATION <span>{{Math.min(stage+1,3)}} / 3</span></div>
   <h3>{{['See the ordinary result.','Change something. Watch closely.',hasBoundary?'Would a boundary stop it?':'Compare what you found.','You have a comparison.'][stage]}}</h3>
   <p v-if="stage===0">Start with a working request. It gives you something to compare your next result against.</p><template v-else-if="stage===1"><p>Try the ready variation, or choose examples inside the app. Watch the response change.</p><div class="suggested-change">{{changeSummary}}</div></template><p v-else-if="stage===2">Keep the changed input. Now enforce the server or browser rule and see whether the same request still works.</p><p v-else>Connect the response to the decision that produced it. Then check your understanding in a different setting.</p>
   <button class="button primary coach-next" @click="advance">{{['Try the ordinary request','Try the ready variation','Apply the boundary','Check my understanding'][stage]}} →</button>
   <button class="quiet-button coach-nudge" :aria-expanded="nudge" @click="nudge=!nudge">{{nudge?'Hide the clue':'What should I notice?'}} <span>+</span></button><p v-if="nudge" class="coach-hint">{{stage===0?'Notice the current input and the response it selects. You will keep this as your baseline.':stage===1?'Compare the response with your ordinary request. Did a different object, interpretation, or decision appear?':config.scope}}</p>
  </aside><EvidenceLens v-if="!narrow" :context="moduleId+':'+lessonIndex" :snapshot="snapshot" :baseline="baseline" :history="history" :fields="config.fields" /><div class="scene-notes">   <details v-if="output" class="coach-observation"><summary>Why this happens</summary><div class="eyebrow">{{stage===3?'CONNECT THE DOTS':'FOLLOW THE EFFECT'}}</div><p><PlainText :text="stage>=2&&mechanism?mechanism:output.explanation" /></p></details>
   <details class="model-scope"><summary>What this small app models</summary><h4>{{config.title}}</h4><p>{{config.scope}}</p><p v-if="limit">{{limit}}</p></details>
</div></div>
 </div>
 <details v-if="history.length>1" class="request-history"><summary>Revisit a request · {{history.length}} recent results</summary><button v-for="item in history" :key="item.id" :aria-pressed="snapshot?.id===item.id" @click="replay(item)"><span>#{{item.id}} · {{item.label}}</span><code>{{Object.values(item.values).map(shortValue).join(' · ')}}</code><span>↗</span></button></details>
</section>
</template>
