// @ts-nocheck
// RERN Agent Seed Data — Real Estate Referral Network
// All data is fictional. Do not use real names, phone numbers, or business info.

export interface RERNAgent {
  id: string;
  name: string;
  title: string;
  company: string;
  city: string;
  state: string;
  stateCode: string;
  phone: string;
  email: string;
  photo?: string;
  specialties: string[];
  credentials: string[];
  isVeteran: boolean;
  branch?: string;
  closings: number;
  rating: number;
  reviewCount: number;
  bio: string;
  yearStarted: number;
  featured: boolean;
  coverageAreas: string[];
}

export const RERN_AGENTS: RERNAgent[] = [
  {
    id: 'rern-001',
    name: 'Mike Ramirez',
    title: 'Military Relocation Professional',
    company: 'Sunshine Veterans Realty',
    city: 'Tampa',
    state: 'Florida',
    stateCode: 'FL',
    phone: '813-555-0147',
    email: 'mike.ramirez@example.com',
    specialties: ['VA Purchase', 'Military Relocation', 'PCS Moves'],
    credentials: ['MRP', 'VA Loan Certified', 'CIPS'],
    isVeteran: true,
    branch: 'Marines',
    closings: 183,
    rating: 4.9,
    reviewCount: 214,
    bio: 'Two-tour Marine who transitioned into real estate to help fellow veterans find their forever home. Specializes in PCS relocations across the Tampa Bay area.',
    yearStarted: 2014,
    featured: true,
    coverageAreas: ['Tampa', 'St. Petersburg', 'Clearwater', 'Brandon'],
  },
  {
    id: 'rern-002',
    name: 'Sarah Chen',
    title: 'VA Loan Specialist',
    company: 'Pacific Coast Home Group',
    city: 'Los Angeles',
    state: 'California',
    stateCode: 'CA',
    phone: '310-555-0283',
    email: 'sarah.chen@example.com',
    specialties: ['VA Purchase', 'VA Refinance', 'Luxury Homes'],
    credentials: ['VA Loan Certified', 'SRES'],
    isVeteran: false,
    closings: 95,
    rating: 4.8,
    reviewCount: 112,
    bio: 'Passionate advocate for veteran homeownership in Southern California. Known for finding creative solutions in competitive LA markets.',
    yearStarted: 2018,
    featured: false,
    coverageAreas: ['Los Angeles', 'Long Beach', 'Torrance', 'Inglewood'],
  },
  {
    id: 'rern-003',
    name: 'James "JB" Brooks',
    title: 'Military Relocation Professional',
    company: 'All American Realty Group',
    city: 'Fayetteville',
    state: 'North Carolina',
    stateCode: 'NC',
    phone: '910-555-0389',
    email: 'jb.brooks@example.com',
    photo: '/images/agents/jb-brooks.jpg',
    specialties: ['VA Purchase', 'Military Relocation', 'New Construction', 'Land'],
    credentials: ['MRP', 'VA Loan Certified', 'ABR', 'CRS'],
    isVeteran: true,
    branch: 'Army',
    closings: 224,
    rating: 5.0,
    reviewCount: 287,
    bio: 'Retired Army SFC with 20 years of service. Helped 200+ military families find homes near Fort Liberty and across the Sandhills region.',
    yearStarted: 2011,
    featured: true,
    coverageAreas: ['Fayetteville', 'Fort Liberty', 'Southern Pines', 'Sanford'],
  },
  {
    id: 'rern-004',
    name: 'Amanda Torres',
    title: 'Broker / Owner',
    company: 'Anchor Point Real Estate',
    city: 'Virginia Beach',
    state: 'Virginia',
    stateCode: 'VA',
    phone: '757-555-0512',
    email: 'amanda.torres@example.com',
    specialties: ['VA Purchase', 'VA Refinance', 'Investment Properties'],
    credentials: ['MRP', 'VA Loan Certified', 'SDVOSB'],
    isVeteran: true,
    branch: 'Navy',
    closings: 67,
    rating: 4.9,
    reviewCount: 78,
    bio: 'Navy veteran and SDVOSB business owner dedicated to serving the Hampton Roads military community. Specializes in VA purchases and investment strategy.',
    yearStarted: 2019,
    featured: true,
    coverageAreas: ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Hampton'],
  },
  {
    id: 'rern-005',
    name: 'David Kowalski',
    title: 'VA Purchase Specialist',
    company: 'Steel City Home Advisors',
    city: 'Pittsburgh',
    state: 'Pennsylvania',
    stateCode: 'PA',
    phone: '412-555-0671',
    email: 'david.kowalski@example.com',
    specialties: ['VA Purchase', 'First-Time Buyers', 'Relocation'],
    credentials: ['VA Loan Certified', 'ABR'],
    isVeteran: false,
    closings: 45,
    rating: 4.7,
    reviewCount: 53,
    bio: 'Pittsburgh native who has guided dozens of veteran families through the home-buying process. Patient, detail-oriented, and always available on weekends.',
    yearStarted: 2020,
    featured: false,
    coverageAreas: ['Pittsburgh', 'Cranberry Township', 'Monroeville', 'Bethel Park'],
  },
  {
    id: 'rern-006',
    name: 'Tanya Washington',
    title: 'Relocation Expert',
    company: 'Lone Star Veteran Homes',
    city: 'San Antonio',
    state: 'Texas',
    stateCode: 'TX',
    phone: '210-555-0834',
    email: 'tanya.washington@example.com',
    specialties: ['Military Relocation', 'VA Purchase', 'PCS Moves', 'New Construction'],
    credentials: ['MRP', 'VA Loan Certified', 'GRI'],
    isVeteran: true,
    branch: 'Air Force',
    closings: 132,
    rating: 4.8,
    reviewCount: 164,
    bio: 'Air Force veteran and San Antonio relocation expert. Helps military families moving to Joint Base San Antonio find the right neighborhood and school district.',
    yearStarted: 2015,
    featured: false,
    coverageAreas: ['San Antonio', 'New Braunfels', 'Schertz', 'Universal City'],
  },
  {
    id: 'rern-007',
    name: 'Chris Morgan',
    title: 'New Construction & VA Specialist',
    company: 'Peach State Realty Partners',
    city: 'Atlanta',
    state: 'Georgia',
    stateCode: 'GA',
    phone: '404-555-0928',
    email: 'chris.morgan@example.com',
    specialties: ['VA Purchase', 'New Construction', 'Luxury Homes'],
    credentials: ['VA Loan Certified', 'CRS', 'CNHS'],
    isVeteran: false,
    closings: 88,
    rating: 4.6,
    reviewCount: 97,
    bio: 'Atlanta new-construction specialist who partners with builders offering VA-friendly incentives. Helps veterans maximize benefits on brand-new homes.',
    yearStarted: 2016,
    featured: true,
    coverageAreas: ['Atlanta', 'Marietta', 'Kennesaw', 'Alpharetta'],
  },
  {
    id: 'rern-008',
    name: 'Rachel Kim',
    title: 'VA Refinance Specialist',
    company: 'Mountain West Home Group',
    city: 'Colorado Springs',
    state: 'Colorado',
    stateCode: 'CO',
    phone: '719-555-0195',
    email: 'rachel.kim@example.com',
    specialties: ['VA Refinance', 'IRRRL Streamline', 'VA Purchase'],
    credentials: ['VA Loan Certified', 'MRP'],
    isVeteran: false,
    closings: 52,
    rating: 4.8,
    reviewCount: 61,
    bio: 'Army spouse and fierce advocate for military families near Fort Carson. Expert in IRRRL streamline refinances that save veterans hundreds monthly.',
    yearStarted: 2019,
    featured: false,
    coverageAreas: ['Colorado Springs', 'Fort Carson', 'Fountain', 'Pueblo'],
  },
];

// --- Helper functions ---

export function filterAgents(opts: {
  stateCode?: string;
  specialty?: string;
  isVeteran?: boolean;
  featuredOnly?: boolean;
  keyword?: string;
}): RERNAgent[] {
  let results = [...RERN_AGENTS];

  if (opts.stateCode) {
    results = results.filter((a) => a.stateCode === opts.stateCode);
  }
  if (opts.specialty) {
    results = results.filter((a) =>
      a.specialties.some((s) => s === opts.specialty)
    );
  }
  if (opts.isVeteran) {
    results = results.filter((a) => a.isVeteran);
  }
  if (opts.featuredOnly) {
    results = results.filter((a) => a.featured);
  }
  if (opts.keyword) {
    const kw = opts.keyword.toLowerCase();
    results = results.filter(
      (a) =>
        a.name.toLowerCase().includes(kw) ||
        a.company.toLowerCase().includes(kw) ||
        a.city.toLowerCase().includes(kw) ||
        a.bio.toLowerCase().includes(kw)
    );
  }

  // Featured agents first, then by closings descending
  results.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return b.closings - a.closings;
  });

  return results;
}

// Unique specialties across all agents
export const SPECIALTIES: string[] = Array.from(
  new Set(RERN_AGENTS.flatMap((a) => a.specialties))
).sort();

// Unique sorted state codes
export const AGENT_STATES: string[] = Array.from(
  new Set(RERN_AGENTS.map((a) => a.stateCode))
).sort();
