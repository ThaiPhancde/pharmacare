<template>
  <div class="barcode-scanner">
    <div class="relative">
      <div class="mb-2 flex items-center justify-between">
        <h3 class="font-medium">{{ title }}</h3>
        <n-button size="small" @click="toggleScanner" :type="isScanning ? 'error' : 'default'">
          {{ isScanning ? 'Stop' : 'Start' }} Scanner
        </n-button>
      </div>

      <div v-if="isScanning" class="scanner-container relative">
        <div class="overlay absolute inset-0 pointer-events-none">
          <div class="scan-region"></div>
        </div>
        <StreamBarcodeReader 
          @decode="onDecode" 
          @loaded="onLoaded" 
          :constraints="{ 
            video: { 
              width: { ideal: 640 }, 
              height: { ideal: 480 }, 
              facingMode: 'environment' 
            } 
          }"
        />
      </div>

      <div v-if="lastResult" class="mt-2 p-2 bg-green-50 text-green-700 rounded border border-green-200">
        Last scanned: {{ lastResult }}
      </div>
      <div v-if="errorMessage" class="mt-2 p-2 bg-red-50 text-red-700 rounded border border-red-200">
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { StreamBarcodeReader } from 'vue-barcode-reader';

const props = defineProps({
  title: {
    type: String,
    default: 'Barcode Scanner',
  },
  autoStart: {
    type: Boolean,
    default: false,
  }
});

const emit = defineEmits(['decode']);

const isScanning = ref(props.autoStart);
const lastResult = ref('');
const errorMessage = ref('');

const onDecode = (result) => {
  lastResult.value = result;
  emit('decode', result);
  
  // Play a success sound
  const audio = new Audio('/barcode-beep.mp3');
  audio.play().catch(err => console.log('Error playing sound:', err));
};

const onLoaded = () => {
  errorMessage.value = '';
};

const toggleScanner = () => {
  isScanning.value = !isScanning.value;
  if (!isScanning.value) {
    lastResult.value = '';
  }
};

// Ensure camera is turned off when component is destroyed
onBeforeUnmount(() => {
  isScanning.value = false;
});
</script>

<style scoped>
.scanner-container {
  width: 100%;
  max-width: 640px;
  height: 320px;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.overlay {
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scan-region {
  width: 250px;
  height: 150px;
  border: 2px solid #4caf50;
  border-radius: 8px;
  box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.5);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
}
</style> 