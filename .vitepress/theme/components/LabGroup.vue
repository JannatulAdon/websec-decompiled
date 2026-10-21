<script setup>
import { computed, reactive } from 'vue'
import { labById } from '../labs.js'
import { contentFor } from '../data/content/index.js'
import { progress, isLabDone, isLabBookmarked } from '../progress.js'
import LabCheckbox from './LabCheckbox.vue'

const props = defineProps({
  ids: { type: String, required: true }
})

const unlockedHints = reactive({})
const activeTokenIdx = reactive({})
const showAllTokens = reactive({})

function getUnlockedCount(labId) {
  return unlockedHints[labId] || 1
}

function unlockNextHint(labId, total) {
  const current = getUnlockedCount(labId)
  if (current < total) {
    unlockedHints[labId] = current + 1
  }
}

function resetHints(labId) {
  unlockedHints[labId] = 1
}

function getTokenStep(labId) {
  return activeTokenIdx[labId] || 0
}

function setTokenStep(labId, idx, total) {
  if (idx >= 0 && idx < total) {
    activeTokenIdx[labId] = idx
  }
}

const hintLabels = [
  'Clue 1 · Where to Look (Recon)',
  'Clue 2 · What the Server Trusts',
  'Clue 3 · Exact Exploit Action'
]

/**
 * Safely splits backtick-delimited inline code (`foo`) into segments so
 * templates can render <code> pills without v-html.
 */
function tokenizeInlineCode(str) {
  if (!str || typeof str !== 'string') return []
  const parts = str.split(/(`[^`]+`)/g).filter(Boolean)
  return parts.map((part) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return { code: true, text: part.slice(1, -1) }
    }
    return { code: false, text: part }
  })
}

/**
 * Ensures every single lab has a progressive 3-clue sequence even if only a
 * concise `note` was authored in the content file.
 */
function buildFallbackHints(lab, note) {
  if (!note) return []
  const codeMatches = Array.from(note.matchAll(/`([^`]+)`/g)).map((m) => m[1])
  const clauses = note
    .split(/;\s*|\.\s+(?=[A-Z`])/)
    .map((s) => s.trim().replace(/\.$/, ''))
    .filter(Boolean)

  const surfaceHint = codeMatches.length
    ? `Inspect the request and response flow around \`${codeMatches[0]}\` while testing "${lab.title}".`
    : `Map the normal request/response cycle for "${lab.title}" in Burp Proxy HTTP history.`

  if (clauses.length >= 2) {
    return [
      surfaceHint,
      `${clauses[0]}.`,
      `${clauses.slice(1).join('; ')}.`
    ]
  }

  return [
    surfaceHint,
    `Notice what input or state the backend accepts without strict server-side verification in "${lab.title}".`,
    note
  ]
}

const items = computed(() =>
  props.ids
    .split(/[,\s]+/)
    .filter(Boolean)
    .map((id) => {
      const lab = labById(id)
      if (!lab) return { id, missing: true }
      const content = contentFor(id) || {}
      const hints = content.work?.hints?.length
        ? content.work.hints
        : buildFallbackHints(lab, content.note)
      return { ...lab, content, effectiveHints: hints }
    })
)

function isLabVisible(lab) {
  if (lab.missing || !progress.ready) return true
  const f = progress.filters
  if (f.difficulty !== 'all' && lab.difficulty !== f.difficulty) return false
  if (f.hideSolved && isLabDone(lab.id)) return false
  if (f.onlyBookmarked && !isLabBookmarked(lab.id)) return false
  return true
}
</script>

<template>
  <div class="wd-labs">
    <article
      v-for="lab in items"
      v-show="isLabVisible(lab)"
      :id="lab.id"
      :key="lab.id"
      class="wd-labcard"
      :class="{
        'is-worked': lab.content?.work,
        'is-solved': progress.ready && isLabDone(lab.id),
        'is-bookmarked': progress.ready && isLabBookmarked(lab.id)
      }"
    >
      <template v-if="lab.missing">
        <p class="wd-labcard__missing">Unknown lab id: {{ lab.id }}</p>
      </template>
      <template v-else>
        <header class="wd-labcard__head">
          <div class="wd-labcard__meta">
            <span class="wd-badge" :class="`wd-badge--${(lab.difficulty || '').toLowerCase()}`">
              {{ lab.difficulty }}
            </span>
            <span v-if="lab.content?.work" class="wd-badge wd-badge--worked">
              🔍 Full Deconstructed Walkthrough
            </span>
            <span v-else class="wd-badge wd-badge--guided">
              💡 3-Stage Progressive Clues
            </span>
            <span v-if="progress.ready && isLabDone(lab.id)" class="wd-badge wd-badge--solved">
              ✓ Solved (+100 XP)
            </span>
          </div>
          <h3 class="wd-labcard__title">{{ lab.title }}</h3>
          <p v-if="lab.content?.note" class="wd-labcard__note">
            <template v-for="(seg, sIdx) in tokenizeInlineCode(lab.content.note)" :key="sIdx">
              <code v-if="seg.code" class="wd-inlinecode">{{ seg.text }}</code>
              <span v-else>{{ seg.text }}</span>
            </template>
          </p>
        </header>

        <div class="wd-labcard__actions">
          <a class="wd-labcard__launch" :href="lab.url" target="_blank" rel="noopener noreferrer">
            Launch Lab on PortSwigger <span aria-hidden="true">↗</span>
          </a>
          <LabCheckbox :lab-id="lab.id" />
        </div>

        <!-- 1-Clue-at-a-Time Progressive Hint Drawer (Now on 100% of Labs!) -->
        <details v-if="lab.effectiveHints?.length" class="wd-work">
          <summary>
            💡 Step-by-Step Clues ({{ getUnlockedCount(lab.id) }} / {{ lab.effectiveHints.length }} unlocked)
          </summary>
          <div class="wd-work__hints-progressive">
            <ol class="wd-work__hints">
              <li
                v-for="(hint, i) in lab.effectiveHints.slice(0, getUnlockedCount(lab.id))"
                :key="i"
              >
                <span class="wd-work__hintlevel">{{ hintLabels[i] || `Clue ${i + 1}` }}</span>
                <span>
                  <template v-for="(seg, sIdx) in tokenizeInlineCode(hint)" :key="sIdx">
                    <code v-if="seg.code" class="wd-inlinecode">{{ seg.text }}</code>
                    <span v-else>{{ seg.text }}</span>
                  </template>
                </span>
              </li>
            </ol>
            <div class="wd-work__hintactions">
              <button
                v-if="getUnlockedCount(lab.id) < lab.effectiveHints.length"
                type="button"
                class="wd-hintbtn"
                @click="unlockNextHint(lab.id, lab.effectiveHints.length)"
              >
                🔓 Reveal {{ hintLabels[getUnlockedCount(lab.id)] || `Clue ${getUnlockedCount(lab.id) + 1}` }} →
              </button>
              <button
                v-else-if="lab.effectiveHints.length > 1"
                type="button"
                class="wd-hintbtn wd-hintbtn--ghost"
                @click="resetHints(lab.id)"
              >
                Hide extra clues
              </button>
            </div>
          </div>
        </details>

        <!-- Deep Deconstructed Solution Stepper (on worked flagship labs) -->
        <details v-if="lab.content?.work" class="wd-work wd-work--solution">
          <summary>🔓 Interactive Solution Stepper &amp; Breakdown</summary>

          <p v-if="lab.content.work.approach" class="wd-work__approach">
            <template v-for="(seg, sIdx) in tokenizeInlineCode(lab.content.work.approach)" :key="sIdx">
              <code v-if="seg.code" class="wd-inlinecode">{{ seg.text }}</code>
              <span v-else>{{ seg.text }}</span>
            </template>
          </p>

          <h4>1 · Raw HTTP Request</h4>
          <pre class="wd-work__code"><code>{{ lab.content.work.request }}</code></pre>

          <div v-if="lab.content.work.tokens?.length" class="wd-tokenstepper">
            <div class="wd-tokenstepper__head">
              <h4>2 · Click Through Each Piece ({{ getTokenStep(lab.id) + 1 }} of {{ lab.content.work.tokens.length }})</h4>
              <button
                type="button"
                class="wd-filterpill"
                @click="showAllTokens[lab.id] = !showAllTokens[lab.id]"
              >
                {{ showAllTokens[lab.id] ? 'Step-by-Step View' : 'Show Full Table' }}
              </button>
            </div>

            <!-- Interactive Token Pills -->
            <div class="wd-tokenstepper__pills">
              <button
                v-for="(row, tIdx) in lab.content.work.tokens"
                :key="tIdx"
                type="button"
                class="wd-tokenpill"
                :class="{ 'is-active': getTokenStep(lab.id) === tIdx }"
                @click="setTokenStep(lab.id, tIdx, lab.content.work.tokens.length)"
              >
                <span class="wd-tokenpill__num">{{ tIdx + 1 }}</span>
                <code>{{ row[0] }}</code>
              </button>
            </div>

            <!-- Active Token Spotlight Card -->
            <div
              v-if="!showAllTokens[lab.id] && lab.content.work.tokens[getTokenStep(lab.id)]"
              class="wd-tokenstepper__card"
            >
              <div class="wd-tokenstepper__piece">
                <span class="wd-xraycard__step">PIECE {{ getTokenStep(lab.id) + 1 }} OF {{ lab.content.work.tokens.length }}</span>
                <code class="wd-tokenstepper__code">{{ lab.content.work.tokens[getTokenStep(lab.id)][0] }}</code>
              </div>
              <p class="wd-tokenstepper__desc">
                <template
                  v-for="(seg, sIdx) in tokenizeInlineCode(lab.content.work.tokens[getTokenStep(lab.id)][1])"
                  :key="sIdx"
                >
                  <code v-if="seg.code" class="wd-inlinecode">{{ seg.text }}</code>
                  <span v-else>{{ seg.text }}</span>
                </template>
              </p>
              <div class="wd-tokenstepper__nav">
                <button
                  type="button"
                  class="wd-hintbtn wd-hintbtn--ghost"
                  :disabled="getTokenStep(lab.id) === 0"
                  @click="setTokenStep(lab.id, getTokenStep(lab.id) - 1, lab.content.work.tokens.length)"
                >
                  ◀ Prev Piece
                </button>
                <button
                  type="button"
                  class="wd-hintbtn"
                  :disabled="getTokenStep(lab.id) >= lab.content.work.tokens.length - 1"
                  @click="setTokenStep(lab.id, getTokenStep(lab.id) + 1, lab.content.work.tokens.length)"
                >
                  Next Piece ▶
                </button>
              </div>
            </div>

            <!-- Optional Full Table View -->
            <div v-else class="wd-work__tablewrap">
              <table class="wd-work__table">
                <thead>
                  <tr><th>Piece</th><th>What it actually does on the server</th></tr>
                </thead>
                <tbody>
                  <tr v-for="(row, i) in lab.content.work.tokens" :key="i">
                    <td><code>{{ row[0] }}</code></td>
                    <td>
                      <template v-for="(seg, sIdx) in tokenizeInlineCode(row[1])" :key="sIdx">
                        <code v-if="seg.code" class="wd-inlinecode">{{ seg.text }}</code>
                        <span v-else>{{ seg.text }}</span>
                      </template>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <details class="wd-work__scriptdrawer">
            <summary>🐍 View Optional Python Verification Script</summary>
            <pre class="wd-work__code"><code>{{ lab.content.work.script }}</code></pre>
          </details>
        </details>
      </template>
    </article>
  </div>
</template>
