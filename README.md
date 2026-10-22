# BuildBoard

BuildBoard is a community platform where builders share early prototypes and gather structured feedback from targeted testers.

> **Note**: BuildBoard is currently a **frontend-only project** running in local demo mode. All data (accounts, product listings, tester enrollments, feedback, upvotes) is stored locally in the browser's `localStorage` and is not synchronized to a remote server or shared across devices. Backend integration and centralized database persistence are planned as future work.

---

## Getting Started

### Prerequisites

- **Node.js** (v20+ recommended)
- **npm** (v10+ recommended)

### Running the Application

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```
   Open the printed URL (typically `http://localhost:5173`) in your browser.

---

## Available Scripts

From the `frontend/` directory:

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `dev` | `npm run dev` | Starts Vite development server with Hot Module Replacement (HMR) |
| `build` | `npm run build` | Compiles production assets into `frontend/dist/` |
| `lint` | `npm run lint` | Runs ESLint across all frontend source files |
| `preview` | `npm run preview` | Previews the production build locally |

---

## Architecture & Technology Stack

- **Core**: React 19, React Router 8 (`react-router ^8.4.0`)
- **Bundler**: Vite 8
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`) with custom warm studio theme tokens (supporting dark and light modes)
- **Animations**: `motion/react` with `prefers-reduced-motion` compliance
- **State & Data**: Client-side React Context (`AuthContext`, `DemoDataContext`, `ThemeContext`) backed by 9 `localStorage` namespaces
- **Media Storage**: Client-side media upload persistence (screenshot gallery and demo video) implemented via browser `IndexedDB`
- **Features Shipped**: Product catalog & explainable matching, gated prototype testing, structured feedback & maker replies, pre-MVP problem validation forum (`/problems`) with Reddit-style nested comments, simulated email verification (`/verify-email`), and **Live Market Radar** (real-time builder friction & launch signals powered by the Hacker News Search REST API via native `fetch()`)
- **External API Integration**: Native browser `fetch()` implementation consuming Algolia's Hacker News REST API (`https://hn.algolia.com/api/v1`) in `src/utils/hackerNewsApi.js` with live tab filtering, error boundaries, request abortion (`AbortController`), and loading skeleton states
- **Testing**: Automated test suites are not currently implemented in the repo
- **Backend & Database**: Production cloud database & centralized backend persistence are planned for future milestones
