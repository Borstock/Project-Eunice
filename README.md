# Habit Tracker 🎯

A privacy-first, lightweight daily habit tracker web application built for everyone. No technical knowledge required, no sign-up or accounts needed, and 100% of your data stays in your browser.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development](#local-development)
  - [Running with Docker](#running-with-docker)
- [Available Scripts](#available-scripts)
- [Folder Structure](#folder-structure)
- [Roadmap](#roadmap)
  - [Phase 1: MVP (Current)](#phase-1-mvp-current)
  - [Phase 2: Upcoming Features](#phase-2-upcoming-features)
- [Contributing & Working Rules](#contributing--working-rules)
  - [Branching Strategy](#branching-strategy)
  - [Commit Conventions](#commit-conventions)
  - [Testing & Quality Checks](#testing--quality-checks)
  - [CI/CD](#cicd)
- [License](#license)

---

## Features

- **Zero Friction:** No account, registration, or login required.
- **Privacy-First:** All habits and logs are stored locally in your browser (`localStorage` / `IndexedDB`). Nothing ever leaves your device.
- **Intuitive Habit Management:** Create, customize (name, color, emoji/icon), edit, and delete daily habits.
- **Daily "Today" View:** Quickly check off habits for today and maintain momentum.
- **Streak Tracking:** Real-time calculation of consecutive completion streaks to keep you motivated.
- **Weekly / Calendar Overview:** Visualize habit consistency across days at a glance.
- **Responsive & Themed:** Mobile-first user experience with light and dark mode support.

---

## Tech Stack

All tools and libraries are 100% free and open-source:

- **Frontend Framework:** [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **State Management:** [Pinia](https://pinia.vuejs.org/)
- **Routing:** [Vue Router](https://router.vuejs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
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

- **Storage Provider Interface:** Abstract interface (`HabitStorage`) with concrete implementations (`LocalStorageService`, with future support for `IndexedDB` or cloud sync).
- **Domain Store:** Pinia store orchestrating business logic (habits, completion logs, streaks) without coupling to the UI or direct browser APIs.
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
   npm install
   ```

3. **Configure environment variables (optional):**
   ```bash
   cp .env.example .env.local
   # Edit .env.local to override defaults
   ```
   See [Environment Variables](#environment-variables) for details.

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Preview production build locally:**
   ```bash
   npm run preview
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

2. **Run the container:**
   ```bash
   docker run -d -p 8080:80 --name habit-tracker-app habit-tracker:latest
   ```
   Access the app at `http://localhost:8080`.

---

## Environment Variables

All runtime configuration lives in `src/config/env.ts` and is read exclusively from that module — no component or store imports `import.meta.env` directly.

> **⚠️ Security:** All `VITE_` variables are compiled into the browser bundle and are publicly visible. **Never store secrets, API keys, or passwords in them.**

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_APP_NAME` | `Habit Tracker` | Display name shown in the navbar and browser tab. |
| `VITE_STORAGE_PREFIX` | `habit_tracker_` | Namespace prefix for every `localStorage` key. Valid characters: `a-z A-Z 0-9 _ -`. Changing this migrates existing data automatically on first load. |
| `VITE_ENABLE_DEBUG` | `false` | Set to `"true"` to enable verbose `console.debug` logging. Any other value disables it. |

### Local setup
```bash
cp .env.example .env.local   # already gitignored
# Then edit .env.local — only override what you need
```

### Vercel setup
In the Vercel dashboard go to **Project Settings → Environment Variables**, add each `VITE_*` key for the desired environments (Production / Preview / Development). Vercel injects them at build time; no secrets are needed here.

---

## Available Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Starts Vite dev server with hot reload |
| `npm run build` | Type-checks and builds production assets to `dist/` |
| `npm run preview` | Locally serves the production build from `dist/` |
| `npm run test:unit` | Executes unit and component tests with Vitest |
| `npm run test:unit:coverage` | Runs unit tests and produces code coverage reports |
| `npm run test:e2e` | Runs Playwright end-to-end integration tests |
| `npm run lint` | Analyzes code for issues with ESLint |
| `npm run lint:fix` | Fixes lint errors automatically |
| `npm run format` | Checks formatting with Prettier |
| `npm run format:write` | Formats all files with Prettier |

---

## Folder Structure

```
Project-Eunice/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI workflow (lint, test, build)
├── public/                        # Static assets (favicons, icons)
├── src/
│   ├── assets/                    # Shared assets (styles, base CSS)
│   ├── components/                # Reusable UI components
│   │   ├── common/                # Buttons, modals, badges, inputs
│   │   ├── habit/                 # HabitCard, HabitForm, StreakBadge
│   │   ├── calendar/              # WeeklyView, DayCell
│   │   └── layout/                # Navbar, Footer, ThemeToggle
│   ├── composables/               # Vue composables (e.g. useTheme, useDate)
│   ├── config/
│   │   └── env.ts                 # Typed, validated environment config (single source of truth)
│   ├── models/                    # TypeScript interfaces and domain types
│   ├── router/                    # Vue Router route configuration
│   ├── services/
│   │   └── storage/               # Pluggable storage abstraction (LocalStorage, etc.)
│   ├── stores/                    # Pinia state stores (habit store, settings store)
│   ├── utils/                     # Pure helpers (date, streak, logger, …)
│   ├── views/                     # Top-level view pages (TodayView, HabitsView, WeeklyView)
│   ├── App.vue                    # Root component
│   ├── env.d.ts                   # Vite env type declarations
│   └── main.ts                    # Application bootstrap
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

### Phase 1: MVP (Current)
- [x] Project architecture and documentation setup (README.md, AGENTS.md, CI/CD, Docker).
- [x] Habit CRUD: Create, edit, and delete habits (name, emoji/icon, color).
- [x] "Today" View: Display today's habits with quick one-click completion toggle.
- [x] Streak Tracking: Automatic calculation of current consecutive completion streak.
- [x] Weekly / Calendar View: Visual grid indicating days completed for each habit.
- [x] Decoupled Local Storage: Browser-backed persistence surviving reloads.
- [x] Responsive Layout: Mobile-first interface with system/light/dark mode toggle.
- [x] Environment Variables: Centralized typed configuration module (VITE_*).
- [x] Demo Data: Deterministic 90-day history with 5 habit patterns and settings controls.
- [x] Stats and Charts: Lazy-loaded statistics view with Chart.js + vue-chartjs visualizations.
- [ ] Deployment & Verification: Production deployment on Vercel with automated CI passing.

### Phase 2: Upcoming Features (Architecture Ready)
- [x] **Stats and Charts:** Completion rates, best streaks, weekly and monthly evolution graphs using Chart.js + ue-chartjs.
- [x] **Demo Data Generator:** Instant realistic statistics without weeks of manual tracking.
- [ ] **Custom Frequencies & Quantities:** Specific weekday schedules, "X times per week" targets, and numeric targets (e.g., 8 glasses of water).
- [ ] **Reminders & PWA Support:** Browser notifications at configured times and offline installation via ite-plugin-pwa.
- [ ] **Data Portability & Sync:** JSON/CSV data backup, export, and import; optional cloud sync via free-tier provider (e.g. Supabase / Firebase).

---

## Contributing & Working Rules

We maintain high engineering standards with a simple and disciplined workflow:

### Branching Strategy
- `main`: Production branch. Always deployable and protected. Automated deploys to Vercel production.
- `develop`: Integration branch. All features merge into `develop` via pull requests.
- `feature/*`: Specific feature branches branched from `develop` (e.g. `feature/habit-crud`, `feature/streak-calc`).

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
1. `npm run lint` must pass with zero errors.
2. `npm run test:unit` must pass all tests.
3. `npm run build` must succeed without TypeScript errors.

### CI/CD
GitHub Actions runs automatically on every pull request targeting `develop` or `main`. All checks (lint, tests, build) must pass before a merge is permitted.

---

## License

This project is licensed under the [MIT License](LICENSE) — free and open source forever.
