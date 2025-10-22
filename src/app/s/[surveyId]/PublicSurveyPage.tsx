'use client';

import React from 'react';
import { SurveyForm } from '@/components/surveys/SurveyForm';
import { SURVEY_TEMPLATES } from '@/lib/surveys/templates';

interface PublicSurveyPageProps {
  survey: any;
}

export default function PublicSurveyPage({ survey }: PublicSurveyPageProps) {
  // Get the template for this survey
  const template = Object.values(SURVEY_TEMPLATES).find(t => t.id === survey.template_id);

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Survey Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            The survey template could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  async function handleSurveySubmit(answers: Record<string, any>, metadata?: any) {
    const response = await fetch('/api/surveys/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        survey_id: survey.id,
        template_id: template.id,
        organization_id: survey.organization_id,
        site_id: survey.site_id,
        answers,
        metadata
      })
    });

    if (!response.ok) {
      throw new Error('Failed to submit survey');
    }

    return response.json();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        {/* Organization branding */}
        <div className="text-center mb-8">
          <h2 className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            {survey.organization?.name || 'Organization'}
          </h2>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {survey.title}
          </h1>
          {survey.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {survey.description}
            </p>
          )}
        </div>

        <SurveyForm template={template} surveyId={survey.id} onSubmit={handleSurveySubmit} />
      </div>
    </div>
  );
}
