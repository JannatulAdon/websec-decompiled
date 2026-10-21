<script setup>
import { computed, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { labs, phases, studyUnits, totalLabs, labById, unitById } from '../labs.js'
import {
  initProgress,
  moduleStats,
  nextUnsolvedLab,
  nextRecommendedUnit,
  overallStats,
  progress,
  resetProgress,
  toggleTopic,
  toggleTopicBookmark,
  toggleLabBookmark,
  exportProgressData,
  importProgressData
} from '../progress.js'

const activeTab = ref('stages') // 'stages' | 'bookmarks' | 'notes'
const fileInput = ref(null)
const statusMsg = ref('')

onMounted(initProgress)

const stats = computed(() =>
  progress.ready
    ? overallStats()
    : {
        done: 0,
        total: totalLabs,
        percent: 0,
        topicsDone: 0,
        topicsTotal: studyUnits.length,
        bookmarksCount: 0,
        notesCount: 0
      }
)

const nextLab = computed(() => (progress.ready ? nextUnsolvedLab() : labs[0]))
const nextUnit = computed(() => (progress.ready ? nextRecommendedUnit() : studyUnits[0]))

const groups = computed(() =>
  phases.map((phase) => {
    const units = phase.units.map((unit) => ({ ...unit, stats: moduleStats(unit.id) }))
    const stageDone = units.reduce((acc, u) => acc + u.stats.done, 0)
    const stageTotal = units.reduce((acc, u) => acc + u.stats.total, 0)
    const stagePercent = stageTotal === 0 ? 0 : Math.round((stageDone / stageTotal) * 100)
    return {
      ...phase,
      units,
      stageDone,
      stageTotal,
      stagePercent
    }
  })
)

const bookmarkedTopics = computed(() => {
  if (!progress.ready) return []
  return Object.keys(progress.bookmarks.topics)
    .map((id) => unitById(id))
    .filter(Boolean)
})

const bookmarkedLabs = computed(() => {
  if (!progress.ready) return []
  return Object.keys(progress.bookmarks.labs)
    .map((id) => labById(id))
    .filter(Boolean)
})

const allNotes = computed(() => {
  if (!progress.ready) return []
  const out = []
  for (const [id, text] of Object.entries(progress.notes.topics)) {
    if (!text?.trim()) continue
    const unit = unitById(id)
    if (unit) {
      out.push({
        type: 'Topic',
        id,
        title: unit.title,
        link: unit.path,
        text
      })
    }
  }
  for (const [id, text] of Object.entries(progress.notes.labs)) {
    if (!text?.trim()) continue
    const lab = labById(id)
    if (lab) {
      out.push({
        type: 'Lab',
        id,
        title: lab.title,
        link: `${lab.path}#${lab.id}`,
        text
      })
    }
  }
  return out
})

function onExport() {
  if (typeof window === 'undefined') return
  const json = exportProgressData()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `websec-decompiled-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  statusMsg.value = '✓ Backup downloaded!'
  setTimeout(() => (statusMsg.value = ''), 3000)
}

function triggerImport() {
  if (fileInput.value) fileInput.value.click()
}

function onImportFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const ok = importProgressData(String(reader.result || ''))
    statusMsg.value = ok ? '✓ Backup restored successfully!' : '⚠ Invalid backup file.'
    setTimeout(() => (statusMsg.value = ''), 3500)
  }
  reader.readAsText(file)
  event.target.value = ''
}

function onReset() {
  if (typeof window === 'undefined') return
  const ok = window.confirm('Reset all solved labs, completed topics, bookmarks, and notes on this device? This cannot be undone.')
  if (ok) resetProgress()
}
</script>

<template>
  <section class="wd-dashboard" aria-labelledby="wd-progress-heading">
    <!-- Smart Next Recommendation Card -->
    <div v-if="nextUnit" class="wd-nextcard">
      <div class="wd-nextcard__body">
        <span class="wd-eyebrow">🧭 Recommended Next Step in Your Learning Path</span>
        <h3 class="wd-nextcard__title">
          {{ nextUnit.stageIcon }} Step {{ nextUnit.stepNumber }} of 35 · {{ nextUnit.title }}
        </h3>
        <p class="wd-nextcard__desc">{{ nextUnit.blurb }}</p>
        <p v-if="nextLab" class="wd-nextcard__lab">
          <strong>Next unsolved lab:</strong>
          <a :href="`${withBase(nextLab.path)}#${nextLab.id}`">{{ nextLab.title }}</a>
          <span class="wd-badge" :class="`wd-badge--${(nextLab.difficulty || '').toLowerCase()}`">
            {{ nextLab.difficulty }}
          </span>
        </p>
      </div>
      <div class="wd-nextcard__cta">
        <a class="wd-nextcard__btn" :href="withBase(nextUnit.path)">
          Open Case File →
        </a>
      </div>
    </div>

    <!-- Overall Header & Stats -->
    <div class="wd-dashboard__head">
      <div>
        <p class="wd-eyebrow">Local Investigation Record · Stored in your browser</p>
        <h2 id="wd-progress-heading" class="wd-dashboard__title">Your Study Dashboard</h2>
      </div>
      <div class="wd-dashboard__score">
        <span class="wd-dashboard__percent">{{ stats.percent }}<small>%</small></span>
        <span class="wd-dashboard__fraction">
          {{ stats.done }} / {{ stats.total }} labs<br />
          {{ stats.topicsDone }} / {{ stats.topicsTotal }} topics
        </span>
      </div>
    </div>

    <div
      class="wd-meter wd-meter--large"
      role="progressbar"
      aria-label="Overall lab completion"
      :aria-valuenow="stats.percent"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <span class="wd-meter__fill" :style="{ width: `${stats.percent}%` }"></span>
    </div>

    <!-- 5-Card Quick Stats Bar -->
    <div class="wd-statgrid">
      <div class="wd-statcard">
        <span class="wd-statcard__val">⚡ {{ stats.xp || 0 }}</span>
        <span class="wd-statcard__label">{{ stats.rankTitle || '🔎 Rookie Observer' }}</span>
      </div>
      <div class="wd-statcard">
        <span class="wd-statcard__val">{{ stats.done }}<small>/{{ stats.total }}</small></span>
        <span class="wd-statcard__label">🧪 Labs Solved</span>
      </div>
      <div class="wd-statcard">
        <span class="wd-statcard__val">{{ stats.topicsDone }}<small>/{{ stats.topicsTotal }}</small></span>
        <span class="wd-statcard__label">📁 Case Files Completed</span>
      </div>
      <div
        class="wd-statcard"
        role="button"
        tabindex="0"
        @click="activeTab = 'bookmarks'"
        @keydown.enter.prevent="activeTab = 'bookmarks'"
        @keydown.space.prevent="activeTab = 'bookmarks'"
      >
        <span class="wd-statcard__val">{{ stats.bookmarksCount }}</span>
        <span class="wd-statcard__label">★ Saved for Review</span>
      </div>
      <div
        class="wd-statcard"
        role="button"
        tabindex="0"
        @click="activeTab = 'notes'"
        @keydown.enter.prevent="activeTab = 'notes'"
        @keydown.space.prevent="activeTab = 'notes'"
      >
        <span class="wd-statcard__val">{{ stats.notesCount }}</span>
        <span class="wd-statcard__label">📝 Personal Notes</span>
      </div>
    </div>

    <!-- View Switcher Tabs -->
    <div class="wd-dashtabs" role="tablist" aria-label="Dashboard views">
      <button
        type="button"
        class="wd-dashtab"
        :class="{ 'is-active': activeTab === 'stages' }"
        @click="activeTab = 'stages'"
      >
        🗺️ 6-Stage Learning Path
      </button>
      <button
        type="button"
        class="wd-dashtab"
        :class="{ 'is-active': activeTab === 'bookmarks' }"
        @click="activeTab = 'bookmarks'"
      >
        ★ Saved for Review ({{ stats.bookmarksCount }})
      </button>
      <button
        type="button"
        class="wd-dashtab"
        :class="{ 'is-active': activeTab === 'notes' }"
        @click="activeTab = 'notes'"
      >
        📝 My Study Notes ({{ stats.notesCount }})
      </button>
    </div>

    <!-- TAB 1: 6-Stage Learning Path -->
    <div id="syllabus" v-show="activeTab === 'stages'">
      <div v-for="group in groups" :key="group.id" class="wd-dashboard__group">
        <div class="wd-stagehead">
          <div>
            <h3 class="wd-dashboard__grouptitle">{{ group.icon }} {{ group.title }}</h3>
            <p class="wd-stagehead__sub">{{ group.subtitle }}</p>
          </div>
          <span class="wd-stagehead__badge">
            {{ group.stageDone }} / {{ group.stageTotal }} labs ({{ group.stagePercent }}%)
          </span>
        </div>

        <div class="wd-dashboard__grid">
          <article
            v-for="unit in group.units"
            :key="unit.id"
            class="wd-module"
            :class="{ 'is-complete': unit.stats.topicDone }"
          >
            <div class="wd-module__top">
              <div>
                <span class="wd-module__step">Step {{ String(unit.stepNumber).padStart(2, '0') }}</span>
                <a class="wd-module__link" :href="withBase(unit.path)">{{ unit.title }}</a>
              </div>
              <div class="wd-module__topmeta">
                <button
                  type="button"
                  class="wd-starbtn"
                  :class="{ 'is-active': unit.stats.bookmarked }"
                  :title="unit.stats.bookmarked ? 'Remove bookmark' : 'Bookmark topic for review'"
                  @click="toggleTopicBookmark(unit.id)"
                >
                  {{ unit.stats.bookmarked ? '★' : '☆' }}
                </button>
                <span class="wd-module__count">{{ unit.stats.done }}/{{ unit.stats.total }}</span>
              </div>
            </div>
            <p class="wd-module__blurb">{{ unit.blurb }}</p>
            <div
              class="wd-meter wd-meter--small"
              role="progressbar"
              :aria-label="`${unit.title} labs solved`"
              :aria-valuenow="unit.stats.percent"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <span class="wd-meter__fill" :style="{ width: `${unit.stats.percent}%` }"></span>
            </div>
            <div class="wd-module__foot">
              <span>⏱ ~{{ unit.readingMinutes }}m · {{ unit.stats.percent }}% solved</span>
              <button
                type="button"
                class="wd-module__topic"
                :data-topic-id="unit.id"
                :aria-pressed="unit.stats.topicDone"
                @click="toggleTopic(unit.id)"
              >
                {{ unit.stats.topicDone ? 'Completed ✓' : 'Mark complete' }}
              </button>
            </div>
          </article>
        </div>
      </div>
    </div>

    <!-- TAB 2: Bookmarked Items -->
    <div v-show="activeTab === 'bookmarks'" class="wd-dashpanel">
      <p v-if="!bookmarkedTopics.length && !bookmarkedLabs.length" class="wd-dashpanel__empty">
        You haven't starred any topics or labs yet. Click the <strong>☆ Review Later</strong> button on any topic or lab card to save tricky concepts here.
      </p>

      <div v-if="bookmarkedTopics.length" class="wd-dashpanel__section">
        <h4>★ Saved Topics ({{ bookmarkedTopics.length }})</h4>
        <div class="wd-dashpanel__list">
          <div v-for="t in bookmarkedTopics" :key="t.id" class="wd-dashpanel__item">
            <div>
              <span class="wd-badge wd-badge--stage">{{ t.stageShort }}</span>
              <a :href="withBase(t.path)" class="wd-dashpanel__link">{{ t.title }}</a>
            </div>
            <button type="button" class="wd-filterpill" @click="toggleTopicBookmark(t.id)">
              Remove ★
            </button>
          </div>
        </div>
      </div>

      <div v-if="bookmarkedLabs.length" class="wd-dashpanel__section">
        <h4>★ Saved Labs ({{ bookmarkedLabs.length }})</h4>
        <div class="wd-dashpanel__list">
          <div v-for="l in bookmarkedLabs" :key="l.id" class="wd-dashpanel__item">
            <div>
              <span class="wd-badge" :class="`wd-badge--${(l.difficulty || '').toLowerCase()}`">
                {{ l.difficulty }}
              </span>
              <a :href="`${withBase(l.path)}#${l.id}`" class="wd-dashpanel__link">{{ l.title }}</a>
            </div>
            <button type="button" class="wd-filterpill" @click="toggleLabBookmark(l.id)">
              Remove ★
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: Personal Notes -->
    <div v-show="activeTab === 'notes'" class="wd-dashpanel">
      <p v-if="!allNotes.length" class="wd-dashpanel__empty">
        You haven't written any personal study notes yet. Click <strong>📝 Add Topic Note</strong> at the top of any page or <strong>📝 Note</strong> on any lab card to write your own takeaways.
      </p>
      <div v-else class="wd-dashpanel__list">
        <div v-for="n in allNotes" :key="`${n.type}-${n.id}`" class="wd-notecard">
          <div class="wd-notecard__head">
            <span class="wd-badge wd-badge--stage">{{ n.type }}</span>
            <a :href="withBase(n.link)" class="wd-dashpanel__link">{{ n.title }} →</a>
          </div>
          <p class="wd-notecard__body">{{ n.text }}</p>
        </div>
      </div>
    </div>

    <!-- Footer with Backup / Restore / Reset -->
    <div class="wd-dashboard__foot">
      <div class="wd-backup">
        <button type="button" class="wd-backupbtn" @click="onExport">
          ⬇ Export Backup (.json)
        </button>
        <button type="button" class="wd-backupbtn" @click="triggerImport">
          ⬆ Restore Backup
        </button>
        <input
          ref="fileInput"
          type="file"
          accept="application/json,.json"
          style="display: none"
          @change="onImportFile"
        />
        <span v-if="statusMsg" class="wd-backup__status">{{ statusMsg }}</span>
      </div>
      <button type="button" class="wd-reset" @click="onReset">Reset progress</button>
    </div>
  </section>
</template>
