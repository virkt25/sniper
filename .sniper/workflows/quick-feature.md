# Quick Feature Workflow

Fast-track a single feature without full lifecycle planning.

## When to Use
- Adding a feature to an existing codebase
- Feature is well-understood and doesn't need discovery or planning
- Architecture already exists
- Just need implementation + tests

## Prerequisites
- Existing codebase with established patterns
- Clear feature requirements (from user, issue, or brief description)
- Architecture document or existing code to follow patterns from

## Execution

### Step 1: Write a Story
Either:
- Write a story file manually at `docs/stories/quick-{name}.md`
- Or describe the feature to the lead and have it generate a story using the template

The story must include:
- Feature description and acceptance criteria
- File ownership (which directories to modify)
- Test requirements
- Any relevant context from existing architecture

### Step 2: Sprint with Single Story
```
/sniper-sprint
```
Select only the quick feature story. The command will:
1. Spawn only the teammates needed for this story
2. Skip unnecessary roles (e.g., no QA if it's a small change)
3. Execute the implementation

### Step 3: Review
Gate: STRICT — always review code before merge, even for quick features.

## Notes
- Skips Phases 1-3 entirely
- Best for S/M complexity features
- For L/XL features, use the full lifecycle — the planning is worth it
