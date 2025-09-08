"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Home,
  Sparkles,
  Brain,
  TrendingDown,
  Zap,
  Building2,
  Shield,
  ChartBar,
  Globe,
  CheckCircle,
  ArrowRight,
  Play,
  Star,
  Target,
  Building,
  Users,
  FileText,
  Gauge,
  Factory,
  Menu,
  X,
  ShoppingBag,
} from "lucide-react";

// Animated background component
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      <div className="absolute bottom-40 right-40 w-80 h-80 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-6000"></div>
    </div>
  );
}

// Hero section component
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
      <AnimatedBackground />

      <div className="relative max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-pink-400 mr-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              World&apos;s First Conversational Sustainability AI
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8">
            <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Sustainability Intelligence
            </span>
            <br />
            <span className="text-gray-900 dark:text-white">
              Through Conversation
            </span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 sm:mb-16 max-w-3xl mx-auto leading-relaxed px-4">
            Where AI meets sustainability with a touch of magic ✨ The
            revolution isn&apos;t coming—it&apos;s here, and it speaks your
            language. Welcome to the future where saving the planet feels like
            chatting with your smartest friend.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4 sm:px-0">
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto min-w-[200px] px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
              >
                Start 7-Minute Setup
                <ArrowRight className="ml-2 w-5 h-5" />
              </motion.button>
            </Link>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto min-w-[200px] px-8 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg font-medium text-base hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center"
            >
              <Play className="mr-2 w-5 h-5" />
              See AI in Action
            </motion.button>
          </div>
        </motion.div>

        {/* Removed floating elements to prevent overlap */}
      </div>
    </section>
  );
}

// Features section
function FeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: "100% Conversational",
      description:
        "No dashboards, no complex forms. Just ask your AI anything about sustainability",
      gradient: "from-pink-500 to-purple-500",
    },
    {
      icon: Gauge,
      title: "Scope 1, 2, 3 Tracking",
      description:
        "Complete emissions tracking across your entire value chain, automatically",
      gradient: "from-purple-500 to-indigo-500",
    },
    {
      icon: Target,
      title: "Science-Based Targets",
      description:
        "AI sets and tracks SBTi-aligned targets, ensuring you meet climate goals",
      gradient: "from-blue-500 to-indigo-500",
    },
    {
      icon: FileText,
      title: "Document Intelligence",
      description:
        "Upload any invoice, bill, or report. AI extracts emissions instantly",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Building2,
      title: "Building Excellence",
      description:
        "World-class building management capabilities integrated seamlessly",
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: Globe,
      title: "Compliance Automation",
      description:
        "Stay ahead of regulations with AI that monitors and ensures compliance",
      gradient: "from-indigo-500 to-purple-500",
    },
  ];

  return (
    <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Revolutionary Capabilities
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            The most advanced sustainability platform, powered by AI that
            predicts, advises, and acts
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={index === features.length - 1 && features.length % 2 !== 0 ? "col-span-2 lg:col-span-1" : ""}
            >
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg sm:shadow-xl border border-white/20 hover:shadow-2xl transition-all group h-full">
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r ${feature.gradient} rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-base sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Use cases section
function UseCasesSection() {
  const useCases = [
    {
      icon: Building2,
      title: "For Buildings",
      stats: "23 Billion sq ft",
      query: "Reduce our building emissions by 40% this year",
      response:
        "Analyzed your energy patterns and identified 2 optimization opportunities that will reduce emissions by 42% while saving $127,000 annually.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Factory,
      title: "For Manufacturing",
      stats: "45% reduction potential",
      query: "What's our carbon footprint per product unit?",
      response:
        "Each unit produces 12.7 kg CO₂e. Main hotspot: raw materials (45%). Switching to Supplier B for aluminum would reduce this by 23%.",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Zap,
      title: "For Energy",
      stats: "7 Active Sites",
      query: "Show me renewable energy performance across all sites",
      response:
        "Solar generation up 18% this month. Site 3 performing 30% above target. Recommend battery storage for Site 5 to capture $85K in grid credits.",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: ShoppingBag,
      title: "For Retail",
      stats: "1,247 Locations",
      query: "How can we achieve net zero by 2030?",
      response:
        "Created your roadmap: LED retrofits (Q2), renewable contracts (Q3), fleet electrification (Q4). This pathway achieves net zero by 2029.",
      gradient: "from-orange-500 to-red-500",
    },
  ];

  return (
    <section className="py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto h-full flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Works for{" "}
            <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Every Industry
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            See how organizations achieve their sustainability goals through
            conversation
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full bg-white/[0.02] backdrop-blur-sm rounded-xl p-4 border border-white/[0.05] hover:border-white/[0.1] transition-all">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 bg-gradient-to-r ${useCase.gradient} rounded-lg flex items-center justify-center shadow-lg`}
                  >
                    <useCase.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {useCase.title}
                    </h3>
                    <p className="text-xs text-gray-500">{useCase.stats}</p>
                  </div>
                </div>
                
                {/* Chat Interface */}
                <div className="space-y-2.5">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-xl border border-purple-500/30 rounded-xl rounded-tr-sm px-3.5 py-2">
                      <p className="text-sm text-gray-300">
                        {useCase.query}
                      </p>
                    </div>
                  </div>
                  
                  {/* AI Response */}
                  <div className="flex justify-start">
                    <div className="max-w-[85%]">
                      <div className={`bg-gradient-to-r ${useCase.gradient} p-[1px] rounded-xl rounded-tl-sm`}>
                        <div className="bg-black/90 backdrop-blur-xl rounded-xl rounded-tl-sm px-3.5 py-2">
                          <p className="text-sm text-gray-300 leading-snug">
                            {useCase.response}
                          </p>
                        </div>
                      </div>
                      {/* Typing indicator */}
                      <div className="flex items-center gap-1 mt-1 px-2">
                        <div className="flex gap-0.5">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                        </div>
                        <span className="text-[10px] text-white/40">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Stats and AI capabilities combined section
function StatsAndAISection() {
  const stats = [
    { value: "90%", label: "Reduction in Manual Work", suffix: "" },
    { value: "7", label: "Minutes to Full Setup", suffix: "min" },
    { value: "99.2", label: "AI Accuracy Rate", suffix: "%" },
    { value: "847", label: "Tons CO₂ Saved Daily", suffix: "t" },
  ];

  const capabilities = [
    "Emission tracking and forecasting",
    "Predictive analytics for equipment",
    "Compliance monitoring and alerts",
    "Supply chain optimization",
    "Science-based target setting",
    "Automated sustainability reporting",
    "Real-time energy optimization",
    "Carbon credit management",
    "Stakeholder communication",
    "Risk assessment and mitigation",
    "Investment ROI calculations",
    "Benchmark against peers",
  ];

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto h-full flex flex-col justify-center">
        {/* Stats Section */}
        <div className="relative overflow-hidden rounded-3xl mb-12">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600"></div>
          <div className="relative py-12 px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
                    {stat.value}
                    <span className="text-xl sm:text-2xl">{stat.suffix}</span>
                  </div>
                  <p className="text-white/80 text-xs sm:text-sm">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Capabilities Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              12 AI Brains Working{" "}
              <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                For You 24/7
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Our multi-brain AI architecture ensures every aspect of
              sustainability is covered, from real-time monitoring to predictive
              analytics and autonomous actions.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {capabilities.slice(0, 6).map((capability, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {capability}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 gap-3"
          >
            {capabilities.slice(6).map((capability, index) => (
              <div key={index + 6} className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {capability}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// CTA and Footer combined section
function CTAAndFooterSection() {
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* CTA Section */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
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
                onClick={() => setShowContactModal(true)}
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

        {/* Contact Modal */}
        {showContactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowContactModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-gray-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <button
                onClick={() => setShowContactModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h3 className="text-2xl font-bold text-white mb-4">Schedule a Demo</h3>
              <p className="text-gray-400 mb-6">
                Get in touch with our team to see blipee in action
              </p>
              
              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Company"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
                <textarea
                  placeholder="Tell us about your sustainability goals"
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
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
        {showSupportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSupportModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-gray-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <button
                onClick={() => setShowSupportModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h3 className="text-2xl font-bold text-white mb-4">Get Support</h3>
              <p className="text-gray-400 mb-6">
                Our team is here to help you succeed with blipee
              </p>
              
              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
                <select
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                >
                  <option value="" className="bg-gray-900">Select Issue Type</option>
                  <option value="technical" className="bg-gray-900">Technical Issue</option>
                  <option value="billing" className="bg-gray-900">Billing Question</option>
                  <option value="feature" className="bg-gray-900">Feature Request</option>
                  <option value="other" className="bg-gray-900">Other</option>
                </select>
                <textarea
                  placeholder="Describe your issue or question"
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
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

      {/* Simple Footer */}
      <footer className="bg-gray-900 text-white px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center gap-8">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Home className="w-6 h-6 text-white" />
              </div>
              <span className="ml-3 text-xl font-normal bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                blipee
              </span>
            </div>

            {/* Links */}
            <div className="flex flex-col items-center gap-4 text-sm text-gray-400">
              <div className="flex flex-wrap justify-center gap-6">
                <Link href="#features" className="hover:text-white transition-colors">Features</Link>
                <Link href="#use-cases" className="hover:text-white transition-colors">Industries</Link>
                <Link href="#ai-capabilities" className="hover:text-white transition-colors">AI Technology</Link>
                <Link href="/about" className="hover:text-white transition-colors">About</Link>
                <button onClick={() => setShowSupportModal(true)} className="hover:text-white transition-colors">Support</button>
                <button onClick={() => setShowContactModal(true)} className="hover:text-white transition-colors">Contact</button>
              </div>
              <div className="flex flex-wrap justify-center gap-6 border-t border-gray-700 pt-4">
                <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
                <Link href="/terms-of-use" className="hover:text-white transition-colors">Terms</Link>
                <Link href="/cookie-policy" className="hover:text-white transition-colors">Cookies</Link>
                <Link href="/security-policy" className="hover:text-white transition-colors">Security</Link>
                <Link href="/data-processing-agreement" className="hover:text-white transition-colors">DPA</Link>
              </div>
            </div>

            {/* Copyright */}
            <p className="text-sm text-gray-400">
              © 2025 blipee. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Home className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="ml-2 text-lg sm:text-xl font-normal bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                blipee
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

            <div className="hidden md:flex items-center gap-4">
              <Link href="/signin">
                <button className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium">
                  Sign In
                </button>
              </Link>
              <Link href="/signup">
                <button className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all">
                  Get Started
                </button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
          >
            <div className="px-4 py-4 space-y-3">
              <Link href="/features" className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white py-2">
                Features
              </Link>
              <Link href="/industries" className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white py-2">
                Industries
              </Link>
              <Link href="/ai-technology" className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white py-2">
                AI Technology
              </Link>
              <Link href="/about" className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white py-2">
                About
              </Link>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-800 space-y-3">
                <Link href="/signin" className="block">
                  <button className="w-full py-2 text-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium">
                    Sign In
                  </button>
                </Link>
                <Link href="/signup" className="block">
                  <button className="w-full px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all">
                    Get Started
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Main content */}
      <main className="relative">
        {/* Hero Section - Full viewport */}
        <section className="min-h-screen flex items-center">
          <HeroSection />
        </section>

        {/* Section Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Features Section - Full viewport */}
        <section id="features" className="min-h-screen flex items-center">
          <FeaturesSection />
        </section>

        {/* Section Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Use Cases Section - Full viewport */}
        <section className="min-h-screen flex items-center">
          <UseCasesSection />
        </section>

        {/* Section Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Stats and AI Capabilities Combined - Full viewport */}
        <section id="ai-capabilities" className="min-h-screen flex items-center">
          <StatsAndAISection />
        </section>

        {/* Section Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* CTA and Footer Combined - Full viewport */}
        <CTAAndFooterSection />
      </main>
    </div>
  );
}
