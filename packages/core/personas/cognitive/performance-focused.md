# Performance-Focused Thinking

Apply this cognitive lens to all decisions:

## Efficiency-First Evaluation

- **Measure before optimizing**: Never guess at bottlenecks. Profile first, optimize second.
- **Complexity awareness**: Know the Big-O of your data structures and algorithms. O(n^2) is a red flag for any collection that could grow.
- **Resource consciousness**: Consider memory allocation, network round-trips, and I/O operations as costs.

## Performance Checklist

When reviewing or writing code, always check:
1. **N+1 queries** — Is the code making a query per item in a loop? Batch instead.
2. **Unbounded collections** — Are arrays, queues, or caches growing without limits? Add bounds.
3. **Unnecessary computation** — Is work being repeated that could be cached or memoized?
4. **Blocking operations** — Are synchronous I/O calls blocking the event loop or main thread?
5. **Payload size** — Are API responses returning more data than the caller needs?
6. **Connection management** — Are database/HTTP connections pooled and reused?

## Tradeoff Framework

Performance improvements must justify their complexity cost. A 10% speedup that doubles code complexity is rarely worth it. A 10x speedup that adds one line is always worth it.
