"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/providers/ThemeProvider";
import {
  Building2,
  Factory,
  Globe,
  TreePine,
  CheckCircle,
  Sparkles,
  Users,
  Award,
  BarChart3,
  Home,
  ArrowRight,
  TrendingDown,
  Shield,
  Zap,
  Target,
  Heart,
  GraduationCap,
  Banknote,
  Menu,
  X,
  Mail,
  MessageCircle,
  HelpCircle,
  Phone,
  Sun,
  Moon,
} from "lucide-react";

// GRI Standard component
function GRIStandard({
  standard,
  title,
  description,
  coverage,
}: {
  standard: string;
  title: string;
  description: string;
  coverage: string[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-white dark:bg-[#212121] backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all duration-300"
    >
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {standard}
          </h3>
          <p className="text-purple-400 font-medium">{title}</p>
        </div>
      </div>
      <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
        {description}
      </p>
      <div className="space-y-1">
        {coverage.map((item, index) => (
          <div key={index} className="flex items-start">
            <CheckCircle className="w-4 h-4 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-gray-700 dark:text-gray-300">
              {item}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function IndustriesPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  const industryCategories = [
    {
      icon: Factory,
      title: "Manufacturing & Production",
      description: "Any company that produces goods or products",
      examples: [
        "Automotive & aerospace",
        "Electronics & technology",
        "Food & beverage production",
        "Chemicals & pharmaceuticals",
        "Textiles & consumer goods",
        "Heavy machinery & equipment",
      ],
      gradient: "from-blue-500 to-indigo-500",
    },
    {
      icon: Building2,
      title: "Built Environment",
      description: "Organizations managing buildings and infrastructure",
      examples: [
        "Commercial real estate",
        "Residential properties",
        "Educational institutions",
        "Healthcare facilities",
        "Hospitality & tourism",
        "Airports & transportation hubs",
      ],
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Zap,
      title: "Energy & Utilities",
      description: "Power generation, distribution, and utility services",
      examples: [
        "Electric utilities",
        "Oil & gas companies",
        "Renewable energy developers",
        "Water & wastewater treatment",
        "District energy systems",
        "Energy storage & distribution",
      ],
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      icon: Globe,
      title: "Services & Digital",
      description: "Service-based organizations across all sectors",
      examples: [
        "Financial services & banking",
        "Professional services",
        "Technology & software",
        "Telecommunications",
        "Media & entertainment",
        "Consulting & advisory",
      ],
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      icon: TreePine,
      title: "Natural Resources",
      description: "Organizations working with natural resources",
      examples: [
        "Agriculture & farming",
        "Forestry & paper",
        "Mining & extractives",
        "Fisheries & aquaculture",
        "Waste management & recycling",
        "Environmental services",
      ],
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: Users,
      title: "Public & Social Sector",
      description: "Government and public service organizations",
      examples: [
        "Government agencies",
        "Non-profit organizations",
        "Healthcare systems",
        "Educational institutions",
        "Social enterprises",
        "International organizations",
      ],
      gradient: "from-indigo-500 to-purple-500",
    },
  ];

  const griStandards = [
    {
      standard: "GRI 11",
      title: "Oil and Gas Sector",
      description:
        "Comprehensive sustainability reporting for oil and gas operations",
      coverage: [
        "Greenhouse gas emissions management",
        "Biodiversity and ecosystem protection",
        "Asset integrity and process safety",
        "Rights of indigenous peoples",
      ],
    },
    {
      standard: "GRI 12",
      title: "Coal Sector",
      description: "Sustainability standards for coal mining and processing",
      coverage: [
        "Particulate matter emissions",
        "Biodiversity impact assessment",
        "Land and resource rights",
        "Closure and rehabilitation planning",
      ],
    },
    {
      standard: "GRI 13",
      title: "Agriculture & Food",
      description: "Food production and agricultural sustainability reporting",
      coverage: [
        "Food loss and waste management",
        "Sustainable sourcing practices",
        "Animal welfare standards",
        "Water and soil conservation",
      ],
    },
    {
      standard: "GRI 14",
      title: "Mining Sector",
      description: "Mining operations and extractive industry standards",
      coverage: [
        "Waste and tailings management",
        "Mine closure and rehabilitation",
        "Artisanal and small-scale mining",
        "Economic contribution reporting",
      ],
    },
    {
      standard: "GRI 15",
      title: "Chemicals Sector",
      description: "Chemical industry sustainability and safety reporting",
      coverage: [
        "Chemical safety and product stewardship",
        "Process safety management",
        "Emissions and waste reduction",
        "Supply chain transparency",
      ],
    },
    {
      standard: "GRI 16",
      title: "Construction & Real Estate",
      description: "Built environment sustainability standards",
      coverage: [
        "Sustainable building practices",
        "Land use and planning",
        "Construction waste management",
        "Energy efficiency in buildings",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111] text-gray-900 dark:text-white">
      {/* Skip Navigation */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-purple-600 text-white rounded-lg"
      >
        Skip to main content
      </a>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#111111]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center rounded-lg" aria-label="Go to homepage">
              <div className="w-8 h-8 sm:w-10 sm:h-10 p-0.5 rounded-xl" style={{background: 'linear-gradient(to bottom right, rgb(236, 72, 153), rgb(147, 51, 234))'}}>
                <div className="w-full h-full bg-white/95 dark:bg-[#111111]/95 rounded-[10px] flex items-center justify-center">
                  <Home className="w-5 h-5 sm:w-6 sm:h-6" stroke="url(#homeGradient)" fill="none" strokeWidth="2" aria-hidden="true" />
                  <svg width="0" height="0">
                    <defs>
                      <linearGradient id="homeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgb(236, 72, 153)" />
                        <stop offset="100%" stopColor="rgb(147, 51, 234)" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
              <span className="ml-2 text-lg sm:text-xl font-normal bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                blipee
              </span>
            </Link>

            {/* Theme Toggle, Auth Button and Menu */}
            <div className="flex items-center gap-4">
              {/* Theme Toggle Button */}
              <div className="w-11 h-11 rounded-full p-[1px] bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500">
                <button
                  onClick={toggleTheme}
                  className="w-full h-full rounded-full bg-white/95 dark:bg-[#111111]/95 hover:bg-white/90 dark:hover:bg-black/90 transition-all flex items-center justify-center"
                  aria-label="Toggle theme"
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
              
              <Link href="/signin">
                <button className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all">
                  Sign In
                </button>
              </Link>
              
              {/* Menu button for all screen sizes */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 flex items-center justify-center"
              >
                {isMenuOpen ? (
                <X className="w-6 h-6 text-gray-900 dark:text-white" stroke="url(#xGradient)" />
              ) : (
                <div className="w-6 h-6 flex flex-col justify-center gap-1">
                  <div className="w-6 h-0.5 rounded-full" 
                       style={{background: 'linear-gradient(to right, rgb(236, 72, 153), rgb(147, 51, 234))'}}></div>
                  <div className="w-6 h-0.5 rounded-full" 
                       style={{background: 'linear-gradient(to right, rgb(236, 72, 153), rgb(147, 51, 234))'}}></div>
                  <div className="w-6 h-0.5 rounded-full" 
                       style={{background: 'linear-gradient(to right, rgb(236, 72, 153), rgb(147, 51, 234))'}}></div>
                </div>
              )}
              </button>
              <svg width="0" height="0">
                <defs>
                  <linearGradient id="xGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgb(236, 72, 153)" />
                    <stop offset="100%" stopColor="rgb(147, 51, 234)" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

          </div>

          {/* Navigation Menu - shows on all screen sizes */}
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute right-0 top-full mt-2 w-full md:w-64 bg-white/90 dark:bg-[#111111]/90 backdrop-blur-xl border border-gray-200/50 dark:border-white/[0.05] rounded-lg py-4 shadow-2xl"
            >
              <div className="flex flex-col space-y-1">
                <Link href="/features" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors">Features</Link>
                <Link href="/industries" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors">Industries</Link>
                <Link href="/ai-technology" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors">AI Technology</Link>
                <Link href="/about" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors">About</Link>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main id="main-content">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8" role="banner" aria-labelledby="hero-heading">
          <div className="relative max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12 sm:mb-16"
            >
              <div className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-white dark:bg-[#212121] backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-full mb-6 sm:mb-8" role="note" aria-label="Product highlight">
                <Globe className="w-4 h-4 text-pink-400 mr-2" aria-hidden="true" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  Every Industry. Every Organization. Every Goal.
                </span>
              </div>
              <h1 id="hero-heading" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Universal Sustainability
                </span>
                <br />
                <span className="text-gray-900 dark:text-white">
                  For Every Industry
                </span>
              </h1>
            <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-4xl mx-auto">
              <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">blipee</span> works with any organization, in any industry, of any
              size. From startups to Fortune 500s, from manufacturing to
              services, we make sustainability simple and achievable for
              everyone.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Universal Message */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Your Industry Is Covered
              </span>
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
              Sustainability challenges are universal. Whether you're
              tracking emissions, managing energy, reducing waste, or reporting
              ESG metrics, <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">blipee</span> adapts to your specific industry
              requirements and regulations.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="bg-white dark:bg-[#212121] backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all duration-300">
                <Target className="w-8 h-8 text-purple-400 mb-4" />
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                  Any Sector
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  From heavy industry to digital services, our AI understands
                  your unique sustainability challenges.
                </p>
              </div>
              <div className="bg-white dark:bg-[#212121] backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all duration-300">
                <Shield className="w-8 h-8 text-purple-400 mb-4" />
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                  Any Standard
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  GRI, SASB, TCFD, CSRD, EU Taxonomy - we support all major
                  sustainability frameworks and regulations.
                </p>
              </div>
              <div className="bg-white dark:bg-[#212121] backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all duration-300">
                <Users className="w-8 h-8 text-purple-400 mb-4" />
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                  Any Size
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  From small businesses to multinational corporations, our
                  platform scales with your needs.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Industry Categories */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 bg-gray-50/50 dark:bg-[#111111]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-white dark:bg-[#212121] backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-full mb-6 sm:mb-8">
              <Globe className="w-4 h-4 text-pink-400 mr-2" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                Industry Intelligence
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                How We Organize Industries
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              These are just examples. If your industry isn't listed, we
              still work with you. Our AI adapts to any sustainability
              challenge.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
            {industryCategories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white dark:bg-[#212121] backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl p-6 sm:p-8 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all duration-300"
              >
                <div className="flex items-center mb-6">
                  <div
                    className={`w-14 h-14 bg-gradient-to-r ${category.gradient} rounded-xl flex items-center justify-center mr-4`}
                  >
                    <category.icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {category.title}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {category.description}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {category.examples.map((example, exampleIndex) => (
                    <div key={exampleIndex} className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-purple-400 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {example}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* GRI Standards Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-white dark:bg-[#212121] backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-full mb-6 sm:mb-8">
              <Shield className="w-4 h-4 text-pink-400 mr-2" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                Compliance Standards
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                GRI & CSRD Standards
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Full compliance with Global Reporting Initiative sector-specific
              standards and CSRD (Corporate Sustainability Reporting Directive).
              Our AI knows the exact requirements for your industry.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {griStandards.map((standard, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <GRIStandard {...standard} />
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mt-12"
          >
            <div className="bg-white dark:bg-[#212121] backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl p-8 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all duration-300">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Beyond GRI Standards
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                We also support SASB, TCFD, CSRD, EU Taxonomy, SEC Climate Rules, IFRS
                S1/S2, and emerging regulations worldwide. If there's a
                sustainability standard, we've got you covered.
              </p>
            </div>
          </motion.div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Ready to Transform Your Sustainability?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Access your AI-powered sustainability platform and start making 
              data-driven decisions today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signin">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto min-w-[180px] px-6 py-3 bg-white text-gray-900 rounded-lg font-medium shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all flex items-center justify-center"
                >
                  Sign In to Dashboard
                  <ArrowRight className="ml-2 w-4 h-4" />
                </motion.button>
              </Link>
              <motion.button
                onClick={() => setIsContactModalOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto min-w-[180px] px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg font-medium hover:bg-white/10 transition-all flex items-center justify-center"
              >
                Request Access
              </motion.button>
            </div>
            <p className="mt-6 text-white/70 text-sm">
              Your AI sustainability team is waiting for you
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#111111] text-gray-900 dark:text-white px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center gap-8">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="w-10 h-10 p-0.5 rounded-xl" style={{background: 'linear-gradient(to bottom right, rgb(236, 72, 153), rgb(147, 51, 234))'}}>
                <div className="w-full h-full bg-white/95 dark:bg-[#111111]/95 rounded-[10px] flex items-center justify-center">
                  <Home className="w-6 h-6" stroke="url(#footerHomeGradient)" fill="none" strokeWidth="2" />
                  <svg width="0" height="0">
                    <defs>
                      <linearGradient id="footerHomeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgb(236, 72, 153)" />
                        <stop offset="100%" stopColor="rgb(147, 51, 234)" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
              <span className="ml-3 text-xl font-normal bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                blipee
              </span>
            </Link>
            
            <div className="flex flex-col items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex flex-wrap justify-center gap-6">
                <Link href="/features" className="hover:text-gray-900 dark:text-white transition-colors">Features</Link>
                <Link href="/industries" className="hover:text-gray-900 dark:text-white transition-colors">Industries</Link>
                <Link href="/ai-technology" className="hover:text-gray-900 dark:text-white transition-colors">AI Technology</Link>
                <Link href="/about" className="hover:text-gray-900 dark:text-white transition-colors">About</Link>
                <button onClick={() => setIsContactModalOpen(true)} className="hover:text-gray-900 dark:text-white transition-colors">Contact</button>
                <button onClick={() => setIsSupportModalOpen(true)} className="hover:text-gray-900 dark:text-white transition-colors">Support</button>
              </div>
              <div className="flex flex-wrap justify-center gap-6 border-t border-gray-300 dark:border-gray-700 pt-4">
                <Link href="/terms-of-use" className="hover:text-gray-900 dark:text-white transition-colors">Terms</Link>
                <Link href="/privacy-policy" className="hover:text-gray-900 dark:text-white transition-colors">Privacy</Link>
                <Link href="/cookie-policy" className="hover:text-gray-900 dark:text-white transition-colors">Cookies</Link>
                <Link href="/security-policy" className="hover:text-gray-900 dark:text-white transition-colors">Security</Link>
                <Link href="/data-processing-agreement" className="hover:text-gray-900 dark:text-white transition-colors">DPA</Link>
              </div>
            </div>
            
            {/* Copyright */}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2025 blipee. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      </main>

      {/* Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsContactModalOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <button
              onClick={() => setIsContactModalOpen(false)}
              className="absolute top-4 right-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Schedule a Demo</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Get in touch with our team to see blipee in action
            </p>
            
            <form className="space-y-4">
              <input
                type="text"
                placeholder="Your Name"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Company"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <textarea
                placeholder="Tell us about your sustainability goals"
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
              />
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Send Request
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Support Modal */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSupportModalOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <button
              onClick={() => setIsSupportModalOpen(false)}
              className="absolute top-4 right-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Get Support</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Our team is here to help you succeed with blipee
            </p>
            
            <form className="space-y-4">
              <input
                type="text"
                placeholder="Your Name"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <select
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              >
                <option value="" className="bg-white dark:bg-[#111111]">Select Issue Type</option>
                <option value="technical" className="bg-white dark:bg-[#111111]">Technical Issue</option>
                <option value="billing" className="bg-white dark:bg-[#111111]">Billing Question</option>
                <option value="feature" className="bg-white dark:bg-[#111111]">Feature Request</option>
                <option value="other" className="bg-white dark:bg-[#111111]">Other</option>
              </select>
              <textarea
                placeholder="Describe your issue or question"
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
              />
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Submit Request
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}