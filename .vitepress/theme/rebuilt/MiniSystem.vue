<script setup>
import { computed,ref,watch } from 'vue'
import { experimentFor } from './experiments/index.js'
const props=defineProps({moduleId:String,lessonIndex:{type:Number,default:0}})
const emit=defineEmits(['explored'])
let seen=new Set(),boundarySeen=false
const config=computed(()=>experimentFor(props.moduleId,props.lessonIndex))
const values=ref({}),safe=ref(false),output=ref(null)
const hasBoundary=computed(()=>{try{return JSON.stringify(config.value.run(config.value.probe,false))!==JSON.stringify(config.value.run(config.value.probe,true))}catch{return true}})
function reset(){values.value={...config.value.control};safe.value=false;output.value=null;seen=new Set();boundarySeen=false}
function run(){try{output.value=config.value.run(values.value,safe.value);seen.add(JSON.stringify([values.value,safe.value]));if(safe.value)boundarySeen=true;if(seen.size>=2&&(!hasBoundary.value||boundarySeen))emit('explored')}catch(e){output.value={trace:'Input rejected by this local model.',output:e.message,explanation:'The input must match the small grammar described above. A model error makes no claim about a live target.'}}}
function preset(which){values.value={...config.value[which]};run()}
watch(()=>[props.moduleId,props.lessonIndex],reset,{immediate:true})
</script>
<template><section v-if="config" class="mini-system"><div class="eyebrow">EDITABLE LESSON EXPERIMENT</div><h3>{{config.title}}</h3><p class="model-scope">{{config.scope}}</p><div class="preset-list"><button class="button" @click="preset('control')">Load control</button><button class="button" @click="preset('probe')">Load boundary probe</button><label v-if="hasBoundary" class="safe-toggle"><input v-model="safe" type="checkbox" @change="run"> Enforce the boundary</label></div><form @submit.prevent="run"><div v-for="field in config.fields" :key="field.key" class="model-field"><label :for="'model-'+field.key">{{field.label}}</label><textarea :id="'model-'+field.key" v-model="values[field.key]" :rows="config.fields.length===1?3:2" maxlength="3000" spellcheck="false"></textarea></div><button class="button primary" type="submit">Run your experiment →</button></form><div v-if="output" aria-live="polite"><div class="evidence-window"><div class="window-bar">INTERPRETATION / SERVER OR BROWSER DECISION</div><pre>{{output.trace}}</pre></div><div class="evidence-window"><div class="window-bar">OBSERVATION</div><pre>{{output.output}}</pre></div><div class="takeaway"><span>WHAT THIS DEMONSTRATES</span><p>{{output.explanation}}</p></div></div><p v-else class="fine-print">Run a control first, then change one field. Predict the result before applying the boundary.</p></section></template>
