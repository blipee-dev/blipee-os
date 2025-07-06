import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
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
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black dark:bg-black light:bg-gray-50 overflow-hidden transition-colors duration-300`}>
        <div className="fixed inset-0 dark:bg-gradient-to-br dark:from-purple-900/10 dark:via-black dark:to-blue-900/10 light:bg-gradient-to-br light:from-purple-100/30 light:via-transparent light:to-blue-100/30 transition-all duration-300" />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] dark:from-purple-900/20 dark:via-transparent dark:to-transparent light:from-purple-200/20 light:via-transparent light:to-transparent transition-all duration-300" />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] dark:from-blue-900/20 dark:via-transparent dark:to-transparent light:from-blue-200/20 light:via-transparent light:to-transparent transition-all duration-300" />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}