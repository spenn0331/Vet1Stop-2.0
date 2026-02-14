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
  
  // Convert text with site links to clickable links
  const formatMessageWithLinks = (content: string) => {
    // Replace site page references with clickable links
    const sitePageRegex = /\b(Health|Education|Careers|Life and Leisure|Local|Shop|Social)\s+page\b/gi;
    let formattedContent = content.replace(sitePageRegex, (match) => {
      const page = match.replace(/\s+page$/i, '').toLowerCase().replace(/\s+and\s+/i, '-');
      return `<a href="/${page}" class="text-blue-600 hover:underline">${match}</a>`;
    });
    
    // Replace section references with clickable links
    const sectionRegex = /(Mental Health Resources|PTSD Support|VA Programs|Education Benefits|Career Services)\s+section/gi;
    formattedContent = formattedContent.replace(sectionRegex, (match) => {
      const section = match.replace(/\s+section$/i, '').toLowerCase().replace(/\s+/g, '-');
      const page = section.includes('mental') || section.includes('ptsd') || section.includes('va') ? 'health' : 
                  section.includes('education') ? 'education' : 
                  section.includes('career') ? 'careers' : 'home';
      return `<a href="/${page}#${section}" class="text-blue-600 hover:underline">${match}</a>`;
    });
    
    // Format markdown-style links [text](url)
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    formattedContent = formattedContent.replace(markdownLinkRegex, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Format headings for better readability
    formattedContent = formattedContent.replace(/###\s+(.+)$/gm, '<h3 class="font-bold text-lg mt-3 mb-1">$1</h3>');
    formattedContent = formattedContent.replace(/##\s+(.+)$/gm, '<h2 class="font-bold text-xl mt-4 mb-2">$1</h2>');
    formattedContent = formattedContent.replace(/#\s+(.+)$/gm, '<h1 class="font-bold text-2xl mt-4 mb-2">$1</h1>');
    
    // Format lists for better readability
    formattedContent = formattedContent.replace(/^\d+\.\s+(.+)$/gm, '<div class="ml-4 mb-2">• $1</div>');
    formattedContent = formattedContent.replace(/^-\s+(.+)$/gm, '<div class="ml-4 mb-2">• $1</div>');
    
    // Format bold text
    formattedContent = formattedContent.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Add paragraph breaks
    formattedContent = formattedContent.replace(/\n\n/g, '<br/><br/>');
    
    return formattedContent;
  };

  // Message bubble component
  const MessageBubble = ({ message }: { message: ChatMessage }) => {
    const isUser = message.role === 'user';
    
    return (
      <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div 
          className={`rounded-lg px-4 py-3 ${isUser ? 'max-w-[85%]' : 'max-w-[90%]'} ${
            isUser 
              ? 'bg-blue-100 text-blue-900' 
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          {isUser ? (
            <div className="text-sm">{message.content}</div>
          ) : (
            <div 
              className="text-sm message-content" 
              dangerouslySetInnerHTML={{ __html: formatMessageWithLinks(message.content) }}
            />
          )}
          <div className="text-xs text-gray-500 mt-2 text-right">
            {formatTimestamp(message.timestamp)}
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
          <div className="flex-1 p-4 overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>
            {/* Add custom CSS for message content */}
            <style jsx global>{`
              .message-content h1, .message-content h2, .message-content h3 {
                color: #1A2C5B;
                margin-top: 0.75rem;
                margin-bottom: 0.5rem;
              }
              .message-content a {
                color: #2563EB;
                text-decoration: none;
              }
              .message-content a:hover {
                text-decoration: underline;
              }
              .message-content strong {
                font-weight: 600;
              }
            `}</style>
            {messages
              .filter(msg => msg.role !== 'system')
              .map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-2 max-w-[80%]">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
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
