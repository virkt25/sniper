<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { phaseColors } from '../colors'

const props = withDefaults(defineProps<{
  activePhase?: string
  interactive?: boolean
}>(), {
  interactive: true,
})

const emit = defineEmits<{
  select: [phase: { key: string; name: string; color: string }]
}>()

const phases = [
  { key: 'S', name: 'Spawn', color: phaseColors.S },
  { key: 'N', name: 'Navigate', color: phaseColors.N },
  { key: 'I', name: 'Implement', color: phaseColors.I },
  { key: 'P', name: 'Parallelize', color: phaseColors.P },
  { key: 'E', name: 'Evaluate', color: phaseColors.E },
  { key: 'R', name: 'Release', color: phaseColors.R },
]

const animated = ref(false)

onMounted(() => {
  requestAnimationFrame(() => {
    animated.value = true
  })
})

function handleClick(phase: typeof phases[number]) {
  if (props.interactive) {
    emit('select', phase)
  }
}
</script>

<template>
  <div class="phase-timeline" role="list">
    <div class="timeline-track">
      <div class="timeline-line">
        <div class="timeline-line-fill" :class="{ animated }" />
      </div>
      <div
        v-for="(phase, index) in phases"
        :key="phase.key"
        class="phase-node-wrapper"
        role="listitem"
      >
        <button
          class="phase-node"
          :class="{
            active: activePhase === phase.key,
            interactive: interactive,
          }"
          :style="{
            '--phase-color': phase.color,
            '--node-delay': `${index * 0.1}s`,
          }"
          :aria-label="`${phase.name} phase`"
          :aria-current="activePhase === phase.key ? 'step' : undefined"
          :tabindex="interactive ? 0 : -1"
          @click="handleClick(phase)"
        >
          {{ phase.key }}
        </button>
        <span class="phase-label">{{ phase.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.phase-timeline {
  width: 100%;
  overflow-x: auto;
  padding: 16px 0 8px;
  -webkit-overflow-scrolling: touch;
}

.timeline-track {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
  min-width: 480px;
  padding: 0 24px;
}

.timeline-line {
  position: absolute;
  top: 22px;
  left: 48px;
  right: 48px;
  height: 2px;
  background: var(--vp-c-divider);
  z-index: 0;
}

.timeline-line-fill {
  height: 100%;
  width: 0;
  background: linear-gradient(90deg, #6366f1, #8b5cf6, #10b981, #f59e0b, #f97316, #ef4444);
  border-radius: 1px;
  transition: width 1.2s var(--sniper-ease);
}

.timeline-line-fill.animated {
  width: 100%;
}

.phase-node-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 1;
}

.phase-node {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid var(--phase-color);
  background: var(--vp-c-bg);
  color: var(--phase-color);
  font-family: var(--sniper-font-mono);
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  transition: all var(--sniper-duration) var(--sniper-ease);
  opacity: 0;
  transform: scale(0.5);
  animation: node-appear 0.4s var(--sniper-ease-bounce) forwards;
  animation-delay: var(--node-delay);
}

.phase-node.interactive {
  cursor: pointer;
}

.phase-node.interactive:hover {
  background: var(--phase-color);
  color: #fff;
  transform: scale(1.1);
  box-shadow: 0 0 16px color-mix(in srgb, var(--phase-color) 40%, transparent);
}

.phase-node.interactive:focus-visible {
  outline: 2px solid var(--phase-color);
  outline-offset: 3px;
}

.phase-node.active {
  background: var(--phase-color);
  color: #fff;
  box-shadow: 0 0 20px color-mix(in srgb, var(--phase-color) 35%, transparent);
}

.phase-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  white-space: nowrap;
}

@keyframes node-appear {
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .phase-node {
    animation: none;
    opacity: 1;
    transform: scale(1);
  }
  .timeline-line-fill {
    transition: none;
    width: 100%;
  }
}
</style>
