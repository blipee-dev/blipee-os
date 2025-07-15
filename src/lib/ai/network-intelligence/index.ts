// Network Intelligence Module Exports
// This module provides supply chain network analysis, peer intelligence, and collaborative features

// Core Network Engine
export { NetworkGraphEngine } from './graph-engine';
export { PrivacyPreservingNetwork } from './privacy-layer';
export { PeerBenchmarkingEngine } from './peer-benchmarks';

// Supplier Network
export { SupplierNetwork } from './supplier-network';
export { SupplierDiscoveryEngine } from './supplier-discovery';

// Data Marketplace
export { ESGDataMarketplace } from './data-marketplace';

// Consortium Management
export { IndustryConsortium } from './consortiums';

// Network Analytics
export { NetworkAnalytics } from './analytics';
export { NetworkOrchestrator } from './orchestrator';

// Types and Interfaces
export * from './types';

// Utility Functions
export { initializeNetworkIntelligence } from './utils';

// AI Integration
export { NetworkIntelligenceService, networkIntelligence } from './ai-integration';
export type { NetworkIntelligenceContext, SupplyChainRisk, PeerBenchmark, NetworkMetrics, MarketplaceOpportunity } from './ai-integration';