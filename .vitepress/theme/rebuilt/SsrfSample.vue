<script setup>
import {computed,ref,watch,onUnmounted,nextTick} from 'vue'
import {PICTURE_URL,PRIVATE_URL,IMPORT_ENDPOINT,executeImport,directBrowserCheck} from './ssrf-runtime.js'
import handlerText from './ssrf-handler.js?raw'
const draft=ref(PICTURE_URL),picturesOnly=ref(false),night=ref(false),busy=ref(false),records=ref([]),snapshot=ref(null),previous=ref(null),direct=ref(null),checking=ref(false),view=ref('http'),pauseBeforeFetch=ref(false),paused=ref(false),imageURL=ref(''),sourceRequest=ref('current')
const controlsOpen=ref(false)
let generation=0,resumeExecution=null
const codeLines=handlerText.trimEnd().split('\n')
const submitted=computed(()=>records.value.find(e=>e.type==='browser-request')?.request)
const outgoing=computed(()=>records.value.find(e=>e.type==='server-request')?.request)
const upstream=computed(()=>records.value.find(e=>e.type==='server-response')?.response)
const returned=computed(()=>records.value.find(e=>e.type==='browser-response')?.response)
const dirty=computed(()=>Boolean(snapshot.value)&&(draft.value!==snapshot.value.url||picturesOnly.value!==snapshot.value.picturesOnly))
const draftDirty=computed(()=>Boolean(snapshot.value)&&draft.value!==snapshot.value.url)
const contentType=computed(()=>returned.value?.headers['content-type']||'')
const internalReturned=computed(()=>Boolean(snapshot.value)&&[PRIVATE_URL,'https://staff.intra.test/preview'].includes(snapshot.value.url)&&returned.value?.status===200)
const previewBody=computed(()=>JSON.stringify(draft.value))
const previousGET=computed(()=>previous.value?.events.find(e=>e.type==='server-request')?.request)
const sourceRecord=computed(()=>sourceRequest.value==='previous'&&previous.value?previous.value:snapshot.value)
const variables=computed(()=>({url:sourceRecord.value?.url??'(not submitted)',destination:sourceRecord.value?.events.find(e=>e.type==='server-request')?.request.url??(paused.value?outgoing.value?.url:'(not called)'),picturesOnly:sourceRecord.value?.picturesOnly??picturesOnly.value}))
const selectedLine=computed(()=>paused.value?'fetchUpstream(destination.href)':sourceRecord.value?.picturesOnly&&sourceRecord.value?.returned.status===403?"return new Response('Destination is not allowed.'":'fetchUpstream(destination.href)')
const task=computed(()=>!snapshot.value?'Import the public image first. Then change the URL and compare the outgoing request.':returned.value?.status===403?'The destination check stopped this import before any outgoing GET. Try the public image with the same rule.':internalReturned.value?'Inspect the outgoing GET and returned body. The server takes its destination from the POST body’s url field.':returned.value?.status===400?'Correct the URL, then submit again. The error below is the handler’s response.':'Next: select Internal URL, click Import again, and inspect which address the server requests.')
watch(returned,result=>{if(imageURL.value){URL.revokeObjectURL(imageURL.value);imageURL.value=''}if(result?.image&&result.status===200)imageURL.value=URL.createObjectURL(new Blob([result.body],{type:result.headers['content-type']}))})
function continueExecution(){const resume=resumeExecution;resumeExecution=null;paused.value=false;resume?.()}
async function runImport(){
 if(busy.value)return
 const run=++generation,url=draft.value,policy=picturesOnly.value
 checking.value=false
 previous.value=snapshot.value;records.value=[];snapshot.value=null;sourceRequest.value='current';busy.value=true
 try{
  const result=await executeImport({url,picturesOnly:policy,onEvent:event=>{if(run===generation)records.value.push(event)},checkpoint:async event=>{if(run===generation&&pauseBeforeFetch.value&&event.type==='server-request'){paused.value=true;view.value='code';const wait=new Promise(resolve=>resumeExecution=resolve);await nextTick();if(run===generation){const panel=document.querySelector('.sw-paused');panel?.scrollIntoView({block:'center'});panel?.querySelector('button')?.focus({preventScroll:true})}await wait}}})
  if(run===generation)snapshot.value=result
 }finally{if(run===generation){busy.value=false;paused.value=false}}
}
async function checkDirect(){const run=generation,url=draft.value;checking.value=true;try{const result=await directBrowserCheck(url);if(run===generation)direct.value={url,...result}}catch{if(run===generation)direct.value={url,error:'Invalid URL.',response:null}}finally{if(run===generation)checking.value=false}}
function reset(){generation++;continueExecution();busy.value=false;checking.value=false;controlsOpen.value=false;draft.value=PICTURE_URL;picturesOnly.value=false;pauseBeforeFetch.value=false;records.value=[];snapshot.value=null;previous.value=null;direct.value=null;view.value='http';sourceRequest.value='current'}
onUnmounted(()=>{generation++;continueExecution();if(imageURL.value)URL.revokeObjectURL(imageURL.value)})
async function inspectorKey(event){if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();view.value=event.key==='Home'?'http':event.key==='End'?'code':view.value==='http'?'code':'http';await nextTick();document.getElementById('sw-'+view.value+'-tab')?.focus()}
async function showResponse(){view.value='http';await nextTick();const panel=document.querySelector('.sw-browser-response');panel?.focus({preventScroll:true});panel?.scrollIntoView({block:'start'})}
function display(value){return value===''?'(empty body)':value}
</script>
<template>
<div class="encoding-sample ssrf-workbench" :class="{'sample-night':night}">
 <header class="sample-header"><a href="#/learn/ssrf/0" class="sample-brand"><span class="sample-mark" aria-hidden="true">w.</span><span>websec<span class="sample-brand-note">security workbench</span></span></a><div><a class="sw-back" href="#/learn/ssrf/0">SSRF lessons ↗</a><button class="sample-appearance" :aria-label="night?'Use light appearance':'Use dark appearance'" @click="night=!night">{{night?'☀':'◐'}}</button></div></header>
 <div class="sw-wrap">
  <div class="sw-topline"><span>SSRF / REQUESTS, HANDLER, RESPONSE</span><button @click="reset">Reset workbench ↺</button></div>
  <div class="sw-intro"><h1>Change the URL. Inspect the request.</h1><p><strong>SSRF</strong> happens when input you control makes an application’s server request an unintended address. Here, that input is the image URL.</p></div>
  <div class="sw-task" role="status"><span>{{busy?'EXECUTING':'NEXT'}}</span>{{paused?'Paused at the outgoing fetch. Inspect the URL in the handler, then continue.':busy?'The handler is processing this submission.':task}}</div>
  <div class="sw-workspace">
   <section class="sw-application" aria-labelledby="import-title">
    <div class="sw-panel-heading"><div><span class="sw-label">APPLICATION</span><h2 id="import-title">Image importer</h2></div><span class="sw-runtime">Local runtime</span></div>
    <form class="sw-form" @submit.prevent="runImport">
     <label for="ssrf-url">Image URL</label><input id="ssrf-url" v-model="draft" type="text" inputmode="url" autocomplete="off" spellcheck="false" maxlength="2000" :disabled="busy"/>
     <div class="sw-examples" role="group" aria-label="Example URLs"><button type="button" :disabled="busy" :aria-pressed="draft===PICTURE_URL" @click="draft=PICTURE_URL">Public image</button><button type="button" :disabled="busy" :aria-pressed="draft===PRIVATE_URL" @click="draft=PRIVATE_URL">Internal URL</button></div>
     <p class="sw-field-note">The internal URL is a staff page reachable from the server in this local environment.</p>
     <div class="sw-draft"><span>POST body <b>{{draftDirty?'UNSENT CHANGES':submitted?'matches this form':'not sent yet'}}</b></span><code>{"url": <mark>{{previewBody}}</mark>}</code></div>
     <div class="sw-submit-row"><button class="sample-primary" type="submit" :disabled="busy">{{busy?'Importing…':'Import'}} <span aria-hidden="true">→</span></button><button type="button" class="sw-direct" :disabled="busy||checking" @click="checkDirect">Test browser access</button></div>
    </form>
    <div v-if="direct" class="sw-direct-result" role="status"><span class="sw-label">DIRECT BROWSER CHECK</span><code>GET {{direct.url}}</code><p v-if="direct.error">{{direct.error}} <strong>No HTTP response was received.</strong></p><p v-else>HTTP {{direct.response.status}} · {{direct.response.headers['content-type']}}</p><small>This check does not use the importer or call its server handler.</small></div>
    <section class="sw-import-result" aria-label="Application result" :data-status="returned?.status||'pending'">
     <div class="sw-result-label"><span class="sw-label">{{dirty?'LAST SUBMISSION’S RESULT':'IMPORT RESULT'}}</span><span v-if="returned" class="sw-status">HTTP {{returned.status}}</span></div>
     <div v-if="!returned" class="sw-empty"><strong>{{busy?'Waiting for the handler…':'No import submitted.'}}</strong><p>{{paused?'The handler is paused at fetchUpstream(destination.href). Continue in the code inspector.':'Use the form above. The importer’s response will appear here.'}}</p></div>
     <img v-else-if="imageURL" :src="imageURL" class="sw-imported-image" alt="Image returned by the importer"/>
     <div v-else-if="returned.status===200" class="sw-nonimage"><strong>The response is not an image.</strong><p>Received <code>{{contentType}}</code>. Inspect the returned body in the HTTP panel.</p><button @click="showResponse">View the response body →</button></div>
     <pre v-else class="sw-error">{{returned.body}}</pre>
     <p v-if="internalReturned" class="sw-impact"><strong>The interface did not display an image, but the server already sent the internal page’s contents back.</strong> The data is visible in the response body.</p>
    </section>
    <details class="sw-controls" :open="controlsOpen" @toggle="controlsOpen=$event.target.open"><summary>Request controls</summary><label><input type="checkbox" v-model="picturesOnly" :disabled="busy"/> Allow only the public picture origin</label><label><input type="checkbox" v-model="pauseBeforeFetch" :disabled="busy"/> Pause before the outgoing fetch</label><p>Applied on the next import. These controls change the handler’s policy or pause its awaited fetch.</p></details>
   </section>
   <section class="sw-inspector" aria-labelledby="inspector-title">
    <div class="sw-panel-heading"><div><span class="sw-label">INSPECTOR</span><h2 id="inspector-title">What this submission does</h2></div><span v-if="busy" class="sw-runtime">{{paused?'Paused':'Running'}}</span></div>
    <div class="sw-tabs" role="tablist" aria-label="Request inspector" @keydown="inspectorKey"><button id="sw-http-tab" role="tab" :tabindex="view==='http'?0:-1" :aria-selected="view==='http'" aria-controls="sw-http-panel" @click="view='http'">HTTP exchange</button><button id="sw-code-tab" role="tab" :tabindex="view==='code'?0:-1" :aria-selected="view==='code'" aria-controls="sw-code-panel" @click="view='code'">Executed handler</button></div>
    <div v-show="view==='http'" id="sw-http-panel" role="tabpanel" aria-labelledby="sw-http-tab">
     <section class="sw-http-record sw-client-request"><div class="sw-record-label"><span>1 · BROWSER SUBMITS TO IMPORTER</span><span>{{submitted?'submitted':'waiting'}}</span></div><div class="sw-request-line"><b>POST</b><code>{{IMPORT_ENDPOINT}}</code></div><template v-if="submitted"><div class="sw-headers"><span v-for="(value,key) in submitted.headers" :key="key">{{key}}: {{value}}</span></div><pre>{{submitted.body}}</pre><small>The endpoint stays the same. The supplied destination is inside the JSON body.</small></template><p v-else class="sw-waiting">Submit the form to inspect its actual Request object.</p></section>
     <section class="sw-http-record sw-server-request"><div class="sw-record-label"><span>2 · SERVER REQUESTS THE SUPPLIED URL</span><span>{{paused?'paused before fetch':outgoing?'created':'no outgoing request'}}</span></div><template v-if="outgoing"><div class="sw-request-line"><b>GET</b><code><mark>{{outgoing.url}}</mark></code></div><div v-if="previousGET&&previousGET.url!==outgoing.url" class="sw-url-diff"><span>Previous GET</span><code>{{previousGET.url}}</code><span>Current GET</span><code>{{outgoing.url}}</code></div><small>This address is the argument passed to <code>fetchUpstream(destination.href)</code>.</small><div v-if="upstream" class="sw-upstream-status">Upstream returned HTTP {{upstream.status}} · {{upstream.headers['content-type']}}</div></template><p v-else class="sw-waiting">{{returned?.status===403?'The origin check returned 403 before fetchUpstream was called.':returned?.status===400?'The handler rejected the input before creating an outgoing request.':'The handler’s outgoing Request object will appear here.'}}</p></section>
     <section class="sw-http-record sw-browser-response" tabindex="-1"><div class="sw-record-label"><span>3 · HANDLER RETURNS TO BROWSER</span><span>{{returned?'received':'waiting'}}</span></div><template v-if="returned"><div class="sw-response-line"><b>{{returned.status}}</b><code>{{contentType}}</code></div><details class="sw-response-headers"><summary>Response headers</summary><div class="sw-headers"><span v-for="(value,key) in returned.headers" :key="key">{{key}}: {{value}}</span></div></details><span class="sw-body-label">RESPONSE BODY</span><pre :class="{'sw-private-body':internalReturned}">{{display(returned.body)}}</pre><p v-if="internalReturned" class="sw-record-takeaway">The internal service’s data reached this browser through the importer’s response. This is the impact of the unintended server request.</p></template><p v-else class="sw-waiting">{{paused?'No response yet. Execution is paused before the upstream fetch.':'The returned Response object will appear here after an import.'}}</p></section>
    </div>
    <div v-show="view==='code'" id="sw-code-panel" role="tabpanel" aria-labelledby="sw-code-tab">
     <div class="sw-source-top"><span>ssrf-handler.js</span><span>executed source</span></div><p class="sw-code-note">This is the source of the function used by the importer. The highlighted operation uses the submitted destination.</p>
     <div class="sw-source" aria-label="Executed JavaScript handler"><div v-for="(line,index) in codeLines" :key="index" :class="{'sw-code-highlight':line.includes(selectedLine)}"><span>{{index+1}}</span><code>{{line}}</code></div></div>
     <div class="sw-variables"><div class="sw-record-label"><span>{{paused?'PAUSED OPERATION’S VALUES':'SUBMISSION VALUES'}}</span><select v-if="previous&&snapshot" v-model="sourceRequest" aria-label="Submission to inspect"><option value="current">Current submission</option><option value="previous">Previous submission</option></select></div><dl><div><dt>url</dt><dd><code>{{paused?draft:variables.url}}</code></dd></div><div><dt>fetchUpstream argument</dt><dd><code>{{paused?outgoing?.url:variables.destination}}</code></dd></div><div><dt>picturesOnly</dt><dd><code>{{variables.picturesOnly}}</code></dd></div></dl></div>
     <div v-if="paused" class="sw-paused" role="status"><strong>Paused before the upstream response is read.</strong><p>The handler is waiting at its <code>await fetchUpstream(...)</code> call.</p><button class="sample-primary" @click="continueExecution">Continue execution →</button></div>
     <button v-else class="sw-show-http" @click="showResponse">Inspect the resulting HTTP exchange →</button>
    </div>
   </section>
  </div>
  <details class="sw-environment"><summary>Execution environment and limits</summary><p>The form creates real JavaScript <code>Request</code> objects. The displayed handler executes locally and returns real <code>Response</code> objects. Its upstream transport serves fixed image and staff-page fixtures; these hostnames are not contacted. The browser-access check represents the different reachability of those two environments.</p><p>The source’s optional origin check demonstrates this fixed fixture’s policy. Real SSRF defenses also need URL, resolved-address, redirect, and network controls.</p><a href="https://portswigger.net/web-security/ssrf" target="_blank" rel="noopener noreferrer">SSRF technical reference ↗</a></details>
  <p class="sw-footer-note">Local execution with fixture responses. This workbench does not change your lesson or lab records.</p>
 </div>
</div>
</template>
<style src="./ssrf-workbench.css"></style>
