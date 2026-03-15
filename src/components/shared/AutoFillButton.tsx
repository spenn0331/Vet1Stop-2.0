'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';

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

export default function AutoFillButton({ context: _context = 'global' }: AutoFillButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/auto-fill')}
      className="fixed bottom-6 right-6 z-40 bg-[#EAB308] hover:bg-[#FACC15] text-[#1A2C5B] p-4 rounded-full shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-4 focus:ring-yellow-300 group"
      aria-label="Open Auto-Fill engine"
      title="Auto-Fill: Upload DD-214 once, populate forever"
    >
      <DocumentDuplicateIcon className="h-6 w-6" aria-hidden="true" />
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-[#1A2C5B] text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
        Auto-Fill Forms
      </span>
    </button>
  );
}
