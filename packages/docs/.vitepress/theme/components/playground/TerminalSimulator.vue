<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import CopyButton from './CopyButton.vue'

interface Line {
  type: 'prompt' | 'output' | 'comment' | 'success' | 'heading'
  text: string
  delay: number
}

const props = defineProps<{
  lines: Line[]
  title?: string
}>()

const visibleLines = ref<Line[]>([])
const isPlaying = ref(false)
const isStepMode = ref(false)
const currentStep = ref(0)
const reducedMotion = ref(false)

let timeouts: ReturnType<typeof setTimeout>[] = []

function clearTimeouts() {
  timeouts.forEach(clearTimeout)
  timeouts = []
}

function playAll() {
  clearTimeouts()
  isStepMode.value = false
  currentStep.value = 0

  if (reducedMotion.value) {
    visibleLines.value = [...props.lines]
    isPlaying.value = false
    return
  }

  visibleLines.value = []
  isPlaying.value = true

  let cumDelay = 0
  props.lines.forEach((line, i) => {
    cumDelay += line.delay
    const t = setTimeout(() => {
      visibleLines.value = [...visibleLines.value, line]
      currentStep.value = i + 1
      if (i === props.lines.length - 1) isPlaying.value = false
    }, cumDelay)
    timeouts.push(t)
  })
}

function stepThrough() {
  clearTimeouts()
  isStepMode.value = true
  isPlaying.value = false

  if (currentStep.value === 0) {
    visibleLines.value = []
  }

  if (currentStep.value < props.lines.length) {
    visibleLines.value = [...visibleLines.value, props.lines[currentStep.value]]
    currentStep.value++
  }
}

function reset() {
  clearTimeouts()
  visibleLines.value = []
  isPlaying.value = false
  isStepMode.value = false
  currentStep.value = 0
}

const outputText = ref('')
watch(visibleLines, (lines) => {
  outputText.value = lines.map((l) => l.text).join('\n')
})

watch(() => props.lines, () => {
  playAll()
})

onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  playAll()
})

onUnmounted(() => clearTimeouts())
</script>

<template>
  <div class="terminal-simulator">
    <div class="terminal-chrome">
      <div class="terminal-dots">
        <span class="dot red" />
        <span class="dot yellow" />
        <span class="dot green" />
      </div>
      <span v-if="title" class="terminal-title">{{ title }}</span>
      <div class="terminal-controls">
        <button
          class="control-btn"
          @click="playAll"
          :disabled="isPlaying"
          aria-label="Play all"
          title="Play all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        </button>
        <button
          class="control-btn"
          @click="stepThrough"
          :disabled="isPlaying || currentStep >= lines.length"
          aria-label="Next step"
          title="Step through"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M5 4l8 8-8 8" />
            <line x1="19" y1="4" x2="19" y2="20" />
          </svg>
        </button>
        <button
          class="control-btn"
          @click="reset"
          :disabled="isPlaying"
          aria-label="Reset"
          title="Reset"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>
        <CopyButton :text="outputText" />
      </div>
    </div>

    <div class="terminal-progress" v-if="lines.length > 0">
      <div
        class="terminal-progress-bar"
        :style="{ width: `${(currentStep / lines.length) * 100}%` }"
      />
    </div>

    <div class="terminal-body">
      <TransitionGroup name="line" tag="div" class="terminal-lines">
        <div
          v-for="(line, i) in visibleLines"
          :key="i"
          class="terminal-line"
          :class="line.type"
        >{{ line.text }}</div>
      </TransitionGroup>
      <span v-if="isPlaying" class="blinking-cursor">_</span>
      <div v-if="isStepMode && currentStep < lines.length" class="step-hint">
        Press "Next" to continue ({{ currentStep }}/{{ lines.length }})
      </div>
    </div>
  </div>
</template>

<style scoped>
.terminal-simulator {
  border-radius: var(--sniper-radius-lg);
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2), 0 0 20px rgba(99, 102, 241, 0.08);
  font-family: var(--sniper-font-mono);
  font-size: 0.85rem;
  line-height: 1.7;
}

.terminal-chrome {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: #161b22;
  border-bottom: 1px solid #30363d;
}

.terminal-dots {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.dot { width: 12px; height: 12px; border-radius: 50%; }
.dot.red { background: #ff5f57; }
.dot.yellow { background: #febc2e; }
.dot.green { background: #28c840; }

.terminal-title {
  flex: 1;
  font-size: 12px;
  color: #8b949e;
  text-align: center;
}

.terminal-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #8b949e;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.control-btn:hover { background: #21262d; color: #c9d1d9; }
.control-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.terminal-progress {
  height: 2px;
  background: #21262d;
}

.terminal-progress-bar {
  height: 100%;
  background: var(--sniper-brand, #6366f1);
  transition: width 0.3s ease;
}

.terminal-body {
  background: #0d1117;
  padding: 16px 20px;
  min-height: 240px;
  max-height: 400px;
  overflow-y: auto;
  color: #c9d1d9;
}

.terminal-line {
  white-space: pre-wrap;
  word-break: break-word;
}
.terminal-line.prompt { color: #d2a8ff; font-weight: 600; }
.terminal-line.output { color: #8b949e; }
.terminal-line.comment { color: #484f58; font-style: italic; }
.terminal-line.success { color: #3fb950; font-weight: 600; }
.terminal-line.heading { color: #58a6ff; font-weight: 700; }

.blinking-cursor {
  animation: typewriter-cursor 0.8s step-end infinite;
  color: #d2a8ff;
}

@keyframes typewriter-cursor {
  50% { opacity: 0; }
}

.step-hint {
  margin-top: 12px;
  font-size: 12px;
  color: #484f58;
  font-style: italic;
}

.line-enter-active { transition: all 0.2s ease; }
.line-enter-from { opacity: 0; transform: translateX(-6px); }

@media (prefers-reduced-motion: reduce) {
  .terminal-progress-bar { transition: none; }
  .line-enter-active { transition: none; }
  .blinking-cursor { animation: none; }
}
</style>
