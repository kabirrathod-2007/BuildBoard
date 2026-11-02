import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { app } from '../../server.js'
import { database } from '../../config/database.js'
import { setTokenVerifierForTesting, resetTokenVerifierForTesting } from '../../middleware/requireAuth.js'

function createTestToken({ uid, email, displayName, emailVerified = true }) {
  const payload = { uid, email, displayName, email_verified: emailVerified }
  return 'test-auth:' + Buffer.from(JSON.stringify(payload)).toString('base64')
}

// Only execute full database integration tests when explicitly enabled
// (disposable CI MySQL service container via RUN_INTEGRATION_TESTS=true).
// This guarantees local runs NEVER modify the developer's personal database.
const shouldRun = process.env.RUN_INTEGRATION_TESTS === 'true'

test('Integration Test Suite (Disposable MySQL Container)', { skip: !shouldRun }, async (t) => {
  let server
  let baseUrl

  // Setup reliable cleanup hook regardless of assertion outcome
  t.after(async () => {
    resetTokenVerifierForTesting()
    if (server) {
      await new Promise((resolve) => server.close(resolve))
    }
    if (database) {
      await database.end().catch(() => {})
    }
  })

  // Inject test token verifier safely for test suite
  setTokenVerifierForTesting(async (token) => {
    if (!token.startsWith('test-auth:')) return null
    try {
      const json = Buffer.from(token.slice('test-auth:'.length), 'base64').toString('utf8')
      return JSON.parse(json)
    } catch {
      return null
    }
  })

  // Start ephemeral server on random available port
  await new Promise((resolve) => {
    server = http.createServer(app)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      baseUrl = `http://127.0.0.1:${port}`
      resolve()
    })
  })

  // Helper for requests
  async function api(path, options = {}) {
    const url = `${baseUrl}${path}`
    const headers = {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    }
    const res = await fetch(url, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })
    const data = await res.json().catch(() => null)
    return { status: res.status, data, headers: res.headers }
  }

  // Setup test identities
  const makerUser = {
    uid: 'ci-maker-' + Date.now(),
    email: 'ci-maker@example.com',
    displayName: 'CI Maker',
  }
  const testerOne = {
    uid: 'ci-tester-1-' + Date.now(),
    email: 'ci-tester-1@example.com',
    displayName: 'CI Tester One',
  }
  const testerTwo = {
    uid: 'ci-tester-2-' + Date.now(),
    email: 'ci-tester-2@example.com',
    displayName: 'CI Tester Two',
  }
  const intruderUser = {
    uid: 'ci-intruder-' + Date.now(),
    email: 'ci-intruder@example.com',
    displayName: 'CI Intruder',
  }

  const makerToken = createTestToken(makerUser)
  const testerOneToken = createTestToken(testerOne)
  const testerTwoToken = createTestToken(testerTwo)
  const intruderToken = createTestToken(intruderUser)

  // Sync users to disposable database
  await api('/api/auth/me', { method: 'POST', token: makerToken })
  await api('/api/auth/me', { method: 'POST', token: testerOneToken })
  await api('/api/auth/me', { method: 'POST', token: testerTwoToken })
  await api('/api/auth/me', { method: 'POST', token: intruderToken })

  let testProductSlug = null
  let testProductId = null
  let testProblemSlug = null

  await t.test('1. Unauthenticated requests cannot perform protected writes', async () => {
    const resProduct = await api('/api/products', {
      method: 'POST',
      body: { name: 'Unauthorized App', tagline: 'Should fail' },
    })
    assert.equal(resProduct.status, 401)
    assert.equal(resProduct.data?.error, 'Sign in to continue.')

    const resProblem = await api('/api/problems', {
      method: 'POST',
      body: { title: 'Unauthorized Problem', statement: 'Should fail' },
    })
    assert.equal(resProblem.status, 401)
  })

  await t.test('2. Public product & problem responses do not expose private emails or gated URLs', async () => {
    // Maker creates product with private product_url
    const createRes = await api('/api/products', {
      method: 'POST',
      token: makerToken,
      body: {
        name: 'CI Secure Cloud Tool',
        tagline: 'Developer tool for CI testing verification',
        description: 'Comprehensive prototype testing verification.',
        stage: 'Working prototype',
        audience: 'DevOps & Backend Engineers',
        feedbackRequest: 'Verify that prototype link gating works correctly.',
        productUrl: 'https://staging.internal.corp/secret-prototype-demo',
        githubUrl: 'https://github.com/example/ci-tool',
        categories: ['Developer Tools'],
        targetRoles: ['Full Stack Developer'],
        targetIndustries: ['Software Infrastructure'],
        targetTechnologies: ['Node.js', 'MySQL'],
        whatToTry: ['Test gating', 'Verify quota'],
        enrollmentLimit: 1,
      },
    })

    assert.equal(createRes.status, 201)
    testProductSlug = createRes.data?.product?.slug
    testProductId = createRes.data?.product?.id
    assert.ok(testProductSlug)

    // Unauthenticated GET: productUrl must be null, creator email must be absent
    const publicRes = await api(`/api/products/${testProductSlug}`)
    assert.equal(publicRes.status, 200)
    assert.equal(publicRes.data?.product?.productUrl, null)
    assert.equal(publicRes.data?.product?.creatorEmail, undefined)
    assert.equal(publicRes.data?.product?.maker, 'CI Maker')

    // Maker (authenticated owner) GET: productUrl is visible
    const ownerRes = await api(`/api/products/${testProductSlug}`, { token: makerToken })
    assert.equal(ownerRes.status, 200)
    assert.equal(ownerRes.data?.product?.productUrl, 'https://staging.internal.corp/secret-prototype-demo')
  })

  await t.test('3. Object-level ownership checks reject a different user', async () => {
    // Intruder tries to modify Maker's product
    const editRes = await api(`/api/products/${testProductSlug}`, {
      method: 'PUT',
      token: intruderToken,
      body: {
        name: 'Hacked Product Name',
        tagline: 'Should be forbidden',
        description: 'Should be forbidden',
        audience: 'Anyone',
        feedbackRequest: 'Verify forbidden',
        productUrl: 'https://attacker.example.com',
        stage: 'Working prototype',
        categories: ['Developer Tools'],
        whatToTry: ['Attempt unauthorized update'],
      },
    })
    assert.equal(editRes.status, 403)
    assert.match(editRes.data?.error, /creator can edit/i)

    // Intruder tries to pause Maker's product
    const pauseRes = await api(`/api/products/${testProductSlug}/pause`, {
      method: 'PATCH',
      token: intruderToken,
      body: { enrollmentPaused: true },
    })
    assert.equal(pauseRes.status, 403)

    // Intruder tries to delete Maker's product
    const deleteRes = await api(`/api/products/${testProductSlug}`, {
      method: 'DELETE',
      token: intruderToken,
    })
    assert.equal(deleteRes.status, 403)
  })

  await t.test('4. Enrollment quota, duplicate enrollment, and pause behavior', async () => {
    // Maker tries to self-enroll (Must be rejected with 400)
    const selfEnroll = await api(`/api/products/${testProductSlug}/enroll`, {
      method: 'POST',
      token: makerToken,
    })
    assert.equal(selfEnroll.status, 400)

    // Tester One enrolls (Slot 1 of 1 allocated)
    const enrollOne = await api(`/api/products/${testProductSlug}/enroll`, {
      method: 'POST',
      token: testerOneToken,
    })
    assert.equal(enrollOne.status, 201)

    // Enrolled Tester One can now see the prototype URL
    const testerView = await api(`/api/products/${testProductSlug}`, { token: testerOneToken })
    assert.equal(testerView.data?.product?.productUrl, 'https://staging.internal.corp/secret-prototype-demo')
    assert.equal(testerView.data?.product?.isEnrolled, true)

    // Duplicate enrollment attempt by Tester One is idempotent (200, no duplicate rows)
    const dupEnroll = await api(`/api/products/${testProductSlug}/enroll`, {
      method: 'POST',
      token: testerOneToken,
    })
    assert.equal(dupEnroll.status, 200)
    assert.equal(dupEnroll.data?.enrolled, true)

    // Maker pauses enrollment
    const pauseRes = await api(`/api/products/${testProductSlug}/pause`, {
      method: 'PATCH',
      token: makerToken,
      body: { enrollmentPaused: true },
    })
    assert.equal(pauseRes.status, 200)

    // Existing enrolled tester still retains access while enrollment is paused
    const testerPausedView = await api(`/api/products/${testProductSlug}`, { token: testerOneToken })
    assert.equal(testerPausedView.data?.product?.productUrl, 'https://staging.internal.corp/secret-prototype-demo')

    // Tester Two attempts to enroll while paused (rejected 409)
    const pausedEnroll = await api(`/api/products/${testProductSlug}/enroll`, {
      method: 'POST',
      token: testerTwoToken,
    })
    assert.equal(pausedEnroll.status, 409)
    assert.match(pausedEnroll.data?.error, /paused/i)

    // Maker unpauses enrollment
    await api(`/api/products/${testProductSlug}/pause`, {
      method: 'PATCH',
      token: makerToken,
      body: { enrollmentPaused: false },
    })

    // Tester Two attempts to enroll when quota is full (limit = 1, current = 1) (rejected 409)
    const fullEnroll = await api(`/api/products/${testProductSlug}/enroll`, {
      method: 'POST',
      token: testerTwoToken,
    })
    assert.equal(fullEnroll.status, 409)
    assert.equal(fullEnroll.data?.quotaFull, true)
  })

  await t.test('5. Concurrent requests competing for the final enrollment slot cannot overbook', async () => {
    // Create product with limit = 1 and 0 enrollments
    const raceProduct = await api('/api/products', {
      method: 'POST',
      token: makerToken,
      body: {
        name: 'Atomic Race Test Product',
        tagline: 'Verifying row-locking under concurrent load',
        description: 'Simultaneous enrollment requests.',
        stage: 'Working prototype',
        audience: 'Testers',
        feedbackRequest: 'Verify concurrency',
        productUrl: 'https://staging.internal.corp/race-demo',
        categories: ['Developer Tools'],
        targetRoles: ['Full Stack Developer'],
        targetIndustries: ['Software Infrastructure'],
        targetTechnologies: ['Node.js'],
        whatToTry: ['Race concurrency'],
        enrollmentLimit: 1,
      },
    })
    const raceSlug = raceProduct.data?.product?.slug
    const raceId = raceProduct.data?.product?.id
    assert.ok(raceSlug)

    // Provision 4 competing tester accounts
    const competitors = await Promise.all(
      [1, 2, 3, 4].map(async (i) => {
        const user = {
          uid: `ci-race-${i}-${Date.now()}`,
          email: `ci-race-${i}@example.com`,
          displayName: `Competitor ${i}`,
        }
        const token = createTestToken(user)
        await api('/api/auth/me', { method: 'POST', token })
        return token
      }),
    )

    // Fire 4 simultaneous enrollment requests
    const raceResponses = await Promise.all(
      competitors.map((token) =>
        api(`/api/products/${raceSlug}/enroll`, { method: 'POST', token }),
      ),
    )

    const successes = raceResponses.filter((r) => r.status === 201)
    const rejectedFull = raceResponses.filter((r) => r.status === 409 && r.data?.quotaFull === true)

    assert.equal(successes.length, 1, 'Exactly 1 concurrent request must win the final slot')
    assert.equal(rejectedFull.length, 3, 'The remaining 3 concurrent requests must receive 409 quota full')

    // Verify database row count is strictly 1
    const [dbRows] = await database.execute(
      'SELECT COUNT(*) AS total FROM product_enrollments WHERE product_id = ?',
      [raceId],
    )
    assert.equal(Number(dbRows[0].total), 1)
  })

  await t.test('6. Problem comments and solutions enforce expected schema and URL gating', async () => {
    // Maker creates problem
    const probRes = await api('/api/problems', {
      method: 'POST',
      token: makerToken,
      body: {
        title: 'CI Automated Problem Hub Topic',
        statement: 'Verifying end-to-end Problem Hub discussion threads and solution gating.',
        workarounds: 'Manual checks',
        targetAudience: 'Engineers',
        proposedConcept: 'Automated CI verification',
        category: 'Developer Tools',
        targetRoles: ['Full Stack Developer'],
        targetIndustries: ['Software Infrastructure'],
      },
    })
    assert.equal(probRes.status, 201)
    testProblemSlug = probRes.data?.problem?.slug

    // Tester One posts a comment
    const commentRes = await api(`/api/problems/${testProblemSlug}/comments`, {
      method: 'POST',
      token: testerOneToken,
      body: { text: 'Automated comment from Tester One' },
    })
    assert.equal(commentRes.status, 201)
    assert.equal(commentRes.data?.comment?.text, 'Automated comment from Tester One')
    assert.equal(commentRes.data?.comment?.authorName, 'CI Tester One')

    // Maker links product as solution
    const solRes = await api(`/api/problems/${testProblemSlug}/solutions`, {
      method: 'POST',
      token: makerToken,
      body: {
        productId: testProductId,
        title: 'CI Secure Solution',
        description: 'Linked solution to test gated prototype URL visibility',
      },
    })
    assert.equal(solRes.status, 201)

    // Unauthenticated user views problem: solution.productUrl must be NULL
    const anonProblem = await api(`/api/problems/${testProblemSlug}`)
    assert.equal(anonProblem.status, 200)
    assert.equal(anonProblem.data?.problem?.creatorEmail, undefined)
    const anonSolution = anonProblem.data?.problem?.solutions?.[0]
    assert.equal(anonSolution?.productUrl, null, 'Unauthenticated user cannot see gated solution URL')

    // Enrolled Tester One views problem: solution.productUrl is UNMASKED
    const enrolledProblem = await api(`/api/problems/${testProblemSlug}`, { token: testerOneToken })
    const enrolledSolution = enrolledProblem.data?.problem?.solutions?.[0]
    assert.equal(
      enrolledSolution?.productUrl,
      'https://staging.internal.corp/secret-prototype-demo',
      'Enrolled tester can view prototype URL on linked solution',
    )
  })

  await t.test('7. API database account has least-privilege DML and is rejected for DDL', async () => {
    // When running with the restricted runtime user (e.g. test_api_runner in CI),
    // any DDL statement like CREATE TABLE or DROP TABLE must be rejected by MySQL.
    if (process.env.DB_USER !== 'root') {
      await assert.rejects(
        async () => {
          await database.query('CREATE TABLE ddl_exploit_test (id INT PRIMARY KEY)')
        },
        (err) => {
          assert.ok(
            err.code === 'ER_TABLEACCESS_DENIED_ERROR' ||
            err.code === 'ER_SPECIFIC_ACCESS_DENIED_ERROR' ||
            err.code === 'ER_DBACCESS_DENIED_ERROR' ||
            /command denied/i.test(err.message),
            `Expected DDL access denied error, got: ${err.code} - ${err.message}`
          )
          return true
        },
        'Runtime database connection must not possess DDL privileges'
      )
    }
  })
})
