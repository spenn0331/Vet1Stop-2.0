"use client";

/**
 * ResourcePathwaysSection.tsx
 * Thin wrapper that renders MissionHub (Mission Briefings).
 * missions.ts is now the single source of truth for all pathway/mission data.
 * The old PathwaySelector / PathwayContext system has been superseded.
 */

import React from 'react';
import MissionHub from './MissionHub';

interface ResourcePathwaysSectionProps {
  className?: string;
}

export default function ResourcePathwaysSection({
  className = '',
}: ResourcePathwaysSectionProps) {
  return (
    <div className={className}>
      <MissionHub />
    </div>
  );
}
