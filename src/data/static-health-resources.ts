/**
 * Static health resources to use as fallback when MongoDB is not available
 * Uses standardized schema matching our MongoDB implementation
 */

export const STATIC_HEALTH_RESOURCES = [
  {
    _id: '1',
    id: '1',
    title: 'VA Health Care Enrollment',
    description: 'Apply for VA health care benefits and find out how to access services.',
    category: 'Health',
    subcategory: 'Federal',
    resourceType: 'va',
    contact: {
      phone: '1-877-222-8387',
      email: 'vainfo@va.gov',
      website: 'https://www.va.gov/health-care/'
    },
    location: {
      address: '810 Vermont Avenue, NW',
      city: 'Washington',
      state: 'DC',
      zipCode: '20420'
    },
    eligibility: 'Must be a Veteran who served in the active military, naval, or air service',
    veteranType: ['all', 'combat', 'disabled'],
    serviceBranch: ['army', 'navy', 'air force', 'marines', 'coast guard', 'space force'],
    tags: ['healthcare', 'enrollment', 'benefits', 'mental-health', 'primary-care', 'ptsd', 'depression'],
    isFeatured: true,
    lastUpdated: new Date('2024-01-15'),
    imageUrl: '/images/resources/va-health.jpg',
    rating: 4.8,
    reviewCount: 245
  },
  {
    _id: '2',
    id: '2',
    title: 'TRICARE Health Plans',
    description: 'Health care program for uniformed service members, retirees, and their families.',
    category: 'Health',
    subcategory: 'Federal',
    resourceType: 'federal',
    contact: {
      phone: '1-800-444-5445',
      email: 'info@tricare.mil',
      website: 'https://www.tricare.mil/'
    },
    location: {
      address: '',
      city: '',
      state: 'national',
      zipCode: ''
    },
    eligibility: 'Active duty service members, military retirees, and their families',
    veteranType: ['all', 'active-duty', 'retired'],
    serviceBranch: ['army', 'navy', 'air force', 'marines', 'coast guard', 'space force'],
    tags: ['healthcare', 'insurance', 'military families', 'primary-care'],
    isFeatured: true,
    lastUpdated: new Date('2024-02-10'),
    imageUrl: '/images/resources/tricare.jpg',
    rating: 4.6,
    reviewCount: 189
  },
  {
    _id: '3',
    id: '3',
    title: 'Veterans Crisis Line',
    description: 'Confidential crisis support available 24/7 for Veterans and their loved ones.',
    category: 'Mental Health',
    subcategory: 'Crisis',
    resourceType: 'va',
    contact: {
      phone: '1-800-273-8255',
      email: '',
      website: 'https://www.veteranscrisisline.net/'
    },
    location: {
      state: 'national'
    },
    eligibility: 'Veterans, service members, National Guard and Reserve members, and their family members and friends',
    veteranType: ['all'],
    serviceBranch: ['army', 'navy', 'air force', 'marines', 'coast guard', 'space force'],
    tags: ['crisis', 'suicide prevention', 'mental health', 'emergency', 'hotline'],
    isFeatured: true,
    lastUpdated: new Date('2024-03-05'),
    rating: 4.9,
    reviewCount: 321
  },
  {
    _id: '4',
    id: '4',
    title: 'Wounded Warrior Project',
    description: 'Programs and services for veterans and service members who incurred physical or mental injuries after 9/11.',
    category: 'Health',
    subcategory: 'Non-Profit',
    resourceType: 'ngo',
    contact: {
      phone: '1-877-832-6997',
      email: 'resourcecenter@woundedwarriorproject.org',
      website: 'https://www.woundedwarriorproject.org/'
    },
    location: {
      state: 'national'
    },
    eligibility: 'Post-9/11 veterans and service members who have sustained physical or mental injuries',
    veteranType: ['post-911', 'combat', 'disabled'],
    serviceBranch: ['army', 'navy', 'air force', 'marines', 'coast guard'],
    tags: ['mental health', 'physical health', 'rehabilitation', 'support', 'post-911'],
    isFeatured: true,
    lastUpdated: new Date('2024-02-22'),
    rating: 4.7,
    reviewCount: 276
  },
  {
    _id: '5',
    id: '5',
    title: 'Vet Center Counseling',
    description: 'Community-based counseling centers providing readjustment counseling and outreach services.',
    category: 'Mental Health',
    subcategory: 'Counseling',
    resourceType: 'va',
    contact: {
      phone: '1-877-927-8387',
      website: 'https://www.vetcenter.va.gov/'
    },
    location: {
      state: 'national'
    },
    eligibility: 'Veterans who served in any combat zone, experienced military sexual trauma, or provided direct emergency medical care',
    veteranType: ['combat', 'all'],
    serviceBranch: ['army', 'navy', 'air force', 'marines', 'coast guard', 'space force'],
    tags: ['counseling', 'readjustment', 'ptsd', 'mental health', 'mst'],
    isFeatured: false,
    lastUpdated: new Date('2024-01-30'),
    rating: 4.5,
    reviewCount: 198
  },
  {
    _id: '6',
    id: '6',
    title: 'Give an Hour',
    description: 'Free mental health services to military personnel, veterans, and their families.',
    category: 'Mental Health',
    subcategory: 'Non-Profit',
    resourceType: 'ngo',
    contact: {
      email: 'info@giveanhour.org',
      website: 'https://giveanhour.org/'
    },
    location: {
      state: 'national'
    },
    eligibility: 'Military personnel, veterans, and their families',
    veteranType: ['all', 'active-duty', 'family'],
    serviceBranch: ['army', 'navy', 'air force', 'marines', 'coast guard', 'space force'],
    tags: ['mental health', 'therapy', 'counseling', 'free', 'family support'],
    isFeatured: false,
    lastUpdated: new Date('2024-03-15'),
    rating: 4.3,
    reviewCount: 107
  },
  {
    _id: '7',
    id: '7',
    title: 'California Veterans Health System',
    description: 'State-specific healthcare programs and benefits for veterans residing in California.',
    category: 'Health',
    subcategory: 'State',
    resourceType: 'state',
    contact: {
      phone: '1-800-952-5626',
      email: 'vetsinfo@calvet.ca.gov',
      website: 'https://www.calvet.ca.gov/VetServices/Pages/Health.aspx'
    },
    location: {
      state: 'CA'
    },
    eligibility: 'Veterans who reside in California',
    veteranType: ['all'],
    serviceBranch: ['army', 'navy', 'air force', 'marines', 'coast guard', 'space force'],
    tags: ['healthcare', 'benefits', 'state-specific', 'california'],
    isFeatured: false,
    lastUpdated: new Date('2024-02-05'),
    rating: 4.1,
    reviewCount: 89
  },
  {
    _id: '8',
    id: '8',
    title: 'Texas Veterans Health Programs',
    description: 'Health resources and benefits specifically for veterans in Texas.',
    category: 'Health',
    subcategory: 'State',
    resourceType: 'state',
    contact: {
      phone: '1-800-252-8387',
      website: 'https://www.tvc.texas.gov/healthcare/'
    },
    location: {
      state: 'TX'
    },
    eligibility: 'Veterans who reside in Texas',
    veteranType: ['all'],
    serviceBranch: ['army', 'navy', 'air force', 'marines', 'coast guard', 'space force'],
    tags: ['healthcare', 'benefits', 'state-specific', 'texas'],
    isFeatured: false,
    lastUpdated: new Date('2024-01-25'),
    rating: 4.2,
    reviewCount: 76
  },
  {
    _id: '9',
    id: '9',
    title: 'Cohen Veterans Network',
    description: 'High-quality, accessible mental health care for post-9/11 veterans and their families.',
    category: 'Mental Health',
    subcategory: 'Non-Profit',
    resourceType: 'ngo',
    contact: {
      website: 'https://www.cohenveteransnetwork.org/'
    },
    location: {
      state: 'national'
    },
    eligibility: 'Post-9/11 veterans, active duty service members (with a TRICARE referral), and their families',
    veteranType: ['post-911', 'active-duty', 'family'],
    serviceBranch: ['army', 'navy', 'air force', 'marines', 'coast guard', 'space force'],
    tags: ['mental health', 'therapy', 'counseling', 'family support', 'post-911'],
    isFeatured: true,
    lastUpdated: new Date('2024-03-10'),
    rating: 4.6,
    reviewCount: 152
  },
  {
    _id: '10',
    id: '10',
    title: 'VA Whole Health Program',
    description: 'A holistic approach to healthcare focusing on your values, needs, and goals.',
    category: 'Wellness',
    subcategory: 'VA',
    resourceType: 'va',
    contact: {
      website: 'https://www.va.gov/wholehealth/'
    },
    location: {
      state: 'national'
    },
    eligibility: 'Veterans enrolled in VA healthcare',
    veteranType: ['all'],
    serviceBranch: ['army', 'navy', 'air force', 'marines', 'coast guard', 'space force'],
    tags: ['wellness', 'holistic health', 'preventive care', 'complementary medicine'],
    isFeatured: false,
    lastUpdated: new Date('2024-02-18'),
    rating: 4.4,
    reviewCount: 132
  }
];
