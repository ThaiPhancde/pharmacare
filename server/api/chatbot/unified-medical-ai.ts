/**
 * 🏥 UNIFIED MEDICAL AI v3.3 - WITH OFFLINE FALLBACK
 * 
 * Tối ưu hóa:
 * ✅ Lazy load medicine context (chỉ load khi cần)
 * ✅ Smart search (10 thuốc thay vì 50)
 * ✅ Rút gọn prompt 90% (20K tokens thay vì 200K)
 * ✅ Rate limiting (8s giữa các requests) - INCREASED
 * ✅ Retry với exponential backoff
 * ✅ Giảm maxOutputTokens (1024)
 * ✅ Local responses cho greetings/thanks - NEW
 * ✅ Smart cache với TTL theo intent - NEW
 * ✅ Enhanced intent detection - NEW
 * ✅ OFFLINE AI FALLBACK - Trả lời thông minh khi bị rate limit - NEW v3.3
 */

import { Buffer } from 'node:buffer'
import process from 'node:process'
import crypto from 'node:crypto'
import { MedicalConsultation, Medicine, Stock, ChatbotQA } from '~/server/models'

// ============== CONFIGURATION ==============
const CONFIG = {
  MIN_REQUEST_INTERVAL: 10000, // 10 giây - tăng thêm để tránh rate limit
  MAX_RETRIES: 2, // Giảm xuống 2 để không chờ quá lâu
  MAX_HISTORY: 3,
  CACHE_TTL: {
    medicine_search: 10 * 60 * 1000,   // 10 phút cho tìm thuốc
    general_query: 15 * 60 * 1000,     // 15 phút cho câu hỏi chung
    medical_consultation: 5 * 60 * 1000, // 5 phút cho tư vấn y tế
  },
}

// Rate limiting
let lastRequestTime = 0

// Smart cache với Map
const responseCache = new Map<string, { response: string, ts: number, intent: string }>()

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generate cache key từ message và intent
 */
function getCacheKey(message: string, intent: string): string {
  const normalized = message.toLowerCase().trim().replace(/\s+/g, ' ')
  const hash = crypto.createHash('md5').update(`${intent}:${normalized}`).digest('hex')
  return hash.substring(0, 16)
}

/**
 * Get from cache if valid
 */
function getFromCache(key: string, intent: string): string | null {
  const cached = responseCache.get(key)
  if (!cached) return null
  
  const ttl = CONFIG.CACHE_TTL[intent as keyof typeof CONFIG.CACHE_TTL] || 60000
  if (Date.now() - cached.ts > ttl) {
    responseCache.delete(key)
    return null
  }
  
  return cached.response
}

/**
 * Save to cache
 */
function saveToCache(key: string, response: string, intent: string): void {
  responseCache.set(key, { response, ts: Date.now(), intent })
  
  // Cleanup old entries (keep max 100)
  if (responseCache.size > 100) {
    const oldest = Array.from(responseCache.entries())
      .sort((a, b) => a[1].ts - b[1].ts)
      .slice(0, 20)
    oldest.forEach(([k]) => responseCache.delete(k))
  }
}

/**
 * 🔍 SEARCH QA DATABASE - Tìm kiếm trong dữ liệu QA từ Chatbot Management
 * Sử dụng dữ liệu đã được quản lý từ trang Admin Chatbot
 */
async function searchQADatabase(message: string): Promise<{ found: boolean, answer: string | null, category: string | null, confidence: number }> {
  try {
    const msgLower = message.toLowerCase().trim()
    
    // 1. Tìm kiếm chính xác trước
    const exactMatch = await ChatbotQA.findOne({
      question: { $regex: new RegExp(`^${escapeRegexString(msgLower)}$`, 'i') }
    })
    
    if (exactMatch) {
      console.log(`[QA Search] Exact match found: "${exactMatch.question}"`)
      return {
        found: true,
        answer: exactMatch.answer,
        category: exactMatch.category || 'general',
        confidence: 100
      }
    }
    
    // 2. Tìm kiếm theo từ khóa
    const keywords = msgLower.split(/\s+/).filter(word => word.length > 2)
    
    if (keywords.length === 0) {
      return { found: false, answer: null, category: null, confidence: 0 }
    }
    
    // 3. Tìm kiếm text search
    try {
      const textSearchResults = await ChatbotQA.find(
        { $text: { $search: keywords.join(' ') } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(3)
      
      if (textSearchResults.length > 0) {
        const topResult = textSearchResults[0] as any
        const score = topResult._doc?.score || 0
        const confidence = Math.min(Math.round(score * 25), 95) // Cap at 95 for text search
        
        if (confidence >= 40) { // Ngưỡng tối thiểu
          console.log(`[QA Search] Text search found: "${topResult.question}" (confidence: ${confidence}%)`)
          return {
            found: true,
            answer: topResult.answer,
            category: topResult.category || 'general',
            confidence
          }
        }
      }
    } catch (textSearchError) {
      console.log('[QA Search] Text search failed, trying regex search')
    }
    
    // 4. Fallback: tìm kiếm regex với từ khóa
    const regexPattern = keywords.map(k => `(?=.*${escapeRegexString(k)})`).join('')
    const regexResults = await ChatbotQA.find({
      $or: [
        { question: { $regex: new RegExp(regexPattern, 'i') } },
        { keywords: { $regex: new RegExp(keywords.join('|'), 'i') } },
        { medicineTerms: { $regex: new RegExp(keywords.join('|'), 'i') } }
      ]
    }).limit(5)
    
    if (regexResults.length > 0) {
      // Tính điểm cho mỗi kết quả
      let bestMatch = regexResults[0]
      let bestScore = 0
      
      for (const result of regexResults) {
        let score = 0
        const questionLower = result.question.toLowerCase()
        
        for (const keyword of keywords) {
          if (questionLower.includes(keyword)) {
            score += 20
          }
          if (result.keywords?.toLowerCase().includes(keyword)) {
            score += 15
          }
          if (result.medicineTerms?.toLowerCase().includes(keyword)) {
            score += 10
          }
        }
        
        if (score > bestScore) {
          bestScore = score
          bestMatch = result
        }
      }
      
      const confidence = Math.min(bestScore, 85) // Cap at 85 for regex search
      
      if (confidence >= 30) {
        console.log(`[QA Search] Regex search found: "${bestMatch.question}" (confidence: ${confidence}%)`)
        return {
          found: true,
          answer: bestMatch.answer,
          category: bestMatch.category || 'general',
          confidence
        }
      }
    }
    
    return { found: false, answer: null, category: null, confidence: 0 }
  } catch (error) {
    console.error('[QA Search] Error:', error)
    return { found: false, answer: null, category: null, confidence: 0 }
  }
}

/**
 * Helper: Escape regex special characters
 */
function escapeRegexString(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Handle local responses without calling API
 * Trả lời local cho các câu hỏi đơn giản
 */
function handleLocalResponse(message: string): string | null {
  const msgLower = message.toLowerCase().trim()
  
  // Greetings
  if (/^(xin chào|hello|hi|chào|hey|chào bạn|alo)$/i.test(msgLower)) {
    return `Xin chào! 👋 Tôi là Bác sĩ AI của Pharmacare.

Tôi có thể giúp bạn:
✅ Tư vấn sức khỏe và triệu chứng
✅ Tìm kiếm thuốc trong kho
✅ Kiểm tra giá và tồn kho
✅ Hướng dẫn cách dùng thuốc

Bạn cần hỗ trợ gì hôm nay?`
  }
  
  // Thanks
  if (/^(cảm ơn|thanks|thank you|cám ơn|cảm ơn bạn|cảm ơn nhiều)$/i.test(msgLower)) {
    return `Không có gì! 😊 Rất vui được hỗ trợ bạn.

Chúc bạn sức khỏe! Nếu cần tư vấn thêm, hãy quay lại bất cứ lúc nào nhé! 💊`
  }
  
  // Goodbye
  if (/^(tạm biệt|bye|goodbye|bái bai|bai)$/i.test(msgLower)) {
    return `Tạm biệt! 👋 Chúc bạn một ngày tốt lành.

Hẹn gặp lại tại Pharmacare! 🏥`
  }
  
  // Store hours
  if (/giờ (mở cửa|làm việc|hoạt động)|mấy giờ mở/i.test(msgLower)) {
    return `🕐 Giờ làm việc của Pharmacare:
- Thứ 2 - Thứ 7: 7:00 - 22:00
- Chủ nhật: 8:00 - 20:00

📞 Hotline: 1900-xxxx (hỗ trợ 24/7)`
  }
  
  // Contact
  if (/liên hệ|hotline|số điện thoại|sđt/i.test(msgLower)) {
    return `📞 Thông tin liên hệ Pharmacare:
- Hotline: 1900-xxxx
- Email: support@pharmacare.vn
- Website: www.pharmacare.vn

Chúng tôi hỗ trợ 24/7!`
  }
  
  // Health consultation request - CẦN XỬ LÝ ĐẶC BIỆT
  if (/tư vấn.*(sức khỏe|bệnh|thuốc)|muốn.*tư vấn|cần.*tư vấn/i.test(msgLower)) {
    return `🩺 Tôi sẵn sàng tư vấn sức khỏe cho bạn!

Để tư vấn chính xác, vui lòng cho tôi biết:
1️⃣ **Triệu chứng** bạn đang gặp là gì? (VD: đau đầu, sốt, ho...)
2️⃣ **Thời gian** bạn bị như vậy bao lâu rồi?
3️⃣ **Thông tin cá nhân**: Tuổi, giới tính (nếu tiện)

💡 Ví dụ: "Tôi bị sốt 38 độ, đau đầu từ hôm qua, nam 25 tuổi"

⚠️ Lưu ý: Đây là tư vấn sơ bộ, bạn nên gặp bác sĩ để được khám chi tiết.`
  }
  
  return null // Cần gọi AI
}

/**
 * 🧠 OFFLINE AI FALLBACK - WITH QA DATABASE INTEGRATION
 * Trả lời thông minh dựa trên patterns, QA database và database thuốc khi API bị rate limit
 */
async function generateOfflineResponse(
  message: string, 
  intent: string, 
  medicineContext: any
): Promise<string> {
  const msgLower = message.toLowerCase()
  
  // 🆕 TÌM KIẾM TRONG QA DATABASE TRƯỚC
  try {
    const qaResult = await searchQADatabase(message)
    if (qaResult.found && qaResult.confidence >= 40) {
      console.log(`[Offline AI] Using QA Database (confidence: ${qaResult.confidence}%)`)
      
      let response = `🏥 **Pharmacare - Tư vấn dược**\n\n${qaResult.answer}`
      
      // Thêm thông tin thuốc từ database nếu có
      if (medicineContext.medicines && medicineContext.medicines.length > 0) {
        const relevantMeds = medicineContext.medicines.slice(0, 3)
        if (relevantMeds.length > 0) {
          response += `\n\n📦 **Thuốc liên quan tại Pharmacare:**`
          for (const med of relevantMeds) {
            const status = med.isExpired ? '⚠️ HẾT HẠN' : (med.stockQuantity > 0 ? '✅ Còn hàng' : '❌ Hết hàng')
            response += `\n- ${med.name}: ${med.price?.toLocaleString() || 'Liên hệ'}đ/${med.unit || 'viên'} (${status})`
          }
        }
      }
      
      response += `\n\n⚠️ _Đây là tư vấn sơ bộ, bạn nên gặp bác sĩ/dược sĩ để được tư vấn chi tiết hơn._`
      
      return response
    }
  } catch (error) {
    console.error('[Offline AI] QA Database search error:', error)
  }
  
  // ============== MEDICAL CONSULTATION ==============
  if (intent === 'medical_consultation') {
    // Đau đầu
    if (/đau đầu|nhức đầu|đau nửa đầu/i.test(msgLower)) {
      const paracetamol = medicineContext.medicines?.find((m: any) => 
        /paracetamol|hapacol|efferalgan|panadol/i.test(m.name)
      )
      return `🩺 **Tư vấn: Đau đầu**

**Nguyên nhân có thể:**
- Căng thẳng, mệt mỏi, thiếu ngủ
- Hạ đường huyết (đói bụng)
- Cảm cúm, viêm xoang
- Tăng huyết áp

**Thuốc đề xuất từ Pharmacare:**
${paracetamol ? `✅ ${paracetamol.name}: ${paracetamol.price?.toLocaleString()}đ/${paracetamol.unit} (${paracetamol.status})` : '- Paracetamol 500mg: Liên hệ để kiểm tra tồn kho'}

**Liều dùng tham khảo:**
- Người lớn: 500mg - 1000mg/lần, cách 4-6 giờ
- Tối đa: 4g/ngày

⚠️ **Cần gặp bác sĩ nếu:**
- Đau đầu dữ dội, đột ngột
- Kèm sốt cao, cứng cổ
- Đau đầu kéo dài > 3 ngày

💊 Pharmacare khuyên bạn nghỉ ngơi và uống nhiều nước.`
    }
    
    // Sốt
    if (/sốt|nóng|nhiệt độ cao/i.test(msgLower)) {
      const fever = medicineContext.medicines?.find((m: any) => 
        /paracetamol|hapacol|efferalgan|ibuprofen/i.test(m.name)
      )
      return `🩺 **Tư vấn: Sốt**

**Phân loại:**
- Sốt nhẹ: 37.5 - 38°C
- Sốt vừa: 38 - 39°C  
- Sốt cao: > 39°C

**Thuốc hạ sốt tại Pharmacare:**
${fever ? `✅ ${fever.name}: ${fever.price?.toLocaleString()}đ/${fever.unit} (${fever.status})` : '- Paracetamol/Ibuprofen: Liên hệ để kiểm tra'}

**Cách xử lý:**
1. Uống nhiều nước, nghỉ ngơi
2. Chườm mát (không dùng nước đá)
3. Mặc quần áo thoáng mát
4. Uống thuốc hạ sốt nếu > 38.5°C

⚠️ **Cần đi viện ngay nếu:**
- Sốt cao > 39.5°C không hạ
- Co giật, lơ mơ
- Phát ban, khó thở`
    }
    
    // Ho
    if (/ho|ho khan|ho có đờm|đờm/i.test(msgLower)) {
      return `🩺 **Tư vấn: Ho**

**Phân loại:**
- Ho khan: Kích thích họng, không có đờm
- Ho có đờm: Đờm trong, vàng hoặc xanh

**Thuốc đề xuất:**
- Ho khan: Thuốc ức chế ho (Dextromethorphan)
- Ho có đờm: Thuốc long đờm (Acetylcysteine, Bromhexin)

**Lưu ý quan trọng:**
- Uống nhiều nước ấm, mật ong chanh
- Tránh đồ lạnh, đồ chiên rán
- Không tự ý dùng kháng sinh

⚠️ **Cần khám bác sĩ nếu:**
- Ho ra máu
- Ho kéo dài > 2 tuần
- Kèm sốt cao, khó thở
- Đờm màu xanh/vàng đậm`
    }
    
    // Đau bụng / tiêu hóa
    if (/đau bụng|tiêu chảy|táo bón|đầy hơi|khó tiêu|buồn nôn|nôn/i.test(msgLower)) {
      return `🩺 **Tư vấn: Rối loạn tiêu hóa**

**Triệu chứng phổ biến:**
- Đau bụng, đầy hơi, khó tiêu
- Tiêu chảy hoặc táo bón
- Buồn nôn, nôn

**Thuốc tham khảo:**
- Đau bụng: No-spa, Buscopan
- Tiêu chảy: Smecta, Loperamid
- Táo bón: Dulcolax, Forlax
- Đầy hơi: Simethicone, Men tiêu hóa

**Chế độ ăn:**
- Ăn nhẹ: Cháo, bánh mì, chuối
- Uống nhiều nước, ORS nếu tiêu chảy
- Tránh: Đồ cay, béo, sữa

⚠️ **Cần đi viện nếu:**
- Đau dữ dội, bụng cứng
- Nôn ra máu, đi ngoài phân đen
- Tiêu chảy > 3 ngày, mất nước`
    }
    
    // Dị ứng
    if (/dị ứng|ngứa|nổi mề đay|phát ban|sưng/i.test(msgLower)) {
      return `🩺 **Tư vấn: Dị ứng**

**Triệu chứng:**
- Ngứa, nổi mề đay, phát ban
- Sưng mắt, môi, mặt
- Hắt hơi, sổ mũi, ngứa mắt

**Thuốc kháng histamin:**
- Loratadin (Claritin): 1 viên/ngày
- Cetirizine (Zyrtec): 1 viên/ngày
- Fexofenadin (Telfast): 1 viên/ngày

**Xử lý:**
1. Tránh xa nguồn gây dị ứng
2. Uống thuốc kháng histamin
3. Bôi kem dịu da nếu ngứa

⚠️ **Cấp cứu ngay nếu:**
- Khó thở, sưng họng
- Sốc phản vệ
- Sưng mặt nhanh`
    }
    
    // Cảm cúm
    if (/cảm|cúm|sổ mũi|nghẹt mũi|hắt hơi|đau họng/i.test(msgLower)) {
      return `🩺 **Tư vấn: Cảm cúm**

**Triệu chứng điển hình:**
- Sổ mũi, nghẹt mũi, hắt hơi
- Đau họng, ho
- Sốt nhẹ, mệt mỏi
- Đau đầu, đau cơ

**Thuốc điều trị triệu chứng:**
- Hạ sốt: Paracetamol
- Nghẹt mũi: Xịt muối biển, Otrivin
- Đau họng: Viên ngậm Strepsils
- Vitamin C: Tăng đề kháng

**Chăm sóc tại nhà:**
- Nghỉ ngơi, ngủ đủ giấc
- Uống nhiều nước ấm
- Súc họng nước muối
- Xông hơi với tinh dầu

⚠️ **Cần khám nếu:**
- Sốt cao > 39°C
- Khó thở, đau ngực
- Triệu chứng nặng hơn sau 5 ngày`
    }
    
    // Mất ngủ / stress
    if (/mất ngủ|khó ngủ|stress|căng thẳng|lo âu|trầm cảm/i.test(msgLower)) {
      return `🩺 **Tư vấn: Mất ngủ / Stress**

**Nguyên nhân phổ biến:**
- Căng thẳng công việc, học tập
- Lo âu, trầm cảm
- Thói quen ngủ không tốt
- Caffeine, rượu bia

**Hỗ trợ không dùng thuốc:**
- Ngủ đúng giờ, đủ 7-8 tiếng
- Tránh màn hình 1 giờ trước ngủ
- Tập thể dục nhẹ, yoga
- Thư giãn: Thiền, hít thở sâu

**Thực phẩm chức năng:**
- Melatonin: Hỗ trợ giấc ngủ
- Vitamin B: Giảm căng thẳng
- Magie: Thư giãn cơ bắp

⚠️ **Cần gặp bác sĩ nếu:**
- Mất ngủ kéo dài > 2 tuần
- Có ý nghĩ tiêu cực
- Ảnh hưởng nghiêm trọng công việc`
    }

    // 8. Đau lưng / đau cột sống
    if (/đau lưng|đau cột sống|đau thắt lưng|thoát vị đĩa đệm|đau hông/i.test(msgLower)) {
      return `🩺 **Tư vấn: Đau lưng**

**Nguyên nhân thường gặp:**
- Ngồi sai tư thế, làm việc văn phòng
- Nâng vật nặng sai cách
- Thoái hóa cột sống, thoát vị đĩa đệm
- Căng cơ, chấn thương

**Thuốc giảm đau:**
- Paracetamol 500mg: 1-2 viên/lần, 3-4 lần/ngày
- Ibuprofen 400mg: 1 viên/lần, 2-3 lần/ngày (uống sau ăn)
- Miếng dán Salonpas, cao dán giảm đau

**Biện pháp hỗ trợ:**
- Chườm nóng/lạnh vùng đau
- Nghỉ ngơi, tránh vận động mạnh
- Tập vật lý trị liệu nhẹ nhàng
- Nằm đệm cứng

⚠️ **Cần khám ngay nếu:**
- Đau lan xuống chân, tê bì
- Yếu chân, khó đi lại
- Mất kiểm soát tiểu tiện`
    }

    // 9. Đau khớp / viêm khớp
    if (/đau khớp|viêm khớp|đau gối|đau vai|thoái hóa khớp|phong thấp|gout/i.test(msgLower)) {
      return `🩺 **Tư vấn: Đau khớp / Viêm khớp**

**Nguyên nhân:**
- Thoái hóa khớp (tuổi tác)
- Viêm khớp dạng thấp
- Gout (tăng acid uric)
- Chấn thương, vận động quá sức

**Thuốc điều trị:**
- Giảm đau: Paracetamol, Ibuprofen
- Chống viêm: Diclofenac, Meloxicam
- Gout: Colchicine, Allopurinol
- Bổ khớp: Glucosamine, Chondroitin

**Chăm sóc tại nhà:**
- Chườm đá khi sưng nóng
- Chườm ấm khi cứng khớp
- Vận động nhẹ nhàng, tránh quá sức
- Giảm cân nếu thừa cân

⚠️ **Cần khám nếu:**
- Khớp sưng đỏ, nóng, đau dữ dội
- Sốt kèm đau khớp
- Cứng khớp buổi sáng > 1 giờ`
    }

    // 10. Đau răng / viêm nướu
    if (/đau răng|nhức răng|sâu răng|viêm nướu|viêm lợi|chảy máu chân răng/i.test(msgLower)) {
      return `🩺 **Tư vấn: Đau răng / Viêm nướu**

**Nguyên nhân:**
- Sâu răng, viêm tủy
- Viêm nướu, viêm nha chu
- Răng khôn mọc lệch
- Ê buốt răng

**Thuốc giảm đau tạm thời:**
- Paracetamol 500mg: 1-2 viên/lần
- Ibuprofen 400mg (chống viêm)
- Thuốc tê bôi: Benzocaine gel

**Biện pháp tại nhà:**
- Súc miệng nước muối ấm
- Chườm đá bên ngoài má
- Tránh đồ quá nóng/lạnh/ngọt
- Dùng kem đánh răng cho răng nhạy cảm

⚠️ **Cần đi nha khoa nếu:**
- Đau dữ dội, không giảm sau 2 ngày
- Sưng mặt, sốt
- Chảy mủ, hôi miệng nặng`
    }

    // 11. Đau mắt / viêm kết mạc
    if (/đau mắt|mỏi mắt|đỏ mắt|viêm kết mạc|đau mắt đỏ|khô mắt|ngứa mắt/i.test(msgLower)) {
      return `🩺 **Tư vấn: Đau mắt / Viêm kết mạc**

**Nguyên nhân:**
- Viêm kết mạc (đau mắt đỏ)
- Khô mắt, mỏi mắt do màn hình
- Dị ứng mắt
- Chắp, lẹo mắt

**Thuốc nhỏ mắt:**
- Khô mắt: Nước mắt nhân tạo (Systane, Refresh)
- Viêm: Tobramycin, Ofloxacin (theo chỉ định)
- Dị ứng: Cromolin, Olopatadine

**Chăm sóc mắt:**
- Nghỉ mắt 20 phút/2 giờ làm việc
- Đeo kính chống ánh sáng xanh
- Chườm ấm nếu lẹo/chắp
- Rửa mắt bằng nước muối sinh lý

⚠️ **Cần khám mắt nếu:**
- Giảm thị lực đột ngột
- Đau nhức dữ dội
- Nhạy sáng, nhìn thấy quầng sáng
- Chảy mủ, dịch vàng`
    }

    // 12. Viêm họng / amidan
    if (/viêm họng|viêm amidan|đau họng|nuốt đau|rát họng|khàn tiếng/i.test(msgLower)) {
      return `🩺 **Tư vấn: Viêm họng / Amidan**

**Nguyên nhân:**
- Virus (80%): Cảm lạnh, cúm
- Vi khuẩn: Liên cầu khuẩn
- Dị ứng, khói bụi
- Trào ngược dạ dày

**Thuốc điều trị:**
- Giảm đau: Paracetamol
- Viên ngậm: Strepsils, Eugica
- Xịt họng: Tantum Verde, Hexaspray
- Kháng sinh (nếu do vi khuẩn): Amoxicillin

**Chăm sóc tại nhà:**
- Súc họng nước muối ấm 3-4 lần/ngày
- Uống nước ấm, mật ong chanh
- Nghỉ ngơi, tránh nói nhiều
- Tránh đồ lạnh, cay, chua

⚠️ **Cần khám nếu:**
- Sốt cao > 38.5°C
- Khó nuốt, khó thở
- Sưng hạch cổ to
- Không đỡ sau 5-7 ngày`
    }

    // 13. Viêm xoang
    if (/viêm xoang|đau xoang|nghẹt mũi|chảy mũi|đau vùng mặt|nhức đầu vùng trán/i.test(msgLower)) {
      return `🩺 **Tư vấn: Viêm xoang**

**Triệu chứng:**
- Nghẹt mũi, chảy mũi đặc
- Đau nhức vùng mặt, trán, má
- Giảm khứu giác
- Đau đầu, mệt mỏi

**Thuốc điều trị:**
- Xịt mũi: Muối biển (Sterimar), Oxymetazolin
- Kháng histamin: Loratadin, Cetirizine
- Giảm đau: Paracetamol
- Kháng sinh (nếu nhiễm khuẩn): Amoxicillin-Clavulanate

**Chăm sóc:**
- Rửa mũi bằng nước muối sinh lý
- Xông hơi với tinh dầu bạc hà
- Uống nhiều nước ấm
- Chườm ấm vùng mặt

⚠️ **Cần khám nếu:**
- Triệu chứng > 10 ngày không đỡ
- Sốt cao, đau dữ dội
- Sưng quanh mắt
- Chảy mũi mủ xanh/vàng`
    }

    // 14. Viêm dạ dày / trào ngược
    if (/viêm dạ dày|đau dạ dày|trào ngược|ợ chua|ợ nóng|đầy bụng|nóng rát thượng vị/i.test(msgLower)) {
      return `🩺 **Tư vấn: Viêm dạ dày / Trào ngược**

**Triệu chứng:**
- Đau thượng vị, nóng rát
- Ợ chua, ợ nóng
- Đầy bụng, khó tiêu
- Buồn nôn sau ăn

**Thuốc điều trị:**
- Trung hòa acid: Phosphalugel, Maalox
- Ức chế acid: Omeprazole, Esomeprazole
- Bảo vệ niêm mạc: Sucralfate, Gastropulgite
- Chống co thắt: Buscopan

**Chế độ ăn:**
- Ăn chậm, nhai kỹ, chia nhỏ bữa
- Tránh: Cay, chua, rượu bia, cà phê
- Không nằm ngay sau ăn (đợi 2-3 giờ)
- Nâng cao đầu giường khi ngủ

⚠️ **Cần khám nếu:**
- Đau dữ dội, không giảm sau dùng thuốc
- Nôn ra máu, đi ngoài phân đen
- Sụt cân không rõ nguyên nhân`
    }

    // 15. Tiểu buốt / viêm đường tiết niệu
    if (/tiểu buốt|tiểu rắt|tiểu đau|viêm đường tiết niệu|viêm bàng quang|tiểu ra máu/i.test(msgLower)) {
      return `🩺 **Tư vấn: Viêm đường tiết niệu**

**Triệu chứng:**
- Tiểu buốt, tiểu rắt
- Tiểu nhiều lần, lượng ít
- Nước tiểu đục, có mùi
- Đau bụng dưới

**Thuốc điều trị:**
- Kháng sinh: Ciprofloxacin, Nitrofurantoin (cần kê đơn)
- Giảm đau: Paracetamol
- Sát khuẩn đường tiểu: Cranberry extract

**Chăm sóc:**
- Uống nhiều nước (2-3 lít/ngày)
- Đi tiểu khi có nhu cầu, không nhịn
- Vệ sinh sạch sẽ vùng kín
- Tránh đồ uống có gas, caffeine

⚠️ **Cần khám ngay nếu:**
- Sốt, đau lưng (có thể viêm thận)
- Tiểu ra máu
- Triệu chứng nặng hơn sau 2 ngày`
    }

    // 16. Huyết áp cao
    if (/huyết áp cao|cao huyết áp|tăng huyết áp|đo huyết áp/i.test(msgLower)) {
      return `🩺 **Tư vấn: Huyết áp cao**

**Chỉ số huyết áp:**
- Bình thường: < 120/80 mmHg
- Tiền tăng HA: 120-139/80-89 mmHg
- Tăng HA độ 1: 140-159/90-99 mmHg
- Tăng HA độ 2: ≥ 160/100 mmHg

**Thuốc điều trị (theo chỉ định bác sĩ):**
- Nhóm ức chế ACE: Lisinopril, Enalapril
- Nhóm ARB: Losartan, Valsartan
- Lợi tiểu: Hydrochlorothiazide
- Chẹn Canxi: Amlodipine

**Lối sống:**
- Giảm muối < 5g/ngày
- Tập thể dục 30 phút/ngày
- Giảm cân nếu thừa cân
- Bỏ thuốc lá, hạn chế rượu

⚠️ **Cần cấp cứu nếu:**
- HA > 180/120 mmHg
- Đau đầu dữ dội, mờ mắt
- Đau ngực, khó thở
- Yếu liệt tay chân`
    }

    // 17. Tiểu đường
    if (/tiểu đường|đường huyết|đường máu cao|đái tháo đường/i.test(msgLower)) {
      return `🩺 **Tư vấn: Tiểu đường**

**Chỉ số đường huyết:**
- Bình thường lúc đói: 70-100 mg/dL
- Tiền tiểu đường: 100-125 mg/dL
- Tiểu đường: ≥ 126 mg/dL
- HbA1c mục tiêu: < 7%

**Thuốc điều trị (theo chỉ định):**
- Metformin: Thuốc đầu tay
- Sulfonylurea: Gliclazide, Glimepiride
- Insulin: Khi cần

**Chế độ ăn:**
- Giảm tinh bột, đường
- Ăn nhiều rau xanh, chất xơ
- Chia nhỏ bữa ăn
- Tránh: Nước ngọt, bánh kẹo

**Theo dõi:**
- Đo đường huyết tại nhà
- Khám định kỳ 3 tháng/lần
- Kiểm tra mắt, thận, chân hàng năm

⚠️ **Cần cấp cứu nếu:**
- Đường huyết < 70 (hạ đường huyết)
- Đường huyết > 400 mg/dL
- Lơ mơ, mất ý thức`
    }

    // 18. Táo bón
    if (/táo bón|khó đi ngoài|đi ngoài khó|phân cứng|không đi ngoài được/i.test(msgLower)) {
      return `🩺 **Tư vấn: Táo bón**

**Nguyên nhân:**
- Ít chất xơ, uống ít nước
- Ít vận động
- Nhịn đi ngoài
- Do thuốc (giảm đau, canxi...)

**Thuốc điều trị:**
- Nhuận tràng thẩm thấu: Duphalac, Forlax
- Nhuận tràng kích thích: Bisacodyl, Dulcolax
- Làm mềm phân: Docusate
- Thụt tháo: Microlax (dùng khi cần)

**Chế độ sinh hoạt:**
- Uống 2-3 lít nước/ngày
- Ăn nhiều rau, trái cây, ngũ cốc nguyên hạt
- Tập thể dục đều đặn
- Đi vệ sinh đúng giờ, không nhịn

⚠️ **Cần khám nếu:**
- Táo bón > 2 tuần không đỡ
- Đau bụng dữ dội
- Phân có máu
- Sụt cân không rõ nguyên nhân`
    }

    // 19. Chóng mặt / hoa mắt
    if (/chóng mặt|hoa mắt|xây xẩm|choáng váng|mất thăng bằng|rối loạn tiền đình/i.test(msgLower)) {
      return `🩺 **Tư vấn: Chóng mặt**

**Nguyên nhân:**
- Rối loạn tiền đình
- Hạ huyết áp tư thế
- Thiếu máu, hạ đường huyết
- Mệt mỏi, thiếu ngủ

**Thuốc điều trị:**
- Chống chóng mặt: Betahistine (Betaserc)
- An thần nhẹ: Dimenhydrinate (Dramamine)
- Bổ sung sắt nếu thiếu máu
- Vitamin B1, B6, B12

**Xử lý khi chóng mặt:**
- Ngồi hoặc nằm xuống ngay
- Nhắm mắt, hít thở sâu
- Uống nước, ăn nhẹ
- Tránh thay đổi tư thế đột ngột

⚠️ **Cần cấp cứu nếu:**
- Chóng mặt kèm yếu liệt
- Nói khó, méo miệng
- Đau đầu dữ dội
- Nhìn đôi, mờ mắt đột ngột`
    }

    // 20. Mụn / viêm da
    if (/mụn|mụn trứng cá|viêm da|ngứa da|nổi mụn|da nổi mẩn|eczema|vẩy nến/i.test(msgLower)) {
      return `🩺 **Tư vấn: Mụn / Viêm da**

**Phân loại mụn:**
- Mụn đầu đen, đầu trắng
- Mụn viêm, mụn mủ
- Mụn bọc, mụn nang

**Thuốc điều trị:**
- Bôi ngoài: Benzoyl Peroxide, Adapalene
- Kháng sinh bôi: Clindamycin, Erythromycin
- Viêm da: Hydrocortisone (ngắn ngày)
- Mụn nặng: Isotretinoin (cần kê đơn)

**Chăm sóc da:**
- Rửa mặt 2 lần/ngày, sữa rửa mặt dịu nhẹ
- Không nặn mụn
- Dùng kem chống nắng
- Tránh mỹ phẩm gây bít tắc

**Chế độ ăn:**
- Hạn chế đồ ngọt, sữa, đồ chiên
- Uống đủ nước
- Ăn nhiều rau xanh, hoa quả

⚠️ **Cần khám da liễu nếu:**
- Mụn viêm nặng, lan rộng
- Để lại sẹo
- Không đáp ứng điều trị sau 2 tháng`
    }
    
    // Default medical response
    return `🩺 **Tư vấn sức khỏe**

Tôi ghi nhận triệu chứng của bạn. Để tư vấn chính xác hơn, vui lòng cho biết thêm:

1️⃣ **Chi tiết triệu chứng**: Đau ở đâu? Cảm giác như thế nào?
2️⃣ **Thời gian**: Bắt đầu từ khi nào? Liên tục hay từng cơn?
3️⃣ **Mức độ**: Nhẹ, vừa hay nặng (1-10)?
4️⃣ **Các yếu tố khác**: Có ăn/uống gì lạ? Có tiền sử bệnh?

💡 **Ví dụ**: "Tôi đau đầu vùng trán, mức độ 6/10, từ sáng nay, kèm buồn nôn"

⚠️ Nếu triệu chứng nghiêm trọng, hãy đến cơ sở y tế gần nhất.`
  }
  
  // ============== MEDICINE SEARCH ==============
  if (intent === 'medicine_search') {
    if (medicineContext.medicines && medicineContext.medicines.length > 0) {
      const medList = medicineContext.medicines.slice(0, 5).map((m: any, i: number) => {
        const status = m.isExpired ? '⚠️ HẾT HẠN' : (m.stockQuantity > 0 ? '✅ Còn hàng' : '❌ Hết hàng')
        return `${i + 1}. **${m.name}**
   💰 Giá: ${m.price?.toLocaleString() || 'Liên hệ'}đ/${m.unit || 'viên'}
   📦 Tồn: ${m.stockQuantity || 0} ${m.unit || 'viên'} (${status})
   📅 HSD: ${m.expiryDate || 'N/A'}`
      }).join('\n\n')
      
      return `🔍 **Kết quả tìm kiếm tại Pharmacare:**

${medList}

📊 **Thống kê:** ${medicineContext.stats?.available || 0}/${medicineContext.stats?.totalMedicines || 0} thuốc còn hàng

💬 Bạn muốn biết thêm về thuốc nào? Hoặc cần tư vấn cách dùng?`
    }
    
    return `🔍 **Tìm kiếm thuốc**

Không tìm thấy thuốc phù hợp. Vui lòng thử:
- Nhập tên thuốc cụ thể (VD: "Paracetamol 500mg")
- Nhập hoạt chất (VD: "Amoxicillin")
- Mô tả công dụng (VD: "thuốc hạ sốt")

📞 Hoặc liên hệ Pharmacare để được hỗ trợ: 1900-xxxx`
  }
  
  // ============== GENERAL QUERY ==============
  return `🏥 **Pharmacare - Nhà thuốc thông minh**

Tôi có thể hỗ trợ bạn:

1️⃣ **Tư vấn sức khỏe**: Mô tả triệu chứng để được tư vấn
   VD: "Tôi bị đau đầu và sốt nhẹ"

2️⃣ **Tìm thuốc**: Tìm kiếm và kiểm tra giá thuốc
   VD: "Tìm thuốc Paracetamol" hoặc "Giá thuốc hạ sốt"

3️⃣ **Hướng dẫn**: Cách dùng thuốc, liều lượng
   VD: "Cách dùng Amoxicillin"

Bạn cần hỗ trợ gì hôm nay? 😊`
}

/**
 * Enhanced Intent Detection
 * Cải thiện độ chính xác phát hiện ý định người dùng
 */
function detectIntent(message: string): 'medical_consultation' | 'medicine_search' | 'general_query' {
  const msgLower = message.toLowerCase()

  // Medical consultation patterns - mở rộng
  const medicalPatterns = [
    /(?:bị|đau|sốt|ho|mệt|buồn nôn|chóng mặt|khó thở)/,
    /(?:triệu chứng|bệnh|ốm|khó chịu|nhức)/,
    /(?:đau bụng|tiêu chảy|táo bón|đầy hơi)/,
    /(?:viêm|nhiễm|sưng|ngứa|phát ban|dị ứng)/,
    /(?:cảm cúm|sổ mũi|nghẹt mũi|đau họng)/,
    /(?:mất ngủ|stress|căng thẳng|lo âu)/,
    /(?:huyết áp|tiểu đường|tim mạch)/,
    /(?:tư vấn|khám|chẩn đoán)/,
  ]

  // Medicine search patterns - mở rộng
  const searchPatterns = [
    /(?:tìm thuốc|có thuốc|giá thuốc?|còn hàng|tồn kho)/,
    /(?:mua|đặt hàng|order|giá bao nhiêu)/,
    /(?:thuốc\s+\w+)/i, // "thuốc paracetamol"
    /(?:paracetamol|aspirin|amoxicillin|vitamin|kháng sinh)/i,
    /(?:liều|cách dùng|uống thuốc|dùng thuốc)/,
    /(?:hạn sử dụng|HSD|date|expiry)/i,
  ]

  // Check medical patterns first (higher priority)
  for (const pattern of medicalPatterns) {
    if (pattern.test(msgLower)) return 'medical_consultation'
  }

  // Then check search patterns
  for (const pattern of searchPatterns) {
    if (pattern.test(msgLower)) return 'medicine_search'
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

LƯU Ý: Luôn nhắc nhở "Đây là tư vấn sơ bộ, bạn nên gặp bác sĩ/dược sĩ để được tư vấn chi tiết hơn."

LỊCH SỬ (${CONFIG.MAX_HISTORY} tin cuối):
${consultation?.conversationHistory?.slice(-CONFIG.MAX_HISTORY).map((msg: any) =>
    `${msg.role}: ${msg.message}`,
  ).join('\n') || 'Chưa có'}

USER: ${message}

TRẢ LỜI (Tiếng Việt, thân thiện, CHI TIẾT về giá/tồn kho/HSD, dưới 300 từ):`
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

    // 1. Check for local response first (no API call needed)
    const localResponse = handleLocalResponse(message)
    if (localResponse) {
      console.log('[Unified AI] Using local response')
      return {
        success: true,
        intent: 'local',
        response: localResponse,
        consultationStage: 'greeting',
        sessionId,
        timestamp: new Date().toISOString(),
        cached: false,
        local: true,
      }
    }

    // 2. Detect intent
    const intent = detectIntent(message)
    console.warn(`[Unified AI] Intent: ${intent}`)

    // 2.5 🆕 CHECK QA DATABASE FIRST - Tìm kiếm trong dữ liệu đã quản lý từ Admin
    const qaResult = await searchQADatabase(message)
    if (qaResult.found && qaResult.confidence >= 50) {
      console.log(`[Unified AI] Using QA Database response (confidence: ${qaResult.confidence}%)`)
      
      // Format lại câu trả lời với thương hiệu
      let formattedAnswer = qaResult.answer || ''
      
      // Thêm header nếu là tư vấn y tế
      if (qaResult.category === 'medical' || qaResult.category === 'dosage' || qaResult.category === 'side-effects') {
        formattedAnswer = `🏥 **Pharmacare - Tư vấn dược**\n\n${formattedAnswer}\n\n⚠️ _Đây là tư vấn sơ bộ, bạn nên gặp bác sĩ/dược sĩ để được tư vấn chi tiết hơn._`
      }
      
      // Save to cache
      const cacheKey = getCacheKey(message, intent)
      saveToCache(cacheKey, formattedAnswer, intent)
      
      return {
        success: true,
        intent: 'qa_database',
        response: formattedAnswer,
        consultationStage: 'greeting',
        sessionId,
        timestamp: new Date().toISOString(),
        qaMatch: true,
        qaConfidence: qaResult.confidence,
        qaCategory: qaResult.category,
      }
    }

    // 3. Check smart cache
    const cacheKey = getCacheKey(message, intent)
    const cachedResponse = getFromCache(cacheKey, intent)
    if (cachedResponse) {
      console.log('[Unified AI] Using smart cached response')
      return {
        success: true,
        intent,
        response: cachedResponse,
        sessionId,
        timestamp: new Date().toISOString(),
        cached: true,
      }
    }

    // 4. Get session
    const consultation = await getOrCreateSession(sessionId)

    // 5. Rate limiting
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    if (timeSinceLastRequest < CONFIG.MIN_REQUEST_INTERVAL) {
      await sleep(CONFIG.MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    }
    lastRequestTime = Date.now()

    // 6. Fetch context
    const medicineContext = await fetchMedicineContext(intent, message)

    // 6.5 🆕 TÌM KIẾM QA LIÊN QUAN để bổ sung vào prompt
    let qaContext = ''
    if (qaResult.found && qaResult.confidence >= 30) {
      qaContext = `\n\nTHÔNG TIN TỪ QA DATABASE (confidence: ${qaResult.confidence}%):\nCategory: ${qaResult.category}\nAnswer: ${qaResult.answer?.substring(0, 500) || 'N/A'}`
    }

    // 7. Build prompt với QA context
    const prompt = buildOptimizedPrompt(intent, message, consultation, medicineContext) + qaContext

    // 8. Call Gemini với retry
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyDVqknKtMNdW7EUoROduEZTddjQnNLOHCs'
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`

    let retries = 0
    let response: any
    let lastError: any = null

    while (retries < CONFIG.MAX_RETRIES) {
      try {
        response = await $fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              topK: 20,
              topP: 0.9,
              maxOutputTokens: 1024,
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

        // Success - break out of retry loop
        break
      }
      catch (error: any) {
        lastError = error
        retries++

        // Kiểm tra nếu là rate limit error (429)
        const isRateLimit = error.statusCode === 429 ||
          error.status === 429 ||
          error.message?.includes('429') ||
          error.message?.includes('rate limit') ||
          error.message?.includes('Too Many Requests')

        if (isRateLimit && retries < CONFIG.MAX_RETRIES) {
          // Exponential backoff với thời gian chờ tăng dần: 8s, 16s, 32s, 64s
          const waitTime = Math.min(CONFIG.MIN_REQUEST_INTERVAL * (2 ** (retries - 1)), 60000) // Max 60s
          console.warn(`[Unified AI] Rate limited (429), retry ${retries}/${CONFIG.MAX_RETRIES} after ${waitTime}ms`)
          await sleep(waitTime)
          continue // Tiếp tục retry
        }
        else if (retries >= CONFIG.MAX_RETRIES) {
          // Đã hết số lần retry, dùng fallback
          console.error(`[Unified AI] Max retries reached (${CONFIG.MAX_RETRIES}), using fallback. Last error:`, error?.message || error)
          break
        }
        else {
          // Lỗi khác (không phải rate limit), thử lại với delay nhỏ hơn
          const waitTime = 3000 * retries
          console.warn(`[Unified AI] Error (${error.statusCode || 'unknown'}), retry ${retries}/${CONFIG.MAX_RETRIES} after ${waitTime}ms`)
          await sleep(waitTime)
        }
      }
    }

    // Nếu không có response sau tất cả retries, dùng OFFLINE AI FALLBACK
    if (!response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.warn('[Unified AI] No valid response, using OFFLINE AI FALLBACK')

      // 🧠 SỬ DỤNG OFFLINE AI THAY VÌ MESSAGE ĐƠN GIẢN
      const offlineResponse = await generateOfflineResponse(message, intent, medicineContext)

      // Save to cache để không phải generate lại
      saveToCache(cacheKey, offlineResponse, intent)

      // Update conversation history
      await MedicalConsultation.findByIdAndUpdate((consultation as any)._id, {
        $push: {
          conversationHistory: {
            $each: [
              { role: 'patient', message, timestamp: new Date(), messageType: 'text' },
              { role: 'doctor', message: offlineResponse, timestamp: new Date(), messageType: 'text' },
            ],
          },
        },
      })

      return {
        success: true,
        intent,
        response: offlineResponse,
        consultationStage: (consultation as any).consultationStage,
        sessionId: (consultation as any).sessionId,
        timestamp: new Date().toISOString(),
        offline: true, // Flag để biết đây là offline response
      }
    }

    const cleanResponse = response.candidates[0].content.parts[0].text.trim()

    // Save to smart cache
    saveToCache(cacheKey, cleanResponse, intent)

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
