import { Metadata } from 'next';
import {
  PhoneIcon as PhoneIconSolid,
  LockClosedIcon,
  ShieldCheckIcon,
  MapPinIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid';
import {
  ChatBubbleLeftRightIcon,
  DocumentMagnifyingGlassIcon,
  ShieldCheckIcon as ShieldOutline,
  ArrowRightIcon,
  PhoneIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  SparklesIcon,
  HeartIcon,
  MicrophoneIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import NGOSpotlight from './components/NGOSpotlight';
import HealthBrowseSection from './components/HealthBrowseSection';
import SmartBridgeBanner from './components/SmartBridgeBanner';
import AutoFillButton from '@/components/shared/AutoFillButton';
import MissionHub from './components/MissionHub';

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

      {/* ─── Hero ─── */}
      <section aria-labelledby="health-hero-heading" className="bg-gradient-to-br from-[#0F1D3D] via-[#1A2C5B] to-[#1e3a7a] text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#EAB308]/5 rounded-full translate-x-32 -translate-y-24" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/[0.03] rounded-full -translate-x-20 translate-y-16" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="max-w-3xl">
            <h1 id="health-hero-heading" className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
              Your Health.<br />
              <span className="text-[#EAB308]">Your Resources.</span>
            </h1>
            <p className="text-lg text-white/80 mb-2 max-w-2xl leading-relaxed">
              AI-powered tools and 190+ vetted VA, NGO, and state programs to support your well-being &mdash; free, secure, and built for veterans.
            </p>
            <p className="text-sm text-white/50 italic mb-8">
              &ldquo;The strength you built in service doesn&rsquo;t end at discharge.&rdquo;
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/health/symptom-finder" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#EAB308] text-[#0F1D3D] font-bold hover:bg-[#FACC15] focus:outline-none focus:ring-4 focus:ring-yellow-300 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5" aria-label="Start Symptom Finder">
                <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden="true" />
                Symptom Finder
              </Link>
              <Link href="/health/records-recon" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all duration-200 backdrop-blur-sm" aria-label="Start Records Recon">
                <DocumentMagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
                Records Recon
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust & Capability Banner ─── */}
      <div className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-1.5">
          {([
            { Icon: LockClosedIcon,  text: 'Private & Secure' },
            { Icon: CheckCircleIcon, text: '190+ Vetted Resources' },
            { Icon: MapPinIcon,      text: 'Local State Matching' },
            { Icon: ShieldCheckIcon, text: 'No data shared without consent' },
          ] as const).map(({ Icon, text }) => (
            <span key={text} className="flex items-center gap-1.5 text-xs text-slate-500">
              <Icon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" aria-hidden="true" />
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* ─── Smart Bridge Banner (client — only renders if bridge data exists) ─── */}
      <SmartBridgeBanner />

      {/* ─── Tool Navigation Cards ─── */}
      <section aria-labelledby="tools-heading" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="tools-heading" className="text-2xl font-extrabold text-[#1A2C5B] tracking-tight mb-2">Health Tools</h2>
          <p className="text-sm text-gray-500 mb-8">AI-powered tools built specifically for veterans</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Symptom Finder */}
            <Link href="/health/symptom-finder" className="group relative bg-gradient-to-br from-blue-50 to-slate-100 rounded-2xl p-6 border border-blue-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label="Go to Symptom Finder tool">
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 rounded-xl bg-[#1A2C5B] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-[#EAB308]" aria-hidden="true" />
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-[#1A2C5B] group-hover:translate-x-1 transition-all duration-200" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-extrabold text-[#1A2C5B] mb-2">Symptom Finder</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">Chat-style AI triage wizard. Answer a few questions and get personalized VA, NGO, and state resource recommendations.</p>
              <ul className="space-y-1.5">
                {['Conversational AI assessment', 'Triple-track: VA / NGO / State', 'Crisis-line escalation'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircleIcon className="h-3.5 w-3.5 text-green-500 flex-shrink-0" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t border-blue-100">
                <span className="text-sm font-bold text-[#1A2C5B] group-hover:text-blue-700 inline-flex items-center gap-1">Start Symptom Finder <ArrowRightIcon className="h-4 w-4" aria-hidden="true" /></span>
              </div>
            </Link>

            {/* Records Recon */}
            <Link href="/health/records-recon" className="group relative bg-gradient-to-br from-blue-50 to-slate-100 rounded-2xl p-6 border border-blue-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label="Go to Records Recon tool">
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 rounded-xl bg-[#1A2C5B] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
                  <DocumentMagnifyingGlassIcon className="h-6 w-6 text-[#EAB308]" aria-hidden="true" />
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-[#1A2C5B] group-hover:translate-x-1 transition-all duration-200" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-extrabold text-[#1A2C5B] mb-2">Records Recon</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">Upload VA medical records and organize them into a structured VSO Briefing Pack &mdash; conditions index, timeline, and excerpts.</p>
              <ul className="space-y-1.5">
                {['Upload PDFs — auto-deleted after scan', 'AI-powered condition extraction', 'Downloadable VSO Briefing Pack'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircleIcon className="h-3.5 w-3.5 text-green-500 flex-shrink-0" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t border-blue-100">
                <span className="text-sm font-bold text-[#1A2C5B] group-hover:text-blue-700 inline-flex items-center gap-1">Run Recon <ArrowRightIcon className="h-4 w-4" aria-hidden="true" /></span>
              </div>
            </Link>

            {/* VA Healthcare Enrollment */}
            <div className="group bg-gradient-to-br from-blue-50 to-slate-100 rounded-2xl p-6 border border-blue-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 rounded-xl bg-[#1A2C5B] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
                  <ShieldOutline className="h-6 w-6 text-[#EAB308]" aria-hidden="true" />
                </div>
              </div>
              <h3 className="text-lg font-extrabold text-[#1A2C5B] mb-2">VA Healthcare Enrollment</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">Learn about VA healthcare benefits, eligibility requirements, and how to enroll in the VA health system.</p>
              <ul className="space-y-1.5">
                {['Priority group determination', 'Copay and coverage details', 'Community Care eligibility'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircleIcon className="h-3.5 w-3.5 text-green-500 flex-shrink-0" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t border-blue-100">
                <a href="https://www.va.gov/health-care/apply/application/introduction" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#1A2C5B] group-hover:text-blue-700 inline-flex items-center gap-1 focus:outline-none focus:underline transition-colors duration-200" aria-label="Apply for VA health care on VA.gov">
                  Apply on VA.gov <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>

          {/* Additional health tools */}
          <div className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Wellness Predictor */}
              <Link href="/health/wellness" className="group relative bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-5 border border-amber-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2" aria-label="Go to AI Wellness Predictor">
                <div className="flex justify-between items-start mb-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
                    <HeartIcon className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-amber-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all duration-200" aria-hidden="true" />
                </div>
                <h4 className="text-sm font-extrabold text-[#1A2C5B] mb-1">Wellness Predictor</h4>
                <p className="text-xs text-gray-500 leading-relaxed">Daily check-in sliders, 7-day trend chart, and smart resource suggestions — private, no data leaves your device.</p>
                <div className="mt-3 pt-3 border-t border-amber-100">
                  <span className="text-xs font-bold text-amber-700 group-hover:text-amber-800 inline-flex items-center gap-1">Start Check-In <ArrowRightIcon className="h-3 w-3" aria-hidden="true" /></span>
                </div>
              </Link>

              {/* Ambient Scribe */}
              <Link href="/health/scribe" className="group relative bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2" aria-label="Go to Ambient Scribe Companion">
                <div className="flex justify-between items-start mb-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
                    <MicrophoneIcon className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-indigo-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all duration-200" aria-hidden="true" />
                </div>
                <h4 className="text-sm font-extrabold text-[#1A2C5B] mb-1">Ambient Scribe</h4>
                <p className="text-xs text-gray-500 leading-relaxed">Speak or type your health notes — AI organizes them into a structured summary you can download as a PDF.</p>
                <div className="mt-3 pt-3 border-t border-indigo-100">
                  <span className="text-xs font-bold text-indigo-700 group-hover:text-indigo-800 inline-flex items-center gap-1">Start Recording <ArrowRightIcon className="h-3 w-3" aria-hidden="true" /></span>
                </div>
              </Link>

              {/* C&P Exam Prep */}
              <Link href="/health/cpp-prep" className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2" aria-label="Go to C&P Exam Prep">
                <div className="flex justify-between items-start mb-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
                    <ClipboardDocumentCheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-emerald-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-200" aria-hidden="true" />
                </div>
                <h4 className="text-sm font-extrabold text-[#1A2C5B] mb-1">C&amp;P Exam Prep</h4>
                <p className="text-xs text-gray-500 leading-relaxed">Practice your C&P exam with AI-generated questions, role-play feedback, and a downloadable prep sheet.</p>
                <div className="mt-3 pt-3 border-t border-emerald-100">
                  <span className="text-xs font-bold text-emerald-700 group-hover:text-emerald-800 inline-flex items-center gap-1">Start Prep <ArrowRightIcon className="h-3 w-3" aria-hidden="true" /></span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Mission Briefings ─── */}
      <MissionHub />

      {/* ─── NGO Spotlight ─── */}
      <NGOSpotlight />

      {/* ─── Browse Health Resources ─── */}
      <HealthBrowseSection />

      {/* ─── Quick Guides ─── */}
      <section aria-labelledby="guides-heading" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="guides-heading" className="text-2xl font-extrabold text-[#1A2C5B] tracking-tight mb-6">VA Quick Guides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {([
              { title: 'How to Enroll in VA Healthcare', desc: 'Confirm eligibility → gather DD-214 → submit VA Form 10-10EZ online → schedule first appointment.', href: 'https://www.va.gov/health-care/apply/application/introduction', cta: 'Apply on VA.gov' },
              { title: 'Filing a VA Disability Claim', desc: 'Gather medical evidence → connect with a VSO → file VA Form 21-526EZ → attend your C&P exam.', href: 'https://www.va.gov/disability/file-disability-claim-form-21-526ez/', cta: 'File a claim' },
            ] as const).map(g => (
              <div key={g.title} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <h3 className="font-extrabold text-[#1A2C5B] mb-2">{g.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{g.desc}</p>
                <a href={g.href} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#1A2C5B] hover:text-blue-700 inline-flex items-center gap-1 focus:outline-none focus:underline transition-colors duration-200">
                  {g.cta} <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Essential Resources ─── */}
      <section aria-labelledby="essential-heading" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="essential-heading" className="text-2xl font-extrabold text-[#1A2C5B] tracking-tight mb-6">Essential Resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {([
              { title: 'VA Mental Health', desc: 'Counseling, PTSD treatment, substance use, and crisis services.', url: 'https://www.va.gov/health-care/health-needs-conditions/mental-health/', phone: '1-800-273-8255' },
              { title: 'My HealtheVet', desc: 'Manage VA health records, prescriptions, and appointments.', url: 'https://www.myhealth.va.gov/' },
              { title: 'Wounded Warrior Project', desc: 'Programs for post-9/11 veterans with service-connected injuries.', url: 'https://www.woundedwarriorproject.org/', phone: '1-888-997-2586' },
              { title: 'Cohen Veterans Network', desc: 'Nationwide low-cost mental health clinics for veterans and families.', url: 'https://www.cohenveteransnetwork.org/', phone: '1-888-523-6936' },
              { title: 'Give An Hour', desc: 'Free mental health services from volunteer professionals.', url: 'https://giveanhour.org/' },
              { title: 'VA Caregiver Support', desc: 'Education, training, and respite care for veteran caregivers.', url: 'https://www.caregiver.va.gov/', phone: '1-855-260-3274' },
              { title: 'Team RWB', desc: 'Physical and social fitness programs connecting veterans to community.', url: 'https://www.teamrwb.org/' },
              { title: 'PACT Act Resources', desc: 'Expanded benefits for burn pit and toxic exposure veterans.', url: 'https://www.va.gov/resources/the-pact-act-and-your-va-benefits/' },
            ] as const).map(r => (
              <div key={r.title} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <h3 className="font-bold text-[#1A2C5B] text-sm mb-1.5">{r.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{r.desc}</p>
                <div className="flex flex-col gap-1">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#1A2C5B] hover:text-blue-700 inline-flex items-center gap-1 focus:outline-none focus:underline transition-colors duration-200">
                    Visit Website <ArrowRightIcon className="h-3 w-3" aria-hidden="true" />
                  </a>
                  {'phone' in r && r.phone && (
                    <a href={`tel:${(r.phone as string).replace(/\D/g, '')}`} className="text-xs font-semibold text-[#B22234] hover:text-red-700 inline-flex items-center gap-1 transition-colors duration-200">
                      <PhoneIcon className="h-3 w-3" aria-hidden="true" />
                      {r.phone}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Explore Related ─── */}
      <section aria-labelledby="related-heading" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="related-heading" className="text-2xl font-extrabold text-[#1A2C5B] tracking-tight mb-6 text-center">Explore Related Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/education" className="group flex flex-col items-center p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label="Education resources for veterans">
              <AcademicCapIcon className="h-10 w-10 text-[#1A2C5B] mb-3 group-hover:scale-110 transition-transform duration-200" aria-hidden="true" />
              <h3 className="text-lg font-extrabold text-[#1A2C5B] mb-1">Education</h3>
              <p className="text-center text-sm text-gray-500">GI Bill benefits, scholarships, and training programs</p>
            </Link>
            <Link href="/careers" className="group flex flex-col items-center p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label="Career resources for veterans">
              <BriefcaseIcon className="h-10 w-10 text-[#1A2C5B] mb-3 group-hover:scale-110 transition-transform duration-200" aria-hidden="true" />
              <h3 className="text-lg font-extrabold text-[#1A2C5B] mb-1">Careers</h3>
              <p className="text-center text-sm text-gray-500">Jobs, MOS translation, and career resources</p>
            </Link>
            <Link href="/life" className="group flex flex-col items-center p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label="Life and Leisure resources for veterans">
              <SparklesIcon className="h-10 w-10 text-[#EAB308] mb-3 group-hover:scale-110 transition-transform duration-200" aria-hidden="true" />
              <h3 className="text-lg font-extrabold text-[#1A2C5B] mb-1">Life &amp; Leisure</h3>
              <p className="text-center text-sm text-gray-500">Housing, financial tools, legal aid, and recreation</p>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Auto-Fill Floating Button ─── */}
      <AutoFillButton context="health" />
    </main>
  );
}
