import { firebaseAuth } from '../config/firebase.js'

let customTokenVerifier = null

/**
 * Injects a test verifier for automated test suites.
 * Strictly prohibited and throws in staging and production.
 */
export function setTokenVerifierForTesting(verifier) {
  if (process.env.NODE_ENV !== 'test' || process.env.NODE_ENV === 'production') {
    throw new Error('[Security Violation] Custom token verifiers can only be registered in NODE_ENV=test.')
  }
  customTokenVerifier = verifier
}

export function resetTokenVerifierForTesting() {
  customTokenVerifier = null
}

export function getTestTokenVerifier() {
  if (process.env.NODE_ENV !== 'test' || process.env.NODE_ENV === 'production') {
    return null
  }
  return customTokenVerifier
}

export async function requireAuth(req, res, next) {
  const isTestEnvironment =
    process.env.NODE_ENV === 'test' &&
    process.env.NODE_ENV !== 'production' &&
    process.env.ENABLE_TEST_AUTH === 'true'

  if (!firebaseAuth && !isTestEnvironment) {
    return res.status(503).json({ error: 'Authentication service is not configured on the server.' })
  }

  const authorization = req.get('authorization') || ''
  const [scheme, token] = authorization.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Sign in to continue.' })
  }

  // TEST-ONLY AUTHENTICATION (Injected Verifier)
  // Strictly impossible in production/staging: multiple guards ensure NODE_ENV === 'test' AND not 'production'.
  if (isTestEnvironment && customTokenVerifier) {
    try {
      const decoded = await customTokenVerifier(token)
      if (decoded) {
        if (!decoded.email || !decoded.email_verified || !decoded.uid) {
          return res.status(403).json({ error: 'Verify your email before continuing.' })
        }
        req.authUser = {
          firebaseUid: decoded.uid,
          email: decoded.email.toLowerCase().trim(),
          emailVerified: Boolean(decoded.email_verified),
          displayName: decoded.displayName || decoded.name || '',
        }
        return next()
      }
    } catch {
      return res.status(401).json({ error: 'Your session is invalid or expired. Sign in again.' })
    }
  }

  try {
    const decoded = await firebaseAuth.verifyIdToken(token, true)

    if (!decoded.email || !decoded.email_verified) {
      return res.status(403).json({ error: 'Verify your email before continuing.' })
    }

    req.authUser = {
      firebaseUid: decoded.uid,
      email: decoded.email.toLowerCase().trim(),
      emailVerified: decoded.email_verified,
      displayName: decoded.name || '',
    }
    return next()
  } catch {
    return res.status(401).json({ error: 'Your session is invalid or expired. Sign in again.' })
  }
}
