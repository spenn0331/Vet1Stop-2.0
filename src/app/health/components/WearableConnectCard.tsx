'use client';

import React, { useState, useCallback } from 'react';
import {
  ArrowPathIcon,
  XMarkIcon,
  CheckCircleIcon,
  DevicePhoneMobileIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import type { WearableData, WearableToken } from '@/types/wellness';
import {
  getWearableToken,
  clearWearableToken,
  saveTodayWearableData,
  saveWearableToken,
  platformLabel,
} from '@/lib/wellness/wearable';

interface WearableConnectCardProps {
  onDataSynced: (data: WearableData) => void;
  onDisconnected: () => void;
  currentToken: WearableToken | null;
  todayData: WearableData | null;
}

// ─── Apple Health JSON import ─────────────────────────────────────────────────

interface AppleHealthExport {
  sleepDurationMin?: number;
  sleepEfficiency?: number;
  restingHR?: number;
  hrv?: number;
  steps?: number;
  activeMinutes?: number;
}

function parseAppleHealthJson(raw: string): WearableData | null {
  try {
    const parsed: AppleHealthExport = JSON.parse(raw);
    const today = new Date().toISOString().split('T')[0];
    return {
      platform:         'apple',
      date:             today,
      sleepDurationMin: parsed.sleepDurationMin ?? null,
      sleepEfficiency:  parsed.sleepEfficiency  ?? null,
      restingHR:        parsed.restingHR        ?? null,
      hrv:              parsed.hrv              ?? null,
      steps:            parsed.steps            ?? null,
      activeMinutes:    parsed.activeMinutes    ?? null,
      syncedAt:         new Date().toISOString(),
    };
  } catch { return null; }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WearableConnectCard({
  onDataSynced,
  onDisconnected,
  currentToken,
  todayData,
}: WearableConnectCardProps) {
  const [isSyncing,       setIsSyncing]       = useState(false);
  const [syncError,       setSyncError]       = useState<string | null>(null);
  const [showAppleImport, setShowAppleImport] = useState(false);
  const [appleJson,       setAppleJson]       = useState('');
  const [appleError,      setAppleError]      = useState<string | null>(null);

  const handleSync = useCallback(async () => {
    const token = getWearableToken();
    if (!token) return;
    setIsSyncing(true);
    setSyncError(null);

    const endpoint = token.platform === 'fitbit'
      ? '/api/health/wearable/fitbit-sync'
      : '/api/health/wearable/garmin-sync';

    const body = token.platform === 'fitbit'
      ? { accessToken: token.accessToken }
      : { accessToken: token.accessToken, tokenSecret: token.refreshToken };

    try {
      const res = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Sync failed');
      const data: WearableData = await res.json();
      saveTodayWearableData(data);
      onDataSynced(data);
    } catch {
      setSyncError('Sync failed. Check your connection and try again.');
    } finally {
      setIsSyncing(false);
    }
  }, [onDataSynced]);

  const handleDisconnect = useCallback(() => {
    clearWearableToken();
    onDisconnected();
  }, [onDisconnected]);

  const handleAppleImport = useCallback(() => {
    setAppleError(null);
    const data = parseAppleHealthJson(appleJson);
    if (!data) {
      setAppleError('Could not read the JSON. Make sure you copied the full output from the Shortcut.');
      return;
    }
    const fakeToken: WearableToken = {
      platform:     'apple',
      accessToken:  'apple-health-import',
      refreshToken: null,
      expiresAt:    Date.now() + 365 * 24 * 60 * 60 * 1000,
    };
    saveWearableToken(fakeToken);
    saveTodayWearableData(data);
    setShowAppleImport(false);
    setAppleJson('');
    onDataSynced(data);
  }, [appleJson, onDataSynced]);

  const handleFileImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setAppleJson(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const syncTime = todayData?.syncedAt
    ? new Date(todayData.syncedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : null;

  // ── Connected state ───────────────────────────────────────────────────────
  if (currentToken) {
    const label = platformLabel(currentToken.platform);
    const isApple = currentToken.platform === 'apple';

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
            <h3 className="text-sm font-extrabold text-[#1A2C5B]">{label} Connected</h3>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-gray-400 hover:text-red-500 transition-colors"
            aria-label={`Disconnect ${label}`}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        {todayData && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {todayData.sleepDurationMin != null && (
              <div className="bg-indigo-50 rounded-xl p-2.5 text-center">
                <div className="text-xs text-indigo-400 mb-0.5">Sleep</div>
                <div className="text-base font-extrabold text-indigo-700">
                  {Math.floor(todayData.sleepDurationMin / 60)}h {todayData.sleepDurationMin % 60}m
                </div>
              </div>
            )}
            {todayData.restingHR != null && (
              <div className="bg-red-50 rounded-xl p-2.5 text-center">
                <div className="text-xs text-red-400 mb-0.5">Resting HR</div>
                <div className="text-base font-extrabold text-red-600">{todayData.restingHR} bpm</div>
              </div>
            )}
            {todayData.steps != null && (
              <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                <div className="text-xs text-emerald-500 mb-0.5">Steps</div>
                <div className="text-base font-extrabold text-emerald-700">{todayData.steps.toLocaleString()}</div>
              </div>
            )}
            {todayData.hrv != null && (
              <div className="bg-amber-50 rounded-xl p-2.5 text-center">
                <div className="text-xs text-amber-500 mb-0.5">HRV</div>
                <div className="text-base font-extrabold text-amber-700">{Math.round(todayData.hrv)} ms</div>
              </div>
            )}
          </div>
        )}

        {syncError && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{syncError}</p>
        )}

        <div className="flex items-center justify-between">
          {syncTime && (
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <CheckCircleIcon className="h-3 w-3 text-emerald-400" />
              Synced at {syncTime}
            </span>
          )}
          {!isApple && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-[#1A2C5B] hover:text-blue-700 transition-colors disabled:opacity-50"
              aria-label="Sync wearable data now"
            >
              <ArrowPathIcon className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing…' : 'Sync Now'}
            </button>
          )}
          {isApple && (
            <button
              onClick={() => setShowAppleImport(true)}
              className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-[#1A2C5B] hover:text-blue-700 transition-colors"
            >
              <ArrowUpTrayIcon className="h-3.5 w-3.5" />
              Re-Import
            </button>
          )}
        </div>

        {showAppleImport && (
          <AppleImportPanel
            appleJson={appleJson}
            appleError={appleError}
            onJsonChange={setAppleJson}
            onFileImport={handleFileImport}
            onImport={handleAppleImport}
            onClose={() => { setShowAppleImport(false); setAppleError(null); }}
          />
        )}
      </div>
    );
  }

  // ── Disconnected state — connect buttons ──────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-extrabold text-[#1A2C5B] mb-1">Connect a Wearable</h3>
      <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
        Automatically pre-fill your Sleep and Energy sliders from your device. Pain, Mood, and Social remain manual.
      </p>

      <div className="space-y-2">
        <a
          href="/api/health/wearable/fitbit-auth"
          className="flex items-center gap-3 w-full px-4 py-3 bg-[#00B0B9]/10 hover:bg-[#00B0B9]/20 border border-[#00B0B9]/30 text-[#00B0B9] font-semibold text-sm rounded-xl transition-colors"
        >
          <span className="text-base font-bold w-5 text-center">F</span>
          Connect Fitbit
        </a>
        <a
          href="/api/health/wearable/garmin-auth"
          className="flex items-center gap-3 w-full px-4 py-3 bg-[#1a73e8]/10 hover:bg-[#1a73e8]/20 border border-[#1a73e8]/30 text-[#1a73e8] font-semibold text-sm rounded-xl transition-colors"
        >
          <span className="text-base font-bold w-5 text-center">G</span>
          Connect Garmin
        </a>
        <button
          onClick={() => setShowAppleImport(true)}
          className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-colors"
        >
          <DevicePhoneMobileIcon className="h-5 w-5" />
          Import from Apple Health
        </button>
      </div>

      {showAppleImport && (
        <AppleImportPanel
          appleJson={appleJson}
          appleError={appleError}
          onJsonChange={setAppleJson}
          onFileImport={handleFileImport}
          onImport={handleAppleImport}
          onClose={() => { setShowAppleImport(false); setAppleError(null); setAppleJson(''); }}
        />
      )}
    </div>
  );
}

// ─── Apple Health import sub-panel ───────────────────────────────────────────

function AppleImportPanel({
  appleJson,
  appleError,
  onJsonChange,
  onFileImport,
  onImport,
  onClose,
}: {
  appleJson: string;
  appleError: string | null;
  onJsonChange: (v: string) => void;
  onFileImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImport: () => void;
  onClose: () => void;
}) {
  return (
    <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-700">Import from Apple Health</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
      <p className="text-[11px] text-gray-500 leading-relaxed">
        1. Open the <strong>Shortcuts</strong> app on your iPhone.<br />
        2. Run the <strong>&ldquo;Vet1Stop Health Export&rdquo;</strong> shortcut
        (<a href="/apple-health-shortcut-instructions" className="text-[#1A2C5B] underline" target="_blank" rel="noopener noreferrer">setup guide</a>).<br />
        3. Paste the JSON output below or upload the exported file.
      </p>
      <label className="flex items-center gap-2 cursor-pointer text-xs text-[#1A2C5B] font-semibold">
        <ArrowUpTrayIcon className="h-4 w-4" />
        Upload JSON file
        <input type="file" accept=".json" onChange={onFileImport} className="sr-only" />
      </label>
      <textarea
        value={appleJson}
        onChange={e => onJsonChange(e.target.value)}
        placeholder={'{\n  "sleepDurationMin": 420,\n  "restingHR": 58,\n  "hrv": 45,\n  "steps": 7200\n}'}
        rows={5}
        className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1A2C5B] resize-none"
        aria-label="Apple Health JSON data"
      />
      {appleError && <p className="text-xs text-red-600">{appleError}</p>}
      <button
        onClick={onImport}
        disabled={!appleJson.trim()}
        className="w-full py-2.5 bg-[#1A2C5B] text-white text-xs font-bold rounded-lg hover:bg-[#0F1D3D] disabled:opacity-40 transition-colors"
      >
        Import Data
      </button>
    </div>
  );
}
