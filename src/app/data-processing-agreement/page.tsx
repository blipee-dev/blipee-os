'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, FileCheck, Shield, Database, Users } from 'lucide-react';

export default function DataProcessingAgreementPage() {
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
              Data Processing Agreement
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              Last updated: January 2025
            </p>

            {/* Key Commitments */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6">
                <div className="flex items-center mb-3">
                  <FileCheck className="w-6 h-6 text-green-500 mr-3" />
                  <h3 className="text-lg font-semibold text-white">GDPR Compliance</h3>
                </div>
                <p className="text-gray-300 text-sm">Full compliance with EU General Data Protection Regulation requirements.</p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6">
                <div className="flex items-center mb-3">
                  <Shield className="w-6 h-6 text-blue-500 mr-3" />
                  <h3 className="text-lg font-semibold text-white">Data Security</h3>
                </div>
                <p className="text-gray-300 text-sm">Enterprise-grade security measures and regular audits.</p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6">
                <div className="flex items-center mb-3">
                  <Database className="w-6 h-6 text-purple-500 mr-3" />
                  <h3 className="text-lg font-semibold text-white">Data Minimization</h3>
                </div>
                <p className="text-gray-300 text-sm">Only processing data necessary for specified purposes.</p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6">
                <div className="flex items-center mb-3">
                  <Users className="w-6 h-6 text-pink-500 mr-3" />
                  <h3 className="text-lg font-semibold text-white">Data Subject Rights</h3>
                </div>
                <p className="text-gray-300 text-sm">Full support for individual rights and data portability.</p>
              </div>
            </div>

            <div className="prose prose-invert prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">1. Parties and Definitions</h2>
                
                <h3 className="text-xl font-medium text-white mb-3">1.1 Parties</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                  <li><strong>Data Controller:</strong> The customer organization using <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-medium">blipee</span> services</li>
                  <li><strong>Data Processor:</strong> <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-medium">blipee</span> and its authorized sub-processors</li>
                  <li><strong>Data Subjects:</strong> Individuals whose personal data is processed through our services</li>
                </ul>

                <h3 className="text-xl font-medium text-white mb-3">1.2 Key Definitions</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Personal Data:</strong> Any information relating to an identified or identifiable natural person</li>
                  <li><strong>Processing:</strong> Any operation performed on personal data, including collection, storage, and use</li>
                  <li><strong>Sub-processor:</strong> Any third party engaged by <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-medium">blipee</span> to process personal data</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">2. Nature and Purpose of Processing</h2>
                
                <h3 className="text-xl font-medium text-white mb-3">2.1 Subject Matter</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Processing of personal data necessary to provide sustainability intelligence services, including:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                  <li>User account management and authentication</li>
                  <li>Service provision and platform functionality</li>
                  <li>Customer support and communications</li>
                  <li>Analytics and service improvement</li>
                </ul>

                <h3 className="text-xl font-medium text-white mb-3">2.2 Duration</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Processing will continue for the duration of the service agreement and any applicable retention periods as specified in our Privacy Policy.
                </p>

                <h3 className="text-xl font-medium text-white mb-3">2.3 Categories of Data</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Identity Data:</strong> Name, email address, job title</li>
                  <li><strong>Contact Data:</strong> Business contact information</li>
                  <li><strong>Usage Data:</strong> Service interaction and analytics data</li>
                  <li><strong>Technical Data:</strong> Device and browser information</li>
                  <li><strong>Content Data:</strong> User-generated content and uploads</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">3. Controller and Processor Obligations</h2>
                
                <h3 className="text-xl font-medium text-white mb-3">3.1 Data Controller Obligations</h3>
                <p className="text-gray-300 leading-relaxed mb-4">The Data Controller shall:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                  <li>Ensure lawful basis for all processing activities</li>
                  <li>Provide clear processing instructions to <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-medium">blipee</span></li>
                  <li>Respond to data subject requests within required timeframes</li>
                  <li>Notify <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-medium">blipee</span> of any data correction or deletion requirements</li>
                  <li>Conduct Data Protection Impact Assessments when required</li>
                </ul>

                <h3 className="text-xl font-medium text-white mb-3">3.2 Data Processor Obligations</h3>
                <p className="text-gray-300 leading-relaxed mb-4"><span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-medium">blipee</span> shall:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Process personal data only on documented instructions</li>
                  <li>Ensure confidentiality of processing personnel</li>
                  <li>Implement appropriate technical and organizational measures</li>
                  <li>Assist with data subject rights requests</li>
                  <li>Assist with security breach notifications</li>
                  <li>Delete or return personal data upon termination</li>
                  <li>Make available information necessary to demonstrate compliance</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">4. Security Measures</h2>
                
                <h3 className="text-xl font-medium text-white mb-3">4.1 Technical Measures</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                  <li><strong>Encryption:</strong> AES-256 encryption at rest, TLS 1.3 in transit</li>
                  <li><strong>Access Controls:</strong> Multi-factor authentication and role-based access</li>
                  <li><strong>Network Security:</strong> Firewalls, intrusion detection, and monitoring</li>
                  <li><strong>Data Backup:</strong> Regular encrypted backups with geographic distribution</li>
                </ul>

                <h3 className="text-xl font-medium text-white mb-3">4.2 Organizational Measures</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Staff Training:</strong> Regular data protection and security training</li>
                  <li><strong>Access Management:</strong> Principle of least privilege access</li>
                  <li><strong>Incident Response:</strong> 24/7 security monitoring and response procedures</li>
                  <li><strong>Regular Audits:</strong> Annual security assessments and penetration testing</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">5. Sub-processors</h2>
                
                <h3 className="text-xl font-medium text-white mb-3">5.1 Authorized Sub-processors</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-medium">blipee</span> may engage the following categories of sub-processors:
                </p>
                
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6 mb-4">
                  <table className="w-full text-gray-300">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 text-white">Sub-processor</th>
                        <th className="text-left py-2 text-white">Purpose</th>
                        <th className="text-left py-2 text-white">Location</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-2">
                      <tr className="border-b border-white/5">
                        <td className="py-2">Supabase</td>
                        <td className="py-2">Database and backend services</td>
                        <td className="py-2">United States</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2">Vercel</td>
                        <td className="py-2">Hosting and CDN services</td>
                        <td className="py-2">United States</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2">OpenAI</td>
                        <td className="py-2">AI processing services</td>
                        <td className="py-2">United States</td>
                      </tr>
                      <tr>
                        <td className="py-2">Stripe</td>
                        <td className="py-2">Payment processing</td>
                        <td className="py-2">United States</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="text-xl font-medium text-white mb-3">5.2 Sub-processor Changes</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We will provide 30 days' notice of any changes to sub-processors. If you object to a new sub-processor, 
                  you may terminate the service without penalty during the notice period.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">6. International Data Transfers</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  When personal data is transferred outside the European Economic Area, we ensure adequate protection through:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Standard Contractual Clauses:</strong> EU-approved clauses with all sub-processors</li>
                  <li><strong>Adequacy Decisions:</strong> Transfers to countries with approved protection levels</li>
                  <li><strong>Additional Safeguards:</strong> Supplementary measures as required by law</li>
                  <li><strong>Data Localization:</strong> Option to restrict processing to specific regions</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibent text-white mb-4">7. Data Subject Rights</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-medium">blipee</span> will assist the Data Controller in responding to data subject requests:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Access Requests:</strong> Providing copies of personal data</li>
                  <li><strong>Rectification:</strong> Correcting inaccurate or incomplete data</li>
                  <li><strong>Erasure:</strong> Deleting personal data when legally required</li>
                  <li><strong>Portability:</strong> Providing data in machine-readable format</li>
                  <li><strong>Restriction:</strong> Limiting processing under specific circumstances</li>
                  <li><strong>Objection:</strong> Stopping processing for direct marketing or legitimate interests</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">8. Data Breach Notification</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  In the event of a personal data breach, <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-medium">blipee</span> will:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Immediate Response:</strong> Contain and assess the breach within 1 hour</li>
                  <li><strong>Controller Notification:</strong> Notify the Data Controller within 24 hours</li>
                  <li><strong>Documentation:</strong> Provide detailed incident reports</li>
                  <li><strong>Remediation:</strong> Take necessary steps to address the breach</li>
                  <li><strong>Prevention:</strong> Implement measures to prevent similar incidents</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">9. Data Retention and Deletion</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Personal data will be retained according to the following schedule:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                  <li><strong>Active Accounts:</strong> Data retained while account is active</li>
                  <li><strong>Deleted Accounts:</strong> Data deleted within 30 days of account deletion</li>
                  <li><strong>Backup Systems:</strong> Data purged from backups within 90 days</li>
                  <li><strong>Legal Holds:</strong> Data retained as required by applicable laws</li>
                </ul>

                <p className="text-gray-300 leading-relaxed">
                  Upon termination of the service agreement, all personal data will be deleted or returned 
                  within 30 days unless legally required to be retained longer.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">10. Audits and Compliance</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-medium">blipee</span> maintains compliance through:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>SOC 2 Type II:</strong> Annual audits of security controls</li>
                  <li><strong>ISO 27001:</strong> Information security management certification</li>
                  <li><strong>GDPR Assessments:</strong> Regular compliance reviews and updates</li>
                  <li><strong>Penetration Testing:</strong> Quarterly security assessments</li>
                  <li><strong>Third-party Audits:</strong> Available upon reasonable request</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">11. Liability and Indemnification</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Each party shall be liable for damages caused by its breach of this DPA. 
                  <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-medium"> blipee</span> will indemnify the Data Controller against:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Claims arising from <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-medium">blipee</span>'s breach of GDPR obligations</li>
                  <li>Regulatory fines resulting from <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-medium">blipee</span>'s non-compliance</li>
                  <li>Data breaches caused by <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-medium">blipee</span>'s security failures</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">12. Contact Information</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  For questions about this Data Processing Agreement:
                </p>
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6 mt-4">
                  <p className="text-gray-300">
                    <strong>Data Protection Officer:</strong> dpo@blipee.com<br/>
                    <strong>Legal Team:</strong> legal@blipee.com<br/>
                    <strong>Security Team:</strong> security@blipee.com<br/>
                    <strong>Emergency Contact:</strong> Available 24/7 for security incidents
                  </p>
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}