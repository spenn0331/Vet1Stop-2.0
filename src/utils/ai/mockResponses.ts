/**
 * Mock Responses for AI Features
 * 
 * This module provides mock responses for different AI features to enable
 * development and testing without consuming API tokens.
 */

export type AIFeature = 'chat' | 'recommend' | 'summarize' | 'voice' | 'form';

// Map of feature types to categories of responses
const mockResponseData: Record<string, Record<string, Record<string, string>>> = {
  // Chat responses for different topics
  chat: {
    // Navigation and general site questions
    navigation: {
      'home': 'The home page provides an overview of Vet1Stop with quick access to all resource categories. You can return to the home page by clicking the Vet1Stop logo in the top left corner.',
      'resources': 'We offer resources in several categories: Education, Health, Life and Leisure, Jobs, Shop, Local, and Social. You can access these from the main navigation menu.',
      'health': 'The Health page offers resources for physical health, mental health, and wellness. You can find information from the VA, federal programs, state programs, and NGOs.',
      'education': 'The Education page provides resources about GI Bill benefits, scholarships, vocational training, and educational institutions that support veterans.',
      'jobs': 'The Careers section offers resources for job searching, resume building, interview preparation, and connecting with veteran-friendly employers.',
      'life': 'The Life and Leisure section provides resources for housing, financial assistance, recreation, and community activities for veterans.',
      'local': 'The Local page helps you find veteran-focused businesses, services, and community resources in your area based on your location.',
      'shop': 'The Shop page features veteran-owned businesses where you can purchase products while supporting fellow veterans.',
      'social': 'The Social page allows you to connect with other veterans, join groups, and participate in events relevant to your interests and service background.',
      'search': 'You can search for specific resources using the search bar at the top of each page. Try using keywords related to what you need.',
      'filter': 'Most resource pages include filtering options to narrow down results by service branch, era of service, resource type, and other relevant criteria.',
      'register': 'You can create an account by clicking the "Sign Up" button in the top right corner. This allows you to save resources and receive personalized recommendations.',
      'login': 'You can log in to your account by clicking the "Sign In" button in the top right corner.',
      'contact': 'You can contact us through the form on the Contact page, accessible from the footer of any page.',
      'accessibility': 'Vet1Stop is designed to be fully accessible, with features like high-contrast mode, keyboard navigation, and screen reader compatibility.',
      'help': 'I\'m here to help with any questions! You can ask about site navigation, specific resources, or veteran benefits. What can I assist you with today?'
    },
    
    // Health-related questions
    health: {
      'va': 'The VA (Veterans Affairs) provides comprehensive healthcare services to eligible veterans. You can apply for VA healthcare online through VA.gov, by phone, or in person at a VA facility.',
      'ptsd': 'For PTSD resources, I recommend checking the Mental Health section of our Health page. The VA offers specialized PTSD treatment programs, and there are also non-VA options like the Wounded Warrior Project.',
      'mental health': 'Mental health resources include VA services, telehealth options, peer support groups, and nonprofit organizations focused on veteran mental wellness. The Health page lists these resources with contact information.',
      'therapy': 'Therapy options for veterans include VA mental health services, Vet Centers for combat veterans, and nonprofit organizations that offer free or reduced-cost counseling for veterans.',
      'crisis': 'If you\'re experiencing a crisis, please call the Veterans Crisis Line at 988 (press 1) or text 838255. This service provides 24/7 support.',
      'medication': 'Medication management is typically handled through VA healthcare. If you\'re enrolled, you can discuss medications with your VA provider and often get prescriptions filled through VA pharmacies.',
      'insurance': 'Veterans have several health insurance options including VA healthcare, TRICARE for retired military, Medicare for older veterans, and private insurance. The specific options depend on your service status and eligibility.',
      'disability': 'VA disability benefits are available for service-connected conditions. You can apply online through VA.gov or with the help of a Veterans Service Officer (VSO).',
      'caregiver': 'The VA Program of Comprehensive Assistance for Family Caregivers provides support to family caregivers of eligible Veterans. Resources include training, counseling, respite care, and in some cases, financial assistance.'
    },
    
    // Education-related questions
    education: {
      'gi bill': 'The GI Bill provides education benefits to veterans, service members, and their dependents. The Post-9/11 GI Bill covers tuition, housing, books, and more for eligible veterans. You can apply online through VA.gov.',
      'voc rehab': 'Vocational Rehabilitation and Employment (VR&E), now called Veteran Readiness and Employment, helps veterans with service-connected disabilities prepare for and find suitable employment.',
      'scholarships': 'Many scholarships are available specifically for veterans. Organizations like the Pat Tillman Foundation, Veterans of Foreign Wars, and the American Legion offer scholarships for veterans and their families.',
      'tuition assistance': 'Tuition Assistance programs vary by branch of service and can help active duty service members pay for college courses. This is separate from GI Bill benefits.',
      'yellow ribbon': 'The Yellow Ribbon Program helps veterans pay for higher out-of-state, private school, or graduate school tuition that the Post-9/11 GI Bill doesn\'t cover.',
      'online courses': 'Many online education programs are approved for GI Bill benefits. The VA maintains a list of approved programs, and many schools have veteran-specific resources for online learning.'
    },
    
    // Personal assistance
    personal: {
      'hello': 'Hello! I\'m the Vet1Stop AI assistant, here to help you navigate our resources and find what you need. How can I assist you today?',
      'who are you': 'I\'m an AI assistant for Vet1Stop, designed to help veterans find resources, navigate the site, and answer questions about veteran benefits and services. How can I help you today?',
      'thank you': 'You\'re welcome! It\'s my pleasure to help. If you have any other questions, feel free to ask anytime.',
      'help': 'I\'d be happy to help! You can ask me about finding specific resources, site navigation, or information about veteran benefits. What are you looking for today?'
    }
  },
  
  // Recommendation responses for personalized suggestions
  recommend: {
    // Health recommendations
    health: {
      'mental health': 'Based on your profile as a post-9/11 Army veteran located in Texas, I recommend: 1) The local VA Mental Health Clinic in San Antonio which offers specialized PTSD programs, 2) The Wounded Warrior Project\'s mental health services which include peer support groups in your area, and 3) Texas Veterans Commission\'s mental health program which provides free counseling services.',
      'physical health': 'Based on your profile, here are recommendations: 1) VA North Texas Health Care System for comprehensive services, 2) Disabled American Veterans (DAV) chapter in Dallas for assistance with physical disability claims and support, and 3) Team Red, White & Blue for physical fitness activities that also provide community connections with other veterans.',
      'wellness': 'For wellness resources that match your profile: 1) The VA Whole Health program which offers holistic approaches to wellbeing, 2) Texas Veterans Wellness Program with free yoga, meditation, and nutrition classes, and 3) The Give an Hour organization providing free mental wellness counseling for post-9/11 veterans.'
    },
    
    // Education recommendations
    education: {
      'colleges': 'Based on your profile, I recommend: 1) Texas A&M University-San Antonio, which has a 5-star rating for veteran support and fully accepts your GI Bill benefits, 2) University of Texas at Austin, which participates in the Yellow Ribbon Program to cover additional tuition costs, and 3) San Antonio College, which offers specialized veteran counseling and credit for military experience.',
      'vocational': 'For vocational training, I suggest: 1) Texas State Technical College, which offers programs that build on your military engineering experience, 2) St. Philip\'s College Vocational Nursing program, which has accelerated options for veterans with medical experience, and 3) Troops to Teachers Texas, which helps veterans transition to teaching careers with certification support.'
    }
  },
  
  // Summarization responses
  summarize: {
    resources: {
      'va_benefits': 'The VA provides comprehensive benefits including healthcare, education through the GI Bill, home loans with no down payment required, disability compensation for service-connected conditions, pension programs for wartime veterans with limited income, life insurance options specifically for veterans, burial benefits including in national cemeteries, and transition assistance for new veterans. Eligibility varies by benefit type and is based on service history, discharge status, and sometimes financial need.',
      'mental_health': 'The Mental Health Resources section offers a wide range of support services for veterans experiencing PTSD, depression, anxiety, substance abuse, and other mental health challenges. Services include VA mental health programs, community-based counseling through Vet Centers, crisis support via the Veterans Crisis Line, telehealth options for remote care, peer support groups, and specialized programs for combat trauma. Both VA and non-VA options are available, with many offering free or reduced-cost care specifically for veterans.'
    }
  },
  
  // Voice command responses
  voice: {
    commands: {
      'go to health page': '{"intent": "navigation", "action": "navigate", "parameters": {"target": "health"}}',
      'find mental health resources': '{"intent": "search", "action": "find_resources", "parameters": {"category": "health", "subcategory": "mental_health"}}',
      'search for education benefits': '{"intent": "search", "action": "find_resources", "parameters": {"category": "education", "keywords": "benefits"}}',
      'show me job opportunities': '{"intent": "navigation", "action": "navigate", "parameters": {"target": "careers"}}',
      'help me find housing assistance': '{"intent": "search", "action": "find_resources", "parameters": {"category": "life", "subcategory": "housing"}}'
    }
  },
  
  // Form assistance responses
  form: {
    fields: {
      'name': 'John Doe',
      'email': 'john.doe@example.com',
      'phone': '555-123-4567',
      'address': '123 Veterans Way, Austin, TX 78701',
      'service_branch': 'Army',
      'service_dates': '2010-2018',
      'rank': 'E-5 (Sergeant)',
      'disability_rating': '30%'
    }
  }
};

/**
 * Get relevant keywords from a query for matching
 */
function getKeywords(query: string): string[] {
  // Clean and normalize the query
  const cleanQuery = query.toLowerCase().trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Remove extra spaces
  
  // Remove common stop words
  const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'about', 'is', 'are'];
  const words = cleanQuery.split(' ').filter(word => !stopWords.includes(word) && word.length > 1);
  
  return words;
}

/**
 * Find the best match for a query within a category
 */
function findBestMatch(query: string, categories: Record<string, string>): string {
  const keywords = getKeywords(query);
  
  // Try to find exact match first
  const exactMatch = Object.keys(categories).find(key => 
    key.toLowerCase() === query.toLowerCase().trim()
  );
  
  if (exactMatch) {
    return categories[exactMatch];
  }
  
  // Look for partial matches
  let bestMatchKey = '';
  let bestMatchScore = 0;
  
  for (const key of Object.keys(categories)) {
    // Calculate a simple match score
    const keyWords = getKeywords(key);
    let matchScore = 0;
    
    // Check for keyword matches
    for (const word of keywords) {
      if (key.toLowerCase().includes(word)) {
        matchScore += 1;
      }
      
      // Check for similar words
      for (const keyWord of keyWords) {
        if (keyWord.includes(word) || word.includes(keyWord)) {
          matchScore += 0.5;
        }
      }
    }
    
    // Update best match if we found a better one
    if (matchScore > bestMatchScore) {
      bestMatchScore = matchScore;
      bestMatchKey = key;
    }
  }
  
  // Return the best match, or a default message if no good match
  if (bestMatchScore > 0) {
    return categories[bestMatchKey];
  }
  
  return "I don't have specific information about that yet, but I'm here to help. Could you rephrase your question or ask about a different topic related to veteran resources?";
}

/**
 * Get the appropriate category based on a query
 */
function getCategoryForQuery(feature: AIFeature, query: string): string {
  // Simple keyword-based categorization
  const keywords: Record<string, Record<string, string[]>> = {
    chat: {
      navigation: ['site', 'page', 'find', 'locate', 'home', 'where', 'how to', 'menu', 'help'],
      health: ['health', 'medical', 'doctor', 'hospital', 'therapy', 'ptsd', 'mental'],
      education: ['education', 'school', 'college', 'university', 'degree', 'gi bill'],
      personal: ['hi', 'hello', 'hey', 'thanks', 'thank you', 'who are you']
    },
    recommend: {
      health: ['health', 'medical', 'doctor', 'hospital', 'therapy', 'mental'],
      education: ['education', 'school', 'college', 'degree', 'course', 'learn']
    }
  };
  
  const lowercaseQuery = query.toLowerCase();
  
  // Check if we have keyword definitions for this feature
  if (feature in keywords) {
    const featureKeywords = keywords[feature];
    
    // Find matching category
    for (const [category, categoryKeywords] of Object.entries(featureKeywords)) {
      for (const keyword of categoryKeywords) {
        if (lowercaseQuery.includes(keyword)) {
          return category;
        }
      }
    }
  }
  
  // Default categories if no match found
  const defaults: Record<AIFeature, string> = {
    chat: 'personal',
    recommend: 'health',
    summarize: 'resources',
    voice: 'commands',
    form: 'fields'
  };
  
  return defaults[feature];
}

/**
 * Get a mock response for an AI feature based on the query
 */
export async function getMockResponse(feature: AIFeature, query: string): Promise<string> {
  // Add delay to simulate API call
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
  
  try {
    // Get the appropriate category based on the query
    const category = getCategoryForQuery(feature, query);
    
    // Find the best matching response
    if (mockResponseData[feature] && mockResponseData[feature][category]) {
      return findBestMatch(query, mockResponseData[feature][category]);
    }
    
    // Fallback response if category not found
    return "I don't have information on that specific topic yet, but I'm continuously learning. Please try asking about another topic related to veteran resources.";
  } catch (error) {
    console.error('Error getting mock response:', error);
    return "I'm sorry, I encountered an issue processing your request. Please try again with a different question.";
  }
}
