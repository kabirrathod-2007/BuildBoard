import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { MotionConfig, motion } from 'motion/react'
import { useAuth } from '../context/AuthContext.jsx'
import SettingsMenu from '../components/SettingsMenu.jsx'
import PasswordInput from '../components/PasswordInput.jsx'
import Logo from '../components/Logo.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function SignInPage() {
  useDocumentTitle('Sign In | BuildBoard')
  const { signIn, isLoading, authError, clearAuthError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})

  function validate() {
    const nextErrors = {}
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      nextErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = 'Please enter a valid email address (e.g. name@example.com).'
    }

    if (!password) {
      nextErrors.password = 'Password is required.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return

    clearAuthError?.()
    const result = await signIn(email.trim(), password)

    if (result?.success) {
      const from = location.state?.from
      const redirect = typeof from === 'string'
        ? from
        : from?.pathname
          ? `${from.pathname}${from.search || ''}${from.hash || ''}`
          : '/'
      navigate(redirect)
    }
  }

  const fillDemoAccount = (demoEmail, demoPass = 'password123') => {
    setEmail(demoEmail)
    setPassword(demoPass)
    setErrors({})
    clearAuthError?.()
  }

  return (
    <MotionConfig reducedMotion="user">
      <main
        id="main-content"
        tabIndex={-1}
        className="grid min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] transition-colors lg:grid-cols-2 focus:outline-none"
      >
        {/* Left Column: Deep Forest-Ink Editorial Pitch */}
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
              <span>Early products · Real people</span>
            </div>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-display font-semibold leading-[1.08] tracking-tight !text-white text-white">
              Pick up where you left off.
            </h1>
            <p className="mt-4 max-w-md text-base sm:text-lg leading-relaxed text-[#c5cdc7]">
              Meet prototypes in progress, share what you learn, and help indie builders make their next version better.
            </p>
          </div>

          <div className="flex items-center justify-between text-sm text-[#828f85]">
            <span>A maker community for prototypes that actually work.</span>
            <span className="text-sm font-semibold tracking-wider text-[#828f85]">MEMBERS</span>
          </div>
        </section>

        {/* Right Column: Sign In Form */}
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
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold uppercase tracking-wider text-[#d96b43]">
                Welcome back
              </p>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Auth API Connected
              </span>
            </div>

            <h2 className="mt-2 text-2xl sm:text-3xl font-display font-semibold tracking-tight text-[var(--text-main)]">
              Sign in to BuildBoard
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
              Enter your account email and password to authenticate.
            </p>

            {/* Quick Demo Credentials Switcher */}
            <div className="mt-5 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] p-3 text-xs">
              <span className="font-bold text-[var(--text-main)]">Quick Demo Profiles (1-Click Fill):</span>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoAccount('builder@buildboard.dev')}
                  className="rounded-lg border border-[var(--border-main)] bg-[var(--bg-surface)] px-2.5 py-1 font-medium text-[var(--text-main)] hover:border-[#d96b43] transition cursor-pointer"
                >
                  🛠 Builder Account
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount('tester@buildboard.dev')}
                  className="rounded-lg border border-[var(--border-main)] bg-[var(--bg-surface)] px-2.5 py-1 font-medium text-[var(--text-main)] hover:border-[#d96b43] transition cursor-pointer"
                >
                  🔍 Community Tester
                </button>
              </div>
            </div>

            {/* API Auth Error Alert */}
            {authError && (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-800 dark:text-rose-200">
                <div className="flex items-center gap-2 font-bold">
                  <svg className="h-4 w-4 shrink-0 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>Authentication Notice</span>
                </div>
                <p className="mt-1 leading-relaxed">{authError}</p>
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label
                  className="mb-1.5 block text-sm font-semibold text-[var(--text-main)]"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  className={`w-full rounded-xl border bg-[var(--bg-surface)] px-4 py-2.5 text-sm text-[var(--text-main)] outline-none transition placeholder:text-[var(--text-subtle)] focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20 ${
                    errors.email
                      ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20'
                      : 'border-[var(--border-main)]'
                  }`}
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  disabled={isLoading}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                  }}
                  autoComplete="email"
                  placeholder="name@example.com"
                  required
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1 text-sm font-semibold text-rose-500" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="mb-1.5 block text-sm font-semibold text-[var(--text-main)]"
                  htmlFor="password"
                >
                  Password
                </label>
                <PasswordInput
                  id="password"
                  name="password"
                  value={password}
                  disabled={isLoading}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
                  }}
                  autoComplete="current-password"
                  hasError={Boolean(errors.password)}
                  ariaDescribedBy={errors.password ? 'password-error' : undefined}
                />
                {errors.password && (
                  <p id="password-error" className="mt-1 text-sm font-semibold text-rose-500" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                className="mt-2 w-full rounded-full bg-[#d96b43] px-5 py-3 text-sm font-semibold text-white shadow-warm-sm transition duration-150 hover:bg-[#b85028] active:translate-y-0.5 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Verifying with Auth API...</span>
                  </span>
                ) : (
                  <span>Sign in to BuildBoard</span>
                )}
              </button>
            </form>

            <p className="mt-6 text-sm text-[var(--text-muted)]">
              Need an account?{' '}
              <Link
                className="font-semibold text-[#d96b43] hover:underline"
                to="/sign-up"
                state={location.state}
              >
                Create an account
              </Link>
            </p>

            <Link
              className="mt-3 inline-flex text-sm font-medium text-[var(--text-subtle)] hover:text-[var(--text-main)] transition-colors"
              to="/"
            >
              ← Back to BuildBoard
            </Link>
          </motion.div>
        </section>
      </main>
    </MotionConfig>
  )
}
