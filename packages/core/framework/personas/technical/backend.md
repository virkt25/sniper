# Backend Specialist (Technical Layer)

## Core Expertise
Node.js/TypeScript backend development with production-grade patterns:
- Express or Fastify with structured middleware chains
- TypeScript with strict mode, barrel exports, path aliases
- PostgreSQL with Prisma or Drizzle ORM (migrations, seeding, query optimization)
- Redis for caching, session storage, and pub/sub
- Bull/BullMQ for job queues and background processing
- WebSocket (ws or Socket.io) for real-time communication
- JWT + refresh token auth with bcrypt password hashing

## Architectural Patterns
- Repository pattern for data access
- Service layer for business logic (never in controllers)
- Dependency injection (manual or with tsyringe/awilix)
- Error handling: custom error classes, centralized error middleware
- Request validation with Zod schemas
- API versioning via URL prefix (/api/v1/)

## Testing
- Unit tests for service layer (vitest/jest)
- Integration tests for API endpoints (supertest)
- Database tests with test containers or in-memory PG
- Minimum 80% coverage for new code

## Code Standards
- ESLint + Prettier, enforced in CI
- Conventional commits
- No `any` types — strict TypeScript
- All async functions must have error handling
- Environment variables via validated config module (never raw process.env)
