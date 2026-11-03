import { Router } from 'express'
import { database } from '../config/database.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { generateUniqueUsername } from '../utils/username.js'

const router = Router()

router.post('/me', requireAuth, async (req, res, next) => {
  try {
    const { firebaseUid, email, emailVerified, displayName: tokenDisplayName } = req.authUser
    await database.execute(
      `INSERT INTO users (firebase_uid, email, email_verified)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE email = VALUES(email), email_verified = VALUES(email_verified)`,
      [firebaseUid, email, emailVerified],
    )

    const [rows] = await database.execute(
      'SELECT id, firebase_uid, email, email_verified, created_at FROM users WHERE firebase_uid = ? LIMIT 1',
      [firebaseUid],
    )

    const user = rows[0]
    const userId = user.id

    // Check existing profile
    const [profileRows] = await database.execute(
      'SELECT profile_data FROM user_profiles WHERE user_id = ? LIMIT 1',
      [userId],
    )

    const providedDisplayName = typeof req.body?.displayName === 'string' ? req.body.displayName.trim() : ''
    const effectiveDisplayName =
      providedDisplayName || tokenDisplayName || (email ? email.split('@')[0] : 'Member')

    let profile = profileRows[0]?.profile_data || null

    if (!profile) {
      // First-time sync: generate unique random username matching display name
      const uniqueUsername = await generateUniqueUsername(database, effectiveDisplayName, userId)

      const initialProfile = {
        displayName: effectiveDisplayName,
        username: uniqueUsername,
        handle: uniqueUsername,
        roles: [],
        interests: [],
        industries: [],
        technologies: [],
        testingDevices: [],
        feedbackFocus: [],
        participation: [],
        experienceLevel: '',
        availability: '',
        bio: '',
        location: '',
        website: '',
        github: '',
        twitter: '',
        linkedin: '',
        defaultLandingView: 'explore',
        reminderCadence: 'standard',
        notifyBuilderReplies: true,
        notifyHelpfulNotes: true,
        notifyWeeklyDigest: true,
        soundEffects: true,
        cardDensity: 'comfortable',
      }

      await database.execute(
        `INSERT INTO user_profiles (user_id, profile_data) VALUES (?, ?)`,
        [userId, JSON.stringify(initialProfile)],
      )
      profile = initialProfile
    } else {
      // Profile exists: ensure username is present and unique
      let needsUpdate = false
      let updatedProfile = { ...profile }

      if (!updatedProfile.username || typeof updatedProfile.username !== 'string' || !updatedProfile.username.trim()) {
        const uniqueUsername = await generateUniqueUsername(
          database,
          updatedProfile.displayName || effectiveDisplayName,
          userId,
        )
        updatedProfile.username = uniqueUsername
        updatedProfile.handle = uniqueUsername
        needsUpdate = true
      }

      if (providedDisplayName && (!updatedProfile.displayName || updatedProfile.displayName === email.split('@')[0])) {
        updatedProfile.displayName = providedDisplayName
        needsUpdate = true
      }

      if (needsUpdate) {
        await database.execute(
          'UPDATE user_profiles SET profile_data = ? WHERE user_id = ?',
          [JSON.stringify(updatedProfile), userId],
        )
        profile = updatedProfile
      }
    }

    return res.json({
      user: {
        ...user,
        displayName: profile.displayName || effectiveDisplayName,
        username: profile.username || '',
      },
    })
  } catch (error) {
    return next(error)
  }
})

export default router
