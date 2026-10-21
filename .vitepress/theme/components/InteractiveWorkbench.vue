<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vitepress'
import { unitByPath, labsFor } from '../labs.js'
import { interactiveFor } from '../data/interactive/index.js'
import {
  initProgress,
  progress,
  markActivityDone,
  isActivityDone
} from '../progress.js'

const emit = defineEmits(['open-labs', 'open-guide'])
const route = useRoute()

const activeMode = ref('sandbox') // 'sandbox' | 'story' | 'puzzle' | 'connections'
const selectedPresetIdx = ref(0)
const safeMode = ref(false)
const customInput = ref('')
const triedPresets = ref(new Set([0]))

const currentSlide = ref(0)
const selectedPuzzleIdx = ref(null)
const selectedClueIdx = ref(0)

const unit = computed(() => unitByPath(route.path))
const data = computed(() => (unit.value ? interactiveFor(unit.value.id) : null))
const unitLabs = computed(() => (unit.value ? labsFor(unit.value.id) : []))

const presets = computed(() => data.value?.sandbox?.presets || [])
const currentPreset = computed(() => presets.value[selectedPresetIdx.value] || presets.value[0] || null)

const isCustomActive = computed(() => customInput.value.trim().length > 0)

// Extract the exact server-side token (serverInput) when on a preset, or smart-extract when custom input is typed
const effectiveServerInput = computed(() => {
  if (!isCustomActive.value) {
    return currentPreset.value?.serverInput ?? currentPreset.value?.input ?? ''
  }
  const raw = customInput.value.trim()
  const eqIdx = raw.indexOf('=')
  const presetIn = currentPreset.value?.input || ''
  if (eqIdx > 0 && presetIn.includes('=') && !presetIn.startsWith('GET ') && !presetIn.startsWith('POST ')) {
    return raw.slice(eqIdx + 1)
  }
  return raw
})

// Dynamically update the HTTP request preview when the user types custom input
const liveHttpRequest = computed(() => {
  const baseHttp = currentPreset.value?.http || ''
  const presetIn = currentPreset.value?.input || ''
  const serverIn = (currentPreset.value?.serverInput || '').replace(/^["']|["']$/g, '')
  if (!isCustomActive.value) return baseHttp
  const raw = customInput.value
  const encoded = encodeURIComponent(raw).replace(/%20/g, '+')
  if (presetIn && baseHttp.includes(presetIn)) {
    return baseHttp.replace(presetIn, raw)
  }
  if (serverIn && baseHttp.includes(serverIn)) {
    return baseHttp.replace(serverIn, raw)
  }
  const presetEnc = encodeURIComponent(presetIn).replace(/%20/g, '+')
  if (presetEnc && baseHttp.includes(presetEnc)) {
    return baseHttp.replace(presetEnc, encoded)
  }
  return `${baseHttp}\n\n# [Custom Probe]: ${raw}`
})

const customProbeAnalysis = computed(() => {
  if (!isCustomActive.value) return null
  const val = customInput.value
  const hasSyntaxBreak = /['"`;<>|$(){}\\]|\.\.\/|--|169\.254|__proto__|admin|carlos/i.test(val)
  if (hasSyntaxBreak) {
    return {
      status: '⚡ Custom Probe · Anomaly / Control Token Sent',
      statusType: 'bypass',
      preview: `Server received your custom payload (${val}) containing control or target tokens.`,
      aha: 'Look at the Live Server X-Ray on the left: your custom input lands directly inside the server logic unless Patched Mode is enabled.'
    }
  }
  return {
    status: '200 OK · Custom Baseline Input',
    statusType: 'normal',
    preview: `Server processed "${val}" along its normal execution path.`,
    aha: 'Try typing a quote (\'), comment (--), path traversal (../), script tag (<script>), or target ID (carlos) to test how the server reacts.'
  }
})

const slides = computed(() => data.value?.story || [])
const currentSlideData = computed(() => slides.value[currentSlide.value] || null)

const nodeSubtitles = [
  'Client DOM & URL Bar',
  'HTTP Wire & Headers',
  'Route & Auth Logic',
  'Database & Backend'
]

const puzzle = computed(() => data.value?.puzzle || null)
const connections = computed(() => data.value?.connections || [])
const activeConnection = computed(() => connections.value[selectedClueIdx.value] || connections.value[0] || null)

function cleanClue(str) {
  return (str || '').replace(/^(?:👁️\s*)?(?:What You Notice:\s*)?/i, '').trim()
}

function cleanMechanism(str) {
  return (str || '').replace(/^(?:⚙️\s*)?(?:What It Means on the Server:\s*)?/i, '').trim()
}

function cleanNextMove(str) {
  return (str || '').replace(/^(?:🎯\s*)?(?:How to Verify:\s*)?/i, '').trim()
}

const sandboxDone = computed(() => unit.value && progress.ready && isActivityDone('sandbox', unit.value.id))
const storyDone = computed(() => unit.value && progress.ready && isActivityDone('story', unit.value.id))
const puzzleDone = computed(() => unit.value && progress.ready && isActivityDone('puzzle', unit.value.id))

function selectPreset(idx) {
  selectedPresetIdx.value = idx
  customInput.value = ''
  triedPresets.value.add(idx)
  if (triedPresets.value.size >= 2 && unit.value) {
    markActivityDone('sandbox', unit.value.id)
  }
}

function toggleSafeMode() {
  safeMode.value = !safeMode.value
  if (unit.value) {
    markActivityDone('sandbox', unit.value.id)
  }
}

function nextSlide() {
  if (currentSlide.value < slides.value.length - 1) {
    currentSlide.value += 1
  }
  if (currentSlide.value === slides.value.length - 1 && unit.value) {
    markActivityDone('story', unit.value.id)
  }
}

function prevSlide() {
  if (currentSlide.value > 0) {
    currentSlide.value -= 1
  }
}

function pickPuzzleOption(idx) {
  selectedPuzzleIdx.value = idx
  const opt = puzzle.value?.options?.[idx]
  if (opt?.correct && unit.value) {
    markActivityDone('puzzle', unit.value.id)
  }
}

onMounted(() => {
  initProgress()
})

watch(
  () => route.path,
  () => {
    activeMode.value = 'sandbox'
    selectedPresetIdx.value = 0
    safeMode.value = false
    customInput.value = ''
    triedPresets.value = new Set([0])
    currentSlide.value = 0
    selectedPuzzleIdx.value = null
    selectedClueIdx.value = 0
  }
)
</script>

<template>
  <section v-if="unit && data" class="wd-workbench" aria-label="Interactive learning studio">
    <!-- 4-Column Sub-Navigation for the Interactive Activities -->
    <div class="wd-workbench__nav">
      <div class="wd-workbench__tabs" role="tablist">
        <button
          type="button"
          class="wd-wbtab"
          :class="{ 'is-active': activeMode === 'sandbox' }"
          @click="activeMode = 'sandbox'"
        >
          <span class="wd-wbtab__label">🧪 1. Poke the Server</span>
          <span class="wd-wbtab__xp" :class="{ 'is-done': sandboxDone }">
            {{ sandboxDone ? '✓ +25' : '+25 XP' }}
          </span>
        </button>

        <button
          type="button"
          class="wd-wbtab"
          :class="{ 'is-active': activeMode === 'story' }"
          @click="activeMode = 'story'"
        >
          <span class="wd-wbtab__label">🎬 2. Visual Story ({{ currentSlide + 1 }}/{{ slides.length }})</span>
          <span class="wd-wbtab__xp" :class="{ 'is-done': storyDone }">
            {{ storyDone ? '✓ +20' : '+20 XP' }}
          </span>
        </button>

        <button
          type="button"
          class="wd-wbtab"
          :class="{ 'is-active': activeMode === 'puzzle' }"
          @click="activeMode = 'puzzle'"
        >
          <span class="wd-wbtab__label">🧩 3. Predict &amp; Spot</span>
          <span class="wd-wbtab__xp" :class="{ 'is-done': puzzleDone }">
            {{ puzzleDone ? '✓ +30' : '+30 XP' }}
          </span>
        </button>

        <button
          type="button"
          class="wd-wbtab"
          :class="{ 'is-active': activeMode === 'connections' }"
          @click="activeMode = 'connections'"
        >
          <span class="wd-wbtab__label">🕸️ 4. Clue → Bug Map</span>
          <span class="wd-wbtab__xp">{{ connections.length }} clues</span>
        </button>
      </div>
    </div>

    <!-- =======================================================================
         MODE 1: LIVE "POKE THE SERVER" X-RAY SANDBOX (Spacious 2-Column Split)
         ======================================================================= -->
    <div v-if="activeMode === 'sandbox' && currentPreset" class="wd-wbpanel">
      <div class="wd-sandbox__top">
        <div>
          <h2 class="wd-sandbox__title">{{ data.sandbox.title }}</h2>
          <p class="wd-sandbox__prompt">{{ data.sandbox.prompt }}</p>
        </div>
        <button
          type="button"
          class="wd-defensetoggle"
          :class="{ 'is-safe': safeMode }"
          @click="toggleSafeMode"
        >
          <span aria-hidden="true">{{ safeMode ? '🛡️' : '🔓' }}</span>
          <span>{{ safeMode ? 'Server: PATCHED (Safe)' : 'Server: VULNERABLE' }}</span>
        </button>
      </div>

      <!-- Spacious 2x2 Preset Grid (Zero mid-word wrapping!) -->
      <div class="wd-sandbox__presets" role="group" aria-label="Choose a test scenario">
        <button
          v-for="(preset, idx) in presets"
          :key="idx"
          type="button"
          class="wd-presetbtn"
          :class="{
            'is-active': selectedPresetIdx === idx && !isCustomActive
          }"
          @click="selectPreset(idx)"
        >
          <div class="wd-presetbtn__top">
            <span class="wd-presetbtn__label">{{ preset.label }}</span>
            <span v-if="selectedPresetIdx === idx && !isCustomActive" class="wd-presetbtn__active">Active</span>
          </div>
          <code class="wd-presetbtn__code">{{ preset.input }}</code>
        </button>
      </div>

      <!-- Calm, Spacious 2-Column Split: Left = Request & Server X-Ray, Right = Observation & Insight -->
      <div class="wd-xray-split">
        <!-- Left Column: Input + HTTP Request + Live Server X-Ray -->
        <div class="wd-xray-left">
          <div class="wd-xraycard">
            <div class="wd-xraycard__head">
              <span class="wd-xraycard__step">1 · WHAT YOU SEND ({{ data.sandbox.inputLabel }})</span>
              <button
                v-if="isCustomActive"
                type="button"
                class="wd-filterpill"
                @click="customInput = ''"
              >
                ↺ Reset to Preset
              </button>
              <span v-else class="wd-xraycard__sub">Preset {{ selectedPresetIdx + 1 }} of {{ presets.length }}</span>
            </div>
            <div class="wd-xraycard__inputwrap">
              <input
                v-model="customInput"
                type="text"
                class="wd-xraycard__input"
                placeholder="Type a custom payload here to test live..."
                aria-label="Test input value"
              />
            </div>
            <div class="wd-termwin">
              <div class="wd-termwin__bar">
                <span class="wd-termwin__dots" aria-hidden="true">
                  <i></i><i></i><i></i>
                </span>
                <span class="wd-termwin__title">OUTGOING HTTP REQUEST</span>
              </div>
              <pre class="wd-xraycard__http"><code>{{ liveHttpRequest }}</code></pre>
            </div>
          </div>

          <div class="wd-xraycard wd-xraycard--server">
            <div class="wd-xraycard__head">
              <span class="wd-xraycard__step">2 · LIVE SERVER X-RAY</span>
              <span class="wd-xraycard__sub">
                {{ safeMode ? '🛡️ Patched Code Path' : '⚙️ How the Server Reads Your Input' }}
              </span>
            </div>

            <div v-if="!safeMode" class="wd-termwin">
              <div class="wd-termwin__bar">
                <span class="wd-termwin__dots" aria-hidden="true">
                  <i></i><i></i><i></i>
                </span>
                <div class="wd-termwin__legend">
                  <span><i class="wd-dot-dev"></i> Developer Code</span>
                  <span><i class="wd-dot-input"></i> Your Input</span>
                  <span v-if="currentPreset.commentedOut && !isCustomActive">
                    <i class="wd-dot-dead"></i> Ignored
                  </span>
                </div>
              </div>
              <div class="wd-xraycard__tokens">
                <span class="wd-code-dev">{{ currentPreset.serverDevBefore }}</span><span class="wd-code-input">{{ effectiveServerInput }}</span><span
                  v-if="currentPreset.serverDevAfter"
                  :class="currentPreset.commentedOut && !isCustomActive ? 'wd-code-dead' : 'wd-code-dev'"
                >{{ currentPreset.serverDevAfter }}</span>
              </div>
            </div>

            <div v-else class="wd-termwin wd-termwin--safe">
              <div class="wd-termwin__bar">
                <span class="wd-termwin__dots" aria-hidden="true">
                  <i></i><i></i><i></i>
                </span>
                <span class="wd-termwin__title">🛡️ PATCHED DEFENSE — INPUT SEPARATED FROM CODE</span>
              </div>
              <pre class="wd-xraycard__safeview"><code>{{ currentPreset.safeServerView }}</code></pre>
            </div>
          </div>
        </div>

        <!-- Right Column: What You Observe + 2-Sentence Aha! Insight -->
        <div
          class="wd-xraycard wd-xraycard--result"
          :class="`is-${safeMode ? 'safe' : (customProbeAnalysis ? customProbeAnalysis.statusType : currentPreset.statusType)}`"
        >
          <div class="wd-xraycard__resultbody">
            <div class="wd-xraycard__head">
              <span class="wd-xraycard__step">3 · WHAT YOU OBSERVE</span>
              <span class="wd-xraycard__status">
                {{
                  safeMode
                    ? currentPreset.safeStatus
                    : customProbeAnalysis
                      ? customProbeAnalysis.status
                      : currentPreset.status
                }}
              </span>
            </div>

            <div class="wd-xraycard__preview">
              <span class="wd-xraycard__previewlabel">Simulated Browser / Response Output</span>
              <p>
                {{
                  safeMode
                    ? 'Request processed safely with strict validation and zero unintended behavior.'
                    : customProbeAnalysis
                      ? customProbeAnalysis.preview
                      : currentPreset.responsePreview
                }}
              </p>
            </div>

            <div class="wd-xraycard__aha">
              <span class="wd-xraycard__ahatag">💡 Detective Takeaway</span>
              <p>
                {{
                  safeMode
                    ? currentPreset.safeAha
                    : customProbeAnalysis
                      ? customProbeAnalysis.aha
                      : currentPreset.aha
                }}
              </p>
            </div>
          </div>

          <div class="wd-xraycard__next">
            <button type="button" class="wd-nextmodebtn" @click="activeMode = 'story'">
              Step 2: Watch the 4-Slide Visual Story →
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- =======================================================================
         MODE 2: 4-STEP INTERACTIVE VISUAL STORY PLAYER (ZERO SCROLLING)
         ======================================================================= -->
    <div v-else-if="activeMode === 'story' && currentSlideData" class="wd-wbpanel">
      <div class="wd-story__top">
        <span class="wd-badge wd-badge--stage">{{ currentSlideData.tag }}</span>
        <div class="wd-story__dots">
          <button
            v-for="(s, idx) in slides"
            :key="idx"
            type="button"
            class="wd-story__dot"
            :class="{ 'is-active': currentSlide === idx }"
            @click="currentSlide = idx"
          >
            Slide {{ idx + 1 }}
          </button>
        </div>
      </div>

      <h2 class="wd-story__headline">{{ currentSlideData.headline }}</h2>

      <!-- Responsive 4-Node Visual Pipeline -->
      <div class="wd-story__pipeline">
        <div
          v-for="(node, idx) in currentSlideData.nodes"
          :key="idx"
          class="wd-story__node"
          :class="{
            'is-active': currentSlideData.activeNode === idx,
            'is-past': idx < currentSlideData.activeNode
          }"
        >
          <div class="wd-story__nodetop">
            <span class="wd-story__stepnum">STAGE {{ idx + 1 }}</span>
            <span v-if="currentSlideData.activeNode === idx" class="wd-story__livebadge">ACTIVE</span>
          </div>
          <span class="wd-story__nodelabel">{{ node }}</span>
          <span class="wd-story__nodesub">{{ nodeSubtitles[idx] || 'System Layer' }}</span>
          <div v-if="currentSlideData.activeNode === idx" class="wd-story__packet">
            ⚡ {{ currentSlideData.packetText }}
          </div>
        </div>
      </div>

      <!-- Story Explanation & Core Takeaway -->
      <div class="wd-story__card">
        <p class="wd-story__body">{{ currentSlideData.body }}</p>
        <div class="wd-story__takeaway">
          <strong>🎯 Core Connection:</strong> {{ currentSlideData.takeaway }}
        </div>
      </div>

      <!-- Slide Controls -->
      <div class="wd-story__controls">
        <button
          type="button"
          class="wd-quietbtn"
          :disabled="currentSlide === 0"
          @click="prevSlide"
        >
          ◀ Previous Slide
        </button>

        <button
          v-if="currentSlide < slides.length - 1"
          type="button"
          class="wd-nextmodebtn"
          @click="nextSlide"
        >
          Next Slide ({{ currentSlide + 2 }} of {{ slides.length }}) ▶
        </button>
        <button
          v-else
          type="button"
          class="wd-nextmodebtn"
          @click="markActivityDone('story', unit.id); activeMode = 'puzzle'"
        >
          ✓ Story Complete! Try the 10-Second Puzzle →
        </button>
      </div>
    </div>

    <!-- =======================================================================
         MODE 3: "PREDICT WHAT HAPPENS" 10-SECOND DETECTIVE PUZZLE
         ======================================================================= -->
    <div v-else-if="activeMode === 'puzzle' && puzzle" class="wd-wbpanel">
      <div class="wd-puzzle__head">
        <span class="wd-badge wd-badge--worked">🧩 10-Second Detective Challenge</span>
        <h2 class="wd-puzzle__q">{{ puzzle.question }}</h2>
      </div>

      <div class="wd-termwin wd-puzzle__term">
        <div class="wd-termwin__bar">
          <span class="wd-termwin__dots" aria-hidden="true">
            <i></i><i></i><i></i>
          </span>
          <span class="wd-termwin__title">TARGET SERVER SNIPPET</span>
        </div>
        <pre class="wd-puzzle__code"><code>{{ puzzle.code }}</code></pre>
      </div>

      <div class="wd-puzzle__options">
        <button
          v-for="(opt, idx) in puzzle.options"
          :key="idx"
          type="button"
          class="wd-puzzle__opt"
          :class="{
            'is-selected': selectedPuzzleIdx === idx,
            'is-correct': selectedPuzzleIdx === idx && opt.correct,
            'is-wrong': selectedPuzzleIdx === idx && !opt.correct
          }"
          @click="pickPuzzleOption(idx)"
        >
          <span class="wd-puzzle__letter">{{ ['A', 'B', 'C'][idx] || idx + 1 }}</span>
          <span class="wd-puzzle__text">{{ opt.text }}</span>
        </button>
      </div>

      <div
        v-if="selectedPuzzleIdx !== null && puzzle.options[selectedPuzzleIdx]"
        class="wd-puzzle__feedback"
        :class="puzzle.options[selectedPuzzleIdx].correct ? 'is-correct' : 'is-wrong'"
      >
        <strong>
          {{ puzzle.options[selectedPuzzleIdx].correct ? '🎉 Spot On! (+30 XP)' : '💡 Look Closer:' }}
        </strong>
        <p>{{ puzzle.options[selectedPuzzleIdx].feedback }}</p>
      </div>

      <div class="wd-wbpanel__foot">
        <span>Predicting before reading locks the concept into memory.</span>
        <button type="button" class="wd-nextmodebtn" @click="activeMode = 'connections'">
          Step 4: Explore the Clue → Bug Map →
        </button>
      </div>
    </div>

    <!-- =======================================================================
         MODE 4: INTERACTIVE "CLUE -> MECHANISM -> VERIFY" CONNECTION MAP
         ======================================================================= -->
    <div v-else-if="activeMode === 'connections' && connections.length" class="wd-wbpanel">
      <h2 class="wd-sandbox__title">🕸️ Clue → Server Mechanism Connection Map</h2>
      <p class="wd-sandbox__prompt">
        Click any real-world clue on the left to see what it proves about the server and how to verify it:
      </p>

      <div class="wd-connmap">
        <div class="wd-connmap__clues">
          <button
            v-for="(conn, idx) in connections"
            :key="idx"
            type="button"
            class="wd-connmap__cluebtn"
            :class="{ 'is-active': selectedClueIdx === idx }"
            @click="selectedClueIdx = idx"
          >
            <span class="wd-connmap__cluetag">🔎 CLUE {{ idx + 1 }} · WHAT YOU NOTICE</span>
            <span class="wd-connmap__cluetext">{{ cleanClue(conn.clue) }}</span>
          </button>
        </div>

        <div v-if="activeConnection" class="wd-connmap__detail">
          <div class="wd-connmap__box wd-connmap__box--mech">
            <span class="wd-connmap__tag">⚙️ 1 · WHAT THIS CLUE PROVES ON THE SERVER</span>
            <p>{{ cleanMechanism(activeConnection.mechanism) }}</p>
          </div>
          <div class="wd-connmap__box wd-connmap__box--move">
            <span class="wd-connmap__tag">🎯 2 · YOUR NEXT MOVE IN THE LABS</span>
            <p>{{ cleanNextMove(activeConnection.nextMove) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Calm Bottom Workspace Transition Bar -->
    <footer class="wd-workbench__footer">
      <button type="button" class="wd-quietbtn" @click="emit('open-guide')">
        📖 Prefer reading? Open the Deep-Dive Guide
      </button>
      <button type="button" class="wd-primarycta" @click="emit('open-labs')">
        🧪 Practice on the {{ unitLabs.length }} Live Labs →
      </button>
    </footer>
  </section>
</template>
