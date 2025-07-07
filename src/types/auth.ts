// Authentication and Authorization Types

export enum UserRole {
  // Organization Level
  SUBSCRIPTION_OWNER = 'subscription_owner',
  ORGANIZATION_ADMIN = 'organization_admin',
  
  // Building Level
  SITE_MANAGER = 'site_manager',
  FACILITY_MANAGER = 'facility_manager',
  
  // Operational Level
  TECHNICIAN = 'technician',
  GROUP_MANAGER = 'group_manager',
  
  // Basic Access
  TENANT = 'tenant',
  GUEST = 'guest'
}

export enum SubscriptionTier {
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise'
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired'
}

export interface Organization {
  id: string
  name: string
  slug: string
  subscription_tier: SubscriptionTier
  subscription_status: string
  settings: Record<string, any>
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  created_by: string
}

export interface Building {
  id: string
  organization_id: string
  name: string
  slug: string
  address_line1?: string
  address_line2?: string
  city?: string
  state_province?: string
  postal_code?: string
  country: string
  latitude?: number
  longitude?: number
  timezone: string
  metadata: BuildingMetadata
  systems_config: SystemsConfig
  baseline_data: BaselineData
  created_at: string
  updated_at: string
}

export interface BuildingMetadata {
  type?: 'office' | 'retail' | 'warehouse' | 'manufacturing' | 'mixed_use' | 'other'
  size?: 'small' | 'medium' | 'large' | 'enterprise'
  size_sqft?: number
  floors?: number
  year_built?: number
  last_renovation?: number
  occupancy_capacity?: number
  operating_hours?: {
    start: string
    end: string
    days: string[]
  }
}

export interface SystemsConfig {
  hvac?: {
    type: string[]
    age: string
    controls: string
    issues: string[]
  }
  lighting?: {
    type: Record<string, string>
    controls: string[]
    recent_upgrades?: string[]
  }
  energy?: {
    renewable: string[]
    monitoring: boolean
    sub_metering: boolean
  }
  other_systems?: string[]
}

export interface BaselineData {
  existing_upgrades: string[]
  energy_star_rating?: number
  current_issues: string[]
  priorities: string[]
  monthly_energy_cost?: number
  sustainability_goals?: string[]
}

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  phone?: string
  avatar_url?: string
  preferences: UserPreferences
  ai_personality_settings: AIPersonalitySettings
  onboarding_completed: boolean
  onboarding_data: Record<string, any>
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  notification_style?: 'proactive' | 'reactive' | 'summary' | 'minimal'
  communication_preference?: 'email' | 'sms' | 'in_app' | 'all'
  language?: string
  timezone?: string
  dashboard_layout?: Record<string, any>
}

export interface AIPersonalitySettings {
  tone?: 'formal' | 'professional' | 'friendly' | 'casual'
  detail_level?: 'executive' | 'detailed' | 'technical'
  proactivity?: 'high' | 'medium' | 'low'
  expertise_level?: 'beginner' | 'intermediate' | 'expert'
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: UserRole
  permissions: Permission[]
  is_owner: boolean
  invitation_status: InvitationStatus
  invited_by?: string
  invited_at?: string
  joined_at?: string
  created_at: string
  updated_at: string
}

export interface BuildingAssignment {
  id: string
  building_id: string
  user_id: string
  role: UserRole
  permissions: Permission[]
  areas: string[]
  created_at: string
  updated_at: string
  created_by: string
}

export interface Permission {
  resource: string
  action: string
  scope?: {
    organization_id?: string
    building_id?: string
    area_id?: string
    time_restriction?: {
      start: string
      end: string
    }
  }
}

export interface Session {
  user: UserProfile
  organizations: Organization[]
  current_organization: Organization
  current_building?: Building
  permissions: Permission[]
  expires_at: string
}

export interface AuthResponse {
  user: UserProfile
  session: Session
  access_token: string
  refresh_token: string
}

export interface SignUpMetadata {
  full_name: string
  company_name?: string
  role?: UserRole
  referral_source?: string
}