/**
 * AI Response Formatter
 * 
 * This module provides utilities to format AI responses with consistent
 * structure, proper site links, and improved readability.
 */

/**
 * Format options for AI responses
 */
interface FormatOptions {
  includeSiteLinks: boolean;
  useMarkdownLinks: boolean;
  addResourceSections: boolean;
  optimizeForAccessibility: boolean;
}

/**
 * Default format options
 */
const DEFAULT_FORMAT_OPTIONS: FormatOptions = {
  includeSiteLinks: true,
  useMarkdownLinks: false,
  addResourceSections: true,
  optimizeForAccessibility: true
};

/**
 * Format an AI response to include proper site links and structure
 */
export function formatAIResponse(
  response: string,
  options: Partial<FormatOptions> = {}
): string {
  // Merge with default options
  const mergedOptions = { ...DEFAULT_FORMAT_OPTIONS, ...options };
  
  let formattedResponse = response;
  
  // Add site page links (e.g., "Health page" -> "Health page")
  if (mergedOptions.includeSiteLinks) {
    const pages = [
      'Home',
      'Health',
      'Education',
      'Life and Leisure',
      'Careers',
      'Local',
      'Shop',
      'Social'
    ];
    
    // Replace page references with proper links
    pages.forEach(page => {
      const pageRegex = new RegExp(`\\b${page} page\\b`, 'gi');
      const pageSlug = page.toLowerCase().replace(/\s+and\s+/i, '-');
      
      if (mergedOptions.useMarkdownLinks) {
        formattedResponse = formattedResponse.replace(
          pageRegex,
          `[${page} page](/${pageSlug})`
        );
      } else {
        // Use plain text as our component will handle the link formatting
        formattedResponse = formattedResponse.replace(
          pageRegex,
          `${page} page`
        );
      }
    });
    
    // Replace section references with proper links
    const sections = [
      { name: 'Mental Health Resources', page: 'health' },
      { name: 'PTSD Support', page: 'health' },
      { name: 'VA Programs', page: 'health' },
      { name: 'Education Benefits', page: 'education' },
      { name: 'GI Bill Information', page: 'education' },
      { name: 'Career Services', page: 'careers' },
      { name: 'Job Search', page: 'careers' },
      { name: 'Local Resources', page: 'local' }
    ];
    
    sections.forEach(section => {
      const sectionRegex = new RegExp(`\\b${section.name} section\\b`, 'gi');
      const sectionSlug = section.name.toLowerCase().replace(/\s+/g, '-');
      
      if (mergedOptions.useMarkdownLinks) {
        formattedResponse = formattedResponse.replace(
          sectionRegex,
          `[${section.name} section](/${section.page}#${sectionSlug})`
        );
      } else {
        // Use plain text as our component will handle the link formatting
        formattedResponse = formattedResponse.replace(
          sectionRegex,
          `${section.name} section`
        );
      }
    });
  }
  
  // Add resource sections if needed
  if (mergedOptions.addResourceSections && !formattedResponse.includes('## Resources')) {
    // Check if the response is recommending resources but doesn't have a section header
    const resourceKeywords = [
      'resource', 'program', 'service', 'benefit', 'support', 
      'assistance', 'help', 'aid', 'option'
    ];
    
    const hasResourceRecommendations = resourceKeywords.some(keyword => 
      formattedResponse.toLowerCase().includes(keyword)
    );
    
    if (hasResourceRecommendations) {
      // Add a Resources section header before the first resource mention
      for (const keyword of resourceKeywords) {
        const keywordRegex = new RegExp(`\\b${keyword}s?\\b`, 'i');
        const match = formattedResponse.match(keywordRegex);
        
        if (match && match.index) {
          // Find the start of the paragraph containing the keyword
          const paragraphStart = formattedResponse.lastIndexOf('\n\n', match.index);
          
          if (paragraphStart !== -1) {
            formattedResponse = 
              formattedResponse.substring(0, paragraphStart) + 
              '\n\n## Resources\n\n' + 
              formattedResponse.substring(paragraphStart + 2);
            break;
          }
        }
      }
    }
  }
  
  // Optimize for accessibility if needed
  if (mergedOptions.optimizeForAccessibility) {
    // Ensure crisis information is prominently featured
    if (formattedResponse.includes('Veterans Crisis Line')) {
      if (!formattedResponse.includes('## Crisis Support') && !formattedResponse.includes('# Crisis Support')) {
        const crisisIndex = formattedResponse.indexOf('Veterans Crisis Line');
        const paragraphStart = formattedResponse.lastIndexOf('\n\n', crisisIndex);
        
        if (paragraphStart !== -1) {
          formattedResponse = 
            formattedResponse.substring(0, paragraphStart) + 
            '\n\n## Crisis Support\n\n' + 
            formattedResponse.substring(paragraphStart + 2);
        }
      }
      
      // Ensure phone numbers have proper spacing for screen readers
      formattedResponse = formattedResponse.replace(
        /(\d{3})-(\d{3})-(\d{4})/g, 
        '$1 $2 $3'
      );
    }
    
    // Add explicit section headers if missing
    if (!formattedResponse.includes('#')) {
      const sections = formattedResponse.split('\n\n');
      if (sections.length > 2) {
        // Add a header to the first section if it doesn't have one
        if (!sections[0].startsWith('#')) {
          sections[0] = `## ${sections[0].split('.')[0]}\n\n${sections[0]}`;
        }
      }
    }
  }
  
  return formattedResponse;
}

/**
 * Format a crisis response for maximum clarity and accessibility
 */
export function formatCrisisResponse(response: string): string {
  let formattedResponse = response;
  
  // Ensure Veterans Crisis Line information is at the top
  if (formattedResponse.includes('Veterans Crisis Line')) {
    // Using a more compatible regex without the 's' flag
    const crisisLineRegex = /(Veterans Crisis Line[\s\S]*?988[\s\S]*?(press 1|text 838255|chat)[\s\S]*?(\.|$))/i;
    const match = formattedResponse.match(crisisLineRegex);
    
    if (match && match[1]) {
      const crisisInfo = match[1];
      
      // Remove the crisis info from its current position
      formattedResponse = formattedResponse.replace(crisisInfo, '');
      
      // Add it to the top with proper formatting
      formattedResponse = `## IMMEDIATE SUPPORT AVAILABLE\n\n**${crisisInfo}**\n\n${formattedResponse}`;
    }
  }
  
  // Format phone numbers for better accessibility
  formattedResponse = formattedResponse.replace(
    /(\d{3})-(\d{3})-(\d{4})/g, 
    '$1 $2 $3'
  );
  
  // Add markdown formatting for emphasis
  formattedResponse = formattedResponse.replace(
    /\b(immediate|emergency|crisis|urgent|help is available)\b/gi,
    '**$1**'
  );
  
  return formattedResponse;
}

/**
 * Format resource recommendations for better structure
 */
export function formatResourceRecommendations(resources: string[]): string {
  if (!resources || resources.length === 0) {
    return '';
  }
  
  let formattedResources = '## Recommended Resources\n\n';
  
  resources.forEach((resource, index) => {
    formattedResources += `${index + 1}. ${resource}\n`;
  });
  
  return formattedResources;
}

/**
 * Generate navigation instructions with proper links
 */
export function generateNavigationInstructions(
  targetPage: string,
  targetSection?: string
): string {
  const pageSlug = targetPage.toLowerCase().replace(/\s+and\s+/i, '-');
  const sectionSlug = targetSection?.toLowerCase().replace(/\s+/g, '-');
  
  let instructions = `## How to Navigate\n\n`;
  
  instructions += `1. Click on "${targetPage}" in the main navigation menu at the top of the page.\n`;
  
  if (targetSection) {
    instructions += `2. Scroll down to the "${targetSection}" section or use the sidebar navigation.\n`;
    instructions += `3. You can also [click here](/${pageSlug}#${sectionSlug}) to go directly to the ${targetSection} section.\n`;
  } else {
    instructions += `2. You can also [click here](/${pageSlug}) to go directly to the ${targetPage} page.\n`;
  }
  
  return instructions;
}
