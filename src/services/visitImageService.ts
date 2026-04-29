import { z } from 'zod'
import { gasGet, gasPost } from '@/services/api'

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const visitImageItemSchema = z.object({
  image_id: z.string(),
  vn: z.string(),
  file_url: z.string(),
  filename: z.string(),
  uploaded_by: z.string(),
  uploaded_at: z.string(),
})

const visitImageListSchema = z.array(visitImageItemSchema)

const messageResponseSchema = z.object({
  message: z.string(),
})

const visitImageServeSchema = z.object({
  image_id: z.string(),
  mime_type: z.string(),
  base64: z.string(),
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VisitImageItem = z.infer<typeof visitImageItemSchema>

// ---------------------------------------------------------------------------
// Image Compression
// ---------------------------------------------------------------------------

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB before compression
const MAX_DIMENSION = 1280
const THUMB_DIMENSION = 320

/** Check if WebP output is supported by the browser */
const supportsWebP = (() => {
  try {
    return document.createElement('canvas').toDataURL('image/webp').startsWith('data:image/webp')
  } catch {
    return false
  }
})()

function compressImage(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      try {
        let { width, height } = img
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)

        // Prefer WebP for smaller size, fallback to JPEG
        const outputType = supportsWebP ? 'image/webp' : 'image/jpeg'
        const quality = 0.65
        const dataUrl = canvas.toDataURL(outputType, quality)
        const base64 = dataUrl.split(',')[1]

        resolve({ base64, mimeType: outputType })
      } catch (err) {
        reject(err)
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'))
    }

    img.src = objectUrl
  })
}

/** Generate a local thumbnail data URL for preview */
export function generateThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      try {
        let { width, height } = img
        if (width > THUMB_DIMENSION || height > THUMB_DIMENSION) {
          const ratio = Math.min(THUMB_DIMENSION / width, THUMB_DIMENSION / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(objectUrl) // fallback to original
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        URL.revokeObjectURL(objectUrl)
        resolve(canvas.toDataURL('image/jpeg', 0.5))
      } catch {
        resolve(objectUrl) // fallback
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'))
    }

    img.src = objectUrl
  })
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `ประเภทไฟล์ "${file.name}" ไม่รองรับ (รองรับเฉพาะ JPEG, PNG, WebP)`
  }
  if (file.size > MAX_FILE_SIZE) {
    return `ไฟล์ "${file.name}" ใหญ่เกิน 5MB`
  }
  return null
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const visitImageService = {
  /** List images for a VN */
  async list(vn: string): Promise<VisitImageItem[]> {
    const raw = await gasGet<unknown>('visitImages.list', { vn })
    return visitImageListSchema.parse(raw)
  },

  /** Upload a single drug evidence image (handles compression internally) */
  async upload(vn: string, file: File): Promise<VisitImageItem> {
    const { base64, mimeType } = await compressImage(file)
    const raw = await gasPost<unknown>('visitImages.upload', {
      vn,
      filename: file.name,
      mimeType,
      base64,
    })
    return visitImageItemSchema.parse(raw)
  },

  /** Delete an image */
  async delete(imageId: string): Promise<{ message: string }> {
    const raw = await gasPost<unknown>('visitImages.delete', { image_id: imageId })
    return messageResponseSchema.parse(raw)
  },

  /** Serve image base64 data from Drive (proxy for <img> embedding) */
  async serve(imageId: string): Promise<{ imageId: string; mimeType: string; base64: string }> {
    const raw = await gasGet<unknown>('visitImages.serve', { image_id: imageId })
    const parsed = visitImageServeSchema.parse(raw)
    return {
      imageId: parsed.image_id,
      mimeType: parsed.mime_type,
      base64: parsed.base64,
    }
  },
}
