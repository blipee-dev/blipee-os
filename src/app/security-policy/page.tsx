'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Shield, Lock, Eye, AlertTriangle, CheckCircle, Server } from 'lucide-react';

export default function SecurityPolicyPage() {
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
              Security Policy
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              Last updated: January 2025
            </p>

            {/* Security Overview */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6">
                <div className="flex items-center mb-3">
                  <Shield className="w-6 h-6 text-green-500 mr-3" />
                  <h3 className="text-lg font-semibold text-white">Enterprise Security</h3>
                </div>
                <p className="text-gray-300 text-sm">SOC 2 Type II compliant with enterprise-grade security controls.</p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6">
                <div className="flex items-center mb-3">
                  <Lock className="w-6 h-6 text-blue-500 mr-3" />
                  <h3 className="text-lg font-semibold text-white">Data Encryption</h3>
                </div>
                <p className="text-gray-300 text-sm">AES-256 encryption at rest and TLS 1.3 for data in transit.</p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6">
                <div className="flex items-center mb-3">
                  <Eye className="w-6 h-6 text-purple-500 mr-3" />
                  <h3 className="text-lg font-semibold text-white">24/7 Monitoring</h3>
                </div>
                <p className="text-gray-300 text-sm">Continuous security monitoring and incident response.</p>
              </div>
            </div>

            {/* Security Commitment */}
            <div className="bg-gradient-to-r from-pink-500/10 to-purple-600/10 border border-pink-500/20 rounded-2xl p-8 mb-12">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-400 mr-4" />
                <h2 className="text-2xl font-semibold text-white">Our Security Commitment</h2>
              </div>
              <p className="text-gray-300 leading-relaxed">
                At <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-medium">blipee</span>, 
                security is not an afterthought—it's built into every aspect of our platform. We implement defense-in-depth 
                strategies, maintain compliance with industry standards, and continuously evolve our security posture to protect 
                your data and privacy.
              </p>
            </div>

            <div className="prose prose-invert prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">1. Infrastructure Security</h2>
                
                <h3 className="text-xl font-medium text-white mb-3">1.1 Cloud Infrastructure</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                  <li><strong>Cloud Providers:</strong> AWS and Vercel with SOC 2, ISO 27001, and FedRAMP compliance</li>
                  <li><strong>Network Security:</strong> VPC isolation, security groups, and network ACLs</li>
                  <li><strong>Load Balancing:</strong> Distributed traffic with DDoS protection</li>
                  <li><strong>Geographic Distribution:</strong> Multi-region deployment for resilience</li>
                </ul>

                <h3 className="text-xl font-medium text-white mb-3">1.2 Server Security</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                  <li><strong>Hardened Systems:</strong> Minimal attack surface with only required services</li>
                  <li><strong>Patch Management:</strong> Automated security updates and vulnerability scanning</li>
                  <li><strong>Access Controls:</strong> SSH key authentication and bastion hosts</li>
                  <li><strong>Monitoring:</strong> Real-time system monitoring and alerting</li>
                </ul>

                <h3 className="text-xl font-medium text-white mb-3">1.3 Container Security</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Image Scanning:</strong> Automated vulnerability scanning of container images</li>
                  <li><strong>Runtime Security:</strong> Container runtime monitoring and protection</li>
                  <li><strong>Orchestration:</strong> Kubernetes security policies and network policies</li>
                  <li><strong>Secrets Management:</strong> Secure handling of API keys and credentials</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">2. Data Protection</h2>
                
                <h3 className="text-xl font-medium text-white mb-3">2.1 Encryption Standards</h3>
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6 mb-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-white mb-2">Data at Rest</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• AES-256 encryption</li>
                        <li>• Hardware Security Modules (HSM)</li>
                        <li>• Key rotation every 90 days</li>
                        <li>• Database-level encryption</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-2">Data in Transit</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• TLS 1.3 for all communications</li>
                        <li>• Certificate pinning</li>
                        <li>• Perfect Forward Secrecy</li>
                        <li>• HSTS enforcement</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-medium text-white mb-3">2.2 Data Classification</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                  <li><strong>Public:</strong> Marketing materials and public documentation</li>
                  <li><strong>Internal:</strong> Business data not intended for external sharing</li>
                  <li><strong>Confidential:</strong> Customer data and proprietary algorithms</li>
                  <li><strong>Restricted:</strong> Personal data requiring special protection</li>
                </ul>

                <h3 className="text-xl font-medium text-white mb-3">2.3 Data Backup and Recovery</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Automated Backups:</strong> Continuous replication with point-in-time recovery</li>
                  <li><strong>Geographic Distribution:</strong> Backups stored in multiple regions</li>
                  <li><strong>Encryption:</strong> All backups encrypted with separate keys</li>
                  <li><strong>Testing:</strong> Regular disaster recovery testing and validation</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">3. Access Control and Authentication</h2>
                
                <h3 className="text-xl font-medium text-white mb-3">3.1 User Authentication</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                  <li><strong>Multi-Factor Authentication:</strong> Required for all user accounts</li>
                  <li><strong>Single Sign-On (SSO):</strong> Integration with enterprise identity providers</li>
                  <li><strong>Password Policies:</strong> Strong password requirements and regular rotation</li>
                  <li><strong>Session Management:</strong> Secure session tokens with automatic expiration</li>
                </ul>

                <h3 className="text-xl font-medium text-white mb-3">3.2 Internal Access Controls</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                  <li><strong>Principle of Least Privilege:</strong> Minimal access rights for all personnel</li>
                  <li><strong>Role-Based Access:</strong> Access permissions based on job functions</li>
                  <li><strong>Regular Reviews:</strong> Quarterly access reviews and deprovisioning</li>
                  <li><strong>Privileged Access Management:</strong> Additional controls for administrative access</li>
                </ul>

                <h3 className="text-xl font-medium text-white mb-3">3.3 API Security</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Authentication:</strong> API keys, OAuth 2.0, and JWT tokens</li>
                  <li><strong>Rate Limiting:</strong> Protection against abuse and DoS attacks</li>
                  <li><strong>Input Validation:</strong> Strict validation of all API inputs</li>
                  <li><strong>Monitoring:</strong> Real-time API usage monitoring and alerting</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">4. Application Security</h2>
                
                <h3 className="text-xl font-medium text-white mb-3">4.1 Secure Development Lifecycle</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                  <li><strong>Security by Design:</strong> Security considerations in all development phases</li>
                  <li><strong>Code Reviews:</strong> Mandatory security-focused code reviews</li>
                  <li><strong>Static Analysis:</strong> Automated code scanning for vulnerabilities</li>
                  <li><strong>Dependency Scanning:</strong> Regular scanning of third-party dependencies</li>
                </ul>

                <h3 className="text-xl font-medium text-white mb-3">4.2 Web Application Security</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                  <li><strong>OWASP Compliance:</strong> Protection against OWASP Top 10 vulnerabilities</li>
                  <li><strong>Content Security Policy:</strong> CSP headers to prevent XSS attacks</li>
                  <li><strong>CSRF Protection:</strong> Anti-CSRF tokens for all state-changing operations</li>
                  <li><strong>Input Sanitization:</strong> Comprehensive input validation and sanitization</li>
                </ul>

                <h3 className="text-xl font-medium text-white mb-3">4.3 AI/ML Security</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Model Protection:</strong> Secure storage and access to AI models</li>
                  <li><strong>Data Privacy:</strong> Privacy-preserving techniques in AI processing</li>
                  <li><strong>Input Validation:</strong> Validation of AI inputs to prevent attacks</li>
                  <li><strong>Output Filtering:</strong> Filtering of AI outputs for sensitive information</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">5. Monitoring and Incident Response</h2>
                
                <h3 className="text-xl font-medium text-white mb-3">5.1 Security Monitoring</h3>
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6 mb-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center mb-3">
                        <Server className="w-5 h-5 text-blue-400 mr-2" />
                        <h4 className="font-semibold text-white">Infrastructure Monitoring</h4>
                      </div>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• 24/7 system monitoring</li>
                        <li>• Real-time alerting</li>
                        <li>• Performance metrics</li>
                        <li>• Resource utilization</li>
                      </ul>
                    </div>
                    <div>
                      <div className="flex items-center mb-3">
                        <AlertTriangle className="w-5 h-5 text-orange-400 mr-2" />
                        <h4 className="font-semibold text-white">Security Monitoring</h4>
                      </div>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• Intrusion detection</li>
                        <li>• Anomaly detection</li>
                        <li>• Log analysis</li>
                        <li>• Threat intelligence</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-medium text-white mb-3">5.2 Incident Response Process</h3>
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6 mb-4">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center mr-3 mt-1">
                        <span className="text-red-400 font-semibold text-sm">1</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">Detection & Analysis (0-1 hours)</h4>
                        <p className="text-gray-300 text-sm">Immediate detection, initial assessment, and classification</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center mr-3 mt-1">
                        <span className="text-orange-400 font-semibold text-sm">2</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">Containment (1-4 hours)</h4>
                        <p className="text-gray-300 text-sm">Isolate affected systems and prevent further damage</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center mr-3 mt-1">
                        <span className="text-yellow-400 font-semibold text-sm">3</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">Eradication (4-24 hours)</h4>
                        <p className="text-gray-300 text-sm">Remove threats and vulnerabilities from environment</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mr-3 mt-1">
                        <span className="text-green-400 font-semibold text-sm">4</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">Recovery & Lessons Learned</h4>
                        <p className="text-gray-300 text-sm">Restore services and implement preventive measures</p>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-medium text-white mb-3">5.3 Communication Protocol</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Internal Escalation:</strong> Immediate notification to security team and management</li>
                  <li><strong>Customer Notification:</strong> Transparent communication within 24 hours</li>
                  <li><strong>Regulatory Reporting:</strong> Compliance with breach notification requirements</li>
                  <li><strong>Post-Incident Reports:</strong> Detailed analysis and improvement recommendations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">6. Compliance and Certifications</h2>
                
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Current Certifications</h3>
                    <ul className="text-gray-300 space-y-2">
                      <li>✓ SOC 2 Type II</li>
                      <li>✓ ISO 27001 (in progress)</li>
                      <li>✓ GDPR Compliance</li>
                      <li>✓ CCPA Compliance</li>
                    </ul>
                  </div>
                  <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Security Frameworks</h3>
                    <ul className="text-gray-300 space-y-2">
                      <li>• NIST Cybersecurity Framework</li>
                      <li>• OWASP Security Standards</li>
                      <li>• CIS Critical Security Controls</li>
                      <li>• SANS Top 20 Controls</li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-xl font-medium text-white mb-3">Regular Assessments</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Penetration Testing:</strong> Quarterly external security assessments</li>
                  <li><strong>Vulnerability Assessments:</strong> Monthly internal scans and remediation</li>
                  <li><strong>Code Audits:</strong> Annual third-party security code reviews</li>
                  <li><strong>Compliance Audits:</strong> Regular reviews of security controls and procedures</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">7. Employee Security</h2>
                
                <h3 className="text-xl font-medium text-white mb-3">7.1 Security Awareness</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                  <li><strong>Training Program:</strong> Mandatory security training for all employees</li>
                  <li><strong>Phishing Simulations:</strong> Regular testing and education campaigns</li>
                  <li><strong>Security Champions:</strong> Security advocates in each team</li>
                  <li><strong>Incident Reporting:</strong> Clear procedures for reporting security concerns</li>
                </ul>

                <h3 className="text-xl font-medium text-white mb-3">7.2 Personnel Security</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Background Checks:</strong> Appropriate screening for all personnel</li>
                  <li><strong>Security Agreements:</strong> Confidentiality and acceptable use policies</li>
                  <li><strong>Access Provisioning:</strong> Secure onboarding and offboarding processes</li>
                  <li><strong>Remote Work Security:</strong> Secure work-from-home policies and tools</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">8. Third-Party Security</h2>
                
                <h3 className="text-xl font-medium text-white mb-3">8.1 Vendor Management</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                  <li><strong>Security Assessments:</strong> Due diligence for all critical vendors</li>
                  <li><strong>Contractual Requirements:</strong> Security obligations in vendor agreements</li>
                  <li><strong>Regular Reviews:</strong> Ongoing monitoring of vendor security posture</li>
                  <li><strong>Incident Coordination:</strong> Joint incident response procedures</li>
                </ul>

                <h3 className="text-xl font-medium text-white mb-3">8.2 Supply Chain Security</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Dependency Management:</strong> Secure software supply chain practices</li>
                  <li><strong>Open Source Security:</strong> Vulnerability scanning of open source components</li>
                  <li><strong>License Compliance:</strong> Regular auditing of software licenses</li>
                  <li><strong>Update Management:</strong> Timely patching of third-party components</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">9. Security Contact Information</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  For security-related matters, please contact our security team:
                </p>
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6 mt-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-white mb-3">General Security Inquiries</h4>
                      <p className="text-gray-300 text-sm">
                        <strong>Email:</strong> security@blipee.com<br/>
                        <strong>Response Time:</strong> 24 hours
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-3">Security Incidents</h4>
                      <p className="text-gray-300 text-sm">
                        <strong>Emergency:</strong> incidents@blipee.com<br/>
                        <strong>Response Time:</strong> 1 hour
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-3">Vulnerability Reports</h4>
                      <p className="text-gray-300 text-sm">
                        <strong>Email:</strong> security@blipee.com<br/>
                        <strong>PGP Key:</strong> Available on request
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-3">Compliance Questions</h4>
                      <p className="text-gray-300 text-sm">
                        <strong>Email:</strong> compliance@blipee.com<br/>
                        <strong>Documentation:</strong> Available in customer portal
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-2xl p-6 mt-8">
                <div className="flex items-center mb-3">
                  <Shield className="w-6 h-6 text-green-400 mr-3" />
                  <h3 className="text-lg font-semibold text-white">Responsible Disclosure</h3>
                </div>
                <p className="text-gray-300 text-sm">
                  We appreciate security researchers who help us maintain the security of our platform. 
                  If you discover a security vulnerability, please report it to security@blipee.com. 
                  We commit to acknowledging your report within 24 hours and providing regular updates on our investigation.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}