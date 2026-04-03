// @ts-nocheck
'use client';

import React from 'react';
import Link from 'next/link';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import { isPremium, PREMIUM_FEATURES, type PremiumFeatureKey } from '@/lib/premium';

interface PremiumGateProps {
  feature: PremiumFeatureKey;
  children: React.ReactNode;
  compact?: boolean;
}

// [PREMIUM: see PREMIUM_FEATURES in src/lib/premium.ts for all gated keys]
// Usage: wrap any premium section with <PremiumGate feature="wellness_correlation_chart">
//        compact={true} overlays a small lock badge instead of a full replacement card

const DEV_UNLOCKED = process.env.NEXT_PUBLIC_DEV_PREMIUM === 'true';

export function PremiumGate({ feature, children, compact = false }: PremiumGateProps) {
  if (DEV_UNLOCKED || isPremium()) return <>{children}</>;

  const label = PREMIUM_FEATURES[feature];

  if (compact) {
    return (
      <div className="relative group">
        <div className="opacity-40 pointer-events-none select-none" aria-hidden="true">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-xl">
          <Link
            href="/premium"
            className="flex items-center gap-1.5 text-xs font-bold text-[#1A2C5B] bg-[#EAB308] hover:bg-[#FACC15] px-3 py-1.5 rounded-full shadow transition-colors"
            aria-label={`Unlock ${label} with Vet1Stop Premium`}
          >
            <LockClosedIcon className="h-3 w-3" aria-hidden="true" />
            Premium
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1A2C5B]/5 to-[#EAB308]/10 border border-[#EAB308]/30 rounded-2xl p-6 text-center">
      <div className="h-10 w-10 rounded-full bg-[#EAB308]/20 flex items-center justify-center mx-auto mb-3">
        <LockClosedIcon className="h-5 w-5 text-[#EAB308]" aria-hidden="true" />
      </div>
      <h4 className="text-sm font-extrabold text-[#1A2C5B] mb-1">{label}</h4>
      <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto leading-relaxed">
        This feature is included with Vet1Stop Premium — $9.99/mo. Cancel anytime.
      </p>
      <Link
        href="/premium"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#EAB308] hover:bg-[#FACC15] text-[#1A2C5B] font-bold rounded-xl text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
      >
        Unlock with Premium →
      </Link>
    </div>
  );
}
