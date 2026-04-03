<!-- Status: ACTIVE | Last Updated: 2026-03-04 -->
# Admin Dashboard Reconnaissance Report

**Date:** March 4, 2026  
**Target Directory:** `src/app/admin/`  
**Scope:** Existing infrastructure analysis — no code modifications  
**Status:** Reconnaissance complete

---

## Executive Summary

The Admin Dashboard is a **UI-only prototype with zero backend integration**. It consists of 3 static pages with hardcoded sample data, no API routes, no database queries, and no authentication. The dashboard presents a polished visual interface but is **completely non-functional** for actual administrative operations. There is **no infrastructure** for tracking user feedback, LLM chat logs, or flagged resources within the admin panel itself, though **frontend feedback collection components exist** in the Symptom Finder that log to browser console and Firebase Analytics.

---

## 1. Current Admin Dashboard Architecture

### 1A. File Structure

```
src/app/admin/
├── layout.tsx              (68 lines)  — Sidebar navigation + header shell
├── page.tsx                (90 lines)  — Main dashboard with 3 cards + hardcoded stats
├── community-qa/
│   └── page.tsx           (135 lines) — Q&A moderation UI (static sample data)
└── pathways/
    └── page.tsx           (113 lines) — Pathway management UI (static sample data)
```

**Total:** 4 files, 406 lines of code, **zero API calls**.

### 1B. Features Claimed vs. Implemented

| Feature | UI Exists? | Backend Exists? | Database Collection? | Status |
|:--------|:-----------|:----------------|:---------------------|:-------|
| **Resource Pathways Management** | ✅ Yes | ❌ No | ❌ No | UI shell only |
| **Community Q&A Moderation** | ✅ Yes | ❌ No | ❌ No | Hardcoded 3 sample questions |
| **NGO Management** | ⚠️ Link only | ❌ No | ❌ No | `/admin/ngos` route does not exist |
| **Quick Stats (Active Pathways, Pending Questions, Info Requests)** | ✅ Yes | ❌ No | ❌ No | Hardcoded numbers: 12, 8, 15 |
| **User Feedback Tracking** | ❌ No | ❌ No | ❌ No | Not in admin panel |
| **LLM Chat Logs** | ❌ No | ❌ No | ❌ No | Not tracked anywhere |
| **Flagged Resources** | ❌ No | ❌ No | ❌ No | Not implemented |

---

## 2. Detailed Component Analysis

### 2A. Main Dashboard (`src/app/admin/page.tsx`)

**Purpose:** Landing page with overview cards and quick stats.

**Current Implementation:**
- 3 static cards linking to:
  - `/admin/pathways` (exists)
  - `/admin/community-qa` (exists)
  - `/admin/ngos` (does NOT exist — 404)
- Hardcoded "Quick Stats" section:
  ```tsx
  <p className="text-2xl font-semibold text-gray-900">12</p>  // Active Pathways
  <p className="text-2xl font-semibold text-gray-900">8</p>   // Pending Questions
  <p className="text-2xl font-semibold text-gray-900">15</p>  // Info Requests
  ```
- **No data fetching, no API calls, no state management.**

**Missing:**
- Real-time metrics from database
- Activity feed
- System health indicators
- Task lists
- Resource submission queue
- User verification queue

### 2B. Community Q&A Page (`src/app/admin/community-qa/page.tsx`)

**Purpose:** Moderate veteran questions about NGO resources.

**Current Implementation:**
- Hardcoded array of 3 sample questions:
  ```tsx
  {
    id: '1',
    question: 'Does the VA hospital in Richmond offer specialized PTSD treatment?',
    ngoName: 'VA Health Services',
    askedBy: 'John D.',
    status: 'pending',
    date: '2025-04-20'
  }
  ```
- Filter dropdown (non-functional — no state management)
- Action buttons (`View & Answer`, `Verify`, `Hide`) with no event handlers
- Hidden modal placeholder (never shown)

**Missing:**
- API route to fetch questions from database
- Database collection for Q&A storage
- Form submission handlers
- Status update logic
- Pagination

### 2C. Resource Pathways Page (`src/app/admin/pathways/page.tsx`)

**Purpose:** Manage multi-step resource journeys for veterans.

**Current Implementation:**
- Hardcoded array of 3 sample pathways:
  ```tsx
  {
    id: '1',
    title: 'PTSD Treatment Journey',
    category: 'Health',
    steps: 5,
    active: true
  }
  ```
- `Create New Pathway` button with no handler
- `Edit` and `Activate/Deactivate` buttons with no handlers
- Hidden modal placeholder (never shown)

**Missing:**
- API route to fetch/create/update pathways
- Database collection for pathway storage
- Pathway builder UI
- Step management logic
- Resource linking system

### 2D. Admin Layout (`src/app/admin/layout.tsx`)

**Purpose:** Sidebar navigation and header wrapper.

**Current Implementation:**
- Static sidebar with 5 links:
  - Dashboard (`/admin`)
  - Resource Pathways (`/admin/pathways`)
  - Community Q&A (`/admin/community-qa`)
  - NGO Management (`/admin/ngos`) — **broken link, route does not exist**
  - Back to Site (`/`)
- No authentication check
- No role-based access control
- No user profile display

**Missing:**
- Auth middleware
- Role/permission system
- User session display
- Logout functionality

---

## 3. Database Collections Analysis

### 3A. Collections Referenced in Codebase (Not Admin)

The following MongoDB collections exist and are queried by **other parts of the app** (not the admin dashboard):

| Collection | Queried By | Purpose |
|:-----------|:-----------|:--------|
| `healthResources` | `mongoResourceService.ts` | VA/NGO/State health resources for chatbot |
| `educationResources` | `mongoResourceService.ts` | Education resources for chatbot |
| `lifeAndLeisureResources` | `mongoResourceService.ts` | Life & leisure resources for chatbot |
| `careerResources` | `mongoResourceService.ts` | Career resources for chatbot |
| `localResources` | `localResourceService.ts` | Location-based resources (VA facilities, support groups) |
| `symptomResources` | `mongodb.ts` | Symptom-optimized health resources |
| `ngos` | `resource-pathways/route.ts` | NGO directory |
| `resourcePathways` | `resource-pathways/route.ts` | Multi-step resource journeys |
| `followUps` | `followUpService.ts` | Crisis follow-up scheduling |
| `analytics` | `resourceAnalytics.ts` | **Firebase Analytics events** |
| `users/{uid}/searchHistory` | `useSearchHistory.ts` | **Firestore subcollection** for user search history |

### 3B. Collections That Should Exist (But Don't)

Based on the admin UI mockups and blueprint, these collections are **missing**:

| Collection | Purpose | Admin Feature |
|:-----------|:--------|:--------------|
| `communityQuestions` | Store veteran Q&A about resources | Community Q&A moderation |
| `resourceReviews` | Track resource submission/approval workflow | Resource management |
| `verificationRequests` | Military verification documents/status | User verification queue |
| `moderationQueue` | Flagged content for review | Content moderation |
| `adminUsers` | Admin accounts with roles/permissions | Access control |
| `auditLog` | Admin action history | Compliance/security |

---

## 4. API Routes Analysis

### 4A. Existing API Routes (Non-Admin)

The following API routes exist in `src/app/api/` but are **not used by the admin dashboard**:

| Route | Purpose | Collections Used |
|:------|:--------|:-----------------|
| `/api/ai/chat` | General chatbot | MongoDB resources via `mongoResourceService` |
| `/api/health/symptom-triage` | Symptom Finder triage wizard | None (Grok AI only, static fallback) |
| `/api/health/medical-detective` | Records Recon PDF scan | None (in-memory processing) |
| `/api/health/records-recon` | Records Recon upload | None (streaming response) |
| `/api/ngos` | NGO directory listing | `ngos` |
| `/api/resource-pathways` | Pathway CRUD | `resourcePathways`, `ngos` |
| `/api/community-qa` | **Exists but unused** | Unknown (not implemented) |
| `/api/health-resources` | Health resource search | `healthResources` |
| `/api/symptom-resources` | Symptom-based search | `symptomResources` |

### 4B. Missing Admin API Routes

The admin dashboard **requires** these API routes, which **do not exist**:

| Route | Purpose | HTTP Methods |
|:------|:--------|:-------------|
| `/api/admin/pathways` | Pathway management | GET, POST, PUT, DELETE |
| `/api/admin/community-qa` | Q&A moderation | GET, PUT |
| `/api/admin/ngos` | NGO management | GET, POST, PUT, DELETE |
| `/api/admin/resources` | Resource review/approval | GET, PUT |
| `/api/admin/users` | User management | GET, PUT |
| `/api/admin/verifications` | Military verification queue | GET, PUT |
| `/api/admin/analytics` | Dashboard metrics | GET |
| `/api/admin/moderation` | Content moderation | GET, PUT |
| `/api/admin/feedback` | User feedback review | GET |
| `/api/admin/llm-logs` | LLM chat history | GET |

**Status:** **Zero admin API routes exist.**

---

## 5. User Feedback Infrastructure

### 5A. Frontend Feedback Collection (Symptom Finder Only)

**Location:** `src/app/health/components/symptom-finder/components/`

Two feedback components exist for the **Symptom Finder feature only**:

#### `ResourceFeedback.tsx` (189 lines)
- Collects per-resource feedback: rating (1–5 stars), helpful (yes/no), comment
- Uses `useAnalytics()` hook to submit feedback
- **Current behavior:** Logs to browser console only
- **No database storage, no admin visibility**

#### `FeedbackCollector.tsx` (246 lines)
- Collects overall Symptom Finder experience feedback
- Tracks: rating (1–5), found what needed (yes/no), easy to use (yes/no), comment
- Uses `useAnalytics()` hook to track event
- **Current behavior:** Logs to browser console only
- **No database storage, no admin visibility**

### 5B. Analytics Hooks

#### `useAnalytics.ts` (197 lines) — Symptom Finder
- **Status:** Console-only logging, no backend integration
- Comment on line 46: `"In the future, this would initialize Firebase Analytics"`
- Comment on line 102: `"In a production environment, we would also send the event to the server"`
- **No API calls, no database writes**

#### `resourceAnalytics.ts` (439 lines) — Firebase Analytics Integration
- **Status:** Fully implemented with Firebase Analytics + Firestore
- Tracks: `resource_view`, `resource_click`, `resource_save`, `resource_feedback`, `search_performed`, etc.
- Writes to Firestore collection: `analytics`
- Uses Firebase Analytics `logEvent()` for real-time tracking
- **This is NOT connected to the admin dashboard**

### 5C. Feedback Data Flow

```
User submits feedback
  ↓
ResourceFeedback.tsx → useAnalytics().submitFeedback()
  ↓
console.log('Feedback submitted:', fullFeedback)  ← STOPS HERE
  ↓
[MISSING] POST /api/feedback
  ↓
[MISSING] MongoDB collection: feedbackSubmissions
  ↓
[MISSING] Admin dashboard feedback viewer
```

**Conclusion:** Feedback is collected but **never persisted or surfaced to admins**.

---

## 6. LLM Chat Logs Infrastructure

### 6A. Current LLM Logging

**Search Results:** Zero references to `chatLogs`, `llmLogs`, `conversationHistory`, or `aiInteractions` in the codebase.

**LLM Subsystems:**
1. **Symptom Triage** (`/api/health/symptom-triage`) — No logging
2. **Medical Detective** (`/api/health/medical-detective`) — No logging
3. **General Chatbot** (`/api/ai/chat`) — No logging

**Grok API Calls:**
- All three subsystems make direct `fetch()` calls to `https://api.x.ai/v1/chat/completions`
- Requests and responses are **not logged to any database**
- Only `console.log()` statements exist for debugging

### 6B. What Should Be Logged (Per LLM Audit Report)

From `.workflow/llm-architecture-audit-report.md` Section 7C:

> **No request/response logging** — Can't audit what Grok returns for quality improvement  
> **No token usage tracking** — Can't monitor API costs per feature

**Recommendation:** Implement a `chatLogs` collection with:
- `sessionId`, `userId`, `feature` (triage/detective/chatbot)
- `systemPrompt`, `userMessage`, `aiResponse`
- `model`, `temperature`, `tokensUsed`, `latencyMs`
- `timestamp`, `crisisDetected`, `resourcesReturned`

### 6C. Conversation History

**User Profile Service** (`src/lib/ai/userProfileService.ts`):
- Stores veteran profile in-memory only (Map data structure)
- Extracts: service branch, era, conditions, interests
- **Not persisted to database**
- **Not accessible to admin dashboard**

**Chatbot Conversation:**
- Stateless — each API call is independent
- No conversation threading
- No multi-turn context beyond what the frontend sends in the `messages` array

---

## 7. Flagged Resources Infrastructure

### 7A. Resource Flagging

**Search Results:** Zero references to `flaggedResources`, `reportedResources`, or `resourceReports`.

**Current Resource Collections:**
- `healthResources`, `educationResources`, `careerResources`, etc.
- No `isFlagged` or `reportCount` fields
- No user reporting mechanism

### 7B. Content Moderation

**Admin Blueprint** (`.workflow/admin-dashboard-blueprint.md`) specifies:
- Content Moderation Module with moderation queue
- Reported content review system
- Keyword filtering management
- Appeals system

**Current Status:** **None of this exists.**

---

## 8. Firebase Integration

### 8A. Firebase Analytics (Active)

**File:** `src/app/lib/analytics/resourceAnalytics.ts`

**Collections Used:**
- `analytics` (Firestore) — Stores detailed event data
- Firebase Analytics — Real-time event tracking

**Events Tracked:**
- `resource_view`, `resource_click`, `resource_save`, `resource_unsave`
- `resource_feedback`, `search_performed`, `filter_applied`
- `category_selected`, `symptom_selected`, `severity_selected`
- `pathway_started`, `pathway_completed`, `pathway_abandoned`

**Admin Access:** **None** — No admin UI to view this data.

### 8B. Firebase Auth (Mentioned)

**File:** `src/app/lib/firebase/useAuth.ts` (referenced in `resourceAnalytics.ts`)

**Status:** Auth hook exists, but admin dashboard has **no authentication**.

---

## 9. Gap Analysis: Blueprint vs. Reality

### 9A. Admin Dashboard Blueprint (`.workflow/admin-dashboard-blueprint.md`)

The blueprint defines a comprehensive 392-line specification with:
- 7 major modules (Overview, Resource Mgmt, User Mgmt, Moderation, Analytics, System Config)
- 20+ API endpoints
- 3 database schemas (AdminUser, ResourceReview, VerificationRequest)
- Security features (RBAC, 2FA, audit logging)
- Analytics dashboards with visualizations

### 9B. Current Implementation

| Blueprint Feature | Implementation Status | Gap |
|:------------------|:---------------------|:----|
| Main Dashboard with real-time metrics | Hardcoded numbers | 100% gap |
| Resource Management Module | UI shell only | 95% gap |
| User Management Module | Does not exist | 100% gap |
| Content Moderation Module | Does not exist | 100% gap |
| Analytics & Reporting | Does not exist | 100% gap |
| System Configuration | Does not exist | 100% gap |
| Military Verification Queue | Does not exist | 100% gap |
| API Endpoints (20+) | 0 exist | 100% gap |
| Database Schemas | 0 exist | 100% gap |
| Authentication/Authorization | Does not exist | 100% gap |

**Overall Implementation:** ~2% of blueprint (UI mockups only)

---

## 10. Recommendations

### 10A. Immediate Actions (MVP Admin Dashboard)

1. **Create `/api/admin/analytics` route** to aggregate Firebase Analytics data for dashboard display
2. **Implement feedback persistence:**
   - Add `/api/admin/feedback` POST endpoint
   - Create `feedbackSubmissions` collection
   - Update `useAnalytics.ts` to call API instead of console.log
3. **Add LLM logging:**
   - Create `chatLogs` collection
   - Modify all 3 LLM subsystems to log requests/responses
   - Add `/api/admin/llm-logs` GET endpoint
4. **Build resource flagging:**
   - Add "Report Resource" button to resource cards
   - Create `resourceReports` collection
   - Add `/api/admin/moderation/resources` endpoint

### 10B. Phase 1 Backend (Post-Funding)

5. **Implement admin authentication:**
   - Firebase Auth with admin role claims
   - Middleware for `/api/admin/*` routes
   - Role-based UI rendering in admin layout
6. **Build pathway management:**
   - `/api/admin/pathways` CRUD endpoints
   - Connect to existing `resourcePathways` collection
   - Implement pathway builder UI
7. **Build Q&A moderation:**
   - Create `communityQuestions` collection
   - `/api/admin/community-qa` endpoints
   - Connect to existing UI

### 10C. Phase 2 Full Admin Suite

8. **User management module** with verification queue
9. **Content moderation system** with automated flagging
10. **Advanced analytics dashboards** with Chart.js/D3.js
11. **Audit logging** for all admin actions
12. **Scheduled tasks** for resource re-verification

---

## 11. Summary

The Admin Dashboard is a **visual prototype only**. It demonstrates UI/UX design but has **zero functional backend**. The infrastructure for tracking user feedback, LLM chat logs, and flagged resources **does not exist within the admin panel**, though **frontend feedback collection exists** in the Symptom Finder (logging to console and Firebase Analytics, but not surfaced to admins).

**Key Findings:**
- ✅ **Polished UI mockups** for pathways, Q&A, and dashboard
- ❌ **Zero admin API routes**
- ❌ **Zero admin database collections**
- ❌ **No authentication or authorization**
- ❌ **No LLM request/response logging**
- ❌ **No user feedback admin viewer**
- ❌ **No resource flagging system**
- ⚠️ **Firebase Analytics active** but not connected to admin UI

**Recommendation:** Prioritize building the backend API layer and database schema before expanding the admin UI. The blueprint provides an excellent roadmap, but implementation is 0–2% complete.
