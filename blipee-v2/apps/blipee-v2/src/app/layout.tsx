import type { Metadata } from "next";
import { NextIntlClientProvider, useMessages, useLocale } from "next-intl";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "react-hot-toast";
import CookieConsent from "@/components/CookieConsent";
import { ToastProvider } from "@/components/Toast";
import { QueryProvider } from "@/providers/QueryProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "blipee - Your AI Workforce for Sustainability",
    template: "%s | blipee",
  },
  description:
    "Build your AI-powered sustainability workforce with 8 autonomous agents working 24/7. Track carbon emissions, energy consumption, and ESG metrics in real-time.",
  keywords: [
    "sustainability",
    "carbon tracking",
    "ESG",
    "AI agents",
    "energy management",
    "environmental monitoring",
    "carbon footprint",
    "sustainable business",
  ],
  authors: [{ name: "blipee" }],
  creator: "blipee",
  publisher: "blipee",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "blipee",
    title: "blipee - Your AI Workforce for Sustainability",
    description:
      "Build your AI-powered sustainability workforce with 8 autonomous agents working 24/7.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "blipee - AI Workforce for Sustainability",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "blipee - Your AI Workforce for Sustainability",
    description:
      "Build your AI-powered sustainability workforce with 8 autonomous agents working 24/7.",
    images: ["/og-image.png"],
    creator: "@blipee",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const messages = useMessages();
  const locale = useLocale();
  return (
    <html lang={locale} className={inter.variable}>
      <body className="antialiased font-sans" data-theme="dark">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Toaster
            position="top-right"
            reverseOrder={false}
            toastOptions={{
              duration: 5000,
              style: {
                background: '#0f172a',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.5rem',
                padding: '1rem',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <ToastProvider>
            <QueryProvider>
              {children}
              <CookieConsent />
            </QueryProvider>
          </ToastProvider>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
