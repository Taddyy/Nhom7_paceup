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
    // Max data URL length: 4800 chars (leaving 200 buffer)
    // Data URL format: "data:image/jpeg;base64,<base64_data>"
    // Base64 encoding overhead: ~33% (4 chars per 3 bytes)
    // 
    // Target: 180KB raw file ensures data URL < 4800 chars
    // 180KB = 184320 bytes
    // Base64: 184320 * 4/3 = 245760 chars
    // Data URL: 245760 + 23 = 245783 chars << 4800 ✓
    const MAX_RAW_FILE_SIZE = 180 * 1024 // 180KB - conservative limit
    const maxDataUrlLength = 4800 // Database field limit is 5000, leaving 200 buffer
    const DATA_URL_PREFIX_LENGTH = 23 // "data:image/jpeg;base64,"
    const BASE64_OVERHEAD = 4 / 3 // Base64 encoding ratio
    
    // Pre-check: estimate data URL length before encoding
    const estimatedDataUrlLength = Math.ceil(buffer.length * BASE64_OVERHEAD) + DATA_URL_PREFIX_LENGTH
    
    if (estimatedDataUrlLength > maxDataUrlLength || buffer.length > MAX_RAW_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: `Ảnh quá lớn (${Math.round(buffer.length / 1024)}KB). Vui lòng sử dụng ảnh nhỏ hơn 180KB. Nếu đang crop ảnh, hãy chọn chất lượng thấp hơn hoặc crop phần nhỏ hơn.`,
          fileSize: buffer.length,
          maxSize: MAX_RAW_FILE_SIZE,
          estimatedDataUrlLength: estimatedDataUrlLength,
          maxDataUrlLength: maxDataUrlLength
        },
        { status: 400 }
      )
    }
    
    // Convert file to base64 data URL
    // Frontend adaptive compression should already optimize the file size
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type || 'image/jpeg'};base64,${base64}`
    
    // Final check: ensure data URL actually fits (this should never fail if estimation is correct)
    if (dataUrl.length > maxDataUrlLength) {
      return NextResponse.json(
        { 
          error: `Kích thước ảnh sau khi xử lý vẫn quá lớn (${Math.round(buffer.length / 1024)}KB file → ${Math.round(dataUrl.length / 1024)}KB data URL). Vui lòng thử lại với ảnh nhỏ hơn hoặc crop lại.`,
          dataUrlLength: dataUrl.length,
          maxLength: maxDataUrlLength,
          fileSize: buffer.length
        },
        { status: 400 }
      )
    }
    
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

