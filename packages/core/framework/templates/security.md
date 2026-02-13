# Security Assessment: {project_name}

> **Status:** Draft
> **Author:** Planning Team — Security Analyst
> **Date:** {date}

## Security Overview
<!-- 2-3 sentence summary of the project's security posture and key concerns -->

## Authentication & Authorization

### Authentication Model
<!-- OAuth 2.0 / JWT / Session-based / API Keys / Multi-factor -->

### Authorization Model
<!-- RBAC / ABAC / ACL — describe roles, permissions, and access levels -->

### Session Management
<!-- Token lifecycle, refresh strategy, revocation, concurrent sessions -->

## Data Security

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

## API Security

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

## Infrastructure Security

### Network Architecture
<!-- VPC, subnets, security groups, WAF, CDN -->

### Secrets Management
<!-- Vault, environment variables, rotation policy -->

### Logging & Monitoring
<!-- Security event logging, alerting, SIEM integration -->

## Compliance Requirements
<!-- Applicable frameworks: SOC 2, GDPR, HIPAA, PCI-DSS, etc. -->

## Threat Model

### Attack Surface
<!-- Entry points, trust boundaries, data flows -->

### Key Threats
| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| | | | |

## Recommendations
<!-- Prioritized security recommendations for implementation -->
1.
2.
3.

## Open Questions
1.
2.
