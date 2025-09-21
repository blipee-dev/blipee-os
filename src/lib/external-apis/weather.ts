/**
 * Weather API Integration
 * Provides real-time weather data for building optimization
 */

interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_deg: number;
  clouds: number;
  weather: {
    main: string;
    description: string;
    icon: string;
  };
  uvi?: number;
  visibility?: number;
  air_quality?: {
    aqi: number;
    pm2_5: number;
    pm10: number;
    no2: number;
    o3: number;
    co: number;
  };
}

interface WeatherForecast {
  hourly: WeatherData[];
  daily: WeatherData[];
  alerts?: {
    event: string;
    start: Date;
    end: Date;
    description: string;
  }[];
}

export class WeatherService {
  private apiKey: string;
  private baseUrl = 'https://api.openweathermap.org/data/2.5';
  private cache: Map<string, { data: any; expires: number }> = new Map();

  constructor() {
    this.apiKey = process.env.OPENWEATHERMAP_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenWeatherMap API key not configured');
    }
  }

  /**
   * Get current weather for a location
   */
  async getCurrentWeather(lat: number, lon: number): Promise<WeatherData | null> {
    if (!this.apiKey) return null;

    const cacheKey = `current-${lat}-${lon}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();

      const weatherData: WeatherData = {
        temp: data.main.temp,
        feels_like: data.main.feels_like,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        wind_speed: data.wind.speed,
        wind_deg: data.wind.deg,
        clouds: data.clouds.all,
        weather: {
          main: data.weather[0].main,
          description: data.weather[0].description,
          icon: data.weather[0].icon,
        },
        visibility: data.visibility,
      };

      // Cache for 10 minutes
      this.setCache(cacheKey, weatherData, 10 * 60 * 1000);
      return weatherData;
    } catch (error) {
      console.error('Error fetching weather:', error);
      return null;
    }
  }

  /**
   * Get weather forecast
   */
  async getForecast(lat: number, lon: number): Promise<WeatherForecast | null> {
    if (!this.apiKey) return null;

    const cacheKey = `forecast-${lat}-${lon}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${this.baseUrl}/onecall?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&exclude=minutely`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();

      const forecast: WeatherForecast = {
        hourly: data.hourly.map((hour: any) => ({
          temp: hour.temp,
          feels_like: hour.feels_like,
          humidity: hour.humidity,
          pressure: hour.pressure,
          wind_speed: hour.wind_speed,
          wind_deg: hour.wind_deg,
          clouds: hour.clouds,
          weather: {
            main: hour.weather[0].main,
            description: hour.weather[0].description,
            icon: hour.weather[0].icon,
          },
          uvi: hour.uvi,
        })),
        daily: data.daily.map((day: any) => ({
          temp: day.temp.day,
          feels_like: day.feels_like.day,
          humidity: day.humidity,
          pressure: day.pressure,
          wind_speed: day.wind_speed,
          wind_deg: day.wind_deg,
          clouds: day.clouds,
          weather: {
            main: day.weather[0].main,
            description: day.weather[0].description,
            icon: day.weather[0].icon,
          },
          uvi: day.uvi,
        })),
        alerts: data.alerts?.map((alert: any) => ({
          event: alert.event,
          start: new Date(alert.start * 1000),
          end: new Date(alert.end * 1000),
          description: alert.description,
        })),
      };

      // Cache for 30 minutes
      this.setCache(cacheKey, forecast, 30 * 60 * 1000);
      return forecast;
    } catch (error) {
      console.error('Error fetching forecast:', error);
      return null;
    }
  }

  /**
   * Get air quality data
   */
  async getAirQuality(lat: number, lon: number): Promise<any> {
    if (!this.apiKey) return null;

    const cacheKey = `air-${lat}-${lon}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${this.baseUrl}/air_pollution?lat=${lat}&lon=${lon}&appid=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Air quality API error: ${response.status}`);
      }

      const data = await response.json();
      const airQuality = {
        aqi: data.list[0].main.aqi,
        components: data.list[0].components,
        ...this.interpretAQI(data.list[0].main.aqi),
      };

      // Cache for 30 minutes
      this.setCache(cacheKey, airQuality, 30 * 60 * 1000);
      return airQuality;
    } catch (error) {
      console.error('Error fetching air quality:', error);
      return null;
    }
  }

  /**
   * Get weather insights for building optimization
   */
  async getOptimizationInsights(lat: number, lon: number): Promise<any> {
    const [current, forecast, airQuality] = await Promise.all([
      this.getCurrentWeather(lat, lon),
      this.getForecast(lat, lon),
      this.getAirQuality(lat, lon),
    ]);

    if (!current) return null;

    const insights = {
      current,
      forecast,
      airQuality,
      recommendations: [],
      hvacOptimization: null,
    };

    // Generate HVAC optimization recommendations
    if (current.temp > 25 && current.humidity > 70) {
      insights.recommendations.push({
        type: 'cooling',
        message: 'High temperature and humidity detected. Consider increasing cooling and dehumidification.',
        priority: 'high',
        estimatedSavings: '5-10%',
      });
    }

    if (current.temp < 10 && current.wind_speed > 5) {
      insights.recommendations.push({
        type: 'heating',
        message: 'Cold and windy conditions. Check building envelope for air leaks.',
        priority: 'medium',
        estimatedSavings: '3-7%',
      });
    }

    // Air quality recommendations
    if (airQuality?.aqi > 3) {
      insights.recommendations.push({
        type: 'air_quality',
        message: 'Poor air quality detected. Increase filtration and limit fresh air intake.',
        priority: 'high',
        healthImpact: 'significant',
      });
    }

    // Predictive optimization
    if (forecast?.hourly) {
      const next6Hours = forecast.hourly.slice(0, 6);
      const avgTemp = next6Hours.reduce((sum, h) => sum + h.temp, 0) / 6;

      insights.hvacOptimization = {
        preHeat: avgTemp < 15,
        preCool: avgTemp > 28,
        optimalStartTime: this.calculateOptimalStartTime(current.temp, avgTemp),
      };
    }

    return insights;
  }

  /**
   * Interpret AQI value
   */
  private interpretAQI(aqi: number) {
    const levels = [
      { value: 1, label: 'Good', color: 'green', healthAdvice: 'Air quality is satisfactory' },
      { value: 2, label: 'Fair', color: 'yellow', healthAdvice: 'Acceptable for most' },
      { value: 3, label: 'Moderate', color: 'orange', healthAdvice: 'Sensitive groups may be affected' },
      { value: 4, label: 'Poor', color: 'red', healthAdvice: 'Everyone may experience effects' },
      { value: 5, label: 'Very Poor', color: 'purple', healthAdvice: 'Health warnings' },
    ];

    return levels[aqi - 1] || levels[4];
  }

  /**
   * Calculate optimal HVAC start time
   */
  private calculateOptimalStartTime(currentTemp: number, targetTemp: number): string {
    const tempDiff = Math.abs(currentTemp - targetTemp);
    const minutesNeeded = tempDiff * 15; // Rough estimate: 15 minutes per degree

    const now = new Date();
    const startTime = new Date(now.getTime() - minutesNeeded * 60000);

    return startTime.toLocaleTimeString();
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl: number) {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
    });
  }
}

// Singleton instance
export const weatherService = new WeatherService();