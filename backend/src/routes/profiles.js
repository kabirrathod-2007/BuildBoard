import { Router } from 'express'
import { database } from '../config/database.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

const PROFILE_FIELDS = new Set([
  'displayName',
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

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    if (!userId) return res.status(404).json({ error: 'Account is not synced with BuildBoard yet.' })

    const [rows] = await database.execute(
      'SELECT profile_data, updated_at FROM user_profiles WHERE user_id = ? LIMIT 1',
      [userId],
    )
    const row = rows[0]
    return res.json({
      profile: row?.profile_data ?? null,
      updatedAt: row?.updated_at ?? null,
    })
  } catch (error) {
    return next(error)
  }
})

router.put('/me', requireAuth, async (req, res, next) => {
  const { profile, error } = validateProfile(req.body?.profile)
  if (error) return res.status(400).json({ error })

  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    if (!userId) return res.status(404).json({ error: 'Account is not synced with BuildBoard yet.' })

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
