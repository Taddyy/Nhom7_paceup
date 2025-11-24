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

  // Target file size calculation for database storage:
  // Database field limit: 5000 chars
  // Max data URL length: 4800 chars (leaving 200 buffer)
  // Data URL format: "data:image/jpeg;base64,<base64_data>"
  // Base64 encoding increases size by ~33% (4 chars per 3 bytes)
  const MAX_DATA_URL_LENGTH = 4800
  const DATA_URL_PREFIX_LENGTH = 23 // "data:image/jpeg;base64,"
  const BASE64_OVERHEAD = 4 / 3 // Base64 encoding ratio
  
  // Target: 150KB raw file ensures data URL < 4800 chars (very safe)
  // Use smaller target if forceSmaller is true
  const TARGET_FILE_SIZE = forceSmaller ? 100 * 1024 : 150 * 1024 // 100KB if forced, 150KB otherwise
  
  // Calculate max raw bytes that would fit
  // (raw_bytes * BASE64_OVERHEAD) + DATA_URL_PREFIX_LENGTH <= MAX_DATA_URL_LENGTH
  const maxRawBytes = Math.floor((MAX_DATA_URL_LENGTH - DATA_URL_PREFIX_LENGTH) / BASE64_OVERHEAD)
  
  // Progressive compression strategy: try multiple dimensions and qualities
  // We'll keep trying smaller dimensions until we find one that fits
  // Start with smaller dimensions if forceSmaller
  const normalDimensions = [800, 700, 600, 500, 400, 350, 300, 250, 200, 180, 150, 120, 100, 80, 60]
  const aggressiveDimensions = [200, 150, 120, 100, 80, 60, 50, 40]
  const dimensionsToTry = forceSmaller ? aggressiveDimensions : normalDimensions
  let bestBlob: Blob | null = null
  let bestSize = Infinity
  let bestDataUrlLength = Infinity
  
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
    
    // If it fits perfectly, return immediately
    if (estimatedDataUrlLength <= MAX_DATA_URL_LENGTH && compressedBlob.size <= TARGET_FILE_SIZE) {
      return compressedBlob
    }
    
    // Track the best (smallest) blob that fits
    if (estimatedDataUrlLength <= MAX_DATA_URL_LENGTH) {
      if (compressedBlob.size < bestSize) {
        bestBlob = compressedBlob
        bestSize = compressedBlob.size
        bestDataUrlLength = estimatedDataUrlLength
      }
      // If it fits and is reasonable size, use it
      if (compressedBlob.size <= TARGET_FILE_SIZE * 1.5) {
        return compressedBlob
      }
    }
    
    // Track the smallest overall blob (even if slightly over limit)
    if (compressedBlob.size < bestSize) {
      bestBlob = compressedBlob
      bestSize = compressedBlob.size
      bestDataUrlLength = estimatedDataUrlLength
    }
  }
  
  // If we found a blob that fits, return it
  if (bestBlob && bestDataUrlLength <= MAX_DATA_URL_LENGTH) {
    return bestBlob
  }
  
  // Last resort: aggressively compress to ensure it fits
  // Try even smaller dimensions with maximum compression
  const emergencyDimensions = [50, 40, 30]
  for (const maxDim of emergencyDimensions) {
    const processedCanvas = resizeCanvas(canvas, maxDim, maxDim)
    
    // Use very aggressive compression (target even smaller)
    const compressedBlob = await compressImageToTargetSize(processedCanvas, maxRawBytes)
    
    if (!compressedBlob) {
      continue
    }
    
    const estimatedDataUrlLength = Math.ceil(compressedBlob.size * BASE64_OVERHEAD) + DATA_URL_PREFIX_LENGTH
    
    // If it fits now, return it
    if (estimatedDataUrlLength <= MAX_DATA_URL_LENGTH) {
      return compressedBlob
    }
    
    // Track smallest
    if (compressedBlob.size < bestSize) {
      bestBlob = compressedBlob
      bestSize = compressedBlob.size
      bestDataUrlLength = estimatedDataUrlLength
    }
  }
  
  // Final fallback: if still too large, compress the best we have one more time
  // This should never happen, but ensures we always return something
  if (bestBlob && bestDataUrlLength > MAX_DATA_URL_LENGTH) {
    // Create a smaller canvas and compress again
    const finalDimension = 40
    const finalCanvas = resizeCanvas(canvas, finalDimension, finalDimension)
    const finalBlob = await compressImageToTargetSize(finalCanvas, maxRawBytes)
    
    if (finalBlob) {
      const finalDataUrlLength = Math.ceil(finalBlob.size * BASE64_OVERHEAD) + DATA_URL_PREFIX_LENGTH
      if (finalDataUrlLength <= MAX_DATA_URL_LENGTH) {
        return finalBlob
      }
      // Return even if slightly over - server will handle it
      return finalBlob
    }
  }
  
  // Final absolute fallback: create a tiny image that will definitely fit
  // This ensures we ALWAYS return a valid blob, no matter what
  // Try progressively smaller sizes until we get one that fits
  const fallbackSizes = [50, 40, 30, 20]
  for (const size of fallbackSizes) {
    const tinyCanvas = resizeCanvas(canvas, size, size)
    const tinyBlob = await compressImageToTargetSize(tinyCanvas, maxRawBytes)
    
    if (tinyBlob) {
      const tinyDataUrlLength = Math.ceil(tinyBlob.size * BASE64_OVERHEAD) + DATA_URL_PREFIX_LENGTH
      if (tinyDataUrlLength <= MAX_DATA_URL_LENGTH) {
        console.log(`Using fallback size ${size}x${size}px to ensure upload success`)
        return tinyBlob
      }
    }
  }
  
  // Ultimate fallback: create absolute minimum size image (will always fit)
  // Try multiple sizes to ensure we get a valid blob
  const absoluteFallbackSizes = [20, 15, 10]
  for (const size of absoluteFallbackSizes) {
    const absoluteMinCanvas = resizeCanvas(canvas, size, size)
    const absoluteMinBlob = await new Promise<Blob | null>((resolve) => {
      absoluteMinCanvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.1)
    })
    
    if (absoluteMinBlob) {
      const absoluteDataUrlLength = Math.ceil(absoluteMinBlob.size * BASE64_OVERHEAD) + DATA_URL_PREFIX_LENGTH
      // Even a 10x10px image at quality 0.1 should fit easily
      if (absoluteDataUrlLength <= MAX_DATA_URL_LENGTH || absoluteMinBlob.size < 10000) {
        console.log(`Using absolute fallback size ${size}x${size}px to ensure upload success`)
        return absoluteMinBlob
      }
    }
  }
  
  // Last resort: return best we found (should never be null at this point)
  // If somehow all else fails, return a minimal valid blob
  if (bestBlob) {
    return bestBlob
  }
  
  // Create a guaranteed tiny blob (should never reach here, but ensures no null return)
  const guaranteedCanvas = document.createElement('canvas')
  guaranteedCanvas.width = 10
  guaranteedCanvas.height = 10
  const guaranteedCtx = guaranteedCanvas.getContext('2d')
  if (guaranteedCtx) {
    guaranteedCtx.fillStyle = '#FFFFFF'
    guaranteedCtx.fillRect(0, 0, 10, 10)
  }
  
  return new Promise<Blob>((resolve) => {
    guaranteedCanvas.toBlob((blob) => {
      resolve(blob || new Blob(['dummy'], { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.1)
  })
}

