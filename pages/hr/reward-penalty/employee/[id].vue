<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui'
import { NTag, NButton, NStatistic, NCard } from 'naive-ui'
import { h } from 'vue'
import { api } from '@/utils/api'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const router = useRouter()
const message = useMessage()

const employeeId = route.params.id as string

// State
const loading = ref(false)
const employee = ref<any>(null)
const rewards = ref<any[]>([])
const penalties = ref<any[]>([])
const salaryReports = ref<any[]>([])

// Statistics
const stats = ref({
  totalRewards: 0,
  totalPenalties: 0,
  rewardCount: 0,
  penaltyCount: 0
})

// Fetch employee details
async function fetchEmployee() {
  try {
    const res = await api.get(`/api/hr/employee/${employeeId}`)
    if (res.status && res.data) {
      employee.value = res.data
    }
  } catch (error) {
    console.error('Error fetching employee:', error)
    message.error('Error loading employee data')
  }
}

// Fetch rewards and penalties
async function fetchRecords() {
  loading.value = true
  try {
    // Fetch rewards
    const rewardRes = await api.get('/api/hr/reward-penalty', {
      params: { employee: employeeId, type: 'reward', limit: 100 }
    })
    if (rewardRes.status) {
      rewards.value = rewardRes.data || []
    }

    // Fetch penalties
    const penaltyRes = await api.get('/api/hr/reward-penalty', {
      params: { employee: employeeId, type: 'penalty', limit: 100 }
    })
    if (penaltyRes.status) {
      penalties.value = penaltyRes.data || []
    }

    // Calculate stats
    stats.value.rewardCount = rewards.value.length
    stats.value.penaltyCount = penalties.value.length
    stats.value.totalRewards = rewards.value
      .filter(r => ['approved', 'applied'].includes(r.status))
      .reduce((sum, r) => sum + r.amount, 0)
    stats.value.totalPenalties = penalties.value
      .filter(p => ['approved', 'applied'].includes(p.status))
      .reduce((sum, p) => sum + p.amount, 0)
  } catch (error) {
    console.error('Error fetching records:', error)
  } finally {
    loading.value = false
  }
}

// Fetch salary reports
async function fetchSalaryReports() {
  try {
    const res = await api.get('/api/hr/salary-report', {
      params: { employee: employeeId, limit: 12 }
    })
    if (res.status) {
      salaryReports.value = res.data || []
    }
  } catch (error) {
    console.error('Error fetching salary reports:', error)
  }
}

// Format currency
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount || 0)
}

// Format date
function formatDate(date: string) {
  return new Date(date).toLocaleDateString('vi-VN')
}

// Reward categories labels
const categoryLabels: Record<string, string> = {
  'performance_bonus': 'Performance Bonus',
  'attendance_bonus': 'Attendance Bonus',
  'project_completion': 'Project Completion',
  'innovation_award': 'Innovation Award',
  'sales_commission': 'Sales Commission',
  'referral_bonus': 'Referral Bonus',
  'annual_bonus': 'Annual Bonus',
  'holiday_bonus': 'Holiday Bonus',
  'recognition_award': 'Recognition Award',
  'overtime_bonus': 'Overtime Bonus',
  'other_reward': 'Other Reward',
  'late_arrival': 'Late Arrival',
  'early_leave': 'Early Leave',
  'absent_without_leave': 'Absent Without Leave',
  'policy_violation': 'Policy Violation',
  'misconduct': 'Misconduct',
  'performance_issue': 'Performance Issue',
  'dress_code': 'Dress Code Violation',
  'safety_violation': 'Safety Violation',
  'property_damage': 'Property Damage',
  'confidentiality_breach': 'Confidentiality Breach',
  'other_penalty': 'Other Penalty'
}

// Reward columns
const rewardColumns: DataTableColumns<any> = [
  {
    title: 'Date',
    key: 'effective_date',
    width: 100,
    render: row => formatDate(row.effective_date)
  },
  {
    title: 'Category',
    key: 'category',
    width: 150,
    render: row => categoryLabels[row.category] || row.category
  },
  {
    title: 'Title',
    key: 'title',
    ellipsis: { tooltip: true }
  },
  {
    title: 'Amount',
    key: 'amount',
    width: 120,
    render: row => h('span', { class: 'font-semibold text-green-600' }, `+${formatCurrency(row.amount)}`)
  },
  {
    title: 'Status',
    key: 'status',
    width: 100,
    render: row => {
      const statusMap: Record<string, any> = {
        pending: { type: 'warning', label: 'Pending' },
        approved: { type: 'success', label: 'Approved' },
        rejected: { type: 'error', label: 'Rejected' },
        applied: { type: 'info', label: 'Applied' }
      }
      const status = statusMap[row.status] || { type: 'default', label: row.status }
      return h(NTag, { type: status.type, size: 'small' }, { default: () => status.label })
    }
  }
]

// Penalty columns
const penaltyColumns: DataTableColumns<any> = [
  {
    title: 'Date',
    key: 'effective_date',
    width: 100,
    render: row => formatDate(row.effective_date)
  },
  {
    title: 'Category',
    key: 'category',
    width: 150,
    render: row => categoryLabels[row.category] || row.category
  },
  {
    title: 'Title',
    key: 'title',
    ellipsis: { tooltip: true }
  },
  {
    title: 'Amount',
    key: 'amount',
    width: 120,
    render: row => h('span', { class: 'font-semibold text-red-600' }, `-${formatCurrency(row.amount)}`)
  },
  {
    title: 'Status',
    key: 'status',
    width: 100,
    render: row => {
      const statusMap: Record<string, any> = {
        pending: { type: 'warning', label: 'Pending' },
        approved: { type: 'success', label: 'Approved' },
        rejected: { type: 'error', label: 'Rejected' },
        applied: { type: 'info', label: 'Applied' }
      }
      const status = statusMap[row.status] || { type: 'default', label: row.status }
      return h(NTag, { type: status.type, size: 'small' }, { default: () => status.label })
    }
  }
]

// Salary report columns
const salaryColumns: DataTableColumns<any> = [
  {
    title: 'Period',
    key: 'period',
    width: 100,
    render: row => `${row.month}/${row.year}`
  },
  {
    title: 'Basic',
    key: 'basic_salary',
    width: 120,
    render: row => formatCurrency(row.basic_salary)
  },
  {
    title: 'Rewards',
    key: 'total_rewards',
    width: 110,
    render: row => h('span', { class: 'text-green-600' }, `+${formatCurrency(row.total_rewards)}`)
  },
  {
    title: 'Penalties',
    key: 'total_penalties',
    width: 110,
    render: row => h('span', { class: 'text-red-600' }, `-${formatCurrency(row.total_penalties)}`)
  },
  {
    title: 'Net Salary',
    key: 'net_salary',
    width: 130,
    render: row => h('span', { class: 'font-bold text-blue-600' }, formatCurrency(row.net_salary))
  },
  {
    title: 'Status',
    key: 'payment_status',
    width: 100,
    render: row => {
      const statusMap: Record<string, any> = {
        pending: { type: 'warning', label: 'Pending' },
        paid: { type: 'success', label: 'Paid' }
      }
      const status = statusMap[row.payment_status] || { type: 'default', label: row.payment_status }
      return h(NTag, { type: status.type, size: 'small' }, { default: () => status.label })
    }
  }
]

onMounted(() => {
  fetchEmployee()
  fetchRecords()
  fetchSalaryReports()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex justify-between items-center mb-4">
      <div class="flex items-center gap-4">
        <n-button quaternary @click="router.back()">
          ← Back
        </n-button>
        <div v-if="employee">
          <h1 class="text-2xl font-bold">
            {{ employee.full_name }}
          </h1>
          <p class="text-gray-500">
            {{ employee.designation }} - {{ employee.department }}
          </p>
        </div>
      </div>
      <n-button type="primary" @click="router.push('/hr/reward-penalty')">
        Manage All Records
      </n-button>
    </div>

    <!-- Employee Info Card -->
    <n-card v-if="employee" class="mb-4">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <div class="text-sm text-gray-500">Email</div>
          <div class="font-medium">{{ employee.email }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500">Phone</div>
          <div class="font-medium">{{ employee.phone }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500">Basic Salary</div>
          <div class="font-medium text-blue-600">{{ formatCurrency(employee.salary_basic) }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500">Join Date</div>
          <div class="font-medium">{{ formatDate(employee.date_of_joining) }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500">Status</div>
          <n-tag :type="employee.status === 'active' ? 'success' : 'warning'" size="small">
            {{ employee.status }}
          </n-tag>
        </div>
      </div>
    </n-card>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      <n-card>
        <n-statistic label="Total Rewards" :value="stats.rewardCount">
          <template #suffix>
            <span class="text-sm text-gray-500">records</span>
          </template>
        </n-statistic>
        <div class="text-green-600 font-bold mt-2">{{ formatCurrency(stats.totalRewards) }}</div>
      </n-card>
      <n-card>
        <n-statistic label="Total Penalties" :value="stats.penaltyCount">
          <template #suffix>
            <span class="text-sm text-gray-500">records</span>
          </template>
        </n-statistic>
        <div class="text-red-600 font-bold mt-2">{{ formatCurrency(stats.totalPenalties) }}</div>
      </n-card>
      <n-card>
        <n-statistic label="Net Bonus" :value="formatCurrency(stats.totalRewards - stats.totalPenalties)" />
      </n-card>
      <n-card>
        <n-statistic label="Salary Reports" :value="salaryReports.length">
          <template #suffix>
            <span class="text-sm text-gray-500">months</span>
          </template>
        </n-statistic>
      </n-card>
    </div>

    <!-- Tabs for different sections -->
    <n-tabs type="line">
      <n-tab-pane name="rewards" tab="🎁 Rewards">
        <n-card title="Reward History">
          <n-data-table 
            :columns="rewardColumns" 
            :data="rewards" 
            :loading="loading"
            :row-key="(row: any) => row._id"
          />
        </n-card>
      </n-tab-pane>

      <n-tab-pane name="penalties" tab="⚠️ Penalties">
        <n-card title="Penalty History">
          <n-data-table 
            :columns="penaltyColumns" 
            :data="penalties" 
            :loading="loading"
            :row-key="(row: any) => row._id"
          />
        </n-card>
      </n-tab-pane>

      <n-tab-pane name="salary" tab="💰 Salary History">
        <n-card title="Monthly Salary Reports">
          <n-data-table 
            :columns="salaryColumns" 
            :data="salaryReports" 
            :loading="loading"
            :row-key="(row: any) => row._id"
          />
        </n-card>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>
