<template>
  <div class="barcode-generator">
    <svg v-if="barcodeValue" ref="barcodeElement" class="w-full"></svg>
    <div v-if="options.displayValue && barcodeValue" class="text-center text-xs mt-1">{{ barcodeValue }}</div>
    <div v-if="!barcodeValue" class="text-center text-gray-400 py-2">{{ placeholder }}</div>
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import JsBarcode from 'jsbarcode';

const props = defineProps({
  value: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'No barcode available'
  },
  format: {
    type: String,
    default: 'CODE128'
  },
  lineColor: {
    type: String,
    default: '#000000'
  },
  width: {
    type: Number,
    default: 2
  },
  height: {
    type: Number,
    default: 100
  },
  displayValue: {
    type: Boolean,
    default: true
  },
  fontSize: {
    type: Number,
    default: 20
  },
  textMargin: {
    type: Number,
    default: 2
  },
  background: {
    type: String,
    default: '#ffffff'
  }
});

const barcodeElement = ref(null);
const barcodeValue = ref(props.value);

// Transform barcode options into format expected by JsBarcode
const options = {
  format: props.format,
  lineColor: props.lineColor,
  width: props.width,
  height: props.height,
  displayValue: props.displayValue,
  fontSize: props.fontSize,
  textMargin: props.textMargin,
  background: props.background
};

// Function to generate the barcode
const generateBarcode = () => {
  if (barcodeElement.value && barcodeValue.value) {
    try {
      JsBarcode(barcodeElement.value, barcodeValue.value, options);
    } catch (error) {
      console.error('Error generating barcode:', error);
    }
  }
};

// Watch for changes to the input value
watch(() => props.value, (newValue) => {
  barcodeValue.value = newValue;
  if (newValue) {
    // Use nextTick to ensure DOM is updated
    nextTick(() => {
      generateBarcode();
    });
  }
});

// Initialize barcode on mount
onMounted(() => {
  if (barcodeValue.value) {
    generateBarcode();
  }
});
</script>

<style scoped>
.barcode-generator {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style> 