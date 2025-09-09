// Types for organization creation invitations

export interface OrganizationCreationInvitation {
  id: string;
  email: string;
  token: string;
  organization_name?: string;
  sender_name?: string;
  sender_email?: string;
  custom_message?: string;
  suggested_org_data?: Record<string, any>;
  expires_at: string;
  used_at?: string;
  used_by?: string;
  terms_version: string;
  created_at: string;
}

export interface InvitationValidationResponse {
  valid: boolean;
  invitation?: {
    id: string;
    email: string;
    organization_name?: string;
    sender_name?: string;
    custom_message?: string;
    suggested_org_data?: Record<string, any>;
    expires_at: string;
    terms_version: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface OrganizationCreationData {
  name: string;
  slug: string;
  legal_name?: string;
  industry_primary: string;
  company_size: string;
  website?: string;
  headquarters_address: {
    street: string;
    city: string;
    postal_code?: string;
    country: string;
  };
  primary_contact_email: string;
  primary_contact_phone?: string;
  compliance_frameworks?: string[];
  net_zero_target_year?: number;
  baseline_year?: number;
}

export interface UserProfileData {
  first_name: string;
  last_name: string;
  phone?: string;
  job_title: string;
}

export interface CreateOrganizationFromInvitationRequest {
  token: string;
  organization_data: OrganizationCreationData;
  user_profile: UserProfileData;
}

export interface CreateOrganizationFromInvitationResponse {
  success: boolean;
  organization: {
    id: string;
    name: string;
    slug: string;
    setup_step: string;
    onboarding_completed: boolean;
    [key: string]: any;
  };
  message: string;
  next_steps: {
    current_step: string;
    progress: number;
    next_action: string;
  };
}

export interface CreateInvitationRequest {
  email: string;
  organization_name?: string;
  custom_message?: string;
  expires_in_days?: number;
  suggested_org_data?: Record<string, any>;
}

export interface CreateInvitationResponse {
  success: boolean;
  invitation: {
    id: string;
    email: string;
    organization_name?: string;
    sender_name: string;
    expires_at: string;
    invitation_url: string;
    created_at: string;
  };
  message: string;
}

export interface InvitationListResponse {
  invitations: Array<{
    id: string;
    email: string;
    organization_name?: string;
    sender_name?: string;
    custom_message?: string;
    expires_at: string;
    used_at?: string;
    used_by?: string;
    current_uses: number;
    max_uses: number;
    created_at: string;
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

// Form validation schemas (for frontend use)
export interface OrganizationFormErrors {
  name?: string;
  slug?: string;
  legal_name?: string;
  industry_primary?: string;
  company_size?: string;
  website?: string;
  headquarters_address?: {
    street?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  primary_contact_email?: string;
  primary_contact_phone?: string;
  compliance_frameworks?: string;
  net_zero_target_year?: string;
  baseline_year?: string;
}

export interface UserProfileFormErrors {
  first_name?: string;
  last_name?: string;
  phone?: string;
  job_title?: string;
}

// Constants
export const COMPANY_SIZE_OPTIONS = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-1000', label: '201-1000 employees' },
  { value: '1000+', label: '1000+ employees' }
];

export const INDUSTRY_OPTIONS = [
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Financial Services', label: 'Financial Services' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Energy', label: 'Energy' },
  { value: 'Transportation', label: 'Transportation' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Education', label: 'Education' },
  { value: 'Agriculture', label: 'Agriculture' },
  { value: 'Construction', label: 'Construction' },
  { value: 'Hospitality', label: 'Hospitality' },
  { value: 'Other', label: 'Other' }
];

export const COMPLIANCE_FRAMEWORK_OPTIONS = [
  { value: 'GRI', label: 'GRI Standards', description: 'Global Reporting Initiative standards' },
  { value: 'CDP', label: 'CDP Climate Disclosure', description: 'Carbon Disclosure Project' },
  { value: 'TCFD', label: 'TCFD Recommendations', description: 'Task Force on Climate-related Financial Disclosures' },
  { value: 'SBTi', label: 'Science-Based Targets', description: 'Science Based Targets initiative' },
  { value: 'ISO14001', label: 'ISO 14001', description: 'Environmental Management Systems' },
  { value: 'SASB', label: 'SASB Standards', description: 'Sustainability Accounting Standards Board' },
  { value: 'UN_Global_Compact', label: 'UN Global Compact', description: 'United Nations Global Compact' }
];

export const NET_ZERO_YEAR_OPTIONS = [
  { value: 2030, label: '2030' },
  { value: 2035, label: '2035' },
  { value: 2040, label: '2040' },
  { value: 2045, label: '2045' },
  { value: 2050, label: '2050' }
];

export const JOB_TITLE_OPTIONS = [
  { value: 'CEO', label: 'CEO' },
  { value: 'President', label: 'President' },
  { value: 'Founder', label: 'Founder' },
  { value: 'Sustainability Manager', label: 'Sustainability Manager' },
  { value: 'ESG Manager', label: 'ESG Manager' },
  { value: 'Environmental Manager', label: 'Environmental Manager' },
  { value: 'Operations Manager', label: 'Operations Manager' },
  { value: 'Facility Manager', label: 'Facility Manager' },
  { value: 'Energy Manager', label: 'Energy Manager' },
  { value: 'Compliance Manager', label: 'Compliance Manager' },
  { value: 'Other', label: 'Other' }
];

// Validation functions
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9-]+$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
}

export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

export function validateOrganizationData(data: Partial<OrganizationCreationData>): OrganizationFormErrors {
  const errors: OrganizationFormErrors = {};

  if (!data.name || data.name.length < 2) {
    errors.name = 'Organization name must be at least 2 characters';
  }

  if (!data.slug) {
    errors.slug = 'URL slug is required';
  } else if (!validateSlug(data.slug)) {
    errors.slug = 'Slug must be 3-50 characters, lowercase letters, numbers, and hyphens only';
  }

  if (!data.industry_primary) {
    errors.industry_primary = 'Primary industry is required';
  }

  if (!data.company_size) {
    errors.company_size = 'Company size is required';
  }

  if (data.website && !data.website.startsWith('http')) {
    errors.website = 'Website must start with http:// or https://';
  }

  if (!data.headquarters_address?.street) {
    errors.headquarters_address = { ...errors.headquarters_address, street: 'Street address is required' };
  }

  if (!data.headquarters_address?.city) {
    errors.headquarters_address = { ...errors.headquarters_address, city: 'City is required' };
  }

  if (!data.headquarters_address?.country) {
    errors.headquarters_address = { ...errors.headquarters_address, country: 'Country is required' };
  }

  if (!data.primary_contact_email || !validateEmail(data.primary_contact_email)) {
    errors.primary_contact_email = 'Valid email address is required';
  }

  if (data.net_zero_target_year && (data.net_zero_target_year < 2025 || data.net_zero_target_year > 2100)) {
    errors.net_zero_target_year = 'Net zero target year must be between 2025 and 2100';
  }

  if (data.baseline_year && (data.baseline_year < 2000 || data.baseline_year > new Date().getFullYear())) {
    errors.baseline_year = 'Baseline year must be between 2000 and current year';
  }

  return errors;
}

export function validateUserProfile(data: Partial<UserProfileData>): UserProfileFormErrors {
  const errors: UserProfileFormErrors = {};

  if (!data.first_name || data.first_name.length < 1) {
    errors.first_name = 'First name is required';
  }

  if (!data.last_name || data.last_name.length < 1) {
    errors.last_name = 'Last name is required';
  }

  if (!data.job_title) {
    errors.job_title = 'Job title is required';
  }

  if (data.phone && !/^\+?[\d\s\-\(\)]+$/.test(data.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  return errors;
}