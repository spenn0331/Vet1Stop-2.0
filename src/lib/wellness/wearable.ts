// @ts-nocheck
import type { WearableData, WearableToken, WearablePlatform } from '@/types/wellness';
import { WEARABLE_TOKEN_KEY, WEARABLE_DATA_KEY } from '@/types/wellness';

// ─── Token helpers (localStorage) ────────────────────────────────────────────

export function getWearableToken(): WearableToken | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(WEARABLE_TOKEN_KEY);
    if (!raw) return null;
    const token: WearableToken = JSON.parse(raw);
    if (Date.now() > token.expiresAt) return null;
    return token;
  } catch { return null; }
}

export function saveWearableToken(token: WearableToken): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(WEARABLE_TOKEN_KEY, JSON.stringify(token)); } catch { /* ignore */ }
}

export function clearWearableToken(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(WEARABLE_TOKEN_KEY);
    localStorage.removeItem(WEARABLE_DATA_KEY);
  } catch { /* ignore */ }
}

// ─── Today's synced data (localStorage cache) ────────────────────────────────

export function getTodayWearableData(): WearableData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(WEARABLE_DATA_KEY);
    if (!raw) return null;
    const data: WearableData = JSON.parse(raw);
    const today = new Date().toISOString().split('T')[0];
    if (data.date !== today) return null;
    return data;
  } catch { return null; }
}

export function saveTodayWearableData(data: WearableData): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(WEARABLE_DATA_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

// ─── Map wearable data → WellnessScores partial ──────────────────────────────
// Returns suggested slider values from objective device readings.
// User can always override.

export function wearableToSliderSuggestions(data: WearableData): {
  sleep: number | null;
  energy: number | null;
} {
  let sleep: number | null = null;
  let energy: number | null = null;

  if (data.sleepDurationMin !== null) {
    const hrs = data.sleepDurationMin / 60;
    if (hrs >= 8)        sleep = 9;
    else if (hrs >= 7)   sleep = 8;
    else if (hrs >= 6)   sleep = 6;
    else if (hrs >= 5)   sleep = 4;
    else                 sleep = 2;
    if (data.sleepEfficiency !== null) {
      if (data.sleepEfficiency >= 85) sleep = Math.min(10, sleep + 1);
      else if (data.sleepEfficiency < 70) sleep = Math.max(1, sleep - 1);
    }
  }

  if (data.restingHR !== null) {
    const hr = data.restingHR;
    if (hr <= 55)       energy = 9;
    else if (hr <= 65)  energy = 7;
    else if (hr <= 75)  energy = 5;
    else if (hr <= 85)  energy = 3;
    else                energy = 2;
  }

  if (data.steps !== null && energy !== null) {
    if (data.steps >= 10000) energy = Math.min(10, energy + 1);
    else if (data.steps < 3000) energy = Math.max(1, energy - 1);
  }

  return { sleep, energy };
}

// ─── Connected platform label ─────────────────────────────────────────────────

export function platformLabel(platform: WearablePlatform): string {
  return { fitbit: 'Fitbit', garmin: 'Garmin', apple: 'Apple Health' }[platform];
}
