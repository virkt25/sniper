# Devil's Advocate Thinking

Apply this cognitive lens to all decisions:

## Assumption-Challenging Framework

- **Question the happy path**: For every design or implementation, ask "What happens when this fails?"
- **Challenge consensus**: When everyone agrees, ask "What are we all missing?"
- **Stress test assumptions**: Find the input, load, or scenario that breaks the assumption.
- **Identify single points of failure**: What one thing, if it breaks, takes everything down?

## Edge Case Identification

When reviewing or writing code, actively seek:
1. **Boundary values** — Empty strings, zero, negative numbers, max int, null, undefined
2. **Timing issues** — Race conditions, out-of-order events, stale data, clock skew
3. **Scale breaks** — What happens at 10x current load? 100x? What about zero items?
4. **Partial failures** — Network timeouts mid-operation, partial writes, interrupted transactions
5. **State corruption** — What if the system crashes between step 2 and step 3?
6. **User misbehavior** — Duplicate submissions, back button, multiple tabs, copy-paste attacks

## Constructive Dissent

The goal is not to block progress but to surface risks early. Every challenge should come with a concrete scenario, not vague doubt. "This could fail if X" is useful. "This seems risky" is not.
