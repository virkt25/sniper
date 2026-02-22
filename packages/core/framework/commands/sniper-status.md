# /sniper-status -- Show Lifecycle Status and Artifact State

You are executing the `/sniper-status` command. Your job is to read the current project state and display a comprehensive, formatted status report. This is a READ-ONLY command -- do NOT modify any files.

---

## Step 0: Pre-Flight -- Read Configuration

1. Read `.sniper/config.yaml`
2. If the file does not exist:
   ```
   ERROR: .sniper/config.yaml not found.
   SNIPER has not been initialized in this project.
   Run /sniper-init to set up the framework.
   ```
   Then STOP.
3. If the file exists but `project.name` is empty:
   ```
   WARNING: SNIPER config exists but project name is not set.
   The framework may be partially initialized. Run /sniper-init to complete setup.
   ```
   Continue anyway and show what is available.

---

## Step 1: Read Project Identity

Extract from config.yaml:
- `project.name`
- `project.type`
- `project.description`
- `stack` (all fields)
- `domain_pack`

---

## Step 2: Read Lifecycle State

Extract from config.yaml:
- `state.phase_log` (array of phase entries with context, started_at, completed_at)
- `state.current_sprint`
- `state.artifacts` (status and version of each artifact)
- `state.features` (array of feature lifecycle entries, if any)
- `state.bugs` (array of bug tracking entries, if any)
- `state.refactors` (array of refactor tracking entries, if any)
- `state.reviews` (array of review entries, if any)
- `state.test_audits` (array of test audit entries, if any)
- `state.security_audits` (array of security audit entries, if any)
- `state.perf_audits` (array of performance audit entries, if any)

---

## Step 3: Check Artifact Files on Disk

For each artifact, check whether the actual file exists on disk and has content. Compare the file-on-disk status with the state recorded in config.yaml:

| Artifact      | Config Key       | Expected Path(s)                    |
|--------------|-----------------|-------------------------------------|
| Brief         | `brief`          | `docs/brief.md`                     |
| PRD           | `prd`            | `docs/prd.md`                       |
| Architecture  | `architecture`   | `docs/architecture.md`              |
| UX Spec       | `ux_spec`        | `docs/ux-spec.md`                   |
| Security      | `security`       | `docs/security.md`                  |
| Epics         | `epics`          | `docs/epics/*.md`                   |
| Stories       | `stories`        | `docs/stories/*.md`                 |
| Risks         | `risks`          | `docs/risks.md`                     |
| Personas      | `personas`       | `docs/personas.md`                  |
| Conventions   | `conventions`    | `docs/conventions.md`               |

For epics and stories, count the number of `.md` files in the directory.

Determine each artifact's effective status:
- `missing` -- file does not exist on disk
- `empty` -- file exists but has no substantive content (only template markers)
- `draft` -- file exists with content, config says draft or null
- `approved` -- config says approved
- `out of sync` -- config says one status but disk state contradicts it (e.g., config says approved but file is missing)

---

## Step 4: Read Sprint Details (if applicable)

If `state.current_phase` is `sprint` or if `state.current_sprint` > 0:

1. Check for story files in `docs/stories/`
2. For each story file, read its header to determine status:
   - Look for status markers in the story content (e.g., `Status: complete`, `Status: in-progress`, `Status: pending`)
   - If no status marker, assume `pending`
3. Count stories by status
4. Check for any stories assigned to the current sprint

---

## Step 5: Read Review Gate Configuration

Extract `review_gates` from config.yaml:
- `after_discover`
- `after_plan`
- `after_solve`
- `after_sprint`

---

## Step 6: Compute Progress Estimate

Based on the current state, estimate overall progress:

| State                                | Progress          |
|-------------------------------------|-------------------|
| No phase started                     | 0% -- Not started |
| discover phase active                | 5-15%             |
| discover complete, plan active       | 15-35%            |
| plan complete, solve active          | 35-45%            |
| solve complete, sprint active        | 45-90%            |
| All stories complete                 | 90-100%           |

For sprint phase, calculate more precisely:
- Count total stories
- Count completed stories
- Sprint progress = (completed / total) as a percentage of the 45-90% range

---

## Step 7: Display Status Report

Print the following formatted report. Use the actual values from the steps above.

```
============================================
  SNIPER Status Report
============================================

  Project:      {name}
  Type:         {type}
  Description:  {description}
  Domain Pack:  {domain_pack or "none"}

--------------------------------------------
  Lifecycle Phase
--------------------------------------------

  Current Phase:  {active phase from phase_log or "NOT STARTED"}
  Sprint:         {current_sprint or "N/A"}
  Progress:       {estimated_progress}

  Phase Log (most recent first):
  {For each entry in phase_log, most recent first:}
    {[x] if completed, [>] if active}  {phase}  ({context})  {started_at} - {completed_at or "in progress"}

  {If phase_log is empty:}
    No phases started yet.

  Standard Phase Progression:
    [ ] ingest    -- Ingest existing codebase (optional, for existing projects)
    [ ] discover  -- Discovery & Analysis
    [ ] plan      -- Planning & Architecture
    [ ] solve     -- Epic Sharding & Story Creation
    [ ] sprint    -- Implementation Sprint

  Use [x] for completed phases, [>] for the active phase, [ ] for not yet run.
  Note: Phases can be run multiple times. The phase log shows all executions.

--------------------------------------------
  Phase History (from phase_log)
--------------------------------------------

  {For each entry in phase_log:}
  Phase: {phase}  Context: {context}
    Started:     {started_at}
    Completed:   {completed_at or "in progress"}
    Approved by: {approved_by or "pending"}

  {If phase_log is empty:}
  No phases started yet.

--------------------------------------------
  Artifacts
--------------------------------------------

  | Artifact       | Status | Version | On Disk        | Path                     |
  |---------------|--------|---------|----------------|--------------------------|
  | Brief          | {s}    | v{n}    | {disk_status}  | docs/brief.md            |
  | Risks          | {s}    | v{n}    | {disk_status}  | docs/risks.md            |
  | Personas       | {s}    | v{n}    | {disk_status}  | docs/personas.md         |
  | PRD            | {s}    | v{n}    | {disk_status}  | docs/prd.md              |
  | Architecture   | {s}    | v{n}    | {disk_status}  | docs/architecture.md     |
  | UX Spec        | {s}    | v{n}    | {disk_status}  | docs/ux-spec.md          |
  | Security       | {s}    | v{n}    | {disk_status}  | docs/security.md         |
  | Conventions    | {s}    | v{n}    | {disk_status}  | docs/conventions.md      |
  | Epics          | {s}    | v{n}    | {count} files  | docs/epics/              |
  | Stories        | {s}    | v{n}    | {count} files  | docs/stories/            |

  For "Status" show: null, draft, approved (from state.artifacts.{key}.status)
  For "Version" show: v0 if never produced, v1+, from state.artifacts.{key}.version
  For "On Disk" show: missing, empty, has content, {N} files

--------------------------------------------
  Sprint Details
--------------------------------------------

  {If in sprint phase or current_sprint > 0:}

  Sprint #{current_sprint}

  | Story                    | Status       | Complexity | Owner    |
  |-------------------------|-------------|------------|----------|
  | {story_name}             | {status}     | {S/M/L/XL} | {owner}  |
  | ...                      | ...          | ...        | ...      |

  Progress: {completed}/{total} stories ({percentage}%)

  {If not in sprint phase:}
  No active sprint.

--------------------------------------------
  Features
--------------------------------------------

  {If state.features has entries:}

  Active Features:
  | ID | Feature | Phase | Progress |
  |----|---------|-------|----------|
  | SNPR-{XXXX} | {title} | {phase} | {stories_complete}/{stories_total} stories |
  | ... | ... | ... | ... |

  Completed Features:
  | ID | Feature | Completed | Stories |
  |----|---------|-----------|---------|
  | SNPR-{XXXX} | {title} | {completed_at} | {stories_total} |
  | ... | ... | ... | ... |

  Total: {active count} active, {completed count} completed

  {If state.features is empty:}
  No features started. Run /sniper-feature to add an incremental feature.

--------------------------------------------
  Bugs
--------------------------------------------

  {If state.bugs has entries:}

  Active Bugs:
  | ID | Bug | Severity | Status |
  |----|-----|----------|--------|
  | BUG-{NNN} | {title} | {severity} | {status} |

  Resolved Bugs:
  | ID | Bug | Severity | Resolved | Root Cause |
  |----|-----|----------|----------|------------|
  | BUG-{NNN} | {title} | {severity} | {resolved_at} | {root_cause} |

  {If state.bugs is empty:}
  No bugs tracked. Run /sniper-debug to investigate a bug.

--------------------------------------------
  Refactors
--------------------------------------------

  {If state.refactors has entries:}

  Active Refactors:
  | ID | Refactor | Status | Progress |
  |----|----------|--------|----------|
  | REF-{NNN} | {title} | {status} | {stories_complete}/{stories_total} stories |

  Completed Refactors:
  | ID | Refactor | Completed |
  |----|----------|-----------|
  | REF-{NNN} | {title} | {completed_at} |

  {If state.refactors is empty:}
  No refactors tracked. Run /sniper-audit --target refactor to start one.

--------------------------------------------
  Reviews
--------------------------------------------

  {If state.reviews has entries:}

  Recent Reviews:
  | ID | Type | Target | Recommendation | Date |
  |----|------|--------|---------------|------|
  | {id} | {pr/release} | {target} | {recommendation} | {created_at} |

  {If state.reviews is empty:}
  No reviews tracked. Run /sniper-audit --target review to review a PR or release.

--------------------------------------------
  Test Audits
--------------------------------------------

  {If state.test_audits has entries:}

  Active Test Audits:
  | ID | Audit | Status | Progress |
  |----|-------|--------|----------|
  | TST-{NNN} | {title} | {status} | {stories_complete}/{stories_total} stories |

  Completed Test Audits:
  | ID | Audit | Completed | Stories |
  |----|-------|-----------|---------|
  | TST-{NNN} | {title} | {completed_at} | {stories_total} |

  {If state.test_audits is empty:}
  No test audits tracked. Run /sniper-audit --target tests to analyze test quality.

--------------------------------------------
  Security Audits
--------------------------------------------

  {If state.security_audits has entries:}

  Active Security Audits:
  | ID | Audit | Status | Findings | Progress |
  |----|-------|--------|----------|----------|
  | SEC-{NNN} | {title} | {status} | {critical}C {high}H {medium}M {low}L | {stories_complete}/{stories_total} stories |

  Completed Security Audits:
  | ID | Audit | Completed | Findings | Stories |
  |----|-------|-----------|----------|---------|
  | SEC-{NNN} | {title} | {completed_at} | {critical}C {high}H | {stories_total} |

  {If state.security_audits is empty:}
  No security audits tracked. Run /sniper-audit --target security to audit security.

--------------------------------------------
  Performance Audits
--------------------------------------------

  {If state.perf_audits has entries:}

  Active Performance Audits:
  | ID | Audit | Status | Progress |
  |----|-------|--------|----------|
  | PERF-{NNN} | {title} | {status} | {stories_complete}/{stories_total} stories |

  Completed Performance Audits:
  | ID | Audit | Completed | Stories |
  |----|-------|-----------|---------|
  | PERF-{NNN} | {title} | {completed_at} | {stories_total} |

  {If state.perf_audits is empty:}
  No performance audits tracked. Run /sniper-audit --target performance to profile performance.

--------------------------------------------
  Review Gates
--------------------------------------------

  | Gate             | Mode       | Status                    |
  |-----------------|------------|---------------------------|
  | after_ingest     | {mode}     | {passed/pending/N/A}      |
  | after_discover   | {mode}     | {passed/pending/N/A}      |
  | after_plan       | {mode}     | {passed/pending/N/A}      |
  | after_solve      | {mode}     | {passed/pending/N/A}      |
  | after_sprint     | {mode}     | {passed/pending/N/A}      |

  Legend:
    strict   = Human must explicitly approve before advancing
    flexible = Auto-advance, human reviews async
    auto     = No review required

--------------------------------------------
  Tech Stack
--------------------------------------------

  Language:         {language}
  Frontend:         {frontend}
  Backend:          {backend}
  Database:         {database}
  Cache:            {cache}
  Infrastructure:   {infrastructure}
  Test Runner:      {test_runner}
  Package Manager:  {package_manager}

============================================
  What's Next
============================================

  {Generate contextual next-step suggestions based on current state:}

  {If not started:}
  -> Run /sniper-ingest to bootstrap artifacts from an existing codebase
  -> Run /sniper-discover to begin Phase 1: Discovery & Analysis (for new projects)

  {If in ingest phase:}
  -> Ingestion is in progress. When complete, run /sniper-review to evaluate artifacts.

  {If ingest complete:}
  -> Run /sniper-feature to add incremental features using ingested artifacts
  -> Run /sniper-discover to begin Phase 1: Discovery & Analysis
  -> Run /sniper-audit to audit the codebase

  {If in discover phase:}
  -> Discovery is in progress. When complete, run /sniper-review to evaluate artifacts.

  {If discover complete, plan not started:}
  -> Run /sniper-plan to begin Phase 2: Planning & Architecture

  {If in plan phase:}
  -> Planning is in progress. When complete, run /sniper-review to evaluate artifacts.
  -> Note: This gate is STRICT -- human approval required.

  {If plan complete, solve not started:}
  -> Run /sniper-solve to begin Phase 3: Epic Sharding & Story Creation

  {If in solve phase:}
  -> Story creation is in progress. When complete, run /sniper-review to evaluate stories.

  {If solve complete, sprint not started:}
  -> Run /sniper-sprint to begin Phase 4: Implementation Sprint

  {If in sprint phase:}
  -> Sprint #{N} is in progress. {completed}/{total} stories complete.
  -> When all sprint stories are done, run /sniper-review to evaluate the sprint.

  {If there are active bugs:}
  -> {count} active bug(s). Run /sniper-debug --list to see details.

  {If there are active refactors:}
  -> {count} active refactor(s). Run /sniper-audit --target refactor --list to see details.

  {If there are active features:}
  -> {count} active feature(s). Run /sniper-feature --list to see details.

  {If there are active test audits:}
  -> {count} active test audit(s). Run /sniper-audit --target tests --list to see details.

  {If there are active security audits:}
  -> {count} active security audit(s). Run /sniper-audit --target security --list to see details.

  {If there are active performance audits:}
  -> {count} active performance audit(s). Run /sniper-audit --target performance --list to see details.

  {Always show these as available commands:}
  -> Run /sniper-debug to investigate a production bug
  -> Run /sniper-audit --target review --pr {N} to review a pull request
  -> Run /sniper-audit --target refactor to plan a large refactoring
  -> Run /sniper-audit --target tests to analyze test quality
  -> Run /sniper-audit --target security to audit security
  -> Run /sniper-audit --target performance to profile performance

  {If there are out-of-sync artifacts:}
  -> WARNING: Some artifacts are out of sync between config and disk. Review the artifacts table above.
```

---

## IMPORTANT RULES

- This is a READ-ONLY command. Do NOT modify any files whatsoever.
- Do NOT modify `.sniper/config.yaml` -- only read it.
- Do NOT modify any artifact files -- only check their existence and read their headers.
- If config.yaml is malformed, report what you can read and note the parsing errors.
- Show ALL sections of the report even if some are empty -- use the "not started" / "N/A" defaults.
- Be precise about dates -- use the actual dates from phase_history, do not fabricate dates.
- For the progress estimate, be conservative -- do not overstate progress.
- If story files exist but have no status markers, default to "pending" and note the assumption.
- Always end with the contextual "What's Next" section to guide the user.
