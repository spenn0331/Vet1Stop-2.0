/**
 * Accessibility Service
 * 
 * This service enhances AI responses for screen readers and assistive technologies,
 * ensuring veterans with disabilities can effectively use the Vet1Stop AI.
 */

/**
 * Accessibility enhancement options
 */
interface AccessibilityOptions {
  optimizeForScreenReader: boolean;
  addPhoneticSpelling: boolean;
  addAbbreviationExpansions: boolean;
  simplifyLanguage: boolean;
  addKeyboardShortcuts: boolean;
  highContrast: boolean;
}

/**
 * Default accessibility options
 */
const DEFAULT_OPTIONS: AccessibilityOptions = {
  optimizeForScreenReader: true,
  addPhoneticSpelling: false,
  addAbbreviationExpansions: true,
  simplifyLanguage: false,
  addKeyboardShortcuts: false,
  highContrast: false
};

/**
 * Common military abbreviations and their expansions
 */
const MILITARY_ABBREVIATIONS: Record<string, string> = {
  'VA': 'Veterans Affairs',
  'PTSD': 'Post-Traumatic Stress Disorder',
  'TBI': 'Traumatic Brain Injury',
  'MST': 'Military Sexual Trauma',
  'DOD': 'Department of Defense',
  'VSO': 'Veterans Service Organization',
  'VFW': 'Veterans of Foreign Wars',
  'DAV': 'Disabled American Veterans',
  'VBA': 'Veterans Benefits Administration',
  'VHA': 'Veterans Health Administration',
  'MOS': 'Military Occupational Specialty',
  'PCS': 'Permanent Change of Station',
  'ETS': 'Expiration Term of Service',
  'DD214': 'Certificate of Release or Discharge from Active Duty',
  'BAH': 'Basic Allowance for Housing',
  'BAS': 'Basic Allowance for Subsistence',
  'SGLI': 'Servicemembers Group Life Insurance',
  'TAP': 'Transition Assistance Program',
  'GI Bill': 'Government Issue Bill (Education Benefits)',
  'C&P': 'Compensation and Pension',
  'MEB': 'Medical Evaluation Board',
  'PEB': 'Physical Evaluation Board'
};

/**
 * Keyboard shortcuts for navigation
 */
const KEYBOARD_SHORTCUTS: Record<string, string> = {
  'Home Page': 'Alt+H',
  'Health Resources': 'Alt+1',
  'Education Resources': 'Alt+2',
  'Life & Leisure': 'Alt+3',
  'Careers': 'Alt+4',
  'Local Resources': 'Alt+5',
  'Shop': 'Alt+6',
  'Social': 'Alt+7',
  'Search': '/',
  'Crisis Support': 'Alt+0',
  'Profile': 'Alt+P',
  'Settings': 'Alt+S'
};

/**
 * Enhance AI response for accessibility
 */
export function enhanceForAccessibility(
  response: string,
  options: Partial<AccessibilityOptions> = {}
): string {
  // Merge with default options
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  let enhancedResponse = response;
  
  // Optimize for screen readers
  if (mergedOptions.optimizeForScreenReader) {
    enhancedResponse = optimizeForScreenReader(enhancedResponse);
  }
  
  // Add abbreviation expansions
  if (mergedOptions.addAbbreviationExpansions) {
    enhancedResponse = expandAbbreviations(enhancedResponse);
  }
  
  // Add phonetic spelling for complex terms
  if (mergedOptions.addPhoneticSpelling) {
    enhancedResponse = addPhoneticSpelling(enhancedResponse);
  }
  
  // Simplify language
  if (mergedOptions.simplifyLanguage) {
    enhancedResponse = simplifyLanguage(enhancedResponse);
  }
  
  // Add keyboard shortcuts
  if (mergedOptions.addKeyboardShortcuts) {
    enhancedResponse = addKeyboardShortcuts(enhancedResponse);
  }
  
  // Format for high contrast
  if (mergedOptions.highContrast) {
    enhancedResponse = formatForHighContrast(enhancedResponse);
  }
  
  return enhancedResponse;
}

/**
 * Optimize response for screen readers
 */
function optimizeForScreenReader(response: string): string {
  let optimized = response;
  
  // Replace emoji with text descriptions
  optimized = optimized.replace(/👉/g, '[pointing finger] ');
  optimized = optimized.replace(/✅/g, '[checkmark] ');
  optimized = optimized.replace(/❗/g, '[exclamation] ');
  optimized = optimized.replace(/📞/g, '[phone] ');
  optimized = optimized.replace(/📱/g, '[mobile phone] ');
  optimized = optimized.replace(/📧/g, '[email] ');
  optimized = optimized.replace(/🔗/g, '[link] ');
  optimized = optimized.replace(/⚠️/g, '[warning] ');
  
  // Ensure proper heading structure
  optimized = optimized.replace(/\*\*\*(.+?)\*\*\*/g, '## $1');
  optimized = optimized.replace(/\*\*(.+?)\*\*/g, '### $1');
  
  // Add ARIA labels to links
  optimized = optimized.replace(
    /\[(.+?)\]\((.+?)\)/g, 
    (match, text, url) => `[${text}](${url}) (link to ${url.replace(/https?:\/\//, '')})`
  );
  
  // Add explicit section markers
  optimized = optimized.replace(/^(#+)\s+(.+)$/gm, '$1 $2 (Section Heading)');
  
  // Format phone numbers with spaces for better screen reader pronunciation
  optimized = optimized.replace(
    /(\d{3})-(\d{3})-(\d{4})/g, 
    '$1 $2 $3'
  );
  
  // Format the Veterans Crisis Line information for emphasis
  optimized = optimized.replace(
    /(Veterans Crisis Line.*?988.*?press 1)/i,
    'IMPORTANT: $1'
  );
  
  // Add "List starts" and "List ends" markers
  optimized = optimized.replace(
    /(\d+\.\s+.+(\n|$))+/g,
    match => `[List starts]\n${match}[List ends]`
  );
  
  return optimized;
}

/**
 * Expand military abbreviations
 */
function expandAbbreviations(response: string): string {
  let expanded = response;
  
  // Find and expand abbreviations
  for (const [abbr, expansion] of Object.entries(MILITARY_ABBREVIATIONS)) {
    // Only expand the first instance of each abbreviation
    const regex = new RegExp(`\\b${abbr}\\b(?![^(]*\\))`, 'i');
    if (regex.test(expanded)) {
      expanded = expanded.replace(
        regex,
        `${abbr} (${expansion})`
      );
    }
  }
  
  return expanded;
}

/**
 * Add phonetic spelling for complex terms
 */
function addPhoneticSpelling(response: string): string {
  // Add phonetic spelling for complex medical or military terms
  const phoneticTerms: Record<string, string> = {
    'PTSD': 'P-T-S-D',
    'TBI': 'T-B-I',
    'MST': 'M-S-T',
    'DD214': 'D-D-2-1-4',
    'SGLI': 'S-G-L-I',
    'C&P': 'C and P',
    'MEB/PEB': 'M-E-B / P-E-B'
  };
  
  let withPhonetics = response;
  
  for (const [term, phonetic] of Object.entries(phoneticTerms)) {
    // Only add phonetic spelling to the first instance
    const regex = new RegExp(`\\b${term}\\b(?![^(]*\\))`, 'i');
    if (regex.test(withPhonetics)) {
      withPhonetics = withPhonetics.replace(
        regex,
        `${term} (pronounced ${phonetic})`
      );
    }
  }
  
  return withPhonetics;
}

/**
 * Simplify language for easier comprehension
 */
function simplifyLanguage(response: string): string {
  // Replace complex terms with simpler alternatives
  const simplifications: Record<string, string> = {
    'utilize': 'use',
    'commence': 'start',
    'terminate': 'end',
    'facilitate': 'help',
    'implement': 'start',
    'sufficient': 'enough',
    'demonstrate': 'show',
    'obtain': 'get',
    'regarding': 'about',
    'initiate': 'begin',
    'additional': 'more',
    'numerous': 'many',
    'prioritize': 'focus on',
    'subsequently': 'later',
    'endeavor': 'try',
    'ascertain': 'find out',
    'expedite': 'speed up',
    'inquire': 'ask',
    'optimal': 'best',
    'procure': 'get'
  };
  
  let simplified = response;
  
  for (const [complex, simple] of Object.entries(simplifications)) {
    const regex = new RegExp(`\\b${complex}\\b`, 'gi');
    simplified = simplified.replace(regex, simple);
  }
  
  return simplified;
}

/**
 * Add keyboard shortcuts to navigation instructions
 */
function addKeyboardShortcuts(response: string): string {
  let withShortcuts = response;
  
  // Add keyboard shortcuts for navigation references
  for (const [page, shortcut] of Object.entries(KEYBOARD_SHORTCUTS)) {
    const regex = new RegExp(`(navigate|go|click)\\s+to\\s+(the\\s+)?${page}`, 'i');
    if (regex.test(withShortcuts)) {
      withShortcuts = withShortcuts.replace(
        regex,
        `$1 to $2${page} (keyboard shortcut: ${shortcut})`
      );
    }
  }
  
  // Add general keyboard shortcut information
  if (withShortcuts.includes('navigate') || withShortcuts.includes('click')) {
    withShortcuts += '\n\n[Accessibility Note: You can navigate Vet1Stop using keyboard shortcuts. Press Alt+? to view all available shortcuts.]';
  }
  
  return withShortcuts;
}

/**
 * Format response for high contrast display
 */
function formatForHighContrast(response: string): string {
  let highContrast = response;
  
  // Add high contrast formatting for important information
  highContrast = highContrast.replace(
    /(Veterans Crisis Line.*?)(\n|$)/i,
    '!!! IMPORTANT !!!\n$1\n!!! IMPORTANT !!!\n$2'
  );
  
  // Enhance headings for high contrast
  highContrast = highContrast.replace(
    /^(#+)\s+(.+)$/gm,
    '$1 === $2 ==='
  );
  
  // Enhance list items for high contrast
  highContrast = highContrast.replace(
    /^(\d+)\.\s+(.+)$/gm,
    '$1. >> $2'
  );
  
  return highContrast;
}

/**
 * Format crisis information for maximum accessibility
 */
export function formatCrisisInfoForAccessibility(crisisInfo: string): string {
  let formatted = crisisInfo;
  
  // Ensure the Veterans Crisis Line information is prominently featured
  if (formatted.includes('Veterans Crisis Line')) {
    formatted = formatted.replace(
      /(Veterans Crisis Line.*?)(\n|$)/i,
      '[EMERGENCY RESOURCE]\n$1\n[END EMERGENCY RESOURCE]\n$2'
    );
  }
  
  // Add explicit labels for contact methods
  formatted = formatted.replace(
    /Call 988/i,
    'Phone Number: Call 988'
  );
  
  formatted = formatted.replace(
    /text 838255/i,
    'Text Message: Send text to 838255'
  );
  
  formatted = formatted.replace(
    /(chat at|chat online at) (VeteransCrisisLine\.net\/Chat)/i,
    'Online Chat: Visit $2'
  );
  
  // Add screen reader pause points
  formatted = formatted.replace(/\./g, '. [pause] ');
  
  // Remove the pause markers for visual display (they'll be interpreted by screen readers)
  formatted = formatted.replace(/\[pause\] \[pause\]/g, '[pause]');
  
  return formatted;
}
