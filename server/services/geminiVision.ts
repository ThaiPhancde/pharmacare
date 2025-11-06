import process from 'node:process'
import fs from 'node:fs'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyDVqknKtMNdW7EUoROduEZTddjQnNLOHCs'
const genAI = new GoogleGenerativeAI(apiKey)

export interface MedicineRecognitionResult {
  medicineName: string | null
  brandName: string | null
  genericName: string | null
  ingredients: string[]
  manufacturer: string | null
  expiryDate: string | null
  batchNumber: string | null
  dosageForm: string | null
  strength: string | null
  confidence: number
}

/**
 * Analyze medicine image using Gemini Vision API
 */
export async function analyzeMedicineImage(imagePath: string): Promise<MedicineRecognitionResult> {
  try {
    console.log('[Gemini Vision] Analyzing image:', imagePath)

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`)
    }

    // Initialize model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    // Read image as base64
    const imageBuffer = fs.readFileSync(imagePath)
    const base64Image = imageBuffer.toString('base64')

    // Optimized prompt for medicine recognition
    const prompt = `Bạn là chuyên gia dược sĩ AI. Phân tích hình ảnh thuốc này và trả về thông tin dưới dạng JSON CHÍNH XÁC.

QUY TẮC QUAN TRỌNG:
1. Trả về ĐÚNG format JSON như mẫu bên dưới
2. Nếu không nhìn rõ thông tin nào thì để null (không phải "null" string)
3. confidence: 0-100 (mức độ tự tin về kết quả nhận diện)
4. Nếu ảnh KHÔNG PHẢI thuốc → confidence = 0
5. KHÔNG thêm bất kỳ text nào ngoài JSON

FORMAT JSON YÊU CẦU:
{
  "medicineName": "Tên đầy đủ của thuốc (VD: Paracetamol 500mg)",
  "brandName": "Tên thương hiệu nếu có (VD: Hapacol, Efferalgan, Tylenol)",
  "genericName": "Tên hoạt chất chính (VD: Paracetamol)",
  "ingredients": ["Danh sách hoạt chất nếu có nhiều"],
  "manufacturer": "Tên công ty sản xuất",
  "expiryDate": "Hạn sử dụng (format: DD/MM/YYYY hoặc MM/YYYY)",
  "batchNumber": "Số lô sản xuất",
  "dosageForm": "Dạng bào chế (viên nén, viên nang, siro, thuốc tiêm...)",
  "strength": "Hàm lượng (VD: 500mg, 250mg/5ml)",
  "confidence": 85
}

HƯỚNG DẪN CHI TIẾT:
- medicineName: Tên đầy đủ ghi trên hộp (bao gồm hàm lượng nếu có)
- brandName: Tên thương mại, tên riêng của hãng
- genericName: Tên hoạt chất quốc tế (INN)
- ingredients: Mảng các hoạt chất (nếu thuốc phối hợp)
- manufacturer: Công ty sản xuất/phân phối
- expiryDate: Ngày hết hạn (ưu tiên format DD/MM/YYYY)
- batchNumber: Số LOT hoặc Batch
- dosageForm: Dạng thuốc cụ thể
- strength: Nồng độ/hàm lượng hoạt chất
- confidence: Điểm tự tin (cao nếu ảnh rõ, thấp nếu mờ)

VÍ DỤ OUTPUT HỢP LỆ:
{
  "medicineName": "Paracetamol 500mg",
  "brandName": "Hapacol",
  "genericName": "Paracetamol",
  "ingredients": ["Paracetamol 500mg"],
  "manufacturer": "DHG Pharma",
  "expiryDate": "12/2025",
  "batchNumber": "LOT123456",
  "dosageForm": "Viên nén bao phim",
  "strength": "500mg",
  "confidence": 92
}

Bây giờ hãy phân tích ảnh và TRẢ VỀ JSON (không có text khác):
`

    // Call Gemini API
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image,
        },
      },
      { text: prompt },
    ])

    const response = result.response.text()
    console.log('[Gemini Vision] Raw response:', response)

    // Parse JSON from response (might have markdown code blocks)
    let jsonText = response.trim()

    // Remove markdown code blocks if present
    if (jsonText.includes('```json')) {
      jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    }
    else if (jsonText.includes('```')) {
      jsonText = jsonText.replace(/```\s*/g, '')
    }

    // Try to find JSON object in the response
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[Gemini Vision] No JSON found in response:', response)
      throw new Error('Không thể parse JSON từ Gemini response')
    }

    const data: MedicineRecognitionResult = JSON.parse(jsonMatch[0])

    // Validate required fields
    if (typeof data.confidence !== 'number') {
      data.confidence = 0
    }

    console.log('[Gemini Vision] Parsed result:', data)
    return data
  }
  catch (error: any) {
    console.error('[Gemini Vision] Error:', error)

    // Return default low-confidence result on error
    return {
      medicineName: null,
      brandName: null,
      genericName: null,
      ingredients: [],
      manufacturer: null,
      expiryDate: null,
      batchNumber: null,
      dosageForm: null,
      strength: null,
      confidence: 0,
    }
  }
}

/**
 * Retry wrapper with exponential backoff
 */
export async function analyzeMedicineImageWithRetry(
  imagePath: string,
  maxRetries = 2,
): Promise<MedicineRecognitionResult> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Wait before retry (exponential backoff)
        const waitTime = 2 ** attempt * 1000
        console.log(`[Gemini Vision] Retry attempt ${attempt}/${maxRetries} after ${waitTime}ms`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }

      return await analyzeMedicineImage(imagePath)
    }
    catch (error: any) {
      lastError = error
      console.error(`[Gemini Vision] Attempt ${attempt + 1} failed:`, error.message)

      // If it's a rate limit error, wait longer
      if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        const waitTime = 5000 * (attempt + 1)
        console.log(`[Gemini Vision] Rate limited, waiting ${waitTime}ms`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  // All retries failed
  console.error('[Gemini Vision] All retries failed')
  throw lastError || new Error('Failed to analyze image after retries')
}
