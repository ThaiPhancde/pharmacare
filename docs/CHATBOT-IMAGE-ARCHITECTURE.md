# 🎨 Visual Architecture - Chatbot Image Recognition

## 📐 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE                             │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         PharmaCare AI Chatbot Window                         │  │
│  │                                                                │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐               │  │
│  │  │  Tư vấn    │ │ Tìm thuốc  │ │  Trợ giúp  │               │  │
│  │  └────────────┘ └────────────┘ └────────────┘               │  │
│  │                                                                │  │
│  │  Chat Messages:                                               │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ Bot: Xin chào! Tôi có thể giúp gì cho bạn?            │  │  │
│  │  │                                                          │  │  │
│  │  │ User: [Đã gửi ảnh thuốc]                       (Image) │  │  │
│  │  │                                                          │  │  │
│  │  │ Bot: 🔍 Nhận diện: Paracetamol 500mg                   │  │  │
│  │  │      Giá: 2,000đ | Tồn kho: 150 vỉ                     │  │  │
│  │  │      [Xem chi tiết] [Đặt mua]                          │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                                │  │
│  │  Input Area:                                                  │  │
│  │  ┌──┐ ┌──────────────────────────────────┐ ┌──────┐         │  │
│  │  │📷│ │  Nhập tin nhắn...                │ │ Gửi  │         │  │
│  │  └──┘ └──────────────────────────────────┘ └──────┘         │  │
│  │   ↑                                                            │  │
│  │   Camera Button (NEW!)                                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

```
┌──────────────┐
│     USER     │
└──────┬───────┘
       │ 1. Click camera button
       ↓
┌──────────────────────────────────────────────────────────┐
│         MedicineImageUpload.vue (Frontend)               │
│                                                            │
│  • File input                                             │
│  • Preview image                                          │
│  • Validate (type: JPEG/PNG, size: <5MB)                 │
└──────┬──────────────────────────────────────────────────┘
       │ 2. Upload FormData
       ↓
┌──────────────────────────────────────────────────────────┐
│   API: /api/chatbot/analyze-medicine-image (Backend)    │
│                                                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Step 1: Receive & Save Image                    │    │
│  │         (Multer middleware)                      │    │
│  └─────────────────────────────────────────────────┘    │
│       │                                                   │
│       ↓                                                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Step 2: Optimize Image                          │    │
│  │         (Sharp: resize 1200x1200, JPEG 85%)     │    │
│  └─────────────────────────────────────────────────┘    │
│       │                                                   │
│       ↓                                                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Step 3: Analyze with Gemini Vision API          │    │
│  │         → Extract: name, brand, expiry, batch    │    │
│  │         → Return JSON with confidence score      │    │
│  └─────────────────────────────────────────────────┘    │
│       │                                                   │
│       ↓                                                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Step 4: Search Database                         │    │
│  │         Medicine.find() + Stock.find()           │    │
│  │         → Match by name/generic/brand            │    │
│  │         → Get price, quantity, expiry            │    │
│  └─────────────────────────────────────────────────┘    │
│       │                                                   │
│       ↓                                                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Step 5: Clean Up                                │    │
│  │         Delete temp files                        │    │
│  └─────────────────────────────────────────────────┘    │
└──────┬──────────────────────────────────────────────────┘
       │ 3. Return JSON response
       ↓
┌──────────────────────────────────────────────────────────┐
│         PharmaCareAdvancedBot.vue (Frontend)             │
│                                                            │
│  • Handle upload-success event                           │
│  • Display recognition results                           │
│  • Show medicine cards with action buttons               │
└──────┬──────────────────────────────────────────────────┘
       │ 4. Show results
       ↓
┌──────────────┐
│     USER     │
│  (Sees info) │
└──────────────┘
```

---

## 🗂️ File Structure (Before & After)

### Before (v3.0)
```
pharmacare/
├── components/
│   └── chatbot/
│       ├── PharmaCareAdvancedBot.vue
│       ├── QuickActionButtons.vue
│       └── MedicineRecommendationCard.vue
│
├── server/
│   ├── api/
│   │   └── chatbot/
│   │       ├── index.ts
│   │       ├── unified-medical-ai.ts
│   │       └── qa/
│   │
│   ├── models/
│   │   ├── Medicine.ts
│   │   ├── Stock.ts
│   │   └── MedicalConsultation.ts
│   │
│   └── services/
│       └── (empty)
│
└── docs/
    └── CHATBOT-USER-GUIDE.md
```

### After (v3.1) - NEW FILES HIGHLIGHTED
```
pharmacare/
├── components/
│   └── chatbot/
│       ├── PharmaCareAdvancedBot.vue          [MODIFIED]
│       ├── QuickActionButtons.vue
│       ├── MedicineRecommendationCard.vue
│       └── MedicineImageUpload.vue            [NEW] ⭐
│
├── server/
│   ├── api/
│   │   └── chatbot/
│   │       ├── index.ts
│   │       ├── unified-medical-ai.ts
│   │       ├── analyze-medicine-image.ts      [NEW] ⭐
│   │       └── qa/
│   │
│   ├── models/
│   │   ├── Medicine.ts
│   │   ├── Stock.ts
│   │   └── MedicalConsultation.ts
│   │
│   └── services/
│       ├── imageUpload.ts                     [NEW] ⭐
│       └── geminiVision.ts                    [NEW] ⭐
│
├── public/
│   └── uploads/
│       ├── medicine-images/                   [NEW DIR] ⭐
│       └── temp/                              [NEW DIR] ⭐
│
└── docs/
    ├── CHATBOT-USER-GUIDE.md
    ├── CHATBOT-IMAGE-README.md                [NEW] ⭐
    ├── CHATBOT-IMAGE-SUMMARY.md               [NEW] ⭐
    ├── CHATBOT-IMAGE-RECOGNITION-PLAN.md      [NEW] ⭐
    ├── CHATBOT-IMAGE-GUIDE-USER.md            [NEW] ⭐
    └── IMPLEMENTATION-CHECKLIST.md            [NEW] ⭐
```

---

## 🧩 Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                PharmaCareAdvancedBot.vue                        │
│                        (Parent)                                  │
│                                                                   │
│  State:                                                          │
│  - showImageUpload: boolean                                     │
│  - messages: Message[]                                           │
│                                                                   │
│  Methods:                                                        │
│  - handleImageUploadSuccess(data)                               │
│  - handleImageUploadError(error)                                │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Template:                                             │    │
│  │                                                          │    │
│  │  <button @click="showImageUpload = true">              │    │
│  │    📷 Camera                                           │    │
│  │  </button>                                              │    │
│  │                                                          │    │
│  │  <MedicineImageUpload                                  │    │
│  │    v-if="showImageUpload"                              │    │
│  │    :session-id="sessionId"                             │    │
│  │    @upload-success="handleImageUploadSuccess"          │    │
│  │    @upload-error="handleImageUploadError"              │    │
│  │  />                                                     │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ↓ Props                                    ↑ Events            │
│  (sessionId)                                (upload-success)     │
│                                              (upload-error)      │
└─────────────────────────┬─────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│            MedicineImageUpload.vue (Child)                      │
│                                                                   │
│  Props:                                                          │
│  - sessionId: string                                            │
│                                                                   │
│  Emits:                                                          │
│  - upload-success(data: any)                                    │
│  - upload-error(error: string)                                  │
│                                                                   │
│  State:                                                          │
│  - isUploading: boolean                                         │
│  - previewUrl: string | null                                    │
│                                                                   │
│  Methods:                                                        │
│  - handleFileSelect(event)                                      │
│  - triggerFileInput()                                           │
│  - clearPreview()                                               │
│                                                                   │
│  API Call:                                                       │
│  $fetch('/api/chatbot/analyze-medicine-image', {               │
│    method: 'POST',                                               │
│    body: formData                                                │
│  })                                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 API Response Flow

```
SUCCESS CASE:
┌──────────────────────────────────────────────────────────────┐
│  Request:                                                     │
│  POST /api/chatbot/analyze-medicine-image                    │
│  Body: FormData { image: File, sessionId: "abc123" }        │
└───────────────────────────┬──────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  Response (Success):                                         │
│  {                                                            │
│    success: true,                                            │
│    data: {                                                   │
│      recognized: {                                           │
│        medicineName: "Paracetamol 500mg",                   │
│        brandName: "Hapacol",                                 │
│        expiryDate: "12/2025",                                │
│        batchNumber: "LOT123456",                             │
│        confidence: 92                                        │
│      },                                                      │
│      databaseMatch: {                                        │
│        found: true,                                          │
│        medicines: [                                          │
│          {                                                   │
│            id: "med001",                                     │
│            name: "Paracetamol 500mg",                        │
│            price: 2000,                                      │
│            unit: "vỉ",                                       │
│            stockQuantity: 150,                               │
│            status: "Còn hàng",                               │
│            isExpired: false                                  │
│          }                                                   │
│        ]                                                     │
│      },                                                      │
│      imageUrl: "/uploads/medicine-images/abc123.jpg"        │
│    },                                                        │
│    message: "Nhận diện thành công"                          │
│  }                                                            │
└──────────────────────────────────────────────────────────────┘


ERROR CASE 1 (Low Confidence):
┌──────────────────────────────────────────────────────────────┐
│  Response:                                                    │
│  {                                                            │
│    success: true,                                            │
│    data: {                                                   │
│      recognized: {                                           │
│        medicineName: "Unclear",                              │
│        confidence: 45                                        │
│      },                                                      │
│      databaseMatch: { found: false }                        │
│    },                                                        │
│    message: "Nhận diện không chắc chắn, vui lòng chụp lại" │
│  }                                                            │
└──────────────────────────────────────────────────────────────┘


ERROR CASE 2 (Invalid File):
┌──────────────────────────────────────────────────────────────┐
│  Response:                                                    │
│  {                                                            │
│    success: false,                                           │
│    message: "Chỉ chấp nhận file ảnh JPEG/PNG",              │
│    data: null                                                │
│  }                                                            │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎭 User Experience Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  SCENARIO: User wants to check medicine info by photo          │
└─────────────────────────────────────────────────────────────────┘

Step 1: Open Chatbot
┌────────────────────────┐
│  User clicks on        │
│  floating chat button  │
│  (bottom right)        │
└───────────┬────────────┘
            ↓
Step 2: Click Camera
┌────────────────────────┐
│  User sees chat input  │
│  with 📷 button        │
│  → Clicks camera       │
└───────────┬────────────┘
            ↓
Step 3: Upload/Capture
┌────────────────────────┐
│  Upload modal appears  │
│  Options:              │
│  - Choose from library │
│  - Take photo (mobile) │
└───────────┬────────────┘
            ↓
Step 4: Preview
┌────────────────────────┐
│  Image preview shown   │
│  Auto-upload starts    │
│  Loading spinner...    │
└───────────┬────────────┘
            ↓
Step 5: AI Analysis
┌────────────────────────┐
│  "Đang phân tích..."   │
│  (~3-5 seconds)        │
└───────────┬────────────┘
            ↓
Step 6: Results Displayed
┌─────────────────────────────────────────────┐
│  Bot Message:                               │
│  ┌────────────────────────────────────────┐ │
│  │ 🔍 KẾT QUẢ NHẬN DIỆN HÌNH ẢNH:        │ │
│  │                                         │ │
│  │ ✅ Độ tin cậy: 92%                    │ │
│  │                                         │ │
│  │ 📦 Tên thuốc: Paracetamol 500mg       │ │
│  │ 🏷️ Thương hiệu: Hapacol               │ │
│  │ 📅 HSD: 12/2025                       │ │
│  │                                         │ │
│  │ 📊 TÌM THẤY TRONG KHO:                │ │
│  │                                         │ │
│  │ 1. Paracetamol 500mg                  │ │
│  │    Giá: 2,000đ/vỉ                     │ │
│  │    Tồn kho: 150 vỉ (Còn hàng)        │ │
│  │    HSD: 12/12/2025                    │ │
│  │                                         │ │
│  │ [Xem chi tiết]  [Đặt mua]            │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
            ↓
Step 7: User Action
┌────────────────────────┐
│  User can:             │
│  - View details        │
│  - Order medicine      │
│  - Ask more questions  │
│  - Upload another      │
└────────────────────────┘
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                              │
└─────────────────────────────────────────────────────────────────┘

Layer 1: CLIENT-SIDE VALIDATION
┌──────────────────────────────────────────────────────────────┐
│  • File type check (JPEG/PNG only)                          │
│  • File size check (<5MB)                                    │
│  • Image dimension check (optional)                         │
└─────────────────────────┬────────────────────────────────────┘
                          ↓
Layer 2: RATE LIMITING
┌──────────────────────────────────────────────────────────────┐
│  • Max 10 uploads/minute per user                           │
│  • Track by sessionId or IP                                  │
│  • Return 429 Too Many Requests if exceeded                 │
└─────────────────────────┬────────────────────────────────────┘
                          ↓
Layer 3: SERVER-SIDE VALIDATION
┌──────────────────────────────────────────────────────────────┐
│  • Re-validate file type (magic bytes)                      │
│  • Re-validate file size                                     │
│  • Sanitize filename (prevent path traversal)               │
│  • Check for malicious content                               │
└─────────────────────────┬────────────────────────────────────┘
                          ↓
Layer 4: FILE PROCESSING
┌──────────────────────────────────────────────────────────────┐
│  • Save to isolated temp directory                          │
│  • Process with Sharp (strips metadata)                     │
│  • Convert to JPEG (removes exploits in other formats)      │
└─────────────────────────┬────────────────────────────────────┘
                          ↓
Layer 5: CLEANUP
┌──────────────────────────────────────────────────────────────┐
│  • Delete original upload immediately after processing      │
│  • Auto-delete processed images after 24 hours              │
│  • Cron job to clean old files                               │
└──────────────────────────────────────────────────────────────┘
```

---

## ⚡ Performance Optimization Flow

```
OPTIMIZATION STRATEGY:

┌────────────────────────────────────────────────────────────────┐
│  BEFORE UPLOAD (Client-side)                                  │
├────────────────────────────────────────────────────────────────┤
│  1. Compress image (if >1MB)                                  │
│     → Use browser's Canvas API                                │
│     → Reduce quality to 85%                                   │
│                                                                 │
│  2. Resize if too large                                       │
│     → Max dimension: 1920x1920                                │
└────────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────┐
│  AFTER UPLOAD (Server-side)                                   │
├────────────────────────────────────────────────────────────────┤
│  1. Further optimize with Sharp                               │
│     → Resize to 1200x1200                                     │
│     → JPEG quality 85%                                        │
│     → Strip metadata                                           │
│                                                                 │
│  2. Cache Gemini API results                                  │
│     → Key: image hash                                         │
│     → TTL: 5 minutes                                          │
│     → Reduce duplicate API calls                              │
│                                                                 │
│  3. Database query optimization                               │
│     → Use indexes on Medicine.name, Medicine.generic         │
│     → Limit results to 10 medicines                           │
│     → Lean queries (no Mongoose overhead)                     │
└────────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────┐
│  DELIVERY (Response)                                           │
├────────────────────────────────────────────────────────────────┤
│  1. Return minimal data                                       │
│     → Only essential fields                                    │
│     → No full Medicine documents                               │
│                                                                 │
│  2. Lazy load action buttons                                  │
│     → Render on demand                                         │
└────────────────────────────────────────────────────────────────┘

RESULT: Response time < 5 seconds (from upload to display)
```

---

**Note:** Tất cả các diagrams trên đây là text-based để dễ đọc trong bất kỳ editor nào. Có thể convert sang diagram tools như Mermaid, Draw.io nếu cần.
