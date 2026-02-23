<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { phaseColors, layerColors } from '../colors'

const props = defineProps<{
  name: string
  phase: string
  members: Array<{ name: string; layers: string[] }>
  gateMode?: string
  dependencies?: Array<{ from: string; to: string }>
}>()

const emit = defineEmits<{
  'member-click': [member: { name: string; layers: string[] }]
}>()

const phaseColor = phaseColors[props.phase] ?? 'var(--sniper-brand)'

function getLayerColor(layer: string): string {
  return layerColors[layer] ?? '#6b7280'
}

function getPrimaryBorder(layers: string[]): string {
  return layers.length > 0 ? getLayerColor(layers[0]) : '#6b7280'
}

const gateModeClass = props.gateMode ? `gate-${props.gateMode}` : ''

const svgLines = ref<Array<{ x1: number; y1: number; x2: number; y2: number }>>([])
const diagramRef = ref<HTMLElement | null>(null)

let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
  if (!props.dependencies?.length || !diagramRef.value) return
  await nextTick()
  computeLines()

  resizeObserver = new ResizeObserver(() => computeLines())
  resizeObserver.observe(diagramRef.value)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

function computeLines() {
  if (!diagramRef.value || !props.dependencies?.length) return
  const container = diagramRef.value
  const boxes = container.querySelectorAll<HTMLElement>('.member-box')
  const boxMap = new Map<string, HTMLElement>()
  boxes.forEach((box) => {
    const name = box.dataset.member
    if (name) boxMap.set(name, box)
  })

  const containerRect = container.getBoundingClientRect()
  const lines: typeof svgLines.value = []

  for (const dep of props.dependencies) {
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
    })
  }
  svgLines.value = lines
}
</script>

<template>
  <div class="team-diagram" ref="diagramRef">
    <div class="team-header">
      <h3 class="team-name">{{ name }}</h3>
      <span class="team-phase" :style="{ backgroundColor: phaseColor }">
        {{ phase }}
      </span>
      <span v-if="gateMode" :class="['gate-badge', gateModeClass]">
        {{ gateMode }}
      </span>
    </div>

    <div class="team-members">
      <svg
        v-if="svgLines.length"
        class="dep-lines"
        aria-hidden="true"
      >
        <line
          v-for="(line, i) in svgLines"
          :key="i"
          :x1="line.x1"
          :y1="line.y1"
          :x2="line.x2"
          :y2="line.y2"
        />
      </svg>
      <div
        v-for="member in members"
        :key="member.name"
        class="member-box"
        :data-member="member.name"
        :style="{ borderColor: getPrimaryBorder(member.layers) }"
        tabindex="0"
        role="button"
        @click="emit('member-click', member)"
        @keydown.enter="emit('member-click', member)"
      >
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
  border-radius: var(--sniper-radius-md);
  padding: 20px;
  margin: 16px 0;
  background: var(--vp-c-bg-soft);
  position: relative;
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
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  padding: 2px 10px;
  border-radius: 9999px;
}

.gate-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: capitalize;
}

.team-members {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  position: relative;
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
  stroke: var(--vp-c-divider);
  stroke-width: 1.5;
  stroke-dasharray: 4 3;
}

.member-box {
  flex: 1 1 140px;
  min-width: 140px;
  border: 2px solid var(--vp-c-divider);
  border-radius: var(--sniper-radius-sm);
  padding: 12px;
  background: var(--vp-c-bg);
  text-align: center;
  cursor: pointer;
  position: relative;
  z-index: 1;
  transition: box-shadow var(--sniper-duration) var(--sniper-ease),
              transform var(--sniper-duration) var(--sniper-ease);
}

.member-box:hover {
  box-shadow: 0 0 16px color-mix(in srgb, currentColor 15%, transparent);
  transform: translateY(-2px);
}

.member-box:focus-visible {
  outline: 2px solid var(--sniper-brand);
  outline-offset: 2px;
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

@media (prefers-reduced-motion: reduce) {
  .member-box {
    transition: none;
  }
}
</style>
