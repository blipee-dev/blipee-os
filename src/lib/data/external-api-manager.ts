import { weatherAPI } from './external-apis';
import { ElectricityMapsAPIClient } from './electricity-maps';
import { createClient } from '@supabase/supabase-js';

interface APIConnection {
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: Date;
  errorMessage?: string;
}

export class ExternalAPIManager {
  private static instance: ExternalAPIManager;
  private weatherAPI: any;
  private carbonAPI: ElectricityMapsAPIClient;
  private supabase: any;
  private connections: Map<string, APIConnection> = new Map();
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.weatherAPI = weatherAPI;
    this.carbonAPI = new ElectricityMapsAPIClient(process.env.ELECTRICITY_MAPS_API_KEY || '');
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Initialize connection statuses
    this.connections.set('weather', { name: 'Weather API', status: 'disconnected' });
    this.connections.set('carbon', { name: 'Carbon Intensity API', status: 'disconnected' });
    this.connections.set('regulatory', { name: 'Regulatory API', status: 'disconnected' });
  }

  static getInstance(): ExternalAPIManager {
    if (!ExternalAPIManager.instance) {
      ExternalAPIManager.instance = new ExternalAPIManager();
    }
    return ExternalAPIManager.instance;
  }

  /**
   * Connect and start all external data feeds
   */
  async connectAllAPIs(organizationId: string): Promise<void> {
    console.log('🔌 Connecting to external APIs...');

    // Connect weather API
    await this.connectWeatherAPI(organizationId);

    // Connect carbon intensity API
    await this.connectCarbonAPI(organizationId);

    // Connect regulatory API (placeholder)
    await this.connectRegulatoryAPI(organizationId);

    console.log('✅ External APIs connected');
  }

  /**
   * Connect to weather API and start syncing
   */
  private async connectWeatherAPI(organizationId: string): Promise<void> {
    try {
      if (!process.env.OPENWEATHERMAP_API_KEY) {
        console.warn('⚠️ Weather API key not configured');
        this.updateConnectionStatus('weather', 'error', 'API key not configured');
        return;
      }

      // Get building locations
      const { data: buildings, error } = await this.supabase
        .from('buildings')
        .select('id, name, latitude, longitude')
        .eq('organization_id', organizationId);

      if (error || !buildings || buildings.length === 0) {
        console.warn('⚠️ No buildings found for weather data');
        this.updateConnectionStatus('weather', 'error', 'No buildings configured');
        return;
      }

      // Start weather sync (every 30 minutes)
      const syncInterval = setInterval(async () => {
        await this.syncWeatherData(organizationId, buildings);
      }, 1800000); // 30 minutes

      this.syncIntervals.set('weather', syncInterval);

      // Initial sync
      await this.syncWeatherData(organizationId, buildings);

      this.updateConnectionStatus('weather', 'connected');
      console.log('✅ Weather API connected');

    } catch (error) {
      console.error('❌ Weather API connection error:', error);
      this.updateConnectionStatus('weather', 'error', error.message);
    }
  }

  /**
   * Sync weather data for all buildings
   */
  private async syncWeatherData(organizationId: string, buildings: any[]): Promise<void> {
    console.log('🌤️ Syncing weather data...');
    
    for (const building of buildings) {
      try {
        // Get current weather
        const weatherData = await this.weatherAPI.getWeatherData({
          lat: building.latitude,
          lon: building.longitude
        });

        if (weatherData) {
          // Store weather data
          await this.supabase.from('weather_data').insert({
            building_id: building.id,
            organization_id: organizationId,
            temperature: weatherData.current?.temperature || 0,
            feels_like: weatherData.current?.feelsLike || 0,
            humidity: weatherData.current?.humidity || 0,
            pressure: weatherData.current?.pressure || 0,
            weather_condition: weatherData.current?.conditions || 'Unknown',
            weather_description: weatherData.current?.description || '',
            wind_speed: weatherData.current?.windSpeed || 0,
            wind_direction: weatherData.current?.windDirection || 0,
            clouds: weatherData.current?.cloudCover || 0,
            timestamp: new Date().toISOString()
          });

          // Check for extreme conditions
          await this.checkWeatherAlerts(building, weatherData);
        }
      } catch (error) {
        console.error(`❌ Weather sync error for ${building.name}:`, error);
      }
    }

    this.updateConnectionStatus('weather', 'connected', null, new Date());
  }

  /**
   * Connect to carbon intensity API
   */
  private async connectCarbonAPI(organizationId: string): Promise<void> {
    try {
      if (!process.env.ELECTRICITY_MAPS_API_KEY) {
        console.warn('⚠️ Carbon intensity API key not configured');
        this.updateConnectionStatus('carbon', 'error', 'API key not configured');
        return;
      }

      // Get building locations for grid zones
      const { data: buildings } = await this.supabase
        .from('buildings')
        .select('id, name, latitude, longitude, country')
        .eq('organization_id', organizationId);

      if (!buildings || buildings.length === 0) {
        this.updateConnectionStatus('carbon', 'error', 'No buildings configured');
        return;
      }

      // Start carbon intensity sync (every 5 minutes for real-time data)
      const syncInterval = setInterval(async () => {
        await this.syncCarbonIntensity(organizationId, buildings);
      }, 300000); // 5 minutes

      this.syncIntervals.set('carbon', syncInterval);

      // Initial sync
      await this.syncCarbonIntensity(organizationId, buildings);

      this.updateConnectionStatus('carbon', 'connected');
      console.log('✅ Carbon intensity API connected');

    } catch (error) {
      console.error('❌ Carbon API connection error:', error);
      this.updateConnectionStatus('carbon', 'error', error.message);
    }
  }

  /**
   * Sync carbon intensity data
   */
  private async syncCarbonIntensity(organizationId: string, buildings: any[]): Promise<void> {
    console.log('⚡ Syncing carbon intensity data...');

    // Get unique zones
    const zones = new Set(buildings.map(b => this.getGridZone(b.country, b.latitude, b.longitude)));

    for (const zone of zones) {
      try {
        const carbonData = await this.carbonAPI.getCarbonIntensity(zone);

        if (carbonData) {
          // Store carbon intensity data
          await this.supabase.from('carbon_intensity').insert({
            organization_id: organizationId,
            zone,
            carbon_intensity: carbonData.carbonIntensity,
            fossil_fuel_percentage: carbonData.fossilFuelPercentage,
            renewable_percentage: 100 - carbonData.fossilFuelPercentage,
            data_source: 'electricity_maps',
            timestamp: new Date().toISOString()
          });

          // Alert if high carbon period
          if (carbonData.carbonIntensity > 400) {
            await this.createCarbonAlert(organizationId, zone, carbonData);
          }
        }
      } catch (error) {
        console.error(`❌ Carbon intensity sync error for ${zone}:`, error);
      }
    }

    this.updateConnectionStatus('carbon', 'connected', null, new Date());
  }

  /**
   * Connect to regulatory API (placeholder)
   */
  private async connectRegulatoryAPI(organizationId: string): Promise<void> {
    // This would connect to regulatory update services
    // For now, it's a placeholder
    console.log('📜 Regulatory API connection pending implementation');
    this.updateConnectionStatus('regulatory', 'disconnected', 'Not yet implemented');
  }

  /**
   * Get relevant data based on query context
   */
  async getRelevantData(intent: any): Promise<any> {
    const data: any = {};

    // Get weather data if relevant
    if (intent.type === 'energy_optimization' || intent.context?.includesWeather) {
      const { data: weatherData } = await this.supabase
        .from('weather_data')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1);
      
      data.currentWeather = weatherData?.[0];
    }

    // Get carbon intensity if relevant
    if (intent.type === 'emission_query' || intent.type === 'carbon_optimization') {
      const { data: carbonData } = await this.supabase
        .from('carbon_intensity')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1);
      
      data.currentCarbonIntensity = carbonData?.[0];
    }

    return data;
  }

  /**
   * Disconnect all APIs
   */
  async disconnectAll(): Promise<void> {
    console.log('🔌 Disconnecting external APIs...');

    // Clear all intervals
    for (const [key, interval] of this.syncIntervals) {
      clearInterval(interval);
    }
    this.syncIntervals.clear();

    // Update statuses
    for (const [key, connection] of this.connections) {
      connection.status = 'disconnected';
    }

    console.log('✅ External APIs disconnected');
  }

  /**
   * Get connection statuses
   */
  getConnectionStatuses(): APIConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Helper methods
   */
  private updateConnectionStatus(
    api: string,
    status: 'connected' | 'disconnected' | 'error',
    errorMessage?: string,
    lastSync?: Date
  ): void {
    const connection = this.connections.get(api);
    if (connection) {
      connection.status = status;
      connection.errorMessage = errorMessage;
      connection.lastSync = lastSync;
    }
  }

  private getGridZone(country: string, latitude: number, longitude: number): string {
    // Simplified grid zone mapping
    // In production, this would use proper grid zone detection
    const zoneMap: Record<string, string> = {
      'US': 'US-CAL-CISO',
      'UK': 'GB',
      'DE': 'DE',
      'FR': 'FR',
      'ES': 'ES',
      'IT': 'IT',
      'JP': 'JP',
      'AU': 'AU-NSW'
    };

    return zoneMap[country] || 'EU';
  }

  private async checkWeatherAlerts(building: any, weatherData: any): Promise<void> {
    // Check for extreme temperatures
    const temp = weatherData.current?.temperature || 0;
    if (temp > 35 || temp < 0) {
      await this.supabase.from('weather_alerts').insert({
        building_id: building.id,
        alert_type: 'extreme_temperature',
        severity: 'high',
        temperature: temp,
        message: `Extreme temperature detected: ${temp}°C`,
        created_at: new Date().toISOString()
      });
    }

    // Check for weather alerts
    if (weatherData.alerts && weatherData.alerts.length > 0) {
      for (const alert of weatherData.alerts) {
        await this.supabase.from('weather_alerts').insert({
          building_id: building.id,
          alert_type: 'severe_weather',
          severity: alert.severity || 'high',
          condition: alert.event || 'Unknown',
          message: alert.description || 'Severe weather alert',
          created_at: new Date().toISOString()
        });
      }
    }
  }

  private async createCarbonAlert(
    organizationId: string,
    zone: string,
    carbonData: any
  ): Promise<void> {
    await this.supabase.from('carbon_alerts').insert({
      organization_id: organizationId,
      zone,
      alert_type: 'high_carbon_intensity',
      carbon_intensity: carbonData.carbonIntensity,
      message: `High carbon intensity detected: ${carbonData.carbonIntensity} gCO2/kWh. Consider shifting flexible loads.`,
      created_at: new Date().toISOString()
    });
  }
}