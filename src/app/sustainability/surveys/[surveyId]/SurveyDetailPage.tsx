'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Link2,
  Send,
  Download,
  Globe,
  MoreVertical,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { SustainabilityLayout } from '@/components/sustainability/SustainabilityLayout';
import { SurveyAnalytics } from '@/components/surveys/SurveyAnalytics';

interface SurveyDetailPageProps {
  survey: any;
  responses: any[];
}

export default function SurveyDetailPage({ survey, responses }: SurveyDetailPageProps) {
  const router = useRouter();
  const [showLanguages, setShowLanguages] = useState(false);

  const surveyLink = `${window.location.origin}/s/${survey.id}`;

  async function copySurveyLink() {
    await navigator.clipboard.writeText(surveyLink);
    alert('Survey link copied to clipboard!');
  }

  async function exportResults() {
    try {
      const response = await fetch(`/api/surveys/export/${survey.id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `survey-${survey.id}-results.csv`;
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

  return (
    <SustainabilityLayout>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Surveys
            </button>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {survey.title}
                  </h1>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      survey.status === 'active'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : survey.status === 'closed'
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                    }`}
                  >
                    {survey.status}
                  </span>
                </div>
                {survey.description && (
                  <p className="text-gray-600 dark:text-gray-400">{survey.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowLanguages(!showLanguages)}
                  className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Languages"
                >
                  <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={copySurveyLink}
                  className="flex items-center gap-2 px-4 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <Link2 className="w-5 h-5" />
                  Copy Link
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-3 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-xl hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                >
                  <Send className="w-5 h-5" />
                  Email Survey
                </button>
                <button
                  onClick={exportResults}
                  className="flex items-center gap-2 px-4 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Export Results
                </button>
              </div>
            </div>

            {/* Language dropdown */}
            {showLanguages && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Available Languages
                </h4>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      className="px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Survey Link */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Survey Link
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300 font-mono">
                {surveyLink}
              </div>
            </div>
            <button
              onClick={copySurveyLink}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Analytics */}
        <SurveyAnalytics survey={survey} responses={responses} />

        {/* Recent Responses */}
        {responses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Responses
            </h3>
            <div className="space-y-2">
              {responses.slice(0, 10).map((response) => (
                <div
                  key={response.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {response.respondent_name || response.respondent_email || 'Anonymous'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(response.submitted_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    response.processed
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                  }`}>
                    {response.processed ? 'Processed' : 'Processing'}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </SustainabilityLayout>
  );
}
