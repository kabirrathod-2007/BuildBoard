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
const port = Number(process.env.PORT || 3001)

// Security Guard: Prevent test auth enablement outside explicit test processes
if (process.env.ENABLE_TEST_AUTH === 'true' && process.env.NODE_ENV !== 'test') {
  throw new Error(
    '[FATAL SECURITY CONFIGURATION] ENABLE_TEST_AUTH is set to true, but NODE_ENV is not "test". Server startup aborted to prevent unauthorized authentication bypass.'
  )
}

const allowedOrigins = new Set(
  (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean),
)

function isOriginAllowed(origin) {
  if (!origin) return true
  const cleanOrigin = origin.trim().replace(/\/$/, '')
  if (allowedOrigins.has('*')) return true
  if (allowedOrigins.has(cleanOrigin)) return true
  try {
    const url = new URL(origin)
    if (url.hostname.endsWith('.vercel.app')) return true
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return true
  } catch {
    return false
  }
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
  if (error.message === 'Origin is not allowed by CORS.') {
    return res.status(403).json({ error: 'Origin is not allowed by CORS.' })
  }
  const reqId = req?.id || 'unknown'
  console.error(`[${reqId}] API request failed:`, error.message)
  return res.status(500).json({ error: 'The server could not complete the request.', requestId: reqId })
})

export { app }

const isDirectExecution = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isDirectExecution || (process.env.NODE_ENV !== 'test' && !process.env.TEST_APP)) {
  app.listen(port, () => {
    console.log(`BuildBoard API listening on port ${port}`)
  })
}
