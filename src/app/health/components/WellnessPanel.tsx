'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  BoltIcon,
  MoonIcon,
  UserGroupIcon,
  ExclamationCircleIcon,
  Cog6ToothIcon,
  DocumentArrowDownIcon,
  ArrowRightCircleIcon,
} from '@heroicons/react/24/outline';
import { PhoneIcon as PhoneIconSolid, StarIcon } from '@heroicons/react/24/solid';
import NvwiConsentModal from './NvwiConsentModal';
import type { NvwiConsent, WellnessProfile } from '@/types/wellness';
import { NVWI_CONSENT_KEY, WELLNESS_PROFILE_KEY } from '@/types/wellness';
import { buildCohortUpdate } from '@/lib/wellness/anonymize';
import { PremiumGate } from '@/components/shared/PremiumGate';
import { BRIDGE_STORAGE_KEY } from '@/types/records-recon';
import WearableConnectCard from './WearableConnectCard';
import WellnessCorrelationChart from './WellnessCorrelationChart';
import WellnessInsightCards from './WellnessInsightCards';
import WellnessCaregiverReport from './WellnessCaregiverReport';
import type { WearableData, WearableToken } from '@/types/wellness';
import {
  getWearableToken,
  getTodayWearableData,
  saveTodayWearableData,
  saveWearableToken,
  wearableToSliderSuggestions,
} from '@/lib/wellness/wearable';

// ─── Types ──────────────────────────────────────────────────────────────────

const WELLNESS_LOG_KEY = 'vet1stop_wellness_log';

interface WellnessScores {
  mood: number;
  energy: number;
  sleep: number;
  pain: number;
  social: number;
}

interface WellnessEntry {
  date: string;
  scores: WellnessScores;
  notes: string;
  savedAt: string;
}

type SliderKey = keyof WellnessScores;

// ─── Constants ──────────────────────────────────────────────────────────────

const REGISTRY_SYNC_URL = '/api/health/wellness/registry-sync';

const CRISIS_KEYWORDS = [
  'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die',
  'self-harm', 'hurt myself', 'no reason to live', 'better off dead',
  "can't go on", 'giving up', 'hopeless', 'worthless',
];

const SLIDERS: {
  key: SliderKey;
  label: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  color: string;
  fillHex: string;
  chartColor: string;
  desc: string;
}[] = [
  { key: 'mood',   label: 'Mood',               icon: HeartIcon,             color: 'text-amber-500',   fillHex: '#F59E0B', chartColor: '#F59E0B', desc: '1 = very low, 10 = excellent'    },
  { key: 'energy', label: 'Energy',              icon: BoltIcon,              color: 'text-blue-500',    fillHex: '#3B82F6', chartColor: '#3B82F6', desc: '1 = exhausted, 10 = full energy'  },
  { key: 'sleep',  label: 'Sleep Quality',       icon: MoonIcon,              color: 'text-indigo-500',  fillHex: '#6366F1', chartColor: '#6366F1', desc: '1 = very poor, 10 = refreshed'   },
  { key: 'pain',   label: 'Pain Level',          icon: ExclamationCircleIcon, color: 'text-red-500',     fillHex: '#EF4444', chartColor: '#EF4444', desc: '1 = pain-free, 10 = severe pain'  },
  { key: 'social', label: 'Social Connection',   icon: UserGroupIcon,         color: 'text-emerald-500', fillHex: '#10B981', chartColor: '#10B981', desc: '1 = isolated, 10 = well-connected' },
];

const MENTAL_HEALTH_RESOURCES = [
  { title: 'Veterans Crisis Line',       desc: 'Free, confidential, 24/7. Dial 988 then Press 1.',                                      url: 'https://www.veteranscrisisline.net/',                                          phone: '988 (Press 1)', urgent: true  },
  { title: 'Give An Hour',               desc: 'Free mental health services from licensed volunteer professionals.',                    url: 'https://giveanhour.org/' },
  { title: 'Cohen Veterans Network',     desc: 'Low-cost nationwide mental health clinics for veterans and families.',                  url: 'https://www.cohenveteransnetwork.org/', phone: '1-888-523-6936' },
  { title: 'VA Mental Health Services',  desc: 'Comprehensive counseling, PTSD treatment, and peer support at VA facilities.',         url: 'https://www.va.gov/health-care/health-needs-conditions/mental-health/' },
];

const PHYSICAL_HEALTH_RESOURCES = [
  { title: 'VA Physical Therapy & Rehab', desc: 'Evidence-based physical therapy for chronic pain, back injuries, and musculoskeletal conditions.', url: 'https://www.va.gov/health-care/' },
  { title: 'VA Whole Health Program',     desc: 'Integrative health combining conventional care with yoga, nutrition, and movement.',              url: 'https://www.va.gov/wholehealth/' },
  { title: 'Team Red White & Blue',       desc: 'Physical fitness and community activities connecting veterans through sports and events.',        url: 'https://www.teamrwb.org/' },
];

const SLEEP_RESOURCES = [
  { title: 'VA Sleep Medicine',       desc: 'VA-provided sleep studies and treatment for sleep apnea and insomnia.', url: 'https://www.va.gov/health-care/' },
  { title: 'VA Whole Health — Sleep', desc: 'Non-pharmacological sleep improvement programs and coaching at your VA.', url: 'https://www.va.gov/wholehealth/' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function getDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function detectCrisis(scores: WellnessScores, notes: string): boolean {
  if (scores.mood === 1) return true;
  const lower = notes.toLowerCase();
  return CRISIS_KEYWORDS.some(kw => lower.includes(kw));
}

function computeInsights(log: WellnessEntry[]): {
  showMentalHealth: boolean;
  showPhysical: boolean;
  showSleep: boolean;
} {
  const recent = log.slice(-7);
  if (recent.length === 0) return { showMentalHealth: false, showPhysical: false, showSleep: false };

  const moods = recent.map(e => e.scores.mood);
  let streak = 0;
  let maxStreak = 0;
  for (const m of moods) {
    if (m <= 4) { streak++; maxStreak = Math.max(maxStreak, streak); }
    else streak = 0;
  }

  return {
    showMentalHealth: maxStreak >= 3,
    showPhysical:     recent.some(e => e.scores.pain >= 7),
    showSleep:        recent.filter(e => e.scores.sleep <= 3).length >= 2,
  };
}

// ─── Sparkline SVG ──────────────────────────────────────────────────────────

function Sparkline({ log }: { log: WellnessEntry[] }) {
  const DAYS = 7;
  const W = 300;
  const H = 100;
  const PAD = { top: 10, right: 10, bottom: 20, left: 22 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const dateArr: string[] = Array.from({ length: DAYS }, (_, i) => getDateStr(DAYS - 1 - i));
  const logMap = new Map(log.map(e => [e.date, e]));

  const xAt = (i: number) => PAD.left + (i / (DAYS - 1)) * cW;
  const yAt = (v: number) => PAD.top + cH - ((v - 1) / 9) * cH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" role="img" aria-label="7-day wellness trend sparkline">
      {/* Grid */}
      {[2.5, 5.0, 7.5].map(v => (
        <line key={v} x1={PAD.left} x2={W - PAD.right} y1={yAt(v)} y2={yAt(v)}
          stroke="#E5E7EB" strokeWidth="0.75" strokeDasharray="4,3" />
      ))}
      {/* Y labels */}
      {[1, 5, 10].map(v => (
        <text key={v} x={PAD.left - 4} y={yAt(v) + 3} textAnchor="end" fontSize="7.5" fill="#CBD5E1">{v}</text>
      ))}
      {/* Day labels */}
      {dateArr.map((date, i) => {
        const d = new Date(date + 'T00:00:00');
        const lbl = i === DAYS - 1 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
        return (
          <text key={date} x={xAt(i)} y={H - 4} textAnchor="middle" fontSize="7.5" fill="#94A3B8">{lbl}</text>
        );
      })}
      {/* Metric lines */}
      {SLIDERS.map(({ key, chartColor }) => {
        const pts = dateArr.map((date, i) => {
          const e = logMap.get(date);
          return e ? { x: xAt(i), y: yAt(e.scores[key]) } : null;
        });

        const segments: { x: number; y: number }[][] = [];
        let cur: { x: number; y: number }[] = [];
        pts.forEach(p => {
          if (p) { cur.push(p); }
          else if (cur.length) { segments.push(cur); cur = []; }
        });
        if (cur.length) segments.push(cur);

        return segments.flatMap((seg, si) => [
          seg.length >= 2 && (
            <polyline
              key={`${key}-l${si}`}
              points={seg.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none" stroke={chartColor} strokeWidth="1.5"
              strokeLinejoin="round" strokeLinecap="round" opacity="0.75"
            />
          ),
          ...seg.map((p, pi) => (
            <circle key={`${key}-d${si}-${pi}`} cx={p.x} cy={p.y} r="2.5" fill={chartColor} opacity="0.9" />
          )),
        ].filter(Boolean));
      })}
    </svg>
  );
}

// ─── Resource Suggestions ────────────────────────────────────────────────────

function ResourceSuggestions({
  title,
  resources,
}: {
  title: string;
  resources: { title: string; desc: string; url: string; phone?: string; urgent?: boolean }[];
}) {
  return (
    <div className="mb-4 last:mb-0">
      <h4 className="text-[11px] font-bold text-amber-800 mb-2 uppercase tracking-wide">{title}</h4>
      <div className="space-y-2">
        {resources.map(r => (
          <div
            key={r.title}
            className={`bg-white rounded-xl p-3 border ${r.urgent ? 'border-red-200 shadow-sm' : 'border-amber-100'} flex items-start justify-between gap-3`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                {r.urgent && (
                  <span className="text-[10px] font-bold text-white bg-[#B22234] px-1.5 py-0.5 rounded uppercase tracking-wide">
                    Urgent
                  </span>
                )}
                <span className="text-xs font-bold text-[#1A2C5B]">{r.title}</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">{r.desc}</p>
              {r.phone && (
                <a
                  href={`tel:${r.phone.replace(/\D/g, '')}`}
                  className="text-[11px] font-semibold text-[#B22234] hover:underline mt-0.5 inline-block"
                >
                  {r.phone}
                </a>
              )}
            </div>
            <a
              href={r.url} target="_blank" rel="noopener noreferrer"
              className="flex-shrink-0 text-[11px] font-semibold text-[#1A2C5B] hover:text-blue-700 underline"
              aria-label={`Visit ${r.title}`}
            >
              Visit →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function WellnessPanel() {
  const router = useRouter();
  const [log,         setLog]         = useState<WellnessEntry[]>([]);
  const [scores,      setScores]      = useState<WellnessScores>({ mood: 5, energy: 5, sleep: 5, pain: 3, social: 5 });
  const [notes,       setNotes]       = useState('');
  const [savedToday,  setSavedToday]  = useState(false);
  const [justSaved,   setJustSaved]   = useState(false);
  const [showCrisis,  setShowCrisis]  = useState(false);
  const [isHydrated,    setIsHydrated]    = useState(false);
  const [nvwiConsent,   setNvwiConsent]   = useState<NvwiConsent | null>(null);
  const [showNvwiModal, setShowNvwiModal] = useState(false);
  const [pendingEntry,    setPendingEntry]    = useState<import('@/types/wellness').WellnessEntry | null>(null);
  const [lastChangedKey,  setLastChangedKey]  = useState<SliderKey | null>(null);
  const [isExporting,     setIsExporting]     = useState(false);
  const [wearableToken,   setWearableToken]   = useState<WearableToken | null>(null);
  const [todayWearable,   setTodayWearable]   = useState<WearableData | null>(null);
  const [wearableOverride, setWearableOverride] = useState<{ sleep?: boolean; energy?: boolean }>({});

  // ── Hydrate from localStorage ────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(WELLNESS_LOG_KEY);
      if (raw) {
        const parsed: WellnessEntry[] = JSON.parse(raw);
        setLog(parsed);
        const todayEntry = parsed.find(e => e.date === getTodayStr());
        if (todayEntry) {
          setScores(todayEntry.scores);
          setNotes(todayEntry.notes);
          setSavedToday(true);
        }
      }
      const consentRaw = localStorage.getItem(NVWI_CONSENT_KEY);
      if (consentRaw) setNvwiConsent(JSON.parse(consentRaw));

      // Load wearable state
      const token = getWearableToken();
      setWearableToken(token);
      const wData = getTodayWearableData();
      if (wData) setTodayWearable(wData);
    } catch { /* ignore malformed data */ }
    setIsHydrated(true);
  }, []);

  // ── Handle OAuth callback (token in URL hash) ─────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const platform     = params.get('platform') as WearableToken['platform'] | null;
    const accessToken  = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const expiresAt    = params.get('expires_at');
    if (platform && accessToken && expiresAt) {
      const token: WearableToken = {
        platform,
        accessToken,
        refreshToken: refreshToken || null,
        expiresAt:    Number(expiresAt),
      };
      saveWearableToken(token);
      setWearableToken(token);
      // Clear hash from URL
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      // Auto-sync immediately after connect
      const syncEndpoint = platform === 'fitbit' ? '/api/health/wearable/fitbit-sync' : '/api/health/wearable/garmin-sync';
      const body = platform === 'fitbit'
        ? { accessToken }
        : { accessToken, tokenSecret: refreshToken };
      fetch(syncEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(r => r.ok ? r.json() : null)
        .then((data: WearableData | null) => {
          if (!data) return;
          saveTodayWearableData(data);
          setTodayWearable(data);
          const suggestions = wearableToSliderSuggestions(data);
          if (suggestions.sleep   != null) setScores(prev => ({ ...prev, sleep:  suggestions.sleep!  }));
          if (suggestions.energy  != null) setScores(prev => ({ ...prev, energy: suggestions.energy! }));
        })
        .catch(() => { /* non-critical */ });
    }
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSlider = useCallback((key: SliderKey, value: number) => {
    setScores(prev => ({ ...prev, [key]: value }));
    setSavedToday(false);
    setLastChangedKey(key);
    setTimeout(() => setLastChangedKey(null), 400);
    if (key === 'mood' && value === 1) setShowCrisis(true);
  }, []);

  const handleNotes = useCallback((value: string) => {
    setNotes(value);
    setSavedToday(false);
    if (CRISIS_KEYWORDS.some(kw => value.toLowerCase().includes(kw))) setShowCrisis(true);
  }, []);

  const syncToRegistry = useCallback(async (
    entry: WellnessEntry,
    consent: NvwiConsent,
  ) => {
    if (!consent.enrolled) return;
    try {
      const profileRaw = localStorage.getItem(WELLNESS_PROFILE_KEY);
      const profile: WellnessProfile | undefined = profileRaw ? JSON.parse(profileRaw) : undefined;
      const payload = buildCohortUpdate(entry, profile);
      await fetch(REGISTRY_SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch { /* non-critical — fail silently */ }
  }, []);

  const handleSave = useCallback(() => {
    if (detectCrisis(scores, notes)) { setShowCrisis(true); return; }
    const entry: WellnessEntry = {
      date: getTodayStr(),
      scores,
      notes,
      savedAt: new Date().toISOString(),
    };
    setLog(prev => {
      const updated = [...prev.filter(e => e.date !== entry.date), entry]
        .sort((a, b) => a.date.localeCompare(b.date));
      localStorage.setItem(WELLNESS_LOG_KEY, JSON.stringify(updated));
      return updated;
    });
    setSavedToday(true);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);

    if (nvwiConsent === null) {
      setPendingEntry(entry);
      setShowNvwiModal(true);
    } else if (nvwiConsent.enrolled) {
      syncToRegistry(entry, nvwiConsent);
    }
  }, [scores, notes, nvwiConsent, syncToRegistry]);

  const handleWearableSynced = useCallback((data: WearableData) => {
    setTodayWearable(data);
    saveTodayWearableData(data);
    setWearableOverride({});
    const suggestions = wearableToSliderSuggestions(data);
    if (suggestions.sleep   != null) setScores(prev => ({ ...prev, sleep:  suggestions.sleep!  }));
    if (suggestions.energy  != null) setScores(prev => ({ ...prev, energy: suggestions.energy! }));
  }, []);

  const handleWearableDisconnected = useCallback(() => {
    setWearableToken(null);
    setTodayWearable(null);
    setWearableOverride({});
  }, []);

  const handleNvwiConsent = useCallback((consent: NvwiConsent) => {
    setNvwiConsent(consent);
    setShowNvwiModal(false);
    if (consent.enrolled && pendingEntry) syncToRegistry(pendingEntry, consent);
    setPendingEntry(null);
  }, [pendingEntry, syncToRegistry]);

  const handleNvwiDecline = useCallback(() => {
    const declined: NvwiConsent = { enrolled: false, includeWearable: false, enrolledAt: new Date().toISOString() };
    setNvwiConsent(declined);
    setShowNvwiModal(false);
    setPendingEntry(null);
  }, []);

  // [PREMIUM: wellness_diary_export] Symptom diary PDF — premium feature
  const handleExportDiary = useCallback(async () => {
    if (log.length === 0) return;
    setIsExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc    = new jsPDF({ unit: 'pt', format: 'letter' });
      const pageW  = doc.internal.pageSize.getWidth();
      const margin = 54;
      const maxW   = pageW - margin * 2;
      let y        = 60;

      const write = (text: string, opts: { size?: number; bold?: boolean; color?: [number, number, number] } = {}) => {
        doc.setFontSize(opts.size ?? 10);
        doc.setTextColor(...(opts.color ?? [30, 30, 30]));
        const lines = doc.splitTextToSize(text, maxW) as string[];
        lines.forEach((line: string) => {
          if (y > 720) { doc.addPage(); y = 60; }
          doc.text(line, margin, y);
          y += (opts.size ?? 10) * 1.45;
        });
      };
      const gap = (n = 8) => { y += n; };
      const rule = () => {
        if (y > 720) { doc.addPage(); y = 60; }
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, y, pageW - margin, y);
        y += 10;
      };

      // Cover header
      doc.setFillColor(26, 44, 91);
      doc.rect(0, 0, pageW, 44, 'F');
      doc.setFontSize(15); doc.setTextColor(255, 255, 255);
      doc.text('Vet1Stop — Personal Wellness Symptom Diary', margin, 28);
      y = 66;

      const now  = new Date();
      const past = new Date(); past.setDate(now.getDate() - 29);
      const fmt  = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      write(`Date Range: ${fmt(past)} — ${fmt(now)}`, { size: 9, color: [100, 100, 100] });
      gap(4);
      write(`Generated: ${fmt(now)}  |  Total Check-Ins: ${log.length}`, { size: 9, color: [100, 100, 100] });
      gap(4);
      write('DISCLAIMER: Personal tracking tool only. Not a medical record. Not a diagnosis. For VA appointment and C&P exam reference only.', { size: 8, color: [160, 80, 80] });
      gap(14);
      rule();

      // Column headers
      doc.setFontSize(8); doc.setTextColor(100, 100, 100);
      const cols = { date: margin, mood: margin + 90, energy: margin + 130, sleep: margin + 175, pain: margin + 218, social: margin + 260, notes: margin + 310 };
      doc.text('Date',   cols.date,   y);
      doc.text('Mood',   cols.mood,   y);
      doc.text('Energy', cols.energy, y);
      doc.text('Sleep',  cols.sleep,  y);
      doc.text('Pain',   cols.pain,   y);
      doc.text('Social', cols.social, y);
      doc.text('Notes',  cols.notes,  y);
      y += 14;
      rule();

      // Rows — last 30 days most recent first
      const recent = [...log].reverse().slice(0, 30);
      recent.forEach((entry, i) => {
        if (y > 700) { doc.addPage(); y = 60; }
        const d = new Date(entry.date + 'T00:00:00');
        const dl = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
        const rowColor: [number, number, number] = i % 2 === 0 ? [30, 30, 30] : [60, 60, 60];
        doc.setFontSize(8.5); doc.setTextColor(...rowColor);
        doc.text(dl,                            cols.date,   y);
        doc.text(String(entry.scores.mood),     cols.mood,   y);
        doc.text(String(entry.scores.energy),   cols.energy, y);
        doc.text(String(entry.scores.sleep),    cols.sleep,  y);
        doc.text(String(entry.scores.pain),     cols.pain,   y);
        doc.text(String(entry.scores.social),   cols.social, y);
        if (entry.notes) {
          const noteSnip = entry.notes.slice(0, 55) + (entry.notes.length > 55 ? '…' : '');
          doc.text(noteSnip, cols.notes, y);
        }
        y += 14;
      });

      gap(16); rule();

      // Footer note
      write('Suggested use: Bring this diary to your VA appointment or share with your VSO before a C&P exam as supporting documentation of symptom frequency and severity over time.', { size: 8.5, color: [80, 80, 80] });
      gap(6);
      write('All data was recorded privately on your personal device. Vet1Stop is NOT a VSO and does not provide claims assistance. Always consult an accredited VSO (DAV, VFW, American Legion) for official claims support.', { size: 8, color: [140, 140, 140] });

      const fileName = `vet1stop-wellness-diary-${now.toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch {
      /* fail silently — non-critical */
    } finally {
      setIsExporting(false);
    }
  }, [log]);

  const handleBridgeToCpp = useCallback(() => {
    if (log.length === 0) return;
    const avgPain   = log.slice(-7).reduce((s, e) => s + e.scores.pain,  0) / Math.min(log.length, 7);
    const avgMood   = log.slice(-7).reduce((s, e) => s + e.scores.mood,  0) / Math.min(log.length, 7);
    const avgSleep  = log.slice(-7).reduce((s, e) => s + e.scores.sleep, 0) / Math.min(log.length, 7);
    const conditions = [
      avgPain  >= 5 ? { condition: 'Chronic Pain (self-reported)',         category: 'pain',          mentionCount: log.length, firstMentionDate: log[0]?.date ?? null, pagesFound: [], sourceModule: 'wellness' as const } : null,
      avgMood  <= 5 ? { condition: 'Mood / Mental Health (self-reported)', category: 'mental-health', mentionCount: log.length, firstMentionDate: log[0]?.date ?? null, pagesFound: [], sourceModule: 'wellness' as const } : null,
      avgSleep <= 5 ? { condition: 'Sleep Issues (self-reported)',         category: 'sleep',         mentionCount: log.length, firstMentionDate: log[0]?.date ?? null, pagesFound: [], sourceModule: 'wellness' as const } : null,
    ].filter(Boolean);
    if (conditions.length === 0) return;
    const payload = {
      conditions,
      sourceModule: 'wellness' as const,
      timestamp: new Date().toISOString(),
      reportSummary: `${log.length} wellness check-ins — avg pain ${avgPain.toFixed(1)}, mood ${avgMood.toFixed(1)}, sleep ${avgSleep.toFixed(1)}.`,
    };
    localStorage.setItem(BRIDGE_STORAGE_KEY, JSON.stringify(payload));
    router.push('/health/cpp-prep');
  }, [log, router]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const insights = useMemo(() => computeInsights(log), [log]);

  const avgScore = useMemo(() => {
    const vals = Object.values(scores);
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  }, [scores]);

  const streak = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 90; i++) {
      const ds = getDateStr(i);
      if (ds === getTodayStr() && !savedToday && i === 0) continue;
      if (log.some(e => e.date === ds)) count++;
      else if (i > 0) break;
    }
    return count;
  }, [log, savedToday]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A2C5B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── NVWI Consent Modal ─────────────────────────────────────────── */}
      {showNvwiModal && (
        <NvwiConsentModal
          hasWearable={!!wearableToken}
          onConsent={handleNvwiConsent}
          onDecline={handleNvwiDecline}
        />
      )}

      {/* ── Crisis Modal ─────────────────────────────────────────────────── */}
      {showCrisis && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog" aria-modal="true" aria-labelledby="crisis-modal-heading"
        >
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="bg-[#B22234] px-6 py-5">
              <h2 id="crisis-modal-heading" className="text-xl font-extrabold text-white">You're Not Alone</h2>
              <p className="text-white/80 text-sm mt-1">Help is available right now, 24/7.</p>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-gray-600 text-sm leading-relaxed">
                We noticed something in your check-in. If you're struggling right now, please reach out — it takes courage and it matters.
              </p>
              <a
                href="tel:988"
                className="flex items-center justify-center gap-2 w-full py-4 bg-[#B22234] text-white font-bold rounded-xl hover:bg-red-700 transition-colors text-base shadow-md"
              >
                <PhoneIconSolid className="h-5 w-5" />
                Call 988 — Veterans Crisis Line
              </a>
              <a
                href="sms:838255"
                className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 text-[#1A2C5B] font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm"
              >
                Text 838255
              </a>
              <button
                onClick={() => setShowCrisis(false)}
                className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors pt-1"
              >
                I'm okay — continue check-in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-1 text-sm text-gray-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#1A2C5B] transition-colors">Home</Link>
            <ChevronRightIcon className="h-3 w-3" />
            <Link href="/health" className="hover:text-[#1A2C5B] transition-colors">Health</Link>
            <ChevronRightIcon className="h-3 w-3" />
            <span className="text-[#1A2C5B] font-medium">Wellness Predictor</span>
          </nav>
          <div className="flex items-center gap-3">
            {nvwiConsent?.enrolled && (
              <span className="hidden sm:flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                <StarIcon className="h-3 w-3 text-emerald-500" aria-hidden="true" />
                Registry Member
              </span>
            )}
            <a
              href="tel:988"
              className="hidden sm:flex items-center gap-1.5 text-xs text-[#B22234] font-semibold hover:text-red-700 transition-colors"
              aria-label="Veterans Crisis Line 988"
            >
              <PhoneIconSolid className="h-3.5 w-3.5" />
              988 Crisis Line
            </a>
          </div>
        </div>
      </div>

      {/* ── Page Hero ────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0F1D3D] via-[#1A2C5B] to-[#1e3a7a] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-xs text-white/70 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                Private · Nothing leaves your device
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
                AI Wellness Predictor
              </h1>
              <p className="text-white/70 max-w-xl text-sm md:text-base leading-relaxed">
                Track your daily well-being across 5 dimensions. Spot trends before they become problems — and build a private symptom diary that supports your C&P exam, VA appointments, and benefit claims.
              </p>
            </div>
            {streak > 0 && (
              <div className="flex-shrink-0 text-center bg-white/10 border border-white/10 rounded-2xl px-5 py-4">
                <div className="text-3xl font-extrabold text-[#EAB308]">{streak}</div>
                <div className="text-xs text-white/60 mt-0.5">day streak</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Check-In Card ─────────────────────────────────────────── */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-[#1A2C5B]">Today&rsquo;s Check-In</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  <span className="text-gray-300 mx-1.5">·</span>
                  <span className="text-gray-400">Drag each slider to rate</span>
                </p>
              </div>
              {savedToday && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full">
                  <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  Saved
                </span>
              )}
            </div>

            <div className="px-6 py-5 space-y-5">
              {SLIDERS.map(({ key, label, icon: Icon, color, fillHex, desc }) => {
                const isWearableKey = (key === 'sleep' || key === 'energy') && todayWearable && !wearableOverride[key as 'sleep' | 'energy'];
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${color}`} aria-hidden="true" />
                        <span className="text-sm font-semibold text-gray-800">{label}</span>
                        {isWearableKey && (
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                            from device
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isWearableKey && (
                          <button
                            onClick={() => setWearableOverride(prev => ({ ...prev, [key]: true }))}
                            className="text-[10px] text-gray-400 hover:text-[#1A2C5B] underline transition-colors"
                            aria-label={`Override ${label} with manual input`}
                          >
                            edit
                          </button>
                        )}
                        <span className="text-[11px] text-gray-400 hidden sm:block">{desc}</span>
                        <span
                          className={`text-xl font-extrabold ${color} w-6 text-center tabular-nums transition-transform duration-150 ${
                            lastChangedKey === key ? 'scale-125' : 'scale-100'
                          }`}
                          aria-live="polite"
                        >
                          {scores[key]}
                        </span>
                      </div>
                    </div>

                    {isWearableKey ? (
                      /* Wearable data card — no slider shown */
                      <div className={`rounded-xl border px-4 py-2.5 flex items-center justify-between ${
                        key === 'sleep' ? 'bg-indigo-50 border-indigo-100' : 'bg-blue-50 border-blue-100'
                      }`}>
                        <span className="text-xs text-gray-500">
                          {key === 'sleep' && todayWearable!.sleepDurationMin != null
                            ? `${Math.floor(todayWearable!.sleepDurationMin / 60)}h ${todayWearable!.sleepDurationMin % 60}m sleep`
                            : key === 'energy' && todayWearable!.restingHR != null
                            ? `${todayWearable!.restingHR} bpm resting HR`
                            : 'Device data'}
                        </span>
                        <span className={`text-sm font-extrabold ${color}`}>{scores[key]} / 10</span>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="range"
                          min={1} max={10} step={1}
                          value={scores[key]}
                          onChange={e => handleSlider(key, Number(e.target.value))}
                          style={{
                            background: `linear-gradient(to right, ${fillHex} 0%, ${fillHex} ${((scores[key] - 1) / 9) * 100}%, #e5e7eb ${((scores[key] - 1) / 9) * 100}%, #e5e7eb 100%)`,
                            ['--thumb-color']: fillHex,
                          } as React.CSSProperties}
                          className="w-full h-3 rounded-full appearance-none cursor-grab active:cursor-grabbing [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--thumb-color)] [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-grab [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--thumb-color)] [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-grab"
                          aria-label={`${label}, current value ${scores[key]} out of 10`}
                        />
                        <div className="flex justify-between text-[10px] text-gray-300 mt-1.5 px-0.5 select-none">
                          <span>1 — low</span><span>5</span><span>10 — high</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Notes */}
              <div>
                <label htmlFor="wellness-notes" className="text-sm font-semibold text-gray-800 block mb-1.5">
                  Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="wellness-notes"
                  value={notes}
                  onChange={e => handleNotes(e.target.value)}
                  placeholder="How are you feeling today? Anything specific on your mind?"
                  rows={3}
                  className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1A2C5B]/30 focus:border-[#1A2C5B] resize-none transition-all"
                />
              </div>

              {/* Save */}
              <button
                onClick={handleSave}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200 shadow-sm ${
                  justSaved
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[#1A2C5B] text-white hover:bg-[#0F1D3D] hover:shadow-md hover:-translate-y-0.5'
                }`}
                aria-label="Save today's wellness check-in"
              >
                {justSaved ? '✓ Check-In Saved!' : 'Save Check-In'}
              </button>

              {/* [PREMIUM: wellness_diary_export] Export + C&P Bridge buttons */}
              {log.length > 0 && (
                <div className="pt-1 border-t border-gray-50 space-y-2">
                  <PremiumGate feature="wellness_diary_export" compact>
                    <div className="flex gap-2">
                      <button
                        onClick={handleExportDiary}
                        disabled={isExporting}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[#1A2C5B] font-semibold text-xs rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                        aria-label="Export 30-day symptom diary as PDF"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" aria-hidden="true" />
                        {isExporting ? 'Generating…' : 'Export Symptom Diary (PDF)'}
                      </button>
                      <button
                        onClick={handleBridgeToCpp}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-semibold text-xs rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        aria-label="Use wellness data in C&P Exam Prep"
                        title="Send to C&P Exam Prep"
                      >
                        <ArrowRightCircleIcon className="h-4 w-4" aria-hidden="true" />
                        C&amp;P Prep
                      </button>
                    </div>
                  </PremiumGate>
                </div>
              )}

              {/* Overall score */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                <span className="text-xs text-gray-400">Overall wellness score</span>
                <span className="text-sm font-extrabold text-[#1A2C5B] tabular-nums">
                  {avgScore} <span className="text-gray-400 font-normal">/ 10</span>
                </span>
              </div>
            </div>
          </div>

          {/* ── Trend + Recent ────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Wearable Connect Card */}
            {/* [PREMIUM: wellness_wearable_sync] */}
            <PremiumGate feature="wellness_wearable_sync" compact>
              <WearableConnectCard
                currentToken={wearableToken}
                todayData={todayWearable}
                onDataSynced={handleWearableSynced}
                onDisconnected={handleWearableDisconnected}
              />
            </PremiumGate>

            {/* Sparkline */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-extrabold text-[#1A2C5B] mb-0.5">7-Day Trend</h3>
              <p className="text-[11px] text-gray-400 mb-4">All 5 dimensions</p>
              {log.length === 0 ? (
                <div className="h-28 flex items-center justify-center text-xs text-gray-300 text-center leading-relaxed">
                  Your trend appears<br />after your first check-in
                </div>
              ) : (
                <div className="h-28">
                  <Sparkline log={log} />
                </div>
              )}
              {/* Legend */}
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
                {SLIDERS.map(({ key, label, chartColor }) => (
                  <span key={key} className="flex items-center gap-1 text-[10px] text-gray-500">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: chartColor }} aria-hidden="true" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Recent check-ins */}
            {log.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm font-extrabold text-[#1A2C5B] mb-3">Recent Check-Ins</h3>
                <div className="space-y-3">
                  {[...log].reverse().slice(0, 4).map(entry => {
                    const avg = (Object.values(entry.scores).reduce((a, b) => a + b, 0) / 5).toFixed(1);
                    const d = new Date(entry.date + 'T00:00:00');
                    const isToday = entry.date === getTodayStr();
                    const isYesterday = entry.date === getDateStr(1);
                    const label = isToday ? 'Today' : isYesterday ? 'Yesterday'
                      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    return (
                      <div key={entry.date} className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5 items-end">
                            {SLIDERS.map(({ key, chartColor }) => (
                              <div
                                key={key}
                                className="w-2 rounded-sm"
                                style={{
                                  height: `${6 + ((entry.scores[key] - 1) / 9) * 14}px`,
                                  backgroundColor: chartColor,
                                  opacity: 0.5 + (entry.scores[key] / 10) * 0.5,
                                }}
                                aria-hidden="true"
                              />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-[#1A2C5B] tabular-nums w-6 text-right">{avg}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Premium Dashboard ─────────────────────────────────────────── */}
        {log.length >= 1 && (
          <section aria-label="Premium wellness dashboard">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold text-[#1A2C5B] uppercase tracking-widest">Premium Dashboard</span>
              <span className="flex-1 h-px bg-gray-100" />
            </div>
            <div className="space-y-6">

              {/* Correlation chart — [PREMIUM: wellness_correlation_chart] */}
              <PremiumGate feature="wellness_correlation_chart">
                <WellnessCorrelationChart log={log} />
              </PremiumGate>

              {/* AI insights + Caregiver share — 2-col on lg */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* AI insight cards — [PREMIUM: wellness_ai_insights] */}
                <PremiumGate feature="wellness_insight_cards">
                  <WellnessInsightCards log={log} />
                </PremiumGate>

                {/* Caregiver / appointment share — [PREMIUM: wellness_caregiver_share] */}
                <PremiumGate feature="wellness_caregiver_share">
                  <WellnessCaregiverReport log={log} />
                </PremiumGate>

              </div>
            </div>
          </section>
        )}

        {/* ── Smart Insights ─────────────────────────────────────────────── */}
        {(insights.showMentalHealth || insights.showPhysical || insights.showSleep) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6" role="region" aria-label="Wellness insights">
            <div className="flex items-start gap-3 mb-5">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-extrabold text-amber-800">Wellness Insight</h3>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  Based on your recent check-ins, these resources may help. This is not a diagnosis.
                </p>
              </div>
            </div>
            {insights.showMentalHealth && (
              <ResourceSuggestions title="Mental Health Support" resources={MENTAL_HEALTH_RESOURCES} />
            )}
            {insights.showPhysical && (
              <ResourceSuggestions title="Pain & Physical Health" resources={PHYSICAL_HEALTH_RESOURCES} />
            )}
            {insights.showSleep && (
              <ResourceSuggestions title="Sleep Support" resources={SLEEP_RESOURCES} />
            )}
          </div>
        )}

        {/* ── Registry / Profile Footer ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
          {nvwiConsent === null ? (
            <button
              onClick={() => setShowNvwiModal(true)}
              className="text-xs text-[#1A2C5B] font-semibold hover:underline flex items-center gap-1"
            >
              <StarIcon className="h-3 w-3 text-amber-400" aria-hidden="true" />
              Join the National Veteran Wellness Registry
            </button>
          ) : nvwiConsent.enrolled ? (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <StarIcon className="h-3 w-3" aria-hidden="true" />
              Contributing anonymized data to veteran health research
            </span>
          ) : (
            <button
              onClick={() => setShowNvwiModal(true)}
              className="text-xs text-gray-400 hover:text-[#1A2C5B] transition-colors"
            >
              Join the Wellness Registry
            </button>
          )}
          <Link
            href="/health/wellness/setup"
            className="text-xs text-gray-400 hover:text-[#1A2C5B] flex items-center gap-1 transition-colors"
          >
            <Cog6ToothIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Update Wellness Profile
          </Link>
        </div>

        {/* ── Legal Disclaimer ─────────────────────────────────────────────── */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            <strong className="text-gray-500">Not a medical device.</strong> AI Wellness Predictor is a personal journaling tool only — not a substitute for professional mental health care or clinical assessment.
            {' '}All data stays in your browser and is never transmitted. If you are in crisis, call{' '}
            <a href="tel:988" className="text-[#B22234] font-bold hover:underline">988 (Press 1)</a> immediately.
            {' '}Always consult your VA provider or a licensed mental health professional.
          </p>
        </div>
      </div>
    </div>
  );
}
