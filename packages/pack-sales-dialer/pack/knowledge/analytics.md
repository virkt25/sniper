# Analytics & Metrics Domain Context

This context teaches you how to build the analytics layer for a sales dialer. You need this
knowledge when implementing call metrics, rep performance tracking, team dashboards, pipeline
attribution, time-series data storage, and real-time dashboard UIs.

---

## Call Metrics

### Core Call Metrics

These are the fundamental metrics every sales dialer must track:

| Metric | Definition | Formula |
|--------|-----------|---------|
| **Connect Rate** | Percentage of calls that reach a live person | `connected_calls / total_calls * 100` |
| **Talk Time (avg)** | Average duration of connected calls | `SUM(talk_duration) / COUNT(connected_calls)` |
| **Talk Time (median)** | Median duration — less skewed by outliers | `PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY talk_duration)` |
| **Calls Per Hour** | Agent throughput | `total_calls / active_dialing_hours` |
| **Disposition Breakdown** | Distribution across outcomes | `COUNT(*) GROUP BY disposition` |
| **Voicemail Drop Rate** | Percentage of calls where VM was dropped | `vm_drops / total_calls * 100` |
| **Callback Conversion** | Callbacks that result in a connection | `callbacks_connected / callbacks_attempted * 100` |
| **Abandon Rate** | Calls abandoned before agent connects (parallel dialer) | `abandoned_calls / connected_calls * 100` |
| **Wait Time (avg)** | Time prospect waits before agent picks up | `AVG(agent_connect_time - prospect_answer_time)` |
| **Wrap-up Time** | Time agent spends in after-call work | `AVG(wrap_end_time - call_end_time)` |

### Disposition Categories

Standard disposition taxonomy:

| Category | Dispositions | Counts As |
|----------|-------------|-----------|
| **Connected** | Connected, Meeting Booked, Interested, Not Interested | Connected call |
| **No Contact** | No Answer, Busy, Voicemail, Disconnected | Non-connected attempt |
| **Invalid** | Wrong Number, Bad Number, DNC | Contact quality issue |
| **System** | AMD Failed, Call Error, Dropped | System issue |

### Call Metrics Data Model

```sql
-- Materialized view for fast metric queries (refreshed every minute)
CREATE MATERIALIZED VIEW call_metrics_hourly AS
SELECT
  tenant_id,
  date_trunc('hour', started_at) AS hour,
  campaign_id,
  agent_id,
  COUNT(*) AS total_calls,
  COUNT(*) FILTER (WHERE disposition_category = 'connected') AS connected_calls,
  COUNT(*) FILTER (WHERE disposition = 'Meeting Booked') AS meetings_booked,
  COUNT(*) FILTER (WHERE disposition = 'Voicemail') AS voicemails,
  COUNT(*) FILTER (WHERE disposition_category = 'no_contact') AS no_contacts,
  COUNT(*) FILTER (WHERE disposition_category = 'invalid') AS invalid_numbers,
  AVG(talk_duration_seconds) FILTER (WHERE disposition_category = 'connected') AS avg_talk_time,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY talk_duration_seconds)
    FILTER (WHERE disposition_category = 'connected') AS median_talk_time,
  SUM(talk_duration_seconds) AS total_talk_time,
  AVG(wait_time_seconds) FILTER (WHERE disposition_category = 'connected') AS avg_wait_time,
  AVG(wrapup_duration_seconds) AS avg_wrapup_time
FROM calls
WHERE started_at >= now() - INTERVAL '90 days'
GROUP BY tenant_id, hour, campaign_id, agent_id;

CREATE UNIQUE INDEX idx_metrics_hourly
  ON call_metrics_hourly(tenant_id, hour, campaign_id, agent_id);

-- Refresh concurrently (non-blocking) every minute via pg_cron or application scheduler
REFRESH MATERIALIZED VIEW CONCURRENTLY call_metrics_hourly;
```

### Real-Time Metric Aggregation

For real-time dashboards (sub-second updates), maintain counters in Redis:

```typescript
// Redis key patterns for real-time metrics
const KEYS = {
  // Per-agent counters (reset daily)
  agentCalls: (tenantId: string, agentId: string, date: string) =>
    `metrics:${tenantId}:agent:${agentId}:${date}:calls`,
  agentConnects: (tenantId: string, agentId: string, date: string) =>
    `metrics:${tenantId}:agent:${agentId}:${date}:connects`,
  agentTalkTime: (tenantId: string, agentId: string, date: string) =>
    `metrics:${tenantId}:agent:${agentId}:${date}:talk_time`,
  agentMeetings: (tenantId: string, agentId: string, date: string) =>
    `metrics:${tenantId}:agent:${agentId}:${date}:meetings`,

  // Per-campaign counters
  campaignCalls: (tenantId: string, campaignId: string, date: string) =>
    `metrics:${tenantId}:campaign:${campaignId}:${date}:calls`,

  // Team-level (aggregate of agents)
  teamCalls: (tenantId: string, teamId: string, date: string) =>
    `metrics:${tenantId}:team:${teamId}:${date}:calls`,

  // Disposition hash (per-agent per-day)
  agentDispositions: (tenantId: string, agentId: string, date: string) =>
    `metrics:${tenantId}:agent:${agentId}:${date}:dispositions`,
};

// On each call completion, atomically update counters
async function recordCallMetrics(redis: Redis, call: CompletedCall): Promise<void> {
  const date = formatDate(call.startedAt); // "2024-01-15"
  const pipe = redis.pipeline();

  // Increment call count
  pipe.incr(KEYS.agentCalls(call.tenantId, call.agentId, date));
  pipe.incr(KEYS.campaignCalls(call.tenantId, call.campaignId, date));
  pipe.incr(KEYS.teamCalls(call.tenantId, call.teamId, date));

  // Track disposition
  pipe.hincrby(KEYS.agentDispositions(call.tenantId, call.agentId, date),
    call.disposition, 1);

  if (call.dispositionCategory === 'connected') {
    pipe.incr(KEYS.agentConnects(call.tenantId, call.agentId, date));
    pipe.incrby(KEYS.agentTalkTime(call.tenantId, call.agentId, date),
      call.talkDurationSeconds);
  }

  if (call.disposition === 'Meeting Booked') {
    pipe.incr(KEYS.agentMeetings(call.tenantId, call.agentId, date));
  }

  // Set TTL for auto-cleanup (7 days for daily keys)
  const ttl = 7 * 24 * 60 * 60;
  pipe.expire(KEYS.agentCalls(call.tenantId, call.agentId, date), ttl);
  // ... set TTL for all keys

  await pipe.exec();
}
```

---

## Rep Performance

### Daily/Weekly Scorecards

A rep scorecard aggregates multiple metrics into a single performance view:

```typescript
interface RepScorecard {
  agentId: string;
  agentName: string;
  period: 'daily' | 'weekly' | 'monthly';
  periodStart: Date;
  periodEnd: Date;

  // Activity Metrics
  totalCalls: number;
  connectedCalls: number;
  connectRate: number;                   // percentage
  callsPerHour: number;
  totalTalkTimeMinutes: number;
  avgTalkTimeSeconds: number;
  meetingsBooked: number;

  // Quality Metrics (from AI pipeline)
  avgCallScore: number;                  // 0-100
  callScoreTrend: number;               // delta from previous period
  avgSentimentScore: number;            // -1.0 to 1.0
  fillerWordRate: number;               // per 100 words
  avgTalkRatio: number;                 // agent talk percentage

  // Outcome Metrics
  meetingBookedRate: number;            // meetings / connected calls
  positiveDispositionRate: number;      // positive outcomes / total calls
  callbackConversionRate: number;       // callbacks connected / callbacks attempted

  // Rankings
  teamRank: number;                     // rank within team
  teamSize: number;
  percentile: number;                   // performance percentile
}
```

### Talk Ratio Trends

Track how an agent's talk ratio changes over time:

```sql
SELECT
  agent_id,
  date_trunc('day', c.started_at) AS day,
  AVG(cs.agent_talk_ratio) AS avg_agent_talk_ratio,
  AVG(cs.prospect_talk_ratio) AS avg_prospect_talk_ratio,
  COUNT(*) AS call_count
FROM calls c
JOIN call_scores cs ON cs.call_id = c.id
WHERE c.tenant_id = $1
  AND c.agent_id = $2
  AND c.started_at >= $3
  AND c.started_at < $4
  AND cs.agent_talk_ratio IS NOT NULL
GROUP BY agent_id, day
ORDER BY day;
```

Ideal trend: agent talk ratio decreasing toward 40-50% as they improve listening skills.

### Sentiment Trends

Track average prospect sentiment per agent over time to measure rapport-building:

```sql
SELECT
  agent_id,
  date_trunc('week', c.started_at) AS week,
  AVG(cs.prospect_sentiment_avg) AS avg_prospect_sentiment,
  AVG(cs.overall_sentiment_score) AS avg_overall_sentiment,
  COUNT(*) FILTER (WHERE cs.prospect_sentiment_avg > 0.3) AS positive_calls,
  COUNT(*) FILTER (WHERE cs.prospect_sentiment_avg < -0.3) AS negative_calls,
  COUNT(*) AS total_scored_calls
FROM calls c
JOIN call_analysis cs ON cs.call_id = c.id
WHERE c.tenant_id = $1
  AND c.started_at >= $2
GROUP BY agent_id, week
ORDER BY agent_id, week;
```

### Score Progression

Track how AI call scores improve over time (indicates coaching effectiveness):

```sql
-- Rolling 7-day average score per agent
SELECT
  agent_id,
  call_date,
  avg_score,
  AVG(avg_score) OVER (
    PARTITION BY agent_id
    ORDER BY call_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) AS rolling_7day_avg
FROM (
  SELECT
    c.agent_id,
    date_trunc('day', c.started_at) AS call_date,
    AVG(cs.total_score) AS avg_score
  FROM calls c
  JOIN call_scores cs ON cs.call_id = c.id
  WHERE c.tenant_id = $1
    AND c.started_at >= now() - INTERVAL '90 days'
  GROUP BY c.agent_id, date_trunc('day', c.started_at)
) daily_scores
ORDER BY agent_id, call_date;
```

---

## Team and Manager Views

### Team Leaderboard

Real-time leaderboard showing all reps ranked by key metrics:

```typescript
interface LeaderboardEntry {
  rank: number;
  agentId: string;
  agentName: string;
  avatarUrl?: string;
  isOnline: boolean;
  currentStatus: 'idle' | 'dialing' | 'on_call' | 'wrap_up' | 'offline';

  // Today's stats
  callsToday: number;
  connectsToday: number;
  connectRate: number;
  meetingsToday: number;
  talkTimeMinutes: number;
  avgCallScore: number;

  // Streak/gamification
  meetingStreak: number;                // consecutive calls with meetings
  dailyGoalProgress: number;            // percentage of daily call goal
}

interface TeamLeaderboard {
  teamId: string;
  teamName: string;
  updatedAt: Date;
  sortedBy: 'calls' | 'connects' | 'meetings' | 'score';
  entries: LeaderboardEntry[];

  // Team aggregates
  teamTotalCalls: number;
  teamConnectRate: number;
  teamMeetings: number;
  teamAvgScore: number;
}
```

### Coaching Opportunities

Surface agents who need coaching based on metrics:

```typescript
interface CoachingOpportunity {
  agentId: string;
  agentName: string;
  issue: CoachingIssue;
  severity: 'low' | 'medium' | 'high';
  metric: string;
  currentValue: number;
  targetValue: number;
  trend: 'improving' | 'declining' | 'flat';
  suggestedAction: string;
  relatedCalls: string[];              // call IDs for manager review
}

type CoachingIssue =
  | 'low_connect_rate'
  | 'low_call_score'
  | 'high_talk_ratio'
  | 'low_meeting_rate'
  | 'high_filler_words'
  | 'declining_sentiment'
  | 'below_call_volume'
  | 'long_wrap_time';
```

Detection rules:

| Issue | Trigger | Suggested Action |
|-------|---------|-----------------|
| Low connect rate | <15% over 2 days | Review call timing, check list quality |
| Low call score | Avg score <60 for 1 week | Schedule 1:1 coaching, review low-scoring calls |
| High talk ratio | >65% agent talk for 1 week | Practice active listening exercises |
| Low meeting rate | <5% meeting-booked rate | Review closing technique, offer talk track |
| High filler words | >8 per 100 words | Awareness training, practice pausing |
| Declining sentiment | Prospect sentiment trending down | Review call recordings, identify pattern |
| Below volume | <80% of daily call goal for 3 days | Check for blockers, adjust workload |
| Long wrap time | >3 min avg wrap-up | Streamline disposition workflow, train on CRM |

### Activity Compliance

Track whether reps are meeting minimum activity requirements:

```typescript
interface ActivityCompliance {
  agentId: string;
  date: Date;

  // Targets (configurable per team/role)
  targets: {
    minCalls: number;                   // e.g., 80 calls/day
    minConnects: number;                // e.g., 15 connects/day
    minTalkMinutes: number;             // e.g., 120 minutes/day
    maxIdleMinutes: number;             // e.g., 30 minutes total idle
    minDialingHours: number;            // e.g., 5 hours active dialing
  };

  // Actuals
  actuals: {
    calls: number;
    connects: number;
    talkMinutes: number;
    idleMinutes: number;
    dialingHours: number;
  };

  // Compliance percentage per metric
  compliance: {
    calls: number;                      // actuals.calls / targets.minCalls * 100
    connects: number;
    talkTime: number;
    idle: number;                       // inverted: lower idle = higher compliance
    dialingTime: number;
  };

  overallCompliance: number;            // weighted average
  isCompliant: boolean;                 // all targets met
}
```

---

## Pipeline Attribution

### Call-to-Revenue Attribution

Track the full funnel from dialer calls to closed revenue:

```
Calls → Connects → Meetings Booked → Opportunities Created → Proposals Sent → Closed/Won
```

Attribution data model:

```sql
CREATE TABLE pipeline_attribution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  crm_contact_id TEXT,

  -- Call data
  first_call_id UUID REFERENCES calls(id),
  first_call_at TIMESTAMPTZ,
  total_calls INT DEFAULT 0,
  total_connects INT DEFAULT 0,
  total_talk_minutes FLOAT DEFAULT 0,

  -- Funnel stages (timestamps when each stage was reached)
  first_connected_at TIMESTAMPTZ,
  meeting_booked_at TIMESTAMPTZ,
  meeting_booked_call_id UUID REFERENCES calls(id),
  opportunity_created_at TIMESTAMPTZ,
  opportunity_crm_id TEXT,
  proposal_sent_at TIMESTAMPTZ,
  closed_won_at TIMESTAMPTZ,
  closed_lost_at TIMESTAMPTZ,

  -- Revenue
  deal_amount DECIMAL(12,2),
  deal_currency TEXT DEFAULT 'USD',

  -- Attribution source
  lead_source TEXT,                     -- e.g., "Marketing", "Inbound", "Outbound"
  campaign_id UUID,
  campaign_name TEXT,
  list_id UUID,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_attribution_tenant_funnel
  ON pipeline_attribution(tenant_id, first_call_at);
CREATE INDEX idx_attribution_campaign
  ON pipeline_attribution(tenant_id, campaign_id);
```

### Marketing Lead Source Tracking

Track which marketing lead sources produce the best dialer outcomes:

```sql
-- Lead source performance report
SELECT
  pa.lead_source,
  COUNT(DISTINCT pa.contact_id) AS total_leads,
  COUNT(DISTINCT pa.contact_id) FILTER (WHERE pa.first_connected_at IS NOT NULL) AS connected_leads,
  COUNT(DISTINCT pa.contact_id) FILTER (WHERE pa.meeting_booked_at IS NOT NULL) AS meetings_booked,
  COUNT(DISTINCT pa.contact_id) FILTER (WHERE pa.opportunity_created_at IS NOT NULL) AS opportunities,
  COUNT(DISTINCT pa.contact_id) FILTER (WHERE pa.closed_won_at IS NOT NULL) AS closed_won,
  SUM(pa.deal_amount) FILTER (WHERE pa.closed_won_at IS NOT NULL) AS total_revenue,
  AVG(pa.total_calls) AS avg_calls_to_connect,
  AVG(EXTRACT(EPOCH FROM (pa.meeting_booked_at - pa.first_call_at)) / 86400)
    FILTER (WHERE pa.meeting_booked_at IS NOT NULL) AS avg_days_to_meeting,
  ROUND(
    COUNT(DISTINCT pa.contact_id) FILTER (WHERE pa.closed_won_at IS NOT NULL)::NUMERIC /
    NULLIF(COUNT(DISTINCT pa.contact_id), 0) * 100, 2
  ) AS conversion_rate
FROM pipeline_attribution pa
WHERE pa.tenant_id = $1
  AND pa.first_call_at >= $2
  AND pa.first_call_at < $3
GROUP BY pa.lead_source
ORDER BY total_revenue DESC NULLS LAST;
```

### Funnel Conversion Rates

```typescript
interface FunnelMetrics {
  period: { start: Date; end: Date };
  stages: {
    calls: number;
    connects: number;
    meetingsBooked: number;
    opportunitiesCreated: number;
    proposalsSent: number;
    closedWon: number;
    closedLost: number;
  };
  conversionRates: {
    callToConnect: number;              // connects / calls
    connectToMeeting: number;           // meetings / connects
    meetingToOpportunity: number;       // opportunities / meetings
    opportunityToProposal: number;      // proposals / opportunities
    proposalToClose: number;            // closedWon / proposals
    overallCallToClose: number;         // closedWon / calls
  };
  revenue: {
    totalClosedWon: number;
    avgDealSize: number;
    revenuePerCall: number;             // totalClosedWon / calls
    revenuePerConnect: number;          // totalClosedWon / connects
  };
}
```

---

## Time-Series Data Storage

### Storage Strategy by Granularity

| Granularity | Storage | Use Case | Retention |
|-------------|---------|----------|-----------|
| **Second** | Redis (in-memory) | Real-time dashboard counters | 24 hours |
| **Minute** | PostgreSQL + time partitioning | Real-time charts, live monitoring | 7 days |
| **Hour** | PostgreSQL materialized view | Dashboard charts, daily reports | 90 days |
| **Day** | PostgreSQL summary table | Weekly/monthly reports, trends | 2 years |
| **Month** | PostgreSQL summary table | Annual reports, capacity planning | Indefinite |

### PostgreSQL with Time Partitioning

For time-series call metrics, use native PostgreSQL table partitioning:

```sql
-- Partitioned metrics table (by month)
CREATE TABLE call_metrics_minute (
  tenant_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  campaign_id UUID,
  agent_id UUID,
  metric_name TEXT NOT NULL,
  metric_value DOUBLE PRECISION NOT NULL,
  tags JSONB DEFAULT '{}'
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions (automate with pg_partman or cron)
CREATE TABLE call_metrics_minute_2024_01
  PARTITION OF call_metrics_minute
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE call_metrics_minute_2024_02
  PARTITION OF call_metrics_minute
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Index for time-range queries
CREATE INDEX idx_metrics_minute_lookup
  ON call_metrics_minute(tenant_id, metric_name, timestamp DESC);

-- Auto-drop old partitions (older than 7 days for minute data)
-- Run via pg_cron weekly
```

### TimescaleDB Alternative

If you choose TimescaleDB (PostgreSQL extension), you get automatic partitioning:

```sql
-- Create hypertable from regular table
SELECT create_hypertable('call_metrics', 'timestamp',
  chunk_time_interval => INTERVAL '1 day',
  if_not_exists => TRUE
);

-- Continuous aggregates (materialized views that auto-refresh)
CREATE MATERIALIZED VIEW call_metrics_hourly
WITH (timescaledb.continuous) AS
SELECT
  tenant_id,
  time_bucket('1 hour', timestamp) AS hour,
  campaign_id,
  agent_id,
  metric_name,
  AVG(metric_value) AS avg_value,
  SUM(metric_value) AS sum_value,
  COUNT(*) AS sample_count
FROM call_metrics
GROUP BY tenant_id, hour, campaign_id, agent_id, metric_name;

-- Auto-refresh policy
SELECT add_continuous_aggregate_policy('call_metrics_hourly',
  start_offset => INTERVAL '3 hours',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour'
);

-- Retention policy (auto-drop old data)
SELECT add_retention_policy('call_metrics', INTERVAL '7 days');
SELECT add_retention_policy('call_metrics_hourly', INTERVAL '90 days');
```

### InfluxDB Alternative (Purpose-Built Time-Series)

If using a dedicated time-series database:

```
// InfluxDB line protocol for call metrics
call_metrics,tenant=t1,campaign=c1,agent=a1 calls=1i,connects=1i,talk_time=342i 1704067200000000000
call_metrics,tenant=t1,campaign=c1,agent=a1 calls=1i,connects=0i,talk_time=0i 1704067260000000000
```

Query with InfluxQL or Flux:

```flux
from(bucket: "dialer_metrics")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "call_metrics")
  |> filter(fn: (r) => r.tenant == "t1")
  |> aggregateWindow(every: 1h, fn: sum)
  |> yield(name: "hourly_calls")
```

**Recommendation for this project**: Use PostgreSQL with materialized views and time partitioning.
It avoids adding another database to the stack while handling the expected data volume
(millions of rows/day at scale). Switch to TimescaleDB extension if query performance degrades.

---

## Dashboard Implementation

### Technology Stack

- **Charts**: Recharts (React-based, composable) or Tremor (higher-level, dashboard-focused)
- **Real-time updates**: WebSocket connection for live metric pushes
- **Date/time handling**: date-fns for formatting, luxon for timezone math
- **State management**: React Query (TanStack Query) for data fetching with auto-refetch

### Dashboard Types

| Dashboard | Audience | Update Frequency | Key Widgets |
|-----------|----------|-----------------|-------------|
| **Agent Live View** | Individual rep | Real-time (1s) | Current call stats, daily progress, coaching alerts |
| **Team Dashboard** | Manager | Real-time (5s) | Leaderboard, team stats, live call monitor |
| **Campaign Dashboard** | Manager/Admin | Near-real-time (30s) | Campaign performance, list penetration, funnel |
| **Analytics Dashboard** | Manager/Exec | On-demand (cached 5min) | Trends, comparisons, pipeline attribution |
| **Executive Dashboard** | C-level | On-demand (cached 15min) | Revenue attribution, team capacity, forecasting |

### Real-Time Dashboard via WebSocket

Push live metrics to the dashboard via WebSocket:

```typescript
// Server-side: publish metric updates
interface DashboardUpdate {
  type: 'metric_update';
  tenantId: string;
  scope: 'agent' | 'team' | 'campaign';
  scopeId: string;
  metrics: {
    [metricName: string]: number;
  };
  timestamp: number;
}

// Example: broadcast agent stats update
function broadcastAgentUpdate(agentId: string, metrics: AgentMetrics): void {
  const update: DashboardUpdate = {
    type: 'metric_update',
    tenantId: metrics.tenantId,
    scope: 'agent',
    scopeId: agentId,
    metrics: {
      totalCalls: metrics.totalCalls,
      connects: metrics.connects,
      connectRate: metrics.connectRate,
      meetingsBooked: metrics.meetingsBooked,
      talkTimeMinutes: metrics.talkTimeMinutes,
      avgCallScore: metrics.avgCallScore,
      currentStatus: metrics.status,
    },
    timestamp: Date.now(),
  };

  // Publish to Redis pub/sub channel for the tenant's dashboard
  redis.publish(`dashboard:${metrics.tenantId}`, JSON.stringify(update));
}
```

### Client-Side Dashboard Architecture

```typescript
// React hook for real-time dashboard data
function useDashboardMetrics(scope: string, scopeId: string) {
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const ws = useWebSocket(`/ws/dashboard`);

  useEffect(() => {
    ws.onMessage((event) => {
      const update = JSON.parse(event.data) as DashboardUpdate;
      if (update.scope === scope && update.scopeId === scopeId) {
        setMetrics(prev => ({ ...prev, ...update.metrics }));
      }
    });

    // Subscribe to scope
    ws.send(JSON.stringify({
      type: 'subscribe',
      scope,
      scopeId,
    }));

    return () => {
      ws.send(JSON.stringify({ type: 'unsubscribe', scope, scopeId }));
    };
  }, [scope, scopeId]);

  return metrics;
}
```

### Configurable Date Ranges and Filters

Standard filter options for analytics dashboards:

```typescript
interface DashboardFilters {
  dateRange: {
    preset: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' |
            'this_week' | 'this_month' | 'this_quarter' | 'custom';
    start?: Date;
    end?: Date;
  };
  timezone: string;                     // IANA timezone (e.g., "America/New_York")
  campaigns?: string[];                 // filter by campaign IDs
  agents?: string[];                    // filter by agent IDs
  teams?: string[];                     // filter by team IDs
  dispositions?: string[];              // filter by disposition types
  leadSources?: string[];               // filter by lead source
  callScoreRange?: { min: number; max: number };
  comparison?: {                        // compare against previous period
    enabled: boolean;
    type: 'previous_period' | 'same_period_last_year' | 'custom';
    start?: Date;
    end?: Date;
  };
}
```

### Chart Components

Common chart patterns for sales dialer dashboards:

**1. Call Volume Over Time (Area Chart)**
- X-axis: time (hourly for today, daily for week/month)
- Y-axis: call count
- Series: total calls, connected calls, meetings booked
- Comparison overlay: dotted line for previous period

**2. Connect Rate Trend (Line Chart)**
- X-axis: time
- Y-axis: percentage (0-100%)
- Series: connect rate with target line overlay
- Annotations: mark when campaigns changed or lists rotated

**3. Disposition Breakdown (Donut/Pie Chart)**
- Segments: Connected, No Answer, Voicemail, Busy, Invalid, DNC
- Center: total calls count
- Click segment to drill into sub-dispositions

**4. Agent Leaderboard (Table with Sparklines)**
- Columns: rank, agent name, calls, connects, connect rate, meetings, avg score
- Sparkline: mini chart showing today's call volume over time
- Row highlighting: green = above target, red = below target

**5. Funnel Chart (Pipeline Attribution)**
- Stages: Calls -> Connects -> Meetings -> Opportunities -> Closed Won
- Show absolute numbers and conversion rates between stages
- Compare across campaigns or time periods

**6. Heatmap (Best Call Times)**
- X-axis: day of week
- Y-axis: hour of day
- Color: connect rate (darker = higher connect rate)
- Helps optimize dialing schedules

### API Endpoints for Dashboard Data

```typescript
// GET /api/analytics/call-metrics
// Query: { tenantId, dateRange, groupBy, filters }
// Returns: time-series data for call volume, connect rate, etc.

// GET /api/analytics/agent-scorecard/:agentId
// Query: { period: 'daily' | 'weekly' | 'monthly', date }
// Returns: RepScorecard

// GET /api/analytics/team-leaderboard/:teamId
// Query: { date, sortBy }
// Returns: TeamLeaderboard

// GET /api/analytics/pipeline-funnel
// Query: { tenantId, dateRange, groupBy: 'campaign' | 'lead_source' | 'agent' }
// Returns: FunnelMetrics[]

// GET /api/analytics/coaching-opportunities/:teamId
// Returns: CoachingOpportunity[]

// GET /api/analytics/call-time-heatmap
// Query: { tenantId, dateRange, metric: 'connect_rate' | 'calls' }
// Returns: HeatmapData[][]

// WebSocket: /ws/dashboard
// Subscribe: { scope: 'agent' | 'team' | 'campaign', scopeId }
// Receives: DashboardUpdate events in real-time
```

---

## Export and Reporting

### Scheduled Reports

Managers can schedule automated reports delivered via email:

```typescript
interface ScheduledReport {
  id: string;
  tenantId: string;
  name: string;
  type: 'daily_summary' | 'weekly_scorecard' | 'monthly_pipeline' | 'custom';
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;                 // 0-6 for weekly
    dayOfMonth?: number;                // 1-28 for monthly
    timeOfDay: string;                  // "08:00" in tenant timezone
    timezone: string;
  };
  recipients: string[];                 // email addresses
  filters: DashboardFilters;
  format: 'pdf' | 'csv' | 'xlsx';
  isActive: boolean;
}
```

### CSV Export

Support CSV export for all dashboard views:

```typescript
// Standard export columns for call data
const CALL_EXPORT_COLUMNS = [
  'call_id', 'date', 'time', 'agent_name', 'prospect_name',
  'prospect_phone', 'prospect_company', 'campaign_name',
  'disposition', 'talk_duration', 'wait_time', 'wrap_time',
  'ai_score', 'sentiment', 'recording_url', 'notes',
  'meeting_booked', 'crm_synced'
];
```

Limit export size: max 100,000 rows per export. For larger exports, generate async
and email a download link when ready.

---

## Data Retention and Compliance

### Retention Policies

| Data Type | Default Retention | Configurable |
|-----------|------------------|-------------|
| Raw call metrics (minute) | 7 days | No |
| Hourly aggregates | 90 days | Yes (30-365 days) |
| Daily aggregates | 2 years | Yes (1-5 years) |
| Call recordings | 90 days | Yes (30 days - 7 years) |
| Transcripts | 1 year | Yes (90 days - 7 years) |
| Pipeline attribution | 3 years | No |

Implement automated data purging with tenant notification before deletion.
Comply with data residency requirements by storing analytics data in the tenant's region.
