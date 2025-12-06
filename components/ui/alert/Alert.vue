<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import type { MessageType } from "@/composables/useMessage"
import { cn } from "@/lib/utils"
import { ref, onMounted } from "vue"

const props = defineProps<{
  id?: number
  class?: HTMLAttributes["class"]
  variant?: MessageType
  onClose?: (id: number) => void
}>()

const isVisible = ref(true)

const closeMessage = () => {
  isVisible.value = false
  if (props.id !== undefined) props.onClose?.(props.id) // ✅ Check ID hợp lệ
}

onMounted(() => {
  setTimeout(closeMessage, 3000) // ✅ Auto close sau 3s
})
</script>

<template>
  <transition name="fade">
    <div v-if="isVisible" :class="cn(variant, props.class)" role="alert">
      <slot />
      <button @click="closeMessage" class="ml-2 text-lg">✖</button>
    </div>
  </transition>
</template>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>