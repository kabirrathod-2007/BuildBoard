# BuildBoard Staging Deployment & Environment Guide

**Version:** 1.0.0 (Pre-Deployment Staging)
**Classification:** Internal Technical Reference
**Readiness Status:** **Staging & Production Ready** *(Shared Cloud Object Storage Integrated via Firebase Cloud Storage)*

---

## 1. Staging Architecture Overview & Security Boundaries

```
[ Frontend: Staging Vercel/Cloudflare ]
       │  (HTTPS / CORS restricted)
       ▼
[ Backend API: Staging Container / VM ]
       │  (Runs as least-privilege 'buildboard_api' user: SELECT, INSERT, UPDATE, DELETE only)
       ▼
[ Managed MySQL 8 Database: 'buildboard_staging' ]
       ▲
       │  (Runs only during deploy pipeline as 'buildboard_migrator' user: DDL permissions)
[ Migration Runner CLI: 'npm run migrate' ]
```

### Security Isolation Rules
1. **No Shared Infrastructure:** Staging must use a dedicated MySQL database (`buildboard_staging`) and a dedicated Firebase staging project (`buildboard-staging`). It must never share databases, credentials, or user tables with local development or production.
2. **Credential Separation:**
   - **Runtime API Account:** Granted only DML (`SELECT, INSERT, UPDATE, DELETE`). Cannot execute `CREATE`, `ALTER`, `DROP`, or `GRANT`.
   - **Migration Runner Account:** Granted DDL privileges on `buildboard_staging.*`. Never exposed to or used by the runtime application service.
3. **No Automated CD Deployments:** GitHub Actions is strictly restricted to verification (lint, syntax checks, unit tests, and disposable container integration tests). It holds no deployment secrets and cannot trigger live cloud mutations.

---

## 2. Media Storage Architecture (Firebase Cloud Storage + Local Fallback)

### Implementation & Cross-Device Sharing
- **Cloud-First Uploads:** Uploaded media (covers, gallery screenshots, demo videos) are uploaded directly to **Firebase Cloud Storage** via `frontend/src/utils/mediaStorage.js` under user-scoped paths (`products/{userId}/{folder}/{timestamp}_{filename}`).
- **Cross-Device Availability:** Once uploaded, the asset's public HTTPS download URL (`https://firebasestorage.googleapis.com/...`) is stored in the MySQL database (`image_url`, `gallery`, `video_url`). Testers and builders across all devices and browsers can view media seamlessly.
- **Offline / Local Dev Fallback:** When Firebase Storage is not configured (e.g., offline local development), the application automatically falls back to client **IndexedDB** (`buildboard_media_db`) without breaking the creation flow.
- **Security Rules:** Declarative storage rules (`storage.rules`) enforce public read, user-scoped write authorization, and strict file size limits (<= 10MB images, <= 50MB videos).

---

## 3. Required Staging Environment Variables

### Backend Staging Environment (`backend/.env`)

```env
# Server & Network Configuration
PORT=3001
NODE_ENV=staging
FRONTEND_ORIGIN=https://staging.buildboard.yourdomain.com

# Firebase Admin SDK (Staging Project)
FIREBASE_PROJECT_ID=buildboard-staging-project-id
GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/firebase-staging-service-account.json

# MySQL Runtime API Configuration (Least-Privilege DML Only)
DB_HOST=staging-db.internal.yourcloud.com
DB_PORT=3306
DB_USER=buildboard_api
DB_PASSWORD=your_secure_runtime_password
DB_NAME=buildboard_staging

# MySQL Migration Runner Configuration (Administrative DDL)
MIGRATION_DB_HOST=staging-db.internal.yourcloud.com
MIGRATION_DB_PORT=3306
MIGRATION_DB_USER=buildboard_migrator
MIGRATION_DB_PASSWORD=your_secure_migration_password
MIGRATION_DB_NAME=buildboard_staging
```

### Frontend Staging Environment (`frontend/.env.staging` or Platform Environment)

```env
# Staging Backend API Base URL (HTTPS, no trailing slash)
VITE_API_URL=https://api-staging.buildboard.yourdomain.com

# Staging Firebase Web Configuration
VITE_FIREBASE_API_KEY=your-staging-firebase-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=buildboard-staging.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=buildboard-staging
VITE_FIREBASE_STORAGE_BUCKET=buildboard-staging.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-staging-sender-id
VITE_FIREBASE_APP_ID=your-staging-app-id
```

---

## 4. Step-by-Step Staging Setup Instructions

### Step 4.1: Database Provisioning (TablePlus / MySQL CLI)
Connect to your staging MySQL 8 instance using an administrative (`root` / `admin`) connection:

```sql
-- 1. Create Staging Database
CREATE DATABASE IF NOT EXISTS buildboard_staging
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 2. Create Runtime API User (Strictly DML only)
CREATE USER IF NOT EXISTS 'buildboard_api'@'%' IDENTIFIED BY 'generate_strong_runtime_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON buildboard_staging.* TO 'buildboard_api'@'%';

-- 3. Create Migration Runner User (DDL privileges)
CREATE USER IF NOT EXISTS 'buildboard_migrator'@'%' IDENTIFIED BY 'generate_strong_migration_password';
GRANT ALL PRIVILEGES ON buildboard_staging.* TO 'buildboard_migrator'@'%';

FLUSH PRIVILEGES;
```

### Step 4.2: Firebase Console Configuration
1. Open the [Firebase Console](https://console.firebase.google.com/) and create a new project: `buildboard-staging`.
2. Navigate to **Authentication > Sign-in method**:
   - Enable **Email/Password**.
   - Enable **Google** sign-in.
3. Navigate to **Authentication > Settings > Authorized domains**:
   - Add your staging frontend domain (e.g., `staging.buildboard.yourdomain.com`).
4. Navigate to **Project Settings > Service accounts**:
   - Click **Generate new private key** and download the service account JSON file.
   - Securely store this on your staging backend hosting platform as a secret file or environment variable.
5. In **Google Cloud Console > APIs & Services > Credentials**:
   - Locate the staging Browser API Key and add an HTTP referrer restriction for `https://staging.buildboard.yourdomain.com/*`.
6. In **Firebase Console > Build > Storage**:
   - Click **Get started**, select standard storage and choose your default bucket region.
   - In the **Rules** tab, paste the rules defined in [`storage.rules`](file:///Users/yash/Developer/Personal/BuildBoard/storage.rules) and click **Publish**.

### Step 4.3: Running Initial Staging Migrations
From your deployment pipeline or staging terminal (using migration credentials):

```bash
# 1. Inspect status (will report fresh database detected)
MIGRATION_DB_HOST="<staging-host>" \
MIGRATION_DB_PORT="3306" \
MIGRATION_DB_USER="buildboard_migrator" \
MIGRATION_DB_PASSWORD="<migration-password>" \
MIGRATION_DB_NAME="buildboard_staging" \
npm run --prefix backend migrate -- --status

# 2. Execute all 9 migrations sequentially
MIGRATION_DB_HOST="<staging-host>" \
MIGRATION_DB_PORT="3306" \
MIGRATION_DB_USER="buildboard_migrator" \
MIGRATION_DB_PASSWORD="<migration-password>" \
MIGRATION_DB_NAME="buildboard_staging" \
npm run --prefix backend migrate

# 3. Confirm all 9 migrations are marked [APPLIED]
npm run --prefix backend migrate -- --status
```

## 5. DDL Non-Atomicity & Partial Migration Recovery in MySQL

### Understanding MySQL DDL Behavior (Implicit Commits)
> [!WARNING]
> **MySQL does not support transactional DDL:** In MySQL 8, statements such as `CREATE TABLE`, `ALTER TABLE`, and `DROP TABLE` trigger an **implicit commit** before and after execution.
>
> Wrapping DDL statements in `START TRANSACTION` / `ROLLBACK` **does not make DDL atomic**. If a migration file contains multiple SQL statements and statement #2 fails:
> 1. Statement #1 remains permanently committed in MySQL.
> 2. `schema_migrations` has **not** recorded the migration name (because the file did not complete).
> 3. The database enters a **partially applied** state.

---

### Step 5.1: Inspecting Schema & Migration Tracking State
When a migration error occurs, do not guess what was applied. Inspect both the tracking table and metadata schema:

```bash
# 1. Run migration status inspection
MIGRATION_DB_HOST="<staging-host>" \
MIGRATION_DB_PORT="3306" \
MIGRATION_DB_USER="buildboard_migrator" \
MIGRATION_DB_PASSWORD="<migration-password>" \
MIGRATION_DB_NAME="buildboard_staging" \
npm run --prefix backend migrate -- --status
```

**Interpreting the Status Output:**
- `[APPLIED]` — Migration recorded in `schema_migrations`.
- `[PENDING]` — Not recorded in `schema_migrations`, and its mapped tables/columns do not exist.
- `[UNTRACKED IN MIGRATION TABLE]` — The table or column exists in the database, but the migration file is **missing from `schema_migrations`**. This directly signals a partially applied migration or an unrecorded manual change.

**Direct SQL Inspection Queries (TablePlus / MySQL CLI):**
```sql
-- 1. List all officially recorded migrations
SELECT id, name, applied_at FROM schema_migrations ORDER BY id ASC;

-- 2. Inspect tables that physically exist in the database
SELECT TABLE_NAME, TABLE_ROWS, CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'buildboard_staging';

-- 3. Inspect columns for migrations that modify existing tables (008, 009)
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'buildboard_staging' AND TABLE_NAME = 'products';
```

---

### Step 5.2: Safe Recovery & Repair Procedures

> [!IMPORTANT]
> **No Automatic Skipping of Duplicate Objects:** The BuildBoard migration runner does **not** automatically skip `ER_TABLE_EXISTS_ERROR`, `ER_DUP_FIELDNAME`, or `ER_DUP_KEYNAME`.
> If an existing table, column, or index exists, the runner halts with a `SCHEMA CONFLICT` error. It will never assume that an existing object matches the migration definition just because the name matches, ensuring mismatched schemas are never silently marked as applied.

Depending on the nature of the failure, choose the appropriate recovery procedure:

#### Procedure 1: Clean Repair (Recommended for Staging / Empty Objects)
If a multi-statement migration partially executed and failed before completion:
1. Inspect the migration error output to identify the exact failed statement (e.g. `statement 2 of 5`).
2. Manually drop **only** the partial objects created by that specific failed migration file:
   ```sql
   -- Example: if 006_problems.sql failed on statement 2 after creating 'problems':
   DROP TABLE IF EXISTS problem_solutions;
   DROP TABLE IF EXISTS problem_comments;
   DROP TABLE IF EXISTS problems;
   ```
3. Fix the underlying root cause in the migration SQL file or database environment.
4. Re-run `npm run migrate`. The migration will run cleanly from statement 1, execute all statements, and record the file in `schema_migrations`.

#### Procedure 2: Manual Verification & Tracking Baseline (Objects Already Complete)
If all expected tables, columns, constraints, and indexes defined in the migration file were already created in the database and verified to match the migration SQL:
1. Verify the physical schema in TablePlus or MySQL CLI against the migration SQL.
2. Manually record the migration name in `schema_migrations`:
   ```sql
   INSERT INTO schema_migrations (name) VALUES ('00X_filename.sql');
   ```
3. Confirm clean synchronization by running:
   ```bash
   npm run --prefix backend migrate -- --status
   ```
4. Re-run `npm run migrate` to apply any remaining pending migrations.

#### Procedure 3: Resolving Schema Conflicts (Unintended Pre-Existing Objects)
If the runner halts with `SCHEMA CONFLICT (ER_TABLE_EXISTS_ERROR / ER_DUP_FIELDNAME / ER_DUP_KEYNAME)`:
1. Query `information_schema.COLUMNS` or `information_schema.TABLES` to compare the existing schema definition against the migration's SQL statement.
2. If the existing object was an untracked experiment, rename or drop it.
3. If the object matches the migration requirements, follow Procedure 2 to baseline it.
4. Never bypass this check without verifying column definitions, nullability, data types, and foreign key constraints.

---

### Step 5.3: When Manual Intervention is Required
Manual DBA intervention is required when:
- **Foreign Key Constraint Violations (`ER_CANNOT_ADD_FOREIGN`):** A foreign key target column does not match the parent's data type, unsigned modifier, or collation.
- **Existing Production Data Conflicts:** An `ALTER TABLE ADD COLUMN NOT NULL` statement fails because existing rows lack default values.
- **Schema Drift:** A table definition was manually modified in TablePlus, causing migration statements to fail on type conflicts.

> [!CAUTION]
> Always take a full backup before performing manual database repairs or dropping tables.

---

## 6. Staging Backup, Restore, and Disaster Recovery Procedures

### Pre-Deployment Staging Backup
Always execute a snapshot before applying migrations or deploying new backend versions:
```bash
mysqldump -h <staging-host> -P 3306 -u buildboard_migrator -p \
  --single-transaction \
  --routines \
  --triggers \
  buildboard_staging > "buildboard_staging_backup_$(date +%Y%m%d_%H%M%S).sql"
```

### Emergency Restore
If a migration failure cannot be repaired manually:
```bash
mysql -h <staging-host> -P 3306 -u buildboard_migrator -p buildboard_staging < "buildboard_staging_backup_<timestamp>.sql"
```

---

## 7. Staging Smoke-Test Checklist

- [ ] **Liveness Probe:** `GET /api/health/live` returns HTTP 200 with `{"status":"live"}` and `X-Request-Id`.
- [ ] **Readiness Probe:** `GET /api/health/ready` returns HTTP 200 with `{"status":"ready","database":"connected"}`.
- [ ] **CORS Verification:** Requests with `Origin: https://unauthorized-domain.com` return HTTP 403 Forbidden.
- [ ] **Authentication Verification:**
  - Demo authentication buttons are disabled and rejected.
  - Sign up with an email address, verify that email verification link arrives, and confirm account.
  - Test Google Sign-in on authorized staging domain.
- [ ] **Prototype Gating Verification:**
  - As unauthenticated visitor, navigate to a product. Verify `product_url` is absent (`null`).
  - Enroll as a tester. Verify prototype link unmasks immediately upon confirmed enrollment.
- [ ] **Atomic Quota Verification:**
  - Create product with `enrollment_limit = 1`.
  - Enroll Tester A. Attempt enrollment with Tester B; verify HTTP 409 `ENROLLMENT_FULL`.
- [ ] **Problem Hub Verification:**
  - Submit a validation problem.
  - Post a discussion comment and verify server derives author without spoofing.
  - Link a product solution and verify external prototype links remain gated to enrolled testers.
