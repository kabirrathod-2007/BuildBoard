import { useState, useRef } from 'react'

export default function PasswordInput({
  id = 'password',
  name = 'password',
  value,
  onChange,
  autoComplete = 'current-password',
  placeholder = '••••••••',
  hasError = false,
  ariaDescribedBy,
  required = true,
}) {
  const [showPassword, setShowPassword] = useState(false)
  const inputRef = useRef(null)

  const handleToggle = () => {
    setShowPassword((prev) => !prev)
    // Preserve focus on the password input
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        name={name}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        aria-invalid={hasError}
        aria-describedby={ariaDescribedBy}
        className={`w-full rounded-xl border bg-[var(--bg-surface)] px-4 py-3 pr-12 text-sm sm:text-base text-[var(--text-main)] outline-none transition placeholder:text-[var(--text-subtle)] focus:border-[#e07a5f] focus:ring-2 focus:ring-[#e07a5f]/40 ${
          hasError
            ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20'
            : 'border-[var(--border-main)]'
        }`}
      />
      <button
        type="button"
        onClick={handleToggle}
        onMouseDown={(e) => e.preventDefault()}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        aria-controls={id}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-subtle)] hover:text-[var(--text-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e07a5f] cursor-pointer transition"
      >
        {showPassword ? (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
            />
          </svg>
        ) : (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        )}
      </button>
    </div>
  )
}
