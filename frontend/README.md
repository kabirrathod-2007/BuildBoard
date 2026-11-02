# BuildBoard Frontend Application

The modern, high-performance client interface for **BuildBoard** — built with **React 19**, **Redux Toolkit (RTK)**, **Vite 8**, **Tailwind CSS v4**, and **Motion**.

---

## 🚀 Key Technologies

- **React 19 (JSX)**: Functional components with modern hooks and concurrent rendering.
- **Redux Toolkit (`@reduxjs/toolkit ^2.13.0`) & React-Redux (`react-redux ^9.3.1`)**: Sliced domain state management, memoized selectors via `createSelector`, async thunks for API operations, and strict immutability.
- **Vite 8**: Sub-second dev server startup, instant Hot Module Replacement (<50ms), and optimized production builds.
- **Tailwind CSS v4 (`@tailwindcss/vite`)**: CSS-first design tokens with `@theme`, custom palettes, and zero-runtime CSS utility classes.
- **Motion (`motion/react`)**: Hardware-accelerated spring physics, kinetic typography, and accessible transitions complying with `prefers-reduced-motion`.
- **Firebase Auth (`firebase ^13.1.0`)**: 1-click Google Sign-in/up via `signInWithPopup`, email/password authentication with mandatory email verification, and secure session persistence.
- **IndexedDB (`idb-keyval` / custom IndexedDB utility)**: Client-side binary storage for prototype cover photos, gallery screenshots, and video walkthroughs.

---

## 🏛️ State Management Architecture (Redux Toolkit)

BuildBoard employs a **sliced Redux Toolkit store** (`frontend/src/store/`) wrapped at the application root:

```
Provider (Redux Store)
  └── BrowserRouter (React Router 8)
        └── ThemeProvider (Dark / Light Theme)
              └── AuthProvider (Firebase Auth Session)
                    └── DemoDataProvider (Zero-Breaking-Change Facade)
                          └── App Routes
```

### Store Directory Structure (`src/store/`)

```
src/store/
├── store.js             # Root store configuration with configureStore
├── hooks.js             # Custom typed/standard hooks: useAppDispatch, useAppSelector
├── index.js             # Barrel file re-exporting store, hooks, slices, and selectors
└── slices/
    ├── productsSlice.js      # Catalog, views tracking, tag filters, API CRUD thunks
    ├── problemsSlice.js      # Community problems, validations, signups, nested comments
    ├── feedbackSlice.js      # Prototype critiques, maker replies, helpful recognition
    ├── enrollmentsSlice.js   # Prototype access gate, time-tiered reminder dismissals
    ├── notificationsSlice.js # In-app notification center & live unread counter
    ├── profilesSlice.js      # Builder & tester profiles, public profile resolution
    └── uiSlice.js            # Directory layout mode (grid/list), active modals, toasts
```

### Using Redux in Components

Components can directly import fine-grained selectors and dispatch actions without unnecessary re-renders:

```javascript
import { useAppDispatch, useAppSelector, selectAllProducts, selectExploreViewMode, setExploreViewMode } from '../store/index.js'

export function MyComponent() {
  const dispatch = useAppDispatch()
  const products = useAppSelector(selectAllProducts)
  const viewMode = useAppSelector(selectExploreViewMode)

  return (
    <button onClick={() => dispatch(setExploreViewMode('list'))}>
      Switch to List View ({products.length} prototypes)
    </button>
  )
}
```

### Backward Compatibility Facade (`DemoDataContext.jsx`)

To ensure zero regressions across legacy pages, `DemoDataContext.jsx` acts as a facade connecting directly to the Redux store. Any component calling `useDemoData()` continues to work seamlessly while reading from and writing to Redux Toolkit under the hood.

---

## 📁 Source Directory Map

```
frontend/src/
├── components/          # Reusable UI components (Navbar, Footer, ProductCard, BentoShowcase, etc.)
├── context/             # AuthContext, ThemeContext, and DemoDataContext facade
├── data/                # Static targeting options (roles, industries, tech) & sample data
├── hooks/               # useDocumentTitle, useKeyboardShortcuts
├── lib/                 # api.js client methods connecting to Express backend (:3001)
├── pages/               # 15 Route Views (ExplorePage, ProductDetailsPage, BuilderDashboardPage, etc.)
├── store/               # Redux Toolkit store, slices, hooks, and selectors
├── utils/               # recommendations.js matching engine, feedbackReminder.js, indexedDB.js
├── App.jsx              # Route table configuration with React.lazy and Suspense
├── main.jsx             # Entry point mounting Redux Provider, Router, and Contexts
└── index.css            # Tailwind v4 theme tokens and global styles
```

---

## 🛠️ Available Scripts

Run these scripts from the `frontend/` directory (or with `--prefix frontend` from the root):

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite local development server on `http://localhost:5173` |
| `npm run build` | Compiles the production-ready build to `dist/` |
| `npm run lint` | Runs ESLint checks across JSX/JS files |
| `npm run preview` | Serves the production build locally for verification |

---

## 🔐 Environment Configuration

Create a `.env.local` file in `frontend/`:

```env
# Backend API Base URL
VITE_API_URL=http://localhost:3001

# Firebase Client Configuration (from Firebase Console)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
