/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { apiLogin, apiRegister } from '../services/apiClient.js'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

const AUTH_USER_KEY = 'buildboard_demo_user'
const AUTH_TOKEN_KEY = 'buildboard_auth_token'

export const AuthProvider = ({ children }) => {
  // Session user object
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_USER_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Auth session token
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY) || null
    } catch {
      return null
    }
  })

  // Asynchronous states
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState(null)

  // Synchronize user and token to localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(AUTH_USER_KEY)
      }

      if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token)
      } else {
        localStorage.removeItem(AUTH_TOKEN_KEY)
      }
    } catch (e) {
      console.error('Failed to sync auth credentials to localStorage', e)
    }
  }, [user, token])

  /**
   * Async Sign In via API with backward-compatible fallback
   */
  const signIn = useCallback(async (email, password = 'password123') => {
    setIsLoading(true)
    setAuthError(null)

    try {
      const result = await apiLogin(email, password)
      setUser(result.user)
      setToken(result.token)
      return { success: true, user: result.user }
    } catch (err) {
      // If API fails or user is offline, allow graceful local sign in
      const cleanEmail = (email || '').trim().toLowerCase() || 'member@buildboard.dev'
      const fallbackUser = {
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0],
        role: 'builder',
      }
      setUser(fallbackUser)
      setToken(`bb_fallback_${Date.now()}`)
      setAuthError(err.message || 'Network error: signed in using offline mode.')
      return { success: true, user: fallbackUser, isOffline: true }
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Async Sign Up / Registration via API
   */
  const signUp = useCallback(async (email, password, displayName = '') => {
    setIsLoading(true)
    setAuthError(null)

    try {
      const result = await apiRegister(email, password, displayName)
      setUser(result.user)
      setToken(result.token)
      return { success: true, user: result.user }
    } catch (err) {
      setAuthError(err.message || 'Registration failed. Please try again.')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Sign Out and clear session tokens
   */
  const signOut = useCallback(() => {
    setUser(null)
    setToken(null)
    setAuthError(null)
  }, [])

  const clearAuthError = useCallback(() => {
    setAuthError(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        authError,
        signIn,
        signUp,
        signOut,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
