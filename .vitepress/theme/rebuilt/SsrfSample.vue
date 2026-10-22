<script setup>
import {computed,nextTick,ref} from 'vue'
import SsrfNetwork from './SsrfNetwork.vue'
import {PICTURE_URL,PRIVATE_URL,fetchIllustration} from './ssrf-sample.js'
const part=ref(0),night=ref(false),target=ref(PICTURE_URL),rule=ref(false),request=ref(null),sequence=ref(0),seen=ref({picture:false,private:false,direct:false,stopped:false}),answer=ref(null)
const goal=computed(()=>!seen.value.picture?0:!seen.value.private?1:!seen.value.direct?2:!seen.value.stopped?3:4)
const actionLabels=['Import the picture','Import the private address','Open it from your browser','Apply the rule and retry','Try the quick check']
const prompts=[['Import a public picture','Studio should download a picture from the public image host.'],['Try the private address','Keep the same feature. Change only the URL it receives.'],['Try reaching it directly','Can your browser open the same private address without Studio?'],['Give Studio a destination rule','Allow only the intended picture host, then retry the private address.'],['Connect what you observed','Your browser supplied the URL. Studio made the unintended request.']]
async function navigate(index){part.value=index;await nextTick();document.getElementById('ssrf-title')?.focus({preventScroll:true});document.getElementById('ssrf-title')?.scrollIntoView({block:'start'})}
async function perform(via='server',address=target.value){
 if(via==='server')target.value=address
 request.value=fetchIllustration({target:address,via,restricted:rule.value});sequence.value++
 if(via==='server'&&request.value.kind==='image')seen.value.picture=true
 if(via==='server'&&request.value.private&&request.value.contacted)seen.value.private=true
 if(via==='browser'&&request.value.private)seen.value.direct=true
 if(via==='server'&&request.value.private&&!request.value.contacted)seen.value.stopped=true
 await nextTick();if(window.matchMedia('(max-width: 620px)').matches)document.querySelector('.ssrf-map-heading')?.scrollIntoView({block:'start'})
}
function advance(){if(goal.value===4){navigate(1);return}if(goal.value===0){rule.value=false;perform('server',PICTURE_URL)}else if(goal.value===1){rule.value=false;perform('server',PRIVATE_URL)}else if(goal.value===2)perform('browser',PRIVATE_URL);else{rule.value=true;perform('server',PRIVATE_URL)}}
function changeRule(){perform('server',target.value)}
function restart(){target.value=PICTURE_URL;rule.value=false;request.value=null;seen.value={picture:false,private:false,direct:false,stopped:false};answer.value=null;sequence.value++;navigate(0)}
const checkRequest=fetchIllustration({target:PICTURE_URL,via:'browser'})
const answers=[{text:'Yes. The user supplied a URL.',correct:false,why:'A supplied URL is only an input. In this example the browser makes the picture request; the website’s server does not fetch it.'},{text:'No. The picture request comes from the browser.',correct:true,why:'Exactly. SSRF needs a server to make an unintended request. Here the browser loads the picture directly, so this behavior is not SSRF.'}]
</script>
<template>
<div class="encoding-sample ssrf-sample" :class="{'sample-night':night}">
 <header class="sample-header"><a href="#/learn/ssrf/0" class="sample-brand"><span class="sample-mark" aria-hidden="true">w.</span><span>websec<span class="sample-brand-note">a learning workshop</span></span></a><div><span class="sample-edition">SSRF · one small example</span><button class="sample-appearance" :aria-label="night?'Use light appearance':'Use dark appearance'" @click="night=!night">{{night?'☀':'◐'}}</button></div></header>
 <div class="sample-wrap ssrf-wrap">
  <div class="sample-topline"><span>SERVER-SIDE REQUEST FORGERY <i>/</i> SSRF</span><button @click="restart">Start again ↺</button></div>
  <nav class="sample-progress" aria-label="SSRF sample parts"><ol><li v-for="(label,index) in ['Try the importer','One quick check']" :key="label"><button :aria-label="'Part '+(index+1)+': '+label" :aria-current="part===index?'step':undefined" @click="navigate(index)">{{index+1}}</button><span>{{label}}</span></li></ol></nav>
  <section class="ssrf-intro"><span class="sample-kicker">{{part===0?'YOU CHOOSE THE LINK. WHO OPENS IT?':'SPOT THE DIFFERENCE'}}</span><h1 id="ssrf-title" tabindex="-1">{{part===0?'A picture importer, with a way inside.':'Same link. A different fetcher.'}}</h1><p v-if="part===0"><strong>Postcard Studio</strong> makes picture cards. Its <strong>Import from link</strong> feature asks Studio’s server to download a picture from the URL you provide. You choose the link; the map shows who fetches it.</p><p v-else>A different website accepts a picture URL, but sets it directly on an image in your browser. <strong>Your browser downloads the picture; the website’s server never fetches it.</strong> Does this behavior demonstrate SSRF?</p></section>
  <div v-if="part===0" class="ssrf-workspace" :class="{'has-result':request}">
   <section class="sample-card ssrf-importer" aria-label="Postcard Studio image importer">
    <div class="sample-card-heading"><span class="ssrf-studio-mark" aria-hidden="true">▧</span><h2>Postcard Studio</h2><span class="sample-card-note">fictional website</span></div>
    <div class="ssrf-feature-heading"><h3>Import from link</h3><p>Studio fetches your chosen address.</p></div>
    <label class="ssrf-url-label" for="ssrf-link">The URL your browser gives Studio</label><textarea id="ssrf-link" :value="target" readonly rows="2" aria-describedby="ssrf-address-help"></textarea>
    <div class="ssrf-presets" role="group" aria-label="Choose a URL and import it"><button :aria-pressed="target===PICTURE_URL" @click="perform('server',PICTURE_URL)"><span>▧</span> Public picture <small>pictures.example.test</small></button><button :aria-pressed="target===PRIVATE_URL" @click="perform('server',PRIVATE_URL)"><span>⌑</span> Private status service <small>status.intra.test</small></button></div>
    <p id="ssrf-address-help" class="ssrf-address-help">Click either example to import it. The private status address is supplied for this model; you don’t need to discover it.</p>
    <aside class="ssrf-next" aria-label="Next thing to try"><span class="sample-kicker">{{goal===4?'THE IDEA TO KEEP':'NEXT, TRY THIS'}}</span><h3>{{prompts[goal][0]}}</h3><p>{{prompts[goal][1]}}</p><button class="sample-primary" @click="advance">{{actionLabels[goal]}} <span>→</span></button></aside>
    <div class="ssrf-extras"><label><input v-model="rule" type="checkbox" @change="changeRule"> Server rule: only allow our picture host</label><button class="sample-text-button" @click="perform('browser',target)">Try this URL directly in your browser ↗</button><details class="sample-detail"><summary>What does your browser send to Studio?</summary><pre>POST /import
{{JSON.stringify({imageUrl:target},null,2)}}</pre><p>That message contains a URL. Studio then makes a separate request to that URL.</p></details></div>
   </section>
   <div class="ssrf-map-stack"><SsrfNetwork :request="request" :sequence="sequence" /><aside v-if="request" class="ssrf-mobile-next" aria-label="Next thing to try"><strong>{{prompts[goal][0]}}</strong><button class="sample-primary" @click="advance">{{actionLabels[goal]}} <span>→</span></button></aside></div>
  </div>
  <div v-else class="ssrf-workspace ssrf-check-workspace"><section class="sample-card ssrf-check"><span class="sample-kicker">ONE QUESTION</span><h2>Does this behavior demonstrate SSRF?</h2><div class="sample-choices"><button v-for="(choice,index) in answers" :key="choice.text" :aria-pressed="answer===index" @click="answer=index"><span>{{String.fromCharCode(65+index)}}</span>{{choice.text}}</button></div><div v-if="answer!==null" class="sample-feedback" :class="{'sample-retry':!answers[answer].correct}" role="status"><strong>{{answers[answer].correct?'You found the important distinction.':'Follow the request’s starting point.'}}</strong><p>{{answers[answer].why}}</p></div><button class="sample-text-button ssrf-back" @click="navigate(0)">← Back to the importer</button></section><SsrfNetwork :request="checkRequest" :sequence="0" /></div>
  <div v-if="part===0&&seen.private" class="ssrf-name"><strong>That unintended server fetch is SSRF.</strong><p>You supplied an address; Studio contacted a service from its own network and returned the service’s data. Your browser’s direct attempt and Studio’s request start from different places.</p></div>
  <footer class="ssrf-footer"><span>A supplied URL is data until a component uses it. Identify which component makes the request.</span><button v-if="part===0" class="sample-text-button" @click="navigate(1)">Go to the quick check →</button><a v-else href="#/learn/ssrf/0">Back to the topic ↗</a></footer>
  <details class="sample-followup ssrf-scope"><summary>What this example covers</summary><div class="sample-followup-content"><p>Every request and response here is computed locally from fixed fixtures. The server is deliberately allowed to reach this private service, and that service has no additional login check. Reachability alone does not prove access to a protected service in a real application.</p><p>This example returns the fetched response to make the effect visible. Some SSRF exposes no response body. The destination rule demonstrates a fixed allowed origin; real defenses must also account for redirects, resolved addresses, URL parsing, and network restrictions.</p><a href="https://portswigger.net/web-security/ssrf" target="_blank" rel="noopener noreferrer">Read the Academy’s SSRF explanation ↗</a></div></details>
  <p class="sample-footnote">All sites, network routes, and status data are fictional. No URL in this lesson is contacted, and no lab records are changed.</p>
 </div>
</div>
</template>
<style src="./ssrf-sample.css"></style>
