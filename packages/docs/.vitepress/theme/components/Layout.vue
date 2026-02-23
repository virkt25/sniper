<script setup>
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import ScrollProgress from './ScrollProgress.vue'
import ReadingTime from './ReadingTime.vue'
import PrevNextCards from './PrevNextCards.vue'
import ReferenceLayout from './reference/ReferenceLayout.vue'

const { Layout } = DefaultTheme
const { frontmatter } = useData()
</script>

<template>
  <ReferenceLayout v-if="frontmatter.pageLayout === 'reference'">
    <template #layout-top>
      <ScrollProgress />
    </template>
  </ReferenceLayout>
  <Layout v-else>
    <template #layout-top>
      <ScrollProgress />
    </template>
    <template #doc-before>
      <ReadingTime />
    </template>
    <template #doc-after>
      <PrevNextCards />
    </template>
  </Layout>
</template>
