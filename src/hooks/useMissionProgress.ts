'use client';

/**
 * useMissionProgress.ts
 * localStorage-backed progress tracking for Mission Briefings.
 * Key: vet1stop_mission_progress
 * Shape: Record<missionId, { currentStepIdx: number; completedSteps: string[] }>
 * No auth dependency — works for all users.
 */

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'vet1stop_mission_progress';

interface MissionProgressEntry {
  currentStepIdx: number;
  completedSteps: string[];
}

type ProgressMap = Record<string, MissionProgressEntry>;

function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(map: ProgressMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch { /* non-fatal */ }
}

export interface UseMissionProgressReturn {
  getProgress: (missionId: string) => MissionProgressEntry;
  markStepComplete: (missionId: string, stepId: string, totalSteps: number) => void;
  setCurrentStep: (missionId: string, stepIdx: number) => void;
  resetMission: (missionId: string) => void;
  isStepComplete: (missionId: string, stepId: string) => boolean;
  hasStarted: (missionId: string) => boolean;
  allProgress: ProgressMap;
}

export default function useMissionProgress(): UseMissionProgressReturn {
  const [allProgress, setAllProgress] = useState<ProgressMap>({});

  useEffect(() => {
    setAllProgress(loadProgress());
  }, []);

  const persist = useCallback((updated: ProgressMap) => {
    setAllProgress(updated);
    saveProgress(updated);
  }, []);

  const getProgress = useCallback((missionId: string): MissionProgressEntry => {
    return allProgress[missionId] ?? { currentStepIdx: 0, completedSteps: [] };
  }, [allProgress]);

  const markStepComplete = useCallback((missionId: string, stepId: string, totalSteps: number) => {
    const current = allProgress[missionId] ?? { currentStepIdx: 0, completedSteps: [] };
    const completedSteps = current.completedSteps.includes(stepId)
      ? current.completedSteps
      : [...current.completedSteps, stepId];
    const nextIdx = Math.min(current.currentStepIdx + 1, totalSteps - 1);
    persist({ ...allProgress, [missionId]: { currentStepIdx: nextIdx, completedSteps } });
  }, [allProgress, persist]);

  const setCurrentStep = useCallback((missionId: string, stepIdx: number) => {
    const current = allProgress[missionId] ?? { currentStepIdx: 0, completedSteps: [] };
    persist({ ...allProgress, [missionId]: { ...current, currentStepIdx: stepIdx } });
  }, [allProgress, persist]);

  const resetMission = useCallback((missionId: string) => {
    const updated = { ...allProgress };
    delete updated[missionId];
    persist(updated);
  }, [allProgress, persist]);

  const isStepComplete = useCallback((missionId: string, stepId: string): boolean => {
    return allProgress[missionId]?.completedSteps.includes(stepId) ?? false;
  }, [allProgress]);

  const hasStarted = useCallback((missionId: string): boolean => {
    const p = allProgress[missionId];
    return !!p && (p.currentStepIdx > 0 || p.completedSteps.length > 0);
  }, [allProgress]);

  return { getProgress, markStepComplete, setCurrentStep, resetMission, isStepComplete, hasStarted, allProgress };
}
