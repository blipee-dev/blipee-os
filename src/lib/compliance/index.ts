// Export all compliance functionality
export * from './types';
export * from './gdpr';
export * from './soc2';
export * from './service';

// Re-export singleton instances for convenience
export { gdprService, soc2Service, complianceService } from './service';