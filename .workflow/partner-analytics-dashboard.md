<!-- Status: ACTIVE | Last Updated: 2026-04-02 -->
# Partner Analytics Dashboard — Development Blueprint

## Purpose

The Partner Analytics Dashboard is a read-only, role-gated portal giving paying partners visibility into their ROI on Vet1Stop. This feature converts a $499/mo directory listing into a $1,500–$5,000/mo strategic deal — because partners can *see* the value being delivered in real numbers.

**Without this dashboard, we're selling faith. With it, we're selling measurable ROI.**

> **Build Priority:** Phase 1 must be complete before pitching the first Mission Sponsor (Tier 2, $1,500/mo). This is a sales tool, not a nice-to-have.

---

## Access by Partner Tier

| Partner Tier | Dashboard Access |
| :--- | :--- |
| VOB Directory ($49/$199/mo) | None — listing only |
| NGO Spotlight ($125–$500/mo) | Basic: page views + clicks |
| Verified Business Partner ($499/mo) | Standard: clicks, Sea Bag saves, demographic breakdown |
| Mission Sponsor ($1,500/mo) | Full: Standard + mission step completions, CTR, quarterly Impact Report PDF |
| Anchor Partner ($2,500–$5,000/mo) | Full + weekly email digest + direct API key access |

---

## Firebase Auth Role

Add a `partner` custom claim to the existing Firebase Auth setup. Partners get a **read-only** session — no write access to any platform data.

```typescript
// Firebase custom claims shape
{
  role: 'partner',
  partnerId: 'org_usaa_001',   // hashed, internal ID
  tier: 'mission_sponsor'      // 'ngo' | 'vbp' | 'mission_sponsor' | 'anchor'
}
```

**Route:** `/partner` — protected by `PartnerGuard` middleware.  
**File:** `src/components/common/PartnerGuard.tsx` — checks Firebase custom claim, redirects to `/` if role is not `partner`.

---

## Data Points Per Tier

### Basic (NGO Spotlight)
- Total page views on their listing (last 30 days + trend line)
- Unique click-throughs to their external website

### Standard (Verified Business Partner, $499/mo)
- All Basic metrics
- **Sea Bag Saves** — veterans who saved their resource to the Digital Sea Bag (highest-intent signal available)
- **Anonymized Demographics** — Branch (Army/Navy/Marines/Air Force/Coast Guard), Service Era (Post-9/11 / Gulf War / Vietnam), Top 5 States by engagement

### Full (Mission Sponsor+, $1,500/mo)
- All Standard metrics
- **Mission Step Completions** — how many veterans completed the sponsored Mission Briefing step where their branding appeared
- **Sponsored Content CTR** — click-through rate on their soft CTA at mission completion
- **Platform Benchmark** — their engagement vs. platform average (no other partner's data exposed)
- **Quarterly Impact Report** — auto-generated, downloadable PDF for ESG/CSR reporting. Co-branded with Vet1Stop + partner logo.

---

## Privacy Rules (Non-Negotiable)

- **Zero PII exposed to partners.** No names, emails, usernames, or individual veteran profiles.
- All demographics are aggregated. **Minimum cohort: 25 users** before a demographic slice renders — prevents re-identification.
- Analytics events logged via Firebase Analytics using the existing anonymized `resource_clicked` pattern already established in the Smart Bridge architecture.
- Partners see cohort-level data only. Consistent with `vet1stop_recon_bridge_data` privacy-first design.

---

## New API Routes

| Route | Method | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/partner/stats` | GET | Firebase `partner` role | Returns all metrics for the authenticated partner |
| `/api/partner/impact-report` | GET | Firebase `partner` role | Generates + returns quarterly PDF report |
| `/api/admin/partners` | GET / POST / PATCH | Admin only | Create/manage partner accounts, assign tiers and partnerIds |

---

## Firebase Analytics Event Schema

Log these events from existing platform components — all anonymized at collection:

```typescript
// Partner content viewed
logEvent(analytics, 'partner_content_viewed', {
  partner_id: 'org_usaa_001',      // internal hashed ID, never user ID
  content_type: 'mission_sponsor', // 'ngo' | 'vbp' | 'mission_sponsor'
  page: '/health',
});

// Click-through to partner's external site
logEvent(analytics, 'partner_click_through', {
  partner_id: 'org_usaa_001',
  destination: 'external',         // never log the actual URL
});

// Veteran saves partner resource to Sea Bag
logEvent(analytics, 'partner_resource_saved', {
  partner_id: 'org_usaa_001',
  resource_type: 'ngo_spotlight',
});

// Mission step completed with partner branding
logEvent(analytics, 'mission_step_completed', {
  partner_id: 'org_usaa_001',
  mission_id: 'financial_transition',
  step: 3,
});
```

---

## UI Components

| Component | Path | Description |
| :--- | :--- | :--- |
| `PartnerDashboard` | `src/app/partner/page.tsx` | Main dashboard page, role-gated |
| `MetricCard` | `src/components/partner/MetricCard.tsx` | Reusable stat card (views, clicks, saves, trend) |
| `DemographicsChart` | `src/components/partner/DemographicsChart.tsx` | Branch/era breakdown — use Recharts |
| `MissionFunnelChart` | `src/components/partner/MissionFunnelChart.tsx` | Step completion funnel for Mission Sponsors |
| `ImpactReportButton` | `src/components/partner/ImpactReportButton.tsx` | Triggers PDF download via `@react-pdf/renderer` |
| `PartnerGuard` | `src/components/common/PartnerGuard.tsx` | Firebase role check middleware |

---

## Implementation Phases

### Phase 1 — Foundation (Month 3–4, alongside Local Directory build)
- [ ] Add `partner` Firebase custom claim + `PartnerGuard` middleware
- [ ] Build `/api/partner/stats` reading from MongoDB analytics collection
- [ ] Build basic `PartnerDashboard` with `MetricCard` components (views, clicks, saves)
- [ ] Build `/api/admin/partners` — create/manage partner accounts
- [ ] Wire `partner_content_viewed` and `partner_click_through` Firebase Analytics events

### Phase 2 — Full Tier Features (Month 5–6, before first Mission Sponsor pitch)
- [ ] Add `DemographicsChart` with 25-user anonymization guard
- [ ] Build `MissionFunnelChart` for Mission Sponsor tier
- [ ] Implement `ImpactReportButton` — PDF via `@react-pdf/renderer`
- [ ] Weekly email digest for Anchor Partners (SendGrid or Resend)

### Phase 3 — Self-Service (Month 8+)
- [ ] Partner self-onboarding flow (apply → approve → portal access)
- [ ] Read-only API key for Anchor Partners (rate-limited)
- [ ] Anonymous benchmark comparison ("your engagement vs. platform average")

---

## How the Dashboard Closes Deals

When USAA or Veterans United asks *"what's my ROI?"*, you open a live portal showing:

- 847 veterans viewed their Mission Sponsorship branding this month
- 312 clicked through to their site
- 89 saved their resource to the Sea Bag
- Top engaging demographic: Post-9/11, Army, Pennsylvania + Texas

That is a completely different sales conversation than "trust us, it's working." The dashboard is what separates a one-month trial from a 12-month $1,500/mo committed deal.
