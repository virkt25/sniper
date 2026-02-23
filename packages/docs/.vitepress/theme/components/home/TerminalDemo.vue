<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

interface Line {
  type: 'prompt' | 'output' | 'comment' | 'success' | 'heading'
  text: string
  delay: number
}

const scenes: Record<string, Line[]> = {
  Init: [
    { type: 'prompt', text: '~/my-project $ sniper init', delay: 0 },
    { type: 'output', text: 'Scaffolding SNIPER into ./my-project...', delay: 400 },
    { type: 'output', text: 'Created .sniper/config.yaml', delay: 200 },
    { type: 'output', text: 'Created .sniper/personas/ (42 persona layers)', delay: 200 },
    { type: 'output', text: 'Created .sniper/teams/ (17 team configs)', delay: 200 },
    { type: 'output', text: 'Created .sniper/templates/ (38 templates)', delay: 200 },
    { type: 'success', text: 'SNIPER initialized. Run /sniper-discover to begin.', delay: 400 },
  ],
  Discover: [
    { type: 'prompt', text: '> /sniper-discover', delay: 0 },
    { type: 'comment', text: '# Spawning discovery team (3 agents)...', delay: 500 },
    { type: 'output', text: '[analyst] Researching market & competitors...', delay: 300 },
    { type: 'output', text: '[risk-researcher] Assessing technical risks...', delay: 200 },
    { type: 'output', text: '[user-researcher] Building user personas...', delay: 200 },
    { type: 'comment', text: '# All agents working in parallel', delay: 800 },
    { type: 'output', text: '[analyst] Wrote artifacts/brief.md', delay: 600 },
    { type: 'output', text: '[risk-researcher] Wrote artifacts/risks.md', delay: 400 },
    { type: 'output', text: '[user-researcher] Wrote artifacts/personas.md', delay: 300 },
    { type: 'success', text: 'Discovery complete. Run /sniper-review to proceed.', delay: 400 },
  ],
  Plan: [
    { type: 'prompt', text: '> /sniper-plan', delay: 0 },
    { type: 'comment', text: '# Spawning plan team (4 agents, Opus)...', delay: 500 },
    { type: 'output', text: '[product-manager] Writing PRD from brief...', delay: 400 },
    { type: 'output', text: '[product-manager] Wrote artifacts/prd.md', delay: 800 },
    { type: 'comment', text: '# PRD complete → spawning parallel specs', delay: 300 },
    { type: 'output', text: '[architect] Designing system architecture...', delay: 300 },
    { type: 'output', text: '[ux-designer] Creating UX specification...', delay: 200 },
    { type: 'output', text: '[security-analyst] Running threat model...', delay: 200 },
    { type: 'success', text: 'Plan phase complete. STRICT gate: review required.', delay: 600 },
  ],
  Sprint: [
    { type: 'prompt', text: '> /sniper-sprint --stories 1,2,3', delay: 0 },
    { type: 'comment', text: '# Spawning sprint team (4 agents)...', delay: 500 },
    { type: 'output', text: '[backend-dev] Story #1: Auth API endpoints', delay: 300 },
    { type: 'output', text: '[frontend-dev] Story #2: Login UI components', delay: 200 },
    { type: 'output', text: '[infra-dev] Story #3: Database migrations', delay: 200 },
    { type: 'output', text: '[qa-engineer] Preparing test suites...', delay: 200 },
    { type: 'comment', text: '# Agents coordinating on API contracts', delay: 600 },
    { type: 'output', text: '[backend-dev] Story #1 complete, 14 tests passing', delay: 700 },
    { type: 'output', text: '[frontend-dev] Story #2 complete, 8 tests passing', delay: 400 },
    { type: 'output', text: '[infra-dev] Story #3 complete, migrations verified', delay: 300 },
    { type: 'output', text: '[qa-engineer] Integration tests: 22/22 passing', delay: 400 },
    { type: 'success', text: 'Sprint complete. PR #47 created.', delay: 400 },
  ],
}

const sceneNames = Object.keys(scenes)
const activeScene = ref('Init')
const visibleLines = ref<Line[]>([])
const isPlaying = ref(false)
const reducedMotion = ref(false)

let timeouts: ReturnType<typeof setTimeout>[] = []

function clearTimeouts() {
  timeouts.forEach(clearTimeout)
  timeouts = []
}

function playScene(name: string) {
  clearTimeouts()
  activeScene.value = name
  const lines = scenes[name]

  if (reducedMotion.value) {
    visibleLines.value = [...lines]
    isPlaying.value = false
    return
  }

  visibleLines.value = []
  isPlaying.value = true

  let cumDelay = 0
  lines.forEach((line, i) => {
    cumDelay += line.delay
    const t = setTimeout(() => {
      visibleLines.value = [...visibleLines.value, line]
      if (i === lines.length - 1) isPlaying.value = false
    }, cumDelay)
    timeouts.push(t)
  })
}

function replay() {
  playScene(activeScene.value)
}

watch(activeScene, (name) => playScene(name))

onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  playScene('Init')
})

onUnmounted(() => clearTimeouts())
</script>

<template>
  <div class="terminal-demo">
    <div class="terminal-chrome">
      <div class="terminal-dots">
        <span class="dot red" />
        <span class="dot yellow" />
        <span class="dot green" />
      </div>
      <div class="terminal-tabs">
        <button
          v-for="name in sceneNames" :key="name"
          class="tab"
          :class="{ active: activeScene === name }"
          @click="activeScene = name"
        >{{ name }}</button>
      </div>
      <button class="replay-btn" @click="replay" :disabled="isPlaying" aria-label="Replay">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      </button>
    </div>
    <div class="terminal-body">
      <TransitionGroup name="line" tag="div" class="terminal-lines">
        <div v-for="(line, i) in visibleLines" :key="i" class="terminal-line" :class="line.type">
          {{ line.text }}
        </div>
      </TransitionGroup>
      <span v-if="isPlaying" class="blinking-cursor">_</span>
    </div>
  </div>
</template>

<style scoped>
.terminal-demo {
  max-width: 680px;
  margin: 0 auto;
  border-radius: var(--sniper-radius-lg);
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.3), 0 0 40px rgba(99, 102, 241, 0.1);
  font-family: var(--sniper-font-mono);
  font-size: 0.85rem;
  line-height: 1.7;
}

.terminal-chrome {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #161b22;
  border-bottom: 1px solid #30363d;
}

.terminal-dots {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.terminal-dots .dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.terminal-dots .dot.red { background: #ff5f57; }
.terminal-dots .dot.yellow { background: #febc2e; }
.terminal-dots .dot.green { background: #28c840; }

.terminal-tabs {
  display: flex;
  gap: 4px;
  flex: 1;
}

.tab {
  padding: 4px 12px;
  border: none;
  background: transparent;
  color: #8b949e;
  font-family: var(--sniper-font-mono);
  font-size: 0.8rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}
.tab:hover { background: #21262d; color: #c9d1d9; }
.tab.active { background: #30363d; color: #f0f6fc; }

.replay-btn {
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
  transition: background 0.2s ease, color 0.2s ease;
}
.replay-btn:hover { background: #21262d; color: #c9d1d9; }
.replay-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.terminal-body {
  background: #0d1117;
  padding: 16px 20px;
  min-height: 280px;
  color: #c9d1d9;
}

.terminal-line {
  white-space: pre-wrap;
  word-break: break-word;
}

.terminal-line.prompt {
  color: #d2a8ff;
  font-weight: 600;
}
.terminal-line.output {
  color: #8b949e;
}
.terminal-line.comment {
  color: #484f58;
  font-style: italic;
}
.terminal-line.success {
  color: #3fb950;
  font-weight: 600;
}
.terminal-line.heading {
  color: #58a6ff;
  font-weight: 700;
}

.blinking-cursor {
  animation: typewriter-cursor 0.8s step-end infinite;
  color: #d2a8ff;
}

/* Line transitions */
.line-enter-active {
  transition: all 0.25s ease;
}
.line-enter-from {
  opacity: 0;
  transform: translateX(-8px);
}
</style>
