import { useMemo, useCallback, useState, useRef, useEffect } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { motion, AnimatePresence, MotionConfig } from 'motion/react'
import { useDemoData } from '../context/DemoDataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { PROBLEM_CATEGORIES } from '../data/problems.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import LiveMarketRadar from '../components/LiveMarketRadar.jsx'

function ProblemItem({ problem, index }) {
  const { user } = useAuth()
  const { toggleProblemValidation, getProfile } = useDemoData()
  const location = useLocation()

  const makerProfile = problem.creatorEmail ? getProfile(problem.creatorEmail) : null
  const makerName = makerProfile?.displayName?.trim() || problem.maker || (problem.creatorEmail ? problem.creatorEmail.split('@')[0] : 'Independent Builder')

  const userEmail = user?.email?.toLowerCase().trim()
  const hasValidated = Boolean(userEmail && problem.validatedBy?.includes(userEmail))
  const validationCount = problem.validatedBy?.length || 0
  const commentsCount = problem.comments?.length || 0
  const testerSignupCount = problem.testerSignups?.length || 0
  const solutionsCount = problem.solutions?.length || 0

  const handleVote = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) return
    toggleProblemValidation(problem.id, user.email)
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.2) }}
      className="group relative py-6 sm:py-8 transition-colors hover:bg-[var(--bg-surface-subtle)]/40 -mx-3 px-3 sm:-mx-6 sm:px-6 rounded-2xl"
    >
      <div className="flex items-start gap-4 sm:gap-6">
        {/* Tactile Vote / Validation Pillar */}
        <div className="shrink-0 pt-0.5 relative z-10">
          {user ? (
            <button
              type="button"
              onClick={handleVote}
              aria-label={`Validate this problem. Current count: ${validationCount}`}
              title={hasValidated ? 'Undo validation' : 'Confirm: I have this problem too'}
              className={`flex min-w-[54px] sm:min-w-[62px] flex-col items-center justify-center rounded-xl border py-2 sm:py-2.5 px-2 text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                hasValidated
                  ? 'border-[#d96b43] bg-[#d96b43] text-white shadow-warm-xs'
                  : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:border-[#d96b43] hover:text-[#d96b43]'
              }`}
            >
              <svg
                className={`h-4 w-4 transition-transform ${hasValidated ? 'scale-110' : 'group-hover:-translate-y-0.5'}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
              <span key={validationCount} className="mt-1 font-display text-sm sm:text-base font-extrabold tdev-pop-in">{validationCount}</span>
              <span className="text-[10px] font-medium opacity-75">votes</span>
            </button>
          ) : (
            <Link
              to="/sign-in"
              state={{ from: location }}
              title="Sign in to validate problem"
              className="flex min-w-[54px] sm:min-w-[62px] flex-col items-center justify-center rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] py-2 sm:py-2.5 px-2 text-xs font-bold text-[var(--text-muted)] hover:border-[#d96b43] hover:text-[#d96b43] transition shadow-warm-xs"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              <span className="mt-1 font-display text-sm sm:text-base font-extrabold">{validationCount}</span>
              <span className="text-[10px] font-medium opacity-75">votes</span>
            </Link>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          {/* Metadata line: Category, Stage, Maker */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-[#b85028] dark:text-[#eb8b72]">
              {problem.category}
            </span>
            <span className="text-[var(--text-subtle)]">&middot;</span>
            <span
              className={`font-semibold ${
                problem.stage === 'Prototyping'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              {problem.stage === 'Prototyping' ? 'Prototyping' : 'Pre-Prototype'}
            </span>
            {makerName && (
              <>
                <span className="text-[var(--text-subtle)]">&middot;</span>
                <span className="text-[var(--text-subtle)]">
                  by <strong className="font-medium text-[var(--text-muted)]">{makerName}</strong>
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="mt-1.5 font-display text-lg sm:text-xl md:text-2xl font-bold leading-snug tracking-tight text-[var(--text-main)] group-hover:text-[#d96b43] dark:group-hover:text-[#e07a5f] transition-colors">
            <Link to={`/problems/${problem.id}`} className="focus:outline-none">
              <span className="absolute inset-0" aria-hidden="true" />
              {problem.title}
            </Link>
          </h3>

          {/* Problem Statement Snippet */}
          <p className="mt-2 text-sm sm:text-base leading-relaxed text-[var(--text-muted)] line-clamp-2">
            {problem.statement}
          </p>

          {/* Unboxed Details: Audience and Current Hack */}
          {(problem.targetAudience || problem.workarounds) && (
            <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1.5 text-xs sm:text-sm text-[var(--text-muted)]">
              {problem.targetAudience && (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#b85028] dark:text-[#eb8b72] uppercase tracking-wider text-[11px]">
                    Suffered By:
                  </span>
                  <span className="font-medium text-[var(--text-main)]">
                    {problem.targetAudience}
                  </span>
                </div>
              )}
              {problem.targetAudience && problem.workarounds && (
                <span className="text-[var(--text-subtle)] hidden sm:inline">&middot;</span>
              )}
              {problem.workarounds && (
                <div className="flex items-baseline gap-1.5 italic text-[var(--text-muted)]">
                  <span className="not-italic text-[11px] font-semibold text-[var(--text-subtle)] uppercase tracking-wider">
                    Current hack:
                  </span>
                  <span className="line-clamp-1">&ldquo;{problem.workarounds}&rdquo;</span>
                </div>
              )}
            </div>
          )}

          {/* Footer metrics & action */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-subtle)]">
            <div className="flex flex-wrap items-center gap-4">
              {testerSignupCount > 0 && (
                <span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                  <span>{testerSignupCount} beta testers</span>
                </span>
              )}

              <span className="flex items-center gap-1.5 font-medium">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>{commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}</span>
              </span>

              {solutionsCount > 0 && (
                <span className="flex items-center gap-1 font-semibold text-[#b85028] dark:text-[#eb8b72]">
                  <span>💡 {solutionsCount} {solutionsCount === 1 ? 'solution attached' : 'solutions attached'}</span>
                </span>
              )}
            </div>

            <Link
              to={`/problems/${problem.id}`}
              className="relative z-10 font-semibold text-[#d96b43] group-hover:text-[#b85028] hover:underline transition inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View discussion</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  )
}


export default function ProblemsPage() {
  useDocumentTitle('Community Problem Board & Pre-MVP Validation | BuildBoard')
  const { problems } = useDemoData()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const search = searchParams.get('q') || ''
  const activeCategory = searchParams.get('cat') || 'All categories'
  const filterTab = searchParams.get('tab') || 'all' // 'all' | 'most_validated' | 'needs_validation' | 'my_hypotheses'

  const setSearch = useCallback(
    (value) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set('q', value)
        else next.delete('q')
        return next
      }, { replace: true })
    },
    [setSearchParams]
  )

  const setActiveCategory = useCallback(
    (cat) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (cat && cat !== 'All categories') next.set('cat', cat)
        else next.delete('cat')
        return next
      }, { replace: true })
    },
    [setSearchParams]
  )

  const setFilterTab = useCallback(
    (tab) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (tab && tab !== 'all') next.set('tab', tab)
        else next.delete('tab')
        return next
      }, { replace: true })
    },
    [setSearchParams]
  )

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const filterMenuRef = useRef(null)
  const sortMenuRef = useRef(null)

  const SORT_OPTIONS = useMemo(
    () => [
      {
        id: 'all',
        label: 'All Problems',
        description: 'Default view ordered by creation',
      },
      {
        id: 'most_validated',
        label: 'Most Validated',
        description: 'Ranked by highest community vote count',
      },
      {
        id: 'needs_validation',
        label: 'Needs Validation',
        description: 'Under 5 validations seeking early feedback',
      },
      ...(user
        ? [
            {
              id: 'my_hypotheses',
              label: 'My Hypotheses',
              description: 'Problems submitted by your account',
            },
          ]
        : []),
    ],
    [user]
  )

  const currentSortOption = SORT_OPTIONS.find((opt) => opt.id === filterTab) || SORT_OPTIONS[0]

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setIsFilterOpen(false)
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setIsSortOpen(false)
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsFilterOpen(false)
        setIsSortOpen(false)
      }
    }
    if (isFilterOpen || isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isFilterOpen, isSortOpen])

  // Filter & Search Logic
  const filteredProblems = useMemo(() => {
    let list = [...problems]

    // Category filter
    if (activeCategory !== 'All categories') {
      list = list.filter((p) => p.category === activeCategory)
    }

    // Tab filter
    if (filterTab === 'most_validated') {
      list.sort((a, b) => (b.validatedBy?.length || 0) - (a.validatedBy?.length || 0))
    } else if (filterTab === 'needs_validation') {
      list = list.filter((p) => (p.validatedBy?.length || 0) < 5)
    } else if (filterTab === 'my_hypotheses') {
      const userEmail = user?.email?.toLowerCase().trim()
      list = list.filter((p) => p.creatorEmail === userEmail)
    }

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.statement?.toLowerCase().includes(q) ||
          p.targetAudience?.toLowerCase().includes(q) ||
          p.proposedConcept?.toLowerCase().includes(q)
      )
    }

    return list
  }, [problems, activeCategory, filterTab, search, user])

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] transition-colors">
        <Navbar />

        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
          
          {/* Hero Header */}
          <section className="pt-2 pb-10 border-b border-[var(--border-main)]">
            <div className="max-w-3xl">
              <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--text-main)] leading-[1.1]">
                Validate the problem <br className="hidden sm:inline" />
                <span className="italic font-normal text-[#d96b43] dark:text-[#e07a5f]">
                  before writing the code.
                </span>
              </h1>
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-[var(--text-muted)]">
                Don&apos;t spend three months building something nobody needs. Explore real friction submitted by software builders, vote if you suffer from it too, and volunteer as an early tester when the prototype drops.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/problems/new"
                  className="rounded-xl bg-[#d96b43] px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-warm-md transition hover:bg-[#b85028] hover:-translate-y-0.5 active:translate-y-0"
                >
                  + Share a Problem Hypothesis
                </Link>
              </div>
            </div>
          </section>

          {/* Live Market Radar (External REST API via fetch()) */}
          <LiveMarketRadar />

          {/* Directory Controls & Filter Bar */}
          <section className="mt-12" aria-labelledby="problem-directory-heading">
            <div className="flex flex-col gap-4 pb-6 border-b border-[var(--border-main)]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2
                    id="problem-directory-heading"
                    className="font-display text-2xl font-bold tracking-tight text-[var(--text-main)]"
                  >
                    Hypothesis Directory
                  </h2>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    {filteredProblems.length} active problem {filteredProblems.length === 1 ? 'statement' : 'statements'} seeking validation.
                  </p>
                </div>

                {/* Search, Filter & Sort Controls */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
                  {/* Search Box */}
                  <div className="relative flex-1 sm:w-64 md:w-72">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--text-subtle)]">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search problems, pain points..."
                      className="w-full rounded-xl border border-[var(--border-main)] bg-[var(--bg-page)] pl-10 pr-8 py-2.5 text-xs sm:text-sm text-[var(--text-main)] outline-none transition placeholder:text-[var(--text-subtle)] focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20 shadow-warm-xs"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--text-subtle)] hover:text-[var(--text-main)] cursor-pointer text-xs"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Filter Dropdown */}
                  <div className="relative shrink-0" ref={filterMenuRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsFilterOpen((prev) => !prev)
                        setIsSortOpen(false)
                      }}
                      aria-haspopup="true"
                      aria-expanded={isFilterOpen}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all shadow-warm-xs cursor-pointer ${
                        activeCategory !== 'All categories' || isFilterOpen
                          ? 'border-[#d96b43] bg-[#d96b43]/10 text-[#d96b43] dark:text-[#eb8b72]'
                          : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:border-[#d96b43] hover:text-[#d96b43]'
                      }`}
                    >
                      <svg className="h-4 w-4 shrink-0 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                      </svg>
                      <span>
                        {activeCategory === 'All categories' ? 'Filter' : activeCategory}
                      </span>
                      {activeCategory !== 'All categories' && (
                        <span className="flex h-1.5 w-1.5 rounded-full bg-[#d96b43]" />
                      )}
                      <svg
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {isFilterOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 top-full mt-2 w-64 origin-top-right rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-2 text-[var(--text-main)] shadow-warm-xl focus:outline-none z-30 tdev-dropdown max-h-80 overflow-y-auto"
                      >
                        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-subtle)] border-b border-[var(--border-main)]/60 mb-1">
                          Filter by Category
                        </div>
                        {PROBLEM_CATEGORIES.map((cat) => {
                          const isSelected = activeCategory === cat
                          return (
                            <button
                              key={cat}
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setActiveCategory(cat)
                                setIsFilterOpen(false)
                              }}
                              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                                isSelected
                                  ? 'bg-[#d96b43]/10 text-[#d96b43] font-bold dark:text-[#eb8b72]'
                                  : 'text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)]'
                              }`}
                            >
                              <span>{cat}</span>
                              {isSelected && (
                                <svg className="w-3.5 h-3.5 text-[#d96b43] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Sort Dropdown */}
                  <div className="relative shrink-0" ref={sortMenuRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSortOpen((prev) => !prev)
                        setIsFilterOpen(false)
                      }}
                      aria-haspopup="true"
                      aria-expanded={isSortOpen}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all shadow-warm-xs cursor-pointer ${
                        filterTab !== 'all' || isSortOpen
                          ? 'border-[#d96b43] bg-[#d96b43]/10 text-[#d96b43] dark:text-[#eb8b72]'
                          : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:border-[#d96b43] hover:text-[#d96b43]'
                      }`}
                    >
                      <svg className="h-4 w-4 shrink-0 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m3 16 4 4 4-4" />
                        <path d="M7 20V4" />
                        <path d="m21 8-4-4-4 4" />
                        <path d="M17 4v16" />
                      </svg>
                      <span>
                        {filterTab === 'all' ? 'Sort' : currentSortOption.label}
                      </span>
                      <svg
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {isSortOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 top-full mt-2 w-64 origin-top-right rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-2 text-[var(--text-main)] shadow-warm-xl focus:outline-none z-30 tdev-dropdown"
                      >
                        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-subtle)] border-b border-[var(--border-main)]/60 mb-1">
                          Sort & Status
                        </div>
                        {SORT_OPTIONS.map((opt) => {
                          const isSelected = filterTab === opt.id
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setFilterTab(opt.id)
                                setIsSortOpen(false)
                              }}
                              className={`w-full flex items-start justify-between gap-2 px-3 py-2 rounded-xl text-left transition cursor-pointer ${
                                isSelected
                                  ? 'bg-[#d96b43]/10 text-[#d96b43] dark:text-[#eb8b72]'
                                  : 'text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)]'
                              }`}
                            >
                              <div>
                                <div className={`text-xs font-semibold ${isSelected ? 'text-[#d96b43] dark:text-[#eb8b72]' : 'text-[var(--text-main)]'}`}>
                                  {opt.label}
                                </div>
                                <div className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                                  {opt.description}
                                </div>
                              </div>
                              {isSelected && (
                                <svg className="w-3.5 h-3.5 text-[#d96b43] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Filters bar */}
              {(activeCategory !== 'All categories' || filterTab !== 'all' || search) && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="text-[var(--text-subtle)] text-[11px] uppercase tracking-wider font-bold mr-1">
                    Active Filters:
                  </span>
                  {activeCategory !== 'All categories' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d96b43]/30 bg-[#d96b43]/10 px-3 py-1 font-semibold text-[#b85028] dark:text-[#eb8b72]">
                      <span>Category: {activeCategory}</span>
                      <button
                        type="button"
                        onClick={() => setActiveCategory('All categories')}
                        className="hover:text-[var(--text-main)] cursor-pointer text-xs"
                        title="Clear category filter"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {filterTab !== 'all' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-3 py-1 font-semibold text-[var(--text-main)]">
                      <span>Sort: {currentSortOption.label}</span>
                      <button
                        type="button"
                        onClick={() => setFilterTab('all')}
                        className="hover:text-[#d96b43] cursor-pointer text-xs"
                        title="Reset sort to all"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {search && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-3 py-1 font-semibold text-[var(--text-main)]">
                      <span>Query: &ldquo;{search}&rdquo;</span>
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="hover:text-[#d96b43] cursor-pointer text-xs"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory('All categories')
                      setFilterTab('all')
                      setSearch('')
                    }}
                    className="text-xs font-semibold text-[#d96b43] hover:underline ml-1 cursor-pointer"
                  >
                    Reset all
                  </button>
                </div>
              )}
            </div>

            {/* Problem Directory Stream */}
            <AnimatePresence mode="wait">
              {filteredProblems.length > 0 ? (
                <div className="divide-y divide-[var(--border-main)] border-b border-[var(--border-main)]">
                  {filteredProblems.map((problem, index) => (
                    <ProblemItem key={problem.id} problem={problem} index={index} />
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-16 text-center text-[var(--text-main)] border-b border-[var(--border-main)]"
                >
                  <h3 className="font-display text-2xl font-bold">No problem statements match your criteria</h3>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    Try adjusting your search terms or clearing the selected category filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('')
                      setActiveCategory('All categories')
                      setFilterTab('all')
                    }}
                    className="mt-6 rounded-xl bg-[#d96b43] px-6 py-2.5 text-sm font-semibold text-white shadow-warm-xs cursor-pointer hover:bg-[#b85028]"
                  >
                    Reset Filters
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <Footer />
        </div>
      </main>
    </MotionConfig>
  )
}
