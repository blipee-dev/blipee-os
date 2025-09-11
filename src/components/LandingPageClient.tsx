"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/providers/ThemeProvider";
import Tooltip from "@/components/ui/Tooltip";
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

interface TranslationsType {
  navigation: {
    features: string;
    industries: string;
    aiTechnology: string;
    about: string;
    signIn: string;
    menu: string;
  };
  hero: {
    tagline: string;
    headline1: string;
    headline2: string;
    mainDescription: string;
    signInToDashboard: string;
    requestAccess: string;
  };
  landing: {
    skipToContent: string;
    features: {
      title: string;
      subtitle: string;
      conversational: {
        title: string;
        description: string;
      };
      scopeTracking: {
        title: string;
        description: string;
      };
      scienceTargets: {
        title: string;
        description: string;
      };
      documentIntelligence: {
        title: string;
        description: string;
      };
      buildingExcellence: {
        title: string;
        description: string;
      };
      complianceAutomation: {
        title: string;
        description: string;
      };
    };
    useCases: {
      title: string;
      titleHighlight: string;
      subtitle: string;
      buildings: {
        title: string;
        stats: string;
        query: string;
        response: string;
      };
      manufacturing: {
        title: string;
        stats: string;
        query: string;
        response: string;
      };
      energy: {
        title: string;
        stats: string;
        query: string;
        response: string;
      };
      retail: {
        title: string;
        stats: string;
        query: string;
        response: string;
      };
      aiThinking: string;
    };
    stats: {
      reductionInWork: string;
      reductionInWorkValue: string;
      minutesToSetup: string;
      minutesToSetupValue: string;
      aiAccuracy: string;
      aiAccuracyValue: string;
      compliance: string;
      complianceValue: string;
    };
    aiCapabilities: {
      title: string;
      titleHighlight: string;
      subtitle: string;
      capabilities: string[];
    };
    cta: {
      title: string;
      subtitle: string;
      signInButton: string;
      requestButton: string;
      footer: string;
    };
    contactModal: {
      title: string;
      subtitle: string;
      namePlaceholder: string;
      emailPlaceholder: string;
      companyPlaceholder: string;
      messagePlaceholder: string;
      submitButton: string;
    };
    supportModal: {
      title: string;
      subtitle: string;
      namePlaceholder: string;
      emailPlaceholder: string;
      issueTypePlaceholder: string;
      issueTypes: {
        technical: string;
        billing: string;
        feature: string;
        other: string;
      };
      descriptionPlaceholder: string;
      submitButton: string;
    };
  };
  footer: {
    features: string;
    industries: string;
    aiTechnology: string;
    about: string;
    contact: string;
    support: string;
    terms: string;
    privacy: string;
    cookies: string;
    security: string;
    dpa: string;
    copyright: string;
  };
}

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
function HeroSection({ t }: { t: TranslationsType }) {
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
              {t.hero.tagline}
            </span>
          </div>

          <h1 id="hero-heading" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 sm:mb-8">
            <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {t.hero.headline1}
            </span>
            <br />
            <span className="text-gray-900 dark:text-white">
              {t.hero.headline2}
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 dark:text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-2 sm:px-4">
            {t.hero.mainDescription}
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
                <span className="relative z-10">{t.hero.signInToDashboard}</span>
                <ArrowRight className="ml-2 w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto min-w-[180px] px-6 py-3 bg-transparent border-2 border-gray-900/20 dark:border-white/80 text-gray-900 dark:text-white rounded-xl font-medium hover:bg-gray-900/5 dark:hover:bg-white/10 hover:border-gray-900/30 dark:hover:border-white transition-all flex items-center justify-center order-1 sm:order-2"
              aria-label="Request platform access"
            >
              {t.hero.requestAccess}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Features section
function FeaturesSection({ t }: { t: TranslationsType }) {
  const features = [
    {
      icon: Brain,
      title: t.landing.features.conversational.title,
      description: t.landing.features.conversational.description,
      gradient: "from-pink-500 to-purple-500",
    },
    {
      icon: Gauge,
      title: t.landing.features.scopeTracking.title,
      description: t.landing.features.scopeTracking.description,
      gradient: "from-purple-500 to-indigo-500",
    },
    {
      icon: Target,
      title: t.landing.features.scienceTargets.title,
      description: t.landing.features.scienceTargets.description,
      gradient: "from-blue-500 to-indigo-500",
    },
    {
      icon: FileText,
      title: t.landing.features.documentIntelligence.title,
      description: t.landing.features.documentIntelligence.description,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Building2,
      title: t.landing.features.buildingExcellence.title,
      description: t.landing.features.buildingExcellence.description,
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: Globe,
      title: t.landing.features.complianceAutomation.title,
      description: t.landing.features.complianceAutomation.description,
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
              {t.landing.features.title}
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {t.landing.features.subtitle}
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
              <article className="bg-white dark:bg-[#212121] rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg sm:shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all group h-full">
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
function UseCasesSection({ t }: { t: TranslationsType }) {
  const useCases = [
    {
      icon: Building2,
      title: t.landing.useCases.buildings.title,
      stats: t.landing.useCases.buildings.stats,
      query: t.landing.useCases.buildings.query,
      response: t.landing.useCases.buildings.response,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Factory,
      title: t.landing.useCases.manufacturing.title,
      stats: t.landing.useCases.manufacturing.stats,
      query: t.landing.useCases.manufacturing.query,
      response: t.landing.useCases.manufacturing.response,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Zap,
      title: t.landing.useCases.energy.title,
      stats: t.landing.useCases.energy.stats,
      query: t.landing.useCases.energy.query,
      response: t.landing.useCases.energy.response,
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: ShoppingBag,
      title: t.landing.useCases.retail.title,
      stats: t.landing.useCases.retail.stats,
      query: t.landing.useCases.retail.query,
      response: t.landing.useCases.retail.response,
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
            <span className="text-gray-900 dark:text-white">{t.landing.useCases.title}</span>{" "}
            <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {t.landing.useCases.titleHighlight}
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            {t.landing.useCases.subtitle}
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
              <div className="h-full bg-white dark:bg-[#212121] rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
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
                    <div className="max-w-[85%] bg-[#616161] dark:bg-[#616161] border border-gray-600 dark:border-gray-600 rounded-xl rounded-tr-sm px-3.5 py-2">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {useCase.query}
                      </p>
                    </div>
                  </div>
                  
                  {/* AI Response */}
                  <div className="flex justify-start">
                    <div className="max-w-[85%]">
                      <div className={`bg-gradient-to-r ${useCase.gradient} p-[1px] rounded-xl rounded-tl-sm`}>
                        <div className="bg-white dark:bg-[#212121] rounded-xl rounded-tl-sm px-3.5 py-2">
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
                        <span className="text-[10px] text-black/40 dark:text-white/40">{t.landing.useCases.aiThinking}</span>
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
function StatsAndAISection({ t }: { t: TranslationsType }) {
  const stats = [
    { value: t.landing.stats.reductionInWorkValue, label: t.landing.stats.reductionInWork, suffix: "" },
    { value: t.landing.stats.minutesToSetupValue.replace("min", ""), label: t.landing.stats.minutesToSetup, suffix: "min" },
    { value: t.landing.stats.aiAccuracyValue.replace("%", ""), label: t.landing.stats.aiAccuracy, suffix: "%" },
    { value: t.landing.stats.complianceValue.replace("%", ""), label: t.landing.stats.compliance, suffix: "%" },
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
            <span className="text-gray-900 dark:text-white">{t.landing.aiCapabilities.title}</span>{" "}
            <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {t.landing.aiCapabilities.titleHighlight}
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed text-center lg:text-left max-w-3xl mx-auto lg:mx-0">
            {t.landing.aiCapabilities.subtitle}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.landing.aiCapabilities.capabilities.map((capability, index) => (
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
function CTAAndFooterSection({ t }: { t: TranslationsType }) {
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
              {t.landing.cta.title}
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              {t.landing.cta.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-lg sm:max-w-none mx-auto">
              <Link href="/signin" className="order-2 sm:order-1">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto min-w-[200px] px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold shadow-2xl hover:shadow-3xl hover:bg-gray-50 transition-all flex items-center justify-center text-base sm:text-lg relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10">{t.landing.cta.signInButton}</span>
                  <ArrowRight className="ml-2 w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>

              <motion.button
                onClick={() => setShowContactModal(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto min-w-[180px] px-6 py-3 bg-transparent border-2 border-white/80 text-white rounded-xl font-medium hover:bg-white/10 hover:border-white transition-all flex items-center justify-center order-1 sm:order-2"
              >
                {t.landing.cta.requestButton}
              </motion.button>
            </div>


            <p className="mt-6 text-white/70 text-sm">
              {t.landing.cta.footer}
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
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t.landing.contactModal.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t.landing.contactModal.subtitle}
              </p>
              
              <form className="space-y-4">
                <div>
                  <label htmlFor="contact-name" className="sr-only">{t.landing.contactModal.namePlaceholder}</label>
                  <input
                    id="contact-name"
                    type="text"
                    placeholder={t.landing.contactModal.namePlaceholder}
                    required
                    aria-required="true"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none min-h-[48px]"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="sr-only">{t.landing.contactModal.emailPlaceholder}</label>
                  <input
                    id="contact-email"
                    type="email"
                    placeholder={t.landing.contactModal.emailPlaceholder}
                    required
                    aria-required="true"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none min-h-[48px]"
                  />
                </div>
                <div>
                  <label htmlFor="contact-company" className="sr-only">{t.landing.contactModal.companyPlaceholder}</label>
                  <input
                    id="contact-company"
                    type="text"
                    placeholder={t.landing.contactModal.companyPlaceholder}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none min-h-[48px]"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="sr-only">{t.landing.contactModal.messagePlaceholder}</label>
                  <textarea
                    id="contact-message"
                    placeholder={t.landing.contactModal.messagePlaceholder}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all min-h-[48px]"
                >
                  {t.landing.contactModal.submitButton}
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
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t.landing.supportModal.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t.landing.supportModal.subtitle}
              </p>
              
              <form className="space-y-4">
                <div>
                  <label htmlFor="support-name" className="sr-only">{t.landing.supportModal.namePlaceholder}</label>
                  <input
                    id="support-name"
                    type="text"
                    placeholder={t.landing.supportModal.namePlaceholder}
                    required
                    aria-required="true"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none min-h-[48px]"
                  />
                </div>
                <div>
                  <label htmlFor="support-email" className="sr-only">{t.landing.supportModal.emailPlaceholder}</label>
                  <input
                    id="support-email"
                    type="email"
                    placeholder={t.landing.supportModal.emailPlaceholder}
                    required
                    aria-required="true"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none min-h-[48px]"
                  />
                </div>
                <div>
                  <label htmlFor="support-issue-type" className="sr-only">{t.landing.supportModal.issueTypePlaceholder}</label>
                  <select
                    id="support-issue-type"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none min-h-[48px]"
                  >
                    <option value="" className="bg-white dark:bg-[#212121]">{t.landing.supportModal.issueTypePlaceholder}</option>
                    <option value="technical" className="bg-white dark:bg-[#212121]">{t.landing.supportModal.issueTypes.technical}</option>
                    <option value="billing" className="bg-white dark:bg-[#212121]">{t.landing.supportModal.issueTypes.billing}</option>
                    <option value="feature" className="bg-white dark:bg-[#212121]">{t.landing.supportModal.issueTypes.feature}</option>
                    <option value="other" className="bg-white dark:bg-[#212121]">{t.landing.supportModal.issueTypes.other}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="support-description" className="sr-only">{t.landing.supportModal.descriptionPlaceholder}</label>
                  <textarea
                    id="support-description"
                    placeholder={t.landing.supportModal.descriptionPlaceholder}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all min-h-[48px]"
                >
                  {t.landing.supportModal.submitButton}
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
                <div className="w-full h-full bg-white/95 dark:bg-[#111111] rounded-[10px] flex items-center justify-center">
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
                <Link href="/features" className="hover:text-gray-900 dark:hover:text-white transition-colors">{t.footer.features}</Link>
                <Link href="/industries" className="hover:text-gray-900 dark:hover:text-white transition-colors">{t.footer.industries}</Link>
                <Link href="/ai-technology" className="hover:text-gray-900 dark:hover:text-white transition-colors">{t.footer.aiTechnology}</Link>
                <Link href="/about" className="hover:text-gray-900 dark:hover:text-white transition-colors">{t.footer.about}</Link>
                <button onClick={() => setShowContactModal(true)} className="hover:text-gray-900 dark:hover:text-white transition-colors">{t.footer.contact}</button>
                <button onClick={() => setShowSupportModal(true)} className="hover:text-gray-900 dark:hover:text-white transition-colors">{t.footer.support}</button>
              </div>
              <div className="flex flex-wrap justify-center gap-6 border-t border-gray-300 dark:border-gray-700 pt-4">
                <Link href="/terms-of-use" className="hover:text-gray-900 dark:hover:text-white transition-colors">{t.footer.terms}</Link>
                <Link href="/privacy-policy" className="hover:text-gray-900 dark:hover:text-white transition-colors">{t.footer.privacy}</Link>
                <Link href="/cookie-policy" className="hover:text-gray-900 dark:hover:text-white transition-colors">{t.footer.cookies}</Link>
                <Link href="/security-policy" className="hover:text-gray-900 dark:hover:text-white transition-colors">{t.footer.security}</Link>
                <Link href="/data-processing-agreement" className="hover:text-gray-900 dark:hover:text-white transition-colors">{t.footer.dpa}</Link>
              </div>
            </div>
            
            {/* Copyright */}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t.footer.copyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function LandingPageClient({ translations: t }: { translations: TranslationsType }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDarkMode } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111] transition-colors duration-300">
      {/* Skip Navigation */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-purple-600 text-white rounded-lg"
      >
        {t.landing.skipToContent}
      </a>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#111111]/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Tooltip content="Go to homepage" position="bottom">
              <Link href="/" className="flex items-center rounded-lg" aria-label="Go to homepage">
                <div className="w-8 h-8 sm:w-10 sm:h-10 p-0.5 rounded-xl" style={{background: 'linear-gradient(to bottom right, rgb(236, 72, 153), rgb(147, 51, 234))'}}>
                  <div className="w-full h-full bg-white/95 dark:bg-[#111111] rounded-[10px] flex items-center justify-center">
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
            </Tooltip>

            {/* Auth Button and Menu */}
            <div className="flex items-center gap-2 sm:gap-4">
              
              <Link href="/signin">
                <button className="px-4 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all text-sm sm:text-base min-h-[44px]">
                  {t.navigation.signIn}
                </button>
              </Link>
              
              {/* Menu button for all screen sizes */}
              <Tooltip content={mobileMenuOpen ? "Close menu" : "Open menu"} position="bottom">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 flex items-center justify-center rounded-lg min-h-[44px] min-w-[44px]"
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
              </Tooltip>
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
              <Link href="/features" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors">{t.navigation.features}</Link>
              <Link href="/industries" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors">{t.navigation.industries}</Link>
              <Link href="/ai-technology" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors">{t.navigation.aiTechnology}</Link>
              <Link href="/about" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors">{t.navigation.about}</Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Main content */}
      <main className="relative" id="main-content">
        {/* Hero Section - Full viewport */}
        <HeroSection t={t} />

        {/* Section Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300/50 dark:via-white/10 to-transparent" />

        {/* Features Section */}
        <FeaturesSection t={t} />

        {/* Section Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300/50 dark:via-white/10 to-transparent" />

        {/* Use Cases Section */}
        <UseCasesSection t={t} />

        {/* Section Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300/50 dark:via-white/10 to-transparent" />

        {/* Stats and AI Capabilities Combined */}
        <StatsAndAISection t={t} />

        {/* Section Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300/50 dark:via-white/10 to-transparent" />

        {/* CTA and Footer Combined */}
        <CTAAndFooterSection t={t} />
      </main>
    </div>
  );
}