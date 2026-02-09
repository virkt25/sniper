# SNIPER Project

## Framework
This project uses SNIPER (Spawn, Navigate, Implement, Parallelize, Evaluate, Release).
See `.sniper/config.yaml` for project settings.

## Quick Reference
- Framework workflows: `.sniper/workflows/`
- Persona layers: `.sniper/personas/`
- Team definitions: `.sniper/teams/`
- Artifact templates: `.sniper/templates/`
- Quality gates: `.sniper/checklists/`
- Project artifacts: `docs/`
- Domain context: `.sniper/domain-packs/{pack-name}/`

## Commands
- `/sniper-init` — Initialize SNIPER in a new project
- `/sniper-discover` — Phase 1: Discovery & Analysis (parallel team)
- `/sniper-plan` — Phase 2: Planning & Architecture (parallel team)
- `/sniper-solve` — Phase 3: Epic Sharding & Story Creation (sequential)
- `/sniper-sprint` — Phase 4: Implementation Sprint (parallel team)
- `/sniper-review` — Run review gate for current phase
- `/sniper-compose` — Create a spawn prompt from persona layers
- `/sniper-status` — Show lifecycle status and artifact state

## Agent Teams Rules
When spawning teammates, always:
1. Read the relevant team YAML from `.sniper/teams/`
2. Compose spawn prompts using `/sniper-compose` with the layers specified in the YAML
3. Assign file ownership boundaries from `config.yaml` ownership rules
4. Create tasks with dependencies from the team YAML
5. Enter delegate mode (Shift+Tab) — the lead coordinates, it does not code
6. Require plan approval for tasks marked `plan_approval: true`
7. When a phase completes, run `/sniper-review` before advancing

## Code Standards
See `.sniper/config.yaml` → stack section for language/framework specifics.
