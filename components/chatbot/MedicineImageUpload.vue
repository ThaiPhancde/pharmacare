<script setup lang="ts">
/**
 * MedicineImageUpload Component
 * Upload và nhận diện thuốc từ hình ảnh
 */

interface Props {
  sessionId: string
}

interface Emits {
  (e: 'uploadSuccess', data: any): void
  (e: 'uploadError', error: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const isUploading = ref(false)
const previewUrl = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const uploadProgress = ref(0)

/**
 * Validate file on client-side
 */
function validateFile(file: File): { valid: boolean, error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Chỉ chấp nhận file ảnh JPEG/PNG' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Kích thước file tối đa 5MB' }
  }

  return { valid: true }
}

/**
 * Handle file selection
 */
function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) {
    return
  }

  // Validate
  const validation = validateFile(file)
  if (!validation.valid) {
    emit('uploadError', validation.error || 'File không hợp lệ')
    return
  }

  // Store file
  selectedFile.value = file

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  // Auto upload
  uploadImage()
}

/**
 * Upload image to API
 */
async function uploadImage() {
  if (!selectedFile.value) {
    return
  }

  isUploading.value = true
  uploadProgress.value = 0

  try {
    // Create FormData
    const formData = new FormData()
    formData.append('image', selectedFile.value)
    formData.append('sessionId', props.sessionId)

    // Simulate progress (since we can't track real progress with fetch)
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10
      }
    }, 300)

    // Call API
    const response = await $fetch('/api/chatbot/analyze-medicine-image', {
      method: 'POST',
      body: formData,
    })

    clearInterval(progressInterval)
    uploadProgress.value = 100

    if (response.success) {
      emit('uploadSuccess', response.data)
    }
    else {
      emit('uploadError', response.message || 'Upload thất bại')
    }
  }
  catch (error: any) {
    console.error('[MedicineImageUpload] Error:', error)
    emit('uploadError', error.data?.message || error.message || 'Không thể kết nối đến server')
  }
  finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

/**
 * Trigger file input click
 */
function triggerFileInput() {
  fileInput.value?.click()
}

/**
 * Clear preview and reset
 */
function clearPreview() {
  previewUrl.value = null
  selectedFile.value = null
  uploadProgress.value = 0
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

/**
 * Cleanup on unmount
 */
onUnmounted(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})
</script>

<template>
  <div class="medicine-image-upload">
    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/jpg"
      class="hidden"
      @change="handleFileSelect"
    >

    <!-- Upload Area (No preview yet) -->
    <div v-if="!previewUrl" class="upload-area" @click="triggerFileInput">
      <div class="flex flex-col items-center gap-3">
        <div class="rounded-full bg-blue-100 p-4">
          <Icon name="mdi:image-plus-outline" class="h-12 w-12 text-blue-600" />
        </div>
        <div class="text-center">
          <p class="text-sm text-gray-700 font-medium">
            Chọn ảnh thuốc để nhận diện
          </p>
          <p class="mt-1 text-xs text-gray-500">
            Chọn ảnh từ máy tính - JPEG/PNG, tối đa 5MB
          </p>
        </div>
        <button
          type="button"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium transition-colors hover:bg-blue-700"
        >
          <Icon name="mdi:folder-image" class="mr-1 inline h-4 w-4" />
          Chọn ảnh từ file
        </button>
      </div>
    </div>

    <!-- Preview Area -->
    <div v-else class="preview-area">
      <!-- Image Preview -->
      <div class="relative overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50">
        <img
          :src="previewUrl"
          alt="Preview"
          class="h-64 w-full object-contain"
        >

        <!-- Loading Overlay -->
        <div
          v-if="isUploading"
          class="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <div class="text-center text-white">
            <Icon name="mdi:loading" class="mb-2 h-12 w-12 animate-spin" />
            <p class="text-sm font-medium">
              Đang phân tích...
            </p>
            <div class="mt-3 w-48">
              <div class="h-2 overflow-hidden rounded-full bg-white/30">
                <div
                  class="h-full bg-white transition-all duration-300"
                  :style="{ width: `${uploadProgress}%` }"
                />
              </div>
              <p class="mt-1 text-xs">
                {{ uploadProgress }}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-3 flex gap-2">
        <button
          v-if="!isUploading"
          type="button"
          class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 font-medium transition-colors hover:bg-gray-50"
          @click="clearPreview"
        >
          <Icon name="mdi:close" class="mr-1 inline h-4 w-4" />
          Chọn lại
        </button>
        <button
          v-else
          type="button"
          class="flex-1 rounded-lg bg-gray-300 px-4 py-2 text-sm text-gray-500 font-medium"
          disabled
        >
          <Icon name="mdi:loading" class="mr-1 inline h-4 w-4 animate-spin" />
          Đang xử lý...
        </button>
      </div>

      <!-- Tips -->
      <div class="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
        <p class="text-xs text-blue-900">
          <Icon name="mdi:information" class="mr-1 inline h-4 w-4" />
          <strong>Tips:</strong> Chọn ảnh rõ nét, đủ ánh sáng, tên thuốc trên hộp phải rõ ràng để nhận diện chính xác
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.medicine-image-upload {
  width: 100%;
}

.upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8fafc;
}

.upload-area:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.preview-area {
  width: 100%;
}
</style>
