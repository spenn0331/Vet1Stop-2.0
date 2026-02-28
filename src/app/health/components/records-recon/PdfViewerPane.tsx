'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import type { Plugin } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import type { OnHighlightKeyword } from '@react-pdf-viewer/search';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/search/lib/styles/index.css';

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

// ─── Search query builder ────────────────────────────────────────────────────
// Returns query strings ordered by specificity: longest clean prefix first
// (high precision), then shorter fallback (better recall when excerpt spans
// a PDF line break), then a suffix from the end of the text.
const trimAtWord = (s: string, max: number): string => {
  if (s.length <= max) return s;
  const sp = s.lastIndexOf(' ', max);
  return sp > Math.floor(max / 3) ? s.substring(0, sp) : s.substring(0, max);
};

const buildSearchQueries = (text: string): string[] => {
  if (!text || text.trim().length === 0) return [];
  const normalized = text.replace(/\s+/g, ' ').trim();
  const queries: string[] = [];

  const riskyIdx = normalized.search(/[^a-zA-Z0-9\s.,'\'\-]/);

  let cleanFull: string;
  if (riskyIdx < 0) {
    cleanFull = normalized;
  } else if (riskyIdx >= 15) {
    cleanFull = normalized.substring(0, riskyIdx).trim();
  } else {
    cleanFull = normalized
      .replace(/[^a-zA-Z0-9\s.,'\'\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const primary = trimAtWord(cleanFull, 50).replace(/[.,\-']+$/, '').trim();
  if (primary.length >= 8) queries.push(primary);

  const fallback = trimAtWord(cleanFull, 28).replace(/[.,\-']+$/, '').trim();
  if (fallback.length >= 8 && fallback !== primary) queries.push(fallback);

  if (cleanFull.length > 30) {
    const suffixStart = cleanFull.length - 28;
    const spaceAfter = cleanFull.indexOf(' ', Math.max(suffixStart, 0));
    if (spaceAfter > 0 && spaceAfter < cleanFull.length - 8) {
      const suffix = cleanFull.substring(spaceAfter + 1).replace(/[.,\-']+$/, '').trim();
      if (suffix.length >= 8 && suffix !== primary && suffix !== fallback) {
        queries.push(suffix);
      }
    }
  }

  return queries;
};

const handleHighlightKeyword = (props: OnHighlightKeyword) => {
  props.highlightEle.style.backgroundColor = 'rgba(234, 179, 8, 0.45)';
  props.highlightEle.style.borderRadius = '2px';
  props.highlightEle.style.transition = 'background-color 0.3s ease';
  props.highlightEle.style.animation = 'recon-highlight-pulse 1.5s ease-in-out';
};

// ─── Manual text-layer highlighting ──────────────────────────────────────────
// Searches ONLY the target page's rendered text-layer DOM for matching text.
// Bypasses the search plugin's global search + auto-scroll which would jump
// to the first match in the entire document (often the wrong page).

function highlightTextOnPage(pageIndex: number, queries: string[]): boolean {
  const pageEl = document.querySelector(
    `[data-testid="core__page-layer-${pageIndex}"]`
  );
  if (!pageEl) return false;

  const textLayer =
    pageEl.querySelector(`[data-testid="core__text-layer-${pageIndex}"]`) ||
    pageEl.querySelector('[class*="text-layer"]');
  if (!textLayer || textLayer.childElementCount === 0) return false;

  const spans = Array.from(textLayer.querySelectorAll('span')) as HTMLSpanElement[];
  if (spans.length === 0) return false;

  const segments: { el: HTMLSpanElement; start: number; end: number }[] = [];
  let concat = '';
  for (const span of spans) {
    const raw = span.textContent || '';
    if (raw.length === 0) continue;
    if (concat.length > 0) concat += ' ';
    const start = concat.length;
    concat += raw;
    segments.push({ el: span, start, end: concat.length });
  }
  if (concat.length === 0) return false;

  for (const q of queries) {
    const needle = q.replace(/\s+/g, ' ').trim();
    if (needle.length < 3) continue;

    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flexPattern = escaped.replace(/\s+/g, '\\s+');
    const regex = new RegExp(flexPattern, 'i');
    const match = regex.exec(concat);
    if (!match) continue;

    const matchStart = match.index;
    const matchEnd = matchStart + match[0].length;

    let highlighted = false;
    for (const seg of segments) {
      if (seg.end > matchStart && seg.start < matchEnd) {
        seg.el.style.backgroundColor = '#FACC15';
        seg.el.style.outline = '3px solid #EAB308';
        seg.el.style.outlineOffset = '1px';
        seg.el.style.borderRadius = '2px';
        seg.el.style.boxShadow = '0 0 8px 2px rgba(234, 179, 8, 0.6)';
        seg.el.style.mixBlendMode = 'multiply';
        seg.el.style.animation = 'recon-highlight-pulse 1.5s ease-in-out';
        seg.el.setAttribute('data-recon-highlight', 'true');
        highlighted = true;
      }
    }
    if (highlighted) return true;
  }
  return false;
}

function clearManualHighlights(): void {
  document.querySelectorAll('[data-recon-highlight="true"]').forEach(el => {
    const span = el as HTMLSpanElement;
    span.style.backgroundColor = '';
    span.style.outline = '';
    span.style.outlineOffset = '';
    span.style.borderRadius = '';
    span.style.boxShadow = '';
    span.style.mixBlendMode = '';
    span.style.animation = '';
    span.removeAttribute('data-recon-highlight');
  });
}

// ─── Bridge plugin ────────────────────────────────────────────────────────────
// Captures the Viewer's raw jumpToPage (virtualizer.scrollToItem) during
// install(), bypassing the page-navigation plugin's store indirection which
// silently no-ops when the store isn't populated (React 18 strict-mode).
interface BridgeFunctions {
  jumpToPage: ((pageIndex: number) => Promise<void> | void) | null;
}

function createBridgePlugin(fns: React.MutableRefObject<BridgeFunctions>): Plugin {
  return {
    install: (pluginFunctions) => {
      fns.current.jumpToPage = (pluginFunctions as unknown as Record<string, Function>).jumpToPage as BridgeFunctions['jumpToPage'];
    },
    uninstall: () => {
      fns.current.jumpToPage = null;
    },
  };
}

export default function PdfViewerPane({ fileUrl, targetPage, searchText, jumpTrigger, onReady }: PdfViewerPaneProps) {
  const [docLoaded, setDocLoaded] = useState(false);
  const lastTriggerRef = useRef<number>(0);

  const bridgeFnsRef = useRef<BridgeFunctions>({ jumpToPage: null });
  const bridgePluginRef = useRef(createBridgePlugin(bridgeFnsRef));

  const _layout = defaultLayoutPlugin({
    sidebarTabs: () => [],
    toolbarPlugin: {
      searchPlugin: {
        onHighlightKeyword: handleHighlightKeyword,
      },
    },
  });

  const stableLayoutRef = useRef(_layout);
  const pluginsArray = useRef<Plugin[]>([stableLayoutRef.current, bridgePluginRef.current]);

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
    const jumpFn = bridgeFnsRef.current.jumpToPage;

    const timers: ReturnType<typeof setTimeout>[] = [];
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    clearManualHighlights();

    if (page && page >= 1 && jumpFn) {
      const pageIndex = page - 1;

      jumpFn(pageIndex);

      timers.push(setTimeout(() => {
        if (lastTriggerRef.current !== currentTrigger) return;
        jumpFn(pageIndex);
      }, 150));

      timers.push(setTimeout(() => {
        if (lastTriggerRef.current !== currentTrigger) return;
        jumpFn(pageIndex);
      }, 500));
    }

    const queries = buildSearchQueries(searchTextRef.current || '');

    if (queries.length > 0 && page && page >= 1) {
      let succeeded = false;

      const tryHighlight = () => {
        if (succeeded || lastTriggerRef.current !== currentTrigger) return;
        if (highlightTextOnPage(page - 1, queries)) {
          succeeded = true;
          if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
        }
      };

      [500, 1000, 1500, 2000, 3000, 4500, 6000, 8000].forEach(delay =>
        timers.push(setTimeout(tryHighlight, delay))
      );

      let pollCount = 0;
      pollInterval = setInterval(() => {
        if (succeeded || lastTriggerRef.current !== currentTrigger || pollCount >= 15) {
          if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
          return;
        }
        pollCount++;
        tryHighlight();
      }, 800);
    }

    return () => {
      timers.forEach(clearTimeout);
      if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
    };
  }, [jumpTrigger, docLoaded]);

  return (
    <div className="h-full w-full relative overflow-hidden" style={{ minHeight: '400px' }}>
      <style>{`
        @keyframes recon-highlight-pulse {
          0% { background-color: #FDE047; box-shadow: 0 0 12px 4px rgba(234,179,8,0.8); }
          50% { background-color: #EAB308; box-shadow: 0 0 6px 1px rgba(234,179,8,0.4); }
          100% { background-color: #FACC15; box-shadow: 0 0 8px 2px rgba(234,179,8,0.6); }
        }
        .rpv-default-layout__toolbar {
          background-color: #EFF6FF !important;
          border-bottom: 1px solid #DBEAFE !important;
          padding: 2px 4px !important;
          min-height: 0 !important;
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          gap: 0 !important;
        }
        .rpv-default-layout__body {
          background-color: #F9FAFB !important;
        }
        .rpv-default-layout__toolbar .rpv-core__minimal-button {
          padding: 4px !important;
          width: 28px !important;
          height: 28px !important;
        }
        .rpv-default-layout__toolbar .rpv-core__minimal-button svg {
          width: 16px !important;
          height: 16px !important;
        }
        .rpv-default-layout__toolbar .rpv-zoom__popover-target {
          padding: 2px 4px !important;
          font-size: 11px !important;
        }
        .rpv-default-layout__toolbar .rpv-zoom__popover-target-scale {
          font-size: 11px !important;
        }
        .rpv-default-layout__toolbar .rpv-zoom__popover-target-arrow {
          display: none !important;
        }
        .rpv-core__page-navigation-current-page-input {
          width: 3rem !important;
        }
        .rpv-page-navigation__current-page-input {
          width: 3rem !important;
        }
        .rpv-default-layout__toolbar .rpv-core__page-navigation-current-page-input input {
          padding: 2px 4px !important;
          font-size: 12px !important;
          width: 3rem !important;
        }
        .rpv-default-layout__toolbar .rpv-toolbar__item {
          padding: 0 1px !important;
        }
        .rpv-default-layout__toolbar .rpv-core__page-navigation-num-pages,
        .rpv-default-layout__toolbar .rpv-page-navigation__current-page-input-of {
          font-size: 11px !important;
        }
      `}</style>

      <Worker workerUrl={WORKER_URL}>
        <Viewer
          fileUrl={fileUrl}
          defaultScale={SpecialZoomLevel.PageWidth}
          plugins={pluginsArray.current}
          onDocumentLoad={handleDocumentLoad}
        />
      </Worker>
    </div>
  );
}
