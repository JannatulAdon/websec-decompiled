<script setup>
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import { GLOSSARY } from '../data/glossary.js'
import { unitById } from '../labs.js'

const search = ref('')
const selectedStage = ref('all')

const stages = [
  'all',
  'Stage 1 · Recon',
  'Stage 2 · Logins & Logic',
  'Stage 3 · Databases & Backend',
  'Stage 4 · Browser Bugs',
  'Stage 5 · APIs, Files & AI',
  'Stage 6 · Deep Internals'
]

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return GLOSSARY.filter((item) => {
    if (selectedStage.value !== 'all' && item.stage !== selectedStage.value) return false
    if (!q) return true
    return (
      item.term.toLowerCase().includes(q) ||
      item.plain.toLowerCase().includes(q) ||
      (item.analogy && item.analogy.toLowerCase().includes(q))
    )
  })
})

function resolveUnits(unitIds) {
  return (unitIds || []).map((id) => unitById(id)).filter(Boolean)
}
</script>

<template>
  <section class="wd-glossary">
    <div class="wd-glossary__controls">
      <div class="wd-glossary__searchwrap">
        <input
          v-model="search"
          type="search"
          class="wd-glossary__search"
          placeholder="Search any technical term (e.g., CSRF, token, sink, OAST, gadget)..."
          aria-label="Search plain-English glossary"
        />
      </div>
      <div class="wd-glossary__pills" role="tablist" aria-label="Filter by learning stage">
        <button
          v-for="stage in stages"
          :key="stage"
          type="button"
          class="wd-filterpill"
          :class="{ 'is-active': selectedStage === stage }"
          @click="selectedStage = stage"
        >
          {{ stage === 'all' ? `All Terms (${GLOSSARY.length})` : stage }}
        </button>
      </div>
    </div>

    <p v-if="filtered.length === 0" class="wd-glossary__empty">
      No terms matched "<strong>{{ search }}</strong>". Try a shorter keyword or reset the stage filter.
    </p>

    <div class="wd-glossary__grid">
      <article v-for="item in filtered" :id="item.id" :key="item.id" class="wd-glossary__card">
        <header class="wd-glossary__head">
          <span class="wd-badge wd-badge--stage">{{ item.stage }}</span>
          <h3 class="wd-glossary__term">{{ item.term }}</h3>
        </header>
        <p class="wd-glossary__plain">
          <strong>In Plain English:</strong> {{ item.plain }}
        </p>
        <p v-if="item.analogy" class="wd-glossary__analogy">
          <span>💡 <strong>Think of it like:</strong> {{ item.analogy }}</span>
        </p>
        <footer v-if="resolveUnits(item.units).length" class="wd-glossary__foot">
          <span class="wd-glossary__usedin">Appears in:</span>
          <a
            v-for="unit in resolveUnits(item.units)"
            :key="unit.id"
            :href="withBase(unit.path)"
            class="wd-glossary__unitlink"
          >
            {{ unit.title }} →
          </a>
        </footer>
      </article>
    </div>
  </section>
</template>
