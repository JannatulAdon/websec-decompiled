<script setup>
import {computed,ref,watch,nextTick} from 'vue'
import {experimentFor} from './experiments/index.js'
import {topicTeaching,lessonQuestion,coachingFor} from './teaching.js'
import ModelScene from './ModelScene.vue'
import PlainText from './PlainText.vue'
const props=defineProps({module:Object,lessonIndex:Number})
const emit=defineEmits(['observed','explored','continue','explore'])
const topic=computed(()=>topicTeaching[props.module.id])
const lesson=computed(()=>props.module.lessons[props.lessonIndex])
const config=computed(()=>experimentFor(props.module.id,props.lessonIndex))
const question=computed(()=>lessonQuestion(props.module.id,props.lessonIndex))
const coaching=computed(()=>coachingFor(props.module.id,props.lessonIndex,lesson.value))
const moment=ref(0),snapshots=ref([]),display=ref(0),fixed=ref(null),definitionOpen=ref(false)
const baseline=computed(()=>snapshots.value[0])
const current=computed(()=>snapshots.value[display.value])
const changeFields=computed(()=>config.value.fields.filter(f=>String(config.value.control[f.key])!==String(config.value.probe[f.key])))
const hasRule=computed(()=>JSON.stringify(config.value.run(config.value.probe,false))!==JSON.stringify(config.value.run(config.value.probe,true)))
const sameOutput=computed(()=>snapshots.value.length>1&&snapshots.value[0].result.output===snapshots.value[1].result.output)
function publish(){emit('observed',{snapshot:current.value,baseline:baseline.value,history:[...snapshots.value].reverse(),fields:config.value.fields})}
async function focus(){await nextTick();const el=moment.value===0?document.querySelector('.guided-lesson'):document.querySelector('.guided-lesson .journey-focus');el?.focus({preventScroll:true});el?.scrollIntoView({block:'start',behavior:'instant'})}
function run(which){const values={...config.value[which]};const item={id:which==='control'?1:2,values,safe:false,label:which==='control'?'Starting example':'Changed example',result:config.value.run(values,false)};if(which==='control'){snapshots.value=[item];display.value=0;moment.value=1}else{snapshots.value=[snapshots.value[0],item];display.value=1;moment.value=2;emit('explored')}publish();focus()}
function revisit(index){display.value=index;publish()}
function testRule(){const values={...config.value.probe};fixed.value={id:3,values,safe:true,result:config.value.run(values,true)}}
function reset(){moment.value=0;snapshots.value=[];display.value=0;fixed.value=null;definitionOpen.value=false;publish()}
watch(()=>[props.module.id,props.lessonIndex],reset)
const shown=value=>String(value)===''?'(absent)':String(value)
</script>
<template>
<section class="guided-lesson" tabindex="-1" :data-moment="moment" :data-lesson="lesson.id">
 <template v-if="moment===0">
  <div class="topic-entry" v-if="lessonIndex===0"><span class="eyebrow">THE IDEA IN PLAIN ENGLISH</span><h2>{{topic.headline}}</h2><p><PlainText :text="topic.definition"/></p><p class="topic-purpose"><strong>Why learn this?</strong> {{topic.why}}</p></div>
  <details v-else class="topic-reminder"><summary>New to {{module.title}}? Start with the idea.</summary><p><PlainText :text="topic.definition"/></p><p>{{topic.why}}</p><a :href="'#/learn/'+module.id+'/0'">Return to the first lesson →</a></details>
  <div class="journey-entry">
   <div class="journey-entry-copy"><span class="eyebrow">YOUR QUESTION · {{lesson.title}}</span><h3>{{question}}</h3><p><strong>{{topic.app}}</strong> is our fictional setting. {{topic.setting}}</p></div>
   <div class="journey-start"><span class="journey-start-icon" aria-hidden="true">01 <i>→</i></span><strong>First, see the starting example.</strong><p>One click runs it. Then we’ll change the input and compare what happens. No typing needed.</p><button class="button primary journey-begin" @click="run('control')">Run the starting example <span>→</span></button></div>
  </div>
  <details class="journey-before"><summary>See the values we will start with</summary><dl><div v-for="field in config.fields" :key="field.key"><dt>{{field.label}}</dt><dd><code>{{shown(config.control[field.key])}}</code></dd></div></dl></details>
 </template>
 <template v-else>
  <div class="journey-focus" tabindex="-1"><span class="eyebrow">{{moment===1?'1 / OBSERVE':'2 / CONNECT THE CHANGE TO ITS EFFECT'}}</span><h2>{{question}}</h2></div>
  <div class="journey-grid">
   <section class="journey-app" aria-label="Example and result">
    <div class="journey-app-bar"><span class="journey-window-dots" aria-hidden="true">● ● ●</span><strong>{{topic.app}}</strong><small>fictional model</small></div>
    <div v-if="moment===2" class="journey-comparison-tabs" role="group" aria-label="Compare the two examples"><button :aria-pressed="display===0" @click="revisit(0)">Before · starting values</button><button :aria-pressed="display===1" @click="revisit(1)">After · changed values</button></div>
    <div class="journey-inputs"><span class="eyebrow">{{display===0?'STARTING INPUT':'CHANGED INPUT'}}</span><dl><div v-for="field in config.fields" :key="field.key" :class="{'input-did-change':display===1&&changeFields.some(f=>f.key===field.key)}"><dt>{{field.label.replace(/\s*\(.*/, '')}}</dt><dd><code>{{shown(current.values[field.key])}}</code><span v-if="display===1&&changeFields.some(f=>f.key===field.key)" class="journey-changed-tag">changed</span></dd></div></dl></div>
    <div class="journey-result" role="status"><span class="eyebrow">WHAT HAPPENED</span><p>{{current.result.output}}</p></div>
    <div class="journey-visual"><span class="eyebrow">SEE HOW IT HAPPENED</span><ModelScene :snapshot="current" :reference="display===1?baseline:null"/></div>
   </section>
   <aside class="journey-coach" aria-label="Explanation and next action">
    <template v-if="moment===1"><span class="eyebrow">YOU JUST RAN THE STARTING EXAMPLE</span><h3>Keep this result to compare.</h3><p><PlainText :text="coaching.before"/></p><div class="journey-task"><span class="eyebrow">NEXT · CHANGE THESE VALUES</span><div v-for="field in changeFields" :key="field.key" class="journey-change"><strong>{{field.label.replace(/\s*\(.*/, '')}}</strong><code>{{shown(config.control[field.key])}}</code><span aria-hidden="true">↓</span><code>{{shown(config.probe[field.key])}}</code></div><p v-if="!changeFields.length">Repeat the starting values and compare the reported behavior.</p></div><button class="button primary journey-mutate" @click="run('probe')">Try the changed values →</button><p class="journey-small">The highlighted values are the changes. Everything else stays the same.</p></template>
    <template v-else><span class="eyebrow">WHY THE CHANGE MATTERS</span><h3>{{sameOutput?'Same reply. Check what happened inside.':'Connect the input to the result.'}}</h3><p><PlainText :text="coaching.after"/></p><div class="journey-result-pair"><div><span>Before</span><p>{{baseline.result.output}}</p></div><div><span>After</span><p>{{snapshots[1].result.output}}</p></div></div><p v-if="sameOutput" class="journey-small">A matching reply alone does not prove identical processing. Switch Before / After and compare the reported steps.</p><details v-if="lessonIndex===0" class="journey-reason"><summary>Explain the general rule</summary><p><PlainText :text="lesson.mechanism"/></p></details><details class="journey-reason"><summary>What does this example not prove?</summary><p><PlainText :text="lesson.limit"/></p></details><button class="button primary journey-check" @click="emit('continue')">Check my understanding →</button><p class="journey-small">Next, choose the evidence and explain it. Clicking through an example does not mark a lesson complete.</p></template>
   </aside>
  </div>
  <details v-if="moment===2&&hasRule" class="journey-extra"><summary>Optional · try the model’s enforced rule</summary><p>Keep the changed input and enable the rule modeled by this exercise. Compare its actual result below.</p><button class="button" @click="testRule">Apply rule to the same input</button><template v-if="fixed"><div class="journey-fixed" role="status"><strong>{{fixed.result.output}}</strong><p>{{fixed.result.explanation}}</p></div><ModelScene :snapshot="fixed" :reference="snapshots[1]"/></template></details>
  <details class="journey-extra"><summary>Inspect the exact model trace</summary><pre>{{current.result.trace}}</pre><p>{{current.result.explanation}}</p><p>{{config.scope}}</p></details>
  <div class="journey-actions"><button class="quiet-button" @click="reset();focus()">Start this lesson again ↺</button><button class="quiet-button" @click="emit('explore')">Explore freely with more examples →</button></div>
 </template>
 <p class="journey-model-note">Everything here runs in this page using fictional data. Your real lab progress is separate.</p>
</section>
</template>
