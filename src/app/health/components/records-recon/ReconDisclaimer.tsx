'use client';

import React from 'react';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

export default function ReconDisclaimer() {
  return (
    <div className="bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-3 mb-4">
      <div className="flex items-start gap-2">
        <ShieldExclamationIcon className="h-5 w-5 text-[#EAB308] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-yellow-800 font-semibold leading-relaxed">
          Records Recon is a document organizer only — not medical, legal, or claims advice.
          Always consult an accredited VSO before making decisions about VA benefits.
        </p>
      </div>
    </div>
  );
}
