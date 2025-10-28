import { requireServerAuth } from '@/lib/auth/server-auth';

export default async function SustainabilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication using session-based auth
  await requireServerAuth('/signin?redirect=/sustainability');

  return <>{children}</>;
}
