# BuildBoard — Project Summary & Evolution Overview (`summary.md`)

This document provides a complete, high-level summary of **BuildBoard**: what the project is, what features were built, all architectural and design changes made, and the strategic rationale behind every decision.

---

## Table of Contents
1. [What is BuildBoard?](#1-what-is-buildboard)
2. [The Core Problem & Solution](#2-the-core-problem--solution)
3. [Full Feature Inventory (What We Implemented)](#3-full-feature-inventory-what-we-implemented)
4. [Evolution Analysis: What Changed from the Old Project & Why](#4-evolution-analysis-what-changed-from-the-old-project--why)
5. [Technical Architecture & Tooling](#5-technical-architecture--tooling)
6. [Design System, Aesthetics & Accessibility](#6-design-system-aesthetics--accessibility)
7. [Current State & Next Milestones](#7-current-state--next-milestones)

---

## 1. What is BuildBoard?

**BuildBoard** is a collaborative web platform where early-stage software builders connect with relevant beta testers to test working prototypes, gather structured critiques, and iterate on their products before public launch.

It transforms the chaotic, superficial process of getting early feedback into a dependable, structured, and mutually beneficial exchange.

---

## 2. The Core Problem & Solution

### The Problem
- **The Upvote Trap**: Broad launch platforms (e.g. Product Hunt, Reddit, Hacker News) prioritize visibility, marketing polish, and popularity contests. 
- **Low Signal Feedback**: Builders with early prototypes get superficial comments (*"Cool project! Upvoted!"*) rather than actionable reports on bugs, confusing UX, or missing capabilities.
- **Audience Mismatch**: Builders struggle to find testers who actually possess the relevant technical or domain context (e.g., a Kubernetes devtool tested by someone who has never touched Docker).
- **Lack of Tester Incentive**: Testers who spend 30 minutes testing an unpolished app rarely receive recognition or follow-ups from the maker.

### The BuildBoard Solution
1. **Targeted Audience Specification**: Builders define exactly who their prototype is for (roles, industries, technologies, experience).
2. **Explainable Matching**: Testers discover software aligned with their skills via transparent, score-backed recommendations (`getRecommendedProducts`), where each matching criterion adds +1 to the match score.
3. **Enrollment Gate**: Prototype URLs and testing guidelines are protected until testers actively commit to testing.
4. **Structured Critiques**: Testers submit structured feedback categorized by type (*What worked well*, *Bug or issue*, *Usability*, *UI*, *Feature idea*, *Other*), detailing their experience and specific highlights.
5. **Maker Reply & Recognition Loop**: Builders post an editable reply directly to critiques and toggle a "Helpful" mark, granting the tester public **Recognition Points**.

---

## 3. Full Feature Inventory (What We Implemented)

### 1. Interactive Landing Page (`LandingPage.jsx`)
- **Kinetic Typography**: Word-by-word animated hero headline (*"Working prototypes. Real feedback."*) with terracotta gradients.
- **3D Interactive Hero Preview**: Floating browser mockup card with real-time mouse-tracking 3D tilt physics and specular highlights.
- **Interactive 4-Card Bento Grid (`InteractiveBentoShowcase.jsx`)**:
  - Live browser preview switching between multiple app prototypes.
  - Interactive criteria tag matcher with real-time profile compatibility calculation.
  - Interactive critique composer with category and severity selectors.
  - Recognition points dynamic counter with badge unlocks.
- **Product Spotlight Carousel**: Clean, responsive spotlight component embedded directly inside `LandingPage.jsx`. (Note: `ShowcaseCarousel.jsx` is maintained in `src/components/` as a continuous fast-paced marquee component).
- **How It Works Timeline**: 3-step connected visual path demonstrating the builder-to-tester lifecycle.

### 2. Catalog & Discovery (`ExplorePage.jsx`)
- **Search & Multi-Axis Filtering**: Instant client-side filtering across keywords, categories, roles, and tech stacks.
- **Explainable Recommendations Engine (`recommendations.js`)**: `getRecommendedProducts` matches tester profile tags against product criteria (+1 point per matched category, role, industry, technology, or explicit experience), presenting transparent reasons sorted by match count.

### 3. Product Details & Enrollment Gate (`ProductDetailsPage.jsx`)
- **Gated Access**: Masks the external prototype link (`productUrl`) and test checklist until the user clicks "Enroll".
- **"What to Try" Task Checklist**: Clear, step-by-step instructions guiding testers through high-priority user journeys.
- **View Counter**: Increments product views on mount via `recordProductView` and surfaces view counts to builders.
- **Feedback Feed**: Chronological list of community critiques with builder responses.

### 4. Structured Feedback System
- **Categorized Inputs**: Submissions classified as *What worked well*, *Bug or issue*, *Usability*, *UI*, *Feature idea*, or *Other*.
- **High-Signal Context**: Prompts testers for *What were you trying to do & what happened?* (`experience`) and *What worked well or what did you like?* (`likes`).
- **Builder Reply**: Product owners can write and edit a dedicated reply on each critique (3–1,000 characters) via `replyToFeedback`.

### 5. Recognition & Reputation System
- **Derived Recognition Points**: Testers receive 1 point whenever a builder marks their feedback as "Helpful" (`toggleFeedbackHelpful`).
- **Dynamic Calculation**: Points are derived from actual feedback records, eliminating database sync drift or counter tampering.

### 6. Builder Analytics Dashboard (`BuilderDashboardPage.jsx`)
- **Multi-Product Analytics**: Aggregates total page views, active enrollments, and feedback submissions.
- **Conversion Funnel Tracking**: Calculates enrollment-to-feedback conversion rates for each listing.
- **Listing Controls**: Instant controls to pause/resume enrollments without resetting listing modification dates.

### 7. Tester Activity Hub (`TesterActivityPage.jsx`)
- **Enrollment Management**: Direct access to all prototypes the tester is currently enrolled in (stored as `"email:productId"` mappings with enrollment timestamps).
- **Time-Tiered Feedback Reminders (`feedbackReminder.js`)**: `getFeedbackReminderInfo` generates contextual reminder banners on the product details page across three elapsed-time tiers: `recent` (<24h), `early` (24–72h), and `followup` (72h+).
- **Dismissal Persistence**: Single-click dismissal stored in localStorage (`buildboard_demo_reminder_dismissals`).
- **Feedback History**: Complete log of past submissions and builder endorsements.

### 8. Community Problems Hub (`ProblemsPage.jsx`, `ProblemDetailsPage.jsx`)
- **Pain Point Validation**: Founders and users post unsolved user problems to validate demand before writing code.
- **Validation Upvotes**: Community members validate problems with a single click (`toggleProblemValidation`).
- **Solution Attachment Hub**: Builders can link their prototypes directly to the problems they solve (`attachProblemSolution`).
- **Reddit-Style Nested Comments**: Multi-level hierarchical comment threads with interactive expand/collapse arrow buttons, clickable thread guidelines, and contextual reply forms.

### 9. User Profile & Targeting (`ProfileSetupPage.jsx`)
- Customization for roles (e.g. *Full Stack Developer*, *Product Designer*), industries (*DevTools*, *SaaS*, *Fintech*), and technical proficiencies (*React*, *Node.js*, *Python*).
- Feeds directly into the deterministic recommendation engine.

---

## 4. Evolution Analysis: What Changed from the Old Project & Why

The previous iteration (`BuildBoard-Landing-Full`) was a single-page marketing concept with no real functionality. The table below details what changed and the rationale behind each transformation:

```
+------------------------------------------------------------------------------------------------------------------+
| AREA                 | BEFORE (BuildBoard-Landing-Full)    | AFTER (Current BuildBoard)        | WHY WE DID IT                    |
+------------------------------------------------------------------------------------------------------------------+
| Architecture         | Monolithic single-file tab switcher | Multi-route React Router 8 SPA    | Enable deep linking, browser     |
|                      | (App.jsx was 358 lines)             | (^8.4.0) with lazy-loaded chunks  | history, and page lifecycles     |
|                      |                                     |                                   |                                  |
| Core Purpose         | Upvote leaderboard & rankings       | Structured peer testing loop with | Upvotes create vanity contests;  |
|                      |                                     | enrollment gate and critiques     | builders need actionable bugs    |
|                      |                                     |                                   |                                  |
| Data Persistence     | Volatile in-memory mock objects;    | 9 LocalStorage namespaces +       | Enable multi-session testing and |
|                      | all state reset on refresh          | IndexedDB client media storage    | media uploads without a backend  |
|                      |                                     |                                   |                                  |
| Data Domain          | Reused existing real apps           | Original prototypes using slug    | Avoid confusion with real tools; |
|                      | (JSON Crack, Excalidraw, etc.)      | IDs (suffix on collision)         | model authentic prototype needs  |
|                      |                                     |                                   |                                  |
| Prototype Access     | Links immediately public to anyone  | Enrollment Gate pattern (keyed by | Incentivize tester commitment    |
|                      |                                     | "email:productId" in storage)     | and track conversion metrics     |
|                      |                                     |                                   |                                  |
| Recommendations      | None; static list                   | Deterministic scoring engine with | Build user trust with explainable|
|                      |                                     | reasons count (+1 per match)      | matching; zero API overhead      |
|                      |                                     |                                   |                                  |
| User Feedback        | None; only read-only testimonials   | 6 structured feedback categories  | Standardize bug and UX critique  |
|                      |                                     | with single editable maker reply  | collection for makers            |
|                      |                                     |                                   |                                  |
| Gamification         | Upvote counters                     | Derived Recognition points        | Reward high-signal critique      |
|                      |                                     | based on "Helpful" marks          | rather than voting popularity    |
|                      |                                     |                                   |                                  |
| Tester Engagement    | None                                | Time-tiered feedback reminder     | Prevent enrollment abandonment    |
|                      |                                     | banner (recent, early, followup)  | and improve completion rates     |
|                      |                                     |                                   |                                  |
| Pre-Build Validation | None                                | Shipped Community Problems hub    | Validate user pain points        |
|                      |                                     | with solution linking & nesting   | before building software         |
|                      |                                     |                                   |                                  |
| Component Layout     | Global monolithic shell             | Navbar & Footer rendered inside   | Allows customized page padding,   |
|                      |                                     | each individual page component    | sticky layouts, and modals        |
|                      |                                     |                                   |                                  |
| Styling & Theme      | 13 separate vanilla CSS files       | Tailwind CSS v4 engine with       | High-speed compilation, unified  |
|                      | with inconsistent variables         | CSS-native @theme tokens          | light/dark mode design system     |
|                      |                                     |                                   |                                  |
| Visual Polish        | Cluttered card borders, pill spam,  | Clean negative space, typography, | Reduce visual fatigue; focus on  |
|                      | and redundant kicker subheaders     | and purposeful Motion physics     | content readability and delight  |
+------------------------------------------------------------------------------------------------------------------+
```

---

## 5. Technical Architecture & Tooling

| Layer | Technology | Key Capabilities |
| :--- | :--- | :--- |
| **Framework** | React 19 (JSX) | Modern hooks, functional components, concurrent rendering |
| **Build Tool** | Vite 8 | Near-instant HMR (<50ms), optimized production bundles |
| **Routing** | React Router 8 (`react-router ^8.4.0`) | Declarative routing, `useNavigate`, `useParams`, `useLocation` |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) | CSS-first `@theme` declarations, custom color variables |
| **Motion** | `motion/react` | 3D spring tilt, layout animations, exit transitions, gestures |
| **State** | React Context API | 3 stores: `AuthContext`, `DemoDataContext`, `ThemeContext` |
| **Provider Hierarchy** | Nested Provider Chain | `BrowserRouter > ThemeProvider > AuthProvider > DemoDataProvider` |
| **Client Storage** | LocalStorage + IndexedDB | 9 persistent LocalStorage namespaces + IndexedDB media storage (`buildboard_media_db`) |
| **Client Authentication** | Firebase Web SDK (`firebase ^13.1.0`) | Client-side email/password authentication, persistent sessions, and verification emails |
| **Backend API** | Node.js (>=22) + Express 5 | REST API (`:3001`) with Helmet security headers, CORS origin protection, and health check |
| **Server Authentication** | Firebase Admin (`firebase-admin ^13.5.0`) | Cryptographic verification of Firebase ID tokens, claims validation, and revocation checks |
| **Database** | MySQL 8 (`mysql2/promise`) | Relational persistence with connection pooling; `users` table synchronized via Firebase UID |
| **Components** | 12 component files in `src/components/` | Modular component inventory (including standalone building blocks) |
| **Automated Tests** | Syntax & Lint Checks | ESLint 10 + Node `--check` syntax verification suites |

---

## 6. Design System, Aesthetics & Accessibility

- **Color Palette**:
  - Warm Terracotta Primary (`#c85a32` / `#d96b43` / `#e07a5f`): Conveys creativity, craftsmanship, and warmth without generic SaaS blues.
  - Neutral Light Backgrounds (`#fdfbf7`, `#f7f4ee`): Soft cream surfaces reduce eye strain.
  - Slate Dark Mode (`#121316`, `#1a1b20`): High-contrast, sleek surfaces with subtle border glows.
- **Typography**: Clean modern sans-serif with tight letter tracking, bold headline hierarchy, and readable body line-heights.
- **Accessibility & Motion Safety**:
  - `SkipToContent.jsx` enables keyboard-first screen reader bypass.
  - Complete `prefers-reduced-motion` compliance across all Motion spring animations and carousels.
  - Minimum 44px touch targets on mobile viewports.

---

## 7. Current State & Next Milestones

### Current State
BuildBoard is currently operating in a **hybrid architecture phase**:
- **Authentication & User Identity**: Fully migrated to production cloud infrastructure. User accounts, secure password hashing, and email verification are managed via **Firebase Authentication**. An **Express 5 API** cryptographically verifies Firebase ID tokens and maintains synchronized user records in **MySQL** keyed by the immutable `firebase_uid`.
- **User Profile Persistence (Milestone 1 — Shipped)**: `user_profiles` table implemented in MySQL (`user_id` FK to `users`, `profile_data JSON`). Dedicated authenticated endpoints (`GET /api/profiles/me` and `PUT /api/profiles/me`) validate and persist profile data. The frontend client (`DemoDataContext.jsx` and `ProfileSetupPage.jsx`) automatically fetches cloud profiles, pre-fills from local demo profiles without overwriting server data, and persists changes directly to MySQL.
- **Product Listings Persistence (Milestone 2 — Shipped)**: Normalized `products`, `product_target_criteria`, and `product_test_steps` tables implemented in MySQL. Full CRUD and pause/resume routes (`/api/products`) with `optionalAuth` and `requireAuth`. Strictly masks `product_url` in public catalog and unlocks it for verified product owners. Fully verified in MySQL and UI.
- **Enrollments & Gated Prototype Access (Milestone 3 — Implementation Complete, Verification in Progress)**: `product_enrollments` table designed with unique composite keys `(user_id, product_id)`. Enrollment endpoints (`POST/DELETE /api/products/:slugOrId/enroll`, `GET /api/enrollments/me`) enforce owner exclusion, paused enrollment gating, and unmask `productUrl` strictly for verified enrolled testers. Frontend synchronizes active tester enrollments.
- **Domain Modeling & Community Data**: Structured reviews, replies, and problem threads currently continue to execute via client-side storage (`localStorage` and `IndexedDB`) to maintain instant prototyping without database migration disruption.

### Next Roadmap Milestones
1. **Milestone 3 — Enrollments and Gated Prototype Access (Verification Phase)**:
   - Execute `004_enrollments.sql` migration in TablePlus.
   - Run Postman / UI verification on enrollment lifecycle and gated link access.
2. **Milestone 4 — Feedback and Builder Replies**:
   - Persist structured feedback, builder replies, and helpful marks in MySQL.
   - Calculate recognition points deterministically from persisted helpful marks.
3. **Milestone 4 — Feedback and Builder Replies**:
   - Persist structured feedback, builder replies, and helpful marks in MySQL.
   - Calculate recognition points deterministically from persisted helpful marks.
4. **Milestone 5 — Problem Hub**:
   - Persist problem posts, nested comments, and validation upvotes in MySQL.
5. **Milestone 6 — Frontend Full Data Migration & Cleanup**:
   - Transition all remaining demo contexts to REST API operations with full loading, error, and retry states.
