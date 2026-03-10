import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
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
      {/* ─── Breadcrumb Nav ─── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1 text-sm text-gray-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#1A2C5B] transition-colors">Home</Link>
            <ChevronRightIcon className="h-3 w-3" />
            <Link href="/health" className="hover:text-[#1A2C5B] transition-colors">Health</Link>
            <ChevronRightIcon className="h-3 w-3" />
            <span className="text-[#1A2C5B] font-medium">Records Recon</span>
          </nav>
        </div>
      </div>

      {/* ─── Back to Health ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-0">
        <Link
          href="/health"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-[#1A2C5B] font-semibold text-sm hover:bg-blue-50 hover:border-[#1A2C5B] transition-all focus:outline-none focus:ring-4 focus:ring-blue-200 shadow-sm"
          aria-label="Back to Health Hub"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Health
        </Link>
      </div>

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
