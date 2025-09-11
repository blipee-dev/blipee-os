'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Heart,
  Globe,
  Users,
  Sparkles,
  Home,
  ArrowRight,
  Zap,
  Shield,
  CheckCircle,
  Lightbulb,
  Rocket,
  Brain,
  Target,
  Mail,
  MapPin,
  Menu,
  X,
} from 'lucide-react';

interface TranslationsType {
  navigation: {
    skipToContent?: string;
    signIn?: string;
    closeMenu?: string;
    openMenu?: string;
    menu?: {
      features?: string;
      industries?: string;
      aiTechnology?: string;
      about?: string;
    };
  };
  about: {
    title?: string;
    hero?: {
      title?: string;
      brand?: string;
      description?: string;
    };
    vision?: {
      title?: string;
      description?: string;
    };
    mission?: {
      title?: string;
      description?: string;
    };
    values?: {
      title?: string;
      subtitle?: string;
      items?: {
        relentlessInnovation?: {
          title?: string;
          description?: string;
        };
        customerObsession?: {
          title?: string;
          description?: string;
        };
        transparencyTrust?: {
          title?: string;
          description?: string;
        };
        globalImpactMindset?: {
          title?: string;
          description?: string;
        };
        qualityOverSpeed?: {
          title?: string;
          description?: string;
        };
        diversePerspectives?: {
          title?: string;
          description?: string;
        };
      };
    };
    contact?: {
      scheduleDemo?: {
        title?: string;
        description?: string;
        form?: {
          name?: string;
          email?: string;
          company?: string;
          message?: string;
          submit?: string;
        };
      };
      support?: {
        title?: string;
        description?: string;
        form?: {
          name?: string;
          email?: string;
          issueType?: string;
          issueTypes?: {
            technical?: string;
            billing?: string;
            feature?: string;
            other?: string;
          };
          message?: string;
          submit?: string;
        };
      };
    };
  };
  footer: any;
}

interface AboutPageClientProps {
  translations: TranslationsType;
}

export default function AboutPageClient({ translations }: AboutPageClientProps) {
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const values = [
    {
      title: translations.about?.values?.items?.relentlessInnovation?.title || "Relentless Innovation",
      description: translations.about?.values?.items?.relentlessInnovation?.description || "We believe in pushing boundaries and challenging the status quo. Every day we ask: how can we make sustainability management 10x better, not just incrementally improved?"
    },
    {
      title: translations.about?.values?.items?.customerObsession?.title || "Customer Obsession",
      description: translations.about?.values?.items?.customerObsession?.description || "Our customers' success is our success. We listen deeply, iterate rapidly, and won't rest until sustainability teams feel empowered rather than overwhelmed by their tools"
    },
    {
      title: translations.about?.values?.items?.transparencyTrust?.title || "Transparency & Trust",
      description: translations.about?.values?.items?.transparencyTrust?.description || "We build with openness—transparent about our AI decisions, our data usage, and our company progress. Trust is earned through consistent actions, not promises"
    },
    {
      title: translations.about?.values?.items?.globalImpactMindset?.title || "Global Impact Mindset",
      description: translations.about?.values?.items?.globalImpactMindset?.description || "Every feature we build, every decision we make is evaluated through the lens of global environmental impact. We're not just building software; we're fighting climate change"
    },
    {
      title: translations.about?.values?.items?.qualityOverSpeed?.title || "Quality Over Speed",
      description: translations.about?.values?.items?.qualityOverSpeed?.description || "We move fast but never compromise on quality. Our AI must be reliable, our data accurate, and our insights actionable—because sustainability decisions matter too much to get wrong"
    },
    {
      title: translations.about?.values?.items?.diversePerspectives?.title || "Diverse Perspectives",
      description: translations.about?.values?.items?.diversePerspectives?.description || "The climate crisis affects everyone differently. We build an inclusive team with varied backgrounds because diverse perspectives lead to better solutions for a global challenge"
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111] text-gray-900 dark:text-white">
      <svg width="0" height="0" aria-hidden="true">
        <defs>
          <linearGradient id="homeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(236, 72, 153)" />
            <stop offset="100%" stopColor="rgb(147, 51, 234)" />
          </linearGradient>
        </defs>
      </svg>
      {/* Skip Navigation */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-purple-600 text-white rounded-lg"
      >
        {translations.navigation?.skipToContent || "Skip to main content"}
      </a>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#111111]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center rounded-lg" aria-label="Go to homepage">
              <div className="w-8 h-8 sm:w-10 sm:h-10 p-0.5 rounded-xl" style={{background: 'linear-gradient(to bottom right, rgb(236, 72, 153), rgb(147, 51, 234))'}}>
                <div className="w-full h-full bg-white/95 dark:bg-[#111111]/95 rounded-[10px] flex items-center justify-center">
                  <Home className="w-5 h-5 sm:w-6 sm:h-6" stroke="url(#homeGradient)" fill="none" strokeWidth="2" aria-hidden="true" />
                </div>
              </div>
              <span className="ml-2 text-lg sm:text-xl font-normal bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                blipee
              </span>
            </Link>

            {/* Auth Button and Menu */}
            <div className="flex items-center gap-4">
              <Link href="/signin">
                <button className="px-4 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all text-sm sm:text-base min-h-[44px]">
                  {translations.navigation?.signIn || "Sign In"}
                </button>
              </Link>
              
              {/* Menu button for all screen sizes */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 flex items-center justify-center rounded-lg min-h-[44px] min-w-[44px]"
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? (translations.navigation?.closeMenu || "Close menu") : (translations.navigation?.openMenu || "Open menu")}
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
            className="absolute right-0 top-full mt-2 w-full md:w-64 bg-white/90 dark:bg-[#111111]/90 backdrop-blur-xl border border-gray-200/50 dark:border-white/[0.05] rounded-lg py-4 shadow-2xl"
          >
            <div className="flex flex-col space-y-1">
              <Link href="/features" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors">{translations.navigation?.menu?.features || "Features"}</Link>
              <Link href="/industries" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors">{translations.navigation?.menu?.industries || "Industries"}</Link>
              <Link href="/ai-technology" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors">{translations.navigation?.menu?.aiTechnology || "AI Technology"}</Link>
              <Link href="/about" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors">{translations.navigation?.menu?.about || "About"}</Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Main Content */}
      <main id="main-content">
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8" role="banner" aria-labelledby="hero-heading">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 id="hero-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
                {translations.about?.hero?.title || "About"} <span className="font-normal bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">{translations.about?.hero?.brand || "blipee"}</span>
              </h1>
            <p className="text-lg sm:text-xl text-gray-900 dark:text-white mb-8 max-w-3xl mx-auto">
              {translations.about?.hero?.description || "We're building the world's first Autonomous Sustainability Intelligence platform that transforms traditional dashboard-based ESG management into conversational AI that works 24/7 as your digital sustainability team. Our mission is to create not just software, but AI employees that autonomously manage, optimize, and improve sustainability performance across any industry."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">{translations.about?.vision?.title || "Our Vision"}</h2>
            <p className="text-lg text-gray-900 dark:text-white max-w-3xl mx-auto leading-relaxed">
              {translations.about?.vision?.description || "A world where every organization has access to intelligent, autonomous sustainability management—where environmental stewardship is not a burden but an empowering, data-driven advantage. We envision a future where AI employees work alongside human teams to make sustainability decisions in real-time, turning compliance into competitive advantage and environmental responsibility into business growth."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">{translations.about?.mission?.title || "Our Mission"}</h2>
            <p className="text-lg text-gray-900 dark:text-white max-w-3xl mx-auto leading-relaxed">
              {translations.about?.mission?.description || "To democratize sustainability intelligence by building AI systems that eliminate the complexity, cost, and expertise barriers that prevent organizations from achieving their environmental goals. We exist to make sustainability management accessible to every organization—from startups to enterprises—by providing autonomous AI employees that understand, predict, and optimize environmental performance without requiring specialized knowledge or massive resources."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900 dark:text-white">{translations.about?.values?.title || "Our Values"}</h2>
            <p className="text-gray-900 dark:text-white text-lg">{translations.about?.values?.subtitle || "The principles that guide how we work, make decisions, and build our culture"}</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-[#212121] backdrop-blur-xl border border-gray-200 dark:border-white/[0.05] rounded-2xl p-6 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all duration-300"
              >
                <h3 className="text-lg sm:text-xl font-semibold mb-4 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">{value.title}</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
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
                <Link href="/features" className="hover:text-gray-900 dark:text-white transition-colors">{translations.footer?.features || "Features"}</Link>
                <Link href="/industries" className="hover:text-gray-900 dark:text-white transition-colors">{translations.footer?.industries || "Industries"}</Link>
                <Link href="/ai-technology" className="hover:text-gray-900 dark:text-white transition-colors">{translations.footer?.aiTechnology || "AI Technology"}</Link>
                <Link href="/about" className="hover:text-gray-900 dark:text-white transition-colors">{translations.footer?.about || "About"}</Link>
                <button onClick={() => setShowContactModal(true)} className="hover:text-gray-900 dark:text-white transition-colors">{translations.footer?.contact || "Contact"}</button>
                <button onClick={() => setShowSupportModal(true)} className="hover:text-gray-900 dark:text-white transition-colors">{translations.footer?.support || "Support"}</button>
              </div>
              <div className="flex flex-wrap justify-center gap-6 border-t border-gray-300 dark:border-gray-700 pt-4">
                <Link href="/terms-of-use" className="hover:text-gray-900 dark:text-white transition-colors">{translations.footer?.terms || "Terms"}</Link>
                <Link href="/privacy-policy" className="hover:text-gray-900 dark:text-white transition-colors">{translations.footer?.privacy || "Privacy"}</Link>
                <Link href="/cookie-policy" className="hover:text-gray-900 dark:text-white transition-colors">{translations.footer?.cookies || "Cookies"}</Link>
                <Link href="/security-policy" className="hover:text-gray-900 dark:text-white transition-colors">{translations.footer?.security || "Security"}</Link>
                <Link href="/data-processing-agreement" className="hover:text-gray-900 dark:text-white transition-colors">{translations.footer?.dpa || "DPA"}</Link>
              </div>
            </div>
            
            {/* Copyright */}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {translations.footer?.copyright || "© 2025 blipee. All rights reserved."}
            </p>
          </div>
        </div>
      </footer>
      </main>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowContactModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{translations.about?.contact?.scheduleDemo?.title || "Schedule a Demo"}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {translations.about?.contact?.scheduleDemo?.description || "Get in touch with our team to see blipee in action"}
            </p>
            
            <form className="space-y-4">
              <input
                type="text"
                placeholder={translations.about?.contact?.scheduleDemo?.form?.name || "Your Name"}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <input
                type="email"
                placeholder={translations.about?.contact?.scheduleDemo?.form?.email || "Email Address"}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder={translations.about?.contact?.scheduleDemo?.form?.company || "Company"}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <textarea
                placeholder={translations.about?.contact?.scheduleDemo?.form?.message || "Tell us about your sustainability goals"}
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
              />
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                {translations.about?.contact?.scheduleDemo?.form?.submit || "Send Request"}
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
            className="relative bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <button
              onClick={() => setShowSupportModal(false)}
              className="absolute top-4 right-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{translations.about?.contact?.support?.title || "Get Support"}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {translations.about?.contact?.support?.description || "Our team is here to help you succeed with blipee"}
            </p>
            
            <form className="space-y-4">
              <input
                type="text"
                placeholder={translations.about?.contact?.support?.form?.name || "Your Name"}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <input
                type="email"
                placeholder={translations.about?.contact?.support?.form?.email || "Email Address"}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <select
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              >
                <option value="" className="bg-white dark:bg-[#111111]">{translations.about?.contact?.support?.form?.issueType || "Select Issue Type"}</option>
                <option value="technical" className="bg-white dark:bg-[#111111]">{translations.about?.contact?.support?.form?.issueTypes?.technical || "Technical Issue"}</option>
                <option value="billing" className="bg-white dark:bg-[#111111]">{translations.about?.contact?.support?.form?.issueTypes?.billing || "Billing Question"}</option>
                <option value="feature" className="bg-white dark:bg-[#111111]">{translations.about?.contact?.support?.form?.issueTypes?.feature || "Feature Request"}</option>
                <option value="other" className="bg-white dark:bg-[#111111]">{translations.about?.contact?.support?.form?.issueTypes?.other || "Other"}</option>
              </select>
              <textarea
                placeholder={translations.about?.contact?.support?.form?.message || "Describe your issue or question"}
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
              />
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                {translations.about?.contact?.support?.form?.submit || "Submit Request"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}