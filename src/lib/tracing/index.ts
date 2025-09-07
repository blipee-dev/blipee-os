/**
 * Centralized Tracing Module
 * Phase 4, Task 4.2: Export all tracing functionality
 */

// Core tracer
export * from './tracer';
export { tracer, createTracer, Trace, traceAsync } from './tracer';

// Propagation
export * from './propagation';

// Specialized tracing
export * from './ai-tracing';
export * from './database-tracing';
export * from './http-tracing';

// Instrumentation (not exported by default, must be explicitly imported)
// import { initializeInstrumentation } from '@/lib/tracing/instrumentation';

/**
 * Quick start functions for common tracing scenarios
 */
export { traceAIChatCompletion, traceAIEmbedding, traceSemanticCache, traceAIQueue } from './ai-tracing';
export { traceDatabaseQuery, traceDatabaseTransaction, tracePrismaOperation } from './database-tracing';
export { traceIncomingRequest, traceOutgoingRequest, traceFetch, createTracedFetch } from './http-tracing';