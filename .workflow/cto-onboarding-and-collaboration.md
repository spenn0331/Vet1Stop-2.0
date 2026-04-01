# CTO Onboarding & Two-Person Collaboration Guide

**Created:** March 27, 2026
**Participants:** Sean Penny (CEO/Founder) · Josh Diehl (CTO)
**Repo:** [github.com/spenn0331/Vet1Stop-2.0](https://github.com/spenn0331/Vet1Stop-2.0)

---

## Overview

Both Sean and Josh are vibe coders who build exclusively through AI prompts in Windsurf. This document defines:

1. How Josh gets set up from zero to coding
2. How both developers safely share the same Git repo without merge conflicts
3. How AI tools on each machine stay coordinated

**The core rule:** Code never goes directly to `main`. Everything flows through feature branches and Pull Requests.

---

## PART 1: ONE-TIME SETUP

### Sean's Setup Tasks (do these before Josh starts)

#### Step 1 — Rename `master` → `main` (if not already done)

The repo currently pushes to `master` via `git-update.bat`, but `project_status.md` references `main`. Reconcile this once:

```bash
# Run in C:\Users\penny\Desktop\Vet1Stop
git branch -m master main
git push -u origin main
git push origin --delete master
```

Then on GitHub:
- Go to **Settings → Branches → Default branch**
- Change default from `master` to `main`

#### Step 2 — Protect the `main` branch on GitHub

Go to **github.com/spenn0331/Vet1Stop-2.0 → Settings → Branches → Add branch protection rule**:

- Branch name pattern: `main`
- ✅ Require a pull request before merging
- ✅ Require approvals — set to **1**
- ✅ Do not allow bypassing the above settings (optional but recommended)

This physically prevents either person from pushing directly to `main`.

#### Step 3 — Add Josh as a collaborator on GitHub

Go to **github.com/spenn0331/Vet1Stop-2.0 → Settings → Collaborators → Add people**:

- Search for Josh's GitHub username
- Grant **Write** access (lets him push branches and open PRs)

Josh will receive an email invitation he must accept before he can push.

#### Step 4 — Send Josh his `.env.local` keys securely

Josh needs the same environment variables to run the project locally. Send these via **encrypted message, in-person, or password manager** — never plaintext in Slack/Discord/email:

```
XAI_API_KEY=...
MONGODB_URI=...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_DEV_PREMIUM=true
NVWI_HASH_SECRET=...
# Plus any other keys from your .env.local
```

Josh creates his own `.env.local` file in the project root — this file is gitignored and never committed.

#### Step 5 — Configure Sean's Git identity (if not already done)

```bash
git config --global user.name "Sean Penny"
git config --global user.email "sean@youremail.com"
```

Replace with the email tied to Sean's GitHub account.

Verify:
```bash
git config user.name
git config user.email
```

#### Step 6 — Add Sean's Windsurf rules

Paste the following into Sean's Windsurf global rules / memory:

```markdown
# GIT IDENTITY & TWO-PERSON WORKFLOW (CRITICAL — NEVER IGNORE)

## Who I Am
- I am Sean Penny (CEO/Founder). My CTO is Josh Diehl.
- We are both vibe coders working via AI prompts in Windsurf on separate machines.
- My Git identity is already configured on this machine. Do NOT change it.

## Branch-Only Workflow (No Exceptions)
- NEVER commit or push directly to `main`. All work happens on feature branches.
- Branch naming convention: `sean/<feature-name>` (e.g., `sean/health-rating-calc`).
- Before starting any work, pull the latest main: `git checkout main && git pull origin main`
- Then create a feature branch: `git checkout -b sean/<feature-name>`
- After finishing work, push the branch and remind me to open a Pull Request on GitHub.
- NEVER run `git push origin main` or `git push origin master` under any circumstances.

## File Collision Prevention
- Before making changes, check the "Active Work" table in `.workflow/project_status.md`.
- If Josh is working in a directory (e.g., `src/app/life/*`), do NOT touch files in that directory.
- One Driver Rule: never have two humans OR two AI tools editing the same file.

## Commit Discipline
- Commit in small, focused chunks — not one giant commit at the end.
- Every commit message must be descriptive: "Fix: limit symptom results to 34 conditions" NOT "updates".
- Before committing, review the git diff. Only stage files related to the current task. Do NOT blindly `git add .` if unrelated files were changed.
- If I haven't specified a commit message, ask me for one. Do not auto-generate vague messages.
```

---

### Josh's Setup Tasks (do these on Josh's machine)

#### Step 1 — Accept the GitHub collaborator invitation

Check email for the invite from GitHub. Click "Accept." This gives push access to the repo.

#### Step 2 — Install prerequisites

Josh needs the following installed:

- **Node.js** (v18 or later) — [nodejs.org](https://nodejs.org)
- **Git** — [git-scm.com](https://git-scm.com)
- **Windsurf** — [windsurf.com](https://windsurf.com)
- **Visual Studio Code** (optional, as backup editor)

Verify in a terminal:
```bash
node --version
git --version
```

#### Step 3 — Configure Josh's Git identity

```bash
git config --global user.name "Josh Diehl"
git config --global user.email "josh@hisemail.com"
```

Replace with the email tied to Josh's GitHub account. This is what stamps every commit with his name.

Verify:
```bash
git config user.name
git config user.email
```

#### Step 4 — Clone the repo

```bash
cd ~/Desktop
git clone https://github.com/spenn0331/Vet1Stop-2.0.git
cd Vet1Stop-2.0
```

#### Step 5 — Create `.env.local`

In the project root (`Vet1Stop-2.0/`), create a file called `.env.local` and paste in the keys Sean shared (Step 4 from Sean's section). This file is gitignored — it will never be committed.

#### Step 6 — Install dependencies and test

```bash
npm install
npm run dev
```

The dev server should start at `http://localhost:3000` (or 3002 if 3000 is in use). Verify the site loads in a browser.

#### Step 7 — Add Josh's Windsurf rules

Paste the following into Josh's Windsurf global rules / memory:

```markdown
# GIT IDENTITY & TWO-PERSON WORKFLOW (CRITICAL — NEVER IGNORE)

## Who I Am
- I am Josh Diehl (CTO). The CEO/Founder is Sean Penny.
- We are both vibe coders working via AI prompts in Windsurf on separate machines.
- My Git identity is already configured on this machine. Do NOT change it.

## Branch-Only Workflow (No Exceptions)
- NEVER commit or push directly to `main`. All work happens on feature branches.
- Branch naming convention: `josh/<feature-name>` (e.g., `josh/rern-rename`, `josh/local-page-fix`).
- Before starting any work, pull the latest main: `git checkout main && git pull origin main`
- Then create a feature branch: `git checkout -b josh/<feature-name>`
- After finishing work, push the branch and remind me to open a Pull Request on GitHub.
- NEVER run `git push origin main` or `git push origin master` under any circumstances.

## File Collision Prevention
- Before making changes, check the "Active Work" table in `.workflow/project_status.md`.
- If Sean is working in a directory (e.g., `src/app/health/*`), do NOT touch files in that directory.
- One Driver Rule: never have two humans OR two AI tools editing the same file.

## Commit Discipline
- Commit in small, focused chunks — not one giant commit at the end.
- Every commit message must be descriptive: "Fix: limit symptom results to 34 conditions" NOT "updates".
- Before committing, review the git diff. Only stage files related to the current task. Do NOT blindly `git add .` if unrelated files were changed.
- If I haven't specified a commit message, ask me for one. Do not auto-generate vague messages.

## Project Context
- Repo: https://github.com/spenn0331/Vet1Stop-2.0
- Always read `.workflow/project_status.md` and `.workflow/master-strategy.md` before any task.
- Follow `.workflow/ai-command-center.md` for AI tool coordination rules.
- The `.workflow/` directory is the source of truth for project goals, priorities, and architecture.
```

---

## PART 2: DAILY COLLABORATION WORKFLOW

This is the process both Sean and Josh follow every time they sit down to code.

### Before You Start Coding

```bash
# 1. Switch to main and pull the latest
git checkout main
git pull origin main

# 2. Create your feature branch
git checkout -b sean/my-feature-name    # Sean
git checkout -b josh/my-feature-name    # Josh
```

### Update the Active Work Table

Before writing any code, update the "Active Work" table in `.workflow/project_status.md`:

```markdown
## Active Work (Update Before Starting)
| Who  | Branch                   | Working On              | Files Touched        |
|------|--------------------------|-------------------------|----------------------|
| Sean | sean/health-rating-calc  | VA Rating Calculator    | src/app/health/*     |
| Josh | josh/life-leisure-page   | Life & Leisure MVP      | src/app/life/*       |
```

Commit and push this update to your branch right away so the other person can see it.

### While Coding

- **Commit often** — small chunks, clear messages
- **Review diffs before committing** — make sure Windsurf didn't change files outside your scope
- **Push your branch** anytime: `git push origin sean/my-feature-name`
- **Stay in your lane** — if the other person is in `src/app/health/*`, don't touch those files

### When You're Done (or Want Feedback)

1. Push your branch: `git push origin sean/my-feature-name`
2. Go to **github.com/spenn0331/Vet1Stop-2.0**
3. GitHub will show a yellow banner: **"sean/my-feature-name had recent pushes — Compare & pull request"**
4. Click it → write a 1-2 sentence description → **Create pull request**
5. Tag the other person as a reviewer
6. The reviewer scans the changes (even a 30-second look is fine) → **Approve** → **Merge**
7. Delete the branch after merge (GitHub offers a button for this)

### After a Merge

Both people should pull the updated `main` before starting new work:

```bash
git checkout main
git pull origin main
# Then create a new branch for the next task
```

---

## PART 3: THE GOLDEN RULES

### Rule 1 — Never Touch `main` Directly
`main` is the production branch. Code only gets there through merged Pull Requests. Both humans and AI tools are forbidden from pushing to it.

### Rule 2 — One Task = One Branch
Don't mix unrelated changes. If you're fixing a bug AND building a new feature, make two branches.

### Rule 3 — Don't Work on the Same Files
This is the #1 source of merge conflicts. Divide work by page/feature:
- Sean is on Health → Josh works on Life & Leisure or Local
- If overlap is unavoidable, **communicate before starting**

### Rule 4 — Commit Messages Tell a Story
Good: `"Add VA combined rating calculator with whole-person formula"`
Bad: `"updates"`, `"fix stuff"`, `"WIP"`

### Rule 5 — Review Before You Commit
Windsurf sometimes changes files you didn't ask it to. Before every commit:
1. Open the Source Control panel in Windsurf
2. Scan the diff — every changed file should be related to your task
3. If the AI touched something unrelated, unstage it

### Rule 6 — Communicate Who's Working on What
Update the Active Work table in `project_status.md` before starting. Quick text to the other person is even better.

### Rule 7 — Pull Before You Branch
Every time you sit down to code, start with `git checkout main && git pull origin main`. This ensures your branch starts from the latest version.

---

## PART 4: HANDLING COMMON PROBLEMS

### "I accidentally committed to `main`"

If you haven't pushed yet:
```bash
# Undo the commit but keep the changes
git reset --soft HEAD~1
# Create the branch you should have been on
git checkout -b sean/my-feature-name
# Now commit properly
git add .
git commit -m "Your message"
git push origin sean/my-feature-name
```

If you already pushed to `main` — tell the other person immediately. You may need to revert.

### "Git says there's a merge conflict"

This means both of you changed the same file. Steps:
1. Don't panic — Git marks the conflicts in the file with `<<<<<<<` and `>>>>>>>`
2. Open the file, decide which version to keep (or combine both)
3. Remove the conflict markers
4. Commit the resolution

If you're unsure, ask the other person or ask Windsurf to help resolve it.

### "Windsurf made a huge change I don't understand"

Don't commit it. Options:
1. Ask Windsurf: "Explain what you just changed and why"
2. Use `git diff` to see exactly what changed
3. Use `git checkout -- .` to throw away all uncommitted changes and start over
4. Ask the other person to look at it

### "I need to work on a file Josh is also working on"

Communicate first. Options:
- Wait until Josh's PR is merged, then pull `main` and start your work
- If urgent, coordinate so you're editing different parts of the file
- Worst case: one person finishes first, merges, and the other rebases

### "The dev server won't start / build is broken on my branch"

```bash
# Try a clean install
rm -rf node_modules .next
npm install
npm run dev
```

If it's still broken, check if `main` builds. If `main` works but your branch doesn't, the problem is in your branch changes.

---

## PART 5: QUICK REFERENCE CHEAT SHEET

```
START OF DAY:
  git checkout main
  git pull origin main
  git checkout -b sean/my-feature     (or josh/my-feature)
  → Update Active Work table in project_status.md

WHILE WORKING:
  → Code via Windsurf prompts
  → Review diff before committing
  git add <specific-files>
  git commit -m "Clear description of change"
  git push origin sean/my-feature

END OF SESSION:
  → Push branch
  → Open PR on GitHub (if ready for review)
  → Clear your row in Active Work table if done

AFTER PR IS MERGED:
  git checkout main
  git pull origin main
  → Start a new branch for the next task
```

---

## PART 6: FILE OWNERSHIP GUIDE (Suggested Defaults)

To minimize collisions, assign default ownership zones. Either person CAN work in any area, but check with the other first if crossing into their zone.

| Area | Default Owner | Directory |
|------|--------------|-----------|
| Health Page + Tools | Sean | `src/app/health/*` |
| Records Recon Data | Sean | `src/data/records-recon/*` |
| Life & Leisure Page | Josh | `src/app/life/*` |
| Local VOB Directory | Josh | `src/app/local/*` |
| Shared Components | Coordinate | `src/components/*` |
| API Routes | Coordinate | `src/app/api/*` |
| AI / Chatbot | Sean | `src/lib/ai/*`, `src/components/ai/*` |
| .workflow Docs | Either | `.workflow/*` |
| Config Files | Coordinate | `package.json`, `tailwind.config.*`, `next.config.*` |

Adjust this table as Josh ramps up and takes on more ownership.

---

**Last updated:** March 27, 2026
**Next review:** After Josh's first successful PR merge
