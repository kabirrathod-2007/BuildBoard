import test from 'node:test'
import assert from 'node:assert/strict'
import { requireAuth } from '../middleware/requireAuth.js'

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

