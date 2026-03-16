/**
 * mos-map.ts — Static MOS / Rate / AFSC → civilian job keyword mapping.
 * Covers the 30 most common codes across Army, USMC, Navy, and Air Force.
 * Used by MOSTranslatorCard.tsx for instant civilian translation.
 */

export interface MOSEntry {
  code:     string;          // MOS / Rate / AFSC
  branch:   'Army' | 'USMC' | 'Navy' | 'Air Force' | 'All Branches';
  title:    string;          // Military job title
  keywords: [string, string, string]; // 3 civilian job keywords / titles
  suggestedDegrees: string[]; // relevant degree fields
}

export const MOS_MAP: MOSEntry[] = [
  // ─── Army ─────────────────────────────────────────────────────────────────
  {
    code: '11B', branch: 'Army', title: 'Infantryman',
    keywords: ['Security Manager', 'Law Enforcement Officer', 'Emergency Management Specialist'],
    suggestedDegrees: ['Criminal Justice', 'Emergency Management', 'Public Administration'],
  },
  {
    code: '68W', branch: 'Army', title: 'Combat Medic Specialist',
    keywords: ['EMT / Paramedic', 'Medical Assistant', 'Clinical Healthcare Technician'],
    suggestedDegrees: ['Nursing', 'Health Sciences', 'Emergency Medical Services'],
  },
  {
    code: '12B', branch: 'Army', title: 'Combat Engineer',
    keywords: ['Construction Project Manager', 'Civil Engineer', 'Safety & Site Inspector'],
    suggestedDegrees: ['Civil Engineering', 'Construction Management', 'Environmental Science'],
  },
  {
    code: '25U', branch: 'Army', title: 'Signal Support Systems Specialist',
    keywords: ['IT Support Specialist', 'Network Technician', 'Communications Engineer'],
    suggestedDegrees: ['Information Technology', 'Cybersecurity', 'Network Administration'],
  },
  {
    code: '25B', branch: 'Army', title: 'Information Technology Specialist',
    keywords: ['Systems Administrator', 'Network Engineer', 'Cybersecurity Analyst'],
    suggestedDegrees: ['Computer Science', 'Cybersecurity', 'Information Systems'],
  },
  {
    code: '91B', branch: 'Army', title: 'Wheeled Vehicle Mechanic',
    keywords: ['Automotive Service Technician', 'Fleet Maintenance Manager', 'Diesel Mechanic'],
    suggestedDegrees: ['Automotive Technology', 'Mechanical Engineering', 'Business Administration'],
  },
  {
    code: '35F', branch: 'Army', title: 'Intelligence Analyst',
    keywords: ['Intelligence Analyst', 'Data / Business Analyst', 'Threat Assessment Specialist'],
    suggestedDegrees: ['Intelligence Studies', 'Data Analytics', 'Political Science'],
  },
  {
    code: '92A', branch: 'Army', title: 'Automated Logistical Specialist',
    keywords: ['Supply Chain Manager', 'Logistics Coordinator', 'Inventory & Warehouse Manager'],
    suggestedDegrees: ['Supply Chain Management', 'Logistics', 'Business Administration'],
  },
  {
    code: '42A', branch: 'Army', title: 'Human Resources Specialist',
    keywords: ['HR Coordinator / Manager', 'Benefits Administrator', 'Talent Acquisition Specialist'],
    suggestedDegrees: ['Human Resources Management', 'Business Administration', 'Organizational Leadership'],
  },
  {
    code: '15T', branch: 'Army', title: 'UH-60 Helicopter Repairer',
    keywords: ['Aircraft Maintenance Technician', 'Avionics Specialist', 'Aerospace Quality Inspector'],
    suggestedDegrees: ['Aviation Maintenance Technology', 'Aerospace Engineering', 'Mechanical Engineering'],
  },
  {
    code: '68D', branch: 'Army', title: 'Operating Room Specialist',
    keywords: ['Surgical Technologist', 'OR Technician', 'Perioperative Services Coordinator'],
    suggestedDegrees: ['Surgical Technology', 'Health Sciences', 'Nursing'],
  },
  {
    code: '74D', branch: 'Army', title: 'CBRN Specialist',
    keywords: ['Hazardous Materials Specialist', 'Environmental Health & Safety Officer', 'Emergency Response Planner'],
    suggestedDegrees: ['Environmental Science', 'Occupational Health & Safety', 'Chemistry'],
  },
  {
    code: '88M', branch: 'Army', title: 'Motor Transport Operator',
    keywords: ['Commercial Driver (CDL-A)', 'Logistics & Distribution Coordinator', 'Fleet Operations Manager'],
    suggestedDegrees: ['Logistics Management', 'Transportation & Distribution', 'Business Administration'],
  },
  {
    code: '19D', branch: 'Army', title: 'Cavalry Scout',
    keywords: ['Reconnaissance & Surveillance Specialist', 'Law Enforcement / Border Patrol Agent', 'Security Operations Analyst'],
    suggestedDegrees: ['Criminal Justice', 'Intelligence Studies', 'Public Administration'],
  },
  {
    code: '13F', branch: 'Army', title: 'Fire Support Specialist',
    keywords: ['Precision Systems Operator', 'Defense Targeting Analyst', 'Geospatial Intelligence Specialist'],
    suggestedDegrees: ['Geography / GIS', 'Applied Mathematics', 'Defense & Strategic Studies'],
  },
  // ─── USMC ─────────────────────────────────────────────────────────────────
  {
    code: '0311', branch: 'USMC', title: 'Rifleman',
    keywords: ['Police Officer / Deputy Sheriff', 'Private Security Manager', 'Federal Law Enforcement Agent'],
    suggestedDegrees: ['Criminal Justice', 'Homeland Security', 'Emergency Management'],
  },
  {
    code: '0331', branch: 'USMC', title: 'Machine Gunner',
    keywords: ['Ballistics & Weapons Specialist', 'Protective Services Agent', 'Security Operations Coordinator'],
    suggestedDegrees: ['Criminal Justice', 'Homeland Security', 'Physical Security Management'],
  },
  {
    code: '0811', branch: 'USMC', title: 'Field Artillery Cannoneer',
    keywords: ['Precision Systems Engineer', 'Defense Systems Analyst', 'STEM Researcher / Analyst'],
    suggestedDegrees: ['Applied Mathematics', 'Physics', 'Mechanical Engineering'],
  },
  {
    code: '3531', branch: 'USMC', title: 'Motor Vehicle Operator',
    keywords: ['Logistics & Supply Chain Analyst', 'Commercial Fleet Driver (CDL)', 'Transportation Manager'],
    suggestedDegrees: ['Logistics Management', 'Business Administration', 'Transportation Technology'],
  },
  // ─── Navy ─────────────────────────────────────────────────────────────────
  {
    code: 'IT',   branch: 'Navy', title: 'Information Systems Technician',
    keywords: ['Network Administrator', 'Cybersecurity Analyst', 'IT Project Manager'],
    suggestedDegrees: ['Cybersecurity', 'Information Technology', 'Computer Science'],
  },
  {
    code: 'HM',   branch: 'Navy', title: 'Hospital Corpsman',
    keywords: ['EMT / Paramedic', 'Medical Assistant / Technician', 'Clinical Support Specialist'],
    suggestedDegrees: ['Nursing', 'Health Sciences', 'Pre-Medicine'],
  },
  {
    code: 'BM',   branch: 'Navy', title: "Boatswain's Mate",
    keywords: ['Maritime Operations Specialist', 'Port & Harbor Manager', 'Safety & Risk Manager'],
    suggestedDegrees: ['Maritime Transportation', 'Business Administration', 'Safety Management'],
  },
  {
    code: 'ET',   branch: 'Navy', title: 'Electronics Technician',
    keywords: ['Electronics / Avionics Technician', 'Systems Engineer', 'Field Service Engineer'],
    suggestedDegrees: ['Electrical Engineering', 'Electronics Technology', 'Computer Engineering'],
  },
  {
    code: 'GM',   branch: 'Navy', title: 'Gunner\'s Mate',
    keywords: ['Weapons Systems Technician', 'Quality Control / Safety Inspector', 'Defense Contractor Specialist'],
    suggestedDegrees: ['Mechanical Engineering', 'Systems Engineering', 'Defense Technology'],
  },
  {
    code: 'LS',   branch: 'Navy', title: 'Logistics Specialist',
    keywords: ['Supply Chain Analyst', 'Procurement & Purchasing Manager', 'Inventory Control Specialist'],
    suggestedDegrees: ['Supply Chain Management', 'Business Administration', 'Logistics & Operations'],
  },
  // ─── Air Force ────────────────────────────────────────────────────────────
  {
    code: '3D0X2', branch: 'Air Force', title: 'Cyber Systems Operations',
    keywords: ['Cybersecurity Analyst', 'Network Security Engineer', 'Cloud Infrastructure Administrator'],
    suggestedDegrees: ['Cybersecurity', 'Computer Science', 'Information Assurance'],
  },
  {
    code: '1A0X1', branch: 'Air Force', title: 'In-flight Refueling',
    keywords: ['Aviation Systems Specialist', 'Flight Operations Coordinator', 'Aerospace Logistics Manager'],
    suggestedDegrees: ['Aviation Management', 'Aerospace Technology', 'Transportation Logistics'],
  },
  {
    code: '2A3X3', branch: 'Air Force', title: 'Tactical Aircraft Maintenance',
    keywords: ['Aircraft Mechanic (A&P License)', 'Aerospace Quality Assurance Inspector', 'Aviation Maintenance Manager'],
    suggestedDegrees: ['Aviation Maintenance Technology', 'Aerospace Engineering', 'Mechanical Engineering'],
  },
  {
    code: '3P0X1', branch: 'Air Force', title: 'Security Forces',
    keywords: ['Law Enforcement Officer', 'Physical Security Manager', 'Corrections / Federal Officer'],
    suggestedDegrees: ['Criminal Justice', 'Homeland Security', 'Public Administration'],
  },
  {
    code: '4N0X1', branch: 'Air Force', title: 'Aerospace Medical Service',
    keywords: ['Medical Technician / Assistant', 'Flight Medicine Coordinator', 'Healthcare Administrator'],
    suggestedDegrees: ['Health Sciences', 'Nursing', 'Pre-Medicine / Pre-PA'],
  },
];

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export function lookupMOS(code: string): MOSEntry | undefined {
  return MOS_MAP.find(m => m.code.toUpperCase() === code.trim().toUpperCase());
}

export function searchMOS(query: string): MOSEntry[] {
  const q = query.toLowerCase().trim();
  return MOS_MAP.filter(m =>
    m.code.toLowerCase().includes(q) ||
    m.title.toLowerCase().includes(q) ||
    m.keywords.some(k => k.toLowerCase().includes(q))
  );
}
