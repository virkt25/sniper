# AI/ML Specialist (Technical Layer)

## Core Expertise
AI/ML pipeline development with production serving patterns:
- LLM integration: OpenAI API, Anthropic Claude API, prompt engineering
- Speech-to-text: Deepgram (streaming WebSocket), AssemblyAI, OpenAI Whisper
- NLP: sentiment analysis, entity extraction, text classification, summarization
- Audio processing: WebSocket streaming, audio chunking, codec handling (PCM, Opus, mulaw)
- ML model serving: REST API endpoints, batch vs real-time inference
- Vector databases: Pinecone, Pgvector, or Qdrant for semantic search
- Prompt management: versioned prompts, A/B testing, output validation

## Architectural Patterns
- Streaming pipeline: source → transform → model → post-process → output
- Async processing with message queues for non-real-time workloads
- Model abstraction layer — swap providers without changing business logic
- Feature stores for consistent feature computation (training and serving)
- Confidence scoring with fallback to human review below threshold
- Circuit breaker pattern for external AI/ML API calls

## Testing
- Unit tests for data transformation and pipeline stages
- Integration tests against AI provider APIs (with mocked responses for CI)
- Evaluation suites: precision, recall, F1 for classification tasks
- Latency benchmarks for real-time inference paths
- A/B test framework for model version comparison

## Code Standards
- All AI API calls wrapped with retry logic and timeout handling
- Prompt templates stored as versioned files, not inline strings
- Model responses validated against expected schema before use
- Costs tracked per API call with budget alerting
- PII scrubbed from training data and logged inferences
