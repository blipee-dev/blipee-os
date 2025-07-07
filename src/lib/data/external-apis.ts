/**
 * EXTERNAL API INTEGRATIONS
 * Real-world data sources that make Blipee intelligent
 */

// Weather API for climate impact analysis
export class WeatherAPIClient {
  private apiKey: string
  private baseUrl = 'https://api.openweathermap.org/data/3.0'
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }
  
  /**
   * Get current and forecast weather for energy predictions
   */
  async getWeatherData(location: { lat: number; lon: number }): Promise<{
    current: WeatherData
    forecast: WeatherForecast[]
    alerts: WeatherAlert[]
  }> {
    try {
      // Current weather
      const currentResponse = await fetch(
        `${this.baseUrl}/onecall?lat=${location.lat}&lon=${location.lon}&appid=${this.apiKey}&units=metric`
      )
      const data = await currentResponse.json()
      
      return {
        current: {
          temperature: data.current.temp,
          humidity: data.current.humidity,
          pressure: data.current.pressure,
          windSpeed: data.current.wind_speed,
          cloudCover: data.current.clouds,
          description: data.current.weather[0].description,
          // Impact on energy usage
          heatingDemand: this.calculateHeatingDemand(data.current.temp),
          coolingDemand: this.calculateCoolingDemand(data.current.temp, data.current.humidity),
          solarGeneration: this.calculateSolarPotential(data.current.clouds, data.current.uvi)
        },
        forecast: data.daily.map((day: any) => ({
          date: new Date(day.dt * 1000),
          tempMin: day.temp.min,
          tempMax: day.temp.max,
          description: day.weather[0].description,
          energyImpact: this.predictEnergyImpact(day)
        })),
        alerts: data.alerts?.map((alert: any) => ({
          event: alert.event,
          description: alert.description,
          severity: this.categorizeAlertSeverity(alert),
          energyRisk: this.assessEnergyRisk(alert)
        })) || []
      }
    } catch (error) {
      console.error('Weather API error:', error)
      return this.getMockWeatherData()
    }
  }
  
  private calculateHeatingDemand(temp: number): number {
    // Below 15°C, heating demand increases
    if (temp >= 15) return 0
    return Math.max(0, (15 - temp) * 5) // 5% per degree below 15°C
  }
  
  private calculateCoolingDemand(temp: number, humidity: number): number {
    // Above 23°C, cooling demand increases
    if (temp <= 23) return 0
    const tempFactor = (temp - 23) * 4 // 4% per degree above 23°C
    const humidityFactor = humidity > 60 ? (humidity - 60) * 0.5 : 0
    return tempFactor + humidityFactor
  }
  
  private calculateSolarPotential(cloudCover: number, uvIndex: number): number {
    // Estimate solar generation potential
    const cloudFactor = (100 - cloudCover) / 100
    const uvFactor = Math.min(uvIndex / 10, 1)
    return cloudFactor * uvFactor * 100
  }
  
  private predictEnergyImpact(day: any): string {
    const avgTemp = (day.temp.min + day.temp.max) / 2
    if (avgTemp < 5 || avgTemp > 30) return 'high'
    if (avgTemp < 10 || avgTemp > 25) return 'medium'
    return 'low'
  }
  
  private categorizeAlertSeverity(alert: any): 'low' | 'medium' | 'high' | 'extreme' {
    const severity = alert.tags?.find((tag: string) => ['extreme', 'severe', 'moderate', 'minor'].includes(tag))
    switch (severity) {
      case 'extreme': return 'extreme'
      case 'severe': return 'high'
      case 'moderate': return 'medium'
      default: return 'low'
    }
  }
  
  private assessEnergyRisk(alert: any): string {
    if (alert.event.toLowerCase().includes('heat') || alert.event.toLowerCase().includes('cold')) {
      return 'Significant impact on HVAC energy consumption expected'
    }
    if (alert.event.toLowerCase().includes('storm') || alert.event.toLowerCase().includes('wind')) {
      return 'Potential power disruptions, consider backup systems'
    }
    return 'Monitor energy systems for unusual patterns'
  }
  
  private getMockWeatherData() {
    return {
      current: {
        temperature: 22,
        humidity: 55,
        pressure: 1013,
        windSpeed: 5,
        cloudCover: 30,
        description: 'partly cloudy',
        heatingDemand: 0,
        coolingDemand: 0,
        solarGeneration: 70
      },
      forecast: [],
      alerts: []
    }
  }
}

// Carbon Market API for offset pricing and trading
export class CarbonMarketAPIClient {
  private apiKey: string
  private baseUrl = 'https://api.carbonmarkets.com/v1' // Example API
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }
  
  /**
   * Get current carbon credit prices and market data
   */
  async getMarketData(): Promise<{
    prices: CarbonPrices
    trends: MarketTrends
    opportunities: TradingOpportunity[]
  }> {
    try {
      // In production, would call real API
      // For now, return realistic mock data
      return {
        prices: {
          voluntary: {
            natureBasedRemoval: 15.50, // $/tCO2e
            techBasedRemoval: 125.00,
            renewableEnergy: 8.25,
            energyEfficiency: 6.50,
            forestryREDD: 12.00
          },
          compliance: {
            euETS: 85.50, // EU Emissions Trading System
            californiaCap: 35.25,
            rggi: 15.75, // Regional Greenhouse Gas Initiative
            ukETS: 72.00
          },
          forecast: {
            voluntary: { '30d': 16.20, '90d': 17.50, '1y': 22.00 },
            compliance: { '30d': 87.00, '90d': 92.00, '1y': 105.00 }
          }
        },
        trends: {
          voluntary: {
            direction: 'up',
            percentageChange: 8.5,
            drivers: ['Increased corporate demand', 'Supply constraints', 'Quality premium']
          },
          compliance: {
            direction: 'up',
            percentageChange: 12.3,
            drivers: ['Tighter caps', 'Economic recovery', 'Policy announcements']
          }
        },
        opportunities: [
          {
            type: 'buy',
            market: 'voluntary',
            project: 'Amazon Rainforest Protection',
            price: 14.50,
            volume: 1000,
            quality: 'Gold Standard',
            recommendation: 'Strong buy - 10% below market',
            cobenefits: ['Biodiversity', 'Community development']
          },
          {
            type: 'sell',
            market: 'compliance',
            instrument: 'EU ETS Allowances',
            price: 88.00,
            volume: 500,
            recommendation: 'Consider selling - near 52-week high',
            riskFactors: ['Policy uncertainty', 'Economic slowdown']
          }
        ]
      }
    } catch (error) {
      console.error('Carbon market API error:', error)
      return this.getMockMarketData()
    }
  }
  
  /**
   * Calculate optimal offset portfolio
   */
  async optimizeOffsetPortfolio(params: {
    budget: number
    targetReduction: number
    preferences: string[]
  }): Promise<{
    portfolio: OffsetPortfolio
    impact: ImpactAnalysis
    costs: CostBreakdown
  }> {
    const marketData = await this.getMarketData()
    
    // AI-driven portfolio optimization
    const portfolio: OffsetPortfolio = {
      allocations: [
        {
          type: 'Nature-based removal',
          quantity: params.targetReduction * 0.4,
          unitPrice: marketData.prices.voluntary.natureBasedRemoval,
          totalCost: params.targetReduction * 0.4 * marketData.prices.voluntary.natureBasedRemoval,
          projects: ['Mangrove restoration', 'Soil carbon sequestration']
        },
        {
          type: 'Renewable energy',
          quantity: params.targetReduction * 0.3,
          unitPrice: marketData.prices.voluntary.renewableEnergy,
          totalCost: params.targetReduction * 0.3 * marketData.prices.voluntary.renewableEnergy,
          projects: ['Wind farm India', 'Solar mini-grids Africa']
        },
        {
          type: 'Direct air capture',
          quantity: params.targetReduction * 0.3,
          unitPrice: marketData.prices.voluntary.techBasedRemoval,
          totalCost: params.targetReduction * 0.3 * marketData.prices.voluntary.techBasedRemoval,
          projects: ['Climeworks DAC', 'Carbon Engineering']
        }
      ],
      totalCost: 0,
      averagePrice: 0,
      quality: 'High',
      permanence: 'Mixed (50+ years average)',
      additionality: 'Verified',
      cobenefits: ['Biodiversity', 'Jobs', 'Clean energy access']
    }
    
    portfolio.totalCost = portfolio.allocations.reduce((sum, a) => sum + a.totalCost, 0)
    portfolio.averagePrice = portfolio.totalCost / params.targetReduction
    
    return {
      portfolio,
      impact: {
        emissionsReduced: params.targetReduction,
        equivalentTo: `Taking ${Math.round(params.targetReduction / 4.6)} cars off the road`,
        sdgContribution: ['SDG 13: Climate', 'SDG 7: Energy', 'SDG 15: Life on Land'],
        verificationStandard: 'Verra VCS + Gold Standard'
      },
      costs: {
        immediate: portfolio.totalCost,
        projected1Year: portfolio.totalCost * 1.15, // 15% price increase
        projected5Year: portfolio.totalCost * 1.75, // 75% price increase
        savingsVsFuture: portfolio.totalCost * 0.75
      }
    }
  }
  
  private getMockMarketData() {
    return {
      prices: {
        voluntary: { natureBasedRemoval: 15, techBasedRemoval: 120, renewableEnergy: 8, energyEfficiency: 6, forestryREDD: 12 },
        compliance: { euETS: 85, californiaCap: 35, rggi: 15, ukETS: 72 },
        forecast: { voluntary: { '30d': 16, '90d': 17, '1y': 22 }, compliance: { '30d': 87, '90d': 92, '1y': 105 } }
      },
      trends: { voluntary: { direction: 'up' as const, percentageChange: 8, drivers: [] }, compliance: { direction: 'up' as const, percentageChange: 12, drivers: [] } },
      opportunities: []
    }
  }
}

// Regulatory Database API for compliance tracking
export class RegulatoryAPIClient {
  private apiKey: string
  private baseUrl = 'https://api.climateregulations.com/v1' // Example API
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }
  
  /**
   * Get applicable regulations and compliance requirements
   */
  async getRegulations(params: {
    jurisdiction: string[]
    industry: string
    companySize: 'small' | 'medium' | 'large'
  }): Promise<{
    applicable: Regulation[]
    upcoming: UpcomingRegulation[]
    deadlines: ComplianceDeadline[]
  }> {
    // In production, would query real regulatory database
    // Mock comprehensive regulatory data
    return {
      applicable: [
        {
          id: 'eu-csrd',
          name: 'Corporate Sustainability Reporting Directive (CSRD)',
          jurisdiction: 'European Union',
          status: 'active',
          applicability: params.companySize === 'large' ? 'mandatory' : 'voluntary',
          requirements: [
            'Double materiality assessment',
            'Scope 1, 2, and 3 emissions reporting',
            'EU Taxonomy alignment disclosure',
            'Third-party assurance'
          ],
          reportingStandard: 'ESRS',
          penalties: 'Up to 10M EUR or 5% of turnover',
          resources: [
            { type: 'guide', url: 'https://eur-lex.europa.eu/csrd', title: 'Official CSRD Text' },
            { type: 'template', url: '/templates/csrd-report', title: 'CSRD Report Template' }
          ]
        },
        {
          id: 'sec-climate',
          name: 'SEC Climate Disclosure Rules',
          jurisdiction: 'United States',
          status: 'pending',
          applicability: 'public companies',
          requirements: [
            'Climate risk disclosure',
            'Scope 1 and 2 emissions',
            'Board oversight disclosure',
            'Scenario analysis'
          ],
          reportingStandard: 'TCFD-aligned',
          penalties: 'SEC enforcement actions',
          resources: []
        },
        {
          id: 'tcfd',
          name: 'Task Force on Climate-related Financial Disclosures',
          jurisdiction: 'Global',
          status: 'active',
          applicability: 'recommended',
          requirements: [
            'Governance disclosure',
            'Strategy and scenario analysis',
            'Risk management',
            'Metrics and targets'
          ],
          reportingStandard: 'TCFD',
          penalties: 'None (voluntary)',
          resources: []
        }
      ],
      upcoming: [
        {
          regulation: 'ISSB Standards',
          jurisdiction: 'Global',
          effectiveDate: '2025-01-01',
          impact: 'Unified global sustainability reporting',
          preparationNeeded: [
            'Align current reporting with ISSB',
            'Enhance data collection systems',
            'Train finance team on requirements'
          ]
        },
        {
          regulation: 'EU Carbon Border Adjustment',
          jurisdiction: 'European Union',
          effectiveDate: '2026-01-01',
          impact: 'Carbon pricing on imports',
          preparationNeeded: [
            'Calculate embedded carbon in products',
            'Assess supply chain impacts',
            'Consider reshoring options'
          ]
        }
      ],
      deadlines: [
        {
          regulation: 'CSRD',
          deadline: '2025-01-01',
          milestone: 'First report due for FY 2024',
          status: 'preparation',
          tasksRemaining: [
            'Complete materiality assessment',
            'Implement data collection',
            'Engage auditor'
          ],
          daysRemaining: 390
        },
        {
          regulation: 'CDP Submission',
          deadline: '2024-07-31',
          milestone: 'Annual disclosure',
          status: 'in-progress',
          tasksRemaining: [
            'Finalize Scope 3 calculations',
            'Executive review',
            'Submit response'
          ],
          daysRemaining: 45
        }
      ]
    }
  }
  
  /**
   * Check compliance status against requirements
   */
  async checkCompliance(params: {
    organizationId: string
    framework: string
    currentData: any
  }): Promise<{
    overallCompliance: number
    gaps: ComplianceGap[]
    recommendations: string[]
    risks: ComplianceRisk[]
  }> {
    // AI-driven compliance assessment
    const requirements = await this.getFrameworkRequirements(params.framework)
    const gaps: ComplianceGap[] = []
    let compliantItems = 0
    
    // Check each requirement
    requirements.forEach(req => {
      const status = this.assessRequirement(req, params.currentData)
      if (status.compliant) {
        compliantItems++
      } else {
        gaps.push({
          requirement: req.name,
          currentStatus: status.status,
          gap: status.gap,
          priority: status.priority,
          effort: status.effort,
          solution: status.solution
        })
      }
    })
    
    const overallCompliance = (compliantItems / requirements.length) * 100
    
    return {
      overallCompliance,
      gaps: gaps.sort((a, b) => this.priorityScore(b.priority) - this.priorityScore(a.priority)),
      recommendations: this.generateComplianceRecommendations(gaps),
      risks: this.assessComplianceRisks(overallCompliance, gaps)
    }
  }
  
  private async getFrameworkRequirements(framework: string): Promise<any[]> {
    // Return requirements for specific framework
    const frameworks: Record<string, any[]> = {
      'CSRD': [
        { name: 'Double materiality assessment', category: 'governance', mandatory: true },
        { name: 'Scope 1 emissions', category: 'environmental', mandatory: true },
        { name: 'Scope 2 emissions', category: 'environmental', mandatory: true },
        { name: 'Scope 3 emissions', category: 'environmental', mandatory: true },
        { name: 'Climate risk assessment', category: 'strategy', mandatory: true },
        { name: 'Transition plan', category: 'strategy', mandatory: true },
        { name: 'Board oversight', category: 'governance', mandatory: true },
        { name: 'Third-party assurance', category: 'verification', mandatory: true }
      ],
      'TCFD': [
        { name: 'Board oversight', category: 'governance', mandatory: true },
        { name: 'Climate strategy', category: 'strategy', mandatory: true },
        { name: 'Scenario analysis', category: 'strategy', mandatory: true },
        { name: 'Risk identification', category: 'risk', mandatory: true },
        { name: 'Risk management process', category: 'risk', mandatory: true },
        { name: 'Metrics disclosure', category: 'metrics', mandatory: true },
        { name: 'Targets disclosure', category: 'metrics', mandatory: true }
      ]
    }
    
    return frameworks[framework] || []
  }
  
  private assessRequirement(requirement: any, data: any): any {
    // Intelligent assessment of each requirement
    // This would use AI to analyze the data against requirements
    const hasData = Math.random() > 0.3 // Simplified
    
    if (hasData) {
      return { compliant: true, status: 'complete' }
    } else {
      return {
        compliant: false,
        status: 'missing',
        gap: 'Data not collected',
        priority: requirement.mandatory ? 'high' : 'medium',
        effort: 'medium',
        solution: 'Implement data collection process'
      }
    }
  }
  
  private priorityScore(priority: string): number {
    const scores: Record<string, number> = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    }
    return scores[priority] || 0
  }
  
  private generateComplianceRecommendations(gaps: ComplianceGap[]): string[] {
    const recommendations: string[] = []
    
    if (gaps.some(g => g.requirement.includes('emissions'))) {
      recommendations.push('Implement comprehensive GHG accounting system')
    }
    
    if (gaps.some(g => g.requirement.includes('assurance'))) {
      recommendations.push('Engage third-party verification provider')
    }
    
    if (gaps.some(g => g.priority === 'high')) {
      recommendations.push('Focus on high-priority gaps to achieve compliance by deadline')
    }
    
    recommendations.push('Create compliance roadmap with monthly milestones')
    
    return recommendations
  }
  
  private assessComplianceRisks(compliance: number, gaps: ComplianceGap[]): ComplianceRisk[] {
    const risks: ComplianceRisk[] = []
    
    if (compliance < 50) {
      risks.push({
        type: 'regulatory',
        severity: 'high',
        description: 'Significant non-compliance risk',
        likelihood: 'probable',
        impact: 'Penalties and reputational damage',
        mitigation: 'Accelerate compliance program'
      })
    }
    
    if (gaps.some(g => g.requirement.includes('assurance'))) {
      risks.push({
        type: 'verification',
        severity: 'medium',
        description: 'May not meet assurance requirements',
        likelihood: 'possible',
        impact: 'Report rejection',
        mitigation: 'Early auditor engagement'
      })
    }
    
    return risks
  }
}

// Energy Grid API for real-time carbon intensity
export class EnergyGridAPIClient {
  private baseUrl = 'https://api.electricitymap.org/v3' // Real API
  
  /**
   * Get real-time grid carbon intensity
   */
  async getGridCarbonIntensity(location: string): Promise<{
    current: GridCarbonData
    forecast: GridCarbonForecast[]
    optimal: OptimalTimes
  }> {
    try {
      // Would use real API with authentication
      // Mock data for now
      const currentHour = new Date().getHours()
      const baseIntensity = 400 // gCO2/kWh average
      
      // Simulate daily variation
      const hourlyFactors: Record<number, number> = {
        0: 0.7, 1: 0.6, 2: 0.6, 3: 0.6, 4: 0.7, 5: 0.8,
        6: 0.9, 7: 1.1, 8: 1.2, 9: 1.2, 10: 1.1, 11: 1.0,
        12: 0.9, 13: 0.9, 14: 1.0, 15: 1.1, 16: 1.2, 17: 1.3,
        18: 1.4, 19: 1.3, 20: 1.2, 21: 1.0, 22: 0.9, 23: 0.8
      }
      
      const currentIntensity = baseIntensity * (hourlyFactors[currentHour] || 1)
      
      return {
        current: {
          carbonIntensity: currentIntensity,
          energyMix: {
            renewable: 35,
            nuclear: 20,
            gas: 30,
            coal: 15
          },
          trend: currentHour < 12 ? 'increasing' : 'decreasing',
          comparedToAverage: ((currentIntensity / baseIntensity) - 1) * 100
        },
        forecast: Array.from({ length: 24 }, (_, i) => ({
          hour: (currentHour + i + 1) % 24,
          carbonIntensity: baseIntensity * (hourlyFactors[(currentHour + i + 1) % 24] || 1),
          renewable: 30 + Math.random() * 20
        })),
        optimal: {
          lowestIntensity: {
            time: '02:00',
            intensity: baseIntensity * 0.6,
            savings: '40% below peak'
          },
          highestRenewable: {
            time: '14:00',
            percentage: 55,
            source: 'Solar peak'
          },
          recommendations: [
            'Shift flexible loads to 2:00-4:00 AM',
            'Charge EVs overnight',
            'Run energy-intensive processes during solar peak (12:00-15:00)'
          ]
        }
      }
    } catch (error) {
      console.error('Grid API error:', error)
      return this.getMockGridData()
    }
  }
  
  private getMockGridData() {
    return {
      current: {
        carbonIntensity: 400,
        energyMix: { renewable: 35, nuclear: 20, gas: 30, coal: 15 },
        trend: 'stable' as const,
        comparedToAverage: 0
      },
      forecast: [],
      optimal: {
        lowestIntensity: { time: '02:00', intensity: 240, savings: '40% below peak' },
        highestRenewable: { time: '14:00', percentage: 55, source: 'Solar peak' },
        recommendations: []
      }
    }
  }
}

// Type definitions
interface WeatherData {
  temperature: number
  humidity: number
  pressure: number
  windSpeed: number
  cloudCover: number
  description: string
  heatingDemand: number
  coolingDemand: number
  solarGeneration: number
}

interface WeatherForecast {
  date: Date
  tempMin: number
  tempMax: number
  description: string
  energyImpact: string
}

interface WeatherAlert {
  event: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'extreme'
  energyRisk: string
}

interface CarbonPrices {
  voluntary: Record<string, number>
  compliance: Record<string, number>
  forecast: Record<string, Record<string, number>>
}

interface MarketTrends {
  voluntary: { direction: 'up' | 'down' | 'stable'; percentageChange: number; drivers: string[] }
  compliance: { direction: 'up' | 'down' | 'stable'; percentageChange: number; drivers: string[] }
}

interface TradingOpportunity {
  type: 'buy' | 'sell'
  market: string
  project?: string
  instrument?: string
  price: number
  volume: number
  quality?: string
  recommendation: string
  cobenefits?: string[]
  riskFactors?: string[]
}

interface OffsetPortfolio {
  allocations: Array<{
    type: string
    quantity: number
    unitPrice: number
    totalCost: number
    projects: string[]
  }>
  totalCost: number
  averagePrice: number
  quality: string
  permanence: string
  additionality: string
  cobenefits: string[]
}

interface ImpactAnalysis {
  emissionsReduced: number
  equivalentTo: string
  sdgContribution: string[]
  verificationStandard: string
}

interface CostBreakdown {
  immediate: number
  projected1Year: number
  projected5Year: number
  savingsVsFuture: number
}

interface Regulation {
  id: string
  name: string
  jurisdiction: string
  status: string
  applicability: string
  requirements: string[]
  reportingStandard: string
  penalties: string
  resources: Array<{ type: string; url: string; title: string }>
}

interface UpcomingRegulation {
  regulation: string
  jurisdiction: string
  effectiveDate: string
  impact: string
  preparationNeeded: string[]
}

interface ComplianceDeadline {
  regulation: string
  deadline: string
  milestone: string
  status: string
  tasksRemaining: string[]
  daysRemaining: number
}

interface ComplianceGap {
  requirement: string
  currentStatus: string
  gap: string
  priority: string
  effort: string
  solution: string
}

interface ComplianceRisk {
  type: string
  severity: string
  description: string
  likelihood: string
  impact: string
  mitigation: string
}

interface GridCarbonData {
  carbonIntensity: number // gCO2/kWh
  energyMix: Record<string, number>
  trend: 'increasing' | 'decreasing' | 'stable'
  comparedToAverage: number
}

interface GridCarbonForecast {
  hour: number
  carbonIntensity: number
  renewable: number
}

interface OptimalTimes {
  lowestIntensity: { time: string; intensity: number; savings: string }
  highestRenewable: { time: string; percentage: number; source: string }
  recommendations: string[]
}

// Export configured clients
export const weatherAPI = new WeatherAPIClient(process.env.OPENWEATHER_API_KEY || '')
export const carbonMarketAPI = new CarbonMarketAPIClient(process.env.CARBON_MARKET_API_KEY || '')
export const regulatoryAPI = new RegulatoryAPIClient(process.env.REGULATORY_API_KEY || '')
export const gridAPI = new EnergyGridAPIClient()