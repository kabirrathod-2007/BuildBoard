import { Router } from 'express'
import { database } from '../config/database.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { optionalAuth } from '../middleware/optionalAuth.js'
import { createNotification } from '../utils/notifications.js'
import {
  isValidHttpUrl,
  validateAllowedFields,
  sanitizeStringArray,
  slugify,
} from '../utils/validation.js'

const router = Router()

async function findUserId(firebaseUid) {
  const [rows] = await database.execute(
    'SELECT id FROM users WHERE firebase_uid = ? LIMIT 1',
    [firebaseUid],
  )
  return rows[0]?.id ?? null
}

function validateProductInput(body, isUpdate = false) {
  if (!body || typeof body !== 'object') {
    return { error: 'Send a valid product data object.' }
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name || name.length < 2 || name.length > 150) {
    return { error: 'Product name is required (between 2 and 150 characters).' }
  }

  const tagline = typeof body.tagline === 'string' ? body.tagline.trim() : ''
  if (!tagline || tagline.length < 5 || tagline.length > 255) {
    return { error: 'Tagline is required (between 5 and 255 characters).' }
  }

  const description = typeof body.description === 'string' && body.description.trim()
    ? body.description.trim()
    : tagline
  if (description.length > 10000) {
    return { error: 'Description cannot exceed 10,000 characters.' }
  }

  const stage = typeof body.stage === 'string' && body.stage.trim()
    ? body.stage.trim().slice(0, 50)
    : 'Working prototype'

  const audience = typeof body.audience === 'string' ? body.audience.trim() : ''
  if (!audience || audience.length > 2000) {
    return { error: 'Target audience is required (up to 2,000 characters).' }
  }

  const feedbackRequest = typeof body.feedbackRequest === 'string' ? body.feedbackRequest.trim() : ''
  if (!feedbackRequest || feedbackRequest.length > 2000) {
    return { error: 'Feedback request is required (up to 2,000 characters).' }
  }

  const rawProductUrl = body.productUrl || body.prototypeUrl
  if (!rawProductUrl || !isValidHttpUrl(rawProductUrl)) {
    return { error: 'A valid prototype URL starting with http:// or https:// is required.' }
  }
  const productUrl = rawProductUrl.trim()
  if (productUrl.length > 500) {
    return { error: 'Prototype URL cannot exceed 500 characters.' }
  }

  let githubUrl = null
  if (body.githubUrl && typeof body.githubUrl === 'string' && body.githubUrl.trim()) {
    if (!isValidHttpUrl(body.githubUrl)) {
      return { error: 'GitHub URL must be a valid URL starting with http:// or https://' }
    }
    githubUrl = body.githubUrl.trim().slice(0, 500)
  }

  let imageUrl = null
  const rawImage = body.imageUrl || body.image
  if (rawImage && typeof rawImage === 'string' && rawImage.trim()) {
    if (!isValidHttpUrl(rawImage)) {
      return { error: 'Cover image URL must be a valid URL starting with http:// or https://' }
    }
    imageUrl = rawImage.trim().slice(0, 500)
  }

  let videoUrl = null
  if (body.videoUrl && typeof body.videoUrl === 'string' && body.videoUrl.trim()) {
    if (!isValidHttpUrl(body.videoUrl)) {
      return { error: 'Video URL must be a valid URL starting with http:// or https://' }
    }
    videoUrl = body.videoUrl.trim().slice(0, 500)
  }

  let gallery = null
  if (Array.isArray(body.gallery)) {
    gallery = body.gallery
      .filter((url) => typeof url === 'string' && isValidHttpUrl(url))
      .map((url) => url.trim().slice(0, 500))
      .slice(0, 20)
  }

  const rawCategories = Array.isArray(body.categories) ? body.categories : []
  const categories = sanitizeStringArray(rawCategories, 20, 100)
  if (categories.length === 0) {
    return { error: 'Select at least one category.' }
  }

  const targetRoles = sanitizeStringArray(body.targetRoles, 30, 100)
  const targetIndustries = sanitizeStringArray(body.targetIndustries, 30, 100)
  const targetTechnologies = sanitizeStringArray(body.targetTechnologies, 30, 100)

  let whatToTry = null
  if (Array.isArray(body.whatToTry)) {
    whatToTry = body.whatToTry
      .filter((step) => typeof step === 'string' && step.trim().length > 0)
      .map((step) => step.trim().slice(0, 1000))
      .slice(0, 20)
  }

  if (!isUpdate && (!whatToTry || whatToTry.length === 0)) {
    whatToTry = [
      'Test the core prototype workflow',
      'Check for usability friction or confusing steps',
      'Share what you expected to happen vs what occurred',
    ]
  }

  let enrollmentLimit = null
  if (body.enrollmentLimit !== undefined && body.enrollmentLimit !== null && body.enrollmentLimit !== '') {
    const parsedLimit = Number(body.enrollmentLimit)
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
      return { error: 'Tester quota must be a positive integer of at least 1 tester (or leave blank for unlimited).' }
    }
    if (parsedLimit > 100000) {
      return { error: 'Tester quota cannot exceed 100,000 testers.' }
    }
    enrollmentLimit = parsedLimit
  }

  return {
    data: {
      name,
      tagline,
      description,
      stage,
      audience,
      feedbackRequest,
      productUrl,
      githubUrl,
      imageUrl,
      gallery,
      videoUrl,
      categories,
      targetRoles,
      targetIndustries,
      targetTechnologies,
      whatToTry,
      enrollmentLimit,
    },
  }
}

async function attachCriteriaAndSteps(products, userId = null, isCatalog = false) {
  if (products.length === 0) return []

  const productIds = products.map((p) => p.id)

  const [criteriaRows] = await database.query(
    'SELECT product_id, criteria_type, criteria_value FROM product_target_criteria WHERE product_id IN (?)',
    [productIds],
  )

  const [stepsRows] = await database.query(
    'SELECT product_id, step_order, instruction FROM product_test_steps WHERE product_id IN (?) ORDER BY step_order ASC',
    [productIds],
  )

  const countsMap = new Map()
  const userEnrollmentMap = new Map()

  try {
    const [countRows] = await database.query(
      'SELECT product_id, COUNT(*) AS count FROM product_enrollments WHERE product_id IN (?) GROUP BY product_id',
      [productIds],
    )
    for (const r of countRows) {
      countsMap.set(r.product_id, Number(r.count))
    }

    if (userId) {
      const [userEnrollmentRows] = await database.query(
        'SELECT product_id, created_at FROM product_enrollments WHERE user_id = ? AND product_id IN (?)',
        [userId, productIds],
      )
      for (const r of userEnrollmentRows) {
        userEnrollmentMap.set(r.product_id, r.created_at)
      }
    }
  } catch (err) {
    if (err.code !== 'ER_NO_SUCH_TABLE') {
      throw err
    }
  }

  const criteriaMap = new Map()
  for (const row of criteriaRows) {
    if (!criteriaMap.has(row.product_id)) {
      criteriaMap.set(row.product_id, {
        category: [],
        role: [],
        industry: [],
        technology: [],
      })
    }
    const bucket = criteriaMap.get(row.product_id)
    if (bucket[row.criteria_type]) {
      bucket[row.criteria_type].push(row.criteria_value)
    }
  }

  const stepsMap = new Map()
  for (const row of stepsRows) {
    if (!stepsMap.has(row.product_id)) {
      stepsMap.set(row.product_id, [])
    }
    stepsMap.get(row.product_id).push(row.instruction)
  }

  return products.map((row) => {
    const isOwner = Boolean(userId && Number(row.creator_id) === Number(userId))
    const isEnrolled = Boolean(userEnrollmentMap.has(row.id))
    const enrolledAt = userEnrollmentMap.get(row.id) || null
    const enrollmentCount = countsMap.get(row.id) || 0

    // GATED ACCESS RULE:
    // Catalog view: product_url is ALWAYS masked to preserve the enrollment gate.
    // Detail view: product_url is ONLY returned to verified creator OR verified enrolled tester.
    const canAccessPrototype = !isCatalog && (isOwner || isEnrolled)
    const productUrl = canAccessPrototype ? row.product_url : null

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
      id: String(row.id),
      slug: row.slug,
      name: row.name,
      tagline: row.tagline,
      description: row.description,
      stage: row.stage,
      audience: row.audience,
      feedbackRequest: row.feedback_request,
      productUrl,
      githubUrl: row.github_url || '',
      imageUrl: row.image_url || '',
      image: row.image_url || '',
      gallery,
      videoUrl: row.video_url || '',
      isSample: Boolean(row.is_sample),
      enrollmentPaused: Boolean(row.enrollment_paused),
      enrollmentLimit: row.enrollment_limit !== null && row.enrollment_limit !== undefined ? Number(row.enrollment_limit) : null,
      enrollmentCount,
      viewsCount: Number(row.views_count || 0),
      isEnrolled,
      enrolledAt,
      isOwner,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      creatorEmail: isOwner ? row.creator_email : undefined,
      creatorUsername: row.creator_username || '',
      maker: row.maker_name || row.creator_username || 'Builder',
      categories: criteria.category.length > 0 ? criteria.category : ['Other'],
      targetRoles: criteria.role,
      targetIndustries: criteria.industry,
      targetTechnologies: criteria.technology,
      whatToTry: steps,
    }
  })
}

// ----------------------------------------------------------------------
// GET /api/products (Public product catalog)
// ----------------------------------------------------------------------
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    let userId = null
    if (req.authUser) {
      userId = await findUserId(req.authUser.firebaseUid)
    }

    const { category, creator } = req.query

    // If filtering by creator=me, user must be authenticated
    if (creator === 'me') {
      if (!userId) {
        return res.status(401).json({ error: 'Sign in to view your products.' })
      }
      const [rows] = await database.execute(
        `SELECT 
           p.*, 
           u.email AS creator_email, 
           up.profile_data->>'$.displayName' AS maker_name,
           up.profile_data->>'$.username' AS creator_username
         FROM products p
         JOIN users u ON u.id = p.creator_id
         LEFT JOIN user_profiles up ON up.user_id = p.creator_id
         WHERE p.creator_id = ?
         ORDER BY p.created_at DESC`,
        [userId],
      )
      const list = await attachCriteriaAndSteps(rows, userId)
      return res.json({ products: list })
    }

    let query = `
      SELECT 
        p.*, 
        u.email AS creator_email, 
        up.profile_data->>'$.displayName' AS maker_name,
        up.profile_data->>'$.username' AS creator_username
      FROM products p
      JOIN users u ON u.id = p.creator_id
      LEFT JOIN user_profiles up ON up.user_id = p.creator_id
    `
    const params = []

    if (category && typeof category === 'string' && category !== 'All') {
      query += `
        JOIN product_target_criteria ptc 
          ON ptc.product_id = p.id 
          AND ptc.criteria_type = 'category' 
          AND ptc.criteria_value = ?
      `
      params.push(category)
    }

    query += ' ORDER BY p.created_at DESC LIMIT 100'

    const [rows] = await database.execute(query, params)
    const list = await attachCriteriaAndSteps(rows, userId, true)
    return res.json({ products: list })
  } catch (error) {
    return next(error)
  }
})

// ----------------------------------------------------------------------
// GET /api/products/:slugOrId (Public product detail with owner gate)
// ----------------------------------------------------------------------
router.get('/:slugOrId', optionalAuth, async (req, res, next) => {
  try {
    const { slugOrId } = req.params

    let userId = null
    if (req.authUser) {
      userId = await findUserId(req.authUser.firebaseUid)
    }

    const isNumeric = /^\d+$/.test(slugOrId)
    const query = `
      SELECT 
        p.*, 
        u.email AS creator_email, 
        up.profile_data->>'$.displayName' AS maker_name,
        up.profile_data->>'$.username' AS creator_username
      FROM products p
      JOIN users u ON u.id = p.creator_id
      LEFT JOIN user_profiles up ON up.user_id = p.creator_id
      WHERE ${isNumeric ? 'p.id = ? OR p.slug = ?' : 'p.slug = ?'}
      LIMIT 1
    `
    const params = isNumeric ? [Number(slugOrId), slugOrId] : [slugOrId]
    const [rows] = await database.execute(query, params)

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product listing not found.' })
    }

    const [product] = await attachCriteriaAndSteps(rows, userId, false)
    return res.json({ product })
  } catch (error) {
    return next(error)
  }
})

// ----------------------------------------------------------------------
// POST /api/products/:slugOrId/view (Increment views count)
// ----------------------------------------------------------------------
router.post('/:slugOrId/view', optionalAuth, async (req, res, next) => {
  try {
    const { slugOrId } = req.params
    const isNumeric = /^\d+$/.test(slugOrId)
    const selectQuery = `SELECT id FROM products WHERE ${isNumeric ? 'id = ? OR slug = ?' : 'slug = ?'} LIMIT 1`
    const selectParams = isNumeric ? [Number(slugOrId), slugOrId] : [slugOrId]
    const [rows] = await database.execute(selectQuery, selectParams)
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product listing not found.' })
    }

    const productId = rows[0].id
    try {
      await database.execute(
        'UPDATE products SET views_count = views_count + 1 WHERE id = ?',
        [productId],
      )
    } catch (err) {
      if (err.code !== 'ER_BAD_FIELD_ERROR' && err.code !== 'ER_NO_SUCH_TABLE') {
        console.warn('[BuildBoard] Failed to increment views_count:', err.message)
      }
    }

    return res.json({ success: true, productId })
  } catch (error) {
    return next(error)
  }
})

// ----------------------------------------------------------------------
// POST /api/products (Create product listing)
// ----------------------------------------------------------------------
router.post('/', requireAuth, async (req, res, next) => {
  const allowed = new Set([
    'name', 'tagline', 'description', 'stage', 'audience', 'feedbackRequest',
    'productUrl', 'prototypeUrl', 'githubUrl', 'imageUrl', 'image', 'gallery',
    'videoUrl', 'categories', 'targetRoles', 'targetIndustries',
    'targetTechnologies', 'whatToTry', 'enrollmentLimit',
  ])
  const fieldErr = validateAllowedFields(req.body, allowed, 'product listing')
  if (fieldErr) return res.status(400).json({ error: fieldErr })

  const { data, error } = validateProductInput(req.body)
  if (error) return res.status(400).json({ error })

  const connection = await database.getConnection()
  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    if (!userId) {
      return res.status(404).json({ error: 'Account is not synced with BuildBoard yet.' })
    }

    // Generate unique slug
    let baseSlug = slugify(data.name) || 'product'
    let slug = baseSlug
    const [existing] = await connection.execute(
      'SELECT id FROM products WHERE slug = ? LIMIT 1',
      [slug],
    )
    if (existing.length > 0) {
      slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`
    }

    await connection.beginTransaction()

    let insertResult
    try {
      const [res] = await connection.execute(
        `INSERT INTO products (
           slug, creator_id, name, tagline, description, stage,
           audience, feedback_request, product_url, github_url,
           image_url, gallery, video_url, is_sample, enrollment_paused, enrollment_limit
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, FALSE, ?)`,
        [
          slug,
          userId,
          data.name,
          data.tagline,
          data.description,
          data.stage,
          data.audience,
          data.feedbackRequest,
          data.productUrl,
          data.githubUrl,
          data.imageUrl,
          data.gallery ? JSON.stringify(data.gallery) : null,
          data.videoUrl,
          data.enrollmentLimit ?? null,
        ],
      )
      insertResult = res
    } catch (insertErr) {
      if (insertErr.code === 'ER_BAD_FIELD_ERROR') {
        const [res] = await connection.execute(
          `INSERT INTO products (
             slug, creator_id, name, tagline, description, stage,
             audience, feedback_request, product_url, github_url,
             image_url, gallery, video_url, is_sample, enrollment_paused
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, FALSE)`,
          [
            slug,
            userId,
            data.name,
            data.tagline,
            data.description,
            data.stage,
            data.audience,
            data.feedbackRequest,
            data.productUrl,
            data.githubUrl,
            data.imageUrl,
            data.gallery ? JSON.stringify(data.gallery) : null,
            data.videoUrl,
          ],
        )
        insertResult = res
      } else {
        throw insertErr
      }
    }

    const productId = insertResult.insertId

    // Insert criteria rows
    const criteriaRows = []
    for (const cat of data.categories) {
      criteriaRows.push([productId, 'category', cat])
    }
    for (const role of data.targetRoles) {
      criteriaRows.push([productId, 'role', role])
    }
    for (const ind of data.targetIndustries) {
      criteriaRows.push([productId, 'industry', ind])
    }
    for (const tech of data.targetTechnologies) {
      criteriaRows.push([productId, 'technology', tech])
    }

    if (criteriaRows.length > 0) {
      await connection.query(
        'INSERT INTO product_target_criteria (product_id, criteria_type, criteria_value) VALUES ?',
        [criteriaRows],
      )
    }

    // Insert test steps
    if (Array.isArray(data.whatToTry) && data.whatToTry.length > 0) {
      const stepRows = data.whatToTry.map((step, idx) => [productId, idx + 1, step])
      await connection.query(
        'INSERT INTO product_test_steps (product_id, step_order, instruction) VALUES ?',
        [stepRows],
      )
    }

    await connection.commit()

    // Fetch the newly created product
    const [rows] = await connection.execute(
      `SELECT 
         p.*, 
         u.email AS creator_email, 
         up.profile_data->>'$.displayName' AS maker_name
       FROM products p
       JOIN users u ON u.id = p.creator_id
       LEFT JOIN user_profiles up ON up.user_id = p.creator_id
       WHERE p.id = ? LIMIT 1`,
      [productId],
    )

    const [createdProduct] = await attachCriteriaAndSteps(rows, userId)
    return res.status(201).json({ product: createdProduct })
  } catch (err) {
    await connection.rollback()
    return next(err)
  } finally {
    connection.release()
  }
})

// ----------------------------------------------------------------------
// PUT /api/products/:slugOrId (Update product listing by creator)
// ----------------------------------------------------------------------
router.put('/:slugOrId', requireAuth, async (req, res, next) => {
  const allowed = new Set([
    'name', 'tagline', 'description', 'stage', 'audience', 'feedbackRequest',
    'productUrl', 'prototypeUrl', 'githubUrl', 'imageUrl', 'image', 'gallery',
    'videoUrl', 'categories', 'targetRoles', 'targetIndustries',
    'targetTechnologies', 'whatToTry', 'enrollmentLimit',
  ])
  const fieldErr = validateAllowedFields(req.body, allowed, 'product update')
  if (fieldErr) return res.status(400).json({ error: fieldErr })

  const { data, error } = validateProductInput(req.body, true)
  if (error) return res.status(400).json({ error })

  const connection = await database.getConnection()
  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    if (!userId) {
      return res.status(404).json({ error: 'Account is not synced with BuildBoard yet.' })
    }

    const { slugOrId } = req.params
    const isNumeric = /^\d+$/.test(slugOrId)
    const selectQuery = `SELECT * FROM products WHERE ${isNumeric ? 'id = ? OR slug = ?' : 'slug = ?'} LIMIT 1`
    const selectParams = isNumeric ? [Number(slugOrId), slugOrId] : [slugOrId]

    const [existing] = await connection.execute(selectQuery, selectParams)
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Product listing not found.' })
    }

    const targetProduct = existing[0]
    if (Number(targetProduct.creator_id) !== Number(userId)) {
      return res.status(403).json({ error: 'Only the creator can edit this product listing.' })
    }

    await connection.beginTransaction()

    try {
      await connection.execute(
        `UPDATE products 
         SET name = ?, tagline = ?, description = ?, stage = ?,
             audience = ?, feedback_request = ?, product_url = ?,
             github_url = ?, image_url = ?, gallery = ?, video_url = ?,
             enrollment_limit = ?
         WHERE id = ?`,
        [
          data.name,
          data.tagline,
          data.description,
          data.stage,
          data.audience,
          data.feedbackRequest,
          data.productUrl,
          data.githubUrl,
          data.imageUrl,
          data.gallery ? JSON.stringify(data.gallery) : null,
          data.videoUrl,
          data.enrollmentLimit ?? null,
          targetProduct.id,
        ],
      )
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        await connection.execute(
          `UPDATE products 
           SET name = ?, tagline = ?, description = ?, stage = ?,
               audience = ?, feedback_request = ?, product_url = ?,
               github_url = ?, image_url = ?, gallery = ?, video_url = ?
           WHERE id = ?`,
          [
            data.name,
            data.tagline,
            data.description,
            data.stage,
            data.audience,
            data.feedbackRequest,
            data.productUrl,
            data.githubUrl,
            data.imageUrl,
            data.gallery ? JSON.stringify(data.gallery) : null,
            data.videoUrl,
            targetProduct.id,
          ],
        )
      } else {
        throw err
      }
    }

    // Replace criteria
    await connection.execute('DELETE FROM product_target_criteria WHERE product_id = ?', [targetProduct.id])

    const criteriaRows = []
    for (const cat of data.categories) {
      criteriaRows.push([targetProduct.id, 'category', cat])
    }
    for (const role of data.targetRoles) {
      criteriaRows.push([targetProduct.id, 'role', role])
    }
    for (const ind of data.targetIndustries) {
      criteriaRows.push([targetProduct.id, 'industry', ind])
    }
    for (const tech of data.targetTechnologies) {
      criteriaRows.push([targetProduct.id, 'technology', tech])
    }

    if (criteriaRows.length > 0) {
      await connection.query(
        'INSERT INTO product_target_criteria (product_id, criteria_type, criteria_value) VALUES ?',
        [criteriaRows],
      )
    }

    // Replace test steps if provided
    if (Array.isArray(data.whatToTry)) {
      await connection.execute('DELETE FROM product_test_steps WHERE product_id = ?', [targetProduct.id])
      if (data.whatToTry.length > 0) {
        const stepRows = data.whatToTry.map((step, idx) => [targetProduct.id, idx + 1, step])
        await connection.query(
          'INSERT INTO product_test_steps (product_id, step_order, instruction) VALUES ?',
          [stepRows],
        )
      }
    }

    await connection.commit()

    const [rows] = await connection.execute(
      `SELECT 
         p.*, 
         u.email AS creator_email, 
         up.profile_data->>'$.displayName' AS maker_name
       FROM products p
       JOIN users u ON u.id = p.creator_id
       LEFT JOIN user_profiles up ON up.user_id = p.creator_id
       WHERE p.id = ? LIMIT 1`,
      [targetProduct.id],
    )

    const [updatedProduct] = await attachCriteriaAndSteps(rows, userId)
    return res.json({ product: updatedProduct })
  } catch (err) {
    await connection.rollback()
    return next(err)
  } finally {
    connection.release()
  }
})

// ----------------------------------------------------------------------
// PATCH /api/products/:slugOrId/pause (Toggle enrollment pause by creator)
// ----------------------------------------------------------------------
router.patch('/:slugOrId/pause', requireAuth, async (req, res, next) => {
  const allowed = new Set(['enrollmentPaused'])
  const fieldErr = validateAllowedFields(req.body, allowed, 'pause toggle')
  if (fieldErr) return res.status(400).json({ error: fieldErr })

  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    if (!userId) {
      return res.status(404).json({ error: 'Account is not synced with BuildBoard yet.' })
    }

    const { slugOrId } = req.params
    const isNumeric = /^\d+$/.test(slugOrId)
    const selectQuery = `SELECT id, slug, creator_id, enrollment_paused FROM products WHERE ${isNumeric ? 'id = ? OR slug = ?' : 'slug = ?'} LIMIT 1`
    const selectParams = isNumeric ? [Number(slugOrId), slugOrId] : [slugOrId]

    const [rows] = await database.execute(selectQuery, selectParams)
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product listing not found.' })
    }

    const targetProduct = rows[0]
    if (Number(targetProduct.creator_id) !== Number(userId)) {
      return res.status(403).json({ error: 'Only the product creator can pause or resume enrollment.' })
    }

    const nextPaused = typeof req.body?.enrollmentPaused === 'boolean'
      ? req.body.enrollmentPaused
      : !targetProduct.enrollment_paused

    await database.execute(
      'UPDATE products SET enrollment_paused = ? WHERE id = ?',
      [nextPaused, targetProduct.id],
    )

    return res.json({
      id: String(targetProduct.id),
      slug: targetProduct.slug,
      enrollmentPaused: Boolean(nextPaused),
    })
  } catch (error) {
    return next(error)
  }
})

// ----------------------------------------------------------------------
// DELETE /api/products/:slugOrId (Delete product listing by creator)
// ----------------------------------------------------------------------
router.delete('/:slugOrId', requireAuth, async (req, res, next) => {
  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    if (!userId) {
      return res.status(404).json({ error: 'Account is not synced with BuildBoard yet.' })
    }

    const { slugOrId } = req.params
    const isNumeric = /^\d+$/.test(slugOrId)
    const selectQuery = `SELECT id, creator_id FROM products WHERE ${isNumeric ? 'id = ? OR slug = ?' : 'slug = ?'} LIMIT 1`
    const selectParams = isNumeric ? [Number(slugOrId), slugOrId] : [slugOrId]

    const [rows] = await database.execute(selectQuery, selectParams)
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product listing not found.' })
    }

    const targetProduct = rows[0]
    if (Number(targetProduct.creator_id) !== Number(userId)) {
      return res.status(403).json({ error: 'Only the product creator can delete this listing.' })
    }

    await database.execute('DELETE FROM products WHERE id = ?', [targetProduct.id])

    return res.json({
      success: true,
      message: 'Product listing deleted successfully.',
    })
  } catch (error) {
    return next(error)
  }
})

// ----------------------------------------------------------------------
// POST /api/products/:slugOrId/enroll (Atomic Enrollment with Row-Level Lock)
// ----------------------------------------------------------------------
router.post('/:slugOrId/enroll', requireAuth, async (req, res, next) => {
  const connection = await database.getConnection()
  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    if (!userId) {
      return res.status(404).json({ error: 'Account is not synced with BuildBoard yet.' })
    }

    const { slugOrId } = req.params
    const isNumeric = /^\d+$/.test(slugOrId)

    await connection.beginTransaction()

    // Select and lock the product row to serialize concurrent enrollment requests
    const selectQuery = `
      SELECT id, creator_id, name, slug, product_url, enrollment_paused, enrollment_limit 
      FROM products 
      WHERE ${isNumeric ? 'id = ? OR slug = ?' : 'slug = ?'} 
      LIMIT 1 
      FOR UPDATE
    `
    const selectParams = isNumeric ? [Number(slugOrId), slugOrId] : [slugOrId]
    const [rows] = await connection.execute(selectQuery, selectParams)

    if (rows.length === 0) {
      await connection.rollback()
      return res.status(404).json({ error: 'Product listing not found.' })
    }

    const targetProduct = rows[0]
    if (Number(targetProduct.creator_id) === Number(userId)) {
      await connection.rollback()
      return res.status(400).json({ error: 'You cannot enroll in your own product.' })
    }

    // Check existing enrollment inside the lock
    const [existing] = await connection.execute(
      'SELECT id, created_at FROM product_enrollments WHERE user_id = ? AND product_id = ? LIMIT 1 FOR UPDATE',
      [userId, targetProduct.id],
    )

    // Existing testers retain access even if paused or quota reached
    if (existing.length > 0) {
      await connection.commit()
      return res.json({
        success: true,
        enrolled: true,
        enrolledAt: existing[0].created_at,
        productUrl: targetProduct.product_url,
        message: 'You are already enrolled in this prototype.',
      })
    }

    // If new enrollment and builder paused enrollment:
    if (targetProduct.enrollment_paused) {
      await connection.rollback()
      return res.status(409).json({
        error: 'Enrollment for this product is currently paused by the builder.',
      })
    }

    // If quota / enrollment limit is set, check current count within transaction
    if (targetProduct.enrollment_limit !== null && targetProduct.enrollment_limit !== undefined) {
      const [countRows] = await connection.execute(
        'SELECT COUNT(*) AS total FROM product_enrollments WHERE product_id = ? FOR UPDATE',
        [targetProduct.id],
      )
      const currentCount = Number(countRows[0]?.total || 0)
      if (currentCount >= Number(targetProduct.enrollment_limit)) {
        await connection.rollback()
        return res.status(409).json({
          error: `Testing quota reached for this prototype (${targetProduct.enrollment_limit} tester spots are full).`,
          quotaFull: true,
        })
      }
    }

    await connection.execute(
      'INSERT INTO product_enrollments (user_id, product_id) VALUES (?, ?)',
      [userId, targetProduct.id],
    )

    await connection.commit()

    // Dispatch notification outside transaction
    createNotification(database, {
      userId: targetProduct.creator_id,
      actorId: userId,
      type: 'tester_enrolled',
      title: 'New Tester Enrolled',
      body: `A new tester enrolled to test "${targetProduct.name}".`,
      linkUrl: `/products/${targetProduct.slug || targetProduct.id}`,
    })

    return res.status(201).json({
      success: true,
      enrolled: true,
      enrolledAt: new Date().toISOString(),
      productUrl: targetProduct.product_url,
      message: 'Successfully enrolled as a prototype tester!',
    })
  } catch (error) {
    await connection.rollback()
    return next(error)
  } finally {
    connection.release()
  }
})

// ----------------------------------------------------------------------
// DELETE /api/products/:slugOrId/enroll (Unenroll from testing)
// ----------------------------------------------------------------------
router.delete('/:slugOrId/enroll', requireAuth, async (req, res, next) => {
  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    if (!userId) {
      return res.status(404).json({ error: 'Account is not synced with BuildBoard yet.' })
    }

    const { slugOrId } = req.params
    const isNumeric = /^\d+$/.test(slugOrId)
    const selectQuery = `SELECT id FROM products WHERE ${isNumeric ? 'id = ? OR slug = ?' : 'slug = ?'} LIMIT 1`
    const selectParams = isNumeric ? [Number(slugOrId), slugOrId] : [slugOrId]

    const [rows] = await database.execute(selectQuery, selectParams)
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product listing not found.' })
    }

    await database.execute(
      'DELETE FROM product_enrollments WHERE user_id = ? AND product_id = ?',
      [userId, rows[0].id],
    )

    return res.json({
      success: true,
      enrolled: false,
      message: 'Successfully unenrolled from prototype testing.',
    })
  } catch (error) {
    return next(error)
  }
})

// ----------------------------------------------------------------------
// GET /api/products/:slugOrId/enrollment (Check tester enrollment status)
// ----------------------------------------------------------------------
router.get('/:slugOrId/enrollment', requireAuth, async (req, res, next) => {
  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    if (!userId) {
      return res.status(404).json({ error: 'Account is not synced with BuildBoard yet.' })
    }

    const { slugOrId } = req.params
    const isNumeric = /^\d+$/.test(slugOrId)
    const selectQuery = `SELECT id, product_url FROM products WHERE ${isNumeric ? 'id = ? OR slug = ?' : 'slug = ?'} LIMIT 1`
    const selectParams = isNumeric ? [Number(slugOrId), slugOrId] : [slugOrId]

    const [rows] = await database.execute(selectQuery, selectParams)
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product listing not found.' })
    }

    const [enrollmentRows] = await database.execute(
      'SELECT created_at FROM product_enrollments WHERE user_id = ? AND product_id = ? LIMIT 1',
      [userId, rows[0].id],
    )

    const isEnrolled = enrollmentRows.length > 0
    return res.json({
      enrolled: isEnrolled,
      enrolledAt: enrollmentRows[0]?.created_at || null,
      productUrl: isEnrolled ? rows[0].product_url : null,
    })
  } catch (error) {
    return next(error)
  }
})

function parseFeedbackReply(raw) {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// ----------------------------------------------------------------------
// POST /api/products/:slugOrId/feedback (Submit feedback on product)
// ----------------------------------------------------------------------
router.post('/:slugOrId/feedback', requireAuth, async (req, res, next) => {
  const allowed = new Set(['category', 'experience', 'likes'])
  const fieldErr = validateAllowedFields(req.body, allowed, 'feedback submission')
  if (fieldErr) return res.status(400).json({ error: fieldErr })

  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    if (!userId) {
      return res.status(404).json({ error: 'Account is not synced with BuildBoard yet.' })
    }

    const { slugOrId } = req.params
    const isNumeric = /^\d+$/.test(slugOrId)
    const selectQuery = `SELECT id, creator_id, name FROM products WHERE ${isNumeric ? 'id = ? OR slug = ?' : 'slug = ?'} LIMIT 1`
    const selectParams = isNumeric ? [Number(slugOrId), slugOrId] : [slugOrId]

    const [rows] = await database.execute(selectQuery, selectParams)
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product listing not found.' })
    }

    const product = rows[0]

    // Block owner from submitting feedback on their own product
    if (Number(product.creator_id) === Number(userId)) {
      return res.status(403).json({ error: 'You cannot submit feedback on your own prototype.' })
    }

    // Enforce enrollment
    const [enrollmentRows] = await database.execute(
      'SELECT id FROM product_enrollments WHERE user_id = ? AND product_id = ? LIMIT 1',
      [userId, product.id],
    )
    if (enrollmentRows.length === 0) {
      return res.status(403).json({ error: 'You must be enrolled as a tester before submitting feedback.' })
    }

    const { category, experience, likes } = req.body || {}
    const trimmedCategory = typeof category === 'string' ? category.trim() : ''
    const trimmedExperience = typeof experience === 'string' ? experience.trim() : ''
    const trimmedLikes = typeof likes === 'string' ? likes.trim() : ''

    if (!trimmedCategory) {
      return res.status(400).json({ error: 'Please choose a feedback category.' })
    }
    if (!trimmedExperience || trimmedExperience.length < 3) {
      return res.status(400).json({ error: 'Feedback experience must be at least 3 characters long.' })
    }
    if (trimmedExperience.length > 5000) {
      return res.status(400).json({ error: 'Feedback experience cannot exceed 5,000 characters.' })
    }
    if (trimmedLikes.length > 5000) {
      return res.status(400).json({ error: 'Feedback likes cannot exceed 5,000 characters.' })
    }

    const [insertResult] = await database.execute(
      `INSERT INTO product_feedback (product_id, user_id, category, experience, likes)
       VALUES (?, ?, ?, ?, ?)`,
      [product.id, userId, trimmedCategory, trimmedExperience, trimmedLikes || null],
    )

    const insertId = insertResult.insertId

    // Fetch author info to return complete feedback item (without email)
    const [userRows] = await database.execute(
      `SELECT 
         up.profile_data->>'$.displayName' AS display_name,
         up.profile_data->>'$.username' AS username,
         up.profile_data->>'$.roles[0]' AS primary_role
       FROM users u
       LEFT JOIN user_profiles up ON up.user_id = u.id
       WHERE u.id = ? LIMIT 1`,
      [userId],
    )

    const author = userRows[0] || {}
    const authorName = author.display_name || author.username || 'A tester'

    createNotification(database, {
      userId: product.creator_id,
      actorId: userId,
      type: 'feedback_received',
      title: 'New Feedback Received',
      body: `${authorName} submitted feedback on "${product.name}".`,
      linkUrl: `/products/${product.slug || product.id}`,
    })

    return res.status(201).json({
      success: true,
      feedback: {
        id: String(insertId),
        productId: String(product.id),
        category: trimmedCategory,
        experience: trimmedExperience,
        likes: trimmedLikes,
        isHelpful: false,
        helpfulMarkedAt: null,
        reply: null,
        createdAt: new Date().toISOString(),
        testerName: author.display_name || author.username || 'Community Tester',
        testerUsername: author.username || '',
        testerRole: author.primary_role || 'Community Tester',
      },
    })
  } catch (error) {
    return next(error)
  }
})

// ----------------------------------------------------------------------
// GET /api/products/:slugOrId/feedback (Get all feedback on product)
// ----------------------------------------------------------------------
router.get('/:slugOrId/feedback', async (req, res, next) => {
  try {
    const { slugOrId } = req.params
    const isNumeric = /^\d+$/.test(slugOrId)
    const selectQuery = `SELECT id FROM products WHERE ${isNumeric ? 'id = ? OR slug = ?' : 'slug = ?'} LIMIT 1`
    const selectParams = isNumeric ? [Number(slugOrId), slugOrId] : [slugOrId]

    const [rows] = await database.execute(selectQuery, selectParams)
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product listing not found.' })
    }

    const productId = rows[0].id

    const [feedbackRows] = await database.execute(
      `SELECT 
         pf.*,
         up.profile_data->>'$.displayName' AS display_name,
         up.profile_data->>'$.username' AS username,
         up.profile_data->>'$.roles[0]' AS primary_role,
         up.profile_data->>'$.experienceLevel' AS experience_level
       FROM product_feedback pf
       JOIN users u ON u.id = pf.user_id
       LEFT JOIN user_profiles up ON up.user_id = pf.user_id
       WHERE pf.product_id = ?
       ORDER BY pf.created_at DESC`,
      [productId],
    )

    const feedback = feedbackRows.map((r) => ({
      id: String(r.id),
      productId: String(r.product_id),
      category: r.category,
      experience: r.experience,
      likes: r.likes || '',
      isHelpful: Boolean(r.is_helpful),
      helpfulMarkedAt: r.helpful_marked_at,
      reply: parseFeedbackReply(r.builder_reply),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      testerName: r.display_name || r.username || 'Community Tester',
      testerUsername: r.username || '',
      testerRole: r.primary_role || 'Community Tester',
    }))

    return res.json({
      productId: String(productId),
      count: feedback.length,
      feedback,
    })
  } catch (error) {
    return next(error)
  }
})

export default router

