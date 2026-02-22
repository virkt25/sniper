# Telephony Review Checklist

Use this domain-specific checklist alongside framework checklists when reviewing telephony-related code or architecture in sales dialer applications.

## Call Quality

- [ ] **Latency impact:** Changes do not introduce additional latency in the call path
- [ ] **Async operations:** No synchronous/blocking operations in real-time audio handling paths
- [ ] **Connection management:** WebRTC connections and Twilio clients are properly managed (no leaks)
- [ ] **Failover handling:** Carrier/provider failures are handled gracefully with fallback

## Compliance

- [ ] **TCPA compliance:** Outbound calling respects time-of-day restrictions and DNC lists
- [ ] **Recording consent:** Call recording implementation respects state-specific consent laws
- [ ] **PCI redaction:** Payment information in call recordings is properly redacted
- [ ] **DNC list integration:** Do-Not-Call registry is checked before outbound calls

## Scalability

- [ ] **Concurrent calls:** Implementation can handle target concurrent call volume
- [ ] **Rate limiting:** Twilio and carrier API rate limits are respected with proper backoff
- [ ] **Resource cleanup:** Telephony resources (connections, sessions, recordings) are properly cleaned up
- [ ] **Connection pooling:** Database and external service connections are pooled appropriately

## Integration

- [ ] **Webhook reliability:** Twilio webhooks handle retries and deduplication
- [ ] **CRM sync:** Call outcomes and recordings sync correctly to CRM
- [ ] **Error handling:** Telephony API errors are handled with appropriate user feedback
- [ ] **Timeout handling:** Network timeouts don't leave calls in inconsistent state

## User Experience

- [ ] **Call controls:** Agent can answer, hold, mute, transfer, and end calls reliably
- [ ] **State transitions:** Call state machine handles all edge cases (simultaneous actions, rapid transitions)
- [ ] **Audio quality:** No audio artifacts from feature changes (echo, one-way audio, silence)
