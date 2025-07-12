# **RETAIL INTELLIGENCE PLATFORM**
## **Enterprise-Grade Modular Analytics & Optimization System**

### **Version 1.0 - Technical Specification Document**

---

## **TABLE OF CONTENTS**

1. [Executive Summary](#1-executive-summary)
2. [Vision & Mission](#2-vision--mission)
3. [System Architecture](#3-system-architecture)
4. [Technical Stack](#4-technical-stack)
5. [Core Modules](#5-core-modules)
6. [Data Models](#6-data-models)
7. [API Specifications](#7-api-specifications)
8. [Integration Layer](#8-integration-layer)
9. [Security & Compliance](#9-security--compliance)
10. [Testing Strategy](#10-testing-strategy)
11. [Documentation](#11-documentation)
12. [Deployment & DevOps](#12-deployment--devops)
13. [Performance Requirements](#13-performance-requirements)
14. [Pricing & Packaging](#14-pricing--packaging)
15. [Implementation Roadmap](#15-implementation-roadmap)

---

## **1. EXECUTIVE SUMMARY**

### **1.1 Overview**

The Retail Intelligence Platform is a revolutionary, AI-powered analytics system that transforms how retail businesses understand and optimize their operations. By combining real-time foot traffic analysis, sales integration, predictive AI, and enterprise-grade features, we create a "Digital Twin" of retail environments that not only measures but actively manages store performance.

### **1.2 Key Differentiators**

- **Modular Architecture**: Pick and choose features based on needs and budget
- **AI-Powered Insights**: Predictive analytics that recommend actions, not just report data
- **Enterprise Integration**: Seamless connection with Power BI, Dynamics 365, and other tools
- **Smart Targets System**: Cascading objectives with real-time tracking
- **Capture Rate Focus**: Unique mall traffic vs. store traffic analysis
- **Multi-Tenant SaaS**: True enterprise-grade with role-based access

### **1.3 Target Market**

- **Primary**: Multi-location retail chains (10-500 stores)
- **Secondary**: Shopping mall operators, retail consultancies
- **Tertiary**: Single high-volume stores, pop-up retail analytics

---

## **2. VISION & MISSION**

### **2.1 Vision Statement**

> "To revolutionize retail operations by creating an intelligent ecosystem where every square foot is optimized, every customer journey is understood, and every decision is data-driven."

### **2.2 Mission**

Transform retail spaces into intelligent environments that:
- **See** - Track every movement and transaction
- **Understand** - Analyze patterns and behaviors
- **Predict** - Forecast future outcomes
- **Act** - Automatically optimize operations
- **Learn** - Continuously improve from results

### **2.3 Core Principles**

1. **Modularity First**: Every feature is a standalone module
2. **API-Driven**: Everything accessible via APIs
3. **Real-Time Focus**: Decisions based on current data
4. **AI-Enhanced**: Machine learning improves all metrics
5. **Enterprise-Ready**: Security, compliance, and scale built-in

---

## **3. SYSTEM ARCHITECTURE**

### **3.1 High-Level Architecture**

```mermaid
graph TB
    subgraph "Data Sources"
        A[People Counting Sensors]
        B[POS Systems]
        C[External APIs]
        D[Manual Inputs]
    end
    
    subgraph "Data Ingestion Layer"
        E[Sensor Collectors]
        F[API Connectors]
        G[Webhook Receivers]
        H[Batch Importers]
    end
    
    subgraph "Core Platform"
        I[Data Processing Engine]
        J[AI/ML Pipeline]
        K[Real-time Analytics]
        L[Storage Layer]
    end
    
    subgraph "Application Layer"
        M[REST APIs]
        N[GraphQL API]
        O[WebSocket Server]
        P[OData Service]
    end
    
    subgraph "Frontend Applications"
        Q[Web Dashboard]
        R[Mobile Apps]
        S[Embedded Analytics]
    end
    
    subgraph "Integration Layer"
        T[Power BI Connector]
        U[Dynamics 365 Sync]
        V[Webhook Manager]
        W[Export Services]
    end
    
    A --> E
    B --> F
    C --> G
    D --> H
    
    E --> I
    F --> I
    G --> I
    H --> I
    
    I --> J
    I --> K
    I --> L
    
    J --> K
    K --> L
    
    L --> M
    L --> N
    K --> O
    L --> P
    
    M --> Q
    N --> R
    O --> S
    
    M --> T
    M --> U
    K --> V
    L --> W
```

### **3.2 Microservices Architecture**

```yaml
services:
  # Core Services
  auth-service:
    description: "Authentication & authorization"
    tech: "Node.js + Supabase Auth"
    apis: ["REST", "GraphQL"]
    
  tenant-service:
    description: "Multi-tenancy management"
    tech: "Node.js + PostgreSQL"
    apis: ["REST"]
    
  # Data Collection Services
  sensor-collector:
    description: "People counting data ingestion"
    tech: "Python + AsyncIO"
    apis: ["REST", "WebSocket"]
    
  pos-integrator:
    description: "Sales data synchronization"
    tech: "Node.js + Bull Queue"
    apis: ["REST", "Webhooks"]
    
  # Analytics Services
  analytics-engine:
    description: "Real-time analytics processing"
    tech: "Python + Pandas + Redis"
    apis: ["gRPC", "REST"]
    
  ai-service:
    description: "ML predictions & insights"
    tech: "Python + TensorFlow + OpenAI"
    apis: ["gRPC", "REST"]
    
  # Module Services
  targets-engine:
    description: "Smart targets & cascading"
    tech: "Node.js + PostgreSQL"
    apis: ["REST", "GraphQL"]
    
  benchmark-service:
    description: "Industry comparisons"
    tech: "Python + PostgreSQL"
    apis: ["REST"]
    
  # Integration Services
  integration-hub:
    description: "External system connectors"
    tech: "Node.js + RabbitMQ"
    apis: ["REST", "OData", "SOAP"]
    
  webhook-manager:
    description: "Webhook delivery & management"
    tech: "Node.js + Redis + Bull"
    apis: ["REST"]
```

### **3.3 Data Flow Architecture**

```typescript
interface DataFlowArchitecture {
  ingestion: {
    sensors: {
      protocol: 'HTTP/CSV',
      frequency: 'Every 5 minutes',
      processing: 'Stream processing with Kafka'
    },
    pos: {
      protocol: 'REST API / SFTP',
      frequency: 'Real-time / Batch',
      processing: 'Queue-based with retry'
    },
    external: {
      protocol: 'Various',
      frequency: 'Scheduled',
      processing: 'ETL pipeline'
    }
  };
  
  processing: {
    realtime: {
      engine: 'Apache Flink / Spark Streaming',
      latency: '< 1 second',
      outputs: ['Current metrics', 'Alerts', 'Predictions']
    },
    batch: {
      engine: 'Apache Spark',
      schedule: 'Hourly / Daily',
      outputs: ['Aggregations', 'Reports', 'ML training data']
    }
  };
  
  storage: {
    operational: {
      database: 'PostgreSQL with Supabase',
      caching: 'Redis',
      timeseries: 'TimescaleDB'
    },
    analytical: {
      warehouse: 'Snowflake / BigQuery',
      datalake: 'S3 / Azure Data Lake'
    }
  };
}
```

---

## **4. TECHNICAL STACK**

### **4.1 Core Technologies**

```yaml
backend:
  primary_language: "TypeScript/Node.js"
  secondary_language: "Python"
  
  frameworks:
    api: "Next.js API Routes + Vercel"
    realtime: "Supabase Realtime"
    ml_serving: "FastAPI + Uvicorn"
    
  databases:
    primary: "PostgreSQL via Supabase"
    caching: "Redis"
    timeseries: "TimescaleDB"
    vector: "pgvector for AI"
    
  message_queue: "RabbitMQ / AWS SQS"
  
  ml_framework:
    training: "TensorFlow / PyTorch"
    serving: "TensorFlow Serving / ONNX"
    llm: "OpenAI GPT-4 API"

frontend:
  framework: "Next.js 14 with App Router"
  ui_library: "shadcn/ui + Tailwind CSS"
  state_management: "Zustand + React Query"
  charts: "Recharts + D3.js"
  realtime: "Supabase Client"
  
infrastructure:
  hosting: "Vercel + AWS"
  cdn: "Vercel Edge Network"
  storage: "AWS S3"
  email: "SendGrid"
  sms: "Twilio"
  
monitoring:
  apm: "New Relic / Datadog"
  logging: "LogDNA / Papertrail"
  error_tracking: "Sentry"
  analytics: "Segment + Mixpanel"
```

### **4.2 Development Tools**

```yaml
version_control:
  platform: "GitHub"
  branching_strategy: "GitFlow"
  
ci_cd:
  pipeline: "GitHub Actions"
  deployment: "Vercel + AWS CDK"
  
testing:
  unit: "Jest + React Testing Library"
  integration: "Playwright"
  e2e: "Cypress"
  load: "k6 / Artillery"
  
quality:
  linting: "ESLint + Prettier"
  type_checking: "TypeScript strict mode"
  security: "Snyk + OWASP ZAP"
  
documentation:
  api: "OpenAPI 3.0 + Swagger"
  code: "TypeDoc + Storybook"
  user: "Docusaurus"
```

---

## **5. CORE MODULES**

### **5.1 Authentication & Multi-Tenancy Module**

```typescript
interface AuthModule {
  features: {
    authentication: {
      methods: ['email', 'oauth', 'saml', 'sso'];
      mfa: ['totp', 'sms', 'email'];
      sessions: {
        duration: '7d';
        refresh: true;
        concurrent: 5;
      };
    };
    
    authorization: {
      model: 'RBAC with ABAC policies';
      roles: ['owner', 'admin', 'manager', 'analyst', 'viewer'];
      permissions: 'Granular per module';
      delegation: true;
    };
    
    multiTenancy: {
      isolation: 'Row Level Security';
      customization: ['branding', 'features', 'limits'];
      billing: 'Per organization';
    };
  };
  
  apis: [
    'POST /auth/register',
    'POST /auth/login',
    'POST /auth/logout',
    'POST /auth/refresh',
    'GET /auth/me',
    'PUT /auth/mfa',
    'POST /organizations',
    'PUT /organizations/:id',
    'POST /organizations/:id/members',
    'PUT /members/:id/role'
  ];
}
```

### **5.2 People Counting Module**

```typescript
interface PeopleCountingModule {
  features: {
    basic: {
      entryExit: true;
      occupancy: true;
      hourlyTrends: true;
      alerts: ['overcrowding', 'unusual_activity'];
    };
    
    advanced: {
      pathAnalysis: true;
      dwellTime: true;
      queueDetection: true;
      demographicsEstimation: true;
    };
    
    captureRate: {
      mallTraffic: true;
      storeEntries: true;
      conversionFunnel: true;
      competitorAnalysis: true;
    };
  };
  
  sensors: {
    supported: ['VS133', 'Axis', 'Hikvision', 'Generic HTTP'];
    protocols: ['HTTP', 'RTSP', 'MQTT'];
    dataFormats: ['CSV', 'JSON', 'XML'];
  };
  
  metrics: [
    'footfall_count',
    'occupancy_current',
    'capture_rate',
    'avg_dwell_time',
    'peak_hours',
    'entry_exit_ratio'
  ];
}
```

### **5.3 Sales Integration Module**

```typescript
interface SalesModule {
  features: {
    posIntegration: {
      systems: ['Square', 'Shopify', 'SAP', 'Oracle', 'Custom API'];
      data: ['transactions', 'products', 'customers', 'staff'];
      sync: ['realtime', 'batch', 'webhook'];
    };
    
    analytics: {
      revenue: ['hourly', 'daily', 'weekly', 'monthly'];
      products: ['top_sellers', 'slow_movers', 'cross_sell'];
      staff: ['performance', 'productivity', 'commissions'];
      customers: ['segments', 'lifetime_value', 'churn'];
    };
    
    correlation: {
      trafficToSales: true;
      dwellToConversion: true;
      staffToPerformance: true;
      weatherImpact: true;
    };
  };
  
  integrations: [
    {
      name: 'Shopify',
      type: 'REST API',
      sync: 'webhook + polling',
      data: ['orders', 'products', 'customers']
    },
    {
      name: 'Square',
      type: 'REST API',
      sync: 'webhook',
      data: ['transactions', 'inventory', 'employees']
    }
  ];
}
```

### **5.4 Smart Targets Module**

```typescript
interface TargetsModule {
  features: {
    targetSetting: {
      types: ['sales', 'traffic', 'conversion', 'custom'];
      periods: ['daily', 'weekly', 'monthly', 'quarterly', 'custom'];
      methods: ['manual', 'historical', 'ai_suggested'];
    };
    
    cascading: {
      directions: ['top_down', 'bottom_up', 'hybrid'];
      levels: ['org', 'region', 'store', 'department', 'team', 'individual'];
      allocation: ['equal', 'weighted', 'historical', 'potential'];
    };
    
    tracking: {
      realtime: true;
      predictions: true;
      alerts: ['falling_behind', 'overachieving', 'at_risk'];
      interventions: ['suggested_actions', 'reallocation', 'coaching'];
    };
    
    gamification: {
      leaderboards: true;
      achievements: true;
      challenges: true;
      rewards: ['points', 'badges', 'prizes'];
    };
  };
  
  algorithms: {
    allocation: 'ML-based optimal distribution';
    prediction: 'Time series forecasting with external factors';
    optimization: 'Reinforcement learning for target adjustment';
  };
}
```

### **5.5 AI Insights Module**

```typescript
interface AIModule {
  features: {
    predictions: {
      revenue: 'Next 4 hours with confidence intervals';
      traffic: 'Daily patterns with anomaly detection';
      conversion: 'Real-time optimization suggestions';
    };
    
    insights: {
      whyAnalysis: 'Causal inference for metric changes';
      whatIf: 'Scenario simulation';
      recommendations: 'Actionable with ROI estimates';
    };
    
    automation: {
      alerts: 'Intelligent threshold detection';
      reports: 'Natural language generation';
      optimization: 'Auto-pilot mode for operations';
    };
  };
  
  models: {
    footfallPrediction: {
      type: 'LSTM + External factors',
      accuracy: '±5% for 4-hour window',
      features: ['historical', 'weather', 'events', 'seasonality']
    };
    
    conversionOptimization: {
      type: 'Reinforcement Learning',
      actions: ['staff_deployment', 'layout_changes', 'promotions'],
      reward: 'Revenue maximization'
    };
    
    anomalyDetection: {
      type: 'Isolation Forest + Rules',
      categories: ['security', 'operational', 'opportunity'],
      response: 'Automated alerts and actions'
    };
  };
}
```

### **5.6 Benchmarking Module**

```typescript
interface BenchmarkingModule {
  features: {
    internal: {
      storeComparison: true;
      timeComparison: true;
      teamComparison: true;
      customGroups: true;
    };
    
    external: {
      industryBenchmarks: true;
      anonymizedCompetitors: true;
      marketTrends: true;
      bestPractices: true;
    };
    
    insights: {
      gapAnalysis: true;
      improvementPotential: true;
      successFactors: true;
      recommendations: true;
    };
  };
  
  dataSources: {
    internal: 'Aggregated platform data';
    industry: 'Partner data exchanges';
    public: 'Government statistics, reports';
    purchased: 'Nielsen, Euromonitor data';
  };
}
```

---

## **6. DATA MODELS**

### **6.1 Core Database Schema**

```sql
-- Organizations (Tenants)
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  industry TEXT,
  size TEXT CHECK (size IN ('small', 'medium', 'large', 'enterprise')),
  settings JSONB DEFAULT '{}',
  subscription JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sites/Stores
CREATE TABLE sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT CHECK (type IN ('store', 'kiosk', 'warehouse', 'office')),
  address JSONB,
  coordinates POINT,
  timezone TEXT DEFAULT 'UTC',
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, code)
);

-- Sensors Configuration
CREATE TABLE sensors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  ip_address TEXT,
  credentials JSONB, -- Encrypted
  config JSONB DEFAULT '{}',
  last_seen TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- People Counting Data
CREATE TABLE people_counts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  sensor_id UUID REFERENCES sensors(id),
  timestamp TIMESTAMPTZ NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Counts
  entries INTEGER DEFAULT 0,
  exits INTEGER DEFAULT 0,
  occupancy INTEGER DEFAULT 0,
  
  -- Line specific (if applicable)
  line1_in INTEGER DEFAULT 0,
  line2_in INTEGER DEFAULT 0,
  line3_in INTEGER DEFAULT 0,
  line4_in INTEGER DEFAULT 0,
  line4_out INTEGER DEFAULT 0,
  
  -- Mall traffic
  passersby INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_people_counts_site_time (site_id, timestamp DESC),
  INDEX idx_people_counts_period (site_id, period_start, period_end),
  
  -- Prevent duplicates
  UNIQUE(site_id, sensor_id, period_start)
);

-- Regional/Heatmap Data
CREATE TABLE heatmap_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  sensor_id UUID REFERENCES sensors(id),
  timestamp TIMESTAMPTZ NOT NULL,
  
  -- Zone data
  zones JSONB NOT NULL, -- {zone1: count, zone2: count, ...}
  total_activity INTEGER DEFAULT 0,
  
  -- Dwell time
  avg_dwell_seconds INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_heatmap_site_time (site_id, timestamp DESC)
);

-- Sales Transactions
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  external_id TEXT, -- POS transaction ID
  
  -- Transaction details
  timestamp TIMESTAMPTZ NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  tax DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  
  -- Items
  items JSONB NOT NULL, -- Array of items
  item_count INTEGER NOT NULL,
  
  -- Staff & Customer
  staff_id TEXT,
  staff_name TEXT,
  customer_id TEXT,
  
  -- Type
  type TEXT CHECK (type IN ('sale', 'return', 'exchange', 'void')),
  payment_method TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_transactions_site_time (site_id, timestamp DESC),
  INDEX idx_transactions_staff (site_id, staff_id),
  UNIQUE(site_id, external_id)
);

-- Targets
CREATE TABLE targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES targets(id),
  
  -- Target details
  name TEXT NOT NULL,
  metric TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Values
  target_value DECIMAL(15,2) NOT NULL,
  stretch_value DECIMAL(15,2),
  minimum_value DECIMAL(15,2),
  
  -- Assignment
  entity_type TEXT CHECK (entity_type IN ('organization', 'region', 'site', 'team', 'user')),
  entity_id UUID NOT NULL,
  
  -- Cascade info
  cascade_method TEXT,
  cascade_config JSONB,
  
  -- Status
  status TEXT DEFAULT 'draft',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_targets_entity (entity_type, entity_id),
  INDEX idx_targets_period (period_start, period_end)
);

-- Performance Tracking
CREATE TABLE performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hour INTEGER CHECK (hour >= 0 AND hour < 24),
  
  -- Traffic metrics
  footfall INTEGER DEFAULT 0,
  passersby INTEGER DEFAULT 0,
  capture_rate DECIMAL(5,2),
  occupancy_avg INTEGER,
  occupancy_peak INTEGER,
  
  -- Sales metrics
  transactions INTEGER DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  avg_transaction DECIMAL(10,2),
  units_sold INTEGER DEFAULT 0,
  
  -- Conversion metrics
  conversion_rate DECIMAL(5,2),
  avg_dwell_minutes DECIMAL(6,2),
  
  -- Staff metrics
  staff_count INTEGER,
  sales_per_staff DECIMAL(10,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, date, hour),
  INDEX idx_performance_site_date (site_id, date DESC)
);

-- AI Predictions Log
CREATE TABLE ai_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL,
  prediction_time TIMESTAMPTZ NOT NULL,
  target_time TIMESTAMPTZ NOT NULL,
  
  -- Predictions
  predicted_value DECIMAL(15,2),
  confidence_low DECIMAL(15,2),
  confidence_high DECIMAL(15,2),
  confidence_score DECIMAL(3,2),
  
  -- Actuals (filled later)
  actual_value DECIMAL(15,2),
  accuracy_score DECIMAL(3,2),
  
  -- Context
  factors JSONB,
  model_version TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_predictions_site_type (site_id, prediction_type, prediction_time DESC)
);

-- Audit Trail
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  
  -- Action details
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_audit_org_time (organization_id, created_at DESC),
  INDEX idx_audit_user (user_id, created_at DESC)
);
```

### **6.2 Time-Series Optimization**

```sql
-- Using TimescaleDB for time-series data
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert people_counts to hypertable
SELECT create_hypertable('people_counts', 'timestamp');

-- Create continuous aggregates for performance
CREATE MATERIALIZED VIEW hourly_metrics
WITH (timescaledb.continuous) AS
SELECT 
  site_id,
  time_bucket('1 hour', timestamp) AS hour,
  SUM(entries) as total_entries,
  SUM(exits) as total_exits,
  AVG(occupancy) as avg_occupancy,
  MAX(occupancy) as peak_occupancy,
  SUM(passersby) as total_passersby,
  AVG(CASE WHEN passersby > 0 THEN entries::float / passersby * 100 ELSE 0 END) as capture_rate
FROM people_counts
GROUP BY site_id, hour;

-- Add refresh policy
SELECT add_continuous_aggregate_policy('hourly_metrics',
  start_offset => INTERVAL '3 hours',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');
```

---

## **7. API SPECIFICATIONS**

### **7.1 RESTful API Design**

```yaml
openapi: 3.0.0
info:
  title: Retail Intelligence Platform API
  version: 1.0.0
  description: Enterprise retail analytics and optimization platform

servers:
  - url: https://api.retailintelligence.ai/v1
  - url: https://api-eu.retailintelligence.ai/v1
  - url: https://api-asia.retailintelligence.ai/v1

security:
  - bearerAuth: []
  - apiKey: []

paths:
  # Authentication
  /auth/login:
    post:
      summary: Authenticate user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                organization_slug:
                  type: string
      responses:
        200:
          description: Authentication successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token:
                    type: string
                  refresh_token:
                    type: string
                  user:
                    $ref: '#/components/schemas/User'
                  organization:
                    $ref: '#/components/schemas/Organization'

  # People Counting
  /sites/{siteId}/footfall:
    get:
      summary: Get footfall data
      parameters:
        - name: siteId
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: start_date
          in: query
          schema:
            type: string
            format: date-time
        - name: end_date
          in: query
          schema:
            type: string
            format: date-time
        - name: granularity
          in: query
          schema:
            type: string
            enum: [minute, hour, day]
      responses:
        200:
          description: Footfall data
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/FootfallData'
                  summary:
                    $ref: '#/components/schemas/FootfallSummary'

  # Real-time WebSocket
  /ws/sites/{siteId}/realtime:
    get:
      summary: WebSocket connection for real-time data
      parameters:
        - name: siteId
          in: path
          required: true
          schema:
            type: string
      responses:
        101:
          description: Switching Protocols

  # Targets
  /targets:
    post:
      summary: Create new target
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TargetCreate'
      responses:
        201:
          description: Target created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Target'

  /targets/{targetId}/cascade:
    post:
      summary: Cascade target to sub-entities
      parameters:
        - name: targetId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                method:
                  type: string
                  enum: [top_down, bottom_up, hybrid, ai_optimized]
                constraints:
                  type: object
      responses:
        200:
          description: Cascade completed
          content:
            application/json:
              schema:
                type: object
                properties:
                  cascaded_targets:
                    type: array
                    items:
                      $ref: '#/components/schemas/Target'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        full_name:
          type: string
        role:
          type: string
          enum: [owner, admin, manager, analyst, viewer]
        permissions:
          type: array
          items:
            type: string

    Organization:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        slug:
          type: string
        subscription:
          type: object
          properties:
            plan:
              type: string
            modules:
              type: array
              items:
                type: string

    FootfallData:
      type: object
      properties:
        timestamp:
          type: string
          format: date-time
        entries:
          type: integer
        exits:
          type: integer
        occupancy:
          type: integer
        passersby:
          type: integer
        capture_rate:
          type: number
          format: float

    Target:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        metric:
          type: string
        period_start:
          type: string
          format: date
        period_end:
          type: string
          format: date
        target_value:
          type: number
        current_value:
          type: number
        achievement_percentage:
          type: number
        status:
          type: string
          enum: [on_track, at_risk, behind, exceeded]
```

### **7.2 GraphQL Schema**

```graphql
type Query {
  # Organization queries
  organization(id: ID!): Organization
  organizations: [Organization!]!
  
  # Site queries
  site(id: ID!): Site
  sites(organizationId: ID): [Site!]!
  
  # Analytics queries
  footfallAnalytics(
    siteId: ID!
    startDate: DateTime!
    endDate: DateTime!
    granularity: Granularity
  ): FootfallAnalytics!
  
  salesAnalytics(
    siteId: ID!
    startDate: DateTime!
    endDate: DateTime!
  ): SalesAnalytics!
  
  # Predictions
  predictions(
    siteId: ID!
    type: PredictionType!
    hours: Int
  ): [Prediction!]!
  
  # Benchmarks
  benchmarks(
    entityId: ID!
    entityType: EntityType!
    metrics: [String!]
  ): BenchmarkResult!
}

type Mutation {
  # Target management
  createTarget(input: CreateTargetInput!): Target!
  updateTarget(id: ID!, input: UpdateTargetInput!): Target!
  cascadeTarget(id: ID!, method: CascadeMethod!): CascadeResult!
  
  # Site management
  createSite(input: CreateSiteInput!): Site!
  updateSite(id: ID!, input: UpdateSiteInput!): Site!
  
  # Manual data entry
  recordManualCount(input: ManualCountInput!): FootfallEntry!
}

type Subscription {
  # Real-time updates
  footfallUpdates(siteId: ID!): FootfallUpdate!
  targetProgress(targetId: ID!): TargetProgress!
  alertStream(siteId: ID): Alert!
}

type Organization {
  id: ID!
  name: String!
  slug: String!
  sites: [Site!]!
  users: [User!]!
  subscription: Subscription!
}

type Site {
  id: ID!
  name: String!
  code: String!
  type: SiteType!
  address: Address!
  sensors: [Sensor!]!
  
  # Real-time data
  currentOccupancy: Int!
  todayFootfall: Int!
  captureRate: Float!
  
  # Analytics
  analytics(period: AnalyticsPeriod!): SiteAnalytics!
}

type FootfallAnalytics {
  period: Period!
  total: Int!
  average: Float!
  peak: PeakInfo!
  trend: Trend!
  hourlyBreakdown: [HourlyData!]!
  
  # Comparisons
  vsLastPeriod: Comparison!
  vsBenchmark: Comparison!
}

enum Granularity {
  MINUTE
  HOUR
  DAY
  WEEK
  MONTH
}

enum CascadeMethod {
  TOP_DOWN
  BOTTOM_UP
  HYBRID
  AI_OPTIMIZED
}
```

### **7.3 WebSocket Events**

```typescript
// Real-time event specifications
interface WebSocketEvents {
  // Client -> Server
  subscribe: {
    event: 'subscribe';
    data: {
      channels: Array<'footfall' | 'sales' | 'alerts' | 'predictions'>;
      siteIds: string[];
      granularity?: 'realtime' | 'minute' | '5minute';
    };
  };
  
  unsubscribe: {
    event: 'unsubscribe';
    data: {
      channels: string[];
    };
  };
  
  // Server -> Client
  footfallUpdate: {
    event: 'footfall:update';
    data: {
      siteId: string;
      timestamp: string;
      entries: number;
      exits: number;
      occupancy: number;
      trend: 'up' | 'down' | 'stable';
    };
  };
  
  alert: {
    event: 'alert:new';
    data: {
      id: string;
      type: 'threshold' | 'anomaly' | 'prediction' | 'system';
      severity: 'info' | 'warning' | 'critical';
      title: string;
      message: string;
      actionUrl?: string;
      actions?: Array<{
        label: string;
        action: string;
        payload?: any;
      }>;
    };
  };
  
  prediction: {
    event: 'prediction:update';
    data: {
      siteId: string;
      type: 'footfall' | 'revenue' | 'conversion';
      timeframe: string;
      value: number;
      confidence: number;
      factors: Array<{
        name: string;
        impact: string;
      }>;
    };
  };
}

// WebSocket client implementation
class RealtimeClient {
  private ws: WebSocket;
  private reconnectAttempts = 0;
  
  constructor(private token: string) {
    this.connect();
  }
  
  private connect() {
    this.ws = new WebSocket(`wss://api.retailintelligence.ai/ws?token=${this.token}`);
    
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.authenticate();
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
    
    this.ws.onclose = () => {
      this.reconnect();
    };
  }
  
  private reconnect() {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }
  
  subscribe(channels: string[], siteIds: string[]) {
    this.send({
      event: 'subscribe',
      data: { channels, siteIds }
    });
  }
  
  private send(message: any) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}
```

---

## **8. INTEGRATION LAYER**

### **8.1 Power BI Integration**

```typescript
// Power BI connector implementation
class PowerBIIntegration {
  private config: PowerBIConfig;
  private tokenCache: TokenCache;
  
  async setupIntegration(organizationId: string) {
    // 1. Create dedicated workspace
    const workspace = await this.createWorkspace({
      name: `Retail Intelligence - ${organizationId}`,
      description: 'Automated retail analytics workspace'
    });
    
    // 2. Create streaming datasets
    const datasets = await this.createDatasets(workspace.id, [
      {
        name: 'Real-time Footfall',
        tables: [{
          name: 'footfall_stream',
          columns: [
            { name: 'timestamp', dataType: 'DateTime' },
            { name: 'site_name', dataType: 'String' },
            { name: 'entries', dataType: 'Int64' },
            { name: 'exits', dataType: 'Int64' },
            { name: 'occupancy', dataType: 'Int64' },
            { name: 'capture_rate', dataType: 'Double' }
          ]
        }]
      },
      {
        name: 'Sales Performance',
        defaultMode: 'Push',
        tables: [{
          name: 'sales_data',
          columns: [
            { name: 'date', dataType: 'DateTime' },
            { name: 'site_name', dataType: 'String' },
            { name: 'revenue', dataType: 'Double' },
            { name: 'transactions', dataType: 'Int64' },
            { name: 'avg_basket', dataType: 'Double' },
            { name: 'conversion_rate', dataType: 'Double' }
          ]
        }]
      }
    ]);
    
    // 3. Create template reports
    const reports = await this.importReports(workspace.id, [
      'retail-intelligence-dashboard.pbix',
      'store-comparison.pbix',
      'executive-summary.pbix'
    ]);
    
    // 4. Setup automatic refresh
    await this.configureRefresh(datasets, {
      frequency: 'Every30Minutes',
      times: ['00:00', '06:00', '12:00', '18:00'],
      timezone: 'UTC'
    });
    
    // 5. Configure row-level security
    await this.setupRLS(datasets, organizationId);
    
    return {
      workspace,
      datasets,
      reports,
      embedTokens: await this.generateEmbedTokens(reports)
    };
  }
  
  // Push real-time data
  async pushData(datasetId: string, table: string, rows: any[]) {
    const url = `https://api.powerbi.com/v1.0/myorg/datasets/${datasetId}/tables/${table}/rows`;
    
    // Batch rows if needed (Power BI limit is 10,000 rows)
    const batches = this.batchRows(rows, 10000);
    
    for (const batch of batches) {
      await this.authenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify({ rows: batch })
      });
    }
  }
  
  // Create DirectQuery connection
  async createDirectQueryDataset(workspaceId: string) {
    const dataset = {
      name: 'Retail Intelligence Direct Connect',
      defaultMode: 'DirectQuery',
      tables: [{
        name: 'live_metrics',
        columns: this.getTableColumns('metrics'),
        source: {
          expression: `
            let
              Source = OData.Feed(
                "${process.env.API_URL}/odata/v4",
                [
                  Headers = [#"Authorization" = "Bearer " & GetToken()],
                  Implementation = "2.0"
                ]
              ),
              metrics = Source{[Name="metrics",Signature="table"]}[Data]
            in
              metrics
          `
        }
      }],
      relationships: this.getRelationships()
    };
    
    return await this.createDataset(workspaceId, dataset);
  }
}
```

### **8.2 Microsoft Dynamics 365 Integration**

```typescript
// Dynamics 365 bi-directional sync
class Dynamics365Integration {
  private dynamics: DynamicsWebApi;
  private syncEngine: SyncEngine;
  
  async initialize(config: DynamicsConfig) {
    // 1. Setup authentication
    this.dynamics = new DynamicsWebApi({
      webApiUrl: config.apiUrl,
      onTokenRefresh: this.getAccessToken.bind(this)
    });
    
    // 2. Create custom entities if not exist
    await this.ensureCustomEntities();
    
    // 3. Setup webhooks for real-time sync
    await this.registerWebhooks();
    
    // 4. Configure field mappings
    this.configureMappings();
  }
  
  private async ensureCustomEntities() {
    const entities = [
      {
        '@odata.type': 'Microsoft.Dynamics.CRM.EntityMetadata',
        SchemaName: 'ri_store_performance',
        DisplayName: {
          LocalizedLabels: [{
            Label: 'Store Performance',
            LanguageCode: 1033
          }]
        },
        Attributes: [
          this.createAttribute('ri_footfall_count', 'Integer', 'Footfall Count'),
          this.createAttribute('ri_conversion_rate', 'Decimal', 'Conversion Rate'),
          this.createAttribute('ri_capture_rate', 'Decimal', 'Capture Rate'),
          this.createAttribute('ri_revenue_actual', 'Money', 'Actual Revenue'),
          this.createAttribute('ri_revenue_target', 'Money', 'Target Revenue'),
          this.createAttribute('ri_ai_insights', 'Multiline', 'AI Insights', 4000)
        ]
      },
      {
        SchemaName: 'ri_customer_journey',
        DisplayName: { LocalizedLabels: [{ Label: 'Customer Journey Analytics' }] },
        Attributes: [
          this.createAttribute('ri_visit_frequency', 'Integer', 'Visit Frequency'),
          this.createAttribute('ri_avg_dwell_time', 'Integer', 'Avg Dwell Time (min)'),
          this.createAttribute('ri_preferred_zones', 'Multiline', 'Preferred Zones'),
          this.createAttribute('ri_purchase_likelihood', 'Decimal', 'Purchase Likelihood')
        ]
      }
    ];
    
    for (const entity of entities) {
      await this.createOrUpdateEntity(entity);
    }
  }
  
  // Sync store performance to Dynamics
  async syncStorePerformance(data: StorePerformanceData) {
    const record = {
      ri_store_id: data.storeId,
      ri_date: data.date,
      ri_footfall_count: data.footfall,
      ri_conversion_rate: data.conversionRate,
      ri_capture_rate: data.captureRate,
      ri_revenue_actual: data.revenue,
      ri_revenue_target: data.target,
      ri_ai_insights: JSON.stringify(data.insights),
      ri_last_updated: new Date()
    };
    
    // Upsert logic
    const existing = await this.dynamics.retrieveMultiple('ri_store_performances', {
      filter: `ri_store_id eq '${data.storeId}' and ri_date eq ${data.date}`
    });
    
    if (existing.value.length > 0) {
      await this.dynamics.update(
        'ri_store_performances',
        existing.value[0].ri_store_performanceid,
        record
      );
    } else {
      await this.dynamics.create('ri_store_performances', record);
    }
    
    // Trigger workflow if performance is below target
    if (data.revenue < data.target * 0.8) {
      await this.triggerWorkflow('LowPerformanceAlert', {
        storeId: data.storeId,
        gap: data.target - data.revenue,
        recommendations: data.insights.recommendations
      });
    }
  }
  
  // Handle Dynamics events
  async handleWebhook(event: DynamicsWebhookEvent) {
    switch (event.MessageName) {
      case 'Create':
      case 'Update':
        if (event.PrimaryEntityName === 'opportunity') {
          // New opportunity - adjust store targets
          await this.handleOpportunityChange(event);
        } else if (event.PrimaryEntityName === 'account') {
          // Customer update - sync to our system
          await this.handleAccountChange(event);
        }
        break;
        
      case 'Delete':
        await this.handleDeletion(event);
        break;
    }
  }
  
  private async handleOpportunityChange(event: DynamicsWebhookEvent) {
    const opportunity = await this.dynamics.retrieve(
      'opportunities',
      event.PrimaryEntityId,
      ['name', 'estimatedvalue', 'estimatedclosedate', 'parentaccountid']
    );
    
    // If high-value opportunity, increase targets
    if (opportunity.estimatedvalue > 100000) {
      await this.notifyTargetAdjustment({
        reason: 'High-value opportunity',
        suggestedIncrease: opportunity.estimatedvalue * 0.1,
        affectedPeriod: opportunity.estimatedclosedate,
        storeId: await this.mapAccountToStore(opportunity.parentaccountid)
      });
    }
  }
}
```

### **8.3 Universal Data Connector**

```typescript
// Generic connector for any system
class UniversalDataConnector {
  private connectors: Map<string, IConnector> = new Map();
  
  registerConnector(name: string, connector: IConnector) {
    this.connectors.set(name, connector);
  }
  
  async connect(system: string, config: any) {
    const connector = this.connectors.get(system);
    if (!connector) {
      throw new Error(`No connector available for ${system}`);
    }
    
    return await connector.connect(config);
  }
}

// Connector interface
interface IConnector {
  connect(config: any): Promise<Connection>;
  testConnection(): Promise<boolean>;
  getSupportedEntities(): Promise<string[]>;
  sync(entity: string, options: SyncOptions): Promise<SyncResult>;
  subscribe(entity: string, callback: (data: any) => void): Subscription;
}

// Example: Shopify connector
class ShopifyConnector implements IConnector {
  private client: ShopifyClient;
  
  async connect(config: ShopifyConfig) {
    this.client = new ShopifyClient({
      shop: config.shop,
      accessToken: config.accessToken,
      apiVersion: '2024-01'
    });
    
    return {
      isConnected: true,
      shop: config.shop,
      scopes: await this.client.getScopes()
    };
  }
  
  async sync(entity: string, options: SyncOptions) {
    switch (entity) {
      case 'orders':
        return await this.syncOrders(options);
      case 'products':
        return await this.syncProducts(options);
      case 'customers':
        return await this.syncCustomers(options);
      default:
        throw new Error(`Unsupported entity: ${entity}`);
    }
  }
  
  private async syncOrders(options: SyncOptions) {
    const orders = await this.client.orders.list({
      created_at_min: options.since,
      limit: 250,
      fields: 'id,created_at,total_price,line_items,customer'
    });
    
    const transformed = orders.map(order => ({
      external_id: order.id.toString(),
      timestamp: new Date(order.created_at),
      amount: parseFloat(order.total_price),
      items: order.line_items.map(item => ({
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        price: parseFloat(item.price)
      })),
      customer_id: order.customer?.id?.toString()
    }));
    
    return {
      entity: 'orders',
      count: transformed.length,
      data: transformed,
      hasMore: orders.length === 250
    };
  }
  
  subscribe(entity: string, callback: (data: any) => void) {
    // Setup Shopify webhook
    const webhook = {
      topic: `${entity}/create`,
      address: `${process.env.WEBHOOK_URL}/shopify/${entity}`,
      format: 'json'
    };
    
    this.client.webhook.create(webhook);
    
    return {
      unsubscribe: async () => {
        await this.client.webhook.delete(webhook.id);
      }
    };
  }
}
```

### **8.4 OData Service Implementation**

```typescript
// OData v4 service for universal access
class ODataService {
  private metadata: Metadata;
  
  constructor() {
    this.metadata = this.buildMetadata();
  }
  
  private buildMetadata(): Metadata {
    return {
      version: '4.0',
      dataServices: {
        schema: [{
          namespace: 'RetailIntelligence.OData',
          entityType: [
            {
              name: 'StoreMetrics',
              key: [{ propertyRef: [{ name: 'Id' }] }],
              property: [
                { name: 'Id', type: 'Edm.Guid', nullable: false },
                { name: 'StoreId', type: 'Edm.Guid', nullable: false },
                { name: 'Date', type: 'Edm.Date', nullable: false },
                { name: 'Footfall', type: 'Edm.Int32' },
                { name: 'Revenue', type: 'Edm.Decimal', scale: 2 },
                { name: 'ConversionRate', type: 'Edm.Double' },
                { name: 'CaptureRate', type: 'Edm.Double' }
              ],
              navigationProperty: [
                {
                  name: 'Store',
                  type: 'RetailIntelligence.OData.Store',
                  nullable: false
                },
                {
                  name: 'HourlyBreakdown',
                  type: 'Collection(RetailIntelligence.OData.HourlyMetrics)'
                }
              ]
            }
          ],
          entityContainer: {
            name: 'Container',
            entitySet: [
              {
                name: 'StoreMetrics',
                entityType: 'RetailIntelligence.OData.StoreMetrics'
              }
            ]
          }
        }]
      }
    };
  }
  
  // Handle OData queries
  async handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const parser = new ODataParser(url);
    
    try {
      const query = parser.parse();
      const results = await this.executeQuery(query);
      
      return new Response(
        JSON.stringify(this.formatResponse(results, query)),
        {
          headers: {
            'Content-Type': 'application/json;odata.metadata=minimal',
            'OData-Version': '4.0'
          }
        }
      );
    } catch (error) {
      return this.errorResponse(error);
    }
  }
  
  private async executeQuery(query: ODataQuery) {
    const sql = this.odataToSQL(query);
    const results = await db.query(sql);
    
    // Apply OData transformations
    let data = results.rows;
    
    // $expand
    if (query.expand) {
      data = await this.expandNavigationProperties(data, query.expand);
    }
    
    // $compute
    if (query.compute) {
      data = this.applyComputedProperties(data, query.compute);
    }
    
    return {
      value: data,
      '@odata.count': query.count ? results.totalCount : undefined,
      '@odata.nextLink': this.getNextLink(query, data)
    };
  }
}
```

---

## **9. SECURITY & COMPLIANCE**

### **9.1 Security Architecture**

```typescript
interface SecurityArchitecture {
  authentication: {
    providers: ['supabase', 'auth0', 'azure_ad', 'okta'];
    mfa: {
      required: boolean;
      methods: ['totp', 'sms', 'email', 'biometric'];
    };
    passwordPolicy: {
      minLength: 12;
      requireUppercase: true;
      requireNumbers: true;
      requireSpecialChars: true;
      expirationDays: 90;
      historyCount: 5;
    };
    sessionManagement: {
      timeout: '30m';
      absoluteTimeout: '8h';
      concurrentSessions: 3;
    };
  };
  
  authorization: {
    model: 'RBAC + ABAC';
    enforcement: 'Policy Decision Point';
    policies: 'Open Policy Agent (OPA)';
  };
  
  encryption: {
    atRest: {
      algorithm: 'AES-256-GCM';
      keyManagement: 'AWS KMS / Azure Key Vault';
      databases: 'Transparent Data Encryption';
    };
    inTransit: {
      tls: 'v1.3 minimum';
      certificates: 'Managed by CDN';
      hsts: 'max-age=31536000; includeSubDomains';
    };
  };
  
  dataProtection: {
    pii: {
      classification: ['public', 'internal', 'confidential', 'restricted'];
      masking: 'Dynamic based on role';
      retention: 'Automated based on policy';
    };
    anonymization: {
      customerData: 'Hashed identifiers';
      analytics: 'Aggregated only';
      exports: 'PII removed';
    };
  };
}
```

### **9.2 Compliance Framework**

```typescript
interface ComplianceFramework {
  regulations: {
    gdpr: {
      dataMapping: true;
      consentManagement: true;
      rightToErasure: true;
      dataPortability: true;
      breachNotification: '72 hours';
    };
    ccpa: {
      optOut: true;
      disclosure: true;
      nonDiscrimination: true;
    };
    pciDss: {
      level: 'SAQ-D';
      scope: 'Payment data excluded';
      scanning: 'Quarterly';
    };
    sox: {
      controls: 'IT General Controls';
      audit: 'Annual';
    };
  };
  
  auditing: {
    events: [
      'authentication',
      'authorization',
      'dataAccess',
      'configuration',
      'administrative'
    ];
    retention: '7 years';
    immutability: 'Write-once storage';
    reporting: 'Real-time + scheduled';
  };
  
  privacy: {
    dataMinimization: true;
    purposeLimitation: true;
    consentTracking: true;
    subprocessorManagement: true;
  };
}
```

### **9.3 Security Implementation**

```typescript
// Row Level Security policies
class SecurityPolicies {
  async applyRLS(supabase: SupabaseClient) {
    // Ensure users only see their organization's data
    await supabase.rpc('create_policy', {
      table: 'sites',
      policy_name: 'sites_isolation',
      definition: `
        CREATE POLICY sites_isolation ON sites
        FOR ALL
        USING (
          organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND is_active = true
          )
        )
      `
    });
    
    // Site-level access control
    await supabase.rpc('create_policy', {
      table: 'people_counts',
      policy_name: 'site_data_access',
      definition: `
        CREATE POLICY site_data_access ON people_counts
        FOR SELECT
        USING (
          site_id IN (
            SELECT site_id 
            FROM site_permissions sp
            JOIN organization_members om ON sp.organization_member_id = om.id
            WHERE om.user_id = auth.uid()
            
            UNION
            
            SELECT id 
            FROM sites
            WHERE organization_id IN (
              SELECT organization_id 
              FROM organization_members
              WHERE user_id = auth.uid()
              AND role IN ('owner', 'admin')
            )
          )
        )
      `
    });
  }
}

// API rate limiting
class RateLimiter {
  private limits = {
    anonymous: { requests: 100, window: '1h' },
    authenticated: { requests: 1000, window: '1h' },
    premium: { requests: 10000, window: '1h' },
    enterprise: { requests: 100000, window: '1h' }
  };
  
  async checkLimit(req: Request): Promise<boolean> {
    const identifier = this.getIdentifier(req);
    const tier = await this.getUserTier(identifier);
    const limit = this.limits[tier];
    
    const key = `rate_limit:${identifier}:${this.getCurrentWindow(limit.window)}`;
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, this.getWindowSeconds(limit.window));
    }
    
    if (current > limit.requests) {
      throw new RateLimitError(limit, current);
    }
    
    return true;
  }
}

// Audit logging
class AuditLogger {
  async log(event: AuditEvent) {
    const entry = {
      id: generateUUID(),
      timestamp: new Date(),
      user_id: event.userId,
      organization_id: event.organizationId,
      action: event.action,
      resource_type: event.resourceType,
      resource_id: event.resourceId,
      ip_address: event.ipAddress,
      user_agent: event.userAgent,
      session_id: event.sessionId,
      
      // Additional context
      metadata: {
        ...event.metadata,
        request_id: event.requestId,
        correlation_id: event.correlationId
      },
      
      // Compliance fields
      data_classification: event.dataClassification,
      pii_accessed: event.piiAccessed,
      
      // Immutable hash
      hash: this.calculateHash(event)
    };
    
    // Store in multiple locations for redundancy
    await Promise.all([
      this.storeInDatabase(entry),
      this.storeInS3(entry),
      this.sendToSIEM(entry)
    ]);
  }
  
  private calculateHash(event: AuditEvent): string {
    const content = JSON.stringify(event);
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');
  }
}
```

---

## **10. TESTING STRATEGY**

### **10.1 Test Architecture**

```yaml
testing_pyramid:
  unit_tests:
    coverage_target: 80%
    tools: ['Jest', 'React Testing Library']
    run: 'On every commit'
    
  integration_tests:
    coverage_target: 70%
    tools: ['Jest', 'Supertest']
    run: 'On every PR'
    
  e2e_tests:
    coverage_target: 'Critical paths'
    tools: ['Playwright', 'Cypress']
    run: 'Before deployment'
    
  performance_tests:
    tools: ['k6', 'Artillery']
    targets:
      - 'API response < 200ms p95'
      - 'Dashboard load < 3s'
      - 'Handle 10,000 concurrent users'
    
  security_tests:
    tools: ['OWASP ZAP', 'Snyk']
    run: 'Weekly + on deployment'
```

### **10.2 Test Implementation Examples**

```typescript
// Unit test example
describe('TargetCascadeEngine', () => {
  let engine: TargetCascadeEngine;
  let mockDb: jest.Mocked<Database>;
  
  beforeEach(() => {
    mockDb = createMockDatabase();
    engine = new TargetCascadeEngine(mockDb);
  });
  
  describe('topDownCascade', () => {
    it('should distribute targets based on historical performance', async () => {
      // Arrange
      const rootTarget = {
        id: 'target-1',
        entity_id: 'org-1',
        entity_type: 'organization',
        metric_name: 'revenue',
        target_value: 1000000
      };
      
      mockDb.query.mockResolvedValueOnce({
        rows: [
          { entity_id: 'store-1', historical_performance: 0.4 },
          { entity_id: 'store-2', historical_performance: 0.6 }
        ]
      });
      
      // Act
      const result = await engine.cascadeTargets({
        rootTarget,
        method: 'top_down',
        constraints: {}
      });
      
      // Assert
      expect(result.childTargets).toHaveLength(2);
      expect(result.childTargets[0].target_value).toBe(400000);
      expect(result.childTargets[1].target_value).toBe(600000);
    });
    
    it('should respect minimum constraints', async () => {
      // Test minimum value constraints
    });
    
    it('should handle circular dependencies', async () => {
      // Test circular dependency detection
    });
  });
});

// Integration test example
describe('API Integration Tests', () => {
  let app: Application;
  let authToken: string;
  
  beforeAll(async () => {
    app = await createTestApp();
    authToken = await getTestAuthToken();
  });
  
  describe('POST /api/targets/:id/cascade', () => {
    it('should cascade targets and return child targets', async () => {
      // Create test target
      const target = await createTestTarget();
      
      const response = await request(app)
        .post(`/api/targets/${target.id}/cascade`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          method: 'top_down',
          constraints: {
            minimum_percentage: 0.1
          }
        });
      
      expect(response.status).toBe(200);
      expect(response.body.cascaded_targets).toBeDefined();
      expect(response.body.cascaded_targets.length).toBeGreaterThan(0);
      
      // Verify database state
      const childTargets = await db.query(
        'SELECT * FROM targets WHERE parent_id = $1',
        [target.id]
      );
      
      expect(childTargets.rows.length).toBe(response.body.cascaded_targets.length);
    });
  });
});

// E2E test example
test.describe('Target Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });
  
  test('should create and cascade quarterly sales target', async ({ page }) => {
    // Navigate to targets
    await page.goto('/targets');
    await page.click('button:has-text("Create Target")');
    
    // Fill target form
    await page.fill('input[name="name"]', 'Q1 2024 Sales Target');
    await page.selectOption('select[name="metric"]', 'revenue');
    await page.fill('input[name="target_value"]', '5000000');
    await page.fill('input[name="period_start"]', '2024-01-01');
    await page.fill('input[name="period_end"]', '2024-03-31');
    
    await page.click('button:has-text("Create")');
    
    // Wait for target creation
    await page.waitForSelector('text=Target created successfully');
    
    // Cascade target
    await page.click('button:has-text("Cascade")');
    await page.selectOption('select[name="method"]', 'ai_optimized');
    await page.click('button:has-text("Start Cascade")');
    
    // Verify cascade results
    await page.waitForSelector('.cascade-visualization');
    const storeTargets = await page.locator('.store-target').count();
    expect(storeTargets).toBeGreaterThan(0);
    
    // Verify each store has allocation
    for (let i = 0; i < storeTargets; i++) {
      const allocation = await page.locator('.store-target').nth(i).locator('.allocation').textContent();
      expect(parseFloat(allocation)).toBeGreaterThan(0);
    }
  });
});

// Performance test example
import { check } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '5m', target: 100 },  // Ramp up
    { duration: '10m', target: 100 }, // Stay at 100 users
    { duration: '5m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests under 200ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
  },
};

export default function () {
  const token = __ENV.AUTH_TOKEN;
  
  // Test footfall endpoint
  const footfallRes = http.get(
    `${__ENV.API_URL}/api/sites/${__ENV.SITE_ID}/footfall`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  
  check(footfallRes, {
    'footfall status is 200': (r) => r.status === 200,
    'footfall response time < 200ms': (r) => r.timings.duration < 200,
    'footfall has data': (r) => JSON.parse(r.body).data.length > 0,
  });
  
  // Test real-time WebSocket
  const ws = new WebSocket(`${__ENV.WS_URL}/ws/sites/${__ENV.SITE_ID}/realtime`);
  
  ws.on('open', () => {
    ws.send(JSON.stringify({
      event: 'subscribe',
      channels: ['footfall', 'alerts']
    }));
  });
  
  ws.on('message', (data) => {
    check(data, {
      'websocket message valid': (d) => {
        try {
          JSON.parse(d);
          return true;
        } catch {
          return false;
        }
      },
    });
  });
}
```

### **10.3 Test Data Management**

```typescript
// Test data factory
class TestDataFactory {
  static createOrganization(overrides?: Partial<Organization>): Organization {
    return {
      id: faker.datatype.uuid(),
      name: faker.company.name(),
      slug: faker.helpers.slugify(faker.company.name()).toLowerCase(),
      subscription: {
        plan: 'enterprise',
        modules: ['people-counter', 'sales', 'targets', 'ai']
      },
      ...overrides
    };
  }
  
  static createFootfallData(
    siteId: string,
    hours: number = 24
  ): FootfallData[] {
    const data: FootfallData[] = [];
    const now = new Date();
    
    for (let i = 0; i < hours * 12; i++) { // 5-minute intervals
      const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000);
      const isBusinessHour = timestamp.getHours() >= 9 && timestamp.getHours() < 21;
      
      data.push({
        site_id: siteId,
        timestamp,
        entries: isBusinessHour ? faker.datatype.number({ min: 5, max: 50 }) : 0,
        exits: isBusinessHour ? faker.datatype.number({ min: 5, max: 45 }) : 0,
        occupancy: faker.datatype.number({ min: 0, max: 200 }),
        passersby: faker.datatype.number({ min: 20, max: 200 })
      });
    }
    
    return data;
  }
  
  static async seedDatabase() {
    const org = this.createOrganization();
    const sites = Array.from({ length: 5 }, () => this.createSite(org.id));
    
    await db.insert('organizations', org);
    await db.insert('sites', sites);
    
    // Seed historical data
    for (const site of sites) {
      const footfallData = this.createFootfallData(site.id, 24 * 30); // 30 days
      await db.insert('people_counts', footfallData);
    }
  }
}
```

---

## **11. DOCUMENTATION**

### **11.1 Documentation Structure**

```yaml
documentation:
  user_documentation:
    getting_started:
      - 'Quick start guide'
      - 'Video tutorials'
      - 'Common use cases'
    
    feature_guides:
      - 'People counting setup'
      - 'Sales integration'
      - 'Target management'
      - 'Report creation'
    
    best_practices:
      - 'Sensor placement'
      - 'Target setting strategies'
      - 'Performance optimization'
    
  api_documentation:
    format: 'OpenAPI 3.0'
    tools: ['Swagger UI', 'Redoc']
    includes:
      - 'Authentication'
      - 'Rate limits'
      - 'Error codes'
      - 'Examples'
      - 'SDKs'
    
  developer_documentation:
    architecture:
      - 'System design'
      - 'Data flow'
      - 'Security model'
    
    contribution:
      - 'Development setup'
      - 'Coding standards'
      - 'PR process'
      - 'Testing guidelines'
    
    deployment:
      - 'Environment setup'
      - 'Configuration'
      - 'Monitoring'
      - 'Troubleshooting'
```

### **11.2 API Documentation Example**

```typescript
/**
 * @openapi
 * /api/sites/{siteId}/footfall:
 *   get:
 *     summary: Retrieve footfall data for a site
 *     description: |
 *       Returns footfall data for the specified site within the given time range.
 *       Data includes entries, exits, occupancy, and capture rate metrics.
 *       
 *       **Rate limits:**
 *       - Standard: 1000 requests/hour
 *       - Premium: 10,000 requests/hour
 *       
 *       **Data freshness:**
 *       - Real-time data: 1-minute delay
 *       - Historical data: Available immediately
 *     
 *     tags:
 *       - People Counting
 *     
 *     security:
 *       - bearerAuth: []
 *       - apiKey: []
 *     
 *     parameters:
 *       - name: siteId
 *         in: path
 *         required: true
 *         description: Unique identifier of the site
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *       
 *       - name: start_date
 *         in: query
 *         required: true
 *         description: Start of the time range (ISO 8601)
 *         schema:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00Z"
 *       
 *       - name: end_date
 *         in: query
 *         required: true
 *         description: End of the time range (ISO 8601)
 *         schema:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T23:59:59Z"
 *       
 *       - name: granularity
 *         in: query
 *         required: false
 *         description: Data aggregation level
 *         schema:
 *           type: string
 *           enum: [minute, hour, day]
 *           default: hour
 *       
 *       - name: include_predictions
 *         in: query
 *         required: false
 *         description: Include AI predictions for future periods
 *         schema:
 *           type: boolean
 *           default: false
 *     
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FootfallData'
 *                 summary:
 *                   $ref: '#/components/schemas/FootfallSummary'
 *                 predictions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FootfallPrediction'
 *             
 *             examples:
 *               hourly_data:
 *                 summary: Hourly aggregated data
 *                 value:
 *                   data:
 *                     - timestamp: "2024-01-01T10:00:00Z"
 *                       entries: 145
 *                       exits: 132
 *                       occupancy: 89
 *                       passersby: 523
 *                       capture_rate: 27.7
 *                   summary:
 *                     total_entries: 1450
 *                     total_exits: 1398
 *                     avg_occupancy: 76
 *                     peak_occupancy: 134
 *                     avg_capture_rate: 24.3
 *       
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalid_date:
 *                 value:
 *                   error: "INVALID_DATE_RANGE"
 *                   message: "End date must be after start date"
 *       
 *       401:
 *         description: Unauthorized
 *       
 *       403:
 *         description: Forbidden - No access to site
 *       
 *       404:
 *         description: Site not found
 *       
 *       429:
 *         description: Rate limit exceeded
 *         headers:
 *           X-RateLimit-Limit:
 *             schema:
 *               type: integer
 *           X-RateLimit-Remaining:
 *             schema:
 *               type: integer
 *           X-RateLimit-Reset:
 *             schema:
 *               type: integer
 */
```

### **11.3 User Documentation Example**

```markdown
# Setting Up People Counting

## Overview

People counting forms the foundation of your retail analytics. This guide will help you set up and optimize your people counting system.

## Prerequisites

- Active subscription with People Counter module
- Admin or Manager role
- Sensor hardware installed

## Step 1: Add Your Sensors

1. Navigate to **Settings → Sensors**
2. Click **Add Sensor**
3. Enter sensor details:
   - **Name**: Descriptive name (e.g., "Main Entrance")
   - **Type**: Select your sensor model
   - **IP Address**: Sensor's network address
   - **Credentials**: Username and password

![Sensor Configuration](./images/sensor-config.png)

## Step 2: Configure Counting Lines

Different sensors support different counting configurations:

### Single Line Counting
Best for: Simple entrances, narrow passages

```
Outside | Inside
   →   [|]   →
   ←   [|]   ←
```

### Multi-Line Counting
Best for: Wide entrances, multiple doors

```
Line 1: Main door
Line 2: Side entrance  
Line 3: Emergency exit
Line 4: Mall entrance (for capture rate)
```

## Step 3: Set Up Capture Rate

Capture rate measures how many mall visitors enter your store:

1. Configure Line 4 to count mall traffic
2. System automatically calculates: `Capture Rate = Store Entries / Mall Traffic × 100`

## Step 4: Verify Data Collection

1. Go to **Analytics → Real-time**
2. Confirm you see:
   - ✅ Current occupancy updating
   - ✅ Entry/exit counts incrementing
   - ✅ Capture rate calculating

## Troubleshooting

### No Data Showing

1. Check sensor connectivity:
   ```bash
   ping [sensor-ip]
   ```

2. Verify credentials in sensor settings

3. Check firewall rules - sensors need to reach:
   - Your platform API
   - Port 80/443 for HTTP/HTTPS

### Incorrect Counts

1. Review sensor positioning
2. Adjust sensitivity settings
3. Check for obstacles in counting area

## Best Practices

1. **Sensor Placement**
   - Mount at 2.5-3m height
   - Perpendicular to traffic flow
   - Clear view of entire entrance

2. **Calibration**
   - Test with known traffic
   - Adjust during off-peak hours
   - Document any changes

3. **Maintenance**
   - Clean lens monthly
   - Check mounting stability
   - Update firmware regularly

## Next Steps

- [Configure Alerts](./alerts-setup.md)
- [Create Reports](./reporting-guide.md)
- [Set Targets](./targets-guide.md)
```

---

## **12. DEPLOYMENT & DEVOPS**

### **12.1 Infrastructure as Code**

```typescript
// infrastructure/main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    vercel = {
      source  = "vercel/vercel"
      version = "~> 0.11"
    }
  }
}

// Vercel deployment
resource "vercel_project" "retail_intelligence" {
  name = "retail-intelligence-platform"
  framework = "nextjs"
  
  git_repository = {
    type = "github"
    repo = "retail-intelligence/platform"
  }
  
  environment_variables = [
    {
      key   = "NEXT_PUBLIC_SUPABASE_URL"
      value = var.supabase_url
    },
    {
      key   = "SUPABASE_SERVICE_KEY"
      value = var.supabase_service_key
      target = ["production"]
    }
  ]
  
  build_command = "npm run build"
  output_directory = ".next"
}

// AWS resources for data processing
resource "aws_s3_bucket" "data_lake" {
  bucket = "retail-intelligence-data-lake"
  
  lifecycle_rule {
    enabled = true
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}

resource "aws_lambda_function" "data_processor" {
  filename         = "data-processor.zip"
  function_name    = "retail-intelligence-processor"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 300
  memory_size     = 1024
  
  environment {
    variables = {
      SUPABASE_URL = var.supabase_url
      BUCKET_NAME  = aws_s3_bucket.data_lake.id
    }
  }
  
  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.lambda_sg.id]
  }
}

// Auto-scaling for API
resource "aws_appautoscaling_target" "api_scaling" {
  max_capacity       = 100
  min_capacity       = 2
  resource_id        = "service/retail-intelligence/api"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "api_scaling_policy" {
  name               = "retail-intelligence-api-scaling"
  service_namespace  = aws_appautoscaling_target.api_scaling.service_namespace
  resource_id        = aws_appautoscaling_target.api_scaling.resource_id
  scalable_dimension = aws_appautoscaling_target.api_scaling.scalable_dimension
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}
```

### **12.2 CI/CD Pipeline**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: supabase/postgres:14.1.0.21
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: Run OWASP dependency check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'retail-intelligence'
          path: '.'
          format: 'HTML'

  e2e:
    runs-on: ubuntu-latest
    needs: [test]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          PLAYWRIGHT_BASE_URL: ${{ secrets.STAGING_URL }}
          TEST_USERNAME: ${{ secrets.TEST_USERNAME }}
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
      
      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  deploy:
    runs-on: ubuntu-latest
    needs: [test, security, e2e]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build Project
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Run smoke tests
        run: npm run test:smoke
        env:
          PRODUCTION_URL: ${{ secrets.PRODUCTION_URL }}
      
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}

  post-deploy:
    runs-on: ubuntu-latest
    needs: [deploy]
    
    steps:
      - name: Purge CDN cache
        run: |
          curl -X POST "https://api.cloudflare.com/client/v4/zones/${{ secrets.CLOUDFLARE_ZONE }}/purge_cache" \
            -H "Authorization: Bearer ${{ secrets.CLOUDFLARE_TOKEN }}" \
            -H "Content-Type: application/json" \
            --data '{"purge_everything":true}'
      
      - name: Update status page
        run: |
          curl -X POST "${{ secrets.STATUS_PAGE_API }}/incidents" \
            -H "Authorization: Bearer ${{ secrets.STATUS_PAGE_TOKEN }}" \
            -H "Content-Type: application/json" \
            --data '{
              "incident": {
                "name": "Deployment completed",
                "status": "resolved",
                "impact": "none",
                "body": "Platform has been updated to latest version"
              }
            }'
```

### **12.3 Monitoring & Observability**

```typescript
// monitoring/setup.ts
import { init as initSentry } from '@sentry/nextjs';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { Analytics } from '@segment/analytics-node';
import { StatsD } from 'node-statsd';

// Error tracking
initSentry({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new ProfilingIntegration(),
  ],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: 1.0,
  beforeSend(event, hint) {
    // Sanitize sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    return event;
  },
});

// Analytics tracking
const analytics = new Analytics({
  writeKey: process.env.SEGMENT_WRITE_KEY,
});

// Metrics collection
const metrics = new StatsD({
  host: process.env.STATSD_HOST,
  port: 8125,
  prefix: 'retail_intelligence.',
});

// Custom monitoring wrapper
export class Monitor {
  static trackEvent(event: string, properties?: any) {
    analytics.track({
      event,
      properties,
      context: {
        app: {
          name: 'retail-intelligence',
          version: process.env.APP_VERSION,
        },
      },
    });
  }
  
  static trackMetric(metric: string, value: number, tags?: string[]) {
    metrics.gauge(metric, value, tags);
  }
  
  static async trackApiCall(
    endpoint: string,
    method: string,
    handler: () => Promise<any>
  ) {
    const start = Date.now();
    const tags = [`endpoint:${endpoint}`, `method:${method}`];
    
    try {
      metrics.increment('api.calls', 1, tags);
      const result = await handler();
      
      const duration = Date.now() - start;
      metrics.timing('api.duration', duration, tags);
      metrics.increment('api.success', 1, tags);
      
      return result;
    } catch (error) {
      metrics.increment('api.errors', 1, [...tags, `error:${error.name}`]);
      throw error;
    }
  }
}

// Health check endpoint
export async function healthCheck(): Promise<HealthStatus> {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    sensors: await checkSensors(),
    external_apis: await checkExternalAPIs(),
  };
  
  const status = Object.values(checks).every(c => c.status === 'healthy')
    ? 'healthy'
    : 'degraded';
  
  return {
    status,
    version: process.env.APP_VERSION,
    uptime: process.uptime(),
    checks,
  };
}
```

---

## **13. PERFORMANCE REQUIREMENTS**

### **13.1 Performance Targets**

```yaml
performance_requirements:
  api_response_times:
    p50: 50ms
    p95: 200ms
    p99: 500ms
    
  page_load_times:
    dashboard: 2s
    reports: 3s
    real_time_view: 1s
    
  data_processing:
    sensor_ingestion: '< 1s from sensor to database'
    analytics_calculation: '< 5s for hourly aggregations'
    ai_predictions: '< 10s for 4-hour forecast'
    
  concurrent_users:
    minimum: 1000
    target: 10000
    peak: 50000
    
  data_volume:
    footfall_records: '1M per day per site'
    transactions: '100K per day per site'
    storage_growth: '~1TB per year per 100 sites'
    
  availability:
    uptime_target: 99.9%
    planned_maintenance: '< 4 hours per month'
    rto: '< 1 hour'
    rpo: '< 5 minutes'
```

### **13.2 Optimization Strategies**

```typescript
// Database optimization
class DatabaseOptimizer {
  // Connection pooling
  private pool = new Pool({
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  // Query optimization
  async optimizedFootfallQuery(siteId: string, startDate: Date, endDate: Date) {
    // Use materialized view for aggregated data
    const query = `
      SELECT 
        time_bucket('1 hour', timestamp) as hour,
        sum(entries) as total_entries,
        sum(exits) as total_exits,
        avg(occupancy) as avg_occupancy,
        max(occupancy) as peak_occupancy
      FROM hourly_metrics
      WHERE site_id = $1 
        AND timestamp >= $2 
        AND timestamp < $3
      GROUP BY hour
      ORDER BY hour DESC;
    `;
    
    return this.pool.query(query, [siteId, startDate, endDate]);
  }
  
  // Batch inserts
  async batchInsert(table: string, records: any[]) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Use COPY for maximum performance
      const stream = client.query(
        copyFrom(`COPY ${table} FROM STDIN WITH (FORMAT csv, HEADER false)`)
      );
      
      for (const record of records) {
        stream.write(this.recordToCSV(record));
      }
      
      stream.end();
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

// Caching strategy
class CacheManager {
  private redis: Redis;
  private cacheConfig = {
    footfall_realtime: { ttl: 60 },          // 1 minute
    footfall_hourly: { ttl: 3600 },          // 1 hour
    footfall_daily: { ttl: 86400 },          // 1 day
    predictions: { ttl: 300 },                // 5 minutes
    benchmarks: { ttl: 86400 },               // 1 day
  };
  
  async get<T>(key: string, fetcher: () => Promise<T>, type: string): Promise<T> {
    // Try cache first
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Fetch and cache
    const data = await fetcher();
    const ttl = this.cacheConfig[type]?.ttl || 300;
    
    await this.redis.setex(key, ttl, JSON.stringify(data));
    
    return data;
  }
  
  // Cache invalidation
  async invalidate(pattern: string) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// API response compression
export function compressionMiddleware() {
  return compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6,
    threshold: 1024,
  });
}
```

---

## **14. PRICING & PACKAGING**

### **14.1 Modular Pricing Structure**

```typescript
interface PricingStructure {
  // Base platform
  core: {
    included: ['Authentication', 'Multi-tenancy', 'Basic reporting', '1 admin user'];
    price: 'Free with any module';
  };
  
  // Individual modules
  modules: {
    peopleCounter: {
      name: 'People Counter Basic';
      price: '$299/month per site';
      included: [
        'Entry/exit counting',
        'Real-time occupancy',
        'Historical data (90 days)',
        'Basic reports',
        'Email alerts'
      ];
    };
    
    peopleCounterPro: {
      name: 'People Counter Pro';
      price: '$599/month per site';
      included: [
        'Everything in Basic',
        'Capture rate analysis',
        'Path analytics',
        'Demographics estimation',
        'Unlimited historical data',
        'API access'
      ];
    };
    
    salesIntegration: {
      name: 'Sales Analytics';
      price: '$399/month per site';
      included: [
        'POS integration',
        'Transaction analytics',
        'Product performance',
        'Staff metrics',
        'Conversion tracking'
      ];
    };
    
    targetsEngine: {
      name: 'Smart Targets';
      price: '$999/month per organization';
      included: [
        'Target setting & cascading',
        'Performance tracking',
        'Team scorecards',
        'Gamification',
        'Automated reporting'
      ];
    };
    
    aiInsights: {
      name: 'AI Insights';
      price: '$1,999/month per organization';
      requires: ['peopleCounter', 'salesIntegration'];
      included: [
        'Predictive analytics',
        'Anomaly detection',
        'Optimization recommendations',
        'Natural language insights',
        'Custom AI models'
      ];
    };
    
    benchmarking: {
      name: 'Benchmarking';
      price: '$499/month per organization';
      included: [
        'Internal comparisons',
        'Industry benchmarks',
        'Best practices library',
        'Improvement recommendations'
      ];
    };
  };
  
  // Bundles
  bundles: {
    starter: {
      name: 'Starter Bundle';
      price: '$899/month per site';
      savings: '20%';
      includes: ['peopleCounter', 'salesIntegration'];
    };
    
    professional: {
      name: 'Professional Bundle';
      price: '$1,999/month per site';
      savings: '25%';
      includes: ['peopleCounterPro', 'salesIntegration', 'targetsEngine'];
    };
    
    enterprise: {
      name: 'Enterprise Bundle';
      price: '$3,999/month per site';
      savings: '30%';
      includes: [
        'peopleCounterPro',
        'salesIntegration',
        'targetsEngine',
        'aiInsights',
        'benchmarking'
      ];
    };
  };
  
  // Add-ons
  addOns: {
    additionalUsers: '$19/month per user';
    customReports: '$299/month';
    whiteLabel: '$999/month';
    dedicatedSupport: '$1,999/month';
    customIntegration: '$2,999 one-time';
  };
  
  // Enterprise options
  enterprise: {
    customPricing: true;
    volumeDiscounts: {
      '10-49 sites': '10% off';
      '50-99 sites': '20% off';
      '100+ sites': '30% off';
    };
    sla: {
      availability: '99.9%';
      support: '24/7 phone & email';
      dedicatedCsm: true;
    };
  };
}
```

### **14.2 Billing Implementation**

```typescript
// Billing service using Stripe
class BillingService {
  private stripe: Stripe;
  
  async createSubscription(
    organizationId: string,
    plan: SubscriptionPlan
  ): Promise<Subscription> {
    // Get or create Stripe customer
    const customer = await this.getOrCreateCustomer(organizationId);
    
    // Create subscription items based on modules
    const items = plan.modules.map(module => ({
      price: this.getPriceId(module),
      quantity: module.quantity || 1,
      metadata: {
        module: module.name,
        sites: module.sites?.join(',')
      }
    }));
    
    // Apply discounts
    const discounts = this.calculateDiscounts(plan);
    
    // Create subscription
    const subscription = await this.stripe.subscriptions.create({
      customer: customer.id,
      items,
      trial_period_days: plan.trial ? 14 : undefined,
      metadata: {
        organization_id: organizationId,
        plan_type: plan.type
      },
      discounts
    });
    
    // Update organization record
    await this.updateOrganizationSubscription(organizationId, subscription);
    
    return subscription;
  }
  
  // Usage-based billing for API calls
  async recordUsage(
    organizationId: string,
    metric: UsageMetric
  ) {
    const subscription = await this.getActiveSubscription(organizationId);
    const usageRecord = {
      quantity: metric.quantity,
      timestamp: metric.timestamp,
      action: 'increment'
    };
    
    await this.stripe.subscriptionItems.createUsageRecord(
      subscription.items.data.find(i => i.price.id === metric.priceId).id,
      usageRecord
    );
  }
  
  // Module access control
  async hasModuleAccess(
    organizationId: string,
    module: string
  ): Promise<boolean> {
    const subscription = await this.getActiveSubscription(organizationId);
    
    if (!subscription || subscription.status !== 'active') {
      return false;
    }
    
    return subscription.items.data.some(
      item => item.metadata.module === module
    );
  }
}
```

---

## **15. IMPLEMENTATION ROADMAP**

### **15.1 Phase 1: Foundation (Months 1-3)**

```yaml
phase_1:
  month_1:
    infrastructure:
      - 'Setup development environment'
      - 'Configure CI/CD pipeline'
      - 'Setup monitoring and logging'
    
    core_platform:
      - 'Authentication system'
      - 'Multi-tenancy architecture'
      - 'Basic API framework'
    
    database:
      - 'Design and implement schema'
      - 'Setup Supabase'
      - 'Configure TimescaleDB'
  
  month_2:
    people_counting:
      - 'Sensor integration framework'
      - 'Data collection service'
      - 'Basic footfall analytics'
    
    frontend:
      - 'Dashboard framework'
      - 'Real-time displays'
      - 'Basic reporting'
    
    testing:
      - 'Unit test framework'
      - 'Integration tests'
      - 'E2E test setup'
  
  month_3:
    sales_integration:
      - 'POS connector framework'
      - 'Transaction processing'
      - 'Basic sales analytics'
    
    api_development:
      - 'RESTful endpoints'
      - 'GraphQL schema'
      - 'WebSocket implementation'
    
    documentation:
      - 'API documentation'
      - 'User guides'
      - 'Developer docs'
```

### **15.2 Phase 2: Advanced Features (Months 4-6)**

```yaml
phase_2:
  month_4:
    targets_module:
      - 'Target management system'
      - 'Cascading engine'
      - 'Performance tracking'
    
    integrations:
      - 'Power BI connector'
      - 'Basic webhook system'
      - 'Export functionality'
    
    ui_enhancements:
      - 'Advanced dashboards'
      - 'Custom report builder'
      - 'Mobile optimization'
  
  month_5:
    ai_integration:
      - 'OpenAI integration'
      - 'Predictive models'
      - 'Anomaly detection'
    
    benchmarking:
      - 'Internal comparisons'
      - 'Industry data integration'
      - 'Recommendations engine'
    
    security:
      - 'Advanced RBAC'
      - 'Audit logging'
      - 'Compliance features'
  
  month_6:
    enterprise_features:
      - 'SSO implementation'
      - 'Advanced integrations'
      - 'White-label options'
    
    performance:
      - 'Optimization'
      - 'Caching layer'
      - 'Load testing'
    
    beta_launch:
      - 'Private beta program'
      - 'Feedback collection'
      - 'Bug fixes'
```

### **15.3 Phase 3: Market Launch (Months 7-9)**

```yaml
phase_3:
  month_7:
    production_ready:
      - 'Security audit'
      - 'Performance tuning'
      - 'Disaster recovery'
    
    go_to_market:
      - 'Pricing finalization'
      - 'Marketing website'
      - 'Sales materials'
    
    partnerships:
      - 'Sensor vendors'
      - 'POS providers'
      - 'Consultancies'
  
  month_8:
    public_launch:
      - 'Production deployment'
      - 'Customer onboarding'
      - 'Support system'
    
    continuous_improvement:
      - 'Feature requests'
      - 'Bug fixes'
      - 'Performance monitoring'
  
  month_9:
    scaling:
      - 'Infrastructure scaling'
      - 'Team expansion'
      - 'International expansion'
    
    advanced_features:
      - 'Custom AI models'
      - 'Industry-specific modules'
      - 'Advanced analytics'
```

### **15.4 Success Metrics**

```yaml
success_metrics:
  technical:
    - 'API uptime > 99.9%'
    - 'Page load time < 2s'
    - 'Zero critical security issues'
    - 'Test coverage > 80%'
  
  business:
    - '100 customers by month 9'
    - '$500K ARR by year 1'
    - 'NPS score > 50'
    - 'Churn rate < 5%'
  
  product:
    - 'Feature adoption > 60%'
    - 'Daily active users > 70%'
    - 'Support tickets < 5 per customer/month'
    - 'Customer-reported bugs < 10/month'
```

---

## **CONCLUSION**

This comprehensive specification outlines a revolutionary retail intelligence platform that combines:

1. **Technical Excellence**: Modern architecture, scalable infrastructure, and robust security
2. **Business Innovation**: AI-powered insights, predictive analytics, and smart automation
3. **Market Differentiation**: Unique capture rate focus, modular design, and enterprise integration
4. **User Focus**: Intuitive interfaces, actionable insights, and measurable ROI

The platform is designed to grow from a focused people-counting solution to a comprehensive retail intelligence ecosystem, always maintaining flexibility and performance while delivering unprecedented value to retail businesses.

### **Next Steps**

1. **Technical Review**: Architecture validation with senior engineers
2. **Market Validation**: Customer interviews and competitive analysis  
3. **MVP Definition**: Prioritize features for initial release
4. **Team Building**: Recruit key technical and business roles
5. **Funding**: Secure resources for 12-month runway

### **Contact**

For questions or clarifications about this specification:
- **Technical**: tech@retailintelligence.ai
- **Business**: business@retailintelligence.ai
- **Partnerships**: partners@retailintelligence.ai

---

*This document is version 1.0 and will be updated as the platform evolves.*