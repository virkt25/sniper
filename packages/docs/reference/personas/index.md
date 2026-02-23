---
title: Personas Reference
---

# Personas Reference

Personas define who an agent is -- its role, expertise, thinking style, and domain knowledge. SNIPER composes personas from up to four layers, merging them into a single spawn prompt.

## Layers

| Layer | Directory | Required | Purpose |
|-------|-----------|----------|---------|
| Process | `personas/process/` | Yes | Defines the agent's role in the project lifecycle |
| Technical | `personas/technical/` | No | Adds domain-specific technical expertise |
| Cognitive | `personas/cognitive/` | No | Shapes how the agent thinks and prioritizes |
| Domain | `personas/domain/` | No | Injects industry knowledge from domain packs |

## Process Personas

The process layer is the only required layer. It defines the agent's role, responsibilities, and output expectations.

| Persona | File | Description |
|---------|------|-------------|
| [Analyst](/reference/personas/process/analyst) | `analyst.md` | Researches users, markets, and competitors during discovery |
| [Architect](/reference/personas/process/architect) | `architect.md` | Designs system architecture, APIs, and data models |
| [Architecture Cartographer](/reference/personas/process/architecture-cartographer) | `architecture-cartographer.md` | Maps existing codebase architecture during ingest |
| [Code Archaeologist](/reference/personas/process/code-archaeologist) | `code-archaeologist.md` | Excavates existing codebase patterns during ingest |
| [Code Investigator](/reference/personas/process/code-investigator) | `code-investigator.md` | Investigates bugs and traces root causes during debug |
| [Code Reviewer](/reference/personas/process/code-reviewer) | `code-reviewer.md` | Reviews code quality, patterns, and standards |
| [Contract Designer](/reference/personas/process/contract-designer) | `contract-designer.md` | Designs cross-repo interface contracts in workspace mode |
| [Convention Miner](/reference/personas/process/convention-miner) | `convention-miner.md` | Extracts coding conventions from existing codebases during ingest |
| [Coverage Analyst](/reference/personas/process/coverage-analyst) | `coverage-analyst.md` | Analyzes test coverage gaps and generates coverage reports |
| [Developer](/reference/personas/process/developer) | `developer.md` | Implements features and writes code during sprints |
| [Doc Analyst](/reference/personas/process/doc-analyst) | `doc-analyst.md` | Analyzes documentation needs and gaps |
| [Doc Reviewer](/reference/personas/process/doc-reviewer) | `doc-reviewer.md` | Reviews documentation quality and accuracy |
| [Doc Writer](/reference/personas/process/doc-writer) | `doc-writer.md` | Writes project documentation (README, API docs, guides) |
| [Flake Hunter](/reference/personas/process/flake-hunter) | `flake-hunter.md` | Identifies and fixes flaky tests |
| [Impact Analyst](/reference/personas/process/impact-analyst) | `impact-analyst.md` | Assesses impact of changes across the codebase |
| [Integration Validator](/reference/personas/process/integration-validator) | `integration-validator.md` | Validates cross-repo contract compliance in workspace mode |
| [Log Analyst](/reference/personas/process/log-analyst) | `log-analyst.md` | Analyzes logs and traces during debug |
| [Migration Architect](/reference/personas/process/migration-architect) | `migration-architect.md` | Plans and designs codebase migrations |
| [Perf Profiler](/reference/personas/process/perf-profiler) | `perf-profiler.md` | Profiles and optimizes application performance |
| [Product Manager](/reference/personas/process/product-manager) | `product-manager.md` | Defines requirements, user stories, and acceptance criteria |
| [QA Engineer](/reference/personas/process/qa-engineer) | `qa-engineer.md` | Writes and runs tests, validates quality during sprints |
| [Release Manager](/reference/personas/process/release-manager) | `release-manager.md` | Manages release readiness and deployment |
| [Retro Analyst](/reference/personas/process/retro-analyst) | `retro-analyst.md` | Analyzes sprint patterns for retrospectives |
| [Scrum Master](/reference/personas/process/scrum-master) | `scrum-master.md` | Manages story creation and epic sharding during solve |
| [Threat Modeler](/reference/personas/process/threat-modeler) | `threat-modeler.md` | Identifies threats and designs security mitigations |
| [Triage Lead](/reference/personas/process/triage-lead) | `triage-lead.md` | Triages bugs and prioritizes investigation during debug |
| [UX Designer](/reference/personas/process/ux-designer) | `ux-designer.md` | Designs user experiences, flows, and interface specifications |
| [Vuln Scanner](/reference/personas/process/vuln-scanner) | `vuln-scanner.md` | Scans for security vulnerabilities |
| [Workspace Orchestrator](/reference/personas/process/workspace-orchestrator) | `workspace-orchestrator.md` | Coordinates cross-repo features in workspace mode |

## Technical Personas

Technical personas add specialized expertise. They are optional and combined with a process persona during composition.

| Persona | File | Description |
|---------|------|-------------|
| [AI/ML](/reference/personas/technical/ai-ml) | `ai-ml.md` | Machine learning and AI system expertise |
| [API Design](/reference/personas/technical/api-design) | `api-design.md` | REST/GraphQL API design patterns |
| [Backend](/reference/personas/technical/backend) | `backend.md` | Server-side architecture and implementation |
| [Database](/reference/personas/technical/database) | `database.md` | Database design, optimization, and migrations |
| [Frontend](/reference/personas/technical/frontend) | `frontend.md` | Client-side architecture and UI implementation |
| [Infrastructure](/reference/personas/technical/infrastructure) | `infrastructure.md` | Cloud, CI/CD, and deployment infrastructure |
| [Security](/reference/personas/technical/security) | `security.md` | Application security, authentication, and authorization |

## Cognitive Personas

Cognitive personas shape how an agent approaches problems. They are optional and influence reasoning style.

| Persona | File | Description |
|---------|------|-------------|
| [Devil's Advocate](/reference/personas/cognitive/devils-advocate) | `devils-advocate.md` | Challenges assumptions and finds weaknesses |
| [Mentor Explainer](/reference/personas/cognitive/mentor-explainer) | `mentor-explainer.md` | Explains decisions clearly and teaches patterns |
| [Performance Focused](/reference/personas/cognitive/performance-focused) | `performance-focused.md` | Prioritizes runtime performance and efficiency |
| [Security First](/reference/personas/cognitive/security-first) | `security-first.md` | Prioritizes security in every decision |
| [Systems Thinker](/reference/personas/cognitive/systems-thinker) | `systems-thinker.md` | Considers system-wide impacts and interactions |
| [User Empathetic](/reference/personas/cognitive/user-empathetic) | `user-empathetic.md` | Prioritizes user experience and accessibility |

## Domain Personas

Domain personas are provided by domain packs, not the core framework. They inject industry-specific knowledge into agents. See [Domain Packs](/guide/domain-packs) for details on creating and using domain personas.

## Composition

Personas are composed using `/sniper-compose` or automatically during phase commands. The composition merges all specified layers into a single spawn prompt using the spawn prompt template.

Example team YAML composition:

```yaml
compose:
  process: architect
  technical: backend
  cognitive: systems-thinker
  domain: telephony          # From a domain pack
```

This produces a single agent that thinks like a systems-oriented backend architect with telephony domain knowledge.

## Related

- [Personas Guide](/guide/personas) -- how persona composition works in detail
- [Teams](/guide/teams) -- how personas are assigned to team members
- [Domain Packs](/guide/domain-packs) -- how domain packs add custom personas
