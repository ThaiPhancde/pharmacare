import { readMultipartFormData } from 'h3'
import { Medicine, Stock } from '~/server/models'
import { analyzeMedicineImageWithRetry } from '~/server/services/geminiVision'
import {
  deleteFile,
  generateUniqueFilename,
  moveToStorage,
  optimizeImage,
  saveUploadedFile,
  validateImage,
} from '~/server/services/imageUpload'

export default defineEventHandler(async (event) => {
  try {
    // Parse multipart form-data
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      return {
        success: false,
        message: 'No file uploaded',
        data: null,
      }
    }

    // Find image and sessionId from formData
    const imageFile = formData.find(part => part.name === 'image')
    const sessionIdPart = formData.find(part => part.name === 'sessionId')

    if (!imageFile) {
      return {
        success: false,
        message: 'Image file is required',
        data: null,
      }
    }

    if (!sessionIdPart) {
      return {
        success: false,
        message: 'SessionId is required',
        data: null,
      }
    }

    const sessionId = sessionIdPart.data.toString()

    // Validate image
    const validation = validateImage({
      type: imageFile.type,
      size: imageFile.data.length,
    })

    if (!validation.valid) {
      return {
        success: false,
        message: validation.error || 'Invalid image',
        data: null,
      }
    }

    // Generate unique filename
    const filename = generateUniqueFilename(imageFile.filename || 'upload.jpg')

    // Save to temp directory
    const tempPath = await saveUploadedFile(imageFile.data, filename)

    let optimizedPath = tempPath
    let imageUrl = ''

    try {
      // Optimize image
      optimizedPath = await optimizeImage(tempPath)

      // Analyze with Gemini Vision API
      console.warn('[Image Recognition] Analyzing with Gemini Vision API...')
      const recognized = await analyzeMedicineImageWithRetry(optimizedPath)

      console.warn(`[Image Recognition] Confidence: ${recognized.confidence}%`)

      // Search database if confidence is high enough
      let databaseMatch: any = { found: false, medicines: [] }

      if (recognized.confidence > 50 && (recognized.medicineName || recognized.genericName || recognized.brandName)) {
        // Build search terms
        const searchTerms = [
          recognized.medicineName,
          recognized.brandName,
          recognized.genericName,
        ].filter(Boolean).join('|')

        console.warn('[Image Recognition] Searching database with terms:', searchTerms)

        // Search Medicine collection
        const medicines = await Medicine.find({
          $or: [
            { name: { $regex: searchTerms, $options: 'i' } },
            { generic: { $regex: searchTerms, $options: 'i' } },
          ],
        }).limit(5).lean()

        if (medicines.length > 0) {
          // Get stock information for each medicine
          const results = await Promise.all(
            medicines.map(async (med: any) => {
              const stock = await Stock.findOne({ medicine_id: med._id }).lean()

              // Check expiry
              const expiryDate = (stock as any)?.expiry_date ? new Date((stock as any).expiry_date) : null
              const isExpired = expiryDate ? expiryDate < new Date() : false
              const daysUntilExpiry = expiryDate
                ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null

              return {
                id: med._id.toString(),
                name: med.name,
                generic: med.generic || 'N/A',
                price: med.price || 0,
                unit: med.unit || 'viên',
                stockQuantity: (stock as any)?.quantity || 0,
                batchCode: (stock as any)?.batch_code || 'N/A',
                expiryDate: expiryDate?.toLocaleDateString('vi-VN') || 'Không có thông tin',
                isExpired,
                daysUntilExpiry,
                status: isExpired
                  ? 'Hết hạn'
                  : ((stock as any)?.quantity || 0) > 0
                    ? 'Còn hàng'
                    : 'Hết hàng',
              }
            }),
          )

          databaseMatch = {
            found: true,
            medicines: results,
          }

          console.warn(`[Image Recognition] Found ${results.length} matching medicines in database`)
        }
        else {
          console.warn('[Image Recognition] No matching medicines found in database')
        }
      }
      else {
        console.warn('[Image Recognition] Confidence too low or no medicine name detected')
      }

      // Move optimized image to permanent storage
      imageUrl = await moveToStorage(optimizedPath)

      return {
        success: true,
        data: {
          recognized: {
            medicineName: recognized.medicineName,
            brandName: recognized.brandName,
            genericName: recognized.genericName,
            ingredients: recognized.ingredients,
            manufacturer: recognized.manufacturer,
            expiryDate: recognized.expiryDate,
            batchNumber: recognized.batchNumber,
            dosageForm: recognized.dosageForm,
            strength: recognized.strength,
            confidence: recognized.confidence,
          },
          databaseMatch,
          imageUrl,
          sessionId,
        },
        message: recognized.confidence > 70
          ? 'Nhận diện thành công'
          : recognized.confidence > 50
            ? 'Nhận diện không chắc chắn, vui lòng kiểm tra lại'
            : 'Không thể nhận diện thuốc từ ảnh này',
      }
    }
    catch (error: any) {
      console.error('[Image Recognition] Processing error:', error)

      // Clean up files on error
      deleteFile(tempPath)
      if (optimizedPath !== tempPath) {
        deleteFile(optimizedPath)
      }

      return {
        success: false,
        message: `Lỗi xử lý ảnh: ${error.message}`,
        data: null,
      }
    }
  }
  catch (error: any) {
    console.error('[Image Recognition] API error:', error)
    return {
      success: false,
      message: error.message || 'Internal server error',
      data: null,
    }
  }
})
