---
title: Personas Cheatsheet
---

# Personas Cheatsheet

Quick reference for all SNIPER persona layers. Personas are composed in three layers -- process + technical + cognitive -- to create specialized agent identities.

## Process Layer {#process-layer}

Process personas define the agent's role and methodology.

### analyst {#analyst}

Business analyst who researches markets, competitors, and user needs.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/discover">discover</a> (analyst, risk-researcher, user-researcher)</td></tr>
<tr><th>Phases</th><td>Discover</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/analyst">Full persona reference</a></td></tr>
</table>

---

### architect {#architect}

System architect who designs technical architecture and component boundaries.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/plan">plan</a> (architect, security-analyst) · <a href="/reference/teams/feature-plan">feature-plan</a> (feature-architect)</td></tr>
<tr><th>Phases</th><td>Plan · Feature</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/architect">Full persona reference</a></td></tr>
</table>

---

### architecture-cartographer {#architecture-cartographer}

Reverse-engineers system architecture from existing code.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/ingest">ingest</a></td></tr>
<tr><th>Phases</th><td>Ingest</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/architecture-cartographer">Full persona reference</a></td></tr>
</table>

---

### code-archaeologist {#code-archaeologist}

Reverse-engineers project purpose and scope from source code.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/ingest">ingest</a></td></tr>
<tr><th>Phases</th><td>Ingest</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/code-archaeologist">Full persona reference</a></td></tr>
</table>

---

### code-investigator {#code-investigator}

Traces code execution paths and identifies failure points.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/debug">debug</a></td></tr>
<tr><th>Phases</th><td>Debug</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/code-investigator">Full persona reference</a></td></tr>
</table>

---

### code-reviewer {#code-reviewer}

Senior developer conducting thorough code review.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/review-pr">review-pr</a> (code-reviewer, security-reviewer) · <a href="/reference/teams/review-release">review-release</a> (breaking-change-analyst)</td></tr>
<tr><th>Phases</th><td>PR Review · Release Review</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/code-reviewer">Full persona reference</a></td></tr>
</table>

---

### contract-designer {#contract-designer}

Designs cross-repo interface contracts (API, types, events).

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/workspace-feature">workspace-feature</a></td></tr>
<tr><th>Phases</th><td>Workspace</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/contract-designer">Full persona reference</a></td></tr>
</table>

---

### convention-miner {#convention-miner}

Extracts coding patterns and conventions from codebases.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/ingest">ingest</a></td></tr>
<tr><th>Phases</th><td>Ingest</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/convention-miner">Full persona reference</a></td></tr>
</table>

---

### coverage-analyst {#coverage-analyst}

Identifies risk-weighted test coverage gaps.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/test">test</a></td></tr>
<tr><th>Phases</th><td>Test Audit</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/coverage-analyst">Full persona reference</a></td></tr>
</table>

---

### developer {#developer}

Implements stories with production-quality code and tests.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/sprint">sprint</a> (backend-dev, frontend-dev, infra-dev, ai-dev)</td></tr>
<tr><th>Phases</th><td>Sprint</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/developer">Full persona reference</a></td></tr>
</table>

---

### doc-analyst {#doc-analyst}

Scans project structure to produce a documentation index.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/doc">doc</a></td></tr>
<tr><th>Phases</th><td>Documentation</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/doc-analyst">Full persona reference</a></td></tr>
</table>

---

### doc-reviewer {#doc-reviewer}

Validates documentation for accuracy and completeness.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/doc">doc</a></td></tr>
<tr><th>Phases</th><td>Documentation</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/doc-reviewer">Full persona reference</a></td></tr>
</table>

---

### doc-writer {#doc-writer}

Generates clear project documentation from artifacts and code.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/doc">doc</a> · <a href="/reference/teams/review-release">review-release</a> (doc-reviewer member)</td></tr>
<tr><th>Phases</th><td>Documentation · Release Review</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/doc-writer">Full persona reference</a></td></tr>
</table>

---

### flake-hunter {#flake-hunter}

Diagnoses and fixes intermittent test failures.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/test">test</a></td></tr>
<tr><th>Phases</th><td>Test Audit</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/flake-hunter">Full persona reference</a></td></tr>
</table>

---

### impact-analyst {#impact-analyst}

Assesses blast radius of proposed code changes.

<table class="inverted">
<tr><th>Teams</th><td>Refactor (single-agent phase)</td></tr>
<tr><th>Phases</th><td>Refactor Audit</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/impact-analyst">Full persona reference</a></td></tr>
</table>

---

### integration-validator {#integration-validator}

Validates repo implementations match interface contracts.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/workspace-validation">workspace-validation</a></td></tr>
<tr><th>Phases</th><td>Workspace</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/integration-validator">Full persona reference</a></td></tr>
</table>

---

### log-analyst {#log-analyst}

Finds signal in error logs, traces, and observability data.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/debug">debug</a></td></tr>
<tr><th>Phases</th><td>Debug</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/log-analyst">Full persona reference</a></td></tr>
</table>

---

### migration-architect {#migration-architect}

Designs safe, incremental migration paths for large changes.

<table class="inverted">
<tr><th>Teams</th><td>Refactor (single-agent phase)</td></tr>
<tr><th>Phases</th><td>Refactor Audit</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/migration-architect">Full persona reference</a></td></tr>
</table>

---

### perf-profiler {#perf-profiler}

Identifies bottlenecks through systematic code analysis.

<table class="inverted">
<tr><th>Teams</th><td>Performance (single-agent phase)</td></tr>
<tr><th>Phases</th><td>Performance Audit</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/perf-profiler">Full persona reference</a></td></tr>
</table>

---

### product-manager {#product-manager}

Synthesizes discovery artifacts into a product requirements document.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/plan">plan</a> · <a href="/reference/teams/feature-plan">feature-plan</a></td></tr>
<tr><th>Phases</th><td>Plan · Feature</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/product-manager">Full persona reference</a></td></tr>
</table>

---

### qa-engineer {#qa-engineer}

Validates implementations through comprehensive testing.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/sprint">sprint</a> · <a href="/reference/teams/review-pr">review-pr</a> (test-reviewer)</td></tr>
<tr><th>Phases</th><td>Sprint · PR Review</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/qa-engineer">Full persona reference</a></td></tr>
</table>

---

### release-manager {#release-manager}

Assesses release readiness and produces changelogs.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/review-release">review-release</a></td></tr>
<tr><th>Phases</th><td>Release Review</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/release-manager">Full persona reference</a></td></tr>
</table>

---

### retro-analyst {#retro-analyst}

Post-sprint analysis to extract learnings and update memory.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/retro">retro</a></td></tr>
<tr><th>Phases</th><td>Retrospective</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/retro-analyst">Full persona reference</a></td></tr>
</table>

---

### scrum-master {#scrum-master}

Breaks requirements into epics and self-contained stories.

<table class="inverted">
<tr><th>Teams</th><td>Solve (single-agent phase)</td></tr>
<tr><th>Phases</th><td>Solve</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/scrum-master">Full persona reference</a></td></tr>
</table>

---

### threat-modeler {#threat-modeler}

Maps attack surfaces using STRIDE methodology.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/security">security</a></td></tr>
<tr><th>Phases</th><td>Security Audit</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/threat-modeler">Full persona reference</a></td></tr>
</table>

---

### triage-lead {#triage-lead}

Rapidly assesses production incidents.

<table class="inverted">
<tr><th>Teams</th><td>Referenced by debug (not a team member)</td></tr>
<tr><th>Phases</th><td>Debug</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/triage-lead">Full persona reference</a></td></tr>
</table>

---

### ux-designer {#ux-designer}

Translates requirements into UX specification with information architecture and user flows.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/plan">plan</a></td></tr>
<tr><th>Phases</th><td>Plan</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/ux-designer">Full persona reference</a></td></tr>
</table>

---

### vuln-scanner {#vuln-scanner}

Finds application-level vulnerabilities via code review.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/security">security</a></td></tr>
<tr><th>Phases</th><td>Security Audit</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/vuln-scanner">Full persona reference</a></td></tr>
</table>

---

### workspace-orchestrator {#workspace-orchestrator}

Coordinates features spanning multiple repositories.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/workspace-feature">workspace-feature</a></td></tr>
<tr><th>Phases</th><td>Workspace</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/process/workspace-orchestrator">Full persona reference</a></td></tr>
</table>

---

## Technical Layer {#technical-layer}

Technical personas add domain-specific expertise. Applied as the second layer in composition.

### api-design {#api-design}

RESTful and real-time API design -- OpenAPI, GraphQL, WebSocket contracts.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/plan">plan</a> (product-manager) · <a href="/reference/teams/workspace-feature">workspace-feature</a> (contract-designer)</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/technical/api-design">Full persona reference</a></td></tr>
</table>

---

### ai-ml {#ai-ml}

LLM integration, speech-to-text, NLP, vector databases, ML serving.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/sprint">sprint</a> (ai-dev)</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/technical/ai-ml">Full persona reference</a></td></tr>
</table>

---

### backend {#backend}

Node.js/TypeScript backend -- Express/Fastify, PostgreSQL, Redis, queues.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/plan">plan</a> (architect) · <a href="/reference/teams/sprint">sprint</a> (backend-dev, qa-engineer) · <a href="/reference/teams/ingest">ingest</a> (architecture-cartographer) · <a href="/reference/teams/feature-plan">feature-plan</a> (feature-architect) · <a href="/reference/teams/debug">debug</a> (code-investigator) · <a href="/reference/teams/workspace-validation">workspace-validation</a> (validator) · refactor (migration) · perf (profiling)</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/technical/backend">Full persona reference</a></td></tr>
</table>

---

### database {#database}

Relational/non-relational design -- PostgreSQL, ORM, query optimization.

<table class="inverted">
<tr><th>Teams</th><td>Available for composition (not assigned to a default team)</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/technical/database">Full persona reference</a></td></tr>
</table>

---

### frontend {#frontend}

React/TypeScript -- Next.js/Vite, TanStack Query, Tailwind.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/plan">plan</a> (ux-designer) · <a href="/reference/teams/sprint">sprint</a> (frontend-dev)</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/technical/frontend">Full persona reference</a></td></tr>
</table>

---

### infrastructure {#infrastructure}

AWS, Docker, CI/CD, Terraform, Kubernetes, monitoring.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/discover">discover</a> (risk-researcher) · <a href="/reference/teams/sprint">sprint</a> (infra-dev)</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/technical/infrastructure">Full persona reference</a></td></tr>
</table>

---

### security {#security}

OWASP, OAuth/OIDC, encryption, RBAC, API security, compliance.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/plan">plan</a> (security-analyst) · <a href="/reference/teams/security">security</a> (threat-modeler, vuln-scanner)</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/technical/security">Full persona reference</a></td></tr>
</table>

---

## Cognitive Layer {#cognitive-layer}

Cognitive personas define the agent's thinking style and decision framework. Applied as the third layer.

### devils-advocate {#devils-advocate}

Challenges assumptions, stress-tests designs, finds failure modes.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/discover">discover</a> (risk-researcher) · <a href="/reference/teams/sprint">sprint</a> (qa-engineer) · <a href="/reference/teams/debug">debug</a> (log-analyst) · <a href="/reference/teams/doc">doc</a> (doc-reviewer) · <a href="/reference/teams/review-pr">review-pr</a> (code-reviewer) · <a href="/reference/teams/review-release">review-release</a> (breaking-change-analyst) · <a href="/reference/teams/test">test</a> (flake-hunter) · <a href="/reference/teams/security">security</a> (vuln-scanner) · <a href="/reference/teams/workspace-validation">workspace-validation</a> (validator) · refactor (impact analysis)</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/cognitive/devils-advocate">Full persona reference</a></td></tr>
</table>

---

### mentor-explainer {#mentor-explainer}

Documents decisions so future readers understand the "why".

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/doc">doc</a> (doc-writer)</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/cognitive/mentor-explainer">Full persona reference</a></td></tr>
</table>

---

### performance-focused {#performance-focused}

Evaluates latency budgets, throughput, memory, scalability.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/sprint">sprint</a> (ai-dev)</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/cognitive/performance-focused">Full persona reference</a></td></tr>
</table>

---

### security-first {#security-first}

Evaluates every decision through a security lens first.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/plan">plan</a> (architect, security-analyst) · <a href="/reference/teams/review-pr">review-pr</a> (security-reviewer)</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/cognitive/security-first">Full persona reference</a></td></tr>
</table>

---

### systems-thinker {#systems-thinker}

Thinks in boundaries, interfaces, dependencies, and emergent behaviors.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/discover">discover</a> (analyst) · <a href="/reference/teams/plan">plan</a> (product-manager) · <a href="/reference/teams/sprint">sprint</a> (backend-dev, infra-dev) · <a href="/reference/teams/ingest">ingest</a> (all 3 members) · <a href="/reference/teams/feature-plan">feature-plan</a> (both members) · <a href="/reference/teams/debug">debug</a> (code-investigator) · <a href="/reference/teams/review-pr">review-pr</a> (test-reviewer) · <a href="/reference/teams/review-release">review-release</a> (release-manager) · <a href="/reference/teams/test">test</a> (coverage-analyst) · <a href="/reference/teams/security">security</a> (threat-modeler) · <a href="/reference/teams/retro">retro</a> · <a href="/reference/teams/workspace-feature">workspace-feature</a> (both members) · solve · refactor (migration) · perf</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/cognitive/systems-thinker">Full persona reference</a></td></tr>
</table>

---

### user-empathetic {#user-empathetic}

Thinks from the user's perspective -- what they see, feel, need.

<table class="inverted">
<tr><th>Teams</th><td><a href="/reference/teams/discover">discover</a> (user-researcher) · <a href="/reference/teams/plan">plan</a> (ux-designer) · <a href="/reference/teams/sprint">sprint</a> (frontend-dev) · <a href="/reference/teams/doc">doc</a> (doc-analyst) · <a href="/reference/teams/review-release">review-release</a> (doc-reviewer)</td></tr>
<tr><th>Reference</th><td><a href="/reference/personas/cognitive/user-empathetic">Full persona reference</a></td></tr>
</table>

---

## Composition Examples {#composition-examples}

Real compositions from team YAML files showing how the three layers combine.

::: details Backend Architect (plan team)
- **Process:** [architect](/reference/personas/process/architect)
- **Technical:** [backend](/reference/personas/technical/backend)
- **Cognitive:** [security-first](/reference/personas/cognitive/security-first)
- **Result:** Security-conscious backend architect who evaluates every design through a security lens. Produces `docs/architecture.md`.
- **Team:** [plan](/reference/teams/plan) (architect member)
:::

::: details Risk Researcher (discover team)
- **Process:** [analyst](/reference/personas/process/analyst)
- **Technical:** [infrastructure](/reference/personas/technical/infrastructure)
- **Cognitive:** [devils-advocate](/reference/personas/cognitive/devils-advocate)
- **Result:** Infrastructure-aware analyst who challenges optimistic assumptions and finds failure modes. Produces `docs/risks.md`.
- **Team:** [discover](/reference/teams/discover) (risk-researcher member)
:::

::: details AI Developer (sprint team)
- **Process:** [developer](/reference/personas/process/developer)
- **Technical:** [ai-ml](/reference/personas/technical/ai-ml)
- **Cognitive:** [performance-focused](/reference/personas/cognitive/performance-focused)
- **Result:** AI/ML specialist focused on latency budgets and efficient model serving. Uses Opus model.
- **Team:** [sprint](/reference/teams/sprint) (ai-dev member)
:::

::: details Doc Writer (doc team)
- **Process:** [doc-writer](/reference/personas/process/doc-writer)
- **Technical:** from-config (matches project stack)
- **Cognitive:** [mentor-explainer](/reference/personas/cognitive/mentor-explainer)
- **Result:** Documentation writer who explains decisions for future readers, with stack-specific technical knowledge.
- **Team:** [doc](/reference/teams/doc) (doc-writer member)
:::

::: details Vulnerability Scanner (security audit team)
- **Process:** [vuln-scanner](/reference/personas/process/vuln-scanner)
- **Technical:** [security](/reference/personas/technical/security)
- **Cognitive:** [devils-advocate](/reference/personas/cognitive/devils-advocate)
- **Result:** Security researcher who challenges every assumption and hunts for non-obvious vulnerabilities. Produces `vulnerability-report.md`.
- **Team:** [security](/reference/teams/security) (vuln-scanner member)
:::
