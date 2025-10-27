# AI Prompt Optimization System

**ML-powered continuous improvement for Blipee AI Assistant**

This document describes the automated machine learning-based system for optimizing AI assistant prompts through pattern analysis, variant generation, and A/B testing.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Analytics & Pattern Detection](#analytics--pattern-detection)
5. [Variant Generation](#variant-generation)
6. [A/B Testing Framework](#ab-testing-framework)
7. [CLI Usage](#cli-usage)
8. [API Endpoints](#api-endpoints)
9. [Workflow](#workflow)
10. [Best Practices](#best-practices)

---

## Overview

The AI Prompt Optimization System automatically improves the Blipee AI Assistant by:

1. **Tracking performance metrics** from every conversation
2. **Identifying patterns** in failed queries, tool errors, and low satisfaction
3. **Generating improved prompts** using AI-powered analysis
4. **A/B testing variants** with real users
5. **Promoting winners** when statistical confidence is high

This creates a **self-improving AI system** that gets better over time without manual intervention.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Conversations                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Analytics Tracker                               │
│  • Response time, tokens, tool usage                         │
│  • User feedback (ratings, helpful/not helpful)              │
│  • Error tracking, clarification rate                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Pattern Analyzer (ML)                           │
│  • Identifies conversation patterns                          │
│  • Clusters similar failures                                 │
│  • Generates improvement suggestions using AI                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Variant Generator (AI)                          │
│  • Creates improved prompt versions                          │
│  • Conservative, moderate, aggressive strategies             │
│  • Targets identified patterns                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              A/B Testing Framework                           │
│  • Distributes traffic across variants                       │
│  • Collects performance data                                 │
│  • Statistical significance testing                          │
│  • Auto-promotes winners (confidence > 90%)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### `ai_conversation_analytics`

Tracks every AI conversation interaction:

```sql
- conversation_id, user_id, organization_id
- user_message, assistant_response
- response_time_ms, total_tokens
- tools_called (JSONB with success/error tracking)
- tool_success_rate, clarifying_questions_asked
- user_rating (1-5), helpful (boolean), user_feedback
- page_context (which page user was on)
- error_occurred, error_message
- prompt_version, model_id
- experiment_id, variant_id (for A/B testing)
```

### `ai_prompt_versions`

Stores different prompt variants:

```sql
- version_name (e.g., "v1.1-moderate")
- prompt_text (full system prompt)
- description, created_by
- avg_rating, total_conversations, success_rate
- is_active, is_default
```

### `ai_ab_experiments`

Manages A/B testing experiments:

```sql
- name, description
- variants (JSONB: [{ id, prompt_version_id, traffic_percentage }])
- start_date, end_date
- status (draft | running | completed | stopped)
- winner_variant_id, confidence_level
```

### `ai_pattern_insights`

Stores ML-generated insights:

```sql
- pattern_type (failed_query, tool_selection_error, etc.)
- pattern_description
- example_queries, frequency
- suggested_prompt_improvements
- confidence_score
- is_actionable, is_resolved
```

---

## Analytics & Pattern Detection

### Tracked Metrics

**Performance:**
- Response time (milliseconds)
- Token usage (prompt + completion)
- Tool call success rate

**User Satisfaction:**
- Star ratings (1-5)
- Helpful/not helpful
- Task completion

**Behavior:**
- Clarifying questions asked
- Errors encountered
- Follow-up questions needed

### Pattern Types

1. **`failed_query`** - Queries that resulted in errors or low ratings
2. **`tool_selection_error`** - Wrong tools called or tool failures
3. **`clarification_needed`** - AI asked too many clarifying questions
4. **`low_satisfaction`** - Low user ratings or "not helpful" feedback
5. **`token_inefficiency`** - Unusually high token usage

### Pattern Analysis

The `pattern-analyzer.ts` module:

1. Fetches conversation analytics from last N days
2. Calculates overall metrics (avg rating, tool success rate, etc.)
3. Identifies patterns by filtering conversations
4. Uses **GPT-4o-mini** to generate improvement suggestions
5. Calculates confidence scores based on frequency and sample size
6. Saves patterns to database for variant generation

---

## Variant Generation

### How It Works

The `prompt-variant-generator.ts` uses **GPT-4o** to create improved prompts:

1. Takes the current base prompt
2. Analyzes top actionable patterns
3. Generates variants addressing those patterns
4. Three strategies available:
   - **Conservative**: Minimal changes, focused improvements
   - **Moderate**: Balanced enhancements (default)
   - **Aggressive**: Comprehensive restructuring

### Example Workflow

```typescript
// Current prompt has issues with tool selection errors
// Pattern identified: AI calling wrong tools for sustainability queries

// GPT-4o generates new variant with:
// - Explicit tool usage examples
// - Clear decision criteria for tool selection
// - Enhanced context about when to use each tool
```

### Change Tracking

Each variant tracks:
- Version name (`v1.1-moderate`)
- Description of improvements
- Specific changes made
- Patterns it targets
- Performance metrics once deployed

---

## A/B Testing Framework

### Experiment Setup

```typescript
// Create experiment with 3 variants
await setupQuickExperiment(
  'Test improved tool selection',
  [variantId1, variantId2, variantId3],
  durationDays: 7,
  userId
);
```

### Traffic Distribution

Users are assigned to variants using:
- Consistent hashing (same user always gets same variant)
- Configurable traffic percentages
- Automatic tracking of all interactions

### Statistical Analysis

**Composite Score Formula:**
```
Score = (avgRating * 0.30) +
        (helpfulPercentage * 0.25) +
        (toolSuccessRate * 0.20) +
        ((1 - errorRate) * 0.15) +
        ((1 - avgResponseTime/10000) * 0.10)
```

**Confidence Calculation:**
- Base confidence: 50%
- Score difference > 15%: +30%
- Score difference > 10%: +20%
- Score difference > 5%: +10%
- Sample size > 100: +15%
- Sample size > 50: +10%
- Capped at 95%

### Auto-Promotion

When an experiment:
- Has confidence level > 90%
- Has total conversations > 100
- Has clear winner

The system **automatically promotes** the winner as the default prompt.

---

## CLI Usage

### Installation

The CLI script is already set up. Just run:

```bash
npm run optimize-prompts -- <command>
```

### Commands

**1. Analyze Patterns**

```bash
# Analyze last 7 days of conversations
npm run optimize-prompts -- analyze

# Analyze last 30 days
npm run optimize-prompts -- analyze 30
```

Output:
- Overall metrics (avg rating, tool success, etc.)
- Identified patterns with examples
- Improvement recommendations

**2. Generate Variants**

```bash
# Generate moderate improvement variants
npm run optimize-prompts -- generate

# Generate conservative variants
npm run optimize-prompts -- generate conservative

# Generate aggressive variants
npm run optimize-prompts -- generate aggressive
```

Output:
- List of generated variants
- Changes made to each
- Database IDs for created versions

**3. Create Experiment**

```bash
# Create 7-day A/B test
npm run optimize-prompts -- experiment

# Create 14-day test
npm run optimize-prompts -- experiment 14
```

Output:
- Experiment ID
- Variants included
- Traffic distribution

**4. Monitor Experiments**

```bash
npm run optimize-prompts -- monitor
```

Output:
- Active experiments
- Performance metrics per variant
- Winner (if confidence high enough)
- Auto-promotion status

**5. Full Cycle (Recommended)**

```bash
npm run optimize-prompts -- auto
```

Runs complete optimization cycle:
1. Analyze patterns
2. Generate variants
3. Create experiment
4. Monitor active experiments

---

## API Endpoints

### Pattern Analysis

**GET** `/api/ai-analytics/patterns?limit=10`
- Get top actionable patterns

**POST** `/api/ai-analytics/patterns`
```json
{
  "daysToAnalyze": 7
}
```
- Run pattern analysis, save to database

### Prompt Variants

**GET** `/api/ai-analytics/variants`
- Get all prompt versions

**GET** `/api/ai-analytics/variants?active=true`
- Get active prompt version

**POST** `/api/ai-analytics/variants`
```json
{
  "action": "generate",
  "basePrompt": "...",
  "strategy": "moderate",
  "count": 1
}
```
- Generate new variants

**POST** `/api/ai-analytics/variants`
```json
{
  "action": "set_active",
  "versionId": "uuid"
}
```
- Set variant as active/default

### Experiments

**GET** `/api/ai-analytics/experiments`
- Get all active experiments

**GET** `/api/ai-analytics/experiments?experimentId=uuid`
- Get specific experiment results

**POST** `/api/ai-analytics/experiments`
```json
{
  "action": "quick_setup",
  "name": "Test new prompt",
  "promptVersionIds": ["id1", "id2"],
  "durationDays": 7
}
```
- Create experiment

**POST** `/api/ai-analytics/experiments`
```json
{
  "action": "start",
  "experimentId": "uuid"
}
```
- Start experiment

**POST** `/api/ai-analytics/experiments`
```json
{
  "action": "complete",
  "experimentId": "uuid",
  "promoteWinner": true
}
```
- Complete experiment and optionally promote winner

---

## Workflow

### Weekly Optimization Cycle

**Recommended setup for continuous improvement:**

1. **Monday**: Run full analysis
   ```bash
   npm run optimize-prompts -- analyze 7
   ```

2. **Tuesday**: Review patterns, generate variants
   ```bash
   npm run optimize-prompts -- generate moderate
   ```

3. **Wednesday**: Start A/B test
   ```bash
   npm run optimize-prompts -- experiment 7
   ```

4. **Daily**: Monitor progress
   ```bash
   npm run optimize-prompts -- monitor
   ```

5. **Next Monday**: Complete experiment, start new cycle
   - System auto-promotes if confidence > 90%
   - Otherwise, manually review results and decide

### Automated Setup (Recommended)

**Set up a cron job** to run weekly:

```bash
# Every Monday at 9am
0 9 * * 1 cd /path/to/blipee-os && npm run optimize-prompts -- auto
```

This creates a **self-improving system** that:
- Automatically identifies issues
- Generates solutions
- Tests them with real users
- Promotes winners
- Repeats weekly

---

## Best Practices

### 1. Start Conservative

When first deploying the system:
- Run manual analysis for 2-3 weeks
- Generate conservative variants only
- Review all variants before testing
- Start with small traffic percentages (10-20%)

### 2. Wait for Data

Don't make changes too quickly:
- **Minimum 30 conversations per variant** for valid results
- **7-day minimum** experiment duration
- **90%+ confidence** before auto-promoting

### 3. Track Everything

Monitor these metrics weekly:
- Overall satisfaction trend
- Tool success rate trend
- Error rate trend
- Response time trend

### 4. A/B Test Everything

Never deploy a new prompt without testing:
- Always run A/B tests
- Compare against current baseline
- Let data decide, not intuition

### 5. Version Control

Keep a history of all prompts:
- Never delete old versions
- Document why changes were made
- Track which patterns each version addressed

### 6. Human Oversight

While the system is automated, review:
- **Weekly**: Pattern insights
- **Before experiments**: Generated variants
- **After experiments**: Winning prompts before deployment

### 7. Continuous Monitoring

Set up alerts for:
- Error rate > 5%
- Avg rating < 3.5
- Tool success rate < 80%
- Response time > 5 seconds

---

## Example: Full Optimization Cycle

```bash
$ npm run optimize-prompts -- auto

🚀 Running full optimization cycle...

================================================
🔍 Analyzing conversation patterns from the last 7 days...

📊 Overall Metrics:
  Total Conversations: 847
  Average Rating: 4.2 / 5
  Tool Success Rate: 82.3%
  Clarification Rate: 18.5%
  Avg Response Time: 1842ms

🎯 Identified 2 patterns:

  TOOL_SELECTION_ERROR
  Description: Conversations where tool calls had low success rate
  Frequency: 67 occurrences
  Confidence: 85%
  Suggestions: Add explicit examples of when to use each tool.
  Example queries:
    - "Show me emissions for January"
    - "Add electricity data for last month"
    - "What's my water consumption?"

  CLARIFICATION_NEEDED
  Description: Queries where AI needed excessive clarification
  Frequency: 45 occurrences
  Confidence: 75%
  Suggestions: Improve handling of ambiguous date references.
  Example queries:
    - "Show me recent emissions"
    - "Add data for last period"
    - "What happened this month?"

💾 Saving pattern insights to database...
✅ Pattern insights saved!

================================================
🤖 Generating prompt variants (moderate strategy)...

📋 Using 2 patterns for variant generation:
  - tool_selection_error (67 occurrences)
  - clarification_needed (45 occurrences)

✨ Generated 3 variants:

  v1.1-conservative
  Description: Conservative improvements addressing tool_selection_error
  Changes:
    - Added tool usage examples section
    - Expanded prompt by 12%

  ✅ Saved with ID: a1b2c3d4-...

  v1.1-moderate
  Description: Moderate improvements addressing tool_selection_error, clarification_needed
  Changes:
    - Enhanced tool selection guidance
    - Improved handling of ambiguous queries
    - Added explicit date interpretation rules
    - Expanded prompt by 18%

  ✅ Saved with ID: e5f6g7h8-...

  v1.1-aggressive
  Description: Aggressive improvements addressing tool_selection_error, clarification_needed
  Changes:
    - Added 3 new section(s)
    - Enhanced tool selection guidance
    - Improved handling of ambiguous queries
    - Expanded prompt by 31%

  ✅ Saved with ID: i9j0k1l2-...

🎉 Successfully generated and saved 3 variants!

================================================
🧪 Creating A/B test experiment (7 days)...

📝 Using 3 prompt versions:
  - v1.1-conservative: Conservative improvements...
  - v1.1-moderate: Moderate improvements...
  - v1.1-aggressive: Aggressive improvements...

✅ Experiment created and started!
   Experiment ID: m3n4o5p6-...
   Duration: 7 days
   Traffic split: Equal distribution across 3 variants

================================================
📈 Monitoring active experiments...

Test improved tool selection
  Status: running
  Started: 10/26/2025
  Total Conversations: 0

  Variant Performance:

    Variant variant_1:
      Conversations: 0
      (Waiting for data...)

✅ Full optimization cycle complete!

📅 Next steps:
  1. Wait for experiment to gather data (7 days)
  2. Run `npm run optimize-prompts -- monitor` to check progress
  3. Winning variant will be automatically promoted when confidence > 90%
```

---

## Conclusion

The AI Prompt Optimization System provides a **continuous improvement feedback loop** for the Blipee AI Assistant. By automatically:

1. Tracking performance
2. Identifying issues
3. Generating solutions
4. Testing with real users
5. Promoting winners

The system ensures the AI gets **better over time** without manual intervention, while maintaining human oversight for safety and quality control.

---

**Questions or issues?** Check `/docs/AI_CHAT_COMPLETE_GUIDE.md` or contact the development team.
