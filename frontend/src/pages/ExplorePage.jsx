import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useDemoData } from '../context/DemoDataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { getRecommendedProducts } from '../utils/recommendations.js'
import { useIndexedDbMedia } from '../utils/indexedDB.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

/* ------------------------------------------------------------------ */
/*  ProductCard — shared between recommendation and directory grids   */
/* ------------------------------------------------------------------ */
function ProductCard({ product, index, matchInfo, viewMode = 'grid' }) {
  const { url: mediaUrl } = useIndexedDbMedia(product.mediaId, product.image)
  const { getProfile } = useDemoData()
  const displayImage = mediaUrl || product.image
  const hasVideo = Boolean(product.videoMediaId || product.videoUrl)
  const creatorProfile = product?.creatorEmail ? getProfile(product.creatorEmail) : null
  const authorName =
    creatorProfile?.displayName?.trim() ||
    product?.maker ||
    (product?.creatorEmail ? product.creatorEmail.split('@')[0] : 'Independent Builder')

  if (viewMode === 'list') {
    return (
      <motion.article
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-20px' }}
        transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2) }}
        className="group flex flex-col md:flex-row overflow-hidden rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-main)] shadow-warm-sm transition-all duration-200 hover:border-[#d96b43] dark:hover:border-[#e07a5f] hover:shadow-warm-md"
      >
        <Link
          to={`/products/${product.id}`}
          aria-label={`View details for ${product.name}`}
          className="relative block md:w-72 lg:w-80 shrink-0 overflow-hidden border-b md:border-b-0 md:border-r border-[var(--border-main)] bg-[var(--bg-surface-subtle)]"
        >
          <img
            src={displayImage}
            alt={`${product.name} preview`}
            loading="lazy"
            className="h-52 md:h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.03]"
          />
          {product.stage && (
            <span className="absolute top-3 left-3 rounded-full border border-black/10 bg-black/60 backdrop-blur px-2.5 py-0.5 text-xs font-semibold text-white">
              {product.stage}
            </span>
          )}
          {hasVideo && (
            <span className="absolute bottom-3 left-3 rounded-full border border-black/10 bg-black/75 backdrop-blur px-2.5 py-0.5 text-xs font-semibold text-white flex items-center gap-1">
              ▶ Video
            </span>
          )}
        </Link>

        <div className="flex flex-1 flex-col p-6 sm:p-7 justify-between gap-4">
          <div className="space-y-3">
            {/* Top row: Badges & Maker */}
            <div className="flex flex-wrap items-center gap-2">
              {product.enrollmentPaused ? (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  Paused
                </span>
              ) : (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Enrollment open
                </span>
              )}

              {product.categories.slice(0, 3).map((category) => (
                <span
                  key={category}
                  className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-subtle)]"
                >
                  {category}
                </span>
              ))}

              {authorName && (
                <span className="text-xs text-[var(--text-subtle)] ml-auto hidden sm:inline">
                  by <strong className="font-semibold text-[var(--text-main)]">{authorName}</strong>
                </span>
              )}
            </div>

            {/* Title & Tagline */}
            <div>
              <h3 className="font-display text-2xl font-bold tracking-tight text-[var(--text-main)]">
                <Link
                  to={`/products/${product.id}`}
                  className="hover:text-[#d96b43] dark:hover:text-[#e07a5f] transition-colors"
                >
                  {product.name}
                </Link>
              </h3>
              <p className="mt-1 text-sm sm:text-base leading-relaxed text-[var(--text-muted)] line-clamp-2">
                {product.tagline}
              </p>
            </div>

            {/* Audience Highlight: Who it's for */}
            <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-3.5 py-2">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#d96b43]">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Who it&apos;s for:</span>
              </div>
              <p className="mt-0.5 text-sm font-medium text-[var(--text-main)] leading-relaxed line-clamp-2">
                {product.audience}
              </p>
            </div>

            {/* Target roles & Tech tags */}
            {(product.targetRoles?.length > 0 || product.targetTechnologies?.length > 0) && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
                {product.targetRoles?.slice(0, 2).map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-2.5 py-0.5 text-xs sm:text-sm font-medium text-[var(--text-muted)]"
                  >
                    <span className="text-[#d96b43] font-bold">Role:</span> {role}
                  </span>
                ))}
                {product.targetTechnologies?.slice(0, 2).map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-2.5 py-0.5 text-xs sm:text-sm font-medium text-[var(--text-subtle)]"
                  >
                    <span className="text-[#d96b43] font-bold">Stack:</span> {tech}
                  </span>
                ))}
              </div>
            )}

            {/* Match info if recommendation */}
            {matchInfo && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2">
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                  <span className="text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    Profile Match: {matchInfo.score}/{matchInfo.maxScore}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200">
                  {matchInfo.reasons.map((r) => (
                    <span key={r} className="inline-flex items-center gap-1">
                      ✓ {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Row */}
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-[var(--border-main)]">
            <span className="text-xs text-[var(--text-subtle)]">
              {product.whatToTry?.length ? `${product.whatToTry.length} test tasks requested` : 'Structured feedback ready'}
            </span>
            <Link
              to={`/products/${product.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-[#141b16] px-5 py-2.5 text-sm font-semibold text-[#f4ede2] shadow-warm-xs transition hover:bg-[#202c24] dark:bg-[#f3f4f0] dark:text-[#0b100c] dark:hover:bg-[#ffffff]"
            >
              <span>View prototype</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </motion.article>
    )
  }

  // Grid view card
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.3) }}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-main)] shadow-warm-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#d96b43] dark:hover:border-[#e07a5f] hover:shadow-warm-md"
    >
      <Link
        to={`/products/${product.id}`}
        aria-label={`View details for ${product.name}`}
        className="relative block overflow-hidden border-b border-[var(--border-main)] bg-[var(--bg-surface-subtle)]"
      >
        <img
          src={displayImage}
          alt={`${product.name} preview`}
          loading="lazy"
          className="h-52 w-full object-cover object-top transition duration-300 group-hover:scale-[1.02]"
        />
        {product.stage && (
          <span className="absolute top-3 left-3 rounded-full border border-black/10 bg-black/60 backdrop-blur px-2.5 py-0.5 text-xs font-semibold text-white">
            {product.stage}
          </span>
        )}
        {hasVideo && (
          <span className="absolute bottom-3 left-3 rounded-full border border-black/10 bg-black/75 backdrop-blur px-2.5 py-0.5 text-xs font-semibold text-white flex items-center gap-1">
            ▶ Video
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-6 sm:p-7 justify-between">
        <div>
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5">
            {product.enrollmentPaused ? (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                Paused
              </span>
            ) : (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                Open
              </span>
            )}
            {product.categories.slice(0, 2).map((category) => (
              <span
                key={category}
                className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-subtle)]"
              >
                {category}
              </span>
            ))}
            {authorName && (
              <span className="ml-auto text-xs text-[var(--text-subtle)] truncate max-w-[120px]">
                by {authorName}
              </span>
            )}
          </div>

          <h3 className="mt-3.5 font-display text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)] break-words">
            <Link
              to={`/products/${product.id}`}
              className="hover:text-[#d96b43] dark:hover:text-[#e07a5f] transition-colors"
            >
              {product.name}
            </Link>
          </h3>

          <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)] break-words line-clamp-2">
            {product.tagline}
          </p>

          {/* Highlighted Who it's for Audience Box */}
          <div className="mt-3 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-3.5 py-2">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#d96b43]">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Who it&apos;s for:</span>
            </div>
            <p className="mt-1 text-sm font-medium leading-relaxed text-[var(--text-main)] line-clamp-2">
              {product.audience}
            </p>
          </div>

          {/* Target Roles & Tech Tags */}
          {(product.targetRoles?.length > 0 || product.targetTechnologies?.length > 0) && (
            <div className="mt-2 flex flex-wrap items-center gap-1 text-xs sm:text-sm">
              {product.targetRoles?.slice(0, 1).map((role) => (
                <span
                  key={role}
                  className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-2.5 py-0.5 text-xs sm:text-sm font-medium text-[var(--text-muted)]"
                >
                  {role}
                </span>
              ))}
              {product.targetTechnologies?.slice(0, 1).map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-2.5 py-0.5 text-xs sm:text-sm font-medium text-[var(--text-subtle)]"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          {/* Match score bar (recommendation cards only) */}
          {matchInfo && (
            <div className="mt-3.5 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-3.5 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#b85028] dark:text-[#eb8b72]">
                  Profile match
                </p>
                <span className="text-xs sm:text-sm font-bold tabular-nums text-[var(--text-main)]">
                  {matchInfo.score}/{matchInfo.maxScore}
                </span>
              </div>
              <div className="mt-1.5 flex gap-1" aria-label={`Match strength: ${matchInfo.score} of ${matchInfo.maxScore} criteria`}>
                {Array.from({ length: matchInfo.maxScore }, (_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i < matchInfo.score
                        ? 'bg-[#d96b43] dark:bg-[#e07a5f]'
                        : 'bg-[var(--border-main)]'
                    }`}
                  />
                ))}
              </div>
              <ul className="mt-2 space-y-1 text-xs sm:text-sm font-medium text-[var(--text-main)]">
                {matchInfo.reasons.slice(0, 2).map((reason) => (
                  <li key={reason} className="flex items-start gap-1.5">
                    <svg className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="truncate">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-[var(--border-main)]">
          <Link
            to={`/products/${product.id}`}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#141b16] px-5 py-2.5 text-sm font-semibold text-[#f4ede2] shadow-warm-xs transition hover:bg-[#202c24] dark:bg-[#f3f4f0] dark:text-[#0b100c] dark:hover:bg-[#ffffff]"
          >
            <span>View prototype</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </motion.article>
  )
}

/* ------------------------------------------------------------------ */
/*  ExplorePage                                                        */
/* ------------------------------------------------------------------ */
export default function ExplorePage() {
  useDocumentTitle('Explore Early Products | BuildBoard')
  const { products, getProfile } = useDemoData()
  const { user } = useAuth()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchInputRef = useRef(null)

  // Sync state with URL query params
  const search = searchParams.get('q') || ''
  const activeCategory = searchParams.get('cat') || 'All products'
  const sortBy = searchParams.get('sort') || 'newest'

  const setSearch = useCallback(
    (value) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set('q', value)
        else next.delete('q')
        return next
      }, { replace: true })
    },
    [setSearchParams],
  )

  const setActiveCategory = useCallback(
    (cat) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (cat && cat !== 'All products') next.set('cat', cat)
        else next.delete('cat')
        return next
      }, { replace: true })
    },
    [setSearchParams],
  )

  const setSortBy = useCallback(
    (value) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (value && value !== 'newest') next.set('sort', value)
        else next.delete('sort')
        return next
      }, { replace: true })
    },
    [setSearchParams],
  )

  // View mode toggle ('grid' | 'list')
  const [viewMode, setViewMode] = useState('grid')

  // Keyboard shortcut: press "/" to focus search
  const [searchFocused, setSearchFocused] = useState(false)

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = document.activeElement?.tagName?.toLowerCase()
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return
        if (document.activeElement?.isContentEditable) return
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Derive hint visibility from current state (no effect needed)
  const showSlashHint = !search && !searchFocused

  // Retrieve current user's saved profile if signed in
  const userProfile = useMemo(() => {
    return user ? getProfile(user.email) : null
  }, [user, getProfile])

  const hasProfileDetails = useMemo(() => {
    if (!userProfile) return false
    const hasCategoryOrTech =
      (userProfile.interests && userProfile.interests.length > 0) ||
      (userProfile.roles && userProfile.roles.length > 0) ||
      (userProfile.industries && userProfile.industries.length > 0) ||
      (userProfile.technologies && userProfile.technologies.length > 0)
    const hasExplicitExperienceMatchable =
      Boolean(userProfile.experienceLevel) &&
      products.some((p) => p && (p.targetExperience || p.targetExperienceLevels))
    return hasCategoryOrTech || hasExplicitExperienceMatchable
  }, [userProfile, products])

  // Deterministic profile-based recommendations (transparent, no AI inference)
  const recommendedMatches = useMemo(() => {
    if (!user || !hasProfileDetails) return []
    return getRecommendedProducts(products, userProfile)
  }, [user, hasProfileDetails, userProfile, products])

  // Max possible score for the score bar denominator
  const maxMatchScore = useMemo(() => {
    if (recommendedMatches.length === 0) return 1
    // Count total matchable dimensions the user has filled in
    let dims = 0
    if (userProfile?.interests?.length) dims++
    if (userProfile?.roles?.length) dims++
    if (userProfile?.industries?.length) dims++
    if (userProfile?.technologies?.length) dims++
    if (userProfile?.experienceLevel) dims++
    return Math.max(dims, Math.max(...recommendedMatches.map((m) => m.score), 1))
  }, [recommendedMatches, userProfile])

  // Categories with counts
  const categoriesWithCounts = useMemo(() => {
    const countMap = {}
    for (const product of products) {
      for (const cat of product.categories) {
        countMap[cat] = (countMap[cat] || 0) + 1
      }
    }
    const cats = [
      { name: 'All products', count: products.length },
      ...Object.keys(countMap)
        .sort()
        .map((name) => ({ name, count: countMap[name] })),
    ]
    return cats
  }, [products])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()

    const list = products.filter((product) => {
      const matchesCategory =
        activeCategory === 'All products' ||
        product.categories.includes(activeCategory)

      const searchableText = [
        product.name,
        product.tagline,
        product.description,
        product.audience,
        ...product.categories,
      ]
        .join(' ')
        .toLowerCase()

      return matchesCategory && searchableText.includes(query)
    })

    return list.sort((a, b) => {
      if (sortBy === 'newest') {
        const dateA = a.updatedAt || a.createdAt || 0
        const dateB = b.updatedAt || b.createdAt || 0
        return new Date(dateB) - new Date(dateA)
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }
      return 0
    })
  }, [products, search, activeCategory, sortBy])

  return (
    <MotionConfig reducedMotion="user">
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] transition-colors focus:outline-none"
      >
        <Navbar />

        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-14">
          {/* ── Editorial Hero Banner ── */}
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="pt-2 pb-10 border-b border-[var(--border-main)]"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight text-[var(--text-main)]">
                  Find something <br className="hidden sm:inline" />
                  <span className="italic font-normal text-[#d96b43] dark:text-[#e07a5f]">worth trying.</span>
                </h1>
              </div>
              <div className="max-w-xl lg:pb-1">
                <p className="text-base sm:text-lg lg:text-xl leading-relaxed text-[var(--text-muted)]">
                  Explore working software prototypes from independent makers, designers, and students. Try something useful today, then give the builder honest, actionable notes.
                </p>
                <div className="mt-5">
                  <Link
                    to="/products/new"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#d96b43] px-5 py-2.5 text-sm font-semibold text-white shadow-warm hover:bg-[#c45a32] transition-colors"
                  >
                    + Submit a Product
                  </Link>
                </div>
              </div>
            </div>
          </motion.section>

          {/* ── Recommendations Section / Fallback States ── */}
          {user && hasProfileDetails && recommendedMatches.length > 0 ? (
            <section aria-labelledby="recommended-heading" className="mt-16">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="flex flex-col justify-between gap-4 border-b border-[var(--border-main)] pb-6 sm:flex-row sm:items-end"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#d96b43] px-3.5 py-1 text-sm font-bold uppercase tracking-wider text-white shadow-warm-xs">
                      Curated For You
                    </span>
                  </div>
                  <h2
                    id="recommended-heading"
                    className="mt-3 font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-main)]"
                  >
                    Matched to your <span className="italic font-normal text-[#d96b43] dark:text-[#e07a5f]">profile</span>
                  </h2>
                  <p className="mt-2 text-base text-[var(--text-muted)]">
                    Prototypes explicitly seeking testers in your saved industries, roles, technologies, or product interests.
                  </p>
                </div>

                <Link
                  to="/profile/setup"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#b85028] dark:text-[#eb8b72] hover:underline underline-offset-4"
                >
                  <span>Edit preferences</span>
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </motion.div>

              <div className="mt-8 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
                {recommendedMatches.map(({ product, score, reasons }, index) => (
                  <ProductCard
                    key={`rec-${product.id}`}
                    product={product}
                    index={index}
                    matchInfo={{ score, maxScore: maxMatchScore, reasons }}
                  />
                ))}
              </div>
            </section>
          ) : !user ? (
            /* Fallback when signed out */
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="mt-10 border-y border-[var(--border-main)] py-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="max-w-xl">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#b85028] dark:text-[#eb8b72]">
                    Personalized Testing Matches
                  </span>
                  <h3 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-main)]">
                    Want prototypes matched to your background?
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-[var(--text-muted)]">
                    Sign in and fill in your preferred roles, industries, and technologies to see early products matched transparently to your interests.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/sign-in"
                    state={{ from: location }}
                    className="rounded-full bg-[#141b16] px-5 py-3 text-sm font-semibold text-[#f4ede2] shadow-warm-xs transition hover:bg-[#202c24] dark:bg-[#f3f4f0] dark:text-[#0b100c] dark:hover:bg-[#ffffff]"
                  >
                    Sign in for matches
                  </Link>
                  <Link
                    to="/sign-up"
                    className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-5 py-3 text-sm font-semibold text-[var(--text-main)] shadow-warm-xs transition hover:bg-[var(--bg-surface-subtle)]"
                  >
                    Create free account
                  </Link>
                </div>
              </div>
            </motion.section>
          ) : !hasProfileDetails ? (
            /* Fallback when signed in without profile */
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="mt-10 border-y border-[var(--border-main)] py-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="max-w-xl">
                  <span className="inline-block rounded-full border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-3 py-1 text-sm font-semibold text-[#b85028] dark:text-[#eb8b72]">
                    Profile Preferences
                  </span>
                  <h3 className="mt-2.5 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-main)]">
                    Tell us what kind of software you like to test
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-[var(--text-muted)]">
                    Set up your tester profile to receive deterministic product matches aligned with your favorite software tools, design stack, or engineering domains.
                  </p>
                </div>
                <Link
                  to="/profile/setup"
                  className="rounded-full bg-[#d96b43] px-6 py-3 text-sm font-semibold text-white shadow-warm-xs transition hover:bg-[#b85028] whitespace-nowrap"
                >
                  Set up your profile &rarr;
                </Link>
              </div>
            </motion.section>
          ) : (
            /* Fallback when signed in with profile, but no products currently match */
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="mt-10 border-y border-[var(--border-main)] py-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="max-w-xl">
                  <span className="text-sm font-bold uppercase tracking-wider text-[#b85028] dark:text-[#eb8b72]">
                    Match Overview
                  </span>
                  <h3 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-main)]">
                    No direct matches right now
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-[var(--text-muted)]">
                    None of the active listings specifically overlap with your saved preferences yet. All listings are available in the open directory below, or you can expand your profile criteria anytime.
                  </p>
                </div>
                <Link
                  to="/profile/setup"
                  className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-5 py-3 text-sm font-semibold text-[var(--text-main)] shadow-warm-xs transition hover:bg-[var(--bg-surface-subtle)] whitespace-nowrap"
                >
                  Update profile preferences &rarr;
                </Link>
              </div>
            </motion.section>
          )}

          {/* ── General Product Shelf ── */}
          <section className="mt-16" aria-labelledby="discover-heading">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-6 pb-6 border-b border-[var(--border-main)]"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <span className="text-sm font-bold uppercase tracking-wider text-[#b85028] dark:text-[#eb8b72]">
                    Directory
                  </span>
                  <h2
                    id="discover-heading"
                    className="mt-1 font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-main)]"
                  >
                    Discover <span className="italic font-normal text-[#d96b43] dark:text-[#e07a5f]">prototypes</span>
                  </h2>
                </div>

                {/* Search input with keyboard hint */}
                <div className="relative w-full md:max-w-md">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--text-subtle)]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder="Search prototypes, tech stacks, or audiences..."
                    className="w-full rounded-full border border-[var(--border-main)] bg-[var(--bg-page)] pl-11 pr-16 py-3 text-base text-[var(--text-main)] outline-none transition placeholder:text-[var(--text-subtle)] focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20 shadow-warm-xs"
                  />
                  {/* Keyboard hint or clear button */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    {search ? (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        aria-label="Clear search"
                        className="flex items-center text-base text-[var(--text-subtle)] hover:text-[var(--text-main)] cursor-pointer"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    ) : showSlashHint ? (
                      <kbd className="hidden sm:inline-flex items-center rounded-md border border-[var(--border-main)] bg-[var(--bg-page)] px-2 py-0.5 text-xs font-semibold text-[var(--text-subtle)]">
                        /
                      </kbd>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Category pills with counts + animated indicator */}
              <div className="flex flex-col justify-between gap-4 pt-4 border-t border-[var(--border-main)] sm:flex-row sm:items-center">
                <div
                  className="flex gap-2.5 overflow-x-auto pb-1 max-w-full"
                  aria-label="Filter products by category"
                >
                  {categoriesWithCounts.map(({ name: category, count }) => {
                    const isActive = activeCategory === category

                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setActiveCategory(category)}
                        aria-pressed={isActive}
                        className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition cursor-pointer ${
                          isActive
                            ? 'text-white'
                            : 'border border-[var(--border-main)] bg-[var(--bg-page)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)]'
                        }`}
                      >
                        {/* Sliding background indicator */}
                        {isActive && (
                          <motion.span
                            layoutId="explore-category-pill"
                            className="absolute inset-0 rounded-full bg-[#d96b43] shadow-warm-xs border border-[#b85028]"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span className="relative flex items-center gap-1.5">
                          {category}
                          <span
                            className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold tabular-nums ${
                              isActive
                                ? 'bg-white/25 text-white'
                                : 'bg-[var(--bg-surface-subtle)] text-[var(--text-subtle)]'
                            }`}
                          >
                            {count}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Controls: View mode + Sort selector */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {/* Grid / List view toggle */}
                  <div
                    className="flex items-center rounded-full border border-[var(--border-main)] bg-[var(--bg-page)] p-1 text-[var(--text-muted)]"
                    role="group"
                    aria-label="View layout"
                  >
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      aria-label="Grid layout"
                      aria-pressed={viewMode === 'grid'}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                        viewMode === 'grid'
                          ? 'bg-[#141b16] text-[#f4ede2] shadow-warm-xs dark:bg-[#f3f4f0] dark:text-[#0b100c]'
                          : 'hover:text-[var(--text-main)]'
                      }`}
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                      </svg>
                      <span>Grid</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      aria-label="List layout"
                      aria-pressed={viewMode === 'list'}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                        viewMode === 'list'
                          ? 'bg-[#141b16] text-[#f4ede2] shadow-warm-xs dark:bg-[#f3f4f0] dark:text-[#0b100c]'
                          : 'hover:text-[var(--text-main)]'
                      }`}
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="9" y1="6" x2="21" y2="6" />
                        <line x1="9" y1="12" x2="21" y2="12" />
                        <line x1="9" y1="18" x2="21" y2="18" />
                        <line x1="4" y1="6" x2="4.01" y2="6" strokeWidth="3" />
                        <line x1="4" y1="12" x2="4.01" y2="12" strokeWidth="3" />
                        <line x1="4" y1="18" x2="4.01" y2="18" strokeWidth="3" />
                      </svg>
                      <span>List</span>
                    </button>
                  </div>

                  {/* Sort selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--text-subtle)]">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="rounded-full border border-[var(--border-main)] bg-[var(--bg-page)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] outline-none cursor-pointer focus:border-[#d96b43]"
                    >
                      <option value="newest">Newest first</option>
                      <option value="name">Alphabetical</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {filteredProducts.length > 0 ? (
                <motion.div
                  key={`${viewMode}-${activeCategory}-${search}-${sortBy}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={
                    viewMode === 'list'
                      ? 'mt-8 flex flex-col gap-6'
                      : 'mt-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-3'
                  }
                >
                  {filteredProducts.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={index}
                      viewMode={viewMode}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="mt-10 rounded-3xl border border-dashed border-[var(--border-main)] bg-[var(--bg-surface)] px-8 py-16 text-center text-[var(--text-main)]"
                >
                  <h3 className="font-display text-2xl font-bold">No matching prototypes found</h3>
                  <p className="mt-2 text-base text-[var(--text-muted)]">
                    Try clearing your search query or selecting a different category.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('')
                      setActiveCategory('All products')
                    }}
                    className="mt-6 rounded-full bg-[#d96b43] px-6 py-3 text-sm font-semibold text-white shadow-warm-xs cursor-pointer hover:bg-[#b85028]"
                  >
                    Reset catalog filters
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