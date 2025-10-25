/**
 * Dynamic GRI Model Loader
 * Loads GRI industry models on-demand to reduce bundle size
 */

import { IndustryModel } from '../base-model';
import type {
  IndustryMetric,
  MaterialTopic,
  GRISectorStandard,
  IndustryClassification
} from '../types';

interface GRIModelData {
  industryName: string;
  griStandards: GRISectorStandard[];
  naicsCodes: string[];
  sicCodes: string[];
  materialTopics: MaterialTopic[];
  specificMetrics: IndustryMetric[];
  regulatoryFrameworks: string[];
  certifications: string[];
}

class DynamicIndustryModel extends IndustryModel {
  private dataPromise: Promise<GRIModelData> | null = null;

  constructor(private dataPath: string, initialData?: Partial<GRIModelData>) {
    // Initialize with minimal data to prevent errors
    super({
      industryName: initialData?.industryName || 'Loading...',
      griStandards: initialData?.griStandards || [],
      naicsCodes: initialData?.naicsCodes || [],
      sicCodes: initialData?.sicCodes || [],
      materialTopics: initialData?.materialTopics || [],
      specificMetrics: [],
      regulatoryFrameworks: initialData?.regulatoryFrameworks || [],
      certifications: initialData?.certifications || []
    });
  }

  /**
   * Load the full model data dynamically
   */
  async loadData(): Promise<void> {
    if (!this.dataPromise) {
      this.dataPromise = import(this.dataPath).then(module => module.default);
    }

    const data = await this.dataPromise;

    // Update the model with loaded data
    Object.assign(this, {
      industryName: data.industryName,
      griStandards: data.griStandards,
      naicsCodes: data.naicsCodes,
      sicCodes: data.sicCodes,
      materialTopics: data.materialTopics,
      specificMetrics: data.specificMetrics,
      regulatoryFrameworks: data.regulatoryFrameworks,
      certifications: data.certifications
    });
  }

  /**
   * Override methods to ensure data is loaded
   */
  async getMetrics(): Promise<IndustryMetric[]> {
    await this.loadData();
    return this.specificMetrics;
  }

  async getMaterialTopics(): Promise<MaterialTopic[]> {
    await this.loadData();
    return this.materialTopics;
  }
}

/**
 * Factory functions for each GRI model
 * These load data only when needed
 */
export async function loadOilGasGRI11Model(): Promise<IndustryModel> {
  const model = new DynamicIndustryModel(
    '/data/gri-standards/oil-gas-gri11.json',
    {
      industryName: 'Oil and Gas',
      griStandards: ['GRI_11_OIL_GAS' as GRISectorStandard],
    }
  );
  await model.loadData();
  return model;
}

export async function loadCoalGRI12Model(): Promise<IndustryModel> {
  const model = new DynamicIndustryModel(
    '/data/gri-standards/coal-gri12.json',
    {
      industryName: 'Coal',
      griStandards: ['GRI_12_COAL' as GRISectorStandard],
    }
  );
  await model.loadData();
  return model;
}

export async function loadAgricultureGRI13Model(): Promise<IndustryModel> {
  const model = new DynamicIndustryModel(
    '/data/gri-standards/agriculture-gri13.json',
    {
      industryName: 'Agriculture',
      griStandards: ['GRI_13_AGRICULTURE' as GRISectorStandard],
    }
  );
  await model.loadData();
  return model;
}

export async function loadMiningGRI14Model(): Promise<IndustryModel> {
  const model = new DynamicIndustryModel(
    '/data/gri-standards/mining-gri14.json',
    {
      industryName: 'Mining',
      griStandards: ['GRI_14_MINING' as GRISectorStandard],
    }
  );
  await model.loadData();
  return model;
}

export async function loadConstructionGRI15Model(): Promise<IndustryModel> {
  const model = new DynamicIndustryModel(
    '/data/gri-standards/construction-gri15.json',
    {
      industryName: 'Construction',
      griStandards: ['GRI_15_CONSTRUCTION' as GRISectorStandard],
    }
  );
  await model.loadData();
  return model;
}

/**
 * Load a GRI model by sector standard
 */
export async function loadGRIModel(standard: GRISectorStandard): Promise<IndustryModel | null> {
  switch (standard) {
    case 'GRI_11_OIL_GAS':
      return loadOilGasGRI11Model();
    case 'GRI_12_COAL':
      return loadCoalGRI12Model();
    case 'GRI_13_AGRICULTURE':
      return loadAgricultureGRI13Model();
    case 'GRI_14_MINING':
      return loadMiningGRI14Model();
    case 'GRI_15_CONSTRUCTION':
      return loadConstructionGRI15Model();
    default:
      return null;
  }
}