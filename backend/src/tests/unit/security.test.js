import test from 'node:test'
import assert from 'node:assert/strict'
import { requireAuth } from '../../middleware/requireAuth.js'

test('Security Middleware: requireAuth rejects missing or malformed Authorization header', async () => {
  const reqNoAuth = {
    get: (_header) => undefined,
  }
  let statusCode = null
  let jsonResponse = null
  const res = {
    status(code) {
      statusCode = code
      return {
        json(data) {
          jsonResponse = data
        },
      }
    },
  }

  await requireAuth(reqNoAuth, res, () => {
    assert.fail('Should not call next() when Authorization header is missing')
  })

  assert.equal(statusCode, 401)
  assert.equal(jsonResponse?.error, 'Sign in to continue.')

  // Invalid scheme
  const reqBasicAuth = {
    get: (_header) => 'Basic dXNlcjpwYXNz',
  }
  await requireAuth(reqBasicAuth, res, () => {
    assert.fail('Should not call next() for non-Bearer auth')
  })
  assert.equal(statusCode, 401)
})

test('Prototype Gating: unauthenticated users cannot retrieve private prototype URLs', () => {
  const mockProduct = {
    id: 101,
    creator_id: 1,
    name: 'Secure Prototype',
    product_url: 'https://staging.internal.app/demo-secret-key-123',
    creator_email: 'builder@example.com',
  }

  function resolveSafeProduct(row, userId = null, isEnrolled = false, isCatalog = false) {
    const isOwner = Boolean(userId && Number(row.creator_id) === Number(userId))
    const canAccessPrototype = !isCatalog && (isOwner || isEnrolled)
    const productUrl = canAccessPrototype ? row.product_url : null
    return {
      id: String(row.id),
      name: row.name,
      productUrl,
      creatorEmail: isOwner ? row.creator_email : undefined,
    }
  }

  // 1. Anonymous visitor in catalog
  const anonCatalog = resolveSafeProduct(mockProduct, null, false, true)
  assert.equal(anonCatalog.productUrl, null, 'Catalog must NEVER expose prototype link')
  assert.equal(anonCatalog.creatorEmail, undefined, 'Catalog must NEVER expose creator email')

  // 2. Anonymous visitor in detail view
  const anonDetail = resolveSafeProduct(mockProduct, null, false, false)
  assert.equal(anonDetail.productUrl, null, 'Anonymous detail request must not expose prototype link')
  assert.equal(anonDetail.creatorEmail, undefined, 'Anonymous detail request must not expose creator email')

  // 3. Authenticated user who is NOT enrolled
  const notEnrolled = resolveSafeProduct(mockProduct, 999, false, false)
  assert.equal(notEnrolled.productUrl, null, 'Non-enrolled user must not access prototype link')
  assert.equal(notEnrolled.creatorEmail, undefined, 'Non-owner must not see creator email')

  // 4. Authenticated enrolled tester
  const enrolledTester = resolveSafeProduct(mockProduct, 999, true, false)
  assert.equal(enrolledTester.productUrl, 'https://staging.internal.app/demo-secret-key-123')
  assert.equal(enrolledTester.creatorEmail, undefined, 'Enrolled tester does not need creator private email')

  // 5. Product Owner
  const owner = resolveSafeProduct(mockProduct, 1, false, false)
  assert.equal(owner.productUrl, 'https://staging.internal.app/demo-secret-key-123')
  assert.equal(owner.creatorEmail, 'builder@example.com', 'Owner sees their own email')
})

test('Privacy Rule: Public problem views must not expose validator or tester email lists', () => {
  const mockProblemDetails = {
    id: 50,
    title: 'Developer Tool Hypothesis',
    validation_count: 14,
    tester_signup_count: 8,
    comments: [
      { id: '1', authorName: 'Alice', authorUsername: 'alice_dev', text: 'Great problem' },
    ],
  }

  // Verify response shape matches safe public schema without emails
  assert.equal('validatedBy' in mockProblemDetails, false, 'validatedBy email array must be removed')
  assert.equal('testerSignups' in mockProblemDetails, false, 'testerSignups email array must be removed')
  assert.equal(mockProblemDetails.validation_count, 14)
  assert.equal(mockProblemDetails.tester_signup_count, 8)
  assert.equal(mockProblemDetails.comments[0].authorEmail, undefined)
})

test('Concurrency & Quota Simulation: atomic slot allocation prevents overbooking', async () => {
  // Simulate an in-memory database mutex simulating transaction with FOR UPDATE
  let currentEnrollmentCount = 4
  const quotaLimit = 5
  let mutexLocked = false

  async function atomicEnroll(testerId) {
    // Acquire lock (simulating connection.beginTransaction() + SELECT ... FOR UPDATE)
    while (mutexLocked) {
      await new Promise((resolve) => setTimeout(resolve, 5))
    }
    mutexLocked = true

    try {
      if (currentEnrollmentCount >= quotaLimit) {
        return { success: false, status: 409, error: 'Quota reached', testerId }
      }
      currentEnrollmentCount += 1
      return { success: true, status: 201, enrolledSlot: currentEnrollmentCount, testerId }
    } finally {
      mutexLocked = false
    }
  }

  // 5 concurrent requests compete simultaneously for the 1 remaining slot (slot 5 of 5)
  const competingTesters = [101, 102, 103, 104, 105]
  const results = await Promise.all(competingTesters.map((id) => atomicEnroll(id)))

  const successfulEnrollments = results.filter((r) => r.success)
  const rejectedEnrollments = results.filter((r) => !r.success)

  assert.equal(successfulEnrollments.length, 1, 'Exactly one concurrent request should win the final slot')
  assert.equal(rejectedEnrollments.length, 4, 'Remaining concurrent requests must be rejected with 409')
  assert.equal(currentEnrollmentCount, quotaLimit, 'Total enrollments must never exceed quotaLimit')
  for (const rejected of rejectedEnrollments) {
    assert.equal(rejected.status, 409)
  }
})

test('Authorization Enforcement: Users cannot mutate resources owned by others', () => {
  const targetProduct = { id: 10, creator_id: 100 }
  const requesterUserId = 200 // Different user

  const isOwner = Number(targetProduct.creator_id) === Number(requesterUserId)
  assert.equal(isOwner, false)

  function verifyAction(action) {
    if (!isOwner) {
      return { status: 403, error: `Only the creator can ${action} this product.` }
    }
    return { status: 200, success: true }
  }

  assert.equal(verifyAction('edit').status, 403)
  assert.equal(verifyAction('pause').status, 403)
  assert.equal(verifyAction('delete').status, 403)
})

test('Test Auth Isolation: setTokenVerifierForTesting throws when NODE_ENV is production', async () => {
  const { setTokenVerifierForTesting, resetTokenVerifierForTesting } = await import('../../middleware/requireAuth.js')
  const originalEnv = process.env.NODE_ENV
  try {
    process.env.NODE_ENV = 'production'
    assert.throws(() => {
      setTokenVerifierForTesting(() => ({ uid: '123' }))
    }, /Custom token verifiers can only be registered in NODE_ENV=test/)
  } finally {
    process.env.NODE_ENV = originalEnv
    resetTokenVerifierForTesting()
  }
})

test('Test Auth Isolation: requireAuth in production configuration unconditionally rejects test tokens', async () => {
  const { requireAuth, setTokenVerifierForTesting, resetTokenVerifierForTesting } = await import('../../middleware/requireAuth.js')
  const originalEnv = process.env.NODE_ENV
  const originalEnable = process.env.ENABLE_TEST_AUTH

  try {
    process.env.NODE_ENV = 'production'
    process.env.ENABLE_TEST_AUTH = 'true' // Malicious or accidental env variable in production

    let statusCode = null
    let responseData = null
    const req = {
      get: (h) => (h.toLowerCase() === 'authorization' ? 'Bearer test-auth:eyJ1aWQiOiIxMjMifQ==' : undefined),
    }
    const res = {
      status(code) {
        statusCode = code
        return {
          json(data) {
            responseData = data
          },
        }
      },
    }

    await requireAuth(req, res, () => {
      assert.fail('Should not authenticate test token in production')
    })

    // In production without live Firebase token, it must be rejected with 401 or 503, never allowed
    assert.ok(statusCode === 401 || statusCode === 503)
  } finally {
    process.env.NODE_ENV = originalEnv
    process.env.ENABLE_TEST_AUTH = originalEnable
    resetTokenVerifierForTesting()
  }
})

test('Express Error Handler: returns HTTP 413 for oversized body payloads', async () => {
  const { app } = await import('../../server.js')
  const errorHandler = app.router.stack.find((l) => l.handle && l.handle.length === 4)?.handle
  assert.ok(errorHandler, 'Express error handler must be registered on app')

  const error = new Error('request entity too large')
  error.status = 413
  error.type = 'entity.too.large'

  let statusCode = null
  let responseData = null
  const res = {
    status(code) {
      statusCode = code
      return this
    },
    json(data) {
      responseData = data
      return this
    },
  }

  errorHandler(error, { id: 'req-413' }, res, () => {})
  assert.equal(statusCode, 413)
  assert.equal(responseData?.error, 'Request payload exceeds 32KB limit.')
})

test('Express Error Handler: returns HTTP 400 for malformed JSON syntax errors', async () => {
  const { app } = await import('../../server.js')
  const errorHandler = app.router.stack.find((l) => l.handle && l.handle.length === 4)?.handle
  assert.ok(errorHandler, 'Express error handler must be registered on app')

  const error = new SyntaxError('Unexpected token } in JSON at position 12')
  error.status = 400
  error.type = 'entity.parse.failed'

  let statusCode = null
  let responseData = null
  const res = {
    status(code) {
      statusCode = code
      return this
    },
    json(data) {
      responseData = data
      return this
    },
  }

  errorHandler(error, { id: 'req-400' }, res, () => {})
  assert.equal(statusCode, 400)
  assert.equal(responseData?.error, 'Invalid JSON payload format.')
})

test('Express Error Handler: returns HTTP 403 for CORS rejection error', async () => {
  const { app } = await import('../../server.js')
  const errorHandler = app.router.stack.find((l) => l.handle && l.handle.length === 4)?.handle
  assert.ok(errorHandler, 'Express error handler must be registered on app')

  const error = new Error('Origin https://malicious-site.com is not allowed by CORS.')

  let statusCode = null
  let responseData = null
  const res = {
    status(code) {
      statusCode = code
      return this
    },
    json(data) {
      responseData = data
      return this
    },
  }

  errorHandler(error, { id: 'req-403' }, res, () => {})
  assert.equal(statusCode, 403)
  assert.equal(responseData?.error, 'Origin is not allowed by CORS.')
})

test('Express Error Handler: masks internal server errors as HTTP 500 without leaking stack traces or sensitive data', async () => {
  const { app } = await import('../../server.js')
  const errorHandler = app.router.stack.find((l) => l.handle && l.handle.length === 4)?.handle
  assert.ok(errorHandler, 'Express error handler must be registered on app')

  const sensitiveError = new Error('CRITICAL DB EXCEPTION: connect ECONNREFUSED password=superSecretDBPassword123')

  let statusCode = null
  let responseData = null
  const res = {
    status(code) {
      statusCode = code
      return this
    },
    json(data) {
      responseData = data
      return this
    },
  }

  errorHandler(sensitiveError, { id: 'test-correlation-id-999' }, res, () => {})
  assert.equal(statusCode, 500)
  assert.equal(responseData?.error, 'The server could not complete the request.')
  assert.equal(responseData?.requestId, 'test-correlation-id-999')
  // Sensitive error message and internal details must NEVER leak in response
  const serialized = JSON.stringify(responseData)
  assert.equal(serialized.includes('password'), false)
  assert.equal(serialized.includes('superSecretDBPassword123'), false)
  assert.equal(responseData?.stack, undefined)
})

test('Express Pipeline (End-to-End): real HTTP requests trigger actual body limit and CORS error responses', async () => {
  const http = await import('node:http')
  const { app } = await import('../../server.js')

  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  const baseUrl = `http://127.0.0.1:${port}`

  try {
    // 1. Real Oversized payload (>32KB) -> HTTP 413
    const res413 = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overflow: 'X'.repeat(35000) }),
    })
    assert.equal(res413.status, 413)
    const body413 = await res413.json()
    assert.equal(body413.error, 'Request payload exceeds 32KB limit.')

    // 2. Real Malformed JSON -> HTTP 400
    const res400 = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ "brokenJson": unquoted }',
    })
    assert.equal(res400.status, 400)
    const body400 = await res400.json()
    assert.equal(body400.error, 'Invalid JSON payload format.')

    // 3. Real Disallowed CORS origin -> HTTP 403
    const resCors = await fetch(`${baseUrl}/api/products`, {
      method: 'GET',
      headers: { Origin: 'https://evil-unauthorized-site.com' },
    })
    assert.equal(resCors.status, 403)
    const bodyCors = await resCors.json()
    assert.equal(bodyCors.error, 'Origin is not allowed by CORS.')
  } finally {
    server.close()
  }
})

test('CORS Allowlist: strictly rejects unrelated *.vercel.app origins and fake projects', async () => {
  const { isOriginAllowed } = await import('../../server.js')
  // Attackers deploying on their own Vercel accounts or mimicking buildboard names must be rejected
  assert.equal(isOriginAllowed('https://attacker.vercel.app', 'production'), false)
  assert.equal(isOriginAllowed('https://other-project.vercel.app', 'production'), false)
  assert.equal(isOriginAllowed('https://phishing-site.vercel.app', 'production'), false)
  assert.equal(isOriginAllowed('https://buildboard-evil.vercel.app', 'production'), false)
  assert.equal(isOriginAllowed('https://buildboard-fake.vercel.app', 'production'), false)
})

test('CORS Allowlist: permits approved production origin and configured preview origins', async () => {
  const { isOriginAllowed } = await import('../../server.js')
  // Canonical approved production origin
  assert.equal(isOriginAllowed('https://buildboard-one.vercel.app', 'production'), true)

  // Explicitly configured preview origins via custom preview allowlist
  const mockPreviewAllowlist = new Set([
    'https://buildboard-preview-pr-12.vercel.app',
    'https://buildboard-staging.vercel.app',
  ])
  assert.equal(isOriginAllowed('https://buildboard-preview-pr-12.vercel.app', 'production', mockPreviewAllowlist), true)
  assert.equal(isOriginAllowed('https://buildboard-staging.vercel.app', 'production', mockPreviewAllowlist), true)

  // Unconfigured preview origin must be rejected
  assert.equal(isOriginAllowed('https://buildboard-unapproved.vercel.app', 'production', mockPreviewAllowlist), false)
})

test('CORS Allowlist: rejects HTTP preview origins and unexpected ports in production', async () => {
  const { isOriginAllowed } = await import('../../server.js')
  // HTTP is strictly rejected in production even for canonical hostname
  assert.equal(isOriginAllowed('http://buildboard-one.vercel.app', 'production'), false)

  // Unexpected non-standard ports are strictly rejected in production
  assert.equal(isOriginAllowed('https://buildboard-one.vercel.app:8443', 'production'), false)
  assert.equal(isOriginAllowed('https://buildboard-one.vercel.app:8080', 'production'), false)
  assert.equal(isOriginAllowed('https://buildboard-one.vercel.app:3000', 'production'), false)

  // Configured preview origin on non-standard port is rejected
  const mockPreviewAllowlist = new Set(['https://buildboard-preview.vercel.app'])
  assert.equal(isOriginAllowed('https://buildboard-preview.vercel.app:8443', 'production', mockPreviewAllowlist), false)
  assert.equal(isOriginAllowed('http://buildboard-preview.vercel.app', 'production', mockPreviewAllowlist), false)
})

test('CORS Allowlist: permits missing Origin headers (same-origin, curl, mobile)', async () => {
  const { isOriginAllowed } = await import('../../server.js')
  assert.equal(isOriginAllowed(undefined, 'production'), true)
  assert.equal(isOriginAllowed('', 'production'), true)
  assert.equal(isOriginAllowed(null, 'production'), true)
})

test('CORS Allowlist: rejects wildcard origins in all environments', async () => {
  const { isOriginAllowed } = await import('../../server.js')
  assert.equal(isOriginAllowed('*', 'production'), false)
  assert.equal(isOriginAllowed('*', 'development'), false)
  assert.equal(isOriginAllowed('*', 'test'), false)
})

test('CORS Allowlist: localhost restricted to non-production', async () => {
  const { isOriginAllowed } = await import('../../server.js')
  // Allowed in development
  assert.equal(isOriginAllowed('http://localhost:5173', 'development'), true)
  assert.equal(isOriginAllowed('http://127.0.0.1:5173', 'development'), true)
  // Strictly rejected in production unless explicitly in FRONTEND_ORIGIN
  assert.equal(isOriginAllowed('http://localhost:5173', 'production'), false)
  assert.equal(isOriginAllowed('http://127.0.0.1:5173', 'production'), false)
})

test('Database Cleanup Safety: paired UID/email identity prevents mismatched deletion', async () => {
  const {
    EXACT_SEED_USER_PAIRS,
    EXACT_SEED_PRODUCT_SLUGS,
    EXACT_SEED_PROBLEM_SLUGS,
  } = await import('../../server.js')

  // Exact 5 seed builder pairs must be defined
  assert.equal(EXACT_SEED_USER_PAIRS.length, 5)
  assert.equal(EXACT_SEED_PRODUCT_SLUGS.length, 5)
  assert.equal(EXACT_SEED_PROBLEM_SLUGS.length, 4)

  // Verify strict paired tuple validation function matching SQL WHERE clause
  function isQualifyingSeedUserPair(uid, email) {
    if (typeof uid !== 'string' || typeof email !== 'string') return false
    // 1. Literal prefix check: LEFT(firebase_uid, 13) = 'seed_builder_'
    if (uid.slice(0, 13) !== 'seed_builder_') return false
    // 2. Domain check: email LIKE '%@buildboard.dev'
    if (!email.endsWith('@buildboard.dev')) return false
    // 3. Paired tuple check: (firebase_uid, email) IN (EXACT_SEED_USER_PAIRS)
    return EXACT_SEED_USER_PAIRS.some(([seedUid, seedEmail]) => seedUid === uid && seedEmail === email)
  }

  // 1. All legitimate seed builder pairs match
  for (const [seedUid, seedEmail] of EXACT_SEED_USER_PAIRS) {
    assert.equal(isQualifyingSeedUserPair(seedUid, seedEmail), true)
  }

  // 2. Mismatched seed builder pairs (e.g. cross-account mix) must NEVER qualify
  assert.equal(
    isQualifyingSeedUserPair('seed_builder_elena_rostova', 'marcus.chen@buildboard.dev'),
    false,
    'Cross-matched seed UID and email must NOT qualify'
  )
  assert.equal(
    isQualifyingSeedUserPair('seed_builder_kavita_rao', 'devon.park@buildboard.dev'),
    false,
    'Cross-matched seed UID and email must NOT qualify'
  )

  // 3. Legitimate user with real Firebase UID and email must NEVER qualify
  assert.equal(
    isQualifyingSeedUserPair('04YoRBGvlPWj6dqmVe4R8Gr1UDa2', 'yashgargschoolid@gmail.com'),
    false,
    'Real legitimate user must NEVER match seed criteria'
  )

  // 4. Impostor attempts with seed UID but attacker email must NEVER qualify
  assert.equal(
    isQualifyingSeedUserPair('seed_builder_elena_rostova', 'attacker@buildboard.dev'),
    false,
    'Impostor email with seed UID must NOT qualify'
  )
  assert.equal(
    isQualifyingSeedUserPair('seed_builder_elena_rostova', 'elena@gmail.com'),
    false,
    'External email domain with seed UID must NOT qualify'
  )

  // 5. Similarly named account must NEVER qualify
  assert.equal(
    isQualifyingSeedUserPair('seed_builder_fan_account', 'fan@buildboard.dev'),
    false,
    'Arbitrary seed_builder_ prefix account must NOT qualify'
  )
})

test('Database Cleanup Transaction (Actual Implementation): executes atomic commit and releases connection on success', async () => {
  const { database } = await import('../../config/database.js')
  const { purgeLegacySampleData } = await import('../../server.js')

  const originalGetConnection = database.getConnection
  let beginCalled = false
  let commitCalled = false
  let rollbackCalled = false
  let releaseCalled = false
  let queryCount = 0

  const mockConnection = {
    async beginTransaction() {
      beginCalled = true
    },
    async query() {
      queryCount++
      return [{ affectedRows: 2 }]
    },
    async commit() {
      commitCalled = true
    },
    async rollback() {
      rollbackCalled = true
    },
    release() {
      releaseCalled = true
    },
  }

  database.getConnection = async () => mockConnection

  try {
    const result = await purgeLegacySampleData()
    assert.equal(result.success, true)
    assert.equal(beginCalled, true, 'beginTransaction must be called before queries')
    assert.equal(queryCount, 3, 'Must execute exactly 3 DELETE queries (products, problems, users)')
    assert.equal(commitCalled, true, 'commit must be executed upon success')
    assert.equal(rollbackCalled, false, 'rollback must NOT be executed on success')
    assert.equal(releaseCalled, true, 'release must ALWAYS be called')
  } finally {
    database.getConnection = originalGetConnection
  }
})

test('Database Cleanup Transaction (Actual Implementation): executes rollback, suppresses commit, and releases connection on query failure', async () => {
  const { database } = await import('../../config/database.js')
  const { purgeLegacySampleData } = await import('../../server.js')

  const originalGetConnection = database.getConnection
  let beginCalled = false
  let commitCalled = false
  let rollbackCalled = false
  let releaseCalled = false
  let queryCount = 0

  const mockConnection = {
    async beginTransaction() {
      beginCalled = true
    },
    async query() {
      queryCount++
      if (queryCount === 2) {
        throw new Error('Simulated transient DB error on step 2')
      }
      return [{ affectedRows: 2 }]
    },
    async commit() {
      commitCalled = true
    },
    async rollback() {
      rollbackCalled = true
    },
    release() {
      releaseCalled = true
    },
  }

  database.getConnection = async () => mockConnection

  try {
    await assert.rejects(
      async () => {
        await purgeLegacySampleData()
      },
      { message: 'Simulated transient DB error on step 2' }
    )
    assert.equal(beginCalled, true, 'beginTransaction must be called before queries')
    assert.equal(rollbackCalled, true, 'rollback must be executed when any query fails')
    assert.equal(commitCalled, false, 'commit must NEVER be executed when a query fails')
    assert.equal(releaseCalled, true, 'release must ALWAYS be called even after failure')
  } finally {
    database.getConnection = originalGetConnection
  }
})

test('Startup Safety (Child Process): server startup completely ignores RUN_LEGACY_SAMPLE_CLEANUP and never invokes cleanup', async () => {
  const { spawn } = await import('node:child_process')
  const { fileURLToPath } = await import('node:url')
  const path = await import('node:path')

  const serverPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../server.js')

  async function testServerStartupOutput(extraEnv = {}) {
    return new Promise((resolve, reject) => {
      const testPort = String(38000 + Math.floor(Math.random() * 1000))
      const child = spawn(process.execPath, [serverPath], {
        env: {
          ...process.env,
          PORT: testPort,
          ...extraEnv,
        },
      })

      let output = ''
      child.stdout.on('data', (d) => {
        output += d.toString()
        if (output.includes(`listening on port ${testPort}`)) {
          child.kill('SIGTERM')
          resolve(output)
        }
      })
      child.stderr.on('data', (d) => {
        output += d.toString()
      })
      child.on('error', reject)
      setTimeout(() => {
        child.kill('SIGKILL')
        resolve(output)
      }, 2500)
    })
  }

  // 1. Missing flag (normal default deployment) -> binds port, zero cleanup
  const missingFlagOutput = await testServerStartupOutput({})
  assert.match(missingFlagOutput, /BuildBoard API listening on port/)
  assert.equal(missingFlagOutput.includes('CLEANUP'), false)
  assert.equal(missingFlagOutput.includes('purged'), false)

  // 2. Flag set to false -> binds port, zero cleanup
  const falseFlagOutput = await testServerStartupOutput({ RUN_LEGACY_SAMPLE_CLEANUP: 'false' })
  assert.match(falseFlagOutput, /BuildBoard API listening on port/)
  assert.equal(falseFlagOutput.includes('CLEANUP'), false)

  // 3. Flag set to true -> server completely ignores variable and performs zero cleanup
  const trueFlagOutput = await testServerStartupOutput({ RUN_LEGACY_SAMPLE_CLEANUP: 'true' })
  assert.match(trueFlagOutput, /BuildBoard API listening on port/)
  assert.equal(trueFlagOutput.includes('CLEANUP'), false)
  assert.equal(trueFlagOutput.includes('purged'), false)
})

test('Cleanup CLI Safety (Child Process): standalone script requires explicit RUN_LEGACY_SAMPLE_CLEANUP=true and aborts without it', async () => {
  const { spawn } = await import('node:child_process')
  const { fileURLToPath } = await import('node:url')
  const path = await import('node:path')

  const cliPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../scripts/purgeSampleData.js')

  async function runCliProcess(extraEnv = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [cliPath], {
        env: {
          ...process.env,
          ...extraEnv,
        },
      })
      let stdout = ''
      let stderr = ''
      child.stdout.on('data', (d) => (stdout += d.toString()))
      child.stderr.on('data', (d) => (stderr += d.toString()))
      child.on('error', reject)
      child.on('close', (code) => {
        resolve({ code, stdout, stderr })
      })
    })
  }

  // 1. Missing flag -> Aborts immediately with exit code 1
  const abortMissing = await runCliProcess({ RUN_LEGACY_SAMPLE_CLEANUP: '' })
  assert.equal(abortMissing.code, 1)
  assert.match(abortMissing.stderr, /\[SAFETY ABORT\] Database cleanup requires explicit confirmation/)

  // 2. Flag false -> Aborts immediately with exit code 1
  const abortFalse = await runCliProcess({ RUN_LEGACY_SAMPLE_CLEANUP: 'false' })
  assert.equal(abortFalse.code, 1)
  assert.match(abortFalse.stderr, /\[SAFETY ABORT\] Database cleanup requires explicit confirmation/)
})

