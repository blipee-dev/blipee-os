import { Metadata } from 'next';
import TargetsClient from './TargetsClient';

export const metadata: Metadata = {
  title: 'Sustainability Targets | Blipee OS',
  description: 'Science-based targets tracking and management',
};

export default function TargetsPage() {
  return <TargetsClient />;
}