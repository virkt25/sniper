# Threat Model: {title}

> **Audit ID:** SEC-{NNN}
> **Status:** Analyzing
> **Date:** {date}
> **Author:** Threat Modeler

## Attack Surface Map
<!-- sniper:managed:attack-surface:start -->
<!-- All entry points with authentication requirements -->

| Entry Point | Type | Auth Required | Auth Method | Notes |
|------------|------|--------------|-------------|-------|
| | API / Webhook / Upload / Admin / WebSocket | Yes/No | JWT/Session/API Key/None | |

<!-- sniper:managed:attack-surface:end -->

## Trust Boundaries
<!-- sniper:managed:trust-boundaries:start -->
<!-- Where authenticated/unauthenticated, internal/external, user/admin boundaries exist -->

### Boundary: {name}
- **Separates:** {trusted side} ↔ {untrusted side}
- **Enforced by:** {mechanism — middleware, firewall, etc.}
- **Data crossing:** {what data crosses this boundary}

<!-- sniper:managed:trust-boundaries:end -->

## Data Classification
<!-- sniper:managed:data-classification:start -->

| Data Type | Classification | Stored In | Encrypted at Rest | Encrypted in Transit | Retention |
|-----------|---------------|-----------|-------------------|---------------------|-----------|
| | PII / Credentials / Financial / Internal | | Yes/No | Yes/No | |

<!-- sniper:managed:data-classification:end -->

## Threat Inventory (STRIDE)
<!-- sniper:managed:threat-inventory:start -->

### {Component/Flow Name}

| Category | Threat | Likelihood | Impact | Risk | Mitigation |
|----------|--------|-----------|--------|------|------------|
| Spoofing | | H/M/L | H/M/L | | |
| Tampering | | H/M/L | H/M/L | | |
| Repudiation | | H/M/L | H/M/L | | |
| Info Disclosure | | H/M/L | H/M/L | | |
| Denial of Service | | H/M/L | H/M/L | | |
| Elevation of Privilege | | H/M/L | H/M/L | | |

<!-- sniper:managed:threat-inventory:end -->

## Dependency Risk
<!-- sniper:managed:dependency-risk:start -->

| Package | Version | Known CVEs | Maintained | Risk Level |
|---------|---------|------------|------------|------------|
| | | Yes/No | Yes/No | High/Medium/Low |

<!-- sniper:managed:dependency-risk:end -->

## Priority Threats
<!-- sniper:managed:priority-threats:start -->
<!-- Top 5 threats ranked by likelihood x impact -->

| Rank | Threat | Component | Likelihood x Impact | Recommended Action |
|------|--------|-----------|--------------------|--------------------|
| 1 | | | | |

<!-- sniper:managed:priority-threats:end -->
