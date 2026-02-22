# Security Assessment: {project_name}

> **Version:** 1
> **Status:** Draft
> **Last Updated:** {date}
> **Author:** Planning Team — Security Analyst
> **Change Log:**
> - v1 ({date}): Initial version

## Security Overview
<!-- sniper:managed:overview:start -->
<!-- 2-3 sentence summary of the project's security posture and key concerns -->
<!-- sniper:managed:overview:end -->

## Authentication & Authorization

<!-- sniper:managed:auth:start -->
### Authentication Model
<!-- OAuth 2.0 / JWT / Session-based / API Keys / Multi-factor -->

### Authorization Model
<!-- RBAC / ABAC / ACL — describe roles, permissions, and access levels -->

### Session Management
<!-- Token lifecycle, refresh strategy, revocation, concurrent sessions -->
<!-- sniper:managed:auth:end -->

## Data Security

<!-- sniper:managed:data-security:start -->
### Data Classification
| Data Type | Classification | Storage | Encryption | Retention |
|-----------|---------------|---------|------------|-----------|
| | | | | |

### Encryption Requirements
- **At Rest:** <!-- AES-256, database-level, field-level -->
- **In Transit:** <!-- TLS 1.3, certificate pinning -->
- **Key Management:** <!-- KMS, rotation policy -->

### PII Handling
<!-- What PII is collected, how it's stored, who can access it, deletion policy -->
<!-- sniper:managed:data-security:end -->

## API Security

<!-- sniper:managed:api-security:start -->
### Input Validation
<!-- Validation strategy, sanitization, schema enforcement -->

### Rate Limiting
<!-- Per-endpoint limits, burst handling, API key tiers -->

### OWASP Top 10 Mitigations
| Vulnerability | Risk Level | Mitigation |
|--------------|-----------|------------|
| Injection | | |
| Broken Authentication | | |
| Sensitive Data Exposure | | |
| XML External Entities | | |
| Broken Access Control | | |
| Security Misconfiguration | | |
| Cross-Site Scripting | | |
| Insecure Deserialization | | |
| Known Vulnerabilities | | |
| Insufficient Logging | | |
<!-- sniper:managed:api-security:end -->

## Infrastructure Security

<!-- sniper:managed:infra-security:start -->
### Network Architecture
<!-- VPC, subnets, security groups, WAF, CDN -->

### Secrets Management
<!-- Vault, environment variables, rotation policy -->

### Logging & Monitoring
<!-- Security event logging, alerting, SIEM integration -->
<!-- sniper:managed:infra-security:end -->

## Compliance Requirements
<!-- sniper:managed:compliance:start -->
<!-- Applicable frameworks: SOC 2, GDPR, HIPAA, PCI-DSS, etc. -->
<!-- sniper:managed:compliance:end -->

## Threat Model

<!-- sniper:managed:threat-model:start -->
### Attack Surface
<!-- Entry points, trust boundaries, data flows -->

### Key Threats
| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| | | | |
<!-- sniper:managed:threat-model:end -->

## Recommendations
<!-- sniper:managed:recommendations:start -->
<!-- Prioritized security recommendations for implementation -->
1.
2.
3.
<!-- sniper:managed:recommendations:end -->

## Open Questions
<!-- sniper:managed:open-questions:start -->
1.
2.
<!-- sniper:managed:open-questions:end -->
