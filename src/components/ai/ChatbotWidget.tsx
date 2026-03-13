/**
 * ChatbotWidget — Premium AI Assistant
 * Vet1Stop floating chat panel. react-markdown + lucide-react + @tailwindcss/typography.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { Bot, User, X, RotateCcw, Send, Mic, Info, MessageSquare } from 'lucide-react';
import useAIChat, { ChatMessage } from '@/hooks/useAIChat';
import useVoiceCommand from '@/hooks/useVoiceCommand';

interface ChatbotWidgetProps {
  userProfile?: any;
  currentPage?: string;
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

  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, isLoading, error, sendMessage, clearChat } = useAIChat(userProfile, currentPage);

  const { isListening, transcript, startListening, stopListening, error: voiceError } = useVoiceCommand({
    continuous: false,
    onCommand: (result) => {
      if (result.intent === 'navigation' && result.action === 'navigate') {
        const target = result.parameters?.target;
        if (target) { router.push(`/${target}`); setShowVoiceUI(false); }
      }
      if (result.intent === 'search' && result.action === 'find_resources') {
        const query = result.parameters?.keywords || '';
        const category = result.parameters?.category || '';
        if (category) { router.push(`/${category}?search=${query}`); setShowVoiceUI(false); }
      }
      if (result.intent === 'info') {
        sendMessage(result.transcript);
        setShowVoiceUI(false);
      }
    },
  });

  // Auto-scroll to bottom on every new message or loading state change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && !showVoiceUI) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen, showVoiceUI]);

  // Mirror voice transcript into input
  useEffect(() => {
    if (showVoiceUI && transcript) setInputValue(transcript);
  }, [transcript, showVoiceUI]);

  const fmtTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim()) { sendMessage(inputValue); setInputValue(''); }
  };

  const toggleVoice = () => {
    if (showVoiceUI) { stopListening(); setShowVoiceUI(false); }
    else { setShowVoiceUI(true); startListening(); }
  };

  // ── AI bubble — react-markdown with prose typography ──────────────────────
  const AIBubble = ({ message }: { message: ChatMessage }) => (
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

  const MessageBubble = ({ message }: { message: ChatMessage }) =>
    message.role === 'user' ? <UserBubble message={message} /> : <AIBubble message={message} />;

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
            {messages
              .filter(m => m.role !== 'system')
              .map(m => <MessageBubble key={m.id} message={m} />)}

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
              <div className="relative w-20 h-20 mb-5">
                {isListening && (
                  <div
                    className="absolute inset-0 rounded-full animate-ping opacity-30"
                    style={{ backgroundColor: '#1A2C5B' }}
                  />
                )}
                <div
                  className="absolute inset-0 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: '#1A2C5B' }}
                >
                  <Mic size={28} color="white" />
                </div>
              </div>
              <p className="font-semibold text-sm mb-3" style={{ color: '#1A2C5B' }}>
                {isListening ? 'Listening…' : 'Tap mic to start'}
              </p>
              {transcript && (
                <p className="text-sm text-gray-600 text-center mb-4 max-w-[240px] leading-relaxed">{transcript}</p>
              )}
              {voiceError && <p className="text-xs text-red-500 mb-3">{voiceError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={toggleVoice}
                  className="px-4 py-2 text-sm font-medium rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { if (transcript) { sendMessage(transcript); setShowVoiceUI(false); stopListening(); } }}
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
              onClick={toggleVoice}
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
