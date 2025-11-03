import { redirect } from 'next/navigation'

export default function SettingsPage() {
  // Redirect to organizations tab by default
  redirect('/dashboard/settings/organizations')
}
