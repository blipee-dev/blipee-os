"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  Zap, 
  FileUp, 
  Target, 
  Check, 
  ChevronRight 
} from "lucide-react";

interface SetupStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed";
  action: string;
}

interface SetupChecklistProps {
  title: string;
  steps: SetupStep[];
  completedCount: number;
  totalCount: number;
  onAction?: (stepId: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  "add-building": <Building2 className="w-5 h-5" />,
  "connect-meters": <Zap className="w-5 h-5" />,
  "upload-bills": <FileUp className="w-5 h-5" />,
  "set-baseline": <Target className="w-5 h-5" />
};

export function SetupChecklist({ 
  title, 
  steps, 
  completedCount, 
  totalCount,
  onAction 
}: SetupChecklistProps) {
  const progress = (completedCount / totalCount) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 border border-white/[0.05]"
    >
      <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
      
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>{completedCount} of {totalCount} completed</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-white/[0.05] rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`
              flex items-center justify-between p-4 rounded-xl
              ${step.status === 'completed' 
                ? 'bg-green-500/[0.1] border border-green-500/[0.2]' 
                : 'bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05]'
              }
              transition-all cursor-pointer
            `}
            onClick={() => onAction?.(step.id)}
          >
            <div className="flex items-center space-x-4">
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center
                ${step.status === 'completed' 
                  ? 'bg-green-500/[0.2] text-green-400' 
                  : 'bg-white/[0.05] text-gray-400'
                }
              `}>
                {step.status === 'completed' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  iconMap[step.id] || <ChevronRight className="w-5 h-5" />
                )}
              </div>
              
              <div>
                <h4 className={`
                  font-medium
                  ${step.status === 'completed' ? 'text-green-400' : 'text-white'}
                `}>
                  {step.title}
                </h4>
                <p className="text-sm text-gray-400 mt-0.5">
                  {step.description}
                </p>
              </div>
            </div>

            <button
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${step.status === 'completed' 
                  ? 'bg-green-500/[0.2] text-green-400 cursor-default' 
                  : 'bg-purple-500/[0.2] text-purple-400 hover:bg-purple-500/[0.3]'
                }
              `}
              onClick={(e) => {
                e.stopPropagation();
                if (step.status !== 'completed') {
                  onAction?.(step.id);
                }
              }}
            >
              {step.status === 'completed' ? 'Completed' : step.action}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-500/[0.1] border border-blue-500/[0.2] rounded-lg">
        <p className="text-sm text-blue-400">
          💡 <span className="font-medium">Pro tip:</span> You can complete these steps in any order. 
          I&apos;ll help you through each one!
        </p>
      </div>
    </motion.div>
  );
}