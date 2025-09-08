'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 p-0.5 rounded-xl" style={{background: 'linear-gradient(to bottom right, rgb(236, 72, 153), rgb(147, 51, 234))'}}>
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                  <Home className="w-5 h-5 sm:w-6 sm:h-6" stroke="url(#homeGradient)" fill="none" strokeWidth="2" />
                </div>
              </div>
              <span className="ml-2 text-lg sm:text-xl font-normal bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                blipee
              </span>
            </Link>
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
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
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
              Terms of Use
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Last updated: January 2025
            </p>

            <div className="prose prose-invert prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  By accessing and using <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-medium">blipee</span>'s 
                  services, website, or platform (collectively, the "Service"), you accept and agree to be bound by the terms and 
                  provision of this agreement. If you do not agree to abide by the above, please do not use this Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-medium">blipee</span> 
                  provides an AI-powered sustainability intelligence platform that offers autonomous AI agents for environmental, 
                  social, and governance (ESG) management. Our Service includes conversational AI interfaces, document processing, 
                  data analytics, and compliance tools.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts and Registration</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  To access certain features of the Service, you must register for an account. You agree to:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Provide accurate, current, and complete information during registration</li>
                  <li>Maintain and promptly update your account information</li>
                  <li>Maintain the security of your password and account</li>
                  <li>Accept responsibility for all activities that occur under your account</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  You agree not to use the Service to:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe upon the rights of others</li>
                  <li>Upload or transmit malicious code, viruses, or harmful content</li>
                  <li>Attempt to gain unauthorized access to the Service or related systems</li>
                  <li>Use the Service for any fraudulent or deceptive practices</li>
                  <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data and Privacy</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service. 
                  By using the Service, you consent to the collection, use, and disclosure of your information as described in 
                  our Privacy Policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property Rights</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  The Service and its original content, features, and functionality are and will remain the exclusive property of 
                  <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-medium"> blipee</span> 
                  and its licensors. The Service is protected by copyright, trademark, and other laws.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. User Content</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  You retain ownership of any content you submit, upload, or display on the Service ("User Content"). 
                  By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, 
                  reproduce, modify, and distribute such content solely to provide the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Service Availability</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We strive to maintain high availability of our Service but cannot guarantee 100% uptime. We reserve the right to 
                  modify, suspend, or discontinue any part of the Service at any time with or without notice.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Payment and Billing</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Paid subscriptions are billed in advance on a recurring basis. You authorize us to charge your payment method 
                  for all fees. Refunds are provided according to our refund policy available on our website.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Disclaimers</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT ANY WARRANTIES OF ANY KIND. 
                  WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, 
                  AND NON-INFRINGEMENT.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Limitation of Liability</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  IN NO EVENT SHALL <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-medium">blipee</span> 
                  BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF YOUR USE OF THE SERVICE.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Termination</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, 
                  for any reason, including breach of these Terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Governing Law</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  These Terms shall be interpreted and governed by the laws of the jurisdiction in which 
                  <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-medium"> blipee</span> 
                  is incorporated, without regard to conflict of law provisions.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Changes to Terms</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new 
                  Terms on this page and updating the "Last updated" date. Your continued use of the Service after such changes 
                  constitutes acceptance of the new Terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Information</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  If you have any questions about these Terms of Use, please contact us at:
                </p>
                <div className="bg-gray-50 backdrop-blur-xl border border-gray-200 rounded-xl p-4 mt-4">
                  <p className="text-gray-600">
                    Email: legal@blipee.com<br/>
                    Website: blipee.com
                  </p>
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white text-gray-900 px-4 sm:px-6 lg:px-8 py-10 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center gap-8">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="w-10 h-10 p-0.5 rounded-xl" style={{background: 'linear-gradient(to bottom right, rgb(236, 72, 153), rgb(147, 51, 234))'}}>
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                  <Home className="w-6 h-6" stroke="url(#footerHomeGradient)" fill="none" strokeWidth="2" />
                  <svg width="0" height="0">
                    <defs>
                      <linearGradient id="footerHomeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgb(236, 72, 153)" />
                        <stop offset="100%" stopColor="rgb(147, 51, 234)" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
              <span className="ml-3 text-xl font-normal bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                blipee
              </span>
            </Link>
            
            <div className="flex flex-col items-center gap-4 text-sm text-gray-600">
              <div className="flex flex-wrap justify-center gap-6">
                <Link href="/features" className="hover:text-gray-900 transition-colors">Features</Link>
                <Link href="/industries" className="hover:text-gray-900 transition-colors">Industries</Link>
                <Link href="/ai-technology" className="hover:text-gray-900 transition-colors">AI Technology</Link>
                <Link href="/about" className="hover:text-gray-900 transition-colors">About</Link>
                <Link href="mailto:contact@blipee.com" className="hover:text-gray-900 transition-colors">Contact</Link>
                <Link href="mailto:support@blipee.com" className="hover:text-gray-900 transition-colors">Support</Link>
              </div>
              <div className="flex flex-wrap justify-center gap-6 border-t border-gray-300 pt-4">
                <Link href="/terms-of-use" className="hover:text-gray-900 transition-colors">Terms</Link>
                <Link href="/privacy-policy" className="hover:text-gray-900 transition-colors">Privacy</Link>
                <Link href="/cookie-policy" className="hover:text-gray-900 transition-colors">Cookies</Link>
                <Link href="/security-policy" className="hover:text-gray-900 transition-colors">Security</Link>
                <Link href="/data-processing-agreement" className="hover:text-gray-900 transition-colors">DPA</Link>
              </div>
            </div>
            
            {/* Copyright */}
            <p className="text-sm text-gray-600">
              © 2025 blipee. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}