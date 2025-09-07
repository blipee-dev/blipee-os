'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Shield, Eye, Database, Lock } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 p-0.5 rounded-xl" style={{background: 'linear-gradient(to bottom right, rgb(236, 72, 153), rgb(147, 51, 234))'}}>
                <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center">
                  <Home className="w-5 h-5 sm:w-6 sm:h-6" stroke="url(#homeGradient)" fill="none" strokeWidth="2" />
                </div>
              </div>
              <span className="ml-2 text-lg sm:text-xl font-normal bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                blipee
              </span>
            </Link>
            <Link href="/" className="flex items-center text-gray-300 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <svg width="0" height="0">
        <defs>
          <linearGradient id="homeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(236, 72, 153)" />
            <stop offset="100%" stopColor="rgb(147, 51, 234)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Content */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-white">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              Last updated: January 2025
            </p>

            {/* Key Principles */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6">
                <div className="flex items-center mb-3">
                  <Shield className="w-6 h-6 text-pink-500 mr-3" />
                  <h3 className="text-lg font-semibold text-white">Data Protection</h3>
                </div>
                <p className="text-gray-300 text-sm">We implement enterprise-grade security measures to protect your personal information.</p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6">
                <div className="flex items-center mb-3">
                  <Eye className="w-6 h-6 text-purple-500 mr-3" />
                  <h3 className="text-lg font-semibold text-white">Transparency</h3>
                </div>
                <p className="text-gray-300 text-sm">We're clear about what data we collect, why we collect it, and how we use it.</p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6">
                <div className="flex items-center mb-3">
                  <Database className="w-6 h-6 text-blue-500 mr-3" />
                  <h3 className="text-lg font-semibold text-white">Data Minimization</h3>
                </div>
                <p className="text-gray-300 text-sm">We only collect and process data that's necessary to provide our services.</p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6">
                <div className="flex items-center mb-3">
                  <Lock className="w-6 h-6 text-green-500 mr-3" />
                  <h3 className="text-lg font-semibold text-white">Your Rights</h3>
                </div>
                <p className="text-gray-300 text-sm">You have full control over your personal data with rights to access, modify, and delete.</p>
              </div>
            </div>

            <div className="prose prose-invert prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
                
                <h3 className="text-xl font-medium text-white mb-3">1.1 Information You Provide</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                  <li><strong>Account Information:</strong> Name, email address, company name, job title</li>
                  <li><strong>Profile Data:</strong> Professional information, preferences, and settings</li>
                  <li><strong>Content:</strong> Sustainability data, documents, reports you upload or create</li>
                  <li><strong>Communications:</strong> Messages you send to our support team or through our platform</li>
                </ul>

                <h3 className="text-xl font-medium text-white mb-3">1.2 Information We Collect Automatically</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                  <li><strong>Usage Data:</strong> How you interact with our services, features used, time spent</li>
                  <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
                  <li><strong>Log Data:</strong> IP addresses, access times, pages viewed, referral URLs</li>
                  <li><strong>Analytics Data:</strong> Performance metrics, error reports, usage patterns</li>
                </ul>

                <h3 className="text-xl font-medium text-white mb-3">1.3 Information from Third Parties</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Integration Data:</strong> Data from connected services and APIs you authorize</li>
                  <li><strong>Authentication Services:</strong> Information from SSO providers like Google, Microsoft</li>
                  <li><strong>External Data Sources:</strong> Environmental data from approved third-party providers</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We use your information to provide, maintain, and improve our services:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Service Provision:</strong> To provide and operate our sustainability intelligence platform</li>
                  <li><strong>AI Processing:</strong> To train and improve our AI models for better sustainability insights</li>
                  <li><strong>Personalization:</strong> To customize your experience and provide relevant recommendations</li>
                  <li><strong>Communication:</strong> To send service updates, security alerts, and support responses</li>
                  <li><strong>Security:</strong> To detect, prevent, and address technical issues and security threats</li>
                  <li><strong>Compliance:</strong> To meet legal obligations and respond to lawful requests</li>
                  <li><strong>Research:</strong> To conduct analysis and research to improve sustainability solutions</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">3. Legal Basis for Processing (GDPR)</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We process your personal data based on the following legal grounds:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Contract Performance:</strong> Processing necessary to perform our services</li>
                  <li><strong>Legitimate Interests:</strong> For analytics, security, and service improvement</li>
                  <li><strong>Consent:</strong> Where you have given explicit consent for specific purposes</li>
                  <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">4. Information Sharing and Disclosure</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We do not sell, trade, or rent your personal information. We may share information in these circumstances:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Service Providers:</strong> With trusted third parties who assist in operating our services</li>
                  <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                  <li><strong>Legal Requirements:</strong> To comply with legal obligations or protect rights and safety</li>
                  <li><strong>Aggregated Data:</strong> Anonymous, aggregated data for research and benchmarking</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">5. Data Retention</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We retain your information for as long as necessary to provide services and fulfill legal obligations:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Account Data:</strong> Retained while your account is active and for 3 years after deletion</li>
                  <li><strong>Usage Data:</strong> Retained for 2 years for analytics and service improvement</li>
                  <li><strong>Legal Data:</strong> Retained as required by applicable laws and regulations</li>
                  <li><strong>Backup Data:</strong> Automatically deleted within 90 days of account deletion</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights and Choices</h2>
                
                <h3 className="text-xl font-medium text-white mb-3">6.1 GDPR Rights (EU Users)</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                  <li><strong>Access:</strong> Request access to your personal data</li>
                  <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
                  <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                  <li><strong>Portability:</strong> Request your data in a portable format</li>
                  <li><strong>Restriction:</strong> Request limitation of processing</li>
                  <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
                </ul>

                <h3 className="text-xl font-medium text-white mb-3">6.2 CCPA Rights (California Users)</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Know:</strong> Right to know what personal information we collect and how it's used</li>
                  <li><strong>Delete:</strong> Right to request deletion of personal information</li>
                  <li><strong>Opt-Out:</strong> Right to opt-out of sale of personal information (we don't sell data)</li>
                  <li><strong>Non-Discrimination:</strong> Right to equal service regardless of privacy choices</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">7. Security Measures</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We implement comprehensive security measures to protect your information:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Encryption:</strong> Data encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
                  <li><strong>Access Controls:</strong> Multi-factor authentication and role-based access</li>
                  <li><strong>Infrastructure:</strong> SOC 2 Type II compliant cloud infrastructure</li>
                  <li><strong>Monitoring:</strong> 24/7 security monitoring and incident response</li>
                  <li><strong>Regular Audits:</strong> Independent security assessments and penetration testing</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">8. International Data Transfers</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We may transfer your data to countries outside your jurisdiction. For EU users, we ensure adequate protection through:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Standard Contractual Clauses approved by the European Commission</li>
                  <li>Adequacy decisions for countries with approved data protection levels</li>
                  <li>Additional safeguards as required by applicable laws</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">9. Cookies and Tracking</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We use cookies and similar technologies to improve your experience. See our Cookie Policy for details on:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Types of cookies we use and their purposes</li>
                  <li>How to manage cookie preferences</li>
                  <li>Third-party analytics and advertising cookies</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">10. Children's Privacy</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Our services are not intended for children under 16. We do not knowingly collect personal information from children under 16. 
                  If you become aware that a child has provided us with personal information, please contact us immediately.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">11. Changes to This Policy</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We may update this Privacy Policy periodically. We will notify you of material changes by:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Email notification to registered users</li>
                  <li>Prominent notice on our website</li>
                  <li>In-app notifications for significant changes</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">12. Contact Us</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  For questions about this Privacy Policy or to exercise your rights, contact us:
                </p>
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6 mt-4">
                  <p className="text-gray-300">
                    <strong>Email:</strong> privacy@blipee.com<br/>
                    <strong>Data Protection Officer:</strong> dpo@blipee.com<br/>
                    <strong>Website:</strong> blipee.com<br/>
                    <strong>Response Time:</strong> We respond to privacy requests within 30 days
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">13. Supervisory Authority</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  EU users have the right to lodge a complaint with their local data protection authority if they believe 
                  we have not addressed their privacy concerns adequately.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}