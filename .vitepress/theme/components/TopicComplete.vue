<script setup>
import { computed, onMounted, reactive } from 'vue'
import { interactiveFor } from '../data/interactive/index.js'
import {
  initProgress,
  isTopicDone,
  isActivityDone,
  markActivityDone,
  progress,
  moduleStats,
  toggleTopic
} from '../progress.js'

const props = defineProps({
  topicId: { type: String, required: true },
  label: { type: String, default: 'Mark this topic complete' }
})

const answers = reactive({})

onMounted(initProgress)

const done = computed(() => progress.ready && isTopicDone(props.topicId))
const quizDone = computed(() => progress.ready && isActivityDone('quiz', props.topicId))
const stats = computed(() => moduleStats(props.topicId))
const quiz = computed(() => interactiveFor(props.topicId)?.quiz || [])

function selectAnswer(qIdx, optIdx) {
  answers[qIdx] = optIdx
  if (quiz.value.length > 0) {
    const allCorrect = quiz.value.every((q, i) => {
      const picked = answers[i]
      return picked !== undefined && q.options[picked]?.correct
    })
    if (allCorrect) {
      markActivityDone('quiz', props.topicId)
    }
  }
}

function switchView(view) {
  progress.ui.pageView = view
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="wd-topicwrap">
    <!-- Interactive 2-Question Connection Check Quiz (+40 XP) -->
    <section v-if="quiz.length" class="wd-quiz" aria-label="Quick concept connection check">
      <div class="wd-quiz__head">
        <div>
          <span class="wd-badge wd-badge--stage">⚡ 15-Second Connection Check</span>
          <h3 class="wd-quiz__title">Lock It In Before Moving On</h3>
        </div>
        <span class="wd-wbtab__xp" :class="{ 'is-done': quizDone }">
          {{ quizDone ? '✓ +40 XP Earned!' : '+40 XP' }}
        </span>
      </div>

      <div class="wd-quiz__grid">
        <div v-for="(item, qIdx) in quiz" :key="qIdx" class="wd-quiz__card">
          <p class="wd-quiz__q"><strong>Q{{ qIdx + 1 }}:</strong> {{ item.q }}</p>
          <div class="wd-quiz__opts">
            <button
              v-for="(opt, oIdx) in item.options"
              :key="oIdx"
              type="button"
              class="wd-quiz__opt"
              :class="{
                'is-selected': answers[qIdx] === oIdx,
                'is-correct': answers[qIdx] === oIdx && opt.correct,
                'is-wrong': answers[qIdx] === oIdx && !opt.correct
              }"
              @click="selectAnswer(qIdx, oIdx)"
            >
              {{ opt.text }}
            </button>
          </div>
          <p
            v-if="answers[qIdx] !== undefined && item.options[answers[qIdx]]"
            class="wd-quiz__why"
            :class="item.options[answers[qIdx]].correct ? 'is-correct' : 'is-wrong'"
          >
            {{ item.options[answers[qIdx]].why }}
          </p>
        </div>
      </div>
    </section>

    <!-- Topic Complete Card -->
    <div class="wd-topic" :class="{ 'is-done': done }">
      <div class="wd-topic__copy">
        <span class="wd-topic__eyebrow">Case File Status · +50 XP</span>
        <strong>{{ label }}</strong>
        <span class="wd-topic__meta">
          {{ stats.done }} / {{ stats.total }} labs solved · {{ stats.activitiesDone }} / 3 studio challenges completed
        </span>
      </div>
      <div class="wd-topic__btns">
        <button
          v-if="progress.ui.pageView === 'guide' && stats.total > 0"
          type="button"
          class="wd-primarycta"
          @click="switchView('labs')"
        >
          🧪 Practice on {{ stats.total }} Labs →
        </button>
        <button
          v-else-if="progress.ui.pageView === 'labs'"
          type="button"
          class="wd-quietbtn"
          @click="switchView('guide')"
        >
          📖 Open Deep-Dive Guide
        </button>
        <button
          type="button"
          class="wd-topic__button"
          :data-topic-id="topicId"
          :aria-pressed="done"
          @click="toggleTopic(topicId)"
        >
          {{ done ? 'Completed ✓ (+50 XP)' : 'Mark Case Complete' }}
        </button>
      </div>
    </div>
  </div>
</template>
