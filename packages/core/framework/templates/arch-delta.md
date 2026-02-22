# Architecture Delta: {title}

> **Feature ID:** SNPR-{XXXX}
> **Version:** 1
> **Status:** Draft
> **Date:** {date}
> **Author:** Feature Planning Team — Architect
> **Base Architecture:** `docs/architecture.md` (version {N})
> **Change Log:**
> - v1 ({date}): Initial version

## Summary of Changes
<!-- sniper:managed:summary:start -->
<!-- 2-3 sentence overview of what changes to the architecture -->
<!-- sniper:managed:summary:end -->

## New Components
<!-- sniper:managed:new-components:start -->
<!-- Components being added to the system -->

### {Component Name}
- **Responsibility:**
- **Interfaces:**
- **Dependencies:**

<!-- sniper:managed:new-components:end -->

## Modified Components
<!-- sniper:managed:modified-components:start -->
<!-- Existing components that need changes -->

### {Existing Component Name}
- **Current behavior:**
- **New behavior:**
- **Migration notes:**

<!-- sniper:managed:modified-components:end -->

## New Data Models
<!-- sniper:managed:new-data-models:start -->
<!-- New entities or modified schemas -->

| Field | Type | Constraints | Index | Notes |
|-------|------|------------|-------|-------|
| | | | | |

<!-- sniper:managed:new-data-models:end -->

## New/Modified API Endpoints
<!-- sniper:managed:api-endpoints:start -->
```
METHOD /api/v1/{resource}
Request: { }
Response: { }
Status Codes: 200, 400, 401, 404, 500
Auth: Required
```
<!-- sniper:managed:api-endpoints:end -->

## Infrastructure Changes
<!-- sniper:managed:infrastructure:start -->
<!-- Any new services, queues, caches, etc. -->
<!-- sniper:managed:infrastructure:end -->

## Patterns to Follow
<!-- sniper:managed:patterns:start -->
<!-- Reference existing architecture patterns that should be followed -->
<!-- From docs/conventions.md if available -->
<!-- sniper:managed:patterns:end -->

## Risks
<!-- sniper:managed:risks:start -->
<!-- Architecture risks specific to this feature -->
<!-- sniper:managed:risks:end -->
