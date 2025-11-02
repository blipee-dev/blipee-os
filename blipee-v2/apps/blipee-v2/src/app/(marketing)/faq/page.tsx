'use client'

import { Navbar } from '../landing/components/Navbar'
import { Footer } from '../landing/components/Footer'
import { Background } from '../landing/components/Background'
import { CTASection } from '../landing/components/CTASection'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useThemeToggle } from '../landing/hooks/useThemeToggle'
import styles from './faq.module.css'
import landingStyles from '../landing/landing.module.css'

interface FAQItem {
  question: string
  answer: string
}

interface FAQCategory {
  title: string
  items: FAQItem[]
}

const faqData: FAQCategory[] = [
  {
    title: 'Getting Started',
    items: [
      {
        question: 'What is blipee?',
        answer: 'blipee is an AI-powered sustainability platform featuring 8 autonomous agents that work 24/7 to optimize your operations, reduce carbon emissions, manage supply chains, ensure regulatory compliance, and drive cost savings.'
      },
      {
        question: 'How do I get started with blipee?',
        answer: 'Simply sign up for an account, connect your data sources, and our AI agents will begin analyzing your operations. Our onboarding process typically takes less than 24 hours, and you\'ll start seeing insights immediately.'
      },
      {
        question: 'What industries does blipee serve?',
        answer: 'blipee serves a wide range of industries including manufacturing, logistics, energy, retail, and any organization focused on sustainability and operational efficiency.'
      }
    ]
  },
  {
    title: 'AI Agents',
    items: [
      {
        question: 'What are the 8 AI agents?',
        answer: 'Our platform includes: Carbon Footprint Agent (emissions tracking), ESG Compliance Agent (regulatory adherence), Energy Optimization Agent (consumption reduction), Supply Chain Agent (carbon tracking), Regulatory Agent (compliance monitoring), Predictive Maintenance Agent (equipment optimization), Cost Savings Agent (financial analysis), and Data Insights Agent (actionable intelligence).'
      },
      {
        question: 'How do the agents work together?',
        answer: 'All agents share data and insights in real-time, creating a comprehensive view of your operations. They collaborate to identify opportunities, predict issues, and recommend actions that optimize across multiple dimensions simultaneously.'
      },
      {
        question: 'Do the agents learn from my business?',
        answer: 'Yes! Our AI agents continuously learn from your data, operations, and patterns. The more you use blipee, the more accurate and personalized the insights become, adapting to your specific business context and industry requirements.'
      }
    ]
  },
  {
    title: 'blipee Assistant',
    items: [
      {
        question: 'What is the blipee Assistant?',
        answer: 'The blipee Assistant is your AI-powered sustainability companion that appears on every page. It provides instant answers, guidance, and help navigating the platform, making it easy to get the information you need without leaving your current workflow.'
      },
      {
        question: 'How can the Assistant help me?',
        answer: 'The Assistant can answer questions about your data, explain sustainability metrics, provide guidance on using features, help interpret agent insights, and direct you to the right resources. Think of it as your 24/7 sustainability expert.'
      },
      {
        question: 'Is the Assistant available on all pages?',
        answer: 'Yes! The blipee Assistant is available throughout the entire platform. Simply click on the blipee icon at the bottom right of any page to start a conversation.'
      }
    ]
  },
  {
    title: 'Pricing & Plans',
    items: [
      {
        question: 'How is blipee priced?',
        answer: 'blipee offers custom pricing tailored to your specific business needs, team size, and industry requirements. Contact our sales team to discuss your requirements and receive a personalized quote within 24 hours.'
      },
      {
        question: 'What factors affect pricing?',
        answer: 'Pricing is based on several factors including your organization size, number of data sources, required integrations, level of support needed, and which AI agents you want to activate. We work with you to create a solution that fits your budget.'
      },
      {
        question: 'What\'s included in every plan?',
        answer: 'All plans include: access to our 8 autonomous AI agents, real-time monitoring dashboards, compliance automation, API access, custom integrations, and dedicated support with priority response times.'
      }
    ]
  },
  {
    title: 'Technical',
    items: [
      {
        question: 'How does blipee integrate with my existing systems?',
        answer: 'blipee offers REST APIs, webhooks, and pre-built integrations with popular platforms. We support standard data formats and can work with your IT team for custom integrations.'
      },
      {
        question: 'Is my data secure?',
        answer: 'Absolutely. We use enterprise-grade encryption, SOC 2 compliance, and follow industry best practices for data security. Your data is encrypted in transit and at rest.'
      },
      {
        question: 'What kind of data does blipee need?',
        answer: 'Depending on your goals, we can work with energy consumption data, supply chain information, emissions data, operational metrics, maintenance logs, and financial data. We\'ll guide you on what data is most valuable for your use case.'
      }
    ]
  },
  {
    title: 'Support',
    items: [
      {
        question: 'What support options are available?',
        answer: 'All customers receive email support. Premium plans include live chat and phone support. Enterprise customers get a dedicated account manager and priority support.'
      },
      {
        question: 'Do you provide training?',
        answer: 'Yes! We offer comprehensive onboarding, video tutorials, documentation, and live training sessions for your team.'
      },
      {
        question: 'How quickly can I expect a response?',
        answer: 'We aim to respond to all support requests within 24 hours. Premium and Enterprise customers receive priority support with faster response times.'
      }
    ]
  }
]

function FAQAccordion({ category }: { category: FAQCategory }) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }

  return (
    <div className={styles.category}>
      <h2 className={styles.categoryTitle}>{category.title}</h2>
      <div className={styles.items}>
        {category.items.map((item, index) => (
          <div key={index} className={styles.item}>
            <button
              className={styles.question}
              onClick={() => toggleItem(index)}
              aria-expanded={openItems.has(index)}
            >
              <span>{item.question}</span>
              <ChevronDown
                className={`${styles.chevron} ${openItems.has(index) ? styles.chevronOpen : ''}`}
                size={20}
              />
            </button>
            <div className={`${styles.answer} ${openItems.has(index) ? styles.answerOpen : ''}`}>
              <p>{item.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FAQPage() {
  const { mode: themeMode, setTheme } = useThemeToggle()

  return (
    <div className={landingStyles.landing}>
      <Background />
      <div className={landingStyles.contentWrapper}>
        <Navbar />
        <main className={styles.main}>
          <section className={styles.hero}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                Frequently Asked <span className={landingStyles.gradientText}>Questions</span>
              </h1>
              <p className={styles.heroSubtitle}>
                Everything you need to know about blipee and our AI-powered sustainability platform.
              </p>
            </div>
          </section>
          <section className={styles.faqSection}>
            <div className={styles.container}>
              {faqData.map((category, index) => (
                <FAQAccordion key={index} category={category} />
              ))}
            </div>
          </section>
          <CTASection />
        </main>
        <Footer themeMode={themeMode} onThemeChange={setTheme} />
      </div>
    </div>
  )
}
