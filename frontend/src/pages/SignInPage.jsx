import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { MotionConfig, motion } from 'motion/react'
import { getAuthErrorMessage, useAuth } from '../context/AuthContext.jsx'
import SettingsMenu from '../components/SettingsMenu.jsx'
import PasswordInput from '../components/PasswordInput.jsx'
import Logo from '../components/Logo.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function SignInPage() {
  useDocumentTitle('Sign In | BuildBoard')
  const { signIn, resetPassword } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [authError, setAuthError] = useState('')
  const [authNotice, setAuthNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)

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

    setAuthError('')
    setAuthNotice('')
    setIsSubmitting(true)
    try {
      await signIn(email.trim(), password)
      const from = location.state?.from
      const redirect = typeof from === 'string'
        ? from
        : from?.pathname
          ? `${from.pathname}${from.search || ''}${from.hash || ''}`
          : '/'
      navigate(redirect)
    } catch (error) {
      if (error?.code === 'auth/email-not-verified') {
        navigate('/verify-email', {
          state: { email: email.trim(), from: location.state?.from },
        })
      } else {
        setAuthError(getAuthErrorMessage(error))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handlePasswordReset() {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setAuthError('Enter a valid email address first, then request a password reset.')
      return
    }

    setAuthError('')
    setAuthNotice('')
    setIsResettingPassword(true)
    try {
      await resetPassword(email)
      setAuthNotice('If an account exists for this email, Firebase has sent a password reset link.')
    } catch (error) {
      setAuthError(getAuthErrorMessage(error))
    } finally {
      setIsResettingPassword(false)
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <main
        id="main-content"
        tabIndex={-1}
        className="grid min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] transition-colors lg:grid-cols-2 focus:outline-none"
      >
        {/* Left Column: Adaptive Brand Column */}
        <section className="relative overflow-hidden flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[var(--border-main)] bg-[var(--bg-surface-subtle)] dark:bg-[#151413] p-7 text-[var(--text-main)] sm:p-10 lg:p-14 transition-colors">
          <div className="absolute inset-0 bg-hero-washes opacity-40 pointer-events-none" aria-hidden="true" />

          <div className="relative z-10 flex items-center justify-between">
            <Link className="no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f3a6b] dark:focus-visible:ring-[#dbbf95] rounded-lg" to="/">
              <Logo theme="auto" />
            </Link>
            <div className="lg:hidden">
              <SettingsMenu />
            </div>
          </div>

          <div className="relative z-10 my-14 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-3.5 py-1 text-xs sm:text-sm font-mono uppercase tracking-[0.14em] font-semibold text-[#1f3a6b] dark:text-[#dbbf95] shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1f3a6b] dark:bg-[#dbbf95]" aria-hidden="true" />
              <span>Early products · Real people</span>
            </div>

            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold leading-[1.08] tracking-tight text-[var(--text-main)]">
              Pick up <br className="hidden sm:inline" />
              <span className="italic font-normal text-[var(--text-main)] dark:text-[#dbbf95]">
                where you left off.
              </span>
            </h1>

            <p className="mt-4 max-w-md text-base sm:text-lg leading-relaxed text-[var(--text-muted)]">
              Meet prototypes in progress, share what you learn, and help indie builders make their next version better.
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between font-mono text-xs text-[var(--text-subtle)]">
            <span>A maker community for prototypes that actually work.</span>
            <span className="font-semibold tracking-wider text-[var(--text-muted)]">MEMBERS</span>
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
            <p className="font-mono text-xs sm:text-sm font-bold uppercase tracking-[0.14em] text-[#1f3a6b] dark:text-[#dbbf95]">
              Welcome back
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-display font-semibold tracking-tight text-[var(--text-main)]">
              Sign in to BuildBoard
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
              Sign in with the email and password you used to create your BuildBoard account. You must verify your email first.
            </p>

            <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label
                  className="mb-1.5 block text-sm font-semibold text-[var(--text-main)]"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  className={`w-full rounded-xl border bg-[var(--bg-surface)] px-4 py-2.5 text-sm text-[var(--text-main)] outline-none transition placeholder:text-[var(--text-subtle)] focus:border-[#1f3a6b] focus:ring-2 focus:ring-[#1f3a6b]/20 dark:focus:border-[#dbbf95] dark:focus:ring-[#dbbf95]/20 ${
                    errors.email
                      ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20'
                      : 'border-[var(--border-main)]'
                  }`}
                  id="email"
                  name="email"
                  type="email"
                  value={email}
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
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={isResettingPassword}
                  className="mt-2 text-sm font-semibold text-[#1f3a6b] dark:text-[#dbbf95] hover:underline disabled:opacity-60"
                >
                  {isResettingPassword ? 'Sending reset link…' : 'Forgot password?'}
                </button>
              </div>

              {authError && <p role="alert" className="text-sm font-semibold text-rose-600 dark:text-rose-400">{authError}</p>}
              {authNotice && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{authNotice}</p>}

              <button
                className="mt-2 w-full rounded-full bg-[#1f3a6b] px-5 py-3 text-sm font-semibold text-white shadow-warm-sm transition duration-150 hover:bg-[#182f56] active:translate-y-0.5 dark:bg-[#dbbf95] dark:text-[#15203a] dark:hover:bg-[#ecdcc2] cursor-pointer"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="mt-6 text-sm text-[var(--text-muted)]">
              Need an account?{' '}
              <Link
                className="font-semibold text-[#1f3a6b] dark:text-[#dbbf95] hover:underline"
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
