> **SUPERSEDED:** This document has been replaced by supercharge-mode-v2.md as of March 31, 2026. Kept for historical reference only.

# Vet1Stop — Architecture & Workflow Briefing for Architect (Claude Desktop)

**From:** Lead Dev (Windsurf/Cascade)
**Date:** March 31, 2026
**Purpose:** Get you up to speed on the full Supercharge Mode architecture, your role, and how we all stay in sync. Review this and flag anything you'd change.

---

## Project Overview

**Vet1Stop** is a Next.js 15 (App Router) web platform for U.S. veterans — consolidating Health, Education, Careers, Life & Leisure, Local (veteran-owned businesses), and Shop into one hub. Tech stack: React 19, TypeScript strict, Tailwind CSS 3, Firebase Auth + Analytics, MongoDB Atlas, Grok API for AI features.

**Repo:** github.com/spenn0331/Vet1Stop-2.0
**Local path:** `C:\Users\penny\Desktop\Vet1Stop 2.1`
**Dev server:** `npm run dev` → http://localhost:3002

---

## The AI Executive Team

We have 7 AI tools working together. Each has a codename and a clear role:

| Tool | Codename | Role |
|------|----------|------|
| **Notion AI** | **Chief of Staff** | Sprint planning, strategy, daily briefings. Manages the Sprint Board and reads the Dev Activity Log. |
| **n8n** | **Operations** | The nervous system. Automates sync between GitHub → Notion and Notion → repo. Monitors builds, content freshness, lead capture. Currently being set up. |
| **Claude Desktop** | **Architect** (you) | Autonomous feature builds, deep architecture decisions, code review before merges. Works independently on entire features. Reads/writes files, runs terminal, verifies builds. Best for complex or cross-cutting work. |
| **Gemini** | **Advisor** | Writes God-Tier Prompts, specs, business logic. Reads the GitHub repo remotely. |
| **Grok** | **Counsel** | Privacy/legal audits, compliance reviews, research. Reviews for HIPAA, 38 CFR, xAI ToS risk. |
| **Windsurf** | **Lead Dev** | IDE-integrated rapid iteration builder. Multiple parallel Cascade tabs. Fast edits, interactive workflow. |
| **Cursor** | **QA** | Final polish pass. Bug fixes, precision edits. Never on large features. |

---

## The Operational Flow

```
Chief of Staff (Notion) plans the sprint
    → Advisor (Gemini) writes the spec / God-Tier Prompt
    → Counsel (Grok) audits for compliance + risk
    → "PLAN LOCKED" → Sean says "CODE"
    → Architect (Claude Desktop) + Lead Dev (Windsurf) build in parallel
       ├── Architect: autonomous feature builds (own lane)
       └── Lead Dev: rapid iteration + parallel Cascades (own lane)
    → QA (Cursor) polishes
    → Operations (n8n) syncs results back to Chief of Staff
    → Update .workflow/project_status.md at end of sprint
```

---

## Architect vs. Lead Dev — Division of Labor

Both Architect (you) and Lead Dev (Windsurf) can edit files on Sean's machine. The critical rule: **never touch the same file or directory simultaneously.**

| Situation | Architect (you) | Lead Dev (Windsurf) |
|-----------|----------------|---------------------|
| Build an entire new page from scratch | ✅ Best choice — autonomous, deep reasoning | |
| Rapid small edits, quick iteration | | ✅ IDE-integrated, fastest |
| Complex refactoring across many files | ✅ Large context window | |
| Multiple features in parallel tabs | | ✅ Cascade tabs |
| Run build + verify before merge | ✅ Can run terminal | ✅ Can run terminal |
| Code review before PR | ✅ Best deep analysis | |
| Interactive back-and-forth building | | ✅ Conversational flow |

---

## Lane Discipline (The Core Safety Mechanism)

The codebase is divided into **lanes** — independent directory scopes. Each builder (Architect or Lead Dev) claims a lane before starting. No two builders ever work in the same lane.

### The Lane Map

| Lane | Scope | Shared Infra? |
|------|-------|---------------|
| Life & Leisure | `src/app/life/*`, `src/app/api/life/*` | ❌ No — new directory |
| Careers | `src/app/careers/*`, `src/app/api/careers/*` | ❌ No — self-contained |
| Health Phase 2 Tools | `src/app/health/tools/*` (new sub-routes) | ❌ No — new sub-route |
| Local VOB Polish | `src/app/local/*`, `src/data/businesses.ts` | ❌ No — isolated |
| Auto-Fill | `src/app/auto-fill/*` | ❌ No — self-contained |

### Danger Zone Files (ONE builder at a time, ever)

| File | Why |
|------|-----|
| `src/app/layout.tsx` | Root layout — every page renders through this |
| `src/components/common/Header.tsx` | Global nav |
| `src/components/common/Footer.tsx` | Global footer |
| `src/app/globals.css` | Global styles |
| `src/lib/mongodb.ts` | DB singleton — 26 API routes depend on it |
| `src/contexts/AuthContext.tsx` | Auth state |
| `tailwind.config.js` / `next.config.js` | Build config |
| `package.json` / `package-lock.json` | Dependencies |
| `src/components/shared/BrowseResourceCard.tsx` | Used by Health AND Education |

If any builder needs a Danger Zone file, all other builders pause until it's committed.

---

## Git Branch Workflow

- **Never push directly to `main`.** All work on feature branches.
- Sean's branches: `sean/<feature-name>`
- Josh's branches: `josh/<feature-name>`
- Branch protection: PRs required, 1 approval to merge.

Before starting any work:
```bash
git checkout main && git pull origin main
git checkout -b sean/<feature-name>
```

---

## Parallel Session Example

```
Sean's Machine — 3 parallel build streams
├── Claude Desktop (Architect)  → Life & Leisure (autonomous) → src/app/life/*
├── Windsurf Tab 1 (Lead Dev)   → Careers API (interactive)   → src/app/careers/*
└── Windsurf Tab 2 (Lead Dev)   → Rating Calculator           → src/app/health/tools/*
```

Bridge checkpoints every 45 minutes — each builder commits its lane's files, Sean reviews `git diff --name-only` to catch any out-of-scope edits.

---

## How Context Stays in Sync (Operations / n8n)

```
GitHub push → n8n → Notion "Dev Activity Log" (Chief of Staff sees commits)
Notion Sprint Board change → n8n → .workflow/notion-sync.md (Lead Dev + Architect see priorities)
Daily 11 PM cron → n8n → Daily Pulse to Notion + Discord + .workflow/daily-pulse.md
```

As Architect, you read `.workflow/` files directly from disk. Key files to always check before starting:
- `.workflow/project_status.md` — current sprint, build queue, active work table
- `.workflow/master-strategy.md` — business strategy, feature roadmap, revenue model
- `.workflow/supercharge-mode-v2.md` — lane map, nightly build workflow, n8n operations, golden rules
- `.workflow/ai-command-center.md` — full team roster, golden rules, sync architecture

---

## Golden Rules (All Builders Follow These)

1. **Plan First, Code Second** — numbered plan + files list before any code.
2. **Zero-Clutter Mandate** — never create `.fixed`/`.temp`/`.new`/`.old` files.
3. **Next.js 15 Safety** — `localStorage`/`window` ONLY inside `useEffect` + `"use client"`.
4. **One Driver Rule** — never edit the same file or directory as another builder. Check Active Work table first.
5. **Living Master Strategy** — follow `.workflow/master-strategy.md` exactly.
6. **Lane Discipline** — stay in your assigned directory. Do not touch other lanes.
7. **Branch-Only Workflow** — never push to `main`. Feature branches only.
8. **Operations Keeps the Loop** — n8n syncs context. No manual copy-paste between tools.

---

## Current Project Status (as of March 31, 2026)

| Feature | Status |
|---------|--------|
| Health Page MVP | ✅ Complete (all sprints shipped) |
| Education Page | ✅ Complete |
| Local VOB Directory | 🟡 In Progress (Leaflet map + 25 seed businesses built) |
| Life & Leisure Page | 🔲 Next after Local |
| Careers Page | 🔲 Shell exists, needs API routes + build-out |
| Partner Analytics Dashboard | 🔲 Planned after Life & Leisure |
| Records Recon v5.0 | ✅ Complete (label-only PHI elimination) |

### Phase 0 Fixes Still Needed Before Parallel Sessions

- [ ] Enable git branches + protect `main` on GitHub
- [ ] Move `BrowseResourceCard.tsx` from `src/app/health/components/` to `src/components/shared/`
- [ ] Extract nav config from `Header.tsx` to `src/constants/navigation.ts`

---

## What I Need From You (Architect)

1. **Review this architecture.** Does the lane discipline + multi-builder model make sense? Would you change anything?
2. **Review the Phase 0 fixes.** Are there other structural issues you'd add before we start parallel sessions?
3. **Flag any risks** you see in the current approach — especially around file collision, git workflow, or n8n sync gaps.
4. **Confirm your role.** Does "Architect — autonomous feature builds, deep architecture, code review" fit how you want to be used, or do you see a better division of labor?

---

**Source docs (read these on disk for full detail):**
- `C:\Users\penny\Desktop\Vet1Stop 2.1\.workflow\ai-command-center.md`
- `C:\Users\penny\Desktop\Vet1Stop 2.1\.workflow\supercharge-mode-v2.md`
- `C:\Users\penny\Desktop\Vet1Stop 2.1\.workflow\cto-onboarding-and-collaboration.md`
- `C:\Users\penny\Desktop\Vet1Stop 2.1\.workflow\project_status.md`
- `C:\Users\penny\Desktop\Vet1Stop 2.1\.workflow\master-strategy.md`
