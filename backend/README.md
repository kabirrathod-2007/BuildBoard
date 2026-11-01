# BuildBoard API — Authentication foundation

This service verifies Firebase Authentication ID tokens and keeps a MySQL user record keyed by Firebase UID. The browser never connects directly to MySQL, and the API does not trust email values supplied by the client.

## Current endpoints

- `GET /api/health` checks that the API can reach MySQL.
- `POST /api/auth/me` requires `Authorization: Bearer <Firebase ID token>`, verifies the token and revocation status with Firebase Admin, requires a verified email, and creates or updates the user's MySQL row.
- `GET /api/profiles/me` requires `Authorization: Bearer <Firebase ID token>`, verifies authentication, maps to the user record, and retrieves `profile` JSON and `updatedAt`.
- `PUT /api/profiles/me` requires `Authorization: Bearer <Firebase ID token>`, validates profile fields (string/array length constraints against allowed keys), and upserts `user_profiles` in MySQL.
- `GET /api/products` (Public) lists products with aggregated categories and test steps. **Masks `product_url` to `null`** for catalog privacy. Supports `?category=` filter and `?creator=me` (requires Bearer token).
- `GET /api/products/:slugOrId` (Public with `optionalAuth`) retrieves single product details. Unlocks `product_url` only when requester is the verified creator.
- `POST /api/products` (Authenticated) creates a new product listing, generates slug, and inserts target criteria and test steps in a MySQL transaction.
- `PUT /api/products/:slugOrId` (Authenticated) updates listing fields, replacing criteria and test steps inside a transaction (creator-only).
- `PATCH /api/products/:slugOrId/pause` (Authenticated) toggles or updates `enrollment_paused` (creator-only).
- `DELETE /api/products/:slugOrId` (Authenticated) deletes product listing with cascading deletion of criteria and test steps (creator-only).

The frontend sign-up, sign-in, and email verification pages are wired to Firebase Authentication and connect to `POST /api/auth/me` upon successful authentication. User profile setup is wired to `/api/profiles/me`. Existing product, enrollment, feedback, and problem data continue to use the local demo context; full data migration for domain models is slated for future milestones.

## Local setup

1. Install Node.js 22 or newer and MySQL 8.0.16 or newer.
2. Create a Firebase project, add a Web app, and enable Email/Password sign-in in Authentication. Add `localhost` and `127.0.0.1` to Firebase Authentication's authorized domains for local development.
3. In Firebase project settings, create/download a service-account JSON for local server use. Store it outside this repository.
4. Copy `frontend/.env.example` to `frontend/.env.local` and set the Firebase Web app values. The values in a Firebase Web config are public client configuration; never put a service-account key there.
5. Copy `backend/.env.example` to `backend/.env` and set the Firebase project ID, service-account path, and MySQL connection values.
6. Run `mysql -u root -p < backend/schema.sql` from the repository root.
7. Run `npm --prefix backend install`, then `npm run dev:api` from the repository root. Start the frontend separately with `npm run dev`.

The service account is privileged. Never put its JSON file or private key in the frontend, commit it, or send it in chat. The frontend Firebase Web API key is a public client identifier; it is not a substitute for API-side token verification.

## API authorization model

The frontend will obtain a Firebase ID token after a user signs in. Protected API requests send it in the `Authorization` header over HTTPS. `requireAuth` verifies the signature, expiry, revocation state, and verified-email claim before attaching the stable Firebase UID to `req.authUser`. New API features must use that UID for ownership and authorization checks; email is a contact attribute, not an ownership key.

`POST /api/auth/me` currently upserts the corresponding user into MySQL. It does not grant builder/tester roles or migrate local demo records.
