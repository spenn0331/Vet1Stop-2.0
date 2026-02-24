import { Metadata } from 'next';
import {
  HeartIcon,
  ArrowRightIcon,
  PhoneIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  SparklesIcon,
  DocumentMagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { PhoneIcon as PhoneIconSolid } from '@heroicons/react/24/solid';
import Link from 'next/link';
import SymptomFinderWizard from './components/SymptomFinderWizard';
import RecordsReconPanel from './components/RecordsReconPanel';
import AutoFillButton from '@/components/shared/AutoFillButton';

export const metadata: Metadata = {
  title: 'Health Resources | Vet1Stop',
  description: 'Access comprehensive veteran health resources, AI-powered symptom triage, medical record organization, and connections to VA, NGO, and state programs.',
  keywords: 'veteran health, VA healthcare, PTSD, mental health veterans, records recon, symptom finder, veteran wellness, medical records',
};

export default function HealthPage() {
  return (
    <main className="bg-white min-h-screen" role="main">
      {/* ─── Crisis Banner (always visible) ─── */}
      <div className="bg-[#B22234] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <PhoneIconSolid className="h-5 w-5 text-[#EAB308]" aria-hidden="true" />
            <span className="font-bold text-base sm:text-lg">Veterans Crisis Line: Dial 988 then Press 1</span>
          </div>
          <div className="flex gap-3">
            <a
              href="tel:988"
              className="px-4 py-2 bg-[#EAB308] text-[#1F2937] font-semibold rounded-md shadow hover:bg-[#FACC15] transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-300 text-sm"
              aria-label="Call Veterans Crisis Line"
            >
              Call 988
            </a>
            <a
              href="sms:838255&body=HOME"
              className="px-4 py-2 bg-white/20 text-white font-semibold rounded-md hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
              aria-label="Text Veterans Crisis Line"
            >
              Text 838255
            </a>
          </div>
        </div>
      </div>

      {/* ─── Hero Banner ─── */}
      <section
        aria-labelledby="health-hero-heading"
        className="bg-[#1A2C5B] text-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <h1
                id="health-hero-heading"
                className="text-3xl md:text-4xl font-bold mb-4 tracking-tight"
              >
                Health Resources
              </h1>
              <p className="text-lg md:text-xl max-w-3xl leading-relaxed">
                AI-powered health tools and comprehensive resources to support your well-being. Find the right care through VA, NGO, and state programs.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <a
                  href="#symptom-finder"
                  className="inline-flex items-center px-6 py-3 rounded-md bg-[#EAB308] text-[#1A2C5B] font-semibold hover:bg-[#FACC15] focus:outline-none focus:ring-4 focus:ring-yellow-300 transition-colors"
                  aria-label="Jump to Symptom Finder section"
                >
                  Symptom Finder
                  <ChatBubbleLeftRightIcon className="ml-2 h-5 w-5" aria-hidden="true" />
                </a>
                <a
                  href="#records-recon"
                  className="inline-flex items-center px-6 py-3 rounded-md bg-transparent border-2 border-white text-white font-semibold hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/30 transition-colors"
                  aria-label="Jump to Records Recon section"
                >
                  Records Recon
                  <DocumentMagnifyingGlassIcon className="ml-2 h-5 w-5" aria-hidden="true" />
                </a>
              </div>
            </div>
            <div className="mt-8 md:mt-0 flex justify-center">
              <div className="bg-white/10 p-5 rounded-full">
                <HeartIcon className="h-24 w-24 text-[#EAB308]" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Quick Access Cards ─── */}
      <section aria-labelledby="quick-access-heading" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="quick-access-heading"
            className="text-2xl md:text-3xl font-bold text-[#1A2C5B] mb-8"
          >
            Health Tools &amp; Quick Access
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Symptom Finder Card */}
            <a
              href="#symptom-finder"
              className="bg-blue-50 rounded-lg p-6 border border-blue-100 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="mb-4 flex justify-between items-start">
                <h3 className="text-xl font-bold text-[#1A2C5B]">Symptom Finder</h3>
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-[#1A2C5B]" aria-hidden="true" />
              </div>
              <p className="text-gray-700 mb-4">
                Chat-style triage wizard powered by AI. Answer a few questions and get personalized VA, NGO, and state resource recommendations.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm">
                <li>Progressive conversational assessment</li>
                <li>AI severity analysis</li>
                <li>Triple-track: VA / NGO / State resources</li>
                <li>Crisis-line escalation when needed</li>
              </ul>
              <div className="mt-4 pt-4 border-t border-blue-100">
                <span className="text-[#1A2C5B] font-medium inline-flex items-center group-hover:text-blue-700">
                  Start Symptom Finder
                  <ArrowRightIcon className="ml-1 h-4 w-4" aria-hidden="true" />
                </span>
              </div>
            </a>

            {/* Records Recon Card */}
            <a
              href="#records-recon"
              className="bg-blue-50 rounded-lg p-6 border border-blue-100 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="mb-4 flex justify-between items-start">
                <h3 className="text-xl font-bold text-[#1A2C5B]">Records Recon</h3>
                <DocumentMagnifyingGlassIcon className="h-6 w-6 text-[#1A2C5B]" aria-hidden="true" />
              </div>
              <p className="text-gray-700 mb-4">
                Upload your VA medical records and organize them into a structured VSO Briefing Pack with timeline, conditions index, and excerpts.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm">
                <li>Upload PDFs — auto-deleted after scan</li>
                <li>AI-powered condition extraction</li>
                <li>Interactive timeline + PDF viewer</li>
                <li>Downloadable VSO Briefing Pack</li>
              </ul>
              <div className="mt-4 pt-4 border-t border-blue-100">
                <span className="text-[#1A2C5B] font-medium inline-flex items-center group-hover:text-blue-700">
                  Run Recon
                  <ArrowRightIcon className="ml-1 h-4 w-4" aria-hidden="true" />
                </span>
              </div>
            </a>

            {/* VA Healthcare Benefits Card */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4 flex justify-between items-start">
                <h3 className="text-xl font-bold text-[#1A2C5B]">VA Healthcare Enrollment</h3>
                <ShieldCheckIcon className="h-6 w-6 text-[#1A2C5B]" aria-hidden="true" />
              </div>
              <p className="text-gray-700 mb-4">
                Learn about VA healthcare benefits, eligibility requirements, and how to enroll in the VA health system.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm">
                <li>Priority group determination</li>
                <li>Copay and coverage details</li>
                <li>Enrollment assistance</li>
                <li>Community Care eligibility</li>
              </ul>
              <div className="mt-4 pt-4 border-t border-blue-100">
                <a
                  href="https://www.va.gov/health-care/apply/application/introduction"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1A2C5B] font-medium hover:text-blue-700 inline-flex items-center focus:outline-none focus:underline"
                  aria-label="Apply for VA health care on VA.gov (opens in new tab)"
                >
                  Apply on VA.gov
                  <ArrowRightIcon className="ml-1 h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Symptom Finder Section ─── */}
      <section
        id="symptom-finder"
        aria-labelledby="symptom-finder-heading"
        className="py-16 bg-gray-50 scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2
              id="symptom-finder-heading"
              className="text-2xl md:text-3xl font-bold text-[#1A2C5B] mb-3"
            >
              Symptom Finder
            </h2>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Our AI-powered triage wizard asks a few questions about your health needs and connects you with the right VA, NGO, and state resources.
            </p>
          </div>

          <SymptomFinderWizard />
        </div>
      </section>

      {/* ─── Records Recon Section ─── */}
      <section
        id="records-recon"
        aria-labelledby="records-recon-heading"
        className="py-16 bg-white scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2
              id="records-recon-heading"
              className="text-2xl md:text-3xl font-bold text-[#1A2C5B] mb-3"
            >
              Records Recon
            </h2>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Organize your VA medical records into a structured briefing pack with timeline, conditions index, and verbatim excerpts. A document organizer — not medical or legal advice.
            </p>
          </div>

          <RecordsReconPanel />
        </div>
      </section>

      {/* ─── VA Benefits Quick Guides ─── */}
      <section
        aria-labelledby="guides-heading"
        className="py-16 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="guides-heading"
            className="text-2xl md:text-3xl font-bold text-[#1A2C5B] mb-8"
          >
            Health Quick Guides
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Guide 1: Enrolling in VA Healthcare */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-[#1A2C5B] flex items-center justify-center text-white mr-4">
                  <span className="font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold text-[#1A2C5B]">How to Enroll in VA Healthcare</h3>
              </div>
              <ol className="list-none space-y-6">
                <li className="relative pl-9">
                  <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[#1A2C5B] font-bold text-sm">1</div>
                  <div>
                    <span className="font-medium text-[#1A2C5B]">Confirm your eligibility</span>
                    <p className="mt-1 text-gray-600">
                      Most veterans who served on active duty and were separated under conditions other than dishonorable qualify.
                    </p>
                  </div>
                </li>
                <li className="relative pl-9">
                  <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[#1A2C5B] font-bold text-sm">2</div>
                  <div>
                    <span className="font-medium text-[#1A2C5B]">Gather your DD-214 and records</span>
                    <p className="mt-1 text-gray-600">
                      You&apos;ll need your DD-214, insurance information, and financial details for enrollment.
                    </p>
                  </div>
                </li>
                <li className="relative pl-9">
                  <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[#1A2C5B] font-bold text-sm">3</div>
                  <div>
                    <span className="font-medium text-[#1A2C5B]">Apply online via VA Form 10-10EZ</span>
                    <p className="mt-1 text-gray-600">
                      Complete the application on VA.gov or visit your local VA medical center for in-person help.
                    </p>
                  </div>
                </li>
                <li className="relative pl-9">
                  <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[#1A2C5B] font-bold text-sm">4</div>
                  <div>
                    <span className="font-medium text-[#1A2C5B]">Schedule your first appointment</span>
                    <p className="mt-1 text-gray-600">
                      Once enrolled, schedule your initial health assessment at your local VAMC.
                    </p>
                  </div>
                </li>
              </ol>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <a
                  href="https://www.va.gov/health-care/apply/application/introduction"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1A2C5B] font-medium hover:text-blue-700 inline-flex items-center focus:outline-none focus:underline"
                  aria-label="Apply for VA health care (opens in new tab)"
                >
                  Start your application on VA.gov
                  <ArrowRightIcon className="ml-1 h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* Guide 2: Filing a Disability Claim */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-[#1A2C5B] flex items-center justify-center text-white mr-4">
                  <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-[#1A2C5B]">Filing a VA Disability Claim</h3>
              </div>
              <ol className="list-none space-y-6">
                <li className="relative pl-9">
                  <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[#1A2C5B] font-bold text-sm">1</div>
                  <div>
                    <span className="font-medium text-[#1A2C5B]">Gather medical evidence</span>
                    <p className="mt-1 text-gray-600">
                      Collect service treatment records, VA medical records, and private medical records. Use Records Recon above to organize your records.
                    </p>
                  </div>
                </li>
                <li className="relative pl-9">
                  <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[#1A2C5B] font-bold text-sm">2</div>
                  <div>
                    <span className="font-medium text-[#1A2C5B]">Connect with a VSO</span>
                    <p className="mt-1 text-gray-600">
                      A Veterans Service Organization can help you file for free. They know the process and increase approval rates.
                    </p>
                  </div>
                </li>
                <li className="relative pl-9">
                  <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[#1A2C5B] font-bold text-sm">3</div>
                  <div>
                    <span className="font-medium text-[#1A2C5B]">File your claim on VA.gov</span>
                    <p className="mt-1 text-gray-600">
                      Submit VA Form 21-526EZ online, by mail, or in person at your local VA regional office.
                    </p>
                  </div>
                </li>
                <li className="relative pl-9">
                  <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[#1A2C5B] font-bold text-sm">4</div>
                  <div>
                    <span className="font-medium text-[#1A2C5B]">Attend your C&amp;P exam</span>
                    <p className="mt-1 text-gray-600">
                      The VA may schedule a Compensation &amp; Pension exam. Be thorough and honest about how conditions affect your daily life.
                    </p>
                  </div>
                </li>
              </ol>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <a
                  href="https://www.va.gov/disability/file-disability-claim-form-21-526ez/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1A2C5B] font-medium hover:text-blue-700 inline-flex items-center focus:outline-none focus:underline"
                  aria-label="File a disability claim on VA.gov (opens in new tab)"
                >
                  File a claim on VA.gov
                  <ArrowRightIcon className="ml-1 h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Key Health Resources ─── */}
      <section
        aria-labelledby="key-resources-heading"
        className="py-16 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="key-resources-heading"
            className="text-2xl md:text-3xl font-bold text-[#1A2C5B] mb-8"
          >
            Essential Health Resources
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'VA Mental Health',
                desc: 'Counseling, PTSD treatment, substance use, and crisis services through the VA.',
                url: 'https://www.va.gov/health-care/health-needs-conditions/mental-health/',
                phone: '1-800-273-8255',
              },
              {
                title: 'My HealtheVet',
                desc: 'Manage VA health records, prescriptions, and appointments online.',
                url: 'https://www.myhealth.va.gov/',
              },
              {
                title: 'Wounded Warrior Project',
                desc: 'Programs for post-9/11 veterans with service-connected injuries.',
                url: 'https://www.woundedwarriorproject.org/',
                phone: '1-888-997-2586',
              },
              {
                title: 'Cohen Veterans Network',
                desc: 'Nationwide low-cost mental health clinics for veterans and families.',
                url: 'https://www.cohenveteransnetwork.org/',
                phone: '1-888-523-6936',
              },
              {
                title: 'Give An Hour',
                desc: 'Free mental health services from volunteer professionals.',
                url: 'https://giveanhour.org/',
              },
              {
                title: 'VA Caregiver Support',
                desc: 'Education, training, and respite care for veteran caregivers.',
                url: 'https://www.caregiver.va.gov/',
                phone: '1-855-260-3274',
              },
              {
                title: 'Team RWB',
                desc: 'Physical and social fitness programs connecting veterans to community.',
                url: 'https://www.teamrwb.org/',
              },
              {
                title: 'PACT Act Resources',
                desc: 'Expanded benefits for burn pit and toxic exposure veterans.',
                url: 'https://www.va.gov/resources/the-pact-act-and-your-va-benefits/',
              },
            ].map((resource) => (
              <div
                key={resource.title}
                className="bg-gray-50 rounded-lg p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="font-bold text-[#1A2C5B] mb-2">{resource.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{resource.desc}</p>
                <div className="flex flex-col gap-1">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#1A2C5B] font-medium hover:text-blue-700 inline-flex items-center focus:outline-none focus:underline"
                  >
                    Visit Website <ArrowRightIcon className="ml-1 h-3 w-3" aria-hidden="true" />
                  </a>
                  {resource.phone && (
                    <a
                      href={`tel:${resource.phone.replace(/[^0-9]/g, '')}`}
                      className="text-sm text-[#B22234] font-medium hover:text-red-700 inline-flex items-center"
                    >
                      <PhoneIcon className="mr-1 h-3 w-3" aria-hidden="true" />
                      {resource.phone}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Explore Related Resources ─── */}
      <section
        aria-labelledby="related-heading"
        className="py-16 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="related-heading"
            className="text-2xl md:text-3xl font-bold text-[#1A2C5B] mb-8 text-center"
          >
            Explore Related Resources
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/education" className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow focus:outline-none focus:ring-4 focus:ring-blue-100">
              <AcademicCapIcon className="h-12 w-12 text-[#1A2C5B] mb-4" aria-hidden="true" />
              <h3 className="text-xl font-bold text-[#1A2C5B] mb-2">Education</h3>
              <p className="text-center text-gray-600">GI Bill benefits, scholarships, and training programs for veterans</p>
            </Link>

            <Link href="/careers" className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow focus:outline-none focus:ring-4 focus:ring-blue-100">
              <BriefcaseIcon className="h-12 w-12 text-[#1A2C5B] mb-4" aria-hidden="true" />
              <h3 className="text-xl font-bold text-[#1A2C5B] mb-2">Careers</h3>
              <p className="text-center text-gray-600">Job opportunities, MOS translation, and career resources for veterans</p>
            </Link>

            <Link href="/life" className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow focus:outline-none focus:ring-4 focus:ring-blue-100">
              <SparklesIcon className="h-12 w-12 text-[#EAB308] mb-4" aria-hidden="true" />
              <h3 className="text-xl font-bold text-[#1A2C5B] mb-2">Life &amp; Leisure</h3>
              <p className="text-center text-gray-600">Housing, financial tools, legal aid, and recreation for veterans</p>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Auto-Fill Floating Button ─── */}
      <AutoFillButton context="health" />
    </main>
  );
}
