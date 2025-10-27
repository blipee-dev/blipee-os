'use client';

/**
 * Tool Confirmation Component
 *
 * Reusable component for human-in-the-loop tool approval.
 * Renders an approval UI for tools that require user confirmation before execution.
 */

import { useState } from 'react';
import { AlertCircle, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { getApprovalConfig } from '@/lib/ai/hitl/tool-config';

export interface ToolConfirmationProps {
  toolName: string;
  toolCallId: string;
  toolInput: any;
  onApprove: (toolCallId: string) => Promise<void>;
  onDeny: (toolCallId: string, reason?: string) => Promise<void>;
  requireReason?: boolean;
  showDetails?: boolean;
  className?: string;
}

export function ToolConfirmation({
  toolName,
  toolCallId,
  toolInput,
  onApprove,
  onDeny,
  requireReason = false,
  showDetails = true,
  className = ''
}: ToolConfirmationProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [denialReason, setDenialReason] = useState('');
  const [showDenialForm, setShowDenialForm] = useState(false);
  const [showInputDetails, setShowInputDetails] = useState(false);

  const config = getApprovalConfig(toolName);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(toolCallId);
    } catch (error) {
      console.error('Failed to approve tool:', error);
      setIsProcessing(false);
    }
  };

  const handleDeny = async () => {
    if (requireReason && !denialReason.trim()) {
      return; // Don't submit without reason if required
    }

    setIsProcessing(true);
    try {
      await onDeny(toolCallId, denialReason || undefined);
    } catch (error) {
      console.error('Failed to deny tool:', error);
      setIsProcessing(false);
    }
  };

  // Get severity color based on category
  const getCategoryColor = () => {
    switch (config?.category) {
      case 'critical':
        return 'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800';
      default:
        return 'border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800';
    }
  };

  const getIconColor = () => {
    switch (config?.category) {
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  return (
    <div
      className={`rounded-lg border-2 p-4 space-y-3 ${getCategoryColor()} ${className}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${getIconColor()}`} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            Approval Required: {config?.description || toolName}
          </h3>
          {config?.approvalMessage && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {config.approvalMessage}
            </p>
          )}
        </div>
      </div>

      {/* Tool Input Details (Collapsible) */}
      {showDetails && (
        <div className="space-y-2">
          <button
            onClick={() => setShowInputDetails(!showInputDetails)}
            className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            {showInputDetails ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            {showInputDetails ? 'Hide details' : 'Show details'}
          </button>

          {showInputDetails && (
            <div className="bg-white dark:bg-gray-900 rounded p-3 text-xs font-mono max-h-48 overflow-y-auto">
              <pre className="whitespace-pre-wrap break-all text-gray-700 dark:text-gray-300">
                {JSON.stringify(toolInput, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Denial Reason Form */}
      {showDenialForm && (
        <div className="space-y-2">
          <label
            htmlFor={`denial-reason-${toolCallId}`}
            className="block text-xs font-medium text-gray-700 dark:text-gray-300"
          >
            Reason for denial {requireReason && <span className="text-red-500">*</span>}
          </label>
          <textarea
            id={`denial-reason-${toolCallId}`}
            value={denialReason}
            onChange={(e) => setDenialReason(e.target.value)}
            placeholder="Provide a reason for denying this action..."
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            rows={3}
            disabled={isProcessing}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleApprove}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          <Check className="w-4 h-4" />
          {isProcessing ? 'Processing...' : 'Approve & Execute'}
        </button>

        {!showDenialForm ? (
          <button
            onClick={() => setShowDenialForm(true)}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:disabled:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            <X className="w-4 h-4" />
            Deny
          </button>
        ) : (
          <>
            <button
              onClick={handleDeny}
              disabled={isProcessing || (requireReason && !denialReason.trim())}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <X className="w-4 h-4" />
              Confirm Denial
            </button>
            <button
              onClick={() => {
                setShowDenialForm(false);
                setDenialReason('');
              }}
              disabled={isProcessing}
              className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {/* Level Badge */}
      {config && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Required approval level:
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            {config.approvalLevel}
          </span>
        </div>
      )}
    </div>
  );
}
