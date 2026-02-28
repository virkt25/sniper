<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { layerColors, phaseColors } from '../../colors'
import type { PlaygroundTeam, TeamMember } from './usePlaygroundData'

const props = defineProps<{
  team: PlaygroundTeam
  disabledMembers: Set<string>
}>()

const emit = defineEmits<{
  'toggle-member': [name: string]
}>()

const canvasRef = ref<HTMLElement | null>(null)
const svgLines = ref<Array<{ x1: number; y1: number; x2: number; y2: number; label: string }>>([])

let resizeObserver: ResizeObserver | null = null

const activeMembers = computed(() =>
  props.team.members.filter((m) => !props.disabledMembers.has(m.name))
)

const activeDependencies = computed(() =>
  props.team.dependencies.filter(
    (d) => !props.disabledMembers.has(d.from) && !props.disabledMembers.has(d.to)
  )
)

function toggleMember(member: TeamMember) {
  emit('toggle-member', member.name)
}

function getLayerColor(layer: string): string {
  return layerColors[layer] ?? '#6b7280'
}

function getPrimaryBorder(layers: string[]): string {
  return layers.length > 0 ? getLayerColor(layers[0]) : '#6b7280'
}

function computeLines() {
  if (!canvasRef.value || activeDependencies.value.length === 0) {
    svgLines.value = []
    return
  }

  const container = canvasRef.value
  const boxes = container.querySelectorAll<HTMLElement>('.member-box')
  const boxMap = new Map<string, HTMLElement>()
  boxes.forEach((box) => {
    const name = box.dataset.member
    if (name) boxMap.set(name, box)
  })

  const containerRect = container.getBoundingClientRect()
  const lines: typeof svgLines.value = []

  for (const dep of activeDependencies.value) {
    const fromEl = boxMap.get(dep.from)
    const toEl = boxMap.get(dep.to)
    if (!fromEl || !toEl) continue
    const fromRect = fromEl.getBoundingClientRect()
    const toRect = toEl.getBoundingClientRect()
    lines.push({
      x1: fromRect.left + fromRect.width / 2 - containerRect.left,
      y1: fromRect.top + fromRect.height / 2 - containerRect.top,
      x2: toRect.left + toRect.width / 2 - containerRect.left,
      y2: toRect.top + toRect.height / 2 - containerRect.top,
      label: dep.label,
    })
  }

  svgLines.value = lines
}

watch([() => props.team, () => props.disabledMembers], async () => {
  await nextTick()
  computeLines()
})

onMounted(async () => {
  await nextTick()
  computeLines()
  if (canvasRef.value) {
    resizeObserver = new ResizeObserver(() => computeLines())
    resizeObserver.observe(canvasRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

const phaseColor = computed(() => phaseColors[props.team.phaseCode ?? ''] ?? 'var(--sniper-brand)')
</script>

<template>
  <div class="team-canvas" ref="canvasRef">
    <div class="canvas-header">
      <h3 class="canvas-name">{{ team.name }}</h3>
      <span class="canvas-phase" :style="{ backgroundColor: phaseColor }">{{ team.phase }}</span>
      <span v-if="team.reviewGate" class="canvas-gate" :class="`gate-${team.reviewGate.mode}`">
        {{ team.reviewGate.mode }}
      </span>
      <span class="canvas-count">{{ activeMembers.length }}/{{ team.members.length }} members</span>
    </div>

    <div class="canvas-body">
      <svg
        v-if="svgLines.length"
        class="dep-lines"
        aria-hidden="true"
      >
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="var(--vp-c-text-3)" />
          </marker>
        </defs>
        <g v-for="(line, i) in svgLines" :key="i">
          <line
            :x1="line.x1" :y1="line.y1"
            :x2="line.x2" :y2="line.y2"
            marker-end="url(#arrowhead)"
          />
          <text
            :x="(line.x1 + line.x2) / 2"
            :y="(line.y1 + line.y2) / 2 - 6"
            class="dep-label"
          >{{ line.label }}</text>
        </g>
      </svg>

      <div
        v-for="member in team.members"
        :key="member.name"
        class="member-box"
        :class="{ disabled: disabledMembers.has(member.name) }"
        :data-member="member.name"
        :style="{ borderColor: disabledMembers.has(member.name) ? 'var(--vp-c-divider)' : getPrimaryBorder(member.layers) }"
        tabindex="0"
        role="button"
        :aria-pressed="!disabledMembers.has(member.name)"
        :aria-label="`Toggle ${member.name}`"
        @click="toggleMember(member)"
        @keydown.enter="toggleMember(member)"
        @keydown.space.prevent="toggleMember(member)"
      >
        <div class="member-name">{{ member.name }}</div>
        <div class="member-layers">
          <span
            v-for="layer in member.layers"
            :key="layer"
            class="layer-tag"
            :style="{ backgroundColor: disabledMembers.has(member.name) ? '#6b7280' : getLayerColor(layer) }"
          >{{ layer }}</span>
        </div>
      </div>
    </div>

    <div v-if="team.coordination.length > 0" class="canvas-coordination">
      <h4 class="coord-title">Coordination</h4>
      <div v-for="(coord, i) in team.coordination" :key="i" class="coord-item">
        <span class="coord-members">{{ coord.between.join(' ↔ ') }}</span>
        <span class="coord-topic">{{ coord.topic }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.team-canvas {
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--sniper-radius-md);
  overflow: hidden;
  background: var(--vp-c-bg);
}

.canvas-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  flex-wrap: wrap;
}

.canvas-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.canvas-phase {
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  padding: 2px 10px;
  border-radius: 9999px;
}

.canvas-gate {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: capitalize;
}

.canvas-gate.gate-strict {
  background: color-mix(in srgb, #ef4444 15%, transparent);
  color: #ef4444;
}

.canvas-gate.gate-flexible {
  background: color-mix(in srgb, #f59e0b 15%, transparent);
  color: #f59e0b;
}

.canvas-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.canvas-body {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 20px;
  position: relative;
  min-height: 120px;
}

.dep-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.dep-lines line {
  stroke: var(--vp-c-text-3);
  stroke-width: 1.5;
  stroke-dasharray: 5 4;
}

.dep-label {
  font-size: 10px;
  fill: var(--vp-c-text-3);
  text-anchor: middle;
}

.member-box {
  flex: 1 1 140px;
  min-width: 130px;
  max-width: 200px;
  border: 2px solid var(--vp-c-divider);
  border-radius: var(--sniper-radius-sm);
  padding: 12px;
  background: var(--vp-c-bg);
  text-align: center;
  cursor: pointer;
  position: relative;
  z-index: 1;
  transition: all 0.2s ease;
}

.member-box:hover {
  box-shadow: 0 0 12px color-mix(in srgb, currentColor 10%, transparent);
  transform: translateY(-2px);
}

.member-box:focus-visible {
  outline: 2px solid var(--sniper-brand);
  outline-offset: 2px;
}

.member-box.disabled {
  opacity: 0.4;
  transform: none;
  box-shadow: none;
}

.member-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin-bottom: 6px;
}

.member-layers {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 3px;
}

.layer-tag {
  font-size: 10px;
  font-weight: 500;
  color: #fff;
  padding: 1px 6px;
  border-radius: 9999px;
  text-transform: capitalize;
}

.canvas-coordination {
  padding: 12px 16px;
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.coord-title {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.coord-item {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 13px;
  line-height: 1.4;
}

.coord-members {
  font-weight: 600;
  color: var(--vp-c-text-1);
  font-family: var(--sniper-font-mono);
  font-size: 12px;
  white-space: nowrap;
}

.coord-topic {
  color: var(--vp-c-text-2);
}

@media (prefers-reduced-motion: reduce) {
  .member-box { transition: none; }
}
</style>
