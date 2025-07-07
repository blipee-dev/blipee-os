'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Loader2, UserPlus, X } from 'lucide-react'
import type { OnboardingStep } from '@/types/onboarding'

interface RoleAssignmentStepProps {
  step: OnboardingStep
  onComplete: (data: any) => void
  onSkip?: () => void
  previousData: Record<string, any>
}

interface TeamMember {
  email: string
  role: string
}

export function RoleAssignmentStep({ step, onComplete, onSkip }: RoleAssignmentStepProps) {
  const config = step.config
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [currentEmail, setCurrentEmail] = useState('')
  const [currentRole, setCurrentRole] = useState(config.roles[0]?.role || '')
  const [errors, setErrors] = useState<string>('')
  const [loading, setLoading] = useState(false)

  function handleAddMember() {
    if (!currentEmail) {
      setErrors('Please enter an email address')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentEmail)) {
      setErrors('Please enter a valid email address')
      return
    }

    if (teamMembers.some(m => m.email === currentEmail)) {
      setErrors('This email has already been added')
      return
    }

    setTeamMembers([...teamMembers, { email: currentEmail, role: currentRole }])
    setCurrentEmail('')
    setErrors('')
  }

  function handleRemoveMember(email: string) {
    setTeamMembers(teamMembers.filter(m => m.email !== email))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)
    try {
      await onComplete({ 
        teamMembers,
        count: teamMembers.length
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSkipMembers() {
    if (onSkip) {
      await onComplete({ skipped: true })
      onSkip()
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {config.title}
          </h2>
          <p className="text-gray-600">
            {config.subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Add member form */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <input
                  type="email"
                  value={currentEmail}
                  onChange={(e) => {
                    setCurrentEmail(e.target.value)
                    setErrors('')
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddMember()
                    }
                  }}
                  placeholder="email@company.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {config.roles.map((roleOption: any) => (
                    <option key={roleOption.role} value={roleOption.role}>
                      {roleOption.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>
            </div>
            {errors && (
              <p className="mt-2 text-sm text-red-600">{errors}</p>
            )}
          </div>

          {/* Role descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {config.roles.map((roleOption: any) => (
              <div key={roleOption.role} className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl mb-2">{roleOption.icon}</div>
                <h4 className="font-medium text-gray-900">{roleOption.label}</h4>
                <p className="text-sm text-gray-600 mt-1">{roleOption.description}</p>
              </div>
            ))}
          </div>

          {/* Team members list */}
          {teamMembers.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Team members ({teamMembers.length})
              </h3>
              <div className="space-y-2">
                {teamMembers.map((member, index) => (
                  <motion.div
                    key={member.email}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-700">
                          {member.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.email}</p>
                        <p className="text-sm text-gray-600">
                          {config.roles.find((r: any) => r.role === member.role)?.label}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.email)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-6">
            {config.skipOption && (
              <button
                type="button"
                onClick={handleSkipMembers}
                className="text-gray-500 hover:text-gray-700"
              >
                {config.skipOption.label}
              </button>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="ml-auto flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {teamMembers.length > 0 ? 'Send Invitations' : 'Continue'}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </div>

          {config.skipOption && (
            <p className="text-sm text-gray-500 text-center">
              {config.skipOption.consequence}
            </p>
          )}
        </form>
      </motion.div>
    </div>
  )
}