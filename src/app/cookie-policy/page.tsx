'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Cookie, Settings, BarChart, Shield } from 'lucide-react';

export default function CookiePolicyPage() {
  const [cookieSettings, setCookieSettings] = useState({
    essential: true,
    analytics: false,
    marketing: false,
    preferences: false
  });

  const handleCookieToggle = (type: string) => {
    if (type !== 'essential') {
      setCookieSettings(prev => ({
        ...prev,
        [type]: !prev[type as keyof typeof prev]
      }));
    }
  };

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
              Cookie Policy
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              Last updated: January 2025
            </p>

            {/* Cookie Preferences Card */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-8 mb-12">
              <div className="flex items-center mb-6">
                <Settings className="w-6 h-6 text-pink-500 mr-3" />
                <h2 className="text-2xl font-semibold text-white">Cookie Preferences</h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-white">Essential Cookies</h3>
                    <p className="text-gray-300 text-sm">Required for basic website functionality</p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={cookieSettings.essential}
                      disabled
                      className="w-5 h-5 text-pink-600 bg-gray-800 border-gray-600 rounded focus:ring-pink-500 focus:ring-2"
                    />
                    <span className="ml-2 text-gray-400 text-sm">Always Active</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-white">Analytics Cookies</h3>
                    <p className="text-gray-300 text-sm">Help us understand how visitors interact with our website</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cookieSettings.analytics}
                      onChange={() => handleCookieToggle('analytics')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-white">Marketing Cookies</h3>
                    <p className="text-gray-300 text-sm">Used to deliver relevant advertisements</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cookieSettings.marketing}
                      onChange={() => handleCookieToggle('marketing')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-white">Preference Cookies</h3>
                    <p className="text-gray-300 text-sm">Remember your settings and preferences</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cookieSettings.preferences}
                      onChange={() => handleCookieToggle('preferences')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all">
                  Save Preferences
                </button>
                <button className="px-6 py-3 border border-gray-600 text-white rounded-lg font-medium hover:border-gray-500 transition-colors">
                  Accept All
                </button>
              </div>
            </div>

            <div className="prose prose-invert prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">What Are Cookies?</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Cookies are small text files that are placed on your computer or mobile device when you visit our website. 
                  They help us provide you with a better experience by remembering your preferences, analyzing how you use our 
                  website, and personalizing content and advertisements.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">Types of Cookies We Use</h2>
                
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6">
                    <div className="flex items-center mb-3">
                      <Shield className="w-6 h-6 text-green-500 mr-3" />
                      <h3 className="text-lg font-semibold text-white">Essential Cookies</h3>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">These cookies are necessary for our website to function properly.</p>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Authentication and security</li>
                      <li>• Session management</li>
                      <li>• Load balancing</li>
                      <li>• CSRF protection</li>
                    </ul>
                  </div>

                  <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6">
                    <div className="flex items-center mb-3">
                      <BarChart className="w-6 h-6 text-blue-500 mr-3" />
                      <h3 className="text-lg font-semibold text-white">Analytics Cookies</h3>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">Help us understand website usage and performance.</p>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Google Analytics</li>
                      <li>• Page view tracking</li>
                      <li>• User journey analysis</li>
                      <li>• Performance metrics</li>
                    </ul>
                  </div>

                  <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6">
                    <div className="flex items-center mb-3">
                      <Cookie className="w-6 h-6 text-orange-500 mr-3" />
                      <h3 className="text-lg font-semibold text-white">Marketing Cookies</h3>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">Used to deliver personalized advertisements.</p>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Ad targeting</li>
                      <li>• Conversion tracking</li>
                      <li>• Retargeting campaigns</li>
                      <li>• Social media pixels</li>
                    </ul>
                  </div>

                  <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6">
                    <div className="flex items-center mb-3">
                      <Settings className="w-6 h-6 text-purple-500 mr-3" />
                      <h3 className="text-lg font-semibold text-white">Preference Cookies</h3>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">Remember your choices and personalize your experience.</p>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Language preferences</li>
                      <li>• Theme settings</li>
                      <li>• Layout preferences</li>
                      <li>• Notification settings</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Cookies</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We may use third-party services that set their own cookies on our website:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Google Analytics:</strong> Tracks website usage and provides insights</li>
                  <li><strong>Intercom:</strong> Powers our customer support chat</li>
                  <li><strong>Stripe:</strong> Processes payments securely</li>
                  <li><strong>Auth0:</strong> Manages user authentication</li>
                  <li><strong>Supabase:</strong> Provides backend services and analytics</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">Cookie Duration</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Cookies are classified by how long they remain on your device:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
                  <li><strong>Persistent Cookies:</strong> Remain until they expire or you delete them</li>
                  <li><strong>Essential cookies:</strong> Typically last for the session or up to 1 year</li>
                  <li><strong>Analytics cookies:</strong> Usually expire after 2 years</li>
                  <li><strong>Marketing cookies:</strong> Vary from 1 day to 2 years</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">Managing Your Cookie Preferences</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You can control cookies in several ways:
                </p>
                
                <h3 className="text-xl font-medium text-white mb-3">Browser Settings</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Most browsers allow you to manage cookie settings in their preferences:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                  <li><strong>Chrome:</strong> Settings > Privacy and security > Cookies and other site data</li>
                  <li><strong>Firefox:</strong> Preferences > Privacy & Security > Cookies and Site Data</li>
                  <li><strong>Safari:</strong> Preferences > Privacy > Cookies and website data</li>
                  <li><strong>Edge:</strong> Settings > Cookies and site permissions</li>
                </ul>

                <h3 className="text-xl font-medium text-white mb-3">Our Cookie Preference Center</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Use the cookie preference tool at the top of this page to control which types of cookies we can use on our website.
                </p>

                <h3 className="text-xl font-medium text-white mb-3">Opt-out Links</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Google Analytics:</strong> <a href="https://tools.google.com/dlpage/gaoptout" className="text-pink-400 hover:text-pink-300">Google Analytics Opt-out Browser Add-on</a></li>
                  <li><strong>Advertising:</strong> <a href="http://optout.aboutads.info/" className="text-pink-400 hover:text-pink-300">Digital Advertising Alliance Opt-out</a></li>
                  <li><strong>Network Advertising:</strong> <a href="http://optout.networkadvertising.org/" className="text-pink-400 hover:text-pink-300">NAI Opt-out</a></li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">Impact of Disabling Cookies</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  If you disable certain cookies, you may experience:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Reduced functionality:</strong> Some features may not work properly</li>
                  <li><strong>Login issues:</strong> You may need to sign in more frequently</li>
                  <li><strong>Lost preferences:</strong> Settings and customizations may not be saved</li>
                  <li><strong>Generic content:</strong> Less personalized experience</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">Updates to This Policy</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We may update this Cookie Policy to reflect changes in our practices or for legal reasons. 
                  We will notify you of any significant changes by posting a notice on our website or sending you an email.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  If you have questions about our use of cookies, please contact us:
                </p>
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-6 mt-4">
                  <p className="text-gray-300">
                    <strong>Email:</strong> privacy@blipee.com<br/>
                    <strong>Website:</strong> blipee.com<br/>
                    <strong>Subject:</strong> Cookie Policy Inquiry
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