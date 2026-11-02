import { Router } from 'express'
import { database } from '../config/database.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

async function findUserId(firebaseUid) {
  const [rows] = await database.execute(
    'SELECT id FROM users WHERE firebase_uid = ? LIMIT 1',
    [firebaseUid],
  )
  return rows[0]?.id ?? null
}

// ----------------------------------------------------------------------
// GET /api/notifications (List notifications for current authenticated user)
// ----------------------------------------------------------------------
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    if (!userId) {
      return res.status(404).json({ error: 'Account is not synced with BuildBoard yet.' })
    }

    try {
      const [rows] = await database.execute(
        `SELECT 
           n.*,
           u.email AS actor_email,
           up.profile_data->>'$.displayName' AS actor_name,
           up.profile_data->>'$.username' AS actor_username
         FROM notifications n
         LEFT JOIN users u ON u.id = n.actor_id
         LEFT JOIN user_profiles up ON up.user_id = n.actor_id
         WHERE n.user_id = ?
         ORDER BY n.created_at DESC
         LIMIT 30`,
        [userId],
      )

      const [unreadRows] = await database.execute(
        'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = FALSE',
        [userId],
      )
      const unreadCount = Number(unreadRows[0]?.count || 0)

      const notifications = rows.map((r) => ({
        id: String(r.id),
        type: r.type,
        title: r.title,
        body: r.body,
        linkUrl: r.link_url,
        isRead: Boolean(r.is_read),
        createdAt: r.created_at,
        actor: {
          id: r.actor_id ? String(r.actor_id) : null,
          name: r.actor_name || r.actor_username || 'Community Member',
          username: r.actor_username || '',
        },
      }))

      return res.json({
        unreadCount,
        notifications,
      })
    } catch (dbErr) {
      if (dbErr.code === 'ER_NO_SUCH_TABLE') {
        return res.json({ unreadCount: 0, notifications: [] })
      }
      throw dbErr
    }
  } catch (error) {
    return next(error)
  }
})

// ----------------------------------------------------------------------
// PATCH /api/notifications/:id/read (Mark a single notification as read)
// ----------------------------------------------------------------------
router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    if (!userId) {
      return res.status(404).json({ error: 'Account is not synced with BuildBoard yet.' })
    }

    const { id } = req.params
    try {
      await database.execute(
        'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
        [Number(id), userId],
      )
      return res.json({ success: true, id })
    } catch (dbErr) {
      if (dbErr.code === 'ER_NO_SUCH_TABLE') {
        return res.json({ success: true, id })
      }
      throw dbErr
    }
  } catch (error) {
    return next(error)
  }
})

// ----------------------------------------------------------------------
// POST /api/notifications/read-all (Mark all notifications as read)
// ----------------------------------------------------------------------
router.post('/read-all', requireAuth, async (req, res, next) => {
  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    if (!userId) {
      return res.status(404).json({ error: 'Account is not synced with BuildBoard yet.' })
    }

    try {
      await database.execute(
        'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
        [userId],
      )
      return res.json({ success: true })
    } catch (dbErr) {
      if (dbErr.code === 'ER_NO_SUCH_TABLE') {
        return res.json({ success: true })
      }
      throw dbErr
    }
  } catch (error) {
    return next(error)
  }
})

export default router

