/* eslint-disable react/no-unescaped-entities */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  acceptInvitation,
  rejectInvitation,
  addInitiativeComment,
  getInitiativeActivity,
} from '@/app/actions/initiative-participants'
import type { InitiativeParticipant } from '@/lib/types/initiatives'
import { Calendar, Target, DollarSign, Users, MessageSquare, CheckCircle, XCircle } from 'lucide-react'

interface InitiativePublicViewProps {
  initiative: any
  participant: InitiativeParticipant
  organization: { name: string }
  accessToken: string
  initialAction?: 'accept' | 'reject'
}

export function InitiativePublicView({
  initiative,
  participant,
  organization,
  accessToken,
  initialAction,
}: InitiativePublicViewProps) {
  const router = useRouter()
  const [invitationStatus, setInvitationStatus] = useState(participant.invitation_status)
  const [isProcessing, setIsProcessing] = useState(false)
  const [comment, setComment] = useState('')
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [activity, setActivity] = useState<any[]>([])
  const [loadingActivity, setLoadingActivity] = useState(true)

  // Load activity
  useEffect(() => {
    async function loadActivity() {
      const result = await getInitiativeActivity(initiative.id)
      if (result.data) {
        setActivity(result.data)
      }
      setLoadingActivity(false)
    }
    loadActivity()
  }, [initiative.id])

  // Handle initial action from URL
  useEffect(() => {
    if (initialAction && invitationStatus === 'pending') {
      if (initialAction === 'accept') {
        handleAccept()
      } else if (initialAction === 'reject') {
        handleReject()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAccept = async () => {
    setIsProcessing(true)
    const result = await acceptInvitation(accessToken)
    if (result.success) {
      setInvitationStatus('accepted')
      router.refresh()
    }
    setIsProcessing(false)
  }

  const handleReject = async () => {
    setIsProcessing(true)
    const result = await rejectInvitation(accessToken)
    if (result.success) {
      setInvitationStatus('rejected')
      router.refresh()
    }
    setIsProcessing(false)
  }

  const handleAddComment = async () => {
    if (!comment.trim()) return

    setIsAddingComment(true)
    const result = await addInitiativeComment(accessToken, comment.trim())

    if (result.success) {
      setComment('')
      // Reload activity
      const activityResult = await getInitiativeActivity(initiative.id)
      if (activityResult.data) {
        setActivity(activityResult.data)
      }
    }
    setIsAddingComment(false)
  }

  const roleLabel =
    participant.role === 'owner' ? 'Owner' : participant.role === 'member' ? 'Team Member' : 'Viewer'

  const statusColors = {
    planning: '#3b82f6',
    in_progress: '#10b981',
    on_hold: '#f59e0b',
    completed: '#6366f1',
    cancelled: '#ef4444',
  }

  const priorityColors = {
    low: '#6b7280',
    medium: '#f59e0b',
    high: '#ef4444',
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        padding: '20px',
      }}
    >
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px',
          }}
        >
          {/* Organization Badge */}
          <div style={{ marginBottom: '16px' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '6px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}
            >
              {organization.name}
            </span>
          </div>

          {/* Initiative Name */}
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 700,
              marginBottom: '12px',
              color: 'var(--text-primary)',
            }}
          >
            {initiative.name}
          </h1>

          {/* Description */}
          {initiative.description && (
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              {initiative.description}
            </p>
          )}

          {/* Status and Priority Badges */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                background: `${statusColors[initiative.status as keyof typeof statusColors]}20`,
                color: statusColors[initiative.status as keyof typeof statusColors],
              }}
            >
              {initiative.status.replace('_', ' ').toUpperCase()}
            </span>
            <span
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                background: `${priorityColors[initiative.priority as keyof typeof priorityColors]}20`,
                color: priorityColors[initiative.priority as keyof typeof priorityColors],
              }}
            >
              {initiative.priority.toUpperCase()} PRIORITY
            </span>
          </div>
        </div>

        {/* Invitation Status Card */}
        {invitationStatus === 'pending' && (
          <div
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
              You've been invited to this initiative
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              You've been invited as <strong>{roleLabel}</strong>. Accept to start participating.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handleAccept}
                disabled={isProcessing}
                style={{
                  padding: '12px 24px',
                  background: 'var(--gradient-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.6 : 1,
                }}
              >
                {isProcessing ? 'Processing...' : 'Accept Invitation'}
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.6 : 1,
                }}
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {invitationStatus === 'accepted' && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '16px',
              padding: '16px 24px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <CheckCircle size={20} style={{ color: '#10b981' }} />
            <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
              You're participating in this initiative as <strong>{roleLabel}</strong>
            </span>
          </div>
        )}

        {invitationStatus === 'rejected' && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '16px',
              padding: '16px 24px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <XCircle size={20} style={{ color: '#ef4444' }} />
            <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
              You declined this invitation
            </span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {/* Details Card */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Details</h2>

            {initiative.start_date && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Calendar size={18} style={{ color: 'var(--text-tertiary)' }} />
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Start Date</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>
                    {new Date(initiative.start_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}

            {initiative.target_date && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Target size={18} style={{ color: 'var(--text-tertiary)' }} />
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Target Date</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>
                    {new Date(initiative.target_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}

            {initiative.budget && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <DollarSign size={18} style={{ color: 'var(--text-tertiary)' }} />
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Budget</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>
                    {initiative.budget_currency} {initiative.budget.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Your Permissions Card */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Your Permissions</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#10b981' }}>✓</span>
                <span style={{ fontSize: '14px' }}>View initiative details</span>
              </div>
              {participant.can_view_metrics && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#10b981' }}>✓</span>
                  <span style={{ fontSize: '14px' }}>Track progress and metrics</span>
                </div>
              )}
              {participant.can_add_comments && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#10b981' }}>✓</span>
                  <span style={{ fontSize: '14px' }}>Add comments and updates</span>
                </div>
              )}
              {participant.can_edit && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#10b981' }}>✓</span>
                  <span style={{ fontSize: '14px' }}>Edit initiative information</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={20} />
            Activity & Comments
          </h2>

          {/* Add Comment (if accepted and has permission) */}
          {invitationStatus === 'accepted' && participant.can_add_comments && (
            <div style={{ marginBottom: '24px' }}>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment or update..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  resize: 'vertical',
                  marginBottom: '12px',
                }}
              />
              <button
                onClick={handleAddComment}
                disabled={!comment.trim() || isAddingComment}
                style={{
                  padding: '10px 20px',
                  background: comment.trim() && !isAddingComment ? 'var(--gradient-primary)' : 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: comment.trim() && !isAddingComment ? 'pointer' : 'not-allowed',
                  opacity: comment.trim() && !isAddingComment ? 1 : 0.5,
                }}
              >
                {isAddingComment ? 'Adding...' : 'Add Comment'}
              </button>
            </div>
          )}

          {/* Activity List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loadingActivity ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                Loading activity...
              </div>
            ) : activity.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                No activity yet
              </div>
            ) : (
              activity.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                    {item.activity_type === 'comment' && item.metadata?.author && (
                      <strong style={{ color: 'var(--text-primary)' }}>{item.metadata.author}: </strong>
                    )}
                    <span style={{ color: 'var(--text-secondary)' }}>{item.description}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '40px',
            padding: '24px',
            textAlign: 'center',
            borderTop: '1px solid var(--glass-border)',
          }}
        >
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
            Powered by <strong>blipee</strong> - Sustainability Tracking & Reporting Platform
          </p>
          <a
            href="https://v2.blipee.io"
            style={{
              fontSize: '13px',
              color: 'var(--green)',
              textDecoration: 'none',
            }}
          >
            Learn more about blipee
          </a>
        </div>
      </div>
    </div>
  )
}
