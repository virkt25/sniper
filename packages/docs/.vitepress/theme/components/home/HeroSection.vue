<script setup lang="ts">
import { ref, onMounted } from 'vue'

const tagline = 'Write specs, not code. SNIPER orchestrates Claude Code agent teams through structured phases.'
const displayed = ref('')
const showCursor = ref(true)
const reducedMotion = ref(false)

onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reducedMotion.value) {
    displayed.value = tagline
    return
  }

  let i = 0
  const type = () => {
    if (i < tagline.length) {
      displayed.value = tagline.slice(0, i + 1)
      i++
      setTimeout(type, 25 + Math.random() * 15)
    } else {
      setTimeout(() => { showCursor.value = false }, 2000)
    }
  }
  setTimeout(type, 600)
})
</script>

<template>
  <section class="hero-section">
    <div class="hero-mesh" />
    <div class="hero-content">
      <div class="hero-logo">
        <svg viewBox="0 0 120 120" class="crosshair-svg" aria-hidden="true">
          <circle cx="60" cy="60" r="50" class="ring ring-outer" />
          <circle cx="60" cy="60" r="35" class="ring ring-mid" />
          <circle cx="60" cy="60" r="20" class="ring ring-inner" />
          <line x1="60" y1="5" x2="60" y2="30" class="crosshair-line" />
          <line x1="60" y1="90" x2="60" y2="115" class="crosshair-line" />
          <line x1="5" y1="60" x2="30" y2="60" class="crosshair-line" />
          <line x1="90" y1="60" x2="115" y2="60" class="crosshair-line" />
          <circle cx="60" cy="60" r="4" class="center-dot" />
        </svg>
      </div>
      <h1 class="hero-title">SNIPER</h1>
      <p class="hero-tagline">
        {{ displayed }}<span v-if="showCursor" class="cursor">|</span>
      </p>
      <div class="hero-actions">
        <a href="/guide/getting-started" class="btn-primary">Get Started</a>
        <a href="/guide/full-lifecycle" class="btn-secondary">How It Works</a>
      </div>
    </div>
    <div class="scroll-hint" aria-hidden="true">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  </section>
</template>

<style scoped>
.hero-section {
  position: relative;
  min-height: var(--hero-height, 100svh);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 0 24px;
}

.hero-mesh {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(ellipse 60% 50% at var(--mesh-x) var(--mesh-y), rgba(99, 102, 241, 0.12), transparent),
    radial-gradient(ellipse 50% 60% at var(--mesh-x2) var(--mesh-y2), rgba(139, 92, 246, 0.1), transparent),
    radial-gradient(ellipse 40% 40% at 50% 50%, rgba(249, 115, 22, 0.06), transparent);
  animation: mesh-drift 18s ease-in-out infinite;
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 720px;
}

.hero-logo {
  margin-bottom: 24px;
}

.crosshair-svg {
  width: 80px;
  height: 80px;
}

.ring {
  fill: none;
  stroke: var(--sniper-brand);
  stroke-width: 1.5;
  stroke-dasharray: 320;
  stroke-dashoffset: 320;
  animation: ring-reveal 1.2s ease-out forwards;
}
.ring-mid {
  animation-delay: 0.15s;
  stroke-dasharray: 220;
  stroke-dashoffset: 220;
}
.ring-inner {
  animation-delay: 0.3s;
  stroke-dasharray: 126;
  stroke-dashoffset: 126;
}

@keyframes ring-reveal {
  to { stroke-dashoffset: 0; }
}

.crosshair-line {
  stroke: var(--sniper-brand-light);
  stroke-width: 1.5;
  stroke-dasharray: 30;
  stroke-dashoffset: 30;
  animation: ring-reveal 0.6s ease-out 0.5s forwards;
}

.center-dot {
  fill: var(--sniper-brand);
  opacity: 0;
  animation: dot-appear 0.3s ease-out 0.8s forwards;
}

@keyframes dot-appear {
  to { opacity: 1; }
}

.hero-title {
  font-size: clamp(3rem, 8vw, 5.5rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1;
  margin: 0 0 16px;
  background: linear-gradient(135deg, #818cf8, var(--sniper-brand), #a78bfa, #c084fc);
  background-size: 300% 300%;
  animation: gradient-shift 6s ease infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-tagline {
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  color: var(--vp-c-text-2);
  line-height: 1.6;
  margin: 0 0 32px;
  min-height: 3.2em;
}

.cursor {
  animation: typewriter-cursor 0.8s step-end infinite;
  color: var(--sniper-brand);
  font-weight: 300;
}

.hero-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 12px 28px;
  border-radius: var(--sniper-radius-md);
  font-weight: 600;
  font-size: 0.95rem;
  color: #fff;
  background: linear-gradient(135deg, var(--sniper-brand), var(--sniper-brand-dark));
  text-decoration: none;
  transition: transform var(--sniper-duration) var(--sniper-ease),
              box-shadow var(--sniper-duration) var(--sniper-ease);
  animation: glow-pulse 4s ease-in-out infinite;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px var(--sniper-glow-strong);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 12px 28px;
  border-radius: var(--sniper-radius-md);
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
  background: transparent;
  text-decoration: none;
  transition: border-color var(--sniper-duration) var(--sniper-ease),
              color var(--sniper-duration) var(--sniper-ease);
}
.btn-secondary:hover {
  border-color: var(--sniper-brand);
  color: var(--sniper-brand);
}

.scroll-hint {
  position: absolute;
  bottom: 32px;
  color: var(--vp-c-text-3);
  animation: fade-up 1s ease-out 1.5s both, bounce-down 2s ease-in-out 2.5s infinite;
}

@keyframes bounce-down {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(8px); }
}

@media (max-width: 640px) {
  .hero-section {
    min-height: calc(var(--hero-height, 100svh) - 60px);
    padding-top: 60px;
  }
}
</style>
