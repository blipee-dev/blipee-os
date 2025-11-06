'use client'

import { Navbar } from '../landing/components/Navbar'
import { Footer } from '../landing/components/Footer'
import { Background } from '../landing/components/Background'
import { CTASection } from '../landing/components/CTASection'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useThemeToggle } from '../landing/hooks/useThemeToggle'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('marketing.faq')

  const faqData: FAQCategory[] = [
    {
      title: t('gettingStarted.title'),
      items: [
        {
          question: t('gettingStarted.whatIsBlipee.question'),
          answer: t('gettingStarted.whatIsBlipee.answer')
        },
        {
          question: t('gettingStarted.howToStart.question'),
          answer: t('gettingStarted.howToStart.answer')
        },
        {
          question: t('gettingStarted.industries.question'),
          answer: t('gettingStarted.industries.answer')
        }
      ]
    },
    {
      title: t('aiAgents.title'),
      items: [
        {
          question: t('aiAgents.whatAreAgents.question'),
          answer: t('aiAgents.whatAreAgents.answer')
        },
        {
          question: t('aiAgents.howWorkTogether.question'),
          answer: t('aiAgents.howWorkTogether.answer')
        },
        {
          question: t('aiAgents.doLearn.question'),
          answer: t('aiAgents.doLearn.answer')
        }
      ]
    },
    {
      title: t('assistant.title'),
      items: [
        {
          question: t('assistant.whatIsAssistant.question'),
          answer: t('assistant.whatIsAssistant.answer')
        },
        {
          question: t('assistant.howCanHelp.question'),
          answer: t('assistant.howCanHelp.answer')
        },
        {
          question: t('assistant.availableWhere.question'),
          answer: t('assistant.availableWhere.answer')
        }
      ]
    },
    {
      title: t('pricing.title'),
      items: [
        {
          question: t('pricing.howPriced.question'),
          answer: t('pricing.howPriced.answer')
        },
        {
          question: t('pricing.whatAffects.question'),
          answer: t('pricing.whatAffects.answer')
        },
        {
          question: t('pricing.whatsIncluded.question'),
          answer: t('pricing.whatsIncluded.answer')
        }
      ]
    },
    {
      title: t('technical.title'),
      items: [
        {
          question: t('technical.howIntegrate.question'),
          answer: t('technical.howIntegrate.answer')
        },
        {
          question: t('technical.isSecure.question'),
          answer: t('technical.isSecure.answer')
        },
        {
          question: t('technical.whatData.question'),
          answer: t('technical.whatData.answer')
        }
      ]
    },
    {
      title: t('support.title'),
      items: [
        {
          question: t('support.whatOptions.question'),
          answer: t('support.whatOptions.answer')
        },
        {
          question: t('support.provideTraining.question'),
          answer: t('support.provideTraining.answer')
        },
        {
          question: t('support.responseTime.question'),
          answer: t('support.responseTime.answer')
        }
      ]
    }
  ]

  return (
    <div className={landingStyles.landing}>
      <Background />
      <div className={landingStyles.contentWrapper}>
        <Navbar />
        <main className={styles.main}>
          <section className={styles.hero}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                {t('hero.title')} <span className={landingStyles.gradientText}>{t('hero.titleHighlight')}</span>
              </h1>
              <p className={styles.heroSubtitle}>
                {t('hero.subtitle')}
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
