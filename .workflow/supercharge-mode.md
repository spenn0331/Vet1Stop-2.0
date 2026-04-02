# Vet1Stop Supercharge Mode — CTO Architecture Plan

**Author:** Cascade (CTO Advisory)
**Created:** March 28, 2026
**Repo:** [github.com/spenn0331/Vet1Stop-2.0](https://github.com/spenn0331/Vet1Stop-2.0)
**Participants:** Sean Penny (CEO/Founder) · Josh Diehl (CTO)
**Status:** Active — reference this before every parallel session

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Phase 0: The 30-Minute Foundation](#phase-0-the-30-minute-foundation)
3. [Core Concept: Lanes and Bridges](#core-concept-lanes-and-bridges)
4. [The Prompt Template](#the-prompt-template)
5. [How Parallel Sessions Work](#how-parallel-sessions-work)
6. [Supercharge Session Flow](#supercharge-session-flow)
7. [Practical Tips](#practical-tips)
8. [Project Dependency Map](#project-dependency-map)
9. [Danger Zone Files](#danger-zone-files)
10. [n8n Integration Plan (Immediate)](#n8n-integration-plan-immediate)
11. [AI Team Sync Architecture](#ai-team-sync-architecture)
12. [2-Week Sprint Plan](#2-week-sprint-plan)
13. [Summary Checklist](#summary-checklist)

---

## Executive Summary

Vet1Stop's Next.js App Router architecture is ~80% parallel-friendly out of the box. Each page (Health, Education, Careers, Local, Auto-Fill) lives in its own directory with its own components. Three small structural fixes unlock the ability to run 2–3 parallel AI Cascades per machine, across both Sean and Josh's workstations — enabling 4–6 simultaneous work streams.

Additionally, n8n (codename: **Operations**) will be integrated immediately as a workflow automation backbone for dev operations, content freshness, lead capture, and data pipelines — not deferred to post-launch. It also serves as the nervous system that keeps the full AI executive team in sync: **Chief of Staff** (Notion AI), **Architect** (Claude Desktop), **Advisor** (Gemini), **Counsel** (Grok), **Lead Dev** (Windsurf), and **QA** (Cursor). See `.workflow/ai-command-center.md` for the full team roster and sync architecture.

With the addition of Claude Desktop (Architect), Sean's machine can now run **3 parallel build streams**: 1 autonomous Architect lane + 2 interactive Lead Dev Cascade tabs. Combined with Josh's machine, this enables up to **6–8 parallel work streams**.

---

## Phase 0: The 30-Minute Foundation

These are non-negotiable prerequisites. Without them, parallel Cascades will create more problems than they solve. Complete all three before opening your first parallel session.

### Fix 1 — Enable Git Branch Workflow

**Current state:** Single `main` branch, no protection, no feature branches.

**What to do:**

```bash
# On Sean's machine (C:\Users\penny\Desktop\Vet1Stop)
git checkout main
git pull origin main
```

Then on GitHub (github.com/spenn0331/Vet1Stop-2.0):
- Go to **Settings → Branches → Add branch protection rule**
- Branch name pattern: `main`
- ✅ Require a pull request before merging
- ✅ Require approvals — set to 1

**Branch naming convention:**
- Sean's branches: `sean/<feature-name>` (e.g., `sean/life-leisure-page`)
- Josh's branches: `josh/<feature-name>` (e.g., `josh/local-polish`)

**Creating a branch:**
```bash
git checkout main
git pull origin main
git checkout -b sean/my-feature-name
```

**Merging back (after PR approval):**
```bash
git checkout main
git pull origin main
git merge sean/my-feature-name
git push origin main
```

### Fix 2 — Extract BrowseResourceCard to Shared

**Problem:** `src/app/education/components/EducationBrowseSection.tsx` imports directly from `src/app/health/components/BrowseResourceCard.tsx`. This couples the two biggest pages — if anyone edits BrowseResourceCard for Health purposes, it can break Education.

**Fix:** Move `BrowseResourceCard.tsx` from `src/app/health/components/` to `src/components/shared/BrowseResourceCard.tsx`, then update imports in:
- `src/app/health/components/HealthBrowseSection.tsx` → `import BrowseResourceCard from '@/components/shared/BrowseResourceCard'`
- `src/app/education/components/EducationBrowseSection.tsx` → `import BrowseResourceCard from '@/components/shared/BrowseResourceCard'`

**Time:** 5 minutes.
**Impact:** Fully decouples Health and Education pages for parallel work.

### Fix 3 — Extract Nav Config from Header

**Problem:** `src/components/common/Header.tsx` must be manually edited every time a new page is added. This makes it a merge conflict magnet when multiple Cascades try to add pages simultaneously.

**Fix:** Create a config file:

```typescript
// src/constants/navigation.ts
export const NAV_ITEMS = [
  { label: 'Health', href: '/health' },
  { label: 'Education', href: '/education' },
  { label: 'Careers', href: '/careers' },
  { label: 'Local', href: '/local' },
  // New pages just add a line here — no Header.tsx edit needed
];
```

Then `Header.tsx` maps over `NAV_ITEMS` instead of hardcoding links. Multiple Cascades can add new pages to the config without touching the same component file.

**Time:** 10 minutes.
**Impact:** New pages can be added by editing a simple array — no Header.tsx conflicts.

---

## Core Concept: Lanes and Bridges

Think of the codebase as a **highway with lanes**. Each Cascade gets its own lane (branch + file scope). The only time anyone merges is at a **bridge** (commit checkpoint).

### The Lane Map

| Lane | Branch Pattern | Scope | Touches Shared Infra? |
|------|---------------|-------|----------------------|
| **Life & Leisure** | `sean/life-leisure` or `josh/life-leisure` | `src/app/life/*`, `src/app/api/life/*` | ❌ No — brand new directory |
| **Careers Build-Out** | `sean/careers-api` or `josh/careers-api` | `src/app/careers/*`, `src/app/api/careers/*` | ❌ No — self-contained |
| **Health Phase 2 Tools** | `sean/health-rating-calc` | `src/app/health/tools/*` (new sub-routes) | ❌ No — new sub-route |
| **Local VOB Polish** | `josh/local-polish` | `src/app/local/*`, `src/data/businesses.ts` | ❌ No — isolated data |
| **Auto-Fill Enhancements** | Either | `src/app/auto-fill/*` | ❌ No — fully self-contained |
| **n8n Workflows** | `sean/n8n-setup` or `josh/n8n-setup` | `n8n/`, external n8n instance | ❌ No — separate system |

### Safe Parallel Combinations

These page pairs can ALWAYS be worked on simultaneously without conflict:

| Cascade A | Cascade B | Why It's Safe |
|-----------|-----------|--------------|
| Careers page work | Local page work | Zero shared imports, zero shared components, no shared API routes |
| Careers page work | Health sub-tools (wellness, scribe, C&P) | No coupling at all |
| Local page work | Health sub-tools (wellness, scribe, C&P) | No coupling at all |
| Auto-Fill page | Any other page | Fully self-contained |
| Any new page (e.g., Life & Leisure) | Careers OR Local | New page = no existing imports to conflict |
| n8n workflow setup | Any page build | Completely separate system |

### Risky Parallel Combinations (Coordinate First)

| Cascade A | Cascade B | Conflict Point |
|-----------|-----------|---------------|
| Health browse section | Education browse section | Both use `BrowseResourceCard.tsx` (Fix 2 resolves this) |
| Any two pages editing `layout.tsx` | Each other | Single root layout = instant conflict |
| Any two features adding new API routes that modify `mongodb.ts` | Each other | Shared DB connection singleton |

---

## The Prompt Template

**Copy-paste this into every new Cascade tab as the opening message.** Replace `[feature-name]` and `[page]` with the specific task.

```markdown
## LANE CONSTRAINT (NEVER VIOLATE)

You are working on branch: `sean/[feature-name]`
Your scope is ONLY: `src/app/[page]/*` and `src/app/api/[page]/*`

FORBIDDEN files (do NOT read, edit, or import from):
- src/app/layout.tsx
- src/components/common/Header.tsx
- src/components/common/Footer.tsx
- src/app/globals.css
- package.json / package-lock.json
- tailwind.config.js / next.config.js
- src/lib/mongodb.ts
- Any file in another page's directory (e.g., src/app/health/* if you're on careers)

Rules:
- If you need a shared component, import from src/components/shared/ only
- If you need a new npm package, STOP and ask me — do not install it
- Commit message format: "feat(page): description" or "fix(page): description"
- Read .workflow/project_status.md and .workflow/master-strategy.md for context
- Follow the patriotic color scheme and existing design patterns
- Ensure mobile-responsive layouts and accessibility (ARIA labels, keyboard nav)
```

---

## How Parallel Sessions Work

### What Is a "Cascade"?

A Cascade is a **separate chat tab** in Windsurf. You open a new one by clicking the **+** button in the tab bar at the top of the chat panel. Each tab:
- Has its own conversation context and memory
- Can read and edit files independently
- Runs its own AI agent
- **Shares the same filesystem** — which is why lane discipline matters

### Scenario 1: Solo — Multiple Builders on One Machine

```
Sean's Machine (C:\Users\penny\Desktop\Vet1Stop)
├── Claude Desktop (Architect)  → Life & Leisure (autonomous) → src/app/life/*
├── Windsurf Tab 1 (Lead Dev)   → Careers API (interactive)   → src/app/careers/*
└── Windsurf Tab 2 (Lead Dev)   → Rating Calculator           → src/app/health/tools/*
```

Architect works autonomously on a larger feature while Lead Dev handles rapid-iteration tasks in Windsurf tabs. All three share the same local files — lane discipline keeps them from colliding. When committing, stage only your lane's files:

```bash
# Cascade 1's work
git add src/app/life/ src/app/api/life/
git commit -m "feat(life): page shell + hero"

# Cascade 2's work
git add src/app/careers/ src/app/api/careers/
git commit -m "feat(careers): job search API route"
```

### Scenario 2: Sean + Josh — Two Machines

```
Sean's Machine                              Josh's Machine
├── Claude Desktop (Architect) → Life & Leisure  ├── Windsurf Tab 1 → josh/local-polish
├── Windsurf Tab 1 → sean/health-rating         └── Windsurf Tab 2 → josh/careers-build
└── Windsurf Tab 2 → sean/flare-buddy
```

Each machine pushes to its own branches on GitHub. Merges happen via Pull Requests. Zero risk of collision as long as lanes are respected.

### Scenario 3: Maximum Supercharge (Both Machines, All Builders)

```
Sean: Claude Desktop (Architect, 1 lane) + Windsurf (Lead Dev, 2 tabs) = 3 streams
Josh: Windsurf (Lead Dev, 2–3 tabs) = 2–3 streams
─────────────────────────────────────────────────────────────────
= 5–6 parallel build streams (up from 4–6 without Architect)
```

If Josh also adds Claude Desktop on his machine, that's potentially **8 parallel streams**.

### Recommended Limits

| Setup | Max Streams | Notes |
|-------|------------|-------|
| Solo (one machine) | 3 | 1 Architect + 2 Lead Dev tabs |
| Solo without Claude Desktop | 2–3 | 2 Lead Dev tabs is the sweet spot |
| Two machines (one has Claude Desktop) | 5–6 | Architect takes largest feature autonomously |
| Two machines (both have Claude Desktop) | 6–8 | Max throughput — requires strict lane discipline |
| Any setup | Never >3 per machine | Diminishing returns + collision risk |

---

## Supercharge Session Flow (Step by Step)

### TIME 0:00 — SETUP (5 min)

```bash
git checkout main && git pull origin main
```

Open Claude Desktop for the autonomous lane (if using Architect). Open 1–2 Windsurf Cascade tabs for interactive lanes. Paste the lane constraint prompt into each with the specific feature/scope.

Update the Active Work table in `project_status.md`:

```markdown
## Active Work (Update Before Starting)
| Who  | Branch                   | Working On              | Files Touched        |
|------|--------------------------|-------------------------|----------------------|
| Sean | sean/life-leisure        | Life & Leisure MVP      | src/app/life/*       |
| Sean | sean/health-rating       | VA Rating Calculator    | src/app/health/tools/*|
| Josh | josh/careers-build       | Careers API + Search    | src/app/careers/*    |
```

### TIME 0:00–0:45 — BUILD (parallel)

Each Cascade works independently in its lane. Check in on each tab every 15–20 minutes to make sure it's on track and hasn't drifted outside its scope.

### TIME 0:45 — BRIDGE CHECKPOINT (5 min)

- Each Cascade commits its lane's files
- YOU review: "Did any Cascade touch a file outside its lane?"
- Quick check: `git diff --name-only`
- If clean → continue
- If dirty → revert out-of-scope changes (`git checkout -- <file>`), re-prompt that Cascade

```bash
# Review what changed
git diff --name-only

# Commit only lane-specific files
git add src/app/life/ src/app/api/life/
git commit -m "feat(life): hero section + mission cards"
```

### TIME 0:50–1:30 — BUILD (parallel, round 2)

Cascades continue building. Deeper features, wiring to APIs, polish.

### TIME 1:30 — MERGE SEQUENCE (10 min, sequential)

```bash
git checkout main
git merge sean/smallest-feature    # safest first
git merge sean/next-feature        # independent
git merge sean/largest-feature     # largest last
git push origin main
```

If Josh is also merging, he opens PRs on GitHub and Sean approves (or vice versa).

### TIME 1:40 — DONE

Update `.workflow/project_status.md` with what shipped. Clear Active Work table rows.

---

## Practical Tips

1. **Name your Cascade tabs clearly** — Start each conversation with the feature name so the truncated tab label is useful (e.g., "Life & Leisure Page Build" not "Can you help me…")

2. **Never run `npm install` in two Cascades simultaneously** — One Cascade installs, the others pick it up automatically. Concurrent installs corrupt `node_modules` and `package-lock.json`.

3. **Check in on tabs every 15–20 minutes** — AI Cascades can drift if unsupervised for too long. Quick scan of what it's doing prevents runaway edits.

4. **Smallest merge first** — When merging multiple branches, merge the smallest/safest one first. If something breaks, you know which merge caused it.

5. **One Danger Zone edit per session** — If you need to update Header/Footer/layout, do it in ONE Cascade, commit, then resume the others.

6. **Commit before context-switching** — Before jumping to another Cascade tab, make sure the current one has committed its work.

7. **Don't let Cascades install packages** — The lane constraint prompt says "STOP and ask me." This prevents two Cascades from both running `npm install` and corrupting the lockfile.

8. **Review diffs before every commit** — Windsurf sometimes changes files you didn't ask it to. Open Source Control panel, scan the diff, unstage unrelated files.

9. **Use `git stash` if switching branches on same machine** — If you need to temporarily switch branches:
   ```bash
   git stash           # saves current work
   git checkout main   # switch
   git stash pop       # restore work when you switch back
   ```

10. **Communicate with Josh** — Before each session, quick text: "I'm working on Life & Leisure and Health Rating Calc today. You good for Careers and Local?" Update the Active Work table.

---

## Project Dependency Map

### Shared Infrastructure (Every Page Touches)

| File | What It Does | Who Uses It |
|------|-------------|-------------|
| `src/app/layout.tsx` | Root layout — Header, Footer, AuthProvider, QueryClient, AI chatbot | ALL pages |
| `src/components/common/Header.tsx` | Site-wide navigation | All pages via layout |
| `src/components/common/Footer.tsx` | Site-wide footer | All pages via layout |
| `src/contexts/AuthContext.tsx` | Firebase auth state | Layout + signin/signup |
| `src/components/ai/AILayoutWrapper.tsx` | Global AI chatbot overlay | All pages via layout |
| `src/lib/mongodb.ts` | MongoDB connection singleton | 26 API routes |
| `src/lib/firebase.ts` / `firebase-admin.ts` | Firebase Auth + Analytics | Auth pages + API routes |
| `src/lib/ai/grokService.ts` | Grok API client | AI chat, health, education APIs |
| `src/lib/ai/promptBuilder.ts` | Shared prompt construction | AI API routes |
| `src/app/globals.css` | Global Tailwind styles | All pages |
| `tailwind.config.js` / `tsconfig.json` / `next.config.js` | Build config | Everything |
| `src/constants/navigation.ts` | Nav link config (after Fix 3) | Header.tsx |

### Page Independence Matrix

| Page | Imports From Other Pages? | Shared Components Used | Own API Routes | Database |
|------|--------------------------|----------------------|----------------|----------|
| **Health** (101 items) | ❌ None | `AutoFillButton` | 11 health routes | MongoDB |
| **Education** (9 items) | ⚠️ `BrowseResourceCard` from Health (Fix 2 resolves) | `AutoFillButton` | 2 education routes | MongoDB |
| **Careers** (12 items) | ❌ None | None (fully self-contained) | None yet | None |
| **Local** (5 items) | ❌ None | None | None | `src/data/businesses.ts` (static) |
| **Auto-Fill** (2 items) | ❌ None | None | None visible | Client-only (localStorage) |

**After Fix 2 (BrowseResourceCard extraction), every page is fully independent.**

### Cross-Page Import Detail

The only cross-page import in the entire codebase:

**File:** `src/app/education/components/EducationBrowseSection.tsx` lines 19–23
```typescript
import BrowseResourceCard, {
  BrowseResourceSkeleton,
  readResourcePrefs,
} from '@/app/health/components/BrowseResourceCard';
import type { BrowseResource } from '@/app/health/components/BrowseResourceCard';
```

**Fix 2 eliminates this.** After the move, both pages import from `@/components/shared/BrowseResourceCard`.

---

## Danger Zone Files

These files must only ever be edited by **ONE Cascade at a time**. If any Cascade needs to touch one, all other Cascades pause until it's committed.

| File | Why It's Dangerous | When You'd Need to Edit It |
|------|-------------------|---------------------------|
| `src/app/layout.tsx` | Root layout — every page renders through this | Adding a new provider, changing layout structure |
| `src/components/common/Header.tsx` | Global nav — adding links = conflict | Adding a new page link (mitigated by Fix 3) |
| `src/components/common/Footer.tsx` | Same as Header | Adding footer links |
| `src/app/globals.css` | Global styles — concurrent edits = merge hell | Adding global CSS classes or variables |
| `src/lib/mongodb.ts` | DB singleton — schema changes affect 26 API routes | Changing connection logic or adding new collections |
| `src/contexts/AuthContext.tsx` | Auth state — touches layout + auth pages | Adding auth roles or changing auth flow |
| `tailwind.config.js` | Custom theme — affects all pages | Adding colors, fonts, custom utilities |
| `next.config.js` | Build config — affects everything | Adding redirects, env vars, image domains |
| `package.json` / `package-lock.json` | Concurrent npm install = corrupted lockfile | Installing new dependencies |
| `.workflow/*.md` | Planning docs — two writers = text conflicts | Updating project status or strategy |
| `src/components/shared/BrowseResourceCard.tsx` | Used by Health AND Education (after Fix 2) | Changing the card layout or props |

**Protocol for Danger Zone edits:**
1. Announce in Active Work table: "Sean editing layout.tsx — all Cascades pause"
2. One Cascade makes the edit
3. Commit and push
4. All other Cascades resume

---

## n8n Integration Plan (Immediate)

n8n is being set up NOW as a core infrastructure tool — not deferred to post-launch.

### Why Now

- Automates repetitive dev operations (commit reminders, build checks)
- Content freshness monitoring prevents stale resources from shipping in MVP
- Lead capture infrastructure must be wired before RERN real estate panel goes live
- Partner data pipelines should be tested before the first pitch
- Low cost ($5/mo self-hosted) fits bootstrap budget
- n8n connects natively to MongoDB, Firebase, GitHub, and email — the entire Vet1Stop stack

### Recommended Setup

**Self-hosted n8n on a $5/mo VPS** (e.g., DigitalOcean, Hetzner, Railway):
- Docker deployment: `docker run -d --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n`
- Persistent volume for workflow data
- Environment variables for MongoDB URI, Firebase credentials, GitHub PAT, email SMTP
- Accessible at `https://n8n.yourdomain.com` (or via SSH tunnel for dev)

**Alternative: n8n Cloud** — $20/mo starter plan, zero DevOps overhead. Good if VPS management is a distraction.

### Immediate n8n Workflows (Build These Now)

#### Workflow 1: Git Commit Reminder Bot
**Trigger:** Cron — every 3 hours during active dev time (9 AM – 11 PM ET)
**Logic:** GitHub API → check last commit timestamp on `main` and active branches → if no commits in 3+ hours → send notification
**Output:** Discord/Slack/email alert: "Hey, it's been 3 hours since your last commit. Time to save your work!"
**Effort:** Small — 1 hour setup

#### Workflow 2: Content Freshness Monitor
**Trigger:** Cron — weekly (Sunday midnight)
**Logic:** MongoDB query → all resources with `url` field → HTTP request to each URL → check for 404, 500, timeout, SSL errors → flag broken resources
**Output:** Email digest to Sean: "3 resources have broken links this week" with list + direct MongoDB IDs for quick fix
**Effort:** Medium — 2-3 hours setup
**Value:** Prevents embarrassing broken links in the MVP demo

#### Workflow 3: Real Estate Lead Capture Pipeline
**Trigger:** Webhook — fires when RERN real estate form is submitted on Local page
**Logic:** Validate form data → save to MongoDB `leads` collection → send notification to partnered VA loan broker → send confirmation email to veteran
**Output:** Lead in DB + broker notified + veteran gets "We'll be in touch" email
**Effort:** Medium — 3-4 hours setup
**Value:** Revenue-generating — this is the RERN that funds the platform

#### Workflow 4: NVWI Data Pipeline
**Trigger:** Cron — weekly (Monday 6 AM)
**Logic:** MongoDB aggregation on `nvwi_cohorts` → compute weekly averages by era/branch/region → generate trend summary → store in `nvwi_weekly_reports` collection
**Output:** Automated trend report + optional email to admin
**Effort:** Medium — 2-3 hours setup
**Value:** Turns raw wellness opt-in data into licensable insights for VA/DoD

#### Workflow 5: NGO of the Month Automation
**Trigger:** Cron — 1st of every month
**Logic:** MongoDB query → all NGOs with ratings → sort by score + engagement metrics → select top NGO → update `ngo_of_the_month` collection → send congratulations email to NGO contact
**Output:** Auto-selected NGO of the Month + notification
**Effort:** Small — 1-2 hours setup
**Value:** Removes manual curation work, keeps the Health page fresh

#### Workflow 6: Partner Analytics Weekly Digest
**Trigger:** Cron — every Monday 8 AM
**Logic:** MongoDB query → partner's click/save/impression stats for past 7 days → format into email-friendly HTML → send to partner contact
**Output:** Weekly ROI email to each paying partner
**Effort:** Medium — 3-4 hours setup (after Partner Dashboard exists)
**Value:** Retention tool — partners see ROI without logging in

#### Workflow 7: New Resource Notification
**Trigger:** MongoDB Change Stream (or polling) — new document in `resources` collection
**Logic:** Detect new resource added → validate fields (title, URL, category) → send admin review notification → if auto-approved, tweet/post announcement
**Output:** Admin alert + optional social media post
**Effort:** Small — 1-2 hours setup

#### Workflow 8: Build Health Monitor
**Trigger:** GitHub webhook — on push to any branch
**Logic:** GitHub API → check latest commit's CI status → if build fails → immediate notification with error summary
**Output:** "Build broken on branch sean/life-leisure — TypeScript error in page.tsx" notification
**Effort:** Small — 1 hour setup (requires GitHub Actions or Netlify build webhook)

### n8n Workflow Priority Order

| Priority | Workflow | When to Build | Why |
|----------|---------|---------------|-----|
| 🔥 1 | Git Commit Reminder | This week | Enforces the 3-hour commit rule for both devs |
| 🔥 2 | Content Freshness Monitor | This week | Catch broken resource links before MVP demo |
| 🔥 3 | Build Health Monitor | This week | Know instantly when a Cascade breaks the build |
| ★ 4 | Real Estate Lead Capture | Before RERN panel goes live | Revenue pipeline |
| 5 | NVWI Data Pipeline | After first 10 wellness opt-ins | Data product foundation |
| 6 | NGO of the Month | After 10+ NGOs in system | Automation convenience |
| 7 | New Resource Notification | After 100+ resources | Admin convenience |
| 8 | Partner Analytics Digest | After Partner Dashboard ships | Partner retention |

### n8n Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    n8n Instance                          │
│              (VPS or n8n Cloud)                          │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Cron     │  │ Webhook  │  │ GitHub   │  ← Triggers  │
│  │ Triggers │  │ Triggers │  │ Webhooks │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
│       │              │              │                    │
│       ▼              ▼              ▼                    │
│  ┌─────────────────────────────────────┐               │
│  │         Workflow Logic              │               │
│  │  (conditions, transforms, API)      │               │
│  └────────────────┬────────────────────┘               │
│                   │                                     │
│       ┌───────────┼───────────┐                        │
│       ▼           ▼           ▼                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                 │
│  │ MongoDB │ │ GitHub  │ │ Email/  │  ← Actions       │
│  │ Atlas   │ │ API     │ │ Discord │                  │
│  └─────────┘ └─────────┘ └─────────┘                 │
└─────────────────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
    Vet1Stop DB    Vet1Stop Repo   Sean & Josh
```

### n8n Environment Variables Needed

```
# MongoDB
MONGODB_URI=mongodb+srv://...

# GitHub
GITHUB_PAT=ghp_...
GITHUB_REPO=spenn0331/Vet1Stop-2.0

# Email (SMTP for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...

# Discord (optional — webhook for alerts)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Firebase (for auth/analytics if needed)
FIREBASE_PROJECT_ID=...
FIREBASE_SERVICE_ACCOUNT_JSON=...
```

---

## File Ownership Guide (Sean vs. Josh Defaults)

To minimize collisions, assign default ownership zones. Either person CAN work in any area, but check with the other first if crossing into their zone.

| Area | Default Owner | Directory |
|------|--------------|-----------|
| Health Page + Tools | Sean | `src/app/health/*` |
| Records Recon Data | Sean | `src/data/records-recon/*` |
| Life & Leisure Page | Josh (or Sean if solo) | `src/app/life/*` |
| Local VOB Directory | Josh | `src/app/local/*` |
| Careers Page | Coordinate | `src/app/careers/*` |
| Education Page | Sean | `src/app/education/*` |
| Auto-Fill | Either | `src/app/auto-fill/*` |
| Shared Components | Coordinate | `src/components/*` |
| API Routes | Coordinate | `src/app/api/*` |
| AI / Chatbot | Sean | `src/lib/ai/*`, `src/components/ai/*` |
| n8n Workflows | Sean (initially) | External n8n instance |
| .workflow Docs | Either | `.workflow/*` |
| Config Files | Coordinate | `package.json`, `tailwind.config.*`, `next.config.*` |

Adjust this table as Josh ramps up and takes on more ownership.

---

## AI Team Sync Architecture

The biggest bottleneck in a multi-AI workflow is **context transfer**. Without automation, Sean is the only one carrying context between tools — opening Notion to copy a priority, then pasting it into Windsurf. Operations (n8n) eliminates this by syncing context automatically.

### The Executive Team

| AI Tool | Nickname | Role | How It Stays Informed |
|---------|----------|------|----------------------|
| **Notion AI** | **Chief of Staff** | Sprint planning, strategy, daily briefings | Operations auto-populates Dev Activity Log + Daily Pulse |
| **n8n** | **Operations** | Automated sync, pipelines, monitoring | Watches GitHub webhooks + Notion changes + cron schedules |
| **Claude Desktop** | **Architect** | Autonomous builds, deep architecture, code review | `.workflow/` files read directly from disk. Can also run builds to verify. |
| **Gemini** | **Advisor** | God-Tier Prompts, specs, business logic | Reads GitHub repo + `.workflow/` files |
| **Grok** | **Counsel** | Privacy/legal audits, research, plan overrides | Your prompts + `.workflow/master-strategy.md` |
| **Windsurf** | **Lead Dev** | Rapid iteration, parallel Cascades | `.workflow/` files + `.workflow/notion-sync.md` |
| **Cursor** | **QA** | Polish, bug fixes, precision edits | `.workflow/` files (same as Lead Dev) |

Full team details: `.workflow/ai-command-center.md`

### The Three Core Syncs

#### Sync 1: Code → Chief of Staff (Lead Dev ships → Notion knows)

```
Trigger:  GitHub webhook — push to any branch
Logic:    Parse commit message, extract branch, files, timestamp
Action:   Create row in Notion "Dev Activity Log" database
Result:   Chief of Staff sees every commit without manual updates
```

**Example:** Lead Dev commits `feat(life): hero section + mission cards` on branch `sean/life-leisure` → Operations creates a row in Notion → next time you open Notion and ask "What happened today?", Chief of Staff knows.

#### Sync 2: Chief of Staff → Code (Notion plans → Lead Dev knows)

```
Trigger:  Notion database change — Sprint Board task status changes
Logic:    Read task title, assignee, priority, target files
Action:   GitHub API → update .workflow/notion-sync.md in repo
Result:   Lead Dev reads priorities at start of every session
```

**Example:** You tell Chief of Staff to prioritize Careers page → it updates the Sprint Board → Operations syncs to `notion-sync.md` → next time you open Windsurf, Lead Dev reads the file and knows what to build.

#### Sync 3: Daily Pulse (End-of-day summary → Everyone)

```
Trigger:  Cron — daily at 11 PM ET
Logic:    GitHub API (today's commits) + Notion API (task changes) + MongoDB (resource counts)
Action:   1. Update Notion "Daily Pulse" page
          2. Discord/email notification to Sean + Josh
          3. Update .workflow/daily-pulse.md in repo
Result:   Every tool has a fresh snapshot every morning
```

### A Real Session With Full Sync

```
MORNING — Open Notion
  You: "What's on deck today?"
  Chief of Staff: "Based on the Dev Activity Log, you shipped the Life &
    Leisure hero yesterday (3 commits, branch sean/life-leisure). Josh pushed
    Local filter improvements. Today's sprint board: you → Life browse section
    (Priority 🔥), Josh → Careers API (Priority ★)."

AFTERNOON — Open Windsurf
  You: "What should I build?"
  Lead Dev: *reads .workflow/notion-sync.md* — "Chief of Staff has you on
    Life & Leisure browse section. Josh is on Careers. I'll stay in
    src/app/life/* on branch sean/life-leisure-browse."

EVENING — Automatic (11 PM)
  Operations fires Daily Pulse:
    → Notion gets summary: 5 commits, Life & Leisure 60% done
    → Discord ping to you and Josh
    → .workflow/daily-pulse.md updated for tomorrow
```

### Notion Database Structure

**Database 1: Dev Activity Log** (auto-populated by Operations)

| Column | Type | Source |
|--------|------|--------|
| Date | Date | Commit timestamp |
| Who | Select (Sean / Josh) | Parsed from branch prefix |
| Branch | Text | GitHub webhook |
| Commit Message | Text | GitHub webhook |
| Files Changed | Text | GitHub webhook |
| Status | Select (Pushed / Merged / Reverted) | GitHub event type |

**Database 2: Sprint Board** (managed by you + Chief of Staff)

| Column | Type | Who Updates |
|--------|------|-------------|
| Task | Title | You or Chief of Staff |
| Assignee | Select (Sean / Josh) | You or Chief of Staff |
| Priority | Select (🔥 / ★ / Normal) | You or Chief of Staff |
| Status | Select (Planned / In Progress / Done) | You (Operations syncs to `.workflow/`) |
| Target Files | Text | You or Chief of Staff |
| Lane | Select (Health / Education / Careers / Local / Life) | You or Chief of Staff |
| Notes | Text | Chief of Staff adds strategic notes |

### Implementation Priority

| Order | What | Effort | Payoff |
|-------|------|--------|--------|
| 1 | Set up n8n instance (VPS or n8n Cloud) | 1 hour | Foundation for everything |
| 2 | Create Notion databases (Dev Activity Log + Sprint Board) | 30 min | Chief of Staff needs structure to read |
| 3 | Build Sync 1 (GitHub → Notion) | 2 hours | Chief of Staff knows what Lead Dev ships |
| 4 | Build Sync 2 (Notion → `.workflow/`) | 2 hours | Lead Dev knows what Chief of Staff plans |
| 5 | Build Sync 3 (Daily Pulse) | 2 hours | Everyone gets a daily summary |

**Total: ~8 hours to wire the full AI team sync.**

---

## 2-Week Sprint Plan

Based on the confirmed build queue in `project_status.md`.

### Week 1: Foundation + Life & Leisure

| Day | Cascade 1 (Sean) | Cascade 2 (Sean or Josh) | Cascade 3 (Optional) | End-of-Day Merge |
|-----|------------------|--------------------------|---------------------|-----------------|
| **Day 1** | Phase 0 fixes (BrowseCard, nav config, branches) | n8n instance setup + Workflow 1 (commit reminder) | — | ✅ Merge to main |
| **Day 2** | Life & Leisure page shell + hero + static cards | Local VOB final polish (mobile, ratings) | n8n Workflow 2 (content freshness) | ✅ Merge both |
| **Day 3** | Life & Leisure browse section + API route | VA Combined Rating Calculator (Health Phase 2 #1) | n8n Workflow 3 (build health monitor) | ✅ Merge both |
| **Day 4** | Life & Leisure mission briefings + tool cards | The Flare / Buddy Check button (Health Phase 2 #3) | — | ✅ Merge both |
| **Day 5** | Life & Leisure QA + accessibility pass | Careers API + job search skeleton | — | ✅ Merge both |

### Week 2: Careers + Health Phase 2

| Day | Cascade 1 | Cascade 2 | Cascade 3 (Optional) | End-of-Day Merge |
|-----|-----------|-----------|---------------------|-----------------|
| **Day 6** | Careers page build-out (pathways, tools) | Benefit Eligibility Checker (Health Phase 2 #5) | n8n Workflow 4 (lead capture) | ✅ Merge both |
| **Day 7** | Careers MOS translator wiring | Contract Highlighter start (Health Phase 2 #2) | — | ✅ Merge both |
| **Day 8–9** | Cross-page QA + nav link updates (ONE Cascade only) | Header/Footer/layout updates (same Cascade) | — | ✅ Single merge |
| **Day 10** | Final QA, update `.workflow/project_status.md` | Partner Dashboard planning doc | — | ✅ Push + celebrate |

### Expected Output After 2 Weeks

- ✅ Life & Leisure page — complete
- ✅ Careers page — fleshed out with API routes and job search
- ✅ 3–4 Health Phase 2 tools shipped (Rating Calc, Flare, Eligibility Checker, Contract Highlighter started)
- ✅ Local VOB polished
- ✅ n8n running with 3–4 automated workflows
- ✅ Ready for Partner Analytics Dashboard build

---

## Summary Checklist

### Before First Parallel Session
- [ ] **Fix 1:** Enable git branches + protect `main` on GitHub
- [ ] **Fix 2:** Move `BrowseResourceCard.tsx` to `src/components/shared/`
- [ ] **Fix 3:** Extract nav config to `src/constants/navigation.ts`
- [ ] **n8n:** Instance deployed and accessible

### Every Session
- [ ] `git checkout main && git pull origin main` before creating branches
- [ ] Update Active Work table in `project_status.md`
- [ ] Paste lane constraint prompt into every new Cascade tab
- [ ] Commit at 45-minute checkpoints — never go more than 1 hour without committing
- [ ] Review `git diff --name-only` before every commit
- [ ] Merge smallest branch first when combining work
- [ ] Never touch Danger Zone files in more than one Cascade simultaneously
- [ ] Never run `npm install` in multiple Cascades simultaneously

### End of Session
- [ ] All branches pushed to GitHub
- [ ] PRs opened for completed work (if working with Josh)
- [ ] `.workflow/project_status.md` updated with what shipped
- [ ] Active Work table cleared

---

## Handling Common Problems

### "A Cascade edited a file outside its lane"
```bash
# Unstage the specific file
git checkout -- src/app/health/some-file-i-shouldnt-have-touched.tsx
# Re-prompt the Cascade with the lane constraint
```

### "Two Cascades both need to edit globals.css"
Pause both. One Cascade makes its edit, commits. The other Cascade then makes its edit, commits. Sequential, not parallel.

### "Merge conflict after merging two branches"
1. Don't panic — Git marks conflicts with `<<<<<<<` and `>>>>>>>`
2. Open the file, decide which version to keep (or combine both)
3. Remove the conflict markers
4. `git add <file>` → `git commit`

### "Build is broken after merge"
```bash
rm -rf node_modules .next
npm install
npm run dev
```
If still broken, check `git log --oneline -5` to see which merge introduced the issue.

### "I accidentally committed to main"
```bash
# If not pushed yet:
git reset --soft HEAD~1
git checkout -b sean/my-feature-name
git add .
git commit -m "feat(page): description"
git push origin sean/my-feature-name
```

---

**Last Updated:** March 28, 2026
**Next Review:** After Phase 0 fixes are complete and first parallel session is run
**Related Docs:** `cto-onboarding-and-collaboration.md`, `project_status.md`, `master-strategy.md`, `ai-command-center.md`
