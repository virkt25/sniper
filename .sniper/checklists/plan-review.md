# Planning Review Checklist

Gate mode: **STRICT** (human MUST approve before Phase 3)

## PRD (`docs/prd.md`)
- [ ] Problem statement includes evidence (not just assertions)
- [ ] User stories follow "As a [persona], I want, so that" format
- [ ] P0 requirements are minimal — only what's critical for v1
- [ ] Every requirement has testable acceptance criteria
- [ ] Non-functional requirements have specific measurable targets
- [ ] Success metrics have numbers (not vague "improve X")
- [ ] Out-of-scope explicitly names features users might expect
- [ ] No duplicate requirements

## Architecture (`docs/architecture.md`)
- [ ] Every technology choice includes: what, why, alternatives considered
- [ ] Component diagram shows clear boundaries and interfaces
- [ ] Data models include field types, constraints, indexes, relationships
- [ ] API contracts are specific enough for independent frontend/backend implementation
- [ ] Infrastructure specifies sizing, scaling triggers, cost estimates
- [ ] Cross-cutting concerns addressed (auth, logging, errors, config)
- [ ] Non-functional targets have implementation strategies
- [ ] Security architecture aligns with `docs/security.md`

## UX Specification (`docs/ux-spec.md`)
- [ ] Information architecture maps all pages/views
- [ ] Screen inventory covers all user-facing screens
- [ ] User flows include error paths, not just happy paths
- [ ] Component specs include all states (default, hover, active, disabled, loading, error)
- [ ] Responsive breakpoints specify actual layout changes
- [ ] Accessibility requirements name specific WCAG criteria
- [ ] UX flows align with PRD user stories

## Security Requirements (`docs/security.md`)
- [ ] Authentication model specified (OAuth, JWT, session, etc.)
- [ ] Authorization model specified (RBAC, ABAC, etc.)
- [ ] Data encryption strategy covers at-rest and in-transit
- [ ] Compliance requirements name specific regulations
- [ ] Threat model identifies top attack vectors
- [ ] Security testing requirements are defined

## Cross-Document Consistency
- [ ] Architecture API contracts match UX component data needs
- [ ] Security requirements are implementable within architecture choices
- [ ] PRD requirements are fully coverable by architecture design
- [ ] No orphaned requirements (in PRD but not in architecture)

## Approval
**Reviewer:** _______________
**Date:** _______________
**Decision:** APPROVED / NEEDS REVISION
**Feedback:**
