import { Metadata } from 'next';
import RecordsReconPanel from '../components/RecordsReconPanel';

export const metadata: Metadata = {
  title: 'Records Recon | VA Medical Record Organizer',
  description: 'Securely scan, organize, and highlight your VA medical records to prepare for your VSO appointment.',
  keywords: 'VA medical records, records recon, veteran medical record organizer, VSO briefing pack, VA Blue Button, disability claim evidence',
  openGraph: {
    title: 'Records Recon | VA Medical Record Organizer — Vet1Stop',
    description: 'Securely scan, organize, and highlight your VA medical records to prepare for your VSO appointment.',
    type: 'website',
    siteName: 'Vet1Stop',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Records Recon | VA Medical Record Organizer',
    description: 'Securely scan, organize, and highlight your VA medical records to prepare for your VSO appointment.',
  },
};

export default function RecordsReconPage() {
  return (
    <main className="bg-white min-h-screen" role="main">
      <section
        aria-labelledby="records-recon-page-heading"
        className="py-12 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1
              id="records-recon-page-heading"
              className="text-2xl md:text-3xl font-bold text-[#1A2C5B] mb-3"
            >
              Records Recon
            </h1>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Organize your VA medical records into a structured briefing pack with timeline, conditions index, and verbatim excerpts. A document organizer — not medical or legal advice.
            </p>
          </div>

          <RecordsReconPanel />
        </div>
      </section>
    </main>
  );
}
