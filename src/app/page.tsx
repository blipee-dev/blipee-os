'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Building2, 
  Sparkles, 
  Brain, 
  TrendingUp, 
  Zap, 
  Users, 
  Shield, 
  ChartBar,
  Clock,
  CheckCircle,
  ArrowRight,
  Play,
  Star,
  Globe,
  Cpu
} from 'lucide-react'

// Animated background component
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      <div className="absolute bottom-40 right-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-6000"></div>
    </div>
  )
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
            <Sparkles className="w-4 h-4 text-yellow-400 mr-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              AI-Powered Building Intelligence
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              The ChatGPT
            </span>
            <br />
            <span className="text-gray-900 dark:text-white">for Buildings</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
            Transform your building management with conversational AI. 
            Ask questions, get insights, and optimize operations—all through natural language.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </motion.button>
            </Link>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
            >
              <Play className="mr-2 w-5 h-5" />
              Watch Demo
            </motion.button>
          </div>
        </motion.div>
        
        {/* Floating elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="absolute top-20 right-20 hidden lg:block"
        >
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Energy Saved</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">32%</p>
              </div>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-20 left-20 hidden lg:block"
        >
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">AI Insights</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">1,247</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// Features section
function FeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: "Conversational AI",
      description: "Just ask questions in natural language and get instant answers about your building",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Zap,
      title: "Real-time Monitoring",
      description: "Track energy usage, occupancy, and system performance in real-time",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Shield,
      title: "Predictive Maintenance",
      description: "AI predicts equipment failures before they happen, saving costs",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: ChartBar,
      title: "Advanced Analytics",
      description: "Deep insights into building performance with beautiful visualizations",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: Users,
      title: "Multi-tenant Ready",
      description: "Manage multiple buildings and teams with granular permissions",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: Globe,
      title: "ESG Reporting",
      description: "Automated sustainability reporting for compliance and certification",
      gradient: "from-teal-500 to-blue-500"
    }
  ]

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
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Powerful Features
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Everything you need to transform your building operations
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
                <div className={`w-14 h-14 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
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
  )
}

// Stats section
function StatsSection() {
  const stats = [
    { value: "32%", label: "Average Energy Savings", suffix: "" },
    { value: "1.2M", label: "Buildings Optimized", suffix: "+" },
    { value: "98", label: "Customer Satisfaction", suffix: "%" },
    { value: "24/7", label: "AI Monitoring", suffix: "" }
  ]

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600"></div>
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
  )
}

// Demo section
function DemoSection() {
  return (
    <section className="py-20 px-4 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              See Blipee OS in{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Action
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Watch how facility managers save hours every week by simply talking to their buildings.
            </p>
            
            <div className="space-y-4">
              {[
                "Ask about energy consumption trends",
                "Get maintenance recommendations",
                "Monitor real-time occupancy",
                "Generate compliance reports instantly"
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <span className="text-lg text-gray-700 dark:text-gray-300">{item}</span>
                </div>
              ))}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-8 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center"
            >
              Request Live Demo
              <ArrowRight className="ml-2 w-5 h-5" />
            </motion.button>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-2xl p-8 shadow-2xl">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Blipee AI</span>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      "What's the energy consumption trend for Building A this month?"
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-3 ml-auto max-w-[80%]">
                    <p className="text-sm text-white">
                      Building A consumed 15% less energy compared to last month, 
                      saving approximately $2,847. Peak usage occurs between 2-4 PM.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating badge */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
            >
              Live Demo
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// Testimonials section
function TestimonialsSection() {
  const testimonials = [
    {
      quote: "Blipee OS transformed how we manage our 50+ buildings. The AI insights alone saved us $100K in the first quarter.",
      author: "Sarah Chen",
      role: "VP of Operations, TechCorp",
      rating: 5
    },
    {
      quote: "Finally, a building management system that speaks human. Our team adopted it instantly.",
      author: "Marcus Johnson",
      role: "Facility Director, Global Retail Inc",
      rating: 5
    },
    {
      quote: "The predictive maintenance feature prevented 3 major HVAC failures. ROI was immediate.",
      author: "Emily Rodriguez",
      role: "Property Manager, Urban Spaces",
      rating: 5
    }
  ]

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
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Loved by Teams
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Join thousands of happy customers worldwide
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
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl"
            >
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6 italic">
                "{testimonial.quote}"
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
  )
}

// CTA section
function CTASection() {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600"></div>
      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Buildings?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join the AI revolution in building management. 
            Start your free 30-day trial today.
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
              Talk to Sales
            </motion.button>
          </div>
          
          <p className="mt-8 text-white/70">
            No credit card required • 30-day free trial • Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <Building2 className="w-8 h-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                Blipee OS
              </span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Features
              </Link>
              <Link href="#demo" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Demo
              </Link>
              <Link href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Pricing
              </Link>
              <Link href="#about" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
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
                <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all">
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
        <StatsSection />
        <DemoSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <Building2 className="w-8 h-8 text-blue-400" />
                <span className="ml-2 text-xl font-bold">Blipee OS</span>
              </div>
              <p className="text-gray-400">
                The ChatGPT for Buildings. Transform your building management with AI.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Features</Link></li>
                <li><Link href="#" className="hover:text-white">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white">Demo</Link></li>
                <li><Link href="#" className="hover:text-white">API</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">About</Link></li>
                <li><Link href="#" className="hover:text-white">Blog</Link></li>
                <li><Link href="#" className="hover:text-white">Careers</Link></li>
                <li><Link href="#" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white">Terms</Link></li>
                <li><Link href="#" className="hover:text-white">Security</Link></li>
                <li><Link href="#" className="hover:text-white">Compliance</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Blipee OS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}