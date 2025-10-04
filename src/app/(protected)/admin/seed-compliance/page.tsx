'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function SeedCompliancePage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [count, setCount] = useState(0);

  const handleSeed = async () => {
    setStatus('loading');
    setMessage('Seeding framework mappings...');

    try {
      const response = await fetch('/api/compliance/seed-mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Framework mappings seeded successfully!');
        setCount(data.count || 0);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to seed framework mappings');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error: ' + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-black/95 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/[0.03] border border-white/[0.05] rounded-lg p-8">
          <h1 className="text-2xl font-bold text-white mb-4">
            Seed Compliance Framework Mappings
          </h1>

          <p className="text-gray-400 mb-6">
            This will populate the framework_mappings table with cross-references between:
          </p>

          <ul className="list-disc list-inside text-gray-400 mb-6 space-y-2">
            <li>GRI Standards (305, 302, 303, 306)</li>
            <li>ESRS E1 Climate Change</li>
            <li>TCFD Recommendations</li>
            <li>IFRS S2 Climate Disclosures</li>
          </ul>

          <div className="mb-6">
            <Button
              onClick={handleSeed}
              disabled={status === 'loading' || status === 'success'}
              className="w-full"
            >
              {status === 'loading' ? 'Seeding...' : status === 'success' ? 'Already Seeded' : 'Seed Framework Mappings'}
            </Button>
          </div>

          {status !== 'idle' && (
            <div className={`p-4 rounded-lg ${
              status === 'success' ? 'bg-green-500/10 border border-green-500/20' :
              status === 'error' ? 'bg-red-500/10 border border-red-500/20' :
              'bg-blue-500/10 border border-blue-500/20'
            }`}>
              <p className={`font-medium ${
                status === 'success' ? 'text-green-400' :
                status === 'error' ? 'text-red-400' :
                'text-blue-400'
              }`}>
                {message}
              </p>
              {count > 0 && (
                <p className="text-gray-400 mt-2">
                  {count} framework mappings created
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
