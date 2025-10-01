import { Metadata } from 'next';
import MaterialityClient from './MaterialityClient';

export const metadata: Metadata = {
  title: 'Materiality Assessment | Blipee OS',
  description: 'Identify and prioritize material ESG topics for your organization',
};

export default function MaterialityPage() {
  return <MaterialityClient />;
}