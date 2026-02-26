'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import type { Plugin } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import type { OnHighlightKeyword } from '@react-pdf-viewer/search';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/search/lib/styles/index.css';

const WORKER_URL = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

interface PdfViewerPaneProps {
  fileUrl: string;
  targetPage?: number;
  searchText?: string;
  jumpTrigger?: number;
  onReady?: () => void;
}

// ─── Build search queries ────────────────────────────────────────────────────
// Returns an array of query strings ordered by specificity.  The first is the
// longest clean prefix (best precision), the second is a shorter fallback that
// stays within a single PDF text-layer line (better recall when the excerpt
// spans a line break in the rendered PDF).
const trimAtWord = (s: string, max: number): string => {
  if (s.length <= max) return s;
  const sp = s.lastIndexOf(' ', max);
  return sp > Math.floor(max / 3) ? s.substring(0, sp) : s.substring(0, max);
};

const buildSearchQueries = (text: string): string[] => {
  if (!text || text.trim().length === 0) return [];
  const normalized = text.replace(/\s+/g, ' ').trim();
  const queries: string[] = [];

  // Characters safe in PDF text layers
  const riskyIdx = normalized.search(/[^a-zA-Z0-9\s.,'\'\-]/);

  // Get the longest "clean" text (no risky chars)
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

  // Primary query — up to 50 chars (high precision)
  const primary = trimAtWord(cleanFull, 50).replace(/[.,\-']+$/, '').trim();
  if (primary.length >= 8) queries.push(primary);

  // Fallback query — up to 28 chars (fits within a single PDF text line,
  // resilient to line breaks that split longer excerpts)
  const fallback = trimAtWord(cleanFull, 28).replace(/[.,\-']+$/, '').trim();
  if (fallback.length >= 8 && fallback !== primary) queries.push(fallback);

  // Suffix query — takes ~28 chars from the END of the clean text.
  // When the excerpt crosses a PDF line break near the beginning, the
  // prefix-based queries above both fail.  The suffix starts later in
  // the text, past the break, and is much more likely to match.
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
// This completely bypasses the search plugin's global search + auto-scroll,
// which is the root cause of the "jump to wrong page" bug.

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

    // Regex that treats whitespace in the query as flexible \s+ so line
    // breaks between spans don't prevent matching.
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
// Lightweight custom plugin whose sole job is to capture the Viewer's raw
// pluginFunctions during install().  This gives us a DIRECT reference to the
// Viewer's own jumpToPage (virtualizer.scrollToItem) — completely bypassing
// the page-navigation plugin's store indirection, which silently no-ops when
// the store isn't populated due to React 18 strict-mode double-mounting.
interface BridgeFunctions {
  jumpToPage: ((pageIndex: number) => Promise<void> | void) | null;
}

function createBridgePlugin(fns: React.MutableRefObject<BridgeFunctions>): Plugin {
  return {
    install: (pluginFunctions) => {
      fns.current.jumpToPage = (pluginFunctions as unknown as Record<string, Function>).jumpToPage as BridgeFunctions['jumpToPage'];
      console.log('[ReconPDF] Bridge install — jumpToPage captured:', typeof fns.current.jumpToPage);
    },
    uninstall: () => {
      fns.current.jumpToPage = null;
      console.log('[ReconPDF] Bridge uninstall');
    },
  };
}

export default function PdfViewerPane({ fileUrl, targetPage, searchText, jumpTrigger, onReady }: PdfViewerPaneProps) {
  const [docLoaded, setDocLoaded] = useState(false);
  const lastTriggerRef = useRef<number>(0);

  // ── Bridge plugin ref — holds the Viewer's raw jumpToPage ──────────────
  const bridgeFnsRef = useRef<BridgeFunctions>({ jumpToPage: null });
  const bridgePluginRef = useRef(createBridgePlugin(bridgeFnsRef));

  // ── defaultLayoutPlugin uses React.useMemo internally — it MUST be
  //    called at the top level of the component on every render (Rules of
  //    Hooks).  We stabilise by only ever passing the first render's
  //    instance to the Viewer via a ref.
  const _layout = defaultLayoutPlugin({
    sidebarTabs: () => [],
    toolbarPlugin: {
      searchPlugin: {
        onHighlightKeyword: handleHighlightKeyword,
      },
    },
  });

  const stableLayoutRef = useRef(_layout);

  // Pass both the layout plugin AND the bridge plugin to the Viewer.
  const pluginsArray = useRef<Plugin[]>([stableLayoutRef.current, bridgePluginRef.current]);

  // Keep the latest prop values in refs so the effect reads them without
  // needing to list them as dependencies (prevents spurious re-fires).
  const targetPageRef = useRef(targetPage);
  const searchTextRef = useRef(searchText);
  targetPageRef.current = targetPage;
  searchTextRef.current = searchText;

  const handleDocumentLoad = useCallback(() => {
    console.log('[ReconPDF] Document loaded, bridgeJump available:', typeof bridgeFnsRef.current.jumpToPage);
    setDocLoaded(true);
    onReady?.();
  }, [onReady]);

  useEffect(() => {
    if (!jumpTrigger || jumpTrigger === lastTriggerRef.current) return;
    if (!docLoaded) {
      console.log('[ReconPDF] Jump requested but doc not loaded yet');
      return;
    }

    lastTriggerRef.current = jumpTrigger;
    const currentTrigger = jumpTrigger;

    const page = targetPageRef.current;
    const jumpFn = bridgeFnsRef.current.jumpToPage;
    console.log(`[ReconPDF] Jumping to page ${page} (0-indexed: ${page ? page - 1 : 'N/A'}), bridgeJump: ${typeof jumpFn}`);

    const timers: ReturnType<typeof setTimeout>[] = [];
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    clearManualHighlights();

    if (page && page >= 1 && jumpFn) {
      const pageIndex = page - 1;

      jumpFn(pageIndex);

      // Re-fire after a short delay — the virtualizer may not have accurate
      // scroll measurements on the very first programmatic jump.
      timers.push(setTimeout(() => {
        if (lastTriggerRef.current !== currentTrigger) return;
        jumpFn(pageIndex);
      }, 150));

      // Third retry at 500ms for mobile.
      timers.push(setTimeout(() => {
        if (lastTriggerRef.current !== currentTrigger) return;
        jumpFn(pageIndex);
      }, 500));
    } else if (page && page >= 1 && !jumpFn) {
      console.warn('[ReconPDF] jumpToPage NOT available — bridge install may not have run');
    }

    // Manual highlighting — searches ONLY the target page's text layer DOM.
    // No global search, no auto-scroll to first match on wrong page.
    const queries = buildSearchQueries(searchTextRef.current || '');

    if (queries.length > 0 && page && page >= 1) {
      let succeeded = false;

      const tryHighlight = () => {
        if (succeeded || lastTriggerRef.current !== currentTrigger) return;
        if (highlightTextOnPage(page - 1, queries)) {
          succeeded = true;
          if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
          console.log(`[ReconPDF] Manual highlight succeeded on page ${page}`);
        }
      };

      // Fixed-delay retries — the text layer for a far-away page may take
      // seconds to render after the jump, especially on mobile.
      [500, 1000, 1500, 2000, 3000, 4500, 6000, 8000].forEach(delay =>
        timers.push(setTimeout(tryHighlight, delay))
      );

      // Also poll every 800ms to catch the text layer the moment it appears.
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
    <div className="h-full w-full relative overflow-hidden">
      <style>{`
        @keyframes recon-highlight-pulse {
          0% { background-color: #FDE047; box-shadow: 0 0 12px 4px rgba(234,179,8,0.8); }
          50% { background-color: #EAB308; box-shadow: 0 0 6px 1px rgba(234,179,8,0.4); }
          100% { background-color: #FACC15; box-shadow: 0 0 8px 2px rgba(234,179,8,0.6); }
        }
        .rpv-default-layout__toolbar {
          background-color: #EFF6FF !important;
          border-bottom: 1px solid #DBEAFE !important;
        }
        .rpv-default-layout__body {
          background-color: #F9FAFB !important;
        }
        /* Widen the page number input so large page numbers aren't clipped */
        .rpv-core__page-navigation-current-page-input {
          width: 4rem !important;
        }
        .rpv-page-navigation__current-page-input {
          width: 4rem !important;
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
