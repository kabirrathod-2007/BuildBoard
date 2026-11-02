import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMigrationPool, getMigrationConfig } from '../config/migrationDatabase.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations')

const MIGRATION_OBJECT_MAP = {
  '001_users.sql': { type: 'table', name: 'users' },
  '002_user_profiles.sql': { type: 'table', name: 'user_profiles' },
  '003_products.sql': { type: 'table', name: 'products' },
  '004_enrollments.sql': { type: 'table', name: 'product_enrollments' },
  '005_feedback.sql': { type: 'table', name: 'product_feedback' },
  '006_problems.sql': { type: 'table', name: 'problems' },
  '007_notifications.sql': { type: 'table', name: 'notifications' },
  '008_views_count.sql': { type: 'column', name: 'products.views_count' },
  '009_enrollment_limit.sql': { type: 'column', name: 'products.enrollment_limit' },
}

async function ensureMigrationTable(pool) {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
}

async function getExistingTables(pool) {
  try {
    const [rows] = await pool.execute(
      'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()'
    )
    return new Set(rows.map((r) => r.TABLE_NAME || r.table_name))
  } catch (error) {
    throw new Error(`[Migration Status Failure] Could not inspect schema metadata from information_schema.TABLES: ${error.message}`)
  }
}

async function getExistingColumns(pool) {
  try {
    const [rows] = await pool.execute(
      'SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()'
    )
    const columns = new Set()
    for (const r of rows) {
      const tableName = r.TABLE_NAME || r.table_name
      const colName = r.COLUMN_NAME || r.column_name
      columns.add(`${tableName}.${colName}`)
    }
    return columns
  } catch (error) {
    throw new Error(`[Migration Status Failure] Could not inspect column metadata from information_schema.COLUMNS: ${error.message}`)
  }
}

async function getAppliedMigrations(pool) {
  try {
    const [rows] = await pool.execute('SELECT name FROM schema_migrations ORDER BY id ASC')
    return new Set(rows.map((r) => r.name))
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE' || error.errno === 1146) {
      return null // null indicates schema_migrations table does not exist
    }
    throw error
  }
}

export async function runMigrations({ statusOnly = false, customPool = null } = {}) {
  const pool = customPool || createMigrationPool()
  const shouldClosePool = !customPool

  try {
    const files = (await fs.readdir(MIGRATIONS_DIR))
      .filter((file) => file.endsWith('.sql'))
      .sort()

    const applied = await getAppliedMigrations(pool)
    const existingTables = await getExistingTables(pool)
    const existingColumns = await getExistingColumns(pool)
    const hasTrackingTable = applied !== null

    if (statusOnly) {
      console.log(`\n=== BuildBoard Migration Status Inspection ===`)
      console.log(`Database Target: ${getMigrationConfig().database} (${getMigrationConfig().host}:${getMigrationConfig().port})`)
      console.log(`Total Migration Files: ${files.length}`)
      console.log(`Tracking Table Present: ${hasTrackingTable ? 'YES (schema_migrations)' : 'NO'}`)
      console.log(`Total Tables in Database: ${existingTables.size}\n`)

      if (!hasTrackingTable) {
        if (existingTables.size > 0) {
          console.warn('⚠️  [UNTRACKED SCHEMA DETECTED]')
          console.warn(
            'The database contains existing application tables, but schema_migrations is missing.'
          )
          console.warn(
            'These tables were created manually or without migration tracking. Baseline the schema before applying new migrations.\n'
          )

          for (const file of files) {
            const mappedObj = MIGRATION_OBJECT_MAP[file]
            let exists = false
            let detail = ''
            if (mappedObj) {
              if (mappedObj.type === 'table') {
                exists = existingTables.has(mappedObj.name)
                detail = `table '${mappedObj.name}' exists in DB`
              } else if (mappedObj.type === 'column') {
                exists = existingColumns.has(mappedObj.name)
                detail = `column '${mappedObj.name}' exists in DB`
              }
            }
            if (exists) {
              console.log(`  [UNTRACKED SCHEMA] ${file} (${detail})`)
            } else {
              console.log(`  [MIGRATION PENDING] ${file}`)
            }
          }
        } else {
          console.log('ℹ️  [FRESH DATABASE DETECTED]')
          console.log('No existing tables found. All migrations are pending execution:\n')
          for (const file of files) {
            console.log(`  [MIGRATION PENDING] ${file}`)
          }
        }
        return { files, applied: [], untrackedSchema: existingTables.size > 0 }
      }

      for (const file of files) {
        const isApplied = applied.has(file)
        if (isApplied) {
          console.log(`  [APPLIED] ${file}`)
        } else {
          const mappedObj = MIGRATION_OBJECT_MAP[file]
          let exists = false
          let detail = ''
          if (mappedObj) {
            if (mappedObj.type === 'table' && existingTables.has(mappedObj.name)) {
              exists = true
              detail = `table '${mappedObj.name}' already exists in DB`
            } else if (mappedObj.type === 'column' && existingColumns.has(mappedObj.name)) {
              exists = true
              detail = `column '${mappedObj.name}' already exists in DB`
            }
          }
          if (exists) {
            console.log(`  [UNTRACKED IN MIGRATION TABLE] ${file} (${detail})`)
          } else {
            console.log(`  [PENDING] ${file}`)
          }
        }
      }
      return { files, applied: Array.from(applied), untrackedSchema: false }
    }

    // Apply migrations (Requires DDL administrative privileges)
    await ensureMigrationTable(pool)
    const currentApplied = (await getAppliedMigrations(pool)) || new Set()
    const pending = files.filter((f) => !currentApplied.has(f))

    if (pending.length === 0) {
      console.log('Database is up to date. No pending migrations.')
      return { appliedCount: 0 }
    }

    let count = 0
    for (const file of pending) {
      console.log(`Applying migration: ${file}...`)
      const filePath = path.join(MIGRATIONS_DIR, file)
      const sqlContent = await fs.readFile(filePath, 'utf8')

      const statements = sqlContent
        .split(/;\s*$/m)
        .map((s) => s.trim())
        .filter((s) => {
          const cleaned = s.replace(/--.*$/gm, '').trim()
          return cleaned.length > 0 && !cleaned.toUpperCase().startsWith('USE ')
        })

      const connection = await pool.getConnection()
      try {
        // NOTE: In MySQL, DDL statements (CREATE, ALTER, DROP, TRUNCATE) cause an implicit COMMIT.
        // DDL migrations are non-transactional and cannot be rolled back via transactions.
        // Statements execute sequentially and commit immediately upon execution.
        for (let idx = 0; idx < statements.length; idx++) {
          const statement = statements[idx]
          if (statement.trim()) {
            try {
              await connection.query(statement)
            } catch (err) {
              const isDuplicateObject =
                err.code === 'ER_DUP_FIELDNAME' ||
                err.code === 'ER_TABLE_EXISTS_ERROR' ||
                err.code === 'ER_DUP_KEYNAME'

              console.error(
                `\n❌ [MIGRATION FAILURE] Migration '${file}' failed on statement ${idx + 1} of ${statements.length}:`
              )
              console.error(`  Error: [${err.code || 'UNKNOWN'}] ${err.message}`)
              console.error(`  Failing Statement: ${statement.slice(0, 120)}...`)

              if (isDuplicateObject) {
                console.error(
                  `\n⚠️  SCHEMA CONFLICT: An existing object with this name already exists in the database.`
                )
                console.error(
                  `   Automatic skipping is disabled because the existing object's schema definition cannot be verified automatically.`
                )
              }

              console.error(
                `\n⚠️  RECOVERY REQUIRED: In MySQL, DDL statements implicitly commit and cannot be rolled back.`
              )
              if (idx > 0) {
                console.error(
                  `   Statements 1 to ${idx} executed prior to this failure remain committed in the database.`
                )
              } else {
                console.error(
                  `   Statement 1 failed before committing.`
                )
              }
              console.error(
                `   '${file}' has NOT been recorded in schema_migrations.`
              )
              console.error(
                `   Run 'npm run migrate -- --status' to inspect schema state. Refer to docs/staging_deployment.md for repair instructions.\n`
              )

              const priorNotice =
                idx > 0
                  ? `Statements 1 to ${idx} may remain committed in the database. `
                  : `Statement 1 failed. `

              const conflictNotice = isDuplicateObject
                ? `Existing object encountered (${err.code}). Automatic skipping is disabled to prevent schema mismatches. `
                : ''

              const partialError = new Error(
                `Migration failed at ${file} (statement ${idx + 1}/${statements.length}): [${err.code || 'ERROR'}] ${err.message}. ` +
                `Note: In MySQL, DDL statements implicitly commit and cannot be rolled back. ` +
                priorNotice +
                conflictNotice +
                `Inspect schema state with 'npm run migrate -- --status' before retrying.`
              )
              partialError.code = err.code
              partialError.statementIndex = idx + 1
              partialError.totalStatements = statements.length
              throw partialError
            }
          }
        }
        await connection.execute('INSERT INTO schema_migrations (name) VALUES (?)', [file])
        count++
        console.log(`  Successfully applied and recorded ${file}`)
      } finally {
        connection.release()
      }
    }

    console.log(`Applied ${count} migration(s) successfully.`)
    return { appliedCount: count }
  } finally {
    if (shouldClosePool) {
      await pool.end().catch(() => {})
    }
  }
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
