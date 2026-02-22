# Flaky Test Report: {title}

> **Audit ID:** TST-{NNN}
> **Status:** Analyzing
> **Date:** {date}
> **Author:** Flake Hunter

## Flake Summary
<!-- sniper:managed:flake-summary:start -->

| Root Cause Category | Count |
|-------------------|-------|
| Timing | |
| Shared state | |
| Network dependency | |
| Race condition | |
| Non-deterministic data | |
| Environment coupling | |
| **Total** | |

<!-- sniper:managed:flake-summary:end -->

## Flaky Test Inventory
<!-- sniper:managed:flaky-tests:start -->

### {Test Name}
- **File:** `path/to/test.ts:42`
- **Root cause:** Timing / Shared state / Network / Race condition / Non-deterministic data / Environment
- **Evidence:** {how the flakiness was detected or reproduced}
- **Suggested fix:** {specific remediation approach}
- **Effort:** S / M / L

<!-- sniper:managed:flaky-tests:end -->

## Systemic Issues
<!-- sniper:managed:systemic-issues:start -->
<!-- Patterns that cause multiple flaky tests -->

### {Issue Title}
- **Affected tests:** {count} tests
- **Root cause:** {description of the systemic pattern}
- **Examples:** {list of affected test files}
- **Fix approach:** {how to fix the systemic issue}

<!-- sniper:managed:systemic-issues:end -->

## Quick Wins
<!-- sniper:managed:quick-wins:start -->
<!-- Flaky tests that can be fixed with minimal effort -->

| Test | Fix | Effort |
|------|-----|--------|
| | | S |

<!-- sniper:managed:quick-wins:end -->

## Prevention Recommendations
<!-- sniper:managed:prevention:start -->
<!-- Patterns and guardrails to prevent future flaky tests -->

1. {Recommendation}
2. {Recommendation}

<!-- sniper:managed:prevention:end -->
