'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  HomeModernIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  StarIcon,
  GlobeAmericasIcon,
  MagnifyingGlassIcon,
  LinkIcon,
  KeyIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

import AgentCard from '../components/AgentCard';
import BAHCalculator from '../components/BAHCalculator';
import VABenefitsGrid from '../components/VABenefitsGrid';
import LeadCaptureForm from '../components/LeadCaptureForm';
import {
  RERN_AGENTS,
  filterAgents,
  SPECIALTIES,
  AGENT_STATES,
} from '@/data/agents';

/* ------------------------------------------------------------------ */
/*  Section: Breadcrumb                                                */
/* ------------------------------------------------------------------ */
function Breadcrumb() {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
            <Link href="/" className="text-gray-500 hover:text-[#1A2C5B] transition-colors">
              Home
            </Link>
            <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
            <Link href="/local" className="text-gray-500 hover:text-[#1A2C5B] transition-colors">
              Local
            </Link>
            <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
            <span className="text-[#1A2C5B] font-semibold">Home Base</span>
          </nav>
          <Link
            href="/local"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1A2C5B] transition-colors"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Back to Local Hub
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Hero                                                      */
/* ------------------------------------------------------------------ */
function Hero() {
  const agentCount = RERN_AGENTS.length;

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  const stats = [
    { label: '$0 Down Payment', icon: CurrencyDollarIcon, rotate: '-rotate-3' },
    { label: 'No PMI Required', icon: ShieldCheckIcon, rotate: 'rotate-2' },
    { label: `${agentCount}+ VA Specialists`, icon: UserGroupIcon, rotate: '-rotate-1' },
  ];

  return (
    <section className="relative bg-gradient-to-br from-[#0F1D3D] via-[#1A2C5B] to-[#1e3a7a] overflow-hidden">
      {/* Background decoration */}
      <HomeModernIcon
        className="absolute right-0 top-1/2 -translate-y-1/2 h-[500px] w-[500px] text-white/[0.03] pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — text */}
          <div className="relative z-10">
            <span className="inline-block border border-[#EAB308] text-[#EAB308] rounded-full px-4 py-1 text-sm font-semibold mb-6">
              RERN — Real Estate Referral Network
            </span>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-6">
              Your Mission Doesn&apos;t End at the Front Door
            </h1>

            <p className="text-lg text-blue-100 leading-relaxed mb-8 max-w-xl">
              We connect transitioning veterans with VA loan specialists who&apos;ve
              earned their stripes. Zero down payment. No PMI. Agents who get it.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => scrollTo('agents')}
                className="px-6 py-3 rounded-xl bg-[#EAB308] text-[#0F1D3D] text-sm font-extrabold hover:bg-[#FACC15] transition-colors focus:outline-none focus:ring-4 focus:ring-yellow-300"
              >
                Find Your Agent
              </button>
              <button
                onClick={() => scrollTo('calculator')}
                className="px-6 py-3 rounded-xl border-2 border-white text-white text-sm font-bold hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                Calculate Your BAH
              </button>
            </div>
          </div>

          {/* Right — floating stat cards */}
          <div className="hidden lg:flex flex-col items-center gap-5 relative z-10">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-6 py-4 flex items-center gap-4 ${stat.rotate} hover:rotate-0 transition-transform`}
                >
                  <div className="h-10 w-10 rounded-xl bg-[#EAB308]/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-[#EAB308]" aria-hidden="true" />
                  </div>
                  <span className="text-white font-bold text-lg">{stat.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Trust Bar                                                 */
/* ------------------------------------------------------------------ */
function TrustBar() {
  const signals = [
    { label: 'RESPA Compliant', icon: ShieldCheckIcon },
    { label: 'Licensed Referral Network', icon: BuildingOfficeIcon },
    { label: 'Veteran-Owned Platform', icon: StarIcon },
    { label: '50-State Coverage', icon: GlobeAmericasIcon },
  ];

  return (
    <section className="bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {signals.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center justify-center gap-2.5">
                <Icon className="h-5 w-5 text-[#1A2C5B] flex-shrink-0" aria-hidden="true" />
                <span className="text-sm font-semibold text-[#1A2C5B]">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: VA Benefits                                               */
/* ------------------------------------------------------------------ */
function BenefitsSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A2C5B] mb-3">
            Why VA Loans Are Your Superpower
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            You earned this benefit. Here&apos;s what it means for your wallet.
          </p>
        </div>
        <VABenefitsGrid />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Agent Directory                                           */
/* ------------------------------------------------------------------ */
function AgentDirectory() {
  const [stateFilter, setStateFilter] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [veteranOnly, setVeteranOnly] = useState(false);
  const [waitlistZip, setWaitlistZip] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  const filtered = useMemo(
    () =>
      filterAgents({
        stateCode: stateFilter || undefined,
        specialty: specialtyFilter || undefined,
        isVeteran: veteranOnly || undefined,
      }),
    [stateFilter, specialtyFilter, veteranOnly]
  );

  return (
    <section id="agents" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A2C5B] mb-3">
            Meet Your VA Loan Specialists
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Every agent in our network is vetted, VA-certified, and committed to
            serving veterans.
          </p>
        </div>

        {/* Filter row */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[140px]">
              <label htmlFor="filter-state" className="sr-only">
                Filter by state
              </label>
              <select
                id="filter-state"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A2C5B]"
              >
                <option value="">All States</option>
                {AGENT_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[180px]">
              <label htmlFor="filter-specialty" className="sr-only">
                Filter by specialty
              </label>
              <select
                id="filter-specialty"
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A2C5B]"
              >
                <option value="">All Specialties</option>
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={veteranOnly}
                onChange={(e) => setVeteranOnly(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#1A2C5B] focus:ring-[#1A2C5B]"
              />
              <span className="text-sm font-medium text-gray-700">
                Veteran Agents Only
              </span>
            </label>

            <span className="text-sm text-gray-500 ml-auto">
              Showing{' '}
              <strong className="text-[#1A2C5B]">{filtered.length}</strong> of{' '}
              {RERN_AGENTS.length} agents
            </span>
          </div>
        </div>

        {/* Agent grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <MagnifyingGlassIcon
              className="h-12 w-12 text-gray-300 mx-auto mb-4"
              aria-hidden="true"
            />
            <h3 className="text-lg font-bold text-gray-700 mb-2">
              No agents match your filters
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              We&apos;re growing fast — check back soon or tell us where you
              need coverage.
            </p>
            {!waitlistSubmitted ? (
              <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
                <input
                  type="text"
                  value={waitlistZip}
                  onChange={(e) => setWaitlistZip(e.target.value)}
                  placeholder="Enter your zip code"
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A2C5B]"
                />
                <button
                  onClick={() => {
                    if (waitlistZip.trim()) setWaitlistSubmitted(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#1A2C5B] text-white text-sm font-bold hover:bg-[#2d4d99] transition-colors"
                >
                  Notify Me
                </button>
              </div>
            ) : (
              <p className="text-emerald-600 font-semibold text-sm">
                Thanks! We&apos;ll notify you when agents are available in your area.
              </p>
            )}
          </div>
        )}

        {/* RESPA notice */}
        <div className="mt-8 flex items-start gap-2 max-w-2xl mx-auto">
          <ShieldCheckIcon
            className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-xs text-gray-400 leading-relaxed">
            <strong className="text-gray-500">RESPA Disclosure:</strong> Vet1Stop
            is a licensed referral network. We may receive referral compensation
            from agents. All agents are independently licensed. Your choice of
            agent is entirely voluntary.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: BAH Calculator                                            */
/* ------------------------------------------------------------------ */
function CalculatorSection() {
  return (
    <section
      id="calculator"
      className="py-16 bg-gradient-to-br from-[#0F1D3D] via-[#1A2C5B] to-[#1e3a7a]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            What Can Your BAH Afford?
          </h2>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Use your Basic Allowance for Housing to estimate your VA loan buying
            power.
          </p>
        </div>
        <BAHCalculator />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: How It Works                                              */
/* ------------------------------------------------------------------ */
function HowItWorks() {
  const steps = [
    {
      num: 1,
      title: 'Browse',
      description:
        'Explore our network of VA-certified agents by location and specialty.',
      icon: MagnifyingGlassIcon,
    },
    {
      num: 2,
      title: 'Connect',
      description:
        'Tell us about your home goals. We match you with the right agent.',
      icon: LinkIcon,
    },
    {
      num: 3,
      title: 'Close',
      description:
        'Your agent handles everything — from pre-approval to closing day.',
      icon: KeyIcon,
    },
    {
      num: 4,
      title: 'Move In',
      description:
        'Welcome home. Your VA benefit just changed your life.',
      icon: HomeModernIcon,
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A2C5B] mb-3">
            From Browsing to Keys in 4 Steps
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="relative text-center">
                {/* Connector line (desktop only) */}
                {i < steps.length - 1 && (
                  <div
                    className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] border-t-2 border-dashed border-gray-200"
                    aria-hidden="true"
                  />
                )}

                {/* Step circle */}
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#1A2C5B] text-white mb-4 relative z-10">
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </div>

                {/* Step number */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-[#EAB308] text-[#0F1D3D] text-xs font-extrabold flex items-center justify-center z-20">
                  {step.num}
                </div>

                <h3 className="text-lg font-bold text-[#1A2C5B] mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Lead Capture CTA                                          */
/* ------------------------------------------------------------------ */
function LeadCaptureSection() {
  return (
    <section
      id="get-started"
      className="py-16 bg-gradient-to-br from-[#1A2C5B] to-[#0F1D3D]"
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Ready to Find Your Agent?
          </h2>
          <p className="text-blue-100 text-lg">
            Tell us about your goals and we&apos;ll connect you with a VA
            specialist in your area.
          </p>
        </div>
        <LeadCaptureForm />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: For Agents CTA                                            */
/* ------------------------------------------------------------------ */
function ForAgentsCTA() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-l-4 border-[#1A2C5B] bg-gray-50 rounded-r-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-[#1A2C5B] mb-2">
              Are You a VA Loan Specialist?
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-1">
              Join our referral network and receive pre-qualified veteran buyers
              at zero cost.
            </p>
            <p className="text-xs text-gray-400">
              Currently onboarding agents in PA, TX, FL, NC, VA, CA, GA, CO.
            </p>
          </div>
          <a
            href="mailto:partners@vet1stop.com?subject=RERN Agent Application"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1A2C5B] text-white text-sm font-bold hover:bg-[#2d4d99] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 flex-shrink-0"
          >
            <EnvelopeIcon className="h-4 w-4" aria-hidden="true" />
            Apply to Join
          </a>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Client Component                                              */
/* ------------------------------------------------------------------ */
export default function HomeBaseClient() {
  return (
    <main>
      <Breadcrumb />
      <Hero />
      <TrustBar />
      <BenefitsSection />
      <AgentDirectory />
      <CalculatorSection />
      <HowItWorks />
      <LeadCaptureSection />
      <ForAgentsCTA />
    </main>
  );
}
