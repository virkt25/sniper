# Optimization Plan: {title}

> **Audit ID:** PERF-{NNN}
> **Status:** Planning
> **Date:** {date}
> **Author:** Lead

## Priority Matrix
<!-- sniper:managed:priority-matrix:start -->
<!-- Bottlenecks ranked by impact / effort ratio -->

| Rank | Bottleneck | Impact | Effort | Ratio | Category |
|------|-----------|--------|--------|-------|----------|
| 1 | | High/Med/Low | S/M/L | | Quick win / Standard / Major |

<!-- sniper:managed:priority-matrix:end -->

## Optimization Recommendations
<!-- sniper:managed:recommendations:start -->

### Optimization 1: {title}
- **Bottleneck:** {reference to bottleneck from profile report}
- **What to change:** {specific change description}
- **Expected improvement:** {e.g., "reduces O(n) DB calls to O(1)"}
- **Implementation approach:** {how to implement}
- **Risks and trade-offs:** {e.g., "caching adds complexity, requires cache invalidation strategy"}
- **Benchmark:** {how to verify the improvement}

<!-- sniper:managed:recommendations:end -->

## Benchmark Requirements
<!-- sniper:managed:benchmarks:start -->
<!-- What benchmarks should be written to verify each optimization -->

| Optimization | Benchmark Description | Metrics to Capture |
|-------------|----------------------|-------------------|
| | | Latency / Throughput / Memory / DB calls |

<!-- sniper:managed:benchmarks:end -->

## Quick Wins
<!-- sniper:managed:quick-wins:start -->
<!-- Low-effort, high-impact optimizations -->

| Optimization | Effort | Expected Impact |
|-------------|--------|-----------------|
| | S | |

<!-- sniper:managed:quick-wins:end -->

## Monitoring Recommendations
<!-- sniper:managed:monitoring:start -->
<!-- Metrics to track for regression prevention -->

| Metric | Current Baseline | Target | Alert Threshold |
|--------|-----------------|--------|----------------|
| | | | |

<!-- sniper:managed:monitoring:end -->
