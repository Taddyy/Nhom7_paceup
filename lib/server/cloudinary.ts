import { v2 as cloudinary, type UploadApiErrorResponse, type UploadApiResponse } from 'cloudinary'
import { Readable } from 'node:stream'

type UploadResult = {
  url: string
  bytes: number
  format?: string
  publicId: string
}

const REQUIRED_ENV_VARS = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
] as const

/**
 * Configure Cloudinary once when the module is loaded. The SDK is safe to reuse.
 */
function configureCloudinary(): void {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
}

let isConfigured = false

/**
 * Check whether all required Cloudinary env vars are present.
 */
export function cloudinaryAvailable(): boolean {
  return REQUIRED_ENV_VARS.every((key) => Boolean(process.env[key]))
}

/**
 * Lazily configure the SDK to avoid touching process.env unnecessarily during static eval.
 */
function ensureConfigured(): void {
  if (!isConfigured) {
    configureCloudinary()
    isConfigured = true
  }
}

/**
 * Upload a single image buffer to Cloudinary using upload_stream.
 */
export async function uploadImageToCloudinary(buffer: Buffer, contentType?: string): Promise<UploadResult> {
  if (!cloudinaryAvailable()) {
    throw new Error('Cloudinary environment variables are missing')
  }

  ensureConfigured()

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_UPLOAD_FOLDER ?? 'paceup',
        resource_type: 'image',
        format: contentType?.split('/').at(-1),
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        // Let Cloudinary choose an efficient format but keep good visual quality.
        transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
      },
      (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
        if (error || !result) {
          reject(error ?? new Error('Unknown Cloudinary upload error'))
          return
        }

        resolve({
          url: result.secure_url,
          bytes: result.bytes,
          format: result.format ?? undefined,
          publicId: result.public_id,
        })
      },
    )

    Readable.from(buffer).pipe(uploadStream)
  })
}


