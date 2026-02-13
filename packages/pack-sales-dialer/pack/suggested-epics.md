# Suggested Epics: AI Sales Dialer

> These are suggested starting points for epic sharding. The scrum master should adapt
> based on the approved PRD, architecture, and UX spec.

---

## Epic 1: Project Foundation & Infrastructure

- **Description**: Set up the monorepo structure, CI/CD pipelines, database schemas, Docker
  environments, and core infrastructure. This is the foundation that all other epics depend on.
  Includes authentication (JWT + OAuth2), multi-tenant data isolation, environment configuration,
  and deployment to staging.

- **Key Stories**:
  - Initialize monorepo with pnpm workspaces (packages: api, web, workers, shared)
  - Set up PostgreSQL database with base schema, migrations (Drizzle ORM or Prisma), and seed data
  - Configure Redis for caching, session store, and pub/sub
  - Build CI/CD pipeline (GitHub Actions): lint, test, build, deploy to staging
  - Implement JWT authentication with refresh tokens, role-based access (admin, manager, rep)
  - Set up Docker Compose for local development (API, web, Postgres, Redis)
  - Configure infrastructure-as-code (Terraform) for AWS: ECS/EKS, RDS, ElastiCache, S3

- **Dependencies**: None (this is the first epic)

- **Estimated Complexity**: L

---

## Epic 2: Multi-Tenant Architecture & Billing

- **Description**: Implement tenant isolation, organization management, user invitation flows,
  and Stripe billing integration. Every subsequent feature must be tenant-aware, so this must
  be solid before feature work begins.

- **Key Stories**:
  - Design and implement tenant isolation (shared database with tenant_id, RLS policies)
  - Build organization settings page (name, logo, timezone, business hours)
  - Implement user invitation and onboarding flow (email invite, role assignment)
  - Integrate Stripe for subscription billing (plans: Starter, Growth, Enterprise)
  - Build usage metering for per-seat and per-minute billing
  - Implement plan-based feature gating (feature flags tied to subscription tier)
  - Build admin panel for tenant management (internal use)

- **Dependencies**: Epic 1 (Foundation)

- **Estimated Complexity**: L

---

## Epic 3: Telephony Core (Twilio Integration)

- **Description**: Integrate Twilio for outbound calling, inbound call handling, number provisioning,
  and call lifecycle management. This is the core telephony engine that the dialer modes build upon.
  Includes WebRTC for browser-based calling and Twilio Media Streams for audio access.

- **Key Stories**:
  - Set up Twilio account integration (subaccounts per tenant or single account with metadata)
  - Implement phone number provisioning (purchase, assign to agents/campaigns, caller ID management)
  - Build outbound call initiation via Twilio REST API with TwiML response handling
  - Implement WebRTC softphone in browser using Twilio Client JS SDK (Device, Connection)
  - Build call lifecycle management (ringing, connected, hold, transfer, hangup, voicemail)
  - Integrate Twilio Media Streams (WebSocket) for real-time audio access
  - Implement call recording via Twilio (dual-channel recording, storage to S3)
  - Build call transfer (warm and cold) and conference bridge for manager join
  - Handle DTMF input for IVR navigation during outbound calls

- **Dependencies**: Epic 1 (Foundation)

- **Estimated Complexity**: XL

---

## Epic 4: Contact Management & List Engine

- **Description**: Build the contact database, list management, CSV import/export, contact
  deduplication, and the prioritized call queue. This feeds contacts to the dialer engine.

- **Key Stories**:
  - Design contact data model (contacts, lists, list_memberships, contact_phones, contact_tags)
  - Build contact CRUD API and search (full-text search with pg_trgm or Elasticsearch)
  - Implement CSV import with field mapping UI, validation, and error reporting
  - Build list management (create, edit, filter, smart lists based on criteria)
  - Implement contact deduplication engine (phone E.164 matching, email matching, fuzzy name)
  - Build call queue prioritization (sort by last called, time zone, priority score, lead score)
  - Implement timezone-aware dialing windows (only queue contacts in callable hours)
  - Build DNC (Do Not Call) list management (internal DNC + integration points for external DNC)
  - Implement contact activity timeline (all calls, emails, CRM syncs for a contact)

- **Dependencies**: Epic 1 (Foundation), Epic 2 (Multi-Tenant)

- **Estimated Complexity**: L

---

## Epic 5: Power & Parallel Dialer Engine

- **Description**: Build the core dialing modes — single-line, power dialer (auto-advance), and
  parallel dialer (multi-line). Includes answering machine detection (AMD), voicemail drop,
  disposition handling, and the agent dialing session state machine.

- **Key Stories**:
  - Design the dialer session state machine (idle, dialing, ringing, connected, wrap-up, paused)
  - Implement single-line dialer (click-to-call from contact list, manual advance)
  - Build power dialer mode (auto-dial next contact after disposition, configurable delay)
  - Implement parallel dialer (dial N lines simultaneously, connect first live answer to agent)
  - Integrate Twilio AMD (answering machine detection) with configurable speed/accuracy settings
  - Build voicemail drop feature (pre-recorded messages, auto-drop on machine detection)
  - Implement disposition workflow (disposition picker, required fields, auto-advance on submit)
  - Build callback scheduling (schedule a callback, auto-queue at scheduled time)
  - Implement local presence dialing (match caller ID area code to prospect's area code)
  - Build campaign management (create campaign, assign lists, set dialer mode, configure settings)

- **Dependencies**: Epic 3 (Telephony Core), Epic 4 (Contact Management)

- **Estimated Complexity**: XL

---

## Epic 6: CRM Integration (Salesforce, HubSpot & Follow Up Boss)

- **Description**: Build the CRM integration layer — OAuth/API-key connection flows, bi-directional
  sync, activity auto-logging, field mapping UI, and sync health monitoring. Supports Salesforce,
  HubSpot, and Follow Up Boss as launch CRMs.

- **Key Stories**:
  - Build CRM OAuth connection flow (Salesforce Connected App, HubSpot OAuth2)
  - Build Follow Up Boss API-key/OAuth connection flow and People sync
  - Implement contact sync engine: CRM-to-dialer (import contacts, subscribe to CDC/webhooks)
  - Implement activity sync engine: dialer-to-CRM (auto-log calls as Tasks/Engagements/Events)
  - Build field mapping configuration UI (map dialer fields to CRM fields per tenant)
  - Implement conflict resolution engine (CRM-wins, dialer-wins, last-write-wins per field)
  - Build batch sync for historical data import (Salesforce Bulk API 2.0, HubSpot batch endpoints, FUB pagination)
  - Implement sync health dashboard (sync status, error rates, pending records, last sync time)
  - Build disposition-to-CRM mapping configuration (map dialer dispositions to CRM picklist values)
  - Implement call recording URL sync to CRM (signed URL generation, link in CRM activity)
  - Build FUB-specific stage mapping (FUB stages vs lead status in Salesforce/HubSpot)

- **Dependencies**: Epic 3 (Telephony Core), Epic 4 (Contact Management)

- **Estimated Complexity**: XL

---

## Epic 7: Call Recording & Storage

- **Description**: Build the call recording infrastructure — dual-channel recording, secure storage
  in S3, playback UI, recording consent handling, and recording access controls. This is a
  prerequisite for the AI pipeline which processes recordings.

- **Key Stories**:
  - Implement dual-channel call recording via Twilio (agent + prospect on separate channels)
  - Build S3 storage pipeline (upload recordings, organize by tenant/date, lifecycle policies)
  - Implement recording playback UI with waveform visualization and speaker separation
  - Build recording access controls (who can listen: agent, manager, admin; audit log)
  - Implement recording consent handling (one-party vs two-party states, consent announcement)
  - Build recording retention policies (configurable per tenant, auto-delete after expiry)
  - Implement recording search and filtering (by agent, campaign, disposition, date, duration)
  - Build recording download with watermarking (tenant name, timestamp in audio metadata)

- **Dependencies**: Epic 3 (Telephony Core), Epic 1 (Foundation — S3 infrastructure)

- **Estimated Complexity**: M

---

## Epic 8: AI Pipeline (STT, Sentiment, Scoring)

- **Description**: Build the AI/ML pipeline — real-time speech-to-text via Deepgram (default)
  and OpenAI Realtime API (premium), sentiment analysis per utterance, configurable call scoring
  rubrics, post-call summarization, and action item extraction. This powers both real-time
  coaching and post-call intelligence.

- **Key Stories**:
  - Integrate Deepgram streaming STT (WebSocket connection, audio format conversion from Twilio)
  - Integrate OpenAI Realtime API as premium STT+AI provider (combined transcription and analysis)
  - Build transcript processor (speaker labeling, utterance segmentation, timestamp alignment)
  - Implement real-time sentiment analysis engine (per-utterance classification via LLM)
  - Build configurable call scoring rubric system (categories, criteria, weights, per-tenant config)
  - Implement post-call scoring engine (LLM-based comprehensive analysis against rubric)
  - Build post-call summarization (LLM: summary, key points, objections, next steps)
  - Implement action item extraction and auto-creation of CRM tasks
  - Build deal risk signal detection (analyze conversation patterns across multiple calls)
  - Implement transcript storage and search (full-text search across call transcripts)
  - Build AI model abstraction layer (swap STT/LLM providers without business logic changes)
  - Build AI voicemail agent using OpenAI Realtime conversational mode (AMD → dynamic voicemail)

- **Dependencies**: Epic 3 (Telephony Core), Epic 7 (Call Recording)

- **Estimated Complexity**: XL

---

## Epic 9: Real-Time Coaching UI

- **Description**: Build the agent-facing real-time coaching interface — live transcript display,
  talk ratio indicator, sentiment gauge, coaching prompt cards, objection detection with suggested
  responses, and filler word alerts. All delivered via WebSocket with sub-second latency.

- **Key Stories**:
  - Build live transcript panel (scrolling transcript with speaker color coding, interim results)
  - Implement talk ratio indicator (real-time gauge: agent % vs prospect %, color-coded thresholds)
  - Build coaching prompt card system (dismissible cards, priority levels, auto-expire)
  - Implement objection detection UI (detected objection + 2-3 suggested responses)
  - Build filler word and pace alerts (subtle notifications, cumulative count display)
  - Implement sentiment indicator (rolling sentiment gauge for prospect mood)
  - Build post-call review screen (score breakdown, transcript with highlights, action items)
  - Implement coaching prompt throttling (max frequency, priority queue, context-aware timing)

- **Dependencies**: Epic 8 (AI Pipeline), Epic 5 (Dialer Engine — agent session UI)

- **Estimated Complexity**: L

---

## Epic 10: Compliance Engine (TCPA, DNC, Consent)

- **Description**: Build the compliance layer — TCPA calling hour enforcement, federal and state
  DNC registry integration, calling consent management, recording consent by jurisdiction,
  and compliance audit logging. Non-negotiable for a production sales dialer.

- **Key Stories**:
  - Implement TCPA calling hour enforcement (federal 8am-9pm + state-specific rules, timezone-aware)
  - Build DNC registry integration (check against federal DNC list, state DNC lists)
  - Implement internal DNC management (add/remove contacts, DNC reasons, bulk DNC import)
  - Build consent management (express consent tracking, consent type: TCPA, recording, marketing)
  - Implement call frequency caps (max attempts per contact per day/week, configurable per campaign)
  - Build recording consent announcement (auto-play consent recording for two-party consent states)
  - Implement compliance audit log (every call attempt logged with compliance check results)
  - Build compliance dashboard (DNC violations, calling hour violations, consent gaps)
  - Implement abandoned call ratio monitoring (TCPA requires <3% for predictive dialers)

- **Dependencies**: Epic 4 (Contact Management), Epic 5 (Dialer Engine)

- **Estimated Complexity**: L

---

## Epic 11: Analytics & Dashboards

- **Description**: Build the analytics layer — call metrics aggregation, rep scorecards, team
  leaderboards, pipeline attribution, time-series storage, and interactive dashboard UI.
  Includes real-time dashboards via WebSocket and scheduled email reports.

- **Key Stories**:
  - Build metrics aggregation pipeline (Redis counters for real-time, PostgreSQL materialized views for historical)
  - Implement agent daily/weekly scorecard (activity metrics, quality metrics, outcome metrics)
  - Build team leaderboard with real-time updates (sortable by calls, connects, meetings, score)
  - Implement campaign performance dashboard (per-campaign metrics, A/B comparison)
  - Build pipeline attribution funnel (calls -> connects -> meetings -> opportunities -> closed/won)
  - Implement call time heatmap (best times to call by day/hour based on connect rates)
  - Build coaching opportunities detection (surface agents needing coaching based on metric thresholds)
  - Implement scheduled report generation and email delivery (daily summary, weekly scorecard)
  - Build CSV/Excel export for all dashboard views
  - Implement date range picker with comparison mode (vs previous period, vs same period last year)

- **Dependencies**: Epic 5 (Dialer Engine — call data), Epic 8 (AI Pipeline — scores/sentiment)

- **Estimated Complexity**: L

---

## Epic 12: Manager Tools (Monitoring, Whisper, Barge)

- **Description**: Build manager-specific tools — live call monitoring (listen-only), whisper mode
  (speak to agent only), barge mode (join the call), call queue visibility, and team management
  features. Enables managers to coach reps in real-time and manage team operations.

- **Key Stories**:
  - Build live call monitor (see all active calls: agent, prospect, duration, sentiment, score)
  - Implement listen mode (manager joins call in listen-only, prospect and agent unaware)
  - Build whisper mode (manager speaks to agent only, prospect cannot hear)
  - Implement barge mode (manager joins as third party, all participants can hear)
  - Build call takeover (manager replaces agent on the call)
  - Implement manager notification triggers (alert when agent sentiment drops, score is low, long silence)
  - Build team schedule management (set dialing hours per rep, shift schedules, availability)
  - Implement call quality review queue (flagged calls for manager review, bulk scoring)
  - Build agent performance comparison view (side-by-side metrics for two or more agents)

- **Dependencies**: Epic 3 (Telephony Core), Epic 5 (Dialer Engine), Epic 8 (AI Pipeline)

- **Estimated Complexity**: L

---

## Epic Dependency Graph

```
Epic 1: Foundation
  ├── Epic 2: Multi-Tenant & Billing
  │     └── Epic 4: Contact Management ──┐
  ├── Epic 3: Telephony Core ────────────┤
  │     ├── Epic 7: Call Recording       │
  │     │     └── Epic 8: AI Pipeline    │
  │     │           ├── Epic 9: Coaching UI
  │     │           ├── Epic 11: Analytics
  │     │           └── Epic 12: Manager Tools
  │     └── Epic 12: Manager Tools       │
  └── Epic 4: Contact Management         │
        ├── Epic 5: Dialer Engine ◄──────┘
        │     ├── Epic 9: Coaching UI
        │     ├── Epic 10: Compliance
        │     ├── Epic 11: Analytics
        │     └── Epic 12: Manager Tools
        └── Epic 6: CRM Integration (SF/HS/FUB)
              └── Epic 11: Analytics (pipeline attribution)
```

## Suggested Sprint Ordering

| Sprint | Epics | Focus |
|--------|-------|-------|
| Sprint 1 | Epic 1 | Foundation, CI/CD, auth, database |
| Sprint 2 | Epic 2 + Epic 3 (start) | Multi-tenant, telephony basics |
| Sprint 3 | Epic 3 (finish) + Epic 4 | Telephony complete, contact management |
| Sprint 4 | Epic 5 + Epic 7 | Dialer engine, call recording |
| Sprint 5 | Epic 6 + Epic 8 (start) | CRM integration, AI pipeline basics |
| Sprint 6 | Epic 8 (finish) + Epic 10 | AI pipeline complete, compliance |
| Sprint 7 | Epic 9 + Epic 11 | Coaching UI, analytics dashboards |
| Sprint 8 | Epic 12 + hardening | Manager tools, polish, performance |

> Note: Sprints assume 2-week duration with a full team. Adjust based on team size
> and velocity after Sprint 1.
