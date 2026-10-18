import { useState, useMemo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useAuth } from '../context/AuthContext.jsx'
import { useDemoData } from '../context/DemoDataContext.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function TesterActivityPage() {
  useDocumentTitle('Tester Activity & Recognition | BuildBoard')
  const { user } = useAuth()
  const {
    getUserEnrolledProducts,
    getUserFeedback,
    getTesterRecognition,
    getProfile,
  } = useDemoData()
  const navigate = useNavigate()
  const location = useLocation()

  // Active view tab: 'enrolled' | 'recognition' | 'all-feedback'
  const [activeTab, setActiveTab] = useState('enrolled')
  // Enrolled filter: 'all' | 'submitted' | 'pending'
  const [enrolledFilter, setEnrolledFilter] = useState('all')

  const currentEmail = user?.email || ''
  const enrolledItems = useMemo(
    () => (currentEmail ? getUserEnrolledProducts(currentEmail) : []),
    [currentEmail, getUserEnrolledProducts]
  )
  const userFeedback = useMemo(
    () => (currentEmail ? getUserFeedback(currentEmail) : []),
    [currentEmail, getUserFeedback]
  )
  const recognition = useMemo(
    () => (currentEmail ? getTesterRecognition(currentEmail) : { totalPoints: 0, helpfulCount: 0, items: [] }),
    [currentEmail, getTesterRecognition]
  )
  const profile = useMemo(
    () => (currentEmail ? getProfile(currentEmail) : null),
    [currentEmail, getProfile]
  )

  // Map of productId -> feedback items submitted by this tester
  const feedbackByProduct = useMemo(() => {
    const map = new Map()
    for (const fb of userFeedback) {
      if (!map.has(fb.productId)) {
        map.set(fb.productId, [])
      }
      map.get(fb.productId).push(fb)
    }
    return map
  }, [userFeedback])

  // Tester display name without exposing private email address
  const testerDisplayName = profile?.displayName || (currentEmail ? currentEmail.split('@')[0] : 'Community Tester')

  // Statistics derived purely from real stored data
  const totalEnrolled = enrolledItems.length
  const totalFeedbackNotes = userFeedback.length
  const totalRecognitionPoints = recognition.totalPoints
  const totalHelpfulNotes = recognition.helpfulCount

  const reviewedEnrolledCount = enrolledItems.filter((item) =>
    feedbackByProduct.has(item.productId)
  ).length
  const pendingEnrolledCount = totalEnrolled - reviewedEnrolledCount

  // Filtered enrolled prototypes
  const filteredEnrolled = useMemo(() => {
    if (enrolledFilter === 'submitted') {
      return enrolledItems.filter((item) => feedbackByProduct.has(item.productId))
    }
    if (enrolledFilter === 'pending') {
      return enrolledItems.filter((item) => !feedbackByProduct.has(item.productId))
    }
    return enrolledItems
  }, [enrolledItems, enrolledFilter, feedbackByProduct])

  // Authentication Required Gate
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
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                </svg>
              </div>
              <p className="mt-4 text-sm font-bold uppercase tracking-wider text-[#d96b43]">
                Tester Access Required
              </p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-display font-semibold tracking-tight text-[var(--text-main)]">
                Sign in to view tester activity
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                The tester activity and recognition studio tracks prototypes you&apos;ve enrolled in, your submitted feedback notes, and community recognition points awarded by builders on this device.
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
                ← Discover Prototypes on Explore
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

          <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
            {/* Header & Tester Identity */}
            <header className="border-b border-[var(--border-main)] pb-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-3 py-1 text-sm font-semibold text-[#d96b43] shadow-warm-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#d96b43]" />
                      Tester Studio
                    </span>
                  </div>
                  <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-display font-semibold tracking-tight text-[var(--text-main)]">
                    Tester Activity & <span className="italic font-normal text-[#d96b43] dark:text-[#e07a5f]">Recognition</span>
                  </h1>
                  <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">
                    Review prototypes you have enrolled in, monitor your structured feedback notes, and track community recognition points awarded directly by builders.
                  </p>
                </div>

                {/* Tester Identity Pill (preserves email privacy) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] px-4 py-2.5 shadow-warm-sm">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d96b43]/15 font-display font-bold text-sm text-[#d96b43]">
                      {testerDisplayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="block text-sm font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                        Tester Profile
                      </span>
                      <span className="text-sm font-bold text-[var(--text-main)]">
                        {testerDisplayName}
                      </span>
                    </div>
                  </div>
                  <Link
                    to="/profile/setup"
                    className="inline-flex items-center justify-center rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-main)] shadow-warm-sm transition hover:bg-[var(--bg-surface-subtle)] hover:text-[#d96b43]"
                  >
                    Edit Preferences →
                  </Link>
                </div>
              </div>

              {/* 4 Core Summary Metrics */}
              <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {/* Total Recognition Points */}
                <div className="rounded-2xl border border-[#d96b43]/30 bg-[#d96b43]/5 p-5 shadow-warm-sm transition hover:border-[#d96b43]/60">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold uppercase tracking-wider text-[#d96b43]">
                      Recognition Points
                    </span>
                    <svg className="h-4 w-4 text-[#d96b43]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="8" r="6" />
                      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                    </svg>
                  </div>
                  <p className="mt-2 font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-main)]">
                    {totalRecognitionPoints}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {totalRecognitionPoints === 1 ? '1 helpful note' : `${totalRecognitionPoints} helpful notes`} marked by builders
                  </p>
                </div>

                {/* Enrolled Prototypes */}
                <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-5 shadow-warm-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Enrolled Prototypes
                    </span>
                    <svg className="h-4 w-4 text-[var(--text-subtle)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <p className="mt-2 font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-main)]">
                    {totalEnrolled}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {reviewedEnrolledCount} reviewed · {pendingEnrolledCount} awaiting feedback
                  </p>
                </div>

                {/* Feedback Notes Submitted */}
                <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-5 shadow-warm-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Feedback Shared
                    </span>
                    <svg className="h-4 w-4 text-[var(--text-subtle)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <p className="mt-2 font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-main)]">
                    {totalFeedbackNotes}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Structured notes submitted to builders
                  </p>
                </div>

                {/* Helpful Marks */}
                <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-5 shadow-warm-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Marked Helpful
                    </span>
                    <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="mt-2 font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-main)]">
                    {totalHelpfulNotes}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Earned +1 recognition point each
                  </p>
                </div>
              </div>

              {/* Concise Explanation Banner for Recognition Points */}
              <div className="mt-6 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] p-5 text-sm text-[var(--text-main)] shadow-warm-sm">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#d96b43]/15 text-[#d96b43]">
                    <svg className="h-4 w-4 text-[#d96b43]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="8" r="6" />
                      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-[#d96b43]">
                      How Recognition Points Work
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
                      Recognition points are awarded exclusively when product builders manually evaluate your feedback notes and mark them as helpful on this device. BuildBoard never generates automated points for simple activity or word counts—points reflect real appreciation from product creators. Each helpful note awards <strong>1 recognition point</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </header>

            <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-[var(--border-main)] pb-3">
              {[
                { id: 'enrolled', label: 'Enrolled Prototypes', count: totalEnrolled },
                { id: 'recognition', label: 'Recognized Feedback', count: totalHelpfulNotes },
                { id: 'all-feedback', label: 'All Submitted Notes', count: totalFeedbackNotes },
              ].map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative rounded-full px-4 py-2 text-sm font-semibold transition cursor-pointer ${
                      isActive
                        ? 'text-white'
                        : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-main)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)]'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="tester-tab-indicator"
                        className="absolute inset-0 rounded-full bg-[#1b241e] shadow-warm-sm dark:bg-[#fbfaf7]"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className={`relative ${isActive ? 'text-white dark:text-[#0b100c]' : ''}`}>
                      {tab.label} ({tab.count})
                    </span>
                  </button>
                )
              })}
            </div>

            <AnimatePresence mode="wait">
            {/* TAB 1: Enrolled Prototypes */}
            {activeTab === 'enrolled' && (
              <motion.section
                key="tab-enrolled"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                aria-labelledby="enrolled-prototypes-heading"
                className="mt-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 id="enrolled-prototypes-heading" className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-[var(--text-main)]">
                      Your Enrolled Prototypes
                    </h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      Prototypes you have joined to test. Test each workflow and submit structured feedback to help the maker.
                    </p>
                  </div>

                  {totalEnrolled > 0 && (
                    <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-1">
                      <button
                        type="button"
                        onClick={() => setEnrolledFilter('all')}
                        className={`rounded-lg px-2.5 py-1 text-sm font-medium transition cursor-pointer ${
                          enrolledFilter === 'all'
                            ? 'bg-[var(--bg-surface-subtle)] text-[var(--text-main)] font-semibold'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        All ({totalEnrolled})
                      </button>
                      <button
                        type="button"
                        onClick={() => setEnrolledFilter('submitted')}
                        className={`rounded-lg px-2.5 py-1 text-sm font-medium transition cursor-pointer ${
                          enrolledFilter === 'submitted'
                            ? 'bg-[var(--bg-surface-subtle)] text-[var(--text-main)] font-semibold'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        Reviewed ({reviewedEnrolledCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setEnrolledFilter('pending')}
                        className={`rounded-lg px-2.5 py-1 text-sm font-medium transition cursor-pointer ${
                          enrolledFilter === 'pending'
                            ? 'bg-[var(--bg-surface-subtle)] text-[var(--text-main)] font-semibold'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        Pending ({pendingEnrolledCount})
                      </button>
                    </div>
                  )}
                </div>

                {totalEnrolled === 0 ? (
                  /* Empty state for testers with 0 enrollments */
                  <div className="mt-8 rounded-3xl border border-dashed border-[var(--border-main)] bg-[var(--bg-surface)] p-10 text-center sm:p-14">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-surface-subtle)]">
                      <svg className="h-6 w-6 text-[var(--text-subtle)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                      </svg>
                    </div>
                    <h3 className="mt-4 text-lg font-display font-semibold text-[var(--text-main)]">
                      You haven&apos;t enrolled in any prototypes yet
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
                      Explore early-stage software and working prototypes on BuildBoard. Enroll in prototypes that match your background to test features and share feedback.
                    </p>
                    <div className="mt-6">
                      <Link
                        to="/explore"
                        className="inline-flex items-center justify-center rounded-full bg-[#d96b43] px-5 py-2.5 text-sm font-semibold text-white shadow-warm-sm transition hover:bg-[#b85028]"
                      >
                        Discover Prototypes on Explore →
                      </Link>
                    </div>
                  </div>
                ) : filteredEnrolled.length === 0 ? (
                  /* Filtered empty state */
                  <div className="mt-8 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-8 text-center text-sm text-[var(--text-muted)]">
                    No prototypes match the selected filter ({enrolledFilter}).
                  </div>
                ) : (
                  /* List of enrolled prototypes */
                  <div className="mt-6 grid gap-5">
                    {filteredEnrolled.map(({ productId, enrolledAt, product }) => {
                      const submittedNotes = feedbackByProduct.get(productId) || []
                      const hasFeedback = submittedNotes.length > 0
                      const latestNote = hasFeedback ? submittedNotes[0] : null

                      return (
                        <article
                          key={productId}
                          className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-5 shadow-warm-sm transition hover:border-[var(--border-strong)] sm:p-6"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1">
                              {/* Categories, stage, and enrollment date */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-2.5 py-0.5 text-sm font-semibold text-[var(--text-muted)]">
                                  {product.stage || 'Working prototype'}
                                </span>
                                {product.categories?.map((cat) => (
                                  <span
                                    key={cat}
                                    className="rounded-full bg-[#d96b43]/10 px-2.5 py-0.5 text-sm font-semibold text-[#d96b43]"
                                  >
                                    {cat}
                                  </span>
                                ))}
                                <span className="text-sm text-[var(--text-subtle)]">
                                  Enrolled {new Date(enrolledAt).toLocaleDateString()}
                                </span>
                              </div>

                              {/* Product Title with Link to details page */}
                              <h3 className="mt-2.5 text-xl sm:text-2xl font-display font-semibold tracking-tight text-[var(--text-main)]">
                                <Link
                                  to={`/products/${productId}`}
                                  className="hover:text-[#d96b43] transition-colors"
                                >
                                  {product.name}
                                </Link>
                              </h3>
                              <p className="mt-1 text-sm text-[var(--text-muted)] leading-relaxed">
                                {product.tagline || product.description}
                              </p>

                              <p className="mt-2 text-sm text-[var(--text-subtle)]">
                                Created by <span className="font-semibold text-[var(--text-main)]">{product.maker || 'Builder'}</span>
                              </p>

                              {/* Feedback Request Focus */}
                              {product.feedbackRequest && (
                                <div className="mt-3.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] p-3.5 text-sm">
                                  <span className="font-semibold text-[#d96b43]">Builder&apos;s feedback focus: </span>
                                  <span className="text-[var(--text-main)]">{product.feedbackRequest}</span>
                                </div>
                              )}
                            </div>

                            {/* Feedback Submission Status Badge */}
                            <div className="shrink-0 sm:text-right">
                              {hasFeedback ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                  <span>Feedback submitted ({submittedNotes.length})</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-700 dark:text-amber-400">
                                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                  </svg>
                                  <span>Pending feedback</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Bar / Status Review */}
                          <div className="mt-5 flex flex-col gap-3 border-t border-[var(--border-main)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                            {hasFeedback ? (
                              <div className="text-sm text-[var(--text-muted)]">
                                <span>Latest note: </span>
                                <strong className="text-[var(--text-main)]">{latestNote.category}</strong>
                                <span className="text-[var(--text-subtle)]"> on {new Date(latestNote.createdAt).toLocaleDateString()}</span>
                                {latestNote.isHelpful && (
                                  <span className="ml-2 inline-flex items-center gap-1 font-semibold text-[#d96b43]">
                                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    <span>Marked helpful (+1 pt)</span>
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-[var(--text-muted)]">
                                You haven&apos;t shared your feedback yet. Run the prototype and note any friction.
                              </p>
                            )}

                            <div className="flex items-center gap-2.5">
                              <Link
                                to={`/products/${productId}`}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                  hasFeedback
                                    ? 'border border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)]'
                                    : 'bg-[#d96b43] text-white shadow-warm-sm hover:bg-[#b85028]'
                                }`}
                              >
                                {hasFeedback ? 'View & Add More Feedback →' : 'Test Prototype & Submit Feedback →'}
                              </Link>
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </motion.section>
            )}

            {/* TAB 2: Recognized Feedback Notes */}
            {activeTab === 'recognition' && (
              <motion.section
                key="tab-recognition"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                aria-labelledby="recognized-feedback-heading"
                className="mt-6"
              >
                <div>
                  <h2 id="recognized-feedback-heading" className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-[var(--text-main)]">
                    Feedback Notes Marked Helpful ({totalHelpfulNotes})
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Notes evaluated and confirmed as helpful by product builders. Each note earns +1 recognition point.
                  </p>
                </div>

                {totalHelpfulNotes === 0 ? (
                  /* Empty state for 0 recognition */
                  <div className="mt-8 rounded-3xl border border-dashed border-[var(--border-main)] bg-[var(--bg-surface)] p-10 text-center sm:p-14">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d96b43]/15 text-[#d96b43]">
                      <svg className="h-7 w-7 text-[#d96b43]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="8" r="6" />
                        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                      </svg>
                    </div>
                    <h3 className="mt-4 text-lg font-display font-semibold text-[var(--text-main)]">
                      No feedback notes marked helpful yet
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
                      {totalFeedbackNotes === 0
                        ? "You haven't submitted feedback for any enrolled products yet. Enroll in products and share actionable, specific observations to earn recognition points."
                        : `You have submitted ${totalFeedbackNotes} feedback ${totalFeedbackNotes === 1 ? 'note' : 'notes'}. When builders review your feedback and mark it helpful, it will appear here.`}
                    </p>

                    <div className="mx-auto mt-6 max-w-md rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] p-5 text-left text-sm">
                      <p className="font-semibold text-[var(--text-main)]">How to write feedback builders love:</p>
                      <ul className="mt-2.5 space-y-1.5 text-[var(--text-muted)]">
                        <li>• Detail what you were trying to achieve and what actually happened.</li>
                        <li>• Point out specific UI friction, confusing steps, or unhandled errors.</li>
                        <li>• Clarify what you expected vs what rendered on screen.</li>
                        <li>• Highlight moments where the interface felt intuitive or valuable.</li>
                      </ul>
                    </div>

                    <div className="mt-6">
                      <Link
                        to="/explore"
                        className="inline-flex items-center justify-center rounded-full bg-[#1b241e] px-5 py-2.5 text-sm font-semibold text-white shadow-warm-sm transition hover:bg-[#2e3b32] dark:bg-[#fbfaf7] dark:text-[#0b100c]"
                      >
                        Explore Prototypes to Test →
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* List of recognized feedback notes */
                  <div className="mt-6 grid gap-5">
                    {recognition.items.map((fb) => (
                      <article
                        key={fb.id}
                        className="rounded-2xl border border-emerald-500/30 bg-[var(--bg-surface)] p-5 shadow-warm-sm transition hover:border-emerald-500/50 sm:p-6"
                      >
                        {/* Header: Product link, category badge, recognition badge */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border-main)] pb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-[var(--text-subtle)]">
                              Product:
                            </span>
                            <Link
                              to={`/products/${fb.productId}`}
                              className="text-sm font-display font-bold text-[var(--text-main)] hover:text-[#d96b43] underline decoration-[#d96b43] decoration-2 underline-offset-4"
                            >
                              {fb.product?.name || 'View Prototype'}
                            </Link>
                            <span className="rounded-full bg-[#d96b43]/10 px-2.5 py-0.5 text-sm font-semibold text-[#d96b43]">
                              {fb.category}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>Marked Helpful (+1 Pt)</span>
                            </span>
                            <span className="text-sm text-[var(--text-subtle)]">
                              {new Date(fb.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Feedback Experience & Likes */}
                        <div className="mt-4 text-base leading-relaxed text-[var(--text-main)]">
                          <p className="break-words font-medium">{fb.experience}</p>
                          {fb.likes && (
                            <p className="mt-2 text-sm text-[var(--text-muted)] break-words">
                              <span className="font-semibold text-[var(--text-main)]">What worked well: </span>
                              {fb.likes}
                            </p>
                          )}
                        </div>

                        {/* Builder Reply (if available) */}
                        {fb.reply && (
                          <div className="mt-4 rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] p-3.5">
                            <div className="flex items-center justify-between gap-2 border-b border-[var(--border-main)] pb-1.5">
                              <span className="text-sm font-bold uppercase tracking-wider text-[#d96b43]">
                                Builder Reply from {fb.reply.repliedBy || fb.product?.maker || 'Maker'}
                              </span>
                              <span className="text-sm text-[var(--text-subtle)]">
                                {new Date(fb.reply.repliedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="mt-2 text-sm sm:text-base leading-relaxed text-[var(--text-main)] break-words">
                              {fb.reply.text}
                            </p>
                          </div>
                        )}

                        {/* Action link to product */}
                        <div className="mt-4 flex justify-end">
                          <Link
                            to={`/products/${fb.productId}`}
                            className="text-sm font-semibold text-[#d96b43] hover:underline cursor-pointer"
                          >
                            Open Product Details & Community Feed →
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </motion.section>
            )}

            {/* TAB 3: All Submitted Notes */}
            {activeTab === 'all-feedback' && (
              <motion.section
                key="tab-all-feedback"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                aria-labelledby="all-feedback-heading"
                className="mt-6"
              >
                <div>
                  <h2 id="all-feedback-heading" className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-[var(--text-main)]">
                    All Feedback Notes Submitted ({totalFeedbackNotes})
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Every feedback note you have contributed to prototypes on this device.
                  </p>
                </div>

                {totalFeedbackNotes === 0 ? (
                  <div className="mt-8 rounded-3xl border border-dashed border-[var(--border-main)] bg-[var(--bg-surface)] p-10 text-center sm:p-14">
                    <p className="font-bold text-[var(--text-main)]">No feedback notes submitted yet.</p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      When you test enrolled prototypes and submit feedback, your notes will be listed here.
                    </p>
                    <div className="mt-5">
                      <button
                        type="button"
                        onClick={() => setActiveTab('enrolled')}
                        className="rounded-full bg-[#1b241e] px-4 py-2 text-sm font-semibold text-white shadow-warm-sm hover:bg-[#2e3b32] dark:bg-[#fbfaf7] dark:text-[#0b100c] cursor-pointer"
                      >
                        View Enrolled Prototypes →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-4">
                    {userFeedback.map((fb) => (
                      <article
                        key={fb.id}
                        className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-4 shadow-warm-sm sm:p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-main)] pb-2.5">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/products/${fb.productId}`}
                              className="font-bold text-sm text-[var(--text-main)] hover:text-[#d96b43]"
                            >
                              {fb.product?.name || fb.productId}
                            </Link>
                            <span className="rounded-full bg-[#d96b43]/10 px-2 py-0.5 text-sm font-semibold text-[#d96b43]">
                              {fb.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {fb.isHelpful ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>Marked helpful (+1 pt)</span>
                              </span>
                            ) : (
                              <span className="text-sm text-[var(--text-subtle)]">
                                Under maker review
                              </span>
                            )}
                            <span className="text-sm text-[var(--text-subtle)]">
                              {new Date(fb.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <p className="mt-3 text-base leading-relaxed text-[var(--text-main)] break-words">
                          {fb.experience}
                        </p>
                        {fb.likes && (
                          <p className="mt-2 text-sm text-[var(--text-muted)] break-words">
                            <strong className="text-[var(--text-main)]">Liked: </strong>
                            {fb.likes}
                          </p>
                        )}

                        {fb.reply && (
                          <div className="mt-3 rounded-lg border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] p-2.5 text-sm leading-relaxed">
                            <span className="font-semibold text-[#d96b43]">
                              Builder reply ({fb.reply.repliedBy}):{' '}
                            </span>
                            <span className="text-[var(--text-main)]">{fb.reply.text}</span>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </motion.section>
            )}
            </AnimatePresence>
          </div>
        </div>

        <Footer />
      </main>
    </MotionConfig>
  )
}
