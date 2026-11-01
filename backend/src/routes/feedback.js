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

function parseReply(raw) {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// ----------------------------------------------------------------------
// GET /api/feedback/me (User's submitted feedback & recognition metrics)
// ----------------------------------------------------------------------
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    if (!userId) {
      return res.status(404).json({ error: 'Account is not synced with BuildBoard yet.' })
    }

    const [rows] = await database.execute(
      `SELECT 
         pf.*,
         p.slug AS product_slug,
         p.name AS product_name,
         p.tagline AS product_tagline,
         p.image_url AS product_image
       FROM product_feedback pf
       JOIN products p ON p.id = pf.product_id
       WHERE pf.user_id = ?
       ORDER BY pf.created_at DESC`,
      [userId],
    )

    const list = rows.map((r) => ({
      id: String(r.id),
      productId: String(r.product_id),
      category: r.category,
      experience: r.experience,
      likes: r.likes || '',
      isHelpful: Boolean(r.is_helpful),
      helpfulMarkedAt: r.helpful_marked_at,
      reply: parseReply(r.builder_reply),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      product: {
        id: String(r.product_id),
        slug: r.product_slug,
        name: r.product_name,
        tagline: r.product_tagline,
        image: r.product_image || '',
      },
    }))

    const helpfulCount = list.filter((item) => item.isHelpful).length

    return res.json({
      feedback: list,
      recognition: {
        totalPoints: helpfulCount,
        helpfulCount,
      },
    })
  } catch (error) {
    return next(error)
  }
})

// ----------------------------------------------------------------------
// POST /api/feedback/:id/reply (Product owner replies to feedback)
// ----------------------------------------------------------------------
router.post('/:id/reply', requireAuth, async (req, res, next) => {
  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    if (!userId) {
      return res.status(404).json({ error: 'Account is not synced with BuildBoard yet.' })
    }

    const { id } = req.params
    const replyText = typeof req.body?.text === 'string' ? req.body.text.trim() : ''

    if (!replyText || replyText.length < 3) {
      return res.status(400).json({ error: 'Reply must be at least 3 characters long.' })
    }
    if (replyText.length > 1000) {
      return res.status(400).json({ error: 'Reply cannot exceed 1,000 characters.' })
    }

    const [rows] = await database.execute(
      `SELECT 
         pf.*,
         p.creator_id,
         up.profile_data->>'$.displayName' AS maker_name,
         u.email AS creator_email
       FROM product_feedback pf
       JOIN products p ON p.id = pf.product_id
       JOIN users u ON u.id = p.creator_id
       LEFT JOIN user_profiles up ON up.user_id = p.creator_id
       WHERE pf.id = ? LIMIT 1`,
      [Number(id)],
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Feedback record not found.' })
    }

    const feedbackRecord = rows[0]
    if (Number(feedbackRecord.creator_id) !== Number(userId)) {
      return res.status(403).json({ error: 'Only the product owner can reply to this feedback.' })
    }

    const existingReply = parseReply(feedbackRecord.builder_reply)
    const isEdit = Boolean(existingReply)

    const reply = {
      text: replyText,
      repliedBy: feedbackRecord.maker_name || feedbackRecord.creator_email.split('@')[0],
      repliedAt: isEdit ? existingReply.repliedAt : new Date().toISOString(),
      ...(isEdit ? { updatedAt: new Date().toISOString() } : {}),
    }

    await database.execute(
      'UPDATE product_feedback SET builder_reply = ? WHERE id = ?',
      [JSON.stringify(reply), feedbackRecord.id],
    )

    return res.json({
      success: true,
      feedbackId: String(feedbackRecord.id),
      reply,
    })
  } catch (error) {
    return next(error)
  }
})

// ----------------------------------------------------------------------
// PATCH /api/feedback/:id/helpful (Product owner marks feedback as helpful)
// ----------------------------------------------------------------------
router.patch('/:id/helpful', requireAuth, async (req, res, next) => {
  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    if (!userId) {
      return res.status(404).json({ error: 'Account is not synced with BuildBoard yet.' })
    }

    const { id } = req.params

    const [rows] = await database.execute(
      `SELECT 
         pf.id, 
         pf.is_helpful, 
         p.creator_id
       FROM product_feedback pf
       JOIN products p ON p.id = pf.product_id
       WHERE pf.id = ? LIMIT 1`,
      [Number(id)],
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Feedback record not found.' })
    }

    const feedbackRecord = rows[0]
    if (Number(feedbackRecord.creator_id) !== Number(userId)) {
      return res.status(403).json({ error: 'Only the product owner can mark feedback as helpful.' })
    }

    const nextState = !feedbackRecord.is_helpful
    const helpfulMarkedAt = nextState ? new Date() : null

    await database.execute(
      'UPDATE product_feedback SET is_helpful = ?, helpful_marked_at = ? WHERE id = ?',
      [nextState, helpfulMarkedAt, feedbackRecord.id],
    )

    return res.json({
      success: true,
      feedbackId: String(feedbackRecord.id),
      isHelpful: nextState,
      helpfulMarkedAt,
    })
  } catch (error) {
    return next(error)
  }
})

export default router
