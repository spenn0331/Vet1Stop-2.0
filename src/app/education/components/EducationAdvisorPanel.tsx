'use client';

/**
 * EducationAdvisorPanel.tsx
 * Inline Education Advisor — intent tap cards → AI fetches MongoDB education
 * resources (federal, ngo, state) → 3-track results panel.
 * Mirrors the SymptomFinderWizard pattern from the Health page.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  SparklesIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
  MapPinIcon,
  ArrowTopRightOnSquareIcon,
  PhoneIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import ReactMarkdown from 'react-markdown';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EduResource {
  title: string;
  description: string;
  url?: string;
  phone?: string;
  priority?: 'high' | 'medium' | 'low';
  tags?: string[];
  isFree?: boolean;
  rating?: number;
}

export interface EduResult {
  aiMessage: string;
  recommendations: {
    federal: EduResource[];
    ngo:     EduResource[];
    state:   EduResource[];
  };
}

type AdvisorStep = 'idle' | 'loading' | 'results';

interface AdvisorMessage {
  role:      'assistant' | 'user';
  content:   string;
  timestamp: number;
}

// ─── Intent tap cards ─────────────────────────────────────────────────────────

const INTENT_CARDS = [
  { label: 'Activate My GI Bill',   emoji: '🎓', seed: 'I want to activate and use my Post-9/11 or Montgomery GI Bill benefits for school.' },
  { label: 'Find Scholarships',     emoji: '🏆', seed: 'I am looking for veteran scholarships, grants, and free education opportunities.' },
  { label: 'Vocational Rehab',      emoji: '⚙️', seed: 'I have a service-connected disability and want to explore Chapter 31 vocational rehabilitation.' },
  { label: 'STEM / Tech Track',     emoji: '🔬', seed: 'I want to pursue a STEM degree or tech career using VA education benefits.' },
  { label: 'State & Free Programs', emoji: '🏛️', seed: 'I want to find free or state-specific education programs available to veterans in my area.' },
] as const;

// ─── Cross-domain redirect map ────────────────────────────────────────────────

const CROSS_DOMAIN_MAP: Record<string, { page: string; href: string; label: string }> = {
  health:  { page: 'Health',   href: '/health',  label: 'Find Health Resources'   },
  careers: { page: 'Careers',  href: '/careers', label: 'Browse Career Resources' },
};

// ─── Track config (colors, labels, icons) ────────────────────────────────────

const TRACK_CONFIG = {
  federal: {
    label:    'Federal / VA Programs',
    color:    'bg-blue-50 border-blue-200',
    badge:    'bg-[#1A2C5B] text-white',
    dot:      'bg-[#1A2C5B]',
    Icon:     BuildingLibraryIcon,
    iconBg:   'bg-[#1A2C5B]',
  },
  ngo: {
    label:    'Scholarships & NGOs',
    color:    'bg-amber-50 border-amber-200',
    badge:    'bg-[#EAB308] text-[#1F2937]',
    dot:      'bg-[#EAB308]',
    Icon:     AcademicCapIcon,
    iconBg:   'bg-[#EAB308]',
  },
  state: {
    label:    'State Programs',
    color:    'bg-emerald-50 border-emerald-200',
    badge:    'bg-emerald-600 text-white',
    dot:      'bg-emerald-500',
    Icon:     MapPinIcon,
    iconBg:   'bg-emerald-600',
  },
} as const;

// ─── Resource card ────────────────────────────────────────────────────────────

function ResourceCard({ resource, track }: { resource: EduResource; track: keyof typeof TRACK_CONFIG }) {
  const cfg = TRACK_CONFIG[track];
  return (
    <div className={`rounded-xl border p-4 ${cfg.color} hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-bold text-[#1A2C5B] leading-snug flex-1">{resource.title}</h4>
        {resource.isFree && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex-shrink-0">
            <CheckCircleIcon className="h-3 w-3" aria-hidden="true" /> Free
          </span>
        )}
      </div>
      <p className="text-xs text-gray-600 leading-relaxed mb-3">{resource.description}</p>
      <div className="flex flex-wrap gap-2">
        {resource.url && (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1A2C5B] hover:text-blue-700 transition-colors focus:outline-none focus:underline"
            aria-label={`Visit ${resource.title} website`}
          >
            Visit Website <ArrowTopRightOnSquareIcon className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
        {resource.phone && (
          <a
            href={`tel:${resource.phone.replace(/\D/g, '')}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#B22234] hover:text-red-700 transition-colors"
            aria-label={`Call ${resource.title}`}
          >
            <PhoneIcon className="h-3 w-3" aria-hidden="true" />
            {resource.phone}
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Results section ──────────────────────────────────────────────────────────

function ResultsSection({ result }: { result: EduResult }) {
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
  const tracks = [
    { key: 'federal' as const, resources: result.recommendations.federal },
    { key: 'ngo'     as const, resources: result.recommendations.ngo     },
    { key: 'state'   as const, resources: result.recommendations.state   },
  ].filter(t => t.resources.length > 0);

  if (tracks.length === 0) return null;

  return (
    <div className="mt-6 space-y-4">
      {tracks.map(({ key, resources }) => {
        const cfg       = TRACK_CONFIG[key];
        const isExpanded = expandedTrack === key || tracks.length === 1;
        const shown     = isExpanded ? resources : resources.slice(0, 2);
        return (
          <div key={key} className={`rounded-2xl border ${cfg.color} overflow-hidden`}>
            {/* Track header */}
            <div className={`flex items-center justify-between px-4 py-3 ${cfg.color}`}>
              <div className="flex items-center gap-2">
                <cfg.Icon className="h-4 w-4 text-[#1A2C5B]" aria-hidden="true" />
                <span className="text-sm font-extrabold text-[#1A2C5B]">{cfg.label}</span>
                <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold ${cfg.badge}`}>
                  {resources.length}
                </span>
              </div>
              {resources.length > 2 && (
                <button
                  onClick={() => setExpandedTrack(isExpanded ? null : key)}
                  className="flex items-center gap-1 text-xs font-semibold text-[#1A2C5B] hover:text-blue-700 transition-colors focus:outline-none"
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? (
                    <><ChevronUpIcon className="h-3.5 w-3.5" /> Show Less</>
                  ) : (
                    <><ChevronDownIcon className="h-3.5 w-3.5" /> +{resources.length - 2} More</>
                  )}
                </button>
              )}
            </div>
            {/* Resource cards */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {shown.map((r, i) => (
                <ResourceCard key={`${key}-${i}`} resource={r} track={key} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EducationAdvisorPanel() {
  const [step,             setStep]             = useState<AdvisorStep>('idle');
  const [messages,         setMessages]         = useState<AdvisorMessage[]>([]);
  const [userInput,        setUserInput]        = useState('');
  const [isLoading,        setIsLoading]        = useState(false);
  const [result,           setResult]           = useState<EduResult | null>(null);
  const [errorMsg,         setErrorMsg]         = useState<string | null>(null);
  const [showIntentCards,  setShowIntentCards]  = useState(true);
  const [crossDomainHints, setCrossDomainHints] = useState<string[]>([]);

  const chatRef   = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const geoState  = useRef<string | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when entering chat
  useEffect(() => {
    if (step === 'idle' || step === 'results') {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [step]);

  // Geolocation → state
  useEffect(() => {
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const res  = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
          if (!res.ok) return;
          const data = await res.json();
          if (data?.address?.state) geoState.current = data.address.state;
        } catch { /* silent */ }
      },
      () => { /* denied */ },
      { timeout: 8000 },
    );
  }, []);

  // Greeting on mount
  useEffect(() => {
    setMessages([{
      role:      'assistant',
      content:   "Hey — I'm your Education Advisor. **Tell me your education goal** and I'll pull the best VA programs, scholarships, and state benefits for you.\n\n_Pick a goal below or describe what you need:_",
      timestamp: Date.now(),
    }]);
  }, []);

  // Call the advise API
  const callAdviseApi = useCallback(async (
    userMessage: string,
    currentMessages: AdvisorMessage[],
  ) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const apiMessages = currentMessages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/education/advise', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages:    apiMessages,
          step:        'assess',
          userMessage,
          userState:   geoState.current ?? undefined,
        }),
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json();

      if (data.aiMessage) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.aiMessage, timestamp: Date.now() },
        ]);
      }

      if (data.recommendations) {
        setResult({ aiMessage: data.aiMessage, recommendations: data.recommendations });
        setStep('results');
        if (data.crossDomainHints?.length) setCrossDomainHints(data.crossDomainHints);
      }
    } catch (err) {
      console.error('[EducationAdvisor] API error:', err);
      const msg = 'Connection issue — please try again.';
      setErrorMsg(msg);
      setMessages(prev => [...prev, { role: 'assistant', content: msg, timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
      setStep(prev => prev === 'loading' ? 'idle' : prev);
    }
  }, []);

  const handleIntentSelect = (seed: string) => {
    setShowIntentCards(false);
    const userMsg: AdvisorMessage = { role: 'user', content: seed, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setStep('loading');
    callAdviseApi(seed, newMessages);
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userInput.trim() || isLoading) return;
    const content = userInput.trim();
    setUserInput('');
    setShowIntentCards(false);
    const userMsg: AdvisorMessage = { role: 'user', content, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setStep('loading');
    callAdviseApi(content, newMessages);
  };

  const handleReset = () => {
    setStep('idle');
    setResult(null);
    setMessages([{
      role:      'assistant',
      content:   "Hey — I'm your Education Advisor. **Tell me your education goal** and I'll pull the best VA programs, scholarships, and state benefits for you.\n\n_Pick a goal below or describe what you need:_",
      timestamp: Date.now(),
    }]);
    setShowIntentCards(true);
    setCrossDomainHints([]);
    setErrorMsg(null);
    setUserInput('');
  };

  return (
    <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden bg-white">
      {/* ── Panel header ── */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#1A2C5B] to-[#2d4d99]" />
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#0F1D3D] to-[#1A2C5B]">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-[#EAB308]/20 flex items-center justify-center flex-shrink-0">
            <SparklesIcon className="h-4 w-4 text-[#EAB308]" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white leading-tight">Education Advisor</h3>
            <p className="text-[11px] text-white/60">AI-powered education benefit matching</p>
          </div>
        </div>
        {step !== 'idle' && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors focus:outline-none"
            aria-label="Start over"
          >
            <ArrowPathIcon className="h-3.5 w-3.5" aria-hidden="true" /> Reset
          </button>
        )}
      </div>

      {/* ── Chat messages ── */}
      <div
        ref={chatRef}
        className="px-5 pt-4 pb-2 space-y-3 max-h-64 overflow-y-auto"
        aria-live="polite"
        aria-label="Education Advisor conversation"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="h-7 w-7 rounded-full bg-[#1A2C5B] flex items-center justify-center flex-shrink-0 mt-0.5">
                <SparklesIcon className="h-3.5 w-3.5 text-[#EAB308]" aria-hidden="true" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#1A2C5B] text-white rounded-tr-sm'
                  : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-sm'
              }`}
            >
              {msg.role === 'assistant' ? (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-bold text-[#1A2C5B]">{children}</strong>,
                    em: ({ children }) => <em className="text-gray-500 not-italic text-[11px]">{children}</em>,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-2.5 justify-start">
            <div className="h-7 w-7 rounded-full bg-[#1A2C5B] flex items-center justify-center flex-shrink-0">
              <SparklesIcon className="h-3.5 w-3.5 text-[#EAB308] animate-pulse" aria-hidden="true" />
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
              <div className="flex gap-1 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1A2C5B] animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#1A2C5B] animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#1A2C5B] animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Intent tap cards (shown on first open) ── */}
      {showIntentCards && step === 'idle' && (
        <div className="px-5 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {INTENT_CARDS.map(card => (
            <button
              key={card.label}
              onClick={() => handleIntentSelect(card.seed)}
              className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border-2 border-[#1A2C5B]/15 bg-gradient-to-r from-blue-50 to-white text-left text-sm font-medium text-[#1A2C5B] hover:border-[#1A2C5B]/40 hover:from-blue-100 hover:to-blue-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
              aria-label={`Select goal: ${card.label}`}
            >
              <span className="text-xl flex-shrink-0" aria-hidden="true">{card.emoji}</span>
              <span className="leading-snug">{card.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Cross-domain redirect card ── */}
      {crossDomainHints.length > 0 && (() => {
        const hint     = crossDomainHints[0];
        const redirect = CROSS_DOMAIN_MAP[hint];
        if (!redirect) return null;
        return (
          <div className="mx-5 my-2 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3">
            <span className="text-xl flex-shrink-0" aria-hidden="true">💼</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-800 mb-1">
                Looks like you're also interested in {redirect.page}.
              </p>
              <a
                href={redirect.href}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#1A2C5B] hover:text-blue-700 transition-colors"
              >
                <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                {redirect.label}
              </a>
            </div>
            <button
              onClick={() => setCrossDomainHints([])}
              className="text-amber-400 hover:text-amber-600 text-lg leading-none flex-shrink-0"
              aria-label="Dismiss"
            >×</button>
          </div>
        );
      })()}

      {/* ── Text input ── */}
      <form onSubmit={handleSend} className="px-5 pb-4 pt-2">
        <div className="relative flex items-center gap-2 border border-gray-200 rounded-xl bg-gray-50 focus-within:border-[#1A2C5B] focus-within:bg-white transition-all">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            placeholder={result ? 'Ask a follow-up to refine your results…' : 'Or type your education question…'}
            className="flex-1 bg-transparent px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
            disabled={isLoading}
            aria-label="Type your education question"
          />
          <button
            type="submit"
            disabled={!userInput.trim() || isLoading}
            className="mr-2 flex-shrink-0 h-8 w-8 rounded-lg bg-[#1A2C5B] flex items-center justify-center text-white disabled:opacity-40 hover:bg-[#2d4d99] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {errorMsg && (
          <p className="mt-1.5 text-xs text-red-600" role="alert">{errorMsg}</p>
        )}
        <p className="mt-1.5 text-[10px] text-gray-400 text-center">
          Not official VA benefits advice. Verify eligibility at VA.gov.
        </p>
      </form>

      {/* ── Results ── */}
      {result && (
        <div className="px-5 pb-6 border-t border-gray-100 pt-2">
          <ResultsSection result={result} />
        </div>
      )}
    </div>
  );
}
