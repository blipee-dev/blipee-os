'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Share2, Copy, Check, Eye, Clock, Lock, Globe, X, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Share {
  id: string;
  conversation_id: string;
  shared_by_user_id: string;
  share_token: string;
  is_public: boolean;
  allowed_user_ids?: string[];
  allowed_organization_ids?: string[];
  share_title?: string;
  share_description?: string;
  view_count: number;
  expires_at?: string;
  created_at: string;
  last_accessed_at?: string;
}

interface ConversationShareProps {
  conversationId: string;
  className?: string;
}

export function ConversationShare({ conversationId, className }: ConversationShareProps) {
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Form state
  const [isPublic, setIsPublic] = useState(false);
  const [shareTitle, setShareTitle] = useState('');
  const [shareDescription, setShareDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const supabase = createClient();

  useEffect(() => {
    loadShares();
  }, [conversationId]);

  const loadShares = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chat/shares?conversation_id=${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setShares(data);
      }
    } catch (error) {
      console.error('Error loading shares:', error);
    } finally {
      setLoading(false);
    }
  };

  const createShare = async () => {
    try {
      setCreating(true);

      const response = await fetch('/api/chat/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          is_public: isPublic,
          share_title: shareTitle || undefined,
          share_description: shareDescription || undefined,
          expires_at: expiresAt || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create share');
      }

      const share = await response.json();
      setShares(prev => [share, ...prev]);
      setShowForm(false);

      // Reset form
      setIsPublic(false);
      setShareTitle('');
      setShareDescription('');
      setExpiresAt('');
    } catch (error) {
      console.error('Create share error:', error);
      alert('Failed to create share');
    } finally {
      setCreating(false);
    }
  };

  const deleteShare = async (shareId: string) => {
    try {
      const response = await fetch(`/api/chat/shares?id=${shareId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShares(prev => prev.filter(s => s.id !== shareId));
      }
    } catch (error) {
      console.error('Delete share error:', error);
      alert('Failed to delete share');
    }
  };

  const copyShareLink = (shareToken: string) => {
    const shareUrl = `${window.location.origin}/shared/${shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedToken(shareToken);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Share2 className="w-5 h-5" />
          Share Conversation
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Create Share Link
          </button>
        )}
      </div>

      {/* Create Share Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title (optional)
            </label>
            <input
              type="text"
              value={shareTitle}
              onChange={(e) => setShareTitle(e.target.value)}
              placeholder="Share title"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={shareDescription}
              onChange={(e) => setShareDescription(e.target.value)}
              placeholder="Share description"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Make this share public (anyone with link can view)
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Expiration (optional)
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={createShare}
              disabled={creating}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Share'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Shares List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Loading shares...
        </div>
      ) : shares.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Share2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No shares created yet
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shares.map((share) => {
            const isExpired = share.expires_at && new Date(share.expires_at) < new Date();

            return (
              <div
                key={share.id}
                className={cn(
                  'bg-white dark:bg-gray-800 border rounded-lg p-4 space-y-3',
                  isExpired
                    ? 'border-gray-300 dark:border-gray-600 opacity-60'
                    : 'border-gray-200 dark:border-gray-700'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {share.share_title && (
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        {share.share_title}
                      </h4>
                    )}
                    {share.share_description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {share.share_description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded-full',
                        share.is_public
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      )}>
                        {share.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {share.is_public ? 'Public' : 'Private'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        <Eye className="w-3 h-3" />
                        {share.view_count} views
                      </span>
                      {share.expires_at && (
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2 py-1 rounded-full',
                          isExpired
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        )}>
                          <Calendar className="w-3 h-3" />
                          {isExpired ? 'Expired' : `Expires ${formatDate(share.expires_at)}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteShare(share.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete share"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {!isExpired && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/shared/${share.share_token}`}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400"
                    />
                    <button
                      onClick={() => copyShareLink(share.share_token)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      {copiedToken === share.share_token ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
