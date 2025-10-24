<script setup lang="ts">
const { messages, removeMessage } = useMessage()

// Debug: Watch messages changes
watch(messages, (newMessages) => {
  console.log('Messages updated:', newMessages)
}, { deep: true })

function getIcon(type: string) {
  switch (type) {
    case 'success':
      return 'i-lucide-check-circle'
    case 'error':
      return 'i-lucide-x-circle'
    case 'warning':
      return 'i-lucide-alert-triangle'
    case 'info':
      return 'i-lucide-info'
    default:
      return 'i-lucide-info'
  }
}

function getColor(type: string) {
  switch (type) {
    case 'success':
      return 'bg-green-500'
    case 'error':
      return 'bg-red-500'
    case 'warning':
      return 'bg-yellow-500'
    case 'info':
      return 'bg-blue-500'
    default:
      return 'bg-gray-500'
  }
}
</script>

<template>
  <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
    <TransitionGroup name="message">
      <div
        v-for="message in messages"
        :key="message.id"
        :class="[
          'flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg text-white min-w-[300px] max-w-md',
          getColor(message.type),
        ]"
      >
        <Icon :name="getIcon(message.type)" class="h-5 w-5 flex-shrink-0" />
        <span class="flex-1 text-sm font-medium">{{ message.text }}</span>
        <button
          class="flex-shrink-0 hover:opacity-70 transition-opacity"
          @click="removeMessage(message.id)"
        >
          <Icon name="i-lucide-x" class="h-4 w-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.message-enter-active,
.message-leave-active {
  transition: all 0.3s ease;
}

.message-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.message-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
</style>
