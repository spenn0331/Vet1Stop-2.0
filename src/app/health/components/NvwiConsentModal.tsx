// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { ChartBarIcon, ShieldCheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { NvwiConsent } from '@/types/wellness';
import { NVWI_CONSENT_KEY } from '@/types/wellness';

interface NvwiConsentModalProps {
  hasWearable: boolean;
  onConsent: (consent: NvwiConsent) => void;
  onDecline: () => void;
}

export default function NvwiConsentModal({ hasWearable, onConsent, onDecline }: NvwiConsentModalProps) {
  const [includeWellness, setIncludeWellness] = useState(true);
  const [includeWearable, setIncludeWearable] = useState(false);

  const handleJoin = () => {
    if (!includeWellness) { onDecline(); return; }
    const consent: NvwiConsent = {
      enrolled:        true,
      includeWearable: hasWearable && includeWearable,
      enrolledAt:      new Date().toISOString(),
    };
    try { localStorage.setItem(NVWI_CONSENT_KEY, JSON.stringify(consent)); } catch { /* ignore */ }
    onConsent(consent);
  };

  const handleDecline = () => {
    const declined: NvwiConsent = {
      enrolled:        false,
      includeWearable: false,
      enrolledAt:      new Date().toISOString(),
    };
    try { localStorage.setItem(NVWI_CONSENT_KEY, JSON.stringify(declined)); } catch { /* ignore */ }
    onDecline();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nvwi-modal-heading"
    >
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-[#0F1D3D] to-[#1A2C5B] px-6 py-5 relative">
          <button
            onClick={handleDecline}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <ChartBarIcon className="h-5 w-5 text-[#EAB308]" aria-hidden="true" />
            </div>
            <div>
              <h2 id="nvwi-modal-heading" className="text-base font-extrabold text-white">
                Join the National Veteran Wellness Registry
              </h2>
              <p className="text-xs text-white/60 mt-0.5">Help improve VA programs for future veterans</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Your check-ins are <strong>private by default</strong>. But you can choose to contribute
            anonymized data to veteran health research — helping improve VA mental health programs and
            C&P policies for the next generation.
          </p>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2.5">
            <ShieldCheckIcon className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>Your name, account, and any identifying information are never included.</strong> Only
              anonymized cohort averages are stored — grouped by era, branch, and region. No individual
              records are ever created. You can opt out anytime.
            </p>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={includeWellness}
                onChange={e => setIncludeWellness(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#1A2C5B] flex-shrink-0"
              />
              <div>
                <span className="text-sm font-semibold text-gray-800 group-hover:text-[#1A2C5B] transition-colors">
                  Share anonymized wellness trends
                </span>
                <p className="text-xs text-gray-400 mt-0.5">Daily check-in scores (no notes, no dates — week of year only)</p>
              </div>
            </label>

            {hasWearable && (
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={includeWearable}
                  onChange={e => setIncludeWearable(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#1A2C5B] flex-shrink-0"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-800 group-hover:text-[#1A2C5B] transition-colors">
                    Also include anonymized wearable biometrics
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">HRV, sleep duration, resting HR — cohort averages only</p>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex flex-col gap-2.5">
          <button
            onClick={handleJoin}
            disabled={!includeWellness}
            className="w-full py-3 bg-[#1A2C5B] hover:bg-[#0F1D3D] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Join the Registry
          </button>
          <button
            onClick={handleDecline}
            className="w-full py-2.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Keep my data private — decline
          </button>
        </div>
      </div>
    </div>
  );
}
