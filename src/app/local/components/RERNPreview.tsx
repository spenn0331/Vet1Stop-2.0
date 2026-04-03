'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRightIcon,
  HomeModernIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

// Sample agents sourced from RERN_AGENTS in RealEstatePanel.tsx
const PREVIEW_AGENTS = [
  {
    id: 'gg-001',
    name: 'Delta Realty Group',
    city: 'Tampa, FL',
    specialty: 'PCS Relocation + VA Purchase',
    closings: '800+',
  },
  {
    id: 'gg-002',
    name: 'Liberty Home VA Loans',
    city: 'Los Angeles, CA',
    specialty: 'VA Purchase + IRRRL Refinance',
    closings: '500+',
  },
];

const BENEFIT_PILLS = ['Zero Down Payment', 'No PMI', 'Dedicated VA Specialists'];

export default function RERNPreview() {
  return (
    <section
      id="home-base-preview"
      aria-labelledby="rern-preview-heading"
      className="py-16 sm:py-20 bg-gradient-to-b from-gray-50 to-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 id="rern-preview-heading" className="text-2xl font-bold text-[#1A2C5B]">
              Home Base — Real Estate for Veterans
            </h2>
            <p className="text-sm text-gray-500 mt-1">VA loan specialists who understand your mission</p>
          </div>
          <Link
            href="/local/home-base"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[#1A2C5B] hover:text-blue-700 transition-colors"
          >
            Learn More
            <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Two-column: content left, agent cards right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left Column — Copy + Pills + CTA */}
          <div>
            <h3 className="text-xl font-semibold text-[#1A2C5B] mb-3">
              Find VA Loan Specialists Who Understand Your Mission
            </h3>
            <p className="text-gray-600 leading-relaxed mb-5">
              Our Real Estate Referral Network connects transitioning veterans with agents
              who specialize in VA loans — zero down payment, no PMI, and expert guidance
              through every step of the home buying process.
            </p>

            {/* Benefit pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {BENEFIT_PILLS.map(pill => (
                <span
                  key={pill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1A2C5B]/5 text-sm font-semibold text-[#1A2C5B] border border-[#1A2C5B]/10"
                >
                  <ShieldCheckIcon className="h-3.5 w-3.5 text-[#EAB308]" aria-hidden="true" />
                  {pill}
                </span>
              ))}
            </div>

            <Link
              href="/local/home-base"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#EAB308] text-[#0F1D3D] font-bold hover:bg-[#FACC15] focus:outline-none focus:ring-4 focus:ring-yellow-300 transition-all shadow-lg hover:-translate-y-0.5"
            >
              Find Your Agent
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {/* Right Column — Agent Preview Cards */}
          <div>
            <div className="space-y-3">
              {PREVIEW_AGENTS.map(agent => (
                <div
                  key={agent.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all"
                >
                  {/* Navy accent bar (matches BusinessCard pattern) */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-[#1A2C5B] to-[#2d4d99]" />
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-[#1A2C5B]">{agent.name}</h4>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                      <MapPinIcon className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                      {agent.city}
                    </div>
                    <p className="text-xs text-[#EAB308] font-semibold mt-2">{agent.specialty}</p>
                    <p className="text-xs text-gray-500 mt-1">{agent.closings} VA closings</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stat line */}
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
              <HomeModernIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
              <span>10+ VA Loan Specialists Nationwide</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
