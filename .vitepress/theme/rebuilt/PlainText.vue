<script setup>
import {computed,ref} from 'vue'
import {terms} from './curriculum.js'
const props=defineProps({text:String})
const active=ref('')
const vocabulary=terms.filter(([t])=>t.length>2).sort((a,b)=>b[0].length-a[0].length)
const pattern=new RegExp('\\b('+vocabulary.map(([t])=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')\\b','gi')
const pieces=computed(()=>String(props.text||'').split(pattern).filter(Boolean).map(text=>({text,term:vocabulary.find(([t])=>t.toLowerCase()===text.toLowerCase())})))
</script>
<template><span class="plain-text"><template v-for="(piece,i) in pieces" :key="i"><span v-if="piece.term" class="inline-term"><button class="term-button" :aria-expanded="active===String(i)" :aria-label="'Explain '+piece.text" @click="active=active===String(i)?'':String(i)" @keydown.esc="active=''">{{piece.text}}</button><span v-if="active===String(i)" class="term-definition" role="status"><strong>{{piece.term[0]}}</strong>{{piece.term[1]}}<button @click="active=''" aria-label="Close definition">×</button></span></span><template v-else>{{piece.text}}</template></template></span></template>
