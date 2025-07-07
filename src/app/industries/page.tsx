"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  Factory,
  Globe,
  Target,
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
  TreePine,
  Heart,
  GraduationCap,
  Banknote,
} from "lucide-react";

// Animated background component
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
    </div>
  );
}

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
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20"
    >
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {standard}
          </h3>
          <p className="text-purple-600 font-medium">{title}</p>
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
        {description}
      </p>
      <div className="space-y-1">
        {coverage.map((item, index) => (
          <div key={index} className="flex items-start">
            <CheckCircle className="w-4 h-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-gray-600 dark:text-gray-300">
              {item}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function IndustriesPage() {
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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Home className="w-6 h-6 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                blipee OS
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/features"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Features
              </Link>
              <Link
                href="/industries"
                className="text-gray-900 dark:text-white font-medium"
              >
                Industries
              </Link>
              <Link
                href="/ai-technology"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                AI Technology
              </Link>
              <Link
                href="/about"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                About
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/signin">
                <button className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium">
                  Sign In
                </button>
              </Link>
              <Link href="/signup">
                <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <AnimatedBackground />
        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-8">
              <Globe className="w-4 h-4 text-pink-400 mr-2" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Every Industry. Every Organization. Every Goal.
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Universal Sustainability
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">
                For Every Industry
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto">
              blipee OS works with any organization, in any industry, of any
              size. From startups to Fortune 500s, from manufacturing to
              services, we make sustainability simple and achievable for
              everyone.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Universal Message */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800">
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
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Sustainability challenges are universal. Whether you&apos;re
              tracking emissions, managing energy, reducing waste, or reporting
              ESG metrics, blipee OS adapts to your specific industry
              requirements and regulations.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <Target className="w-8 h-8 text-purple-600 mb-4" />
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                  Any Sector
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  From heavy industry to digital services, our AI understands
                  your unique sustainability challenges.
                </p>
              </div>
              <div className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <Shield className="w-8 h-8 text-purple-600 mb-4" />
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                  Any Standard
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  GRI, SASB, TCFD, EU Taxonomy - we support all major
                  sustainability frameworks and regulations.
                </p>
              </div>
              <div className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <Users className="w-8 h-8 text-purple-600 mb-4" />
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                  Any Size
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  From small businesses to multinational corporations, our
                  platform scales with your needs.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Industry Categories */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                How We Organize Industries
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              These are just examples. If your industry isn&apos;t listed, we
              still work with you. Our AI adapts to any sustainability
              challenge.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {industryCategories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20"
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
                    <p className="text-gray-600 dark:text-gray-300">
                      {category.description}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {category.examples.map((example, exampleIndex) => (
                    <div key={exampleIndex} className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-purple-500 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
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
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                GRI Sector Standards
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Full compliance with Global Reporting Initiative sector-specific
              standards. Our AI knows the exact requirements for your industry.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {griStandards.map((standard, index) => (
              <GRIStandard key={index} {...standard} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mt-12"
          >
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Beyond GRI Standards
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                We also support SASB, TCFD, EU Taxonomy, SEC Climate Rules, IFRS
                S1/S2, and emerging regulations worldwide. If there&apos;s a
                sustainability standard, we&apos;ve got you covered.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Global Impact */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Proven Across Industries
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Organizations in every sector are achieving their sustainability
              goals
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: Users,
                value: "10,000+",
                label: "Organizations",
                description: "Across every industry",
              },
              {
                icon: TrendingDown,
                value: "2.5M",
                label: "Tons CO₂ Saved",
                description: "Monthly impact",
              },
              {
                icon: Award,
                value: "150+",
                label: "Countries",
                description: "Global coverage",
              },
              {
                icon: BarChart3,
                value: "40%",
                label: "Average Reduction",
                description: "In first year",
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-lg font-semibold text-purple-600 mb-1">
                  {stat.label}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.description}
                </div>
              </motion.div>
            ))}
          </div>
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
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready for Any Industry Challenge?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Don&apos;t see your exact industry? No problem. blipee OS adapts
              to any sustainability challenge, anywhere.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white text-gray-900 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center"
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 w-5 h-5" />
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white/20 backdrop-blur-sm border-2 border-white text-white rounded-full font-semibold text-lg shadow-lg hover:bg-white/30 transition-all"
              >
                Discuss Your Industry
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
