'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Check, Loader2, Info } from 'lucide-react';

interface IndustryOption {
  value: string;
  label: string;
  gri_code: string;
  description: string;
}

const INDUSTRIES: IndustryOption[] = [
  { value: 'Services', label: 'Services', gri_code: 'GRI_11', description: 'B2B SaaS, Professional Services, Consulting, IT' },
  { value: 'Manufacturing', label: 'Manufacturing', gri_code: 'GRI_15', description: 'Electronics, Automotive, Machinery, Industrial Production' },
  { value: 'Retail', label: 'Retail', gri_code: 'GRI_17', description: 'E-commerce, Physical Retail, Wholesale, Distribution' },
  { value: 'Oil & Gas', label: 'Oil & Gas', gri_code: 'GRI_12', description: 'Upstream, Downstream, Midstream, Refining' },
  { value: 'Agriculture', label: 'Agriculture', gri_code: 'GRI_13', description: 'Crop Production, Livestock, Aquaculture, Forestry' },
  { value: 'Mining', label: 'Mining', gri_code: 'GRI_14', description: 'Metal Mining, Coal Mining, Quarrying, Extraction' },
  { value: 'Food & Beverage', label: 'Food & Beverage', gri_code: 'GRI_16', description: 'Food Processing, Beverage Production, Restaurants' }
];

const SIZE_CATEGORIES = [
  { value: '1-50', label: '1-50 employees' },
  { value: '50-100', label: '50-100 employees' },
  { value: '100-300', label: '100-300 employees' },
  { value: '300-1000', label: '300-1,000 employees' },
  { value: '1000-5000', label: '1,000-5,000 employees' },
  { value: '5000+', label: '5,000+ employees' }
];

const REGIONS = [
  { value: 'EU', label: 'Europe (EU)' },
  { value: 'North America', label: 'North America' },
  { value: 'Asia-Pacific', label: 'Asia-Pacific' },
  { value: 'Latin America', label: 'Latin America' },
  { value: 'Middle East', label: 'Middle East & Africa' }
];

export function OrganizationIndustrySelector() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [industry, setIndustry] = useState('Services');
  const [size, setSize] = useState('100-300');
  const [region, setRegion] = useState('EU');
  const [autoDetected, setAutoDetected] = useState(false);
  const [detectionReason, setDetectionReason] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchIndustrySettings();
  }, []);

  const fetchIndustrySettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/organizations/industry');
      const data = await response.json();

      if (data) {
        setOrganizationName(data.name || '');
        setIndustry(data.industry || 'Services');
        setSize(data.company_size_category || '100-300');
        setRegion(data.region || 'EU');
        setAutoDetected(data.auto_detected || false);
        setDetectionReason(data.detection_reason || '');
      }
    } catch (error) {
      console.error('Error fetching industry settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/organizations/industry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry,
          company_size_category: size,
          region
        })
      });

      if (response.ok) {
        setSaved(true);
        setAutoDetected(false); // No longer auto-detected after manual save
        setTimeout(() => setSaved(false), 3000);

        // Refresh the page to update recommendations
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error('Error saving industry settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-6 h-6 text-purple-500" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Organization Profile
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {organizationName} • Industry classification for peer benchmarking
          </p>
        </div>
      </div>

      {autoDetected && detectionReason && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
        >
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900 dark:text-blue-200">
              <strong>Auto-detected:</strong> {detectionReason}
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-6">
        {/* Industry Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Industry
          </label>
          <div className="grid grid-cols-2 gap-3">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind.value}
                onClick={() => setIndustry(ind.value)}
                className={`text-left p-4 rounded-lg border-2 transition-all ${
                  industry === ind.value
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">{ind.label}</span>
                  {industry === ind.value && (
                    <Check className="w-5 h-5 text-purple-500" />
                  )}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{ind.gri_code}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{ind.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Company Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Company Size
          </label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {SIZE_CATEGORIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Region */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Primary Region
          </label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            This affects peer benchmarking and metric recommendations
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved!
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
