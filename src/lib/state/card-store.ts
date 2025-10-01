/**
 * Card Store - State management for Zero-Typing card system
 * Uses Zustand for efficient state management and subscriptions
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';

export interface Card {
  id: string;
  type: string;
  data: any;
  position?: number;
  isPinned?: boolean;
  isHidden?: boolean;
  lastInteracted?: Date;
}

export interface PredictedCard {
  cardId: string;
  score: number;
  reason: string;
  expiresAt: Date;
}

export interface CardState {
  // Card collections
  cards: Map<string, Card>;
  activeCards: string[];
  pinnedCards: string[];
  hiddenCards: string[];

  // Predictions
  predictedCards: PredictedCard[];

  // UI state
  selectedCard: string | null;
  expandedCards: Set<string>;
  loadingCards: Set<string>;

  // Card actions
  addCard: (card: Card) => void;
  removeCard: (cardId: string) => void;
  updateCard: (cardId: string, data: Partial<Card>) => void;

  // Selection actions
  selectCard: (cardId: string | null) => void;
  expandCard: (cardId: string) => void;
  collapseCard: (cardId: string) => void;
  toggleExpand: (cardId: string) => void;

  // Pin actions
  pinCard: (cardId: string) => void;
  unpinCard: (cardId: string) => void;
  togglePin: (cardId: string) => void;

  // Hide actions
  hideCard: (cardId: string) => void;
  showCard: (cardId: string) => void;
  toggleHide: (cardId: string) => void;

  // Reorder actions
  reorderCards: (cardIds: string[]) => void;
  moveCard: (cardId: string, newPosition: number) => void;

  // Prediction actions
  updatePredictions: (predictions: PredictedCard[]) => void;
  acceptPrediction: (cardId: string) => void;
  rejectPrediction: (cardId: string) => void;

  // Loading state
  setLoading: (cardId: string, loading: boolean) => void;

  // Bulk actions
  clearAll: () => void;
  resetToDefaults: () => void;

  // Getters
  getCard: (cardId: string) => Card | undefined;
  getVisibleCards: () => Card[];
  getPinnedCards: () => Card[];
  getCardsByType: (type: string) => Card[];
}

export const useCardStore = create<CardState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        cards: new Map(),
        activeCards: [],
        pinnedCards: [],
        hiddenCards: [],
        predictedCards: [],
        selectedCard: null,
        expandedCards: new Set(),
        loadingCards: new Set(),

        // Card management
        addCard: (card) => set((state) => {
          const cards = new Map(state.cards);
          cards.set(card.id, card);

          const activeCards = [...state.activeCards];
          if (!activeCards.includes(card.id)) {
            activeCards.push(card.id);
          }

          return { cards, activeCards };
        }),

        removeCard: (cardId) => set((state) => {
          const cards = new Map(state.cards);
          cards.delete(cardId);

          return {
            cards,
            activeCards: state.activeCards.filter(id => id !== cardId),
            pinnedCards: state.pinnedCards.filter(id => id !== cardId),
            hiddenCards: state.hiddenCards.filter(id => id !== cardId),
            selectedCard: state.selectedCard === cardId ? null : state.selectedCard,
            expandedCards: new Set([...state.expandedCards].filter(id => id !== cardId))
          };
        }),

        updateCard: (cardId, data) => set((state) => {
          const cards = new Map(state.cards);
          const existing = cards.get(cardId);

          if (existing) {
            cards.set(cardId, {
              ...existing,
              ...data,
              lastInteracted: new Date()
            });
          }

          return { cards };
        }),

        // Selection
        selectCard: (cardId) => set({ selectedCard: cardId }),

        expandCard: (cardId) => set((state) => {
          const expandedCards = new Set(state.expandedCards);
          expandedCards.add(cardId);
          return { expandedCards };
        }),

        collapseCard: (cardId) => set((state) => {
          const expandedCards = new Set(state.expandedCards);
          expandedCards.delete(cardId);
          return { expandedCards };
        }),

        toggleExpand: (cardId) => set((state) => {
          const expandedCards = new Set(state.expandedCards);
          if (expandedCards.has(cardId)) {
            expandedCards.delete(cardId);
          } else {
            expandedCards.add(cardId);
          }
          return { expandedCards };
        }),

        // Pinning
        pinCard: (cardId) => set((state) => {
          const pinnedCards = [...state.pinnedCards];
          if (!pinnedCards.includes(cardId)) {
            pinnedCards.push(cardId);
          }

          const cards = new Map(state.cards);
          const card = cards.get(cardId);
          if (card) {
            cards.set(cardId, { ...card, isPinned: true });
          }

          return { pinnedCards, cards };
        }),

        unpinCard: (cardId) => set((state) => {
          const pinnedCards = state.pinnedCards.filter(id => id !== cardId);

          const cards = new Map(state.cards);
          const card = cards.get(cardId);
          if (card) {
            cards.set(cardId, { ...card, isPinned: false });
          }

          return { pinnedCards, cards };
        }),

        togglePin: (cardId) => {
          const state = get();
          if (state.pinnedCards.includes(cardId)) {
            state.unpinCard(cardId);
          } else {
            state.pinCard(cardId);
          }
        },

        // Hiding
        hideCard: (cardId) => set((state) => {
          const hiddenCards = [...state.hiddenCards];
          if (!hiddenCards.includes(cardId)) {
            hiddenCards.push(cardId);
          }

          const cards = new Map(state.cards);
          const card = cards.get(cardId);
          if (card) {
            cards.set(cardId, { ...card, isHidden: true });
          }

          return { hiddenCards, cards };
        }),

        showCard: (cardId) => set((state) => {
          const hiddenCards = state.hiddenCards.filter(id => id !== cardId);

          const cards = new Map(state.cards);
          const card = cards.get(cardId);
          if (card) {
            cards.set(cardId, { ...card, isHidden: false });
          }

          return { hiddenCards, cards };
        }),

        toggleHide: (cardId) => {
          const state = get();
          if (state.hiddenCards.includes(cardId)) {
            state.showCard(cardId);
          } else {
            state.hideCard(cardId);
          }
        },

        // Reordering
        reorderCards: (cardIds) => set({ activeCards: cardIds }),

        moveCard: (cardId, newPosition) => set((state) => {
          const activeCards = [...state.activeCards];
          const currentIndex = activeCards.indexOf(cardId);

          if (currentIndex !== -1) {
            activeCards.splice(currentIndex, 1);
            activeCards.splice(newPosition, 0, cardId);
          }

          const cards = new Map(state.cards);
          const card = cards.get(cardId);
          if (card) {
            cards.set(cardId, { ...card, position: newPosition });
          }

          return { activeCards, cards };
        }),

        // Predictions
        updatePredictions: (predictions) => set({ predictedCards: predictions }),

        acceptPrediction: (cardId) => set((state) => {
          const predictedCards = state.predictedCards.filter(p => p.cardId !== cardId);

          // Add the card to active cards if not already there
          const activeCards = [...state.activeCards];
          if (!activeCards.includes(cardId)) {
            activeCards.push(cardId);
          }

          return { predictedCards, activeCards };
        }),

        rejectPrediction: (cardId) => set((state) => ({
          predictedCards: state.predictedCards.filter(p => p.cardId !== cardId)
        })),

        // Loading state
        setLoading: (cardId, loading) => set((state) => {
          const loadingCards = new Set(state.loadingCards);
          if (loading) {
            loadingCards.add(cardId);
          } else {
            loadingCards.delete(cardId);
          }
          return { loadingCards };
        }),

        // Bulk actions
        clearAll: () => set({
          cards: new Map(),
          activeCards: [],
          pinnedCards: [],
          hiddenCards: [],
          predictedCards: [],
          selectedCard: null,
          expandedCards: new Set(),
          loadingCards: new Set()
        }),

        resetToDefaults: () => {
          // This would load default cards based on user role
          // For now, just clear everything
          get().clearAll();
        },

        // Getters
        getCard: (cardId) => {
          return get().cards.get(cardId);
        },

        getVisibleCards: () => {
          const state = get();
          return state.activeCards
            .filter(id => !state.hiddenCards.includes(id))
            .map(id => state.cards.get(id))
            .filter(Boolean) as Card[];
        },

        getPinnedCards: () => {
          const state = get();
          return state.pinnedCards
            .map(id => state.cards.get(id))
            .filter(Boolean) as Card[];
        },

        getCardsByType: (type) => {
          const state = get();
          return Array.from(state.cards.values())
            .filter(card => card.type === type);
        }
      }),
      {
        name: 'zero-typing-cards',
        partialize: (state) => ({
          pinnedCards: state.pinnedCards,
          hiddenCards: state.hiddenCards
        })
      }
    )
  )
);

// Middleware for analytics
if (typeof window !== 'undefined') {
  useCardStore.subscribe(
    (state) => state.selectedCard,
    (selectedCard, previousCard) => {
      if (selectedCard && selectedCard !== previousCard) {
        // Track card selection for analytics
        console.log('Card selected:', selectedCard);
      }
    }
  );

  // Preload predicted cards
  useCardStore.subscribe(
    (state) => state.predictedCards,
    (predictions) => {
      // Preload top 3 predictions
      predictions.slice(0, 3).forEach(prediction => {
        // This would trigger data preloading
        console.log('Preloading card:', prediction.cardId);
      });
    }
  );
}