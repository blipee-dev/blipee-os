# blipee OS Fix Implementation Plan

This comprehensive plan addresses all issues found during the full debug analysis. Each phase builds upon the previous one, ensuring system stability throughout the implementation process.

## Overview

- **Total Estimated Time**: 4-6 weeks for full implementation
- **Team Size Recommendation**: 2-3 developers
- **Critical Path**: Phase 1 → Phase 2 → Phase 3 (must be sequential)
- **Parallel Work**: Phases 4-6 can be worked on concurrently after Phase 3

## Phase 1: Critical Security & Auth Fixes (Week 1)

### Day 1-2: Authentication System Stabilization

#### 1.1 Fix Auth Signup Flow
```bash
# Apply the migration fix
npx supabase db push

# Create comprehensive auth fix
touch src/lib/auth/auth-fix.ts
```

**Implementation:**
```typescript
// src/lib/auth/auth-fix.ts
export async function ensureUserProfile(userId: string) {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (!profile) {
    // Create profile if missing
    await supabase.from('user_profiles').insert({
      id: userId,
      onboarding_completed: false,
      metadata: {},
      preferred_language: 'en',
      timezone: 'UTC'
    });
  }
}
```

#### 1.2 Add Transaction Support
```typescript
// src/lib/auth/service.ts
async signUpWithTransaction(email: string, password: string, metadata: SignUpMetadata) {
  const client = await this.getSupabase();
  
  try {
    // Start transaction
    const { data: authData, error: authError } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata.full_name,
          role: metadata.role || 'subscription_owner',
        },
      },
    });
    
    if (authError) throw authError;
    
    // Ensure profile exists
    await ensureUserProfile(authData.user!.id);
    
    // Create organization with proper error handling
    if (metadata.company_name) {
      const { error: orgError } = await client
        .from('organizations')
        .insert({
          name: metadata.company_name,
          owner_id: authData.user!.id,
        });
        
      if (orgError) {
        // Rollback by deleting user
        await client.auth.admin.deleteUser(authData.user!.id);
        throw orgError;
      }
    }
    
    return { data: authData, error: null };
  } catch (error) {
    console.error('Signup transaction failed:', error);
    return { data: null, error };
  }
}
```

### Day 3-4: Security Vulnerabilities

#### 1.3 Add Authentication Middleware
```typescript
// src/middleware/auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function withAuth(
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return handler(req, user.id);
  };
}
```

#### 1.4 Secure File Upload
```typescript
// src/app/api/files/upload/route.ts
import { withAuth } from '@/middleware/auth';
import { z } from 'zod';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/csv',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const ALLOWED_EXTENSIONS = ['.pdf', '.csv', '.png', '.jpg', '.jpeg', '.xlsx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const POST = withAuth(async (req, userId) => {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  
  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }
  
  // Validate extension
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json({ error: 'Invalid file extension' }, { status: 400 });
  }
  
  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 });
  }
  
  // Generate secure filename
  const fileId = crypto.randomUUID();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const secureFileName = `${userId}/${fileId}/${sanitizedName}`;
  
  // Additional security: scan file content (implement virus scanning)
  // await scanFile(file);
  
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(secureFileName, file, {
      cacheControl: '3600',
      upsert: false
    });
    
  if (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
  
  return NextResponse.json({ 
    success: true, 
    path: data.path,
    // Don't expose direct URLs
    id: fileId 
  });
});
```

### Day 5: Security Headers & CORS

#### 1.5 Add Security Headers
```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.vercel-insights.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https:;
      font-src 'self';
      connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.anthropic.com https://api.deepseek.com;
      frame-ancestors 'none';
    `.replace(/\s{2,}/g, ' ').trim()
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

## Phase 2: API Security & Error Handling (Week 2)

### Day 6-7: Global Error Handler & Rate Limiting

#### 2.1 Create Error Handler
```typescript
// src/lib/api/error-handler.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: unknown): NextResponse {
  console.error('API Error:', error);
  
  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
        },
      },
      { status: error.statusCode }
    );
  }
  
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: {
          message: 'Validation error',
          details: error.errors,
        },
      },
      { status: 400 }
    );
  }
  
  // Generic error (don't expose internals)
  return NextResponse.json(
    {
      error: {
        message: 'An error occurred processing your request',
      },
    },
    { status: 500 }
  );
}

// Wrapper for API routes
export function withErrorHandler(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      return handleAPIError(error);
    }
  };
}
```

#### 2.2 Implement Rate Limiting
```typescript
// src/lib/api/rate-limit.ts
import { LRUCache } from 'lru-cache';

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export function rateLimit(options?: Options) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000, // 1 minute default
  });

  return {
    check: async (req: NextRequest, limit: number, token: string) => {
      const tokenCount = (tokenCache.get(token) as number[]) || [0];
      const currentUsage = tokenCount[0];
      
      if (currentUsage >= limit) {
        throw new APIError('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
      }
      
      tokenCount[0] = currentUsage + 1;
      tokenCache.set(token, tokenCount);
      
      return currentUsage;
    },
  };
}

// Usage in API route
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export const POST = withErrorHandler(withAuth(async (req, userId) => {
  await limiter.check(req, 10, userId); // 10 requests per minute per user
  // ... rest of handler
}));
```

### Day 8-9: Input Validation & Sanitization

#### 2.3 Create Validation Schemas
```typescript
// src/lib/validation/schemas.ts
import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(10000),
  conversationId: z.string().uuid().optional(),
  buildingId: z.string().uuid(),
  attachments: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    type: z.string(),
    size: z.number().max(10 * 1024 * 1024),
  })).optional(),
});

export const organizationUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  settings: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

// HTML sanitization
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  });
}
```

#### 2.4 Update All API Routes
```typescript
// src/app/api/ai/chat/route.ts
export const POST = withErrorHandler(withAuth(async (req, userId) => {
  await limiter.check(req, 20, userId); // 20 requests per minute
  
  const body = await req.json();
  const validated = chatMessageSchema.parse(body);
  
  // Sanitize message content
  validated.message = sanitizeHTML(validated.message);
  
  // Process request...
}));
```

### Day 10: Fix Environment Variables

#### 2.5 Create Environment Config
```typescript
// src/lib/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Required
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // At least one AI provider required
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  
  // Optional APIs
  OPENWEATHERMAP_API_KEY: z.string().optional(),
  CARBON_INTERFACE_API_KEY: z.string().optional(),
  ELECTRICITY_MAPS_API_KEY: z.string().optional(),
  CLIMATIQ_API_KEY: z.string().optional(),
  CARBON_MARKET_API_KEY: z.string().optional(),
  REGULATORY_API_KEY: z.string().optional(),
  
  // Demo credentials (optional)
  DEMO_USER_EMAIL: z.string().email().optional(),
  DEMO_USER_PASSWORD: z.string().min(8).optional(),
});

// Validate at startup
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

// Check at least one AI provider
const hasAIProvider = !!(
  parsed.data.OPENAI_API_KEY ||
  parsed.data.ANTHROPIC_API_KEY ||
  parsed.data.DEEPSEEK_API_KEY
);

if (!hasAIProvider) {
  throw new Error('At least one AI provider API key is required');
}

export const env = parsed.data;
```

#### 2.6 Update .env.example
```bash
# Blipee OS Environment Variables
# Copy this file to .env.local and fill in your values

# ====================
# CORE SERVICES (Required)
# ====================

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ====================
# AI PROVIDERS (at least one required)
# ====================

# DeepSeek (Recommended - Fast & Affordable)
DEEPSEEK_API_KEY=

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# ====================
# EXTERNAL DATA APIS (Optional)
# ====================

# Weather Data
OPENWEATHERMAP_API_KEY=

# Carbon Tracking
CARBON_INTERFACE_API_KEY=
ELECTRICITY_MAPS_API_KEY=
CLIMATIQ_API_KEY=
CARBON_MARKET_API_KEY=
REGULATORY_API_KEY=

# ====================
# DEMO ACCOUNT (Optional)
# ====================

DEMO_USER_EMAIL=demo@blipee.com
DEMO_USER_PASSWORD=your-secure-password
```

## Phase 3: Database Schema Cleanup (Week 3)

### Day 11-12: Migration Consolidation

#### 3.1 Create Master Migration
```sql
-- supabase/migrations/022_consolidated_schema.sql
-- This migration consolidates all schema fixes

-- Ensure user_profiles has all required columns
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Re-add foreign key constraint if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_profiles_id_fkey'
    ) THEN
        ALTER TABLE public.user_profiles
        ADD CONSTRAINT user_profiles_id_fkey 
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Fix handle_new_user trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, 
    email, 
    full_name,
    metadata,
    preferred_language,
    timezone,
    onboarding_completed,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC'),
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_buildings_organization_id ON public.buildings(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_building_id ON public.conversations(building_id);
```

#### 3.2 Create Migration Documentation
```markdown
# Database Migration Guide

## Current Schema State (After Migration 022)

### Core Tables
1. **user_profiles** - Extended auth.users with app-specific data
2. **organizations** - Multi-tenant organizations
3. **organization_members** - User-organization relationships
4. **buildings** - Buildings within organizations
5. **conversations** - Chat conversations
6. **messages** - Individual messages within conversations

### Key Relationships
- Users → Organizations (many-to-many via organization_members)
- Organizations → Buildings (one-to-many)
- Buildings → Conversations (one-to-many)
- Conversations → Messages (one-to-many)

### RLS Policies
All tables have Row Level Security enabled with policies based on:
- User's organization membership
- User's role within organization
- Resource ownership

## Migration Cleanup Plan
1. After migration 022 is successfully applied:
   - Archive migrations 009-021 (keep for reference)
   - Remove all scripts in /scripts/ directory
   - Update documentation

2. Test thoroughly:
   - New user signup flow
   - Organization creation
   - Building management
   - Conversation creation
```

### Day 13-15: Data Integrity Fixes

#### 3.3 Create Data Validation Script
```typescript
// scripts/validate-data-integrity.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function validateDataIntegrity() {
  console.log('🔍 Validating data integrity...\n');
  
  // Check for orphaned user profiles
  const { data: orphanedProfiles } = await supabase
    .from('user_profiles')
    .select('id, email')
    .filter('id', 'not.in', 
      `(SELECT id FROM auth.users)`
    );
    
  if (orphanedProfiles?.length) {
    console.log(`❌ Found ${orphanedProfiles.length} orphaned user profiles`);
    // Option to clean up
  }
  
  // Check for users without profiles
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  for (const user of authUsers.users) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single();
      
    if (!profile) {
      console.log(`❌ User ${user.email} missing profile`);
      // Create missing profile
    }
  }
  
  // Check organization integrity
  const { data: orgs } = await supabase
    .from('organizations')
    .select('*, organization_members(*)');
    
  for (const org of orgs || []) {
    if (!org.organization_members?.length) {
      console.log(`⚠️  Organization "${org.name}" has no members`);
    }
  }
  
  console.log('\n✅ Data integrity check complete');
}
```

## Phase 4: AI Service Improvements (Week 4)

### Day 16-17: Unified AI Service

#### 4.1 Create New AI Service Architecture
```typescript
// src/lib/ai/unified-service.ts
import { AIProvider, CompletionOptions, StreamOptions } from './types';
import { ProviderMetrics, MetricsCollector } from './metrics';
import { QuotaManager } from './quota';
import { env } from '@/lib/config/env';

interface ProviderConfig {
  provider: AIProvider;
  priority: number;
  costPerToken: number;
  specializations: string[];
  quotaLimits: {
    requestsPerMinute: number;
    tokensPerDay: number;
    costPerDay: number;
  };
}

export class UnifiedAIService {
  private providers: Map<string, ProviderConfig> = new Map();
  private metrics = new MetricsCollector();
  private quotaManager = new QuotaManager();
  
  constructor() {
    this.initializeProviders();
  }
  
  private initializeProviders() {
    if (env.DEEPSEEK_API_KEY) {
      this.providers.set('deepseek', {
        provider: new DeepSeekProvider(env.DEEPSEEK_API_KEY),
        priority: 1, // Highest priority (cheapest)
        costPerToken: 0.0001,
        specializations: ['code', 'technical'],
        quotaLimits: {
          requestsPerMinute: 60,
          tokensPerDay: 1000000,
          costPerDay: 100,
        },
      });
    }
    
    if (env.OPENAI_API_KEY) {
      this.providers.set('openai', {
        provider: new OpenAIProvider(env.OPENAI_API_KEY),
        priority: 2,
        costPerToken: 0.002,
        specializations: ['general', 'creative'],
        quotaLimits: {
          requestsPerMinute: 30,
          tokensPerDay: 500000,
          costPerDay: 1000,
        },
      });
    }
    
    if (env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', {
        provider: new AnthropicProvider(env.ANTHROPIC_API_KEY),
        priority: 3,
        costPerToken: 0.003,
        specializations: ['analysis', 'ethics', 'safety'],
        quotaLimits: {
          requestsPerMinute: 20,
          tokensPerDay: 300000,
          costPerDay: 900,
        },
      });
    }
  }
  
  async complete(
    prompt: string,
    options?: CompletionOptions & { 
      taskType?: 'code' | 'analysis' | 'conversation' | 'general';
      urgency?: 'immediate' | 'normal';
      maxCost?: number;
    }
  ) {
    const providers = this.selectProviders(options);
    
    for (const [name, config] of providers) {
      try {
        // Check quota
        const canProceed = await this.quotaManager.checkQuota(
          name,
          this.estimateTokens(prompt),
          config.quotaLimits
        );
        
        if (!canProceed) {
          console.log(`Provider ${name} quota exceeded, trying next...`);
          continue;
        }
        
        // Attempt with exponential backoff
        const result = await this.attemptWithRetry(
          () => config.provider.complete(prompt, options),
          name
        );
        
        // Record metrics
        this.metrics.recordSuccess(name, result);
        
        return result;
      } catch (error) {
        this.metrics.recordFailure(name, error);
        console.error(`Provider ${name} failed:`, error);
      }
    }
    
    throw new Error('All AI providers failed or exceeded quotas');
  }
  
  private selectProviders(options?: any): Array<[string, ProviderConfig]> {
    let providers = Array.from(this.providers.entries());
    
    // Filter by task type specialization
    if (options?.taskType) {
      providers = providers.filter(([_, config]) =>
        config.specializations.includes(options.taskType) ||
        config.specializations.includes('general')
      );
    }
    
    // Filter by cost constraints
    if (options?.maxCost) {
      providers = providers.filter(([_, config]) =>
        config.costPerToken <= options.maxCost
      );
    }
    
    // Sort by priority (cost-optimized)
    providers.sort((a, b) => a[1].priority - b[1].priority);
    
    // For immediate urgency, use all providers in parallel
    if (options?.urgency === 'immediate') {
      return providers;
    }
    
    return providers;
  }
  
  private async attemptWithRetry(
    fn: () => Promise<any>,
    providerName: string,
    maxRetries = 3
  ): Promise<any> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on non-retryable errors
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.log(`Retrying ${providerName} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
  
  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
}

// Singleton instance
export const aiService = new UnifiedAIService();
```

#### 4.2 Add Metrics Collection
```typescript
// src/lib/ai/metrics.ts
export class MetricsCollector {
  private metrics = new Map<string, {
    requests: number;
    successes: number;
    failures: number;
    totalLatency: number;
    totalTokens: number;
    totalCost: number;
    errors: Map<string, number>;
  }>();
  
  recordSuccess(provider: string, result: any) {
    const metric = this.getOrCreateMetric(provider);
    metric.requests++;
    metric.successes++;
    metric.totalLatency += result.latency || 0;
    metric.totalTokens += result.tokens || 0;
    metric.totalCost += result.cost || 0;
  }
  
  recordFailure(provider: string, error: any) {
    const metric = this.getOrCreateMetric(provider);
    metric.requests++;
    metric.failures++;
    
    const errorCode = error.code || 'unknown';
    metric.errors.set(errorCode, (metric.errors.get(errorCode) || 0) + 1);
  }
  
  getProviderHealth(provider: string): number {
    const metric = this.metrics.get(provider);
    if (!metric || metric.requests === 0) return 1;
    
    return metric.successes / metric.requests;
  }
  
  private getOrCreateMetric(provider: string) {
    if (!this.metrics.has(provider)) {
      this.metrics.set(provider, {
        requests: 0,
        successes: 0,
        failures: 0,
        totalLatency: 0,
        totalTokens: 0,
        totalCost: 0,
        errors: new Map(),
      });
    }
    return this.metrics.get(provider)!;
  }
}
```

### Day 18-19: Context Management

#### 4.3 Implement Smart Context Management
```typescript
// src/lib/ai/context-manager.ts
import { encoding_for_model } from 'tiktoken';

export class ContextManager {
  private encoder = encoding_for_model('gpt-3.5-turbo');
  
  async prepareContext(
    messages: Message[],
    maxTokens: number = 4000
  ): Promise<Message[]> {
    const tokenCounts = messages.map(msg => ({
      message: msg,
      tokens: this.countTokens(msg.content),
    }));
    
    const totalTokens = tokenCounts.reduce((sum, item) => sum + item.tokens, 0);
    
    if (totalTokens <= maxTokens) {
      return messages;
    }
    
    // Smart truncation strategy
    return this.intelligentTruncate(tokenCounts, maxTokens);
  }
  
  private intelligentTruncate(
    tokenizedMessages: Array<{ message: Message; tokens: number }>,
    maxTokens: number
  ): Message[] {
    // Keep system message and latest user message
    const result: Message[] = [];
    let currentTokens = 0;
    
    // Always include system message if present
    const systemMsg = tokenizedMessages.find(m => m.message.role === 'system');
    if (systemMsg) {
      result.push(systemMsg.message);
      currentTokens += systemMsg.tokens;
    }
    
    // Always include latest user message
    const latestUser = [...tokenizedMessages]
      .reverse()
      .find(m => m.message.role === 'user');
    if (latestUser) {
      result.push(latestUser.message);
      currentTokens += latestUser.tokens;
    }
    
    // Add previous messages until we hit the limit
    const remaining = tokenizedMessages
      .filter(m => !result.includes(m.message))
      .reverse(); // Start from most recent
      
    for (const item of remaining) {
      if (currentTokens + item.tokens <= maxTokens) {
        result.splice(1, 0, item.message); // Insert after system message
        currentTokens += item.tokens;
      }
    }
    
    return result;
  }
  
  private countTokens(text: string): number {
    try {
      return this.encoder.encode(text).length;
    } catch {
      // Fallback to character estimation
      return Math.ceil(text.length / 4);
    }
  }
}
```

## Phase 5: Code Quality & Performance (Week 5)

### Day 20-21: Performance Optimization

#### 5.1 Add Caching Layer
```typescript
// src/lib/cache/redis-cache.ts
import { Redis } from '@upstash/redis';

export class CacheService {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      return data as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  async set(
    key: string,
    value: any,
    ttlSeconds?: number
  ): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, value);
      } else {
        await this.redis.set(key, value);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }
}

// Usage in AI service
export class CachedAIService extends UnifiedAIService {
  private cache = new CacheService();
  
  async complete(prompt: string, options?: CompletionOptions) {
    // Generate cache key
    const cacheKey = `ai:${this.hashPrompt(prompt)}:${JSON.stringify(options)}`;
    
    // Check cache
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) {
      console.log('Cache hit for AI response');
      return cached;
    }
    
    // Get fresh response
    const response = await super.complete(prompt, options);
    
    // Cache for 1 hour
    await this.cache.set(cacheKey, response, 3600);
    
    return response;
  }
  
  private hashPrompt(prompt: string): string {
    return crypto
      .createHash('sha256')
      .update(prompt)
      .digest('hex')
      .substring(0, 16);
  }
}
```

#### 5.2 Database Query Optimization
```sql
-- supabase/migrations/023_performance_indexes.sql

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON public.messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_user_building_created 
ON public.conversations(user_id, building_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_org_members_user_org_role 
ON public.organization_members(user_id, organization_id, role);

-- Partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_buildings_active 
ON public.buildings(organization_id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_active_onboarded 
ON public.user_profiles(email) 
WHERE onboarding_completed = true;

-- JSONB indexes for metadata queries
CREATE INDEX IF NOT EXISTS idx_buildings_metadata 
ON public.buildings USING gin(metadata);

CREATE INDEX IF NOT EXISTS idx_messages_metadata 
ON public.messages USING gin(metadata);

-- Analyze tables for query planner
ANALYZE public.user_profiles;
ANALYZE public.organizations;
ANALYZE public.buildings;
ANALYZE public.conversations;
ANALYZE public.messages;
```

### Day 22: Monitoring & Logging

#### 5.3 Implement Structured Logging
```typescript
// src/lib/logging/logger.ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'SYS:standard',
    },
  },
  redact: {
    paths: ['*.password', '*.apiKey', '*.token', '*.email'],
    censor: '[REDACTED]',
  },
});

// Request logger middleware
export function requestLogger(req: NextRequest) {
  const start = Date.now();
  
  return {
    log: (response: NextResponse) => {
      const duration = Date.now() - start;
      
      logger.info({
        method: req.method,
        url: req.url,
        status: response.status,
        duration,
        userAgent: req.headers.get('user-agent'),
      });
    },
  };
}

// Usage in API routes
export const GET = withErrorHandler(async (req) => {
  const reqLogger = requestLogger(req);
  
  try {
    // ... handle request
    const response = NextResponse.json({ data });
    reqLogger.log(response);
    return response;
  } catch (error) {
    logger.error({ error }, 'Request failed');
    throw error;
  }
});
```

## Phase 6: Long-term Architecture (Week 6)

### Day 23-24: Testing Infrastructure

#### 6.1 Create Test Suite
```typescript
// __tests__/api/auth.test.ts
import { createMocks } from 'node-mocks-http';
import { POST as signupHandler } from '@/app/api/auth/signup/route';

describe('Auth API', () => {
  describe('POST /api/auth/signup', () => {
    it('should create new user with valid data', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'securepassword123',
          full_name: 'Test User',
          company_name: 'Test Company',
        },
      });
      
      await signupHandler(req);
      
      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.user).toBeDefined();
      expect(data.session).toBeDefined();
    });
    
    it('should reject invalid email', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'invalid-email',
          password: 'securepassword123',
        },
      });
      
      await signupHandler(req);
      
      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBeDefined();
    });
  });
});
```

#### 6.2 CI/CD Pipeline
```yaml
# .github/workflows/test-and-deploy.yml
name: Test and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm test
      
      - name: Run security audit
        run: npm audit --audit-level=high
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Day 25: Documentation

#### 6.3 Create API Documentation
```typescript
// src/app/api/docs/route.ts
import { NextResponse } from 'next/server';

const apiDocs = {
  openapi: '3.0.0',
  info: {
    title: 'blipee OS API',
    version: '1.0.0',
    description: 'Conversational AI platform for sustainability',
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
  ],
  paths: {
    '/api/auth/signup': {
      post: {
        summary: 'Create new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  full_name: { type: 'string' },
                  company_name: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'User created successfully',
          },
          400: {
            description: 'Invalid input data',
          },
        },
      },
    },
    // ... more endpoints
  },
};

export async function GET() {
  return NextResponse.json(apiDocs);
}
```

## Implementation Schedule

### Week 1: Critical Fixes
- Mon-Tue: Auth system stabilization
- Wed-Thu: Security vulnerabilities
- Fri: Security headers & CORS

### Week 2: API Improvements
- Mon-Tue: Error handling & rate limiting
- Wed-Thu: Input validation
- Fri: Environment variables

### Week 3: Database Cleanup
- Mon-Tue: Migration consolidation
- Wed-Fri: Data integrity validation

### Week 4: AI Service
- Mon-Tue: Unified service architecture
- Wed-Thu: Context management
- Fri: Testing & optimization

### Week 5: Quality & Performance
- Mon-Tue: Caching implementation
- Wed: Query optimization
- Thu-Fri: Monitoring setup

### Week 6: Long-term Items
- Mon-Tue: Test suite
- Wed: CI/CD pipeline
- Thu-Fri: Documentation & cleanup

## Success Metrics

1. **Security**
   - 0 critical vulnerabilities
   - All endpoints authenticated
   - Rate limiting active

2. **Performance**
   - API response time < 200ms (p95)
   - AI response time < 2s (p95)
   - 99.9% uptime

3. **Quality**
   - 0 TypeScript errors
   - 90%+ test coverage
   - All migrations consolidated

4. **User Experience**
   - Successful signup rate > 95%
   - No data integrity issues
   - Clear error messages

## Risk Mitigation

1. **Rollback Plan**: Keep database backups before each migration
2. **Feature Flags**: Implement for major changes
3. **Staging Environment**: Test all changes thoroughly
4. **Monitoring**: Set up alerts for errors and performance

## Next Steps

1. Review this plan with the team
2. Set up project tracking (GitHub Projects/Jira)
3. Create feature branches for each phase
4. Begin with Phase 1 immediately

This comprehensive plan addresses all identified issues while maintaining system stability throughout the implementation process.