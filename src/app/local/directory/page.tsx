import type { Metadata } from 'next';
import DirectoryClient from './DirectoryClient';

export const metadata: Metadata = {
  title: 'Veteran-Owned Business Directory | Vet1Stop',
  description:
    'Discover and support veteran-owned businesses near you. Browse by category, location, and veteran status.',
};

export default function DirectoryPage() {
  return <DirectoryClient />;
}
