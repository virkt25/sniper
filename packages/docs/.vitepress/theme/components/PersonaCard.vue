<script setup lang="ts">
const props = defineProps<{
  name: string
  layer: string
  description: string
}>()

const layerColors: Record<string, string> = {
  process: '#3b82f6',
  technical: '#10b981',
  cognitive: '#8b5cf6',
  domain: '#f59e0b',
}

const borderColor = layerColors[props.layer] ?? '#6b7280'
</script>

<template>
  <div class="persona-card" :style="{ borderLeftColor: borderColor }">
    <div class="persona-header">
      <h3 class="persona-name">{{ name }}</h3>
      <span class="persona-layer" :style="{ backgroundColor: borderColor }">
        {{ layer }}
      </span>
    </div>
    <p class="persona-description">{{ description }}</p>
  </div>
</template>

<style scoped>
.persona-card {
  border: 1px solid var(--vp-c-divider);
  border-left-width: 4px;
  border-radius: 8px;
  padding: 16px 20px;
  margin: 12px 0;
  background-color: var(--vp-c-bg-soft);
  transition: box-shadow 0.2s ease;
}

.persona-card:hover {
  box-shadow: 0 2px 12px var(--vp-c-shadow-1, rgba(0, 0, 0, 0.08));
}

.persona-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.persona-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.persona-layer {
  display: inline-block;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  padding: 2px 8px;
  border-radius: 9999px;
  text-transform: capitalize;
}

.persona-description {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}
</style>
