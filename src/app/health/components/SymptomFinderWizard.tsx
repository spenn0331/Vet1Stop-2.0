// Fixed per Living Master MD Section 2 Phase 1 ★ — Windsurf Architecture Refactor March 2026
'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  ExclamationTriangleIcon,
  SparklesIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ShieldCheckIcon,
  HeartIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { PhoneIcon as PhoneIconSolid } from '@heroicons/react/24/solid';
import type { BridgeData, ConditionPayload } from '@/types/records-recon';
import ResultsPanel, { type TriageResult, type ResourceRecommendation } from './symptom-finder/ResultsPanel';

const SYMPTOM_PROFILE_KEY = 'vet1stop_symptom_profile';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TriageMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: number;
  /** When true the message content is suppressed from the chat UI —
   *  the payload was already piped to ResultsPanel. */
  isResourcePayload?: boolean;
}

interface RawTriageResponse {
  aiMessage: string;
  nextStep: string;
  isCrisis: boolean;
  severity?: 'low' | 'moderate' | 'high' | 'crisis';
  recommendations?: {
    va: ResourceRecommendation[];
    ngo: ResourceRecommendation[];
    state: ResourceRecommendation[];
  };
  suggestedQuestions?: string[];
  keywords?: string[];
}

type WizardStep = 'idle' | 'chat' | 'loading' | 'results' | 'crisis';

interface SymptomFinderWizardProps {
  bridgeData?: BridgeData | null;
}

// ─── JSON intercept: detect raw resource arrays in AI text (safety net) ─────

/**
 * Safety net: If the backend sanitizer missed embedded JSON in the aiMessage,
 * try to extract the resource payload client-side. Handles 3 shapes:
 *   1. Pure JSON object starting with { ... vaResources ... }
 *   2. Raw array of resource objects
 *   3. JSON embedded inside prose text (the primary bug shape)
 * Returns null when message is normal prose.
 */
function tryExtractResourceJson(text: string): {
  va: ResourceRecommendation[];
  ngo: ResourceRecommendation[];
  state: ResourceRecommendation[];
} | null {
  if (!text) return null;

  const trimmed = text.trim();

  // Shape 1 & 2: text starts with { or [ — attempt full parse
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);

      // Shape 1: { vaResources: [...], ngoResources: [...], stateResources: [...] }
      if (parsed.vaResources || parsed.ngoResources || parsed.stateResources) {
        return {
          va:    (parsed.vaResources ?? []).map((r: Record<string, unknown>) => ({ ...r, track: 'va' })),
          ngo:   (parsed.ngoResources ?? []).map((r: Record<string, unknown>) => ({ ...r, track: 'ngo' })),
          state: (parsed.stateResources ?? []).map((r: Record<string, unknown>) => ({ ...r, track: 'state' })),
        };
      }

      // Shape 2: Raw array of resources with track field
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].title) {
        const va:    ResourceRecommendation[] = [];
        const ngo:   ResourceRecommendation[] = [];
        const state: ResourceRecommendation[] = [];
        for (const r of parsed) {
          const track = (r.track ?? 'ngo') as string;
          if (track === 'va') va.push({ ...r, track: 'va' });
          else if (track === 'state') state.push({ ...r, track: 'state' });
          else ngo.push({ ...r, track: 'ngo' });
        }
        return { va, ngo, state };
      }
    } catch {
      // Not valid JSON — fall through to Shape 3
    }
  }

  // Shape 3: JSON embedded inside prose (e.g. "Here are resources: {...}")
  // This is the PRIMARY BUG SHAPE — AI starts with prose then dumps JSON.
  const jsonMatch = text.match(/\{[\s\S]*"vaResources"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.vaResources || parsed.ngoResources || parsed.stateResources) {
        return {
          va:    (parsed.vaResources ?? []).map((r: Record<string, unknown>) => ({ ...r, track: 'va' })),
          ngo:   (parsed.ngoResources ?? []).map((r: Record<string, unknown>) => ({ ...r, track: 'ngo' })),
          state: (parsed.stateResources ?? []).map((r: Record<string, unknown>) => ({ ...r, track: 'state' })),
        };
      }
    } catch {
      // Embedded JSON malformed — ignore
    }
  }

  // Shape 4: Check for any raw resource array pattern embedded in text
  // Catches: ..."title":"VA Chronic Pain"... without vaResources wrapper
  const arrayMatch = text.match(/\[\s*\{[\s\S]*"title"[\s\S]*"description"[\s\S]*\}\s*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].title) {
        const va:    ResourceRecommendation[] = [];
        const ngo:   ResourceRecommendation[] = [];
        const state: ResourceRecommendation[] = [];
        for (const r of parsed) {
          const track = (r.track ?? 'ngo') as string;
          if (track === 'va') va.push({ ...r, track: 'va' });
          else if (track === 'state') state.push({ ...r, track: 'state' });
          else ngo.push({ ...r, track: 'ngo' });
        }
        return { va, ngo, state };
      }
    } catch {
      // Array JSON malformed — ignore
    }
  }

  return null;
}

// ─── Bridge context builder ───────────────────────────────────────────────────

function buildBridgeContext(conditions: ConditionPayload[]): string {
  const names = conditions.map(c => c.condition);
  const listed =
    names.length <= 3
      ? names.join(', ')
      : `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`;
  return `My records show these conditions: ${listed}. I need help finding the right resources.`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SymptomFinderWizard({ bridgeData = null }: SymptomFinderWizardProps) {
  const [step, setStep] = useState<WizardStep>('idle');
  const [messages, setMessages] = useState<TriageMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [isHandedOff, setIsHandedOff] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const geoStateRef = useRef<string | null>(null); // auto-detected state via browser geolocation

  // Scroll within the chat box — never triggers page-level smooth scroll
  useEffect(() => {
    const el = chatContainerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  // ── Browser geolocation → reverse-geocode → state name ───────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const res = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
          if (!res.ok) return;
          const data = await res.json();
          const state: string | undefined = data?.address?.state;
          if (state) {
            geoStateRef.current = state;
            console.log('[Geolocation] Detected state:', state);
          }
        } catch { /* non-fatal — fallback to chat text detection */ }
      },
      () => { /* permission denied — silent fallback */ },
      { timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    if (step === 'chat' && !isHandedOff) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [step, isHandedOff]);

  // Auto-start with bridge data
  useEffect(() => {
    if (bridgeData && bridgeData.conditions.length > 0 && step === 'idle') {
      const openingMsg: TriageMessage = {
        role: 'assistant',
        content: `I got you — I can see your records show **${bridgeData.conditions.map(c => c.condition).slice(0, 3).join(', ')}${bridgeData.conditions.length > 3 ? ` and ${bridgeData.conditions.length - 3} more` : ''}**.

To find the best resources for you, I need a few quick answers:

**1.** Do you already have an active VA claim for any of these conditions? *(Yes / No)*

**2.** What state are you in? *(e.g., Pennsylvania, Texas, California — helps me find your state-level VA programs)*

**3.** Are you currently receiving VA care, and are you satisfied with it? *(Yes / No / Not enrolled)*

**4.** Is there anything else about your situation you'd like to share?

_This is not medical advice. Discuss with your VA provider or primary doctor._`,
        timestamp: Date.now(),
      };
      setMessages([openingMsg]);
      setStep('chat');
      setSuggestedQuestions([
        'Yes, I have an active VA claim',
        'No VA claim yet',
        'Not sure about my claim status',
      ]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bridgeData]);

  // ─── Call triage API ──────────────────────────────────────────────────────

  const callTriageApi = useCallback(async (
    allMessages: TriageMessage[],
    triageStep: string,
    userMessage: string,
  ) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const bridgeContext = bridgeData
        ? {
            conditions: bridgeData.conditions.map(c => ({
              condition: c.condition,
              category: c.category,
              mentionCount: c.mentionCount,
            })),
            reportSummary: bridgeData.reportSummary,
          }
        : undefined;

      const res = await fetch('/api/health/symptom-triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          step: triageStep,
          userMessage,
          bridgeContext,
          userState: bridgeData?.userState ?? geoStateRef.current ?? undefined,
        }),
      });

      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data: RawTriageResponse = await res.json();

      // Crisis path
      if (data.isCrisis) {
        setTriageResult({
          aiMessage: data.aiMessage,
          severity: 'crisis',
          recommendations: data.recommendations ?? { va: [], ngo: [], state: [] },
          keywords: data.keywords ?? [],
        });
        setStep('crisis');
        return;
      }

      // ── CRITICAL: Determine if we have structured resources from the backend ──
      const backendRecs = data.recommendations ?? { va: [], ngo: [], state: [] };
      const backendHasResources =
        (backendRecs.va?.length ?? 0) +
        (backendRecs.ngo?.length ?? 0) +
        (backendRecs.state?.length ?? 0) > 0;

      // Safety net: check if raw JSON leaked into aiMessage despite backend sanitizer
      const interceptedResources = tryExtractResourceJson(data.aiMessage);

      // ── Assess handoff: if backend returned resources OR we intercepted JSON ──
      // This is the PRIMARY fix: when the backend gives us structured data,
      // ALWAYS hand off to ResultsPanel — never dump raw text into chat.
      if (backendHasResources || interceptedResources || data.nextStep === 'complete' || triageStep === 'assess') {
        // Merge: prefer backend-scored resources, add any intercepted ones as fallback
        const finalRecs = {
          va:    [...(backendRecs.va ?? []), ...(interceptedResources?.va ?? [])],
          ngo:   [...(backendRecs.ngo ?? []), ...(interceptedResources?.ngo ?? [])],
          state: [...(backendRecs.state ?? []), ...(interceptedResources?.state ?? [])],
        };

        // Deduplicate by title within each track
        const dedup = (arr: ResourceRecommendation[]) => {
          const seen = new Set<string>();
          return arr.filter(r => {
            if (seen.has(r.title)) return false;
            seen.add(r.title);
            return true;
          });
        };
        finalRecs.va = dedup(finalRecs.va);
        finalRecs.ngo = dedup(finalRecs.ngo);
        finalRecs.state = dedup(finalRecs.state);

        // Build a clean prose reply (strip any leaked JSON)
        const hasJsonInMessage = interceptedResources !== null ||
          data.aiMessage.includes('"vaResources"') ||
          data.aiMessage.includes('"title"') ||
          data.aiMessage.includes('"description"');

        const cleanAiMessage = hasJsonInMessage
          ? 'Here are your top matched resources based on your records. This is not medical advice. Discuss with your VA provider or primary doctor.'
          : data.aiMessage;

        // Always show the conversational reply in chat (visible, not suppressed)
        if (cleanAiMessage) {
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: cleanAiMessage, timestamp: Date.now() },
          ]);
        }

        setTriageResult({
          aiMessage: cleanAiMessage,
          severity: data.severity,
          recommendations: finalRecs,
          keywords: data.keywords ?? [],
        });
        setIsHandedOff(true);
        setChatExpanded(true);
        setStep('results');

        try {
          localStorage.setItem(SYMPTOM_PROFILE_KEY, JSON.stringify({
            conditions: bridgeData?.conditions?.map(c => c.condition) ?? [],
            hasVaClaim: userMessage.toLowerCase().includes('yes') || userMessage.toLowerCase().includes('claim'),
            timestamp: Date.now(),
          }));
        } catch { /* non-fatal */ }
        return;
      }

      // Normal prose response (quick_triage conversational phase) — add to chat
      if (data.aiMessage) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.aiMessage, timestamp: Date.now() },
        ]);
      }

      setSuggestedQuestions(data.suggestedQuestions ?? []);
    } catch (err) {
      console.error('[SymptomFinderWizard] API error:', err);
      setErrorMsg('Connection issue — please try again.');
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'I hit a bump. Give me one more shot — type your answer again or click retry. I got you.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [bridgeData]);

  const handleSendMessage = useCallback(() => {
    const text = userInput.trim();
    if (!text || isLoading) return;
    const userMsg: TriageMessage = { role: 'user', content: text, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setUserInput('');
    if (inputRef.current) inputRef.current.style.height = '42px';
    setSuggestedQuestions([]);
    const userTurns = newMessages.filter(m => m.role === 'user').length;
    callTriageApi(newMessages, userTurns >= 3 ? 'assess' : 'quick_triage', text);
  }, [userInput, isLoading, messages, callTriageApi]);

  const handleSuggestedQuestion = useCallback((q: string) => {
    const userMsg: TriageMessage = { role: 'user', content: q, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setSuggestedQuestions([]);
    const userTurns = newMessages.filter(m => m.role === 'user').length;
    callTriageApi(newMessages, userTurns >= 3 ? 'assess' : 'quick_triage', q);
  }, [messages, callTriageApi]);

  const handleSkipChat = useCallback(() => {
    setStep('chat');
    setIsLoading(true);
    let profileContext = { conditions: bridgeData?.conditions?.map(c => c.condition) ?? [] as string[], hasVaClaim: false };
    try {
      const raw = localStorage.getItem(SYMPTOM_PROFILE_KEY);
      if (raw) { const p = JSON.parse(raw); if (p.conditions?.length > 0) profileContext = p; }
    } catch { /* fallback */ }
    const skipMsg: TriageMessage = {
      role: 'user',
      content: profileContext.conditions.length > 0
        ? `Skip triage — generate my resources. Conditions: ${profileContext.conditions.join(', ')}. VA claim: ${profileContext.hasVaClaim ? 'Yes' : 'No'}.`
        : 'Skip triage — generate general veteran health resources for Pennsylvania.',
      timestamp: Date.now(),
    };
    const newMessages = [...messages, skipMsg];
    setMessages(newMessages);
    setIsLoading(false);
    callTriageApi(newMessages, 'assess', skipMsg.content);
  }, [bridgeData, messages, callTriageApi]);

  const handleRetry = useCallback(() => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (lastUser) {
      setErrorMsg(null);
      const userTurns = messages.filter(m => m.role === 'user').length;
      callTriageApi(messages, userTurns >= 3 ? 'assess' : 'quick_triage', lastUser.content);
    }
  }, [messages, callTriageApi]);

  const handleReset = useCallback(() => {
    setStep('idle');
    setMessages([]);
    setUserInput('');
    setTriageResult(null);
    setSuggestedQuestions([]);
    setIsHandedOff(false);
    setChatExpanded(false);
    setErrorMsg(null);
  }, []);

  const handleStartChat = useCallback(() => {
    const openingMsg: TriageMessage = {
      role: 'assistant',
      content: `Copy that — let's get you the right resources. A few quick questions before I pull your options:\n\n**1.** Do you already have an active VA claim? *(Yes / No)*\n\n**2.** What state are you in? *(e.g., Pennsylvania, Texas — helps me find local VA programs)*\n\n**3.** Are you currently receiving VA care — and if so, are you satisfied with it? *(Yes / No / Not enrolled)*\n\n**4.** Anything else about your situation you'd like to share?\n\n_This is not medical advice. Discuss with your VA provider or primary doctor._`,
      timestamp: Date.now(),
    };
    setMessages([openingMsg]);
    setStep('chat');
    setSuggestedQuestions(['Yes, active VA claim', 'No VA claim yet', 'Not enrolled in VA healthcare']);
  }, []);

  // Visible (non-suppressed) messages for rendering
  const visibleMessages = useMemo(
    () => messages.filter(m => !m.isResourcePayload),
    [messages],
  );

  // ─── TopBar (crisis line sticky on ALL screens) ───────────────────────────

  const TopBar = () => (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm flex-shrink-0">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5">
        <div className="flex items-center gap-1.5 sm:gap-2 text-amber-700 text-xs sm:text-sm min-w-0">
          <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate"><strong>Not medical advice.</strong> <span className="hidden sm:inline">Resource navigation only.</span></span>
        </div>
        <a
          href="tel:988"
          className="flex items-center gap-1 sm:gap-1.5 bg-[#B22234] text-white px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold hover:bg-red-700 transition-colors flex-shrink-0 shadow-md shadow-red-500/20 ml-2"
          aria-label="Veterans Crisis Line: Dial 988, Press 1"
        >
          <PhoneIconSolid className="h-3.5 w-3.5" />
          <span>988 Crisis</span>
        </a>
      </div>
    </div>
  );

  // ─── Fix 4: ChatBubble with react-markdown + prose styling ────────────────

  const ChatBubble = ({ msg }: { msg: TriageMessage }) => {
    const isUser = msg.role === 'user';
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
        {!isUser && (
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#1A2C5B] to-[#2563EB] flex items-center justify-center mr-2 mt-0.5 shadow-sm">
            <SparklesIcon className="h-3.5 w-3.5 text-white" />
          </div>
        )}
        <div
          className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-gradient-to-br from-[#1A2C5B] to-[#0F1D3D] text-white rounded-br-md shadow-md shadow-blue-900/20 ml-auto'
              : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
          }`}
        >
          {isUser ? (
            <span className="whitespace-pre-line">{msg.content}</span>
          ) : (
            <div className="prose prose-sm max-w-none prose-headings:text-[#1A2C5B] prose-headings:font-semibold prose-headings:text-sm prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:text-[#1A2C5B] prose-em:text-gray-500 prose-a:text-[#1A2C5B] prose-a:font-semibold prose-a:no-underline hover:prose-a:underline">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>
        {isUser && (
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#EAB308] to-[#CA8A04] flex items-center justify-center ml-2 mt-0.5 shadow-sm">
            <span className="text-white text-[10px] font-bold">YOU</span>
          </div>
        )}
      </div>
    );
  };

  const TypingIndicator = () => (
    <div className="flex justify-start mb-3">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1A2C5B] to-[#2563EB] flex items-center justify-center mr-2 mt-0.5">
        <SparklesIcon className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="bg-white border border-gray-200 px-3.5 py-2.5 rounded-2xl rounded-bl-md shadow-sm">
        <div className="flex gap-1.5 items-center">
          <div className="w-1.5 h-1.5 bg-[#1A2C5B] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 bg-[#2563EB] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 bg-[#1A2C5B] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          <span className="text-xs text-gray-400 ml-1.5">Mapping resources...</span>
        </div>
      </div>
    </div>
  );

  // ─── Main render ──────────────────────────────────────────────────────────
  // Fix 3: Desktop viewport isolation — mobile uses dvh constraint,
  //   desktop restores natural h-auto with min-height and no clipping.

  return (
    <div className="flex flex-col max-md:h-[calc(100dvh-180px)] md:min-h-[calc(100vh-100px)] md:h-auto max-w-4xl md:max-w-7xl mx-auto relative px-0 md:px-4">

      <TopBar />

      {/* ─── Idle / Welcome ─── */}
      {step === 'idle' && (
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center text-center px-4 py-6 sm:py-8">
          <div className="bg-gradient-to-br from-blue-50 to-white p-4 sm:p-5 rounded-full inline-block mb-4 sm:mb-5 shadow-inner">
            <ChatBubbleLeftRightIcon className="h-12 w-12 sm:h-14 sm:w-14 text-[#1A2C5B]" />
          </div>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1A2C5B] mb-2 sm:mb-3">Symptom Finder</h3>
          <p className="text-gray-600 mb-2 max-w-md text-sm sm:text-base">
            Answer 3 quick questions and we&apos;ll connect you with matched VA, NGO, and State resources.
          </p>
          <p className="text-xs text-gray-400 mb-6 sm:mb-8 max-w-sm">
            3 questions → AI maps your needs → Scored VA, NGO &amp; State resources.
          </p>
          <button
            onClick={handleSkipChat}
            className="w-full max-w-sm mb-3 inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-[#EAB308] to-[#CA8A04] text-[#1A2C5B] font-bold text-sm sm:text-base hover:from-[#FACC15] hover:to-[#EAB308] transition-all focus:outline-none focus:ring-4 focus:ring-yellow-200 shadow-lg shadow-yellow-500/25"
          >
            <SparklesIcon className="h-5 w-5" />
            Skip Chat &amp; Generate My Resources
          </button>
          <button
            onClick={handleStartChat}
            className="w-full max-w-sm inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl border-2 border-[#1A2C5B] text-[#1A2C5B] font-semibold text-sm sm:text-base hover:bg-blue-50 transition-all focus:outline-none focus:ring-4 focus:ring-blue-200"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            Chat (3 Questions)
          </button>
        </div>
      )}

      {/* ─── Chat + Results ─── */}
      {(step === 'chat' || step === 'results' || step === 'loading') && (
        <>
          {/* Chat container — h-16 minimized bar post-handoff, h-auto active */}
          <div
            className={`transition-all duration-300 overflow-hidden flex-shrink-0 ${
              isHandedOff && !chatExpanded ? 'h-16' : 'h-auto'
            }`}
          >
            {isHandedOff && !chatExpanded && (
              <button
                onClick={() => setChatExpanded(true)}
                className="w-full h-16 flex items-center justify-between px-4 bg-blue-50 border-b border-blue-100 text-sm text-[#1A2C5B] hover:bg-blue-100 transition-colors"
                aria-label="Expand chat history"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <SparklesIcon className="h-4 w-4 flex-shrink-0 text-[#1A2C5B]" />
                  <span className="truncate font-medium text-xs">
                    {visibleMessages[visibleMessages.length - 1]?.content?.slice(0, 60) ?? 'Chat complete'}…
                  </span>
                </div>
                <ChevronDownIcon className="h-4 w-4 flex-shrink-0 ml-2 text-gray-400" />
              </button>
            )}

            {(!isHandedOff || chatExpanded) && (
              <div className="flex flex-col">
                {/* Message list — desktop gets more room, mobile constrained */}
                <div
                  ref={chatContainerRef}
                  className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 p-3 sm:p-4 overflow-y-auto overscroll-contain shadow-inner"
                  style={{ maxHeight: isHandedOff ? '160px' : '340px', minHeight: '120px' }}
                >
                  {visibleMessages.map((msg, idx) => (
                    <ChatBubble key={idx} msg={msg} />
                  ))}
                  {isLoading && <TypingIndicator />}
                </div>

                {errorMsg && (
                  <div className="flex items-center justify-between bg-red-50 border-b border-red-200 px-4 py-2.5 animate-in fade-in">
                    <span className="text-sm text-red-700">{errorMsg}</span>
                    <button onClick={handleRetry} className="flex items-center gap-1 text-sm font-medium text-red-700 hover:text-red-900 ml-3">
                      <ArrowPathIcon className="h-3.5 w-3.5" /> Retry
                    </button>
                  </div>
                )}

                {suggestedQuestions.length > 0 && !isLoading && !isHandedOff && (
                  <div className="flex flex-wrap gap-2 px-4 py-2 bg-white border-b border-gray-100">
                    {suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestedQuestion(q)}
                        className="text-xs px-3 py-1.5 rounded-full border border-[#1A2C5B]/30 text-[#1A2C5B] hover:bg-[#1A2C5B] hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {(!isHandedOff || chatExpanded) && (
                  <div className="flex gap-2 items-end p-3 bg-white border-b border-gray-200">
                    <textarea
                      ref={inputRef}
                      rows={1}
                      value={userInput}
                      onChange={e => {
                        setUserInput(e.target.value);
                        const el = e.target;
                        el.style.height = 'auto';
                        el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
                      }}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                      placeholder="Type your answer..."
                      disabled={isLoading}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#1A2C5B] focus:ring-2 focus:ring-blue-200 focus:outline-none text-sm disabled:opacity-50 shadow-sm resize-none overflow-y-auto"
                      aria-label="Answer the triage question"
                      style={{ minHeight: '42px', maxHeight: '200px' }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!userInput.trim() || isLoading}
                      className="p-2.5 rounded-xl bg-gradient-to-r from-[#1A2C5B] to-[#2563EB] text-white hover:from-[#0F1D3D] hover:to-[#1A2C5B] transition-all disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-200 shadow-md flex-shrink-0"
                      aria-label="Send"
                    >
                      <PaperAirplaneIcon style={{ height: '18px', width: '18px' }} />
                    </button>
                  </div>
                )}

                {(!isHandedOff || chatExpanded) && (
                  <div className="flex items-center justify-between px-4 py-2 bg-white">
                    <button onClick={handleReset} className="text-xs text-gray-400 hover:text-[#1A2C5B] transition-colors">Start Over</button>
                    <button
                      onClick={handleSkipChat}
                      disabled={isLoading}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#EAB308] text-[#1A2C5B] font-bold text-xs hover:bg-[#FACC15] transition-colors disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-yellow-200 shadow-md shadow-yellow-500/20"
                    >
                      <SparklesIcon className="h-3.5 w-3.5" />
                      Skip &amp; Generate
                    </button>
                  </div>
                )}

                {isHandedOff && chatExpanded && (
                  <button
                    onClick={() => setChatExpanded(false)}
                    className="w-full py-1.5 text-xs text-gray-400 hover:text-[#1A2C5B] bg-gray-50 border-b border-gray-100 transition-colors flex items-center justify-center gap-1"
                  >
                    <ChevronUpIcon className="h-3 w-3" /> Collapse chat
                  </button>
                )}
              </div>
            )}
          </div>

          {step === 'loading' && (
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              <div className="relative inline-block mb-4">
                <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-100 border-t-[#1A2C5B]" />
                <SparklesIcon className="h-5 w-5 text-[#EAB308] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[#1A2C5B] font-semibold text-sm mb-1">Mapping Your Resources</p>
              <p className="text-gray-400 text-xs">Scanning VA, NGO &amp; State programs...</p>
            </div>
          )}

          {step === 'results' && triageResult && (
            <ResultsPanel result={triageResult} onReset={handleReset} />
          )}
        </>
      )}

      {/* ─── Crisis ─── */}
      {step === 'crisis' && triageResult && (
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-gradient-to-br from-[#B22234] to-[#8B1A2B] text-white rounded-xl p-6 mb-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <ExclamationTriangleIcon className="h-8 w-8 flex-shrink-0" />
              <h3 className="text-xl font-bold">Help Is Available Right Now</h3>
            </div>
            <p className="text-base mb-6 leading-relaxed">{triageResult.aiMessage}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a href="tel:988" className="flex items-center justify-center gap-3 bg-white text-[#B22234] px-5 py-3.5 rounded-xl font-bold text-base hover:bg-gray-100 transition-colors focus:outline-none focus:ring-4 focus:ring-white/50">
                <PhoneIconSolid className="h-5 w-5" /> Dial 988 (Press 1)
              </a>
              <a href="sms:838255&body=HOME" className="flex items-center justify-center gap-3 bg-white text-[#B22234] px-5 py-3.5 rounded-xl font-bold text-base hover:bg-gray-100 transition-colors focus:outline-none focus:ring-4 focus:ring-white/50">
                <ChatBubbleLeftRightIcon className="h-5 w-5" /> Text 838255
              </a>
            </div>
          </div>
          {triageResult.recommendations && (
            <ResultsPanel result={triageResult} onReset={handleReset} />
          )}
        </div>
      )}
    </div>
  );
}
