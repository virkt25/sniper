---
title: Templates Reference
---

# Templates Reference

Templates define the structure of artifacts produced by SNIPER agents during phase execution. They ensure consistent output format across projects. Templates are stored in `.sniper/templates/` as markdown or YAML files.

## Artifact Templates

### Discovery Phase

| Template | File | Produced By | Description |
|----------|------|-------------|-------------|
| [Brief](/reference/templates/brief) | `brief.md` | Analyst | Project brief with objectives, users, scope, and risks |
| [Personas](/reference/templates/personas) | `personas.md` | Analyst | User persona definitions |
| [Risks](/reference/templates/risks) | `risks.md` | Analyst | Risk assessment with severity and mitigations |

### Planning Phase

| Template | File | Produced By | Description |
|----------|------|-------------|-------------|
| [PRD](/reference/templates/prd) | `prd.md` | Product Manager | Product requirements with user stories and acceptance criteria |
| [Architecture](/reference/templates/architecture) | `architecture.md` | Architect | System architecture with diagrams, data models, and API design |
| [UX Spec](/reference/templates/ux-spec) | `ux-spec.md` | UX Designer | User experience specification with flows and wireframes |
| [Security](/reference/templates/security) | `security.md` | Security Analyst | Security requirements, threat model, and mitigations |

### Solve Phase

| Template | File | Produced By | Description |
|----------|------|-------------|-------------|
| [Epic](/reference/templates/epic) | `epic.md` | Scrum Master | Epic definition with scope, stories, and dependencies |
| [Story](/reference/templates/story) | `story.md` | Scrum Master | Self-contained story with embedded context and acceptance criteria |
| [Conventions](/reference/templates/conventions) | `conventions.md` | Scrum Master | Coding conventions extracted during story creation |

### Sprint Phase

| Template | File | Produced By | Description |
|----------|------|-------------|-------------|
| [Sprint Review](/reference/templates/sprint-review) | `sprint-review.md` | QA Engineer | Sprint completion report with test results |

### Documentation Phase

| Template | File | Produced By | Description |
|----------|------|-------------|-------------|
| [README](/reference/templates/doc-readme) | `doc-readme.md` | Doc Writer | Project README |
| [API Docs](/reference/templates/doc-api) | `doc-api.md` | Doc Writer | API documentation |
| [Guide](/reference/templates/doc-guide) | `doc-guide.md` | Doc Writer | User guide |

### Feature Lifecycle

| Template | File | Produced By | Description |
|----------|------|-------------|-------------|
| [Feature Brief](/reference/templates/feature-brief) | `feature-brief.md` | Feature scoping | Feature scope definition |
| [Feature Spec](/reference/templates/feature-spec) | `feature-spec.md` | Feature planning | Feature specification with architecture delta |
| [Arch Delta](/reference/templates/arch-delta) | `arch-delta.md` | Feature planning | Architecture changes for merge-back |

### Debug Workflow

| Template | File | Produced By | Description |
|----------|------|-------------|-------------|
| [Bug Report](/reference/templates/bug-report) | `bug-report.md` | Triage Lead | Structured bug report |
| [Investigation](/reference/templates/investigation) | `investigation.md` | Code Investigator | Root cause analysis |
| [Postmortem](/reference/templates/postmortem) | `postmortem.md` | Debug team | Post-incident analysis |

### Audit Workflow

| Template | File | Produced By | Description |
|----------|------|-------------|-------------|
| [PR Review](/reference/templates/pr-review) | `pr-review.md` | Code Reviewer | Pull request review report |
| [Refactor Scope](/reference/templates/refactor-scope) | `refactor-scope.md` | Migration Architect | Refactoring plan and scope |
| [Coverage Report](/reference/templates/coverage-report) | `coverage-report.md` | Coverage Analyst | Test coverage analysis |
| [Flaky Report](/reference/templates/flaky-report) | `flaky-report.md` | Flake Hunter | Flaky test identification report |
| [Threat Model](/reference/templates/threat-model) | `threat-model.md` | Threat Modeler | Security threat model |
| [Vulnerability Report](/reference/templates/vulnerability-report) | `vulnerability-report.md` | Vuln Scanner | Vulnerability scan results |
| [Performance Profile](/reference/templates/performance-profile) | `performance-profile.md` | Perf Profiler | Performance profiling results |
| [Optimization Plan](/reference/templates/optimization-plan) | `optimization-plan.md` | Perf Profiler | Performance optimization recommendations |
| [Migration Plan](/reference/templates/migration-plan) | `migration-plan.md` | Migration Architect | Migration execution plan |
| [Release Readiness](/reference/templates/release-readiness) | `release-readiness.md` | Release Manager | Release readiness assessment |

### Workspace Mode

| Template | File | Produced By | Description |
|----------|------|-------------|-------------|
| [Workspace Brief](/reference/templates/workspace-brief) | `workspace-brief.md` | Workspace Orchestrator | Cross-repo feature scope |
| [Workspace Plan](/reference/templates/workspace-plan) | `workspace-plan.md` | Workspace Orchestrator | Cross-repo implementation plan |
| [Contract](/reference/templates/contract) | `contract.yaml` | Contract Designer | Interface contract definition (YAML) |
| [Contract Validation Report](/reference/templates/contract-validation-report) | `contract-validation-report.md` | Integration Validator | Contract compliance results |

### Memory

| Template | File | Description |
|----------|------|-------------|
| [Convention](/reference/templates/memory-convention) | `memory-convention.yaml` | Convention entry format |
| [Anti-Pattern](/reference/templates/memory-anti-pattern) | `memory-anti-pattern.yaml` | Anti-pattern entry format |
| [Decision](/reference/templates/memory-decision) | `memory-decision.yaml` | Decision entry format |
| [Retro](/reference/templates/retro) | `retro.yaml` | Sprint retrospective format |

## Template Usage

Templates are automatically used by agents during phase execution. The agent reads the template, fills in project-specific content, and writes the artifact to the `docs/` directory.

::: tip
Templates define structure, not content. Agents use them as scaffolding and fill in details based on the project context, prior artifacts, and their persona expertise.
:::

## Domain Pack Templates

Domain packs can provide additional templates or template addenda that extend standard templates with domain-specific sections. See [Domain Packs](/guide/domain-packs) for details.

## Related

- [Core Concepts](/guide/core-concepts) -- artifacts and how they fit the lifecycle
- [Full Lifecycle](/guide/full-lifecycle) -- which templates are used in each phase
- [Teams](/reference/teams/) -- which agents produce which artifacts
