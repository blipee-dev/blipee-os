"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import {
  Brain,
  MessageSquare,
  ChartBar,
  Globe,
  Shield,
  Zap,
  BarChart3,
  FileText,
  Building2,
  TrendingUp,
  Users,
  Sparkles,
  Home,
  ArrowRight,
  Lock,
  Gauge,
  CheckCircle,
  Cloud,
  Menu,
  X,
  Mail,
  MessageCircle,
  HelpCircle,
  Phone,
  Sun,
  Moon,
} from "lucide-react";

// Feature category component
function FeatureCategory({
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
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8 md:p-12 hover:bg-white/[0.05] transition-all duration-300">
        {/* Header */}
        <div className="flex items-start mb-8">
          <div
            className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center mr-5 shadow-lg`}
          >
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {title}
            </h2>
            <p className="text-lg text-gray-400">
              {description}
            </p>
          </div>
        </div>
        
        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.03 }}
              className="flex items-start group"
            >
              <CheckCircle className="w-5 h-5 text-purple-400 mr-3 mt-0.5 flex-shrink-0 group-hover:text-purple-300 transition-colors" />
              <span className="text-gray-300 group-hover:text-white transition-colors">{feature}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function FeaturesPage() {
  const t = useTranslations();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Redirect to light version when theme changes
  React.useEffect(() => {
    if (!isDarkMode) {
      window.location.href = '/features-light';
    }
  }, [isDarkMode]);

  const featureCategories = [
    {
      title: t('features.conversationalAI.title'),
      description: t('features.conversationalAI.description'),
      features: [
        t('features.conversationalAI.features.0'),
        t('features.conversationalAI.features.1'),
        t('features.conversationalAI.features.2'),
        t('features.conversationalAI.features.3'),
        t('features.conversationalAI.features.4'),
        t('features.conversationalAI.features.5'),
      ],
      icon: MessageSquare,
      gradient: "from-pink-500 to-purple-600",
    },
    {
      title: t('features.realTimeAnalytics.title'),
      description: t('features.realTimeAnalytics.description'),
      features: [
        t('features.realTimeAnalytics.features.0'),
        t('features.realTimeAnalytics.features.1'),
        t('features.realTimeAnalytics.features.2'),
        t('features.realTimeAnalytics.features.3'),
        t('features.realTimeAnalytics.features.4'),
        t('features.realTimeAnalytics.features.5'),
      ],
      icon: ChartBar,
      gradient: "from-purple-500 to-indigo-600",
    },
    {
      title: t('features.complianceAutomation.title'),
      description: t('features.complianceAutomation.description'),
      features: [
        t('features.complianceAutomation.features.0'),
        t('features.complianceAutomation.features.1'),
        t('features.complianceAutomation.features.2'),
        t('features.complianceAutomation.features.3'),
        t('features.complianceAutomation.features.4'),
        t('features.complianceAutomation.features.5'),
      ],
      icon: FileText,
      gradient: "from-indigo-500 to-blue-600",
    },
    {
      title: t('features.intelligentInsights.title'),
      description: t('features.intelligentInsights.description'),
      features: [
        t('features.intelligentInsights.features.0'),
        t('features.intelligentInsights.features.1'),
        t('features.intelligentInsights.features.2'),
        t('features.intelligentInsights.features.3'),
        t('features.intelligentInsights.features.4'),
        t('features.intelligentInsights.features.5'),
      ],
      icon: Brain,
      gradient: "from-blue-500 to-cyan-600",
    },
    {
      title: t('features.integration.title'),
      description: t('features.integration.description'),
      features: [
        t('features.integration.features.0'),
        t('features.integration.features.1'),
        t('features.integration.features.2'),
        t('features.integration.features.3'),
        t('features.integration.features.4'),
        t('features.integration.features.5'),
      ],
      icon: Globe,
      gradient: "from-cyan-500 to-teal-600",
    },
    {
      title: t('features.security.title'),
      description: t('features.security.description'),
      features: [
        t('features.security.features.0'),
        t('features.security.features.1'),
        t('features.security.features.2'),
        t('features.security.features.3'),
        t('features.security.features.4'),
        t('features.security.features.5'),
      ],
      icon: Shield,
      gradient: "from-teal-500 to-green-600",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 rounded-lg blur-md opacity-75"></div>
                <div className="relative bg-black/[0.95] border border-white/[0.1] rounded-lg p-2">
                  <Brain className="w-6 h-6 text-white" />
                </div>
              </div>
              <span className="ml-2 text-lg sm:text-xl font-normal bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                blipee
              </span>
            </Link>

            {/* Theme Toggle, Language Switcher, Auth Button and Menu */}
            <div className="flex items-center gap-4">
              {/* Theme Toggle Button */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="px-3 py-2.5 rounded-full bg-transparent hover:bg-white/[0.05] transition-colors"
                aria-label={t('navigation.toggleTheme')}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-purple-400" />
                )}
              </button>

              {/* Language Switcher */}
              <LanguageSwitcher />
              
              <Link href="/signin">
                <button className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all">
                  {t('navigation.signIn')}
                </button>
              </Link>
              
              {/* Menu button for all screen sizes */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 flex items-center justify-center"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6 text-white" />
                ) : (
                  <Menu className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/[0.05] max-w-md mx-auto sm:mx-0 sm:right-4 sm:left-auto sm:w-80 rounded-b-2xl"
          >
            <div className="px-4 py-6">
              <div className="space-y-1">
                <Link href="/features">
                  <button className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors">
                    {t('navigation.features')}
                  </button>
                </Link>
                <Link href="/industries">
                  <button className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors">
                    {t('navigation.industries')}
                  </button>
                </Link>
                <Link href="/ai-technology">
                  <button className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors">
                    {t('navigation.aiTechnology')}
                  </button>
                </Link>
                <Link href="/about">
                  <button className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors">
                    {t('navigation.about')}
                  </button>
                </Link>
                
                <hr className="my-4 border-white/[0.05]" />
                
                <button 
                  onClick={() => setIsContactModalOpen(true)}
                  className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors flex items-center"
                >
                  <Mail className="w-4 h-4 mr-3" />
                  {t('modals.contact.title')}
                </button>
                <button 
                  onClick={() => setIsSupportModalOpen(true)}
                  className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors flex items-center"
                >
                  <HelpCircle className="w-4 h-4 mr-3" />
                  {t('modals.support.title')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {t('features.title')}
              </span>
              <br />
              <span className="text-white text-4xl md:text-5xl">
                {t('features.subtitle')}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto">
              {t('features.description')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {featureCategories.map((category, index) => (
            <FeatureCategory
              key={index}
              {...category}
              index={index}
            />
          ))}
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
              {t('cta.title')}
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              {t('cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signin">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto min-w-[180px] px-6 py-3 bg-white text-gray-900 rounded-lg font-medium shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all flex items-center justify-center"
                >
                  {t('cta.signInToDashboard')}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </motion.button>
              </Link>
              <motion.button
                onClick={() => setIsContactModalOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto min-w-[180px] px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg font-medium hover:bg-white/10 transition-all flex items-center justify-center"
              >
                {t('cta.requestAccess')}
              </motion.button>
            </div>
            <p className="mt-6 text-white/70 text-sm">
              {t('cta.waitingMessage')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-white/[0.05] py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Link href="/" className="inline-flex items-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 rounded-lg blur-md opacity-75"></div>
              <div className="relative bg-black/[0.95] border border-white/[0.1] rounded-lg p-2">
                <Brain className="w-6 h-6 text-white" />
              </div>
            </div>
            <span className="ml-3 text-xl font-normal bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              blipee
            </span>
          </Link>
          <p className="text-gray-400 mb-4">
            {t('footer.tagline')}
          </p>
          <p className="text-gray-500 text-sm">
            {t('footer.copyright')}
          </p>
        </div>
      </footer>

      {/* Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsContactModalOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-black border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <button
              onClick={() => setIsContactModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-2xl font-bold text-white mb-4">{t('modals.contact.title')}</h3>
            <p className="text-gray-400 mb-6">
              {t('modals.contact.description')}
            </p>
            
            <form className="space-y-4">
              <input
                type="text"
                placeholder={t('modals.contact.form.name')}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <input
                type="email"
                placeholder={t('modals.contact.form.email')}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder={t('modals.contact.form.company')}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <textarea
                placeholder={t('modals.contact.form.message')}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
              />
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                {t('modals.contact.form.submit')}
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
            className="relative bg-black border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <button
              onClick={() => setIsSupportModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-2xl font-bold text-white mb-4">{t('modals.support.title')}</h3>
            <p className="text-gray-400 mb-6">
              {t('modals.support.description')}
            </p>
            
            <form className="space-y-4">
              <input
                type="text"
                placeholder={t('modals.support.form.name')}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <input
                type="email"
                placeholder={t('modals.support.form.email')}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <select
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              >
                <option value="" className="bg-black">{t('modals.support.form.issueType')}</option>
                <option value="technical" className="bg-black">{t('modals.support.form.issueTypes.technical')}</option>
                <option value="billing" className="bg-black">{t('modals.support.form.issueTypes.billing')}</option>
                <option value="feature" className="bg-black">{t('modals.support.form.issueTypes.feature')}</option>
                <option value="other" className="bg-black">{t('modals.support.form.issueTypes.other')}</option>
              </select>
              <textarea
                placeholder={t('modals.support.form.message')}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
              />
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                {t('modals.support.form.submit')}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}