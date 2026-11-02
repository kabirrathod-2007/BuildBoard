import { firebaseAuth } from '../config/firebase.js'

export async function requireAuth(req, res, next) {
  if (!firebaseAuth) {
    return res.status(503).json({ error: 'Authentication service is not configured on the server.' })
  }

  const authorization = req.get('authorization') || ''
  const [scheme, token] = authorization.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Sign in to continue.' })
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
