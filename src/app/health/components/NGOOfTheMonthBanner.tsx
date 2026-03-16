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
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-36 shrink-0 leading-tight">{label}</span>
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-gray-700 w-12 text-right tabular-nums">
        {value}<span className="text-gray-400 font-normal">/{max}</span>
      </span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  Icon,
  bgClass,
  textClass,
  borderClass,
}: {
  label: string;
  value: string;
  sub?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Icon: React.ComponentType<any>;
  bgClass: string;
  textClass: string;
  borderClass: string;
}) {
  return (
    <div className={`rounded-xl p-3.5 border ${bgClass} ${borderClass} flex items-start gap-3`}>
      <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${textClass} opacity-70`} aria-hidden="true" />
      <div className="min-w-0">
        <p className={`text-[11px] font-semibold uppercase tracking-wide ${textClass} opacity-60 mb-0.5`}>
          {label}
        </p>
        <p className={`text-base font-extrabold ${textClass} leading-tight`}>{value}</p>
        {sub && <p className={`text-[11px] ${textClass} opacity-50 mt-0.5 leading-tight`}>{sub}</p>}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <section className="py-10 bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 bg-emerald-200 rounded-full" />
          <div className="h-6 w-72 bg-emerald-100 rounded-lg" />
        </div>
        <div className="bg-white rounded-2xl border-2 border-emerald-100 shadow-sm h-64" />
      </div>
    </section>
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

  if (loading) return <LoadingSkeleton />;
  if (!data) return null;

  const { ngoOfTheMonth: ngo, scoreBreakdown: sb, selectionMonth, isManualOverride } = data;
  const orgName = ngo.name || ngo.title || 'Unknown Organization';
  const vetCount = ngo.metrics?.veteransSupportedCount;
  const fundingEff = ngo.metrics?.fundingEfficiency;
  const engagementRate = ngo.metrics?.engagementRate;
  const programs = Array.isArray(ngo.programs) ? ngo.programs : [];
  const websiteUrl = ngo.link || ngo.website || ngo.contact?.website;
  const phone = ngo.contact?.phone;
  const focusTags = Array.isArray(ngo.focus) ? ngo.focus : [];

  return (
    <section aria-labelledby="ngo-month-heading" className="py-10 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <TrophyIcon className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            </div>
            <div>
              <h2 id="ngo-month-heading" className="text-xl font-extrabold text-[#1A2C5B] tracking-tight leading-tight">
                Community Choice &mdash; NGO of the Month
              </h2>
              <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                {selectionMonth} &nbsp;&middot;&nbsp; Earned through community impact — not a paid placement
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isManualOverride && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                <InformationCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                Admin Selected
              </span>
            )}
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
              <TrophyIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Merit-Based Award
            </span>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-2xl border-2 border-emerald-200 shadow-lg overflow-hidden">
          {/* Top gradient stripe */}
          <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />

          <div className="p-6 sm:p-8">

            {/* NGO Identity row */}
            <div className="flex flex-wrap items-start gap-4 mb-7">
              {/* Logo placeholder */}
              <div className="h-14 w-14 rounded-xl bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center shrink-0">
                <UserGroupIcon className="h-7 w-7 text-emerald-600" aria-hidden="true" />
              </div>

              {/* Name + badges + description */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wide">
                    <TrophyIcon className="h-3 w-3" aria-hidden="true" />
                    {selectionMonth}
                  </span>
                  {(ngo.isVerified || ngo.verified) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                      <CheckBadgeIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      Vet1Stop Verified
                    </span>
                  )}
                  {ngo.veteranFounded && (
                    <span className="px-2 py-0.5 rounded-full bg-red-50 text-[#B22234] text-xs font-semibold">
                      Veteran Founded
                    </span>
                  )}
                  {focusTags.slice(0, 2).map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium capitalize">
                      {tag.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#1A2C5B] leading-tight">{orgName}</h3>
                {ngo.description && (
                  <p className="text-sm text-gray-600 mt-1.5 max-w-2xl leading-relaxed">{ngo.description}</p>
                )}
              </div>

              {/* Community Score badge */}
              <div
                className="flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl px-5 py-4 shadow-md shrink-0 min-w-[88px]"
                aria-label={`Community score: ${sb.total} out of 100`}
              >
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-80 leading-none">Community</p>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-80 mb-1">Score</p>
                <p className="text-4xl font-black leading-none">{sb.total}</p>
                <p className="text-[10px] opacity-60 mt-1">/ 100</p>
              </div>
            </div>

            {/* Two-column: Metrics grid + Programs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

              {/* Metrics grid */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Impact Metrics</p>
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    label="Community Rating"
                    value={ngo.rating ? `${ngo.rating.toFixed(1)} ★` : 'N/A'}
                    sub={ngo.reviewCount ? `${ngo.reviewCount.toLocaleString()} reviews` : undefined}
                    Icon={StarIcon}
                    bgClass="bg-amber-50"
                    borderClass="border-amber-100"
                    textClass="text-amber-700"
                  />
                  <MetricCard
                    label="Veterans Supported"
                    value={
                      vetCount
                        ? vetCount >= 1000
                          ? `${(vetCount / 1000).toFixed(0)}K+`
                          : vetCount.toLocaleString()
                        : 'N/A'
                    }
                    sub="program participants"
                    Icon={UserGroupIcon}
                    bgClass="bg-blue-50"
                    borderClass="border-blue-100"
                    textClass="text-blue-700"
                  />
                  <MetricCard
                    label="Funding to Veterans"
                    value={fundingEff ? `${Math.round(fundingEff * 100)}%` : 'N/A'}
                    sub="of funds to programs"
                    Icon={HeartIcon}
                    bgClass="bg-emerald-50"
                    borderClass="border-emerald-100"
                    textClass="text-emerald-700"
                  />
                  <MetricCard
                    label="Engagement Rate"
                    value={engagementRate ? `${Math.round(engagementRate * 100)}%` : 'N/A'}
                    sub="platform this month"
                    Icon={ChartBarIcon}
                    bgClass="bg-purple-50"
                    borderClass="border-purple-100"
                    textClass="text-purple-700"
                  />
                </div>
              </div>

              {/* Programs list */}
              <div>
                {programs.length > 0 ? (
                  <>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Programs Offered</p>
                    <ul className="space-y-2" aria-label="Programs offered">
                      {programs.slice(0, 5).map((prog, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" aria-hidden="true" />
                          {prog}
                        </li>
                      ))}
                      {programs.length > 5 && (
                        <li className="text-xs text-gray-400 pl-4">+{programs.length - 5} more programs</li>
                      )}
                    </ul>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-xl border border-gray-100 p-6 text-center">
                    <p className="text-xs text-gray-400">Program details coming soon.</p>
                    {websiteUrl && (
                      <a
                        href={websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 text-xs font-semibold text-emerald-600 hover:underline"
                      >
                        Visit website for details →
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Score Breakdown</p>
                <span className="text-xs text-gray-400">Auto-updated monthly</span>
              </div>
              <div className="space-y-2.5">
                <ScoreBar label="Impact Score" value={sb.impactComponent} max={35} colorClass="bg-emerald-500" />
                <ScoreBar label="Community Rating" value={sb.ratingComponent} max={25} colorClass="bg-amber-400" />
                <ScoreBar label="Funding Efficiency" value={sb.fundingComponent} max={20} colorClass="bg-blue-500" />
                <ScoreBar label="Reach & Engagement" value={sb.veteransComponent} max={20} colorClass="bg-purple-500" />
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Total Community Score</span>
                <span className="text-sm font-black text-emerald-700">{sb.total} / 100</span>
              </div>
            </div>

            {/* How are winners chosen? accordion */}
            <button
              onClick={() => setHowOpen(p => !p)}
              className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-[#1A2C5B] transition-colors duration-200 mb-4 focus:outline-none focus:underline"
              aria-expanded={howOpen}
              aria-controls="how-chosen-panel"
            >
              <InformationCircleIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              How are winners chosen?
              {howOpen
                ? <ChevronUpIcon className="h-3.5 w-3.5 ml-0.5" aria-hidden="true" />
                : <ChevronDownIcon className="h-3.5 w-3.5 ml-0.5" aria-hidden="true" />
              }
            </button>

            {howOpen && (
              <div
                id="how-chosen-panel"
                className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-5 text-xs text-gray-600 space-y-2"
              >
                <p className="font-bold text-emerald-800 mb-2">Monthly Auto-Selection Algorithm</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="shrink-0">🎯</span>
                    <span><strong>Impact Score (35%)</strong> — Program outcome rating sourced from verified veteran service data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="shrink-0">⭐</span>
                    <span><strong>Community Rating (25%)</strong> — Aggregate star rating from Vet1Stop user reviews</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="shrink-0">💰</span>
                    <span><strong>Funding Efficiency (20%)</strong> — Percentage of total funds going directly to veteran programs vs. overhead</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="shrink-0">👥</span>
                    <span><strong>Reach & Engagement (20%)</strong> — Total veterans supported, normalized against top performer</span>
                  </li>
                </ul>
                <p className="text-gray-400 pt-2 border-t border-emerald-100 mt-2">
                  Winners are selected automatically on the 1st of each month. Vet1Stop admins may review and confirm.{' '}
                  <strong>This is not a paid placement.</strong>
                </p>
              </div>
            )}

            {/* Footer CTA */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-5 border-t border-gray-100">
              <div className="flex flex-wrap gap-3">
                {websiteUrl && (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1A2C5B] text-white font-bold text-sm hover:bg-[#243d7a] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm hover:shadow-md"
                    aria-label={`Visit ${orgName} website`}
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                    Visit {orgName}
                  </a>
                )}
                {phone && (
                  <a
                    href={`tel:${phone.replace(/\D/g, '')}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    aria-label={`Call ${orgName}`}
                  >
                    <PhoneIcon className="h-4 w-4" aria-hidden="true" />
                    {phone}
                  </a>
                )}
              </div>

              {/* Upsell CTA */}
              <a
                href="mailto:partnerships@vet1stop.com?subject=Premium+NGO+Spotlight+Inquiry"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors duration-200 focus:outline-none focus:underline whitespace-nowrap group"
                aria-label="Inquire about permanent featured partnership"
              >
                <SparklesIcon className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200" aria-hidden="true" />
                Want permanent placement? Become a Featured Partner →
              </a>
            </div>
          </div>
        </div>

        {/* Fine print */}
        <p className="text-center text-xs text-gray-400 mt-3">
          NGO of the Month is selected automatically by community metrics each month.{' '}
          <a href="mailto:partnerships@vet1stop.com" className="text-emerald-600 hover:underline">
            Contact us
          </a>{' '}
          to learn about premium paid placements.
        </p>
      </div>
    </section>
  );
}
