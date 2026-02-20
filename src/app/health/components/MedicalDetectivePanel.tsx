'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  DocumentMagnifyingGlassIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XMarkIcon,
  ShieldExclamationIcon,
  ArrowRightIcon,
  FlagIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  type: string;
  size: number;
}

interface FlaggedItem {
  flagId: string;
  label: string;
  category: string;
  excerpt: string;
  context: string;
  dateFound?: string;
  pageNumber?: string;
  suggestedClaimCategory: string;
  confidence: 'high' | 'medium' | 'low';
}

interface ScanSynopsis {
  totalPages: number;
  totalParagraphs: number;
  keptParagraphs: number;
  reductionPct: number;
  keywordsDetected: string[];
  sectionHeadersFound: string[];
}

interface KeywordFlag {
  condition: string;
  confidence: string;
  excerpt: string;
}

interface CachedScan {
  filteredText: string;
  keywordFlags: KeywordFlag[];
  synopsis: ScanSynopsis;
  fileNames: string;
}

interface DetectiveReport {
  disclaimer: string;
  summary: string;
  totalFlagsFound: number;
  flaggedItems: FlaggedItem[];
  suggestedNextSteps: string[];
  processingDetails: {
    filesProcessed: number;
    processingTime: number;
    aiModel: string;
  };
  scanSynopsis?: ScanSynopsis;
  isInterim?: boolean;
  interimNote?: string;
}

type PanelState = 'upload' | 'processing' | 'results' | 'no_flags' | 'error';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB — supports large VA Blue Button exports
const MAX_FILES = 5;

const DISCLAIMER_TEXT = `This report is for informational purposes only and does not constitute medical or legal advice. This tool does not file claims. Please share this report with your accredited VSO or claims representative for professional review.`;

const CATEGORY_COLORS: Record<string, string> = {
  'Sleep Disorders': 'bg-indigo-100 text-indigo-800',
  'Hearing': 'bg-purple-100 text-purple-800',
  'Neurological': 'bg-pink-100 text-pink-800',
  'Mental Health': 'bg-blue-100 text-blue-800',
  'Musculoskeletal': 'bg-orange-100 text-orange-800',
  'Dermatological': 'bg-teal-100 text-teal-800',
  'Respiratory': 'bg-cyan-100 text-cyan-800',
  'Cardiovascular': 'bg-red-100 text-red-800',
  'Endocrine': 'bg-amber-100 text-amber-800',
  'Ophthalmological': 'bg-emerald-100 text-emerald-800',
  'Gastrointestinal': 'bg-lime-100 text-lime-800',
  'Oncological': 'bg-rose-100 text-rose-800',
  'PACT Act Presumptive': 'bg-yellow-100 text-yellow-900 font-semibold',
  'Claim Language': 'bg-[#1A2C5B]/10 text-[#1A2C5B] font-semibold',
  'Other': 'bg-gray-100 text-gray-800',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MedicalDetectivePanel() {
  const [panelState, setPanelState] = useState<PanelState>('upload');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [report, setReport] = useState<DetectiveReport | null>(null);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('Starting...');
  const [isDragOver, setIsDragOver] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedRemaining, setEstimatedRemaining] = useState<number | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string>('init');
  const [liveFlags, setLiveFlags] = useState<Array<{ condition: string; confidence: string; excerpt: string }>>([]);
  const [cachedScan, setCachedScan] = useState<CachedScan | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Elapsed time counter during processing
  useEffect(() => {
    if (panelState === 'processing') {
      setElapsedTime(0);
      elapsedTimerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    }
    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [panelState]);

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = [];
    const errors: string[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      if (files.length + newFiles.length >= MAX_FILES) {
        errors.push(`Maximum ${MAX_FILES} files allowed.`);
        break;
      }

      if (!ACCEPTED_TYPES.includes(file.type)) {
        errors.push(`"${file.name}" is not a supported format. Use PNG, JPG, or PDF.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`"${file.name}" exceeds 50MB limit.`);
        continue;
      }

      newFiles.push({
        id: `${Date.now()}-${i}`,
        file,
        name: file.name,
        type: file.type,
        size: file.size,
      });
    }

    if (errors.length > 0) {
      setError(errors.join(' '));
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length]);

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Remove a file
  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setError('');
  };

  // Retry deep analysis using cached filtered text — skips re-upload
  const handleRetry = useCallback(async () => {
    if (!cachedScan) return;

    setPanelState('processing');
    setProgress(30);
    setProgressMsg('Retrying deep AI analysis (using cached scan data)...');
    setError('');
    setEstimatedRemaining(null);
    setCurrentPhase('synthesis');
    setLiveFlags([]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch('/api/health/medical-detective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retryFilteredText: cachedScan.filteredText,
          retrySynopsis: cachedScan.synopsis,
          retryKeywordFlags: cachedScan.keywordFlags,
          retryFileNames: cachedScan.fileNames,
        }),
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error('Server error on retry. Please try again.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        if (abortController.signal.aborted) { reader.cancel(); throw new Error('Scan cancelled by user.'); }
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.type === 'progress') {
              setProgressMsg(event.message || '');
              if (typeof event.percent === 'number') setProgress(event.percent);
              if (event.phase) setCurrentPhase(event.phase);
            } else if (event.type === 'complete') {
              const r: DetectiveReport = event.report;
              setReport(r);
              setProgress(100);
              setEstimatedRemaining(null);
              setPanelState(r.totalFlagsFound > 0 ? 'results' : 'no_flags');
              return;
            } else if (event.type === 'error') {
              throw new Error(event.message || 'Retry failed.');
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && (parseErr.message.includes('cancelled') || parseErr.message.includes('failed'))) throw parseErr;
          }
        }
      }
    } catch (err) {
      const msg = (err as Error).message || 'Retry failed.';
      if ((err as Error).name === 'AbortError' || msg.includes('cancelled')) {
        setError('Scan cancelled. Your files were not stored.');
      } else {
        setError(msg);
      }
      setPanelState('error');
    } finally {
      abortControllerRef.current = null;
    }
  }, [cachedScan]);

  // Cancel an in-progress scan
  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setError('Scan cancelled by user.');
    setPanelState('error');
  }, []);

  // Reset back to upload state
  const handleReset = useCallback(() => {
    setFiles([]);
    setReport(null);
    setError('');
    setProgress(0);
    setProgressMsg('Starting...');
    setLiveFlags([]);
    setPanelState('upload');
    // Note: cachedScan intentionally preserved so Retry still works after reset
  }, []);

  // Process files — streaming NDJSON fetch
  const handleScan = async () => {
    if (files.length === 0) return;

    setPanelState('processing');
    setProgress(0);
    setProgressMsg('Preparing files...');
    setError('');
    setEstimatedRemaining(null);
    setCurrentPhase('init');
    setLiveFlags([]);
    setCachedScan(null); // clear previous cached scan on new upload

    // Create abort controller for cancellation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Convert all files to base64
      const fileData = [];
      const totalSize = files.reduce((sum, f) => sum + f.size, 0);
      const isLargeUpload = totalSize > 5 * 1024 * 1024; // > 5MB

      for (let i = 0; i < files.length; i++) {
        if (abortController.signal.aborted) throw new Error('Scan cancelled by user.');
        const sizeLabel = isLargeUpload ? ` (${(files[i].size / (1024 * 1024)).toFixed(1)}MB)` : '';
        setProgressMsg(`Reading file ${i + 1} of ${files.length}: "${files[i].name}"${sizeLabel}...`);
        setProgress(Math.round(((i + 0.5) / files.length) * 10));
        const base64 = await fileToBase64(files[i].file);
        fileData.push({ name: files[i].name, type: files[i].type, data: base64, size: files[i].size });
      }

      if (abortController.signal.aborted) throw new Error('Scan cancelled by user.');

      const uploadSizeLabel = isLargeUpload
        ? ` (${(totalSize / (1024 * 1024)).toFixed(1)}MB — large file, this may take a moment)...`
        : '...';
      setProgressMsg(`Uploading to analysis engine${uploadSizeLabel}`);
      setProgress(12);

      const response = await fetch('/api/health/medical-detective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: fileData }),
        signal: abortController.signal,
      });

      // Free the base64 data from client memory immediately after upload
      fileData.length = 0;

      if (!response.ok || !response.body) {
        const text = await response.text();
        throw new Error(text || 'Server error. Please try again.');
      }

      // Read streaming NDJSON response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        if (abortController.signal.aborted) {
          reader.cancel();
          throw new Error('Scan cancelled by user.');
        }

        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.type === 'progress') {
              setProgressMsg(event.message || '');
              if (typeof event.percent === 'number') setProgress(event.percent);
              if (event.phase) setCurrentPhase(event.phase);
              // Parse estimated remaining from server message
              const etaMatch = (event.message || '').match(/~(\d+)s remaining/);
              if (etaMatch) setEstimatedRemaining(parseInt(etaMatch[1], 10));
            } else if (event.type === 'file_ready') {
              const reduction = event.reductionPct ? ` — ${event.reductionPct}% noise removed` : '';
              setProgressMsg(`"${event.fileName}" ready — ${event.numPages} pages → ${event.filteredChunks || event.numChunks} section(s)${reduction}`);
            } else if (event.type === 'keyword_flag' || event.type === 'screening_flag') {
              // Live flag from Phase 1 keyword pre-filter (v4) or Phase 2 screening (v3 compat)
              if (event.flag) {
                setLiveFlags(prev => [...prev, event.flag]);
              }
            } else if (event.type === 'scan_cache') {
              // Store filtered text + synopsis for fast retry (no re-upload)
              setCachedScan({
                filteredText: event.filteredText || '',
                keywordFlags: event.keywordFlags || [],
                synopsis: event.synopsis,
                fileNames: event.fileNames || '',
              });
            } else if (event.type === 'complete') {
              const r: DetectiveReport = event.report;
              setReport(r);
              setProgress(100);
              setEstimatedRemaining(null);
              setFiles([]); // clear from memory
              setPanelState(r.totalFlagsFound > 0 ? 'results' : 'no_flags');
              return;
            } else if (event.type === 'error') {
              throw new Error(event.message || 'Processing failed.');
            }
          } catch (parseErr) {
            // Only re-throw if it's an actual Error we created (not JSON parse failure)
            if (parseErr instanceof Error && parseErr.message.includes('cancelled')) throw parseErr;
            if (parseErr instanceof Error && parseErr.message.includes('Processing failed')) throw parseErr;
            if (parseErr instanceof Error && parseErr.message.includes('API error')) throw parseErr;
            // Otherwise ignore malformed JSON lines
          }
        }
      }
    } catch (err) {
      const msg = (err as Error).message || 'An error occurred. Please try again.';
      // Don't log abort errors as console errors
      if ((err as Error).name === 'AbortError' || msg.includes('cancelled')) {
        console.log('[MedicalDetective] Scan cancelled by user.');
        setError('Scan cancelled. Your files were not stored.');
      } else {
        console.error('[MedicalDetective]', err);
        setError(msg);
      }
      setPanelState('error');
    } finally {
      abortControllerRef.current = null;
    }
  };

  // Generate printable HTML report (user prints to PDF via browser)
  const handleDownloadReport = () => {
    if (!report) return;
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const flagRows = report.flaggedItems.map((item, i) => `
      <div class="flag-item ${item.confidence}">
        <div class="flag-header">
          <span class="flag-num">${i + 1}.</span>
          <span class="flag-label">${item.label}</span>
          <span class="flag-badge">${item.category}</span>
          <span class="conf-badge conf-${item.confidence}">${item.confidence.toUpperCase()}</span>
        </div>
        ${item.excerpt ? `<div class="flag-quote">&ldquo;${item.excerpt}&rdquo;</div>` : ''}
        <div class="flag-meta">
          ${item.dateFound ? `<span>📅 Date: <strong>${item.dateFound}</strong></span>` : ''}
          ${item.pageNumber ? `<span>📄 Page: <strong>${item.pageNumber}</strong></span>` : ''}
          <span>Category: <strong>${item.suggestedClaimCategory}</strong></span>
        </div>
        ${item.context && item.context !== item.label ? `<div class="flag-context">${item.context}</div>` : ''}
      </div>`).join('');

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>Vet1Stop Personal Evidence Report — ${date}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',sans-serif;padding:40px;color:#1F2937;line-height:1.6}
.header{text-align:center;border-bottom:3px solid #1A2C5B;padding-bottom:18px;margin-bottom:22px}
.header h1{color:#1A2C5B;font-size:22px}
.header p{color:#6B7280;font-size:11px;margin-top:4px}
.disclaimer{background:#FEF3C7;border:2px solid #F59E0B;border-radius:8px;padding:14px;margin-bottom:22px;font-size:11px;color:#92400E}
.disclaimer strong{display:block;font-size:13px;margin-bottom:5px}
.summary{background:#EFF6FF;border-radius:8px;padding:14px;margin-bottom:22px}
.summary h2{color:#1A2C5B;font-size:15px;margin-bottom:6px}
.flag-section h2{color:#1A2C5B;font-size:17px;margin-bottom:14px;border-bottom:1px solid #E5E7EB;padding-bottom:5px}
.flag-item{border:1px solid #E5E7EB;border-radius:8px;padding:14px;margin-bottom:10px;page-break-inside:avoid}
.flag-item.high{border-left:4px solid #1A2C5B}
.flag-item.medium{border-left:4px solid #F59E0B}
.flag-item.low{border-left:4px solid #9CA3AF}
.flag-header{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px}
.flag-num{color:#6B7280;font-size:13px}
.flag-label{font-weight:700;color:#1A2C5B;font-size:14px;flex:1}
.flag-badge{background:#F3F4F6;padding:2px 8px;border-radius:4px;font-size:10px;color:#4B5563}
.conf-badge{padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700}
.conf-high{background:#DBEAFE;color:#1E40AF}
.conf-medium{background:#FEF3C7;color:#92400E}
.conf-low{background:#F3F4F6;color:#6B7280}
.flag-quote{background:#FFFBEB;border-left:3px solid #F59E0B;padding:8px 12px;border-radius:4px;font-size:12px;color:#92400E;font-style:italic;margin-bottom:7px}
.flag-meta{font-size:11px;color:#6B7280;display:flex;flex-wrap:wrap;gap:12px}
.flag-context{font-size:11px;color:#374151;margin-top:6px;padding:6px 10px;background:#F9FAFB;border-radius:4px}
.next-steps{background:#F0FDF4;border-radius:8px;padding:14px;margin-top:22px}
.next-steps h2{color:#166534;font-size:15px;margin-bottom:8px}
.next-steps ol{padding-left:20px}
.next-steps li{font-size:12px;margin-bottom:4px}
.footer{margin-top:28px;text-align:center;font-size:10px;color:#9CA3AF;border-top:1px solid #E5E7EB;padding-top:14px}
.no-print{text-align:center;margin-top:20px}
@media print{.no-print{display:none}body{padding:20px}}
</style></head><body>
<div class="header">
  <h1>🔍 Vet1Stop Personal Evidence Report</h1>
  <p>Generated: ${date} | Files Processed: ${report.processingDetails.filesProcessed} | Flags Found: ${report.totalFlagsFound}</p>
  <p>Analyzed by: ${report.processingDetails.aiModel} | Processing Time: ${(report.processingDetails.processingTime / 1000).toFixed(1)}s</p>
</div>
<div class="disclaimer">
  <strong>⚠ IMPORTANT DISCLAIMER</strong>
  ${DISCLAIMER_TEXT}
</div>
<div class="summary"><h2>Summary</h2><p>${report.summary}</p></div>
<div class="flag-section">
  <h2>Flagged Findings (${report.totalFlagsFound})</h2>
  ${flagRows || '<p style="color:#6B7280;font-size:13px">No flags identified.</p>'}
</div>
<div class="next-steps">
  <h2>Suggested Next Steps</h2>
  <ol>${report.suggestedNextSteps.map(s => `<li>${s}</li>`).join('')}</ol>
</div>
<div class="footer">
  <p>Generated by Vet1Stop Medical Detective — for informational purposes only.</p>
  <p><strong>This is NOT medical or legal advice.</strong> Share with your VSO or accredited claims representative.</p>
  <p>No files were stored. Zero HIPAA exposure.</p>
</div>
<div class="no-print">
  <button onclick="window.print()" style="padding:10px 28px;background:#1A2C5B;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600">
    Print / Save as PDF
  </button>
</div>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) win.onload = () => URL.revokeObjectURL(url);
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-4xl mx-auto">

      {/* ── Bold Disclaimer — always visible ── */}
      <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <ShieldExclamationIcon className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900 mb-1">⚠ Not Medical or Legal Advice</p>
            <p className="text-xs text-amber-800 leading-relaxed font-semibold">{DISCLAIMER_TEXT}</p>
          </div>
        </div>
      </div>

      {/* ─── Upload State ─── */}
      {panelState === 'upload' && (
        <div>
          {/* How It Works */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-[#1A2C5B] mb-2">How It Works</h4>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Upload your own VA medical records (PDFs, screenshots, or Blue Button export)</li>
              <li>AI scans for 25+ high-value flags (conditions, claim language, PACT Act presumptives)</li>
              <li>Instantly generates a &quot;Personal Evidence Report&quot; with highlighted findings</li>
              <li>Files are <strong>auto-deleted immediately</strong> after processing — never stored</li>
            </ol>
          </div>

          {/* Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-[#1A2C5B] bg-blue-50'
                : 'border-gray-300 hover:border-[#1A2C5B] hover:bg-gray-50'
            }`}
            role="button"
            aria-label="Upload VA medical records"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-lg font-semibold text-[#1A2C5B] mb-1">
              Drop files here or click to upload
            </p>
            <p className="text-sm text-gray-500">
              PDF, PNG, JPG — Max 50MB per file, up to {MAX_FILES} files
            </p>
            <p className="text-xs text-gray-400 mt-2">
              VA Blue Button exports, medical records, progress notes, lab results
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={e => handleFileSelect(e.target.files)}
              className="hidden"
              aria-label="Select files to upload"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Selected Files ({files.length}/{MAX_FILES})
              </h4>
              <div className="space-y-2">
                {files.map(f => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <DocumentMagnifyingGlassIcon className="h-5 w-5 text-[#1A2C5B] flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                        <p className="text-xs text-gray-500">{formatSize(f.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      aria-label={`Remove ${f.name}`}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Scan Button */}
              <button
                onClick={handleScan}
                className="w-full mt-4 inline-flex items-center justify-center px-6 py-4 rounded-lg bg-[#1A2C5B] text-white font-semibold text-lg hover:bg-[#0F1D3D] transition-colors focus:outline-none focus:ring-4 focus:ring-blue-200"
              >
                <DocumentMagnifyingGlassIcon className="mr-2 h-6 w-6" />
                Scan for Evidence Flags
              </button>

              <p className="text-xs text-gray-400 text-center mt-2">
                Files will be processed in memory only and deleted immediately after scanning.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── Processing State ─── */}
      {panelState === 'processing' && (
        <div className="py-10">
          <h3 className="text-xl font-bold text-[#1A2C5B] text-center mb-4">
            Scanning Your Records...
          </h3>

          {/* Phase indicator — v4: 2 phases only */}
          <div className="flex justify-center gap-2 mb-4">
            {['filter', 'synthesis'].map((phase, i) => {
              const labels = ['Pre-Filter', 'Deep Analysis'];
              const phaseOrder = ['filter', 'synthesis'];
              const currentIdx = phaseOrder.indexOf(currentPhase.replace('_done', ''));
              const isDone = i < currentIdx || currentPhase.includes('_done') && i <= currentIdx;
              const isActive = currentPhase.startsWith(phase);
              return (
                <div key={phase} className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  isDone ? 'bg-green-100 text-green-800' : isActive ? 'bg-blue-100 text-blue-800 animate-pulse' : 'bg-gray-100 text-gray-400'
                }`}>
                  {isDone && <CheckCircleIcon className="h-3.5 w-3.5" />}
                  <span>{labels[i]}</span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span className="font-medium truncate max-w-[70%]">{progressMsg}</span>
              <span className="font-bold text-[#1A2C5B] ml-2">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-[#1A2C5B] h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Elapsed / ETA display */}
          <div className="flex justify-center gap-6 text-xs text-gray-500 mt-2 mb-4">
            <span>Elapsed: <strong>{Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, '0')}</strong></span>
            {estimatedRemaining !== null && estimatedRemaining > 0 && (
              <span>Est. remaining: <strong>~{estimatedRemaining < 60 ? `${estimatedRemaining}s` : `${Math.floor(estimatedRemaining / 60)}m ${estimatedRemaining % 60}s`}</strong></span>
            )}
          </div>

          {/* Live flags found during screening */}
          {liveFlags.length > 0 && (
            <div className="mb-4 border border-green-200 rounded-lg bg-green-50/50 p-3">
              <p className="text-xs font-semibold text-green-800 mb-2">
                <FlagIcon className="inline h-3.5 w-3.5 mr-1" />
                {liveFlags.length} flag{liveFlags.length !== 1 ? 's' : ''} found so far:
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {liveFlags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      flag.confidence === 'high' ? 'bg-red-100 text-red-700' : flag.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                    }`}>{flag.confidence}</span>
                    <span className="text-gray-700 font-medium">{flag.condition}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cancel button */}
          <div className="text-center mb-4">
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <XMarkIcon className="mr-1.5 h-4 w-4" />
              Cancel Scan
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center mt-2">
            2-phase pipeline: Smart pre-filter (85 keywords + section headers) → single Grok 4 deep analysis (~25-65s).
          </p>
          <p className="text-xs text-gray-400 text-center mt-1">
            Files are processed in memory only — never stored permanently.
          </p>
        </div>
      )}

      {/* ─── Error State ─── */}
      {panelState === 'error' && (
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Processing Error</h3>
          <p className="text-gray-600 mb-6 text-sm max-w-md mx-auto">{error || 'Something went wrong. Please try again.'}</p>
          <button onClick={handleReset} className="inline-flex items-center px-6 py-3 rounded-lg bg-[#1A2C5B] text-white font-semibold hover:bg-[#0F1D3D] transition-colors">
            Try Again
          </button>
        </div>
      )}

      {/* ─── No Flags Found State ─── */}
      {panelState === 'no_flags' && report && (
        <div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center mb-6">
            <InformationCircleIcon className="h-14 w-14 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-700 mb-2">No Strong Claim-Relevant Flags Identified</h3>
            <p className="text-sm text-gray-600 max-w-lg mx-auto mb-4">
              The AI did not find strong evidence flags in the uploaded document(s). This does <strong>not</strong> mean there are no valid claims — it may mean additional records are needed.
            </p>

            {/* Scan Synopsis — default OPEN on no_flags */}
            {report.scanSynopsis && (
              <details open className="bg-white border border-gray-200 rounded-lg p-4 text-left mb-4">
                <summary className="text-sm font-semibold text-[#1A2C5B] cursor-pointer select-none">What was scanned</summary>
                <div className="mt-3 space-y-2 text-xs text-gray-600">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="bg-gray-50 rounded p-2"><strong className="block text-gray-800">{report.scanSynopsis.totalPages}</strong>Pages scanned</div>
                    <div className="bg-gray-50 rounded p-2"><strong className="block text-gray-800">{report.scanSynopsis.totalParagraphs.toLocaleString()}</strong>Total paragraphs</div>
                    <div className="bg-gray-50 rounded p-2"><strong className="block text-gray-800">{report.scanSynopsis.keptParagraphs.toLocaleString()}</strong>Kept for analysis</div>
                    <div className="bg-gray-50 rounded p-2"><strong className="block text-gray-800">{report.scanSynopsis.reductionPct}%</strong>Noise removed</div>
                    <div className="bg-gray-50 rounded p-2"><strong className="block text-gray-800">{report.scanSynopsis.keywordsDetected.length}</strong>Keywords detected</div>
                    <div className="bg-gray-50 rounded p-2"><strong className="block text-gray-800">{report.scanSynopsis.sectionHeadersFound.length}</strong>Clinical sections</div>
                  </div>
                  {report.scanSynopsis.keywordsDetected.length > 0 && (
                    <p className="text-xs"><strong>Keywords found:</strong> {report.scanSynopsis.keywordsDetected.slice(0, 15).join(', ')}{report.scanSynopsis.keywordsDetected.length > 15 ? ` (+${report.scanSynopsis.keywordsDetected.length - 15} more)` : ''}</p>
                  )}
                  {report.scanSynopsis.sectionHeadersFound.length > 0 && (
                    <p className="text-xs"><strong>Sections found:</strong> {report.scanSynopsis.sectionHeadersFound.join(', ')}</p>
                  )}
                </div>
              </details>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left mb-4">
              <p className="text-sm font-semibold text-[#1A2C5B] mb-2">What to try next:</p>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>Upload your VA Blue Button report (includes all VA visits)</li>
                <li>Upload individual progress notes, radiology reports, or C&amp;P exam results</li>
                <li>Upload discharge documents or separation physical results</li>
                <li>Contact a free VSO (DAV, VFW, American Legion) for a hands-on records review</li>
              </ul>
            </div>
            <p className="text-xs text-gray-500">
              Processed {report.processingDetails.filesProcessed} file(s) in {(report.processingDetails.processingTime / 1000).toFixed(1)}s using {report.processingDetails.aiModel}
            </p>
            <p className="text-xs text-gray-400 mt-1">Processed in memory only — deleted immediately after scan.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={handleReset} className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#1A2C5B] text-white font-semibold hover:bg-[#0F1D3D] transition-colors">
              <CloudArrowUpIcon className="mr-2 h-5 w-5" />
              Upload Different Records
            </button>
            <a href="https://www.va.gov/vso/" target="_blank" rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#EAB308] text-[#1A2C5B] font-semibold hover:bg-[#FACC15] transition-colors">
              Find a Free VSO
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>
      )}

      {/* ─── Results State ─── */}
      {panelState === 'results' && report && (
        <div>
          {/* Summary banner — amber for interim, blue for full */}
          {report.isInterim ? (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-semibold text-amber-900">Interim Report — {report.totalFlagsFound} Pre-Filter Flag(s)</h4>
                    <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-medium">Interim</span>
                  </div>
                  <p className="text-sm text-amber-800 mb-2">{report.interimNote}</p>
                  <p className="text-xs text-amber-700">
                    {report.processingDetails.filesProcessed} file(s) · {(report.processingDetails.processingTime / 1000).toFixed(1)}s · {report.processingDetails.aiModel}
                  </p>
                  {cachedScan && (
                    <button
                      onClick={handleRetry}
                      className="mt-3 inline-flex items-center px-4 py-2 rounded-lg bg-[#1A2C5B] text-white text-sm font-semibold hover:bg-[#0F1D3D] transition-colors focus:outline-none focus:ring-4 focus:ring-blue-200"
                    >
                      <ArrowRightIcon className="mr-1.5 h-4 w-4" />
                      Retry Deep Analysis
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#1A2C5B] mb-1">Scan Complete — {report.totalFlagsFound} Flag(s) Found</h4>
                  <p className="text-sm text-gray-700">{report.summary}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {report.processingDetails.filesProcessed} file(s) · {(report.processingDetails.processingTime / 1000).toFixed(1)}s · {report.processingDetails.aiModel}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Flagged Items */}
          <div className="mb-6">
            <h4 className="text-lg font-bold text-[#1A2C5B] mb-4 flex items-center gap-2">
              <FlagIcon className="h-5 w-5" />
              Flagged Findings ({report.totalFlagsFound})
            </h4>
            <div className="space-y-3">
              {report.flaggedItems.map((item, idx) => (
                <div key={idx} className={`bg-white border rounded-lg p-4 ${
                  item.confidence === 'high' ? 'border-l-4 border-l-[#1A2C5B] border-gray-200'
                  : item.confidence === 'medium' ? 'border-l-4 border-l-[#EAB308] border-gray-200'
                  : 'border-gray-200'
                }`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h5 className="font-semibold text-[#1A2C5B]">{item.label}</h5>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Other']}`}>
                      {item.category}
                    </span>
                  </div>
                  {item.excerpt && (
                    <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-2">
                      <p className="text-sm text-amber-900 italic">&quot;{item.excerpt}&quot;</p>
                    </div>
                  )}
                  {item.context && item.context !== item.label && (
                    <p className="text-xs text-gray-600 mb-2 bg-gray-50 rounded p-2">{item.context}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    {item.dateFound && <span>📅 <strong>{item.dateFound}</strong></span>}
                    {item.pageNumber && <span>📄 Page <strong>{item.pageNumber}</strong></span>}
                    <span>Category: <strong>{item.suggestedClaimCategory}</strong></span>
                    <span className={`px-2 py-0.5 rounded font-medium ${
                      item.confidence === 'high' ? 'bg-blue-100 text-blue-800'
                      : item.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-600'
                    }`}>{item.confidence} confidence</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scan Synopsis — auto-open on interim, closed on full */}
          {report.scanSynopsis && (
            <details {...(report.isInterim ? { open: true } : {})} className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <summary className="text-sm font-semibold text-[#1A2C5B] cursor-pointer select-none">What was scanned</summary>
              <div className="mt-3 space-y-2 text-xs text-gray-600">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="bg-white rounded p-2"><strong className="block text-gray-800">{report.scanSynopsis.totalPages}</strong>Pages scanned</div>
                  <div className="bg-white rounded p-2"><strong className="block text-gray-800">{report.scanSynopsis.totalParagraphs.toLocaleString()}</strong>Total paragraphs</div>
                  <div className="bg-white rounded p-2"><strong className="block text-gray-800">{report.scanSynopsis.keptParagraphs.toLocaleString()}</strong>Kept for analysis</div>
                  <div className="bg-white rounded p-2"><strong className="block text-gray-800">{report.scanSynopsis.reductionPct}%</strong>Noise removed</div>
                  <div className="bg-white rounded p-2"><strong className="block text-gray-800">{report.scanSynopsis.keywordsDetected.length}</strong>Keywords detected</div>
                  <div className="bg-white rounded p-2"><strong className="block text-gray-800">{report.scanSynopsis.sectionHeadersFound.length}</strong>Clinical sections</div>
                </div>
                {report.scanSynopsis.keywordsDetected.length > 0 && (
                  <p className="text-xs"><strong>Keywords found:</strong> {report.scanSynopsis.keywordsDetected.slice(0, 15).join(', ')}{report.scanSynopsis.keywordsDetected.length > 15 ? ` (+${report.scanSynopsis.keywordsDetected.length - 15} more)` : ''}</p>
                )}
                {report.scanSynopsis.sectionHeadersFound.length > 0 && (
                  <p className="text-xs"><strong>Sections found:</strong> {report.scanSynopsis.sectionHeadersFound.join(', ')}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">Processed in memory only — deleted immediately after scan.</p>
              </div>
            </details>
          )}

          {/* Next Steps */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-green-800 mb-3">Suggested Next Steps</h4>
            <ol className="list-decimal list-inside space-y-1">
              {report.suggestedNextSteps.map((step, idx) => (
                <li key={idx} className="text-sm text-green-900">{step}</li>
              ))}
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={handleDownloadReport}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#1A2C5B] text-white font-semibold hover:bg-[#0F1D3D] transition-colors focus:outline-none focus:ring-4 focus:ring-blue-200">
              <DocumentArrowDownIcon className="mr-2 h-5 w-5" />
              {report.isInterim ? 'Download Interim Report' : 'Download Evidence Report (PDF)'}
            </button>
            {report.isInterim && cachedScan ? (
              <button onClick={handleRetry}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#EAB308] text-[#1A2C5B] font-semibold hover:bg-[#FACC15] transition-colors focus:outline-none focus:ring-4 focus:ring-yellow-200">
                <ArrowRightIcon className="mr-2 h-5 w-5" />
                Retry Deep Analysis
              </button>
            ) : (
              <a href="https://www.va.gov/vso/" target="_blank" rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#EAB308] text-[#1A2C5B] font-semibold hover:bg-[#FACC15] transition-colors focus:outline-none focus:ring-4 focus:ring-yellow-200">
                Share with Your VSO
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </a>
            )}
          </div>

          <div className="mt-4 text-center">
            <button onClick={handleReset} className="text-[#1A2C5B] text-sm underline hover:no-underline">
              Scan More Documents
            </button>
          </div>

          {/* Bottom disclaimer */}
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-900 font-semibold">
              <strong>Reminder:</strong> {DISCLAIMER_TEXT}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
