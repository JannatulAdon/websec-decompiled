<script setup>
import {ref,computed} from 'vue'
import AppResponse from './AppResponse.vue'
import {experimentFor} from './experiments/index.js'
const id=ref('7')
const values=computed(()=>({method:'GET',path:'/items/'+id.value,body:''}))
const result=computed(()=>experimentFor('foundations',0).run(values.value,false))
const app={name:'Field Supply',section:'Product browser',kind:'products',address:'shop.example.test'}
</script>
<template><div class="home-demo fictional-app"><div class="browser-chrome"><span class="browser-lights" aria-hidden="true">● ● ●</span><span>shop.example.test</span><span>◇</span></div><div class="fictional-app-nav"><strong>Field Supply<span>.</span></strong><span>YOUR FIRST TINY EXPERIMENT</span></div><div class="home-demo-content"><p>Same request. Different ID. What changes?</p><div class="demo-request"><span class="http-badge">GET</span><code>/items/{{id}}</code></div><div class="input-examples" role="group" aria-label="Try a product ID"><button v-for="value in ['7','8','abcd']" :key="value" :aria-pressed="id===value" @click="id=value">id={{value}}</button></div><div class="home-route-map" aria-label="Live route selection"><div v-for="route in result.visual.routes" :key="route.path" :class="{matched:route.matched}"><span>{{route.matched?'●':'○'}}</span><code>{{route.path}}</code><strong>{{route.name}}</strong></div><span v-if="!result.visual.routes.some(r=>r.matched)" class="home-route-miss">No matching route → 404</span></div><AppResponse :app="app" :values="values" :result="result" aria-live="polite"/><p class="demo-explanation">{{id==='abcd'?'The path does not match a resource in this fixture. A 404 describes this lookup, not the whole app’s security.':id==='8'?'You changed only the path. The server selected a different product.':'Click an ID above. You can learn by testing, without typing a thing.'}}</p></div></div></template>
