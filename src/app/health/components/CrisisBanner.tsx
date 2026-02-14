"use client";

import { PhoneIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { Z_INDICES, COLORS } from '../utils/health-constants';

/**
 * CrisisBanner Component
 * 
 * A fixed banner at the top of the page displaying the Veterans Crisis Line information.
 * Uses shared constants for z-index and colors to ensure consistent styling.
 */
export default function CrisisBanner() {
  return (
    <div 
      className="fixed top-0 left-0 right-0 text-white shadow-md"
      style={{ 
        backgroundColor: COLORS.SECONDARY, // Red color from patriotic theme
        zIndex: Z_INDICES.CRISIS_BANNER 
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <PhoneIcon className="h-5 w-5 mr-2" style={{ color: COLORS.ACCENT }} />
          <span className="font-bold text-lg">Veterans Crisis Line: Dial 988 then Press 1</span>
        </div>
        <Link 
          href="#crisis-resources" 
          className="px-4 py-2 font-semibold rounded-md transition-all duration-200 flex-shrink-0 shadow focus:ring-2 focus:outline-none"
          style={{ 
            backgroundColor: COLORS.ACCENT,
            color: '#1F2937', // Dark gray for contrast
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
          }}
          aria-label="Get immediate crisis support for veterans"
        >
          Get Help Now
        </Link>
      </div>
    </div>
  );
}
