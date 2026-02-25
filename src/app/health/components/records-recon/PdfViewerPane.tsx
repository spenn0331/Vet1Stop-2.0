'use client';

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { searchPlugin } from '@react-pdf-viewer/search';
import type { OnHighlightKeyword, FlagKeyword } from '@react-pdf-viewer/search';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/search/lib/styles/index.css';

const WORKER_URL = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

interface PdfViewerPaneProps {
  fileUrl: string;
  targetPage?: number;
  searchText?: string;
  jumpTrigger?: number;
  onReady?: () => void;
}

const handleHighlightKeyword = (props: OnHighlightKeyword) => {
  props.highlightEle.style.backgroundColor = 'rgba(234, 179, 8, 0.45)';
  props.highlightEle.style.borderRadius = '2px';
  props.highlightEle.style.transition = 'background-color 0.3s ease';
  props.highlightEle.style.animation = 'recon-highlight-pulse 1.5s ease-in-out';
};

export default function PdfViewerPane({ fileUrl, targetPage, searchText, jumpTrigger, onReady }: PdfViewerPaneProps) {
  const docLoadedRef = useRef(false);
  const lastTriggerRef = useRef<number>(0);

  // Keep latest prop values in refs so the useEffect can read them without
  // being listed as deps (avoids re-firing the effect on every prop change).
  const targetPageRef = useRef(targetPage);
  const searchTextRef = useRef(searchText);
  useEffect(() => { targetPageRef.current = targetPage; });
  useEffect(() => { searchTextRef.current = searchText; });

  // Plugin instances are memoized once — the Viewer internally binds to
  // these exact objects.  Creating new instances each render produces
  // orphaned plugins where jumpToPage / highlight are no-ops.
  const searchPluginInstance = useMemo(
    () => searchPlugin({ onHighlightKeyword: handleHighlightKeyword }),
    []
  );
  const defaultLayoutPluginInstance = useMemo(
    () => defaultLayoutPlugin({
      sidebarTabs: () => [],
      toolbarPlugin: {
        fullScreenPlugin: { onEnterFullScreen: () => {}, onExitFullScreen: () => {} },
      },
    }),
    []
  );
  const plugins = useMemo(
    () => [searchPluginInstance, defaultLayoutPluginInstance],
    [searchPluginInstance, defaultLayoutPluginInstance]
  );

  // Store the plugin API functions in refs so they're never deps of useEffect
  // (avoids the infinite-loop caused by new function references each render).
  const jumpToPageRef = useRef<(page: number) => void>(() => {});
  const highlightRef = useRef<(keyword: FlagKeyword) => void>(() => {});
  const clearHighlightsRef = useRef<() => void>(() => {});

  // Sync refs to the current (memoized) plugin functions after every render.
  // Since the instances are memoized, these will be stable after first render.
  jumpToPageRef.current = defaultLayoutPluginInstance.toolbarPluginInstance
    .pageNavigationPluginInstance.jumpToPage;
  highlightRef.current = searchPluginInstance.highlight;
  clearHighlightsRef.current = searchPluginInstance.clearHighlights;

  const handleDocumentLoad = useCallback(() => {
    docLoadedRef.current = true;
    onReady?.();
  }, [onReady]);

  // Fires only when jumpTrigger increments — no plugin functions in deps.
  useEffect(() => {
    if (!jumpTrigger || jumpTrigger === lastTriggerRef.current) return;
    if (!docLoadedRef.current) return;

    lastTriggerRef.current = jumpTrigger;
    const currentTrigger = jumpTrigger;

    const page = targetPageRef.current;
    if (page && page >= 1) {
      jumpToPageRef.current(page - 1);
    }

    // Retry highlighting across 4 intervals — the PDF text layer for the
    // target page may take a moment to render after the scroll.
    const timers: ReturnType<typeof setTimeout>[] = [];

    const runHighlight = () => {
      if (lastTriggerRef.current !== currentTrigger) return;
      clearHighlightsRef.current();
      const text = searchTextRef.current;
      if (!text || text.trim().length === 0) return;
      const query = text.substring(0, 60).replace(/\s+/g, ' ').trim();
      if (query.length >= 3) {
        highlightRef.current({ keyword: query, matchCase: false, wholeWords: false });
      }
    };

    for (const delay of [400, 900, 1600, 2500]) {
      timers.push(setTimeout(runHighlight, delay));
    }
    timers.push(setTimeout(() => {
      if (lastTriggerRef.current === currentTrigger) clearHighlightsRef.current();
    }, 10000));

    return () => timers.forEach(clearTimeout);
  }, [jumpTrigger]); // only jumpTrigger — all other values read from refs

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
          plugins={plugins}
          onDocumentLoad={handleDocumentLoad}
        />
      </Worker>
    </div>
  );
}
