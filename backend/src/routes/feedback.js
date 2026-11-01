import { Router } from 'express'
import { database } from '../config/database.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { createNotification } from '../utils/notifications.js'

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
         u.email AS user_email,
         up.profile_data->>'$.displayName' AS display_name,
         up.profile_data->>'$.roles[0]' AS primary_role,
         p.slug AS product_slug,
         p.name AS product_name,
         p.tagline AS product_tagline,
         p.image_url AS product_image,
         p.stage AS product_stage,
         p.feedback_request AS product_feedback_request,
         maker.email AS creator_email,
         maker_profile.profile_data->>'$.displayName' AS maker_name
       FROM product_feedback pf
       JOIN products p ON p.id = pf.product_id
       JOIN users u ON u.id = pf.user_id
       LEFT JOIN user_profiles up ON up.user_id = pf.user_id
       LEFT JOIN users maker ON maker.id = p.creator_id
       LEFT JOIN user_profiles maker_profile ON maker_profile.user_id = p.creator_id
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
      userEmail: r.user_email || req.authUser.email || '',
      testerName: r.display_name || (r.user_email ? r.user_email.split('@')[0] : 'Community Tester'),
      testerRole: r.primary_role || 'Community Tester',
      product: {
        id: String(r.product_id),
        slug: r.product_slug,
        name: r.product_name,
        tagline: r.product_tagline,
        image: r.product_image || '',
        stage: r.product_stage || 'Working prototype',
        feedbackRequest: r.product_feedback_request || '',
        maker: r.maker_name || (r.creator_email ? r.creator_email.split('@')[0] : 'Maker'),
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
         p.name AS product_name,
         p.slug AS product_slug,
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

    createNotification(database, {
      userId: feedbackRecord.user_id,
      actorId: userId,
      type: 'feedback_reply',
      title: 'Maker Replied to Your Feedback',
      body: `${reply.repliedBy} replied on "${feedbackRecord.product_name}": "${replyText.slice(0, 100)}${replyText.length > 100 ? '...' : ''}"`,
      linkUrl: `/tester/studio`,
    })

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
         pf.user_id,
         pf.is_helpful, 
         p.creator_id,
         p.name AS product_name,
         p.slug AS product_slug
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

    if (nextState) {
      createNotification(database, {
        userId: feedbackRecord.user_id,
        actorId: userId,
        type: 'feedback_helpful',
        title: 'Feedback Recognized (+1 Point)',
        body: `The maker of "${feedbackRecord.product_name}" marked your critique as helpful! You earned +1 recognition point.`,
        linkUrl: `/tester/studio`,
      })
    }

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
