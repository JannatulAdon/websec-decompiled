<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import {
  THEME_PALETTES,
  initProgress,
  overallStats,
  progress,
  setThemePalette
} from '../progress.js'
import { totalLabs } from '../labs.js'

const showMenu = ref(false)
const pickerEl = ref(null)

function onDocClick(e) {
  if (showMenu.value && pickerEl.value && !pickerEl.value.contains(e.target)) {
    showMenu.value = false
  }
}

onMounted(() => {
  initProgress()
  if (typeof document !== 'undefined') {
    document.addEventListener('click', onDocClick)
  }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('click', onDocClick)
  }
})

const stats = computed(() =>
  progress.ready
    ? overallStats()
    : { done: 0, total: totalLabs, percent: 0, xp: 0, rankTitle: '🔎 Rookie Observer' }
)

const currentPalette = computed(
  () => THEME_PALETTES.find((p) => p.id === progress.ui.themePalette) || THEME_PALETTES[0]
)

function choosePalette(id) {
  setThemePalette(id)
  showMenu.value = false
}
</script>

<template>
  <div class="wd-nav-extras">
    <div ref="pickerEl" class="wd-themepicker">
      <button
        type="button"
        class="wd-themepicker__btn"
        :aria-expanded="showMenu"
        aria-label="Choose color atmosphere"
        title="Switch eye-soothing color theme"
        @click.stop="showMenu = !showMenu"
      >
        <span class="wd-themepicker__swatch" :data-palette="currentPalette.id"></span>
        <span class="wd-themepicker__label">Theme</span>
      </button>

      <div v-if="showMenu" class="wd-themepicker__menu" role="menu">
        <div class="wd-themepicker__head">Eye-Soothing Studio Palettes</div>
        <button
          v-for="pal in THEME_PALETTES"
          :key="pal.id"
          type="button"
          role="menuitem"
          class="wd-themepicker__opt"
          :class="{ 'is-active': progress.ui.themePalette === pal.id }"
          @click="choosePalette(pal.id)"
        >
          <span class="wd-themepicker__swatch" :data-palette="pal.id"></span>
          <span class="wd-themepicker__info">
            <strong>{{ pal.label }}</strong>
            <small>{{ pal.desc }}</small>
          </span>
          <span v-if="progress.ui.themePalette === pal.id" class="wd-themepicker__check">✓</span>
        </button>
      </div>
    </div>

    <a class="wd-pill" :href="withBase('/#progress')" aria-label="Open progress dashboard">
      <span class="wd-pill__xp" title="Your Investigation XP">⚡ {{ stats.xp }} XP</span>
      <span class="wd-pill__track" aria-hidden="true">
        <span class="wd-pill__fill" :style="{ width: `${stats.percent}%` }"></span>
      </span>
      <span class="wd-pill__text">
        <strong>{{ stats.done }}/{{ stats.total }}</strong>
        <span>labs</span>
      </span>
    </a>
  </div>
</template>
