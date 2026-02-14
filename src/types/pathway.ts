/**
 * Resource Pathways Data Models
 * Defines the structure for guided veteran healthcare journeys
 */

export interface Pathway {
  id: string;
  title: string;
  description: string;
  targetAudience: string[];
  icon?: string;
  steps: PathwayStep[];
  tags: string[];
  recommendedFor?: string[];
  estimatedDuration?: number; // In minutes
  difficulty?: 'easy' | 'medium' | 'hard';
  createdAt?: Date | string;
  updatedAt?: Date | string;
  featured?: boolean;
}

/**
 * Interface for a related resource in a pathway step
 */
export interface RelatedResource {
  id: string;
  title: string;
  description: string;
  relevanceScore?: number;
}

export interface PathwayStep {
  id: string;
  title: string;
  description: string;
  resourceIds: string[];
  content?: string;
  nextStepId?: string;
  nextStepOptions?: PathwayDecision;
  estimatedTimeMinutes?: number;
  completed?: boolean;
  order: number;
  // Enhanced properties
  detailedContent?: string;
  relatedResources?: RelatedResource[];
  requirements?: string[];
}

export interface PathwayDecision {
  id: string;
  question: string;
  options: PathwayDecisionOption[];
}

export interface PathwayDecisionOption {
  id: string;
  text: string;
  nextStepId: string;
}

export interface UserPathwayProgress {
  userId: string;
  pathwayId: string;
  currentStepId: string;
  completedSteps: string[];
  startedAt: Date | string;
  lastUpdatedAt: Date | string;
  completed: boolean;
  completedAt?: Date | string;
  notes?: string;
  decisions?: Record<string, string>; // Map of decisionId to selected optionId
}

// Context to manage pathway state
export interface PathwayContextType {
  activePath: Pathway | null;
  currentStep: PathwayStep | null;
  isLoading: boolean;
  error: Error | null;
  progress: UserPathwayProgress | null;
  startPathway: (pathwayId: string) => Promise<void>;
  goToStep: (stepId: string) => void;
  completeStep: (stepId: string) => Promise<void>;
  makeDecision: (decisionId: string, optionId: string) => void;
  resetPathway: () => void;
}
