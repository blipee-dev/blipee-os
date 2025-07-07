"use client";

import { useState, useEffect } from "react";
import { Home, Sun, Moon } from "lucide-react";
import { premiumTheme } from "@/lib/design/theme";

export function NavRail() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for saved theme preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      setIsDarkMode(false);
      document.documentElement.classList.add("light-mode");
      document.body.classList.add("light-mode");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);

    if (newTheme) {
      document.documentElement.classList.remove("light-mode");
      document.body.classList.remove("light-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.add("light-mode");
      document.body.classList.add("light-mode");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <nav className="nav-rail" aria-label="Main navigation">
      {/* Logo */}
      <div className="nav-logo-container">
        <div
          className="nav-logo"
          role="button"
          tabIndex={0}
          aria-label="blipee OS Home"
        >
          <Home className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Theme Toggle */}
      <div className="nav-bottom">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={
            mounted
              ? `Switch to ${isDarkMode ? "light" : "dark"} mode`
              : "Toggle theme"
          }
        >
          {mounted ? (
            isDarkMode ? (
              <Sun className="w-6 h-6" />
            ) : (
              <Moon className="w-6 h-6" />
            )
          ) : (
            <Sun className="w-6 h-6" />
          )}
        </button>
      </div>

      <style jsx>{`
        .nav-rail {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 80px;
          background: linear-gradient(
            180deg,
            rgba(139, 92, 246, 0.1) 0%,
            rgba(14, 165, 233, 0.1) 100%
          );
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem 0;
          z-index: 100;
          transition: all 0.3s ease;
        }

        .nav-logo-container {
          margin-bottom: 2rem;
        }

        .nav-logo {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #8b5cf6 0%, #0ea5e9 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
          position: relative;
          overflow: hidden;
        }

        .nav-logo::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.2) 0%,
            transparent 60%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .nav-logo:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
        }

        .nav-logo:hover::before {
          opacity: 1;
        }

        .nav-logo:active {
          transform: scale(0.98);
        }

        .nav-bottom {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .theme-toggle {
          width: 56px;
          height: 56px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: rgba(255, 255, 255, 0.9);
          position: relative;
          overflow: hidden;
        }

        .theme-toggle::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.1) 0%,
            transparent 70%
          );
          transform: translate(-50%, -50%);
          transition:
            width 0.3s ease,
            height 0.3s ease;
        }

        .theme-toggle:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: scale(1.05);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .theme-toggle:hover::before {
          width: 100px;
          height: 100px;
        }

        .theme-toggle:active {
          transform: scale(0.95);
        }

        /* Glow effect on dark mode */
        .nav-rail::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 0;
          width: 1px;
          height: 300px;
          background: linear-gradient(
            to bottom,
            transparent,
            rgba(139, 92, 246, 0.5),
            transparent
          );
          transform: translateY(-50%);
          opacity: 0.5;
          animation: railGlow 6s ease-in-out infinite;
        }

        @keyframes railGlow {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.8;
          }
        }

        /* Light mode adjustments */
        :global(.light-mode) .nav-rail {
          background: linear-gradient(
            180deg,
            rgba(139, 92, 246, 0.05) 0%,
            rgba(14, 165, 233, 0.05) 100%
          );
          border-right-color: rgba(0, 0, 0, 0.05);
        }

        :global(.light-mode) .nav-rail::after {
          display: none;
        }

        :global(.light-mode) .theme-toggle {
          background: rgba(0, 0, 0, 0.04);
          border-color: rgba(0, 0, 0, 0.08);
          color: rgba(0, 0, 0, 0.8);
        }

        :global(.light-mode) .theme-toggle:hover {
          background: rgba(0, 0, 0, 0.08);
          border-color: rgba(0, 0, 0, 0.16);
        }
      `}</style>
    </nav>
  );
}
