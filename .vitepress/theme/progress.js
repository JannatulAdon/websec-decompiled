import { reactive } from 'vue'
import { labs, studyUnits, totalLabs, labsFor } from './labs.js'

export const STORAGE_KEY = 'websec-decompiled:progress:v1'

/**
 * Shared reactive store. `ready` stays false during SSR and during the first
 * client render so hydration sees exactly what the server produced. The real
 * localStorage snapshot is loaded in onMounted().
 */
export const progress = reactive({
  labs: {},
  topics: {},
  bookmarks: {
    labs: {},
    topics: {}
  },
  notes: {
    labs: {},
    topics: {}
  },
  interactive: {
    sandbox: {},
    story: {},
    puzzle: {},
    quiz: {}
  },
  ui: {
    pageView: 'playground',
    readingExpanded: false,
    themePalette: 'ocean'
  },
  filters: {
    difficulty: 'all',
    hideSolved: false,
    onlyBookmarked: false
  },
  ready: false
})

let storageBound = false

function cleanMap(obj) {
  const out = {}
  if (obj && typeof obj === 'object') {
    for (const [id, val] of Object.entries(obj)) {
      if (val) out[id] = val
    }
  }
  return out
}

function cleanTextMap(obj) {
  const out = {}
  if (obj && typeof obj === 'object') {
    for (const [id, val] of Object.entries(obj)) {
      if (typeof val === 'string' && val.trim().length > 0) {
        out[id] = val
      }
    }
  }
  return out
}

function normalize(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return {
      labs: {},
      topics: {},
      bookmarks: { labs: {}, topics: {} },
      notes: { labs: {}, topics: {} },
      interactive: { sandbox: {}, story: {}, puzzle: {}, quiz: {} }
    }
  }
  return {
    labs: cleanMap(parsed.labs),
    topics: cleanMap(parsed.topics),
    bookmarks: {
      labs: cleanMap(parsed.bookmarks?.labs),
      topics: cleanMap(parsed.bookmarks?.topics)
    },
    notes: {
      labs: cleanTextMap(parsed.notes?.labs),
      topics: cleanTextMap(parsed.notes?.topics)
    },
    interactive: {
      sandbox: cleanMap(parsed.interactive?.sandbox),
      story: cleanMap(parsed.interactive?.story),
      puzzle: cleanMap(parsed.interactive?.puzzle),
      quiz: cleanMap(parsed.interactive?.quiz)
    }
  }
}

function readSnapshot() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? normalize(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

function applySnapshot(snapshot) {
  const s = snapshot || normalize(null)
  progress.labs = s.labs
  progress.topics = s.topics
  progress.bookmarks.labs = s.bookmarks.labs
  progress.bookmarks.topics = s.bookmarks.topics
  progress.notes.labs = s.notes.labs
  progress.notes.topics = s.notes.topics
  progress.interactive.sandbox = s.interactive.sandbox
  progress.interactive.story = s.interactive.story
  progress.interactive.puzzle = s.interactive.puzzle
  progress.interactive.quiz = s.interactive.quiz
}

function bindStorage() {
  if (storageBound || typeof window === 'undefined') return
  storageBound = true
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return
    applySnapshot(readSnapshot())
  })
}

export const THEME_PALETTES = [
  { id: 'ocean', label: '🌊 Ocean Slate', desc: 'Deep navy & luminous teal' },
  { id: 'sage', label: '🌲 Matcha Forest', desc: 'Warm forest charcoal & soft sage' },
  { id: 'indigo', label: '🔮 Velvet Indigo', desc: 'Editorial midnight & soft violet' },
  { id: 'espresso', label: '☕ Warm Espresso', desc: 'Zero-glare warm sand & amber' }
]

export function applyThemePalette(paletteId) {
  const valid = THEME_PALETTES.some((p) => p.id === paletteId) ? paletteId : 'ocean'
  progress.ui.themePalette = valid
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.wdTheme = valid
  }
}

export function setThemePalette(paletteId) {
  applyThemePalette(paletteId)
  persist()
}

/** Load from localStorage. Safe to call repeatedly and on the server. */
export function initProgress() {
  if (typeof window === 'undefined') return
  if (!progress.ready) {
    const rawSnap = readSnapshot()
    applySnapshot(rawSnap)
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
      if (parsed.themePalette) applyThemePalette(parsed.themePalette)
      else applyThemePalette('ocean')
    } catch {
      applyThemePalette('ocean')
    }
    progress.ready = true
  }
  bindStorage()
}

function persist() {
  if (typeof window === 'undefined') return
  const payload = {
    version: 3,
    updatedAt: new Date().toISOString(),
    themePalette: progress.ui.themePalette,
    labs: progress.labs,
    topics: progress.topics,
    bookmarks: {
      labs: progress.bookmarks.labs,
      topics: progress.bookmarks.topics
    },
    notes: {
      labs: cleanTextMap(progress.notes.labs),
      topics: cleanTextMap(progress.notes.topics)
    },
    interactive: {
      sandbox: progress.interactive.sandbox,
      story: progress.interactive.story,
      puzzle: progress.interactive.puzzle,
      quiz: progress.interactive.quiz
    }
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* Storage may be full or disabled (private mode). The UI still works in-memory. */
  }
}

export function isLabDone(id) {
  return Boolean(progress.labs[id])
}

export function isTopicDone(id) {
  return Boolean(progress.topics[id])
}

export function setLab(id, done) {
  if (typeof window === 'undefined') return
  if (!progress.ready) initProgress()
  if (done) progress.labs[id] = new Date().toISOString()
  else delete progress.labs[id]
  persist()
}

export function toggleLab(id) {
  setLab(id, !isLabDone(id))
}

export function setTopic(id, done) {
  if (typeof window === 'undefined') return
  if (!progress.ready) initProgress()
  if (done) progress.topics[id] = new Date().toISOString()
  else delete progress.topics[id]
  persist()
}

export function toggleTopic(id) {
  setTopic(id, !isTopicDone(id))
}

/* Interactive Activity Completion (+XP) */
export function markActivityDone(type, unitId) {
  if (typeof window === 'undefined') return
  if (!progress.ready) initProgress()
  if (!progress.interactive[type]) return
  if (!progress.interactive[type][unitId]) {
    progress.interactive[type][unitId] = new Date().toISOString()
    persist()
  }
}

export function isActivityDone(type, unitId) {
  return Boolean(progress.interactive?.[type]?.[unitId])
}

/* Bookmarks (Review Later stars) */
export function isLabBookmarked(id) {
  return Boolean(progress.bookmarks.labs[id])
}

export function toggleLabBookmark(id) {
  if (typeof window === 'undefined') return
  if (!progress.ready) initProgress()
  if (progress.bookmarks.labs[id]) delete progress.bookmarks.labs[id]
  else progress.bookmarks.labs[id] = new Date().toISOString()
  persist()
}

export function isTopicBookmarked(id) {
  return Boolean(progress.bookmarks.topics[id])
}

export function toggleTopicBookmark(id) {
  if (typeof window === 'undefined') return
  if (!progress.ready) initProgress()
  if (progress.bookmarks.topics[id]) delete progress.bookmarks.topics[id]
  else progress.bookmarks.topics[id] = new Date().toISOString()
  persist()
}

let persistTimer = null
function persistDebounced() {
  if (typeof window === 'undefined') return
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    persistTimer = null
    persist()
  }, 300)
}

/* Personal Notes */
export function getLabNote(id) {
  return progress.notes.labs[id] || ''
}

export function setLabNote(id, text) {
  if (typeof window === 'undefined') return
  if (!progress.ready) initProgress()
  if (typeof text === 'string' && text.trim().length > 0) {
    progress.notes.labs[id] = text
  } else {
    delete progress.notes.labs[id]
  }
  persistDebounced()
}

export function getTopicNote(id) {
  return progress.notes.topics[id] || ''
}

export function setTopicNote(id, text) {
  if (typeof window === 'undefined') return
  if (!progress.ready) initProgress()
  if (typeof text === 'string' && text.trim().length > 0) {
    progress.notes.topics[id] = text
  } else {
    delete progress.notes.topics[id]
  }
  persistDebounced()
}

export function resetProgress() {
  progress.labs = {}
  progress.topics = {}
  progress.bookmarks.labs = {}
  progress.bookmarks.topics = {}
  progress.notes.labs = {}
  progress.notes.topics = {}
  progress.interactive.sandbox = {}
  progress.interactive.story = {}
  progress.interactive.puzzle = {}
  progress.interactive.quiz = {}
  persist()
}

export function exportProgressData() {
  const payload = {
    version: 3,
    exportedAt: new Date().toISOString(),
    labs: progress.labs,
    topics: progress.topics,
    bookmarks: progress.bookmarks,
    notes: progress.notes,
    interactive: progress.interactive
  }
  return JSON.stringify(payload, null, 2)
}

export function importProgressData(rawJson) {
  if (typeof window === 'undefined') return false
  try {
    const parsed = JSON.parse(rawJson)
    const normalized = normalize(parsed)
    applySnapshot(normalized)
    progress.ready = true
    persist()
    return true
  } catch {
    return false
  }
}

export function getRankForXp(xp) {
  if (xp >= 15000) return { title: '👑 Master Detective', nextXp: 30000 }
  if (xp >= 6000) return { title: '⚡ Senior Bug Hunter', nextXp: 15000 }
  if (xp >= 2000) return { title: '🔬 Logic Decompiler', nextXp: 6000 }
  if (xp >= 500) return { title: '🕵️ Field Investigator', nextXp: 2000 }
  return { title: '🔎 Rookie Observer', nextXp: 500 }
}

export function overallStats() {
  const done = labs.filter((lab) => progress.labs[lab.id]).length
  const topicsDone = studyUnits.filter((unit) => progress.topics[unit.id]).length
  const bookmarksCount =
    Object.keys(progress.bookmarks.labs).length +
    Object.keys(progress.bookmarks.topics).length
  const notesCount =
    Object.keys(progress.notes.labs).filter((k) => progress.notes.labs[k]?.trim()).length +
    Object.keys(progress.notes.topics).filter((k) => progress.notes.topics[k]?.trim()).length

  const sandboxCount = Object.keys(progress.interactive.sandbox).length
  const storyCount = Object.keys(progress.interactive.story).length
  const puzzleCount = Object.keys(progress.interactive.puzzle).length
  const quizCount = Object.keys(progress.interactive.quiz).length

  const xp =
    done * 100 +
    topicsDone * 50 +
    sandboxCount * 25 +
    storyCount * 20 +
    puzzleCount * 30 +
    quizCount * 40

  const rank = getRankForXp(xp)

  return {
    done,
    total: totalLabs,
    percent: totalLabs === 0 ? 0 : Math.round((done / totalLabs) * 100),
    topicsDone,
    topicsTotal: studyUnits.length,
    bookmarksCount,
    notesCount,
    sandboxCount,
    storyCount,
    puzzleCount,
    quizCount,
    xp,
    rankTitle: rank.title,
    nextXp: rank.nextXp
  }
}

export function moduleStats(moduleId) {
  const list = labsFor(moduleId)
  const done = list.filter((lab) => progress.labs[lab.id]).length
  const sandboxDone = isActivityDone('sandbox', moduleId)
  const storyDone = isActivityDone('story', moduleId)
  const puzzleDone = isActivityDone('puzzle', moduleId)
  const quizDone = isActivityDone('quiz', moduleId)
  const activitiesDone = [sandboxDone, storyDone, puzzleDone, quizDone].filter(Boolean).length

  return {
    done,
    total: list.length,
    percent: list.length === 0 ? 0 : Math.round((done / list.length) * 100),
    topicDone: isTopicDone(moduleId),
    bookmarked: isTopicBookmarked(moduleId),
    hasNote: Boolean(progress.notes.topics[moduleId]?.trim()),
    sandboxDone,
    storyDone,
    puzzleDone,
    quizDone,
    activitiesDone
  }
}

/** First lab in 6-Stage Learning Path order that is not solved. */
export function nextUnsolvedLab() {
  return labs.find((lab) => !progress.labs[lab.id]) || null
}

/** First study unit in 6-Stage Learning Path order that is not marked complete or has unsolved labs. */
export function nextRecommendedUnit() {
  return (
    studyUnits.find((unit) => {
      if (progress.topics[unit.id]) return false
      const unitLabs = labsFor(unit.id)
      const allSolved = unitLabs.length > 0 && unitLabs.every((l) => progress.labs[l.id])
      return !allSolved
    }) || studyUnits[0]
  )
}
