import { NextResponse } from 'next/server'

/**
 * Upload image using Cloudinary or convert to base64 data URL
 * 
 * On Vercel (serverless), filesystem is read-only, so we need to use:
 * 1. Cloudinary (if configured)
 * 2. Base64 data URL (fallback - stores image as data URI)
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file received' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Maximum allowed file size calculation:
    // Database field limit: 5000 chars
    // Max data URL length: 4950 chars (leaving 50 buffer, using most of the limit)
    // Data URL format: "data:image/jpeg;base64,<base64_data>"
    // Base64 encoding overhead: ~33% (4 chars per 3 bytes)
    const maxDataUrlLength = 4950 // Allow up to 4950 chars (using most of 5000 limit)
    const DATA_URL_PREFIX_LENGTH = 23 // "data:image/jpeg;base64,"
    const BASE64_OVERHEAD = 4 / 3 // Base64 encoding ratio
    
    // Calculate maximum raw file size that would fit
    // (raw_bytes * BASE64_OVERHEAD) + DATA_URL_PREFIX_LENGTH <= maxDataUrlLength
    const maxRawBytes = Math.floor((maxDataUrlLength - DATA_URL_PREFIX_LENGTH) / BASE64_OVERHEAD)
    
    // Pre-check: estimate data URL length before encoding
    const estimatedDataUrlLength = Math.ceil(buffer.length * BASE64_OVERHEAD) + DATA_URL_PREFIX_LENGTH
    
    // Convert to base64 first to check actual length
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type || 'image/jpeg'};base64,${base64}`
    
    // Final check: only reject if data URL exceeds database limit
    // This is the absolute maximum we can store
    if (dataUrl.length > 5000) {
      return NextResponse.json(
        { 
          error: `Ảnh quá lớn (${Math.round(buffer.length / 1024)}KB). Hệ thống đang tự động nén lại...`,
          fileSize: buffer.length,
          dataUrlLength: dataUrl.length,
          maxLength: 5000,
          retry: true // Signal frontend to retry with more compression
        },
        { status: 400 }
      )
    }
    
    // If data URL fits within database limit (5000 chars), accept it
    // We allow files up to the absolute limit since frontend compression should handle it
    
    // Log successful upload with size info for debugging
    console.log(`Image uploaded successfully: ${Math.round(buffer.length / 1024)}KB original (${buffer.length} bytes), ${Math.round(dataUrl.length / 1024)}KB data URL (${dataUrl.length} chars)`)

    // Return the data URL
    // Frontend can use this directly as image src
    return NextResponse.json({ 
      url: dataUrl,
      success: true 
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error?.message || 'Failed to upload image'
      },
      { status: 500 }
    )
  }
}

