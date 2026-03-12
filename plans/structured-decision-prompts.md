# Structured Decision Prompts

**Status:** Draft
**Scope:** All protocol phases with agent-to-user questions
**Goal:** When agents encounter questions, ambiguities, or decision points during any phase, present the user with structured options — similar to Claude Code's plan mode — instead of dumping free-form text.

## Problem

Today, agents handle uncertainty in two ways:

1. **Silently assume** — The agent picks a direction and keeps going. The user only discovers the choice at review time, when it's expensive to redo.
2. **Free-form text dump** — The agent writes a paragraph explaining the problem and waits. The user must parse the context, formulate a response, and type it out. No options, no recommendation.

Neither is great. The first removes user control. The second creates friction and slows the loop.

## Vision

When an agent hits a decision point, it constructs a **Structured Decision Prompt (SDP)** containing:

1. **Context** — What the agent is working on and what triggered the question
2. **Options** — Numbered list of concrete choices the agent has identified
3. **Recommendation** — Which option the agent recommends and why (marked with a star/indicator)
4. **Escape hatch** — A final option to type a custom response or just discuss it in chat

The user selects an option by number (or types a custom response), and the agent continues with that decision recorded.

### Example

```
┌─────────────────────────────────────────────────────────────┐
│  Decision needed: Authentication strategy                   │
│                                                             │
│  The PRD requires user authentication but doesn't specify   │
│  the mechanism. The codebase currently has no auth.         │
│                                                             │
│  1. JWT with refresh tokens (stateless, scales well)        │
│  2. Session-based auth (simpler, easier to revoke)          │
│  3. OAuth2 with external provider (delegate complexity)     │
│  ★ Recommended: Option 1 — JWT fits the existing API-first │
│    architecture and avoids server-side session state.       │
│                                                             │
│  4. Custom response / discuss further                       │
└─────────────────────────────────────────────────────────────┘
Select an option (1-4):
```

## Design

### SDP Schema

Define a structured format agents use to present decisions. This lives as a schema in `packages/core/schemas/` and as presentation instructions in agent definitions.

```yaml
# packages/core/schemas/decision-prompt.yaml
type: object
required: [id, phase, context, options, recommendation]
properties:
  id:
    type: string
    description: Unique decision ID (D-{phase}-{seq})
  phase:
    type: string
    description: Protocol phase where decision arose
  agent:
    type: string
    description: Agent requesting the decision
  context:
    type: string
    description: 1-3 sentences explaining what triggered the question
  options:
    type: array
    minItems: 2
    items:
      type: object
      required: [label, description]
      properties:
        label:
          type: string
          description: Short option name
        description:
          type: string
          description: 1-2 sentence explanation with trade-offs
  recommendation:
    type: object
    required: [option_index, rationale]
    properties:
      option_index:
        type: integer
        description: 0-based index into options array
      rationale:
        type: string
        description: Why this option is recommended
  escape_hatch:
    type: string
    default: "Custom response / discuss further"
    description: Label for the free-form input option (always last)
```

### Decision Record

Once the user selects an option, the decision is recorded in `.sniper/artifacts/{protocol_id}/decisions.yaml` as a log:

```yaml
decisions:
  - id: D-design-001
    phase: design
    agent: architect
    context: "Authentication strategy for the API"
    selected_option: 0  # JWT with refresh tokens
    custom_response: null  # or free-form text if escape hatch used
    timestamp: 2026-03-11T14:30:00Z
```

This record serves two purposes:
- **Audit trail** — Reviewers can see what decisions were made and why
- **Agent context** — Downstream agents read the decisions file to understand constraints already established

### Where SDPs Can Arise

SDPs are not limited to interactive review gates. They can arise **at any point during agent execution**:

| When | Who | Example |
|------|-----|---------|
| Discovery | Analyst | "Should I focus the competitive analysis on direct competitors only, or include adjacent markets?" |
| Define | Product Manager | "The user story has two valid interpretations — which do you mean?" |
| Design | Architect | "Two viable patterns exist for this — which trade-off do you prefer?" |
| Solve | Product Manager | "This feature could be one story or split into 3 — how granular?" |
| Implement | Fullstack Dev | "The existing API doesn't support X. Should I extend it or create a new endpoint?" |
| Review | Code Reviewer | "This code works but violates convention Y. Block or allow with a note?" |

### Agent Instructions (Mixin)

A cognitive mixin added to all agents that instructs them on when and how to use SDPs:

```markdown
# packages/core/personas/cognitive/structured-decisions.md

## Structured Decision Prompts

When you encounter a question, ambiguity, or fork where the user's intent is unclear and the decision materially affects the outcome:

1. **Do NOT silently assume.** Surface the decision.
2. **Do NOT dump free-form text.** Structure it as a decision prompt.
3. Present your decision using this format:

   **Decision needed: {title}**

   {1-3 sentences of context — what you're working on, what triggered the question}

   1. {Option label} — {1-2 sentence description with trade-offs}
   2. {Option label} — {1-2 sentence description with trade-offs}
   ...
   ★ Recommended: Option {N} — {rationale}

   {N+1}. Custom response / discuss further

4. Wait for the user to select an option before continuing.
5. Record the decision in `.sniper/artifacts/{protocol_id}/decisions.yaml`.

### When NOT to use SDPs

- Trivial decisions with obvious answers (use your judgment)
- Decisions already covered by project conventions, CLAUDE.md, or existing learnings
- Implementation details that don't affect the user-facing outcome
- Questions already answered in the PRD, architecture doc, or prior decisions

### Guidelines

- Keep options to 2-4 choices (plus the escape hatch). More than 5 causes decision fatigue.
- Always include a recommendation. The user hired you for your judgment — give it.
- Make options concrete, not vague. "Use Redis for caching" not "Consider a caching layer."
- Include trade-offs in each option description so the user can make an informed choice.
```

### Integration with Interactive Review

The existing interactive review flow (Approve / Request changes / Edit directly) is itself a structured prompt. SDPs extend this pattern to mid-phase questions. The interactive review gates remain as-is — SDPs complement them, they don't replace them.

When an SDP occurs during a phase:
1. The agent presents the SDP and pauses
2. The user responds
3. The agent records the decision and continues
4. At the phase's interactive review gate, the decisions log is included in the summary so the user sees all decisions that were made

### Integration with Learnings

When a user picks a non-recommended option or uses the escape hatch, the feedback is a candidate for the learning system:

- If the user's choice reveals a preference pattern (e.g., "always prefer simpler approaches"), create a learning with `source.type: human`, `confidence: 0.85`
- Scope the learning to relevant agents and phases
- Future SDPs in similar contexts should factor in learned preferences (potentially changing the recommendation)

### Lead Orchestrator Awareness

The lead orchestrator should:
1. Be aware that agents may pause for SDPs during execution
2. Not treat an SDP pause as a stall or failure
3. Include the decisions log in phase summaries during interactive review
4. When spawning agents, pass the current decisions log so agents don't re-ask settled questions

## Implementation Plan

### Phase 1: Schema & Mixin

1. Create `packages/core/schemas/decision-prompt.yaml` with the SDP schema
2. Create `packages/core/personas/cognitive/structured-decisions.md` with the agent mixin
3. Add the mixin to all agent definitions in `packages/core/agents/*.md` (frontmatter or instructions)

### Phase 2: Agent Instructions

4. Update `packages/core/skills/sniper-flow/SKILL.md` to document SDP behavior:
   - Agents may present SDPs during execution
   - Decisions are logged to `.sniper/artifacts/{protocol_id}/decisions.yaml`
   - Interactive review summaries include the decisions log
5. Update the lead orchestrator to read and relay the decisions log

### Phase 3: Decision Record & Downstream Context

6. Create a decisions template in `packages/core/templates/decisions.yaml`
7. Update agent spawn instructions to include prior decisions as context
8. Update the interactive review section of sniper-flow to summarize decisions made during the phase

### Phase 4: Learning Integration

9. Add decision feedback capture logic to the learning system:
   - Detect patterns when users consistently override recommendations
   - Create learnings scoped to the relevant domain
10. Update the retro-analyst to analyze decision patterns (recommended vs. selected)

### Phase 5: Documentation

11. Add a guide page at `packages/docs/guide/structured-decisions.md`
12. Update the review-gates guide to reference SDPs as a complementary pattern
13. Update the CLI help text if relevant

## Open Questions

- **Batching:** Should agents batch multiple decisions into a single prompt when they arise close together? (Likely yes — reduces context switches)
- **Urgency levels:** Should SDPs have urgency levels (blocking vs. "decide when convenient")? The current design assumes all are blocking.
- **Delegation:** Can the user configure certain decision categories to auto-resolve (e.g., "always pick the recommended option for styling decisions")?

## Non-Goals

- Changing the existing interactive review gate flow (Approve / Request changes / Edit directly)
- Building a UI — this is all terminal/Claude Code native
- Adding SDP support to the CLI tool itself (CLI uses @clack/prompts, which already handles this pattern for initialization)
