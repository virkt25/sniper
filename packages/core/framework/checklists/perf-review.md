# Performance Audit Review Checklist

Use this checklist to review artifacts produced during a performance audit lifecycle.

## Profile Report (`docs/audits/PERF-{NNN}/profile-report.md`)

- [ ] **Actual bottlenecks:** Findings are based on code analysis, not premature optimization guesses
- [ ] **Specific locations:** Each bottleneck includes file:line or file:function references
- [ ] **Categorized:** Bottlenecks are categorized (N+1, missing index, sync I/O, etc.)
- [ ] **Impact assessed:** Severity based on path frequency and latency contribution
- [ ] **Critical paths traced:** Request handling chains are fully traced
- [ ] **Existing optimizations noted:** Current caching and indexing acknowledged

## Optimization Plan (`docs/audits/PERF-{NNN}/optimization-plan.md`)

- [ ] **Expected improvement stated:** Each recommendation includes specific improvement description
- [ ] **Trade-offs documented:** Caching complexity, consistency risks, etc. are noted
- [ ] **Quick wins identified:** Low-effort, high-impact optimizations separated
- [ ] **Benchmark requirements:** Each optimization has a corresponding benchmark requirement
- [ ] **Priority matrix sensible:** Impact/effort ratio drives the ordering

## Stories (`docs/audits/PERF-{NNN}/stories/`)

- [ ] **Paired with benchmarks:** Each optimization story has a companion benchmark story
- [ ] **Quick wins first:** Low-effort optimizations are prioritized
- [ ] **Self-contained:** Each story can be implemented and verified independently
- [ ] **Measurable:** Success criteria include specific performance metrics

## Overall

- [ ] **Data-driven:** No premature optimization — all changes backed by profiling evidence
- [ ] **Consistency:** Profile, plan, and stories tell a coherent story
- [ ] **Verification plan:** Clear strategy for measuring improvement after implementation
