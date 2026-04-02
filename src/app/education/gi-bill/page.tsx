// @ts-nocheck
'use client';

import Link from 'next/link';
import { ChevronRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import GiBillPanel from '../components/GiBillPanel';

export default function GiBillPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Breadcrumb Nav ─── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1 text-sm text-gray-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#1A2C5B] transition-colors">Home</Link>
            <ChevronRightIcon className="h-3 w-3" />
            <Link href="/education" className="hover:text-[#1A2C5B] transition-colors">Education</Link>
            <ChevronRightIcon className="h-3 w-3" />
            <span className="text-[#1A2C5B] font-medium">GI Bill Pathfinder</span>
          </nav>
        </div>
      </div>

      {/* ─── Back Button ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-0">
        <Link
          href="/education"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-[#1A2C5B] font-semibold text-sm hover:bg-blue-50 hover:border-[#1A2C5B] transition-all focus:outline-none focus:ring-4 focus:ring-blue-200 shadow-sm"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Education
        </Link>
      </div>

      {/* ─── Panel ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <GiBillPanel />
      </div>
    </div>
  );
}
