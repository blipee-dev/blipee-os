'use client';

import { useState } from 'react';
import { Brain } from 'lucide-react';
import { SustainabilityLayout } from '@/components/sustainability/SustainabilityLayout';
import { ConversationInterface } from '@/components/blipee-os/ConversationInterface';
import { useAccentGradient } from '@/providers/AppearanceProvider';

export default function AIAssistantPage() {
  const accentGradientConfig = useAccentGradient();
  const accentColorHex = accentGradientConfig.from;
  const accentGradient = accentGradientConfig.gradient;
  const [isAIOpen, setIsAIOpen] = useState(false);

  return (
    <SustainabilityLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-center h-[600px]">
          <div className="text-center space-y-4">
            <Brain className="w-16 h-16 mx-auto" style={{ color: accentColorHex }} />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">AI Assistant</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              Click the AI button in the bottom right to chat with your sustainability AI team
            </p>
            <button
              onClick={() => setIsAIOpen(true)}
              className={`px-6 py-3 bg-gradient-to-r ${accentGradient} rounded-xl hover:opacity-90 transition-opacity text-white`}
            >
              Open AI Assistant
            </button>
          </div>
        </div>

        {/* AI Assistant Interface */}
        {isAIOpen && <ConversationInterface />}
      </div>
    </SustainabilityLayout>
  );
}
