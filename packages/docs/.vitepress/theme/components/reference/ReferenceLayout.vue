<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import ReferenceHeader from './ReferenceHeader.vue'
import ReferenceSidebar from './ReferenceSidebar.vue'
import RelatedItems from './RelatedItems.vue'

const { Layout } = DefaultTheme
const { frontmatter } = useData()
</script>

<template>
  <Layout>
    <template #doc-before>
      <ReferenceHeader
        :page-type="frontmatter.pageType"
        :title="frontmatter.title"
        :phase="frontmatter.phase"
        :layer="frontmatter.layer"
        :gate-mode="frontmatter.gateMode"
      />
    </template>

    <template #aside-outline-after>
      <ReferenceSidebar
        :page-type="frontmatter.pageType"
        :phase="frontmatter.phase"
        :layer="frontmatter.layer"
        :gate-mode="frontmatter.gateMode"
        :member-count="frontmatter.memberCount"
        :source-file="frontmatter.sourceFile"
        :format="frontmatter.format"
        :description="frontmatter.description"
        :related-items="frontmatter.relatedItems"
      />
    </template>

    <template #doc-after>
      <RelatedItems
        v-if="frontmatter.relatedItems?.length"
        :items="frontmatter.relatedItems"
      />
    </template>
  </Layout>
</template>
