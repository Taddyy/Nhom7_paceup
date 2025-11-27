export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous') // needed to avoid cross-origin issues on CodeSandbox
    image.src = url
  })

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation)

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}

/**
 * Compress image to target size with adaptive quality
 * Tries different quality levels to achieve target file size while maintaining best possible quality
 */
async function compressImageToTargetSize(
  canvas: HTMLCanvasElement,
  targetSizeBytes: number,
  maxAttempts = 30
): Promise<Blob | null> {
  // Start with high quality and reduce if needed
  let quality = 0.95
  const minQuality = 0.1 // Very low minimum for maximum compression
  const qualityStep = 0.03 // Smaller steps for finer control
  
  let bestBlob: Blob | null = null
  let bestSize = Infinity
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/jpeg', quality)
    })
    
    if (!blob) {
      // If we can't create blob, try lower quality
      quality = Math.max(minQuality, quality - qualityStep)
      continue
    }
    
    // Track the best (smallest) blob we've found
    if (blob.size < bestSize) {
      bestBlob = blob
      bestSize = blob.size
    }
    
    // Check if we've achieved target size
    if (blob.size <= targetSizeBytes) {
      return blob
    }
    
    // If this is the last attempt, return best blob we found
    if (attempt === maxAttempts - 1) {
      return bestBlob
    }
    
    // Reduce quality for next attempt
    quality = Math.max(minQuality, quality - qualityStep)
  }
  
  // Return the best blob we found (should always exist)
  return bestBlob
}

/**
 * Resize canvas to fit within max dimensions while maintaining aspect ratio
 */
function resizeCanvas(
  canvas: HTMLCanvasElement,
  maxWidth: number,
  maxHeight: number
): HTMLCanvasElement {
  const width = canvas.width
  const height = canvas.height
  
  // Calculate new dimensions
  let newWidth = width
  let newHeight = height
  
  if (width > maxWidth || height > maxHeight) {
    const scale = Math.min(maxWidth / width, maxHeight / height)
    newWidth = Math.round(width * scale)
    newHeight = Math.round(height * scale)
    
    // Create new canvas with resized dimensions
    const resizedCanvas = document.createElement('canvas')
    const ctx = resizedCanvas.getContext('2d')
    if (!ctx) {
      return canvas
    }
    
    resizedCanvas.width = newWidth
    resizedCanvas.height = newHeight
    
    // Draw with high quality scaling
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(canvas, 0, 0, newWidth, newHeight)
    
    return resizedCanvas
  }
  
  return canvas
}

/**
 * This function was adapted from the one in the ReadMe of https://github.com/DominicTobias/react-image-crop
 * Now includes adaptive compression to achieve optimal quality within size limits
 * 
 * @param forceSmaller - If true, will use more aggressive compression settings
 */
export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  flip = { horizontal: false, vertical: false },
  forceSmaller = false
): Promise<Blob | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    // Return a minimal valid blob instead of null
    const fallbackCanvas = document.createElement('canvas')
    fallbackCanvas.width = 10
    fallbackCanvas.height = 10
    const fallbackCtx = fallbackCanvas.getContext('2d')
    if (fallbackCtx) {
      fallbackCtx.fillStyle = '#FFFFFF'
      fallbackCtx.fillRect(0, 0, 10, 10)
    }
    return new Promise<Blob>((resolve) => {
      fallbackCanvas.toBlob((blob) => {
        resolve(blob || new Blob(['dummy'], { type: 'image/jpeg' }))
      }, 'image/jpeg', 0.1)
    })
  }

  const rotRad = getRadianAngle(rotation)

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  )

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth
  canvas.height = bBoxHeight

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
  ctx.translate(-image.width / 2, -image.height / 2)

  // draw image
  ctx.drawImage(image, 0, 0)

  // croppedAreaPixels values are bounding box relative
  // extract the cropped image using these values
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  )

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // paste generated rotate image at the top left corner
  ctx.putImageData(data, 0, 0)

  // No compression constraints - upload directly to Cloudinary
  // Cloudinary handles optimization automatically
  // Only resize to reasonable dimensions for web display
  const MAX_DIMENSION = 2000 // Max dimension for web display (no aggressive compression)
  
  // Resize to max dimension if needed (for web display optimization)
  // But keep high quality - no aggressive compression
  const processedCanvas = canvas.width > MAX_DIMENSION || canvas.height > MAX_DIMENSION
    ? resizeCanvas(canvas, MAX_DIMENSION, MAX_DIMENSION)
    : canvas
  
  // Convert to blob with high quality (0.95) - no compression constraints
  // Cloudinary will handle optimization on their end
  return new Promise<Blob | null>((resolve) => {
    processedCanvas.toBlob((blob) => {
      resolve(blob)
    }, 'image/jpeg', 0.95) // High quality, no compression
  })
}

