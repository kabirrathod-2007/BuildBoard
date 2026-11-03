/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { deleteMediaFile } from '../utils/indexedDB'
import { useAuth } from './AuthContext.jsx'
import { products as initialProducts } from '../data/products.js'
import { seedProblems as initialProblems } from '../data/problems.js'
import {
  useAppDispatch,
  setProducts as setReduxProducts,
  setProblems as setReduxProblems,
  setFeedbackList as setReduxFeedbackList,
  setEnrollments as setReduxEnrollments,
  setNotifications as setReduxNotifications,
  setProfileLocal as setReduxProfileLocal,
  dismissReminderLocal as setReduxDismissReminderLocal,
  incrementViewLocal as setReduxIncrementViewLocal,
} from '../store/index.js'
import {
  fetchUserProfile,
  saveUserProfile,
  fetchProducts,
  createProductListing,
  updateProductListing,
  toggleProductPause,
  deleteProductListing,
  enrollInProductApi,
  unenrollFromProductApi,
  fetchMyEnrollments,
  submitProductFeedback,
  fetchProductFeedback,
  replyToFeedbackApi,
  toggleFeedbackHelpfulApi,
  fetchMyFeedback,
  fetchProblems,
  createProblemApi,
  deleteProblemApi,
  toggleProblemValidationApi,
  toggleProblemTesterSignupApi,
  addProblemCommentApi,
  attachProblemSolutionApi,
  recordProductViewApi,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../lib/api.js'

const DemoDataContext = createContext(null)

export const useDemoData = () => {
  const context = useContext(DemoDataContext)
  if (!context) {
    throw new Error('useDemoData must be used within a DemoDataProvider')
  }
  return context
}

// Purge legacy demo localStorage caches so every account starts completely clean from MySQL
try {
  localStorage.removeItem('buildboard_demo_custom_products')
  localStorage.removeItem('buildboard_demo_deleted_products')
  localStorage.removeItem('buildboard_demo_enrollments')
  localStorage.removeItem('buildboard_demo_feedback')
  localStorage.removeItem('buildboard_demo_views')
  localStorage.removeItem('buildboard_demo_profiles')
  localStorage.removeItem('buildboard_demo_problems')
} catch {
  // Ignore in restricted environments
}

const REMINDER_DISMISSALS_STORAGE_KEY = 'buildboard_demo_reminder_dismissals'

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
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState(null)

  // Server products synchronized from MySQL API (with instant initial fallback)
  const [serverProducts, setServerProducts] = useState(initialProducts || [])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState(null)

  const loadServerProducts = useCallback(async () => {
    try {
      setProductsLoading(true)
      setProductsError(null)
      const res = await fetchProducts()
      if (Array.isArray(res?.products) && res.products.length > 0) {
        setServerProducts(res.products.map((p) => ({ ...p, isServerSynced: true })))
      }
    } catch (err) {
      console.warn('[BuildBoard] Could not load products from API:', err.message)
      setProductsError(err.message)
    } finally {
      setProductsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function initProducts() {
      try {
        setProductsLoading(true)
        setProductsError(null)
        const res = await fetchProducts()
        if (active && Array.isArray(res?.products) && res.products.length > 0) {
          setServerProducts(res.products.map((p) => ({ ...p, isServerSynced: true })))
        }
      } catch (err) {
        if (active) {
          console.warn('[BuildBoard] Could not load products from API:', err.message)
          setProductsError(err.message)
        }
      } finally {
        if (active) {
          setProductsLoading(false)
        }
      }
    }

    initProducts()

    return () => {
      active = false
    }
  }, [])

  // Custom products created on this device (in memory only; cloud MySQL is authoritative)
  const [customProducts, setCustomProducts] = useState([])

  // Enrollments mapping: key is "userEmail:productId", value is timestamp (cloud authoritative)
  const [enrollments, setEnrollments] = useState({})

  // Feedback list: array of feedback objects (cloud authoritative)
  const [feedbackList, setFeedbackList] = useState([])

  // Views mapping: key is productId, value is total view count
  const [views, setViews] = useState({})

  // Profiles mapping: key is normalized email, value is profile object (cloud authoritative)
  const [profiles, setProfiles] = useState({})

  // Problems state synchronized from MySQL cloud API (with instant initial fallback)
  const [problems, setProblems] = useState(initialProblems || [])
  const [problemsLoading, setProblemsLoading] = useState(false)
  const [problemsError, setProblemsError] = useState(null)

  // Synchronize authenticated user profile with MySQL cloud API
  useEffect(() => {
    if (!user?.email || !user?.emailVerified) return

    let active = true
    const normalizedEmail = user.email.toLowerCase().trim()

    async function loadServerProfile() {
      try {
        setProfileLoading(true)
        setProfileError(null)
        const result = await fetchUserProfile()
        if (!active) return

        if (result?.profile) {
          // Server profile exists: cloud data is authoritative
          setProfiles((prev) => ({
            ...prev,
            [normalizedEmail]: {
              ...result.profile,
              email: normalizedEmail,
              updatedAt: result.updatedAt,
              isServerSynced: true,
            },
          }))
        } else {
          // No profile in cloud yet: ensure clean slate so brand new accounts start fresh
          setProfiles((prev) => {
            if (!prev[normalizedEmail]) return prev
            const copy = { ...prev }
            delete copy[normalizedEmail]
            return copy
          })
        }
      } catch (err) {
        if (active) {
          console.warn('[BuildBoard] Could not load profile from server:', err.message)
          setProfileError(err.message)
        }
      } finally {
        if (active) {
          setProfileLoading(false)
        }
      }
    }

    loadServerProfile()

    return () => {
      active = false
    }
  }, [user?.email, user?.emailVerified])

  // Synchronize authenticated user enrollments with MySQL cloud API
  const loadMyEnrollments = useCallback(async () => {
    if (!user?.email) {
      setEnrollments({})
      return []
    }
    try {
      const res = await fetchMyEnrollments()
      if (Array.isArray(res?.enrollments)) {
        const normalized = user.email.toLowerCase().trim()
        const newEntries = {}
        for (const item of res.enrollments) {
          const enrolledAt = item.enrolledAt || new Date().toISOString()
          if (item.product?.id) {
            newEntries[`${normalized}:${item.product.id}`] = enrolledAt
          }
          if (item.product?.slug) {
            newEntries[`${normalized}:${item.product.slug}`] = enrolledAt
          }
        }
        setEnrollments(newEntries)
        return res.enrollments
      }
    } catch (err) {
      console.warn('[BuildBoard] Could not load user enrollments:', err.message)
    }
    return []
  }, [user])

  // Synchronize authenticated user feedback with MySQL cloud API
  const loadMyFeedback = useCallback(async () => {
    if (!user?.email) {
      setFeedbackList([])
      return []
    }
    try {
      const res = await fetchMyFeedback()
      if (Array.isArray(res?.feedback)) {
        const normalized = user.email.toLowerCase().trim()
        const list = res.feedback.map((f) => ({
          ...f,
          userEmail: (f.userEmail || normalized).toLowerCase().trim(),
        }))
        setFeedbackList(list)
        return list
      }
    } catch (err) {
      console.warn('[BuildBoard] Could not load user feedback from cloud:', err.message)
    }
    return []
  }, [user])

  // Notifications state & synchronization
  const [notifications, setNotifications] = useState([])
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [notificationsLoading, setNotificationsLoading] = useState(false)

  const loadNotifications = useCallback(async () => {
    if (!user?.email) {
      setNotifications([])
      setUnreadNotificationsCount(0)
      return { notifications: [], unreadCount: 0 }
    }
    try {
      setNotificationsLoading(true)
      const res = await fetchNotifications()
      const list = Array.isArray(res?.notifications) ? res.notifications : []
      const unread = typeof res?.unreadCount === 'number' ? res.unreadCount : list.filter((n) => !n.isRead).length
      setNotifications(list)
      setUnreadNotificationsCount(unread)
      return { notifications: list, unreadCount: unread }
    } catch (err) {
      console.warn('[BuildBoard] Could not load notifications:', err.message)
      return { notifications: [], unreadCount: 0 }
    } finally {
      setNotificationsLoading(false)
    }
  }, [user?.email])

  const markAsRead = useCallback(async (notificationId) => {
    if (!notificationId) return
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)))
    setUnreadNotificationsCount((prev) => Math.max(0, prev - 1))
    try {
      await markNotificationRead(notificationId)
    } catch (err) {
      console.warn('[BuildBoard] Failed to mark notification read:', err.message)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadNotificationsCount(0)
    try {
      await markAllNotificationsRead()
    } catch (err) {
      console.warn('[BuildBoard] Failed to mark all notifications read:', err.message)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function syncUserData() {
      if (!user?.email) {
        setEnrollments((prev) => (Object.keys(prev).length === 0 ? prev : {}))
        setFeedbackList((prev) => (prev.length === 0 ? prev : []))
        setNotifications((prev) => (prev.length === 0 ? prev : []))
        setUnreadNotificationsCount(0)
        return
      }
      if (active) {
        await Promise.allSettled([loadMyEnrollments(), loadMyFeedback(), loadNotifications()])
      }
    }

    syncUserData()

    return () => {
      active = false
    }
  }, [user?.email, loadMyEnrollments, loadMyFeedback, loadNotifications])

  useEffect(() => {
    if (!user?.email) return
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadNotifications()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [user?.email, loadNotifications])

  // Synchronize community problems with MySQL cloud API
  const loadServerProblems = useCallback(async (params = {}) => {
    try {
      setProblemsLoading(true)
      setProblemsError(null)
      const res = await fetchProblems(params)
      if (Array.isArray(res?.problems) && res.problems.length > 0) {
        setProblems(res.problems)
        return res.problems
      }
    } catch (err) {
      console.warn('[BuildBoard] Could not load problems from API:', err.message)
      setProblemsError(err.message)
    } finally {
      setProblemsLoading(false)
    }
    return []
  }, [])

  useEffect(() => {
    let active = true

    async function initProblems() {
      try {
        setProblemsLoading(true)
        setProblemsError(null)
        const res = await fetchProblems()
        if (active && Array.isArray(res?.problems) && res.problems.length > 0) {
          setProblems(res.problems)
        }
      } catch (err) {
        if (active) {
          console.warn('[BuildBoard] Could not load problems from API:', err.message)
          setProblemsError(err.message)
        }
      } finally {
        if (active) {
          setProblemsLoading(false)
        }
      }
    }

    initProblems()

    return () => {
      active = false
    }
  }, [])

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

  // Deleted product IDs tracking (in memory)
  const [deletedProductIds, setDeletedProductIds] = useState([])

  // Combined product list (server products from MySQL are authoritative)
  const products = useMemo(() => {
    const deletedSet = new Set(deletedProductIds)
    const activeServer = serverProducts.filter((p) => !deletedSet.has(p.id) && !deletedSet.has(p.slug))
    const serverKeys = new Set(activeServer.flatMap((p) => [p.id, p.slug].filter(Boolean)))

    const activeCustom = customProducts.filter((p) => !deletedSet.has(p.id) && !serverKeys.has(p.id))
    const all = [...activeServer, ...activeCustom]
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
  }, [serverProducts, customProducts, profiles, deletedProductIds])

  const addProduct = async (formData) => {
    const baseSlug = slugify(formData.name) || 'product'
    let id = baseSlug
    if (products.some((p) => p.id === id || p.slug === id)) {
      id = `${baseSlug}-${Date.now().toString().slice(-4)}`
    }

    const creatorEmail = (formData.creatorEmail || '').toLowerCase().trim()

    // Try cloud persistence first if user is logged in & email is verified
    if (user?.email && user?.emailVerified) {
      try {
        const res = await createProductListing({
          name: formData.name.trim(),
          tagline: formData.tagline.trim(),
          description: formData.description ? formData.description.trim() : formData.tagline.trim(),
          stage: formData.stage || 'Working prototype',
          audience: formData.audience.trim(),
          feedbackRequest: formData.feedbackRequest.trim(),
          enrollmentLimit: formData.enrollmentLimit ? Number(formData.enrollmentLimit) : null,
          productUrl: formData.prototypeUrl ? formData.prototypeUrl.trim() : '',
          githubUrl: formData.githubUrl ? formData.githubUrl.trim() : '',
          imageUrl: formData.image ? formData.image.trim() : '',
          gallery: Array.isArray(formData.gallery) ? formData.gallery : [],
          videoUrl: formData.videoUrl ? formData.videoUrl.trim() : '',
          categories: formData.categories && formData.categories.length > 0 ? formData.categories : ['Other'],
          targetRoles: Array.isArray(formData.targetRoles) ? formData.targetRoles : [],
          targetIndustries: Array.isArray(formData.targetIndustries) ? formData.targetIndustries : [],
          targetTechnologies: Array.isArray(formData.targetTechnologies) ? formData.targetTechnologies : [],
          whatToTry: [
            'Test the core prototype workflow',
            'Check for usability friction or confusing steps',
            'Share what you expected to happen vs what occurred',
          ],
        })

        if (res?.product) {
          const serverProduct = {
            ...res.product,
            maker: formData.maker || (creatorEmail ? profiles[creatorEmail]?.displayName?.trim() : null) || (creatorEmail ? creatorEmail.split('@')[0] : 'Builder'),
            mediaId: formData.mediaId || null,
            galleryMediaIds: Array.isArray(formData.galleryMediaIds) ? formData.galleryMediaIds : [],
            videoMediaId: formData.videoMediaId || null,
            isServerSynced: true,
          }
          setServerProducts((prev) => [serverProduct, ...prev.filter((p) => p.id !== serverProduct.id)])
          return serverProduct
        }
      } catch (err) {
        console.warn('[BuildBoard] Cloud product creation failed, falling back to local demo:', err.message)
      }
    }

    const newProduct = {
      id,
      slug: id,
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
      imageUrl: formData.image ? formData.image.trim() : '',
      mediaId: formData.mediaId || null,
      gallery: Array.isArray(formData.gallery) ? formData.gallery : [],
      galleryMediaIds: Array.isArray(formData.galleryMediaIds) ? formData.galleryMediaIds : [],
      videoUrl: formData.videoUrl ? formData.videoUrl.trim() : '',
      videoMediaId: formData.videoMediaId || null,
      githubUrl: formData.githubUrl ? formData.githubUrl.trim() : '',
      productUrl: formData.prototypeUrl ? formData.prototypeUrl.trim() : '',
      enrollmentLimit: formData.enrollmentLimit ? Number(formData.enrollmentLimit) : null,
      isLocalDemo: true,
      enrollmentPaused: false,
      createdAt: new Date().toISOString(),
    }

    setCustomProducts((prev) => [newProduct, ...prev])
    return newProduct
  }

  // --- Views Tracking (Persistent & Deduplicated) ---
  const viewedSessionSet = useRef(new Set())

  const recordProductView = useCallback(async (productId) => {
    if (!productId) return
    const key = String(productId).toLowerCase().trim()

    setViews((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }))
    dispatch(setReduxIncrementViewLocal(productId))

    if (viewedSessionSet.current.has(key)) return
    viewedSessionSet.current.add(key)

    try {
      await recordProductViewApi(productId)
      setServerProducts((prev) =>
        prev.map((p) => {
          if (p.id === productId || p.slug === productId) {
            return { ...p, viewsCount: (p.viewsCount || 0) + 1 }
          }
          return p
        }),
      )
    } catch {
      // view increment swallowed gracefully
    }
  }, [dispatch])

  const getProductViewCount = useCallback((productId) => {
    if (!productId) return 0
    const product = products.find((p) => p.id === productId || p.slug === productId)
    if (product && typeof product.viewsCount === 'number' && product.viewsCount > 0) {
      return product.viewsCount
    }
    return views[productId] || 0
  }, [products, views])


  // --- Enrollments Tracking ---
  const enrollInProduct = async (productId, userEmail) => {
    if (!productId || !userEmail) return { success: false, error: 'User and product ID are required.' }
    const product = products.find((p) => p.id === productId || p.slug === productId)
    if (product?.creatorEmail && product.creatorEmail.toLowerCase().trim() === userEmail.toLowerCase().trim()) {
      return { success: false, error: 'You are the creator of this product.' }
    }
    if (product?.enrollmentPaused && !isEnrolledInProduct(productId, userEmail)) {
      return { success: false, error: 'Enrollment for this product is currently paused by the builder.' }
    }
    if (product?.enrollmentLimit && !isEnrolledInProduct(productId, userEmail)) {
      const currentCount = getProductEnrollmentCount(productId)
      if (currentCount >= product.enrollmentLimit) {
        return {
          success: false,
          error: `Testing quota reached for this prototype (${product.enrollmentLimit} tester spots are full).`,
          quotaFull: true,
        }
      }
    }

    // If authenticated & verified, sync with cloud API
    if (user?.email && user?.emailVerified) {
      try {
        const res = await enrollInProductApi(product?.id || productId)
        if (res?.enrolled) {
          const enrolledTime = res.enrolledAt || new Date().toISOString()
          const normalized = userEmail.toLowerCase().trim()
          setEnrollments((prev) => ({
            ...prev,
            [`${normalized}:${productId}`]: enrolledTime,
            ...(product?.id ? { [`${normalized}:${product.id}`]: enrolledTime } : {}),
            ...(product?.slug ? { [`${normalized}:${product.slug}`]: enrolledTime } : {}),
          }))

          if (res.productUrl) {
            setServerProducts((prev) =>
              prev.map((p) => {
                if (p.id === product?.id || p.slug === productId) {
                  return { ...p, productUrl: res.productUrl, isEnrolled: true, enrolledAt: enrolledTime }
                }
                return p
              })
            )
          }

          return { success: true, enrolled: true, productUrl: res.productUrl, isServerSynced: true }
        }
      } catch (err) {
        console.warn('[BuildBoard] Cloud enrollment failed:', err.message)
        return { success: false, error: err.message }
      }
    }

    // Local demo fallback
    const key = `${userEmail.toLowerCase().trim()}:${productId}`
    setEnrollments((prev) => ({
      ...prev,
      [key]: new Date().toISOString(),
    }))
    return { success: true }
  }

  const unenrollFromProduct = async (productId, userEmail) => {
    if (!productId || !userEmail) return { success: false, error: 'User and product ID are required.' }
    const product = products.find((p) => p.id === productId || p.slug === productId)
    const normalized = userEmail.toLowerCase().trim()

    if (user?.email && user?.emailVerified) {
      try {
        await unenrollFromProductApi(product?.id || productId)
      } catch (err) {
        console.warn('[BuildBoard] Cloud unenroll failed:', err.message)
      }
    }

    setEnrollments((prev) => {
      const copy = { ...prev }
      delete copy[`${normalized}:${productId}`]
      if (product?.id) delete copy[`${normalized}:${product.id}`]
      if (product?.slug) delete copy[`${normalized}:${product.slug}`]
      return copy
    })

    return { success: true }
  }

  const isEnrolledInProduct = (productId, userEmail) => {
    if (!productId || !userEmail) return false
    const normalized = userEmail.toLowerCase().trim()
    const product = products.find((p) => p.id === productId || p.slug === productId)
    const key1 = `${normalized}:${productId}`
    const key2 = product?.id ? `${normalized}:${product.id}` : null
    const key3 = product?.slug ? `${normalized}:${product.slug}` : null
    return Boolean(enrollments[key1] || (key2 && enrollments[key2]) || (key3 && enrollments[key3]))
  }

  const getProductEnrollmentCount = (productId) => {
    if (!productId) return 0
    const product = products.find((p) => p.id === productId || p.slug === productId)
    const localCount = Object.keys(enrollments).filter((key) => key.endsWith(`:${productId}`) || (product?.id && key.endsWith(`:${product.id}`))).length
    return Math.max(localCount, product?.enrollmentCount || 0)
  }

  const getEnrollmentDate = useCallback((productId, userEmail) => {
    if (!productId || !userEmail) return null
    const normalized = userEmail.toLowerCase().trim()
    const product = products.find((p) => p.id === productId || p.slug === productId)
    const key1 = `${normalized}:${productId}`
    const key2 = product?.id ? `${normalized}:${product.id}` : null
    const key3 = product?.slug ? `${normalized}:${product.slug}` : null
    return enrollments[key1] || (key2 && enrollments[key2]) || (key3 && enrollments[key3]) || null
  }, [enrollments, products])

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
  const loadProductFeedback = useCallback(async (productIdOrSlug) => {
    if (!productIdOrSlug) return []
    try {
      const res = await fetchProductFeedback(productIdOrSlug)
      if (Array.isArray(res?.feedback)) {
        setFeedbackList((prev) => {
          const incomingIds = new Set(res.feedback.map((f) => String(f.id)))
          const remaining = prev.filter((f) => !incomingIds.has(String(f.id)))
          return [...res.feedback, ...remaining]
        })
        return res.feedback
      }
    } catch (err) {
      console.warn('[BuildBoard] Failed to fetch product feedback:', err.message)
    }
    return []
  }, [])

  const addFeedback = async ({ productId, userEmail, category, experience, likes }) => {
    if (user) {
      try {
        const res = await submitProductFeedback(productId, { category, experience, likes })
        if (res?.feedback) {
          const feedbackItem = {
            ...res.feedback,
            userEmail: (res.feedback.userEmail || userEmail || user?.email || '').toLowerCase().trim(),
          }
          setFeedbackList((prev) => [
            feedbackItem,
            ...prev.filter((f) => String(f.id) !== String(feedbackItem.id)),
          ])
          return feedbackItem
        }
      } catch (err) {
        console.error('Failed to submit feedback to server:', err)
        throw err
      }
    }

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
    return newFeedback
  }

  const getProductFeedback = useCallback((productId) => {
    if (!productId) return []
    const strId = String(productId)
    return feedbackList.filter(
      (fb) => String(fb.productId) === strId || fb.productId === productId
    )
  }, [feedbackList])

  // --- Product Ownership Verification ---
  const isProductOwner = useCallback((productId, userEmail) => {
    if (!productId || !userEmail) return false
    const normalized = userEmail.toLowerCase().trim()
    const product = products.find(
      (p) => String(p.id) === String(productId) || p.slug === productId
    )
    if (!product || !product.creatorEmail) return false
    return product.creatorEmail.toLowerCase().trim() === normalized
  }, [products])

  // --- Builder Reply to Feedback ---
  const replyToFeedback = async (feedbackId, userEmail, replyText) => {
    if (!feedbackId || !userEmail) {
      return { success: false, error: 'User and feedback ID are required.' }
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

    const isNumericId = /^\d+$/.test(String(feedbackId))
    if (isNumericId && user) {
      try {
        const res = await replyToFeedbackApi(feedbackId, trimmed)
        if (res?.success) {
          let updatedRecord = null
          setFeedbackList((prev) =>
            prev.map((fb) => {
              if (String(fb.id) === String(feedbackId)) {
                updatedRecord = {
                  ...fb,
                  reply: res.reply,
                }
                return updatedRecord
              }
              return fb
            })
          )
          return { success: true, feedback: updatedRecord, isServerSynced: true }
        }
      } catch (err) {
        return { success: false, error: err.message || 'Failed to dispatch reply.' }
      }
    }

    const targetFeedback = feedbackList.find((fb) => String(fb.id) === String(feedbackId))
    if (!targetFeedback) {
      return { success: false, error: 'Feedback record not found.' }
    }
    if (!isProductOwner(targetFeedback.productId, userEmail)) {
      return { success: false, error: 'Only the product owner can reply to this feedback.' }
    }

    const product = products.find(
      (p) => String(p.id) === String(targetFeedback.productId) || p.slug === targetFeedback.productId
    )
    const userProfile = profiles[userEmail.toLowerCase().trim()]
    const replierName = userProfile?.displayName?.trim() || product?.maker || userEmail.split('@')[0]

    let updatedRecord = null
    setFeedbackList((prev) =>
      prev.map((fb) => {
        if (String(fb.id) === String(feedbackId)) {
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
  const toggleFeedbackHelpful = async (feedbackId, userEmail) => {
    if (!feedbackId || !userEmail) {
      return { success: false, error: 'User and feedback ID are required.' }
    }

    const isNumericId = /^\d+$/.test(String(feedbackId))
    if (isNumericId && user) {
      try {
        const res = await toggleFeedbackHelpfulApi(feedbackId)
        if (res?.success) {
          setFeedbackList((prev) =>
            prev.map((fb) => {
              if (String(fb.id) === String(feedbackId)) {
                return {
                  ...fb,
                  isHelpful: res.isHelpful,
                  helpfulMarkedAt: res.helpfulMarkedAt,
                }
              }
              return fb
            })
          )
          return { success: true, isHelpful: res.isHelpful, isServerSynced: true }
        }
      } catch (err) {
        return { success: false, error: err.message || 'Failed to toggle helpful recognition.' }
      }
    }

    const targetFeedback = feedbackList.find((fb) => String(fb.id) === String(feedbackId))
    if (!targetFeedback) {
      return { success: false, error: 'Feedback record not found.' }
    }
    if (!isProductOwner(targetFeedback.productId, userEmail)) {
      return { success: false, error: 'Only the product owner can mark feedback as helpful.' }
    }

    let nextState = false
    setFeedbackList((prev) =>
      prev.map((fb) => {
        if (String(fb.id) === String(feedbackId)) {
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
  const getTesterRecognition = useCallback((userEmail) => {
    if (!userEmail) {
      return { totalPoints: 0, helpfulCount: 0, items: [] }
    }
    const normalized = userEmail.toLowerCase().trim()
    const helpfulItems = feedbackList
      .filter(
        (fb) =>
          ((fb.userEmail && fb.userEmail.toLowerCase().trim() === normalized) ||
            (!fb.userEmail && user?.email && user.email.toLowerCase().trim() === normalized)) &&
          fb.isHelpful
      )
      .map((fb) => ({
        ...fb,
        product: fb.product || products.find((p) => String(p.id) === String(fb.productId) || p.slug === fb.productId) || null,
      }))
    return {
      totalPoints: helpfulItems.length,
      helpfulCount: helpfulItems.length,
      items: helpfulItems,
    }
  }, [feedbackList, products, user])

  // --- User-specific queries for Tester Activity ---
  const getUserEnrolledProducts = useCallback((userEmail) => {
    if (!userEmail) return []
    const normalized = userEmail.toLowerCase().trim()
    const prefix = `${normalized}:`
    const list = []
    const seenProductIds = new Set()

    for (const [key, enrolledAt] of Object.entries(enrollments)) {
      if (key.startsWith(prefix)) {
        const productKey = key.slice(prefix.length)
        const product = products.find((p) => String(p.id) === String(productKey) || p.slug === productKey)
        if (product && !seenProductIds.has(String(product.id))) {
          seenProductIds.add(String(product.id))
          list.push({
            productId: String(product.id),
            enrolledAt,
            product,
          })
        }
      }
    }
    return list.sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt))
  }, [enrollments, products])

  const getUserFeedback = useCallback((userEmail) => {
    if (!userEmail) return []
    const normalized = userEmail.toLowerCase().trim()
    return feedbackList
      .filter(
        (fb) =>
          (fb.userEmail && fb.userEmail.toLowerCase().trim() === normalized) ||
          (!fb.userEmail && user?.email && user.email.toLowerCase().trim() === normalized)
      )
      .map((fb) => ({
        ...fb,
        product: fb.product || products.find((p) => String(p.id) === String(fb.productId) || p.slug === fb.productId) || null,
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [feedbackList, products, user])

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
  const updateProduct = async (productId, userEmail, updatedFields) => {
    if (!productId || !userEmail) {
      return { success: false, error: 'User and product ID are required.' }
    }
    const targetProduct = products.find((p) => p.id === productId || p.slug === productId)
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

    let enrollmentLimit = null
    if (updatedFields.enrollmentLimit !== undefined && updatedFields.enrollmentLimit !== null && updatedFields.enrollmentLimit !== '') {
      const parsedLimit = Number(updatedFields.enrollmentLimit)
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
        return { success: false, error: 'Tester quota must be a whole number of at least 1 tester.' }
      }
      if (parsedLimit > 100000) {
        return { success: false, error: 'Tester quota cannot exceed 100,000 testers.' }
      }
      enrollmentLimit = parsedLimit
    }

    // If product is synced with server, persist via API
    if (user?.email && user?.emailVerified && targetProduct.isServerSynced) {
      try {
        const res = await updateProductListing(targetProduct.id, {
          name,
          tagline,
          description,
          productUrl: prototypeUrl,
          audience,
          feedbackRequest,
          enrollmentLimit,
          categories,
          targetRoles,
          targetIndustries,
          targetTechnologies,
          githubUrl: updatedFields.githubUrl || null,
          imageUrl: updatedFields.imageUrl || updatedFields.image || null,
          gallery: Array.isArray(updatedFields.gallery) ? updatedFields.gallery : [],
          videoUrl: updatedFields.videoUrl || null,
          stage: updatedFields.stage || targetProduct.stage,
        })
        if (res?.product) {
          const updatedRecord = {
            ...targetProduct,
            ...res.product,
            enrollmentLimit,
            isServerSynced: true,
          }
          setServerProducts((prev) => prev.map((p) => p.id === updatedRecord.id ? updatedRecord : p))
          return { success: true, product: updatedRecord, isServerSynced: true }
        }
      } catch (err) {
        console.warn('[BuildBoard] Server update failed:', err.message)
        return { success: false, error: err.message }
      }
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
      enrollmentLimit,
      targetRoles,
      targetIndustries,
      targetTechnologies,
      updatedAt: new Date().toISOString(),
      isLocalDemo: true,
    }

    setCustomProducts((prev) => {
      const existsIndex = prev.findIndex((p) => p.id === productId || p.slug === productId)
      if (existsIndex >= 0) {
        const copy = [...prev]
        copy[existsIndex] = updatedRecord
        return copy
      }
      return [updatedRecord, ...prev]
    })

    return { success: true, product: updatedRecord }
  }

  const toggleProductEnrollment = async (productId, userEmail) => {
    if (!productId || !userEmail) {
      return { success: false, error: 'User and product ID are required.' }
    }
    const targetProduct = products.find((p) => String(p.id) === String(productId) || p.slug === productId)
    if (!targetProduct) {
      return { success: false, error: 'Product listing not found.' }
    }
    if (!isProductOwner(productId, userEmail)) {
      return { success: false, error: 'Only the product owner can pause or resume enrollment.' }
    }

    const nextPaused = !targetProduct.enrollmentPaused

    if (user?.email && user?.emailVerified) {
      try {
        const res = await toggleProductPause(targetProduct.id || targetProduct.slug, nextPaused)
        const updatedRecord = {
          ...targetProduct,
          enrollmentPaused: res.enrollmentPaused,
          isServerSynced: true,
        }
        setServerProducts((prev) => prev.map((p) => p.id === updatedRecord.id ? updatedRecord : p))
        return { success: true, enrollmentPaused: res.enrollmentPaused, isServerSynced: true }
      } catch (err) {
        console.warn('[BuildBoard] Cloud pause toggle failed:', err.message)
        return { success: false, error: err.message }
      }
    }

    const updatedRecord = {
      ...targetProduct,
      enrollmentPaused: nextPaused,
    }

    setCustomProducts((prev) => {
      const existsIndex = prev.findIndex((p) => p.id === productId || p.slug === productId)
      if (existsIndex >= 0) {
        const copy = [...prev]
        copy[existsIndex] = updatedRecord
        return copy
      }
      return [updatedRecord, ...prev]
    })

    return { success: true, enrollmentPaused: nextPaused }
  }

  const deleteProduct = async (productId, userEmail) => {
    if (!productId || !userEmail) {
      return { success: false, error: 'User and product ID are required.' }
    }
    const targetProduct = products.find((p) => p.id === productId || p.slug === productId)
    if (!targetProduct) {
      return { success: false, error: 'Product listing not found.' }
    }
    if (!isProductOwner(productId, userEmail)) {
      return { success: false, error: 'Only the product creator can delete this listing.' }
    }

    if (user?.email && user?.emailVerified && targetProduct.isServerSynced) {
      try {
        await deleteProductListing(targetProduct.id)
        setServerProducts((prev) => prev.filter((p) => p.id !== targetProduct.id))
      } catch (err) {
        console.warn('[BuildBoard] Cloud delete failed:', err.message)
        return { success: false, error: err.message }
      }
    }

    // Clean up any IndexedDB media if present
    if (targetProduct.mediaId) {
      deleteMediaFile(targetProduct.mediaId).catch(() => {})
    }
    if (Array.isArray(targetProduct.galleryMediaIds)) {
      targetProduct.galleryMediaIds.forEach((id) => {
        deleteMediaFile(id).catch(() => {})
      })
    }
    if (targetProduct.videoMediaId) {
      deleteMediaFile(targetProduct.videoMediaId).catch(() => {})
    }

    // Remove from customProducts
    setCustomProducts((prev) => prev.filter((p) => p.id !== productId && p.slug !== productId))

    // Track as deleted so even seed products or modified seed won't resurface
    setDeletedProductIds((prev) => (prev.includes(targetProduct.id) ? prev : [...prev, targetProduct.id]))

    // Clean up associated enrollments
    setEnrollments((prev) => {
      const copy = { ...prev }
      Object.keys(copy).forEach((k) => {
        if (k.endsWith(`:${productId}`) || k.endsWith(`:${targetProduct.id}`)) {
          delete copy[k]
        }
      })
      return copy
    })

    // Clean up associated feedback
    setFeedbackList((prev) => prev.filter((fb) => fb.productId !== productId && fb.productId !== targetProduct.id))

    // Clean up views
    setViews((prev) => {
      const copy = { ...prev }
      delete copy[productId]
      delete copy[targetProduct.id]
      return copy
    })

    // Clean up problem solutions referencing this product
    setProblems((prev) =>
      prev.map((prob) => ({
        ...prob,
        solutions: (prob.solutions || []).filter((sol) => sol.productId !== productId && sol.productId !== targetProduct.id),
      }))
    )

    // Clean up reminder dismissals
    setReminderDismissals((prev) => {
      const copy = { ...prev }
      Object.keys(copy).forEach((k) => {
        if (k.endsWith(`:${productId}`) || k.endsWith(`:${targetProduct.id}`)) {
          delete copy[k]
        }
      })
      return copy
    })

    return { success: true }
  }

  // --- Profile Management ---
  const getProfile = useCallback((userEmail) => {
    if (!userEmail) return null
    const normalized = userEmail.toLowerCase().trim()
    return profiles[normalized] || null
  }, [profiles])

  const saveProfile = async (userEmail, profileData) => {
    if (!userEmail) return null
    const normalized = userEmail.toLowerCase().trim()

    let serverResult = null
    const isAuthenticatedUser = user?.email && user.email.toLowerCase().trim() === normalized

    if (isAuthenticatedUser && user.emailVerified) {
      serverResult = await saveUserProfile(profileData)
    }

    const updated = {
      ...(serverResult?.profile || profileData),
      email: normalized,
      updatedAt: serverResult?.updatedAt || new Date().toISOString(),
      isServerSynced: Boolean(serverResult?.updatedAt),
    }

    setProfiles((prev) => ({
      ...prev,
      [normalized]: updated,
    }))

    // Synchronize maker displayName on user-created custom products and problems
    if (updated.displayName?.trim()) {
      const newMaker = updated.displayName.trim()
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

  // --- Community Problems & Pre-MVP Validation ---
  const addProblem = async (problemData) => {
    try {
      const res = await createProblemApi({
        title: problemData.title.trim(),
        statement: problemData.statement.trim(),
        workarounds: (problemData.workarounds || '').trim(),
        targetAudience: (problemData.targetAudience || '').trim(),
        proposedConcept: (problemData.proposedConcept || '').trim(),
        category: problemData.category || 'Developer Tools',
        targetRoles: Array.isArray(problemData.targetRoles) ? problemData.targetRoles : [],
        targetIndustries: Array.isArray(problemData.targetIndustries) ? problemData.targetIndustries : [],
      })
      if (res?.problem) {
        setProblems((prev) => [res.problem, ...prev.filter((p) => p.id !== res.problem.id)])
        return res.problem
      }
    } catch (err) {
      console.warn('[BuildBoard] Cloud problem creation failed:', err.message)
      throw err
    }
  }

  const toggleProblemValidation = async (problemId) => {
    if (!problemId) return { success: false, error: 'Problem ID is required.' }
    try {
      const res = await toggleProblemValidationApi(problemId)
      setProblems((prev) =>
        prev.map((prob) => {
          if (String(prob.id) === String(problemId) || prob.slug === String(problemId)) {
            return {
              ...prob,
              hasValidated: res.validated,
              validationCount: res.validationCount,
            }
          }
          return prob
        })
      )
      return { success: true, validated: res.validated, count: res.validationCount }
    } catch (err) {
      return { success: false, error: err.message || 'Failed to toggle validation.' }
    }
  }

  const toggleProblemTesterSignup = async (problemId) => {
    if (!problemId) return { success: false, error: 'Problem ID is required.' }
    try {
      const res = await toggleProblemTesterSignupApi(problemId)
      setProblems((prev) =>
        prev.map((prob) => {
          if (String(prob.id) === String(problemId) || prob.slug === String(problemId)) {
            return {
              ...prob,
              hasSignedUp: res.signedUp,
              testerSignupCount: res.testerSignupCount,
            }
          }
          return prob
        })
      )
      return { success: true, signedUp: res.signedUp, count: res.testerSignupCount }
    } catch (err) {
      return { success: false, error: err.message || 'Failed to toggle tester waitlist signup.' }
    }
  }

  const addProblemComment = async (problemId, { text, parentId = null, replyToAuthor = null }) => {
    if (!problemId || !text?.trim()) return null
    try {
      const res = await addProblemCommentApi(problemId, {
        text: text.trim(),
        parentId: parentId || null,
        replyToAuthor: replyToAuthor || null,
      })
      if (res?.comment) {
        setProblems((prev) =>
          prev.map((prob) => {
            if (String(prob.id) === String(problemId) || prob.slug === String(problemId)) {
              return {
                ...prob,
                commentCount: (prob.commentCount || 0) + 1,
                comments: [...(prob.comments || []), res.comment],
              }
            }
            return prob
          })
        )
        return res.comment
      }
    } catch (err) {
      console.warn('[BuildBoard] Cloud comment creation failed:', err.message)
      throw err
    }
  }

  const deleteProblem = async (problemId) => {
    if (!problemId) return { success: false, error: 'Problem ID is required.' }
    try {
      await deleteProblemApi(problemId)
      setProblems((prev) => prev.filter((p) => String(p.id) !== String(problemId) && p.slug !== String(problemId)))
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message || 'Failed to delete problem hypothesis.' }
    }
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

  const attachProblemSolution = async (problemId, solutionData) => {
    if (!problemId || !solutionData?.title?.trim()) {
      return { success: false, error: 'Problem ID and solution title required.' }
    }
    try {
      const res = await attachProblemSolutionApi(problemId, {
        title: solutionData.title.trim(),
        description: (solutionData.description || '').trim(),
        productUrl: (solutionData.productUrl || '').trim(),
        productId: solutionData.productId || null,
      })
      if (res?.solution) {
        setProblems((prev) =>
          prev.map((prob) => {
            if (String(prob.id) === String(problemId) || prob.slug === String(problemId)) {
              return {
                ...prob,
                stage: 'Prototyping',
                solutionCount: (prob.solutionCount || 0) + 1,
                solutions: [...(prob.solutions || []), res.solution],
              }
            }
            return prob
          })
        )
        return { success: true, solution: res.solution }
      }
    } catch (err) {
      return { success: false, error: err.message || 'Failed to attach solution.' }
    }
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

  // Synchronize domain state with Redux Toolkit store
  useEffect(() => {
    dispatch(setReduxProducts(products))
  }, [products, dispatch])

  useEffect(() => {
    dispatch(setReduxProblems(effectiveProblems))
  }, [effectiveProblems, dispatch])

  useEffect(() => {
    dispatch(setReduxFeedbackList(feedbackList))
  }, [feedbackList, dispatch])

  useEffect(() => {
    dispatch(setReduxEnrollments(enrollments))
  }, [enrollments, dispatch])

  useEffect(() => {
    dispatch(setReduxNotifications(notifications))
  }, [notifications, dispatch])

  useEffect(() => {
    for (const [email, prof] of Object.entries(profiles)) {
      dispatch(setReduxProfileLocal({ userEmail: email, profile: prof }))
    }
  }, [profiles, dispatch])

  useEffect(() => {
    for (const [key, dismissedAt] of Object.entries(reminderDismissals)) {
      const [email, pid] = key.split(':')
      if (email && pid) {
        dispatch(setReduxDismissReminderLocal({ userEmail: email, productId: pid, dismissedAt }))
      }
    }
  }, [reminderDismissals, dispatch])

  return (
    <DemoDataContext.Provider
      value={{
        products,
        loadServerProducts,
        productsLoading,
        productsError,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductEnrollment,
        views,
        recordProductView,
        getProductViewCount,
        enrollments,
        enrollInProduct,
        unenrollFromProduct,
        isEnrolledInProduct,
        getProductEnrollmentCount,
        getEnrollmentDate,
        dismissFeedbackReminder,
        isFeedbackReminderDismissed,
        reminderDismissals,
        feedbackList,
        addFeedback,
        loadProductFeedback,
        getProductFeedback,
        getUserProducts,
        isProductOwner,
        replyToFeedback,
        toggleFeedbackHelpful,
        getTesterRecognition,
        loadMyFeedback,
        loadMyEnrollments,
        getUserEnrolledProducts,
        getUserFeedback,
        profiles,
        getProfile,
        saveProfile,
        profileLoading,
        profileError,
        notifications,
        unreadNotificationsCount,
        notificationsLoading,
        loadNotifications,
        markAsRead,
        markAllAsRead,
        problems: effectiveProblems,
        loadServerProblems,
        problemsLoading,
        problemsError,
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
