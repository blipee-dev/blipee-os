/**
 * BLIPEE AI Integration Hub
 * Comprehensive External System Integration Platform
 *
 * This hub provides seamless integration with:
 * - Building Management Systems (BMS/BAS)
 * - IoT sensors and devices
 * - Utility company APIs
 * - ERP and procurement systems
 * - Environmental databases
 * - Compliance platforms
 * - Weather and market data services
 * - Carbon accounting platforms
 * - Supply chain systems
 * - Document management systems
 */

import { EventEmitter } from 'events';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Core Integration Types
export interface IntegrationDefinition {
  id: string;
  name: string;
  description: string;
  provider: string;
  category: IntegrationCategory;
  type: IntegrationType;
  version: string;

  // Connection Configuration
  connectionConfig: ConnectionConfig;
  authentication: AuthenticationConfig;
  endpoints: EndpointDefinition[];

  // Data Mapping
  dataMapping: DataMappingConfig;
  dataValidation: ValidationRule[];

  // Synchronization
  syncConfig: SyncConfiguration;
  transformations: DataTransformation[];

  // Monitoring & Reliability
  healthCheck: HealthCheckConfig;
  rateLimits: RateLimitConfig;
  errorHandling: ErrorHandlingConfig;

  // Metadata
  capabilities: IntegrationCapability[];
  supportedActions: string[];

  status: IntegrationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectionConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  ssl: SSLConfig;
  proxy?: ProxyConfig;
  headers: Record<string, string>;
}

export interface AuthenticationConfig {
  type: AuthenticationType;
  credentials: Record<string, any>;
  tokenRefresh?: TokenRefreshConfig;
  scopes?: string[];
  expirationHandling: ExpirationHandling;
}

export interface EndpointDefinition {
  id: string;
  path: string;
  method: HTTPMethod;
  description: string;
  parameters: EndpointParameter[];
  response: ResponseSchema;
  rateLimits?: RateLimitConfig;
}

export interface DataMappingConfig {
  inputMappings: FieldMapping[];
  outputMappings: FieldMapping[];
  defaultValues: Record<string, any>;
  conditionalMappings: ConditionalMapping[];
}

export interface SyncConfiguration {
  mode: SyncMode;
  frequency: SyncFrequency;
  batchSize: number;
  conflictResolution: ConflictResolution;
  deltaSync: boolean;
  lastSyncTimestamp?: Date;
}

// Enums
export enum IntegrationCategory {
  BUILDING_SYSTEMS = 'building_systems',
  UTILITIES = 'utilities',
  IOT_SENSORS = 'iot_sensors',
  ERP_SYSTEMS = 'erp_systems',
  ENVIRONMENTAL_DATA = 'environmental_data',
  COMPLIANCE_PLATFORMS = 'compliance_platforms',
  WEATHER_SERVICES = 'weather_services',
  CARBON_PLATFORMS = 'carbon_platforms',
  SUPPLY_CHAIN = 'supply_chain',
  DOCUMENT_SYSTEMS = 'document_systems',
  FINANCIAL_SYSTEMS = 'financial_systems',
  HR_SYSTEMS = 'hr_systems'
}

export enum IntegrationType {
  REST_API = 'rest_api',
  SOAP_API = 'soap_api',
  GRAPHQL = 'graphql',
  WEBHOOK = 'webhook',
  FTP = 'ftp',
  SFTP = 'sftp',
  DATABASE = 'database',
  MESSAGE_QUEUE = 'message_queue',
  MQTT = 'mqtt',
  MODBUS = 'modbus',
  BACNET = 'bacnet',
  CSV_IMPORT = 'csv_import',
  EXCEL_IMPORT = 'excel_import'
}

export enum AuthenticationType {
  API_KEY = 'api_key',
  BEARER_TOKEN = 'bearer_token',
  OAUTH2 = 'oauth2',
  BASIC_AUTH = 'basic_auth',
  JWT = 'jwt',
  CERTIFICATE = 'certificate',
  HMAC = 'hmac',
  NONE = 'none'
}

export enum HTTPMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE'
}

export enum SyncMode {
  PULL = 'pull',
  PUSH = 'push',
  BIDIRECTIONAL = 'bidirectional'
}

export enum SyncFrequency {
  REAL_TIME = 'real_time',
  EVERY_MINUTE = 'every_minute',
  EVERY_5_MINUTES = 'every_5_minutes',
  EVERY_15_MINUTES = 'every_15_minutes',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ON_DEMAND = 'on_demand'
}

export enum IntegrationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  CONNECTING = 'connecting',
  MAINTENANCE = 'maintenance'
}

// Integration Hub Class
export class IntegrationHub extends EventEmitter {
  private integrations: Map<string, IntegrationDefinition> = new Map();
  private connections: Map<string, IntegrationConnection> = new Map();
  private supabase: ReturnType<typeof createClient<Database>>;

  // Registry of pre-built integrations
  private prebuiltIntegrations: Map<string, IntegrationDefinition> = new Map();

  constructor() {
    super();

    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    this.initializePrebuiltIntegrations();
    this.startHealthMonitoring();
  }

  /**
   * Register a new integration
   */
  public async registerIntegration(integration: IntegrationDefinition): Promise<void> {
    this.integrations.set(integration.id, integration);

    // Store in database
    await this.storeIntegration(integration);

    // Emit registration event
    this.emit('integrationRegistered', integration);

    console.log(`Integration registered: ${integration.id} (${integration.name})`);
  }

  /**
   * Create a connection to an external system
   */
  public async createConnection(integrationId: string, config: ConnectionOverride = {}): Promise<IntegrationConnection> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration not found: ${integrationId}`);
    }

    const connection = new IntegrationConnection(integration, config);
    await connection.connect();

    this.connections.set(connection.id, connection);

    // Emit connection event
    this.emit('connectionEstablished', connection);

    return connection;
  }

  /**
   * Execute an API call through an integration
   */
  public async executeCall(
    integrationId: string,
    endpointId: string,
    parameters: Record<string, any> = {},
    options: CallOptions = {}
  ): Promise<IntegrationCallResult> {
    const connection = this.connections.get(integrationId);
    if (!connection) {
      throw new Error(`No active connection for integration: ${integrationId}`);
    }

    return await connection.executeCall(endpointId, parameters, options);
  }

  /**
   * Sync data with an external system
   */
  public async syncData(
    integrationId: string,
    syncOptions: SyncOptions = {}
  ): Promise<SyncResult> {
    const connection = this.connections.get(integrationId);
    if (!connection) {
      throw new Error(`No active connection for integration: ${integrationId}`);
    }

    return await connection.syncData(syncOptions);
  }

  /**
   * Get available integrations
   */
  public getAvailableIntegrations(): IntegrationDefinition[] {
    return Array.from(this.integrations.values());
  }

  /**
   * Get integrations by category
   */
  public getIntegrationsByCategory(category: IntegrationCategory): IntegrationDefinition[] {
    return Array.from(this.integrations.values()).filter(
      integration => integration.category === category
    );
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(integrationId: string): ConnectionStatus | undefined {
    const connection = this.connections.get(integrationId);
    return connection?.getStatus();
  }

  /**
   * Test integration connection
   */
  public async testConnection(integrationId: string): Promise<TestResult> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration not found: ${integrationId}`);
    }

    try {
      const testConnection = new IntegrationConnection(integration, {});
      await testConnection.connect();

      const healthCheck = await testConnection.performHealthCheck();
      await testConnection.disconnect();

      return {
        success: true,
        latency: healthCheck.latency,
        version: healthCheck.version,
        capabilities: healthCheck.capabilities
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Private methods

  private async initializePrebuiltIntegrations(): Promise<void> {
    // Building Management Systems
    this.registerBuilingSystemIntegrations();

    // Utility Companies
    this.registerUtilityIntegrations();

    // IoT Sensors
    this.registerIoTIntegrations();

    // Environmental Data
    this.registerEnvironmentalDataIntegrations();

    // Compliance Platforms
    this.registerComplianceIntegrations();

    // ERP Systems
    this.registerERPIntegrations();

    console.log(`Initialized ${this.prebuiltIntegrations.size} pre-built integrations`);
  }

  private registerBuilingSystemIntegrations(): void {
    // Honeywell Building Management
    this.prebuiltIntegrations.set('honeywell_bms', {
      id: 'honeywell_bms',
      name: 'Honeywell Building Management System',
      description: 'Integration with Honeywell BMS for HVAC, lighting, and energy data',
      provider: 'Honeywell',
      category: IntegrationCategory.BUILDING_SYSTEMS,
      type: IntegrationType.REST_API,
      version: '2.1.0',

      connectionConfig: {
        baseUrl: 'https://api.honeywell.com/v2',
        timeout: 30000,
        retryAttempts: 3,
        ssl: { verify: true, version: 'TLSv1.2' },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      },

      authentication: {
        type: AuthenticationType.OAUTH2,
        credentials: {},
        tokenRefresh: {
          enabled: true,
          endpoint: '/oauth/token',
          grantType: 'refresh_token'
        },
        scopes: ['building:read', 'energy:read', 'control:write'],
        expirationHandling: 'auto_refresh'
      },

      endpoints: [
        {
          id: 'get_building_data',
          path: '/buildings/{buildingId}/data',
          method: HTTPMethod.GET,
          description: 'Retrieve real-time building data',
          parameters: [
            {
              name: 'buildingId',
              type: 'string',
              location: 'path',
              required: true,
              description: 'Building identifier'
            },
            {
              name: 'dataTypes',
              type: 'array',
              location: 'query',
              required: false,
              description: 'Specific data types to retrieve'
            }
          ],
          response: {
            type: 'object',
            schema: {
              temperature: 'number',
              humidity: 'number',
              energyConsumption: 'number',
              occupancy: 'number'
            }
          }
        },
        {
          id: 'control_hvac',
          path: '/buildings/{buildingId}/hvac/control',
          method: HTTPMethod.POST,
          description: 'Control HVAC system settings',
          parameters: [
            {
              name: 'buildingId',
              type: 'string',
              location: 'path',
              required: true,
              description: 'Building identifier'
            },
            {
              name: 'setpoint',
              type: 'number',
              location: 'body',
              required: true,
              description: 'Temperature setpoint'
            }
          ],
          response: {
            type: 'object',
            schema: {
              status: 'string',
              newSetpoint: 'number'
            }
          }
        }
      ],

      dataMapping: {
        inputMappings: [
          {
            source: 'building_id',
            target: 'buildingId',
            transformation: 'identity'
          }
        ],
        outputMappings: [
          {
            source: 'energyConsumption',
            target: 'energy_kwh',
            transformation: 'identity'
          },
          {
            source: 'temperature',
            target: 'temperature_celsius',
            transformation: 'identity'
          }
        ],
        defaultValues: {},
        conditionalMappings: []
      },

      dataValidation: [
        {
          field: 'temperature',
          type: 'range',
          min: -50,
          max: 100,
          required: false
        },
        {
          field: 'energyConsumption',
          type: 'positive',
          required: true
        }
      ],

      syncConfig: {
        mode: SyncMode.PULL,
        frequency: SyncFrequency.EVERY_15_MINUTES,
        batchSize: 100,
        conflictResolution: 'latest_wins',
        deltaSync: true
      },

      transformations: [
        {
          name: 'unit_conversion',
          type: 'function',
          function: 'convertUnits',
          parameters: { from: 'fahrenheit', to: 'celsius' }
        }
      ],

      healthCheck: {
        enabled: true,
        endpoint: '/health',
        interval: 300000, // 5 minutes
        timeout: 10000,
        expectedStatus: 200
      },

      rateLimits: {
        requests: 1000,
        window: 3600, // 1 hour
        burst: 50
      },

      errorHandling: {
        retryableErrors: ['timeout', 'rate_limit', 'server_error'],
        maxRetries: 3,
        backoffStrategy: 'exponential',
        fallbackBehavior: 'cache_last_value'
      },

      capabilities: [
        'real_time_data',
        'historical_data',
        'control_commands',
        'alerts',
        'energy_monitoring'
      ],
      supportedActions: [
        'collect_energy_data',
        'optimize_hvac_system',
        'monitor_building_performance'
      ],

      status: IntegrationStatus.ACTIVE,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-09-21')
    });

    // Johnson Controls Metasys
    this.prebuiltIntegrations.set('johnson_controls_metasys', {
      id: 'johnson_controls_metasys',
      name: 'Johnson Controls Metasys',
      description: 'Integration with Johnson Controls Metasys building automation system',
      provider: 'Johnson Controls',
      category: IntegrationCategory.BUILDING_SYSTEMS,
      type: IntegrationType.REST_API,
      version: '1.0.0',

      connectionConfig: {
        baseUrl: 'https://api.metasys.com/v4',
        timeout: 30000,
        retryAttempts: 3,
        ssl: { verify: true, version: 'TLSv1.3' },
        headers: {
          'Content-Type': 'application/json'
        }
      },

      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        credentials: {},
        expirationHandling: 'manual_refresh'
      },

      endpoints: [
        {
          id: 'get_equipment_data',
          path: '/equipment/{equipmentId}/data',
          method: HTTPMethod.GET,
          description: 'Get equipment operational data',
          parameters: [
            {
              name: 'equipmentId',
              type: 'string',
              location: 'path',
              required: true,
              description: 'Equipment identifier'
            }
          ],
          response: {
            type: 'object',
            schema: {
              status: 'string',
              runtime: 'number',
              efficiency: 'number'
            }
          }
        }
      ],

      dataMapping: {
        inputMappings: [],
        outputMappings: [],
        defaultValues: {},
        conditionalMappings: []
      },

      dataValidation: [],

      syncConfig: {
        mode: SyncMode.PULL,
        frequency: SyncFrequency.EVERY_5_MINUTES,
        batchSize: 50,
        conflictResolution: 'merge',
        deltaSync: true
      },

      transformations: [],

      healthCheck: {
        enabled: true,
        endpoint: '/status',
        interval: 300000,
        timeout: 10000,
        expectedStatus: 200
      },

      rateLimits: {
        requests: 500,
        window: 3600,
        burst: 25
      },

      errorHandling: {
        retryableErrors: ['timeout', 'server_error'],
        maxRetries: 3,
        backoffStrategy: 'linear',
        fallbackBehavior: 'skip'
      },

      capabilities: [
        'equipment_monitoring',
        'energy_analytics',
        'fault_detection'
      ],
      supportedActions: [
        'monitor_equipment_performance',
        'detect_equipment_faults'
      ],

      status: IntegrationStatus.ACTIVE,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-09-21')
    });
  }

  private registerUtilityIntegrations(): void {
    // Green Button Data
    this.prebuiltIntegrations.set('green_button', {
      id: 'green_button',
      name: 'Green Button Energy Data',
      description: 'Standard utility data integration using Green Button protocol',
      provider: 'Multiple Utilities',
      category: IntegrationCategory.UTILITIES,
      type: IntegrationType.REST_API,
      version: '2.0.0',

      connectionConfig: {
        baseUrl: '{utility_base_url}/espi/1_1/resource',
        timeout: 60000,
        retryAttempts: 3,
        ssl: { verify: true, version: 'TLSv1.2' },
        headers: {
          'Accept': 'application/atom+xml'
        }
      },

      authentication: {
        type: AuthenticationType.OAUTH2,
        credentials: {},
        scopes: ['FB=1_3_4_5_13_14_15_16_31_32_33_34_35_37_38_39_40_41_44'],
        expirationHandling: 'auto_refresh'
      },

      endpoints: [
        {
          id: 'get_usage_data',
          path: '/Subscription/{subscriptionId}/UsagePoint/{usagePointId}/MeterReading',
          method: HTTPMethod.GET,
          description: 'Retrieve energy usage data',
          parameters: [
            {
              name: 'subscriptionId',
              type: 'string',
              location: 'path',
              required: true,
              description: 'Subscription identifier'
            },
            {
              name: 'usagePointId',
              type: 'string',
              location: 'path',
              required: true,
              description: 'Usage point identifier'
            },
            {
              name: 'published-max',
              type: 'string',
              location: 'query',
              required: false,
              description: 'Maximum published date'
            }
          ],
          response: {
            type: 'xml',
            schema: {}
          }
        }
      ],

      dataMapping: {
        inputMappings: [],
        outputMappings: [
          {
            source: 'IntervalReading.value',
            target: 'usage_kwh',
            transformation: 'xml_extract'
          },
          {
            source: 'IntervalReading.timePeriod.start',
            target: 'reading_date',
            transformation: 'unix_to_iso'
          }
        ],
        defaultValues: {},
        conditionalMappings: []
      },

      dataValidation: [
        {
          field: 'usage_kwh',
          type: 'positive',
          required: true
        }
      ],

      syncConfig: {
        mode: SyncMode.PULL,
        frequency: SyncFrequency.DAILY,
        batchSize: 1000,
        conflictResolution: 'latest_wins',
        deltaSync: true
      },

      transformations: [
        {
          name: 'xml_to_json',
          type: 'function',
          function: 'xmlToJson',
          parameters: {}
        }
      ],

      healthCheck: {
        enabled: true,
        endpoint: '/ApplicationInformation',
        interval: 3600000, // 1 hour
        timeout: 30000,
        expectedStatus: 200
      },

      rateLimits: {
        requests: 100,
        window: 3600,
        burst: 10
      },

      errorHandling: {
        retryableErrors: ['timeout', 'server_error'],
        maxRetries: 5,
        backoffStrategy: 'exponential',
        fallbackBehavior: 'cache_last_value'
      },

      capabilities: [
        'historical_usage',
        'interval_data',
        'cost_data'
      ],
      supportedActions: [
        'collect_utility_data',
        'analyze_usage_patterns'
      ],

      status: IntegrationStatus.ACTIVE,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-09-21')
    });
  }

  private registerIoTIntegrations(): void {
    // AWS IoT Core
    this.prebuiltIntegrations.set('aws_iot_core', {
      id: 'aws_iot_core',
      name: 'AWS IoT Core',
      description: 'Integration with AWS IoT Core for sensor data collection',
      provider: 'Amazon Web Services',
      category: IntegrationCategory.IOT_SENSORS,
      type: IntegrationType.MQTT,
      version: '1.0.0',

      connectionConfig: {
        baseUrl: '{iot_endpoint}.amazonaws.com',
        timeout: 30000,
        retryAttempts: 3,
        ssl: { verify: true, version: 'TLSv1.2' },
        headers: {}
      },

      authentication: {
        type: AuthenticationType.CERTIFICATE,
        credentials: {},
        expirationHandling: 'manual_refresh'
      },

      endpoints: [],

      dataMapping: {
        inputMappings: [],
        outputMappings: [
          {
            source: 'temperature',
            target: 'sensor_temperature',
            transformation: 'identity'
          },
          {
            source: 'humidity',
            target: 'sensor_humidity',
            transformation: 'identity'
          }
        ],
        defaultValues: {},
        conditionalMappings: []
      },

      dataValidation: [
        {
          field: 'sensor_temperature',
          type: 'range',
          min: -40,
          max: 85,
          required: true
        }
      ],

      syncConfig: {
        mode: SyncMode.PULL,
        frequency: SyncFrequency.REAL_TIME,
        batchSize: 1,
        conflictResolution: 'latest_wins',
        deltaSync: false
      },

      transformations: [],

      healthCheck: {
        enabled: true,
        endpoint: '/test',
        interval: 300000,
        timeout: 10000,
        expectedStatus: 200
      },

      rateLimits: {
        requests: 10000,
        window: 3600,
        burst: 100
      },

      errorHandling: {
        retryableErrors: ['connection_lost', 'timeout'],
        maxRetries: 5,
        backoffStrategy: 'exponential',
        fallbackBehavior: 'buffer'
      },

      capabilities: [
        'real_time_streaming',
        'device_management',
        'rule_engine'
      ],
      supportedActions: [
        'collect_sensor_data',
        'monitor_device_health'
      ],

      status: IntegrationStatus.ACTIVE,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-09-21')
    });
  }

  private registerEnvironmentalDataIntegrations(): void {
    // OpenWeatherMap
    this.prebuiltIntegrations.set('openweathermap', {
      id: 'openweathermap',
      name: 'OpenWeatherMap',
      description: 'Weather data integration for environmental context',
      provider: 'OpenWeatherMap',
      category: IntegrationCategory.ENVIRONMENTAL_DATA,
      type: IntegrationType.REST_API,
      version: '2.5.0',

      connectionConfig: {
        baseUrl: 'https://api.openweathermap.org/data/2.5',
        timeout: 10000,
        retryAttempts: 3,
        ssl: { verify: true, version: 'TLSv1.2' },
        headers: {}
      },

      authentication: {
        type: AuthenticationType.API_KEY,
        credentials: {},
        expirationHandling: 'none'
      },

      endpoints: [
        {
          id: 'current_weather',
          path: '/weather',
          method: HTTPMethod.GET,
          description: 'Get current weather data',
          parameters: [
            {
              name: 'lat',
              type: 'number',
              location: 'query',
              required: true,
              description: 'Latitude'
            },
            {
              name: 'lon',
              type: 'number',
              location: 'query',
              required: true,
              description: 'Longitude'
            },
            {
              name: 'appid',
              type: 'string',
              location: 'query',
              required: true,
              description: 'API key'
            }
          ],
          response: {
            type: 'object',
            schema: {
              main: {
                temp: 'number',
                humidity: 'number'
              },
              weather: 'array'
            }
          }
        }
      ],

      dataMapping: {
        inputMappings: [],
        outputMappings: [
          {
            source: 'main.temp',
            target: 'temperature_kelvin',
            transformation: 'identity'
          },
          {
            source: 'main.humidity',
            target: 'humidity_percent',
            transformation: 'identity'
          }
        ],
        defaultValues: {},
        conditionalMappings: []
      },

      dataValidation: [
        {
          field: 'temperature_kelvin',
          type: 'range',
          min: 200,
          max: 350,
          required: true
        }
      ],

      syncConfig: {
        mode: SyncMode.PULL,
        frequency: SyncFrequency.HOURLY,
        batchSize: 1,
        conflictResolution: 'latest_wins',
        deltaSync: false
      },

      transformations: [
        {
          name: 'kelvin_to_celsius',
          type: 'function',
          function: 'kelvinToCelsius',
          parameters: {}
        }
      ],

      healthCheck: {
        enabled: true,
        endpoint: '/weather?lat=0&lon=0&appid=test',
        interval: 3600000,
        timeout: 10000,
        expectedStatus: 401 // Unauthorized but service is up
      },

      rateLimits: {
        requests: 1000,
        window: 86400, // 24 hours
        burst: 10
      },

      errorHandling: {
        retryableErrors: ['timeout', 'rate_limit'],
        maxRetries: 3,
        backoffStrategy: 'linear',
        fallbackBehavior: 'cache_last_value'
      },

      capabilities: [
        'current_weather',
        'weather_forecast',
        'historical_weather'
      ],
      supportedActions: [
        'get_weather_data',
        'analyze_weather_patterns'
      ],

      status: IntegrationStatus.ACTIVE,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-09-21')
    });
  }

  private registerComplianceIntegrations(): void {
    // EPA FLIGHT Tool
    this.prebuiltIntegrations.set('epa_flight', {
      id: 'epa_flight',
      name: 'EPA FLIGHT Tool',
      description: 'Integration with EPA FLIGHT for emissions reporting',
      provider: 'U.S. Environmental Protection Agency',
      category: IntegrationCategory.COMPLIANCE_PLATFORMS,
      type: IntegrationType.REST_API,
      version: '1.0.0',

      connectionConfig: {
        baseUrl: 'https://ghgdata.epa.gov/flight/api',
        timeout: 30000,
        retryAttempts: 3,
        ssl: { verify: true, version: 'TLSv1.2' },
        headers: {
          'Accept': 'application/json'
        }
      },

      authentication: {
        type: AuthenticationType.NONE,
        credentials: {},
        expirationHandling: 'none'
      },

      endpoints: [
        {
          id: 'get_emission_factors',
          path: '/ghgp/main/publicsearch/GetEmissionFactor',
          method: HTTPMethod.GET,
          description: 'Get emission factors',
          parameters: [
            {
              name: 'fuelType',
              type: 'string',
              location: 'query',
              required: true,
              description: 'Fuel type'
            }
          ],
          response: {
            type: 'object',
            schema: {
              emissionFactor: 'number',
              unit: 'string'
            }
          }
        }
      ],

      dataMapping: {
        inputMappings: [],
        outputMappings: [],
        defaultValues: {},
        conditionalMappings: []
      },

      dataValidation: [],

      syncConfig: {
        mode: SyncMode.PULL,
        frequency: SyncFrequency.WEEKLY,
        batchSize: 100,
        conflictResolution: 'latest_wins',
        deltaSync: true
      },

      transformations: [],

      healthCheck: {
        enabled: true,
        endpoint: '/health',
        interval: 3600000,
        timeout: 15000,
        expectedStatus: 200
      },

      rateLimits: {
        requests: 100,
        window: 3600,
        burst: 10
      },

      errorHandling: {
        retryableErrors: ['timeout', 'server_error'],
        maxRetries: 3,
        backoffStrategy: 'exponential',
        fallbackBehavior: 'use_default'
      },

      capabilities: [
        'emission_factors',
        'reporting_templates',
        'data_validation'
      ],
      supportedActions: [
        'get_emission_factors',
        'validate_emissions_data'
      ],

      status: IntegrationStatus.ACTIVE,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-09-21')
    });
  }

  private registerERPIntegrations(): void {
    // SAP Integration
    this.prebuiltIntegrations.set('sap_erp', {
      id: 'sap_erp',
      name: 'SAP ERP Integration',
      description: 'Integration with SAP ERP for procurement and financial data',
      provider: 'SAP',
      category: IntegrationCategory.ERP_SYSTEMS,
      type: IntegrationType.REST_API,
      version: '1.0.0',

      connectionConfig: {
        baseUrl: '{sap_base_url}/sap/opu/odata/sap',
        timeout: 60000,
        retryAttempts: 3,
        ssl: { verify: true, version: 'TLSv1.2' },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      },

      authentication: {
        type: AuthenticationType.BASIC_AUTH,
        credentials: {},
        expirationHandling: 'manual_refresh'
      },

      endpoints: [
        {
          id: 'get_purchase_orders',
          path: '/ZMM_PURCHASE_ORDERS_SRV/PurchaseOrderSet',
          method: HTTPMethod.GET,
          description: 'Get purchase orders',
          parameters: [
            {
              name: '$filter',
              type: 'string',
              location: 'query',
              required: false,
              description: 'OData filter expression'
            }
          ],
          response: {
            type: 'object',
            schema: {
              d: {
                results: 'array'
              }
            }
          }
        }
      ],

      dataMapping: {
        inputMappings: [],
        outputMappings: [
          {
            source: 'd.results[*].PurchaseOrder',
            target: 'purchase_order_id',
            transformation: 'array_extract'
          },
          {
            source: 'd.results[*].Vendor',
            target: 'supplier_id',
            transformation: 'array_extract'
          }
        ],
        defaultValues: {},
        conditionalMappings: []
      },

      dataValidation: [
        {
          field: 'purchase_order_id',
          type: 'string',
          required: true
        }
      ],

      syncConfig: {
        mode: SyncMode.PULL,
        frequency: SyncFrequency.DAILY,
        batchSize: 500,
        conflictResolution: 'merge',
        deltaSync: true
      },

      transformations: [
        {
          name: 'odata_transform',
          type: 'function',
          function: 'odataToFlat',
          parameters: {}
        }
      ],

      healthCheck: {
        enabled: true,
        endpoint: '/$metadata',
        interval: 3600000,
        timeout: 30000,
        expectedStatus: 200
      },

      rateLimits: {
        requests: 500,
        window: 3600,
        burst: 25
      },

      errorHandling: {
        retryableErrors: ['timeout', 'server_error'],
        maxRetries: 3,
        backoffStrategy: 'linear',
        fallbackBehavior: 'skip'
      },

      capabilities: [
        'purchase_orders',
        'vendor_data',
        'financial_data'
      ],
      supportedActions: [
        'sync_purchase_data',
        'analyze_supplier_emissions'
      ],

      status: IntegrationStatus.ACTIVE,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-09-21')
    });
  }

  private startHealthMonitoring(): void {
    setInterval(async () => {
      for (const [id, connection] of this.connections) {
        try {
          await connection.performHealthCheck();
        } catch (error) {
          console.error(`Health check failed for ${id}:`, error);
          this.emit('healthCheckFailed', { integrationId: id, error });
        }
      }
    }, 300000); // Every 5 minutes
  }

  private async storeIntegration(integration: IntegrationDefinition): Promise<void> {
    await this.supabase.from('integrations').insert({
      id: integration.id,
      name: integration.name,
      description: integration.description,
      provider: integration.provider,
      category: integration.category,
      type: integration.type,
      version: integration.version,
      configuration: integration,
      status: integration.status,
      created_at: integration.createdAt.toISOString(),
      updated_at: integration.updatedAt.toISOString()
    });
  }
}

// Integration Connection Class
export class IntegrationConnection {
  public readonly id: string;
  private integration: IntegrationDefinition;
  private config: ConnectionOverride;
  private httpClient: AxiosInstance;
  private status: ConnectionStatus;

  constructor(integration: IntegrationDefinition, config: ConnectionOverride = {}) {
    this.id = integration.id;
    this.integration = integration;
    this.config = config;
    this.status = {
      connected: false,
      lastConnected: undefined,
      lastHealthCheck: undefined,
      errorCount: 0
    };

    this.initializeHttpClient();
  }

  public async connect(): Promise<void> {
    try {
      // Authenticate
      await this.authenticate();

      // Test connection
      await this.performHealthCheck();

      this.status.connected = true;
      this.status.lastConnected = new Date();
      this.status.errorCount = 0;

    } catch (error) {
      this.status.connected = false;
      this.status.errorCount++;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    this.status.connected = false;
  }

  public async executeCall(
    endpointId: string,
    parameters: Record<string, any> = {},
    options: CallOptions = {}
  ): Promise<IntegrationCallResult> {
    const endpoint = this.integration.endpoints.find(e => e.id === endpointId);
    if (!endpoint) {
      throw new Error(`Endpoint not found: ${endpointId}`);
    }

    try {
      const url = this.buildUrl(endpoint.path, parameters);
      const config: AxiosRequestConfig = {
        method: endpoint.method,
        url,
        timeout: options.timeout || this.integration.connectionConfig.timeout
      };

      // Add query parameters
      if (endpoint.method === HTTPMethod.GET) {
        config.params = this.extractQueryParameters(endpoint, parameters);
      } else {
        config.data = this.extractBodyParameters(endpoint, parameters);
      }

      const response = await this.httpClient.request(config);

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
        headers: response.headers,
        duration: 0 // Would be measured in real implementation
      };

    } catch (error) {
      this.status.errorCount++;
      throw error;
    }
  }

  public async syncData(options: SyncOptions = {}): Promise<SyncResult> {
    // Implementation would sync data based on sync configuration
    return {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0,
      errors: []
    };
  }

  public async performHealthCheck(): Promise<HealthCheckResult> {
    if (!this.integration.healthCheck.enabled) {
      return {
        healthy: true,
        latency: 0,
        version: this.integration.version,
        capabilities: this.integration.capabilities
      };
    }

    try {
      const start = Date.now();
      const response = await this.httpClient.get(this.integration.healthCheck.endpoint, {
        timeout: this.integration.healthCheck.timeout
      });
      const latency = Date.now() - start;

      const healthy = response.status === this.integration.healthCheck.expectedStatus;

      this.status.lastHealthCheck = new Date();

      return {
        healthy,
        latency,
        version: this.integration.version,
        capabilities: this.integration.capabilities
      };

    } catch (error) {
      this.status.errorCount++;
      return {
        healthy: false,
        latency: -1,
        version: this.integration.version,
        capabilities: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  public getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  // Private methods

  private initializeHttpClient(): void {
    this.httpClient = axios.create({
      baseURL: this.integration.connectionConfig.baseUrl,
      timeout: this.integration.connectionConfig.timeout,
      headers: this.integration.connectionConfig.headers
    });

    // Add request interceptors for authentication
    this.httpClient.interceptors.request.use((config) => {
      return this.addAuthentication(config);
    });

    // Add response interceptors for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => this.handleResponseError(error)
    );
  }

  private async authenticate(): Promise<void> {
    const auth = this.integration.authentication;

    switch (auth.type) {
      case AuthenticationType.API_KEY:
        // API key is added to each request
        break;

      case AuthenticationType.BEARER_TOKEN:
        // Token is added to each request
        break;

      case AuthenticationType.OAUTH2:
        await this.performOAuth2Flow();
        break;

      case AuthenticationType.BASIC_AUTH:
        // Basic auth is added to each request
        break;

      default:
        break;
    }
  }

  private async performOAuth2Flow(): Promise<void> {
    // Implementation would perform OAuth2 flow
    // This is a placeholder
  }

  private addAuthentication(config: AxiosRequestConfig): AxiosRequestConfig {
    const auth = this.integration.authentication;

    switch (auth.type) {
      case AuthenticationType.API_KEY:
        if (auth.credentials.apiKey) {
          config.params = { ...config.params, api_key: auth.credentials.apiKey };
        }
        break;

      case AuthenticationType.BEARER_TOKEN:
        if (auth.credentials.token) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${auth.credentials.token}`
          };
        }
        break;

      case AuthenticationType.BASIC_AUTH:
        if (auth.credentials.username && auth.credentials.password) {
          config.auth = {
            username: auth.credentials.username,
            password: auth.credentials.password
          };
        }
        break;

      default:
        break;
    }

    return config;
  }

  private handleResponseError(error: any): Promise<never> {
    // Implementation would handle different types of errors
    // and apply retry logic based on error handling configuration
    return Promise.reject(error);
  }

  private buildUrl(path: string, parameters: Record<string, any>): string {
    let url = path;

    // Replace path parameters
    for (const [key, value] of Object.entries(parameters)) {
      url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
    }

    return url;
  }

  private extractQueryParameters(endpoint: EndpointDefinition, parameters: Record<string, any>): Record<string, any> {
    const queryParams: Record<string, any> = {};

    for (const param of endpoint.parameters) {
      if (param.location === 'query' && parameters[param.name] !== undefined) {
        queryParams[param.name] = parameters[param.name];
      }
    }

    return queryParams;
  }

  private extractBodyParameters(endpoint: EndpointDefinition, parameters: Record<string, any>): any {
    const bodyParams: Record<string, any> = {};

    for (const param of endpoint.parameters) {
      if (param.location === 'body' && parameters[param.name] !== undefined) {
        bodyParams[param.name] = parameters[param.name];
      }
    }

    return bodyParams;
  }
}

// Additional type definitions and supporting interfaces would go here...
// (Abbreviated for brevity - full implementation would include all types)

export interface ConnectionOverride {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface CallOptions {
  timeout?: number;
  retries?: number;
}

export interface SyncOptions {
  fullSync?: boolean;
  batchSize?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface IntegrationCallResult {
  success: boolean;
  data: any;
  statusCode: number;
  headers: Record<string, string>;
  duration: number;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsDeleted: number;
  errors: string[];
}

export interface TestResult {
  success: boolean;
  latency?: number;
  version?: string;
  capabilities?: string[];
  error?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  lastConnected?: Date;
  lastHealthCheck?: Date;
  errorCount: number;
}

export interface HealthCheckResult {
  healthy: boolean;
  latency: number;
  version: string;
  capabilities: string[];
  error?: string;
}

// Additional interfaces abbreviated for brevity...
export interface FieldMapping { source: string; target: string; transformation: string; }
export interface ConditionalMapping { condition: string; mappings: FieldMapping[]; }
export interface ValidationRule { field: string; type: string; min?: number; max?: number; required?: boolean; }
export interface DataTransformation { name: string; type: string; function: string; parameters: Record<string, any>; }
export interface HealthCheckConfig { enabled: boolean; endpoint: string; interval: number; timeout: number; expectedStatus: number; }
export interface RateLimitConfig { requests: number; window: number; burst?: number; }
export interface ErrorHandlingConfig { retryableErrors: string[]; maxRetries: number; backoffStrategy: string; fallbackBehavior: string; }
export interface IntegrationCapability { }
export interface SSLConfig { verify: boolean; version: string; }
export interface ProxyConfig { host: string; port: number; auth?: { username: string; password: string; }; }
export interface TokenRefreshConfig { enabled: boolean; endpoint: string; grantType: string; }
export interface EndpointParameter { name: string; type: string; location: string; required: boolean; description: string; }
export interface ResponseSchema { type: string; schema: any; }
export type ExpirationHandling = 'auto_refresh' | 'manual_refresh' | 'none';
export type ConflictResolution = 'latest_wins' | 'merge' | 'manual';

// Export singleton instance
export const integrationHub = new IntegrationHub();