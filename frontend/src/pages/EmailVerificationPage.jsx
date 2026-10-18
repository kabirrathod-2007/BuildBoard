import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { MotionConfig, motion } from 'motion/react'
import { useAuth } from '../context/AuthContext.jsx'
import SettingsMenu from '../components/SettingsMenu.jsx'
import Logo from '../components/Logo.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function EmailVerificationPage() {
  useDocumentTitle('Verify Account | BuildBoard')
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signIn } = useAuth()

  const email = location.state?.email || user?.email || 'member@example.com'
  const [isVerified, setIsVerified] = useState(false)

  const from = location.state?.from
  const destination = typeof from === 'string'
    ? from
    : from?.pathname
      ? `${from.pathname}${from.search || ''}${from.hash || ''}`
      : '/explore'

  let destinationLabel = 'Explore'
  const destPath = typeof from === 'string' ? from : (from?.pathname || destination)
  if (destPath === '/products/new') {
    destinationLabel = 'Submit product'
  } else if (destPath.startsWith('/products/')) {
    destinationLabel = 'Product details'
  } else if (destPath === '/builder/dashboard') {
    destinationLabel = 'Builder Dashboard'
  } else if (destPath.startsWith('/profile')) {
    destinationLabel = 'Profile setup'
  } else if (destination !== '/explore') {
    destinationLabel = destination
  }

  function handleVerify() {
    signIn(email)
    setIsVerified(true)
  }

  function handleContinue() {
    navigate(destination)
  }

  return (
    <MotionConfig reducedMotion="user">
      <main
        id="main-content"
        tabIndex={-1}
        className="grid min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] transition-colors lg:grid-cols-2 focus:outline-none"
      >
        {/* Left Column: Forest-Ink Brand Pitch */}
        <section className="flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[var(--border-main)] bg-[#0b100c] p-7 text-white sm:p-10 lg:p-14">
          <div className="flex items-center justify-between">
            <Link className="no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d96b43] rounded-lg" to="/">
              <Logo theme="dark" />
            </Link>
            <div className="lg:hidden">
              <SettingsMenu />
            </div>
          </div>

          <div className="my-14 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-sm font-semibold text-[#ffa36b]">
              <span>Account verification</span>
            </div>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-display font-semibold leading-[1.08] tracking-tight !text-white text-white">
              Confirm your email.
            </h1>
            <p className="mt-4 max-w-md text-base sm:text-lg leading-relaxed text-[#c5cdc7]">
              Confirm your email address to unlock prototype testing, provide structured feedback, and earn builder recognition points.
            </p>
          </div>

          <div className="flex items-center justify-between text-sm text-[#828f85]">
            <span>Early products · Real people</span>
            <span className="text-sm font-semibold tracking-wider text-[#828f85]">SECURITY</span>
          </div>
        </section>

        {/* Right Column: Verification Action */}
        <section className="flex flex-col items-center justify-center px-5 py-14 sm:px-10">
          <div className="mb-6 hidden w-full max-w-md justify-end lg:flex">
            <SettingsMenu />
          </div>

          <motion.div
            className="w-full max-w-md rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-7 shadow-warm-xl sm:p-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <p className="text-sm font-bold uppercase tracking-wider text-[#d96b43]">
              Account Security
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-display font-semibold tracking-tight text-[var(--text-main)]">
              Verify your account
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
              Account email:
            </p>
            <p className="mt-0.5 break-all font-mono font-semibold text-sm text-[var(--text-main)]">{email}</p>

            <div className="mt-5 border-l-2 border-[#d96b43] bg-[var(--bg-surface-subtle)] p-3.5 text-sm leading-relaxed text-[var(--text-muted)] rounded-r-xl">
              <strong className="text-[var(--text-main)]">One-click activation:</strong> Click below to verify your email and immediately activate your session.
            </div>

            {isVerified ? (
              <div className="mt-6 space-y-3">
                <div
                  role="status"
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-[var(--text-main)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white dark:bg-emerald-500">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-emerald-800 dark:text-emerald-300">Verification complete!</h3>
                      <p className="mt-0.5 text-sm leading-relaxed text-[var(--text-muted)]">
                        You are now signed in as <span className="font-semibold text-[var(--text-main)]">{email}</span>. Your workspace and testing profile are ready.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleContinue}
                  className="w-full rounded-full bg-[#1b241e] px-5 py-3 text-sm font-semibold text-white shadow-warm-sm transition hover:bg-[#2e3b32] dark:bg-[#fbfaf7] dark:text-[#0b100c] active:translate-y-0.5 cursor-pointer"
                >
                  Continue to {destinationLabel} →
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <button
                  type="button"
                  onClick={handleVerify}
                  className="w-full rounded-full bg-[#d96b43] px-5 py-3 text-sm font-semibold text-white shadow-warm-sm transition hover:bg-[#b85028] active:translate-y-0.5 cursor-pointer"
                >
                  Confirm & activate account →
                </button>

                <p className="text-center text-sm text-[var(--text-subtle)]">
                  Instant activation. No waiting required.
                </p>
              </div>
            )}

            <div className="mt-6 border-t border-[var(--border-main)] pt-4">
              <Link
                className="inline-flex text-sm font-medium text-[var(--text-subtle)] hover:text-[var(--text-main)] transition-colors"
                to="/"
              >
                ← Back to BuildBoard
              </Link>
            </div>
          </motion.div>
        </section>
      </main>
    </MotionConfig>
  )
}