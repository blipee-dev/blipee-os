'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
  Grid3x3,
  Target,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  Plus,
  Edit3,
  Trash2,
  Download,
  Upload,
  Filter,
  Settings2,
  BarChart3,
  Layers,
  Building2,
  Leaf,
  Shield,
  Globe,
  Zap,
  Droplets,
  Factory,
  UserCheck,
  Heart,
  Scale,
  TreePine,
  Recycle,
  DollarSign,
  Award,
  CircleDot,
  Move,
  Save,
  Share2
} from 'lucide-react';

interface MaterialityMatrixProps {
  organizationId: string;
  industryType?: string;
  onTopicSelect?: (topic: MaterialTopic) => void;
}

interface MaterialTopic {
  id: string;
  name: string;
  category: 'environmental' | 'social' | 'governance' | 'economic';
  description: string;
  businessImpact: number; // 1-10 scale
  stakeholderImportance: number; // 1-10 scale
  financialMateriality: number; // Financial impact
  impactMateriality: number; // Impact on society/environment
  trend: 'increasing' | 'stable' | 'decreasing';
  linkedMetrics?: string[];
  linkedTargets?: string[];
  risks?: string[];
  opportunities?: string[];
  gri?: string[]; // GRI disclosure references
  sasb?: string[]; // SASB topics
  tcfd?: boolean; // TCFD relevant
  color?: string;
  icon?: React.ReactNode;
}

// Pre-defined material topics by category
const DEFAULT_TOPICS: Record<string, MaterialTopic[]> = {
  environmental: [
    {
      id: 'ghg-emissions',
      name: 'GHG Emissions',
      category: 'environmental',
      description: 'Direct and indirect greenhouse gas emissions',
      businessImpact: 8,
      stakeholderImportance: 9,
      financialMateriality: 8,
      impactMateriality: 9,
      trend: 'increasing',
      gri: ['305-1', '305-2', '305-3'],
      tcfd: true,
      color: 'bg-green-500',
      icon: <Factory className="w-4 h-4" />
    },
    {
      id: 'energy-management',
      name: 'Energy Management',
      category: 'environmental',
      description: 'Energy consumption and renewable energy transition',
      businessImpact: 7,
      stakeholderImportance: 8,
      financialMateriality: 7,
      impactMateriality: 8,
      trend: 'increasing',
      gri: ['302-1', '302-3'],
      color: 'bg-yellow-500',
      icon: <Zap className="w-4 h-4" />
    },
    {
      id: 'water-stewardship',
      name: 'Water Stewardship',
      category: 'environmental',
      description: 'Water consumption and wastewater management',
      businessImpact: 6,
      stakeholderImportance: 7,
      financialMateriality: 5,
      impactMateriality: 8,
      trend: 'stable',
      gri: ['303-1', '303-3'],
      color: 'bg-blue-500',
      icon: <Droplets className="w-4 h-4" />
    },
    {
      id: 'circular-economy',
      name: 'Circular Economy',
      category: 'environmental',
      description: 'Waste reduction and resource efficiency',
      businessImpact: 6,
      stakeholderImportance: 8,
      financialMateriality: 5,
      impactMateriality: 7,
      trend: 'increasing',
      gri: ['306-1', '306-2'],
      color: 'bg-purple-500',
      icon: <Recycle className="w-4 h-4" />
    },
    {
      id: 'biodiversity',
      name: 'Biodiversity',
      category: 'environmental',
      description: 'Impact on ecosystems and natural habitats',
      businessImpact: 5,
      stakeholderImportance: 7,
      financialMateriality: 4,
      impactMateriality: 8,
      trend: 'increasing',
      gri: ['304-1', '304-2'],
      color: 'bg-emerald-500',
      icon: <TreePine className="w-4 h-4" />
    }
  ],
  social: [
    {
      id: 'employee-wellbeing',
      name: 'Employee Wellbeing',
      category: 'social',
      description: 'Health, safety, and employee satisfaction',
      businessImpact: 8,
      stakeholderImportance: 8,
      financialMateriality: 7,
      impactMateriality: 8,
      trend: 'increasing',
      gri: ['403-1', '403-9'],
      color: 'bg-pink-500',
      icon: <Heart className="w-4 h-4" />
    },
    {
      id: 'diversity-inclusion',
      name: 'Diversity & Inclusion',
      category: 'social',
      description: 'Workplace diversity and equal opportunities',
      businessImpact: 7,
      stakeholderImportance: 9,
      financialMateriality: 6,
      impactMateriality: 8,
      trend: 'increasing',
      gri: ['405-1', '406-1'],
      color: 'bg-indigo-500',
      icon: <Users className="w-4 h-4" />
    },
    {
      id: 'human-rights',
      name: 'Human Rights',
      category: 'social',
      description: 'Respect for human rights in operations and supply chain',
      businessImpact: 6,
      stakeholderImportance: 9,
      financialMateriality: 5,
      impactMateriality: 9,
      trend: 'stable',
      gri: ['412-1', '412-2'],
      color: 'bg-red-500',
      icon: <UserCheck className="w-4 h-4" />
    },
    {
      id: 'community-impact',
      name: 'Community Impact',
      category: 'social',
      description: 'Local community engagement and development',
      businessImpact: 5,
      stakeholderImportance: 7,
      financialMateriality: 4,
      impactMateriality: 7,
      trend: 'stable',
      gri: ['413-1', '413-2'],
      color: 'bg-orange-500',
      icon: <Building2 className="w-4 h-4" />
    }
  ],
  governance: [
    {
      id: 'ethics-compliance',
      name: 'Ethics & Compliance',
      category: 'governance',
      description: 'Business ethics and regulatory compliance',
      businessImpact: 9,
      stakeholderImportance: 9,
      financialMateriality: 9,
      impactMateriality: 8,
      trend: 'stable',
      gri: ['205-1', '205-3'],
      color: 'bg-slate-500',
      icon: <Scale className="w-4 h-4" />
    },
    {
      id: 'data-privacy',
      name: 'Data Privacy & Security',
      category: 'governance',
      description: 'Customer data protection and cybersecurity',
      businessImpact: 9,
      stakeholderImportance: 8,
      financialMateriality: 9,
      impactMateriality: 7,
      trend: 'increasing',
      gri: ['418-1'],
      color: 'bg-cyan-500',
      icon: <Shield className="w-4 h-4" />
    },
    {
      id: 'supply-chain',
      name: 'Supply Chain Management',
      category: 'governance',
      description: 'Responsible sourcing and supplier standards',
      businessImpact: 7,
      stakeholderImportance: 8,
      financialMateriality: 7,
      impactMateriality: 8,
      trend: 'increasing',
      gri: ['308-1', '414-1'],
      color: 'bg-amber-500',
      icon: <Globe className="w-4 h-4" />
    }
  ],
  economic: [
    {
      id: 'innovation',
      name: 'Innovation & R&D',
      category: 'economic',
      description: 'Sustainable innovation and product development',
      businessImpact: 8,
      stakeholderImportance: 7,
      financialMateriality: 8,
      impactMateriality: 7,
      trend: 'increasing',
      gri: ['203-1'],
      color: 'bg-violet-500',
      icon: <Award className="w-4 h-4" />
    },
    {
      id: 'economic-performance',
      name: 'Economic Performance',
      category: 'economic',
      description: 'Financial performance and value creation',
      businessImpact: 10,
      stakeholderImportance: 8,
      financialMateriality: 10,
      impactMateriality: 6,
      trend: 'stable',
      gri: ['201-1'],
      color: 'bg-green-600',
      icon: <DollarSign className="w-4 h-4" />
    }
  ]
};

// Industry-specific topic adjustments
const INDUSTRY_ADJUSTMENTS: Record<string, Record<string, Partial<MaterialTopic>>> = {
  'technology': {
    'data-privacy': { businessImpact: 10, stakeholderImportance: 10 },
    'energy-management': { businessImpact: 8, stakeholderImportance: 7 },
    'e-waste': { businessImpact: 7, stakeholderImportance: 8 }
  },
  'manufacturing': {
    'ghg-emissions': { businessImpact: 9, stakeholderImportance: 10 },
    'water-stewardship': { businessImpact: 8, stakeholderImportance: 8 },
    'worker-safety': { businessImpact: 9, stakeholderImportance: 9 }
  },
  'finance': {
    'data-privacy': { businessImpact: 10, stakeholderImportance: 9 },
    'ethics-compliance': { businessImpact: 10, stakeholderImportance: 10 },
    'sustainable-finance': { businessImpact: 8, stakeholderImportance: 8 }
  }
};

export function MaterialityMatrix({
  organizationId,
  industryType = 'general',
  onTopicSelect
}: MaterialityMatrixProps) {
  const [topics, setTopics] = useState<MaterialTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<MaterialTopic | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'matrix' | 'list' | 'bubble'>('matrix');
  const [showThreshold, setShowThreshold] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [draggedTopic, setDraggedTopic] = useState<MaterialTopic | null>(null);
  const matrixRef = useRef<HTMLDivElement>(null);

  // Initialize topics based on industry
  useEffect(() => {
    initializeTopics();
  }, [industryType]);

  const initializeTopics = () => {
    const allTopics = [
      ...DEFAULT_TOPICS.environmental,
      ...DEFAULT_TOPICS.social,
      ...DEFAULT_TOPICS.governance,
      ...DEFAULT_TOPICS.economic
    ];

    // Apply industry-specific adjustments
    const adjustedTopics = allTopics.map(topic => {
      const adjustment = INDUSTRY_ADJUSTMENTS[industryType]?.[topic.id];
      return adjustment ? { ...topic, ...adjustment } : topic;
    });

    setTopics(adjustedTopics);
  };

  // Categorize topics by materiality quadrant
  const topicQuadrants = useMemo(() => {
    const threshold = 5; // Mid-point threshold

    return {
      critical: topics.filter(t =>
        t.businessImpact >= threshold && t.stakeholderImportance >= threshold
      ),
      businessPriority: topics.filter(t =>
        t.businessImpact >= threshold && t.stakeholderImportance < threshold
      ),
      stakeholderPriority: topics.filter(t =>
        t.businessImpact < threshold && t.stakeholderImportance >= threshold
      ),
      monitor: topics.filter(t =>
        t.businessImpact < threshold && t.stakeholderImportance < threshold
      )
    };
  }, [topics]);

  // Handle topic dragging (for editing positions)
  const handleTopicDrag = (topic: MaterialTopic, newX: number, newY: number) => {
    if (!editMode || !matrixRef.current) return;

    const rect = matrixRef.current.getBoundingClientRect();
    const relativeX = (newX - rect.left) / rect.width;
    const relativeY = 1 - (newY - rect.top) / rect.height;

    const newBusinessImpact = Math.round(relativeX * 10);
    const newStakeholderImportance = Math.round(relativeY * 10);

    setTopics(prev => prev.map(t =>
      t.id === topic.id
        ? {
            ...t,
            businessImpact: Math.max(1, Math.min(10, newBusinessImpact)),
            stakeholderImportance: Math.max(1, Math.min(10, newStakeholderImportance))
          }
        : t
    ));
  };

  // Filter topics
  const filteredTopics = useMemo(() => {
    if (filter === 'all') return topics;
    return topics.filter(t => t.category === filter);
  }, [topics, filter]);

  // Category colors
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'environmental': return 'bg-green-500';
      case 'social': return 'bg-blue-500';
      case 'governance': return 'bg-purple-500';
      case 'economic': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  // Render matrix visualization
  const renderMatrix = () => (
    <div className="relative w-full aspect-square bg-gray-50 dark:bg-gray-800 rounded-lg p-8" ref={matrixRef}>
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
        {/* Quadrant lines */}
        <line
          x1="50%" y1="0" x2="50%" y2="100%"
          stroke="currentColor" strokeWidth="2" strokeDasharray="5,5"
          className="text-gray-300 dark:text-gray-600"
        />
        <line
          x1="0" y1="50%" x2="100%" y2="50%"
          stroke="currentColor" strokeWidth="2" strokeDasharray="5,5"
          className="text-gray-300 dark:text-gray-600"
        />

        {/* Minor grid lines */}
        {[20, 40, 60, 80].map(percent => (
          <React.Fragment key={percent}>
            <line
              x1={`${percent}%`} y1="0" x2={`${percent}%`} y2="100%"
              stroke="currentColor" strokeWidth="1" strokeOpacity="0.2"
              className="text-gray-300 dark:text-gray-600"
            />
            <line
              x1="0" y1={`${percent}%`} x2="100%" y2={`${percent}%`}
              stroke="currentColor" strokeWidth="1" strokeOpacity="0.2"
              className="text-gray-300 dark:text-gray-600"
            />
          </React.Fragment>
        ))}
      </svg>

      {/* Axis labels */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-6 text-sm font-medium text-gray-700 dark:text-gray-300">
        Business Impact →
      </div>
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-6 -rotate-90 text-sm font-medium text-gray-700 dark:text-gray-300">
        Stakeholder Importance →
      </div>

      {/* Quadrant labels */}
      <div className="absolute top-2 right-2 text-xs text-gray-500 dark:text-gray-400 font-semibold">
        CRITICAL
      </div>
      <div className="absolute top-2 left-2 text-xs text-gray-500 dark:text-gray-400">
        Stakeholder Priority
      </div>
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400">
        Business Priority
      </div>
      <div className="absolute bottom-2 left-2 text-xs text-gray-500 dark:text-gray-400">
        Monitor
      </div>

      {/* Topics */}
      {filteredTopics.map(topic => {
        const x = (topic.businessImpact / 10) * 100;
        const y = 100 - (topic.stakeholderImportance / 10) * 100;

        return (
          <motion.div
            key={topic.id}
            className={`absolute w-10 h-10 rounded-full flex items-center justify-center cursor-pointer
                      ${topic.color || getCategoryColor(topic.category)} text-white
                      hover:ring-4 hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-offset-gray-800
                      hover:ring-current transition-all duration-200`}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: selectedTopic?.id === topic.id ? 20 : 10
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            drag={editMode}
            dragMomentum={false}
            dragElastic={0}
            onDrag={(e, info) => {
              handleTopicDrag(topic, info.point.x, info.point.y);
            }}
            onClick={() => {
              setSelectedTopic(topic);
              onTopicSelect?.(topic);
            }}
          >
            {topic.icon || <CircleDot className="w-5 h-5" />}
          </motion.div>
        );
      })}
    </div>
  );

  // Render bubble chart visualization
  const renderBubbleChart = () => {
    const maxImpact = Math.max(...topics.map(t => t.businessImpact + t.stakeholderImportance));

    return (
      <div className="relative w-full h-[600px] bg-gray-50 dark:bg-gray-800 rounded-lg p-8 overflow-hidden">
        {filteredTopics.map((topic, index) => {
          const size = ((topic.businessImpact + topic.stakeholderImportance) / 20) * 150 + 50;
          const x = (index % 5) * 20 + Math.random() * 10;
          const y = Math.floor(index / 5) * 25 + Math.random() * 10;

          return (
            <motion.div
              key={topic.id}
              className={`absolute rounded-full flex flex-col items-center justify-center cursor-pointer
                        ${topic.color || getCategoryColor(topic.category)} text-white
                        hover:ring-4 hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-offset-gray-800
                        hover:ring-current transition-all duration-200`}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${x}%`,
                top: `${y}%`,
                opacity: 0.8
              }}
              whileHover={{ scale: 1.1, opacity: 1 }}
              onClick={() => {
                setSelectedTopic(topic);
                onTopicSelect?.(topic);
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="text-center">
                {topic.icon || <CircleDot className="w-6 h-6 mx-auto mb-1" />}
                <div className="text-xs font-medium px-2">{topic.name}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  // Render list view
  const renderList = () => (
    <div className="space-y-2">
      {filteredTopics
        .sort((a, b) => (b.businessImpact + b.stakeholderImportance) - (a.businessImpact + a.stakeholderImportance))
        .map(topic => (
          <motion.div
            key={topic.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4
                     hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => {
              setSelectedTopic(topic);
              onTopicSelect?.(topic);
            }}
            whileHover={{ x: 4 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center
                              ${topic.color || getCategoryColor(topic.category)} text-white`}>
                  {topic.icon || <CircleDot className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{topic.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{topic.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Business</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {topic.businessImpact}/10
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Stakeholder</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {topic.stakeholderImportance}/10
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {topic.trend === 'increasing' && <TrendingUp className="w-4 h-4 text-green-500" />}
                  {topic.trend === 'decreasing' && <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />}
                  {topic.trend === 'stable' && <div className="w-4 h-4 bg-gray-400 rounded-full" />}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500
                          flex items-center justify-center">
              <Grid3x3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Materiality Matrix</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Identify and prioritize material ESG topics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1 rounded text-sm transition-all
                          ${viewMode === 'matrix'
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
              >
                Matrix
              </button>
              <button
                onClick={() => setViewMode('bubble')}
                className={`px-3 py-1 rounded text-sm transition-all
                          ${viewMode === 'bubble'
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
              >
                Bubble
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded text-sm transition-all
                          ${viewMode === 'list'
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
              >
                List
              </button>
            </div>

            {/* Actions */}
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2
                        ${editMode
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
            >
              {editMode ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              {editMode ? 'Save' : 'Edit'}
            </button>

            <button className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                             text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all
                             flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <div className="flex gap-2">
            {['all', 'environmental', 'social', 'governance', 'economic'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1 rounded-lg text-sm transition-all
                          ${filter === cat
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Visualization */}
      <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
        {viewMode === 'matrix' && renderMatrix()}
        {viewMode === 'bubble' && renderBubbleChart()}
        {viewMode === 'list' && renderList()}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Critical Topics</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {topicQuadrants.critical.length}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            High priority for action
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Business Priority</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {topicQuadrants.businessPriority.length}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Focus on risk mitigation
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Stakeholder Priority</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {topicQuadrants.stakeholderPriority.length}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Engagement needed
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Trending Up</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {topics.filter(t => t.trend === 'increasing').length}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Growing importance
          </p>
        </motion.div>
      </div>

      {/* Selected Topic Detail */}
      <AnimatePresence>
        {selectedTopic && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center
                              ${selectedTopic.color || getCategoryColor(selectedTopic.category)} text-white`}>
                  {selectedTopic.icon || <CircleDot className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedTopic.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedTopic.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTopic(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Business Impact</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                      style={{ width: `${selectedTopic.businessImpact * 10}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedTopic.businessImpact}/10
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Stakeholder Importance</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                      style={{ width: `${selectedTopic.stakeholderImportance * 10}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedTopic.stakeholderImportance}/10
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Trend</p>
                <div className="flex items-center gap-2">
                  {selectedTopic.trend === 'increasing' && (
                    <>
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-500">Increasing</span>
                    </>
                  )}
                  {selectedTopic.trend === 'stable' && (
                    <>
                      <div className="w-4 h-4 bg-gray-400 rounded-full" />
                      <span className="text-sm text-gray-500">Stable</span>
                    </>
                  )}
                  {selectedTopic.trend === 'decreasing' && (
                    <>
                      <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
                      <span className="text-sm text-red-500">Decreasing</span>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Standards</p>
                <div className="flex gap-2">
                  {selectedTopic.gri && (
                    <span className="px-2 py-1 rounded text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                      GRI
                    </span>
                  )}
                  {selectedTopic.sasb && (
                    <span className="px-2 py-1 rounded text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                      SASB
                    </span>
                  )}
                  {selectedTopic.tcfd && (
                    <span className="px-2 py-1 rounded text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400">
                      TCFD
                    </span>
                  )}
                </div>
              </div>
            </div>

            {selectedTopic.gri && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">GRI Disclosures</p>
                <div className="flex flex-wrap gap-1">
                  {selectedTopic.gri.map(disclosure => (
                    <span key={disclosure} className="text-xs text-gray-700 dark:text-gray-300">
                      {disclosure}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}