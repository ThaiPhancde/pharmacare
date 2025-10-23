<script setup lang="ts">
/**
 * Quick Action Buttons
 * Buttons để user click thay vì gõ câu hỏi
 */

interface ActionButton {
  label: string
  icon: string
  action: string
  query: string
  color?: string
}

interface Props {
  buttons?: ActionButton[]
  layout?: 'horizontal' | 'vertical' | 'grid'
}

const props = withDefaults(defineProps<Props>(), {
  buttons: () => [],
  layout: 'horizontal',
})

const emit = defineEmits<{
  (e: 'action', action: string, query: string): void
}>()

// Default action buttons nếu không truyền vào
const defaultButtons: ActionButton[] = [
  {
    label: 'Hỏi Giá',
    icon: 'mdi:currency-usd',
    action: 'ask_price',
    query: 'Giá thuốc này bao nhiêu?',
    color: 'blue',
  },
  {
    label: 'Tác Dụng',
    icon: 'mdi:heart-pulse',
    action: 'ask_effects',
    query: 'Thuốc này có tác dụng gì?',
    color: 'green',
  },
  {
    label: 'Liều Dùng',
    icon: 'mdi:pill',
    action: 'ask_dosage',
    query: 'Liều dùng như thế nào?',
    color: 'purple',
  },
  {
    label: 'Tác Dụng Phụ',
    icon: 'mdi:alert-circle',
    action: 'ask_side_effects',
    query: 'Có tác dụng phụ gì không?',
    color: 'amber',
  },
  {
    label: 'Tồn Kho',
    icon: 'mdi:package-variant',
    action: 'ask_stock',
    query: 'Còn hàng không?',
    color: 'teal',
  },
  {
    label: 'Thay Thế',
    icon: 'mdi:swap-horizontal',
    action: 'ask_alternatives',
    query: 'Có thuốc thay thế nào không?',
    color: 'indigo',
  },
]

const buttonsToShow = computed(() => {
  return props.buttons.length > 0 ? props.buttons : defaultButtons
})

function handleClick(button: ActionButton) {
  emit('action', button.action, button.query)
}

function getButtonClass(color: string = 'blue') {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700 text-white',
    green: 'bg-green-600 hover:bg-green-700 text-white',
    purple: 'bg-purple-600 hover:bg-purple-700 text-white',
    amber: 'bg-amber-600 hover:bg-amber-700 text-white',
    teal: 'bg-teal-600 hover:bg-teal-700 text-white',
    indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    red: 'bg-red-600 hover:bg-red-700 text-white',
    gray: 'bg-gray-600 hover:bg-gray-700 text-white',
  }
  return colorClasses[color as keyof typeof colorClasses] || colorClasses.blue
}
</script>

<template>
  <div
    class="quick-actions"
    :class="{
      'flex gap-2 flex-wrap': layout === 'horizontal',
      'flex flex-col gap-2': layout === 'vertical',
      'grid grid-cols-2 md:grid-cols-3 gap-2': layout === 'grid',
    }"
  >
    <button
      v-for="(button, index) in buttonsToShow"
      :key="index"
      class="action-button px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
      :class="getButtonClass(button.color)"
      @click="handleClick(button)"
    >
      <Icon :name="button.icon" class="text-lg" />
      <span>{{ button.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.quick-actions {
  animation: fadeInUp 0.4s ease-out;
}

.action-button {
  min-height: 44px;
  user-select: none;
  cursor: pointer;
}

.action-button:active {
  transform: scale(0.98);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .action-button {
    font-size: 12px;
    padding: 8px 12px;
  }
  
  .action-button :deep(.icon) {
    font-size: 16px;
  }
}
</style>
