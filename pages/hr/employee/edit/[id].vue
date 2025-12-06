<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import { api } from '@/utils/api'

definePageMeta({
  layout: 'default',
})

const router = useRouter()
const route = useRoute()
const message = useMessage()
const loading = ref(false)
const loadingData = ref(false)
const formRef = ref<FormInst | null>(null)

// Helper function to get today's date in YYYY-MM-DD format
function getTodayDateString(): string {
  try {
    const today = new Date()
    if (isNaN(today.getTime())) {
      throw new Error('Invalid date')
    }
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
    const testDate = new Date(dateString)
    if (isNaN(testDate.getTime())) {
      throw new Error('Invalid date string')
    }
    return dateString
  } catch (error) {
    console.error('Error generating today date:', error)
    return '2024-01-01'
  }
}

// Initialize date_of_joining safely
const initialDateOfJoining = getTodayDateString()

const formData = ref({
  full_name: '',
  email: '',
  phone: '',
  designation: '',
  department: '',
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

const rules: FormRules = {
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
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
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
    type: 'number',
    validator: (rule: any, value: number) => {
      if (value === null || value < 500000) {
        return new Error('Basic salary must be at least 500,000 VND')
      }
      return true
    },
    trigger: 'blur',
  },
}

async function fetchEmployee() {
  loadingData.value = true
  try {
    const id = route.params.id as string
    const res = await api.get(`/api/hr/employee/${id}`)
    if (res.status && res.data) {
      const emp = res.data
      
      // Format dates safely
      let dateOfBirth: string | null = null
      if (emp.date_of_birth) {
        try {
          const dob = new Date(emp.date_of_birth)
          if (!isNaN(dob.getTime())) {
            const formattedDate = dob.toISOString().split('T')[0]
            // Double-check the formatted date
            const testDate = new Date(formattedDate)
            if (!isNaN(testDate.getTime())) {
              dateOfBirth = formattedDate
            }
          }
        } catch (e) {
          console.error('Error parsing date_of_birth:', e)
          dateOfBirth = null
        }
      }
      
      let dateOfJoining = initialDateOfJoining
      if (emp.date_of_joining) {
        try {
          // Handle both Date objects and strings
          let doj: Date
          if (emp.date_of_joining instanceof Date) {
            doj = emp.date_of_joining
          } else if (typeof emp.date_of_joining === 'string') {
            doj = new Date(emp.date_of_joining)
          } else {
            throw new Error('Invalid date_of_joining type')
          }
          
          if (!isNaN(doj.getTime())) {
            const formattedDate = doj.toISOString().split('T')[0]
            // Validate the formatted date string
            const testDate = new Date(formattedDate)
            if (!isNaN(testDate.getTime())) {
              dateOfJoining = formattedDate
            } else {
              console.warn('Formatted date is invalid, using default')
              dateOfJoining = initialDateOfJoining
            }
          } else {
            console.warn('Parsed date is invalid, using default')
            dateOfJoining = initialDateOfJoining
          }
        } catch (e) {
          console.error('Error parsing date_of_joining:', e)
          dateOfJoining = initialDateOfJoining
        }
      }
      
      // Final validation - ensure dateOfJoining is always valid
      if (!dateOfJoining || dateOfJoining === '' || dateOfJoining === null) {
        dateOfJoining = initialDateOfJoining
      } else {
        const testDate = new Date(dateOfJoining)
        if (isNaN(testDate.getTime())) {
          console.warn('Invalid dateOfJoining after parsing, using default')
          dateOfJoining = initialDateOfJoining
        }
      }
      
      // Set formData with validated dates
      formData.value = {
        full_name: emp.full_name || '',
        email: emp.email || '',
        phone: emp.phone || '',
        designation: emp.designation || 'Employee',
        department: emp.department || 'General',
        date_of_birth: dateOfBirth,
        date_of_joining: dateOfJoining, // Always valid at this point
        address: emp.address || '',
        city: emp.city || '',
        country: emp.country || 'Vietnam',
        salary_basic: emp.salary_basic || null,
        bank_account: emp.bank_account || '',
        bank_name: emp.bank_name || '',
        emergency_contact: emp.emergency_contact || '',
        status: emp.status || 'active',
      }
      
      // One more safety check after setting
      if (!formData.value.date_of_joining || formData.value.date_of_joining === '') {
        formData.value.date_of_joining = initialDateOfJoining
      } else {
        const finalTest = new Date(formData.value.date_of_joining)
        if (isNaN(finalTest.getTime())) {
          formData.value.date_of_joining = initialDateOfJoining
        }
      }
    } else {
      message.error('Employee not found')
      router.push('/hr/employee')
    }
  } catch (error: any) {
    message.error(error.message || 'Failed to load employee data')
    router.push('/hr/employee')
  } finally {
    loadingData.value = false
  }
}

async function handleSubmit() {
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
    const id = route.params.id as string
    
    const submitData: any = {
      full_name: formData.value.full_name.trim(),
      email: formData.value.email.trim(),
      phone: formData.value.phone.trim(),
      designation: formData.value.designation || 'Employee',
      department: formData.value.department || 'General',
      date_of_joining: formData.value.date_of_joining,
      salary_basic: salary,
      status: formData.value.status || 'active',
    }

    if (formData.value.date_of_birth && formData.value.date_of_birth.trim()) {
      const testDob = new Date(formData.value.date_of_birth)
      if (!isNaN(testDob.getTime())) {
        submitData.date_of_birth = formData.value.date_of_birth
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

    console.log('Updating employee with data:', JSON.stringify(submitData, null, 2))

    const res = await api.put(`/api/hr/employee/${id}`, submitData)

    if (res.status) {
      message.success(res.message || 'Employee updated successfully', {
        duration: 3000,
      })
      setTimeout(() => {
        router.push('/hr/employee')
      }, 1000)
    } else {
      message.error(res.message || 'Failed to update employee', {
        duration: 5000,
      })
    }
  } catch (error: any) {
    console.error('Error updating employee:', error)
    let errorMessage = 'Failed to update employee'
    
    if (error.status === 404 || error.statusCode === 404) {
      errorMessage = 'Employee not found. Please check the employee ID.'
    } else if (error.status === 500 || error.statusCode === 500) {
      errorMessage = 'Server error. Please try again later.'
    } else if (error.data?.message) {
      errorMessage = error.data.message
    } else if (error.message) {
      errorMessage = error.message
    }
    
    message.error(errorMessage, {
      duration: 5000,
    })
  } finally {
    loading.value = false
  }
}

// Ensure date_of_joining is always valid on mount
onMounted(() => {
  if (!formData.value.date_of_joining) {
    formData.value.date_of_joining = initialDateOfJoining
  } else {
    const testDate = new Date(formData.value.date_of_joining)
    if (isNaN(testDate.getTime())) {
      formData.value.date_of_joining = initialDateOfJoining
    }
  }
  fetchEmployee()
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
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold">Edit Employee</h1>
        <p class="text-gray-500 dark:text-gray-400">Update employee information</p>
      </div>
      <div class="flex gap-2">
        <n-button @click="router.back()">Cancel</n-button>
        <n-button type="primary" :loading="loading" @click="handleSubmit" class="!bg-blue-600 hover:!bg-blue-700 text-white font-semibold">
          Update Employee
        </n-button>
      </div>
    </div>

    <n-card>
      <n-spin :show="loadingData">
        <n-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-placement="top"
          require-mark-placement="right-hanging"
        >
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
              <n-date-picker
                v-model:formatted-value="formData.date_of_birth"
                type="date"
                value-format="yyyy-MM-dd"
                format="yyyy-MM-dd"
                class="w-full"
                clearable
              />
            </n-form-item>

            <n-form-item label="Date of Joining" path="date_of_joining" required>
              <n-date-picker
                v-model:formatted-value="formData.date_of_joining"
                type="date"
                value-format="yyyy-MM-dd"
                format="yyyy-MM-dd"
                class="w-full"
                :default-value="formData.date_of_joining || initialDateOfJoining"
              />
            </n-form-item>

            <!-- Work Information -->
            <div class="md:col-span-2 mt-4">
              <h3 class="text-lg font-semibold mb-4 text-blue-600">Work Information</h3>
            </div>

            <n-form-item label="Basic Salary (VND)" path="salary_basic">
              <n-input-number
                v-model:value="formData.salary_basic"
                :min="500000"
                :formatter="(value: number | null) => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''"
                :parser="(value: string) => value ? value.replace(/,/g, '') : '0'"
                class="w-full"
                placeholder="Enter basic salary"
                :show-button="false"
              />
              <template #feedback>
                <span class="text-xs text-gray-500">Minimum: 500,000 VND</span>
              </template>
            </n-form-item>

            <n-form-item label="Status" path="status">
              <n-select
                v-model:value="formData.status"
                :options="[
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' },
                  { label: 'On Leave', value: 'on-leave' },
                ]"
              />
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
      </n-spin>
    </n-card>
  </div>
</template>

