<script setup>
import {ref,computed,watch} from 'vue'
import {playbooks} from './playbooks.js'
import PlainText from './PlainText.vue'
const props=defineProps({moduleId:String})
const section=ref(0),copy=computed(()=>playbooks[props.moduleId])
watch(()=>props.moduleId,()=>section.value=0)
</script>
<template><details v-if="copy" class="practice-guide"><summary>Take this mechanism to a CTF</summary><div class="guide-sections" aria-label="Investigation guide sections"><button v-for="(name,i) in ['Recognize','Investigate','Use tools','Check limits']" :key="name" :aria-pressed="section===i" @click="section=i">{{name}}</button></div><p><PlainText :text="copy[section]" /></p><small>A general investigation workflow, independent of any particular lab solution.</small></details></template>
