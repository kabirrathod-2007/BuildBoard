/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { products as initialSeedProducts } from '../data/products'
import { seedProblems as initialSeedProblems } from '../data/problems'
import { apiPublishProduct, apiSubmitFeedback } from '../services/apiClient'

const DemoDataContext = createContext(null)

export const useDemoData = () => {
  const context = useContext(DemoDataContext)
  if (!context) {
    throw new Error('useDemoData must be used within a DemoDataProvider')
  }
  return context
}

const PRODUCTS_STORAGE_KEY = 'buildboard_demo_custom_products'
const ENROLLMENTS_STORAGE_KEY = 'buildboard_demo_enrollments'
const FEEDBACK_STORAGE_KEY = 'buildboard_demo_feedback'
const VIEWS_STORAGE_KEY = 'buildboard_demo_views'
const PROFILES_STORAGE_KEY = 'buildboard_demo_profiles'
const REMINDER_DISMISSALS_STORAGE_KEY = 'buildboard_demo_reminder_dismissals'
const PROBLEMS_STORAGE_KEY = 'buildboard_demo_problems'

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

export const DemoDataProvider = ({ children }) => {
  // Cloud REST API sync state
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState({
    status: 'idle',
    message: 'Cloud REST API ready',
    lastSyncedAt: null,
  })

  // Custom products created on this device
  const [customProducts, setCustomProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY)
      if (!saved) return []
      const parsed = JSON.parse(saved)
      const UNSPLASH_FALLBACK = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80'
      // Clean up legacy fallback image from products created without an image
      return parsed.map((p) => {
        let updated = p
        if (p.image === UNSPLASH_FALLBACK) {
          updated = { ...updated, image: '' }
        }
        if (Array.isArray(updated.gallery)) {
          const cleanedGallery = updated.gallery.filter((g) => g !== UNSPLASH_FALLBACK)
          if (cleanedGallery.length !== updated.gallery.length) {
            updated = { ...updated, gallery: cleanedGallery }
          }
        }
        return updated
      })
    } catch {
      return []
    }
  })

  // Enrollments mapping: key is "userEmail:productId", value is timestamp
  const [enrollments, setEnrollments] = useState(() => {
    try {
      const saved = localStorage.getItem(ENROLLMENTS_STORAGE_KEY)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  // Feedback list: array of feedback objects
  const [feedbackList, setFeedbackList] = useState(() => {
    try {
      const saved = localStorage.getItem(FEEDBACK_STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Views mapping: key is productId, value is total view count
  const [views, setViews] = useState(() => {
    try {
      const saved = localStorage.getItem(VIEWS_STORAGE_KEY)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })


  // Synchronize custom products to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(customProducts))
    } catch (e) {
      console.error('Failed to sync demo products to localStorage', e)
    }
  }, [customProducts])

  // Synchronize enrollments to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ENROLLMENTS_STORAGE_KEY, JSON.stringify(enrollments))
    } catch (e) {
      console.error('Failed to sync demo enrollments to localStorage', e)
    }
  }, [enrollments])

  // Synchronize feedback to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedbackList))
    } catch (e) {
      console.error('Failed to sync demo feedback to localStorage', e)
    }
  }, [feedbackList])

  // Synchronize views to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(views))
    } catch (e) {
      console.error('Failed to sync demo views to localStorage', e)
    }
  }, [views])


  // Profiles mapping: key is normalized email, value is profile object
  const [profiles, setProfiles] = useState(() => {
    try {
      const saved = localStorage.getItem(PROFILES_STORAGE_KEY)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  // Synchronize profiles to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles))
    } catch (e) {
      console.error('Failed to sync demo profiles to localStorage', e)
    }
  }, [profiles])

  // Reminder dismissals mapping: key is "userEmail:productId", value is dismissal timestamp
  const [reminderDismissals, setReminderDismissals] = useState(() => {
    try {
      const saved = localStorage.getItem(REMINDER_DISMISSALS_STORAGE_KEY)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  // Synchronize reminder dismissals to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(REMINDER_DISMISSALS_STORAGE_KEY, JSON.stringify(reminderDismissals))
    } catch (e) {
      console.error('Failed to sync reminder dismissals to localStorage', e)
    }
  }, [reminderDismissals])

  // Combined product list (user-submitted and edited demo products override seed products, then remaining seed products)
  const products = useMemo(() => {
    const customIds = new Set(customProducts.map((p) => p.id))
    const remainingSeed = initialSeedProducts.filter((p) => !customIds.has(p.id))
    const all = [...customProducts, ...remainingSeed]
    return all.map((p) => {
      const email = (p.creatorEmail || '').toLowerCase().trim()
      if (email && profiles[email]?.displayName?.trim()) {
        return {
          ...p,
          maker: profiles[email].displayName.trim(),
        }
      }
      return p
    })
  }, [customProducts, profiles])

  const addProduct = (formData) => {
    const baseSlug = slugify(formData.name) || 'product'
    let id = baseSlug
    if (products.some((p) => p.id === id)) {
      id = `${baseSlug}-${Date.now().toString().slice(-4)}`
    }

    const creatorEmail = (formData.creatorEmail || '').toLowerCase().trim()

    const newProduct = {
      id,
      name: formData.name.trim(),
      tagline: formData.tagline.trim(),
      description: formData.description ? formData.description.trim() : formData.tagline.trim(),
      stage: 'Working prototype',
      maker: formData.maker || (creatorEmail ? profiles[creatorEmail]?.displayName?.trim() : null) || (creatorEmail ? creatorEmail.split('@')[0] : 'Builder'),
      creatorEmail,
      categories: formData.categories && formData.categories.length > 0 ? formData.categories : ['Other'],
      audience: formData.audience.trim(),
      targetRoles: Array.isArray(formData.targetRoles) ? formData.targetRoles : [],
      targetIndustries: Array.isArray(formData.targetIndustries) ? formData.targetIndustries : [],
      targetTechnologies: Array.isArray(formData.targetTechnologies) ? formData.targetTechnologies : [],
      feedbackRequest: formData.feedbackRequest.trim(),
      whatToTry: [
        'Test the core prototype workflow',
        'Check for usability friction or confusing steps',
        'Share what you expected to happen vs what occurred',
      ],
      image: formData.image ? formData.image.trim() : '',
      mediaId: formData.mediaId || null,
      gallery: Array.isArray(formData.gallery) ? formData.gallery : [],
      galleryMediaIds: Array.isArray(formData.galleryMediaIds) ? formData.galleryMediaIds : [],
      videoUrl: formData.videoUrl ? formData.videoUrl.trim() : '',
      videoMediaId: formData.videoMediaId || null,
      githubUrl: formData.githubUrl ? formData.githubUrl.trim() : '',
      productUrl: formData.prototypeUrl ? formData.prototypeUrl.trim() : '',
      isLocalDemo: true,
      enrollmentPaused: false,
      createdAt: new Date().toISOString(),
    }

    setCustomProducts((prev) => [newProduct, ...prev])

    // Background asynchronous sync to Cloud REST API (Optimistic UI pattern)
    setIsSyncing(true)
    setSyncStatus({ status: 'syncing', message: 'Publishing prototype to cloud registry...', lastSyncedAt: null })
    apiPublishProduct(newProduct)
      .then((res) => {
        if (res.success) {
          setSyncStatus({
            status: 'synced',
            message: 'Product synced with cloud registry',
            lastSyncedAt: new Date().toISOString(),
          })
        } else {
          setSyncStatus({
            status: 'fallback',
            message: 'Saved locally (Offline/Fallback mode)',
            lastSyncedAt: new Date().toISOString(),
          })
        }
      })
      .catch((err) => {
        console.warn('apiPublishProduct sync warning:', err)
        setSyncStatus({
          status: 'fallback',
          message: 'Saved locally',
          lastSyncedAt: new Date().toISOString(),
        })
      })
      .finally(() => {
        setIsSyncing(false)
      })

    return newProduct
  }

  // --- Views Tracking ---
  const recordProductView = (productId) => {
    if (!productId) return
    setViews((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }))
  }

  const getProductViewCount = (productId) => {
    if (!productId) return 0
    return views[productId] || 0
  }


  // --- Enrollments Tracking ---
  const enrollInProduct = (productId, userEmail) => {
    if (!productId || !userEmail) return { success: false, error: 'User and product ID are required.' }
    const product = products.find((p) => p.id === productId)
    if (product?.creatorEmail && product.creatorEmail.toLowerCase().trim() === userEmail.toLowerCase().trim()) {
      return { success: false, error: 'You are the creator of this product.' }
    }
    if (product?.enrollmentPaused) {
      return { success: false, error: 'Enrollment for this product is currently paused by the builder.' }
    }
    const key = `${userEmail.toLowerCase().trim()}:${productId}`
    setEnrollments((prev) => ({
      ...prev,
      [key]: new Date().toISOString(),
    }))
    return { success: true }
  }

  const isEnrolledInProduct = (productId, userEmail) => {
    if (!productId || !userEmail) return false
    const key = `${userEmail.toLowerCase().trim()}:${productId}`
    return Boolean(enrollments[key])
  }

  const getProductEnrollmentCount = (productId) => {
    if (!productId) return 0
    return Object.keys(enrollments).filter((key) => key.endsWith(`:${productId}`)).length
  }

  const getEnrollmentDate = useCallback((productId, userEmail) => {
    if (!productId || !userEmail) return null
    const key = `${userEmail.toLowerCase().trim()}:${productId}`
    return enrollments[key] || null
  }, [enrollments])

  const dismissFeedbackReminder = (productId, userEmail) => {
    if (!productId || !userEmail) return
    const key = `${userEmail.toLowerCase().trim()}:${productId}`
    setReminderDismissals((prev) => ({
      ...prev,
      [key]: new Date().toISOString(),
    }))
  }

  const isFeedbackReminderDismissed = useCallback((productId, userEmail) => {
    if (!productId || !userEmail) return false
    const key = `${userEmail.toLowerCase().trim()}:${productId}`
    const dismissedAt = reminderDismissals[key]
    if (!dismissedAt) return false
    const enrolledAt = enrollments[key]
    if (enrolledAt && new Date(dismissedAt) < new Date(enrolledAt)) {
      return false
    }
    return true
  }, [reminderDismissals, enrollments])

  // --- Feedback Tracking ---
  const addFeedback = ({ productId, userEmail, category, experience, likes }) => {
    const newFeedback = {
      id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId,
      userEmail: userEmail || 'member@example.com',
      category,
      experience: experience.trim(),
      likes: likes ? likes.trim() : '',
      createdAt: new Date().toISOString(),
      isLocalDemo: true,
    }

    setFeedbackList((prev) => [newFeedback, ...prev])

    // Background asynchronous sync to Cloud REST API (Optimistic UI pattern)
    setIsSyncing(true)
    apiSubmitFeedback(newFeedback)
      .then((res) => {
        if (res.success) {
          setSyncStatus({
            status: 'synced',
            message: 'Critique synced to cloud registry',
            lastSyncedAt: new Date().toISOString(),
          })
        }
      })
      .catch((err) => {
        console.warn('apiSubmitFeedback sync warning:', err)
      })
      .finally(() => {
        setIsSyncing(false)
      })

    return newFeedback
  }

  const getProductFeedback = (productId) => {
    return feedbackList.filter((fb) => fb.productId === productId)
  }

  // --- Product Ownership Verification ---
  const isProductOwner = (productId, userEmail) => {
    if (!productId || !userEmail) return false
    const normalized = userEmail.toLowerCase().trim()
    const product = products.find((p) => p.id === productId)
    if (!product || !product.creatorEmail) return false
    return product.creatorEmail.toLowerCase().trim() === normalized
  }

  // --- Builder Reply to Feedback ---
  const replyToFeedback = (feedbackId, userEmail, replyText) => {
    if (!feedbackId || !userEmail) {
      return { success: false, error: 'User and feedback ID are required.' }
    }
    const targetFeedback = feedbackList.find((fb) => fb.id === feedbackId)
    if (!targetFeedback) {
      return { success: false, error: 'Feedback record not found.' }
    }
    if (!isProductOwner(targetFeedback.productId, userEmail)) {
      return { success: false, error: 'Only the product owner can reply to this feedback.' }
    }

    const trimmed = (replyText || '').trim()
    if (!trimmed) {
      return { success: false, error: 'Reply text cannot be blank.' }
    }
    if (trimmed.length < 3) {
      return { success: false, error: 'Reply is too short (minimum 3 characters).' }
    }
    if (trimmed.length > 1000) {
      return { success: false, error: 'Reply exceeds maximum length of 1,000 characters.' }
    }

    const product = products.find((p) => p.id === targetFeedback.productId)
    const userProfile = profiles[userEmail.toLowerCase().trim()]
    const replierName = userProfile?.displayName?.trim() || product?.maker || userEmail.split('@')[0]

    let updatedRecord = null
    setFeedbackList((prev) =>
      prev.map((fb) => {
        if (fb.id === feedbackId) {
          const isEdit = Boolean(fb.reply)
          const newReply = {
            text: trimmed,
            repliedBy: replierName,
            repliedAt: isEdit ? fb.reply.repliedAt : new Date().toISOString(),
            updatedAt: isEdit ? new Date().toISOString() : undefined,
          }
          updatedRecord = {
            ...fb,
            reply: newReply,
          }
          return updatedRecord
        }
        return fb
      })
    )

    return { success: true, feedback: updatedRecord }
  }

  // --- Helpful Feedback Recognition Toggle ---
  const toggleFeedbackHelpful = (feedbackId, userEmail) => {
    if (!feedbackId || !userEmail) {
      return { success: false, error: 'User and feedback ID are required.' }
    }
    const targetFeedback = feedbackList.find((fb) => fb.id === feedbackId)
    if (!targetFeedback) {
      return { success: false, error: 'Feedback record not found.' }
    }
    if (!isProductOwner(targetFeedback.productId, userEmail)) {
      return { success: false, error: 'Only the product owner can mark feedback as helpful.' }
    }

    let nextState = false
    setFeedbackList((prev) =>
      prev.map((fb) => {
        if (fb.id === feedbackId) {
          nextState = !fb.isHelpful
          return {
            ...fb,
            isHelpful: nextState,
            helpfulMarkedAt: nextState ? new Date().toISOString() : undefined,
          }
        }
        return fb
      })
    )

    return { success: true, isHelpful: nextState }
  }

  // --- Derive Tester Recognition (Always computed from helpful marks to prevent drift) ---
  const getTesterRecognition = (userEmail) => {
    if (!userEmail) {
      return { totalPoints: 0, helpfulCount: 0, items: [] }
    }
    const normalized = userEmail.toLowerCase().trim()
    const helpfulItems = feedbackList
      .filter(
        (fb) => fb.userEmail && fb.userEmail.toLowerCase().trim() === normalized && fb.isHelpful
      )
      .map((fb) => ({
        ...fb,
        product: products.find((p) => p.id === fb.productId) || null,
      }))
    return {
      totalPoints: helpfulItems.length,
      helpfulCount: helpfulItems.length,
      items: helpfulItems,
    }
  }

  // --- User-specific queries for Tester Activity ---
  const getUserEnrolledProducts = (userEmail) => {
    if (!userEmail) return []
    const normalized = userEmail.toLowerCase().trim()
    const prefix = `${normalized}:`
    const list = []
    for (const [key, enrolledAt] of Object.entries(enrollments)) {
      if (key.startsWith(prefix)) {
        const productId = key.slice(prefix.length)
        const product = products.find((p) => p.id === productId)
        if (product) {
          list.push({
            productId,
            enrolledAt,
            product,
          })
        }
      }
    }
    return list.sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt))
  }

  const getUserFeedback = (userEmail) => {
    if (!userEmail) return []
    const normalized = userEmail.toLowerCase().trim()
    return feedbackList
      .filter((fb) => fb.userEmail && fb.userEmail.toLowerCase().trim() === normalized)
      .map((fb) => ({
        ...fb,
        product: products.find((p) => p.id === fb.productId) || null,
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  // --- User-specific queries for Builder Dashboard ---
  const getUserProducts = (userEmail) => {
    if (!userEmail) return []
    const normalized = userEmail.toLowerCase().trim()
    return products.filter((p) => {
      if (!p.creatorEmail) return false
      return p.creatorEmail.toLowerCase().trim() === normalized
    })
  }

  // --- Product Listing Management ---
  const updateProduct = (productId, userEmail, updatedFields) => {
    if (!productId || !userEmail) {
      return { success: false, error: 'User and product ID are required.' }
    }
    const targetProduct = products.find((p) => p.id === productId)
    if (!targetProduct) {
      return { success: false, error: 'Product listing not found.' }
    }
    if (!isProductOwner(productId, userEmail)) {
      return { success: false, error: 'Only the product owner can edit this product listing.' }
    }

    const name = (updatedFields.name || '').trim()
    const tagline = (updatedFields.tagline || '').trim()
    const description = (updatedFields.description || '').trim() || tagline
    const prototypeUrl = (updatedFields.prototypeUrl || updatedFields.productUrl || '').trim()
    const audience = (updatedFields.audience || '').trim()
    const feedbackRequest = (updatedFields.feedbackRequest || '').trim()
    const categories =
      Array.isArray(updatedFields.categories) && updatedFields.categories.length > 0
        ? updatedFields.categories
        : []
    const targetRoles = Array.isArray(updatedFields.targetRoles) ? updatedFields.targetRoles : []
    const targetIndustries = Array.isArray(updatedFields.targetIndustries)
      ? updatedFields.targetIndustries
      : []
    const targetTechnologies = Array.isArray(updatedFields.targetTechnologies)
      ? updatedFields.targetTechnologies
      : []

    if (!name) {
      return { success: false, error: 'Product name is required.' }
    }
    if (!tagline) {
      return { success: false, error: 'Tagline or short description is required.' }
    }
    if (!prototypeUrl) {
      return { success: false, error: 'Prototype or deployed product link is required.' }
    }
    try {
      const parsed = new URL(prototypeUrl)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { success: false, error: 'Prototype URL must begin with http:// or https://' }
      }
    } catch {
      return { success: false, error: 'Please enter a valid URL (e.g. https://myproduct.example).' }
    }
    if (categories.length === 0) {
      return { success: false, error: 'Select at least one category.' }
    }
    if (!audience) {
      return { success: false, error: 'Target audience is required.' }
    }
    if (!feedbackRequest) {
      return { success: false, error: 'Feedback request is required.' }
    }

    // Preserve product ownership, existing enrollment, feedback, and metrics
    // Store an updatedAt timestamp when listing is actually edited.
    const updatedRecord = {
      ...targetProduct,
      name,
      tagline,
      description,
      productUrl: prototypeUrl,
      audience,
      categories,
      feedbackRequest,
      targetRoles,
      targetIndustries,
      targetTechnologies,
      updatedAt: new Date().toISOString(),
      isLocalDemo: true,
    }

    setCustomProducts((prev) => {
      const existsIndex = prev.findIndex((p) => p.id === productId)
      if (existsIndex >= 0) {
        const copy = [...prev]
        copy[existsIndex] = updatedRecord
        return copy
      }
      return [updatedRecord, ...prev]
    })

    return { success: true, product: updatedRecord }
  }

  const toggleProductEnrollment = (productId, userEmail) => {
    if (!productId || !userEmail) {
      return { success: false, error: 'User and product ID are required.' }
    }
    const targetProduct = products.find((p) => p.id === productId)
    if (!targetProduct) {
      return { success: false, error: 'Product listing not found.' }
    }
    if (!isProductOwner(productId, userEmail)) {
      return { success: false, error: 'Only the product owner can pause or resume enrollment.' }
    }

    const nextPaused = !targetProduct.enrollmentPaused
    // Important: Do NOT update updatedAt on enrollment pause/resume changes!
    const updatedRecord = {
      ...targetProduct,
      enrollmentPaused: nextPaused,
      isLocalDemo: true,
    }

    setCustomProducts((prev) => {
      const existsIndex = prev.findIndex((p) => p.id === productId)
      if (existsIndex >= 0) {
        const copy = [...prev]
        copy[existsIndex] = updatedRecord
        return copy
      }
      return [updatedRecord, ...prev]
    })

    return { success: true, enrollmentPaused: nextPaused }
  }

  // --- Profile Management ---
  const getProfile = useCallback((userEmail) => {
    if (!userEmail) return null
    const normalized = userEmail.toLowerCase().trim()
    return profiles[normalized] || null
  }, [profiles])

  const saveProfile = (userEmail, profileData) => {
    if (!userEmail) return null
    const normalized = userEmail.toLowerCase().trim()
    const updated = {
      ...profileData,
      email: normalized,
      updatedAt: new Date().toISOString(),
    }
    setProfiles((prev) => ({
      ...prev,
      [normalized]: updated,
    }))

    // Synchronize maker displayName on user-created custom products and problems
    if (profileData.displayName?.trim()) {
      const newMaker = profileData.displayName.trim()
      setCustomProducts((prev) =>
        prev.map((p) =>
          (p.creatorEmail || '').toLowerCase().trim() === normalized ? { ...p, maker: newMaker } : p
        )
      )
      setProblems((prev) =>
        prev.map((prob) =>
          (prob.creatorEmail || '').toLowerCase().trim() === normalized ? { ...prob, maker: newMaker } : prob
        )
      )
    }

    return updated
  }

  // Migration helper to link seed replies if loaded from older localStorage
  const migrateComments = (commentsList) => {
    if (!Array.isArray(commentsList)) return []
    return commentsList.map((c) => {
      if (!c.parentId) {
        if (c.id === 'c2') return { ...c, parentId: 'c1', replyToAuthor: 'Alex Mercer' }
        if (c.id === 'c3') return { ...c, parentId: 'c1', replyToAuthor: 'Elena Rostova' }
        if (c.id === 'c6') return { ...c, parentId: 'c5', replyToAuthor: 'Priya N.' }
      }
      return c
    })
  }

  // --- Community Problems & Pre-MVP Validation ---
  const [problems, setProblems] = useState(() => {
    try {
      const saved = localStorage.getItem(PROBLEMS_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Ensure initial seed problems are merged in if not present
        const savedIds = new Set(parsed.map((p) => p.id))
        const unaddedSeeds = initialSeedProblems.filter((p) => !savedIds.has(p.id))
        const combined = [...parsed, ...unaddedSeeds]
        return combined.map((p) => ({
          ...p,
          comments: migrateComments(p.comments),
        }))
      }
      return initialSeedProblems.map((p) => ({
        ...p,
        comments: migrateComments(p.comments),
      }))
    } catch {
      return initialSeedProblems
    }
  })

  // Synchronize problems to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PROBLEMS_STORAGE_KEY, JSON.stringify(problems))
    } catch (e) {
      console.error('Failed to sync problems to localStorage', e)
    }
  }, [problems])

  const addProblem = (problemData) => {
    const baseSlug = slugify(problemData.title) || 'problem'
    let id = baseSlug
    if (problems.some((p) => p.id === id)) {
      id = `${baseSlug}-${Date.now().toString().slice(-4)}`
    }

    const creatorEmail = (problemData.creatorEmail || '').toLowerCase().trim()
    const newProblem = {
      id,
      title: problemData.title.trim(),
      statement: problemData.statement.trim(),
      workarounds: (problemData.workarounds || '').trim(),
      targetAudience: (problemData.targetAudience || '').trim(),
      targetRoles: Array.isArray(problemData.targetRoles) ? problemData.targetRoles : [],
      targetIndustries: Array.isArray(problemData.targetIndustries) ? problemData.targetIndustries : [],
      proposedConcept: (problemData.proposedConcept || '').trim(),
      category: problemData.category || 'Developer Tools',
      stage: 'Validating Need',
      maker: problemData.maker || (creatorEmail ? profiles[creatorEmail]?.displayName?.trim() : null) || (creatorEmail ? creatorEmail.split('@')[0] : 'Independent Builder'),
      creatorEmail,
      validatedBy: creatorEmail ? [creatorEmail] : [],
      testerSignups: [],
      comments: [],
      createdAt: new Date().toISOString(),
    }

    setProblems((prev) => [newProblem, ...prev])
    return newProblem
  }

  const toggleProblemValidation = (problemId, userEmail) => {
    if (!problemId || !userEmail) return { success: false, error: 'Problem ID and user email required.' }
    const normalized = userEmail.toLowerCase().trim()

    let updatedValidated = false
    setProblems((prev) =>
      prev.map((prob) => {
        if (prob.id !== problemId) return prob
        const hasValidated = prob.validatedBy?.includes(normalized)
        updatedValidated = !hasValidated
        const newValidatedBy = hasValidated
          ? prob.validatedBy.filter((e) => e !== normalized)
          : [...(prob.validatedBy || []), normalized]
        return {
          ...prob,
          validatedBy: newValidatedBy,
        }
      })
    )
    return { success: true, validated: updatedValidated }
  }

  const toggleProblemTesterSignup = (problemId, userEmail) => {
    if (!problemId || !userEmail) return { success: false, error: 'Problem ID and user email required.' }
    const normalized = userEmail.toLowerCase().trim()

    let updatedSignedUp = false
    setProblems((prev) =>
      prev.map((prob) => {
        if (prob.id !== problemId) return prob
        const hasSignedUp = prob.testerSignups?.includes(normalized)
        updatedSignedUp = !hasSignedUp
        const newSignups = hasSignedUp
          ? prob.testerSignups.filter((e) => e !== normalized)
          : [...(prob.testerSignups || []), normalized]
        return {
          ...prob,
          testerSignups: newSignups,
        }
      })
    )
    return { success: true, signedUp: updatedSignedUp }
  }

  const addProblemComment = (problemId, { text, authorEmail, authorName, parentId = null, replyToAuthor = null }) => {
    if (!problemId || !text?.trim() || !authorEmail) return null
    const normalizedEmail = authorEmail.toLowerCase().trim()

    const newComment = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      parentId: parentId || null,
      replyToAuthor: replyToAuthor || null,
      authorEmail: normalizedEmail,
      authorName: authorName || profiles[normalizedEmail]?.displayName?.trim() || normalizedEmail.split('@')[0],
      text: text.trim(),
      createdAt: new Date().toISOString(),
      isMakerReply: false,
    }

    setProblems((prev) =>
      prev.map((prob) => {
        if (prob.id !== problemId) return prob
        const isMaker = prob.creatorEmail === normalizedEmail
        const commentWithRole = { ...newComment, isMakerReply: isMaker }
        return {
          ...prob,
          comments: [...(prob.comments || []), commentWithRole],
        }
      })
    )
    return newComment
  }

  const deleteProblem = (problemId, userEmail) => {
    if (!problemId || !userEmail) return { success: false, error: 'Problem ID and user email required.' }
    const normalized = userEmail.toLowerCase().trim()
    const target = problems.find((p) => p.id === problemId)
    if (!target) return { success: false, error: 'Problem hypothesis not found.' }
    if (target.creatorEmail && target.creatorEmail.toLowerCase().trim() !== normalized) {
      return { success: false, error: 'Only the originator who posted this hypothesis can delete it.' }
    }

    setProblems((prev) => prev.filter((p) => p.id !== problemId))
    return { success: true }
  }

  const toggleProblemNotification = (problemId, userEmail) => {
    if (!problemId || !userEmail) return { success: false, error: 'Problem ID and user email required.' }
    const normalized = userEmail.toLowerCase().trim()

    let updatedNotified = false
    setProblems((prev) =>
      prev.map((prob) => {
        if (prob.id !== problemId) return prob
        const currentSubscribers = prob.subscribers || []
        const hasSubscribed = currentSubscribers.includes(normalized)
        updatedNotified = !hasSubscribed
        const newSubscribers = hasSubscribed
          ? currentSubscribers.filter((e) => e !== normalized)
          : [...currentSubscribers, normalized]
        return {
          ...prob,
          subscribers: newSubscribers,
        }
      })
    )
    return { success: true, subscribed: updatedNotified }
  }

  const attachProblemSolution = (problemId, solutionData) => {
    if (!problemId || !solutionData?.title?.trim()) {
      return { success: false, error: 'Problem ID and solution title required.' }
    }
    const authorEmail = (solutionData.authorEmail || '').toLowerCase().trim()
    const newSolution = {
      id: `sol-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: solutionData.title.trim(),
      description: (solutionData.description || '').trim(),
      productId: solutionData.productId || null,
      productUrl: solutionData.productUrl ? solutionData.productUrl.trim() : '',
      authorEmail,
      authorName: solutionData.authorName || (authorEmail ? profiles[authorEmail]?.displayName?.trim() : null) || 'Independent Maker',
      isMaker: Boolean(solutionData.isMaker),
      upvotes: authorEmail ? [authorEmail] : [],
      createdAt: new Date().toISOString(),
    }

    setProblems((prev) =>
      prev.map((prob) => {
        if (prob.id !== problemId) return prob
        return {
          ...prob,
          stage: 'Prototyping',
          solutions: [...(prob.solutions || []), newSolution],
        }
      })
    )
    return { success: true, solution: newSolution }
  }

  const effectiveProblems = useMemo(() => {
    return problems.map((prob) => {
      const email = (prob.creatorEmail || '').toLowerCase().trim()
      if (email && profiles[email]?.displayName?.trim()) {
        return {
          ...prob,
          maker: profiles[email].displayName.trim(),
        }
      }
      return prob
    })
  }, [problems, profiles])

  const getProblem = useCallback((problemId) => {
    if (!problemId) return null
    return effectiveProblems.find((p) => p.id === problemId) || null
  }, [effectiveProblems])

  const getUserProblems = useCallback((userEmail) => {
    if (!userEmail) return []
    const normalized = userEmail.toLowerCase().trim()
    return effectiveProblems.filter((p) => p.creatorEmail === normalized)
  }, [effectiveProblems])

  return (
    <DemoDataContext.Provider
      value={{
        isSyncing,
        syncStatus,
        products,
        addProduct,
        updateProduct,
        toggleProductEnrollment,
        views,
        recordProductView,
        getProductViewCount,
        enrollments,
        enrollInProduct,
        isEnrolledInProduct,
        getProductEnrollmentCount,
        getEnrollmentDate,
        dismissFeedbackReminder,
        isFeedbackReminderDismissed,
        reminderDismissals,
        feedbackList,
        addFeedback,
        getProductFeedback,
        getUserProducts,
        isProductOwner,
        replyToFeedback,
        toggleFeedbackHelpful,
        getTesterRecognition,
        getUserEnrolledProducts,
        getUserFeedback,
        profiles,
        getProfile,
        saveProfile,
        problems: effectiveProblems,
        addProblem,
        deleteProblem,
        toggleProblemValidation,
        toggleProblemTesterSignup,
        toggleProblemNotification,
        attachProblemSolution,
        addProblemComment,
        getProblem,
        getUserProblems,
      }}
    >
      {children}
    </DemoDataContext.Provider>
  )
}
