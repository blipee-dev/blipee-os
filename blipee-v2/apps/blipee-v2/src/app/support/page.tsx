'use client'

import { Navbar } from '../landing/components/Navbar'
import { Footer } from '../landing/components/Footer'
import { Background } from '../landing/components/Background'
import { FormMessage } from '@/components/FormMessage'
import { MessageSquare, Book, HelpCircle, Mail } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { useThemeToggle } from '../landing/hooks/useThemeToggle'
import { useTranslations } from 'next-intl'
import { submitSupportTicket } from '@/app/actions/v2/support'
import Link from 'next/link'
import styles from '../contact/contact.module.css'
import landingStyles from '../landing/landing.module.css'

export default function SupportPage() {
  const { mode: themeMode, setTheme } = useThemeToggle()
  const t = useTranslations('marketing.support')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      const result = await submitSupportTicket(formData)

      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        form.reset()
      } else {
        setMessage({ type: 'error', text: result.error || 'Unable to submit ticket. Please try again.' })
      }
    } catch (error) {
      console.error('Support form error:', error)
      setMessage({ type: 'error', text: 'Something went wrong. Please try again later.' })
    } finally {
      setIsSubmitting(false)
    }
  }

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

            <div className={styles.container}>
              <div className={styles.contactGrid}>
                <div className={styles.contactInfo}>
                  <h2>{t('resources.title')}</h2>
                  <p>
                    {t('resources.description')}
                  </p>

                  <div className={styles.contactDetails}>
                    <Link href="/documentation" className={styles.contactItem}>
                      <div className={styles.contactIcon}>
                        <Book size={20} />
                      </div>
                      <div className={styles.contactItemText}>
                        <h3>{t('resources.documentation.title')}</h3>
                        <p>{t('resources.documentation.description')}</p>
                      </div>
                    </Link>

                    <Link href="/faq" className={styles.contactItem}>
                      <div className={styles.contactIcon}>
                        <HelpCircle size={20} />
                      </div>
                      <div className={styles.contactItemText}>
                        <h3>{t('resources.faq.title')}</h3>
                        <p>{t('resources.faq.description')}</p>
                      </div>
                    </Link>

                    <div className={styles.contactItem}>
                      <div className={styles.contactIcon}>
                        <MessageSquare size={20} />
                      </div>
                      <div className={styles.contactItemText}>
                        <h3>{t('resources.liveChat.title')} <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{t('resources.liveChat.comingSoon')}</span></h3>
                        <p>{t('resources.liveChat.description')}</p>
                      </div>
                    </div>

                    <a href="mailto:support@blipee.com" className={styles.contactItem}>
                      <div className={styles.contactIcon}>
                        <Mail size={20} />
                      </div>
                      <div className={styles.contactItemText}>
                        <h3>{t('resources.email.title')}</h3>
                        <p>{t('resources.email.description')}</p>
                      </div>
                    </a>
                  </div>
                </div>

                <form className={styles.contactForm} onSubmit={handleSubmit}>
                  {message && (
                    <FormMessage type={message.type} message={message.text} />
                  )}

                  <div className={styles.formGroup}>
                    <label htmlFor="name">{t('form.labelName')}</label>
                    <input type="text" id="name" name="name" required placeholder={t('form.placeholderName')} disabled={isSubmitting} />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="email">{t('form.labelEmail')}</label>
                    <input type="email" id="email" name="email" required placeholder={t('form.placeholderEmail')} disabled={isSubmitting} />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="priority">{t('form.labelPriority')}</label>
                    <select id="priority" name="priority" required disabled={isSubmitting}>
                      <option value="">{t('form.placeholderPriority')}</option>
                      <option value="low">{t('form.priorityLow')}</option>
                      <option value="medium">{t('form.priorityMedium')}</option>
                      <option value="high">{t('form.priorityHigh')}</option>
                      <option value="urgent">{t('form.priorityUrgent')}</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="category">{t('form.labelCategory')}</label>
                    <select id="category" name="category" required disabled={isSubmitting}>
                      <option value="">{t('form.placeholderCategory')}</option>
                      <option value="technical">{t('form.categoryTechnical')}</option>
                      <option value="billing">{t('form.categoryBilling')}</option>
                      <option value="agents">{t('form.categoryAgents')}</option>
                      <option value="data">{t('form.categoryData')}</option>
                      <option value="account">{t('form.categoryAccount')}</option>
                      <option value="other">{t('form.categoryOther')}</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="message">{t('form.labelMessage')}</label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      placeholder={t('form.placeholderMessage')}
                      rows={5}
                      disabled={isSubmitting}
                    />
                  </div>

                  <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                    {isSubmitting ? t('form.buttonSubmitting') : t('form.buttonSubmit')}
                  </button>
                </form>
              </div>
            </div>
          </section>
        </main>
      <Footer themeMode={themeMode} onThemeChange={setTheme} />
    </div>
  </div>
  )
}

