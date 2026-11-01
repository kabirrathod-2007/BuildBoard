import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { database } from './config/database.js'
import './config/firebase.js'
import authRoutes from './routes/auth.js'
import profileRoutes from './routes/profiles.js'
import productRoutes from './routes/products.js'

const app = express()
const port = Number(process.env.PORT || 3001)
const allowedOrigins = new Set(
  (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
)

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true)
    return callback(new Error('Origin is not allowed by CORS.'))
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
}))
app.use(express.json({ limit: '32kb' }))

app.get('/api/health', async (_req, res, next) => {
  try {
    await database.query('SELECT 1')
    return res.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    return next(error)
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/profiles', profileRoutes)
app.use('/api/products', productRoutes)

app.use((error, _req, res, _next) => {
  console.error('API request failed:', error.message)
  return res.status(500).json({ error: 'The server could not complete the request.' })
})

app.listen(port, () => {
  console.log(`BuildBoard API listening on port ${port}`)
})
