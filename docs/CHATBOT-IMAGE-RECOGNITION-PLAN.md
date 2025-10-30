# 🖼️ Kế Hoạch Tích Hợp Nhận Diện Hình Ảnh Thuốc - PharmaCare AI Chatbot

## 📋 Tổng Quan

### Mục Tiêu
Nâng cấp chatbot AI hiện tại để có thể:
- ✅ Nhận và phân tích hình ảnh thuốc (hộp/vỉ/chai)
- ✅ Trích xuất thông tin: Tên thuốc, thành phần, hạn sử dụng
- ✅ Tìm kiếm trong database và trả về giá, tồn kho
- ✅ Cảnh báo thuốc hết hạn/giả mạo

### Tech Stack
- **AI Vision**: Google Gemini 2.0 Flash (Multimodal) - Đã có API key
- **OCR Backup**: Tesseract.js (nếu Gemini không đủ chính xác)
- **Image Processing**: Sharp (resize, optimize)
- **Upload**: Multer/Formidable + Cloud Storage (Cloudinary/AWS S3)
- **Frontend**: Vue 3 + File Upload Component

---

## 🏗️ Kiến Trúc Hệ Thống

### 1. Flow Tổng Quan
```
User Upload Ảnh
    ↓
Frontend: Preview & Validate
    ↓
POST /api/chatbot/analyze-medicine-image
    ↓
Backend:
    1. Lưu ảnh tạm (temp folder hoặc cloud)
    2. Gọi Gemini Vision API
    3. Extract: Tên thuốc, thành phần, HSD, NSX
    4. Search database Medicine + Stock
    5. Trả về kết quả
    ↓
Frontend: Hiển thị kết quả (card UI)
```

### 2. API Endpoint Design

#### **POST /api/chatbot/analyze-medicine-image**
**Request:**
```typescript
// Multipart form-data
{
  image: File, // JPEG/PNG, max 5MB
  sessionId: string,
  language?: 'vi' | 'en' // Default: 'vi'
}
```

**Response:**
```typescript
{
  success: boolean,
  data: {
    recognized: {
      medicineName: string,
      brandName?: string,
      genericName?: string,
      ingredients?: string[],
      manufacturer?: string,
      expiryDate?: string,
      batchNumber?: string,
      confidence: number // 0-100
    },
    databaseMatch: {
      found: boolean,
      medicine?: {
        id: string,
        name: string,
        generic: string,
        price: number,
        unit: string,
        stockQuantity: number,
        expiryDate: string,
        isExpired: boolean,
        status: 'Còn hàng' | 'Hết hàng' | 'Hết hạn'
      }[]
    },
    imageUrl: string // Uploaded image URL
  },
  message: string
}
```

---

## 🛠️ Implementation Plan

### Phase 1: Backend API (Priority: HIGH)

#### Step 1.1: Install Dependencies
```bash
pnpm add sharp multer @google/generative-ai tesseract.js cloudinary
pnpm add -D @types/multer @types/sharp
```

#### Step 1.2: Tạo Image Upload Service
**File:** `server/services/imageUpload.ts`

```typescript
import multer from 'multer'
import path from 'path'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'

const storage = multer.diskStorage({
  destination: 'public/uploads/medicine-images/',
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

export const uploadMedicineImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Chỉ chấp nhận file ảnh JPEG/PNG'))
    }
    cb(null, true)
  }
})

// Optimize image
export async function optimizeImage(inputPath: string): Promise<string> {
  const outputPath = inputPath.replace(/\.(jpg|jpeg|png)$/i, '_optimized.jpg')
  await sharp(inputPath)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(outputPath)
  return outputPath
}
```

#### Step 1.3: Tạo Gemini Vision Service
**File:** `server/services/geminiVision.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function analyzeMedicineImage(imagePath: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    // Read image as base64
    const imageBuffer = fs.readFileSync(imagePath)
    const base64Image = imageBuffer.toString('base64')

    const prompt = `Phân tích hình ảnh thuốc này và trả về thông tin dưới dạng JSON:

{
  "medicineName": "Tên thuốc (VD: Paracetamol 500mg)",
  "brandName": "Tên thương hiệu (VD: Hapacol, Efferalgan)",
  "genericName": "Tên hoạt chất chính",
  "ingredients": ["Hoạt chất 1", "Hoạt chất 2"],
  "manufacturer": "Nhà sản xuất",
  "expiryDate": "Hạn sử dụng (format: DD/MM/YYYY)",
  "batchNumber": "Số lô",
  "dosageForm": "Dạng bào chế (viên nén, siro, viên nang...)",
  "strength": "Hàm lượng",
  "confidence": 85
}

QUY TẮC:
- Nếu không nhìn rõ thông tin nào thì để null
- confidence: 0-100 (mức độ tự tin)
- Nếu ảnh không phải thuốc → confidence = 0

Trả về CHÍNH XÁC JSON, không thêm text nào khác.`

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image
        }
      },
      { text: prompt }
    ])

    const response = result.response.text()
    
    // Parse JSON từ response (có thể có markdown ```json)
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Không thể parse JSON từ Gemini response')
    }

    const data = JSON.parse(jsonMatch[0])
    return data
  } catch (error: any) {
    console.error('[Gemini Vision] Error:', error)
    throw new Error(`Gemini Vision failed: ${error.message}`)
  }
}
```

#### Step 1.4: Tạo API Endpoint
**File:** `server/api/chatbot/analyze-medicine-image.ts`

```typescript
import { readBody, createError } from 'h3'
import { Medicine, Stock } from '~/server/models'
import { analyzeMedicineImage } from '~/server/services/geminiVision'
import { uploadMedicineImage, optimizeImage } from '~/server/services/imageUpload'

export default defineEventHandler(async (event) => {
  try {
    // Parse multipart form-data
    const formData = await readMultipartFormData(event)
    
    if (!formData) {
      throw createError({ statusCode: 400, message: 'No file uploaded' })
    }

    const imageFile = formData.find(part => part.name === 'image')
    const sessionId = formData.find(part => part.name === 'sessionId')?.data.toString()

    if (!imageFile || !sessionId) {
      throw createError({ statusCode: 400, message: 'Missing required fields' })
    }

    // Save image temporarily
    const tempPath = `public/uploads/temp/${Date.now()}_${imageFile.filename}`
    await fs.promises.writeFile(tempPath, imageFile.data)

    // Optimize image
    const optimizedPath = await optimizeImage(tempPath)

    // Analyze with Gemini Vision
    const recognized = await analyzeMedicineImage(optimizedPath)

    // Search database
    let databaseMatch: any = { found: false }

    if (recognized.confidence > 50 && recognized.medicineName) {
      // Search by medicine name or brand
      const searchTerms = [
        recognized.medicineName,
        recognized.brandName,
        recognized.genericName
      ].filter(Boolean)

      const medicines = await Medicine.find({
        $or: [
          { name: { $regex: searchTerms.join('|'), $options: 'i' } },
          { generic: { $regex: searchTerms.join('|'), $options: 'i' } }
        ]
      }).limit(5).lean()

      if (medicines.length > 0) {
        const results = await Promise.all(
          medicines.map(async (med: any) => {
            const stock = await Stock.findOne({ medicine_id: med._id }).lean()
            const expiryDate = stock?.expiry_date ? new Date(stock.expiry_date) : null
            const isExpired = expiryDate ? expiryDate < new Date() : false

            return {
              id: med._id.toString(),
              name: med.name,
              generic: med.generic || 'N/A',
              price: med.price || 0,
              unit: med.unit || 'viên',
              stockQuantity: stock?.quantity || 0,
              batchCode: stock?.batch_code || 'N/A',
              expiryDate: expiryDate?.toLocaleDateString('vi-VN') || 'Không có',
              isExpired,
              status: isExpired ? 'Hết hạn' : (stock?.quantity || 0) > 0 ? 'Còn hàng' : 'Hết hàng'
            }
          })
        )

        databaseMatch = {
          found: true,
          medicines: results
        }
      }
    }

    // Clean up temp files
    await fs.promises.unlink(tempPath)
    await fs.promises.unlink(optimizedPath)

    return {
      success: true,
      data: {
        recognized,
        databaseMatch,
        imageUrl: `/uploads/medicine-images/${path.basename(optimizedPath)}`
      },
      message: recognized.confidence > 70
        ? 'Nhận diện thành công'
        : 'Nhận diện không chắc chắn, vui lòng kiểm tra lại'
    }
  } catch (error: any) {
    console.error('[Analyze Medicine Image] Error:', error)
    return {
      success: false,
      message: error.message || 'Internal server error',
      data: null
    }
  }
})
```

---

### Phase 2: Frontend UI (Priority: HIGH)

#### Step 2.1: Tạo Component Upload Ảnh
**File:** `components/chatbot/MedicineImageUpload.vue`

```vue
<script setup lang="ts">
const emit = defineEmits(['upload-success', 'upload-error'])
const isUploading = ref(false)
const previewUrl = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return

  // Validate file
  if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
    emit('upload-error', 'Chỉ chấp nhận file ảnh JPEG/PNG')
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    emit('upload-error', 'Kích thước file tối đa 5MB')
    return
  }

  // Show preview
  previewUrl.value = URL.createObjectURL(file)

  // Upload
  isUploading.value = true
  const formData = new FormData()
  formData.append('image', file)
  formData.append('sessionId', sessionId.value)

  try {
    const response = await $fetch('/api/chatbot/analyze-medicine-image', {
      method: 'POST',
      body: formData
    })

    if (response.success) {
      emit('upload-success', response.data)
    } else {
      emit('upload-error', response.message)
    }
  } catch (error: any) {
    emit('upload-error', error.message || 'Upload failed')
  } finally {
    isUploading.value = false
  }
}

function triggerFileInput() {
  fileInput.value?.click()
}

function clearPreview() {
  previewUrl.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>

<template>
  <div class="medicine-image-upload">
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/jpg"
      class="hidden"
      @change="handleFileSelect"
    >

    <div v-if="!previewUrl" class="upload-area" @click="triggerFileInput">
      <Icon name="mdi:camera" class="h-12 w-12 text-blue-500" />
      <p class="mt-2 text-sm text-gray-600">Chụp hoặc chọn ảnh thuốc</p>
      <p class="text-xs text-gray-400">JPEG/PNG, tối đa 5MB</p>
    </div>

    <div v-else class="preview-area">
      <img :src="previewUrl" alt="Preview" class="max-h-64 rounded-lg">
      <div class="mt-2 flex gap-2">
        <button
          v-if="!isUploading"
          class="btn-secondary"
          @click="clearPreview"
        >
          Chọn lại
        </button>
        <button
          v-else
          class="btn-primary"
          disabled
        >
          <Icon name="mdi:loading" class="animate-spin" />
          Đang phân tích...
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-area:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}
</style>
```

#### Step 2.2: Cập Nhật PharmaCareAdvancedBot.vue
**File:** `components/chatbot/PharmaCareAdvancedBot.vue`

**Thêm vào phần `<script setup>`:**
```typescript
// Add after line ~45
const showImageUpload = ref(false)

function handleImageUploadSuccess(data: any) {
  showImageUpload.value = false
  
  // Add recognized info as user message
  addUserMessage(`[Đã gửi ảnh thuốc: ${data.recognized.medicineName || 'Không nhận diện được'}]`)
  
  // Add bot response with results
  let responseText = '🔍 KẾT QUẢ NHẬN DIỆN HÌNH ẢNH:\n\n'
  
  if (data.recognized.confidence > 70) {
    responseText += `✅ Độ tin cậy: ${data.recognized.confidence}%\n\n`
    responseText += `📦 **Tên thuốc:** ${data.recognized.medicineName}\n`
    if (data.recognized.brandName) responseText += `🏷️ **Thương hiệu:** ${data.recognized.brandName}\n`
    if (data.recognized.expiryDate) responseText += `📅 **Hạn SD:** ${data.recognized.expiryDate}\n`
    if (data.recognized.batchNumber) responseText += `🔢 **Số lô:** ${data.recognized.batchNumber}\n`
  } else {
    responseText += `⚠️ Độ tin cậy thấp (${data.recognized.confidence}%)\n`
    responseText += `Vui lòng chụp ảnh rõ hơn hoặc nhập tên thuốc thủ công.\n`
  }
  
  responseText += '\n'
  
  if (data.databaseMatch.found) {
    responseText += '📊 **TÌM THẤY TRONG KHO:**\n\n'
    data.databaseMatch.medicines.forEach((med: any, idx: number) => {
      responseText += `${idx + 1}. **${med.name}**\n`
      responseText += `   Giá: ${med.price.toLocaleString()}đ/${med.unit}\n`
      responseText += `   Tồn kho: ${med.stockQuantity} ${med.unit} (${med.status})\n`
      if (med.isExpired) {
        responseText += `   ⚠️ **CẢNH BÁO: ĐÃ HẾT HẠN (${med.expiryDate})**\n`
      } else {
        responseText += `   HSD: ${med.expiryDate}\n`
      }
      responseText += '\n'
    })
  } else {
    responseText += '❌ Không tìm thấy trong kho.\n'
    responseText += 'Bạn muốn tôi tìm thuốc tương tự không?'
  }
  
  addBotMessage(responseText, 'text', {
    actionButtons: data.databaseMatch.found ? [
      { label: 'Xem chi tiết', action: 'view_detail', query: '', color: 'blue' },
      { label: 'Đặt mua', action: 'order', query: '', color: 'green' }
    ] : [
      { label: 'Tìm thuốc tương tự', action: 'find_similar', query: `Tìm thuốc tương tự ${data.recognized.medicineName}`, color: 'blue' }
    ]
  })
}

function handleImageUploadError(error: string) {
  showImageUpload.value = false
  addBotMessage(`❌ Lỗi upload ảnh: ${error}`)
}
```

**Thêm vào template (sau input message):**
```vue
<!-- Add image upload button next to send button -->
<div class="flex gap-2">
  <button
    class="rounded-xl bg-gray-100 px-4 py-3 text-gray-700 transition-colors hover:bg-gray-200"
    @click="showImageUpload = !showImageUpload"
  >
    <Icon name="mdi:camera" class="h-5 w-5" />
  </button>
  
  <input
    v-model="userInput"
    type="text"
    placeholder="Nhập tin nhắn..."
    class="chat-input flex-1 ..."
    @keypress.enter="sendMessage()"
  >
  
  <button
    class="rounded-xl bg-blue-600 ..."
    @click="sendMessage()"
  >
    <Icon name="mdi:send" class="h-5 w-5" />
  </button>
</div>

<!-- Image upload modal -->
<Transition name="fade">
  <div
    v-if="showImageUpload"
    class="absolute bottom-full left-0 mb-2 w-full rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
  >
    <MedicineImageUpload
      :session-id="sessionId"
      @upload-success="handleImageUploadSuccess"
      @upload-error="handleImageUploadError"
    />
  </div>
</Transition>
```

---

### Phase 3: Testing & Optimization (Priority: MEDIUM)

#### Test Cases
1. **Ảnh hộp thuốc rõ nét** → Nhận diện chính xác
2. **Ảnh vỉ thuốc** → Nhận diện thương hiệu
3. **Ảnh mờ/góc nghiêng** → Confidence thấp, yêu cầu chụp lại
4. **Ảnh không phải thuốc** → Confidence = 0, từ chối
5. **Thuốc không có trong database** → Gợi ý thuốc tương tự
6. **Thuốc hết hạn** → Cảnh báo đỏ

#### Performance Optimization
- Resize ảnh xuống 1200x1200 trước khi gọi API
- Cache kết quả nhận diện 5 phút
- Rate limiting: Max 10 requests/minute/user
- Fallback to OCR nếu Gemini fail

---

### Phase 4: Advanced Features (Priority: LOW)

1. **Batch Processing**: Upload nhiều ảnh cùng lúc
2. **Camera Integration**: Chụp trực tiếp từ webcam/mobile
3. **Barcode Scanner**: Scan mã vạch thuốc
4. **Drug Verification**: Kiểm tra thuốc giả bằng AI
5. **History**: Lưu lịch sử ảnh đã upload

---

## 📊 Estimate Timeline

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Backend API + Gemini Vision Service | 2 days | ⏳ Not Started |
| 2 | Frontend UI Component | 1 day | ⏳ Not Started |
| 3 | Integration with Chatbot | 0.5 day | ⏳ Not Started |
| 4 | Testing & Bug Fixes | 1 day | ⏳ Not Started |
| 5 | Documentation | 0.5 day | ⏳ Not Started |
| **TOTAL** | | **5 days** | |

---

## ⚠️ Challenges & Solutions

### Challenge 1: Gemini Vision API Rate Limits
**Problem:** 15 requests/minute (free tier)  
**Solution:**
- Client-side validation trước khi upload
- Cache kết quả nhận diện
- Queue system cho request cao điểm

### Challenge 2: Low Accuracy on Blurry Images
**Problem:** Ảnh mờ → confidence thấp  
**Solution:**
- Image quality check trước upload (OpenCV.js)
- Hướng dẫn user chụp ảnh đúng cách
- Fallback to OCR (Tesseract.js)

### Challenge 3: Medicine Name Variations
**Problem:** Database có "Paracetamol 500mg", ảnh nhận diện "Hapacol 500mg"  
**Solution:**
- Fuzzy search (Levenshtein distance)
- Maintain mapping table (brand → generic)
- AI suggest similar medicines

### Challenge 4: Upload Security
**Problem:** User upload ảnh độc hại/spam  
**Solution:**
- File type validation
- File size limit (5MB)
- Image virus scan (ClamAV)
- Rate limiting per IP

---

## 🔒 Security Considerations

1. **Input Validation**
   - Only allow JPEG/PNG
   - Max file size 5MB
   - Check image dimensions

2. **Storage**
   - Store in isolated folder
   - Auto-delete after 24h
   - No executable files

3. **API Protection**
   - Rate limiting
   - JWT authentication
   - CORS policy

4. **Privacy**
   - No personal data in images
   - GDPR compliance
   - User consent required

---

## 📚 References

- [Gemini API - Multimodal Input](https://ai.google.dev/tutorials/multimodal_input)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [Tesseract.js OCR](https://tesseract.projectnaptha.com/)
- [Vue 3 File Upload Best Practices](https://vuejs.org/guide/essentials/forms.html#file-input)

---

## 📝 Next Steps

1. [ ] Setup Gemini Vision API credentials
2. [ ] Create backend endpoint
3. [ ] Build frontend component
4. [ ] Integration testing
5. [ ] Deploy to staging
6. [ ] User acceptance testing
7. [ ] Production deployment

---

**Author:** PharmaCare Development Team  
**Last Updated:** 2025-10-30  
**Version:** 1.0
