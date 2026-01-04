<template>
  <!-- Medical Profile Warning Alert -->
  <div v-if="hasWarnings" class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-4">
    <div class="flex items-start gap-3">
      <AlertTriangle class="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
      <div class="flex-1">
        <h4 class="font-semibold text-red-800 mb-2">⚠️ Medical Warning</h4>
        <div class="space-y-2">
          <div v-for="(warning, idx) in warnings" :key="idx" class="text-sm text-red-700">
            {{ warning }}
          </div>
        </div>
        <div v-if="recommendations.length > 0" class="mt-3 pt-3 border-t border-red-200">
          <h5 class="font-medium text-amber-800 mb-1">💡 Recommendations:</h5>
          <div v-for="(rec, idx) in recommendations" :key="'rec-' + idx" class="text-sm text-amber-700">
            {{ rec }}
          </div>
        </div>
        <n-button size="small" type="warning" class="mt-3" @click="showDetailDialog = true">
          View Medical Profile Details
        </n-button>
      </div>
    </div>
  </div>

  <!-- Medical Profile Info (when no warnings but has profile) -->
  <div v-else-if="hasProfile && !hasWarnings" class="bg-green-50 border-l-4 border-green-500 p-3 rounded-lg mb-4">
    <div class="flex items-center gap-2">
      <CheckCircle class="w-5 h-5 text-green-500" />
      <span class="text-sm text-green-700">Medical profile checked - No warnings</span>
      <n-button size="tiny" quaternary @click="showDetailDialog = true" class="ml-auto text-green-600">
        View Profile
      </n-button>
    </div>
  </div>

  <!-- Medical Profile Detail Dialog -->
  <n-modal v-model:show="showDetailDialog" preset="card" style="max-width: 600px" title="Customer Medical Profile">
    <div v-if="medicalProfile" class="space-y-4">
      <!-- Chronic Conditions -->
      <div>
        <h4 class="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <HeartPulse class="w-5 h-5 text-red-500" />
          Chronic Conditions
        </h4>
        <div v-if="medicalProfile.chronic_conditions?.length > 0" class="flex flex-wrap gap-2">
          <n-tag v-for="(condition, i) in medicalProfile.chronic_conditions" :key="i" type="error" size="medium">
            {{ condition }}
          </n-tag>
        </div>
        <p v-else class="text-gray-500 text-sm">None</p>
      </div>

      <!-- Allergies -->
      <div>
        <h4 class="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <AlertOctagon class="w-5 h-5 text-amber-500" />
          Drug Allergies
        </h4>
        <div v-if="medicalProfile.allergies?.length > 0" class="flex flex-wrap gap-2">
          <n-tag v-for="(allergy, i) in medicalProfile.allergies" :key="i" type="warning" size="medium">
            {{ allergy }}
          </n-tag>
        </div>
        <p v-else class="text-gray-500 text-sm">None</p>
      </div>

      <!-- Current Medications -->
      <div>
        <h4 class="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <Pill class="w-5 h-5 text-blue-500" />
          Current Medications
        </h4>
        <div v-if="medicalProfile.current_medications?.length > 0" class="flex flex-wrap gap-2">
          <n-tag v-for="(med, i) in medicalProfile.current_medications" :key="i" type="info" size="medium">
            {{ med }}
          </n-tag>
        </div>
        <p v-else class="text-gray-500 text-sm">None</p>
      </div>

      <!-- Warnings Section -->
      <div v-if="warnings.length > 0" class="bg-red-50 p-4 rounded-lg">
        <h4 class="font-semibold text-red-800 mb-2">⚠️ Warnings for current prescription:</h4>
        <ul class="space-y-1">
          <li v-for="(warning, idx) in warnings" :key="idx" class="text-sm text-red-700">
            {{ warning }}
          </li>
        </ul>
      </div>

      <!-- Recommendations Section -->
      <div v-if="recommendations.length > 0" class="bg-amber-50 p-4 rounded-lg">
        <h4 class="font-semibold text-amber-800 mb-2">💡 Recommendations:</h4>
        <ul class="space-y-1">
          <li v-for="(rec, idx) in recommendations" :key="idx" class="text-sm text-amber-700">
            {{ rec }}
          </li>
        </ul>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end">
        <n-button @click="showDetailDialog = false">Đóng</n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AlertTriangle, CheckCircle, HeartPulse, AlertOctagon, Pill } from 'lucide-vue-next'

const props = defineProps<{
  hasWarnings: boolean
  hasProfile: boolean
  warnings: string[]
  recommendations: string[]
  medicalProfile: {
    chronic_conditions?: string[]
    allergies?: string[]
    current_medications?: string[]
  } | null
}>()

const showDetailDialog = ref(false)
</script>
