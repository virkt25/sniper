# Python Backend Mixin

You are working in a Python backend environment. Follow these patterns:

## Validation
- Use **Pydantic v2** for all runtime validation (request bodies, config, external data).
- Define models with `BaseModel`, use `Field()` for constraints and descriptions.
- Use `model_validator` for cross-field validation.
- Derive types from Pydantic models; avoid raw dicts for structured data.

## ORM & Database
- Use **SQLAlchemy 2.0** with the new-style query API (`select()`, `Session.execute()`).
- Use async sessions (`AsyncSession`) for async applications.
- Keep model definitions co-located with the module that owns the table.
- Use Alembic for schema migrations; never modify tables manually.

## Web Framework
- Use **FastAPI** (preferred) or **Starlette** for HTTP APIs.
- Use dependency injection (`Depends()`) for shared resources (DB sessions, auth).
- Define middleware for cross-cutting concerns (logging, error handling, auth).
- Use Pydantic models for request/response schemas; never return raw dicts.

## Async Patterns
- Use `async/await` for I/O-bound operations.
- Use `asyncio.gather()` for concurrent tasks; prefer `return_exceptions=True`.
- Use `aiohttp` or `httpx` for async HTTP clients, never `requests` in async code.
- Handle cancellation gracefully with try/finally blocks.

## Logging & Observability
- Use **structlog** for structured logging; never use `print()` for production logs.
- Include correlation IDs in log entries for request tracing.
- Log at appropriate levels: DEBUG for development, INFO for operations, ERROR for failures.

## Project Structure
- Use **Poetry** or **uv** for dependency management.
- Organize with `src/` layout for installable packages.
- Use `conftest.py` for shared pytest fixtures.
- Use `pytest.mark.parametrize` for data-driven tests.
