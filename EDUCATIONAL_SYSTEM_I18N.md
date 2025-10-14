# Educational System - I18n Implementation Guide

## Overview
This document outlines how to implement the fully internationalized and context-aware educational system.

## Translation Keys Structure

Add these keys to `src/messages/en.json`, `pt.json`, and `es.json`:

```json
{
  "education": {
    "topics": {
      "carbonBasics": {
        "title": "Understanding Carbon Emissions",
        "sections": {
          "whatIsCO2e": {
            "heading": "What is CO2e?",
            "content": "CO2e (Carbon Dioxide Equivalent) is a standard unit for measuring carbon footprints. It expresses the impact of different greenhouse gases in terms of the equivalent amount of CO2."
          },
          "oneTonne": {
            "heading": "What does 1 tonne of CO2e look like?",
            "content": "Abstract numbers are hard to visualize. Here are some real-world comparisons:"
          },
          "whyMeasure": {
            "heading": "Why measure in CO2e?",
            "content": "Using CO2e allows us to add up all greenhouse gas emissions into one number, making it easier to track progress and set targets."
          }
        },
        "gases": {
          "co2": "Carbon Dioxide (CO2)",
          "co2Comparison": "Baseline = 1x impact",
          "methane": "Methane (CH4)",
          "methaneComparison": "25x more potent than CO2",
          "nitrousOxide": "Nitrous Oxide (N2O)",
          "nitrousOxideComparison": "298x more potent than CO2"
        },
        "comparisons": {
          "driving": "Driving 2,500 km in a gasoline car",
          "flight": "1 round-trip flight within Europe",
          "trees": "What 1.15 trees absorb in a year",
          "treesValue": "Through photosynthesis",
          "home": "Powering a home for 2 months",
          "homeValue": "Average EU household",
          "smartphones": "Charging 121,000 smartphones",
          "smartphonesValue": "From empty to full"
        }
      },
      "scopesExplained": {
        "title": "GHG Protocol Scopes",
        "sections": {
          "whatAreScopes": {
            "heading": "What are Scopes?",
            "content": "The GHG Protocol divides emissions into 3 'scopes' to help organizations understand where their emissions come from."
          },
          "scope1": {
            "heading": "Scope 1: Direct Emissions",
            "content": "Emissions from sources that your organization owns or directly controls."
          },
          "scope2": {
            "heading": "Scope 2: Indirect Energy Emissions",
            "content": "Emissions from the generation of purchased energy (electricity, heating, cooling)."
          },
          "scope3": {
            "heading": "Scope 3: Value Chain Emissions",
            "content": "All other indirect emissions in your value chain. Often 70-80% of a company's total footprint."
          }
        },
        "examples": {
          "scope1": {
            "vehicles": "Company vehicles",
            "vehiclesDesc": "Cars, trucks, fleet",
            "combustion": "On-site fuel combustion",
            "combustionDesc": "Boilers, generators",
            "refrigerants": "Refrigerant leaks",
            "refrigerantsDesc": "Air conditioning systems"
          },
          "scope2": {
            "electricity": "Purchased electricity",
            "electricityDesc": "From the grid",
            "heating": "District heating",
            "heatingDesc": "Centralized heating",
            "cooling": "District cooling",
            "coolingDesc": "Centralized cooling"
          },
          "scope3": {
            "travel": "Business travel",
            "travelDesc": "Flights, hotels, rental cars",
            "commuting": "Employee commuting",
            "commutingDesc": "Daily travel to/from office",
            "goods": "Purchased goods & services",
            "goodsDesc": "Suppliers, materials",
            "waste": "Waste disposal",
            "wasteDesc": "Landfill, recycling"
          }
        }
      },
      "whyItMatters": {
        "title": "Why Climate Action Matters",
        "sections": {
          "parisAgreement": {
            "heading": "The 1.5°C Target",
            "content": "The Paris Agreement aims to limit global warming to 1.5°C above pre-industrial levels to avoid catastrophic climate impacts."
          },
          "warmingLevels": {
            "heading": "What happens at different warming levels?",
            "content": "Every fraction of a degree matters:"
          },
          "localImpact": {
            "heading": "Impact on {location}",
            "content": "Without action, {location} faces severe consequences:"
          },
          "goodNews": {
            "heading": "The Good News",
            "content": "We have the technology and knowledge to solve this. Renewable energy is now cheaper than fossil fuels."
          }
        },
        "warming": {
          "oneFive": "1.5°C warming",
          "oneFiveDesc": "Severe impacts, but manageable with adaptation",
          "two": "2°C warming",
          "twoDesc": "Significantly worse: more extreme heat, droughts, floods",
          "three": "3°C warming",
          "threeDesc": "Catastrophic: mass extinction, uninhabitable regions"
        }
      },
      "reductionStrategies": {
        "title": "How to Reduce Emissions",
        "sections": {
          "highImpact": {
            "heading": "Focus on High-Impact Actions",
            "content": "Not all emission reduction actions are equal. Focus on these:"
          },
          "hierarchy": {
            "heading": "The Reduction Hierarchy",
            "content": "Always follow this order: 1) Avoid/Reduce first, 2) Switch to low-carbon alternatives, 3) Offset only as last resort."
          }
        }
      },
      "sbtiTargets": {
        "title": "Science-Based Targets",
        "sections": {
          "whatIsSBTi": {
            "heading": "What are Science-Based Targets?",
            "content": "Emission reduction goals aligned with climate science - specifically, what's needed to limit warming to 1.5°C."
          },
          "whyImportant": {
            "heading": "Why are they important?",
            "content": "SBTi targets give you credibility. Over 4,000 companies worldwide have committed to SBTi targets."
          },
          "types": {
            "heading": "Types of SBTi Targets",
            "content": "There are different target types based on timeframe and ambition:"
          },
          "howToStart": {
            "heading": "How to get started",
            "content": "Start by measuring your baseline emissions (you're already doing this!). Then submit your targets to SBTi for validation."
          }
        },
        "types": {
          "nearTerm": "Near-term targets",
          "nearTermDesc": "5-10 years: Typically 42% reduction by 2030",
          "longTerm": "Long-term targets",
          "longTermDesc": "By 2050: Net-zero across all scopes",
          "ambition": "Ambition levels",
          "ambitionDesc": "1.5°C (most ambitious) or well-below 2°C"
        }
      }
    },
    "modal": {
      "previous": "Previous",
      "next": "Next",
      "gotIt": "Got it!",
      "sectionOf": "Section {current} of {total}",
      "learnMore": "📚 Learn more"
    }
  }
}
```

## Portuguese (pt.json) - Sample

```json
{
  "education": {
    "topics": {
      "carbonBasics": {
        "title": "Compreender as Emissões de Carbono",
        "sections": {
          "whatIsCO2e": {
            "heading": "O que é CO2e?",
            "content": "CO2e (Equivalente de Dióxido de Carbono) é uma unidade padrão para medir pegadas de carbono. Expressa o impacto de diferentes gases de efeito estufa em termos da quantidade equivalente de CO2."
          }
        }
      }
    }
  }
}
```

## Spanish (es.json) - Sample

```json
{
  "education": {
    "topics": {
      "carbonBasics": {
        "title": "Comprender las Emisiones de Carbono",
        "sections": {
          "whatIsCO2e": {
            "heading": "¿Qué es CO2e?",
            "content": "CO2e (Equivalente de Dióxido de Carbono) es una unidad estándar para medir las huellas de carbono. Expresa el impacto de diferentes gases de efecto invernadero en términos de la cantidad equivalente de CO2."
          }
        }
      }
    }
  }
}
```

## Dynamic Context System

The system adapts based on:

### 1. **Location/Country** (from organization.country field)
- **Portugal**: Examples use Lisbon, Portuguese wildfires, wine regions
- **Spain**: Madrid, Barcelona water crisis, olive groves
- **USA**: LA to NYC, hurricanes, California fires
- **UK**: London, Thames flooding, Scottish agriculture
- **Global** (fallback): Generic international examples

### 2. **Industry Sector** (from organization.industry_sector / GRI 11-17)
- **Professional Services**: Virtual meetings, train travel, paperless
- **Manufacturing**: Energy efficiency, circular economy, process optimization
- **Retail**: LED lighting, refrigeration, sustainable packaging
- **General** (fallback): Universal strategies

### 3. **User Language** (automatic via LanguageProvider)
- **English (en)**: International English
- **Portuguese (pt)**: Portuguese translations
- **Spanish (es)**: Spanish translations

## Implementation Steps

1. **Add translations** to en.json, pt.json, es.json
2. **Update EducationalModal.tsx** to use the dynamic content generator
3. **Fetch organization context** (country, sector) from user session/org data
4. **Pass context** to content generator for dynamic examples

## Benefits

✅ **Fully internationalized** - All content uses i18n system
✅ **Context-aware** - Examples relevant to user's location and industry
✅ **Scalable** - Easy to add new languages and sectors
✅ **Dynamic** - Content adapts automatically based on organization
✅ **Maintainable** - All content in translation files, not hardcoded

## Next Steps

Would you like me to:
1. Create the full translation files for all 3 languages?
2. Update the EducationalModal to use the dynamic system?
3. Add organization context fetching?
