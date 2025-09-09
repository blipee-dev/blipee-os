/**
 * Common type definitions to replace 'any' types
 */

// Error types
export interface ErrorWithCode extends Error {
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Event types
export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

// Generic metadata type
export type Metadata = Record<string, unknown>;

// Generic payload type
export type Payload = Record<string, unknown>;

// Table/Chart data types
export interface TableRow {
  [key: string]: string | number | boolean | null;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  [key: string]: unknown;
}

// Form/Input types
export interface FormData {
  [key: string]: string | number | boolean | null | undefined;
}

// Webhook/Event types
export interface WebhookEvent {
  id: string;
  type: string;
  timestamp: string;
  payload: Payload;
  [key: string]: unknown;
}

// Query/Database types
export interface QueryResult {
  rows: TableRow[];
  rowCount: number;
  fields?: string[];
}

// Test/Mock types
export interface MockData {
  [key: string]: unknown;
}

// Configuration types
export interface Config {
  [key: string]: string | number | boolean | Config;
}

// Analytics types
export interface AnalyticsDataPoint {
  timestamp: string;
  metric: string;
  value: number;
  dimensions?: Record<string, string>;
  metadata?: Metadata;
}

// Organization/Building types
export interface Address {
  street: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}