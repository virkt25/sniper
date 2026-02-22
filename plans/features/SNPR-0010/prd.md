# SNPR-0010: Audit: Performance (`/sniper-audit --target performance`)

> **Status:** Draft
> **Phase:** C — Quality & Depth
> **Dependencies:** SNPR-0006 (shares the `/sniper-audit` umbrella command)
> **Soft Dependencies:** SNPR-0003 (architecture doc helps identify performance-critical paths)

## Problem Statement

Performance issues are notoriously difficult to diagnose and fix:

1. **Guessing instead of measuring** — developers optimize what they *think* is slow instead of profiling to find the actual bottleneck. A developer spends a day optimizing a database query when the real bottleneck is a synchronous file read in the request path.
2. **No baseline benchmarks** — there's no established performance baseline, so regressions go unnoticed until users complain. Without benchmarks, "is this fast enough?" has no answer.
3. **Optimization without verification** — developers make changes they believe will improve performance but don't measure before and after. Sometimes "optimizations" make things worse.
4. **Scattered knowledge** — performance characteristics of different components (which queries are N+1, which endpoints are CPU-bound vs I/O-bound) are tribal knowledge, not documented.

SNIPER can bring structured performance investigation — profile first, optimize based on data, verify with benchmarks.

## Solution Overview

`/sniper-audit --target performance` spawns a performance team that investigates and optimizes performance:

```
/sniper-audit --target performance                                  # full performance audit
/sniper-audit --target performance --scope "src/api/"               # scope to specific areas
/sniper-audit --target performance "Checkout API is slow"           # investigate specific issue
/sniper-audit --target performance --focus profile                  # profiling only
/sniper-audit --target performance --focus benchmarks               # benchmark creation only
/sniper-audit --target performance --resume PERF-002                # resume an audit
/sniper-audit --target performance --list                           # list performance audits
```

The team produces artifacts under `docs/audits/PERF-{NNN}/`:
- `profile-report.md` — performance profile with bottleneck analysis
- `optimization-plan.md` — optimization recommendations with expected impact
- `stories/` — optimization stories with benchmark requirements

**`--dry-run`:** Runs profiling only. Produces the profile report but does not proceed to optimization planning, story generation, or sprint.

## Detailed Requirements

### 1. Integration with `/sniper-audit` Umbrella

Add a `performance` section to `sniper-audit.md` (Section E). Update the target dispatch table to mark `performance` as `Available`.

### 2. Performance Audit Numbering

Performance audits use `PERF-{NNN}` format:

```yaml
state:
  perf_audit_counter: 1
  perf_audits:
    - id: "PERF-001"
      title: "Full performance audit"
      status: analyzing          # analyzing | planning | in-progress | complete
      created_at: "2026-02-22T..."
      completed_at: null
      scope_dirs: []
      focus: null                # null (full) | profile | benchmarks
      stories_total: 0
      stories_complete: 0
```

### 3. Performance Audit Directory Structure

```
docs/audits/PERF-001/
├── profile-report.md          # Performance profile (analyzing phase)
├── optimization-plan.md       # Optimization recommendations (planning phase)
└── stories/
    ├── S01-fix-n-plus-one-orders.md
    ├── S02-add-caching-product-list.md
    └── S03-benchmark-checkout-flow.md
```

### 4. Team Composition

**Phase 1: Profiling (Single Agent)**

| Teammate | Persona Layers | Output | Purpose |
|----------|---------------|--------|---------|
| `perf-profiler` | process: perf-profiler, technical: backend, cognitive: systems-thinker | `profile-report.md` | Identify bottlenecks through code analysis |

**Phase 2: Optimization Planning (Single Agent — Lead)**

The lead reads the profile report and produces an optimization plan with prioritized recommendations.

**Phase 3: Execution (Parallel Team — reuses sprint infrastructure)**

Optimization stories (including benchmark stories) are executed via the standard sprint mechanism.

**`--focus` flag:** When `--focus profile` is passed, only Phase 1 runs (profiling report, no stories). When `--focus benchmarks`, the profiler skips bottleneck analysis and instead focuses on identifying critical paths that need benchmark coverage; stories generated are benchmark-only stories.

**Note on team size:** Performance auditing is more sequential than parallel — the optimization plan depends heavily on the profiling results. A single profiler agent (rather than a team) keeps the analysis coherent. The parallelism comes in Phase 3 (sprint) when multiple optimization stories can be worked on simultaneously.

### 5. Performance Profiler

**Agent reads:**
- The performance concern (user description, or "general audit" if none provided)
- `docs/architecture.md` (if exists) — to identify performance-critical paths
- Source code in the scoped directories
- Database schema and query files (if identifiable)
- Route/endpoint definitions
- Any existing benchmark files

**Agent produces: `docs/audits/PERF-{NNN}/profile-report.md`**

Content:
- **Performance Context** — what was investigated and why (user-reported issue or general audit)
- **Critical Path Analysis** — the most performance-sensitive paths in the application, identified by:
  - Request handling chains (middleware → handler → DB → response)
  - Data processing pipelines
  - Background job execution paths
- **Bottleneck Inventory** — each identified bottleneck with:
  - **Location:** file:line or file:function
  - **Category:** N+1 query, missing index, synchronous I/O, unbounded loop, missing cache, excessive serialization, memory leak pattern, large payload
  - **Evidence:** the code pattern that causes the bottleneck
  - **Impact:** estimated severity (critical/high/medium/low) based on how frequently the path is hit and how much latency it adds
  - **Complexity:** effort to fix (S/M/L)
- **Resource Usage Patterns** — observations about memory allocation patterns, connection pool usage, and compute-intensive operations
- **Existing Optimizations** — caching, indexing, and optimization patterns already in place (acknowledges what's done well)
- **Benchmark Coverage** — which critical paths have benchmarks and which don't

**Profiling approach:** This is static code analysis, not runtime profiling. The agent:
1. Identifies all request handling paths and traces their execution
2. Searches for N+1 query patterns (loops containing database calls)
3. Identifies missing database indexes by cross-referencing queries with schema
4. Finds synchronous I/O in async contexts
5. Detects unbounded data processing (fetching all records, no pagination)
6. Checks for missing caching on frequently-accessed, rarely-changed data
7. Identifies large object serialization/deserialization
8. If a specific performance concern is provided, traces that path in detail

### 6. Optimization Plan

**Agent (Lead) reads:**
- `docs/audits/PERF-{NNN}/profile-report.md`
- `docs/architecture.md` (if exists)

**Agent produces: `docs/audits/PERF-{NNN}/optimization-plan.md`**

Content:
- **Priority Matrix** — bottlenecks ranked by impact / effort ratio
- **Optimization Recommendations** — for each bottleneck:
  - What to change
  - Expected improvement (qualitative: "reduces O(n) DB calls to O(1)" or "eliminates synchronous file read from hot path")
  - Implementation approach
  - Risks and trade-offs (caching adds complexity, denormalization risks inconsistency)
- **Benchmark Requirements** — what benchmarks should be written to verify each optimization
- **Quick Wins** — optimizations that are low-effort with high impact
- **Monitoring Recommendations** — what metrics to track to detect future regressions

### 7. Story Generation

After the optimization plan is approved, the lead generates stories:

1. Read the optimization plan
2. Generate 3-12 stories under `docs/audits/PERF-{NNN}/stories/`
3. Each optimization gets a story, plus a companion benchmark story if needed
4. Benchmark stories are paired with their optimization: `S01-fix-n-plus-one.md`, `S02-benchmark-order-queries.md`
5. Quick wins come first, then higher-effort optimizations
6. Name stories: `S01-{slug}.md`, `S02-{slug}.md`, etc.

### 8. Sprint Integration

Optimization stories reuse the standard sprint infrastructure:

1. **Story source:** Read stories from `docs/audits/PERF-{NNN}/stories/`
2. **State tracking:** Does NOT increment `state.current_sprint`. Updates `state.perf_audits[].stories_complete`.
3. **Team naming:** Team is named `sniper-perf-sprint-PERF-{NNN}`.
4. **Context:** Include profile-report.md and optimization-plan.md in spawn prompts.
5. **On completion:** Update performance audit status to `complete`.

### 9. Orchestration Flow

**Note:** Unlike SNPR-0008 (tests) and SNPR-0009 (security) which combine analysis and planning into a single team phase, performance audits have an explicit optimization planning step between profiling and story generation. This is because performance work benefits from separating "what is slow" (profiling) from "how to fix it" (optimization planning), giving the user an additional approval checkpoint to steer optimization priorities. This results in 10 steps instead of 8.

```
Step 1: Assign performance audit ID (PERF-{NNN})
Step 2: Create audit directory
Step 3: Run profiler (single agent → profile-report.md)
Step 4: Present profile → "Review performance profile. Continue to optimization planning? (yes/edit/cancel)"
Step 5: Produce optimization plan (lead → optimization-plan.md)
Step 6: Present plan → "Review optimization plan. Generate stories? (yes/edit/cancel)"
Step 7: Generate stories (lead → stories/)
Step 8: Present stories → "Review stories. Start optimization sprint? (yes/edit/cancel)"
Step 9: Run sprint (standard sprint infrastructure)
Step 10: Update audit status to complete
```

### 10. New Persona File

**`personas/process/perf-profiler.md`**
Role: Performance analyst. Identify bottlenecks through systematic code analysis — trace request paths, find N+1 queries, detect synchronous I/O in async contexts, and spot missing caching opportunities. Think like a performance engineer who profiles before optimizing. The fastest code is the code that doesn't run; the best optimization is the one backed by data.

### 11. New Templates

**`templates/performance-profile.md`** — Performance profile with critical path analysis, bottleneck inventory (location, category, evidence, impact, complexity), resource patterns, existing optimizations, and benchmark coverage.

**`templates/optimization-plan.md`** — Optimization plan with priority matrix, detailed recommendations (approach, expected improvement, risks), benchmark requirements, quick wins, and monitoring recommendations.

### 12. `/sniper-status` Integration

Status should show performance audits:

```
Performance Audits:
  PERF-001  Full performance audit   in-progress (2/6 stories done)
  PERF-002  Checkout API latency     analyzing

Completed Performance Audits:
  PERF-003  Dashboard load time      completed 2026-02-18 (3 stories)
```

### 13. New Checklist

**`checklists/perf-review.md`** — Verify:
- Profile identifies actual bottlenecks (not premature optimization guesses)
- Bottleneck evidence includes specific code locations
- Optimization recommendations include expected improvement
- Each optimization has a corresponding benchmark story
- Quick wins are correctly identified (low effort, high impact)
- Trade-offs are documented (caching complexity, consistency risks)

## Acceptance Criteria

1. **Given** `/sniper-audit --target performance`, **When** the command runs, **Then** the profiler agent produces a profile report with bottleneck inventory.

2. **Given** code with an N+1 query in a loop, **When** the profiler runs, **Then** it identifies the N+1 pattern with file:line and suggests eager loading or query batching.

3. **Given** a specific performance concern like "Checkout API is slow", **When** the audit runs with that description, **Then** the profiler focuses its analysis on the checkout code path.

4. **Given** `--focus profile`, **When** the audit runs, **Then** only the profiling report is produced (no stories generated).

5. **Given** an approved optimization plan, **When** stories are generated, **Then** each optimization story is paired with a benchmark story.

6. **Given** `/sniper-audit --target performance --list`, **When** performance audits exist, **Then** all audits are listed with status and progress.

## Implementation Scope

### In Scope
- `/sniper-audit --target performance` command logic (Section E in sniper-audit.md)
- Performance audit numbering (PERF-{NNN}) and directory creation
- 1 new persona file (perf-profiler)
- 2 new templates (performance-profile, optimization-plan)
- Performance review checklist
- Performance team YAML
- Story generation for optimizations
- Sprint execution for optimizations
- Config state tracking for performance audits
- `--focus`, `--list`, `--resume`, `--scope` flags

### Out of Scope
- Runtime profiling (flame graphs, heap snapshots, APM integration)
- Load testing or stress testing
- Infrastructure performance (CDN, DNS, network latency)
- Database query plan analysis (EXPLAIN output parsing)
- Frontend performance (Core Web Vitals, Lighthouse)
- Automated benchmark suite execution and comparison

## Files Changed

| File | Change |
|------|--------|
| `packages/core/framework/commands/sniper-audit.md` | UPDATE — add `performance` target section (Section E) |
| `packages/core/framework/teams/perf.yaml` | NEW — performance audit team composition |
| `packages/core/framework/personas/process/perf-profiler.md` | NEW — persona |
| `packages/core/framework/templates/performance-profile.md` | NEW — template |
| `packages/core/framework/templates/optimization-plan.md` | NEW — template |
| `packages/core/framework/checklists/perf-review.md` | NEW — checklist |
| `packages/core/framework/commands/sniper-status.md` | Update to show performance audits |
| `packages/core/framework/config.template.yaml` | Add `perf_audit_counter` and `perf_audits` array |
