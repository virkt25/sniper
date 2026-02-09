# Domain Context: Sales Workflows

You are working on a sales dialer SaaS product. This context gives you deep expertise in sales dialer workflows, dialing modes, cadence management, disposition systems, and the day-to-day operations of SDR (Sales Development Representative) teams that use dialers.

---

## Dialer Modes Overview

A sales dialer supports multiple dialing modes. Each mode represents a different tradeoff between agent efficiency (talk time per hour) and prospect experience (dead air, abandoned calls). The platform should support all three modes and let managers choose per campaign or team.

---

## Power Dialer

The power dialer is the simplest and most compliant mode. It dials one call at a time, automatically advancing to the next prospect when the current call ends.

### How It Works

1. Agent starts a dialing session and selects a contact list
2. System loads the first prospect and displays their information (name, company, notes, talk track)
3. Agent clicks "Dial" (or auto-dial is enabled)
4. System places a single outbound call
5. If answered by a human: agent has a conversation, then dispositions the call
6. If voicemail: agent drops a pre-recorded voicemail (or records a live one)
7. If no answer / busy: system auto-dispositions and moves to next
8. Repeat from step 2

### Key Characteristics

- **One call at a time**: Zero risk of abandoned calls (compliance-friendly)
- **Agent always present**: No dead air — the agent hears ringing and is ready when someone picks up
- **Typical throughput**: 40-80 dials/hour depending on connect rates and talk time
- **Best for**: High-value prospects, regulated industries, account-based selling

### Implementation Considerations

- Auto-advance: When a call ends, automatically load the next prospect and start dialing after a configurable delay (1-5 seconds)
- Preview mode variant: Show prospect info for N seconds before dialing, letting the agent prepare. Some power dialers offer "preview" as a sub-mode.
- Call timer: Show elapsed time during the call. SDR managers track average talk time as a KPI.
- Notes panel: Agent types notes during the call that attach to the contact record.

---

## Parallel Dialer

The parallel dialer places multiple calls simultaneously (typically 3-5 lines) and connects the first live answer to the agent. This dramatically increases agent talk time by eliminating time spent listening to ringing and voicemail.

### How It Works

1. Agent starts a session. Agent is placed in a "waiting room" (conference with hold music or silence)
2. System dials N prospects simultaneously (N = configured line count)
3. AMD (Answering Machine Detection) runs on each call
4. First call answered by a human:
   a. All other ringing calls are immediately canceled
   b. The answered call is bridged to the agent's conference
   c. Agent sees the prospect's info on screen
5. Calls answered by machines: voicemail is dropped automatically
6. Calls not answered: dispositioned as no-answer, scheduled for retry
7. When the connected call ends, return to step 2

### Key Characteristics

- **Multiple simultaneous calls**: 3-5 lines typical
- **Higher throughput**: 100-200+ dials/hour, 20-40 conversations/hour
- **AMD dependency**: Accuracy of answering machine detection directly impacts quality
- **Abandoned call risk**: If multiple calls are answered simultaneously, all but one must be dropped — those are "abandoned calls" regulated by FCC (max 3% rate)
- **Dead air risk**: 0.5-2 seconds of silence while the system bridges the answered call to the agent
- **Best for**: High-volume outbound, SDR teams with large prospect lists

### Implementation Considerations

- **Line count configuration**: Let managers set the number of simultaneous lines per campaign. More lines = more throughput but more abandoned calls.
- **AMD tuning**: Aggressive AMD settings mean more false positives (humans treated as machines). This is the worst outcome — a live prospect gets a voicemail drop or hang-up.
- **Abandoned call tracking**: Track and enforce the 3% abandoned call rate limit per campaign over a rolling 30-day window. Alert managers when approaching the limit.
- **Speed-to-answer**: Measure the delay between a prospect saying "Hello" and the agent being connected. Target under 2 seconds. Beyond 3 seconds, prospects hang up.
- **Prospect info display**: When a call connects, the agent has zero prep time. Display critical info immediately: name, company, title, last interaction, talk track.

### Connect-on-Answer Flow

This is the critical path and must be optimized for latency:

```
Prospect answers → AMD classifies as human → Cancel other calls → Bridge to agent
```

Each step adds latency. Target total latency under 1.5 seconds from answer to agent hearing prospect.

Implementation:
1. AMD running asynchronously (`asyncAmd: true`) with callback
2. On `human` classification: fire cancel commands for all other calls in parallel (not sequentially)
3. Bridge via conference (agent is already in it) — update the answered call's TwiML to join the conference
4. Push prospect data to agent UI via WebSocket simultaneously

---

## Predictive Dialer

The predictive dialer algorithmically determines how many lines to dial based on real-time metrics. It dynamically adjusts the dial ratio to minimize agent idle time while keeping abandoned call rates below the legal limit.

### How It Works

Same as parallel dialer, but the number of simultaneous lines (dial ratio) is calculated by an algorithm rather than manually configured.

### Predictive Algorithm Inputs

The algorithm takes into account:
- **Current answer rate**: Percentage of calls being answered (live or machine). Updated in real-time.
- **Average talk time**: How long connected calls last. Updated per-call.
- **Average wrap-up time**: Time agents spend on after-call work (notes, disposition). Updated per-call.
- **Number of available agents**: Agents currently idle and ready.
- **Abandoned call rate**: Current rolling rate vs. the 3% limit.
- **Time of day**: Answer rates vary significantly by hour.

### Dial Ratio Calculation

A simplified version of the Erlang-C based calculation:

```
dial_ratio = available_agents / (answer_rate * (1 - target_abandon_rate))
```

Example: 5 available agents, 20% answer rate, 2% target abandon rate:
```
dial_ratio = 5 / (0.20 * 0.98) = 25.5 → dial 25-26 calls
```

In practice, the algorithm is more sophisticated, using moving averages, exponential smoothing, and safety margins. The dial ratio is recalculated every few seconds or on each dial round.

### Key Characteristics

- **Highest throughput**: 200-400+ dials/hour per agent, 30-50 conversations/hour
- **Requires scale**: Predictive dialing only works well with 5+ agents dialing simultaneously. With fewer agents, the predictions are unreliable.
- **Compliance risk**: Highest risk of exceeding the 3% abandoned call limit. Must have real-time monitoring and automatic throttling.
- **Best for**: Large call centers, high-volume campaigns, commodity sales

### Implementation Considerations

- **Warm-up period**: When a session starts, the algorithm has no data. Start with a conservative dial ratio (1.2-1.5x agent count) and ramp up as data accumulates.
- **Safety throttle**: Automatically reduce dial ratio when abandoned rate approaches 2.5%. Hard stop at 3%.
- **Agent pacing**: If agents take longer calls than predicted, the system over-dials. If agents have quick calls, it under-dials. The algorithm must adapt within seconds.
- **Multi-agent pooling**: Predictive dialing across a pool of agents, not per-agent. This gives the algorithm more statistical power.

---

## Cadences (Multi-Touch Sequences)

A cadence is a predefined sequence of outreach steps across multiple channels. Cadences automate the follow-up process and ensure consistent prospect engagement.

### Cadence Structure

A cadence is defined as an ordered list of steps with:
- **Step number**: Sequential position
- **Channel**: call, email, sms, linkedin, task
- **Delay**: Days/hours after previous step (or after enrollment)
- **Template**: For emails/SMS, the template to use
- **Talk track**: For calls, the suggested script
- **Auto vs Manual**: Whether the step executes automatically or requires agent action

Example cadence:

| Step | Day | Channel  | Action                         | Auto |
|------|-----|----------|--------------------------------|------|
| 1    | 0   | Email    | Intro email template           | Yes  |
| 2    | 1   | Call     | Introductory call              | No   |
| 3    | 1   | LinkedIn | Connection request             | No   |
| 4    | 3   | Email    | Follow-up email template       | Yes  |
| 5    | 5   | Call     | Second call attempt            | No   |
| 6    | 7   | Email    | Value prop email               | Yes  |
| 7    | 10  | Call     | Final call attempt             | No   |
| 8    | 12  | Email    | Breakup email                  | Yes  |

### Cadence Engine Architecture

The cadence engine is a scheduler that:
1. Tracks each contact's position in their cadence
2. Calculates when the next step should fire based on delay and timezone
3. For auto steps (email/SMS): Executes at the scheduled time
4. For manual steps (call/LinkedIn): Adds the task to the agent's queue
5. Handles exits: Contact replies to email, answers a call, requests DNC, or meeting is booked — remove from cadence
6. Handles re-enrollment: Contacts can be re-enrolled in a different cadence after completing or exiting one

### Contact States Within a Cadence

- **Active**: Currently progressing through steps
- **Paused**: Temporarily halted (e.g., prospect is on vacation)
- **Completed**: Finished all steps without conversion
- **Converted**: Meeting booked or deal advanced (success exit)
- **Bounced**: Email bounce, bad phone number
- **Unsubscribed**: Opted out of communications
- **DNC**: Do Not Call requested

### Key Implementation Details

- **Timezone awareness**: Email send times and call scheduling must respect the prospect's local timezone (8am-9pm per TCPA for calls, business hours for emails)
- **Throttling**: Don't blast 10,000 emails at once. Drip them over hours to avoid spam filters.
- **A/B testing**: Support variants within a cadence step (e.g., two email templates, randomly assigned). Track open/reply rates per variant.
- **Analytics**: Per-cadence metrics: enrollment count, completion rate, conversion rate, per-step drop-off, reply rates, connect rates.

---

## Disposition Workflows

After every call, the agent must "disposition" it — categorize the outcome. Dispositions drive what happens next for the contact.

### Standard Disposition Set

| Disposition     | Description                    | Next Action                                      |
|----------------|--------------------------------|--------------------------------------------------|
| Connected      | Spoke with target contact      | Move to next cadence step or close               |
| Meeting Booked | Scheduled a meeting            | Create calendar event, advance pipeline stage     |
| Callback       | Contact asked to call back     | Schedule callback at requested time               |
| Voicemail      | Left a voicemail               | Advance cadence, schedule next attempt            |
| No Answer      | Phone rang, nobody picked up   | Schedule retry per retry rules                   |
| Busy           | Got a busy signal              | Retry in 30-60 minutes                           |
| Wrong Number   | Number doesn't belong to contact| Flag for data cleanup, try alternate numbers     |
| Gatekeeper     | Spoke with assistant/reception | Note interaction, schedule callback               |
| Not Interested | Contact declined               | Mark as disqualified, exit cadence               |
| DNC            | Contact requested Do Not Call  | Immediately add to DNC list, exit all cadences   |
| Bad Data       | Number disconnected/invalid    | Remove number, try alternate                     |

### Custom Dispositions

The platform should support custom dispositions per campaign or team. Managers define:
- Disposition name and description
- Whether it's a "terminal" disposition (ends the cadence) or "continuation" (cadence continues)
- Associated automation: what happens automatically after this disposition
- Required fields: e.g., "Callback" requires a callback date/time, "Meeting Booked" requires calendar link

### Disposition Triggers

When an agent selects a disposition:
1. Update the call record with the disposition code and any notes
2. Update the contact record (last contact date, call count, current status)
3. Execute disposition automation (schedule callback, advance cadence, book meeting, add to DNC)
4. Start wrap-up timer (configurable, typically 30-120 seconds)
5. When wrap-up completes, auto-advance to next prospect

### Wrap-Up Time

After dispositioning, agents need "wrap-up time" to finish notes before the next call. This is configurable:
- **Auto wrap-up**: Timer counts down (e.g., 60 seconds), then auto-advances
- **Manual wrap-up**: Agent clicks "Ready" when done
- **Forced wrap-up**: Manager sets a maximum wrap-up time; system advances when it expires

Track wrap-up time as a metric. Excessive wrap-up indicates an agent needs coaching or the CRM workflow is too cumbersome.

---

## Contact Queue Management

The contact queue is what feeds the dialer. Managing it well is critical to dialer efficiency and compliance.

### List Upload

Contacts enter the system via:
- **CSV upload**: Most common. Map columns to fields (name, phone, email, company, etc.)
- **CRM sync**: Pull leads/contacts from Salesforce, HubSpot, etc.
- **API**: Programmatic insertion from other systems
- **Manual entry**: One-off additions

### Upload Processing Pipeline

1. **Parse**: Validate CSV format, handle encoding issues
2. **Normalize**: Phone numbers to E.164, names to proper case, emails to lowercase
3. **Validate**: Phone number format check, email format check
4. **Deduplicate**: Against existing contacts in the system
5. **DNC scrub**: Check against national DNC, state DNC, and internal DNC lists
6. **Enrich**: Optional — append company data, titles from third-party data providers
7. **Assign**: Distribute contacts to agents based on territory rules or round-robin
8. **Enqueue**: Add to the appropriate dialing queue

### Queue Priority and Sorting

Contacts in the queue are not FIFO. They're prioritized by:

1. **Scheduled callbacks**: Highest priority. These are promises to call back at a specific time.
2. **Hot leads**: Contacts flagged as high-value or recently engaged (e.g., visited website, opened email)
3. **Retry attempts**: Contacts that need a follow-up attempt per the cadence schedule
4. **Fresh contacts**: Newly uploaded contacts that haven't been attempted
5. **Recycled contacts**: Contacts that have completed a rest period after previous attempts

### Timezone-Aware Filtering

TCPA requires calls only between 8am and 9pm in the prospect's local timezone. The queue must:

1. Determine each contact's timezone (from area code, address, or explicit timezone field)
2. Filter out contacts outside the 8am-9pm window at the time of dialing
3. Re-include them when their window opens
4. Handle DST transitions correctly

```
Timezone lookup priority:
1. Explicit timezone field on the contact record
2. State/zip code mapping
3. Area code mapping (less reliable — number portability means area codes don't always match location)
```

### Retry Rules

Configure per-campaign:
- **Max attempts**: Total call attempts before contact is removed from queue (e.g., 6)
- **Retry delay**: Minimum time between attempts (e.g., 4 hours, 1 day)
- **Retry schedule**: Different delays by attempt number (e.g., attempt 2 after 4 hours, attempt 3 after 24 hours)
- **Max attempts per day**: Don't call the same person more than N times in a day (e.g., 2)
- **Disposition-based rules**: Different retry behavior per disposition (e.g., busy = retry in 30min, no answer = retry in 4 hours)

---

## SDR Workflows

Understanding how SDRs (Sales Development Representatives) actually use the dialer day-to-day is critical for building the right product.

### A Typical SDR Day

1. **Morning prep (9:00-9:15)**: Review callbacks scheduled for today, check email responses overnight, review new leads assigned
2. **Dialing block 1 (9:15-11:00)**: Power/parallel dialing through the queue. Focus on callbacks first.
3. **Email/LinkedIn (11:00-11:30)**: Handle cadence steps that require email or social touches
4. **Dialing block 2 (11:30-1:00)**: More dialing, targeting East Coast contacts before lunch
5. **Lunch (1:00-1:30)**
6. **Dialing block 3 (1:30-3:00)**: Target West Coast contacts (now 10:30am-12pm their time)
7. **Dialing block 4 (3:00-5:00)**: Mixed dialing, callbacks, follow-ups
8. **End of day (5:00-5:15)**: Log notes, update CRM, check tomorrow's callbacks

### Prospect Research

Before a call, agents need context. The dialer should surface:
- **Contact info**: Name, title, company, phone, email
- **Company info**: Industry, size, funding, news
- **Engagement history**: Previous calls (with recordings), emails sent/opened, website visits
- **CRM data**: Pipeline stage, deal value, associated opportunities
- **Talk track**: Suggested opener, value proposition, common objections and responses
- **Social links**: LinkedIn profile for quick reference

### Talk Tracks and Scripts

Talk tracks guide the conversation without being rigid scripts. Structure:

1. **Opener**: First 10 seconds — identify yourself and the reason for calling
2. **Value prop**: 20-30 second pitch tailored to the prospect's industry/role
3. **Qualification questions**: BANT (Budget, Authority, Need, Timeline) or similar framework
4. **Objection handling**: Common objections with suggested responses
5. **Close**: Ask for the meeting/next step
6. **Voicemail script**: What to say when leaving a voicemail

The platform should display these dynamically based on the prospect's attributes and campaign settings.

### Objection Handling Library

Build a searchable library of objections and suggested responses:

- "I'm not interested" → Acknowledge, pivot to value
- "Send me an email" → Offer a brief overview first, then send
- "We already have a solution" → Ask about pain points with current solution
- "Now isn't a good time" → Offer a specific callback time
- "How did you get my number?" → Professional, transparent response
- "What does this cost?" → Redirect to value and qualification

Agents can search this during a live call. AI can eventually suggest responses in real-time.

---

## Manager Features

### Live Call Monitoring

Managers can listen to any active call in real-time without the agent or prospect knowing (unless disclosed). Implementation via Twilio Conference:

1. Agent and prospect are in a named conference
2. Manager joins the same conference with `muted: true`
3. Manager hears both parties but is silent
4. UI shows a list of active calls with agent name, prospect name, duration, and a "Listen" button

### Whisper Coaching

Manager speaks only to the agent — the prospect cannot hear:

1. Manager is in the conference on a separate participant connection
2. Use Twilio's participant `coach` attribute to route manager's audio only to the agent
3. Agent hears the manager's coaching in one ear while talking to the prospect
4. Common use: manager suggests a response to an objection in real-time

### Barge-In

Manager joins the conversation as a visible participant:

1. Manager's conference participant is unmuted
2. Both agent and prospect can hear the manager
3. Use case: escalation, executive involvement, training situations
4. Agent should be trained on barge-in etiquette (introduce the manager)

### Call Takeover

Manager replaces the agent on the call:

1. Manager barges in
2. Agent is muted or removed from the conference
3. Manager continues the conversation
4. Typically used when a call is going very well or very badly

### Live Dashboard

Managers need real-time visibility into:
- **Active calls**: Who's calling, how long, with whom
- **Agent status**: Idle, dialing, on call, wrapping up, on break
- **Today's metrics**: Dials, connections, talk time, meetings booked
- **Queue depth**: How many contacts remain in each agent's queue
- **Leaderboard**: Ranked agents by dials, connections, meetings
- **Alerts**: Agent idle too long, call duration unusually long, abandoned rate approaching limit

---

## Voicemail Drop

Voicemail drop lets agents leave a pre-recorded voicemail with one click instead of waiting through the greeting and recording a live message every time.

### How It Works

1. AMD detects a voicemail (`machine_end_beep` or `machine_end_other`)
2. System waits for the beep (if `DetectMessageEnd` mode)
3. System plays the pre-recorded voicemail audio file
4. System hangs up after the audio finishes
5. Agent never interacted with the call — they're already on to the next dial

### Pre-Recorded Message Management

- Agents can record multiple voicemail messages
- Messages are assigned per campaign or cadence step
- Messages are stored as audio files (WAV/MP3) in S3
- Messages should be 20-30 seconds maximum
- Personalization: Use TTS to prepend the prospect's name: "Hi [Name], this is [Agent]..."

### Manual Voicemail Drop

For power dialer mode where the agent is listening:
1. Agent hears voicemail greeting
2. Agent clicks "Drop Voicemail" button
3. System plays the pre-recorded message
4. Agent's microphone is muted / disconnected during playback
5. System hangs up after playback
6. Agent is advanced to the next call

This saves 30-60 seconds per voicemail compared to live recording.

---

## Local Presence

Local presence uses a caller ID that matches the prospect's area code. It is the single highest-impact feature for answer rates.

### Impact on Answer Rates

Industry data:
- Unknown/toll-free number: 8-12% answer rate
- Out-of-state number: 12-18% answer rate
- Local (matching area code) number: 35-55% answer rate

This is a 3-5x improvement. For a team making 500 dials/day, this means 100-150 additional conversations.

### Implementation

1. **Number pool**: Provision numbers covering the area codes of your prospect base. For national coverage in the US, you need 200-400 numbers across major area codes.
2. **Area code mapping**: Map each prospect to an area code from their phone number.
3. **Number selection**: At dial time, select a number from the pool matching the prospect's area code.
4. **Fallback chain**: If no exact match, try same state, then same region, then default number.
5. **Inbound routing**: When a prospect calls back the local number, route to the original agent (or their team if unavailable).

### Callback Routing for Local Presence

When using local presence, prospects call back numbers that aren't "yours" in a traditional sense. You must:

1. Track which number was used to call which prospect (in the call record)
2. When an inbound call arrives on any pool number, look up who was last called from that number
3. Route to the agent who made the original call
4. If agent is unavailable: route to team queue with prospect context displayed

### Number Reputation Management

Local presence numbers are high-volume outbound numbers. They will get flagged as spam.

Mitigation:
- **Rotation**: Spread calls across the pool. Don't use one number for more than 50-100 calls/day.
- **Cooling**: If a number shows declining answer rates, rest it for 2-4 weeks.
- **Registration**: Register numbers with free caller registries and CNAM databases.
- **SHAKEN/STIR**: Ensure A-level attestation through Twilio's Trust Hub.
- **Monitoring**: Track per-number answer rates daily. Sudden drops indicate flagging.
- **Pool size**: Over-provision by 2-3x to allow for rotation and cooling.
