---
title: Glossary
description: Definitions of SNIPER terminology — protocols, phases, gates, agents, and more
---

# Glossary

Definitions of all SNIPER-specific terms.

## A

### Amendment Mode
When a phase is re-run and artifacts already exist on disk, agents enter amendment mode. Instead of creating artifacts from scratch, they update existing content -- adding new information, updating changed sections, and preserving content outside managed sections. Version numbers are incremented and status is reset to "Draft."

### Artifact
A document or file produced by a phase. Artifacts persist in the `docs/` directory and include briefs, PRDs, architecture docs, UX specs, security docs, epics, stories, and conventions. Each artifact has a status (null, draft, approved) and version number tracked in `state.artifacts` in the config file.

### Auto Gate
A review gate mode that performs no evaluation. The phase completes and the lifecycle advances immediately. Not recommended for architecture or code phases.

## C

### Checklist
A markdown file containing quality criteria for evaluating phase artifacts. Each item is evaluated as PASS, WARN, or FAIL during a review gate. Checklists are stored in `.sniper/checklists/` and can be extended by domain packs.

### Cognitive Layer
One of the four persona layers. Shapes how an agent thinks and what it prioritizes. Examples: devils-advocate, security-first, performance-focused.

### Compose
The process of merging persona layers into a spawn prompt. `/sniper-flow` reads persona files, fills a template, and produces a complete agent instruction. Composition happens automatically during protocol execution.

### Convention
A rule tracked in the memory system that agents must follow. Conventions have enforcement levels (spawn_prompt, review_gate, or both), applicability (which roles), and status (confirmed or candidate). Example: "All API routes use Zod validation middleware."

### Coordination
Rules in a team YAML that define which teammates need to align during execution. The team lead facilitates coordination by prompting agents to share relevant work. Example: architect and product-manager coordinate on architecture decisions before story creation.

## D

### Delegate Mode
Claude Code's mode (activated via Shift+Tab) where the team lead coordinates agents without producing artifacts directly. In delegate mode, you manage task dependencies, facilitate coordination, and enforce quality -- but you do not write code or documents yourself.

### Domain Layer
One of the four persona layers. Injects industry-specific knowledge from a domain pack. Loaded from the active pack's knowledge files (e.g., telephony protocols, compliance regulations).

### Domain Pack
An npm package containing industry-specific knowledge, personas, checklists, and templates. Packs are registered in config.yaml and their content is injected into agent prompts during phase execution.

## E

### Epic
A large unit of work produced during the plan phase. Each epic contains 3-8 stories and has clear scope boundaries, embedded architecture context, dependencies on other epics, and acceptance criteria. Epics are stored in `docs/epics/`.

## F

### Feature Lifecycle
A scoped mini-lifecycle for adding a single feature to an existing project. Runs through plan, implement, and review phases. Invoked with `/sniper-flow --protocol feature`.

### File Ownership
Directory-level boundaries that restrict which files each agent can modify. Defined in the `ownership` section of config.yaml and injected into spawn prompts. Prevents teammates from stepping on each other's work during implement phases.

### Flexible Gate
A review gate mode that auto-advances if no critical failures. Warnings are noted for async review. If failures exist, you are asked whether to fix, override, or stop.

## I

### Ingest
A protocol that reverse-engineers SNIPER artifacts from an existing codebase. Runs scan, document, and extract phases to produce project documentation and conventions. Invoked with `/sniper-flow --protocol ingest`.

## L

### Layer
A component of the persona composition system. There are four layers: process (role), technical (expertise), cognitive (thinking style), and domain (industry knowledge). Layers are stored as markdown files and merged during composition.

## M

### Memory
The system that tracks learned conventions, anti-patterns, and decisions across executions. Memory content is filtered by role and injected into spawn prompts, allowing agents to improve over time. Managed automatically by the framework and stored in `.sniper/memory/`.

### Merge-Back
The final phase of a feature lifecycle where the architecture delta is merged into the main `docs/architecture.md`. Includes conflict detection if the architecture doc was modified since the feature started.

## O

### Ownership Key
A named group of directory patterns in the `ownership` section of config.yaml (e.g., `backend`, `frontend`, `infrastructure`). Implement phase agents reference these keys to determine their file boundaries.

## P

### Phase
A distinct stage in a protocol with a specific purpose, agents, outputs, and review gate. Phases vary by protocol -- for example, the full protocol runs discover, plan, implement, and review.

### Phase Log
In v3, phase execution is tracked through checkpoint files in `.sniper/checkpoints/` and the live-status file at `.sniper/live-status.yaml`. Each checkpoint records the phase context, start time, completion time, and approval status.

### Plan Approval
A flag on tasks that require the agent to describe their approach and wait for the team lead's approval before executing. Used for high-impact tasks like architecture design.

### Process Layer
One of the four persona layers. Defines the agent's role in the project lifecycle (e.g., analyst, architect, developer, qa-engineer). The only required layer in composition.

## R

### Retro / Retrospective
A post-protocol analysis that identifies conventions, anti-patterns, and estimation patterns. When `auto_retro` is enabled, retrospectives run automatically after review gates pass. Results are stored in `.sniper/memory/retros/`.

### Review Gate
A quality checkpoint between phases. Evaluates artifacts against a checklist and enforces a gate policy (`human_approval: true` or `human_approval: false`). Run with `/sniper-review`.

## S

### Spawn Prompt
The fully assembled instruction given to an agent when created. Contains merged persona layers, project memory, file ownership boundaries, task instructions, and coordination rules. Spawn prompts are composed at runtime by the lead-orchestrator -- they are not stored as static files.

### Implement Phase
The phase where development agents (fullstack-dev, qa-engineer) write code and tests. Run via `/sniper-flow`, which advances through the protocol's phases including implementation. Agents must get their plan approved before coding when `plan_approval: true` is set.

### Story
A self-contained implementation unit produced during the plan phase. Each story embeds all context from PRD, architecture, and UX spec needed for implementation. Stories have Given/When/Then acceptance criteria, file ownership, complexity estimates, and test requirements. Stored in `docs/stories/`.

### Strict Gate
A review gate mode that requires explicit human approval. Cannot be skipped. Failures block advancement entirely.

## T

### Team
A YAML definition specifying which agents to spawn for a phase, their persona composition, task assignments, coordination rules, and review gate configuration. Stored in `.sniper/teams/`.

### Team Lead
The coordinating role (you, via Claude Code) during team execution. The lead spawns agents, manages dependencies, facilitates coordination, and enforces quality. The lead does not produce artifacts.

### Technical Layer
One of the four persona layers. Adds domain-specific technical expertise (e.g., backend, frontend, security, ai-ml). Optional in composition.

### Token Budget
The maximum number of tokens allocated for the memory layer in spawn prompts. Default: 2000. When memory exceeds the budget, entries are prioritized by severity.

## W

### Wave
In workspace mode, a group of repositories that can implement in parallel. Wave assignment is based on the dependency graph -- repos with no dependencies are in Wave 1, repos depending on Wave 1 are in Wave 2, and so on.

### Workspace
A multi-repo orchestration environment. Contains a `workspace.yaml` manifest, shared memory, interface contracts, and cross-repo feature plans. Managed with `sniper workspace` CLI commands.
