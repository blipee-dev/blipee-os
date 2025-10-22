'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const acceptInvitation = async () => {
      try {
        // Wait for auth to load
        if (authLoading) return;

        // Check if user is authenticated
        if (!user) {
          throw new Error('Please sign in to accept the invitation');
        }

        const orgId = searchParams.get('org');
        if (!orgId) {
          throw new Error('No organization ID provided');
        }

        const supabase = createClient();

        // Update invitation status
        const { error: updateError } = await supabase
          .from('organization_members')
          .update({
            invitation_status: 'accepted',
            joined_at: new Date().toISOString(),
          })
          .eq('organization_id', orgId)
          .eq('user_id', user.id)
          .eq('invitation_status', 'pending');

        if (updateError) {
          throw updateError;
        }

        setStatus('success');
        setMessage('Invitation accepted successfully! Redirecting to dashboard...');
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
        
      } catch (error: any) {
        console.error('Error accepting invitation:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to accept invitation');
      }
    };

    acceptInvitation();
  }, [searchParams, router, user, authLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Card className="w-full max-w-md backdrop-blur-xl bg-white/[0.03] border-white/[0.05]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">
            Organization Invitation
          </CardTitle>
          <CardDescription className="text-gray-400">
            Accept your invitation to join the organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                <p className="text-gray-300">Processing your invitation...</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="text-gray-300 text-center">{message}</p>
              </>
            )}
            
            {status === 'error' && (
              <>
                <XCircle className="h-12 w-12 text-red-500" />
                <p className="text-gray-300 text-center">{message}</p>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => router.push('/login')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => router.push('/dashboard')}
                    variant="outline"
                    className="border-white/10 text-white hover:bg-white/10"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}