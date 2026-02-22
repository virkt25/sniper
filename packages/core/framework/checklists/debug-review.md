# Debug Review Checklist

Use this checklist to review artifacts produced during a bug investigation.

## Bug Report (`docs/bugs/BUG-{NNN}/report.md`)

- [ ] **Summary clarity:** Bug is described in terms of observed behavior, not implementation
- [ ] **Severity justified:** Severity level matches the described user impact
- [ ] **Affected components identified:** Components are traced to actual architecture doc entries
- [ ] **Reproduction steps:** Steps are specific enough to reproduce (or clearly marked "unable to determine")
- [ ] **Investigation plan:** Specific guidance for log analyst and code investigator

## Investigation (`docs/bugs/BUG-{NNN}/investigation.md`)

- [ ] **Log findings present:** Error patterns documented with specific messages and locations
- [ ] **Code findings present:** Execution path traced with file:line references
- [ ] **Root cause identified:** A specific root cause is proposed (not vague)
- [ ] **Evidence-based:** Findings are backed by specific code references, not speculation
- [ ] **Recommended fix:** A concrete fix approach is proposed
- [ ] **Consistency:** Log findings and code findings point to the same root cause

## Post-Mortem (`docs/bugs/BUG-{NNN}/postmortem.md`)

- [ ] **Fix addresses root cause:** The fix targets the actual root cause, not just symptoms
- [ ] **Files changed listed:** All modified files are documented
- [ ] **Regression tests added:** Tests specifically prevent this bug from recurring
- [ ] **Prevention strategy:** At least one process or code change to prevent similar bugs
- [ ] **Timeline accurate:** Key events are timestamped

## Overall

- [ ] **Artifacts consistent:** Report, investigation, and postmortem tell a coherent story
- [ ] **No speculation presented as fact:** Hypotheses are clearly labeled
- [ ] **Actionable:** Another developer could understand and verify the fix
