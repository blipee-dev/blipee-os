'use client'

import React from 'react'
import { ConversationInterface } from '@/components/blipee-os/ConversationInterface'
import { useBuilding } from './layout'
import { useAuth } from '@/lib/auth/context'
import { Building2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { building } = useBuilding()
  const { session } = useAuth()

  // If no building selected, show selection prompt
  if (!building) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Select a Building
          </h2>
          <p className="text-gray-600 mb-6">
            Choose a building from the selector above to start managing it with Blipee AI.
          </p>
          
          {/* Show if user has permission to add buildings */}
          {session?.permissions.some(p => p.resource === 'buildings' && p.action === 'create') && (
            <Link
              href="/buildings/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add New Building
            </Link>
          )}
        </div>
      </div>
    )
  }

  // If building is pending setup
  if (building.status === 'pending_setup') {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Building Setup Required
          </h2>
          <p className="text-gray-600 mb-6">
            {building.name} needs to be configured before you can start managing it.
          </p>
          <Link
            href={`/buildings/${building.id}/setup`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Complete Setup
          </Link>
        </div>
      </div>
    )
  }

  // Pass building context to conversation interface
  return (
    <div className="h-full">
      <ConversationInterface 
        buildingContext={{
          id: building.id,
          name: building.name,
          organizationId: session?.current_organization.id || '',
          metadata: {
            size_sqft: building.size_sqft,
            floors: building.floors,
            occupancy_types: building.occupancy_types,
            age_category: building.age_category,
            systems_baseline: building.metadata?.systems_baseline
          }
        }}
      />
    </div>
  )
}