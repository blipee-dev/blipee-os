/**
 * Carbon Equivalents Calculator - Enhanced Educational Version
 *
 * Converts CO2e emissions into relatable, real-world comparisons
 * Features:
 * - Multiple varied examples per emission range
 * - Clear, educational descriptions
 * - Rotation prevents repetition
 * - Location-aware examples
 * - Fun facts and surprising comparisons
 * - Full i18n support with translation function
 */

export interface CarbonEquivalent {
  icon: string;
  description: string;
  educationalContext?: string; // Additional educational info
  didYouKnow?: string; // Fun fact or surprising detail
  locale?: string;
}

// Translation function type
type TranslateFn = (key: string, params?: Record<string, any>) => string;

// Helper to get translated or fallback text
function tr(t: TranslateFn | undefined, key: string, params?: Record<string, any>, fallback?: string): string {
  if (t) {
    return t(key, params);
  }
  return fallback || key;
}

// Track which examples were recently shown to ensure variety
// Key format: "category-tco2eRange" -> array of recently used indices
const recentlyShownExamples = new Map<string, number[]>();
const CACHE_DURATION = 300000; // 5 minutes instead of 1 minute
const lastCleanup = { timestamp: Date.now() };

/**
 * Get carbon equivalents for a given emission value in tCO2e
 * Now with variety, clear explanations, educational context, and i18n support!
 *
 * @param tco2e - Emissions in tonnes of CO2 equivalent
 * @param country - Country code for localized examples (default: 'portugal')
 * @param t - Optional translation function for i18n support
 * @returns CarbonEquivalent with clear, educational description
 */
export function getCarbonEquivalent(
  tco2e: number,
  country: string = 'portugal',
  t?: TranslateFn
): CarbonEquivalent | null {
  if (tco2e <= 0) return null;

  const countryLower = country.toLowerCase();

  // Define MULTIPLE equivalents per category for variety
  const equivalentCategories = {
    // Very small emissions (< 0.5 tCO2e) - Everyday items
    verySmall: [
      {
        icon: '📱',
        calc: (t: number) => Math.ceil(t * 121000),
        format: (n: number) => tr(t, 'carbonEquivalents.verySmall.smartphone.format', { n: n.toLocaleString() }, `${n.toLocaleString()} smartphone charges`),
        context: tr(t, 'carbonEquivalents.verySmall.smartphone.context', {}, 'Charging your phone fully uses about 0.008 kg CO2e per charge'),
        didYouKnow: tr(t, 'carbonEquivalents.verySmall.smartphone.didYouKnow', {}, 'One full charge = watching 2 hours of Netflix on your phone!')
      },
      {
        icon: '☕',
        calc: (t: number) => Math.ceil(t * 400),
        format: (n: number) => tr(t, 'carbonEquivalents.verySmall.coffee.format', { n: n.toLocaleString() }, `${n.toLocaleString()} cups of coffee`),
        context: tr(t, 'carbonEquivalents.verySmall.coffee.context', {}, 'Making coffee (beans, water heating, milk) ≈ 1.25 kg CO2e per cup'),
        didYouKnow: tr(t, 'carbonEquivalents.verySmall.coffee.didYouKnow', {}, 'The milk in your latte creates more emissions than the coffee beans!')
      },
      {
        icon: '🍔',
        calc: (t: number) => Math.ceil(t * 50),
        format: (n: number) => tr(t, n === 1 ? 'carbonEquivalents.verySmall.burger.format_one' : 'carbonEquivalents.verySmall.burger.format', { n }, `${n} beef burger${n === 1 ? '' : 's'}`),
        context: tr(t, 'carbonEquivalents.verySmall.burger.context', {}, 'One beef burger creates ~10 kg CO2e (farm to plate)'),
        didYouKnow: tr(t, 'carbonEquivalents.verySmall.burger.didYouKnow', {}, 'A plant-based burger creates 90% less emissions!')
      },
      {
        icon: '🚿',
        calc: (t: number) => Math.ceil(t * 25),
        format: (n: number) => tr(t, n === 1 ? 'carbonEquivalents.verySmall.shower.format_one' : 'carbonEquivalents.verySmall.shower.format', { n }, `${n} hot shower${n === 1 ? '' : 's'} (10 minutes)`),
        context: tr(t, 'carbonEquivalents.verySmall.shower.context', {}, 'Heating water for a shower uses ~20 kg CO2e'),
        didYouKnow: tr(t, 'carbonEquivalents.verySmall.shower.didYouKnow', {}, 'Reducing shower time by 2 minutes saves 10 kg CO2e per month!')
      }
    ],

    // Small emissions (0.5-2 tCO2e) - Trees & nature
    small: [
      {
        icon: '🌳',
        calc: (t: number) => Math.ceil(t * 1.15),
        format: (n: number) => tr(t, n === 1 ? 'carbonEquivalents.small.matureTree.format_one' : 'carbonEquivalents.small.matureTree.format', { n }, `${n} mature tree${n === 1 ? '' : 's'} absorbing CO2 for 1 year`),
        context: tr(t, 'carbonEquivalents.small.matureTree.context', {}, 'One mature tree absorbs ~21 kg CO2e per year through photosynthesis'),
        didYouKnow: tr(t, 'carbonEquivalents.small.matureTree.didYouKnow', {}, 'It takes a tree 20+ years to become a "mature" carbon absorber!')
      },
      {
        icon: '🌲',
        calc: (t: number) => Math.ceil(t * 48),
        format: (n: number) => tr(t, n === 1 ? 'carbonEquivalents.small.seedling.format_one' : 'carbonEquivalents.small.seedling.format', { n }, `${n} tree seedling${n === 1 ? '' : 's'} growing for 10 years`),
        context: tr(t, 'carbonEquivalents.small.seedling.context', {}, 'Young trees absorb less CO2 initially but more as they grow'),
        didYouKnow: tr(t, 'carbonEquivalents.small.seedling.didYouKnow', {}, 'A growing forest absorbs 2-3× more CO2 than a mature forest!')
      },
      {
        icon: '🌾',
        calc: (t: number) => Math.ceil(t * 0.4),
        format: (n: number) => tr(t, n === 1 ? 'carbonEquivalents.small.grassland.format_one' : 'carbonEquivalents.small.grassland.format', { n }, `${n} hectare${n === 1 ? '' : 's'} of grassland for 1 year`),
        context: tr(t, 'carbonEquivalents.small.grassland.context', {}, 'Grasslands absorb ~2.5 tonnes CO2e per hectare annually'),
        didYouKnow: tr(t, 'carbonEquivalents.small.grassland.didYouKnow', {}, 'Grasslands store more carbon in their roots than trees do!')
      },
      {
        icon: '🌊',
        calc: (t: number) => Math.ceil(t * 0.5),
        format: (n: number) => tr(t, n === 1 ? 'carbonEquivalents.small.oceanAlgae.format_one' : 'carbonEquivalents.small.oceanAlgae.format', { n }, `${n} hectare${n === 1 ? '' : 's'} of ocean algae for 1 year`),
        context: tr(t, 'carbonEquivalents.small.oceanAlgae.context', {}, 'Ocean phytoplankton absorbs ~2 tonnes CO2e per hectare'),
        didYouKnow: tr(t, 'carbonEquivalents.small.oceanAlgae.didYouKnow', {}, 'Oceans absorb 25% of all human CO2 emissions every year!')
      }
    ],

    // Medium-small (2-5 tCO2e) - Transportation
    mediumSmall: {
      portugal: [
        {
          icon: '🚗',
          calc: (t: number) => Math.ceil(t * 2500),
          format: (n: number) => tr(t, n === 1 ? 'carbonEquivalents.mediumSmall.portugal.driving.format_one' : 'carbonEquivalents.mediumSmall.portugal.driving.format', { n: n.toLocaleString(), trips: Math.ceil(n / 312) }, `${n.toLocaleString()} km driving (${Math.ceil(n / 312)} trip${Math.ceil(n / 312) === 1 ? '' : 's'} Lisbon ↔ Porto)`),
          context: tr(t, 'carbonEquivalents.mediumSmall.portugal.driving.context', {}, 'Average car emits ~0.4 kg CO2e per km'),
          didYouKnow: tr(t, 'carbonEquivalents.mediumSmall.portugal.driving.didYouKnow', {}, 'Taking the train instead reduces emissions by 80%!')
        },
        {
          icon: '🚙',
          calc: (t: number) => Math.ceil(t * 167),
          format: (n: number) => tr(t, n === 1 ? 'carbonEquivalents.mediumSmall.portugal.lisbonAlgarve.format_one' : 'carbonEquivalents.mediumSmall.portugal.lisbonAlgarve.format', { n }, `${n} trip${n === 1 ? '' : 's'} Lisbon ↔ Algarve by car`),
          context: tr(t, 'carbonEquivalents.mediumSmall.portugal.lisbonAlgarve.context', {}, '~300 km per trip, family sedan'),
          didYouKnow: tr(t, 'carbonEquivalents.mediumSmall.portugal.lisbonAlgarve.didYouKnow', {}, 'Carpooling with 3 friends makes this 75% more efficient!')
        },
        {
          icon: '🛵',
          calc: (t: number) => Math.ceil(t * 5000),
          format: (n: number) => tr(t, 'carbonEquivalents.mediumSmall.portugal.scooter.format', { n: n.toLocaleString() }, `${n.toLocaleString()} km on a scooter`),
          context: tr(t, 'carbonEquivalents.mediumSmall.portugal.scooter.context', {}, 'Scooters emit half the CO2 of cars per km'),
          didYouKnow: tr(t, 'carbonEquivalents.mediumSmall.portugal.scooter.didYouKnow', {}, 'Electric scooters emit 90% less than gas scooters!')
        }
      ],
      spain: [
        {
          icon: '🚗',
          calc: (t: number) => Math.ceil(t * 2500),
          format: (n: number) => tr(t, n === 1 ? 'carbonEquivalents.mediumSmall.spain.driving.format_one' : 'carbonEquivalents.mediumSmall.spain.driving.format', { n: n.toLocaleString(), trips: Math.ceil(n / 625) }, `${n.toLocaleString()} km driving (${Math.ceil(n / 625)} trip${Math.ceil(n / 625) === 1 ? '' : 's'} Madrid ↔ Barcelona)`),
          context: tr(t, 'carbonEquivalents.mediumSmall.spain.driving.context', {}, 'Average car emits ~0.4 kg CO2e per km'),
          didYouKnow: tr(t, 'carbonEquivalents.mediumSmall.spain.driving.didYouKnow', {}, 'The AVE high-speed train uses 85% less emissions!')
        },
        {
          icon: '🚙',
          calc: (t: number) => Math.ceil(t * 125),
          format: (n: number) => tr(t, n === 1 ? 'carbonEquivalents.mediumSmall.spain.madridValencia.format_one' : 'carbonEquivalents.mediumSmall.spain.madridValencia.format', { n }, `${n} trip${n === 1 ? '' : 's'} Madrid ↔ Valencia by car`),
          context: tr(t, 'carbonEquivalents.mediumSmall.spain.madridValencia.context', {}, '~400 km per trip, family car'),
          didYouKnow: tr(t, 'carbonEquivalents.mediumSmall.spain.madridValencia.didYouKnow', {}, 'Spanish trains run on 60% renewable energy!')
        }
      ],
      global: [
        {
          icon: '🚗',
          calc: (t: number) => Math.ceil(t * 2500),
          format: (n: number) => tr(t, 'carbonEquivalents.mediumSmall.global.driving.format', { n: n.toLocaleString() }, `${n.toLocaleString()} km of car travel`),
          context: tr(t, 'carbonEquivalents.mediumSmall.global.driving.context', {}, 'Average car: 0.4 kg CO2e per km'),
          didYouKnow: tr(t, 'carbonEquivalents.mediumSmall.global.driving.didYouKnow', {}, 'EVs reduce this by 70% (depending on electricity source)!')
        }
      ]
    },

    // Medium (5-20 tCO2e) - Flights
    medium: {
      portugal: [
        {
          icon: '✈️',
          calc: (t: number) => Math.ceil(t * 0.67),
          format: (n: number) => tr(t, n === 1 ? 'carbonEquivalents.medium.portugal.lisbonParis.format_one' : 'carbonEquivalents.medium.portugal.lisbonParis.format', { n }, n === 1 ? '1 round-trip flight Lisbon → Paris (economy, 2,900 km)' : `${n} round-trip flights Lisbon → Paris`),
          context: tr(t, 'carbonEquivalents.medium.portugal.lisbonParis.context', {}, 'Short-haul flight: ~1.5 tonnes CO2e round-trip'),
          didYouKnow: tr(t, 'carbonEquivalents.medium.portugal.lisbonParis.didYouKnow', {}, '8 hours on a train creates 95% less emissions than this flight!')
        },
        {
          icon: '🛫',
          calc: (t: number) => Math.ceil(t * 0.5),
          format: (n: number) => tr(t, n === 1 ? 'carbonEquivalents.medium.portugal.lisbonLondon.format_one' : 'carbonEquivalents.medium.portugal.lisbonLondon.format', { n }, n === 1 ? '1 round-trip flight Lisbon → London (economy, 3,200 km)' : `${n} round-trip flights Lisbon → London`),
          context: tr(t, 'carbonEquivalents.medium.portugal.lisbonLondon.context', {}, 'Short-haul flight: ~2 tonnes CO2e round-trip'),
          didYouKnow: tr(t, 'carbonEquivalents.medium.portugal.lisbonLondon.didYouKnow', {}, 'Business class seats create 3× more emissions (take up more space)!')
        },
        {
          icon: '🌍',
          calc: (t: number) => Math.ceil(t * 0.4),
          format: (n: number) => tr(t, n === 1 ? 'carbonEquivalents.medium.portugal.lisbonRome.format_one' : 'carbonEquivalents.medium.portugal.lisbonRome.format', { n }, n === 1 ? '1 round-trip flight Lisbon → Rome (economy, 3,000 km)' : `${n} round-trip flights within Europe`),
          context: tr(t, 'carbonEquivalents.medium.portugal.lisbonRome.context', {}, 'European flights: ~2.5 tonnes CO2e round-trip'),
          didYouKnow: tr(t, 'carbonEquivalents.medium.portugal.lisbonRome.didYouKnow', {}, 'Planes are 5-10× more polluting per km than trains!')
        }
      ],
      spain: [
        {
          icon: '✈️',
          calc: (t: number) => Math.ceil(t * 0.67),
          format: (n: number) => tr(t, n === 1 ? 'carbonEquivalents.medium.spain.madridLondon.format_one' : 'carbonEquivalents.medium.spain.madridLondon.format', { n }, n === 1 ? '1 round-trip flight Madrid → London (economy, 2,600 km)' : `${n} round-trip flights Madrid → London`),
          context: tr(t, 'carbonEquivalents.medium.spain.madridLondon.context', {}, 'Short-haul flight: ~1.5 tonnes CO2e round-trip'),
          didYouKnow: tr(t, 'carbonEquivalents.medium.spain.madridLondon.didYouKnow', {}, 'A video call eliminates this emission entirely!')
        }
      ],
      global: [
        {
          icon: '✈️',
          calc: (t: number) => Math.ceil(t * 0.5),
          format: (n: number) => tr(t, n === 1 ? 'carbonEquivalents.medium.global.regionalFlight.format_one' : 'carbonEquivalents.medium.global.regionalFlight.format', { n }, n === 1 ? '1 regional round-trip flight (economy, ~3,000 km)' : `${n} regional round-trip flights`),
          context: tr(t, 'carbonEquivalents.medium.global.regionalFlight.context', {}, 'Average short-haul: ~2 tonnes CO2e'),
          didYouKnow: tr(t, 'carbonEquivalents.medium.global.regionalFlight.didYouKnow', {}, 'Aviation creates 2.5% of global CO2 emissions!')
        }
      ]
    },

    // Large (20-50 tCO2e) - Household energy
    large: [
      {
        icon: '💡',
        calc: (t: number) => Math.ceil(t * 2), // Always round UP
        format: (n: number) => tr(t, 'carbonEquivalents.large.electricity.format', { n }, `${n} months of household electricity`),
        context: tr(t, 'carbonEquivalents.large.electricity.context', {}, 'Average home: ~10 tonnes CO2e per year from electricity'),
        didYouKnow: tr(t, 'carbonEquivalents.large.electricity.didYouKnow', {}, 'Switching to LED bulbs saves 80 kg CO2e per bulb per year!')
      },
      {
        icon: '🏠',
        calc: (t: number) => Math.ceil(t * 12 / 7.5), // Always round UP
        format: (n: number) => tr(t, 'carbonEquivalents.large.hvac.format', { n }, `${n} months heating/cooling an average home`),
        context: tr(t, 'carbonEquivalents.large.hvac.context', {}, 'HVAC is typically 40% of home energy use'),
        didYouKnow: tr(t, 'carbonEquivalents.large.hvac.didYouKnow', {}, 'A smart thermostat can reduce this by 15-20%!')
      },
      {
        icon: '🔥',
        calc: (t: number) => Math.ceil(t * 6), // Always round UP
        format: (n: number) => tr(t, 'carbonEquivalents.large.gasHeating.format', { n }, `${n} months of natural gas heating`),
        context: tr(t, 'carbonEquivalents.large.gasHeating.context', {}, 'Gas heating: ~3.5 tonnes CO2e per year'),
        didYouKnow: tr(t, 'carbonEquivalents.large.gasHeating.didYouKnow', {}, 'Heat pumps use 3× less energy than gas heating!')
      },
      {
        icon: '⚡',
        calc: (t: number) => Math.ceil(t * 50), // Always round UP
        format: (n: number) => tr(t, 'carbonEquivalents.large.airConditioning.format', { n: n.toLocaleString() }, `${n.toLocaleString()} hours of air conditioning (large home)`),
        context: tr(t, 'carbonEquivalents.large.airConditioning.context', {}, 'AC can use 20-50 kg CO2e per month in summer'),
        didYouKnow: tr(t, 'carbonEquivalents.large.airConditioning.didYouKnow', {}, 'Raising AC temp by 1°C saves 7% energy!')
      }
    ],

    // Very large (50+ tCO2e) - Big impacts & climate consequences
    veryLarge: [
      {
        icon: '🌳',
        calc: (t: number) => Math.ceil(t / 0.87), // 1 tree absorbs 0.87 tonnes/year (average)
        format: (n: number) => tr(t, 'carbonEquivalents.veryLarge.treesYear.format', { n: n.toLocaleString() }, `${n.toLocaleString()} mature trees absorbing CO2 for 1 year`),
        context: tr(t, 'carbonEquivalents.veryLarge.treesYear.context', {}, 'One mature tree absorbs ~0.87 tonnes CO2e per year through photosynthesis'),
        didYouKnow: tr(t, 'carbonEquivalents.veryLarge.treesYear.didYouKnow', {}, 'It takes a tree 20+ years to become a "mature" carbon absorber!')
      },
      {
        icon: '🏭',
        calc: (t: number) => Math.ceil((t / 1000) * 12), // Factory emits 1000 tonnes/year
        format: (n: number) => tr(t, 'carbonEquivalents.veryLarge.factoryMonths.format', { n }, `${n} months of a small factory's emissions`),
        context: tr(t, 'carbonEquivalents.veryLarge.factoryMonths.context', {}, 'Small manufacturing: ~1000 tonnes CO2e per year (83 tonnes/month)'),
        didYouKnow: tr(t, 'carbonEquivalents.veryLarge.factoryMonths.didYouKnow', {}, 'This is why industrial efficiency is so critical!')
      },
      {
        icon: '🌍',
        calc: (t: number) => Math.ceil(t / 4), // Global average is 4 tonnes/person/year
        format: (n: number) => tr(t, n === 1 ? 'carbonEquivalents.veryLarge.peopleYearly.format_one' : 'carbonEquivalents.veryLarge.peopleYearly.format', { n }, `${n} average ${n === 1 ? 'person\'s' : 'people\'s'} yearly carbon footprint`),
        context: tr(t, 'carbonEquivalents.veryLarge.peopleYearly.context', {}, 'Global average: ~4 tonnes CO2e per person per year'),
        didYouKnow: tr(t, 'carbonEquivalents.veryLarge.peopleYearly.didYouKnow', {}, 'US average is 16 tonnes, India is 1.9 tonnes per person!')
      },
      {
        icon: '✈️',
        calc: (t: number) => Math.ceil(t / 4), // Long-haul flight is ~4 tonnes round-trip
        format: (n: number) => tr(t, 'carbonEquivalents.veryLarge.transatlanticFlights.format', { n }, `${n} round-trip transatlantic flights (economy)`),
        context: tr(t, 'carbonEquivalents.veryLarge.transatlanticFlights.context', {}, 'Long-haul flight: ~4 tonnes CO2e per passenger round-trip'),
        didYouKnow: tr(t, 'carbonEquivalents.veryLarge.transatlanticFlights.didYouKnow', {}, 'One long-haul flight = a year of driving for many people!')
      },
      {
        icon: '🧊',
        calc: (t: number) => Math.ceil(t * 3), // Each tonne melts ~3 m²
        format: (n: number) => tr(t, 'carbonEquivalents.veryLarge.arcticIce.format', { n: n.toLocaleString() }, `${n.toLocaleString()} m² of Arctic sea ice melted`),
        context: tr(t, 'carbonEquivalents.veryLarge.arcticIce.context', {}, 'Each tonne of CO2 melts ~3 m² of Arctic summer sea ice'),
        didYouKnow: tr(t, 'carbonEquivalents.veryLarge.arcticIce.didYouKnow', {}, 'Arctic sea ice has declined 13% per decade since 1979!')
      },
      {
        icon: '🌊',
        calc: (t: number) => Math.ceil((t / 1000) * 0.32), // 0.32mm per 1000 tonnes
        format: (n: number) => tr(t, n === 0 ? 'carbonEquivalents.veryLarge.seaLevel.format_zero' : 'carbonEquivalents.veryLarge.seaLevel.format', { n }, n === 0 ? '< 1 mm of global sea level rise' : `${n} mm of global sea level rise`),
        context: tr(t, 'carbonEquivalents.veryLarge.seaLevel.context', {}, 'Every 1000 tonnes CO2e contributes to 0.32 mm sea level rise'),
        didYouKnow: tr(t, 'carbonEquivalents.veryLarge.seaLevel.didYouKnow', {}, 'Sea levels are rising 3.4 mm per year - 2× faster than 50 years ago!')
      },
      {
        icon: '🔥',
        calc: (t: number) => Math.ceil(t * 0.00015 * 1000000), // Actual scientific calculation
        format: (n: number) => tr(t, 'carbonEquivalents.veryLarge.globalWarming.format', { n: n.toLocaleString() }, `${n.toLocaleString()} millionths of a degree of global warming`),
        context: tr(t, 'carbonEquivalents.veryLarge.globalWarming.context', {}, 'Every tonne of CO2e contributes ~0.00015 millionths °C warming'),
        didYouKnow: tr(t, 'carbonEquivalents.veryLarge.globalWarming.didYouKnow', {}, 'We\'ve already warmed 1.1°C since pre-industrial times - every fraction matters!')
      },
      {
        icon: '🐻‍❄️',
        calc: (t: number) => Math.ceil(t / 15), // 1 day per 15 tonnes
        format: (n: number) => tr(t, 'carbonEquivalents.veryLarge.polarBearHabitat.format', { n }, `${n} days of polar bear habitat loss`),
        context: tr(t, 'carbonEquivalents.veryLarge.polarBearHabitat.context', {}, 'Arctic ice loss = ~1 day per 15 tonnes CO2e'),
        didYouKnow: tr(t, 'carbonEquivalents.veryLarge.polarBearHabitat.didYouKnow', {}, 'Polar bears need sea ice to hunt - they\'re losing 3-4 weeks of hunting time per decade!')
      }
    ]
  };

  // Helper to select varied example (avoid repetition within same session)
  // This ensures Top 5 emitters show 5 DIFFERENT examples
  function selectVariedExample<T>(category: string, options: T[]): T {
    const now = Date.now();

    // Periodic cleanup (every 5 minutes)
    if (now - lastCleanup.timestamp > CACHE_DURATION) {
      recentlyShownExamples.clear();
      lastCleanup.timestamp = now;
    }

    // Use just category as key (not emission range) to ensure variety across ALL items in same category
    const cacheKey = category;

    // Get array of recently shown indices for this category
    const recentIndices = recentlyShownExamples.get(cacheKey) || [];

    // Find an option we haven't shown recently
    let selectedIndex = -1;
    for (let i = 0; i < options.length; i++) {
      if (!recentIndices.includes(i)) {
        selectedIndex = i;
        break;
      }
    }

    // If all options were shown recently, reset the cache and start over
    if (selectedIndex === -1) {
      recentlyShownExamples.set(cacheKey, [0]);
      return options[0];
    }

    // Add this index to recently shown
    // Keep ALL shown indices until we've cycled through all options
    const updatedIndices = [...recentIndices, selectedIndex];

    // If we've shown all options, reset for next cycle
    if (updatedIndices.length >= options.length) {
      recentlyShownExamples.set(cacheKey, [selectedIndex]);
    } else {
      recentlyShownExamples.set(cacheKey, updatedIndices);
    }

    return options[selectedIndex];
  }

  // Select the best equivalent based on emission size
  if (tco2e < 0.5) {
    // Very small emissions: use everyday items
    const option = selectVariedExample('verySmall', equivalentCategories.verySmall);
    const value = option.calc(tco2e);
    return {
      icon: option.icon,
      description: option.format(value),
      educationalContext: option.context,
      didYouKnow: option.didYouKnow
    };
  } else if (tco2e < 2) {
    // Small emissions: use trees & nature
    const option = selectVariedExample('small', equivalentCategories.small);
    const value = option.calc(tco2e);
    return {
      icon: option.icon,
      description: option.format(value),
      educationalContext: option.context,
      didYouKnow: option.didYouKnow
    };
  } else if (tco2e < 5) {
    // Medium-small: use driving
    const countryOptions = equivalentCategories.mediumSmall[countryLower as keyof typeof equivalentCategories.mediumSmall]
      || equivalentCategories.mediumSmall.global;
    const option = selectVariedExample('mediumSmall', countryOptions);
    const value = option.calc(tco2e);
    return {
      icon: option.icon,
      description: option.format(value),
      educationalContext: option.context,
      didYouKnow: option.didYouKnow
    };
  } else if (tco2e < 20) {
    // Medium: use flights
    const countryOptions = equivalentCategories.medium[countryLower as keyof typeof equivalentCategories.medium]
      || equivalentCategories.medium.global;
    const option = selectVariedExample('medium', countryOptions);
    const value = option.calc(tco2e);
    return {
      icon: option.icon,
      description: option.format(value),
      educationalContext: option.context,
      didYouKnow: option.didYouKnow
    };
  } else if (tco2e < 50) {
    // Large: use household energy
    const option = selectVariedExample('large', equivalentCategories.large);
    const value = option.calc(tco2e);
    return {
      icon: option.icon,
      description: option.format(value),
      educationalContext: option.context,
      didYouKnow: option.didYouKnow
    };
  } else {
    // Very large: use big impacts
    const option = selectVariedExample('veryLarge', equivalentCategories.veryLarge);
    const value = option.calc(tco2e);
    return {
      icon: option.icon,
      description: option.format(value),
      educationalContext: option.context,
      didYouKnow: option.didYouKnow
    };
  }
}

/**
 * Get a short, inline carbon equivalent for small displays
 */
export function getShortEquivalent(tco2e: number, country: string = 'portugal'): string {
  const equivalent = getCarbonEquivalent(tco2e, country);
  if (!equivalent) return '';

  return `${equivalent.icon} ${equivalent.description}`;
}

/**
 * Format carbon equivalent for tooltip display
 */
export function formatEquivalentForTooltip(tco2e: number, country: string = 'portugal'): string {
  const equivalent = getCarbonEquivalent(tco2e, country);
  if (!equivalent) return '';

  return `This is equivalent to: ${equivalent.icon} ${equivalent.description}`;
}
