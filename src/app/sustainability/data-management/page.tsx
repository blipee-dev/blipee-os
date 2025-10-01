import { Metadata } from 'next';
import DataManagementClient from './DataManagementClient';

export const metadata: Metadata = {
  title: 'Data Management | Blipee OS',
  description: 'Manage your sustainability metrics data, update measurements, and track completeness',
};

export default function DataManagementPage() {
  return <DataManagementClient />;
}