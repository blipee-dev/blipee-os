"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/providers/ThemeProvider";
import {
  Brain,
  Cpu,
  Zap,
  Shield,
  Eye,
  MessageSquare,
  Home,
  ArrowRight,
  CheckCircle,
  Globe,
  Gauge,
  TrendingUp,
  Network,
  Database,
  Menu,
  X,
  Mail,
  MessageCircle,
  HelpCircle,
  Phone,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-black/[0.03] dark:bg-white/[0.03] backdrop-blur-xl border border-gray-200 dark:border-white/[0.05] rounded-2xl p-6 sm:p-8 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-all duration-300 group"
    >
      <div
        className={`w-14 h-14 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform`}
      >
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="text-gray-700 dark:text-gray-300 mb-4 sm:mb-6 leading-relaxed">{description}</p>
      
      {/* Progressive disclosure for features */}
      <div className="space-y-2">
        {(isExpanded ? features : features.slice(0, 3)).map((feature, index) => (
          <motion.div 
            key={index} 
            className="flex items-start"
            initial={isExpanded ? { opacity: 0, y: -10 } : {}}
            animate={isExpanded ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: index * 0.1 }}
          >
            <CheckCircle className="w-4 h-4 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {feature}
            </span>
          </motion.div>
        ))}
        
        {features.length > 3 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center mt-3 text-sm text-purple-400 hover:text-purple-300 transition-colors focus:outline-none focus:ring-offset-transparent rounded-lg px-3 py-2 min-h-[48px]"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Show {features.length - 3} more features
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}


export default function AITechnologyPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

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
    <div className="min-h-screen bg-white dark:bg-[#111111] text-gray-900 dark:text-white">
      {/* Skip Navigation */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-purple-600 text-white rounded-lg"
      >
        Skip to main content
      </a>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#111111]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10" role="navigation" aria-label="Main navigation">
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

            {/* Theme Toggle, Auth Button and Menu */}
            <div className="flex items-center gap-4">
              {/* Theme Toggle Button */}
              <div className="w-11 h-11 rounded-full p-[1px] bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500">
                <button
                  onClick={toggleTheme}
                  className="w-full h-full rounded-full bg-white/95 dark:bg-[#111111]/95 hover:bg-white/90 dark:hover:bg-black/90 transition-all flex items-center justify-center"
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
                <button className="px-4 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all text-sm sm:text-base min-h-[44px]">
                  Sign In
                </button>
              </Link>
              
              {/* Menu button for all screen sizes */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 flex items-center justify-center rounded-lg min-h-[44px] min-w-[44px]"
                aria-expanded={isMenuOpen}
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
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

          {/* Navigation Menu - shows on all screen sizes */}
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute right-0 top-full mt-2 w-full md:w-64 bg-white/90 dark:bg-[#111111]/90 backdrop-blur-xl border border-gray-200/50 dark:border-white/[0.05] rounded-lg py-4 shadow-2xl"
            >
              <div className="flex flex-col space-y-1">
                <Link href="/features" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors">Features</Link>
                <Link href="/industries" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors">Industries</Link>
                <Link href="/ai-technology" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors">AI Technology</Link>
                <Link href="/about" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors">About</Link>
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
              <div className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-black/[0.03] dark:bg-white/[0.03] backdrop-blur-xl border border-gray-200 dark:border-white/[0.05] rounded-full mb-6 sm:mb-8" role="note" aria-label="Product highlight">
                <Cpu className="w-4 h-4 text-pink-400 mr-2" aria-hidden="true" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  Next-Generation AI Technology
                </span>
              </div>
              <h1 id="hero-heading" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  The AI Behind
                </span>
                <br />
                <span className="text-gray-900 dark:text-white">
                  Sustainability Magic
                </span>
              </h1>
            <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Discover the revolutionary multi-brain AI architecture that makes
              sustainability management feel like magic. 12 specialized AI
              models working together to transform how you achieve your
              environmental goals.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Multi-Brain Architecture */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 bg-gray-50/50 dark:bg-white/[0.01]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-black/[0.03] dark:bg-white/[0.03] backdrop-blur-xl border border-gray-200 dark:border-white/[0.05] rounded-full mb-6 sm:mb-8">
              <Brain className="w-4 h-4 text-pink-400 mr-2" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                Advanced AI Architecture
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Multi-Brain Architecture
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-12">
              Each brain specializes in different aspects of sustainability, working together to deliver comprehensive intelligence
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Specialized Intelligence Systems
            </h3>
            <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              Our AI architecture combines multiple specialized systems to provide comprehensive sustainability intelligence
            </p>
          </motion.div>
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
            {technologies.map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <TechnologyCard {...tech} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Providers Section */}
      <section className="py-20 px-4">
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
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              We partner with the world's leading AI providers to ensure
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
                className="bg-black/[0.03] dark:bg-white/[0.03] backdrop-blur-xl border border-gray-200 dark:border-white/[0.05] rounded-2xl p-8 text-center hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-all duration-300"
              >
                <div className="w-16 h-16 bg-black/[0.03] dark:bg-white/[0.03] backdrop-blur-xl border border-gray-200 dark:border-white/[0.05] rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                  {provider.name}
                </h3>
                <p className="text-purple-400 font-medium mb-4">
                  {provider.role}
                </p>
                <div className="space-y-2">
                  {provider.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-purple-400 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
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
                onClick={() => setIsContactModalOpen(true)}
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
                <Link href="/features" className="hover:text-gray-900 dark:text-white transition-colors">Features</Link>
                <Link href="/industries" className="hover:text-gray-900 dark:text-white transition-colors">Industries</Link>
                <Link href="/ai-technology" className="hover:text-gray-900 dark:text-white transition-colors">AI Technology</Link>
                <Link href="/about" className="hover:text-gray-900 dark:text-white transition-colors">About</Link>
                <button onClick={() => setIsContactModalOpen(true)} className="hover:text-gray-900 dark:text-white transition-colors">Contact</button>
                <button onClick={() => setIsSupportModalOpen(true)} className="hover:text-gray-900 dark:text-white transition-colors">Support</button>
              </div>
              <div className="flex flex-wrap justify-center gap-6 border-t border-gray-300 dark:border-gray-700 pt-4">
                <Link href="/terms-of-use" className="hover:text-gray-900 dark:text-white transition-colors">Terms</Link>
                <Link href="/privacy-policy" className="hover:text-gray-900 dark:text-white transition-colors">Privacy</Link>
                <Link href="/cookie-policy" className="hover:text-gray-900 dark:text-white transition-colors">Cookies</Link>
                <Link href="/security-policy" className="hover:text-gray-900 dark:text-white transition-colors">Security</Link>
                <Link href="/data-processing-agreement" className="hover:text-gray-900 dark:text-white transition-colors">DPA</Link>
              </div>
            </div>
            
            {/* Copyright */}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2025 blipee. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      </main>

      {/* Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsContactModalOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <button
              onClick={() => setIsContactModalOpen(false)}
              className="absolute top-4 right-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Schedule a Demo</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Get in touch with our team to see blipee in action
            </p>
            
            <form className="space-y-4">
              <input
                type="text"
                placeholder="Your Name"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Company"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <textarea
                placeholder="Tell us about your sustainability goals"
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
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
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSupportModalOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <button
              onClick={() => setIsSupportModalOpen(false)}
              className="absolute top-4 right-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Get Support</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Our team is here to help you succeed with blipee
            </p>
            
            <form className="space-y-4">
              <input
                type="text"
                placeholder="Your Name"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <select
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              >
                <option value="" className="bg-white dark:bg-[#111111]">Select Issue Type</option>
                <option value="technical" className="bg-white dark:bg-[#111111]">Technical Issue</option>
                <option value="billing" className="bg-white dark:bg-[#111111]">Billing Question</option>
                <option value="feature" className="bg-white dark:bg-[#111111]">Feature Request</option>
                <option value="other" className="bg-white dark:bg-[#111111]">Other</option>
              </select>
              <textarea
                placeholder="Describe your issue or question"
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
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
  );
}