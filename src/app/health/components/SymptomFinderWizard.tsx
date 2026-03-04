'use client';

// JUNK FILE REGISTRY — delete manually post-deploy (Zero-Clutter Mandate):
// - src/app/api/health/symptom-finder/route.ts.new
// - src/app/api/health/resources/route.ts.fixed
// - src/app/api/health-resources/route.new.ts

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ExclamationTriangleIcon,
  SparklesIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { PhoneIcon as PhoneIconSolid } from '@heroicons/react/24/solid';
import type { BridgeData, ConditionPayload } from '@/types/records-recon';
import ResultsPanel, { type TriageResult, type ResourceRecommendation } from './symptom-finder/ResultsPanel';

// ─── localStorage keys ────────────────────────────────────────────────────────
const SYMPTOM_PROFILE_KEY = 'vet1stop_symptom_profile';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TriageMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: number;
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

/** Wizard steps — streamlined to 2-question flow */
type WizardStep = 'idle' | 'chat' | 'loading' | 'results' | 'crisis';

interface SymptomFinderWizardProps {
  bridgeData?: BridgeData | null;
}

// ─── Build opening context message from bridge data ───────────────────────────

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

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when chat is active
  useEffect(() => {
    if (step === 'chat' && !isHandedOff) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [step, isHandedOff]);

  // Auto-start with bridge data on mount
  useEffect(() => {
    if (bridgeData && bridgeData.conditions.length > 0 && step === 'idle') {
      const contextMsg = buildBridgeContext(bridgeData.conditions);
      const openingMsg: TriageMessage = {
        role: 'assistant',
        content: `I got you — I can see your records show **${bridgeData.conditions.map(c => c.condition).slice(0, 3).join(', ')}${bridgeData.conditions.length > 3 ? ` and ${bridgeData.conditions.length - 3} more` : ''}**.\n\nTo find the best resources for you, I just need two quick answers:\n\n**1.** Do you already have an active VA claim for any of these conditions? *(Yes / No)*\n\n**2.** How long has this been affecting your daily life, and on a scale of 1–10 how much does it impact you? *(e.g., "8 years, impact 7/10")*\n\n_This is not medical advice. Discuss with your VA provider or primary doctor._`,
        timestamp: Date.now(),
      };
      setMessages([openingMsg]);
      setStep('chat');
      setSuggestedQuestions([
        'Yes, I have a VA claim',
        'No, I don\'t have a VA claim yet',
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
          userState: 'PA',
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

      // Add assistant reply to chat
      if (data.aiMessage) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.aiMessage, timestamp: Date.now() },
        ]);
      }

      setSuggestedQuestions(data.suggestedQuestions ?? []);

      // Hand-off to results
      if (data.nextStep === 'complete' || triageStep === 'assess') {
        // Write profile to localStorage for future Skip Chat fallback
        try {
          const profilePayload = {
            conditions: bridgeData?.conditions?.map(c => c.condition) ?? [],
            hasVaClaim: userMessage.toLowerCase().includes('yes') || userMessage.toLowerCase().includes('claim'),
            timestamp: Date.now(),
          };
          localStorage.setItem(SYMPTOM_PROFILE_KEY, JSON.stringify(profilePayload));
        } catch {
          // localStorage write failed — non-fatal
        }

        setTriageResult({
          aiMessage: data.aiMessage,
          severity: data.severity,
          recommendations: data.recommendations ?? { va: [], ngo: [], state: [] },
          keywords: data.keywords ?? [],
        });
        setIsHandedOff(true);
        setStep('results');
        return;
      }
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

  // ─── Send user message ────────────────────────────────────────────────────

  const handleSendMessage = useCallback(() => {
    const text = userInput.trim();
    if (!text || isLoading) return;
    const userMsg: TriageMessage = { role: 'user', content: text, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setUserInput('');
    setSuggestedQuestions([]);

    // After 2 user turns (answers to both clarifying questions), trigger assess
    const userTurns = newMessages.filter(m => m.role === 'user').length;
    const triageStep = userTurns >= 2 ? 'assess' : 'quick_triage';
    callTriageApi(newMessages, triageStep, text);
  }, [userInput, isLoading, messages, callTriageApi]);

  // ─── Suggested question click ─────────────────────────────────────────────

  const handleSuggestedQuestion = useCallback((q: string) => {
    const userMsg: TriageMessage = { role: 'user', content: q, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setSuggestedQuestions([]);
    const userTurns = newMessages.filter(m => m.role === 'user').length;
    const triageStep = userTurns >= 2 ? 'assess' : 'quick_triage';
    callTriageApi(newMessages, triageStep, q);
  }, [messages, callTriageApi]);

  // ─── Skip Chat — direct assess using profile fallback ────────────────────

  const handleSkipChat = useCallback(() => {
    setStep('chat');
    setIsLoading(true);

    let profileContext: { conditions: string[]; hasVaClaim: boolean } = {
      conditions: bridgeData?.conditions?.map(c => c.condition) ?? [],
      hasVaClaim: false,
    };

    try {
      const raw = localStorage.getItem(SYMPTOM_PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.conditions?.length > 0) {
          profileContext = parsed;
        }
      }
    } catch {
      // Parse failed — use bridge data fallback
    }

    const skipMsg: TriageMessage = {
      role: 'user',
      content: profileContext.conditions.length > 0
        ? `Skip triage — please generate my resources directly. Conditions: ${profileContext.conditions.join(', ')}. VA claim: ${profileContext.hasVaClaim ? 'Yes' : 'No'}.`
        : 'Skip triage — generate general veteran health resources for Pennsylvania.',
      timestamp: Date.now(),
    };
    const newMessages = [...messages, skipMsg];
    setMessages(newMessages);
    setIsLoading(false);
    callTriageApi(newMessages, 'assess', skipMsg.content);
  }, [bridgeData, messages, callTriageApi]);

  // ─── Retry last failed message ────────────────────────────────────────────

  const handleRetry = useCallback(() => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (lastUser) {
      setErrorMsg(null);
      const userTurns = messages.filter(m => m.role === 'user').length;
      callTriageApi(messages, userTurns >= 2 ? 'assess' : 'quick_triage', lastUser.content);
    }
  }, [messages, callTriageApi]);

  // ─── Reset ────────────────────────────────────────────────────────────────

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

  // ─── Start chat (no bridge data path) ────────────────────────────────────

  const handleStartChat = useCallback(() => {
    const openingMsg: TriageMessage = {
      role: 'assistant',
      content: `Copy that — let's get you the right resources fast. Just two quick answers:\n\n**1.** Do you already have an active VA claim for this, or see the VA regularly? *(Yes / No)*\n\n**2.** How long has this been affecting you, and what's your daily impact on a scale of 1–10?\n\n_This is not medical advice. Discuss with your VA provider or primary doctor._`,
      timestamp: Date.now(),
    };
    setMessages([openingMsg]);
    setStep('chat');
    setSuggestedQuestions([
      'Yes, I have a VA claim',
      'No, I don\'t have a VA claim',
      'I\'m not enrolled in VA healthcare yet',
    ]);
  }, []);

  // ─── Render: Persistent Top Bar ──────────────────────────────────────────

  const TopBar = () => (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm flex-shrink-0">
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2 text-amber-700 text-xs sm:text-sm">
          <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
          <span><strong>Not medical advice.</strong> Resource navigation only.</span>
        </div>
        <a
          href="tel:988"
          className="flex items-center gap-1.5 bg-[#B22234] text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold hover:bg-red-700 transition-colors flex-shrink-0 shadow-md shadow-red-500/20"
          aria-label="Veterans Crisis Line: Dial 988, Press 1"
        >
          <PhoneIconSolid className="h-3.5 w-3.5" />
          988 Crisis
        </a>
      </div>
    </div>
  );

  // ─── Render: Chat bubble ──────────────────────────────────────────────────

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
          className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
            isUser
              ? 'bg-gradient-to-br from-[#1A2C5B] to-[#0F1D3D] text-white rounded-br-md shadow-md shadow-blue-900/20 ml-auto'
              : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
          }`}
        >
          {msg.content}
        </div>
        {isUser && (
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#EAB308] to-[#CA8A04] flex items-center justify-center ml-2 mt-0.5 shadow-sm">
            <span className="text-white text-[10px] font-bold">YOU</span>
          </div>
        )}
      </div>
    );
  };

  // ─── Render: Typing indicator ─────────────────────────────────────────────

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

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] max-w-4xl mx-auto">

      <TopBar />

      {/* ─── Idle / Welcome ─── */}
      {step === 'idle' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8">
          <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-full inline-block mb-5 shadow-inner">
            <ChatBubbleLeftRightIcon className="h-14 w-14 text-[#1A2C5B]" />
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-[#1A2C5B] mb-3">Symptom Finder</h3>
          <p className="text-gray-600 mb-2 max-w-md">
            Answer 2 quick questions and we&apos;ll connect you with matched VA, NGO, and State resources.
          </p>
          <p className="text-xs text-gray-400 mb-8 max-w-sm">
            How it works: 2 questions → AI maps your needs → Scored VA, NGO &amp; State resources.
          </p>

          {/* Skip Chat */}
          <button
            onClick={handleSkipChat}
            className="w-full max-w-sm mb-3 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-[#EAB308] to-[#CA8A04] text-[#1A2C5B] font-bold text-base hover:from-[#FACC15] hover:to-[#EAB308] transition-all focus:outline-none focus:ring-4 focus:ring-yellow-200 shadow-lg shadow-yellow-500/25"
          >
            <SparklesIcon className="h-5 w-5" />
            Skip Chat &amp; Generate My Resources
          </button>

          {/* Start Chat */}
          <button
            onClick={handleStartChat}
            className="w-full max-w-sm inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border-2 border-[#1A2C5B] text-[#1A2C5B] font-semibold text-base hover:bg-blue-50 transition-all focus:outline-none focus:ring-4 focus:ring-blue-200"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            Chat (2 Questions)
          </button>
        </div>
      )}

      {/* ─── Chat Pane (2-question triage) ─── */}
      {(step === 'chat' || step === 'results' || step === 'loading') && (
        <>
          {/* Chat container — shrinks to h-16 minimized bar after handoff */}
          <div
            className={`transition-all duration-300 overflow-hidden flex-shrink-0 ${
              isHandedOff && !chatExpanded ? 'h-16' : 'h-auto'
            }`}
          >
            {/* Minimized bar (shown when handed off + not expanded) */}
            {isHandedOff && !chatExpanded && (
              <button
                onClick={() => setChatExpanded(true)}
                className="w-full h-16 flex items-center justify-between px-4 bg-blue-50 border-b border-blue-100 text-sm text-[#1A2C5B] hover:bg-blue-100 transition-colors"
                aria-label="Expand chat history"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <SparklesIcon className="h-4 w-4 flex-shrink-0 text-[#1A2C5B]" />
                  <span className="truncate font-medium text-xs">
                    {messages[messages.length - 1]?.content?.slice(0, 60) ?? 'Chat complete'}…
                  </span>
                </div>
                <ChevronDownIcon className="h-4 w-4 flex-shrink-0 ml-2 text-gray-400" />
              </button>
            )}

            {/* Full chat (idle/active or expanded after handoff) */}
            {(!isHandedOff || chatExpanded) && (
              <div className="flex flex-col">
                {/* Message list */}
                <div
                  className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 p-4 overflow-y-auto shadow-inner"
                  style={{ maxHeight: isHandedOff ? '220px' : '340px', minHeight: '160px' }}
                >
                  {messages.map((msg, idx) => (
                    <ChatBubble key={idx} msg={msg} />
                  ))}
                  {isLoading && <TypingIndicator />}
                  <div ref={chatEndRef} />
                </div>

                {/* Error toast */}
                {errorMsg && (
                  <div className="flex items-center justify-between bg-red-50 border-b border-red-200 px-4 py-2.5 animate-in fade-in">
                    <span className="text-sm text-red-700">{errorMsg}</span>
                    <button
                      onClick={handleRetry}
                      className="flex items-center gap-1 text-sm font-medium text-red-700 hover:text-red-900 ml-3"
                    >
                      <ArrowPathIcon className="h-3.5 w-3.5" />
                      Retry
                    </button>
                  </div>
                )}

                {/* Suggested questions */}
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

                {/* Input row (hidden once handed off) */}
                {!isHandedOff && (
                  <div className="flex gap-2 items-end p-3 bg-white border-b border-gray-200">
                    <textarea
                      ref={inputRef}
                      rows={1}
                      value={userInput}
                      onChange={e => setUserInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type your answer..."
                      disabled={isLoading}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#1A2C5B] focus:ring-2 focus:ring-blue-200 focus:outline-none text-sm disabled:opacity-50 shadow-sm resize-none"
                      aria-label="Answer the triage question"
                      style={{ minHeight: '42px', maxHeight: '100px' }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!userInput.trim() || isLoading}
                      className="p-2.5 rounded-xl bg-gradient-to-r from-[#1A2C5B] to-[#2563EB] text-white hover:from-[#0F1D3D] hover:to-[#1A2C5B] transition-all disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-200 shadow-md flex-shrink-0"
                      aria-label="Send"
                    >
                      <PaperAirplaneIcon className="h-4.5 w-4.5" style={{ height: '18px', width: '18px' }} />
                    </button>
                  </div>
                )}

                {/* Action bar (Skip Chat always visible when not yet handed off) */}
                {!isHandedOff && (
                  <div className="flex items-center justify-between px-4 py-2 bg-white">
                    <button
                      onClick={handleReset}
                      className="text-xs text-gray-400 hover:text-[#1A2C5B] transition-colors"
                    >
                      Start Over
                    </button>
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

                {/* Collapse button (when expanded after handoff) */}
                {isHandedOff && chatExpanded && (
                  <button
                    onClick={() => setChatExpanded(false)}
                    className="w-full py-1.5 text-xs text-gray-400 hover:text-[#1A2C5B] bg-gray-50 border-b border-gray-100 transition-colors"
                  >
                    Collapse chat ↑
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ─── Loading state ─── */}
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

          {/* ─── Results Panel ─── */}
          {step === 'results' && triageResult && (
            <ResultsPanel result={triageResult} onReset={handleReset} />
          )}
        </>
      )}

      {/* ─── Crisis Response ─── */}
      {step === 'crisis' && triageResult && (
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-gradient-to-br from-[#B22234] to-[#8B1A2B] text-white rounded-xl p-6 mb-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <ExclamationTriangleIcon className="h-8 w-8 flex-shrink-0" />
              <h3 className="text-xl font-bold">Help Is Available Right Now</h3>
            </div>
            <p className="text-base mb-6 leading-relaxed">{triageResult.aiMessage}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="tel:988"
                className="flex items-center justify-center gap-3 bg-white text-[#B22234] px-5 py-3.5 rounded-xl font-bold text-base hover:bg-gray-100 transition-colors focus:outline-none focus:ring-4 focus:ring-white/50"
              >
                <PhoneIconSolid className="h-5 w-5" />
                Dial 988 (Press 1)
              </a>
              <a
                href="sms:838255&body=HOME"
                className="flex items-center justify-center gap-3 bg-white text-[#B22234] px-5 py-3.5 rounded-xl font-bold text-base hover:bg-gray-100 transition-colors focus:outline-none focus:ring-4 focus:ring-white/50"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
                Text 838255
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
