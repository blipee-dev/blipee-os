'use client';

import { useState, useEffect } from 'react';
import { Shield, Key, Phone, HelpCircle, Plus, Check, X } from 'lucide-react';
import { GlassCard } from '@/components/premium/GlassCard';
import { GradientButton } from '@/components/premium/GradientButton';

interface RecoveryOptions {
  emailEnabled: boolean;
  smsEnabled: boolean;
  securityQuestionsEnabled: boolean;
  backupCodesEnabled: boolean;
  hasPhoneNumber: boolean;
  securityQuestionsCount: number;
}

const COMMON_SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What was your mother's maiden name?",
  "What was the name of your first school?",
  "What is your favorite book?",
  "What was the make of your first car?",
  "What street did you grow up on?",
  "What is your favorite movie?",
  "What was your childhood nickname?",
  "What is the name of the hospital where you were born?",
];

export function RecoverySettings() {
  const [options, setOptions] = useState<RecoveryOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSecurityQuestions, setShowSecurityQuestions] = useState(false);
  const [securityQuestions, setSecurityQuestions] = useState<Array<{ question: string; answer: string }>>([
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRecoveryOptions();
  }, []);

  const fetchRecoveryOptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/recovery/security-questions');
      if (response.ok) {
        const data = await response.json();
        setOptions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch recovery options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSecurityQuestions = async () => {
    try {
      setSaving(true);
      
      // Validate questions and answers
      const validQuestions = securityQuestions.filter(q => q.question && q.answer);
      if (validQuestions.length < 3) {
        alert('Please provide at least 3 security questions and answers.');
        return;
      }

      const response = await fetch('/api/auth/recovery/security-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questions: validQuestions,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setShowSecurityQuestions(false);
        await fetchRecoveryOptions();
        alert('Security questions saved successfully!');
      } else {
        alert(resulterror.message || 'Failed to save security questions');
      }
    } catch (error) {
      console.error('Failed to save security questions:', error);
      alert('Failed to save security questions');
    } finally {
      setSaving(false);
    }
  };

  const addSecurityQuestion = () => {
    if (securityQuestions.length < 5) {
      setSecurityQuestions([...securityQuestions, { question: '', answer: '' }]);
    }
  };

  const removeSecurityQuestion = (index: number) => {
    if (securityQuestions.length > 3) {
      setSecurityQuestions(securityQuestions.filter((_, i) => i !== index));
    }
  };

  const updateSecurityQuestion = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...securityQuestions];
    updated[index][field] = value;
    setSecurityQuestions(updated);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Loading recovery settings...</p>
      </div>
    );
  }

  if (!options) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Failed to load recovery settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview */}
      <GlassCard>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Account Recovery Methods
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Set up multiple recovery methods to ensure you can always access your account.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email Recovery */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-blue-500" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Email Recovery</h4>
                </div>
                {options.emailEnabled && (
                  <Check className="h-5 w-5 text-green-500" />
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Receive recovery links via email
              </p>
              <div className={`text-sm font-medium ${
                options.emailEnabled 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {options.emailEnabled ? 'Enabled' : 'Not available'}
              </div>
            </div>

            {/* SMS Recovery */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-green-500" />
                  <h4 className="font-medium text-gray-900 dark:text-white">SMS Recovery</h4>
                </div>
                {options.smsEnabled && (
                  <Check className="h-5 w-5 text-green-500" />
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Receive recovery codes via SMS
              </p>
              <div className={`text-sm font-medium ${
                options.smsEnabled 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {options.hasPhoneNumber 
                  ? (options.smsEnabled ? 'Enabled' : 'Available') 
                  : 'Add phone number'}
              </div>
            </div>

            {/* Security Questions */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-purple-500" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Security Questions</h4>
                </div>
                {options.securityQuestionsEnabled && (
                  <Check className="h-5 w-5 text-green-500" />
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Answer personal questions to verify identity
              </p>
              <div className="flex items-center justify-between">
                <div className={`text-sm font-medium ${
                  options.securityQuestionsEnabled 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {options.securityQuestionsCount > 0 
                    ? `${options.securityQuestionsCount} questions set` 
                    : 'Not configured'}
                </div>
                <button
                  onClick={() => setShowSecurityQuestions(true)}
                  className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-1 rounded hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors"
                >
                  {options.securityQuestionsCount > 0 ? 'Update' : 'Setup'}
                </button>
              </div>
            </div>

            {/* Backup Codes */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-orange-500" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Backup Codes</h4>
                </div>
                {options.backupCodesEnabled && (
                  <Check className="h-5 w-5 text-green-500" />
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Use one-time codes as backup recovery method
              </p>
              <div className="flex items-center justify-between">
                <div className={`text-sm font-medium ${
                  options.backupCodesEnabled 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {options.backupCodesEnabled ? 'Generated' : 'Not generated'}
                </div>
                <button
                  className="text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-2 py-1 rounded hover:bg-orange-200 dark:hover:bg-orange-900/30 transition-colors"
                >
                  {options.backupCodesEnabled ? 'Regenerate' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Security Questions Setup Modal */}
      {showSecurityQuestions && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Setup Security Questions
                </h3>
                <button
                  onClick={() => setShowSecurityQuestions(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Choose at least 3 security questions and provide answers. 
                These will be used to verify your identity during account recovery.
              </p>

              <div className="space-y-6">
                {securityQuestions.map((qa, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Question {index + 1} {index < 3 && <span className="text-red-500">*</span>}
                      </label>
                      {index >= 3 && (
                        <button
                          onClick={() => removeSecurityQuestion(index)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <select
                      value={qa.question}
                      onChange={(e) => updateSecurityQuestion(index, 'question', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select a question...</option>
                      {COMMON_SECURITY_QUESTIONS.map((question, qIndex) => (
                        <option key={qIndex} value={question}>
                          {question}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Your answer..."
                      value={qa.answer}
                      onChange={(e) => updateSecurityQuestion(index, 'answer', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                ))}

                {securityQuestions.length < 5 && (
                  <button
                    onClick={addSecurityQuestion}
                    className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add another question
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 mt-8">
                <GradientButton
                  onClick={handleSaveSecurityQuestions}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? 'Saving...' : 'Save Security Questions'}
                </GradientButton>
                <button
                  onClick={() => setShowSecurityQuestions(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}