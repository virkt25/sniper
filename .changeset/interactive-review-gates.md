---
"@sniper.ai/core": minor
"@sniper.ai/cli": patch
---

Add phased interactive review gates and story status tracking

- Add interactive review gate after discovery phase (spec/PRD review before architecture)
- Split plan phase into plan (architecture) + solve (story sharding) so users review architecture before stories are created
- Add story status tracking via YAML frontmatter in story template (pending, in_progress, completed, skipped)
- Add stories array to live-status for real-time story progress tracking
- Add solve checklist for story quality gate
- Move story-specific checks from plan checklist to new solve checklist
- Fix scaffolder to place registry.md in .sniper/artifacts/ instead of docs/
