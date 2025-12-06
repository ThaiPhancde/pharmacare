<template>
  <div v-if="mounted">
    <PurchaseAddEdit :key="componentKey" />
  </div>
  <div v-else class="flex items-center justify-center min-h-[400px]">
    <div class="text-gray-500">Loading...</div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

const mounted = ref(false)
const componentKey = ref(0)

onMounted(async () => {
  // Wait for next tick to ensure parent component is fully mounted
  await nextTick()
  // Small delay to ensure DOM is stable
  await new Promise(resolve => setTimeout(resolve, 100))
  componentKey.value = Date.now()
  mounted.value = true
})
</script>