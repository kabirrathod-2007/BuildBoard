import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { fetchPublicProfile } from '../lib/api.js'

export default function PublicProfilePage() {
  const { username } = useParams()
  const cleanUsername = (username || '').replace(/^@/, '').trim()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [profileData, setProfileData] = useState(null)
  const [activeTab, setActiveTab] = useState('prototypes') // 'prototypes' | 'recognitions' | 'problems' | 'skills'

  useEffect(() => {
    let active = true

    async function load() {
      if (!cleanUsername) return
      setLoading(true)
      setError(null)
      try {
        const data = await fetchPublicProfile(cleanUsername)
        if (active) {
          setProfileData(data)
          // Default tab logic based on what this user has more of
          if (data.products?.length > 0) {
            setActiveTab('prototypes')
          } else if (data.recentRecognitions?.length > 0) {
            setActiveTab('recognitions')
          } else if (data.problems?.length > 0) {
            setActiveTab('problems')
          } else {
            setActiveTab('skills')
          }
        }
      } catch (err) {
        if (active) {
          setError(err.status === 404 ? 'Profile not found' : err.message || 'Failed to load profile')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [cleanUsername])

  if (loading) {
    return (
      <main className="min-h-[70vh] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl animate-pulse space-y-8">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 rounded-3xl bg-[var(--bg-surface-subtle)]" />
            <div className="space-y-3">
              <div className="h-7 w-48 rounded-lg bg-[var(--bg-surface-subtle)]" />
              <div className="h-4 w-32 rounded-lg bg-[var(--bg-surface-subtle)]" />
            </div>
          </div>
          <div className="h-40 rounded-3xl bg-[var(--bg-surface-subtle)]" />
        </div>
      </main>
    )
  }

  if (error || !profileData) {
    return (
      <main className="min-h-[70vh] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-8 text-center shadow-warm-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-main)]">
            User Not Found
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            We couldn&apos;t find a public maker or tester profile for <span className="font-mono font-semibold text-[var(--text-main)]">@{cleanUsername}</span>.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/explore"
              className="rounded-xl bg-[#1f3a6b] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#182f56] dark:bg-[#dbbf95] dark:text-[#15203a] dark:hover:bg-[#ecdcc2]"
            >
              Explore Prototypes
            </Link>
            <Link
              to="/problems"
              className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] px-5 py-2.5 text-xs font-semibold text-[var(--text-main)] shadow-xs transition hover:border-[#1f3a6b]"
            >
              Browse Problems
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const { user, stats = {}, products = [], problems = [], recentRecognitions = [] } = profileData
  const roles = Array.isArray(user.roles) ? user.roles : []
  const platforms = Array.isArray(user.testingDevices) ? user.testingDevices : (Array.isArray(user.platforms) ? user.platforms : [])
  const technologies = Array.isArray(user.technologies) ? user.technologies : []
  const socialLinks = {
    website: user.website || user.socialLinks?.website || '',
    github: user.github || user.socialLinks?.github || '',
    twitter: user.twitter || user.socialLinks?.twitter || '',
    linkedin: user.linkedin || user.socialLinks?.linkedin || '',
  }

  const productsCount = stats.productsLaunchedCount ?? stats.productsCount ?? products.length
  const problemsCount = stats.problemsPostedCount ?? stats.problemsCount ?? problems.length
  const recognitionPoints = stats.recognitionPoints ?? 0
  const feedbackCount = stats.feedbackCount ?? 0

  const initials = (user.displayName || user.username || 'U')
    .slice(0, 2)
    .toUpperCase()

  const formattedDate = user.memberSince || user.joinedAt
    ? new Date(user.memberSince || user.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Member'

  return (
    <main className="min-h-screen bg-[var(--bg-main)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-2 text-xs font-medium text-[var(--text-subtle)]" aria-label="Breadcrumb">
          <Link to="/explore" className="hover:text-[var(--text-main)] transition-colors">Explore</Link>
          <span>/</span>
          <span className="text-[var(--text-main)]">@{user.username}</span>
        </nav>

        {/* ── Hero Profile Card ── */}
        <section className="relative overflow-hidden rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-warm-md">
          {/* Subtle gradient flair in background */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#1f3a6b]/5 blur-3xl dark:bg-[#dbbf95]/10" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              {/* Avatar */}
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-[#1f3a6b] to-[#2c5282] font-display text-2xl font-bold text-white shadow-warm-md dark:from-[#b88e5d] dark:to-[#dbbf95] dark:text-[#15203a]">
                {initials}
                {stats.recognitionPoints > 0 && (
                  <span
                    title={`${stats.recognitionPoints} Recognition Points earned`}
                    className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--bg-surface)] bg-amber-500 text-xs font-bold text-white shadow-xs"
                  >
                    ★
                  </span>
                )}
              </div>

              {/* Title & Metadata */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
                    {user.displayName || user.username}
                  </h1>
                  <span className="font-mono text-sm font-semibold text-[var(--text-subtle)]">
                    @{user.username}
                  </span>
                </div>

                {/* Roles Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {roles.map((role) => (
                    <span
                      key={role}
                      className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-muted)]"
                    >
                      {role}
                    </span>
                  ))}
                  {user.experienceLevel && (
                    <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                      {user.experienceLevel}
                    </span>
                  )}
                  <span className="text-xs text-[var(--text-subtle)] ml-1">
                    Joined {formattedDate}
                  </span>
                </div>

                {/* Bio */}
                {user.bio ? (
                  <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-muted)] pt-1">
                    {user.bio}
                  </p>
                ) : (
                  <p className="text-xs text-[var(--text-subtle)] italic pt-1">
                    No bio provided yet.
                  </p>
                )}

                {/* Social Links */}
                {(socialLinks.github || socialLinks.twitter || socialLinks.website || socialLinks.linkedin) && (
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-[var(--text-muted)]">
                    {socialLinks.website && (
                      <a
                        href={socialLinks.website.startsWith('http') ? socialLinks.website : `https://${socialLinks.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-[#1f3a6b] dark:hover:text-[#dbbf95] transition-colors"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                        </svg>
                        <span>Website</span>
                      </a>
                    )}
                    {socialLinks.github && (
                      <a
                        href={socialLinks.github.startsWith('http') ? socialLinks.github : `https://github.com/${socialLinks.github.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-[#1f3a6b] dark:hover:text-[#dbbf95] transition-colors"
                      >
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                        </svg>
                        <span>GitHub</span>
                      </a>
                    )}
                    {socialLinks.twitter && (
                      <a
                        href={socialLinks.twitter.startsWith('http') ? socialLinks.twitter : `https://x.com/${socialLinks.twitter.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-[#1f3a6b] dark:hover:text-[#dbbf95] transition-colors"
                      >
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        <span>X (Twitter)</span>
                      </a>
                    )}
                    {socialLinks.linkedin && (
                      <a
                        href={socialLinks.linkedin.startsWith('http') ? socialLinks.linkedin : `https://linkedin.com/in/${socialLinks.linkedin.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-[#1f3a6b] dark:hover:text-[#dbbf95] transition-colors"
                      >
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                        <span>LinkedIn</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Metrics Badge Strip */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 sm:w-auto w-full pt-2 sm:pt-0">
              <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] p-3 text-center">
                <span className="block font-display text-xl font-bold text-[#1f3a6b] dark:text-[#dbbf95]">
                  {productsCount}
                </span>
                <span className="text-[11px] font-semibold text-[var(--text-subtle)] uppercase tracking-wider">
                  Prototypes
                </span>
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
                <span className="block font-display text-xl font-bold text-amber-600 dark:text-amber-400">
                  {recognitionPoints}
                </span>
                <span className="text-[11px] font-semibold text-amber-700/80 dark:text-amber-300/80 uppercase tracking-wider">
                  Points
                </span>
              </div>
              <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] p-3 text-center">
                <span className="block font-display text-xl font-bold text-[var(--text-main)]">
                  {feedbackCount}
                </span>
                <span className="text-[11px] font-semibold text-[var(--text-subtle)] uppercase tracking-wider">
                  Critiques
                </span>
              </div>
              <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] p-3 text-center">
                <span className="block font-display text-xl font-bold text-[var(--text-main)]">
                  {problemsCount}
                </span>
                <span className="text-[11px] font-semibold text-[var(--text-subtle)] uppercase tracking-wider">
                  Problems
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Navigation Tabs ── */}
        <div className="flex border-b border-[var(--border-main)]">
          <button
            type="button"
            onClick={() => setActiveTab('prototypes')}
            className={`border-b-2 px-5 py-3 text-sm font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'prototypes'
                ? 'border-[#1f3a6b] text-[#1f3a6b] dark:border-[#dbbf95] dark:text-[#dbbf95]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <span>Prototypes</span>
            <span className="rounded-full bg-[var(--bg-surface-subtle)] px-2 py-0.5 text-xs text-[var(--text-subtle)] font-mono">
              {productsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recognitions')}
            className={`border-b-2 px-5 py-3 text-sm font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'recognitions'
                ? 'border-[#1f3a6b] text-[#1f3a6b] dark:border-[#dbbf95] dark:text-[#dbbf95]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <span>Recognitions</span>
            <span className="rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-xs font-mono">
              {recognitionPoints}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('problems')}
            className={`border-b-2 px-5 py-3 text-sm font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'problems'
                ? 'border-[#1f3a6b] text-[#1f3a6b] dark:border-[#dbbf95] dark:text-[#dbbf95]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <span>Problems</span>
            <span className="rounded-full bg-[var(--bg-surface-subtle)] px-2 py-0.5 text-xs text-[var(--text-subtle)] font-mono">
              {problemsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('skills')}
            className={`border-b-2 px-5 py-3 text-sm font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'skills'
                ? 'border-[#1f3a6b] text-[#1f3a6b] dark:border-[#dbbf95] dark:text-[#dbbf95]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <span>Testing Setup</span>
          </button>
        </div>

        {/* ── Tab Content ── */}

        {/* TAB 1: Prototypes */}
        {activeTab === 'prototypes' && (
          <section className="space-y-6">
            {products.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[var(--border-main)] p-12 text-center text-sm text-[var(--text-subtle)]">
                This maker hasn&apos;t launched any public prototypes on BuildBoard yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((prod) => (
                  <Link
                    key={prod.id}
                    to={`/products/${prod.slug || prod.id}`}
                    className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-5 shadow-warm-xs transition hover:border-[#1f3a6b] hover:shadow-warm-md dark:hover:border-[#dbbf95]"
                  >
                    <div>
                      {prod.imageUrl && (
                        <div className="relative mb-4 h-36 w-full overflow-hidden rounded-2xl bg-[var(--bg-surface-subtle)]">
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--text-muted)]">
                          {prod.stage}
                        </span>
                        {prod.enrollmentPaused && (
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                            Paused
                          </span>
                        )}
                      </div>
                      <h2 className="mt-2.5 font-display text-lg font-bold text-[var(--text-main)] group-hover:text-[#1f3a6b] dark:group-hover:text-[#dbbf95] transition-colors">
                        {prod.name}
                      </h2>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--text-muted)]">
                        {prod.tagline}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-[var(--border-main)] pt-3 text-xs text-[var(--text-subtle)]">
                      <span>{prod.enrollmentCount} {prod.enrollmentCount === 1 ? 'tester' : 'testers'}</span>
                      <span>{prod.feedbackCount} {prod.feedbackCount === 1 ? 'critique' : 'critiques'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: Recognitions */}
        {activeTab === 'recognitions' && (
          <section className="space-y-6">
            {recentRecognitions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[var(--border-main)] p-12 text-center text-sm text-[var(--text-subtle)]">
                No recognized critique badges yet. Once builders mark this tester&apos;s feedback as helpful, their achievements will appear here!
              </div>
            ) : (
              <div className="space-y-4">
                {recentRecognitions.map((item) => {
                  let replyObj = null
                  if (item.builderReply) {
                    try {
                      replyObj = typeof item.builderReply === 'object' ? item.builderReply : JSON.parse(item.builderReply)
                    } catch {
                      replyObj = null
                    }
                  }

                  return (
                    <article
                      key={item.id}
                      className="rounded-3xl border border-amber-500/30 bg-amber-500/[0.04] p-6 shadow-warm-xs space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                            ★
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                            Recognized Critique (+1 Point)
                          </span>
                        </div>
                        <Link
                          to={`/products/${item.product.slug || item.product.id}`}
                          className="text-xs font-semibold text-[#1f3a6b] dark:text-[#dbbf95] hover:underline"
                        >
                          on {item.product.name} →
                        </Link>
                      </div>

                      <div className="space-y-1">
                        <span className="inline-block rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--text-muted)]">
                          {item.category}
                        </span>
                        <p className="text-sm leading-relaxed text-[var(--text-main)] italic pt-1">
                          &ldquo;{item.experience}&rdquo;
                        </p>
                      </div>

                      {replyObj?.text && (
                        <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-4 text-xs">
                          <span className="font-semibold text-[#1f3a6b] dark:text-[#dbbf95]">
                            {replyObj.repliedBy || 'Maker'} replied:
                          </span>
                          <p className="mt-1 text-[var(--text-muted)] leading-relaxed">
                            {replyObj.text}
                          </p>
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: Problem Hypotheses */}
        {activeTab === 'problems' && (
          <section className="space-y-6">
            {problems.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[var(--border-main)] p-12 text-center text-sm text-[var(--text-subtle)]">
                This member hasn&apos;t published any problem hypotheses yet.
              </div>
            ) : (
              <div className="space-y-4">
                {problems.map((pr) => (
                  <Link
                    key={pr.id}
                    to={`/problems/${pr.slug || pr.id}`}
                    className="group block rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 shadow-warm-xs transition hover:border-[#1f3a6b] hover:shadow-warm-md dark:hover:border-[#dbbf95]"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
                        {pr.category}
                      </span>
                      <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                        {pr.stage}
                      </span>
                    </div>

                    <h2 className="mt-3 font-display text-lg font-bold text-[var(--text-main)] group-hover:text-[#1f3a6b] dark:group-hover:text-[#dbbf95] transition-colors">
                      {pr.title}
                    </h2>

                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--text-muted)]">
                      {pr.statement}
                    </p>

                    <div className="mt-4 flex items-center gap-5 text-xs font-semibold text-[var(--text-subtle)]">
                      <span className="flex items-center gap-1.5">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        {pr.validationCount} validations
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v4.518z" />
                        </svg>
                        {pr.commentCount} comments
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 4: Testing Setup */}
        {activeTab === 'skills' && (
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 shadow-warm-xs space-y-4">
              <h2 className="font-display text-base font-bold text-[var(--text-main)]">
                Testing Devices & Platforms
              </h2>
              {platforms.length === 0 ? (
                <p className="text-xs text-[var(--text-subtle)] italic">
                  No specific platforms listed.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {platforms.map((plat) => (
                    <span
                      key={plat}
                      className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-main)]"
                    >
                      {plat}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 shadow-warm-xs space-y-4">
              <h2 className="font-display text-base font-bold text-[var(--text-main)]">
                Technologies & Tools Stack
              </h2>
              {technologies.length === 0 ? (
                <p className="text-xs text-[var(--text-subtle)] italic">
                  No specific technologies listed.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {technologies.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

      </div>
    </main>
  )
}
