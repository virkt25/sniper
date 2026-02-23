<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import HeroSection from './HeroSection.vue'
import StatsSection from './StatsSection.vue'

const LifecycleWheel = defineAsyncComponent(() => import('./LifecycleWheel.vue'))
const BentoGrid = defineAsyncComponent(() => import('./BentoGrid.vue'))
const TerminalDemo = defineAsyncComponent(() => import('./TerminalDemo.vue'))
</script>

<template>
  <div class="home-page">
    <HeroSection />

    <section class="home-section">
      <h2 class="section-heading">The SNIPER Lifecycle</h2>
      <p class="section-subtitle">Six phases. Parallel agents. Quality gates at every step.</p>
      <LifecycleWheel />
    </section>

    <section class="home-section">
      <h2 class="section-heading">Framework at a Glance</h2>
      <p class="section-subtitle">Everything you need to orchestrate AI agent teams.</p>
      <StatsSection />
    </section>

    <section class="home-section">
      <h2 class="section-heading">Built for the AI-First Workflow</h2>
      <p class="section-subtitle">Specs in, code out. Every feature designed for autonomous agent collaboration.</p>
      <BentoGrid />
    </section>

    <section class="home-section">
      <h2 class="section-heading">Two Paths, One Framework</h2>
      <p class="section-subtitle">Whether you're starting from scratch or working with an existing codebase, SNIPER has a workflow for you.</p>
      <div class="two-paths">
        <div class="path-card">
          <span class="path-tag">Full Lifecycle</span>
          <h3>Greenfield Projects</h3>
          <p>Start with an idea. Discovery agents research the market and assess risks. Planning agents produce a PRD, architecture, UX spec, and security analysis. The solve phase shards everything into stories. Sprint teams implement with tests and PRs.</p>
          <code class="path-cmds">/sniper-discover &rarr; /sniper-plan &rarr; /sniper-solve &rarr; /sniper-sprint</code>
        </div>
        <div class="path-card">
          <span class="path-tag">Ingest + Iterate</span>
          <h3>Existing Codebases</h3>
          <p>Already have code? SNIPER's ingest team reverse-engineers your architecture and extracts conventions. Then use scoped commands for additions, bug investigation, or security and performance audits.</p>
          <code class="path-cmds">/sniper-ingest &rarr; /sniper-feature &rarr; /sniper-debug &rarr; /sniper-audit</code>
        </div>
      </div>
    </section>

    <section class="home-section">
      <h2 class="section-heading">See It In Action</h2>
      <p class="section-subtitle">Watch SNIPER orchestrate agent teams through each phase.</p>
      <TerminalDemo />
    </section>

    <section class="home-section cta-section">
      <div class="cta-divider" />
      <h2 class="section-heading">Start Building With Specs</h2>
      <p class="cta-desc">Get SNIPER running in under a minute.</p>
      <div class="cta-install">
        <code>npm install -g @sniper.ai/cli && sniper init</code>
      </div>
      <p class="cta-desc">Then run <code>/sniper-discover</code> in Claude Code to kick off your first lifecycle.</p>
      <div class="cta-links">
        <a href="/guide/getting-started" class="cta-link primary">Get Started</a>
        <a href="/guide/cheatsheet-commands" class="cta-link">Commands Cheatsheet</a>
        <a href="https://github.com/virkt25/sniper" target="_blank" rel="noopener" class="cta-link">GitHub</a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  width: 100%;
}

.home-section {
  padding: var(--section-padding);
}

.section-heading {
  text-align: center;
  font-size: clamp(1.5rem, 4vw, 2.2rem);
  font-weight: 800;
  margin: 0 0 8px;
  background: linear-gradient(135deg, var(--vp-c-text-1), var(--vp-c-brand-1));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-subtitle {
  text-align: center;
  color: var(--vp-c-text-2);
  margin: 0 0 40px;
  font-size: 1.05rem;
  line-height: 1.6;
}

/* Two Paths */
.two-paths {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  max-width: var(--section-max-width);
  margin: 0 auto;
}

.path-card {
  padding: 28px;
  border-radius: var(--sniper-radius-lg);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  transition: transform var(--sniper-duration) var(--sniper-ease),
              box-shadow var(--sniper-duration) var(--sniper-ease),
              border-color var(--sniper-duration) var(--sniper-ease);
}
.path-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--sniper-shadow-lg);
  border-color: var(--sniper-brand);
}

.path-tag {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;
  background: linear-gradient(135deg, var(--vp-c-brand-soft), rgba(139, 92, 246, 0.15));
  color: var(--sniper-brand);
  margin-bottom: 12px;
}

.path-card h3 {
  margin: 0 0 8px;
  font-size: 1.15rem;
  font-weight: 700;
}

.path-card p {
  margin: 0 0 16px;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  line-height: 1.7;
}

.path-cmds {
  display: block;
  padding: 8px 14px;
  border-radius: var(--sniper-radius-sm);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  font-family: var(--sniper-font-mono);
  font-size: 0.85rem;
  color: var(--sniper-brand);
}

@media (max-width: 768px) {
  .two-paths {
    grid-template-columns: 1fr;
  }
}

/* CTA section */
.cta-section {
  text-align: center;
  max-width: var(--section-max-width);
  margin: 0 auto;
  padding-bottom: 80px;
}

.cta-divider {
  width: 200px;
  height: 1px;
  margin: 0 auto 48px;
  background: linear-gradient(90deg, transparent, var(--vp-c-brand-1), transparent);
}

.cta-desc {
  color: var(--vp-c-text-2);
  margin: 0 0 20px;
  line-height: 1.6;
}
.cta-desc code {
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  font-family: var(--sniper-font-mono);
  font-size: 0.9em;
  color: var(--sniper-brand);
}

.cta-install {
  margin-bottom: 24px;
}
.cta-install code {
  display: inline-block;
  padding: 12px 24px;
  border-radius: var(--sniper-radius-md);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  font-family: var(--sniper-font-mono);
  font-size: 0.9rem;
  color: var(--vp-c-text-1);
}

.cta-links {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 24px;
}

.cta-link {
  padding: 10px 24px;
  border-radius: var(--sniper-radius-md);
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  transition: border-color var(--sniper-duration) var(--sniper-ease),
              color var(--sniper-duration) var(--sniper-ease),
              box-shadow var(--sniper-duration) var(--sniper-ease);
}
.cta-link:hover {
  border-color: var(--sniper-brand);
  color: var(--sniper-brand);
  box-shadow: 0 0 20px var(--sniper-glow);
}
.cta-link.primary {
  background: linear-gradient(135deg, var(--sniper-brand), var(--sniper-brand-dark));
  color: #fff;
  border-color: transparent;
}
.cta-link.primary:hover {
  box-shadow: 0 8px 32px var(--sniper-glow-strong);
  color: #fff;
}
</style>
