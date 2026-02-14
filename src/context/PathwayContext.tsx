'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Pathway, PathwayStep, PathwayContextType, UserPathwayProgress } from '@/types/pathway';
// Import from our custom hook that provides auth functionality
import useAuth from '@/hooks/useAuth';
import CacheManager from '@/utils/cache-manager';
import { getPathwayById, getPathwayProgress, savePathwayProgress } from '@/services/pathway-service';

// Default context value
const defaultContextValue: PathwayContextType = {
  activePath: null,
  currentStep: null,
  isLoading: false,
  error: null,
  progress: null,
  startPathway: async () => {},
  goToStep: () => {},
  completeStep: async () => {},
  makeDecision: () => {},
  resetPathway: () => {},
};

// Create the context
const PathwayContext = createContext<PathwayContextType>(defaultContextValue);

// Hook to use the pathway context
export const usePathway = () => useContext(PathwayContext);

// Provider component
export const PathwayProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activePath, setActivePath] = useState<Pathway | null>(null);
  const [currentStep, setCurrentStep] = useState<PathwayStep | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState<UserPathwayProgress | null>(null);

  // Load pathway by ID
  const startPathway = useCallback(async (pathwayId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check cache first
      const cachedPathway = await CacheManager.get<Pathway>(`pathway_${pathwayId}`);
      
      if (cachedPathway) {
        setActivePath(cachedPathway);
        
        // Set first step as current step if no progress exists
        if (cachedPathway.steps && cachedPathway.steps.length > 0) {
          const firstStep = cachedPathway.steps.find(step => step.order === 1) || 
                          cachedPathway.steps[0];
          setCurrentStep(firstStep);
        }
        
        // Load progress for logged-in users
        if (user) {
          await loadProgress(pathwayId);
        }
        
        setIsLoading(false);
        return;
      }
      
      // If not in cache, fetch using our service (with fallback)
      const pathway = await getPathwayById(pathwayId);
      
      if (!pathway) {
        throw new Error('Failed to load pathway');
      }
      
      // Store in cache for 30 minutes
      await CacheManager.set<Pathway>(`pathway_${pathwayId}`, pathway, {
        expiresIn: 1000 * 60 * 30,
      });
      
      setActivePath(pathway);
      
      // Set first step as current step
      if (pathway.steps && pathway.steps.length > 0) {
        const firstStep = pathway.steps.find(step => step.order === 1) || pathway.steps[0];
        setCurrentStep(firstStep);
      }
      
      // Load progress (will use localStorage fallback if API fails)
      await loadProgress(pathwayId);
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      console.error('Error loading pathway:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load user progress with fallback support
  const loadProgress = useCallback(async (pathwayId: string) => {
    try {
      // Use our service to get progress (includes localStorage fallback)
      const pathwayProgress = await getPathwayProgress(pathwayId);
      
      if (pathwayProgress) {
        setProgress(pathwayProgress);
        
        // Set current step based on progress
        if (activePath && pathwayProgress.currentStepId) {
          const currentStepFromProgress = activePath.steps.find(
            step => step.id === pathwayProgress.currentStepId
          );
          
          if (currentStepFromProgress) {
            setCurrentStep(currentStepFromProgress);
          }
        }
      } else {
        // Create new progress entry if none exists
        if (activePath && currentStep) {
          const newProgress: Partial<UserPathwayProgress> = {
            pathwayId,
            currentStepId: currentStep.id,
            completedSteps: [],
            completed: false,
          };
          
          await saveProgress(newProgress);
        }
      }
    } catch (err) {
      console.error('Error loading progress:', err);
    }
  }, [activePath, currentStep]);

  // Save user progress with fallback support
  const saveProgress = useCallback(async (progressData: Partial<UserPathwayProgress>) => {
    try {
      // Use our service to save progress (includes localStorage fallback)
      const savedProgress = await savePathwayProgress(progressData);
      setProgress(savedProgress);
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  }, []);

  // Navigate to a specific step
  const goToStep = useCallback((stepId: string) => {
    if (!activePath) return;
    
    const step = activePath.steps.find(s => s.id === stepId);
    
    if (step) {
      setCurrentStep(step);
      
      // Update progress for logged-in users
      if (user && progress) {
        saveProgress({
          ...progress,
          pathwayId: activePath.id,
          currentStepId: stepId,
        });
      }
    }
  }, [activePath, user, progress, saveProgress]);

  // Mark a step as completed
  const completeStep = useCallback(async (stepId: string) => {
    if (!activePath || !currentStep) return;
    
    // Find the current step and mark it as completed
    const updatedSteps = activePath.steps.map(step => {
      if (step.id === stepId) {
        return { ...step, completed: true };
      }
      return step;
    });
    
    // Update the active pathway
    setActivePath({
      ...activePath,
      steps: updatedSteps,
    });
    
    // Find the next step
    let nextStep: PathwayStep | null = null;
    
    // If there's a direct next step
    if (currentStep.nextStepId) {
      nextStep = activePath.steps.find(step => step.id === currentStep.nextStepId) || null;
    } else {
      // Otherwise, go to the next step by order
      const currentOrder = currentStep.order;
      nextStep = activePath.steps.find(step => step.order === currentOrder + 1) || null;
    }
    
    // Update the current step
    if (nextStep) {
      setCurrentStep(nextStep);
    }
    
    // Update progress for logged-in users
    if (user && progress) {
      const completedSteps = [...progress.completedSteps, stepId];
      
      // Check if all steps are completed
      const allStepsCompleted = activePath.steps.every(
        step => completedSteps.includes(step.id)
      );
      
      await saveProgress({
        ...progress,
        pathwayId: activePath.id,
        currentStepId: nextStep ? nextStep.id : currentStep.id,
        completedSteps,
        completed: allStepsCompleted,
      });
    }
  }, [activePath, currentStep, user, progress, saveProgress]);

  // Handle decision points
  const makeDecision = useCallback((decisionId: string, optionId: string) => {
    if (!activePath || !currentStep || !currentStep.nextStepOptions) return;
    
    // Find the selected option
    const decision = currentStep.nextStepOptions;
    const selectedOption = decision.options.find(option => option.id === optionId);
    
    if (selectedOption) {
      // Go to the next step based on the decision
      goToStep(selectedOption.nextStepId);
      
      // Save the decision in progress
      if (user && progress) {
        const decisions = {
          ...(progress.decisions || {}),
          [decisionId]: optionId,
        };
        
        saveProgress({
          ...progress,
          decisions,
        });
      }
    }
  }, [activePath, currentStep, user, progress, goToStep, saveProgress]);

  // Reset the pathway
  const resetPathway = useCallback(() => {
    if (!activePath) return;
    
    // Find the first step
    const firstStep = activePath.steps.find(step => step.order === 1) || activePath.steps[0];
    
    // Reset the current step
    setCurrentStep(firstStep);
    
    // Reset progress for logged-in users
    if (user && progress) {
      saveProgress({
        pathwayId: activePath.id,
        currentStepId: firstStep.id,
        completedSteps: [],
        completed: false,
      });
    }
  }, [activePath, user, progress, saveProgress]);

  const contextValue: PathwayContextType = {
    activePath,
    currentStep,
    isLoading,
    error,
    progress,
    startPathway,
    goToStep,
    completeStep,
    makeDecision,
    resetPathway,
  };

  return (
    <PathwayContext.Provider value={contextValue}>
      {children}
    </PathwayContext.Provider>
  );
};
