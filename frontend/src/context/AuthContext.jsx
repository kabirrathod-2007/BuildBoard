/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  confirmPasswordReset,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  verifyPasswordResetCode,
} from 'firebase/auth'
import { firebaseAuth, isFirebaseConfigured } from '../lib/firebase.js'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001').replace(/\/$/, '')
const DEMO_STORAGE_KEY = 'buildboard_demo_auth_user'

async function syncUserWithApi(firebaseUser, extraData = {}) {
  const token = await firebaseUser.getIdToken()
  let response
  try {
    response = await fetch(`${apiBaseUrl}/api/auth/me`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        displayName: firebaseUser.displayName || '',
        ...extraData,
      }),
    })
  } catch (err) {
    console.error(`[BuildBoard Auth] Failed to sync user at ${apiBaseUrl}/api/auth/me:`, err)
    throw new Error('Could not reach the BuildBoard API. Start the backend and check its MySQL connection.', { cause: err })
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
    displayName: databaseUser?.displayName || firebaseUser.displayName || '',
    username: databaseUser?.username || '',
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
    'auth/invalid-action-code': 'This password reset link is invalid or has expired. Please request a new one.',
    'auth/expired-action-code': 'This password reset link has expired. Please request a new one.',
    'auth/popup-closed-by-user': 'Sign-in cancelled. The Google popup was closed before completing.',
    'auth/popup-blocked': 'Sign-in popup was blocked by your browser. Please allow popups for BuildBoard.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email address using another sign-in method.',
    'auth/cancelled-popup-request': 'Only one popup request is allowed at a time.',
  }

  return messages[code] || fallback || 'Authentication failed. Please try again.'
}

export function getAuthErrorMessage(error) {
  return authError(error?.code, error?.message)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (import.meta.env.DEV && !isFirebaseConfigured) {
      try {
        const saved = localStorage.getItem(DEMO_STORAGE_KEY)
        return saved ? JSON.parse(saved) : null
      } catch {
        return null
      }
    }
    return null
  })
  const [loading, setLoading] = useState(() => Boolean(isFirebaseConfigured && firebaseAuth))
  const [apiError, setApiError] = useState(null)

  const retrySync = async () => {
    if (!firebaseAuth?.currentUser) return
    try {
      setLoading(true)
      const databaseUser = await syncUserWithApi(firebaseAuth.currentUser)
      setUser(toAppUser(firebaseAuth.currentUser, databaseUser))
      setApiError(null)
    } catch (err) {
      setApiError(err.message || 'BuildBoard API is currently unavailable.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseAuth) return

    let active = true

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!active) return
      if (!firebaseUser) {
        setUser(null)
        setApiError(null)
        setLoading(false)
        return
      }

      try {
        await firebaseUser.reload()
        if (!firebaseUser.emailVerified) {
          if (active) {
            setUser(null)
            setApiError(null)
            setLoading(false)
          }
          return
        }

        try {
          const databaseUser = await syncUserWithApi(firebaseUser)
          if (active) {
            setUser(toAppUser(firebaseUser, databaseUser))
            setApiError(null)
          }
        } catch (apiErr) {
          console.warn('[BuildBoard Auth] API sync failed during session restore:', apiErr.message)
          // Do NOT sign the user out on network or temporary API outages; preserve Firebase session
          if (active) {
            setUser(toAppUser(firebaseUser, null))
            setApiError(apiErr.message || 'BuildBoard API is temporarily unreachable. Some cloud features may be limited.')
          }
        }
      } catch (error) {
        console.error('Could not restore BuildBoard account session:', error)
        if (active) {
          setUser(null)
          setApiError(null)
        }
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
    if (!isFirebaseConfigured || !firebaseAuth) {
      if (!import.meta.env.DEV) {
        throw new Error('Authentication service is not configured. Demo authentication is disabled in production.')
      }
      const trimmed = (email || '').trim() || 'member@example.com'
      const appUser = {
        uid: 'demo-' + Date.now(),
        id: 'demo-user-1',
        email: trimmed,
        emailVerified: true,
        displayName: trimmed.split('@')[0],
      }
      setUser(appUser)
      try {
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(appUser))
      } catch {
        // ignore
      }
      return appUser
    }

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
      setApiError(null)
      return appUser
    } catch (error) {
      // Allow sign-in with Firebase session, but surface API sync failure
      const appUser = toAppUser(credential.user, null)
      setUser(appUser)
      setApiError(error.message || 'BuildBoard API is currently unreachable.')
      return appUser
    }
  }

  const signUp = async (email, password, displayName = '') => {
    const trimmedDisplayName = (displayName || '').trim()
    if (!isFirebaseConfigured || !firebaseAuth) {
      if (!import.meta.env.DEV) {
        throw new Error('Authentication service is not configured. Demo authentication is disabled in production.')
      }
      const trimmed = (email || '').trim() || 'member@example.com'
      const baseSlug = (trimmedDisplayName || trimmed.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 15) || 'member'
      const appUser = {
        uid: 'demo-' + Date.now(),
        id: 'demo-user-1',
        email: trimmed,
        emailVerified: true,
        displayName: trimmedDisplayName || trimmed.split('@')[0],
        username: `${baseSlug}${Math.floor(1000 + Math.random() * 9000)}`,
      }
      setUser(appUser)
      try {
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(appUser))
      } catch {
        // ignore
      }
      return { email: trimmed, displayName: appUser.displayName }
    }

    await setPersistence(firebaseAuth, browserLocalPersistence)
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password)

    try {
      if (trimmedDisplayName) {
        await updateProfile(credential.user, { displayName: trimmedDisplayName }).catch(() => {})
      }
      await sendEmailVerification(credential.user, {
        url: `${window.location.origin}/verify-email?email=${encodeURIComponent(credential.user.email || email)}`,
      })
    } finally {
      await firebaseSignOut(firebaseAuth)
    }

    return { email: credential.user.email || email.trim(), displayName: trimmedDisplayName }
  }

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      if (!import.meta.env.DEV) {
        throw new Error('Authentication service is not configured. Demo authentication is disabled in production.')
      }
      const mockEmail = 'builder.google@example.com'
      const appUser = {
        uid: 'demo-google-' + Date.now(),
        id: 'demo-user-google',
        email: mockEmail,
        emailVerified: true,
        displayName: 'Google Builder',
        username: `googlebuilder${Math.floor(1000 + Math.random() * 9000)}`,
      }
      setUser(appUser)
      try {
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(appUser))
      } catch {
        // ignore
      }
      return appUser
    }

    await setPersistence(firebaseAuth, browserLocalPersistence)
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    const credential = await signInWithPopup(firebaseAuth, provider)

    try {
      const databaseUser = await syncUserWithApi(credential.user)
      const appUser = toAppUser(credential.user, databaseUser)
      setUser(appUser)
      setApiError(null)
      return appUser
    } catch (error) {
      const appUser = toAppUser(credential.user, null)
      setUser(appUser)
      setApiError(error.message || 'BuildBoard API is currently unreachable.')
      return appUser
    }
  }

  const resendVerificationEmail = async (email, password) => {
    if (!isFirebaseConfigured || !firebaseAuth) return

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

  const resetPassword = (email) => {
    if (!isFirebaseConfigured || !firebaseAuth) return Promise.resolve()
    const cleanEmail = (email || '').trim()
    return sendPasswordResetEmail(firebaseAuth, cleanEmail, {
      url: `${window.location.origin}/reset-password`,
      handleCodeInApp: true,
    })
  }

  const verifyResetCode = (code) => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      return Promise.reject(new Error('Firebase is not configured.'))
    }
    return verifyPasswordResetCode(firebaseAuth, (code || '').trim())
  }

  const confirmReset = (code, newPassword) => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      return Promise.reject(new Error('Firebase is not configured.'))
    }
    return confirmPasswordReset(firebaseAuth, (code || '').trim(), newPassword)
  }

  const signOut = () => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      setUser(null)
      try {
        localStorage.removeItem(DEMO_STORAGE_KEY)
      } catch {
        // ignore
      }
      return Promise.resolve()
    }
    return firebaseSignOut(firebaseAuth)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        resendVerificationEmail,
        resetPassword,
        verifyResetCode,
        confirmReset,
        signOut,
        isFirebaseConfigured,
        apiError,
        retrySync,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
