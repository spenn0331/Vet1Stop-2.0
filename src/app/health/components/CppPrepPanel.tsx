'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronRightIcon,
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentArrowDownIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { PhoneIcon as PhoneIconSolid, CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { BRIDGE_STORAGE_KEY } from '@/types/records-recon';
import type { BridgeData } from '@/types/records-recon';

// ─── Types ──────────────────────────────────────────────────────────────────

interface CppQuestion {
  question:  string;
  tip:       string;
  doNotSay:  string;
}

interface ConditionPrep {
  condition:  string;
  questions:  CppQuestion[] | null;
  loading:    boolean;
  error:      string | null;
  expanded:   boolean;
}

interface RolePlayState {
  conditionIdx: number;
  questionIdx:  number;
  answer:       string;
  feedback:     string | null;
  improvedAngle: string | null;
  rating:       'good' | 'needs-work' | 'incomplete' | null;
  loading:      boolean;
}

const CHECKLIST_ITEMS = [
  { id: 'records',    label: 'Bring copies of all relevant medical records and buddy statements' },
  { id: 'buddy',     label: 'Have a buddy statement ready if your condition affects daily life' },
  { id: 'nexus',     label: 'Request a nexus letter from your VA provider linking condition to service' },
  { id: 'describe',  label: 'Describe your worst-day symptoms, not your average day' },
  { id: 'frequency', label: 'Know the frequency, duration, and severity of your symptoms' },
  { id: 'impact',    label: 'Document how condition affects work, relationships, and daily activities' },
  { id: 'meds',      label: 'List all current medications and side effects' },
  { id: 'dress',     label: 'Dress comfortably — avoid looking "too healthy" (wear normal daily clothes)' },
  { id: 'honest',    label: 'Be honest — do not exaggerate, but do not minimize your real symptoms' },
  { id: 'vso',       label: 'Consult an accredited VSO before and after the exam' },
];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CppPrepPanel() {
  const [conditions,   setConditions]   = useState<ConditionPrep[]>([]);
  const [newCondition, setNewCondition] = useState('');
  const [bridgeLoaded, setBridgeLoaded] = useState(false);
  const [isHydrated,   setIsHydrated]   = useState(false);
  const [checklist,    setChecklist]    = useState<Record<string, boolean>>({});
  const [rolePlay,     setRolePlay]     = useState<RolePlayState | null>(null);
  const rolePlayRef = useRef<HTMLDivElement>(null);

  // ── Smart Bridge Receiver ────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BRIDGE_STORAGE_KEY);
      if (raw) {
        const parsed: BridgeData = JSON.parse(raw);
        if (parsed?.conditions?.length > 0) {
          const bridgeConditions: ConditionPrep[] = parsed.conditions.slice(0, 8).map(c => ({
            condition: c.condition,
            questions: null,
            loading:   false,
            error:     null,
            expanded:  false,
          }));
          setConditions(bridgeConditions);
          setBridgeLoaded(true);
        }
      }
    } catch { /* ignore */ }
    setIsHydrated(true);
  }, []);

  // ── Add condition ────────────────────────────────────────────────────────
  const handleAddCondition = useCallback(() => {
    const trimmed = newCondition.trim();
    if (!trimmed || conditions.some(c => c.condition.toLowerCase() === trimmed.toLowerCase())) return;
    setConditions(prev => [...prev, {
      condition: trimmed,
      questions: null,
      loading:   false,
      error:     null,
      expanded:  false,
    }]);
    setNewCondition('');
  }, [newCondition, conditions]);

  const handleRemoveCondition = useCallback((idx: number) => {
    setConditions(prev => prev.filter((_, i) => i !== idx));
  }, []);

  // ── Load questions for a condition ───────────────────────────────────────
  const handleLoadQuestions = useCallback(async (idx: number) => {
    const cond = conditions[idx];
    if (!cond || cond.loading) return;

    if (cond.questions) {
      setConditions(prev => prev.map((c, i) => i === idx ? { ...c, expanded: !c.expanded } : c));
      return;
    }

    // [PREMIUM: cpp_prep_unlimited] Free tier: 3 AI sessions/day. Premium: unlimited.
    setConditions(prev => prev.map((c, i) => i === idx ? { ...c, loading: true, expanded: true, error: null } : c));

    try {
      const res = await fetch('/api/health/cpp-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition: cond.condition, mode: 'questions' }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setConditions(prev => prev.map((c, i) =>
        i === idx ? { ...c, loading: false, questions: data.questions ?? [], expanded: true } : c
      ));
    } catch (err) {
      setConditions(prev => prev.map((c, i) =>
        i === idx ? { ...c, loading: false, error: 'Could not load questions. Please try again.', expanded: true } : c
      ));
    }
  }, [conditions]);

  // ── Role-Play ─────────────────────────────────────────────────────────────
  const startRolePlay = useCallback((conditionIdx: number, questionIdx: number) => {
    setRolePlay({ conditionIdx, questionIdx, answer: '', feedback: null, improvedAngle: null, rating: null, loading: false });
    setTimeout(() => rolePlayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  }, []);

  // [PREMIUM: cpp_prep_unlimited] Feedback calls count toward daily session limit.
  const handleGetFeedback = useCallback(async () => {
    if (!rolePlay || !rolePlay.answer.trim()) return;
    const cond = conditions[rolePlay.conditionIdx];
    const q    = cond?.questions?.[rolePlay.questionIdx];
    if (!cond || !q) return;

    setRolePlay(prev => prev ? { ...prev, loading: true, feedback: null, improvedAngle: null, rating: null } : null);

    try {
      const res = await fetch('/api/health/cpp-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition: cond.condition, mode: 'feedback', answer: rolePlay.answer }),
      });
      const data = await res.json();
      setRolePlay(prev => prev ? {
        ...prev,
        loading:       false,
        feedback:      data.feedback ?? '',
        improvedAngle: data.improvedAngle ?? '',
        rating:        data.rating ?? 'needs-work',
      } : null);
    } catch {
      setRolePlay(prev => prev ? { ...prev, loading: false, feedback: 'Could not get feedback. Please try again.' } : null);
    }
  }, [rolePlay, conditions]);

  // [PREMIUM: cpp_prep_unlimited] Prep sheet PDF export included in unlimited tier.
  // ── PDF Download ──────────────────────────────────────────────────────────
  const handleDownloadPDF = useCallback(async () => {
    const { jsPDF } = await import('jspdf');
    const doc    = new jsPDF({ unit: 'pt', format: 'letter' });
    const date   = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const pageW  = doc.internal.pageSize.getWidth();
    const margin = 54;
    const maxW   = pageW - margin * 2;
    let y = 60;

    const write = (text: string, opts: { size?: number; bold?: boolean; color?: [number,number,number] } = {}) => {
      doc.setFontSize(opts.size ?? 11);
      doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
      doc.setTextColor(...(opts.color ?? [30, 30, 30] as [number,number,number]));
      const lines = doc.splitTextToSize(text, maxW);
      if (y + lines.length * (opts.size ?? 11) * 1.4 > doc.internal.pageSize.getHeight() - 60) {
        doc.addPage(); y = 60;
      }
      doc.text(lines, margin, y);
      y += lines.length * (opts.size ?? 11) * 1.4;
    };

    const gap = (h = 12) => { y += h; };

    // Cover
    doc.setFillColor(26, 44, 91);
    doc.rect(0, 0, pageW, 50, 'F');
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.setTextColor(234, 179, 8);
    doc.text('Vet1Stop — C&P Exam Prep Sheet', margin, 33);
    y = 68;
    write(date, { size: 9, color: [130, 130, 130] });
    gap(4);
    write('DISCLAIMER: Educational practice tool only. Not official VA guidance. Not claims assistance. Consult an accredited VSO for all claims-related matters.', { size: 8, color: [150, 80, 80] });
    gap(16);

    // Conditions & Questions
    conditions.forEach((cond, ci) => {
      write(`${ci + 1}. ${cond.condition}`, { size: 14, bold: true });
      gap(4);

      if (cond.questions?.length) {
        cond.questions.forEach((q, qi) => {
          write(`Q${qi + 1}: ${q.question}`, { size: 11, bold: true });
          gap(2);
          write(`Tip: ${q.tip}`, { size: 10 });
          gap(1);
          write(`Avoid: ${q.doNotSay}`, { size: 10, color: [160, 60, 60] });
          gap(10);
        });
      } else {
        write('Questions not yet loaded for this condition.', { size: 10, color: [130, 130, 130] });
        gap(10);
      }
    });

    // Checklist
    gap(6);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageW - margin, y);
    gap(12);
    write('Exam Day Checklist', { size: 14, bold: true });
    gap(6);
    CHECKLIST_ITEMS.forEach(item => {
      if (y + 16 > doc.internal.pageSize.getHeight() - 60) { doc.addPage(); y = 60; }
      const isChecked = !!checklist[item.id];
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.6);
      doc.rect(margin, y - 8.5, 9, 9, 'S');
      if (isChecked) {
        doc.setDrawColor(22, 163, 74);
        doc.setLineWidth(1.2);
        doc.line(margin + 1.5, y - 3.5, margin + 3.5, y - 1.5);
        doc.line(margin + 3.5, y - 1.5, margin + 7.5, y - 7.5);
      }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...(isChecked ? [160, 160, 160] as [number,number,number] : [40, 40, 40] as [number,number,number]));
      const clLines = doc.splitTextToSize(item.label, maxW - 16) as string[];
      doc.text(clLines, margin + 14, y);
      y += clLines.length * 14 + 2;
    });

    doc.save(`vet1stop-cpp-prep-${date.replace(/,?\s+/g, '-')}.pdf`);
  }, [conditions, checklist]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A2C5B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-1 text-sm text-gray-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#1A2C5B] transition-colors">Home</Link>
            <ChevronRightIcon className="h-3 w-3" />
            <Link href="/health" className="hover:text-[#1A2C5B] transition-colors">Health</Link>
            <ChevronRightIcon className="h-3 w-3" />
            <span className="text-[#1A2C5B] font-medium">C&amp;P Exam Prep</span>
          </nav>
          <a href="tel:988" className="hidden sm:flex items-center gap-1.5 text-xs text-[#B22234] font-semibold hover:text-red-700 transition-colors">
            <PhoneIconSolid className="h-3.5 w-3.5" />
            988 Crisis Line
          </a>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0F1D3D] via-[#1A4D3A] to-[#14532d] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-xs text-white/70 mb-4">
            <SparklesIcon className="h-3.5 w-3.5" aria-hidden="true" />
            AI-generated practice questions
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">C&amp;P Exam Prep</h1>
          <p className="text-white/70 max-w-xl text-sm md:text-base leading-relaxed">
            Practice your Compensation &amp; Pension exam with personalized AI questions for each condition — role-play your answers and download a prep sheet.
          </p>
          {bridgeLoaded && (
            <div className="mt-5 inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white/80">
              <CheckCircleSolid className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              {conditions.length} condition{conditions.length !== 1 ? 's' : ''} loaded from Records Recon
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Main: Conditions + Questions ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Add Condition */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-base font-extrabold text-[#1A2C5B] mb-4">
                {bridgeLoaded ? 'Your Conditions' : 'Enter Your Conditions'}
              </h2>

              {!bridgeLoaded && conditions.length === 0 && (
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  Enter each condition you&rsquo;re claiming so we can generate tailored C&amp;P exam questions.
                  Or{' '}
                  <Link href="/health/records-recon" className="text-[#1A2C5B] font-semibold hover:underline">
                    run Records Recon
                  </Link>{' '}
                  to import conditions automatically.
                </p>
              )}

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newCondition}
                  onChange={e => setNewCondition(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCondition()}
                  placeholder="e.g. PTSD, tinnitus, lumbar radiculopathy…"
                  className="flex-1 text-sm rounded-xl border border-gray-200 px-3 py-2.5 text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  aria-label="Enter a condition to prep for"
                />
                <button
                  onClick={handleAddCondition}
                  disabled={!newCondition.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  aria-label="Add condition"
                >
                  <PlusIcon className="h-4 w-4" aria-hidden="true" />
                  Add
                </button>
              </div>

              {/* Conditions list */}
              {conditions.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-300">
                  No conditions yet — add one above or load from Records Recon
                </div>
              ) : (
                <>
                {conditions.length > 0 && !conditions.some(c => c.questions) && (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 mb-3">
                    <SparklesIcon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                    Click any condition below to generate AI exam questions
                  </div>
                )}
                <div className="space-y-3">
                  {conditions.map((cond, idx) => (
                    <ConditionCard
                      key={`${cond.condition}-${idx}`}
                      cond={cond}
                      idx={idx}
                      onToggle={() => handleLoadQuestions(idx)}
                      onRemove={() => handleRemoveCondition(idx)}
                      onRolePlay={(qi) => startRolePlay(idx, qi)}
                    />
                  ))}
                </div>
                </>
              )}

              {conditions.length > 0 && (
                <button
                  onClick={handleDownloadPDF}
                  className="mt-5 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-emerald-200 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  aria-label="Download full prep sheet as PDF"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" aria-hidden="true" />
                  Download Full Prep Sheet (PDF)
                </button>
              )}
            </div>

            {/* Role-Play Section */}
            {rolePlay !== null && (
              <div ref={rolePlayRef} className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                    <h3 className="text-base font-extrabold text-[#1A2C5B]">Role-Play Practice</h3>
                  </div>
                  <button
                    onClick={() => setRolePlay(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close role-play"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {(() => {
                  const cond = conditions[rolePlay.conditionIdx];
                  const q    = cond?.questions?.[rolePlay.questionIdx];
                  if (!cond || !q) return null;
                  return (
                    <div className="space-y-4">
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1">{cond.condition}</p>
                        <p className="text-sm font-semibold text-gray-800">{q.question}</p>
                      </div>

                      <textarea
                        value={rolePlay.answer}
                        onChange={e => setRolePlay(prev => prev ? { ...prev, answer: e.target.value, feedback: null, rating: null } : null)}
                        placeholder="Type your practice answer here — imagine you're in the exam room…"
                        rows={5}
                        className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-500 resize-none transition-all"
                        aria-label="Your practice answer"
                      />

                      <button
                        onClick={handleGetFeedback}
                        disabled={rolePlay.loading || !rolePlay.answer.trim()}
                        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-emerald-200"
                      >
                        {rolePlay.loading ? (
                          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing your answer…</>
                        ) : (
                          <><SparklesIcon className="h-4 w-4" aria-hidden="true" />Get AI Feedback</>
                        )}
                      </button>

                      {rolePlay.feedback && (
                        <div className={`rounded-xl p-4 border ${
                          rolePlay.rating === 'good' ? 'bg-emerald-50 border-emerald-200' :
                          rolePlay.rating === 'incomplete' ? 'bg-red-50 border-red-200' :
                          'bg-amber-50 border-amber-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              rolePlay.rating === 'good'       ? 'bg-emerald-200 text-emerald-800' :
                              rolePlay.rating === 'incomplete' ? 'bg-red-200 text-red-800' :
                              'bg-amber-200 text-amber-800'
                            }`}>
                              {rolePlay.rating === 'good' ? '✓ Good' : rolePlay.rating === 'incomplete' ? 'Incomplete' : 'Needs Work'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed mb-2">{rolePlay.feedback}</p>
                          {rolePlay.improvedAngle && (
                            <p className="text-xs text-gray-500 border-t border-current/10 pt-2 mt-2">
                              <strong>Consider adding:</strong> {rolePlay.improvedAngle}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* ── Sidebar: Checklist ───────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-base font-extrabold text-[#1A2C5B] mb-1">Exam Day Checklist</h3>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">Check off each item as you prepare</p>
              <div className="space-y-2.5">
                {CHECKLIST_ITEMS.map(item => (
                  <label
                    key={item.id}
                    className="flex items-start gap-2.5 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={!!checklist[item.id]}
                      onChange={e => setChecklist(prev => ({ ...prev, [item.id]: e.target.checked }))}
                      className="mt-0.5 h-3.5 w-3.5 rounded accent-emerald-600 flex-shrink-0"
                      aria-label={item.label}
                    />
                    <span className={`text-xs leading-relaxed transition-colors ${
                      checklist[item.id] ? 'text-gray-400 line-through' : 'text-gray-700 group-hover:text-gray-900'
                    }`}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Progress</span>
                  <span>{Object.values(checklist).filter(Boolean).length} / {CHECKLIST_ITEMS.length}</span>
                </div>
                <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${(Object.values(checklist).filter(Boolean).length / CHECKLIST_ITEMS.length) * 100}%` }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>

            {/* VSO Reminder */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-start gap-2.5">
                <InformationCircleIcon className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold text-amber-800 mb-1">Free VSO Help Available</p>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    DAV, VFW, and American Legion accredited service officers provide free claims assistance. They can review your evidence and accompany you to exams.
                  </p>
                  <a
                    href="https://www.va.gov/decision-reviews/board-appeal/veterans-service-organizations/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-amber-800 hover:underline mt-1.5 block"
                  >
                    Find a VSO near you →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Legal Disclaimer ─────────────────────────────────────────────── */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            <strong className="text-gray-500">Educational practice tool only.</strong> This tool is not official VA guidance and does not constitute claims assistance or legal advice per 38 CFR §14.629–630. Do not fabricate or exaggerate symptoms. Always consult an accredited VSO before and after your C&amp;P exam. If you are in crisis, call{' '}
            <a href="tel:988" className="text-[#B22234] font-bold hover:underline">988 (Press 1)</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Condition Card ───────────────────────────────────────────────────────────

function ConditionCard({
  cond,
  idx,
  onToggle,
  onRemove,
  onRolePlay,
}: {
  cond:      ConditionPrep;
  idx:       number;
  onToggle:  () => void;
  onRemove:  () => void;
  onRolePlay: (qi: number) => void;
}) {
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3.5 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onToggle()}
        aria-expanded={cond.expanded}
        aria-label={`${cond.condition} — ${cond.questions ? 'view questions' : 'load questions'}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-400 tabular-nums w-5">{idx + 1}</span>
          <span className="text-sm font-semibold text-[#1A2C5B]">{cond.condition}</span>
          {cond.questions ? (
            <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full font-semibold">
              {cond.questions.length} questions
            </span>
          ) : !cond.loading && (
            <span className="text-[10px] font-semibold text-white bg-emerald-600 px-2 py-0.5 rounded-full">
              Generate questions →
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {cond.loading && <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin" />}
          <button
            onClick={e => { e.stopPropagation(); onRemove(); }}
            className="text-gray-300 hover:text-red-400 transition-colors p-1"
            aria-label={`Remove ${cond.condition}`}
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
          {cond.expanded
            ? <ChevronUpIcon   className="h-4 w-4 text-gray-400" aria-hidden="true" />
            : <ChevronDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
          }
        </div>
      </div>

      {cond.expanded && (
        <div className="px-4 py-4 space-y-3 bg-white">
          {cond.loading && (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
              <div className="w-4 h-4 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
              Generating questions for {cond.condition}…
            </div>
          )}

          {cond.error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2" role="alert">
              {cond.error}
            </p>
          )}

          {cond.questions?.map((q, qi) => (
            <div key={qi} className="border border-gray-100 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-800 leading-relaxed">{q.question}</p>

              <div className="flex items-start gap-2 text-[11px] text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                <CheckCircleIcon className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{q.tip}</span>
              </div>

              <div className="flex items-start gap-2 text-[11px] text-red-700 bg-red-50 rounded-lg px-3 py-2">
                <XMarkIcon className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span><strong>Avoid:</strong> {q.doNotSay}</span>
              </div>

              <button
                onClick={() => onRolePlay(qi)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1A2C5B] text-white rounded-xl font-bold text-xs hover:bg-[#0F1D3D] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A2C5B]/40"
                aria-label={`Practice answering question ${qi + 1}`}
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4" aria-hidden="true" />
                Practice My Answer
              </button>
            </div>
          ))}

          {!cond.loading && !cond.error && !cond.questions && (
            <button
              onClick={onToggle}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              Load questions →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
