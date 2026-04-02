// @ts-nocheck
/**
 * keyword-extractor.ts — Strike 5
 *
 * Domain-agnostic keyword extraction for resource matching.
 * Moved + generalized from symptom-triage/route.ts (Strike 4A).
 *
 * Extraction phases:
 *   1. Compound phrases from config.knownPhrases (highest signal)
 *   2. Single health-signal words from config.signalWords
 *   3. Novel meaningful words (fallback, >4 chars, not noise)
 */

import type { DomainConfig } from './types';
import { HEALTH_CONFIG } from './domain-configs';

// ─── Shared noise word set (common false-match triggers) ─────────────────────

export const KEYWORD_NOISE = new Set([
  'i', 'me', 'my', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
  'for', 'of', 'with', 'have', 'has', 'is', 'are', 'was', 'be', 'been', 'do',
  'does', 'did', 'not', 'no', 'yes', 'its', 'it', 'this', 'that', 'what', 'how',
  'about', 'any', 'some', 'get', 'can', 'will', 'would', 'could', 'should', 'just',
  'also', 'your', 'you', 'we', 'they', 'he', 'she', 'very', 'more', 'want',
  'need', 'help', 'find', 'know', 'tell', 'here', 'there', 'when', 'where', 'which',
  // Noise that causes false DB matches
  'service', 'services', 'stuff', 'things', 'shape', 'leaving', 'started',
  'already', 'currently', 'affect', 'aspects', 'bother', 'since', 'like',
  'aches', 'pains', 'active', 'claim', 'past', 'satisfied', 'aspiring',
  'from', 'then', 'them', 'their', 'been', 'both', 'such', 'into', 'over',
]);

/**
 * Extracts meaningful keywords/phrases from user input text.
 * Pass a domain config to use domain-specific phrase lists and signal words.
 * Defaults to HEALTH_CONFIG if no config provided.
 */
export function extractKeywords(text: string, config: DomainConfig = HEALTH_CONFIG): string[] {
  const lower = text.toLowerCase().replace(/[^a-z0-9\s'-]/g, ' ');
  const found: string[] = [];
  const noiseWords = config.noiseWords ?? KEYWORD_NOISE;

  // Phase 1: Compound phrases (highest signal — matched as substrings)
  for (const phrase of config.knownPhrases) {
    if (lower.includes(phrase)) found.push(phrase);
  }

  // Phase 2: Single domain-signal words
  const words = lower.split(/\s+/);
  for (const word of words) {
    if (config.signalWords.has(word) && !found.some(f => f.includes(word))) {
      found.push(word);
    }
  }

  // Phase 3: Meaningful remaining words (fallback for novel terms)
  for (const word of words) {
    if (word.length > 4 && !noiseWords.has(word) && !found.some(f => f.includes(word))) {
      found.push(word);
    }
  }

  return Array.from(new Set(found)).slice(0, 15);
}
