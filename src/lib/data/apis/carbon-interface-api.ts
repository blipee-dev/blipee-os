/**
 * Carbon Interface API Integration
 * Provides emission factors and carbon calculations
 */

export interface CarbonInterfaceConfig {
  apiKey: string;
  baseUrl?: string;
  units?: 'metric' | 'imperial';
}

interface EmissionEstimate {
  id: string;
  type: string;
  attributes: {
    country?: string;
    state?: string;
    electricity_unit: string;
    electricity_value: number;
    estimated_at: Date;
    carbon_g: number;
    carbon_lb: number;
    carbon_kg: number;
    carbon_mt: number;
  };
}

interface VehicleEmission {
  distance_unit: string;
  distance_value: number;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  carbon_g: number;
  carbon_kg: number;
  carbon_mt: number;
}

interface FlightEmission {
  passengers: number;
  legs: Array<{
    departure_airport: string;
    destination_airport: string;
    cabin_class: string;
  }>;
  carbon_g: number;
  carbon_kg: number;
  carbon_mt: number;
}

export class CarbonInterfaceAPI {
  private config: CarbonInterfaceConfig;
  private baseUrl: string;

  constructor(config: CarbonInterfaceConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://www.carboninterface.com/api/v1';
  }

  /**
   * Calculate electricity emissions
   */
  async calculateElectricityEmissions(params: {
    electricityValue: number;
    electricityUnit: 'mwh' | 'kwh';
    country?: string;
    state?: string;
  }): Promise<EmissionEstimate> {
    try {
      const response = await fetch(
        `${this.baseUrl}/estimates`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'electricity',
            electricity_unit: params.electricityUnit,
            electricity_value: params.electricityValue,
            country: params.country,
            state: params.state
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        id: data.data.id,
        type: data.data.type,
        attributes: {
          ...data.data.attributes,
          estimated_at: new Date(data.data.attributes.estimated_at)
        }
      };
    } catch (error) {
      console.error('Electricity emissions API error:', error);
      return this.getMockElectricityEmissions(params);
    }
  }

  /**
   * Calculate vehicle emissions
   */
  async calculateVehicleEmissions(params: {
    distanceValue: number;
    distanceUnit: 'km' | 'mi';
    vehicleMake: string;
    vehicleModel: string;
    vehicleYear: number;
  }): Promise<VehicleEmission> {
    try {
      const response = await fetch(
        `${this.baseUrl}/estimates`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'vehicle',
            distance_unit: params.distanceUnit,
            distance_value: params.distanceValue,
            vehicle_make: params.vehicleMake,
            vehicle_model: params.vehicleModel,
            vehicle_year: params.vehicleYear
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.data.attributes;
    } catch (error) {
      console.error('Vehicle emissions API error:', error);
      return this.getMockVehicleEmissions(params);
    }
  }

  /**
   * Calculate flight emissions
   */
  async calculateFlightEmissions(params: {
    passengers: number;
    legs: Array<{
      departureAirport: string;
      destinationAirport: string;
      cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
    }>;
  }): Promise<FlightEmission> {
    try {
      const response = await fetch(
        `${this.baseUrl}/estimates`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'flight',
            passengers: params.passengers,
            legs: params.legs.map(leg => ({
              departure_airport: leg.departureAirport,
              destination_airport: leg.destinationAirport,
              cabin_class: leg.cabinClass || 'economy'
            }))
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        passengers: params.passengers,
        legs: params.legs.map(leg => ({
          departure_airport: leg.departureAirport,
          destination_airport: leg.destinationAirport,
          cabin_class: leg.cabinClass || 'economy'
        })),
        ...data.data.attributes
      };
    } catch (error) {
      console.error('Flight emissions API error:', error);
      return this.getMockFlightEmissions(params);
    }
  }

  /**
   * Calculate shipping emissions
   */
  async calculateShippingEmissions(params: {
    weightValue: number;
    weightUnit: 'g' | 'kg' | 'lb' | 'mt';
    distanceValue: number;
    distanceUnit: 'km' | 'mi';
    transportMethod: 'ship' | 'train' | 'truck' | 'plane';
  }): Promise<{
    weightValue: number;
    weightUnit: string;
    distanceValue: number;
    distanceUnit: string;
    transportMethod: string;
    carbonG: number;
    carbonKg: number;
    carbonMt: number;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/estimates`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'shipping',
            weight_unit: params.weightUnit,
            weight_value: params.weightValue,
            distance_unit: params.distanceUnit,
            distance_value: params.distanceValue,
            transport_method: params.transportMethod
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        weightValue: params.weightValue,
        weightUnit: params.weightUnit,
        distanceValue: params.distanceValue,
        distanceUnit: params.distanceUnit,
        transportMethod: params.transportMethod,
        carbonG: data.data.attributes.carbon_g,
        carbonKg: data.data.attributes.carbon_kg,
        carbonMt: data.data.attributes.carbon_mt
      };
    } catch (error) {
      console.error('Shipping emissions API error:', error);
      return this.getMockShippingEmissions(params);
    }
  }

  /**
   * Get emission factors by category
   */
  async getEmissionFactors(category?: string): Promise<Array<{
    id: string;
    type: string;
    attributes: {
      name: string;
      category: string;
      calculationMethod: string;
      sourceDataset: string;
      factorValue: number;
      unit: string;
    };
  }>> {
    try {
      const url = category 
        ? `${this.baseUrl}/emission_factors?category=${category}`
        : `${this.baseUrl}/emission_factors`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Emission factors API error:', error);
      return this.getMockEmissionFactors(category);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/emission_factors?per_page=1`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
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

  // Mock data for development/testing
  private getMockElectricityEmissions(params: any): EmissionEstimate {
    // Standard emission factors (kg CO2/kWh)
    const factors = {
      'US': 0.4,
      'US-CA': 0.25,
      'US-TX': 0.45,
      'DE': 0.35,
      'FR': 0.06,
      'GB': 0.28,
      'IN': 0.7,
      'CN': 0.6,
      'AU': 0.8
    };

    const factor = factors[params.country || 'US'] || 0.4;
    const kwhValue = params.electricityUnit === 'mwh' ? params.electricityValue * 1000 : params.electricityValue;
    const carbonKg = kwhValue * factor;

    return {
      id: `mock-${Date.now()}`,
      type: 'electricity',
      attributes: {
        country: params.country || 'US',
        state: params.state,
        electricity_unit: params.electricityUnit,
        electricity_value: params.electricityValue,
        estimated_at: new Date(),
        carbon_g: carbonKg * 1000,
        carbon_lb: carbonKg * 2.20462,
        carbon_kg: carbonKg,
        carbon_mt: carbonKg / 1000
      }
    };
  }

  private getMockVehicleEmissions(params: any): VehicleEmission {
    // Mock fuel efficiency (L/100km or mpg)
    const efficiencyFactors = {
      'Toyota-Prius': 4.0, // L/100km
      'Ford-F150': 12.0,
      'Tesla-Model-3': 0.0, // Electric
      'BMW-X5': 9.5,
      'Honda-Civic': 6.5
    };

    const key = `${params.vehicleMake}-${params.vehicleModel}`;
    const efficiency = efficiencyFactors[key] || 8.0; // Default L/100km

    const kmValue = params.distanceUnit === 'mi' ? params.distanceValue * 1.60934 : params.distanceValue;
    const liters = (kmValue / 100) * efficiency;
    const carbonKg = liters * 2.31; // kg CO2 per liter of gasoline

    return {
      distance_unit: params.distanceUnit,
      distance_value: params.distanceValue,
      vehicle_make: params.vehicleMake,
      vehicle_model: params.vehicleModel,
      vehicle_year: params.vehicleYear,
      carbon_g: carbonKg * 1000,
      carbon_kg: carbonKg,
      carbon_mt: carbonKg / 1000
    };
  }

  private getMockFlightEmissions(params: any): FlightEmission {
    // Rough distance calculation and emission factors
    const totalDistance = params.legs.length * 2000; // Assume 2000km per leg
    const baseEmission = totalDistance * 0.2; // kg CO2 per km per passenger
    const carbonKg = baseEmission * params.passengers;

    return {
      passengers: params.passengers,
      legs: params.legs.map(leg => ({
        departure_airport: leg.departureAirport,
        destination_airport: leg.destinationAirport,
        cabin_class: leg.cabinClass || 'economy'
      })),
      carbon_g: carbonKg * 1000,
      carbon_kg: carbonKg,
      carbon_mt: carbonKg / 1000
    };
  }

  private getMockShippingEmissions(params: any): any {
    // Emission factors by transport method (kg CO2 per tonne-km)
    const factors = {
      ship: 0.015,
      train: 0.04,
      truck: 0.08,
      plane: 0.5
    };

    const factor = factors[params.transportMethod] || 0.08;
    const tonneValue = params.weightUnit === 'kg' ? params.weightValue / 1000 : 
                      params.weightUnit === 'g' ? params.weightValue / 1000000 :
                      params.weightUnit === 'lb' ? params.weightValue * 0.000453592 :
                      params.weightValue; // mt

    const kmValue = params.distanceUnit === 'mi' ? params.distanceValue * 1.60934 : params.distanceValue;
    const carbonKg = tonneValue * kmValue * factor;

    return {
      weightValue: params.weightValue,
      weightUnit: params.weightUnit,
      distanceValue: params.distanceValue,
      distanceUnit: params.distanceUnit,
      transportMethod: params.transportMethod,
      carbonG: carbonKg * 1000,
      carbonKg: carbonKg,
      carbonMt: carbonKg / 1000
    };
  }

  private getMockEmissionFactors(category?: string): any[] {
    const factors = [
      {
        id: 'electricity-us',
        type: 'emission_factor',
        attributes: {
          name: 'US Grid Electricity',
          category: 'electricity',
          calculationMethod: 'emission_factor',
          sourceDataset: 'EPA eGRID',
          factorValue: 0.4,
          unit: 'kg_co2_per_kwh'
        }
      },
      {
        id: 'gasoline',
        type: 'emission_factor',
        attributes: {
          name: 'Gasoline',
          category: 'fuel',
          calculationMethod: 'emission_factor',
          sourceDataset: 'EPA',
          factorValue: 2.31,
          unit: 'kg_co2_per_liter'
        }
      },
      {
        id: 'natural-gas',
        type: 'emission_factor',
        attributes: {
          name: 'Natural Gas',
          category: 'fuel',
          calculationMethod: 'emission_factor',
          sourceDataset: 'EPA',
          factorValue: 1.93,
          unit: 'kg_co2_per_cubic_meter'
        }
      }
    ];

    return category ? factors.filter(f => f.attributes.category === category) : factors;
  }
}