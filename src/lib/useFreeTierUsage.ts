'use client';

import { useState, useEffect, useCallback } from 'react';
import { isPremium } from '@/lib/premium';

// ─── Free Tier Daily Usage Tracker ───────────────────────────────────────────
// Reads/writes localStorage to enforce daily AI session limits for free-tier users.
// localStorage key format: vet1stop_usage_<usageKey>
// Stored value: { count: number, date: "YYYY-MM-DD" }
// If stored date !== today → count resets to 0 automatically.
// Premium users and DEV_UNLOCKED bypass all limits.

const DEV_UNLOCKED = process.env.NEXT_PUBLIC_DEV_PREMIUM === 'true';

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function readUsage(storageKey: string): { count: number; date: string } {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { count: 0, date: getTodayString() };
    const parsed = JSON.parse(raw) as { count: number; date: string };
    // Reset if it's a new day
    if (parsed.date !== getTodayString()) return { count: 0, date: getTodayString() };
    return parsed;
  } catch {
    return { count: 0, date: getTodayString() };
  }
}

function writeUsage(storageKey: string, count: number): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ count, date: getTodayString() }));
  } catch { /* ignore quota errors */ }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface FreeTierUsage {
  used:       number;
  remaining:  number;
  dailyLimit: number;
  canUse:     boolean;
  increment:  () => void;
}

export function useFreeTierUsage(usageKey: string, dailyLimit: number): FreeTierUsage {
  const lsKey = `vet1stop_usage_${usageKey}`;
  const [used, setUsed] = useState(0);

  // Hydrate from localStorage on mount (client-only)
  useEffect(() => {
    if (DEV_UNLOCKED || isPremium()) return;
    const { count } = readUsage(lsKey);
    setUsed(count);
  }, [lsKey]);

  const canUse = DEV_UNLOCKED || isPremium() || used < dailyLimit;
  const remaining = DEV_UNLOCKED || isPremium() ? Infinity : Math.max(0, dailyLimit - used);

  const increment = useCallback(() => {
    if (DEV_UNLOCKED || isPremium()) return;
    const newCount = used + 1;
    writeUsage(lsKey, newCount);
    setUsed(newCount);
  }, [lsKey, used]);

  return { used, remaining, dailyLimit, canUse, increment };
}
