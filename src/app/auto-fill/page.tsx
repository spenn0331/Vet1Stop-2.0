// @ts-nocheck
import { Metadata } from 'next';
import AutoFillPanel from './components/AutoFillPanel';

export const metadata: Metadata = {
  title: 'Auto-Fill Engine | Vet1Stop',
  description: 'Upload your DD-214 once — fields extracted privately in your browser, stored in your Digital Sea Bag for form pre-population. SSNs are never extracted.',
  keywords: 'DD-214 auto fill, veteran form fill, digital sea bag, VA form pre-population, DD-214 reader',
};

export default function AutoFillPage() {
  return <AutoFillPanel />;
}
