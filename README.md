# BuildBoard

<div align="center">

**Working prototypes. Real feedback. Zero superficial launch noise.**

A collaborative platform where early-stage software builders connect with relevant beta testers to test functional prototypes, gather structured critiques, and iterate before public launch.

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![React Router](https://img.shields.io/badge/React_Router-v8-CA4245?style=flat-square&logo=reactrouter&logoColor=white)](https://reactrouter.com/)
[![Motion](https://img.shields.io/badge/Motion-React-F08080?style=flat-square)](https://motion.dev/)
[![Demo Mode](https://img.shields.io/badge/State-Local_Demo_Mode-orange?style=flat-square)](#-local-demo-architecture)

[Features](#-key-features) • [How It Works](#-how-it-works) • [Quick Start](#-quick-start) • [Tech Stack](#-technology-stack) • [Project Structure](#-project-structure) • [Documentation](#-deep-dive-documentation)

---

</div>

## Why BuildBoard?

Traditional launch platforms (Product Hunt, Reddit, Hacker News) are great for hype and marketing, but **painful for early validation**:

| The Traditional Launch Trap | The BuildBoard Solution |
| :--- | :--- |
| **Popularity Contests**: Prioritizes flashy graphics and upvote rings over raw product utility. | **Utility-First**: Focuses on functioning prototypes with clear "What to Try" task checklists. |
| **Superficial Feedback**: Comments like *"Great idea! Upvoted!"* provide zero actionable signal. | **Structured Critiques**: High-signal categorization (Bugs, Usability, UI, Features, Likes). |
| **Audience Mismatch**: Random users review specialized tools outside their domain of expertise. | **Explainable Matching**: Score-based engine matches products to testers by skill and role. |
| **Unrewarded Testers**: Testers spend 30 minutes testing an unpolished app and receive nothing. | **Recognition Loop**: Makers reply directly and award public Recognition Points for helpful critiques. |

---

## Key Features

### Explainable Tester Matching & Catalog
- **Target Audience Specification**: Builders define precise target criteria (roles, industries, tech stack, experience levels).
- **Match Score Engine**: Transparent recommendation scoring (+1 per matching skill/criterion) explaining *why* a prototype fits a tester's profile.
- **Instant Search & Filtering**: Multi-axis client-side filtering across keywords, categories, and technologies.

### Gated Prototype Testing & Checklists
- **Protected URLs**: Prototype links are shielded behind an enrollment gate to ensure genuine tester commitment.
- **"What to Try" Checklists**: Guides testers through critical user journeys and core feature flows.
- **Live View Tracking**: Automatically records listing visits and feeds real-time conversion stats back to builders.

### Structured Feedback & Recognition
- **Targeted Feedback Formats**: Critiques categorized by *What worked well*, *Bug / issue*, *Usability*, *UI*, or *Feature idea*.
- **Maker Reply System**: Builders can post dedicated replies directly to individual critiques.
- **Helpful Badges & Points**: Product owners endorse top feedback with a "Helpful" mark, awarding verifiable Recognition Points.

### Pre-MVP Problem Validation Forum (`/problems`)
- **Validate Before Coding**: Post raw user pain points to gauge demand before writing a line of code.
- **One-Click Validation Upvotes**: Community-backed demand signals for emerging problems.
- **Solution Linking**: Builders can attach their prototype directly as a solution to a validated problem.
- **Reddit-Style Nested Threads**: Multi-level hierarchical discussions with collapsible threads and contextual replies.

### Live Market Radar
- **Real-Time Friction & Launch Radar**: Streams live builder questions and launch discussions directly via Algolia's Hacker News REST API.
- **Resilient Client**: Native `fetch()` integration with error boundaries, loading skeletons, and `AbortController` cancellation.

### Dashboards & Analytics
- **Builder Dashboard**: Aggregated view counts, enrollment numbers, feedback counts, and conversion funnel rates with instant pause/resume controls.
- **Tester Activity Hub**: Manages enrolled prototypes, submission history, and time-tiered contextual feedback reminders (`<24h`, `24–72h`, `72h+`).

### Warm Studio Design System
- **Dark & Light Mode**: Seamless theme switching with custom warm studio palette tokens.
- **Smooth Micro-Interactions**: Physics-based 3D tilt cards, kinetic headline animations, and accessible motion with `prefers-reduced-motion` compliance.

---

## How It Works

```mermaid
flowchart LR
    A[1. Define Prototype] -->|Specify Target Audience & Task Checklist| B[2. Match & Enroll]
    B -->|Tester Skills Match Criteria| C[3. Test & Critique]
    C -->|Submit Structured Feedback| D[4. Maker Reply & Reward]
    D -->|Award Recognition Points| E[5. Iterate & Launch]
```

1. **Post**: Builder submits an early prototype with target user criteria (e.g., *DevOps, Docker, Mid-Level*) and a test checklist.
2. **Match & Enroll**: Qualified testers discover the listing through explainable recommendations and enroll to unlock access.
3. **Critique**: Tester reviews the app, follows the checklist, and submits categorized, high-signal feedback.
4. **Reward**: Builder reviews the feedback, posts a reply, and marks insightful critiques as "Helpful" to award points.

---

## Quick Start

### Prerequisites
- **Node.js**: v20+ recommended
- **npm**: v10+ recommended

### Option 1: Run from Root Directory (Recommended)
```bash
# Install frontend dependencies
npm --prefix frontend install

# Start development server
npm run dev
```

### Option 2: Run from `frontend/` Directory
```bash
# Navigate to the frontend workspace
cd frontend

# Install dependencies
npm install

# Start the Vite dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to explore the app.

---

## Available Scripts

Run these scripts from either the root directory or inside `frontend/`:

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the Vite local development server with Hot Module Replacement (HMR) |
| `npm run build` | Compiles optimized production bundle into `frontend/dist/` |
| `npm run lint` | Runs ESLint checks across the codebase |
| `npm run preview` | Previews the production build locally |

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Core** | [React 19](https://react.dev/), [React Router v8](https://reactrouter.com/) (`^8.4.0`) |
| **Build Tool** | [Vite 8](https://vitejs.dev/) with Fast Refresh |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/vite`), Custom CSS Design Tokens |
| **Icons & Typography** | [Lucide React](https://lucide.dev/), Google Fonts (Inter) |
| **Animations** | [Motion](https://motion.dev/) (`motion/react`) with reduced-motion support |
| **State Management** | React Context (`AuthContext`, `DemoDataContext`, `ThemeContext`) |
| **Storage & Persistence**| Local `localStorage` (9 data namespaces) + `IndexedDB` (media/video uploads) |
| **External APIs** | Algolia Hacker News Search REST API (`https://hn.algolia.com/api/v1`) |

---

## Local Demo Architecture

BuildBoard is currently architected as a **zero-dependency, frontend-only local demo**:

- **No Remote Database Required**: All profiles, product submissions, feedback, upvotes, and comments are persisted securely in your browser's `localStorage`.
- **Media via IndexedDB**: Prototype screenshots and video uploads are stored locally in the browser's `IndexedDB` storage engine to prevent `localStorage` quota overflow.
- **Instant Reset / Seed Data**: Pre-populated with realistic builder prototypes, tester critiques, and problem discussions out-of-the-box.
- **Future Milestone**: Centralized database persistence, cloud authentication, and automated testing suites are planned for subsequent milestones.

---

## Project Structure

```text
BuildBoard/
├── docs/                       # Architecture, decisions, and system specifications
│   ├── decision.md             # Key design and technical decision records
│   ├── flow.md                 # User flow & interaction state diagrams
│   ├── summary.md              # Project evolution & feature inventory
│   └── system.md               # Data model & state management deep-dive
├── frontend/                   # Frontend client application
│   ├── public/                 # Static assets, hero banners & demo screenshots
│   │   ├── assets/landing/     # Hero workspace mockups & graphics
│   │   └── assets/products/    # Mock prototype preview SVGs
│   ├── src/
│   │   ├── components/         # Reusable UI components (Bento grid, carousels, cards)
│   │   ├── context/            # Global state (AuthContext, DemoDataContext, ThemeContext)
│   │   ├── data/               # Default seed products, problem threads & mock users
│   │   ├── pages/              # Application pages & route views
│   │   ├── utils/              # Recommendation engine, HN API, reminder logic & storage
│   │   ├── App.jsx             # Top-level routing & layout structure
│   │   └── main.jsx            # Application entrypoint
│   └── package.json            # Frontend dependencies & build configuration
├── package.json                # Root proxy runner scripts
└── README.md                   # Project documentation
```

---

## Deep Dive Documentation

For in-depth architectural decisions, state management diagrams, and system specifications, explore the [`docs/`](./docs) directory:

- 📖 [**Project Summary & Evolution (`docs/summary.md`)**](./docs/summary.md): Comprehensive feature inventory, rationale, and evolution from earlier prototypes.
- 📐 [**System Architecture & Data (`docs/system.md`)**](./docs/system.md): In-depth look at state namespaces, storage schemas, and IndexedDB handling.
- 🔀 [**User Flows & State Transitions (`docs/flow.md`)**](./docs/flow.md): Complete journey maps for builders, testers, and problem discoverers.
- ⚖️ [**Architectural Decision Records (`docs/decision.md`)**](./docs/decision.md): Detailed ADRs explaining tech stack choices and engineering trade-offs.

---

<div align="center">

Crafted with ❤️ for early-stage builders and proactive testers.

</div>
