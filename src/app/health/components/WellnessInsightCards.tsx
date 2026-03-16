'use client';

import React, { useState, useCallback } from 'react';
import {
  SparklesIcon,
  ArrowPathIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import type { InsightCard } from '@/app/api/health/wellness/insights/route';

interface WellnessInsightCardsProps {
  log: { date: string; scores: { mood: number; energy: number; sleep: number; pain: number; social: number }; notes: string }[];
}

type CardType = InsightCard['type'];

const TYPE_META: Record<CardType, { icon: React.ComponentType<{ className?: string }>; bg: string; border: string; iconColor: string }> = {
  trend:          { icon: ArrowTrendingUpIcon,       bg: 'bg-blue-50',   border: 'border-blue-100',   iconColor: 'text-blue-500'   },
  correlation:    { icon: ChartBarIcon,              bg: 'bg-purple-50', border: 'border-purple-100', iconColor: 'text-purple-500' },
  warning:        { icon: ExclamationTriangleIcon,   bg: 'bg-amber-50',  border: 'border-amber-100',  iconColor: 'text-amber-500'  },
  positive:       { icon: CheckCircleIcon,           bg: 'bg-emerald-50',border: 'border-emerald-100',iconColor: 'text-emerald-500'},
  recommendation: { icon: LightBulbIcon,             bg: 'bg-indigo-50', border: 'border-indigo-100', iconColor: 'text-indigo-500' },
};

// Skeleton card for loading state
function InsightSkeleton() {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-8 w-8 rounded-xl bg-gray-200 flex-shrink-0" />
        <div className="h-4 w-3/4 bg-gray-200 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded-full" />
        <div className="h-3 bg-gray-200 rounded-full w-5/6" />
        <div className="h-3 bg-gray-200 rounded-full w-4/6" />
      </div>
      <div className="mt-4 h-3 w-1/2 bg-gray-200 rounded-full" />
    </div>
  );
}

export default function WellnessInsightCards({ log }: WellnessInsightCardsProps) {
  const [insights,   setInsights]   = useState<InsightCard[] | null>(null);
  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [source,     setSource]     = useState<'ai' | 'static' | null>(null);
  const [hasLoaded,  setHasLoaded]  = useState(false);

  const loadInsights = useCallback(async () => {
    if (log.length < 3) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/health/wellness/insights', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ entries: log }),
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      setInsights(data.insights);
      setSource(data.source);
      setHasLoaded(true);
    } catch {
      setError('Could not load insights. Your check-in data is safe.');
    } finally {
      setIsLoading(false);
    }
  }, [log]);

  // ── Empty / not yet loaded ────────────────────────────────────────────────
  if (log.length < 3) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-8 text-center">
        <SparklesIcon className="h-8 w-8 text-gray-200 mx-auto mb-3" aria-hidden="true" />
        <p className="text-sm text-gray-400 leading-relaxed">
          AI insights unlock after 3 check-ins.<br />
          <span className="text-gray-300">{3 - log.length} more needed.</span>
        </p>
      </div>
    );
  }

  if (!hasLoaded && !isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold text-[#1A2C5B]">AI Wellness Insights</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Patterns and recommendations from your check-in history</p>
          </div>
          <SparklesIcon className="h-5 w-5 text-indigo-300" aria-hidden="true" />
        </div>
        <button
          onClick={loadInsights}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-200 shadow-sm"
          aria-label="Generate AI wellness insights"
        >
          <SparklesIcon className="h-4 w-4" aria-hidden="true" />
          Analyze My Trends
        </button>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          Powered by Grok AI · Based on your last {Math.min(log.length, 14)} check-ins · Private
        </p>
      </div>
    );
  }

  // ── Loading skeletons ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <ArrowPathIcon className="h-4 w-4 text-indigo-400 animate-spin" aria-hidden="true" />
          <span className="text-sm font-semibold text-gray-500">Analyzing your wellness patterns…</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <InsightSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button onClick={loadInsights} className="text-sm text-[#1A2C5B] font-semibold hover:underline">
          Try again
        </button>
      </div>
    );
  }

  // ── Insight cards ─────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-[#1A2C5B]">AI Wellness Insights</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {source === 'ai'
              ? `Personalized from your last ${Math.min(log.length, 14)} check-ins`
              : 'General veteran wellness guidance'}
          </p>
        </div>
        <button
          onClick={loadInsights}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
          aria-label="Refresh AI insights"
        >
          <ArrowPathIcon className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(insights ?? []).map(card => {
          const meta = TYPE_META[card.type] ?? TYPE_META.recommendation;
          const Icon = meta.icon;
          return (
            <div
              key={card.id}
              className={`${meta.bg} ${meta.border} border rounded-2xl p-4`}
              role="article"
              aria-label={card.title}
            >
              <div className="flex items-start gap-3 mb-2">
                <div className={`h-8 w-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <Icon className={`h-4 w-4 ${meta.iconColor}`} aria-hidden="true" />
                </div>
                <h4 className="text-sm font-extrabold text-[#1A2C5B] leading-tight mt-1">{card.title}</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-3">{card.body}</p>
              {card.action && (
                <div className="bg-white/70 rounded-xl px-3 py-2">
                  <p className="text-[11px] font-semibold text-gray-700">
                    <span className="text-gray-400 mr-1">→</span>{card.action}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-5 pb-4">
        <p className="text-[10px] text-gray-400 text-center leading-relaxed">
          AI insights are for personal wellness awareness only — not clinical guidance. Always discuss health concerns with your VA provider.
        </p>
      </div>
    </div>
  );
}
