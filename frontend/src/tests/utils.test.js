import test from 'node:test'
import assert from 'node:assert/strict'
import { getRecommendedProducts } from '../utils/recommendations.js'
import { getFeedbackReminderInfo } from '../utils/feedbackReminder.js'

test('Recommendations: returns empty array when profile has no matching preferences', () => {
  const products = [
    { id: '1', categories: ['AI & Machine Learning'], targetRoles: ['Frontend Engineer'] },
  ]
  const emptyProfile = { interests: [], roles: [], industries: [], technologies: [] }
  assert.deepEqual(getRecommendedProducts(products, emptyProfile), [])
  assert.deepEqual(getRecommendedProducts(products, null), [])
})

test('Recommendations: calculates deterministic match scores and reasons', () => {
  const products = [
    {
      id: 'prod-ai',
      name: 'AI Code Assist',
      categories: ['Developer Tools', 'AI & Machine Learning'],
      targetRoles: ['Frontend Engineer'],
      targetIndustries: ['SaaS / B2B'],
      targetTechnologies: ['React', 'TypeScript'],
    },
    {
      id: 'prod-fintech',
      name: 'Crypto Vault',
      categories: ['Fintech'],
      targetRoles: ['Security Engineer'],
      targetIndustries: ['Finance'],
      targetTechnologies: ['Rust'],
    },
  ]

  const userProfile = {
    interests: ['AI & Machine Learning'],
    roles: ['Frontend Engineer'],
    industries: ['SaaS / B2B'],
    technologies: ['React'],
  }

  const results = getRecommendedProducts(products, userProfile)
  assert.equal(results.length, 1)
  assert.equal(results[0].product.id, 'prod-ai')
  assert.equal(results[0].score >= 4, true)
  assert.equal(results[0].reasons.length >= 3, true)
})

test('Feedback Reminders: handles valid and missing enrollment dates without false claims', () => {
  const mockProduct = {
    name: 'DevTool',
    feedbackRequest: 'core editor latency',
    whatToTry: ['Run a benchmark'],
  }

  // Missing enrollment date
  const missing = getFeedbackReminderInfo(null, mockProduct)
  assert.equal(missing.hasElapsed, false)
  assert.match(missing.body, /core editor latency/)

  // Recent enrollment (< 24 hours)
  const recentDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  const recent = getFeedbackReminderInfo(recentDate, mockProduct)
  assert.equal(recent.hasElapsed, true)
  assert.equal(recent.badge, 'Enrolled recently')

  // Multi-day enrollment (> 48 hours)
  const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  const past = getFeedbackReminderInfo(pastDate, mockProduct)
  assert.equal(past.hasElapsed, true)
  assert.match(past.badge, /3 days ago/)
})
