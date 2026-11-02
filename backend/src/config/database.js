import mysql from 'mysql2/promise'

const requiredSettings = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']
const missingSettings = requiredSettings.filter((key) => !process.env[key])

if (missingSettings.length > 0) {
  throw new Error(`Missing MySQL configuration: ${missingSettings.join(', ')}`)
}

const useSsl =
  process.env.DB_SSL === 'true' ||
  Boolean(process.env.DB_HOST && (process.env.DB_HOST.includes('tidbcloud.com') || process.env.DB_HOST.includes('aivencloud.com')))

export const database = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  ...(useSsl ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } } : {}),
})
