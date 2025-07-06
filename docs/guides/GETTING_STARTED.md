# Getting Started with Blipee OS Development

## Prerequisites

- Node.js 20+ and npm
- GitHub account
- Supabase account
- OpenAI API key (or Anthropic/DeepSeek)
- Basic knowledge of React and TypeScript

## Quick Start (5 minutes)

### 1. Clone and Open in Codespaces

```bash
# Fork the repository first, then:
gh repo clone your-username/blipee-os

# Open in GitHub Codespaces (recommended)
gh codespace create --repo your-username/blipee-os
```

### 2. Environment Setup

Create `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# AI (choose one or more)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
DEEPSEEK_API_KEY=your-deepseek-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Install and Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Project Setup from Scratch

### 1. Create Next.js Project

```bash
npx create-next-app@latest blipee-os --typescript --tailwind --app --src-dir
cd blipee-os
```

### 2. Install Core Dependencies

```bash
# Core packages
npm install @supabase/supabase-js openai @anthropic-ai/sdk

# UI components
npm install @radix-ui/react-dialog @radix-ui/react-tabs lucide-react framer-motion

# Data visualization
npm install recharts three @react-three/fiber

# Utilities
npm install zod react-markdown remark-gfm
```

### 3. Set Up Supabase

1. Create new project at [supabase.com](https://supabase.com)
2. Run the SQL from `docs/technical/TECHNICAL_SPEC.md` to create tables
3. Enable Row Level Security
4. Copy your project URL and keys

### 4. Create Basic Structure

```bash
# Create directories
mkdir -p src/app/api/ai
mkdir -p src/components/blipee-os
mkdir -p src/lib/{ai,supabase,building}
mkdir -p src/hooks
mkdir -p src/types
```

## Core Implementation Guide

### 1. Main Page (src/app/page.tsx)

```typescript
import { ConversationInterface } from '@/components/blipee-os/ConversationInterface'

export default function Home() {
  return (
    <main className="h-screen bg-black">
      <ConversationInterface />
    </main>
  )
}
```

### 2. Conversation Interface Component

```typescript
// src/components/blipee-os/ConversationInterface.tsx
'use client'

import { useState } from 'react'
import { MessageBubble } from './MessageBubble'
import { InputArea } from './InputArea'
import { DynamicUIRenderer } from './DynamicUIRenderer'

export function ConversationInterface() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async (message: string) => {
    // Add user message
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: message 
    }])
    
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      })
      
      const data = await response.json()
      
      // Add AI response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        components: data.components
      }])
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}
        {isLoading && <div>Blipee is thinking...</div>}
      </div>
      <InputArea onSend={sendMessage} />
    </div>
  )
}
```

### 3. AI Chat Endpoint

```typescript
// src/app/api/ai/chat/route.ts
import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  const { message } = await request.json()

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are Blipee, an AI assistant for building management.
                  You can analyze data, control devices, and generate visualizations.`
      },
      { role: 'user', content: message }
    ]
  })

  const aiResponse = completion.choices[0].message.content

  // Parse response for components (simplified)
  const response = {
    message: aiResponse,
    components: [], // Parse from AI response
    suggestions: []
  }

  return NextResponse.json(response)
}
```

### 4. Supabase Client Setup

```typescript
// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

## Development Workflow

### 1. Local Development

```bash
# Start dev server
npm run dev

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

### 2. Using Mock Data

For development without real building data:

```typescript
// src/lib/building/mock-data.ts
export const mockBuilding = {
  id: 'mock-building-1',
  name: 'Demo Office Tower',
  devices: [
    {
      id: 'hvac-1',
      type: 'hvac',
      name: 'Main HVAC',
      state: { temperature: 22.5, mode: 'cooling' }
    }
    // ... more devices
  ]
}
```

### 3. Testing Conversations

```typescript
// Example test conversations
const testQueries = [
  "Show me current energy usage",
  "What's the temperature in the lobby?",
  "Turn off all lights on floor 3",
  "Create a report for last month",
  "Is everything running normally?"
]
```

## Common Tasks

### Adding a New UI Component Type

1. Create component in `src/components/generated/`
2. Add type to `UIComponent` interface
3. Update `DynamicUIRenderer` to handle new type
4. Add prompt examples for AI to generate it

### Integrating a New AI Provider

1. Create provider in `src/lib/ai/providers/`
2. Implement common interface
3. Add to provider rotation logic
4. Test with sample prompts

### Adding Real-time Updates

```typescript
// Subscribe to device updates
useEffect(() => {
  const subscription = supabase
    .channel('devices')
    .on('postgres_changes', 
      { event: 'UPDATE', schema: 'public', table: 'devices' },
      (payload) => {
        console.log('Device updated:', payload)
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}, [])
```

## Debugging Tips

### 1. Enable Debug Logging

```typescript
// src/lib/utils/logger.ts
export const log = {
  debug: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Blipee]', ...args)
    }
  }
}
```

### 2. AI Response Inspection

```typescript
// Log full AI responses
if (process.env.DEBUG_AI) {
  console.log('AI Response:', JSON.stringify(response, null, 2))
}
```

### 3. Component Rendering

Use React DevTools to inspect generated components and their props.

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add OPENAI_API_KEY
```

### Production Checklist

- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Rate limiting configured
- [ ] Error tracking enabled
- [ ] Analytics configured
- [ ] Security headers set

## Getting Help

### Resources

- [Discord Community](#) - Coming soon
- [GitHub Issues](https://github.com/your-username/blipee-os/issues)
- [Documentation](../README.md)

### Common Issues

**"Cannot connect to Supabase"**
- Check your environment variables
- Ensure your IP is allowed in Supabase settings

**"AI responses are slow"**
- Enable streaming responses
- Consider using DeepSeek for faster responses

**"Components not rendering"**
- Check console for errors
- Verify component props match expected format

## Next Steps

1. Complete the [Tutorial](./TUTORIAL.md) to build your first feature
2. Read the [Architecture Guide](../architecture/OVERVIEW.md)
3. Explore [Example Conversations](./CONVERSATION_EXAMPLES.md)
4. Join our community and share what you build!

---

Remember: We're not building another dashboard. We're revolutionizing how humans interact with buildings. Keep it simple, make it conversational, and focus on user delight!