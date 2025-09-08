/**
 * White-Label API
 * REST endpoints for white-label branding and multi-tenant management
 */

import { NextRequest, NextResponse } from 'next/server';
import { brandingManager } from '@/lib/enterprise/white-label/branding-manager';
import { tenantManager } from '@/lib/enterprise/white-label/tenant-manager';

export interface WhiteLabelRequest {
  action: 'get_branding' | 'create_branding' | 'update_branding' | 'activate_branding' | 'preview_branding' | 'export_branding' | 'import_branding' | 'get_tenant' | 'create_tenant' | 'update_tenant' | 'get_tenant_usage';
  brandingData?: {
    organizationId?: string;
    name?: string;
    presetId?: string;
    updates?: any;
    configData?: string; // For import
  };
  tenantData?: {
    name?: string;
    slug?: string;
    type?: 'trial' | 'starter' | 'professional' | 'enterprise';
    ownerId?: string;
    ownerEmail?: string;
    ownerName?: string;
    status?: 'active' | 'suspended' | 'cancelled' | 'pending';
    reason?: string;
  };
  configId?: string;
  tenantId?: string;
  tenantSlug?: string;
}

export interface WhiteLabelResponse {
  success: boolean;
  timestamp: string;
  action: string;
  data?: any;
  error?: string;
  metadata?: {
    processingTime?: number;
    brandingActive?: boolean;
    tenantActive?: boolean;
  };
}

/**
 * GET endpoint for white-label data
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'overview';
    const organizationId = searchParams.get('organizationId');
    const tenantSlug = searchParams.get('tenantSlug');
    
    switch (view) {
      case 'overview':
        return await handleOverview(startTime);
      
      case 'branding':
        return await handleGetBranding(organizationId, startTime);
      
      case 'presets':
        return await handleGetPresets(startTime);
      
      case 'tenants':
        return await handleGetTenants(startTime);
      
      case 'tenant':
        return await handleGetTenant(tenantSlug, startTime);
      
      default:
        return NextResponse.json(
          {
            success: false,
            timestamp: new Date().toISOString(),
            action: 'get',
            error: 'Invalid view parameter'
          } as WhiteLabelResponse,
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('White-label GET error:', error);
    
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'get',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime: Date.now() - startTime
        }
      } as WhiteLabelResponse,
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for white-label operations
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const body: WhiteLabelRequest = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'create_branding':
        return await handleCreateBranding(body, startTime);
      
      case 'update_branding':
        return await handleUpdateBranding(body, startTime);
      
      case 'activate_branding':
        return await handleActivateBranding(body, startTime);
      
      case 'preview_branding':
        return await handlePreviewBranding(body, startTime);
      
      case 'export_branding':
        return await handleExportBranding(body, startTime);
      
      case 'import_branding':
        return await handleImportBranding(body, startTime);
      
      case 'create_tenant':
        return await handleCreateTenant(body, startTime);
      
      case 'update_tenant':
        return await handleUpdateTenant(body, startTime);
      
      default:
        return NextResponse.json(
          {
            success: false,
            timestamp: new Date().toISOString(),
            action: action || 'unknown',
            error: 'Invalid action'
          } as WhiteLabelResponse,
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('White-label POST error:', error);
    
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime: Date.now() - startTime
        }
      } as WhiteLabelResponse,
      { status: 500 }
    );
  }
}

/**
 * Handle overview request
 */
async function handleOverview(startTime: number): Promise<NextResponse> {
  const brandingConfigs = Array.from(brandingManager.getBrandingConfigs().values());
  const tenants = Array.from(tenantManager.getAllTenants().values());
  const activeBranding = brandingManager.getActiveBranding();
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    action: 'overview',
    data: {
      summary: {
        totalBrandingConfigs: brandingConfigs.length,
        activeBrandingConfig: activeBranding?.name || 'Default',
        totalTenants: tenants.length,
        activeTenants: tenants.filter(t => t.status === 'active').length,
        totalUsers: tenants.reduce((sum, t) => sum + t.usage.current.users, 0)
      },
      brandingOverview: brandingConfigs.map(config => ({
        id: config.id,
        name: config.name,
        organizationId: config.organizationId,
        isActive: config.metadata.isActive,
        createdAt: config.metadata.createdAt,
        theme: {
          primaryColor: config.theme.colors.primary,
          fontFamily: config.theme.typography.fontFamily.body
        }
      })),
      tenantOverview: tenants.slice(0, 10).map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        type: tenant.type,
        status: tenant.status,
        users: tenant.usage.current.users,
        monthlyRevenue: tenant.billing.plan.price,
        createdAt: tenant.metadata.createdAt
      })),
      revenueMetrics: {
        totalMRR: tenants.reduce((sum, t) => sum + t.billing.plan.price, 0),
        averageRevPerTenant: tenants.length > 0 ? Math.round(tenants.reduce((sum, t) => sum + t.billing.plan.price, 0) / tenants.length) : 0,
        trialConversionRate: tenants.filter(t => t.type !== 'trial' && t.billing.subscription.trialEnd).length / Math.max(1, tenants.filter(t => t.billing.subscription.trialEnd).length) * 100
      }
    },
    metadata: {
      processingTime: Date.now() - startTime,
      brandingActive: !!activeBranding,
      tenantActive: tenants.some(t => t.status === 'active')
    }
  } as WhiteLabelResponse);
}

/**
 * Handle get branding request
 */
async function handleGetBranding(organizationId: string | null, startTime: number): Promise<NextResponse> {
  const configs = organizationId 
    ? brandingManager.getBrandingByOrganization(organizationId)
    : Array.from(brandingManager.getBrandingConfigs().values());
  
  const activeBranding = brandingManager.getActiveBranding();
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    action: 'get_branding',
    data: {
      configs: configs.map(config => ({
        id: config.id,
        organizationId: config.organizationId,
        name: config.name,
        description: config.description,
        isActive: config.metadata.isActive,
        theme: config.theme,
        assets: config.assets,
        content: config.content,
        features: config.features,
        domain: config.domain,
        metadata: config.metadata
      })),
      activeConfigId: activeBranding?.id,
      cssVariables: activeBranding ? brandingManager.generateCSSVariables(activeBranding.theme) : null
    },
    metadata: {
      processingTime: Date.now() - startTime,
      brandingActive: !!activeBranding
    }
  } as WhiteLabelResponse);
}

/**
 * Handle get presets request
 */
async function handleGetPresets(startTime: number): Promise<NextResponse> {
  const presets = Array.from(brandingManager.getPresets().values());
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    action: 'get_presets',
    data: {
      presets: presets.map(preset => ({
        id: preset.id,
        name: preset.name,
        description: preset.description,
        thumbnail: preset.thumbnail,
        category: preset.category,
        isPremium: preset.isPremium,
        theme: preset.theme
      })),
      categories: ['modern', 'classic', 'minimal', 'bold', 'custom'],
      premiumCount: presets.filter(p => p.isPremium).length
    },
    metadata: {
      processingTime: Date.now() - startTime
    }
  } as WhiteLabelResponse);
}

/**
 * Handle get tenants request
 */
async function handleGetTenants(startTime: number): Promise<NextResponse> {
  const tenants = Array.from(tenantManager.getAllTenants().values());
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    action: 'get_tenants',
    data: {
      tenants: tenants.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        type: tenant.type,
        status: tenant.status,
        owner: tenant.team.owner,
        usage: tenant.usage.current,
        billing: {
          plan: tenant.billing.plan,
          subscription: tenant.billing.subscription,
          mrr: tenant.billing.plan.price
        },
        features: tenant.config.features,
        createdAt: tenant.metadata.createdAt
      })),
      summary: {
        total: tenants.length,
        byType: {
          trial: tenants.filter(t => t.type === 'trial').length,
          starter: tenants.filter(t => t.type === 'starter').length,
          professional: tenants.filter(t => t.type === 'professional').length,
          enterprise: tenants.filter(t => t.type === 'enterprise').length
        },
        byStatus: {
          active: tenants.filter(t => t.status === 'active').length,
          suspended: tenants.filter(t => t.status === 'suspended').length,
          cancelled: tenants.filter(t => t.status === 'cancelled').length,
          pending: tenants.filter(t => t.status === 'pending').length
        },
        totalMRR: tenants.reduce((sum, t) => sum + t.billing.plan.price, 0),
        totalUsers: tenants.reduce((sum, t) => sum + t.usage.current.users, 0)
      }
    },
    metadata: {
      processingTime: Date.now() - startTime
    }
  } as WhiteLabelResponse);
}

/**
 * Handle get tenant request
 */
async function handleGetTenant(tenantSlug: string | null, startTime: number): Promise<NextResponse> {
  if (!tenantSlug) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'get_tenant',
        error: 'tenantSlug is required'
      } as WhiteLabelResponse,
      { status: 400 }
    );
  }
  
  const tenant = tenantManager.getTenantBySlug(tenantSlug);
  if (!tenant) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'get_tenant',
        error: 'Tenant not found'
      } as WhiteLabelResponse,
      { status: 404 }
    );
  }
  
  const database = tenantManager.getTenantDatabase(tenant.id);
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    action: 'get_tenant',
    data: {
      tenant: {
        ...tenant,
        database
      },
      brandingConfig: tenant.config.brandingId 
        ? brandingManager.getBrandingConfigs().get(tenant.config.brandingId)
        : null,
      usageCost: calculateTenantCost(tenant),
      healthScore: calculateTenantHealth(tenant)
    },
    metadata: {
      processingTime: Date.now() - startTime,
      tenantActive: tenant.status === 'active'
    }
  } as WhiteLabelResponse);
}

/**
 * Handle create branding request
 */
async function handleCreateBranding(body: WhiteLabelRequest, startTime: number): Promise<NextResponse> {
  const { brandingData } = body;
  
  if (!brandingData?.organizationId || !brandingData?.name) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'create_branding',
        error: 'organizationId and name are required'
      } as WhiteLabelResponse,
      { status: 400 }
    );
  }
  
  try {
    const config = brandingManager.createBrandingConfig(
      brandingData.organizationId,
      brandingData.name,
      brandingData.presetId
    );
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      action: 'create_branding',
      data: {
        configId: config.id,
        name: config.name,
        organizationId: config.organizationId,
        isActive: config.metadata.isActive
      },
      metadata: {
        processingTime: Date.now() - startTime
      }
    } as WhiteLabelResponse);
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'create_branding',
        error: error instanceof Error ? error.message : 'Failed to create branding'
      } as WhiteLabelResponse,
      { status: 500 }
    );
  }
}

/**
 * Handle update branding request
 */
async function handleUpdateBranding(body: WhiteLabelRequest, startTime: number): Promise<NextResponse> {
  const { configId, brandingData } = body;
  
  if (!configId || !brandingData?.updates) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'update_branding',
        error: 'configId and updates are required'
      } as WhiteLabelResponse,
      { status: 400 }
    );
  }
  
  try {
    const config = brandingManager.updateBrandingConfig(configId, brandingData.updates);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      action: 'update_branding',
      data: {
        configId: config.id,
        name: config.name,
        version: config.metadata.version,
        updatedAt: config.metadata.updatedAt
      },
      metadata: {
        processingTime: Date.now() - startTime
      }
    } as WhiteLabelResponse);
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'update_branding',
        error: error instanceof Error ? error.message : 'Failed to update branding'
      } as WhiteLabelResponse,
      { status: 500 }
    );
  }
}

/**
 * Handle activate branding request
 */
async function handleActivateBranding(body: WhiteLabelRequest, startTime: number): Promise<NextResponse> {
  const { configId } = body;
  
  if (!configId) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'activate_branding',
        error: 'configId is required'
      } as WhiteLabelResponse,
      { status: 400 }
    );
  }
  
  try {
    brandingManager.activateBrandingConfig(configId);
    const config = brandingManager.getBrandingConfigs().get(configId);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      action: 'activate_branding',
      data: {
        configId,
        name: config?.name,
        isActive: true,
        cssVariables: config ? brandingManager.generateCSSVariables(config.theme) : null
      },
      metadata: {
        processingTime: Date.now() - startTime,
        brandingActive: true
      }
    } as WhiteLabelResponse);
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'activate_branding',
        error: error instanceof Error ? error.message : 'Failed to activate branding'
      } as WhiteLabelResponse,
      { status: 500 }
    );
  }
}

/**
 * Handle preview branding request
 */
async function handlePreviewBranding(body: WhiteLabelRequest, startTime: number): Promise<NextResponse> {
  const { configId } = body;
  
  if (!configId) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'preview_branding',
        error: 'configId is required'
      } as WhiteLabelResponse,
      { status: 400 }
    );
  }
  
  try {
    const preview = brandingManager.previewBranding(configId);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      action: 'preview_branding',
      data: preview,
      metadata: {
        processingTime: Date.now() - startTime
      }
    } as WhiteLabelResponse);
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'preview_branding',
        error: error instanceof Error ? error.message : 'Failed to preview branding'
      } as WhiteLabelResponse,
      { status: 500 }
    );
  }
}

/**
 * Handle export branding request
 */
async function handleExportBranding(body: WhiteLabelRequest, startTime: number): Promise<NextResponse> {
  const { configId } = body;
  
  if (!configId) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'export_branding',
        error: 'configId is required'
      } as WhiteLabelResponse,
      { status: 400 }
    );
  }
  
  try {
    const exportData = brandingManager.exportBrandingConfig(configId);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      action: 'export_branding',
      data: {
        configData: exportData,
        exportedAt: new Date().toISOString(),
        format: 'json'
      },
      metadata: {
        processingTime: Date.now() - startTime
      }
    } as WhiteLabelResponse);
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'export_branding',
        error: error instanceof Error ? error.message : 'Failed to export branding'
      } as WhiteLabelResponse,
      { status: 500 }
    );
  }
}

/**
 * Handle import branding request
 */
async function handleImportBranding(body: WhiteLabelRequest, startTime: number): Promise<NextResponse> {
  const { brandingData } = body;
  
  if (!brandingData?.configData) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'import_branding',
        error: 'configData is required'
      } as WhiteLabelResponse,
      { status: 400 }
    );
  }
  
  try {
    const config = brandingManager.importBrandingConfig(brandingData.configData);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      action: 'import_branding',
      data: {
        configId: config.id,
        name: config.name,
        organizationId: config.organizationId,
        importedAt: new Date().toISOString()
      },
      metadata: {
        processingTime: Date.now() - startTime
      }
    } as WhiteLabelResponse);
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'import_branding',
        error: error instanceof Error ? error.message : 'Failed to import branding'
      } as WhiteLabelResponse,
      { status: 500 }
    );
  }
}

/**
 * Handle create tenant request
 */
async function handleCreateTenant(body: WhiteLabelRequest, startTime: number): Promise<NextResponse> {
  const { tenantData } = body;
  
  if (!tenantData?.name || !tenantData?.slug || !tenantData?.type || 
      !tenantData?.ownerId || !tenantData?.ownerEmail || !tenantData?.ownerName) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'create_tenant',
        error: 'name, slug, type, ownerId, ownerEmail, and ownerName are required'
      } as WhiteLabelResponse,
      { status: 400 }
    );
  }
  
  try {
    const tenant = tenantManager.createTenant(
      tenantData.name,
      tenantData.slug,
      tenantData.type,
      tenantData.ownerId,
      tenantData.ownerEmail,
      tenantData.ownerName
    );
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      action: 'create_tenant',
      data: {
        tenantId: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        type: tenant.type,
        status: tenant.status,
        databaseType: tenantManager.getTenantDatabase(tenant.id)?.type
      },
      metadata: {
        processingTime: Date.now() - startTime
      }
    } as WhiteLabelResponse);
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'create_tenant',
        error: error instanceof Error ? error.message : 'Failed to create tenant'
      } as WhiteLabelResponse,
      { status: 500 }
    );
  }
}

/**
 * Handle update tenant request
 */
async function handleUpdateTenant(body: WhiteLabelRequest, startTime: number): Promise<NextResponse> {
  const { tenantId, tenantData } = body;
  
  if (!tenantId || !tenantData?.status) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'update_tenant',
        error: 'tenantId and status are required'
      } as WhiteLabelResponse,
      { status: 400 }
    );
  }
  
  try {
    tenantManager.updateTenantStatus(tenantId, tenantData.status, tenantData.reason);
    const tenant = tenantManager.getTenant(tenantId);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      action: 'update_tenant',
      data: {
        tenantId,
        name: tenant?.name,
        status: tenant?.status,
        updatedAt: tenant?.metadata.updatedAt
      },
      metadata: {
        processingTime: Date.now() - startTime,
        tenantActive: tenant?.status === 'active'
      }
    } as WhiteLabelResponse);
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'update_tenant',
        error: error instanceof Error ? error.message : 'Failed to update tenant'
      } as WhiteLabelResponse,
      { status: 500 }
    );
  }
}

/**
 * Calculate tenant cost
 */
function calculateTenantCost(tenant: any): {
  baseCost: number;
  overageCosts: Record<string, number>;
  totalCost: number;
} {
  const baseCost = tenant.billing.plan.price;
  const overageCosts = {
    users: Math.max(0, tenant.usage.current.users - (tenant.config.features.maxUsers === -1 ? Infinity : tenant.config.features.maxUsers)) * 10,
    aiRequests: Math.max(0, tenant.usage.current.aiRequests - (tenant.config.features.aiCredits === -1 ? Infinity : tenant.config.features.aiCredits)) * 0.01,
    storage: Math.max(0, tenant.usage.current.storage - tenant.config.limits.storageLimit) * 0.1,
    bandwidth: Math.max(0, tenant.usage.current.bandwidth - tenant.config.limits.bandwidthLimit) * 0.05
  };
  
  const totalCost = baseCost + Object.values(overageCosts).reduce((sum, cost) => sum + cost, 0);
  
  return { baseCost, overageCosts, totalCost };
}

/**
 * Calculate tenant health score
 */
function calculateTenantHealth(tenant: any): {
  score: number;
  factors: Record<string, number>;
} {
  const factors = {
    paymentStatus: tenant.billing.subscription.status === 'active' ? 100 : 0,
    userGrowth: tenant.usage.trends.userGrowth > 0 ? 100 : 50,
    resourceUtilization: Math.min(100, (tenant.usage.current.users / Math.max(1, tenant.config.features.maxUsers)) * 100),
    securityCompliance: (tenant.security.mfa.required ? 50 : 0) + (tenant.security.dataEncryption.atRest ? 50 : 0)
  };
  
  const score = Math.round(Object.values(factors).reduce((sum, score) => sum + score, 0) / Object.keys(factors).length);
  
  return { score, factors };
}