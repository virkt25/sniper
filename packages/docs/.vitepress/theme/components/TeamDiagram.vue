<script setup lang="ts">
defineProps<{
  name: string
  phase: string
  members: Array<{ name: string; layers: string[] }>
}>()

const layerColors: Record<string, string> = {
  process: '#3b82f6',
  technical: '#10b981',
  cognitive: '#8b5cf6',
  domain: '#f59e0b',
}

function getLayerColor(layer: string): string {
  return layerColors[layer] ?? '#6b7280'
}
</script>

<template>
  <div class="team-diagram">
    <div class="team-header">
      <h3 class="team-name">{{ name }}</h3>
      <span class="team-phase">{{ phase }}</span>
    </div>
    <div class="team-members">
      <div v-for="member in members" :key="member.name" class="member-box">
        <div class="member-name">{{ member.name }}</div>
        <div class="member-layers">
          <span
            v-for="layer in member.layers"
            :key="layer"
            class="layer-tag"
            :style="{ backgroundColor: getLayerColor(layer) }"
          >
            {{ layer }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.team-diagram {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 20px;
  margin: 16px 0;
  background-color: var(--vp-c-bg-soft);
}

.team-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.team-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.team-phase {
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  background-color: var(--vp-c-bg-mute);
  padding: 2px 10px;
  border-radius: 9999px;
}

.team-members {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.member-box {
  flex: 1 1 140px;
  min-width: 140px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 12px;
  background-color: var(--vp-c-bg);
  text-align: center;
}

.member-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin-bottom: 8px;
}

.member-layers {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
}

.layer-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 500;
  color: #fff;
  padding: 1px 6px;
  border-radius: 9999px;
  text-transform: capitalize;
}
</style>
