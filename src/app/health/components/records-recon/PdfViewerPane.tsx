'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { searchPlugin } from '@react-pdf-viewer/search';
import type { OnHighlightKeyword } from '@react-pdf-viewer/search';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/search/lib/styles/index.css';

// Dynamically resolve the installed pdfjs-dist version to prevent silent render
// failures from worker/library version mismatches. Falls back to the package.json
// version if the dynamic import fails.
import pdfjsPkg from 'pdfjs-dist/package.json';
const PDFJS_VERSION = pdfjsPkg.version || '3.11.174';
const WORKER_URL = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`;

interface PdfViewerPaneProps {
  fileUrl: string;
  targetPage?: number;
  searchText?: string;
  jumpTrigger?: number;
  onReady?: () => void;
}

interface SearchKeyword {
  keyword: string;
  matchCase: boolean;
  wholeWords: boolean;
}

const handleHighlightKeyword = (props: OnHighlightKeyword) => {
  props.highlightEle.style.backgroundColor = 'rgba(234, 179, 8, 0.45)';
  props.highlightEle.style.borderRadius = '2px';
  props.highlightEle.style.transition = 'background-color 0.3s ease';
  props.highlightEle.style.animation = 'recon-highlight-pulse 1.5s ease-in-out';
};

export default function PdfViewerPane({ fileUrl, targetPage, searchText, jumpTrigger, onReady }: PdfViewerPaneProps) {
  const [docLoaded, setDocLoaded] = useState(false);
  const lastTriggerRef = useRef<number>(0);

  // @react-pdf-viewer plugins call React hooks internally, so they MUST be
  // called at the top level of the component (Rules of Hooks).
  // They cannot be wrapped in useMemo, useEffect, or any other hook.
  // We call them every render (required), but stabilise the Viewer by only
  // ever passing the FIRST render's instances via a ref — the Viewer never
  // reinitialises, so jumpToPage and highlight stay connected.
  const _search = searchPlugin({ onHighlightKeyword: handleHighlightKeyword });
  const _layout = defaultLayoutPlugin({ sidebarTabs: () => [] });

  // Initialised once from the first render and never updated.
  const stableSearchRef = useRef(_search);
  const stableLayoutRef = useRef(_layout);
  const stablePluginsRef = useRef([stableSearchRef.current, stableLayoutRef.current]);

  const { highlight, clearHighlights } = stableSearchRef.current;
  const { jumpToPage } = stableLayoutRef.current.toolbarPluginInstance.pageNavigationPluginInstance;

  // Keep the latest prop values in refs so the effect reads them without
  // needing to list them as dependencies (prevents spurious re-fires).
  const targetPageRef = useRef(targetPage);
  const searchTextRef = useRef(searchText);
  targetPageRef.current = targetPage;
  searchTextRef.current = searchText;

  const handleDocumentLoad = useCallback(() => {
    setDocLoaded(true);
    onReady?.();
  }, [onReady]);

  useEffect(() => {
    if (!jumpTrigger || jumpTrigger === lastTriggerRef.current) return;
    if (!docLoaded) return;

    lastTriggerRef.current = jumpTrigger;
    const currentTrigger = jumpTrigger;

    const page = targetPageRef.current;
    if (page && page >= 1) {
      jumpToPage(page - 1);
    }

    // Retry highlighting at multiple intervals — the PDF text layer for the
    // target page may not be rendered immediately after jumpToPage scrolls.
    const timers: ReturnType<typeof setTimeout>[] = [];

    const runHighlight = () => {
      if (lastTriggerRef.current !== currentTrigger) return;
      clearHighlights();
      const text = searchTextRef.current;
      if (!text || text.trim().length === 0) return;
      const query = text.substring(0, 60).replace(/\s+/g, ' ').trim();
      if (query.length >= 3) {
        highlight({ keyword: query, matchCase: false, wholeWords: false } as SearchKeyword);
      }
    };

    [400, 900, 1600, 2500].forEach(delay => timers.push(setTimeout(runHighlight, delay)));
    timers.push(setTimeout(() => {
      if (lastTriggerRef.current === currentTrigger) clearHighlights();
    }, 10000));

    return () => timers.forEach(clearTimeout);
  }, [jumpTrigger, docLoaded, jumpToPage, highlight, clearHighlights]);

  return (
    <div className="h-full w-full relative" style={{ minHeight: '400px' }}>
      <style>{`
        @keyframes recon-highlight-pulse {
          0% { background-color: rgba(234, 179, 8, 0.8); }
          50% { background-color: rgba(234, 179, 8, 0.3); }
          100% { background-color: rgba(234, 179, 8, 0.45); }
        }
        .rpv-default-layout__toolbar {
          background-color: #EFF6FF !important;
          border-bottom: 1px solid #DBEAFE !important;
        }
        .rpv-default-layout__body {
          background-color: #F9FAFB !important;
        }
      `}</style>

      <Worker workerUrl={WORKER_URL}>
        <Viewer
          fileUrl={fileUrl}
          defaultScale={SpecialZoomLevel.PageWidth}
          plugins={stablePluginsRef.current}
          onDocumentLoad={handleDocumentLoad}
        />
      </Worker>
    </div>
  );
}
