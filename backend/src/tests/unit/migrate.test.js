import test from 'node:test'
import assert from 'node:assert/strict'
import { runMigrations } from '../../utils/migrate.js'

test('Migration Status: throws clear error if information_schema.TABLES fails', async () => {
  const mockFailingPool = {
    async execute(query) {
      if (query.includes('schema_migrations')) {
        const err = new Error('Table does not exist')
        err.code = 'ER_NO_SUCH_TABLE'
        throw err
      }
      if (query.includes('information_schema.TABLES')) {
        throw new Error('Access denied to information_schema')
      }
      return [[]]
    },
    async end() {},
  }

  await assert.rejects(
    async () => {
      await runMigrations({ statusOnly: true, customPool: mockFailingPool })
    },
    (err) => {
      assert.match(err.message, /\[Migration Status Failure\] Could not inspect schema metadata/)
      return true
    }
  )
})

test('Migration Status: throws clear error if information_schema.COLUMNS fails', async () => {
  const mockFailingPool = {
    async execute(query) {
      if (query.includes('schema_migrations')) {
        const err = new Error('Table does not exist')
        err.code = 'ER_NO_SUCH_TABLE'
        throw err
      }
      if (query.includes('information_schema.TABLES')) {
        return [[{ TABLE_NAME: 'users' }]]
      }
      if (query.includes('information_schema.COLUMNS')) {
        throw new Error('Metadata lock conflict')
      }
      return [[]]
    },
    async end() {},
  }

  await assert.rejects(
    async () => {
      await runMigrations({ statusOnly: true, customPool: mockFailingPool })
    },
    (err) => {
      assert.match(err.message, /\[Migration Status Failure\] Could not inspect column metadata/)
      return true
    }
  )
})

test('Migration Status: accurately detects untracked tables and columns when schema_migrations is missing', async () => {
  const mockPool = {
    async execute(query) {
      if (query.includes('schema_migrations')) {
        const err = new Error('Table does not exist')
        err.code = 'ER_NO_SUCH_TABLE'
        throw err
      }
      if (query.includes('information_schema.TABLES')) {
        // users, products exist, but problems does not
        return [[
          { TABLE_NAME: 'users' },
          { TABLE_NAME: 'user_profiles' },
          { TABLE_NAME: 'products' },
        ]]
      }
      if (query.includes('information_schema.COLUMNS')) {
        // products has views_count, but not enrollment_limit
        return [[
          { TABLE_NAME: 'products', COLUMN_NAME: 'views_count' },
        ]]
      }
      return [[]]
    },
    async end() {},
  }

  const result = await runMigrations({ statusOnly: true, customPool: mockPool })
  assert.equal(result.untrackedSchema, true)
  assert.ok(result.files.includes('001_users.sql'))
  assert.ok(result.files.includes('008_views_count.sql'))
  assert.ok(result.files.includes('009_enrollment_limit.sql'))
})

test('Migration Runner: multi-statement failure on statement 2 identifies statement 2, leaves unrecorded, and notes statement 1 may remain committed', async () => {
  let statementCallCount = 0
  let schemaMigrationsInserted = false

  const mockConnection = {
    async query() {
      statementCallCount++
      if (statementCallCount === 1) {
        // Statement 1 succeeds (e.g. CREATE TABLE products)
        return [[]]
      }
      // Statement 2 fails
      const err = new Error('Constraint violation on secondary table')
      err.code = 'ER_CANT_CREATE_TABLE'
      throw err
    },
    async execute(sql) {
      if (sql.includes('INSERT INTO schema_migrations')) {
        schemaMigrationsInserted = true
      }
      return [[]]
    },
    release() {},
  }

  const mockPool = {
    async execute(query) {
      if (query.includes('schema_migrations')) {
        // Mark 001 and 002 applied so 003_products.sql (which has multiple statements) runs next
        return [[{ name: '001_users.sql' }, { name: '002_user_profiles.sql' }]]
      }
      return [[]]
    },
    async getConnection() {
      return mockConnection
    },
    async end() {},
  }

  await assert.rejects(
    async () => {
      await runMigrations({ statusOnly: false, customPool: mockPool })
    },
    (err) => {
      assert.equal(err.statementIndex, 2, 'Error must identify statement 2 as the failure point')
      assert.match(err.message, /statement 2\//, 'Error message must specify statement 2')
      assert.match(err.message, /cannot be rolled back/i, 'Error message must note DDL cannot be rolled back')
      assert.match(err.message, /Statements 1 to 1 may remain committed/i, 'Error message must note statement 1 may remain committed')
      return true
    }
  )

  assert.equal(schemaMigrationsInserted, false, 'Migration must NOT be recorded in schema_migrations when statement 2 fails')
})

test('Migration Runner: duplicate table error (ER_TABLE_EXISTS_ERROR) stops execution and is NOT silently skipped', async () => {
  let schemaMigrationsInserted = false

  const mockConnection = {
    async query() {
      const err = new Error("Table 'users' already exists")
      err.code = 'ER_TABLE_EXISTS_ERROR'
      throw err
    },
    async execute(sql) {
      if (sql.includes('INSERT INTO schema_migrations')) {
        schemaMigrationsInserted = true
      }
      return [[]]
    },
    release() {},
  }

  const mockPool = {
    async execute(query) {
      if (query.includes('schema_migrations')) {
        return [[]]
      }
      return [[]]
    },
    async getConnection() {
      return mockConnection
    },
    async end() {},
  }

  await assert.rejects(
    async () => {
      await runMigrations({ statusOnly: false, customPool: mockPool })
    },
    (err) => {
      assert.equal(err.code, 'ER_TABLE_EXISTS_ERROR')
      assert.match(err.message, /ER_TABLE_EXISTS_ERROR/)
      assert.match(err.message, /Automatic skipping is disabled to prevent schema mismatches/i)
      return true
    }
  )

  assert.equal(schemaMigrationsInserted, false, 'Mismatched or duplicate schema must NOT be silently marked as applied')
})

test('Migration Runner: duplicate column error (ER_DUP_FIELDNAME) stops execution and is NOT silently skipped', async () => {
  let schemaMigrationsInserted = false

  const mockConnection = {
    async query() {
      const err = new Error("Duplicate column name 'views_count'")
      err.code = 'ER_DUP_FIELDNAME'
      throw err
    },
    async execute(sql) {
      if (sql.includes('INSERT INTO schema_migrations')) {
        schemaMigrationsInserted = true
      }
      return [[]]
    },
    release() {},
  }

  const mockPool = {
    async execute(query) {
      if (query.includes('schema_migrations')) {
        return [[]]
      }
      return [[]]
    },
    async getConnection() {
      return mockConnection
    },
    async end() {},
  }

  await assert.rejects(
    async () => {
      await runMigrations({ statusOnly: false, customPool: mockPool })
    },
    (err) => {
      assert.equal(err.code, 'ER_DUP_FIELDNAME')
      assert.match(err.message, /ER_DUP_FIELDNAME/)
      return true
    }
  )

  assert.equal(schemaMigrationsInserted, false, 'Duplicate column error must NOT record migration in schema_migrations')
})

test('Migration Runner: duplicate key error (ER_DUP_KEYNAME) stops execution and is NOT silently skipped', async () => {
  let schemaMigrationsInserted = false

  const mockConnection = {
    async query() {
      const err = new Error("Duplicate key name 'idx_lookup'")
      err.code = 'ER_DUP_KEYNAME'
      throw err
    },
    async execute(sql) {
      if (sql.includes('INSERT INTO schema_migrations')) {
        schemaMigrationsInserted = true
      }
      return [[]]
    },
    release() {},
  }

  const mockPool = {
    async execute(query) {
      if (query.includes('schema_migrations')) {
        return [[]]
      }
      return [[]]
    },
    async getConnection() {
      return mockConnection
    },
    async end() {},
  }

  await assert.rejects(
    async () => {
      await runMigrations({ statusOnly: false, customPool: mockPool })
    },
    (err) => {
      assert.equal(err.code, 'ER_DUP_KEYNAME')
      assert.match(err.message, /ER_DUP_KEYNAME/)
      return true
    }
  )

  assert.equal(schemaMigrationsInserted, false, 'Duplicate key error must NOT record migration in schema_migrations')
})
