import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const projectId = process.env.FIREBASE_PROJECT_ID || (process.env.NODE_ENV === 'test' ? 'test-buildboard' : null)

if (!projectId) {
  throw new Error('[BuildBoard Config Error] FIREBASE_PROJECT_ID is required in environment variables.')
}

let firebaseApp
try {
  firebaseApp = getApps()[0] || initializeApp({
    credential: applicationDefault(),
    projectId,
  })
} catch (error) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`[BuildBoard Config Error] Failed to initialize Firebase Admin SDK in production: ${error.message}`)
  }
  console.warn(`[BuildBoard Server] Firebase Admin SDK initialization warning: ${error.message}`)
}

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null
