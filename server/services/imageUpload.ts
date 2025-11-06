import path from 'node:path'
import fs from 'node:fs'
import sharp from 'sharp'

/**
 * Validate uploaded image file
 */
export function validateImage(file: any): { valid: boolean, error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!file) {
    return { valid: false, error: 'No file provided' }
  }

  if (!allowedTypes.includes(file.type || file.mimetype)) {
    return { valid: false, error: 'Chỉ chấp nhận file ảnh JPEG/PNG' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Kích thước file tối đa 5MB' }
  }

  return { valid: true }
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const ext = path.extname(originalName)
  return `medicine_${timestamp}_${random}${ext}`
}

/**
 * Optimize image using Sharp
 * - Resize to max 1200x1200
 * - Convert to JPEG with 85% quality
 * - Strip metadata
 */
export async function optimizeImage(inputPath: string): Promise<string> {
  try {
    const outputPath = inputPath.replace(/\.(jpg|jpeg|png)$/i, '_optimized.jpg')

    await sharp(inputPath)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 85,
        progressive: true,
      })
      .toFile(outputPath)

    // Delete original file
    if (fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath)
    }

    return outputPath
  }
  catch (error: any) {
    console.error('[optimizeImage] Error:', error)
    throw new Error(`Image optimization failed: ${error.message}`)
  }
}

/**
 * Save uploaded file to temp directory
 */
export async function saveUploadedFile(fileData: Buffer, filename: string): Promise<string> {
  try {
    const tempDir = path.join(process.cwd(), 'public', 'uploads', 'temp')

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const filePath = path.join(tempDir, filename)
    fs.writeFileSync(filePath, fileData)

    return filePath
  }
  catch (error: any) {
    console.error('[saveUploadedFile] Error:', error)
    throw new Error(`Failed to save file: ${error.message}`)
  }
}

/**
 * Delete file if exists
 */
export function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }
  catch (error: any) {
    console.error('[deleteFile] Error:', error)
  }
}

/**
 * Move file to permanent storage
 */
export async function moveToStorage(tempPath: string): Promise<string> {
  try {
    const storageDir = path.join(process.cwd(), 'public', 'uploads', 'medicine-images')
    const filename = path.basename(tempPath)
    const storagePath = path.join(storageDir, filename)

    // Ensure storage directory exists
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true })
    }

    // Move file
    fs.renameSync(tempPath, storagePath)

    // Return public URL
    return `/uploads/medicine-images/${filename}`
  }
  catch (error: any) {
    console.error('[moveToStorage] Error:', error)
    throw new Error(`Failed to move file to storage: ${error.message}`)
  }
}
