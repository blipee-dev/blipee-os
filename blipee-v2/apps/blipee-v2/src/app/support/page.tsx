/* eslint-disable react/no-unescaped-entities */
'use client'

import { Navbar } from '../landing/components/Navbar'
import { Footer } from '../landing/components/Footer'
import { Background } from '../landing/components/Background'
import { FormMessage } from '@/components/FormMessage'
import { MessageSquare, Book, HelpCircle, Mail } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { useThemeToggle } from '../landing/hooks/useThemeToggle'
import { submitSupportTicket } from '@/app/actions/v2/support'
import Link from 'next/link'
import styles from '../contact/contact.module.css'
import landingStyles from '../landing/landing.module.css'

export default function SupportPage() {
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
                How Can We <span className={landingStyles.gradientText}>Help?</span>
              </h1>
              <p className={styles.heroSubtitle}>
                Get the support you need. Our team is here to ensure you get the most out of blipee's AI agents.
              </p>
            </div>

            <div className={styles.container}>
              <div className={styles.contactGrid}>
                <div className={styles.contactInfo}>
                  <h2>Support Resources</h2>
                  <p>
                    Need help? Browse our resources or submit a support ticket and our team will assist you.
                  </p>

                  <div className={styles.contactDetails}>
                    <Link href="/documentation" className={styles.contactItem}>
                      <div className={styles.contactIcon}>
                        <Book size={20} />
                      </div>
                      <div className={styles.contactItemText}>
                        <h3>Documentation</h3>
                        <p>Comprehensive guides and tutorials</p>
                      </div>
                    </Link>

                    <Link href="/faq" className={styles.contactItem}>
                      <div className={styles.contactIcon}>
                        <HelpCircle size={20} />
                      </div>
                      <div className={styles.contactItemText}>
                        <h3>FAQ</h3>
                        <p>Common questions answered</p>
                      </div>
                    </Link>

                    <div className={styles.contactItem}>
                      <div className={styles.contactIcon}>
                        <MessageSquare size={20} />
                      </div>
                      <div className={styles.contactItemText}>
                        <h3>Live Chat <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>(Coming Soon)</span></h3>
                        <p>Available Mon-Fri, 9am-6pm PST</p>
                      </div>
                    </div>

                    <a href="mailto:support@blipee.com" className={styles.contactItem}>
                      <div className={styles.contactIcon}>
                        <Mail size={20} />
                      </div>
                      <div className={styles.contactItemText}>
                        <h3>Email Support</h3>
                        <p>support@blipee.com</p>
                      </div>
                    </a>
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
                    <label htmlFor="priority">Priority</label>
                    <select id="priority" name="priority" required disabled={isSubmitting}>
                      <option value="">Select priority</option>
                      <option value="low">Low - General Question</option>
                      <option value="medium">Medium - Need Assistance</option>
                      <option value="high">High - Service Issue</option>
                      <option value="urgent">Urgent - System Down</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="category">Category</label>
                    <select id="category" name="category" required disabled={isSubmitting}>
                      <option value="">Select a category</option>
                      <option value="technical">Technical Issue</option>
                      <option value="billing">Billing & Payments</option>
                      <option value="agents">AI Agent Configuration</option>
                      <option value="data">Data & Analytics</option>
                      <option value="account">Account Management</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="message">Describe Your Issue</label>
                    <textarea 
                      id="message" 
                      name="message" 
                      required 
                      placeholder="Please provide as much detail as possible..."
                      rows={5}
                      disabled={isSubmitting}
                    />
                  </div>

                  <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Support Ticket'}
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

