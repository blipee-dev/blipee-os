"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Factory,
  Building2,
  Zap,
  Globe,
  Leaf,
  Users,
  CheckCircle,
  Home,
  ArrowRight,
  X,
  Sparkles,
} from "lucide-react";

interface IndustryCategory {
  title: string;
  description: string;
  features: string[];
  icon: any;
  gradient: string;
}

interface TranslationsType {
  navigation: {
    features: string;
    industries: string;
    aiTechnology: string;
    about: string;
    signIn: string;
    menu: string;
  };
  industries: {
    skipToContent: string;
    hero: {
      badge: string;
      title1: string;
      title2: string;
      description: string;
    };
    categories: {
      manufacturingProduction: {
        title: string;
        description: string;
        features: string[];
      };
      builtEnvironment: {
        title: string;
        description: string;
        features: string[];
      };
      energyUtilities: {
        title: string;
        description: string;
        features: string[];
      };
      servicesDigital: {
        title: string;
        description: string;
        features: string[];
      };
      naturalResources: {
        title: string;
        description: string;
        features: string[];
      };
      publicSocialSector: {
        title: string;
        description: string;
        features: string[];
      };
    };
    compliance: {
      title: string;
      description: string;
      gri11: {
        title: string;
        description: string;
      };
      gri12: {
        title: string;
        description: string;
      };
      gri13: {
        title: string;
        description: string;
      };
      gri14: {
        title: string;
        description: string;
      };
      gri15: {
        title: string;
        description: string;
      };
      gri16: {
        title: string;
        description: string;
      };
    };
    cta: {
      title: string;
      description: string;
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

// Industry category component
function IndustryCategory({
  title,
  description,
  features,
  icon: Icon,
  gradient,
  index,
}: {
  title: string;
  description: string;
  features: string[];
  icon: any;
  gradient: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative"
    >
      <article className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-gray-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 hover:shadow-lg transition-all duration-300">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start mb-6 sm:mb-8">
          <div
            className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${gradient} rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-0 sm:mr-5 shadow-lg`}
            aria-hidden="true"
          >
            <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </h3>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              {description}
            </p>
          </div>
        </header>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" role="list" aria-label={`${title} features`}>
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.03 }}
              className="flex items-start group"
              role="listitem"
            >
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0 group-hover:text-purple-300 transition-colors" aria-hidden="true" />
              <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:hover:text-white transition-colors leading-relaxed">{feature}</span>
            </motion.div>
          ))}
        </div>
      </article>
    </motion.div>
  );
}

// GRI Standard component
function GRIStandard({
  title,
  description,
  index,
}: {
  title: string;
  description: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
    >
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}

export default function IndustriesPageClient({ 
  translations: t 
}: { 
  translations: TranslationsType 
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  const industryCategories: IndustryCategory[] = [
    {
      icon: Factory,
      title: t.industries.categories.manufacturingProduction.title,
      description: t.industries.categories.manufacturingProduction.description,
      gradient: "from-orange-500 to-red-500",
      features: t.industries.categories.manufacturingProduction.features,
    },
    {
      icon: Building2,
      title: t.industries.categories.builtEnvironment.title,
      description: t.industries.categories.builtEnvironment.description,
      gradient: "from-blue-500 to-cyan-500",
      features: t.industries.categories.builtEnvironment.features,
    },
    {
      icon: Zap,
      title: t.industries.categories.energyUtilities.title,
      description: t.industries.categories.energyUtilities.description,
      gradient: "from-yellow-500 to-orange-500",
      features: t.industries.categories.energyUtilities.features,
    },
    {
      icon: Globe,
      title: t.industries.categories.servicesDigital.title,
      description: t.industries.categories.servicesDigital.description,
      gradient: "from-purple-500 to-indigo-500",
      features: t.industries.categories.servicesDigital.features,
    },
    {
      icon: Leaf,
      title: t.industries.categories.naturalResources.title,
      description: t.industries.categories.naturalResources.description,
      gradient: "from-green-500 to-emerald-500",
      features: t.industries.categories.naturalResources.features,
    },
    {
      icon: Users,
      title: t.industries.categories.publicSocialSector.title,
      description: t.industries.categories.publicSocialSector.description,
      gradient: "from-pink-500 to-rose-500",
      features: t.industries.categories.publicSocialSector.features,
    },
  ];

  const griStandards = [
    {
      title: t.industries.compliance.gri11.title,
      description: t.industries.compliance.gri11.description,
    },
    {
      title: t.industries.compliance.gri12.title,
      description: t.industries.compliance.gri12.description,
    },
    {
      title: t.industries.compliance.gri13.title,
      description: t.industries.compliance.gri13.description,
    },
    {
      title: t.industries.compliance.gri14.title,
      description: t.industries.compliance.gri14.description,
    },
    {
      title: t.industries.compliance.gri15.title,
      description: t.industries.compliance.gri15.description,
    },
    {
      title: t.industries.compliance.gri16.title,
      description: t.industries.compliance.gri16.description,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111] text-gray-900 dark:text-white">
      {/* Skip Navigation */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-purple-600 text-white rounded-lg"
      >
        {t.industries.skipToContent}
      </a>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#111111]/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center rounded-lg" aria-label="Go to homepage">
              <div className="w-8 h-8 sm:w-10 sm:h-10 p-0.5 rounded-xl" style={{background: 'linear-gradient(to bottom right, rgb(236, 72, 153), rgb(147, 51, 234))'}}>
                <div className="w-full h-full bg-white/95 dark:bg-[#111111]/95 rounded-[10px] flex items-center justify-center">
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

            {/* Auth Button and Menu */}
            <div className="flex items-center gap-2 sm:gap-4">
              
              <Link href="/signin">
                <button className="px-4 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all text-sm sm:text-base min-h-[44px]">
                  {t.navigation.signIn}
                </button>
              </Link>
              
              {/* Menu button for all screen sizes */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 flex items-center justify-center rounded-lg min-h-[44px] min-w-[44px]"
                aria-expanded={isMenuOpen}
                aria-label={isMenuOpen ? "Close menu" : t.navigation.menu}
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
                <svg width="0" height="0">
                  <defs>
                    <linearGradient id="xGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgb(236, 72, 153)" />
                      <stop offset="100%" stopColor="rgb(147, 51, 234)" />
                    </linearGradient>
                  </defs>
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation Menu - shows on all screen sizes */}
          {isMenuOpen && (
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
            <div className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-gray-100 dark:bg-[#212121] border border-gray-200 dark:border-gray-700 rounded-full mb-6 sm:mb-8" role="note" aria-label="Product highlight">
              <Sparkles className="w-4 h-4 text-pink-400 mr-2" aria-hidden="true" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.industries.hero.badge}
              </span>
            </div>
            <h1 id="hero-heading" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {t.industries.hero.title1}
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">
                {t.industries.hero.title2}
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed px-2 sm:px-4">
              {t.industries.hero.description}
            </p>
          </motion.div>
        </div>
      </section>

        {/* Industries Grid */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8" aria-labelledby="industries-heading">
          <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
            <header className="text-center">
              <h2 id="industries-heading" className="sr-only">Industry Categories</h2>
            </header>
            {industryCategories.map((category, index) => (
              <IndustryCategory key={index} {...category} index={index} />
            ))}
          </div>
        </section>

        {/* GRI Compliance Section */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-[#0a0a0a]" aria-labelledby="compliance-heading">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 id="compliance-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                {t.industries.compliance.title}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                {t.industries.compliance.description}
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {griStandards.map((standard, index) => (
                <GRIStandard key={index} {...standard} index={index} />
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              {t.industries.cta.title}
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-2 sm:px-4">
              {t.industries.cta.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-lg sm:max-w-none mx-auto">
              <Link href="/signin" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto min-w-[180px] px-6 py-3 bg-white text-gray-900 rounded-lg font-medium shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all flex items-center justify-center focus:ring-white focus:ring-offset-purple-600 min-h-[48px]"
                  aria-label="Sign in to dashboard"
                >
                  {t.industries.cta.signInButton}
                  <ArrowRight className="ml-2 w-4 h-4" aria-hidden="true" />
                </motion.button>
              </Link>
              <motion.button
                onClick={() => setIsContactModalOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto min-w-[180px] px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg font-medium hover:bg-white/10 transition-all flex items-center justify-center focus:ring-white focus:ring-offset-purple-600 min-h-[48px]"
                aria-label="Request platform access"
              >
                {t.industries.cta.requestButton}
              </motion.button>
            </div>
            <p className="mt-6 text-white/70 text-sm">
              {t.industries.cta.footer}
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
                <Link href="/features" className="hover:text-gray-900 dark:text-white transition-colors">{t.footer.features}</Link>
                <Link href="/industries" className="hover:text-gray-900 dark:text-white transition-colors">{t.footer.industries}</Link>
                <Link href="/ai-technology" className="hover:text-gray-900 dark:text-white transition-colors">{t.footer.aiTechnology}</Link>
                <Link href="/about" className="hover:text-gray-900 dark:text-white transition-colors">{t.footer.about}</Link>
                <button onClick={() => setIsContactModalOpen(true)} className="hover:text-gray-900 dark:text-white transition-colors">{t.footer.contact}</button>
                <button onClick={() => setIsSupportModalOpen(true)} className="hover:text-gray-900 dark:text-white transition-colors">{t.footer.support}</button>
              </div>
              <div className="flex flex-wrap justify-center gap-6 border-t border-gray-300 dark:border-gray-700 pt-4">
                <Link href="/terms-of-use" className="hover:text-gray-900 dark:text-white transition-colors">{t.footer.terms}</Link>
                <Link href="/privacy-policy" className="hover:text-gray-900 dark:text-white transition-colors">{t.footer.privacy}</Link>
                <Link href="/cookie-policy" className="hover:text-gray-900 dark:text-white transition-colors">{t.footer.cookies}</Link>
                <Link href="/security-policy" className="hover:text-gray-900 dark:text-white transition-colors">{t.footer.security}</Link>
                <Link href="/data-processing-agreement" className="hover:text-gray-900 dark:text-white transition-colors">{t.footer.dpa}</Link>
              </div>
            </div>
            
            {/* Copyright */}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t.footer.copyright}
            </p>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsContactModalOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white dark:bg-[#212121] border border-gray-200 dark:border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <button
              onClick={() => setIsContactModalOpen(false)}
              className="absolute top-4 right-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t.industries.contactModal.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t.industries.contactModal.subtitle}
            </p>
            
            <form className="space-y-4">
              <input
                type="text"
                placeholder={t.industries.contactModal.namePlaceholder}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <input
                type="email"
                placeholder={t.industries.contactModal.emailPlaceholder}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder={t.industries.contactModal.companyPlaceholder}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <textarea
                placeholder={t.industries.contactModal.messagePlaceholder}
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
              />
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                {t.industries.contactModal.submitButton}
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
            className="relative bg-white dark:bg-[#212121] border border-gray-200 dark:border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <button
              onClick={() => setIsSupportModalOpen(false)}
              className="absolute top-4 right-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t.industries.supportModal.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t.industries.supportModal.subtitle}
            </p>
            
            <form className="space-y-4">
              <input
                type="text"
                placeholder={t.industries.supportModal.namePlaceholder}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <input
                type="email"
                placeholder={t.industries.supportModal.emailPlaceholder}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <select
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              >
                <option value="" className="bg-white dark:bg-[#212121]">{t.industries.supportModal.issueTypePlaceholder}</option>
                <option value="technical" className="bg-white dark:bg-[#212121]">{t.industries.supportModal.issueTypes.technical}</option>
                <option value="billing" className="bg-white dark:bg-[#212121]">{t.industries.supportModal.issueTypes.billing}</option>
                <option value="feature" className="bg-white dark:bg-[#212121]">{t.industries.supportModal.issueTypes.feature}</option>
                <option value="other" className="bg-white dark:bg-[#212121]">{t.industries.supportModal.issueTypes.other}</option>
              </select>
              <textarea
                placeholder={t.industries.supportModal.descriptionPlaceholder}
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
              />
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                {t.industries.supportModal.submitButton}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}