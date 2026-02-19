'use client';

import React, { useState } from 'react';
import {
  DocumentDuplicateIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

/**
 * AutoFillButton – Shared floating action button (FAB)
 * 
 * Phase 1 MVP: Upload DD-214 once → OCR/NLP pulls name, service dates, disabilities
 * → AI fills state/VA PDFs automatically. Saved to Digital Sea Bag for reuse.
 * 
 * This component renders a persistent FAB in the bottom-right corner
 * that opens an overlay panel for Auto-Fill functionality.
 * Designed to be reused site-wide via layout or individual pages.
 */

interface AutoFillButtonProps {
  /** Which page context this is rendered on (affects form suggestions) */
  context?: 'health' | 'education' | 'careers' | 'life' | 'global';
}

export default function AutoFillButton({ context = 'global' }: AutoFillButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUploaded, setHasUploaded] = useState(false);

  const contextLabels: Record<string, string> = {
    health: 'health/VA forms',
    education: 'education/school forms',
    careers: 'career/employment forms',
    life: 'life forms (leases, taxes)',
    global: 'any VA or government form',
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-[#EAB308] hover:bg-[#FACC15] text-[#1A2C5B] p-4 rounded-full shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-4 focus:ring-yellow-300 group"
        aria-label="Open Auto-Fill assistant"
        title="Auto-Fill: Upload once, populate forever"
      >
        <DocumentDuplicateIcon className="h-6 w-6" />
        {/* Tooltip on hover */}
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-[#1A2C5B] text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
          Auto-Fill Forms
        </span>
      </button>

      {/* Overlay Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md mx-0 sm:mx-4 max-h-[85vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-[#1A2C5B] text-white rounded-t-2xl sm:rounded-t-2xl px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DocumentDuplicateIcon className="h-6 w-6 text-[#EAB308]" />
                <div>
                  <h3 className="font-bold text-lg">Auto-Fill Engine</h3>
                  <p className="text-xs text-blue-200">Upload Once, Populate Forever</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded transition-colors"
                aria-label="Close Auto-Fill panel"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {!hasUploaded ? (
                <>
                  {/* How It Works */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-[#1A2C5B] mb-3">How It Works</h4>
                    <div className="space-y-3">
                      {[
                        { step: '1', icon: <ArrowUpTrayIcon className="h-5 w-5" />, text: 'Upload your DD-214 or military documents once' },
                        { step: '2', icon: <SparklesIcon className="h-5 w-5" />, text: 'AI extracts name, service dates, disabilities, and key data' },
                        { step: '3', icon: <DocumentTextIcon className="h-5 w-5" />, text: `Auto-fills ${contextLabels[context]} instantly` },
                      ].map(item => (
                        <div key={item.step} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1A2C5B] text-white flex items-center justify-center text-sm font-bold">
                            {item.step}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700 pt-1">
                            <span className="text-[#1A2C5B]">{item.icon}</span>
                            {item.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#1A2C5B] hover:bg-blue-50/50 transition-colors cursor-pointer"
                    onClick={() => {
                      // In full implementation, this opens a file picker
                      // For MVP, show coming-soon state
                      setHasUploaded(true);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setHasUploaded(true)}
                    aria-label="Upload DD-214 or military documents"
                  >
                    <ArrowUpTrayIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-[#1A2C5B]">Upload DD-214 or Military Docs</p>
                    <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG — Secure & encrypted</p>
                  </div>

                  {/* Security Note */}
                  <p className="text-xs text-gray-400 text-center mt-4">
                    Your data is encrypted and stored securely in your personal Digital Sea Bag. Only you can access it.
                  </p>
                </>
              ) : (
                <>
                  {/* Coming Soon State */}
                  <div className="text-center py-4">
                    <div className="bg-[#EAB308]/10 p-4 rounded-full inline-block mb-4">
                      <SparklesIcon className="h-12 w-12 text-[#EAB308]" />
                    </div>
                    <h4 className="text-lg font-bold text-[#1A2C5B] mb-2">Auto-Fill Coming Soon!</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      The full Auto-Fill Engine is being finalized. When ready, you&apos;ll upload your DD-214 once and auto-populate {contextLabels[context]} across the entire platform.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-xs text-blue-800">
                        <strong>What&apos;s included:</strong> Name, rank, service dates, branch, MOS, disability ratings, and more — extracted automatically from your documents.
                      </p>
                    </div>
                    <button
                      onClick={() => setHasUploaded(false)}
                      className="text-[#1A2C5B] text-sm underline hover:no-underline"
                    >
                      Back
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-gray-50 rounded-b-2xl border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                Part of the Vet1Stop Utility Layer — eliminating paperwork friction for veterans.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
