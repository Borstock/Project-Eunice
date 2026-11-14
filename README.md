# Habit Tracker 🎯

A privacy-first, lightweight daily habit tracker web application built for everyone. No technical knowledge required, works 100% offline in guest mode with data staying in your browser, or optionally sign in with a free personal account for cloud synchronization across devices.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development](#local-development)
  - [Running with Docker](#running-with-docker)
- [Environment Variables](#environment-variables)
  - [Local Setup](#local-setup)
  - [Docker Setup](#docker-setup)
  - [Vercel Deployment Setup](#vercel-deployment-setup)
  - [Supabase Free Tier Considerations](#supabase-free-tier-considerations)
- [Available Scripts](#available-scripts)
- [Folder Structure](#folder-structure)
- [Roadmap](#roadmap)
  - [Phase 1: MVP (Complete)](#phase-1-mvp-complete)
  - [Phase 2: Accounts & Cloud Sync](#phase-2-accounts--cloud-sync)
- [Contributing & Working Rules](#contributing--working-rules)
  - [Branching Strategy](#branching-strategy)
  - [Commit Conventions](#commit-conventions)
  - [Testing & Quality Checks](#testing--quality-checks)
  - [CI/CD](#cicd)
- [License](#license)

---

## Features

- **Zero Friction (Guest Mode):** No account or registration needed. Track habits immediately with 100% offline browser storage.
- **Optional Cloud Accounts:** Sign up with email and password to sync habits and history securely via Supabase (Postgres with Row Level Security).
- **Privacy & Security First:** Browser data stays in your browser; cloud data is strictly isolated to your user ID via database-level RLS policies.
- **Intuitive Habit Management:** Create, customize (name, color, emoji/icon), edit, and delete daily habits.
- **Daily "Today" View:** Quickly check off habits for today and maintain momentum.
- **Streak Tracking:** Real-time calculation of consecutive completion streaks to keep you motivated.
- **Weekly / Calendar Overview:** Visualize habit consistency across days at a glance.
- **Statistics & Charts:** Completion rates, weekly trends, day-of-week breakdown, and best streaks with Chart.js visualizations.
- **Demo Data Generator:** Deterministic 90-day sample history to explore the full dashboard instantly.
- **Responsive & Themed:** Mobile-first user experience with light and dark mode support.

---

## Tech Stack

All tools and libraries are 100% free and open-source:

- **Frontend Framework:** [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **State Management:** [Pinia](https://pinia.vuejs.org/)
- **Routing:** [Vue Router](https://router.vuejs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Visualizations:** [Chart.js](https://www.chartjs.org/) + [vue-chartjs](https://vue-chartjs.org/)
- **Cloud Backend (Optional):** [Supabase](https://supabase.com/) (Auth + PostgreSQL with Row Level Security on the perpetual free plan)
- **Testing:**
  - Unit & Component: [Vitest](https://vitest.dev/) + [@vue/test-utils](https://test-utils.vuejs.org/)
  - End-to-End (E2E): [Playwright](https://playwright.dev/)
- **Code Quality:** [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/)
- **Containers:** [Docker](https://www.docker.com/) (Multi-stage build with Node.js and Nginx static serving) + Docker Compose
- **Continuous Integration:** [GitHub Actions](https://github.com/features/actions) (Lint, Test, Build on PRs)
- **Deployment:** [Vercel](https://vercel.com/) (Hobby free plan: automatic production deploy from `main`, preview deploys for PRs and branches)

---

## Project Architecture

The application is structured around a decoupled storage layer to guarantee high maintainability and swappability:

- **Storage Provider Interface:** Abstract interface (`IStorageService` / `IHabitRepository`) with concrete implementations (`LocalStorageService` for guest mode, `SupabaseHabitRepository` for cloud sync).
- **Domain Store:** Pinia stores (`useHabitStore`, `useSettingsStore`) orchestrating business logic (habits, completion logs, streaks) without coupling to UI components.
- **Presentation Layer:** Atomic, reusable Vue components leveraging Tailwind CSS for clean, accessible, mobile-first layouts.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- Optional: [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)

### Local Development

1. **Clone the repository:**

   ```bash
   git clone https://github.com/<your-username>/Project-Eunice.git
   cd Project-Eunice
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Configure environment variables (optional):**

   ```bash
   cp .env.example .env.local
   # Edit .env.local to configure custom settings or Supabase credentials
   ```

   See [Environment Variables](#environment-variables) for details.

4. **Start the development server:**

   ```bash
   pnpm run dev
   ```

   Open your browser at `http://localhost:5173`.

5. **Build for production:**

   ```bash
   pnpm run build
   ```

6. **Preview production build locally:**
   ```bash
   pnpm run preview
   ```

### Running with Docker

#### Using Docker Compose (Development / Testing)

Run the containerized application with a single command:

```bash
docker-compose up --build
```

Access the application at `http://localhost:8080`.

To stop the containers:

```bash
docker-compose down
```

#### Building and Running the Docker Image Directly

1. **Build the image:**

   ```bash
   docker build -t habit-tracker:latest .
   ```

   To pass Supabase credentials at build time:

   ```bash
   docker build \
     --build-arg VITE_SUPABASE_URL="https://your-project.supabase.co" \
     --build-arg VITE_SUPABASE_ANON_KEY="your-anon-key" \
     -t habit-tracker:latest .
   ```

2. **Run the container:**
   ```bash
   docker run -d -p 8080:80 --name habit-tracker-app habit-tracker:latest
   ```
   Access the app at `http://localhost:8080`.

---

## Environment Variables

All runtime configuration lives in `src/config/env.ts` and is read exclusively from that module — no component or store imports `import.meta.env` directly.

> **⚠️ Security Mandate:** All `VITE_` variables are compiled into the client-side JavaScript bundle and are publicly visible. **Never store secrets, passwords, or the Supabase `service_role` key in them.** The Supabase `anon` key is safe because Row Level Security (RLS) is strictly enforced on all database tables.

| Variable                 | Default          | Description                                                                                                                                           |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_APP_NAME`          | `Habit Tracker`  | Display name shown in the navbar and browser tab.                                                                                                     |
| `VITE_STORAGE_PREFIX`    | `habit_tracker_` | Namespace prefix for every `localStorage` key. Valid characters: `a-z A-Z 0-9 _ -`. Changing this migrates existing data automatically on first load. |
| `VITE_ENABLE_DEBUG`      | `false`          | Set to `"true"` to enable verbose `console.debug` logging. Any other value disables it.                                                               |
| `VITE_SUPABASE_URL`      | `""`             | Supabase project URL (e.g. `https://your-project.supabase.co`). When omitted, the app operates entirely in guest mode (offline/localStorage).         |
| `VITE_SUPABASE_ANON_KEY` | `""`             | Supabase public anonymous API key. Safe for client exposure with RLS.                                                                                 |

### Local Setup

```bash
cp .env.example .env.local   # gitignored
# Edit .env.local to configure values
```

### Docker Setup

Pass build arguments when building the Docker image:

```bash
docker build \
  --build-arg VITE_SUPABASE_URL="https://your-project.supabase.co" \
  --build-arg VITE_SUPABASE_ANON_KEY="your-anon-key" \
  -t habit-tracker:latest .
```

### Vercel Deployment Setup

In the Vercel dashboard:

1. Navigate to **Project Settings → Environment Variables**.
2. Add each `VITE_*` key for the required environments (Production, Preview, Development).
3. Vercel injects these values at build time.

### Supabase Free Tier Considerations

- **Inactivity Pausing:** Supabase free tier projects pause after approximately 7 days of inactivity. If paused, they can be unpaused from the Supabase dashboard in seconds.
- **Email Rate Limits:** The built-in Supabase email service allows a limited number of confirmation emails per hour (approx. 3–4/hr). For production scale, configure custom SMTP (e.g. Resend, SendGrid, or Postmark).

---

## Available Scripts

| Script                        | Purpose                                             |
| ----------------------------- | --------------------------------------------------- |
| `pnpm run dev`                | Starts Vite dev server with hot reload              |
| `pnpm run build`              | Type-checks and builds production assets to `dist/` |
| `pnpm run preview`            | Locally serves the production build from `dist/`    |
| `pnpm run test:unit`          | Executes unit and component tests with Vitest       |
| `pnpm run test:unit:coverage` | Runs unit tests and produces code coverage reports  |
| `pnpm run test:e2e`           | Runs Playwright end-to-end integration tests        |
| `pnpm run lint`               | Analyzes code for issues with ESLint                |
| `pnpm run lint:fix`           | Fixes lint errors automatically                     |
| `pnpm run format`             | Checks formatting with Prettier                     |
| `pnpm run format:write`       | Formats all files with Prettier                     |

---

## Folder Structure

```
Project-Eunice/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI workflow (lint, test, build)
├── docs/                          # Architecture plans and specifications
│   └── ACCOUNTS_PLAN.md           # User accounts & cloud sync design specification
├── public/                        # Static assets (favicons, icons)
├── src/
│   ├── assets/                    # Shared assets (styles, base CSS)
│   ├── components/                # Reusable UI components
│   │   ├── common/                # Buttons, modals, badges, inputs
│   │   ├── habit/                 # HabitCard, HabitForm, StreakBadge
│   │   ├── calendar/              # WeeklyView, DayCell
│   │   └── layout/                # Navbar, Footer, ThemeToggle
│   ├── composables/               # Vue composables (useTheme, useDate, …)
│   ├── config/
│   │   └── env.ts                 # Typed, validated environment config (single source of truth)
│   ├── models/                    # TypeScript interfaces and domain types
│   ├── router/                    # Vue Router route configuration
│   ├── services/
│   │   ├── storage/               # Pluggable storage abstraction (LocalStorage, InMemory)
│   │   └── supabase/              # Supabase client singleton and helpers
│   ├── stores/                    # Pinia state stores (habit store, settings store)
│   ├── utils/                     # Pure helpers (date, streak, statsCalculator, demoGenerator, …)
│   ├── views/                     # Top-level view pages (Today, Habits, Weekly, Stats, Settings)
│   ├── App.vue                    # Root component
│   ├── env.d.ts                   # Vite env type declarations
│   └── main.ts                    # Application bootstrap
├── supabase/
│   └── migrations/
│       └── 001_init.sql           # Database schema, RLS policies, and triggers
├── tests/
│   ├── unit/                      # Vitest unit and component tests
│   └── e2e/                       # Playwright end-to-end tests
├── .env.example                   # Template for local env variables (committed, no secrets)
├── .dockerignore
├── .eslintrc.cjs
├── .gitignore
├── .prettierrc
├── AGENTS.md                      # AI agent and developer guidelines
├── docker-compose.yml             # Local Docker Compose setup
├── Dockerfile                     # Multi-stage Docker build
├── index.html                     # HTML entry point
├── nginx.conf                     # Nginx configuration for Docker runtime
├── package.json                   # Dependencies and scripts
├── playwright.config.ts           # Playwright test runner configuration
├── README.md                      # Project documentation
├── tailwind.config.cjs            # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript compiler options
├── vercel.json                    # Vercel deployment configuration
└── vite.config.ts                 # Vite bundler configuration
```

---

## Roadmap

### Phase 1: MVP (Complete)

- [x] Project architecture and documentation setup (README.md, AGENTS.md, CI/CD, Docker).
- [x] Habit CRUD: Create, edit, and delete habits (name, emoji/icon, color).
- [x] "Today" View: Display today's habits with quick one-click completion toggle.
- [x] Streak Tracking: Automatic calculation of current consecutive completion streak.
- [x] Weekly / Calendar View: Visual grid indicating days completed for each habit.
- [x] Decoupled Local Storage: Browser-backed persistence surviving reloads.
- [x] Responsive Layout: Mobile-first interface with system/light/dark mode toggle.
- [x] Environment Variables: Centralized typed configuration module (`VITE_*`).
- [x] Demo Data: Deterministic 90-day history with 5 habit patterns and settings controls.
- [x] Stats and Charts: Lazy-loaded statistics view with Chart.js + vue-chartjs visualizations.

### Phase 2: Accounts & Cloud Sync

- [x] **Database Schema & RLS:** Postgres migration with `habits` and `completions` tables protected by RLS (`001_init.sql`).
- [x] **Supabase Auth:** Email & password authentication with reactive Pinia auth store, session restore, router guards, and friendly auth error handling.
- [x] **Cloud Sync & Migration:** Repository adapter syncing with Supabase, optimistic UI updates with reactive sync badge, safe first-login local data migration, and cloud data deletion.
- [ ] **Custom Frequencies & Quantities:** Specific weekday schedules and numeric targets.
- [ ] **Reminders & PWA Support:** Browser notifications and offline installation.

---

## Contributing & Working Rules

We maintain high engineering standards with a simple and disciplined workflow:

### Branching Strategy

- `main`: Production branch. Always deployable and protected. Automated deploys to Vercel production.
- `develop`: Integration branch. All features merge into `develop` via pull requests.
- `feature/*`: Specific feature branches branched from `develop` (e.g. `feature/habit-crud`, `feature/supabase-setup`).

### Commit Conventions

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation changes
- `test:` Adding or refactoring tests
- `refactor:` Code refactoring without behavioral changes
- `chore:` Maintenance, dependency updates, configuration changes

### Testing & Quality Checks

Every feature must include tests. Prior to merging any PR:

1. `pnpm run lint` must pass with zero errors.
2. `pnpm run test:unit` must pass all tests.
3. `pnpm run build` must succeed without TypeScript errors.
4. `pnpm run format` must pass Prettier checks on the entire source tree.

### CI/CD

GitHub Actions runs automatically on every pull request targeting `develop` or `main`. All checks (lint, tests, build) must pass before a merge is permitted.

---

## License

This project is licensed under the [MIT License](LICENSE) — free and open source forever.
