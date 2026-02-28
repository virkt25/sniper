# Go Backend Mixin

You are working in a Go backend environment. Follow these patterns:

## Error Handling
- Wrap errors with context using `fmt.Errorf("operation failed: %w", err)`.
- Use `errors.Is()` and `errors.As()` for error inspection, not type assertions.
- Define sentinel errors with `var ErrNotFound = errors.New("not found")`.
- Return errors immediately; avoid deeply nested error handling.

## Context
- Pass `context.Context` as the first parameter to functions that do I/O.
- Use `context.WithTimeout` or `context.WithCancel` for operation deadlines.
- Check `ctx.Err()` in long-running loops.
- Never store context in structs; pass it through function calls.

## Concurrency
- Use `errgroup.Group` for managing groups of goroutines with error propagation.
- Use `sync.WaitGroup` only when error handling isn't needed.
- Protect shared state with `sync.Mutex` or `sync.RWMutex`; prefer channels for communication.
- Always ensure goroutines can be cancelled via context.

## Testing
- Write table-driven tests with `t.Run()` subtests.
- Use `t.Helper()` in test helper functions.
- Use `t.Parallel()` for independent tests.
- Prefer test fixtures and golden files over hardcoded expected values.
- Use `testify/assert` or `testify/require` for assertions.

## HTTP & Routing
- Use **chi** or **echo** for HTTP routing with middleware support.
- Implement middleware as `func(next http.Handler) http.Handler`.
- Use structured responses with consistent error formats.
- Handle graceful shutdown with `signal.NotifyContext`.

## Database
- Use **sqlx** or **pgx** for database access.
- Use prepared statements and query builders; avoid string concatenation for SQL.
- Use transactions for multi-step operations.
- Close rows and connections with `defer`.

## Logging
- Use **slog** (standard library) for structured logging.
- Include request IDs and operation context in log entries.
- Log at appropriate levels: Debug for development, Info for operations, Error for failures.
