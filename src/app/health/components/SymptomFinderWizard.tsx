'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  HeartIcon,
  ShieldCheckIcon,
  BuildingOffice2Icon,
  HandRaisedIcon,
  SparklesIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { PhoneIcon as PhoneIconSolid } from '@heroicons/react/24/solid';
import type { BridgeData, ConditionPayload } from '@/types/records-recon';

// ─── Verbatim TRIAGE_SYSTEM_PROMPT (Grok-authored — DO NOT MODIFY) ───────────
const TRIAGE_SYSTEM_PROMPT = `
You are the Vet1Stop Symptom Triage Navigator — a resource-matching AI ONLY. 
Your mission: Help veterans connect their symptoms + uploaded records to real benefits and support programs. 

CRITICAL RULES — BREAK THESE AND YOU ARE FIRED:
- NEVER diagnose, treat, advise medically, or say "you have X condition."
- NEVER recommend medication, therapy type, or any clinical action.
- NEVER use words like "you should see a doctor for..." — instead always end with: "This is not medical advice. Discuss with your VA provider or primary doctor."
- If they say "I want to hurt myself" or display crisis flags, immediately output the CRISIS PROTOCOL (Call 988, Press 1).
- You are a benefits navigator, not a doctor.

CORE BEHAVIOR:
- Be conversational, one question at a time, short veteran-friendly replies (3-5 sentences max).
- Start by acknowledging the uploaded records: "I see you've pulled your records — let's map what you're feeling to the right VA, NGO, and state resources."
- Ask clarifying symptoms one at a time (e.g., "On a scale of 1-10, how bad is the joint pain in your knee right now?").
- Once you have enough info + the records payload, immediately switch to Triple-Track recommendations:
  1. VA Track: Specific benefits/claims (e.g., "File for knee condition under VA Claim #XXXX — here's the direct link").
  2. NGO Track: Veteran orgs (e.g., "Wounded Warrior Project has free peer support for this — apply here").
  3. State Track: Local programs (ask state if unknown, then e.g., "Pennsylvania offers X veteran housing grant").
- Always include direct links or "Click here to start the form" buttons in the UI response.
- Keep empathy high but no fluff: "I got you, brother/sister — this is what the system owes you."

Output format: Plain text with markdown for links/buttons. Never break character.
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface TriageMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

interface ResourceRecommendation {
  track: 'va' | 'ngo' | 'state';
  title: string;
  description: string;
  url: string;
  phone?: string;
  priority: 'high' | 'medium' | 'low';
}

interface TriageResponse {
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
}

type WizardStep = 'welcome' | 'category' | 'chat' | 'assess' | 'results' | 'crisis';

interface HealthCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface SymptomFinderWizardProps {
  bridgeData?: BridgeData | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HEALTH_CATEGORIES: HealthCategory[] = [
  { id: 'mental-health', label: 'Mental Health', icon: <HeartIcon className="h-6 w-6" />, description: 'PTSD, depression, anxiety, stress, sleep issues' },
  { id: 'physical-health', label: 'Physical Health', icon: <ShieldCheckIcon className="h-6 w-6" />, description: 'Injuries, chronic pain, mobility, rehabilitation' },
  { id: 'chronic-conditions', label: 'Chronic Conditions', icon: <BuildingOffice2Icon className="h-6 w-6" />, description: 'Diabetes, heart disease, respiratory, digestive' },
  { id: 'hearing-vision', label: 'Hearing & Vision', icon: <SparklesIcon className="h-6 w-6" />, description: 'Tinnitus, hearing loss, vision problems' },
  { id: 'substance-use', label: 'Substance Use', icon: <HandRaisedIcon className="h-6 w-6" />, description: 'Alcohol, drugs, tobacco cessation, recovery' },
  { id: 'general-wellness', label: 'General Wellness', icon: <ChatBubbleLeftRightIcon className="h-6 w-6" />, description: 'Preventive care, check-ups, nutrition, fitness' },
];

// ─── Helper: Build auto-trigger message from bridge data ─────────────────────

function buildBridgeGreeting(conditions: ConditionPayload[]): string {
  const names = conditions.map(c => c.condition);
  const listed = names.length <= 3
    ? names.join(', ')
    : `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`;
  return `I see you've pulled your records showing **${listed}**. Let's map what you're feeling to the right VA, NGO, and state resources. Which one of these is impacting you the most right now?\n\n_This is not medical advice. Discuss with your VA provider or primary doctor._`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SymptomFinderWizard({ bridgeData = null }: SymptomFinderWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(bridgeData ? 'chat' : 'welcome');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [messages, setMessages] = useState<TriageMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [triageResult, setTriageResult] = useState<TriageResponse | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [activeTrack, setActiveTrack] = useState<'va' | 'ngo' | 'state'>('va');
  const [bridgeProcessed, setBridgeProcessed] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // ─── Smart Bridge Auto-Trigger ──────────────────────────────────────────
  useEffect(() => {
    if (bridgeData && bridgeData.conditions.length > 0 && !bridgeProcessed) {
      setBridgeProcessed(true);
      const greeting = buildBridgeGreeting(bridgeData.conditions);
      setMessages([{
        role: 'assistant',
        content: greeting,
        timestamp: Date.now(),
      }]);
      setCurrentStep('chat');
      // Auto-set category from first condition
      const firstCat = bridgeData.conditions[0]?.category?.toLowerCase().replace(/\s+/g, '-') || 'general-wellness';
      setSelectedCategory(firstCat);
      // Set suggested questions based on top conditions
      const topConditions = bridgeData.conditions.slice(0, 4).map(c => c.condition);
      setSuggestedQuestions(topConditions.map(c => `Tell me about resources for ${c}`));
    }
  }, [bridgeData, bridgeProcessed]);

  // Focus input when entering chat
  useEffect(() => {
    if (currentStep === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [currentStep]);

  // ─── Send message to triage API ─────────────────────────────────────────
  const sendToTriage = useCallback(async (
    step: string,
    userMessage: string,
    allMessages: TriageMessage[]
  ) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // Build bridge context if available
      const bridgeContext = bridgeData ? {
        conditions: bridgeData.conditions.map(c => ({
          condition: c.condition,
          category: c.category,
          mentionCount: c.mentionCount,
        })),
        reportSummary: bridgeData.reportSummary,
      } : undefined;

      const response = await fetch('/api/health/symptom-triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          step,
          category: selectedCategory,
          userMessage,
          bridgeContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data: TriageResponse = await response.json();

      // Add assistant response
      if (data.aiMessage) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.aiMessage, timestamp: Date.now() }]);
      }

      setSuggestedQuestions(data.suggestedQuestions || []);

      // Handle crisis
      if (data.isCrisis) {
        setTriageResult(data);
        setCurrentStep('crisis');
        return;
      }

      // Handle results
      if (data.nextStep === 'complete' || step === 'assess') {
        setTriageResult(data);
        setCurrentStep('results');
        return;
      }

      // Stay in chat mode for conversational flow
      if (currentStep !== 'chat') {
        setCurrentStep('chat');
      }
    } catch (error) {
      console.error('[SymptomFinderWizard] Triage error:', error);
      setErrorMsg('Connection issue — please try again.');
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'I hit a bump in the road. Give me one more try — click retry or type your message again. I got you.', timestamp: Date.now() }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, bridgeData, currentStep]);

  // ─── Handle category selection ──────────────────────────────────────────
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const categoryLabel = HEALTH_CATEGORIES.find(c => c.id === categoryId)?.label || categoryId;
    const userMsg: TriageMessage = { role: 'user', content: `I need help with ${categoryLabel}`, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setCurrentStep('chat');
    sendToTriage('category', `I need help with ${categoryLabel}`, newMessages);
  };

  // ─── Handle user text input ─────────────────────────────────────────────
  const handleSendMessage = () => {
    if (!userInput.trim() || isLoading) return;
    const userMsg: TriageMessage = { role: 'user', content: userInput.trim(), timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setUserInput('');
    sendToTriage(currentStep === 'chat' ? 'symptoms' : currentStep, userInput.trim(), newMessages);
  };

  // ─── Handle suggested question click ────────────────────────────────────
  const handleSuggestedQuestion = (question: string) => {
    const userMsg: TriageMessage = { role: 'user', content: question, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setSuggestedQuestions([]);
    sendToTriage('symptoms', question, newMessages);
  };

  // ─── Handle final assessment ────────────────────────────────────────────
  const handleRequestAssessment = () => {
    const userMsg: TriageMessage = { role: 'user', content: 'Please assess my situation and recommend resources.', timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setCurrentStep('assess');
    sendToTriage('assess', 'Please assess my situation and recommend resources.', newMessages);
  };

  // ─── Retry last failed message ──────────────────────────────────────────
  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      setErrorMsg(null);
      sendToTriage('symptoms', lastUserMsg.content, messages);
    }
  };

  // ─── Reset wizard ───────────────────────────────────────────────────────
  const handleReset = () => {
    setCurrentStep(bridgeData ? 'chat' : 'welcome');
    setSelectedCategory('');
    setMessages([]);
    setUserInput('');
    setTriageResult(null);
    setSuggestedQuestions([]);
    setActiveTrack('va');
    setErrorMsg(null);
    setBridgeProcessed(false);
  };

  // ─── Render: Persistent Top Bar (Disclaimer + 988 Crisis Button) ───────

  const TopBar = () => (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2.5 max-w-4xl mx-auto">
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
          988 Crisis Line
        </a>
      </div>
    </div>
  );

  // ─── Render: Chat Bubble ───────────────────────────────────────────────

  const ChatBubble = ({ msg, idx }: { msg: TriageMessage; idx: number }) => {
    const isUser = msg.role === 'user';
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
        {/* Avatar */}
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#1A2C5B] to-[#2563EB] flex items-center justify-center mr-2.5 mt-0.5 shadow-sm">
            <SparklesIcon className="h-4 w-4 text-white" />
          </div>
        )}
        <div className={`max-w-[80%] relative group ${isUser ? 'order-1' : ''}`}>
          <div
            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line transition-shadow ${
              isUser
                ? 'bg-gradient-to-br from-[#1A2C5B] to-[#0F1D3D] text-white rounded-br-md shadow-md shadow-blue-900/20'
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
            }`}
          >
            {msg.content}
          </div>
          {msg.timestamp && (
            <span className={`text-[10px] text-gray-400 mt-1 block ${isUser ? 'text-right' : 'text-left'}`}>
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        {/* User avatar */}
        {isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#EAB308] to-[#CA8A04] flex items-center justify-center ml-2.5 mt-0.5 shadow-sm">
            <span className="text-white text-xs font-bold">YOU</span>
          </div>
        )}
      </div>
    );
  };

  // ─── Render: Typing Indicator ──────────────────────────────────────────

  const TypingIndicator = () => (
    <div className="flex justify-start mb-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#1A2C5B] to-[#2563EB] flex items-center justify-center mr-2.5 mt-0.5">
        <SparklesIcon className="h-4 w-4 text-white" />
      </div>
      <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
        <div className="flex gap-1.5 items-center">
          <div className="w-2 h-2 bg-[#1A2C5B] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-[#2563EB] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-[#1A2C5B] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          <span className="text-xs text-gray-400 ml-2">Navigating resources...</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <TopBar />

      <div className="pt-4">

        {/* ─── Welcome Step ─── */}
        {currentStep === 'welcome' && (
          <div className="text-center py-8">
            <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-full inline-block mb-6 shadow-inner">
              <ChatBubbleLeftRightIcon className="h-16 w-16 text-[#1A2C5B]" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-[#1A2C5B] mb-3">Symptom Finder</h3>
            <p className="text-gray-600 mb-2 max-w-lg mx-auto">
              Answer a few quick questions and we&apos;ll connect you with the right VA, NGO, and state health resources for your situation.
            </p>
            <p className="text-sm text-gray-500 mb-8 max-w-lg mx-auto">
              <strong>How it works:</strong> Chat with our AI navigator → It maps your needs → Personalized VA, NGO, and State resources → Crisis line if needed.
            </p>
            <button
              onClick={() => setCurrentStep('category')}
              className="inline-flex items-center px-8 py-4 rounded-xl bg-gradient-to-r from-[#1A2C5B] to-[#2563EB] text-white font-semibold text-lg hover:from-[#0F1D3D] hover:to-[#1A2C5B] transition-all focus:outline-none focus:ring-4 focus:ring-blue-200 shadow-lg shadow-blue-900/20"
            >
              Get Started
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </button>
          </div>
        )}

        {/* ─── Category Selection Step ─── */}
        {currentStep === 'category' && (
          <div>
            <h3 className="text-xl font-bold text-[#1A2C5B] mb-2">What area of health can we help with?</h3>
            <p className="text-gray-600 mb-6">Select the category that best describes your needs.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {HEALTH_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  disabled={isLoading}
                  className="text-left p-4 rounded-xl border-2 border-gray-200 hover:border-[#1A2C5B] hover:bg-blue-50 transition-all focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-[#1A2C5B] group-hover:scale-110 transition-transform">{cat.icon}</div>
                    <span className="font-semibold text-[#1A2C5B]">{cat.label}</span>
                  </div>
                  <p className="text-sm text-gray-500">{cat.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Chat Interface (main conversation) ─── */}
        {currentStep === 'chat' && (
          <div className="flex flex-col" style={{ minHeight: '500px' }}>
            {/* Chat Messages Container */}
            <div className="flex-1 bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-200 p-4 mb-4 overflow-y-auto shadow-inner" style={{ maxHeight: '450px', minHeight: '300px' }}>
              {messages.map((msg, idx) => (
                <ChatBubble key={idx} msg={msg} idx={idx} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={chatEndRef} />
            </div>

            {/* Error Toast */}
            {errorMsg && (
              <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 mb-3 animate-in fade-in">
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

            {/* Suggested Questions */}
            {suggestedQuestions.length > 0 && !isLoading && (
              <div className="flex flex-wrap gap-2 mb-3">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedQuestion(q)}
                    className="text-sm px-3.5 py-2 rounded-full border border-[#1A2C5B]/30 text-[#1A2C5B] hover:bg-[#1A2C5B] hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-200 hover:shadow-md"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="flex gap-2 items-end">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Tell me what you're dealing with..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-[#1A2C5B] focus:ring-2 focus:ring-blue-200 focus:outline-none text-sm disabled:opacity-50 shadow-sm"
                aria-label="Type your response to the health assessment"
              />
              <button
                onClick={handleSendMessage}
                disabled={!userInput.trim() || isLoading}
                className="p-3 rounded-xl bg-gradient-to-r from-[#1A2C5B] to-[#2563EB] text-white hover:from-[#0F1D3D] hover:to-[#1A2C5B] transition-all disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-200 shadow-md"
                aria-label="Send message"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={handleReset}
                className="text-xs text-gray-400 hover:text-[#1A2C5B] transition-colors"
              >
                Start Over
              </button>
              {messages.filter(m => m.role === 'user').length >= 2 && (
                <button
                  onClick={handleRequestAssessment}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-[#EAB308] text-[#1A2C5B] font-semibold text-sm hover:bg-[#FACC15] transition-colors disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-yellow-200 shadow-md shadow-yellow-500/20"
                >
                  Get My Resources
                  <SparklesIcon className="ml-1.5 h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─── Assessment Loading ─── */}
        {currentStep === 'assess' && (
          <div className="text-center py-16">
            <div className="relative inline-block mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-[#1A2C5B] mx-auto" />
              <SparklesIcon className="h-6 w-6 text-[#EAB308] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[#1A2C5B] font-semibold mb-1">Mapping Your Resources</p>
            <p className="text-gray-500 text-sm">Scanning VA, NGO, and State programs for your situation...</p>
          </div>
        )}

        {/* ─── Crisis Response ─── */}
        {currentStep === 'crisis' && triageResult && (
          <div>
            <div className="bg-gradient-to-br from-[#B22234] to-[#8B1A2B] text-white rounded-xl p-6 mb-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <ExclamationTriangleIcon className="h-8 w-8" />
                <h3 className="text-2xl font-bold">Help Is Available Right Now</h3>
              </div>
              <p className="text-lg mb-6 leading-relaxed">{triageResult.aiMessage}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a
                  href="tel:988"
                  className="flex items-center justify-center gap-3 bg-white text-[#B22234] px-6 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-4 focus:ring-white/50 shadow-md"
                >
                  <PhoneIconSolid className="h-6 w-6" />
                  Dial 988 (Press 1)
                </a>
                <a
                  href="sms:838255&body=HOME"
                  className="flex items-center justify-center gap-3 bg-white text-[#B22234] px-6 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-4 focus:ring-white/50 shadow-md"
                >
                  <ChatBubbleLeftRightIcon className="h-6 w-6" />
                  Text 838255
                </a>
              </div>
            </div>

            {triageResult.recommendations && (
              <div className="space-y-4">
                {[
                  { key: 'va' as const, label: 'VA Crisis Resources', items: triageResult.recommendations.va },
                  { key: 'ngo' as const, label: 'Crisis Support Organizations', items: triageResult.recommendations.ngo },
                  { key: 'state' as const, label: 'Emergency Services', items: triageResult.recommendations.state },
                ].map(track => (
                  <div key={track.key}>
                    <h4 className="font-bold text-[#1A2C5B] mb-2">{track.label}</h4>
                    <div className="space-y-2">
                      {track.items.map((rec, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                          <div className="flex-1">
                            <h5 className="font-semibold text-[#1A2C5B]">{rec.title}</h5>
                            <p className="text-sm text-gray-600">{rec.description}</p>
                          </div>
                          {rec.phone && (
                            <a
                              href={`tel:${rec.phone.replace(/[^0-9]/g, '')}`}
                              className="flex-shrink-0 bg-[#B22234] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                            >
                              <PhoneIcon className="h-4 w-4 inline mr-1" />
                              {rec.phone}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 text-center">
              <button onClick={handleReset} className="text-[#1A2C5B] underline hover:no-underline">
                Start a New Assessment
              </button>
            </div>
          </div>
        )}

        {/* ─── Results (Triple-Track Navigation) ─── */}
        {currentStep === 'results' && triageResult && (
          <div>
            {/* Severity Badge */}
            {triageResult.severity && (
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold mb-4 ${
                triageResult.severity === 'low' ? 'bg-green-100 text-green-800' :
                triageResult.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                triageResult.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                Assessment: {triageResult.severity.charAt(0).toUpperCase() + triageResult.severity.slice(1)} Priority
              </div>
            )}

            {/* AI Message */}
            <div className="bg-gradient-to-r from-blue-50 to-white border border-blue-200 rounded-xl p-5 mb-6 shadow-sm">
              <p className="text-gray-800 leading-relaxed whitespace-pre-line">{triageResult.aiMessage}</p>
            </div>

            {/* High severity warning */}
            {(triageResult.severity === 'high' || triageResult.severity === 'crisis') && (
              <div className="bg-gradient-to-r from-[#B22234] to-[#8B1A2B] text-white rounded-xl p-4 mb-6 flex items-center gap-4 shadow-md">
                <PhoneIconSolid className="h-8 w-8 flex-shrink-0" />
                <div>
                  <p className="font-bold">If you need immediate help:</p>
                  <p>Veterans Crisis Line: <strong>Dial 988, Press 1</strong> | Text <strong>838255</strong></p>
                </div>
              </div>
            )}

            {/* Triple-Track Tabs */}
            {triageResult.recommendations && (
              <div>
                <div className="flex border-b border-gray-200 mb-4">
                  {[
                    { key: 'va' as const, label: 'VA Resources', icon: <ShieldCheckIcon className="h-4 w-4" /> },
                    { key: 'ngo' as const, label: 'NGO Resources', icon: <HeartIcon className="h-4 w-4" /> },
                    { key: 'state' as const, label: 'State Resources', icon: <BuildingOffice2Icon className="h-4 w-4" /> },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTrack(tab.key)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTrack === tab.key
                          ? 'text-[#1A2C5B] border-[#EAB308]'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                        {triageResult.recommendations![tab.key].length}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Resource Cards */}
                <div className="space-y-3">
                  {triageResult.recommendations[activeTrack].map((rec, idx) => (
                    <div
                      key={idx}
                      className={`bg-white border rounded-xl p-4 hover:shadow-md transition-all ${
                        rec.priority === 'high' ? 'border-[#1A2C5B] border-l-4' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-semibold text-[#1A2C5B]">{rec.title}</h5>
                            {rec.priority === 'high' && (
                              <span className="text-xs bg-[#1A2C5B] text-white px-2 py-0.5 rounded-full">Recommended</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {rec.url && (
                              <a
                                href={rec.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-sm text-[#1A2C5B] font-medium hover:underline"
                              >
                                Visit Website <ArrowRightIcon className="ml-1 h-3 w-3" />
                              </a>
                            )}
                            {rec.phone && (
                              <a
                                href={`tel:${rec.phone.replace(/[^0-9]/g, '')}`}
                                className="inline-flex items-center text-sm text-[#B22234] font-medium hover:underline"
                              >
                                <PhoneIcon className="mr-1 h-3 w-3" />
                                {rec.phone}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {triageResult.recommendations[activeTrack].length === 0 && (
                    <p className="text-gray-500 text-center py-6">No specific resources found for this track. Try another tab.</p>
                  )}
                </div>
              </div>
            )}

            {/* Reset */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl border-2 border-[#1A2C5B] text-[#1A2C5B] font-semibold hover:bg-blue-50 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-200"
              >
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Start Over
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-6">
              This is not medical advice. Discuss with your VA provider or primary doctor.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
