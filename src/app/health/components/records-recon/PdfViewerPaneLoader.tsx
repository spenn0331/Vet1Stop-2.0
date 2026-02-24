'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled — PDF.js requires browser APIs (canvas, etc.)
const PdfViewerPane = dynamic(
  () => import('./PdfViewerPane'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#1A2C5B] border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-mono">Loading PDF viewer...</p>
        </div>
      </div>
    ),
  }
);

interface PdfViewerPaneLoaderProps {
  fileUrl: string;
  targetPage?: number;
  searchText?: string;
  jumpTrigger?: number;
  onReady?: () => void;
}

export default function PdfViewerPaneLoader(props: PdfViewerPaneLoaderProps) {
  return <PdfViewerPane {...props} />;
}
