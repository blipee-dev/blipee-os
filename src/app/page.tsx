"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/providers/ThemeProvider";
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
  Sun,
  Moon,
} from "lucide-react";

// Animated background component
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -right-40 w-64 sm:w-80 h-64 sm:h-80 bg-pink-300 dark:bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-20 animate-blob"></div>
      <div className="absolute -bottom-40 -left-40 w-64 sm:w-80 h-64 sm:h-80 bg-purple-300 dark:bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute top-40 left-40 w-64 sm:w-80 h-64 sm:h-80 bg-indigo-300 dark:bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-20 animate-blob animation-delay-4000"></div>
      <div className="absolute bottom-40 right-40 w-64 sm:w-80 h-64 sm:h-80 bg-violet-300 dark:bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-20 animate-blob animation-delay-6000"></div>
    </div>
  );
}

// Hero section component
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <AnimatedBackground />

      <div className="relative max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-black/10 dark:bg-white/10 backdrop-blur-sm border border-black/20 dark:border-white/20 rounded-full mb-6 sm:mb-8" role="note" aria-label="Product highlight">
            <Sparkles className="w-4 h-4 text-pink-500 dark:text-pink-400 mr-2" aria-hidden="true" />
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              World&apos;s First Conversational Sustainability AI
            </span>
          </div>

          <h1 id="hero-heading" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 sm:mb-8">
            <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Sustainability Intelligence
            </span>
            <br />
            <span className="text-gray-900 dark:text-white">
              Through Conversation
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 dark:text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-2 sm:px-4">
            Where AI meets sustainability with a touch of magic ✨ The
            revolution isn&apos;t coming—it&apos;s here, and it speaks your
            language. Welcome to the future where saving the planet feels like
            chatting with your smartest friend.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2 sm:px-4 lg:px-0 max-w-lg sm:max-w-none mx-auto">
            <Link href="/signin" className="order-2 sm:order-1">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto min-w-[200px] px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold shadow-2xl hover:shadow-3xl transition-all flex items-center justify-center text-base sm:text-lg relative overflow-hidden group"
                aria-label="Sign in to dashboard"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10">Sign In to Dashboard</span>
                <ArrowRight className="ml-2 w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto min-w-[180px] px-6 py-3 bg-transparent border-2 border-gray-900/20 dark:border-white/80 text-gray-900 dark:text-white rounded-xl font-medium hover:bg-gray-900/5 dark:hover:bg-white/10 hover:border-gray-900/30 dark:hover:border-white transition-all flex items-center justify-center order-1 sm:order-2"
              aria-label="Request platform access"
            >
              Request Access
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
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#111111]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 id="features-heading" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Revolutionary Capabilities
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            The most advanced sustainability platform, powered by AI that
            predicts, advises, and acts
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8" role="list">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={index === features.length - 1 && features.length % 2 !== 0 ? "sm:col-span-2 lg:col-span-1" : ""}
              role="listitem"
            >
              <article className="bg-black/[0.02] dark:bg-white/[0.02] backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg sm:shadow-xl border border-black/[0.05] dark:border-white/[0.05] hover:shadow-2xl transition-all group h-full focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-offset-2">
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r ${feature.gradient} rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform`}
                  aria-hidden="true"
                >
                  <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </article>
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
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 id="use-cases-heading" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-gray-900 dark:text-white">Works for</span>{" "}
            <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Every Industry
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
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
              <div className="h-full bg-black/[0.02] dark:bg-white/[0.02] backdrop-blur-sm rounded-xl p-4 border border-black/[0.05] dark:border-white/[0.05] hover:border-black/[0.1] dark:hover:border-white/[0.1] transition-all">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 bg-gradient-to-r ${useCase.gradient} rounded-lg flex items-center justify-center shadow-lg`}
                  >
                    <useCase.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {useCase.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-500">{useCase.stats}</p>
                  </div>
                </div>
                
                {/* Chat Interface */}
                <div className="space-y-2.5">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-xl border border-purple-500/30 rounded-xl rounded-tr-sm px-3.5 py-2">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {useCase.query}
                      </p>
                    </div>
                  </div>
                  
                  {/* AI Response */}
                  <div className="flex justify-start">
                    <div className="max-w-[85%]">
                      <div className={`bg-gradient-to-r ${useCase.gradient} p-[1px] rounded-xl rounded-tl-sm`}>
                        <div className="bg-white/90 dark:bg-black/90 backdrop-blur-xl rounded-xl rounded-tl-sm px-3.5 py-2">
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
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
                        <span className="text-[10px] text-black/40 dark:text-white/40">AI is thinking...</span>
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
    { value: "5", label: "Minutes to Full Setup", suffix: "min" },
    { value: "99.2", label: "AI Accuracy Rate", suffix: "%" },
    { value: "100", label: "Regulatory Compliance", suffix: "%" },
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
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Stats Section */}
        <div className="relative overflow-hidden rounded-3xl mb-8 sm:mb-12">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600"></div>
          <div className="relative py-8 sm:py-12 px-4 sm:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 id="ai-capabilities-heading" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-center lg:text-left">
            <span className="text-gray-900 dark:text-white">12 AI Brains Working</span>{" "}
            <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              For You 24/7
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed text-center lg:text-left max-w-3xl mx-auto lg:mx-0">
            Our multi-brain AI architecture ensures every aspect of
            sustainability is covered, from real-time monitoring to predictive
            analytics and autonomous actions.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {capabilities.map((capability, index) => (
              <motion.div 
                key={index} 
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {capability}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// CTA and Footer combined section
function CTAAndFooterSection() {
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  return (
    <div className="bg-white dark:bg-[#111111]">
      {/* CTA Section */}
      <div className="relative overflow-hidden py-20 lg:py-24 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600">
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

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-lg sm:max-w-none mx-auto">
              <Link href="/signin" className="order-2 sm:order-1">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto min-w-[200px] px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold shadow-2xl hover:shadow-3xl hover:bg-gray-50 transition-all flex items-center justify-center text-base sm:text-lg relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10">Sign In to Dashboard</span>
                  <ArrowRight className="ml-2 w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>

              <motion.button
                onClick={() => setShowContactModal(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto min-w-[180px] px-6 py-3 bg-transparent border-2 border-white/80 text-white rounded-xl font-medium hover:bg-white/10 hover:border-white transition-all flex items-center justify-center order-1 sm:order-2"
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
              className="relative bg-white dark:bg-[#212121] border border-gray-200 dark:border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <button
                onClick={() => setShowContactModal(false)}
                className="absolute top-4 right-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Schedule a Demo</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Get in touch with our team to see blipee in action
              </p>
              
              <form className="space-y-4">
                <div>
                  <label htmlFor="contact-name" className="sr-only">Your Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    placeholder="Your Name"
                    required
                    aria-required="true"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:border-purple-500 focus:outline-none min-h-[48px]"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="sr-only">Email Address</label>
                  <input
                    id="contact-email"
                    type="email"
                    placeholder="Email Address"
                    required
                    aria-required="true"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:border-purple-500 focus:outline-none min-h-[48px]"
                  />
                </div>
                <div>
                  <label htmlFor="contact-company" className="sr-only">Company</label>
                  <input
                    id="contact-company"
                    type="text"
                    placeholder="Company"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:border-purple-500 focus:outline-none min-h-[48px]"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="sr-only">Tell us about your sustainability goals</label>
                  <textarea
                    id="contact-message"
                    placeholder="Tell us about your sustainability goals"
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:border-purple-500 focus:outline-none resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 min-h-[48px]"
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
              className="relative bg-white dark:bg-[#212121] border border-gray-200 dark:border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <button
                onClick={() => setShowSupportModal(false)}
                className="absolute top-4 right-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Get Support</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Our team is here to help you succeed with blipee
              </p>
              
              <form className="space-y-4">
                <div>
                  <label htmlFor="support-name" className="sr-only">Your Name</label>
                  <input
                    id="support-name"
                    type="text"
                    placeholder="Your Name"
                    required
                    aria-required="true"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:border-purple-500 focus:outline-none min-h-[48px]"
                  />
                </div>
                <div>
                  <label htmlFor="support-email" className="sr-only">Email Address</label>
                  <input
                    id="support-email"
                    type="email"
                    placeholder="Email Address"
                    required
                    aria-required="true"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:border-purple-500 focus:outline-none min-h-[48px]"
                  />
                </div>
                <div>
                  <label htmlFor="support-issue-type" className="sr-only">Issue Type</label>
                  <select
                    id="support-issue-type"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:border-purple-500 focus:outline-none min-h-[48px]"
                  >
                    <option value="" className="bg-white dark:bg-[#212121]">Select Issue Type</option>
                    <option value="technical" className="bg-white dark:bg-[#212121]">Technical Issue</option>
                    <option value="billing" className="bg-white dark:bg-[#212121]">Billing Question</option>
                    <option value="feature" className="bg-white dark:bg-[#212121]">Feature Request</option>
                    <option value="other" className="bg-white dark:bg-[#212121]">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="support-description" className="sr-only">Describe your issue or question</label>
                  <textarea
                    id="support-description"
                    placeholder="Describe your issue or question"
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:border-purple-500 focus:outline-none resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 min-h-[48px]"
                >
                  Submit Request
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#111111] text-gray-900 dark:text-white px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center gap-8">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="w-10 h-10 p-0.5 rounded-xl" style={{background: 'linear-gradient(to bottom right, rgb(236, 72, 153), rgb(147, 51, 234))'}}>
                <div className="w-full h-full bg-white/95 dark:bg-[#212121] rounded-[10px] flex items-center justify-center">
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
                <Link href="/features" className="hover:text-gray-900 dark:hover:text-white transition-colors">Features</Link>
                <Link href="/industries" className="hover:text-gray-900 dark:hover:text-white transition-colors">Industries</Link>
                <Link href="/ai-technology" className="hover:text-gray-900 dark:hover:text-white transition-colors">AI Technology</Link>
                <Link href="/about" className="hover:text-gray-900 dark:hover:text-white transition-colors">About</Link>
                <button onClick={() => setShowContactModal(true)} className="hover:text-gray-900 dark:hover:text-white transition-colors">Contact</button>
                <button onClick={() => setShowSupportModal(true)} className="hover:text-gray-900 dark:hover:text-white transition-colors">Support</button>
              </div>
              <div className="flex flex-wrap justify-center gap-6 border-t border-gray-300 dark:border-gray-700 pt-4">
                <Link href="/terms-of-use" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms</Link>
                <Link href="/privacy-policy" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</Link>
                <Link href="/cookie-policy" className="hover:text-gray-900 dark:hover:text-white transition-colors">Cookies</Link>
                <Link href="/security-policy" className="hover:text-gray-900 dark:hover:text-white transition-colors">Security</Link>
                <Link href="/data-processing-agreement" className="hover:text-gray-900 dark:hover:text-white transition-colors">DPA</Link>
              </div>
            </div>
            
            {/* Copyright */}
            <p className="text-sm text-gray-600 dark:text-gray-400">
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
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111] transition-colors duration-300">
      {/* Skip Navigation */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-purple-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#111111]/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-lg" aria-label="Go to homepage">
              <div className="w-8 h-8 sm:w-10 sm:h-10 p-0.5 rounded-xl" style={{background: 'linear-gradient(to bottom right, rgb(236, 72, 153), rgb(147, 51, 234))'}}>
                <div className="w-full h-full bg-white/95 dark:bg-[#212121] rounded-[10px] flex items-center justify-center">
                  <Home className="w-5 h-5 sm:w-6 sm:h-6" stroke="url(#homeGradient)" fill="none" strokeWidth="2" aria-hidden="true" />
                  <svg width="0" height="0" aria-hidden="true">
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
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Theme Toggle Button */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full p-[1px] bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500">
                <button
                  onClick={toggleTheme}
                  className="w-full h-full rounded-full bg-white/95 dark:bg-black/95 hover:bg-white/90 dark:hover:bg-black/90 transition-all flex items-center justify-center focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
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
              
              <Link href="/signin">
                <button className="px-4 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 text-sm sm:text-base min-h-[44px]">
                  Sign In
                </button>
              </Link>
              
              {/* Menu button for all screen sizes */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 flex items-center justify-center focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-lg min-h-[44px] min-w-[44px]"
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? (
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
        </div>

        {/* Navigation Menu - shows on all screen sizes */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute right-0 top-full mt-2 w-full md:w-64 bg-white/90 dark:bg-[#111111]/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700 rounded-lg py-4 shadow-2xl"
          >
            <div className="flex flex-col space-y-1">
              <Link href="/features" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors">Features</Link>
              <Link href="/industries" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors">Industries</Link>
              <Link href="/ai-technology" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors">AI Technology</Link>
              <Link href="/about" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors">About</Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Main content */}
      <main className="relative" id="main-content">
        {/* Hero Section - Full viewport */}
        <HeroSection />

        {/* Section Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300/50 dark:via-white/10 to-transparent" />

        {/* Features Section */}
        <FeaturesSection />

        {/* Section Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300/50 dark:via-white/10 to-transparent" />

        {/* Use Cases Section */}
        <UseCasesSection />

        {/* Section Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300/50 dark:via-white/10 to-transparent" />

        {/* Stats and AI Capabilities Combined */}
        <StatsAndAISection />

        {/* Section Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300/50 dark:via-white/10 to-transparent" />

        {/* CTA and Footer Combined */}
        <CTAAndFooterSection />
      </main>
    </div>
  );
}
