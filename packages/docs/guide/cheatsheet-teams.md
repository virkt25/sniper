---
title: Teams Cheatsheet
description: Quick reference for all pre-configured agent team compositions
---

# Teams Cheatsheet

Quick reference for every SNIPER team composition. Each card shows persona layers assigned to each member.

## Summary

| Team | Members | Gate | Phase |
|------|---------|------|-------|
| [`discover`](#discover) | 3 | <span class="gate-flexible">FLEXIBLE</span> | Discover |
| [`plan`](#plan) | 4 | <span class="gate-strict">STRICT</span> | Plan |
| [`sprint`](#sprint) | 2--5 | <span class="gate-strict">STRICT</span> | Sprint |
| [`ingest`](#ingest) | 3 | <span class="gate-flexible">FLEXIBLE</span> | Ingest |
| [`feature-plan`](#feature-plan) | 2 | <span class="gate-flexible">FLEXIBLE</span> | Feature |
| [`debug`](#debug) | 2 | <span class="gate-flexible">FLEXIBLE</span> | Debug |
| [`review-pr`](#review-pr) | 3 | <span class="gate-auto">AUTO</span> | PR Review |
| [`review-release`](#review-release) | 3 | <span class="gate-auto">AUTO</span> | Release Review |
| [`doc`](#doc) | 3 | <span class="gate-flexible">FLEXIBLE</span> | Documentation |
| [`test`](#test) | 2 | <span class="gate-flexible">FLEXIBLE</span> | Test Audit |
| [`security`](#security) | 2 | <span class="gate-flexible">FLEXIBLE</span> | Security Audit |
| [`retro`](#retro) | 1 | <span class="gate-none">NONE</span> | Retrospective |
| [`workspace-feature`](#workspace-feature) | 2 | <span class="gate-strict">STRICT</span> | Workspace |
| [`workspace-validation`](#workspace-validation) | 1 | <span class="gate-none">NONE</span> | Workspace |

---

## Lifecycle Teams

### discover {#discover}

3 members · <span class="gate-flexible">FLEXIBLE</span> gate · parallel (no dependencies) · [discover-review](/reference/checklists/discover-review) checklist

<table class="inverted">
<tr><th>Command</th><td><a href="/guide/cheatsheet-commands#discover"><code>/sniper-discover</code></a></td></tr>
<tr><th>Outputs</th><td><code>docs/brief.md</code> · <code>docs/risks.md</code> · <code>docs/personas.md</code></td></tr>
<tr><th>Members</th><td>

| Name | Process | Technical | Cognitive |
|------|---------|-----------|-----------|
| analyst | [analyst](/reference/personas/process/analyst) | -- | [systems-thinker](/reference/personas/cognitive/systems-thinker) |
| risk-researcher | [analyst](/reference/personas/process/analyst) | [infrastructure](/reference/personas/technical/infrastructure) | [devils-advocate](/reference/personas/cognitive/devils-advocate) |
| user-researcher | [analyst](/reference/personas/process/analyst) | -- | [user-empathetic](/reference/personas/cognitive/user-empathetic) |

</td></tr>
<tr><th>Reference</th><td><a href="/reference/teams/discover">Full team reference</a></td></tr>
</table>

---

### plan {#plan}

4 members · <span class="gate-strict">STRICT</span> gate · Opus model · [plan-review](/reference/checklists/plan-review) checklist

<table class="inverted">
<tr><th>Command</th><td><a href="/guide/cheatsheet-commands#plan"><code>/sniper-plan</code></a></td></tr>
<tr><th>Outputs</th><td><code>docs/prd.md</code> · <code>docs/architecture.md</code> · <code>docs/ux-spec.md</code> · <code>docs/security.md</code></td></tr>
<tr><th>Dependencies</th><td>architect, ux-designer, security-analyst all blocked by product-manager (PRD first)</td></tr>
<tr><th>Plan approval</th><td>architect must present approach before writing</td></tr>
<tr><th>Members</th><td>

| Name | Process | Technical | Cognitive |
|------|---------|-----------|-----------|
| product-manager | [product-manager](/reference/personas/process/product-manager) | [api-design](/reference/personas/technical/api-design) | [systems-thinker](/reference/personas/cognitive/systems-thinker) |
| architect | [architect](/reference/personas/process/architect) | [backend](/reference/personas/technical/backend) | [security-first](/reference/personas/cognitive/security-first) |
| ux-designer | [ux-designer](/reference/personas/process/ux-designer) | [frontend](/reference/personas/technical/frontend) | [user-empathetic](/reference/personas/cognitive/user-empathetic) |
| security-analyst | [architect](/reference/personas/process/architect) | [security](/reference/personas/technical/security) | [security-first](/reference/personas/cognitive/security-first) |

</td></tr>
<tr><th>Coordination</th><td>architect <-> security-analyst · architect <-> ux-designer</td></tr>
<tr><th>Reference</th><td><a href="/reference/teams/plan">Full team reference</a></td></tr>
</table>

---

### sprint {#sprint}

2--5 members from pool · <span class="gate-strict">STRICT</span> gate · spawned on demand by story ownership

<table class="inverted">
<tr><th>Command</th><td><a href="/guide/cheatsheet-commands#sprint"><code>/sniper-sprint</code></a></td></tr>
<tr><th>Outputs</th><td>Source code · test files</td></tr>
<tr><th>Coordination</th><td>backend <-> frontend · backend <-> ai · backend <-> qa</td></tr>
<tr><th>Note</th><td>qa-engineer is always included. Others are spawned based on story ownership.</td></tr>
<tr><th>Member pool</th><td>

| Name | Process | Technical | Cognitive | Model | Owns |
|------|---------|-----------|-----------|-------|------|
| backend-dev | [developer](/reference/personas/process/developer) | [backend](/reference/personas/technical/backend) | [systems-thinker](/reference/personas/cognitive/systems-thinker) | Sonnet | backend |
| frontend-dev | [developer](/reference/personas/process/developer) | [frontend](/reference/personas/technical/frontend) | [user-empathetic](/reference/personas/cognitive/user-empathetic) | Sonnet | frontend |
| infra-dev | [developer](/reference/personas/process/developer) | [infrastructure](/reference/personas/technical/infrastructure) | [systems-thinker](/reference/personas/cognitive/systems-thinker) | Sonnet | infrastructure |
| ai-dev | [developer](/reference/personas/process/developer) | [ai-ml](/reference/personas/technical/ai-ml) | [performance-focused](/reference/personas/cognitive/performance-focused) | Opus | ai |
| qa-engineer | [qa-engineer](/reference/personas/process/qa-engineer) | [backend](/reference/personas/technical/backend) | [devils-advocate](/reference/personas/cognitive/devils-advocate) | Sonnet | tests |

</td></tr>
<tr><th>Reference</th><td><a href="/reference/teams/sprint">Full team reference</a></td></tr>
</table>

---

### ingest {#ingest}

3 members · <span class="gate-flexible">FLEXIBLE</span> gate · parallel (no dependencies) · [ingest-review](/reference/checklists/ingest-review) checklist

<table class="inverted">
<tr><th>Command</th><td><a href="/guide/cheatsheet-commands#ingest"><code>/sniper-ingest</code></a></td></tr>
<tr><th>Outputs</th><td><code>docs/brief.md</code> · <code>docs/architecture.md</code> · <code>docs/conventions.md</code></td></tr>
<tr><th>Members</th><td>

| Name | Process | Technical | Cognitive |
|------|---------|-----------|-----------|
| code-archaeologist | [code-archaeologist](/reference/personas/process/code-archaeologist) | -- | [systems-thinker](/reference/personas/cognitive/systems-thinker) |
| architecture-cartographer | [architecture-cartographer](/reference/personas/process/architecture-cartographer) | [backend](/reference/personas/technical/backend) | [systems-thinker](/reference/personas/cognitive/systems-thinker) |
| convention-miner | [convention-miner](/reference/personas/process/convention-miner) | -- | [systems-thinker](/reference/personas/cognitive/systems-thinker) |

</td></tr>
<tr><th>Reference</th><td><a href="/reference/teams/ingest">Full team reference</a></td></tr>
</table>

---

## Extended Teams

### feature-plan {#feature-plan}

2 members · <span class="gate-flexible">FLEXIBLE</span> gate · Opus model · [feature-review](/reference/checklists/feature-review) checklist

<table class="inverted">
<tr><th>Command</th><td><a href="/guide/cheatsheet-commands#feature"><code>/sniper-feature</code></a></td></tr>
<tr><th>Outputs</th><td><code>docs/features/SNPR-{XXXX}/spec.md</code> · <code>arch-delta.md</code></td></tr>
<tr><th>Dependencies</th><td>feature-architect blocked by feature-pm</td></tr>
<tr><th>Plan approval</th><td>feature-architect must present approach before writing</td></tr>
<tr><th>Members</th><td>

| Name | Process | Technical | Cognitive |
|------|---------|-----------|-----------|
| feature-pm | [product-manager](/reference/personas/process/product-manager) | -- | [systems-thinker](/reference/personas/cognitive/systems-thinker) |
| feature-architect | [architect](/reference/personas/process/architect) | [backend](/reference/personas/technical/backend) | [systems-thinker](/reference/personas/cognitive/systems-thinker) |

</td></tr>
<tr><th>Reference</th><td><a href="/reference/teams/feature-plan">Full team reference</a></td></tr>
</table>

---

### debug {#debug}

2 members · <span class="gate-flexible">FLEXIBLE</span> gate · parallel · [debug-review](/reference/checklists/debug-review) checklist

<table class="inverted">
<tr><th>Command</th><td><a href="/guide/cheatsheet-commands#debug"><code>/sniper-debug</code></a></td></tr>
<tr><th>Outputs</th><td><code>docs/bugs/BUG-{NNN}/investigation.md</code></td></tr>
<tr><th>Members</th><td>

| Name | Process | Technical | Cognitive |
|------|---------|-----------|-----------|
| log-analyst | [log-analyst](/reference/personas/process/log-analyst) | -- | [devils-advocate](/reference/personas/cognitive/devils-advocate) |
| code-investigator | [code-investigator](/reference/personas/process/code-investigator) | [backend](/reference/personas/technical/backend) | [systems-thinker](/reference/personas/cognitive/systems-thinker) |

</td></tr>
<tr><th>Reference</th><td><a href="/reference/teams/debug">Full team reference</a></td></tr>
</table>

---

### review-pr {#review-pr}

3 members · <span class="gate-auto">AUTO</span> gate · parallel

<table class="inverted">
<tr><th>Command</th><td><a href="/guide/cheatsheet-commands#audit-review-pr"><code>/sniper-audit --target review --pr N</code></a></td></tr>
<tr><th>Outputs</th><td><code>docs/reviews/PR-{NNN}-review.md</code></td></tr>
<tr><th>Members</th><td>

| Name | Process | Technical | Cognitive |
|------|---------|-----------|-----------|
| code-reviewer | [code-reviewer](/reference/personas/process/code-reviewer) | -- | [devils-advocate](/reference/personas/cognitive/devils-advocate) |
| security-reviewer | [code-reviewer](/reference/personas/process/code-reviewer) | -- | [security-first](/reference/personas/cognitive/security-first) |
| test-reviewer | [qa-engineer](/reference/personas/process/qa-engineer) | -- | [systems-thinker](/reference/personas/cognitive/systems-thinker) |

</td></tr>
<tr><th>Reference</th><td><a href="/reference/teams/review-pr">Full team reference</a></td></tr>
</table>

---

### review-release {#review-release}

3 members · <span class="gate-auto">AUTO</span> gate · parallel

<table class="inverted">
<tr><th>Command</th><td><a href="/guide/cheatsheet-commands#audit-review-release"><code>/sniper-audit --target review --release TAG</code></a></td></tr>
<tr><th>Outputs</th><td><code>docs/releases/{version}-readiness.md</code></td></tr>
<tr><th>Members</th><td>

| Name | Process | Technical | Cognitive |
|------|---------|-----------|-----------|
| release-manager | [release-manager](/reference/personas/process/release-manager) | -- | [systems-thinker](/reference/personas/cognitive/systems-thinker) |
| breaking-change-analyst | [code-reviewer](/reference/personas/process/code-reviewer) | -- | [devils-advocate](/reference/personas/cognitive/devils-advocate) |
| doc-reviewer | [doc-writer](/reference/personas/process/doc-writer) | -- | [user-empathetic](/reference/personas/cognitive/user-empathetic) |

</td></tr>
<tr><th>Reference</th><td><a href="/reference/teams/review-release">Full team reference</a></td></tr>
</table>

---

### doc {#doc}

3 members · <span class="gate-flexible">FLEXIBLE</span> gate · sequential pipeline · [doc-review](/reference/checklists/doc-review) checklist

<table class="inverted">
<tr><th>Command</th><td><a href="/guide/cheatsheet-commands#doc"><code>/sniper-doc</code></a></td></tr>
<tr><th>Outputs</th><td><code>README.md</code> · <code>docs/*.md</code> · <code>docs/.sniper-doc-review.md</code></td></tr>
<tr><th>Dependencies</th><td>doc-writer blocked by doc-analyst · doc-reviewer blocked by doc-writer</td></tr>
<tr><th>Members</th><td>

| Name | Process | Technical | Cognitive |
|------|---------|-----------|-----------|
| doc-analyst | [doc-analyst](/reference/personas/process/doc-analyst) | -- | [user-empathetic](/reference/personas/cognitive/user-empathetic) |
| doc-writer | [doc-writer](/reference/personas/process/doc-writer) | from-config | [mentor-explainer](/reference/personas/cognitive/mentor-explainer) |
| doc-reviewer | [doc-reviewer](/reference/personas/process/doc-reviewer) | -- | [devils-advocate](/reference/personas/cognitive/devils-advocate) |

</td></tr>
<tr><th>Reference</th><td><a href="/reference/teams/doc">Full team reference</a></td></tr>
</table>

---

### test {#test}

2 members · <span class="gate-flexible">FLEXIBLE</span> gate · parallel · [test-review](/reference/checklists/test-review) checklist

<table class="inverted">
<tr><th>Command</th><td><a href="/guide/cheatsheet-commands#audit-tests"><code>/sniper-audit --target tests</code></a></td></tr>
<tr><th>Outputs</th><td><code>docs/audits/TST-{NNN}/coverage-report.md</code> · <code>flaky-report.md</code></td></tr>
<tr><th>Members</th><td>

| Name | Process | Technical | Cognitive |
|------|---------|-----------|-----------|
| coverage-analyst | [coverage-analyst](/reference/personas/process/coverage-analyst) | -- | [systems-thinker](/reference/personas/cognitive/systems-thinker) |
| flake-hunter | [flake-hunter](/reference/personas/process/flake-hunter) | -- | [devils-advocate](/reference/personas/cognitive/devils-advocate) |

</td></tr>
<tr><th>Reference</th><td><a href="/reference/teams/test">Full team reference</a></td></tr>
</table>

---

### security {#security}

2 members · <span class="gate-flexible">FLEXIBLE</span> gate · parallel · [security-review](/reference/checklists/security-review) checklist

<table class="inverted">
<tr><th>Command</th><td><a href="/guide/cheatsheet-commands#audit-security"><code>/sniper-audit --target security</code></a></td></tr>
<tr><th>Outputs</th><td><code>docs/audits/SEC-{NNN}/threat-model.md</code> · <code>vulnerability-report.md</code></td></tr>
<tr><th>Members</th><td>

| Name | Process | Technical | Cognitive |
|------|---------|-----------|-----------|
| threat-modeler | [threat-modeler](/reference/personas/process/threat-modeler) | [security](/reference/personas/technical/security) | [systems-thinker](/reference/personas/cognitive/systems-thinker) |
| vuln-scanner | [vuln-scanner](/reference/personas/process/vuln-scanner) | [security](/reference/personas/technical/security) | [devils-advocate](/reference/personas/cognitive/devils-advocate) |

</td></tr>
<tr><th>Reference</th><td><a href="/reference/teams/security">Full team reference</a></td></tr>
</table>

---

### retro {#retro}

1 member · <span class="gate-none">NONE</span> gate

<table class="inverted">
<tr><th>Outputs</th><td><code>.sniper/memory/retros/sprint-{N}-retro.yaml</code></td></tr>
<tr><th>Member</th><td>

| Name | Process | Technical | Cognitive |
|------|---------|-----------|-----------|
| retro-analyst | [retro-analyst](/reference/personas/process/retro-analyst) | -- | [systems-thinker](/reference/personas/cognitive/systems-thinker) |

</td></tr>
<tr><th>Reference</th><td><a href="/reference/teams/retro">Full team reference</a></td></tr>
</table>

---

## Workspace Teams

### workspace-feature {#workspace-feature}

2 members · <span class="gate-strict">STRICT</span> gate · [workspace-review](/reference/checklists/workspace-review) checklist

<table class="inverted">
<tr><th>Command</th><td><a href="/guide/cheatsheet-commands#workspace-feature"><code>/sniper-workspace feature</code></a></td></tr>
<tr><th>Outputs</th><td><code>features/WKSP-{XXXX}/brief.md</code> · <code>plan.md</code> · <code>contracts/*.contract.yaml</code></td></tr>
<tr><th>Coordination</th><td>orchestrator <-> contract-designer</td></tr>
<tr><th>Members</th><td>

| Name | Process | Technical | Cognitive |
|------|---------|-----------|-----------|
| orchestrator | [workspace-orchestrator](/reference/personas/process/workspace-orchestrator) | -- | [systems-thinker](/reference/personas/cognitive/systems-thinker) |
| contract-designer | [contract-designer](/reference/personas/process/contract-designer) | [api-design](/reference/personas/technical/api-design) | [systems-thinker](/reference/personas/cognitive/systems-thinker) |

</td></tr>
<tr><th>Reference</th><td><a href="/reference/teams/workspace-feature">Full team reference</a></td></tr>
</table>

---

### workspace-validation {#workspace-validation}

1 member · <span class="gate-none">NONE</span> gate

<table class="inverted">
<tr><th>Command</th><td><a href="/guide/cheatsheet-commands#workspace-validate"><code>/sniper-workspace validate</code></a></td></tr>
<tr><th>Outputs</th><td><code>features/WKSP-{XXXX}/validation-wave-{N}.md</code></td></tr>
<tr><th>Member</th><td>

| Name | Process | Technical | Cognitive |
|------|---------|-----------|-----------|
| validator | [integration-validator](/reference/personas/process/integration-validator) | [backend](/reference/personas/technical/backend) | [devils-advocate](/reference/personas/cognitive/devils-advocate) |

</td></tr>
<tr><th>Reference</th><td><a href="/reference/teams/workspace-validation">Full team reference</a></td></tr>
</table>

---

## Single-Agent Phases

These phases run directly without spawning a team:

### solve

<table class="inverted">
<tr><th>Command</th><td><a href="/guide/cheatsheet-commands#solve"><code>/sniper-solve</code></a></td></tr>
<tr><th>Agent</th><td>[scrum-master](/reference/personas/process/scrum-master) · [systems-thinker](/reference/personas/cognitive/systems-thinker)</td></tr>
<tr><th>Gate</th><td><span class="gate-flexible">FLEXIBLE</span></td></tr>
<tr><th>Outputs</th><td><code>docs/epics/*.md</code> · <code>docs/stories/*.md</code></td></tr>
</table>

### refactor (impact analysis)

<table class="inverted">
<tr><th>Command</th><td><a href="/guide/cheatsheet-commands#audit-refactor"><code>/sniper-audit --target refactor</code></a></td></tr>
<tr><th>Agent</th><td>[impact-analyst](/reference/personas/process/impact-analyst) · [devils-advocate](/reference/personas/cognitive/devils-advocate)</td></tr>
<tr><th>Gate</th><td><span class="gate-flexible">FLEXIBLE</span></td></tr>
</table>

### refactor (migration planning)

<table class="inverted">
<tr><th>Command</th><td><a href="/guide/cheatsheet-commands#audit-refactor"><code>/sniper-audit --target refactor</code></a></td></tr>
<tr><th>Agent</th><td>[migration-architect](/reference/personas/process/migration-architect) · [backend](/reference/personas/technical/backend) · [systems-thinker](/reference/personas/cognitive/systems-thinker)</td></tr>
<tr><th>Gate</th><td><span class="gate-flexible">FLEXIBLE</span></td></tr>
</table>

### performance profiling

<table class="inverted">
<tr><th>Command</th><td><a href="/guide/cheatsheet-commands#audit-performance"><code>/sniper-audit --target performance</code></a></td></tr>
<tr><th>Agent</th><td>[perf-profiler](/reference/personas/process/perf-profiler) · [backend](/reference/personas/technical/backend) · [systems-thinker](/reference/personas/cognitive/systems-thinker)</td></tr>
<tr><th>Gate</th><td><span class="gate-flexible">FLEXIBLE</span></td></tr>
</table>
