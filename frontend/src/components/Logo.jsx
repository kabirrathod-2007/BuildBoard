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
        <span className={`inline-flex items-baseline tracking-tight ${textSizes}`}>
          <span
            className={`font-extrabold ${
              theme === 'dark'
                ? 'text-white'
                : theme === 'light'
                  ? 'text-[#141a15]'
                  : 'text-[var(--text-main)] transition-colors'
            }`}
          >
            Build
          </span>
          <span className="font-sans font-bold text-[#d96b43] dark:text-[#e07a5f] ml-[1.5px]">
            Board
          </span>
        </span>

        {showBadge && (
          <span
            className={`inline-flex items-center rounded-md border border-[#d96b43]/30 bg-[#fbf3ee] dark:bg-[#e07a5f]/15 font-bold uppercase tracking-wider text-[#b85028] dark:text-[#eb8b72] whitespace-nowrap shadow-xs ${badgeSizes}`}
          >
            {versionText}
          </span>
        )}
      </div>
    </div>
  )
}
export { Logo }
