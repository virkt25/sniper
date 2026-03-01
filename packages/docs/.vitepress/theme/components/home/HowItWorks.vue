<script setup lang="ts">
import { ref, onMounted } from 'vue'

const steps = [
  {
    number: '1',
    title: 'Initialize',
    cmd: 'sniper init',
    desc: 'Scaffold agents, protocols, and templates. Install language plugins. Ready in 30 seconds.',
  },
  {
    number: '2',
    title: 'Run',
    cmd: '/sniper-flow',
    desc: 'One command auto-detects scope, picks the right protocol, and spawns specialized agent teams.',
  },
  {
    number: '3',
    title: 'Ship',
    cmd: 'PR ready',
    desc: 'Quality gates verify every phase. Tests pass, specs reconcile, PR created automatically.',
  },
]

const visible = ref(false)
const sectionRef = ref<HTMLElement>()

onMounted(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reducedMotion) {
    visible.value = true
    return
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        visible.value = true
        observer.disconnect()
      }
    },
    { threshold: 0.2 }
  )

  if (sectionRef.value) observer.observe(sectionRef.value)
})
</script>

<template>
  <div ref="sectionRef" class="how-it-works" :class="{ visible }">
    <div class="steps">
      <template v-for="(step, i) in steps" :key="step.number">
        <div class="step" :style="{ transitionDelay: `${i * 150}ms` }">
          <div class="step-number">{{ step.number }}</div>
          <h3>{{ step.title }}</h3>
          <code class="step-cmd">{{ step.cmd }}</code>
          <p>{{ step.desc }}</p>
        </div>
        <div v-if="i < steps.length - 1" class="step-arrow" :style="{ transitionDelay: `${i * 150 + 75}ms` }">
          <svg width="32" height="24" viewBox="0 0 32 24" fill="none" aria-hidden="true">
            <path d="M2 12h24M20 6l6 6-6 6" stroke="var(--sniper-brand)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.how-it-works {
  max-width: var(--section-max-width);
  margin: 0 auto;
}

.steps {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 0;
}

.step {
  flex: 1;
  max-width: 300px;
  text-align: center;
  padding: 32px 24px;
  border-radius: var(--sniper-radius-lg);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  transition: transform 0.6s ease, opacity 0.6s ease,
              box-shadow 0.3s ease, border-color 0.3s ease;
  opacity: 0;
  transform: translateY(20px);
}

.how-it-works.visible .step {
  opacity: 1;
  transform: translateY(0);
}

.step:hover {
  transform: translateY(-4px);
  box-shadow: var(--sniper-shadow-lg);
  border-color: var(--sniper-brand);
}

.how-it-works.visible .step:hover {
  transform: translateY(-4px);
}

.step-arrow {
  display: flex;
  align-items: center;
  padding-top: 52px;
  flex-shrink: 0;
  margin: 0 8px;
  opacity: 0;
  transform: translateX(-8px);
  transition: transform 0.6s ease, opacity 0.6s ease;
}

.how-it-works.visible .step-arrow {
  opacity: 1;
  transform: translateX(0);
}

.step-number {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, var(--sniper-brand), var(--sniper-brand-dark));
  color: #fff;
  font-weight: 800;
  font-size: 1.2rem;
  box-shadow: 0 4px 16px var(--sniper-glow);
}

.step h3 {
  margin: 0 0 12px;
  font-size: 1.2rem;
  font-weight: 700;
}

.step-cmd {
  display: inline-block;
  padding: 6px 16px;
  border-radius: var(--sniper-radius-sm);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  font-family: var(--sniper-font-mono);
  font-size: 0.9rem;
  color: var(--sniper-brand);
  margin-bottom: 12px;
}

.step p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .steps {
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  .step {
    max-width: 100%;
    width: 100%;
  }

  .step-arrow {
    padding-top: 0;
    margin: 12px 0;
    transform: rotate(90deg) translateX(-8px);
  }

  .how-it-works.visible .step-arrow {
    transform: rotate(90deg) translateX(0);
  }
}
</style>
