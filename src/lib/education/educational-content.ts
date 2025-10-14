/**
 * Dynamic Educational Content System
 *
 * This system generates context-aware educational content based on:
 * - Organization location/country
 * - Industry sector (GRI 11-17)
 * - User language preference
 *
 * Content adapts examples, comparisons, and impact scenarios to be relevant.
 */

export interface OrganizationContext {
  country?: string;
  city?: string;
  sector?: string; // GRI sector: professional_services, manufacturing, etc.
  industry?: string;
  employees?: number;
}

export interface VisualComparison {
  icon: string;
  label: string;
  value?: string;
  comparison?: string;
  impact?: 'HIGH' | 'MEDIUM' | 'LOW';
  savings?: string;
}

export interface EducationalSection {
  heading: string;
  content: string;
  visual?: 'comparison' | 'chart' | 'timeline';
  visualData?: VisualComparison[];
}

export interface EducationalTopic {
  id: string;
  titleKey: string;
  icon: string;
  sections: EducationalSection[];
}

/**
 * Get location-specific examples for carbon equivalents
 */
function getLocationExamples(country: string = 'global', emissionValue: number = 1) {
  const examples: Record<string, any> = {
    portugal: {
      driving: { value: 2500, unit: 'km', description: 'Lisbon to London and back' },
      flight: { value: 1, description: 'Round-trip Lisbon to Paris' },
      majorCity: 'Lisbon',
      coastalThreat: 'Lisbon coastline at risk by 2050',
      localImpacts: [
        { icon: '🔥', label: 'More frequent wildfires', value: 'Already 50% increase since 1980' },
        { icon: '💧', label: 'Severe droughts', value: 'Water scarcity affecting agriculture' },
        { icon: '🌊', label: 'Rising sea levels', value: 'Coastal cities at risk' },
        { icon: '🌾', label: 'Agricultural losses', value: 'Wine regions shifting north' }
      ]
    },
    spain: {
      driving: { value: 2500, unit: 'km', description: 'Madrid to Paris and back' },
      flight: { value: 1, description: 'Round-trip Madrid to London' },
      majorCity: 'Madrid',
      coastalThreat: 'Barcelona and Valencia coastlines at risk',
      localImpacts: [
        { icon: '🔥', label: 'Extreme heat waves', value: 'Summer temps exceeding 45°C' },
        { icon: '💧', label: 'Water shortages', value: 'Barcelona water restrictions' },
        { icon: '🌊', label: 'Mediterranean rising', value: 'Coastal tourism areas at risk' },
        { icon: '🌾', label: 'Crop failures', value: 'Olive and citrus yields declining' }
      ]
    },
    usa: {
      driving: { value: 2500, unit: 'miles', description: 'LA to New York' },
      flight: { value: 1, description: 'Round-trip coast to coast' },
      majorCity: 'New York',
      coastalThreat: 'Miami and NYC at extreme flood risk',
      localImpacts: [
        { icon: '🌀', label: 'Hurricanes intensifying', value: 'Category 5 storms more frequent' },
        { icon: '🔥', label: 'Wildfire season', value: 'Year-round fires in West Coast' },
        { icon: '🌊', label: 'Sea level rise', value: 'Coastal cities flooding' },
        { icon: '❄️', label: 'Polar vortex events', value: 'Extreme cold snaps' }
      ]
    },
    uk: {
      driving: { value: 2500, unit: 'km', description: 'London to Edinburgh 3 times' },
      flight: { value: 1, description: 'Round-trip London to Barcelona' },
      majorCity: 'London',
      coastalThreat: 'Thames Barrier insufficient by 2050',
      localImpacts: [
        { icon: '🌊', label: 'Flooding risk', value: 'Coastal and river flooding' },
        { icon: '🌡️', label: 'Heat waves', value: '40°C summers becoming norm' },
        { icon: '🐦', label: 'Biodiversity loss', value: 'Native species declining' },
        { icon: '🌾', label: 'Agricultural shifts', value: 'Crop zones moving north' }
      ]
    },
    global: {
      driving: { value: 2500, unit: 'km', description: 'Average intercity distance' },
      flight: { value: 1, description: 'Round-trip regional flight' },
      majorCity: 'major cities',
      coastalThreat: 'Coastal regions at risk worldwide',
      localImpacts: [
        { icon: '🔥', label: 'Extreme weather', value: 'Heat waves, droughts, floods' },
        { icon: '🌊', label: 'Sea level rise', value: 'Coastal cities at risk' },
        { icon: '🌾', label: 'Food security', value: 'Crop yields declining' },
        { icon: '🏠', label: 'Climate migration', value: 'Millions displaced' }
      ]
    }
  };

  const countryKey = country.toLowerCase();
  return examples[countryKey] || examples.global;
}

/**
 * Get sector-specific reduction strategies
 */
function getSectorStrategies(sector: string = 'general') {
  const strategies: Record<string, VisualComparison[]> = {
    professional_services: [
      {
        icon: '💻',
        label: 'Virtual-first meeting policy',
        impact: 'HIGH',
        savings: '30-50% reduction in travel emissions'
      },
      {
        icon: '🚆',
        label: 'Train travel mandate',
        impact: 'HIGH',
        savings: 'For trips under 800km'
      },
      {
        icon: '♻️',
        label: 'Paperless operations',
        impact: 'MEDIUM',
        savings: 'Digital documents, e-signatures'
      },
      {
        icon: '🌡️',
        label: 'Smart office controls',
        impact: 'MEDIUM',
        savings: '10-15% energy savings'
      }
    ],
    manufacturing: [
      {
        icon: '⚡',
        label: 'Energy efficiency upgrades',
        impact: 'HIGH',
        savings: '20-40% energy reduction'
      },
      {
        icon: '♻️',
        label: 'Circular economy practices',
        impact: 'HIGH',
        savings: 'Reduce waste by 50%+'
      },
      {
        icon: '🏭',
        label: 'Process optimization',
        impact: 'MEDIUM',
        savings: '15-25% emissions reduction'
      },
      {
        icon: '🚚',
        label: 'Green logistics',
        impact: 'MEDIUM',
        savings: 'Electric vehicles, route optimization'
      }
    ],
    retail: [
      {
        icon: '💡',
        label: 'LED lighting',
        impact: 'HIGH',
        savings: '60% lighting energy reduction'
      },
      {
        icon: '🧊',
        label: 'Efficient refrigeration',
        impact: 'HIGH',
        savings: '30% cooling energy savings'
      },
      {
        icon: '📦',
        label: 'Sustainable packaging',
        impact: 'MEDIUM',
        savings: 'Reduce Scope 3 by 20%'
      },
      {
        icon: '🚛',
        label: 'Local sourcing',
        impact: 'MEDIUM',
        savings: 'Reduce transport emissions'
      }
    ],
    general: [
      {
        icon: '⚡',
        label: 'Switch to renewable energy',
        impact: 'HIGH',
        savings: '40-60% total reduction'
      },
      {
        icon: '✈️',
        label: 'Reduce business travel',
        impact: 'HIGH',
        savings: '20-40% Scope 3 reduction'
      },
      {
        icon: '🏢',
        label: 'Building efficiency',
        impact: 'MEDIUM',
        savings: '10-20% reduction'
      },
      {
        icon: '🚗',
        label: 'Electrify fleet',
        impact: 'MEDIUM',
        savings: '5-10% Scope 1 reduction'
      }
    ]
  };

  return strategies[sector] || strategies.general;
}

/**
 * Generate educational topics with context-aware content
 */
export function getEducationalTopics(
  translationFn: (key: string, params?: Record<string, any>) => string,
  context?: OrganizationContext
): EducationalTopic[] {
  const country = context?.country || 'global';
  const sector = context?.sector || 'general';
  const locationExamples = getLocationExamples(country);
  const sectorStrategies = getSectorStrategies(sector);

  return [
    {
      id: 'carbon-basics',
      titleKey: 'education.topics.carbonBasics.title',
      icon: '🌍',
      sections: [
        {
          heading: translationFn('education.topics.carbonBasics.sections.whatIsCO2e.heading'),
          content: translationFn('education.topics.carbonBasics.sections.whatIsCO2e.content'),
          visual: 'comparison',
          visualData: [
            {
              icon: '☁️',
              label: translationFn('education.topics.carbonBasics.gases.co2'),
              comparison: translationFn('education.topics.carbonBasics.gases.co2Comparison')
            },
            {
              icon: '🔥',
              label: translationFn('education.topics.carbonBasics.gases.methane'),
              comparison: translationFn('education.topics.carbonBasics.gases.methaneComparison')
            },
            {
              icon: '💨',
              label: translationFn('education.topics.carbonBasics.gases.nitrousOxide'),
              comparison: translationFn('education.topics.carbonBasics.gases.nitrousOxideComparison')
            }
          ]
        },
        {
          heading: translationFn('education.topics.carbonBasics.sections.oneTonne.heading'),
          content: translationFn('education.topics.carbonBasics.sections.oneTonne.content'),
          visual: 'comparison',
          visualData: [
            {
              icon: '🚗',
              label: translationFn('education.topics.carbonBasics.comparisons.driving'),
              value: `≈ ${locationExamples.driving.description}`
            },
            {
              icon: '✈️',
              label: translationFn('education.topics.carbonBasics.comparisons.flight'),
              value: `≈ ${locationExamples.flight.description}`
            },
            {
              icon: '🌳',
              label: translationFn('education.topics.carbonBasics.comparisons.trees'),
              value: translationFn('education.topics.carbonBasics.comparisons.treesValue')
            },
            {
              icon: '💡',
              label: translationFn('education.topics.carbonBasics.comparisons.home'),
              value: translationFn('education.topics.carbonBasics.comparisons.homeValue')
            },
            {
              icon: '📱',
              label: translationFn('education.topics.carbonBasics.comparisons.smartphones'),
              value: translationFn('education.topics.carbonBasics.comparisons.smartphonesValue')
            }
          ]
        },
        {
          heading: translationFn('education.topics.carbonBasics.sections.whyMeasure.heading'),
          content: translationFn('education.topics.carbonBasics.sections.whyMeasure.content')
        }
      ]
    },
    {
      id: 'scopes-explained',
      titleKey: 'education.topics.scopesExplained.title',
      icon: '📊',
      sections: [
        {
          heading: translationFn('education.topics.scopesExplained.sections.whatAreScopes.heading'),
          content: translationFn('education.topics.scopesExplained.sections.whatAreScopes.content')
        },
        {
          heading: translationFn('education.topics.scopesExplained.sections.scope1.heading'),
          content: translationFn('education.topics.scopesExplained.sections.scope1.content'),
          visual: 'comparison',
          visualData: [
            {
              icon: '🚗',
              label: translationFn('education.topics.scopesExplained.examples.scope1.vehicles'),
              value: translationFn('education.topics.scopesExplained.examples.scope1.vehiclesDesc')
            },
            {
              icon: '🔥',
              label: translationFn('education.topics.scopesExplained.examples.scope1.combustion'),
              value: translationFn('education.topics.scopesExplained.examples.scope1.combustionDesc')
            },
            {
              icon: '❄️',
              label: translationFn('education.topics.scopesExplained.examples.scope1.refrigerants'),
              value: translationFn('education.topics.scopesExplained.examples.scope1.refrigerantsDesc')
            }
          ]
        },
        {
          heading: translationFn('education.topics.scopesExplained.sections.scope2.heading'),
          content: translationFn('education.topics.scopesExplained.sections.scope2.content'),
          visual: 'comparison',
          visualData: [
            {
              icon: '💡',
              label: translationFn('education.topics.scopesExplained.examples.scope2.electricity'),
              value: translationFn('education.topics.scopesExplained.examples.scope2.electricityDesc')
            },
            {
              icon: '🌡️',
              label: translationFn('education.topics.scopesExplained.examples.scope2.heating'),
              value: translationFn('education.topics.scopesExplained.examples.scope2.heatingDesc')
            },
            {
              icon: '❄️',
              label: translationFn('education.topics.scopesExplained.examples.scope2.cooling'),
              value: translationFn('education.topics.scopesExplained.examples.scope2.coolingDesc')
            }
          ]
        },
        {
          heading: translationFn('education.topics.scopesExplained.sections.scope3.heading'),
          content: translationFn('education.topics.scopesExplained.sections.scope3.content'),
          visual: 'comparison',
          visualData: [
            {
              icon: '✈️',
              label: translationFn('education.topics.scopesExplained.examples.scope3.travel'),
              value: translationFn('education.topics.scopesExplained.examples.scope3.travelDesc')
            },
            {
              icon: '🚌',
              label: translationFn('education.topics.scopesExplained.examples.scope3.commuting'),
              value: translationFn('education.topics.scopesExplained.examples.scope3.commutingDesc')
            },
            {
              icon: '📦',
              label: translationFn('education.topics.scopesExplained.examples.scope3.goods'),
              value: translationFn('education.topics.scopesExplained.examples.scope3.goodsDesc')
            },
            {
              icon: '🗑️',
              label: translationFn('education.topics.scopesExplained.examples.scope3.waste'),
              value: translationFn('education.topics.scopesExplained.examples.scope3.wasteDesc')
            }
          ]
        }
      ]
    },
    {
      id: 'why-it-matters',
      titleKey: 'education.topics.whyItMatters.title',
      icon: '🔥',
      sections: [
        {
          heading: translationFn('education.topics.whyItMatters.sections.parisAgreement.heading'),
          content: translationFn('education.topics.whyItMatters.sections.parisAgreement.content')
        },
        {
          heading: translationFn('education.topics.whyItMatters.sections.warmingLevels.heading'),
          content: translationFn('education.topics.whyItMatters.sections.warmingLevels.content'),
          visual: 'comparison',
          visualData: [
            {
              icon: '🌡️',
              label: translationFn('education.topics.whyItMatters.warming.oneFive'),
              value: translationFn('education.topics.whyItMatters.warming.oneFiveDesc')
            },
            {
              icon: '🔥',
              label: translationFn('education.topics.whyItMatters.warming.two'),
              value: translationFn('education.topics.whyItMatters.warming.twoDesc')
            },
            {
              icon: '⚠️',
              label: translationFn('education.topics.whyItMatters.warming.three'),
              value: translationFn('education.topics.whyItMatters.warming.threeDesc')
            }
          ]
        },
        {
          heading: translationFn('education.topics.whyItMatters.sections.localImpact.heading', { location: context?.country || 'your region' }),
          content: translationFn('education.topics.whyItMatters.sections.localImpact.content', { location: context?.country || 'your region' }),
          visual: 'comparison',
          visualData: locationExamples.localImpacts
        },
        {
          heading: translationFn('education.topics.whyItMatters.sections.goodNews.heading'),
          content: translationFn('education.topics.whyItMatters.sections.goodNews.content')
        }
      ]
    },
    {
      id: 'reduction-strategies',
      titleKey: 'education.topics.reductionStrategies.title',
      icon: '💡',
      sections: [
        {
          heading: translationFn('education.topics.reductionStrategies.sections.highImpact.heading'),
          content: translationFn('education.topics.reductionStrategies.sections.highImpact.content'),
          visual: 'comparison',
          visualData: sectorStrategies
        },
        {
          heading: translationFn('education.topics.reductionStrategies.sections.hierarchy.heading'),
          content: translationFn('education.topics.reductionStrategies.sections.hierarchy.content')
        }
      ]
    },
    {
      id: 'sbti-targets',
      titleKey: 'education.topics.sbtiTargets.title',
      icon: '🎯',
      sections: [
        {
          heading: translationFn('education.topics.sbtiTargets.sections.whatIsSBTi.heading'),
          content: translationFn('education.topics.sbtiTargets.sections.whatIsSBTi.content')
        },
        {
          heading: translationFn('education.topics.sbtiTargets.sections.whyImportant.heading'),
          content: translationFn('education.topics.sbtiTargets.sections.whyImportant.content')
        },
        {
          heading: translationFn('education.topics.sbtiTargets.sections.types.heading'),
          content: translationFn('education.topics.sbtiTargets.sections.types.content'),
          visual: 'comparison',
          visualData: [
            {
              icon: '🎯',
              label: translationFn('education.topics.sbtiTargets.types.nearTerm'),
              value: translationFn('education.topics.sbtiTargets.types.nearTermDesc')
            },
            {
              icon: '🌍',
              label: translationFn('education.topics.sbtiTargets.types.longTerm'),
              value: translationFn('education.topics.sbtiTargets.types.longTermDesc')
            },
            {
              icon: '🔥',
              label: translationFn('education.topics.sbtiTargets.types.ambition'),
              value: translationFn('education.topics.sbtiTargets.types.ambitionDesc')
            }
          ]
        },
        {
          heading: translationFn('education.topics.sbtiTargets.sections.howToStart.heading'),
          content: translationFn('education.topics.sbtiTargets.sections.howToStart.content')
        }
      ]
    }
  ];
}
