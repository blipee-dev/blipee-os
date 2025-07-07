/**
 * COMPREHENSIVE EMISSION FACTORS DATABASE
 * Science-based factors for accurate carbon calculations
 */

export class EmissionFactorsDatabase {
  // Energy emission factors (kgCO2e per unit)
  private static readonly ENERGY_FACTORS = {
    electricity: {
      // Grid averages by region (kgCO2e/kWh)
      global: {
        world: 0.475,
        default: 0.475,
      },
      northAmerica: {
        USA: 0.417,
        "US-CA": 0.24, // California
        "US-TX": 0.469, // Texas
        "US-NY": 0.296, // New York
        "US-FL": 0.438, // Florida
        "US-WA": 0.113, // Washington (hydro)
        Canada: 0.13,
        "CA-QC": 0.002, // Quebec (hydro)
        "CA-AB": 0.79, // Alberta (coal)
        Mexico: 0.495,
      },
      europe: {
        EU27: 0.276,
        Germany: 0.366,
        France: 0.058, // Nuclear
        UK: 0.233,
        Spain: 0.238,
        Italy: 0.386,
        Netherlands: 0.39,
        Poland: 0.773, // Coal
        Sweden: 0.045, // Hydro/nuclear
        Norway: 0.016, // Hydro
      },
      asia: {
        China: 0.581,
        India: 0.722,
        Japan: 0.471,
        "South Korea": 0.459,
        Singapore: 0.408,
        Indonesia: 0.725,
      },
      oceania: {
        Australia: 0.656,
        "New Zealand": 0.098, // Hydro
      },
      africa: {
        "South Africa": 0.928, // Coal
        Kenya: 0.275,
        Nigeria: 0.432,
      },
      southAmerica: {
        Brazil: 0.096, // Hydro
        Argentina: 0.332,
        Chile: 0.418,
      },
    },
    naturalGas: {
      // Per kWh of energy
      combustion: 0.185,
      // Per cubic meter
      perCubicMeter: 1.96,
      // Per therm
      perTherm: 5.31,
    },
    fuel: {
      // Per liter
      gasoline: 2.31,
      diesel: 2.68,
      aviation: 2.52,
      marine: 3.17,
      // Per kg
      coal: 2.42,
      propane: 2.98,
      // Heating oil per liter
      heatingOil: 2.52,
    },
    renewable: {
      solar: 0.048, // Lifecycle emissions
      wind: 0.012,
      hydro: 0.024,
      nuclear: 0.012,
      biomass: 0.23, // Depends on source
      geothermal: 0.038,
    },
  };

  // Transportation emission factors
  private static readonly TRANSPORT_FACTORS = {
    road: {
      // Per passenger-km
      car: {
        small: 0.12,
        medium: 0.171,
        large: 0.213,
        suv: 0.251,
        electric: 0.053, // Depends on grid
        hybrid: 0.103,
      },
      // Per vehicle-km
      truck: {
        light: 0.249,
        medium: 0.396,
        heavy: 0.893,
      },
      bus: {
        city: 0.089, // Per passenger-km
        coach: 0.027, // Per passenger-km
      },
      motorcycle: 0.103, // Per km
    },
    rail: {
      // Per passenger-km
      subway: 0.041,
      tram: 0.029,
      train: {
        electric: 0.041,
        diesel: 0.091,
      },
      highSpeed: 0.014,
      freight: 0.024, // Per tonne-km
    },
    air: {
      // Per passenger-km
      domestic: {
        economy: 0.255,
        premium: 0.383,
        business: 0.737,
        first: 1.474,
      },
      shortHaul: {
        // <1500km
        economy: 0.206,
        premium: 0.309,
        business: 0.595,
        first: 1.19,
      },
      longHaul: {
        // >1500km
        economy: 0.15,
        premium: 0.225,
        business: 0.434,
        first: 0.868,
      },
      cargo: 0.538, // Per tonne-km
    },
    marine: {
      ferry: {
        foot: 0.019, // Per passenger-km
        car: 0.13, // Per vehicle-km
      },
      cargo: {
        container: 0.016, // Per tonne-km
        bulk: 0.003,
        tanker: 0.009,
      },
      cruise: 0.285, // Per passenger-km
    },
  };

  // Waste emission factors
  private static readonly WASTE_FACTORS = {
    // Per tonne
    landfill: {
      mixed: 467,
      organic: 510,
      paper: 394,
      plastic: 6,
      glass: 6,
      metal: 6,
    },
    recycling: {
      paper: -3890, // Negative = avoided emissions
      plastic: -1680,
      glass: -314,
      metal: -9080,
      aluminum: -14040,
    },
    composting: {
      organic: 69,
      garden: 69,
    },
    incineration: {
      mixed: 330,
      plastic: 2680,
      paper: 0, // Biogenic
    },
  };

  // Water and wastewater factors
  private static readonly WATER_FACTORS = {
    // Per cubic meter
    supply: {
      default: 0.344,
      surfaceWater: 0.197,
      groundwater: 0.422,
      desalination: 1.826,
    },
    treatment: {
      primary: 0.196,
      secondary: 0.283,
      tertiary: 0.491,
      advanced: 0.712,
    },
  };

  // Agriculture and food factors
  private static readonly FOOD_FACTORS = {
    // Per kg of product
    meat: {
      beef: 26.5,
      lamb: 22.9,
      pork: 7.6,
      chicken: 5.5,
      fish: 5.1,
    },
    dairy: {
      milk: 1.3, // Per liter
      cheese: 9.8,
      yogurt: 2.2,
      butter: 11.9,
    },
    produce: {
      vegetables: 0.4,
      fruits: 0.4,
      grains: 0.8,
      rice: 2.7,
      potatoes: 0.3,
    },
    processed: {
      bread: 0.8,
      pasta: 1.2,
      beverages: 0.5,
    },
  };

  // Material production factors
  private static readonly MATERIAL_FACTORS = {
    // Per kg
    metals: {
      steel: 2.3,
      aluminum: 11.9,
      copper: 3.8,
      zinc: 3.5,
    },
    construction: {
      cement: 0.9,
      concrete: 0.14, // Per kg
      brick: 0.24,
      timber: -1.8, // Carbon storage
      glass: 1.2,
    },
    plastics: {
      PET: 3.4,
      HDPE: 1.9,
      PVC: 2.5,
      PP: 2.0,
      PS: 3.4,
    },
    paper: {
      virgin: 3.3,
      recycled: 1.3,
    },
    textiles: {
      cotton: 8.0,
      polyester: 6.4,
      wool: 20.0,
      nylon: 7.5,
    },
  };

  // Digital and IT factors
  private static readonly DIGITAL_FACTORS = {
    // Per unit
    devices: {
      laptop: 350, // Lifecycle emissions in kg
      desktop: 600,
      monitor: 450,
      smartphone: 70,
      tablet: 100,
      server: 3000,
    },
    // Per GB
    dataTransfer: {
      fixed: 0.00004,
      mobile: 0.00018,
      wifi: 0.00004,
    },
    // Per hour
    usage: {
      laptop: 0.02,
      desktop: 0.06,
      server: 0.2,
      dataCenter: 0.15, // Per server
    },
    // Cloud services per GB-month
    cloud: {
      storage: 0.000023,
      compute: 0.0001, // Per hour
    },
  };

  /**
   * Get emission factor with fallbacks
   */
  static getEmissionFactor(
    category: string,
    subcategory: string,
    specific?: string,
  ): number {
    const categoryData = (this as any)[`${category.toUpperCase()}_FACTORS`];
    if (!categoryData) return 0;

    if (specific && categoryData[subcategory]?.[specific]) {
      return categoryData[subcategory][specific];
    }

    if (categoryData[subcategory]) {
      // Return default if it's a number
      if (typeof categoryData[subcategory] === "number") {
        return categoryData[subcategory];
      }
      // Return first value if it's an object
      if (typeof categoryData[subcategory] === "object") {
        return Object.values(categoryData[subcategory])[0] as number;
      }
    }

    return 0;
  }

  /**
   * Calculate emissions from activity data
   */
  static calculateEmissions(activity: {
    type: string;
    category: string;
    subcategory?: string;
    value: number;
    unit: string;
    location?: string;
  }): {
    emissions: number;
    factor: number;
    calculation: string;
    scope: number;
  } {
    let factor = 0;
    let scope = 3; // Default to Scope 3

    switch (activity.type) {
      case "energy":
        if (activity.category === "electricity") {
          factor = this.getElectricityFactor(activity.location);
          scope = 2;
        } else if (activity.category === "naturalGas") {
          factor = this.ENERGY_FACTORS.naturalGas.combustion;
          scope = 1;
        } else if (activity.category === "fuel") {
          factor =
            this.ENERGY_FACTORS.fuel[
              activity.subcategory as keyof typeof this.ENERGY_FACTORS.fuel
            ] || 0;
          scope = 1;
        }
        break;

      case "transport":
        factor = this.getTransportFactor(
          activity.category,
          activity.subcategory,
        );
        scope = activity.category === "company_fleet" ? 1 : 3;
        break;

      case "waste":
        const wasteCategory =
          this.WASTE_FACTORS[
            activity.category as keyof typeof this.WASTE_FACTORS
          ];
        factor =
          activity.subcategory && wasteCategory
            ? (wasteCategory as any)[activity.subcategory] || 0
            : 0;
        break;

      case "water":
        const waterCategory =
          this.WATER_FACTORS[
            activity.category as keyof typeof this.WATER_FACTORS
          ];
        factor =
          activity.subcategory && waterCategory
            ? (waterCategory as any)[activity.subcategory] || 0.344
            : 0.344;
        break;

      case "materials":
        factor = this.getMaterialFactor(
          activity.category,
          activity.subcategory,
        );
        break;
    }

    const emissions = activity.value * factor;

    return {
      emissions,
      factor,
      calculation: `${activity.value} ${activity.unit} × ${factor} kgCO2e/${activity.unit} = ${emissions.toFixed(2)} kgCO2e`,
      scope,
    };
  }

  /**
   * Get electricity emission factor for location
   */
  static getElectricityFactor(location?: string): number {
    if (!location) return this.ENERGY_FACTORS.electricity.global.default;

    // Check all regions
    for (const region of Object.values(this.ENERGY_FACTORS.electricity)) {
      if (typeof region === "object" && location in region) {
        return region[location as keyof typeof region] as number;
      }
    }

    // Check if it's a country code
    const countryFactors: Record<string, number> = {
      US: this.ENERGY_FACTORS.electricity.northAmerica.USA,
      CA: this.ENERGY_FACTORS.electricity.northAmerica.Canada,
      UK: this.ENERGY_FACTORS.electricity.europe.UK,
      DE: this.ENERGY_FACTORS.electricity.europe.Germany,
      FR: this.ENERGY_FACTORS.electricity.europe.France,
      CN: this.ENERGY_FACTORS.electricity.asia.China,
      IN: this.ENERGY_FACTORS.electricity.asia.India,
      JP: this.ENERGY_FACTORS.electricity.asia.Japan,
      AU: this.ENERGY_FACTORS.electricity.oceania.Australia,
      BR: this.ENERGY_FACTORS.electricity.southAmerica.Brazil,
    };

    return (
      countryFactors[location] || this.ENERGY_FACTORS.electricity.global.default
    );
  }

  /**
   * Get transport emission factor
   */
  static getTransportFactor(mode: string, type?: string): number {
    const modeData =
      this.TRANSPORT_FACTORS[mode as keyof typeof this.TRANSPORT_FACTORS];
    if (!modeData) return 0;

    if (type && typeof modeData === "object" && type in modeData) {
      const typeData = modeData[type as keyof typeof modeData];
      if (typeof typeData === "number") return typeData;
      if (typeof typeData === "object") {
        return (
          (typeData as any).economy || (Object.values(typeData)[0] as number)
        );
      }
    }

    return 0;
  }

  /**
   * Get material emission factor
   */
  static getMaterialFactor(category: string, type?: string): number {
    const categoryData =
      this.MATERIAL_FACTORS[category as keyof typeof this.MATERIAL_FACTORS];
    if (!categoryData) return 0;

    if (type && type in categoryData) {
      return categoryData[type as keyof typeof categoryData] as number;
    }

    return Object.values(categoryData)[0] as number;
  }

  /**
   * Get comprehensive factors for a category
   */
  static getCategoryFactors(category: string): Record<string, any> {
    const categoryMap: Record<string, any> = {
      energy: this.ENERGY_FACTORS,
      transport: this.TRANSPORT_FACTORS,
      waste: this.WASTE_FACTORS,
      water: this.WATER_FACTORS,
      food: this.FOOD_FACTORS,
      materials: this.MATERIAL_FACTORS,
      digital: this.DIGITAL_FACTORS,
    };

    return categoryMap[category.toLowerCase()] || {};
  }

  /**
   * Search for emission factors
   */
  static searchFactors(query: string): Array<{
    category: string;
    subcategory: string;
    item: string;
    factor: number;
    unit: string;
  }> {
    const results: any[] = [];
    const lowerQuery = query.toLowerCase();

    // Search through all categories
    Object.entries({
      energy: this.ENERGY_FACTORS,
      transport: this.TRANSPORT_FACTORS,
      waste: this.WASTE_FACTORS,
      water: this.WATER_FACTORS,
      food: this.FOOD_FACTORS,
      materials: this.MATERIAL_FACTORS,
      digital: this.DIGITAL_FACTORS,
    }).forEach(([category, factors]) => {
      this.searchInObject(factors, category, "", lowerQuery, results);
    });

    return results;
  }

  /**
   * Recursive search helper
   */
  private static searchInObject(
    obj: any,
    category: string,
    path: string,
    query: string,
    results: any[],
  ): void {
    Object.entries(obj).forEach(([key, value]) => {
      const currentPath = path ? `${path}.${key}` : key;

      if (key.toLowerCase().includes(query)) {
        if (typeof value === "number") {
          results.push({
            category,
            subcategory: path,
            item: key,
            factor: value,
            unit: this.getUnit(category, path),
          });
        } else if (typeof value === "object" && value !== null) {
          // Add all items in this subcategory
          Object.entries(value).forEach(([subKey, subValue]) => {
            if (typeof subValue === "number") {
              results.push({
                category,
                subcategory: currentPath,
                item: subKey,
                factor: subValue,
                unit: this.getUnit(category, currentPath),
              });
            }
          });
        }
      }

      if (typeof value === "object") {
        this.searchInObject(value, category, currentPath, query, results);
      }
    });
  }

  /**
   * Get unit for a category/subcategory
   */
  private static getUnit(category: string, subcategory: string): string {
    const units: Record<string, Record<string, string>> = {
      energy: {
        electricity: "kgCO2e/kWh",
        naturalGas: "kgCO2e/kWh",
        fuel: "kgCO2e/L",
      },
      transport: {
        road: "kgCO2e/km",
        rail: "kgCO2e/passenger-km",
        air: "kgCO2e/passenger-km",
        marine: "kgCO2e/passenger-km",
      },
      waste: {
        default: "kgCO2e/tonne",
      },
      water: {
        default: "kgCO2e/m³",
      },
      food: {
        default: "kgCO2e/kg",
      },
      materials: {
        default: "kgCO2e/kg",
      },
      digital: {
        devices: "kgCO2e/unit",
        dataTransfer: "kgCO2e/GB",
        usage: "kgCO2e/hour",
      },
    };

    return (
      units[category]?.[subcategory] ||
      units[category]?.default ||
      "kgCO2e/unit"
    );
  }
}

// Export for use
export const emissionFactors = EmissionFactorsDatabase;
