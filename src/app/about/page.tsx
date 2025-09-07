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



export default function AboutPage() {
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-black text-white">
      <svg width="0" height="0">
        <defs>
          <linearGradient id="homeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(236, 72, 153)" />
            <stop offset="100%" stopColor="rgb(147, 51, 234)" />
          </linearGradient>
        </defs>
      </svg>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 p-0.5 rounded-xl" style={{background: 'linear-gradient(to bottom right, rgb(236, 72, 153), rgb(147, 51, 234))'}}>
                <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center">
                  <Home className="w-5 h-5 sm:w-6 sm:h-6" stroke="url(#homeGradient)" fill="none" strokeWidth="2" />
                </div>
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
                className="text-gray-900 dark:text-white font-medium"
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
              className="md:hidden p-2 rounded-lg hover:bg-white/10"
            >
              {mobileMenuOpen ? 
                <X className="w-6 h-6" stroke="url(#homeGradient)" fill="none" strokeWidth="2" /> : 
                <div 
                  className="w-6 h-6"
                  style={{
                    background: 'linear-gradient(to right, rgb(236, 72, 153), rgb(147, 51, 234))',
                    mask: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cline x1=\'4\' x2=\'20\' y1=\'6\' y2=\'6\'/%3E%3Cline x1=\'4\' x2=\'20\' y1=\'12\' y2=\'12\'/%3E%3Cline x1=\'4\' x2=\'20\' y1=\'18\' y2=\'18\'/%3E%3C/svg%3E") center / contain no-repeat',
                    WebkitMask: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cline x1=\'4\' x2=\'20\' y1=\'6\' y2=\'6\'/%3E%3Cline x1=\'4\' x2=\'20\' y1=\'12\' y2=\'12\'/%3E%3Cline x1=\'4\' x2=\'20\' y1=\'18\' y2=\'18\'/%3E%3C/svg%3E") center / contain no-repeat'
                  }}
                />
              }
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-black border-t border-white/10"
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
              <Link href="/about" className="block text-gray-900 dark:text-white font-medium py-2">
                About
              </Link>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-800 space-y-3">
                <Link href="/signin" className="block">
                  <button className="w-full px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all">
                    Sign In
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-white">
              About <span className="font-normal bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">blipee</span>
            </h1>
            <p className="text-xl text-white mb-8 max-w-3xl mx-auto">
              We're building the world's first Autonomous Sustainability Intelligence platform that transforms traditional 
              dashboard-based ESG management into conversational AI that works 24/7 as your digital sustainability team. 
              Our mission is to create not just software, but AI employees that autonomously manage, optimize, and improve 
              sustainability performance across any industry.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-8">Our Vision</h2>
            <p className="text-lg text-white max-w-3xl mx-auto leading-relaxed">
              A world where every organization has access to intelligent, autonomous sustainability management—where 
              environmental stewardship is not a burden but an empowering, data-driven advantage. We envision a future 
              where AI employees work alongside human teams to make sustainability decisions in real-time, turning 
              compliance into competitive advantage and environmental responsibility into business growth.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-8">Our Mission</h2>
            <p className="text-lg text-white max-w-3xl mx-auto leading-relaxed">
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
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4 text-white">Our Values</h2>
            <p className="text-white text-lg">The principles that guide how we work, make decisions, and build our culture</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-6 hover:bg-white/[0.05] transition-all duration-300"
              >
                <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">{value.title}</h3>
                <p className="text-gray-300 leading-relaxed">{value.description}</p>
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
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </motion.div>
        </div>
      )}
      {/* Simple Footer */}
      <footer className="bg-black text-white px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-10 h-10 p-0.5 rounded-xl" style={{background: 'linear-gradient(to bottom right, rgb(236, 72, 153), rgb(147, 51, 234))'}}>
                <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center">
                  <Home className="w-6 h-6" stroke="url(#homeGradient)" fill="none" strokeWidth="2" />
                </div>
              </div>
              <span className="ml-3 text-xl font-normal bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                blipee
              </span>
            </div>
            {/* Links */}
            <div className="flex flex-col md:flex-row gap-4 text-sm text-gray-400">
              <div className="flex flex-wrap gap-6">
                <Link href="#features" className="hover:text-white transition-colors">Features</Link>
                <Link href="#use-cases" className="hover:text-white transition-colors">Industries</Link>
                <Link href="#ai-capabilities" className="hover:text-white transition-colors">AI Technology</Link>
                <Link href="/about" className="hover:text-white transition-colors">About</Link>
                <button onClick={() => setShowSupportModal(true)} className="hover:text-white transition-colors">Support</button>
                <button onClick={() => setShowContactModal(true)} className="hover:text-white transition-colors">Contact</button>
              </div>
              <div className="flex flex-wrap gap-6 border-t md:border-t-0 md:border-l border-gray-800 pt-4 md:pt-0 md:pl-6">
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

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowContactModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-black border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
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
            className="relative bg-black border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
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
  );
}
