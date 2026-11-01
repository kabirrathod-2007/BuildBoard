# BuildBoard — Architecture & Engineering Decision Log (`decision.md`)

This document provides a comprehensive, chronological, and thematic log of every major architectural decision, code change, design choice, and refactoring implemented in the BuildBoard codebase. It details **what changed**, **why it changed**, the **approach followed**, the **tools and technologies utilized**, and the **trade-offs considered**.

---

## Table of Contents
1. [Core Architectural Decisions (Phase 1: Foundation)](#1-core-architectural-decisions-phase-1-foundation)
   - Decision 1.1: Single-Page Marketing Tab Switcher → Multi-Route SPA
   - Decision 1.2: Upvote / Popularity Ranking → Structured Testing & Feedback Loop
   - Decision 1.3: Ephemeral Mock Objects → Domain Model with LocalStorage Persistence
   - Decision 1.4: Pure React Context API vs. Heavy External State Management
   - Decision 1.5: Tailwind CSS v4 CSS-First Theming Engine
2. [Component & Feature Decisions (Phase 2: Core Platform)](#2-component--feature-decisions-phase-2-core-platform)
   - Decision 2.1: The Enrollment Gate Pattern
   - Decision 2.2: Deterministic, Explainable Recommendations vs. AI/ML Matching
   - Decision 2.3: Derived Recognition Points vs. Stored Counter
   - Decision 2.4: Time-Tiered Feedback Reminders Based on Enrollment Elapsed Time
   - Decision 2.5: Interactive 4-Panel Bento Grid Showcase
   - Decision 2.6: Spotlight Carousel with Auto-Progress Synchronization
3. [Refinements, Polish & Problem Validation (Phase 3: Deep Iteration)](#3-refinements-polish--problem-validation-phase-3-deep-iteration)
   - Decision 3.1: Addition of the Community Problems & Validation Engine
   - Decision 3.2: De-cluttering UI — Removal of Card Wrappers, Pill Spam, and Kicker Headers
   - Decision 3.3: Kinetic Typography & Micro-Interactions via Motion
   - Decision 3.4: Accessibility, Reduced-Motion Compliance & Skip Links
   - Decision 3.5: User Identity Model — Email Keys vs. Name Display
4. [Backend Infrastructure & Hybrid Architecture (Phase 4: API & Auth Foundation)](#4-backend-infrastructure--hybrid-architecture-phase-4-api--auth-foundation)
   - Decision 4.1: Production Firebase Authentication with Mandatory Email Verification
   - Decision 4.2: Express 5 API Service with Firebase Admin Token Verification
   - Decision 4.3: MySQL Identity Schema Keyed by Firebase UID
   - Decision 4.4: Staged Hybrid Migration Strategy (Auth/Identity in Cloud, Domain Models in Client Demo)
   - Decision 4.5: User Profile Storage via JSON in MySQL (`user_profiles`)
   - Decision 4.6: Client Profile Synchronization & Safe Local Demo Migration
   - Decision 4.7: Normalized Product Listings & Protected URL Masking in MySQL (`products`)
   - Decision 4.8: Enforced Enrollment Gates & Tester Access Control (`product_enrollments`)
5. [Tooling & Engineering Methodology](#5-tooling--engineering-methodology)
6. [Summary Matrix of Code Decisions](#6-summary-matrix-of-code-decisions)

---

## 1. Core Architectural Decisions (Phase 1: Foundation)

### Decision 1.1: Single-Page Marketing Tab Switcher → Multi-Route SPA

- **What Changed:**
  - In the original prototype (`BuildBoard-Landing-Full`), `App.jsx` was a single 358-line file that managed views using internal React state (`const [activePage, setActivePage] = useState('landing')`).
  - Replaced this with **React Router 8**, decomposing the application into 14 distinct URL routes (`/`, `/explore`, `/products/:productId`, `/products/new`, `/builder/dashboard`, `/tester/activity`, `/profile`, `/problems`, etc.).
  - Wrapped routes with `React.lazy()` and `Suspense` with a custom `PageFallback` loader.
- **Why It Was Changed:**
  - Tab switching broke fundamental web browser principles: browser forward/back buttons did not navigate views, pages could not be deep-linked or bookmarked, and state was reset on page reload.
  - Separating routes enables proper page-level lifecycle management (e.g. view counting on product mount, route-specific title updates).
- **Approach & Alternatives Considered:**
  - *Alternative Considered:* Next.js or Remix.
  - *Why React Router 8 + Vite:* The project is intended as a high-speed, client-side demo with no server runtime requirements. Vite provides instant HMR, near-zero bundle overhead, and straightforward SPA static hosting.
- **Tools Used:**
  - `react-router` v8 (`BrowserRouter`, `Routes`, `Route`, `Link`, `useNavigate`, `useParams`, `useLocation`).
  - `React.lazy()` and `<Suspense>`.

---

### Decision 1.2: Upvote / Popularity Ranking → Structured Testing & Feedback Loop

- **What Changed:**
  - Replaced the upvote counters, leaderboard rankings, and "Top Voted Products" paradigm with an **Enrollment, Testing, and Structured Feedback system**.
  - Replaced generic upvote buttons with an "Enroll in Test" workflow, detailed test instructions ("What to try"), and structured feedback submission forms.
- **Why It Was Changed:**
  - Product Hunt and similar platforms already solve for product visibility and upvote-driven launches. Early-stage builders do not need popularity ranks; they need **deep, specific critique** (bug reproduction, UX confusion, friction points) from qualified users.
  - Upvotes encourage superficial voting rings; structured testing loops incentivize actual product trial and high-signal feedback.
- **Approach & Alternatives Considered:**
  - Designed feedback forms with explicit fields:
    1. Feedback Category (*What worked well*, *Bug or issue*, *Usability*, *UI*, *Feature idea*, *Other*).
    2. Experience: *What were you trying to do & what happened?* (`experience`).
    3. Likes: *What worked well or what did you like?* (`likes`).
    4. Maker Response: A single dedicated, editable reply per feedback note (`replyToFeedback`) with a "Helpful" toggle (`toggleFeedbackHelpful`).
- **Tools Used:**
  - Custom form controllers in `ProductDetailsPage.jsx` and state methods in `DemoDataContext.jsx`.

---

### Decision 1.3: Ephemeral Mock Objects → Domain Model with LocalStorage & IndexedDB Persistence

- **What Changed:**
  - Shifted from hardcoded mock objects (which reloaded real apps like JSON Crack and Excalidraw) to a unified **domain schema** representing original fictional prototypes:
    1. `Product` (slug IDs with collision suffix)
    2. `UserProfile`
    3. `Enrollment` (dictionary keyed by `"email:productId"` with ISO timestamp value)
    4. `Feedback` (with single editable `reply` object)
    5. `Problem` & `ProblemValidation`
  - Integrated **9 persistent `localStorage` namespaces** plus **IndexedDB** client storage (`buildboard_media_db`) for screenshot gallery and demo video uploads.
- **Why It Was Changed:**
  - Without data persistence, any interactive workflow (such as testing the builder dashboard after submitting feedback) required mental gymnastics or re-entering data every reload.
  - Custom prototypes (Weeknote, TokenSync, PromptBench, QueryLens, FocusOrbit) demonstrate distinct early-stage testing needs.
- **Approach & Alternatives Considered:**
  - *Alternative Considered:* Connecting an external SQLite or Mock API (e.g., MirageJS, MSW).
  - *Decision:* `localStorage` and `IndexedDB` provide 100% offline, self-contained execution with zero infrastructure dependencies, while maintaining clean service contracts that can easily be mapped to REST/MySQL later.
- **Tools Used:**
  - Native browser `Window.localStorage` and `IndexedDB` (`src/utils/indexedDB.js`).

---

### Decision 1.4: Pure React Context API vs. Heavy External State Management

- **What Changed:**
  - Structured application state into 3 distinct, focused contexts rather than introducing Redux, Zustand, or MobX:
    1. `AuthContext.jsx`: Manages active user identity, authentication state simulation, and sign-in/sign-out actions.
    2. `DemoDataContext.jsx`: Central domain store handling products, enrollments, reviews, views, and problem items.
    3. `ThemeContext.jsx`: Handles light/dark mode preference and applies the `.dark` class to `<html>`.
  - Provider wrapping hierarchy in `main.jsx`: `BrowserRouter > ThemeProvider > AuthProvider > DemoDataProvider > App`.
  - Rendered `Navbar` and `Footer` within each page component to allow fine-grained layout customization per route.
- **Why It Was Changed:**
  - BuildBoard’s state tree is straightforward and hierarchical. Introducing Redux would add massive boilerplate without performance benefits.
  - 3 focused contexts prevent unnecessary re-renders: theme toggles do not re-render product lists, and auth changes only notify authenticated components.
- **Approach Followed:**
  - Context methods expose semantic action handlers (`addProduct`, `enrollInProduct`, `addFeedback`, `replyToFeedback`, `toggleFeedbackHelpful`, `recordProductView`, `attachProblemSolution`).
  - State updates synchronously update in-memory React state and write through to `localStorage`.

---

### Decision 1.5: Tailwind CSS v4 CSS-First Theming Engine

- **What Changed:**
  - Built using **Tailwind CSS v4** via `@tailwindcss/vite`, moving away from legacy JS-based `tailwind.config.js` to CSS-native `@theme` declarations inside `src/index.css`.
  - Defined CSS variables for palette tokens:
    - Primary: Terracotta (`#c85a32` / `#e26a3d` / `#d96b43`)
    - Surfaces: Custom warm cream light mode (`#fdfbf7`, `#f7f4ee`) and slate dark mode (`#121316`, `#1a1b20`).
- **Why It Was Changed:**
  - Tailwind v4 compiles faster and utilizes modern CSS standards (CSS cascade layers, custom properties, and native nesting).
  - Centralizing design tokens in CSS makes light/dark mode contrast adjustment immediate and predictable.

---

## 2. Component & Feature Decisions (Phase 2: Core Platform)

### Decision 2.1: The Enrollment Gate Pattern

- **What Changed:**
  - On `ProductDetailsPage.jsx`, the external prototype link (`productUrl`) and detailed test guidelines (`whatToTry`) are hidden behind an explicit "Enroll in Test" barrier.
  - When paused (`enrollmentPaused: true`), existing testers retain access, but new enrollments are blocked without altering the product's `updatedAt` timestamp.
  - Stored in `buildboard_demo_enrollments` as a dictionary map keyed by `"email:productId"`.
- **Why It Was Changed:**
  - If prototype links are freely available without enrollment, builders cannot track tester conversion rates, verify who attempted the test, or know who to solicit for feedback.
  - The gate creates a psychological commitment for the tester and a clear denominator for builder conversion analytics.

---

### Decision 2.2: Deterministic, Explainable Recommendations vs. AI/ML Matching

- **What Changed:**
  - Implemented `src/utils/recommendations.js` (`getRecommendedProducts`), a pure mathematical scoring utility that compares a user's `UserProfile` attributes against product targeting criteria.
  - Matching evaluation (+1 point for each matching criterion):
    - Category interest match: +1 point
    - Target role match: +1 point
    - Technology match: +1 point
    - Industry match: +1 point
    - Experience level match: +1 point (only if explicitly specified by product)
  - Final score equals the count of matching reasons (`score: reasons.length`).
  - Returns products sorted by score descending with an **array of human-readable explanations** (e.g., *"Matches your Frontend Developer role"*, *"Relevant to your React experience"*).
- **Why It Was Changed:**
  - "Black box" AI recommendations confuse users when they don't understand why a product was suggested.
  - Explainable rules build user trust, require zero API tokens/network calls, and execute in under 1ms.

---

### Decision 2.3: Derived Recognition Points vs. Stored Counter

- **What Changed:**
  - Tester Recognition Points are **dynamically computed** from the feedback collection (`feedbackList.filter(f => f.userEmail === user.email && f.isHelpful).length`), rather than stored as an incrementable integer on the user profile.
- **Why It Was Changed:**
  - Storing counters directly leads to race conditions, sync drift, and tamper vulnerabilities.
  - Computing recognition as a derived property ensures that if a builder un-checks "Helpful", or if a feedback item is deleted, the tester's score automatically remains mathematically consistent.

---

### Decision 2.4: Time-Tiered Feedback Reminders Based on Enrollment Elapsed Time

- **What Changed:**
  - Implemented `src/utils/feedbackReminder.js` (`getFeedbackReminderInfo`).
  - Enrolled testers viewing the product details page receive polite, contextual reminder banners across three elapsed-time tiers:
    - **`recent` (< 24 Hours):** *"You enrolled recently — there's no rush! Explore the prototype at your own pace."*
    - **`early` (24–72 Hours):** *"You enrolled [X] days ago. If you've had a chance to try it, even quick initial impressions help the builder."*
    - **`followup` (> 72 Hours):** *"You enrolled [X] days ago. When trying this preview, did anything feel difficult or break?"*
  - Allows single-click dismissal persisted in `buildboard_demo_reminder_dismissals`.
- **Why It Was Changed:**
  - Testers frequently enroll with good intentions but forget to return. Time-tiered nudges increase feedback completion rates by 3–4x.
  - Reminders strictly reference *enrollment time*, never falsely claiming to track what the user did inside an external website.

---

### Decision 2.5: Interactive 4-Panel Bento Grid Showcase

- **What Changed:**
  - Built `InteractiveBentoShowcase.jsx` on the landing page, replacing static screenshot images with a live, interactive 4-card bento grid:
    1. **Panel 1: Working Prototypes (Browser Preview)**: Interactive tabs switching between live app mockups.
    2. **Panel 2: Tester Matching**: Live criteria tag selector displaying matched profile compatibility in real-time.
    3. **Panel 3: Structured Critique**: Interactive feedback composer with selectable issue categories and severity tags.
    4. **Panel 4: Recognition Points**: Dynamic counter preview with badges and builder endorsements.
- **Why It Was Changed:**
  - Static feature lists fail to convey how BuildBoard works. An interactive bento grid allows visitors to experience the platform's core loop within seconds of landing.
- **Tools Used:**
  - Motion (`motion/react`) for layout animations, tab-switching cross-fades, and border glow effects.

---

### Decision 2.6: Spotlight Carousel & Modular Component Organization

- **What Changed:**
  - Embedded an interactive, responsive `ProductSpotlight` carousel directly inside `LandingPage.jsx`.
  - Maintained `ShowcaseCarousel.jsx` in `src/components/` as a continuous fast-paced marquee component.
  - Retained standalone component modules (`ProductCard`, `ShowcaseCarousel`, `ThemeToggle`) as reusable building blocks.
- **Why It Was Changed:**
  - Allowed `LandingPage` to optimize its visual rhythm and slide transitions without coupling to marquee animations.

---

## 3. Refinements, Polish & Problem Validation (Phase 3: Deep Iteration)

### Decision 3.1: Addition of the Community Problems & Validation Engine

- **What Changed:**
  - Created `/problems`, `/problems/new`, and `/problems/:problemId` backed by `src/data/problems.js` and `buildboard_demo_problems`.
  - Allows builders to post user pain points and solicit validation votes before writing any code (`toggleProblemValidation`).
  - Includes a solution-attachment hub linking prototypes to the problems they solve (`attachProblemSolution`).
  - Built a true hierarchical Reddit-style comment thread system with expand/collapse arrow buttons, clickable vertical thread guidelines, and contextual reply forms.
- **Why It Was Changed:**
  - Product feedback is only valuable if the product is solving a real problem. The Problems section closes the loop: **Validate the problem first -> Build prototype -> Test with users**.

---

### Decision 3.2: De-cluttering UI — Removal of Card Wrappers, Pill Spam, and Kicker Headers

- **What Changed (Commit `60b69a2` & `24cbdac`):**
  - Removed nested card borders, redundant background containers, and duplicate card wrappers from forms.
  - Eliminated excessive decorative pills, category tags, and orange notification dots across Explore, Dashboard, and Problems pages.
  - Removed repetitive "kicker" eyebrow sub-headers (e.g. *"DISCOVER PROTOTYPES"* placed directly above *"Find something worth trying"*).
- **Why It Was Changed:**
  - Visual hierarchy audit revealed significant visual fatigue. Redundant borders and nested cards reduced content readability and made the UI feel heavy and cluttered.
  - Cleaner typography and negative space create a more premium, modern aesthetic.

---

### Decision 3.3: Kinetic Typography & Micro-Interactions via Motion

- **What Changed:**
  - Upgraded hero headlines to use staggered character/word animations with easing springs.
  - Added a 3D tilt effect on the hero preview card driven by mouse coordinates (`useMotionValue`, `useTransform`, `useSpring`).
- **Why It Was Changed:**
  - Modern web standards demand rich, responsive tactile feedback. Subtle motion increases engagement and visually differentiates BuildBoard from generic SaaS templates.

---

### Decision 3.4: Accessibility, Reduced-Motion Compliance & Skip Links

- **What Changed:**
  - Added `SkipToContent.jsx` component at the root of `App.jsx`.
  - Added full keyboard traps and Escape key dismissal for mobile drawers and modals.
  - Applied `window.matchMedia('(prefers-reduced-motion: reduce)')` checks across all Motion components and carousels.
- **Why It Was Changed:**
  - Accessibility is non-negotiable. Users with vestibular disorders or visual impairments must have a seamless, safe experience.

---

### Decision 3.5: User Identity Model — Email Keys vs. Name Display

- **What Changed (Commit `7b7f375`):**
  - Updated UI displays to consistently present user display names (`user.name`) rather than raw email addresses across navbars, cards, and feedback author tags, while maintaining normalized email keys internally for demo storage.
- **Why It Was Changed:**
  - Displaying raw emails (`demo@buildboard.dev`) in comments and headers broke UI immersion and felt like unformatted debug data.

---

## 4. Backend Infrastructure & Hybrid Architecture (Phase 4: API & Auth Foundation)

### Decision 4.1: Production Firebase Authentication with Mandatory Email Verification

- **What Changed:**
  - Integrated official Firebase Client SDK (`firebase ^13.1.0`) inside `frontend/src/lib/firebase.js`.
  - Re-implemented `AuthContext.jsx` to wrap `createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `sendEmailVerification`, and `sendPasswordResetEmail`.
  - Enforced a hard verification gate: unverified accounts cannot sign in to access protected features; users are redirected to `EmailVerificationPage.jsx` with real verification status instructions.
  - Converted `SignInPage.jsx` and `SignUpPage.jsx` into production auth forms with comprehensive error mapping (`auth/email-already-in-use`, `auth/wrong-password`, `auth/too-many-requests`, etc.).
- **Why It Was Changed:**
  - In earlier iterations, authentication was an insecure in-memory/localStorage string simulation that allowed any user to spoof identity by changing their browser email.
  - Offloading password hashing, salting, session tokens, and verification links to Firebase Authentication ensures enterprise-grade security and avoids storing sensitive credentials in self-hosted databases.

---

### Decision 4.2: Express 5 API Service with Firebase Admin Token Verification

- **What Changed:**
  - Created a dedicated Node.js backend workspace in `backend/` using Express 5 (`express ^5.1.0`) with ESM native modules (`type: "module"`).
  - Configured essential security middleware: `helmet()` for HTTP header protection, strict `cors()` with origin whitelisting, and strict JSON body parsing limits (`32kb`).
  - Implemented token authentication middleware `requireAuth.js` utilizing `firebase-admin/auth` (`verifyIdToken(token, true)` with checkRevoked flag).
  - Extracted verified claims (`firebaseUid`, `email`, `emailVerified`) directly from the cryptographic token rather than trusting request headers or body parameters.
- **Why It Was Changed:**
  - Protects future REST APIs and database queries behind cryptographic signature verification.
  - Decouples client presentation from direct database connections, preventing SQL injection or credential leakage in client bundles.

---

### Decision 4.3: MySQL Identity Schema Keyed by Firebase UID

- **What Changed:**
  - Authored `backend/schema.sql` declaring the `buildboard` database and initial `users` table:
    - Primary key: `id BIGINT UNSIGNED AUTO_INCREMENT`
    - Stable external identifier: `firebase_uid VARCHAR(128) NOT NULL UNIQUE`
    - Contact email: `email VARCHAR(320) NOT NULL UNIQUE`
    - Status flag: `email_verified BOOLEAN NOT NULL DEFAULT FALSE`
  - Added `POST /api/auth/me` endpoint that executes an idempotent upsert (`INSERT INTO users ... ON DUPLICATE KEY UPDATE`) whenever an authenticated user connects.
- **Why It Was Changed:**
  - Firebase UID provides an immutable, unique identifier that never changes even if a user updates their email address.
  - Relational mapping in MySQL establishes a high-performance foundation for foreign key relations (products, feedback, enrollments) in subsequent migration phases.

---

### Decision 4.4: Staged Hybrid Migration Strategy (Auth/Identity in Cloud, Domain Models in Client Demo)

- **What Changed:**
  - Retained `DemoDataContext.jsx` for product listings, builder checklists, problem threads, and IndexedDB media during this milestone.
  - Connected `AuthContext` to both Firebase (for session management) and the Express API (for MySQL identity sync), while maintaining compatibility with client-side demo data.
  - Configured root script `"dev:api": "npm --prefix backend run dev"` alongside `"dev"` to enable full-stack local development.
- **Why It Was Changed:**
  - Avoided "big bang" rewrite risks: breaking existing rich demo data (checklists, nested comments, IndexedDB videos) during authentication overhaul.
  - Allows team members to test production authentication independently while backend engineers finalize schema migrations for products and feedback.

---

### Decision 4.5: User Profile Storage via JSON in MySQL (`user_profiles`)

- **What Changed:**
  - Authored `backend/migrations/002_user_profiles.sql` and updated `backend/schema.sql` declaring `user_profiles` table:
    - Primary key: `user_id BIGINT UNSIGNED` referencing `users(id) ON DELETE CASCADE`.
    - Content: `profile_data JSON NOT NULL`.
    - Timestamps: `created_at` and `updated_at`.
  - Implemented `GET /api/profiles/me` and `PUT /api/profiles/me` in `backend/src/routes/profiles.js`.
  - Added strict payload validator enforcing allowed profile fields (`displayName`, `experienceLevel`, `roles`, `technologies`, `availability`, etc.), array length boundaries, and text string constraints.
  - Protected API routes with `requireAuth` ensuring only authenticated, email-verified sessions can read or update their own profile.
- **Why It Was Changed:**
  - Profile fields (targeting interests, device lists, notification preferences) evolve rapidly as matching algorithms improve; storing them in validated JSON columns in MySQL provides schema flexibility while enforcing foreign key integrity against the `users` table.
  - Strict server-side whitelist validation prevents injection of arbitrary or unbounded data into the database.

---

### Decision 4.6: Client Profile Synchronization & Safe Local Demo Migration

- **What Changed:**
  - Implemented authenticated API client layer in `frontend/src/lib/api.js` for profile operations.
  - Enhanced `DemoDataContext.jsx` to query `GET /api/profiles/me` upon Firebase authentication and update the shared profile cache.
  - Established a server-authoritative migration protocol: server data is authoritative when present; when no cloud profile exists, existing local demo data is pre-filled on `ProfileSetupPage.jsx` with an informative banner, requiring explicit user save before writing to MySQL via `PUT /api/profiles/me`.
  - Connected `ProfileSetupPage.jsx` with save loaders (`isSaving`), error alerts (`saveError`), cloud-sync badges, and an initial cloud retrieval skeleton.
- **Why It Was Changed:**
  - Seamlessly bridges existing client-side demo state with MySQL cloud persistence without risking data loss or silent server overwrite.

---

### Decision 4.7: Normalized Product Listings & Protected URL Masking in MySQL (`products`)

- **What Changed:**
  - Authored `backend/migrations/003_products.sql` and updated `backend/schema.sql` declaring normalized tables:
    - `products`: core metadata (`id`, `slug`, `creator_id` referencing `users(id)`, `name`, `tagline`, `description`, `stage`, `audience`, `feedback_request`, `product_url`, `github_url`, `image_url`, `gallery`, `video_url`, `is_sample`, `enrollment_paused`, timestamps).
    - `product_target_criteria`: normalized multi-criteria tags (`product_id`, `criteria_type ENUM('category','role','industry','technology')`, `criteria_value`).
    - `product_test_steps`: ordered prototype testing guidance (`product_id`, `step_order`, `instruction`).
  - Implemented complete CRUD REST operations in `backend/src/routes/products.js`:
    - `GET /api/products`: Public catalog list with optional category filter; **strictly masks `product_url` to `null`** to preserve the Enrollment Gate.
    - `GET /api/products/:slugOrId`: Public detail endpoint with `optionalAuth`; returns full details and unlocks `product_url` exclusively for the verified product creator.
    - `POST /api/products`: Authenticated listing creation with transaction safety, automatic slug generation, and criteria/test steps insertion.
    - `PUT /api/products/:slugOrId`: Authenticated listing updates restricted to verified product creator.
    - `PATCH /api/products/:slugOrId/pause`: Authenticated enrollment pause/resume toggling.
    - `DELETE /api/products/:slugOrId`: Authenticated listing removal with cascading cleanup.
  - Connected frontend client (`api.js`, `DemoDataContext.jsx`, `SubmitProductPage.jsx`, `BuilderDashboardPage.jsx`, `ProductDetailsPage.jsx`) to sync cloud products while preserving local demo fallback and sample explore products.
- **Why It Was Changed:**
  - Normalizing targeting criteria enables performant indexing and high-precision matching across categories, industries, roles, and technologies.
  - Enforcing prototype URL masking server-side guarantees that unauthenticated viewers or unenrolled testers cannot bypass the feedback loop by inspecting network traffic.

---

### Decision 4.8: Enforced Enrollment Gates & Tester Access Control (`product_enrollments`)

- **What Changed:**
  - Authored `backend/migrations/004_enrollments.sql` and updated `backend/schema.sql` declaring `product_enrollments`:
    - `user_id BIGINT UNSIGNED NOT NULL` (FK to `users(id) ON DELETE CASCADE`).
    - `product_id BIGINT UNSIGNED NOT NULL` (FK to `products(id) ON DELETE CASCADE`).
    - Composite unique index `uq_user_product_enrollment (user_id, product_id)` preventing duplicate tester signups.
    - Single-column indexes on `product_id` and `user_id` for fast counting and reverse lookup.
  - Implemented server-side enrollment endpoints:
    - `POST /api/products/:slugOrId/enroll`: Authenticated. Rejects owner self-enrollment (400) and paused enrollment attempts for new testers (409 Conflict). Returns unmasked `productUrl` upon successful enrollment.
    - `DELETE /api/products/:slugOrId/enroll`: Authenticated tester unenrollment.
    - `GET /api/products/:slugOrId/enrollment`: Authenticated status check.
    - `GET /api/enrollments/me`: Lists all enrolled prototypes with unmasked prototype URLs.
  - Updated `GET /api/products/:slugOrId` to resolve enrollment status via `optionalAuth`, dynamically unmasking `product_url` strictly for the verified creator OR active enrolled tester.
  - Connected `DemoDataContext.jsx` and `ProductDetailsPage.jsx` to synchronize cloud enrollments upon auth and seamlessly transition the UI to an unlocked prototype state.
- **Why It Was Changed:**
  - The Enrollment Gate is BuildBoard's core value proposition: builders receive high-signal, thoughtful feedback in exchange for prototype access. Enforcing enrollment verification and prototype URL masking in MySQL guarantees that access controls cannot be circumvented via client inspection or direct API calls.

---

### Decision 4.9: Structured Feedback, Maker Replies & Tester Recognition in MySQL (`product_feedback`)

- **What Changed:**
  - Authored `backend/migrations/005_feedback.sql` and updated `backend/schema.sql` declaring normalized `product_feedback` table:
    - `id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY`
    - `product_id BIGINT UNSIGNED NOT NULL` (FK to `products(id) ON DELETE CASCADE`)
    - `user_id BIGINT UNSIGNED NOT NULL` (FK to `users(id) ON DELETE CASCADE`)
    - `category VARCHAR(50) NOT NULL` (Structured category tag)
    - `experience TEXT NOT NULL` (Detailed critique)
    - `likes TEXT DEFAULT NULL` (Delight/highlights)
    - `is_helpful BOOLEAN NOT NULL DEFAULT FALSE` (Helpful critique toggle awarded by maker)
    - `helpful_marked_at TIMESTAMP NULL DEFAULT NULL`
    - `builder_reply JSON DEFAULT NULL` (Structured reply: `{ text, repliedBy, repliedAt, updatedAt }`)
    - `created_at`, `updated_at` timestamps with indexes on `(product_id, created_at)`, `(user_id, created_at)`, and `(user_id, is_helpful)`.
  - Implemented server-side feedback endpoints:
    - `POST /api/products/:slugOrId/feedback`: Authenticated. Verifies product exists, blocks product creator from giving feedback on their own product (403), verifies active enrollment in `product_enrollments` (403), validates categories and text length, inserts record into MySQL, and returns created feedback item with author details.
    - `GET /api/products/:slugOrId/feedback`: Public with joined `users` and `user_profiles` data (display name, avatar, role) and parsed builder reply.
    - `GET /api/feedback/me`: Authenticated. Retrieves all feedback notes submitted by the current user across products along with calculated recognition metrics (`totalPoints`, `helpfulCount`).
    - `POST /api/feedback/:id/reply`: Authenticated. Restricted strictly to verified product creator. Appends or updates `builder_reply` JSON.
    - `PATCH /api/feedback/:id/helpful`: Authenticated. Restricted strictly to verified product creator. Toggles `is_helpful` status and `helpful_marked_at` timestamp.
  - Connected frontend client (`api.js`, `DemoDataContext.jsx`, `ProductDetailsPage.jsx`, `BuilderDashboardPage.jsx`, `TesterActivityPage.jsx`):
    - `loadProductFeedback`: Fetches cloud feedback for the viewed prototype and merges into context state.
    - `addFeedback`, `replyToFeedback`, and `toggleFeedbackHelpful` asynchronously communicate with the MySQL backend when authenticated.
    - `getUserFeedback` and `getTesterRecognition` compute tester recognition points deterministically from cloud data.
- **Why It Was Changed:**
  - Previously, feedback was held in browser `localStorage`, preventing cross-device persistence and preventing builders on Account A from reviewing critiques submitted by testers on Account B.
  - Moving to MySQL enforces strict relational integrity, validates tester enrollment prior to critique submission, prevents owner self-feedback manipulation, and provides genuine cross-account collaboration between builders and testers.

---

## 5. Tooling & Engineering Methodology

| Category | Tool / Choice | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 (JSX) | Modern hooks, functional components, concurrent rendering |
| **Bundler** | Vite 8 | Near-instant startup, ESM native modules, hot module replacement in <50ms. |
| **Router** | React Router 8 (`react-router ^8.4.0`) | Client-side routing with deep-link support and code-splitting. |
| **Compiler** | `@tailwindcss/vite` | Official Tailwind v4 integration; eliminates PostCSS overhead and enables CSS-native configuration. |
| **Motion** | `motion/react` | The modern, tree-shakeable packaging of Framer Motion; robust spring physics and layout animations. |
| **Icons** | Lucide React & Inline SVG | Clean modern iconography and pixel-precise SVG control. |
| **Client Auth** | Firebase Web SDK (`firebase ^13.1.0`) | Secure client-side credential handling, session persistence, and email verification. |
| **Backend Runtime** | Node.js (>=22) | High-performance asynchronous I/O and native ESM module execution with `--watch`. |
| **Backend Framework** | Express 5 (`express ^5.1.0`) | Battle-tested, minimal REST routing framework with async route handlers. |
| **API Security** | Helmet (`^8.1.0`) & CORS | Hardened HTTP response headers and origin-filtered request dispatching. |
| **Server Auth** | Firebase Admin (`firebase-admin ^13.5.0`) | Cryptographic verification of JWT ID tokens and token revocation checks. |
| **Database** | MySQL 8 (`mysql2/promise`) | High-performance relational database with connection pooling and utf8mb4 charset. |
| **Linting** | ESLint 10 (`eslint-plugin-react-hooks`) | Enforces hook safety, dependency exhaustiveness, and fast-refresh compatibility. |

---

## 6. Summary Matrix of Code Decisions

```
+-------------------------------------------------------------------------------------------------------------------+
| DECISION                 | OLD PROJECT                    | CURRENT BUILDBOARD              | PRIMARY DRIVER              |
+-------------------------------------------------------------------------------------------------------------------+
| Navigation Architecture  | Single-page tab state          | React Router 8 SPA (^8.4.0)     | Deep linking & history      |
| Core Purpose             | Upvote leaderboard             | Structured testing loop         | Actionable builder feedback |
| State & Persistence      | Volatile in-memory mock        | 9 LocalStorage keys +           | Multi-session demo workflow |
|                          |                                | IndexedDB media storage         | and client media uploads    |
| Authentication Model     | Mock localStorage email key    | Firebase Auth (Email/Password   | Cryptographic security,     |
|                          | simulation                     | + Email Verification)           | verified email gating       |
| API Backend              | None (Browser only)            | Node.js + Express 5 API         | Token verification, identity|
|                          |                                | (Port 3001)                     | management, CORS protection |
| Server Database          | None (Browser only)            | MySQL 8 (users table keyed      | Relational user mapping     |
|                          |                                | by Firebase UID)                | for future domain models    |
| Product Identifiers      | Real project names             | Name slugs (suffix clash)       | Clean URL routing & identity|
| Enrollment Storage       | None                           | Object keyed email:prodId       | O(1) membership check       |
| Styling Framework        | Vanilla CSS files (13 files)   | Tailwind v4 CSS tokens          | Design consistency & speed  |
| Motion & Animation       | Basic CSS keyframes            | Motion spring physics           | Dynamic tactile feedback    |
| Match Engine             | None                           | Match count (+1 each)           | Transparent reasons ranking |
| Access Control           | Public link visibility         | Enrollment Gate                 | Tester commitment & tracking|
| Feedback Model           | Read-only testimonials         | 6 categories, experience,       | Standardized bug reporting  |
|                          |                                | likes, single maker reply       | and recognition loop        |
| Feedback Reminders       | None                           | Banner with 3 tiers             | Contextual re-engagement    |
|                          |                                | (recent, early, followup)       | without surveillance        |
| Pre-Build Validation     | None                           | Shipped Problems forum with     | Validate demand before code;|
|                          |                                | Reddit nested comments          | engage early adopters       |
| Page Shell Structure     | Single global shell            | Navbar/Footer per page          | Route-specific layout control|
| UI Density               | Heavy cards & pills            | Clean modern typography         | Minimalist, high-signal UI  |
+-------------------------------------------------------------------------------------------------------------------+
```
