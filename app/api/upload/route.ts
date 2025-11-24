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
    
    // Check actual buffer size (after cropping/resizing in frontend)
    // Allow up to 400KB for original file (base64 will be ~533KB, data URL ~535KB)
    // This should result in data URL ~535KB which fits in 5000 char field
    const maxSize = 400 * 1024 // 400KB original file
    if (buffer.length > maxSize) {
      return NextResponse.json(
        { 
          error: `Ảnh quá lớn (${Math.round(buffer.length / 1024)}KB). Vui lòng sử dụng ảnh nhỏ hơn 400KB hoặc chọn chất lượng thấp hơn.`,
          size: buffer.length,
          maxSize: maxSize
        },
        { status: 400 }
      )
    }
    
    // Convert file to base64 data URL
    // This works on both local and serverless environments
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type || 'image/jpeg'};base64,${base64}`
    
    // Check if data URL is too long (max ~4800 chars to leave buffer for database field limit of 5000)
    if (dataUrl.length > 4800) {
      return NextResponse.json(
        { 
          error: `Kích thước ảnh sau khi xử lý quá lớn (${Math.round(dataUrl.length / 1024)}KB). Vui lòng sử dụng ảnh nhỏ hơn.`,
          dataUrlLength: dataUrl.length
        },
        { status: 400 }
      )
    }

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

