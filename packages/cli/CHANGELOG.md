# @sniper.ai/cli

## 3.2.2

### Patch Changes

- Updated dependencies [[`fbc0da7`](https://github.com/virkt25/sniper/commit/fbc0da7a3dce27b01673b073b4f87132a0a97682)]:
  - @sniper.ai/core@3.3.1

## 3.2.1

### Patch Changes

- Updated dependencies [[`afebabd`](https://github.com/virkt25/sniper/commit/afebabdce5dfdbc2c7b128e7169cc1c8d21ee971)]:
  - @sniper.ai/core@3.3.0

## 3.2.0

### Minor Changes

- [#19](https://github.com/virkt25/sniper/pull/19) [`f954bc1`](https://github.com/virkt25/sniper/commit/f954bc1dd50671ac768525dd2f2659a02cb94630) Thanks [@virkt25](https://github.com/virkt25)! - phased interactive review gates and story status tracking

### Patch Changes

- [#19](https://github.com/virkt25/sniper/pull/19) [`f954bc1`](https://github.com/virkt25/sniper/commit/f954bc1dd50671ac768525dd2f2659a02cb94630) Thanks [@virkt25](https://github.com/virkt25)! - Add phased interactive review gates and story status tracking

  - Add interactive review gate after discovery phase (spec/PRD review before architecture)
  - Split plan phase into plan (architecture) + solve (story sharding) so users review architecture before stories are created
  - Add story status tracking via YAML frontmatter in story template (pending, in_progress, completed, skipped)
  - Add stories array to live-status for real-time story progress tracking
  - Add solve checklist for story quality gate
  - Move story-specific checks from plan checklist to new solve checklist
  - Fix scaffolder to place registry.md in .sniper/artifacts/ instead of docs/

- Updated dependencies [[`f954bc1`](https://github.com/virkt25/sniper/commit/f954bc1dd50671ac768525dd2f2659a02cb94630), [`f954bc1`](https://github.com/virkt25/sniper/commit/f954bc1dd50671ac768525dd2f2659a02cb94630)]:
  - @sniper.ai/core@3.2.0

## 3.1.2

### Patch Changes

- [#18](https://github.com/virkt25/sniper/pull/18) [`43cca50`](https://github.com/virkt25/sniper/commit/43cca500c6f999de112dd1a02a7b62c560ba31cd) Thanks [@virkt25](https://github.com/virkt25)! - use string matcher format for Claude Code hooks

- Updated dependencies [[`43cca50`](https://github.com/virkt25/sniper/commit/43cca500c6f999de112dd1a02a7b62c560ba31cd)]:
  - @sniper.ai/core@3.1.2

## 3.1.1

### Patch Changes

- [`46bf13a`](https://github.com/virkt25/sniper/commit/46bf13a055b64fd75f11e4b49b97f93753033e80) Thanks [@virkt25](https://github.com/virkt25)! - Add homepage and repository metadata to package.json files for npm

- Updated dependencies [[`46bf13a`](https://github.com/virkt25/sniper/commit/46bf13a055b64fd75f11e4b49b97f93753033e80)]:
  - @sniper.ai/core@3.1.1

## 3.1.0

### Minor Changes

- [`91f3b09`](https://github.com/virkt25/sniper/commit/91f3b09435a752d27580a58642e22b4f3d8856ba) Thanks [@virkt25](https://github.com/virkt25)! - fix: v3 improvements, skills cleanup, protocol artifact restructuring, and release pipeline setup

### Patch Changes

- Updated dependencies [[`91f3b09`](https://github.com/virkt25/sniper/commit/91f3b09435a752d27580a58642e22b4f3d8856ba)]:
  - @sniper.ai/core@3.1.0

## 2.0.0

### Major Changes

- Sniper V2

### Patch Changes

- Updated dependencies
  - @sniper.ai/core@2.0.0

## 1.0.1

### Patch Changes

- fix github url
- Updated dependencies
  - @sniper.ai/core@1.0.1

## 1.0.0

### Major Changes

- initial release

### Patch Changes

- Updated dependencies
  - @sniper.ai/core@1.0.0
