/* eslint-disable react/no-unescaped-entities */
import Link from 'next/link'
import styles from './privacy.module.css'

export const metadata = {
  title: 'Privacy Policy | Blipee',
  description: 'Privacy Policy for Blipee AI-Powered Sustainability Platform',
}

export default function PrivacyPage() {
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
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.lastUpdated}>Last updated: November 1, 2025</p>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2>1. Introduction</h2>
          <p>
            Welcome to Blipee ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered sustainability platform.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. Information We Collect</h2>
          <h3>2.1 Information You Provide</h3>
          <p>We collect information that you provide directly to us, including:</p>
          <ul>
            <li>Account information (name, email address, password)</li>
            <li>Company information (company name, industry, size)</li>
            <li>Sustainability data you input into the platform</li>
            <li>Communications with our support team</li>
            <li>Payment and billing information</li>
          </ul>

          <h3>2.2 Automatically Collected Information</h3>
          <p>When you use our platform, we automatically collect:</p>
          <ul>
            <li>Device and browser information</li>
            <li>IP address and location data</li>
            <li>Usage data and analytics</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Process your transactions and manage your account</li>
            <li>Train and improve our AI models and predictions</li>
            <li>Send you technical notices, updates, and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Monitor and analyze trends, usage, and activities</li>
            <li>Detect, prevent, and address technical issues and fraud</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>4. Data Sharing and Disclosure</h2>
          <p>We may share your information in the following circumstances:</p>
          <ul>
            <li><strong>Service Providers:</strong> With third-party vendors who perform services on our behalf</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            <li><strong>With Your Consent:</strong> When you explicitly authorize us to share information</li>
          </ul>
          <p className={styles.highlight}>
            We never sell your personal information to third parties.
          </p>
        </section>

        <section className={styles.section}>
          <h2>5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information, including:
          </p>
          <ul>
            <li>End-to-end encryption for data in transit</li>
            <li>Encrypted data storage</li>
            <li>Regular security audits and penetration testing</li>
            <li>Access controls and authentication measures</li>
            <li>Employee training on data protection</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>6. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need your information, we will securely delete or anonymize it.
          </p>
        </section>

        <section className={styles.section}>
          <h2>7. Your Rights and Choices</h2>
          <p>Depending on your location, you may have the following rights:</p>
          <ul>
            <li><strong>Access:</strong> Request access to your personal information</li>
            <li><strong>Correction:</strong> Request correction of inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your personal information</li>
            <li><strong>Data Portability:</strong> Request a copy of your data in a portable format</li>
            <li><strong>Opt-Out:</strong> Opt out of marketing communications</li>
            <li><strong>Withdraw Consent:</strong> Withdraw consent where we rely on it</li>
          </ul>
          <p>To exercise these rights, please contact us at privacy@blipee.com</p>
        </section>

        <section className={styles.section}>
          <h2>8. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to collect and track information about your use of our platform. You can control cookies through your browser settings and other tools.
          </p>
        </section>

        <section className={styles.section}>
          <h2>9. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
          </p>
        </section>

        <section className={styles.section}>
          <h2>10. Children's Privacy</h2>
          <p>
            Our platform is not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16.
          </p>
        </section>

        <section className={styles.section}>
          <h2>11. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className={styles.section}>
          <h2>12. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <ul>
            <li>Email: privacy@blipee.com</li>
            <li>Address: [Your Company Address]</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
