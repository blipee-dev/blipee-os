/**
 * Feature Flags for Safe Deployment
 *
 * Allows features to be deployed to production but disabled by default.
 * Enables gradual rollout and instant rollback.
 */

// Environment-based feature flags
export const FEATURE_FLAGS = {
  // Vercel AI SDK Integration
  ENABLE_VERCEL_AI: process.env.NEXT_PUBLIC_ENABLE_VERCEL_AI === 'true',

  // Rollout percentage (0-100)
  VERCEL_AI_ROLLOUT_PERCENTAGE: parseInt(
    process.env.NEXT_PUBLIC_VERCEL_AI_ROLLOUT_PERCENTAGE || '0',
    10
  ),

  // Organizations to enable for (beta testing)
  VERCEL_AI_BETA_ORGS: process.env.NEXT_PUBLIC_VERCEL_AI_BETA_ORGS?.split(',').filter(Boolean) || [],
};

/**
 * Check if Vercel AI should be enabled for this user/organization
 *
 * Priority:
 * 1. Feature completely disabled → return false
 * 2. Organization is in beta list → return true
 * 3. Gradual rollout based on user ID hash → return based on percentage
 */
export function shouldUseVercelAI(
  organizationId?: string,
  userId?: string
): boolean {
  // Feature completely disabled
  if (!FEATURE_FLAGS.ENABLE_VERCEL_AI) {
    return false;
  }

  // Beta organizations get early access
  if (organizationId && FEATURE_FLAGS.VERCEL_AI_BETA_ORGS.includes(organizationId)) {
    console.log(`🎯 Vercel AI enabled for beta org: ${organizationId}`);
    return true;
  }

  // Gradual rollout based on user ID
  if (userId && FEATURE_FLAGS.VERCEL_AI_ROLLOUT_PERCENTAGE > 0) {
    const hash = hashString(userId);
    const percentage = hash % 100;
    const enabled = percentage < FEATURE_FLAGS.VERCEL_AI_ROLLOUT_PERCENTAGE;

    if (enabled) {
      console.log(`🎯 Vercel AI enabled for user (rollout: ${FEATURE_FLAGS.VERCEL_AI_ROLLOUT_PERCENTAGE}%)`);
    }

    return enabled;
  }

  // If no user ID but rollout is 100%, enable
  if (FEATURE_FLAGS.VERCEL_AI_ROLLOUT_PERCENTAGE === 100) {
    return true;
  }

  return false;
}

/**
 * Simple hash function for consistent user rollout
 * Same user always gets same result (consistent experience)
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get feature flag status for monitoring
 */
export function getFeatureFlagStatus() {
  return {
    vercelAI: {
      enabled: FEATURE_FLAGS.ENABLE_VERCEL_AI,
      rolloutPercentage: FEATURE_FLAGS.VERCEL_AI_ROLLOUT_PERCENTAGE,
      betaOrgs: FEATURE_FLAGS.VERCEL_AI_BETA_ORGS.length,
      environment: process.env.NODE_ENV,
    },
  };
}
