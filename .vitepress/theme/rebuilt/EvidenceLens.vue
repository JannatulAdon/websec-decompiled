<script setup>
import {computed,ref,watch} from 'vue'
import ModelScene from './ModelScene.vue'
import {evidenceChanges,traceFacts,lineDiff,inlineChange} from './visual-data.js'
const props=defineProps({snapshot:Object,baseline:Object,history:{type:Array,default:()=>[]},fields:{type:Array,default:()=>[]},context:String,initialView:{type:String,default:'visual'},baselineLabel:{type:String,default:'Ordinary request'}})
const view=ref(props.initialView),checkpoint=ref(-1),compareId=ref('baseline'),pinned=ref(null),onlyChanged=ref(true)
const reference=computed(()=>compareId.value==='baseline'?props.baseline:pinned.value)
const difference=computed(()=>evidenceChanges(reference.value,props.snapshot,props.fields))
const facts=computed(()=>traceFacts(props.snapshot?.result.trace))
const status=computed(()=>!props.snapshot?'Waiting for a request':!reference.value?'First observation':difference.value.observation?'Response changed':difference.value.interpretation?'Interpretation changed · same response':difference.value.inputs.length?'Input changed · same evidence':'Same input and evidence')
function chooseReference(){pinned.value=props.history.find(h=>String(h.id)===compareId.value)||null}
watch(()=>props.snapshot,()=>checkpoint.value=-1)
watch(()=>props.context,()=>{view.value=props.initialView;checkpoint.value=-1;compareId.value='baseline';pinned.value=null})
function rows(key){const rows=lineDiff(reference.value?.result[key],props.snapshot?.result[key]);return onlyChanged.value?rows.filter(r=>r.kind!=='same'):rows}
function short(value){return value===''?'(absent)':value}
</script>
<template>
<section class="evidence-lens" aria-label="Live mechanism inspector">
 <div class="lens-heading"><div><span class="eyebrow">LIVE MECHANISM</span><h3>{{snapshot?.result.visual?.title||'Follow the decision'}}</h3></div><span class="lens-version">{{snapshot?'#'+snapshot.id:'READY'}}</span></div>
 <div class="lens-state" role="status"><span class="lens-state-dot"></span>{{status}}</div>
 <div class="lens-tabs" role="group" aria-label="Evidence views"><button :aria-pressed="view==='visual'" @click="view='visual'">Live view</button><button :aria-pressed="view==='compare'" @click="view='compare'">③ Compare results</button><button :aria-pressed="view==='raw'" @click="view='raw'">② Behind the scenes</button></div>
 <div v-if="view==='visual'" class="lens-visual"><ModelScene :snapshot="snapshot" :reference="reference" :checkpoint="checkpoint"/><div v-if="snapshot&&difference.inputs.length" class="change-ribbon"><span>YOU CHANGED</span><span v-for="change in difference.inputs" :key="change.key">{{change.label.replace(/\s*\(.*/,'')}} <b>↗</b></span></div>
  <div v-if="snapshot&&facts.length" class="checkpoint-controls"><button aria-label="Previous checkpoint" :disabled="checkpoint<=0" @click="checkpoint--">←</button><button @click="checkpoint=checkpoint<facts.length-1?checkpoint+1:-1">{{checkpoint<0?'Step through the model':checkpoint===facts.length-1?'Show whole result':'Next checkpoint'}} →</button><span>{{checkpoint<0?'':checkpoint+1+' / '+facts.length}}</span></div><div v-if="checkpoint>=0" class="checkpoint-focus"><span>{{facts[checkpoint]?.label}}</span><code>{{facts[checkpoint]?.value}}</code></div>
 </div>
 <div v-else-if="view==='compare'" class="lens-comparison"><div class="comparison-toolbar"><label>Compare against<select v-model="compareId" @change="chooseReference"><option value="baseline">{{baselineLabel}}</option><option v-for="item in history" :key="item.id" :value="String(item.id)">#{{item.id}} · {{item.label}}{{item.id===snapshot?.id?' · current':''}}</option><option v-if="pinned&&!history.some(h=>h.id===pinned.id)" :value="String(pinned.id)">#{{pinned.id}} · pinned result</option></select></label><label><input type="checkbox" v-model="onlyChanged"> Only changes</label></div>
  <p v-if="!snapshot||!reference" class="lens-empty">Run the ordinary request and a variation to build a comparison.</p><template v-else>
  <div class="difference-counts"><span><b>{{difference.inputs.length}}</b> inputs changed</span><span>{{difference.interpretation?'● Changed':'○ Same'}} interpretation</span><span>{{difference.observation?'● Changed':'○ Same'}} response</span></div>
  <div class="input-differences"><div v-for="change in difference.inputs" :key="change.key"><strong>{{change.label}}</strong><div><del v-if="inlineChange(change.before,change.after).removed">{{inlineChange(change.before,change.after).removed}}</del><code>{{inlineChange(change.before,change.after).prefix}}<mark>{{inlineChange(change.before,change.after).added}}</mark>{{inlineChange(change.before,change.after).suffix}}</code><small>{{short(change.before)}} → {{short(change.after)}}</small></div></div></div>
  <div class="response-comparison"><div><span class="eyebrow">{{compareId==='baseline'?baselineLabel.toUpperCase():'REFERENCE REQUEST'}}</span><p>{{reference.result.output}}</p></div><div :class="{'has-difference':difference.observation}"><span class="eyebrow">CURRENT RESULT · {{difference.observation?'CHANGED':'SAME RESPONSE'}}</span><p>{{snapshot.result.output}}</p></div></div>
  <details class="trace-difference" :open="difference.interpretation&&!difference.observation"><summary>Interpretation difference</summary><p v-if="!difference.interpretation&&onlyChanged">The interpretation is unchanged.</p><div v-for="(row,i) in rows('trace')" :key="i" class="diff-line" :class="row.kind"><span>{{row.kind==='added'?'+':row.kind==='removed'?'−':' '}}</span><code>{{row.text||' '}}</code></div></details>
  </template>
 </div>
 <div v-else class="lens-raw"><p v-if="!snapshot" class="lens-empty">Send a request to inspect its evidence.</p><template v-else><span class="eyebrow">REPORTED MODEL TRACE</span><pre>{{snapshot.result.trace}}</pre><details><summary>Raw response</summary><pre>{{snapshot.result.output}}</pre></details></template></div>
</section>
</template>
