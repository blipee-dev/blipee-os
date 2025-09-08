'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTheme } from '@/providers/ThemeProvider';
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
  Sun,
  Moon,
} from 'lucide-react';



export default function AboutPage() {
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  const values = [
    {
      title: "Relentless Innovation",
      description: "We believe in pushing boundaries and challenging the status quo. Every day we ask: how can we make sustainability management 10x better, not just incrementally improved?"
    },
    {
      title: "Customer Obsession",
      description: "Our customers' success is our success. We listen deeply, iterate rapidly, and won't rest until sustainability teams feel empowered rather than overwhelmed by their tools"
    },
    {
      title: "Transparency & Trust",
      description: "We build with openness—transparent about our AI decisions, our data usage, and our company progress. Trust is earned through consistent actions, not promises"
    },
    {
      title: "Global Impact Mindset",
      description: "Every feature we build, every decision we make is evaluated through the lens of global environmental impact. We're not just building software; we're fighting climate change"
    },
    {
      title: "Quality Over Speed",
      description: "We move fast but never compromise on quality. Our AI must be reliable, our data accurate, and our insights actionable—because sustainability decisions matter too much to get wrong"
    },
    {
      title: "Diverse Perspectives",
      description: "The climate crisis affects everyone differently. We build an inclusive team with varied backgrounds because diverse perspectives lead to better solutions for a global challenge"
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
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-purple-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#111111]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-lg" aria-label="Go to homepage">
              <div className="w-8 h-8 sm:w-10 sm:h-10 p-0.5 rounded-xl" style={{background: 'linear-gradient(to bottom right, rgb(236, 72, 153), rgb(147, 51, 234))'}}>
                <div className="w-full h-full bg-white/95 dark:bg-[#111111]/95 rounded-[10px] flex items-center justify-center">
                  <Home className="w-5 h-5 sm:w-6 sm:h-6" stroke="url(#homeGradient)" fill="none" strokeWidth="2" aria-hidden="true" />
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
                  className="w-full h-full rounded-full bg-white/95 dark:bg-[#111111]/95 hover:bg-white/90 dark:hover:bg-black/90 transition-all flex items-center justify-center focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
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
                About <span className="font-normal bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">blipee</span>
              </h1>
            <p className="text-lg sm:text-xl text-gray-900 dark:text-white mb-8 max-w-3xl mx-auto">
              We're building the world's first Autonomous Sustainability Intelligence platform that transforms traditional 
              dashboard-based ESG management into conversational AI that works 24/7 as your digital sustainability team. 
              Our mission is to create not just software, but AI employees that autonomously manage, optimize, and improve 
              sustainability performance across any industry.
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
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">Our Vision</h2>
            <p className="text-lg text-gray-900 dark:text-white max-w-3xl mx-auto leading-relaxed">
              A world where every organization has access to intelligent, autonomous sustainability management—where 
              environmental stewardship is not a burden but an empowering, data-driven advantage. We envision a future 
              where AI employees work alongside human teams to make sustainability decisions in real-time, turning 
              compliance into competitive advantage and environmental responsibility into business growth.
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
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">Our Mission</h2>
            <p className="text-lg text-gray-900 dark:text-white max-w-3xl mx-auto leading-relaxed">
              To democratize sustainability intelligence by building AI systems that eliminate the complexity, cost, and 
              expertise barriers that prevent organizations from achieving their environmental goals. We exist to make 
              sustainability management accessible to every organization—from startups to enterprises—by providing 
              autonomous AI employees that understand, predict, and optimize environmental performance without requiring 
              specialized knowledge or massive resources.
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
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900 dark:text-white">Our Values</h2>
            <p className="text-gray-900 dark:text-white text-lg">The principles that guide how we work, make decisions, and build our culture</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-black/[0.03] dark:bg-white/[0.03] backdrop-blur-xl border border-gray-200 dark:border-white/[0.05] rounded-2xl p-6 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-all duration-300"
              >
                <h3 className="text-lg sm:text-xl font-semibold mb-4 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">{value.title}</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowContactModal(false)}></div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
          >
            <h3 className="text-2xl font-bold mb-6 text-gray-900">General Inquiry</h3>
            <form className="space-y-4">
              <input
                type="text"
                placeholder="Your Name"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <input
                type="email"
                placeholder="Your Email"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Company"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <select className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:border-purple-500 focus:outline-none">
                <option value="">Inquiry Type</option>
                <option value="general">General Information</option>
                <option value="research">Research Partnership</option>
                <option value="institutional">Institutional Use</option>
                <option value="press">Press Inquiry</option>
              </select>
              <textarea
                placeholder="Please describe your inquiry"
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
              />
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Submit Inquiry
              </button>
            </form>
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </motion.div>
        </div>
      )}
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
                <button onClick={() => setShowContactModal(true)} className="hover:text-gray-900 dark:text-white transition-colors">Contact</button>
                <button onClick={() => setShowSupportModal(true)} className="hover:text-gray-900 dark:text-white transition-colors">Support</button>
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
            
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Schedule a Demo</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
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
            
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Get Support</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
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
