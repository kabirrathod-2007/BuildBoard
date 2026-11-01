import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { MotionConfig, motion } from 'motion/react'
import SettingsMenu from '../components/SettingsMenu.jsx'
import PasswordInput from '../components/PasswordInput.jsx'
import Logo from '../components/Logo.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { getAuthErrorMessage, useAuth } from '../context/AuthContext.jsx'

export default function SignUpPage() {
  useDocumentTitle('Join BuildBoard | Early products. Real people.')
  const navigate = useNavigate()
  const location = useLocation()
  const { signUp } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [authError, setAuthError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    } else if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters long.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return

    setAuthError('')
    setIsSubmitting(true)
    try {
      const created = await signUp(email.trim(), password)
      navigate('/verify-email', {
        state: {
          email: created.email,
          from: location.state?.from,
        },
      })
    } catch (error) {
      setAuthError(getAuthErrorMessage(error))
    } finally {
      setIsSubmitting(false)
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
              One account. <br className="hidden sm:inline" />
              <span className="italic font-normal text-[var(--text-main)] dark:text-[#dbbf95]">
                Two ways to take part.
              </span>
            </h1>

            <p className="mt-4 max-w-md text-base sm:text-lg leading-relaxed text-[var(--text-muted)]">
              Build a product and find early testers, or test prototypes and help shape what comes next.
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between font-mono text-xs text-[var(--text-subtle)]">
            <span>Your profile details and targeting preferences can come later.</span>
            <span className="font-semibold tracking-wider text-[var(--text-muted)]">EARLY ACCESS</span>
          </div>
        </section>

        {/* Right Column: Sign Up Form */}
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
              Join BuildBoard
            </p>

            <h2 className="mt-2 text-2xl sm:text-3xl font-display font-semibold tracking-tight text-[var(--text-main)]">
              Create your account
            </h2>

            <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
              Create your account with Firebase. We&apos;ll send a verification link before you can use signed-in features.
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
                  autoComplete="new-password"
                  hasError={Boolean(errors.password)}
                  ariaDescribedBy={errors.password ? 'password-error' : undefined}
                />
                {errors.password && (
                  <p id="password-error" className="mt-1 text-sm font-semibold text-rose-500" role="alert">
                    {errors.password}
                  </p>
                )}
                <p className="mt-1 text-sm text-[var(--text-subtle)]">
                  Must be at least 8 characters long.
                </p>
              </div>

              {authError && <p role="alert" className="text-sm font-semibold text-rose-600 dark:text-rose-400">{authError}</p>}

              <button
                className="mt-2 w-full rounded-full bg-[#1f3a6b] px-5 py-3 text-sm font-semibold text-white shadow-warm-sm transition duration-150 hover:bg-[#182f56] active:translate-y-0.5 dark:bg-[#dbbf95] dark:text-[#15203a] dark:hover:bg-[#ecdcc2] cursor-pointer"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p className="mt-6 text-sm text-[var(--text-muted)]">
              Already have an account?{' '}
              <Link
                className="font-semibold text-[#1f3a6b] dark:text-[#dbbf95] hover:underline"
                to="/sign-in"
                state={location.state}
              >
                Sign in
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
