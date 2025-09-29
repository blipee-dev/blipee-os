import { Metadata } from 'next';
import ScopeAnalysisClient from './ScopeAnalysisClient';

export const metadata: Metadata = {
  title: 'Scope Analysis | Blipee OS',
  description: 'GHG Protocol compliant emissions scope analysis',
};

export default function ScopeAnalysisPage() {
  return <ScopeAnalysisClient />;
}