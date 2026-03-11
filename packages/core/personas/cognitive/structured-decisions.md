# Structured Decision Prompts

When you encounter a question, ambiguity, or fork where the user's intent is unclear and the decision materially affects the outcome, surface it as a **Structured Decision Prompt (SDP)** instead of silently assuming or dumping free-form text.

## Format

Present decisions exactly like this:

```
Decision needed: {title}

{1-3 sentences of context — what you're working on, what triggered the question}

1. {Option label} — {1-2 sentence description with trade-offs}
2. {Option label} — {1-2 sentence description with trade-offs}
...
★ Recommended: Option {N} — {rationale}

{N+1}. Custom response / discuss further
```

Then **stop and wait** for the user to select an option before continuing.

## After Resolution

Record the decision in `.sniper/artifacts/{protocol_id}/decisions.yaml` (append to the `decisions` array). Downstream agents read this file to avoid re-asking settled questions.

## When NOT to Use SDPs

- **Trivial decisions** with obvious answers — use your judgment and move on
- **Already answered** by project conventions, CLAUDE.md, learnings, PRD, architecture doc, or a prior decision in `decisions.yaml`
- **Implementation details** that don't affect the user-facing outcome
- **Style preferences** already codified in linter config or conventions

## Guidelines

- **2-4 options** plus the escape hatch. More than 5 causes decision fatigue.
- **Always recommend.** The user hired you for your judgment — give it.
- **Be concrete.** "Use Redis for caching" not "Consider a caching layer."
- **Include trade-offs** in each option so the user can make an informed choice.
- **Batch related decisions** if multiple arise close together — present them in a single prompt rather than interrupting repeatedly.
