# CRM Integration Domain Context

This context teaches you how sales dialers integrate with CRM systems. You need this knowledge
when building sync engines, activity logging, field mapping, and webhook handlers.

---

## Salesforce Integration

### Authentication: Connected Apps & OAuth 2.0

Salesforce uses Connected Apps for API access. The integration requires:

- **Client ID / Client Secret** — from the Connected App in Salesforce Setup
- **OAuth 2.0 Web Server Flow** — for user-facing authorization (redirect-based)
- **OAuth 2.0 JWT Bearer Flow** — for server-to-server (no user interaction, preferred for background sync)
- **Refresh Tokens** — access tokens expire in ~1-2 hours; always store and rotate refresh tokens

Token endpoint: `https://login.salesforce.com/services/oauth2/token` (production)
or `https://test.salesforce.com/services/oauth2/token` (sandbox).

Store tokens per-tenant in an encrypted credentials table:

```sql
CREATE TABLE crm_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  provider TEXT NOT NULL CHECK (provider IN ('salesforce', 'hubspot')),
  access_token TEXT NOT NULL,          -- encrypted at rest
  refresh_token TEXT NOT NULL,         -- encrypted at rest
  instance_url TEXT,                   -- Salesforce instance URL (e.g., https://na1.salesforce.com)
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  metadata JSONB DEFAULT '{}',        -- provider-specific config
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, provider)
);
```

### Salesforce REST API (CRUD Operations)

Base URL pattern: `{instance_url}/services/data/v59.0/`

Key endpoints:

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Query records | GET | `/query?q={SOQL}` |
| Get record | GET | `/sobjects/{ObjectName}/{id}` |
| Create record | POST | `/sobjects/{ObjectName}` |
| Update record | PATCH | `/sobjects/{ObjectName}/{id}` |
| Delete record | DELETE | `/sobjects/{ObjectName}/{id}` |
| Describe object | GET | `/sobjects/{ObjectName}/describe` |
| Composite | POST | `/composite` (batch up to 25 subrequests) |

SOQL query example for fetching leads assigned to a dialer campaign:

```
SELECT Id, FirstName, LastName, Phone, MobilePhone, Email, Company, Status, OwnerId
FROM Lead
WHERE Status = 'Open - Not Contacted'
AND OwnerId IN ('005xx000001Sv1a', '005xx000001Sv1b')
ORDER BY CreatedDate DESC
LIMIT 200
```

Rate limits: Salesforce enforces per-org API call limits (typically 100,000/day for Enterprise Edition).
Use the `Sforce-Limit-Info` response header to track remaining calls:
`Sforce-Limit-Info: api-usage=450/100000`

### Salesforce Bulk API 2.0 (Mass Data Sync)

For historical data imports or large-scale sync (>2,000 records), use Bulk API 2.0:

1. **Create a job**: `POST /services/data/v59.0/jobs/ingest`
2. **Upload CSV data**: `PUT /services/data/v59.0/jobs/ingest/{jobId}/batches` with `Content-Type: text/csv`
3. **Close the job**: `PATCH /services/data/v59.0/jobs/ingest/{jobId}` with `{"state": "UploadComplete"}`
4. **Poll for completion**: `GET /services/data/v59.0/jobs/ingest/{jobId}` until `state === 'JobComplete'`
5. **Get results**: `GET /services/data/v59.0/jobs/ingest/{jobId}/successfulResults`

Job creation payload:

```json
{
  "object": "Task",
  "operation": "insert",
  "contentType": "CSV",
  "lineEnding": "LF"
}
```

Bulk API processes up to 150 million records per 24-hour rolling period. Individual CSV uploads
are limited to 150 MB. Use this for:
- Initial CRM data pull when a tenant first connects
- Nightly sync of historical call activities
- Bulk disposition updates after a dialing session

### Salesforce Streaming API (Change Data Capture)

Use Change Data Capture (CDC) to receive real-time notifications when CRM records change.
This is critical for keeping the dialer's contact data fresh.

Subscribe to CDC channels via CometD (long-polling or WebSocket):

- Channel: `/data/LeadChangeEvent`
- Channel: `/data/ContactChangeEvent`
- Channel: `/data/AccountChangeEvent`
- Channel: `/data/OpportunityChangeEvent`

CDC event payload structure:

```json
{
  "schema": "TGVhZENoYW5nZUV2ZW50",
  "payload": {
    "ChangeEventHeader": {
      "entityName": "Lead",
      "recordIds": ["00Qxx000001abcd"],
      "changeType": "UPDATE",
      "changedFields": ["Status", "Phone"],
      "commitTimestamp": 1704067200000,
      "transactionKey": "000a1b2c-..."
    },
    "Status": "Working - Contacted",
    "Phone": "+14155551234"
  }
}
```

changeType values: `CREATE`, `UPDATE`, `DELETE`, `UNDELETE`, `GAP_CREATE`, `GAP_UPDATE`,
`GAP_DELETE`, `GAP_UNDELETE`, `GAP_OVERFLOW`.

Replay ID: Store the `replayId` from each event. On reconnect, pass `replayId` to resume
from where you left off (events are retained for 72 hours).

### Salesforce Standard Objects for Sales Dialers

| Object | Purpose in Dialer |
|--------|-------------------|
| **Lead** | Primary dialing target before qualification |
| **Contact** | Post-qualification dialing target, linked to Account |
| **Account** | Company-level grouping, used for account-based dialing |
| **Opportunity** | Pipeline tracking, updated after successful calls |
| **Task** | Activity logging — each call creates a Task record |
| **Event** | Meeting scheduling — booked meetings from calls |
| **User** | Rep/owner mapping for assignment and routing |
| **CampaignMember** | Campaign association for marketing attribution |

Task object fields for call logging:

| Field | Type | Value |
|-------|------|-------|
| Subject | String | "Call - {disposition}" |
| Status | Picklist | "Completed" |
| Priority | Picklist | "Normal" |
| TaskSubtype | String | "Call" |
| CallType | Picklist | "Outbound" |
| CallDurationInSeconds | Integer | Call duration |
| CallDisposition | String | Disposition from dialer |
| Description | TextArea | Call notes, summary |
| WhoId | Reference | Lead ID or Contact ID |
| WhatId | Reference | Account ID or Opportunity ID |
| OwnerId | Reference | Rep User ID |
| ActivityDate | Date | Call date |

### Salesforce Custom Fields and Objects

Tenants often need custom fields on standard objects to store dialer-specific data:

- `Dialer_Call_Recording_URL__c` — link to call recording
- `Dialer_Last_Disposition__c` — last call outcome from the dialer
- `Dialer_Call_Count__c` — total calls made via dialer
- `Dialer_AI_Score__c` — AI-generated call score
- `Dialer_Last_Called__c` — timestamp of last dialer call
- `Dialer_DNC__c` — checkbox for do-not-call

Custom objects might include:
- `Dialer_Session__c` — represents a dialing session with stats
- `Dialer_Voicemail_Drop__c` — tracks voicemail drops

Use the Metadata API or Tooling API to programmatically check for or create these fields
during tenant onboarding.

---

## HubSpot Integration

### Authentication: OAuth 2.0 & Private Apps

Two auth patterns:

1. **OAuth 2.0 (marketplace apps)** — redirect-based flow for multi-tenant
   - Auth URL: `https://app.hubspot.com/oauth/authorize`
   - Token URL: `https://api.hubapi.com/oauth/v1/token`
   - Scopes: `crm.objects.contacts.read`, `crm.objects.contacts.write`,
     `crm.objects.deals.read`, `crm.objects.deals.write`,
     `timeline`, `sales-email-read`

2. **Private App Token** — single-tenant, simpler setup
   - Generated in HubSpot Settings > Integrations > Private Apps
   - Passed as `Authorization: Bearer {token}` header
   - Scoped to specific permissions at creation time

### HubSpot API v3 (Contacts, Deals, Engagements)

Base URL: `https://api.hubapi.com/crm/v3/`

**Contacts API:**

```
GET    /objects/contacts                     # List contacts
GET    /objects/contacts/{contactId}         # Get contact
POST   /objects/contacts                     # Create contact
PATCH  /objects/contacts/{contactId}         # Update contact
POST   /objects/contacts/search              # Search contacts
POST   /objects/contacts/batch/read          # Batch get (up to 100)
POST   /objects/contacts/batch/create        # Batch create (up to 100)
POST   /objects/contacts/batch/update        # Batch update (up to 100)
```

Search request for contacts in a dialing list:

```json
{
  "filterGroups": [{
    "filters": [
      { "propertyName": "lifecyclestage", "operator": "EQ", "value": "lead" },
      { "propertyName": "hs_lead_status", "operator": "EQ", "value": "NEW" }
    ]
  }],
  "properties": ["firstname", "lastname", "phone", "mobilephone", "email", "company"],
  "limit": 100,
  "after": "0"
}
```

**Deals API** (same CRUD pattern):

```
GET    /objects/deals/{dealId}
PATCH  /objects/deals/{dealId}
POST   /objects/deals/search
```

**Associations API** — link contacts to deals, companies:

```
PUT /objects/contacts/{contactId}/associations/deals/{dealId}/{associationTypeId}
```

### HubSpot Engagements API (Call Logging)

Use the Engagements API to log calls as activities on contacts.

Create a call engagement:

```json
POST /crm/v3/objects/calls
{
  "properties": {
    "hs_timestamp": "2024-01-15T14:30:00.000Z",
    "hs_call_title": "Outbound Sales Call",
    "hs_call_body": "Discussed pricing. Prospect interested in Enterprise plan.",
    "hs_call_duration": "342000",
    "hs_call_from_number": "+14155550100",
    "hs_call_to_number": "+14155551234",
    "hs_call_recording_url": "https://recordings.example.com/rec_abc123.mp3",
    "hs_call_status": "COMPLETED",
    "hs_call_direction": "OUTBOUND",
    "hs_call_disposition": "Connected"
  }
}
```

Then associate it with the contact:

```
PUT /crm/v3/objects/calls/{callId}/associations/contacts/{contactId}/194
```

(Association type ID 194 = call-to-contact)

### HubSpot Timeline API & Custom Events

The Timeline API lets you push custom activity timeline entries visible on contact records.

Use custom behavioral events (Marketing Hub Enterprise) or timeline extensions:

```json
POST /crm/v3/timeline/events
{
  "eventTemplateId": "123456",
  "objectId": "contact_id_here",
  "tokens": {
    "callDuration": "5:42",
    "disposition": "Meeting Booked",
    "aiScore": "87",
    "sentiment": "positive"
  }
}
```

Custom events are powerful for tracking dialer-specific actions:
- Voicemail drops
- AI coaching triggers
- Disposition changes
- Call score events

### HubSpot Rate Limits

- OAuth apps: 100 requests per 10 seconds per account
- Private apps: 200 requests per 10 seconds (higher tier)
- Burst-friendly but enforce with a sliding window rate limiter
- Batch endpoints reduce API calls (up to 100 records per batch call)

---

## Bi-Directional Sync Engine

### Architecture Overview

The sync engine ensures data consistency between the dialer and the CRM. It handles:

1. **CRM-to-Dialer** (inbound): Contact/lead data, ownership changes, field updates
2. **Dialer-to-CRM** (outbound): Call activities, dispositions, notes, recordings

### Webhook-Based Real-Time Sync

For CRM-to-Dialer (inbound), use CRM webhooks/CDC:

- **Salesforce**: Change Data Capture (CDC) events via CometD
- **HubSpot**: Webhook subscriptions via App Settings (subscription API)

HubSpot webhook subscription:

```json
{
  "eventType": "contact.propertyChange",
  "propertyName": "phone",
  "active": true
}
```

Webhook handler architecture:

```
CRM Webhook → API Gateway → Webhook Processor (validates signature, deduplicates)
  → Event Queue (Redis/SQS) → Sync Worker → Dialer Database
```

Always validate webhook signatures:
- Salesforce: Verify the `X-Salesforce-Signature` header using your org's certificate
- HubSpot: HMAC-SHA256 of request body using client secret, compare to `X-HubSpot-Signature-v3`

### Batch Sync for Historical Data

Run periodic batch sync for:
- Initial data load when tenant connects CRM
- Catch-up sync after downtime or missed webhooks
- Nightly reconciliation to fix drift

Batch sync pattern:

```
1. Query CRM for records modified since last_sync_timestamp
2. Compare with local records using external_id mapping
3. Apply changes (create/update/skip) based on conflict resolution rules
4. Update last_sync_timestamp and sync_status per record
5. Log sync stats (created, updated, skipped, errored)
```

Sync status tracking table:

```sql
CREATE TABLE crm_sync_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  crm_provider TEXT NOT NULL,
  crm_object_type TEXT NOT NULL,          -- 'Lead', 'Contact', 'Task'
  crm_record_id TEXT NOT NULL,            -- Salesforce/HubSpot record ID
  local_record_id UUID,                   -- Our internal record ID
  local_table TEXT NOT NULL,              -- 'contacts', 'call_activities'
  sync_direction TEXT NOT NULL,           -- 'inbound', 'outbound'
  sync_status TEXT DEFAULT 'pending',     -- 'pending', 'synced', 'error', 'conflict'
  last_synced_at TIMESTAMPTZ,
  last_crm_modified_at TIMESTAMPTZ,
  last_local_modified_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, crm_provider, crm_object_type, crm_record_id)
);

CREATE INDEX idx_sync_pending ON crm_sync_records(tenant_id, sync_status)
  WHERE sync_status IN ('pending', 'error');
```

### Conflict Resolution Strategies

When the same record is modified in both the dialer and the CRM between syncs:

| Strategy | Description | Use Case |
|----------|-------------|----------|
| **CRM-wins** | CRM value always overwrites dialer | Contact info (phone, email, name) |
| **Dialer-wins** | Dialer value always overwrites CRM | Call-specific fields (disposition, notes) |
| **Last-write-wins** | Most recent timestamp wins | General purpose fallback |
| **Field-level merge** | Compare field-by-field, merge non-conflicting | Complex objects with mixed ownership |
| **Manual resolution** | Flag for human review | High-value records, conflicting critical fields |

Configuration per tenant:

```json
{
  "conflict_resolution": {
    "default": "crm_wins",
    "overrides": {
      "phone": "crm_wins",
      "email": "crm_wins",
      "disposition": "dialer_wins",
      "call_notes": "dialer_wins",
      "lead_status": "last_write_wins"
    }
  }
}
```

### Deduplication Strategies

Contacts may exist in both CRM and dialer with different IDs. Dedup strategies:

1. **CRM ID matching** — always store `crm_record_id` as the canonical external ID
2. **Email matching** — normalize email (lowercase, trim) and match
3. **Phone matching** — normalize to E.164 format and match (strip formatting, add country code)
4. **Fuzzy name + company** — last resort, use Levenshtein distance with threshold
5. **Composite key** — combine email + phone + company for higher confidence

Phone normalization is critical. Use a library like `libphonenumber` (Google's):

```typescript
import { parsePhoneNumberFromString } from 'libphonenumber-js';

function normalizePhone(raw: string, defaultCountry: string = 'US'): string | null {
  const parsed = parsePhoneNumberFromString(raw, defaultCountry as any);
  if (!parsed || !parsed.isValid()) return null;
  return parsed.format('E.164'); // e.g., "+14155551234"
}
```

---

## Activity Logging

### Auto-Log Calls as CRM Activities

Every completed call should be logged as an activity in the CRM. The logging pipeline:

```
Call Ends → Call Record Finalized → Activity Logger Queue
  → CRM Activity Writer → Creates Task (Salesforce) or Call Engagement (HubSpot)
  → Updates crm_sync_records with outbound sync status
```

Activity payload builder (abstracted across CRM providers):

```typescript
interface CallActivityPayload {
  externalContactId: string;        // CRM record ID (Lead/Contact)
  externalAccountId?: string;       // CRM Account/Company ID
  callDirection: 'outbound' | 'inbound';
  callDurationSeconds: number;
  callStartedAt: Date;
  disposition: string;              // e.g., "Connected", "No Answer", "Voicemail"
  notes: string;                    // Agent notes + AI summary
  recordingUrl?: string;            // Signed URL to call recording
  agentExternalId: string;          // CRM User ID for the rep
  metadata: Record<string, any>;    // AI score, sentiment, etc.
}
```

### Disposition Mapping

Dialer dispositions must map to CRM-specific field values. This mapping is configurable per tenant:

```json
{
  "disposition_mapping": {
    "salesforce": {
      "Connected": { "TaskSubtype": "Call", "CallDisposition": "Connected", "Status": "Completed" },
      "No Answer": { "TaskSubtype": "Call", "CallDisposition": "No Answer", "Status": "Completed" },
      "Voicemail": { "TaskSubtype": "Call", "CallDisposition": "Left Voicemail", "Status": "Completed" },
      "Meeting Booked": { "TaskSubtype": "Call", "CallDisposition": "Meeting Booked", "Status": "Completed" },
      "Not Interested": { "TaskSubtype": "Call", "CallDisposition": "Not Interested", "Status": "Completed" },
      "DNC": { "TaskSubtype": "Call", "CallDisposition": "Do Not Call", "Status": "Completed" }
    },
    "hubspot": {
      "Connected": { "hs_call_status": "COMPLETED", "hs_call_disposition": "connected" },
      "No Answer": { "hs_call_status": "COMPLETED", "hs_call_disposition": "no-answer" },
      "Voicemail": { "hs_call_status": "COMPLETED", "hs_call_disposition": "left-voicemail" },
      "Meeting Booked": { "hs_call_status": "COMPLETED", "hs_call_disposition": "connected" },
      "Not Interested": { "hs_call_status": "COMPLETED", "hs_call_disposition": "connected" },
      "DNC": { "hs_call_status": "COMPLETED", "hs_call_disposition": "connected" }
    }
  }
}
```

### Call Recording Links

Store signed URLs (not permanent URLs) in CRM fields to prevent unauthorized access:

- Generate a short-lived signed URL (e.g., 1-hour expiry) when the CRM activity is created
- For Salesforce: store in a custom field `Dialer_Call_Recording_URL__c`
- For HubSpot: use the `hs_call_recording_url` property
- Implement a redirect endpoint (`/api/recordings/{id}/play`) that verifies CRM session
  and generates a fresh signed URL on demand

### Notes and Next Steps

Structure call notes for CRM logging:

```
--- Call Summary (AI Generated) ---
Spoke with John about their current billing software pain points.
He expressed frustration with their current vendor's reporting capabilities.

--- Key Points ---
- Currently using CompetitorX, contract expires Q2
- Budget authority confirmed
- Wants to see a demo with their team of 5

--- Next Steps ---
- [ ] Send case study on billing platform migration
- [ ] Schedule demo for next Tuesday
- [ ] Loop in SE for technical deep dive

--- Call Metrics ---
Duration: 5:42 | AI Score: 87/100 | Sentiment: Positive
Talk Ratio: Agent 38% / Prospect 62%
```

---

## Field Mapping Engine

### Configurable Per-Tenant Field Mapping

Each tenant can customize how dialer fields map to their CRM fields:

```sql
CREATE TABLE field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  crm_provider TEXT NOT NULL,
  sync_direction TEXT NOT NULL,         -- 'inbound', 'outbound', 'bidirectional'
  dialer_entity TEXT NOT NULL,          -- 'contact', 'call_activity', 'campaign'
  dialer_field TEXT NOT NULL,           -- internal field name
  crm_object TEXT NOT NULL,             -- 'Lead', 'Contact', 'Task', etc.
  crm_field TEXT NOT NULL,              -- CRM API field name
  transform_rule TEXT,                  -- 'none', 'phone_e164', 'date_iso', 'custom'
  custom_transform JSONB,              -- custom transform config
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, crm_provider, dialer_entity, dialer_field)
);
```

### Default Field Mappings

Provide sensible defaults that tenants can override:

| Dialer Field | Salesforce Lead | HubSpot Contact | Direction |
|--------------|-----------------|-----------------|-----------|
| first_name | FirstName | firstname | bidirectional |
| last_name | LastName | lastname | bidirectional |
| email | Email | email | bidirectional |
| phone | Phone | phone | bidirectional |
| mobile_phone | MobilePhone | mobilephone | bidirectional |
| company | Company | company | bidirectional |
| title | Title | jobtitle | bidirectional |
| lead_status | Status | hs_lead_status | bidirectional |
| owner_email | Owner.Email | hubspot_owner_id | inbound |
| last_called_at | Dialer_Last_Called__c | last_call_date | outbound |
| call_count | Dialer_Call_Count__c | num_calls | outbound |
| ai_score | Dialer_AI_Score__c | ai_call_score | outbound |

### Data Transformation Rules

Built-in transforms for common data conversions:

| Rule | Description | Example |
|------|-------------|---------|
| `none` | Pass through unchanged | String fields |
| `phone_e164` | Normalize to E.164 format | "(415) 555-1234" -> "+14155551234" |
| `date_iso` | Convert to ISO 8601 | "01/15/2024" -> "2024-01-15T00:00:00Z" |
| `date_sfdc` | Salesforce date format | "2024-01-15" |
| `boolean_yn` | Y/N to boolean | "Y" -> true |
| `boolean_checkbox` | Checkbox to boolean | "true" -> true |
| `lowercase` | Lowercase string | "John@EXAMPLE.com" -> "john@example.com" |
| `picklist_map` | Map between picklist values | Custom mapping table |
| `currency_cents` | Dollars to cents | "49.99" -> 4999 |
| `custom` | User-defined JS expression | `value.split(' ')[0]` |

### Custom Field Discovery

On CRM connection, discover the tenant's custom fields automatically:

- **Salesforce**: `GET /services/data/v59.0/sobjects/{ObjectName}/describe` returns all fields
  including custom fields (ending in `__c`)
- **HubSpot**: `GET /crm/v3/properties/{objectType}` returns all properties including custom ones

Cache the field schema per tenant and refresh periodically. Present discovered fields in the
field mapping UI so tenants can map them without manual configuration.

### Validation Rules

Before syncing, validate mapped data:

```typescript
interface FieldValidation {
  type: 'required' | 'format' | 'length' | 'range' | 'enum';
  params: Record<string, any>;
  errorMessage: string;
}

// Example validations
const validations: Record<string, FieldValidation[]> = {
  'phone': [
    { type: 'format', params: { pattern: /^\+[1-9]\d{1,14}$/ }, errorMessage: 'Invalid E.164 phone' }
  ],
  'email': [
    { type: 'format', params: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }, errorMessage: 'Invalid email' }
  ],
  'lead_status': [
    { type: 'enum', params: { values: ['New', 'Working', 'Qualified', 'Unqualified'] }, errorMessage: 'Invalid status' }
  ]
};
```

---

## Error Handling & Resilience

### Retry Strategy

CRM APIs are external dependencies. Implement resilient retry:

- **Exponential backoff**: 1s, 2s, 4s, 8s, 16s (with jitter)
- **Max retries**: 5 for transient errors (429, 500, 503), 0 for client errors (400, 404)
- **Circuit breaker**: Open after 5 consecutive failures, half-open after 60s
- **Dead letter queue**: After max retries, send to DLQ for manual review

### Common CRM API Errors

| HTTP Status | Meaning | Action |
|-------------|---------|--------|
| 400 | Bad request / validation | Log, fix payload, don't retry |
| 401 | Token expired | Refresh token, retry once |
| 403 | Insufficient permissions | Alert tenant, don't retry |
| 404 | Record deleted in CRM | Mark local record as CRM-deleted |
| 409 | Conflict / concurrent edit | Re-fetch CRM record, re-apply |
| 429 | Rate limited | Respect `Retry-After` header, back off |
| 500/503 | Server error | Retry with exponential backoff |

### Sync Health Monitoring

Track sync health per tenant:

```typescript
interface SyncHealthMetrics {
  tenantId: string;
  provider: string;
  lastSyncAt: Date;
  recordsSyncedLast24h: number;
  errorRateLast24h: number;        // percentage
  pendingRecords: number;
  avgSyncLatencyMs: number;
  consecutiveFailures: number;
  circuitBreakerState: 'closed' | 'open' | 'half-open';
}
```

Alert when:
- Error rate exceeds 5% in a 1-hour window
- Sync latency exceeds 5 minutes for real-time events
- Circuit breaker opens
- Pending records queue depth exceeds threshold
- Token refresh fails (tenant needs to re-authorize)
