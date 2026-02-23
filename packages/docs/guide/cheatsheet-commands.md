---
title: Commands Cheatsheet
---

# Commands Cheatsheet

Quick reference for every SNIPER command. Jump to a command or browse by category.

## Quick Lookup

| Command | Description | Gate |
|---------|-------------|------|
| [`init`](#init) | Scaffold `.sniper/` directory and config | -- |
| [`ingest`](#ingest) | Reverse-engineer artifacts from existing code | <span class="gate-flexible">FLEXIBLE</span> |
| [`discover`](#discover) | Research market, risks, and users | <span class="gate-flexible">FLEXIBLE</span> |
| [`plan`](#plan) | Produce PRD, architecture, UX spec, security | <span class="gate-strict">STRICT</span> |
| [`solve`](#solve) | Shard PRD into epics and stories | <span class="gate-flexible">FLEXIBLE</span> |
| [`sprint`](#sprint) | Implement stories with parallel dev team | <span class="gate-strict">STRICT</span> |
| [`review`](#review) | Run the review gate for the current phase | per-phase |
| [`feature`](#feature) | Scoped mini-lifecycle for a single feature | <span class="gate-flexible">FLEX</span> / <span class="gate-strict">STRICT</span> |
| [`debug`](#debug) | Structured bug investigation | <span class="gate-flexible">FLEXIBLE</span> |
| [`audit`](#audit) | Refactor, review, test, security, or perf audit | varies |
| [`workspace`](#workspace-commands) | Multi-repo workspace management | varies |
| [`compose`](#compose) | Assemble a spawn prompt from persona layers | -- |
| [`doc`](#doc) | Generate or update project documentation | <span class="gate-flexible">FLEXIBLE</span> |
| [`status`](#status) | Show lifecycle status and artifact state | -- |
| [`memory`](#memory) | Manage conventions, anti-patterns, decisions | -- |

---

## Lifecycle Commands

### `init` {#init}

Scaffold the `.sniper/` directory and walk through interactive project configuration.

<table class="inverted">
<tr><th>Phase</th><td>Setup</td></tr>
<tr><th>Team</th><td>None (single agent)</td></tr>
<tr><th>Outputs</th><td><code>.sniper/config.yaml</code> · <code>.sniper/</code> directory tree · <code>CLAUDE.md</code></td></tr>
<tr><th>Gate</th><td>--</td></tr>
<tr><th>Reference</th><td><a href="/reference/commands/sniper-init">Full command reference</a></td></tr>
</table>

---

### `ingest` {#ingest}

Reverse-engineer project purpose, architecture, and conventions from an existing codebase.

<table class="inverted">
<tr><th>Phase</th><td>Ingest</td></tr>
<tr><th>Team</th><td><a href="/reference/teams/ingest">ingest</a> (3 members)</td></tr>
<tr><th>Members</th><td>

| Name | Process | Technical | Cognitive |
|------|---------|-----------|-----------|
| code-archaeologist | [code-archaeologist](/reference/personas/process/code-archaeologist) | -- | [systems-thinker](/reference/personas/cognitive/systems-thinker) |
| architecture-cartographer | [architecture-cartographer](/reference/personas/process/architecture-cartographer) | [backend](/reference/personas/technical/backend) | [systems-thinker](/reference/personas/cognitive/systems-thinker) |
| convention-miner | [convention-miner](/reference/personas/process/convention-miner) | -- | [systems-thinker](/reference/personas/cognitive/systems-thinker) |

</td></tr>
<tr><th>Outputs</th><td><code>docs/brief.md</code> · <code>docs/architecture.md</code> · <code>docs/conventions.md</code></td></tr>
<tr><th>Gate</th><td><span class="gate-flexible">FLEXIBLE</span> · <a href="/reference/checklists/ingest-review">ingest-review</a></td></tr>
<tr><th>Coordination</th><td>Parallel (no dependencies)</td></tr>
<tr><th>Reference</th><td><a href="/reference/commands/sniper-ingest">Full command reference</a></td></tr>
</table>

---

### `discover` {#discover}

Research the market landscape, assess technical and business risks, and study target users.

<table class="inverted">
<tr><th>Phase</th><td>Discover</td></tr>
<tr><th>Team</th><td><a href="/reference/teams/discover">discover</a> (3 members)</td></tr>
<tr><th>Members</th><td>

| Name | Process | Technical | Cognitive |
|------|---------|-----------|-----------|
| analyst | [analyst](/reference/personas/process/analyst) | -- | [systems-thinker](/reference/personas/cognitive/systems-thinker) |
| risk-researcher | [analyst](/reference/personas/process/analyst) | [infrastructure](/reference/personas/technical/infrastructure) | [devils-advocate](/reference/personas/cognitive/devils-advocate) |
| user-researcher | [analyst](/reference/personas/process/analyst) | -- | [user-empathetic](/reference/personas/cognitive/user-empathetic) |

</td></tr>
<tr><th>Outputs</th><td><code>docs/brief.md</code> · <code>docs/risks.md</code> · <code>docs/personas.md</code></td></tr>
<tr><th>Gate</th><td><span class="gate-flexible">FLEXIBLE</span> · <a href="/reference/checklists/discover-review">discover-review</a></td></tr>
<tr><th>Coordination</th><td>Parallel (no dependencies)</td></tr>
<tr><th>Reference</th><td><a href="/reference/commands/sniper-discover">Full command reference</a></td></tr>
</table>

---

### `plan` {#plan}

Produce a PRD, system architecture, UX specification, and security analysis. Uses Opus-class models.

<table class="inverted">
<tr><th>Phase</th><td>Plan</td></tr>
<tr><th>Team</th><td><a href="/reference/teams/plan">plan</a> (4 members)</td></tr>
<tr><th>Members</th><td>

| Name | Process | Technical | Cognitive |
|------|---------|-----------|-----------|
| product-manager | [product-manager](/reference/personas/process/product-manager) | [api-design](/reference/personas/technical/api-design) | [systems-thinker](/reference/personas/cognitive/systems-thinker) |
| architect | [architect](/reference/personas/process/architect) | [backend](/reference/personas/technical/backend) | [security-first](/reference/personas/cognitive/security-first) |
| ux-designer | [ux-designer](/reference/personas/process/ux-designer) | [frontend](/reference/personas/technical/frontend) | [user-empathetic](/reference/personas/cognitive/user-empathetic) |
| security-analyst | [architect](/reference/personas/process/architect) | [security](/reference/personas/technical/security) | [security-first](/reference/personas/cognitive/security-first) |

</td></tr>
<tr><th>Outputs</th><td><code>docs/prd.md</code> · <code>docs/architecture.md</code> · <code>docs/ux-spec.md</code> · <code>docs/security.md</code></td></tr>
<tr><th>Gate</th><td><span class="gate-strict">STRICT</span> · <a href="/reference/checklists/plan-review">plan-review</a></td></tr>
<tr><th>Dependencies</th><td>architect, ux-designer, security-analyst all blocked by product-manager (PRD first)</td></tr>
<tr><th>Plan approval</th><td>architect must present approach before writing</td></tr>
<tr><th>Model</th><td>Opus</td></tr>
<tr><th>Reference</th><td><a href="/reference/commands/sniper-plan">Full command reference</a></td></tr>
</table>

---

### `solve` {#solve}

Break the PRD into epics and self-contained stories with acceptance criteria.

<table class="inverted">
<tr><th>Phase</th><td>Solve</td></tr>
<tr><th>Team</th><td>Single agent (no team spawned)</td></tr>
<tr><th>Agent</th><td>[scrum-master](/reference/personas/process/scrum-master) · [systems-thinker](/reference/personas/cognitive/systems-thinker)</td></tr>
<tr><th>Outputs</th><td><code>docs/epics/*.md</code> · <code>docs/stories/*.md</code></td></tr>
<tr><th>Gate</th><td><span class="gate-flexible">FLEXIBLE</span></td></tr>
<tr><th>Reference</th><td><a href="/reference/commands/sniper-solve">Full command reference</a></td></tr>
</table>

---

### `sprint` {#sprint}

Implement stories with a parallel development team. Members are drawn from a pool based on story ownership.

<table class="inverted">
<tr><th>Phase</th><td>Sprint</td></tr>
<tr><th>Team</th><td><a href="/reference/teams/sprint">sprint</a> (2--5 from pool)</td></tr>
<tr><th>Members</th><td>

| Name | Process | Technical | Cognitive | Model | Owns |
|------|---------|-----------|-----------|-------|------|
| backend-dev | [developer](/reference/personas/process/developer) | [backend](/reference/personas/technical/backend) | [systems-thinker](/reference/personas/cognitive/systems-thinker) | Sonnet | backend |
| frontend-dev | [developer](/reference/personas/process/developer) | [frontend](/reference/personas/technical/frontend) | [user-empathetic](/reference/personas/cognitive/user-empathetic) | Sonnet | frontend |
| infra-dev | [developer](/reference/personas/process/developer) | [infrastructure](/reference/personas/technical/infrastructure) | [systems-thinker](/reference/personas/cognitive/systems-thinker) | Sonnet | infrastructure |
| ai-dev | [developer](/reference/personas/process/developer) | [ai-ml](/reference/personas/technical/ai-ml) | [performance-focused](/reference/personas/cognitive/performance-focused) | Opus | ai |
| qa-engineer | [qa-engineer](/reference/personas/process/qa-engineer) | [backend](/reference/personas/technical/backend) | [devils-advocate](/reference/personas/cognitive/devils-advocate) | Sonnet | tests |

</td></tr>
<tr><th>Outputs</th><td>Source code · test files</td></tr>
<tr><th>Gate</th><td><span class="gate-strict">STRICT</span></td></tr>
<tr><th>Coordination</th><td>backend <-> frontend · backend <-> ai · backend <-> qa</td></tr>
<tr><th>Note</th><td>qa-engineer is always included. Other members are spawned on demand based on story ownership.</td></tr>
<tr><th>Reference</th><td><a href="/reference/commands/sniper-sprint">Full command reference</a></td></tr>
</table>

---

### `review` {#review}

Run the review gate for the current phase. Evaluates artifacts against the phase checklist.

<table class="inverted">
<tr><th>Phase</th><td>Any (runs the gate for whichever phase is active)</td></tr>
<tr><th>Team</th><td>None (single agent)</td></tr>
<tr><th>Outputs</th><td>Review report with PASS / WARN / FAIL per criterion</td></tr>
<tr><th>Gate</th><td>Determined by current phase</td></tr>
<tr><th>Reference</th><td><a href="/reference/commands/sniper-review">Full command reference</a></td></tr>
</table>

---

## Extended Commands

### `feature` {#feature}

Scoped mini-lifecycle for a single feature: brief, spec, architecture delta, stories, then sprint.

<table class="inverted">
<tr><th>Phase</th><td>Feature (multi-phase)</td></tr>
<tr><th>Team</th><td><a href="/reference/teams/feature-plan">feature-plan</a> (2 members) + <a href="/reference/teams/sprint">sprint</a> team</td></tr>
<tr><th>Planning members</th><td>

| Name | Process | Technical | Cognitive |
|------|---------|-----------|-----------|
| feature-pm | [product-manager](/reference/personas/process/product-manager) | -- | [systems-thinker](/reference/personas/cognitive/systems-thinker) |
| feature-architect | [architect](/reference/personas/process/architect) | [backend](/reference/personas/technical/backend) | [systems-thinker](/reference/personas/cognitive/systems-thinker) |

</td></tr>
<tr><th>Outputs</th><td><code>docs/features/SNPR-{XXXX}/spec.md</code> · <code>arch-delta.md</code> · stories · source code</td></tr>
<tr><th>Gate</th><td><span class="gate-flexible">FLEXIBLE</span> (planning) · <span class="gate-strict">STRICT</span> (sprint)</td></tr>
<tr><th>Dependencies</th><td>feature-architect blocked by feature-pm</td></tr>
<tr><th>Plan approval</th><td>feature-architect must present approach before writing</td></tr>
<tr><th>Model</th><td>Opus</td></tr>
<tr><th>Reference</th><td><a href="/reference/commands/sniper-feature">Full command reference</a></td></tr>
</table>

---

### `debug` {#debug}

Structured investigation of a bug with parallel log analysis and code tracing.

<table class="inverted">
<tr><th>Phase</th><td>Debug</td></tr>
<tr><th>Team</th><td><a href="/reference/teams/debug">debug</a> (2 members)</td></tr>
<tr><th>Members</th><td>

| Name | Process | Technical | Cognitive |
|------|---------|-----------|-----------|
| log-analyst | [log-analyst](/reference/personas/process/log-analyst) | -- | [devils-advocate](/reference/personas/cognitive/devils-advocate) |
| code-investigator | [code-investigator](/reference/personas/process/code-investigator) | [backend](/reference/personas/technical/backend) | [systems-thinker](/reference/personas/cognitive/systems-thinker) |

</td></tr>
<tr><th>Outputs</th><td><code>docs/bugs/BUG-{NNN}/investigation.md</code></td></tr>
<tr><th>Gate</th><td><span class="gate-flexible">FLEXIBLE</span> · <a href="/reference/checklists/debug-review">debug-review</a></td></tr>
<tr><th>Coordination</th><td>Parallel (no dependencies)</td></tr>
<tr><th>Reference</th><td><a href="/reference/commands/sniper-debug">Full command reference</a></td></tr>
</table>

---

### `audit` {#audit}

Run a targeted audit. The `--target` flag determines the team and scope.

#### `audit --target refactor` {#audit-refactor}

Scope a refactoring effort with impact analysis and migration planning.

<table class="inverted">
<tr><th>Phase</th><td>Refactor</td></tr>
<tr><th>Team</th><td>Single-agent phases (no team spawned)</td></tr>
<tr><th>Agents</th><td>Impact analysis: [impact-analyst](/reference/personas/process/impact-analyst) · [devils-advocate](/reference/personas/cognitive/devils-advocate)<br>Migration planning: [migration-architect](/reference/personas/process/migration-architect) · [backend](/reference/personas/technical/backend) · [systems-thinker](/reference/personas/cognitive/systems-thinker)</td></tr>
<tr><th>Outputs</th><td>Scope assessment · migration plan · stories</td></tr>
<tr><th>Gate</th><td><span class="gate-flexible">FLEXIBLE</span> · <a href="/reference/checklists/refactor-review">refactor-review</a></td></tr>
</table>

#### `audit --target review --pr N` {#audit-review-pr}

Automated code review of a pull request.

<table class="inverted">
<tr><th>Phase</th><td>PR Review</td></tr>
<tr><th>Team</th><td><a href="/reference/teams/review-pr">review-pr</a> (3 members)</td></tr>
<tr><th>Members</th><td>

| Name | Process | Technical | Cognitive |
|------|---------|-----------|-----------|
| code-reviewer | [code-reviewer](/reference/personas/process/code-reviewer) | -- | [devils-advocate](/reference/personas/cognitive/devils-advocate) |
| security-reviewer | [code-reviewer](/reference/personas/process/code-reviewer) | -- | [security-first](/reference/personas/cognitive/security-first) |
| test-reviewer | [qa-engineer](/reference/personas/process/qa-engineer) | -- | [systems-thinker](/reference/personas/cognitive/systems-thinker) |

</td></tr>
<tr><th>Outputs</th><td><code>docs/reviews/PR-{NNN}-review.md</code></td></tr>
<tr><th>Gate</th><td><span class="gate-auto">AUTO</span></td></tr>
</table>

#### `audit --target review --release TAG` {#audit-review-release}

Assess release readiness with changelog and breaking-change analysis.

<table class="inverted">
<tr><th>Phase</th><td>Release Review</td></tr>
<tr><th>Team</th><td><a href="/reference/teams/review-release">review-release</a> (3 members)</td></tr>
<tr><th>Members</th><td>

| Name | Process | Technical | Cognitive |
|------|---------|-----------|-----------|
| release-manager | [release-manager](/reference/personas/process/release-manager) | -- | [systems-thinker](/reference/personas/cognitive/systems-thinker) |
| breaking-change-analyst | [code-reviewer](/reference/personas/process/code-reviewer) | -- | [devils-advocate](/reference/personas/cognitive/devils-advocate) |
| doc-reviewer | [doc-writer](/reference/personas/process/doc-writer) | -- | [user-empathetic](/reference/personas/cognitive/user-empathetic) |

</td></tr>
<tr><th>Outputs</th><td><code>docs/releases/{version}-readiness.md</code></td></tr>
<tr><th>Gate</th><td><span class="gate-auto">AUTO</span></td></tr>
</table>

#### `audit --target tests` {#audit-tests}

Analyze test coverage gaps and diagnose flaky tests.

<table class="inverted">
<tr><th>Phase</th><td>Test Audit</td></tr>
<tr><th>Team</th><td><a href="/reference/teams/test">test</a> (2 members)</td></tr>
<tr><th>Members</th><td>

| Name | Process | Technical | Cognitive |
|------|---------|-----------|-----------|
| coverage-analyst | [coverage-analyst](/reference/personas/process/coverage-analyst) | -- | [systems-thinker](/reference/personas/cognitive/systems-thinker) |
| flake-hunter | [flake-hunter](/reference/personas/process/flake-hunter) | -- | [devils-advocate](/reference/personas/cognitive/devils-advocate) |

</td></tr>
<tr><th>Outputs</th><td><code>docs/audits/TST-{NNN}/coverage-report.md</code> · <code>flaky-report.md</code></td></tr>
<tr><th>Gate</th><td><span class="gate-flexible">FLEXIBLE</span> · <a href="/reference/checklists/test-review">test-review</a></td></tr>
</table>

#### `audit --target security` {#audit-security}

Threat modeling and vulnerability scanning.

<table class="inverted">
<tr><th>Phase</th><td>Security Audit</td></tr>
<tr><th>Team</th><td><a href="/reference/teams/security">security</a> (2 members)</td></tr>
<tr><th>Members</th><td>

| Name | Process | Technical | Cognitive |
|------|---------|-----------|-----------|
| threat-modeler | [threat-modeler](/reference/personas/process/threat-modeler) | [security](/reference/personas/technical/security) | [systems-thinker](/reference/personas/cognitive/systems-thinker) |
| vuln-scanner | [vuln-scanner](/reference/personas/process/vuln-scanner) | [security](/reference/personas/technical/security) | [devils-advocate](/reference/personas/cognitive/devils-advocate) |

</td></tr>
<tr><th>Outputs</th><td><code>docs/audits/SEC-{NNN}/threat-model.md</code> · <code>vulnerability-report.md</code></td></tr>
<tr><th>Gate</th><td><span class="gate-flexible">FLEXIBLE</span> · <a href="/reference/checklists/security-review">security-review</a></td></tr>
</table>

#### `audit --target performance` {#audit-performance}

Profile bottlenecks and produce an optimization plan.

<table class="inverted">
<tr><th>Phase</th><td>Performance Audit</td></tr>
<tr><th>Team</th><td>Single agent (no team spawned)</td></tr>
<tr><th>Agent</th><td>[perf-profiler](/reference/personas/process/perf-profiler) · [backend](/reference/personas/technical/backend) · [systems-thinker](/reference/personas/cognitive/systems-thinker)</td></tr>
<tr><th>Outputs</th><td>Performance profile · optimization plan · stories</td></tr>
<tr><th>Gate</th><td><span class="gate-flexible">FLEXIBLE</span> · <a href="/reference/checklists/perf-review">perf-review</a></td></tr>
</table>

---

## Workspace Commands {#workspace-commands}

### `workspace init` {#workspace-init}

Initialize a multi-repo workspace with shared configuration.

<table class="inverted">
<tr><th>Command</th><td><code>/sniper-workspace init</code></td></tr>
<tr><th>Team</th><td>None (single agent)</td></tr>
<tr><th>Outputs</th><td>Workspace configuration · repo manifests</td></tr>
</table>

---

### `workspace feature` {#workspace-feature}

Plan and execute a feature that spans multiple repositories.

<table class="inverted">
<tr><th>Command</th><td><code>/sniper-workspace feature</code></td></tr>
<tr><th>Team</th><td><a href="/reference/teams/workspace-feature">workspace-feature</a> (2 members) + sprint teams per repo</td></tr>
<tr><th>Members</th><td>

| Name | Process | Technical | Cognitive |
|------|---------|-----------|-----------|
| orchestrator | [workspace-orchestrator](/reference/personas/process/workspace-orchestrator) | -- | [systems-thinker](/reference/personas/cognitive/systems-thinker) |
| contract-designer | [contract-designer](/reference/personas/process/contract-designer) | [api-design](/reference/personas/technical/api-design) | [systems-thinker](/reference/personas/cognitive/systems-thinker) |

</td></tr>
<tr><th>Outputs</th><td><code>features/WKSP-{XXXX}/brief.md</code> · <code>plan.md</code> · <code>contracts/*.contract.yaml</code></td></tr>
<tr><th>Gate</th><td><span class="gate-strict">STRICT</span> · <a href="/reference/checklists/workspace-review">workspace-review</a></td></tr>
</table>

---

### `workspace status` {#workspace-status}

Show the current state of all repos in the workspace.

<table class="inverted">
<tr><th>Command</th><td><code>/sniper-workspace status</code></td></tr>
<tr><th>Team</th><td>None (read-only)</td></tr>
<tr><th>Outputs</th><td>Console output</td></tr>
</table>

---

### `workspace validate` {#workspace-validate}

Validate that repo implementations match interface contracts.

<table class="inverted">
<tr><th>Command</th><td><code>/sniper-workspace validate</code></td></tr>
<tr><th>Team</th><td><a href="/reference/teams/workspace-validation">workspace-validation</a> (1 member)</td></tr>
<tr><th>Agent</th><td>[integration-validator](/reference/personas/process/integration-validator) · [backend](/reference/personas/technical/backend) · [devils-advocate](/reference/personas/cognitive/devils-advocate)</td></tr>
<tr><th>Outputs</th><td><code>features/WKSP-{XXXX}/validation-wave-{N}.md</code></td></tr>
</table>

---

## Utility Commands

### `compose` {#compose}

Assemble a spawn prompt from persona layers. Used internally by phase commands and available for manual composition.

<table class="inverted">
<tr><th>Team</th><td>None (single agent)</td></tr>
<tr><th>Inputs</th><td><code>--process</code> · <code>--technical</code> · <code>--cognitive</code> · <code>--domain</code> · <code>--name</code> · <code>--ownership</code></td></tr>
<tr><th>Outputs</th><td><code>.sniper/spawn-prompts/{name}.md</code></td></tr>
<tr><th>Reference</th><td><a href="/reference/commands/sniper-compose">Full command reference</a></td></tr>
</table>

---

### `doc` {#doc}

Generate or update project documentation with a sequential writing pipeline.

<table class="inverted">
<tr><th>Team</th><td><a href="/reference/teams/doc">doc</a> (3 members)</td></tr>
<tr><th>Members</th><td>

| Name | Process | Technical | Cognitive |
|------|---------|-----------|-----------|
| doc-analyst | [doc-analyst](/reference/personas/process/doc-analyst) | -- | [user-empathetic](/reference/personas/cognitive/user-empathetic) |
| doc-writer | [doc-writer](/reference/personas/process/doc-writer) | from-config | [mentor-explainer](/reference/personas/cognitive/mentor-explainer) |
| doc-reviewer | [doc-reviewer](/reference/personas/process/doc-reviewer) | -- | [devils-advocate](/reference/personas/cognitive/devils-advocate) |

</td></tr>
<tr><th>Outputs</th><td><code>README.md</code> · <code>docs/*.md</code> · <code>docs/.sniper-doc-review.md</code></td></tr>
<tr><th>Gate</th><td><span class="gate-flexible">FLEXIBLE</span> · <a href="/reference/checklists/doc-review">doc-review</a></td></tr>
<tr><th>Coordination</th><td>Sequential: analyst -> writer -> reviewer</td></tr>
<tr><th>Reference</th><td><a href="/reference/commands/sniper-doc">Full command reference</a></td></tr>
</table>

---

### `status` {#status}

Show lifecycle status, artifact state, and the next recommended action. Read-only.

<table class="inverted">
<tr><th>Team</th><td>None (read-only)</td></tr>
<tr><th>Outputs</th><td>Console output</td></tr>
<tr><th>Reference</th><td><a href="/reference/commands/sniper-status">Full command reference</a></td></tr>
</table>

---

### `memory` {#memory}

Manage the agent memory system -- conventions, anti-patterns, and architectural decisions.

<table class="inverted">
<tr><th>Team</th><td>None (single agent)</td></tr>
<tr><th>Outputs</th><td><code>.sniper/memory/</code> entries</td></tr>
<tr><th>Reference</th><td><a href="/reference/commands/sniper-memory">Full command reference</a></td></tr>
</table>

---

## Common Flags

Most phase commands accept these flags:

| Flag | Description |
|------|-------------|
| `dry-run` | Compose prompts without spawning agents |
| `skip-review` | Skip the review gate (ignored on STRICT gates) |
| `--context "{text}"` | Label for the phase log entry |
| `--feature SNPR-{XXXX}` | Scope sprint to a feature |

## CLI Commands

The `sniper` binary provides project scaffolding and management:

```bash
sniper init                    # Scaffold .sniper/ directory
sniper status                  # Show lifecycle status
sniper update                  # Update framework files to latest version
sniper add-pack <pack-name>    # Add a domain pack
sniper remove-pack <pack-name> # Remove a domain pack
sniper list-packs              # List installed and available packs
sniper memory                  # Manage agent memory
sniper workspace               # Workspace management
```

## Phase Flow

```
init -> ingest (existing) -> feature / discover -> plan -> solve -> sprint -> sprint -> ...
                \                                                      |
                 \-> discover -> plan -> solve -> sprint ---------------/
```

- `ingest` is for existing codebases; `discover` is for greenfield projects.
- `sprint` repeats until all stories are complete.
- `feature`, `debug`, and `audit` can run at any time after `ingest` or `discover`.
