// @ts-nocheck
'use client';

/**
 * NGOSpotlight.tsx — Revenue Section
 * 5 slots: 1 Premium ($1,000/mo) + 4 Featured ($250/mo each)
 * To activate a partner: flip isActive: true and fill fields — zero code changes needed.
 * Phase 2: wire stripeProductId to Stripe Billing recurring subscriptions.
 */

import React from 'react';
import {
  ArrowTopRightOnSquareIcon,
  PhoneIcon,
  CheckBadgeIcon,
  StarIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

// ─── Data model ──────────────────────────────────────────────────────────────

export interface SpotlightSlot {
  id: string;
  tier: 'premium' | 'featured';
  orgName: string;
  tagline: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  phone?: string;
  impactStat?: string;
  verifiedBadge: boolean;
  ctaLabel: string;
  ctaUrl?: string;
  secondaryCta?: { label: string; url: string };
  isActive: boolean;
  stripeProductId?: string;
  metrics?: {
    communityScore?: number;
    veteransSupported?: string;
    fundingEfficiency?: string;
    engagementRate?: string;
    rating?: string;
  };
}

// ─── Config — update ONLY this array to activate/deactivate partners ─────────

// ─── DEMO PLACEHOLDERS ───────────────────────────────────────────────────────
// These are real organizations used as display placeholders for investor/user demos.
// They are NOT actual Vet1Stop partners. Replace with live partner data when contracts
// are signed. Set isActive: false and clear fields to restore a "Reserve This Spot" slot.
const SPOTLIGHT_CONFIG: SpotlightSlot[] = [
  {
    id: 'premium-1',
    tier: 'premium',
    orgName: 'Wounded Warrior Project',
    tagline: 'Empowering Warriors to Thrive After Service',
    description: 'Wounded Warrior Project provides life-changing programs in mental health, physical wellness, career transition, and long-term support for post-9/11 veterans and their families — at no cost to warriors.',
    logoUrl: '',
    websiteUrl: 'https://www.woundedwarriorproject.org',
    phone: '888-997-2586',
    impactStat: 'Served 230,000+ warriors and their families since 2003',
    metrics: {
      communityScore: 96,
      veteransSupported: '230K+',
      fundingEfficiency: '80%',
      engagementRate: '94%',
      rating: '4.9 ★',
    },
    verifiedBadge: true,
    ctaLabel: 'Visit Wounded Warrior Project',
    ctaUrl: 'https://www.woundedwarriorproject.org',
    secondaryCta: { label: 'Get Help Now', url: 'https://www.woundedwarriorproject.org/programs' },
    isActive: true,
    stripeProductId: '',
  },
  {
    id: 'featured-1',
    tier: 'featured',
    orgName: 'Cohen Veterans Network',
    tagline: 'Free, high-quality mental health care at clinics nationwide for veterans and military families.',
    verifiedBadge: true,
    ctaLabel: 'Find a Clinic',
    ctaUrl: 'https://www.cohenveteransnetwork.org',
    isActive: true,
  },
  {
    id: 'featured-2',
    tier: 'featured',
    orgName: 'Team Red White & Blue',
    tagline: 'Physical activity and social connection to help veterans live a full life after service.',
    verifiedBadge: false,
    ctaLabel: 'Join Team RWB',
    ctaUrl: 'https://www.teamrwb.org',
    isActive: true,
  },
  {
    id: 'featured-3',
    tier: 'featured',
    orgName: 'Disabled American Veterans (DAV)',
    tagline: 'Helping 1 million+ veterans access earned VA benefits, transportation, and claims assistance.',
    verifiedBadge: true,
    ctaLabel: 'Get DAV Help',
    ctaUrl: 'https://www.dav.org',
    phone: '877-426-2838',
    isActive: true,
  },
  {
    id: 'featured-4',
    tier: 'featured',
    orgName: 'Give An Hour',
    tagline: 'Free, confidential mental health care from volunteer licensed professionals.',
    verifiedBadge: false,
    ctaLabel: 'Find a Provider',
    ctaUrl: 'https://giveanhour.org',
    isActive: true,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
      <CheckBadgeIcon className="h-3.5 w-3.5" aria-hidden="true" />
      Vet1Stop Verified
    </span>
  );
}

function PremiumActiveCard({ slot }: { slot: SpotlightSlot }) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden border-2 border-[#EAB308] bg-gradient-to-br from-[#0F1D3D] to-[#1A2C5B] text-white p-6 sm:p-8 shadow-2xl"
      aria-label={`Premium spotlight: ${slot.orgName}`}
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#EAB308]/10 rounded-full -translate-y-12 translate-x-12 pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row sm:items-start gap-6">
        {/* Logo or initial */}
        <div className="flex-shrink-0">
          {slot.logoUrl ? (
            <img src={slot.logoUrl} alt={`${slot.orgName} logo`} className="h-16 w-16 rounded-xl object-contain bg-white p-1" />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-white/10 flex items-center justify-center">
              <UserGroupIcon className="h-8 w-8 text-[#EAB308]" aria-hidden="true" />
            </div>
          )}
        </div>
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EAB308] text-[#0F1D3D] text-xs font-bold uppercase tracking-wide">
              <StarIcon className="h-3 w-3" aria-hidden="true" />
              Premium Spotlight
            </span>
            {slot.verifiedBadge && <VerifiedBadge />}
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-1">{slot.orgName}</h3>
          {slot.tagline && <p className="text-[#EAB308] font-semibold text-sm mb-2">{slot.tagline}</p>}
          {slot.description && <p className="text-white/80 text-sm leading-relaxed mb-3 max-w-xl">{slot.description}</p>}
          {slot.impactStat && (
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/90 bg-white/10 px-3 py-1 rounded-full mb-4">
              <UserGroupIcon className="h-4 w-4 text-[#EAB308]" aria-hidden="true" />
              {slot.impactStat}
            </p>
          )}
          {slot.metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4" aria-label="Partner impact metrics">
              {slot.metrics.communityScore !== undefined && (
                <div className="bg-[#EAB308]/10 border border-[#EAB308]/20 rounded-lg px-3 py-2 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#EAB308]/70 leading-none mb-0.5">Score</p>
                  <p className="text-lg font-black text-[#EAB308] leading-none">{slot.metrics.communityScore}</p>
                  <p className="text-[9px] text-white/30 mt-0.5">/100</p>
                </div>
              )}
              {slot.metrics.rating && (
                <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 leading-none mb-0.5">Rating</p>
                  <p className="text-sm font-extrabold text-white leading-tight">{slot.metrics.rating}</p>
                </div>
              )}
              {slot.metrics.veteransSupported && (
                <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 leading-none mb-0.5">Veterans</p>
                  <p className="text-sm font-extrabold text-white leading-tight">{slot.metrics.veteransSupported}</p>
                </div>
              )}
              {slot.metrics.fundingEfficiency && (
                <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 leading-none mb-0.5">To Programs</p>
                  <p className="text-sm font-extrabold text-white leading-tight">{slot.metrics.fundingEfficiency}</p>
                </div>
              )}
              {slot.metrics.engagementRate && (
                <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 leading-none mb-0.5">Engagement</p>
                  <p className="text-sm font-extrabold text-white leading-tight">{slot.metrics.engagementRate}</p>
                </div>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            {slot.ctaUrl && (
              <a
                href={slot.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#EAB308] text-[#0F1D3D] font-bold text-sm hover:bg-[#FACC15] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                aria-label={`${slot.ctaLabel} for ${slot.orgName}`}
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                {slot.ctaLabel}
              </a>
            )}
            {slot.phone && (
              <a
                href={`tel:${slot.phone.replace(/\D/g, '')}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label={`Call ${slot.orgName}`}
              >
                <PhoneIcon className="h-4 w-4" aria-hidden="true" />
                {slot.phone}
              </a>
            )}
            {slot.secondaryCta?.url && (
              <a
                href={slot.secondaryCta.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                {slot.secondaryCta.label}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PremiumPlaceholderCard() {
  return (
    <div
      className="rounded-2xl border-2 border-dashed border-[#EAB308]/50 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
      aria-label="Premium spotlight slot — available for partnership"
    >
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-xl bg-[#EAB308]/10 flex items-center justify-center flex-shrink-0">
          <StarIcon className="h-7 w-7 text-[#EAB308]" aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#EAB308] bg-[#EAB308]/10 px-2 py-0.5 rounded-full">Premium · $1,000/mo</span>
          </div>
          <h3 className="text-lg font-extrabold text-[#1A2C5B]">Reserve the Premium Spotlight</h3>
          <p className="text-sm text-gray-600 mt-0.5">Full-width featured placement — reach thousands of veterans daily.</p>
        </div>
      </div>
      <a
        href="mailto:partnerships@vet1stop.com?subject=Premium+NGO+Spotlight+Inquiry"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1A2C5B] text-white font-bold text-sm hover:bg-[#243d7a] transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-400 flex-shrink-0"
        aria-label="Inquire about the Premium Spotlight"
      >
        <SparklesIcon className="h-4 w-4" aria-hidden="true" />
        Learn About Partnership
      </a>
    </div>
  );
}

function FeaturedActiveCard({ slot }: { slot: SpotlightSlot }) {
  return (
    <div
      className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col gap-3 h-full"
      aria-label={`Featured partner: ${slot.orgName}`}
    >
      <div className="flex items-start gap-3">
        {slot.logoUrl ? (
          <img src={slot.logoUrl} alt={`${slot.orgName} logo`} className="h-10 w-10 rounded-lg object-contain bg-gray-50 p-0.5 border border-gray-100 flex-shrink-0" />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <UserGroupIcon className="h-5 w-5 text-[#1A2C5B]" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Featured</span>
            {slot.verifiedBadge && <VerifiedBadge />}
          </div>
          <h4 className="font-bold text-[#1A2C5B] text-sm leading-tight">{slot.orgName}</h4>
        </div>
      </div>
      {slot.tagline && <p className="text-xs text-gray-600 leading-relaxed flex-1">{slot.tagline}</p>}
      {slot.ctaUrl && (
        <a
          href={slot.ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1A2C5B] hover:text-blue-700 transition-colors duration-200 focus:outline-none focus:underline"
          aria-label={`${slot.ctaLabel} — ${slot.orgName}`}
        >
          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {slot.ctaLabel}
        </a>
      )}
    </div>
  );
}

function FeaturedPlaceholderCard({ index }: { index: number }) {
  return (
    <div
      className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-5 flex flex-col items-center justify-center gap-2 text-center min-h-[140px]"
      aria-label={`Featured partner slot ${index + 1} — available`}
    >
      <div className="h-8 w-8 rounded-lg bg-gray-200/70 flex items-center justify-center">
        <UserGroupIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
      </div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Featured Spot · $250/mo</p>
      <a
        href="mailto:partnerships@vet1stop.com?subject=Featured+NGO+Spotlight+Inquiry"
        className="text-xs font-semibold text-[#1A2C5B] hover:text-blue-700 transition-colors underline focus:outline-none"
        aria-label="Reserve this featured spotlight slot"
      >
        Reserve This Spot →
      </a>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function NGOSpotlight() {
  const premiumSlot = SPOTLIGHT_CONFIG.find(s => s.tier === 'premium')!;
  const featuredSlots = SPOTLIGHT_CONFIG.filter(s => s.tier === 'featured');

  return (
    <section aria-labelledby="ngo-spotlight-heading" className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 id="ngo-spotlight-heading" className="text-2xl font-extrabold text-[#1A2C5B] tracking-tight">
              Featured Partners
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Organizations vetted and trusted by the Vet1Stop community</p>
          </div>
          <a
            href="mailto:partnerships@vet1stop.com?subject=NGO+Partnership+Inquiry"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#1A2C5B] transition-colors duration-200 focus:outline-none focus:underline"
            aria-label="Become a featured partner"
          >
            <SparklesIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Become a Partner
          </a>
        </div>

        {/* Premium slot */}
        <div className="mb-6">
          {premiumSlot.isActive
            ? <PremiumActiveCard slot={premiumSlot} />
            : <PremiumPlaceholderCard />}
        </div>

        {/* Featured 4-up grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredSlots.map((slot, i) =>
            slot.isActive
              ? <FeaturedActiveCard key={slot.id} slot={slot} />
              : <FeaturedPlaceholderCard key={slot.id} index={i} />
          )}
        </div>
      </div>
    </section>
  );
}
