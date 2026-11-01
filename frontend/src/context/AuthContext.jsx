/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { firebaseAuth } from '../lib/firebase.js'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001').replace(/\/$/, '')

async function syncUserWithApi(firebaseUser) {
  const token = await firebaseUser.getIdToken()
  let response
  try {
    response = await fetch(`${apiBaseUrl}/api/auth/me`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    throw new Error('Could not reach the BuildBoard API. Start the backend and check its MySQL connection.')
  }
  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(result.error || 'Could not connect your account to BuildBoard.')
  }

  return result.user
}

function toAppUser(firebaseUser, databaseUser = null) {
  return {
    uid: firebaseUser.uid,
    id: databaseUser?.id ?? null,
    email: firebaseUser.email,
    emailVerified: firebaseUser.emailVerified,
    displayName: firebaseUser.displayName || '',
  }
}

function authError(code, fallback) {
  const messages = {
    'auth/email-already-in-use': 'An account already exists for this email. Try signing in instead.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/user-not-found': 'No account was found for this email.',
    'auth/wrong-password': 'Email or password is incorrect.',
    'auth/weak-password': 'Choose a stronger password with at least 8 characters.',
    'auth/too-many-requests': 'Too many attempts. Wait a little and try again.',
    'auth/network-request-failed': 'Could not reach Firebase. Check your internet connection and try again.',
    'auth/operation-not-allowed': 'Email and password sign-in is not enabled for this Firebase project.',
    'auth/email-not-verified': 'We sent a verification link. Verify your email, then sign in again.',
  }

  return messages[code] || fallback || 'Authentication failed. Please try again.'
}

export function getAuthErrorMessage(error) {
  return authError(error?.code, error?.message)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!active) return
      if (!firebaseUser) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        await firebaseUser.reload()
        if (!firebaseUser.emailVerified) {
          if (active) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        const databaseUser = await syncUserWithApi(firebaseUser)
        if (active) setUser(toAppUser(firebaseUser, databaseUser))
      } catch (error) {
        console.error('Could not restore BuildBoard account session:', error)
        await firebaseSignOut(firebaseAuth).catch(() => {})
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    await setPersistence(firebaseAuth, browserLocalPersistence)
    const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password)
    await credential.user.reload()

    if (!credential.user.emailVerified) {
      await sendEmailVerification(credential.user, {
        url: `${window.location.origin}/verify-email?email=${encodeURIComponent(credential.user.email || email)}`,
      }).catch(() => {})
      await firebaseSignOut(firebaseAuth)
      const error = new Error('Email verification is required.')
      error.code = 'auth/email-not-verified'
      throw error
    }

    try {
      const databaseUser = await syncUserWithApi(credential.user)
      const appUser = toAppUser(credential.user, databaseUser)
      setUser(appUser)
      return appUser
    } catch (error) {
      await firebaseSignOut(firebaseAuth)
      throw error
    }
  }

  const signUp = async (email, password) => {
    await setPersistence(firebaseAuth, browserLocalPersistence)
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password)

    try {
      await sendEmailVerification(credential.user, {
        url: `${window.location.origin}/verify-email?email=${encodeURIComponent(credential.user.email || email)}`,
      })
    } finally {
      await firebaseSignOut(firebaseAuth)
    }

    return { email: credential.user.email || email.trim() }
  }

  const resendVerificationEmail = async (email, password) => {
    const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password)
    try {
      if (credential.user.emailVerified) {
        throw new Error('This email is already verified. Sign in to continue.')
      }
      await sendEmailVerification(credential.user, {
        url: `${window.location.origin}/verify-email?email=${encodeURIComponent(credential.user.email || email)}`,
      })
    } finally {
      await firebaseSignOut(firebaseAuth)
    }
  }

  const resetPassword = (email) => sendPasswordResetEmail(firebaseAuth, email.trim())
  const signOut = () => firebaseSignOut(firebaseAuth)

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, resendVerificationEmail, resetPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

