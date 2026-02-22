# Domain Context: Compliance

You are working on a sales dialer SaaS product. This context gives you deep expertise in the regulatory and compliance landscape that governs automated and manual outbound calling in the United States and internationally. Every architectural decision, feature, and workflow must account for these regulations. Non-compliance carries severe penalties: TCPA violations alone can result in $500-$1,500 per call in statutory damages.

---

## TCPA (Telephone Consumer Protection Act)

The TCPA is the primary federal law governing telemarketing calls in the US. It is enforced by the FCC and through private lawsuits (including class actions). TCPA compliance is non-negotiable for any sales dialer.

### Calling Hours

- **Federal rule**: Telemarketing calls may only be placed between **8:00 AM and 9:00 PM** in the **called party's local time zone**.
- This means your dialer must determine the prospect's timezone and filter the queue accordingly.
- This applies to both live calls and pre-recorded/artificial voice calls.

### Timezone Determination

The system must determine each contact's local timezone. Priority order:

1. **Explicit timezone on the contact record** (most reliable)
2. **State + ZIP code lookup** (reliable for most cases)
3. **Area code mapping** (unreliable due to number portability — a prospect with a 212 area code may live in California)

Always use the most reliable data available. If timezone cannot be determined, the safest approach is to restrict calls to the narrowest common window: 11:00 AM - 8:00 PM ET (which covers 8:00 AM PT to 9:00 PM ET).

### Express Consent Requirements

The TCPA distinguishes between different types of consent depending on the call technology and purpose:

| Call Type                              | Consent Required                         |
|----------------------------------------|------------------------------------------|
| Live agent to landline (non-ATDS)      | No prior consent required*               |
| Live agent to cell phone (non-ATDS)    | No prior consent required*               |
| Auto-dialer (ATDS) to landline         | Prior express consent                    |
| Auto-dialer (ATDS) to cell phone       | Prior express written consent            |
| Pre-recorded voice to cell phone       | Prior express written consent            |
| Pre-recorded voice to landline         | Prior express consent                    |

*Still subject to DNC rules, calling hours, and caller ID requirements.

### Automatic Telephone Dialing System (ATDS) Definition

This is a heavily litigated area. Under the Supreme Court's 2021 ruling in *Facebook v. Duguid*, an ATDS is equipment that uses a random or sequential number generator to either store or produce phone numbers to be called. A system that merely dials from a stored list of numbers is NOT an ATDS under this definition.

**Architectural implication**: If your dialer calls from pre-loaded contact lists (which it does), it is likely NOT classified as an ATDS under the current federal definition. However:
- Some state laws have broader ATDS definitions
- The legal landscape could shift with new FCC rulings
- Best practice: obtain express consent wherever possible

### Express Written Consent

For any automated dialing or pre-recorded messages, express written consent must:
- Be in writing (including electronic forms, website opt-ins)
- Include the specific phone number being consented
- Include clear disclosure that auto-dialed calls or pre-recorded messages will be made
- Not be a condition of purchase
- Be stored with timestamp and evidence of how consent was obtained

**Technical implementation**: Store consent records with:
- Contact ID and phone number
- Consent type (express, express written)
- Source (web form, verbal, written)
- Timestamp (with timezone)
- IP address (if web form)
- Form content or script used
- Revocation status and timestamp

### Cell Phone vs Landline

The TCPA imposes stricter rules on calls to cell phones because the called party may incur charges. Your system should:
- Classify each number as landline or cell phone using a lookup service (Twilio Lookup API, NumVerify, etc.)
- Apply the appropriate consent requirements
- Track the line type in the contact record
- Re-verify periodically, as numbers can be ported between landline and mobile

---

## DNC (Do Not Call) Lists

### National Do Not Call Registry

The FTC maintains the National DNC Registry. Rules:
- Telemarketers must scrub calling lists against the national DNC registry before making calls
- Subscription is required: purchase access at `telemarketing.donotcall.gov`
- Data is updated monthly; you must re-scrub within 31 days
- Exemptions: calls to existing customers (within 18 months of last transaction or 3 months of last inquiry), calls with express written consent, non-commercial calls

### State Do Not Call Lists

Many states maintain their own DNC lists with additional restrictions. Some states with notable DNC programs:
- **Indiana**: Maintains its own list, additional restrictions on calling hours
- **Pennsylvania**: Separate state DNC list
- **Texas**: State DNC with additional requirements
- **Colorado**: State DNC list
- **Missouri**: State DNC with call-specific consent requirements

Your system must scrub against both federal and all applicable state DNC lists before any call is placed.

### Internal DNC List

When a prospect says "Don't call me again" or "Put me on your do not call list," you are legally required to:
1. **Immediately** add them to your internal DNC list
2. Honor the request within **30 days** (FCC rule), but best practice is to honor it **immediately**
3. Never call that number again from any campaign, by any agent
4. Maintain the internal DNC list indefinitely (minimum 5 years per FCC rules)

**Technical implementation**:
- Maintain an internal DNC table in your database
- Every dial attempt must check against this table before placing the call
- The DNC check must happen at dial time (not just at list upload) because a contact could be added to DNC between upload and dialing
- The DNC disposition must trigger an immediate, synchronous write — not an async queue
- DNC removal requires documented consent from the prospect

### DNC Scrubbing Architecture

Scrubbing must happen at two points:

1. **List upload time**: When contacts are uploaded/imported, scrub the entire batch against national, state, and internal DNC lists. Flag or remove DNC contacts before they enter the queue.

2. **Dial time**: Right before placing a call, perform a real-time check against the internal DNC list. This catches contacts added to DNC after the list upload.

```
Upload Pipeline:
  CSV → Parse → Normalize → Validate → DNC Scrub → Deduplicate → Enqueue

Dial Pipeline:
  Queue Pop → Timezone Check → Internal DNC Check → Dial
```

### DNC Scrubbing Performance

For high-volume dialers, the DNC check must be fast. Strategies:
- Load the internal DNC list into a Redis set for O(1) lookups
- For national DNC: use a pre-downloaded and indexed copy, updated monthly
- Scrub in batch during upload; check against internal DNC in real-time at dial time

---

## Call Recording Consent

Call recording laws vary by state. Some states require only one party to consent (the agent can consent for themselves), while others require all parties to consent.

### One-Party Consent States

In these states, only one party needs to consent to the recording. The agent's consent (or the company's policy) is sufficient. You do not need to announce the recording to the prospect.

One-party consent states (as of this writing):
Alabama, Alaska, Arizona, Arkansas, Colorado, Georgia, Hawaii, Idaho, Indiana, Iowa, Kansas, Kentucky, Louisiana, Maine, Michigan, Minnesota, Mississippi, Missouri, Nebraska, New Jersey, New Mexico, New York, North Carolina, North Dakota, Ohio, Oklahoma, Oregon, Rhode Island, South Carolina, South Dakota, Tennessee, Texas, Utah, Virginia, West Virginia, Wisconsin, Wyoming, District of Columbia

### Two-Party (All-Party) Consent States

In these states, ALL parties must consent to the recording. You must announce that the call is being recorded before the recording begins.

Two-party/all-party consent states:
California, Connecticut, Delaware, Florida, Illinois, Maryland, Massachusetts, Montana, Nevada, New Hampshire, Pennsylvania, Vermont, Washington

### Recording Notification Implementation

For a sales dialer operating nationally, the safest approach is to **always announce recording** regardless of state, because:
- You're calling prospects in various states
- Some states apply the law based on the called party's location, others based on the caller's location, and some use the stricter of the two
- The legal risk of failing to announce far outweighs the minor impact on call flow

**Implementation pattern**:

```xml
<!-- Play recording notice before connecting to agent -->
<Response>
  <Say voice="Polly.Joanna">
    This call may be recorded for quality and training purposes.
  </Say>
  <Dial record="record-from-answer-dual">
    <Client>agent-42</Client>
  </Dial>
</Response>
```

For a more nuanced approach:
1. Determine the prospect's state from their phone number or address
2. Look up whether the state requires all-party consent
3. If yes, play the recording notice before connecting
4. If no, optionally skip the notice (but this adds complexity for marginal benefit)

### Recording Storage Compliance

- Recordings must be encrypted at rest (see SOC 2 section)
- Access to recordings must be logged and auditable
- Recordings should be retained per your data retention policy (typically 1-7 years depending on industry and internal policy)
- Recordings must be deletable upon request (GDPR, CCPA)
- Do not store recordings on Twilio long-term — move to your own encrypted storage

---

## FCC Telemarketing Rules

The FCC enforces rules under the TCPA and its own regulations. Key rules that affect sales dialers:

### Caller ID Requirements

- **Caller ID must be transmitted**: Every outbound call must display a caller ID number
- **Caller ID must be accurate**: The number displayed must be a number that can be called back and reaches the calling party or their agent
- **Company name**: Must be displayed via CNAM where supported
- **No spoofing**: Caller ID must not be misleading. Using a local presence number is legal as long as it's a number you control and calls to it reach you.

### Abandoned Call Rules

An "abandoned call" occurs when a telemarketer's system connects a prospect to dead air (nobody is available to take the call). This happens in parallel and predictive dialing when multiple calls are answered simultaneously.

FCC rules:
- **Maximum 3% abandon rate**: Measured per campaign over a **30-day period**
- **Ring time**: Must allow at least **15 seconds or 4 rings** before disconnecting an unanswered call
- **Abandoned call message**: If a call is answered but no agent is available, the system must play a recorded message within **2 seconds** that includes:
  - The name of the company
  - A phone number the prospect can call
  - State that it was a telemarketing call
- **Do not re-attempt abandoned contacts** for at least **30 days** after an abandoned call

**Technical implementation**:

```javascript
// Track abandoned calls per campaign
async function recordAbandonedCall(campaignId, callSid, prospectId) {
  await AbandonedCallLog.create({ campaignId, callSid, prospectId, timestamp: new Date() });

  // Calculate rolling 30-day rate
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const totalCalls = await CallLog.count({
    campaignId,
    createdAt: { $gte: thirtyDaysAgo },
  });
  const abandonedCalls = await AbandonedCallLog.count({
    campaignId,
    timestamp: { $gte: thirtyDaysAgo },
  });

  const rate = abandonedCalls / totalCalls;
  if (rate > 0.025) {
    // Approaching limit — reduce dial ratio
    await CampaignConfig.update(campaignId, { dialRatioOverride: 'conservative' });
    await alertManager(campaignId, 'Abandoned rate at ' + (rate * 100).toFixed(1) + '%');
  }
  if (rate >= 0.03) {
    // At limit — pause parallel dialing
    await CampaignConfig.update(campaignId, { dialMode: 'power' });
    await alertManager(campaignId, 'CRITICAL: Abandoned rate at 3%, switching to power dial');
  }

  // Block prospect from re-attempt for 30 days
  await ContactQueue.markNoRetry(prospectId, { until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
}
```

### Abandoned Call Safe Harbor Message

When a call is answered but no agent is available:

```xml
<Response>
  <Pause length="1"/>
  <Say voice="Polly.Joanna">
    Hello, this is a call from Acme Sales Solutions.
    We apologize for the inconvenience. If you would like to speak with us,
    please call us at 1-800-555-0123.
    Thank you and have a great day.
  </Say>
</Response>
```

This message must play within 2 seconds of the call being answered.

---

## State-Specific Telemarketing Regulations

Beyond TCPA, many states have their own telemarketing laws that are often stricter. Key examples:

### California

- **CCPA/CPRA**: Prospects have the right to know what data is collected and request deletion
- **Additional calling hour restrictions**: Some local ordinances restrict hours further
- **Two-party recording consent**: Must announce recording

### Florida

- **Calling hours**: 8am-8pm (stricter than federal 8am-9pm)
- **Written DNC request**: Must honor written DNC requests within 30 days
- **Two-party recording consent**
- **$10,000 per violation** penalty for willful violations

### New York

- **Caller ID required**: Must display an active callback number
- **State DNC registration**: Must register with NYS DNC
- **Calling hours**: Federal standard (8am-9pm)

### Texas

- **Calling hours**: Federal standard
- **State DNC list**: Must purchase and scrub against Texas no-call list
- **Penalties**: Up to $10,000 per violation

The platform should maintain a state-rules engine that applies the most restrictive applicable rule for each contact based on their location.

---

## GDPR (General Data Protection Regulation)

If your platform serves companies that call prospects in the EU, GDPR applies.

### Key GDPR Requirements for a Dialer

1. **Lawful basis for processing**: You need a legal basis to store and call prospect data. For B2B sales, "legitimate interest" is commonly used, but this requires a documented Legitimate Interest Assessment (LIA).

2. **Right to erasure (right to be forgotten)**: When a prospect requests deletion, you must:
   - Delete all personal data (name, phone, email, company, notes)
   - Delete or anonymize call recordings
   - Remove from all lists, cadences, and queues
   - Complete within 30 days
   - Document the deletion for audit purposes

3. **Right to access**: Prospects can request all data you hold about them. You must be able to export a complete data package per contact.

4. **Data minimization**: Only collect and store data necessary for your purpose. Don't hoard data "just in case."

5. **Consent management**: If relying on consent as the legal basis, you must:
   - Obtain affirmative, specific consent
   - Track consent with timestamp and method
   - Allow easy withdrawal of consent
   - Stop processing immediately upon withdrawal

6. **Data processing agreements (DPAs)**: If you process data on behalf of customers (which a SaaS dialer does), you need DPAs with each customer.

7. **Cross-border data transfers**: If data leaves the EU (e.g., stored on US servers), you need Standard Contractual Clauses (SCCs) or another transfer mechanism.

### Technical Implementation for GDPR

- **Data deletion pipeline**: Automated pipeline that removes all PII for a contact across all tables, recordings, logs, and backups
- **Data export endpoint**: API that generates a JSON/CSV package of all data for a specific contact
- **Consent tracking table**: Records with contact ID, consent type, timestamp, method, and revocation status
- **Data retention policies**: Automated deletion of data older than the configured retention period
- **Audit logging**: Every access to personal data is logged with who, when, and why

---

## SOC 2 Compliance

SOC 2 (System and Organization Controls 2) is a security framework that SaaS companies use to demonstrate their data security practices. For a sales dialer handling sensitive call data and recordings, SOC 2 Type II certification is a common customer requirement.

### SOC 2 Trust Service Criteria

SOC 2 covers five trust principles. The most relevant for a dialer:

### Security (Required)

- **Access control**: Role-based access (RBAC) for all system access. Agents see their calls, managers see their team, admins see everything.
- **Authentication**: Multi-factor authentication (MFA) for all users. SSO via SAML/OIDC for enterprise customers.
- **Encryption in transit**: TLS 1.2+ for all connections (API, webhooks, WebSocket, WebRTC).
- **Encryption at rest**: AES-256 or KMS encryption for all stored data, especially call recordings and PII.
- **Network security**: VPC isolation, security groups, WAF for web endpoints.
- **Vulnerability management**: Regular security scans, penetration testing, dependency auditing.
- **Incident response**: Documented incident response plan, breach notification procedures.

### Availability

- **Uptime SLAs**: 99.9%+ uptime for the dialing platform. Downtime means lost sales.
- **Disaster recovery**: Multi-region deployment, automated failover, RPO/RTO targets.
- **Monitoring**: Real-time alerting on service health, latency, error rates.

### Confidentiality

- **Data classification**: Classify data by sensitivity (PII, recordings, credentials, usage metrics).
- **Access logging**: Log every access to sensitive data (call recordings, contact PII). Include who, when, what, and from where.
- **Data retention and disposal**: Define retention periods. Automate deletion when retention expires.
- **Third-party risk**: Assess and document security of all third-party services (Twilio, AWS, CRM integrations).

### Implementation Checklist for SOC 2

- [ ] RBAC implemented with principle of least privilege
- [ ] MFA enforced for all user accounts
- [ ] All data encrypted at rest (AES-256 / KMS)
- [ ] All connections encrypted in transit (TLS 1.2+)
- [ ] Audit logs for all data access and admin actions
- [ ] Audit logs are immutable (append-only, shipped to separate storage)
- [ ] Automated vulnerability scanning in CI/CD pipeline
- [ ] Annual penetration test by third-party firm
- [ ] Incident response plan documented and tested
- [ ] Business continuity / disaster recovery plan documented and tested
- [ ] Employee security awareness training completed annually
- [ ] Vendor security assessments documented
- [ ] Data retention policies defined and automated
- [ ] Change management process documented (PR reviews, approval gates)

---

## PCI-DSS (Payment Card Industry Data Security Standard)

If your platform ever handles payment card data (e.g., taking payments during calls, storing credit card info), PCI-DSS applies. For most sales dialers, this is avoidable.

### Avoiding PCI Scope

The best strategy is to avoid PCI scope entirely:
- Use a third-party payment processor (Stripe, etc.) with tokenization
- Never store, process, or transmit cardholder data in your system
- If payments are taken during calls, use DTMF-based payment entry that routes directly to the payment processor, bypassing your system
- Pause recording during any payment data entry

### If PCI-DSS Applies

If you must handle payment data:
- **Tokenize immediately**: Replace card numbers with tokens at the point of entry
- **Secure fields**: Use iframe-based payment fields that are hosted by the payment processor (e.g., Stripe Elements)
- **Recording handling**: STOP recording before any payment data is spoken. Implement a "pause recording" mechanism linked to the payment flow.
- **Network segmentation**: Isolate the cardholder data environment (CDE) from the rest of the system
- **Annual PCI assessment**: Self-Assessment Questionnaire (SAQ) at minimum; external audit (QSA) for higher volumes

### Recording and PCI

This is a critical intersection. If a prospect reads their credit card number during a recorded call:
- That recording now contains cardholder data
- The recording storage is now in PCI scope
- Your entire recording pipeline may be in PCI scope

**Prevention pattern**:
1. When the call flow reaches a payment step, pause recording via Twilio API
2. Collect payment info (DTMF or verbally, processed by payment provider)
3. Resume recording after payment is complete

```javascript
// Pause recording during payment
await twilioClient.calls(callSid)
  .recordings(recordingSid)
  .update({ status: 'paused' });

// ... payment processing ...

// Resume recording
await twilioClient.calls(callSid)
  .recordings(recordingSid)
  .update({ status: 'in-progress' });
```

---

## Compliance Architecture Patterns

### Compliance as Middleware

Build compliance checks as middleware that runs in the dial pipeline:

```
Prospect selected from queue
  → Timezone check (TCPA calling hours)
  → DNC check (national + state + internal)
  → Consent verification (ATDS consent if applicable)
  → Recording consent determination (one-party vs two-party state)
  → Calling hours check (state-specific overrides)
  → If all pass → DIAL
  → If any fail → SKIP with reason code, move to next
```

Every check is logged with the result and reason. This creates an audit trail proving compliance for each call attempt.

### Compliance Audit Trail

For every call, store:
- **DNC scrub result**: When scrubbed, against which lists, result
- **Consent record**: What consent was on file, when obtained, method
- **Timezone check**: What timezone was determined, method used, whether within calling hours
- **Recording disclosure**: Whether recording notice was played, which state rule applied
- **Caller ID used**: Which number was displayed, that it was valid and callable

This audit trail is your defense in any regulatory inquiry or lawsuit.

### Compliance Dashboard

Build a compliance dashboard for account admins and compliance officers:
- **DNC scrub status**: Last scrub date, scrub coverage, DNC match rate
- **Abandoned call rate**: Real-time, per campaign, rolling 30-day
- **Consent coverage**: Percentage of contacts with documented consent
- **Recording compliance**: Percentage of calls with recording disclosure played
- **Calling hours violations**: Any calls placed outside permitted hours (should be zero)
- **DNC requests**: Recent DNC additions, processing status

### Regulatory Change Management

Telemarketing regulations change frequently (FCC rulings, state law changes, court decisions). Your platform needs:
- A compliance rules engine that is configurable without code changes
- State-level rule overrides (calling hours, DNC requirements, consent type)
- A process for monitoring regulatory changes and updating the engine
- Customer notification when compliance rules change

---

## CCPA (California Consumer Privacy Act) / CPRA

If you have prospects or customers in California, CCPA/CPRA applies.

### Key Requirements

1. **Right to know**: Consumers can request what personal info you've collected
2. **Right to delete**: Consumers can request deletion of their personal info
3. **Right to opt-out**: Consumers can opt out of the "sale" of their personal info
4. **Non-discrimination**: Cannot discriminate against consumers who exercise their rights

### Technical Implementation

- **Privacy request handling**: Automated workflow to process access and deletion requests within the 45-day deadline
- **Data inventory**: Maintain a map of where all personal data is stored across your system
- **Do Not Sell flag**: Contact-level flag that prevents data sharing with third parties
- **Privacy policy link**: Required on your website and accessible from any communication

---

## Compliance Testing and Validation

### Pre-Launch Compliance Checklist

Before launching any dialing campaign:
- [ ] Contact list scrubbed against national DNC (within 31 days)
- [ ] Contact list scrubbed against applicable state DNC lists
- [ ] Contact list scrubbed against internal DNC list
- [ ] Consent records verified for all contacts (if ATDS rules apply)
- [ ] Calling hours configured per state rules
- [ ] Recording disclosure configured (always-on recommended)
- [ ] Caller ID set to a valid, callable number
- [ ] Abandoned call rate monitoring enabled
- [ ] Abandoned call safe harbor message configured
- [ ] Ring timeout set to minimum 15 seconds
- [ ] Compliance audit logging enabled

### Ongoing Monitoring

- Monthly re-scrub against national DNC
- Daily abandoned call rate review
- Weekly compliance dashboard review
- Quarterly consent record audit
- Annual compliance training for all dialing agents
- Annual review of state-level regulatory changes

### Penalties for Non-Compliance

| Regulation | Penalty Range                                              |
|-----------|-------------------------------------------------------------|
| TCPA      | $500 per violation (negligent), $1,500 per violation (willful) |
| FCC       | Up to $10,000 per violation, plus injunctions               |
| State DNC | Varies: $1,000-$25,000 per violation depending on state     |
| GDPR      | Up to 4% of annual global revenue or 20M EUR               |
| CCPA      | $2,500 per violation (unintentional), $7,500 per violation (intentional) |

Class action lawsuits under TCPA frequently result in settlements of $10M-$100M+. Compliance is not optional.
