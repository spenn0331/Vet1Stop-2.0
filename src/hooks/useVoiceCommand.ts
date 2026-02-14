/**
 * useVoiceCommand Hook
 * 
 * Custom React hook for handling voice commands.
 * This is especially important for accessibility, particularly for veterans
 * with disabilities or amputees who may have difficulty using traditional input methods.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { processVoiceCommand } from '@/lib/ai/grokService';

// Voice recognition result interface
export interface VoiceCommandResult {
  intent: string;
  action: string;
  parameters?: Record<string, any>;
  transcript: string;
}

// Hook options interface
interface UseVoiceCommandOptions {
  autoStart?: boolean;
  continuous?: boolean;
  language?: string;
  wakeWord?: string;
  onCommand?: (result: VoiceCommandResult) => void;
  onError?: (error: string) => void;
}

/**
 * Custom hook for voice command functionality
 */
export default function useVoiceCommand({
  autoStart = false,
  continuous = false,
  language = 'en-US',
  wakeWord = 'hey vet one stop',
  onCommand,
  onError
}: UseVoiceCommandOptions = {}) {
  // State for voice recognition status and results
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<VoiceCommandResult | null>(null);
  
  // Reference to the SpeechRecognition instance
  const recognitionRef = useRef<any>(null);
  
  // Check if wake word was detected
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  
  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Your browser does not support speech recognition. Please try a different browser.');
      return;
    }
    
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    // Configure speech recognition
    recognitionRef.current.continuous = continuous;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = language;
    
    // Set up event handlers
    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setError(null);
    };
    
    recognitionRef.current.onend = () => {
      setIsListening(false);
      
      // Restart if continuous listening is enabled and no error occurred
      if (continuous && !error) {
        recognitionRef.current.start();
      }
    };
    
    recognitionRef.current.onerror = (event: any) => {
      const errorMessage = `Speech recognition error: ${event.error}`;
      setError(errorMessage);
      setIsListening(false);
      
      if (onError) {
        onError(errorMessage);
      }
    };
    
    recognitionRef.current.onresult = (event: any) => {
      // Get the transcript
      const currentTranscript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join(' ');
      
      setTranscript(currentTranscript);
      
      // Check for wake word if not already detected
      if (!wakeWordDetected && !isProcessing) {
        const lowerTranscript = currentTranscript.toLowerCase();
        if (lowerTranscript.includes(wakeWord.toLowerCase())) {
          setWakeWordDetected(true);
          
          // Extract the command part after the wake word
          const commandPart = lowerTranscript.split(wakeWord.toLowerCase())[1]?.trim();
          if (commandPart) {
            processCommand(commandPart);
          }
        }
      }
      
      // Process the final result if wake word is not required or already detected
      if (event.results[event.results.length - 1].isFinal && (wakeWordDetected || !wakeWord)) {
        if (!isProcessing) {
          processCommand(currentTranscript);
        }
      }
    };
    
    // Start automatically if enabled
    if (autoStart) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Error starting speech recognition:', e);
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    };
  }, [autoStart, continuous, language, wakeWord, onError, isProcessing, wakeWordDetected]);

  /**
   * Process the voice command
   */
  const processCommand = useCallback(async (text: string) => {
    if (!text.trim() || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Process the command using Grok API
      const result = await processVoiceCommand(text);
      
      // Update the last result
      const commandResult: VoiceCommandResult = {
        ...result,
        transcript: text
      };
      
      setLastResult(commandResult);
      
      // Call the onCommand callback
      if (onCommand) {
        onCommand(commandResult);
      }
      
      // Reset wake word detection if not in continuous mode
      if (!continuous) {
        setWakeWordDetected(false);
      }
      
    } catch (err) {
      console.error('Error processing voice command:', err);
      setError('Failed to process voice command. Please try again.');
      
      if (onError) {
        onError('Failed to process voice command');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, onCommand, onError, continuous]);

  /**
   * Start listening for voice commands
   */
  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.start();
      setError(null);
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setError('Could not start speech recognition');
      
      if (onError) {
        onError('Could not start speech recognition');
      }
    }
  }, [onError]);

  /**
   * Stop listening for voice commands
   */
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
      setWakeWordDetected(false);
    } catch (err) {
      console.error('Error stopping speech recognition:', err);
    }
  }, []);

  /**
   * Reset the recognition state
   */
  const reset = useCallback(() => {
    setTranscript('');
    setLastResult(null);
    setWakeWordDetected(false);
    setError(null);
  }, []);

  return {
    isListening,
    isProcessing,
    transcript,
    error,
    lastResult,
    wakeWordDetected,
    startListening,
    stopListening,
    reset
  };
}
