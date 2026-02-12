# AI/ML Pipeline Domain Context

This context teaches you how to build the AI/ML pipeline for a sales dialer. You need this
knowledge when implementing speech-to-text, sentiment analysis, call scoring, real-time coaching,
post-call intelligence, and voicemail detection.

---

## Real-Time Speech-to-Text (STT)

### Provider Overview

| Provider | Mode | Latency | Best For |
|----------|------|---------|----------|
| **Deepgram** | Streaming WebSocket | ~300ms | Real-time transcription, production |
| **AssemblyAI** | Streaming WebSocket | ~500ms | Real-time with built-in sentiment |
| **OpenAI Whisper** | Batch REST | Seconds-minutes | Post-call processing, high accuracy |
| **OpenAI Realtime** | Streaming WebSocket | ~300-500ms | Real-time STT + AI responses, voice agents |

### Deepgram Streaming API (Primary for Real-Time)

Deepgram's streaming WebSocket API is the recommended choice for real-time sales dialer
transcription due to its low latency and sales-tuned models.

WebSocket endpoint: `wss://api.deepgram.com/v1/listen`

Connection parameters:

```
wss://api.deepgram.com/v1/listen
  ?model=nova-2
  &language=en-US
  &smart_format=true
  &punctuate=true
  &diarize=true
  &interim_results=true
  &utterance_end_ms=1500
  &vad_events=true
  &encoding=linear16
  &sample_rate=16000
  &channels=2
```

Key parameters for sales dialer use:

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `model` | `nova-2` | Latest model, best accuracy |
| `diarize` | `true` | Separate agent vs prospect speech |
| `interim_results` | `true` | Show partial transcripts (for real-time UI) |
| `utterance_end_ms` | `1500` | Silence threshold for utterance boundary |
| `vad_events` | `true` | Voice Activity Detection events |
| `smart_format` | `true` | Auto-format numbers, currency, dates |
| `channels` | `2` | Stereo: channel 0 = agent, channel 1 = prospect |
| `multichannel` | `true` | Process each channel independently |

Authentication: `Authorization: Token {DEEPGRAM_API_KEY}` header on WebSocket upgrade.

Deepgram transcript event structure:

```json
{
  "type": "Results",
  "channel_index": [0, 2],
  "duration": 1.52,
  "start": 12.34,
  "is_final": true,
  "speech_final": true,
  "channel": {
    "alternatives": [{
      "transcript": "I'd like to learn more about your enterprise pricing",
      "confidence": 0.97,
      "words": [
        { "word": "I'd", "start": 12.34, "end": 12.52, "confidence": 0.98, "speaker": 1 },
        { "word": "like", "start": 12.54, "end": 12.72, "confidence": 0.99, "speaker": 1 }
      ]
    }]
  }
}
```

Key distinctions:
- `is_final: false` = interim result (will be replaced by next result)
- `is_final: true` = final for this audio segment
- `speech_final: true` = utterance is complete (silence detected after speech)

### AssemblyAI Real-Time API (Alternative)

WebSocket endpoint: `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000`

Authentication: Pass `token` query parameter or `Authorization` header.

AssemblyAI provides built-in features useful for sales:
- Real-time sentiment analysis per utterance
- Entity detection (person names, organizations, money amounts)
- Topic detection

Event types:
- `SessionBegins` — connection established, returns `session_id`
- `PartialTranscript` — interim results (confidence may change)
- `FinalTranscript` — finalized transcript segment
- `SessionTerminated` — connection closed

Send audio as base64-encoded chunks:

```json
{ "audio_data": "base64_encoded_pcm_data" }
```

### OpenAI Whisper (Batch Post-Call)

Use Whisper for post-call transcription when latency is not a concern but accuracy matters:

```
POST https://api.openai.com/v1/audio/transcriptions
Content-Type: multipart/form-data

file: recording.wav
model: whisper-1
language: en
response_format: verbose_json
timestamp_granularities: ["word", "segment"]
```

Response includes word-level timestamps:

```json
{
  "text": "Full transcript here...",
  "segments": [
    {
      "id": 0,
      "start": 0.0,
      "end": 4.2,
      "text": "Hi this is Sarah from Acme Corp",
      "tokens": [50364, 2425, ...],
      "avg_logprob": -0.21
    }
  ],
  "words": [
    { "word": "Hi", "start": 0.0, "end": 0.32 },
    { "word": "this", "start": 0.34, "end": 0.52 }
  ]
}
```

Whisper does not natively diarize. For post-call, combine Whisper transcription with
a separate diarization model (e.g., pyannote.audio) or use the stereo channel approach
(agent on left channel, prospect on right channel).

### OpenAI Realtime API (Real-Time STT + AI)

The OpenAI Realtime API provides a persistent WebSocket connection to GPT-4o models with native
audio input and output. Unlike Whisper (batch-only), this is a true streaming interface that
combines speech-to-text with LLM intelligence in a single hop — eliminating the need for a
separate LLM call for per-utterance analysis.

WebSocket endpoint: `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview`

Authentication: Pass API key via header on WebSocket upgrade:
`Authorization: Bearer {OPENAI_API_KEY}`

Or use the `OpenAI-Beta: realtime=v1` header for beta access.

**Session Configuration:**

After connecting, send a `session.update` event to configure the session:

```json
{
  "type": "session.update",
  "session": {
    "model": "gpt-4o-realtime-preview",
    "modalities": ["text", "audio"],
    "instructions": "You are a sales call assistant. Transcribe the conversation and provide real-time analysis.",
    "input_audio_format": "pcm16",
    "output_audio_format": "pcm16",
    "input_audio_transcription": {
      "model": "whisper-1"
    },
    "turn_detection": {
      "type": "server_vad",
      "threshold": 0.5,
      "prefix_padding_ms": 300,
      "silence_duration_ms": 500
    },
    "tools": []
  }
}
```

Key session parameters for sales dialer use:

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `modalities` | `["text", "audio"]` | Enable both text and audio processing |
| `input_audio_format` | `"pcm16"` | 16-bit PCM audio input (also supports `"g711_ulaw"`, `"g711_alaw"`) |
| `input_audio_transcription` | `{ "model": "whisper-1" }` | Enable automatic transcription of input audio |
| `turn_detection.type` | `"server_vad"` | Server-side voice activity detection (handles turn-taking automatically) |
| `turn_detection.threshold` | `0.5` | VAD sensitivity (0.0-1.0, lower = more sensitive) |
| `turn_detection.silence_duration_ms` | `500` | Silence before utterance is considered complete |

**Audio Input:**

Send audio data as base64-encoded PCM chunks:

```json
{
  "type": "input_audio_buffer.append",
  "audio": "base64_encoded_pcm16_audio"
}
```

Audio format requirements:
- **PCM 16-bit**: mono, 24kHz sample rate (native), but also accepts 16kHz and 8kHz
- **G.711 mulaw**: 8kHz mono — matches Twilio Media Streams directly, no conversion needed
- **G.711 alaw**: 8kHz mono

The G.711 mulaw support is a significant advantage for sales dialers — you can pipe Twilio
Media Stream audio directly to the Realtime API without format conversion.

**Server-Side VAD (Voice Activity Detection):**

When `turn_detection.type` is `"server_vad"`, the API automatically detects when a speaker
starts and stops talking. Events emitted:

- `input_audio_buffer.speech_started` — speech detected in audio buffer
- `input_audio_buffer.speech_stopped` — silence detected, utterance boundary
- `input_audio_buffer.committed` — audio buffer committed for processing

This replaces the need for external VAD logic or reliance on the STT provider's utterance
boundaries.

**Key Response Events:**

| Event | Description |
|-------|-------------|
| `conversation.item.input_audio_transcription.completed` | Transcription of input audio is ready |
| `response.audio_transcript.delta` | Streaming transcript chunk of model's audio response |
| `response.audio_transcript.done` | Model's audio response transcript complete |
| `response.text.delta` | Streaming text response chunk |
| `response.text.done` | Text response complete |
| `response.function_call_arguments.delta` | Streaming function/tool call arguments |
| `response.function_call_arguments.done` | Function call complete |

Transcription completed event structure:

```json
{
  "type": "conversation.item.input_audio_transcription.completed",
  "item_id": "item_abc123",
  "content_index": 0,
  "transcript": "I'd like to learn more about your enterprise pricing"
}
```

**Two Operating Modes for Sales Dialers:**

1. **Transcription-only mode** — Use the Realtime API purely for STT by enabling
   `input_audio_transcription` and setting instructions to transcribe without responding.
   Feed the transcripts into the existing coaching pipeline (sentiment analysis, call scoring,
   objection detection). This gives you GPT-4o-quality transcription with streaming latency.

2. **Conversational mode** — Use the full bidirectional audio capability for AI-powered
   features like:
   - **AI voicemail agent**: When AMD detects a machine, hand off to the Realtime API to
     leave a dynamic, personalized voicemail
   - **AI IVR navigator**: Automatically navigate phone trees before connecting the agent
   - **AI call assistant**: Provide real-time whispered coaching to the agent via a
     side-channel audio stream
   - **AI post-call follow-up**: Generate and deliver voice messages based on call outcomes

**Function Calling (Tools):**

The Realtime API supports tool/function calling, enabling the AI to take actions mid-conversation:

```json
{
  "type": "session.update",
  "session": {
    "tools": [
      {
        "type": "function",
        "name": "lookup_crm_record",
        "description": "Look up a contact's CRM record to get recent activity and deal stage",
        "parameters": {
          "type": "object",
          "properties": {
            "contact_name": { "type": "string" },
            "company": { "type": "string" }
          },
          "required": ["contact_name"]
        }
      },
      {
        "type": "function",
        "name": "get_pricing_info",
        "description": "Get pricing details for a specific product or plan",
        "parameters": {
          "type": "object",
          "properties": {
            "product": { "type": "string" },
            "plan_tier": { "type": "string", "enum": ["starter", "growth", "enterprise"] }
          },
          "required": ["product"]
        }
      }
    ]
  }
}
```

When the model invokes a tool, you receive `response.function_call_arguments.done`, execute
the function server-side, and return the result via `conversation.item.create` with a
`function_call_output` item. This enables real-time data lookups during AI-assisted calls.

**Cost Considerations (as of Feb 2026 — verify at [OpenAI pricing](https://openai.com/pricing)):**

| Component | Cost | Notes |
|-----------|------|-------|
| Audio input | ~$0.06/min | Significantly higher than Deepgram ($0.0043/min) |
| Audio output | ~$0.24/min | Only applies in conversational mode |
| Text tokens | Standard GPT-4o rates | For tool calls and text responses |

The Realtime API costs ~14x more than Deepgram for pure transcription. Use it strategically:
- **High-value calls** where AI-powered real-time assistance justifies the cost
- **AI voicemail/IVR features** where the conversational mode provides unique capability
- **Default to Deepgram** for standard STT on all calls, reserve Realtime for premium features

### STT Provider Abstraction

Abstract the STT provider behind an interface so you can swap providers:

```typescript
interface STTProvider {
  connect(config: STTConfig): Promise<STTConnection>;
}

interface STTConnection {
  sendAudio(chunk: Buffer): void;
  onTranscript(callback: (event: TranscriptEvent) => void): void;
  onError(callback: (error: Error) => void): void;
  close(): Promise<void>;
}

interface TranscriptEvent {
  text: string;
  isFinal: boolean;
  isUtteranceEnd: boolean;
  confidence: number;
  speaker: 'agent' | 'prospect' | 'unknown';
  startTime: number;          // seconds from call start
  endTime: number;
  words: WordEvent[];
  channel: number;            // 0 = agent, 1 = prospect
  raw: any;                   // Provider-specific raw payload
}

interface WordEvent {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker: 'agent' | 'prospect' | 'unknown';
}

interface STTConfig {
  provider: 'deepgram' | 'assemblyai' | 'whisper' | 'openai-realtime';
  encoding: 'linear16' | 'mulaw' | 'opus';
  sampleRate: number;                   // 8000, 16000, or 24000 depending on provider
  channels: number;
  language: string;
  interimResults: boolean;
  diarize: boolean;
}
```

---

## Audio Streaming Architecture

### End-to-End Audio Flow

```
Browser (Agent UI)
  │ WebRTC media stream
  ▼
Twilio Media Streams (WebSocket)
  │ mulaw 8kHz mono per leg
  ▼
Media Forwarder Service
  │ Mixes/routes audio streams
  │ Converts mulaw → linear16 if needed
  ▼
┌─────────────────────────────────────────────────────┐
│              STT Provider (choose one)              │
│                                                     │
│  Path A: Deepgram/AssemblyAI (standard)             │
│    STT WebSocket → Transcript Events                │
│      → Separate LLM calls for sentiment/coaching    │
│                                                     │
│  Path B: OpenAI Realtime API (combined)             │
│    Realtime WebSocket → Transcript + AI Analysis    │
│      → Single hop for STT + sentiment + coaching    │
│      → Supports mulaw directly (no conversion)      │
│      → Optional: AI voice responses (voicemail/IVR) │
└─────────────────────────────────────────────────────┘
  │ Transcript events
  ▼
Transcript Processor
  │ Enriches with speaker labels, timestamps
  │ Publishes to event bus
  ▼
┌──────────┬──────────────┬──────────────┐
│ Real-time │ Sentiment    │ Call Score   │
│ Coaching  │ Analyzer     │ Engine       │
│ Engine    │              │              │
└──────────┴──────────────┴──────────────┘
  │                │               │
  ▼                ▼               ▼
Agent UI        Analytics DB    Post-Call
(WebSocket)                     Queue
```

### Twilio Media Streams

Twilio provides real-time audio via WebSocket Media Streams. Configure in TwiML:

```xml
<Response>
  <Connect>
    <Stream url="wss://your-server.com/media-stream" track="both_tracks" />
  </Connect>
</Response>
```

Or via the REST API when creating a call:

```typescript
const call = await twilioClient.calls.create({
  to: '+14155551234',
  from: '+14155550100',
  twiml: '<Response><Connect><Stream url="wss://..." track="both_tracks"/></Connect></Response>'
});
```

Twilio Media Stream events:

| Event | Description |
|-------|-------------|
| `connected` | WebSocket connection established |
| `start` | Stream started, includes `streamSid`, `callSid`, `tracks` |
| `media` | Audio data chunk (base64 encoded mulaw, 8kHz) |
| `dtmf` | DTMF tone detected |
| `mark` | Playback marker reached (for TTS/audio injection) |
| `stop` | Stream ended |

Media event payload:

```json
{
  "event": "media",
  "sequenceNumber": "42",
  "media": {
    "track": "inbound",
    "chunk": "42",
    "timestamp": "1234567890",
    "payload": "base64_encoded_mulaw_audio"
  },
  "streamSid": "MZxxxxxxxxxx",
  "callSid": "CAxxxxxxxxxx"
}
```

Track values:
- `"inbound"` — audio from the called party (prospect)
- `"outbound"` — audio from the caller (agent)

### Audio Format Conversion

Twilio sends mulaw (G.711) at 8kHz mono. Most STT providers want linear16 (PCM) at 16kHz.

Conversion pipeline per provider:

```
Deepgram:          mulaw 8kHz → decode to PCM 8kHz → upsample to 16kHz → send to STT
                   (or send mulaw directly with encoding=mulaw&sample_rate=8000)
AssemblyAI:        mulaw 8kHz → decode to PCM 8kHz → upsample to 16kHz → send to STT
OpenAI Realtime:   mulaw 8kHz → send directly (native g711_ulaw support, no conversion needed)
OpenAI Whisper:    mulaw 8kHz → decode to PCM → save as WAV → POST to API (batch)
```

Use the `@discordjs/opus` or a custom mulaw decoder:

```typescript
function mulawToLinear16(mulawBuffer: Buffer): Buffer {
  const pcm = Buffer.alloc(mulawBuffer.length * 2);
  for (let i = 0; i < mulawBuffer.length; i++) {
    const sample = mulawDecode(mulawBuffer[i]);
    pcm.writeInt16LE(sample, i * 2);
  }
  return pcm;
}

// mulaw decode table lookup (ITU-T G.711)
function mulawDecode(mulaw: number): number {
  mulaw = ~mulaw;
  const sign = (mulaw & 0x80) ? -1 : 1;
  const exponent = (mulaw >> 4) & 0x07;
  const mantissa = mulaw & 0x0f;
  const magnitude = ((mantissa << 1) + 33) << (exponent + 2);
  return sign * (magnitude - 33);
}
```

For upsampling from 8kHz to 16kHz, use linear interpolation or a proper resampling library
like `node-audio-resampler`. Deepgram also accepts 8kHz mulaw directly if you set
`encoding=mulaw&sample_rate=8000`.

### Stereo Channel Handling

For diarization accuracy, send audio as stereo (2 channels):
- Channel 0 (left) = agent audio (outbound track from Twilio)
- Channel 1 (right) = prospect audio (inbound track from Twilio)

Interleave the two mono streams into a single stereo PCM buffer:

```typescript
function interleaveStereo(agentPcm: Buffer, prospectPcm: Buffer): Buffer {
  const length = Math.min(agentPcm.length, prospectPcm.length);
  const stereo = Buffer.alloc(length * 2);
  for (let i = 0; i < length; i += 2) {
    const agentSample = agentPcm.readInt16LE(i);
    const prospectSample = prospectPcm.readInt16LE(i);
    stereo.writeInt16LE(agentSample, i * 2);
    stereo.writeInt16LE(prospectSample, i * 2 + 2);
  }
  return stereo;
}
```

Then tell Deepgram `channels=2&multichannel=true` so it transcribes each channel separately.

---

## Sentiment Analysis

### Per-Utterance Sentiment

Analyze sentiment on each finalized transcript utterance. Two approaches:

1. **LLM-based** (recommended for accuracy): Send each utterance to an LLM with a classification prompt
2. **Library-based** (lower cost, higher speed): Use a local NLP model or library

LLM-based sentiment classification prompt:

```
Classify the sentiment of this sales call utterance. Consider both the words
and the conversational context.

Speaker: {speaker}
Utterance: "{text}"
Previous context (last 3 utterances): {context}

Respond with ONLY a JSON object:
{
  "sentiment": "positive" | "negative" | "neutral" | "frustrated" | "interested" | "objecting",
  "confidence": 0.0-1.0,
  "signals": ["brief description of why"]
}
```

Use a fast model (GPT-4o-mini or Claude Haiku) for per-utterance analysis to keep latency
under 500ms. Batch utterances if the conversation is moving quickly.

### Rolling Conversation Sentiment

Track sentiment over the entire conversation as a rolling metric:

```typescript
interface ConversationSentiment {
  callId: string;
  currentSentiment: SentimentLabel;     // most recent
  overallScore: number;                 // -1.0 to 1.0 weighted average
  trend: 'improving' | 'declining' | 'stable';
  agentSentimentAvg: number;
  prospectSentimentAvg: number;
  sentimentHistory: SentimentDataPoint[];
}

interface SentimentDataPoint {
  timestamp: number;                    // seconds from call start
  speaker: 'agent' | 'prospect';
  sentiment: SentimentLabel;
  score: number;                        // -1.0 to 1.0
  utteranceText: string;
}

type SentimentLabel = 'positive' | 'negative' | 'neutral' |
                      'frustrated' | 'interested' | 'objecting';
```

Compute rolling sentiment with exponential decay weighting — recent utterances
matter more than earlier ones:

```typescript
function computeRollingSentiment(history: SentimentDataPoint[], decayFactor: number = 0.85): number {
  if (history.length === 0) return 0;
  let weightedSum = 0;
  let weightSum = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const weight = Math.pow(decayFactor, history.length - 1 - i);
    weightedSum += history[i].score * weight;
    weightSum += weight;
  }
  return weightedSum / weightSum;
}
```

### Trigger Thresholds

Fire coaching events when sentiment crosses thresholds:

| Trigger | Condition | Action |
|---------|-----------|--------|
| Prospect frustration | Prospect sentiment < -0.5 for 2+ consecutive utterances | Alert agent: "Prospect may be frustrated. Consider acknowledging their concern." |
| Objection detected | Sentiment = 'objecting' with keywords | Surface objection handling playbook |
| Positive momentum | Prospect sentiment > 0.6 trending up | Suggest moving to close/next steps |
| Agent negativity | Agent sentiment < -0.3 | Coach: "Keep your tone positive and solution-oriented." |
| Engagement drop | No prospect speech for 30+ seconds | Alert: "Prospect has gone quiet. Ask an open-ended question." |

---

## Call Scoring

### Configurable Scoring Rubric

Each tenant can configure a scoring rubric with weighted categories:

```typescript
interface ScoringRubric {
  tenantId: string;
  name: string;
  version: number;
  categories: ScoringCategory[];
  passingScore: number;               // e.g., 70
}

interface ScoringCategory {
  id: string;
  name: string;                       // e.g., "Opening", "Discovery", "Objection Handling"
  weight: number;                     // 0.0-1.0, all weights must sum to 1.0
  criteria: ScoringCriterion[];
}

interface ScoringCriterion {
  id: string;
  description: string;                // e.g., "Agent introduced themselves by name"
  maxPoints: number;                  // e.g., 10
  scoringMethod: 'binary' | 'scale' | 'ml';
  keywords?: string[];                // For keyword-based scoring
  mlModelId?: string;                 // For ML-based scoring
}
```

Default scoring rubric for outbound sales:

| Category | Weight | Criteria |
|----------|--------|----------|
| **Opening** (15%) | 0.15 | Introduced self, stated company name, used prospect name, permission-based opener |
| **Discovery** (25%) | 0.25 | Asked open-ended questions, uncovered pain points, qualified budget/authority/need/timeline |
| **Value Prop** (20%) | 0.20 | Connected solution to prospect needs, used social proof, differentiated from competition |
| **Objection Handling** (20%) | 0.20 | Acknowledged objections, reframed objections, provided evidence/stories |
| **Closing** (15%) | 0.15 | Clear next steps proposed, commitment obtained, follow-up scheduled |
| **Professionalism** (5%) | 0.05 | Appropriate pace, minimal filler words, active listening indicators |

### ML Model Training for Call Scoring

For automated scoring, train classification models on human-labeled call data:

1. **Data collection**: Have managers score calls using the rubric (human labels)
2. **Feature extraction**: From transcripts, extract:
   - Question count and type (open vs closed)
   - Talk ratio (agent vs prospect)
   - Keyword presence (pain point terms, competition mentions, closing phrases)
   - Sentiment trajectory
   - Filler word frequency
   - Speaking pace (words per minute)
   - Interruption count
3. **Model training**: Use these features + human labels to train a scoring model
   - Start with gradient boosting (XGBoost/LightGBM) for interpretability
   - Upgrade to fine-tuned LLM classifier as data volume grows
4. **Evaluation**: Measure agreement with human scorers (Cohen's kappa >= 0.7 target)
5. **Serving**: Deploy as a REST API, invoke post-call or in real-time

### Real-Time vs Post-Call Scoring

| Aspect | Real-Time | Post-Call |
|--------|-----------|-----------|
| Latency | <2 seconds per category | 10-30 seconds for full score |
| Accuracy | Lower (partial transcript) | Higher (complete transcript) |
| Use case | Coaching prompts | Manager review, analytics |
| Model type | Rule-based + simple ML | LLM-based comprehensive analysis |
| Trigger | Every 30s or on utterance end | On call completion |

Real-time scoring runs incrementally — update category scores as transcript grows.
Post-call scoring analyzes the complete transcript with full context.

### LLM-Based Post-Call Scoring

Use a structured prompt for comprehensive post-call scoring:

```
You are a sales call quality analyst. Score this call transcript against the provided rubric.

## Rubric
{rubric_json}

## Transcript
{full_transcript}

## Call Metadata
Duration: {duration}
Talk Ratio: Agent {agent_pct}% / Prospect {prospect_pct}%
Disposition: {disposition}

Score each criterion and provide:
1. A score (0 to maxPoints) for each criterion
2. Specific evidence (quote from transcript) supporting the score
3. One actionable improvement suggestion per category

Respond in this JSON format:
{
  "totalScore": number,
  "categories": [{
    "id": "opening",
    "score": number,
    "maxScore": number,
    "criteria": [{
      "id": "criterion_id",
      "score": number,
      "evidence": "Quote from transcript",
      "suggestion": "Improvement tip"
    }]
  }],
  "overallFeedback": "2-3 sentence summary",
  "topStrength": "Best aspect of the call",
  "topImprovement": "Most impactful area to improve"
}
```

---

## Real-Time Coaching Engine

### Talk Ratio Monitoring

Track cumulative speaking time for agent and prospect:

```typescript
interface TalkRatioState {
  agentSpeakingMs: number;
  prospectSpeakingMs: number;
  silenceMs: number;
  lastUpdatedAt: number;
}

function getTalkRatio(state: TalkRatioState): { agent: number; prospect: number } {
  const total = state.agentSpeakingMs + state.prospectSpeakingMs;
  if (total === 0) return { agent: 0, prospect: 0 };
  return {
    agent: Math.round((state.agentSpeakingMs / total) * 100),
    prospect: Math.round((state.prospectSpeakingMs / total) * 100),
  };
}
```

Ideal talk ratio for outbound sales: agent 40-50%, prospect 50-60%.
Alert thresholds:
- Agent talking > 65%: "You're talking too much. Ask a question to re-engage the prospect."
- Agent talking < 25%: "Good listening! Make sure to guide the conversation toward next steps."

### Filler Word Detection

Detect filler words from transcript and track frequency:

```typescript
const FILLER_WORDS = [
  'um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally',
  'sort of', 'kind of', 'right', 'so yeah', 'i mean', 'honestly'
];

interface FillerWordTracker {
  counts: Map<string, number>;
  totalWords: number;
  fillerRate: number;              // fillers per 100 words
}
```

Alert threshold: >5 filler words per 100 words spoken.
Coaching prompt: "You've used {count} filler words. Try pausing briefly instead."

### Pace and Speed Alerts

Calculate words per minute from transcript timestamps:

```typescript
function calculateWPM(words: WordEvent[], windowSeconds: number = 60): number {
  if (words.length < 2) return 0;
  const windowStart = words[words.length - 1].end - windowSeconds;
  const windowWords = words.filter(w => w.start >= windowStart);
  if (windowWords.length < 2) return 0;
  const durationMinutes = (windowWords[windowWords.length - 1].end - windowWords[0].start) / 60;
  if (durationMinutes === 0) return 0;
  return Math.round(windowWords.length / durationMinutes);
}
```

Optimal speaking pace: 130-160 WPM.
- Above 180 WPM: "Slow down. You're speaking too fast for the prospect to follow."
- Below 100 WPM: "Pick up the pace slightly to maintain energy."

### Objection Detection and Suggested Responses

Detect objections using keyword patterns and LLM classification:

Common sales objections and keywords:

| Objection Type | Keywords/Phrases |
|---------------|-----------------|
| Price | "too expensive", "out of budget", "can't afford", "cheaper alternative" |
| Timing | "not right now", "maybe next quarter", "too busy", "bad timing" |
| Authority | "need to check with", "not my decision", "talk to my boss" |
| Competition | "already using", "happy with current", "signed a contract" |
| Need | "don't need this", "not a priority", "we're fine" |
| Trust | "never heard of you", "too new", "need references" |

When an objection is detected, push a coaching card via WebSocket:

```json
{
  "type": "coaching_prompt",
  "trigger": "objection_detected",
  "objectionType": "price",
  "detectedPhrase": "That's a bit out of our budget right now",
  "suggestedResponses": [
    "I understand budget is a concern. Can you share what range you're working with so I can see what options we have?",
    "Many of our customers initially felt the same way, but found the ROI justified the investment within 3 months. Would it help if I walked you through a quick ROI calculation?",
    "What if we structured the payment differently? We offer quarterly billing that can make it easier on cash flow."
  ],
  "playbook": "price_objection_framework"
}
```

### Coaching Delivery via WebSocket

All coaching prompts are delivered to the agent UI via a persistent WebSocket connection:

```typescript
interface CoachingEvent {
  type: 'coaching_prompt';
  callId: string;
  timestamp: number;
  trigger: CoachingTrigger;
  priority: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  suggestedActions?: string[];
  expiresInSeconds?: number;        // auto-dismiss after N seconds
  category: 'talk_ratio' | 'filler_words' | 'pace' | 'objection' |
            'sentiment' | 'silence' | 'closing' | 'discovery';
}

type CoachingTrigger =
  | 'talk_ratio_high'
  | 'talk_ratio_low'
  | 'filler_word_threshold'
  | 'pace_too_fast'
  | 'pace_too_slow'
  | 'objection_detected'
  | 'negative_sentiment'
  | 'long_silence'
  | 'closing_opportunity'
  | 'missing_discovery';
```

Throttle coaching prompts: max 1 prompt per 30 seconds to avoid overwhelming the agent.
Priority determines display prominence in the UI (high = full card, low = subtle badge).

---

## Post-Call Intelligence

### Call Summarization (LLM)

Generate a structured summary immediately after call completion:

```
Summarize this sales call transcript. Be specific about what was discussed,
what the prospect's situation is, and what was agreed upon.

## Transcript
{full_transcript}

## Call Info
Agent: {agent_name}
Prospect: {prospect_name} at {company}
Duration: {duration}
Disposition: {disposition}

Provide a JSON response:
{
  "summary": "2-3 sentence overview",
  "prospectSituation": "Current state, pain points, needs",
  "keyDiscussions": ["topic 1", "topic 2"],
  "objections": [{"objection": "...", "response": "...", "resolved": true/false}],
  "competitorMentions": ["CompetitorX"],
  "budgetDiscussed": true/false,
  "budgetDetails": "...",
  "timelineDiscussed": true/false,
  "timelineDetails": "...",
  "decisionMakers": ["John (VP Sales)", "Sarah (CFO)"],
  "nextSteps": ["Send proposal by Friday", "Schedule demo with team"],
  "followUpDate": "2024-01-20",
  "dealRisk": "low" | "medium" | "high",
  "dealRiskReason": "..."
}
```

### Action Item Extraction

Parse the transcript and summary to extract concrete action items:

```typescript
interface ActionItem {
  id: string;
  callId: string;
  description: string;
  assignee: 'agent' | 'prospect' | 'other';
  assigneeName?: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed';
  source: 'ai_extracted' | 'agent_manual';
  crmTaskId?: string;                  // Synced to CRM as a Task
}
```

Auto-create CRM tasks for each action item. Use the activity logging pipeline
from the CRM integration context.

### Follow-Up Recommendations

Based on call outcome and AI analysis, recommend next actions:

| Disposition | Recommendation |
|-------------|---------------|
| Meeting Booked | Create calendar event, send confirmation email template, prep meeting agenda |
| Interested - Follow Up | Schedule callback in 2-3 days, send relevant case study |
| Objection - Price | Send ROI calculator, schedule follow-up after budget cycle |
| Objection - Timing | Set callback for next quarter, add to nurture sequence |
| Not Interested | Mark as closed-lost, add reason to analytics, remove from campaign |
| No Answer | Retry in 2 hours (different time), try alternate phone number |
| Voicemail | Send follow-up email, retry in 24-48 hours |

### Deal Risk Signals

Analyze conversation patterns that indicate deal risk:

| Signal | Risk Level | Indicator |
|--------|-----------|-----------|
| No budget discussed after 3+ calls | High | Missing BANT qualification |
| Prospect mentioned competing evaluation | High | Active shopping |
| Decision maker not identified | Medium | Selling to the wrong person |
| Decreasing call duration trend | Medium | Losing interest |
| Negative sentiment trend across calls | High | Relationship deteriorating |
| Multiple reschedules | Medium | Low priority for prospect |
| "Let me think about it" with no follow-up | High | Stalling |

Store deal risk signals and surface them on the rep's dashboard and in manager reports.

---

## Voicemail Detection (AMD)

### Answering Machine Detection

When a call connects, classify whether a human or machine answered. This determines
whether to connect the agent or drop a pre-recorded voicemail.

### ML-Based Voicemail Detection

Classification approach:

1. **Audio-based**: Analyze the first 2-5 seconds of audio after connect
   - Features: energy levels, speech patterns, tone frequency, silence patterns
   - Machines: longer continuous speech, monotone, specific greeting patterns
   - Humans: shorter greeting, variable tone, pauses expecting response

2. **Transcript-based**: Analyze initial transcript
   - Machine indicators: "leave a message", "at the tone", "not available", "press 1"
   - Human indicators: "hello?", "this is {name}", short greeting + silence

### Twilio AMD (Built-in)

Twilio provides built-in AMD via the `machineDetection` parameter:

```typescript
const call = await twilioClient.calls.create({
  to: '+14155551234',
  from: '+14155550100',
  url: 'https://your-app.com/twiml/call-handler',
  machineDetection: 'DetectMessageEnd',   // or 'Enable'
  machineDetectionTimeout: 5000,           // ms to wait for detection
  machineDetectionSpeechThreshold: 2400,   // ms of continuous speech = machine
  machineDetectionSpeechEndThreshold: 1200, // ms of silence after speech = end
  machineDetectionSilenceTimeout: 5000,    // ms of silence = human
  asyncAmd: true,                          // non-blocking detection
  asyncAmdStatusCallback: 'https://your-app.com/webhooks/amd-result',
  asyncAmdStatusCallbackMethod: 'POST'
});
```

AMD callback payload:

```json
{
  "CallSid": "CAxxxxxxxxxx",
  "AnsweredBy": "machine_end_beep",
  "MachineDetectionDuration": "3200"
}
```

`AnsweredBy` values:
- `human` — human detected
- `machine_start` — machine greeting started (use with `DetectMessageEnd`)
- `machine_end_beep` — machine greeting complete, beep detected (optimal for VM drop)
- `machine_end_silence` — machine greeting complete, silence detected
- `machine_end_other` — machine detected but no clear endpoint
- `fax` — fax machine detected
- `unknown` — detection timed out

### Speed vs Accuracy Tradeoff

| Setting | Detection Time | Accuracy | Use Case |
|---------|---------------|----------|----------|
| Aggressive (short thresholds) | 1-2 seconds | ~85% | Power dialer (speed matters) |
| Balanced | 3-4 seconds | ~92% | Default for most campaigns |
| Conservative (long thresholds) | 4-6 seconds | ~97% | High-value prospects (accuracy matters) |

The tradeoff: faster detection = more false positives (humans classified as machines,
meaning agent misses a live call). Slower detection = agent waits longer before connecting.

For power/parallel dialer mode, use aggressive AMD to maximize agent connect rates.
For single-line dialing of high-value prospects, use conservative AMD.

### Voicemail Drop Flow

When AMD detects a machine:

```
AMD Result: machine_end_beep
  │
  ├─ If voicemail drop enabled for campaign:
  │    1. Play pre-recorded voicemail audio via TwiML <Play>
  │    2. Hang up after playback completes
  │    3. Log as "Voicemail Drop" disposition
  │    4. Move to next contact in queue
  │
  └─ If voicemail drop disabled:
       1. Log as "Voicemail - No Message" disposition
       2. Hang up
       3. Move to next contact in queue
```

Pre-recorded voicemail audio is stored per-campaign:

```sql
CREATE TABLE voicemail_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  campaign_id UUID,
  name TEXT NOT NULL,
  audio_url TEXT NOT NULL,             -- S3 signed URL
  duration_seconds INT,
  format TEXT DEFAULT 'audio/wav',
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Infrastructure Considerations

### Latency Budget

For real-time coaching, the total pipeline latency must stay under 2 seconds:

**Standard pipeline (Deepgram/AssemblyAI → separate LLM):**

| Stage | Target Latency |
|-------|---------------|
| Audio from Twilio to STT | 100ms |
| STT processing | 300ms |
| Transcript to coaching engine | 50ms |
| Sentiment/scoring analysis (LLM call) | 500ms |
| Coaching prompt to agent UI | 50ms |
| **Total** | **~1000ms** |

**Combined pipeline (OpenAI Realtime API):**

| Stage | Target Latency |
|-------|---------------|
| Audio from Twilio to Realtime API | 100ms |
| Realtime STT + AI analysis (single hop) | 300-500ms |
| Coaching prompt to agent UI | 50ms |
| **Total** | **~450-650ms** |

The OpenAI Realtime path eliminates the separate LLM call for sentiment/coaching analysis
since the model sees audio context natively, but costs more per minute.

### Scaling Considerations

- Each active call = 1 STT WebSocket connection + 1 agent WebSocket
- For 100 concurrent calls: 200 WebSocket connections, ~50 Mbps audio bandwidth
- Run coaching engines as stateless workers behind a load balancer
- Use Redis for real-time state (talk ratio, sentiment history) per call
- Persist transcript events to PostgreSQL for post-call analysis

**Provider cost comparison (per minute of audio, as of Feb 2026):**

| Provider | STT Cost | Notes |
|----------|----------|-------|
| Deepgram Nova-2 | ~$0.0043/min | Best value for high-volume STT |
| AssemblyAI | ~$0.0065/min | Includes built-in sentiment |
| OpenAI Whisper | ~$0.006/min | Batch only, no streaming |
| OpenAI Realtime (input) | ~$0.06/min | ~14x Deepgram, but includes AI analysis |
| OpenAI Realtime (output) | ~$0.24/min | Only if using audio responses (voice agent mode) |
| LLM sentiment (GPT-4o-mini) | ~$0.001/utterance | Separate call on top of STT cost |

**Recommended strategy**: Use Deepgram for standard STT across all calls (cost-effective at
scale). Reserve OpenAI Realtime for premium features — AI voicemail agents, IVR navigation,
and high-value call coaching where the combined STT+AI pipeline justifies the cost.

### Data Storage

```sql
CREATE TABLE call_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id),
  utterance_index INT NOT NULL,
  speaker TEXT NOT NULL CHECK (speaker IN ('agent', 'prospect', 'unknown')),
  text TEXT NOT NULL,
  start_time_ms INT NOT NULL,
  end_time_ms INT NOT NULL,
  confidence FLOAT,
  is_final BOOLEAN DEFAULT true,
  sentiment_label TEXT,
  sentiment_score FLOAT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transcript_call ON call_transcripts(call_id, utterance_index);

CREATE TABLE call_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id),
  rubric_id UUID NOT NULL,
  rubric_version INT NOT NULL,
  total_score FLOAT NOT NULL,
  category_scores JSONB NOT NULL,      -- [{categoryId, score, maxScore, criteria: [...]}]
  overall_feedback TEXT,
  top_strength TEXT,
  top_improvement TEXT,
  scored_by TEXT NOT NULL,              -- 'ai', 'manager', 'peer'
  scored_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE coaching_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id),
  trigger TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  suggested_actions TEXT[],
  delivered_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  agent_action TEXT,                   -- what the agent did after seeing the prompt
  created_at TIMESTAMPTZ DEFAULT now()
);
```
