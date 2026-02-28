<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const phases = [
  { name: 'Spawn', letter: 'S', color: '#6366f1', desc: 'Initialize your project. SNIPER scaffolds agents, protocols, and templates tailored to your codebase.', cmd: '/sniper-init' },
  { name: 'Navigate', letter: 'N', color: '#818cf8', desc: 'Discover & plan. Agent teams research the domain, define architecture, and produce specs in parallel.', cmd: '/sniper-flow' },
  { name: 'Implement', letter: 'I', color: '#a78bfa', desc: 'Build with parallel agents. Backend, frontend, and infra agents implement stories with file ownership boundaries.', cmd: '/sniper-flow' },
  { name: 'Parallelize', letter: 'P', color: '#c084fc', desc: 'Self-healing CI. Hooks detect test and lint failures, instructing agents to fix before proceeding.', cmd: '/sniper-flow' },
  { name: 'Evaluate', letter: 'E', color: '#f97316', desc: 'Multi-faceted review. Scope validation, standards enforcement, and risk scoring across three dimensions.', cmd: '/sniper-review' },
  { name: 'Release', letter: 'R', color: '#fb923c', desc: 'Ship with confidence. Artifacts verified, specs reconciled, and retrospective metrics recorded for velocity calibration.', cmd: '/sniper-flow' },
]

const activeIndex = ref(0)
const isPaused = ref(false)
const reducedMotion = ref(false)
let autoTimer: ReturnType<typeof setInterval> | null = null
let resumeTimer: ReturnType<typeof setTimeout> | null = null

const cx = 200
const cy = 200
const r = 140

function getPos(i: number) {
  const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
}

const progressOffset = computed(() => {
  const circumference = 2 * Math.PI * 160
  return circumference - (circumference * (activeIndex.value + 1)) / 6
})

const progressCircumference = computed(() => 2 * Math.PI * 160)

function selectPhase(i: number) {
  activeIndex.value = i
  isPaused.value = true
  if (autoTimer) clearInterval(autoTimer)
  if (resumeTimer) clearTimeout(resumeTimer)
  resumeTimer = setTimeout(() => {
    isPaused.value = false
    startAuto()
  }, 6000)
}

function startAuto() {
  if (reducedMotion.value) return
  autoTimer = setInterval(() => {
    if (!isPaused.value) {
      activeIndex.value = (activeIndex.value + 1) % 6
    }
  }, 3500)
}

onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!reducedMotion.value) startAuto()
})

onUnmounted(() => {
  if (autoTimer) clearInterval(autoTimer)
  if (resumeTimer) clearTimeout(resumeTimer)
})
</script>

<template>
  <div class="lifecycle-wheel">
    <div class="wheel-container">
      <svg viewBox="0 0 400 400" class="wheel-svg" role="img" aria-label="SNIPER lifecycle wheel">
        <!-- Progress ring -->
        <circle
          :r="160" :cx="cx" :cy="cy"
          fill="none"
          stroke="var(--vp-c-divider)"
          stroke-width="2"
        />
        <circle
          :r="160" :cx="cx" :cy="cy"
          fill="none"
          stroke="var(--sniper-brand)"
          stroke-width="3"
          :stroke-dasharray="progressCircumference"
          :stroke-dashoffset="progressOffset"
          stroke-linecap="round"
          transform="rotate(-90 200 200)"
          style="transition: stroke-dashoffset 0.6s ease"
        />
        <!-- Connector lines -->
        <line
          v-for="(_, i) in phases" :key="'line-' + i"
          :x1="getPos(i).x" :y1="getPos(i).y"
          :x2="getPos((i + 1) % 6).x" :y2="getPos((i + 1) % 6).y"
          stroke="var(--vp-c-divider)"
          stroke-width="1"
          stroke-dasharray="4 4"
        />
        <!-- Phase nodes -->
        <g
          v-for="(phase, i) in phases" :key="phase.name"
          :transform="`translate(${getPos(i).x}, ${getPos(i).y})`"
          class="phase-node"
          :class="{ active: i === activeIndex }"
          role="button"
          :tabindex="0"
          :aria-label="phase.name"
          @click="selectPhase(i)"
          @keydown.enter="selectPhase(i)"
          @keydown.space.prevent="selectPhase(i)"
        >
          <circle
            r="28"
            :fill="i === activeIndex ? phase.color : 'var(--vp-c-bg-soft)'"
            :stroke="phase.color"
            stroke-width="2"
            style="transition: fill 0.3s ease"
          />
          <text
            text-anchor="middle"
            dominant-baseline="central"
            :fill="i === activeIndex ? '#fff' : phase.color"
            font-weight="700"
            font-size="16"
            style="transition: fill 0.3s ease; pointer-events: none"
          >{{ phase.letter }}</text>
          <text
            text-anchor="middle"
            :y="42"
            fill="var(--vp-c-text-2)"
            font-size="11"
            font-weight="500"
            style="pointer-events: none"
          >{{ phase.name }}</text>
        </g>
      </svg>
    </div>
    <Transition name="phase-slide" mode="out-in">
      <div class="phase-detail" :key="activeIndex">
        <div class="phase-detail-header">
          <span class="phase-badge" :style="{ background: phases[activeIndex].color }">
            {{ phases[activeIndex].letter }}
          </span>
          <h3>{{ phases[activeIndex].name }}</h3>
        </div>
        <p>{{ phases[activeIndex].desc }}</p>
        <code class="phase-cmd">{{ phases[activeIndex].cmd }}</code>
        <div class="phase-dots">
          <button
            v-for="(_, i) in phases" :key="i"
            class="dot"
            :class="{ active: i === activeIndex }"
            :aria-label="`Go to ${phases[i].name}`"
            @click="selectPhase(i)"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.lifecycle-wheel {
  display: flex;
  align-items: center;
  gap: 48px;
  max-width: var(--section-max-width);
  margin: 0 auto;
}

.wheel-container {
  flex-shrink: 0;
  width: 340px;
}

.wheel-svg {
  width: 100%;
  height: auto;
}

.phase-node {
  cursor: pointer;
}
.phase-node:focus-visible circle {
  stroke-width: 4;
}

.phase-detail {
  flex: 1;
  min-width: 0;
}

.phase-detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.phase-badge {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}

.phase-detail h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.phase-detail p {
  color: var(--vp-c-text-2);
  line-height: 1.7;
  margin: 0 0 16px;
}

.phase-cmd {
  display: inline-block;
  padding: 6px 14px;
  border-radius: var(--sniper-radius-sm);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  font-family: var(--sniper-font-mono);
  font-size: 0.9rem;
  color: var(--sniper-brand);
}

.phase-dots {
  display: flex;
  gap: 8px;
  margin-top: 20px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  padding: 0;
  background: var(--vp-c-divider);
  cursor: pointer;
  transition: background 0.3s ease, transform 0.3s ease;
}
.dot.active {
  background: var(--sniper-brand);
  transform: scale(1.4);
}

/* Transition */
.phase-slide-enter-active,
.phase-slide-leave-active {
  transition: all 0.3s ease;
}
.phase-slide-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.phase-slide-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}

@media (max-width: 768px) {
  .lifecycle-wheel {
    flex-direction: column;
    gap: 24px;
  }
  .wheel-container {
    width: 280px;
  }
}
</style>
