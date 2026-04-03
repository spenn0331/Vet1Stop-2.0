// @ts-nocheck
/**
 * schools.ts — Curated list of 20 top Yellow Ribbon / GI Bill-accepting schools.
 * Used by SchoolFinderPanel.tsx for static filtering + comparison table.
 * Data sourced from VA Yellow Ribbon Program school search + NCES College Navigator (2024–2025).
 */

export type DegreeType = 'Associate' | 'Bachelor' | 'Master' | 'Doctoral' | 'Certificate';

export interface School {
  id:                    string;
  name:                  string;
  city:                  string;
  state:                 string;
  stateCode:             string;
  yellowRibbon:          boolean;
  yellowRibbonMaxAmt:    number | null;    // per student per year ($0 = unlimited)
  tuitionInState:        number;           // annual, full-time
  tuitionOutState:       number;           // annual, full-time (same as inState for private)
  graduationRate:        number;           // percentage (0–100)
  avgDebt:               number;           // avg federal student loan debt at graduation ($)
  veteranServicesRating: number;           // 1.0–5.0 composite from SVA / Military Times
  degrees:               DegreeType[];
  online:                boolean;          // has substantial online options
  militaryFriendlyBadge: boolean;
  link:                  string;
  description:           string;
}

export const SCHOOLS: School[] = [
  {
    id: 'asu',
    name: 'Arizona State University',
    city: 'Tempe', state: 'Arizona', stateCode: 'AZ',
    yellowRibbon: true, yellowRibbonMaxAmt: 25000,
    tuitionInState: 12720, tuitionOutState: 31200,
    graduationRate: 67, avgDebt: 24000,
    veteranServicesRating: 4.5,
    degrees: ['Bachelor', 'Master', 'Doctoral', 'Certificate'],
    online: true, militaryFriendlyBadge: true,
    link: 'https://veterans.asu.edu/',
    description: 'Ranked #1 in innovation 9 years running. Dedicated Pat Tillman Veterans Center, in-person and online. Strong STEM, business, and engineering programs.',
  },
  {
    id: 'syracuse',
    name: 'Syracuse University',
    city: 'Syracuse', state: 'New York', stateCode: 'NY',
    yellowRibbon: true, yellowRibbonMaxAmt: 0, // unlimited
    tuitionInState: 59440, tuitionOutState: 59440,
    graduationRate: 82, avgDebt: 31000,
    veteranServicesRating: 5.0,
    degrees: ['Bachelor', 'Master', 'Doctoral'],
    online: true, militaryFriendlyBadge: true,
    link: 'https://ivmf.syracuse.edu/',
    description: '#1 veteran-friendly university nationally. Home of the D\'Aniello Institute for Veterans and Military Families (IVMF). Full YR — no out-of-pocket for qualifying veterans.',
  },
  {
    id: 'usc',
    name: 'University of Southern California',
    city: 'Los Angeles', state: 'California', stateCode: 'CA',
    yellowRibbon: true, yellowRibbonMaxAmt: 0,
    tuitionInState: 65446, tuitionOutState: 65446,
    graduationRate: 92, avgDebt: 28000,
    veteranServicesRating: 4.8,
    degrees: ['Bachelor', 'Master', 'Doctoral'],
    online: true, militaryFriendlyBadge: true,
    link: 'https://veteranaffairs.usc.edu/',
    description: 'Premier private research university with one of the country\'s most comprehensive veteran support networks. Unlimited Yellow Ribbon covers full gap above GI Bill cap.',
  },
  {
    id: 'liberty',
    name: 'Liberty University',
    city: 'Lynchburg', state: 'Virginia', stateCode: 'VA',
    yellowRibbon: true, yellowRibbonMaxAmt: 10000,
    tuitionInState: 22200, tuitionOutState: 22200,
    graduationRate: 60, avgDebt: 28000,
    veteranServicesRating: 4.5,
    degrees: ['Associate', 'Bachelor', 'Master', 'Doctoral', 'Certificate'],
    online: true, militaryFriendlyBadge: true,
    link: 'https://www.liberty.edu/veterans/',
    description: 'One of the largest Christian universities in the world. Robust online program popular with active-duty and veterans. Military discounts and accelerated degree options.',
  },
  {
    id: 'fsu',
    name: 'Florida State University',
    city: 'Tallahassee', state: 'Florida', stateCode: 'FL',
    yellowRibbon: true, yellowRibbonMaxAmt: 5000,
    tuitionInState: 6517, tuitionOutState: 21683,
    graduationRate: 84, avgDebt: 19000,
    veteranServicesRating: 4.6,
    degrees: ['Bachelor', 'Master', 'Doctoral'],
    online: false, militaryFriendlyBadge: true,
    link: 'https://veterans.fsu.edu/',
    description: 'Top-ranked public university with low in-state tuition nearly fully covered by Post-9/11 GI Bill. Strong business, criminology, and social sciences programs.',
  },
  {
    id: 'umd',
    name: 'University of Maryland',
    city: 'College Park', state: 'Maryland', stateCode: 'MD',
    yellowRibbon: true, yellowRibbonMaxAmt: 5000,
    tuitionInState: 10779, tuitionOutState: 38870,
    graduationRate: 87, avgDebt: 24000,
    veteranServicesRating: 4.4,
    degrees: ['Bachelor', 'Master', 'Doctoral'],
    online: true, militaryFriendlyBadge: true,
    link: 'https://stamp.umd.edu/community/veterans',
    description: 'Flagship Maryland university close to DC. Strong public policy, cybersecurity, and engineering. Popular with veterans working in federal contracting.',
  },
  {
    id: 'tamu',
    name: 'Texas A&M University',
    city: 'College Station', state: 'Texas', stateCode: 'TX',
    yellowRibbon: true, yellowRibbonMaxAmt: 8000,
    tuitionInState: 12413, tuitionOutState: 39513,
    graduationRate: 83, avgDebt: 23000,
    veteranServicesRating: 4.7,
    degrees: ['Bachelor', 'Master', 'Doctoral'],
    online: false, militaryFriendlyBadge: true,
    link: 'https://veterans.tamu.edu/',
    description: 'Home to the largest ROTC program outside of federal military academies. Deep military culture, excellent engineering and agriculture programs, strong Aggie network.',
  },
  {
    id: 'psu',
    name: 'Penn State University',
    city: 'University Park', state: 'Pennsylvania', stateCode: 'PA',
    yellowRibbon: true, yellowRibbonMaxAmt: 5000,
    tuitionInState: 20098, tuitionOutState: 38656,
    graduationRate: 83, avgDebt: 31000,
    veteranServicesRating: 4.5,
    degrees: ['Bachelor', 'Master', 'Doctoral'],
    online: true, militaryFriendlyBadge: true,
    link: 'https://veterans.psu.edu/',
    description: 'Major research university with 24 campuses and robust World Campus online options. Priority registration for veterans and a dedicated Veterans Resource Center.',
  },
  {
    id: 'gmu',
    name: 'George Mason University',
    city: 'Fairfax', state: 'Virginia', stateCode: 'VA',
    yellowRibbon: true, yellowRibbonMaxAmt: 4000,
    tuitionInState: 12792, tuitionOutState: 36048,
    graduationRate: 72, avgDebt: 22000,
    veteranServicesRating: 4.6,
    degrees: ['Bachelor', 'Master', 'Doctoral', 'Certificate'],
    online: true, militaryFriendlyBadge: true,
    link: 'https://veterans.gmu.edu/',
    description: 'Located in the heart of Northern Virginia\'s defense corridor. Top programs in cybersecurity, public policy, and criminal justice. Close proximity to the Pentagon and DC.',
  },
  {
    id: 'csu',
    name: 'Colorado State University',
    city: 'Fort Collins', state: 'Colorado', stateCode: 'CO',
    yellowRibbon: true, yellowRibbonMaxAmt: 3000,
    tuitionInState: 11502, tuitionOutState: 29928,
    graduationRate: 70, avgDebt: 25000,
    veteranServicesRating: 4.4,
    degrees: ['Bachelor', 'Master', 'Doctoral'],
    online: true, militaryFriendlyBadge: true,
    link: 'https://military.colostate.edu/',
    description: 'Strong STEM and environmental programs near Fort Carson and the Air Force Academy. Dedicated veteran student services and a welcoming Colorado outdoor culture.',
  },
  {
    id: 'purdue',
    name: 'Purdue University',
    city: 'West Lafayette', state: 'Indiana', stateCode: 'IN',
    yellowRibbon: true, yellowRibbonMaxAmt: 6000,
    tuitionInState: 9992, tuitionOutState: 28794,
    graduationRate: 83, avgDebt: 25000,
    veteranServicesRating: 4.6,
    degrees: ['Bachelor', 'Master', 'Doctoral'],
    online: true, militaryFriendlyBadge: true,
    link: 'https://www.purdue.edu/studentsuccess/military/',
    description: 'World-class engineering, technology, and science programs with affordable in-state tuition. One of the best STEM value propositions for veterans using GI Bill benefits.',
  },
  {
    id: 'vt',
    name: 'Virginia Tech',
    city: 'Blacksburg', state: 'Virginia', stateCode: 'VA',
    yellowRibbon: true, yellowRibbonMaxAmt: 10000,
    tuitionInState: 13981, tuitionOutState: 32945,
    graduationRate: 83, avgDebt: 26000,
    veteranServicesRating: 4.7,
    degrees: ['Bachelor', 'Master', 'Doctoral'],
    online: false, militaryFriendlyBadge: true,
    link: 'https://military.vt.edu/',
    description: 'Top-10 engineering school with deep military culture. Corps of Cadets, strong defense research programs, and excellent career placement in the defense industry.',
  },
  {
    id: 'uofl',
    name: 'University of Pittsburgh',
    city: 'Pittsburgh', state: 'Pennsylvania', stateCode: 'PA',
    yellowRibbon: true, yellowRibbonMaxAmt: 10000,
    tuitionInState: 21016, tuitionOutState: 36328,
    graduationRate: 84, avgDebt: 27000,
    veteranServicesRating: 4.4,
    degrees: ['Bachelor', 'Master', 'Doctoral'],
    online: false, militaryFriendlyBadge: true,
    link: 'https://www.studentaffairs.pitt.edu/militaryveterans/',
    description: 'R1 research university with strong health sciences, engineering, and business. Located in a city with a large veteran population and growing tech sector.',
  },
  {
    id: 'msu',
    name: 'Michigan State University',
    city: 'East Lansing', state: 'Michigan', stateCode: 'MI',
    yellowRibbon: true, yellowRibbonMaxAmt: 3000,
    tuitionInState: 14070, tuitionOutState: 41250,
    graduationRate: 80, avgDebt: 25000,
    veteranServicesRating: 4.3,
    degrees: ['Bachelor', 'Master', 'Doctoral'],
    online: true, militaryFriendlyBadge: true,
    link: 'https://veterans.msu.edu/',
    description: 'Broad program offerings in business, communications, and agriculture. Veteran Resource Center provides dedicated advising, priority registration, and emergency aid.',
  },
  {
    id: 'odu',
    name: 'Old Dominion University',
    city: 'Norfolk', state: 'Virginia', stateCode: 'VA',
    yellowRibbon: true, yellowRibbonMaxAmt: 8000,
    tuitionInState: 11244, tuitionOutState: 29040,
    graduationRate: 58, avgDebt: 22000,
    veteranServicesRating: 4.5,
    degrees: ['Bachelor', 'Master', 'Doctoral', 'Certificate'],
    online: true, militaryFriendlyBadge: true,
    link: 'https://www.odu.edu/militaryconnection',
    description: 'Located in Hampton Roads — home to the largest concentration of military in the world. Distance learning leader with dozens of online programs designed for active-duty service members.',
  },
  {
    id: 'excelsior',
    name: 'Excelsior University',
    city: 'Albany', state: 'New York', stateCode: 'NY',
    yellowRibbon: true, yellowRibbonMaxAmt: 0,
    tuitionInState: 7776, tuitionOutState: 7776,
    graduationRate: 55, avgDebt: 16000,
    veteranServicesRating: 4.8,
    degrees: ['Associate', 'Bachelor', 'Master', 'Certificate'],
    online: true, militaryFriendlyBadge: true,
    link: 'https://excelsior.edu/military-veterans/',
    description: 'Online-first institution founded to serve working adults and military members. Accepts ACE/CLEP/DSST credits generously. Unlimited Yellow Ribbon keeps out-of-pocket near zero.',
  },
  {
    id: 'apus',
    name: 'American Public University System',
    city: 'Charles Town', state: 'West Virginia', stateCode: 'WV',
    yellowRibbon: true, yellowRibbonMaxAmt: 5000,
    tuitionInState: 7344, tuitionOutState: 7344,
    graduationRate: 48, avgDebt: 15000,
    veteranServicesRating: 4.5,
    degrees: ['Associate', 'Bachelor', 'Master', 'Certificate'],
    online: true, militaryFriendlyBadge: true,
    link: 'https://www.apu.apus.edu/military-and-veterans/',
    description: 'Purpose-built for military and veterans. 100% online, start any month, no on-campus requirements. Low tuition makes it one of the most cost-efficient GI Bill options available.',
  },
  {
    id: 'gwu',
    name: 'George Washington University',
    city: 'Washington', state: 'District of Columbia', stateCode: 'DC',
    yellowRibbon: true, yellowRibbonMaxAmt: 0,
    tuitionInState: 62670, tuitionOutState: 62670,
    graduationRate: 82, avgDebt: 35000,
    veteranServicesRating: 4.6,
    degrees: ['Bachelor', 'Master', 'Doctoral'],
    online: true, militaryFriendlyBadge: true,
    link: 'https://veterans.gwu.edu/',
    description: 'Located 4 blocks from the White House. Premier institution for international affairs, political science, public policy, and law. Unlimited YR covers the full tuition gap.',
  },
  {
    id: 'drexel',
    name: 'Drexel University',
    city: 'Philadelphia', state: 'Pennsylvania', stateCode: 'PA',
    yellowRibbon: true, yellowRibbonMaxAmt: 25000,
    tuitionInState: 56994, tuitionOutState: 56994,
    graduationRate: 69, avgDebt: 40000,
    veteranServicesRating: 4.3,
    degrees: ['Bachelor', 'Master', 'Doctoral', 'Certificate'],
    online: true, militaryFriendlyBadge: true,
    link: 'https://drexel.edu/veterans/',
    description: 'Known for co-op program connecting students with industry. Strong engineering, business, and health sciences. Active veteran student community in Philadelphia.',
  },
  {
    id: 'cudenver',
    name: 'University of Colorado Denver',
    city: 'Denver', state: 'Colorado', stateCode: 'CO',
    yellowRibbon: true, yellowRibbonMaxAmt: 10000,
    tuitionInState: 9600, tuitionOutState: 26400,
    graduationRate: 52, avgDebt: 21000,
    veteranServicesRating: 4.2,
    degrees: ['Bachelor', 'Master', 'Doctoral', 'Certificate'],
    online: true, militaryFriendlyBadge: true,
    link: 'https://www.ucdenver.edu/veterans',
    description: 'Urban campus in downtown Denver near Buckley Space Force Base. Affordable in-state tuition with strong business, public affairs, and health programs. GI Bill covers most in-state costs.',
  },
];

// ─── Utility helpers ──────────────────────────────────────────────────────────

export const ALL_STATES = Array.from(new Set(SCHOOLS.map(s => s.state))).sort();

export function filterSchools(params: {
  state?: string;
  yellowRibbonOnly?: boolean;
  degreeType?: DegreeType | '';
  keyword?: string;
}): School[] {
  return SCHOOLS.filter(s => {
    if (params.state && s.state !== params.state) return false;
    if (params.yellowRibbonOnly && !s.yellowRibbon) return false;
    if (params.degreeType && !s.degrees.includes(params.degreeType)) return false;
    if (params.keyword) {
      const kw = params.keyword.toLowerCase();
      if (!s.name.toLowerCase().includes(kw) && !s.city.toLowerCase().includes(kw) && !s.description.toLowerCase().includes(kw)) return false;
    }
    return true;
  });
}
