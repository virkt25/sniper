<script setup>
import DefaultTheme from 'vitepress/theme'
import { useData, useRoute } from 'vitepress'
import { computed } from 'vue'
import ScrollProgress from './ScrollProgress.vue'
import PrevNextCards from './PrevNextCards.vue'
import SearchModal from './SearchModal.vue'
import ReferenceLayout from './reference/ReferenceLayout.vue'

const { Layout } = DefaultTheme
const { frontmatter } = useData()
const route = useRoute()

const pageCategory = computed(() => {
  const path = route.path
  if (path.startsWith('/guide/')) return 'Guide'
  if (path.startsWith('/reference/commands/')) return 'Commands'
  if (path.startsWith('/reference/personas/')) return 'Personas'
  if (path.startsWith('/reference/templates/')) return 'Templates'
  if (path.startsWith('/reference/checklists/')) return 'Checklists'
  return ''
})
</script>

<template>
  <div v-if="pageCategory" :data-pagefind-filter="'category:' + pageCategory" style="display:none" />

  <ReferenceLayout v-if="frontmatter.pageLayout === 'reference'">
    <template #layout-top>
      <ScrollProgress />
    </template>
  </ReferenceLayout>
  <Layout v-else>
    <template #layout-top>
      <ScrollProgress />
    </template>
    <template #nav-bar-content-after>
      <SearchModal />
    </template>
    <template #doc-after>
      <PrevNextCards />
    </template>
  </Layout>
</template>
