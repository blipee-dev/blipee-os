/**
 * API Version Manager
 * Handles API versioning, deprecation, and backward compatibility
 */

export interface APIVersion {
  version: string;
  releaseDate: Date;
  deprecationDate?: Date;
  sunsetDate?: Date;
  status: 'current' | 'supported' | 'deprecated' | 'sunset';
  breaking: boolean;
  changelog: string[];
}

export interface VersionedEndpoint {
  path: string;
  method: string;
  versions: {
    [version: string]: {
      handler: string;
      schema: any;
      deprecated?: boolean;
      migration?: string;
    };
  };
}

export interface ClientRequest {
  version?: string;
  headers: Record<string, string>;
  userAgent?: string;
}

export interface VersionNegotiation {
  requestedVersion?: string;
  negotiatedVersion: string;
  warnings: string[];
  deprecationNotice?: {
    version: string;
    sunsetDate: Date;
    migrationGuide: string;
  };
}

/**
 * API Version Manager
 * Handles version negotiation, deprecation warnings, and migrations
 */
export class APIVersionManager {
  private versions: Map<string, APIVersion> = new Map();
  private endpoints: Map<string, VersionedEndpoint> = new Map();
  private currentVersion: string = '2024-09-01';
  private minimumSupportedVersion: string = '2024-06-01';

  constructor() {
    this.initializeVersions();
    this.initializeEndpoints();
  }

  /**
   * Initialize API versions with their metadata
   */
  private initializeVersions(): void {
    const versions: APIVersion[] = [
      {
        version: '2024-06-01',
        releaseDate: new Date('2024-06-01'),
        deprecationDate: new Date('2024-12-01'),
        sunsetDate: new Date('2025-03-01'),
        status: 'deprecated',
        breaking: false,
        changelog: [
          'Initial API release',
          'Basic CRUD operations',
          'JWT authentication'
        ]
      },
      {
        version: '2024-07-15',
        releaseDate: new Date('2024-07-15'),
        deprecationDate: new Date('2025-01-15'),
        sunsetDate: new Date('2025-06-15'),
        status: 'supported',
        breaking: false,
        changelog: [
          'Added real-time subscriptions',
          'Enhanced error responses',
          'Rate limiting headers'
        ]
      },
      {
        version: '2024-09-01',
        releaseDate: new Date('2024-09-01'),
        status: 'current',
        breaking: true,
        changelog: [
          'Enterprise features',
          'Multi-region support',
          'Advanced compliance',
          'Breaking: Removed legacy endpoints',
          'New authentication flow'
        ]
      }
    ];

    versions.forEach(version => {
      this.versions.set(version.version, version);
    });
  }

  /**
   * Initialize versioned endpoints
   */
  private initializeEndpoints(): void {
    const endpoints: VersionedEndpoint[] = [
      {
        path: '/api/ai/chat',
        method: 'POST',
        versions: {
          '2024-06-01': {
            handler: 'chatHandlerV1',
            schema: 'ChatRequestV1',
            deprecated: true,
            migration: 'Use /api/v2/conversations instead'
          },
          '2024-07-15': {
            handler: 'chatHandlerV2',
            schema: 'ChatRequestV2'
          },
          '2024-09-01': {
            handler: 'chatHandlerV3',
            schema: 'ChatRequestV3'
          }
        }
      },
      {
        path: '/api/organizations',
        method: 'GET',
        versions: {
          '2024-06-01': {
            handler: 'getOrganizationsV1',
            schema: 'OrganizationV1',
            deprecated: true
          },
          '2024-07-15': {
            handler: 'getOrganizationsV2',
            schema: 'OrganizationV2'
          },
          '2024-09-01': {
            handler: 'getOrganizationsV3',
            schema: 'OrganizationV3'
          }
        }
      },
      {
        path: '/api/compliance/dashboard',
        method: 'GET',
        versions: {
          '2024-09-01': {
            handler: 'getComplianceDashboard',
            schema: 'ComplianceDashboardV1'
          }
        }
      }
    ];

    endpoints.forEach(endpoint => {
      const key = `${endpoint.method}:${endpoint.path}`;
      this.endpoints.set(key, endpoint);
    });
  }

  /**
   * Negotiate API version based on client request
   */
  negotiateVersion(request: ClientRequest): VersionNegotiation {
    const requestedVersion = this.extractVersion(request);
    const warnings: string[] = [];
    let negotiatedVersion = this.currentVersion;
    let deprecationNotice: VersionNegotiation['deprecationNotice'];

    if (requestedVersion) {
      const version = this.versions.get(requestedVersion);
      
      if (!version) {
        warnings.push(`Version ${requestedVersion} not found. Using current version ${this.currentVersion}`);
      } else if (version.status === 'sunset') {
        warnings.push(`Version ${requestedVersion} is no longer supported. Using current version ${this.currentVersion}`);
      } else if (version.status === 'deprecated') {
        negotiatedVersion = requestedVersion;
        warnings.push(`Version ${requestedVersion} is deprecated`);
        
        if (version.sunsetDate) {
          deprecationNotice = {
            version: requestedVersion,
            sunsetDate: version.sunsetDate,
            migrationGuide: `https://docs.blipee.com/api/migration/${requestedVersion}`
          };
        }
      } else {
        negotiatedVersion = requestedVersion;
      }
    } else {
      // No version specified - detect from User-Agent or use current
      const detectedVersion = this.detectVersionFromUserAgent(request.userAgent);
      if (detectedVersion) {
        negotiatedVersion = detectedVersion;
        warnings.push('No API version specified. Detected from User-Agent');
      } else {
        warnings.push('No API version specified. Using current version');
      }
    }

    return {
      requestedVersion,
      negotiatedVersion,
      warnings,
      deprecationNotice
    };
  }

  /**
   * Extract version from request headers
   */
  private extractVersion(request: ClientRequest): string | undefined {
    // Check multiple header formats
    return request.headers['api-version'] ||
           request.headers['API-Version'] ||
           request.headers['x-api-version'] ||
           request.version;
  }

  /**
   * Detect version from User-Agent string
   */
  private detectVersionFromUserAgent(userAgent?: string): string | undefined {
    if (!userAgent) return undefined;

    // Look for SDK version patterns
    const patterns = [
      /blipee-sdk\/(\d{4}-\d{2}-\d{2})/,
      /BlipeeClient\/(\d{4}-\d{2}-\d{2})/,
      /blipee-js@(\d{4}-\d{2}-\d{2})/
    ];

    for (const pattern of patterns) {
      const match = userAgent.match(pattern);
      if (match && this.versions.has(match[1])) {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * Get endpoint handler for specific version
   */
  getEndpointHandler(path: string, method: string, version: string): {
    handler: string;
    schema: any;
    deprecated?: boolean;
    migration?: string;
  } | null {
    const key = `${method}:${path}`;
    const endpoint = this.endpoints.get(key);
    
    if (!endpoint) return null;

    // Try exact version match first
    if (endpoint.versions[version]) {
      return endpoint.versions[version];
    }

    // Fall back to nearest compatible version
    const compatibleVersion = this.findCompatibleVersion(endpoint, version);
    return compatibleVersion ? endpoint.versions[compatibleVersion] : null;
  }

  /**
   * Find compatible version for endpoint
   */
  private findCompatibleVersion(endpoint: VersionedEndpoint, requestedVersion: string): string | null {
    const availableVersions = Object.keys(endpoint.versions).sort().reverse();
    
    // Find the highest version that's not newer than requested
    for (const version of availableVersions) {
      if (version <= requestedVersion) {
        return version;
      }
    }

    // If no compatible version found, return the oldest available
    return availableVersions[availableVersions.length - 1] || null;
  }

  /**
   * Get all supported versions
   */
  getSupportedVersions(): APIVersion[] {
    return Array.from(this.versions.values())
      .filter(v => v.status !== 'sunset')
      .sort((a, b) => b.releaseDate.getTime() - a.releaseDate.getTime());
  }

  /**
   * Get version metadata
   */
  getVersionInfo(version: string): APIVersion | null {
    return this.versions.get(version) || null;
  }

  /**
   * Check if version is supported
   */
  isVersionSupported(version: string): boolean {
    const versionInfo = this.versions.get(version);
    return versionInfo ? versionInfo.status !== 'sunset' : false;
  }

  /**
   * Get deprecation warnings for version
   */
  getDeprecationWarnings(version: string): string[] {
    const versionInfo = this.versions.get(version);
    const warnings: string[] = [];

    if (!versionInfo) {
      warnings.push(`Version ${version} is not recognized`);
      return warnings;
    }

    if (versionInfo.status === 'deprecated') {
      warnings.push(`API version ${version} is deprecated`);
      
      if (versionInfo.sunsetDate) {
        const daysUntilSunset = Math.ceil(
          (versionInfo.sunsetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysUntilSunset > 0) {
          warnings.push(`Version ${version} will be sunset in ${daysUntilSunset} days`);
        } else {
          warnings.push(`Version ${version} has been sunset and may stop working`);
        }
      }
    }

    return warnings;
  }

  /**
   * Generate migration instructions
   */
  generateMigrationGuide(fromVersion: string, toVersion?: string): {
    from: string;
    to: string;
    breaking: boolean;
    steps: string[];
    examples: Record<string, any>;
  } | null {
    const targetVersion = toVersion || this.currentVersion;
    const fromVersionInfo = this.versions.get(fromVersion);
    const toVersionInfo = this.versions.get(targetVersion);

    if (!fromVersionInfo || !toVersionInfo) {
      return null;
    }

    const breaking = toVersionInfo.breaking && toVersionInfo.releaseDate > fromVersionInfo.releaseDate;
    
    return {
      from: fromVersion,
      to: targetVersion,
      breaking,
      steps: this.generateMigrationSteps(fromVersion, targetVersion),
      examples: this.generateMigrationExamples(fromVersion, targetVersion)
    };
  }

  /**
   * Generate migration steps between versions
   */
  private generateMigrationSteps(fromVersion: string, toVersion: string): string[] {
    const steps: string[] = [];
    
    // This would be customized based on actual changes between versions
    steps.push(`Update your client to request API version ${toVersion}`);
    steps.push('Add version header: API-Version: ' + toVersion);
    steps.push('Review breaking changes in changelog');
    steps.push('Update request/response schemas');
    steps.push('Test all endpoints thoroughly');

    return steps;
  }

  /**
   * Generate migration examples
   */
  private generateMigrationExamples(fromVersion: string, toVersion: string): Record<string, any> {
    return {
      curl: `curl -H "API-Version: ${toVersion}" https://api.blipee.com/v1/organizations`,
      javascript: `
const client = new BlipeeClient({
  apiVersion: '${toVersion}',
  apiKey: 'your-api-key'
});`,
      python: `
client = BlipeeClient(
    api_version='${toVersion}',
    api_key='your-api-key'
)`
    };
  }

  /**
   * Track version usage for analytics
   */
  trackVersionUsage(version: string, endpoint: string, userAgent?: string): void {
    // In real implementation, this would send to analytics
  }

  /**
   * Get current version
   */
  getCurrentVersion(): string {
    return this.currentVersion;
  }

  /**
   * Get minimum supported version
   */
  getMinimumSupportedVersion(): string {
    return this.minimumSupportedVersion;
  }
}

/**
 * Global version manager instance
 */
export const versionManager = new APIVersionManager();