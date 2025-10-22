'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  Users,
  Truck,
  Plane,
  Car,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { SustainabilityLayout } from '@/components/sustainability/SustainabilityLayout';
import { SurveyForm } from '@/components/surveys/SurveyForm';
import { SURVEY_TEMPLATES } from '@/lib/surveys/templates';
import type { SurveyTemplate } from '@/lib/surveys/templates';
import { useOrganizationContext } from '@/hooks/useOrganizationContext';

export default function SurveysPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<SurveyTemplate | null>(null);
  const { data: organizationData } = useOrganizationContext();

  const surveys = [
    {
      template: SURVEY_TEMPLATES.commute,
      icon: Users,
      color: 'from-green-500 to-emerald-500',
      description: 'Help us understand your commute patterns to calculate Scope 3.7 emissions',
      estimatedTime: '3-5 minutes'
    },
    {
      template: SURVEY_TEMPLATES.logistics,
      icon: Truck,
      color: 'from-orange-500 to-red-500',
      description: 'Provide shipment data for upstream and downstream transportation emissions',
      estimatedTime: '5-7 minutes'
    },
    {
      template: SURVEY_TEMPLATES.business_travel,
      icon: Plane,
      color: 'from-blue-500 to-indigo-500',
      description: 'Report your business travel for Scope 3.6 emissions tracking',
      estimatedTime: '2-4 minutes'
    }
  ];

  async function handleSurveySubmit(answers: Record<string, any>, metadata?: any) {
    if (!organizationData || !selectedTemplate) return;

    const response = await fetch('/api/surveys/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        template_id: selectedTemplate.id,
        organization_id: organizationData.id,
        site_id: organizationData.site?.id,
        answers,
        metadata
      })
    });

    if (!response.ok) {
      throw new Error('Failed to submit survey');
    }

    return response.json();
  }

  if (selectedTemplate) {
    return (
      <SustainabilityLayout>
        <div className="p-4 sm:p-6 min-h-screen">
          <SurveyForm
            template={selectedTemplate}
            onSubmit={handleSurveySubmit}
            onCancel={() => setSelectedTemplate(null)}
          />
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
            <div className="flex items-center gap-3 mb-3">
              <ClipboardList className="w-8 h-8 text-purple-500" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Data Collection Surveys
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Help us track our sustainability metrics by filling out these quick surveys.
              Your responses are automatically converted into emission metrics for our reporting.
            </p>
          </div>
        </motion.div>

        {/* Survey Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey, idx) => {
            const Icon = survey.icon;
            return (
              <motion.div
                key={survey.template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedTemplate(survey.template)}
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${survey.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {survey.template.name}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {survey.description}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    ⏱ {survey.estimatedTime}
                  </span>
                  <button className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold hover:gap-3 transition-all">
                    Start Survey
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                How It Works
              </h3>
              <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                <li className="flex items-start gap-2">
                  <span className="font-semibold mt-0.5">1.</span>
                  <span>Select a survey and answer the questions (takes just a few minutes)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold mt-0.5">2.</span>
                  <span>Your responses are automatically processed and converted into emission metrics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold mt-0.5">3.</span>
                  <span>Data appears instantly in your dashboards (Fleet, Commute, Logistics, Business Travel)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold mt-0.5">4.</span>
                  <span>All calculations follow GHG Protocol standards and use standard emission factors</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SustainabilityLayout>
  );
}
