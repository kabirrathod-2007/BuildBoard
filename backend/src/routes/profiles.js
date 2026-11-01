import { Router } from 'express'
import { database } from '../config/database.js'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  isValidUsername,
  isUsernameTaken,
  generateUniqueUsername,
} from '../utils/username.js'

const router = Router()

const PROFILE_FIELDS = new Set([
  'displayName',
  'username',
  'participation',
  'experienceLevel',
  'interests',
  'roles',
  'industries',
  'technologies',
  'testingDevices',
  'feedbackFocus',
  'availability',
  'handle',
  'bio',
  'location',
  'website',
  'github',
  'twitter',
  'linkedin',
  'defaultLandingView',
  'reminderCadence',
  'notifyBuilderReplies',
  'notifyHelpfulNotes',
  'notifyWeeklyDigest',
  'soundEffects',
  'cardDensity',
])

function validateProfile(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { error: 'Send a profile object.' }
  }

  const profile = {}
  for (const [key, fieldValue] of Object.entries(value)) {
    if (!PROFILE_FIELDS.has(key)) continue

    if (['participation', 'interests', 'roles', 'industries', 'technologies', 'testingDevices', 'feedbackFocus'].includes(key)) {
      if (!Array.isArray(fieldValue) || fieldValue.length > 100 || fieldValue.some((item) => typeof item !== 'string' || item.length > 120)) {
        return { error: `${key} must be an array of up to 100 short text values.` }
      }
      profile[key] = [...new Set(fieldValue.map((item) => item.trim()).filter(Boolean))]
      continue
    }

    if (['notifyBuilderReplies', 'notifyHelpfulNotes', 'notifyWeeklyDigest', 'soundEffects'].includes(key)) {
      if (typeof fieldValue !== 'boolean') return { error: `${key} must be true or false.` }
      profile[key] = fieldValue
      continue
    }

    if (typeof fieldValue !== 'string' || fieldValue.length > 2000) {
      return { error: `${key} must be text with at most 2,000 characters.` }
    }
    profile[key] = fieldValue.trim()
  }

  return { profile }
}

async function findUserId(firebaseUid) {
  const [rows] = await database.execute(
    'SELECT id FROM users WHERE firebase_uid = ? LIMIT 1',
    [firebaseUid],
  )
  return rows[0]?.id ?? null
}

// ----------------------------------------------------------------------
// GET /api/profiles/check-username (Real-time check for username availability)
// ----------------------------------------------------------------------
router.get('/check-username', requireAuth, async (req, res, next) => {
  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    const raw = typeof req.query?.username === 'string' ? req.query.username.trim() : ''

    if (!raw) {
      return res.status(400).json({ available: false, error: 'Username is required.' })
    }

    const candidate = raw.toLowerCase()
    if (!isValidUsername(candidate)) {
      return res.status(400).json({
        available: false,
        error: 'Username must be 3-30 characters long and can only contain lowercase letters, numbers, hyphens, and underscores.',
      })
    }

    const taken = await isUsernameTaken(database, candidate, userId)
    if (taken) {
      return res.json({ available: false, error: 'This username is already taken. Please choose another one.' })
    }

    return res.json({ available: true, username: candidate })
  } catch (error) {
    return next(error)
  }
})

// ----------------------------------------------------------------------
// GET /api/profiles/me (Fetch signed-in user's profile with username)
// ----------------------------------------------------------------------
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    if (!userId) return res.status(404).json({ error: 'Account is not synced with BuildBoard yet.' })

    const [rows] = await database.execute(
      'SELECT profile_data, updated_at FROM user_profiles WHERE user_id = ? LIMIT 1',
      [userId],
    )
    const row = rows[0]
    if (!row) {
      return res.json({ profile: null, updatedAt: null })
    }

    const profile = row.profile_data || {}
    let needsSave = false

    // Ensure username is populated and unique
    if (!profile.username || typeof profile.username !== 'string' || !profile.username.trim()) {
      const uniqueUsername = await generateUniqueUsername(
        database,
        profile.displayName || req.authUser.displayName || req.authUser.email.split('@')[0],
        userId,
      )
      profile.username = uniqueUsername
      profile.handle = uniqueUsername
      needsSave = true
    }

    if (needsSave) {
      await database.execute(
        'UPDATE user_profiles SET profile_data = ? WHERE user_id = ?',
        [JSON.stringify(profile), userId],
      )
    }

    return res.json({
      profile,
      updatedAt: row.updated_at ?? null,
    })
  } catch (error) {
    return next(error)
  }
})

// ----------------------------------------------------------------------
// PUT /api/profiles/me (Update signed-in user's profile with unique username check)
// ----------------------------------------------------------------------
router.put('/me', requireAuth, async (req, res, next) => {
  const { profile, error } = validateProfile(req.body?.profile)
  if (error) return res.status(400).json({ error })

  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    if (!userId) return res.status(404).json({ error: 'Account is not synced with BuildBoard yet.' })

    // Validate and enforce unique username
    if (profile.username) {
      const normalizedUsername = profile.username.toLowerCase().trim()
      if (!isValidUsername(normalizedUsername)) {
        return res.status(400).json({
          error: 'Username must be 3-30 characters long and can only contain lowercase letters, numbers, hyphens, and underscores.',
        })
      }

      const taken = await isUsernameTaken(database, normalizedUsername, userId)
      if (taken) {
        return res.status(409).json({
          error: 'This username is already taken. Please choose another one.',
        })
      }

      profile.username = normalizedUsername
      profile.handle = normalizedUsername
    } else {
      // If username wasn't provided in payload, preserve existing username if available
      const [existingRows] = await database.execute(
        'SELECT profile_data FROM user_profiles WHERE user_id = ? LIMIT 1',
        [userId],
      )
      const existing = existingRows[0]?.profile_data || {}
      if (existing.username) {
        profile.username = existing.username
        profile.handle = existing.username
      } else {
        // Generate new unique username if none existed
        const uniqueUsername = await generateUniqueUsername(
          database,
          profile.displayName || req.authUser.displayName || req.authUser.email.split('@')[0],
          userId,
        )
        profile.username = uniqueUsername
        profile.handle = uniqueUsername
      }
    }

    await database.execute(
      `INSERT INTO user_profiles (user_id, profile_data)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE profile_data = VALUES(profile_data)`,
      [userId, JSON.stringify(profile)],
    )

    const [rows] = await database.execute(
      'SELECT profile_data, updated_at FROM user_profiles WHERE user_id = ? LIMIT 1',
      [userId],
    )
    return res.json({ profile: rows[0].profile_data, updatedAt: rows[0].updated_at })
  } catch (error) {
    return next(error)
  }
})

export default router
