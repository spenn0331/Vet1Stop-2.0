/**
 * Symptom categories for the symptom-based resource finder
 * This file contains the data structure for symptom categories, symptoms, and severity levels
 */

import { SymptomCategory, SeverityLevel } from '../types/HealthResourceTypes';

/**
 * Symptom categories with associated symptoms
 */
export const SYMPTOM_CATEGORIES: SymptomCategory[] = [
  {
    id: 'mental',
    title: 'Mental & Emotional',
    description: 'Feelings, thoughts, and behaviors that affect your wellbeing',
    icon: '🧠',
    color: 'bg-blue-100 text-blue-800',
    symptoms: [
      { id: 'anxiety', label: 'Feeling anxious, worried, or on edge' },
      { id: 'depression', label: 'Feeling down, depressed, or hopeless' },
      { id: 'ptsd', label: 'Flashbacks, nightmares, or intrusive thoughts' },
      { id: 'anger', label: 'Anger, irritability, or aggressive behavior' },
      { id: 'sleep', label: 'Trouble falling or staying asleep' },
      { id: 'substance', label: 'Using alcohol or drugs to cope' },
      { id: 'isolation', label: 'Withdrawing from others or feeling isolated' },
      { id: 'concentration', label: 'Difficulty concentrating or making decisions' }
    ]
  },
  {
    id: 'physical',
    title: 'Physical Health',
    description: 'Body symptoms and physical health concerns',
    icon: '💪',
    color: 'bg-green-100 text-green-800',
    symptoms: [
      { id: 'pain', label: 'Chronic pain or discomfort' },
      { id: 'fatigue', label: 'Feeling tired or having low energy' },
      { id: 'mobility', label: 'Difficulty with movement or mobility' },
      { id: 'headaches', label: 'Frequent headaches or migraines' },
      { id: 'hearing', label: 'Hearing problems or tinnitus (ringing in ears)' },
      { id: 'vision', label: 'Vision problems or eye discomfort' },
      { id: 'breathing', label: 'Breathing difficulties or respiratory issues' },
      { id: 'digestive', label: 'Stomach or digestive problems' }
    ]
  },
  {
    id: 'life',
    title: 'Life & Social',
    description: 'Challenges with daily life, relationships, and social functioning',
    icon: '🏠',
    color: 'bg-yellow-100 text-yellow-800',
    symptoms: [
      { id: 'relationships', label: 'Relationship or family problems' },
      { id: 'work', label: 'Difficulty at work or finding employment' },
      { id: 'housing', label: 'Housing instability or homelessness' },
      { id: 'financial', label: 'Financial stress or problems' },
      { id: 'legal', label: 'Legal issues or concerns' },
      { id: 'transition', label: 'Difficulty transitioning to civilian life' },
      { id: 'purpose', label: 'Feeling a lack of purpose or meaning' },
      { id: 'community', label: 'Feeling disconnected from community' }
    ]
  },
  {
    id: 'crisis',
    title: 'Crisis & Urgent',
    description: 'Immediate concerns that may require urgent attention',
    icon: '⚠️',
    color: 'bg-red-100 text-red-800',
    symptoms: [
      { id: 'suicidal', label: 'Thoughts of harming yourself' },
      { id: 'harm', label: 'Thoughts of harming others' },
      { id: 'emergency', label: 'Medical emergency' },
      { id: 'safety', label: 'Feeling unsafe or in danger' }
    ]
  }
];

/**
 * Severity levels for symptom assessment
 */
export const SEVERITY_LEVELS: SeverityLevel[] = [
  {
    id: 'mild',
    label: 'Mild - Noticeable but manageable',
    description: 'These symptoms are present but don\'t significantly impact your daily life'
  },
  {
    id: 'moderate',
    label: 'Moderate - Affecting daily activities',
    description: 'These symptoms make some daily activities more difficult'
  },
  {
    id: 'severe',
    label: 'Severe - Significantly disrupting life',
    description: 'These symptoms make it hard to function normally in important areas of life'
  },
  {
    id: 'crisis',
    label: 'Crisis - Need immediate help',
    description: 'These symptoms require immediate attention and support'
  }
];
