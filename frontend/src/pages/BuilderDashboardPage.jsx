import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router'
import { MotionConfig, motion } from 'motion/react'
import { useAuth } from '../context/AuthContext.jsx'
import { useDemoData } from '../context/DemoDataContext.jsx'
import { AVAILABLE_CATEGORIES } from '../data/products.js'
import {
  TARGET_ROLES,
  TARGET_INDUSTRIES,
  TARGET_TECHNOLOGIES,
} from '../data/targetingOptions.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

function isValidUrl(string) {
  try {
    const parsed = new URL(string.trim())
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const FEEDBACK_CATEGORIES = [
  'All categories',
  'What worked well',
  'Bug or issue',
  'Usability',
  'UI',
  'Feature idea',
  'Other',
]

export default function BuilderDashboardPage() {
  useDocumentTitle('Builder Dashboard | BuildBoard')
  const { user } = useAuth()
  const {
    getUserProducts,
    getProductViewCount,
    getProductEnrollmentCount,
    getProductFeedback,
    replyToFeedback,
    toggleFeedbackHelpful,
    updateProduct,
    toggleProductEnrollment,
    getProfile,
  } = useDemoData()
  const navigate = useNavigate()
  const location = useLocation()

  const userProfile = user?.email ? getProfile(user.email) : null
  const builderDisplayName = userProfile?.displayName?.trim() || (user?.email ? user.email.split('@')[0] : 'Builder')

  const [selectedCategory, setSelectedCategory] = useState('All categories')
  const [selectedProductId, setSelectedProductId] = useState('all')

  // Reply draft state
  const [replyingToId, setReplyingToId] = useState(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [replyError, setReplyError] = useState('')

  const handleStartReply = (feedbackId, existingReply = '') => {
    setReplyingToId(feedbackId)
    setReplyDraft(existingReply || '')
    setReplyError('')
  }

  const handleCancelReply = () => {
    setReplyingToId(null)
    setReplyDraft('')
    setReplyError('')
  }

  const handleSendReply = (feedbackId) => {
    if (!user) return
    const res = replyToFeedback(feedbackId, user.email, replyDraft)
    if (!res.success) {
      setReplyError(res.error)
      return
    }
    setReplyingToId(null)
    setReplyDraft('')
    setReplyError('')
  }

  // Listing Management & Edit State
  const [editingProduct, setEditingProduct] = useState(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    prototypeUrl: '',
    audience: '',
    categories: [],
    feedbackRequest: '',
    targetRoles: [],
    targetIndustries: [],
    targetTechnologies: [],
  })
  const [editErrors, setEditErrors] = useState({})
  const [actionNotice, setActionNotice] = useState(null)

  const handleStartEdit = (product) => {
    setEditingProduct(product)
    setEditFormData({
      name: product.name || '',
      tagline: product.tagline || '',
      description: product.description || product.tagline || '',
      prototypeUrl: product.productUrl || '',
      audience: product.audience || '',
      categories: Array.isArray(product.categories) ? [...product.categories] : [],
      feedbackRequest: product.feedbackRequest || '',
      targetRoles: Array.isArray(product.targetRoles) ? [...product.targetRoles] : [],
      targetIndustries: Array.isArray(product.targetIndustries) ? [...product.targetIndustries] : [],
      targetTechnologies: Array.isArray(product.targetTechnologies) ? [...product.targetTechnologies] : [],
    })
    setEditErrors({})
  }

  const handleCancelEdit = () => {
    setEditingProduct(null)
    setEditErrors({})
  }

  useEffect(() => {
    if (!editingProduct) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setEditingProduct(null)
        setEditErrors({})
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editingProduct])

  const handleEditInputChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }))
    if (editErrors[field]) {
      setEditErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const toggleEditCategory = (cat) => {
    setEditFormData((prev) => {
      const exists = prev.categories.includes(cat)
      const updated = exists ? prev.categories.filter((c) => c !== cat) : [...prev.categories, cat]
      return { ...prev, categories: updated }
    })
    if (editErrors.categories) {
      setEditErrors((prev) => ({ ...prev, categories: undefined }))
    }
  }

  const toggleEditTargetRole = (role) => {
    setEditFormData((prev) => {
      const exists = prev.targetRoles.includes(role)
      return {
        ...prev,
        targetRoles: exists ? prev.targetRoles.filter((r) => r !== role) : [...prev.targetRoles, role],
      }
    })
  }

  const toggleEditTargetIndustry = (ind) => {
    setEditFormData((prev) => {
      const exists = prev.targetIndustries.includes(ind)
      return {
        ...prev,
        targetIndustries: exists ? prev.targetIndustries.filter((i) => i !== ind) : [...prev.targetIndustries, ind],
      }
    })
  }

  const toggleEditTargetTech = (tech) => {
    setEditFormData((prev) => {
      const exists = prev.targetTechnologies.includes(tech)
      return {
        ...prev,
        targetTechnologies: exists
          ? prev.targetTechnologies.filter((t) => t !== tech)
          : [...prev.targetTechnologies, tech],
      }
    })
  }

  const handleSaveEdit = (e) => {
    e.preventDefault()
    if (!user || !editingProduct) return

    const errors = {}
    if (!editFormData.name.trim()) {
      errors.name = 'Product name is required.'
    }
    if (!editFormData.tagline.trim()) {
      errors.tagline = 'Tagline or short description is required.'
    }
    if (!editFormData.prototypeUrl.trim()) {
      errors.prototypeUrl = 'Working prototype URL is required.'
    } else if (!isValidUrl(editFormData.prototypeUrl)) {
      errors.prototypeUrl = 'Enter a valid URL including http:// or https://'
    }
    if (editFormData.categories.length === 0) {
      errors.categories = 'Select at least one category.'
    }
    if (!editFormData.audience.trim()) {
      errors.audience = 'Target audience is required.'
    }
    if (!editFormData.feedbackRequest.trim()) {
      errors.feedbackRequest = 'Feedback request is required.'
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors)
      return
    }

    const res = updateProduct(editingProduct.id, user.email, editFormData)
    if (!res.success) {
      setEditErrors({ form: res.error })
      return
    }

    const savedName = editFormData.name
    setEditingProduct(null)
    setEditErrors({})
    setActionNotice({
      type: 'success',
      message: `Listing "${savedName}" updated successfully on this device.`,
    })
    setTimeout(() => setActionNotice(null), 4000)
  }

  const handleToggleEnrollment = (productId, productName) => {
    if (!user) return
    const res = toggleProductEnrollment(productId, user.email)
    if (!res.success) {
      setActionNotice({ type: 'error', message: res.error })
      return
    }
    const statusText = res.enrollmentPaused ? 'paused' : 'resumed'
    setActionNotice({
      type: 'success',
      message: `Enrollment for "${productName}" is now ${statusText} on this device.`,
    })
    setTimeout(() => setActionNotice(null), 4000)
  }

  // Get products owned by the signed-in user (empty array if not signed in)
  const userProducts = useMemo(() => {
    return user ? getUserProducts(user.email) : []
  }, [user, getUserProducts])

  // Aggregate metrics across all user-owned products
  const aggregateMetrics = useMemo(() => {
    let totalViews = 0
    let totalEnrollments = 0
    let totalFeedback = 0

    userProducts.forEach((product) => {
      totalViews += getProductViewCount(product.id)
      totalEnrollments += getProductEnrollmentCount(product.id)
      totalFeedback += getProductFeedback(product.id).length
    })

    return { totalViews, totalEnrollments, totalFeedback }
  }, [userProducts, getProductViewCount, getProductEnrollmentCount, getProductFeedback])

  // Collect all feedback notes across user-owned products
  const allUserFeedback = useMemo(() => {
    return userProducts.flatMap((product) => {
      const notes = getProductFeedback(product.id)
      return notes.map((note) => ({
        ...note,
        productName: product.name,
        productId: product.id,
      }))
    })
  }, [userProducts, getProductFeedback])

  // Filter feedback by selected product and category
  const filteredFeedback = useMemo(() => {
    return allUserFeedback.filter((fb) => {
      const matchesProduct = selectedProductId === 'all' || fb.productId === selectedProductId
      const matchesCategory = selectedCategory === 'All categories' || fb.category === selectedCategory
      return matchesProduct && matchesCategory
    })
  }, [allUserFeedback, selectedProductId, selectedCategory])

  // Unauthenticated Gate
  if (!user) {
    return (
      <MotionConfig reducedMotion="user">
        <main
          id="main-content"
          tabIndex={-1}
          className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] transition-colors focus:outline-none flex flex-col justify-between"
        >
          <Navbar />
          <div className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-5 py-16">
            <div className="w-full rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-8 text-center shadow-warm-md sm:p-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d96b43]/15 text-[#d96b43]">
                <svg className="h-7 w-7 text-[#d96b43]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <p className="mt-4 text-sm font-bold uppercase tracking-wider text-[#d96b43]">
                Builder Access Required
              </p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-display font-semibold tracking-tight text-[var(--text-main)]">
                Sign in to view your dashboard
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                The builder studio organizes your submitted prototypes, listing views, tester
                enrollments, and structured feedback notes on this device.
              </p>
              <button
                type="button"
                onClick={() => navigate('/sign-in', { state: { from: location } })}
                className="mt-6 w-full rounded-full bg-[#d96b43] py-3 text-sm font-semibold text-white shadow-warm-sm transition hover:bg-[#b85028] active:translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d96b43] focus-visible:ring-offset-2"
              >
                Sign in to Continue
              </button>
              <Link
                to="/explore"
                className="mt-4 inline-block text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] underline underline-offset-4"
              >
                ← Return to Explore
              </Link>
            </div>
          </div>
          <Footer />
        </main>
      </MotionConfig>
    )
  }

  return (
    <MotionConfig reducedMotion="user">
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] transition-colors focus:outline-none flex flex-col justify-between"
      >
        <div>
          <Navbar />

          <div className="mx-auto max-w-7xl px-5 sm:px-8 py-10 sm:py-14 space-y-12 sm:space-y-16">
            {/* Page Header: Aligned Grid & Supporting Description */}
            <section aria-labelledby="builder-dashboard-heading" className="space-y-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#d96b43]/10 px-3 py-1 text-sm font-bold uppercase tracking-wider text-[#d96b43]">
                      Builder Studio
                    </span>
                    <span className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-2.5 py-0.5 text-sm text-[var(--text-subtle)]">
                      Builder: <span className="font-semibold text-[var(--text-main)]">{builderDisplayName}</span>
                    </span>
                  </div>

                  <h1
                    id="builder-dashboard-heading"
                    className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--text-main)]"
                  >
                    Prototype Activity & <span className="italic font-normal text-[#d96b43] dark:text-[#e07a5f]">Feedback</span>
                  </h1>

                  <p className="text-base sm:text-lg leading-relaxed text-[var(--text-muted)]">
                    Track discovery and enrollment across your active prototypes, manage tester access, and review structured critique to inform your next release.
                  </p>
                </div>

                <Link
                  to="/products/new"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#d96b43] px-5 py-3 text-sm font-semibold text-white shadow-warm-sm transition hover:bg-[#b85028] active:translate-y-0.5 cursor-pointer"
                >
                  <span>+ Submit another prototype</span>
                </Link>
              </div>

              {/* Platform Activity vs External Prototype Scope Notice */}
              <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-warm-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className="self-start rounded-full border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-3 py-1 text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] shrink-0">
                    Scope Notice
                  </span>
                  <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                    <strong className="text-[var(--text-main)]">BuildBoard Listing Engagement:</strong> Views, enrollments, and feedback notes measure tester discovery and critique on BuildBoard itself. BuildBoard does not record telemetry or tracking inside your external prototype.
                  </p>
                </div>
              </div>

              {actionNotice && (
                <div
                  role="alert"
                  className={`rounded-2xl border p-4 text-sm font-medium shadow-warm-xs ${
                    actionNotice.type === 'error'
                      ? 'border-rose-500/30 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
                      : 'border-emerald-500/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                  }`}
                >
                  {actionNotice.message}
                </div>
              )}
            </section>

            {/* Conversion Funnel & Activity Summary */}
            <motion.section
              aria-label="Activity summary metrics"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              {/* Funnel visualization */}
              <div className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-warm-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-[#d96b43]">Conversion Funnel</p>
                    <p className="mt-0.5 text-sm text-[var(--text-muted)]">How testers progress through your listings</p>
                  </div>
                  <span className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-3 py-1 text-sm font-semibold text-[var(--text-muted)]">
                    {userProducts.length} {userProducts.length === 1 ? 'listing' : 'listings'}
                  </span>
                </div>

                {/* Funnel steps */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-0">
                  {/* Views */}
                  <div className="relative flex flex-col items-center text-center sm:px-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-main)]">
                      <svg className="h-7 w-7 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </div>
                    <p className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-[var(--text-main)]">
                      {aggregateMetrics.totalViews}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">Listing Views</p>
                    {/* Arrow connector (desktop only) */}
                    <div className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 flex-col items-center gap-0.5">
                      <svg className="h-5 w-5 text-[var(--text-subtle)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      <span className="text-xs font-bold tabular-nums text-[#d96b43]">
                        {aggregateMetrics.totalViews > 0
                          ? `${Math.round((aggregateMetrics.totalEnrollments / aggregateMetrics.totalViews) * 100)}%`
                          : '—'}
                      </span>
                    </div>
                    {/* Mobile arrow */}
                    <div className="flex sm:hidden items-center justify-center gap-1.5 mt-2 text-xs font-bold text-[#d96b43]">
                      <svg className="h-4 w-4 rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      {aggregateMetrics.totalViews > 0
                        ? `${Math.round((aggregateMetrics.totalEnrollments / aggregateMetrics.totalViews) * 100)}% enrolled`
                        : 'No views yet'}
                    </div>
                  </div>

                  {/* Enrollments */}
                  <div className="relative flex flex-col items-center text-center sm:px-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d96b43]/10 border border-[#d96b43]/30">
                      <svg className="h-7 w-7 text-[#d96b43]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" />
                        <line x1="22" y1="11" x2="16" y2="11" />
                      </svg>
                    </div>
                    <p className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-[var(--text-main)]">
                      {aggregateMetrics.totalEnrollments}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">Enrolled Testers</p>
                    {/* Arrow connector (desktop only) */}
                    <div className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 flex-col items-center gap-0.5">
                      <svg className="h-5 w-5 text-[var(--text-subtle)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      <span className="text-xs font-bold tabular-nums text-[#d96b43]">
                        {aggregateMetrics.totalEnrollments > 0
                          ? `${Math.round((aggregateMetrics.totalFeedback / aggregateMetrics.totalEnrollments) * 100)}%`
                          : '—'}
                      </span>
                    </div>
                    {/* Mobile arrow */}
                    <div className="flex sm:hidden items-center justify-center gap-1.5 mt-2 text-xs font-bold text-[#d96b43]">
                      <svg className="h-4 w-4 rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      {aggregateMetrics.totalEnrollments > 0
                        ? `${Math.round((aggregateMetrics.totalFeedback / aggregateMetrics.totalEnrollments) * 100)}% gave feedback`
                        : 'No enrollments yet'}
                    </div>
                  </div>

                  {/* Feedback */}
                  <div className="flex flex-col items-center text-center sm:px-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                      <svg className="h-7 w-7 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <p className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-[var(--text-main)]">
                      {aggregateMetrics.totalFeedback}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">Feedback Notes</p>
                  </div>
                </div>

                {/* Funnel bar visualization */}
                <div className="mt-6 pt-5 border-t border-[var(--border-main)]">
                  <div className="flex items-center gap-1 h-3 rounded-full overflow-hidden bg-[var(--bg-surface-subtle)]">
                    <div
                      className="h-full rounded-full bg-[var(--text-subtle)] transition-all duration-500"
                      style={{ width: `${aggregateMetrics.totalViews > 0 ? 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1 h-3 mt-1.5 rounded-full overflow-hidden bg-[var(--bg-surface-subtle)]">
                    <div
                      className="h-full rounded-full bg-[#d96b43] transition-all duration-500"
                      style={{ width: `${aggregateMetrics.totalViews > 0 ? Math.max((aggregateMetrics.totalEnrollments / aggregateMetrics.totalViews) * 100, 2) : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1 h-3 mt-1.5 rounded-full overflow-hidden bg-[var(--bg-surface-subtle)]">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${aggregateMetrics.totalViews > 0 ? Math.max((aggregateMetrics.totalFeedback / aggregateMetrics.totalViews) * 100, 2) : 0}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs font-medium text-[var(--text-subtle)]">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--text-subtle)]" />Views</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#d96b43]" />Enrollments</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Feedback</span>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Section 1: User's Products List */}
            <motion.section
              aria-labelledby="products-heading"
              className="space-y-6"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-main)] pb-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-[#d96b43]">
                    Your Listings
                  </p>
                  <h2
                    id="products-heading"
                    className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-main)]"
                  >
                    Submitted Prototypes ({userProducts.length})
                  </h2>
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  Manage availability, edit metadata, and review test objectives.
                </p>
              </div>

              {userProducts.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {userProducts.map((product) => {
                    const viewsCount = getProductViewCount(product.id)
                    const enrollmentsCount = getProductEnrollmentCount(product.id)
                    const feedbackCount = getProductFeedback(product.id).length

                    return (
                      <motion.article
                        key={product.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col justify-between rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-warm-sm transition-all hover:border-[var(--border-strong)]"
                      >
                        <div className="space-y-4">
                          {/* Top Badges */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-main)] px-3 py-1 text-sm font-semibold text-[var(--text-muted)]">
                                {product.stage}
                              </span>
                              {product.enrollmentPaused ? (
                                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-800 dark:text-amber-300">
                                  Enrollment paused
                                </span>
                              ) : (
                                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                                  Enrollment open
                                </span>
                              )}
                              {product.categories.slice(0, 2).map((cat) => (
                                <span
                                  key={cat}
                                  className="rounded-full border border-[var(--border-main)] bg-[var(--bg-page)] px-3 py-1 text-sm font-medium text-[var(--text-subtle)]"
                                >
                                  {cat}
                                </span>
                              ))}
                            </div>

                            {product.updatedAt && (
                              <span className="text-sm text-[var(--text-subtle)]">
                                Updated {new Date(product.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>

                          {/* Title & Tagline */}
                          <div>
                            <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)] break-words">
                              <Link
                                to={`/products/${product.id}`}
                                className="hover:text-[#d96b43] transition-colors"
                              >
                                {product.name}
                              </Link>
                            </h3>
                            <p className="mt-1.5 text-base leading-relaxed text-[var(--text-muted)] break-words">
                              {product.tagline}
                            </p>
                          </div>

                          {/* Target Audience & Test Request Summary */}
                          <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] p-4 text-sm space-y-2">
                            <div>
                              <span className="text-sm font-bold uppercase tracking-wider text-[#d96b43] block">
                                Target Audience
                              </span>
                              <span className="mt-0.5 block font-medium text-[var(--text-main)] break-words">
                                {product.audience}
                              </span>
                            </div>
                            {product.feedbackRequest && (
                              <div className="pt-2 border-t border-[var(--border-main)]">
                                <span className="text-sm font-bold uppercase tracking-wider text-[var(--text-subtle)] block">
                                  Feedback Objective
                                </span>
                                <span className="mt-0.5 block text-sm text-[var(--text-muted)] break-words">
                                  {product.feedbackRequest}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Product Metrics Grid & Controls */}
                        <div className="mt-6 border-t border-[var(--border-main)] pt-5 space-y-4">
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] p-3">
                              <p className="text-sm font-bold uppercase tracking-wider text-[var(--text-subtle)]">Views</p>
                              <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-[var(--text-main)]">{viewsCount}</p>
                            </div>
                            <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] p-3">
                              <p className="text-sm font-bold uppercase tracking-wider text-[var(--text-subtle)]">Enrolled</p>
                              <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-[var(--text-main)]">{enrollmentsCount}</p>
                            </div>
                            <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] p-3">
                              <p className="text-sm font-bold uppercase tracking-wider text-[var(--text-subtle)]">Feedback</p>
                              <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-[var(--text-main)]">{feedbackCount}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(product)}
                                className="min-h-[40px] rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] shadow-warm-xs hover:bg-[var(--bg-surface-subtle)] transition-colors cursor-pointer"
                              >
                                Edit listing
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleEnrollment(product.id, product.name)}
                                className={`min-h-[40px] rounded-full border px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                                  product.enrollmentPaused
                                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20 dark:text-emerald-300'
                                    : 'border-amber-500/40 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 dark:text-amber-300'
                                }`}
                              >
                                {product.enrollmentPaused ? 'Resume enrollment' : 'Pause enrollment'}
                              </button>
                            </div>

                            <div className="flex items-center gap-3">
                              <Link
                                to={`/products/${product.id}`}
                                className="text-sm font-semibold text-[var(--text-main)] hover:text-[#d96b43] transition-colors"
                              >
                                Listing ↗
                              </Link>
                              {product.productUrl && (
                                <a
                                  href={product.productUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                                >
                                  Live prototype ↗
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    )
                  })}
                </div>
              ) : (
                /* Empty State 1: No Products Submitted */
                <div className="rounded-3xl border border-dashed border-[var(--border-main)] bg-[var(--bg-surface)] p-10 sm:p-14 text-center text-[var(--text-main)] shadow-warm-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-surface-subtle)]">
                    <svg className="h-6 w-6 text-[var(--text-subtle)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <h3 className="mt-4 font-display text-xl sm:text-2xl font-bold">No submitted prototypes yet</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
                    Share your working prototype or MVP with the BuildBoard community.
                    Track listing visits, tester enrollments, and structured critique in one place.
                  </p>
                  <Link
                    to="/products/new"
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#d96b43] px-6 py-3 text-sm font-semibold text-white shadow-warm-sm transition hover:bg-[#b85028]"
                  >
                    Submit your first prototype →
                  </Link>
                </div>
              )}
            </motion.section>

            {/* Section 2: Feedback Inbox */}
            <motion.section
              aria-labelledby="inbox-heading"
              className="space-y-6"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <div className="flex flex-col justify-between gap-4 border-b border-[var(--border-main)] pb-4 sm:flex-row sm:items-end">
                <div>
                  <h2
                    id="inbox-heading"
                    className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-main)]"
                  >
                    Feedback Inbox ({filteredFeedback.length})
                  </h2>
                </div>

                {/* Filter Controls: Standardized heights & clear focus */}
                {allUserFeedback.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3">
                    {userProducts.length > 1 && (
                      <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        aria-label="Filter by product"
                        className="min-h-[40px] rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] outline-none focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20 cursor-pointer"
                      >
                        <option value="all">All your products</option>
                        {userProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    )}

                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      aria-label="Filter by feedback category"
                      className="min-h-[40px] rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] outline-none focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20 cursor-pointer"
                    >
                      {FEEDBACK_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {filteredFeedback.length > 0 ? (
                <div className="space-y-5">
                  {filteredFeedback.map((fb) => (
                    <div
                      key={fb.id}
                      className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 text-[var(--text-main)] shadow-warm-sm transition-all hover:border-[var(--border-strong)] space-y-4"
                    >
                      {/* Feedback Header: Category pill, Product reference, Tester ID, Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-main)] pb-4">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-main)] px-3 py-1 text-sm font-semibold text-[var(--text-main)]">
                            {fb.category}
                          </span>
                          <Link
                            to={`/products/${fb.productId}`}
                            className="rounded-full border border-[var(--border-main)] bg-[var(--bg-page)] px-3 py-1 text-sm font-medium text-[var(--text-main)] hover:text-[#d96b43] transition-colors"
                          >
                            {fb.productName} ↗
                          </Link>
                          {(() => {
                            const testerProfile = fb.userEmail ? getProfile(fb.userEmail) : null
                            const testerName = testerProfile?.displayName?.trim() || fb.userEmail
                            return (
                              <span className="text-sm font-medium text-[var(--text-muted)]">
                                {testerName}
                              </span>
                            )
                          })()}
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleFeedbackHelpful(fb.id, user.email)}
                            className={`min-h-[36px] rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors cursor-pointer ${
                              fb.isHelpful
                                ? 'border-emerald-600 bg-emerald-600 text-white shadow-warm-xs'
                                : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-main)]'
                            }`}
                          >
                            {fb.isHelpful ? 'Helpful (Marked)' : 'Mark helpful'}
                          </button>
                          <span className="text-sm text-[var(--text-subtle)]">
                            {new Date(fb.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Feedback Note Body & Clear Sections */}
                      <div className="space-y-4 pt-1">
                        {fb.isHelpful && (
                          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 px-3.5 py-1 text-sm font-medium text-emerald-800 dark:text-emerald-300">
                            <svg className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>Recognized by builder (+1 helpful point awarded to tester)</span>
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-bold uppercase tracking-wider text-[#d96b43]">
                            Tester Observation & Critique
                          </p>
                          <p className="mt-2 text-base leading-relaxed text-[var(--text-main)] break-words">
                            {fb.experience}
                          </p>
                        </div>

                        {fb.likes && (
                          <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] p-4">
                            <p className="text-sm font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                              What Worked Well
                            </p>
                            <p className="mt-1 text-sm sm:text-base leading-relaxed text-[var(--text-muted)] break-words">
                              {fb.likes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Builder Reply Section */}
                      <div className="border-t border-[var(--border-main)] pt-4">
                        {replyingToId === fb.id ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault()
                              handleSendReply(fb.id)
                            }}
                            className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] p-5 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <label
                                htmlFor={`reply-${fb.id}`}
                                className="text-sm font-bold uppercase tracking-wider text-[#d96b43]"
                              >
                                {fb.reply ? 'Edit your reply' : 'Reply to tester'}
                              </label>
                              <span className="text-sm text-[var(--text-subtle)]">
                                {replyDraft.length}/1000
                              </span>
                            </div>

                            <textarea
                              id={`reply-${fb.id}`}
                              rows={3}
                              value={replyDraft}
                              onChange={(e) => {
                                setReplyDraft(e.target.value)
                                if (replyError) setReplyError('')
                              }}
                              placeholder="Thank the tester, share what you're fixing, or ask a clarifying question..."
                              className="w-full rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-3 text-sm font-normal text-[var(--text-main)] placeholder:text-[var(--text-subtle)] outline-none focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20"
                            />

                            {replyError && (
                              <p className="text-sm font-semibold text-rose-500">{replyError}</p>
                            )}

                            <div className="flex items-center justify-end gap-2.5 pt-1">
                              <button
                                type="button"
                                onClick={handleCancelReply}
                                className="min-h-[38px] rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-4 py-1.5 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="min-h-[38px] rounded-full bg-[#d96b43] px-5 py-1.5 text-sm font-semibold text-white shadow-warm-xs hover:bg-[#b85028] transition-colors cursor-pointer"
                              >
                                Post reply
                              </button>
                            </div>
                          </form>
                        ) : fb.reply ? (
                          <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] p-5 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold uppercase tracking-wider text-[#d96b43]">
                                Your Builder Reply
                              </span>
                              <button
                                type="button"
                                onClick={() => handleStartReply(fb.id, fb.reply)}
                                className="text-sm font-semibold text-[var(--text-muted)] hover:text-[#d96b43] transition-colors cursor-pointer"
                              >
                                Edit reply
                              </button>
                            </div>
                            <p className="text-sm sm:text-base leading-relaxed text-[var(--text-main)] break-words">
                              {fb.reply}
                            </p>
                            {fb.replyCreatedAt && (
                              <p className="text-sm text-[var(--text-subtle)]">
                                Sent {new Date(fb.replyCreatedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartReply(fb.id, '')}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#d96b43] hover:underline underline-offset-4 cursor-pointer"
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            <span>Reply to tester</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty State 2: No Feedback Notes */
                <div className="rounded-3xl border border-dashed border-[var(--border-main)] bg-[var(--bg-surface)] p-10 sm:p-14 text-center text-[var(--text-main)] shadow-warm-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-surface-subtle)]">
                    <svg className="h-6 w-6 text-[var(--text-subtle)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 font-display text-xl sm:text-2xl font-bold">No feedback notes match your criteria</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
                    {allUserFeedback.length === 0
                      ? 'Testers who enroll in your prototypes will share observations and bug reports here.'
                      : 'Try resetting the product or category filters above to view all notes.'}
                  </p>
                </div>
              )}
            </motion.section>
          </div>
        </div>

        {/* Edit Listing Modal */}
        {editingProduct && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-modal-heading"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto"
          >
            <div className="my-8 w-full max-w-2xl rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 text-[var(--text-main)] shadow-warm-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-[#d96b43]">
                    Listing Management
                  </p>
                  <h2 id="edit-modal-heading" className="mt-1 font-display text-2xl font-bold tracking-tight text-[var(--text-main)]">
                    Edit &ldquo;{editingProduct.name}&rdquo;
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                  aria-label="Close edit modal"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="mt-6 space-y-5" noValidate>
                {editErrors.form && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-semibold text-rose-500">
                    {editErrors.form}
                  </div>
                )}

                {/* Product Name */}
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">
                    Product Name <span className="text-[#d96b43]">*</span>
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => handleEditInputChange('name', e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border-main)] bg-[var(--bg-page)] px-4 py-2.5 text-sm text-[var(--text-main)] outline-none focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20"
                  />
                  {editErrors.name && (
                    <p className="mt-1 text-sm font-semibold text-rose-500">{editErrors.name}</p>
                  )}
                </div>

                {/* Tagline */}
                <div>
                  <label htmlFor="edit-tagline" className="block text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">
                    Tagline <span className="text-[#d96b43]">*</span>
                  </label>
                  <input
                    id="edit-tagline"
                    type="text"
                    value={editFormData.tagline}
                    onChange={(e) => handleEditInputChange('tagline', e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border-main)] bg-[var(--bg-page)] px-4 py-2.5 text-sm text-[var(--text-main)] outline-none focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20"
                  />
                  {editErrors.tagline && (
                    <p className="mt-1 text-sm font-semibold text-rose-500">{editErrors.tagline}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">
                    Description (What it does)
                  </label>
                  <textarea
                    id="edit-description"
                    rows={3}
                    value={editFormData.description}
                    onChange={(e) => handleEditInputChange('description', e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border-main)] bg-[var(--bg-page)] p-3 text-sm text-[var(--text-main)] outline-none focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20"
                  />
                </div>

                {/* Prototype URL */}
                <div>
                  <label htmlFor="edit-prototypeUrl" className="block text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">
                    Working Prototype URL <span className="text-[#d96b43]">*</span>
                  </label>
                  <input
                    id="edit-prototypeUrl"
                    type="url"
                    value={editFormData.prototypeUrl}
                    onChange={(e) => handleEditInputChange('prototypeUrl', e.target.value)}
                    placeholder="https://myproduct.example"
                    className="mt-1.5 w-full rounded-xl border border-[var(--border-main)] bg-[var(--bg-page)] px-4 py-2.5 text-sm font-mono text-[var(--text-main)] outline-none focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20"
                  />
                  {editErrors.prototypeUrl && (
                    <p className="mt-1 text-sm font-semibold text-rose-500">
                      {editErrors.prototypeUrl}
                    </p>
                  )}
                </div>

                {/* Audience */}
                <div>
                  <label htmlFor="edit-audience" className="block text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">
                    Audience (Who it’s for) <span className="text-[#d96b43]">*</span>
                  </label>
                  <textarea
                    id="edit-audience"
                    rows={2}
                    value={editFormData.audience}
                    onChange={(e) => handleEditInputChange('audience', e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border-main)] bg-[var(--bg-page)] p-3 text-sm text-[var(--text-main)] outline-none focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20"
                  />
                  {editErrors.audience && (
                    <p className="mt-1 text-sm font-semibold text-rose-500">{editErrors.audience}</p>
                  )}
                </div>

                {/* Categories */}
                <div>
                  <span className="block text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">
                    Categories <span className="text-[#d96b43]">*</span>
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {AVAILABLE_CATEGORIES.map((cat) => {
                      const isSelected = editFormData.categories.includes(cat)
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleEditCategory(cat)}
                          className={`min-h-[36px] rounded-full border px-3.5 py-1 text-sm font-semibold transition cursor-pointer ${
                            isSelected
                              ? 'border-[#d96b43] bg-[#d96b43] text-white shadow-warm-xs'
                              : 'border-[var(--border-main)] bg-[var(--bg-page)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)]'
                          }`}
                        >
                          {isSelected && (
                            <svg className="h-3 w-3 inline-block mr-1 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                          {cat}
                        </button>
                      )
                    })}
                  </div>
                  {editErrors.categories && (
                    <p className="mt-1 text-sm font-semibold text-rose-500">
                      {editErrors.categories}
                    </p>
                  )}
                </div>

                {/* Feedback Request */}
                <div>
                  <label htmlFor="edit-feedbackRequest" className="block text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">
                    Feedback Request (What to try) <span className="text-[#d96b43]">*</span>
                  </label>
                  <textarea
                    id="edit-feedbackRequest"
                    rows={2}
                    value={editFormData.feedbackRequest}
                    onChange={(e) => handleEditInputChange('feedbackRequest', e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border-main)] bg-[var(--bg-page)] p-3 text-sm text-[var(--text-main)] outline-none focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20"
                  />
                  {editErrors.feedbackRequest && (
                    <p className="mt-1 text-sm font-semibold text-rose-500">
                      {editErrors.feedbackRequest}
                    </p>
                  )}
                </div>

                {/* Optional Targeting Preferences */}
                <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] p-5 space-y-4">
                  <p className="text-sm font-bold uppercase tracking-wider text-[#d96b43]">
                    Optional Targeting Preferences
                  </p>

                  {/* Target Roles */}
                  <div>
                    <span className="block text-sm font-semibold text-[var(--text-main)]">Target Roles</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {TARGET_ROLES.map((role) => {
                        const isSelected = editFormData.targetRoles.includes(role)
                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => toggleEditTargetRole(role)}
                            className={`min-h-[34px] rounded-full border px-3 py-1 text-sm font-medium transition cursor-pointer ${
                              isSelected
                                ? 'border-[#d96b43] bg-[#d96b43] text-white shadow-warm-xs'
                                : 'border-[var(--border-main)] bg-[var(--bg-page)] text-[var(--text-muted)] hover:bg-[var(--bg-surface)]'
                            }`}
                          >
                            {isSelected && (
                              <svg className="h-3 w-3 inline-block mr-1 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                            {role}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Target Industries */}
                  <div>
                    <span className="block text-sm font-semibold text-[var(--text-main)]">Target Industries</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {TARGET_INDUSTRIES.map((ind) => {
                        const isSelected = editFormData.targetIndustries.includes(ind)
                        return (
                          <button
                            key={ind}
                            type="button"
                            onClick={() => toggleEditTargetIndustry(ind)}
                            className={`min-h-[34px] rounded-full border px-3 py-1 text-sm font-medium transition cursor-pointer ${
                              isSelected
                                ? 'border-[#d96b43] bg-[#d96b43] text-white shadow-warm-xs'
                                : 'border-[var(--border-main)] bg-[var(--bg-page)] text-[var(--text-muted)] hover:bg-[var(--bg-surface)]'
                            }`}
                          >
                            {isSelected && (
                              <svg className="h-3 w-3 inline-block mr-1 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                            {ind}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Target Technologies */}
                  <div>
                    <span className="block text-sm font-semibold text-[var(--text-main)]">Target Technologies</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {TARGET_TECHNOLOGIES.map((tech) => {
                        const isSelected = editFormData.targetTechnologies.includes(tech)
                        return (
                          <button
                            key={tech}
                            type="button"
                            onClick={() => toggleEditTargetTech(tech)}
                            className={`min-h-[34px] rounded-full border px-3 py-1 text-sm font-medium transition cursor-pointer ${
                              isSelected
                                ? 'border-[#d96b43] bg-[#d96b43] text-white shadow-warm-xs'
                                : 'border-[var(--border-main)] bg-[var(--bg-page)] text-[var(--text-muted)] hover:bg-[var(--bg-surface)]'
                            }`}
                          >
                            {isSelected && (
                              <svg className="h-3 w-3 inline-block mr-1 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                            {tech}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="flex items-center justify-end gap-3 border-t border-[var(--border-main)] pt-5">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="min-h-[42px] rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-5 py-2 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-main)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="min-h-[42px] rounded-full bg-[#d96b43] px-6 py-2 text-sm font-semibold text-white shadow-warm-xs hover:bg-[#b85028] transition cursor-pointer"
                  >
                    Save listing changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <Footer />
      </main>
    </MotionConfig>
  )
}
