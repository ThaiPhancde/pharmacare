# 🛠️ KẾ HOẠCH TỐI ƯU CHATBOT PHARMACARE

## 📋 Mục Lục
1. [Phân Tích Vấn Đề Hiện Tại](#1-phân-tích-vấn-đề-hiện-tại)
2. [Giải Pháp Đề Xuất](#2-giải-pháp-đề-xuất)
3. [Kế Hoạch Thực Hiện](#3-kế-hoạch-thực-hiện)
4. [Chi Tiết Kỹ Thuật](#4-chi-tiết-kỹ-thuật)
5. [Checklist Hoàn Thành](#5-checklist-hoàn-thành)

---

## 1. Phân Tích Vấn Đề Hiện Tại

### 🔴 Các Vấn Đề Chính

#### 1.1. Rate Limit (Lỗi 429 - Too Many Requests)
**Vị trí lỗi:** `server/api/chatbot/unified-medical-ai.ts`
- API Gemini miễn phí có giới hạn: ~15 requests/phút
- Hiện tại đã có MIN_REQUEST_INTERVAL = 5000ms (5 giây) nhưng chưa đủ
- Khi rate limit xảy ra → retry tối đa 5 lần với exponential backoff

**Triệu chứng:**
- Bot trả lời chậm hoặc lỗi "hệ thống AI đang quá tải"
- Fallback response thay vì câu trả lời từ AI

#### 1.2. Token Limit (Prompt quá dài)
**Vấn đề:**
- Prompt hiện tại dài khoảng 500-1000 tokens
- maxOutputTokens = 1024 (khá ổn)
- Nhưng khi conversation history dài → prompt tăng lên đáng kể

**Vị trí:** Function `buildOptimizedPrompt()` line 140-209

#### 1.3. Câu Trả Lời Không Chính Xác
**Nguyên nhân:**
- Prompt chưa đủ chi tiết hướng dẫn AI
- Database context có thể không đầy đủ
- Intent detection đơn giản, dễ nhận nhầm

#### 1.4. Cache Không Hiệu Quả
- Cache TTL = 30 giây quá ngắn
- Sử dụng base64 của toàn bộ prompt làm cache key → không hiệu quả

---

## 2. Giải Pháp Đề Xuất

### 🟢 Giải Pháp 1: Tối Ưu Rate Limit

#### A. Tăng Request Interval
```typescript
// Thay đổi từ 5s → 8-10s để an toàn hơn
const MIN_REQUEST_INTERVAL = 8000 // 8 giây
```

#### B. Sử dụng Queue System (Khuyến nghị)
```typescript
// Thêm request queue để tránh concurrent requests
const requestQueue: Array<() => Promise<any>> = []
let isProcessing = false

async function processQueue() {
  if (isProcessing || requestQueue.length === 0) return
  isProcessing = true
  
  const task = requestQueue.shift()
  if (task) {
    await task()
    await sleep(MIN_REQUEST_INTERVAL)
  }
  
  isProcessing = false
  processQueue() // Process next
}
```

#### C. Intelligent Fallback (Không cần gọi API)
```typescript
// Xử lý local cho các câu hỏi đơn giản
function canAnswerLocally(message: string): string | null {
  const greetings = /^(xin chào|hello|hi|chào|hey)/i
  if (greetings.test(message)) {
    return 'Xin chào! Tôi là Bác sĩ AI của Pharmacare. Bạn cần tư vấn gì ạ?'
  }
  
  const thanks = /^(cảm ơn|thanks|thank you|cám ơn)/i
  if (thanks.test(message)) {
    return 'Không có gì! Rất vui được hỗ trợ bạn. Chúc bạn sức khỏe! 💊'
  }
  
  return null // Cần gọi AI
}
```

---

### 🟢 Giải Pháp 2: Tối Ưu Token/Prompt

#### A. Rút Gọn System Prompt
```typescript
// Prompt hiện tại quá dài, rút gọn còn ~300 tokens
const SYSTEM_PROMPT = `Bạn là Bác sĩ AI tại Pharmacare.

NHIỆM VỤ:
- Tư vấn sức khỏe, đề xuất thuốc từ database
- Trả lời ngắn gọn, chính xác, thân thiện
- Luôn nhắc: "Đây là tư vấn sơ bộ, nên gặp bác sĩ"

QUY TẮC:
- Thuốc HẾT HẠN → CẢNH BÁO
- Thuốc HẾT HÀNG → Gợi ý thay thế
- Format giá: X.XXX đ`
```

#### B. Giới Hạn Conversation History
```typescript
// Chỉ giữ 3 tin nhắn cuối thay vì 5
const recentHistory = consultation?.conversationHistory?.slice(-3)
```

#### C. Compress Medicine Context
```typescript
// Chỉ lấy fields cần thiết
const compactMedicine = medicines.map(m => ({
  name: m.name,
  price: m.price,
  qty: m.stockQuantity,
  exp: m.expiryDate,
  status: m.status
}))
```

---

### 🟢 Giải Pháp 3: Cải Thiện Độ Chính Xác

#### A. Enhanced Intent Detection
```typescript
function detectIntent(message: string): string {
  const msgLower = message.toLowerCase()
  
  // Medical consultation - nhiều patterns hơn
  const medicalPatterns = [
    /(?:bị|đau|sốt|ho|mệt|buồn nôn|chóng mặt|khó thở)/,
    /(?:triệu chứng|bệnh|ốm|khó chịu|nhức|đau bụng|tiêu chảy)/,
    /(?:viêm|nhiễm|sưng|ngứa|phát ban|dị ứng)/,
    /(?:uống thuốc|dùng thuốc|liều|cách dùng)/
  ]
  
  // Medicine search patterns
  const searchPatterns = [
    /(?:tìm thuốc|có thuốc|giá thuốc?|còn hàng|tồn kho)/,
    /(?:mua|đặt hàng|order|giá bao nhiêu)/,
    /thuốc\s+\w+/i // "thuốc paracetamol"
  ]
  
  // Check patterns
  for (const pattern of medicalPatterns) {
    if (pattern.test(msgLower)) return 'medical_consultation'
  }
  
  for (const pattern of searchPatterns) {
    if (pattern.test(msgLower)) return 'medicine_search'
  }
  
  return 'general_query'
}
```

#### B. Better Prompt Engineering
```typescript
// Thêm few-shot examples vào prompt
const EXAMPLES = `
VÍ DỤ 1:
User: "Tôi bị sốt và đau đầu"
AI: "Bạn bị sốt bao nhiêu độ? Đau đầu ở vị trí nào? Có triệu chứng khác như buồn nôn, chảy mũi không?"

VÍ DỤ 2:
User: "Có thuốc Paracetamol không?"
AI: "Pharmacare có Paracetamol 500mg:
- Giá: 2.500đ/viên
- Tồn kho: 500 viên (Còn hàng)
- HSD: 12/2025
Bạn muốn đặt mua không?"
`
```

---

### 🟢 Giải Pháp 4: Cải Thiện Caching

#### A. Smart Cache Key
```typescript
// Sử dụng hash ngắn gọn thay vì base64 toàn prompt
import { createHash } from 'crypto'

function getCacheKey(message: string, intent: string): string {
  const normalized = message.toLowerCase().trim()
  const hash = createHash('md5').update(`${intent}:${normalized}`).digest('hex')
  return hash.substring(0, 16) // 16 ký tự đủ unique
}
```

#### B. Tăng Cache TTL
```typescript
// Tăng từ 30s → 5 phút cho các câu hỏi tìm thuốc
const CACHE_TTL = {
  medicine_search: 5 * 60 * 1000,   // 5 phút
  general_query: 10 * 60 * 1000,    // 10 phút
  medical_consultation: 30 * 1000   // 30 giây (không cache lâu vì context thay đổi)
}
```

#### C. Pre-defined Responses
```typescript
// Cache sẵn các câu trả lời phổ biến
const PREDEFINED_RESPONSES: Record<string, string> = {
  'xin chào': 'Xin chào! Tôi là Bác sĩ AI của Pharmacare...',
  'cảm ơn': 'Không có gì! Chúc bạn sức khỏe...',
  'giờ mở cửa': 'Pharmacare mở cửa từ 7h-22h hàng ngày...',
  // Thêm các câu hỏi FAQ khác
}
```

---

## 3. Kế Hoạch Thực Hiện

### 📅 Phase 1: Quick Wins (1-2 ngày)
| Task | File | Priority |
|------|------|----------|
| Tăng MIN_REQUEST_INTERVAL lên 8s | unified-medical-ai.ts | 🔴 High |
| Thêm local responses cho greetings | unified-medical-ai.ts | 🔴 High |
| Giảm conversation history xuống 3 | unified-medical-ai.ts | 🟡 Medium |
| Tăng Cache TTL | unified-medical-ai.ts | 🟡 Medium |

### 📅 Phase 2: Optimization (3-5 ngày)
| Task | File | Priority |
|------|------|----------|
| Cải thiện intent detection | unified-medical-ai.ts | 🔴 High |
| Rút gọn system prompt | unified-medical-ai.ts | 🔴 High |
| Smart cache key | unified-medical-ai.ts | 🟡 Medium |
| Pre-defined responses | unified-medical-ai.ts | 🟡 Medium |

### 📅 Phase 3: Advanced (1 tuần+)
| Task | File | Priority |
|------|------|----------|
| Request queue system | unified-medical-ai.ts | 🟢 Low |
| Fallback to local AI model | new file | 🟢 Low |
| Better error handling UI | PharmaCareAdvancedBot.vue | 🟢 Low |

---

## 4. Chi Tiết Kỹ Thuật

### 4.1. File cần sửa chính

```
📁 server/api/chatbot/
├── unified-medical-ai.ts  ← File chính cần tối ưu
├── analyze-medicine-image.ts  ← Cần tối ưu rate limit riêng
└── index.ts  ← Không cần sửa

📁 components/chatbot/
├── PharmaCareAdvancedBot.vue  ← Cải thiện UI error handling
└── QuickActionButtons.vue  ← Không cần sửa
```

### 4.2. Cấu Trúc Code Mới

```typescript
// unified-medical-ai.ts - Cấu trúc đề xuất

// 1. Constants
const CONFIG = {
  MIN_REQUEST_INTERVAL: 8000,
  MAX_RETRIES: 5,
  CACHE_TTL: { ... },
  MAX_HISTORY: 3
}

// 2. Local Response Handler
function handleLocalResponse(message: string): string | null { ... }

// 3. Enhanced Intent Detection
function detectIntent(message: string): string { ... }

// 4. Optimized Prompt Builder
function buildPrompt(intent: string, message: string, context: any): string { ... }

// 5. Smart Cache
const cache = new Map<string, { response: string, ts: number }>()
function getCacheKey(message: string, intent: string): string { ... }
function getFromCache(key: string, ttl: number): string | null { ... }

// 6. Rate Limiter
async function waitForRateLimit(): Promise<void> { ... }

// 7. Main Handler
export default defineEventHandler(async (event) => {
  // ... logic
})
```

---

## 5. Checklist Hoàn Thành

### ✅ Phase 1 Checklist
- [ ] Tăng MIN_REQUEST_INTERVAL lên 8000ms
- [ ] Thêm function `handleLocalResponse()` cho greetings/thanks
- [ ] Giảm conversation history từ 5 → 3
- [ ] Tăng CACHE_TTL từ 30s → 5 phút

### ✅ Phase 2 Checklist
- [ ] Cải thiện regex trong `detectIntent()`
- [ ] Rút gọn system prompt (~300 tokens)
- [ ] Thêm smart cache key với MD5 hash
- [ ] Thêm predefined responses cho FAQ

### ✅ Phase 3 Checklist
- [ ] Implement request queue
- [ ] Thêm timeout indicator trong UI
- [ ] Better error messages trong UI
- [ ] Analytics để track performance

---

## 📝 Ghi Chú

### Về Rate Limit của Gemini API
- **Free tier:** ~15 RPM (requests per minute)
- **Paid tier:** Cao hơn nhiều, nhưng tốn phí
- **Khuyến nghị:** Giữ 7-10 giây giữa các request để an toàn

### Về Token Limit
- **Input:** 1 triệu tokens (rất lớn, không lo)
- **Output:** Nên giới hạn 500-1024 để response nhanh
- **Context window:** 32K tokens cho gemini-2.0-flash

### Best Practices
1. **Luôn có fallback** khi AI không khả dụng
2. **Cache aggressively** cho các query giống nhau
3. **Compress data** khi đưa vào prompt
4. **Monitor** để phát hiện vấn đề sớm

---

**Cập nhật lần cuối:** 12/12/2024  
**Author:** PharmaCare Development Team
