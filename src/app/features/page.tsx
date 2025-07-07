"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  MessageSquare,
  ChartBar,
  Globe,
  Shield,
  Zap,
  Target,
  FileText,
  Building2,
  TreePine,
  Users,
  Sparkles,
  Home,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Cloud,
  Lock,
  Gauge,
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

// Feature category component
function FeatureCategory({
  title,
  description,
  features,
  icon: Icon,
  gradient,
}: {
  title: string;
  description: string;
  features: string[];
  icon: any;
  gradient: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mb-20"
    >
      <div className="flex items-center mb-6">
        <div
          className={`w-14 h-14 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center mr-4`}
        >
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-1">
            {description}
          </p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 ml-18">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="flex items-start"
          >
            <CheckCircle className="w-5 h-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default function FeaturesPage() {
  const featureCategories = [
    {
      icon: MessageSquare,
      title: "Conversational AI",
      description: "Natural language interaction that feels human",
      gradient: "from-pink-500 to-purple-500",
      features: [
        "Ask anything in plain English",
        "Context-aware responses",
        "Multi-turn conversations",
        "Voice input support",
        "Instant AI insights",
        "Personalized recommendations",
        "24/7 availability",
        "Multi-language support",
        "Emotion-aware responses",
      ],
    },
    {
      icon: ChartBar,
      title: "Dynamic Visualization",
      description: "AI generates the perfect chart for every conversation",
      gradient: "from-purple-500 to-indigo-500",
      features: [
        "Auto-generated dashboards",
        "Real-time data updates",
        "Interactive 3D models",
        "Custom report builder",
        "Trend analysis",
        "Predictive visualizations",
        "Export to any format",
        "Mobile-responsive design",
        "Branded templates",
      ],
    },
    {
      icon: Target,
      title: "Sustainability Tracking",
      description: "Complete emissions management made simple",
      gradient: "from-indigo-500 to-blue-500",
      features: [
        "Scope 1, 2, 3 emissions",
        "Science-based targets",
        "Carbon credit management",
        "Supply chain tracking",
        "Regulatory compliance",
        "ESG reporting",
        "Benchmark analysis",
        "Goal progress tracking",
        "Offset recommendations",
      ],
    },
    {
      icon: FileText,
      title: "Document Intelligence",
      description: "Turn any document into actionable sustainability data",
      gradient: "from-purple-500 to-pink-500",
      features: [
        "Invoice scanning",
        "Utility bill parsing",
        "Travel receipt analysis",
        "PDF data extraction",
        "Image recognition",
        "Automatic categorization",
        "Multi-format support",
        "Batch processing",
        "Error validation",
      ],
    },
    {
      icon: Brain,
      title: "Predictive Analytics",
      description: "See the future with AI-powered predictions",
      gradient: "from-pink-500 to-violet-500",
      features: [
        "Emission forecasting",
        "Equipment failure prediction",
        "Energy optimization",
        "Cost projections",
        "Weather impact analysis",
        "Anomaly detection",
        "Risk assessment",
        "Investment ROI",
        "Scenario modeling",
      ],
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade security with complete transparency",
      gradient: "from-violet-500 to-purple-500",
      features: [
        "End-to-end encryption",
        "SOC 2 compliance",
        "GDPR ready",
        "Role-based access",
        "Audit logging",
        "Data residency options",
        "API security",
        "Single sign-on",
        "Multi-factor auth",
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
                className="text-gray-900 dark:text-white font-medium"
              >
                Features
              </Link>
              <Link
                href="/industries"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
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
              <Sparkles className="w-4 h-4 text-pink-400 mr-2" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Every feature designed for impact
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Features that Transform
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">
                Sustainability Management
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              From conversational AI to predictive analytics, every feature is
              crafted to make sustainability simple, actionable, and impactful.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          {featureCategories.map((category, index) => (
            <FeatureCategory key={index} {...category} />
          ))}
        </div>
      </section>

      {/* Integration Section */}
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
                Seamless Integrations
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Connect with your existing tools and data sources
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Cloud, name: "Cloud Platforms", count: "15+" },
              { icon: Building2, name: "Building Systems", count: "50+" },
              { icon: FileText, name: "Document Types", count: "100+" },
              { icon: Globe, name: "Data Sources", count: "200+" },
            ].map((integration, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 text-center"
              >
                <integration.icon className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  {integration.name}
                </h3>
                <p className="text-3xl font-bold text-purple-600">
                  {integration.count}
                </p>
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
              Experience the Future of Sustainability
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of organizations transforming their sustainability
              journey with AI
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white text-gray-900 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white/20 backdrop-blur-sm border-2 border-white text-white rounded-full font-semibold text-lg shadow-lg hover:bg-white/30 transition-all"
              >
                Request Demo
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
