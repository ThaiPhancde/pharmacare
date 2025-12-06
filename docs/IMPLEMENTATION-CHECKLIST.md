# ✅ Implementation Checklist - Chatbot Image Recognition

## 📦 Phase 1: Dependencies & Setup

- [ ] Install backend dependencies
  ```bash
  pnpm add sharp multer @google/generative-ai
  pnpm add -D @types/multer @types/sharp
  ```

- [ ] Install frontend dependencies (if needed)
  ```bash
  pnpm add @vueuse/core # for useFileDialog composable
  ```

- [ ] Create upload directory
  ```bash
  mkdir -p public/uploads/medicine-images
  mkdir -p public/uploads/temp
  ```

- [ ] Add to `.gitignore`
  ```
  public/uploads/temp/*
  public/uploads/medicine-images/*
  ```

- [ ] Verify Gemini API key in `.env`
  ```env
  GEMINI_API_KEY=AIzaSyDVqknKtMNdW7EUoROduEZTddjQnNLOHCs
  ```

---

## 🔧 Phase 2: Backend Implementation

### 2.1 Services

- [ ] **File:** `server/services/imageUpload.ts`
  - [ ] Setup multer storage config
  - [ ] File validation (type, size)
  - [ ] Image optimization with Sharp
  - [ ] Export `uploadMedicineImage` middleware
  - [ ] Export `optimizeImage` function

- [ ] **File:** `server/services/geminiVision.ts`
  - [ ] Initialize Gemini AI client
  - [ ] Create `analyzeMedicineImage()` function
  - [ ] Read image as base64
  - [ ] Send to Gemini with optimized prompt
  - [ ] Parse JSON response
  - [ ] Error handling with retry logic

### 2.2 API Endpoint

- [ ] **File:** `server/api/chatbot/analyze-medicine-image.ts`
  - [ ] Setup multipart form-data parser
  - [ ] Validate request (image, sessionId)
  - [ ] Save image temporarily
  - [ ] Call `optimizeImage()`
  - [ ] Call `analyzeMedicineImage()`
  - [ ] Search Medicine database
  - [ ] Search Stock database
  - [ ] Format response data
  - [ ] Clean up temp files
  - [ ] Error handling

- [ ] **Test API với Postman/Thunder Client**
  ```
  POST http://localhost:3000/api/chatbot/analyze-medicine-image
  Body: form-data
    - image: [file]
    - sessionId: "test-session-123"
  ```

---

## 🎨 Phase 3: Frontend Implementation

### 3.1 Upload Component

- [ ] **File:** `components/chatbot/MedicineImageUpload.vue`
  - [ ] File input (hidden)
  - [ ] Upload button with camera icon
  - [ ] Image preview
  - [ ] File validation (client-side)
  - [ ] Upload progress indicator
  - [ ] Call API endpoint
  - [ ] Emit events: `upload-success`, `upload-error`
  - [ ] Clear/reset functionality

### 3.2 Integrate with Chatbot

- [ ] **File:** `components/chatbot/PharmaCareAdvancedBot.vue`
  - [ ] Import `MedicineImageUpload` component
  - [ ] Add camera button to input area
  - [ ] Toggle image upload modal
  - [ ] Handle `upload-success` event
    - [ ] Add user message with image info
    - [ ] Add bot response with recognition results
    - [ ] Display database matches as cards
    - [ ] Add action buttons (view detail, order)
  - [ ] Handle `upload-error` event
    - [ ] Display error message
    - [ ] Suggest alternatives

### 3.3 UI/UX Polish

- [ ] Camera button styling
- [ ] Upload modal animations
- [ ] Preview image styling
- [ ] Loading spinner during analysis
- [ ] Success/error notifications
- [ ] Mobile responsive design

---

## 🧪 Phase 4: Testing

### 4.1 Unit Tests

- [ ] Test `imageUpload.ts`
  - [ ] File validation
  - [ ] Image optimization
  - [ ] Error handling

- [ ] Test `geminiVision.ts`
  - [ ] API call success
  - [ ] Parse JSON response
  - [ ] Handle API errors

- [ ] Test API endpoint
  - [ ] Valid image → success
  - [ ] Invalid file type → error
  - [ ] File too large → error
  - [ ] No image → error

### 4.2 Integration Tests

- [ ] Upload image → Recognize → Search DB → Display results
- [ ] Upload image → Not found in DB → Suggest alternatives
- [ ] Upload blurry image → Low confidence → Ask to retake
- [ ] Upload non-medicine image → Reject

### 4.3 Manual Testing

- [ ] **Test Case 1: Clear medicine box image**
  - Expected: High confidence (>90%), found in DB, display price/stock

- [ ] **Test Case 2: Blurry image**
  - Expected: Low confidence (<70%), ask to retake

- [ ] **Test Case 3: Medicine not in database**
  - Expected: Recognition success, not found in DB, suggest similar

- [ ] **Test Case 4: Expired medicine**
  - Expected: Warning displayed, cannot order

- [ ] **Test Case 5: Non-medicine image (e.g., food)**
  - Expected: Confidence 0%, rejected

- [ ] **Test Case 6: Multiple medicines in one image**
  - Expected: AI might confuse, low confidence

### 4.4 Performance Tests

- [ ] Upload 1MB image → Response time < 5s
- [ ] Upload 5MB image → Response time < 10s
- [ ] Concurrent uploads (5 users) → No crashes
- [ ] Rate limiting works (10 requests/min)

---

## 📚 Phase 5: Documentation

- [ ] **File:** `docs/CHATBOT-IMAGE-RECOGNITION-PLAN.md`
  - [x] Architecture overview
  - [x] API design
  - [x] Implementation steps
  - [x] Code samples

- [ ] **File:** `docs/CHATBOT-IMAGE-GUIDE-USER.md`
  - [x] User guide (how to use)
  - [x] Tips for taking good photos
  - [x] Troubleshooting
  - [x] FAQ

- [ ] Update `README.md`
  - [ ] Add new feature to feature list
  - [ ] Add screenshot/demo GIF

- [ ] Update `CHATBOT-USER-GUIDE.md`
  - [ ] Add section for image recognition
  - [ ] Link to detailed guide

---

## 🔐 Phase 6: Security & Optimization

### 6.1 Security

- [ ] Input validation (file type, size)
- [ ] Sanitize filename (prevent path traversal)
- [ ] Rate limiting (max 10 uploads/min/user)
- [ ] Auth check (only logged-in users)
- [ ] Virus scan (optional: ClamAV)

### 6.2 Optimization

- [ ] Image resize before upload (client-side)
- [ ] Cache Gemini results (5 min TTL)
- [ ] Lazy load `MedicineImageUpload` component
- [ ] Compress uploaded images (Sharp JPEG quality 85)
- [ ] Auto-delete temp files after 24h (cron job)

### 6.3 Monitoring

- [ ] Log upload attempts
- [ ] Log Gemini API errors
- [ ] Track recognition accuracy
- [ ] Monitor API rate limits

---

## 🚀 Phase 7: Deployment

### 7.1 Staging

- [ ] Deploy to staging environment
- [ ] Test all features
- [ ] Fix bugs
- [ ] Performance tuning

### 7.2 Production

- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Setup alerts (Sentry, etc.)
- [ ] User feedback collection

### 7.3 Post-Deployment

- [ ] Monitor Gemini API usage
- [ ] Check if rate limits are hit
- [ ] Gather user feedback
- [ ] Plan v2 features

---

## 📈 Future Enhancements (v2)

- [ ] Batch upload (multiple images)
- [ ] Webcam/camera integration
- [ ] Barcode scanner
- [ ] Drug verification (fake detection)
- [ ] History of uploaded images
- [ ] OCR fallback (Tesseract.js)
- [ ] Image cropping tool
- [ ] Support for prescription images

---

## 📝 Notes

**Estimated Timeline:** 5 days (1 developer)
- Day 1-2: Backend (services + API)
- Day 3: Frontend (component + integration)
- Day 4: Testing & bug fixes
- Day 5: Documentation & deployment

**Blockers:**
- Gemini API rate limits (15 req/min free tier)
- Image quality varies (user education needed)
- Database medicine name matching (fuzzy search)

**Risks:**
- Low accuracy on blurry images → Mitigation: Client-side quality check
- API downtime → Mitigation: Fallback to OCR or manual search
- Storage costs → Mitigation: Auto-delete after 24h

---

**Last Updated:** 2025-10-30  
**Author:** PharmaCare Dev Team
