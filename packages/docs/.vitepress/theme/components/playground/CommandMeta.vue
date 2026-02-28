<script setup lang="ts">
import { phaseColors } from '../../colors'
import type { CommandMeta } from './usePlaygroundData'

const props = defineProps<{
  name: string
  description: string
  phase: string | null
  meta: CommandMeta
  slug: string
}>()
</script>

<template>
  <div class="command-meta">
    <div class="meta-header">
      <h3 class="meta-name">{{ name }}</h3>
      <span
        v-if="phase"
        class="meta-phase"
        :style="{ backgroundColor: phaseColors[phase] ?? 'var(--vp-c-bg-mute)' }"
      >{{ phase }}</span>
    </div>

    <p class="meta-desc">{{ description }}</p>

    <div class="meta-grid">
      <div v-if="meta.agentsSpawned.length > 0" class="meta-section">
        <h4 class="meta-label">Agents Spawned</h4>
        <div class="meta-tags">
          <span v-for="agent in meta.agentsSpawned" :key="agent" class="meta-tag agent">
            {{ agent }}
          </span>
        </div>
      </div>

      <div v-if="meta.filesCreated.length > 0" class="meta-section">
        <h4 class="meta-label">Files Created</h4>
        <div class="meta-tags">
          <span v-for="file in meta.filesCreated" :key="file" class="meta-tag file">
            {{ file }}
          </span>
        </div>
      </div>

      <div v-if="meta.requiresReview" class="meta-section">
        <h4 class="meta-label">Review Gate</h4>
        <span class="meta-tag review">Requires review</span>
      </div>
    </div>

    <a :href="`/reference/commands/${slug}`" class="meta-link">
      View full reference
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </a>
  </div>
</template>

<style scoped>
.command-meta {
  padding: 16px 20px;
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.meta-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.meta-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  font-family: var(--sniper-font-mono);
}

.meta-phase {
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  padding: 2px 8px;
  border-radius: 9999px;
}

.meta-desc {
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}

.meta-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
}

.meta-section {
  min-width: 120px;
}

.meta-label {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--vp-c-text-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.meta-tag {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: var(--sniper-font-mono);
}

.meta-tag.agent {
  background: color-mix(in srgb, #8b5cf6 15%, transparent);
  color: #8b5cf6;
}

.meta-tag.file {
  background: color-mix(in srgb, #10b981 15%, transparent);
  color: #10b981;
}

.meta-tag.review {
  background: color-mix(in srgb, #f59e0b 15%, transparent);
  color: #f59e0b;
}

.meta-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  color: var(--sniper-brand, #6366f1);
  text-decoration: none;
  transition: opacity 0.15s ease;
}

.meta-link:hover { opacity: 0.8; }
</style>
