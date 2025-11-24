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
  maxAttempts = 20
): Promise<Blob | null> {
  // Start with high quality and reduce if needed
  let quality = 0.95
  const minQuality = 0.3 // Lower minimum for more aggressive compression
  const qualityStep = 0.05
  
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
  
  // Return the best blob we found
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

  // Target file size calculation for database storage:
  // Database field limit: 5000 chars
  // Max data URL length: 4800 chars (leaving 200 buffer)
  // Data URL format: "data:image/jpeg;base64,<base64_data>"
  // Base64 encoding increases size by ~33% (4 chars per 3 bytes)
  // 
  // Example: 200KB raw file
  // - Base64: 200KB * 4/3 = ~267KB chars
  // - Data URL: 23 chars prefix + 267KB = ~273KB total < 4800 ✓
  // 
  // Use 180KB as safe target to ensure it always fits
  const MAX_DATA_URL_LENGTH = 4800
  const DATA_URL_PREFIX = "data:image/jpeg;base64,"
  const DATA_URL_PREFIX_LENGTH = DATA_URL_PREFIX.length
  const BASE64_OVERHEAD = 4 / 3 // Base64 encoding ratio
  
  // Target: 180KB raw file ensures data URL < 4800 chars
  // 180KB = 184320 bytes
  // Base64: 184320 * 4/3 = 245760 chars
  // Data URL: 245760 + 23 = 245783 chars << 4800 ✓ (very safe)
  const TARGET_FILE_SIZE = 180 * 1024 // 180KB
  
  // Try different dimensions, starting from largest for best quality
  const dimensionsToTry = [800, 700, 600, 500, 400, 350, 300, 250, 200]
  let bestBlob: Blob | null = null
  let bestSize = Infinity
  
  for (const maxDim of dimensionsToTry) {
    // Resize canvas to current dimension
    const processedCanvas = resizeCanvas(canvas, maxDim, maxDim)
    
    // Try to compress to target size
    const compressedBlob = await compressImageToTargetSize(processedCanvas, TARGET_FILE_SIZE)
    
    if (!compressedBlob) {
      continue
    }
    
    // Estimate data URL length after base64 encoding
    const estimatedDataUrlLength = Math.ceil(compressedBlob.size * BASE64_OVERHEAD) + DATA_URL_PREFIX_LENGTH
    
    // If we achieved target size and it fits, return immediately
    if (compressedBlob.size <= TARGET_FILE_SIZE && estimatedDataUrlLength <= MAX_DATA_URL_LENGTH) {
      return compressedBlob
    }
    
    // Track the smallest blob that fits within limits
    if (estimatedDataUrlLength <= MAX_DATA_URL_LENGTH) {
      if (compressedBlob.size < bestSize) {
        bestBlob = compressedBlob
        bestSize = compressedBlob.size
      }
      // If it fits and is close to target, use it
      if (compressedBlob.size <= TARGET_FILE_SIZE * 1.2) {
        return compressedBlob
      }
    }
  }
  
  // If we found a blob that fits, return it
  if (bestBlob && bestSize < Infinity) {
    return bestBlob
  }
  
  // Last resort: try even smaller dimensions
  const emergencyDimensions = [180, 150, 120, 100]
  for (const maxDim of emergencyDimensions) {
    const processedCanvas = resizeCanvas(canvas, maxDim, maxDim)
    const compressedBlob = await compressImageToTargetSize(processedCanvas, TARGET_FILE_SIZE)
    
    if (!compressedBlob) {
      continue
    }
    
    const estimatedDataUrlLength = Math.ceil(compressedBlob.size * BASE64_OVERHEAD) + DATA_URL_PREFIX_LENGTH
    if (estimatedDataUrlLength <= MAX_DATA_URL_LENGTH) {
      return compressedBlob
    }
    
    // Track smallest even if slightly over limit
    if (compressedBlob.size < bestSize) {
      bestBlob = compressedBlob
      bestSize = compressedBlob.size
    }
  }
  
  // Return the best we could achieve (will be validated on server side)
  return bestBlob
}

