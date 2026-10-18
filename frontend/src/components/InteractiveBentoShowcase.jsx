import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

/**
 * InteractiveBentoShowcase Component
 * Refined, high-craft Bento Grid showcasing BuildBoard's core mechanics:
 * 1. Deterministic Tester Matching Engine
 * 2. Structured Usability Critique
 * 3. Builder Replies & Recognition Karma
 * 4. Protected Alpha Sandbox Gate
 */
export default function InteractiveBentoShowcase() {
  // ─── Card 1 State: Matching Radar ──────────────────────────────────────────
  const allSkills = [
    { id: 'react', label: 'React 19' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'devtools', label: 'DevTools & CLI' },
    { id: 'rust', label: 'Rust / WASM' },
    { id: 'design-systems', label: 'Design Systems' },
    { id: 'ai-agents', label: 'AI & Agents' },
  ]
  const [selectedSkills, setSelectedSkills] = useState(['react', 'typescript', 'devtools'])

  const toggleSkill = (id) => {
    setSelectedSkills((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((s) => s !== id)
          : prev
        : [...prev, id]
    )
  }

  // Dynamic calculations
  const matchScore = Math.min(72 + selectedSkills.length * 5, 98)
  const testerPoolCount = 8 + selectedSkills.length * 3

  // ─── Card 2 State: Structured Critique ─────────────────────────────────────
  const [activeNoteType, setActiveNoteType] = useState('friction')
  const critiqueNotes = {
    friction: {
      category: 'Usability Friction',
      badgeClass: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25',
      title: 'Navigation Keyboard Trap in Sprint Backlog',
      quote:
        'Sprint swimlanes are intuitive, but backlog keyboard navigation requires 5 tab presses to focus the search bar on Firefox. Binding ⌘K or / to instant filter would save high-friction tabbing.',
      testerName: 'Elena Rostova',
      testerRole: 'Senior Frontend Engineer',
      initials: 'ER',
    },
    observations: {
      category: 'First Impressions',
      badgeClass: 'bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/25',
      title: 'Sub-second Local Repository Ingestion',
      quote:
        'Initial workspace sync took 420ms for a 12,000-line monorepo. Visual commit diffs rendered without layout shifts on high-DPI displays. Onboarding felt instant.',
      testerName: 'Marcus Chen',
      testerRole: 'Systems Architect',
      initials: 'MC',
    },
    delights: {
      category: 'Delight Moment',
      badgeClass: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/25',
      title: 'Inline Markdown Task Inspector',
      quote:
        'The inline markdown preview inside sprint cards completely eliminated switching back and forth to Notion during daily standup triage.',
      testerName: 'Devon Kelly',
      testerRole: 'Product Designer',
      initials: 'DK',
    },
  }
  const currentNote = critiqueNotes[activeNoteType]

  // ─── Card 3 State: Recognition Karma ───────────────────────────────────────
  const [isHelpfulAwarded, setIsHelpfulAwarded] = useState(false)
  const karmaPoints = isHelpfulAwarded ? 48 : 47

  // ─── Card 4 State: Enrollment Gate ─────────────────────────────────────────
  const [isEnrolled, setIsEnrolled] = useState(false)

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
      {/* ── Bento 01: Matching Radar (7 cols) ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="group relative overflow-hidden rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-warm-xs hover:shadow-warm-sm transition-all duration-300 lg:col-span-7 flex flex-col justify-between"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d96b43]/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#d96b43] dark:text-[#eb8b72] border border-[#d96b43]/20">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d96b43] animate-pulse" aria-hidden="true" />
              Phase 01 · Audience Calibration
            </span>
            <span className="text-[11px] font-medium text-[var(--text-subtle)]">
              Explainable Targeting
            </span>
          </div>

          <h3 className="mt-3 font-display text-lg sm:text-xl font-bold tracking-tight text-[var(--text-main)]">
            Deterministic Matching, Zero Hype
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[var(--text-muted)]">
            Match working prototypes directly with testers based on explicit domain criteria. Click tags to see compatibility recalibrate:
          </p>

          {/* Interactive Skill Chips */}
          <div className="mt-3.5 flex flex-wrap gap-1.5" role="group" aria-label="Select skills to calibrate match">
            {allSkills.map((skill) => {
              const active = selectedSkills.includes(skill.id)
              return (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => toggleSkill(skill.id)}
                  aria-pressed={active}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all cursor-pointer active:scale-95 ${
                    active
                      ? 'bg-[#d96b43] text-white shadow-xs border border-[#b85028]'
                      : 'border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] hover:border-[#d96b43]/60 hover:text-[var(--text-main)]'
                  }`}
                >
                  <span>{active ? '✓ ' : '+ '}</span>
                  <span>{skill.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Live Matching Radar Display (Clean single surface) */}
        <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-3.5 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2.5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                Tester Compatibility Score
              </p>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span
                  key={matchScore}
                  className="font-display text-2xl sm:text-3xl font-extrabold text-[#d96b43] tdev-pop-in leading-none"
                >
                  {matchScore}%
                </span>
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  calculated across {selectedSkills.length} criteria
                </span>
              </div>
            </div>

            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              {testerPoolCount} Testers Available
            </span>
          </div>

          {/* Compatibility progress bar */}
          <div className="h-1.5 w-full rounded-full bg-[var(--border-main)] overflow-hidden" aria-hidden="true">
            <motion.div
              className="h-full bg-[#d96b43] rounded-full"
              initial={false}
              animate={{ width: `${matchScore}%` }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            />
          </div>

          {/* Matched Profile Preview */}
          <div className="flex items-center gap-2.5 pt-1.5 border-t border-[var(--border-subtle)]">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d96b43]/15 font-bold text-xs text-[#d96b43]">
              ER
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[var(--text-main)] truncate">
                Elena Rostova <span className="font-normal text-[var(--text-subtle)]">· Senior Frontend Engineer</span>
              </p>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {selectedSkills.slice(0, 3).map((s) => {
                  const label = allSkills.find((k) => k.id === s)?.label
                  return (
                    <span
                      key={s}
                      className="rounded border border-[var(--border-main)] bg-[var(--bg-surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]"
                    >
                      {label}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Bento 02: Structured Critique Canvas (5 cols) ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.4, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        className="group relative overflow-hidden rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-warm-xs hover:shadow-warm-sm transition-all duration-300 lg:col-span-5 flex flex-col justify-between"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 border border-amber-500/20">
              Phase 02 · Structured Notes
            </span>
            <span className="text-[11px] font-medium text-[var(--text-subtle)]">
              Concrete Feedback
            </span>
          </div>

          <h3 className="mt-3 font-display text-lg sm:text-xl font-bold tracking-tight text-[var(--text-main)]">
            Actionable Usability Notes
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[var(--text-muted)]">
            BuildBoard organizes critiques into structured tiers so makers receive engineering clarity, not superficial emoji reactions:
          </p>

          {/* Interactive Tier Tabs */}
          <div className="mt-3.5 flex rounded-lg border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] p-0.5 gap-1">
            {[
              { id: 'friction', label: 'Friction' },
              { id: 'observations', label: 'Observations' },
              { id: 'delights', label: 'Delights' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveNoteType(tab.id)}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium transition cursor-pointer text-center ${
                  activeNoteType === tab.id
                    ? 'bg-[var(--bg-surface)] text-[var(--text-main)] font-semibold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Critique Preview Box */}
        <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-3.5 sm:p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeNoteType}
              initial={{ opacity: 0, y: 3, filter: 'blur(2px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -3, filter: 'blur(2px)' }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold ${currentNote.badgeClass}`}>
                  {currentNote.category}
                </span>
                <span className="text-[11px] font-medium text-[var(--text-subtle)]">
                  High-signal note
                </span>
              </div>

              <h4 className="text-xs sm:text-sm font-bold text-[var(--text-main)] leading-snug">
                {currentNote.title}
              </h4>

              <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                &ldquo;{currentNote.quote}&rdquo;
              </p>

              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-subtle)]">
                <span>By <strong className="text-[var(--text-main)]">{currentNote.testerName}</strong></span>
                <span>{currentNote.testerRole}</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Bento 03: Maker Reply & Recognition Karma (5 cols) ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="group relative overflow-hidden rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-warm-xs hover:shadow-warm-sm transition-all duration-300 lg:col-span-5 flex flex-col justify-between"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
              Phase 03 · Closed Loop
            </span>
            <span className="text-[11px] font-medium text-[var(--text-subtle)]">
              Earned Karma
            </span>
          </div>

          <h3 className="mt-3 font-display text-lg sm:text-xl font-bold tracking-tight text-[var(--text-main)]">
            Maker Replies &amp; Recognition
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[var(--text-muted)]">
            Makers reply to confirm fixes and mark critique helpful. Every helpful mark awards +1 recognition point:
          </p>
        </div>

        {/* Interactive Maker Reply & Karma Card */}
        <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-3.5 sm:p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d96b43]/15 font-bold text-xs text-[#d96b43]">
              YG
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--text-main)]">Yash Garg</span>
                <span className="rounded-full bg-[#d96b43]/10 px-1.5 py-0.2 text-[10px] font-bold text-[#d96b43]">
                  Maker
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)] leading-relaxed">
                &ldquo;Elena, fixed the Firefox tab-index in v0.42! Awarding you a recognition point for the pinpoint catch.&rdquo;
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-[var(--border-subtle)] pt-2.5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                Tester Recognition
              </p>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span key={karmaPoints} className="font-display text-xl sm:text-2xl font-black text-[var(--text-main)] tdev-pop-in leading-none">
                  {karmaPoints} pts
                </span>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {isHelpfulAwarded ? '✓ +1 Awarded' : 'Top 5% Contributor'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsHelpfulAwarded((prev) => !prev)}
              aria-pressed={isHelpfulAwarded}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-xs ${
                isHelpfulAwarded
                  ? 'bg-emerald-600 text-white border border-emerald-600'
                  : 'border border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:border-[#d96b43] hover:text-[#d96b43]'
              }`}
            >
              <span key={isHelpfulAwarded ? 'awarded' : 'idle'} className="tdev-text-swap">
                {isHelpfulAwarded ? '✓ Helpful Awarded' : '★ Award Helpful (+1)'}
              </span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Bento 04: Protected Alpha Enrollment Gate (7 cols) ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.4, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className="group relative overflow-hidden rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-warm-xs hover:shadow-warm-sm transition-all duration-300 lg:col-span-7 flex flex-col justify-between"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
              Phase 04 · Private Alpha Sandbox
            </span>
            <span className="text-[11px] font-medium text-[var(--text-subtle)]">
              Intentional Access
            </span>
          </div>

          <h3 className="mt-3 font-display text-lg sm:text-xl font-bold tracking-tight text-[var(--text-main)]">
            Protected Prototype Access Gate
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[var(--text-muted)]">
            Prototype URLs remain protected until a tester commits to testing. Toggle the simulation below to see access unlock:
          </p>
        </div>

        {/* Interactive Simulated Browser Gate Window */}
        <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] p-3.5 sm:p-4 space-y-2.5">
          {/* Simulated Browser Chrome Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            </div>

            <div className="flex-1 min-w-[180px] max-w-sm rounded-lg border border-[var(--border-main)] bg-[var(--bg-surface)] px-3 py-1.5 font-mono text-xs text-[var(--text-muted)] flex items-center justify-between shadow-xs">
              <span key={isEnrolled ? 'unlocked-url' : 'locked-url'} className="tdev-text-swap truncate">
                {isEnrolled ? 'https://weeknote.app/sprint-42' : '🔒 https://[gated-prototype-link]'}
              </span>
              <span className="text-[10px] font-bold ml-2 shrink-0 text-[#d96b43]">
                {isEnrolled ? '🟢 LIVE' : 'PROTECTED'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsEnrolled((prev) => !prev)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer active:scale-95 shadow-xs ${
                isEnrolled
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#d96b43] text-white hover:bg-[#b85028]'
              }`}
            >
              <span key={isEnrolled ? 'enrolled-btn' : 'enroll-btn'} className="tdev-text-swap">
                {isEnrolled ? 'Reset Gate' : 'Simulate Enrollment'}
              </span>
            </button>
          </div>

          {/* Gate status banner */}
          <div className="pt-1.5 flex items-center justify-between text-xs border-t border-[var(--border-subtle)]">
            <span className="text-[var(--text-muted)] text-[11px] sm:text-xs">
              {isEnrolled
                ? '✓ Tester enrolled. Destination URL active on this session.'
                : 'Prototype URL is protected to prevent link scraping and uncontextualized traffic.'}
            </span>
            <span className="font-semibold text-[#d96b43] shrink-0 ml-2 text-[11px] sm:text-xs">
              {isEnrolled ? 'Unlocked' : 'Protected Gate'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
