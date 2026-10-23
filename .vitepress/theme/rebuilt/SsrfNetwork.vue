<script setup>
import {computed,onMounted,onUnmounted,ref} from 'vue'
import {networkNodes} from './ssrf-sample.js'
const props=defineProps({request:Object,sequence:Number,showPrivate:{type:Boolean,default:true},interactive:{type:Boolean,default:false}})
const narrow=ref(false),reduced=ref(true),inspected=ref(null),replay=ref(0)
let media,motion
function resize(){narrow.value=media.matches;reduced.value=motion.matches}
onMounted(()=>{media=window.matchMedia('(max-width: 620px)');motion=window.matchMedia('(prefers-reduced-motion: reduce)');resize();media.addEventListener('change',resize);motion.addEventListener('change',resize)})
onUnmounted(()=>{media?.removeEventListener('change',resize);motion?.removeEventListener('change',resize)})
const points=computed(()=>narrow.value?{browser:[65,78],server:[252,78],picture:[65,271],private:[252,271]}:{browser:[84,153],server:[334,153],picture:[586,49],private:[586,258]})
const shapes=computed(()=>{const p=points.value;return {
 submit:`M ${p.browser[0]+55} ${p.browser[1]} L ${p.server[0]-64} ${p.server[1]}`,
 'server-picture':narrow.value?'M 230 117 Q 200 217 94 240':'M 395 141 Q 485 107 534 64',
 'server-private':narrow.value?'M 252 117 L 252 232':'M 395 166 Q 483 205 531 242',
 'picture-server':narrow.value?'M 108 247 Q 222 215 245 117':'M 534 82 Q 475 128 395 153',
 'private-server':narrow.value?'M 266 232 L 266 117':'M 531 258 Q 480 230 395 184',
 return:`M ${p.server[0]-64} ${p.server[1]+20} L ${p.browser[0]+55} ${p.browser[1]+20}`,
 'browser-blocked':narrow.value?'M 65 117 Q 65 178 155 183':'M 84 191 Q 151 250 258 245',
 'browser-picture':narrow.value?'M 65 117 L 65 232':'M 84 115 Q 204 7 530 48'
}})
const visibleNodes=computed(()=>Object.fromEntries(Object.entries(networkNodes).filter(([id])=>props.showPrivate||id!=='private')))
const route=computed(()=>props.request?.edges||[])
const captions=computed(()=>!props.request?'Import a picture to draw the request route.':props.request.via==='browser'?'Direct browser test':props.request.kind==='blocked'?'Studio import · stopped at the destination rule':'Studio import · the server fetches the link')
</script>
<template>
<section class="ssrf-map-card" aria-label="Network visualization">
 <div class="ssrf-map-heading"><div><span class="sample-kicker">WHO MAKES THE REQUEST?</span><h2>Follow this request</h2></div><button v-if="request&&!reduced" class="sample-text-button" @click="replay++">Replay route ↻</button></div>
 <p class="ssrf-map-caption" role="status">{{captions}}</p>
 <p v-if="request" class="ssrf-current-target"><span>Destination</span><code>{{request.target}}</code></p>
 <svg class="ssrf-network" :viewBox="narrow?'0 0 360 330':showPrivate?'0 0 680 320':'0 0 680 235'" role="group" :aria-label="showPrivate?'Your browser is outside Studio’s network; the Studio server can reach its staff page.':'Your browser gives Studio a link; Studio requests the public picture.'">
  <defs><marker id="ssrf-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--sp-brand)"/></marker><marker id="ssrf-return-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--sp-good)"/></marker></defs>
  <rect v-if="showPrivate" class="ssrf-private-zone" :x="narrow?155:258" :y="narrow?13:101" :width="narrow?194:412" :height="narrow?308:210" rx="18"/><text v-if="showPrivate" class="ssrf-zone-title" :x="narrow?167:275" :y="narrow?31:111">Studio’s private network</text>
  <path v-for="edge in (showPrivate?['submit','server-picture','server-private']:['submit','server-picture'])" :key="'background-'+edge" :d="shapes[edge]" class="ssrf-route-inactive"/>
  <g :key="sequence+':'+replay" class="ssrf-live-route">
   <g v-for="(edge,index) in route" :key="edge" :data-edge="edge"><path :d="shapes[edge]" class="ssrf-route" :class="{'ssrf-route-return':edge==='return'||edge.endsWith('-server'),'ssrf-route-blocked':edge==='browser-blocked'}" :marker-end="edge==='browser-blocked'?undefined:edge==='return'||edge.endsWith('-server')?'url(#ssrf-return-arrow)':'url(#ssrf-arrow)'"/><path v-if="!reduced" :d="shapes[edge]" pathLength="100" class="ssrf-packet" :style="{animationDelay:index*.55+'s'}"/></g>
  </g>
  <g v-if="route.includes('browser-blocked')" class="ssrf-stop" :transform="narrow?'translate(155 183)':'translate(258 245)'"><circle r="12"/><path d="M -4 -4 L 4 4 M -4 4 L 4 -4"/></g>
  <g v-for="(node,id) in visibleNodes" :key="id" :transform="'translate('+points[id][0]+' '+points[id][1]+')'" class="ssrf-machine" :class="{'ssrf-machine-interactive':interactive,'ssrf-machine-selected':inspected===id,'ssrf-machine-reached':request?.contacted&&request.destination===id,'ssrf-machine-stopped':id==='server'&&request?.via==='server'&&request?.kind==='blocked'}" :role="interactive?'button':'group'" :tabindex="interactive?0:undefined" :aria-label="interactive?'Inspect '+node.title:node.title" :aria-pressed="interactive?inspected===id:undefined" @click="interactive&&(inspected=inspected===id?null:id)" @keydown.enter.prevent="interactive&&(inspected=inspected===id?null:id)" @keydown.space.prevent="interactive&&(inspected=inspected===id?null:id)">
   <rect :x="id==='server'?-64:-55" y="-38" :width="id==='server'?128:110" height="76" rx="12"/>
   <svg x="-10" y="-26" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><template v-if="id==='browser'"><rect x="2" y="3" width="20" height="15" rx="2"/><path d="M 2 8 H 22 M 9 22 H 15 M 12 18 V22"/></template><template v-else-if="id==='picture'"><rect x="2" y="3" width="20" height="18" rx="2"/><circle cx="16" cy="8" r="2"/><path d="M3 18 9 11 15 18 18 15 22 19"/></template><template v-else><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M7 8 H17 M7 13 H17 M7 18 H11"/></template></svg>
   <text text-anchor="middle" y="6">{{node.title}}</text><text text-anchor="middle" y="24" class="ssrf-node-note">{{id==='browser'?(request?.via==='browser'?'fetches directly':'submits a link'):id==='server'?(request?.via==='browser'?'not used here':'fetches that link'):id==='picture'?'public picture':'company network'}}</text>
  </g>
 </svg>
 <div v-if="interactive&&inspected" class="ssrf-inspection" role="status"><strong>{{networkNodes[inspected].title}}</strong><p>{{networkNodes[inspected].note}}</p></div><p class="ssrf-map-legend"><span>→ request</span><span>← returned data</span></p><p class="ssrf-map-hint">{{interactive?'Tap a machine to inspect its role. ':''}}Blue arrows are requests. Green arrows are replies. The route is illustrated; no address is contacted.</p>
 <div v-if="request" class="ssrf-observation" :class="{'ssrf-observation-private':request.private&&request.contacted,'ssrf-observation-blocked':request.kind==='blocked'}" :data-kind="request.kind" :data-via="request.via" :data-contacted="request.contacted"><span>{{request.via==='server'?'WHAT STUDIO RETURNS TO YOU':'WHAT YOUR BROWSER GETS DIRECTLY'}}</span><h3>{{request.title}}</h3><div v-if="request.kind==='image'" class="ssrf-picture-result"><svg viewBox="0 0 360 82" role="img" aria-label="Imported Blue Sky picture"><rect width="360" height="82" fill="#bddff3"/><circle cx="294" cy="24" r="13" fill="#fff2b3"/><path d="M0 82 Q65 0 164 82 M90 82 Q230 0 360 82" fill="#73a799"/></svg><strong>Blue Sky · imported</strong></div><div v-else-if="request.kind==='text'" class="ssrf-code-result"><span>STAFF PREVIEW CODE</span><strong>{{request.body}}</strong></div><pre v-else>{{request.body}}</pre><p>{{request.explanation}}</p></div>
</section>
</template>
