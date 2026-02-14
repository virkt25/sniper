# Per-Story Code Review Checklist

Used by QA engineer and team lead to review individual story implementations.

## Functionality
- [ ] All acceptance criteria from the story are implemented
- [ ] Error cases are handled (not just the happy path)
- [ ] Edge cases considered (empty input, max values, concurrent access)

## Code Quality
- [ ] Code is readable — another developer can understand it without explanation
- [ ] No dead code, commented-out code, or TODO items left behind
- [ ] Functions are focused — each does one thing
- [ ] Naming is clear and consistent with codebase conventions
- [ ] No unnecessary complexity — simplest solution that works

## Testing
- [ ] Unit tests cover the public API of new modules
- [ ] Integration tests verify end-to-end behavior
- [ ] Tests are deterministic (no timing dependencies, no flakiness)
- [ ] Test names describe the behavior being tested

## Security
- [ ] User input is validated before processing
- [ ] SQL queries use parameterized statements
- [ ] No secrets in code or config
- [ ] Auth checks in place for protected endpoints

## Performance
- [ ] No N+1 query patterns
- [ ] Database queries are indexed appropriately
- [ ] Large datasets use pagination
- [ ] No blocking operations on the main thread
