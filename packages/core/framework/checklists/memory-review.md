# Memory Review Checklist

Gate mode: **flexible** (memory entries are informational, auto-advance)

## Conventions (`.sniper/memory/conventions.yaml`)
- [ ] Every convention has a non-empty `rule` field with a clear, imperative statement
- [ ] Every convention has a `rationale` explaining why it exists
- [ ] Every convention has at least one role in `applies_to`
- [ ] Every convention has `enforcement` set to one of: review_gate, spawn_prompt, both
- [ ] No two conventions have identical or contradictory rules
- [ ] Convention IDs are unique and follow the `conv-XXX` pattern

## Anti-Patterns (`.sniper/memory/anti-patterns.yaml`)
- [ ] Every anti-pattern has a non-empty `description`
- [ ] Every anti-pattern has a `fix_pattern` describing the correct approach
- [ ] Every anti-pattern has `severity` set to one of: high, medium, low
- [ ] Every anti-pattern has at least one role in `applies_to`
- [ ] Anti-pattern IDs are unique and follow the `ap-XXX` pattern

## Decisions (`.sniper/memory/decisions.yaml`)
- [ ] Every decision has `title`, `context`, and `decision` fields filled
- [ ] Every decision has at least one alternative in `alternatives_considered`
- [ ] Every decision has `status` set to one of: active, superseded, deprecated
- [ ] Superseded decisions reference the replacing decision in `superseded_by`
- [ ] Decision IDs are unique and follow the `dec-XXX` pattern

## Overall
- [ ] No duplicate entries across conventions, anti-patterns, and decisions
- [ ] All source references are valid (type and ref fields populated)
- [ ] Candidate entries have sufficient evidence to remain as candidates
