'use client';

import React, { useState } from 'react';
import {
  HomeModernIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const VA_LOAN_BENEFITS = [
  { title: 'Zero Down Payment', desc: 'No down payment required on most VA loans — save your cash.' },
  { title: 'No PMI', desc: 'Private mortgage insurance is never required, saving $100–$200/month.' },
  { title: 'Competitive Rates', desc: 'VA loans consistently have lower interest rates than conventional loans.' },
  { title: 'No Prepayment Penalty', desc: 'Pay off your loan early with no penalty fees.' },
  { title: 'Reusable Benefit', desc: 'Your VA loan entitlement can be restored and reused multiple times.' },
  { title: 'Streamline Refinance (IRRRL)', desc: 'Refinance your VA loan with minimal paperwork and no appraisal required.' },
];

const RERN_AGENTS = [
  {
    id: 'gg-001',
    name: 'Delta Realty Group',
    title: 'VA Loan Specialist & Realtor Team',
    city: 'Tampa, FL',
    phone: '813-555-0558',
    specialty: 'PCS Relocation + VA Purchase',
    closings: '800+',
    badge: 'VABP Certified',
    highlight: 'Buyer rebate program for VA loan clients',
  },
  {
    id: 'gg-002',
    name: 'Liberty Home VA Loans',
    title: 'VA Mortgage Broker',
    city: 'Los Angeles, CA',
    phone: '310-555-0287',
    specialty: 'VA Purchase + IRRRL Refinance',
    closings: '500+',
    badge: 'No Origination Fee',
    highlight: 'No lender origination fee — saving veterans $2,000–$5,000',
  },
  {
    id: 'gg-003',
    name: 'Forward March Real Estate',
    title: 'Military Relocation Expert',
    city: 'Charlotte, NC',
    phone: '704-555-0942',
    specialty: 'Military PCS & BAH-Savvy Buying',
    closings: '400+',
    badge: 'Military Spouse Owned',
    highlight: 'Buyer rebate up to $1,500 on VA loan purchases',
  },
];

interface BAHCalcState {
  monthlyBAH: string;
  rate: string;
}

function QuickBAHCalc() {
  const [vals, setVals] = useState<BAHCalcState>({ monthlyBAH: '', rate: '' });
  const [result, setResult] = useState<{ maxLoan: number; monthlyPayment: number } | null>(null);

  function calculate() {
    const bah = parseFloat(vals.monthlyBAH);
    const rate = parseFloat(vals.rate) / 100 / 12;
    if (!bah || !rate || bah <= 0 || rate <= 0) return;
    const n = 360; // 30-year
    const payment = bah * 0.85;
    const maxLoan = payment * (1 - Math.pow(1 + rate, -n)) / rate;
    setResult({ maxLoan: Math.round(maxLoan), monthlyPayment: Math.round(payment) });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <CurrencyDollarIcon className="h-5 w-5 text-[#EAB308]" aria-hidden="true" />
        <h3 className="text-base font-extrabold text-[#1A2C5B]">BAH Home-Buying Power Calculator</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
        Estimate how much home your BAH can cover. Rule of thumb: keep monthly mortgage at 85% of BAH.
      </p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label htmlFor="bah-monthly" className="block text-xs font-semibold text-gray-500 mb-1.5">
            Monthly BAH ($)
          </label>
          <input
            id="bah-monthly"
            type="number"
            placeholder="e.g. 2400"
            value={vals.monthlyBAH}
            onChange={e => setVals(v => ({ ...v, monthlyBAH: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label htmlFor="bah-rate" className="block text-xs font-semibold text-gray-500 mb-1.5">
            Interest Rate (%)
          </label>
          <input
            id="bah-rate"
            type="number"
            placeholder="e.g. 6.25"
            step="0.01"
            value={vals.rate}
            onChange={e => setVals(v => ({ ...v, rate: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>
      <button
        onClick={calculate}
        className="w-full py-2.5 rounded-xl bg-[#1A2C5B] text-white text-sm font-bold hover:bg-[#2d4d99] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        Calculate
      </button>
      {result && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-xs text-blue-600 font-semibold mb-0.5">Estimated Max Loan</p>
            <p className="text-lg font-extrabold text-[#1A2C5B]">${result.maxLoan.toLocaleString()}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-xs text-emerald-600 font-semibold mb-0.5">Target Payment</p>
            <p className="text-lg font-extrabold text-emerald-700">${result.monthlyPayment.toLocaleString()}/mo</p>
          </div>
        </div>
      )}
      <p className="mt-2 text-[10px] text-gray-400 leading-relaxed">
        Estimate only. Actual loan amount depends on credit, DTI, and lender terms. Consult a VA-certified lender.
      </p>
    </div>
  );
}

export default function RealEstatePanel() {
  return (
    <section
      id="real-estate"
      aria-labelledby="real-estate-heading"
      className="py-14 bg-gradient-to-br from-[#0F1D3D] via-[#1A2C5B] to-[#1e3a7a] border-t border-[#1A2C5B]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-[#EAB308]/20 flex items-center justify-center">
            <HomeModernIcon className="h-5 w-5 text-[#EAB308]" aria-hidden="true" />
          </div>
          <div>
            <h2 id="real-estate-heading" className="text-2xl font-extrabold text-white tracking-tight">
              VA Home Loan &amp; Real Estate
            </h2>
            <p className="text-sm text-white/60">Zero-down buying power — connect with veteran-owned VA loan experts</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: VA Loan Benefits */}
          <div className="lg:col-span-1">
            <h3 className="text-sm font-extrabold text-[#EAB308] uppercase tracking-widest mb-4">Your VA Loan Benefits</h3>
            <ul className="space-y-3">
              {VA_LOAN_BENEFITS.map(b => (
                <li key={b.title} className="flex gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-white">{b.title}</p>
                    <p className="text-xs text-white/60 leading-relaxed">{b.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-5 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <div className="flex items-start gap-2">
                <InformationCircleIcon className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-xs text-amber-200 leading-relaxed">
                  VA funding fee applies (0.5–3.3% of loan amount). Veterans with service-connected disabilities rated 10%+ are exempt.
                </p>
              </div>
            </div>
          </div>

          {/* Middle: BAH Calculator */}
          <div className="lg:col-span-1">
            <h3 className="text-sm font-extrabold text-[#EAB308] uppercase tracking-widest mb-4">BAH Calculator</h3>
            <QuickBAHCalc />
            <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-start gap-2">
                <ShieldCheckIcon className="h-4 w-4 text-white/50 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-xs text-white/50 leading-relaxed">
                  <strong className="text-white/70">RESPA Disclosure:</strong> Vet1Stop may receive referral fees from partner lenders. This calculator is for informational purposes only and does not constitute a loan offer or commitment to lend. Always compare rates from multiple lenders.
                </p>
              </div>
            </div>
          </div>

          {/* Right: RERN Agent Cards */}
          <div className="lg:col-span-1">
            <h3 className="text-sm font-extrabold text-[#EAB308] uppercase tracking-widest mb-4">Veteran VA Loan Partners</h3>
            <div className="space-y-3">
              {RERN_AGENTS.map(agent => (
                <div
                  key={agent.id}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-4 hover:bg-white/15 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-sm font-extrabold text-white">{agent.name}</h4>
                      <p className="text-xs text-white/60">{agent.title} · {agent.city}</p>
                    </div>
                    <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                      {agent.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#EAB308] font-semibold mb-1">{agent.specialty}</p>
                  <p className="text-xs text-white/50 mb-3">{agent.closings} VA closings · {agent.highlight}</p>
                  <a
                    href={`tel:${agent.phone.replace(/\D/g, '')}`}
                    className="flex items-center gap-2 w-full py-2 px-4 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 justify-center"
                    aria-label={`Call ${agent.name}`}
                  >
                    <PhoneIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    {agent.phone}
                  </a>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <a
                href="https://www.benefits.va.gov/homeloans/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-[#EAB308] text-[#0F1D3D] text-sm font-extrabold hover:bg-[#FACC15] transition-colors focus:outline-none focus:ring-4 focus:ring-yellow-300"
              >
                Learn More on VA.gov
                <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
