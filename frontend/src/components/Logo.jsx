export default function Logo({
  size = 'md',
  showBadge = true,
  versionText = 'v2.0',
  theme = 'auto',
  className = '',
}) {
  const textSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }[size] || 'text-xl'

  const badgeSizes = {
    xs: 'text-[10px] px-1.5 py-0.5 -translate-y-0.5',
    sm: 'text-xs px-2 py-0.5 -translate-y-0.5',
    md: 'text-xs px-2.5 py-0.5 -translate-y-0.5',
    lg: 'text-xs px-3 py-1 -translate-y-1',
    xl: 'text-sm px-3.5 py-1 -translate-y-1.5',
  }[size] || 'text-xs px-2.5 py-0.5 -translate-y-0.5'

  return (
    <div
      className={`group inline-flex items-center gap-2 select-none no-underline leading-none ${className}`}
    >
      {/* Wordmark Text + Version Badge */}
      <div className="inline-flex items-center gap-2">
        <span className={`inline-flex items-baseline font-display font-bold leading-none tracking-[-0.02em] ${textSizes}`}>
          <span
            className={`${
              theme === 'dark'
                ? 'text-white'
                : theme === 'light'
                  ? 'text-[#1f3a6b]'
                  : 'text-[#1f3a6b] dark:text-white transition-colors'
            }`}
          >
            Build
          </span>
          <span
            className={`ml-[1px] transition-colors ${
              theme === 'dark'
                ? 'text-[#dbbf95]'
                : theme === 'light'
                  ? 'text-[#c9a271]'
                  : 'text-[#c9a271] dark:text-[#dbbf95]'
            }`}
          >
            Board
          </span>
        </span>

        {showBadge && (
          <span
            className={`inline-flex items-center rounded-full border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] font-mono font-medium uppercase tracking-[0.12em] text-[var(--text-muted)] whitespace-nowrap shadow-2xs ${badgeSizes}`}
          >
            {versionText}
          </span>
        )}
      </div>
    </div>
  )
}
export { Logo }
