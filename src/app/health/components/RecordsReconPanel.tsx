'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  DocumentArrowUpIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ShieldExclamationIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  EnvelopeIcon,
  QuestionMarkCircleIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';
import ReconDisclaimer from './records-recon/ReconDisclaimer';
import ReconTimeline from './records-recon/ReconTimeline';
import ConditionFrequencyChart from './records-recon/ConditionFrequencyChart';
import ConditionsIndex from './records-recon/ConditionsIndex';
import BriefingPackExport from './records-recon/BriefingPackExport';
import PdfViewerPaneLoader from './records-recon/PdfViewerPaneLoader';

// ─── Types matching route.ts ──────────────────────────────────────────────────

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

interface UploadedFile {
  name: string;
  type: string;
  data: string;
  size: number;
  file?: File; // Keep the raw File object for PDF viewer
}

interface ScanCache {
  filteredText: string;
  keywordFlags: Array<{ condition: string; confidence: string; excerpt: string }>;
  synopsis: ScanSynopsis;
  fileNames: string;
}

type PanelState = 'upload' | 'processing' | 'results' | 'no_items' | 'error';
type TabId = 'dashboard' | 'timeline' | 'conditions' | 'export';

// ─── Component ───────────────────────────────────────────────────────────────

export default function RecordsReconPanel() {
  const [panelState, setPanelState] = useState<PanelState>('upload');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [report, setReport] = useState<ReconReport | null>(null);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState({ message: '', percent: 0, phase: '' });
  const [liveFlags, setLiveFlags] = useState<Array<{ condition: string; confidence: string; excerpt: string }>>([]);
  const [scanCache, setScanCache] = useState<ScanCache | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfKey, setPdfKey] = useState(0);
  const [pdfTargetPage, setPdfTargetPage] = useState<number | undefined>(undefined);
  const [pdfSearchText, setPdfSearchText] = useState<string>('');
  const [showMobilePdf, setShowMobilePdf] = useState(false);
  const [pdfCollapsed, setPdfCollapsed] = useState(false);
  const [showBlueButtonHelp, setShowBlueButtonHelp] = useState(false);
  const pdfBlobUrlRef = useRef<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean up PDF blob URL only on unmount
  useEffect(() => {
    return () => {
      if (pdfBlobUrlRef.current) {
        URL.revokeObjectURL(pdfBlobUrlRef.current);
        pdfBlobUrlRef.current = null;
      }
    };
  }, []);

  // ─── File Handling ────────────────────────────────────────────────────────

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles: UploadedFile[] = [];
    for (const file of Array.from(fileList)) {
      if (file.type !== 'application/pdf') continue;
      if (file.size > 50 * 1024 * 1024) {
        setError(`"${file.name}" exceeds 50MB limit.`);
        continue;
      }
      const data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1] || '');
        };
        reader.readAsDataURL(file);
      });
      newFiles.push({ name: file.name, type: file.type, data, size: file.size, file });
    }
    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      setError('');
      // Create PDF URL for viewer (use first PDF)
      if (!pdfBlobUrlRef.current && newFiles[0].file) {
        const blobUrl = URL.createObjectURL(newFiles[0].file);
        pdfBlobUrlRef.current = blobUrl;
        setPdfUrl(blobUrl);
      }
    }
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0 && pdfBlobUrlRef.current) {
        URL.revokeObjectURL(pdfBlobUrlRef.current);
        pdfBlobUrlRef.current = null;
        setPdfUrl(null);
      }
      return updated;
    });
  };

  // ─── PDF Page Jump + Highlight ─────────────────────────────────────────────

  const scrollToPage = useCallback((pageNumber: number, searchText?: string) => {
    if (!pdfBlobUrlRef.current) return;
    // Set target page and search text for the PDF viewer component
    setPdfTargetPage(pageNumber);
    setPdfSearchText(searchText || '');
    // Increment key to signal the viewer to re-process the jump + highlight
    setPdfKey(prev => prev + 1);
    // On mobile, auto-open the PDF modal so the user sees the jump
    if (window.innerWidth < 1024) {
      setShowMobilePdf(true);
    }
  }, []);

  // ─── Clipboard ────────────────────────────────────────────────────────────

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* clipboard not available */ }
  }, []);

  // ─── Scan ─────────────────────────────────────────────────────────────────

  const startScan = async (retryData?: { filteredText: string; keywordFlags: unknown[]; synopsis: ScanSynopsis; fileNames: string; useReducedCap?: boolean }) => {
    setPanelState('processing');
    setReport(null);
    setError('');
    setLiveFlags([]);
    setProgress({ message: 'Initializing Records Recon...', percent: 0, phase: 'init' });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const body = retryData
        ? { retryFilteredText: retryData.filteredText, retryKeywordFlags: retryData.keywordFlags, retrySynopsis: retryData.synopsis, retryFileNames: retryData.fileNames, useReducedCap: retryData.useReducedCap }
        : { files: files.map(f => ({ name: f.name, type: f.type, data: f.data, size: f.size })) };

      const response = await fetch('/api/health/records-recon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            switch (event.type) {
              case 'progress':
                setProgress({ message: event.message, percent: event.percent, phase: event.phase });
                break;
              case 'keyword_flag':
                setLiveFlags(prev => [...prev, event.flag]);
                break;
              case 'scan_cache':
                setScanCache(event);
                break;
              case 'complete':
                if (event.report) {
                  const r = event.report as ReconReport;
                  setReport(r);
                  setPanelState(r.extractedItems.length > 0 ? 'results' : 'no_items');
                }
                break;
              case 'error':
                setError(event.message);
                setPanelState('error');
                break;
            }
          } catch { /* malformed line */ }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setPanelState('upload');
        return;
      }
      setError((err as Error).message || 'Processing failed.');
      setPanelState('error');
    }
  };

  const cancelScan = () => {
    abortControllerRef.current?.abort();
    setPanelState('upload');
  };

  const resetPanel = () => {
    setPanelState('upload');
    setFiles([]);
    setReport(null);
    setError('');
    setLiveFlags([]);
    setScanCache(null);
    setConsentChecked(false);
    setActiveTab('dashboard');
    if (pdfBlobUrlRef.current) { URL.revokeObjectURL(pdfBlobUrlRef.current); pdfBlobUrlRef.current = null; setPdfUrl(null); }
  };

  const retryWithCache = (useReducedCap = false) => {
    if (!scanCache) return;
    startScan({ ...scanCache, useReducedCap });
  };

  // ─── Sample Record Demo ─────────────────────────────────────────────────

  const startSampleScan = () => {
    const sampleText = `[Page 1 | Assessment | Date: 2023-03-15 | Provider: Smith, John MD] Patient presents with chronic bilateral tinnitus, rated 6/10 severity. Onset during active duty service in 2008 following exposure to artillery fire. Audiogram shows bilateral sensorineural hearing loss, mild to moderate. Assessment: 1. Bilateral tinnitus, chronic 2. Bilateral sensorineural hearing loss

[Page 2 | Problem List | Date: 2023-03-15 | Provider: Smith, John MD] Active Problems: 1. Post-traumatic stress disorder (PTSD) - diagnosed 2019-06-12 2. Lumbar degenerative disc disease - diagnosed 2020-01-08 3. Obstructive sleep apnea - CPAP prescribed 2021-11-20 4. Gastroesophageal reflux disease (GERD) 5. Bilateral tinnitus 6. Left knee osteoarthritis

[Page 3 | HPI | Date: 2022-11-10 | Provider: Jones, Mary PA-C] History of Present Illness: Veteran reports worsening low back pain with radiculopathy into left lower extremity. MRI lumbar spine shows L4-L5 disc herniation with moderate central canal stenosis. ROM testing: flexion limited to 40 degrees with pain on use. DeLuca criteria: additional functional loss of 15 degrees during flare-ups.

[Page 4 | Mental Health | Date: 2023-01-22 | Provider: Williams, Sarah PhD] PHQ-9 score: 18 (moderately severe depression). PCL-5 score: 52. Patient endorses nightmares 3-4x/week, hypervigilance, avoidance of crowds. Diagnosis: PTSD with comorbid major depressive disorder (MDD). Sleep study confirms moderate OSA, AHI 22.`;

    const sampleFlags = [
      { condition: 'Tinnitus', confidence: 'high' as const, excerpt: 'chronic bilateral tinnitus, rated 6/10 severity' },
      { condition: 'PTSD', confidence: 'high' as const, excerpt: 'Post-traumatic stress disorder (PTSD)' },
      { condition: 'Sleep Apnea', confidence: 'high' as const, excerpt: 'Obstructive sleep apnea - CPAP prescribed' },
      { condition: 'Lumbar DDD', confidence: 'high' as const, excerpt: 'Lumbar degenerative disc disease' },
      { condition: 'GERD', confidence: 'medium' as const, excerpt: 'Gastroesophageal reflux disease' },
    ];

    const sampleSynopsis: ScanSynopsis = {
      totalPages: 4,
      totalParagraphs: 12,
      keptParagraphs: 4,
      reductionPct: 67,
      keywordsDetected: ['tinnitus', 'hearing loss', 'ptsd', 'sleep apnea', 'gerd', 'lumbar', 'radiculopathy', 'depression'],
      sectionHeadersFound: ['assessment', 'problem list', 'hpi'],
    };

    setConsentChecked(true);
    startScan({
      filteredText: sampleText,
      keywordFlags: sampleFlags,
      synopsis: sampleSynopsis,
      fileNames: 'Sample_VA_Record.pdf',
    });
  };

  // ─── Tab Badge Counts ──────────────────────────────────────────────────────

  const getTabBadge = (tabId: TabId): number | null => {
    if (!report) return null;
    switch (tabId) {
      case 'timeline': return report.timeline.length || null;
      case 'conditions': return report.conditionsIndex.length || null;
      case 'dashboard': return report.extractedItems.length || null;
      default: return null;
    }
  };

  // ─── VSO Email Draft ───────────────────────────────────────────────────────

  const [emailCopied, setEmailCopied] = useState(false);

  const buildVsoEmailText = () => {
    const condCount = report?.extractedItems.length || 0;
    const dateRange = report?.documentSummary.dateRange;
    const startDate = dateRange?.earliest || '[Start Date]';
    const endDate = dateRange?.latest || '[End Date]';

    const subject = 'Claim Review Request & Organized Medical History - [Your Name]';
    const body =
      `Good Morning/Afternoon,\n\n` +
      `I am reaching out to request your assistance in evaluating my medical history for a potential VA disability claim.\n\n` +
      `To make our initial meeting as productive as possible and save you time, I have pre-organized my VA medical records. I've attached a summary Briefing Pack (PDF) that includes:\n` +
      `- A chronological timeline of my medical history (Date Range: ${startDate} to ${endDate})\n` +
      `- An index of ${condCount} identified conditions with direct supporting excerpts\n\n` +
      `Could you please let me know your availability for an introductory review in the coming weeks? Additionally, please let me know if there are any standard intake forms or representation mandates I should complete prior to our meeting.\n\n` +
      `Thank you for your time and advocacy.\n\n` +
      `Respectfully,\n\n` +
      `[Your Name]\n` +
      `[Your Phone Number]`;
    return { subject, body };
  };

  const generateVsoEmailDraft = () => {
    const { subject, body } = buildVsoEmailText();
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Try opening mailto — use window.open with a fallback.
    // If no email client is configured, window.open returns null or the
    // popup is blocked. In that case, copy the draft to clipboard instead.
    const win = window.open(mailtoUrl, '_self');
    if (!win) {
      copyEmailDraftToClipboard();
    }
  };

  const copyEmailDraftToClipboard = async () => {
    const { subject, body } = buildVsoEmailText();
    const fullText = `Subject: ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 4000);
    } catch { /* clipboard not available */ }
  };

  // ─── Drag & Drop ──────────────────────────────────────────────────────────

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  };

  // ─── Tab Config ───────────────────────────────────────────────────────────

  // ─── Stepper Phase Mapping ─────────────────────────────────────────────────

  const getStepperPhase = (): 0 | 1 | 2 => {
    if (panelState === 'results' || panelState === 'no_items') return 2;
    if (panelState === 'processing') return 1;
    return 0;
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'conditions', label: 'Conditions Index' },
    { id: 'export', label: 'Export' },
  ];

  // ─── Render: Upload State ─────────────────────────────────────────────────

  if (panelState === 'upload') {
    return (
      <div className="bg-white rounded-xl border border-blue-100 shadow-md overflow-hidden">
        <ReconDisclaimer />

        {/* Horizontal Stepper — Upload phase */}
        <HorizontalStepper currentStep={getStepperPhase()} />

        <div className="p-6 space-y-4">
          {/* Upload Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? 'border-[#EAB308] bg-yellow-50' : 'border-blue-200 hover:border-[#2563EB]/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <DocumentArrowUpIcon className="h-12 w-12 mx-auto mb-3 text-[#1A2C5B]" />
            <p className="text-gray-900 font-semibold mb-1">Upload VA Medical Records</p>
            <p className="text-gray-500 text-sm mb-4">PDF files up to 50MB. Your files are processed in memory only — never stored.</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 bg-[#1A2C5B] text-white font-bold rounded-lg hover:bg-[#2563EB] transition-colors"
              >
                Select Files
              </button>
              <button
                onClick={startSampleScan}
                className="px-4 py-2.5 border border-slate-300 text-slate-600 font-medium rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors flex items-center gap-1.5 text-sm"
              >
                <BeakerIcon className="h-4 w-4" />
                Try Sample Record
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && processFiles(e.target.files)}
            />
          </div>

          {/* "How Do I Get This?" Collapsible Help */}
          <div className="text-center">
            <button
              onClick={() => setShowBlueButtonHelp(prev => !prev)}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#2563EB] transition-colors"
            >
              <QuestionMarkCircleIcon className="h-3.5 w-3.5" />
              How do I get my VA records?
            </button>
            {showBlueButtonHelp && (
              <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-3 text-left max-w-md mx-auto">
                <p className="text-slate-700 text-xs font-semibold mb-1.5">Download your Blue Button record from MyHealtheVet:</p>
                <ol className="text-slate-600 text-xs space-y-1 list-decimal list-inside">
                  <li>Log in at <span className="font-mono text-[#2563EB]">myhealth.va.gov</span> and go to <strong>Health Records</strong></li>
                  <li>Select <strong>Blue Button Reports</strong> → choose your date range → click <strong>Download PDF</strong></li>
                  <li>Upload that PDF here — Records Recon does the rest</li>
                </ol>
              </div>
            )}
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-blue-50 rounded-lg px-4 py-2 border border-blue-100">
                  <span className="text-gray-900 text-sm font-mono truncate">{f.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                    <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500">
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Consent + Run */}
          {files.length > 0 && (
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-blue-300 bg-white text-[#1A2C5B] focus:ring-[#2563EB]"
                />
                <span className="text-gray-600 text-sm leading-relaxed">
                  I understand that Records Recon organizes my records for my personal use.
                  It does not provide medical advice, legal advice, or claims assistance.
                  I will consult an accredited VSO for professional guidance.
                </span>
              </label>
              <button
                onClick={() => startScan()}
                disabled={!consentChecked}
                className={`w-full py-3 rounded-lg font-bold text-lg transition-all ${
                  consentChecked
                    ? 'bg-[#EAB308] text-[#1A2C5B] hover:bg-[#FACC15] shadow-lg shadow-yellow-500/20'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                }`}
              >
                Run Recon
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Render: Processing State ─────────────────────────────────────────────

  if (panelState === 'processing') {
    return (
      <div className="bg-white rounded-xl border border-blue-100 shadow-md overflow-hidden">
        <ReconDisclaimer />

        {/* Horizontal Stepper — Analyzing phase */}
        <HorizontalStepper currentStep={getStepperPhase()} />

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#1A2C5B] font-bold text-lg">Records Recon in Progress</h3>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-blue-100 rounded-full h-3 mb-3">
              <div
                className="bg-gradient-to-r from-[#1A2C5B] to-[#2563EB] h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <p className="text-gray-600 text-sm font-mono">{progress.message}</p>

            {/* Live Keyword Flags */}
            {liveFlags.length > 0 && (
              <div className="mt-4 space-y-1">
                <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider">Live Detections</p>
                <div className="flex flex-wrap gap-2">
                  {liveFlags.map((flag, i) => (
                    <span key={i} className="bg-[#1A2C5B] text-[#EAB308] text-xs px-2 py-1 rounded font-mono">
                      {flag.condition}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cancel Scan — ghost button */}
            <div className="mt-5 text-center">
              <button
                onClick={cancelScan}
                className="px-5 py-2 border border-slate-300 text-slate-500 font-medium rounded-lg hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors text-sm"
              >
                Cancel Scan
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Error State ──────────────────────────────────────────────────

  if (panelState === 'error') {
    return (
      <div className="bg-white rounded-xl border border-blue-100 shadow-md p-6 space-y-4">
        <ReconDisclaimer />
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <ShieldExclamationIcon className="h-10 w-10 mx-auto mb-3 text-red-500" />
          <p className="text-red-700 font-semibold mb-2">Recon Failed</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            {scanCache && (
              <button onClick={() => retryWithCache()} className="px-4 py-2 bg-[#1A2C5B] text-white font-bold rounded-lg hover:bg-[#2563EB]">
                Retry
              </button>
            )}
            <button onClick={resetPanel} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-200">
              Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: No Items State ───────────────────────────────────────────────

  if (panelState === 'no_items') {
    return (
      <div className="bg-white rounded-xl border border-blue-100 shadow-md p-6 space-y-4">
        <ReconDisclaimer />
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 text-center">
          <MagnifyingGlassIcon className="h-10 w-10 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-900 font-semibold mb-2">No Conditions Extracted</p>
          <p className="text-gray-500 text-sm mb-4">
            No diagnosable conditions were found in the uploaded records.
            Try uploading additional VA medical records, progress notes, or Blue Button exports.
          </p>
          <button onClick={resetPanel} className="px-4 py-2 bg-[#1A2C5B] text-white font-bold rounded-lg hover:bg-[#2563EB]">
            Upload Different Records
          </button>
        </div>
      </div>
    );
  }

  // ─── Render: Results State (Split-Pane Command Center) ────────────────────

  return (
    <div className="bg-white rounded-xl lg:rounded-md border border-blue-100 shadow-md overflow-hidden lg:sticky lg:top-[68px] lg:z-10">
      <ReconDisclaimer />

      {/* Horizontal Stepper — Report Ready */}
      <HorizontalStepper currentStep={getStepperPhase()} />

      {/* Interim Banner */}
      {report?.isInterim && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3 flex items-center justify-between">
          <p className="text-yellow-800 text-sm">{report.interimNote}</p>
          <button onClick={() => retryWithCache()} className="px-3 py-1 bg-[#EAB308] text-[#1A2C5B] font-bold text-sm rounded hover:bg-[#FACC15]">
            Retry
          </button>
        </div>
      )}

      {/* Split Pane Layout — fixed viewport height so the PDF viewer's
           internal virtualizer has a constrained scroll container.
           Without this, scrollTop has no effect and jumpToPage silently no-ops. */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-260px)] min-h-[600px]">

        {/* LEFT PANE — Tabbed Dashboard */}
        <div className={`flex-1 flex flex-col min-w-0 ${pdfUrl && !pdfCollapsed ? 'lg:w-[60%]' : 'w-full'}`}>

          {/* Tab Navigation — sticky */}
          <div className="flex border-b border-blue-100 bg-blue-50 sticky top-0 z-20">
            {tabs.map((tab) => {
              const badge = getTabBadge(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-semibold transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-[#1A2C5B] border-b-2 border-[#EAB308] bg-white'
                      : 'text-gray-500 hover:text-[#1A2C5B] hover:bg-white/50'
                  }`}
                >
                  {tab.label}
                  {badge !== null && (
                    <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-[#1A2C5B] text-white">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
            <div className="flex-1" />
            <button onClick={resetPanel} className="px-3 py-2 text-gray-500 hover:text-[#1A2C5B] text-xs font-medium">
              New Scan
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && report && (
              <div className="space-y-4">
                {/* Summary */}
                <p className="text-gray-600 text-sm">{report.summary}</p>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Conditions" value={report.extractedItems.length} />
                  <StatCard label="Pages Scanned" value={report.scanSynopsis?.totalPages || 0} />
                  <StatCard label="Date Range" value={
                    report.documentSummary.dateRange.earliest && report.documentSummary.dateRange.latest
                      ? `${report.documentSummary.dateRange.earliest.substring(0, 7)} – ${report.documentSummary.dateRange.latest.substring(0, 7)}`
                      : 'N/A'
                  } small />
                  <StatCard label="Providers" value={report.documentSummary.providersFound.length || 'N/A'} />
                </div>

                {/* VSO Email Draft Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={generateVsoEmailDraft}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1A2C5B] text-white font-semibold rounded-lg hover:bg-[#2563EB] transition-colors text-sm"
                  >
                    <EnvelopeIcon className="h-4 w-4" />
                    Generate VSO Email Draft
                  </button>
                  <button
                    onClick={copyEmailDraftToClipboard}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-slate-300 text-slate-600 font-medium rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors text-sm"
                    title="Copy email draft to clipboard"
                  >
                    {emailCopied
                      ? <><CheckIcon className="h-4 w-4 text-green-600" /><span className="text-green-600 text-xs">Copied!</span></>
                      : <><ClipboardDocumentIcon className="h-4 w-4" /><span className="text-xs">Copy</span></>
                    }
                  </button>
                </div>
                {emailCopied && (
                  <p className="text-green-700 text-xs text-center bg-green-50 rounded-lg px-3 py-2 border border-green-200">
                    Email draft copied to clipboard! Paste it into your email app and send to your VSO representative.
                  </p>
                )}

                {/* Processing Details */}
                {report.scanSynopsis && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <p className="text-gray-500 text-xs font-mono">
                      {report.scanSynopsis.keptParagraphs} paragraphs kept ({report.scanSynopsis.reductionPct}% noise removed) •{' '}
                      {report.scanSynopsis.keywordsDetected.length} keywords detected •{' '}
                      {(report.processingDetails.processingTime / 1000).toFixed(1)}s • {report.processingDetails.aiModel}
                    </p>
                  </div>
                )}

                {/* Keyword Frequency Chart */}
                {report.keywordFrequency.length > 0 && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <h4 className="text-[#1A2C5B] font-semibold text-sm mb-3">Condition Frequency</h4>
                    <ConditionFrequencyChart data={report.keywordFrequency} onBarClick={(_term: string) => {
                      setActiveTab('conditions');
                    }} />
                  </div>
                )}

                {/* Quick Extracted Items List */}
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <h4 className="text-[#1A2C5B] font-semibold text-sm mb-3 sticky top-0 bg-white z-10 pb-2 border-b border-gray-100">Extracted Conditions ({report.extractedItems.length})</h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {report.extractedItems.map((item, i) => (
                      <div key={item.itemId} className="flex items-start gap-3 bg-blue-50 rounded p-3 border border-blue-100">
                        <span className="text-[#1A2C5B] font-mono text-xs mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-gray-900 font-semibold text-sm">{item.condition}</span>
                            <CategoryBadge category={item.category} />
                            <ConfidenceBadge confidence={item.confidence} />
                          </div>
                          {item.excerpt && (
                            <p className="text-gray-500 text-xs mt-1 line-clamp-2 font-mono">&ldquo;{item.excerpt}&rdquo;</p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            {item.pageNumber && (
                              <button
                                onClick={() => scrollToPage(item.pageNumber!, item.excerpt)}
                                className="text-[#2563EB] text-xs hover:underline font-mono"
                              >
                                Page {item.pageNumber}
                              </button>
                            )}
                            {item.dateFound && <span className="text-gray-500 text-xs font-mono">{item.dateFound}</span>}
                            {item.sectionFound && <span className="text-gray-500 text-xs">{item.sectionFound}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(
                            `${item.condition}${item.dateFound ? ` (${item.dateFound})` : ''}${item.pageNumber ? ` — Page ${item.pageNumber}` : ''}\n"${item.excerpt}"`,
                            item.itemId
                          )}
                          className="text-gray-400 hover:text-[#1A2C5B] flex-shrink-0"
                          title="Copy to clipboard"
                        >
                          {copiedId === item.itemId ? <CheckIcon className="h-4 w-4 text-[#1A2C5B]" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && report && (
              <ReconTimeline entries={report.timeline} onPageClick={scrollToPage} />
            )}

            {/* Conditions Index Tab */}
            {activeTab === 'conditions' && report && (
              <ConditionsIndex
                conditions={report.conditionsIndex}
                onPageClick={scrollToPage}
                onCopy={copyToClipboard}
                copiedId={copiedId}
              />
            )}

            {/* Export Tab */}
            {activeTab === 'export' && report && (
              <BriefingPackExport report={report} />
            )}
          </div>
        </div>

        {/* PDF Focus Mode Toggle — chevron between panes */}
        {pdfUrl && (
          <button
            onClick={() => setPdfCollapsed(prev => !prev)}
            className="hidden lg:flex items-center justify-center w-5 bg-blue-50 border-x border-blue-100 hover:bg-blue-100 transition-colors flex-shrink-0 group"
            title={pdfCollapsed ? 'Show PDF viewer' : 'Hide PDF viewer'}
          >
            {pdfCollapsed
              ? <ChevronDoubleLeftIcon className="h-4 w-4 text-slate-400 group-hover:text-[#1A2C5B]" />
              : <ChevronDoubleRightIcon className="h-4 w-4 text-slate-400 group-hover:text-[#1A2C5B]" />
            }
          </button>
        )}

        {/* RIGHT PANE — PDF Viewer with Highlight (hidden on mobile, shown on lg+) */}
        {pdfUrl && !pdfCollapsed && (
          <div className="hidden lg:flex lg:w-[40%] border-l border-blue-100 flex-col bg-gray-50">
            <div className="bg-blue-50 border-b border-blue-100 px-3 py-1.5 flex items-center gap-2">
              <span className="text-gray-600 text-xs font-mono truncate min-w-0">{files[0]?.name || 'Document'}</span>
              <span className="text-gray-400 text-[10px] whitespace-nowrap flex-shrink-0">Page # → jump & highlight</span>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <PdfViewerPaneLoader
                fileUrl={pdfUrl}
                targetPage={pdfTargetPage}
                searchText={pdfSearchText}
                jumpTrigger={pdfKey}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile PDF Floating Button + Modal ─────────────────────────── */}
      {pdfUrl && (
        <>
          {/* Floating button — visible only on mobile when PDF modal is closed */}
          {!showMobilePdf && (
            <button
              onClick={() => setShowMobilePdf(true)}
              className="lg:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-[#1A2C5B] text-white px-4 py-3 rounded-full shadow-lg hover:bg-[#2563EB] transition-colors"
            >
              <DocumentTextIcon className="h-5 w-5" />
              <span className="text-sm font-semibold">View PDF</span>
            </button>
          )}

          {/* Full-screen modal — mobile only */}
          {showMobilePdf && (
            <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-white">
              {/* Modal header */}
              <div className="flex items-center justify-between bg-[#1A2C5B] px-4 py-3 text-white">
                <span className="text-sm font-semibold truncate">{files[0]?.name || 'Document'}</span>
                <button
                  onClick={() => setShowMobilePdf(false)}
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              {/* PDF viewer fills remaining space */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <PdfViewerPaneLoader
                  fileUrl={pdfUrl}
                  targetPage={pdfTargetPage}
                  searchText={pdfSearchText}
                  jumpTrigger={pdfKey}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function StatCard({ label, value, small }: { label: string; value: string | number; small?: boolean }) {
  return (
    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-[#1A2C5B] font-bold ${small ? 'text-sm' : 'text-xl'} font-mono`}>{value}</p>
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    'Musculoskeletal': 'bg-orange-100 text-orange-800',
    'Mental Health': 'bg-purple-100 text-purple-800',
    'Hearing': 'bg-yellow-100 text-yellow-800',
    'Respiratory': 'bg-cyan-100 text-cyan-800',
    'Sleep': 'bg-indigo-100 text-indigo-800',
    'Cardiovascular': 'bg-red-100 text-red-800',
    'Neurological': 'bg-pink-100 text-pink-800',
    'GI': 'bg-lime-100 text-lime-800',
    'Endocrine': 'bg-teal-100 text-teal-800',
    'Genitourinary': 'bg-blue-100 text-blue-800',
    'Dermatological': 'bg-amber-100 text-amber-800',
    'Ophthalmological': 'bg-emerald-100 text-emerald-800',
    'Oncological': 'bg-rose-100 text-rose-800',
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${colors[category] || 'bg-gray-100 text-gray-700'}`}>
      {category}
    </span>
  );
}

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${styles[confidence]}`}>
      {confidence}
    </span>
  );
}

// ─── Horizontal Stepper ──────────────────────────────────────────────────────

const STEPPER_STEPS = ['Upload', 'Analyzing', 'Report Ready'] as const;

function HorizontalStepper({ currentStep }: { currentStep: 0 | 1 | 2 }) {
  return (
    <div className="px-6 py-3 bg-white border-b border-blue-100">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {STEPPER_STEPS.map((label, i) => {
          const isComplete = i < currentStep;
          const isActive = i === currentStep;
          return (
            <React.Fragment key={label}>
              {/* Step circle + label */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isComplete
                      ? 'bg-[#1A2C5B] text-white'
                      : isActive
                        ? 'bg-[#EAB308] text-[#1A2C5B] ring-2 ring-[#EAB308]/30'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isComplete ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`text-[10px] font-medium ${
                  isActive ? 'text-[#1A2C5B]' : isComplete ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  {label}
                </span>
              </div>
              {/* Connector line between steps */}
              {i < STEPPER_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded transition-all duration-500 ${
                  i < currentStep ? 'bg-[#1A2C5B]' : 'bg-slate-200'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
