'use client';

import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

export default function ReconDisclaimer() {
  return (
    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2">
      <div className="flex items-center gap-2 max-w-5xl mx-auto">
        <InformationCircleIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <p className="text-[11px] text-slate-500 leading-snug">
          Records Recon scans your uploaded files for potential evidence only. We never file claims, store data, or give medical advice. Share the generated report with your VSO or accredited representative.
        </p>
      </div>
    </div>
  );
}
