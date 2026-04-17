# Track Agent Enhancement Design Spec

## 1. Overview
This document specifies the design for enhancing the `track-agent` with global track management, smarter context retention without RAG, and automated weekly reporting. The goal is to improve agent usability, reduce project folder clutter, and provide continuous feedback on implementation quality based on past mistakes.

## 2. Architecture & Global Path Migration
- **Current State:** Tracks are stored in `{project_root}/tracks/`.
- **New Architecture:** Tracks will be stored globally in the user's home directory under `~/.track/{project_name}/`.
  - `{project_name}` is dynamically resolved by the agent based on the current working directory name (e.g., `ai-workflow`).
  - This isolates agent metadata from the codebase, keeping the project repository clean.

## 3. Features

### 3.1 Welcome Message (Pending Tracks Reminder)
- **Behavior:** When a user initiates a session with a generic greeting or without a specific task (e.g., "안녕", "상태 알려줘"), the agent scans the `~/.track/{project_name}/YYYY-MM-status.md` file.
- **Output:** The agent prepends a "Welcome Message" listing all tracks currently in `[진행 중]` (In Progress) and `[⏸️ 보류]` (Pending) states, prompting the user whether to resume an existing track or create a new one.

### 3.2 Lessons Learned (Grill-me Enhancement)
- **Concept:** Replace complex RAG infrastructure with a single, highly condensed project-wide file: `~/.track/{project_name}/LESSONS.md`.
- **Phase 7 (Final Verification):** Upon successfully completing a track, the agent extracts 1-2 critical mistakes or architectural takeaways from the track's `audit.md` and appends them to `LESSONS.md`.
- **Phase 5 (Review):** Before asking Grill-me questions on new implementations, the agent **must** read `LESSONS.md` and incorporate relevant past mistakes into its review questions to prevent regressions.

### 3.3 Systematic Track Closure
- **Phase 7 (Final Verification):** The standard "✅ 완료" state update is augmented by generating a structured `closure-report.md` within the completed track's directory.
- **Structure of `closure-report.md`:**
  1. **Goal:** Brief summary of the achieved objective.
  2. **Modified Files:** List of core files changed.
  3. **Architectural Changes:** Noteworthy structural shifts or new dependencies.
  4. **Technical Debt:** Any lingering `TODO`s or edge cases deferred.

### 3.4 Weekly Reporting & Auto-Consolidation
- **Trigger:** Initiated explicitly by the user (e.g., "주간 리포트 생성해줘").
- **Reporting:** The agent compiles all `closure-report.md` files generated within the past 7 days into a comprehensive `~/.track/{project_name}/reports/YYYY-Wxx-weekly.md` report.
- **Auto-Consolidation (The 1st Approach):** During the Weekly Report generation, the agent also reads the entire `LESSONS.md` file. It deduplicates, condenses, and removes obsolete or resolved items, rewriting the file into a concise, bulleted format (max 15-20 lines). This prevents the context window from bloating over time.

## 4. Workflows Affected
The changes will primarily require updates to `.gemini/agents/tracks-templates/track-workflow.md` to incorporate:
1. Directory path change instructions (`~/.track/`).
2. Welcome message rule for startup.
3. Phase 5 & Phase 7 augmentations for `LESSONS.md` and `closure-report.md`.
4. A new rule covering the "Weekly Report & Consolidation" trigger.