import { useState, useEffect, useRef } from 'react'
import { MotionConfig, motion, AnimatePresence, useReducedMotion, useTransform, useMotionValue, useSpring } from 'motion/react'
import { Link } from 'react-router'
import { useDemoData } from '../context/DemoDataContext.jsx'
import { useIndexedDbMedia } from '../utils/indexedDB.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import InteractiveBentoShowcase from '../components/InteractiveBentoShowcase.jsx'

// ─── Shared interactive-link component ───────────────────────────────────────

function ActionLink({ children, href, variant = 'primary', className = '', size = 'md' }) {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap select-none transition-all duration-200 cursor-pointer no-underline active:translate-y-0.5'

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-3.5 text-base sm:text-lg',
  }

  const variantClasses = {
    primary:
      'bg-[#d96b43] text-white border border-[#d96b43]/30 shadow-warm-md hover:bg-[#b85028] hover:-translate-y-0.5 hover:shadow-warm-lg',
    secondary:
      'bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-main)] hover:bg-[var(--bg-surface-subtle)] hover:border-[var(--border-strong)] hover:-translate-y-0.5 shadow-warm-xs',
    darkForest:
      'bg-[#141b16] text-[#f4ede2] border border-[#233127] shadow-warm-md hover:bg-[#1c2720] hover:-translate-y-0.5 dark:bg-[#f3f4f0] dark:text-[#0b100c] dark:hover:bg-white',
    outline:
      'bg-transparent text-[var(--text-main)] border border-[var(--border-main)] hover:bg-[var(--bg-surface-subtle)] hover:border-[#d96b43]',
    darkOutline:
      'bg-white/10 text-white border border-white/35 hover:bg-white/20 hover:border-white/60',
  }

  const cls = `${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${className}`.trim()

  if (href.startsWith('/')) {
    return <Link to={href} className={cls}>{children}</Link>
  }
  return <a href={href} className={cls}>{children}</a>
}

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({ badgeText, title, description }) {
  return (
    <div className="mx-auto mb-10 sm:mb-12 flex max-w-3xl flex-col items-center text-center gap-2.5">
      {badgeText && (
        <span className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold tracking-wider uppercase bg-[#d96b43]/10 text-[#d96b43] dark:bg-[#e07a5f]/15 dark:text-[#eb8b72] border border-[#d96b43]/20">
          {badgeText}
        </span>
      )}
      <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-snug text-[var(--text-main)]">
        {title}
      </h2>
      {description && (
        <p className="text-sm sm:text-base leading-relaxed text-[var(--text-muted)] max-w-2xl">
          {description}
        </p>
      )}
    </div>
  )
}

// ─── Pillar Card ─────────────────────────────────────────────────────────────


// ─── Scroll-reveal section wrapper ───────────────────────────────────────────

function RevealSection({ children, className = '', id }) {
  return (
    <motion.section
      id={id}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.section>
  )
}

// ─── Product Spotlight (Controlled Carousel) ──────────────────────────────────

function ProductSpotlight({ products = [] }) {
  const { getProfile } = useDemoData()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const containerRef = useRef(null)

  const count = products.length
  const currentProduct = count > 0 ? products[currentIndex % count] : null
  const defaultFallbackImg = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80'
  const { url: spotlightMediaUrl } = useIndexedDbMedia(currentProduct?.mediaId, currentProduct?.image)
  const displayImage = spotlightMediaUrl || currentProduct?.image || defaultFallbackImg
  const currentMakerProfile = currentProduct?.creatorEmail ? getProfile(currentProduct.creatorEmail) : null
  const currentMakerName =
    currentMakerProfile?.displayName?.trim() ||
    currentProduct?.maker ||
    'Independent Builder'

  // Pause on tab visibility change
  useEffect(() => {
    const onVisibility = () => { if (document.hidden) setIsPaused(true) }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  if (count === 0 || !currentProduct) {
    return (
      <div className="rounded-3xl border border-dashed border-[var(--border-main)] bg-[var(--bg-surface)] p-10 text-center">
        <p className="text-base text-[var(--text-muted)]">No prototypes available to spotlight.</p>
        <Link
          to="/products/new"
          className="mt-3 inline-block text-base font-semibold text-[#d96b43] hover:underline"
        >
          Submit the first prototype →
        </Link>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] overflow-hidden shadow-warm-lg"
      aria-roledescription="carousel"
      aria-label="Product spotlight"
    >
      {/* Spotlight Top Bar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[var(--bg-surface)] px-3 py-1 text-sm font-semibold text-[var(--text-subtle)] border border-[var(--border-main)]">
            {currentIndex + 1} of {count}
          </span>
          <button
            type="button"
            onClick={() => {
              if (count <= 1) return
              let next = currentIndex
              while (next === currentIndex) {
                next = Math.floor(Math.random() * count)
              }
              setCurrentIndex(next)
            }}
            title="Random prototype jump"
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)] hover:border-[#d96b43] hover:text-[#d96b43] transition-all cursor-pointer active:scale-95 shadow-warm-xs"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 12h.01M16 8h.01M8 8h.01M8 16h.01M16 16h.01M11 21h2c2.8 0 4.2 0 5.27-.545a5 5 0 0 0 2.185-2.185C21 17.2 21 15.8 21 13v-2c0-2.8 0-4.2-.545-5.27a5 5 0 0 0-2.185-2.185C17.2 3 15.8 3 13 3h-2c-2.8 0-4.2 0-5.27.545A5 5 0 0 0 3.545 5.73C3 6.8 3 8.2 3 11v2c0 2.8 0 4.2.545 5.27a5 5 0 0 0 2.185 2.185C6.8 21 8.2 21 11 21Z" />
            </svg>
            <span>Surprise Me</span>
          </button>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev - 1 + count) % count)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] text-sm text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)] transition cursor-pointer"
            aria-label="Previous prototype"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev + 1) % count)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] text-sm text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)] transition cursor-pointer"
            aria-label="Next prototype"
          >
            →
          </button>
        </div>
      </div>

      <div className="h-1 bg-[var(--bg-surface-subtle)]" aria-hidden="true">
        <div
          key={currentProduct.id}
          onAnimationEnd={() => {
            if (!isPaused && count > 1) {
              setCurrentIndex((prev) => (prev + 1) % count)
            }
          }}
          className="spotlight-progress h-full bg-[#d96b43]"
          style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
        />
      </div>

      {/* Main Spotlight Showcase Grid with Coordinated Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentProduct.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="grid gap-6 p-6 sm:p-8 lg:grid-cols-12 items-center"
        >
          {/* Left Info Column */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
                {currentProduct.stage || 'Working prototype'}
              </span>
              {currentProduct.categories?.slice(0, 2).map((cat) => (
                <span
                  key={cat}
                  className="rounded-full border border-[#d96b43]/20 bg-[#fbf3ee] dark:bg-[#e07a5f]/15 px-2.5 py-0.5 text-xs font-semibold text-[#b85028] dark:text-[#eb8b72]"
                >
                  {cat}
                </span>
              ))}
            </div>

            <h3 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-[var(--text-main)]">
              {currentProduct.name}
            </h3>

            <p className="text-sm sm:text-base leading-relaxed text-[var(--text-muted)]">
              {currentProduct.tagline}
            </p>

            <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] p-3.5 sm:p-4 text-xs sm:text-sm space-y-1.5">
              <div className="text-[11px] uppercase font-bold tracking-wider text-[#d96b43] dark:text-[#eb8b72]">
                Builder&apos;s Feedback Request:
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-main)] italic leading-relaxed">
                &ldquo;{currentProduct.feedbackRequest}&rdquo;
              </p>
            </div>

            <div className="pt-1 flex flex-wrap items-center gap-3">
              <ActionLink href={`/products/${currentProduct.id}`} variant="primary" size="md">
                <span>Inspect &amp; Enroll</span>
                <span aria-hidden="true">→</span>
              </ActionLink>
              <span className="text-xs text-[var(--text-subtle)]">
                by {currentMakerName}
              </span>
            </div>
          </div>

          {/* Right Screenshot / Interface Column */}
          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] shadow-warm-sm">
              <motion.img
                key={displayImage}
                src={displayImage}
                alt={`${currentProduct.name} interface preview`}
                className="w-full h-auto object-cover object-top max-h-[380px]"
                whileHover={{ scale: 1.025 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                loading="lazy"
                onError={(e) => {
                  if (e.currentTarget.src !== defaultFallbackImg) {
                    e.currentTarget.src = defaultFallbackImg
                  }
                }}
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Quick Select Tabs at Bottom */}
      <div className="flex border-t border-[var(--border-main)] overflow-x-auto bg-[var(--bg-surface-subtle)] px-6 py-3 gap-2" role="tablist" aria-label="Featured product previews">
        {products.map((p, idx) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={idx === currentIndex}
            onClick={() => setCurrentIndex(idx)}
            className={`relative px-4 py-2 rounded-xl text-sm whitespace-nowrap transition cursor-pointer select-none ${
              idx === currentIndex
                ? 'text-[var(--text-main)] font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] font-medium'
            }`}
          >
            {idx === currentIndex && (
              <motion.div
                layoutId="spotlight-active-pill"
                className="absolute inset-0 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-xs"
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              />
            )}
            <span className="relative z-10">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Kinetic Typography Hero Headline ────────────────────────────────────────

function KineticHeadline({ variants }) {
  const shouldReduceMotion = useReducedMotion()

  const line1Words = ['Working', 'prototypes.']
  const line2Words = ['Real', 'feedback.']

  const wordVariant = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: '110%', rotateZ: 2 },
    visible: {
      opacity: 1,
      y: 0,
      rotateZ: 0,
      transition: {
        duration: 0.65,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  }

  const underlineVariant = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 0.75,
        delay: shouldReduceMotion ? 0 : 0.45,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  }

  return (
    <motion.h1
      variants={variants}
      className="font-display text-4xl font-bold leading-[1.08] tracking-[-0.045em] text-[var(--text-main)] sm:text-5xl lg:text-[3.25rem]"
    >
      <span className="block overflow-hidden sm:whitespace-nowrap pb-1">
        {line1Words.map((word) => (
          <span key={word} className="inline-block overflow-hidden mr-[0.28em] align-top">
            <motion.span variants={wordVariant} className="inline-block">
              {word}
            </motion.span>
          </span>
        ))}
      </span>
      <span className="relative inline-block overflow-visible text-[#d96b43] dark:text-[#e07a5f]">
        <span className="block overflow-hidden pb-1">
          {line2Words.map((word) => (
            <span key={word} className="inline-block overflow-hidden mr-[0.28em] align-top">
              <motion.span variants={wordVariant} className="inline-block">
                {word}
              </motion.span>
            </span>
          ))}
        </span>
        {/* Subtle decorative curved terracotta underline */}
        <svg
          viewBox="0 0 240 12"
          fill="none"
          className="absolute -bottom-2 left-0 w-full max-w-[240px] pointer-events-none text-[#d96b43]/70 dark:text-[#e07a5f]/80 overflow-visible"
          aria-hidden="true"
        >
          <motion.path
            d="M3 8.5C65 2.5 175 2 237 9"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            variants={underlineVariant}
          />
        </svg>
      </span>
    </motion.h1>
  )
}

// ─── Interactive Hero Prototype Preview with Animated Feedback Loop ──────────

function HeroPrototypeLoopPreview() {
  const [activeStage, setActiveStage] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Auto-advance through the 3 loop stages every 5s unless hovered
  useEffect(() => {
    if (isHovered) return
    const timer = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % 3)
    }, 5000)
    return () => clearInterval(timer)
  }, [isHovered])

  // Mouse tilt tracking with Motion values and real spring physics
  const cardRef = useRef(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Calibrated spring options for responsive, tactile 3D tilt
  const springConfig = { damping: 20, stiffness: 220, mass: 0.6 }
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [9, -9]), springConfig)
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-11, 11]), springConfig)
  const liftY = useSpring(isHovered ? -8 : 0, springConfig)
  const cardScale = useSpring(isHovered ? 1.015 : 1, springConfig)

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    mouseX.set(0)
    mouseY.set(0)
  }

  const loopStages = [
    {
      title: 'Tester Enrollment',
      tag: 'Step 01',
      badge: 'Access Unlocked',
      badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
      icon: (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
      headline: 'Tester enrolled · Prototype link active',
      detail: 'Elena enrolled from Design Engineering. Prototype destination URL unlocked on this device.',
    },
    {
      title: 'Structured Note',
      tag: 'Step 02',
      badge: 'Friction Reported',
      badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
      icon: (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      headline: 'Friction & Usability Critique',
      detail: '“Sprint swimlanes are intuitive, but backlog keyboard navigation has high friction on Firefox.”',
    },
    {
      title: 'Builder Reply',
      tag: 'Step 03',
      badge: '+1 Helpful Point',
      badgeColor: 'border-[#d96b43]/30 bg-[#d96b43]/10 text-[#b85028] dark:text-[#eb8b72]',
      icon: (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      ),
      headline: 'Maker replied & recognized critique',
      detail: '“Fixed in v0.4 release! Marked as helpful critique (+1 recognition point awarded to Elena).”',
    },
  ]

  const current = loopStages[activeStage]

  return (
    <div
      className="relative mx-auto min-w-0 w-full max-w-[680px] lg:mx-0 [perspective:1000px]"
      style={{ perspective: 1000 }}
    >
      {/* Ambient background glow */}
      <div className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-[#d96b43]/[0.08] blur-xl" aria-hidden="true" />

      {/* Main Interactive Card */}
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          y: liftY,
          scale: cardScale,
          transformStyle: 'preserve-3d',
        }}
        className="relative overflow-hidden rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-2 shadow-warm-xl transition-shadow duration-300 hover:shadow-warm-2xl"
      >
        {/* Browser Mockup Chrome Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-4 py-2.5 rounded-t-2xl">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#d96b43]/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--border-strong)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--border-strong)]" />
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-3 py-0.5 text-xs font-mono text-[var(--text-muted)]">
            <span className="text-[#d96b43]">weeknote.app</span>
            <span className="text-[var(--text-subtle)]">/</span>
            <span>sprint-42</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            Live Preview
          </span>
        </div>

        {/* Prototype Interface Image */}
        <div className="relative overflow-hidden rounded-b-2xl bg-[var(--bg-surface-subtle)]">
          <img
            src="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1200&q=80"
            alt="Preview of Weeknote, a structured weekly planning prototype"
            className="aspect-[1.65] w-full object-cover pointer-events-none select-none"
            draggable={false}
            fetchPriority="high"
          />

          {/* Core Testing Loop Overlay Badge */}
          <div className="pointer-events-none absolute top-3 right-3 sm:top-4 sm:right-4">
            <div className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)]/90 backdrop-blur-md px-3 py-1 text-xs font-semibold text-[var(--text-main)] shadow-warm-xs flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d96b43]" aria-hidden="true" />
              <span>Feedback Loop in Action</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating Dynamic Feedback Loop Inspector Pill */}
      <motion.div
        layout
        className="mt-4 sm:mt-0 sm:absolute sm:-bottom-7 sm:left-4 sm:right-4 sm:left-auto sm:right-6 sm:w-[350px] rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-4 shadow-warm-lg"
      >
        <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d96b43]">
              {current.tag}
            </span>
            <span className="text-xs font-semibold text-[var(--text-muted)]">
              {current.title}
            </span>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${current.badgeColor}`}>
            {current.icon}
            <span>{current.badge}</span>
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeStage}
            initial={{ opacity: 0, y: 4, filter: 'blur(2px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -4, filter: 'blur(2px)' }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="pt-2.5"
          >
            <p className="text-xs font-bold text-[var(--text-main)]">
              {current.headline}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
              {current.detail}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Phase selector tabs */}
        <div className="mt-3 flex items-center justify-between gap-1 border-t border-[var(--border-main)] pt-2.5" role="tablist" aria-label="Feedback loop stages">
          {loopStages.map((stage, idx) => (
            <button
              key={stage.tag}
              type="button"
              role="tab"
              aria-selected={idx === activeStage}
              onClick={() => setActiveStage(idx)}
              className={`flex-1 rounded-md py-1 text-[11px] font-semibold transition cursor-pointer text-center ${
                idx === activeStage
                  ? 'bg-[#d96b43] text-white shadow-xs'
                  : 'bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {stage.tag}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// ─── How BuildBoard Works Scroll-Driven Timeline ─────────────────────────────

function HowItWorksTimeline() {
  const shouldReduceMotion = useReducedMotion()
  const steps = [
    {
      step: 'Step 01',
      role: 'Builder Listing',
      title: 'Publish a functional prototype',
      body: 'Describe your software, define target audience requirements, provide the live preview link, and ask specific testing questions.',
      meta: 'Target roles, prototype URL & testing goals',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
    },
    {
      step: 'Step 02',
      role: 'Tester Enrollment',
      title: 'Discover and enroll',
      body: 'Testers find matching software via deterministic recommendations. Enrolling unlocks the external prototype link.',
      meta: 'Gated prototype links for enrolled testers',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
    },
    {
      step: 'Step 03',
      role: 'Feedback & Reputation',
      title: 'Critique and earn recognition',
      body: 'Testers submit structured notes on what worked and where they hit friction. Builders reply and award recognition points.',
      meta: 'Direct maker replies & community standing',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      ),
    },
  ]

  return (
    <div className="relative isolate mt-14">
      <div className="grid gap-8 md:grid-cols-3">
        {steps.map(({ step, role, title, body, meta, icon }, index) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.5,
              delay: index * 0.15,
              ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={shouldReduceMotion ? {} : { y: -4, transition: { duration: 0.2 } }}
            className="group relative z-10 flex flex-col justify-between pt-6 pb-2 transition-colors"
          >
            <div>
              {/* Step indicator */}
              <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
                <span className="text-xs font-bold text-[#d96b43] dark:text-[#eb8b72] uppercase tracking-wider flex items-center gap-1.5">
                  <span>{icon}</span>
                  <span>{step}</span>
                </span>
                <span className="text-xs uppercase font-semibold tracking-wider text-[var(--text-subtle)]">
                  {role}
                </span>
              </div>

              <h3 className="mt-5 font-display text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)] group-hover:text-[#d96b43] transition-colors">
                {title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-[var(--text-muted)]">
                {body}
              </p>
            </div>

            <div className="mt-8 border-t border-[var(--border-main)] pt-4 flex items-center justify-between text-xs font-medium text-[var(--text-subtle)]">
              <span>{meta}</span>
              <span className="text-[#d96b43] opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">
                →
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Landing Page Component ─────────────────────────────────────────────

export default function LandingPage() {
  useDocumentTitle('BuildBoard | Where Early Software Meets Real Testers')
  const { products = [] } = useDemoData()

  // Coordinated Hero Entrance Variants
  const heroContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      },
    },
  }

  const heroItemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] transition-colors">
        {/* Navigation */}
        <Navbar />

        <main id="main-content" tabIndex={-1} className="focus:outline-none">
          {/* ── Editorial hero: clear message beside a real product preview ── */}
          <section className="relative isolate overflow-hidden border-b border-[var(--border-main)] bg-[var(--bg-page)]">
            <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
              <motion.img
                src="/assets/landing/hero-builder-workspace.webp"
                alt=""
                className="h-full w-full object-cover object-[58%_center] opacity-[0.56] dark:opacity-[0.38]"
                initial={{ scale: 1.04 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                fetchPriority="high"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-page)] via-[var(--bg-page)]/88 to-[var(--bg-page)]/10" />
              <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-page)]/35 via-transparent to-[var(--bg-page)]/45" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(217,107,67,0.12),transparent_70%)] pointer-events-none" />
            </div>
            <motion.div
              variants={heroContainerVariants}
              initial="hidden"
              animate="visible"
              className="mx-auto grid w-full grid-cols-1 max-w-7xl items-center gap-8 px-5 py-12 sm:gap-12 sm:px-8 sm:py-16 lg:min-h-[620px] lg:grid-cols-[0.92fr_1.08fr] lg:gap-16 lg:py-24"
            >
              <div className="min-w-0 max-w-2xl">
                <motion.div variants={heroItemVariants} className="mb-4">
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.1em] text-[#b85028] dark:text-[#eb8b72]">
                    Early software · Useful feedback
                  </span>
                </motion.div>

                <KineticHeadline variants={heroItemVariants} />

                <motion.p
                  variants={heroItemVariants}
                  className="mt-6 max-w-xl text-lg leading-8 text-[var(--text-muted)] sm:text-xl"
                >
                  Put a working prototype in front of the right people. Learn where it helps, where it gets confusing, and what to improve next.
                </motion.p>

                <motion.div
                  variants={heroItemVariants}
                  className="mt-8 flex flex-wrap items-center gap-3"
                >
                  <ActionLink href="/products/new" variant="primary" size="lg">
                    Launch Your Prototype <span aria-hidden="true">→</span>
                  </ActionLink>
                  <ActionLink href="/explore" variant="secondary" size="lg">
                    Explore Products
                  </ActionLink>
                </motion.div>

                <motion.p
                  variants={heroItemVariants}
                  className="mt-7 max-w-xl text-sm leading-relaxed text-[var(--text-subtle)]"
                >
                  Join hundreds of builders and testers turning early prototypes into polished releases.
                </motion.p>
              </div>

              <motion.div variants={heroItemVariants} className="w-full">
                <HeroPrototypeLoopPreview />
              </motion.div>
            </motion.div>
          </section>


          {/* ── Product Spotlight ── */}
          <section id="spotlight" className="py-14 sm:py-18 lg:py-20 border-b border-[var(--border-main)] bg-[var(--bg-page)]">
            <div className="mx-auto max-w-5xl px-5 sm:px-8">
              <SectionHeader
                title="Inspect Active Prototypes"
                description="Review current software listings, testing prompts, and target audiences."
              />
              <ProductSpotlight products={products} />
            </div>
          </section>

          {/* ── Core Platform Architecture Pillars (Vibrant Bento Showcase) ── */}
          <section id="pillars" className="py-14 sm:py-18 lg:py-20 border-b border-[var(--border-main)] bg-[var(--bg-surface)]">
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
              <SectionHeader
                badgeText="The Testing Infrastructure"
                title="Engineered for Thoughtful Feedback"
                description="Explore the live interactive mechanics that connect working prototypes with actionable tester critique."
              />

              <InteractiveBentoShowcase />
            </div>
          </section>

          {/* ── How BuildBoard Works (Step Timeline) ── */}
          <RevealSection
            id="how-it-works"
            className="border-b border-[var(--border-main)] bg-[var(--bg-page)] px-5 py-14 sm:py-18 lg:py-20"
          >
            <div className="mx-auto max-w-7xl">
              <div className="max-w-3xl">
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#d96b43] dark:text-[#eb8b72]">
                  How BuildBoard Works
                </span>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--text-main)]">
                  From working prototype to a better next version.
                </h2>
                <p className="mt-2 text-sm sm:text-base leading-relaxed text-[var(--text-muted)]">
                  A disciplined feedback cycle designed for engineering clarity and honest critique.
                </p>
              </div>

              <HowItWorksTimeline />
            </div>
          </RevealSection>

          {/* ── Community Call to Action ── */}
          <section id="join" className="border-t border-[var(--border-main)] bg-[var(--bg-page)] py-14 sm:py-18 lg:py-20 px-5 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold text-[var(--text-main)] mb-4 leading-tight">
                Ready to launch your prototype?
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-2xl mx-auto mb-8 leading-relaxed">
                Publish your developer tool, web utility, or student project to gather structured feedback from curious early testers.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <ActionLink href="/products/new" variant="primary" size="lg">
                  <span>+ Launch Your Prototype Now</span>
                  <span aria-hidden="true">→</span>
                </ActionLink>
                <ActionLink href="/explore" variant="secondary" size="lg">
                  Explore Active Feed
                </ActionLink>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </MotionConfig>
  )
}
export { LandingPage }
