# Sprint Review Checklist

Gate mode: **STRICT** (human MUST review code before merge)

## Code Quality
- [ ] All code passes linting (no warnings or errors)
- [ ] All code passes static type checking (language-appropriate strict mode)
- [ ] No type escape hatches introduced (e.g. `any` in TS, `Any` in Python, `interface{}` in Go)
- [ ] No hardcoded secrets, API keys, or credentials
- [ ] Error handling on all async operations
- [ ] Follows existing codebase patterns and conventions

## Testing
- [ ] All stories have corresponding tests
- [ ] Tests pass (0 failures)
- [ ] Test coverage meets project minimum threshold
- [ ] Integration tests cover API endpoints
- [ ] Edge cases and error paths are tested
- [ ] No flaky tests introduced

## Acceptance Criteria
- [ ] Every acceptance criterion from every sprint story is verified
- [ ] Deviations from acceptance criteria are documented and justified

## Architecture Compliance
- [ ] Code follows the architecture patterns from `docs/architecture.md`
- [ ] API contracts match the spec (endpoints, payloads, status codes)
- [ ] Data models match the schema design
- [ ] File ownership boundaries respected (no cross-boundary edits)

## Security
- [ ] No new security vulnerabilities introduced (OWASP Top 10)
- [ ] Input validation on all user-facing endpoints
- [ ] Authentication and authorization enforced where required
- [ ] Sensitive data encrypted and handled properly

## Approval
**Reviewer:** _______________
**Date:** _______________
**Decision:** APPROVED / NEEDS REVISION
**Feedback:**
