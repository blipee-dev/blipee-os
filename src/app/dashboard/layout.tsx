'use client'

import React, { useState } from 'react'
import { useRequireAuth } from '@/lib/auth/context'
import { OrganizationSwitcher } from '@/components/OrganizationSwitcher'
import { BuildingSelector } from '@/components/BuildingSelector'
import { Loader2, LogOut, Settings, User } from 'lucide-react'
import Link from 'next/link'
import type { Building } from '@/types/auth'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session, loading } = useRequireAuth()
  const [currentBuilding, setCurrentBuilding] = useState<Building | null>(null)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  async function handleSignOut() {
    await fetch('/api/auth/signout', { method: 'POST' })
    window.location.href = '/signin'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center space-x-6">
              <Link href="/dashboard" className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mr-3" />
                <span className="text-xl font-bold text-gray-900">Blipee OS</span>
              </Link>
              
              <BuildingSelector
                currentBuilding={currentBuilding}
                onBuildingChange={setCurrentBuilding}
                compact
              />
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              <OrganizationSwitcher />
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                  <Settings className="w-5 h-5" />
                </button>
                
                <div className="relative group">
                  <button className="flex items-center p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                    <User className="w-5 h-5" />
                  </button>
                  
                  {/* User dropdown */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="p-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {session.user.full_name || session.user.email}
                      </p>
                      <p className="text-xs text-gray-500">{session.user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/settings/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Profile Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {/* Pass building context to children */}
        <BuildingContext.Provider value={{ building: currentBuilding, setBuilding: setCurrentBuilding }}>
          {children}
        </BuildingContext.Provider>
      </main>
    </div>
  )
}

// Building context for child components
const BuildingContext = React.createContext<{
  building: Building | null
  setBuilding: (building: Building) => void
}>({
  building: null,
  setBuilding: () => {}
})

export function useBuilding() {
  return React.useContext(BuildingContext)
}