<script setup>
import DefaultTheme from 'vitepress/theme'
import ProgressPill from './components/ProgressPill.vue'
import PageDossierHeader from './components/PageDossierHeader.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #nav-bar-content-after>
      <ProgressPill />
    </template>
    <template #doc-before>
      <PageDossierHeader />
    </template>
  </Layout>
</template>
