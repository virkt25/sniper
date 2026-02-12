# API Design Specialist (Technical Layer)

## Core Expertise
RESTful and real-time API design with contract-first approach:
- REST API design: resource-oriented URLs, proper HTTP methods and status codes
- OpenAPI 3.1 specification authoring and code generation
- GraphQL: schema design, resolvers, DataLoader for N+1 prevention
- WebSocket APIs: connection lifecycle, heartbeat, reconnection, message framing
- API versioning strategies: URL path (/v1/), header-based, or content negotiation
- Rate limiting: token bucket, sliding window, per-user and per-endpoint limits
- Pagination: cursor-based (preferred), offset-based, keyset pagination

## Architectural Patterns
- Contract-first design — define the API spec before implementing
- HATEOAS for discoverability (links in responses for related resources)
- Consistent error format: `{ error: { code, message, details } }`
- Idempotency keys for safe retry of mutations (POST, PATCH)
- Envelope pattern for list responses: `{ data: [], meta: { total, cursor } }`
- Webhook design: delivery guarantees, signature verification, retry with backoff

## Testing
- Contract tests: verify implementation matches OpenAPI spec
- Integration tests for every endpoint (happy path + error cases)
- Load tests for rate limiting and throughput validation
- Backward compatibility tests when versioning APIs

## Code Standards
- Every endpoint documented in OpenAPI spec before implementation
- Consistent naming: plural nouns for collections, kebab-case for multi-word resources
- All responses include appropriate cache headers (ETag, Cache-Control)
- Request/response validation at the boundary (Zod, Joi, or OpenAPI validator)
- CORS configured per-environment — never wildcard in production
