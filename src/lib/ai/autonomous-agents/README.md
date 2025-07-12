# Autonomous Agents System

This directory contains the implementation of autonomous ESG agents that work 24/7 without human intervention, as part of the blipee-os domination roadmap.

## Architecture Overview

The autonomous agent system consists of several key components:

### Core Components

1. **Agent Framework** (`agent-framework.ts`)
   - Base abstract class for all autonomous agents
   - Lifecycle management (start/stop)
   - Task execution pipeline
   - Learning system integration
   - Permission checking

2. **Agent Manager** (`agent-manager.ts`)
   - Singleton pattern for managing all agents
   - Health monitoring and automatic recovery
   - Agent registration and lifecycle control
   - Metrics collection

3. **Permission System** (`permissions.ts`)
   - Fine-grained permission control
   - Approval workflows for high-risk actions
   - Autonomy levels (1-5)
   - Audit logging

4. **Task Scheduler** (`scheduler.ts`)
   - Cron-like scheduling system
   - Priority-based task queue
   - Dynamic scheduling based on patterns
   - Task persistence

5. **Learning System** (`learning-system.ts`)
   - Pattern recognition from outcomes
   - Confidence scoring
   - Knowledge base management
   - Decision improvement over time

6. **Error Handler** (`error-handler.ts`)
   - Intelligent error recovery strategies
   - Rollback capabilities
   - Error escalation
   - Recovery patterns

### Implemented Agents

1. **ESG Chief of Staff** (`esg-chief-of-staff.ts`)
   - Daily ESG metrics analysis
   - Weekly/monthly report generation
   - Real-time anomaly detection
   - Compliance monitoring
   - Optimization recommendations

## Quick Start

```typescript
import { initializeAgentSystem, shutdownAgentSystem } from '@/lib/ai/autonomous-agents';

// Initialize agents for an organization
const { manager, scheduler } = await initializeAgentSystem('org-123');

// Agents will now run autonomously based on their schedules

// Shutdown when needed
await shutdownAgentSystem('org-123');
```

## Database Schema

Run the following migrations in order:
1. `20240711_create_agent_tables.sql` - Core agent tables
2. `20240711_create_agent_learning_tables.sql` - Learning system tables
3. `20240711_create_agent_additional_tables.sql` - Alerts and analyses

## Configuration

### Agent Autonomy Levels

- **Level 1**: Minimal autonomy - can only observe and report
- **Level 2**: Low autonomy - can make recommendations
- **Level 3**: Medium autonomy - can execute low-risk actions
- **Level 4**: High autonomy - can execute most actions (default)
- **Level 5**: Full autonomy - unrestricted execution

### Environment Variables

```bash
SUPABASE_SERVICE_KEY=your-service-key  # Required for autonomous operations
```

## Creating New Agents

1. Extend the `AutonomousAgent` base class:

```typescript
export class NewAgent extends AutonomousAgent {
  constructor(organizationId: string) {
    super(organizationId, {
      agentId: 'new-agent',
      capabilities: [...],
      maxAutonomyLevel: 4
    });
  }
  
  async getScheduledTasks(): Promise<AgentTask[]> {
    // Return tasks based on schedule
  }
  
  async executeTask(task: AgentTask): Promise<AgentResult> {
    // Implement task execution logic
  }
  
  async learn(result: AgentResult): Promise<void> {
    // Implement learning from outcomes
  }
}
```

2. Register with the agent manager:

```typescript
await manager.startAgent(NewAgent, organizationId);
```

## Task Types

### ESG Chief of Staff Tasks

- `analyze_metrics` - Comprehensive ESG analysis
- `generate_reports` - Create stakeholder reports
- `monitor_realtime` - Real-time anomaly detection
- `optimize_operations` - Find and implement optimizations
- `check_compliance` - Monitor compliance frameworks

## Monitoring

### Health Checks

The agent manager performs automatic health checks every 60 seconds:
- Verifies agents are running
- Restarts failed agents
- Logs health events

### Metrics

Access agent metrics:

```typescript
const metrics = await manager.getAgentMetrics('esg-chief-of-staff-org123', {
  start: new Date('2024-07-01'),
  end: new Date('2024-07-31')
});
```

### Error Statistics

```typescript
const errorStats = await errorHandler.getErrorStats(
  'esg-chief-of-staff',
  'org-123',
  { start, end }
);
```

## Security Considerations

1. **Service Key Usage**: Agents use service keys for autonomous operations
2. **Permission Checking**: All actions verified against capability matrix
3. **Approval Workflows**: High-risk actions require human approval
4. **Audit Trail**: All agent actions are logged
5. **Rollback Capability**: Critical actions can be rolled back

## Testing

Run tests:

```bash
npm test src/lib/ai/autonomous-agents/__tests__
```

## Roadmap

### Upcoming Agents (Weeks 5-8)

1. **Compliance Guardian** - Regulatory monitoring and filing
2. **Carbon Hunter** - Emission source identification and elimination
3. **Supply Chain Investigator** - Supplier assessment and optimization

### Future Enhancements

- Multi-agent collaboration system
- Advanced ML model integration
- Swarm intelligence capabilities
- Natural language task definition
- Visual report generation

## Performance Considerations

- Agents run in isolated contexts
- Task execution is async and non-blocking
- Learning system uses caching for performance
- Database queries are optimized with indexes

## Troubleshooting

### Agent Not Starting
- Check Supabase service key is set
- Verify organization exists in database
- Check agent permissions

### Tasks Not Executing
- Verify task scheduler is initialized
- Check task schedule patterns
- Review approval queue for pending requests

### Learning Not Improving
- Ensure sufficient data (10+ outcomes)
- Check confidence thresholds
- Verify learning system is enabled

## Contributing

When adding new agents:
1. Follow the existing pattern
2. Add comprehensive tests
3. Document task types and capabilities
4. Update migration files if needed
5. Add to the index.ts exports