/**
 * Health Resources Data
 * 
 * Centralized data for health-related resources throughout the Health page
 */

export interface HealthResource {
  id: string;
  title: string;
  description: string;
  link: string;
  category: string;
  tags: string[];
  featured?: boolean;
  imageSrc?: string;
  source?: string;
  lastUpdated?: string;
  isPremiumContent?: boolean;
}

export interface ResourceCategory {
  id: string;
  title: string;
  description: string;
  resources: HealthResource[];
  icon?: string;
}

// VA Healthcare Benefits data
export const vaHealthcareBenefits: HealthResource[] = [
  {
    id: 'va-health-enrollment',
    title: 'VA Health Care Enrollment',
    description: 'How to apply for VA health care benefits and what documents you need.',
    link: 'https://www.va.gov/health-care/how-to-apply/',
    category: 'va-healthcare',
    tags: ['enrollment', 'application', 'benefits'],
    featured: true,
    source: 'VA.gov'
  },
  {
    id: 'priority-groups',
    title: 'Priority Groups Explained',
    description: 'Learn about VA priority groups and how they determine your access to care.',
    link: 'https://www.va.gov/health-care/eligibility/priority-groups/',
    category: 'va-healthcare',
    tags: ['eligibility', 'priority'],
    source: 'VA.gov'
  },
  {
    id: 'cost-copays',
    title: 'Health Care Costs & Copays',
    description: 'Information about potential costs and copays associated with VA health care.',
    link: 'https://www.va.gov/health-care/copay-rates/',
    category: 'va-healthcare',
    tags: ['costs', 'finances'],
    source: 'VA.gov'
  },
  {
    id: 'family-benefits',
    title: 'Family & Dependent Benefits',
    description: 'Health care benefits available to families and dependents of Veterans.',
    link: 'https://www.va.gov/health-care/family-caregiver-benefits/',
    category: 'va-healthcare',
    tags: ['family', 'dependents'],
    source: 'VA.gov'
  }
];

// Mental Health Resources data
export const mentalHealthResources: HealthResource[] = [
  {
    id: 'ptsd-treatment',
    title: 'PTSD Treatment Options',
    description: 'Evidence-based treatments for PTSD, including therapy and medication options.',
    link: 'https://www.ptsd.va.gov/understand_tx/tx_basics.asp',
    category: 'mental-health',
    tags: ['PTSD', 'treatment', 'therapy'],
    featured: true,
    source: 'VA.gov'
  },
  {
    id: 'depression-resources',
    title: 'Depression Resources',
    description: 'Support resources and treatment options for veterans experiencing depression.',
    link: 'https://www.mentalhealth.va.gov/depression/index.asp',
    category: 'mental-health',
    tags: ['depression', 'mental health'],
    source: 'VA.gov'
  },
  {
    id: 'substance-use',
    title: 'Substance Use Support',
    description: 'VA programs and services for substance use recovery and treatment.',
    link: 'https://www.mentalhealth.va.gov/substance-use/index.asp',
    category: 'mental-health',
    tags: ['substance use', 'addiction', 'recovery'],
    source: 'VA.gov'
  },
  {
    id: 'mst-support',
    title: 'Military Sexual Trauma Support',
    description: 'Resources for Veterans who experienced military sexual trauma (MST).',
    link: 'https://www.mentalhealth.va.gov/msthome/index.asp',
    category: 'mental-health',
    tags: ['MST', 'trauma', 'support'],
    source: 'VA.gov'
  }
];

// Physical Health Services data
export const physicalHealthServices: HealthResource[] = [
  {
    id: 'primary-care',
    title: 'Primary Care Services',
    description: 'Basic health care services including routine checkups and preventive care.',
    link: 'https://www.va.gov/health-care/about-va-health-benefits/primary-care/',
    category: 'physical-health',
    tags: ['primary care', 'checkups', 'preventive'],
    featured: true,
    source: 'VA.gov'
  },
  {
    id: 'specialty-care',
    title: 'Specialty Care Services',
    description: 'Specialized care for specific health conditions and needs.',
    link: 'https://www.va.gov/health-care/about-va-health-benefits/specialty-care/',
    category: 'physical-health',
    tags: ['specialty', 'specialists'],
    source: 'VA.gov'
  },
  {
    id: 'womens-health',
    title: "Women's Health Services",
    description: 'Health care services designed specifically for women Veterans.',
    link: 'https://www.womenshealth.va.gov/',
    category: 'physical-health',
    tags: ['women', 'gender-specific'],
    source: 'VA.gov'
  },
  {
    id: 'disability-exams',
    title: 'Disability Benefit Exams',
    description: 'Medical exams to evaluate your condition for VA disability claims.',
    link: 'https://www.va.gov/disability/va-claim-exam/',
    category: 'physical-health',
    tags: ['disability', 'exams', 'claims'],
    source: 'VA.gov'
  }
];

// Community Care Network data
export const communityCareResources: HealthResource[] = [
  {
    id: 'community-care-eligibility',
    title: 'Community Care Eligibility',
    description: 'Find out if you are eligible for community care and how to get started.',
    link: 'https://www.va.gov/COMMUNITYCARE/programs/veterans/General_Care.asp',
    category: 'community-care',
    tags: ['eligibility', 'community'],
    featured: true,
    source: 'VA.gov'
  },
  {
    id: 'find-provider',
    title: 'Find a Community Provider',
    description: 'Search for VA-approved community care providers near you.',
    link: 'https://www.va.gov/find-locations/',
    category: 'community-care',
    tags: ['providers', 'search', 'community'],
    source: 'VA.gov'
  },
  {
    id: 'urgent-care',
    title: 'Urgent Care Benefits',
    description: 'How to access urgent care through VA community care benefits.',
    link: 'https://www.va.gov/COMMUNITYCARE/programs/veterans/Urgent_Care.asp',
    category: 'community-care',
    tags: ['urgent', 'emergency', 'care'],
    source: 'VA.gov'
  }
];

// Wellness & Prevention data
export const wellnessPreventionResources: HealthResource[] = [
  {
    id: 'health-screenings',
    title: 'Preventive Health Screenings',
    description: 'Recommended health screenings for Veterans by age and risk factors.',
    link: 'https://www.prevention.va.gov/Healthy_Living/Get_Recommended_Screening_Tests_and_Immunizations_for_Men.asp',
    category: 'wellness',
    tags: ['screening', 'preventive', 'care'],
    featured: true,
    source: 'VA.gov'
  },
  {
    id: 'weight-management',
    title: 'Weight Management Program',
    description: 'VA\'s MOVE! weight management and health promotion program.',
    link: 'https://www.move.va.gov/',
    category: 'wellness',
    tags: ['weight', 'fitness', 'nutrition'],
    source: 'VA.gov'
  },
  {
    id: 'diabetes-prevention',
    title: 'Diabetes Prevention Program',
    description: 'VA program to help Veterans prevent or manage diabetes.',
    link: 'https://www.prevention.va.gov/Healthy_Living/Diabetes_Prevention_Program.asp',
    category: 'wellness',
    tags: ['diabetes', 'prevention', 'chronic'],
    source: 'VA.gov'
  },
  {
    id: 'tobacco-cessation',
    title: 'Tobacco Cessation',
    description: 'Resources and programs to help Veterans quit using tobacco products.',
    link: 'https://www.mentalhealth.va.gov/quit-tobacco/',
    category: 'wellness',
    tags: ['tobacco', 'smoking', 'cessation'],
    source: 'VA.gov'
  }
];

// Caregiver support data
export const caregiverResources: HealthResource[] = [
  {
    id: 'caregiver-program',
    title: 'Program of Comprehensive Assistance for Family Caregivers',
    description: 'Support program for caregivers of eligible Veterans who were seriously injured.',
    link: 'https://www.caregiver.va.gov/support/support_benefits.asp',
    category: 'caregiver',
    tags: ['caregiver', 'family', 'support'],
    featured: true,
    source: 'VA.gov'
  },
  {
    id: 'caregiver-support-line',
    title: 'Caregiver Support Line',
    description: 'Licensed professionals who can connect you with VA services and provide support.',
    link: 'https://www.caregiver.va.gov/support_line.asp',
    category: 'caregiver',
    tags: ['caregiver', 'hotline', 'support'],
    source: 'VA.gov'
  },
  {
    id: 'caregiver-self-care',
    title: 'Caregiver Self-Care Resources',
    description: 'Resources to help caregivers maintain their own health and wellbeing.',
    link: 'https://www.caregiver.va.gov/Tips_by_Diagnosis.asp',
    category: 'caregiver',
    tags: ['caregiver', 'self-care', 'wellbeing'],
    source: 'VA.gov'
  }
];

// Pharmacy services data
export const pharmacyResources: HealthResource[] = [
  {
    id: 'prescription-refills',
    title: 'Prescription Refill Options',
    description: 'Different ways to refill your VA prescriptions, including online and by phone.',
    link: 'https://www.va.gov/health-care/refill-track-prescriptions/',
    category: 'pharmacy',
    tags: ['prescriptions', 'refills', 'medication'],
    featured: true,
    source: 'VA.gov'
  },
  {
    id: 'medication-history',
    title: 'My HealtheVet Pharmacy',
    description: 'Access your medication history and manage prescriptions online.',
    link: 'https://www.myhealth.va.gov/mhv-portal-web/pharmacy',
    category: 'pharmacy',
    tags: ['prescriptions', 'online', 'management'],
    source: 'VA.gov'
  },
  {
    id: 'medication-copays',
    title: 'Medication Copays',
    description: 'Information about copayments for VA prescription medications.',
    link: 'https://www.va.gov/health-care/copay-rates/',
    category: 'pharmacy',
    tags: ['copays', 'costs', 'prescriptions'],
    source: 'VA.gov'
  }
];

// Crisis resources data
export const crisisResources: HealthResource[] = [
  {
    id: 'veterans-crisis-line',
    title: 'Veterans Crisis Line',
    description: '24/7 confidential crisis support for Veterans and their loved ones.',
    link: 'https://www.veteranscrisisline.net/',
    category: 'crisis',
    tags: ['crisis', 'suicide', 'emergency'],
    featured: true,
    source: 'VeteransCrisisLine.net'
  },
  {
    id: 'suicide-prevention',
    title: 'Suicide Prevention Resources',
    description: 'Information and resources for Veterans, families, and providers.',
    link: 'https://www.mentalhealth.va.gov/suicide_prevention/',
    category: 'crisis',
    tags: ['suicide', 'prevention', 'mental health'],
    source: 'VA.gov'
  },
  {
    id: 'emergency-care',
    title: 'Emergency Medical Care',
    description: 'What to do in a medical emergency and how VA can help with emergency costs.',
    link: 'https://www.va.gov/COMMUNITYCARE/programs/veterans/Emergency_Care.asp',
    category: 'crisis',
    tags: ['emergency', 'urgent', 'medical'],
    source: 'VA.gov'
  }
];

// Combined categories to use throughout Health page
export const resourceCategories: ResourceCategory[] = [
  {
    id: 'va-healthcare',
    title: 'VA Healthcare Benefits',
    description: 'Information about VA healthcare enrollment, eligibility, and benefits.',
    resources: vaHealthcareBenefits,
    icon: 'building-library'
  },
  {
    id: 'mental-health',
    title: 'Mental Health Resources',
    description: 'Support for PTSD, depression, substance use, and more.',
    resources: mentalHealthResources,
    icon: 'brain'
  },
  {
    id: 'physical-health',
    title: 'Physical Health Services',
    description: 'Primary care, specialty care, and other physical health services.',
    resources: physicalHealthServices,
    icon: 'heart'
  },
  {
    id: 'community-care',
    title: 'Community Care Network',
    description: 'Access health care outside of VA when needed.',
    resources: communityCareResources,
    icon: 'users'
  },
  {
    id: 'wellness',
    title: 'Wellness & Prevention',
    description: 'Resources to maintain and improve your health.',
    resources: wellnessPreventionResources,
    icon: 'sparkles'
  },
  {
    id: 'caregiver',
    title: 'Caregiver Support',
    description: 'Resources for family members and friends who care for Veterans.',
    resources: caregiverResources,
    icon: 'hand-heart'
  },
  {
    id: 'pharmacy',
    title: 'Pharmacy Services',
    description: 'Prescription benefits and medication management.',
    resources: pharmacyResources,
    icon: 'pill'
  },
  {
    id: 'crisis',
    title: 'Crisis Resources',
    description: 'Immediate support for Veterans in crisis.',
    resources: crisisResources,
    icon: 'shield-exclamation'
  }
];
