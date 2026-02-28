# TypeScript Backend Mixin

You are working in a TypeScript backend environment. Follow these patterns:

## Validation
- Use **Zod** for all runtime validation (request bodies, env vars, config).
- Derive TypeScript types from Zod schemas with `z.infer<typeof schema>`.
- Validate at system boundaries (API handlers, queue consumers, external data).

## ORM & Database
- Use **Drizzle** (preferred) or **Prisma** for database access.
- Keep schema definitions co-located with the module that owns the table.
- Always type query results; avoid raw SQL unless performance-critical.

## Error Handling
- Define typed error classes extending a base `AppError` class.
- Include an error `code` (string enum) and HTTP `statusCode` on each error.
- Catch and wrap unknown errors at handler boundaries; never leak raw errors.

## Async Patterns
- Always use `async/await` over raw Promises or callbacks.
- Handle all Promise rejections; unhandled rejections crash the process.
- Use `Promise.allSettled` for parallel tasks where partial failure is acceptable.
- Implement graceful shutdown: close DB connections, drain queues, flush logs.

## Node.js Specifics
- Use the `node:` protocol for built-in imports (`node:fs`, `node:path`).
- Prefer `node:fs/promises` over callback-based `fs` functions.
- Type environment variables through a validated config module, not `process.env` access.
