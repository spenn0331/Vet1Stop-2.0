// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { WellnessProfile, VetEra, VetBranch, AgeDecade, USRegion } from '@/types/wellness';
import { WELLNESS_PROFILE_KEY } from '@/types/wellness';

const ERA_OPTIONS: { value: VetEra; label: string }[] = [
  { value: 'post-9/11',  label: 'Post-9/11 (2001–present)' },
  { value: 'gulf-war',   label: 'Gulf War (1990–2001)' },
  { value: 'vietnam',    label: 'Vietnam Era (1961–1975)' },
  { value: 'korea',      label: 'Korean War Era' },
  { value: 'other',      label: 'Other / Peacetime' },
];

const BRANCH_OPTIONS: { value: VetBranch; label: string }[] = [
  { value: 'army',           label: 'Army' },
  { value: 'navy',           label: 'Navy' },
  { value: 'marines',        label: 'Marine Corps' },
  { value: 'air-force',      label: 'Air Force' },
  { value: 'space-force',    label: 'Space Force' },
  { value: 'coast-guard',    label: 'Coast Guard' },
  { value: 'national-guard', label: 'National Guard' },
  { value: 'reserves',       label: 'Reserves' },
];

const AGE_OPTIONS: { value: AgeDecade; label: string }[] = [
  { value: '20s',  label: '20–29' },
  { value: '30s',  label: '30–39' },
  { value: '40s',  label: '40–49' },
  { value: '50s',  label: '50–59' },
  { value: '60s',  label: '60–69' },
  { value: '70s+', label: '70 or older' },
];

const REGION_OPTIONS: { value: USRegion; label: string }[] = [
  { value: 'northeast',  label: 'Northeast' },
  { value: 'southeast',  label: 'Southeast' },
  { value: 'midwest',    label: 'Midwest' },
  { value: 'southwest',  label: 'Southwest' },
  { value: 'west',       label: 'West' },
  { value: 'pacific',    label: 'Pacific / Hawaii / Alaska' },
];

export default function WellnessSetupPage() {
  const router = useRouter();
  const [era,    setEra]    = useState<VetEra>('unknown');
  const [branch, setBranch] = useState<VetBranch>('unknown');
  const [ageDec, setAgeDec] = useState<AgeDecade>('unknown');
  const [region, setRegion] = useState<USRegion>('unknown');
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WELLNESS_PROFILE_KEY);
      if (raw) {
        const p: WellnessProfile = JSON.parse(raw);
        setEra(p.era);
        setBranch(p.branch);
        setAgeDec(p.ageDec);
        setRegion(p.region);
      }
    } catch { /* ignore */ }
  }, []);

  const handleSave = () => {
    const profile: WellnessProfile = {
      era, branch, ageDec, region,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(WELLNESS_PROFILE_KEY, JSON.stringify(profile));
    } catch { /* ignore */ }
    setSaved(true);
    setTimeout(() => router.push('/health/wellness'), 1200);
  };

  const selectClass = 'w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A2C5B]/30 focus:border-[#1A2C5B] bg-white transition-all';

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-1 text-sm text-gray-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#1A2C5B] transition-colors">Home</Link>
            <ChevronRightIcon className="h-3 w-3" />
            <Link href="/health" className="hover:text-[#1A2C5B] transition-colors">Health</Link>
            <ChevronRightIcon className="h-3 w-3" />
            <Link href="/health/wellness" className="hover:text-[#1A2C5B] transition-colors">Wellness</Link>
            <ChevronRightIcon className="h-3 w-3" />
            <span className="text-[#1A2C5B] font-medium">Profile Setup</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0F1D3D] via-[#1A2C5B] to-[#1e3a7a] text-white">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-extrabold tracking-tight mb-2">Wellness Profile Setup</h1>
          <p className="text-white/70 text-sm leading-relaxed max-w-lg">
            Optional — takes 30 seconds. This improves the accuracy of your NVWI cohort data and
            helps personalize resource suggestions. Stored privately on your device only.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-base font-extrabold text-[#1A2C5B]">About Your Service</h2>
            <p className="text-xs text-gray-400 mt-0.5">Used only for cohort grouping — never tied to your identity.</p>
          </div>
          <div className="px-6 py-5 space-y-5">

            <div>
              <label className="text-sm font-semibold text-gray-800 block mb-1.5">Era of Service</label>
              <select value={era} onChange={e => setEra(e.target.value as VetEra)} className={selectClass}>
                <option value="unknown">Prefer not to say</option>
                {ERA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-800 block mb-1.5">Branch of Service</label>
              <select value={branch} onChange={e => setBranch(e.target.value as VetBranch)} className={selectClass}>
                <option value="unknown">Prefer not to say</option>
                {BRANCH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-800 block mb-1.5">Age Range</label>
              <select value={ageDec} onChange={e => setAgeDec(e.target.value as AgeDecade)} className={selectClass}>
                <option value="unknown">Prefer not to say</option>
                {AGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-800 block mb-1.5">US Region</label>
              <select value={region} onChange={e => setRegion(e.target.value as USRegion)} className={selectClass}>
                <option value="unknown">Prefer not to say</option>
                {REGION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <button
              onClick={handleSave}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200 shadow-sm ${
                saved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#1A2C5B] text-white hover:bg-[#0F1D3D] hover:shadow-md'
              }`}
            >
              {saved ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
                  Saved — returning to Wellness
                </span>
              ) : (
                'Save Profile'
              )}
            </button>

            <p className="text-center text-xs text-gray-400">
              All fields are optional. Your answers are stored only on this device and never tied to your account or shared individually.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
