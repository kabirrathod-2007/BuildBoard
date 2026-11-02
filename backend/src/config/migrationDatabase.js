import mysql from 'mysql2/promise'

/**
 * Migration database configuration and pool factory.
 *
 * Security Constraints:
 * 1. Requires dedicated MIGRATION_DB_* environment variables in production and staging.
 * 2. Never silently falls back to runtime API credentials in production or staging.
 * 3. Keeps DDL (CREATE, ALTER, DROP) privileges out of the runtime application database user.
 */
let hasWarnedDevelopment = false

export function getMigrationConfig() {
  const isProdOrStaging = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'

  const host = process.env.MIGRATION_DB_HOST
  const port = Number(process.env.MIGRATION_DB_PORT || 3306)
  const user = process.env.MIGRATION_DB_USER
  const password = process.env.MIGRATION_DB_PASSWORD
  const dbName = process.env.MIGRATION_DB_NAME

  const hasDedicatedConfig = Boolean(host && user && password && dbName)

  if (isProdOrStaging && !hasDedicatedConfig) {
    const missing = []
    if (!host) missing.push('MIGRATION_DB_HOST')
    if (!user) missing.push('MIGRATION_DB_USER')
    if (!password) missing.push('MIGRATION_DB_PASSWORD')
    if (!dbName) missing.push('MIGRATION_DB_NAME')
    throw new Error(
      `[Migration Security Error] Dedicated migration credentials are required in ${process.env.NODE_ENV}. Missing: ${missing.join(', ')}. Silently falling back to runtime credentials is prohibited.`
    )
  }

  const targetHost = host || process.env.MIGRATION_DB_HOST || process.env.DB_HOST || ''
  const useSsl =
    process.env.MIGRATION_DB_SSL === 'true' ||
    process.env.DB_SSL === 'true' ||
    Boolean(targetHost && (targetHost.includes('tidbcloud.com') || targetHost.includes('aivencloud.com')))

  const sslConfig = useSsl ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } } : {}

  if (hasDedicatedConfig) {
    return {
      host,
      port,
      user,
      password,
      database: dbName,
      multipleStatements: true,
      charset: 'utf8mb4',
      ...sslConfig,
    }
  }

  // Test mode configuration (supports disposable CI container or fallback)
  if (process.env.NODE_ENV === 'test') {
    return {
      host: process.env.MIGRATION_DB_HOST || process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.MIGRATION_DB_PORT || process.env.DB_PORT || 3306),
      user: process.env.MIGRATION_DB_USER || process.env.DB_USER || 'root',
      password: process.env.MIGRATION_DB_PASSWORD || process.env.DB_PASSWORD || 'rootpassword',
      database: process.env.MIGRATION_DB_NAME || process.env.DB_NAME || 'buildboard_test',
      multipleStatements: true,
      charset: 'utf8mb4',
      ...sslConfig,
    }
  }

  // Development mode: warn if dedicated migration account is missing
  if (!process.env.MIGRATION_DB_USER && !hasWarnedDevelopment) {
    hasWarnedDevelopment = true
    console.warn(
      '[Migration Config] MIGRATION_DB_* credentials not set. Falling back to DB_* for development inspection. For DDL migrations, define MIGRATION_DB_USER & MIGRATION_DB_PASSWORD with administrative privileges.'
    )
  }

  return {
    host: process.env.MIGRATION_DB_HOST || process.env.DB_HOST,
    port: Number(process.env.MIGRATION_DB_PORT || process.env.DB_PORT || 3306),
    user: process.env.MIGRATION_DB_USER || process.env.DB_USER,
    password: process.env.MIGRATION_DB_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.MIGRATION_DB_NAME || process.env.DB_NAME,
    multipleStatements: true,
    charset: 'utf8mb4',
    ...sslConfig,
  }
}

export function createMigrationPool() {
  const config = getMigrationConfig()
  return mysql.createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
  })
}
