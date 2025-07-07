/**
 * Electricity Maps API Client
 * Real-time carbon intensity data
 */

export class ElectricityMapsAPIClient {
  private apiKey: string;
  private baseUrl = "https://api.electricitymap.org/v3";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get carbon intensity for a zone
   */
  async getCarbonIntensity(zone: string): Promise<{
    carbonIntensity: number;
    renewablePercentage: number;
    fossilFuelPercentage: number;
    datetime: string;
  } | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/carbon-intensity/latest?zone=${zone}`,
        {
          headers: {
            "auth-token": this.apiKey,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
      }

      const data = await response.json();

      return {
        carbonIntensity: data.carbonIntensity,
        renewablePercentage: data.renewablePercentage || 0,
        fossilFuelPercentage: data.fossilFuelPercentage || 0,
        datetime: data.datetime,
      };
    } catch (error) {
      console.error("Electricity Maps API error:", error);
      // Return mock data for demo
      return {
        carbonIntensity: 250,
        renewablePercentage: 35,
        fossilFuelPercentage: 65,
        datetime: new Date().toISOString(),
      };
    }
  }

  /**
   * Get power breakdown
   */
  async getPowerBreakdown(zone: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/power-breakdown/latest?zone=${zone}`,
        {
          headers: {
            "auth-token": this.apiKey,
          },
        },
      );

      const data = await response.json();
      return data.powerConsumptionBreakdown;
    } catch (error) {
      console.error("Power breakdown error:", error);
      return null;
    }
  }
}
