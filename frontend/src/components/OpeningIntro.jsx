import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

/**
 * BuildBoard Opening Intro
 *
 * A brief, non-interactive brand flash (<500ms total lifetime) displayed on full
 * app document load or browser reload.
 *
 * Theme-aware: adapts to light/dark tokens via CSS variables (--bg-page, --text-main, etc.).
 * Non-blocking: pointer-events-none and aria-hidden="true" so it never blocks pointer or
 * keyboard interaction with the app beneath it.
 * Reduced motion: renders as a static brand screen without movement, dismissing within
 * the same <500ms window.
 */
export default function OpeningIntro({ onDone }) {
  const [leaving, setLeaving] = useState(false)

  // Detect prefers-reduced-motion
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    // Total lifecycle must be completely gone within 500ms.
    // Exit begins at 260ms (standard) or 300ms (reduced-motion).
    // Exit animation duration is 140ms (standard) or 100ms (reduced-motion).
    // Total lifetime: exactly 400ms <= 500ms.
    const exitStartDelay = prefersReduced ? 300 : 260
    const totalLifetime = 400

    const exitStartTimer = setTimeout(() => {
      setLeaving(true)
    }, exitStartDelay)

    const finishTimer = setTimeout(() => {
      onDone?.()
    }, totalLifetime)

    return () => {
      clearTimeout(exitStartTimer)
      clearTimeout(finishTimer)
    }
  }, [onDone, prefersReduced])

  return (
    <AnimatePresence>
      {!leaving && (
        <motion.div
          key="brand-intro"
          aria-hidden="true"
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReduced ? 0.1 : 0.14, ease: 'easeOut' }}
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center select-none"
          style={{
            backgroundColor: 'var(--bg-page)',
          }}
        >
          {/* Brand center */}
          <div className="flex flex-col items-center gap-3">
            {/* Wordmark */}
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReduced ? { duration: 0 } : { duration: 0.12, ease: 'easeOut' }}
              className="inline-flex items-baseline text-4xl sm:text-5xl font-extrabold tracking-tight font-sans leading-none"
            >
              <span style={{ color: 'var(--text-main)' }}>Build</span>
              <span
                style={{
                  background: 'linear-gradient(135deg, #ff8a65 0%, var(--accent-coral) 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginLeft: '2px',
                }}
              >
                Board
              </span>
              <span
                style={{
                  display: 'inline-block',
                  width: '7px',
                  height: '7px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--accent-coral)',
                  marginLeft: '4px',
                  marginBottom: '6px',
                  flexShrink: 0,
                }}
              />
            </motion.div>

            {/* Accent line (static when reduced motion, animated sweep otherwise) */}
            <div
              style={{
                width: '140px',
                height: '2px',
                backgroundColor: prefersReduced ? 'var(--accent-coral)' : 'rgba(224, 122, 95, 0.2)',
                borderRadius: '9999px',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {!prefersReduced && (
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 0.22, ease: 'easeInOut', delay: 0.04 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(90deg, transparent, var(--accent-coral), #ff8a65, transparent)',
                  }}
                />
              )}
            </div>

            {/* Tagline */}
            <span
              className="text-[11px] font-semibold tracking-widest uppercase"
              style={{
                color: 'var(--text-muted)',
              }}
            >
              Early products · Real people
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
