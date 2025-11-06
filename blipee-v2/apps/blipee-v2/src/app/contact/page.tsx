'use client'

import { Navbar } from '../landing/components/Navbar'
import { Footer } from '../landing/components/Footer'
import { Background } from '../landing/components/Background'
import { FormMessage } from '@/components/FormMessage'
import { Mail, Phone, MapPin, Calendar } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { useThemeToggle } from '../landing/hooks/useThemeToggle'
import { useTranslations } from 'next-intl'
import { submitContactForm } from '@/app/actions/v2/contact'
import styles from './contact.module.css'
import landingStyles from '../landing/landing.module.css'

export default function ContactPage() {
  const { mode: themeMode, setTheme } = useThemeToggle()
  const t = useTranslations('marketing.contact')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      const result = await submitContactForm(formData)

      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        form.reset()
      } else {
        setMessage({ type: 'error', text: result.error || 'Unable to send message. Please try again.' })
      }
    } catch (error) {
      console.error('Contact form error:', error)
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
                  <h2>{t('info.title')}</h2>
                  <p>
                    {t('info.description')}
                  </p>

                  <div className={styles.contactDetails}>
                    <a
                      href="https://calendar.app.google/rzB6Ddh7T1qcctmE8"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.contactItem}
                    >
                      <div className={styles.contactIcon}>
                        <Calendar size={20} />
                      </div>
                      <div className={styles.contactItemText}>
                        <h3>{t('contactItems.meeting.title')}</h3>
                        <p>{t('contactItems.meeting.description')}</p>
                      </div>
                    </a>

                    <div className={styles.contactItem}>
                      <div className={styles.contactIcon}>
                        <Mail size={20} />
                      </div>
                      <div className={styles.contactItemText}>
                        <h3>{t('contactItems.email.title')}</h3>
                        <p>{t('contactItems.email.description')}</p>
                      </div>
                    </div>

                    <div className={styles.contactItem}>
                      <div className={styles.contactIcon}>
                        <Phone size={20} />
                      </div>
                      <div className={styles.contactItemText}>
                        <h3>{t('contactItems.phone.title')}</h3>
                        <p>{t('contactItems.phone.description')}</p>
                      </div>
                    </div>

                    <div className={styles.contactItem}>
                      <div className={styles.contactIcon}>
                        <MapPin size={20} />
                      </div>
                      <div className={styles.contactItemText}>
                        <h3>{t('contactItems.office.title')}</h3>
                        <p>{t('contactItems.office.description')}</p>
                      </div>
                    </div>
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
                    <label htmlFor="company">{t('form.labelCompany')}</label>
                    <input type="text" id="company" name="company" placeholder={t('form.placeholderCompany')} disabled={isSubmitting} />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="subject">{t('form.labelSubject')}</label>
                    <select id="subject" name="subject" required disabled={isSubmitting}>
                      <option value="">{t('form.placeholderSubject')}</option>
                      <option value="demo">{t('form.subjectDemo')}</option>
                      <option value="pricing">{t('form.subjectPricing')}</option>
                      <option value="partnership">{t('form.subjectPartnership')}</option>
                      <option value="support">{t('form.subjectSupport')}</option>
                      <option value="other">{t('form.subjectOther')}</option>
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
                    {isSubmitting ? t('form.buttonSending') : t('form.buttonSend')}
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
