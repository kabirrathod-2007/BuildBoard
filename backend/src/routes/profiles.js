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

  for (const key of Object.keys(value)) {
    if (!PROFILE_FIELDS.has(key)) {
      return { error: `Field '${key}' is not allowed in profile.` }
    }
  }

  const profile = {}
  for (const [key, fieldValue] of Object.entries(value)) {

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
  if (req.body && typeof req.body === 'object') {
    const invalidKeys = Object.keys(req.body).filter((k) => k !== 'profile')
    if (invalidKeys.length > 0) {
      return res.status(400).json({ error: `Unexpected field(s): ${invalidKeys.join(', ')}` })
    }
  }

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

// ----------------------------------------------------------------------
// GET /api/profiles/u/:username (Public maker & tester portfolio)
// ----------------------------------------------------------------------
router.get('/u/:username', async (req, res, next) => {
  try {
    const rawUsername = (req.params.username || '').trim().toLowerCase().replace(/^@/, '')
    if (!rawUsername) {
      return res.status(400).json({ error: 'Username is required.' })
    }

    const [userRows] = await database.execute(
      `SELECT u.id, u.email, u.created_at, up.profile_data, up.updated_at
       FROM users u
       JOIN user_profiles up ON up.user_id = u.id
       WHERE LOWER(up.profile_data->>'$.username') = ?
       LIMIT 1`,
      [rawUsername],
    )

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User profile not found.' })
    }

    const user = userRows[0]
    const profile = user.profile_data || {}

    // 1. Calculate helpful recognition points
    const [pointRows] = await database.execute(
      'SELECT COUNT(*) AS points FROM product_feedback WHERE user_id = ? AND is_helpful = 1',
      [user.id],
    )
    const recognitionPoints = Number(pointRows[0]?.points || 0)

    // 2. Calculate feedback count
    const [feedbackRows] = await database.execute(
      'SELECT COUNT(*) AS count FROM product_feedback WHERE user_id = ?',
      [user.id],
    )
    const feedbackCount = Number(feedbackRows[0]?.count || 0)

    // 3. Fetch products launched by this user
    let products = []
    try {
      const [productRows] = await database.execute(
        `SELECT id, slug, name, tagline, stage, image_url, enrollment_paused, 
                (SELECT COUNT(*) FROM product_enrollments WHERE product_id = p.id) AS enrollment_count,
                (SELECT COUNT(*) FROM product_feedback WHERE product_id = p.id) AS feedback_count,
                created_at
         FROM products p
         WHERE creator_id = ?
         ORDER BY created_at DESC`,
        [user.id],
      )
      products = productRows.map((p) => ({
        id: String(p.id),
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        stage: p.stage,
        imageUrl: p.image_url || '',
        enrollmentPaused: Boolean(p.enrollment_paused),
        enrollmentCount: Number(p.enrollment_count || 0),
        feedbackCount: Number(p.feedback_count || 0),
        createdAt: p.created_at,
      }))
    } catch (prodErr) {
      console.warn('[BuildBoard Public Profile] Error fetching user products:', prodErr.message)
    }

    // 4. Fetch problems posted by this user (if problems table exists)
    let problems = []
    try {
      const [problemRows] = await database.execute(
        `SELECT p.id, p.slug, p.title, p.statement, p.category, p.stage, p.created_at,
           (SELECT COUNT(*) FROM problem_validations WHERE problem_id = p.id) AS validation_count,
           (SELECT COUNT(*) FROM problem_comments WHERE problem_id = p.id) AS comment_count
         FROM problems p
         WHERE p.creator_id = ?
         ORDER BY p.created_at DESC`,
        [user.id],
      )
      problems = problemRows.map((pr) => ({
        id: String(pr.id),
        slug: pr.slug,
        title: pr.title,
        statement: pr.statement,
        category: pr.category,
        stage: pr.stage,
        validationCount: Number(pr.validation_count || 0),
        commentCount: Number(pr.comment_count || 0),
        createdAt: pr.created_at,
      }))
    } catch (err) {
      if (err.code !== 'ER_NO_SUCH_TABLE') {
        console.warn('[BuildBoard Public Profile] Error fetching problems:', err.message)
      }
    }

    // 5. Fetch recent helpful feedback notes awarded to this tester
    let recentRecognitions = []
    try {
      const [reconRows] = await database.execute(
        `SELECT pf.id, pf.category, pf.experience, pf.helpful_marked_at, pf.builder_reply,
                p.id AS product_id, p.slug AS product_slug, p.name AS product_name
         FROM product_feedback pf
         JOIN products p ON p.id = pf.product_id
         WHERE pf.user_id = ? AND pf.is_helpful = 1
         ORDER BY pf.helpful_marked_at DESC
         LIMIT 10`,
        [user.id],
      )
      recentRecognitions = reconRows.map((r) => ({
        id: String(r.id),
        category: r.category,
        experience: r.experience,
        helpfulMarkedAt: r.helpful_marked_at,
        builderReply: r.builder_reply,
        product: {
          id: String(r.product_id),
          slug: r.product_slug,
          name: r.product_name,
        },
      }))
    } catch (reconErr) {
      console.warn('[BuildBoard Public Profile] Error fetching recognitions:', reconErr.message)
    }

    // Assemble safe public profile
    return res.json({
      user: {
        id: String(user.id),
        displayName: profile.displayName || rawUsername,
        username: profile.username || rawUsername,
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        github: profile.github || '',
        twitter: profile.twitter || '',
        linkedin: profile.linkedin || '',
        roles: profile.roles || [],
        industries: profile.industries || [],
        technologies: profile.technologies || [],
        testingDevices: profile.testingDevices || [],
        experienceLevel: profile.experienceLevel || '',
        availability: profile.availability || '',
        memberSince: user.created_at,
      },
      stats: {
        recognitionPoints,
        feedbackCount,
        productsLaunchedCount: products.length,
        problemsPostedCount: problems.length,
      },
      products,
      problems,
      recentRecognitions,
    })
  } catch (error) {
    return next(error)
  }
})

export default router
