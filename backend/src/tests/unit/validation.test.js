import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isValidHttpUrl,
  validateAllowedFields,
  sanitizeStringArray,
  slugify,
  validateProfile,
} from '../../utils/validation.js'
import { isValidUsername } from '../../utils/username.js'

test('Validation: isValidHttpUrl allows valid http and https URLs', () => {
  assert.equal(isValidHttpUrl('https://example.com'), true)
  assert.equal(isValidHttpUrl('http://localhost:3000/app'), true)
  assert.equal(isValidHttpUrl('https://sub.domain.co.uk/path?q=1#frag'), true)
})

test('Validation: isValidHttpUrl rejects unsafe, malformed, or oversized URLs', () => {
  assert.equal(isValidHttpUrl('javascript:alert(1)'), false)
  assert.equal(isValidHttpUrl('ftp://example.com'), false)
  assert.equal(isValidHttpUrl('data:text/html,test'), false)
  assert.equal(isValidHttpUrl('file:///etc/passwd'), false)
  assert.equal(isValidHttpUrl('not-a-url'), false)
  assert.equal(isValidHttpUrl(''), false)
  assert.equal(isValidHttpUrl(null), false)
  assert.equal(isValidHttpUrl(undefined), false)
  // Exceeding 500 characters
  const longUrl = 'https://example.com/' + 'a'.repeat(500)
  assert.equal(isValidHttpUrl(longUrl), false)
})

test('Validation: validateAllowedFields rejects unexpected and server-controlled keys', () => {
  const allowed = new Set(['name', 'tagline', 'productUrl'])
  
  // Valid subset
  assert.equal(validateAllowedFields({ name: 'App', tagline: 'Test' }, allowed), null)
  
  // Forbidden / unexpected fields
  assert.match(
    validateAllowedFields({ name: 'App', creator_id: 123 }, allowed, 'product') || '',
    /Field 'creator_id' is not permitted/
  )
  assert.match(
    validateAllowedFields({ name: 'App', is_sample: true }, allowed, 'product') || '',
    /Field 'is_sample' is not permitted/
  )
  assert.match(
    validateAllowedFields({ name: 'App', views_count: 999 }, allowed, 'product') || '',
    /Field 'views_count' is not permitted/
  )
  assert.match(
    validateAllowedFields({ name: 'App', id: 'hack' }, allowed, 'product') || '',
    /Field 'id' is not permitted/
  )

  // Non-objects
  assert.match(validateAllowedFields(null, allowed, 'test') || '', /Send a valid JSON object/)
  assert.match(validateAllowedFields([1, 2], allowed, 'test') || '', /Send a valid JSON object/)
})

test('Validation: slugify normalizes text into URL-safe slugs', () => {
  assert.equal(slugify('Hello World! 2026'), 'hello-world-2026')
  assert.equal(slugify('  My Product --- Live Demo! '), 'my-product-live-demo')
  assert.equal(slugify('AI & Machine Learning: Beta v1'), 'ai-machine-learning-beta-v1')
  assert.equal(slugify('---test---'), 'test')
})

test('Validation: sanitizeStringArray filters, trims, and deduplicates', () => {
  const input = ['  Design ', 'Engineering', 'Design', ' ', 123, null, 'Product Management']
  const clean = sanitizeStringArray(input, 5, 50)
  assert.deepEqual(clean, ['Design', 'Engineering', 'Product Management'])

  // Truncates array beyond maxItems
  const overflow = ['a', 'b', 'c', 'd', 'e', 'f']
  assert.equal(sanitizeStringArray(overflow, 3, 10).length, 3)

  // Discards items exceeding maxLength
  const tooLong = ['short', 'a'.repeat(200)]
  assert.deepEqual(sanitizeStringArray(tooLong, 10, 50), ['short'])
})

test('Validation: isValidUsername enforces strict format constraints', () => {
  // Valid usernames (3-30 chars, lowercase letters, numbers, hyphens, underscores)
  assert.equal(isValidUsername('builder'), true)
  assert.equal(isValidUsername('dev_123'), true)
  assert.equal(isValidUsername('super-tester-42'), true)
  assert.equal(isValidUsername('abc'), true)

  // Invalid: too short or too long
  assert.equal(isValidUsername('ab'), false)
  assert.equal(isValidUsername('a'.repeat(31)), false)

  // Invalid characters
  assert.equal(isValidUsername('User_Name'), false) // Uppercase not allowed in canonical username
  assert.equal(isValidUsername('user@domain'), false)
  assert.equal(isValidUsername('user name'), false)
  assert.equal(isValidUsername('user.name'), false)
  assert.equal(isValidUsername('<script>'), false)
  assert.equal(isValidUsername(''), false)
})

test('Validation: validateProfile ignores client metadata and validates allowed fields', () => {
  // Ignored metadata should not trigger "Field 'email' is not allowed" error
  const profileWithMeta = {
    displayName: 'Builder Jane',
    username: 'builder_jane',
    bio: 'Building open-source tools',
    interests: ['AI & Machine Learning'],
    email: 'jane@example.com',
    updatedAt: '2026-11-03T20:00:00Z',
    createdAt: '2026-11-01T10:00:00Z',
    isServerSynced: true,
    id: 123,
    userId: 123,
    user_id: 123,
  }

  const { profile, error } = validateProfile(profileWithMeta)
  assert.equal(error, undefined)
  assert.equal(profile.displayName, 'Builder Jane')
  assert.equal(profile.username, 'builder_jane')
  assert.equal(profile.bio, 'Building open-source tools')
  assert.deepEqual(profile.interests, ['AI & Machine Learning'])
  assert.equal(profile.email, undefined)
  assert.equal(profile.updatedAt, undefined)
  assert.equal(profile.isServerSynced, undefined)

  // Truly invalid fields must still be rejected
  const malicious = {
    displayName: 'Attacker',
    unauthorizedField: 'malicious-payload',
  }
  const result = validateProfile(malicious)
  assert.match(result.error, /Field 'unauthorizedField' is not allowed in profile/)
})

