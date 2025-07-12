# Retail Intelligence Platform - Quick Reference Guide

## 🚀 Sprint Workflow

### 1. Sprint Start
```bash
# Review sprint tasks in IMPLEMENTATION_PLAN_AND_TRACKER.md
# Update sprint status
node scripts/sprint-tracker.js set [sprint-number] status="In Progress"
```

### 2. Daily Development
```bash
# Before starting work
git pull origin main
npm install

# During development (TDD approach)
npm run test:watch

# Before committing
npm run test:coverage
git add .
git commit -m "feat: implement [feature] with tests"
```

### 3. Sprint End - Test Phase (2-3 days)
```bash
# Day 1: Run comprehensive tests
./scripts/sprint-test.sh [sprint-number]

# Day 2: Fix any issues
npm run test:watch
npm run test:coverage

# Day 3: Final validation and reporting
./scripts/sprint-test.sh [sprint-number]
node scripts/sprint-tracker.js report [sprint-number]
node scripts/sprint-tracker.js complete [sprint-number]
```

### 4. Sprint Commit
```bash
# After all tests pass (90%+ coverage)
git add .
git commit -m "chore: Sprint [X] completion - [Y]% coverage

Sprint [X] Implementation:
- [Feature 1]
- [Feature 2]
- [Feature 3]

Test Results:
- Total Tests: [XXX] ([XXX] passing)
- Coverage: [Y]% (target: 90%)
- New Code Coverage: [Z]%

[Sprint test report details]"

git push origin feature/sprint-[X]
```

## 📊 Key Metrics & Targets

| Metric | Target | Command to Check |
|--------|--------|------------------|
| Overall Coverage | ≥ 90% | `npm run test:coverage` |
| New Code Coverage | ≥ 95% | `npm run test:coverage -- --changedSince=main` |
| Sprint Velocity | ~50 points | `node scripts/sprint-tracker.js status` |
| Test Execution | < 5 min | `time npm run test:all` |

## 🛠️ Common Commands

### Testing
```bash
# Run all tests with coverage
npm run test:coverage

# Run tests for specific app
npm run test:retail
npm run test:sustainability

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run sprint validation
./scripts/sprint-test.sh
```

### Sprint Tracking
```bash
# Check current sprint status
node scripts/sprint-tracker.js status

# Update sprint metrics
node scripts/sprint-tracker.js set 1 completed=35 coverage=92

# Generate sprint report
node scripts/sprint-tracker.js report 1

# Complete sprint (if tests pass)
node scripts/sprint-tracker.js complete 1
```

### Development
```bash
# Start retail app
cd apps/retail && npm run dev

# Start sustainability app
cd apps/sustainability && npm run dev

# Build all packages
npm run build

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 📁 Project Structure

```
blipee-platform/
├── apps/
│   ├── retail/          # Retail Intelligence app
│   ├── sustainability/  # Current Blipee-OS app
│   └── auth/           # Shared auth service
├── packages/
│   ├── shared-ui/      # Shared components
│   ├── ai-engine/      # AI infrastructure
│   ├── database/       # DB utilities
│   └── auth-sdk/       # Auth SDK
├── docs/
│   └── retail-integration/
│       ├── TECHNICAL_IMPLEMENTATION_PLAN.md
│       ├── TESTING_STRATEGY.md
│       ├── IMPLEMENTATION_PLAN_AND_TRACKER.md
│       └── sprint-reports/
└── scripts/
    ├── sprint-test.sh   # Sprint validation
    └── sprint-tracker.js # Progress tracking
```

## 🔍 Sprint Checklist

### Pre-Sprint
- [ ] Review previous sprint retrospective
- [ ] Update sprint tracker to "In Progress"
- [ ] Assign tasks to team members
- [ ] Set up feature branch

### During Sprint
- [ ] Daily standup updates
- [ ] Update task status in tracker
- [ ] Write tests before code (TDD)
- [ ] Keep coverage above 90%

### Sprint End
- [ ] Run sprint test script
- [ ] Fix all failing tests
- [ ] Achieve 90%+ coverage
- [ ] Generate sprint report
- [ ] Complete retrospective
- [ ] Get sign-offs
- [ ] Commit and push

### Post-Sprint
- [ ] Update implementation tracker
- [ ] Archive sprint report
- [ ] Plan next sprint
- [ ] Celebrate success! 🎉

## 🚨 Troubleshooting

### Coverage Below 90%
```bash
# Find uncovered code
npm run coverage:open

# Run coverage for specific files
npm run test:coverage -- src/lib/retail/traffic

# Check what's missing
npm run test:coverage -- --verbose
```

### Tests Failing
```bash
# Run specific test file
npm test -- path/to/test.spec.ts

# Debug mode
node --inspect-brk ./node_modules/.bin/jest --runInBand

# Update snapshots if needed
npm test -- -u
```

### Sprint Cannot Complete
1. Check coverage: Must be ≥ 90%
2. Check bugs: All must be fixed
3. Check sign-offs: Need tech lead, QA, and PO
4. Run: `./scripts/sprint-test.sh [sprint-number]`

## 📞 Support

- **Technical Issues**: Create issue in GitHub
- **Process Questions**: Check IMPLEMENTATION_PLAN_AND_TRACKER.md
- **Emergency**: Contact tech lead

Remember: **No sprint closes without 90% test coverage!**