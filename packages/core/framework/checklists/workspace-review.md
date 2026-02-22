# Workspace Feature Review Checklist

Gate mode: **strict** (cross-repo features require approval before implementation)

## Workspace Feature Brief
- [ ] All affected repositories are identified with clear justification
- [ ] Repositories not affected are explicitly excluded with reasoning
- [ ] New interfaces are documented with type (REST/Type/Event) and participating repos
- [ ] Modified interfaces reference existing contract versions
- [ ] Wave ordering respects the dependency graph — no repo sprints before its dependencies
- [ ] Repos in the same dependency tier are grouped for parallel execution
- [ ] Risks and considerations are identified for cross-repo coordination

## Interface Contracts
- [ ] Every new cross-repo interface has a formal contract
- [ ] Every contract has full request/response schemas for all endpoints
- [ ] Error responses are defined, not just success cases
- [ ] Shared types specify exactly one owning repository
- [ ] Event contracts specify producer and consumer(s) with payload schemas
- [ ] Contract versions follow semver (breaking changes = major bump)
- [ ] Contracts are self-contained — implementable without reading other repo code

## Cross-Repo Implementation Plan
- [ ] Per-repo work breakdown covers all affected repositories
- [ ] Each repo's stories reference specific contract items
- [ ] Sprint wave ordering matches the dependency ordering in the brief
- [ ] Integration validation criteria are defined for each wave boundary
- [ ] Rollback plan exists for contract validation failures

## Overall
- [ ] No circular dependencies in the wave ordering
- [ ] Workspace memory conventions are consistent across repos
- [ ] All contract files are valid YAML
- [ ] Feature numbering follows WKSP-XXXX pattern
