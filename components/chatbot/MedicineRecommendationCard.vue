<script setup lang="ts">
/**
 * Medicine Recommendation Card
 * Hiển thị thẻ thuốc với đầy đủ thông tin + action buttons
 */

interface Medicine {
  id: string
  name: string
  generic: string
  description: string
  price: number
  image?: string
  dosage?: string
  frequency?: string
  duration?: string
  reasoning?: string
  warnings?: string[]
}

interface Props {
  medicine: Medicine
  showReasoning?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showReasoning: true,
  compact: false,
})

const emit = defineEmits<{
  (e: 'action', action: string, data: any): void
}>()

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price)
}

const handleAction = (action: string) => {
  emit('action', action, { medicineId: props.medicine.id, medicine: props.medicine })
}
</script>

<template>
  <div 
    class="medicine-card border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-white"
    :class="{ 'compact': compact }"
  >
    <!-- Header with image and basic info -->
    <div class="card-header flex gap-4 p-4">
      <!-- Medicine Image -->
      <div class="medicine-image flex-shrink-0">
        <img
          v-if="medicine.image"
          :src="medicine.image"
          :alt="medicine.name"
          class="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
        />
        <div
          v-else
          class="w-24 h-24 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg border-2 border-blue-300"
        >
          <Icon name="mdi:pill" class="text-4xl text-blue-600" />
        </div>
      </div>

      <!-- Basic Info -->
      <div class="medicine-info flex-1">
        <h3 class="text-xl font-bold text-gray-900 mb-1">
          {{ medicine.name }}
        </h3>
        <p class="text-sm text-gray-600 mb-2">
          <Icon name="mdi:molecule" class="inline text-green-600" />
          Hoạt chất: <span class="font-semibold">{{ medicine.generic }}</span>
        </p>
        <p class="text-lg font-bold text-blue-600">
          {{ formatPrice(medicine.price) }}
        </p>
      </div>
    </div>

    <!-- Description -->
    <div v-if="!compact && medicine.description" class="px-4 pb-2">
      <p class="text-sm text-gray-700">
        {{ medicine.description }}
      </p>
    </div>

    <!-- Dosage Instructions (if provided by AI) -->
    <div v-if="!compact && (medicine.dosage || medicine.frequency)" class="px-4 py-3 bg-blue-50 border-t border-blue-100">
      <h4 class="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-1">
        <Icon name="mdi:pill-multiple" />
        Cách Sử Dụng:
      </h4>
      <ul class="text-sm text-gray-700 space-y-1">
        <li v-if="medicine.dosage">
          <Icon name="mdi:check-circle" class="inline text-green-600 text-xs" />
          Liều dùng: <span class="font-medium">{{ medicine.dosage }}</span>
        </li>
        <li v-if="medicine.frequency">
          <Icon name="mdi:clock-outline" class="inline text-blue-600 text-xs" />
          Tần suất: <span class="font-medium">{{ medicine.frequency }}</span>
        </li>
        <li v-if="medicine.duration">
          <Icon name="mdi:calendar" class="inline text-purple-600 text-xs" />
          Thời gian: <span class="font-medium">{{ medicine.duration }}</span>
        </li>
      </ul>
    </div>

    <!-- AI Reasoning (why this medicine) -->
    <div v-if="showReasoning && medicine.reasoning" class="px-4 py-3 bg-green-50 border-t border-green-100">
      <h4 class="text-sm font-semibold text-green-900 mb-2 flex items-center gap-1">
        <Icon name="mdi:lightbulb" />
        Tại Sao Bác Sĩ Chọn Thuốc Này:
      </h4>
      <p class="text-sm text-gray-700">
        {{ medicine.reasoning }}
      </p>
    </div>

    <!-- Warnings -->
    <div v-if="!compact && medicine.warnings && medicine.warnings.length > 0" class="px-4 py-3 bg-red-50 border-t border-red-100">
      <h4 class="text-sm font-semibold text-red-900 mb-2 flex items-center gap-1">
        <Icon name="mdi:alert" />
        Cảnh Báo:
      </h4>
      <ul class="text-sm text-red-700 space-y-1">
        <li v-for="(warning, idx) in medicine.warnings" :key="idx" class="flex items-start gap-1">
          <Icon name="mdi:alert-circle" class="mt-0.5 text-xs flex-shrink-0" />
          <span>{{ warning }}</span>
        </li>
      </ul>
    </div>

    <!-- Action Buttons -->
    <div class="card-actions p-4 border-t border-gray-200 flex flex-wrap gap-2">
      <button
        class="action-btn btn-primary flex-1 min-w-[120px] px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
        @click="handleAction('view_details')"
      >
        <Icon name="mdi:information" />
        Chi Tiết
      </button>
      
      <button
        class="action-btn btn-secondary flex-1 min-w-[120px] px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
        @click="handleAction('ask_dosage')"
      >
        <Icon name="mdi:pill" />
        Liều Dùng
      </button>
      
      <button
        class="action-btn btn-warning flex-1 min-w-[120px] px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-1"
        @click="handleAction('ask_side_effects')"
      >
        <Icon name="mdi:alert-circle" />
        Tác Dụng Phụ
      </button>
      
      <button
        class="action-btn btn-success flex-1 min-w-[120px] px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-1"
        @click="handleAction('add_to_cart')"
      >
        <Icon name="mdi:cart-plus" />
        Mua Ngay
      </button>
    </div>
  </div>
</template>

<style scoped>
.medicine-card {
  max-width: 600px;
  animation: slideInUp 0.3s ease-out;
}

.medicine-card.compact {
  max-width: 400px;
}

.medicine-card.compact .card-header {
  padding: 12px;
}

.medicine-card.compact .medicine-image img,
.medicine-card.compact .medicine-image div {
  width: 60px;
  height: 60px;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.action-btn {
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-btn:active {
  transform: translateY(0);
}
</style>
