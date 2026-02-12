# Story Review Checklist

Gate mode: **FLEXIBLE** (auto-advance, async review)

## Epic Structure (`docs/epics/*.md`)
- [ ] Epics number between 6-12 (enough granularity, not too fragmented)
- [ ] No overlap between epics — each requirement maps to exactly one epic
- [ ] Epic dependencies form a DAG (no circular dependencies)
- [ ] Each epic has clear scope boundaries (in/out)
- [ ] Architecture context is EMBEDDED in each epic, not just referenced
- [ ] Complexity estimates are realistic

## Story Quality (`docs/stories/*.md`)
- [ ] Each story is self-contained — a developer can implement from the story file alone
- [ ] PRD context is EMBEDDED (copied), not just referenced
- [ ] Architecture context is EMBEDDED (data models, API contracts, patterns)
- [ ] UX context is EMBEDDED for frontend stories
- [ ] Acceptance criteria use Given/When/Then format
- [ ] Every acceptance criterion is testable
- [ ] Test requirements are specified (unit, integration, e2e)
- [ ] File ownership is assigned (which directories the story touches)
- [ ] Dependencies on other stories are declared
- [ ] Complexity estimate (S/M/L/XL) is assigned
- [ ] No story is XL — if so, it should be split

## Coverage
- [ ] All P0 PRD requirements are covered by stories
- [ ] All P1 PRD requirements are covered by stories
- [ ] All architecture components have at least one implementing story
- [ ] Story dependency chains allow reasonable sprint planning
