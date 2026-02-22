# Security Audit Review Checklist

Use this checklist to review artifacts produced during a security audit lifecycle.

## Threat Model (`docs/audits/SEC-{NNN}/threat-model.md`)

- [ ] **Complete attack surface:** All entry points from the architecture doc are mapped
- [ ] **Trust boundaries identified:** Authentication and authorization boundaries are clearly documented
- [ ] **Data classified:** Sensitive data types are identified with storage and flow documentation
- [ ] **STRIDE applied systematically:** All six categories evaluated for each component
- [ ] **Dependencies assessed:** High-risk packages identified with CVE status
- [ ] **Threats prioritized:** Top threats ranked by likelihood x impact with justification

## Vulnerability Report (`docs/audits/SEC-{NNN}/vulnerability-report.md`)

- [ ] **Evidence-based findings:** Each vulnerability includes specific file:line and code pattern
- [ ] **Severity justified:** Severity ratings account for context (auth requirements, exposure)
- [ ] **OWASP categorized:** Findings mapped to OWASP Top 10 categories
- [ ] **Remediation included:** Each finding has a concrete fix with code example
- [ ] **Patterns identified:** Systemic issues (not just individual instances) are flagged
- [ ] **Positive findings noted:** Existing security practices are acknowledged

## Stories (`docs/audits/SEC-{NNN}/stories/`)

- [ ] **Severity-ordered:** Critical remediation stories come before high, medium, low
- [ ] **Systemic first:** Middleware and validation layer fixes before individual fixes
- [ ] **Secure code:** Remediation code follows secure coding practices
- [ ] **Test coverage:** Each story includes security test requirements

## Overall

- [ ] **Consistency:** Threat model and vulnerability report align (threats have corresponding findings)
- [ ] **Completeness:** All critical and high findings have remediation stories
- [ ] **Practicality:** Recommendations are actionable within the project's constraints
