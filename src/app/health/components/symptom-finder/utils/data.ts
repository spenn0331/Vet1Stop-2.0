/**
 * Data for the symptom-based resource finder
 */

import { SymptomCategory, SeverityLevel } from './types';

/**
 * Symptom categories for the symptom-based resource finder
 */
export const SYMPTOM_CATEGORIES: SymptomCategory[] = [
  {
    id: 'mental',
    title: 'Mental Health',
    description: 'Anxiety, depression, PTSD, stress, sleep issues, and other mental health concerns',
    icon: '🧠',
    color: 'blue',
    symptoms: [
      { id: 'anxiety', label: 'Anxiety' },
      { id: 'depression', label: 'Depression' },
      { id: 'ptsd', label: 'PTSD' },
      { id: 'stress', label: 'Stress' },
      { id: 'sleep', label: 'Sleep Issues' },
      { id: 'anger', label: 'Anger' },
      { id: 'substance', label: 'Substance Use' },
      { id: 'grief', label: 'Grief' },
      { id: 'isolation', label: 'Isolation/Loneliness' },
      { id: 'suicidal', label: 'Suicidal Thoughts' }
    ]
  },
  {
    id: 'physical',
    title: 'Physical Health',
    description: 'Pain, mobility issues, chronic conditions, and other physical health concerns',
    icon: '🏥',
    color: 'green',
    symptoms: [
      { id: 'pain', label: 'Chronic Pain' },
      { id: 'mobility', label: 'Mobility Issues' },
      { id: 'tbi', label: 'TBI/Head Injury' },
      { id: 'hearing', label: 'Hearing Loss' },
      { id: 'vision', label: 'Vision Problems' },
      { id: 'fatigue', label: 'Fatigue' },
      { id: 'balance', label: 'Balance/Coordination' },
      { id: 'respiratory', label: 'Respiratory Issues' },
      { id: 'diabetes', label: 'Diabetes' },
      { id: 'weight', label: 'Weight Management' }
    ]
  },
  {
    id: 'life',
    title: 'Life & Wellness',
    description: 'Family issues, finances, employment, housing, and other life concerns',
    icon: '🏠',
    color: 'purple',
    symptoms: [
      { id: 'family', label: 'Family Issues' },
      { id: 'finances', label: 'Financial Stress' },
      { id: 'employment', label: 'Employment Challenges' },
      { id: 'housing', label: 'Housing Concerns' },
      { id: 'legal', label: 'Legal Problems' },
      { id: 'transition', label: 'Military-to-Civilian Transition' },
      { id: 'education', label: 'Education/Training Needs' },
      { id: 'relationships', label: 'Relationship Difficulties' },
      { id: 'parenting', label: 'Parenting Challenges' },
      { id: 'caregiving', label: 'Caregiving Responsibilities' }
    ]
  },
  {
    id: 'crisis',
    title: 'Crisis Support',
    description: 'Immediate help for urgent situations like suicidal thoughts, homelessness, or abuse',
    icon: '🆘',
    color: 'red',
    symptoms: [
      { id: 'suicidal', label: 'Suicidal Thoughts' },
      { id: 'homelessness', label: 'Homelessness' },
      { id: 'abuse', label: 'Domestic Violence/Abuse' },
      { id: 'assault', label: 'Sexual Assault' },
      { id: 'addiction', label: 'Addiction Crisis' },
      { id: 'emergency', label: 'Medical Emergency' },
      { id: 'disaster', label: 'Natural Disaster' },
      { id: 'financial', label: 'Financial Emergency' },
      { id: 'safety', label: 'Personal Safety Concerns' },
      { id: 'other', label: 'Other Crisis' }
    ]
  }
];

/**
 * Severity levels for the symptom-based resource finder
 */
export const SEVERITY_LEVELS: SeverityLevel[] = [
  {
    id: 'mild',
    label: 'Mild',
    description: 'Noticeable but manageable; doesn\'t significantly impact daily life'
  },
  {
    id: 'moderate',
    label: 'Moderate',
    description: 'Affects daily activities; causes regular discomfort or concern'
  },
  {
    id: 'severe',
    label: 'Severe',
    description: 'Significantly impacts quality of life; makes daily activities difficult'
  },
  {
    id: 'crisis',
    label: 'Crisis',
    description: 'Immediate help needed; unable to function or safety concerns'
  }
];

/**
 * Mapping from symptom categories to resource categories
 * Used for filtering resources based on selected symptom category
 */
export const CATEGORY_MAPPING: Record<string, string[]> = {
  'mental': ['Mental Health', 'Crisis Services', 'Family Support'],
  'physical': ['Physical Health', 'Specialized Care', 'Rehabilitation'],
  'life': ['Family Support', 'Wellness Programs', 'Specialized Care'],
  'crisis': ['Crisis Services', 'Mental Health', 'Emergency Services']
};
