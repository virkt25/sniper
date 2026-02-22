# Domain Context: Telephony

You are working on a sales dialer SaaS product. This context gives you deep expertise in telephony systems, specifically Twilio-based voice infrastructure, WebRTC browser calling, and the architectural patterns required for a high-volume outbound dialing platform.

---

## Twilio Programmable Voice — Core Concepts

Twilio Programmable Voice is the telephony backbone. Every call is a **Call Resource** identified by a `CallSid`. Calls are controlled by returning **TwiML** (Twilio Markup Language) from webhook endpoints, or by using the **REST API** to create and modify calls in-flight.

### Making Outbound Calls

Outbound calls are initiated via the REST API. The critical parameters:

```
POST /2010-04-01/Accounts/{AccountSid}/Calls.json

Required:
  To: "+15551234567"           # E.164 format, always
  From: "+15559876543"         # Must be a Twilio number you own
  Url: "https://your-app.com/twiml/outbound"   # TwiML webhook

Important optional:
  StatusCallback: "https://your-app.com/webhooks/call-status"
  StatusCallbackEvent: ["initiated", "ringing", "answered", "completed"]
  StatusCallbackMethod: "POST"
  MachineDetection: "Enable"   # or "DetectMessageEnd"
  MachineDetectionTimeout: 5000
  AsyncAmd: true               # non-blocking AMD
  AsyncAmdStatusCallback: "https://your-app.com/webhooks/amd"
  Timeout: 30                  # seconds before no-answer
  Record: true                 # auto-record
  RecordingChannels: "dual"    # separate caller/callee audio
  CallerId: "+15559876543"     # display number
```

In Node.js with the Twilio SDK (`twilio` npm package):

```javascript
const client = require('twilio')(accountSid, authToken);

const call = await client.calls.create({
  to: prospect.phone,
  from: dialerNumber,
  url: `${BASE_URL}/twiml/outbound/${callSessionId}`,
  statusCallback: `${BASE_URL}/webhooks/call-status`,
  statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
  machineDetection: 'DetectMessageEnd',
  asyncAmd: true,
  asyncAmdStatusCallback: `${BASE_URL}/webhooks/amd`,
  timeout: 30,
  record: true,
  recordingChannels: 'dual',
});
```

The `call.sid` is your primary identifier. Store it immediately in your database keyed to the session, prospect, and agent.

### Receiving Inbound Calls

Inbound calls arrive at a Twilio phone number's **Voice URL** webhook. Configure this per-number via the API or console. Your endpoint receives a POST with `CallSid`, `From`, `To`, `CallStatus`, and other metadata. You respond with TwiML to route the call.

Pattern for a sales dialer: inbound calls are typically callbacks from prospects. Look up the `From` number against your contact database to identify the prospect, then route to the assigned agent or a queue.

```javascript
app.post('/twiml/inbound', (req, res) => {
  const { From, To, CallSid } = req.body;
  const prospect = await ContactService.findByPhone(From);
  const twiml = new VoiceResponse();

  if (prospect && prospect.assignedAgent) {
    // Route to assigned agent's browser client
    const dial = twiml.dial({ callerId: To });
    dial.client(prospect.assignedAgent.twilioIdentity);
  } else {
    // Route to general inbound queue
    const dial = twiml.dial();
    dial.queue('inbound-general');
  }

  res.type('text/xml').send(twiml.toString());
});
```

---

## TwiML — Call Control Verbs

TwiML is XML returned from your webhooks that tells Twilio what to do with a call. The key verbs for a sales dialer:

### `<Dial>`

Connects the current call to another party. Sub-elements determine the destination:

- `<Number>`: Dial a phone number
- `<Client>`: Dial a Twilio Client (browser/mobile SDK user)
- `<Conference>`: Place into a conference room
- `<Queue>`: Connect to a caller waiting in a queue
- `<Sip>`: Dial a SIP endpoint

Critical attributes:
- `callerId`: The number displayed to the called party
- `timeout`: Seconds to wait for answer (default 30)
- `record`: `"record-from-answer-dual"` for dual-channel recording
- `action`: URL to POST to when the dial completes (use for post-call logic)
- `method`: HTTP method for action URL

```xml
<Response>
  <Dial callerId="+15559876543" record="record-from-answer-dual"
        action="/twiml/dial-complete" timeout="30">
    <Client>agent-42</Client>
  </Dial>
</Response>
```

### `<Say>`

Text-to-speech. Use for announcements, IVR prompts, or voicemail messages.

```xml
<Say voice="Polly.Matthew" language="en-US">
  This call may be recorded for quality assurance purposes.
</Say>
```

Supported voices: Amazon Polly voices (e.g., `Polly.Matthew`, `Polly.Joanna`) and Google TTS voices. For a professional dialer, use `Polly.Matthew` (male) or `Polly.Joanna` (female) for US English.

### `<Record>`

Records audio from the caller. Use for voicemail or call recording.

```xml
<Record maxLength="120" action="/twiml/recording-complete"
        recordingStatusCallback="/webhooks/recording-status"
        transcribe="false" trim="trim-silence" />
```

Key attributes:
- `maxLength`: Maximum seconds to record
- `action`: URL called when recording ends
- `recordingStatusCallback`: Async notification when recording file is ready
- `trim`: `"trim-silence"` removes leading/trailing silence
- `transcribe`: Twilio's built-in transcription (prefer your own STT pipeline instead)

### `<Gather>`

Collects DTMF (keypad) or speech input from the caller.

```xml
<Gather numDigits="1" action="/twiml/ivr-input" method="POST" timeout="5">
  <Say>Press 1 to connect to an agent. Press 2 to leave a message.</Say>
</Gather>
<Say>We didn't receive your input. Goodbye.</Say>
```

The `<Say>` or `<Play>` nested inside `<Gather>` plays while waiting for input. If no input is received within `timeout` seconds, Twilio falls through to the next verb.

For speech input: add `input="speech dtmf"` and `speechTimeout="auto"`. The callback receives `SpeechResult` and `Confidence`.

### `<Conference>`

Places the caller into a named conference room. This is the backbone of multi-party calling, monitoring, and coaching features.

```xml
<Dial>
  <Conference statusCallback="/webhooks/conference-status"
              statusCallbackEvent="start end join leave mute hold"
              record="record-from-start"
              startConferenceOnEnter="true"
              endConferenceOnExit="false"
              beep="false"
              waitUrl="/hold-music.xml">
    call-session-abc123
  </Conference>
</Dial>
```

Conference names are scoped per account. Use unique names like `call-session-{uuid}` to isolate calls.

Key patterns:
- **Agent + Prospect call**: Both in same conference. Agent enters first (coach line), prospect is dialed in via API.
- **Manager monitoring**: Manager joins same conference with `muted="true"`. They hear both parties but are silent.
- **Whisper coaching**: Manager is unmuted only to the agent's channel (use Twilio's participant controls).
- **Barge-in**: Manager unmutes fully, becoming a three-way call.

---

## StatusCallback Webhooks

StatusCallbacks are how you track call lifecycle in real time. Configure them on the outbound call creation or on `<Dial>` verbs.

### Call Status Events

The events you should subscribe to:

| Event       | When It Fires                                      |
|-------------|-----------------------------------------------------|
| `initiated` | Call request sent to Twilio                         |
| `ringing`   | Remote phone is ringing                             |
| `answered`  | Remote party answered                               |
| `completed` | Call ended (any reason)                             |

The `completed` event includes `CallDuration` (billable seconds) and `Duration` (total seconds). It also includes `CallStatus` which can be:
- `completed`: Normal hangup
- `busy`: Busy signal
- `no-answer`: No answer within timeout
- `failed`: Call could not be placed
- `canceled`: Call was canceled before answer

### Webhook Payload

Every StatusCallback POST includes:
- `CallSid`: Unique call ID
- `AccountSid`: Your account ID
- `From`, `To`: E.164 numbers
- `CallStatus`: Current status
- `Direction`: `inbound` or `outbound-api`
- `Timestamp`: Event time
- `CallDuration`: Billable seconds (on `completed` only)
- `SequenceNumber`: Ordering guarantee within a call

### Architectural Pattern for StatusCallbacks

StatusCallbacks arrive asynchronously and can arrive out of order across calls. Your webhook handler must:

1. Validate the Twilio signature (see security section below)
2. Parse the payload and immediately enqueue to a message queue (Redis, SQS, etc.)
3. Return 200 within ~5 seconds (Twilio retries on timeout)
4. Process asynchronously: update call records, trigger disposition logic, emit real-time events

```javascript
app.post('/webhooks/call-status', twilioSignatureValidator, (req, res) => {
  const event = {
    callSid: req.body.CallSid,
    status: req.body.CallStatus,
    duration: req.body.CallDuration,
    timestamp: req.body.Timestamp,
    sequenceNumber: req.body.SequenceNumber,
  };

  // Enqueue, don't process inline
  await callEventQueue.add('call-status', event);
  res.sendStatus(200);
});
```

### Twilio Request Validation

Always validate that webhook requests actually come from Twilio. Use the `twilio` SDK's `validateRequest` or Express middleware:

```javascript
const { webhook } = require('twilio');

// Express middleware — validates X-Twilio-Signature header
app.use('/webhooks', webhook({ authToken: process.env.TWILIO_AUTH_TOKEN }));
```

This prevents spoofed requests from triggering call state changes.

---

## WebRTC — Browser-Based Calling

Agents make and receive calls directly in their browser using the **Twilio Client JS SDK** (formerly known as Twilio.js). This eliminates the need for physical phones or softphones.

### Architecture

1. Your server generates an **Access Token** with a Voice Grant for each agent
2. The browser initializes a `Twilio.Device` with the token
3. Outbound calls: browser tells your server to create a call via REST API; the TwiML connects the PSTN call to the agent's Client identity
4. Inbound calls: Twilio hits your TwiML webhook, which `<Dial><Client>agent-identity</Client></Dial>`

### Access Token Generation (Server-Side)

```javascript
const AccessToken = require('twilio').jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

function generateToken(agentIdentity) {
  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY_SID,
    process.env.TWILIO_API_KEY_SECRET,
    { identity: agentIdentity, ttl: 3600 }
  );

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
    incomingAllow: true,
  });

  token.addGrant(voiceGrant);
  return token.toJwt();
}
```

The `outgoingApplicationSid` points to a TwiML App in your Twilio account. When the browser makes an outgoing call, Twilio hits the TwiML App's Voice URL with the parameters the browser passed.

### Browser-Side SDK

```javascript
import { Device } from '@twilio/voice-sdk';

const device = new Device(accessToken, {
  codecPreferences: [Device.Codec.Opus, Device.Codec.PCMU],
  closeProtection: true,
  enableRingingState: true,
});

device.on('registered', () => console.log('Ready to make/receive calls'));
device.on('incoming', handleIncomingCall);
device.on('error', handleError);
device.on('tokenWillExpire', () => refreshToken());

await device.register();

// Making an outbound call
const call = await device.connect({
  params: {
    To: '+15551234567',
    SessionId: 'abc-123',
  },
});

call.on('accept', () => console.log('Call connected'));
call.on('disconnect', () => console.log('Call ended'));
call.on('mute', (isMuted) => updateMuteUI(isMuted));

// Call controls
call.mute(true);   // Mute agent mic
call.mute(false);  // Unmute
call.disconnect();  // Hang up
call.sendDigits('1234');  // Send DTMF
```

### Key WebRTC Considerations

- **Codec selection**: Opus is preferred for quality; PCMU is the fallback. Always list both.
- **Network quality**: Use `device.on('networkQuality')` events to show agents their connection quality. Poor quality causes jitter and dropped audio.
- **Token refresh**: Tokens expire. Handle `tokenWillExpire` to seamlessly refresh without dropping active calls.
- **Close protection**: `closeProtection: true` warns agents if they try to close the browser tab during an active call.
- **Audio device selection**: Use `device.audio.setInputDevice(deviceId)` and `device.audio.speakerDevices.set(deviceId)` to let agents pick their headset.
- **Echo cancellation**: Handled by the browser's WebRTC stack. Ensure agents use headsets — speakers cause echo.

---

## Multi-Line Dialing

Multi-line dialing is the core differentiator of a power/parallel/predictive dialer. You place multiple outbound calls simultaneously and connect the first live answer to the waiting agent.

### Parallel Call Placement

Place N calls (typically 3-5 for parallel dialer, algorithmically determined for predictive):

```javascript
async function dialParallel(agent, prospects, maxLines) {
  const session = await DialSession.create({ agentId: agent.id });

  const callPromises = prospects.slice(0, maxLines).map(async (prospect) => {
    const call = await twilioClient.calls.create({
      to: prospect.phone,
      from: selectCallerId(prospect),  // local presence
      url: `${BASE_URL}/twiml/parallel-outbound/${session.id}`,
      statusCallback: `${BASE_URL}/webhooks/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      machineDetection: 'DetectMessageEnd',
      asyncAmd: true,
      asyncAmdStatusCallback: `${BASE_URL}/webhooks/amd/${session.id}`,
      timeout: 25,
    });

    await DialAttempt.create({
      sessionId: session.id,
      prospectId: prospect.id,
      callSid: call.sid,
      status: 'initiated',
    });

    return call;
  });

  await Promise.all(callPromises);
}
```

### Connect-on-Answer

When one of the parallel calls is answered by a human (not a machine), you need to:

1. Immediately cancel all other ringing calls in the session
2. Bridge the answered call to the waiting agent

```javascript
async function handleLiveAnswer(session, answeredCallSid) {
  // Cancel all other calls in this session
  const otherCalls = await DialAttempt.find({
    sessionId: session.id,
    callSid: { $ne: answeredCallSid },
    status: { $in: ['initiated', 'ringing'] },
  });

  await Promise.all(
    otherCalls.map((attempt) =>
      twilioClient.calls(attempt.callSid).update({ status: 'canceled' })
    )
  );

  // Bridge answered call to agent via conference
  await twilioClient.calls(answeredCallSid).update({
    twiml: `<Response><Dial><Conference>${session.id}</Conference></Dial></Response>`,
  });

  // Agent is already in the conference, waiting
  await emitToAgent(session.agentId, 'call:connected', {
    callSid: answeredCallSid,
    prospect: session.prospects.find((p) => p.callSid === answeredCallSid),
  });
}
```

### Queue Management

Between parallel dial rounds, the agent sits in a conference room with hold music. The system:

1. Pulls the next batch of prospects from the queue
2. Dials them in parallel
3. If a human answers, bridges immediately
4. If all calls go to voicemail/no-answer, drops voicemails and starts the next batch
5. Repeat until queue is empty or agent ends session

The queue must respect: timezone filtering, DNC scrubbing, retry rules (e.g., no retry within 4 hours), list priority, and contact-level scheduling (callbacks).

---

## Answering Machine Detection (AMD)

AMD determines whether a call was answered by a human or a machine (voicemail). This is critical for parallel dialing — you only want to connect human-answered calls to agents.

### Twilio AMD Options

- `MachineDetection: "Enable"`: Returns result synchronously before executing TwiML. Blocks for up to `MachineDetectionTimeout` ms.
- `MachineDetection: "DetectMessageEnd"`: Returns an additional event when the voicemail greeting finishes (beep detected). Use this for voicemail drop.
- `AsyncAmd: true`: AMD runs in background; result arrives at `AsyncAmdStatusCallback`. Call connects immediately without waiting for AMD. Recommended for sales dialers to reduce perceived delay.

### AMD Result Handling

The AMD callback includes:
- `AnsweredBy`: `human`, `machine_start`, `machine_end_beep`, `machine_end_silence`, `machine_end_other`, `fax`, `unknown`

Decision matrix:
- `human` → Connect to agent (for parallel dialer) or proceed with call script
- `machine_start` → Wait for beep if using voicemail drop
- `machine_end_beep` → Drop pre-recorded voicemail
- `machine_end_silence` / `machine_end_other` → Drop voicemail or hang up
- `fax` → Hang up, mark contact
- `unknown` → Treat as human (false negative is better than missing a live prospect)

### Tuning AMD

AMD accuracy is ~90-95%. Tuning parameters:
- `MachineDetectionTimeout`: Default 30s. For sales, 3000-5000ms is typical. Longer = more accurate but more latency for human pickups.
- `MachineDetectionSpeechThreshold`: Duration of initial speech to classify. Default 2400ms.
- `MachineDetectionSpeechEndThreshold`: Silence duration to consider speech ended. Default 1200ms.
- `MachineDetectionSilenceTimeout`: Initial silence before classifying. Default 5000ms.

The tradeoff: aggressive settings (short timeouts) reduce connection latency for live answers but increase false positives (humans classified as machines). Conservative settings are more accurate but add 1-3 seconds of "dead air" when a human answers.

---

## Call Recording

All sales calls should be recorded for compliance, quality assurance, and AI analysis.

### Dual-Channel Recording

Always use dual-channel recording. It creates a stereo audio file where:
- Left channel: Agent audio
- Right channel: Prospect audio

This is essential for your AI pipeline — speech-to-text accuracy is dramatically higher when speakers are separated. Overlap handling becomes trivial.

Enable via:
- Call creation: `record: true, recordingChannels: 'dual'`
- `<Dial>` verb: `record="record-from-answer-dual"`
- `<Record>` verb: single channel only (not suitable for conversations)

### Recording Webhooks

When recording completes, Twilio sends a webhook to `recordingStatusCallback` with:
- `RecordingSid`: Unique recording ID
- `RecordingUrl`: URL to the audio file (add `.wav` or `.mp3`)
- `RecordingDuration`: Length in seconds
- `RecordingChannels`: 1 or 2

### Storage Architecture

Do NOT rely on Twilio for long-term recording storage. Twilio charges per minute stored and URLs are publicly accessible with the SID.

Pattern:
1. Recording completed webhook fires
2. Download the recording from Twilio (URL + `.wav`)
3. Upload to your own S3 bucket with server-side encryption (AES-256 or KMS)
4. Store the S3 key in your database alongside the call record
5. Delete the recording from Twilio via API
6. Generate pre-signed S3 URLs with short expiry (15 min) for playback

```javascript
async function processRecording(recordingSid, recordingUrl) {
  // Download from Twilio
  const audioBuffer = await fetch(`${recordingUrl}.wav`, {
    headers: { Authorization: `Basic ${twilioCredentials}` },
  }).then(r => r.buffer());

  // Upload to S3 with encryption
  const s3Key = `recordings/${callSid}/${recordingSid}.wav`;
  await s3.putObject({
    Bucket: RECORDINGS_BUCKET,
    Key: s3Key,
    Body: audioBuffer,
    ServerSideEncryption: 'aws:kms',
    SSEKMSKeyId: KMS_KEY_ID,
  }).promise();

  // Update database
  await CallRecording.update(recordingSid, { s3Key, status: 'stored' });

  // Delete from Twilio
  await twilioClient.recordings(recordingSid).remove();

  // Trigger AI pipeline
  await aiPipelineQueue.add('process-recording', { recordingSid, s3Key });
}
```

### Encryption Requirements

- **In transit**: Twilio uses TLS. Your S3 uploads use HTTPS. No issues.
- **At rest**: Use AWS KMS or S3 SSE. Recording encryption at rest is required for SOC 2 and often for call recording consent laws.
- **Access control**: S3 bucket must not be public. Use IAM roles. Pre-signed URLs for playback with 15-minute expiry.

---

## DTMF Handling

DTMF (Dual-Tone Multi-Frequency) tones are generated when callers press keypad buttons. Used for IVR navigation and in-call actions.

### Collecting DTMF with `<Gather>`

```xml
<Gather numDigits="1" action="/twiml/menu-selection" timeout="5">
  <Say>Press 1 for sales. Press 2 for support.</Say>
</Gather>
```

The callback receives `Digits` parameter with the pressed keys.

### Sending DTMF

Agents may need to navigate prospect IVRs (e.g., dialing into a company's phone tree). Send DTMF via:

- Browser SDK: `call.sendDigits('1w2w3')` where `w` is a 500ms pause
- REST API: `client.calls(callSid).update({ twiml: '<Response><Play digits="1w2w3"/></Response>' })`

### In-Call DTMF Events

To detect DTMF pressed during an active call (not within a `<Gather>`), use the `<Dial>` verb's `action` URL. Alternatively, use Twilio's real-time media streams for live DTMF detection.

---

## Number Management

### Provisioning Numbers

For a sales dialer, you need a pool of phone numbers for:
- **Outbound caller ID**: Matching prospect area codes (local presence)
- **Inbound DID**: Receiving callbacks
- **Toll-free**: Optional, for inbound campaigns

Provision via API:

```javascript
// Search available numbers
const numbers = await twilioClient.availablePhoneNumbers('US')
  .local.list({
    areaCode: '415',
    voiceEnabled: true,
    smsEnabled: true,
    limit: 10,
  });

// Purchase a number
const purchased = await twilioClient.incomingPhoneNumbers.create({
  phoneNumber: numbers[0].phoneNumber,
  voiceUrl: `${BASE_URL}/twiml/inbound`,
  statusCallback: `${BASE_URL}/webhooks/number-status`,
});
```

### Local Presence Dialing

Local presence means using a caller ID that matches the prospect's area code. This significantly increases answer rates (40-60% vs 10-20% for toll-free or out-of-area numbers).

Implementation:
1. Maintain a number pool organized by area code
2. When dialing, look up the prospect's area code
3. Select a number from the matching pool
4. Fall back to a geographically close area code, then to a default number

```javascript
function selectCallerId(prospect) {
  const prospectAreaCode = prospect.phone.slice(2, 5); // +1XXX...
  const exactMatch = numberPool.find(n => n.areaCode === prospectAreaCode);
  if (exactMatch) return exactMatch.number;

  const regionMatch = numberPool.find(n => n.region === prospect.state);
  if (regionMatch) return regionMatch.number;

  return defaultOutboundNumber;
}
```

### Number Health and Reputation

Outbound numbers get flagged as spam by carriers and apps like Hiya, Nomorobo, and carrier-level analytics. Monitor and rotate:
- Track answer rates per number. Declining rates indicate flagging.
- Rotate numbers — don't use the same number for more than 50-100 calls/day.
- Use Twilio's Trust Hub and SHAKEN/STIR attestation for caller ID verification.
- Register numbers with Free Caller Registry and other caller ID reputation services.

---

## SIP Trunking

If the platform needs to connect to existing PBX systems or enterprise phone infrastructure, SIP trunking is the bridge.

### Twilio Elastic SIP Trunking

- Create a SIP Trunk in Twilio
- Configure origination URI (where Twilio sends inbound calls)
- Configure termination (where your system sends outbound calls)
- Enable SRTP (Secure RTP) for encrypted media
- Set IP ACLs and credential lists for authentication

### Key Concepts

- **SIP INVITE**: The signaling protocol message to initiate a call
- **RTP/SRTP**: The media (audio) protocol. SRTP adds encryption.
- **NAT Traversal**: SIP is notoriously difficult with NAT. Use Twilio's edge locations or configure STUN/TURN servers.
- **Codec negotiation**: SIP endpoints negotiate codecs in the SDP (Session Description Protocol). Ensure both sides support G.711 (PCMU/PCMA) at minimum.

For most sales dialer implementations, SIP trunking is not needed unless integrating with an on-premise PBX. Twilio Client (WebRTC) is the standard for agent connectivity.

---

## Error Handling and Resilience

### Twilio API Errors

Common errors:
- `21215`: Geographic permission not enabled (enable the destination country in console)
- `21217`: Phone number not verified (trial accounts only)
- `21610`: Attempt to send to unsubscribed number
- `21614`: Invalid phone number
- `20429`: Rate limited (too many API calls)
- `31000-31099`: Client-side errors (network, authentication)

### Retry Strategy

- Use exponential backoff for API calls (429s, 500s)
- For StatusCallbacks: Twilio retries on non-2xx responses with backoff
- For WebRTC disconnections: Auto-reconnect with fresh token
- For mid-call failures: Implement a "rescue" TwiML that plays a message and records a callback request

### Monitoring

Track these metrics:
- **Call completion rate**: Successful calls / total attempts
- **AMD accuracy**: Manual review sampling
- **Answer rate**: By number, by time of day, by area code
- **WebRTC quality**: MOS score, jitter, packet loss (from SDK events)
- **API latency**: Twilio REST API response times
- **Webhook processing time**: Keep under 5 seconds

---

## Security Best Practices

1. **Validate all Twilio webhooks** using the X-Twilio-Signature header
2. **Never expose API credentials** in client-side code; use Access Tokens with minimal grants
3. **Encrypt recordings at rest** — this is both a compliance and security requirement
4. **Use TLS everywhere** — all webhook endpoints must be HTTPS
5. **IP whitelist** Twilio webhook source IPs when possible
6. **Rotate API keys** regularly; use sub-accounts for isolation
7. **Audit trail**: Log every call event, recording access, and configuration change
8. **Rate limiting**: Protect your webhook endpoints from DoS
9. **Phone number sanitization**: Always validate and normalize to E.164 before dialing
10. **PII handling**: Phone numbers and recordings are PII — treat them accordingly in logs, error messages, and analytics
