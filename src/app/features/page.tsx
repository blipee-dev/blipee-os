"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
      <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8 md:p-12 hover:bg-white/[0.03] transition-all duration-300">
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
      icon: BarChart3,
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
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 p-0.5 rounded-xl" style={{background: 'linear-gradient(to bottom right, rgb(236, 72, 153), rgb(147, 51, 234))'}}>
                <div className="w-full h-full bg-black/95 rounded-[10px] flex items-center justify-center">
                  <Home className="w-5 h-5 sm:w-6 sm:h-6" stroke="url(#homeGradient)" fill="none" strokeWidth="2" />
                  <svg width="0" height="0">
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
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="px-3 py-2.5 rounded-full bg-transparent hover:bg-white/[0.05] transition-colors"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-purple-400" />
                )}
              </button>
              
              <Link href="/signin">
                <button className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all">
                  Sign In
                </button>
              </Link>
              
              {/* Menu button for all screen sizes */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 flex items-center justify-center"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6 text-white" stroke="url(#xGradient)" />
                ) : (
                  <div className="w-6 h-6 relative">
                    <div className="w-6 h-0.5 rounded-full absolute top-1.5" 
                         style={{background: 'linear-gradient(to right, rgb(236, 72, 153), rgb(147, 51, 234))'}}></div>
                    <div className="w-6 h-0.5 rounded-full absolute top-3" 
                         style={{background: 'linear-gradient(to right, rgb(236, 72, 153), rgb(147, 51, 234))'}}></div>
                    <div className="w-6 h-0.5 rounded-full absolute top-4.5" 
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
              className="absolute right-0 top-full mt-2 w-full md:w-64 bg-black/90 backdrop-blur-xl border border-white/[0.05] rounded-lg py-4 shadow-2xl"
            >
              <div className="flex flex-col space-y-1">
                <Link href="/features" className="text-white font-medium px-4 py-2 hover:bg-white/[0.05] transition-colors">Features</Link>
                <Link href="/industries" className="text-gray-300 hover:text-white px-4 py-2 hover:bg-white/[0.05] transition-colors">Industries</Link>
                <Link href="/ai-technology" className="text-gray-300 hover:text-white px-4 py-2 hover:bg-white/[0.05] transition-colors">AI Technology</Link>
                <Link href="/about" className="text-gray-300 hover:text-white px-4 py-2 hover:bg-white/[0.05] transition-colors">About</Link>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center px-4 py-2 bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-full mb-8">
              <Sparkles className="w-4 h-4 text-pink-400 mr-2" />
              <span className="text-sm font-medium text-gray-300">
                Every feature designed for impact
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Features that Transform
              </span>
              <br />
              <span className="text-white">
                Sustainability Management
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              From conversational AI to predictive analytics, every feature is
              crafted to make sustainability simple, actionable, and impactful.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto space-y-12">
          {featureCategories.map((category, index) => (
            <FeatureCategory key={index} {...category} index={index} />
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
      <footer className="bg-black text-white px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center gap-8">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="w-10 h-10 p-0.5 rounded-xl" style={{background: 'linear-gradient(to bottom right, rgb(236, 72, 153), rgb(147, 51, 234))'}}>
                <div className="w-full h-full bg-black/95 rounded-[10px] flex items-center justify-center">
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
            
            <div className="flex flex-col items-center gap-4 text-sm text-gray-400">
              <div className="flex flex-wrap justify-center gap-6">
                <Link href="/features" className="hover:text-white transition-colors">Features</Link>
                <Link href="/industries" className="hover:text-white transition-colors">Industries</Link>
                <Link href="/ai-technology" className="hover:text-white transition-colors">AI Technology</Link>
                <Link href="/about" className="hover:text-white transition-colors">About</Link>
                <button onClick={() => setIsContactModalOpen(true)} className="hover:text-white transition-colors">Contact</button>
                <button onClick={() => setIsSupportModalOpen(true)} className="hover:text-white transition-colors">Support</button>
              </div>
              <div className="flex flex-wrap justify-center gap-6 border-t border-gray-700 pt-4">
                <Link href="/terms-of-use" className="hover:text-white transition-colors">Terms</Link>
                <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
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
                <option value="" className="bg-black">Select Issue Type</option>
                <option value="technical" className="bg-black">Technical Issue</option>
                <option value="billing" className="bg-black">Billing Question</option>
                <option value="feature" className="bg-black">Feature Request</option>
                <option value="other" className="bg-black">Other</option>
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
  );
}