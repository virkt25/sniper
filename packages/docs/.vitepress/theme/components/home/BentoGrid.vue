<script setup lang="ts">
import { ref } from 'vue'

const activeCell = ref<number | null>(null)

function toggleCell(i: number) {
  activeCell.value = activeCell.value === i ? null : i
}

const cells = [
  {
    id: 0,
    area: 'parallel',
    title: 'Parallel Teams',
    desc: 'Up to 5 agents work simultaneously with file ownership boundaries and dependency coordination.',
    extended: 'Each agent owns specific directories. The lead coordinates API contracts and resolves conflicts. No merge chaos — ownership rules prevent collisions.',
  },
  {
    id: 1,
    area: 'persona',
    title: 'AI Personas',
    desc: '42 composable persona layers create specialized agents for every task.',
    extended: 'Combine process, technical, and cognitive layers. An "architect + backend + systems-thinker" agent thinks differently than a "frontend + UX + creative" one.',
  },
  {
    id: 2,
    area: 'gates',
    title: 'Review Gates',
    desc: 'STRICT gates block until approved. FLEXIBLE gates auto-advance with async review.',
    extended: '15 checklists cover code quality, spec compliance, security, accessibility, and performance. Nothing ships without scrutiny.',
  },
  {
    id: 3,
    area: 'packs',
    title: 'Domain Packs',
    desc: 'Plug in domain knowledge — telephony, CRM, payments — so agents understand your business.',
    extended: 'Packs provide API schemas, terminology glossaries, and integration patterns. Agents reference domain knowledge when implementing stories.',
  },
  {
    id: 4,
    area: 'cmd',
    title: '18 Slash Commands',
    desc: 'Every phase is a single command. Type it and the right team spawns automatically.',
    extended: '/sniper-discover, /sniper-plan, /sniper-solve, /sniper-sprint — plus utilities like /sniper-compose and /sniper-review.',
  },
]
</script>

<template>
  <div class="bento-grid">
    <div
      v-for="cell in cells"
      :key="cell.id"
      class="bento-cell"
      :class="[`area-${cell.area}`, { expanded: activeCell === cell.id }]"
      :style="{ gridArea: cell.area }"
      @click="toggleCell(cell.id)"
      role="button"
      :tabindex="0"
      @keydown.enter="toggleCell(cell.id)"
    >
      <!-- Mini animation per cell -->
      <div class="cell-animation" :class="`anim-${cell.area}`">
        <template v-if="cell.area === 'parallel'">
          <svg viewBox="0 0 80 80" class="mini-svg">
            <circle v-for="j in 5" :key="j"
              :cx="40 + 24 * Math.cos(2 * Math.PI * j / 5 - Math.PI / 2)"
              :cy="40 + 24 * Math.sin(2 * Math.PI * j / 5 - Math.PI / 2)"
              r="6" :fill="['#6366f1','#818cf8','#a78bfa','#c084fc','#f97316'][j-1]"
              class="pulse-dot" :style="{ animationDelay: `${j * 0.3}s` }"
            />
            <line v-for="j in 5" :key="'l'+j"
              :x1="40 + 24 * Math.cos(2 * Math.PI * j / 5 - Math.PI / 2)"
              :y1="40 + 24 * Math.sin(2 * Math.PI * j / 5 - Math.PI / 2)"
              :x2="40 + 24 * Math.cos(2 * Math.PI * ((j % 5) + 1) / 5 - Math.PI / 2)"
              :y2="40 + 24 * Math.sin(2 * Math.PI * ((j % 5) + 1) / 5 - Math.PI / 2)"
              stroke="var(--vp-c-divider)" stroke-width="1" stroke-dasharray="3 3"
            />
          </svg>
        </template>
        <template v-else-if="cell.area === 'persona'">
          <div class="badge-stack">
            <span class="role-badge" v-for="(role, j) in ['Architect', 'Backend', 'QA']" :key="role"
              :style="{ animationDelay: `${j * 1.2}s` }">
              {{ role }}
            </span>
          </div>
        </template>
        <template v-else-if="cell.area === 'gates'">
          <svg viewBox="0 0 60 60" class="mini-svg check-svg">
            <circle cx="30" cy="30" r="22" fill="none" stroke="var(--vp-c-divider)" stroke-width="2"/>
            <path d="M18 30 L26 38 L42 22" fill="none" stroke="var(--sniper-brand)" stroke-width="3"
              stroke-linecap="round" stroke-linejoin="round"
              class="checkmark-path"
            />
          </svg>
        </template>
        <template v-else-if="cell.area === 'packs'">
          <div class="card-stack">
            <div v-for="j in 3" :key="j" class="stack-card" :style="{ animationDelay: `${j * 0.4}s` }">
              <div class="stack-card-line" />
              <div class="stack-card-line short" />
            </div>
          </div>
        </template>
        <template v-else-if="cell.area === 'cmd'">
          <div class="cmd-snippet">
            <span class="cmd-prompt">&gt;</span>
            <span class="cmd-text">/sniper-sprint</span>
          </div>
        </template>
      </div>
      <h3>{{ cell.title }}</h3>
      <p>{{ cell.desc }}</p>
      <Transition name="expand">
        <p v-if="activeCell === cell.id" class="extended-desc">{{ cell.extended }}</p>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: auto auto auto;
  grid-template-areas:
    "parallel parallel parallel parallel parallel persona persona persona gates gates packs packs"
    "parallel parallel parallel parallel parallel persona persona persona gates gates packs packs"
    "cmd cmd cmd cmd cmd cmd cmd cmd cmd cmd cmd cmd";
  gap: var(--bento-gap);
  max-width: var(--section-max-width);
  margin: 0 auto;
}

.bento-cell {
  padding: 24px;
  border-radius: var(--sniper-radius-lg);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  cursor: pointer;
  transition: transform var(--sniper-duration) var(--sniper-ease),
              box-shadow var(--sniper-duration) var(--sniper-ease),
              border-color var(--sniper-duration) var(--sniper-ease);
  backdrop-filter: blur(8px);
  overflow: hidden;
}

.bento-cell:hover {
  transform: translateY(-4px);
  box-shadow: var(--sniper-shadow-lg);
  border-color: var(--sniper-brand);
}

.bento-cell h3 {
  margin: 12px 0 8px;
  font-size: 1.1rem;
  font-weight: 700;
}

.bento-cell p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  line-height: 1.6;
}

.extended-desc {
  margin-top: 8px !important;
  font-size: 0.85rem !important;
  color: var(--vp-c-text-3) !important;
}

.cell-animation {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-svg {
  width: 80px;
  height: 80px;
}

/* Parallel dots pulse */
.pulse-dot {
  animation: bento-dot-pulse 2s ease-in-out infinite;
}

/* Persona badges */
.badge-stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

.role-badge {
  padding: 4px 14px;
  border-radius: 20px;
  background: linear-gradient(135deg, var(--vp-c-brand-soft), rgba(139, 92, 246, 0.15));
  color: var(--sniper-brand);
  font-size: 0.8rem;
  font-weight: 600;
  animation: badge-cycle 3.6s ease-in-out infinite;
}

/* Checkmark draw */
.checkmark-path {
  stroke-dasharray: 40;
  stroke-dashoffset: 40;
}
.bento-cell:hover .checkmark-path {
  animation: checkmark-draw 0.6s ease forwards;
}

/* Card stack */
.card-stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}
.stack-card {
  width: 60px;
  padding: 8px;
  border-radius: 6px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  animation: card-stack-rise 3s ease-in-out infinite;
}
.stack-card-line {
  height: 3px;
  background: var(--vp-c-divider);
  border-radius: 2px;
  margin-bottom: 4px;
}
.stack-card-line.short {
  width: 60%;
  margin-bottom: 0;
}

/* Command snippet */
.cmd-snippet {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--sniper-radius-sm);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  font-family: var(--sniper-font-mono);
  font-size: 0.85rem;
}
.cmd-prompt {
  color: var(--sniper-brand);
  font-weight: 700;
}
.cmd-text {
  background: linear-gradient(90deg, var(--sniper-brand), var(--sniper-brand-light), var(--sniper-brand));
  background-size: 200% 100%;
  animation: shimmer 3s linear infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Expand transition */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 200px;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0 !important;
}

@media (max-width: 1024px) {
  .bento-grid {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "parallel persona"
      "parallel gates"
      "packs cmd";
  }
}

@media (max-width: 640px) {
  .bento-grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      "parallel"
      "persona"
      "gates"
      "packs"
      "cmd";
  }
}
</style>
