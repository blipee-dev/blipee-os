"use client";

import React, { useState, useEffect } from "react";
import { useRequireAuth } from "@/lib/auth/context";
import { OrganizationSwitcher } from "@/components/OrganizationSwitcher";
import { BuildingSelector } from "@/components/BuildingSelector";
import { BuildingProvider, useBuilding } from "@/contexts/BuildingContext";
import { Loader2, LogOut, Settings, User, Sun, Moon, Home } from "lucide-react";
import Link from "next/link";
import type { Building } from "@/types/auth";
import { AnimatedBackground } from "@/components/effects/AnimatedBackground";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { session, loading } = useRequireAuth();
  const { building: currentBuilding, setBuilding: setCurrentBuilding } =
    useBuilding();
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem("lightMode");
    setIsLightMode(savedMode === "true");
  }, []);

  const toggleLightMode = () => {
    const newMode = !isLightMode;
    setIsLightMode(newMode);
    localStorage.setItem("lightMode", newMode.toString());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
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
    <div className={`min-h-screen bg-white dark:bg-black transition-colors duration-300 ${isLightMode ? "light-mode" : ""}`}>
      <AnimatedBackground />
      
      {/* Top Navigation */}
      <nav className="backdrop-blur-xl bg-white/[0.03] light-mode:bg-white/70 border-b border-white/[0.05] light-mode:border-gray-200/50 sticky top-0 z-50">
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
                {/* Light/Dark Mode Toggle */}
                <button
                  onClick={toggleLightMode}
                  className="p-2.5 rounded-xl bg-white/[0.05] light-mode:bg-gray-100 border border-white/[0.05] light-mode:border-gray-200 hover:bg-white/[0.1] light-mode:hover:bg-gray-200 transition-all"
                  aria-label="Toggle light mode"
                >
                  {isLightMode ? (
                    <Moon className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Sun className="w-5 h-5 text-yellow-400" />
                  )}
                </button>

                <button className="p-2.5 rounded-xl bg-white/[0.05] light-mode:bg-gray-100 border border-white/[0.05] light-mode:border-gray-200 hover:bg-white/[0.1] light-mode:hover:bg-gray-200 transition-all">
                  <Settings className="w-5 h-5 text-white/70 light-mode:text-gray-600" />
                </button>

                <div className="relative group">
                  <button className="flex items-center p-2.5 rounded-xl bg-white/[0.05] light-mode:bg-gray-100 border border-white/[0.05] light-mode:border-gray-200 hover:bg-white/[0.1] light-mode:hover:bg-gray-200 transition-all">
                    <User className="w-5 h-5 text-white/70 light-mode:text-gray-600" />
                  </button>

                  {/* User dropdown */}
                  <div className="absolute right-0 mt-2 w-48 backdrop-blur-xl bg-white/[0.1] light-mode:bg-white/90 rounded-xl border border-white/[0.1] light-mode:border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-2xl">
                    <div className="p-3 border-b border-white/[0.1] light-mode:border-gray-200">
                      <p className="text-sm font-medium text-white light-mode:text-gray-900">
                        {session.user.full_name || session.user.email}
                      </p>
                      <p className="text-xs text-white/60 light-mode:text-gray-500">
                        {session.user.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/settings/profile"
                        className="block px-4 py-2 text-sm text-white/80 light-mode:text-gray-700 hover:bg-white/[0.1] light-mode:hover:bg-gray-100"
                      >
                        Profile Settings
                      </Link>
                      <Link
                        href="/settings/security"
                        className="block px-4 py-2 text-sm text-white/80 light-mode:text-gray-700 hover:bg-white/[0.1] light-mode:hover:bg-gray-100"
                      >
                        Security Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-white/80 light-mode:text-gray-700 hover:bg-white/[0.1] light-mode:hover:bg-gray-100 flex items-center"
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
