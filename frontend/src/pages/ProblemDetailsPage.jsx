import { useState } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { useDemoData } from '../context/DemoDataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

function formatDate(isoString) {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export default function ProblemDetailsPage() {
  const { problemId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const {
    getProblem,
    deleteProblem,
    toggleProblemValidation,
    toggleProblemNotification,
    toggleProblemTesterSignup,
    attachProblemSolution,
    addProblemComment,
    getUserProducts,
    getProfile,
  } = useDemoData()

  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState('')
  const [shakeCount, setShakeCount] = useState(0)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  // Modals state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAttachModal, setShowAttachModal] = useState(false)
  const [solutionTitle, setSolutionTitle] = useState('')
  const [solutionUrl, setSolutionUrl] = useState('')
  const [solutionNotes, setSolutionNotes] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [attachError, setAttachError] = useState('')

  const problem = getProblem(problemId)
  const problemMakerProfile = problem?.creatorEmail ? getProfile(problem.creatorEmail) : null
  const problemMakerName =
    problemMakerProfile?.displayName?.trim() ||
    problem?.maker ||
    (problem?.creatorEmail ? problem.creatorEmail.split('@')[0] : 'Originator')

  useDocumentTitle(
    problem ? `${problem.title} — Pre-MVP Problem Validation` : 'Problem Not Found — BuildBoard'
  )

  if (!problem) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="max-w-md w-full rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-8 text-center shadow-warm-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d96b43]/10 text-[#d96b43]">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-[var(--text-main)]">
              Problem Hypothesis Not Found
            </h1>
            <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
              This problem statement may have been deleted or is no longer available.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                to="/problems"
                className="rounded-full bg-[#d96b43] px-5 py-2.5 text-sm font-semibold text-white shadow-warm-sm transition hover:bg-[#e57b54]"
              >
                Browse All Problems
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const userEmail = user?.email?.toLowerCase().trim()
  const currentUserProfile = userEmail ? getProfile(userEmail) : null
  const currentUserName = currentUserProfile?.displayName?.trim() || (userEmail ? userEmail.split('@')[0] : 'Contributor')
  const isMaker = Boolean(userEmail && problem.creatorEmail?.toLowerCase() === userEmail)
  const hasValidated = Boolean(userEmail && problem.validatedBy?.includes(userEmail))
  const hasSubscribed = Boolean(userEmail && (problem.subscribers || []).includes(userEmail))
  const hasSignedUpAsTester = Boolean(userEmail && (problem.testerSignups || []).includes(userEmail))
  const validationCount = problem.validatedBy?.length || 0
  const subscribersCount = (problem.subscribers || []).length
  const testerSignupCount = (problem.testerSignups || []).length
  const comments = problem.comments || []
  const solutions = problem.solutions || []
  const userProducts = user ? getUserProducts(user.email) : []

  const handleToggleValidation = () => {
    if (!user) {
      navigate('/sign-in', { state: { from: location } })
      return
    }
    toggleProblemValidation(problem.id, user.email)
  }

  const handleToggleNotification = () => {
    if (!user) {
      navigate('/sign-in', { state: { from: location } })
      return
    }
    toggleProblemNotification(problem.id, user.email)
  }

  const handleToggleTesterSignup = () => {
    if (!user) {
      navigate('/sign-in', { state: { from: location } })
      return
    }
    toggleProblemTesterSignup(problem.id, user.email)
  }

  const handleDeleteProblem = () => {
    if (!user) return
    const res = deleteProblem(problem.id, user.email)
    if (res.success) {
      navigate('/problems', { replace: true })
    }
  }

  const handleAttachSolutionSubmit = (e) => {
    e.preventDefault()
    if (!user) return

    let finalTitle = solutionTitle.trim()
    let finalUrl = solutionUrl.trim()
    let chosenProductId = null

    if (selectedProductId) {
      const prod = userProducts.find((p) => p.id === selectedProductId)
      if (prod) {
        finalTitle = prod.name
        finalUrl = `/products/${prod.id}`
        chosenProductId = prod.id
      }
    }

    if (!finalTitle) {
      setAttachError('Please enter a title or choose one of your BuildBoard products.')
      return
    }

    attachProblemSolution(problem.id, {
      title: finalTitle,
      productUrl: finalUrl,
      productId: chosenProductId,
      description: solutionNotes.trim(),
      authorEmail: user.email,
      authorName: currentUserName,
      isMaker,
    })

    setShowAttachModal(false)
    setSolutionTitle('')
    setSolutionUrl('')
    setSolutionNotes('')
    setSelectedProductId('')
    setAttachError('')
  }

  const handleCommentSubmit = (e) => {
    e.preventDefault()
    if (!user) {
      navigate('/sign-in', { state: { from: location } })
      return
    }

    const trimmed = commentText.trim()
    if (!trimmed) {
      setCommentError('Please write your thoughts or feedback before submitting.')
      setShakeCount((c) => c + 1)
      return
    }
    if (trimmed.length < 5) {
      setCommentError('Comment should be at least 5 characters.')
      setShakeCount((c) => c + 1)
      return
    }

    setIsSubmittingComment(true)
    setCommentError('')

    const authorName = currentUserName
    addProblemComment(problem.id, {
      authorEmail: user.email,
      authorName,
      text: trimmed,
    })

    setCommentText('')
    setIsSubmittingComment(false)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] transition-colors">
      <Navbar />

      <main id="main-content" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/problems"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[#d96b43] transition-colors"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] transition group-hover:border-[#d96b43] group-hover:bg-[#d96b43]/10">
              <svg className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </span>
            <span>Back to Problem Hub</span>
          </Link>

          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[var(--text-subtle)]">
            <span>Posted {formatDate(problem.createdAt)}</span>
          </span>
        </div>

        {/* Main Grid: 2-column layout (min-w-0 prevents any long text blowout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Left Column: Problem Deep Dive & Solutions (7 cols, min-w-0 for flex/grid safety) */}
          <div className="lg:col-span-7 min-w-0 flex flex-col">
            
            {/* Header & Originator */}
            <article className="border-b border-[var(--border-main)] pb-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-[#b85028] dark:text-[#eb8b72]">
                    {problem.category}
                  </span>
                  <span className="text-[var(--text-subtle)]">&middot;</span>
                  <span
                    className={`text-xs font-semibold ${
                      problem.stage === 'Prototyping'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    Stage: {problem.stage}
                  </span>
                </div>

                {/* Maker Actions: Delete & Attach Solution */}
                {isMaker && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAttachModal(true)}
                      className="rounded-xl border border-[#d96b43]/40 bg-[#d96b43]/10 px-3 py-1.5 text-xs font-semibold text-[#b85028] dark:text-[#eb8b72] hover:bg-[#d96b43]/20 transition cursor-pointer"
                    >
                      + Attach Solution
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Title with word breaking for any long unspaced strings */}
              <h1 className="mt-4 font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--text-main)] leading-[1.18] break-words [overflow-wrap:anywhere]">
                {problem.title}
              </h1>

              {/* Problem Originator Byline */}
              <div className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--border-main)] pt-4 text-xs sm:text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#141b16] font-display text-sm font-bold text-[#f4ede2] dark:bg-[#f3f4f0] dark:text-[#0b100c] shadow-warm-xs">
                    {problemMakerName?.charAt(0).toUpperCase() || 'M'}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--text-main)] truncate">{problemMakerName}</span>
                      {isMaker && (
                        <span className="shrink-0 rounded-md bg-[#d96b43]/15 px-2 py-0.5 text-[10px] font-bold text-[#b85028] dark:text-[#eb8b72]">
                          You (Maker)
                        </span>
                      )}
                    </div>
                    <span className="text-[var(--text-subtle)] text-xs">
                      Hypothesis posted on {formatDate(problem.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <span>{validationCount} confirmations</span>
                </div>
              </div>
            </article>

            {/* Core Narrative Sections Container */}
            <div className="border-b border-[var(--border-main)] py-8 space-y-8">
              
              {/* Section 1: The Core Friction */}
              <section>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#b85028] dark:text-[#eb8b72]">
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>The Core Friction & Pain Point</span>
                </div>
                <p className="mt-3 text-base sm:text-lg lg:text-xl leading-relaxed text-[var(--text-main)] font-normal whitespace-pre-line break-words [overflow-wrap:anywhere]">
                  {problem.statement}
                </p>
              </section>

              {/* Section 2: Current Workarounds */}
              {problem.workarounds && (
                <section className="border-t border-[var(--border-main)] pt-6">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    <svg className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span>How People Cope Today (Current Hacks)</span>
                  </div>
                  <div className="mt-3 border-l-2 border-[#d96b43] pl-4 py-1 text-base sm:text-lg leading-relaxed text-[var(--text-muted)] italic break-words [overflow-wrap:anywhere]">
                    &ldquo;{problem.workarounds}&rdquo;
                  </div>
                </section>
              )}

              {/* Section 3: Target Audience */}
              <section className="border-t border-[var(--border-main)] pt-6">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#d96b43]">
                  <svg className="h-4 w-4 shrink-0 text-[#d96b43]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>Target Audience & Impacted Personas</span>
                </div>
                <p className="mt-2.5 text-base sm:text-lg font-semibold text-[var(--text-main)] break-words [overflow-wrap:anywhere]">
                  {problem.targetAudience}
                </p>

                {(problem.targetRoles?.length > 0 || problem.targetIndustries?.length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs sm:text-sm">
                    {problem.targetRoles?.map((role) => (
                      <span
                        key={role}
                        className="rounded-lg border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-2.5 py-1 font-medium text-[var(--text-muted)]"
                      >
                        {role}
                      </span>
                    ))}
                    {problem.targetIndustries?.map((ind) => (
                      <span
                        key={ind}
                        className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 font-medium text-emerald-800 dark:text-emerald-300"
                      >
                        {ind}
                      </span>
                    ))}
                  </div>
                )}
              </section>

              {/* Section 4: Proposed Concept */}
              {problem.proposedConcept && (
                <section className="border-t border-[var(--border-main)] pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#b85028] dark:text-[#eb8b72]">
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span>Hypothesized Solution Concept</span>
                    </div>
                    <span className="rounded-md bg-[#d96b43]/10 px-2.5 py-0.5 text-xs font-bold text-[#b85028] dark:text-[#eb8b72]">
                      Pre-Code Idea
                    </span>
                  </div>
                  <p className="mt-2.5 text-base sm:text-lg leading-relaxed text-[var(--text-main)] break-words [overflow-wrap:anywhere]">
                    {problem.proposedConcept}
                  </p>
                </section>
              )}
            </div>

            {/* Attached Prototype Solutions Hub */}
            <section className="border-b border-[var(--border-main)] py-8">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-main)] pb-4">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)]">
                    Attached Prototype Solutions ({solutions.length})
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-[var(--text-muted)]">
                    Prototypes and tools built to address this specific friction.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAttachModal(true)}
                  className="rounded-xl bg-[#141b16] px-4 py-2 text-xs font-semibold text-[#f4ede2] hover:bg-[#202c24] transition dark:bg-[#f3f4f0] dark:text-[#0b100c] shadow-warm-xs cursor-pointer"
                >
                  + Propose a Solution
                </button>
              </div>

              {/* Solution cards */}
              <div className="mt-5 space-y-3">
                {solutions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--border-main)] bg-[var(--bg-surface-subtle)]/40 p-6 sm:p-8 text-center">
                    <h3 className="font-display text-base sm:text-lg font-bold text-[var(--text-main)]">
                      No prototype attached yet
                    </h3>
                    <p className="mt-2 text-sm sm:text-base text-[var(--text-muted)] max-w-lg mx-auto leading-relaxed">
                      Are you building an answer to this friction? Anyone in the BuildBoard community can attach an MVP or prototype listing to validate whether it truly solves it.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAttachModal(true)}
                      className="mt-4 rounded-xl border-2 border-[#d96b43] bg-transparent px-5 py-2.5 text-sm font-bold text-[#d96b43] hover:bg-[#d96b43]/10 transition cursor-pointer"
                    >
                      Attach your prototype
                    </button>
                  </div>
                ) : (
                  solutions.map((sol) => (
                    <div
                      key={sol.id}
                      className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)]/50 p-4 sm:p-5 transition hover:border-[#d96b43]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-[var(--text-main)]">
                              {sol.title}
                            </h3>
                            {sol.isMaker && (
                              <span className="rounded-md bg-[#d96b43]/20 px-2 py-0.5 text-[10px] font-bold text-[#b85028] dark:text-[#eb8b72]">
                                Maker&apos;s Prototype
                              </span>
                            )}
                          </div>
                          {sol.description && (
                            <p className="mt-1 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                              {sol.description}
                            </p>
                          )}
                          <p className="mt-2 text-[11px] text-[var(--text-subtle)]">
                            Proposed by {(sol.authorEmail ? getProfile(sol.authorEmail)?.displayName?.trim() : null) || sol.authorName} on {formatDate(sol.createdAt)}
                          </p>
                        </div>

                        {sol.productId ? (
                          <Link
                            to={`/products/${sol.productId}`}
                            className="shrink-0 rounded-xl bg-[#d96b43] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#e57b54] transition shadow-warm-xs"
                          >
                            Test Prototype &rarr;
                          </Link>
                        ) : sol.productUrl ? (
                          <a
                            href={sol.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 rounded-xl border border-[var(--border-main)] bg-[var(--bg-page)] px-3.5 py-1.5 text-xs font-bold text-[var(--text-main)] hover:border-[#d96b43] transition"
                          >
                            Visit External &rarr;
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* "What If It Already Exists?" Educational Callout */}
              <div className="mt-6 rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)]/30 p-4 sm:p-5 text-sm sm:text-base leading-relaxed text-[var(--text-muted)]">
                <span className="font-bold text-sm sm:text-base text-[var(--text-main)] block mb-1">
                  💡 What if a solution already exists?
                </span>
                If you know an existing library or tool that solves this well, share it in the insights thread below. Helping a maker discover existing answers prevents unnecessary builds and guides community exploration!
              </div>
            </section>

            {/* Community Discussion & Insights Section */}
            <section className="py-8">
              <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-5">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)]">
                    Community Insights & Validation
                  </h2>
                  <p className="text-sm sm:text-base text-[var(--text-muted)] mt-1.5 leading-relaxed">
                    Have you experienced this friction? Share existing workarounds, alternative tools, or feature suggestions.
                  </p>
                </div>
                <span className="flex h-7 px-2.5 items-center justify-center rounded-lg border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] text-xs font-bold text-[var(--text-muted)]">
                  {comments.length}
                </span>
              </div>

              {/* Comment submission form */}
              <div className="mt-6">
                {user ? (
                  <form onSubmit={handleCommentSubmit} className="flex flex-col gap-3">
                    <label htmlFor="problem-comment-input" className="text-sm sm:text-base font-medium text-[var(--text-muted)]">
                      Contribute your insight as <span className="text-[var(--text-main)] font-bold">{currentUserName}</span>:
                    </label>
                    <textarea
                      key={`comment-input-${shakeCount}`}
                      id="problem-comment-input"
                      rows={3}
                      value={commentText}
                      onChange={(e) => {
                        setCommentText(e.target.value)
                        if (commentError) setCommentError('')
                      }}
                      placeholder="e.g. 'We hit this weekly when doing X. Note that library Y already exists for this, but lacks Z...'"
                      className={`w-full rounded-xl border bg-[var(--bg-page)] p-3.5 text-sm sm:text-base text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none focus:ring-1 break-words transition-colors ${
                        commentError
                          ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/30 tdev-shake'
                          : 'border-[var(--border-main)] focus:border-[#d96b43] focus:ring-[#d96b43]'
                      }`}
                    />
                    {commentError && (
                      <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                        {commentError}
                      </p>
                    )}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingComment}
                        className="rounded-xl bg-[#141b16] px-5 py-2.5 text-xs font-semibold text-[#f4ede2] transition hover:bg-[#202c24] disabled:opacity-50 dark:bg-[#f3f4f0] dark:text-[#0b100c] dark:hover:bg-[#ffffff] shadow-warm-xs cursor-pointer"
                      >
                        {isSubmittingComment ? 'Posting...' : 'Post Insight'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="rounded-xl border border-dashed border-[var(--border-main)] bg-[var(--bg-surface-subtle)]/50 p-6 text-center">
                    <p className="text-sm sm:text-base text-[var(--text-muted)]">
                      Sign in to share your experience with this problem or suggest solutions.
                    </p>
                    <Link
                      to="/sign-in"
                      state={{ from: location }}
                      className="mt-3 inline-block rounded-xl bg-[#d96b43] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#e57b54] shadow-warm-xs"
                    >
                      Sign in to Comment
                    </Link>
                  </div>
                )}
              </div>

              {/* Comments Stream */}
              <div className="mt-8 flex flex-col gap-3">
                {comments.length === 0 ? (
                  <p className="text-center py-8 text-sm text-[var(--text-subtle)] italic">
                    No community insights yet. Be the first to validate or share your thoughts!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`overflow-hidden rounded-xl border p-4 sm:p-5 text-sm transition-colors ${
                        comment.isMakerReply
                          ? 'border-[#d96b43]/30 bg-[#d96b43]/5'
                          : 'border-[var(--border-main)] bg-[var(--bg-surface-subtle)]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        {(() => {
                          const commentProfile = comment.authorEmail ? getProfile(comment.authorEmail) : null
                          const commentName = commentProfile?.displayName?.trim() || comment.authorName || 'Contributor'
                          return (
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                comment.isMakerReply
                                  ? 'bg-[#d96b43] text-white'
                                  : 'bg-[#141b16] text-[#f4ede2] dark:bg-[#f3f4f0] dark:text-[#0b100c]'
                              }`}>
                                {commentName.charAt(0).toUpperCase()}
                              </span>
                              <span className="font-bold text-[var(--text-main)] text-xs truncate">
                                {commentName}
                              </span>
                              {comment.isMakerReply && (
                                <span className="shrink-0 rounded-md bg-[#d96b43]/20 px-2 py-0.5 text-[9px] font-bold text-[#b85028] dark:text-[#eb8b72]">
                                  Maker
                                </span>
                              )}
                            </div>
                          )
                        })()}
                        <span className="text-[10px] text-[var(--text-subtle)] shrink-0">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm leading-relaxed text-[var(--text-main)] whitespace-pre-line pl-8 break-words [overflow-wrap:anywhere]">
                        {comment.text}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Validation Terminal (5 cols, min-w-0) */}
          <aside className="lg:col-span-5 min-w-0 flex flex-col gap-6 lg:sticky lg:top-24">
            
            {/* Primary Action Card: Validate Problem */}
            <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-5 sm:p-7 shadow-warm-sm">
              <div className="text-center">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#b85028] dark:text-[#eb8b72]">
                  Pre-MVP Validation
                </span>
                <div className="mt-3 flex items-baseline justify-center gap-2">
                  <span key={validationCount} className="font-display text-4xl sm:text-5xl font-black text-[var(--text-main)] tdev-pop-in">
                    {validationCount}
                  </span>
                  <span className="text-sm font-semibold text-[var(--text-muted)]">
                    confirmed this problem
                  </span>
                </div>
                <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed">
                  Confirms this is a real problem worth building software for.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-3">
                {/* 1. Confirm / Validate Friction */}
                <button
                  type="button"
                  onClick={handleToggleValidation}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 px-4 text-sm font-bold transition-all shadow-warm-sm cursor-pointer active:scale-[0.98] ${
                    hasValidated
                      ? 'bg-[#d96b43] text-white hover:bg-[#e57b54]'
                      : 'border-2 border-[#d96b43] text-[#d96b43] bg-[var(--bg-surface)] hover:bg-[#d96b43]/10'
                  }`}
                >
                  <svg className={`h-4 w-4 transition-transform ${hasValidated ? 'scale-110' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                  <span key={hasValidated ? 'val-confirmed' : 'val-unconfirmed'} className="tdev-text-swap">
                    {hasValidated ? '✓ You Confirmed This Problem (Undo)' : '▲ I Have This Problem Too'}
                  </span>
                </button>

                {/* 2. Notification Toggle (Clean updates subscription, NOT early beta registration!) */}
                <button
                  type="button"
                  onClick={handleToggleNotification}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-semibold transition-all border cursor-pointer ${
                    hasSubscribed
                      ? 'border-[#d96b43] bg-[#d96b43]/10 text-[#b85028] dark:text-[#eb8b72]'
                      : 'border-[var(--border-main)] bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] hover:border-[#d96b43] hover:text-[var(--text-main)]'
                  }`}
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                  <span>
                    {hasSubscribed
                      ? `✓ Subscribed to Solution Updates (${subscribersCount})`
                      : `Notify Me When Solution Launches (${subscribersCount} watching)`}
                  </span>
                </button>

                {/* 3. Explicit Early Beta Volunteer Option */}
                <button
                  type="button"
                  onClick={handleToggleTesterSignup}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-medium transition-all border cursor-pointer ${
                    hasSignedUpAsTester
                      ? 'border-emerald-600 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                      : 'border-dashed border-[var(--border-main)] bg-transparent text-[var(--text-subtle)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                  <span>
                    {hasSignedUpAsTester
                      ? '✓ Registered as Beta Tester'
                      : `Volunteer as Early Tester (${testerSignupCount})`}
                  </span>
                </button>
              </div>

              {!user && (
                <p className="mt-3 text-center text-[11px] text-[var(--text-subtle)]">
                  Sign in required to record your confirmation or subscribe to updates.
                </p>
              )}
            </div>

            {/* Validation Pipeline Lifecycle */}
            <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 shadow-warm-sm">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">
                Validation Lifecycle
              </h3>

              <div className="mt-5 flex flex-col gap-5">
                {/* Step 1 */}
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-xs shadow-warm-xs">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-[var(--text-main)]">1. Problem Stated</h4>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5 leading-relaxed">
                      Friction articulated with target audience & hacks.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bold text-xs shadow-warm-xs ${
                    validationCount >= 3
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[#d96b43] text-white'
                  }`}>
                    {validationCount >= 3 ? '✓' : '2'}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-[var(--text-main)]">2. Community Validation</h4>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5 leading-relaxed">
                      {validationCount >= 3
                        ? `Validated by ${validationCount} builders and users!`
                        : `Gathering signals from users. (${validationCount} confirmed)`}
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bold text-xs ${
                    solutions.length > 0 || problem.stage === 'Prototyping'
                      ? 'bg-emerald-500 text-white shadow-warm-xs'
                      : 'border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] text-[var(--text-muted)]'
                  }`}>
                    {solutions.length > 0 || problem.stage === 'Prototyping' ? '✓' : '3'}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-[var(--text-main)]">3. Solution Attached</h4>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5 leading-relaxed">
                      {solutions.length > 0
                        ? `${solutions.length} prototype solution attached.`
                        : 'Waiting for a prototype solution to be attached.'}
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] font-bold text-xs">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-[var(--text-main)]">4. Live Structured Testing</h4>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5 leading-relaxed">
                      Subscribed users test the prototype and submit structured feedback.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Maker Card */}
            <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 shadow-warm-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                About the Originator
              </h3>
              <div className="mt-4 flex items-center gap-3 min-w-0">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#141b16] font-display text-base font-bold text-[#f4ede2] dark:bg-[#f3f4f0] dark:text-[#0b100c] shadow-warm-xs">
                  {problemMakerName?.charAt(0).toUpperCase() || 'M'}
                </span>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-[var(--text-main)] truncate">{problemMakerName}</h4>
                  <p className="text-xs text-[var(--text-subtle)] truncate">{problem.creatorEmail}</p>
                </div>
              </div>
              <p className="mt-4 text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
                Posted this hypothesis on BuildBoard to test whether others experience this friction before building an MVP.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-7 shadow-warm-lg"
            >
              <h3 className="font-display text-lg font-bold text-[var(--text-main)]">
                Delete Problem Hypothesis?
              </h3>
              <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-[var(--text-main)]">&ldquo;{problem.title}&rdquo;</span>? This will remove the problem statement, all validation votes, and discussion threads. This action cannot be undone.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-page)] px-4 py-2 text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteProblem}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition shadow-warm-xs cursor-pointer"
                >
                  Yes, Delete Hypothesis
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Attach Solution Modal */}
      <AnimatePresence>
        {showAttachModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-lg rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-warm-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
                <h3 className="font-display text-lg font-bold text-[var(--text-main)]">
                  Attach a Prototype Solution
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAttachModal(false)}
                  className="text-[var(--text-subtle)] hover:text-[var(--text-main)] text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="mt-3 text-xs text-[var(--text-muted)] leading-relaxed">
                Connect a working prototype to this problem. When testers try your build, they can verify if it genuinely resolves the friction.
              </p>

              <form onSubmit={handleAttachSolutionSubmit} className="mt-5 space-y-4">
                {/* Option A: Link an existing product owned by user */}
                {userProducts.length > 0 && (
                  <div>
                    <label htmlFor="solution-select-product" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-1">
                      Choose From Your BuildBoard Products:
                    </label>
                    <select
                      id="solution-select-product"
                      value={selectedProductId}
                      onChange={(e) => {
                        setSelectedProductId(e.target.value)
                        if (e.target.value) {
                          const prod = userProducts.find((p) => p.id === e.target.value)
                          if (prod) {
                            setSolutionTitle(prod.name)
                            setSolutionUrl(`/products/${prod.id}`)
                          }
                        }
                      }}
                      className="w-full rounded-xl border border-[var(--border-main)] bg-[var(--bg-page)] p-3 text-sm text-[var(--text-main)] outline-none focus:border-[#d96b43]"
                    >
                      <option value="">-- Or enter custom solution below --</option>
                      {userProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.tagline.slice(0, 40)}...)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Option B: Custom Title & URL */}
                <div>
                  <label htmlFor="solution-title-input" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-1">
                    Solution / Prototype Name <span className="text-[#d96b43]">*</span>
                  </label>
                  <input
                    id="solution-title-input"
                    type="text"
                    value={solutionTitle}
                    onChange={(e) => setSolutionTitle(e.target.value)}
                    placeholder="e.g. Tailwind Tokens Sync CLI"
                    className="w-full rounded-xl border border-[var(--border-main)] bg-[var(--bg-page)] p-3 text-sm text-[var(--text-main)] outline-none focus:border-[#d96b43]"
                  />
                </div>

                <div>
                  <label htmlFor="solution-url-input" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-1">
                    Prototype URL / GitHub / Listing
                  </label>
                  <input
                    id="solution-url-input"
                    type="text"
                    value={solutionUrl}
                    onChange={(e) => setSolutionUrl(e.target.value)}
                    placeholder="e.g. https://github.com/maker/tool or https://mytool.app"
                    className="w-full rounded-xl border border-[var(--border-main)] bg-[var(--bg-page)] p-3 text-sm text-[var(--text-main)] outline-none focus:border-[#d96b43]"
                  />
                </div>

                <div>
                  <label htmlFor="solution-notes-input" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-1">
                    How does it solve this problem?
                  </label>
                  <textarea
                    id="solution-notes-input"
                    rows={3}
                    value={solutionNotes}
                    onChange={(e) => setSolutionNotes(e.target.value)}
                    placeholder="Explain what testers should try and how this addresses the friction..."
                    className="w-full rounded-xl border border-[var(--border-main)] bg-[var(--bg-page)] p-3 text-sm text-[var(--text-main)] outline-none focus:border-[#d96b43]"
                  />
                </div>

                {attachError && (
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    {attachError}
                  </p>
                )}

                <div className="mt-6 flex justify-end gap-3 pt-2 border-t border-[var(--border-main)]">
                  <button
                    type="button"
                    onClick={() => setShowAttachModal(false)}
                    className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-page)] px-4 py-2 text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#d96b43] px-5 py-2 text-xs font-semibold text-white hover:bg-[#e57b54] transition shadow-warm-xs cursor-pointer"
                  >
                    Attach Solution
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  )
}
