import { Metadata } from 'next';

// Import our modular components
import HeroSection from './components/HeroSection';
import CareerPathways from './components/CareerPathways';
import EmploymentResources from './components/EmploymentResources';
import EntrepreneurshipResources from './components/EntrepreneurshipResources';
import TestimonialsSection from './components/TestimonialsSection';
import CtaSection from './components/CtaSection';
import RelatedResources from './components/RelatedResources';

export const metadata: Metadata = {
  title: 'Careers & Entrepreneurship | Vet1Stop',
  description: 'Find employment opportunities, entrepreneurship resources, and career development tools designed specifically for veterans.',
};

export default function CareersPage() {
  return (
    <main>
      <HeroSection />
      <CareerPathways />
      <EmploymentResources />
      <EntrepreneurshipResources />
      <TestimonialsSection />
      <CtaSection />
      <RelatedResources />
    </main>
  );
}
