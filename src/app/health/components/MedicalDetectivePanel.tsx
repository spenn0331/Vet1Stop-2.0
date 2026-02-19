'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  DocumentMagnifyingGlassIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  TrashIcon,
  CheckCircleIcon,
  XMarkIcon,
  ShieldExclamationIcon,
  ArrowRightIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  type: string;
  size: number;
  preview?: string;
}

interface FlaggedItem {
  flagId: string;
  label: string;
  category: string;
  excerpt: string;
  context: string;
  dateFound?: string;
  suggestedClaimCategory: string;
  confidence: 'high' | 'medium' | 'low';
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
}

type PanelState = 'upload' | 'processing' | 'results' | 'error';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = [
  'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif',
  'application/pdf',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 10;

const DISCLAIMER_TEXT = `IMPORTANT: This tool is strictly for informational purposes only. It is NOT medical or legal advice. Vet1Stop does not diagnose conditions, file claims, or provide medical opinions. This tool identifies potential patterns in YOUR OWN uploaded documents. No files are permanently stored — all uploaded documents are automatically deleted immediately after processing. Zero HIPAA exposure.`;

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
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get pure base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

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
        errors.push(`"${file.name}" exceeds 10MB limit.`);
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

  // Process files
  const handleScan = async () => {
    if (files.length === 0) return;

    setPanelState('processing');
    setProgress(0);
    setError('');

    try {
      // Convert all files to base64
      const fileData = [];
      for (let i = 0; i < files.length; i++) {
        setProgress(Math.round(((i + 0.5) / files.length) * 40));
        const base64 = await fileToBase64(files[i].file);
        fileData.push({
          name: files[i].name,
          type: files[i].type,
          data: base64,
          size: files[i].size,
        });
      }

      setProgress(50);

      // Send to API
      const response = await fetch('/api/health/medical-detective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: fileData }),
      });

      setProgress(80);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Processing failed');
      }

      const data: DetectiveReport = await response.json();
      setReport(data);
      setProgress(100);

      // Clear files from memory (ephemeral processing)
      setFiles([]);

      setPanelState('results');
    } catch (err) {
      console.error('Medical Detective error:', err);
      setError((err as Error).message || 'An error occurred during processing. Please try again.');
      setPanelState('error');
    }
  };

  // Generate printable report
  const handleDownloadReport = () => {
    if (!report) return;

    const reportHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Vet1Stop Personal Evidence Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1F2937; line-height: 1.6; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1A2C5B; padding-bottom: 20px; }
    .header h1 { color: #1A2C5B; font-size: 24px; margin-bottom: 5px; }
    .header p { color: #6B7280; font-size: 12px; }
    .disclaimer { background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 15px; margin-bottom: 25px; font-size: 11px; color: #92400E; }
    .disclaimer strong { display: block; margin-bottom: 5px; font-size: 12px; }
    .summary { background: #EFF6FF; border-radius: 8px; padding: 15px; margin-bottom: 25px; }
    .summary h2 { color: #1A2C5B; font-size: 16px; margin-bottom: 8px; }
    .flag-section { margin-bottom: 20px; }
    .flag-section h2 { color: #1A2C5B; font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px; }
    .flag-item { border: 1px solid #E5E7EB; border-radius: 8px; padding: 15px; margin-bottom: 12px; page-break-inside: avoid; }
    .flag-item.high { border-left: 4px solid #1A2C5B; }
    .flag-item.medium { border-left: 4px solid #F59E0B; }
    .flag-item.low { border-left: 4px solid #9CA3AF; }
    .flag-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .flag-label { font-weight: 700; color: #1A2C5B; font-size: 14px; }
    .flag-category { background: #F3F4F6; padding: 2px 8px; border-radius: 4px; font-size: 11px; color: #4B5563; }
    .flag-excerpt { background: #FFFBEB; padding: 10px; border-radius: 4px; font-size: 12px; color: #92400E; margin-bottom: 8px; font-style: italic; }
    .flag-meta { font-size: 11px; color: #6B7280; }
    .next-steps { background: #F0FDF4; border-radius: 8px; padding: 15px; margin-top: 25px; }
    .next-steps h2 { color: #166534; font-size: 16px; margin-bottom: 10px; }
    .next-steps ol { padding-left: 20px; }
    .next-steps li { margin-bottom: 5px; font-size: 13px; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 15px; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Vet1Stop Personal Evidence Report</h1>
    <p>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
    <p>Files Processed: ${report.processingDetails.filesProcessed} | Flags Found: ${report.totalFlagsFound}</p>
  </div>

  <div class="disclaimer">
    <strong>⚠ IMPORTANT DISCLAIMER</strong>
    ${DISCLAIMER_TEXT}
  </div>

  <div class="summary">
    <h2>Summary</h2>
    <p>${report.summary}</p>
  </div>

  <div class="flag-section">
    <h2>Flagged Findings (${report.totalFlagsFound})</h2>
    ${report.flaggedItems.map(item => `
      <div class="flag-item ${item.confidence}">
        <div class="flag-header">
          <span class="flag-label">${item.label}</span>
          <span class="flag-category">${item.category}</span>
        </div>
        ${item.excerpt ? `<div class="flag-excerpt">"${item.excerpt}"</div>` : ''}
        <div class="flag-meta">
          ${item.dateFound ? `Date Found: ${item.dateFound} | ` : ''}
          Suggested Claim Category: ${item.suggestedClaimCategory} |
          Confidence: ${item.confidence.charAt(0).toUpperCase() + item.confidence.slice(1)}
        </div>
      </div>
    `).join('')}
  </div>

  <div class="next-steps">
    <h2>Suggested Next Steps</h2>
    <ol>
      ${report.suggestedNextSteps.map(step => `<li>${step}</li>`).join('')}
    </ol>
  </div>

  <div class="footer">
    <p>This report was generated by Vet1Stop Medical Detective (Phase 1) for informational purposes only.</p>
    <p>It is NOT medical or legal advice. Share this report with your VSO or healthcare provider.</p>
    <p>No files were stored during this process. Zero HIPAA exposure.</p>
  </div>

  <div class="no-print" style="text-align:center; margin-top:20px;">
    <button onclick="window.print()" style="padding:10px 30px; background:#1A2C5B; color:white; border:none; border-radius:6px; cursor:pointer; font-size:14px;">
      Print / Save as PDF
    </button>
  </div>
</body>
</html>`;

    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    if (newWindow) {
      newWindow.onload = () => {
        URL.revokeObjectURL(url);
      };
    }
  };

  // Reset
  const handleReset = () => {
    setFiles([]);
    setReport(null);
    setError('');
    setProgress(0);
    setPanelState('upload');
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Bold Disclaimer - Always visible */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <ShieldExclamationIcon className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-900 font-bold mb-1">Not Medical or Legal Advice</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              {DISCLAIMER_TEXT}
            </p>
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
              PDF, PNG, JPG — Max 10MB per file, up to {MAX_FILES} files
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
        <div className="text-center py-12">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <svg className="animate-spin" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="45" fill="none" stroke="#1A2C5B" strokeWidth="6"
                strokeDasharray={`${progress * 2.83} 283`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                className="transition-all duration-300"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-[#1A2C5B]">
              {progress}%
            </span>
          </div>
          <h3 className="text-xl font-bold text-[#1A2C5B] mb-2">Scanning Your Records...</h3>
          <p className="text-gray-600 text-sm max-w-md mx-auto">
            AI is analyzing your documents for claim-relevant evidence flags. This may take a moment.
          </p>
          <p className="text-xs text-gray-400 mt-4">
            Files are being processed in memory only — never stored permanently.
          </p>
        </div>
      )}

      {/* ─── Error State ─── */}
      {panelState === 'error' && (
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Processing Error</h3>
          <p className="text-gray-600 mb-6">{error || 'Something went wrong. Please try again.'}</p>
          <button
            onClick={handleReset}
            className="inline-flex items-center px-6 py-3 rounded-lg bg-[#1A2C5B] text-white font-semibold hover:bg-[#0F1D3D] transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* ─── Results State ─── */}
      {panelState === 'results' && report && (
        <div>
          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-[#1A2C5B] mb-1">Scan Complete</h4>
                <p className="text-sm text-gray-700">{report.summary}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Processed {report.processingDetails.filesProcessed} file(s) in {(report.processingDetails.processingTime / 1000).toFixed(1)}s
                </p>
              </div>
            </div>
          </div>

          {/* Flagged Items */}
          {report.flaggedItems.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-bold text-[#1A2C5B] mb-4 flex items-center gap-2">
                <FlagIcon className="h-5 w-5" />
                Flagged Findings ({report.totalFlagsFound})
              </h4>

              <div className="space-y-3">
                {report.flaggedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`bg-white border rounded-lg p-4 ${
                      item.confidence === 'high'
                        ? 'border-l-4 border-l-[#1A2C5B] border-gray-200'
                        : item.confidence === 'medium'
                          ? 'border-l-4 border-l-[#EAB308] border-gray-200'
                          : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h5 className="font-semibold text-[#1A2C5B]">{item.label}</h5>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                        CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Other']
                      }`}>
                        {item.category}
                      </span>
                    </div>

                    {item.excerpt && (
                      <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-2">
                        <p className="text-sm text-amber-900 italic">&quot;{item.excerpt}&quot;</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      {item.dateFound && (
                        <span>Date: <strong>{item.dateFound}</strong></span>
                      )}
                      <span>Claim Category: <strong>{item.suggestedClaimCategory}</strong></span>
                      <span className={`px-2 py-0.5 rounded ${
                        item.confidence === 'high' ? 'bg-green-100 text-green-800' :
                        item.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {item.confidence} confidence
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-green-800 mb-3">Suggested Next Steps</h4>
            <ol className="list-decimal list-inside space-y-2">
              {report.suggestedNextSteps.map((step, idx) => (
                <li key={idx} className="text-sm text-green-900">{step}</li>
              ))}
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownloadReport}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#1A2C5B] text-white font-semibold hover:bg-[#0F1D3D] transition-colors focus:outline-none focus:ring-4 focus:ring-blue-200"
            >
              <DocumentArrowDownIcon className="mr-2 h-5 w-5" />
              Download Personal Evidence Report
            </button>
            <a
              href="https://www.va.gov/vso/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#EAB308] text-[#1A2C5B] font-semibold hover:bg-[#FACC15] transition-colors focus:outline-none focus:ring-4 focus:ring-yellow-200"
            >
              Next Step: Share with Your VSO
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </a>
          </div>

          {/* Scan More */}
          <div className="mt-4 text-center">
            <button
              onClick={handleReset}
              className="text-[#1A2C5B] text-sm underline hover:no-underline"
            >
              Scan More Documents
            </button>
          </div>

          {/* Disclaimer at bottom of results */}
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              <strong>Reminder:</strong> {DISCLAIMER_TEXT}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
