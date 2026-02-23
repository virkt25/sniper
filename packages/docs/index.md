---
layout: home
hero:
  name: SNIPER
  text: Spec Driven Development
  tagline: Write specs, not code. SNIPER orchestrates Claude Code agent teams that turn a project idea into production code through structured phases — with quality gates at every step.
  image:
    src: /logo.png
    alt: SNIPER
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: How It Works
      link: /guide/full-lifecycle
    - theme: alt
      text: View on GitHub
      link: https://github.com/virkt25/sniper

features:
  - title: Spec In, Code Out
    details: Describe your project. SNIPER produces a brief, PRD, architecture, UX spec, security analysis, epics, stories — then implements them all with parallel agent teams.
  - title: 42 Expert Personas
    details: Agents are composed from process, technical, and cognitive persona layers — architect + backend + systems-thinker — creating specialists for every task.
  - title: 17 Pre-Built Teams
    details: From 3-agent discovery squads to 5-agent sprint teams, every phase has a purpose-built team with file ownership and coordination rules.
  - title: Quality Gates
    details: STRICT gates block until you approve. FLEXIBLE gates auto-advance with async review. 15 checklists ensure nothing ships without scrutiny.
  - title: Works on Any Codebase
    details: "Greenfield? Run /sniper-discover. Existing project? Run /sniper-ingest to reverse-engineer architecture and conventions, then iterate from there."
  - title: 18 Slash Commands
    details: Every phase is a single command. /sniper-plan spawns 4 agents that produce your PRD, architecture, UX spec, and security analysis in parallel.
---

<style>
/* ═══════════════════════════════════════════════════
   HOME PAGE — page-specific styles
   (shared keyframes live in style.css)
   ═══════════════════════════════════════════════════ */

.stats-bar {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 48px 24px 56px;
  margin: 0 auto;
  max-width: 960px;
  animation: fade-up 0.6s ease-out both;
}
.stat {
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
.stat:nth-child(2) { animation-delay: 0.8s; }
.stat:nth-child(3) { animation-delay: 1.6s; }
.stat:nth-child(4) { animation-delay: 2.4s; }
.stat:nth-child(5) { animation-delay: 3.2s; }
.stat:hover {
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

/* ═══════════════════════════════════════════════════
   SECTION HEADINGS — gradient text
   ═══════════════════════════════════════════════════ */

.workflow-section h2,
.screenshot-section h2,
.cta-section h2 {
  background: linear-gradient(135deg, var(--vp-c-text-1), var(--vp-c-brand-1));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ═══════════════════════════════════════════════════
   GLOWING DIVIDERS
   ═══════════════════════════════════════════════════ */

.vp-doc hr {
  border: none;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--vp-c-brand-1), transparent);
  opacity: 0.4;
  margin: 2.5rem 0;
}

/* ═══════════════════════════════════════════════════
   WORKFLOW SECTIONS
   ═══════════════════════════════════════════════════ */

.workflow-section {
  max-width: 100%;
  margin: 0 auto;
  overflow: hidden;
}
.workflow-section h2 {
  text-align: center;
  font-size: 1.8em;
  margin-bottom: 8px;
}
.workflow-section .subtitle {
  text-align: center;
  color: var(--vp-c-text-2);
  margin-bottom: 32px;
}

/* ═══════════════════════════════════════════════════
   WORKFLOW GRID & CARDS — glassmorphism + glow border
   ═══════════════════════════════════════════════════ */

.workflow-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 48px;
}
@media (max-width: 768px) {
  .workflow-grid { grid-template-columns: 1fr; }
  .stats-bar { gap: 8px; }
  .stat { min-width: 80px; padding: 20px 12px; }
  .stat-number { font-size: 2.2em; }
}
.workflow-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--sniper-radius-lg);
  padding: 28px;
  background: var(--vp-c-bg-soft);
  backdrop-filter: blur(8px);
  transition: transform var(--sniper-duration) var(--sniper-ease),
              box-shadow var(--sniper-duration) var(--sniper-ease),
              border-color var(--sniper-duration) var(--sniper-ease);
  overflow: hidden;
}
.workflow-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  padding: 1px;
  background: linear-gradient(135deg, transparent 40%, var(--vp-c-brand-1) 50%, transparent 60%);
  background-size: 400% 400%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.4s ease;
}
.workflow-card:hover::before {
  opacity: 1;
  animation: gradient-shift 3s ease infinite;
}
.workflow-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--sniper-shadow-lg);
  border-color: transparent;
}
.workflow-card h3 {
  margin: 0 0 8px;
  font-size: 1.15em;
}
.workflow-card .phase-tag {
  display: inline-block;
  font-size: 0.75em;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;
  background: linear-gradient(135deg, var(--vp-c-brand-soft), rgba(139, 92, 246, 0.15));
  color: var(--vp-c-brand-1);
  margin-bottom: 12px;
  width: fit-content;
  transition: box-shadow 0.3s ease;
}
.workflow-card:hover .phase-tag {
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.3);
}
.workflow-card p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 0.9em;
  line-height: 1.7;
  flex: 1;
}
.workflow-card .language-text,
.workflow-card div[class*="language-"] {
  margin-top: 16px;
}

/* ═══════════════════════════════════════════════════
   SCREENSHOTS — enhanced hover glow
   ═══════════════════════════════════════════════════ */

.screenshot-section {
  max-width: 100%;
  margin: 0 auto 48px;
}
.screenshot-section h2 {
  text-align: center;
  font-size: 1.8em;
  margin-bottom: 8px;
}
.screenshot-section .subtitle {
  text-align: center;
  color: var(--vp-c-text-2);
  margin-bottom: 32px;
}
.screenshot-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
@media (max-width: 768px) {
  .screenshot-grid { grid-template-columns: 1fr; }
}
.screenshot-grid figure {
  margin: 0;
}
.screenshot-grid img {
  width: 100%;
  border-radius: var(--sniper-radius-md);
  border: 1px solid var(--vp-c-divider);
  transition: transform var(--sniper-duration) var(--sniper-ease),
              box-shadow var(--sniper-duration) var(--sniper-ease),
              border-color var(--sniper-duration) var(--sniper-ease);
}
.screenshot-grid img:hover {
  transform: scale(1.02);
  box-shadow: 0 12px 48px var(--sniper-glow-strong);
  border-color: var(--sniper-brand);
}
.screenshot-grid figcaption {
  text-align: center;
  font-size: 0.85em;
  color: var(--vp-c-text-2);
  margin-top: 10px;
  transition: color 0.3s ease;
}
.screenshot-grid figure:hover figcaption {
  color: var(--vp-c-brand-1);
}

/* ═══════════════════════════════════════════════════
   CTA — gradient border + glowing links
   ═══════════════════════════════════════════════════ */

.cta-section {
  text-align: center;
  padding: 48px 0;
  margin: 0 auto;
  max-width: 100%;
  position: relative;
}
.cta-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--vp-c-brand-1), transparent);
}
.cta-section h2 {
  font-size: 1.8em;
  margin-bottom: 16px;
}
.cta-section p {
  color: var(--vp-c-text-2);
  margin-bottom: 24px;
  line-height: 1.6;
}
.cta-section a {
  transition: color 0.2s ease, text-shadow 0.2s ease;
}
.cta-section a:hover {
  text-shadow: 0 0 16px rgba(99, 102, 241, 0.4);
}
</style>

<div class="stats-bar">
  <div class="stat">
    <div class="stat-number">18</div>
    <div class="stat-label">Commands</div>
  </div>
  <div class="stat">
    <div class="stat-number">42</div>
    <div class="stat-label">Personas</div>
  </div>
  <div class="stat">
    <div class="stat-number">17</div>
    <div class="stat-label">Teams</div>
  </div>
  <div class="stat">
    <div class="stat-number">38</div>
    <div class="stat-label">Templates</div>
  </div>
  <div class="stat">
    <div class="stat-number">15</div>
    <div class="stat-label">Checklists</div>
  </div>
</div>

<div class="workflow-section">

## Two Paths, One Framework

<p class="subtitle">Whether you're starting from scratch or working with an existing codebase, SNIPER has a workflow for you.</p>

<div class="workflow-grid">
<div class="workflow-card">

### Greenfield Projects

<span class="phase-tag">Full Lifecycle</span>

Start with an idea. SNIPER's discovery team researches the market, assesses risks, and defines user personas. Then the planning team produces a PRD, architecture, UX spec, and security analysis. The solve phase shards everything into epics and stories. Finally, sprint teams implement story by story — with tests, PRs, and code review at every step.

```
→ /sniper-discover
→ /sniper-plan
→ /sniper-solve
→ /sniper-sprint
```

</div>
<div class="workflow-card">

### Existing Codebases

<span class="phase-tag">Ingest + Iterate</span>

Already have code? SNIPER's ingest team reverse-engineers your architecture, extracts coding conventions, and produces a project brief from your source. From there, use `/sniper-feature` for scoped additions, `/sniper-debug` for structured bug investigation, or `/sniper-audit` for security, performance, and test coverage analysis.

```
→ /sniper-ingest
→ /sniper-feature
→ /sniper-debug
→ /sniper-audit
```

</div>
</div>
</div>

<div class="screenshot-section">

## SNIPER In Action

<p class="subtitle">Real terminal output from SNIPER orchestrating Claude Code agent teams.</p>

<div class="screenshot-grid">
<figure>
  <img src="/screenshot-plan.png" alt="SNIPER plan phase showing 4 agents coordinating on PRD, architecture, UX, and security" />
  <figcaption>Plan phase: 4 agents coordinating on PRD, architecture, UX, and security</figcaption>
</figure>
<figure>
  <img src="/screenshot-stories.png" alt="SNIPER solve phase showing story selection with dependencies" />
  <figcaption>Solve phase: stories sharded with dependencies, sizes, and ownership</figcaption>
</figure>
<figure>
  <img src="/screenshot-sprint.png" alt="SNIPER sprint with frontend-dev and qa-engineer working in parallel" />
  <figcaption>Sprint: parallel agents with task dependencies and coordination</figcaption>
</figure>
<figure>
  <img src="/screenshot-sprint-complete.png" alt="Sprint complete with PR created and test results" />
  <figcaption>Sprint complete: stories implemented, tests passing, PR created</figcaption>
</figure>
</div>
</div>

<div class="workflow-section">

## The Spec Driven Workflow

<p class="subtitle">Every artifact is a spec. Every spec drives the next phase. Nothing is implemented without a spec.</p>

<div class="workflow-grid">
<div class="workflow-card">

### 1. Discover

<span class="phase-tag">3 agents</span>

An analyst, risk researcher, and user researcher work in parallel. They produce a project brief with competitive analysis, a risk assessment with mitigations, and user personas with journey maps.

</div>
<div class="workflow-card">

### 2. Plan

<span class="phase-tag">4 agents · Opus</span>

A product manager writes the PRD. Once complete, an architect, UX designer, and security analyst work in parallel — each reading the PRD and producing their own spec. STRICT gate: you approve before moving on.

</div>
<div class="workflow-card">

### 3. Solve

<span class="phase-tag">1 agent</span>

A scrum master reads the PRD, architecture, and UX spec, then shards everything into epics and self-contained stories. Each story embeds the relevant context from upstream specs so developers never need to cross-reference.

</div>
<div class="workflow-card">

### 4. Sprint

<span class="phase-tag">2-5 agents</span>

Select stories for the sprint. SNIPER spawns the right developers (backend, frontend, infra, AI) plus a QA engineer. Each agent owns specific directories. They coordinate on API contracts and implement story by story with tests.

</div>
</div>
</div>

<div class="cta-section">

## Start Building With Specs

Get SNIPER running in under a minute.

```bash
npm install -g @sniper.ai/cli
sniper init
```

Then run `/sniper-discover` in Claude Code to kick off your first lifecycle.

[Get Started](/guide/getting-started) | [Commands Cheatsheet](/guide/cheatsheet-commands) | [GitHub](https://github.com/virkt25/sniper)

</div>
