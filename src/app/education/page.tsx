import { Metadata } from 'next';
import {
  CheckCircleIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  MapPinIcon,
} from '@heroicons/react/24/solid';
import {
  AcademicCapIcon,
  ArrowRightIcon,
  CalculatorIcon,
  BriefcaseIcon,
  SparklesIcon,
  HeartIcon,
  MapIcon,
  ClockIcon,
  CheckCircleIcon as CheckOutline,
  GlobeAltIcon,
  DocumentTextIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import SchoolFinderPanel from './components/SchoolFinderPanel';
import GiBillPanel from './components/GiBillPanel';
import EducationBrowseSection from './components/EducationBrowseSection';
import MOSTranslatorCard from './components/MOSTranslatorCard';
import AutoFillButton from '@/components/shared/AutoFillButton';
import EducationAdvisorPanel from './components/EducationAdvisorPanel';

export const metadata: Metadata = {
  title: 'Education Benefits & Resources | Vet1Stop',
  description: 'GI Bill Pathfinder, School Finder, scholarships, and 102+ vetted education programs â€” free tools built for veterans.',
  keywords: 'GI Bill calculator, veteran education benefits, yellow ribbon schools, scholarships for veterans, MOS translator, school comparison, post-9/11 GI bill',
};

// â”€â”€â”€ Education Pathways (static, no MissionPanel needed for MVP) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const EDUCATION_PATHS = [
  {
    id: 'gi-bill-activation',
    icon: 'ðŸŽ“', title: 'Activate Your Post-9/11 GI Bill',
    objective: 'Get your GI Bill entitlement live and your Certificate of Eligibility in hand.',
    estimatedMins: 90,
    steps: [
      'Verify active service duration â†’ determines your entitlement %',
      'Apply online using VA Form 22-1990 at VA.gov',
      'Receive Certificate of Eligibility (COE) by mail',
      'Deliver COE to your school\'s Veterans Certifying Official',
    ],
  },
  {
    id: 'school-comparison',
    icon: 'ðŸ«', title: 'Compare Schools & Maximize BAH',
    objective: 'Find the highest-value school for your goals and lock in your monthly housing income.',
    estimatedMins: 60,
    steps: [
      'Use School Finder below to filter Yellow Ribbon schools',
      'Select up to 3 schools â†’ compare tuition, debt, vet services',
      'Bridge to GI Bill Pathfinder to see net monthly income',
      'Confirm school is approved at VA WEAM lookup tool',
    ],
  },
  {
    id: 'voc-rehab',
    icon: 'âš™ï¸', title: 'Apply for Vocational Rehab (Ch. 31)',
    objective: 'Secure full tuition + living stipend for a new career path through VA VR&E.',
    estimatedMins: 120,
    steps: [
      'Confirm service-connected disability rating (any % qualifies)',
      'Apply online at VA.gov â†’ select Chapter 31 VR&E',
      'Attend Initial Evaluation appointment with a VR&E counselor',
      'Develop Individual Plan for Employment (IPE) with your counselor',
    ],
  },
  {
    id: 'stem-scholarship',
    icon: 'ðŸ”¬', title: 'STEM Scholarship Pathway',
    objective: 'Stack VA STEM extension with top scholarships for a fully-funded STEM degree.',
    estimatedMins: 180,
    steps: [
      'Confirm STEM-approved program (VA list: science, tech, engineering, math)',
      'Exhaust at least 180 days of Post-9/11 GI Bill entitlement first',
      'Apply for VA STEM Scholarship extension (up to 9 extra months)',
      'Supplement with Pat Tillman, SVA, or branch-specific scholarship',
    ],
  },
] as const;


export default function EducationPage() {
  return (
    <main className="bg-white min-h-screen" role="main">

      {/* â”€â”€â”€ Hero â”€â”€â”€ */}
      <section aria-labelledby="education-hero-heading" className="bg-gradient-to-br from-[#0F1D3D] via-[#1A2C5B] to-[#1e3a7a] text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#EAB308]/5 rounded-full translate-x-32 -translate-y-24" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/[0.03] rounded-full -translate-x-20 translate-y-16" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="max-w-3xl">
            <h1 id="education-hero-heading" className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
              Your Education.<br />
              <span className="text-[#EAB308]">Your Benefits. Your Future.</span>
            </h1>
            <p className="text-lg text-white/80 mb-2 max-w-2xl leading-relaxed">
              GI Bill calculator, school comparison, 102+ vetted scholarships and VA programs â€” free tools built for veterans.
            </p>
            <p className="text-sm text-white/50 italic mb-8">
              &ldquo;Education is the most powerful weapon which you can use to change the world.&rdquo;
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#school-finder" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#EAB308] text-[#0F1D3D] font-bold hover:bg-[#FACC15] focus:outline-none focus:ring-4 focus:ring-yellow-300 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5" aria-label="Go to School Finder">
                <AcademicCapIcon className="h-5 w-5" aria-hidden="true" />
                School Finder
              </a>
              <a href="#gi-bill" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all duration-200 backdrop-blur-sm" aria-label="Go to GI Bill Pathfinder">
                <CalculatorIcon className="h-5 w-5" aria-hidden="true" />
                GI Bill Pathfinder
              </a>
              <a href="#edu-advisor" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all duration-200 backdrop-blur-sm" aria-label="Go to Education Advisor AI">
                <SparklesIcon className="h-5 w-5 text-[#EAB308]" aria-hidden="true" />
                Education Advisor
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€â”€ Trust Banner â”€â”€â”€ */}
      <div className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-1.5">
          {([
            { Icon: CheckCircleIcon, text: '102+ Vetted Resources' },
            { Icon: LockClosedIcon,  text: 'GI Bill Eligible Programs' },
            { Icon: StarIcon,        text: 'Yellow Ribbon Schools Tracked' },
            { Icon: ShieldCheckIcon, text: 'Free Tools â€” No Account Required' },
          ] as const).map(({ Icon, text }) => (
            <span key={text} className="flex items-center gap-1.5 text-xs text-slate-500">
              <Icon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" aria-hidden="true" />
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* â”€â”€â”€ Primary Tool Cards â”€â”€â”€ */}
      <section aria-labelledby="tools-heading" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="tools-heading" className="text-2xl font-extrabold text-[#1A2C5B] tracking-tight mb-2">Education Tools</h2>
          <p className="text-sm text-gray-500 mb-8">AI-powered tools and calculators built for veterans</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* School Finder */}
            <a href="#school-finder" className="group relative bg-gradient-to-br from-blue-50 to-slate-100 rounded-2xl p-6 border border-blue-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label="Go to School Finder">
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 rounded-xl bg-[#1A2C5B] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
                  <AcademicCapIcon className="h-6 w-6 text-[#EAB308]" aria-hidden="true" />
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-[#1A2C5B] group-hover:translate-x-1 transition-all duration-200" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-extrabold text-[#1A2C5B] mb-2">School Finder</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">Filter 20 top veteran-friendly schools by state, Yellow Ribbon status, and degree type â€” then compare up to 3 side-by-side.</p>
              <ul className="space-y-1.5">
                {['State + Yellow Ribbon filter', 'Side-by-side comparison table', 'Bridge to GI Bill calculator'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckOutline className="h-3.5 w-3.5 text-green-500 flex-shrink-0" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t border-blue-100">
                <span className="text-sm font-bold text-[#1A2C5B] group-hover:text-blue-700 inline-flex items-center gap-1">Find My School <ArrowRightIcon className="h-4 w-4" aria-hidden="true" /></span>
              </div>
            </a>

            {/* GI Bill Pathfinder */}
            <a href="#gi-bill" className="group relative bg-gradient-to-br from-blue-50 to-slate-100 rounded-2xl p-6 border border-blue-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label="Go to GI Bill Pathfinder">
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 rounded-xl bg-[#1A2C5B] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
                  <CalculatorIcon className="h-6 w-6 text-[#EAB308]" aria-hidden="true" />
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-[#1A2C5B] group-hover:translate-x-1 transition-all duration-200" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-extrabold text-[#1A2C5B] mb-2">GI Bill Pathfinder</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">Enter your service months, school state, and tuition â€” see your exact monthly net income and 3-year degree projection.</p>
              <ul className="space-y-1.5">
                {['Live BAH + stipend calculation', 'Post-9/11 & Montgomery chapters', 'Downloadable GI Bill Plan PDF'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckOutline className="h-3.5 w-3.5 text-green-500 flex-shrink-0" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t border-blue-100">
                <span className="text-sm font-bold text-[#1A2C5B] group-hover:text-blue-700 inline-flex items-center gap-1">Calculate My Income <ArrowRightIcon className="h-4 w-4" aria-hidden="true" /></span>
              </div>
            </a>

            {/* VA Education Benefits */}
            <div className="group bg-gradient-to-br from-blue-50 to-slate-100 rounded-2xl p-6 border border-blue-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 rounded-xl bg-[#1A2C5B] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
                  <DocumentTextIcon className="h-6 w-6 text-[#EAB308]" aria-hidden="true" />
                </div>
              </div>
              <h3 className="text-lg font-extrabold text-[#1A2C5B] mb-2">VA Education Benefits</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">Explore every VA education program â€” Post-9/11, Montgomery, Voc Rehab, Survivor benefits, and more.</p>
              <ul className="space-y-1.5">
                {['All GI Bill chapters explained', 'Transferability to dependents', 'Chapter 35 survivor benefits'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckOutline className="h-3.5 w-3.5 text-green-500 flex-shrink-0" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t border-blue-100">
                <a href="https://www.va.gov/education/about-gi-bill-benefits/" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#1A2C5B] group-hover:text-blue-700 inline-flex items-center gap-1 focus:outline-none transition-colors duration-200">
                  Explore on VA.gov <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>

          {/* Education Advisor tool card */}
          <div className="mt-8 mb-2">
            <a href="#edu-advisor" className="group relative flex items-start gap-5 bg-gradient-to-br from-[#0F1D3D] to-[#1A2C5B] rounded-2xl p-6 border border-[#1A2C5B] shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label="Go to AI Education Advisor">
              <div className="h-12 w-12 rounded-xl bg-[#EAB308]/20 flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-200">
                <SparklesIcon className="h-6 w-6 text-[#EAB308]" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-extrabold text-white">Education Advisor</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAB308] text-[#1F2937]">AI-Powered</span>
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-3">Tell us your education goal — GI Bill, scholarship, Voc Rehab, STEM, or state programs — and our AI pulls curated, vetted resources from 102+ programs in seconds.</p>
                <ul className="flex flex-wrap gap-x-6 gap-y-1">
                  {['Federal VA Programs', 'Scholarships & NGOs', 'State Benefits'].map(f => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-white/60">
                      <CheckOutline className="h-3.5 w-3.5 text-[#EAB308] flex-shrink-0" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-white/40 group-hover:text-[#EAB308] group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 self-center" aria-hidden="true" />
            </a>
          </div>

          {/* Secondary tool cards */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="https://www.va.gov/education/about-gi-bill-benefits/post-9-11/yellow-ribbon-program/find-yellow-ribbon-schools/" target="_blank" rel="noopener noreferrer" className="group bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-5 border border-yellow-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2" aria-label="Yellow Ribbon school search on VA.gov">
              <div className="flex justify-between items-start mb-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
                  <StarIcon className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
                <ArrowRightIcon className="h-4 w-4 text-amber-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all duration-200" aria-hidden="true" />
              </div>
              <h4 className="text-sm font-extrabold text-[#1A2C5B] mb-1">Yellow Ribbon Finder</h4>
              <p className="text-xs text-gray-500 leading-relaxed">Official VA school search for all Yellow Ribbon participating institutions.</p>
              <div className="mt-3 pt-3 border-t border-amber-100">
                <span className="text-xs font-bold text-amber-700 group-hover:text-amber-800 inline-flex items-center gap-1">Search on VA.gov <ArrowRightIcon className="h-3 w-3" aria-hidden="true" /></span>
              </div>
            </a>

            <a href="https://www.va.gov/careers-employment/vocational-rehabilitation/" target="_blank" rel="noopener noreferrer" className="group bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-5 border border-purple-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2" aria-label="Vocational Rehabilitation Chapter 31 on VA.gov">
              <div className="flex justify-between items-start mb-3">
                <div className="h-10 w-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
                  <BriefcaseIcon className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
                <ArrowRightIcon className="h-4 w-4 text-purple-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all duration-200" aria-hidden="true" />
              </div>
              <h4 className="text-sm font-extrabold text-[#1A2C5B] mb-1">Vocational Rehab (Ch. 31)</h4>
              <p className="text-xs text-gray-500 leading-relaxed">Full tuition + living stipend for veterans with service-connected disabilities seeking new careers.</p>
              <div className="mt-3 pt-3 border-t border-purple-100">
                <span className="text-xs font-bold text-purple-700 group-hover:text-purple-800 inline-flex items-center gap-1">Learn More <ArrowRightIcon className="h-3 w-3" aria-hidden="true" /></span>
              </div>
            </a>

            <a href="https://www.va.gov/education/other-va-education-benefits/stem-scholarship/" target="_blank" rel="noopener noreferrer" className="group bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-5 border border-teal-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2" aria-label="VA STEM Scholarship on VA.gov">
              <div className="flex justify-between items-start mb-3">
                <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
                  <SparklesIcon className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
                <ArrowRightIcon className="h-4 w-4 text-teal-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all duration-200" aria-hidden="true" />
              </div>
              <h4 className="text-sm font-extrabold text-[#1A2C5B] mb-1">STEM Scholarship</h4>
              <p className="text-xs text-gray-500 leading-relaxed">Up to 9 additional months of Post-9/11 GI Bill benefits for approved STEM degree programs.</p>
              <div className="mt-3 pt-3 border-t border-teal-100">
                <span className="text-xs font-bold text-teal-700 group-hover:text-teal-800 inline-flex items-center gap-1">Apply for STEM <ArrowRightIcon className="h-3 w-3" aria-hidden="true" /></span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* â”€â”€â”€ School Finder Panel (inline, anchor #school-finder) â”€â”€â”€ */}
      {/* ─── Mission Briefing ─── */}
      <section aria-labelledby="mission-briefing-heading" className="py-12 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-1">
            <MapIcon className="h-5 w-5 text-[#EAB308]" aria-hidden="true" />
            <h2 id="mission-briefing-heading" className="text-2xl font-extrabold text-[#1A2C5B] tracking-tight">Mission Briefing</h2>
          </div>
          <p className="text-sm text-gray-500 mb-8 max-w-xl">
            Guided, step-by-step education missions — from activating your GI Bill to landing a fully-funded STEM degree.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {EDUCATION_PATHS.map(path => (
              <div key={path.id} className="group text-left bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                <div className="h-1.5 w-full bg-gradient-to-r from-[#1A2C5B] to-[#2d4d99]" />
                <div className="p-5 flex flex-col flex-1">
                  <span className="text-2xl mb-3 block" role="img" aria-hidden="true">{path.icon}</span>
                  <h3 className="text-sm font-extrabold text-[#1A2C5B] leading-snug mb-1 group-hover:text-blue-700 transition-colors">
                    {path.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3 flex-1">{path.objective}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      {path.estimatedMins} min
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckOutline className="h-3.5 w-3.5" aria-hidden="true" />
                      {path.steps.length} steps
                    </span>
                  </div>
                  <ol className="space-y-1.5 mb-4">
                    {path.steps.map((step, i) => (
                      <li key={i} className="flex gap-2 text-xs text-gray-600 leading-snug">
                        <span className="flex-shrink-0 h-4 w-4 rounded-full bg-[#1A2C5B]/10 text-[#1A2C5B] flex items-center justify-center font-bold text-[10px]">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Education Mission</span>
                    <span className="text-xs font-bold text-[#1A2C5B] group-hover:text-blue-700 flex items-center gap-0.5 transition-colors">
                      Follow Steps <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SchoolFinderPanel />

      {/* â”€â”€â”€ GI Bill Pathfinder (inline, anchor #gi-bill, Smart Bridge receiver) â”€â”€â”€ */}
      <GiBillPanel />

      {/* ─── Education Advisor (AI resource matching) ─── */}
      <section id="edu-advisor" aria-labelledby="edu-advisor-heading" className="py-12 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-1">
            <SparklesIcon className="h-5 w-5 text-[#EAB308]" aria-hidden="true" />
            <h2 id="edu-advisor-heading" className="text-2xl font-extrabold text-[#1A2C5B] tracking-tight">Education Advisor</h2>
          </div>
          <p className="text-sm text-gray-500 mb-8 max-w-xl">
            Tell us your education goal and our AI instantly matches you with VA, scholarship, and state programs from our vetted database.
          </p>
          <EducationAdvisorPanel />
        </div>
      </section>

      {/* ─── Browse Education Resources ─── */}
      <EducationBrowseSection />

      {/* â”€â”€â”€ MOS Translator (Careerâ†’Education flywheel) â”€â”€â”€ */}
      <MOSTranslatorCard />

      {/* â”€â”€â”€ VA Quick Guides â”€â”€â”€ */}
      <section aria-labelledby="edu-guides-heading" className="py-12 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="edu-guides-heading" className="text-2xl font-extrabold text-[#1A2C5B] tracking-tight mb-6">VA Quick Guides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {([
              {
                title: 'How to Apply for GI Bill Benefits',
                desc: 'Confirm eligibility â†’ gather DD-214 â†’ submit VA Form 22-1990 online â†’ deliver Certificate of Eligibility to your school\'s Veterans Certifying Official.',
                href: 'https://www.va.gov/education/how-to-apply/',
                cta: 'Apply on VA.gov',
              },
              {
                title: 'Transfer GI Bill Benefits to Dependents',
                desc: 'Active-duty members with 6+ years of service can transfer unused GI Bill entitlement to a spouse or child â€” requires 4-year service commitment extension.',
                href: 'https://www.va.gov/education/transfer-post-9-11-gi-bill-benefits/',
                cta: 'Transfer Benefits',
              },
            ] as const).map(g => (
              <div key={g.title} className="bg-white rounded-2xl p-5 border border-gray-100">
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

      {/* â”€â”€â”€ Essential Resources â”€â”€â”€ */}
      <section aria-labelledby="edu-essential-heading" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="edu-essential-heading" className="text-2xl font-extrabold text-[#1A2C5B] tracking-tight mb-6">Essential Education Resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {([
              { title: 'VA Education Benefits',   desc: 'Complete guide to all GI Bill chapters, eligibility, and how to apply.',           url: 'https://www.va.gov/education/' },
              { title: 'Student Veterans of America', desc: 'Network of 1,500+ campus chapters providing peer support and advocacy for student vets.', url: 'https://studentveterans.org/' },
              { title: 'Pat Tillman Foundation',  desc: 'Scholarship + leadership network for military and veteran scholars (undergrad through grad).', url: 'https://pattillmanfoundation.org/', phone: '480-621-4074' },
              { title: 'FAFSA for Veterans',       desc: 'Federal student aid â€” veterans may qualify for additional Pell Grants and work-study.', url: 'https://studentaid.gov/apply-for-aid/fafsa/filling-out/military' },
              { title: 'Scholarship America',      desc: 'Largest private scholarship network â€” veteran-specific awards available year-round.',  url: 'https://scholarshipamerica.org/' },
              { title: 'VET TEC Program',          desc: 'VA-funded tech training: coding bootcamps, cybersecurity certs, data science â€” no GI Bill needed.', url: 'https://www.va.gov/education/about-gi-bill-benefits/how-to-use-benefits/vettec-high-tech-program/' },
              { title: 'Hire Heroes USA',          desc: 'Free career coaching and job placement services for transitioning veterans and spouses.', url: 'https://www.hireheroesusa.org/', phone: '1-800-915-4976' },
              { title: 'American Corporate Partners', desc: 'Free mentoring from business professionals to help veterans build civilian careers.',  url: 'https://www.acp-usa.org/' },
            ] as const).map(r => (
              <div key={r.title} className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <h3 className="font-bold text-[#1A2C5B] text-sm mb-1.5">{r.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{r.desc}</p>
                <div className="flex flex-col gap-1">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#1A2C5B] hover:text-blue-700 inline-flex items-center gap-1 focus:outline-none focus:underline transition-colors duration-200">
                    Visit Website <ArrowRightIcon className="h-3 w-3" aria-hidden="true" />
                  </a>
                  {'phone' in r && r.phone && (
                    <a href={`tel:${(r.phone as string).replace(/\D/g, '')}`} className="text-xs font-semibold text-[#B22234] hover:text-red-700 inline-flex items-center gap-1 transition-colors duration-200">
                      {r.phone}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€â”€ Explore Related â”€â”€â”€ */}
      <section aria-labelledby="edu-related-heading" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="edu-related-heading" className="text-2xl font-extrabold text-[#1A2C5B] tracking-tight mb-6 text-center">Explore Related Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/careers" className="group flex flex-col items-center p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label="Career resources for veterans">
              <BriefcaseIcon className="h-10 w-10 text-[#1A2C5B] mb-3 group-hover:scale-110 transition-transform duration-200" aria-hidden="true" />
              <h3 className="text-lg font-extrabold text-[#1A2C5B] mb-1">Careers</h3>
              <p className="text-center text-sm text-gray-500">Jobs, MOS translation, and federal/civilian hiring</p>
            </Link>
            <Link href="/local" className="group flex flex-col items-center p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label="Local veteran-owned businesses">
              <MapIcon className="h-10 w-10 text-[#1A2C5B] mb-3 group-hover:scale-110 transition-transform duration-200" aria-hidden="true" />
              <h3 className="text-lg font-extrabold text-[#1A2C5B] mb-1">Local</h3>
              <p className="text-center text-sm text-gray-500">Find veteran-owned tutoring and education services near you</p>
            </Link>
            <Link href="/health" className="group flex flex-col items-center p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label="Health resources for veterans">
              <HeartIcon className="h-10 w-10 text-[#EAB308] mb-3 group-hover:scale-110 transition-transform duration-200" aria-hidden="true" />
              <h3 className="text-lg font-extrabold text-[#1A2C5B] mb-1">Health</h3>
              <p className="text-center text-sm text-gray-500">Wellness tools, records recon, and VA health programs</p>
            </Link>
          </div>
        </div>
      </section>

      {/* â”€â”€â”€ Auto-Fill Floating Button â”€â”€â”€ */}
      <AutoFillButton context="education" />
    </main>
  );
}
