<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { labById } from '../labs.js'
import {
  initProgress,
  isLabDone,
  isLabBookmarked,
  toggleLabBookmark,
  getLabNote,
  setLabNote,
  progress,
  toggleLab
} from '../progress.js'

const props = defineProps({
  labId: { type: String, required: true },
  inlineTools: { type: Boolean, default: true }
})

const rootEl = ref(null)
const showNote = ref(false)
const noteDraft = ref('')
const savedTick = ref(false)

const checked = computed(() => progress.ready && isLabDone(props.labId))
const bookmarked = computed(() => progress.ready && isLabBookmarked(props.labId))
const hasNote = computed(() => progress.ready && Boolean(getLabNote(props.labId).trim()))
const labMeta = computed(() => labById(props.labId))

const matchesFilter = computed(() => {
  if (!progress.ready || !labMeta.value) return true
  const f = progress.filters
  if (f.difficulty !== 'all' && labMeta.value.difficulty !== f.difficulty) return false
  if (f.hideSolved && checked.value) return false
  if (f.onlyBookmarked && !bookmarked.value) return false
  return true
})

function syncStandaloneContainer() {
  if (!rootEl.value) return
  const parentLab = rootEl.value.closest('section.wd-lab')
  if (!parentLab) return
  parentLab.style.display = matchesFilter.value ? '' : 'none'
}

function enhanceStandaloneHints() {
  if (!rootEl.value) return
  const parentLab = rootEl.value.closest('section.wd-lab')
  if (!parentLab || parentLab.dataset.hintsEnhanced === '1') return

  const detailsList = parentLab.querySelectorAll('details')
  for (const det of detailsList) {
    const summary = det.querySelector('summary')
    if (!summary) continue

    if (summary.textContent.includes('💡')) {
      const children = Array.from(det.children).filter((el) => el.tagName !== 'SUMMARY')
      const groups = []
      let currentGroup = []
      for (const child of children) {
        const text = child.textContent || ''
        if (/^Level\s+[123]/i.test(text.trim()) && currentGroup.length > 0) {
          groups.push(currentGroup)
          currentGroup = [child]
        } else {
          currentGroup.push(child)
        }
      }
      if (currentGroup.length > 0) groups.push(currentGroup)
      if (groups.length > 1) {
        let unlocked = 1
        const btnWrap = document.createElement('div')
        btnWrap.className = 'wd-work__hintactions'
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'wd-hintbtn'

        const renderState = () => {
          groups.forEach((grp, idx) => {
            const show = idx < unlocked
            grp.forEach((el) => {
              el.style.display = show ? '' : 'none'
            })
          })
          summary.textContent = `💡 Step-by-Step Clues (${unlocked} / ${groups.length} unlocked)`
          if (unlocked < groups.length) {
            btn.textContent = `🔓 Reveal Clue ${unlocked + 1} of ${groups.length} →`
            btn.className = 'wd-hintbtn'
          } else {
            btn.textContent = 'Hide extra clues'
            btn.className = 'wd-hintbtn wd-hintbtn--ghost'
          }
        }

        btn.addEventListener('click', () => {
          if (unlocked < groups.length) unlocked += 1
          else unlocked = 1
          renderState()
        })

        btnWrap.appendChild(btn)
        det.appendChild(btnWrap)
        renderState()
      }
    }

    if (summary.textContent.includes('🔓')) {
      const table = det.querySelector('table')
      if (!table) continue
      const rows = Array.from(table.querySelectorAll('tbody tr'))
      if (rows.length < 2) continue

      const pieces = rows.map((tr) => {
        const cells = tr.querySelectorAll('td')
        return {
          token: cells[0]?.textContent?.trim() || '',
          desc: Array.from(cells)
            .slice(1)
            .map((c) => c.textContent?.trim())
            .filter(Boolean)
            .join(' — ')
        }
      })

      let currentIdx = 0
      let showTable = false

      const stepper = document.createElement('div')
      stepper.className = 'wd-tokenstepper'

      const renderStepper = () => {
        table.style.display = showTable ? '' : 'none'
        const p = pieces[currentIdx]
        stepper.innerHTML = `
          <div class="wd-tokenstepper__head">
            <h4>Interactive Piece-by-Piece Breakdown (${currentIdx + 1} of ${pieces.length})</h4>
            <button type="button" class="wd-filterpill" data-action="toggle-table">
              ${showTable ? 'Hide Full Table' : 'Show Full Table'}
            </button>
          </div>
          <div class="wd-tokenstepper__pills">
            ${pieces
              .map(
                (item, i) => `
              <button type="button" class="wd-tokenpill ${i === currentIdx ? 'is-active' : ''}" data-idx="${i}">
                <span class="wd-tokenpill__num">${i + 1}</span>
                <code></code>
              </button>
            `
              )
              .join('')}
          </div>
          <div class="wd-tokenstepper__card">
            <div class="wd-tokenstepper__piece">
              <span class="wd-xraycard__step">PIECE ${currentIdx + 1} OF ${pieces.length}</span>
              <code class="wd-tokenstepper__code"></code>
            </div>
            <p class="wd-tokenstepper__desc"></p>
            <div class="wd-tokenstepper__nav">
              <button type="button" class="wd-hintbtn wd-hintbtn--ghost" data-action="prev" ${currentIdx === 0 ? 'disabled' : ''}>◀ Prev Piece</button>
              <button type="button" class="wd-hintbtn" data-action="next" ${currentIdx >= pieces.length - 1 ? 'disabled' : ''}>Next Piece ▶</button>
            </div>
          </div>
        `
        stepper.querySelectorAll('.wd-tokenpill code').forEach((codeEl, idx) => {
          codeEl.textContent = pieces[idx].token
        })
        const activeCode = stepper.querySelector('.wd-tokenstepper__code')
        if (activeCode) activeCode.textContent = p.token
        const activeDesc = stepper.querySelector('.wd-tokenstepper__desc')
        if (activeDesc) activeDesc.textContent = p.desc

        stepper.querySelector('[data-action="toggle-table"]')?.addEventListener('click', () => {
          showTable = !showTable
          renderStepper()
        })
        stepper.querySelector('[data-action="prev"]')?.addEventListener('click', () => {
          if (currentIdx > 0) {
            currentIdx -= 1
            renderStepper()
          }
        })
        stepper.querySelector('[data-action="next"]')?.addEventListener('click', () => {
          if (currentIdx < pieces.length - 1) {
            currentIdx += 1
            renderStepper()
          }
        })
        stepper.querySelectorAll('.wd-tokenpill').forEach((pill) => {
          pill.addEventListener('click', () => {
            currentIdx = Number(pill.dataset.idx) || 0
            renderStepper()
          })
        })
      }

      table.parentNode.insertBefore(stepper, table)
      renderStepper()
    }
  }
  parentLab.dataset.hintsEnhanced = '1'
}

onMounted(() => {
  initProgress()
  noteDraft.value = getLabNote(props.labId)
  syncStandaloneContainer()
  enhanceStandaloneHints()
})

watch(matchesFilter, () => {
  syncStandaloneContainer()
})

function onChange(event) {
  toggleLab(props.labId)
  event.target.checked = checked.value
}

function onNoteInput(e) {
  noteDraft.value = e.target.value
  setLabNote(props.labId, noteDraft.value)
  savedTick.value = true
  setTimeout(() => {
    savedTick.value = false
  }, 1200)
}
</script>

<template>
  <div ref="rootEl" class="wd-labtools">
    <div class="wd-labtools__row">
      <label class="wd-check" :class="{ 'is-done': checked }">
        <input
          type="checkbox"
          :data-lab-id="labId"
          :checked="checked"
          :aria-label="`Mark lab ${labId} as solved`"
          @change="onChange"
        />
        <span class="wd-check__box" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="12" height="12">
            <path
              d="M2.5 8.5l3.2 3.2L13.5 4"
              fill="none"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span class="wd-check__label">{{ checked ? 'Solved ✓ (+100 XP)' : 'Mark as Solved' }}</span>
      </label>

      <template v-if="inlineTools">
        <button
          type="button"
          class="wd-labtoolbtn"
          :class="{ 'is-active': bookmarked }"
          :aria-pressed="bookmarked"
          :title="bookmarked ? 'Remove from Review Later' : 'Save for Review Later'"
          @click="toggleLabBookmark(labId)"
        >
          <span aria-hidden="true">{{ bookmarked ? '★' : '☆' }}</span>
          <span>{{ bookmarked ? 'Saved' : 'Star' }}</span>
        </button>

        <button
          type="button"
          class="wd-labtoolbtn"
          :class="{ 'is-active': showNote || hasNote }"
          :aria-expanded="showNote"
          @click="showNote = !showNote"
        >
          <span aria-hidden="true">📝</span>
          <span>{{ hasNote ? 'Note ✓' : 'Note' }}</span>
        </button>
      </template>
    </div>

    <div v-if="inlineTools && showNote" class="wd-labnote">
      <div class="wd-labnote__head">
        <span>📝 Personal Lab Note</span>
        <span class="wd-labnote__status">{{ savedTick ? '✓ Saved' : 'Saved locally' }}</span>
      </div>
      <textarea
        :value="noteDraft"
        class="wd-labnote__textarea"
        rows="2"
        placeholder="Jot down what worked, payload notes, or things to remember..."
        @input="onNoteInput"
      ></textarea>
    </div>
  </div>
</template>
