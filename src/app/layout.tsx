import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/lib/auth/context'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Blipee OS - The ChatGPT for Buildings',
  description: 'Revolutionary building management through conversational AI. No dashboards. No menus. Just conversation.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black overflow-hidden transition-colors duration-300`}>
        <AuthProvider>
          <div className="fixed inset-0 bg-gradient-to-br from-purple-900/10 via-black to-blue-900/10 transition-all duration-300" />
          <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
          <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
          <div className="relative z-10 h-full">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}