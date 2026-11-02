export default function Logo({
  size = 'md',
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

  return (
    <div
      className={`group inline-flex items-center gap-2 select-none no-underline leading-none ${className}`}
    >
      {/* Wordmark Text */}
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
    </div>
  )
}
export { Logo }
