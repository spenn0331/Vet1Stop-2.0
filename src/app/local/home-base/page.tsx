import type { Metadata } from 'next';
import HomeBaseClient from './HomeBaseClient';

export const metadata: Metadata = {
  title: 'Home Base — VA Real Estate for Veterans | Vet1Stop',
  description:
    'Find VA loan specialists who understand your mission. Zero down payment, no PMI, expert guidance. The Real Estate Referral Network by Vet1Stop.',
};

export default function HomeBasePage() {
  return <HomeBaseClient />;
}
