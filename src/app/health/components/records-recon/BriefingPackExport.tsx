'use client';

import React, { useState } from 'react';
import { ArrowDownTrayIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ReconTimelineEntry {
  date: string | null;
  page: number | null;
  section: string | null;
  provider: string | null;
  entry: string;
  category: string;
}

interface ReconCondition {
  condition: string;
  category: string;
  firstMentionDate: string | null;
  firstMentionPage: number | null;
  mentionCount: number;
  pagesFound: number[];
  excerpts: Array<{ text: string; page: number | null; date: string | null }>;
}

interface ReconKeywordFrequency {
  term: string;
  count: number;
}

interface ReconDocumentSummary {
  totalPagesReferenced: number;
  dateRange: { earliest: string | null; latest: string | null };
  documentTypesDetected: string[];
  providersFound: string[];
}

interface ScanSynopsis {
  totalPages: number;
  totalParagraphs: number;
  keptParagraphs: number;
  reductionPct: number;
  keywordsDetected: string[];
  sectionHeadersFound: string[];
}

interface ReconExtractedItem {
  itemId: string;
  condition: string;
  category: string;
  excerpt: string;
  dateFound: string | null;
  pageNumber: number | null;
  sectionFound: string | null;
  provider: string | null;
  confidence: 'high' | 'medium' | 'low';
}

interface ReconReport {
  disclaimer: string;
  summary: string;
  documentSummary: ReconDocumentSummary;
  timeline: ReconTimelineEntry[];
  conditionsIndex: ReconCondition[];
  keywordFrequency: ReconKeywordFrequency[];
  extractedItems: ReconExtractedItem[];
  processingDetails: { filesProcessed: number; processingTime: number; aiModel: string };
  scanSynopsis?: ScanSynopsis;
  isInterim?: boolean;
  interimNote?: string;
}

interface BriefingPackExportProps {
  report: ReconReport;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BriefingPackExport({ report }: BriefingPackExportProps) {
  const [generating, setGenerating] = useState(false);
  const [allCopied, setAllCopied] = useState(false);

  const generateDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // ─── Generate HTML-based Briefing Pack ──────────────────────────────────

  const generateBriefingPack = async () => {
    setGenerating(true);
    try {
      const html = buildBriefingPackHTML(report, generateDate);
      // Open in new window and trigger print dialog for Save as PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        // Wait for content to render before triggering print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
        // Fallback if onload already fired
        setTimeout(() => {
          printWindow.print();
        }, 1000);
      } else {
        // Popup blocked — fall back to download
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `VSO-Briefing-Pack-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to generate briefing pack:', err);
    } finally {
      setGenerating(false);
    }
  };

  // ─── Copy All Excerpts ──────────────────────────────────────────────────

  const copyAllExcerpts = async () => {
    const text = report.conditionsIndex.map(cond => {
      const excerpts = cond.excerpts.map(e =>
        `  "${e.text}"${e.page ? ` (Page ${e.page})` : ''}${e.date ? ` [${e.date}]` : ''}`
      ).join('\n');
      return `${cond.condition} (${cond.category}) — ${cond.mentionCount} mention(s)\n${excerpts}`;
    }).join('\n\n');

    try {
      await navigator.clipboard.writeText(text);
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 2000);
    } catch { /* clipboard not available */ }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-[#1A2C5B] font-bold text-lg mb-2">VSO Briefing Pack</h3>
        <p className="text-gray-500 text-sm">
          Generate a comprehensive document to bring to your VSO appointment.
          Includes disclaimer cover page, timeline, conditions index, and blank notes section.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={generateBriefingPack}
          disabled={generating}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#EAB308] text-[#1A2C5B] font-bold rounded-lg hover:bg-[#FACC15] transition-colors disabled:opacity-50"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
          {generating ? 'Generating...' : 'Generate VSO Briefing Pack (PDF)'}
        </button>
        <button
          onClick={copyAllExcerpts}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-[#1A2C5B] text-white font-semibold rounded-lg hover:bg-[#2563EB] transition-colors"
        >
          {allCopied ? <CheckIcon className="h-5 w-5 text-[#EAB308]" /> : <ClipboardDocumentIcon className="h-5 w-5" />}
          {allCopied ? 'Copied!' : 'Copy All Excerpts'}
        </button>
      </div>

      {/* Preview */}
      <div className="bg-blue-50 rounded-lg border border-blue-100 p-4 space-y-3">
        <h4 className="text-[#1A2C5B] font-semibold text-sm">Pack Contents Preview</h4>
        <div className="space-y-2 text-sm">
          <PreviewItem label="Cover Page" desc="Full-page legal disclaimer and terms of use" />
          <PreviewItem label="Recon Summary" desc={`${report.extractedItems.length} conditions, ${report.scanSynopsis?.totalPages || 0} pages scanned`} />
          <PreviewItem label="Timeline" desc={`${report.timeline.length} chronological entries`} />
          <PreviewItem label="Conditions Index" desc={`${report.conditionsIndex.length} unique conditions with excerpts and page references`} />
          <PreviewItem label="My Notes" desc="Blank lined section for your appointment preparation" />
        </div>
      </div>

      {/* Format Note */}
      <p className="text-gray-500 text-xs text-center">
        Opens a print-ready preview. Use your browser&apos;s &ldquo;Save as PDF&rdquo; option in the print dialog for a professional document.
      </p>
    </div>
  );
}

function PreviewItem({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[#1A2C5B] text-xs mt-0.5">✓</span>
      <div>
        <span className="text-gray-900 font-medium">{label}</span>
        <span className="text-gray-500 ml-2">{desc}</span>
      </div>
    </div>
  );
}

// ─── HTML Briefing Pack Builder ──────────────────────────────────────────────

function buildBriefingPackHTML(report: ReconReport, generateDate: string): string {
  const escH = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const timelineRows = report.timeline.map(t => `
    <tr>
      <td>${escH(t.date || 'N/A')}</td>
      <td>${t.page || '—'}</td>
      <td>${escH(t.section || '—')}</td>
      <td>${escH(t.provider || '—')}</td>
      <td>${escH(t.category)}</td>
      <td class="excerpt">"${escH(t.entry)}"</td>
    </tr>`).join('');

  const conditionBlocks = report.conditionsIndex.map(cond => {
    const excerptList = cond.excerpts.map(e =>
      `<li>"${escH(e.text)}"${e.page ? ` <span class="meta">(Page ${e.page})</span>` : ''}${e.date ? ` <span class="meta">[${e.date}]</span>` : ''}</li>`
    ).join('');
    return `
      <div class="condition-block">
        <h3>${escH(cond.condition)} <span class="badge">${escH(cond.category)}</span> <span class="count">${cond.mentionCount} mention${cond.mentionCount !== 1 ? 's' : ''}</span></h3>
        ${cond.firstMentionDate ? `<p class="meta">First noted: ${escH(cond.firstMentionDate)}${cond.firstMentionPage ? ` — Page ${cond.firstMentionPage}` : ''}</p>` : ''}
        ${cond.pagesFound.length > 0 ? `<p class="meta">Found on pages: ${cond.pagesFound.join(', ')}</p>` : ''}
        <ul>${excerptList}</ul>
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VSO Briefing Pack — Records Recon by Vet1Stop</title>
<style>
  @media print { .no-print { display: none !important; } @page { margin: 0.75in; } }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a2e; line-height: 1.5; }
  .page { page-break-after: always; min-height: 100vh; padding: 2rem; }
  .cover { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: #0A0F1A; color: #F1F5F9; }
  .cover h1 { font-size: 2rem; color: #4ADE80; margin-bottom: 0.5rem; letter-spacing: 0.05em; }
  .cover h2 { font-size: 1.1rem; color: #94A3B8; margin-bottom: 2rem; }
  .cover .disclaimer-box { background: #111827; border: 2px solid #F59E0B; border-radius: 12px; padding: 2rem; max-width: 640px; text-align: left; margin: 0 auto; }
  .cover .disclaimer-box h3 { color: #F59E0B; font-size: 1rem; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.1em; }
  .cover .disclaimer-box p { color: #94A3B8; font-size: 0.85rem; margin-bottom: 0.75rem; }
  .cover .disclaimer-box ul { color: #94A3B8; font-size: 0.85rem; padding-left: 1.5rem; margin-bottom: 0.75rem; }
  .cover .disclaimer-box li { margin-bottom: 0.25rem; }
  .cover .tagline { color: #4ADE80; font-style: italic; margin-top: 2rem; }
  .header { text-align: center; padding-bottom: 0.5rem; border-bottom: 2px solid #4ADE80; margin-bottom: 1.5rem; }
  .header h2 { font-size: 1.3rem; color: #0A0F1A; }
  .footer { text-align: center; font-size: 0.7rem; color: #94A3B8; padding-top: 1rem; border-top: 1px solid #e2e8f0; margin-top: auto; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
  .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; text-align: center; }
  .stat-card .value { font-size: 1.5rem; font-weight: bold; color: #0A0F1A; }
  .stat-card .label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  table { width: 100%; border-collapse: collapse; font-size: 0.8rem; margin-bottom: 1.5rem; }
  th { background: #0A0F1A; color: #F1F5F9; padding: 0.5rem; text-align: left; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; }
  td { padding: 0.5rem; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tr:nth-child(even) { background: #f8fafc; }
  .excerpt { font-style: italic; color: #475569; max-width: 300px; }
  .condition-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
  .condition-block h3 { font-size: 0.95rem; margin-bottom: 0.5rem; }
  .badge { background: #e2e8f0; color: #475569; font-size: 0.7rem; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: normal; }
  .count { color: #4ADE80; font-size: 0.75rem; font-weight: normal; }
  .meta { color: #94A3B8; font-size: 0.8rem; }
  ul { padding-left: 1.5rem; margin-top: 0.5rem; }
  li { font-size: 0.85rem; margin-bottom: 0.5rem; color: #334155; }
  .notes-section { page-break-before: always; }
  .notes-section h2 { text-align: center; margin-bottom: 1rem; }
  .notes-lines { border-top: 1px solid #cbd5e1; }
  .notes-line { border-bottom: 1px solid #e2e8f0; height: 2rem; }
</style>
</head>
<body>

<!-- PAGE 1: DISCLAIMER COVER -->
<div class="page cover">
  <h1>VSO BRIEFING PACK</h1>
  <h2>Generated by Records Recon — Vet1Stop</h2>
  <p style="color:#94A3B8; margin-bottom: 2rem;">Generated: ${escH(generateDate)}</p>
  <div class="disclaimer-box">
    <h3>⚠ Important — Please Read Before Use</h3>
    <p>This document is a <strong>RECORDS ORGANIZATION TOOL ONLY</strong>. It extracts and organizes factual content from medical records that YOU uploaded. It does NOT constitute:</p>
    <ul>
      <li>Medical advice or diagnosis</li>
      <li>Legal advice or legal representation</li>
      <li>Claims advice, claims assistance, or claims strategy</li>
      <li>A recommendation to file, modify, or pursue any VA claim</li>
      <li>An evaluation of claim merit, eligibility, or likelihood of success</li>
      <li>A disability rating estimate or prediction</li>
    </ul>
    <p>This tool is NOT accredited by the VA Office of General Counsel under 38 CFR §14.629. No attorney-client or representative-claimant relationship is created by using this tool or reading this document.</p>
    <p><strong>WHAT THIS DOCUMENT IS:</strong> A structured summary of dates, conditions, providers, page numbers, and verbatim excerpts found in YOUR medical records — organized for YOUR convenience when meeting with an accredited Veterans Service Organization (VSO) representative, attorney, or claims agent.</p>
    <p>YOU are responsible for all decisions regarding your healthcare and any VA claims. Always consult with an accredited VSO representative, VA-accredited attorney, or VA-accredited claims agent.</p>
    <p style="font-size:0.75rem;">Your uploaded files were processed in memory only and were NOT stored, saved, or transmitted to any third party. Vet1Stop LLC is a Pennsylvania limited liability company. This tool is provided "as is" without warranty of any kind.</p>
  </div>
  <p class="tagline">"Organize your records. Own your appointments."</p>
</div>

<!-- PAGE 2: RECON SUMMARY -->
<div class="page">
  <div class="header"><h2>Recon Summary</h2></div>
  <div class="stats">
    <div class="stat-card"><div class="value">${report.extractedItems.length}</div><div class="label">Conditions Found</div></div>
    <div class="stat-card"><div class="value">${report.scanSynopsis?.totalPages || 0}</div><div class="label">Pages Scanned</div></div>
    <div class="stat-card"><div class="value">${report.documentSummary.providersFound.length}</div><div class="label">Providers</div></div>
    <div class="stat-card"><div class="value">${report.documentSummary.dateRange.earliest ? escH(report.documentSummary.dateRange.earliest.substring(0, 7)) : 'N/A'} – ${report.documentSummary.dateRange.latest ? escH(report.documentSummary.dateRange.latest.substring(0, 7)) : 'N/A'}</div><div class="label">Date Range</div></div>
  </div>
  ${report.documentSummary.providersFound.length > 0 ? `<p style="margin-bottom:1rem;"><strong>Providers mentioned:</strong> ${report.documentSummary.providersFound.map(escH).join(', ')}</p>` : ''}
  ${report.keywordFrequency.length > 0 ? `
  <h3 style="margin-bottom:0.5rem;">Condition Frequency</h3>
  <table>
    <tr><th>Condition</th><th>Mentions</th></tr>
    ${report.keywordFrequency.map(k => `<tr><td>${escH(k.term)}</td><td>${k.count}</td></tr>`).join('')}
  </table>` : ''}
  <div class="footer">VSO Briefing Pack — Records Recon by Vet1Stop | ${escH(generateDate)} | For informational purposes only. Not medical, legal, or claims advice.</div>
</div>

<!-- TIMELINE -->
${report.timeline.length > 0 ? `
<div class="page">
  <div class="header"><h2>Chronological Timeline</h2></div>
  <table>
    <tr><th>Date</th><th>Page</th><th>Section</th><th>Provider</th><th>Category</th><th>Excerpt</th></tr>
    ${timelineRows}
  </table>
  <div class="footer">VSO Briefing Pack — Records Recon by Vet1Stop | ${escH(generateDate)} | For informational purposes only. Not medical, legal, or claims advice.</div>
</div>` : ''}

<!-- CONDITIONS INDEX -->
<div class="page">
  <div class="header"><h2>Conditions Index</h2></div>
  ${conditionBlocks}
  <div class="footer">VSO Briefing Pack — Records Recon by Vet1Stop | ${escH(generateDate)} | For informational purposes only. Not medical, legal, or claims advice.</div>
</div>

<!-- MY NOTES -->
<div class="page notes-section">
  <div class="header"><h2>My Notes</h2></div>
  <p style="text-align:center; color:#64748b; margin-bottom:1.5rem;">Use this space to prepare questions for your VSO appointment.</p>
  <div class="notes-lines">
    ${Array.from({ length: 30 }, () => '<div class="notes-line"></div>').join('')}
  </div>
  <div class="footer">VSO Briefing Pack — Records Recon by Vet1Stop | ${escH(generateDate)} | For informational purposes only. Not medical, legal, or claims advice.</div>
</div>

<div class="page notes-section">
  <div class="header"><h2>My Notes (continued)</h2></div>
  <div class="notes-lines">
    ${Array.from({ length: 30 }, () => '<div class="notes-line"></div>').join('')}
  </div>
  <div class="footer">VSO Briefing Pack — Records Recon by Vet1Stop | ${escH(generateDate)} | For informational purposes only. Not medical, legal, or claims advice.</div>
</div>

</body>
</html>`;
}
