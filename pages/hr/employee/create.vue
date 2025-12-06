<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import type { FormInst } from 'naive-ui'
import { api } from '@/utils/api'

definePageMeta({
  layout: 'default',
})

const router = useRouter()
const message = useMessage()
const loading = ref(false)
const formRef = ref<FormInst | null>(null)

// Helper function to get today's date in YYYY-MM-DD format
function getTodayDateString(): string {
  try {
    const today = new Date()
    // Validate date
    if (isNaN(today.getTime())) {
      throw new Error('Invalid date')
    }
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
    // Validate the date string by parsing it
    const testDate = new Date(dateString)
    if (isNaN(testDate.getTime())) {
      throw new Error('Invalid date string')
    }
    return dateString
  } catch (error) {
    console.error('Error generating today date:', error)
    // Fallback to a safe date
    return '2024-01-01'
  }
}

// Initialize date_of_joining safely
const initialDateOfJoining = getTodayDateString()

const formData = ref({
  full_name: '',
  email: '',
  phone: '',
  date_of_birth: null as string | null,
  date_of_joining: initialDateOfJoining,
  address: '',
  city: '',
  country: 'Vietnam',
  salary_basic: null as number | null,
  bank_account: '',
  bank_name: '',
  emergency_contact: '',
  status: 'active',
})

// Ensure date_of_joining is always valid on mount
onMounted(() => {
  // Validate initial date
  if (!formData.value.date_of_joining) {
    formData.value.date_of_joining = initialDateOfJoining
  } else {
    const testDate = new Date(formData.value.date_of_joining)
    if (isNaN(testDate.getTime())) {
      console.warn('Invalid initial date_of_joining, resetting to today')
      formData.value.date_of_joining = initialDateOfJoining
    }
  }
})

// Watch for date_of_joining changes to ensure it's always valid
watch(() => formData.value.date_of_joining, (newValue) => {
  if (newValue && typeof newValue === 'string') {
    const testDate = new Date(newValue)
    if (isNaN(testDate.getTime())) {
      console.warn('Invalid date_of_joining detected, resetting to today')
      formData.value.date_of_joining = initialDateOfJoining
    }
  } else if (!newValue || newValue === '') {
    formData.value.date_of_joining = initialDateOfJoining
  }
}, { immediate: false })

const rules = {
  full_name: {
    required: true,
    message: 'Full name is required',
    trigger: 'blur',
  },
  email: [
    {
      required: true,
      message: 'Email is required',
      trigger: 'blur',
    },
    {
      validator: (rule: any, value: string) => {
        if (!value) return true
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          return new Error('Please enter a valid email')
        }
        return true
      },
      trigger: ['blur', 'input'],
    },
  ],
  phone: {
    required: true,
    message: 'Phone number is required',
    trigger: 'blur',
  },
  date_of_joining: {
    required: true,
    message: 'Date of joining is required',
    trigger: 'change',
  },
  salary_basic: {
    required: true,
    validator: (rule: any, value: number) => {
      if (!value || value < 500000) {
        return new Error('Basic salary must be at least 500,000 VND')
      }
      return true
    },
    trigger: 'blur',
  },
}

async function handleSubmit() {
  // Validate form first
  if (!formRef.value) {
    message.error('Form reference not found')
    return
  }

  try {
    await formRef.value.validate()
  } catch (error) {
    message.warning('Please fill in all required fields correctly')
    return
  }

  // Additional validation
  if (!formData.value.full_name?.trim()) {
    message.error('Full name is required')
    return
  }

  if (!formData.value.email?.trim()) {
    message.error('Email is required')
    return
  }

  if (!formData.value.phone?.trim()) {
    message.error('Phone number is required')
    return
  }

  if (!formData.value.date_of_joining) {
    message.error('Date of joining is required')
    return
  }

  // Validate date_of_joining format
  if (!formData.value.date_of_joining || !formData.value.date_of_joining.trim()) {
    message.error('Date of joining is required')
    return
  }

  // Validate date format
  const testDate = new Date(formData.value.date_of_joining)
  if (isNaN(testDate.getTime())) {
    message.error('Invalid date of joining format')
    return
  }

  const salary = formData.value.salary_basic ? Number(formData.value.salary_basic) : 0
  if (!salary || salary < 500000 || isNaN(salary)) {
    message.error('Basic salary must be at least 500,000 VND')
    return
  }

  loading.value = true
  try {
    // Prepare data - keep dates as strings, backend will convert to Date objects
    const submitData: any = {
      full_name: formData.value.full_name.trim(),
      email: formData.value.email.trim(),
      phone: formData.value.phone.trim(),
      designation: 'Employee', // Default designation
      department: 'General', // Default department
      date_of_joining: formData.value.date_of_joining, // Keep as string, backend will convert
      salary_basic: salary,
      status: formData.value.status || 'active',
    }

    // Optional fields - Employee ID will be auto-generated by backend
    if (formData.value.date_of_birth && formData.value.date_of_birth.trim()) {
      // Validate date format before submitting
      const testDate = new Date(formData.value.date_of_birth)
      if (!isNaN(testDate.getTime())) {
        submitData.date_of_birth = formData.value.date_of_birth // Keep as string
      }
    }

    if (formData.value.address?.trim()) {
      submitData.address = formData.value.address.trim()
    }

    if (formData.value.city?.trim()) {
      submitData.city = formData.value.city.trim()
    }

    if (formData.value.country?.trim()) {
      submitData.country = formData.value.country.trim()
    }

    if (formData.value.bank_name?.trim()) {
      submitData.bank_name = formData.value.bank_name.trim()
    }

    if (formData.value.bank_account?.trim()) {
      submitData.bank_account = formData.value.bank_account.trim()
    }

    if (formData.value.emergency_contact?.trim()) {
      submitData.emergency_contact = formData.value.emergency_contact.trim()
    }

    console.log('Submitting employee data:', JSON.stringify(submitData, null, 2))

    try {
      const res = await api.post('/api/hr/employee', submitData)

      console.log('API Response:', res)

      if (res && res.status) {
        message.success(res.message || 'Employee created successfully', {
          duration: 3000,
        })
        // Wait a bit before redirecting to show success message
        setTimeout(() => {
          router.push('/hr/employee')
        }, 1000)
      } else {
        const errorMsg = res?.message || 'Failed to create employee'
        message.error(errorMsg, {
          duration: 5000,
        })
      }
    } catch (apiError: any) {
      console.error('API Error:', apiError)

      // Handle different error types
      let errorMessage = 'Failed to create employee'

      if (apiError.status === 404 || apiError.statusCode === 404) {
        errorMessage = 'API endpoint not found. Please check server configuration.'
      } else if (apiError.status === 500 || apiError.statusCode === 500) {
        errorMessage = 'Server error. Please try again later.'
      } else if (apiError.data?.message) {
        errorMessage = apiError.data.message
      } else if (apiError.message) {
        errorMessage = apiError.message
      }

      message.error(errorMessage, {
        duration: 5000,
      })
    }
  } catch (error: any) {
    console.error('Error creating employee:', error)
    const errorMessage = error.message || 'Failed to create employee'
    message.error(errorMessage, {
      duration: 5000,
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold">Add New Employee</h1>
        <p class="text-gray-500 dark:text-gray-400">Create a new employee record</p>
      </div>
      <div class="flex gap-2">
        <n-button @click="router.push('/hr/employee')">Cancel</n-button>
        <n-button type="primary" :loading="loading" @click="handleSubmit"
          class="!bg-blue-600 hover:!bg-blue-700 text-white font-semibold">
          Save Employee
        </n-button>
      </div>
    </div>

    <n-card>
      <n-form ref="formRef" :model="formData" :rules="rules" label-placement="top"
        require-mark-placement="right-hanging">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Basic Information -->
          <div class="md:col-span-2">
            <h3 class="text-lg font-semibold mb-4 text-blue-600">Basic Information</h3>
          </div>

          <n-form-item label="Full Name" path="full_name">
            <n-input v-model:value="formData.full_name" placeholder="Enter full name" />
          </n-form-item>

          <n-form-item label="Email" path="email">
            <n-input v-model:value="formData.email" placeholder="employee@example.com" />
          </n-form-item>

          <n-form-item label="Phone" path="phone">
            <n-input v-model:value="formData.phone" placeholder="Enter phone number" />
          </n-form-item>

          <n-form-item label="Date of Birth" path="date_of_birth">
            <n-date-picker v-model:formatted-value="formData.date_of_birth" type="date" value-format="yyyy-MM-dd"
              format="yyyy-MM-dd" class="w-full" clearable :default-value="null" />
          </n-form-item>

          <n-form-item label="Date of Joining" path="date_of_joining" required>
            <n-date-picker v-model:formatted-value="formData.date_of_joining" type="date" value-format="yyyy-MM-dd"
              format="yyyy-MM-dd" class="w-full" />
          </n-form-item>

          <!-- Work Information -->
          <div class="md:col-span-2 mt-4">
            <h3 class="text-lg font-semibold mb-4 text-blue-600">Work Information</h3>
          </div>

          <n-form-item label="Basic Salary (VND)" path="salary_basic">
            <n-input-number v-model:value="formData.salary_basic" :min="500000"
              :formatter="(value: number | null) => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''"
              :parser="(value: string) => value ? value.replace(/,/g, '') : '0'" class="w-full"
              placeholder="Enter basic salary" :show-button="false" />
            <template #feedback>
              <span class="text-xs text-gray-500">Minimum: 500,000 VND</span>
            </template>
          </n-form-item>

          <n-form-item label="Status" path="status">
            <n-select v-model:value="formData.status" :options="[
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
              { label: 'On Leave', value: 'on-leave' },
            ]" />
          </n-form-item>

          <!-- Address Information -->
          <div class="md:col-span-2 mt-4">
            <h3 class="text-lg font-semibold mb-4 text-blue-600">Address Information</h3>
          </div>

          <n-form-item label="Address" path="address">
            <n-input v-model:value="formData.address" type="textarea" :rows="2" placeholder="Enter address" />
          </n-form-item>

          <n-form-item label="City" path="city">
            <n-input v-model:value="formData.city" placeholder="Enter city" />
          </n-form-item>

          <n-form-item label="Country" path="country">
            <n-input v-model:value="formData.country" placeholder="Enter country" />
          </n-form-item>

          <!-- Bank Information -->
          <div class="md:col-span-2 mt-4">
            <h3 class="text-lg font-semibold mb-4 text-blue-600">Bank Information</h3>
          </div>

          <n-form-item label="Bank Name" path="bank_name">
            <n-input v-model:value="formData.bank_name" placeholder="Enter bank name" />
          </n-form-item>

          <n-form-item label="Bank Account" path="bank_account">
            <n-input v-model:value="formData.bank_account" placeholder="Enter bank account number" />
          </n-form-item>

          <!-- Emergency Contact -->
          <div class="md:col-span-2 mt-4">
            <h3 class="text-lg font-semibold mb-4 text-blue-600">Emergency Contact</h3>
          </div>

          <n-form-item label="Emergency Contact" path="emergency_contact">
            <n-input v-model:value="formData.emergency_contact" placeholder="Enter emergency contact number" />
          </n-form-item>
        </div>
      </n-form>
    </n-card>
  </div>
</template>
