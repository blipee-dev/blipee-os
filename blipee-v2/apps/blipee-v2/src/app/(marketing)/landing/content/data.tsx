import { ReactNode } from 'react'
import { BrainCircuit, BarChart3, MessageCircleQuestion } from 'lucide-react'

export type NavLink = {
  label: string
  href: string
  prominent?: boolean
  external?: boolean
}

export const navLinks: NavLink[] = [
  { label: 'Company', href: '/company' },
  { label: 'About', href: '/about' },
  { label: 'Careers', href: '/careers' },
  { label: 'Sign In', href: '/signin', prominent: true },
]

export const heroContent = {
  badge: '8 AI Agents Working 24/7 for Your Sustainability Goals',
  title: 'Stop Managing Sustainability. Start Living It',
  highlight: 'Living It',
  description:
    "While your competitors hire consultants and build spreadsheets, you get an entire AI workforce that never sleeps. 8 autonomous agents analyzing data, predicting risks, finding savings, and ensuring compliance — automatically.",
  primaryCta: {
    label: 'Get Started',
    href: '/contact',
  },
  secondaryCta: {
    label: 'See What Makes Us Different',
    href: '#features',
  },
}

export const problemContent = {
  titlePrefix: 'The Sustainability Challenge is',
  highlight: 'Impossible',
  titleSuffix: 'to Manage Manually',
  description:
    "You're drowning in data from 15+ emission categories. Compliance frameworks change monthly. Energy patterns hide in thousands of data points. Suppliers go unmonitored. By the time you spot a problem, it's already cost you thousands — or worse, your reputation.",
}

type FeatureCard = {
  title: string
  description: string
  icon: ReactNode
}

export const aiFeatures: FeatureCard[] = [
  {
    title: 'Autonomous AI Operations',
    description:
      'Every workflow orchestrated by agents tuned for ESG. They prioritise initiatives and keep the board informed without manual effort.',
    icon: <BrainCircuit className="w-9 h-9" />,
  },
  {
    title: 'Real-time Sustainability Vision',
    description:
      'Computer vision across facilities and assets identifies anomalies instantly, grounding insights in real-world behaviour.',
    icon: <BarChart3 className="w-9 h-9" />,
  },
  {
    title: 'Predictive Intelligence Everywhere',
    description:
      'Forecast energy, water, waste, and carbon impacts 12 months ahead with 98.5% accuracy. Agents act before issues escalate.',
    icon: <MessageCircleQuestion className="w-9 h-9" />,
  },
]

type Agent = {
  name: string
  role: string
  description: string
  bulletPoints?: string[]
  icon: ReactNode
}

export const agents: Agent[] = [
  {
    name: 'ESG Chief of Staff',
    role: 'Executive Leadership • 24/7',
    description:
      'Strategic oversight across all sustainability operations. Coordinates agent activities, prioritizes initiatives, and delivers board-ready insights.',
    icon: (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="25" width="60" height="50" rx="8" fill="#10b981" />
        <circle cx="35" cy="45" r="6" fill="#fff" />
        <circle cx="65" cy="45" r="6" fill="#fff" />
        <rect x="40" y="60" width="20" height="3" rx="1.5" fill="#fff" />
        <rect x="45" y="15" width="4" height="12" rx="2" fill="#059669" />
        <circle cx="47" cy="13" r="4" fill="#34d399" />
      </svg>
    ),
  },
  {
    name: 'Compliance Guardian',
    role: 'Regulatory Expert • 24/7',
    description:
      'Monitors 7+ frameworks (GHG, GRI, ESRS, TCFD). Auto-generates reports, flags risks before audits, and keeps you perpetually compliant.',
    icon: (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="25" width="60" height="50" rx="8" fill="#3b82f6" />
        <rect x="30" y="40" width="12" height="10" rx="2" fill="#fff" />
        <rect x="58" y="40" width="12" height="10" rx="2" fill="#fff" />
        <rect x="40" y="60" width="20" height="4" rx="2" fill="#fff" />
        <rect x="35" y="15" width="6" height="12" rx="3" fill="#1d4ed8" />
        <rect x="59" y="15" width="6" height="12" rx="3" fill="#1d4ed8" />
        <rect x="37" y="12" width="26" height="4" rx="2" fill="#60a5fa" />
      </svg>
    ),
  },
  {
    name: 'Carbon Hunter',
    role: 'Emissions Specialist • 24/7',
    description:
      'Hunts carbon reduction opportunities across all scopes. Identifies quick wins, tracks progress, and optimizes energy usage in real-time.',
    icon: (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="25" width="60" height="50" rx="8" fill="#8b5cf6" />
        <circle cx="35" cy="45" r="7" fill="#fff" />
        <circle cx="65" cy="45" r="7" fill="#fff" />
        <circle cx="35" cy="45" r="3" fill="#6d28d9" />
        <circle cx="65" cy="45" r="3" fill="#6d28d9" />
        <path d="M40 62 L50 58 L60 62" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        <circle cx="35" cy="18" r="5" fill="#a78bfa" />
        <circle cx="65" cy="18" r="5" fill="#a78bfa" />
        <line x1="35" y1="23" x2="35" y2="25" stroke="#7c3aed" strokeWidth="3" />
        <line x1="65" y1="23" x2="65" y2="25" stroke="#7c3aed" strokeWidth="3" />
      </svg>
    ),
  },
  {
    name: 'Supply Chain Investigator',
    role: 'Risk Analyst • 24/7',
    description:
      'Continuous supplier due diligence and risk assessment. Flags ESG violations before they become liabilities.',
    icon: (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="25" width="60" height="50" rx="8" fill="#f97316" />
        <circle cx="35" cy="42" r="5" fill="#fff" />
        <circle cx="65" cy="42" r="5" fill="#fff" />
        <ellipse cx="35" cy="52" rx="6" ry="4" fill="#fff" opacity="0.6" />
        <ellipse cx="65" cy="52" rx="6" ry="4" fill="#fff" opacity="0.6" />
        <rect x="42" y="60" width="16" height="3" rx="1.5" fill="#fff" />
        <polygon points="50,15 45,25 55,25" fill="#ea580c" />
        <rect x="48" y="12" width="4" height="6" rx="2" fill="#fb923c" />
      </svg>
    ),
  },
  {
    name: 'Cost Saving Finder',
    role: 'Financial Analyst • 24/7',
    description:
      'Discovers hidden savings in energy bills, waste management, and operations. Average client saves 18% in year one.',
    icon: (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="18" y="30" width="64" height="46" rx="10" fill="#facc15" />
        <circle cx="36" cy="54" r="8" fill="#fff8db" />
        <circle cx="64" cy="46" r="10" fill="#fde047" stroke="#f59e0b" strokeWidth="3" />
        <path d="M61 46h6" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
        <path d="M64 43v6" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
        <rect x="44" y="38" width="12" height="20" rx="2" fill="#fef9c3" stroke="#d97706" strokeWidth="2" />
        <path d="M30 68h40" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: 'Predictive Maintenance',
    role: 'Equipment Specialist • 24/7',
    description:
      'Predicts equipment failures weeks in advance. Schedules maintenance during optimal windows, preventing costly downtime.',
    icon: (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="28" width="60" height="44" rx="10" fill="#0ea5e9" />
        <circle cx="50" cy="50" r="16" stroke="#f8fafc" strokeWidth="4" />
        <path d="M50 36v8" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
        <path d="M58 50h8" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
        <path d="M50 58v8" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
        <path d="M34 50h8" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
        <path d="M50 14l8 10h-16l8-10Z" fill="#38bdf8" />
        <rect x="46" y="10" width="8" height="6" rx="2" fill="#bae6fd" />
      </svg>
    ),
  },
  {
    name: 'Autonomous Optimizer',
    role: 'Performance Tuner • 24/7',
    description:
      'Continuously optimizes operations for maximum efficiency. Auto-adjusts systems based on patterns invisible to humans.',
    icon: (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="60" height="60" rx="12" fill="#6366f1" />
        <rect x="28" y="28" width="44" height="44" rx="8" fill="#4338ca" />
        <rect x="36" y="36" width="28" height="28" rx="6" fill="#eef2ff" />
        <rect x="42" y="42" width="16" height="16" rx="4" fill="#6366f1" />
        <path d="M50 28v8" stroke="#c7d2fe" strokeWidth="3" strokeLinecap="round" />
        <path d="M50 64v8" stroke="#c7d2fe" strokeWidth="3" strokeLinecap="round" />
        <path d="M28 50h8" stroke="#c7d2fe" strokeWidth="3" strokeLinecap="round" />
        <path d="M64 50h8" stroke="#c7d2fe" strokeWidth="3" strokeLinecap="round" />
        <path d="M60 40 70 30" stroke="#a5b4fc" strokeWidth="3" strokeLinecap="round" />
        <path d="M40 60 30 70" stroke="#a5b4fc" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: 'Regulatory Foresight',
    role: 'Future Predictor • 24/7',
    description:
      'Monitors regulatory changes globally. Prepares you for new requirements months before they take effect.',
    icon: (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="18" y="28" width="64" height="44" rx="12" fill="#3b82f6" opacity="0.85" />
        <path d="M18 50s12-22 32-22 32 22 32 22-12 22-32 22-32-22-32-22Z" fill="none" stroke="#bfdbfe" strokeWidth="4" />
        <circle cx="50" cy="50" r="10" fill="#bfdbfe" />
        <circle cx="50" cy="50" r="4" fill="#1d4ed8" />
        <path d="M50 18l6 10h-12l6-10Z" fill="#60a5fa" />
        <path d="M72 70l8 12" stroke="#bfdbfe" strokeWidth="4" strokeLinecap="round" />
      </svg>
    ),
  },
]

export const assistantContent = {
  title: 'blipee Assistant',
  highlight: 'Assistant',
  description:
    'Conversational AI that orchestrates your 8-agent workforce. Ask anything, get summarized answers, and keep every stakeholder aligned.',
}

export const assistantFeatures = [
  'Plain-language answers grounded in your ESG data',
  'Routes every request to the right specialist automatically',
  'Delivers proactive briefs, alerts, and next steps',
  'Retains context across teams and past conversations',
]

export const impactStats = [
  { value: '18%', label: 'Average Cost Savings\nFirst Year' },
  { value: '98.5%', label: 'Forecast Accuracy\n12 Months Ahead' },
  { value: '24/7', label: 'Continuous Monitoring\nNever Sleeps' },
  { value: '85%', label: 'Reduction in Manual\nReporting Time' },
]

export const ctaContent = {
  title: 'Your AI Workforce',
  highlight: 'Starts Today',
  description:
    'No consultants. No months of setup. No learning curve. Your 8 AI agents are ready to start working the moment you sign up.',
  primary: { label: 'Contact Sales', href: '/contact' },
  secondary: { label: 'Learn More', href: '/about' },
}

export const footerSections = [
  {
    title: 'Product',
    links: [
      { label: 'AI Workforce', href: '#agents' },
      { label: 'Capabilities', href: '#features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Updates', href: '/updates' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/company' },
      { label: 'Our Story', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/documentation' },
      { label: 'API', href: '/api' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Support', href: '/support' },
      { label: 'Status', href: '/status' },
    ],
  },
]

export const footerSummary = {
  brand: 'blipee',
  description:
    'AI-powered sustainability platform with 8 autonomous agents working 24/7 to optimise your operations.',
  newsletterPlaceholder: 'Enter your email',
  newsletterCta: 'Subscribe',
  copyright: '© 2025 blipee. All rights reserved.',
}

export const footerSocial: { label: string; href: string; icon: ReactNode }[] = [
  {
    label: 'Twitter',
    href: 'https://twitter.com/blipee',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/company/blipee',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  {
    label: 'GitHub',
    href: 'https://github.com/blipee',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]
