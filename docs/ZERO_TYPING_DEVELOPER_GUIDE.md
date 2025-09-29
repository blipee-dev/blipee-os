# Zero-Typing System - Developer Implementation Guide

## Quick Start Guide for Developers

### Prerequisites
- Node.js 18+
- PostgreSQL (via Supabase)
- Redis
- Basic understanding of React/Next.js
- Familiarity with TypeScript

---

## Day 1: Get Started in 1 Hour

### 1. Clone and Setup (10 minutes)
```bash
# Clone the repository
git clone https://github.com/blipee/blipee-os.git
cd blipee-os

# Install dependencies
npm install

# Additional packages for Zero-Typing
npm install framer-motion zustand @tanstack/react-query \
  react-swipeable @tensorflow/tfjs socket.io-client
```

### 2. Environment Configuration (5 minutes)
```bash
# Copy environment template
cp .env.example .env.local

# Add Zero-Typing specific variables
echo "REDIS_URL=redis://localhost:6379" >> .env.local
echo "WEBSOCKET_URL=ws://localhost:3001" >> .env.local
echo "ML_MODEL_PATH=/models" >> .env.local
```

### 3. Database Setup (10 minutes)
```sql
-- Run in Supabase SQL editor
-- Create Zero-Typing tables

CREATE TABLE card_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_type VARCHAR(50) NOT NULL,
  agent_id VARCHAR(100),
  title VARCHAR(255) NOT NULL,
  layout_config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_card_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  card_id UUID REFERENCES card_definitions(id),
  position INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false
);

CREATE TABLE card_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  card_id UUID REFERENCES card_definitions(id),
  action_type VARCHAR(50),
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### 4. Create Your First Card (15 minutes)
```tsx
// src/components/cards/HelloCard.tsx
import { motion } from 'framer-motion';

export function HelloCard({ data, onTap }) {
  return (
    <motion.div
      className="p-6 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
    >
      <h3 className="text-xl font-bold mb-2">Hello Zero-Typing!</h3>
      <p className="text-gray-400">{data.message}</p>
      <div className="mt-4 flex gap-2">
        <button className="px-4 py-2 bg-blue-500/20 rounded-lg">
          Action 1
        </button>
        <button className="px-4 py-2 bg-green-500/20 rounded-lg">
          Action 2
        </button>
      </div>
    </motion.div>
  );
}
```

### 5. Create the Home Screen (15 minutes)
```tsx
// src/app/zero-typing/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { HelloCard } from '@/components/cards/HelloCard';

export default function ZeroTypingHome() {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    // Load cards
    loadCards();
  }, []);

  const loadCards = async () => {
    // For now, use mock data
    setCards([
      { id: '1', type: 'hello', data: { message: 'Tap me!' } },
      { id: '2', type: 'metric', data: { value: 125, unit: 'tCO2e' } },
      { id: '3', type: 'alert', data: { message: 'High emissions detected' } }
    ]);
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <h1 className="text-3xl font-bold mb-8">Zero-Typing Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(card => (
          <HelloCard
            key={card.id}
            data={card.data}
            onTap={() => console.log('Tapped:', card.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

### 6. Run and Test (5 minutes)
```bash
# Start the development server
npm run dev

# Open in browser
open http://localhost:3000/zero-typing

# You should see your cards - try tapping them!
```

---

## Day 2-3: Core Card System

### 1. Card Registry System
```typescript
// src/lib/cards/card-registry.ts

export enum CardType {
  METRIC = 'metric',
  CHART = 'chart',
  ALERT = 'alert',
  AGENT = 'agent',
  ACTION = 'action'
}

export interface CardDefinition {
  id: string;
  type: CardType;
  component: React.ComponentType<any>;
  defaultLayout: CardLayout;
  dataFetcher?: () => Promise<any>;
}

class CardRegistry {
  private cards = new Map<string, CardDefinition>();

  register(card: CardDefinition) {
    this.cards.set(card.id, card);
  }

  get(id: string): CardDefinition {
    return this.cards.get(id);
  }

  getByType(type: CardType): CardDefinition[] {
    return Array.from(this.cards.values())
      .filter(card => card.type === type);
  }
}

export const cardRegistry = new CardRegistry();
```

### 2. Dynamic Card Renderer
```tsx
// src/components/cards/DynamicCard.tsx

import { cardRegistry } from '@/lib/cards/card-registry';

export function DynamicCard({ cardId, data }) {
  const definition = cardRegistry.get(cardId);

  if (!definition) {
    return <div>Unknown card type</div>;
  }

  const Component = definition.component;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Component {...data} />
    </motion.div>
  );
}
```

### 3. Card State Management
```typescript
// src/lib/state/card-store.ts

import { create } from 'zustand';

interface CardStore {
  cards: Map<string, any>;
  activeCards: string[];
  selectedCard: string | null;

  addCard: (id: string, data: any) => void;
  updateCard: (id: string, data: any) => void;
  removeCard: (id: string) => void;
  selectCard: (id: string) => void;
  reorderCards: (ids: string[]) => void;
}

export const useCardStore = create<CardStore>((set, get) => ({
  cards: new Map(),
  activeCards: [],
  selectedCard: null,

  addCard: (id, data) => set(state => {
    const cards = new Map(state.cards);
    cards.set(id, data);
    return { cards, activeCards: [...state.activeCards, id] };
  }),

  updateCard: (id, data) => set(state => {
    const cards = new Map(state.cards);
    cards.set(id, { ...cards.get(id), ...data });
    return { cards };
  }),

  removeCard: (id) => set(state => ({
    cards: new Map(Array.from(state.cards).filter(([k]) => k !== id)),
    activeCards: state.activeCards.filter(c => c !== id)
  })),

  selectCard: (id) => set({ selectedCard: id }),

  reorderCards: (ids) => set({ activeCards: ids })
}));
```

---

## Day 4-5: AI Integration

### 1. Connect to AI Agents
```typescript
// src/lib/agents/agent-connector.ts

import { ESGChiefOfStaff } from '@/lib/ai/agents/ESGChiefOfStaff';
import { CarbonHunter } from '@/lib/ai/agents/CarbonHunter';

export class AgentConnector {
  private agents = {
    'esg-chief': new ESGChiefOfStaff(),
    'carbon-hunter': new CarbonHunter(),
    // ... other agents
  };

  async getCardData(agentId: string, cardId: string) {
    const agent = this.agents[agentId];
    if (!agent) return null;

    return await agent.getCardData(cardId);
  }

  async executeAction(agentId: string, action: string, params: any) {
    const agent = this.agents[agentId];
    if (!agent) return null;

    return await agent.execute(action, params);
  }

  subscribeToUpdates(agentId: string, callback: Function) {
    const agent = this.agents[agentId];
    if (!agent) return;

    agent.on('update', callback);
  }
}

export const agentConnector = new AgentConnector();
```

### 2. Create Agent Cards
```tsx
// src/components/cards/AgentCard.tsx

import { useEffect, useState } from 'react';
import { agentConnector } from '@/lib/agents/agent-connector';

export function AgentCard({ agentId, cardId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    // Subscribe to real-time updates
    const unsubscribe = agentConnector.subscribeToUpdates(
      agentId,
      (update) => setData(update)
    );

    return unsubscribe;
  }, [agentId, cardId]);

  const loadData = async () => {
    setLoading(true);
    const agentData = await agentConnector.getCardData(agentId, cardId);
    setData(agentData);
    setLoading(false);
  };

  const handleAction = async (action: string) => {
    const result = await agentConnector.executeAction(
      agentId,
      action,
      { cardId }
    );

    if (result.success) {
      loadData(); // Refresh
    }
  };

  if (loading) return <CardSkeleton />;

  return (
    <div className="agent-card">
      <h3>{data.title}</h3>
      <div className="metric">{data.value}</div>

      <div className="actions">
        {data.actions?.map(action => (
          <button
            key={action.id}
            onClick={() => handleAction(action.id)}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## Day 6-7: Predictive Engine

### 1. Basic Prediction System
```typescript
// src/lib/ai/basic-predictor.ts

export class BasicPredictor {
  private patterns: Map<string, Pattern> = new Map();

  async learnInteraction(userId: string, interaction: Interaction) {
    const key = `${userId}-${interaction.timeOfDay}-${interaction.dayOfWeek}`;

    if (!this.patterns.has(key)) {
      this.patterns.set(key, {
        cards: [],
        count: 0
      });
    }

    const pattern = this.patterns.get(key);
    pattern.cards.push(interaction.cardId);
    pattern.count++;
  }

  async predictNextCards(userId: string, context: Context): string[] {
    const key = `${userId}-${context.timeOfDay}-${context.dayOfWeek}`;
    const pattern = this.patterns.get(key);

    if (!pattern) return this.getDefaultCards();

    // Return most frequent cards for this context
    return this.getMostFrequent(pattern.cards, 5);
  }

  private getMostFrequent(cards: string[], limit: number): string[] {
    const frequency = new Map();

    cards.forEach(card => {
      frequency.set(card, (frequency.get(card) || 0) + 1);
    });

    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([card]) => card);
  }

  private getDefaultCards(): string[] {
    return ['emissions-card', 'alerts-card', 'goals-card'];
  }
}
```

### 2. Hook for Predictions
```typescript
// src/hooks/usePredictiveCards.ts

import { useEffect, useState } from 'react';
import { BasicPredictor } from '@/lib/ai/basic-predictor';

const predictor = new BasicPredictor();

export function usePredictiveCards() {
  const [predictedCards, setPredictedCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    const context = {
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      // ... other context
    };

    const predictions = await predictor.predictNextCards(
      'current-user-id',
      context
    );

    setPredictedCards(predictions);
    setLoading(false);
  };

  const recordInteraction = async (cardId: string) => {
    await predictor.learnInteraction('current-user-id', {
      cardId,
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      timestamp: new Date()
    });
  };

  return { predictedCards, loading, recordInteraction };
}
```

---

## Testing Your Implementation

### 1. Component Tests
```tsx
// src/tests/cards.test.tsx

import { render, fireEvent } from '@testing-library/react';
import { HelloCard } from '@/components/cards/HelloCard';

describe('HelloCard', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <HelloCard data={{ message: 'Test' }} />
    );

    expect(getByText('Test')).toBeInTheDocument();
  });

  it('handles tap events', () => {
    const onTap = jest.fn();
    const { container } = render(
      <HelloCard data={{ message: 'Test' }} onTap={onTap} />
    );

    fireEvent.click(container.firstChild);
    expect(onTap).toHaveBeenCalled();
  });
});
```

### 2. Integration Tests
```typescript
// src/tests/integration.test.ts

import { agentConnector } from '@/lib/agents/agent-connector';

describe('Agent Integration', () => {
  it('fetches card data from agents', async () => {
    const data = await agentConnector.getCardData(
      'carbon-hunter',
      'emissions-card'
    );

    expect(data).toHaveProperty('value');
    expect(data).toHaveProperty('actions');
  });

  it('executes agent actions', async () => {
    const result = await agentConnector.executeAction(
      'carbon-hunter',
      'reduce-emissions',
      { target: 10 }
    );

    expect(result.success).toBe(true);
  });
});
```

---

## Common Patterns & Best Practices

### 1. Card Loading States
```tsx
// Always show loading states
{loading ? (
  <CardSkeleton />
) : error ? (
  <ErrorCard message={error} />
) : (
  <DataCard data={data} />
)}
```

### 2. Optimistic Updates
```tsx
// Update UI immediately, sync later
const handleAction = async (action) => {
  // Optimistic update
  setData(optimisticData);

  try {
    const result = await executeAction(action);
    setData(result);
  } catch (error) {
    // Revert on error
    setData(previousData);
  }
};
```

### 3. Card Animations
```tsx
// Use Framer Motion for smooth transitions
<motion.div
  layout
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.9 }}
  transition={{ duration: 0.2 }}
>
  {/* Card content */}
</motion.div>
```

### 4. Gesture Handling
```tsx
// Implement swipe actions
const handlers = useSwipeable({
  onSwipedLeft: () => dismissCard(),
  onSwipedRight: () => pinCard(),
  delta: 10
});

return <div {...handlers}>{/* Card */}</div>;
```

---

## Performance Tips

### 1. Lazy Load Cards
```tsx
const CardComponent = lazy(() =>
  import(`@/components/cards/${cardType}`)
);
```

### 2. Virtualize Long Lists
```tsx
import { VirtualList } from '@tanstack/react-virtual';

// Only render visible cards
<VirtualList
  items={cards}
  renderItem={({ item }) => <Card data={item} />}
/>
```

### 3. Cache Card Data
```typescript
// Use React Query for caching
const { data } = useQuery({
  queryKey: ['card', cardId],
  queryFn: () => fetchCardData(cardId),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### 4. Preload Predicted Cards
```typescript
// Preload likely next cards
predictedCards.forEach(cardId => {
  queryClient.prefetchQuery({
    queryKey: ['card', cardId],
    queryFn: () => fetchCardData(cardId)
  });
});
```

---

## Debugging Tools

### 1. Enable Debug Mode
```typescript
// In browser console
localStorage.setItem('DEBUG', 'zero-typing:*');
```

### 2. Card Inspector
```tsx
// Development-only card inspector
{process.env.NODE_ENV === 'development' && (
  <CardInspector card={card} />
)}
```

### 3. Performance Profiling
```bash
# Profile card rendering
npm run profile:cards

# Analyze bundle size
npm run analyze
```

---

## Resources & Help

### Documentation
- [API Reference](/docs/api)
- [Component Library](/docs/components)
- [Architecture Guide](/docs/architecture)

### Examples
- [Basic Cards](/examples/basic-cards)
- [Agent Integration](/examples/agents)
- [Custom Animations](/examples/animations)

### Support
- GitHub Issues: github.com/blipee/zero-typing/issues
- Discord: discord.gg/blipee
- Email: dev-support@blipee.com

---

## Next Steps

1. ✅ Complete Day 1 setup
2. ✅ Build your first custom card
3. ✅ Connect to an AI agent
4. ✅ Add predictions
5. ⏭️ Deploy to production

**Congratulations!** You've built a working Zero-Typing interface. Keep iterating and improving based on user feedback.

---

*Happy coding! 🚀*