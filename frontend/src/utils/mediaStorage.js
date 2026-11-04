import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { firebaseStorage, isStorageConfigured } from '../lib/firebase.js'
import { saveMediaFile } from './indexedDB.js'

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50 MB
export const CLOUD_STORAGE_TIMEOUT_MS = 5000 // 5 seconds max per upload attempt before fallback

/**
 * Race a promise against a timeout to prevent hanging when Cloud Storage or network is stalled.
 */
function withTimeout(promise, ms, message) {
  let timerId
  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      reject(new Error(message || `Operation timed out after ${ms}ms`))
    }, ms)
  })

  return Promise.race([
    promise.finally(() => clearTimeout(timerId)),
    timeoutPromise,
  ])
}

export const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
]

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
]

/**
 * Validate media file format and size limits.
 * @param {File|Blob} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateMediaFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided.' }
  }

  const isVideo = file.type?.startsWith('video/')
  const isImage = file.type?.startsWith('image/')

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: 'Unsupported file type. Please upload an image (PNG, JPG, WebP, SVG) or video (MP4, WebM).',
    }
  }

  if (isImage) {
    if (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported image format (${file.type}). Allowed: PNG, JPG, WebP, SVG.`,
      }
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return {
        valid: false,
        error: `Image exceeds maximum allowed size of 10MB (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
      }
    }
  }

  if (isVideo) {
    if (file.type && !ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported video format (${file.type}). Allowed: MP4, WebM.`,
      }
    }
    if (file.size > MAX_VIDEO_SIZE) {
      return {
        valid: false,
        error: `Video exceeds maximum allowed size of 50MB (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
      }
    }
  }

  return { valid: true }
}

/**
 * Upload product media file to Cloud Storage (Firebase Storage) with fallback to IndexedDB.
 *
 * @param {Object} options
 * @param {File|Blob} options.file - File object to upload
 * @param {string} [options.userId] - Current user ID or UID
 * @param {string} [options.folder='images'] - Target subfolder ('covers', 'gallery', 'videos')
 * @returns {Promise<{ url?: string, mediaId?: string, isCloud: boolean, name: string, size: number, type: string }>}
 */
export async function uploadProductMedia({ file, userId = 'anonymous', folder = 'images' }) {
  const validation = validateMediaFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // 1. Attempt Cloud Storage upload if configured
  if (isStorageConfigured && firebaseStorage) {
    try {
      const sanitizedName = (file.name || 'media').replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `products/${userId}/${folder}/${Date.now()}_${sanitizedName}`
      const storageRef = ref(firebaseStorage, storagePath)

      const snapshot = await withTimeout(
        uploadBytes(storageRef, file, {
          contentType: file.type || 'application/octet-stream',
        }),
        CLOUD_STORAGE_TIMEOUT_MS,
        'Cloud storage upload timed out'
      )

      const downloadUrl = await withTimeout(
        getDownloadURL(snapshot.ref),
        CLOUD_STORAGE_TIMEOUT_MS,
        'Cloud storage download URL fetch timed out'
      )

      return {
        url: downloadUrl,
        path: storagePath,
        isCloud: true,
        name: file.name || 'media',
        size: file.size,
        type: file.type,
      }
    } catch (err) {
      console.warn('[BuildBoard] Cloud storage upload failed or timed out, falling back to local storage:', err.message)
    }
  }

  // 2. Fallback to local IndexedDB (development or unconfigured storage)
  try {
    const saved = await saveMediaFile(file)
    return {
      mediaId: saved.id,
      isCloud: false,
      name: saved.name,
      size: saved.size,
      type: saved.type,
    }
  } catch (idbErr) {
    console.warn('[BuildBoard] IndexedDB fallback also failed:', idbErr.message)
    return {
      isCloud: false,
      name: file.name || 'media',
      size: file.size || 0,
      type: file.type || '',
    }
  }
}
