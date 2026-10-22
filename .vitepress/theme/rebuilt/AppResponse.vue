<script setup>
import {computed} from 'vue'
const props=defineProps({app:Object,values:Object,result:Object})
const text=computed(()=>props.result?.output||'')
const failed=computed(()=>/^(?:[45]\d\d|Rejected|Blocked|Denied|Input rejected)/i.test(text.value))
const product=computed(()=>props.app.kind==='product'?'Field notebook':props.values.path==='/items/8'?'Cable tester':'Field notebook')
const productOK=computed(()=>/^200:/.test(text.value))
const invoiceOK=computed(()=>props.app.kind==='invoice'&&/^200:/.test(text.value))
const rows=computed(()=>text.value.split('\n').filter(Boolean))
</script>
<template>
 <div class="app-response" :data-observation="text" :class="{'response-denied':failed}">
  <div class="response-heading"><span class="response-signal" :class="{warning:failed}"></span><span>Response received</span><span class="local-badge">SIMULATED</span></div>
  <template v-if="(app.kind==='products'||app.kind==='product')&&productOK">
   <div class="shop-product"><div class="product-drawing" :class="{'cable-drawing':product==='Cable tester'}"><span>{{product==='Cable tester'?'⌁':'≡'}}</span></div><div><span class="app-kicker">FIELD ESSENTIALS</span><h4>{{product}}</h4><p>{{product==='Cable tester'?'Test the connection. Follow the signal.':'A place for observations and good questions.'}}</p><span class="app-item">Item {{values.product||values.path?.split('/').at(-1)}}</span></div></div>
  </template>
  <template v-else-if="invoiceOK"><div class="invoice-preview"><div><span class="app-kicker">PRIVATE INVOICE #{{values.invoice}}</span><strong>{{text.includes('bob')?'Bob':'Alice'}}</strong><span>Account owner</span></div><div class="invoice-stamp">PRIVATE<br>RECORD</div></div><p class="app-notice">Compare the account owner with the session you sent.</p></template>
  <template v-else-if="app.kind==='catalogue'&&!failed&&!text.startsWith('No matching')&&!text.startsWith('Model parse error')"><div class="catalogue-results"><div v-for="(row,i) in rows" :key="i" class="catalogue-result"><span class="result-icon">{{i+1}}</span><span>{{row}}</span><span v-if="row.includes('not released')" class="private-tag">unreleased</span></div></div></template>
  <template v-else-if="app.kind==='cart'&&!failed"><div class="cart-preview"><span class="cart-icon">▤</span><div><h4>Field notebook</h4><p>{{values.quantity}} × $10 each</p></div></div><div class="balance-preview"><span>After this checkout</span><strong>{{text}}</strong></div></template>
  <template v-else><div class="app-message"><span class="message-icon">{{failed?'!':app.kind==='files'?'▧':app.kind==='account'?'◎':app.kind==='network'?'⇄':'↳'}}</span><div><span class="app-kicker">{{app.section}}</span><p class="response-text">{{text}}</p></div></div></template>
  <div v-if="['products','product','invoice','catalogue','cart'].includes(app.kind)" class="response-accessible response-text">{{text}}</div>
 </div>
</template>
