'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronRightIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  PhotoIcon,
  CheckCircleIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { extractFields, SEA_BAG_KEY, type SeaBagData } from '@/lib/auto-fill/extractFields';

// ─── Constants ──────────────────────────────────────────────────────────────

const BRANCHES = [
  'Army', 'Navy', 'Marine Corps', 'Air Force',
  'Coast Guard', 'Space Force', 'Army National Guard', 'Air National Guard',
];

const DISCHARGE_TYPES = [
  'Honorable',
  'General (Under Honorable Conditions)',
  'Other Than Honorable',
  'Bad Conduct',
  'Dishonorable',
  'Uncharacterized',
];

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
const ACCEPTED_EXT   = '.pdf,.jpg,.jpeg,.png,.webp,.heic';

// ─── Types ──────────────────────────────────────────────────────────────────

interface FormState {
  fullName:             string;
  branch:               string;
  entryDate:            string;
  separationDate:       string;
  mos:                  string;
  characterOfDischarge: string;
  awards:               string;
}

const EMPTY_FORM: FormState = {
  fullName:             '',
  branch:               '',
  entryDate:            '',
  separationDate:       '',
  mos:                  '',
  characterOfDischarge: '',
  awards:               '',
};

function seaBagToForm(data: SeaBagData): FormState {
  return {
    fullName:             data.fullName             ?? '',
    branch:               data.branch               ?? '',
    entryDate:            data.entryDate             ?? '',
    separationDate:       data.separationDate        ?? '',
    mos:                  data.mos                   ?? '',
    characterOfDischarge: data.characterOfDischarge  ?? '',
    awards:               data.awards                ?? '',
  };
}

function computeYears(entry: string, separation: string): string {
  if (!entry || !separation) return '';
  try {
    const s = new Date(entry);
    const e = new Date(separation);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return '';
    const totalMonths = Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    const y = Math.floor(totalMonths / 12);
    const m = totalMonths % 12;
    if (y === 0) return `${m} month${m !== 1 ? 's' : ''}`;
    if (m === 0) return `${y} year${y !== 1 ? 's' : ''}`;
    return `${y} year${y !== 1 ? 's' : ''}, ${m} month${m !== 1 ? 's' : ''}`;
  } catch { return ''; }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AutoFillPanel() {
  const [activeTab,    setActiveTab]    = useState<'upload' | 'manual'>('upload');
  const [seaBag,       setSeaBag]       = useState<SeaBagData | null>(null);
  const [form,         setForm]         = useState<FormState>(EMPTY_FORM);
  const [isHydrated,   setIsHydrated]   = useState(false);
  const [justSaved,    setJustSaved]    = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Upload state
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'reading' | 'ocr' | 'done' | 'error'>('idle');
  const [uploadMsg,    setUploadMsg]    = useState('');
  const [ocrWarning,   setOcrWarning]   = useState(false);
  const [dragOver,     setDragOver]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Hydrate from localStorage ───────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SEA_BAG_KEY);
      if (raw) {
        const parsed: SeaBagData = JSON.parse(raw);
        setSeaBag(parsed);
        setForm(seaBagToForm(parsed));
      }
    } catch { /* ignore */ }
    setIsHydrated(true);
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────
  const yearsOfService = computeYears(form.entryDate, form.separationDate);
  const isFormValid    = !!(form.fullName && form.branch && form.entryDate && form.separationDate && form.mos && form.characterOfDischarge);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const updateForm = useCallback((field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setJustSaved(false);
  }, []);

  // [PREMIUM: autofill_unlimited] Free tier: 1 saved Sea Bag profile. Premium: unlimited profiles.
  const handleSave = useCallback(() => {
    const data: SeaBagData = {
      fullName:             form.fullName             || null,
      branch:               form.branch               || null,
      entryDate:            form.entryDate             || null,
      separationDate:       form.separationDate        || null,
      mos:                  form.mos                   || null,
      characterOfDischarge: form.characterOfDischarge  || null,
      awards:               form.awards                || null,
      yearsOfService:       yearsOfService             || null,
      lastUpdated:          new Date().toISOString(),
      source:               seaBag?.source ?? 'manual',
    };
    localStorage.setItem(SEA_BAG_KEY, JSON.stringify(data));
    setSeaBag(data);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  }, [form, yearsOfService, seaBag]);

  const handleClear = useCallback(() => {
    localStorage.removeItem(SEA_BAG_KEY);
    setSeaBag(null);
    setForm(EMPTY_FORM);
    setShowClearConfirm(false);
    setUploadStatus('idle');
    setOcrWarning(false);
  }, []);

  // ── File processing ───────────────────────────────────────────────────────
  const processFile = useCallback(async (file: File) => {
    const isPdf  = file.type === 'application/pdf';
    const isImg  = file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.heic');

    if (!isPdf && !isImg) {
      setUploadStatus('error');
      setUploadMsg('Unsupported file type. Please upload a PDF, JPG, PNG, or WEBP.');
      return;
    }

    setOcrWarning(false);

    try {
      let rawText = '';

      if (isPdf) {
        setUploadStatus('reading');
        setUploadMsg('Reading PDF text layer…');
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        const buffer  = await file.arrayBuffer();
        const pdf     = await pdfjsLib.getDocument({ data: buffer }).promise;
        const pages: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page    = await pdf.getPage(i);
          const content = await page.getTextContent();
          pages.push(content.items.map((item: { str: string }) => item.str).join(' '));
        }
        rawText = pages.join('\n');
      } else {
        setUploadStatus('ocr');
        setUploadMsg('Running OCR on your document — this may take 15–30 seconds on first use while the engine loads…');
        const Tesseract = await import('tesseract.js');
        const result = await Tesseract.recognize(file, 'eng', {
          logger: (m: { status: string; progress: number }) => {
            if (m.status === 'recognizing text') {
              setUploadMsg(`OCR progress: ${Math.round(m.progress * 100)}%…`);
            }
          },
        });
        rawText = result.data.text;
        const confidence = result.data.confidence;
        if (confidence < 65) {
          setOcrWarning(true);
        }
      }

      // Extract fields from raw text
      const extracted = extractFields(rawText, isPdf ? 'pdf' : 'image');

      // Auto-switch to manual tab for review
      setActiveTab('manual');
      setForm(seaBagToForm(extracted));
      setUploadStatus('done');
      setUploadMsg('Extraction complete — review and correct fields below, then save.');

    } catch (err) {
      console.error('[AutoFill] Extraction error:', err);
      setUploadStatus('error');
      setUploadMsg('Could not read this file. Try a higher-quality image or type your info manually below.');
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A2C5B]" />
      </div>
    );
  }

  const seaBagDate = seaBag?.lastUpdated
    ? new Date(seaBag.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Clear Confirm Modal ──────────────────────────────────────────── */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">
            <div className="bg-[#B22234] px-6 py-4">
              <h2 className="text-lg font-extrabold text-white">Clear Digital Sea Bag?</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                This will remove all saved data from your device. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleClear}
                  className="flex-1 py-2.5 bg-[#B22234] text-white font-bold rounded-xl text-sm hover:bg-red-700 transition-colors"
                >
                  Yes, Clear Sea Bag
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1 text-sm text-gray-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#1A2C5B] transition-colors">Home</Link>
            <ChevronRightIcon className="h-3 w-3" />
            <span className="text-[#1A2C5B] font-medium">Auto-Fill Engine</span>
          </nav>
        </div>
      </div>

      {/* ── Page Hero ────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0F1D3D] via-[#1A2C5B] to-[#1e3a7a] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-xs text-white/70 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#EAB308] animate-pulse" aria-hidden="true" />
            100% private · Processed in your browser only
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
            Auto-Fill Engine
          </h1>
          <p className="text-white/70 max-w-xl text-sm md:text-base leading-relaxed">
            Upload your DD-214 once. Fields are extracted privately in your browser — nothing is sent to any server. Store in your Digital Sea Bag for instant form pre-population.
          </p>
        </div>
      </div>

      {/* ── Sea Bag Status Bar ───────────────────────────────────────────── */}
      <div className={`border-b ${seaBag ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {seaBag ? (
              <>
                <CheckCircleSolid className="h-4 w-4 text-emerald-500 flex-shrink-0" aria-hidden="true" />
                <span className="text-sm font-semibold text-emerald-800">
                  Sea Bag loaded — last updated {seaBagDate}
                </span>
                {seaBag.fullName && (
                  <span className="hidden sm:inline text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {seaBag.fullName.split(',')[0]}
                  </span>
                )}
              </>
            ) : (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-400 flex-shrink-0" aria-hidden="true" />
                <span className="text-sm text-gray-500">Sea Bag is empty — upload your DD-214 or enter manually</span>
              </>
            )}
          </div>
          {seaBag && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors flex-shrink-0"
              aria-label="Clear Digital Sea Bag"
            >
              <TrashIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Clear Sea Bag
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Tab Bar ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {(['upload', 'manual'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-sm font-semibold transition-all focus:outline-none ${
                  activeTab === tab
                    ? 'text-[#1A2C5B] border-b-2 border-[#1A2C5B] bg-blue-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                aria-selected={activeTab === tab}
                role="tab"
              >
                <div className="flex items-center justify-center gap-2">
                  {tab === 'upload'
                    ? <ArrowUpTrayIcon className="h-4 w-4" aria-hidden="true" />
                    : <DocumentTextIcon className="h-4 w-4" aria-hidden="true" />
                  }
                  {tab === 'upload' ? 'Upload Document' : 'Enter Manually'}
                </div>
              </button>
            ))}
          </div>

          {/* ── Tab 1: Upload ────────────────────────────────────────────── */}
          {activeTab === 'upload' && (
            <div className="p-6 space-y-5">
              <div>
                <h2 className="text-base font-extrabold text-[#1A2C5B] mb-1">Upload DD-214 or Service Document</h2>
                <p className="text-xs text-gray-500 leading-relaxed">
                  PDF (digital), JPG, PNG, or WEBP (phone photo). All processing happens locally in your browser — no data is transmitted.
                </p>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
                  dragOver
                    ? 'border-[#1A2C5B] bg-blue-50'
                    : 'border-gray-200 hover:border-[#1A2C5B] hover:bg-blue-50/40'
                } ${uploadStatus === 'reading' || uploadStatus === 'ocr' ? 'pointer-events-none opacity-70' : ''}`}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                aria-label="Upload DD-214 or service document"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_EXT}
                  onChange={handleFileChange}
                  className="hidden"
                  aria-hidden="true"
                />

                {uploadStatus === 'idle' || uploadStatus === 'done' || uploadStatus === 'error' ? (
                  <>
                    <div className="flex justify-center gap-4 mb-4">
                      <DocumentTextIcon className="h-10 w-10 text-gray-300" aria-hidden="true" />
                      <PhotoIcon        className="h-10 w-10 text-gray-300" aria-hidden="true" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      Drop your file here, or click to browse
                    </p>
                    <p className="text-xs text-gray-400">
                      PDF (digital copy) · JPG / PNG / WEBP (phone photo or scan)
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-gray-200 border-t-[#1A2C5B] rounded-full animate-spin" aria-hidden="true" />
                    <p className="text-sm font-semibold text-gray-700 max-w-xs">{uploadMsg}</p>
                  </div>
                )}
              </div>

              {/* OCR warning */}
              {ocrWarning && (
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3" role="alert">
                  <ExclamationTriangleIcon className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Low image confidence</strong> — some fields may be blank or incorrect. Please review and correct all fields in the &ldquo;Enter Manually&rdquo; tab before saving.
                  </p>
                </div>
              )}

              {/* Status messages */}
              {uploadStatus === 'done' && !ocrWarning && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                  <CheckCircleIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  {uploadMsg}
                </div>
              )}
              {uploadStatus === 'error' && (
                <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3" role="alert">
                  <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  {uploadMsg}
                </div>
              )}

              {/* Manual fallback hint */}
              <div className="flex items-start gap-2 text-xs text-gray-400">
                <InformationCircleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Having trouble? Switch to{' '}
                  <button onClick={() => setActiveTab('manual')} className="text-[#1A2C5B] font-semibold hover:underline">
                    Enter Manually
                  </button>{' '}
                  to type your information directly.
                </span>
              </div>
            </div>
          )}

          {/* ── Tab 2: Manual Entry ───────────────────────────────────────── */}
          {activeTab === 'manual' && (
            <div className="p-6 space-y-5">
              <div>
                <h2 className="text-base font-extrabold text-[#1A2C5B] mb-1">
                  {seaBag ? 'Review & Update Sea Bag' : 'Enter Your Service Information'}
                </h2>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {uploadStatus === 'done'
                    ? 'Fields were auto-populated from your document. Review and correct anything below, then save.'
                    : seaBag
                    ? 'Your saved data is pre-filled. Update any fields and save.'
                    : 'Enter your DD-214 information. All data stays on your device.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label htmlFor="af-name" className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                    <span className="text-gray-400 font-normal ml-1">(Last, First Middle — as on DD-214)</span>
                  </label>
                  <input
                    id="af-name"
                    type="text"
                    value={form.fullName}
                    onChange={e => updateForm('fullName', e.target.value)}
                    placeholder="SMITH, JOHN EDWARD"
                    className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1A2C5B]/30 focus:border-[#1A2C5B] transition-all"
                  />
                </div>

                {/* Branch */}
                <div>
                  <label htmlFor="af-branch" className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Branch of Service <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="af-branch"
                    value={form.branch}
                    onChange={e => updateForm('branch', e.target.value)}
                    className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A2C5B]/30 focus:border-[#1A2C5B] transition-all bg-white"
                  >
                    <option value="">Select branch…</option>
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                {/* Character of Discharge */}
                <div>
                  <label htmlFor="af-discharge" className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Character of Discharge <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="af-discharge"
                    value={form.characterOfDischarge}
                    onChange={e => updateForm('characterOfDischarge', e.target.value)}
                    className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A2C5B]/30 focus:border-[#1A2C5B] transition-all bg-white"
                  >
                    <option value="">Select discharge type…</option>
                    {DISCHARGE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {/* Entry Date */}
                <div>
                  <label htmlFor="af-entry" className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Date Entered Active Duty <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="af-entry"
                    type="date"
                    value={form.entryDate}
                    onChange={e => updateForm('entryDate', e.target.value)}
                    className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A2C5B]/30 focus:border-[#1A2C5B] transition-all"
                  />
                </div>

                {/* Separation Date */}
                <div>
                  <label htmlFor="af-sep" className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Date of Separation <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="af-sep"
                    type="date"
                    value={form.separationDate}
                    onChange={e => updateForm('separationDate', e.target.value)}
                    className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A2C5B]/30 focus:border-[#1A2C5B] transition-all"
                  />
                </div>

                {/* Years of Service (auto-calc) */}
                {yearsOfService && (
                  <div className="sm:col-span-2">
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
                      <CheckCircleIcon className="h-4 w-4 text-blue-500 flex-shrink-0" aria-hidden="true" />
                      <span className="text-sm text-[#1A2C5B]">
                        <strong>Years of Service:</strong> {yearsOfService}
                      </span>
                    </div>
                  </div>
                )}

                {/* MOS */}
                <div className="sm:col-span-2">
                  <label htmlFor="af-mos" className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Primary MOS / Rate / Specialty <span className="text-red-500">*</span>
                    <span className="text-gray-400 font-normal ml-1">(e.g., 11B Infantry, HM Hospital Corpsman)</span>
                  </label>
                  <input
                    id="af-mos"
                    type="text"
                    value={form.mos}
                    onChange={e => updateForm('mos', e.target.value)}
                    placeholder="11B Infantry"
                    className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1A2C5B]/30 focus:border-[#1A2C5B] transition-all"
                  />
                </div>

                {/* Awards */}
                <div className="sm:col-span-2">
                  <label htmlFor="af-awards" className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Awards / Medals <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="af-awards"
                    value={form.awards}
                    onChange={e => updateForm('awards', e.target.value)}
                    placeholder="Purple Heart, Army Commendation Medal, Combat Infantryman Badge…"
                    rows={3}
                    className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1A2C5B]/30 focus:border-[#1A2C5B] transition-all resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  onClick={handleSave}
                  disabled={!isFormValid}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                    justSaved
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[#1A2C5B] text-white hover:bg-[#0F1D3D] hover:shadow-md hover:-translate-y-0.5'
                  } flex items-center justify-center gap-2`}
                  aria-label="Save to Digital Sea Bag"
                >
                  {justSaved ? (
                    <><CheckCircleSolid className="h-4 w-4" aria-hidden="true" /> Sea Bag Updated!</>
                  ) : (
                    <>Save to Digital Sea Bag</>
                  )}
                </button>

                {seaBag && (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                    aria-label="Clear Digital Sea Bag"
                  >
                    <TrashIcon className="h-4 w-4" aria-hidden="true" />
                    Clear Sea Bag
                  </button>
                )}
              </div>

              {!isFormValid && (
                <p className="text-[11px] text-gray-400 text-center">
                  Fill in all 6 required fields (<span className="text-red-400">*</span>) to enable save
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Legal Disclaimer ─────────────────────────────────────────────── */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            <strong className="text-gray-500">Auto-Fill processes your document entirely in your browser</strong> — nothing is sent to any server. SSNs are never extracted or stored. This is a convenience tool only, not claims assistance, and does not constitute legal advice. Always verify pre-filled data before submitting any form. Data is stored locally on your device only.
          </p>
        </div>
      </div>
    </div>
  );
}
