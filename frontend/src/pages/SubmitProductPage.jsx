import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { MotionConfig, motion } from 'motion/react'
import { AVAILABLE_CATEGORIES } from '../data/products'
import {
  TARGET_ROLES,
  TARGET_INDUSTRIES,
  TARGET_TECHNOLOGIES,
} from '../data/targetingOptions.js'
import { useDemoData } from '../context/DemoDataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { saveMediaFile } from '../utils/indexedDB.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

function isValidUrl(string) {
  try {
    const parsed = new URL(string.trim())
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export default function SubmitProductPage() {
  useDocumentTitle('Submit a Product | BuildBoard')
  const navigate = useNavigate()
  const location = useLocation()
  const { addProduct, getProfile } = useDemoData()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      navigate('/sign-in', {
        state: {
          from: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          },
        },
        replace: true,
      })
    }
  }, [user, navigate, location])

  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    prototypeUrl: '',
    githubUrl: '',
    categories: [],
    audience: '',
    targetRoles: [],
    targetIndustries: [],
    targetTechnologies: [],
    feedbackRequest: '',
  })

  // Media upload states (IndexedDB powered)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  const [galleryFiles, setGalleryFiles] = useState([]) // Array of { file, preview, name }

  const [videoFile, setVideoFile] = useState(null)
  const [videoPreview, setVideoPreview] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [isSavingMedia, setIsSavingMedia] = useState(false)

  const [errors, setErrors] = useState({})
  const [submittedData, setSubmittedData] = useState(null)

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const toggleCategory = (category) => {
    setFormData((prev) => {
      const exists = prev.categories.includes(category)
      const updated = exists
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category]
      return { ...prev, categories: updated }
    })
    if (errors.categories) {
      setErrors((prev) => ({ ...prev, categories: undefined }))
    }
  }

  const toggleTargetRole = (role) => {
    setFormData((prev) => {
      const exists = prev.targetRoles.includes(role)
      return {
        ...prev,
        targetRoles: exists
          ? prev.targetRoles.filter((r) => r !== role)
          : [...prev.targetRoles, role],
      }
    })
  }

  const toggleTargetIndustry = (industry) => {
    setFormData((prev) => {
      const exists = prev.targetIndustries.includes(industry)
      return {
        ...prev,
        targetIndustries: exists
          ? prev.targetIndustries.filter((i) => i !== industry)
          : [...prev.targetIndustries, industry],
      }
    })
  }

  const toggleTargetTechnology = (tech) => {
    setFormData((prev) => {
      const exists = prev.targetTechnologies.includes(tech)
      return {
        ...prev,
        targetTechnologies: exists
          ? prev.targetTechnologies.filter((t) => t !== tech)
          : [...prev.targetTechnologies, tech],
      }
    })
  }

  const handleCoverFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, cover: 'Please select a valid image file (PNG, JPG, WebP, SVG).' }))
        return
      }
      setCoverFile(file)
      const objUrl = URL.createObjectURL(file)
      setCoverPreview(objUrl)
      if (errors.cover) setErrors((prev) => ({ ...prev, cover: undefined }))
    }
  }

  const handleRemoveCover = () => {
    setCoverFile(null)
    setCoverPreview('')
  }

  const handleGalleryFilesChange = (e) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter((f) => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return
    const newItems = imageFiles.map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
      name: f.name,
    }))
    setGalleryFiles((prev) => [...prev, ...newItems].slice(0, 8))
  }

  const handleRemoveGalleryFile = (index) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleVideoFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('video/')) {
        setErrors((prev) => ({ ...prev, video: 'Please select a valid video file (MP4, WebM, MOV).' }))
        return
      }
      setVideoFile(file)
      const objUrl = URL.createObjectURL(file)
      setVideoPreview(objUrl)
      if (errors.video) setErrors((prev) => ({ ...prev, video: undefined }))
    }
  }

  const handleRemoveVideo = () => {
    setVideoFile(null)
    setVideoPreview('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = {}

    if (!formData.name.trim()) {
      validationErrors.name = 'Product name is required.'
    }

    if (!formData.tagline.trim()) {
      validationErrors.tagline = 'A short description or tagline is required.'
    }

    if (!formData.prototypeUrl.trim()) {
      validationErrors.prototypeUrl =
        'A working prototype or deployed product link is required.'
    } else if (!isValidUrl(formData.prototypeUrl)) {
      validationErrors.prototypeUrl =
        'Enter a valid URL including http:// or https:// (e.g. https://myproduct.example).'
    }

    if (formData.githubUrl.trim() && !isValidUrl(formData.githubUrl)) {
      validationErrors.githubUrl =
        'Enter a valid GitHub URL including http:// or https:// (e.g. https://github.com/user/repo).'
    }

    if (formData.categories.length === 0) {
      validationErrors.categories =
        'Select at least one category that describes your product.'
    }

    if (!formData.audience.trim()) {
      validationErrors.audience =
        'Please define your intended audience or target users.'
    }

    if (!formData.feedbackRequest.trim()) {
      validationErrors.feedbackRequest =
        'Describe what you want testers to try or provide feedback on.'
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    if (!user) {
      navigate('/sign-in', {
        state: {
          from: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          },
        },
        replace: true,
      })
      return
    }

    const normalizedEmail = (user.email || '').toLowerCase().trim()

    setIsSavingMedia(true)

    // Save media to IndexedDB
    let coverMediaId = null
    if (coverFile) {
      try {
        const saved = await saveMediaFile(coverFile)
        coverMediaId = saved.id
      } catch (err) {
        console.error('Failed to save cover file to IndexedDB:', err)
      }
    }

    const galleryMediaIds = []
    for (const item of galleryFiles) {
      try {
        const saved = await saveMediaFile(item.file)
        galleryMediaIds.push(saved.id)
      } catch (err) {
        console.error('Failed to save gallery screenshot to IndexedDB:', err)
      }
    }

    let videoMediaId = null
    if (videoFile) {
      try {
        const saved = await saveMediaFile(videoFile)
        videoMediaId = saved.id
      } catch (err) {
        console.error('Failed to save demo video file to IndexedDB:', err)
      }
    }

    setIsSavingMedia(false)
    setErrors({})

    const defaultImg = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80'
    const finalImage = imageUrl.trim() || coverPreview || defaultImg
    const finalGallery = [finalImage]

    const newProduct = addProduct({
      name: formData.name.trim(),
      tagline: formData.tagline.trim(),
      prototypeUrl: formData.prototypeUrl.trim(),
      githubUrl: formData.githubUrl.trim(),
      categories: formData.categories,
      audience: formData.audience.trim(),
      targetRoles: formData.targetRoles,
      targetIndustries: formData.targetIndustries,
      targetTechnologies: formData.targetTechnologies,
      feedbackRequest: formData.feedbackRequest.trim(),
      maker: (normalizedEmail ? getProfile(normalizedEmail)?.displayName?.trim() : null) || (normalizedEmail ? normalizedEmail.split('@')[0] : 'Builder'),
      creatorEmail: normalizedEmail,
      image: finalImage,
      mediaId: coverMediaId,
      gallery: finalGallery,
      galleryMediaIds,
      videoUrl: videoUrl.trim(),
      videoMediaId,
    })

    navigate(`/products/${newProduct.id}`)
  }

  const handleReset = () => {
    setFormData({
      name: '',
      tagline: '',
      prototypeUrl: '',
      githubUrl: '',
      categories: [],
      audience: '',
      targetRoles: [],
      targetIndustries: [],
      targetTechnologies: [],
      feedbackRequest: '',
    })
    setCoverFile(null)
    setCoverPreview('')
    setImageUrl('')
    setGalleryFiles([])
    setVideoFile(null)
    setVideoPreview('')
    setVideoUrl('')
    setErrors({})
    setSubmittedData(null)
  }

  if (!user) {
    return null
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
          <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:py-12">

          {submittedData ? (
            /* Listing Preview Mode */
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-8 space-y-8"
            >
              {/* Listing Notice Banner */}
              <section
                aria-label="Listing notice"
                className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-[var(--text-main)] shadow-warm-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="inline-block rounded-full border border-emerald-500/30 bg-[var(--bg-surface)] px-2.5 py-0.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      Listing Published
                    </span>
                    <h2 className="mt-2 text-xl sm:text-2xl font-display font-semibold tracking-tight text-[var(--text-main)]">
                      &ldquo;{submittedData.name}&rdquo; is Live
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
                      Your prototype listing has been created and is now discoverable in the Explore catalog.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2.5 sm:flex-col sm:items-end">
                    <button
                      type="button"
                      onClick={() => setSubmittedData(null)}
                      className="rounded-full bg-[#1b241e] px-4 py-2 text-sm font-semibold text-white shadow-warm-sm transition hover:bg-[#2e3b32] dark:bg-[#fbfaf7] dark:text-[#0b100c] cursor-pointer"
                    >
                      ← Edit submission details
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] shadow-warm-sm transition hover:bg-[var(--bg-surface-subtle)] cursor-pointer"
                    >
                      Start new submission
                    </button>
                  </div>
                </div>
              </section>

              {/* Generated Listing View */}
              <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
                <section className="space-y-6">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {submittedData.categories.map((cat) => (
                      <span
                        key={cat}
                        className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-2.5 py-0.5 text-sm font-medium text-[var(--text-muted)]"
                      >
                        {cat}
                      </span>
                    ))}
                    <span className="rounded-full border border-[var(--border-main)] bg-[var(--bg-surface-subtle)] px-2.5 py-0.5 text-sm font-semibold text-[var(--text-muted)]">
                      Working prototype
                    </span>
                  </div>

                  <div>
                    <h1 className="text-3xl sm:text-4xl font-display font-semibold tracking-tight text-[var(--text-main)] break-words">
                      {submittedData.name}
                    </h1>
                    <p className="mt-2 text-base leading-relaxed text-[var(--text-muted)] break-words">
                      {submittedData.tagline}
                    </p>
                  </div>

                  {/* Media Preview Box */}
                  <div className="overflow-hidden rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] shadow-warm-sm">
                    <img
                      src={submittedData.image || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"}
                      alt={`Preview schematic for ${submittedData.name}`}
                      className="w-full h-56 object-cover"
                      loading="lazy"
                    />
                    <div className="p-4 border-t border-[var(--border-main)] text-center">
                      <p className="text-sm font-bold uppercase tracking-wider text-[#d96b43]">
                        Verified Prototype
                      </p>
                      <p className="mt-0.5 text-sm text-[var(--text-subtle)]">
                        Testers will open your prototype URL directly from this listing.
                      </p>
                    </div>
                  </div>

                  {/* Audience Card */}
                  <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-5 shadow-warm-sm text-[var(--text-main)] space-y-3">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wider text-[#d96b43]">
                        Target Audience
                      </p>
                      <h3 className="mt-1 text-base font-display font-semibold text-[var(--text-main)]">Who it&apos;s built for</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
                        {submittedData.audience}
                      </p>
                    </div>

                    {(submittedData.targetRoles?.length > 0 ||
                      submittedData.targetIndustries?.length > 0 ||
                      submittedData.targetTechnologies?.length > 0) && (
                      <div className="border-t border-[var(--border-main)] pt-3 space-y-2 text-sm">
                        {submittedData.targetRoles?.length > 0 && (
                          <div>
                            <span className="font-semibold text-[#d96b43]">Target Roles: </span>
                            <span className="text-[var(--text-main)]">
                              {submittedData.targetRoles.join(', ')}
                            </span>
                          </div>
                        )}
                        {submittedData.targetIndustries?.length > 0 && (
                          <div>
                            <span className="font-semibold text-[#d96b43]">Target Industries: </span>
                            <span className="text-[var(--text-main)]">
                              {submittedData.targetIndustries.join(', ')}
                            </span>
                          </div>
                        )}
                        {submittedData.targetTechnologies?.length > 0 && (
                          <div>
                            <span className="font-semibold text-[#d96b43]">Relevant Technologies: </span>
                            <span className="text-[var(--text-main)]">
                              {submittedData.targetTechnologies.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                {/* Aside / Action Panel */}
                <aside className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] p-6 shadow-warm-md sm:p-7 space-y-5">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-[#d96b43]">
                      Tester Request
                    </p>
                    <h3 className="mt-1 text-xl font-display font-semibold tracking-tight text-[var(--text-main)]">What to try</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                      {submittedData.feedbackRequest}
                    </p>
                  </div>

                  <div className="border-t border-[var(--border-main)] pt-5 space-y-2.5">
                    <p className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">
                      Verified links
                    </p>
                    <a
                      href={submittedData.prototypeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-full bg-[#1b241e] px-4 py-2.5 text-sm font-semibold text-white shadow-warm-sm transition hover:bg-[#2e3b32] dark:bg-[#fbfaf7] dark:text-[#0b100c]"
                    >
                      <span>Open working prototype</span>
                      <span aria-hidden="true">↗</span>
                    </a>

                    {submittedData.githubUrl && (
                      <a
                        href={submittedData.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-full border border-[var(--border-main)] bg-[var(--bg-surface)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] shadow-warm-sm transition hover:bg-[var(--bg-surface-subtle)]"
                      >
                        <span>View GitHub repository</span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </div>

                  <div className="border-t border-[var(--border-main)] pt-3 text-sm leading-relaxed text-[var(--text-subtle)]">
                    <p className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Prototype URL format verified: <code className="break-all font-mono text-sm font-semibold text-[var(--text-main)]">{submittedData.prototypeUrl}</code></span>
                    </p>
                  </div>
                </aside>
              </div>
            </motion.div>
          ) : (
            /* Submission Form */
            <div className="mt-8">
              <section className="pb-8 border-b border-[var(--border-main)]">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold tracking-tight text-[var(--text-main)]">
                  Submit your prototype
                </h1>
                <p className="mt-2.5 max-w-2xl text-base leading-relaxed text-[var(--text-muted)]">
                  Share a working prototype or deployed product with the BuildBoard community.
                  Tell testers who it&apos;s for and what feedback you need to build what&apos;s next.
                </p>
              </section>

              <form
                onSubmit={handleSubmit}
                noValidate
                className="mt-8 space-y-8 text-[var(--text-main)]"
              >
                {/* Product Name */}
                <div>
                  <label
                    htmlFor="product-name"
                    className="block text-sm font-semibold text-[var(--text-main)]"
                  >
                    Product name <span className="text-[#d96b43]">*</span>
                  </label>
                  <p className="mt-0.5 text-sm text-[var(--text-subtle)]">
                    The working name of your application, tool, or prototype.
                  </p>
                  <input
                    id="product-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g. Planwell, Weeknote, TaskSpark"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    className={`mt-1.5 w-full rounded-xl border bg-[var(--bg-surface)] px-4 py-2.5 text-sm text-[var(--text-main)] placeholder:text-[var(--text-subtle)] transition outline-none focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20 ${
                      errors.name
                        ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20'
                        : 'border-[var(--border-main)]'
                    }`}
                  />
                  {errors.name && (
                    <p id="name-error" className="mt-1 text-sm font-semibold text-rose-500">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Tagline */}
                <div>
                  <label
                    htmlFor="product-tagline"
                    className="block text-sm font-semibold text-[var(--text-main)]"
                  >
                    Short description / tagline <span className="text-[#d96b43]">*</span>
                  </label>
                  <p className="mt-0.5 text-sm text-[var(--text-subtle)]">
                    A concise one-line summary of what it does.
                  </p>
                  <input
                    id="product-tagline"
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => handleInputChange('tagline', e.target.value)}
                    placeholder="e.g. Collaborative task planning for remote engineers"
                    aria-invalid={Boolean(errors.tagline)}
                    aria-describedby={errors.tagline ? 'tagline-error' : undefined}
                    className={`mt-1.5 w-full rounded-xl border bg-[var(--bg-surface)] px-4 py-2.5 text-sm text-[var(--text-main)] placeholder:text-[var(--text-subtle)] transition outline-none focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20 ${
                      errors.tagline
                        ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20'
                        : 'border-[var(--border-main)]'
                    }`}
                  />
                  {errors.tagline && (
                    <p id="tagline-error" className="mt-1 text-sm font-semibold text-rose-500">
                      {errors.tagline}
                    </p>
                  )}
                </div>

                {/* Working Prototype URL */}
                <div>
                  <label
                    htmlFor="product-url"
                    className="block text-sm font-semibold text-[var(--text-main)]"
                  >
                    Working prototype URL <span className="text-[#d96b43]">*</span>
                  </label>
                  <p className="mt-0.5 text-sm text-[var(--text-subtle)]">
                    A working web app, test deployment, or live prototype link.
                  </p>
                  <input
                    id="product-url"
                    type="url"
                    value={formData.prototypeUrl}
                    onChange={(e) => handleInputChange('prototypeUrl', e.target.value)}
                    placeholder="https://myproduct.example"
                    aria-invalid={Boolean(errors.prototypeUrl)}
                    aria-describedby={errors.prototypeUrl ? 'prototypeUrl-error' : undefined}
                    className={`mt-1.5 w-full rounded-xl border bg-[var(--bg-surface)] px-4 py-2.5 text-sm text-[var(--text-main)] placeholder:text-[var(--text-subtle)] transition outline-none focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20 ${
                      errors.prototypeUrl
                        ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20'
                        : 'border-[var(--border-main)]'
                    }`}
                  />
                  {errors.prototypeUrl && (
                    <p id="prototypeUrl-error" className="mt-1 text-sm font-semibold text-rose-500">
                      {errors.prototypeUrl}
                    </p>
                  )}
                </div>

                {/* GitHub Repository Link */}
                <div>
                  <label
                    htmlFor="product-github"
                    className="block text-sm font-semibold text-[var(--text-main)]"
                  >
                    GitHub repository <span className="text-sm font-normal text-[var(--text-subtle)]">(Optional)</span>
                  </label>
                  <p className="mt-0.5 text-sm text-[var(--text-subtle)]">
                    If your prototype is open source, share the repo with testers.
                  </p>
                  <input
                    id="product-github"
                    type="url"
                    value={formData.githubUrl}
                    onChange={(e) => handleInputChange('githubUrl', e.target.value)}
                    placeholder="https://github.com/owner/repository"
                    aria-invalid={Boolean(errors.githubUrl)}
                    aria-describedby={errors.githubUrl ? 'githubUrl-error' : undefined}
                    className={`mt-1.5 w-full rounded-xl border bg-[var(--bg-surface)] px-4 py-2.5 text-sm text-[var(--text-main)] placeholder:text-[var(--text-subtle)] transition outline-none focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20 ${
                      errors.githubUrl
                        ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20'
                        : 'border-[var(--border-main)]'
                    }`}
                  />
                  {errors.githubUrl && (
                    <p id="githubUrl-error" className="mt-1 text-sm font-semibold text-rose-500">
                      {errors.githubUrl}
                    </p>
                  )}
                </div>

                {/* ── Product Media & Demo Video (IndexedDB Powered) ── */}
                <div className="pt-8 border-t border-[var(--border-main)] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-main)] pb-3.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-display font-bold text-[var(--text-main)]">
                          Product Media & Walkthrough
                        </h3>
                      </div>
                      <p className="mt-0.5 text-xs sm:text-sm text-[var(--text-subtle)]">
                        Upload screenshots, product previews, and video walkthroughs directly into your browser&apos;s local IndexedDB.
                      </p>
                    </div>
                  </div>

                  {/* 1. Cover Image */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-[var(--text-main)]">
                      Primary Cover Image <span className="text-xs font-normal text-[var(--text-subtle)]">(Upload file or provide image link)</span>
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2 items-start">
                      {/* Upload box */}
                      <div>
                        <label
                          htmlFor="cover-file-upload"
                          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border-main)] bg-[var(--bg-surface)] p-4 text-center cursor-pointer transition hover:border-[#d96b43] hover:bg-[var(--bg-surface-subtle)]"
                        >
                          <svg className="h-8 w-8 text-[#d96b43] mb-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                          </svg>
                          <span className="text-xs sm:text-sm font-semibold text-[var(--text-main)]">
                            {coverFile ? coverFile.name : 'Choose cover image file'}
                          </span>
                          <span className="text-[11px] text-[var(--text-subtle)] mt-0.5">
                            PNG, JPG, WebP, SVG (IndexedDB)
                          </span>
                          <input
                            id="cover-file-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleCoverFileChange}
                            className="sr-only"
                          />
                        </label>
                      </div>

                      {/* Or image URL */}
                      <div>
                        <input
                          type="url"
                          value={imageUrl}
                          onChange={(e) => {
                            setImageUrl(e.target.value)
                            if (e.target.value) {
                              setCoverPreview(e.target.value)
                            }
                          }}
                          placeholder="Or paste image URL (https://...)"
                          className="w-full rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs sm:text-sm text-[var(--text-main)] placeholder:text-[var(--text-subtle)] outline-none focus:border-[#d96b43]"
                        />
                        <p className="mt-1 text-[11px] text-[var(--text-subtle)]">
                          Leave empty to automatically use our high-res curated prototype placeholder.
                        </p>
                      </div>
                    </div>

                    {/* Cover Preview */}
                    {coverPreview && (
                      <div className="relative mt-2 inline-block overflow-hidden rounded-xl border border-[var(--border-main)] shadow-xs">
                        <img
                          src={coverPreview}
                          alt="Cover preview"
                          className="h-32 w-56 object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveCover}
                          className="absolute top-1.5 right-1.5 rounded-full bg-black/70 p-1 text-white hover:bg-black transition cursor-pointer"
                          title="Remove cover image"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    )}
                    {errors.cover && (
                      <p className="text-xs font-semibold text-rose-500">{errors.cover}</p>
                    )}
                  </div>

                  {/* 2. Additional Gallery Screenshots */}
                  <div className="space-y-3 border-t border-[var(--border-main)] pt-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-[var(--text-main)]">
                        Additional Screenshots Gallery <span className="text-xs font-normal text-[var(--text-subtle)]">(Up to 8 screenshots)</span>
                      </label>
                      {galleryFiles.length > 0 && (
                        <span className="text-xs font-semibold text-[#d96b43]">
                          {galleryFiles.length} uploaded
                        </span>
                      )}
                    </div>

                    <label
                      htmlFor="gallery-files-upload"
                      className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border-main)] bg-[var(--bg-surface)] p-3 text-xs sm:text-sm font-semibold text-[var(--text-main)] cursor-pointer hover:border-[#d96b43] hover:bg-[var(--bg-surface-subtle)] transition"
                    >
                      <svg className="h-4 w-4 text-[#d96b43]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>Add screenshots to gallery (IndexedDB)</span>
                      <input
                        id="gallery-files-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryFilesChange}
                        className="sr-only"
                      />
                    </label>

                    {galleryFiles.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-2.5">
                        {galleryFiles.map((item, idx) => (
                          <div key={idx} className="relative overflow-hidden rounded-lg border border-[var(--border-main)]">
                            <img src={item.preview} alt={`Screenshot ${idx + 1}`} className="h-16 w-24 object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryFile(idx)}
                              className="absolute top-1 right-1 rounded-full bg-black/75 p-0.5 text-white hover:bg-black transition cursor-pointer"
                              title="Remove screenshot"
                            >
                              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3. Product Demo Video Walkthrough */}
                  <div className="space-y-3 border-t border-[var(--border-main)] pt-4">
                    <label className="block text-sm font-semibold text-[var(--text-main)]">
                      Product Video Walkthrough <span className="text-xs font-normal text-[var(--text-subtle)]">(Upload video or paste Loom/YouTube link)</span>
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2 items-start">
                      {/* Video file upload */}
                      <div>
                        <label
                          htmlFor="video-file-upload"
                          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border-main)] bg-[var(--bg-surface)] p-4 text-center cursor-pointer transition hover:border-[#d96b43] hover:bg-[var(--bg-surface-subtle)]"
                        >
                          <svg className="h-8 w-8 text-[#d96b43] mb-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polygon points="23 7 16 12 23 17 23 7" />
                            <rect width="15" height="14" x="1" y="5" rx="2" ry="2" />
                          </svg>
                          <span className="text-xs sm:text-sm font-semibold text-[var(--text-main)]">
                            {videoFile ? videoFile.name : 'Upload video file'}
                          </span>
                          <span className="text-[11px] text-[var(--text-subtle)] mt-0.5">
                            MP4, WebM, MOV
                          </span>
                          <input
                            id="video-file-upload"
                            type="file"
                            accept="video/*"
                            onChange={handleVideoFileChange}
                            className="sr-only"
                          />
                        </label>
                      </div>

                      {/* Video URL */}
                      <div>
                        <input
                          type="url"
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          placeholder="Or paste video URL (Loom, YouTube, MP4)"
                          className="w-full rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs sm:text-sm text-[var(--text-main)] placeholder:text-[var(--text-subtle)] outline-none focus:border-[#d96b43]"
                        />
                        <p className="mt-1 text-[11px] text-[var(--text-subtle)]">
                          Supports Loom shares, YouTube previews, or direct MP4 links.
                        </p>
                      </div>
                    </div>

                    {/* Video file preview player */}
                    {videoPreview && (
                      <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--border-main)] bg-black shadow-warm-sm">
                        <div className="flex items-center justify-between bg-[var(--bg-surface)] px-4 py-2 border-b border-[var(--border-main)] text-xs">
                          <span className="font-semibold text-[var(--text-main)] truncate max-w-xs">
                            🎬 Video Preview: {videoFile?.name}
                          </span>
                          <button
                            type="button"
                            onClick={handleRemoveVideo}
                            className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition cursor-pointer"
                          >
                            Remove video
                          </button>
                        </div>
                        <video
                          src={videoPreview}
                          controls
                          playsInline
                          className="w-full max-h-60 object-contain bg-black"
                        />
                      </div>
                    )}
                    {errors.video && (
                      <p className="text-xs font-semibold text-rose-500">{errors.video}</p>
                    )}
                  </div>
                </div>

                {/* Category Selection */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="block text-sm font-semibold text-[var(--text-main)]">
                      Categories <span className="text-[#d96b43]">*</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {formData.categories.length > 0 && (
                        <>
                          <span className="rounded-full bg-[#d96b43]/10 px-2.5 py-0.5 text-xs font-bold text-[#d96b43]">
                            {formData.categories.length} selected
                          </span>
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, categories: [] }))}
                            className="text-xs font-semibold text-[var(--text-subtle)] hover:text-[#d96b43] transition-colors cursor-pointer"
                          >
                            Clear
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="mt-0.5 text-sm text-[var(--text-subtle)]">
                    Select relevant categories to help testers find and filter your listing.
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {AVAILABLE_CATEGORIES.map((category) => {
                      const isSelected = formData.categories.includes(category)
                      return (
                        <button
                          key={category}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => toggleCategory(category)}
                          className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition cursor-pointer ${
                            isSelected
                              ? 'border-[#d96b43] bg-[#d96b43] text-white shadow-warm-sm'
                              : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-main)]'
                          }`}
                        >
                          {isSelected && (
                            <svg className="h-3 w-3 inline-block mr-1 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                          {category}
                        </button>
                      )
                    })}
                  </div>
                  {errors.categories && (
                    <p className="mt-1.5 text-sm font-semibold text-rose-500">
                      {errors.categories}
                    </p>
                  )}
                </div>

                {/* Target Audience Definition */}
                <div>
                  <label
                    htmlFor="product-audience"
                    className="block text-sm font-semibold text-[var(--text-main)]"
                  >
                    Target audience <span className="text-[#d96b43]">*</span>
                  </label>
                  <p className="mt-0.5 text-sm text-[var(--text-subtle)]">
                    Describe who this product is built for (e.g. Remote design leads, high school tutors).
                  </p>
                  <input
                    id="product-audience"
                    type="text"
                    value={formData.audience}
                    onChange={(e) => handleInputChange('audience', e.target.value)}
                    placeholder="e.g. Independent developers shipping React and Node apps"
                    aria-invalid={Boolean(errors.audience)}
                    aria-describedby={errors.audience ? 'audience-error' : undefined}
                    className={`mt-1.5 w-full rounded-xl border bg-[var(--bg-surface)] px-4 py-2.5 text-sm text-[var(--text-main)] placeholder:text-[var(--text-subtle)] transition outline-none focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20 ${
                      errors.audience
                        ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20'
                        : 'border-[var(--border-main)]'
                    }`}
                  />
                  {errors.audience && (
                    <p id="audience-error" className="mt-1 text-sm font-semibold text-rose-500">
                      {errors.audience}
                    </p>
                  )}
                </div>

                {/* Multi-Dimensional Targeting Criteria */}
                <div className="pt-8 border-t border-[var(--border-main)] space-y-5">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#d96b43]">
                      Detailed Tester Matching Criteria
                    </h3>
                    <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                      Specify relevant roles, industries, or technologies to enable transparent recommendation matching for testers.
                    </p>
                  </div>

                  {/* Target Roles */}
                  <div>
                    <span className="block text-sm font-semibold text-[var(--text-main)]">
                      Target roles
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {TARGET_ROLES.map((role) => {
                        const isSelected = formData.targetRoles.includes(role)
                        return (
                          <button
                            key={role}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => toggleTargetRole(role)}
                            className={`rounded-full border px-3 py-1 text-sm font-medium transition cursor-pointer ${
                              isSelected
                                ? 'border-[#d96b43] bg-[#d96b43] text-white shadow-warm-sm'
                                : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)]'
                            }`}
                          >
                            {isSelected && (
                              <svg className="h-3 w-3 inline-block mr-1 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                            {role}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Target Industries */}
                  <div>
                    <span className="block text-sm font-semibold text-[var(--text-main)]">
                      Target industries
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {TARGET_INDUSTRIES.map((industry) => {
                        const isSelected = formData.targetIndustries.includes(industry)
                        return (
                          <button
                            key={industry}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => toggleTargetIndustry(industry)}
                            className={`rounded-full border px-3 py-1 text-sm font-medium transition cursor-pointer ${
                              isSelected
                                ? 'border-[#d96b43] bg-[#d96b43] text-white shadow-warm-sm'
                                : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)]'
                            }`}
                          >
                            {isSelected && (
                              <svg className="h-3 w-3 inline-block mr-1 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                            {industry}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Relevant Technologies */}
                  <div>
                    <span className="block text-sm font-semibold text-[var(--text-main)]">
                      Relevant technologies & tools
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {TARGET_TECHNOLOGIES.map((tech) => {
                        const isSelected = formData.targetTechnologies.includes(tech)
                        return (
                          <button
                            key={tech}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => toggleTargetTechnology(tech)}
                            className={`rounded-full border px-3 py-1 text-sm font-medium transition cursor-pointer ${
                              isSelected
                                ? 'border-[#d96b43] bg-[#d96b43] text-white shadow-warm-sm'
                                : 'border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)]'
                            }`}
                          >
                            {isSelected && (
                              <svg className="h-3 w-3 inline-block mr-1 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                            {tech}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Feedback Request */}
                <div>
                  <label
                    htmlFor="product-feedback-request"
                    className="block text-sm font-semibold text-[var(--text-main)]"
                  >
                    What should testers try or comment on? <span className="text-[#d96b43]">*</span>
                  </label>
                  <p className="mt-0.5 text-sm text-[var(--text-subtle)]">
                    Provide concrete instructions or questions to guide tester exploration.
                  </p>
                  <textarea
                    id="product-feedback-request"
                    rows={3}
                    value={formData.feedbackRequest}
                    onChange={(e) => handleInputChange('feedbackRequest', e.target.value)}
                    placeholder="e.g. Try onboarding and setting up a new project. Tell us if any steps felt confusing or if loading was slow."
                    aria-invalid={Boolean(errors.feedbackRequest)}
                    aria-describedby={errors.feedbackRequest ? 'feedbackRequest-error' : undefined}
                    className={`mt-1.5 w-full rounded-xl border bg-[var(--bg-surface)] p-3 text-sm text-[var(--text-main)] placeholder:text-[var(--text-subtle)] transition outline-none focus:border-[#d96b43] focus:ring-2 focus:ring-[#d96b43]/20 ${
                      errors.feedbackRequest
                        ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20'
                        : 'border-[var(--border-main)]'
                    }`}
                  />
                  {errors.feedbackRequest && (
                    <p id="feedbackRequest-error" className="mt-1 text-sm font-semibold text-rose-500">
                      {errors.feedbackRequest}
                    </p>
                  )}
                </div>

                {/* Submit & Demo Notice */}
                <div className="border-t border-[var(--border-main)] pt-6">
                  <button
                    type="submit"
                    disabled={isSavingMedia}
                    className="w-full sm:w-auto rounded-full bg-[#d96b43] px-8 py-3.5 text-sm font-semibold text-white shadow-warm-sm transition duration-150 hover:bg-[#b85028] active:translate-y-0.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSavingMedia ? 'Saving media...' : 'Submit prototype & view listing →'}
                  </button>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--text-subtle)]">
                    Submitting publishes your prototype to the Explore directory and makes it immediately discoverable to matching testers.
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

        <Footer />
      </main>
    </MotionConfig>
  )
}
