---
title: Structured Decision Prompts
description: How agents surface questions and decision points during protocol execution
---

# Structured Decision Prompts

Structured Decision Prompts (SDPs) are the mechanism agents use to surface questions, ambiguities, and decision points during any protocol phase. Instead of silently assuming an answer or dumping free-form text, agents present numbered options with a recommendation — similar to Claude Code's plan mode.

## How It Works

When an agent encounters a fork where your intent is unclear and the decision materially affects the outcome, it presents a prompt like this:

```
Decision needed: Authentication strategy

The PRD requires user authentication but doesn't specify the mechanism.
The codebase currently has no auth.

1. JWT with refresh tokens — Stateless, scales well, but requires token
   rotation logic and secure storage on the client.
2. Session-based auth — Simpler to implement and revoke, but requires
   server-side session state and doesn't scale horizontally without Redis.
3. OAuth2 with external provider — Delegates complexity to a third party,
   but adds a vendor dependency and may not fit all deployment environments.
★ Recommended: Option 1 — JWT fits the existing API-first architecture
  and avoids server-side session state.

4. Custom response / discuss further
```

You respond by selecting a number (1-4) or typing a custom response if you chose the last option.

## When SDPs Appear

SDPs can arise at any point during agent execution, not just at interactive review gates:

| Phase | Agent | Example |
|-------|-------|---------|
| discover | Analyst | "Should I focus competitive analysis on direct competitors only, or include adjacent markets?" |
| define | Product Manager | "This user story has two valid interpretations — which do you mean?" |
| design | Architect | "Two viable patterns exist for this — which trade-off do you prefer?" |
| solve | Product Manager | "This feature could be one story or split into 3 — how granular?" |
| implement | Fullstack Dev | "The existing API doesn't support X. Extend it or create a new endpoint?" |
| review | Code Reviewer | "This code works but violates convention Y. Block or allow with a note?" |

## Decision Records

Every resolved SDP is logged to `.sniper/artifacts/{protocol_id}/decisions.yaml`:

```yaml
decisions:
  - id: D-design-001
    phase: design
    agent: architect
    context: "Authentication strategy for the API"
    selected_option: 0  # JWT with refresh tokens
    custom_response: null
    timestamp: 2026-03-11T14:30:00Z
```

This log serves two purposes:

1. **Audit trail** — Reviewers can see what decisions were made and why during interactive review
2. **Agent context** — Downstream agents read the decisions file to avoid re-asking settled questions

## Relationship to Interactive Review

SDPs complement interactive review gates — they don't replace them. Interactive review gates (Approve / Request changes / Edit directly) remain the control points between phases. SDPs handle mid-phase questions that arise during agent execution.

During interactive review, the orchestrator includes a summary of all decisions made during the phase, giving you full visibility into what was decided and why.

## Learning from Decisions

When you pick a non-recommended option or use the escape hatch, the system checks whether your choice reveals a preference pattern. If it does, a learning is created and scoped to relevant agents and phases so that future SDPs factor in your preferences.

The retro-analyst also analyzes decision patterns after protocol completion — tracking recommendation acceptance rates and whether overrides led to better or worse outcomes.

## When Agents Should NOT Use SDPs

Agents are instructed to skip SDPs for:

- Trivial decisions with obvious answers
- Questions already answered by project conventions, CLAUDE.md, or prior decisions
- Implementation details that don't affect the user-facing outcome
- Style preferences already codified in linter config or conventions

## Next Steps

- [Review Gates](/guide/review-gates) — quality gates between phases
- [Signals and Learning](/guide/signals-and-learning) — how the system learns from your feedback
- [Full Lifecycle](/guide/full-lifecycle) — see SDPs in context across the lifecycle
