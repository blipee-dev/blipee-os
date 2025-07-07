"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  Cpu,
  Zap,
  Shield,
  Cloud,
  Eye,
  MessageSquare,
  Target,
  BarChart3,
  Sparkles,
  Home,
  ArrowRight,
  CheckCircle,
  Globe,
  Lock,
  Gauge,
  TrendingUp,
  Network,
  Database,
  Layers,
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

// Technology component
function TechnologyCard({
  icon: Icon,
  title,
  description,
  features,
  gradient,
}: {
  icon: any;
  title: string;
  description: string;
  features: string[];
  gradient: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all group"
    >
      <div
        className={`w-14 h-14 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
      >
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-6">{description}</p>
      <div className="space-y-2">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start">
            <CheckCircle className="w-4 h-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {feature}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Brain visualization component
function AIBrainVisualization() {
  return (
    <div className="relative w-full h-96 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 rounded-2xl overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="grid grid-cols-4 gap-6 w-full max-w-md">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                repeat: Infinity,
                duration: 3,
                delay: i * 0.2,
              }}
              className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <Brain className="w-6 h-6 text-white" />
            </motion.div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <p className="text-center text-gray-600 dark:text-gray-300 font-semibold">
          12 AI Brains Working Together
        </p>
      </div>
    </div>
  );
}

export default function AITechnologyPage() {
  const technologies = [
    {
      icon: Brain,
      title: "Multi-Brain Architecture",
      description:
        "12 specialized AI models working in harmony for comprehensive sustainability intelligence",
      gradient: "from-pink-500 to-purple-500",
      features: [
        "Context-aware conversation engine",
        "Predictive analytics brain",
        "Document intelligence processor",
        "Visual analysis system",
        "Recommendation engine",
        "Action planning module",
        "Compliance monitoring AI",
        "Real-time data orchestrator",
      ],
    },
    {
      icon: MessageSquare,
      title: "Natural Language Processing",
      description:
        "Advanced NLP that understands sustainability context and industry terminology",
      gradient: "from-purple-500 to-indigo-500",
      features: [
        "Multi-language support (50+ languages)",
        "Industry-specific vocabulary",
        "Intent recognition & context retention",
        "Emotional intelligence in responses",
        "Technical document comprehension",
        "Voice-to-text integration",
        "Real-time translation",
        "Sentiment analysis",
      ],
    },
    {
      icon: Eye,
      title: "Computer Vision",
      description:
        "Extract sustainability data from any visual document or image automatically",
      gradient: "from-indigo-500 to-blue-500",
      features: [
        "Invoice & receipt scanning",
        "Utility bill data extraction",
        "Image-to-emissions calculation",
        "OCR with 99.8% accuracy",
        "Handwriting recognition",
        "Chart & graph analysis",
        "Equipment condition assessment",
        "Aerial imagery analysis",
      ],
    },
    {
      icon: TrendingUp,
      title: "Predictive Analytics",
      description:
        "Forecast future emissions, costs, and sustainability performance with precision",
      gradient: "from-blue-500 to-cyan-500",
      features: [
        "Equipment failure prediction",
        "Energy consumption forecasting",
        "Weather impact modeling",
        "Cost projection algorithms",
        "Risk assessment automation",
        "Anomaly detection system",
        "Seasonal pattern recognition",
        "ROI optimization models",
      ],
    },
    {
      icon: Network,
      title: "Real-Time Orchestration",
      description:
        "Seamlessly coordinate between multiple AI providers for optimal performance",
      gradient: "from-cyan-500 to-teal-500",
      features: [
        "Multi-provider fallback system",
        "Load balancing algorithms",
        "Response time optimization",
        "Quality assurance monitoring",
        "Cost optimization engine",
        "Regional compliance routing",
        "Performance analytics",
        "Automatic scaling",
      ],
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description:
        "Enterprise-grade security with privacy-first design and full transparency",
      gradient: "from-purple-500 to-pink-500",
      features: [
        "End-to-end encryption (AES-256)",
        "Zero-knowledge architecture",
        "SOC 2 Type II compliant",
        "GDPR & CCPA ready",
        "On-premise deployment options",
        "Audit trail for all operations",
        "Role-based access control",
        "Data residency compliance",
      ],
    },
  ];

  const providers = [
    {
      name: "DeepSeek",
      role: "Primary reasoning engine",
      features: [
        "Cost-effective processing",
        "Advanced reasoning",
        "Fast response",
      ],
    },
    {
      name: "OpenAI",
      role: "Complex analysis & creativity",
      features: [
        "GPT-4 integration",
        "Advanced reasoning",
        "Creative solutions",
      ],
    },
    {
      name: "Anthropic",
      role: "Safety & accuracy",
      features: ["Constitutional AI", "Safety alignment", "Accurate outputs"],
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
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Industries
              </Link>
              <Link
                href="/ai-technology"
                className="text-gray-900 dark:text-white font-medium"
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
              <Cpu className="w-4 h-4 text-pink-400 mr-2" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Next-Generation AI Technology
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                The AI Behind
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">
                Sustainability Magic
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Discover the revolutionary multi-brain AI architecture that makes
              sustainability management feel like magic. 12 specialized AI
              models working together to transform how you achieve your
              environmental goals.
            </p>
          </motion.div>
        </div>
      </section>

      {/* AI Brain Visualization */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Multi-Brain Architecture
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Each brain specializes in different aspects of sustainability
            </p>
          </motion.div>
          <AIBrainVisualization />
        </div>
      </section>

      {/* Technology Grid */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {technologies.map((tech, index) => (
              <TechnologyCard key={index} {...tech} />
            ))}
          </div>
        </div>
      </section>

      {/* AI Providers Section */}
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
                Best-in-Class AI Providers
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We partner with the world&apos;s leading AI providers to ensure
              optimal performance, reliability, and cost-effectiveness
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {providers.map((provider, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-xl rounded-2xl p-8 text-center shadow-xl border border-white/20"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                  {provider.name}
                </h3>
                <p className="text-purple-600 font-medium mb-4">
                  {provider.role}
                </p>
                <div className="space-y-2">
                  {provider.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-purple-500 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Stats */}
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
                Performance That Scales
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Built for enterprise-scale sustainability management
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Zap,
                value: "<2s",
                label: "Response Time",
                description: "Average AI response",
              },
              {
                icon: Gauge,
                value: "99.9%",
                label: "Uptime",
                description: "Service availability",
              },
              {
                icon: Database,
                value: "1M+",
                label: "Documents/Day",
                description: "Processing capacity",
              },
              {
                icon: Globe,
                value: "50+",
                label: "Languages",
                description: "Supported worldwide",
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
              Experience the Future of AI
            </h2>
            <p className="text-xl text-white/90 mb-8">
              See how our revolutionary AI technology can transform your
              sustainability journey
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white text-gray-900 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center"
                >
                  Try the AI Demo
                  <ArrowRight className="ml-2 w-5 h-5" />
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white/20 backdrop-blur-sm border-2 border-white text-white rounded-full font-semibold text-lg shadow-lg hover:bg-white/30 transition-all"
              >
                Technical Deep Dive
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
