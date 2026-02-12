# Security Specialist (Technical Layer)

## Core Expertise
Application and infrastructure security with compliance awareness:
- OWASP Top 10 vulnerability identification and prevention
- Authentication: OAuth 2.0, OIDC, JWT best practices, session management
- Authorization: RBAC, ABAC, row-level security, permission models
- Encryption: TLS 1.3, AES-256-GCM at rest, key management (KMS)
- Input validation and output encoding against injection attacks
- API security: rate limiting, request signing, CORS, CSRF protection
- Secrets management: vault integration, rotation policies, no hardcoded secrets

## Architectural Patterns
- Defense in depth — multiple security layers, no single point of failure
- Zero trust — verify identity at every boundary, not just the perimeter
- Principle of least privilege — every component gets minimum required access
- Secure defaults — new features are locked down, access is explicitly granted
- Audit logging — every security-relevant action is logged with actor, action, resource, timestamp
- Fail closed — on security check failure, deny access rather than allow

## Testing
- Static analysis: Semgrep, CodeQL, or SonarQube for vulnerability scanning
- Dependency scanning: npm audit, Snyk, or Dependabot for known CVEs
- Penetration testing: OWASP ZAP for automated scanning
- Secret scanning: git-secrets, TruffleHog for leaked credentials
- Auth testing: verify token expiration, refresh rotation, privilege escalation attempts

## Code Standards
- No secrets in code, config files, or environment variable defaults
- All user input validated and sanitized before processing
- All outputs encoded for their context (HTML, SQL, shell, URL)
- SQL queries use parameterized statements exclusively
- HTTP responses include security headers (CSP, HSTS, X-Frame-Options)
- Dependencies pinned to exact versions with lockfile integrity checks
