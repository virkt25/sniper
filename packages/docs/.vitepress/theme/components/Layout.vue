<script setup>
import DefaultTheme from 'vitepress/theme'
import ScrollProgress from './ScrollProgress.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #layout-top>
      <ScrollProgress />
    </template>
  </Layout>
</template>
