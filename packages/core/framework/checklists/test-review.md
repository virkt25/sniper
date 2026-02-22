# Test & Coverage Review Checklist

Use this checklist to review artifacts produced during a test audit lifecycle.

## Coverage Report (`docs/audits/TST-{NNN}/coverage-report.md`)

- [ ] **Coverage data sourced:** Coverage numbers come from actual test runner output, not estimates
- [ ] **Critical gaps identified:** Uncovered code paths in high-risk areas (auth, payments, data handling) are flagged
- [ ] **Risk-based ranking:** Gaps are ranked by production impact, not just by coverage percentage
- [ ] **Integration boundaries mapped:** Cross-module interaction points are checked against architecture components
- [ ] **Pattern analysis present:** Testing consistency (assertion styles, mocks, naming) is assessed

## Flaky Report (`docs/audits/TST-{NNN}/flaky-report.md`)

- [ ] **Root causes identified:** Each flaky test has a specific root cause, not just "flaky"
- [ ] **Evidence provided:** Flakiness is demonstrated with evidence (dual-run results or code pattern analysis)
- [ ] **No retry-only fixes:** Suggested fixes address root causes, not just add retries
- [ ] **Systemic issues flagged:** Patterns causing multiple flaky tests are identified
- [ ] **Quick wins separated:** Low-effort fixes are clearly distinguished from larger refactors

## Stories (`docs/audits/TST-{NNN}/stories/`)

- [ ] **Priority order:** Critical gap fixes and quick-win flake fixes come first
- [ ] **Scoped improvements:** Each story handles one logical test improvement
- [ ] **Follows conventions:** Suggested tests follow the project's existing test patterns
- [ ] **Actionable:** Each story has specific file:line references and concrete test approaches

## Overall

- [ ] **Consistency:** Coverage report and flaky report don't contradict each other
- [ ] **Completeness:** All critical gaps and systemic flake issues have corresponding stories
- [ ] **Practicality:** Recommendations are achievable (not "rewrite all tests from scratch")
