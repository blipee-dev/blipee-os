'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, Users, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

interface SurveyAnalyticsProps {
  survey: any;
  responses: any[];
}

export function SurveyAnalytics({ survey, responses }: SurveyAnalyticsProps) {
  // Calculate cumulative responses over time
  const cumulativeData = useMemo(() => {
    if (!responses || responses.length === 0) return [];

    const sorted = [...responses].sort(
      (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
    );

    const data: any[] = [];
    let cumulative = 0;

    sorted.forEach((response) => {
      cumulative++;
      const date = new Date(response.submitted_at);
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      const existing = data.find(d => d.month === monthLabel);
      if (existing) {
        existing.count = cumulative;
      } else {
        data.push({
          month: monthLabel,
          count: cumulative
        });
      }
    });

    return data;
  }, [responses]);

  // Analyze most popular answers (for commute mode, transport type, etc.)
  const popularityData = useMemo(() => {
    if (!responses || responses.length === 0) return [];

    // Find the question that represents "mode" or "type" (primary question)
    const modeQuestions = ['primary_commute_mode', 'transport_mode', 'travel_mode'];
    const modeAnswers: Record<string, number> = {};

    responses.forEach(response => {
      const answers = response.answers || {};

      // Find the primary mode question
      for (const questionId of modeQuestions) {
        if (answers[questionId]) {
          const value = answers[questionId];
          modeAnswers[value] = (modeAnswers[value] || 0) + 1;
          break;
        }
      }
    });

    // Convert to array and sort by count
    return Object.entries(modeAnswers)
      .map(([mode, count]) => ({
        mode: mode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count,
        percentage: ((count / responses.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);
  }, [responses]);

  const totalResponses = responses?.length || 0;
  const requiredResponses = 104; // From the screenshot
  const progressPercentage = Math.min((totalResponses / requiredResponses) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Responses</span>
            <Users className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {totalResponses}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            of {requiredResponses} needed
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Response Rate</span>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {progressPercentage.toFixed(0)}%
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
            {totalResponses >= requiredResponses ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-orange-500" />
            )}
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {totalResponses >= requiredResponses ? (
              <span className="text-green-600 dark:text-green-400">Complete</span>
            ) : (
              <span className="text-orange-600 dark:text-orange-400">In Progress</span>
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {totalResponses >= requiredResponses
              ? 'Minimum responses reached'
              : `${requiredResponses - totalResponses} more needed`}
          </div>
        </motion.div>
      </div>

      {/* Cumulative Responses Chart */}
      {cumulativeData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Cumulative Survey Responses
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', r: 5 }}
                name="Total Responses"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Popularity of Modes/Types */}
      {popularityData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Popularity of Transport Modes
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={popularityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="mode" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#9ca3af" label={{ value: '% of responses', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="percentage" fill="#8b5cf6" name="Percentage (%)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Response Details Table */}
      {popularityData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Mode Distribution
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Transport Mode
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Responses
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody>
                {popularityData.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="py-3 px-4 text-gray-900 dark:text-white">{item.mode}</td>
                    <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                      {item.count}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm rounded-full">
                        {item.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
