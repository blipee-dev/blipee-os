/**
 * Shared types for web automation with Puppeteer MCP
 * Supports utility bill automation, regulatory scraping, carbon markets, etc.
 */

export interface ScraperConfig {
  organizationId: string;
  userId: string;
  retryAttempts?: number;
  timeout?: number;
  headless?: boolean;
}

export interface ScraperResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
  source: string;
  screenshotUrl?: string; // For audit trails
}

// Feature 1: Utility Bill Automation
export interface UtilityCredentials {
  provider: 'pge' | 'con-edison' | 'duke-energy' | 'generic';
  username: string;
  password: string; // Encrypted in DB
  accountNumber?: string;
}

export interface UtilityBillData {
  provider: string;
  accountNumber: string;
  billingPeriod: {
    start: Date;
    end: Date;
  };
  energyUsage: {
    electricity: number; // kWh
    gas?: number; // therms
  };
  cost: number;
  carbonEmissions?: number; // kg CO2e (calculated)
  rawBillUrl?: string; // PDF download
}

// Feature 2: Regulatory Intelligence
export interface RegulatoryUpdate {
  source: 'epa' | 'eu-taxonomy' | 'sec' | 'state-level';
  title: string;
  description: string;
  effectiveDate?: Date;
  url: string;
  relevantIndustries: string[]; // GRI sector codes
  complianceDeadline?: Date;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

// Feature 3: Carbon Market Prices
export interface CarbonMarketData {
  marketType: 'carbon-credit' | 'rec' | 'offset';
  exchange: string;
  price: number; // USD per ton CO2e or MWh
  priceChange24h: number; // Percentage
  volume: number;
  timestamp: Date;
}

// Feature 4: Supplier Verification
export interface SupplierSustainabilityData {
  supplierName: string;
  website: string;
  certifications: {
    type: 'b-corp' | 'iso-14001' | 'leed' | 'carbon-neutral';
    verified: boolean;
    expiryDate?: Date;
    proofUrl?: string; // Screenshot
  }[];
  sustainabilityReport?: {
    year: number;
    url: string;
    scope1: number;
    scope2: number;
    scope3?: number;
  };
  esgScore?: number;
}

// Feature 5: Competitor Benchmarking
export interface CompetitorESGData {
  companyName: string;
  industry: string;
  website: string;
  lastUpdated: Date;
  metrics: {
    carbonNeutralCommitment?: string;
    renewableEnergyTarget?: string;
    wasteReduction?: string;
    diversityMetrics?: string;
  };
  publicClaims: string[];
  reportsPublished: {
    year: number;
    url: string;
  }[];
}

// Database storage
export interface AutomationJob {
  id: string;
  organizationId: string;
  jobType: 'utility-bill' | 'regulatory' | 'carbon-market' | 'supplier-verification' | 'competitor-intelligence';
  status: 'pending' | 'running' | 'completed' | 'failed';
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: ScraperResult;
  error?: string;
}

export interface AutomationSchedule {
  id: string;
  organizationId: string;
  jobType: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextRun: Date;
  enabled: boolean;
  config: Record<string, any>;
}
