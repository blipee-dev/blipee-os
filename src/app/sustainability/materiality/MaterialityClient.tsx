'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Grid3x3,
  Plus,
  Settings,
  Users,
  FileText,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Download,
  Upload,
  Share2
} from 'lucide-react';
import { SustainabilityLayout } from '@/components/sustainability/SustainabilityLayout';
import { MaterialityMatrix } from '@/components/sustainability/materiality/MaterialityMatrix';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import toast from 'react-hot-toast';

export default function MaterialityClient() {
  useAuthRedirect('/sustainability/materiality');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('assessment');
  const [organizationData, setOrganizationData] = useState<any>(null);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch organization data including industry
      const orgResponse = await fetch('/api/organization');
      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        setOrganizationData(orgData);
      }

      // Fetch existing materiality assessment
      const assessmentResponse = await fetch('/api/sustainability/materiality');
      if (assessmentResponse.ok) {
        const assessment = await assessmentResponse.json();
        setAssessmentData(assessment);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load materiality data');
    } finally {
      setLoading(false);
    }
  };

  const handleTopicSelect = (topic: any) => {
    console.log('Selected topic:', topic);
    // Could open a detail view or link to related metrics
  };

  const handleStartAssessment = () => {
    setShowWizard(true);
    // Would open a wizard to guide through stakeholder input collection
  };

  const handleExportMatrix = async () => {
    try {
      const response = await fetch('/api/sustainability/materiality/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'materiality-matrix.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success('Matrix exported successfully');
      }
    } catch (error) {
      toast.error('Failed to export matrix');
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    return (
      <>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Grid3x3 className="w-8 h-8 text-purple-500" />
              <span className="text-sm text-gray-500">Total Topics</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {assessmentData?.topics?.length || 24}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Across all categories
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <span className="text-sm text-gray-500">Critical</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {assessmentData?.criticalCount || 8}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              High priority topics
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-blue-500" />
              <span className="text-sm text-gray-500">Stakeholders</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {assessmentData?.stakeholderGroups || 5}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Groups engaged
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <span className="text-sm text-gray-500">Coverage</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {assessmentData?.coverage || 85}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              GRI topics covered
            </div>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Actions Bar */}
          <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleStartAssessment}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg
                           hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200
                           flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Assessment
                </button>

                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                                 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700
                                 transition-all duration-200 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Stakeholder Input
                </button>

                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                                 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700
                                 transition-all duration-200 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Configure
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportMatrix}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                           text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700
                           transition-all duration-200 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>

                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                                 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700
                                 transition-all duration-200 flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>
          </div>

          {/* Materiality Matrix Component */}
          <MaterialityMatrix
            organizationId={organizationData?.id || ''}
            industryType={organizationData?.industry || 'general'}
            onTopicSelect={handleTopicSelect}
          />

          {/* Additional Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Material Topics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top Material Topics
              </h3>
              <div className="space-y-3">
                {['GHG Emissions', 'Data Privacy', 'Employee Wellbeing', 'Ethics & Compliance', 'Energy Management'].map((topic, index) => (
                  <div key={topic} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium
                                    ${index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-500' : 'bg-yellow-500'}`}>
                        {index + 1}
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">{topic}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                          style={{ width: `${90 - index * 10}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {90 - index * 10}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Stakeholder Alignment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Stakeholder Alignment
              </h3>
              <div className="space-y-3">
                {[
                  { group: 'Investors', alignment: 85 },
                  { group: 'Employees', alignment: 78 },
                  { group: 'Customers', alignment: 82 },
                  { group: 'Communities', alignment: 70 },
                  { group: 'Regulators', alignment: 90 }
                ].map(stakeholder => (
                  <div key={stakeholder.group} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{stakeholder.group}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${stakeholder.alignment >= 80 ? 'bg-green-500' : stakeholder.alignment >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${stakeholder.alignment}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">
                        {stakeholder.alignment}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recommended Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <span className="text-red-500 font-bold">1</span>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Address Critical Topics</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Focus immediate attention on GHG emissions and data privacy as top priorities
                </p>
              </div>

              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <span className="text-yellow-600 font-bold">2</span>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Engage Stakeholders</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Improve alignment with communities and employees through targeted engagement
                </p>
              </div>

              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-600 font-bold">3</span>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Update Reporting</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Align sustainability reporting with identified material topics for GRI compliance
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </>
    );
  };

  return (
    <SustainabilityLayout selectedView={selectedView} onSelectView={setSelectedView}>
      {/* Header */}
      <header className="bg-white dark:bg-[#212121] border-b border-gray-200 dark:border-white/[0.05] p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Materiality Assessment
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Identify and prioritize material ESG topics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800
                           text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200
                           dark:hover:bg-gray-700 transition-all">
              <FileText className="w-4 h-4" />
              View Report
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-50 dark:bg-[#0a0a0a]">
        {renderContent()}
      </main>
    </SustainabilityLayout>
  );
}