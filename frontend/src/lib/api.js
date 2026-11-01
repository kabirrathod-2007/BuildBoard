import { firebaseAuth, isFirebaseConfigured } from './firebase.js'

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001').replace(/\/$/, '')

async function getAuthHeader() {
  if (!isFirebaseConfigured || !firebaseAuth?.currentUser) {
    return {}
  }
  const token = await firebaseAuth.currentUser.getIdToken()
  return { Authorization: `Bearer ${token}` }
}

export async function request(endpoint, options = {}) {
  const authHeaders = await getAuthHeader()
  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...(options.headers || {}),
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })
  } catch {
    throw new Error('Could not reach the BuildBoard API. Make sure the backend server is running.')
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data.error || `Request failed with status ${response.status}`)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export async function fetchUserProfile() {
  if (!isFirebaseConfigured || !firebaseAuth?.currentUser) {
    return { profile: null, updatedAt: null, isLocalDemo: true }
  }
  return request('/api/profiles/me', { method: 'GET' })
}

export async function saveUserProfile(profile) {
  if (!isFirebaseConfigured || !firebaseAuth?.currentUser) {
    return { profile, updatedAt: new Date().toISOString(), isLocalDemo: true }
  }
  return request('/api/profiles/me', {
    method: 'PUT',
    body: JSON.stringify({ profile }),
  })
}

export async function checkUsernameAvailability(username) {
  if (!username) return { available: false, error: 'Username is required.' }
  return request(`/api/profiles/check-username?username=${encodeURIComponent(username)}`, {
    method: 'GET',
  })
}

export async function fetchProducts(options = {}) {
  const params = new URLSearchParams()
  if (options.category && options.category !== 'All') {
    params.set('category', options.category)
  }
  if (options.creator) {
    params.set('creator', options.creator)
  }
  const queryString = params.toString() ? `?${params.toString()}` : ''
  return request(`/api/products${queryString}`, { method: 'GET' })
}

export async function fetchProduct(slugOrId) {
  return request(`/api/products/${encodeURIComponent(slugOrId)}`, { method: 'GET' })
}

export async function createProductListing(productData) {
  return request('/api/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  })
}

export async function updateProductListing(slugOrId, productData) {
  return request(`/api/products/${encodeURIComponent(slugOrId)}`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  })
}

export async function toggleProductPause(slugOrId, enrollmentPaused) {
  return request(`/api/products/${encodeURIComponent(slugOrId)}/pause`, {
    method: 'PATCH',
    body: JSON.stringify(
      typeof enrollmentPaused === 'boolean' ? { enrollmentPaused } : {}
    ),
  })
}

export async function deleteProductListing(slugOrId) {
  return request(`/api/products/${encodeURIComponent(slugOrId)}`, {
    method: 'DELETE',
  })
}

export async function enrollInProductApi(slugOrId) {
  return request(`/api/products/${encodeURIComponent(slugOrId)}/enroll`, {
    method: 'POST',
  })
}

export async function unenrollFromProductApi(slugOrId) {
  return request(`/api/products/${encodeURIComponent(slugOrId)}/enroll`, {
    method: 'DELETE',
  })
}

export async function fetchProductEnrollmentStatus(slugOrId) {
  return request(`/api/products/${encodeURIComponent(slugOrId)}/enrollment`, {
    method: 'GET',
  })
}

export async function fetchMyEnrollments() {
  return request('/api/enrollments/me', {
    method: 'GET',
  })
}

export async function submitProductFeedback(slugOrId, feedbackData) {
  return request(`/api/products/${encodeURIComponent(slugOrId)}/feedback`, {
    method: 'POST',
    body: JSON.stringify(feedbackData),
  })
}

export async function fetchProductFeedback(slugOrId) {
  return request(`/api/products/${encodeURIComponent(slugOrId)}/feedback`, {
    method: 'GET',
  })
}

export async function replyToFeedbackApi(feedbackId, text) {
  return request(`/api/feedback/${encodeURIComponent(feedbackId)}/reply`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  })
}

export async function toggleFeedbackHelpfulApi(feedbackId) {
  return request(`/api/feedback/${encodeURIComponent(feedbackId)}/helpful`, {
    method: 'PATCH',
  })
}

export async function fetchMyFeedback() {
  return request('/api/feedback/me', {
    method: 'GET',
  })
}

// ----------------------------------------------------------------------
// Problems API Methods
// ----------------------------------------------------------------------

export async function fetchProblems(params = {}) {
  const query = new URLSearchParams()
  if (params.category && params.category !== 'All') query.set('category', params.category)
  if (params.stage && params.stage !== 'All') query.set('stage', params.stage)
  if (params.role) query.set('role', params.role)
  if (params.industry) query.set('industry', params.industry)
  if (params.search) query.set('search', params.search)

  const queryString = query.toString()
  const endpoint = queryString ? `/api/problems?${queryString}` : '/api/problems'
  return request(endpoint, { method: 'GET' })
}

export async function fetchProblemDetails(slugOrId) {
  return request(`/api/problems/${encodeURIComponent(slugOrId)}`, {
    method: 'GET',
  })
}

export async function createProblemApi(data) {
  return request('/api/problems', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteProblemApi(slugOrId) {
  return request(`/api/problems/${encodeURIComponent(slugOrId)}`, {
    method: 'DELETE',
  })
}

export async function toggleProblemValidationApi(slugOrId) {
  return request(`/api/problems/${encodeURIComponent(slugOrId)}/validate`, {
    method: 'POST',
  })
}

export async function toggleProblemTesterSignupApi(slugOrId) {
  return request(`/api/problems/${encodeURIComponent(slugOrId)}/tester-signup`, {
    method: 'POST',
  })
}

export async function addProblemCommentApi(slugOrId, commentData) {
  return request(`/api/problems/${encodeURIComponent(slugOrId)}/comments`, {
    method: 'POST',
    body: JSON.stringify(commentData),
  })
}

export async function attachProblemSolutionApi(slugOrId, solutionData) {
  return request(`/api/problems/${encodeURIComponent(slugOrId)}/solutions`, {
    method: 'POST',
    body: JSON.stringify(solutionData),
  })
}



