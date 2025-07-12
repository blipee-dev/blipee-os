# Local Development Setup Guide

## Prerequisites

### Required Software
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v15.0 or higher
- **Redis**: v7.0 or higher
- **Git**: v2.30 or higher
- **Docker**: v20.0 or higher (optional but recommended)

### Recommended Tools
- **VS Code**: With recommended extensions
- **Postman**: For API testing
- **pgAdmin**: For database management
- **Redis Commander**: For Redis monitoring

## Quick Start (Docker)

```bash
# Clone the repository
git clone https://github.com/blipee/blipee-os.git
cd blipee-os/projects/retail-intelligence

# Copy environment variables
cp .env.example .env

# Start all services with Docker
docker-compose -f docker/docker-compose.yml up -d

# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Seed test data
npm run db:seed

# Start development server
npm run dev
```

Access the application at http://localhost:3001

## Manual Setup

### 1. Database Setup

```bash
# Create database
createdb blipee_retail

# Connect to database
psql blipee_retail

# Create schemas
CREATE SCHEMA retail;
CREATE SCHEMA auth;

# Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

# Exit psql
\q

# Run migrations
npm run db:migrate
```

### 2. Redis Setup

```bash
# Start Redis
redis-server

# Test connection
redis-cli ping
# Should return: PONG

# Set test key
redis-cli SET test "Hello Retail"
redis-cli GET test
# Should return: "Hello Retail"
```

### 3. Environment Configuration

Edit `.env` file with your local settings:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/blipee_retail
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Redis
REDIS_URL=redis://localhost:6379

# Development Settings
NODE_ENV=development
RETAIL_APP_PORT=3001

# AI Keys (at least one required)
DEEPSEEK_API_KEY=your-key
OPENAI_API_KEY=your-key

# Feature Flags for Development
ENABLE_REAL_TIME_PROCESSING=true
ENABLE_ML_PREDICTIONS=false  # Set to true if AI keys configured
ENABLE_MOCK_SENSORS=true     # Generates fake sensor data
```

### 4. Install Dependencies

```bash
# Install all dependencies
npm install

# Install global tools
npm install -g typescript ts-node nodemon

# Verify installation
npm list
```

### 5. Database Seed Data

```bash
# Run seed script
npm run db:seed

# Or manually seed specific data
psql blipee_retail < database/seeds/01-test-stores.sql
psql blipee_retail < database/seeds/02-test-sensors.sql
psql blipee_retail < database/seeds/03-test-traffic.sql
```

## Development Workflow

### Starting the Development Server

```bash
# Start with hot reload
npm run dev

# Start with debugging
npm run dev:debug

# Start with specific environment
NODE_ENV=test npm run dev
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- src/lib/traffic.test.ts

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

### Code Quality

```bash
# Run linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Type checking
npm run type-check

# Format code
npm run format
```

## Project Structure

```
retail-intelligence/
├── src/
│   ├── api/              # API routes
│   │   ├── stores/      # Store management
│   │   ├── traffic/     # Foot traffic
│   │   ├── sales/       # Sales data
│   │   └── analytics/   # Analytics endpoints
│   ├── components/       # React components
│   │   ├── charts/      # Data visualizations
│   │   ├── dashboards/  # Dashboard layouts
│   │   └── widgets/     # Reusable widgets
│   ├── lib/             # Business logic
│   │   ├── traffic/     # Traffic processing
│   │   ├── sales/       # Sales integration
│   │   ├── ai/          # AI/ML features
│   │   └── utils/       # Utilities
│   └── types/           # TypeScript types
├── database/            # Database files
│   ├── migrations/      # SQL migrations
│   └── seeds/          # Seed data
└── tests/              # Test files
```

## Common Development Tasks

### Adding a New API Endpoint

```typescript
// 1. Create route file: src/api/[feature]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Define request schema
const schema = z.object({
  storeId: z.string().uuid(),
  // ... other fields
});

export async function POST(req: NextRequest) {
  try {
    // Validate request
    const body = await req.json();
    const data = schema.parse(body);
    
    // Business logic
    const result = await processData(data);
    
    // Return response
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

### Creating a Database Migration

```bash
# Create migration file
touch database/migrations/$(date +%Y%m%d)_add_new_feature.sql

# Edit the file
cat > database/migrations/20240115_add_new_feature.sql << EOF
-- Add new feature tables
BEGIN;

CREATE TABLE retail.new_feature (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_new_feature_name ON retail.new_feature(name);

COMMIT;
EOF

# Run migration
npm run db:migrate
```

### Adding a New Component

```typescript
// 1. Create component file: src/components/charts/NewChart.tsx
import React from 'react';
import { Card } from '@/components/ui/card';

interface NewChartProps {
  data: any[];
  title: string;
}

export const NewChart: React.FC<NewChartProps> = ({ data, title }) => {
  return (
    <Card>
      <h3>{title}</h3>
      {/* Chart implementation */}
    </Card>
  );
};

// 2. Create test file: src/components/charts/__tests__/NewChart.test.tsx
import { render, screen } from '@testing-library/react';
import { NewChart } from '../NewChart';

describe('NewChart', () => {
  it('renders with title', () => {
    render(<NewChart data={[]} title="Test Chart" />);
    expect(screen.getByText('Test Chart')).toBeInTheDocument();
  });
});
```

## Debugging

### VS Code Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Dev Server",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "port": 9229,
      "env": {
        "NODE_OPTIONS": "--inspect"
      }
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "test:debug"],
      "port": 9229
    }
  ]
}
```

### Common Issues & Solutions

#### Port Already in Use
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
RETAIL_APP_PORT=3002 npm run dev
```

#### Database Connection Failed
```bash
# Check PostgreSQL is running
pg_isready

# Check connection string
psql $DATABASE_URL

# Reset database
npm run db:reset
```

#### Redis Connection Failed
```bash
# Check Redis is running
redis-cli ping

# Start Redis if needed
redis-server

# Clear Redis cache
redis-cli FLUSHALL
```

## Mock Data Generation

### Enable Mock Sensors

```typescript
// Set in .env
ENABLE_MOCK_SENSORS=true

// This will generate:
// - Random foot traffic every 5 minutes
// - Random sales transactions every 15 minutes
// - Simulated sensor health data
```

### Manual Test Data Generation

```bash
# Generate test foot traffic
npm run generate:traffic -- --days 30 --stores 5

# Generate test sales
npm run generate:sales -- --days 30 --stores 5

# Generate everything
npm run generate:all
```

## Performance Profiling

### Node.js Profiling

```bash
# Start with profiling
node --prof npm run dev

# Process profiling data
node --prof-process isolate-*.log > profile.txt

# Memory profiling
node --inspect npm run dev
# Open chrome://inspect in Chrome
```

### Database Query Analysis

```sql
-- Enable query timing
\timing on

-- Analyze query plan
EXPLAIN ANALYZE
SELECT * FROM retail.foot_traffic_hourly
WHERE store_id = 'uuid' AND date > '2024-01-01';

-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Useful Scripts

### Clean Development Environment

```bash
#!/bin/bash
# scripts/clean-dev.sh

echo "Cleaning development environment..."

# Stop all services
docker-compose down

# Clear node modules
rm -rf node_modules
rm -rf .next

# Clear test coverage
rm -rf coverage

# Clear Redis
redis-cli FLUSHALL

# Reset database
dropdb blipee_retail || true
createdb blipee_retail

echo "Clean complete! Run 'npm run setup' to start fresh."
```

### Quick Restart

```bash
#!/bin/bash
# scripts/restart-dev.sh

echo "Restarting development environment..."

# Clear ports
lsof -ti:3001 | xargs kill -9 || true
lsof -ti:6379 | xargs kill -9 || true

# Start services
redis-server --daemonize yes
npm run dev

echo "Development server running at http://localhost:3001"
```

## Next Steps

1. Run the health check endpoint to verify setup:
   ```bash
   curl http://localhost:3001/api/retail/health
   ```

2. Import test stores using the UI or API

3. Start generating mock sensor data

4. Explore the API documentation at http://localhost:3001/api-docs

5. Join the development Slack channel: #retail-dev

Happy coding! 🚀