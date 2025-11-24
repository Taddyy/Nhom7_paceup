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

    // Check file size (max 500KB for base64 data URLs to prevent database issues)
    const maxSize = 500 * 1024 // 500KB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Image is too large. Please use an image smaller than 500KB' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Convert file to base64 data URL
    // This works on both local and serverless environments
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`
    
    // Check if data URL is too long (max ~4500 chars to leave buffer for database field limit)
    if (dataUrl.length > 4500) {
      return NextResponse.json(
        { error: 'Image is too large. Please use a smaller image or compress it first.' },
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

