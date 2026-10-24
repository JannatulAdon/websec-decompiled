<script setup>
import {computed,ref,nextTick,onUnmounted} from 'vue'
import {PICTURE_URL,PRIVATE_URL,PRIVATE_CODE,executeImport,directBrowserCheck} from './ssrf-runtime.js'
import {PREVIEW_URL,REPORT_URL,executePreview} from './ssrf-transfer.js'
import SsrfWorkbench from './SsrfWorkbench.vue'

const chapter=ref(0),night=ref(false),exploring=ref(false),busy=ref(false),error=ref('')
const normal=ref(null),direct=ref(null),internal=ref(null),addressReady=ref(false),photo=ref('')
const answer=ref(''),checkedAnswer=ref(''),change=ref(''),transfer=ref(null),testedChange=ref('')
const evidence=ref(''),checkedEvidence=ref(''),finished=ref(false),recall=ref(false)
let generation=0
const chapters=['Normal use','Change the destination','Explain the result','Try another app']
const headings=['Import a photo into Studio.','Use the server’s access.','Why did the private data reach you?','Try the same idea in another app.']
const explanations={
 browser:'Your browser still could not reach the staff address. It contacted Studio; Studio’s server made the request to the staff service.',
 server:'Yes. You supplied the destination, Studio’s server requested it from its own network, and Studio returned the staff page’s data to you.',
 image:'The image preview failed, but the response already contained the staff page. Rejecting the display did not stop the server from fetching or returning it.'
}
const evidenceFeedback={
 field:'An editable URL is a place to investigate, not proof. The feature might load it only in your browser, or restrict where its server can connect.',
 request:'Yes. Reader’s server requested the internal address and returned its contents. The request’s origin and destination establish the mechanism; the body shows this example’s impact.',
 error:'An error alone does not identify who made a request or where it went. Use the server request and returned content as evidence.'
}
const draft=computed(()=>addressReady.value?PRIVATE_URL:PICTURE_URL)
const transferDraft=computed(()=>({url:change.value==='url'?REPORT_URL:PREVIEW_URL,title:change.value==='title'?REPORT_URL:'Documentation',accent:change.value==='accent'?'green':'blue'}))
const transferGET=computed(()=>transfer.value?.events.find(event=>event.type==='server-request')?.request)
const transferSucceeded=computed(()=>transferGET.value?.url===REPORT_URL&&transfer.value?.returned.status===200)
const transferDirty=computed(()=>transfer.value&&testedChange.value!==change.value)
const normalGET=computed(()=>normal.value?.events.find(event=>event.type==='server-request')?.request)
const normalPath=computed(()=>normal.value?new URL(normal.value.client.url).pathname:'')
const internalGET=computed(()=>internal.value?.events.find(event=>event.type==='server-request')?.request)
const resultTitle=computed(()=>finished.value?'You have seen the core of SSRF.':headings[chapter.value])

async function focus(selector){
 await nextTick()
 const element=document.querySelector(selector)
 if(!element)return
 element.focus({preventScroll:true})
 const rect=element.getBoundingClientRect()
 if(rect.top<70||rect.bottom>window.innerHeight-60)element.scrollIntoView({block:'start',behavior:'instant'})
}
async function go(next){chapter.value=next;await nextTick();document.querySelector('.sl-heading')?.scrollIntoView({block:'start',behavior:'instant'});await focus('.sl-heading')}
async function perform(action,target){
 if(busy.value)return
 const token=++generation;busy.value=true;error.value=''
 try{const result=await action();if(token!==generation)return;target(result)}
 catch{if(token===generation)error.value='This local exercise could not finish. Please try the action again.'}
 finally{if(token===generation)busy.value=false}
}
async function importPhoto(){await perform(()=>executeImport({url:PICTURE_URL}),result=>{normal.value=result;if(photo.value)URL.revokeObjectURL(photo.value);photo.value=URL.createObjectURL(new Blob([result.returned.body],{type:result.returned.headers['content-type']}))});if(normal.value)await focus('#normal-result')}
async function openStaff(){await perform(()=>directBrowserCheck(PRIVATE_URL),result=>direct.value=result);if(direct.value)await focus('#direct-result')}
async function useStaff(){addressReady.value=true;await focus('#changed-field')}
async function importStaff(){await perform(()=>executeImport({url:PRIVATE_URL}),result=>internal.value=result);if(internal.value)await focus('#internal-result')}
async function checkAnswer(){checkedAnswer.value=answer.value;await focus('#causal-feedback')}
async function runPreview(){
 const values={...transferDraft.value},chosen=change.value
 await perform(()=>executePreview(values),result=>{transfer.value=result;testedChange.value=chosen;checkedEvidence.value='';evidence.value=''})
 if(transfer.value)await focus('#transfer-result')
}
async function checkEvidence(){checkedEvidence.value=evidence.value;await focus('#evidence-feedback')}
async function finish(){finished.value=true;await focus('.sl-heading')}
async function explore(){exploring.value=true;await nextTick();window.scrollTo(0,0)}
async function returnToLesson(){exploring.value=false;await nextTick();await focus('.sl-heading')}
onUnmounted(()=>{generation++;if(photo.value)URL.revokeObjectURL(photo.value)})
</script>

<template>
<SsrfWorkbench v-if="exploring" @back="returnToLesson"/>
<div v-else class="ssrf-lesson" :class="{'sl-night':night}">
 <header class="sl-header"><a href="#/" class="sl-brand">websec<span> / learn by examining</span></a><button class="sl-theme" :aria-label="night?'Use light appearance':'Use dark appearance'" @click="night=!night">{{night?'Light':'Dark'}} <span aria-hidden="true">◐</span></button></header>
 <div class="sl-wrap">
  <div class="sl-course"><span>SERVER-SIDE REQUEST FORGERY</span><span>{{finished?'Core lesson':`${chapter+1} of 4`}}</span></div>
  <ol class="sl-progress" aria-label="Lesson sections"><li v-for="(name,index) in chapters" :key="name" :class="{active:index===chapter,passed:index<chapter||finished}" :aria-current="!finished&&index===chapter?'step':undefined"><span>{{index+1}}</span><b>{{name}}</b></li></ol>
  <h1 class="sl-heading" tabindex="-1">{{resultTitle}}</h1>

  <template v-if="!finished&&chapter===0">
   <p class="sl-intro">Studio is a website that imports photos from a web address. <strong>Its server downloads the photo and sends it back to your browser.</strong></p>
   <p class="sl-goal">You’ll use this feature to retrieve a staff-only page that your browser cannot reach. First, see a normal import.</p>
   <div class="sl-workspace" :class="{'has-result':normal}">
    <section class="sl-app" aria-labelledby="studio-title">
     <div class="sl-app-bar"><span class="sl-app-logo" aria-hidden="true">S</span><div><h2 id="studio-title">Studio</h2><span>Photo library / Import from URL</span></div></div>
     <form class="sl-form" @submit.prevent="importPhoto">
      <label for="normal-url">Photo URL</label><input id="normal-url" :value="PICTURE_URL" readonly aria-describedby="normal-note"/>
      <p id="normal-note" class="sl-field-help">A public photo address is filled in for you.</p>
      <button v-if="!normal" class="sl-primary" :disabled="busy" type="submit">{{busy?'Importing…':'Import photo'}} <span aria-hidden="true">→</span></button>
     </form>
     <div v-if="normal" class="sl-photo-result"><img :src="photo" alt="Landscape photo returned by Studio’s importer"/><span>Photo imported · {{normal.returned.status}} OK</span></div>
     <div v-else class="sl-app-purpose"><strong>What the server does</strong><p>It runs Studio’s import code on the website’s computer. Your browser supplies the address; that computer retrieves the file.</p></div>
    </section>
    <section v-if="normal" id="normal-result" class="sl-evidence" tabindex="-1" aria-label="Normal import result">
     <span class="sl-eyebrow">WHAT JUST HAPPENED</span><h2>Two requests. Two different jobs.</h2>
     <div class="sl-record"><span>Your browser → Studio</span><code><b>{{normal.client.method}}</b> {{normalPath}}</code><p>Sends the photo address to the importer.</p><code class="sl-value">{{JSON.parse(normal.client.body).url}}</code></div>
     <div class="sl-record sl-emphasis"><span>Studio’s server → photo website</span><code><b>{{normalGET.method}}</b> {{normalGET.url}}</code><p>Downloads the photo. <strong>This is the request whose destination you will change.</strong></p></div>
     <p class="sl-takeaway">The image appears because Studio returns what its server downloaded.</p>
     <button class="sl-primary" @click="go(1)">Now try a staff-only address <span aria-hidden="true">→</span></button>
    </section>
   </div>
  </template>

  <template v-if="!finished&&chapter===1">
   <p class="sl-intro">The staff page is on Studio’s internal network. In this example, <strong>Studio’s server can reach it; your browser cannot.</strong> The page relies on being internal and requires no additional login.</p>
   <div class="sl-workspace sl-boundary" :class="{'has-result':internal}">
    <section v-if="!addressReady" class="sl-app sl-browser" aria-labelledby="browser-title">
     <div class="sl-app-bar"><div><h2 id="browser-title">Your browser</h2><span>Try the staff address directly</span></div></div>
     <div class="sl-form"><label for="staff-address">Address</label><input id="staff-address" :value="PRIVATE_URL" readonly/><button v-if="!direct" class="sl-primary" :disabled="busy" @click="openStaff">{{busy?'Opening…':'Open the staff address'}} <span aria-hidden="true">→</span></button></div>
     <div v-if="direct" id="direct-result" class="sl-direct-result" tabindex="-1"><span class="sl-error-label">NETWORK UNREACHABLE</span><h2>This browser cannot connect.</h2><p>No HTTP response was received. The address exists inside the server’s network, outside this browser’s reach.</p><p><strong>You still control the photo URL sent to Studio.</strong> Put this same staff address into that field next.</p><button class="sl-primary" @click="useStaff">Use this address in Studio <span aria-hidden="true">→</span></button></div>
    </section>
    <section v-else class="sl-app" aria-labelledby="changed-title">
     <div class="sl-app-bar"><span class="sl-app-logo" aria-hidden="true">S</span><div><h2 id="changed-title">Studio</h2><span>Photo library / Import from URL</span></div></div>
     <form class="sl-form" @submit.prevent="importStaff">
      <div id="changed-field" tabindex="-1"><span class="sl-eyebrow">ONE CHANGE: THE DESTINATION</span><div class="sl-before"><span>Before</span><code>{{PICTURE_URL}}</code></div><label for="changed-url">Photo URL · changed</label><input id="changed-url" :value="draft" readonly class="sl-changed"/><p class="sl-field-help">Same import feature. Now you are asking it to retrieve the staff page.</p></div>
      <button v-if="!internal" class="sl-primary" :disabled="busy" type="submit">{{busy?'Importing…':'Import this URL'}} <span aria-hidden="true">→</span></button>
     </form>
     <div v-if="internal" class="sl-nonimage"><span class="sl-error-label">PHOTO PREVIEW</span><strong>Cannot display this as an image.</strong><p>Studio received text. Read the returned data in the response.</p></div>
     <div class="sl-browser-reminder"><span>Direct browser attempt</span><strong>Network unreachable</strong></div>
    </section>
    <section v-if="internal" id="internal-result" class="sl-evidence" tabindex="-1" aria-label="Internal import result">
     <span class="sl-eyebrow">THE SERVER RETURNED THE STAFF PAGE</span><h2>The data reached your browser.</h2>
     <div class="sl-record"><span>Studio’s server requested</span><code><b>{{internalGET.method}}</b> <mark>{{internalGET.url}}</mark></code></div>
     <div class="sl-response"><span>Response to your browser · {{internal.returned.status}} OK</span><pre>{{internal.returned.body}}</pre><p>This demo text came from the staff page, not the public photo.</p></div>
     <p class="sl-takeaway"><strong>You chose the address. The server fetched it using its access. Its response gave you the contents.</strong></p>
     <p class="sl-definition">That is <strong>server-side request forgery (SSRF)</strong>: using application input to make its server request an unintended destination. Here, it exposed internal data.</p>
     <button class="sl-primary" @click="go(2)">Check why this worked <span aria-hidden="true">→</span></button>
    </section>
   </div>
  </template>

  <template v-if="!finished&&chapter===2">
   <p class="sl-intro">The direct browser attempt failed. The import returned <code>{{PRIVATE_CODE}}</code>. Explain the difference before trying another application.</p>
   <section class="sl-check" aria-label="Explain the SSRF mechanism">
    <form @submit.prevent="checkAnswer"><fieldset><legend>What made the staff page reachable through Studio?</legend>
     <label class="sl-option"><input type="radio" name="cause" value="browser" v-model="answer" @change="checkedAnswer=''"/><span>The photo field gave my browser access to the internal network.</span></label>
     <label class="sl-option"><input type="radio" name="cause" value="server" v-model="answer" @change="checkedAnswer=''"/><span>Studio’s server made the request from its own network, using the address I supplied.</span></label>
     <label class="sl-option"><input type="radio" name="cause" value="image" v-model="answer" @change="checkedAnswer=''"/><span>The image error bypassed the staff page’s protection.</span></label>
    </fieldset><button v-if="checkedAnswer!=='server'" class="sl-primary" :disabled="!answer" type="submit">Check explanation <span aria-hidden="true">→</span></button></form>
    <div v-if="checkedAnswer" id="causal-feedback" class="sl-feedback" :class="{'sl-retry':checkedAnswer!=='server'}" tabindex="-1" role="status"><strong>{{checkedAnswer==='server'?'That explains the difference.':'Follow who made the request.'}}</strong><p>{{explanations[checkedAnswer]}}</p><button v-if="checkedAnswer==='server'" class="sl-primary" @click="go(3)">Try it in a different application <span aria-hidden="true">→</span></button></div>
   </section>
   <details class="sl-review"><summary>Review the two attempts</summary><dl><div><dt>Your browser → staff page</dt><dd>No connection. No response.</dd></div><div><dt>Your browser → Studio → staff page</dt><dd>Studio’s server connected and returned {{PRIVATE_CODE}}.</dd></div></dl></details>
  </template>

  <template v-if="!finished&&chapter===3">
   <p class="sl-intro"><strong>Reader</strong> makes previews of web pages. Its server downloads the URL you submit. Test whether it will retrieve an internal report at <code>{{REPORT_URL}}</code>.</p>
   <section class="sl-transfer" aria-label="Reader link preview exercise" :aria-busy="busy">
    <div class="sl-app-bar"><span class="sl-app-logo sl-reader-logo" aria-hidden="true">R</span><div><h2>Reader</h2><span>Create a link preview</span></div><span class="sl-practice-tag">Your turn</span></div>
    <div class="sl-transfer-grid">
     <form v-if="!transferSucceeded" class="sl-form" @submit.prevent="runPreview">
      <fieldset><legend>Choose one change to test.</legend>
       <label class="sl-option"><input type="radio" name="change" value="title" v-model="change" :disabled="busy"/><span>Put the report address in the display title.</span></label>
       <label class="sl-option"><input type="radio" name="change" value="url" v-model="change" :disabled="busy"/><span>Replace the page URL with the report address.</span></label>
       <label class="sl-option"><input type="radio" name="change" value="accent" v-model="change" :disabled="busy"/><span>Change the preview colour to green.</span></label>
      </fieldset>
      <div class="sl-payload" aria-label="Preview form values"><span>Values this form will submit <b v-if="transferDirty">· not sent yet</b></span><dl><div :class="{changed:change==='url'}"><dt>Page URL</dt><dd>{{transferDraft.url}}</dd></div><div :class="{changed:change==='title'}"><dt>Display title</dt><dd>{{transferDraft.title}}</dd></div><div :class="{changed:change==='accent'}"><dt>Colour</dt><dd>{{transferDraft.accent}}</dd></div></dl></div>
      <button class="sl-primary" type="submit" :disabled="!change||busy">{{busy?'Loading…':'Run preview'}} <span aria-hidden="true">→</span></button>
     </form>
     <div v-else class="sl-form sl-submitted"><span class="sl-eyebrow">YOUR SUBMITTED CHANGE</span><h2>You changed the page URL.</h2><div class="sl-before"><span>Original destination</span><code>{{PREVIEW_URL}}</code></div><div class="sl-record"><span>Submitted destination</span><code>{{JSON.parse(transfer.client.body).url}}</code></div><p>The result is ready. Use the server request and response to explain what you found.</p></div>
     <section v-if="transfer" id="transfer-result" class="sl-evidence" tabindex="-1" aria-label="Reader preview result">
      <span class="sl-eyebrow">{{transferDirty?'LAST SUBMISSION · FORM HAS UNSENT CHANGES':'OBSERVED RESULT'}}</span>
      <div class="sl-record"><span>Reader’s server requested</span><code><b>{{transferGET?.method}}</b> {{transferGET?.url}}</code></div>
      <div class="sl-response"><span>Response body · {{transfer.returned.status}}</span><pre>{{transfer.returned.body}}</pre></div>
      <p v-if="!transferSucceeded" class="sl-transfer-feedback">{{testedChange==='title'?'The title changed, but the server still fetched the public documentation. A URL written in a label does not become a request destination.':'The colour changed, but the server still fetched the public documentation. Display settings do not control its destination.'}} Choose another change and compare the outgoing request.</p>
      <template v-else>
       <form class="sl-evidence-check" @submit.prevent="checkEvidence"><fieldset><legend>What evidence establishes SSRF here?</legend>
        <label class="sl-option"><input type="radio" name="evidence" value="field" v-model="evidence" @change="checkedEvidence=''"/><span>The form has a field that accepts a URL.</span></label>
        <label class="sl-option"><input type="radio" name="evidence" value="request" v-model="evidence" @change="checkedEvidence=''"/><span>The server requested the unintended internal address and returned the report.</span></label>
        <label class="sl-option"><input type="radio" name="evidence" value="error" v-model="evidence" @change="checkedEvidence=''"/><span>A preview tool can sometimes show an error.</span></label>
       </fieldset><button v-if="checkedEvidence!=='request'" class="sl-primary" type="submit" :disabled="!evidence">Check evidence <span aria-hidden="true">→</span></button></form>
       <div v-if="checkedEvidence" id="evidence-feedback" class="sl-feedback" :class="{'sl-retry':checkedEvidence!=='request'}" tabindex="-1" role="status"><p>{{evidenceFeedback[checkedEvidence]}}</p><button v-if="checkedEvidence==='request'" class="sl-primary" @click="finish">Finish this lesson <span aria-hidden="true">→</span></button></div>
      </template>
     </section>
    </div>
   </section>
  </template>

  <template v-if="finished">
   <p class="sl-intro">You used two different features to change a server’s request destination. The important question is <strong>who makes the request, and how your input controls where it goes.</strong></p>
   <section class="sl-finish">
    <h2>What to carry into a new challenge</h2>
    <ol><li><strong>Find a feature that fetches something.</strong><span>Importers, link previews, and other server-side integrations are candidates.</span></li><li><strong>Identify the input that controls its request.</strong><span>A URL field is a clue. Confirm that the server actually uses it.</span></li><li><strong>Compare the destination and the result.</strong><span>In these examples, an unintended internal request returned data. SSRF can also exist without returning the fetched content.</span></li></ol>
    <p class="sl-scope">This was the core mechanism. Redirects, destination filters, localhost, and evidence when no body returns are separate SSRF lessons—not prerequisites you were expected to guess here.</p>
    <button class="sl-primary" @click="explore">Open the request workbench <span aria-hidden="true">→</span></button><p class="sl-field-help">Optional: edit URLs, inspect the executed code, pause a fetch, or test a destination rule.</p>
   </section>
   <details class="sl-review"><summary>One-minute recall for your next visit</summary><p>Without looking above: which computer makes the unintended request? What input controls it? Does an empty response prove there is no SSRF?</p><button class="sl-text-button" @click="recall=!recall">{{recall?'Hide explanation':'Show explanation'}}</button><p v-if="recall">The application’s server makes it. User-controlled input supplies or influences the destination. An empty response does not rule it out: the request may still happen without its response being returned.</p></details>
  </template>

  <p v-if="error" class="sl-error" role="alert">{{error}}</p>
  <footer class="sl-footer"><button v-if="chapter>0||finished" class="sl-text-button" @click="finished? (finished=false,go(2)):go(chapter-1)">{{finished?'Review the explanation':'← Previous section'}}</button><span>Local exercise · no typing required</span></footer>
  <details class="sl-environment"><summary>How this exercise runs</summary><p>The forms and JavaScript handlers execute in your browser using Request and Response objects. Destination content and network reachability are fixed local examples; no hostname shown here is contacted. The workbench exposes the actual handler source. These examples do not mark any Academy lab solved.</p><p>Real internal services may also require authentication. Preventing SSRF involves validating destinations, resolved addresses and redirects, and restricting network access—not just checking whether a response looks like an image.</p><a href="https://portswigger.net/web-security/ssrf" target="_blank" rel="noopener noreferrer">PortSwigger: SSRF reference ↗</a><a href="https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html" target="_blank" rel="noopener noreferrer">OWASP: prevention guidance ↗</a></details>
 </div>
</div>
</template>
<style src="./ssrf-lesson.css"></style>
