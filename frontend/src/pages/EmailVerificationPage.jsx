import { Link, useLocation } from 'react-router'
import { MotionConfig, motion } from 'motion/react'
import SettingsMenu from '../components/SettingsMenu.jsx'
import Logo from '../components/Logo.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function EmailVerificationPage() {
  useDocumentTitle('Verify Account | BuildBoard')
  const location = useLocation()
  const email = location.state?.email || new URLSearchParams(location.search).get('email') || ''

  const from = location.state?.from
  const signInState = from ? { from } : undefined

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
              <span>Email verification</span>
            </div>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-display font-semibold leading-[1.08] tracking-tight !text-white text-white">
              Confirm your email.
            </h1>
            <p className="mt-4 max-w-md text-base sm:text-lg leading-relaxed text-[#c5cdc7]">
              Verify your email address to activate your BuildBoard account and continue to the feature you were trying to use.
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
              Account setup
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-display font-semibold tracking-tight text-[var(--text-main)]">
              Check your inbox
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
              {email ? 'We sent a verification link to:' : 'Open the verification link we sent to your email address.'}
            </p>
            {email && <p className="mt-0.5 break-all font-mono font-semibold text-sm text-[var(--text-main)]">{email}</p>}

            <div className="mt-5 border-l-2 border-[#d96b43] bg-[var(--bg-surface-subtle)] p-3.5 text-sm leading-relaxed text-[var(--text-muted)] rounded-r-xl">
              Open the email and follow its verification link. If you don&apos;t see it, check your spam folder. After verification, return here and sign in.
            </div>

            <Link
              to="/sign-in"
              state={signInState}
              className="mt-6 flex w-full items-center justify-center rounded-full bg-[#d96b43] px-5 py-3 text-sm font-semibold text-white shadow-warm-sm transition hover:bg-[#b85028] active:translate-y-0.5"
            >
              Continue to sign in →
            </Link>

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
