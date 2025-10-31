'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageVoteProps {
  messageId: string;
  className?: string;
  onVoteChange?: (voteType: 'up' | 'down' | null) => void;
}

export function MessageVote({ messageId, className, onVoteChange }: MessageVoteProps) {
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadVotes();
  }, [messageId]);

  const loadVotes = async () => {
    try {
      const response = await fetch(`/api/chat/votes?message_id=${messageId}`);
      if (response.ok) {
        const data = await response.json();
        setUpvotes(data.summary.upvotes);
        setDownvotes(data.summary.downvotes);
        setUserVote(data.summary.userVote);
      }
    } catch (error) {
      console.error('Error loading votes:', error);
    }
  };

  const submitVote = async (voteType: 'up' | 'down') => {
    try {
      setSubmitting(true);

      // If clicking the same vote, remove it
      if (userVote === voteType) {
        await fetch(`/api/chat/votes?message_id=${messageId}`, {
          method: 'DELETE',
        });

        setUserVote(null);
        if (voteType === 'up') {
          setUpvotes(prev => Math.max(0, prev - 1));
        } else {
          setDownvotes(prev => Math.max(0, prev - 1));
        }

        if (onVoteChange) {
          onVoteChange(null);
        }
        return;
      }

      const response = await fetch('/api/chat/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: messageId,
          vote_type: voteType,
          feedback_text: feedbackText || undefined,
          feedback_category: feedbackCategory || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit vote');
      }

      // Update local state
      const previousVote = userVote;
      setUserVote(voteType);

      if (previousVote === 'up') {
        setUpvotes(prev => Math.max(0, prev - 1));
      } else if (previousVote === 'down') {
        setDownvotes(prev => Math.max(0, prev - 1));
      }

      if (voteType === 'up') {
        setUpvotes(prev => prev + 1);
      } else {
        setDownvotes(prev => prev + 1);
      }

      if (onVoteChange) {
        onVoteChange(voteType);
      }

      // Show feedback form for downvotes
      if (voteType === 'down' && !previousVote) {
        setShowFeedback(true);
      } else {
        setShowFeedback(false);
        setFeedbackText('');
        setFeedbackCategory('');
      }
    } catch (error) {
      console.error('Vote submission error:', error);
      alert('Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  const submitFeedback = async () => {
    try {
      setSubmitting(true);

      await fetch('/api/chat/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: messageId,
          vote_type: 'down',
          feedback_text: feedbackText,
          feedback_category: feedbackCategory,
        }),
      });

      setShowFeedback(false);
      setFeedbackText('');
      setFeedbackCategory('');
    } catch (error) {
      console.error('Feedback submission error:', error);
      alert('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        {/* Upvote Button */}
        <button
          onClick={() => submitVote('up')}
          disabled={submitting}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium transition-colors',
            userVote === 'up'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
            submitting && 'opacity-50 cursor-not-allowed'
          )}
          title="This was helpful"
        >
          <ThumbsUp className={cn('w-4 h-4', userVote === 'up' && 'fill-current')} />
          {upvotes > 0 && <span>{upvotes}</span>}
        </button>

        {/* Downvote Button */}
        <button
          onClick={() => submitVote('down')}
          disabled={submitting}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium transition-colors',
            userVote === 'down'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
            submitting && 'opacity-50 cursor-not-allowed'
          )}
          title="This was not helpful"
        >
          <ThumbsDown className={cn('w-4 h-4', userVote === 'down' && 'fill-current')} />
          {downvotes > 0 && <span>{downvotes}</span>}
        </button>
      </div>

      {/* Feedback Form (shown after downvote) */}
      {showFeedback && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <MessageSquare className="w-4 h-4" />
            Help us improve
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              What went wrong?
            </label>
            <select
              value={feedbackCategory}
              onChange={(e) => setFeedbackCategory(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="">Select a category</option>
              <option value="inaccurate">Inaccurate information</option>
              <option value="unhelpful">Not helpful</option>
              <option value="unclear">Unclear or confusing</option>
              <option value="incomplete">Incomplete answer</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Additional feedback (optional)
            </label>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Tell us more..."
              rows={2}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={submitFeedback}
              disabled={submitting}
              className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
            <button
              onClick={() => {
                setShowFeedback(false);
                setFeedbackText('');
                setFeedbackCategory('');
              }}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
