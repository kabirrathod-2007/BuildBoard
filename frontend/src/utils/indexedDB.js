import { useState, useEffect } from 'react'

const DB_NAME = 'buildboard_media_db'
const DB_VERSION = 1
const STORE_NAME = 'media_files'

/**
 * Open or upgrade the BuildBoard IndexedDB database.
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser environment.'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = (event) => {
      resolve(event.target.result)
    }

    request.onerror = (event) => {
      reject(event.target.error || new Error('Failed to open IndexedDB'))
    }
  })
}

/**
 * Save a File or Blob into IndexedDB.
 * @param {File|Blob} file - The file or blob to save.
 * @param {string} [customId] - Optional custom ID.
 * @returns {Promise<{ id: string, name: string, type: string, size: number }>}
 */
export async function saveMediaFile(file, customId = null) {
  const db = await openDB()
  const id = customId || `media_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const record = {
    id,
    name: file.name || 'uploaded_media',
    type: file.type || 'application/octet-stream',
    size: file.size || 0,
    blob: file,
    createdAt: new Date().toISOString(),
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(record)

    request.onsuccess = () => {
      resolve({
        id: record.id,
        name: record.name,
        type: record.type,
        size: record.size,
      })
    }

    request.onerror = (e) => reject(e.target.error)
  })
}

/**
 * Retrieve a media record by ID from IndexedDB.
 * @param {string} id
 * @returns {Promise<{ id: string, name: string, type: string, size: number, blob: Blob }|null>}
 */
export async function getMediaFile(id) {
  if (!id) return null
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(id)

      request.onsuccess = (event) => {
        resolve(event.target.result || null)
      }

      request.onerror = (e) => reject(e.target.error)
    })
  } catch (err) {
    console.error(`Failed to load media file ${id} from IndexedDB:`, err)
    return null
  }
}

/**
 * Delete a media record by ID from IndexedDB.
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteMediaFile(id) {
  if (!id) return false
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => resolve(true)
      request.onerror = (e) => reject(e.target.error)
    })
  } catch {
    return false
  }
}

/**
 * React hook to load a media file from IndexedDB by mediaId, creating an Object URL.
 * Automatically cleans up the Object URL upon component unmount or ID change.
 * Falls back to fallbackUrl if mediaId is not provided or not found.
 */
export function useIndexedDbMedia(mediaId, fallbackUrl = '') {
  const [data, setData] = useState({ mediaId: null, dbUrl: null, meta: null, loading: false })

  useEffect(() => {
    if (!mediaId) {
      return
    }

    let active = true
    let createdUrl = null

    getMediaFile(mediaId)
      .then((record) => {
        if (!active) return
        if (record && record.blob) {
          createdUrl = URL.createObjectURL(record.blob)
          setData({
            mediaId,
            dbUrl: createdUrl,
            meta: {
              name: record.name,
              type: record.type,
              size: record.size,
              isVideo: record.type?.startsWith('video/'),
              isImage: record.type?.startsWith('image/'),
            },
            loading: false,
          })
        } else {
          setData({ mediaId, dbUrl: null, meta: null, loading: false })
        }
      })
      .catch((err) => {
        if (!active) return
        console.error(`Error resolving media ${mediaId}:`, err)
        setData({ mediaId, dbUrl: null, meta: null, loading: false })
      })

    return () => {
      active = false
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl)
      }
    }
  }, [mediaId])

  const isCurrent = data.mediaId === mediaId
  const url = isCurrent && data.dbUrl ? data.dbUrl : fallbackUrl
  const meta = isCurrent ? data.meta : null
  const loading = Boolean(mediaId && (!isCurrent || data.loading))

  return { url, loading, meta, isVideo: meta?.isVideo || false }
}
