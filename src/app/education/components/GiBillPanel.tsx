// @ts-nocheck
'use client';

/**
 * GiBillPanel.tsx — GI Bill Pathfinder net-income calculator for the Education Hub.
 * Smart Bridge receiver: reads vet1stop_edu_bridge_data from localStorage on mount
 *   and pre-fills tuition + state from School Finder hand-off.
 * All calculations are client-side — zero API cost.
 * Premium gate [PREMIUM: gi_bill_multi_scenario]: free = 1 scenario; premium = 3 scenarios.
 *
 * Key formulas (Post-9/11 GI Bill, Ch. 33 — 2025 rates):
 *   Entitlement % based on months of aggregate active service:
 *     < 6 months served while enrolled: 40%
 *     6–17.9 months: 60%  |  18–23.9 months: 70%  |  24–30.9 months: 80%  |  31–35.9 months: 90%  |  36+ months: 100%
 *   Tuition cap: Public in-state = actual cost. Private/foreign = $28,937.09/yr (2024-25 max).
 *   MHA = BAH E-5 w/dep at school ZIP (proxied by state) × entitlement % × enrollment rate
 *   Book stipend = $1,000/yr prorated by enrollment (FT: $83.33/mo, 3/4: $62.50/mo, 1/2: $41.67/mo)
 *   Monthly GI Bill budget = MHA + stipend − (tuition_shortfall / 12)
 *
 * Montgomery GI Bill (Ch. 30 — 2025 rates):
 *   Full-time flat rate: $2,122/month (does not cover tuition separately)
 *   3/4-time: $1,591/mo  |  1/2-time: $1,061/mo
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  CalculatorIcon,
  ArrowRightIcon,
  DocumentArrowDownIcon,
  SparklesIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { EDU_BRIDGE_KEY } from '@/types/education-bridge';
import type { EduBridgeData } from '@/types/education-bridge';
import { getBAHAmount, ALL_BAH_STATES } from '@/data/bah-rates';
import { useFreeTierUsage } from '@/lib/useFreeTierUsage';
import { isPremium } from '@/lib/premium';

const DEV_UNLOCKED = process.env.NEXT_PUBLIC_DEV_PREMIUM === 'true';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIVATE_TUITION_CAP = 28937;    // 2024–25 max for private / foreign schools
const BOOK_STIPEND_FT     = 83.33;    // $1,000/yr ÷ 12 months
const BOOK_STIPEND_3Q     = 62.50;    // $750/yr ÷ 12
const BOOK_STIPEND_HT     = 41.67;    // $500/yr ÷ 12

type GIChapter = 'post-9-11' | 'ch-30';
type Enrollment = 'full' | 'three-quarter' | 'half';

interface Scenario {
  id:         number;
  label:      string;
  chapter:    GIChapter;
  months:     number;
  withDep:    boolean;
  state:      string;
  tuition:    number;
  isPrivate:  boolean;
  enrollment: Enrollment;
}

interface CalcResult {
  entitlementPct:      number;
  tuitionCovered:      number;
  tuitionOop:          number;
  monthlyMHA:          number;
  monthlyStipend:      number;
  monthlyOopPerMonth:  number;
  netMonthlyIncome:    number;
  annualTotal:         number;
  degreeTotal:         number;     // 36-month projection
}

// ─── Calculation Engine ───────────────────────────────────────────────────────

function getEntitlementPct(months: number): number {
  if (months < 6)   return 40;
  if (months < 18)  return 60;
  if (months < 24)  return 70;
  if (months < 31)  return 80;
  if (months < 36)  return 90;
  return 100;
}

function getEnrollmentRate(enrollment: Enrollment): number {
  if (enrollment === 'three-quarter') return 0.75;
  if (enrollment === 'half')          return 0.5;
  return 1.0;
}

function getBookStipend(enrollment: Enrollment): number {
  if (enrollment === 'three-quarter') return BOOK_STIPEND_3Q;
  if (enrollment === 'half')          return BOOK_STIPEND_HT;
  return BOOK_STIPEND_FT;
}

function calcCh30(enrollment: Enrollment): CalcResult {
  const rate = enrollment === 'full' ? 2122 : enrollment === 'three-quarter' ? 1591 : 1061;
  return {
    entitlementPct:      100,
    tuitionCovered:      0,          // Ch30 does not pay tuition separately
    tuitionOop:          0,          // veteran pays tuition from Ch30 stipend
    monthlyMHA:          rate,
    monthlyStipend:      0,
    monthlyOopPerMonth:  0,
    netMonthlyIncome:    rate,
    annualTotal:         rate * 12,
    degreeTotal:         rate * 36,
  };
}

function calcPost911(s: Scenario): CalcResult {
  const pct        = getEntitlementPct(s.months) / 100;
  const enrollRate = getEnrollmentRate(s.enrollment);
  const bahBase    = getBAHAmount(s.state);

  // Tuition coverage
  const annualCap  = s.isPrivate ? PRIVATE_TUITION_CAP : s.tuition; // public = actual cost
  const covered    = Math.min(s.tuition, annualCap * pct);
  const oop        = Math.max(0, s.tuition - covered);

  // Monthly housing allowance
  const mha = Math.round(bahBase * pct * enrollRate);

  // Book stipend
  const stipend = getBookStipend(s.enrollment) * pct;

  // Net monthly
  const oopPerMonth = oop / 12;
  const net = Math.max(0, mha + stipend - oopPerMonth);

  return {
    entitlementPct:      Math.round(pct * 100),
    tuitionCovered:      Math.round(covered),
    tuitionOop:          Math.round(oop),
    monthlyMHA:          mha,
    monthlyStipend:      Math.round(stipend),
    monthlyOopPerMonth:  Math.round(oopPerMonth),
    netMonthlyIncome:    Math.round(net),
    annualTotal:         Math.round(net * 12),
    degreeTotal:         Math.round(net * 36),
  };
}

function calculate(s: Scenario): CalcResult {
  return s.chapter === 'ch-30' ? calcCh30(s.enrollment) : calcPost911(s);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
      <InformationCircleIcon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
      {text}
    </span>
  );
}

function ResultCard({ result, label, schoolState }: { result: CalcResult; label: string; schoolState: string }) {
  const isPositive = result.netMonthlyIncome > 0;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Highlight header */}
      <div className={`px-5 py-4 ${isPositive ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gray-400'}`}>
        <p className="text-xs font-semibold text-white/80 mb-1">{label}</p>
        <p className="text-3xl font-extrabold text-white tabular-nums">
          ${result.netMonthlyIncome.toLocaleString()}
          <span className="text-base font-normal text-white/70">/month</span>
        </p>
        <p className="text-xs text-white/70 mt-1">estimated net monthly income</p>
      </div>

      {/* Breakdown */}
      <div className="px-5 py-4 space-y-2.5">
        {result.entitlementPct < 100 && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Entitlement Level</span>
            <span className="font-bold text-amber-600">{result.entitlementPct}%</span>
          </div>
        )}
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">Monthly Housing (BAH {schoolState})</span>
          <span className="font-semibold text-[#1A2C5B]">+${result.monthlyMHA.toLocaleString()}</span>
        </div>
        {result.monthlyStipend > 0 && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Book Stipend</span>
            <span className="font-semibold text-[#1A2C5B]">+${result.monthlyStipend}/mo</span>
          </div>
        )}
        {result.monthlyOopPerMonth > 0 && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Tuition Out-of-Pocket</span>
            <span className="font-semibold text-red-500">−${result.monthlyOopPerMonth}/mo</span>
          </div>
        )}
        {result.tuitionCovered > 0 && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Tuition Covered by VA</span>
            <span className="font-semibold text-emerald-600">${result.tuitionCovered.toLocaleString()}/yr</span>
          </div>
        )}
        <div className="pt-2 border-t border-gray-100 space-y-1.5">
          <div className="flex justify-between items-center text-sm font-bold">
            <span className="text-gray-700">Annual Projection</span>
            <span className="text-[#1A2C5B]">${result.annualTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Full Degree (36 months)</span>
            <span className="font-semibold text-[#1A2C5B]">${result.degreeTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Scenario form ────────────────────────────────────────────────────────────

function ScenarioForm({
  scenario,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  scenario: Scenario;
  index:    number;
  onChange: (updated: Scenario) => void;
  onRemove?: () => void;
  canRemove: boolean;
}) {
  function set<K extends keyof Scenario>(key: K, val: Scenario[K]) {
    onChange({ ...scenario, [key]: val });
  }

  const months = scenario.months;
  const pct    = getEntitlementPct(months);
  const pctColor = pct === 100 ? 'text-emerald-600' : pct >= 80 ? 'text-amber-600' : 'text-red-500';

  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 relative">
      {canRemove && onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
          aria-label={`Remove scenario ${index + 1}`}
        >
          <XMarkIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      )}

      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
        {canRemove ? `Scenario ${index + 1}` : 'Your Profile'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* GI Bill Chapter */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">GI Bill Chapter</label>
          <div className="flex gap-2">
            {([
              { val: 'post-9-11', label: 'Post-9/11 (Ch. 33)' },
              { val: 'ch-30',    label: 'Montgomery (Ch. 30)' },
            ] as const).map(opt => (
              <button
                key={opt.val}
                onClick={() => set('chapter', opt.val)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  scenario.chapter === opt.val
                    ? 'bg-[#1A2C5B] text-white border-[#1A2C5B] shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#1A2C5B]'
                }`}
                aria-pressed={scenario.chapter === opt.val}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Enrollment */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Enrollment Status</label>
          <select
            value={scenario.enrollment}
            onChange={e => set('enrollment', e.target.value as Enrollment)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="full">Full-time (≥12 credits)</option>
            <option value="three-quarter">¾-time (9–11 credits)</option>
            <option value="half">½-time (6–8 credits)</option>
          </select>
        </div>

        {/* School State */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">School State (for BAH)</label>
          <select
            value={scenario.state}
            onChange={e => set('state', e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select state…</option>
            {ALL_BAH_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Annual Tuition */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Annual Tuition ($)</label>
          <input
            type="number"
            min={0}
            max={80000}
            step={100}
            value={scenario.tuition || ''}
            onChange={e => set('tuition', Math.max(0, parseInt(e.target.value) || 0))}
            placeholder="e.g. 12000"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* School type */}
        <div className="sm:col-span-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => set('isPrivate', !scenario.isPrivate)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                scenario.isPrivate
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#1A2C5B]'
              }`}
              aria-pressed={scenario.isPrivate}
            >
              {scenario.isPrivate ? <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden="true" /> : <span className="h-3.5 w-3.5 rounded-full border-2 border-current inline-block" />}
              {scenario.isPrivate ? 'Private / Out-of-State' : 'Public In-State'}
            </button>
            <InfoBadge text={scenario.isPrivate ? `Private cap: $${PRIVATE_TUITION_CAP.toLocaleString()}/yr` : 'In-state: full tuition covered'} />
          </div>
        </div>

        {/* Months of service (Post-9/11 only) */}
        {scenario.chapter === 'post-9-11' && (
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-600">
                Active Service Months: <span className="text-[#1A2C5B]">{months} months</span>
              </label>
              <span className={`text-xs font-bold ${pctColor}`}>{pct}% entitlement</span>
            </div>
            <input
              type="range"
              min={0}
              max={42}
              step={1}
              value={months}
              onChange={e => set('months', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#1A2C5B]"
              aria-label="Months of active service"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0 mo (40%)</span>
              <span>6 mo (60%)</span>
              <span>18 mo (70%)</span>
              <span>36+ mo (100%)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const DEFAULT_SCENARIO: Omit<Scenario, 'id' | 'label'> = {
  chapter:    'post-9-11',
  months:     36,
  withDep:    true,
  state:      'Virginia',
  tuition:    12000,
  isPrivate:  false,
  enrollment: 'full',
};

export default function GiBillPanel() {
  const [scenarios, setScenarios] = useState<Scenario[]>([
    { id: 1, label: 'Scenario 1', ...DEFAULT_SCENARIO },
  ]);
  const [bridgeToast, setBridgeToast]   = useState<string | null>(null);
  const [isHydrated,  setIsHydrated]    = useState(false);

  const multiUsage = useFreeTierUsage('gi_bill_multi_scenario', 3);

  // ── Smart Bridge Receiver ─────────────────────────────────────────────────
  useEffect(() => {
    setIsHydrated(true);
    try {
      const raw = localStorage.getItem(EDU_BRIDGE_KEY);
      if (!raw) return;
      const parsed: EduBridgeData = JSON.parse(raw);
      if (!parsed?.school) return;
      const { name, tuition, state } = parsed.school;
      setScenarios(prev => [{
        ...prev[0],
        state:     state || prev[0].state,
        tuition:   tuition || prev[0].tuition,
        isPrivate: tuition > 25000,
      }]);
      setBridgeToast(name);
    } catch { /* invalid payload — fail silently */ }
  }, []);

  const results = scenarios.map(s => calculate(s));

  const handleUpdateScenario = useCallback((index: number, updated: Scenario) => {
    setScenarios(prev => prev.map((s, i) => i === index ? updated : s));
  }, []);

  const handleAddScenario = useCallback(() => {
    if (!DEV_UNLOCKED && !isPremium() && !multiUsage.canUse) return;
    multiUsage.increment();
    setScenarios(prev => {
      if (prev.length >= 3) return prev;
      return [...prev, {
        ...DEFAULT_SCENARIO,
        id:    prev.length + 1,
        label: `Scenario ${prev.length + 1}`,
      }];
    });
  }, [multiUsage]);

  const handleRemoveScenario = useCallback((index: number) => {
    setScenarios(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, id: i + 1, label: `Scenario ${i + 1}` })));
  }, []);

  const handleDownload = useCallback(async () => {
    const { jsPDF } = await import('jspdf');
    const doc  = new jsPDF({ unit: 'pt', format: 'letter' });
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const pageW  = doc.internal.pageSize.getWidth();
    const margin = 60;
    let y = 60;

    // Header
    doc.setFontSize(20); doc.setFont('helvetica', 'bold');
    doc.text('GI Bill Pathfinder Report', margin, y); y += 28;
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Generated ${date} — Vet1Stop.com`, margin, y); y += 20;
    doc.setTextColor(180);
    doc.text('DISCLAIMER: Estimates only. Actual benefits depend on VA eligibility and school-specific rates.', margin, y, { maxWidth: pageW - margin * 2 }); y += 30;

    // Scenarios
    scenarios.forEach((s, i) => {
      const r = results[i];
      doc.setTextColor(0);
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text(s.label + (scenarios.length === 1 ? '' : ` — ${s.state} / $${s.tuition.toLocaleString()}/yr`), margin, y); y += 18;

      const lines = [
        `Chapter: ${s.chapter === 'post-9-11' ? 'Post-9/11 (Ch. 33)' : 'Montgomery (Ch. 30)'}`,
        `Entitlement: ${r.entitlementPct}% | Enrollment: ${s.enrollment}`,
        `Monthly Housing Allowance (MHA): $${r.monthlyMHA.toLocaleString()}`,
        `Book Stipend: $${r.monthlyStipend}/mo`,
        `Tuition Covered: $${r.tuitionCovered.toLocaleString()}/yr | Out-of-Pocket: $${r.tuitionOop.toLocaleString()}/yr`,
        `NET MONTHLY INCOME: $${r.netMonthlyIncome.toLocaleString()}`,
        `Annual Projection: $${r.annualTotal.toLocaleString()} | Full Degree (36 mo): $${r.degreeTotal.toLocaleString()}`,
      ];
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      lines.forEach(line => { doc.text(line, margin, y); y += 16; });
      y += 10;
    });

    y += 10;
    doc.setFontSize(9); doc.setTextColor(150);
    doc.text('Verify at https://www.va.gov/education/about-gi-bill-benefits/', margin, y);

    doc.save(`vet1stop-gibill-plan-${date.replace(/ /g, '-')}.pdf`);
  }, [scenarios, results]);

  if (!isHydrated) {
    return (
      <section id="gi-bill" className="py-14 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A2C5B]" />
        </div>
      </section>
    );
  }

  return (
    <section
      id="gi-bill"
      aria-labelledby="gi-bill-heading"
      className="py-14 bg-slate-50 border-t border-slate-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#1A2C5B] flex items-center justify-center shadow-md">
              <CalculatorIcon className="h-5 w-5 text-[#EAB308]" aria-hidden="true" />
            </div>
            <div>
              <h2 id="gi-bill-heading" className="text-2xl font-extrabold text-[#1A2C5B] tracking-tight">GI Bill Pathfinder</h2>
              <p className="text-sm text-gray-500">Calculate your monthly net income while using your GI Bill</p>
            </div>
          </div>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A2C5B] text-white text-sm font-bold hover:bg-[#0F1D3D] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
            aria-label="Download GI Bill Plan as PDF"
          >
            <DocumentArrowDownIcon className="h-4 w-4" aria-hidden="true" />
            Download My Plan
          </button>
        </div>

        {/* Smart Bridge toast */}
        {bridgeToast && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-center justify-between gap-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
                <ArrowRightIcon className="h-4 w-4 text-white" aria-hidden="true" />
              </div>
              <p className="text-sm text-emerald-800">
                <span className="font-bold">Intel Brief:</span>{' '}
                Pre-filled from School Finder — <span className="font-semibold">{bridgeToast}</span>
              </p>
            </div>
            <button
              onClick={() => setBridgeToast(null)}
              className="p-1.5 text-emerald-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors focus:outline-none"
              aria-label="Dismiss"
            >
              <XMarkIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Layout: forms left, results right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left: scenario forms */}
          <div className="space-y-4">
            {scenarios.map((s, i) => (
              <ScenarioForm
                key={s.id}
                scenario={s}
                index={i}
                onChange={updated => handleUpdateScenario(i, updated)}
                onRemove={scenarios.length > 1 ? () => handleRemoveScenario(i) : undefined}
                canRemove={scenarios.length > 1}
              />
            ))}

            {/* Add scenario — Premium gate */}
            {scenarios.length < 3 && (
              <div>
                {DEV_UNLOCKED || isPremium() ? (
                  <button
                    onClick={handleAddScenario}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-400 hover:border-[#1A2C5B] hover:text-[#1A2C5B] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    + Add Scenario (compare schools)
                  </button>
                ) : (
                  <div className="rounded-xl border border-[#EAB308]/30 bg-amber-50 px-4 py-3 text-center">
                    <SparklesIcon className="h-5 w-5 text-[#EAB308] mx-auto mb-1" aria-hidden="true" />
                    <p className="text-sm font-semibold text-amber-800">Multi-School Comparison</p>
                    <p className="text-xs text-amber-700 mt-0.5 mb-2">Compare up to 3 schools side-by-side — Premium only</p>
                    <a
                      href="/premium"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#EAB308] hover:underline focus:outline-none"
                    >
                      Upgrade to Premium <ArrowRightIcon className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-gray-400 leading-relaxed">
              <strong className="text-gray-500">Estimates only.</strong> Monthly Housing Allowance uses E-5 with dependents BAH for the school&rsquo;s state. Actual amounts depend on VA eligibility, school ZIP, and chapter-specific rules.{' '}
              <a href="https://www.va.gov/education/about-gi-bill-benefits/" target="_blank" rel="noopener noreferrer" className="text-[#1A2C5B] hover:underline font-semibold">Verify on VA.gov</a>.
            </p>
          </div>

          {/* Right: result cards */}
          <div className="space-y-4">
            {scenarios.map((s, i) => (
              <ResultCard
                key={s.id}
                result={results[i]}
                label={scenarios.length === 1 ? 'Your Estimated Monthly Income' : s.label}
                schoolState={s.state || '(select state)'}
              />
            ))}

            {/* Quick VA links */}
            <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 space-y-2.5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Next Steps</p>
              {[
                { label: 'Apply for Post-9/11 GI Bill', href: 'https://www.va.gov/education/apply-for-education-benefits/application/1990/introduction' },
                { label: 'Check GI Bill Remaining Entitlement', href: 'https://www.va.gov/education/gi-bill/post-9-11/ch-33-benefit/' },
                { label: 'Yellow Ribbon School Search', href: 'https://www.va.gov/education/about-gi-bill-benefits/post-9-11/yellow-ribbon-program/find-yellow-ribbon-schools/' },
                { label: 'BAH Calculator (official)', href: 'https://www.defensetravel.dod.mil/site/bahCalc.cfm' },
              ].map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-semibold text-[#1A2C5B] hover:text-blue-700 transition-colors focus:outline-none focus:underline"
                >
                  <ArrowRightIcon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
