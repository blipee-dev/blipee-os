/**
 * Survey Templates
 *
 * Predefined survey templates for collecting sustainability data
 * that automatically maps to metrics_catalog entries
 */

export interface SurveyQuestion {
  id: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'radio' | 'date' | 'scale';
  question: string;
  description?: string;
  required: boolean;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  conditional?: {
    questionId: string;
    showIf: string | string[];
  };
  unitOptions?: {
    units: ('km' | 'miles' | 'kg' | 'lbs')[];
    defaultUnit: 'km' | 'miles' | 'kg' | 'lbs';
    storageUnit: 'km' | 'miles' | 'kg' | 'lbs'; // Unit to convert to before storage
  };
}

export interface MetricMapping {
  questionId: string;
  metricCode: string; // Code from metrics_catalog
  valueTransform?: string; // Optional formula to transform answer to metric value
  unit?: string;
  scope?: string;
}

export interface SurveyTemplate {
  id: string;
  name: string;
  description: string;
  category: 'commute' | 'logistics' | 'business_travel' | 'fleet' | 'custom';
  questions: SurveyQuestion[];
  metricMappings: MetricMapping[];
}

// ============================================================================
// EMPLOYEE COMMUTE SURVEY (Scope 3.7)
// ============================================================================

export const COMMUTE_SURVEY_TEMPLATE: SurveyTemplate = {
  id: 'employee-commute-v1',
  name: 'Employee Commute Survey',
  description: 'Collect data on employee commuting patterns to calculate Scope 3.7 emissions',
  category: 'commute',
  questions: [
    {
      id: 'employee_name',
      type: 'text',
      question: 'Your Name (Optional)',
      description: 'This helps us provide personalized commute benefits',
      required: false
    },
    {
      id: 'department',
      type: 'text',
      question: 'Department',
      required: false
    },
    {
      id: 'primary_commute_mode',
      type: 'radio',
      question: 'What is your primary mode of transportation to work?',
      required: true,
      options: [
        { value: 'car_solo', label: 'Personal car (driving alone)' },
        { value: 'car_carpool', label: 'Carpool (2+ people)' },
        { value: 'public_transit', label: 'Public transportation (bus, train, metro)' },
        { value: 'bike', label: 'Bicycle' },
        { value: 'walk', label: 'Walking' },
        { value: 'motorcycle', label: 'Motorcycle/Scooter' },
        { value: 'remote', label: 'I work remotely (no commute)' }
      ]
    },
    {
      id: 'commute_distance',
      type: 'number',
      question: 'What is your one-way commute distance?',
      description: 'Distance from home to office',
      required: true,
      validation: {
        min: 0,
        max: 500
      },
      conditional: {
        questionId: 'primary_commute_mode',
        showIf: ['car_solo', 'car_carpool', 'public_transit', 'bike', 'walk', 'motorcycle']
      },
      unitOptions: {
        units: ['km', 'miles'],
        defaultUnit: 'km',
        storageUnit: 'km'
      }
    },
    {
      id: 'days_in_office',
      type: 'select',
      question: 'How many days per week do you commute to the office?',
      required: true,
      options: [
        { value: '1', label: '1 day per week' },
        { value: '2', label: '2 days per week' },
        { value: '3', label: '3 days per week' },
        { value: '4', label: '4 days per week' },
        { value: '5', label: '5 days per week' },
        { value: '0', label: 'Fully remote' }
      ]
    },
    {
      id: 'car_fuel_type',
      type: 'radio',
      question: 'If you drive, what type of vehicle do you use?',
      required: false,
      options: [
        { value: 'gasoline', label: 'Gasoline' },
        { value: 'diesel', label: 'Diesel' },
        { value: 'hybrid', label: 'Hybrid' },
        { value: 'electric', label: 'Electric (EV)' },
        { value: 'other', label: 'Other' }
      ],
      conditional: {
        questionId: 'primary_commute_mode',
        showIf: ['car_solo', 'car_carpool']
      }
    },
    {
      id: 'carpool_size',
      type: 'number',
      question: 'How many people typically carpool with you (including yourself)?',
      required: false,
      validation: {
        min: 2,
        max: 10
      },
      conditional: {
        questionId: 'primary_commute_mode',
        showIf: 'car_carpool'
      }
    },
    {
      id: 'interested_in_alternatives',
      type: 'multiselect',
      question: 'Would you be interested in any of the following commute benefits?',
      required: false,
      options: [
        { value: 'transit_subsidy', label: 'Public transit subsidy' },
        { value: 'bike_facilities', label: 'Bike parking and showers' },
        { value: 'carpool_matching', label: 'Carpool matching program' },
        { value: 'remote_work', label: 'Additional remote work days' },
        { value: 'ev_charging', label: 'EV charging stations' },
        { value: 'flexible_hours', label: 'Flexible hours to avoid rush hour' }
      ]
    }
  ],
  metricMappings: [
    {
      questionId: 'commute_distance',
      metricCode: 'scope3_commute_car',
      valueTransform: 'distance * days_in_office * 4.33 * 2', // weekly days → monthly km (round trip)
      unit: 'km',
      scope: 'scope_3'
    },
    {
      questionId: 'commute_distance',
      metricCode: 'scope3_commute_public_transit',
      valueTransform: 'distance * days_in_office * 4.33 * 2',
      unit: 'km',
      scope: 'scope_3'
    },
    {
      questionId: 'commute_distance',
      metricCode: 'scope3_commute_bike',
      valueTransform: 'distance * days_in_office * 4.33 * 2',
      unit: 'km',
      scope: 'scope_3'
    },
    {
      questionId: 'days_in_office',
      metricCode: 'scope3_commute_remote',
      valueTransform: '(5 - days_in_office) * 4.33', // Remote days per month
      unit: 'days',
      scope: 'scope_3'
    }
  ]
};

// ============================================================================
// LOGISTICS/FREIGHT SURVEY (Scope 3.4 & 3.9)
// ============================================================================

export const LOGISTICS_SURVEY_TEMPLATE: SurveyTemplate = {
  id: 'logistics-freight-v1',
  name: 'Logistics & Freight Data Collection',
  description: 'Collect data on inbound and outbound shipments for Scope 3.4 and 3.9 calculations',
  category: 'logistics',
  questions: [
    {
      id: 'shipment_direction',
      type: 'radio',
      question: 'Is this an inbound or outbound shipment?',
      description: 'Inbound = supplies/materials coming to you. Outbound = products going to customers',
      required: true,
      options: [
        { value: 'upstream', label: 'Inbound (Upstream - Scope 3.4)' },
        { value: 'downstream', label: 'Outbound (Downstream - Scope 3.9)' }
      ]
    },
    {
      id: 'transport_mode',
      type: 'radio',
      question: 'Primary mode of transportation',
      required: true,
      options: [
        { value: 'road', label: 'Road (Truck)' },
        { value: 'rail', label: 'Rail' },
        { value: 'air', label: 'Air freight' },
        { value: 'sea', label: 'Sea freight' }
      ]
    },
    {
      id: 'shipment_weight',
      type: 'number',
      question: 'Total weight of shipment',
      required: true,
      validation: {
        min: 0
      },
      unitOptions: {
        units: ['kg', 'lbs'],
        defaultUnit: 'kg',
        storageUnit: 'kg'
      }
    },
    {
      id: 'shipment_distance',
      type: 'number',
      question: 'Distance traveled',
      description: 'Approximate distance from origin to destination',
      required: true,
      validation: {
        min: 0
      },
      unitOptions: {
        units: ['km', 'miles'],
        defaultUnit: 'km',
        storageUnit: 'km'
      }
    },
    {
      id: 'origin_city',
      type: 'text',
      question: 'Origin location (City, Country)',
      required: false
    },
    {
      id: 'destination_city',
      type: 'text',
      question: 'Destination location (City, Country)',
      required: false
    },
    {
      id: 'shipment_date',
      type: 'date',
      question: 'Shipment date',
      required: true
    },
    {
      id: 'frequency',
      type: 'select',
      question: 'How often does this route occur?',
      required: false,
      options: [
        { value: 'one_time', label: 'One-time shipment' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' }
      ]
    }
  ],
  metricMappings: [
    {
      questionId: 'shipment_weight',
      metricCode: 'scope3_upstream_transport_road',
      valueTransform: 'weight * distance / 1000', // Convert to tonne-km
      unit: 'tonne-km',
      scope: 'scope_3'
    },
    {
      questionId: 'shipment_weight',
      metricCode: 'scope3_downstream_transport_road',
      valueTransform: 'weight * distance / 1000',
      unit: 'tonne-km',
      scope: 'scope_3'
    },
    {
      questionId: 'shipment_weight',
      metricCode: 'scope3_upstream_transport_air',
      valueTransform: 'weight * distance / 1000',
      unit: 'tonne-km',
      scope: 'scope_3'
    },
    {
      questionId: 'shipment_weight',
      metricCode: 'scope3_downstream_transport_air',
      valueTransform: 'weight * distance / 1000',
      unit: 'tonne-km',
      scope: 'scope_3'
    }
  ]
};

// ============================================================================
// BUSINESS TRAVEL SURVEY (Scope 3.6)
// ============================================================================

export const BUSINESS_TRAVEL_SURVEY_TEMPLATE: SurveyTemplate = {
  id: 'business-travel-v1',
  name: 'Business Travel Survey',
  description: 'Track employee business travel for Scope 3.6 emissions',
  category: 'business_travel',
  questions: [
    {
      id: 'traveler_name',
      type: 'text',
      question: 'Traveler Name',
      required: true
    },
    {
      id: 'trip_purpose',
      type: 'text',
      question: 'Purpose of trip',
      required: false
    },
    {
      id: 'travel_mode',
      type: 'radio',
      question: 'Primary mode of travel',
      required: true,
      options: [
        { value: 'air', label: 'Air travel' },
        { value: 'rail', label: 'Train/Rail' },
        { value: 'road', label: 'Car/Bus' }
      ]
    },
    {
      id: 'flight_class',
      type: 'radio',
      question: 'Flight class',
      required: false,
      options: [
        { value: 'economy', label: 'Economy' },
        { value: 'premium_economy', label: 'Premium Economy' },
        { value: 'business', label: 'Business Class' },
        { value: 'first', label: 'First Class' }
      ],
      conditional: {
        questionId: 'travel_mode',
        showIf: 'air'
      }
    },
    {
      id: 'distance',
      type: 'number',
      question: 'Distance traveled',
      required: true,
      validation: {
        min: 0
      },
      unitOptions: {
        units: ['km', 'miles'],
        defaultUnit: 'km',
        storageUnit: 'km'
      }
    },
    {
      id: 'travel_date',
      type: 'date',
      question: 'Travel date',
      required: true
    },
    {
      id: 'hotel_nights',
      type: 'number',
      question: 'Number of hotel nights',
      required: false,
      validation: {
        min: 0,
        max: 365
      }
    }
  ],
  metricMappings: [
    {
      questionId: 'distance',
      metricCode: 'scope3_business_travel_air',
      unit: 'km',
      scope: 'scope_3'
    },
    {
      questionId: 'distance',
      metricCode: 'scope3_business_travel_rail',
      unit: 'km',
      scope: 'scope_3'
    },
    {
      questionId: 'distance',
      metricCode: 'scope3_business_travel_road',
      unit: 'km',
      scope: 'scope_3'
    },
    {
      questionId: 'hotel_nights',
      metricCode: 'scope3_hotel_nights',
      unit: 'nights',
      scope: 'scope_3'
    }
  ]
};

// Export all templates
export const SURVEY_TEMPLATES = {
  commute: COMMUTE_SURVEY_TEMPLATE,
  logistics: LOGISTICS_SURVEY_TEMPLATE,
  business_travel: BUSINESS_TRAVEL_SURVEY_TEMPLATE
};

export type SurveyCategory = keyof typeof SURVEY_TEMPLATES;
