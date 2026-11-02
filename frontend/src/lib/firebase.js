import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const requiredConfig = ['apiKey', 'authDomain', 'projectId', 'appId']
const missingConfig = requiredConfig.filter((key) => !firebaseConfig[key])

export const isFirebaseConfigured = missingConfig.length === 0

if (!isFirebaseConfigured) {
  if (import.meta.env.PROD) {
    throw new Error(
      `[BuildBoard Production Error] Firebase configuration is missing: ${missingConfig.join(', ')}. Deployment requires valid Firebase environment variables.`
    )
  }
  console.warn(
    `[BuildBoard] Firebase configuration is incomplete (${missingConfig.join(', ')}). Running in demo auth mode (development only).`
  )
}

export const firebaseApp = isFirebaseConfigured
  ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig))
  : null

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null
