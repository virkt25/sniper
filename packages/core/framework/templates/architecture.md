# System Architecture: {project_name}

> **Version:** 1
> **Status:** Draft
> **Last Updated:** {date}
> **Author:** Planning Team — Architect
> **Source:** `docs/prd.md`, `docs/brief.md`
> **Change Log:**
> - v1 ({date}): Initial version

## 1. Architecture Overview
<!-- sniper:managed:overview:start -->
<!-- High-level system description. Include an ASCII or Mermaid component diagram. -->
<!-- sniper:managed:overview:end -->

## 2. Technology Choices
<!-- sniper:managed:technology-choices:start -->
| Component | Choice | Why | Alternatives Considered |
|-----------|--------|-----|------------------------|
| Language | | | |
| Frontend | | | |
| Backend | | | |
| Database | | | |
| Cache | | | |
| Queue | | | |
| Infrastructure | | | |
<!-- sniper:managed:technology-choices:end -->

## 3. Component Architecture
<!-- sniper:managed:components:start -->
<!-- Describe each major component, its responsibility, and its interfaces -->

### 3.1 {Component Name}
- **Responsibility:**
- **Interfaces:**
- **Dependencies:**
<!-- sniper:managed:components:end -->

## 4. Data Models
<!-- sniper:managed:data-models:start -->
<!-- Entity-relationship descriptions with field types, constraints, indexes -->

### 4.1 {Entity Name}
| Field | Type | Constraints | Index | Notes |
|-------|------|------------|-------|-------|
| | | | | |
<!-- sniper:managed:data-models:end -->

## 5. API Contracts
<!-- sniper:managed:api-contracts:start -->
<!-- RESTful endpoints with methods, paths, request/response payloads -->

### 5.1 {Resource}
```
METHOD /api/v1/{resource}
Request: { }
Response: { }
Status Codes: 200, 400, 401, 404, 500
Auth: Required
```
<!-- sniper:managed:api-contracts:end -->

## 6. Infrastructure Topology
<!-- sniper:managed:infrastructure:start -->
<!-- Compute, storage, networking, scaling strategy -->
<!-- sniper:managed:infrastructure:end -->

## 7. Cross-Cutting Concerns

<!-- sniper:managed:cross-cutting:start -->
### 7.1 Authentication & Authorization
### 7.2 Logging & Monitoring
### 7.3 Error Handling
### 7.4 Configuration Management
<!-- sniper:managed:cross-cutting:end -->

## 8. Non-Functional Requirements
<!-- sniper:managed:nfr:start -->
| Requirement | Target | Strategy |
|-------------|--------|----------|
| Response time (p95) | | |
| Availability | | |
| Throughput | | |
| Data retention | | |
<!-- sniper:managed:nfr:end -->

## 9. Migration & Deployment Strategy
<!-- sniper:managed:deployment:start -->
<!-- How the system gets deployed. CI/CD, blue-green, rollback strategy. -->
<!-- sniper:managed:deployment:end -->

## 10. Security Architecture
<!-- sniper:managed:security:start -->
<!-- Reference docs/security.md for detailed security requirements -->
<!-- sniper:managed:security:end -->
