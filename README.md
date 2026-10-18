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

- **Core**: React 19, React Router 7
- **Bundler**: Vite
- **Styling**: Tailwind CSS with custom warm studio theme tokens (supporting dark and light modes)
- **Animations**: `motion/react` with `prefers-reduced-motion` compliance
- **State & Data**: Client-side React Context (`AuthContext`, `DemoDataContext`, `ThemeContext`) backed by `localStorage`
- **Backend & Database**: Future work (not implemented in the current repository)
