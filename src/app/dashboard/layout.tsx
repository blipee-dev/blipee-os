"use client";

import React, { useState, useEffect } from "react";
import { useRequireAuth } from "@/lib/auth/context";
import { OrganizationSwitcher } from "@/components/OrganizationSwitcher";
import { BuildingSelector } from "@/components/BuildingSelector";
import { BuildingProvider, useBuilding } from "@/contexts/BuildingContext";
import { Loader2, LogOut, Settings, User, Sun, Moon, Home } from "lucide-react";
import Link from "next/link";
import type { Building } from "@/types/auth";
// Removed AnimatedBackground import - using simple dark/light background like features page

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { session, loading } = useRequireAuth();
  const { building: currentBuilding, setBuilding: setCurrentBuilding } =
    useBuilding();
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Check system preference and localStorage
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(prefersDark);
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newMode);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/signin";
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center space-x-6">
              <Link href="/dashboard" className="flex items-center group">
                <div className="w-10 h-10 p-0.5 rounded-xl mr-3" style={{background: 'linear-gradient(to bottom right, rgb(236, 72, 153), rgb(147, 51, 234))'}}>
                  <div className="w-full h-full bg-white/95 dark:bg-black/95 rounded-[10px] flex items-center justify-center group-hover:shadow-lg group-hover:shadow-purple-500/25 transition-all">
                    <Home className="w-6 h-6" stroke="url(#dashboardHomeGradient)" fill="none" strokeWidth="2" />
                    <svg width="0" height="0">
                      <defs>
                        <linearGradient id="dashboardHomeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="rgb(236, 72, 153)" />
                          <stop offset="100%" stopColor="rgb(147, 51, 234)" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
                <span className="text-xl font-normal bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  blipee
                </span>
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
                {/* Theme Toggle Button - matching features page style */}
                <div className="w-10 h-10 rounded-full p-[1px] bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500">
                  <button
                    onClick={toggleTheme}
                    className="w-full h-full rounded-full bg-white/95 dark:bg-black/95 hover:bg-white/90 dark:hover:bg-black/90 transition-all flex items-center justify-center"
                    aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    {isDarkMode ? (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="sunGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="rgb(236, 72, 153)" />
                            <stop offset="50%" stopColor="rgb(147, 51, 234)" />
                            <stop offset="100%" stopColor="rgb(59, 130, 246)" />
                          </linearGradient>
                        </defs>
                        <circle cx="12" cy="12" r="4" stroke="url(#sunGradient)" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M12 2v4M12 18v4M22 12h-4M6 12H2" stroke="url(#sunGradient)" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M19.07 4.93l-2.83 2.83M7.76 16.24l-2.83 2.83M19.07 19.07l-2.83-2.83M7.76 7.76L4.93 4.93" stroke="url(#sunGradient)" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="moonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="rgb(236, 72, 153)" />
                            <stop offset="50%" stopColor="rgb(147, 51, 234)" />
                            <stop offset="100%" stopColor="rgb(59, 130, 246)" />
                          </linearGradient>
                        </defs>
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="url(#moonGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>

                <button className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-all">
                  <Settings className="w-5 h-5 text-gray-600 dark:text-white/70" />
                </button>

                <div className="relative group">
                  <button className="flex items-center p-2.5 rounded-xl bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-all">
                    <User className="w-5 h-5 text-gray-600 dark:text-white/70" />
                  </button>

                  {/* User dropdown */}
                  <div className="absolute right-0 mt-2 w-48 backdrop-blur-xl bg-white/90 dark:bg-white/[0.1] rounded-xl border border-gray-200 dark:border-white/[0.1] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-2xl">
                    <div className="p-3 border-b border-gray-200 dark:border-white/[0.1]">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {session.user.full_name || session.user.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-white/60">
                        {session.user.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/settings/profile"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/[0.1]"
                      >
                        Profile Settings
                      </Link>
                      <Link
                        href="/settings/security"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/[0.1]"
                      >
                        Security Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/[0.1] flex items-center"
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
      <main className="flex-1 relative">
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BuildingProvider>
      <DashboardContent>{children}</DashboardContent>
    </BuildingProvider>
  );
}
