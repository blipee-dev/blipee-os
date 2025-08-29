"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { } from "lucide-react";
import {
  OnboardingOrchestrator,
  ONBOARDING_STEPS,
  OnboardingStep,
} from "@/lib/onboarding/quick-setup";

interface ConversationalOnboardingProps {
  onComplete: (config: any) => void;
  userId: string;
}

export function ConversationalOnboarding({
  onComplete,
  userId,
}: ConversationalOnboardingProps) {
  const [orchestrator] = useState(() => new OnboardingOrchestrator());
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null);
  const [selectedValue, setSelectedValue] = useState<any>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const step = orchestrator.getCurrentStep(currentStepIndex);
    setCurrentStep(step);
    setSelectedValue(null);
  }, [currentStepIndex, orchestrator]);

  const handleNext = async () => {
    if (!currentStep || !selectedValue) return;

    setIsTransitioning(true);

    // Record response
    orchestrator.recordResponse(currentStep.id, selectedValue);

    // Brief pause for smooth transition
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Move to next step
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Complete onboarding
      const config = orchestrator.generateConfiguration();
      onComplete(config);
    }

    setIsTransitioning(false);
  };

  const progress = orchestrator.getProgress();
  const canProceed =
    selectedValue !== null || currentStep?.validation?.required === false;

  if (!currentStep) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-2xl mx-4"
      >
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">Quick Setup</span>
            <span className="text-sm text-white/60">
              <Clock className="inline w-4 h-4 mr-1" />~
              {Math.ceil(progress.estimatedRemaining / 60)} min remaining
            </span>
          </div>
          <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.05] p-8"
          >
            {/* AI Assistant indicator */}
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-sm text-white/60">Blipee AI Assistant</span>
            </div>

            {/* Question */}
            <h2 className="text-2xl font-semibold text-white mb-2">
              {currentStep.title}
            </h2>
            <p className="text-white/60 mb-8">{currentStep.description}</p>

            {/* Options */}
            <div className="space-y-3">
              {currentStep.type === "select" &&
                currentStep.options?.map((option) => (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedValue(option.value)}
                    className={`
                    w-full text-left p-4 rounded-xl transition-all duration-300
                    ${
                      selectedValue === option.value
                        ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/50"
                        : "bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.05] hover:border-white/[0.1]"
                    }
                    border
                  `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white/90">
                          {option.label}
                        </div>
                        {option.description && (
                          <div className="text-sm text-white/50 mt-1">
                            {option.description}
                          </div>
                        )}
                      </div>
                      {selectedValue === option.value && (
                        <CheckCircle className="w-5 h-5 text-purple-400" />
                      )}
                    </div>
                  </motion.button>
                ))}

              {currentStep.type === "multiselect" &&
                currentStep.options?.map((option) => {
                  const isSelected = selectedValue?.includes(option.value);
                  return (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const current = selectedValue || [];
                        if (isSelected) {
                          setSelectedValue(
                            current.filter((v: string) => v !== option.value),
                          );
                        } else {
                          setSelectedValue([...current, option.value]);
                        }
                      }}
                      className={`
                      w-full text-left p-4 rounded-xl transition-all duration-300
                      ${
                        isSelected
                          ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/50"
                          : "bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.05] hover:border-white/[0.1]"
                      }
                      border
                    `}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white/90">
                            {option.label}
                          </div>
                          {option.description && (
                            <div className="text-sm text-white/50 mt-1">
                              {option.description}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-purple-400" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
            </div>

            {/* Continue button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              disabled={!canProceed || isTransitioning}
              className={`
                w-full mt-8 p-4 rounded-xl font-medium transition-all duration-300
                flex items-center justify-center gap-2
                ${
                  canProceed
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-[0_8px_32px_rgba(139,92,246,0.3)]"
                    : "bg-white/[0.05] text-white/30 cursor-not-allowed"
                }
              `}
            >
              {isTransitioning ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </motion.button>

            {/* Step counter */}
            <div className="text-center mt-4 text-sm text-white/40">
              Step {currentStepIndex + 1} of {ONBOARDING_STEPS.length}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
