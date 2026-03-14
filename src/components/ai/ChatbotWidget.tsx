/**
 * ChatbotWidget — Premium AI Assistant
 * Vet1Stop floating chat panel. react-markdown + lucide-react + @tailwindcss/typography.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, X, RotateCcw, Send, Mic, Info, MessageSquare, ExternalLink, Phone } from 'lucide-react';
import useAIChat, { ChatMessage, ResourceCard } from '@/hooks/useAIChat';

interface ChatbotWidgetProps {
  userProfile?: any;
  currentPage?: string;
}

// Context-sensitive quick reply chips based on conversation topic
function getQuickReplies(prevUserMsg: string): string[] {
  const q = prevUserMsg.toLowerCase();
  if (q.includes('ptsd') || q.includes('trauma')) {
    return ['What PTSD treatments does VA offer?', 'How do I get a disability rating?', 'PTSD + sleep issues'];
  }
  if (q.includes('sleep') || q.includes('insomnia') || q.includes('nightmare')) {
    return ['What is CBT-i Coach?', 'Is sleep a service-connected condition?', 'VA programs for PTSD + sleep'];
  }
  if (q.includes('claim') || q.includes('rating') || q.includes('disability')) {
    return ['How do I start a VA claim?', 'What is a nexus letter?', 'Do I need a VSO?'];
  }
  if (q.includes('health') || q.includes('care') || q.includes('doctor') || q.includes('pain')) {
    return ['How do I enroll in VA healthcare?', 'What is the Community Care Network?', 'Browse all health resources'];
  }
  if (q.includes('mental') || q.includes('anxiety') || q.includes('depression')) {
    return ['What mental health programs does VA have?', 'Tell me about Vet Centers', 'How do I get a rating for mental health?'];
  }
  if (q.includes('education') || q.includes('gi bill') || q.includes('school')) {
    return ['Post-9/11 vs Montgomery GI Bill', 'What is VR&E (Chapter 31)?', 'Transferring GI Bill to dependents'];
  }
  if (q.includes('job') || q.includes('career') || q.includes('work') || q.includes('employ')) {
    return ['How do I translate military skills?', 'What is USAJOBS for veterans?', 'Hiring Our Heroes program'];
  }
  if (q.includes('housing') || q.includes('home') || q.includes('homeless')) {
    return ['Tell me about VA home loans', 'What is HUD-VASH?', 'Transitional housing for veterans'];
  }
  return ['What resources are available?', 'Help with my VA benefits', 'How do I use the Health page?'];
}

// Strip accessibility artifacts + fix nested markdown headers in list items
function preprocessMarkdown(content: string): string {
  return content
    .replace(/\s*\(Section Heading\)/gi, '')
    .replace(/\[List starts\]\n?/gi, '')
    .replace(/\[List ends\]\s*[-–]?\s*/gi, '')
    .replace(/\s*\(link to [^)]+\)/gi, '')
    .replace(/\[(?:pointing finger|checkmark|warning|phone|email|link|mobile phone|exclamation)\]\s*/gi, '')
    .replace(/^(\d+\.\s+)#{1,3}\s+/gm, '$1')
    .replace(/^([-•*]\s+)#{1,3}\s+/gm, '$1')
    .trim();
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  userProfile,
  currentPage = 'Home',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showVoiceUI, setShowVoiceUI] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const { messages, isLoading, error, sendMessage, clearChat } = useAIChat(userProfile, currentPage);

  // Auto-scroll on every new message or loading state change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && !showVoiceUI) setTimeout(() => inputRef.current?.focus(), 80);
  }, [isOpen, showVoiceUI]);

  const fmtTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim()) { sendMessage(inputValue); setInputValue(''); }
  };

  // ── Voice dictation (inline SpeechRecognition — two-step: open overlay first, tap mic to start) ──
  const startListening = () => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) {
      setVoiceError('Speech recognition requires Chrome or Edge. Type your message instead.');
      return;
    }

    setVoiceError(null);
    setTranscript('');

    const r = new SR();
    r.lang = 'en-US';
    r.interimResults = true;
    r.maxAlternatives = 1;
    r.continuous = false;

    r.onstart = () => { setIsListening(true); setVoiceError(null); };
    r.onend   = () => setIsListening(false);

    r.onerror = (e: any) => {
      setIsListening(false);
      const msgs: Record<string, string> = {
        network:        'Speech recognition needs an internet connection. Check your connection and tap the mic to retry.',
        'no-speech':    'No speech detected — speak clearly and tap the mic to try again.',
        'not-allowed':  'Microphone blocked — enable mic access in your browser settings, then tap the mic to retry.',
        'audio-capture':'No microphone found — check your device settings.',
      };
      if (e.error !== 'aborted') setVoiceError(msgs[e.error] ?? `Mic error: ${e.error}`);
    };

    r.onresult = (e: any) => {
      const text = Array.from(e.results)
        .map((res: any) => res[0].transcript)
        .join('');
      setTranscript(text);
      setInputValue(text);
    };

    recognitionRef.current = r;
    try { r.start(); } catch { setVoiceError('Could not start microphone. Tap to retry.'); }
  };

  const stopListening = () => {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    setIsListening(false);
  };

  // Clicking mic in input bar: just opens the overlay (no auto-start)
  const openVoiceOverlay = () => {
    setShowVoiceUI(true);
    setVoiceError(null);
    setTranscript('');
  };

  const closeVoiceOverlay = () => {
    stopListening();
    setShowVoiceUI(false);
    setVoiceError(null);
    setTranscript('');
  };

  // Big mic button inside overlay: toggle listening
  const toggleListening = () => {
    if (isListening) { stopListening(); }
    else { startListening(); }
  };

  // ── Inline resource card ─────────────────────────────────────────────────
  const ResourceCardItem = ({ r }: { r: ResourceCard }) => (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden mb-2 last:mb-0">
      <div className="flex">
        <div className="w-1 shrink-0 rounded-l-xl" style={{ backgroundColor: '#1A2C5B' }} />
        <div className="flex-1 px-3 py-2.5">
          {(r.subcategory || r.category) && (
            <span className="inline-block text-[0.6rem] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full mb-1.5"
              style={{ backgroundColor: '#E8EEF8', color: '#1A2C5B' }}>
              {r.subcategory || r.category}
            </span>
          )}
          <p className="text-sm font-semibold text-gray-900 leading-snug mb-0.5">{r.title}</p>
          <p className="text-xs text-gray-500 leading-snug line-clamp-2">{r.description}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {r.isFree && (
              <span className="text-[0.6rem] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}>Free</span>
            )}
            {r.rating && (
              <span className="text-[0.6rem] text-amber-600 font-medium">★ {r.rating.toFixed(1)}</span>
            )}
          </div>
          {(r.url || r.phone) && (
            <div className="flex items-center gap-3 mt-1.5">
              {r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-medium hover:opacity-80 transition"
                  style={{ color: '#1A2C5B' }}>
                  <ExternalLink size={10} />
                  Visit site
                </a>
              )}
              {r.phone && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Phone size={10} />
                  {r.phone}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Quick reply chips ──────────────────────────────────────────────────────
  const QuickReplyChips = ({ chips }: { chips: string[] }) => (
    <div className="flex flex-wrap gap-1.5 mt-2.5 mb-1">
      {chips.map(chip => (
        <button
          key={chip}
          onClick={() => { sendMessage(chip); }}
          className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all hover:shadow-sm active:scale-95 hover:bg-[#1A2C5B] hover:text-white"
          style={{ borderColor: '#1A2C5B', color: '#1A2C5B', backgroundColor: 'white' }}
        >
          {chip}
        </button>
      ))}
    </div>
  );

  // ── AI bubble — react-markdown with prose typography ──────────────────────
  const AIBubble = ({ message, isLastAI, prevUserMsg }: { message: ChatMessage; isLastAI?: boolean; prevUserMsg?: string }) => (
    <div className="flex items-start gap-2.5 mb-4">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm"
        style={{ backgroundColor: '#1A2C5B' }}
      >
        <Bot size={13} color="white" />
      </div>
      <div className="max-w-[85%] min-w-0">
        <div
          className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm"
          style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
        >
          <div className="prose prose-sm max-w-none
            text-gray-800
            prose-headings:text-[#1A2C5B] prose-headings:font-semibold
            prose-h1:text-base prose-h2:text-sm prose-h3:text-sm
            prose-headings:mt-3 prose-headings:mb-1
            prose-p:my-1 prose-p:leading-relaxed
            prose-ul:my-1.5 prose-ul:pl-5
            prose-ol:my-1.5 prose-ol:pl-5
            prose-li:my-0.5 prose-li:leading-relaxed
            prose-strong:font-semibold prose-strong:text-gray-900
            prose-a:text-blue-600 prose-a:underline prose-a:underline-offset-2
            hover:prose-a:text-blue-800"
          >
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline underline-offset-2 hover:text-blue-800"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {preprocessMarkdown(message.content)}
            </ReactMarkdown>
          </div>
          <p className="text-[0.67rem] text-gray-400 text-right mt-2 leading-none">
            {fmtTime(message.timestamp)}
          </p>
        </div>
        {/* Resource cards — rendered below AI text bubble */}
        {message.resources && message.resources.length > 0 && (
          <div className="mt-2 w-full">
            {message.resources.map((r, i) => <ResourceCardItem key={i} r={r} />)}
          </div>
        )}
        {/* Quick reply chips — only on the most recent AI response */}
        {isLastAI && prevUserMsg && (
          <QuickReplyChips chips={getQuickReplies(prevUserMsg)} />
        )}
      </div>
    </div>
  );

  // ── User bubble ────────────────────────────────────────────────────────────
  const UserBubble = ({ message }: { message: ChatMessage }) => (
    <div className="flex justify-end items-end gap-2.5 mb-4">
      <div
        className="max-w-[78%] rounded-2xl rounded-br-none px-4 py-3 text-sm leading-relaxed text-white shadow-sm"
        style={{ backgroundColor: '#1A2C5B', wordBreak: 'break-word', overflowWrap: 'break-word' }}
      >
        <p>{message.content}</p>
        <p className="text-[0.67rem] text-right mt-1.5 opacity-50">{fmtTime(message.timestamp)}</p>
      </div>
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm"
        style={{ backgroundColor: '#B22234' }}
      >
        <User size={13} color="white" />
      </div>
    </div>
  );

  const MessageBubble = ({ message, isLastAI, prevUserMsg }: { message: ChatMessage; isLastAI?: boolean; prevUserMsg?: string }) =>
    message.role === 'user'
      ? <UserBubble message={message} />
      : <AIBubble message={message} isLastAI={isLastAI} prevUserMsg={prevUserMsg} />;

  return (
    <>
      {/* ── Floating toggle button ─────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close Vet1Stop AI chat' : 'Open Vet1Stop AI chat'}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-40 transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
        style={{ backgroundColor: '#1A2C5B' }}
      >
        {isOpen ? <X size={22} color="white" /> : <MessageSquare size={22} color="white" />}
      </button>

      {/* ── Chat panel ────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed z-40 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          style={{
            width: 'min(420px, calc(100vw - 2rem))',
            height: 'min(640px, calc(100vh - 7rem))',
            bottom: '88px',
            right: '24px',
          }}
          aria-live="polite"
          role="region"
          aria-label="Vet1Stop AI Assistant"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ backgroundColor: '#1A2C5B' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Bot size={16} color="white" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-tight">Vet1Stop AI Assistant</p>
                <p className="text-white/50 text-[0.67rem] leading-tight">Powered by Grok AI</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={clearChat}
                aria-label="Reset conversation"
                className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages — flex-1 overflow-y-auto ensures it never bleeds under input */}
          <div
            className="flex-1 overflow-y-auto overflow-x-hidden px-4 pt-4 pb-2"
            style={{ scrollBehavior: 'smooth' }}
          >
            {(() => {
              const visible = messages.filter(m => m.role !== 'system');
              const lastAIIdx = visible.map(m => m.role).lastIndexOf('assistant');
              return visible.map((m, idx) => {
                const prevUser = visible.slice(0, idx).reverse().find(x => x.role === 'user')?.content;
                return (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    isLastAI={m.role === 'assistant' && idx === lastAIIdx}
                    prevUserMsg={prevUser}
                  />
                );
              });
            })()}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex items-start gap-2.5 mb-4">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm"
                  style={{ backgroundColor: '#1A2C5B' }}
                >
                  <Bot size={13} color="white" />
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center h-4">
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '160ms' }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '320ms' }} />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center mb-3">
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {error}
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Voice UI overlay */}
          {showVoiceUI && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-10">
              {/* Big mic button — tap to start / stop */}
              <button
                onClick={toggleListening}
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
                className="relative w-20 h-20 mb-5 focus:outline-none group"
              >
                {isListening && (
                  <span
                    className="absolute inset-0 rounded-full animate-ping opacity-30"
                    style={{ backgroundColor: '#1A2C5B' }}
                  />
                )}
                <span
                  className="absolute inset-0 rounded-full flex items-center justify-center shadow-lg transition group-hover:brightness-110 group-active:scale-95"
                  style={{ backgroundColor: isListening ? '#B22234' : '#1A2C5B' }}
                >
                  <Mic size={28} color="white" />
                </span>
              </button>

              <p className="font-semibold text-sm mb-1" style={{ color: '#1A2C5B' }}>
                {isListening ? 'Listening… tap to stop' : transcript ? 'Got it! Send or tap mic to redo' : 'Tap mic to start speaking'}
              </p>

              {transcript && (
                <p className="text-sm text-gray-600 text-center mt-2 mb-3 max-w-[260px] leading-relaxed bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                  {transcript}
                </p>
              )}

              {voiceError && (
                <p className="text-xs text-red-500 text-center mb-3 max-w-[260px] leading-relaxed">{voiceError}</p>
              )}

              <div className="flex gap-2 mt-2">
                <button
                  onClick={closeVoiceOverlay}
                  className="px-4 py-2 text-sm font-medium rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { if (transcript) { sendMessage(transcript); closeVoiceOverlay(); } }}
                  disabled={!transcript}
                  className="px-4 py-2 text-sm font-medium rounded-xl text-white transition disabled:opacity-40"
                  style={{ backgroundColor: '#1A2C5B' }}
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* Input bar */}
          <form
            onSubmit={handleSend}
            className="shrink-0 flex items-center gap-2 px-3 py-3 border-t border-gray-100"
          >
            <button
              type="button"
              onClick={openVoiceOverlay}
              aria-label="Voice input"
              className="p-2 rounded-full text-gray-400 hover:text-[#1A2C5B] hover:bg-gray-100 transition shrink-0"
            >
              <Mic size={18} />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Type your message…"
              disabled={isLoading || showVoiceUI}
              className="flex-1 text-sm py-2 px-4 rounded-full border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1A2C5B]/20 focus:border-[#1A2C5B]/40 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              aria-label="Send message"
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-30 hover:brightness-110"
              style={{ backgroundColor: '#1A2C5B' }}
            >
              <Send size={14} color="white" />
            </button>
          </form>

          {/* Footer disclaimer — preserved as required */}
          <div className="shrink-0 flex items-center justify-center gap-1 px-4 py-2 border-t border-gray-100">
            <Info size={10} className="text-gray-400 shrink-0" />
            <p className="text-[0.63rem] text-gray-400 text-center leading-tight">
              Powered by Grok AI&nbsp;|&nbsp;For assistance with sensitive issues, please contact VA directly
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
