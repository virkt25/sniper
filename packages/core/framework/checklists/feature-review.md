# Feature Review Checklist

Use this checklist to review artifacts produced during a feature lifecycle.

## Feature Brief (`docs/features/SNPR-{XXXX}/brief.md`)

- [ ] **Feature description:** Clearly describes what the feature does in user-facing terms
- [ ] **Motivation:** Explains why the feature is needed and what problem it solves
- [ ] **Affected areas:** Lists components and files that will be impacted
- [ ] **Scope:** In-scope and out-of-scope are clearly delineated
- [ ] **Risks:** Known risks and open questions are documented

## Feature Spec (`docs/features/SNPR-{XXXX}/spec.md`)

- [ ] **Requirements completeness:** All functional requirements have acceptance criteria
- [ ] **User stories:** Each story follows the "As a... I want to... So that..." format
- [ ] **API changes:** New or modified endpoints are fully specified
- [ ] **Data model changes:** Schema changes are documented with field types and constraints
- [ ] **Brief alignment:** Spec is consistent with the feature brief (no scope creep)

## Architecture Delta (`docs/features/SNPR-{XXXX}/arch-delta.md`)

- [ ] **Base version:** References the correct version of `docs/architecture.md`
- [ ] **New components:** Each new component has responsibility, interfaces, and dependencies
- [ ] **Modified components:** Changes to existing components note current vs new behavior
- [ ] **Pattern consistency:** New code follows patterns from `docs/conventions.md`
- [ ] **No over-engineering:** Changes are proportional to the feature scope
- [ ] **Spec alignment:** Architecture delta addresses all requirements from the spec

## Stories (`docs/features/SNPR-{XXXX}/stories/`)

- [ ] **Coverage:** Stories cover all functional requirements from the spec
- [ ] **Sizing:** Each story is small enough for a single sprint (S/M complexity preferred)
- [ ] **Dependencies:** Story dependencies are correctly ordered
- [ ] **Acceptance criteria:** Each story has clear, testable acceptance criteria
- [ ] **No gaps:** No requirements from the spec are missing from stories

## Overall

- [ ] **Consistency:** Brief, spec, arch-delta, and stories don't contradict each other
- [ ] **Proportionality:** Effort matches the feature scope (not over-planned or under-planned)
- [ ] **Actionable:** An agent reading these artifacts could implement the feature without ambiguity
