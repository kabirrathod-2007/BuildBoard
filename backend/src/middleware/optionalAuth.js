import { firebaseAuth } from '../config/firebase.js'

export async function optionalAuth(req, _res, next) {
  const authorization = req.get('authorization') || ''
  const [scheme, token] = authorization.split(' ')

  if (scheme === 'Bearer' && token) {
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

