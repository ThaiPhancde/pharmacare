<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import { api } from '@/utils/api'
import { NTag, NButton } from 'naive-ui'
import { h } from 'vue'

definePageMeta({
  layout: 'default',
})

const router = useRouter()
const route = useRoute()
const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const employee = ref<any>(null)

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: string | Date) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

async function fetchEmployee() {
  loading.value = true
  try {
    const id = route.params.id as string
    const res = await api.get(`/api/hr/employee/${id}`)
    if (res.status && res.data) {
      employee.value = res.data
    } else {
      message.error('Employee not found')
      router.push('/hr/employee')
    }
  } catch (error: any) {
    message.error(error.message || 'Failed to load employee data')
    router.push('/hr/employee')
  } finally {
    loading.value = false
  }
}

async function handleDelete() {
  dialog.warning({
    title: 'Delete Employee',
    content: 'Are you sure you want to delete this employee? This action cannot be undone.',
    positiveText: 'Delete',
    negativeText: 'Cancel',

    positiveButtonProps: {
      type: 'error',
    },
    negativeButtonProps: {
      type: 'default',

    },
    onPositiveClick: async () => {
      loading.value = true
      try {
        const res = await api.delete(`/api/hr/employee/${route.params.id}`)
        if (res.status) {
          message.success('Employee deleted successfully')
          router.push('/hr/employee')
        } else {
          message.error(res.message || 'Failed to delete employee')
        }
      } catch (error: any) {
        message.error(error.message || 'Failed to delete employee')
      } finally {
        loading.value = false
      }
    },
  })
}

onMounted(() => {
  fetchEmployee()
})
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold">Employee Details</h1>
        <p class="text-gray-500 dark:text-gray-400">View employee information</p>
      </div>
      <div class="flex gap-2">
        <n-button @click="router.back()">Back</n-button>
        <n-button type="info" @click="router.push(`/hr/reward-penalty/employee/${route.params.id}`)">
          🎁 Rewards & Penalties
        </n-button>
        <n-button @click="router.push(`/hr/employee/edit/${route.params.id}`)">Edit</n-button>
        <n-button type="error" @click="handleDelete" :loading="loading">Delete</n-button>
      </div>
    </div>

    <n-spin :show="loading">
      <div v-if="employee" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Basic Information -->
        <n-card title="Basic Information" class="md:col-span-2">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-sm text-gray-500 mb-1">Full Name</div>
              <div class="font-semibold">{{ employee.full_name }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500 mb-1">Email</div>
              <div>{{ employee.email }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500 mb-1">Phone</div>
              <div>{{ employee.phone }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500 mb-1">Date of Birth</div>
              <div>{{ formatDate(employee.date_of_birth) }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500 mb-1">Date of Joining</div>
              <div>{{ formatDate(employee.date_of_joining) }}</div>
            </div>
          </div>
        </n-card>

        <!-- Status Card -->
        <n-card title="Status">
          <div class="space-y-4">
            <div>
              <div class="text-sm text-gray-500 mb-2">Current Status</div>
              <n-tag
                :type="employee.status === 'active' ? 'success' : employee.status === 'on-leave' ? 'warning' : 'default'"
                round size="large">
                {{ employee.status === 'active' ? 'Active' : employee.status === 'on-leave' ? 'On Leave' : 'Inactive' }}
              </n-tag>
            </div>
            <div>
              <div class="text-sm text-gray-500 mb-1">Basic Salary</div>
              <div class="text-xl font-bold text-green-600">{{ formatCurrency(employee.salary_basic) }}</div>
            </div>
          </div>
        </n-card>

        <!-- Work Information -->
        <n-card title="Work Information" class="md:col-span-2">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-sm text-gray-500 mb-1">Department</div>
              <div class="font-medium">{{ employee.department }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500 mb-1">Designation</div>
              <div class="font-medium">{{ employee.designation }}</div>
            </div>
          </div>
        </n-card>

        <!-- Address Information -->
        <n-card title="Address Information">
          <div class="space-y-2">
            <div>
              <div class="text-sm text-gray-500 mb-1">Address</div>
              <div>{{ employee.address || 'N/A' }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500 mb-1">City</div>
              <div>{{ employee.city || 'N/A' }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500 mb-1">Country</div>
              <div>{{ employee.country || 'N/A' }}</div>
            </div>
          </div>
        </n-card>

        <!-- Bank Information -->
        <n-card title="Bank Information" class="md:col-span-2">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-sm text-gray-500 mb-1">Bank Name</div>
              <div>{{ employee.bank_name || 'N/A' }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500 mb-1">Bank Account</div>
              <div>{{ employee.bank_account || 'N/A' }}</div>
            </div>
          </div>
        </n-card>

        <!-- Emergency Contact -->
        <n-card title="Emergency Contact">
          <div>
            <div class="text-sm text-gray-500 mb-1">Emergency Contact</div>
            <div>{{ employee.emergency_contact || 'N/A' }}</div>
          </div>
        </n-card>
      </div>
    </n-spin>
  </div>
</template>
