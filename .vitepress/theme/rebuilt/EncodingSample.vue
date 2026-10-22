<script setup>
import {computed,nextTick,ref} from 'vue'
import {sampleSteps,photoRequest,unwrap,filenameJourney,readChoices} from './encoding-sample.js'
const screen=ref(0),night=ref(false),opened=ref(false),answer=ref(null),passes=ref(0),fixed=ref(false)
const photo=photoRequest('blue sky.png'),other=photoRequest('holiday photo.png')
const followup=computed(()=>filenameJourney('folder%252Fphoto.png',fixed.value))
const decoded=computed(()=>passes.value===0?'%252F':passes.value===1?unwrap('%252F'):unwrap(unwrap('%252F')))
const correct=computed(()=>answer.value!==null&&readChoices[answer.value].correct)
async function navigate(index){screen.value=index;await nextTick();const title=document.getElementById('sample-title');title?.focus({preventScroll:true});title?.scrollIntoView({block:'start'})}
async function openPhoto(){opened.value=true;await nextTick();if(window.matchMedia('(max-width: 620px)').matches)document.querySelector('.sample-request-flow')?.scrollIntoView({block:'center',behavior:'auto'})}
function restart(){opened.value=false;answer.value=null;passes.value=0;fixed.value=false;navigate(0)}
</script>
<template>
<div class="encoding-sample" :class="{'sample-night':night}">
 <header class="sample-header"><a href="#/learn/encoding/0" class="sample-brand"><span class="sample-mark" aria-hidden="true">w.</span><span>websec<span class="sample-brand-note">a learning workshop</span></span></a><div><span class="sample-edition">One-topic sample</span><button class="sample-appearance" :aria-label="night?'Use light appearance':'Use dark appearance'" @click="night=!night">{{night?'☀':'◐'}}</button></div></header>
 <div class="sample-wrap">
  <div class="sample-topline"><span>TOPIC 02 <i>/</i> URL encoding</span><button @click="restart">Start again ↺</button></div>
  <nav class="sample-progress" aria-label="Sample parts"><ol><li v-for="(name,index) in sampleSteps" :key="name"><button :aria-label="'Part '+(index+1)+': '+name" :aria-current="screen===index?'step':undefined" @click="navigate(index)">{{index+1}}</button><span>{{name}}</span></li></ol></nav>
  <section class="sample-lesson" :data-sample-step="screen">
   <div class="sample-copy">
    <span class="sample-kicker">{{screen===0?'ONE EXAMPLE':'ONE QUICK CHECK'}}</span>
    <h1 id="sample-title" tabindex="-1">{{screen===0?'Open a photo. Follow its name.':'Same website. Another photo.'}}</h1>
    <template v-if="screen===0">
     <p>You’re browsing <strong>Mira Photos</strong>, a fictional photo website. You want to open Blue Sky, stored on its server as <code>blue sky.png</code>.</p>
     <p>Clicking <strong>Open Blue Sky</strong> makes your browser ask Mira’s server for that photo. Watch how the filename travels in the URL—the web address used for the request.</p>
     <button class="sample-text-button sample-skip" @click="navigate(1)">Already know this? Try the quick check →</button>
    </template>
    <template v-else>
     <p>You click Mira’s other photo, <strong>Holiday Photo</strong>. Your browser sends the request shown here.</p>
     <p>After decoding the filename, <strong>which stored file should Mira open?</strong></p>
     <button class="sample-text-button sample-skip" @click="navigate(0)">← Revisit the example</button>
    </template>
   </div>
   <div class="sample-workbench">
    <section v-if="screen===0" class="sample-card">
     <div class="sample-card-heading"><span class="sample-dot"></span><h2>Mira Photos</h2><span class="sample-card-note">photos.example.test</span></div>
     <div class="sample-photo"><svg viewBox="0 0 400 125" role="img" aria-label="Blue Sky photo thumbnail"><rect width="400" height="125" fill="#b9ddf6"/><circle cx="316" cy="34" r="18" fill="#fff1b8"/><path d="M0 106 Q85 22 197 113 L260 125 H0" fill="#76a791"/><path d="M150 125 Q295 32 400 104 V125" fill="#4e8377"/><path d="M48 39h65m-42-9h62" stroke="#fff" stroke-width="9" stroke-linecap="round"/></svg><span><strong>Blue Sky</strong> · stored as <code>{{photo.name}}</code></span></div>
     <button v-if="!opened" class="sample-primary" @click="openPhoto">Open Blue Sky <span>→</span></button>
     <template v-else>
      <ol class="sample-request-flow" aria-label="How the filename travels">
       <li><span class="sample-flow-number">1</span><div><small>Your browser starts with the filename</small><code>blue<mark class="sample-space" aria-label="space">␣</mark>sky.png</code></div></li>
       <li><span class="sample-flow-number">2</span><div><small>Browser encodes it in a request to Mira</small><code>GET /photo?name=blue<mark>%20</mark>sky.png</code></div></li>
       <li><span class="sample-flow-number">3</span><div><small>Mira’s server decodes the name and opens</small><code>blue<mark class="sample-space" aria-label="space">␣</mark>sky.png</code></div></li>
      </ol>
      <div class="sample-feedback" role="status"><strong>Same filename, different spelling.</strong><p>The browser writes the space as <code>%20</code> because a space cannot appear literally in a URL. Mira’s server decodes it back to a space to find the photo.</p></div>
      <small class="sample-space-key">␣ marks a space so you can see it.</small>
     </template>
    </section>
    <section v-else class="sample-card">
     <div class="sample-card-heading"><span class="sample-dot"></span><h2>A request to Mira Photos</h2></div>
     <div class="sample-field"><span>Your browser asks for a photo</span><code>GET {{other.target}}</code></div>
     <h3 class="sample-question">Which filename does Mira read?</h3>
     <div class="sample-choices"><button v-for="(choice,index) in readChoices" :key="choice.text" :aria-pressed="answer===index" @click="answer=index"><span>{{String.fromCharCode(65+index)}}</span><code>{{choice.text}}</code></button></div>
     <div v-if="answer!==null" class="sample-feedback" :class="{'sample-retry':!correct}" role="status"><strong>{{correct?'That’s the core idea.':'Follow %20 again.'}}</strong><p>{{readChoices[answer].feedback}}</p><p v-if="correct" class="sample-core-done">You’ve finished this introduction. Other characters have codes too, such as <code>/ → %2F</code> and <code>% → %25</code>. You can look them up as needed.</p></div>
    </section>
   </div>
  </section>
  <footer class="sample-controls"><span class="sample-back">{{screen===0?'A request connects your browser to the website’s server.':'Two short parts. That’s the whole introduction.'}}</span><button v-if="screen===0" class="sample-primary" @click="navigate(1)">Try one example <span>→</span></button><button v-else class="sample-back" @click="navigate(0)">← Back to the photo</button></footer>
  <details v-if="screen===1" class="sample-followup">
   <summary>Optional next idea: two decoding passes</summary>
   <div class="sample-followup-content">
    <p>This is a separate idea for later: a percent sign can itself be encoded. In <code>%2F</code>, changing <code>%</code> to <code>%25</code> gives <code>%252F</code>.</p>
    <div class="sample-decode-strip"><span>{{passes===0?'Starting text':passes===1?'After one pass':'After two passes'}}</span><code>{{decoded}}</code><button class="sample-primary" @click="passes=passes<2?passes+1:0">{{passes<2?'Decode once':'Replay'}} <span>→</span></button></div>
    <p v-if="passes>0" role="status">{{passes===1?'%25 became %. That leaves %2F; it has not become a slash yet.':'The second pass turns %2F into /. One pass does not repeatedly decode its own output.'}}</p>
    <details class="sample-detail"><summary>Why might the order matter?</summary><p>Imagine a photo feature that accepts only a filename, so its rule forbids <code>/</code> (a folder separator). If one part decodes, checks the rule, then another part decodes again, the rule can approve a different spelling from the one eventually used.</p><div class="sample-order-example"><span>Input <code>{{followup.raw}}</code></span><span>After first reader <code>{{followup.first}}</code></span><span>After second reader <code>{{followup.final}}</code></span><strong>Rule checks <code>{{followup.checked}}</code>: {{followup.allowed?'allowed':'stopped'}}</strong></div><button class="sample-text-button" @click="fixed=!fixed">{{fixed?'Check before the second reader':'Move the check after the final reader'}} →</button><p>Here the final text is what needs checking. This example deliberately has two decoders; a real app may have only one. Double encoding alone does not bypass a rule.</p></details>
   </div>
  </details>
  <p class="sample-footnote">Mira Photos is a local teaching model. Opening the photo does not contact another website or change your lesson or lab records.</p>
 </div>
</div>
</template>
<style src="./encoding-sample.css"></style>
