/**
 * Weather API Integration
 * Provides real-time weather data for energy optimization
 */

export interface WeatherAPIConfig {
  apiKey: string;
  baseUrl?: string;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

export class WeatherAPI {
  private config: WeatherAPIConfig;
  private baseUrl: string;
  private requestCount: number = 0;
  private windowStart: number = Date.now();

  constructor(config: WeatherAPIConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.openweathermap.org/data/3.0';
  }

  /**
   * Get current weather data
   */
  async getCurrentWeather(params: {
    lat: number;
    lon: number;
  }): Promise<any> {
    await this.checkRateLimit();

    try {
      const response = await fetch(
        `${this.baseUrl}/onecall?lat=${params.lat}&lon=${params.lon}&appid=${this.config.apiKey}&units=metric&exclude=minutely`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        current: {
          temperature: data.current.temp,
          feelsLike: data.current.feels_like,
          humidity: data.current.humidity,
          pressure: data.current.pressure,
          windSpeed: data.current.wind_speed,
          windDirection: data.current.wind_deg,
          cloudCover: data.current.clouds,
          uvIndex: data.current.uvi,
          visibility: data.current.visibility,
          dewPoint: data.current.dew_point,
          weather: data.current.weather[0],
          timestamp: new Date(data.current.dt * 1000)
        },
        hourly: data.hourly.slice(0, 48).map((hour: any) => ({
          timestamp: new Date(hour.dt * 1000),
          temperature: hour.temp,
          feelsLike: hour.feels_like,
          humidity: hour.humidity,
          cloudCover: hour.clouds,
          windSpeed: hour.wind_speed,
          pop: hour.pop, // Probability of precipitation
          rain: hour.rain?.['1h'] || 0,
          weather: hour.weather[0]
        })),
        daily: data.daily.map((day: any) => ({
          date: new Date(day.dt * 1000),
          temperature: {
            min: day.temp.min,
            max: day.temp.max,
            day: day.temp.day,
            night: day.temp.night,
            eve: day.temp.eve,
            morn: day.temp.morn
          },
          humidity: day.humidity,
          windSpeed: day.wind_speed,
          weather: day.weather[0],
          pop: day.pop,
          rain: day.rain || 0,
          uvi: day.uvi
        })),
        alerts: data.alerts || []
      };
    } catch (error) {
      console.error('Weather API error:', error);
      throw error;
    }
  }

  /**
   * Get historical weather data
   */
  async getHistoricalWeather(params: {
    lat: number;
    lon: number;
    date: Date;
  }): Promise<any> {
    await this.checkRateLimit();

    const timestamp = Math.floor(params.date.getTime() / 1000);

    try {
      const response = await fetch(
        `${this.baseUrl}/timemachine?lat=${params.lat}&lon=${params.lon}&dt=${timestamp}&appid=${this.config.apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Historical weather API error:', error);
      throw error;
    }
  }

  /**
   * Get air quality data
   */
  async getAirQuality(params: {
    lat: number;
    lon: number;
  }): Promise<any> {
    await this.checkRateLimit();

    try {
      const response = await fetch(
        `http://api.openweathermap.org/data/2.5/air_pollution?lat=${params.lat}&lon=${params.lon}&appid=${this.config.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Air quality API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        aqi: data.list[0].main.aqi,
        components: data.list[0].components,
        timestamp: new Date(data.list[0].dt * 1000)
      };
    } catch (error) {
      console.error('Air quality API error:', error);
      throw error;
    }
  }

  /**
   * Get weather-based energy recommendations
   */
  async getEnergyRecommendations(weatherData: any): Promise<{
    hvac: any;
    renewable: any;
    alerts: any[];
  }> {
    const { current, hourly, daily } = weatherData;

    // HVAC recommendations based on temperature
    const hvacRecommendations = this.calculateHVACRecommendations(current, hourly);

    // Renewable energy potential
    const renewableRecommendations = this.calculateRenewablePotential(current, daily);

    // Energy alerts based on weather
    const alerts = this.generateEnergyAlerts(weatherData);

    return {
      hvac: hvacRecommendations,
      renewable: renewableRecommendations,
      alerts
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/onecall?lat=0&lon=0&appid=${this.config.apiKey}&exclude=all`
      );

      return {
        healthy: response.ok,
        error: response.ok ? undefined : response.statusText
      };
    } catch (error) {
      return {
        healthy: false,
        error: String(error)
      };
    }
  }

  // Private helper methods

  private async checkRateLimit(): Promise<void> {
    if (!this.config.rateLimit) return;

    const now = Date.now();
    if (now - this.windowStart > this.config.rateLimit.windowMs) {
      // Reset window
      this.requestCount = 0;
      this.windowStart = now;
    }

    if (this.requestCount >= this.config.rateLimit.requests) {
      const waitTime = this.config.rateLimit.windowMs - (now - this.windowStart);
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds`);
    }

    this.requestCount++;
  }

  private calculateHVACRecommendations(current: any, hourly: any[]): any {
    const recommendations = {
      mode: 'auto',
      setpoint: 22,
      schedule: [] as any[],
      savings: 0
    };

    // Determine HVAC mode based on temperature
    if (current.temperature < 16) {
      recommendations.mode = 'heating';
      recommendations.setpoint = 20;
    } else if (current.temperature > 26) {
      recommendations.mode = 'cooling';
      recommendations.setpoint = 24;
    }

    // Create optimal schedule based on hourly forecast
    const next24Hours = hourly.slice(0, 24);
    let peakHours = 0;
    let offPeakHours = 0;

    next24Hours.forEach((hour, index) => {
      const hourOfDay = new Date(hour.timestamp).getHours();
      const isOccupied = hourOfDay >= 8 && hourOfDay < 18; // Business hours
      
      let setpoint = 22;
      if (hour.temperature < 15) {
        setpoint = isOccupied ? 21 : 18;
      } else if (hour.temperature > 25) {
        setpoint = isOccupied ? 23 : 26;
      }

      recommendations.schedule.push({
        hour: hourOfDay,
        setpoint,
        mode: hour.temperature < 18 ? 'heating' : hour.temperature > 24 ? 'cooling' : 'auto'
      });

      // Calculate potential savings
      if (hourOfDay >= 9 && hourOfDay < 17) {
        peakHours++;
      } else {
        offPeakHours++;
      }
    });

    // Estimate savings from optimized scheduling
    recommendations.savings = Math.round((offPeakHours / 24) * 30); // % savings

    return recommendations;
  }

  private calculateRenewablePotential(current: any, daily: any[]): any {
    const solarPotential = {
      current: (100 - current.cloudCover) * (current.uvIndex / 11) * 100,
      forecast: daily.slice(0, 7).map(day => ({
        date: day.date,
        potential: (100 - (day.weather.clouds || 50)) * (day.uvi / 11) * 100,
        optimal: day.uvi > 6 && day.weather.clouds < 40
      })),
      recommendation: ''
    };

    const windPotential = {
      current: Math.min(current.windSpeed / 15 * 100, 100), // 15 m/s is optimal
      forecast: daily.slice(0, 7).map(day => ({
        date: day.date,
        potential: Math.min(day.windSpeed / 15 * 100, 100),
        optimal: day.windSpeed > 5 && day.windSpeed < 20
      })),
      recommendation: ''
    };

    // Generate recommendations
    if (solarPotential.current > 70) {
      solarPotential.recommendation = 'Excellent solar generation conditions';
    } else if (solarPotential.current < 30) {
      solarPotential.recommendation = 'Poor solar conditions - rely on grid or storage';
    }

    if (windPotential.current > 60) {
      windPotential.recommendation = 'Good wind generation potential';
    }

    return { solar: solarPotential, wind: windPotential };
  }

  private generateEnergyAlerts(weatherData: any): any[] {
    const alerts = [];
    const { current, hourly, alerts: weatherAlerts } = weatherData;

    // Temperature extremes
    if (current.temperature < 0 || current.temperature > 35) {
      alerts.push({
        type: 'temperature',
        severity: 'high',
        message: `Extreme temperature (${current.temperature}°C) will increase HVAC demand`,
        action: 'Prepare for increased energy consumption'
      });
    }

    // Check for temperature swings
    const next12Hours = hourly.slice(0, 12);
    const tempRange = Math.max(...next12Hours.map(h => h.temperature)) - 
                     Math.min(...next12Hours.map(h => h.temperature));
    
    if (tempRange > 15) {
      alerts.push({
        type: 'temperature_swing',
        severity: 'medium',
        message: `Large temperature variation expected (${tempRange}°C)`,
        action: 'Adjust HVAC schedules to minimize energy spikes'
      });
    }

    // Weather alerts
    weatherAlerts?.forEach((alert: any) => {
      alerts.push({
        type: 'weather',
        severity: alert.tags?.includes('extreme') ? 'high' : 'medium',
        message: alert.event,
        description: alert.description,
        action: 'Review emergency energy procedures'
      });
    });

    return alerts;
  }
}