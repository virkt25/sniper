---
title: Checklists Reference
---

# Checklists Reference

Checklists define quality criteria that artifacts are evaluated against during review gates. Each checklist item is scored as PASS, WARN, or FAIL. Checklists are stored in `.sniper/checklists/` as markdown files.

## Available Checklists

### Phase Checklists

These checklists evaluate artifacts produced by lifecycle phases.

| Checklist | File | Used By | Description |
|-----------|------|---------|-------------|
| [Discover Review](/reference/checklists/discover-review) | `discover-review.md` | `/sniper-review` after discover | Evaluates brief, risks, and personas |
| [Plan Review](/reference/checklists/plan-review) | `plan-review.md` | `/sniper-review` after plan | Evaluates PRD, architecture, UX spec, security doc |
| [Story Review](/reference/checklists/story-review) | `story-review.md` | `/sniper-review` after solve | Evaluates epic and story quality |
| [Sprint Review](/reference/checklists/sprint-review) | `sprint-review.md` | `/sniper-review` after sprint | Evaluates code, tests, and implementation quality |
| [Doc Review](/reference/checklists/doc-review) | `doc-review.md` | `/sniper-review` after doc | Evaluates documentation completeness and accuracy |

### Extended Checklists

These checklists support specialized workflows.

| Checklist | File | Used By | Description |
|-----------|------|---------|-------------|
| [Feature Review](/reference/checklists/feature-review) | `feature-review.md` | Feature lifecycle | Evaluates scoped feature artifacts |
| [Ingest Review](/reference/checklists/ingest-review) | `ingest-review.md` | `/sniper-ingest` | Evaluates reverse-engineered artifacts |
| [Debug Review](/reference/checklists/debug-review) | `debug-review.md` | `/sniper-debug` | Evaluates investigation and fix quality |
| [Code Review](/reference/checklists/code-review) | `code-review.md` | `/sniper-audit review` | Evaluates code quality in PR reviews |
| [Refactor Review](/reference/checklists/refactor-review) | `refactor-review.md` | `/sniper-audit refactor` | Evaluates refactoring scope and safety |
| [Test Review](/reference/checklists/test-review) | `test-review.md` | `/sniper-audit tests` | Evaluates test coverage and quality |
| [Security Review](/reference/checklists/security-review) | `security-review.md` | `/sniper-audit security` | Evaluates security posture and vulnerabilities |
| [Perf Review](/reference/checklists/perf-review) | `perf-review.md` | `/sniper-audit performance` | Evaluates performance profiling and optimizations |
| [Memory Review](/reference/checklists/memory-review) | `memory-review.md` | Memory operations | Evaluates memory entry quality |
| [Workspace Review](/reference/checklists/workspace-review) | `workspace-review.md` | Workspace operations | Evaluates cross-repo contract compliance |

## Checklist Format

Each checklist is a markdown file with checkbox items organized by category:

```markdown
# Plan Review Checklist

## PRD Quality
- [ ] All user stories have Given/When/Then acceptance criteria
- [ ] Non-functional requirements are quantified (response times, uptime)
- [ ] Edge cases and error scenarios are documented

## Architecture Completeness
- [ ] System context diagram exists
- [ ] All external integrations are specified
- [ ] Data model covers all entities from PRD

## Cross-Document Consistency
- [ ] Architecture addresses all PRD requirements
- [ ] UX spec references match architecture API endpoints
```

## Evaluation Scoring

During a review gate, each checklist item receives a score:

| Score | Meaning | Impact |
|-------|---------|--------|
| **PASS** | Criterion is fully met | No action needed |
| **WARN** | Criterion is partially met or needs attention | Noted for review; does not block in flexible mode |
| **FAIL** | Criterion is not met | Blocks advancement in strict mode |

## Gate Modes

How checklist results affect phase advancement depends on the gate mode:

- **Strict** -- any FAIL blocks advancement; requires explicit human approval
- **Flexible** -- auto-advances if no FAIL items; warnings are noted for async review
- **Auto** -- no evaluation performed; phase advances immediately

## Domain Pack Checklists

Domain packs can provide additional checklists that are appended to phase review gates. Pack checklist items are evaluated alongside standard items. See [Domain Packs](/guide/domain-packs) for details.

## Related

- [Review Gates](/guide/review-gates) -- how checklists are used in the review process
- [Configuration](/guide/configuration) -- setting gate modes per phase
- [Teams](/reference/teams/) -- gate configuration in team YAML files
