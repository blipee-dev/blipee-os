# Blipee Assistant Testing Guide

## Overview

Comprehensive testing suite for the Blipee Assistant, ensuring all components work seamlessly together.

## Test Coverage

### 1. Unit Tests
- Context extraction
- Prompt building
- Intent detection
- Agent routing
- Conversation management

### 2. Integration Tests
- API endpoints
- Response generation
- Database persistence
- Cache management

### 3. End-to-End Tests
- Full conversation flows
- Multi-turn interactions
- Role-based responses
- Error recovery

### 4. Performance Tests
- Response time benchmarks
- Throughput testing
- Concurrent user handling
- Memory usage monitoring

## Running Tests

### Prerequisites
1. Server must be running: `npm run dev`
2. User must be authenticated
3. Redis should be available (optional, falls back to in-memory)

### Test Commands

```bash
# Run standard test suite
npm run test:assistant

# Run interactive tests (simulates real conversations)
npm run test:assistant:interactive

# Run performance benchmark
npm run test:assistant:benchmark

# Run all test suites
npm run test:assistant:all
```

### Test Endpoint

Direct API testing:
```bash
# Run test suite via API
curl http://localhost:3001/api/ai/assistant/test
```

## Test Scenarios

### Standard Tests
1. **Authentication**: Verify user session and permissions
2. **Context Extraction**: Extract user, page, and environmental context
3. **Prompt Building**: Generate role-aware prompts
4. **Agent Routing**: Route intents to appropriate agents
5. **Conversation Management**: Create, update, and clear conversations
6. **Response Generation**: Generate AI responses
7. **Intent Detection**: Classify user messages
8. **Action Planning**: Generate multi-step plans
9. **Visualization Generation**: Create dynamic charts/metrics
10. **Error Handling**: Graceful error recovery

### Interactive Tests
- **Emissions Query**: "Show me our total carbon emissions"
- **Data Entry**: "Add electricity usage data"
- **Compliance Check**: "Are we GRI compliant?"
- **Report Generation**: "Generate sustainability report"
- **Optimization**: "How to reduce Scope 2 emissions?"

### Performance Benchmarks
- Average response time target: < 500ms
- Success rate target: > 95%
- Concurrent users: 10 simultaneous requests
- Memory usage: < 200MB per session

## Expected Results

### Success Criteria
- ✅ All authentication tests pass
- ✅ Context extraction complete
- ✅ Prompts generated for all roles
- ✅ Agent routing accuracy > 75%
- ✅ Conversations persist correctly
- ✅ Responses generated within timeout
- ✅ Intent detection accuracy > 80%
- ✅ Error handling graceful

### Performance Targets
- Response time: < 500ms (excellent), < 1000ms (good)
- Success rate: 100% (excellent), > 90% (good)
- Memory usage: Stable across sessions
- Cache hit rate: > 60%

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Ensure you're logged into the application
   - Check session cookies are valid
   - Verify user has organization assigned

2. **Redis Connection Failed**
   - System falls back to in-memory cache
   - Not critical for testing
   - To fix: Start Redis server

3. **Slow Response Times**
   - Check AI provider API keys
   - Verify network connectivity
   - Monitor rate limits

4. **Low Intent Detection Accuracy**
   - Review training data
   - Adjust confidence thresholds
   - Improve keyword matching

## Test Reports

Test results are displayed in the console with:
- Individual test results with timing
- Summary statistics
- Performance metrics
- Error details (if any)

### Sample Output
```
🤖 Blipee Assistant Test Suite

Test Results:
  ✅ Authentication              (45ms)
     User admin@blipee.com authenticated
  ✅ Context Extraction          (23ms)
     Context extracted for MANAGER on /sustainability/dashboard
  ✅ Prompt Building             (12ms)
     All prompt types built successfully
  ✅ Agent Routing               (18ms)
     Routed 3 intents successfully
  ✅ Response Generation         (234ms)
     Response generated successfully
  ✅ Intent Detection            (67ms)
     Accuracy: 100%

Summary:
  Total Tests:    10
  Passed:         10
  Failed:         0
  Success Rate:   100%
  Duration:       456ms

✨ All tests passed successfully!
```

## Continuous Improvement

### Monitoring
- Track response times over time
- Monitor error rates
- Analyze user satisfaction scores
- Review conversation logs

### Optimization
- Cache frequently used contexts
- Optimize prompt templates
- Improve agent selection logic
- Enhance error recovery

### Future Enhancements
- Add visual regression testing
- Implement load testing
- Create synthetic user journeys
- Build automated quality scoring

## Related Documentation

- [Implementation Plan](./BLIPEE_ASSISTANT_IMPLEMENTATION.md)
- [API Documentation](/api/ai/assistant)
- [Architecture Overview](../CLAUDE.md)
- [Domination Roadmap](./BLIPEE_DOMINATION_ROADMAP.md)