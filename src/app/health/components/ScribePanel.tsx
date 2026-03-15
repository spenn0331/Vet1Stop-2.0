'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronRightIcon,
  MicrophoneIcon,
  StopIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { PhoneIcon as PhoneIconSolid, CheckCircleIcon } from '@heroicons/react/24/solid';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ScribeSummary {
  described: string;
  themes:    string;
  followUp:  string;
}

// Browser SpeechRecognition types
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ScribePanel() {
  const [transcript,    setTranscript]    = useState('');
  const [interimText,   setInterimText]   = useState('');
  const [isRecording,   setIsRecording]   = useState(false);
  const [isLoading,     setIsLoading]     = useState(false);
  const [summary,       setSummary]       = useState<ScribeSummary | null>(null);
  const [error,         setError]         = useState<string | null>(null);
  const [speechSupport, setSpeechSupport] = useState(true);
  const [isHydrated,    setIsHydrated]    = useState(false);

  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) { setSpeechSupport(false); }
    setIsHydrated(true);
  }, []);

  // ── Recording ────────────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous      = true;
    recognition.interimResults  = true;
    recognition.lang             = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final   = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) final   += text + ' ';
        else                           interim += text;
      }
      if (final)   setTranscript(prev => prev + final);
      setInterimText(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech') {
        setError('Microphone error. Please check permissions or use the text area.');
      }
      setIsRecording(false);
      setInterimText('');
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setError(null);
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    setInterimText('');
  }, []);

  // ── Summarize ─────────────────────────────────────────────────────────────
  const handleSummarize = useCallback(async () => {
    const fullText = (transcript + ' ' + interimText).trim();
    if (fullText.length < 10) {
      setError('Please speak or type some notes first — there\'s nothing to summarize yet.');
      return;
    }
    if (isRecording) stopRecording();
    setIsLoading(true);
    setError(null);
    setSummary(null);

    try {
      const res = await fetch('/api/health/scribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: fullText }),
      });
      if (!res.ok) throw new Error('Server error');
      const data: ScribeSummary = await res.json();
      setSummary(data);
    } catch {
      setError('Could not generate summary. You can still download your raw notes below.');
    } finally {
      setIsLoading(false);
    }
  }, [transcript, interimText, isRecording, stopRecording]);

  // ── PDF Download ──────────────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    const { jsPDF } = await import('jspdf');
    const doc  = new jsPDF({ unit: 'pt', format: 'letter' });
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 60;
    const maxW   = pageW - margin * 2;
    let y = 60;

    const addText = (text: string, opts: { size?: number; bold?: boolean; color?: string } = {}) => {
      doc.setFontSize(opts.size ?? 11);
      doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
      if (opts.color) {
        const [r, g, b] = opts.color.split(',').map(Number);
        doc.setTextColor(r, g, b);
      } else {
        doc.setTextColor(30, 30, 30);
      }
      const lines = doc.splitTextToSize(text, maxW);
      doc.text(lines, margin, y);
      y += lines.length * (opts.size ?? 11) * 1.45;
    };

    const addSpacer = (h = 14) => { y += h; };

    // Header
    doc.setFillColor(26, 44, 91);
    doc.rect(0, 0, pageW, 45, 'F');
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.setTextColor(234, 179, 8);
    doc.text('Vet1Stop Health — Scribe Summary', margin, 30);
    y = 70;

    addText(date, { size: 10, color: '120,120,120' });
    addSpacer(6);

    if (summary) {
      addText('What I Described', { size: 13, bold: true });
      addSpacer(4);
      addText(summary.described, { size: 11 });
      addSpacer(14);

      addText('Key Themes', { size: 13, bold: true });
      addSpacer(4);
      addText(summary.themes.replace(/\\n/g, '\n'), { size: 11 });
      addSpacer(14);

      addText('Things to Follow Up On', { size: 13, bold: true });
      addSpacer(4);
      addText(summary.followUp.replace(/\\n/g, '\n'), { size: 11 });
      addSpacer(20);
    }

    addText('Raw Notes', { size: 13, bold: true });
    addSpacer(4);
    addText(transcript || '(No notes recorded)', { size: 10 });
    addSpacer(20);

    // Disclaimer footer
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageW - margin, y);
    addSpacer(10);
    addText('DISCLAIMER: This document is for personal journaling only — not clinical documentation. It is not a substitute for professional medical advice. Always discuss health concerns with your VA provider or licensed healthcare professional.', { size: 8, color: '120,120,120' });

    doc.save(`vet1stop-scribe-${date.replace(/,?\s+/g, '-')}.pdf`);
  }, [summary, transcript]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    if (isRecording) stopRecording();
    setTranscript('');
    setInterimText('');
    setSummary(null);
    setError(null);
  }, [isRecording, stopRecording]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A2C5B]" />
      </div>
    );
  }

  const fullTranscript = (transcript + (interimText ? ' ' + interimText : '')).trim();
  const wordCount = fullTranscript ? fullTranscript.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-1 text-sm text-gray-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#1A2C5B] transition-colors">Home</Link>
            <ChevronRightIcon className="h-3 w-3" />
            <Link href="/health" className="hover:text-[#1A2C5B] transition-colors">Health</Link>
            <ChevronRightIcon className="h-3 w-3" />
            <span className="text-[#1A2C5B] font-medium">Ambient Scribe</span>
          </nav>
          <a href="tel:988" className="hidden sm:flex items-center gap-1.5 text-xs text-[#B22234] font-semibold hover:text-red-700 transition-colors" aria-label="Veterans Crisis Line">
            <PhoneIconSolid className="h-3.5 w-3.5" />
            988 Crisis Line
          </a>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0F1D3D] via-[#1e2e6e] to-[#312e81] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-xs text-white/70 mb-4">
            <MicrophoneIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Voice or text — your choice
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Ambient Scribe Companion</h1>
          <p className="text-white/70 max-w-xl text-sm md:text-base leading-relaxed">
            Speak or type your health thoughts — AI organizes them into a clear, structured summary you can download and bring to your next appointment.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Transcript Input ──────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-[#1A2C5B]">Your Notes</h2>
              {wordCount > 0 && (
                <span className="text-xs text-gray-400 tabular-nums">{wordCount} words</span>
              )}
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Record / Stop buttons */}
              {speechSupport ? (
                <div className="flex gap-3">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#B22234] text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-red-200"
                      aria-label="Start voice recording"
                    >
                      <MicrophoneIcon className="h-4 w-4" aria-hidden="true" />
                      Start Recording
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 text-white rounded-xl font-semibold text-sm hover:bg-gray-800 transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-gray-300 animate-pulse"
                      aria-label="Stop voice recording"
                    >
                      <StopIcon className="h-4 w-4" aria-hidden="true" />
                      Stop Recording
                    </button>
                  )}
                  {(transcript || interimText) && (
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                      aria-label="Start over"
                    >
                      <ArrowPathIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      Start Over
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                  <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  Voice recording not supported in this browser. Use the text area below.
                </div>
              )}

              {/* Recording indicator */}
              {isRecording && (
                <div className="flex items-center gap-2 text-xs text-red-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
                  Recording… speak clearly
                </div>
              )}

              {/* Transcript textarea */}
              <textarea
                value={transcript + (interimText ? interimText : '')}
                onChange={e => { setTranscript(e.target.value); setInterimText(''); }}
                placeholder={speechSupport
                  ? 'Your transcribed notes will appear here — or type directly…'
                  : 'Type your health notes here…'}
                rows={10}
                className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1A2C5B]/30 focus:border-[#1A2C5B] resize-none transition-all font-mono leading-relaxed"
                aria-label="Health notes transcript"
              />

              {/* Summarize button */}
              <button
                onClick={handleSummarize}
                disabled={isLoading || wordCount < 3}
                className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md hover:-translate-y-0.5 flex items-center justify-center gap-2"
                aria-label="Generate AI summary of notes"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Organizing your notes…
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4" aria-hidden="true" />
                    Generate AI Summary
                  </>
                )}
              </button>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5" role="alert">
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* ── Summary Output ────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-[#1A2C5B]">AI Summary</h2>
              {summary && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#1A2C5B] rounded-xl hover:bg-[#0F1D3D] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
                  aria-label="Download summary as PDF"
                >
                  <DocumentArrowDownIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  Download PDF
                </button>
              )}
            </div>

            <div className="px-6 py-5">
              {!summary && !isLoading && (
                <div className="h-64 flex flex-col items-center justify-center text-center gap-3">
                  <SparklesIcon className="h-10 w-10 text-gray-200" aria-hidden="true" />
                  <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                    Speak or type your notes, then tap &ldquo;Generate AI Summary&rdquo; to organize them.
                  </p>
                </div>
              )}

              {isLoading && (
                <div className="h-64 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                  <p className="text-sm text-gray-400">Organizing your notes…</p>
                </div>
              )}

              {summary && !isLoading && (
                <div className="space-y-5">
                  <SummarySection
                    title="What I Described"
                    content={summary.described}
                    accent="border-indigo-200 bg-indigo-50/50"
                    titleColor="text-indigo-800"
                  />
                  <SummarySection
                    title="Key Themes"
                    content={summary.themes}
                    accent="border-blue-200 bg-blue-50/50"
                    titleColor="text-blue-800"
                    bullets
                  />
                  <SummarySection
                    title="Things to Follow Up On"
                    content={summary.followUp}
                    accent="border-emerald-200 bg-emerald-50/50"
                    titleColor="text-emerald-800"
                    bullets
                  />
                  <div className="flex items-center gap-2 text-[11px] text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2">
                    <CheckCircleIcon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                    Summary ready — download as PDF to bring to your next appointment.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Legal Disclaimer ─────────────────────────────────────────────── */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            <strong className="text-gray-500">Personal journaling tool only.</strong> Summaries generated by this tool are not clinical documentation and do not constitute medical advice. Your notes are sent to an AI summarization API and are never stored server-side. Always discuss any health concerns with your VA provider or licensed healthcare professional. If you are in crisis, call{' '}
            <a href="tel:988" className="text-[#B22234] font-bold hover:underline">988 (Press 1)</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Summary Section ─────────────────────────────────────────────────────────

function SummarySection({
  title,
  content,
  accent,
  titleColor,
  bullets = false,
}: {
  title:      string;
  content:    string;
  accent:     string;
  titleColor: string;
  bullets?:   boolean;
}) {
  const lines = content.replace(/\\n/g, '\n').split('\n').filter(l => l.trim());
  return (
    <div className={`rounded-xl border p-4 ${accent}`}>
      <h3 className={`text-xs font-extrabold uppercase tracking-wide mb-2 ${titleColor}`}>{title}</h3>
      {bullets ? (
        <ul className="space-y-1.5">
          {lines.map((line, i) => (
            <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700 leading-relaxed">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current flex-shrink-0 opacity-50" aria-hidden="true" />
              {line.replace(/^•\s*/, '')}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
      )}
    </div>
  );
}
