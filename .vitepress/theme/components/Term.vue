<script setup>
import { computed, ref } from 'vue'
import { termById } from '../data/glossary.js'

const props = defineProps({
  id: { type: String, default: '' },
  t: { type: String, default: '' }
})

const open = ref(false)
const entry = computed(() => termById(props.id || props.t))
</script>

<template>
  <span
    v-if="entry"
    class="wd-term"
    :class="{ 'is-open': open }"
    tabindex="0"
    role="button"
    :aria-expanded="open"
    @click="open = !open"
    @keydown.enter.prevent="open = !open"
    @keydown.space.prevent="open = !open"
    @mouseleave="open = false"
  >
    <span class="wd-term__label"><slot>{{ entry.term }}</slot></span>
    <span class="wd-term__popover" role="tooltip">
      <strong class="wd-term__title">📖 {{ entry.term }}</strong>
      <span class="wd-term__plain">{{ entry.plain }}</span>
      <span v-if="entry.analogy" class="wd-term__analogy">
        <em>💡 Real-life analogy:</em> {{ entry.analogy }}
      </span>
    </span>
  </span>
  <span v-else><slot /></span>
</template>
