import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { database } from '../config/database.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations')

async function ensureMigrationTable() {
  await database.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
}

async function getAppliedMigrations() {
  try {
    const [rows] = await database.execute('SELECT name FROM schema_migrations ORDER BY id ASC')
    return new Set(rows.map((r) => r.name))
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE' || error.errno === 1146) {
      return new Set()
    }
    throw error
  }
}

export async function runMigrations({ statusOnly = false } = {}) {
  let applied = new Set()
  if (statusOnly) {
    applied = await getAppliedMigrations()
  } else {
    await ensureMigrationTable()
    applied = await getAppliedMigrations()
  }

  const files = (await fs.readdir(MIGRATIONS_DIR))
    .filter((file) => file.endsWith('.sql'))
    .sort()

  console.log(`Found ${files.length} migration file(s). Applied: ${applied.size}`)

  if (statusOnly) {
    for (const file of files) {
      const isApplied = applied.has(file)
      console.log(`  [${isApplied ? 'APPLIED' : 'PENDING'}] ${file}`)
    }
    return { files, applied: Array.from(applied) }
  }

  const pending = files.filter((f) => !applied.has(f))
  if (pending.length === 0) {
    console.log('Database is up to date. No pending migrations.')
    return { appliedCount: 0 }
  }

  let count = 0
  for (const file of pending) {
    console.log(`Applying migration: ${file}...`)
    const filePath = path.join(MIGRATIONS_DIR, file)
    const sqlContent = await fs.readFile(filePath, 'utf8')

    // Split SQL into individual statements ignoring comments
    const statements = sqlContent
      .split(/;\s*$/m)
      .map((s) => s.trim())
      .filter((s) => {
        const cleaned = s.replace(/--.*$/gm, '').trim()
        return cleaned.length > 0 && !cleaned.toUpperCase().startsWith('USE ')
      })

    const connection = await database.getConnection()
    try {
      await connection.beginTransaction()
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await connection.query(statement)
          } catch (err) {
            // If column/table already exists during idempotent replay, proceed safely
            if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_TABLE_EXISTS_ERROR') {
              console.warn(`  [Notice] ${err.message} (safe to proceed)`)
            } else {
              throw err
            }
          }
        }
      }
      await connection.execute('INSERT INTO schema_migrations (name) VALUES (?)', [file])
      await connection.commit()
      count++
      console.log(`  Successfully applied ${file}`)
    } catch (err) {
      await connection.rollback()
      console.error(`  Failed applying ${file}:`, err.message)
      throw err
    } finally {
      connection.release()
    }
  }

  console.log(`Applied ${count} migration(s) successfully.`)
  return { appliedCount: count }
}

// Direct execution CLI entrypoint
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isMain) {
  const isStatus = process.argv.includes('--status')
  runMigrations({ statusOnly: isStatus })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration error:', err.message)
      process.exit(1)
    })
}
