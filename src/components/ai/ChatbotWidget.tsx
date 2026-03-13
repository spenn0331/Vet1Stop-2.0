/**
 * Chatbot Widget Component
 * 
 * This component provides a floating chatbot interface accessible
 * on every page of the Vet1Stop website. It helps veterans with
 * site navigation, resource discovery, and general questions.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon, 
  XMarkIcon, 
  ArrowPathIcon,
  MicrophoneIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import useAIChat, { ChatMessage } from '@/hooks/useAIChat';
import useVoiceCommand from '@/hooks/useVoiceCommand';

// Color scheme based on Vet1Stop patriotic theme
const COLORS = {
  PRIMARY: '#1A2C5B', // Navy blue
  SECONDARY: '#EAB308', // Gold
  ACCENT: '#B22234', // Red
  LIGHT: '#F9FAFB',
  DARK: '#111827',
  GRAY: '#6B7280',
};

interface ChatbotWidgetProps {
  userProfile?: any;
  currentPage?: string;
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  userProfile,
  currentPage = 'Home',
}) => {
  // States
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showVoiceUI, setShowVoiceUI] = useState(false);
  
  // Router for navigation
  const router = useRouter();
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // AI Chat hook
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  } = useAIChat(userProfile, currentPage);
  
  // Voice command hook
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    lastResult,
    error: voiceError
  } = useVoiceCommand({
    continuous: false,
    onCommand: (result) => {
      // Handle navigation commands
      if (result.intent === 'navigation' && result.action === 'navigate') {
        const target = result.parameters?.target;
        if (target) {
          router.push(`/${target}`);
          setShowVoiceUI(false);
        }
      }
      
      // Handle search commands
      if (result.intent === 'search' && result.action === 'find_resources') {
        const query = result.parameters?.keywords || '';
        const category = result.parameters?.category || '';
        
        if (category) {
          router.push(`/${category}?search=${query}`);
          setShowVoiceUI(false);
        }
      }
      
      // Handle info commands
      if (result.intent === 'info') {
        // Send the transcript to the chatbot
        sendMessage(result.transcript);
        setShowVoiceUI(false);
      }
    }
  });
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !showVoiceUI) {
      inputRef.current?.focus();
    }
  }, [isOpen, showVoiceUI]);
  
  // Update input with transcript when using voice
  useEffect(() => {
    if (showVoiceUI && transcript) {
      setInputValue(transcript);
    }
  }, [transcript, showVoiceUI]);
  
  // Toggle chatbot open/closed
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };
  
  // Handle sending a message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };
  
  // Toggle voice input
  const toggleVoiceInput = () => {
    if (showVoiceUI) {
      stopListening();
      setShowVoiceUI(false);
    } else {
      setShowVoiceUI(true);
      startListening();
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  // Render AI message content: strips artifacts, handles markdown lists/headers/links cleanly
  const formatMessageWithLinks = (content: string): string => {
    // Strip all accessibility artifacts including (link to url) patterns
    let text = content
      .replace(/\s*\(Section Heading\)/gi, '')
      .replace(/\[List starts\]\n?/gi, '')
      .replace(/\[List ends\]\s*[-\u2013]?\s*/gi, '')
      .replace(/\s*\(link to [^)]+\)/gi, '')
      .replace(/\[(?:pointing finger|checkmark|warning|phone|email|link|mobile phone|exclamation)\]\s*/gi, '');

    // Markdown links [text](url) → <a>
    text = text.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="ai-link" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Site page references → links
    text = text.replace(
      /\b(Health|Education|Careers|Life and Leisure|Local|Shop|Social)\s+page\b/gi,
      (match) => {
        const page = match.replace(/\s+page$/i, '').toLowerCase().replace(/\s+and\s+/i, '-');
        return `<a href="/${page}" class="ai-link">${match}</a>`;
      }
    );

    // Process line by line — handle lists, headers, empty lines
    const lines = text.split('\n');
    const segments: string[] = [];
    let listItems: string[] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        segments.push(`<ul class="ai-list">${listItems.join('')}</ul>`);
        listItems = [];
      }
    };

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();

      // Skip lone bullet with no content
      if (/^[\s]*[-•*]\s*$/.test(line)) continue;

      // Bullet item
      const bulletMatch = line.match(/^[\s]*[-•*]\s+(.+)/);
      if (bulletMatch && bulletMatch[1].trim()) {
        listItems.push(`<li class="ai-li"><span class="ai-dot">·</span><span>${bulletMatch[1]}</span></li>`);
        continue;
      }

      flushList();

      // Numbered item
      const numberedMatch = line.match(/^[\s]*(\d+)\.\s+(.+)/);
      if (numberedMatch) {
        segments.push(`<div class="ai-num-row"><span class="ai-num">${numberedMatch[1]}.</span><span>${numberedMatch[2]}</span></div>`);
        continue;
      }

      // Header (## ### #) → bold label, NOT h2/h3 inside a chat bubble
      const headerMatch = line.match(/^#{1,3}\s+(.+)/);
      if (headerMatch) {
        segments.push(`<div class="ai-hdr">${headerMatch[1]}</div>`);
        continue;
      }

      // Empty line → small spacer
      if (!line.trim()) {
        if (segments.length > 0) segments.push('<div class="ai-gap"></div>');
        continue;
      }

      segments.push(`<div class="ai-p">${line}</div>`);
    }

    flushList();

    let result = segments.join('');
    result = result.replace(/\*\*([^*<\n]+)\*\*/g, '<strong>$1</strong>');
    return result;
  };

  // Premium message bubble
  const MessageBubble = ({ message }: { message: ChatMessage }) => {
    const isUser = message.role === 'user';

    if (isUser) {
      return (
        <div className="flex justify-end mb-3">
          <div
            style={{
              maxWidth: '78%',
              backgroundColor: '#1A2C5B',
              color: 'white',
              borderRadius: '18px 18px 4px 18px',
              padding: '10px 14px',
              fontSize: '0.875rem',
              lineHeight: '1.55',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            <div>{message.content}</div>
            <div style={{ fontSize: '0.68rem', opacity: 0.55, textAlign: 'right', marginTop: '5px' }}>
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-start gap-2 mb-3">
        <div
          style={{
            width: '28px', height: '28px', borderRadius: '50%',
            backgroundColor: '#1A2C5B', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginTop: '2px',
          }}
        >
          <ChatBubbleLeftRightIcon style={{ width: '13px', height: '13px', color: 'white' }} />
        </div>
        <div style={{ maxWidth: '85%', minWidth: 0 }}>
          <div
            style={{
              backgroundColor: '#F3F4F6',
              borderRadius: '4px 18px 18px 18px',
              padding: '10px 14px',
              fontSize: '0.875rem',
              lineHeight: '1.55',
              color: '#1F2937',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            <div
              className="message-content"
              dangerouslySetInnerHTML={{ __html: formatMessageWithLinks(message.content) }}
            />
            <div style={{ fontSize: '0.68rem', color: '#9CA3AF', textAlign: 'right', marginTop: '5px' }}>
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Chatbot toggle button */}
      <button
        onClick={toggleChat}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all z-40"
        style={{
          backgroundColor: COLORS.PRIMARY,
          position: 'fixed',
          bottom: '24px',
          right: '24px'
        }}
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
        )}
      </button>

      {/* Chatbot panel */}
      {isOpen && (
        <div 
          className="fixed bg-white rounded-lg shadow-xl flex flex-col z-40 border border-gray-200 overflow-hidden"
          style={{ 
            width: '450px',  // Increased from 384px (w-96) to 450px
            height: 'calc(100vh - 140px)', // Increased height
            bottom: '80px',
            right: '24px',
            maxHeight: '90vh' // Increased max height
          }}
          aria-live="polite"
          role="region"
          aria-label="Chat with Vet1Stop AI Assistant"
        >
          {/* Header */}
          <div 
            className="px-4 py-3 border-b border-gray-200 flex justify-between items-center"
            style={{ backgroundColor: COLORS.PRIMARY, color: COLORS.LIGHT }}
          >
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
              <h3 className="font-medium">Vet1Stop AI Assistant</h3>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={clearChat}
                aria-label="Clear chat history"
                className="p-1 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-white"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
              <button 
                onClick={toggleChat}
                aria-label="Close chat"
                className="p-1 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-white"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Messages container */}
          <div className="flex-1 p-4 overflow-y-auto overflow-x-hidden" style={{ scrollBehavior: 'smooth' }}>
            {/* Semantic CSS for AI message content */}
            <style jsx global>{`
              .message-content .ai-link { color: #2563EB; text-decoration: underline; text-underline-offset: 2px; }
              .message-content .ai-link:hover { color: #1D4ED8; }
              .message-content .ai-list { margin: 5px 0; padding: 0; list-style: none; }
              .message-content .ai-li { display: flex; gap: 6px; margin: 2px 0; align-items: flex-start; }
              .message-content .ai-dot { color: #1A2C5B; font-weight: 700; flex-shrink: 0; line-height: 1.55; }
              .message-content .ai-num-row { display: flex; gap: 6px; margin: 2px 0; align-items: flex-start; }
              .message-content .ai-num { color: #1A2C5B; font-weight: 600; flex-shrink: 0; min-width: 1.1em; }
              .message-content .ai-hdr { font-weight: 600; color: #1A2C5B; margin-top: 10px; margin-bottom: 3px; }
              .message-content .ai-gap { height: 6px; }
              .message-content .ai-p { margin: 2px 0; }
              .message-content strong { font-weight: 600; }
            `}</style>
            {messages
              .filter(msg => msg.role !== 'system')
              .map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            
            {isLoading && (
              <div className="flex items-start gap-2 mb-3">
                <div style={{ width:'28px',height:'28px',borderRadius:'50%',backgroundColor:'#1A2C5B',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:'2px' }}>
                  <ChatBubbleLeftRightIcon style={{ width:'13px',height:'13px',color:'white' }} />
                </div>
                <div style={{ backgroundColor:'#F3F4F6',borderRadius:'4px 18px 18px 18px',padding:'12px 16px' }}>
                  <div className="flex gap-1.5 items-center">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.18s' }} />
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.36s' }} />
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 text-red-800 rounded-lg px-4 py-2 text-sm">
                  {error}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Voice UI overlay */}
          {showVoiceUI && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center p-4">
              <div className="relative w-24 h-24 mb-4">
                <div 
                  className={`absolute inset-0 rounded-full bg-blue-100 ${
                    isListening ? 'animate-ping opacity-75' : 'opacity-50'
                  }`}
                  style={{ backgroundColor: isListening ? COLORS.SECONDARY : COLORS.GRAY }}
                ></div>
                <div className="absolute inset-0 rounded-full bg-white bg-opacity-50 flex items-center justify-center">
                  <MicrophoneIcon 
                    className={`h-10 w-10 ${isListening ? 'text-blue-600' : 'text-gray-500'}`}
                    style={{ color: isListening ? COLORS.PRIMARY : COLORS.GRAY }} 
                  />
                </div>
              </div>
              
              <div className="text-center mb-4">
                {isListening ? (
                  <p className="font-medium text-blue-700" style={{ color: COLORS.PRIMARY }}>
                    Listening...
                  </p>
                ) : (
                  <p className="font-medium text-gray-500">Click to start speaking</p>
                )}
              </div>
              
              {transcript && (
                <div className="bg-white rounded-lg p-3 shadow-md mb-4 w-full max-h-32 overflow-y-auto">
                  <p className="text-gray-800">{transcript}</p>
                </div>
              )}
              
              {voiceError && (
                <div className="text-red-500 text-sm mb-4">
                  {voiceError}
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={toggleVoiceInput}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  style={{ backgroundColor: COLORS.ACCENT }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (transcript) {
                      sendMessage(transcript);
                      setShowVoiceUI(false);
                      stopListening();
                    }
                  }}
                  disabled={!transcript}
                  className={`px-4 py-2 text-white rounded-md ${
                    transcript 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  style={{ backgroundColor: transcript ? COLORS.PRIMARY : COLORS.GRAY }}
                >
                  Send
                </button>
              </div>
            </div>
          )}
          
          {/* Input form */}
          <form 
            onSubmit={handleSendMessage}
            className="p-3 border-t border-gray-200 flex items-center"
          >
            <button
              type="button"
              onClick={toggleVoiceInput}
              aria-label="Voice input"
              className="p-2 text-gray-500 hover:text-blue-600 focus:outline-none focus:text-blue-600"
            >
              <MicrophoneIcon className="h-5 w-5" />
            </button>
            
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1 py-2 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading || showVoiceUI}
            />
            
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              aria-label="Send message"
              className={`p-2 ml-2 rounded-full ${
                inputValue.trim() && !isLoading
                  ? 'text-blue-600 hover:bg-blue-50'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              style={{ color: inputValue.trim() && !isLoading ? COLORS.PRIMARY : COLORS.GRAY }}
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </form>
          
          {/* Footer */}
          <div className="px-3 py-2 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-center">
            <InformationCircleIcon className="h-3 w-3 mr-1" />
            <span>
              Powered by Grok AI | For assistance with sensitive issues, please contact VA directly
            </span>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
