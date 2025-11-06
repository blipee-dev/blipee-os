import { ReactNode } from 'react'
import { BrainCircuit, BarChart3, MessageCircleQuestion } from 'lucide-react'

export type NavLink = {
  label: string
  href: string
  prominent?: boolean
  external?: boolean
}

export const getNavLinks = (t: (key: string) => string): NavLink[] => [
  { label: t('nav.company'), href: '/company' },
  { label: t('nav.about'), href: '/about' },
  { label: t('nav.careers'), href: '/careers' },
  { label: t('nav.signIn'), href: '/signin', prominent: true },
]

export const getHeroContent = (t: (key: string) => string) => ({
  badge: t('hero.badge'),
  title: t('hero.title'),
  highlight: t('hero.titleHighlight'),
  description: t('hero.description'),
  primaryCta: {
    label: t('hero.primaryCta'),
    href: '/contact',
  },
  secondaryCta: {
    label: t('hero.secondaryCta'),
    href: '#features',
  },
})

export const getProblemContent = (t: (key: string) => string) => ({
  titlePrefix: t('problem.titlePrefix'),
  highlight: t('problem.titleHighlight'),
  titleSuffix: t('problem.titleSuffix'),
  description: t('problem.description'),
})

type FeatureCard = {
  title: string
  description: string
  icon: ReactNode
}

export const getAiFeatures = (t: (key: string) => string): FeatureCard[] => [
  {
    title: t('aiFeatures.autonomousOps.title'),
    description: t('aiFeatures.autonomousOps.description'),
    icon: <BrainCircuit className="w-9 h-9" />,
  },
  {
    title: t('aiFeatures.realTimeVision.title'),
    description: t('aiFeatures.realTimeVision.description'),
    icon: <BarChart3 className="w-9 h-9" />,
  },
  {
    title: t('aiFeatures.predictiveIntelligence.title'),
    description: t('aiFeatures.predictiveIntelligence.description'),
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

export const getAgents = (t: (key: string) => string): Agent[] => [
  {
    name: t('agents.chiefOfStaff.name'),
    role: t('agents.chiefOfStaff.role'),
    description: t('agents.chiefOfStaff.description'),
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
    name: t('agents.complianceGuardian.name'),
    role: t('agents.complianceGuardian.role'),
    description: t('agents.complianceGuardian.description'),
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
    name: t('agents.carbonHunter.name'),
    role: t('agents.carbonHunter.role'),
    description: t('agents.carbonHunter.description'),
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
    name: t('agents.supplyChainInvestigator.name'),
    role: t('agents.supplyChainInvestigator.role'),
    description: t('agents.supplyChainInvestigator.description'),
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
    name: t('agents.costSavingFinder.name'),
    role: t('agents.costSavingFinder.role'),
    description: t('agents.costSavingFinder.description'),
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
    name: t('agents.predictiveMaintenance.name'),
    role: t('agents.predictiveMaintenance.role'),
    description: t('agents.predictiveMaintenance.description'),
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
    name: t('agents.autonomousOptimizer.name'),
    role: t('agents.autonomousOptimizer.role'),
    description: t('agents.autonomousOptimizer.description'),
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
    name: t('agents.regulatoryForesight.name'),
    role: t('agents.regulatoryForesight.role'),
    description: t('agents.regulatoryForesight.description'),
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

export const getAssistantContent = (t: (key: string) => string) => ({
  title: t('assistant.title'),
  highlight: t('assistant.titleHighlight'),
  description: t('assistant.description'),
})

export const getAssistantFeatures = (t: (key: string) => string): string[] => [
  t('assistant.features.plainLanguage'),
  t('assistant.features.autoRouting'),
  t('assistant.features.proactiveBriefs'),
  t('assistant.features.retainsContext'),
]

export const getImpactStats = (t: (key: string) => string) => [
  { value: t('impact.costSavings.value'), label: t('impact.costSavings.label') },
  { value: t('impact.forecastAccuracy.value'), label: t('impact.forecastAccuracy.label') },
  { value: t('impact.continuousMonitoring.value'), label: t('impact.continuousMonitoring.label') },
  { value: t('impact.reportingReduction.value'), label: t('impact.reportingReduction.label') },
]

export const getCtaContent = (t: (key: string) => string) => ({
  title: t('cta.titlePrefix'),
  highlight: t('cta.titleHighlight'),
  description: t('cta.description'),
  primary: { label: t('cta.primaryCta'), href: '/contact' },
  secondary: { label: t('cta.secondaryCta'), href: '/about' },
})

export const getFooterSections = (t: (key: string) => string) => [
  {
    title: t('footer.product.title'),
    links: [
      { label: t('footer.product.aiWorkforce'), href: '#agents' },
      { label: t('footer.product.capabilities'), href: '#features' },
      { label: t('footer.product.pricing'), href: '/pricing' },
      { label: t('footer.product.updates'), href: '/updates' },
    ],
  },
  {
    title: t('footer.company.title'),
    links: [
      { label: t('footer.company.aboutUs'), href: '/company' },
      { label: t('footer.company.ourStory'), href: '/about' },
      { label: t('footer.company.careers'), href: '/careers' },
      { label: t('footer.company.contact'), href: '/contact' },
    ],
  },
  {
    title: t('footer.resources.title'),
    links: [
      { label: t('footer.resources.documentation'), href: '/documentation' },
      { label: t('footer.resources.api'), href: '/api' },
      { label: t('footer.resources.faq'), href: '/faq' },
      { label: t('footer.resources.support'), href: '/support' },
      { label: t('footer.resources.status'), href: '/status' },
    ],
  },
]

export const getFooterSummary = (t: (key: string) => string) => ({
  brand: t('footer.brand'),
  description: t('footer.description'),
  newsletterPlaceholder: t('footer.newsletterPlaceholder'),
  newsletterCta: t('footer.newsletterCta'),
  copyright: t('footer.copyright'),
})

export const getFooterSocial = (t: (key: string) => string): { label: string; href: string; icon: ReactNode }[] => [
  {
    label: t('footer.socialTwitter'),
    href: 'https://twitter.com/blipee',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
      </svg>
    ),
  },
  {
    label: t('footer.socialLinkedIn'),
    href: 'https://linkedin.com/company/blipee',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  {
    label: t('footer.socialGitHub'),
    href: 'https://github.com/blipee',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]
