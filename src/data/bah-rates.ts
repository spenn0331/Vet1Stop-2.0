/**
 * bah-rates.ts — 2025 Basic Allowance for Housing (BAH) rates.
 * Grade: E-5 with dependents. Rate = Monthly Housing Allowance (MHA) paid
 * by Post-9/11 GI Bill at 100% entitlement.
 *
 * Values represent the BAH rate for the school's zip code area / primary metro.
 * Used by GiBillPanel.tsx to estimate monthly housing income.
 *
 * Source: DoD BAH Rates (2025). Values are state-level proxies using the
 * largest military population center per state for MVP simplicity.
 * Real BAH is ZIP-specific; users should verify at https://www.defensetravel.dod.mil/site/bahCalc.cfm
 */

export interface BAHRate {
  state:      string;
  stateCode:  string;
  monthlyE5WithDep: number;  // E-5 with dependents, 2025
  primaryCity: string;       // city used for the proxy rate
}

export const BAH_RATES: BAHRate[] = [
  { state: 'Alabama',              stateCode: 'AL', monthlyE5WithDep: 1800,  primaryCity: 'Huntsville' },
  { state: 'Alaska',               stateCode: 'AK', monthlyE5WithDep: 2700,  primaryCity: 'Anchorage' },
  { state: 'Arizona',              stateCode: 'AZ', monthlyE5WithDep: 1899,  primaryCity: 'Phoenix' },
  { state: 'Arkansas',             stateCode: 'AR', monthlyE5WithDep: 1500,  primaryCity: 'Little Rock' },
  { state: 'California',           stateCode: 'CA', monthlyE5WithDep: 3072,  primaryCity: 'Los Angeles' },
  { state: 'Colorado',             stateCode: 'CO', monthlyE5WithDep: 2100,  primaryCity: 'Denver / Colorado Springs' },
  { state: 'Connecticut',          stateCode: 'CT', monthlyE5WithDep: 2400,  primaryCity: 'Hartford' },
  { state: 'Delaware',             stateCode: 'DE', monthlyE5WithDep: 2100,  primaryCity: 'Wilmington' },
  { state: 'District of Columbia', stateCode: 'DC', monthlyE5WithDep: 3000,  primaryCity: 'Washington DC' },
  { state: 'Florida',              stateCode: 'FL', monthlyE5WithDep: 1899,  primaryCity: 'Tampa / Jacksonville' },
  { state: 'Georgia',              stateCode: 'GA', monthlyE5WithDep: 1800,  primaryCity: 'Atlanta / Columbus' },
  { state: 'Hawaii',               stateCode: 'HI', monthlyE5WithDep: 3600,  primaryCity: 'Honolulu' },
  { state: 'Idaho',                stateCode: 'ID', monthlyE5WithDep: 1500,  primaryCity: 'Boise' },
  { state: 'Illinois',             stateCode: 'IL', monthlyE5WithDep: 2100,  primaryCity: 'Chicago' },
  { state: 'Indiana',              stateCode: 'IN', monthlyE5WithDep: 1599,  primaryCity: 'Indianapolis' },
  { state: 'Iowa',                 stateCode: 'IA', monthlyE5WithDep: 1500,  primaryCity: 'Des Moines' },
  { state: 'Kansas',               stateCode: 'KS', monthlyE5WithDep: 1599,  primaryCity: 'Junction City / Fort Riley' },
  { state: 'Kentucky',             stateCode: 'KY', monthlyE5WithDep: 1500,  primaryCity: 'Elizabethtown / Fort Knox' },
  { state: 'Louisiana',            stateCode: 'LA', monthlyE5WithDep: 1500,  primaryCity: 'New Orleans / Bossier City' },
  { state: 'Maine',                stateCode: 'ME', monthlyE5WithDep: 1800,  primaryCity: 'Portland' },
  { state: 'Maryland',             stateCode: 'MD', monthlyE5WithDep: 2400,  primaryCity: 'Baltimore / Annapolis' },
  { state: 'Massachusetts',        stateCode: 'MA', monthlyE5WithDep: 2700,  primaryCity: 'Boston' },
  { state: 'Michigan',             stateCode: 'MI', monthlyE5WithDep: 1800,  primaryCity: 'Detroit / Grand Rapids' },
  { state: 'Minnesota',            stateCode: 'MN', monthlyE5WithDep: 1899,  primaryCity: 'Minneapolis' },
  { state: 'Mississippi',          stateCode: 'MS', monthlyE5WithDep: 1500,  primaryCity: 'Biloxi / Columbus' },
  { state: 'Missouri',             stateCode: 'MO', monthlyE5WithDep: 1599,  primaryCity: 'St. Louis / Kansas City' },
  { state: 'Montana',              stateCode: 'MT', monthlyE5WithDep: 1500,  primaryCity: 'Missoula / Great Falls' },
  { state: 'Nebraska',             stateCode: 'NE', monthlyE5WithDep: 1599,  primaryCity: 'Omaha / Lincoln' },
  { state: 'Nevada',               stateCode: 'NV', monthlyE5WithDep: 2100,  primaryCity: 'Las Vegas / Reno' },
  { state: 'New Hampshire',        stateCode: 'NH', monthlyE5WithDep: 2100,  primaryCity: 'Manchester' },
  { state: 'New Jersey',           stateCode: 'NJ', monthlyE5WithDep: 2400,  primaryCity: 'Fort Dix / Trenton' },
  { state: 'New Mexico',           stateCode: 'NM', monthlyE5WithDep: 1599,  primaryCity: 'Albuquerque / Las Cruces' },
  { state: 'New York',             stateCode: 'NY', monthlyE5WithDep: 2700,  primaryCity: 'New York City / Buffalo' },
  { state: 'North Carolina',       stateCode: 'NC', monthlyE5WithDep: 1899,  primaryCity: 'Fayetteville / Jacksonville' },
  { state: 'North Dakota',         stateCode: 'ND', monthlyE5WithDep: 1500,  primaryCity: 'Grand Forks / Minot' },
  { state: 'Ohio',                 stateCode: 'OH', monthlyE5WithDep: 1800,  primaryCity: 'Columbus / Dayton' },
  { state: 'Oklahoma',             stateCode: 'OK', monthlyE5WithDep: 1599,  primaryCity: 'Oklahoma City / Lawton' },
  { state: 'Oregon',               stateCode: 'OR', monthlyE5WithDep: 2100,  primaryCity: 'Portland / Eugene' },
  { state: 'Pennsylvania',         stateCode: 'PA', monthlyE5WithDep: 1899,  primaryCity: 'Philadelphia / Pittsburgh' },
  { state: 'Rhode Island',         stateCode: 'RI', monthlyE5WithDep: 2400,  primaryCity: 'Providence / Newport' },
  { state: 'South Carolina',       stateCode: 'SC', monthlyE5WithDep: 1800,  primaryCity: 'Columbia / Charleston' },
  { state: 'South Dakota',         stateCode: 'SD', monthlyE5WithDep: 1500,  primaryCity: 'Rapid City / Sioux Falls' },
  { state: 'Tennessee',            stateCode: 'TN', monthlyE5WithDep: 1599,  primaryCity: 'Nashville / Clarksville' },
  { state: 'Texas',                stateCode: 'TX', monthlyE5WithDep: 1899,  primaryCity: 'San Antonio / Killeen' },
  { state: 'Utah',                 stateCode: 'UT', monthlyE5WithDep: 1899,  primaryCity: 'Salt Lake City / Ogden' },
  { state: 'Vermont',              stateCode: 'VT', monthlyE5WithDep: 1800,  primaryCity: 'Burlington' },
  { state: 'Virginia',             stateCode: 'VA', monthlyE5WithDep: 2100,  primaryCity: 'Hampton Roads / Northern VA' },
  { state: 'Washington',           stateCode: 'WA', monthlyE5WithDep: 2400,  primaryCity: 'Seattle / Tacoma' },
  { state: 'West Virginia',        stateCode: 'WV', monthlyE5WithDep: 1500,  primaryCity: 'Charleston / Morgantown' },
  { state: 'Wisconsin',            stateCode: 'WI', monthlyE5WithDep: 1599,  primaryCity: 'Madison / Milwaukee' },
  { state: 'Wyoming',              stateCode: 'WY', monthlyE5WithDep: 1599,  primaryCity: 'Cheyenne / Warren AFB' },
];

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export function getBAHByState(state: string): BAHRate | undefined {
  return BAH_RATES.find(r => r.state === state || r.stateCode === state);
}

export function getBAHAmount(state: string): number {
  return getBAHByState(state)?.monthlyE5WithDep ?? 1800; // fallback to national avg
}

export const ALL_BAH_STATES = BAH_RATES.map(r => r.state).sort();
