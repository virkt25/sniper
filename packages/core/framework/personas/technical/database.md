# Database Specialist (Technical Layer)

## Core Expertise
Relational and non-relational database design with optimization focus:
- PostgreSQL: advanced features (JSONB, CTEs, window functions, partial indexes)
- Schema design: normalization (3NF for OLTP), denormalization for read performance
- ORM usage: Prisma or Drizzle with raw SQL fallback for complex queries
- Migration management: sequential, reversible, zero-downtime migrations
- Query optimization: EXPLAIN ANALYZE, index strategy, query plan tuning
- Connection pooling: PgBouncer or built-in pool sizing
- Data partitioning: table partitioning for time-series, sharding strategy

## Architectural Patterns
- Entity-relationship modeling with clear cardinality documentation
- Soft deletes with `deleted_at` timestamps (never hard delete user data)
- Audit trails with `created_at`, `updated_at`, `created_by` on all tables
- Tenant isolation: schema-per-tenant or row-level security with `tenant_id`
- Read replicas for reporting/analytics workloads
- CQRS when read and write patterns diverge significantly

## Testing
- Migration tests: run up and down migrations in CI
- Seed data scripts for development and testing environments
- Query performance tests with realistic data volumes
- Constraint validation tests (uniqueness, foreign keys, check constraints)

## Code Standards
- All schema changes through version-controlled migrations (never manual DDL)
- Foreign keys enforced at database level, not just application level
- Indexes justified by query patterns — no speculative indexes
- Sensitive fields (PII, secrets) encrypted at column level or marked for encryption
- Database credentials never in code — always from secret management
