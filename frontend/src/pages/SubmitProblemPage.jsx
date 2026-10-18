import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router'
import { motion, MotionConfig } from 'motion/react'
import { useDemoData } from '../context/DemoDataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { PROBLEM_CATEGORIES } from '../data/problems.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function SubmitProblemPage() {
  useDocumentTitle('Share a Problem Hypothesis | BuildBoard')
  const { addProblem, getProfile } = useDemoData()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [title, setTitle] = useState('')
  const [statement, setStatement] = useState('')
  const [workarounds, setWorkarounds] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [proposedConcept, setProposedConcept] = useState('')
  const [category, setCategory] = useState('Developer Tools')
  const [errors, setErrors] = useState({})

  // Category list excluding 'All categories'
  const categories = PROBLEM_CATEGORIES.filter((c) => c !== 'All categories')

  const validate = () => {
    const errs = {}
    if (!title.trim() || title.trim().length < 10) {
      errs.title = 'Title must be at least 10 characters long describing the friction.'
    }
    if (!statement.trim() || statement.trim().length < 30) {
      errs.statement = 'Please provide at least 30 characters explaining the problem in detail.'
    }
    if (!targetAudience.trim()) {
      errs.targetAudience = 'Specify who experiences this friction (e.g. students, founders, designers).'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    const newProb = addProblem({
      title,
      statement,
      workarounds,
      targetAudience,
      proposedConcept,
      category,
      maker: (user?.email ? getProfile(user.email)?.displayName?.trim() : null) || (user?.email ? user.email.split('@')[0] : 'Independent Builder'),
      creatorEmail: user?.email || '',
    })

    navigate(`/problems/${newProb.id}`)
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] transition-colors">
        <Navbar />

        <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 lg:py-12">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <Link
              to="/problems"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-muted)] hover:text-[#d96b43] transition-colors"
            >
              <span aria-hidden="true">&larr;</span>
              Back to Problem Board
            </Link>
          </div>

          {/* Sign In Gate Notice if not signed in */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-3xl border border-[#d96b43]/30 bg-[#d96b43]/10 p-6 sm:p-7 text-[var(--text-main)] shadow-warm-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#b85028] dark:text-[#eb8b72]">
                    Sign in to publish your hypothesis
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    You can draft your problem statement right now, but sign in to collect community validations and tester interest.
                  </p>
                </div>
                <Link
                  to="/sign-in"
                  state={{ from: location }}
                  className="rounded-full bg-[#d96b43] px-5 py-2.5 text-sm font-semibold text-white shadow-warm-xs hover:bg-[#b85028] whitespace-nowrap text-center"
                >
                  Sign in &rarr;
                </Link>
              </div>
            </motion.div>
          )}

          {/* Header */}
          <header className="border-b border-[var(--border-main)] pb-8 pt-2">
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-main)]">
              Share a problem worth solving
            </h1>
            <p className="mt-2 text-base leading-relaxed text-[var(--text-muted)]">
              Before writing code or architecting a database, describe the real friction you or your target users experience. Gather signals from people who suffer from it too.
            </p>
          </header>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-8 divide-y divide-[var(--border-main)]" noValidate>
            
            {/* 1. Problem Title */}
            <div className="pt-8 first:pt-0 space-y-3">
              <label htmlFor="problem-title" className="block text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">
                Problem Title / Core Friction <span className="text-[#d96b43]">*</span>
              </label>
              <p className="text-xs text-[var(--text-muted)]">
                Summarize the pain in one crisp sentence (e.g. &ldquo;Figma variable modes break when exported to Tailwind themes&rdquo;).
              </p>
              <input
                id="problem-title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }))
                }}
                placeholder="e.g. Debugging service-worker terminations in Manifest V3 is nearly impossible"
                className={`w-full rounded-xl border bg-[var(--bg-surface)] p-3.5 text-base text-[var(--text-main)] placeholder:text-[var(--text-subtle)] outline-none transition focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20 ${
                  errors.title ? 'border-rose-500 bg-rose-50/10' : 'border-[var(--border-main)]'
                }`}
              />
              {errors.title && <p className="text-xs font-semibold text-rose-500">{errors.title}</p>}
            </div>

            {/* 2. Category */}
            <div className="pt-8 space-y-3">
              <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">
                Category <span className="text-[#d96b43]">*</span>
              </label>
              <p className="text-xs text-[var(--text-muted)]">
                Select the domain this problem belongs to.
              </p>
              <div className="flex flex-wrap gap-2.5 pt-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition cursor-pointer select-none ${
                      category === cat
                        ? 'bg-[#141b16] text-[#f4ede2] shadow-warm-xs dark:bg-[#f3f4f0] dark:text-[#0b100c]'
                        : 'border border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. The Detailed Problem Statement */}
            <div className="pt-8 space-y-3">
              <label htmlFor="problem-statement" className="block text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">
                What is frustrating, and when does it happen? <span className="text-[#d96b43]">*</span>
              </label>
              <p className="text-xs text-[var(--text-muted)]">
                Walk through the painful moment. What workflow triggers it? Why does it waste time, cause errors, or break focus?
              </p>
              <textarea
                id="problem-statement"
                rows={5}
                value={statement}
                onChange={(e) => {
                  setStatement(e.target.value)
                  if (errors.statement) setErrors((prev) => ({ ...prev, statement: undefined }))
                }}
                placeholder="Describe the steps leading up to the friction and the negative consequences..."
                className={`w-full rounded-xl border bg-[var(--bg-surface)] p-3.5 text-base leading-relaxed text-[var(--text-main)] placeholder:text-[var(--text-subtle)] outline-none transition focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20 ${
                  errors.statement ? 'border-rose-500 bg-rose-50/10' : 'border-[var(--border-main)]'
                }`}
              />
              {errors.statement && <p className="text-xs font-semibold text-rose-500">{errors.statement}</p>}
            </div>

            {/* 4. Current Workarounds */}
            <div className="pt-8 space-y-3">
              <label htmlFor="problem-workarounds" className="block text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">
                How do people hack around this today?
              </label>
              <p className="text-xs text-[var(--text-muted)]">
                Are people using spreadsheets, clunky scripts, manual copy-pasting, or multiple disconnected apps?
              </p>
              <textarea
                id="problem-workarounds"
                rows={3}
                value={workarounds}
                onChange={(e) => setWorkarounds(e.target.value)}
                placeholder="e.g. Pasting code into ChatGPT, keeping dummy ports open, manual spreadsheets..."
                className="w-full rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-3.5 text-base leading-relaxed text-[var(--text-main)] placeholder:text-[var(--text-subtle)] outline-none transition focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20"
              />
            </div>

            {/* 5. Target Audience */}
            <div className="pt-8 space-y-3">
              <label htmlFor="problem-audience" className="block text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">
                Who suffers from this problem? <span className="text-[#d96b43]">*</span>
              </label>
              <p className="text-xs text-[var(--text-muted)]">
                Define the roles or groups that encounter this (e.g. &ldquo;Solo founders doing user interviews&rdquo;).
              </p>
              <input
                id="problem-audience"
                type="text"
                value={targetAudience}
                onChange={(e) => {
                  setTargetAudience(e.target.value)
                  if (errors.targetAudience) setErrors((prev) => ({ ...prev, targetAudience: undefined }))
                }}
                placeholder="e.g. Frontend developers, design system leads, college CS students"
                className={`w-full rounded-xl border bg-[var(--bg-surface)] p-3.5 text-base text-[var(--text-main)] placeholder:text-[var(--text-subtle)] outline-none transition focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20 ${
                  errors.targetAudience ? 'border-rose-500 bg-rose-50/10' : 'border-[var(--border-main)]'
                }`}
              />
              {errors.targetAudience && <p className="text-xs font-semibold text-rose-500">{errors.targetAudience}</p>}
            </div>

            {/* 6. Proposed Solution Concept */}
            <div className="pt-8 space-y-3">
              <label htmlFor="problem-concept" className="block text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">
                What are you thinking of building to solve it? <span className="font-normal text-[var(--text-subtle)]">(Optional)</span>
              </label>
              <p className="text-xs text-[var(--text-muted)]">
                Share your early concept or hypothesis to gauge if the community thinks it&apos;s the right approach.
              </p>
              <textarea
                id="problem-concept"
                rows={4}
                value={proposedConcept}
                onChange={(e) => setProposedConcept(e.target.value)}
                placeholder="e.g. A CLI that translates Figma tokens into Tailwind v4 configs without breaking modes..."
                className="w-full rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-3.5 text-base leading-relaxed text-[var(--text-main)] placeholder:text-[var(--text-subtle)] outline-none transition focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-8">
              <button
                type="submit"
                className="w-full rounded-full bg-[#d96b43] px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-warm-md transition hover:bg-[#b85028] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer min-h-[48px]"
              >
                Publish Problem Hypothesis
              </button>
            </div>
          </form>

          <Footer />
        </div>
      </main>
    </MotionConfig>
  )
}
