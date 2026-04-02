// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import {
  TrophyIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowTopRightOnSquareIcon,
  UserGroupIcon,
  CheckBadgeIcon,
  SparklesIcon,
  PhoneIcon,
  InformationCircleIcon,
  HeartIcon,
  ChartBarIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { mockNGOOfTheMonth } from '@/utils/ngo-data';
import type { NGOResource, ScoreBreakdown } from '@/utils/ngo-data';

interface BannerData {
  ngoOfTheMonth: NGOResource;
  scoreBreakdown: ScoreBreakdown;
  selectionMonth: string;
  isManualOverride: boolean;
}

function computeScoreLocal(ngo: NGOResource): ScoreBreakdown {
  const m = ngo.metrics ?? {};
  const impactComponent = Math.round(((m.impactScore ?? 50) / 100) * 35);
  const ratingComponent = Math.round((Math.min(ngo.rating ?? 3.5, 5) / 5) * 25);
  const fundingComponent = Math.round(Math.min(m.fundingEfficiency ?? 0.5, 1) * 20);
  const veteransComponent = m.veteransSupportedCount
    ? Math.round(Math.min(m.veteransSupportedCount / 200000, 1) * 20)
    : 10;
  return {
    impactComponent,
    ratingComponent,
    fundingComponent,
    veteransComponent,
    total: impactComponent + ratingComponent + fundingComponent + veteransComponent,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBar({ label, value, max, colorClass }: { label: string; value: number; max: number; colorClass: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-32 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-600 w-10 text-right tabular-nums">
        {value}<span className="text-gray-400 font-normal">/{max}</span>
      </span>
    </div>
  );
}

function MetricChip({
  label,
  value,
  sub,
  Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Icon: React.ComponentType<any>;
}) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-[#1A2C5B] opacity-50 shrink-0" aria-hidden="true" />
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide truncate">{label}</span>
      </div>
      <p className="text-sm font-extrabold text-[#1A2C5B] leading-tight">{value}</p>
      {sub && <p className="text-[10px] text-gray-400 leading-tight">{sub}</p>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function NGOOfTheMonthBanner() {
  const [data, setData] = useState<BannerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [howOpen, setHowOpen] = useState(false);

  useEffect(() => {
    fetch('/api/ngos/month')
      .then(r => r.json())
      .then(json => {
        const ngo: NGOResource = (json.success && json.ngoOfTheMonth) ? json.ngoOfTheMonth : mockNGOOfTheMonth;
        const breakdown: ScoreBreakdown = json.scoreBreakdown ?? computeScoreLocal(ngo);
        setData({
          ngoOfTheMonth: ngo,
          scoreBreakdown: breakdown,
          selectionMonth: json.selectionMonth ?? new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
          isManualOverride: json.isManualOverride ?? false,
        });
      })
      .catch(() => {
        const ngo = mockNGOOfTheMonth;
        setData({
          ngoOfTheMonth: ngo,
          scoreBreakdown: computeScoreLocal(ngo),
          selectionMonth: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
          isManualOverride: false,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
          <div className="h-6 w-56 bg-slate-100 rounded mb-3" />
          <div className="h-44 bg-slate-50 rounded-xl border border-slate-100" />
        </div>
      </section>
    );
  }
  if (!data) return null;

  const { ngoOfTheMonth: ngo, scoreBreakdown: sb, selectionMonth, isManualOverride } = data;
  const orgName = ngo.name || ngo.title || 'Unknown Organization';
  const vetCount = ngo.metrics?.veteransSupportedCount;
  const fundingEff = ngo.metrics?.fundingEfficiency;
  const engagementRate = ngo.metrics?.engagementRate;
  const websiteUrl = ngo.link || ngo.website || ngo.contact?.website;
  const phone = ngo.contact?.phone;

  return (
    <section aria-labelledby="ngo-month-heading" className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header — matches "Featured Partners" heading style */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-[#EAB308]" aria-hidden="true" />
            <div>
              <h2 id="ngo-month-heading" className="text-2xl font-extrabold text-[#1A2C5B] tracking-tight">
                Community Choice Award
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {selectionMonth} &middot; Scored by community metrics &mdash; not a paid placement
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isManualOverride && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                <InformationCircleIcon className="h-3 w-3" aria-hidden="true" />
                Admin Selected
              </span>
            )}
            <a
              href="mailto:partnerships@vet1stop.com?subject=Premium+NGO+Spotlight+Inquiry"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#1A2C5B] transition-colors focus:outline-none focus:underline"
            >
              <SparklesIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Become a Partner
            </a>
          </div>
        </div>

        {/* Main card — lighter than premium, clearly secondary */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Thin gold top accent (echoes premium card gold border, but subtle) */}
          <div className="h-0.5 bg-gradient-to-r from-[#EAB308]/60 via-[#EAB308]/30 to-transparent" />

          <div className="p-5 sm:p-6">

            {/* Identity row */}
            <div className="flex flex-wrap items-start gap-4 mb-4">
              {/* Icon */}
              <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                <UserGroupIcon className="h-6 w-6 text-[#1A2C5B]/60" aria-hidden="true" />
              </div>

              {/* Name + badges + description */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EAB308]/10 text-[#8B6914] text-xs font-bold uppercase tracking-wide">
                    <TrophyIcon className="h-3 w-3" aria-hidden="true" />
                    {selectionMonth}
                  </span>
                  {(ngo.isVerified || ngo.verified) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                      <CheckBadgeIcon className="h-3 w-3" aria-hidden="true" />
                      Vet1Stop Verified
                    </span>
                  )}
                  {ngo.veteranFounded && (
                    <span className="px-2 py-0.5 rounded-full bg-red-50 text-[#B22234] text-xs font-semibold">
                      Veteran Founded
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-extrabold text-[#1A2C5B]">{orgName}</h3>
                {ngo.description && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2 leading-snug max-w-2xl">{ngo.description}</p>
                )}
              </div>

              {/* Community Score — navy bg, gold number */}
              <div
                className="flex flex-col items-center justify-center bg-[#1A2C5B] rounded-xl px-4 py-3 shadow-sm shrink-0 min-w-[72px] text-center"
                aria-label={`Community score: ${sb.total} out of 100`}
              >
                <p className="text-[8px] font-bold uppercase tracking-widest text-white/50 leading-none">Score</p>
                <p className="text-3xl font-black leading-tight text-[#EAB308]">{sb.total}</p>
                <p className="text-[8px] text-white/40">/100</p>
              </div>
            </div>

            {/* 4 metric chips — compact 4-column grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <MetricChip
                label="Community Rating"
                value={ngo.rating ? `${ngo.rating.toFixed(1)} ★` : 'N/A'}
                sub={ngo.reviewCount ? `${ngo.reviewCount.toLocaleString()} reviews` : undefined}
                Icon={StarIcon}
              />
              <MetricChip
                label="Veterans Supported"
                value={vetCount ? (vetCount >= 1000 ? `${(vetCount / 1000).toFixed(0)}K+` : vetCount.toLocaleString()) : 'N/A'}
                sub="program participants"
                Icon={UserGroupIcon}
              />
              <MetricChip
                label="Funding to Veterans"
                value={fundingEff ? `${Math.round(fundingEff * 100)}%` : 'N/A'}
                sub="of funds to programs"
                Icon={HeartIcon}
              />
              <MetricChip
                label="Engagement Rate"
                value={engagementRate ? `${Math.round(engagementRate * 100)}%` : 'N/A'}
                sub="on platform this month"
                Icon={ChartBarIcon}
              />
            </div>

            {/* Score breakdown — compact */}
            <div className="bg-slate-50 rounded-lg border border-slate-100 px-4 py-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Score Breakdown</span>
                <span className="text-[10px] text-gray-400">Auto-updated monthly</span>
              </div>
              <div className="space-y-1.5">
                <ScoreBar label="Impact Score" value={sb.impactComponent} max={35} colorClass="bg-[#1A2C5B]" />
                <ScoreBar label="Community Rating" value={sb.ratingComponent} max={25} colorClass="bg-[#EAB308]" />
                <ScoreBar label="Funding Efficiency" value={sb.fundingComponent} max={20} colorClass="bg-slate-500" />
                <ScoreBar label="Reach & Engagement" value={sb.veteransComponent} max={20} colorClass="bg-slate-400" />
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Total Community Score</span>
                <span className="text-xs font-black text-[#1A2C5B]">{sb.total} / 100</span>
              </div>
            </div>

            {/* CTA + how chosen row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-3">
                {websiteUrl && (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1A2C5B] text-white font-bold text-sm hover:bg-[#243d7a] transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                    aria-label={`Visit ${orgName}`}
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                    Visit {orgName}
                  </a>
                )}
                {phone && (
                  <a
                    href={`tel:${phone.replace(/\D/g, '')}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-all"
                    aria-label={`Call ${orgName}`}
                  >
                    <PhoneIcon className="h-4 w-4" aria-hidden="true" />
                    {phone}
                  </a>
                )}
                <button
                  onClick={() => setHowOpen(p => !p)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-[#1A2C5B] transition-colors focus:outline-none focus:underline"
                  aria-expanded={howOpen}
                  aria-controls="how-chosen-panel"
                >
                  <InformationCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  How are winners chosen?
                  {howOpen
                    ? <ChevronUpIcon className="h-3 w-3 ml-0.5" aria-hidden="true" />
                    : <ChevronDownIcon className="h-3 w-3 ml-0.5" aria-hidden="true" />
                  }
                </button>
              </div>
              <a
                href="mailto:partnerships@vet1stop.com?subject=Premium+NGO+Spotlight+Inquiry"
                className="text-xs font-semibold text-gray-400 hover:text-[#1A2C5B] transition-colors whitespace-nowrap focus:outline-none focus:underline"
              >
                Want permanent placement? Become a Partner →
              </a>
            </div>

            {/* How chosen panel */}
            {howOpen && (
              <div
                id="how-chosen-panel"
                className="mt-3 bg-slate-50 border border-slate-100 rounded-lg p-4 text-xs text-gray-500 space-y-1.5"
              >
                <p className="font-bold text-[#1A2C5B] mb-2">Monthly Auto-Selection Algorithm</p>
                <p>🎯 <strong>Impact Score (35%)</strong> — Program outcome rating from verified veteran service data</p>
                <p>⭐ <strong>Community Rating (25%)</strong> — Aggregate star rating from Vet1Stop user reviews</p>
                <p>💰 <strong>Funding Efficiency (20%)</strong> — % of funds going directly to veteran programs vs. overhead</p>
                <p>👥 <strong>Reach &amp; Engagement (20%)</strong> — Veterans supported, normalized against top performer</p>
                <p className="text-gray-400 pt-2 border-t border-slate-200 mt-1">
                  Winners auto-selected on the 1st of each month. Vet1Stop admins may review and confirm.{' '}
                  <strong>Not a paid placement.</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
