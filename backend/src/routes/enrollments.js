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
// GET /api/enrollments/me (List all prototypes the current user is enrolled in)
// ----------------------------------------------------------------------
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    if (!userId) {
      return res.status(404).json({ error: 'Account is not synced with BuildBoard yet.' })
    }

    const [rows] = await database.execute(
      `SELECT 
         p.*, 
         u.email AS creator_email, 
         up.profile_data->>'$.displayName' AS maker_name,
         pe.created_at AS enrolled_at
       FROM product_enrollments pe
       JOIN products p ON p.id = pe.product_id
       JOIN users u ON u.id = p.creator_id
       LEFT JOIN user_profiles up ON up.user_id = p.creator_id
       WHERE pe.user_id = ?
       ORDER BY pe.created_at DESC`,
      [userId],
    )

    if (rows.length === 0) {
      return res.json({ enrollments: [] })
    }

    const productIds = rows.map((r) => r.id)
    const [criteriaRows] = await database.query(
      'SELECT product_id, criteria_type, criteria_value FROM product_target_criteria WHERE product_id IN (?)',
      [productIds],
    )
    const [stepsRows] = await database.query(
      'SELECT product_id, step_order, instruction FROM product_test_steps WHERE product_id IN (?) ORDER BY step_order ASC',
      [productIds],
    )

    const criteriaMap = new Map()
    for (const crow of criteriaRows) {
      if (!criteriaMap.has(crow.product_id)) {
        criteriaMap.set(crow.product_id, { category: [], role: [], industry: [], technology: [] })
      }
      const b = criteriaMap.get(crow.product_id)
      if (b[crow.criteria_type]) b[crow.criteria_type].push(crow.criteria_value)
    }

    const stepsMap = new Map()
    for (const srow of stepsRows) {
      if (!stepsMap.has(srow.product_id)) stepsMap.set(srow.product_id, [])
      stepsMap.get(srow.product_id).push(srow.instruction)
    }

    const enrollments = rows.map((row) => {
      const criteria = criteriaMap.get(row.id) || { category: [], role: [], industry: [], technology: [] }
      const steps = stepsMap.get(row.id) || []

      let gallery = []
      if (Array.isArray(row.gallery)) {
        gallery = row.gallery
      } else if (typeof row.gallery === 'string') {
        try {
          gallery = JSON.parse(row.gallery)
        } catch {
          gallery = []
        }
      } else if (row.image_url) {
        gallery = [row.image_url]
      }

      return {
        enrolledAt: row.enrolled_at,
        isEnrolled: true,
        isOwner: false,
        product: {
          id: String(row.id),
          slug: row.slug,
          name: row.name,
          tagline: row.tagline,
          description: row.description,
          stage: row.stage,
          audience: row.audience,
          feedbackRequest: row.feedback_request,
          // Unlocked because the user is a verified enrolled tester
          productUrl: row.product_url,
          githubUrl: row.github_url || '',
          imageUrl: row.image_url || '',
          image: row.image_url || '',
          gallery,
          videoUrl: row.video_url || '',
          isSample: Boolean(row.is_sample),
          enrollmentPaused: Boolean(row.enrollment_paused),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          creatorEmail: row.creator_email,
          maker: row.maker_name || row.creator_email.split('@')[0],
          categories: criteria.category.length > 0 ? criteria.category : ['Other'],
          targetRoles: criteria.role,
          targetIndustries: criteria.industry,
          targetTechnologies: criteria.technology,
          whatToTry: steps,
        },
      }
    })

    return res.json({ enrollments })
  } catch (error) {
    return next(error)
  }
})

export default router
