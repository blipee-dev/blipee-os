"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  Factory,
  ShoppingCart,
  Plane,
  Truck,
  TreePine,
  Zap,
  Home,
  ArrowRight,
  TrendingDown,
  Globe,
  Target,
  CheckCircle,
  Sparkles,
  Users,
  Award,
  BarChart3,
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

// Industry card component
function IndustryCard({
  icon: Icon,
  title,
  description,
  useCases,
  results,
  gradient,
  stats,
}: {
  icon: any;
  title: string;
  description: string;
  useCases: string[];
  results: string[];
  gradient: string;
  stats: { value: string; label: string }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all"
    >
      <div className="flex items-center mb-6">
        <div
          className={`w-14 h-14 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center mr-4`}
        >
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300">{description}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stat.value}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Use Cases */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
          Common Use Cases:
        </h4>
        <div className="space-y-2">
          {useCases.map((useCase, index) => (
            <div key={index} className="flex items-start">
              <CheckCircle className="w-4 h-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {useCase}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
          Typical Results:
        </h4>
        <div className="space-y-2">
          {results.map((result, index) => (
            <div key={index} className="flex items-start">
              <TrendingDown className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {result}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function IndustriesPage() {
  const industries = [
    {
      icon: Building2,
      title: "Real Estate & Construction",
      description:
        "Smart buildings, green construction, portfolio optimization",
      gradient: "from-blue-500 to-cyan-500",
      stats: [
        { value: "45%", label: "Energy Savings" },
        { value: "60%", label: "Faster Reporting" },
        { value: "30%", label: "Cost Reduction" },
      ],
      useCases: [
        "Building energy optimization",
        "Tenant engagement programs",
        "LEED/BREEAM certification",
        "Portfolio-wide emissions tracking",
        "Smart building automation",
        "ESG reporting for investors",
      ],
      results: [
        "40-60% reduction in energy consumption",
        "25% improvement in tenant satisfaction",
        "90% faster compliance reporting",
        "15-30% increase in property values",
      ],
    },
    {
      icon: Factory,
      title: "Manufacturing",
      description:
        "Supply chain optimization, production efficiency, waste reduction",
      gradient: "from-purple-500 to-pink-500",
      stats: [
        { value: "35%", label: "Waste Reduction" },
        { value: "50%", label: "Faster Analysis" },
        { value: "25%", label: "Cost Savings" },
      ],
      useCases: [
        "Production line optimization",
        "Supply chain emissions tracking",
        "Waste stream analysis",
        "Energy consumption monitoring",
        "Product lifecycle assessment",
        "Regulatory compliance automation",
      ],
      results: [
        "30-50% reduction in manufacturing emissions",
        "20% improvement in resource efficiency",
        "40% faster supply chain visibility",
        "95% compliance automation success",
      ],
    },
    {
      icon: ShoppingCart,
      title: "Retail & E-commerce",
      description: "Store operations, supply chain, customer engagement",
      gradient: "from-pink-500 to-violet-500",
      stats: [
        { value: "40%", label: "Store Efficiency" },
        { value: "65%", label: "Customer Engagement" },
        { value: "20%", label: "Operational Savings" },
      ],
      useCases: [
        "Store energy management",
        "Sustainable packaging optimization",
        "Customer sustainability programs",
        "Inventory carbon footprinting",
        "Last-mile delivery optimization",
        "Supplier sustainability scoring",
      ],
      results: [
        "35% reduction in store energy costs",
        "60% improvement in packaging efficiency",
        "80% increase in customer sustainability engagement",
        "25% optimization in delivery routes",
      ],
    },
    {
      icon: Plane,
      title: "Transportation & Logistics",
      description: "Fleet optimization, route planning, fuel efficiency",
      gradient: "from-indigo-500 to-blue-500",
      stats: [
        { value: "30%", label: "Fuel Savings" },
        { value: "55%", label: "Route Optimization" },
        { value: "40%", label: "Emission Reduction" },
      ],
      useCases: [
        "Fleet fuel efficiency tracking",
        "Route optimization algorithms",
        "Modal shift analysis",
        "Cargo load optimization",
        "Alternative fuel planning",
        "Maintenance emission reduction",
      ],
      results: [
        "25-40% reduction in fuel consumption",
        "50% improvement in route efficiency",
        "35% decrease in maintenance emissions",
        "90% real-time fleet visibility",
      ],
    },
    {
      icon: Zap,
      title: "Energy & Utilities",
      description:
        "Grid optimization, renewable integration, demand management",
      gradient: "from-yellow-500 to-orange-500",
      stats: [
        { value: "50%", label: "Grid Efficiency" },
        { value: "70%", label: "Renewable Integration" },
        { value: "35%", label: "Demand Optimization" },
      ],
      useCases: [
        "Smart grid optimization",
        "Renewable energy forecasting",
        "Demand response programs",
        "Energy storage management",
        "Grid stability analysis",
        "Customer engagement platforms",
      ],
      results: [
        "45% improvement in grid efficiency",
        "60% better renewable integration",
        "30% reduction in peak demand",
        "85% customer satisfaction improvement",
      ],
    },
    {
      icon: TreePine,
      title: "Agriculture & Food",
      description:
        "Sustainable farming, food waste reduction, supply chain transparency",
      gradient: "from-green-500 to-emerald-500",
      stats: [
        { value: "35%", label: "Yield Improvement" },
        { value: "45%", label: "Water Savings" },
        { value: "30%", label: "Waste Reduction" },
      ],
      useCases: [
        "Precision agriculture optimization",
        "Food waste tracking and reduction",
        "Sustainable sourcing verification",
        "Carbon farming programs",
        "Supply chain traceability",
        "Regenerative agriculture planning",
      ],
      results: [
        "30% increase in crop yields",
        "40% reduction in water usage",
        "50% decrease in food waste",
        "25% improvement in soil health",
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
                Transforming Every Industry
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Industries We Serve
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">
                With Passion & Purpose
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              From manufacturing to agriculture, we&apos;re revolutionizing
              sustainability across every industry with AI-powered solutions
              that deliver real impact.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Industries Grid */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {industries.map((industry, index) => (
              <IndustryCard key={index} {...industry} />
            ))}
          </div>
        </div>
      </section>

      {/* Global Impact Section */}
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
                Global Impact
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Organizations worldwide are achieving their sustainability goals
              faster with our industry-specific solutions
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Users,
                value: "10,000+",
                label: "Organizations",
                description: "Across 50+ countries",
              },
              {
                icon: TrendingDown,
                value: "2.5M",
                label: "Tons CO₂ Saved",
                description: "Monthly impact",
              },
              {
                icon: Award,
                value: "99.2%",
                label: "Customer Success",
                description: "Meet their targets",
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
              Ready to Transform Your Industry?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join industry leaders who are already achieving remarkable
              sustainability results with blipee OS
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
                Schedule Demo
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
