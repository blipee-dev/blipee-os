/* eslint-disable react/no-unescaped-entities */
import Link from 'next/link'
import styles from './terms.module.css'

export const metadata = {
  title: 'Terms of Service | Blipee',
  description: 'Terms of Service for Blipee AI-Powered Sustainability Platform',
}

export default function TermsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backLink} aria-label="Return to home page">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          <span>Back to Home</span>
        </Link>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.lastUpdated}>Last updated: November 1, 2025</p>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using Blipee ("Service," "Platform," "we," "us," or "our"), you accept and agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. Description of Service</h2>
          <p>
            Blipee is an AI-powered sustainability platform that provides:
          </p>
          <ul>
            <li>AI-driven sustainability analytics and predictions</li>
            <li>8 autonomous agents for carbon, energy, ESG tracking, and more</li>
            <li>Machine learning-powered forecasting with 98.5% accuracy</li>
            <li>Real-time sustainability reporting and insights</li>
            <li>BlipeeAssistant AI chat interface</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>3. Account Registration</h2>
          <h3>3.1 Account Creation</h3>
          <p>
            To use our Service, you must create an account. You agree to:
          </p>
          <ul>
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Notify us immediately of any unauthorized access</li>
            <li>Be responsible for all activities under your account</li>
          </ul>

          <h3>3.2 Account Eligibility</h3>
          <p>
            You must be at least 18 years old and have the legal capacity to enter into contracts to use our Service.
          </p>
        </section>

        <section className={styles.section}>
          <h2>4. User Responsibilities</h2>
          <p>You agree to:</p>
          <ul>
            <li>Use the Service only for lawful purposes</li>
            <li>Not interfere with or disrupt the Service</li>
            <li>Not attempt to gain unauthorized access to any part of the Service</li>
            <li>Provide accurate sustainability data and information</li>
            <li>Not use the Service to transmit malicious code or harmful content</li>
            <li>Comply with all applicable laws and regulations</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>5. Intellectual Property Rights</h2>
          <h3>5.1 Our Rights</h3>
          <p>
            All rights, title, and interest in the Service, including all software, AI models, algorithms, designs, and content, are owned by Blipee or our licensors.
          </p>

          <h3>5.2 Your Data</h3>
          <p>
            You retain all rights to the data you input into the Platform. By using our Service, you grant us a license to use your data to:
          </p>
          <ul>
            <li>Provide and improve the Service</li>
            <li>Train and enhance our AI models (in anonymized form)</li>
            <li>Generate analytics and insights</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>6. Payment and Billing</h2>
          <h3>6.1 Fees</h3>
          <p>
            Access to certain features requires payment of fees. All fees are non-refundable except as required by law or as explicitly stated in our refund policy.
          </p>

          <h3>6.2 Subscription</h3>
          <p>
            Subscriptions automatically renew unless canceled before the renewal date. You can cancel your subscription at any time through your account settings.
          </p>

          <h3>6.3 Price Changes</h3>
          <p>
            We reserve the right to change our pricing with 30 days' notice. Price changes will not affect your current billing cycle.
          </p>
        </section>

        <section className={styles.section}>
          <h2>7. AI Predictions and Accuracy</h2>
          <p className={styles.highlight}>
            While our ML-powered predictions achieve 98.5% accuracy, all predictions and recommendations are provided "as is" without warranties. You should not rely solely on AI predictions for critical business decisions.
          </p>
        </section>

        <section className={styles.section}>
          <h2>8. Data Privacy and Security</h2>
          <p>
            Your privacy is important to us. Our collection and use of personal information is governed by our <Link href="/privacy" className={styles.inlineLink}>Privacy Policy</Link>, which is incorporated into these Terms by reference.
          </p>
        </section>

        <section className={styles.section}>
          <h2>9. Service Availability</h2>
          <p>
            We strive to maintain 99.9% uptime, but we do not guarantee that the Service will be uninterrupted or error-free. We may temporarily suspend access for maintenance or updates.
          </p>
        </section>

        <section className={styles.section}>
          <h2>10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Blipee shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.
          </p>
        </section>

        <section className={styles.section}>
          <h2>11. Warranties Disclaimer</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
          </p>
        </section>

        <section className={styles.section}>
          <h2>12. Termination</h2>
          <h3>12.1 By You</h3>
          <p>
            You may terminate your account at any time by contacting support or through your account settings.
          </p>

          <h3>12.2 By Us</h3>
          <p>
            We may suspend or terminate your access if you violate these Terms or for any other reason at our discretion, with or without notice.
          </p>
        </section>

        <section className={styles.section}>
          <h2>13. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify you of material changes via email or through the Service. Your continued use after changes constitutes acceptance of the modified Terms.
          </p>
        </section>

        <section className={styles.section}>
          <h2>14. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
          </p>
        </section>

        <section className={styles.section}>
          <h2>15. Dispute Resolution</h2>
          <p>
            Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration in accordance with [Arbitration Rules], except where prohibited by law.
          </p>
        </section>

        <section className={styles.section}>
          <h2>16. Contact Information</h2>
          <p>
            For questions about these Terms, please contact us:
          </p>
          <ul>
            <li>Email: legal@blipee.com</li>
            <li>Support: <Link href="/contact" className={styles.inlineLink}>Contact Form</Link></li>
            <li>Address: [Your Company Address]</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
