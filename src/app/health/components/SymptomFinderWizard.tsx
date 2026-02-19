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
} from '@heroicons/react/24/outline';
import { PhoneIcon as PhoneIconSolid } from '@heroicons/react/24/solid';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TriageMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
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

type WizardStep = 'welcome' | 'category' | 'symptoms' | 'severity' | 'context' | 'assess' | 'results' | 'crisis';

interface HealthCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
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

const STEP_LABELS: Record<WizardStep, string> = {
  welcome: 'Welcome',
  category: 'Health Area',
  symptoms: 'Symptoms',
  severity: 'Impact',
  context: 'Current Care',
  assess: 'Assessing...',
  results: 'Your Resources',
  crisis: 'Immediate Help',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SymptomFinderWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [messages, setMessages] = useState<TriageMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [triageResult, setTriageResult] = useState<TriageResponse | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [activeTrack, setActiveTrack] = useState<'va' | 'ngo' | 'state'>('va');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message to triage API
  const sendToTriage = useCallback(async (
    step: WizardStep,
    userMessage: string,
    allMessages: TriageMessage[]
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/health/symptom-triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          step,
          category: selectedCategory,
          userMessage,
        }),
      });

      if (!response.ok) throw new Error('Triage request failed');
      const data: TriageResponse = await response.json();

      // Add assistant response to messages
      if (data.aiMessage) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.aiMessage }]);
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

      // Move to next step
      setCurrentStep(data.nextStep as WizardStep);
    } catch (error) {
      console.error('Triage error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'I apologize, but I encountered an issue. Let me try a different approach. Could you tell me more about what you\'re experiencing?' }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const categoryLabel = HEALTH_CATEGORIES.find(c => c.id === categoryId)?.label || categoryId;
    const userMsg: TriageMessage = { role: 'user', content: `I need help with ${categoryLabel}` };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    sendToTriage('category', `I need help with ${categoryLabel}`, newMessages);
  };

  // Handle user text input
  const handleSendMessage = () => {
    if (!userInput.trim() || isLoading) return;
    const userMsg: TriageMessage = { role: 'user', content: userInput.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setUserInput('');
    sendToTriage(currentStep, userInput.trim(), newMessages);
  };

  // Handle suggested question click
  const handleSuggestedQuestion = (question: string) => {
    const userMsg: TriageMessage = { role: 'user', content: question };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setSuggestedQuestions([]);
    sendToTriage(currentStep, question, newMessages);
  };

  // Handle final assessment
  const handleRequestAssessment = () => {
    const userMsg: TriageMessage = { role: 'user', content: 'Please assess my situation and recommend resources.' };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    sendToTriage('assess', 'Please assess my situation and recommend resources.', newMessages);
  };

  // Reset wizard
  const handleReset = () => {
    setCurrentStep('welcome');
    setSelectedCategory('');
    setMessages([]);
    setUserInput('');
    setTriageResult(null);
    setSuggestedQuestions([]);
    setActiveTrack('va');
  };

  // Progress indicator
  const steps: WizardStep[] = ['welcome', 'category', 'symptoms', 'severity', 'context', 'results'];
  const currentStepIndex = steps.indexOf(currentStep === 'assess' ? 'results' : currentStep === 'crisis' ? 'results' : currentStep);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
        <p className="text-sm text-amber-800 flex items-start gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Not medical advice.</strong> This tool helps connect you with relevant health resources.
            Always consult a healthcare provider for medical decisions.
          </span>
        </p>
      </div>

      {/* Progress Bar */}
      {currentStep !== 'crisis' && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, idx) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    idx <= currentStepIndex
                      ? 'bg-[#1A2C5B] text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {idx + 1}
                </div>
                {idx < steps.length - 1 && (
                  <div className={`hidden sm:block w-12 md:w-20 h-1 mx-1 rounded ${
                    idx < currentStepIndex ? 'bg-[#1A2C5B]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            {steps.map(step => (
              <span key={step} className="hidden sm:inline">{STEP_LABELS[step]}</span>
            ))}
          </div>
        </div>
      )}

      {/* ─── Welcome Step ─── */}
      {currentStep === 'welcome' && (
        <div className="text-center">
          <div className="bg-white/10 p-4 rounded-full inline-block mb-6">
            <ChatBubbleLeftRightIcon className="h-16 w-16 text-[#1A2C5B]" />
          </div>
          <h3 className="text-2xl font-bold text-[#1A2C5B] mb-3">Symptom Finder</h3>
          <p className="text-gray-600 mb-2 max-w-lg mx-auto">
            Answer a few quick questions and we&apos;ll connect you with the right VA, NGO, and state health resources for your situation.
          </p>
          <p className="text-sm text-gray-500 mb-8 max-w-lg mx-auto">
            <strong>How it works:</strong> Chat-style questions → AI assesses your needs → Personalized VA, NGO, and State resources → Crisis line if needed.
          </p>
          <button
            onClick={() => setCurrentStep('category')}
            className="inline-flex items-center px-8 py-4 rounded-lg bg-[#1A2C5B] text-white font-semibold text-lg hover:bg-[#0F1D3D] transition-colors focus:outline-none focus:ring-4 focus:ring-blue-200"
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
                className="text-left p-4 rounded-lg border-2 border-gray-200 hover:border-[#1A2C5B] hover:bg-blue-50 transition-all focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-[#1A2C5B]">{cat.icon}</div>
                  <span className="font-semibold text-[#1A2C5B]">{cat.label}</span>
                </div>
                <p className="text-sm text-gray-500">{cat.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Conversation Steps (symptoms, severity, context) ─── */}
      {['symptoms', 'severity', 'context'].includes(currentStep) && (
        <div>
          {/* Chat Messages */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4 max-h-80 overflow-y-auto">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#1A2C5B] text-white rounded-br-md'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start mb-3">
                <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested Questions */}
          {suggestedQuestions.length > 0 && !isLoading && (
            <div className="flex flex-wrap gap-2 mb-4">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestedQuestion(q)}
                  className="text-sm px-3 py-2 rounded-full border border-[#1A2C5B] text-[#1A2C5B] hover:bg-[#1A2C5B] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your response..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:border-[#1A2C5B] focus:ring-2 focus:ring-blue-200 focus:outline-none text-sm disabled:opacity-50"
              aria-label="Type your response to the health assessment"
            />
            <button
              onClick={handleSendMessage}
              disabled={!userInput.trim() || isLoading}
              className="px-6 py-3 rounded-lg bg-[#1A2C5B] text-white font-medium hover:bg-[#0F1D3D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-200"
            >
              Send
            </button>
          </div>

          {/* Skip to Assessment */}
          {currentStep === 'context' && (
            <div className="mt-4 text-center">
              <button
                onClick={handleRequestAssessment}
                disabled={isLoading}
                className="inline-flex items-center px-6 py-3 rounded-lg bg-[#EAB308] text-[#1A2C5B] font-semibold hover:bg-[#FACC15] transition-colors disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-yellow-200"
              >
                Get My Resources
                <SparklesIcon className="ml-2 h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── Assessment Loading ─── */}
      {currentStep === 'assess' && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2C5B] mx-auto mb-4" />
          <p className="text-gray-600">Analyzing your responses and finding the best resources...</p>
        </div>
      )}

      {/* ─── Crisis Response ─── */}
      {currentStep === 'crisis' && triageResult && (
        <div>
          <div className="bg-[#B22234] text-white rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <ExclamationTriangleIcon className="h-8 w-8" />
              <h3 className="text-2xl font-bold">Help Is Available Right Now</h3>
            </div>
            <p className="text-lg mb-6">{triageResult.aiMessage}</p>

            {/* Prominent crisis buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href="tel:988"
                className="flex items-center justify-center gap-3 bg-white text-[#B22234] px-6 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-4 focus:ring-white/50"
              >
                <PhoneIconSolid className="h-6 w-6" />
                Dial 988 (Press 1)
              </a>
              <a
                href="sms:838255&body=HOME"
                className="flex items-center justify-center gap-3 bg-white text-[#B22234] px-6 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-4 focus:ring-white/50"
              >
                <ChatBubbleLeftRightIcon className="h-6 w-6" />
                Text 838255
              </a>
            </div>
          </div>

          {/* Crisis resources by track */}
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
                      <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 flex items-start gap-3">
                        <div className="flex-1">
                          <h5 className="font-semibold text-[#1A2C5B]">{rec.title}</h5>
                          <p className="text-sm text-gray-600">{rec.description}</p>
                        </div>
                        {rec.phone && (
                          <a
                            href={`tel:${rec.phone.replace(/[^0-9]/g, '')}`}
                            className="flex-shrink-0 bg-[#B22234] text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
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
            <button
              onClick={handleReset}
              className="text-[#1A2C5B] underline hover:no-underline"
            >
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-gray-800 leading-relaxed whitespace-pre-line">{triageResult.aiMessage}</p>
          </div>

          {/* High severity warning */}
          {(triageResult.severity === 'high' || triageResult.severity === 'crisis') && (
            <div className="bg-[#B22234] text-white rounded-lg p-4 mb-6 flex items-center gap-4">
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
                        ? 'text-[#1A2C5B] border-[#1A2C5B]'
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
                    className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
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
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg border-2 border-[#1A2C5B] text-[#1A2C5B] font-semibold hover:bg-blue-50 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-200"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Start Over
            </button>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 text-center mt-6">
            This is for informational purposes only and is not medical advice. Always consult a qualified healthcare provider.
          </p>
        </div>
      )}
    </div>
  );
}
