"use client";

import { useCallback, useEffect, useState } from 'react';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

// Test variant type
export type TestVariant = 'A' | 'B';

// Test definition interface
export interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: {
    A: {
      name: string;
      description: string;
    };
    B: {
      name: string;
      description: string;
    };
  };
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  trafficAllocation: number; // Percentage of users to include in test (0-100)
  metrics: string[]; // Metrics to track for this test
}

// Test result interface
export interface ABTestResult {
  testId: string;
  variant: TestVariant;
  impressions: number;
  conversions: number;
  conversionRate: number;
  metrics: Record<string, {
    count: number;
    value: number;
    average: number;
  }>;
}

/**
 * Custom hook for A/B testing
 * Manages test assignment, tracking, and reporting
 */
export function useABTesting(userId?: string) {
  const [activeTests, setActiveTests] = useState<ABTest[]>([]);
  const [assignedVariants, setAssignedVariants] = useState<Record<string, TestVariant>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load active tests
  useEffect(() => {
    const loadActiveTests = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // In a real implementation, this would fetch from Firestore
        // For now, we'll use a hardcoded list of tests
        const tests: ABTest[] = [
          {
            id: 'symptom-finder-layout',
            name: 'Symptom Finder Layout Test',
            description: 'Testing different layouts for the symptom-based resource finder',
            variants: {
              A: {
                name: 'Wizard',
                description: 'Step-by-step wizard layout'
              },
              B: {
                name: 'Single Page',
                description: 'All options on a single page with collapsible sections'
              }
            },
            startDate: new Date('2025-05-01'),
            isActive: true,
            trafficAllocation: 50, // 50% of users
            metrics: ['completion_rate', 'time_to_complete', 'resource_clicks']
          },
          {
            id: 'resource-card-design',
            name: 'Resource Card Design Test',
            description: 'Testing different designs for resource cards',
            variants: {
              A: {
                name: 'Compact',
                description: 'Compact card design with minimal information'
              },
              B: {
                name: 'Detailed',
                description: 'Detailed card design with more information and actions'
              }
            },
            startDate: new Date('2025-05-01'),
            isActive: true,
            trafficAllocation: 100, // 100% of users
            metrics: ['click_through_rate', 'save_rate', 'feedback_rate']
          }
        ];
        
        setActiveTests(tests);
        
        // Assign variants for active tests
        const variants: Record<string, TestVariant> = {};
        
        for (const test of tests) {
          if (test.isActive) {
            // Check if user is included in test based on traffic allocation
            const isIncluded = Math.random() * 100 < test.trafficAllocation;
            
            if (isIncluded) {
              // Assign variant (50/50 split)
              variants[test.id] = Math.random() < 0.5 ? 'A' : 'B';
              
              // Log test assignment
              if (typeof window !== 'undefined') {
                const analytics = getAnalytics();
                logEvent(analytics, 'ab_test_assignment', {
                  test_id: test.id,
                  variant: variants[test.id],
                  user_id: userId || 'anonymous'
                });
              }
              
              // Store assignment in Firestore if user is authenticated
              if (userId) {
                await setDoc(doc(db, 'abTestAssignments', `${userId}_${test.id}`), {
                  userId,
                  testId: test.id,
                  variant: variants[test.id],
                  assignedAt: serverTimestamp()
                });
                
                // Increment impression count for this variant
                await updateDoc(doc(db, 'abTestResults', test.id), {
                  [`variants.${variants[test.id]}.impressions`]: increment(1)
                });
              }
            }
          }
        }
        
        setAssignedVariants(variants);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading A/B tests:', error);
        setError('Failed to load A/B tests');
        setIsLoading(false);
      }
    };
    
    loadActiveTests();
  }, [userId]);

  // Get assigned variant for a test
  const getVariant = useCallback((testId: string): TestVariant | null => {
    return assignedVariants[testId] || null;
  }, [assignedVariants]);

  // Track conversion for a test
  const trackConversion = useCallback(async (testId: string, metrics?: Record<string, number>) => {
    try {
      const variant = assignedVariants[testId];
      
      if (!variant) {
        console.warn(`User is not assigned to test ${testId}`);
        return;
      }
      
      // Log conversion
      if (typeof window !== 'undefined') {
        const analytics = getAnalytics();
        logEvent(analytics, 'ab_test_conversion', {
          test_id: testId,
          variant,
          user_id: userId || 'anonymous',
          ...metrics
        });
      }
      
      // Update conversion count in Firestore
      await updateDoc(doc(db, 'abTestResults', testId), {
        [`variants.${variant}.conversions`]: increment(1)
      });
      
      // Update metrics if provided
      if (metrics) {
        for (const [metric, value] of Object.entries(metrics)) {
          await updateDoc(doc(db, 'abTestResults', testId), {
            [`variants.${variant}.metrics.${metric}.count`]: increment(1),
            [`variants.${variant}.metrics.${metric}.value`]: increment(value)
          });
        }
      }
    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  }, [assignedVariants, userId]);

  // Track metric for a test
  const trackMetric = useCallback(async (testId: string, metric: string, value: number) => {
    try {
      const variant = assignedVariants[testId];
      
      if (!variant) {
        console.warn(`User is not assigned to test ${testId}`);
        return;
      }
      
      // Log metric
      if (typeof window !== 'undefined') {
        const analytics = getAnalytics();
        logEvent(analytics, 'ab_test_metric', {
          test_id: testId,
          variant,
          metric,
          value,
          user_id: userId || 'anonymous'
        });
      }
      
      // Update metric in Firestore
      await updateDoc(doc(db, 'abTestResults', testId), {
        [`variants.${variant}.metrics.${metric}.count`]: increment(1),
        [`variants.${variant}.metrics.${metric}.value`]: increment(value)
      });
    } catch (error) {
      console.error('Error tracking metric:', error);
    }
  }, [assignedVariants, userId]);

  // Get test results
  const getTestResults = useCallback(async (testId: string): Promise<ABTestResult | null> => {
    try {
      const resultsDoc = await getDoc(doc(db, 'abTestResults', testId));
      
      if (resultsDoc.exists()) {
        const data = resultsDoc.data();
        
        const variantA = data.variants.A;
        const variantB = data.variants.B;
        
        const conversionRateA = variantA.impressions > 0 
          ? variantA.conversions / variantA.impressions 
          : 0;
        
        const conversionRateB = variantB.impressions > 0 
          ? variantB.conversions / variantB.impressions 
          : 0;
        
        // Determine winning variant
        const winner: TestVariant = conversionRateA > conversionRateB ? 'A' : 'B';
        
        return {
          testId,
          variant: winner,
          impressions: variantA.impressions + variantB.impressions,
          conversions: variantA.conversions + variantB.conversions,
          conversionRate: (variantA.conversions + variantB.conversions) / (variantA.impressions + variantB.impressions),
          metrics: {
            ...Object.entries(variantA.metrics || {}).reduce((acc, [key, value]) => {
              acc[key] = {
                count: value.count + (variantB.metrics?.[key]?.count || 0),
                value: value.value + (variantB.metrics?.[key]?.value || 0),
                average: (value.value + (variantB.metrics?.[key]?.value || 0)) / (value.count + (variantB.metrics?.[key]?.count || 0))
              };
              return acc;
            }, {} as Record<string, { count: number; value: number; average: number }>)
          }
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting test results:', error);
      return null;
    }
  }, []);

  return {
    activeTests,
    assignedVariants,
    isLoading,
    error,
    getVariant,
    trackConversion,
    trackMetric,
    getTestResults
  };
}
