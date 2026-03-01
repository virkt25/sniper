<script setup lang="ts">
import { ref, onMounted } from 'vue'

const stats = [
  { value: 11, label: 'Agents' },
  { value: 7, label: 'Protocols' },
  { value: 14, label: 'Templates' },
  { value: 13, label: 'Schemas' },
  { value: 3, label: 'Plugins' },
]

const displayed = ref<number[]>(stats.map(() => 0))
const hasAnimated = ref(false)
const sectionRef = ref<HTMLElement>()

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function animateCounters() {
  if (hasAnimated.value) return
  hasAnimated.value = true

  const duration = 1200
  const start = performance.now()

  function tick(now: number) {
    const elapsed = now - start
    const progress = Math.min(elapsed / duration, 1)
    const eased = easeOutCubic(progress)

    displayed.value = stats.map(s => Math.round(s.value * eased))

    if (progress < 1) {
      requestAnimationFrame(tick)
    }
  }

  requestAnimationFrame(tick)
}

onMounted(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reducedMotion) {
    displayed.value = stats.map(s => s.value)
    hasAnimated.value = true
    return
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        animateCounters()
        observer.disconnect()
      }
    },
    { threshold: 0.3 }
  )

  if (sectionRef.value) observer.observe(sectionRef.value)
})
</script>

<template>
  <div ref="sectionRef" class="stats-section">
    <div class="stats-grid">
      <div v-for="(stat, i) in stats" :key="stat.label" class="stat-card">
        <div class="stat-number">{{ displayed[i] }}</div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>
    <div class="github-badge">
      <a href="https://github.com/virkt25/sniper" target="_blank" rel="noopener" class="github-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
        </svg>
        Star on GitHub
      </a>
    </div>
  </div>
</template>

<style scoped>
.stats-section {
  max-width: var(--section-max-width);
  margin: 0 auto;
}

.stats-grid {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.stat-card {
  text-align: center;
  flex: 1;
  min-width: 120px;
  padding: 28px 16px;
  border-radius: var(--sniper-radius-lg);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  transition: transform var(--sniper-duration) var(--sniper-ease),
              box-shadow var(--sniper-duration) var(--sniper-ease),
              border-color var(--sniper-duration) var(--sniper-ease);
  animation: glow-pulse 4s ease-in-out infinite;
}

.stat-card:nth-child(2) { animation-delay: 0.8s; }
.stat-card:nth-child(3) { animation-delay: 1.6s; }
.stat-card:nth-child(4) { animation-delay: 2.4s; }
.stat-card:nth-child(5) { animation-delay: 3.2s; }

.stat-card:hover {
  transform: translateY(-6px) scale(1.03);
  box-shadow: 0 12px 40px var(--sniper-glow-strong);
  border-color: var(--sniper-brand);
}

.stat-number {
  font-size: 3em;
  font-weight: 800;
  background: linear-gradient(135deg, #818cf8, var(--vp-c-brand-1), #a78bfa, #c084fc);
  background-size: 300% 300%;
  animation: gradient-shift 6s ease infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.stat-label {
  font-size: 0.85em;
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin-top: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.github-badge {
  text-align: center;
  margin-top: 32px;
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--sniper-radius-md);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  transition: border-color var(--sniper-duration) var(--sniper-ease),
              box-shadow var(--sniper-duration) var(--sniper-ease);
}
.github-link:hover {
  border-color: var(--sniper-brand);
  box-shadow: 0 0 20px var(--sniper-glow);
}

@media (max-width: 768px) {
  .stats-grid { gap: 8px; }
  .stat-card { min-width: 80px; padding: 20px 12px; }
  .stat-number { font-size: 2.2em; }
}
</style>
