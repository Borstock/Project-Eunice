# AGENTS.md — Contributor & AI Agent Operating Manual

Welcome to **Habit Tracker**. This document establishes the engineering rules, design architecture, coding standards, and operational workflows for human contributors and AI agents working in this repository.

---

## 1. Project Overview & Mission

- **App Name:** Habit Tracker
- **Target Audience:** General public with zero technical requirements.
- **Core Value:** Simple, intuitive, motivating daily habit tracking with 100% privacy and local-first data storage.
- **Zero Cost Mandate:** Every dependency, tool, library, and platform must be completely free and open-source or on perpetual free tiers with no credit cards required.
- **Privacy Model:** Browser-stored data only (`localStorage` / `IndexedDB`). No data is sent to external servers in MVP. No user accounts or authentication in MVP.

---

## 2. Tech Stack & Tooling

| Category | Technology | Notes |
| --- | --- | --- |
| **Framework** | Vue 3 | Composition API with `<script setup>` syntax |
| **Language** | TypeScript | Strict mode enabled (`strict: true`) |
| **Build Tool** | Vite | Lightning-fast HMR and optimized production bundles |
| **State Management**| Pinia | Typed modular stores |
| **Routing** | Vue Router 4 | Client-side routing with clean URLs |
| **Styling** | Tailwind CSS | Utility-first, responsive, dark-mode ready (`darkMode: 'class'`) |
| **Unit Testing** | Vitest + @vue/test-utils | Fast in-memory testing of stores and components |
| **E2E Testing** | Playwright | Real browser automation for critical user journeys |
| **Linting & Formatting** | ESLint + Prettier | Standardized formatting and strict linting rules |
| **Containerization**| Docker & Docker Compose | Multi-stage build (`node:alpine` -> `nginx:alpine`) |
| **CI** | GitHub Actions | Automated lint, test, and build workflows on PRs |
| **Hosting** | Vercel (Hobby Plan) | Automated deployments from `main` and preview branches |

---

## 3. Working Rules & Git Workflow

### 3.1 Branching Strategy
- `main`: **Production branch**. Represents the live, production-ready code deployed to Vercel. Direct commits are forbidden.
- `develop`: **Integration branch**. Active integration point where completed features merge.
- `feature/<feature-name>`: **Feature branches**.
  - Must be branched off `develop`.
  - Focused on a single responsibility or user story (e.g., `feature/habit-crud`, `feature/streak-logic`).
  - Merged into `develop` only via Pull Request after review and green CI checks.
- Hotfixes or bug fixes should use `fix/<issue-name>`.

### 3.2 Commit Conventions
All commits must strictly follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):
- `feat: <description>` — New user-facing feature
- `fix: <description>` — Bug fix
- `test: <description>` — Adding or correcting tests
- `refactor: <description>` — Code reorganization without functional changes
- `docs: <description>` — Documentation changes (README, AGENTS.md, etc.)
- `chore: <description>` — Build config, package management, tooling changes

*Example:* `feat: add habit creation modal with color and emoji picker`

### 3.3 Continuous Testing & Quality Gates
Every code change must satisfy the quality triad prior to merge:
1. **Lint Clean:** `npm run lint` must pass with 0 errors.
2. **Tests Pass:** `npm run test:unit` must pass 100% of unit and component tests.
3. **Build Succeeds:** `npm run build` must complete with 0 TypeScript and asset errors.

### 3.4 Continuous Integration (CI)
A GitHub Actions workflow (`.github/workflows/ci.yml`) automatically triggers on pull requests targeting `main` and `develop`. It executes:
- Node.js setup & dependency cache
- ESLint verification
- Vitest unit test suite
- Production bundle build

---

## 4. Software Architecture & Design Principles

### 4.1 Storage Abstraction Layer (Hexagonal / Port & Adapter Pattern)
To allow zero-friction transitions in Phase 2 (such as swapping `localStorage` for `IndexedDB` or a cloud-sync adapter like Supabase/Firebase free tiers), the app accesses storage solely via an abstraction interface:

```typescript
// src/services/storage/IStorageService.ts
export interface IStorageService {
  getItem<T>(key: string): Promise<T | null> | T | null;
  setItem<T>(key: string, value: T): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
  clear(): Promise<void> | void;
}
```

The domain logic communicates via a repository or service (`HabitRepository`) that relies on this interface, never invoking `localStorage` or `window` directly from Vue components or Pinia actions.

### 4.2 State Management (Pinia)
- **`useHabitStore`**: Single source of truth for habits, completion records, active date selections, and derived calculations (streaks, today's status).
- **`useSettingsStore`**: User preferences (theme: light/dark/system).
- State must remain serializable (plain objects, strings, numbers, arrays).

### 4.3 Domain Models
```typescript
// src/models/habit.ts
export interface Habit {
  id: string;              // UUID or timestamp-based unique ID
  name: string;            // Name of the habit (e.g., "Morning Run")
  emoji: string;           // Representative emoji (e.g., "🏃")
  color: string;           // Hex or Tailwind color class (e.g., "#3B82F6")
  createdAt: string;       // ISO 8601 date string
  archived?: boolean;      // For soft deletion/archiving
}

export interface HabitCompletion {
  habitId: string;
  date: string;            // Format: YYYY-MM-DD
  completedAt: string;     // ISO 8601 timestamp
}
```

### 4.4 Streak Calculation Algorithm
- A streak represents the number of consecutive days a habit was completed up to the target evaluation date.
- Current streak evaluates backwards from today:
  - If completed today: count today + consecutive days immediately preceding today.
  - If not completed today: check yesterday. If completed yesterday, count consecutive days starting from yesterday (streak is preserved until today ends). If not completed yesterday, streak is 0.
- All calculations should use date strings formatted as `YYYY-MM-DD` in the user's local timezone to avoid UTC boundary shifts.

---

## 5. Code Style & Conventions

### 5.1 Vue 3 Component Conventions
- Use `<script setup lang="ts">`.
- Declare props with `defineProps<{ ... }>()` and emits with `defineEmits<{ ... }>()`.
- Keep components small, focused, and single-purpose.
- Prefer composables (`use*`) for reusable stateful logic (e.g., `useTheme`, `useStreak`).

### 5.2 TypeScript Standards
- Enable strict type checks (`noImplicitAny: true`, `strictNullChecks: true`).
- Export shared types and interfaces from `src/models/`.
- Do not use `any`; use typed generics, unknown, or unions where necessary.

### 5.3 Tailwind CSS & UI Design
- Mobile-first approach: write mobile classes first, then apply `sm:`, `md:`, `lg:` breakpoints.
- Dark mode: utilize the `dark:` prefix consistently across all backgrounds, text, and borders.
- Keep accessible contrast ratios and readable typography.

---

## 5. Environment Variables

All runtime configuration is centralized in [`src/config/env.ts`](file:///c:/Users/David/Desktop/Project-Eunice/src/config/env.ts). **No component, store, or utility may import `import.meta.env` directly** — use the typed exports from `src/config/env.ts` exclusively.

Type declarations for the variables live in [`src/env.d.ts`](file:///c:/Users/David/Desktop/Project-Eunice/src/env.d.ts).

### 5.1 Available Variables

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_APP_NAME` | `"Habit Tracker"` | Display name in navbar and `<title>`. |
| `VITE_STORAGE_PREFIX` | `"habit_tracker_"` | Namespace prefix for all `localStorage` keys. Valid chars: `a-z A-Z 0-9 _ -`. Changing it triggers automatic one-time migration of existing data. |
| `VITE_ENABLE_DEBUG` | `"false"` | Set to `"true"` to enable verbose `console.debug` logging via `src/utils/logger.ts`. |

> **⚠️ Security:** `VITE_` variables are compiled into the browser bundle and are publicly visible. **Never store secrets, API keys, or passwords in them.**

### 5.2 Local Development Setup
```bash
cp .env.example .env.local   # .env.local is gitignored
# Edit .env.local to override only what you need
```

### 5.3 Vercel Deployment Setup
In the Vercel dashboard: **Project Settings → Environment Variables**. Add each `VITE_*` key for the target environments (Production / Preview / Development). Vercel injects them at build time.

---

## 6. Phase 1 MVP Scope & Phase 2 Extensibility

### 6.1 Phase 1: MVP Scope
1. **Habit CRUD:** Create, view, edit, and delete habits (name, icon/emoji, color).
2. **Today View:** View habits scheduled for today; check/uncheck status.
3. **Current Streak Display:** Dynamic streak calculation for each habit.
4. **Weekly / Calendar View:** 7-day rolling or weekly matrix of completion statuses.
5. **Local Persistence:** Automatic persistence to `localStorage` via the storage service.
6. **Responsive Layout & Themes:** Mobile/desktop viewports, light and dark themes.
7. **Production Ready:** Docker containerization, CI workflow, and deployment ready for Vercel.

### 6.2 Phase 2 Extensibility Hooks (Design Considerations)
When writing Phase 1 code, ensure the following architecture hooks are preserved:
- **Stats & Charts:** Store completion history as individual date entries (`YYYY-MM-DD`) rather than simple integer counters, so historical trend graphs can be computed without schema migrations.
- **Frequency & Goals:** Habit models should easily accommodate optional fields like `frequency: { type: 'daily' | 'weekly' | 'custom', targetDays?: number[] }` and `targetQuantity?: number`.
- **Notifications & PWA:** Structure service worker registration and push notification helpers as isolated composables.
- **Import / Export & Sync:** The storage service layer will support `exportAll(): Promise<BackupData>` and `importAll(data: BackupData): Promise<void>`.

---

## 7. Instructions for AI Agents

When acting as an AI assistant in this repository:
1. Always verify the current branch and status before making changes.
2. Ensure any new logic is accompanied by unit tests in `tests/unit/`.
3. Run `npm run lint` and `npm run test:unit` after generating code to confirm the repository remains clean.
4. Keep commit messages compliant with the Conventional Commits format.
5. Create markdown links to any referenced files using `[filename](file:///c:/Users/David/Desktop/Project-Eunice/path/to/file)`.
6. Ask the user for confirmation when proposing significant structural changes or before kicking off major implementation phases.
