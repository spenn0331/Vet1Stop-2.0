'use client';

import React from 'react';
import {
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
  ClockIcon,
  StarIcon,
  ShieldCheckIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import type { Business } from '@/data/businesses';
import { CATEGORY_ICONS } from '@/data/businesses';

interface BusinessCardProps {
  business: Business;
  isHighlighted?: boolean;
  onSelect?: (business: Business) => void;
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="flex items-center gap-1">
      <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
        {Array.from({ length: full  }).map((_, i) => <StarSolid key={`f${i}`} className="h-3.5 w-3.5 text-[#EAB308]" />)}
        {half && <StarIcon className="h-3.5 w-3.5 text-[#EAB308]" />}
        {Array.from({ length: empty }).map((_, i) => <StarIcon key={`e${i}`} className="h-3.5 w-3.5 text-gray-300" />)}
      </span>
      <span className="text-xs text-gray-500 tabular-nums">{rating.toFixed(1)} ({count})</span>
    </span>
  );
}

function StatusBadge({ status }: { status: Business['status'] }) {
  if (status === 'Service-Disabled Veteran-Owned') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <ShieldCheckIcon className="h-3 w-3" aria-hidden="true" />
        SDVOSB
      </span>
    );
  }
  if (status === 'Veteran-Owned') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <CheckBadgeIcon className="h-3 w-3" aria-hidden="true" />
        Veteran-Owned
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
      Veteran-Friendly
    </span>
  );
}

export default function BusinessCard({ business, isHighlighted, onSelect }: BusinessCardProps) {
  const categoryIcon = CATEGORY_ICONS[business.category];

  return (
    <article
      className={`group bg-white rounded-2xl border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer ${
        isHighlighted ? 'border-[#1A2C5B] ring-2 ring-[#1A2C5B]/20' : 'border-gray-100'
      }`}
      onClick={() => onSelect?.(business)}
      aria-label={`${business.name} — ${business.category} in ${business.city}, ${business.stateCode}`}
    >
      {/* Top accent bar */}
      <div className={`h-1.5 w-full ${business.featured ? 'bg-gradient-to-r from-[#EAB308] to-amber-400' : 'bg-gradient-to-r from-[#1A2C5B] to-[#2d4d99]'}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-[#1A2C5B]/5 flex items-center justify-center flex-shrink-0 text-xl">
              {categoryIcon}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-[#1A2C5B] leading-snug group-hover:text-blue-700 transition-colors truncate">
                {business.name}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">{business.category}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {business.verified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                <CheckBadgeIcon className="h-3 w-3" aria-hidden="true" />
                Verified
              </span>
            )}
            {business.featured && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#EAB308] text-[#1F2937]">
                Featured
              </span>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <StatusBadge status={business.status} />
        </div>

        {/* Rating */}
        <div className="mb-3">
          <StarRating rating={business.rating} count={business.reviewCount} />
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 leading-relaxed mb-3 line-clamp-3">{business.description}</p>

        {/* Veteran discount */}
        {business.veteranDiscount && (
          <div className="mb-3 px-3 py-2 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-xs font-semibold text-amber-800">
              🎖️ {business.veteranDiscount}
            </p>
          </div>
        )}

        {/* Meta info */}
        <div className="space-y-1.5 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPinIcon className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" aria-hidden="true" />
            <span className="truncate">{business.city}, {business.stateCode}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ClockIcon className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" aria-hidden="true" />
            <span className="truncate">{business.hours}</span>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <a
              href={`tel:${business.phone.replace(/\D/g, '')}`}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#1A2C5B] hover:text-blue-700 transition-colors focus:outline-none focus:underline"
              onClick={e => e.stopPropagation()}
              aria-label={`Call ${business.name}`}
            >
              <PhoneIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {business.phone}
            </a>
            {business.website && (
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold text-[#1A2C5B] hover:text-blue-700 transition-colors focus:outline-none focus:underline"
                onClick={e => e.stopPropagation()}
                aria-label={`Visit ${business.name} website`}
              >
                <GlobeAltIcon className="h-3.5 w-3.5" aria-hidden="true" />
                Website
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
