'use client'

import { Navbar } from '../landing/components/Navbar'
import { Footer } from '../landing/components/Footer'
import { Background } from '../landing/components/Background'
import { FormMessage } from '@/components/FormMessage'
import { Mail, Phone, MapPin, Calendar } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { useThemeToggle } from '../landing/hooks/useThemeToggle'
import { submitContactForm } from '@/app/actions/v2/contact'
import styles from './contact.module.css'
import landingStyles from '../landing/landing.module.css'

export default function ContactPage() {
  const { mode: themeMode, setTheme } = useThemeToggle()
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
                Get in <span className={landingStyles.gradientText}>Touch</span>
              </h1>
              <p className={styles.heroSubtitle}>
                Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>
            </div>

            <div className={styles.container}>
              <div className={styles.contactGrid}>
                <div className={styles.contactInfo}>
                  <h2>Let's Talk</h2>
                  <p>
                    Whether you're interested in our AI workforce, have questions about sustainability, 
                    or want to explore a partnership, we're here to help.
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
                        <h3>Schedule a Meeting</h3>
                        <p>Book a time that works for you</p>
                      </div>
                    </a>

                    <div className={styles.contactItem}>
                      <div className={styles.contactIcon}>
                        <Mail size={20} />
                      </div>
                      <div className={styles.contactItemText}>
                        <h3>Email</h3>
                        <p>info@blipee.com</p>
                      </div>
                    </div>

                    <div className={styles.contactItem}>
                      <div className={styles.contactIcon}>
                        <Phone size={20} />
                      </div>
                      <div className={styles.contactItemText}>
                        <h3>Phone</h3>
                        <p>+351 934 866 155</p>
                      </div>
                    </div>

                    <div className={styles.contactItem}>
                      <div className={styles.contactIcon}>
                        <MapPin size={20} />
                      </div>
                      <div className={styles.contactItemText}>
                        <h3>Office</h3>
                        <p>Lisboa, PT</p>
                      </div>
                    </div>
                  </div>
                </div>

                <form className={styles.contactForm} onSubmit={handleSubmit}>
                  {message && (
                    <FormMessage type={message.type} message={message.text} />
                  )}

                  <div className={styles.formGroup}>
                    <label htmlFor="name">Full Name</label>
                    <input type="text" id="name" name="name" required placeholder="John Doe" disabled={isSubmitting} />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" required placeholder="john@company.com" disabled={isSubmitting} />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="company">Company</label>
                    <input type="text" id="company" name="company" placeholder="Your Company" disabled={isSubmitting} />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="subject">Subject</label>
                    <select id="subject" name="subject" required disabled={isSubmitting}>
                      <option value="">Select a subject</option>
                      <option value="demo">Request a Demo</option>
                      <option value="pricing">Pricing Question</option>
                      <option value="partnership">Partnership Opportunity</option>
                      <option value="support">Technical Support</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="message">Message</label>
                    <textarea 
                      id="message" 
                      name="message" 
                      required 
                      placeholder="Tell us about your needs..."
                      rows={5}
                      disabled={isSubmitting}
                    />
                  </div>
                  <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Message'}
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
