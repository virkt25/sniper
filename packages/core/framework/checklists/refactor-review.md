# Refactor Review Checklist

Use this checklist to review artifacts produced during a refactoring lifecycle.

## Impact Analysis (`docs/refactors/REF-{NNN}/scope.md`)

- [ ] **Complete inventory:** All instances of the pattern being changed are counted
- [ ] **Files listed:** Every affected file is listed, not estimated
- [ ] **Risk assessment:** Risks are specific, not generic boilerplate
- [ ] **Compatibility concerns:** API consumers and downstream dependencies are identified
- [ ] **Effort estimate:** Effort is justified by actual file/instance counts

## Migration Plan (`docs/refactors/REF-{NNN}/plan.md`)

- [ ] **Strategy justified:** Migration strategy choice (big-bang/incremental/strangler) has clear rationale
- [ ] **Order makes sense:** Steps follow dependency order (e.g., shared code before consuming code)
- [ ] **Coexistence plan:** Describes how old and new patterns coexist during migration
- [ ] **Verification at each step:** Each step has specific tests or checks
- [ ] **Rollback plan:** Each step can be reversed independently
- [ ] **No data loss risk:** Database migrations are reversible or have a safety net

## Stories (`docs/refactors/REF-{NNN}/stories/`)

- [ ] **Coverage:** Stories cover all instances from the pattern inventory
- [ ] **Order matches plan:** Story dependencies follow the migration plan order
- [ ] **Self-contained:** Each story can be implemented and verified independently
- [ ] **Tests included:** Each story includes test updates for the migrated code

## Overall

- [ ] **Consistency:** Scope, plan, and stories tell a coherent story
- [ ] **Completeness:** No instances of the old pattern will remain after all stories complete
- [ ] **Safety:** At no point during the migration will the system be in a broken state
