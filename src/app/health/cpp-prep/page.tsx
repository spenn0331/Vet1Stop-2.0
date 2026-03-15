import { Metadata } from 'next';
import CppPrepPanel from '../components/CppPrepPanel';

export const metadata: Metadata = {
  title: 'C&P Exam Prep | Vet1Stop Health',
  description: 'Practice your VA Compensation & Pension exam with AI-generated questions, role-play feedback, and a downloadable prep sheet. Educational tool only.',
  keywords: 'C&P exam prep, VA compensation pension exam, veteran disability exam, VA exam practice, C&P exam questions',
};

export default function CppPrepPage() {
  return <CppPrepPanel />;
}
