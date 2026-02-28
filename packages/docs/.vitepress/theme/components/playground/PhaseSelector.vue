<script setup lang="ts">
import { phaseColors } from '../../colors'

const PHASES = [
  { code: 'S', name: 'Spawn', key: 'discover' },
  { code: 'N', name: 'Navigate', key: 'plan' },
  { code: 'I', name: 'Implement', key: 'solve' },
  { code: 'P', name: 'Parallelize', key: 'sprint' },
  { code: 'E', name: 'Evaluate', key: 'review' },
  { code: 'R', name: 'Release', key: 'release' },
] as const

const props = defineProps<{
  selected: string | null
  availablePhases: Set<string>
}>()

const emit = defineEmits<{
  select: [phase: string | null]
}>()

function toggle(key: string) {
  if (props.selected === key) {
    emit('select', null)
  } else {
    emit('select', key)
  }
}
</script>

<template>
  <div class="phase-selector" role="radiogroup" aria-label="Select phase">
    <button
      v-for="phase in PHASES"
      :key="phase.key"
      class="phase-circle"
      :class="{
        active: selected === phase.key,
        available: availablePhases.has(phase.key),
        unavailable: !availablePhases.has(phase.key),
      }"
      :style="{
        '--phase-color': phaseColors[phase.code],
      }"
      :disabled="!availablePhases.has(phase.key)"
      :aria-checked="selected === phase.key"
      role="radio"
      :title="phase.name"
      @click="toggle(phase.key)"
    >
      <span class="phase-code">{{ phase.code }}</span>
      <span class="phase-name">{{ phase.name }}</span>
    </button>
  </div>
</template>

<style scoped>
.phase-selector {
  display: flex;
  gap: 8px;
  padding: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.phase-circle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  border: 2px solid var(--vp-c-divider);
  border-radius: var(--sniper-radius-md);
  background: var(--vp-c-bg);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 72px;
}

.phase-circle.available:hover {
  border-color: var(--phase-color);
  box-shadow: 0 0 12px color-mix(in srgb, var(--phase-color) 20%, transparent);
}

.phase-circle.active {
  border-color: var(--phase-color);
  background: color-mix(in srgb, var(--phase-color) 10%, transparent);
  box-shadow: 0 0 16px color-mix(in srgb, var(--phase-color) 25%, transparent);
}

.phase-circle.unavailable {
  opacity: 0.35;
  cursor: not-allowed;
}

.phase-code {
  font-size: 20px;
  font-weight: 700;
  color: var(--phase-color);
  font-family: var(--sniper-font-mono);
}

.phase-name {
  font-size: 11px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.phase-circle.active .phase-name {
  color: var(--vp-c-text-1);
}

@media (prefers-reduced-motion: reduce) {
  .phase-circle { transition: none; }
}
</style>
