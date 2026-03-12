# @sniper.ai/core

## 4.1.0

### Minor Changes

- [#25](https://github.com/virkt25/sniper/pull/25) [`03dc85b`](https://github.com/virkt25/sniper/commit/03dc85bb6a97f7a30a6d20126bd6768fe3bf1b59) Thanks [@virkt25](https://github.com/virkt25)! - structured decision prompts for agent-to-user questions

## 4.0.0

### Major Changes

- [#23](https://github.com/virkt25/sniper/pull/23) [`e52398d`](https://github.com/virkt25/sniper/commit/e52398d0c5b48130239055c4a8febdb787571f87) Thanks [@virkt25](https://github.com/virkt25)! - remove token budget, cost tracking, and velocity systems

## 3.4.0

### Minor Changes

- [#22](https://github.com/virkt25/sniper/pull/22) [`4e503d4`](https://github.com/virkt25/sniper/commit/4e503d48c5d5743d4487ae75fe8eefa587d080cd) Thanks [@virkt25](https://github.com/virkt25)! - reorder protocol phases — PRD before architecture

## 3.3.1

### Patch Changes

- [#21](https://github.com/virkt25/sniper/pull/21) [`fbc0da7`](https://github.com/virkt25/sniper/commit/fbc0da7a3dce27b01673b073b4f87132a0a97682) Thanks [@virkt25](https://github.com/virkt25)! - fix: reconcile protocol definitions with skill and checklist references

  - Fix discover phase description in full protocol (remove incorrect PRD mention)
  - Add strict agent list enforcement to sniper-flow skill
  - Fix malformed grep path in plan checklist (missing plan.md filename)

## 3.3.0

### Minor Changes

- [#20](https://github.com/virkt25/sniper/pull/20) [`afebabd`](https://github.com/virkt25/sniper/commit/afebabdce5dfdbc2c7b128e7169cc1c8d21ee971) Thanks [@virkt25](https://github.com/virkt25)! - implement unified self-learning system

## 3.2.0

### Minor Changes

- [#19](https://github.com/virkt25/sniper/pull/19) [`f954bc1`](https://github.com/virkt25/sniper/commit/f954bc1dd50671ac768525dd2f2659a02cb94630) Thanks [@virkt25](https://github.com/virkt25)! - Add phased interactive review gates and story status tracking

  - Add interactive review gate after discovery phase (spec/PRD review before architecture)
  - Split plan phase into plan (architecture) + solve (story sharding) so users review architecture before stories are created
  - Add story status tracking via YAML frontmatter in story template (pending, in_progress, completed, skipped)
  - Add stories array to live-status for real-time story progress tracking
  - Add solve checklist for story quality gate
  - Move story-specific checks from plan checklist to new solve checklist
  - Fix scaffolder to place registry.md in .sniper/artifacts/ instead of docs/

- [#19](https://github.com/virkt25/sniper/pull/19) [`f954bc1`](https://github.com/virkt25/sniper/commit/f954bc1dd50671ac768525dd2f2659a02cb94630) Thanks [@virkt25](https://github.com/virkt25)! - phased interactive review gates and story status tracking

## 3.1.2

### Patch Changes

- [#18](https://github.com/virkt25/sniper/pull/18) [`43cca50`](https://github.com/virkt25/sniper/commit/43cca500c6f999de112dd1a02a7b62c560ba31cd) Thanks [@virkt25](https://github.com/virkt25)! - use string matcher format for Claude Code hooks

## 3.1.1

### Patch Changes

- [`46bf13a`](https://github.com/virkt25/sniper/commit/46bf13a055b64fd75f11e4b49b97f93753033e80) Thanks [@virkt25](https://github.com/virkt25)! - Add homepage and repository metadata to package.json files for npm

## 3.1.0

### Minor Changes

- [`91f3b09`](https://github.com/virkt25/sniper/commit/91f3b09435a752d27580a58642e22b4f3d8856ba) Thanks [@virkt25](https://github.com/virkt25)! - fix: v3 improvements, skills cleanup, protocol artifact restructuring, and release pipeline setup

## 2.0.0

### Major Changes

- Sniper V2

## 1.0.1

### Patch Changes

- fix github url

## 1.0.0

### Major Changes

- initial release
