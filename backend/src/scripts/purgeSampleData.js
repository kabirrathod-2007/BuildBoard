#!/usr/bin/env node
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
dotenv.config()

console.log('=== BuildBoard Explicit Database Cleanup CLI ===')

async function main() {
  // Strict opt-in check before importing server or connecting to the database
  if (process.env.RUN_LEGACY_SAMPLE_CLEANUP !== 'true') {
    console.error('[SAFETY ABORT] Database cleanup requires explicit confirmation.')
    console.error('To execute cleanup, set RUN_LEGACY_SAMPLE_CLEANUP=true in your environment:')
    console.error('  RUN_LEGACY_SAMPLE_CLEANUP=true node src/scripts/purgeSampleData.js')
    process.exitCode = 1
    return
  }

  let db = null
  try {
    // Dynamically import database configuration and cleanup function only after opt-in verification
    const { database } = await import('../config/database.js')
    db = database
    const { purgeLegacySampleData } = await import('../server.js')

    console.log('Starting atomic legacy sample data cleanup transaction...')
    const result = await purgeLegacySampleData()
    console.log('[CLEANUP COMPLETE] Sample data cleanup completed successfully:', result)
    process.exitCode = 0
  } catch (err) {
    console.error('[CLEANUP FAILED] Execution aborted:', err.message)
    process.exitCode = 1
  } finally {
    if (db) {
      try {
        await db.end()
      } catch (poolErr) {
        console.error('[CLEANUP WARNING] Failed to close database pool cleanly:', poolErr.message)
      }
    }
  }
}

await main()
