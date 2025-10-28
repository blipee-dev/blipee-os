import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "blipee - Conversational AI for Sustainability",
  description:
    "Revolutionary sustainability management through conversational AI. Transform how you achieve environmental goals with AI that speaks your language.",
  icons: {
    icon: [
      { url: '/favicon-black-white.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Blipee',
  },
  formatDetection: {
    telephone: false,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-white dark:bg-black transition-colors duration-300`}
      >
        <Providers>
          <ErrorBoundary>
            <div className="fixed inset-0 bg-gradient-to-br from-purple-900/5 dark:from-purple-900/10 via-white dark:via-black to-blue-900/5 dark:to-blue-900/10 transition-all duration-300" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/10 dark:from-purple-900/20 via-transparent to-transparent" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/10 dark:from-blue-900/20 via-transparent to-transparent" />
            <div className="relative z-10 h-screen">{children}</div>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
