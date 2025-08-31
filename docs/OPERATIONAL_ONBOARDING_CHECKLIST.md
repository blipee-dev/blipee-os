# Operational Onboarding Checklist

## Phase 4, Task 4.5: New Team Member Onboarding

This checklist ensures new team members are prepared for operational responsibilities.

## Week 1: Foundation

### Day 1: Environment Setup
- [ ] Local development environment configured
- [ ] Access to logging platform granted
- [ ] Access to tracing platform granted
- [ ] Access to monitoring dashboards granted
- [ ] Slack channels joined (#incidents, #on-call, #engineering)
- [ ] PagerDuty account created
- [ ] SSH keys configured for production access

### Day 2: Architecture Overview
- [ ] Read system architecture documentation
- [ ] Understand service dependencies
- [ ] Review data flow diagrams
- [ ] Identify critical paths
- [ ] Learn about SLAs and SLOs

### Day 3: Logging Deep Dive
- [ ] Complete logging training module
- [ ] Practice structured logging
- [ ] Run log queries
- [ ] Set up personal log dashboard
- [ ] Understand correlation IDs

### Day 4: Tracing Mastery
- [ ] Complete tracing training module
- [ ] Create first traces
- [ ] Analyze existing traces
- [ ] Find performance bottleneck exercise
- [ ] Set up trace alerts

### Day 5: Resilience Patterns
- [ ] Learn circuit breaker pattern
- [ ] Understand retry strategies
- [ ] Practice bulkhead implementation
- [ ] Review timeout configurations
- [ ] Test failure scenarios

## Week 2: Practical Application

### Day 6: Runbook Training
- [ ] Read all existing runbooks
- [ ] Execute test runbook
- [ ] Create simple runbook
- [ ] Understand runbook triggers
- [ ] Practice incident response

### Day 7: Shadow On-Call
- [ ] Shadow morning checks
- [ ] Observe incident response
- [ ] Review recent incidents
- [ ] Practice using tools
- [ ] Ask questions

### Day 8: Monitoring and Alerts
- [ ] Understand alert rules
- [ ] Review alert fatigue strategies
- [ ] Configure personal alerts
- [ ] Learn escalation policies
- [ ] Practice alert response

### Day 9: Incident Management
- [ ] Complete incident commander training
- [ ] Practice incident communication
- [ ] Write mock incident report
- [ ] Review post-mortem process
- [ ] Understand blameless culture

### Day 10: Hands-on Practice
- [ ] Complete operational workshop
- [ ] Debug production-like issue
- [ ] Execute complex runbook
- [ ] Write incident summary
- [ ] Knowledge assessment

## Week 3: Integration

### Day 11-12: Mini Project
- [ ] Implement monitoring for new feature
- [ ] Add comprehensive logging
- [ ] Create traces
- [ ] Build runbook
- [ ] Document approach

### Day 13-14: Code Review
- [ ] Review operational PRs
- [ ] Suggest improvements
- [ ] Learn team standards
- [ ] Practice giving feedback

### Day 15: First On-Call Shift
- [ ] Paired on-call shift
- [ ] Handle real alerts (supervised)
- [ ] Document learnings
- [ ] Debrief with mentor

## Competency Verification

### Logging ✓
- [ ] Can write structured logs with context
- [ ] Can query logs effectively
- [ ] Understands log levels
- [ ] Can track correlation IDs

### Tracing ✓
- [ ] Can create meaningful spans
- [ ] Can analyze trace data
- [ ] Understands context propagation
- [ ] Can identify bottlenecks

### Resilience ✓
- [ ] Can implement circuit breakers
- [ ] Understands retry strategies
- [ ] Can configure timeouts
- [ ] Knows when to use each pattern

### Runbooks ✓
- [ ] Can execute runbooks
- [ ] Can create new runbooks
- [ ] Understands automation benefits
- [ ] Can troubleshoot failures

### Incident Response ✓
- [ ] Knows escalation procedures
- [ ] Can communicate clearly
- [ ] Understands severity levels
- [ ] Can write incident reports

## Resources and Contacts

### Documentation
- Architecture: `/docs/architecture/`
- Runbooks: `/docs/runbooks/`
- Training: `/docs/training/`
- API Docs: `/docs/api/`

### Key Contacts
- **Mentor**: [Assigned on Day 1]
- **Team Lead**: [Name]
- **On-Call Lead**: [Name]
- **DevOps**: #devops-help

### Tools Access
| Tool | URL | Access Request |
|------|-----|----------------|
| Logs | logs.blipee.com | Automatic |
| Traces | traces.blipee.com | Automatic |
| Metrics | metrics.blipee.com | Automatic |
| PagerDuty | blipee.pagerduty.com | Manager |
| Runbooks | app.blipee.com/runbooks | After training |

### Learning Path
1. **Foundational** (Week 1)
   - System overview
   - Tool basics
   - Concepts

2. **Practical** (Week 2)
   - Hands-on exercises
   - Real scenarios
   - Shadowing

3. **Independent** (Week 3)
   - Own small tasks
   - Supervised on-call
   - Mini projects

4. **Operational** (Week 4+)
   - Join rotation
   - Own features
   - Mentor others

## Sign-offs

### Manager Sign-off
- [ ] Environment access verified
- [ ] Training completed
- [ ] Assessment passed
- [ ] Ready for on-call

**Manager**: _________________ **Date**: _______

### Mentor Sign-off
- [ ] Technical skills demonstrated
- [ ] Tool proficiency shown
- [ ] Incident handling capable
- [ ] Team integration complete

**Mentor**: _________________ **Date**: _______

### Team Member Acknowledgment
I confirm that I have:
- Completed all training modules
- Understand operational responsibilities
- Know escalation procedures
- Feel prepared for on-call duties

**Name**: _________________ **Date**: _______

## Post-Onboarding

### 30-Day Check-in
- [ ] Comfort with tools
- [ ] Questions addressed
- [ ] Additional training needs
- [ ] Feedback on process

### 60-Day Review
- [ ] On-call performance
- [ ] Incident handling
- [ ] Team integration
- [ ] Growth areas

### Continuous Learning
- Monthly operational reviews
- Quarterly training updates
- Annual certification refresh
- Ongoing mentorship

---

*Onboarding Version: 1.0.0*  
*Last Updated: [DATE]*