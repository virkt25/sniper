# Performance Profile: {title}

> **Audit ID:** PERF-{NNN}
> **Status:** Analyzing
> **Date:** {date}
> **Author:** Performance Profiler

## Performance Context
<!-- sniper:managed:context:start -->
<!-- What was investigated and why -->
<!-- sniper:managed:context:end -->

## Critical Path Analysis
<!-- sniper:managed:critical-paths:start -->
<!-- The most performance-sensitive paths in the application -->

### Path: {name}
- **Type:** Request handling / Data pipeline / Background job
- **Flow:** {entry} → {step 1} → {step 2} → {response}
- **I/O Operations:** {count} database calls, {count} external service calls
- **Estimated Latency Contribution:** {description}

<!-- sniper:managed:critical-paths:end -->

## Bottleneck Inventory
<!-- sniper:managed:bottlenecks:start -->

### Bottleneck 1: {title}
- **Location:** `path/to/file.ts:42`
- **Category:** N+1 query / Missing index / Synchronous I/O / Unbounded loop / Missing cache / Excessive serialization / Memory leak pattern / Large payload
- **Evidence:** {the code pattern that causes the bottleneck}
- **Impact:** Critical / High / Medium / Low
- **Complexity:** S / M / L
- **Details:** {explanation of why this is a bottleneck}

<!-- sniper:managed:bottlenecks:end -->

## Resource Usage Patterns
<!-- sniper:managed:resource-patterns:start -->

| Resource | Observation | Concern Level |
|----------|------------|---------------|
| Memory allocation | | Low / Medium / High |
| Connection pools | | Low / Medium / High |
| Compute operations | | Low / Medium / High |

<!-- sniper:managed:resource-patterns:end -->

## Existing Optimizations
<!-- sniper:managed:existing-optimizations:start -->
<!-- Caching, indexing, and optimization patterns already in place -->

- {Optimization — e.g., "Redis cache on product catalog with 5-minute TTL"}

<!-- sniper:managed:existing-optimizations:end -->

## Benchmark Coverage
<!-- sniper:managed:benchmark-coverage:start -->

| Critical Path | Has Benchmark? | Benchmark File |
|--------------|---------------|----------------|
| | Yes / No | |

<!-- sniper:managed:benchmark-coverage:end -->
