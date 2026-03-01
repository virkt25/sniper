---
title: Troubleshooting
description: Common issues and solutions when using SNIPER
---

# Troubleshooting

Common issues and their solutions when working with SNIPER.

## Initialization Issues

### "SNIPER is not initialized"

**Problem:** A phase command fails with "Run `/sniper-init` first."

**Solution:** Ensure `.sniper/config.yaml` exists and has a non-empty `project.name`. Run `/sniper-init` if it does not exist.

### Missing framework files after init

**Problem:** `/sniper-init` reports missing persona, team, or template files.

**Solution:** Framework files should come from the `@sniper.ai/core` package. Verify it is installed and that `sniper init` was run from the CLI (which scaffolds files from core). If files are missing, re-run `sniper init` from the CLI.

### Config schema version mismatch

**Problem:** Commands warn about schema version migration.

**Solution:** SNIPER automatically migrates v1 configs to v2. If migration fails, check that `.sniper/config.yaml` is valid YAML with no syntax errors.

## Agent Spawning Issues

### Teammate not responding

**Problem:** An agent has been silent for more than 10 minutes during a phase.

**Solutions:**
- The team lead automatically checks on stalled teammates after the `coordination_timeout` (default: 30 minutes)
- If a teammate crashes, you can offer to respawn that specific teammate
- Re-running the phase command starts fresh (artifacts on disk are preserved)

### Too many teammates

**Problem:** The implement phase needs more teammates than `max_teammates` allows.

**Solution:** Reduce the number of stories selected for the implement phase, or increase `agents.max_teammates` in config.yaml. Consider splitting the implement phase into two smaller batches by story ownership area.

### Agent writing to wrong files

**Problem:** A teammate modifies files outside their ownership boundary.

**Solution:** Ownership boundaries are advisory -- they are injected into the spawn prompt but not technically enforced. If an agent crosses boundaries:
1. Review the output and revert unwanted changes
2. Check that the team YAML correctly maps `owns_from_config` to the right ownership key
3. Verify that `config.yaml` ownership paths match your actual project structure

## File Ownership Conflicts

### Default ownership paths do not match project

**Problem:** The ownership section in config.yaml uses default paths (`src/backend/`, `src/frontend/`) that do not match your project.

**Solution:** Update the `ownership` section manually, or run `/sniper-flow --protocol ingest` which auto-detects your project structure and updates ownership paths.

### Stories assigned to wrong teammate

**Problem:** During an implement phase, stories are assigned to a teammate whose ownership does not match the story's file touches.

**Solution:** The implement phase maps stories to teammates based on the "File Ownership" field in each story. If stories were created with incorrect ownership fields, edit the story files in `docs/stories/` to correct the ownership, then re-run `/sniper-flow`.

## Review Gate Issues

### Gate blocking advancement

**Problem:** A strict review gate has failures that block advancement.

**Solutions:**
- Fix the failing items in the artifacts and run `/sniper-review` again
- For the plan gate specifically: the checklist is designed to catch cascading problems. Address all FAIL items before advancing -- overriding is not possible on strict gates with failures.

### Gate evaluating wrong phase

**Problem:** `/sniper-review` evaluates a different phase than expected.

**Solution:** In v3, the review command determines the current phase from checkpoint files in `.sniper/checkpoints/` and the live-status file at `.sniper/live-status.yaml`. Run `/sniper-status` to verify the current phase state. If the state is incorrect, check these files for inconsistencies.

### Checklist file not found

**Problem:** Review fails with "Checklist file not found."

**Solution:** Verify the checklist file exists at the path shown in the error. Standard checklists are in `.sniper/checklists/`. If missing, the framework installation may be incomplete -- re-run `sniper init` from the CLI.

## Memory Issues

### Memory not loading

**Problem:** Spawn prompts do not include memory context.

**Solutions:**
- Check that `.sniper/memory/` directory exists with YAML files
- The memory system requires at least one entry in any memory file to produce output
- Verify that agents are being spawned with the correct context by checking `.sniper/live-status.yaml`

### Memory exceeding token budget

**Problem:** A warning appears about memory being truncated.

**Solution:** Low-priority entries are automatically pruned by the retro-analyst agent during protocol retrospectives. You can also manually remove low-value entries from the YAML files in `.sniper/memory/`.

### Retrospective not running

**Problem:** No retrospective runs after protocol completion.

**Solutions:**
- Verify `auto_retro: true` is set in the protocol YAML file (e.g., `full.yaml`)
- Check that `visibility.auto_retro: true` in `.sniper/config.yaml`
- If `auto_retro` is disabled, the retro-analyst agent will not run automatically after protocol completion

## Implement Phase Issues

### Stories not self-contained

**Problem:** Implement phase agents ask questions about requirements that should be in the story file.

**Solution:** The implement phase expects stories with embedded context from the PRD and architecture. If stories reference other documents instead of embedding content, manually edit the story files to embed the missing context, or re-run the protocol with `/sniper-flow`.

### API contract misalignment

**Problem:** Backend and frontend implementations do not agree on API contracts.

**Solutions:**
- The team lead should facilitate contract alignment at the start of each implement phase
- Use the implement phase coordination rules: message both agents to share endpoint specs and data shapes before coding
- Consider adding explicit API contract stories that must complete before frontend stories begin

### Tests failing after implement phase

**Problem:** The QA engineer reports test failures.

**Solution:** The team lead messages the implementing teammate with specific failure details. The teammate fixes their code and QA re-tests. This cycle repeats until all tests pass. The implement review gate will not advance until tests pass.

## CLI Errors

### "Command not found: sniper"

**Problem:** The `sniper` CLI is not available.

**Solution:** Verify installation with `npm list -g @sniper.ai/cli`. If not installed, run `npm install -g @sniper.ai/cli`.

### Slash commands not working

**Problem:** Claude Code does not recognize `/sniper-*` commands.

**Solution:** Verify that command files exist in `.claude/commands/` (or the project's command directory). These should have been created during `sniper init`. If missing, re-run the CLI scaffolding.

## State Recovery

### Corrupted config.yaml

**Problem:** Config file has YAML syntax errors or invalid state.

**Solutions:**
- Fix YAML syntax errors (common causes: unquoted strings with colons, incorrect indentation)
- If the state section is corrupted but artifacts are intact on disk, you can reset the state section manually while preserving project configuration
- As a last resort, re-run `/sniper-init` (this will overwrite config but preserve artifacts in `docs/`)

### Phase stuck in progress

**Problem:** A phase shows as active but the conversation has ended.

**Solution:** Check `.sniper/live-status.yaml` for the current phase state and `.sniper/checkpoints/` for checkpoint files. Either:
1. Update the checkpoint file to mark the phase as complete if artifacts are finished
2. Re-run `/sniper-flow --resume` -- it will detect the active phase and offer to resume from the last checkpoint

## Next Steps

- [Configuration](/guide/configuration) -- review all configuration options
- [Glossary](/guide/glossary) -- clarify SNIPER-specific terminology
