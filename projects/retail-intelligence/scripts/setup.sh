#!/bin/bash

# Retail Intelligence Module Setup Script

set -e

echo "🚀 Setting up Retail Intelligence Module..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run this script from the retail-intelligence directory${NC}"
    exit 1
fi

# Step 1: Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Node.js $(node --version)${NC}"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
else
    echo -e "${GREEN}✓ npm $(npm --version)${NC}"
fi

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠ PostgreSQL client not found (needed for local development)${NC}"
fi

# Check Redis
if ! command -v redis-cli &> /dev/null; then
    echo -e "${YELLOW}⚠ Redis not found (needed for real-time features)${NC}"
fi

echo ""

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""

# Step 3: Set up environment variables
echo "🔧 Setting up environment variables..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file from template${NC}"
    echo -e "${YELLOW}⚠ Please update .env with your actual values${NC}"
else
    echo -e "${YELLOW}⚠ .env file already exists, skipping${NC}"
fi

echo ""

# Step 4: Create database schema
echo "🗄️ Setting up database..."
echo -e "${YELLOW}Make sure your PostgreSQL is running and configured${NC}"

# Create retail schema SQL
cat > database/migrations/001_create_retail_schema.sql << 'EOF'
-- Create retail schema
CREATE SCHEMA IF NOT EXISTS retail;

-- Set search path
SET search_path TO retail, public;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOF

echo -e "${GREEN}✓ Created initial migration file${NC}"

echo ""

# Step 5: Create directory for test data
echo "📊 Setting up test data directory..."
mkdir -p tests/fixtures/data
echo -e "${GREEN}✓ Created test data directories${NC}"

echo ""

# Step 6: Create TypeScript configuration
echo "⚙️ Setting up TypeScript configuration..."
cat > tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/tests/*": ["./tests/*"],
      "@shared/*": ["../../src/*"]
    }
  },
  "include": [
    "src/**/*",
    "tests/**/*",
    "scripts/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "coverage"
  ]
}
EOF

echo -e "${GREEN}✓ Created TypeScript configuration${NC}"

echo ""

# Step 7: Create basic project files
echo "📁 Creating initial project files..."

# Create main types file
cat > src/types/index.ts << 'EOF'
// Retail Intelligence Types

export interface Store {
  id: string;
  organizationId: string;
  buildingId: string;
  name: string;
  code: string;
  mallId?: string;
  timezone: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FootTraffic {
  id: string;
  storeId: string;
  timestamp: Date;
  countIn: number;
  countOut: number;
  sensorId: string;
  accuracy?: number;
}

export interface SalesTransaction {
  id: string;
  storeId: string;
  timestamp: Date;
  amount: number;
  items: number;
  staffId?: string;
  customerId?: string;
}

export interface CaptureRate {
  storeId: string;
  date: Date;
  mallTraffic: number;
  storeEntries: number;
  captureRate: number;
  rank?: number;
}
EOF

echo -e "${GREEN}✓ Created type definitions${NC}"

# Create main API route file
mkdir -p src/api/health
cat > src/api/health/route.ts << 'EOF'
// Health check endpoint
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    module: 'retail-intelligence',
    timestamp: new Date().toISOString(),
  });
}
EOF

echo -e "${GREEN}✓ Created health check endpoint${NC}"

echo ""

# Step 8: Set up Git hooks
echo "🔗 Setting up Git hooks..."
mkdir -p .husky
cat > .husky/pre-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run tests before commit
npm run test

# Check test coverage
npm run test:coverage

# Run linting
npm run lint

# Type checking
npm run type-check
EOF

chmod +x .husky/pre-commit
echo -e "${GREEN}✓ Created pre-commit hook${NC}"

echo ""

# Step 9: Create Jest configuration
echo "🧪 Setting up Jest configuration..."
cat > jest.config.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/tests/(.*)$': '<rootDir>/tests/$1',
  },
};
EOF

echo -e "${GREEN}✓ Created Jest configuration${NC}"

echo ""

# Step 10: Create docker-compose for local development
echo "🐳 Setting up Docker configuration..."
cat > docker/docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: blipee_retail
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5433:5432"
    volumes:
      - retail_postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6380:6379"
    volumes:
      - retail_redis_data:/data

  retail-app:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/blipee_retail
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ../src:/app/src
      - ../tests:/app/tests

volumes:
  retail_postgres_data:
  retail_redis_data:
EOF

echo -e "${GREEN}✓ Created Docker configuration${NC}"

echo ""

# Final summary
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update the .env file with your actual values"
echo "2. Run 'npm run db:migrate' to set up the database"
echo "3. Run 'npm run db:seed' to add test data"
echo "4. Run 'npm run dev' to start the development server"
echo ""
echo "For more information, see the README.md file"