import { firebaseAuth } from '../config/firebase.js'
import { getTestTokenVerifier } from './requireAuth.js'

export async function optionalAuth(req, _res, next) {
  const isTestEnvironment =
    process.env.NODE_ENV === 'test' &&
    process.env.NODE_ENV !== 'production' &&
    process.env.ENABLE_TEST_AUTH === 'true'

  if (!firebaseAuth && !isTestEnvironment) {
    return next()
  }

  const authorization = req.get('authorization') || ''
  const [scheme, token] = authorization.split(' ')

  if (scheme === 'Bearer' && token) {
    const customVerifier = getTestTokenVerifier()
    if (isTestEnvironment && customVerifier) {
      try {
        const decoded = await customVerifier(token)
        if (decoded?.uid && decoded?.email) {
          req.authUser = {
            firebaseUid: decoded.uid,
            email: decoded.email.toLowerCase().trim(),
            emailVerified: Boolean(decoded.email_verified),
            displayName: decoded.displayName || decoded.name || '',
          }
        }
      } catch {
        // ignore
      }
      return next()
    }

    try {
      const decoded = await firebaseAuth.verifyIdToken(token, false)
      if (decoded?.email && decoded?.email_verified) {
        req.authUser = {
          firebaseUid: decoded.uid,
          email: decoded.email.toLowerCase().trim(),
          emailVerified: decoded.email_verified,
        }
      }
    } catch {
      // Ignore invalid or expired token for optional auth; request proceeds as unauthenticated
    }
  }

  return next()
}

