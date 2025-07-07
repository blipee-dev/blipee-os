export { subscriptionOwnerFlow } from "./subscription-owner";
export { siteManagerFlow } from "./site-manager";
export { technicianFlow } from "./technician";
export { groupManagerFlow } from "./group-manager";
export { tenantFlow } from "./tenant";

import { OnboardingFlow } from "@/types/onboarding";
import { UserRole } from "@/types/auth";
import { subscriptionOwnerFlow } from "./subscription-owner";
import { siteManagerFlow } from "./site-manager";
import { technicianFlow } from "./technician";
import { groupManagerFlow } from "./group-manager";
import { tenantFlow } from "./tenant";

export const onboardingFlows: Record<UserRole, OnboardingFlow> = {
  [UserRole.SUBSCRIPTION_OWNER]: subscriptionOwnerFlow,
  [UserRole.ORGANIZATION_ADMIN]: subscriptionOwnerFlow, // Same as subscription owner
  [UserRole.SITE_MANAGER]: siteManagerFlow,
  [UserRole.FACILITY_MANAGER]: siteManagerFlow, // Similar to site manager
  [UserRole.TECHNICIAN]: technicianFlow,
  [UserRole.GROUP_MANAGER]: groupManagerFlow,
  [UserRole.TENANT]: tenantFlow,
  [UserRole.GUEST]: tenantFlow, // Simplified version of tenant flow
};

export function getOnboardingFlow(role: UserRole): OnboardingFlow {
  return onboardingFlows[role] || tenantFlow;
}
