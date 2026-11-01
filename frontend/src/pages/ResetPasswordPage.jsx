import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { MotionConfig, motion } from 'motion/react'
import { getAuthErrorMessage, useAuth } from '../context/AuthContext.jsx'
import SettingsMenu from '../components/SettingsMenu.jsx'
import PasswordInput from '../components/PasswordInput.jsx'
import Logo from '../components/Logo.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function ResetPasswordPage() {
  useDocumentTitle('Reset Password | BuildBoard')
  const { resetPassword, verifyResetCode, confirmReset } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const searchParams = new URLSearchParams(location.search)
  const oobCode = searchParams.get('oobCode')
  const emailParam = searchParams.get('email') || ''

  // Request Reset Email Form State
  const [requestEmail, setRequestEmail] = useState(emailParam)
  const [requestNotice, setRequestNotice] = useState('')
  const [requestError, setRequestError] = useState('')
  const [isSendingRequest, setIsSendingRequest] = useState(false)

  // Code Verification & Password Reset State
  const [isVerifyingCode, setIsVerifyingCode] = useState(Boolean(oobCode))
  const [codeVerifiedEmail, setCodeVerifiedEmail] = useState('')
  const [codeError, setCodeError] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState({})
  const [isSubmittingReset, setIsSubmittingReset] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  // Verify the code if oobCode is present in URL
  useEffect(() => {
    if (!oobCode) {
      return
    }

    let active = true

    verifyResetCode(oobCode)
      .then((email) => {
        if (active) {
          setCodeVerifiedEmail(email || '')
          setIsVerifyingCode(false)
        }
      })
      .catch((err) => {
        if (active) {
          setCodeError(getAuthErrorMessage(err))
          setIsVerifyingCode(false)
        }
      })

    return () => {
      active = false
    }
  }, [oobCode, verifyResetCode])

  // Handle request for a password reset link
  async function handleSendRequest(e) {
    e.preventDefault()
    const trimmed = requestEmail.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setRequestError('Enter a valid email address (e.g. name@example.com).')
      return
    }

    setRequestError('')
    setRequestNotice('')
    setIsSendingRequest(true)

    try {
      await resetPassword(trimmed)
      setRequestNotice(
        `If an account exists for ${trimmed}, we've sent a password reset link to your email. Check your inbox and spam folder.`
      )
    } catch (err) {
      setRequestError(getAuthErrorMessage(err))
    } finally {
      setIsSendingRequest(false)
    }
  }

  // Handle setting a new password with verified code
  async function handleConfirmReset(e) {
    e.preventDefault()
    const nextErrors = {}

    if (!newPassword) {
      nextErrors.newPassword = 'New password is required.'
    } else if (newPassword.length < 8) {
      nextErrors.newPassword = 'Password must be at least 8 characters long.'
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Confirm your new password.'
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setPasswordErrors(nextErrors)
      return
    }

    setPasswordErrors({})
    setCodeError('')
    setIsSubmittingReset(true)

    try {
      await confirmReset(oobCode, newPassword)
      setResetSuccess(true)
    } catch (err) {
      setCodeError(getAuthErrorMessage(err))
    } finally {
      setIsSubmittingReset(false)
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <main
        id="main-content"
        tabIndex={-1}
        className="grid min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] transition-colors lg:grid-cols-2 focus:outline-none"
      >
        {/* Left Column: Brand Column */}
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
              <span>Account Security</span>
            </div>

            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold leading-[1.08] tracking-tight text-[var(--text-main)]">
              {oobCode ? (
                <>
                  Create a <br className="hidden sm:inline" />
                  <span className="italic font-normal text-[var(--text-main)] dark:text-[#dbbf95]">
                    new password.
                  </span>
                </>
              ) : (
                <>
                  Reset your <br className="hidden sm:inline" />
                  <span className="italic font-normal text-[var(--text-main)] dark:text-[#dbbf95]">
                    password.
                  </span>
                </>
              )}
            </h1>

            <p className="mt-4 max-w-md text-base sm:text-lg leading-relaxed text-[var(--text-muted)]">
              {oobCode
                ? 'Choose a strong, memorable password to regain access to your BuildBoard account.'
                : "Enter your registered email and we'll send you a secure link to update your password."}
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between font-mono text-xs text-[var(--text-subtle)]">
            <span>Early products · Real people</span>
            <span className="font-semibold tracking-wider text-[var(--text-muted)]">AUTHENTICATION</span>
          </div>
        </section>

        {/* Right Column: Interaction Form */}
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
            {/* Scenario 1: Loading state while verifying token */}
            {isVerifyingCode ? (
              <div className="py-12 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#1f3a6b] dark:border-[#dbbf95] border-t-transparent" />
                <p className="mt-4 text-sm font-medium text-[var(--text-muted)]">
                  Verifying reset link…
                </p>
              </div>
            ) : oobCode && codeError ? (
              /* Scenario 2: Invalid or expired code */
              <div className="space-y-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-main)]">Reset Link Expired</h2>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">{codeError}</p>
                </div>
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/reset-password')}
                    className="w-full rounded-full bg-[#1f3a6b] px-5 py-3 text-sm font-semibold text-white shadow-warm-sm hover:bg-[#182f56] dark:bg-[#dbbf95] dark:text-[#15203a] dark:hover:bg-[#ecdcc2] cursor-pointer"
                  >
                    Request a New Reset Link
                  </button>
                  <Link
                    to="/sign-in"
                    className="block text-center text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] py-2"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </div>
            ) : oobCode && resetSuccess ? (
              /* Scenario 3: Password successfully reset */
              <div className="space-y-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-main)]">Password Updated</h2>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    Your password has been changed successfully. You can now sign in with your new credentials.
                  </p>
                </div>
                <Link
                  to="/sign-in"
                  className="block w-full rounded-full bg-[#1f3a6b] px-5 py-3 text-center text-sm font-semibold text-white shadow-warm-sm hover:bg-[#182f56] dark:bg-[#dbbf95] dark:text-[#15203a] dark:hover:bg-[#ecdcc2] cursor-pointer"
                >
                  Sign in to BuildBoard →
                </Link>
              </div>
            ) : oobCode ? (
              /* Scenario 4: Valid code, render form to enter new password */
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#1f3a6b] dark:text-[#dbbf95]">
                  Verified Account
                </p>
                <h2 className="mt-2 text-2xl font-display font-semibold tracking-tight text-[var(--text-main)]">
                  Set new password
                </h2>
                {codeVerifiedEmail && (
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Updating password for <strong className="text-[var(--text-main)]">{codeVerifiedEmail}</strong>
                  </p>
                )}

                <form className="mt-6 space-y-4" onSubmit={handleConfirmReset} noValidate>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[var(--text-main)]" htmlFor="newPassword">
                      New Password
                    </label>
                    <PasswordInput
                      id="newPassword"
                      name="newPassword"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value)
                        if (passwordErrors.newPassword) setPasswordErrors((p) => ({ ...p, newPassword: undefined }))
                      }}
                      autoComplete="new-password"
                      hasError={Boolean(passwordErrors.newPassword)}
                    />
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-sm font-semibold text-rose-500">{passwordErrors.newPassword}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[var(--text-main)]" htmlFor="confirmPassword">
                      Confirm New Password
                    </label>
                    <PasswordInput
                      id="confirmPassword"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        if (passwordErrors.confirmPassword) setPasswordErrors((p) => ({ ...p, confirmPassword: undefined }))
                      }}
                      autoComplete="new-password"
                      hasError={Boolean(passwordErrors.confirmPassword)}
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="mt-1 text-sm font-semibold text-rose-500">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>

                  {codeError && (
                    <p className="text-sm font-semibold text-rose-600 dark:text-rose-400" role="alert">
                      {codeError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingReset}
                    className="mt-4 w-full rounded-full bg-[#1f3a6b] px-5 py-3 text-sm font-semibold text-white shadow-warm-sm transition duration-150 hover:bg-[#182f56] dark:bg-[#dbbf95] dark:text-[#15203a] dark:hover:bg-[#ecdcc2] cursor-pointer disabled:opacity-60"
                  >
                    {isSubmittingReset ? 'Updating password…' : 'Update Password'}
                  </button>
                </form>
              </div>
            ) : (
              /* Scenario 5: No code provided, enter email to request a reset link */
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#1f3a6b] dark:text-[#dbbf95]">
                  Password Recovery
                </p>
                <h2 className="mt-2 text-2xl font-display font-semibold tracking-tight text-[var(--text-main)]">
                  Forgot your password?
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
                  Enter your registered email address and we&apos;ll send you a secure link to reset your password.
                </p>

                <form className="mt-6 space-y-4" onSubmit={handleSendRequest} noValidate>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[var(--text-main)]" htmlFor="requestEmail">
                      Email address
                    </label>
                    <input
                      id="requestEmail"
                      name="email"
                      type="email"
                      value={requestEmail}
                      onChange={(e) => {
                        setRequestEmail(e.target.value)
                        if (requestError) setRequestError('')
                      }}
                      placeholder="name@example.com"
                      autoComplete="email"
                      required
                      className="w-full rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm text-[var(--text-main)] outline-none transition placeholder:text-[var(--text-subtle)] focus:border-[#1f3a6b] focus:ring-2 focus:ring-[#1f3a6b]/20 dark:focus:border-[#dbbf95] dark:focus:ring-[#dbbf95]/20"
                    />
                  </div>

                  {requestError && (
                    <p className="text-sm font-semibold text-rose-600 dark:text-rose-400" role="alert">
                      {requestError}
                    </p>
                  )}
                  {requestNotice && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-800 dark:text-emerald-300">
                      {requestNotice}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSendingRequest}
                    className="mt-2 w-full rounded-full bg-[#1f3a6b] px-5 py-3 text-sm font-semibold text-white shadow-warm-sm transition duration-150 hover:bg-[#182f56] dark:bg-[#dbbf95] dark:text-[#15203a] dark:hover:bg-[#ecdcc2] cursor-pointer disabled:opacity-60"
                  >
                    {isSendingRequest ? 'Sending reset link…' : 'Send Password Reset Link'}
                  </button>

                  <div className="pt-2 text-center">
                    <Link
                      to="/sign-in"
                      className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                    >
                      ← Back to Sign In
                    </Link>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </section>
      </main>
    </MotionConfig>
  )
}
