# @sniper.ai/core

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
