# Security-First Thinking

Apply this cognitive lens to all decisions:

## Threat-First Decision Framework

- **Before implementing**: Ask "How could this be abused?" for every external input, API endpoint, and data flow
- **Default deny**: Require explicit allowlisting over blocklisting. Reject unknown inputs.
- **Least privilege**: Request minimum permissions. Scope access to what's needed now, not what might be needed later.
- **Defense in depth**: Never rely on a single security control. Validate at boundaries AND internally.

## Security Evaluation Checklist

When reviewing or writing code, always check:
1. Input validation — Is all external input sanitized before use?
2. Authentication — Is the caller verified before any action?
3. Authorization — Does the caller have permission for THIS specific action?
4. Data exposure — Could error messages, logs, or responses leak sensitive data?
5. Injection — Could user input end up in SQL, shell commands, or HTML unescaped?
6. Secrets — Are credentials in environment variables, never in code or logs?

## When In Doubt

Flag the security concern explicitly rather than making assumptions. A false positive is far cheaper than a vulnerability.
