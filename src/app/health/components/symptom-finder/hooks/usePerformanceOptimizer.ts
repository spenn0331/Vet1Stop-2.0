"use client";

import { useCallback, useEffect, useState, useRef } from 'react';

/**
 * Performance metrics for tracking various timing measurements
 */
interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  resourceMatchTime: number;
  totalTime: number;
}

/**
 * Configuration options for the performance optimizer
 */
interface PerformanceOptimizerOptions {
  enableCaching?: boolean;
  enableLazyLoading?: boolean;
  enableDebounce?: boolean;
  debounceTime?: number;
  cacheTTL?: number; // Time to live in milliseconds
}

/**
 * Cache item structure for storing cached data with timestamp
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

/**
 * Custom hook for optimizing performance of the symptom-based resource finder
 * Provides performance monitoring, caching, and optimization techniques
 */
export function usePerformanceOptimizer(options: PerformanceOptimizerOptions = {}) {
  // Default options with fallbacks
  const {
    enableCaching = true,
    enableLazyLoading = true,
    enableDebounce = true,
    debounceTime = 300,
    cacheTTL = 1000 * 60 * 5 // 5 minutes
  } = options;
  
  // Performance metrics state
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    interactionTime: 0,
    resourceMatchTime: 0,
    totalTime: 0
  });
  
  // Cache for resource matching
  const [cache, setCache] = useState<Record<string, CacheItem<any>>>({});
  
  // Debounce timer reference
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Timing references for performance measurement
  const startTime = useRef<number>(0);
  const loadStartTime = useRef<number>(0);
  const renderStartTime = useRef<number>(0);
  const interactionStartTime = useRef<number>(0);
  const resourceMatchStartTime = useRef<number>(0);
  
  // Initialize performance measurement
  useEffect(() => {
    startTime.current = performance.now();
    loadStartTime.current = performance.now();
    
    // Measure initial load time
    const handleLoad = () => {
      const loadTime = performance.now() - loadStartTime.current;
      setMetrics(prev => ({ ...prev, loadTime }));
    };
    
    window.addEventListener('load', handleLoad);
    
    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);
  
  // Start render time measurement
  const startRenderMeasurement = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);
  
  // End render time measurement
  const endRenderMeasurement = useCallback(() => {
    const renderTime = performance.now() - renderStartTime.current;
    setMetrics(prev => ({ ...prev, renderTime }));
  }, []);
  
  // Start interaction time measurement
  const startInteractionMeasurement = useCallback(() => {
    interactionStartTime.current = performance.now();
  }, []);
  
  // End interaction time measurement
  const endInteractionMeasurement = useCallback(() => {
    const interactionTime = performance.now() - interactionStartTime.current;
    setMetrics(prev => ({ ...prev, interactionTime }));
  }, []);
  
  // Start resource match time measurement
  const startResourceMatchMeasurement = useCallback(() => {
    resourceMatchStartTime.current = performance.now();
  }, []);
  
  // End resource match time measurement
  const endResourceMatchMeasurement = useCallback(() => {
    const resourceMatchTime = performance.now() - resourceMatchStartTime.current;
    setMetrics(prev => ({ ...prev, resourceMatchTime }));
    
    // Update total time
    const totalTime = performance.now() - startTime.current;
    setMetrics(prev => ({ ...prev, totalTime }));
  }, []);
  
  // Cache resource matching results
  const cacheResult = useCallback(<T,>(key: string, data: T) => {
    if (!enableCaching) return;
    
    setCache(prev => ({
      ...prev,
      [key]: {
        data,
        timestamp: Date.now()
      }
    }));
  }, [enableCaching]);
  
  // Get cached result
  const getCachedResult = useCallback(<T,>(key: string): T | null => {
    if (!enableCaching) return null;
    
    const cachedItem = cache[key] as CacheItem<T> | undefined;
    
    if (!cachedItem) return null;
    
    // Check if cache is expired
    if (Date.now() - cachedItem.timestamp > cacheTTL) {
      // Remove expired cache
      setCache(prev => {
        const newCache = { ...prev };
        delete newCache[key];
        return newCache;
      });
      return null;
    }
    
    return cachedItem.data;
  }, [cache, enableCaching, cacheTTL]);
  
  // Debounce function
  type AnyFunction = (...args: any[]) => any;
  
  const debounce = useCallback(<T extends AnyFunction>(func: T, wait: number = debounceTime) => {
    return (...args: Parameters<T>): void => {
      if (!enableDebounce) {
        func(...args);
        return;
      }
      
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      
      debounceTimer.current = setTimeout(() => {
        func(...args);
      }, wait);
    };
  }, [enableDebounce, debounceTime]);
  
  // Create a simplified performance measurement function
  // We're removing the lazy component creation to avoid JSX syntax issues
  const measurePerformance = useCallback(<T extends (...args: any[]) => any>(
    func: T
  ) => {
    return (...args: Parameters<T>): ReturnType<T> => {
      // Start measurement
      const startTime = performance.now();
      
      // Execute function
      const result = func(...args);
      
      // End measurement
      const endTime = performance.now();
      console.log(`Function execution time: ${endTime - startTime}ms`);
      
      return result;
    };
  }, []);
  
  // Get performance report
  const getPerformanceReport = useCallback(() => {
    return {
      ...metrics,
      cacheSize: Object.keys(cache).length,
      cacheKeys: Object.keys(cache),
      cachingEnabled: enableCaching,
      lazyLoadingEnabled: enableLazyLoading,
      debounceEnabled: enableDebounce,
      debounceTime,
      cacheTTL,
      timestamp: new Date().toISOString()
    };
  }, [metrics, cache, enableCaching, enableLazyLoading, enableDebounce, debounceTime, cacheTTL]);
  
  return {
    metrics,
    startRenderMeasurement,
    endRenderMeasurement,
    startInteractionMeasurement,
    endInteractionMeasurement,
    startResourceMatchMeasurement,
    endResourceMatchMeasurement,
    cacheResult,
    getCachedResult,
    debounce,
    measurePerformance,
    getPerformanceReport
  };
}
