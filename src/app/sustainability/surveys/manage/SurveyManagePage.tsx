'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  Plus,
  Send,
  Link2,
  Download,
  BarChart3,
  Users,
  Calendar,
  Globe,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit,
  Eye
} from 'lucide-react';
import { SustainabilityLayout } from '@/components/sustainability/SustainabilityLayout';
import { useOrganizationContext } from '@/hooks/useOrganizationContext';
import { SURVEY_TEMPLATES } from '@/lib/surveys/templates';

interface Survey {
  id: string;
  template_id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'closed';
  responses_count: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

export default function SurveyManagePage() {
  const { data: organizationData } = useOrganizationContext();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch surveys
  useEffect(() => {
    if (!organizationData) return;
    fetchSurveys();
  }, [organizationData]);

  async function fetchSurveys() {
    try {
      const response = await fetch(`/api/surveys/list?organization_id=${organizationData?.id}`);
      if (response.ok) {
        const data = await response.json();
        setSurveys(data.surveys || []);
      }
    } catch (error) {
      console.error('Failed to fetch surveys:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Generate survey link
  function getSurveyLink(surveyId: string): string {
    return `${window.location.origin}/s/${surveyId}`;
  }

  // Copy link to clipboard
  async function copySurveyLink(surveyId: string) {
    const link = getSurveyLink(surveyId);
    await navigator.clipboard.writeText(link);
    alert('Survey link copied to clipboard!');
  }

  // Export survey results
  async function exportSurveyResults(surveyId: string) {
    try {
      const response = await fetch(`/api/surveys/export/${surveyId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `survey-${surveyId}-results.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export survey:', error);
      alert('Failed to export survey results');
    }
  }

  const languages = [
    'English', 'French', 'Portuguese', 'German', 'Spanish',
    'Chinese', 'Swedish', 'Arabic', 'Finnish', 'Russian',
    'Italian', 'Turkish', 'Japanese', 'Korean', 'Urdu',
    'Greek', 'Hebrew'
  ];

  if (isLoading) {
    return (
      <SustainabilityLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
        </div>
      </SustainabilityLayout>
    );
  }

  return (
    <SustainabilityLayout>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <ClipboardList className="w-8 h-8 text-purple-500" />
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Survey Management
                  </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Create, manage, and analyze data collection surveys
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:opacity-90 transition-opacity"
              >
                <Plus className="w-5 h-5" />
                Create Survey
              </button>
            </div>
          </div>
        </motion.div>

        {/* Survey Templates */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Object.entries(SURVEY_TEMPLATES).map(([key, template]) => {
            const templateSurveys = surveys.filter(s => s.template_id === template.id);
            const totalResponses = templateSurveys.reduce((sum, s) => sum + s.responses_count, 0);
            const activeSurveys = templateSurveys.filter(s => s.status === 'active').length;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {template.description}
                    </p>
                  </div>
                  {activeSurveys > 0 && (
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                      {activeSurveys} Active
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {totalResponses}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total Responses</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {templateSurveys.length}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Surveys Created</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {templateSurveys.slice(0, 3).map(survey => (
                    <div
                      key={survey.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                      onClick={() => setSelectedSurvey(survey)}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {survey.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {survey.responses_count} responses
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copySurveyLink(survey.id);
                          }}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          title="Copy Link"
                        >
                          <Link2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            exportSurveyResults(survey.id);
                          }}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          title="Export Results"
                        >
                          <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Language Support Info */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Multi-Language Support Available
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                Surveys can be automatically translated into {languages.length} languages to reach global teams.
              </p>
              <div className="flex flex-wrap gap-2">
                {languages.slice(0, 10).map(lang => (
                  <span
                    key={lang}
                    className="px-3 py-1 bg-white/50 dark:bg-gray-800/50 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                  >
                    {lang}
                  </span>
                ))}
                <span className="px-3 py-1 bg-white/50 dark:bg-gray-800/50 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                  +{languages.length - 10} more
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-lg transition-all">
            <Send className="w-5 h-5 text-purple-500" />
            <div className="text-left">
              <div className="font-semibold text-gray-900 dark:text-white">Email Survey</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Send to employees</div>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-lg transition-all">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <div className="text-left">
              <div className="font-semibold text-gray-900 dark:text-white">View Analytics</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Response insights</div>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-lg transition-all">
            <Download className="w-5 h-5 text-green-500" />
            <div className="text-left">
              <div className="font-semibold text-gray-900 dark:text-white">Export All Data</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Download Excel</div>
            </div>
          </button>
        </div>
      </div>
    </SustainabilityLayout>
  );
}
