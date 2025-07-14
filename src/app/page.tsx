"use client";

import React from "react";
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
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
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

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Sustainability Intelligence
            </span>
            <br />
            <span className="text-gray-900 dark:text-white">
              Through Conversation
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
            Where AI meets sustainability with a touch of magic ✨ The
            revolution isn&apos;t coming—it&apos;s here, and it speaks your
            language. Welcome to the future where saving the planet feels like
            chatting with your smartest friend.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center"
              >
                Start 7-Minute Setup
                <ArrowRight className="ml-2 w-5 h-5" />
              </motion.button>
            </Link>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
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
    <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
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
              Revolutionary Capabilities
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            The most advanced sustainability platform, powered by AI that
            predicts, advises, and acts
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all group">
                <div
                  className={`w-14 h-14 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
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
      query: "Reduce our building emissions by 40% this year",
      response:
        "I've analyzed your energy patterns and identified 7 optimization opportunities that will reduce emissions by 42% while saving $127,000 annually...",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Factory,
      title: "For Manufacturing",
      query: "What's our carbon footprint per product unit?",
      response:
        "Each unit produces 12.7 kg CO₂e. Main hotspots: raw materials (45%), energy (30%), transport (25%). I recommend switching to Supplier B to reduce by 23%...",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Building,
      title: "For Any Industry",
      query: "Help us achieve net-zero by 2030",
      response:
        "Based on your current trajectory, here's your personalized roadmap: 1) Renewable energy transition by Q2 2025, 2) Supply chain optimization saving 2,847 tons CO₂...",
      gradient: "from-pink-500 to-violet-500",
    },
  ];

  return (
    <section className="py-20 px-4 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Works for{" "}
            <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Every Industry
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            See how organizations achieve their sustainability goals through
            conversation
          </p>
        </motion.div>

        <div className="space-y-8">
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 shadow-lg"
            >
              <div className="flex items-start gap-6">
                <div
                  className={`w-12 h-12 bg-gradient-to-r ${useCase.gradient} rounded-xl flex items-center justify-center flex-shrink-0`}
                >
                  <useCase.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                    {useCase.title}
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        You ask:
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        &quot;{useCase.query}&quot;
                      </p>
                    </div>
                    <div
                      className={`bg-gradient-to-r ${useCase.gradient} bg-opacity-10 rounded-lg p-4 border border-gray-200 dark:border-gray-700`}
                    >
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        AI responds:
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        {useCase.response}
                      </p>
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

// Stats section
function StatsSection() {
  const stats = [
    { value: "90%", label: "Reduction in Manual Work", suffix: "" },
    { value: "7", label: "Minutes to Full Setup", suffix: "min" },
    { value: "99.2", label: "AI Accuracy Rate", suffix: "%" },
    { value: "847", label: "Tons CO₂ Saved Daily", suffix: "t" },
  ];

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600"></div>
      <div className="relative max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-5xl md:text-6xl font-bold text-white mb-2">
                {stat.value}
                <span className="text-3xl">{stat.suffix}</span>
              </div>
              <p className="text-white/80 text-lg">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// AI capabilities section
function AICapabilitiesSection() {
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
    <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              12 AI Brains Working{" "}
              <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                For You 24/7
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Our multi-brain AI architecture ensures every aspect of
              sustainability is covered, from real-time monitoring to predictive
              analytics and autonomous actions.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {capabilities.map((capability, index) => (
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
            className="relative"
          >
            <div className="bg-gradient-to-br from-pink-100 to-purple-100 dark:from-purple-900 dark:to-indigo-900 rounded-2xl p-8 shadow-2xl">
              <div className="grid grid-cols-3 gap-4">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      delay: i * 0.2,
                    }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
                  >
                    <Brain className="w-8 h-8 text-purple-500 mx-auto" />
                  </motion.div>
                ))}
              </div>
              <p className="text-center mt-6 text-gray-600 dark:text-gray-300 font-semibold">
                Multi-Brain AI Architecture
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Testimonials section
function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "blipee OS helped us achieve our 2030 net-zero target 5 years early. The AI insights are game-changing.",
      author: "Sarah Chen",
      role: "Chief Sustainability Officer, TechCorp",
      rating: 5,
    },
    {
      quote:
        "Finally, a platform that makes sustainability management as easy as having a conversation. ROI in 3 months.",
      author: "Marcus Johnson",
      role: "VP Operations, Global Manufacturing",
      rating: 5,
    },
    {
      quote:
        "The document parsing alone saves us 40 hours per week. It found $2M in emission reduction opportunities.",
      author: "Emily Rodriguez",
      role: "Sustainability Director, Retail Giant",
      rating: 5,
    },
  ];

  return (
    <section className="py-20 px-4 bg-white dark:bg-gray-800">
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
              Trusted by Leaders
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Join organizations achieving their sustainability goals faster
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 shadow-xl"
            >
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-current"
                  />
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6 italic">
                &quot;{testimonial.quote}&quot;
              </p>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {testimonial.author}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {testimonial.role}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA section
function CTASection() {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600"></div>
      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Start Your Sustainability Transformation
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join the AI revolution in sustainability management. Set up in 7
            minutes. See results immediately.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-gray-900 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </motion.button>
            </Link>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white/20 backdrop-blur-sm border-2 border-white text-white rounded-full font-semibold text-lg shadow-lg hover:bg-white/30 transition-all"
            >
              Schedule Demo
            </motion.button>
          </div>

          <p className="mt-8 text-white/70">
            No credit card required • 30-day free trial • Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Home className="w-6 h-6 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                blipee OS
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

            <div className="flex items-center gap-4">
              <Link href="/signin">
                <button className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium">
                  Sign In
                </button>
              </Link>
              <Link href="/signup">
                <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main>
        <HeroSection />
        <FeaturesSection />
        <UseCasesSection />
        <StatsSection />
        <AICapabilitiesSection />
        <TestimonialsSection />
        <CTASection />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  blipee OS
                </span>
              </div>
              <p className="text-gray-400">
                The world&apos;s first conversational sustainability AI
                platform.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Industries
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    API
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Support
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Partners
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Compliance
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 blipee OS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
