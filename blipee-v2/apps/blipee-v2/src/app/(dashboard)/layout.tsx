import { ReactNode } from 'react'
import { Navbar } from '@/components/Dashboard/Navbar'
import { Sidebar } from '@/components/Dashboard/Sidebar'
import { createClient } from '@/lib/supabase/v2/server'
import styles from './dashboard.module.css'

interface DashboardLayoutProps {
  children: ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Get authenticated user (optional for now)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // For demo purposes, allow viewing without authentication
  const mockUser = user || { 
    email: 'demo@blipee.com', 
    user_metadata: { name: 'Demo User' } 
  }

  return (
    <div className="min-h-screen">
      {/* Animated Background */}
      <div className="bg-container">
        <div className="bg-gradient-mesh"></div>
      </div>

      {/* Content Wrapper */}
      <div className="content-wrapper">
        <Navbar user={{ email: mockUser.email, name: mockUser.user_metadata?.name }} />
        <Sidebar />
        <main className={styles.mainContent} id="mainContent">
          {children}
        </main>
      </div>
    </div>
  )
}
