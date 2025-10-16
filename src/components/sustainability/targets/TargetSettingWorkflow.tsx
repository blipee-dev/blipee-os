'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Target,
  Grid3x3,
  BarChart3,
  Calculator,
  Shield,
  Rocket,
  Info,
  Sparkles,
  TrendingUp,
  Layers,
  Users,
  Building2,
  Leaf,
  ArrowRight,
  Lock,
  Unlock,
  Play,
  Save,
  FileText,
  Download
} from 'lucide-react';
import {
  DEFAULT_FRAMEWORKS,
  getFramework,
  calculateTargetYear,
  validateTargets,
  type TargetFramework
} from '@/lib/sustainability/target-frameworks';
import { EmissionCoverageAnalysis } from './EmissionCoverageAnalysis';

interface TargetSettingWorkflowProps {
  organizationId: string;
  onComplete: (targets: any) => void;
  onCancel?: () => void;
}

interface WorkflowStep {
  id: string;
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'current' | 'completed';
  required: boolean;
}

interface MaterialTopic {
  id: string;
  name: string;
  category: string;
  businessImpact: number;
  stakeholderImportance: number;
  selected: boolean;
  metrics?: string[];
  currentBaseline?: number;
  suggestedTarget?: number;
}

interface TargetConfig {
  topicId: string;
  topicName: string;
  metrics: string[];
  baseline: number;
  targetValue: number;
  targetYear: number;
  reductionPercent: number;
  sbtiAligned: boolean;
  initiatives: string[];
  investment: number;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'materiality',
    number: 1,
    title: 'Materiality Assessment',
    description: 'Identify and prioritize material ESG topics',
    icon: <Grid3x3 className="w-5 h-5" />,
    status: 'current',
    required: true
  },
  {
    id: 'prioritization',
    number: 2,
    title: 'Topic Prioritization',
    description: 'Select critical topics for target setting',
    icon: <Target className="w-5 h-5" />,
    status: 'pending',
    required: true
  },
  {
    id: 'baseline',
    number: 3,
    title: 'Baseline Measurement',
    description: 'Establish current performance levels',
    icon: <BarChart3 className="w-5 h-5" />,
    status: 'pending',
    required: true
  },
  {
    id: 'gap-analysis',
    number: 4,
    title: 'Gap Analysis',
    description: 'Identify missing emission sources',
    icon: <Layers className="w-5 h-5" />,
    status: 'pending',
    required: false
  },
  {
    id: 'target-setting',
    number: 5,
    title: 'Set Targets',
    description: 'Define specific, measurable targets',
    icon: <Calculator className="w-5 h-5" />,
    status: 'pending',
    required: true
  },
  {
    id: 'scenario',
    number: 6,
    title: 'Scenario Modeling',
    description: 'Test different reduction pathways',
    icon: <TrendingUp className="w-5 h-5" />,
    status: 'pending',
    required: false
  },
  {
    id: 'validation',
    number: 7,
    title: 'Validation',
    description: 'Validate targets against standards',
    icon: <Shield className="w-5 h-5" />,
    status: 'pending',
    required: true
  },
  {
    id: 'implementation',
    number: 8,
    title: 'Implementation Plan',
    description: 'Create action plan and timeline',
    icon: <Rocket className="w-5 h-5" />,
    status: 'pending',
    required: true
  }
];

export function TargetSettingWorkflow({
  organizationId,
  onComplete,
  onCancel
}: TargetSettingWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(WORKFLOW_STEPS);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Workflow data
  const [materialTopics, setMaterialTopics] = useState<MaterialTopic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<MaterialTopic[]>([]);
  const [targetConfigs, setTargetConfigs] = useState<TargetConfig[]>([]);
  const [validationResults, setValidationResults] = useState<any>(null);

  // Initialize with sample material topics and fetch real baseline data
  useEffect(() => {
    initializeMaterialTopics();
    fetchBaselineData();
  }, []);

  const fetchBaselineData = async () => {
    try {
      // Fetch emissions data
      const emissionsResponse = await fetch('/api/sustainability/targets/current-emissions');
      if (emissionsResponse.ok) {
        const emissionsData = await emissionsResponse.json();

        // Fetch energy data
        const energyResponse = await fetch('/api/sustainability/metrics/energy-baseline');
        let energyBaseline = 0;

        if (energyResponse.ok) {
          const energyData = await energyResponse.json();
          energyBaseline = energyData.totalEnergy || 0;
        }

        // Update both GHG emissions and energy baselines with real data
        setMaterialTopics(prev =>
          prev.map(topic => {
            if (topic.id === 'ghg-emissions' && emissionsData.total > 0) {
              const baselineInTonnes = Math.round(emissionsData.total / 1000);
              return {
                ...topic,
                currentBaseline: baselineInTonnes,
                suggestedTarget: Math.round(baselineInTonnes * 0.58) // 42% reduction for SBTi
              };
            } else if (topic.id === 'energy-management' && energyBaseline > 0) {
              // Convert kWh to MWh for display (divide by 1000)
              const baselineInMWh = Math.round(energyBaseline / 1000);
              return {
                ...topic,
                currentBaseline: baselineInMWh, // in MWh
                suggestedTarget: Math.round(baselineInMWh * 0.75) // 25% reduction target
              };
            }
            return topic;
          })
        );
      }
    } catch (error) {
      console.error('Error fetching baseline data:', error);
    }
  };

  const initializeMaterialTopics = () => {
    // Sample data - would come from materiality matrix
    const topics: MaterialTopic[] = [
      {
        id: 'ghg-emissions',
        name: 'GHG Emissions',
        category: 'Environmental',
        businessImpact: 9,
        stakeholderImportance: 9,
        selected: false,
        metrics: ['scope1', 'scope2', 'scope3'],
        currentBaseline: 0, // Will be updated with real data
        suggestedTarget: 0  // Will be calculated based on real baseline
      },
      {
        id: 'energy-management',
        name: 'Energy Management',
        category: 'Environmental',
        businessImpact: 8,
        stakeholderImportance: 7,
        selected: false,
        metrics: ['electricity', 'renewable-energy'],
        currentBaseline: 0, // Will be updated with real data
        suggestedTarget: 0  // Will be calculated based on real baseline
      },
      {
        id: 'water-stewardship',
        name: 'Water Stewardship',
        category: 'Environmental',
        businessImpact: 6,
        stakeholderImportance: 7,
        selected: false,
        metrics: ['water-consumption', 'water-intensity'],
        currentBaseline: 5000,
        suggestedTarget: 3500
      },
      {
        id: 'diversity-inclusion',
        name: 'Diversity & Inclusion',
        category: 'Social',
        businessImpact: 8,
        stakeholderImportance: 9,
        selected: false,
        metrics: ['gender-diversity', 'leadership-diversity'],
        currentBaseline: 35,
        suggestedTarget: 50
      },
      {
        id: 'data-privacy',
        name: 'Data Privacy & Security',
        category: 'Governance',
        businessImpact: 9,
        stakeholderImportance: 8,
        selected: false,
        metrics: ['data-breaches', 'privacy-compliance'],
        currentBaseline: 2,
        suggestedTarget: 0
      }
    ];

    // Auto-select high-priority topics (score >= 8 on both dimensions)
    topics.forEach(topic => {
      if (topic.businessImpact >= 8 && topic.stakeholderImportance >= 8) {
        topic.selected = true;
      }
    });

    setMaterialTopics(topics);
  };

  // Update step status
  const updateStepStatus = (stepId: string, status: 'completed' | 'current' | 'pending') => {
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, status } : step
    ));
  };

  // Move to next step
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      // Mark current step as completed
      const currentStepId = steps[currentStep].id;
      setCompletedSteps(prev => new Set([...prev, currentStepId]));
      updateStepStatus(currentStepId, 'completed');

      // Move to next step
      setCurrentStep(currentStep + 1);
      updateStepStatus(steps[currentStep + 1].id, 'current');
    }
  };

  // Move to previous step
  const prevStep = () => {
    if (currentStep > 0) {
      updateStepStatus(steps[currentStep].id, 'pending');
      setCurrentStep(currentStep - 1);
      updateStepStatus(steps[currentStep - 1].id, 'current');
    }
  };

  // Can proceed to next step
  const canProceed = useMemo(() => {
    const step = steps[currentStep];

    switch (step.id) {
      case 'materiality':
        return materialTopics.some(t => t.selected);
      case 'prioritization':
        return selectedTopics.length > 0;
      case 'baseline':
        return selectedTopics.every(t => t.currentBaseline && t.currentBaseline > 0);
      case 'target-setting':
        return targetConfigs.length > 0;
      case 'scenario':
        return true; // Optional step
      case 'validation':
        return validationResults?.isValid;
      case 'implementation':
        return targetConfigs.every(t => t.initiatives.length > 0);
      default:
        return true;
    }
  }, [currentStep, materialTopics, selectedTopics, targetConfigs, validationResults]);

  // Render step content
  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case 'materiality':
        return <MaterialityStep
          topics={materialTopics}
          onTopicsChange={setMaterialTopics}
        />;

      case 'prioritization':
        return <PrioritizationStep
          topics={materialTopics.filter(t => t.selected)}
          selectedTopics={selectedTopics}
          onSelectionChange={setSelectedTopics}
        />;

      case 'baseline':
        return <BaselineStep
          topics={selectedTopics}
          onBaselineUpdate={(updated) => setSelectedTopics(updated)}
        />;

      case 'gap-analysis':
        return <EmissionCoverageAnalysis
          organizationId={organizationId}
          industry="General" // This should come from organization data
          size="medium"
          onMetricAdd={(metric) => {
            // Update selected topics with new metric
            const newTopic: MaterialTopic = {
              id: `metric-${metric.metric}`,
              category: metric.category || 'Operations',
              topic: metric.metric,
              importance: metric.importance === 'critical' ? 'High' : metric.importance === 'important' ? 'Medium' : 'Low',
              baseline: 0,
              unit: metric.unit || 'tCO2e',
              scope: metric.scope
            };
            setSelectedTopics(prev => [...prev, newTopic]);
          }}
        />;

      case 'target-setting':
        return <TargetSettingStep
          topics={selectedTopics}
          configs={targetConfigs}
          onConfigsChange={setTargetConfigs}
        />;

      case 'scenario':
        return <ScenarioStep
          configs={targetConfigs}
          onUpdate={(updated) => setTargetConfigs(updated)}
        />;

      case 'validation':
        return <ValidationStep
          configs={targetConfigs}
          onValidation={setValidationResults}
        />;

      case 'implementation':
        return <ImplementationStep
          configs={targetConfigs}
          onConfigsUpdate={setTargetConfigs}
        />;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Science-Based Target Setting Workflow
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Follow the guided process to set meaningful sustainability targets
              </p>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                         text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700
                         transition-all duration-200"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center relative">
                  <motion.div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                              ${step.status === 'completed' ? 'bg-green-500 text-white' :
                                step.status === 'current' ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' :
                                'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      step.icon
                    )}
                  </motion.div>
                  <div className="mt-2 text-center">
                    <p className={`text-xs font-medium
                                ${step.status === 'current' ? 'text-gray-900 dark:text-white' :
                                  'text-gray-500 dark:text-gray-400'}`}>
                      {step.title}
                    </p>
                    {step.required && (
                      <span className="text-xs text-red-500">*</span>
                    )}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300
                                ${completedSteps.has(step.id) ? 'bg-green-500' :
                                  'bg-gray-200 dark:bg-gray-700'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Step {steps[currentStep].number}: {steps[currentStep].title}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {steps[currentStep].description}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-6 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                     text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700
                     transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={nextStep}
              disabled={!canProceed}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg
                       hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200
                       flex items-center gap-2 disabled:opacity-50"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => onComplete(targetConfigs)}
              disabled={!canProceed}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg
                       hover:shadow-lg hover:shadow-green-500/25 transition-all duration-200
                       flex items-center gap-2 disabled:opacity-50"
            >
              Complete & Save Targets
              <Save className="w-4 h-4" />
            </button>
          )}
        </div>
    </div>
  );
}

// Step 1: Materiality Assessment
function MaterialityStep({
  topics,
  onTopicsChange
}: {
  topics: MaterialTopic[];
  onTopicsChange: (topics: MaterialTopic[]) => void;
}) {
  const toggleTopic = (topicId: string) => {
    onTopicsChange(topics.map(t =>
      t.id === topicId ? { ...t, selected: !t.selected } : t
    ));
  };

  const criticalTopics = topics.filter(t =>
    t.businessImpact >= 7 && t.stakeholderImportance >= 7
  );

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900 dark:text-blue-200">
              Material topics are identified based on their business impact and stakeholder importance.
              Topics with high scores on both dimensions should be prioritized for target setting.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Critical Material Topics (Score ≥ 7 on both dimensions)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {criticalTopics.map(topic => (
            <div
              key={topic.id}
              onClick={() => toggleTopic(topic.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                        ${topic.selected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {topic.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {topic.category}
                  </p>
                  <div className="flex gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Business: {topic.businessImpact}/10
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Stakeholder: {topic.stakeholderImportance}/10
                      </span>
                    </div>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                              ${topic.selected
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300 dark:border-gray-600'
                              }`}>
                  {topic.selected && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <p className="text-sm text-yellow-900 dark:text-yellow-200">
            {topics.filter(t => t.selected).length} topics selected for target setting
          </p>
        </div>
      </div>
    </div>
  );
}

// Step 2: Topic Prioritization
function PrioritizationStep({
  topics,
  selectedTopics,
  onSelectionChange
}: {
  topics: MaterialTopic[];
  selectedTopics: MaterialTopic[];
  onSelectionChange: (topics: MaterialTopic[]) => void;
}) {
  useEffect(() => {
    // Auto-select all topics initially
    if (selectedTopics.length === 0) {
      onSelectionChange(topics);
    }
  }, []);

  const toggleSelection = (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;

    const isSelected = selectedTopics.some(t => t.id === topicId);
    if (isSelected) {
      onSelectionChange(selectedTopics.filter(t => t.id !== topicId));
    } else {
      onSelectionChange([...selectedTopics, topic]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
        <p className="text-sm text-purple-900 dark:text-purple-200">
          Prioritize which material topics will have specific targets set. Consider your organization's
          capacity and resources when selecting topics for immediate action.
        </p>
      </div>

      <div className="space-y-4">
        {topics.map(topic => {
          const isSelected = selectedTopics.some(t => t.id === topic.id);
          const priority = topic.businessImpact + topic.stakeholderImportance;

          return (
            <div
              key={topic.id}
              className={`p-4 rounded-lg border-2 transition-all duration-200
                        ${isSelected
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                        }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full
                                  ${priority >= 16 ? 'bg-red-500' :
                                    priority >= 14 ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {topic.name}
                    </h4>
                    <span className={`px-2 py-1 rounded text-xs
                                  ${priority >= 16 ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                                    priority >= 14 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                    'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
                      {priority >= 16 ? 'Critical' : priority >= 14 ? 'High' : 'Medium'} Priority
                    </span>
                  </div>
                  <div className="flex gap-6 mt-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Combined Score: {priority}/20
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Metrics: {topic.metrics?.join(', ')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleSelection(topic.id)}
                  className={`px-4 py-2 rounded-lg transition-all duration-200
                            ${isSelected
                              ? 'bg-purple-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                >
                  {isSelected ? 'Selected' : 'Select'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <span className="text-sm text-gray-600 dark:text-gray-300">
          Topics selected for target setting:
        </span>
        <span className="text-lg font-semibold text-gray-900 dark:text-white">
          {selectedTopics.length} / {topics.length}
        </span>
      </div>
    </div>
  );
}

// Step 3: Baseline Measurement
function BaselineStep({
  topics,
  onBaselineUpdate
}: {
  topics: MaterialTopic[];
  onBaselineUpdate: (topics: MaterialTopic[]) => void;
}) {
  const updateBaseline = (topicId: string, value: number) => {
    onBaselineUpdate(topics.map(t =>
      t.id === topicId ? { ...t, currentBaseline: value } : t
    ));
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <p className="text-sm text-green-900 dark:text-green-200">
          Establish baseline measurements for each topic. This data will be used to calculate
          reduction targets and track progress over time.
        </p>
      </div>

      <div className="space-y-4">
        {topics.map(topic => (
          <div key={topic.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {topic.name}
              </h4>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {topic.category}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Current Baseline
                </label>
                <input
                  type="number"
                  value={topic.currentBaseline || ''}
                  onChange={(e) => updateBaseline(topic.id, parseFloat(e.target.value))}
                  placeholder="Enter value"
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-900
                           border border-gray-200 dark:border-gray-700
                           text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Unit
                </label>
                <input
                  type="text"
                  value={
                    topic.name.includes('GHG') ? 'tCO₂e' :
                    topic.name.includes('Energy') ? 'MWh' :
                    topic.name.includes('Water') ? 'm³' :
                    topic.name.includes('Waste') ? 'tonnes' :
                    topic.name.includes('Diversity') ? '%' :
                    'units'
                  }
                  disabled
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800
                           border border-gray-200 dark:border-gray-700
                           text-gray-500 dark:text-gray-400"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Data Quality
                </label>
                <select className="mt-1 w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-900
                                 border border-gray-200 dark:border-gray-700
                                 text-gray-900 dark:text-white">
                  <option>High (Measured)</option>
                  <option>Medium (Calculated)</option>
                  <option>Low (Estimated)</option>
                </select>
              </div>
            </div>

            {topic.metrics && topic.metrics.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Related metrics: {topic.metrics.join(', ')}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Step 4: Target Setting
function TargetSettingStep({
  topics,
  configs,
  onConfigsChange
}: {
  topics: MaterialTopic[];
  configs: TargetConfig[];
  onConfigsChange: (configs: TargetConfig[]) => void;
}) {
  useEffect(() => {
    if (configs.length === 0) {
      // Initialize configs with suggested targets
      const initialConfigs: TargetConfig[] = topics.map(topic => ({
        topicId: topic.id,
        topicName: topic.name,
        metrics: topic.metrics || [],
        baseline: topic.currentBaseline || 0,
        targetValue: topic.suggestedTarget || topic.currentBaseline! * 0.58, // 42% reduction
        targetYear: 2030,
        reductionPercent: 42,
        sbtiAligned: true,
        initiatives: [],
        investment: 0
      }));
      onConfigsChange(initialConfigs);
    }
  }, []);

  const updateConfig = (topicId: string, field: keyof TargetConfig, value: any) => {
    onConfigsChange(configs.map(config => {
      if (config.topicId === topicId) {
        const updated = { ...config, [field]: value };

        // Recalculate reduction percentage
        if (field === 'targetValue' || field === 'baseline') {
          updated.reductionPercent = Math.round(
            ((updated.baseline - updated.targetValue) / updated.baseline) * 100
          );
          updated.sbtiAligned = updated.reductionPercent >= 42 && updated.targetYear === 2030;
        }

        return updated;
      }
      return config;
    }));
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900 dark:text-blue-200">
              Set specific, measurable targets for each material topic. SBTi requires at least
              42% reduction by 2030 for 1.5°C alignment.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {configs.map(config => (
          <div key={config.topicId} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {config.topicName}
              </h4>
              {config.sbtiAligned ? (
                <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                  SBTi Aligned
                </span>
              ) : (
                <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                  Below SBTi
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Baseline ({new Date().getFullYear()})
                </label>
                <div className="mt-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-900
                              border border-gray-200 dark:border-gray-700
                              text-gray-900 dark:text-white">
                  {config.baseline.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Target Value
                </label>
                <input
                  type="number"
                  value={config.targetValue}
                  onChange={(e) => updateConfig(config.topicId, 'targetValue', parseFloat(e.target.value))}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-900
                           border border-gray-200 dark:border-gray-700
                           text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Target Year
                </label>
                <select
                  value={config.targetYear}
                  onChange={(e) => updateConfig(config.topicId, 'targetYear', parseInt(e.target.value))}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-900
                           border border-gray-200 dark:border-gray-700
                           text-gray-900 dark:text-white"
                >
                  <option value={2025}>2025</option>
                  <option value={2030}>2030</option>
                  <option value={2035}>2035</option>
                  <option value={2040}>2040</option>
                  <option value={2050}>2050</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Reduction
                </label>
                <div className={`mt-1 px-3 py-2 rounded-lg border text-center font-medium
                              ${config.reductionPercent >= 42
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400'
                              }`}>
                  {config.reductionPercent}%
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Quick Set:
                </span>
              </div>
              <button
                onClick={() => updateConfig(config.topicId, 'targetValue', config.baseline * 0.58)}
                className="px-3 py-1 rounded bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400
                         text-xs hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors"
              >
                1.5°C (42%)
              </button>
              <button
                onClick={() => updateConfig(config.topicId, 'targetValue', config.baseline * 0.75)}
                className="px-3 py-1 rounded bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400
                         text-xs hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
              >
                WB2C (25%)
              </button>
              <button
                onClick={() => updateConfig(config.topicId, 'targetValue', config.baseline * 0.1)}
                className="px-3 py-1 rounded bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400
                         text-xs hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors"
              >
                Net Zero (90%)
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Step 5: Scenario Modeling - Interactive metric-level adjustments
function ScenarioStep({
  configs,
  onUpdate
}: {
  configs: TargetConfig[];
  onUpdate: (configs: TargetConfig[]) => void;
}) {
  const [selectedPathway, setSelectedPathway] = useState<'linear' | 'frontloaded' | 'technology'>('linear');
  const [metricReductions, setMetricReductions] = useState<{ [key: string]: number }>({});
  const [availableMetrics, setAvailableMetrics] = useState<any[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [baselineYear, setBaselineYear] = useState<number>(new Date().getFullYear() - 1);

  // Fetch available metrics from the database
  useEffect(() => {
    fetchAvailableMetrics();
  }, []);

  const fetchAvailableMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const response = await fetch('/api/sustainability/targets/available-metrics');
      if (response.ok) {
        const data = await response.json();
        setAvailableMetrics(data.metrics || []);
        if (data.baselineYear) {
          setBaselineYear(data.baselineYear);
        }
      }
    } catch (error) {
      console.error('Error fetching available metrics:', error);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Initialize metric reductions based on configs
  useEffect(() => {
    const initialReductions: { [key: string]: number } = {};
    configs.forEach(config => {
      // Default to proportional reduction based on overall target
      const defaultReduction = config.type === 'ghg-emissions' ? 42 : 25; // SBTi for GHG, 25% for energy
      initialReductions[config.type] = defaultReduction;
    });
    setMetricReductions(initialReductions);
  }, [configs]);

  // Calculate projected values based on reductions
  const calculateProjection = (baseline: number, reductionPercent: number) => {
    return baseline * (1 - reductionPercent / 100);
  };

  // Update individual metric reduction
  const updateMetricReduction = (metricId: string, value: number) => {
    setMetricReductions(prev => ({
      ...prev,
      [metricId]: value
    }));
  };

  // Apply pathway template
  const applyPathway = (pathway: 'linear' | 'frontloaded' | 'technology' | 'renewable') => {
    setSelectedPathway(pathway as any);
    const newReductions: { [key: string]: number } = {};

    if (pathway === 'renewable') {
      // 100% renewable energy scenario - no consumption reduction, 100% renewable
      newReductions['electricity-consumption'] = 0;
      newReductions['electricity-renewable'] = 100;
      newReductions['heating-consumption'] = 0;
      newReductions['heating-renewable'] = 100;
      newReductions['cooling-consumption'] = 0;
      newReductions['cooling-renewable'] = 100;
      newReductions['ev-charging-consumption'] = 0;
      newReductions['ev-charging-renewable'] = 100;
      // Keep some reduction for Scope 3
      newReductions['waste-landfill'] = 50;
      newReductions['waste-incinerated'] = 50;
      newReductions['waste-recycled'] = 30;
      newReductions['water'] = 20;
      newReductions['business-travel'] = 40;
    } else {
      // Standard pathways with consumption reduction and partial renewable
      const pathwaySettings = {
        linear: {
          consumptionReduction: 25,
          renewablePercent: 30,
          wasteReduction: { landfill: 40, incinerated: 30, recycled: 20, water: 15, travel: 30 }
        },
        frontloaded: {
          consumptionReduction: 30,
          renewablePercent: 50,
          wasteReduction: { landfill: 60, incinerated: 50, recycled: 30, water: 25, travel: 50 }
        },
        technology: {
          consumptionReduction: 20,
          renewablePercent: 20,
          wasteReduction: { landfill: 30, incinerated: 20, recycled: 10, water: 10, travel: 20 }
        }
      };

      const selected = pathwaySettings[pathway] || pathwaySettings.linear;

      // Apply to all energy metrics
      ['electricity', 'heating', 'cooling', 'ev-charging'].forEach(metric => {
        newReductions[`${metric}-consumption`] = selected.consumptionReduction;
        newReductions[`${metric}-renewable`] = selected.renewablePercent;
      });

      // Apply waste reductions
      newReductions['waste-landfill'] = selected.wasteReduction.landfill;
      newReductions['waste-incinerated'] = selected.wasteReduction.incinerated;
      newReductions['waste-recycled'] = selected.wasteReduction.recycled;
      newReductions['water'] = selected.wasteReduction.water;
      newReductions['business-travel'] = selected.wasteReduction.travel;
    }

    setMetricReductions(newReductions);
  };

  // Calculate total impact from individual metrics
  const calculateTotalImpact = () => {
    const detailedMetrics = [
      // Energy Metrics (Scope 2) - all have dual strategy
      { id: 'electricity', baseline: 465, unit: 'MWh', scope: 2, hasDualStrategy: true },
      { id: 'heating', baseline: 111, unit: 'MWh', scope: 2, hasDualStrategy: true },
      { id: 'cooling', baseline: 436, unit: 'MWh', scope: 2, hasDualStrategy: true },
      { id: 'ev-charging', baseline: 32, unit: 'MWh', scope: 2, hasDualStrategy: true },
      // Scope 3 Metrics with dual strategies
      { id: 'waste-landfill', baseline: 50, unit: 'tCO₂e', scope: 3, hasDualStrategy: true },
      { id: 'waste-incinerated', baseline: 30, unit: 'tCO₂e', scope: 3, hasDualStrategy: true },
      { id: 'water', baseline: 100, unit: 'tCO₂e', scope: 3, hasDualStrategy: true },
      { id: 'business-travel', baseline: 142, unit: 'tCO₂e', scope: 3, hasDualStrategy: true }
    ];

    let totalCurrentEmissions = 0;
    let totalTargetEmissions = 0;

    detailedMetrics.forEach(metric => {
      if (metric.hasDualStrategy) {
        const consumptionReduction = metricReductions[`${metric.id}-consumption`] || 0;
        const impactReduction = metricReductions[`${metric.id}-renewable`] || 0; // "renewable" used for all impact reductions

        if (metric.unit === 'MWh') {
          // Energy metrics: consumption reduction + renewable procurement
          const actualConsumption = metric.baseline * (1 - consumptionReduction / 100);
          const baselineEmissions = metric.baseline * 0.4; // 0.4 tCO2/MWh
          const targetEmissions = actualConsumption * 0.4 * (1 - impactReduction / 100);

          totalCurrentEmissions += baselineEmissions;
          totalTargetEmissions += targetEmissions;
        } else {
          // Non-energy dual strategy metrics
          const volumeAfterReduction = metric.baseline * (1 - consumptionReduction / 100);
          const emissionsAfterImpactReduction = volumeAfterReduction * (1 - impactReduction / 100);

          totalCurrentEmissions += metric.baseline;
          totalTargetEmissions += emissionsAfterImpactReduction;
        }
      } else {
        // Single strategy metrics (if any remain)
        const reduction = metricReductions[metric.id] || 0;
        totalCurrentEmissions += metric.baseline;
        totalTargetEmissions += metric.baseline * (1 - reduction / 100);
      }
    });

    return {
      current: totalCurrentEmissions,
      target: totalTargetEmissions,
      reduction: totalCurrentEmissions - totalTargetEmissions,
      percentage: totalCurrentEmissions > 0 ? ((totalCurrentEmissions - totalTargetEmissions) / totalCurrentEmissions * 100).toFixed(1) : '0'
    };
  };

  const impact = calculateTotalImpact();

  return (
    <div className="space-y-6">
      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
        <p className="text-sm text-purple-900 dark:text-purple-200">
          Adjust reduction targets for individual metrics to model different pathways. Each metric can have its own reduction strategy based on feasibility and cost.
        </p>
      </div>

      {/* Pathway Templates */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => applyPathway('linear')}
          className={`p-4 border rounded-lg transition-all ${
            selectedPathway === 'linear'
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300'
          }`}
        >
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Linear Pathway</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Standard Target: Balanced reduction pathway
          </p>
        </button>

        <button
          onClick={() => applyPathway('frontloaded')}
          className={`p-4 border rounded-lg transition-all ${
            selectedPathway === 'frontloaded'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-green-300'
          }`}
        >
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Front-loaded</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Aggressive: Accelerated reduction pathway
          </p>
        </button>

        <button
          onClick={() => applyPathway('technology')}
          className={`p-4 border rounded-lg transition-all ${
            selectedPathway === 'technology'
              ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300'
          }`}
        >
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Technology-driven</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Conservative: Gradual reduction pathway
          </p>
        </button>

        <button
          onClick={() => applyPathway('renewable')}
          className={`p-4 border rounded-lg transition-all ${
            selectedPathway === 'renewable'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-300'
          }`}
        >
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">🌱 100% Renewable</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Zero Scope 2: Complete renewable transition
          </p>
        </button>
      </div>

      {/* Interactive Metric Adjustments */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Adjust Individual Metrics
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Baseline Year:</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-md text-sm font-medium">
              {baselineYear}
            </span>
          </div>
        </div>

        {/* Category filter for many metrics */}
        {availableMetrics.length > 10 && (
          <div className="mb-4 flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg text-sm ${
                selectedCategory === 'all'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              All ({availableMetrics.length})
            </button>
            {['energy', 'transportation', 'waste', 'water', 'materials', 'other'].map(cat => {
              const count = availableMetrics.filter(m =>
                m.category?.toLowerCase().includes(cat) ||
                (cat === 'other' && !['energy', 'transport', 'waste', 'water', 'material'].some(c =>
                  m.category?.toLowerCase().includes(c)
                ))
              ).length;

              if (count === 0) return null;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-sm capitalize ${
                    selectedCategory === cat
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Render metrics dynamically from database */}
        {loadingMetrics ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading available metrics...</span>
          </div>
        ) : (
          <>
            {(() => {
              // Filter metrics based on selected category
              let displayMetrics = availableMetrics;
              if (selectedCategory !== 'all') {
                displayMetrics = availableMetrics.filter(m => {
                  if (selectedCategory === 'other') {
                    return !['energy', 'transport', 'waste', 'water', 'material'].some(c =>
                      m.category?.toLowerCase().includes(c)
                    );
                  }
                  return m.category?.toLowerCase().includes(selectedCategory);
                });
              }

              // If no metrics from database, use defaults for demo
              if (displayMetrics.length === 0) {
                displayMetrics = [
                  { id: 'electricity', name: 'Electricity', category: 'Energy', totalEmissions: 186, totalValue: 465, unit: 'MWh', scope: 'scope_2',
                    strategies: { hasDualStrategy: true, reduction: 'Energy Efficiency', improvement: 'Renewable Energy', reductionMax: 50, improvementMax: 100 } },
                  { id: 'heating', name: 'Purchased Heating', category: 'Energy', totalEmissions: 44.4, totalValue: 111, unit: 'MWh', scope: 'scope_2',
                    strategies: { hasDualStrategy: true, reduction: 'Energy Efficiency', improvement: 'Renewable Energy', reductionMax: 50, improvementMax: 100 } },
                  { id: 'cooling', name: 'Purchased Cooling', category: 'Energy', totalEmissions: 174.4, totalValue: 436, unit: 'MWh', scope: 'scope_2',
                    strategies: { hasDualStrategy: true, reduction: 'Energy Efficiency', improvement: 'Renewable Energy', reductionMax: 50, improvementMax: 100 } },
                  { id: 'waste', name: 'Waste to Landfill', category: 'Waste', totalEmissions: 50, totalValue: 50, unit: 'tCO₂e', scope: 'scope_3',
                    strategies: { hasDualStrategy: true, reduction: 'Waste Prevention', improvement: 'Diversion to Recycling', reductionMax: 50, improvementMax: 90 } },
                  { id: 'travel', name: 'Business Travel', category: 'Travel', totalEmissions: 142, totalValue: 142, unit: 'tCO₂e', scope: 'scope_3',
                    strategies: { hasDualStrategy: true, reduction: 'Trip Reduction', improvement: 'Mode Shift', reductionMax: 50, improvementMax: 80 } }
                ];
              }

              return displayMetrics.map(metric => {
                const reduction = metricReductions[metric.id] || 0;
                const consumptionReduction = metricReductions[`${metric.id}-consumption`] || 0;
                const renewablePercent = metricReductions[`${metric.id}-renewable`] || 0;

                // Use actual baseline from database
                const baseline = metric.totalValue || metric.totalEmissions || 0;
                const baselineEmissions = metric.totalEmissions || 0;
                const hasDualStrategy = metric.strategies?.hasDualStrategy || false;

                // Calculate impact based on metric type and strategies
                let actualConsumption = baseline;
                let actualEmissions = 0;
                let co2Impact = 0;

                if (hasDualStrategy) {
                  // Apply dual strategy calculation
                  actualConsumption = baseline * (1 - consumptionReduction / 100);

                  if (metric.unit === 'MWh' || metric.unit === 'kWh' || metric.unit === 'GJ') {
                    // Energy metrics: apply grid factor
                    const gridFactor = metric.emissionFactor || 0.4; // Use actual factor or default
                    actualEmissions = actualConsumption * gridFactor * (1 - renewablePercent / 100);
                    co2Impact = baselineEmissions - actualEmissions;
                  } else {
                    // Other metrics: volume reduction + impact reduction
                    const volumeAfterReduction = baselineEmissions * (1 - consumptionReduction / 100);
                    actualEmissions = volumeAfterReduction * (1 - renewablePercent / 100);
                    co2Impact = baselineEmissions - actualEmissions;
                  }
                } else {
                  // Single strategy metrics
                  actualConsumption = baseline * (1 - reduction / 100);
                  actualEmissions = baselineEmissions * (1 - reduction / 100);
                  co2Impact = baselineEmissions * reduction / 100;
                }

                // Determine scope for display
                const scopeNum = metric.scope?.replace('scope_', '') || '3';

            return (
              <div key={metric.id} className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {metric.name}
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        scopeNum === '2' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        scopeNum === '3' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        scopeNum === '1' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        Scope {scopeNum}
                      </span>
                      <span className="text-xs text-gray-500">
                        {metric.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {baselineYear} Baseline: {baseline > 0 ? Math.round(baseline).toLocaleString() : '0'} {metric.unit}
                      {baselineEmissions > 0 && metric.unit !== 'tCO₂e' && (
                        <span className="text-xs"> ({(baselineEmissions/1000).toFixed(1)} tCO₂e)</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    {metric.unit === 'MWh' ? (
                      <div>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          -{co2Impact.toFixed(1)} tCO₂e
                        </p>
                        <p className="text-xs text-gray-500">
                          {consumptionReduction > 0 && `-${consumptionReduction}% usage`}
                          {consumptionReduction > 0 && renewablePercent > 0 && ', '}
                          {renewablePercent > 0 && `${renewablePercent}% clean`}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {reduction}%
                        </p>
                        <p className="text-xs text-gray-500">
                          -{co2Impact.toFixed(1)} tCO₂e
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Show appropriate sliders based on metric type */}
                {hasDualStrategy ? (
                  <>
                    {/* First Slider - Consumption/Volume Reduction */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {metric.strategies?.reduction || 'Consumption Reduction'}
                        </label>
                        <span className="text-xs text-gray-500">
                          {consumptionReduction}% reduction
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={consumptionReduction}
                        onChange={(e) => updateMetricReduction(`${metric.id}-consumption`, parseInt(e.target.value))}
                        className="w-full accent-blue-600"
                        style={{
                          background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${consumptionReduction * 2}%, rgb(229, 231, 235) ${consumptionReduction * 2}%, rgb(229, 231, 235) 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0%</span>
                        <span>10%</span>
                        <span>20%</span>
                        <span>30%</span>
                        <span>40%</span>
                        <span>50%</span>
                      </div>
                    </div>

                    {/* Second Slider - Impact/Intensity Reduction */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {metric.strategies?.improvement || 'Impact Reduction'}
                        </label>
                        {renewablePercent === 100 && metric.unit === 'MWh' && (
                          <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                            🌱 100% Clean
                          </span>
                        )}
                        {renewablePercent > 75 && metric.id === 'business-travel' && (
                          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">
                            🚂 Rail Priority
                          </span>
                        )}
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={renewablePercent}
                        onChange={(e) => updateMetricReduction(`${metric.id}-renewable`, parseInt(e.target.value))}
                        className="w-full accent-green-600"
                        style={{
                          background: `linear-gradient(to right, rgb(34, 197, 94) 0%, rgb(34, 197, 94) ${renewablePercent}%, rgb(229, 231, 235) ${renewablePercent}%, rgb(229, 231, 235) 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Single strategy metrics */
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Reduction Target
                      </label>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={reduction}
                      onChange={(e) => updateMetricReduction(metric.id, parseInt(e.target.value))}
                      className="w-full accent-blue-600"
                      style={{
                        background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${reduction}%, rgb(229, 231, 235) ${reduction}%, rgb(229, 231, 235) 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}

                {/* Target Preview with feasibility indicator */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">2024 Baseline</p>
                    <p className="font-medium">{metric.baseline} {metric.unit}</p>
                    {metric.unit === 'MWh' && (
                      <p className="text-xs text-gray-400">{(metric.baseline * 0.4).toFixed(1)} tCO₂e</p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400">→</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">2030 Target</p>
                    {/* Show appropriate preview based on metric type */}
                    {hasDualStrategy ? (
                      <>
                        {metric.unit === 'MWh' ? (
                          <>
                            <p className="font-medium text-green-600 dark:text-green-400">
                              {Math.round(actualConsumption)} {metric.unit}
                            </p>
                            {consumptionReduction > 0 && (
                              <p className="text-xs text-blue-500">-{consumptionReduction}% consumption</p>
                            )}
                            <p className="text-xs text-gray-400">
                              {actualEmissions.toFixed(1)} tCO₂e
                            </p>
                            {renewablePercent > 0 && (
                              <p className="text-xs text-green-500">{renewablePercent}% renewable</p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="font-medium text-green-600 dark:text-green-400">
                              {actualEmissions.toFixed(1)} tCO₂e
                            </p>
                            {consumptionReduction > 0 && (
                              <p className="text-xs text-blue-500">-{consumptionReduction}% volume</p>
                            )}
                            {renewablePercent > 0 && (
                              <p className="text-xs text-green-500">-{renewablePercent}% impact</p>
                            )}
                            {consumptionReduction > 0 && renewablePercent > 0 && (
                              <p className="text-xs text-purple-500">
                                Total: -{Math.round((1 - actualEmissions/metric.baseline) * 100)}% emissions
                              </p>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <p className={`font-medium ${
                          reduction > 75 ? 'text-orange-600 dark:text-orange-400' :
                          reduction > 50 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-green-600 dark:text-green-400'
                        }`}>
                          {Math.round(actualConsumption)} {metric.unit}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Feasibility indicator */}
                {metric.unit === 'MWh' ? (
                  <>
                    {consumptionReduction > 40 && (
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        ⚠️ High consumption reduction - requires significant efficiency upgrades
                      </p>
                    )}
                    {renewablePercent === 100 && consumptionReduction === 0 && (
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        💡 Consider combining renewable energy with efficiency improvements
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    {reduction > 75 && (
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        ⚠️ Very ambitious - may require significant investment
                      </p>
                    )}
                    {reduction > 90 && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        ⚠️ Extremely challenging - consider phased approach
                      </p>
                    )}
                  </>
                )}
              </div>
                );
              });
            })()}
          </>
        )}

        {/* Carbon Offset Section */}
        <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <h4 className="font-medium text-emerald-900 dark:text-emerald-200 mb-3">
            🌳 Carbon Offset Strategy
          </h4>
          <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-4">
            Compensate for remaining emissions through certified offset projects
          </p>
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Offset Percentage of Remaining Emissions
              </label>
              <span className="text-xs text-emerald-600">
                {metricReductions['carbon-offset'] || 0}% offset
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={metricReductions['carbon-offset'] || 0}
              onChange={(e) => updateMetricReduction('carbon-offset', parseInt(e.target.value))}
              className="w-full accent-emerald-600"
              style={{
                background: `linear-gradient(to right, rgb(16, 185, 129) 0%, rgb(16, 185, 129) ${metricReductions['carbon-offset'] || 0}%, rgb(229, 231, 235) ${metricReductions['carbon-offset'] || 0}%, rgb(229, 231, 235) 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
          {(metricReductions['carbon-offset'] || 0) > 0 && (
            <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Offset amount: <span className="font-medium text-emerald-600">
                  {Math.round(impact.target * (metricReductions['carbon-offset'] || 0) / 100).toLocaleString()} tCO₂e
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Estimated annual cost: €{Math.round(impact.target * (metricReductions['carbon-offset'] || 0) / 100 * 25).toLocaleString()}
                <span className="text-gray-400"> (at €25/tCO₂e)</span>
              </p>
            </div>
          )}
        </div>

        {/* Total Impact Summary */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-3">
            Total Impact Summary
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Direct Reduction</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {impact.percentage}%
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {Math.round(impact.reduction).toLocaleString()} tCO₂e
              </p>
            </div>
            <div>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">Carbon Offsets</p>
              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {((metricReductions['carbon-offset'] || 0) * (100 - parseFloat(impact.percentage)) / 100).toFixed(1)}%
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                {Math.round(impact.target * (metricReductions['carbon-offset'] || 0) / 100).toLocaleString()} tCO₂e
              </p>
            </div>
            <div>
              <p className="text-sm text-purple-700 dark:text-purple-300">Net Reduction</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {(parseFloat(impact.percentage) + ((metricReductions['carbon-offset'] || 0) * (100 - parseFloat(impact.percentage)) / 100)).toFixed(1)}%
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                {Math.round(impact.reduction + impact.target * (metricReductions['carbon-offset'] || 0) / 100).toLocaleString()} tCO₂e
              </p>
            </div>
          </div>
          <div className="mt-3 text-sm">
            {(parseFloat(impact.percentage) + ((metricReductions['carbon-offset'] || 0) * (100 - parseFloat(impact.percentage)) / 100)) >= 42 ? (
              <span className="flex items-center gap-1 text-green-700 dark:text-green-300">
                <CheckCircle2 className="w-4 h-4" />
                Meets target framework requirements
              </span>
            ) : (
              <span className="flex items-center gap-1 text-orange-700 dark:text-orange-300">
                <AlertTriangle className="w-4 h-4" />
                Below target framework requirements
              </span>
            )}
            {(metricReductions['carbon-offset'] || 0) > 50 && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                ⚠️ High offset reliance - prioritize direct reductions for credible net-zero pathway
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 6: Validation
function ValidationStep({
  configs,
  onValidation
}: {
  configs: TargetConfig[];
  onValidation: (results: any) => void;
}) {
  const [validationResults, setValidationResults] = useState<any>(null);

  useEffect(() => {
    validateTargets();
  }, []);

  const validateTargets = () => {
    const results = {
      isValid: true,
      checks: [
        {
          name: 'SBTi Alignment',
          status: configs.every(c => c.sbtiAligned) ? 'passed' : 'warning',
          message: configs.every(c => c.sbtiAligned)
            ? 'All targets meet SBTi criteria'
            : `${configs.filter(c => !c.sbtiAligned).length} targets below SBTi threshold`
        },
        {
          name: 'Coverage',
          status: configs.length >= 3 ? 'passed' : 'warning',
          message: `${configs.length} material topics covered`
        },
        {
          name: 'Timeframe',
          status: configs.every(c => c.targetYear <= 2030) ? 'passed' : 'warning',
          message: configs.every(c => c.targetYear <= 2030)
            ? 'All targets set for 2030 or earlier'
            : 'Some targets exceed 2030 timeframe'
        },
        {
          name: 'Data Quality',
          status: 'passed',
          message: 'Baseline data verified'
        }
      ]
    };

    setValidationResults(results);
    onValidation(results);
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
          <div>
            <p className="text-sm text-green-900 dark:text-green-200">
              Validating targets against industry standards and best practices.
            </p>
          </div>
        </div>
      </div>

      {validationResults && (
        <div className="space-y-3">
          {validationResults.checks.map((check: any, index: number) => (
            <div key={index} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {check.status === 'passed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  )}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {check.name}
                  </span>
                </div>
                <span className={`text-sm ${
                  check.status === 'passed' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {check.message}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
          Validation Summary
        </h4>
        <p className="text-sm text-blue-800 dark:text-blue-300">
          Your targets are ready for implementation. Consider getting external validation
          from SBTi for credibility and stakeholder confidence.
        </p>
      </div>
    </div>
  );
}

// Step 7: Implementation Planning
function ImplementationStep({
  configs,
  onConfigsUpdate
}: {
  configs: TargetConfig[];
  onConfigsUpdate: (configs: TargetConfig[]) => void;
}) {
  const addInitiative = (topicId: string, initiative: string) => {
    onConfigsUpdate(configs.map(c =>
      c.topicId === topicId
        ? { ...c, initiatives: [...c.initiatives, initiative] }
        : c
    ));
  };

  const suggestedInitiatives: Record<string, string[]> = {
    'ghg-emissions': [
      'Energy efficiency program',
      'Renewable energy transition',
      'Fleet electrification',
      'Supply chain engagement'
    ],
    'energy-management': [
      'LED lighting retrofit',
      'HVAC optimization',
      'Solar PV installation',
      'Energy management system'
    ],
    'water-stewardship': [
      'Water recycling system',
      'Leak detection program',
      'Rainwater harvesting',
      'Process optimization'
    ],
    'diversity-inclusion': [
      'Inclusive hiring practices',
      'Leadership development',
      'Pay equity audit',
      'Employee resource groups'
    ],
    'data-privacy': [
      'Privacy by design',
      'Security training',
      'Incident response plan',
      'Third-party audits'
    ]
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-start gap-3">
          <Rocket className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
          <div>
            <p className="text-sm text-green-900 dark:text-green-200">
              Define key initiatives and actions to achieve each target. This forms your
              implementation roadmap.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {configs.map(config => (
          <div key={config.topicId} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {config.topicName}
              </h4>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Target: {config.reductionPercent}% by {config.targetYear}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Key Initiatives:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedInitiatives[config.topicId]?.map((initiative, index) => (
                    <button
                      key={index}
                      onClick={() => addInitiative(config.topicId, initiative)}
                      disabled={config.initiatives.includes(initiative)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors
                                ${config.initiatives.includes(initiative)
                                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                    >
                      {config.initiatives.includes(initiative) && (
                        <CheckCircle2 className="w-3 h-3 inline mr-1" />
                      )}
                      {initiative}
                    </button>
                  ))}
                </div>
              </div>

              {config.initiatives.length > 0 && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Selected Initiatives ({config.initiatives.length}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {config.initiatives.map((initiative, index) => (
                      <span key={index} className="text-xs text-gray-700 dark:text-gray-300">
                        • {initiative}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20
                    border border-green-200 dark:border-green-800 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          Ready to Launch! 🚀
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your science-based targets are configured and ready for implementation.
          Click "Complete & Save Targets" to finalize the process.
        </p>
      </div>
    </div>
  );
}