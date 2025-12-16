<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui'
import { NButton, NProgress, NTag } from 'naive-ui'
import { h } from 'vue'
import { api } from '@/utils/api'

definePageMeta({
  layout: 'default',
})

const message = useMessage()
const dialog = useDialog()

// State
const loading = ref(false)
const reports = ref<any[]>([])
const employees = ref<any[]>([])
const stats = ref<any>({
  summary: {},
  statusBreakdown: {},
  paymentBreakdown: {},
  departmentBreakdown: [],
  topEarners: [],
  monthlyTrend: [],
})

// Filters
const monthFilter = ref(new Date().getMonth() + 1)
const yearFilter = ref(new Date().getFullYear())
const departmentFilter = ref('all')
const statusFilter = ref('all')
const paymentStatusFilter = ref('all')

// Tab state
const activeTab = ref('reports')

// Pagination
const pagination = reactive({
  page: 1,
  pageSize: 10,
  pageCount: 1,
  total: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 30, 50],
  onChange: (page: number) => {
    pagination.page = page
    fetchReports()
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.page = 1
    fetchReports()
  },
})

// Get unique departments
const departments = computed(() => {
  return [...new Set(employees.value.map(e => e.department).filter(Boolean))]
})

// Month options
const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  label: `Month ${i + 1}`,
  value: i + 1,
}))

// Year options
const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  label: `${currentYear - 2 + i}`,
  value: currentYear - 2 + i,
}))

// Fetch employees
async function fetchEmployees() {
  try {
    const res = await api.get('/api/hr/employee', { params: { limit: 1000 } })
    if (res.status && res.data) {
      employees.value = Array.isArray(res.data) ? res.data : []
    }
  }
  catch (error) {
    console.error('Error fetching employees:', error)
  }
}

// Fetch salary reports
async function fetchReports() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      limit: pagination.pageSize,
      month: monthFilter.value,
      year: yearFilter.value,
    }

    if (departmentFilter.value !== 'all') {
      params.department = departmentFilter.value
    }
    if (statusFilter.value !== 'all') {
      params.status = statusFilter.value
    }
    if (paymentStatusFilter.value !== 'all') {
      params.payment_status = paymentStatusFilter.value
    }

    const res = await api.get('/api/hr/salary-report', { params })
    if (res.status && res.data) {
      reports.value = Array.isArray(res.data) ? res.data : []
      pagination.total = res.total || 0
      pagination.pageCount = Math.ceil(pagination.total / pagination.pageSize)
    }
    else {
      reports.value = []
    }
  }
  catch (error: any) {
    console.error('Error fetching reports:', error)
    message.error(error.message || 'Error loading reports')
  }
  finally {
    loading.value = false
  }
}

// Fetch statistics
async function fetchStats() {
  try {
    const res = await api.get('/api/hr/salary-report/stats', {
      params: {
        month: monthFilter.value,
        year: yearFilter.value,
        department: departmentFilter.value !== 'all' ? departmentFilter.value : undefined,
      },
    })
    if (res.status && res.data) {
      stats.value = res.data
    }
  }
  catch (error) {
    console.error('Error fetching stats:', error)
  }
}

// Watch filters
watch([monthFilter, yearFilter, departmentFilter, statusFilter, paymentStatusFilter], () => {
  pagination.page = 1
  fetchReports()
  fetchStats()
})

// Generate salary reports
const generating = ref(false)
async function generateReports(regenerate = false) {
  generating.value = true
  try {
    const res = await api.post('/api/hr/salary-report', {
      month: monthFilter.value,
      year: yearFilter.value,
      regenerate,
    })
    if (res.status) {
      message.success(res.message || 'Salary reports generated successfully')
      fetchReports()
      fetchStats()
    }
    else {
      message.error(res.message || 'Error generating reports')
    }
  }
  catch (error: any) {
    message.error(error.message || 'Error generating reports')
  }
  finally {
    generating.value = false
  }
}

// Approve salary report
async function approveReport(id: string, action: 'approve' | 'finalize') {
  loading.value = true
  try {
    const res = await api.post(`/api/hr/salary-report/${id}/approve`, { action })
    if (res.status) {
      message.success(res.message || `Report ${action}d successfully`)
      fetchReports()
      fetchStats()
    }
    else {
      message.error(res.message || `Error ${action}ing report`)
    }
  }
  catch (error: any) {
    message.error(error.message || `Error ${action}ing report`)
  }
  finally {
    loading.value = false
  }
}

// Mark as paid
async function markAsPaid(id: string) {
  dialog.info({
    title: 'Mark as Paid',
    content: 'Are you sure you want to mark this salary as paid?',
    positiveText: 'Confirm',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      loading.value = true
      try {
        const res = await api.post(`/api/hr/salary-report/${id}/pay`, {
          payment_method: 'bank_transfer',
          payment_date: new Date(),
        })
        if (res.status) {
          message.success('Payment recorded successfully')
          fetchReports()
          fetchStats()
        }
        else {
          message.error(res.message || 'Error recording payment')
        }
      }
      catch (error: any) {
        message.error(error.message || 'Error recording payment')
      }
      finally {
        loading.value = false
      }
    },
  })
}

// Delete report
async function deleteReport(id: string) {
  loading.value = true
  try {
    const res = await api.delete(`/api/hr/salary-report/${id}`)
    if (res.status) {
      message.success('Report deleted successfully')
      fetchReports()
      fetchStats()
    }
    else {
      message.error(res.message || 'Error deleting report')
    }
  }
  catch (error: any) {
    message.error(error.message || 'Error deleting report')
  }
  finally {
    loading.value = false
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

// Columns for reports table
const columns: DataTableColumns<any> = [
  {
    title: 'Employee',
    key: 'employee',
    width: 200,
    render: (row) => h('div', [
      h('div', { class: 'font-medium' }, row.employee?.full_name || 'N/A'),
      h('div', { class: 'text-xs text-gray-500' }, row.employee?.department || ''),
    ]),
  },
  {
    title: 'Basic Salary',
    key: 'basic_salary',
    width: 130,
    render: (row) => formatCurrency(row.basic_salary),
  },
  {
    title: 'Rewards',
    key: 'total_rewards',
    width: 120,
    render: (row) => h('span', { class: 'text-green-600' }, `+${formatCurrency(row.total_rewards)}`),
  },
  {
    title: 'Penalties',
    key: 'total_penalties',
    width: 120,
    render: (row) => h('span', { class: 'text-red-600' }, `-${formatCurrency(row.total_penalties)}`),
  },
  {
    title: 'Insurance',
    key: 'insurance',
    width: 120,
    render: (row) => h('span', { class: 'text-orange-600' }, `-${formatCurrency((row.social_insurance || 0) + (row.health_insurance || 0) + (row.unemployment_insurance || 0))}`),
  },
  {
    title: 'Net Salary',
    key: 'net_salary',
    width: 140,
    render: (row) => h('span', { class: 'font-bold text-blue-600' }, formatCurrency(row.net_salary)),
  },
  {
    title: 'Status',
    key: 'status',
    width: 110,
    render: (row) => {
      const statusMap: Record<string, any> = {
        draft: { type: 'default', label: 'Draft' },
        calculated: { type: 'warning', label: 'Calculated' },
        approved: { type: 'info', label: 'Approved' },
        finalized: { type: 'success', label: 'Finalized' },
      }
      const status = statusMap[row.status] || { type: 'default', label: row.status }
      return h(NTag, { type: status.type, size: 'small' }, { default: () => status.label })
    },
  },
  {
    title: 'Payment',
    key: 'payment_status',
    width: 100,
    render: (row) => {
      const statusMap: Record<string, any> = {
        pending: { type: 'warning', label: 'Pending' },
        processing: { type: 'info', label: 'Processing' },
        paid: { type: 'success', label: 'Paid' },
        cancelled: { type: 'error', label: 'Cancelled' },
      }
      const status = statusMap[row.payment_status] || { type: 'default', label: row.payment_status }
      return h(NTag, { type: status.type, size: 'small' }, { default: () => status.label })
    },
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 180,
    render: (row) => {
      const buttons = []

      if (row.status === 'calculated') {
        buttons.push(h(NButton, {
          size: 'small',
          class: 'mr-1',
          onClick: () => approveReport(row._id, 'approve'),
        }, { default: () => 'Approve' }))
      }

      if (row.status === 'approved') {
        buttons.push(h(NButton, {
          size: 'small',
          class: 'mr-1',
          onClick: () => approveReport(row._id, 'finalize'),
        }, { default: () => 'Finalize' }))
      }

      if (row.status === 'finalized' && row.payment_status !== 'paid') {
        buttons.push(h(NButton, {
          size: 'small',
          class: 'mr-1',
          onClick: () => markAsPaid(row._id),
        }, { default: () => '💰 Pay' }))
      }

      if (row.status !== 'finalized') {
        buttons.push(h(NButton, {
          size: 'small',
          onClick: () => {
            dialog.warning({
              title: 'Delete Report',
              content: 'Are you sure you want to delete this report?',
              positiveText: 'Delete',
              negativeText: 'Cancel',
              onPositiveClick: () => deleteReport(row._id),
            })
          },
        }, { default: () => '🗑️' }))
      }

      return h('div', { class: 'flex gap-1 flex-wrap' }, buttons)
    },
  },
]

// Initialize
onMounted(() => {
  fetchEmployees()
  fetchReports()
  fetchStats()
})
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold">
          Salary Statistics
        </h1>
        <p class="text-gray-500 dark:text-gray-400">
          Monthly salary reports and statistics
        </p>
      </div>

      <div class="flex gap-2">
        <n-button :loading="generating" @click="generateReports(false)">
          📊 Generate Reports
        </n-button>
        <n-button :loading="generating" @click="generateReports(true)">
          🔄 Regenerate
        </n-button>
      </div>
    </div>

    <!-- Period Selection -->
    <n-card class="mb-4">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <n-select v-model:value="monthFilter" :options="monthOptions" placeholder="Month" />
        <n-select v-model:value="yearFilter" :options="yearOptions" placeholder="Year" />
        <n-select
          v-model:value="departmentFilter"
          :options="[
            { label: 'All Departments', value: 'all' },
            ...departments.map(d => ({ label: d, value: d })),
          ]"
          placeholder="Department"
        />
        <n-select
          v-model:value="statusFilter"
          :options="[
            { label: 'All Status', value: 'all' },
            { label: 'Draft', value: 'draft' },
            { label: 'Calculated', value: 'calculated' },
            { label: 'Approved', value: 'approved' },
            { label: 'Finalized', value: 'finalized' },
          ]"
          placeholder="Status"
        />
        <n-select
          v-model:value="paymentStatusFilter"
          :options="[
            { label: 'All Payment', value: 'all' },
            { label: 'Pending', value: 'pending' },
            { label: 'Paid', value: 'paid' },
          ]"
          placeholder="Payment"
        />
      </div>
    </n-card>

    <!-- Tabs -->
    <n-tabs v-model:value="activeTab" type="line" class="mb-4">
      <n-tab-pane name="reports" tab="📋 Salary Reports">
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <n-card>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-700">
                {{ stats.summary?.totalEmployees || 0 }}
              </div>
              <div class="text-xs text-gray-500">
                Employees
              </div>
            </div>
          </n-card>
          <n-card>
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">
                {{ formatCurrency(stats.summary?.totalBasicSalary || 0) }}
              </div>
              <div class="text-xs text-gray-500">
                Total Basic
              </div>
            </div>
          </n-card>
          <n-card>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">
                {{ formatCurrency(stats.summary?.totalRewards || 0) }}
              </div>
              <div class="text-xs text-gray-500">
                Total Rewards
              </div>
            </div>
          </n-card>
          <n-card>
            <div class="text-center">
              <div class="text-2xl font-bold text-red-600">
                {{ formatCurrency(stats.summary?.totalPenalties || 0) }}
              </div>
              <div class="text-xs text-gray-500">
                Total Penalties
              </div>
            </div>
          </n-card>
          <n-card>
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600">
                {{ formatCurrency(stats.summary?.totalNetSalary || 0) }}
              </div>
              <div class="text-xs text-gray-500">
                Total Net Salary
              </div>
            </div>
          </n-card>
        </div>

        <!-- Reports Table -->
        <n-card title="Salary Reports">
          <n-data-table
            :columns="columns"
            :data="reports"
            :loading="loading"
            :row-key="(row: any) => row._id"
            :pagination="pagination"
          />
        </n-card>
      </n-tab-pane>

      <n-tab-pane name="statistics" tab="📈 Statistics">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Department Breakdown -->
          <n-card title="Department Breakdown">
            <div v-if="stats.departmentBreakdown?.length > 0" class="space-y-4">
              <div v-for="dept in stats.departmentBreakdown" :key="dept._id" class="border-b pb-3">
                <div class="flex justify-between items-center mb-2">
                  <span class="font-medium">{{ dept._id }}</span>
                  <span class="text-sm text-gray-500">{{ dept.employeeCount }} employees</span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span class="text-gray-500">Avg Salary:</span>
                    <span class="ml-2 font-semibold">{{ formatCurrency(dept.avgNetSalary) }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Total:</span>
                    <span class="ml-2 font-semibold text-blue-600">{{ formatCurrency(dept.totalNetSalary) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-gray-500 py-8">
              No data available
            </div>
          </n-card>

          <!-- Top Earners -->
          <n-card title="Top Earners">
            <div v-if="stats.topEarners?.length > 0" class="space-y-3">
              <div v-for="(earner, index) in stats.topEarners" :key="earner.employee?._id" class="flex items-center justify-between border-b pb-2">
                <div class="flex items-center gap-3">
                  <span
                    class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    :class="{
                      'bg-yellow-400 text-white': index === 0,
                      'bg-gray-300 text-gray-700': index === 1,
                      'bg-orange-400 text-white': index === 2,
                      'bg-gray-100 text-gray-600': index > 2,
                    }"
                  >
                    {{ index + 1 }}
                  </span>
                  <div>
                    <div class="font-medium">
                      {{ earner.employee?.full_name }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ earner.employee?.department }}
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-bold text-blue-600">
                    {{ formatCurrency(earner.net_salary) }}
                  </div>
                  <div class="text-xs">
                    <span class="text-green-600">+{{ formatCurrency(earner.total_rewards) }}</span>
                    <span class="text-red-600 ml-1">-{{ formatCurrency(earner.total_penalties) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-gray-500 py-8">
              No data available
            </div>
          </n-card>

          <!-- Payment Status -->
          <n-card title="Payment Status">
            <div class="space-y-4">
              <div v-if="stats.paymentBreakdown?.pending">
                <div class="flex justify-between mb-1">
                  <span>Pending</span>
                  <span class="text-yellow-600">{{ stats.paymentBreakdown.pending.count }} ({{ formatCurrency(stats.paymentBreakdown.pending.totalAmount) }})</span>
                </div>
                <n-progress
                  type="line"
                  :percentage="stats.summary?.totalEmployees ? (stats.paymentBreakdown.pending.count / stats.summary.totalEmployees * 100) : 0"
                  :color="'#eab308'"
                  :show-indicator="false"
                />
              </div>
              <div v-if="stats.paymentBreakdown?.paid">
                <div class="flex justify-between mb-1">
                  <span>Paid</span>
                  <span class="text-green-600">{{ stats.paymentBreakdown.paid.count }} ({{ formatCurrency(stats.paymentBreakdown.paid.totalAmount) }})</span>
                </div>
                <n-progress
                  type="line"
                  :percentage="stats.summary?.totalEmployees ? (stats.paymentBreakdown.paid.count / stats.summary.totalEmployees * 100) : 0"
                  :color="'#22c55e'"
                  :show-indicator="false"
                />
              </div>
            </div>
          </n-card>

          <!-- Monthly Trend -->
          <n-card title="Monthly Trend (Last 6 months)">
            <div v-if="stats.monthlyTrend?.length > 0" class="space-y-3">
              <div v-for="month in stats.monthlyTrend" :key="`${month.year}-${month.month}`" class="border-b pb-2">
                <div class="flex justify-between items-center">
                  <span class="font-medium">{{ month.month }}/{{ month.year }}</span>
                  <span class="text-blue-600 font-semibold">{{ formatCurrency(month.totalNetSalary) }}</span>
                </div>
                <div class="text-xs text-gray-500 flex gap-4">
                  <span>{{ month.employeeCount }} employees</span>
                  <span class="text-green-600">Rewards: {{ formatCurrency(month.totalRewards) }}</span>
                  <span class="text-red-600">Penalties: {{ formatCurrency(month.totalPenalties) }}</span>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-gray-500 py-8">
              No data available
            </div>
          </n-card>
        </div>
      </n-tab-pane>

      <n-tab-pane name="summary" tab="📊 Summary">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Earnings Breakdown -->
          <n-card title="💰 Earnings">
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600">Basic Salary</span>
                <span class="font-semibold">{{ formatCurrency(stats.summary?.totalBasicSalary || 0) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Overtime Pay</span>
                <span class="font-semibold">{{ formatCurrency(stats.summary?.totalOvertimePay || 0) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Allowances</span>
                <span class="font-semibold">{{ formatCurrency(stats.summary?.totalAllowances || 0) }}</span>
              </div>
              <div class="flex justify-between text-green-600">
                <span>Rewards</span>
                <span class="font-semibold">{{ formatCurrency(stats.summary?.totalRewards || 0) }}</span>
              </div>
              <div class="border-t pt-2 flex justify-between font-bold">
                <span>Gross Salary</span>
                <span class="text-blue-600">{{ formatCurrency(stats.summary?.totalGrossSalary || 0) }}</span>
              </div>
            </div>
          </n-card>

          <!-- Deductions Breakdown -->
          <n-card title="📉 Deductions">
            <div class="space-y-3">
              <div class="flex justify-between text-red-600">
                <span>Penalties</span>
                <span class="font-semibold">{{ formatCurrency(stats.summary?.totalPenalties || 0) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Social Insurance (8%)</span>
                <span class="font-semibold">{{ formatCurrency(stats.summary?.totalSocialInsurance || 0) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Health Insurance (1.5%)</span>
                <span class="font-semibold">{{ formatCurrency(stats.summary?.totalHealthInsurance || 0) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Unemployment Ins. (1%)</span>
                <span class="font-semibold">{{ formatCurrency(stats.summary?.totalUnemploymentInsurance || 0) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Personal Income Tax</span>
                <span class="font-semibold">{{ formatCurrency(stats.summary?.totalTax || 0) }}</span>
              </div>
              <div class="border-t pt-2 flex justify-between font-bold">
                <span>Total Deductions</span>
                <span class="text-red-600">{{ formatCurrency((stats.summary?.totalPenalties || 0) + (stats.summary?.totalInsurance || 0) + (stats.summary?.totalTax || 0) + (stats.summary?.totalDeductions || 0)) }}</span>
              </div>
            </div>
          </n-card>

          <!-- Net Summary -->
          <n-card title="💵 Net Salary Summary">
            <div class="space-y-4">
              <div class="text-center py-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                <div class="text-3xl font-bold text-blue-600">
                  {{ formatCurrency(stats.summary?.totalNetSalary || 0) }}
                </div>
                <div class="text-sm text-gray-500">
                  Total Net Salary
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div class="text-xl font-semibold">
                    {{ formatCurrency(stats.summary?.avgNetSalary || 0) }}
                  </div>
                  <div class="text-xs text-gray-500">
                    Average
                  </div>
                </div>
                <div class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div class="text-xl font-semibold">
                    {{ stats.summary?.totalEmployees || 0 }}
                  </div>
                  <div class="text-xs text-gray-500">
                    Employees
                  </div>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Max:</span>
                  <span class="font-semibold text-green-600">{{ formatCurrency(stats.summary?.maxNetSalary || 0) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Min:</span>
                  <span class="font-semibold text-orange-600">{{ formatCurrency(stats.summary?.minNetSalary || 0) }}</span>
                </div>
              </div>
            </div>
          </n-card>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>
