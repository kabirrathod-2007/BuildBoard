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
