/**
 * UNIFIED DATA INGESTION PIPELINE
 * Bringing all data sources together for blipee's intelligence
 */

import {
  weatherAPI,
  carbonMarketAPI,
  regulatoryAPI,
  gridAPI,
} from "./external-apis";
import { documentParser } from "./document-parser";
import { createClient } from "@supabase/supabase-js";

export class UnifiedDataIngestion {
  private supabase: ReturnType<typeof createClient>;
  private ingestionQueue: Map<string, any> = new Map();

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Ingest data from all sources for an organization
   */
  async ingestAllData(organizationId: string): Promise<{
    status: IngestionStatus;
    data: UnifiedData;
    insights: DataInsight[];
    recommendations: string[];
  }> {

    // Fetch all data sources in parallel
    const [
      weatherData,
      marketData,
      regulatoryData,
      gridData,
      documentData,
      internalData,
    ] = await Promise.all([
      this.ingestWeatherData(organizationId),
      this.ingestMarketData(organizationId),
      this.ingestRegulatoryData(organizationId),
      this.ingestGridData(organizationId),
      this.ingestDocumentData(organizationId),
      this.ingestInternalData(organizationId),
    ]);

    // Combine all data sources
    const unifiedData: UnifiedData = {
      organization: {
        id: organizationId,
        name: internalData.organization.name,
        industry: internalData.organization.industry,
        size: internalData.organization.size,
      },
      emissions: this.mergeEmissionsData(
        documentData.emissions,
        internalData.emissions,
      ),
      external: {
        weather: weatherData,
        carbonMarket: marketData,
        regulatory: regulatoryData,
        grid: gridData,
      },
      documents: documentData.processed,
      timestamp: new Date().toISOString(),
    };

    // Generate insights from unified data
    const insights = await this.generateDataInsights(unifiedData);

    // Create actionable recommendations
    const recommendations = await this.generateRecommendations(
      unifiedData,
      insights,
    );

    // Store in database
    await this.storeUnifiedData(organizationId, unifiedData);

    return {
      status: {
        success: true,
        sourcesIngested: 6,
        dataPoints: this.countDataPoints(unifiedData),
        timestamp: new Date().toISOString(),
      },
      data: unifiedData,
      insights,
      recommendations,
    };
  }

  /**
   * Ingest weather data and calculate energy impact
   */
  private async ingestWeatherData(organizationId: string): Promise<any> {
    try {
      // Get organization locations
      const { data: dbLocations } = await this.supabase
        .from("organization_locations")
        .select("*")
        .eq("organization_id", organizationId);

      const locations =
        !dbLocations || dbLocations.length === 0
          ? [{ latitude: 40.7128, longitude: -74.006, name: "Default" }]
          : dbLocations;

      // Get weather for all locations
      const weatherPromises = locations.map((loc: any) =>
        weatherAPI.getWeatherData({ lat: loc.latitude, lon: loc.longitude }),
      );

      const weatherResults = await Promise.all(weatherPromises);

      // Calculate energy impact
      const energyImpact = this.calculateWeatherEnergyImpact(weatherResults);

      return {
        locations: locations.map((loc, idx) => ({
          ...loc,
          weather: weatherResults[idx],
        })),
        aggregated: {
          avgTemperature: this.average(
            weatherResults.map((w) => w.current.temperature),
          ),
          totalHeatingDemand: this.sum(
            weatherResults.map((w) => w.current.heatingDemand),
          ),
          totalCoolingDemand: this.sum(
            weatherResults.map((w) => w.current.coolingDemand),
          ),
          solarPotential: this.average(
            weatherResults.map((w) => w.current.solarGeneration),
          ),
        },
        energyImpact,
        alerts: weatherResults.flatMap((w) => w.alerts),
      };
    } catch (error) {
      console.error("Weather data ingestion error:", error);
      return null;
    }
  }

  /**
   * Ingest carbon market data for offset optimization
   */
  private async ingestMarketData(organizationId: string): Promise<any> {
    try {
      const marketData = await carbonMarketAPI.getMarketData();

      // Get organization's offset needs
      const { data: targets } = await this.supabase
        .from("sustainability_targets")
        .select("*")
        .eq("organization_id", organizationId)
        .single();

      let offsetRecommendations = null;
      if (targets && (targets as any).offset_requirement > 0) {
        offsetRecommendations = await carbonMarketAPI.optimizeOffsetPortfolio({
          budget: (targets as any).offset_budget || 100000,
          targetReduction: (targets as any).offset_requirement,
          preferences: ["nature-based", "permanent"],
        });
      }

      return {
        currentPrices: marketData.prices,
        trends: marketData.trends,
        opportunities: marketData.opportunities,
        offsetStrategy: offsetRecommendations,
      };
    } catch (error) {
      console.error("Market data ingestion error:", error);
      return null;
    }
  }

  /**
   * Ingest regulatory data and check compliance
   */
  private async ingestRegulatoryData(organizationId: string): Promise<any> {
    try {
      // Get organization details
      const { data: org } = await this.supabase
        .from("organizations")
        .select("*")
        .eq("id", organizationId)
        .single();

      if (!org) return null;

      // Get applicable regulations
      const regulations = await regulatoryAPI.getRegulations({
        jurisdiction: (org as any).jurisdictions || ["United States"],
        industry: (org as any).industry || "general",
        companySize: (org as any).size || "medium",
      });

      // Check compliance status for each framework
      const complianceChecks = await Promise.all(
        regulations.applicable.map(async (reg) => {
          const compliance = await regulatoryAPI.checkCompliance({
            organizationId,
            framework: reg.id,
            currentData: {}, // Would fetch actual compliance data
          });

          return {
            regulation: reg,
            compliance,
          };
        }),
      );

      return {
        applicable: regulations.applicable,
        upcoming: regulations.upcoming,
        deadlines: regulations.deadlines,
        complianceStatus: complianceChecks,
        overallCompliance: this.average(
          complianceChecks.map((c) => c.compliance.overallCompliance),
        ),
      };
    } catch (error) {
      console.error("Regulatory data ingestion error:", error);
      return null;
    }
  }

  /**
   * Ingest grid carbon intensity data
   */
  private async ingestGridData(organizationId: string): Promise<any> {
    try {
      // Get main location
      const { data: location } = await this.supabase
        .from("organization_locations")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_primary", true)
        .single();

      const gridData = await gridAPI.getGridCarbonIntensity(
        (location as any)?.region || "US-CA",
      );

      // Calculate potential savings
      const currentUsage = 10000; // kWh per day (would get from actual data)
      const currentEmissions =
        (currentUsage * gridData.current.carbonIntensity) / 1000;
      const optimalEmissions =
        (currentUsage * gridData.optimal.lowestIntensity.intensity) / 1000;
      const potentialSavings = currentEmissions - optimalEmissions;

      return {
        current: gridData.current,
        forecast: gridData.forecast,
        optimal: gridData.optimal,
        savings: {
          potential: potentialSavings,
          percentage: (potentialSavings / currentEmissions) * 100,
          strategy: "Shift loads to optimal times",
        },
      };
    } catch (error) {
      console.error("Grid data ingestion error:", error);
      return null;
    }
  }

  /**
   * Ingest and parse documents
   */
  private async ingestDocumentData(organizationId: string): Promise<any> {
    try {
      // Get pending documents
      const { data: documents } = await this.supabase
        .from("document_queue")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("status", "pending")
        .limit(10);

      if (!documents || documents.length === 0) {
        return { processed: [], emissions: {} };
      }

      // Parse documents in batch
      const parseResults = await documentParser.batchParse(
        documents.map((doc: any) => ({
          file: Buffer.from(doc.file_data, "base64") as any,
          type: doc.document_type,
        })),
      );

      // Update document status
      await this.supabase
        .from("document_queue")
        .update({
          status: "processed",
          extracted_data: parseResults.results,
          processed_at: new Date().toISOString(),
        })
        .in(
          "id",
          documents.map((d) => d.id),
        );

      // Store emissions data
      if (parseResults.emissions.total > 0) {
        await this.storeDocumentEmissions(
          organizationId,
          parseResults.emissions,
        );
      }

      return {
        processed: parseResults.results,
        summary: parseResults.summary,
        emissions: parseResults.emissions,
      };
    } catch (error) {
      console.error("Document ingestion error:", error);
      return { processed: [], emissions: {} };
    }
  }

  /**
   * Ingest internal data from database
   */
  private async ingestInternalData(organizationId: string): Promise<any> {
    const [organization, emissions, targets, initiatives] = await Promise.all([
      this.getOrganizationData(organizationId),
      this.getEmissionsData(organizationId),
      this.getTargetsData(organizationId),
      this.getInitiativesData(organizationId),
    ]);

    return {
      organization,
      emissions,
      targets,
      initiatives,
    };
  }

  /**
   * Generate insights from unified data
   */
  private async generateDataInsights(
    data: UnifiedData,
  ): Promise<DataInsight[]> {
    const insights: DataInsight[] = [];

    // Weather impact insight
    if (data.external.weather?.energyImpact) {
      insights.push({
        type: "weather_impact",
        title: "Weather-Driven Energy Demand",
        description: `Current weather conditions are driving ${data.external.weather.energyImpact.percentage}% ${data.external.weather.energyImpact.direction} energy demand`,
        impact: "high",
        dataPoints: ["temperature", "humidity", "heating/cooling demand"],
        actionable: true,
      });
    }

    // Carbon market opportunity
    if (data.external.carbonMarket?.opportunities?.length > 0) {
      const bestOpp = data.external.carbonMarket.opportunities[0];
      insights.push({
        type: "market_opportunity",
        title: "Carbon Credit Opportunity",
        description: `${bestOpp.recommendation} - ${bestOpp.type} ${bestOpp.volume} credits at ${bestOpp.price}/tCO2e`,
        impact: "medium",
        dataPoints: ["market price", "volume", "quality"],
        actionable: true,
      });
    }

    // Compliance risk
    if (data.external.regulatory?.overallCompliance < 80) {
      insights.push({
        type: "compliance_risk",
        title: "Compliance Gap Detected",
        description: `Overall compliance at ${data.external.regulatory.overallCompliance}% - immediate action required`,
        impact: "critical",
        dataPoints: ["compliance score", "gaps", "deadlines"],
        actionable: true,
      });
    }

    // Grid optimization
    if (data.external.grid?.savings?.percentage > 10) {
      insights.push({
        type: "grid_optimization",
        title: "Grid Carbon Intensity Opportunity",
        description: `Shift energy usage to save ${data.external.grid.savings.percentage.toFixed(1)}% emissions`,
        impact: "medium",
        dataPoints: [
          "carbon intensity",
          "optimal times",
          "renewable percentage",
        ],
        actionable: true,
      });
    }

    // Document findings
    if (data.documents?.length > 0) {
      const totalDocEmissions = data.emissions.fromDocuments || 0;
      insights.push({
        type: "document_analysis",
        title: "Emissions Identified from Documents",
        description: `Extracted ${totalDocEmissions.toFixed(1)} kgCO2e from ${data.documents.length} documents`,
        impact: "low",
        dataPoints: ["invoices", "utility bills", "travel receipts"],
        actionable: false,
      });
    }

    return insights;
  }

  /**
   * Generate recommendations based on unified data
   */
  private async generateRecommendations(
    data: UnifiedData,
    insights: DataInsight[],
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Weather-based recommendations
    if (data.external.weather?.aggregated?.totalCoolingDemand > 20) {
      recommendations.push(
        "Pre-cool buildings during off-peak hours to reduce peak demand",
      );
    }

    // Market-based recommendations
    if (data.external.carbonMarket?.trends?.voluntary?.direction === "up") {
      recommendations.push(
        "Lock in carbon offset prices now before further increases",
      );
    }

    // Compliance recommendations
    const criticalDeadlines = data.external.regulatory?.deadlines?.filter(
      (d: any) => d.daysRemaining < 90,
    );
    if (criticalDeadlines?.length > 0) {
      recommendations.push(
        `Complete ${criticalDeadlines[0].regulation} requirements - ${criticalDeadlines[0].daysRemaining} days remaining`,
      );
    }

    // Grid recommendations
    if (data.external.grid?.optimal?.recommendations) {
      recommendations.push(
        ...data.external.grid.optimal.recommendations.slice(0, 2),
      );
    }

    // Emission reduction recommendations
    if (data.emissions.trend === "increasing") {
      recommendations.push(
        "Emissions trending upward - implement immediate reduction measures",
      );
    }

    return recommendations.slice(0, 5); // Top 5 recommendations
  }

  /**
   * Helper methods
   */
  private calculateWeatherEnergyImpact(weatherData: any[]): any {
    const totalHeating = this.sum(
      weatherData.map((w) => w.current.heatingDemand),
    );
    const totalCooling = this.sum(
      weatherData.map((w) => w.current.coolingDemand),
    );
    const total = totalHeating + totalCooling;

    return {
      percentage: total,
      direction: total > 0 ? "increased" : "decreased",
      breakdown: {
        heating: totalHeating,
        cooling: totalCooling,
      },
    };
  }

  private mergeEmissionsData(
    documentEmissions: any,
    internalEmissions: any,
  ): any {
    return {
      total: (documentEmissions?.total || 0) + (internalEmissions?.total || 0),
      byScope: {
        scope1:
          (documentEmissions?.byScope?.scope1 || 0) +
          (internalEmissions?.scope1 || 0),
        scope2:
          (documentEmissions?.byScope?.scope2 || 0) +
          (internalEmissions?.scope2 || 0),
        scope3:
          (documentEmissions?.byScope?.scope3 || 0) +
          (internalEmissions?.scope3 || 0),
      },
      trend: internalEmissions?.trend || "stable",
      fromDocuments: documentEmissions?.total || 0,
    };
  }

  private countDataPoints(data: UnifiedData): number {
    let count = 0;

    // Count all data points recursively
    const countObject = (obj: any) => {
      Object.values(obj).forEach((value) => {
        if (typeof value === "object" && value !== null) {
          countObject(value);
        } else {
          count++;
        }
      });
    };

    countObject(data);
    return count;
  }

  private average(numbers: number[]): number {
    return numbers.length > 0
      ? numbers.reduce((a, b) => a + b, 0) / numbers.length
      : 0;
  }

  private sum(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0);
  }

  private async storeUnifiedData(
    organizationId: string,
    data: UnifiedData,
  ): Promise<void> {
    await this.supabase.from("unified_data_snapshots").insert({
      organization_id: organizationId,
      data,
      created_at: new Date().toISOString(),
    });
  }

  private async storeDocumentEmissions(
    organizationId: string,
    emissions: any,
  ): Promise<void> {
    const emissionRecords = Object.entries(emissions.byDocument).map(
      ([fileName, amount]) => ({
        organization_id: organizationId,
        source_type: "document",
        source_id: fileName,
        emission_date: new Date().toISOString().split("T")[0],
        emissions_amount: amount,
        scope: 3, // Most document emissions are Scope 3
      }),
    );

    await this.supabase.from("emissions").insert(emissionRecords);
  }

  private async getOrganizationData(organizationId: string): Promise<any> {
    const { data: _data } = await this.supabase
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .single();

    return data;
  }

  private async getEmissionsData(organizationId: string): Promise<any> {
    const { data: _data } = await this.supabase
      .from("emissions")
      .select("*")
      .eq("organization_id", organizationId)
      .gte(
        "emission_date",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      );

    if (!data) return {};

    const total = data.reduce(
      (sum: number, e: any) => sum + e.emissions_amount,
      0,
    );
    const byScope = data.reduce((acc: any, e: any) => {
      const scope = `scope${e.scope}`;
      acc[scope] = (acc[scope] || 0) + e.emissions_amount;
      return acc;
    }, {} as any);

    return { total, ...byScope, trend: "stable" };
  }

  private async getTargetsData(organizationId: string): Promise<any> {
    const { data: _data } = await this.supabase
      .from("sustainability_targets")
      .select("*")
      .eq("organization_id", organizationId);

    return data;
  }

  private async getInitiativesData(organizationId: string): Promise<any> {
    const { data: _data } = await this.supabase
      .from("initiatives")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("status", "active");

    return data;
  }

  /**
   * Real-time data streaming
   */
  async streamRealTimeData(
    organizationId: string,
    callback: (data: RealTimeUpdate) => void,
  ): Promise<() => void> {
    // Subscribe to real-time updates
    const channels: any[] = [];

    // Grid carbon intensity updates (every 5 minutes)
    const gridInterval = setInterval(
      async () => {
        const gridData = await this.ingestGridData(organizationId);
        callback({
          type: "grid_update",
          data: gridData,
          timestamp: new Date().toISOString(),
        });
      },
      5 * 60 * 1000,
    );

    // Weather updates (every 30 minutes)
    const weatherInterval = setInterval(
      async () => {
        const weatherData = await this.ingestWeatherData(organizationId);
        callback({
          type: "weather_update",
          data: weatherData,
          timestamp: new Date().toISOString(),
        });
      },
      30 * 60 * 1000,
    );

    // Document processing updates
    const documentChannel = this.supabase
      .channel(`documents:${organizationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "document_queue",
          filter: `organization_id=eq.${organizationId}`,
        },
        async (payload) => {
          const result = await documentParser.parseDocument(
            Buffer.from(payload.new.file_data, "base64"),
            payload.new.document_type,
          );
          callback({
            type: "document_processed",
            data: result,
            timestamp: new Date().toISOString(),
          });
        },
      )
      .subscribe();

    channels.push(documentChannel);

    // Cleanup function
    return () => {
      clearInterval(gridInterval);
      clearInterval(weatherInterval);
      channels.forEach((channel) => channel.unsubscribe());
    };
  }
}

// Type definitions
interface IngestionStatus {
  success: boolean;
  sourcesIngested: number;
  dataPoints: number;
  timestamp: string;
}

interface UnifiedData {
  organization: any;
  emissions: any;
  external: {
    weather: any;
    carbonMarket: any;
    regulatory: any;
    grid: any;
  };
  documents: any[];
  timestamp: string;
}

interface DataInsight {
  type: string;
  title: string;
  description: string;
  impact: "low" | "medium" | "high" | "critical";
  dataPoints: string[];
  actionable: boolean;
}

interface RealTimeUpdate {
  type:
    | "grid_update"
    | "weather_update"
    | "document_processed"
    | "market_update";
  data: any;
  timestamp: string;
}

// Export configured instance
export const dataIngestion = new UnifiedDataIngestion(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
