import { NextResponse } from 'next/server'

const DEFAULT_MAX_FILE_BYTES = 5 * 1024 * 1024 // 5MB safety net for avatars/thumbnails
const DATA_URL_LIMIT = 5000
const DATA_URL_PREFIX_LENGTH = 23 // "data:image/jpeg;base64,"
const BASE64_OVERHEAD = 4 / 3

function buildDataUrl(buffer: Buffer, type: string): string {
  const base64 = buffer.toString('base64')
  return `data:${type || 'image/jpeg'};base64,${base64}`
}

function validateFileType(file: File): NextResponse | null {
  if (!file.type.startsWith('image/')) {
    return NextResponse.json(
      { error: 'File must be an image' },
      { status: 400 },
    )
  }

  return null
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file received' }, { status: 400 })
    }

    const typeValidation = validateFileType(file)
    if (typeValidation) {
      return typeValidation
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const maxBytes = Number.parseInt(process.env.MAX_IMAGE_UPLOAD_BYTES ?? '', 10) || DEFAULT_MAX_FILE_BYTES

    if (buffer.length > maxBytes) {
      return NextResponse.json(
        {
          error: `Ảnh quá lớn (${Math.round(buffer.length / 1024)}KB). Giới hạn hiện tại: ${Math.round(maxBytes / 1024)}KB.`,
        },
        { status: 400 },
      )
    }

    // Store image as data URL (suitable for small thumbnails / cover images)
    const dataUrl = buildDataUrl(buffer, file.type)

    if (dataUrl.length > DATA_URL_LIMIT) {
      const maxRawBytes = Math.floor((DATA_URL_LIMIT - DATA_URL_PREFIX_LENGTH) / BASE64_OVERHEAD)
      return NextResponse.json(
        {
          error: `Ảnh quá lớn (${Math.round(buffer.length / 1024)}KB). Hệ thống đang tự động nén lại...`,
          fileSize: buffer.length,
          maxAllowedBytes: maxRawBytes,
          retry: true,
        },
        { status: 400 },
      )
    }

    console.warn('Cloudinary is not configured; using base64 data URL for image storage.')
    return NextResponse.json({ url: dataUrl, provider: 'data-url', success: true })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error?.message || 'Failed to upload image',
      },
      { status: 500 },
    )
  }
}

