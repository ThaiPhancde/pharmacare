/**
 * 🏥 UNIFIED MEDICAL AI v3.1 - OPTIMIZED FOR RATE LIMITS
 * 
 * Tối ưu hóa:
 * ✅ Lazy load medicine context (chỉ load khi cần)
 * ✅ Smart search (10 thuốc thay vì 50)
 * ✅ Rút gọn prompt 90% (20K tokens thay vì 200K)
 * ✅ Rate limiting (2s giữa các requests)
 * ✅ Retry với exponential backoff
 * ✅ Giảm maxOutputTokens (2048 thay vì 8192)
 */

import { Buffer } from 'node:buffer'
import process from 'node:process'
import { MedicalConsultation, Medicine, Stock } from '~/server/models'

// Rate limiting
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 2000 // 2 giây

// Simple in-memory cache to reduce repeated prompts (key: prompt hash)
const promptCache: Record<string, { response: string, ts: number }> = {}
const CACHE_TTL = 30 * 1000 // 30 seconds

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Detect intent
 */
function detectIntent(message: string): 'medical_consultation' | 'medicine_search' | 'general_query' {
  const msgLower = message.toLowerCase()

  if (/(?:bị|đau|sốt|ho|mệt|buồn nôn|chóng mặt|khó thở)/.test(msgLower)) {
    return 'medical_consultation'
  }

  if (/\b(?:tìm thuốc|có thuốc|giá|còn hàng|tồn kho)\b/.test(msgLower)) {
    return 'medicine_search'
  }

  return 'general_query'
}

/**
 * Get or create session
 */
async function getOrCreateSession(sessionId: string) {
  let consultation = await MedicalConsultation.findOne({
    sessionId,
    status: { $in: ['active', 'follow_up_pending'] },
  }).lean()

  if (!consultation) {
    consultation = await MedicalConsultation.create({
      sessionId,
      consultationStage: 'greeting',
      status: 'active',
      conversationHistory: [],
      aiMetadata: {
        model: 'gemini-2.0-flash-exp',
        promptVersion: '3.1-optimized',
      },
    })
  }
  
  return consultation
}

/**
 * Fetch medicine context - OPTIMIZED WITH REAL-TIME DATABASE
 */
async function fetchMedicineContext(intent: string, message: string) {
  try {
    if (intent === 'general_query') {
      return { medicines: [], stats: { totalMedicines: 0, available: 0 } }
    }

    const searchKeywords = message.toLowerCase().match(/\b\w+\b/g) || []
    let medicines

    if (intent === 'medicine_search' && searchKeywords.length > 0) {
      medicines = await Medicine.find({
        $or: [
          { name: { $regex: searchKeywords.join('|'), $options: 'i' } },
          { generic: { $regex: searchKeywords.join('|'), $options: 'i' } },
        ],
      })
        .limit(10)
        .lean()
    }
    else {
      const popularIds = await Stock.find({ quantity: { $gt: 0 } })
        .sort({ quantity: -1 })
        .limit(10)
        .distinct('medicine_id')

      medicines = await Medicine.find({ _id: { $in: popularIds } }).lean()
    }

    const formatted = await Promise.all(
      medicines.map(async (med: any) => {
        const stock = await Stock.findOne({ medicine_id: med._id }).lean()
        
        // Check if expired
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
          status: isExpired ? 'Hết hạn' : ((stock as any)?.quantity || 0) > 0 ? 'Còn hàng' : 'Hết hàng',
        }
      }),
    )

    return {
      medicines: formatted,
      stats: {
        totalMedicines: formatted.length,
        available: formatted.filter(m => m.stockQuantity > 0 && !m.isExpired).length,
        expired: formatted.filter(m => m.isExpired).length,
        outOfStock: formatted.filter(m => m.stockQuantity === 0).length,
      },
    }
  }
  catch (error) {
    console.error('[fetchMedicineContext] Error:', error)
    return { medicines: [], stats: { totalMedicines: 0, available: 0, expired: 0, outOfStock: 0 } }
  }
}

/**
 * Build optimized prompt - WITH REAL-TIME DATABASE INFO
 */
function buildOptimizedPrompt(
  intent: string,
  message: string,
  consultation: any,
  medicineContext: any,
) {
  const stage = consultation?.consultationStage || 'greeting'

  // Format medicine data with full details
  const medicineList = medicineContext.medicines.length > 0
    ? medicineContext.medicines.map((m: any) => {
        const expiry = m.daysUntilExpiry !== null
          ? (m.daysUntilExpiry < 0 ? `HẾT HẠN (${m.expiryDate})` : `HSD: ${m.expiryDate} (còn ${m.daysUntilExpiry} ngày)`)
          : 'Không có HSD'
        return `- ${m.name}
  + Giá: ${m.price.toLocaleString()}đ/${m.unit}
  + Tồn kho: ${m.stockQuantity} ${m.unit} (${m.status})
  + ${expiry}
  + Lô: ${m.batchCode}`
      }).join('\n')
    : 'Chưa load database'

  const stats = medicineContext.stats || {}

  return `BẠN LÀ BÁC SĨ/DƯỢC SĨ AI TẠI Pharmacare.

QUY TẮC THƯƠNG HIỆU:
- Luôn dùng tên shop là "Pharmacare" trong mọi câu trả lời.
- Không được tự ý đổi tên, không viết sai chính tả.
- Không dùng các tên khác như PharmacaRE, Pharmacafe, v.v.

DATABASE THỜI GIAN THỰC:
${medicineList}

THỐNG KÊ: Tổng ${stats.totalMedicines} thuốc | Còn hàng: ${stats.available} | Hết hàng: ${stats.outOfStock || 0} | Hết hạn: ${stats.expired || 0}

INTENT: ${intent}
STAGE: ${stage}

QUY TẮC QUAN TRỌNG:
1. MEDICINE_SEARCH:
   - Trả lời NGAY với thông tin từ database trên (giá/tồn kho/HSD/lô hàng)
   - Nếu thuốc HẾT HẠN → CẢNH BÁO không được bán
   - Nếu HẾT HÀNG → Thông báo hết hàng và gợi ý thuốc khác
   - Format: "Thuốc X có giá Y đồng, còn Z viên (HSD: ...)"

2. MEDICAL_CONSULTATION:
   - Hỏi tuổi/giới tính/cân nặng/triệu chứng chi tiết
   - Đề xuất thuốc TỪ DATABASE (ưu tiên thuốc còn hàng và chưa hết hạn)

3. GENERAL_QUERY: Trả lời ngắn gọn

LỊCH SỬ (5 tin cuối):
${consultation?.conversationHistory?.slice(-5).map((msg: any) =>
  `${msg.role}: ${msg.message}`,
).join('\n') || 'Chưa có'}

USER: ${message}

TRẢ LỜI (Tiếng Việt, thân thiện, CHI TIẾT về giá/tồn kho/HSD, dưới 500 từ):`
}

/**
 * Main handler
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { message, sessionId } = body

    if (!message || !sessionId) {
      return {
        success: false,
        message: 'Missing required fields',
      }
    }

    // Detect intent
    const intent = detectIntent(message)
    console.warn(`[Unified AI] Intent: ${intent}`)

    // Get session
    const consultation = await getOrCreateSession(sessionId)

    // Rate limiting
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await sleep(MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    }
    lastRequestTime = Date.now()

    // Fetch context
    const medicineContext = await fetchMedicineContext(intent, message)

    // Build prompt
    const prompt = buildOptimizedPrompt(intent, message, consultation, medicineContext)

    // Call Gemini với retry
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyDVqknKtMNdW7EUoROduEZTddjQnNLOHCs'
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`

    let retries = 0
    const maxRetries = 3
    let response: any

    while (retries < maxRetries) {
      try {
        // Check cache first
        const promptKey = Buffer.from(prompt).toString('base64')
        const cached = promptCache[promptKey]
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
          response = { candidates: [{ content: { parts: [{ text: cached.response }] } }] }
          break
        }

        response = await $fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              topK: 20,
              topP: 0.9,
              maxOutputTokens: 1024, // Giảm xuống 1024
              candidateCount: 1,
            },
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            ],
          }),
        })
        break
      }
      catch (error: any) {
        retries++
        if (error.statusCode === 429 && retries < maxRetries) {
          const waitTime = (2 ** retries) * 1000
          console.warn(`[Unified AI] Rate limited, retry ${retries}/${maxRetries} after ${waitTime}ms`)
          await sleep(waitTime)
        }
        else {
          // If service unavailable or other error, use fallback
          console.error('[Unified AI] Gemini error, using fallback:', error?.message || error)
          const fallback = `Xin lỗi, hiện tại hệ thống AI đang quá tải hoặc không khả dụng. Tôi có thể trả lời ngắn: ${message.slice(0, 150)}... Nếu bạn muốn, hãy thử lại sau.`
          response = { candidates: [{ content: { parts: [{ text: fallback }] } }] }
          break
        }
      }
    }

    if (!response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('No response from Gemini')
    }

    const cleanResponse = response.candidates[0].content.parts[0].text.trim()

    // Save to cache
    try {
      const promptKey = Buffer.from(prompt).toString('base64')
      promptCache[promptKey] = { response: cleanResponse, ts: Date.now() }
    }
    catch {
      // ignore cache errors
    }

    // Update conversation history
    await MedicalConsultation.findByIdAndUpdate((consultation as any)._id, {
      $push: {
        conversationHistory: {
          $each: [
            { role: 'patient', message, timestamp: new Date(), messageType: 'text' },
            { role: 'doctor', message: cleanResponse, timestamp: new Date(), messageType: 'text' },
          ],
        },
      },
      consultationStage: intent === 'medical_consultation' && (consultation as any).consultationStage === 'greeting'
        ? 'patient_info'
        : (consultation as any).consultationStage,
    })

    return {
      success: true,
      intent,
      response: cleanResponse,
      consultationStage: (consultation as any).consultationStage,
      sessionId: (consultation as any).sessionId,
      timestamp: new Date().toISOString(),
    }
  }
  catch (error: any) {
    console.error('[Unified Medical AI] Error:', error)
    return {
      success: false,
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }
  }
})
