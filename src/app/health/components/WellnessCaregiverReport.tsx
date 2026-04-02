// @ts-nocheck
'use client';

import React, { useState, useCallback } from 'react';
import {
  UserGroupIcon,
  DocumentArrowDownIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  XMarkIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

interface WellnessScores {
  mood: number;
  energy: number;
  sleep: number;
  pain: number;
  social: number;
}

interface WellnessEntry {
  date: string;
  scores: WellnessScores;
  notes: string;
  savedAt: string;
}

interface WellnessCaregiverReportProps {
  log: WellnessEntry[];
}

const DIMS: { key: keyof WellnessScores; label: string }[] = [
  { key: 'mood',   label: 'Mood'   },
  { key: 'energy', label: 'Energy' },
  { key: 'sleep',  label: 'Sleep'  },
  { key: 'pain',   label: 'Pain'   },
  { key: 'social', label: 'Social' },
];

// ─── Stat helpers ─────────────────────────────────────────────────────────────

function avg(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function trend(vals: number[]): 'improving' | 'declining' | 'stable' {
  if (vals.length < 4) return 'stable';
  const first = avg(vals.slice(0, Math.ceil(vals.length / 2)));
  const last  = avg(vals.slice(Math.floor(vals.length / 2)));
  if (last - first >  0.5) return 'improving';
  if (first - last >  0.5) return 'declining';
  return 'stable';
}

function trendArrow(t: 'improving' | 'declining' | 'stable'): string {
  return { improving: '↑', declining: '↓', stable: '→' }[t];
}

function buildSummaryText(log: WellnessEntry[], range: 7 | 30): string {
  const recent  = log.slice(-range);
  const now     = new Date();
  const past    = new Date(); past.setDate(now.getDate() - (range - 1));
  const fmt     = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const lines: string[] = [
    `VET1STOP — Personal Wellness Summary`,
    `Period: ${fmt(past)} – ${fmt(now)}  |  Entries: ${recent.length}  |  Scale: 1–10`,
    ``,
    `DIMENSION AVERAGES`,
    ...DIMS.map(({ key, label }) => {
      const vals = recent.map(e => e.scores[key]);
      const a    = avg(vals).toFixed(1);
      const t    = trend(vals);
      return `  ${label.padEnd(8)}: ${a}  ${trendArrow(t)} ${t}`;
    }),
    ``,
    `NOTES EXCERPTS (most recent ${Math.min(recent.length, 5)} entries with notes)`,
    ...recent
      .filter(e => e.notes.trim())
      .slice(-5)
      .reverse()
      .map(e => `  ${e.date}: "${e.notes.slice(0, 100)}${e.notes.length > 100 ? '…' : ''}"`)
    ,
    ``,
    `---`,
    `IMPORTANT DISCLAIMERS`,
    `• This summary is for personal wellness tracking only — it is NOT a medical record.`,
    `• Vet1Stop is not a VSO and does not provide claims assistance or medical advice.`,
    `• All data was recorded privately on the veteran's personal device.`,
    `• For claims assistance, consult an accredited VSO (DAV, VFW, American Legion).`,
    `• Veterans Crisis Line: call or text 988 (Press 1) for 24/7 support.`,
  ];

  return lines.join('\n');
}

// ─── PDF generator ────────────────────────────────────────────────────────────

async function generatePDF(log: WellnessEntry[], mode: 'caregiver' | 'appointment') {
  const { jsPDF } = await import('jspdf');
  const doc    = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageW  = doc.internal.pageSize.getWidth();
  const margin = 54;
  const maxW   = pageW - margin * 2;
  let y        = 60;

  const write = (text: string, opts: { size?: number; color?: [number, number, number]; bold?: boolean } = {}) => {
    doc.setFontSize(opts.size ?? 10);
    doc.setTextColor(...(opts.color ?? ([30, 30, 30] as [number, number, number])));
    const lines = doc.splitTextToSize(text, maxW) as string[];
    lines.forEach((line: string) => {
      if (y > 715) { doc.addPage(); y = 60; }
      doc.text(line, margin, y);
      y += (opts.size ?? 10) * 1.5;
    });
  };
  const gap  = (n = 8)  => { y += n; };
  const rule = ()       => {
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageW - margin, y);
    y += 12;
  };

  // Header banner
  doc.setFillColor(26, 44, 91);
  doc.rect(0, 0, pageW, 44, 'F');
  doc.setFontSize(14); doc.setTextColor(255, 255, 255);
  const title = mode === 'caregiver'
    ? 'Vet1Stop — VA Provider Wellness Brief'
    : 'Vet1Stop — Appointment Prep Packet';
  doc.text(title, margin, 28);
  y = 64;

  const now  = new Date();
  const past = new Date(); past.setDate(now.getDate() - 29);
  const fmt  = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  write(`Generated: ${fmt(now)}  |  Period: ${fmt(past)} – ${fmt(now)}  |  Total entries: ${log.length}`, { size: 9, color: [100, 100, 100] });
  gap(4);
  write('NOT A MEDICAL RECORD · FOR PERSONAL REFERENCE AND PROVIDER DISCUSSION ONLY', { size: 8, color: [180, 60, 60] });
  gap(14);
  rule();

  // Averages table
  const recent30 = log.slice(-30);
  write('30-DAY DIMENSION AVERAGES', { size: 10 });
  gap(6);

  const colX = { label: margin, avg: margin + 90, trend: margin + 140, worst: margin + 190, best: margin + 240 };
  doc.setFontSize(8); doc.setTextColor(120, 120, 120);
  doc.text('Dimension', colX.label, y);
  doc.text('Avg', colX.avg, y);
  doc.text('Trend', colX.trend, y);
  doc.text('Lowest', colX.worst, y);
  doc.text('Highest', colX.best, y);
  y += 12; rule();

  DIMS.forEach(({ key, label }) => {
    const vals  = recent30.map(e => e.scores[key]);
    const a     = avg(vals);
    const t     = trend(vals);
    const lo    = Math.min(...vals);
    const hi    = Math.max(...vals);
    const rowColor: [number,number,number] = a <= 3 ? [200,60,60] : a >= 7 ? [30,120,60] : [60,60,60];
    doc.setFontSize(9); doc.setTextColor(...rowColor);
    doc.text(label,                colX.label, y);
    doc.text(a.toFixed(1),         colX.avg,   y);
    doc.text(`${trendArrow(t)} ${t}`, colX.trend, y);
    doc.text(String(lo),           colX.worst, y);
    doc.text(String(hi),           colX.best,  y);
    y += 14;
  });

  gap(8); rule();

  if (mode === 'appointment') {
    // Questions to ask
    write('SUGGESTED QUESTIONS FOR YOUR PROVIDER', { size: 10 });
    gap(6);

    const painAvg  = avg(recent30.map(e => e.scores.pain));
    const moodAvg  = avg(recent30.map(e => e.scores.mood));
    const sleepAvg = avg(recent30.map(e => e.scores.sleep));

    const questions: string[] = [
      'What do my wellness trends suggest about my current care plan?',
    ];
    if (painAvg  >= 5) questions.push(`My average pain score was ${painAvg.toFixed(1)}/10 over the last 30 days — what options are available to address this?`);
    if (moodAvg  <= 5) questions.push(`My average mood score was ${moodAvg.toFixed(1)}/10 — can we discuss mental health support options?`);
    if (sleepAvg <= 5) questions.push(`My sleep scores have averaged ${sleepAvg.toFixed(1)}/10 — what sleep studies or interventions are available through VA?`);
    questions.push('Are there any VA community care programs that align with my wellness needs?');
    questions.push('Should I request a C&P exam based on these documented trends?');

    questions.forEach(q => {
      write(`• ${q}`, { size: 9, color: [40, 40, 80] });
      gap(2);
    });

    gap(10); rule();
  }

  // Notes section
  const withNotes = recent30.filter(e => e.notes.trim()).slice(-8).reverse();
  if (withNotes.length > 0) {
    write(mode === 'caregiver' ? 'VETERAN SELF-REPORTED NOTES (last 8 entries)' : 'MY RECENT NOTES FOR PROVIDER', { size: 10 });
    gap(6);
    withNotes.forEach(e => {
      const d = new Date(e.date + 'T00:00:00');
      const dl = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      write(`${dl}: "${e.notes.slice(0, 200)}${e.notes.length > 200 ? '…' : ''}"`, { size: 8.5, color: [60, 60, 60] });
      gap(4);
    });
    gap(6); rule();
  }

  // Footer
  write('This document was self-generated by Vet1Stop — a private wellness tracking tool. It is NOT an official VA document, NOT a medical record, and does NOT constitute claims assistance or legal advice. Always consult an accredited VSO for claims support.', { size: 8, color: [140, 140, 140] });
  gap(4);
  write('Veterans in crisis: call or text 988, then press 1. Chat at VeteransCrisisLine.net.', { size: 8, color: [160, 60, 60] });

  const fileName = mode === 'caregiver'
    ? `vet1stop-provider-brief-${now.toISOString().split('T')[0]}.pdf`
    : `vet1stop-appointment-prep-${now.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WellnessCaregiverReport({ log }: WellnessCaregiverReportProps) {
  const [isGenerating, setIsGenerating] = useState<'caregiver' | 'appointment' | null>(null);
  const [copiedText,   setCopiedText]   = useState(false);
  const [showPanel,    setShowPanel]    = useState(false);

  const handleDownload = useCallback(async (mode: 'caregiver' | 'appointment') => {
    if (log.length === 0) return;
    setIsGenerating(mode);
    try {
      await generatePDF(log, mode);
    } catch { /* fail silently */ }
    finally { setIsGenerating(null); }
  }, [log]);

  const handleCopyText = useCallback(() => {
    if (log.length === 0) return;
    const text = buildSummaryText(log, 30);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    }).catch(() => { /* ignore */ });
  }, [log]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-[#1A2C5B]">Provider &amp; Caregiver Share</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Generate shareable reports for your VA provider, caregiver, or VSO</p>
        </div>
        <UserGroupIcon className="h-5 w-5 text-gray-300" aria-hidden="true" />
      </div>

      <div className="px-6 py-5 space-y-3">

        {log.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Save at least one check-in to generate reports.</p>
        ) : (
          <>
            <button
              onClick={() => handleDownload('caregiver')}
              disabled={!!isGenerating}
              className="w-full flex items-center gap-3 px-4 py-3.5 bg-[#1A2C5B] hover:bg-[#0F1D3D] text-white font-semibold text-sm rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
              aria-label="Download VA Provider Brief PDF"
            >
              <DocumentArrowDownIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <div className="text-left">
                <div className="font-bold">VA Provider Brief (PDF)</div>
                <div className="text-white/60 text-xs font-normal">30-day averages, trends, notes — for your VA appointment</div>
              </div>
              {isGenerating === 'caregiver' && (
                <span className="ml-auto text-xs text-white/60">Generating…</span>
              )}
            </button>

            <button
              onClick={() => handleDownload('appointment')}
              disabled={!!isGenerating}
              className="w-full flex items-center gap-3 px-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-50"
              aria-label="Download Appointment Prep Packet PDF"
            >
              <CalendarDaysIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <div className="text-left">
                <div className="font-bold">Appointment Prep Packet (PDF)</div>
                <div className="text-white/60 text-xs font-normal">Provider brief + suggested questions tailored to your scores</div>
              </div>
              {isGenerating === 'appointment' && (
                <span className="ml-auto text-xs text-white/60">Generating…</span>
              )}
            </button>

            <button
              onClick={handleCopyText}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold text-sm rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label="Copy text summary to clipboard"
            >
              {copiedText ? (
                <><CheckCircleIcon className="h-4 w-4 text-emerald-500" aria-hidden="true" />Copied to clipboard!</>
              ) : (
                <><ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />Copy text summary</>
              )}
            </button>

            <button
              onClick={() => setShowPanel(!showPanel)}
              className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
            >
              {showPanel ? 'Hide' : 'What\'s included in these reports?'}
            </button>

            {showPanel && (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2 text-xs text-gray-500 leading-relaxed">
                <div className="flex items-start gap-2">
                  <XMarkIcon className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Does NOT include your name, account info, or any identifying details</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Includes 30-day dimension averages, trend direction, and notes excerpts</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Appointment Prep also adds suggested provider questions based on your scores</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Generated 100% on your device — nothing is sent to any server</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="px-6 pb-4">
        <p className="text-[10px] text-gray-400 leading-relaxed text-center">
          These PDFs are personal wellness summaries — not official VA documents. For claims assistance, consult an accredited VSO.
        </p>
      </div>
    </div>
  );
}
