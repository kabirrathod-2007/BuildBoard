import { useState, useMemo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router'
import { MotionConfig, motion, AnimatePresence } from 'motion/react'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useDemoData } from '../context/DemoDataContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import {
  PROFILE_INTERESTS,
  TARGET_ROLES,
  TARGET_INDUSTRIES,
  TARGET_TECHNOLOGIES,
  EXPERIENCE_LEVELS,
  TESTING_DEVICES,
  FEEDBACK_FOCUS_AREAS,
  AVAILABILITY_HOURS,
  DEFAULT_VIEW_OPTIONS,
  REMINDER_CADENCE_OPTIONS,
} from '../data/targetingOptions.js'

function ProfilePageContent({
  savedProfile,
  onSaveProfile,
  recognition,
  onNavigateExplore,
  userEmail,
  initialEditMode = false,
}) {
  const isExistingProfile = Boolean(savedProfile?.updatedAt || savedProfile?.displayName)
  const { signOut } = useAuth()
  const { theme, setTheme } = useTheme()

  // Navigation tab state
  const [activeTab, setActiveTab] = useState('preferences')

  // Core preferences state
  const [isEditingPreferences, setIsEditingPreferences] = useState(
    initialEditMode || !isExistingProfile
  )

  // Profile preferences
  const [displayName, setDisplayName] = useState(savedProfile?.displayName || '')
  const [participation, setParticipation] = useState(
    savedProfile?.participation || ['tester']
  )
  const [experienceLevel, setExperienceLevel] = useState(
    savedProfile?.experienceLevel || ''
  )
  const [interests, setInterests] = useState(savedProfile?.interests || [])
  const [roles, setRoles] = useState(savedProfile?.roles || [])
  const [industries, setIndustries] = useState(savedProfile?.industries || [])
  const [technologies, setTechnologies] = useState(
    savedProfile?.technologies || []
  )
  const [testingDevices, setTestingDevices] = useState(
    savedProfile?.testingDevices || ['Chrome / Web Browser', 'macOS (Apple Silicon / Intel)']
  )
  const [feedbackFocus, setFeedbackFocus] = useState(
    savedProfile?.feedbackFocus || ['UI & Visual Polish', 'UX Flows & Navigation']
  )
  const [availability, setAvailability] = useState(
    savedProfile?.availability || '3-5 hours / week'
  )

  // Account & identity settings
  const [handle, setHandle] = useState(savedProfile?.handle || '')
  const [bio, setBio] = useState(savedProfile?.bio || '')
  const [location, setLocation] = useState(savedProfile?.location || '')
  const [website, setWebsite] = useState(savedProfile?.website || '')
  const [github, setGithub] = useState(savedProfile?.github || '')
  const [twitter, setTwitter] = useState(savedProfile?.twitter || '')
  const [linkedin, setLinkedin] = useState(savedProfile?.linkedin || '')
  const [defaultLandingView, setDefaultLandingView] = useState(
    savedProfile?.defaultLandingView || 'explore'
  )

  // Notification & reminder settings
  const [reminderCadence, setReminderCadence] = useState(
    savedProfile?.reminderCadence || 'standard'
  )
  const [notifyBuilderReplies, setNotifyBuilderReplies] = useState(
    savedProfile?.notifyBuilderReplies ?? true
  )
  const [notifyHelpfulNotes, setNotifyHelpfulNotes] = useState(
    savedProfile?.notifyHelpfulNotes ?? true
  )
  const [notifyWeeklyDigest, setNotifyWeeklyDigest] = useState(
    savedProfile?.notifyWeeklyDigest ?? true
  )
  const [soundEffects, setSoundEffects] = useState(
    savedProfile?.soundEffects ?? true
  )

  // Appearance settings
  const [cardDensity, setCardDensity] = useState(
    savedProfile?.cardDensity || 'comfortable'
  )

  // Banner status
  const [savedSuccessMessage, setSavedSuccessMessage] = useState('')

  // Derive role-aware status from participation choices
  const hasBuilder = participation.includes('builder')
  const hasTester = participation.includes('tester')

  let roleLabel = 'tester'
  if (hasBuilder && hasTester) {
    roleLabel = 'builder & tester'
  } else if (hasBuilder) {
    roleLabel = 'builder'
  } else if (hasTester) {
    roleLabel = 'tester'
  }

  const effectiveDisplayName =
    displayName.trim() || (userEmail ? userEmail.split('@')[0] : 'Member')
  const userInitial = effectiveDisplayName.charAt(0).toUpperCase()
  const effectiveHandle = handle.trim() ? `@${handle.replace(/^@/, '')}` : `@${userEmail ? userEmail.split('@')[0] : 'member'}`

  const toggleArrayItem = (setter, item) => {
    setter((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    )
    setSavedSuccessMessage('')
  }

  const handleSavePreferences = (e) => {
    if (e) e.preventDefault()
    const updatedData = {
      ...(savedProfile || {}),
      displayName: effectiveDisplayName,
      participation,
      experienceLevel,
      interests,
      roles,
      industries,
      technologies,
      testingDevices,
      feedbackFocus,
      availability,
      handle,
      bio,
      location,
      website,
      github,
      twitter,
      linkedin,
      defaultLandingView,
      reminderCadence,
      notifyBuilderReplies,
      notifyHelpfulNotes,
      notifyWeeklyDigest,
      soundEffects,
      cardDensity,
    }

    onSaveProfile(updatedData)
    // CRITICAL: Preferences form vanishes upon saving, leaving the clean summary and an Edit button!
    setIsEditingPreferences(false)
    setSavedSuccessMessage('Profile preferences saved successfully! Explore recommendations will immediately prioritize your updated criteria.')
  }

  const handleSaveAccountSettings = (e) => {
    if (e) e.preventDefault()
    const updatedData = {
      ...(savedProfile || {}),
      displayName: effectiveDisplayName,
      handle,
      bio,
      location,
      website,
      github,
      twitter,
      linkedin,
      defaultLandingView,
      participation,
      experienceLevel,
      interests,
      roles,
      industries,
      technologies,
      testingDevices,
      feedbackFocus,
      availability,
      reminderCadence,
      notifyBuilderReplies,
      notifyHelpfulNotes,
      notifyWeeklyDigest,
      soundEffects,
      cardDensity,
    }
    onSaveProfile(updatedData)
    setSavedSuccessMessage('Account and profile details saved successfully.')
  }

  const handleSaveNotificationSettings = (e) => {
    if (e) e.preventDefault()
    const updatedData = {
      ...(savedProfile || {}),
      reminderCadence,
      notifyBuilderReplies,
      notifyHelpfulNotes,
      notifyWeeklyDigest,
      soundEffects,
    }
    onSaveProfile(updatedData)
    setSavedSuccessMessage('Notification and reminder preferences saved.')
  }

  const handleSaveAppearance = (newTheme, newDensity) => {
    if (newTheme) setTheme(newTheme)
    if (newDensity) setCardDensity(newDensity)
    const updatedData = {
      ...(savedProfile || {}),
      cardDensity: newDensity || cardDensity,
    }
    onSaveProfile(updatedData)
    setSavedSuccessMessage('Display and theme preferences updated.')
  }

  const handleCancelEditing = () => {
    // Revert state back to current savedProfile
    if (savedProfile) {
      setDisplayName(savedProfile.displayName || '')
      setParticipation(savedProfile.participation || ['tester'])
      setExperienceLevel(savedProfile.experienceLevel || '')
      setInterests(savedProfile.interests || [])
      setRoles(savedProfile.roles || [])
      setIndustries(savedProfile.industries || [])
      setTechnologies(savedProfile.technologies || [])
      setTestingDevices(savedProfile.testingDevices || ['Chrome / Web Browser', 'macOS (Apple Silicon / Intel)'])
      setFeedbackFocus(savedProfile.feedbackFocus || ['UI & Visual Polish', 'UX Flows & Navigation'])
      setAvailability(savedProfile.availability || '3-5 hours / week')
    }
    setIsEditingPreferences(false)
  }

  const handleExportData = () => {
    try {
      const dataToExport = {
        exportedAt: new Date().toISOString(),
        profile: savedProfile || {},
        userEmail,
        recognition,
        notes: 'Exported from BuildBoard Member Profile',
      }
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `buildboard-profile-${(userEmail ? userEmail.split('@')[0] : 'member')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed', err)
    }
  }

  const handleResetProfile = () => {
    if (window.confirm('Reset your profile preferences and settings back to clean state?')) {
      const reset = {
        displayName: userEmail ? userEmail.split('@')[0] : 'Member',
        participation: ['tester'],
        experienceLevel: '',
        interests: [],
        roles: [],
        industries: [],
        technologies: [],
        testingDevices: ['Chrome / Web Browser'],
        feedbackFocus: ['UI & Visual Polish'],
        availability: '1-2 hours / week',
        handle: '',
        bio: '',
        location: '',
        website: '',
        github: '',
        twitter: '',
        linkedin: '',
        defaultLandingView: 'explore',
        reminderCadence: 'standard',
        notifyBuilderReplies: true,
        notifyHelpfulNotes: true,
        notifyWeeklyDigest: true,
        soundEffects: true,
        cardDensity: 'comfortable',
      }
      onSaveProfile(reset)
      setIsEditingPreferences(true)
      setSavedSuccessMessage('Profile has been reset to defaults.')
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:py-14 space-y-8 sm:space-y-10">
      {/* 1. Profile Header with Avatar, Details, and Quick Actions */}
      <section aria-labelledby="profile-heading" className="space-y-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4 sm:gap-5">
            <div
              className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d96b43]/20 to-[#d96b43]/5 border border-[#d96b43]/30 font-display text-2xl sm:text-3xl font-extrabold text-[#d96b43] shadow-warm-sm"
              aria-hidden="true"
            >
              {userInitial}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#d96b43]/10 border border-[#d96b43]/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-[#d96b43]">
                  {isExistingProfile ? 'Verified Profile' : 'New Member Setup'}
                </span>
                <span className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-subtle)]">
                  Active role: <strong className="text-[var(--text-main)] capitalize">{roleLabel}</strong>
                </span>
                {location && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs text-[var(--text-subtle)]">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {location}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-baseline gap-2.5">
                <h1
                  id="profile-heading"
                  className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-main)]"
                >
                  {effectiveDisplayName}
                </h1>
                <span className="font-mono text-sm font-medium text-[#d96b43]">
                  {effectiveHandle}
                </span>
              </div>

              {bio ? (
                <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">
                  {bio}
                </p>
              ) : (
                <p className="font-mono text-xs text-[var(--text-muted)]">
                  {userEmail}
                </p>
              )}

              {/* Social / Portfolio links if present */}
              {(website || github || twitter || linkedin) && (
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  {website && (
                    <a
                      href={website.startsWith('http') ? website : `https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-[#d96b43] hover:underline"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      Portfolio
                    </a>
                  )}
                  {github && (
                    <a
                      href={github.startsWith('http') ? github : `https://github.com/${github.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                        <path d="M9 18c-4.51 2-5-2-7-2" />
                      </svg>
                      GitHub
                    </a>
                  )}
                  {twitter && (
                    <a
                      href={twitter.startsWith('http') ? twitter : `https://x.com/${twitter.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    >
                      <span className="font-bold">𝕏</span> {twitter.replace(/^@/, '')}
                    </a>
                  )}
                  {linkedin && (
                    <a
                      href={linkedin.startsWith('http') ? linkedin : `https://linkedin.com/in/${linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            <Link
              to="/explore"
              className="min-h-[38px] inline-flex items-center rounded-full bg-[#1b241e] px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-warm-xs transition hover:bg-[#2e3b32] dark:bg-[#fbfaf7] dark:text-[#0b100c]"
            >
              Explore Prototypes →
            </Link>
          </div>
        </div>

        {/* Save Confirmation Toast Banner */}
        <AnimatePresence>
          {savedSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              role="status"
              className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:p-5 text-[var(--text-main)] shadow-warm-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <div>
                    <h2 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                      {savedSuccessMessage}
                    </h2>
                    <p className="mt-0.5 text-xs sm:text-sm text-[var(--text-muted)]">
                      Your changes are saved locally in this browser. Explore recommendations will reflect these preferences immediately.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSavedSuccessMessage('')}
                  aria-label="Dismiss message"
                  className="rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tester Recognition Overview Card */}
        <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] p-4 sm:p-5 text-[var(--text-main)] shadow-warm-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d96b43]/15 text-[#d96b43]">
                <svg className="h-5 w-5 text-[#d96b43]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#d96b43]">
                  Tester Recognition
                </p>
                <p className="text-base sm:text-lg font-display font-semibold tracking-tight text-[var(--text-main)]">
                  {recognition.totalPoints} {recognition.totalPoints === 1 ? 'Helpful Point' : 'Helpful Points'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to="/tester/activity"
                className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-4 py-1.5 text-xs sm:text-sm font-semibold text-[#d96b43] shadow-warm-xs hover:bg-[var(--bg-surface-subtle)] transition-colors"
              >
                View Tester Studio & enrolled builds →
              </Link>
              <span className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--text-subtle)]">
                Awarded by builders for helpful feedback
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Top Navigation Tabs: Preferences, Account, Notifications, Appearance, Data */}
      <div className="border-b border-[var(--border-main)] pb-0">
        <nav
          aria-label="Profile navigation"
          className="flex gap-2 sm:gap-4 overflow-x-auto no-scrollbar"
        >
          {[
            { id: 'preferences', label: 'Preferences & Matching', icon: 'M12 6V4m0 16v-2m8-8h2M4 12H2m15.364-5.364l1.414-1.414M5.222 18.778l1.414-1.414m0-10.748L5.222 5.202m13.556 13.576l-1.414-1.414' },
            { id: 'account', label: 'Account & Identity', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
            { id: 'notifications', label: 'Notifications & Alerts', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
            { id: 'appearance', label: 'Display & Theme', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' },
            { id: 'data', label: 'Data & Privacy', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id)
                  setSavedSuccessMessage('')
                }}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition cursor-pointer ${
                  isActive
                    ? 'border-[#d96b43] text-[#d96b43]'
                    : 'border-transparent text-[var(--text-muted)] hover:border-[var(--border-main)] hover:text-[var(--text-main)]'
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PREFERENCES & MATCHING                                             */}
      {/* ========================================================================= */}
      {activeTab === 'preferences' && (
        <div className="space-y-8">
          {/* If NOT editing: Render the clean, vanished-state SUMMARY with Edit button */}
          {!isEditingPreferences ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Summary Header with Prominent "Edit Preferences" Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-warm-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Active Matching Profile
                    </span>
                  </div>
                  <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-[var(--text-main)]">
                    Saved Matching Preferences
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)] max-w-xl">
                    Your preferences are currently hidden from edit mode. Explore prototype recommendations are actively tuned to these criteria.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPreferences(true)
                      setSavedSuccessMessage('')
                    }}
                    className="min-h-[46px] inline-flex items-center gap-2 rounded-full bg-[#d96b43] px-6 py-2.5 text-sm font-semibold text-white shadow-warm-sm transition hover:bg-[#b85028] active:translate-y-0.5 cursor-pointer"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    Edit Preferences
                  </button>
                  <button
                    type="button"
                    onClick={onNavigateExplore}
                    className="min-h-[46px] rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--text-main)] shadow-warm-xs hover:bg-[var(--bg-surface-subtle)] transition cursor-pointer"
                  >
                    Explore Matches →
                  </button>
                </div>
              </div>

              {/* Preferences Grid Summary Cards */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* 1. Roles, Experience & Availability */}
                <div className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 shadow-warm-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
                    <h3 className="font-display text-base font-bold text-[var(--text-main)]">
                      Participation & Experience
                    </h3>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#d96b43]">
                      Role & Level
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                        Platform Role
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {participation.map((part) => (
                          <span
                            key={part}
                            className="inline-flex items-center rounded-full bg-[#d96b43]/10 border border-[#d96b43]/30 px-3 py-1 text-xs font-bold capitalize text-[#d96b43]"
                          >
                            {part === 'builder' ? 'Product Builder' : 'Prototype Tester'}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                        Testing Comfort Level
                      </span>
                      <p className="mt-1 text-sm font-medium text-[var(--text-main)]">
                        {experienceLevel || 'Not specified (Beginner friendly)'}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                        Weekly Availability
                      </span>
                      <p className="mt-1 text-sm font-medium text-[var(--text-main)]">
                        {availability}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Devices & Testing Focus */}
                <div className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 shadow-warm-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
                    <h3 className="font-display text-base font-bold text-[var(--text-main)]">
                      Devices & Testing Focus
                    </h3>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#d96b43]">
                      Environment
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                        Test Platforms & Operating Systems
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {testingDevices.length > 0 ? (
                          testingDevices.map((dev) => (
                            <span
                              key={dev}
                              className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-main)]"
                            >
                              {dev}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">Any device</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                        Preferred Feedback Focus Areas
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {feedbackFocus.length > 0 ? (
                          feedbackFocus.map((focus) => (
                            <span
                              key={focus}
                              className="rounded-full bg-[#1b241e]/5 dark:bg-white/5 border border-[var(--border-main)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-main)]"
                            >
                              {focus}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">General usability</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Product Interests & Categories */}
                <div className="md:col-span-2 rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-warm-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
                    <div>
                      <h3 className="font-display text-lg font-bold text-[var(--text-main)]">
                        Product Interests & Preferred Categories
                      </h3>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                        Prototypes in these spaces receive primary boost in your recommendation feed.
                      </p>
                    </div>
                    <span className="rounded-full bg-[#d96b43]/10 px-3 py-1 text-xs font-bold text-[#d96b43]">
                      {interests.length} Categories Selected
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {interests.length > 0 ? (
                      interests.map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#d96b43]/40 bg-[#d96b43]/10 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-[#d96b43]"
                        >
                          <svg className="h-3 w-3 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {cat}
                        </span>
                      ))
                    ) : (
                      <div className="py-4 text-center sm:text-left text-sm text-[var(--text-muted)]">
                        No categories selected. Click &quot;Edit Preferences&quot; to pick product spaces.
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Target Roles & Industries */}
                <div className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 shadow-warm-sm space-y-4">
                  <h3 className="font-display text-base font-bold text-[var(--text-main)] border-b border-[var(--border-main)] pb-3">
                    Matching Professional Roles ({roles.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {roles.length > 0 ? (
                      roles.map((r) => (
                        <span
                          key={r}
                          className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--text-main)]"
                        >
                          {r}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">No roles specified</span>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 shadow-warm-sm space-y-4">
                  <h3 className="font-display text-base font-bold text-[var(--text-main)] border-b border-[var(--border-main)] pb-3">
                    Target Industries & Verticals ({industries.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {industries.length > 0 ? (
                      industries.map((ind) => (
                        <span
                          key={ind}
                          className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--text-main)]"
                        >
                          {ind}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">No industries specified</span>
                    )}
                  </div>
                </div>

                {/* 5. Tooling & Technologies */}
                <div className="md:col-span-2 rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-warm-sm space-y-4">
                  <h3 className="font-display text-base font-bold text-[var(--text-main)] border-b border-[var(--border-main)] pb-3">
                    Tools, Frameworks & Stacks ({technologies.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {technologies.length > 0 ? (
                      technologies.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-3 py-1 text-xs sm:text-sm font-medium text-[var(--text-main)]"
                        >
                          {tech}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">No tech stacks specified</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* If EDITING: Render the full interactive editor form */
            <motion.form
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSavePreferences}
              className="space-y-10"
            >
              {/* Form Action Banner */}
              <div className="sticky top-20 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#d96b43]/30 bg-[var(--bg-surface)]/95 p-4 shadow-warm-md backdrop-blur">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-3 w-3 rounded-full bg-[#d96b43]" />
                  <span className="text-sm font-bold text-[var(--text-main)]">
                    Editing Matching Preferences
                  </span>
                  <span className="text-xs text-[var(--text-muted)] hidden sm:inline">
                    — Changes will vanish into saved view upon save
                  </span>
                </div>
                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  {isExistingProfile && (
                    <button
                      type="button"
                      onClick={handleCancelEditing}
                      className="min-h-[38px] rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-4 py-1.5 text-xs sm:text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-main)] transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="min-h-[38px] rounded-full bg-[#d96b43] px-6 py-1.5 text-xs sm:text-sm font-bold text-white shadow-warm-sm transition hover:bg-[#b85028] cursor-pointer"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>

              {/* Section: Community Identity & Roles */}
              <section className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-warm-sm space-y-6">
                <div className="border-b border-[var(--border-main)] pb-4">
                  <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-main)]">
                    1. Participation Roles
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Choose how you participate in BuildBoard. You can be both a builder and a tester on one account.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label
                    className={`flex items-start gap-3.5 rounded-2xl border p-4 sm:p-5 transition cursor-pointer select-none ${
                      participation.includes('builder')
                        ? 'border-[#d96b43] bg-[#d96b43]/10 dark:bg-[#d96b43]/20 text-[var(--text-main)] shadow-warm-xs'
                        : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="participation"
                      value="builder"
                      checked={participation.includes('builder')}
                      onChange={() => toggleArrayItem(setParticipation, 'builder')}
                      className="mt-1 h-4 w-4 rounded accent-[#d96b43] cursor-pointer"
                    />
                    <div>
                      <span className="block font-display text-base font-bold text-[var(--text-main)]">
                        I build products (Builder)
                      </span>
                      <span className="mt-1 block text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                        Publish prototypes, gather structured feedback, and award helpful points to testers.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3.5 rounded-2xl border p-4 sm:p-5 transition cursor-pointer select-none ${
                      participation.includes('tester')
                        ? 'border-[#d96b43] bg-[#d96b43]/10 dark:bg-[#d96b43]/20 text-[var(--text-main)] shadow-warm-xs'
                        : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="participation"
                      value="tester"
                      checked={participation.includes('tester')}
                      onChange={() => toggleArrayItem(setParticipation, 'tester')}
                      className="mt-1 h-4 w-4 rounded accent-[#d96b43] cursor-pointer"
                    />
                    <div>
                      <span className="block font-display text-base font-bold text-[var(--text-main)]">
                        I test products (Tester)
                      </span>
                      <span className="mt-1 block text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                        Test new prototypes, submit structured critique, and gain reputation in the community.
                      </span>
                    </div>
                  </label>
                </div>
              </section>

              {/* Section: Testing Experience & Availability */}
              <section className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-warm-sm space-y-6">
                <div className="border-b border-[var(--border-main)] pb-4">
                  <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-main)]">
                    2. Testing Comfort & Availability
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Helps builders match tests with suitable depth of review.
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <span className="block text-sm font-bold uppercase tracking-wider text-[var(--text-main)] mb-2">
                      Experience Level
                    </span>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {EXPERIENCE_LEVELS.map((level) => {
                        const checked = experienceLevel === level
                        return (
                          <label
                            key={level}
                            className={`flex flex-col justify-between rounded-2xl border p-4 transition cursor-pointer select-none ${
                              checked
                                ? 'border-[#d96b43] bg-[#d96b43]/10 dark:bg-[#d96b43]/20 text-[var(--text-main)] shadow-warm-xs'
                                : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-display text-sm font-bold text-[var(--text-main)]">
                                {level.split('(')[0].trim()}
                              </span>
                              <input
                                type="radio"
                                name="experienceLevel"
                                value={level}
                                checked={checked}
                                onChange={() => setExperienceLevel(level)}
                                className="mt-0.5 h-4 w-4 accent-[#d96b43] cursor-pointer"
                              />
                            </div>
                            <span className="mt-2 block text-xs text-[var(--text-muted)] leading-relaxed">
                              {level.includes('(') ? `(${level.split('(')[1]}` : ''}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <span className="block text-sm font-bold uppercase tracking-wider text-[var(--text-main)] mb-2">
                      Weekly Availability
                    </span>
                    <div className="grid gap-2.5 sm:grid-cols-4">
                      {AVAILABILITY_HOURS.map((hours) => {
                        const checked = availability === hours
                        return (
                          <button
                            key={hours}
                            type="button"
                            onClick={() => setAvailability(hours)}
                            className={`rounded-2xl border p-3 text-left transition cursor-pointer ${
                              checked
                                ? 'border-[#d96b43] bg-[#d96b43]/10 text-[#d96b43] font-bold shadow-warm-xs'
                                : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)]'
                            }`}
                          >
                            <span className="text-xs sm:text-sm font-medium">{hours}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </section>

              {/* Section: Product Interests & Categories (Enriched) */}
              <section className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-warm-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-main)] pb-4">
                  <div>
                    <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-main)]">
                      3. Product Interests & Categories
                    </h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      Choose categories you love testing. Recommendations on Explore prioritize these spaces.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#d96b43]/10 px-3 py-1 text-xs font-bold text-[#d96b43]">
                      {interests.length} selected
                    </span>
                    {interests.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setInterests([])}
                        className="text-xs font-semibold text-[var(--text-muted)] hover:text-[#d96b43] transition cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {PROFILE_INTERESTS.map((interest) => {
                    const checked = interests.includes(interest)
                    return (
                      <label
                        key={interest}
                        className={`min-h-[46px] flex items-center justify-between rounded-2xl border px-3.5 py-2.5 transition cursor-pointer select-none ${
                          checked
                            ? 'border-[#d96b43] bg-[#d96b43]/10 dark:bg-[#d96b43]/20 text-[var(--text-main)] font-bold shadow-warm-xs'
                            : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        <span className="text-sm font-medium text-[var(--text-main)]">
                          {interest}
                        </span>
                        <input
                          type="checkbox"
                          name="interests"
                          value={interest}
                          checked={checked}
                          onChange={() => toggleArrayItem(setInterests, interest)}
                          className="h-4 w-4 rounded accent-[#d96b43] cursor-pointer"
                        />
                      </label>
                    )
                  })}
                </div>
              </section>

              {/* Section: Testing Devices & Feedback Focus */}
              <section className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-warm-sm space-y-6">
                <div className="border-b border-[var(--border-main)] pb-4">
                  <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-main)]">
                    4. Devices & Feedback Focus
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Specify what platforms you test on and what type of critique you prefer giving.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <span className="block text-sm font-bold uppercase tracking-wider text-[var(--text-main)] mb-3">
                      Testing Devices & OS
                    </span>
                    <div className="space-y-2">
                      {TESTING_DEVICES.map((device) => {
                        const checked = testingDevices.includes(device)
                        return (
                          <label
                            key={device}
                            className={`flex items-center justify-between rounded-xl border px-3.5 py-2 transition cursor-pointer ${
                              checked
                                ? 'border-[#d96b43] bg-[#d96b43]/10 font-semibold text-[var(--text-main)]'
                                : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)]'
                            }`}
                          >
                            <span className="text-xs sm:text-sm">{device}</span>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleArrayItem(setTestingDevices, device)}
                              className="h-4 w-4 rounded accent-[#d96b43]"
                            />
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <span className="block text-sm font-bold uppercase tracking-wider text-[var(--text-main)] mb-3">
                      Feedback Specialty
                    </span>
                    <div className="space-y-2">
                      {FEEDBACK_FOCUS_AREAS.map((focus) => {
                        const checked = feedbackFocus.includes(focus)
                        return (
                          <label
                            key={focus}
                            className={`flex items-center justify-between rounded-xl border px-3.5 py-2 transition cursor-pointer ${
                              checked
                                ? 'border-[#d96b43] bg-[#d96b43]/10 font-semibold text-[var(--text-main)]'
                                : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)]'
                            }`}
                          >
                            <span className="text-xs sm:text-sm">{focus}</span>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleArrayItem(setFeedbackFocus, focus)}
                              className="h-4 w-4 rounded accent-[#d96b43]"
                            />
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </section>

              {/* Section: Professional Roles */}
              <section className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-warm-sm space-y-6">
                <div className="border-b border-[var(--border-main)] pb-4">
                  <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-main)]">
                    5. Roles & Background
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Connects you with products tailored to specific professions or workflows.
                  </p>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  {TARGET_ROLES.map((role) => {
                    const checked = roles.includes(role)
                    return (
                      <label
                        key={role}
                        className={`min-h-[46px] flex items-center justify-between rounded-2xl border px-3.5 py-2.5 transition cursor-pointer select-none ${
                          checked
                            ? 'border-[#d96b43] bg-[#d96b43]/10 dark:bg-[#d96b43]/20 text-[var(--text-main)] font-bold shadow-warm-xs'
                            : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        <span className="text-sm font-medium text-[var(--text-main)]">{role}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleArrayItem(setRoles, role)}
                          className="h-4 w-4 rounded accent-[#d96b43] cursor-pointer"
                        />
                      </label>
                    )
                  })}
                </div>
              </section>

              {/* Section: Industries & Domains */}
              <section className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-warm-sm space-y-6">
                <div className="border-b border-[var(--border-main)] pb-4">
                  <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-main)]">
                    6. Industries & Domains
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Select verticals you understand well.
                  </p>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  {TARGET_INDUSTRIES.map((ind) => {
                    const checked = industries.includes(ind)
                    return (
                      <label
                        key={ind}
                        className={`min-h-[46px] flex items-center justify-between rounded-2xl border px-3.5 py-2.5 transition cursor-pointer select-none ${
                          checked
                            ? 'border-[#d96b43] bg-[#d96b43]/10 dark:bg-[#d96b43]/20 text-[var(--text-main)] font-bold shadow-warm-xs'
                            : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        <span className="text-sm font-medium text-[var(--text-main)]">{ind}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleArrayItem(setIndustries, ind)}
                          className="h-4 w-4 rounded accent-[#d96b43] cursor-pointer"
                        />
                      </label>
                    )
                  })}
                </div>
              </section>

              {/* Section: Technologies & Tools */}
              <section className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-warm-sm space-y-6">
                <div className="border-b border-[var(--border-main)] pb-4">
                  <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-main)]">
                    7. Technologies & Tools
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Match developer software and tooling prototypes with your technical stack.
                  </p>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {TARGET_TECHNOLOGIES.map((tech) => {
                    const checked = technologies.includes(tech)
                    return (
                      <label
                        key={tech}
                        className={`min-h-[46px] flex items-center justify-between rounded-2xl border px-3.5 py-2.5 transition cursor-pointer select-none ${
                          checked
                            ? 'border-[#d96b43] bg-[#d96b43]/10 dark:bg-[#d96b43]/20 text-[var(--text-main)] font-bold shadow-warm-xs'
                            : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        <span className="text-sm font-medium text-[var(--text-main)]">{tech}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleArrayItem(setTechnologies, tech)}
                          className="h-4 w-4 rounded accent-[#d96b43] cursor-pointer"
                        />
                      </label>
                    )
                  })}
                </div>
              </section>

              {/* Bottom Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[var(--border-main)]">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <button
                    type="submit"
                    className="min-h-[48px] rounded-full bg-[#d96b43] px-8 py-3 text-sm font-semibold text-white shadow-warm-sm transition hover:bg-[#b85028] active:translate-y-0.5 cursor-pointer"
                  >
                    Save profile preferences
                  </button>
                  {isExistingProfile && (
                    <button
                      type="button"
                      onClick={handleCancelEditing}
                      className="min-h-[48px] rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-6 py-3 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-main)] transition cursor-pointer"
                    >
                      Cancel without saving
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onNavigateExplore}
                  className="text-sm font-semibold text-[var(--text-muted)] hover:text-[#d96b43] transition cursor-pointer"
                >
                  Return to Explore
                </button>
              </div>
            </motion.form>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ACCOUNT & IDENTITY                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'account' && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSaveAccountSettings}
          className="space-y-8"
        >
          {/* Identity & Public Details */}
          <div className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-warm-sm space-y-6">
            <div className="border-b border-[var(--border-main)] pb-4">
              <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-main)]">
                Account & Public Profile
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Manage how you appear across BuildBoard listings, critiques, and builder replies.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="account-display-name" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                  Display Name <span className="text-[#d96b43]">*</span>
                </label>
                <input
                  id="account-display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  required
                  className="mt-2 w-full min-h-[44px] rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] px-4 py-2 text-sm text-[var(--text-main)] outline-none transition focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20"
                />
              </div>

              <div>
                <label htmlFor="account-handle" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                  Handle / Username
                </label>
                <div className="relative mt-2">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-semibold text-[var(--text-muted)]">
                    @
                  </span>
                  <input
                    id="account-handle"
                    type="text"
                    value={handle.replace(/^@/, '')}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="alexrivera"
                    className="w-full min-h-[44px] rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] pl-8 pr-4 py-2 text-sm text-[var(--text-main)] outline-none transition focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="account-bio" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                  Short Bio / Headline
                </label>
                <textarea
                  id="account-bio"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Full-stack engineer & indie hacker. Love testing dev tools & productivity prototypes."
                  className="mt-2 w-full rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20"
                />
              </div>

              <div>
                <label htmlFor="account-location" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                  Location (City, Country or Remote)
                </label>
                <input
                  id="account-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="San Francisco, CA or Remote"
                  className="mt-2 w-full min-h-[44px] rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] px-4 py-2 text-sm text-[var(--text-main)] outline-none transition focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20"
                />
              </div>

              <div>
                <label htmlFor="account-email" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                  Contact Email
                </label>
                <input
                  id="account-email"
                  type="email"
                  value={userEmail}
                  disabled
                  className="mt-2 w-full min-h-[44px] rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-4 py-2 text-sm text-[var(--text-muted)] cursor-not-allowed font-mono"
                />
              </div>
            </div>
          </div>

          {/* Social Links & Portfolio */}
          <div className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-warm-sm space-y-6">
            <div className="border-b border-[var(--border-main)] pb-4">
              <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-main)]">
                Portfolio & Social Profiles
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Add links so builders can learn more about your technical background and previous work.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="link-website" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                  Website / Portfolio URL
                </label>
                <input
                  id="link-website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://myportfolio.example"
                  className="mt-2 w-full min-h-[44px] rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] px-4 py-2 text-sm text-[var(--text-main)] outline-none transition focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20"
                />
              </div>

              <div>
                <label htmlFor="link-github" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                  GitHub Profile
                </label>
                <input
                  id="link-github"
                  type="text"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="e.g. octocat or https://github.com/..."
                  className="mt-2 w-full min-h-[44px] rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] px-4 py-2 text-sm text-[var(--text-main)] outline-none transition focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20"
                />
              </div>

              <div>
                <label htmlFor="link-twitter" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                  𝕏 / Twitter Username
                </label>
                <input
                  id="link-twitter"
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="e.g. alex_builds"
                  className="mt-2 w-full min-h-[44px] rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] px-4 py-2 text-sm text-[var(--text-main)] outline-none transition focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20"
                />
              </div>

              <div>
                <label htmlFor="link-linkedin" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                  LinkedIn URL or Handle
                </label>
                <input
                  id="link-linkedin"
                  type="text"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="e.g. https://linkedin.com/in/alex"
                  className="mt-2 w-full min-h-[44px] rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] px-4 py-2 text-sm text-[var(--text-main)] outline-none transition focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20"
                />
              </div>
            </div>
          </div>

          {/* Default App Landing Page */}
          <div className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-warm-sm space-y-4">
            <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-main)]">
              Default Landing View
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Choose which page opens first when you return to BuildBoard:
            </p>

            <div className="grid gap-3 sm:grid-cols-3 pt-2">
              {DEFAULT_VIEW_OPTIONS.map((opt) => {
                const checked = defaultLandingView === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDefaultLandingView(opt.value)}
                    className={`rounded-2xl border p-4 text-left transition cursor-pointer ${
                      checked
                        ? 'border-[#d96b43] bg-[#d96b43]/10 font-bold text-[var(--text-main)] shadow-warm-xs'
                        : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)]'
                    }`}
                  >
                    <span className="block text-sm font-bold text-[var(--text-main)]">
                      {opt.value === 'explore' ? 'Explore Feed' : opt.value === 'activity' ? 'Tester Activity' : 'Builder Studio'}
                    </span>
                    <span className="mt-1 block text-xs text-[var(--text-muted)]">
                      {opt.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="min-h-[48px] rounded-full bg-[#d96b43] px-8 py-3 text-sm font-semibold text-white shadow-warm-sm transition hover:bg-[#b85028] cursor-pointer"
            >
              Save Account Settings
            </button>
          </div>
        </motion.form>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: NOTIFICATIONS & REMINDERS                                          */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSaveNotificationSettings}
          className="space-y-8"
        >
          {/* Feedback Reminder Schedule */}
          <div className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-warm-sm space-y-5">
            <div className="border-b border-[var(--border-main)] pb-4">
              <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-main)]">
                Feedback Reminder Cadence
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                BuildBoard reminds you to submit feedback after you enroll in a prototype so makers get timely critique.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {REMINDER_CADENCE_OPTIONS.map((cadence) => {
                const checked = reminderCadence === cadence.value
                return (
                  <label
                    key={cadence.value}
                    className={`flex flex-col justify-between rounded-2xl border p-4 transition cursor-pointer select-none ${
                      checked
                        ? 'border-[#d96b43] bg-[#d96b43]/10 text-[var(--text-main)] shadow-warm-xs'
                        : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-display text-sm font-bold text-[var(--text-main)]">
                        {cadence.label}
                      </span>
                      <input
                        type="radio"
                        name="reminderCadence"
                        value={cadence.value}
                        checked={checked}
                        onChange={() => setReminderCadence(cadence.value)}
                        className="mt-0.5 h-4 w-4 accent-[#d96b43] cursor-pointer"
                      />
                    </div>
                    <span className="mt-2 text-xs text-[var(--text-muted)]">
                      {cadence.desc}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Email & Web Alerts Simulation */}
          <div className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-warm-sm space-y-5">
            <div className="border-b border-[var(--border-main)] pb-4">
              <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-main)]">
                Notification Channels
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Configure notifications for builder replies and prototype discoveries.
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-4 transition cursor-pointer hover:bg-[var(--bg-surface-subtle)]">
                <div>
                  <span className="block font-semibold text-sm text-[var(--text-main)]">
                    Builder Reply Notifications
                  </span>
                  <span className="block text-xs text-[var(--text-muted)] mt-0.5">
                    Receive alert when a product creator replies to your feedback note.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyBuilderReplies}
                  onChange={(e) => setNotifyBuilderReplies(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded accent-[#d96b43] cursor-pointer"
                />
              </label>

              <label className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-4 transition cursor-pointer hover:bg-[var(--bg-surface-subtle)]">
                <div>
                  <span className="block font-semibold text-sm text-[var(--text-main)]">
                    Helpful Recognition Badges
                  </span>
                  <span className="block text-xs text-[var(--text-muted)] mt-0.5">
                    Notify when your critique earns a helpful recognition point from a builder.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyHelpfulNotes}
                  onChange={(e) => setNotifyHelpfulNotes(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded accent-[#d96b43] cursor-pointer"
                />
              </label>

              <label className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-4 transition cursor-pointer hover:bg-[var(--bg-surface-subtle)]">
                <div>
                  <span className="block font-semibold text-sm text-[var(--text-main)]">
                    Weekly Prototype Digest
                  </span>
                  <span className="block text-xs text-[var(--text-muted)] mt-0.5">
                    Curated weekly summary of newly listed prototypes matching your categories.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyWeeklyDigest}
                  onChange={(e) => setNotifyWeeklyDigest(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded accent-[#d96b43] cursor-pointer"
                />
              </label>

              <label className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-4 transition cursor-pointer hover:bg-[var(--bg-surface-subtle)]">
                <div>
                  <span className="block font-semibold text-sm text-[var(--text-main)]">
                    UI Sound Effects & Audio Cues
                  </span>
                  <span className="block text-xs text-[var(--text-muted)] mt-0.5">
                    Play gentle confirmation cues when submitting feedback or changing modes.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={soundEffects}
                  onChange={(e) => setSoundEffects(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded accent-[#d96b43] cursor-pointer"
                />
              </label>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="min-h-[48px] rounded-full bg-[#d96b43] px-8 py-3 text-sm font-semibold text-white shadow-warm-sm transition hover:bg-[#b85028] cursor-pointer"
            >
              Save Notification Preferences
            </button>
          </div>
        </motion.form>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: APPEARANCE & DISPLAY                                               */}
      {/* ========================================================================= */}
      {activeTab === 'appearance' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Theme Selector */}
          <div className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-warm-sm space-y-6">
            <div className="border-b border-[var(--border-main)] pb-4">
              <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-main)]">
                Theme & Color Palette
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Choose between warm studio cream or high-contrast deep slate.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleSaveAppearance('light', null)}
                className={`flex flex-col items-start rounded-2xl border p-5 text-left transition cursor-pointer ${
                  theme === 'light'
                    ? 'border-[#d96b43] bg-[#d96b43]/10 shadow-warm-sm ring-2 ring-[#d96b43]'
                    : 'border-[var(--border-main)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-subtle)]'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                      </svg>
                    </div>
                    <span className="font-display font-bold text-base text-[var(--text-main)]">
                      Light Theme
                    </span>
                  </div>
                  {theme === 'light' && (
                    <span className="rounded-full bg-[#d96b43] px-2.5 py-0.5 text-xs font-bold text-white">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-3 text-xs text-[var(--text-muted)] leading-relaxed">
                  Warm editorial cream palette (#fbfaf7) with terracotta highlights and warm paper borders.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSaveAppearance('dark', null)}
                className={`flex flex-col items-start rounded-2xl border p-5 text-left transition cursor-pointer ${
                  theme === 'dark'
                    ? 'border-[#d96b43] bg-[#d96b43]/10 shadow-warm-sm ring-2 ring-[#d96b43]'
                    : 'border-[var(--border-main)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-subtle)]'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-200">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                    </div>
                    <span className="font-display font-bold text-base text-[var(--text-main)]">
                      Dark Theme
                    </span>
                  </div>
                  {theme === 'dark' && (
                    <span className="rounded-full bg-[#d96b43] px-2.5 py-0.5 text-xs font-bold text-white">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-3 text-xs text-[var(--text-muted)] leading-relaxed">
                  Deep slate studio background (#0b100c) with warm terracotta accents and soft card borders.
                </p>
              </button>
            </div>
          </div>

          {/* Product Cards Density */}
          <div className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-warm-sm space-y-4">
            <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-main)]">
              Product Card Layout Density
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Control the density of prototypes on the Explore page:
            </p>

            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <button
                type="button"
                onClick={() => handleSaveAppearance(null, 'comfortable')}
                className={`rounded-2xl border p-4 text-left transition cursor-pointer ${
                  cardDensity === 'comfortable'
                    ? 'border-[#d96b43] bg-[#d96b43]/10 text-[var(--text-main)] font-bold shadow-warm-xs'
                    : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)]'
                }`}
              >
                <span className="block font-bold text-sm text-[var(--text-main)]">Comfortable (Default)</span>
                <span className="mt-1 block text-xs text-[var(--text-muted)]">
                  Generous padding, preview cards, match reason pills, and tags.
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveAppearance(null, 'compact')}
                className={`rounded-2xl border p-4 text-left transition cursor-pointer ${
                  cardDensity === 'compact'
                    ? 'border-[#d96b43] bg-[#d96b43]/10 text-[var(--text-main)] font-bold shadow-warm-xs'
                    : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)]'
                }`}
              >
                <span className="block font-bold text-sm text-[var(--text-main)]">Compact View</span>
                <span className="mt-1 block text-xs text-[var(--text-muted)]">
                  Condensed card spacing for power-browsing large catalogs.
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: DATA & PRIVACY / DANGER ZONE                                       */}
      {/* ========================================================================= */}
      {activeTab === 'data' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Data Ownership & Export */}
          <div className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-warm-sm space-y-5">
            <div className="border-b border-[var(--border-main)] pb-4">
              <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-main)]">
                Export Your Data
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                BuildBoard stores your data in browser storage. Download a full JSON archive of your profile, preferences, and activity anytime.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--text-main)]">
                  JSON Profile & Feedback Backup
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Includes display identity, category preferences, and recognition point records.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                className="min-h-[42px] inline-flex items-center gap-2 rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-5 py-2 text-sm font-semibold text-[var(--text-main)] shadow-warm-xs hover:bg-[var(--bg-surface-subtle)] transition cursor-pointer"
              >
                <svg className="h-4 w-4 text-[#d96b43]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download Archive (.json)
              </button>
            </div>
          </div>

          {/* Danger Zone: Reset & Sign Out */}
          <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-6 sm:p-8 shadow-warm-sm space-y-6">
            <div className="border-b border-rose-500/20 pb-4">
              <h2 className="font-display text-xl font-bold tracking-tight text-rose-700 dark:text-rose-400">
                Danger Zone & Session Controls
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Actions here reset or terminate your current browser session.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div>
                  <span className="block text-sm font-bold text-[var(--text-main)]">
                    Reset Profile Preferences
                  </span>
                  <span className="block text-xs text-[var(--text-muted)] mt-0.5">
                    Clear custom interests, devices, and profile fields back to clean state.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResetProfile}
                  className="rounded-full border border-rose-500/40 bg-[var(--bg-surface)] px-4 py-2 text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                >
                  Reset Preferences
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--border-main)]">
                <div>
                  <span className="block text-sm font-bold text-[var(--text-main)]">
                    Sign Out of BuildBoard
                  </span>
                  <span className="block text-xs text-[var(--text-muted)] mt-0.5">
                    End active session on this device.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="rounded-full bg-rose-600 px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-warm-xs hover:bg-rose-700 transition cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default function ProfileSetupPage() {
  const { user } = useAuth()
  const { getProfile, saveProfile, getTesterRecognition } = useDemoData()
  const navigate = useNavigate()
  const location = useLocation()

  const currentEmail = user?.email || ''
  const savedProfile = useMemo(() => {
    return currentEmail ? getProfile(currentEmail) : null
  }, [currentEmail, getProfile])

  const recognition = useMemo(() => {
    return currentEmail ? getTesterRecognition(currentEmail) : { totalPoints: 0, items: [] }
  }, [currentEmail, getTesterRecognition])

  const isExistingProfile = Boolean(savedProfile?.updatedAt || savedProfile?.displayName)
  const isExplicitEditRoute = location.pathname === '/profile/edit'

  useDocumentTitle(
    isExistingProfile
      ? 'Profile & Settings | BuildBoard'
      : 'Set Up Your Profile | BuildBoard'
  )

  // Unauthenticated Gate
  if (!user) {
    return (
      <MotionConfig reducedMotion="user">
        <main
          id="main-content"
          tabIndex={-1}
          className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] transition-colors focus:outline-none flex flex-col justify-between"
        >
          <Navbar />
          <div className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-5 py-16">
            <div className="w-full rounded-3xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-8 text-center shadow-warm-md sm:p-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d96b43]/15 text-[#d96b43]">
                <svg className="h-7 w-7 text-[#d96b43]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <p className="mt-4 text-sm font-bold uppercase tracking-wider text-[#d96b43]">
                Profile Access Required
              </p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-display font-semibold tracking-tight text-[var(--text-main)]">
                Sign in to edit your profile
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                BuildBoard matches early prototypes directly to your tester background and technical interests. Sign in to view and update your profile preferences.
              </p>
              <button
                type="button"
                onClick={() => navigate('/sign-in', { state: { from: location } })}
                className="mt-6 w-full rounded-full bg-[#d96b43] py-3 text-sm font-semibold text-white shadow-warm-sm transition hover:bg-[#b85028] active:translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d96b43] focus-visible:ring-offset-2"
              >
                Sign in to Continue
              </button>
              <Link
                to="/explore"
                className="mt-4 inline-block text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] underline underline-offset-4"
              >
                ← Return to Explore
              </Link>
            </div>
          </div>
          <Footer />
        </main>
      </MotionConfig>
    )
  }

  return (
    <MotionConfig reducedMotion="user">
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] transition-colors focus:outline-none flex flex-col justify-between"
      >
        <div>
          <Navbar />
          <ProfilePageContent
            key={`${currentEmail}-${savedProfile?.updatedAt || 'initial'}`}
            userEmail={currentEmail}
            savedProfile={savedProfile}
            recognition={recognition}
            initialEditMode={isExplicitEditRoute}
            onSaveProfile={(data) => saveProfile(user.email, data)}
            onNavigateExplore={() => navigate('/explore')}
          />
        </div>
        <Footer />
      </main>
    </MotionConfig>
  )
}