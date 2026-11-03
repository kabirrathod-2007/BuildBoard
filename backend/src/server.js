import 'dotenv/config'
import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { database } from './config/database.js'
import './config/firebase.js'
import authRoutes from './routes/auth.js'
import profileRoutes from './routes/profiles.js'
import productRoutes from './routes/products.js'
import enrollmentRoutes from './routes/enrollments.js'
import feedbackRoutes from './routes/feedback.js'
import problemsRoutes from './routes/problems.js'
import notificationRoutes from './routes/notifications.js'

const app = express()
app.set('trust proxy', 1)
const port = Number(process.env.PORT || 3001)

// Security Guard: Prevent test auth enablement outside explicit test processes
if (process.env.ENABLE_TEST_AUTH === 'true' && process.env.NODE_ENV !== 'test') {
  throw new Error(
    '[FATAL SECURITY CONFIGURATION] ENABLE_TEST_AUTH is set to true, but NODE_ENV is not "test". Server startup aborted to prevent unauthorized authentication bypass.'
  )
}

const defaultFrontendOrigin =
  process.env.NODE_ENV === 'production'
    ? 'https://buildboard-one.vercel.app'
    : 'http://localhost:5173'

const allowedOrigins = new Set(
  (process.env.FRONTEND_ORIGIN || defaultFrontendOrigin)
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter((origin) => Boolean(origin) && origin !== '*'), // Strip wildcard '*' unconditionally
)

const allowedPreviewOrigins = new Set(
  (process.env.ALLOWED_PREVIEW_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter((origin) => Boolean(origin) && origin !== '*'),
)

export function isOriginAllowed(origin, nodeEnv = process.env.NODE_ENV, customPreviewOrigins = null) {
  // Allow requests without Origin header (same-origin, curl, mobile apps, server-to-server)
  if (!origin) return true
  const cleanOrigin = origin.trim().replace(/\/$/, '')

  // Reject wildcard string explicitly
  if (cleanOrigin === '*') return false

  let url
  try {
    url = new URL(cleanOrigin)
  } catch {
    return false
  }

  // Only allow standard web protocols
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false

  if (nodeEnv === 'production') {
    // In production, HTTPS is strictly mandatory
    if (url.protocol !== 'https:') return false

    // In production, reject non-standard ports (e.g. :8443, :8080)
    if (url.port !== '' && url.port !== '443') return false

    // In production, reject localhost/127.0.0.1
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return false
  } else {
    // In non-production, allow localhost/127.0.0.1
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      return true
    }
  }

  // Canonical production frontend
  if (cleanOrigin === 'https://buildboard-one.vercel.app') return true

  // Configured frontend origins from FRONTEND_ORIGIN
  if (allowedOrigins.has(cleanOrigin)) return true

  // Explicit configurable preview origins (via env ALLOWED_PREVIEW_ORIGINS or passed parameter)
  const previewSet = customPreviewOrigins || allowedPreviewOrigins
  if (previewSet.has(cleanOrigin)) return true

  return false
}

app.disable('x-powered-by')

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // API does not render HTML
}))

// Request Correlation ID Middleware
app.use((req, res, next) => {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID()
  req.id = reqId
  res.setHeader('X-Request-Id', reqId)
  next()
})

// CORS Whitelist Configuration
app.use(cors({
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      return callback(null, true)
    }
    return callback(new Error(`Origin ${origin} is not allowed by CORS.`))
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
  credentials: true,
}))

// Request Body Limits
app.use(express.json({ limit: '32kb' }))

// Rate Limiters
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP. Please try again later.' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please wait 15 minutes and try again.' },
})

const mutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many mutation actions performed. Please slow down and try again shortly.' },
})

const viewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'View tracking rate limit reached.' },
})

// Global limiter for all /api routes
app.use('/api', standardLimiter)

// Root Status Endpoint
app.get('/', (_req, res) => {
  return res.json({ status: 'ok', service: 'BuildBoard API', message: 'BuildBoard API is running' })
})

// Health Endpoints
app.get('/api/health/live', (_req, res) => {
  return res.json({ status: 'live' })
})

app.get('/api/health/ready', async (_req, res) => {
  try {
    await database.query('SELECT 1')
    return res.json({ status: 'ready', database: 'connected' })
  } catch {
    return res.status(503).json({ status: 'unavailable', error: 'Database service unavailable' })
  }
})

app.get('/api/health', async (_req, res) => {
  try {
    await database.query('SELECT 1')
    return res.json({ status: 'ok', database: 'connected' })
  } catch {
    return res.status(503).json({ status: 'degraded', error: 'Database service unavailable' })
  }
})

// Rate-limited sensitive routes
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/profiles/check-username', authLimiter)
app.use('/api/products/:slugOrId/view', viewLimiter)
app.use('/api/products/:slugOrId/enroll', mutationLimiter)
app.use('/api/products/:slugOrId/feedback', mutationLimiter)
app.use('/api/feedback/:id/reply', mutationLimiter)
app.use('/api/feedback/:id/helpful', mutationLimiter)
app.use('/api/problems/:slugOrId/validate', mutationLimiter)
app.use('/api/problems/:slugOrId/tester-signup', mutationLimiter)
app.use('/api/problems/:slugOrId/comments', mutationLimiter)
app.use('/api/problems/:slugOrId/solutions', mutationLimiter)

app.use('/api/profiles', profileRoutes)
app.use('/api/products', productRoutes)
app.use('/api/enrollments', enrollmentRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/problems', problemsRoutes)
app.use('/api/notifications', notificationRoutes)

// Safe Structured Error Handler
app.use((error, req, res, _next) => {
  // CORS Rejection (HTTP 403 Forbidden)
  if (error.message && error.message.includes('not allowed by CORS')) {
    return res.status(403).json({ error: 'Origin is not allowed by CORS.' })
  }

  // Request Body Exceeds Limit (HTTP 413 Payload Too Large)
  if (error.status === 413 || error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request payload exceeds 32KB limit.' })
  }

  // Malformed JSON Payload (HTTP 400 Bad Request)
  if (
    (error.status === 400 || error.statusCode === 400) &&
    (error.type === 'entity.parse.failed' || error instanceof SyntaxError)
  ) {
    return res.status(400).json({ error: 'Invalid JSON payload format.' })
  }

  // Fallback 500: Server errors masked and logged with request ID
  const reqId = req?.id || 'unknown'
  console.error(`[${reqId}] API request failed:`, error.message)
  return res.status(500).json({ error: 'The server could not complete the request.', requestId: reqId })
})

export { app }

export const EXACT_SEED_USER_PAIRS = [
  ['seed_builder_elena_rostova', 'elena.rostova@buildboard.dev'],
  ['seed_builder_marcus_chen', 'marcus.chen@buildboard.dev'],
  ['seed_builder_sarah_jenkins', 'sarah.jenkins@buildboard.dev'],
  ['seed_builder_kavita_rao', 'kavita.rao@buildboard.dev'],
  ['seed_builder_devon_park', 'devon.park@buildboard.dev'],
]

export const EXACT_SEED_USER_UIDS = EXACT_SEED_USER_PAIRS.map(([uid]) => uid)
export const EXACT_SEED_USER_EMAILS = EXACT_SEED_USER_PAIRS.map(([, email]) => email)

export const EXACT_SEED_PRODUCT_SLUGS = [
  'weeknote',
  'token-sync',
  'prompt-bench',
  'query-lens',
  'focus-orbit',
]

export const EXACT_SEED_PROBLEM_SLUGS = [
  'student-internship-portfolio-feedback',
  'unstructured-user-interview-synthesis',
  'figma-to-tailwind-variables',
  'cross-browser-extension-manifest-v3',
]

export async function purgeLegacySampleData() {
  let connection = null
  try {
    connection = await database.getConnection()
    await connection.beginTransaction()

    // 1. Delete verified sample products owned by verified seed builders (strictly paired UID + email)
    const [productResult] = await connection.query(
      `DELETE FROM products 
       WHERE is_sample = 1 
         AND slug IN (?)
         AND creator_id IN (
           SELECT id FROM users 
           WHERE LEFT(firebase_uid, 13) = 'seed_builder_'
             AND email LIKE '%@buildboard.dev'
             AND (firebase_uid, email) IN (?)
         )`,
      [EXACT_SEED_PRODUCT_SLUGS, EXACT_SEED_USER_PAIRS],
    )

    // 2. Delete verified sample community problems created by seed builders (strictly paired UID + email)
    const [problemResult] = await connection.query(
      `DELETE FROM problems 
       WHERE slug IN (?)
         AND creator_id IN (
           SELECT id FROM users 
           WHERE LEFT(firebase_uid, 13) = 'seed_builder_'
             AND email LIKE '%@buildboard.dev'
             AND (firebase_uid, email) IN (?)
         )`,
      [EXACT_SEED_PROBLEM_SLUGS, EXACT_SEED_USER_PAIRS],
    )

    // 3. Delete verified seed builder user accounts (strictly paired UID + email)
    const [userResult] = await connection.query(
      `DELETE FROM users 
       WHERE LEFT(firebase_uid, 13) = 'seed_builder_'
         AND email LIKE '%@buildboard.dev'
         AND (firebase_uid, email) IN (?)`,
      [EXACT_SEED_USER_PAIRS],
    )

    await connection.commit()

    const totalAffected =
      (productResult?.affectedRows || 0) +
      (problemResult?.affectedRows || 0) +
      (userResult?.affectedRows || 0)

    if (totalAffected > 0) {
      console.log(
        `[CLEANUP] Successfully purged legacy sample data (${productResult?.affectedRows || 0} products, ${problemResult?.affectedRows || 0} problems, ${userResult?.affectedRows || 0} users).`
      )
    }

    return {
      success: true,
      affected: {
        products: productResult?.affectedRows || 0,
        problems: problemResult?.affectedRows || 0,
        users: userResult?.affectedRows || 0,
      },
    }
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback()
      } catch (rollbackErr) {
        console.error('[CLEANUP TRANSACTION ROLLBACK FAILED]:', rollbackErr.message)
      }
    }
    console.error('[CLEANUP TRANSACTION FAILED]:', err.message)
    throw err
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

const isDirectExecution = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isDirectExecution) {
  app.listen(port, () => {
    console.log(`BuildBoard API listening on port ${port}`)
  })
}
