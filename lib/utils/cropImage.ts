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
  maxAttempts = 10
): Promise<Blob | null> {
  // Start with high quality and reduce if needed
  let quality = 0.95
  const minQuality = 0.5
  const qualityStep = 0.05
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/jpeg', quality)
    })
    
    if (!blob) {
      return null
    }
    
    // Check if we've achieved target size
    if (blob.size <= targetSizeBytes) {
      return blob
    }
    
    // If this is the last attempt, return current blob anyway
    if (attempt === maxAttempts - 1) {
      return blob
    }
    
    // Reduce quality for next attempt
    quality = Math.max(minQuality, quality - qualityStep)
  }
  
  return null
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
 */
export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<Blob | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
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

  // Target file size: 320KB original file
  // After base64 encoding: ~427KB (~33% overhead)
  // Data URL string: ~430KB which fits in database field (5000 chars limit)
  const TARGET_FILE_SIZE = 320 * 1024 // 320KB
  
  // Try different dimensions, starting from largest for best quality
  // Progressive approach: try larger size first, then reduce if needed
  const dimensionsToTry = [800, 700, 600, 500, 400]
  let bestBlob: Blob | null = null
  
  for (const maxDim of dimensionsToTry) {
    // Resize canvas to current dimension
    const processedCanvas = resizeCanvas(canvas, maxDim, maxDim)
    
    // Try to compress to target size
    const compressedBlob = await compressImageToTargetSize(processedCanvas, TARGET_FILE_SIZE)
    
    if (!compressedBlob) {
      continue
    }
    
    // If we achieved target size, this is optimal - return immediately
    if (compressedBlob.size <= TARGET_FILE_SIZE) {
      return compressedBlob
    }
    
    // If this is better than previous attempts, save it
    if (!bestBlob || compressedBlob.size < bestBlob.size) {
      bestBlob = compressedBlob
    }
    
    // If current blob is already small enough (close to target), use it
    // Don't need to try smaller dimensions if we're close
    if (compressedBlob.size <= TARGET_FILE_SIZE * 1.2) {
      return compressedBlob
    }
  }
  
  // Return the best blob we found (even if slightly over target)
  return bestBlob
}

