'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Send
} from 'lucide-react';
import type { SurveyTemplate, SurveyQuestion } from '@/lib/surveys/templates';

interface SurveyFormProps {
  template: SurveyTemplate;
  surveyId?: string;
  onSubmit: (answers: Record<string, any>, metadata?: any) => Promise<void>;
  onCancel?: () => void;
}

// Unit conversion constants
const UNIT_CONVERSIONS = {
  'miles_to_km': 1.60934,
  'km_to_miles': 0.621371,
  'lbs_to_kg': 0.453592,
  'kg_to_lbs': 2.20462
};

function convertUnit(value: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return value;

  const conversionKey = `${fromUnit}_to_${toUnit}`;
  const factor = UNIT_CONVERSIONS[conversionKey as keyof typeof UNIT_CONVERSIONS];

  return factor ? value * factor : value;
}

export function SurveyForm({ template, surveyId, onSubmit, onCancel }: SurveyFormProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Initialize selectedUnits with default units from questions
  const [selectedUnits, setSelectedUnits] = useState<Record<string, string>>(() => {
    const defaultUnits: Record<string, string> = {};
    template.questions.forEach(q => {
      if (q.unitOptions) {
        defaultUnits[q.id] = q.unitOptions.defaultUnit;
      }
    });
    return defaultUnits;
  });

  // Group questions into pages (5 questions per page)
  const questionsPerPage = 5;
  const pages = useMemo(() => {
    const filtered = template.questions.filter(q => shouldShowQuestion(q, answers));
    const chunks: SurveyQuestion[][] = [];
    for (let i = 0; i < filtered.length; i += questionsPerPage) {
      chunks.push(filtered.slice(i, i + questionsPerPage));
    }
    return chunks.length > 0 ? chunks : [[]]
  }, [template.questions, answers]);

  const currentQuestions = pages[currentPage] || [];
  const totalPages = pages.length;
  const isLastPage = currentPage === totalPages - 1;

  // Check if a question should be shown based on conditional logic
  function shouldShowQuestion(question: SurveyQuestion, currentAnswers: Record<string, any>): boolean {
    if (!question.conditional) return true;

    const { questionId, showIf } = question.conditional;
    const answer = currentAnswers[questionId];

    if (!answer) return false;

    if (Array.isArray(showIf)) {
      return showIf.includes(answer);
    }
    return answer === showIf;
  }

  // Validate current page
  function validateCurrentPage(): boolean {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    currentQuestions.forEach(question => {
      if (question.required && !answers[question.id]) {
        newErrors[question.id] = 'This field is required';
        isValid = false;
      }

      if (answers[question.id] && question.validation) {
        const value = answers[question.id];
        const { min, max, pattern } = question.validation;

        if (question.type === 'number') {
          const num = parseFloat(value);
          if (min !== undefined && num < min) {
            newErrors[question.id] = `Minimum value is ${min}`;
            isValid = false;
          }
          if (max !== undefined && num > max) {
            newErrors[question.id] = `Maximum value is ${max}`;
            isValid = false;
          }
        }

        if (pattern && !new RegExp(pattern).test(value)) {
          newErrors[question.id] = 'Invalid format';
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }

  // Handle answer change with unit conversion
  function handleAnswerChange(questionId: string, value: any, convertToStorage = false) {
    const question = template.questions.find(q => q.id === questionId);

    // If question has unitOptions and value is a number, convert to storage unit
    if (convertToStorage && question?.unitOptions && typeof value === 'number') {
      const currentUnit = selectedUnits[questionId] || question.unitOptions.defaultUnit;
      const storageUnit = question.unitOptions.storageUnit;
      const convertedValue = convertUnit(value, currentUnit, storageUnit);
      setAnswers(prev => ({ ...prev, [questionId]: convertedValue }));
    } else {
      setAnswers(prev => ({ ...prev, [questionId]: value }));
    }

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[questionId];
      return newErrors;
    });
  }

  // Handle unit change
  function handleUnitChange(questionId: string, newUnit: string) {
    const question = template.questions.find(q => q.id === questionId);
    if (!question?.unitOptions) return;

    const currentValue = answers[questionId];
    if (currentValue && typeof currentValue === 'number') {
      // Convert from storage unit back to display unit
      const storageUnit = question.unitOptions.storageUnit;
      const displayValue = convertUnit(currentValue, storageUnit, newUnit);

      // Update both the display unit and re-store in storage unit
      setSelectedUnits(prev => ({ ...prev, [questionId]: newUnit }));
      // The answer in state should remain in storage unit format
    } else {
      setSelectedUnits(prev => ({ ...prev, [questionId]: newUnit }));
    }
  }

  // Navigate pages
  function handleNext() {
    if (validateCurrentPage()) {
      setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
    }
  }

  function handlePrevious() {
    setCurrentPage(prev => Math.max(prev - 1, 0));
  }

  // Submit survey
  async function handleSubmit() {
    if (!validateCurrentPage()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(answers, {
        template_id: template.id,
        completed_at: new Date().toISOString()
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit survey:', error);
      setErrors({ submit: 'Failed to submit survey. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Render question input based on type
  function renderQuestionInput(question: SurveyQuestion) {
    const value = answers[question.id] || '';
    const error = errors[question.id];

    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'
            } dark:bg-gray-800 dark:text-white focus:ring-2 focus:outline-none`}
            placeholder="Your answer"
          />
        );

      case 'number':
        // If question has unit options, show unit selector
        if (question.unitOptions) {
          const currentUnit = selectedUnits[question.id] || question.unitOptions.defaultUnit;
          const storageUnit = question.unitOptions.storageUnit;

          // Convert stored value to display value
          const storedValue = value;
          const displayValue = storedValue && typeof storedValue === 'number'
            ? convertUnit(storedValue, storageUnit, currentUnit)
            : '';

          return (
            <div className="flex gap-2">
              <input
                type="number"
                value={displayValue}
                onChange={(e) => {
                  const inputValue = parseFloat(e.target.value);
                  if (!isNaN(inputValue)) {
                    handleAnswerChange(question.id, inputValue, true);
                  } else {
                    handleAnswerChange(question.id, '');
                  }
                }}
                className={`flex-1 px-4 py-3 rounded-lg border ${
                  error
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'
                } dark:bg-gray-800 dark:text-white focus:ring-2 focus:outline-none`}
                placeholder="Enter a number"
                min={question.validation?.min}
                max={question.validation?.max}
                step="0.01"
              />
              <select
                value={currentUnit}
                onChange={(e) => handleUnitChange(question.id, e.target.value)}
                className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none min-w-[100px]"
              >
                {question.unitOptions.units.map(unit => (
                  <option key={unit} value={unit}>
                    {unit === 'km' ? 'Kilometers' :
                     unit === 'miles' ? 'Miles' :
                     unit === 'kg' ? 'Kilograms' :
                     unit === 'lbs' ? 'Pounds' : unit}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        // Standard number input without units
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleAnswerChange(question.id, parseFloat(e.target.value) || '')}
            className={`w-full px-4 py-3 rounded-lg border ${
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'
            } dark:bg-gray-800 dark:text-white focus:ring-2 focus:outline-none`}
            placeholder="Enter a number"
            min={question.validation?.min}
            max={question.validation?.max}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'
            } dark:bg-gray-800 dark:text-white focus:ring-2 focus:outline-none`}
          >
            <option value="">Select an option</option>
            {question.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-3">
            {question.options?.map(option => (
              <label
                key={option.value}
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                  value === option.value
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-300'
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-gray-900 dark:text-white">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-3">
            {question.options?.map(option => (
              <label
                key={option.value}
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedValues.includes(option.value)
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter(v => v !== option.value);
                    handleAnswerChange(question.id, newValues);
                  }}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-gray-900 dark:text-white">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'
            } dark:bg-gray-800 dark:text-white focus:ring-2 focus:outline-none`}
          />
        );

      case 'scale':
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(num => (
              <button
                key={num}
                onClick={() => handleAnswerChange(question.id, num)}
                className={`flex-1 py-3 rounded-lg border-2 transition-all ${
                  value === num
                    ? 'border-purple-500 bg-purple-500 text-white'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-300'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        );

      default:
        return null;
    }
  }

  // Success state
  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto p-8 text-center"
      >
        <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-12">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Thank You!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Your response has been submitted successfully. This data will help us calculate our emissions and identify opportunities for improvement.
          </p>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:opacity-90 transition-opacity"
            >
              Close
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {template.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{template.description}</p>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progress</span>
            <span>{currentPage + 1} / {totalPages}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-8"
        >
          <div className="space-y-8">
            {currentQuestions.map((question, idx) => (
              <div key={question.id}>
                <label className="block mb-3">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-lg font-medium text-gray-900 dark:text-white">
                      {question.question}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </span>
                  </div>
                  {question.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {question.description}
                    </p>
                  )}
                  {renderQuestionInput(question)}
                  {errors[question.id] && (
                    <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {errors[question.id]}
                    </div>
                  )}
                </label>
              </div>
            ))}
          </div>

          {/* Error message */}
          {errors.submit && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              {errors.submit}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            {isLastPage ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:opacity-90 transition-all"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
