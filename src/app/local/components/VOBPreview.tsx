'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import BusinessCard from './BusinessCard';
import { BUSINESSES, ALL_CATEGORIES, ALL_STATES_VOB } from '@/data/businesses';

const featured = BUSINESSES.filter(b => b.featured).slice(0, 4);

export default function VOBPreview() {
  return (
    <section id="directory-preview" aria-labelledby="vob-preview-heading" className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 id="vob-preview-heading" className="text-2xl font-bold text-[#1A2C5B]">
              Veteran-Owned Business Directory
            </h2>
            <p className="text-sm text-gray-500 mt-1">Featured partners from our verified directory</p>
          </div>
          <Link
            href="/local/directory"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[#1A2C5B] hover:text-blue-700 transition-colors"
          >
            View All
            <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Featured Business Grid — 4 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featured.map(biz => (
            <BusinessCard key={biz.id} business={biz} />
          ))}
        </div>

        {/* Quick Stats Bar */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
          <BuildingStorefrontIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
          <span>
            {BUSINESSES.length} businesses across {ALL_STATES_VOB.length} states in {ALL_CATEGORIES.length} categories
          </span>
        </div>

        {/* CTA — outlined navy button */}
        <div className="mt-6 text-center">
          <Link
            href="/local/directory"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-[#1A2C5B] text-[#1A2C5B] font-bold hover:bg-[#1A2C5B] hover:text-white transition-all focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            Explore the Full Directory
            <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
