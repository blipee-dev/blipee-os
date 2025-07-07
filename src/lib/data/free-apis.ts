/**
 * FREE API ALTERNATIVES
 * Budget-friendly options for real sustainability data
 */

// Climatiq - Free emission calculations
export class ClimatiqAPIClient {
  private apiKey: string
  private baseUrl = 'https://api.climatiq.io'
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }
  
  /**
   * Calculate emissions for any activity
   */
  async calculateEmissions(params: {
    activityId: string
    value: number
    unit: string
    region?: string
  }): Promise<{
    emissions: number
    emissionFactor: {
      value: number
      unit: string
      source: string
    }
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/estimate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emission_factor: {
            activity_id: params.activityId,
            region: params.region,
            data_version: '^23'
          },
          parameters: {
            energy: params.value,
            energy_unit: params.unit
          }
        })
      })
      
      const data = await response.json()
      
      return {
        emissions: data.co2e,
        emissionFactor: {
          value: data.emission_factor.factor,
          unit: data.emission_factor.unit,
          source: data.emission_factor.source
        }
      }
    } catch (error) {
      console.error('Climatiq API error:', error)
      // Fallback to built-in factors
      return this.fallbackCalculation(params)
    }
  }
  
  /**
   * Search emission factors
   */
  async searchFactors(query: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/emission-factors/search?query=${query}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })
      
      return await response.json()
    } catch (error) {
      console.error('Climatiq search error:', error)
      return []
    }
  }
  
  private fallbackCalculation(params: any): any {
    // Use built-in emission factors as fallback
    const factors: Record<string, number> = {
      'electricity': 0.4,
      'natural_gas': 0.185,
      'gasoline': 2.31,
      'diesel': 2.68,
      'waste': 0.467
    }
    
    const factor = factors[params.activityId] || 0.1
    return {
      emissions: params.value * factor,
      emissionFactor: {
        value: factor,
        unit: `kgCO2e/${params.unit}`,
        source: 'Built-in factors'
      }
    }
  }
}

// UK Carbon Intensity - Free, no auth needed!
export class UKCarbonIntensityAPIClient {
  private baseUrl = 'https://api.carbonintensity.org.uk'
  
  /**
   * Get current carbon intensity (UK only)
   */
  async getCurrentIntensity(): Promise<{
    intensity: number
    index: string
    forecast: any[]
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/intensity`)
      const data = await response.json()
      
      return {
        intensity: data.data[0].intensity.actual,
        index: data.data[0].intensity.index, // very low, low, moderate, high, very high
        forecast: await this.getForecast()
      }
    } catch (error) {
      console.error('UK Carbon API error:', error)
      return {
        intensity: 200, // UK average
        index: 'moderate',
        forecast: []
      }
    }
  }
  
  /**
   * Get 48-hour forecast
   */
  async getForecast(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/intensity/24h`)
      const data = await response.json()
      
      return data.data.map((period: any) => ({
        from: period.from,
        to: period.to,
        intensity: period.intensity.forecast,
        index: period.intensity.index
      }))
    } catch (error) {
      return []
    }
  }
  
  /**
   * Get generation mix
   */
  async getGenerationMix(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/generation`)
      const data = await response.json()
      
      return data.data.generationmix
    } catch (error) {
      return []
    }
  }
}

// Climate Policy Radar - Free regulatory data
export class ClimatePolicyRadarClient {
  private baseUrl = 'https://app.climatepolicyradar.org/api/v1'
  
  /**
   * Search climate policies and regulations
   */
  async searchPolicies(params: {
    query: string
    country?: string
    sector?: string
  }): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams({
        q: params.query,
        ...(params.country && { country: params.country }),
        ...(params.sector && { sector: params.sector })
      })
      
      const response = await fetch(`${this.baseUrl}/search?${queryParams}`)
      const data = await response.json()
      
      return data.results.map((policy: any) => ({
        title: policy.title,
        country: policy.country,
        date: policy.date,
        type: policy.type,
        summary: policy.summary,
        url: policy.url
      }))
    } catch (error) {
      console.error('Climate Policy Radar error:', error)
      return []
    }
  }
  
  /**
   * Get regulations by country
   */
  async getCountryRegulations(country: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/countries/${country}/policies`)
      return await response.json()
    } catch (error) {
      // Return pre-built regulations
      return this.getBuiltInRegulations(country)
    }
  }
  
  private getBuiltInRegulations(country: string): any {
    const regulations: Record<string, any> = {
      'EU': {
        'CSRD': {
          name: 'Corporate Sustainability Reporting Directive',
          status: 'active',
          deadline: '2025-01-01',
          requirements: ['Scope 1,2,3 emissions', 'Double materiality', 'EU Taxonomy']
        },
        'EU Taxonomy': {
          name: 'EU Taxonomy Regulation',
          status: 'active',
          requirements: ['Green revenue disclosure', 'DNSH criteria']
        }
      },
      'US': {
        'SEC Climate': {
          name: 'SEC Climate Disclosure Rules',
          status: 'proposed',
          requirements: ['Climate risk disclosure', 'Scope 1,2 emissions']
        }
      },
      'UK': {
        'TCFD': {
          name: 'TCFD Mandatory Disclosure',
          status: 'active',
          requirements: ['Climate risk', 'Scenario analysis', 'Governance']
        }
      }
    }
    
    return regulations[country] || {}
  }
}

// Climate Watch - Free country data
export class ClimateWatchAPIClient {
  private baseUrl = 'https://www.climatewatchdata.org/api/v1'
  
  /**
   * Get country emissions data
   */
  async getCountryEmissions(country: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/emissions?country=${country}`)
      return await response.json()
    } catch (error) {
      console.error('Climate Watch error:', error)
      return null
    }
  }
  
  /**
   * Get NDC (Nationally Determined Contributions) targets
   */
  async getNDCTargets(country: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/ndcs?country=${country}`)
      return await response.json()
    } catch (error) {
      return null
    }
  }
}

// Carbon Interface - Free emission calculations
export class CarbonInterfaceClient {
  private apiKey: string
  private baseUrl = 'https://www.carboninterface.com/api/v1'
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }
  
  /**
   * Estimate emissions for various activities
   */
  async estimate(params: {
    type: 'electricity' | 'flight' | 'shipping' | 'vehicle'
    data: any
  }): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/estimates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })
      
      const data = await response.json()
      
      return {
        emissions: data.data.attributes.carbon_kg,
        details: data.data.attributes
      }
    } catch (error) {
      console.error('Carbon Interface error:', error)
      return null
    }
  }
}

// Regional Grid APIs - Free, no auth
export class RegionalGridAPIs {
  /**
   * California ISO (CAISO)
   */
  async getCAISOData(): Promise<any> {
    try {
      // CAISO provides real-time data
      const response = await fetch('http://www.caiso.com/outlook/SP/current_renewables.json')
      return await response.json()
    } catch (error) {
      return null
    }
  }
  
  /**
   * Get grid data by region
   */
  async getRegionalGrid(region: string): Promise<any> {
    const apis: Record<string, () => Promise<any>> = {
      'US-CA': this.getCAISOData,
      'US-TX': this.getERCOTData,
      'UK': this.getUKGrid
    }
    
    const fetcher = apis[region]
    return fetcher ? await fetcher() : null
  }
  
  private async getERCOTData(): Promise<any> {
    // ERCOT (Texas) grid data
    try {
      const response = await fetch('https://www.ercot.com/api/1/services/read/dashboards/fuel-mix.json')
      return await response.json()
    } catch (error) {
      return null
    }
  }
  
  private async getUKGrid(): Promise<any> {
    // Use UK Carbon Intensity API
    const client = new UKCarbonIntensityAPIClient()
    return await client.getCurrentIntensity()
  }
}

// Master free API client
export class FreeAPIOrchestrator {
  private climatiq?: ClimatiqAPIClient
  private ukCarbon: UKCarbonIntensityAPIClient
  private policyRadar: ClimatePolicyRadarClient
  private climateWatch: ClimateWatchAPIClient
  private carbonInterface?: CarbonInterfaceClient
  private regionalGrids: RegionalGridAPIs
  
  constructor(apiKeys?: {
    climatiq?: string
    carbonInterface?: string
  }) {
    if (apiKeys?.climatiq) {
      this.climatiq = new ClimatiqAPIClient(apiKeys.climatiq)
    }
    if (apiKeys?.carbonInterface) {
      this.carbonInterface = new CarbonInterfaceClient(apiKeys.carbonInterface)
    }
    
    this.ukCarbon = new UKCarbonIntensityAPIClient()
    this.policyRadar = new ClimatePolicyRadarClient()
    this.climateWatch = new ClimateWatchAPIClient()
    this.regionalGrids = new RegionalGridAPIs()
  }
  
  /**
   * Smart emission calculation with fallbacks
   */
  async calculateEmissions(activity: any): Promise<any> {
    // Try Climatiq first
    if (this.climatiq) {
      const result = await this.climatiq.calculateEmissions(activity)
      if (result) return result
    }
    
    // Try Carbon Interface
    if (this.carbonInterface) {
      const result = await this.carbonInterface.estimate({
        type: activity.type,
        data: activity
      })
      if (result) return result
    }
    
    // Fallback to built-in factors
    return this.builtInCalculation(activity)
  }
  
  /**
   * Get grid carbon intensity with fallbacks
   */
  async getGridIntensity(location: string): Promise<any> {
    // Try regional APIs first (free, no limits)
    const regional = await this.regionalGrids.getRegionalGrid(location)
    if (regional) return regional
    
    // UK locations
    if (location.startsWith('UK') || location === 'GB') {
      return await this.ukCarbon.getCurrentIntensity()
    }
    
    // Fallback to averages
    return this.getAverageIntensity(location)
  }
  
  /**
   * Get regulations with fallbacks
   */
  async getRegulations(country: string): Promise<any> {
    // Try Climate Policy Radar
    const policies = await this.policyRadar.getCountryRegulations(country)
    
    // Add Climate Watch NDCs
    const ndcs = await this.climateWatch.getNDCTargets(country)
    
    return {
      policies,
      ndcs,
      builtIn: this.getBuiltInCompliance(country)
    }
  }
  
  private builtInCalculation(activity: any): any {
    // Use our comprehensive emission factors database
    const { emissionFactors } = require('./emission-factors')
    return emissionFactors.calculateEmissions(activity)
  }
  
  private getAverageIntensity(location: string): any {
    const averages: Record<string, number> = {
      'US': 417,
      'EU': 276,
      'CN': 581,
      'IN': 722,
      'UK': 233,
      'DE': 366,
      'FR': 58
    }
    
    const country = location.substring(0, 2)
    return {
      intensity: averages[country] || 475,
      index: 'moderate',
      forecast: []
    }
  }
  
  private getBuiltInCompliance(country: string): any {
    return {
      'TCFD': { required: true, deadline: '2024-12-31' },
      'GRI': { required: false, recommended: true },
      'CDP': { required: false, recommended: true }
    }
  }
}

// Export configured instance
export const freeAPIs = new FreeAPIOrchestrator({
  climatiq: process.env.CLIMATIQ_API_KEY,
  carbonInterface: process.env.CARBON_INTERFACE_API_KEY
})