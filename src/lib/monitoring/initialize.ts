import { telemetry } from './telemetry';
import { alerting } from './alerting';

/**
 * Initialize all monitoring services
 */
export async function initializeMonitoring(): Promise<void> {
  console.log('🚀 Initializing production monitoring...');

  try {
    // 1. Initialize OpenTelemetry
    await telemetry.initialize();

    // 2. Start alert monitoring
    alerting.startMonitoring(60); // Check every 60 seconds

    // 3. Configure alert channels if environment variables are set
    if (process.env.ALERT_EMAIL_DEFAULT) {
      console.log('📧 Email alerts configured');
    }

    if (process.env.SLACK_WEBHOOK_URL) {
      console.log('💬 Slack alerts configured');
    }

    if (process.env.PAGERDUTY_ROUTING_KEY) {
      console.log('📟 PagerDuty alerts configured');
    }

    // 4. Log monitoring endpoints
    console.log('\n📊 Monitoring endpoints available:');
    console.log('  Health: /api/health');
    console.log('  Ready: /api/health/ready');
    console.log('  Live: /api/health/live');
    console.log('  Metrics: /api/metrics');
    console.log('  Prometheus: http://localhost:9464/metrics');

    console.log('\n✅ Production monitoring initialized successfully');

  } catch (error) {
    console.error('❌ Failed to initialize monitoring:', error);
    // Don't throw - monitoring should not prevent app startup
  }
}

/**
 * Shutdown monitoring gracefully
 */
export async function shutdownMonitoring(): Promise<void> {
  console.log('🛑 Shutting down monitoring...');
  
  try {
    // Stop alerting
    alerting.stopMonitoring();
    
    // Shutdown telemetry
    await telemetry.shutdown();
    
    console.log('✅ Monitoring shut down successfully');
  } catch (error) {
    console.error('Error shutting down monitoring:', error);
  }
}

// Handle process termination
process.on('SIGTERM', async () => {
  await shutdownMonitoring();
});

process.on('SIGINT', async () => {
  await shutdownMonitoring();
  process.exit(0);
});

// Export for use in app initialization
export { telemetry, alerting } from './index';