<template>
  <n-modal v-model:show="showModal" preset="card" style="max-width: 700px" title="📋 Medication Usage Guide">
    <div class="space-y-6">
      <!-- Customer Info -->
      <div class="bg-blue-50 p-4 rounded-lg">
        <div class="flex items-center gap-2 mb-2">
          <User class="w-5 h-5 text-blue-600" />
          <h4 class="font-semibold text-blue-800">Customer Information</h4>
        </div>
        <p class="text-blue-700">{{ customerName }}</p>
        <p v-if="hasProfile" class="text-sm text-blue-600 mt-1">
          <span v-if="medicalProfile?.chronic_conditions?.length">
            Chronic Conditions: {{ medicalProfile.chronic_conditions.join(', ') }}
          </span>
        </p>
      </div>

      <!-- Usage Guides for Each Medicine -->
      <div v-for="(item, index) in usageGuides" :key="index" class="border rounded-lg overflow-hidden">
        <div class="bg-gray-100 px-4 py-2 flex items-center gap-2">
          <Pill class="w-5 h-5 text-green-600" />
          <h4 class="font-semibold text-gray-800">{{ item.medicine }}</h4>
        </div>
        <div class="p-4 space-y-3">
          <!-- Dosage -->
          <div v-if="item.guide?.dosage" class="flex items-start gap-2">
            <div class="bg-purple-100 p-1.5 rounded">
              <Clock class="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p class="font-medium text-gray-700 text-sm">Dosage</p>
              <p class="text-gray-600 text-sm">{{ item.guide.dosage }}</p>
            </div>
          </div>

          <!-- Instructions -->
          <div class="flex items-start gap-2">
            <div class="bg-blue-100 p-1.5 rounded">
              <FileText class="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p class="font-medium text-gray-700 text-sm">Usage Instructions</p>
              <p class="text-gray-600 text-sm">{{ item.guide?.instruction || 'Take as directed on the label' }}</p>
            </div>
          </div>

          <!-- Food Interaction -->
          <div class="flex items-start gap-2">
            <div class="bg-amber-100 p-1.5 rounded">
              <Utensils class="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p class="font-medium text-gray-700 text-sm">Food Interaction</p>
              <p class="text-gray-600 text-sm">{{ item.guide?.food || 'Can be taken before or after meals' }}</p>
            </div>
          </div>

          <!-- Warnings -->
          <div v-if="item.guide?.warning" class="flex items-start gap-2">
            <div class="bg-red-100 p-1.5 rounded">
              <AlertTriangle class="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p class="font-medium text-gray-700 text-sm">Important Notice</p>
              <p class="text-red-600 text-sm">{{ item.guide.warning }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- General Recommendations -->
      <div v-if="recommendations.length > 0" class="bg-green-50 p-4 rounded-lg">
        <div class="flex items-center gap-2 mb-2">
          <Lightbulb class="w-5 h-5 text-green-600" />
          <h4 class="font-semibold text-green-800">General Recommendations</h4>
        </div>
        <ul class="space-y-1">
          <li v-for="(rec, idx) in recommendations" :key="idx" class="text-sm text-green-700 flex items-start gap-2">
            <span>•</span>
            <span>{{ rec }}</span>
          </li>
        </ul>
      </div>

      <!-- Medical Warnings -->
      <div v-if="warnings.length > 0" class="bg-red-50 p-4 rounded-lg border border-red-200">
        <div class="flex items-center gap-2 mb-2">
          <AlertOctagon class="w-5 h-5 text-red-600" />
          <h4 class="font-semibold text-red-800">Special Warnings</h4>
        </div>
        <ul class="space-y-1">
          <li v-for="(warning, idx) in warnings" :key="idx" class="text-sm text-red-700 flex items-start gap-2">
            <span>⚠️</span>
            <span>{{ warning }}</span>
          </li>
        </ul>
      </div>

      <!-- Disclaimer -->
      <div class="bg-gray-100 p-3 rounded-lg text-center">
        <p class="text-xs text-gray-500">
          💊 This is a reference guide. Please read the product insert carefully 
          or consult a doctor/pharmacist for more information.
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between items-center">
        <n-button @click="printGuide" type="info" size="small">
          <template #icon>
            <Printer class="w-4 h-4" />
          </template>
          Print Guide
        </n-button>
        <n-button type="primary" @click="closeModal">
          Done
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  User, Pill, Clock, FileText, Utensils, 
  AlertTriangle, Lightbulb, AlertOctagon, Printer 
} from 'lucide-vue-next'

const props = defineProps<{
  show: boolean
  customerName: string
  hasProfile: boolean
  medicalProfile: {
    chronic_conditions?: string[]
    allergies?: string[]
    current_medications?: string[]
  } | null
  usageGuides: Array<{
    medicine: string
    guide: {
      instruction?: string
      food?: string
      warning?: string
      dosage?: string
    }
  }>
  warnings: string[]
  recommendations: string[]
}>()

const emit = defineEmits(['update:show', 'close'])

const showModal = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

const closeModal = () => {
  emit('update:show', false)
  emit('close')
}

const printGuide = () => {
  // Create print content
  let content = `
    <html>
    <head>
      <title>Medication Usage Guide - ${props.customerName}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #1a56db; font-size: 18px; }
        h2 { color: #333; font-size: 14px; margin-top: 15px; }
        .medicine { border: 1px solid #ddd; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .medicine h3 { color: #059669; margin: 0 0 10px 0; }
        .item { margin: 5px 0; font-size: 12px; }
        .warning { color: #dc2626; background: #fef2f2; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .footer { margin-top: 20px; font-size: 10px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <h1>📋 MEDICATION USAGE GUIDE</h1>
      <p><strong>Customer:</strong> ${props.customerName}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US')}</p>
  `

  // Add medicine guides
  for (const item of props.usageGuides) {
    content += `
      <div class="medicine">
        <h3>💊 ${item.medicine}</h3>
        ${item.guide?.dosage ? `<div class="item"><strong>Dosage:</strong> ${item.guide.dosage}</div>` : ''}
        <div class="item"><strong>Instructions:</strong> ${item.guide?.instruction || 'Take as directed on the label'}</div>
        <div class="item"><strong>Food Interaction:</strong> ${item.guide?.food || 'Before or after meals'}</div>
        ${item.guide?.warning ? `<div class="item" style="color: #dc2626;"><strong>⚠️ Notice:</strong> ${item.guide.warning}</div>` : ''}
      </div>
    `
  }

  // Add warnings
  if (props.warnings.length > 0) {
    content += `<div class="warning"><h2>⚠️ WARNINGS</h2><ul>`
    for (const warning of props.warnings) {
      content += `<li>${warning}</li>`
    }
    content += `</ul></div>`
  }

  content += `
      <div class="footer">
        Pharmacare - Your Trusted Pharmacy<br>
        Please consult a doctor/pharmacist for more information.
      </div>
    </body>
    </html>
  `

  // Open print window
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(content)
    printWindow.document.close()
    printWindow.print()
  }
}
</script>
