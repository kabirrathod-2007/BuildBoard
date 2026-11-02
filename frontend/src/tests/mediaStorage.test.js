import test from 'node:test'
import assert from 'node:assert/strict'
import {
  validateMediaFile,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
} from '../utils/mediaStorage.js'

test('Media Storage Validation: accepts supported image formats within size limit', () => {
  const validPng = { name: 'hero.png', type: 'image/png', size: 2 * 1024 * 1024 }
  const validJpg = { name: 'photo.jpg', type: 'image/jpeg', size: 5 * 1024 * 1024 }
  const validWebp = { name: 'preview.webp', type: 'image/webp', size: 1024 * 1024 }
  const validSvg = { name: 'icon.svg', type: 'image/svg+xml', size: 50 * 1024 }

  assert.equal(validateMediaFile(validPng).valid, true)
  assert.equal(validateMediaFile(validJpg).valid, true)
  assert.equal(validateMediaFile(validWebp).valid, true)
  assert.equal(validateMediaFile(validSvg).valid, true)
})

test('Media Storage Validation: rejects images exceeding 10MB limit', () => {
  const oversizedImage = {
    name: 'giant.png',
    type: 'image/png',
    size: MAX_IMAGE_SIZE + 1024,
  }
  const result = validateMediaFile(oversizedImage)
  assert.equal(result.valid, false)
  assert.match(result.error, /exceeds maximum allowed size of 10MB/i)
})

test('Media Storage Validation: accepts supported video formats within size limit', () => {
  const validMp4 = { name: 'demo.mp4', type: 'video/mp4', size: 25 * 1024 * 1024 }
  const validWebm = { name: 'walkthrough.webm', type: 'video/webm', size: 40 * 1024 * 1024 }

  assert.equal(validateMediaFile(validMp4).valid, true)
  assert.equal(validateMediaFile(validWebm).valid, true)
})

test('Media Storage Validation: rejects videos exceeding 50MB limit', () => {
  const oversizedVideo = {
    name: 'movie.mp4',
    type: 'video/mp4',
    size: MAX_VIDEO_SIZE + 1024,
  }
  const result = validateMediaFile(oversizedVideo)
  assert.equal(result.valid, false)
  assert.match(result.error, /exceeds maximum allowed size of 50MB/i)
})

test('Media Storage Validation: rejects unsupported MIME types and missing files', () => {
  assert.equal(validateMediaFile(null).valid, false)
  assert.equal(validateMediaFile({ name: 'script.exe', type: 'application/x-msdownload', size: 100 }).valid, false)
  assert.equal(validateMediaFile({ name: 'data.pdf', type: 'application/pdf', size: 100 }).valid, false)
})
