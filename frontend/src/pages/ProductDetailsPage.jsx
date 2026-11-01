import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router'
import { MotionConfig, motion, AnimatePresence } from 'motion/react'
import { useAuth } from '../context/AuthContext.jsx'
import { useDemoData } from '../context/DemoDataContext.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { getFeedbackReminderInfo } from '../utils/feedbackReminder.js'
import { useIndexedDbMedia } from '../utils/indexedDB.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

function GalleryThumbnailItem({ mediaId, fallbackUrl, activeImage, onClick, label }) {
  const { url } = useIndexedDbMedia(mediaId, fallbackUrl)
  const src = url || fallbackUrl
  if (!src) return null
  const isSelected = Boolean(activeImage && (activeImage === src || activeImage === url))
  return (
    <button
      type="button"
      onClick={() => onClick(src)}
      className={`relative overflow-hidden rounded-xl border transition-all cursor-pointer shrink-0 ${
        isSelected
          ? 'border-[#d96b43] ring-2 ring-[#d96b43]/30'
          : 'border-[var(--border-main)] opacity-70 hover:opacity-100'
      }`}
    >
      <img src={src} alt={label} className="h-16 w-24 object-cover" />
    </button>
  )
}

// ─── Feedback Category Options with Artisanal Icons ──────────────────────────

const FEEDBACK_CATEGORIES = [
  {
    id: 'What worked well',
    label: 'What worked well',
    description: 'Strengths, clear flows, or delight',
    color: 'border-[var(--border-main)] bg-[var(--bg-surface-subtle)] text-[var(--text-muted)]',
    activeColor: 'border-[#d96b43] bg-[#d96b43] text-white shadow-warm-xs',
    icon: (
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
    ),
  },
  {
    id: 'Bug or issue',
    label: 'Bug or issue',
    description: 'Broken behaviors or unexpected errors',
    color: 'border-[var(--border-main)] bg-[var(--bg-surface-subtle)] text-[var(--text-muted)]',
    activeColor: 'border-[#d96b43] bg-[#d96b43] text-white shadow-warm-xs',
    icon: (
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  {
    id: 'Usability',
    label: 'Usability & Flow',
    description: 'Confusion, friction, or mental overhead',
    color: 'border-[var(--border-main)] bg-[var(--bg-surface-subtle)] text-[var(--text-muted)]',
    activeColor: 'border-[#d96b43] bg-[#d96b43] text-white shadow-warm-xs',
    icon: (
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    id: 'UI',
    label: 'UI & Visuals',
    description: 'Layout, contrast, hierarchy, or typography',
    color: 'border-[var(--border-main)] bg-[var(--bg-surface-subtle)] text-[var(--text-muted)]',
    activeColor: 'border-[#d96b43] bg-[#d96b43] text-white shadow-warm-xs',
    icon: (
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    ),
  },
  {
    id: 'Feature idea',
    label: 'Feature idea',
    description: 'Missing workflow or natural next step',
    color: 'border-[var(--border-main)] bg-[var(--bg-surface-subtle)] text-[var(--text-muted)]',
    activeColor: 'border-[#d96b43] bg-[#d96b43] text-white shadow-warm-xs',
    icon: (
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
      </svg>
    ),
  },
  {
    id: 'Other',
    label: 'Other critique',
    description: 'General engineering observation',
    color: 'border-[var(--border-main)] bg-[var(--bg-surface-subtle)] text-[var(--text-muted)]',
    activeColor: 'border-[#d96b43] bg-[#d96b43] text-white shadow-warm-xs',
    icon: (
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
      </svg>
    ),
  },
]

export default function ProductDetailsPage() {
  const { productId } = useParams()
  const {
    products,
    enrollInProduct,
    isEnrolledInProduct,
    getEnrollmentDate,
    dismissFeedbackReminder,
    isFeedbackReminderDismissed,
    feedbackList,
    addFeedback,
    getProductFeedback,
    recordProductView,
    isProductOwner,
    replyToFeedback,
    toggleFeedbackHelpful,
    getProfile,
    deleteProduct,
  } = useDemoData()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const product = products.find((item) => item.id === productId)
  const makerProfile = product?.creatorEmail ? getProfile(product.creatorEmail) : null
  const makerName =
    makerProfile?.displayName?.trim() ||
    product?.maker ||
    (product?.creatorEmail ? product.creatorEmail.split('@')[0] : 'Independent Creator')
  const isEnrolled = user && product ? isEnrolledInProduct(product.id, user.email) : false
  const isOwner = user && product ? isProductOwner(product.id, user.email) : false

  // IndexedDB media integration
  const { url: coverDbUrl } = useIndexedDbMedia(product?.mediaId, product?.image || '')
  const { url: videoDbUrl } = useIndexedDbMedia(product?.videoMediaId, product?.videoUrl || '')
  const effectiveCover = coverDbUrl || product?.image || ''
  const activeVideoSrc = videoDbUrl || product?.videoUrl || ''
  const hasVideo = Boolean(activeVideoSrc)

  // Gallery active screenshot & media tab
  const [mediaTab, setMediaTab] = useState('screenshots') // 'screenshots' | 'video'
  const [selectedImage, setSelectedImage] = useState(null)
  const activeImage = selectedImage || effectiveCover

  // Copy link feedback
  const [copiedLink, setCopiedLink] = useState(false)
  const handleCopyLink = () => {
    if (product?.productUrl) {
      navigator.clipboard.writeText(product.productUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2200)
    }
  }

  // Builder reply state for product owner
  const [replyingToFeedbackId, setReplyingToFeedbackId] = useState(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [replyError, setReplyError] = useState('')

  const handleSendReply = (feedbackId) => {
    if (!user) return
    const res = replyToFeedback(feedbackId, user.email, replyDraft)
    if (!res.success) {
      setReplyError(res.error)
      return
    }
    setReplyingToFeedbackId(null)
    setReplyDraft('')
    setReplyError('')
  }

  // Deletion modal state & handler for owner
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleDeleteProduct = () => {
    if (!user || !product) return
    const res = deleteProduct(product.id, user.email)
    if (!res.success) {
      alert(res.error || 'Failed to delete listing')
      return
    }
    navigate('/builder/dashboard', {
      state: { deletedProductName: product.name },
    })
  }

  useEffect(() => {
    if (!showDeleteModal) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowDeleteModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showDeleteModal])

  useDocumentTitle(product ? `${product.name} | BuildBoard` : 'Product Not Found | BuildBoard')

  // Record product view once per product details open
  const hasRecordedViewRef = useRef(null)
  useEffect(() => {
    if (product?.id && hasRecordedViewRef.current !== product.id) {
      hasRecordedViewRef.current = product.id
      recordProductView(product.id)
    }
  }, [product?.id, recordProductView])

  // Feedback Composer State
  const [feedbackCategory, setFeedbackCategory] = useState('')
  const [feedbackExperience, setFeedbackExperience] = useState('')
  const [feedbackLikes, setFeedbackLikes] = useState('')
  const [feedbackErrors, setFeedbackErrors] = useState({})
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false)
  const [submittedFeedbackPreview, setSubmittedFeedbackPreview] = useState(null)
  const [enrollmentError, setEnrollmentError] = useState('')

  const handleEnroll = () => {
    setEnrollmentError('')
    if (!user) {
      navigate('/sign-in', { state: { from: location } })
      return
    }

    const result = enrollInProduct(product.id, user.email)
    if (!result.success) setEnrollmentError(result.error)
  }

  // Feedback list filter
  const [feedbackFilter, setFeedbackFilter] = useState('all') // 'all' | 'helpful' | 'needs_reply'

  const handleFeedbackSubmit = (e) => {
    e.preventDefault()
    const errors = {}

    if (!feedbackCategory) {
      errors.category = 'Please choose a feedback category above.'
    }
    if (!feedbackExperience.trim()) {
      errors.experience = 'Please describe what you tested and what happened.'
    }

    if (Object.keys(errors).length > 0) {
      setFeedbackErrors(errors)
      return
    }

    setFeedbackErrors({})
    const saved = addFeedback({
      productId: product.id,
      userEmail: user?.email || 'member@example.com',
      category: feedbackCategory,
      experience: feedbackExperience.trim(),
      likes: feedbackLikes.trim(),
    })

    setSubmittedFeedbackPreview(saved)
    setIsFeedbackSubmitted(true)
  }

  const handleResetFeedback = () => {
    setFeedbackCategory('')
    setFeedbackExperience('')
    setFeedbackLikes('')
    setFeedbackErrors({})
    setIsFeedbackSubmitted(false)
  }

  const enrollmentDate =
    user && product ? getEnrollmentDate(product.id, user.email) : null

  // Check if current user has already submitted feedback
  const normalizedUserEmail = user?.email?.toLowerCase().trim()
  const hasSubmittedFeedback = Boolean(
    isFeedbackSubmitted ||
      (normalizedUserEmail &&
        product?.id &&
        feedbackList.some(
          (fb) =>
            fb.productId === product.id &&
            fb.userEmail &&
            fb.userEmail.toLowerCase().trim() === normalizedUserEmail
        ))
  )

  const isReminderDismissed =
    user && product ? isFeedbackReminderDismissed(product.id, user.email) : false

  // Show reminder only to enrolled tester who hasn't submitted feedback
  const showReminder = Boolean(
    user && product && isEnrolled && !hasSubmittedFeedback && !isReminderDismissed
  )

  const reminderInfo =
    showReminder && product
      ? getFeedbackReminderInfo(enrollmentDate, product)
      : null

  const handleScrollToFeedback = () => {
    const feedbackSection = document.getElementById('feedback-form-section')
    if (feedbackSection) {
      feedbackSection.scrollIntoView({ behavior: 'smooth' })
      const firstInput = document.getElementById('feedback-category-pills')
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 300)
      }
    }
  }

  const handleDismissReminder = () => {
    if (!user || !product) return
    dismissFeedbackReminder(product.id, user.email)
  }

  // Profile match reasons
  const profileMatchReasons = useMemo(() => {
    if (!user || !product) return []
    const profile = getProfile(user.email)
    if (!profile) return []

    const reasons = []
    const userInterests = (profile.interests || []).map((s) => s.toLowerCase().trim())
    const userRoles = (profile.roles || []).map((s) => s.toLowerCase().trim())
    const userIndustries = (profile.industries || []).map((s) => s.toLowerCase().trim())
    const userTechnologies = (profile.technologies || []).map((s) => s.toLowerCase().trim())

    if (Array.isArray(product.categories)) {
      for (const cat of product.categories) {
        if (userInterests.includes(cat.toLowerCase().trim())) {
          reasons.push(`${cat} interest`)
        }
      }
    }
    if (Array.isArray(product.targetRoles)) {
      for (const role of product.targetRoles) {
        if (userRoles.includes(role.toLowerCase().trim())) {
          reasons.push(`${role} role`)
        }
      }
    }
    if (Array.isArray(product.targetIndustries)) {
      for (const ind of product.targetIndustries) {
        if (userIndustries.includes(ind.toLowerCase().trim())) {
          reasons.push(`${ind} industry`)
        }
      }
    }
    if (Array.isArray(product.targetTechnologies)) {
      for (const tech of product.targetTechnologies) {
        if (userTechnologies.includes(tech.toLowerCase().trim())) {
          reasons.push(tech)
        }
      }
    }
    return [...new Set(reasons)]
  }, [user, getProfile, product])

  if (!product) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] transition-colors focus:outline-none flex flex-col justify-between"
      >
        <Navbar />
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <span className="inline-block rounded-full border border-[#d96b43]/30 bg-[#d96b43]/10 px-3 py-1 text-sm font-bold text-[#b85028] dark:text-[#eb8b72] mb-3">
            Product Not Found
          </span>
          <h1 className="text-3xl font-extrabold text-[var(--text-main)] sm:text-4xl">
            We couldn&apos;t find that prototype listing.
          </h1>
          <p className="mt-3 text-sm text-[var(--text-muted)] max-w-md mx-auto">
            This prototype may have been removed or does not exist on this browser session.
          </p>
          <div className="mt-6">
            <Link
              to="/explore"
              className="inline-flex items-center justify-center rounded-full bg-[#d96b43] px-5 py-2.5 text-sm font-semibold text-white shadow-warm-sm transition hover:bg-[#b85028]"
            >
              ← Back to Explore Catalog
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  const productFeedback = getProductFeedback(product.id)
  const helpfulCount = productFeedback.filter((item) => item.isHelpful).length
  const needsReplyCount = productFeedback.filter((item) => !item.reply).length

  const filteredFeedback = productFeedback.filter((item) => {
    if (feedbackFilter === 'helpful') return item.isHelpful
    if (feedbackFilter === 'needs_reply') return !item.reply
    return true
  })

  return (
    <MotionConfig reducedMotion="user">
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] transition-colors focus:outline-none"
      >
        <Navbar />

        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
          {/* Breadcrumbs & Navigation */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <Link
              to="/explore"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-muted)] hover:text-[#d96b43] transition-colors"
            >
              <span aria-hidden="true">←</span>
              Back to Explore Catalog
            </Link>

            {isOwner && (
              <div className="flex items-center gap-2">
                <Link
                  to="/builder/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-3.5 py-1 text-xs font-semibold text-[var(--text-main)] shadow-xs hover:border-[#d96b43] hover:text-[#d96b43] transition-colors"
                >
                  <span>Owner Dashboard</span>
                  <span aria-hidden="true">→</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-500/20 dark:text-rose-400 transition-colors cursor-pointer"
                  title="Delete this prototype listing"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>Delete Listing</span>
                </button>
              </div>
            )}
          </div>

          {/* Tester Profile Match Indicator */}
          {profileMatchReasons.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.08] px-4 py-2.5 text-sm sm:text-base text-[var(--text-main)] shadow-warm-xs"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white" aria-hidden="true">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-emerald-900 dark:text-emerald-200 text-sm sm:text-base">
                  Target Audience Fit
                </p>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
                  Matches your tester preferences: <span className="font-medium text-[var(--text-main)]">{profileMatchReasons.slice(0, 3).join(', ')}</span>.
                </p>
              </div>
            </motion.div>
          )}

          {/* Feedback Reminder Banner */}
          <AnimatePresence>
            {showReminder && reminderInfo && (
              <motion.aside
                aria-label="Feedback Reminder"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="mb-6 rounded-2xl border border-[#d96b43]/40 bg-gradient-to-r from-[#d96b43]/10 via-[var(--bg-surface)] to-[var(--bg-surface)] p-4 sm:p-5 text-[var(--text-main)] shadow-warm-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d96b43]/15 text-[#b85028] dark:text-[#eb8b72] shadow-xs">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[#d96b43]/30 bg-[#fbf3ee] dark:bg-[#e07a5f]/20 px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase text-[#b85028] dark:text-[#eb8b72]">
                          {reminderInfo.badge}
                        </span>
                        <span className="text-xs font-medium text-[var(--text-subtle)]">
                          Enrolled Preview
                        </span>
                      </div>

                      <h2 className="mt-1.5 font-display text-base sm:text-lg font-bold tracking-tight text-[var(--text-main)]">
                        {reminderInfo.title}
                      </h2>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)] max-w-2xl">
                        {reminderInfo.body}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={handleScrollToFeedback}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#d96b43] px-4 py-2 text-sm font-semibold text-white shadow-warm-xs transition hover:bg-[#c25832] active:translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d96b43]"
                    >
                      <span>Share feedback</span>
                      <span aria-hidden="true">↓</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDismissReminder}
                      aria-label="Dismiss feedback reminder"
                      title="Dismiss reminder"
                      className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-3 py-2 text-sm font-semibold text-[var(--text-muted)] shadow-warm-xs hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main Product Layout */}
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            
            {/* Left Column: Product Information & Overview */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              {/* Categories & Listing Status */}
              <div className="mb-4 flex flex-wrap items-center gap-1.5">
                {product.categories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-muted)]"
                  >
                    {category}
                  </span>
                ))}
                <span className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
                  {product.stage}
                </span>
                {product.enrollmentPaused ? (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                    Enrollment paused
                  </span>
                ) : (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    Enrollment open
                  </span>
                )}
                {(product.isSample || product.isLocalDemo) && (
                  <span className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
                    {product.isSample ? 'Featured' : 'Community'}
                  </span>
                )}
              </div>

              {/* Title & Tagline */}
              <h1 className="font-display text-3xl sm:text-5xl font-extrabold leading-[1.1] tracking-tight text-[var(--text-main)] break-words">
                {product.name}
              </h1>
              <p className="mt-3 text-base sm:text-lg leading-relaxed text-[var(--text-muted)] break-words">
                {product.tagline}
              </p>

              {/* Timestamp & Metadata */}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--text-subtle)]">
                {product.updatedAt ? (
                  <span>
                    Last updated: <strong className="font-semibold text-[var(--text-main)]">{new Date(product.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                  </span>
                ) : product.createdAt ? (
                  <span>
                    Listed: <strong className="font-semibold text-[var(--text-main)]">{new Date(product.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                  </span>
                ) : null}
              </div>

              {/* Media Mode Tabs if Demo Video is Present */}
              {hasVideo && (
                <div className="mt-6 flex items-center gap-2 border-b border-[var(--border-main)] pb-2.5">
                  <button
                    type="button"
                    onClick={() => setMediaTab('screenshots')}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                      mediaTab === 'screenshots'
                        ? 'bg-[#141b16] text-[#f4ede2] shadow-warm-xs dark:bg-[#f3f4f0] dark:text-[#0b100c]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <span>🖼️ Screenshots</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaTab('video')}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                      mediaTab === 'video'
                        ? 'bg-[#d96b43] text-white shadow-warm-xs'
                        : 'text-[var(--text-muted)] hover:text-[#d96b43]'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                    <span>🎬 Video Walkthrough</span>
                  </button>
                </div>
              )}

              {/* Primary Gallery Hero Preview or Video Walkthrough Player */}
              <div className={`${hasVideo ? 'mt-3' : 'mt-6'} overflow-hidden rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] shadow-warm-lg`}>
                {mediaTab === 'video' && hasVideo ? (
                  <div className="relative aspect-video w-full bg-black">
                    <video
                      key={activeVideoSrc}
                      src={activeVideoSrc}
                      controls
                      autoPlay
                      playsInline
                      className="h-full w-full object-contain bg-black"
                      poster={effectiveCover}
                    />
                  </div>
                ) : activeImage ? (
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeImage}
                      src={activeImage}
                      alt={`${product.name} product preview`}
                      initial={{ opacity: 0.6 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0.6 }}
                      transition={{ duration: 0.2 }}
                      className="h-64 w-full object-cover object-top sm:h-[400px]"
                    />
                  </AnimatePresence>
                ) : (
                  <div className="flex h-56 sm:h-72 w-full flex-col items-center justify-center bg-[var(--bg-surface-subtle)] p-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d96b43]/10 text-[#d96b43] dark:bg-[#d96b43]/20 border border-[#d96b43]/20 mb-3 shadow-warm-xs">
                      <span className="font-display text-3xl font-extrabold">{product.name?.charAt(0)?.toUpperCase() || 'P'}</span>
                    </div>
                    <p className="font-display text-lg sm:text-xl font-bold text-[var(--text-main)]">
                      No Media Preview Uploaded
                    </p>
                    <p className="mt-1.5 text-xs sm:text-sm text-[var(--text-muted)] max-w-md">
                      The maker hasn&apos;t attached screenshots or a walkthrough video for this prototype yet. You can still test it via the live link below!
                    </p>
                  </div>
                )}
              </div>

              {/* Interactive Gallery Thumbnails */}
              {mediaTab === 'screenshots' && Boolean(activeImage || product.gallery?.length > 0 || product.galleryMediaIds?.length > 0) && (
                <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
                  {/* Primary cover thumbnail if more items exist */}
                  {effectiveCover && (product.gallery?.length > 1 || product.galleryMediaIds?.length > 0) && (
                    <button
                      type="button"
                      onClick={() => setSelectedImage(effectiveCover)}
                      className={`relative overflow-hidden rounded-xl border transition-all cursor-pointer shrink-0 ${
                        activeImage === effectiveCover
                          ? 'border-[#d96b43] ring-2 ring-[#d96b43]/30'
                          : 'border-[var(--border-main)] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={effectiveCover}
                        alt={`${product.name} main cover`}
                        className="h-16 w-24 object-cover"
                      />
                    </button>
                  )}

                  {/* Seed / Remote Gallery Images */}
                  {product.gallery && product.gallery.filter((g) => g !== effectiveCover).map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className={`relative overflow-hidden rounded-xl border transition-all cursor-pointer shrink-0 ${
                        activeImage === image
                          ? 'border-[#d96b43] ring-2 ring-[#d96b43]/30'
                          : 'border-[var(--border-main)] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} view ${index + 1}`}
                        className="h-16 w-24 object-cover"
                      />
                    </button>
                  ))}

                  {/* IndexedDB Gallery Uploads */}
                  {product.galleryMediaIds && product.galleryMediaIds.map((mediaId, index) => (
                    <GalleryThumbnailItem
                      key={mediaId}
                      mediaId={mediaId}
                      fallbackUrl=""
                      activeImage={activeImage}
                      onClick={(resolvedUrl) => setSelectedImage(resolvedUrl)}
                      label={`${product.name} uploaded screenshot ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Overview & What it does */}
              <section className="mt-10">
                <p className="text-xs font-bold uppercase tracking-wider text-[#d96b43]">
                  Overview
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-[var(--text-main)]">
                  What it does
                </h2>
                <p className="mt-3 text-base sm:text-lg leading-relaxed text-[var(--text-muted)] break-words">
                  {product.description}
                </p>
              </section>

              {/* Audience & Builder Info */}
              <section className="mt-10 grid gap-6 border-t border-[var(--border-main)] pt-8 sm:grid-cols-2">
                <div className="min-w-0 overflow-hidden rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-7 shadow-warm-xs">
                  <h3 className="font-display text-base sm:text-lg font-bold text-[var(--text-main)]">
                    Target Audience
                  </h3>
                  <p className="mt-2 text-sm sm:text-base leading-relaxed text-[var(--text-muted)] break-words break-all [overflow-wrap:anywhere]">
                    {product.audience}
                  </p>

                  {(product.targetRoles?.length > 0 ||
                    product.targetIndustries?.length > 0 ||
                    product.targetTechnologies?.length > 0) && (
                    <div className="mt-3.5 space-y-1.5 border-t border-[var(--border-main)] pt-3 text-sm sm:text-base min-w-0">
                      {product.targetRoles?.length > 0 && (
                        <div className="break-words [overflow-wrap:anywhere]">
                          <span className="font-bold text-[#d96b43]">Roles: </span>
                          <span className="text-[var(--text-main)]">{product.targetRoles.join(', ')}</span>
                        </div>
                      )}
                      {product.targetIndustries?.length > 0 && (
                        <div className="break-words [overflow-wrap:anywhere]">
                          <span className="font-bold text-[#d96b43]">Industries: </span>
                          <span className="text-[var(--text-main)]">{product.targetIndustries.join(', ')}</span>
                        </div>
                      )}
                      {product.targetTechnologies?.length > 0 && (
                        <div className="break-words [overflow-wrap:anywhere]">
                          <span className="font-bold text-[#d96b43]">Tech: </span>
                          <span className="text-[var(--text-main)]">{product.targetTechnologies.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="min-w-0 overflow-hidden rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-7 shadow-warm-xs">
                  <h3 className="font-display text-base sm:text-lg font-bold text-[var(--text-main)]">
                    Product Maker
                  </h3>
                  <p className="mt-2 text-sm sm:text-base leading-relaxed text-[var(--text-muted)] break-words break-all [overflow-wrap:anywhere]">
                    {makerName}
                  </p>
                  <div className="mt-5 flex items-center gap-3 min-w-0">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#141b16] font-display text-sm font-bold text-[#f4ede2] dark:bg-[#f3f4f0] dark:text-[#0b100c]">
                      {makerName.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-[var(--text-subtle)] truncate">
                      Verified Independent Creator
                    </span>
                  </div>
                </div>
              </section>
            </motion.section>

            {/* Right Column: Prototype Access Terminal & Feedback Studio */}
            <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto pr-0.5 space-y-8">
              
              {/* ── Prototype Access Vault Card ── */}
              <div className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-warm-lg">
                
                {/* Vault Terminal Status Header */}
                <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#d96b43]">
                    Prototype Terminal
                  </span>
                  {isOwner ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d96b43]/30 bg-[#d96b43]/10 px-3 py-1 text-xs font-bold text-[#b85028] dark:text-[#eb8b72]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#d96b43] animate-pulse" aria-hidden="true" />
                      Creator View
                    </span>
                  ) : isEnrolled ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                      Access Unlocked
                    </span>
                  ) : product.enrollmentPaused ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
                      Enrollment Paused
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)]">
                      Gate Active
                    </span>
                  )}
                </div>

                {/* Maker's Prompt */}
                <div className="mt-5">
                  <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-main)]">
                    Maker&apos;s Testing Prompt
                  </h2>
                  <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-[var(--text-muted)] italic">
                    &ldquo;{product.feedbackRequest}&rdquo;
                  </p>
                </div>

                {/* Suggested Scenarios */}
                <div className="mt-5 border-t border-[var(--border-main)] pt-4">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#b85028] dark:text-[#eb8b72]">
                    What to test in this build:
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {product.whatToTry.map((item, index) => (
                      <li key={item} className="flex gap-3 text-sm sm:text-base leading-relaxed text-[var(--text-main)] font-medium">
                        <span className="font-bold text-[#d96b43] shrink-0 text-sm sm:text-base">
                          0{index + 1}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Enrollment Gate Terminal Action */}
                <div className="mt-7 border-t border-[var(--border-main)] pt-6">
                  {isOwner ? (
                    <div className="space-y-4">
                      {product.productUrl ? (
                        <div className="rounded-2xl border border-[#d96b43]/30 bg-[#d96b43]/5 p-5 text-center">
                          <span className="inline-block rounded-md bg-[#d96b43]/20 px-2.5 py-0.5 text-xs font-bold text-[#b85028] dark:text-[#eb8b72] mb-2">
                            Creator Access Active
                          </span>
                          <p className="text-sm font-semibold text-[var(--text-main)]">
                            Your prototype link is live and accessible.
                          </p>
                          <div className="mt-3.5 flex flex-col gap-2.5">
                            <a
                              href={product.productUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d96b43] px-5 py-3 text-sm font-bold text-white shadow-warm-xs transition hover:bg-[#b85028] min-h-[44px]"
                            >
                              <span>Open Live Prototype</span>
                              <span aria-hidden="true">↗</span>
                            </a>
                            <button
                              type="button"
                              onClick={handleCopyLink}
                              className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer py-1"
                            >
                              <span key={copiedLink ? 'copied' : 'copy'} className="tdev-text-swap">
                                {copiedLink ? '✓ Copied URL to clipboard' : 'Copy prototype URL'}
                              </span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] p-4 text-xs sm:text-sm leading-relaxed text-[var(--text-muted)]">
                          <span className="font-semibold text-[var(--text-main)]">Private Build:</span> You haven&apos;t added a live prototype URL to this product yet.
                        </div>
                      )}

                      <Link
                        to="/builder/dashboard"
                        className="w-full rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] px-5 py-3 text-xs sm:text-sm font-semibold text-[var(--text-main)] shadow-xs transition hover:border-[#d96b43] hover:text-[#d96b43] flex items-center justify-center gap-2"
                      >
                        <span>Manage in Builder Dashboard</span>
                        <span aria-hidden="true">→</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        className="w-full rounded-2xl border border-rose-500/30 bg-rose-500/5 px-5 py-2.5 text-xs sm:text-sm font-semibold text-rose-700 hover:bg-rose-500/15 dark:text-rose-400 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span>Delete This Prototype</span>
                      </button>
                    </div>
                  ) : !isEnrolled ? (
                    product.enrollmentPaused ? (
                      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm leading-relaxed text-amber-900 dark:text-amber-200">
                        <strong className="block font-semibold">New enrollments paused:</strong>
                        The creator has reached their testing quota or is addressing initial feedback. If you were already enrolled, you can still submit notes.
                      </div>
                    ) : (
                      <div>
                        <button
                          type="button"
                          onClick={handleEnroll}
                          className="w-full rounded-2xl bg-[#d96b43] px-6 py-4 text-base font-bold text-white shadow-warm-md transition duration-200 hover:bg-[#b85028] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2.5 min-h-[48px]"
                        >
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          <span>Enroll to Unlock Prototype Link</span>
                        </button>
                        <p className="mt-2.5 text-center text-xs text-[var(--text-subtle)]">
                          Enrollment is saved in this browser&apos;s demo data. The prototype URL &amp; repository link are client-side and aren&apos;t protected by a server.
                        </p>
                        {enrollmentError && (
                          <p role="alert" className="mt-3 text-center text-sm font-semibold text-rose-600 dark:text-rose-400">
                            {enrollmentError}
                          </p>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="space-y-4">
                      {product.productUrl ? (
                        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.08] p-5 text-center">
                          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                            Prototype Link Unlocked
                          </p>
                          <div className="mt-3.5 flex flex-col gap-2.5">
                            <a
                              href={product.productUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-700 min-h-[44px]"
                            >
                              <span>Open Live Prototype</span>
                              <span aria-hidden="true">↗</span>
                            </a>
                            <button
                              type="button"
                              onClick={handleCopyLink}
                              className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer py-1"
                            >
                              <span key={copiedLink ? 'copied' : 'copy'} className="tdev-text-swap">
                                {copiedLink ? '✓ Copied URL to clipboard' : 'Copy prototype URL'}
                              </span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] p-4 text-xs sm:text-sm leading-relaxed text-[var(--text-muted)]">
                          <span className="font-semibold text-[var(--text-main)]">Private Alpha Access:</span> Prototype testing link is being prepared by the builder. You can leave preliminary questions and notes below.
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleScrollToFeedback}
                        className="w-full text-center text-xs sm:text-sm font-semibold text-[#d96b43] hover:underline cursor-pointer py-1"
                      >
                        Jump down to Feedback Composer ↓
                      </button>
                    </div>
                  )}
                </div>

                {/* GitHub link — visible after enrollment or for the maker */}
                {product.githubUrl && (
                  isEnrolled || isOwner ? (
                    <div className="mt-5 pt-4 border-t border-[var(--border-main)] flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-[var(--text-subtle)] flex items-center gap-1.5 font-medium">
                        <svg className="w-4 h-4 fill-current text-[var(--text-muted)]" viewBox="0 0 24 24" aria-hidden="true">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                        </svg>
                        Open Source:
                      </span>
                      <a
                        href={product.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-[#d96b43] hover:underline inline-flex items-center gap-1"
                      >
                        <span>View GitHub Repository</span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    </div>
                  ) : (
                    <div className="mt-5 pt-4 border-t border-[var(--border-main)] flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-[var(--text-subtle)] flex items-center gap-1.5 font-medium">
                        <svg className="w-4 h-4 fill-current text-[var(--text-subtle)]" viewBox="0 0 24 24" aria-hidden="true">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                        </svg>
                        GitHub Repository:
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--text-subtle)] bg-[var(--bg-surface-subtle)] px-2.5 py-1 rounded-full border border-[var(--border-main)]">
                        <svg className="w-3 h-3 text-[var(--text-subtle)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        Locked
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* ── Maker Feedback Control Hub (When owner views their product) ── */}
              {isOwner && (
                <section
                  id="feedback-form-section"
                  aria-label="Maker Feedback Overview"
                  className="rounded-3xl border border-[#d96b43]/30 bg-[#d96b43]/5 p-6 sm:p-7 shadow-warm-sm scroll-mt-24"
                >
                  <div className="border-b border-[#d96b43]/20 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#d96b43]">
                      Maker Hub
                    </span>
                    <h3 className="font-display text-lg sm:text-xl font-bold text-[var(--text-main)]">
                      Your Product Testing Hub
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                      As the creator, you don&apos;t need to enroll as a tester. You can review community submissions, award recognition points, and dispatch replies in the critique thread below.
                    </p>
                  </div>
                  <div className="mt-4 flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('community-feedback-archive')
                        if (el) el.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="w-full rounded-xl bg-[#141b16] px-4 py-2.5 text-xs font-semibold text-[#f4ede2] transition hover:bg-[#202c24] dark:bg-[#f3f4f0] dark:text-[#0b100c] text-center cursor-pointer shadow-warm-xs"
                    >
                      Review Tester Critiques ({productFeedback.length}) ↓
                    </button>
                    <Link
                      to="/builder/dashboard"
                      className="w-full rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-semibold text-[var(--text-main)] transition hover:border-[#d96b43] hover:text-[#d96b43] text-center"
                    >
                      Open Builder Dashboard →
                    </Link>
                  </div>
                </section>
              )}

              {/* ── Structured Feedback Studio (Only visible if enrolled tester and not the owner) ── */}
              {!isOwner && isEnrolled && (
                <section
                  id="feedback-form-section"
                  aria-label="Tester Structured Feedback Studio"
                  className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-warm-lg scroll-mt-24"
                >
                  <div className="border-b border-[var(--border-main)] pb-3.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#d96b43]">
                      Feedback Studio
                    </span>
                    <h3 className="font-display text-xl font-bold text-[var(--text-main)]">
                      Submit Structured Critique
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm text-[var(--text-muted)]">
                      Helpful critique earns you recognition points and builder replies.
                    </p>
                  </div>

                  {isFeedbackSubmitted ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-5 space-y-4"
                    >
                      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-[var(--text-main)]">
                        <div className="flex items-center gap-3">
                          <div className="tdev-check-disc flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500 text-white shadow-warm-xs shrink-0" aria-hidden="true">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" className="tdev-draw-check" />
                            </svg>
                          </div>
                          <h4 className="font-display text-base font-bold text-emerald-900 dark:text-emerald-200">
                            Feedback Saved in This Browser
                          </h4>
                        </div>
                        <p className="mt-2 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                          Your note is saved in this browser&apos;s demo data. It isn&apos;t sent to a server or synced to another device. In this demo, the builder can mark it helpful to award you +1 recognition point.
                        </p>

                        <div className="mt-4 space-y-2 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-4 text-xs sm:text-sm">
                          <p>
                            <span className="font-bold text-[var(--text-subtle)] uppercase">Category:</span> {submittedFeedbackPreview?.category}
                          </p>
                          <p>
                            <span className="font-bold text-[var(--text-subtle)] uppercase">Observations:</span> {submittedFeedbackPreview?.experience}
                          </p>
                          {submittedFeedbackPreview?.likes && (
                            <p>
                              <span className="font-bold text-[var(--text-subtle)] uppercase">Delights:</span> {submittedFeedbackPreview?.likes}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleResetFeedback}
                        className="w-full rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] px-5 py-3 text-sm font-semibold text-[var(--text-main)] shadow-xs transition hover:bg-[var(--bg-surface-subtle)] cursor-pointer min-h-[44px]"
                      >
                        + Submit Another Feedback Note
                      </button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleFeedbackSubmit} className="mt-5 space-y-5" noValidate>
                      
                      {/* Interactive Category Selector Pills */}
                      <div>
                        <label
                          id="feedback-category-pills-label"
                          className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--text-main)]"
                        >
                          Select Category <span className="text-[#d96b43]">*</span>
                        </label>
                        <div
                          id="feedback-category-pills"
                          role="radiogroup"
                          aria-labelledby="feedback-category-pills-label"
                          className="mt-2.5 grid grid-cols-2 gap-2.5"
                        >
                          {FEEDBACK_CATEGORIES.map((cat) => {
                            const isSelected = feedbackCategory === cat.id
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                role="radio"
                                aria-checked={isSelected}
                                onClick={() => {
                                  setFeedbackCategory(cat.id)
                                  if (feedbackErrors.category) {
                                    setFeedbackErrors((prev) => ({ ...prev, category: undefined }))
                                  }
                                }}
                                className={`flex items-center gap-2 rounded-2xl border p-3 text-left text-xs sm:text-sm font-semibold transition cursor-pointer select-none ${
                                  isSelected
                                    ? cat.activeColor
                                    : `${cat.color} hover:border-[var(--border-strong)]`
                                }`}
                              >
                                {cat.icon}
                                <span className="truncate">{cat.label}</span>
                              </button>
                            )
                          })}
                        </div>
                        {feedbackErrors.category && (
                          <p className="mt-1.5 text-xs sm:text-sm font-semibold text-rose-500">
                            {feedbackErrors.category}
                          </p>
                        )}
                      </div>

                      {/* What you tested & what happened */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="feedback-experience"
                            className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--text-main)]"
                          >
                            What happened? <span className="text-[#d96b43]">*</span>
                          </label>
                          <span className="text-xs font-medium text-[var(--text-subtle)]">
                            {feedbackExperience.length} chars
                          </span>
                        </div>
                        <textarea
                          id="feedback-experience"
                          rows={4}
                          value={feedbackExperience}
                          onChange={(e) => {
                            setFeedbackExperience(e.target.value)
                            if (feedbackErrors.experience) {
                              setFeedbackErrors((prev) => ({ ...prev, experience: undefined }))
                            }
                          }}
                          placeholder={
                            feedbackCategory === 'Bug or issue'
                              ? 'Describe steps to reproduce, what you expected, and what actually occurred...'
                              : feedbackCategory === 'Usability'
                              ? 'Which step felt confusing or caused friction? What mental model did you expect?'
                              : 'Describe the steps you took, where friction occurred, or what was unexpected...'
                          }
                          className={`mt-2 w-full rounded-2xl border bg-[var(--bg-page)] p-4 text-sm sm:text-base leading-relaxed text-[var(--text-main)] placeholder:text-[var(--text-subtle)] transition outline-none focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20 ${
                            feedbackErrors.experience
                              ? 'border-rose-500 bg-rose-50/20'
                              : 'border-[var(--border-main)]'
                          }`}
                        />
                        {feedbackErrors.experience && (
                          <p className="mt-1.5 text-xs sm:text-sm font-semibold text-rose-500">
                            {feedbackErrors.experience}
                          </p>
                        )}
                      </div>

                      {/* What did you like (Optional) */}
                      <div>
                        <label
                          htmlFor="feedback-likes"
                          className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--text-main)]"
                        >
                          What felt clear or delightful? <span className="font-normal text-[var(--text-subtle)]">(Optional)</span>
                        </label>
                        <input
                          id="feedback-likes"
                          type="text"
                          value={feedbackLikes}
                          onChange={(e) => setFeedbackLikes(e.target.value)}
                          placeholder="e.g. Fast response times, clean shortcuts..."
                          className="mt-2 w-full rounded-2xl border border-[var(--border-main)] bg-[var(--bg-page)] px-4 py-3 text-sm sm:text-base text-[var(--text-main)] placeholder:text-[var(--text-subtle)] transition outline-none focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full rounded-2xl bg-[#d96b43] px-6 py-4 text-sm sm:text-base font-bold uppercase tracking-wider text-white shadow-warm-xs transition hover:bg-[#b85028] cursor-pointer min-h-[48px]"
                      >
                        Submit Structured Critique
                      </button>
                    </form>
                  )}
                </section>
              )}
            </aside>
          </div>

          {/* ── Community Feedback Thread & Builder Dispatch ── */}
          <section id="community-feedback-archive" className="mt-16 border-t border-[var(--border-main)] pt-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#d96b43]">
                  Critique Archive
                </p>
                <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-main)]">
                  Tester Feedback &amp; Maker Replies
                </h2>
                <p className="mt-1.5 text-sm text-[var(--text-muted)]">
                  Independent reviews from enrolled community testers.
                </p>
              </div>

              {/* Feedback Filter Tabs */}
              {productFeedback.length > 0 && (
                <div className="flex items-center gap-1.5 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-1 text-xs sm:text-sm">
                  <button
                    type="button"
                    onClick={() => setFeedbackFilter('all')}
                    className={`rounded-xl px-3.5 py-2 font-semibold transition cursor-pointer ${
                      feedbackFilter === 'all'
                        ? 'bg-[var(--bg-surface-subtle)] text-[var(--text-main)] shadow-xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    All ({productFeedback.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackFilter('helpful')}
                    className={`rounded-xl px-3.5 py-2 font-semibold transition cursor-pointer ${
                      feedbackFilter === 'helpful'
                        ? 'bg-[var(--bg-surface-subtle)] text-[#d96b43] shadow-xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    Helpful ({helpfulCount})
                  </button>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => setFeedbackFilter('needs_reply')}
                      className={`rounded-xl px-3.5 py-2 font-semibold transition cursor-pointer ${
                        feedbackFilter === 'needs_reply'
                          ? 'bg-[var(--bg-surface-subtle)] text-amber-600 dark:text-amber-400 shadow-xs'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      Needs Reply ({needsReplyCount})
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Filtered Feedback Cards */}
            {filteredFeedback.length > 0 ? (
              <div className="mt-8 space-y-6">
                {filteredFeedback.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-3xl border p-6 sm:p-7 text-[var(--text-main)] shadow-warm-sm transition ${
                      item.isHelpful
                        ? 'border-[#d96b43]/30 bg-[var(--bg-surface)] shadow-warm-md'
                        : 'border-[var(--border-main)] bg-[var(--bg-surface)]'
                    }`}
                  >
                    {/* Header: Category, Tester, Helpful Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-main)] pb-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)]">
                          {item.category}
                        </span>
                        {(() => {
                          const testerProfile = item.userEmail ? getProfile(item.userEmail) : null
                          const testerName = testerProfile?.displayName?.trim() || (item.userEmail ? item.userEmail.split('@')[0] : 'Community Tester')
                          return (
                            <span className="text-xs font-medium text-[var(--text-subtle)]">
                              {testerName}
                            </span>
                          )
                        })()}
                        {item.isHelpful && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#d96b43]/30 bg-[#d96b43]/10 px-2.5 py-0.5 text-xs font-bold text-[#b85028] dark:text-[#eb8b72]">
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <circle cx="12" cy="8" r="6" />
                              <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                            </svg>
                            <span>Helpful Critique (+1 Recognition Point)</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => toggleFeedbackHelpful(item.id, user.email)}
                            className={`rounded-full border px-3.5 py-1 text-xs font-semibold transition cursor-pointer ${
                              item.isHelpful
                                ? 'border-[#d96b43] bg-[#d96b43] text-white shadow-xs'
                                : 'border-[var(--border-main)] bg-[var(--bg-surface-subtle)] text-[var(--text-main)] hover:border-[#d96b43] hover:text-[#d96b43]'
                            }`}
                          >
                            <span key={item.isHelpful ? 'helpful-active' : 'helpful-idle'} className="tdev-text-swap">
                              {item.isHelpful ? 'Helpful Awarded (Undo)' : '★ Mark Helpful (+1 Point)'}
                            </span>
                          </button>
                        )}
                        <span className="text-xs text-[var(--text-subtle)]">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Feedback content */}
                    <div className="mt-4 text-base leading-relaxed text-[var(--text-main)]">
                      <p className="break-words">{item.experience}</p>
                      {item.likes && (
                        <div className="mt-3 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-4 py-2.5 text-sm text-[var(--text-muted)]">
                          <strong className="text-[var(--text-main)]">Delights:</strong> {item.likes}
                        </div>
                      )}
                    </div>

                    {/* Maker Reply Dispatch */}
                    <div className="mt-6 border-t border-[var(--border-main)] pt-4">
                      {replyingToFeedbackId === item.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            handleSendReply(item.id)
                          }}
                          className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] p-4 sm:p-5 space-y-3.5"
                        >
                          <div className="flex items-center justify-between">
                            <label
                              htmlFor={`public-reply-${item.id}`}
                              className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#d96b43]"
                            >
                              {item.reply ? 'Edit Maker Reply' : 'Dispatch Reply as Maker'}
                            </label>
                            <span className="text-xs font-medium text-[var(--text-subtle)]">
                              {replyDraft.length}/1000
                            </span>
                          </div>

                          <textarea
                            id={`public-reply-${item.id}`}
                            rows={3}
                            value={replyDraft}
                            onChange={(e) => {
                              setReplyDraft(e.target.value)
                              if (replyError) setReplyError('')
                            }}
                            placeholder="Thank the tester, clarify steps, or share upcoming patch fixes..."
                            className="w-full rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-3.5 text-sm sm:text-base leading-relaxed text-[var(--text-main)] placeholder:text-[var(--text-subtle)] outline-none focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20"
                          />

                          {replyError && (
                            <p className="text-xs sm:text-sm font-semibold text-rose-500">{replyError}</p>
                          )}

                          <div className="flex items-center gap-2.5">
                            <button
                              type="submit"
                              className="rounded-full bg-[#141b16] px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#f4ede2] shadow-xs transition hover:bg-[#202c24] dark:bg-[#f3f4f0] dark:text-[#0b100c] cursor-pointer"
                            >
                              {item.reply ? 'Save Updated Reply' : 'Publish Reply'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingToFeedbackId(null)
                                setReplyDraft('')
                                setReplyError('')
                              }}
                              className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : item.reply ? (
                        <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] p-4 sm:p-5">
                          <div className="flex items-center justify-between gap-2 border-b border-[var(--border-main)] pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#d96b43]">
                                Maker Reply ({item.reply.repliedBy || makerName})
                              </span>
                              <span className="text-xs text-[var(--text-subtle)]">
                                {new Date(item.reply.repliedAt).toLocaleDateString()}
                                {item.reply.updatedAt && ' (edited)'}
                              </span>
                            </div>
                            {isOwner && (
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyingToFeedbackId(item.id)
                                  setReplyDraft(item.reply.text)
                                  setReplyError('')
                                }}
                                className="text-xs sm:text-sm font-semibold text-[#d96b43] hover:underline cursor-pointer"
                              >
                                Edit reply
                              </button>
                            )}
                          </div>
                          <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-[var(--text-main)] break-words">
                            {item.reply.text}
                          </p>
                        </div>
                      ) : isOwner ? (
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingToFeedbackId(item.id)
                            setReplyDraft('')
                            setReplyError('')
                          }}
                          className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-4 py-2 text-xs sm:text-sm font-semibold text-[var(--text-main)] shadow-xs transition hover:border-[#d96b43] hover:text-[#d96b43] cursor-pointer"
                        >
                          + Reply as Maker
                        </button>
                      ) : null}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-dashed border-[var(--border-main)] bg-[var(--bg-surface)] p-8 text-center text-[var(--text-main)]">
                <p className="font-bold text-base">No feedback notes in this view yet.</p>
                <p className="mt-1.5 text-sm text-[var(--text-muted)]">
                  {feedbackFilter === 'helpful'
                    ? 'The maker has not marked any notes as helpful yet.'
                    : feedbackFilter === 'needs_reply'
                    ? 'All existing feedback notes have been replied to.'
                    : 'Enroll and test the prototype to share the first structured critique!'}
                </p>
              </div>
            )}
          </section>

          {/* Delete Confirmation Modal for Product Owner */}
          {showDeleteModal && product && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="product-delete-heading"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
            >
              <div className="w-full max-w-md rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-7 text-[var(--text-main)] shadow-warm-xl">
                <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-500/15">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </div>
                  <div>
                    <h2 id="product-delete-heading" className="font-display text-lg font-bold tracking-tight text-[var(--text-main)]">
                      Delete &ldquo;{product.name}&rdquo;?
                    </h2>
                    <p className="text-xs text-[var(--text-subtle)]">This action cannot be undone.</p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)]">
                  Are you sure you want to permanently delete this prototype listing? All community critiques, view metrics, and tester enrollments will be erased from this device.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-[var(--border-main)]">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteProduct}
                    className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-warm-xs hover:bg-rose-700 transition cursor-pointer active:scale-95"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            </div>
          )}

          <Footer />
        </div>
      </main>
    </MotionConfig>
  )
}
