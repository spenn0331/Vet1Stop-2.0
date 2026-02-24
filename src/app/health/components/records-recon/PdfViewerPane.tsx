'use client';

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { searchPlugin } from '@react-pdf-viewer/search';
import type { OnHighlightKeyword } from '@react-pdf-viewer/search';

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
  const [docLoaded, setDocLoaded] = useState(false);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const lastTriggerRef = useRef<number>(0);

  // Stable plugin instances — memoized so the Viewer keeps its internal
  // connection to these exact objects across renders.  Without this,
  // every render creates new disconnected plugins, making jumpToPage
  // and highlight no-ops on orphaned instances.
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

  // Stable plugins array so the Viewer doesn't re-install on every render
  const plugins = useMemo(
    () => [searchPluginInstance, defaultLayoutPluginInstance],
    [searchPluginInstance, defaultLayoutPluginInstance]
  );

  const { highlight, clearHighlights } = searchPluginInstance;
  const { toolbarPluginInstance } = defaultLayoutPluginInstance;
  const { pageNavigationPluginInstance } = toolbarPluginInstance;
  const { jumpToPage } = pageNavigationPluginInstance;

  const handleDocumentLoad = useCallback(() => {
    setDocLoaded(true);
    onReady?.();
  }, [onReady]);

  useEffect(() => {
    if (!jumpTrigger || jumpTrigger === lastTriggerRef.current) return;
    if (!docLoaded) return;

    lastTriggerRef.current = jumpTrigger;
    const currentTrigger = jumpTrigger;

    if (targetPage && targetPage >= 1) {
      jumpToPage(targetPage - 1);
    }

    // Highlight with retries — the text layer for the target page may not
    // be rendered immediately after jumpToPage scrolls to it.
    const timers: ReturnType<typeof setTimeout>[] = [];
    const delays = [400, 900, 1600, 2500];

    const runHighlight = () => {
      if (lastTriggerRef.current !== currentTrigger) return;
      clearHighlights();

      if (!searchText || searchText.trim().length === 0) return;

      const query = searchText
        .substring(0, 60)
        .replace(/\s+/g, ' ')
        .trim();

      if (query.length >= 3) {
        highlight({ keyword: query, matchCase: false, wholeWords: false });
      }
    };

    for (const delay of delays) {
      timers.push(setTimeout(runHighlight, delay));
    }

    // Auto-clear highlights after 10 seconds
    timers.push(setTimeout(() => {
      if (lastTriggerRef.current === currentTrigger) {
        clearHighlights();
      }
    }, 10000));

    return () => timers.forEach(clearTimeout);
  }, [jumpTrigger, targetPage, searchText, docLoaded, jumpToPage, highlight, clearHighlights]);

  return (
    <div ref={viewerContainerRef} className="h-full w-full relative" style={{ minHeight: '400px' }}>
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
