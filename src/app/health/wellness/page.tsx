import { Metadata } from 'next';
import WellnessPanel from '../components/WellnessPanel';

export const metadata: Metadata = {
  title: 'AI Wellness Predictor | Vet1Stop Health',
  description: 'Track daily well-being trends across 5 dimensions — private, no data leaves your device. Spot patterns and get smart resource suggestions.',
  keywords: 'veteran wellness, daily check-in, mood tracking, veteran mental health, PTSD wellness, self-care veteran',
  openGraph: {
    title: 'AI Wellness Predictor | Vet1Stop',
    description: 'Private daily check-in for veterans — track mood, energy, sleep, pain, and social connection with smart resource suggestions.',
  },
};

export default function WellnessPage() {
  return <WellnessPanel />;
}
