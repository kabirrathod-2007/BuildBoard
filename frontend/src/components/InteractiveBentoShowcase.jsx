import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

/**
 * InteractiveTestingShowcase
 * 
 * A clean, minimal interactive workbench explaining BuildBoard's testing infrastructure:
 * 1. Skill Matching: How the compatibility score is calculated (e.g. 3 of 3 matched = 100%)
 * 2. Structured Critique: Actionable bug/usability categories instead of superficial hype
 * 3. Recognition Points: How testers earn public points (+1 pt) when makers mark feedback helpful
 */
export default function InteractiveBentoShowcase() {
  const [activeStep, setActiveStep] = useState(0)

  // ── Step 1: Skill Matching State ──
  const requiredCriteria = [
    { id: 'react', label: 'React 19' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'devtools', label: 'DevTools & CLI' },
  ]
  const [testerSkills, setTesterSkills] = useState(['react', 'typescript', 'devtools'])

  const toggleSkill = (id) => {
    setTesterSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const matchedCount = requiredCriteria.filter((c) => testerSkills.includes(c.id)).length
  const matchPercentage = Math.round((matchedCount / requiredCriteria.length) * 100)

  // ── Step 2: Structured Notes State ──
  const [activeCategory, setActiveCategory] = useState('bug')
  const critiqueSnippets = {
    bug: {
      type: 'Bug Report',
      title: 'Search shortcut fails on Firefox',
      quote: 'Pressing ⌘K inside sprint backlog fails to focus search on Firefox 128.',
      severity: 'High friction',
      color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
    usability: {
      type: 'Usability Issue',
      title: 'Filter menu dismissal',
      quote: 'Filter dropdown requires clicking completely outside the modal to close.',
      severity: 'UX friction',
      color: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/20',
    },
    idea: {
      type: 'Feature Idea',
      title: 'Prototype quick-switcher',
      quote: 'Add an ⌥+Tab hotkey to jump between active prototypes while testing.',
      severity: 'Enhancement',
      color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
    },
  }
  const currentSnippet = critiqueSnippets[activeCategory]

  // ── Step 3: Points & Karma State ──
  const [awarded, setAwarded] = useState(false)
  const testerPoints = awarded ? 49 : 48

  const steps = [
    {
      id: 0,
      title: '1. Skill-Matched Testers',
      summary: 'Matches testers based on exact prototype requirements.',
    },
    {
      id: 1,
      title: '2. Structured Feedback',
      summary: 'Critiques organized by bugs, UX friction, and ideas.',
    },
    {
      id: 2,
      title: '3. Recognition Points',
      summary: 'Makers award +1 point for helpful feedback to build reputation.',
    },
  ]

  return (
    <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] overflow-hidden shadow-warm-xs">
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-main)]">
        
        {/* ── Left Column: Clean Step Selectors ── */}
        <div className="lg:col-span-4 p-5 sm:p-6 flex flex-col justify-between bg-[var(--bg-surface)]">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[var(--text-subtle)] uppercase tracking-wider mb-3">
              How the Feedback Loop Works
            </p>

            {steps.map((step) => {
              const isActive = activeStep === step.id
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={`w-full text-left p-3.5 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[var(--bg-surface-subtle)] border border-[var(--border-main)] shadow-xs'
                      : 'hover:bg-[var(--bg-surface-subtle)]/60 text-[var(--text-muted)]'
                  }`}
                >
                  <p className={`font-display text-sm font-bold ${isActive ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                    {step.title}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-subtle)] leading-relaxed">
                    {step.summary}
                  </p>
                </button>
              )
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--border-main)] text-xs text-[var(--text-subtle)]">
            Click any step to preview how it works in real time.
          </div>
        </div>

        {/* ── Right Column: Interactive Demonstration Canvas ── */}
        <div className="lg:col-span-8 p-6 sm:p-8 bg-[var(--bg-surface-subtle)] flex flex-col justify-between min-h-[380px]">
          <AnimatePresence mode="wait">
            {activeStep === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[var(--text-main)]">
                    How Match Scores Are Calculated
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                    Builders set required skills. A tester&apos;s score is simply the number of matching criteria — no mysterious algorithms.
                  </p>
                </div>

                {/* Interactive Skill Toggles */}
                <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-[var(--text-subtle)]">
                    <span className="font-semibold text-[var(--text-main)]">Prototype Requirements:</span>
                    <span>Click skills to toggle match</span>
                  </div>

                  <div className="flex flex-wrap gap-2" role="group" aria-label="Toggle skills">
                    {requiredCriteria.map((criterion) => {
                      const isMatched = testerSkills.includes(criterion.id)
                      return (
                        <button
                          key={criterion.id}
                          type="button"
                          onClick={() => toggleSkill(criterion.id)}
                          aria-pressed={isMatched}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer active:scale-95 border ${
                            isMatched
                              ? 'bg-[#d96b43] text-white border-[#b85028] shadow-xs'
                              : 'border-[var(--border-main)] bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] hover:border-[#d96b43]'
                          }`}
                        >
                          <span>{isMatched ? '✓ ' : '+ '}</span>
                          <span>{criterion.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Score Calculation Display */}
                <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[var(--text-subtle)]">Compatibility Score</p>
                      <p className="font-display text-2xl font-bold text-[var(--text-main)]">
                        {matchedCount} of {requiredCriteria.length} Matched ({matchPercentage}%)
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                        matchPercentage === 100
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                          : matchPercentage > 0
                          ? 'bg-[#d96b43]/10 text-[#d96b43] border border-[#d96b43]/20'
                          : 'bg-zinc-500/10 text-[var(--text-muted)]'
                      }`}
                    >
                      {matchPercentage === 100 ? 'Perfect Match' : matchPercentage >= 50 ? 'Partial Match' : 'Unmatched'}
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-[var(--border-main)] overflow-hidden" aria-hidden="true">
                    <motion.div
                      className={`h-full rounded-full transition-colors ${
                        matchPercentage === 100 ? 'bg-emerald-600' : 'bg-[#d96b43]'
                      }`}
                      initial={false}
                      animate={{ width: `${matchPercentage}%` }}
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    />
                  </div>

                  <p className="text-xs text-[var(--text-subtle)]">
                    Calculation: +1 point per matching skill. Testers with 100% matches see this prototype at the top of their discovery feed.
                  </p>
                </div>
              </motion.div>
            )}

            {activeStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[var(--text-main)]">
                    Structured, High-Signal Feedback
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                    Instead of generic &ldquo;Looks cool!&rdquo; comments, critiques are categorized into actionable reports.
                  </p>
                </div>

                {/* Category Switcher */}
                <div className="flex gap-2">
                  {[
                    { id: 'bug', label: 'Bug Report' },
                    { id: 'usability', label: 'Usability' },
                    { id: 'idea', label: 'Feature Idea' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveCategory(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                        activeCategory === tab.id
                          ? 'bg-[var(--bg-surface)] text-[var(--text-main)] border-[var(--border-main)] shadow-xs'
                          : 'bg-transparent text-[var(--text-muted)] border-transparent hover:bg-[var(--bg-surface)]/60'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Critique Card */}
                <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${currentSnippet.color}`}>
                      {currentSnippet.type}
                    </span>
                    <span className="text-xs text-[var(--text-subtle)]">{currentSnippet.severity}</span>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-[var(--text-main)]">{currentSnippet.title}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)] italic leading-relaxed">
                      &ldquo;{currentSnippet.quote}&rdquo;
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[var(--border-main)] flex items-center justify-between text-xs text-[var(--text-subtle)]">
                    <span>Submitted by <strong>Elena Rostova</strong> (Frontend Tester)</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">✓ Tested via Gated Access</span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[var(--text-main)]">
                    How Tester Points Work
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                    When a builder receives actionable critique, they mark it as Helpful. This gives the tester public points that prove their credibility.
                  </p>
                </div>

                {/* Maker Action Card */}
                <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d96b43]/20 text-xs font-bold text-[#d96b43]">
                      YG
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--text-main)]">Yash Garg</span>
                        <span className="text-[10px] text-[#d96b43] font-semibold bg-[#d96b43]/10 px-1.5 py-0.2 rounded">
                          Product Maker
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-muted)] leading-relaxed">
                        &ldquo;Fixed the Firefox shortcut issue in v0.42! Thanks for the catch, Elena.&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--border-main)] flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[var(--text-subtle)]">Elena&apos;s Reputation</p>
                      <p className="font-display text-xl font-bold text-[var(--text-main)]">
                        {testerPoints} Points
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAwarded((prev) => !prev)}
                      aria-pressed={awarded}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer active:scale-95 border ${
                        awarded
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-main)] hover:border-[#d96b43] hover:text-[#d96b43]'
                      }`}
                    >
                      {awarded ? '✓ Marked Helpful (+1)' : '★ Mark as Helpful (+1)'}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-subtle)]">
                  Testers with higher points earn priority access to early-stage prototypes and exclusive testing invitations from builders.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stepper Navigation */}
          <div className="pt-4 border-t border-[var(--border-main)] flex items-center justify-between">
            <button
              type="button"
              disabled={activeStep === 0}
              onClick={() => setActiveStep((prev) => Math.max(prev - 1, 0))}
              className={`text-xs font-semibold transition cursor-pointer ${
                activeStep === 0 ? 'text-[var(--text-subtle)] opacity-40 cursor-not-allowed' : 'text-[var(--text-main)] hover:text-[#d96b43]'
              }`}
            >
              ← Previous
            </button>

            <span className="text-xs text-[var(--text-subtle)] font-medium">
              Step {activeStep + 1} of {steps.length}
            </span>

            <button
              type="button"
              disabled={activeStep === steps.length - 1}
              onClick={() => setActiveStep((prev) => Math.min(prev + 1, steps.length - 1))}
              className={`text-xs font-semibold transition cursor-pointer ${
                activeStep === steps.length - 1 ? 'text-[var(--text-subtle)] opacity-40 cursor-not-allowed' : 'text-[#d96b43] hover:underline'
              }`}
            >
              Next Step →
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
