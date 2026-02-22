# Ingestion Review Checklist

Use this checklist to review artifacts produced by `/sniper-ingest`.

## Project Brief (`docs/brief.md`)

- [ ] **Accuracy:** Brief accurately describes what the project does (not aspirational or hallucinated)
- [ ] **Problem statement:** Clearly identifies the problem the project solves
- [ ] **Target users:** Identifies who uses the project (inferred from code, not guessed)
- [ ] **Current scope:** Lists features that actually exist in the codebase
- [ ] **Constraints:** Notes technologies and external dependencies that are locked in
- [ ] **Honest gaps:** Sections that couldn't be inferred are marked "Unable to determine"

## System Architecture (`docs/architecture.md`)

- [ ] **Component diagram:** Includes an ASCII or Mermaid diagram that matches actual code structure
- [ ] **Directory alignment:** Component boundaries match the actual directory structure
- [ ] **Data models:** Extracted data models match actual ORM/migration/schema files
- [ ] **API contracts:** Documented endpoints match actual route definitions
- [ ] **Technology choices:** Listed technologies match actual dependencies (package.json, etc.)
- [ ] **Infrastructure:** Infrastructure description matches Docker/Terraform/K8s files (if present)
- [ ] **Cross-cutting concerns:** Auth, logging, error handling patterns are documented
- [ ] **No hallucinations:** No components, APIs, or data models that don't exist in the code

## Coding Conventions (`docs/conventions.md`)

- [ ] **Code examples:** Every convention cites a real code example with file path
- [ ] **Representative sampling:** Conventions are derived from multiple files, not just one
- [ ] **Inconsistencies noted:** Where patterns conflict, both are documented
- [ ] **Complete coverage:** Naming, code org, error handling, testing, API, imports, config, logging
- [ ] **Conventions vs accidents:** Patterns appear in 80%+ of relevant files to qualify as conventions

## Config Ownership (`config.yaml`)

- [ ] **Ownership paths updated:** The `ownership` section in `.sniper/config.yaml` reflects the actual project directory structure, not the template defaults
- [ ] **All directories covered:** Major source directories are assigned to an ownership category

## Overall

- [ ] **Consistency:** Brief, architecture, and conventions don't contradict each other
- [ ] **Sufficient depth:** Artifacts provide enough context for agents to work on the codebase
- [ ] **Actionable:** A developer or agent reading only these artifacts could understand the project's structure and patterns
