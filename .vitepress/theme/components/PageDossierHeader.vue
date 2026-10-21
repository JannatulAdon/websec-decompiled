<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, withBase } from 'vitepress'
import { unitByPath, labsFor } from '../labs.js'
import { termsForUnit } from '../data/glossary.js'
import InteractiveWorkbench from './InteractiveWorkbench.vue'
import {
  initProgress,
  progress,
  overallStats,
  moduleStats,
  isLabDone,
  isLabBookmarked,
  isTopicBookmarked,
  toggleTopicBookmark,
  getTopicNote,
  setTopicNote
} from '../progress.js'

const route = useRoute()
const showNotes = ref(false)
const showTerms = ref(false)
const noteDraft = ref('')
const savedTick = ref(false)
const guideHeadings = ref([])

const unit = computed(() => unitByPath(route.path))
const unitLabs = computed(() => (unit.value ? labsFor(unit.value.id) : []))
const terms = computed(() => (unit.value ? termsForUnit(unit.value.id) : []))

const globalStats = computed(() =>
  progress.ready
    ? overallStats()
    : { xp: 0, rankTitle: '🔎 Rookie Observer' }
)

const stats = computed(() =>
  unit.value && progress.ready
    ? moduleStats(unit.value.id)
    : {
        done: 0,
        total: unitLabs.value.length,
        percent: 0,
        topicDone: false,
        bookmarked: false,
        hasNote: false,
        activitiesDone: 0
      }
)

const bookmarked = computed(() => unit.value && progress.ready && isTopicBookmarked(unit.value.id))

const visibleLabsCount = computed(() => {
  if (!progress.ready) return unitLabs.value.length
  const f = progress.filters
  return unitLabs.value.filter((lab) => {
    if (f.difficulty !== 'all' && lab.difficulty !== f.difficulty) return false
    if (f.hideSolved && isLabDone(lab.id)) return false
    if (f.onlyBookmarked && !isLabBookmarked(lab.id)) return false
    return true
  }).length
})

function annotateDocSections() {
  if (typeof document === 'undefined') return
  const container = document.querySelector('.VPDoc .vp-doc > div')
  if (!container) return

  const children = Array.from(container.children)
  let currentH2 = null
  const headings = []

  for (const el of children) {
    if (el.tagName === 'H2') {
      currentH2 = el
      currentH2.classList.remove('wd-h2-has-labs', 'wd-h2-labs-only')
      const cleanTitle = (el.textContent || '').replace(/^#\s*|\s*#$/g, '').trim()
      if (/^Practice Labs/i.test(cleanTitle)) {
        currentH2.classList.add('wd-h2-labs-only')
      } else if (el.id && cleanTitle) {
        headings.push({ id: el.id, title: cleanTitle })
      }
    } else if (
      currentH2 &&
      (el.classList.contains('wd-labs') ||
        (el.tagName === 'SECTION' && el.classList.contains('wd-lab')) ||
        el.querySelector?.('.wd-labs, section.wd-lab'))
    ) {
      currentH2.classList.add('wd-h2-has-labs')
    }
  }

  guideHeadings.value = headings
}

function syncDocModeClass() {
  if (typeof document === 'undefined') return
  const vpDoc = document.querySelector('.VPDoc')
  if (!vpDoc) return
  vpDoc.classList.remove(
    'wd-has-studio',
    'wd-view-playground',
    'wd-view-labs',
    'wd-view-guide'
  )
  if (unit.value) {
    vpDoc.classList.add('wd-has-studio')
    const mode = progress.ui.pageView || 'playground'
    vpDoc.classList.add(`wd-view-${mode}`)
    annotateDocSections()
  }
}

function handleHashNavigation() {
  if (typeof window === 'undefined' || !unit.value) return
  const hash = decodeURIComponent(window.location.hash || '').replace(/^#/, '')
  if (!hash) return
  if (unitLabs.value.some((l) => l.id === hash) || hash.includes('lab')) {
    progress.ui.pageView = 'labs'
  } else {
    progress.ui.pageView = 'guide'
  }
  syncDocModeClass()
}

function syncNote() {
  if (unit.value) {
    noteDraft.value = getTopicNote(unit.value.id)
  }
}

function resetIncompatibleFilter() {
  if (!unitLabs.value.length) return
  const diff = progress.filters.difficulty
  if (diff !== 'all' && !unitLabs.value.some((l) => l.difficulty === diff)) {
    progress.filters.difficulty = 'all'
  }
}

onMounted(() => {
  initProgress()
  syncNote()
  resetIncompatibleFilter()
  handleHashNavigation()
  nextTick(syncDocModeClass)
  if (typeof window !== 'undefined') {
    window.addEventListener('hashchange', handleHashNavigation)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('hashchange', handleHashNavigation)
  }
  if (typeof document !== 'undefined') {
    const vpDoc = document.querySelector('.VPDoc')
    vpDoc?.classList.remove(
      'wd-has-studio',
      'wd-view-playground',
      'wd-view-labs',
      'wd-view-guide'
    )
  }
})

watch(
  () => route.path,
  () => {
    showNotes.value = false
    showTerms.value = false
    syncNote()
    resetIncompatibleFilter()
    if (typeof window !== 'undefined' && window.location.hash) {
      handleHashNavigation()
    } else {
      progress.ui.pageView = 'playground'
    }
    nextTick(syncDocModeClass)
  }
)

watch(
  () => progress.ui.pageView,
  () => {
    syncDocModeClass()
  }
)

function setPageView(view) {
  progress.ui.pageView = view
  syncDocModeClass()
}

function resetAllFilters() {
  progress.filters.difficulty = 'all'
  progress.filters.hideSolved = false
  progress.filters.onlyBookmarked = false
}

function onNoteInput(e) {
  noteDraft.value = e.target.value
  if (unit.value) {
    setTopicNote(unit.value.id, noteDraft.value)
    savedTick.value = true
    setTimeout(() => {
      savedTick.value = false
    }, 1200)
  }
}
</script>

<template>
  <div v-if="unit" class="wd-studio-shell">
    <!-- Clean, Breathable Hero Header -->
    <header class="wd-heroheader" aria-label="Case file overview">
      <div class="wd-heroheader__meta">
        <div class="wd-heroheader__crumbs">
          <span class="wd-crumb-stage">{{ unit.stageIcon }} {{ unit.stageShort }}</span>
          <span class="wd-crumb-sep" aria-hidden="true">·</span>
          <span class="wd-crumb-step">Case {{ String(unit.stepNumber).padStart(2, '0') }} of 35</span>
          <span class="wd-crumb-sep" aria-hidden="true">·</span>
          <span class="wd-crumb-xp">{{ globalStats.rankTitle }} (⚡ {{ globalStats.xp }} XP)</span>
        </div>

        <div class="wd-heroheader__tools">
          <button
            v-if="terms.length"
            type="button"
            class="wd-quietbtn"
            :class="{ 'is-active': showTerms }"
            :aria-expanded="showTerms"
            @click="showTerms = !showTerms"
          >
            <span aria-hidden="true">📖</span>
            <span>Key Terms ({{ terms.length }})</span>
          </button>

          <button
            type="button"
            class="wd-quietbtn"
            :class="{ 'is-active': showNotes || stats.hasNote }"
            :aria-expanded="showNotes"
            @click="showNotes = !showNotes"
          >
            <span aria-hidden="true">📝</span>
            <span>{{ stats.hasNote ? 'Notes ✓' : 'Notes' }}</span>
          </button>

          <button
            type="button"
            class="wd-quietbtn"
            :class="{ 'is-active': bookmarked }"
            :aria-pressed="bookmarked"
            @click="toggleTopicBookmark(unit.id)"
          >
            <span aria-hidden="true">{{ bookmarked ? '★' : '☆' }}</span>
            <span>{{ bookmarked ? 'Saved' : 'Save' }}</span>
          </button>
        </div>
      </div>

      <!-- Primary Topic Title & 1-Sentence Lede -->
      <h1 class="wd-heroheader__title">{{ unit.title }}</h1>
      <p class="wd-heroheader__blurb">{{ unit.blurb }}</p>

      <!-- Optional Key Terms Tray (Only open when clicked, never snaps shut!) -->
      <div v-if="showTerms && terms.length" class="wd-drawerpanel">
        <div class="wd-drawerpanel__head">
          <strong>📖 Plain-English Jargon Buster for {{ unit.title }}</strong>
          <div class="wd-drawerpanel__headright">
            <a :href="withBase('/glossary/')" class="wd-jargonbox__link">Open Full A–Z Glossary →</a>
            <button type="button" class="wd-drawerpanel__close" @click="showTerms = false">✕</button>
          </div>
        </div>
        <div class="wd-jargonbox__grid">
          <div v-for="t in terms" :key="t.id" class="wd-jargonbox__item">
            <div class="wd-jargonbox__term">{{ t.term }}</div>
            <p class="wd-jargonbox__plain">{{ t.plain }}</p>
            <p v-if="t.analogy" class="wd-jargonbox__analogy">
              <span>💡 <em>Analogy:</em> {{ t.analogy }}</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Optional Personal Notes Tray -->
      <div v-if="showNotes" class="wd-drawerpanel">
        <div class="wd-drawerpanel__head">
          <strong>📝 Personal Scratchpad · {{ unit.title }}</strong>
          <div class="wd-drawerpanel__headright">
            <span class="wd-dossier__notessaved">
              {{ savedTick ? '✓ Saved' : 'Auto-saves locally' }}
            </span>
            <button type="button" class="wd-drawerpanel__close" @click="showNotes = false">✕</button>
          </div>
        </div>
        <textarea
          :value="noteDraft"
          class="wd-dossier__textarea"
          rows="3"
          placeholder="Jot down your own takeaways, mental model, or payload reminders..."
          @input="onNoteInput"
        ></textarea>
      </div>

      <!-- 3-Mode Primary Workspace Switcher -->
      <nav class="wd-modeswitch" aria-label="Choose learning mode">
        <button
          type="button"
          class="wd-modetab"
          :class="{ 'is-active': progress.ui.pageView === 'playground' }"
          @click="setPageView('playground')"
        >
          <span class="wd-modetab__icon">🎮</span>
          <span class="wd-modetab__text">
            <strong>1. Interactive Studio</strong>
            <small>Poke, observe &amp; predict</small>
          </span>
          <span class="wd-modetab__badge">{{ stats.activitiesDone }}/3</span>
        </button>

        <button
          type="button"
          class="wd-modetab"
          :class="{ 'is-active': progress.ui.pageView === 'labs' }"
          @click="setPageView('labs')"
        >
          <span class="wd-modetab__icon">🧪</span>
          <span class="wd-modetab__text">
            <strong>2. Practice Labs</strong>
            <small>Hands-on Academy challenges</small>
          </span>
          <span class="wd-modetab__badge">{{ stats.done }}/{{ stats.total }}</span>
        </button>

        <button
          type="button"
          class="wd-modetab"
          :class="{ 'is-active': progress.ui.pageView === 'guide' }"
          @click="setPageView('guide')"
        >
          <span class="wd-modetab__icon">📖</span>
          <span class="wd-modetab__text">
            <strong>3. Deep-Dive Guide</strong>
            <small>Diagrams, tables &amp; reference</small>
          </span>
          <span class="wd-modetab__badge">~{{ unit.readingMinutes }}m</span>
        </button>
      </nav>
    </header>

    <!-- VIEW 1: INTERACTIVE STUDIO -->
    <InteractiveWorkbench
      v-if="progress.ui.pageView === 'playground'"
      @open-labs="setPageView('labs')"
      @open-guide="setPageView('guide')"
    />

    <!-- VIEW 2: PRACTICE LABS TOOLBAR (Shown right above the labs!) -->
    <div v-if="progress.ui.pageView === 'labs'" class="wd-labview-bar" role="region" aria-label="Filter practice labs">
      <div class="wd-labview-bar__row">
        <div class="wd-filterbar__group">
          <span class="wd-filterbar__label">Difficulty:</span>
          <button
            v-for="diff in ['all', 'Apprentice', 'Practitioner', 'Expert']"
            :key="diff"
            type="button"
            class="wd-filterpill"
            :class="{ 'is-active': progress.filters.difficulty === diff }"
            @click="progress.filters.difficulty = diff"
          >
            {{ diff === 'all' ? `All (${unitLabs.length})` : diff }}
          </button>
        </div>

        <div class="wd-filterbar__toggles">
          <button
            type="button"
            class="wd-filterpill"
            :class="{ 'is-active': progress.filters.hideSolved }"
            @click="progress.filters.hideSolved = !progress.filters.hideSolved"
          >
            {{ progress.filters.hideSolved ? '✓ Hiding Solved' : 'Hide Solved' }}
          </button>
          <button
            type="button"
            class="wd-filterpill"
            :class="{ 'is-active': progress.filters.onlyBookmarked }"
            @click="progress.filters.onlyBookmarked = !progress.filters.onlyBookmarked"
          >
            ★ Saved Only
          </button>
        </div>
      </div>

      <!-- Empty Filter Fallback Banner (Works for both SQLi and LabGroup pages!) -->
      <div v-if="visibleLabsCount === 0" class="wd-labs__filtered">
        <span>No labs on this page match your active filter ({{ progress.filters.difficulty }}).</span>
        <button type="button" class="wd-filterpill is-active" @click="resetAllFilters">
          Reset Filters
        </button>
      </div>
    </div>

    <!-- VIEW 3: DEEP-DIVE GUIDE SECTION JUMP BAR -->
    <nav
      v-if="progress.ui.pageView === 'guide' && guideHeadings.length > 1"
      class="wd-guide-jumpbar"
      aria-label="Jump to section"
    >
      <span class="wd-guide-jumpbar__label">Jump to section:</span>
      <a
        v-for="h in guideHeadings"
        :key="h.id"
        :href="`#${h.id}`"
        class="wd-guide-jumpbar__pill"
      >
        {{ h.title }}
      </a>
      <button
        v-if="unitLabs.length"
        type="button"
        class="wd-guide-jumpbar__pill wd-guide-jumpbar__pill--cta"
        @click="setPageView('labs')"
      >
        🧪 Practice Labs ({{ unitLabs.length }}) →
      </button>
    </nav>
  </div>
</template>
