import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import { mkdir } from 'fs/promises'

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

    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Create unique filename
    const filename = `${Date.now()}-${file.name.replaceAll(' ', '_')}`
    
    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public/uploads')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      // Ignore error if directory exists
    }

    // Save file to public/uploads
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // Return the public URL
    return NextResponse.json({ 
      url: `/uploads/${filename}`,
      success: true 
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

