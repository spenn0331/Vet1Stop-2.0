// @ts-nocheck
/**
 * index.ts — Strike 5 Resource Intelligence Engine
 *
 * Single import point for all resource intelligence functionality.
 * Usage: import { extractKeywords, parseUserProfile, fetchDomainResources, ... }
 *        from '@/lib/resource-intelligence';
 */

export * from './types';
export * from './domain-configs';
export * from './keyword-extractor';
export * from './profile-parser';
export * from './resource-fetcher';
export * from './resource-scorer';
export { getKeywordTagMap, clearKeywordMapCache, FALLBACK_MAP } from './keyword-map-loader';
