import { Router } from 'express'
import { database } from '../config/database.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { optionalAuth } from '../middleware/optionalAuth.js'
import { createNotification } from '../utils/notifications.js'

const router = Router()

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

function isValidUrl(string) {
  if (!string || typeof string !== 'string') return false
  try {
    const parsed = new URL(string.trim())
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

async function findUserId(firebaseUid) {
  const [rows] = await database.execute(
    'SELECT id FROM users WHERE firebase_uid = ? LIMIT 1',
    [firebaseUid],
  )
  return rows[0]?.id ?? null
}

function sanitizeStringArray(arr, maxItems = 30, maxLength = 100) {
  if (!Array.isArray(arr)) return []
  return [...new Set(
    arr
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0 && item.length <= maxLength)
  )].slice(0, maxItems)
}

// ----------------------------------------------------------------------
// GET /api/problems (Public catalog of problems with filters and metrics)
// ----------------------------------------------------------------------
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    let currentUserId = null
    if (req.authUser) {
      currentUserId = await findUserId(req.authUser.firebaseUid)
    }

    const { category, q, stage } = req.query
    const whereConditions = []
    const whereParams = []

    if (category && category !== 'All' && category !== 'All categories') {
      whereConditions.push('p.category = ?')
      whereParams.push(category)
    }

    if (stage) {
      whereConditions.push('p.stage = ?')
      whereParams.push(stage)
    }

    if (q && typeof q === 'string' && q.trim()) {
      const searchTerm = `%${q.trim()}%`
      whereConditions.push('(p.title LIKE ? OR p.statement LIKE ? OR p.proposed_concept LIKE ?)')
      whereParams.push(searchTerm, searchTerm, searchTerm)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const [rows] = await database.execute(
      `SELECT 
         p.*,
         u.email AS creator_email,
         up.profile_data->>'$.displayName' AS creator_name,
         up.profile_data->>'$.username' AS creator_username,
         (SELECT COUNT(*) FROM problem_validations WHERE problem_id = p.id) AS validation_count,
         (SELECT COUNT(*) FROM problem_tester_signups WHERE problem_id = p.id) AS tester_signup_count,
         (SELECT COUNT(*) FROM problem_comments WHERE problem_id = p.id) AS comment_count,
         (SELECT COUNT(*) FROM problem_solutions WHERE problem_id = p.id) AS solution_count
       FROM problems p
       JOIN users u ON u.id = p.creator_id
       LEFT JOIN user_profiles up ON up.user_id = p.creator_id
       ${whereClause}
       ORDER BY p.created_at DESC`,
      whereParams,
    )

    if (rows.length === 0) {
      return res.json({ count: 0, problems: [] })
    }

    const problemIds = rows.map((r) => r.id)
    const placeholders = problemIds.map(() => '?').join(',')

    // Fetch criteria for all returned problems
    const [criteriaRows] = await database.execute(
      `SELECT problem_id, criteria_type, criteria_value 
       FROM problem_target_criteria 
       WHERE problem_id IN (${placeholders})`,
      problemIds,
    )

    const criteriaByProblem = new Map()
    for (const c of criteriaRows) {
      if (!criteriaByProblem.has(c.problem_id)) {
        criteriaByProblem.set(c.problem_id, { roles: [], industries: [] })
      }
      const entry = criteriaByProblem.get(c.problem_id)
      if (c.criteria_type === 'role') entry.roles.push(c.criteria_value)
      if (c.criteria_type === 'industry') entry.industries.push(c.criteria_value)
    }

    // Check user validations and tester signups if signed in
    const userValidations = new Set()
    const userSignups = new Set()

    if (currentUserId) {
      const [valRows] = await database.execute(
        `SELECT problem_id FROM problem_validations WHERE user_id = ? AND problem_id IN (${placeholders})`,
        [currentUserId, ...problemIds],
      )
      valRows.forEach((v) => userValidations.add(v.problem_id))

      const [signupRows] = await database.execute(
        `SELECT problem_id FROM problem_tester_signups WHERE user_id = ? AND problem_id IN (${placeholders})`,
        [currentUserId, ...problemIds],
      )
      signupRows.forEach((s) => userSignups.add(s.problem_id))
    }

    const problems = rows.map((r) => {
      const crit = criteriaByProblem.get(r.id) || { roles: [], industries: [] }
      return {
        id: String(r.id),
        slug: r.slug,
        title: r.title,
        statement: r.statement,
        workarounds: r.workarounds || '',
        targetAudience: r.target_audience || '',
        proposedConcept: r.proposed_concept || '',
        category: r.category,
        stage: r.stage,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        creatorId: String(r.creator_id),
        creatorEmail: r.creator_email,
        maker: r.creator_name || (r.creator_email ? r.creator_email.split('@')[0] : 'Independent Builder'),
        creatorUsername: r.creator_username || '',
        isOwner: Boolean(currentUserId && Number(r.creator_id) === Number(currentUserId)),
        targetRoles: crit.roles,
        targetIndustries: crit.industries,
        validationCount: Number(r.validation_count || 0),
        testerSignupCount: Number(r.tester_signup_count || 0),
        commentCount: Number(r.comment_count || 0),
        solutionCount: Number(r.solution_count || 0),
        hasValidated: userValidations.has(r.id),
        hasSignedUp: userSignups.has(r.id),
      }
    })

    return res.json({
      count: problems.length,
      problems,
    })
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ count: 0, problems: [] })
    }
    return next(error)
  }
})

// ----------------------------------------------------------------------
// GET /api/problems/:slugOrId (Problem details, comments, validations, solutions)
// ----------------------------------------------------------------------
router.get('/:slugOrId', optionalAuth, async (req, res, next) => {
  try {
    let currentUserId = null
    if (req.authUser) {
      currentUserId = await findUserId(req.authUser.firebaseUid)
    }

    const { slugOrId } = req.params
    const isNumeric = /^\d+$/.test(slugOrId)
    const selectQuery = `
      SELECT 
        p.*,
        u.email AS creator_email,
        up.profile_data->>'$.displayName' AS creator_name,
        up.profile_data->>'$.username' AS creator_username
      FROM problems p
      JOIN users u ON u.id = p.creator_id
      LEFT JOIN user_profiles up ON up.user_id = p.creator_id
      WHERE ${isNumeric ? 'p.id = ? OR p.slug = ?' : 'p.slug = ?'}
      LIMIT 1
    `
    const selectParams = isNumeric ? [Number(slugOrId), slugOrId] : [slugOrId]
    const [rows] = await database.execute(selectQuery, selectParams)

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Problem hypothesis not found.' })
    }

    const p = rows[0]

    // Fetch criteria
    const [criteriaRows] = await database.execute(
      'SELECT criteria_type, criteria_value FROM problem_target_criteria WHERE problem_id = ?',
      [p.id],
    )
    const targetRoles = criteriaRows.filter((c) => c.criteria_type === 'role').map((c) => c.criteria_value)
    const targetIndustries = criteriaRows.filter((c) => c.criteria_type === 'industry').map((c) => c.criteria_value)

    // Fetch validations & tester signups
    const [validationRows] = await database.execute(
      `SELECT u.email, up.profile_data->>'$.displayName' AS display_name, up.profile_data->>'$.username' AS username
       FROM problem_validations pv
       JOIN users u ON u.id = pv.user_id
       LEFT JOIN user_profiles up ON up.user_id = pv.user_id
       WHERE pv.problem_id = ?`,
      [p.id],
    )

    const [signupRows] = await database.execute(
      `SELECT u.email, up.profile_data->>'$.displayName' AS display_name, up.profile_data->>'$.username' AS username
       FROM problem_tester_signups pts
       JOIN users u ON u.id = pts.user_id
       LEFT JOIN user_profiles up ON up.user_id = pts.user_id
       WHERE pts.problem_id = ?`,
      [p.id],
    )

    // Check current user status
    let hasValidated = false
    let hasSignedUp = false
    if (currentUserId) {
      const [userVal] = await database.execute(
        'SELECT id FROM problem_validations WHERE problem_id = ? AND user_id = ? LIMIT 1',
        [p.id, currentUserId],
      )
      hasValidated = userVal.length > 0

      const [userSign] = await database.execute(
        'SELECT id FROM problem_tester_signups WHERE problem_id = ? AND user_id = ? LIMIT 1',
        [p.id, currentUserId],
      )
      hasSignedUp = userSign.length > 0
    }

    // Fetch nested comments
    const [commentRows] = await database.execute(
      `SELECT 
         pc.*,
         u.email AS author_email,
         up.profile_data->>'$.displayName' AS author_name,
         up.profile_data->>'$.username' AS author_username
       FROM problem_comments pc
       JOIN users u ON u.id = pc.user_id
       LEFT JOIN user_profiles up ON up.user_id = pc.user_id
       WHERE pc.problem_id = ?
       ORDER BY pc.created_at ASC`,
      [p.id],
    )

    const comments = commentRows.map((c) => ({
      id: String(c.id),
      parentId: c.parent_id ? String(c.parent_id) : null,
      replyToAuthor: c.reply_to_author || null,
      text: c.text,
      createdAt: c.created_at,
      authorEmail: c.author_email,
      authorName: c.author_name || (c.author_email ? c.author_email.split('@')[0] : 'Contributor'),
      authorUsername: c.author_username || '',
      isMakerReply: Number(c.user_id) === Number(p.creator_id),
    }))

    // Fetch solutions attached
    const [solutionRows] = await database.execute(
      `SELECT 
         ps.*,
         u.email AS author_email,
         up.profile_data->>'$.displayName' AS author_name,
         up.profile_data->>'$.username' AS author_username,
         prod.slug AS product_slug,
         prod.name AS product_name
       FROM problem_solutions ps
       JOIN users u ON u.id = ps.user_id
       LEFT JOIN user_profiles up ON up.user_id = ps.user_id
       LEFT JOIN products prod ON prod.id = ps.product_id
       WHERE ps.problem_id = ?
       ORDER BY ps.created_at DESC`,
      [p.id],
    )

    const solutions = solutionRows.map((s) => ({
      id: String(s.id),
      title: s.title,
      description: s.description || '',
      productId: s.product_id ? String(s.product_id) : null,
      productSlug: s.product_slug || null,
      productName: s.product_name || null,
      productUrl: s.product_url || '',
      authorEmail: s.author_email,
      authorName: s.author_name || (s.author_email ? s.author_email.split('@')[0] : 'Maker'),
      authorUsername: s.author_username || '',
      isMaker: Number(s.user_id) === Number(p.creator_id),
      createdAt: s.created_at,
    }))

    return res.json({
      problem: {
        id: String(p.id),
        slug: p.slug,
        title: p.title,
        statement: p.statement,
        workarounds: p.workarounds || '',
        targetAudience: p.target_audience || '',
        proposedConcept: p.proposed_concept || '',
        category: p.category,
        stage: p.stage,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        creatorId: String(p.creator_id),
        creatorEmail: p.creator_email,
        maker: p.creator_name || (p.creator_email ? p.creator_email.split('@')[0] : 'Independent Builder'),
        creatorUsername: p.creator_username || '',
        isOwner: Boolean(currentUserId && Number(p.creator_id) === Number(currentUserId)),
        targetRoles,
        targetIndustries,
        validationCount: validationRows.length,
        testerSignupCount: signupRows.length,
        commentCount: comments.length,
        solutionCount: solutions.length,
        hasValidated,
        hasSignedUp,
        validatedBy: validationRows.map((v) => v.email),
        testerSignups: signupRows.map((s) => s.email),
        comments,
        solutions,
      },
    })
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(404).json({ error: 'Problems table not yet migrated.' })
    }
    return next(error)
  }
})

// ----------------------------------------------------------------------
// POST /api/problems (Create problem hypothesis)
// ----------------------------------------------------------------------
router.post('/', requireAuth, async (req, res, next) => {
  const connection = await database.getConnection()
  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    if (!userId) {
      return res.status(404).json({ error: 'Account is not synced with BuildBoard yet.' })
    }

    const {
      title,
      statement,
      workarounds,
      targetAudience,
      proposedConcept,
      category,
      targetRoles,
      targetIndustries,
    } = req.body || {}

    const trimmedTitle = typeof title === 'string' ? title.trim() : ''
    const trimmedStatement = typeof statement === 'string' ? statement.trim() : ''
    const trimmedWorkarounds = typeof workarounds === 'string' ? workarounds.trim() : ''
    const trimmedTargetAudience = typeof targetAudience === 'string' ? targetAudience.trim() : ''
    const trimmedProposedConcept = typeof proposedConcept === 'string' ? proposedConcept.trim() : ''
    const selectedCategory = typeof category === 'string' && category.trim() ? category.trim() : 'Developer Tools'

    if (!trimmedTitle || trimmedTitle.length < 5 || trimmedTitle.length > 255) {
      return res.status(400).json({ error: 'Title is required (between 5 and 255 characters).' })
    }
    if (!trimmedStatement || trimmedStatement.length < 10 || trimmedStatement.length > 5000) {
      return res.status(400).json({ error: 'Problem statement is required (between 10 and 5,000 characters).' })
    }
    if (trimmedWorkarounds.length > 5000) {
      return res.status(400).json({ error: 'Workarounds text cannot exceed 5,000 characters.' })
    }
    if (trimmedProposedConcept.length > 5000) {
      return res.status(400).json({ error: 'Proposed concept cannot exceed 5,000 characters.' })
    }

    const cleanRoles = sanitizeStringArray(targetRoles)
    const cleanIndustries = sanitizeStringArray(targetIndustries)

    // Generate unique slug
    let baseSlug = slugify(trimmedTitle) || 'problem'
    let slug = baseSlug
    const [existing] = await connection.execute(
      'SELECT id FROM problems WHERE slug = ? LIMIT 1',
      [slug],
    )
    if (existing.length > 0) {
      slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`
    }

    await connection.beginTransaction()

    const [insertResult] = await connection.execute(
      `INSERT INTO problems (
         slug, creator_id, title, statement, workarounds, 
         target_audience, proposed_concept, category, stage
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        slug,
        userId,
        trimmedTitle,
        trimmedStatement,
        trimmedWorkarounds || null,
        trimmedTargetAudience || null,
        trimmedProposedConcept || null,
        selectedCategory,
        'Validating Need',
      ],
    )

    const problemId = insertResult.insertId

    // Insert criteria
    for (const role of cleanRoles) {
      await connection.execute(
        'INSERT INTO problem_target_criteria (problem_id, criteria_type, criteria_value) VALUES (?, ?, ?)',
        [problemId, 'role', role],
      )
    }
    for (const industry of cleanIndustries) {
      await connection.execute(
        'INSERT INTO problem_target_criteria (problem_id, criteria_type, criteria_value) VALUES (?, ?, ?)',
        [problemId, 'industry', industry],
      )
    }

    // Auto-validate by author
    await connection.execute(
      'INSERT INTO problem_validations (problem_id, user_id) VALUES (?, ?)',
      [problemId, userId],
    )

    await connection.commit()

    // Fetch creator profile
    const [userRows] = await database.execute(
      `SELECT u.email, up.profile_data->>'$.displayName' AS display_name, up.profile_data->>'$.username' AS username
       FROM users u
       LEFT JOIN user_profiles up ON up.user_id = u.id
       WHERE u.id = ? LIMIT 1`,
      [userId],
    )
    const author = userRows[0] || {}

    return res.status(201).json({
      success: true,
      problem: {
        id: String(problemId),
        slug,
        title: trimmedTitle,
        statement: trimmedStatement,
        workarounds: trimmedWorkarounds,
        targetAudience: trimmedTargetAudience,
        proposedConcept: trimmedProposedConcept,
        category: selectedCategory,
        stage: 'Validating Need',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        creatorId: String(userId),
        creatorEmail: author.email || req.authUser.email,
        maker: author.display_name || (author.email ? author.email.split('@')[0] : 'Independent Builder'),
        creatorUsername: author.username || '',
        isOwner: true,
        targetRoles: cleanRoles,
        targetIndustries: cleanIndustries,
        validationCount: 1,
        testerSignupCount: 0,
        commentCount: 0,
        solutionCount: 0,
        hasValidated: true,
        hasSignedUp: false,
        validatedBy: [author.email || req.authUser.email],
        testerSignups: [],
        comments: [],
        solutions: [],
      },
    })
  } catch (error) {
    await connection.rollback()
    return next(error)
  } finally {
    connection.release()
  }
})

// ----------------------------------------------------------------------
// DELETE /api/problems/:slugOrId (Delete problem hypothesis by originator)
// ----------------------------------------------------------------------
router.delete('/:slugOrId', requireAuth, async (req, res, next) => {
  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    if (!userId) {
      return res.status(404).json({ error: 'Account is not synced with BuildBoard yet.' })
    }

    const { slugOrId } = req.params
    const isNumeric = /^\d+$/.test(slugOrId)
    const selectQuery = `SELECT id, creator_id FROM problems WHERE ${isNumeric ? 'id = ? OR slug = ?' : 'slug = ?'} LIMIT 1`
    const selectParams = isNumeric ? [Number(slugOrId), slugOrId] : [slugOrId]

    const [rows] = await database.execute(selectQuery, selectParams)
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Problem hypothesis not found.' })
    }

    const problem = rows[0]
    if (Number(problem.creator_id) !== Number(userId)) {
      return res.status(403).json({ error: 'Only the originator who posted this hypothesis can delete it.' })
    }

    await database.execute('DELETE FROM problems WHERE id = ?', [problem.id])

    return res.json({
      success: true,
      message: 'Problem hypothesis deleted successfully.',
    })
  } catch (error) {
    return next(error)
  }
})

// ----------------------------------------------------------------------
// POST /api/problems/:slugOrId/validate (Toggle 1-click validation upvote)
// ----------------------------------------------------------------------
router.post('/:slugOrId/validate', requireAuth, async (req, res, next) => {
  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    if (!userId) {
      return res.status(404).json({ error: 'Account is not synced with BuildBoard yet.' })
    }

    const { slugOrId } = req.params
    const isNumeric = /^\d+$/.test(slugOrId)
    const selectQuery = `SELECT id, creator_id, title, slug FROM problems WHERE ${isNumeric ? 'id = ? OR slug = ?' : 'slug = ?'} LIMIT 1`
    const selectParams = isNumeric ? [Number(slugOrId), slugOrId] : [slugOrId]

    const [rows] = await database.execute(selectQuery, selectParams)
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Problem hypothesis not found.' })
    }

    const problem = rows[0]
    const problemId = problem.id

    const [existing] = await database.execute(
      'SELECT id FROM problem_validations WHERE problem_id = ? AND user_id = ? LIMIT 1',
      [problemId, userId],
    )

    let hasValidated = false
    if (existing.length > 0) {
      await database.execute(
        'DELETE FROM problem_validations WHERE problem_id = ? AND user_id = ?',
        [problemId, userId],
      )
      hasValidated = false
    } else {
      await database.execute(
        'INSERT INTO problem_validations (problem_id, user_id) VALUES (?, ?)',
        [problemId, userId],
      )
      hasValidated = true

      createNotification(database, {
        userId: problem.creator_id,
        actorId: userId,
        type: 'problem_validation',
        title: 'Problem Hypothesis Validated',
        body: `Someone validated your problem hypothesis: "${problem.title}".`,
        linkUrl: `/problems/${problem.slug || problem.id}`,
      })
    }

    const [countRows] = await database.execute(
      'SELECT COUNT(*) AS total FROM problem_validations WHERE problem_id = ?',
      [problemId],
    )

    return res.json({
      success: true,
      hasValidated,
      validationCount: Number(countRows[0].total || 0),
    })
  } catch (error) {
    return next(error)
  }
})

// ----------------------------------------------------------------------
// POST /api/problems/:slugOrId/tester-signup (Toggle early tester waitlist signup)
// ----------------------------------------------------------------------
router.post('/:slugOrId/tester-signup', requireAuth, async (req, res, next) => {
  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    if (!userId) {
      return res.status(404).json({ error: 'Account is not synced with BuildBoard yet.' })
    }

    const { slugOrId } = req.params
    const isNumeric = /^\d+$/.test(slugOrId)
    const selectQuery = `SELECT id, creator_id, title, slug FROM problems WHERE ${isNumeric ? 'id = ? OR slug = ?' : 'slug = ?'} LIMIT 1`
    const selectParams = isNumeric ? [Number(slugOrId), slugOrId] : [slugOrId]

    const [rows] = await database.execute(selectQuery, selectParams)
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Problem hypothesis not found.' })
    }

    const problem = rows[0]
    const problemId = problem.id

    const [existing] = await database.execute(
      'SELECT id FROM problem_tester_signups WHERE problem_id = ? AND user_id = ? LIMIT 1',
      [problemId, userId],
    )

    let hasSignedUp = false
    if (existing.length > 0) {
      await database.execute(
        'DELETE FROM problem_tester_signups WHERE problem_id = ? AND user_id = ?',
        [problemId, userId],
      )
      hasSignedUp = false
    } else {
      await database.execute(
        'INSERT INTO problem_tester_signups (problem_id, user_id) VALUES (?, ?)',
        [problemId, userId],
      )
      hasSignedUp = true

      createNotification(database, {
        userId: problem.creator_id,
        actorId: userId,
        type: 'problem_signup',
        title: 'New Tester Waitlist Signup',
        body: `A tester joined the early testing waitlist for "${problem.title}".`,
        linkUrl: `/problems/${problem.slug || problem.id}`,
      })
    }

    const [countRows] = await database.execute(
      'SELECT COUNT(*) AS total FROM problem_tester_signups WHERE problem_id = ?',
      [problemId],
    )

    return res.json({
      success: true,
      hasSignedUp,
      signupCount: Number(countRows[0].total || 0),
    })
  } catch (error) {
    return next(error)
  }
})

// ----------------------------------------------------------------------
// POST /api/problems/:slugOrId/comments (Add nested comment or reply)
// ----------------------------------------------------------------------
router.post('/:slugOrId/comments', requireAuth, async (req, res, next) => {
  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    if (!userId) {
      return res.status(404).json({ error: 'Account is not synced with BuildBoard yet.' })
    }

    const { slugOrId } = req.params
    const isNumeric = /^\d+$/.test(slugOrId)
    const selectQuery = `SELECT id, creator_id, title, slug FROM problems WHERE ${isNumeric ? 'id = ? OR slug = ?' : 'slug = ?'} LIMIT 1`
    const selectParams = isNumeric ? [Number(slugOrId), slugOrId] : [slugOrId]

    const [rows] = await database.execute(selectQuery, selectParams)
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Problem hypothesis not found.' })
    }

    const problem = rows[0]
    const { text, parentId, replyToAuthor } = req.body || {}
    const trimmedText = typeof text === 'string' ? text.trim() : ''

    if (!trimmedText || trimmedText.length < 2 || trimmedText.length > 5000) {
      return res.status(400).json({ error: 'Comment must be between 2 and 5,000 characters long.' })
    }

    let validParentId = null
    let parentAuthorUserId = null
    if (parentId) {
      const [parentRows] = await database.execute(
        'SELECT id, user_id FROM problem_comments WHERE id = ? AND problem_id = ? LIMIT 1',
        [Number(parentId), problem.id],
      )
      if (parentRows.length > 0) {
        validParentId = parentRows[0].id
        parentAuthorUserId = parentRows[0].user_id
      }
    }

    const [insertResult] = await database.execute(
      `INSERT INTO problem_comments (problem_id, user_id, parent_id, reply_to_author, text)
       VALUES (?, ?, ?, ?, ?)`,
      [problem.id, userId, validParentId, replyToAuthor || null, trimmedText],
    )

    const commentId = insertResult.insertId

    // Fetch author info
    const [userRows] = await database.execute(
      `SELECT u.email, up.profile_data->>'$.displayName' AS display_name, up.profile_data->>'$.username' AS username
       FROM users u
       LEFT JOIN user_profiles up ON up.user_id = u.id
       WHERE u.id = ? LIMIT 1`,
      [userId],
    )
    const author = userRows[0] || {}
    const authorName = author.display_name || (author.email ? author.email.split('@')[0] : 'A contributor')

    // Dispatch notifications
    createNotification(database, {
      userId: problem.creator_id,
      actorId: userId,
      type: 'problem_comment',
      title: 'New Comment on Problem Hypothesis',
      body: `${authorName} commented on "${problem.title}": "${trimmedText.slice(0, 80)}${trimmedText.length > 80 ? '...' : ''}"`,
      linkUrl: `/problems/${problem.slug || problem.id}`,
    })

    if (parentAuthorUserId && Number(parentAuthorUserId) !== Number(problem.creator_id)) {
      createNotification(database, {
        userId: parentAuthorUserId,
        actorId: userId,
        type: 'comment_reply',
        title: 'New Reply to Your Comment',
        body: `${authorName} replied to your comment on "${problem.title}".`,
        linkUrl: `/problems/${problem.slug || problem.id}`,
      })
    }

    return res.status(201).json({
      success: true,
      comment: {
        id: String(commentId),
        parentId: validParentId ? String(validParentId) : null,
        replyToAuthor: replyToAuthor || null,
        text: trimmedText,
        createdAt: new Date().toISOString(),
        authorEmail: author.email || req.authUser.email,
        authorName: author.display_name || (author.email ? author.email.split('@')[0] : 'Contributor'),
        authorUsername: author.username || '',
        isMakerReply: Number(userId) === Number(problem.creator_id),
      },
    })
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(404).json({ error: 'Problems table not yet migrated.' })
    }
    return next(error)
  }
})

// ----------------------------------------------------------------------
// POST /api/problems/:slugOrId/solutions (Attach prototype solution)
// ----------------------------------------------------------------------
router.post('/:slugOrId/solutions', requireAuth, async (req, res, next) => {
  try {
    const userId = await findUserId(req.authUser.firebaseUid)
    if (!userId) {
      return res.status(404).json({ error: 'Account is not synced with BuildBoard yet.' })
    }

    const { slugOrId } = req.params
    const isNumeric = /^\d+$/.test(slugOrId)
    const selectQuery = `SELECT id, creator_id, stage FROM problems WHERE ${isNumeric ? 'id = ? OR slug = ?' : 'slug = ?'} LIMIT 1`
    const selectParams = isNumeric ? [Number(slugOrId), slugOrId] : [slugOrId]

    const [rows] = await database.execute(selectQuery, selectParams)
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Problem hypothesis not found.' })
    }

    const problem = rows[0]
    const { title, description, productUrl, productId } = req.body || {}
    const trimmedTitle = typeof title === 'string' ? title.trim() : ''
    const trimmedDescription = typeof description === 'string' ? description.trim() : ''
    const trimmedUrl = typeof productUrl === 'string' ? productUrl.trim() : ''

    if (!trimmedTitle || trimmedTitle.length < 2 || trimmedTitle.length > 255) {
      return res.status(400).json({ error: 'Solution title is required (between 2 and 255 characters).' })
    }

    if (trimmedUrl && !isValidUrl(trimmedUrl)) {
      return res.status(400).json({ error: 'Please enter a valid URL (e.g. https://example.com).' })
    }

    let linkedProductId = null
    let productDetails = null
    if (productId) {
      const [prodRows] = await database.execute(
        'SELECT id, slug, name, product_url FROM products WHERE id = ? OR slug = ? LIMIT 1',
        [/^\d+$/.test(productId) ? Number(productId) : 0, productId],
      )
      if (prodRows.length > 0) {
        linkedProductId = prodRows[0].id
        productDetails = prodRows[0]
      }
    }

    const [insertResult] = await database.execute(
      `INSERT INTO problem_solutions (problem_id, user_id, product_id, title, description, product_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        problem.id,
        userId,
        linkedProductId,
        trimmedTitle,
        trimmedDescription || null,
        trimmedUrl || (productDetails?.product_url || null),
      ],
    )

    const solutionId = insertResult.insertId

    // Advance stage to Prototyping if in Validating Need
    if (problem.stage === 'Validating Need') {
      await database.execute('UPDATE problems SET stage = ? WHERE id = ?', ['Prototyping', problem.id])
    }

    // Fetch author info
    const [userRows] = await database.execute(
      `SELECT u.email, up.profile_data->>'$.displayName' AS display_name, up.profile_data->>'$.username' AS username
       FROM users u
       LEFT JOIN user_profiles up ON up.user_id = u.id
       WHERE u.id = ? LIMIT 1`,
      [userId],
    )
    const author = userRows[0] || {}

    return res.status(201).json({
      success: true,
      solution: {
        id: String(solutionId),
        title: trimmedTitle,
        description: trimmedDescription,
        productId: linkedProductId ? String(linkedProductId) : null,
        productSlug: productDetails?.slug || null,
        productName: productDetails?.name || null,
        productUrl: trimmedUrl || productDetails?.product_url || '',
        authorEmail: author.email || req.authUser.email,
        authorName: author.display_name || (author.email ? author.email.split('@')[0] : 'Maker'),
        authorUsername: author.username || '',
        isMaker: Number(userId) === Number(problem.creator_id),
        createdAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(404).json({ error: 'Problems table not yet migrated.' })
    }
    return next(error)
  }
})

export default router
